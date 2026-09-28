"""Connect collection-wide native geometry and height coverage to exact variants."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
from build_battlefield_assembly import ATLAS, EVIDENCE, ROOT, canonical, connect, normalize, rows


def assemble(collection, heights):
    collection = collection.resolve()
    if not collection.is_relative_to((ROOT/'work').resolve()) or collection == (ROOT/'work').resolve():
        raise ValueError('Build below work/')
    audit = json.loads(subprocess.check_output(['node', str(ROOT/'scripts/audit-battlefield-discovery.mjs')], cwd=ROOT))
    if audit['status'] != 'passed':
        raise ValueError('Source/atlas audit failed')
    database = collection / 'assets.sqlite'
    with sqlite3.connect(database) as db:
        assets = {p: json.loads(value) for p, value in db.execute('SELECT path,record_json FROM assets')}
        layouts = {}
        for path, asset in assets.items():
            if asset['status'] == 'decoded_tile_membership':
                specification = path.rsplit('/', 1)[0]
                # Grid membership is more explicit when both encodings exist.
                if specification not in layouts or path.endswith('.index'):
                    layouts[specification] = asset['layout']
        height_rows = json.loads((heights / 'index.json').read_bytes())
        height_by_tile = {r['source_path'].rsplit('/', 1)[0]: r for r in height_rows}
        with sqlite3.connect(ATLAS.as_uri() + '?mode=ro', uri=True) as atlas:
            atlas.row_factory = sqlite3.Row
            maps = {r['battle_map_key']: dict(r) for r in atlas.execute('select * from battle_maps')}
            relations = [dict(r) for r in atlas.execute('select * from battle_group_maps order by battle_group_key,battle_map_key,catchment_name,tile_upgrades')]
        labels = {r['key']: r['text'] for r in rows(EVIDENCE / 'xml-probe/text/db/battles__.loc.tsv')}
        source_rows = rows(EVIDENCE / 'field-probe/db/battles_tables/data__.tsv')
        inventory = set(json.loads((EVIDENCE / 'discovery/paths-terrain.json').read_bytes()))
        db.executescript('''DROP TABLE IF EXISTS variants; DROP TABLE IF EXISTS metadata;
          CREATE TABLE variants(variant_key TEXT PRIMARY KEY, atlas_map_key TEXT UNIQUE NOT NULL,
            battle_key TEXT UNIQUE NOT NULL,label TEXT,specification TEXT NOT NULL,
            singleplayer INTEGER NOT NULL,multiplayer INTEGER NOT NULL,released INTEGER NOT NULL,packet_json TEXT NOT NULL);
          CREATE INDEX variant_label ON variants(label); CREATE INDEX variant_specification ON variants(specification);
          CREATE TABLE metadata(key TEXT PRIMARY KEY,value_json TEXT NOT NULL);''')
        unavailable = set()
        for path in (EVIDENCE/'collection-source').rglob('missing-source-paths.json'):
            unavailable.update(json.loads(path.read_bytes()))
        procedural_by_tile = {}
        alternates_by_tile = {}
        for path in sorted(assets):
            if path.endswith('_procedural_bmd_data.bin'):
                procedural_by_tile.setdefault(path.rsplit('/',1)[0], []).append(path)
            elif path.endswith('_layer_bmd_data.bin'):
                alternates_by_tile.setdefault(path.rsplit('/',1)[0], []).append(path)
        coverage = []
        for row in sorted(source_rows, key=lambda r:r['key']):
            packet = connect(row, maps, relations, layouts, inventory, {'assets': []})
            specification = packet['specification']
            tiles = sorted({normalize(p['tile_path_raw']) for p in (packet['tile_membership'] or {}).get('placements', [])})
            selected = {specification + '/tile_map.bmd'}
            if not packet['tile_upgrade']:
                for tile in tiles:
                    selected.update(tile + '/' + name for name in ('bmd_data.bin', 'bmd_nogo_data.bin'))
                    if packet['catchment_name']:
                        selected.add(tile + '/' + packet['catchment_name'] + '_layer_bmd_data.bin')
            else:
                selected = set()  # No unqualified effective layer inheritance.
            # Dependency graph closure preserves source instances; transforms remain native.
            pending = list(selected)
            while pending:
                path = pending.pop()
                for instance in assets.get(path, {}).get('prefab_instances', []):
                    child = normalize(instance['key'])
                    if child and child not in selected:
                        selected.add(child)
                        pending.append(child)
            references = []
            for path in sorted(selected):
                asset = assets.get(path)
                references.append({'source_path': path, 'status': asset['status'] if asset else
                                   'not_extracted' if path in inventory else 'source_absent_from_merged_inventory' if path in unavailable or path.startswith('terrain/') else 'dependency_source_unresolved',
                                   'native_artifact': asset.get('native_artifact') if asset else None,
                                   'source_sha256': asset.get('source_sha256') if asset else None})
            terrain = [] if packet['tile_upgrade'] else [height_by_tile[t] for t in tiles if t in height_by_tile]
            packet['schema_version'] = 2
            packet['selection_label'] = labels.get('battles_localised_name_' + row['key'])
            packet['source_assets'] = references
            packet['unselected_procedural_assets'] = [
                {'source_path': p, 'status': assets[p]['status'], 'native_artifact': assets[p].get('native_artifact'),
                 'binding_status': 'available_tile_layer_runtime_selection_unresolved'}
                for tile in tiles for p in procedural_by_tile.get(tile, [])
            ] if not packet['tile_upgrade'] else []
            packet['unselected_alternate_layers'] = [
                {'source_path': p, 'status': assets[p]['status'], 'native_artifact': assets[p].get('native_artifact'),
                 'binding_status': 'available_source_layer_not_selected_for_this_variant'}
                for tile in tiles for p in alternates_by_tile.get(tile, []) if p not in selected
            ] if not packet['tile_upgrade'] else []
            layout_paths = [specification+'/tile_map.index', specification+'/tile_list.bin']
            packet['layout_source_assets'] = [{'source_path': p, 'status': assets[p]['status'],
                                               'error': assets[p].get('error')} for p in layout_paths if p in assets]
            packet['tile_membership_status'] = ('decoded' if packet['tile_membership'] else
                'unsupported_or_failed' if packet['layout_source_assets'] else
                'not_extracted' if any(p in inventory for p in layout_paths) else 'source_absent_from_merged_inventory')
            packet['terrain_evidence'] = {'rasters': terrain, 'status': 'native_raster_evidence' if any(r['status']=='decoded_full_native_raster' for r in terrain) else 'unsupported_or_missing',
                                           'effective_world_alignment_verified': False,
                                           'missing_tile_sources': [] if packet['tile_upgrade'] else [t+'/tile_height_map.compressed_map' for t in tiles if t not in height_by_tile]}
            decoded = sum(r['status'] == 'decoded_native_geometry' for r in references)
            packet['status'] = 'tile_upgrade_assembly_unresolved' if packet['tile_upgrade'] else 'native_evidence_available' if decoded else 'geometry_unresolved'
            packet['verification'] = {'structural': 'supported_decodes_checked_failures_enumerated', 'visual': 'not_performed', 'live': 'not_performed'}
            packet['missing_or_unresolved'] = ['World-coordinate composition and engine layer selection',
                'Effective deployment and side assignment', 'Navigation/collision/concealment semantics',
                'Visual and live verification']
            # Empty inherited prototype fields do not describe collection coverage.
            packet.pop('connected_source_layers', None)
            report = {'battle_key': row['key'], 'variant_key': packet['variant_key'], 'specification': specification,
                      'tile_upgrade': packet['tile_upgrade'], 'tile_membership_status': packet['tile_membership_status'],
                      'missing_height_sources': packet['terrain_evidence']['missing_tile_sources'], 'tile_paths': len(tiles), 'native_geometry_assets': decoded, 'procedural_layers': len(packet['unselected_procedural_assets']),
                      'unselected_alternate_layers': len(packet['unselected_alternate_layers']),
                      'height_rasters': len(terrain), 'decoded_height_rasters': sum(r['status']=='decoded_full_native_raster' for r in terrain),
                      'unresolved_assets': [r for r in references if r['status'] != 'decoded_native_geometry']}
            coverage.append(report)
            db.execute('INSERT INTO variants VALUES(?,?,?,?,?,?,?,?,?)', (packet['variant_key'], packet['atlas_map_key'], row['key'], packet['selection_label'],
                specification, int(row['singleplayer']=='true'), int(row['multiplayer']=='true'), int(row['release']=='true'), canonical(packet)))
        families = {}
        for path, asset in assets.items():
            if path.startswith('terrain/tiles/battle/'):
                families.setdefault(path.split('/')[3], Counter())[asset['status']] += 1
        manifest = {'schema_version': 2, 'status': 'native_collection_world_alignment_unverified',
                    'atlas_sha256': hashlib.sha256(ATLAS.read_bytes()).hexdigest(), 'variant_records': len(coverage),
                    'variants_with_native_geometry': sum(r['native_geometry_assets'] > 0 for r in coverage),
                    'variants_with_decoded_height': sum(r['decoded_height_rasters'] > 0 for r in coverage),
                    'decoded_layouts': len(layouts), 'tile_asset_family_count': len(families), 'source_family_coverage': 'source-family-coverage.json', 'asset_status_counts': dict(Counter(r['status'] for r in assets.values())),
                    'height_status_counts': dict(Counter(r['status'] for r in height_rows)),
                    'effective_world_layouts': 0, 'source_snapshot': next(iter(assets.values()))['source_snapshot'],
                    'native_artifact_normalization': json.loads((collection/'decode-summary.json').read_bytes()).get('artifact_normalization'),
                    'height_artifacts': 'height/', 'native_artifacts': 'native/',
                    'native_artifact_storage': 'Generated on demand from retained collection-source archives; see query_battlefield_native.py',
                    'observed_playable_maps': None, 'visual_verification': 'not_performed', 'live_verification': 'not_performed',
                    'height_overviews': 'Native sample subsets; full-resolution decoding is verified but arrays are rebuilt on demand.'}
        db.execute('INSERT INTO metadata VALUES(?,?)', ('manifest', canonical(manifest)))
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Collection integrity failure')
    db.close()
    (collection/'source-family-coverage.json').write_text(json.dumps({k:dict(v) for k,v in sorted(families.items())},indent=2)+'\n')
    (collection / 'variant-coverage.json').write_text(json.dumps(coverage, indent=2) + '\n')
    (collection / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps(manifest, indent=2))


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection', required=True, type=Path)
    p.add_argument('--heights', required=True, type=Path)
    args = p.parse_args()
    assemble(args.collection, args.heights)
