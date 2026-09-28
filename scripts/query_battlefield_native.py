"""Decode one retained source asset, optionally returning one native section.

The collection index contains boundaries, instances, counts and artifact hashes.
Large expanded scene JSON is rebuilt on demand from the committed source archives.
"""
import argparse
import json
from pathlib import Path
import subprocess
import tempfile
from build_battlefield_collection import source_index, source_bytes, ROOT


def native_asset(source, asset, decoder, section=None):
    records = source_index(source)
    if asset not in records:
        raise ValueError('Exact source asset is not retained: ' + asset)
    raw = source_bytes(records[asset])
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / 'source.bmd'
        path.write_bytes(raw)
        result = subprocess.run([str(decoder.resolve()), str(path)], capture_output=True, timeout=120)
    if result.returncode:
        raise ValueError(result.stderr.decode(errors='replace').strip())
    decoded = json.loads(result.stdout)
    if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != len(raw):
        raise ValueError('Nonexact source roundtrip')
    if section:
        if section not in decoded['bmd']:
            raise ValueError('Unknown native section: ' + section)
        decoded['bmd'] = {section: decoded['bmd'][section]}
    return {'source_path': asset, 'source_sha256': records[asset]['sha256'],
            'world_alignment_verified': False, **decoded}


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--source', type=Path, default=ROOT/'docs/development/battlefields/collection-source')
    p.add_argument('--asset', required=True)
    p.add_argument('--decoder', type=Path, required=True)
    p.add_argument('--section')
    a = p.parse_args()
    print(json.dumps(native_asset(a.source, a.asset, a.decoder, a.section), ensure_ascii=False, indent=2))
