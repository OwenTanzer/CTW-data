"""Remove upstream-generated editor IDs from cached native scene artifacts.

CaptureLocation.id is initialized randomly for editor export, never read from
or written to the supported binary versions. This migration changes JSON only;
the original exact-roundtrip decoder fingerprint stays attached to each asset.
"""
import argparse
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
from build_battlefield_collection import ROOT, canonical

VERSION='omit_generated_capture_editor_ids_v1'


def normalize(collection):
    if not collection.resolve().is_relative_to((ROOT/'work').resolve()):
        raise ValueError('Normalize a work/ candidate')
    db=sqlite3.connect(collection/'assets.sqlite')
    candidates=db.execute("SELECT DISTINCT json_extract(record_json,'$.native_artifact') FROM assets WHERE json_extract(record_json,'$.status')='decoded_native_geometry' AND json_extract(record_json,'$.sections.capture_location_set.capture_location_sets')>0 AND json_extract(record_json,'$.artifact_normalization') IS NULL").fetchall()
    aliases={}
    for path,artifact in db.execute("SELECT path,json_extract(record_json,'$.native_artifact') FROM assets WHERE json_extract(record_json,'$.status')='decoded_native_geometry'"):
        aliases.setdefault(artifact,[]).append(path)
    changed=0
    for index,(artifact,) in enumerate(candidates):
        path=collection/artifact
        native=json.loads(gzip.decompress(path.read_bytes()))
        for group in native['capture_location_set']['capture_location_sets']:
            for location in group['capture_locations']:
                if 'id' in location:
                    del location['id']; changed+=1
        raw=gzip.compress(canonical(native).encode(),compresslevel=3,mtime=0)
        temporary=path.with_suffix('.normalizing')
        temporary.write_bytes(raw)
        temporary.replace(path)
        digest=hashlib.sha256(raw).hexdigest()
        rows=[db.execute('SELECT path,record_json FROM assets WHERE path=?',(source,)).fetchone() for source in aliases[artifact]]
        for source,record in rows:
            record=json.loads(record)
            record['native_sha256']=digest
            record['artifact_normalization']=VERSION
            db.execute('UPDATE assets SET record_json=? WHERE path=?',(canonical(record),source))
        if index%20==0:
            db.commit()
            print(index,'/',len(candidates),'normalized',flush=True)
    db.commit()
    db.close()
    summary=json.loads((collection/'decode-summary.json').read_bytes())
    summary['artifact_normalization']=VERSION
    (collection/'decode-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('Normalized capture-location artifacts:',len(candidates),'; generated IDs removed:',changed,flush=True)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection',required=True,type=Path)
    normalize(p.parse_args().collection)
