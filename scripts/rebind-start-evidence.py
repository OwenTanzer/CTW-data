"""Reuse unchanged startpos evidence only after exact geographic dependency checks.
This creates a work candidate; it never edits source evidence in place.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import sqlite3


def sha(data): return hashlib.sha256(data).hexdigest()


def rebind(source, prior, atlas, output):
    source, prior, atlas, output = map(Path, (source, prior, atlas, output))
    if output.exists(): raise ValueError('Output must be a fresh work directory')
    if 'work' not in output.resolve().parts: raise ValueError('Use a work candidate')
    manifest = json.loads((source/'source_manifest.json').read_text())
    for name, expected in manifest['files'].items():
        if sha((source/name).read_bytes()) != expected: raise ValueError('Changed raw evidence '+name)
    old, new = sqlite3.connect(prior), sqlite3.connect(atlas)
    # These are all relations and assets consumed by the starts builder. Compare
    # every column/row, not just controls or counts. Prior may be enriched.
    tables = ('campaigns','factions','provinces','regions','map_assets','region_points')
    verified = {}
    for table in tables:
        a = old.execute('SELECT * FROM '+table).fetchall()
        b = new.execute('SELECT * FROM '+table).fetchall()
        if sorted(a,key=repr) != sorted(b,key=repr): raise ValueError('Changed starts dependency '+table)
        verified[table] = dict(rows=len(a),sha256=sha(repr(sorted(a,key=repr)).encode()))
    old.close(); new.close()
    shutil.copytree(source,output)
    manifest['atlas_rebind'] = dict(reason='9.0 active victory-objective repair; geographic/startpos evidence unchanged',
        original_extraction_atlas_sha256=manifest['atlas_sha256'], compared_prior_atlas_sha256=sha(prior.read_bytes()),
        dependency_checks=verified, unchanged_source_files=manifest['files'])
    manifest['atlas_sha256'] = sha(atlas.read_bytes())
    (output/'source_manifest.json').write_text(json.dumps(manifest,indent=2,sort_keys=True)+'\n')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for key in ('source','prior','atlas','output'): p.add_argument('--'+key,required=True)
    rebind(**vars(p.parse_args()))
