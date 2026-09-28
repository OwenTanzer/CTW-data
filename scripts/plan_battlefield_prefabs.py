"""List unattempted prefab dependencies for the next bounded extraction pass."""
import argparse
import json
from pathlib import Path
import sqlite3
from build_battlefield_collection import ROOT, source_index
from build_battlefield_assembly import normalize


def plan(collection, source):
    retained = set(source_index(source))
    absent = set()
    for path in source.rglob('missing-source-paths.json'):
        absent.update(json.loads(path.read_bytes()))
    with sqlite3.connect(collection/'assets.sqlite') as db:
        referenced = {normalize(i['key']) for r, in db.execute('SELECT record_json FROM assets')
                      for i in json.loads(r).get('prefab_instances', []) if i['key']}
    db.close()
    return sorted(referenced-retained-absent)


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection',required=True,type=Path)
    p.add_argument('--source',default=ROOT/'docs/development/battlefields/collection-source',type=Path)
    p.add_argument('--output',required=True,type=Path)
    a=p.parse_args()
    if not a.output.resolve().is_relative_to((ROOT/'work').resolve()):
        raise ValueError('Write requests below work/')
    paths=plan(a.collection,a.source)
    a.output.write_text(json.dumps(paths,indent=2)+'\n')
    print('Unattempted dependencies:',len(paths))
