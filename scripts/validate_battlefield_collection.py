"""Validate collection coverage, retained artifacts and exact-variant isolation."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sqlite3
import numpy as np
from build_battlefield_collection import source_index
from build_battlefield_assembly import EVIDENCE, normalize, variant_id


def validate(collection, heights, source):
    sources = source_index(source)
    absent = set()
    for path in source.rglob('missing-source-paths.json'):
        absent.update(json.loads(path.read_bytes()))
    with sqlite3.connect(collection/'assets.sqlite') as db:
        if db.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise ValueError('SQLite integrity failure')
        assets = dict(db.execute("SELECT path,json_extract(record_json,'$.status') FROM assets"))
    expected = {p for p in sources if p.endswith(('.bmd','bmd_data.bin','bmd_nogo_data.bin','tile_map.index','tile_list.bin'))}
    assert set(assets) == expected, 'Unattempted or stale assets'
    artifacts = set()
    unknown_dependencies = set()
    for path, raw_record in db.execute('SELECT path,record_json FROM assets'):
        asset=json.loads(raw_record)
        assert asset['source_sha256'] == sources[path]['sha256'], path
        assert asset['world_alignment_verified'] is False, path
        if asset['status'] == 'decoded_native_geometry':
            assert asset['roundtrip_byte_equal'], path
            artifact = collection / asset['native_artifact']
            if artifact not in artifacts:
                raw = artifact.read_bytes()
                assert hashlib.sha256(raw).hexdigest() == asset['native_sha256'], path
                artifacts.add(artifact)
            for instance in asset['prefab_instances']:
                dependency = normalize(instance['key'])
                if dependency and dependency not in assets and dependency not in absent:
                    unknown_dependencies.add(dependency)
        elif asset['status'] == 'unsupported_or_failed':
            assert asset['error'], path
        else:
            assert asset['status'] == 'decoded_tile_membership', path
    assert not unknown_dependencies, 'Unattempted dependencies: ' + repr(sorted(unknown_dependencies)[:20])
    height_rows = json.loads((heights/'index.json').read_bytes())
    height_sources = {}
    for path in (heights/'source-manifests').glob('*.json'):
        height_sources.update({r['path']: r for r in json.loads(path.read_bytes())['files']})
    discovered = set(json.loads((EVIDENCE/'discovery/paths-terrain.json').read_bytes()))
    required = {p for p in discovered if p.endswith(('.bmd','bmd_data.bin','bmd_nogo_data.bin','tile_map.index','tile_list.bin'))}
    assert required <= set(sources), 'Unextracted discovered assets: ' + repr(sorted(required-set(sources))[:20])
    expected_heights = {p for p in discovered if p.endswith('/tile_height_map.compressed_map')}
    assert {r['source_path'] for r in height_rows} == expected_heights == set(height_sources)
    checked_heights = set()
    for row in height_rows:
        assert row['source_sha256'] == height_sources[row['source_path']]['sha256']
        if row['status'] != 'decoded_full_native_raster':
            assert row['error']
            continue
        assert row['metadata']['roundtrip_byte_equal']
        overview = row['overview']
        artifact = heights / overview['artifact']
        if artifact not in checked_heights:
            assert hashlib.sha256(artifact.read_bytes()).hexdigest() == overview['sha256']
            with np.load(artifact, allow_pickle=False) as data:
                raster = data['native_samples']
                assert raster.dtype == np.dtype('uint16') and list(raster.shape) == overview['shape']
                assert raster.min() >= row['metadata']['sample_min'] and raster.max() <= row['metadata']['sample_max']
            checked_heights.add(artifact)
    packet_count=0
    for raw_packet, in db.execute('SELECT packet_json FROM variants'):
        packet=json.loads(raw_packet)
        packet_count+=1
        assert packet['variant_key'] == variant_id(packet['atlas_map_key'], packet['catchment_name'], packet['tile_upgrade'])
        assert packet['tile_membership_status'] != 'not_extracted'
        assert packet['verification']['visual'] == packet['verification']['live'] == 'not_performed'
        if packet['tile_upgrade']:
            assert not packet['source_assets'] and not packet['terrain_evidence']['rasters'] and not packet['unselected_procedural_assets'] and not packet['unselected_alternate_layers']
        else:
            tiles = {normalize(p['tile_path_raw']) for p in (packet['tile_membership'] or {}).get('placements',[])}
            assert all(r['source_path'].rsplit('/',1)[0] in tiles for r in packet['terrain_evidence']['rasters'])
        for reference in packet['source_assets']:
            assert reference['status'] != 'not_extracted', reference
            if reference['source_path'] in assets:
                assert reference['status'] == assets[reference['source_path']]
    report = {'status':'passed', 'assets_checked':len(assets), 'native_artifacts_checked':len(artifacts),
              'asset_statuses':dict(Counter(assets.values())),
              'height_paths_checked':len(height_rows), 'height_overviews_checked':len(checked_heights),
              'configured_variants_checked':packet_count, 'known_absent_dependencies':len(absent),
              'unattempted_dependencies':0, 'world_alignment_verified':False,
              'visual_verification':'not_performed', 'live_verification':'not_performed'}
    db.close()
    (collection/'validation.json').write_text(json.dumps(report,indent=2)+'\n')
    return report


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection',required=True,type=Path)
    p.add_argument('--heights',required=True,type=Path)
    p.add_argument('--source',default=EVIDENCE/'collection-source',type=Path)
    a=p.parse_args()
    print(json.dumps(validate(a.collection,a.heights,a.source),indent=2))
