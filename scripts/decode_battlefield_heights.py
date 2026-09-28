"""Decode every extracted native height raster with resumable per-file evidence.

Commit compact native-sample overviews; full-resolution arrays can be emitted
on demand from the hash-verified source using --full-resolution.
"""
import argparse
from concurrent.futures import ProcessPoolExecutor
import hashlib
import json
import math
from pathlib import Path
import numpy as np
from battlefield_height import decode_height


def worker(args):
    folder, item, destination, full = args
    destination = Path(destination)
    key = item['sha256']
    checkpoint = destination / (key + '.json')
    decoder_hash = hashlib.sha256(Path(__file__).with_name('battlefield_height.py').read_bytes()).hexdigest()
    if checkpoint.exists() and (not full or (destination / (key + '-full.npz')).exists()):
        cached = json.loads(checkpoint.read_bytes())
        if cached.get('decoder_sha256') == decoder_hash:
            return dict(cached, source_path=item['path'])
    record = {'source_path': item['path'], 'source_sha256': key, 'source_bytes': item['bytes'],
              'world_alignment_verified': False, 'world_units': None, 'decoder_sha256': decoder_hash}
    raw = (Path(folder) / item['path']).read_bytes()
    if hashlib.sha256(raw).hexdigest() != key or len(raw) != item['bytes']:
        raise ValueError('Height source hash mismatch')
    try:
        raster, metadata = decode_height(raw)
        step = max(1, math.ceil(max(raster.shape) / 256))
        sampled = raster[::step, ::step]
        artifact = destination / (key + '.npz')
        np.savez_compressed(artifact, native_samples=sampled)
        record.update(status='decoded_full_native_raster', metadata=metadata,
                      overview={'artifact': artifact.name, 'shape': list(sampled.shape),
                                'sample_stride': step, 'source_row_origin': 0, 'source_column_origin': 0,
                                'method': 'regular_native_sample_subset_no_averaging',
                                'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest()},
                      full_resolution_artifact='rebuild_from_verified_source')
        if full:
            np.savez_compressed(destination / (key + '-full.npz'), native_samples=raster)
            record['full_resolution_artifact'] = key + '-full.npz'
    except ValueError as error:
        record.update(status='unsupported_or_failed', error=str(error))
    checkpoint.write_text(json.dumps(record, sort_keys=True, indent=2) + '\n')
    return record


def build(source, destination, jobs, full):
    destination.mkdir(parents=True, exist_ok=True)
    items = []
    for p in sorted(source.glob('*/probe_manifest.json')):
        manifest = json.loads(p.read_bytes())
        items.extend((str(p.parent), r, str(destination), full) for r in manifest['files']
                     if r['path'].endswith('/tile_height_map.compressed_map'))
    # Decode unique content once; expand path aliases after processing.
    unique = {item[1]['sha256']: item for item in items}
    records = []
    with ProcessPoolExecutor(max_workers=jobs) as pool:
        for record in pool.map(worker, unique.values(), chunksize=1):
            records.append(record)
            if len(records) % 20 == 0:
                print(len(records), '/', len(items), record['status'], flush=True)
    by_hash = {r['source_sha256']: r for r in records}
    records = [dict(by_hash[item[1]['sha256']], source_path=item[1]['path']) for item in items]
    (destination / 'index.json').write_text(json.dumps(sorted(records, key=lambda r:r['source_path']), indent=2) + '\n')
    print('Completed', len(records), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--jobs', type=int, default=4)
    parser.add_argument('--full-resolution', action='store_true')
    args = parser.parse_args()
    build(args.source, args.output, args.jobs, args.full_resolution)
