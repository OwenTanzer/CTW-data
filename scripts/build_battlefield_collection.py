"""Decode a verified battlefield collection in resumable, per-asset steps.

Native geometry is retained in compressed JSON artifacts. No world transforms
or runtime terrain semantics are inferred by this collection pass.
"""
import argparse
from collections import Counter
from concurrent.futures import ProcessPoolExecutor
import gzip
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import tempfile
import zipfile

from battlefield_tiles import decode_tiles
from battlefield_tile_list import decode_tile_list
from build_battlefield_deployment import boundaries

ROOT = Path(__file__).resolve().parents[1]


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False)


def source_index(source):
    records = {}
    for listing in sorted(source.rglob('archives.json')):
        for item in json.loads(listing.read_bytes()):
            archive = listing.parent / item['archive']
            if hashlib.sha256(archive.read_bytes()).hexdigest() != item['sha256']:
                raise ValueError('Archive hash mismatch: ' + str(archive))
            with zipfile.ZipFile(archive) as z:
                manifest = json.loads(z.read('probe_manifest.json'))
                for entry in manifest['files']:
                    key = entry['path']
                    if key in records and records[key]['sha256'] != entry['sha256']:
                        raise ValueError('Conflicting source: ' + key)
                    records[key] = dict(entry, archive=str(archive), snapshot=manifest['snapshot'])
    return records


def source_bytes(record):
    with zipfile.ZipFile(record['archive']) as z:
        data = z.read(record['path'])
    if len(data) != record['bytes'] or hashlib.sha256(data).hexdigest() != record['sha256']:
        raise ValueError('Source hash mismatch: ' + record['path'])
    return data


def decode_asset(args):
    key, item, records, decoder, native = args
    result = {'path': key, 'source_sha256': item['sha256'], 'source_bytes': item['bytes'],
              'source_snapshot': item['snapshot'], 'world_alignment_verified': False}
    data = source_bytes(item)
    try:
        if key.endswith('tile_list.bin'):
            result.update(status='decoded_tile_membership', layout=decode_tile_list(data))
        elif key.endswith('tile_map.index'):
            tiles = records.get(key[:-5] + 'tiles')
            if not tiles:
                raise ValueError('Missing tile_map.tiles companion')
            decoded = decode_tiles(data, source_bytes(tiles), allow_irregular=True)
            result.update(status='decoded_tile_membership', layout=decoded)
        else:
            with tempfile.TemporaryDirectory() as directory:
                path = Path(directory) / 'source.bmd'
                path.write_bytes(data)
                proc = subprocess.run([str(decoder), str(path)], capture_output=True, timeout=45)
            if proc.returncode:
                raise ValueError(proc.stderr.decode(errors='replace').strip())
            decoded = json.loads(proc.stdout)
            if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != len(data):
                raise ValueError('Nonexact binary roundtrip')
            bmd = decoded['bmd']
            artifact = native / (item['sha256'] + '.json.gz')
            encoded = gzip.compress(canonical(bmd).encode(), compresslevel=3, mtime=0)
            temporary = artifact.with_suffix(".tmp-" + str(os.getpid()))
            temporary.write_bytes(encoded)
            temporary.replace(artifact)
            result.update(status='decoded_native_geometry', roundtrip_byte_equal=True,
                          native_artifact='native/' + artifact.name,
                          native_sha256=hashlib.sha256(artifact.read_bytes()).hexdigest(),
                          playable_area=bmd['playable_area'], boundaries=boundaries(bmd),
                          prefab_instances=bmd['prefab_instance_list']['prefab_instances'],
                          sections={k: {a: len(v) for a, v in value.items() if isinstance(v, list)}
                                    for k, value in bmd.items() if isinstance(value, dict)})
    except (ValueError, KeyError, UnicodeError, subprocess.TimeoutExpired) as error:
        result.update(status='unsupported_or_failed', error=str(error))
    return result


def decode_collection(source, decoder, output):
    if not output.resolve().is_relative_to((ROOT / 'work').resolve()):
        raise ValueError('Build below work/')
    output.mkdir(parents=True, exist_ok=True)
    native = output / 'native'
    native.mkdir(exist_ok=True)
    records = source_index(source)
    decoder_hash = hashlib.sha256(decoder.read_bytes() + b''.join((ROOT / 'scripts' / name).read_bytes() for name in ('build_battlefield_collection.py', 'battlefield_tiles.py', 'battlefield_tile_list.py', 'build_battlefield_deployment.py'))).hexdigest()
    db = sqlite3.connect(output / 'assets.sqlite')
    db.execute('CREATE TABLE IF NOT EXISTS assets(path TEXT PRIMARY KEY, source_hash TEXT NOT NULL, decoder_hash TEXT NOT NULL, record_json TEXT NOT NULL)')
    pending = []
    for key, item in sorted(records.items()):
        if not (key.endswith('.bmd') or key.endswith('bmd_data.bin') or key.endswith('bmd_nogo_data.bin') or key.endswith('tile_map.index') or key.endswith('tile_list.bin')):
            continue
        prior = db.execute('SELECT source_hash,decoder_hash FROM assets WHERE path=?', (key,)).fetchone()
        if prior == (item['sha256'], decoder_hash) and not key.endswith('tile_map.index'):
            continue
        companions = {key[:-5] + 'tiles': records[key[:-5] + 'tiles']} if key.endswith('.index') and key[:-5] + 'tiles' in records else {}
        pending.append((key, item, companions, decoder, native))
    db.close()
    with ProcessPoolExecutor(max_workers=2) as pool:
        for index, result in enumerate(pool.map(decode_asset, pending, chunksize=1)):
            with sqlite3.connect(output / 'assets.sqlite') as db:
                db.execute('INSERT OR REPLACE INTO assets VALUES(?,?,?,?)',
                           (result['path'], result['source_sha256'], decoder_hash, canonical(result)))
            db.close()
            if index % 50 == 0:
                print(index, '/', len(pending), result['path'], result['status'], flush=True)
    db = sqlite3.connect(output / 'assets.sqlite')
    results = [json.loads(r[0]) for r in db.execute('SELECT record_json FROM assets ORDER BY path')]
    summary = {'source_files': len(records), 'processed_assets': len(results),
               'statuses': dict(Counter(r['status'] for r in results)),
               'failures': dict(Counter(r['error'].split('; byte_offset=')[0] for r in results if 'error' in r)),
               'decoder_sha256': decoder_hash, 'world_alignment_verified': False}
    (output / 'decode-summary.json').write_text(json.dumps(summary, indent=2) + '\n')
    db.close()
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', required=True, type=Path)
    parser.add_argument('--decoder', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    decode_collection(args.source.resolve(), args.decoder.resolve(), args.output.resolve())
