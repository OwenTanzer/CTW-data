"""Build a development map-selection → source-evidence connection database.

No packet claims effective world geometry or observed menu availability.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import sqlite3
import subprocess
from build_battlefield_deployment import build as build_deployment, ROOT, EVIDENCE
from battlefield_tiles import decode_tiles
from build_battlefield_terrain import build as build_terrain

ATLAS = ROOT / 'data/campaign_map/campaign_atlas__wh3__9.0.gpkg'


def rows(path):
    with path.open(encoding='utf-8', newline='') as stream:
        return [r for r in csv.DictReader(stream, delimiter='\t') if not r['key'].startswith('#')]


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def normalize(path):
    return path.replace('\\', '/').rstrip('/')


def variant_id(map_key, catchment, upgrade):
    identity = [map_key, catchment or None, upgrade or None]
    return 'battlefield-v1:' + hashlib.sha256(canonical(identity).encode()).hexdigest()


def connect(row, atlas_maps, relations, layouts, terrain_paths, deployment):
    key = 'battle:' + row['key']
    atlas = atlas_maps.get(key)
    if atlas is None or atlas['source_kind'] != 'battles_tables':
        raise ValueError('Missing atlas battle identity: ' + key)
    if (atlas['map_location'] != row['specification'] or
        atlas['catchment_name'] != (row['catchment_name'] or None) or
        atlas['tile_upgrade'] != (row['tile_upgrade'] or None) or atlas['battle_type'] != row['type']):
        raise ValueError('Atlas/source selector mismatch: ' + key)
    specification = normalize(row['specification'])
    catchment = row['catchment_name'] or None
    upgrade = row['tile_upgrade'] or None
    matched_relations = []
    for relation in relations:
        target = atlas_maps[relation['battle_map_key']]
        if (target['map_location'] == row['specification'] and
            relation['catchment_name'] == catchment and relation['tile_upgrades'] == upgrade):
            matched_relations.append(relation)
    layout = layouts.get(specification)
    candidates, resolved = [], []
    if layout and catchment and not upgrade:
        for placement in layout['placements']:
            candidate = normalize(placement['tile_path_raw']) + '/' + catchment + '_layer_bmd_data.bin'
            if candidate in terrain_paths:
                candidates.append({'source_asset': candidate, 'tile_placement': placement,
                                   'binding_method': 'exact_tile_path_and_catchment_filename',
                                   'engine_layer_selection_verified': False})
                asset = next((a for a in deployment['assets'] if a['source_asset'] == candidate), None)
                if asset:
                    projected = [i for i in deployment['instances'] if i['parent_asset'] == candidate]
                    prefab_keys = {i['prefab_asset'] for i in projected}
                    resolved.append({'asset': asset, 'prefab_instances': projected,
                                     'prefab_assets': [a for a in deployment['assets'] if a['source_asset'] in prefab_keys]})
    decoded_layers = sum(x['asset']['status'] == 'decoded_asset_only' for x in resolved)
    status = ('tile_upgrade_assembly_unresolved' if upgrade else
              'source_layers_connected_world_assembly_unresolved' if decoded_layers else
              'connected_layers_decoder_failed' if resolved else
              'catchment_layers_not_decoded' if candidates else 'layout_or_layer_binding_unresolved')
    return {'schema_version': 1, 'variant_key': variant_id(key, catchment, upgrade),
            'atlas_map_key': key, 'battle_key': row['key'], 'battle_type': row['type'],
            'specification': specification, 'catchment_name': catchment, 'tile_upgrade': upgrade,
            'configured_availability': {k: row[k] == 'true' for k in ('release', 'singleplayer', 'multiplayer')},
            'menu_availability_verified': False, 'status': status,
            'atlas_relations': matched_relations,
            'relation_join_method': 'exact_map_location_catchment_and_tile_upgrade',
            'tile_membership': layout,
            'candidate_catchment_layers': candidates, 'connected_source_layers': resolved,
            'effective_geometry': {'status': 'unresolved', 'coordinate_frame': None},
            'missing_or_unresolved': ['World-coordinate tile composition', 'Effective deployment and side assignment',
                                     'Height/terrain decoding and alignment', 'Navigation/collision/concealment semantics',
                                     'Structured qualitative feature relations', 'Visual and live verification']}


def build(decoder, output):
    output = output.resolve()
    if not output.is_relative_to((ROOT / 'work').resolve()) or output == (ROOT / 'work').resolve():
        raise ValueError('Candidate output must be below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty candidate output')
    audit = json.loads(subprocess.check_output(['node', str(ROOT / 'scripts/audit-battlefield-discovery.mjs')], cwd=ROOT))
    if audit['status'] != 'passed':
        raise ValueError('Source/atlas audit failed')
    deployment = build_deployment(decoder, output / 'deployment')
    terrain = build_terrain(decoder, output / 'terrain')
    layouts = {}
    for probe, name in [('field-probe', 'chs_wastes_coast_a'), ('composition-probe', 'def_plains_infield_a')]:
        asset_path = 'terrain/battles/' + name
        path = EVIDENCE / probe / asset_path
        layouts[asset_path] = decode_tiles((path / 'tile_map.index').read_bytes(), (path / 'tile_map.tiles').read_bytes())
    source_rows = rows(EVIDENCE / 'field-probe/db/battles_tables/data__.tsv')
    labels = {r['key']: r['text'] for r in rows(EVIDENCE / 'xml-probe/text/db/battles__.loc.tsv')}
    terrain_paths = set(json.loads((EVIDENCE / 'discovery/paths-terrain.json').read_bytes()))
    with sqlite3.connect(ATLAS.as_uri() + '?mode=ro', uri=True) as atlas:
        atlas.row_factory = sqlite3.Row
        atlas_maps = {r['battle_map_key']: dict(r) for r in atlas.execute('select * from battle_maps')}
        relations = [dict(r) for r in atlas.execute('select * from battle_group_maps order by battle_group_key,battle_map_key,catchment_name,tile_upgrades')]
    db_path = output / 'battlefield_connections.sqlite'
    with sqlite3.connect(db_path) as db:
        db.executescript('''
        PRAGMA foreign_keys=ON;
        CREATE TABLE variants(variant_key TEXT PRIMARY KEY, atlas_map_key TEXT UNIQUE NOT NULL,
          battle_key TEXT UNIQUE NOT NULL, label TEXT, specification TEXT NOT NULL,
          singleplayer INTEGER NOT NULL, multiplayer INTEGER NOT NULL, released INTEGER NOT NULL,
          packet_json TEXT NOT NULL CHECK(json_valid(packet_json)));
        CREATE INDEX variant_label ON variants(label);
        CREATE INDEX variant_specification ON variants(specification);
        CREATE TABLE metadata(key TEXT PRIMARY KEY, value_json TEXT NOT NULL CHECK(json_valid(value_json)));
        ''')
        connected = decoded_connections = 0
        for row in sorted(source_rows, key=lambda r: r['key']):
            packet = connect(row, atlas_maps, relations, layouts, terrain_paths, deployment)
            tile_paths = {normalize(p['tile_path_raw']) for p in (packet['tile_membership'] or {}).get('placements', [])}
            terrain_rasters = [] if packet['tile_upgrade'] else [r for r in terrain['rasters'] if r['source_path'].split('/', 1)[1].rsplit('/', 1)[0] in tile_paths]
            packet['terrain_evidence'] = {'status': 'native_samples_with_conditional_alignment' if terrain_rasters else 'not_decoded',
                                         'rasters': terrain_rasters, 'effective_world_alignment_verified': False}
            if terrain_rasters:
                packet['terrain_evidence']['assembly_hypothesis'] = terrain['assembly_hypothesis']
                packet['terrain_evidence']['conditional_mosaic'] = terrain['mosaic']
                packet['terrain_evidence']['mosaic_artifact'] = 'terrain/conditional-height-mosaic.npy'
                packet['terrain_evidence']['coverage_mask_artifact'] = 'terrain/coverage-mask.npy'
            packet['selection_label'] = labels.get('battles_localised_name_' + row['key'])
            connected += bool(packet['connected_source_layers'])
            decoded_connections += packet['status'] == 'source_layers_connected_world_assembly_unresolved'
            db.execute('insert into variants values(?,?,?,?,?,?,?,?,?)',
                       (packet['variant_key'], packet['atlas_map_key'], row['key'], packet['selection_label'],
                        packet['specification'], int(row['singleplayer'] == 'true'), int(row['multiplayer'] == 'true'),
                        int(row['release'] == 'true'), canonical(packet)))
        manifest = {'schema_version': 1, 'status': 'development_source_connections_not_effective_battlefields',
                    'atlas_sha256': hashlib.sha256(ATLAS.read_bytes()).hexdigest(),
                    'source_snapshot': json.loads((EVIDENCE / 'prefab-probe/probe_manifest.json').read_bytes())['snapshot'], 'variant_records': len(source_rows),
                    'variants_with_connected_source_layers': connected,
                    'variants_with_decoded_source_layers': decoded_connections,
                    'decoded_height_rasters': len(terrain['rasters']),
                    'decoded_tile_layouts': len(layouts), 'effective_world_layouts': 0,
                    'identity_method': 'sha256 of canonical [atlas_map_key,catchment_name,tile_upgrade], version 1',
                    'source_evidence': 'docs/development/battlefields/*-probe/probe_manifest.json'}
        db.execute('insert into metadata values(?,?)', ('manifest', canonical(manifest)))
        if db.execute('pragma integrity_check').fetchone()[0] != 'ok':
            raise ValueError('Connection database integrity failure')
    manifest['database_sha256'] = hashlib.sha256(db_path.read_bytes()).hexdigest()
    (output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    return manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoder', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.decoder, args.output), indent=2))
