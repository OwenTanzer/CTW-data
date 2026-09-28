"""Retry resource-interrupted scene decodes one at a time, preserving checkpoints."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import sqlite3
from build_battlefield_collection import ROOT, canonical, decode_asset, source_index


def retry(collection, source, decoder):
    if not collection.resolve().is_relative_to((ROOT/'work').resolve()):
        raise ValueError('Retry a work/ candidate')
    records=source_index(source)
    with sqlite3.connect(collection/'assets.sqlite') as db:
        rows=[(p,h,json.loads(r)) for p,h,r in db.execute("SELECT path,decoder_hash,record_json FROM assets WHERE json_extract(record_json,'$.status')='unsupported_or_failed'")]
    db.close()
    # This is the same complete decoder fingerprint used by the collection pass.
    fingerprint=hashlib.sha256(decoder.read_bytes()+b''.join((ROOT/'scripts'/name).read_bytes()
        for name in ('build_battlefield_collection.py','battlefield_tiles.py','battlefield_tile_list.py','build_battlefield_deployment.py'))).hexdigest()
    count=0
    for path,previous,record in rows:
        error=record.get('error')
        if record['status']!='unsupported_or_failed' or not (error=='' or 'timed out after' in error):
            continue
        if previous!=fingerprint:
            raise ValueError('Decoder changed; rerun the collection builder first')
        result=decode_asset((path,records[path],{},decoder.resolve(),collection/'native'))
        if result.get('error')=='':
            result['error']='Decoder exited without diagnostic output during isolated retry; resource/decoder failure unresolved'
        with sqlite3.connect(collection/'assets.sqlite') as db:
            db.execute('UPDATE assets SET record_json=? WHERE path=?',(canonical(result),path))
        db.close()
        count+=1
        print(path,result['status'],flush=True)
    with sqlite3.connect(collection/'assets.sqlite') as db:
        statuses=Counter()
        failures=Counter()
        for status,error in db.execute("SELECT json_extract(record_json,'$.status'),json_extract(record_json,'$.error') FROM assets"):
            statuses[status]+=1
            if error is not None: failures[error.split('; byte_offset=')[0]]+=1
    db.close()
    summary=json.loads((collection/'decode-summary.json').read_bytes())
    summary['statuses']=dict(statuses)
    summary['failures']=dict(failures)
    (collection/'decode-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print('Isolated retries:',count)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection',required=True,type=Path)
    p.add_argument('--source',default=ROOT/'docs/development/battlefields/collection-source',type=Path)
    p.add_argument('--decoder',required=True,type=Path)
    a=p.parse_args()
    retry(a.collection,a.source,a.decoder)
