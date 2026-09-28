"""Prepare a validated, compact collection for review under a work/ directory."""
import argparse
from collections import Counter
import gzip
import hashlib
import json
from pathlib import Path
import shutil
import sqlite3
from build_battlefield_collection import ROOT


def publish(collection, output):
    if not output.resolve().is_relative_to((ROOT/'work').resolve()) or output.resolve()==(ROOT/'work').resolve():
        raise ValueError('Prepare publication below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty publication directory')
    validation=json.loads((collection/'validation.json').read_bytes())
    if validation['status']!='passed':
        raise ValueError('Collection validation must pass first')
    output.mkdir(parents=True,exist_ok=True)
    database=output/'assets.sqlite'
    with sqlite3.connect(collection/'assets.sqlite') as source, sqlite3.connect(database) as target:
        for table in ('assets','variants','metadata'):
            ddl,=source.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name=?",(table,)).fetchone()
            target.execute(ddl)
            cursor=source.execute('SELECT * FROM '+table+' ORDER BY 1')
            count=len(cursor.description)
            def indexed_rows():
                for row in cursor:
                    if table=='assets':
                        row=list(row)
                        record=json.loads(row[3])
                        if 'prefab_instances' in record:
                            instances=record.pop('prefab_instances')
                            dependencies=Counter(i['key'] for i in instances)
                            record['prefab_instance_count']=len(instances)
                            record['prefab_dependencies']=[{'key':k,'instances':v} for k,v in sorted(dependencies.items())]
                            record['instance_details']='query_battlefield_native.py --section prefab_instance_list'
                            row[3]=json.dumps(record,sort_keys=True,separators=(',',':'),ensure_ascii=False)
                    yield row
            target.executemany('INSERT INTO '+table+' VALUES('+','.join('?'*count)+')',indexed_rows())
        for ddl, in source.execute("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name"):
            target.execute(ddl)
        target.commit()
        assert target.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
    source.close()
    target.close()
    raw_digest=hashlib.sha256()
    raw_bytes=database.stat().st_size
    with database.open('rb') as stream, (output/'assets.sqlite.gz').open('wb') as destination:
        with gzip.GzipFile(filename='',mode='wb',fileobj=destination,compresslevel=9,mtime=0) as compressed:
            while block:=stream.read(1024*1024):
                raw_digest.update(block)
                compressed.write(block)
    database.unlink()
    compressed=output/'assets.sqlite.gz'
    manifest=json.loads((collection/'manifest.json').read_bytes())
    manifest['indexed_prefabs']='Dependency counts; complete native instance records remain available through query_battlefield_native.py'
    manifest.update(database_sha256=raw_digest.hexdigest(),database_bytes=raw_bytes,
                    compressed_database_sha256=hashlib.sha256(compressed.read_bytes()).hexdigest(),
                    compressed_database_bytes=compressed.stat().st_size)
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (output/'variant-coverage.json.gz').write_bytes(gzip.compress((collection/'variant-coverage.json').read_bytes(),compresslevel=9,mtime=0))
    for name in ('decode-summary.json','validation.json','source-family-coverage.json'):
        shutil.copyfile(collection/name,output/name)
    schema={'schema_version':2,'variant_identity_version':1,
            'tables':{'assets':{'primary_key':'path','payload':'record_json','purpose':'All attempted native sources, hashes, boundaries, dependency counts, errors'},
                      'variants':{'primary_key':'variant_key','payload':'packet_json','selectors':['atlas_map_key','battle_key','label','specification']},
                      'metadata':{'primary_key':'key','payload':'value_json'}},
            'coordinates':'Native source values; world axes/origin/units not certified',
            'missingness':'Absent source, decoder failure, unselected layer and unverified geometry are separate statuses',
            'native_artifacts':'Generated under work/native from retained archives; hashes recorded in asset rows',
            'height_artifacts':'height/*.npz native sample subsets; stride and full-resolution hash in height/index.json',
            'integer_safety':'Preserve native uint64 values with an integer-safe JSON reader',
            'unknown_fields':'Raw bytes retained without semantic interpretation'}
    (output/'schema.json').write_text(json.dumps(schema,indent=2)+'\n')
    print(json.dumps(manifest,indent=2))


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--collection',required=True,type=Path)
    p.add_argument('--output',required=True,type=Path)
    a=p.parse_args()
    publish(a.collection,a.output)
