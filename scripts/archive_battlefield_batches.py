"""Package verified extraction batches without incomplete attempts or timestamps."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile


def archive(source, destination):
    plan = json.loads((source / 'plan.json').read_bytes())
    destination.mkdir(parents=True, exist_ok=True)
    inventory = []
    for start in range(0, len(plan['paths']), plan['batchSize']):
        key = str(start // plan['batchSize']).zfill(5)
        result = json.loads((source / (key + '-result.json')).read_bytes())
        folder = Path(result['target'])
        manifest = json.loads((folder / 'probe_manifest.json').read_bytes())
        expected = plan['paths'][start:start + plan['batchSize']]
        if manifest['request']['paths'] != expected:
            raise ValueError('Batch does not match extraction plan')
        target = destination / (key + '.zip')
        with zipfile.ZipFile(target, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for item in manifest['files']:
                p = (folder / item['path']).resolve()
                if not p.is_relative_to(folder.resolve()):
                    raise ValueError('Unsafe source path')
                raw = p.read_bytes()
                if len(raw) != item['bytes'] or hashlib.sha256(raw).hexdigest() != item['sha256']:
                    raise ValueError('Source hash mismatch')
                z.writestr(zipfile.ZipInfo(item['path']), raw, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
            z.writestr(zipfile.ZipInfo('probe_manifest.json'), json.dumps(manifest, sort_keys=True).encode(), compress_type=zipfile.ZIP_DEFLATED)
        inventory.append({'archive': target.name, 'bytes': target.stat().st_size,
                          'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
                          'source_files': len(manifest['files'])})
    (destination / 'archives.json').write_text(json.dumps(inventory, indent=2) + '\n')
    print(json.dumps({'archives': len(inventory), 'files': sum(x['source_files'] for x in inventory),
                      'bytes': sum(x['bytes'] for x in inventory)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    archive(args.source, args.destination)
