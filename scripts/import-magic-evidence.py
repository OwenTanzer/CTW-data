"""Install only the archived relations needed by the magic increment into a work candidate."""
import argparse
import shutil
from pathlib import Path
from magic.common import *

def run(archive,output):
 archive=Path(archive).resolve();output=Path(output).resolve()
 if not output.is_relative_to(ROOT/'work') or output.exists():raise ValueError('Use a fresh work directory')
 m=read_json(archive/'source_manifest.json')
 if digest(archive/'source_manifest.json')!=ARCHIVE_HASH:raise ValueError('Unaudited foundation manifest')
 for k,v in SNAPSHOT.items():
  if str(m[k])!=v:raise ValueError('Snapshot mismatch')
 expected={f['path']:f for f in m['files']};schema=read_json(archive/'decoded_schema.json')
 for owner,specs in [('unit_stats/abilities',{k:v for k,v in SHARED.items() if 'abilities/' in v[2]}),('effect_semantics',BINDINGS)]:
  dest=output/owner/'source_exports';dest.mkdir(parents=True)
  tables=[s[0] for s in specs.values()]
  for table in tables:
   files=[f for f in m['files'] if f['path'].startswith('db/'+table+'/')]
   if not files:raise ValueError('Missing archived table '+table)
   for f in files:
    src=archive/f['path']
    if digest(src)!=f['sha256'] or src.stat().st_size!=f['bytes']:raise ValueError('Archive hash mismatch '+f['path'])
    target=dest/f['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,target)
  write_json(dest/'decoded_schema.json',{t:schema[t] for t in tables})
  files=[dict(path=p.relative_to(dest).as_posix(),sha256=digest(p),bytes=p.stat().st_size) for p in sorted(dest.rglob('*')) if p.is_file()]
  write_json(dest/'source_manifest.json',dict(**SNAPSHOT,source_kind='verified subset of archived read-only vanilla extraction',archive_commit=ARCHIVE_COMMIT,archive_manifest_sha256=ARCHIVE_HASH,table_folders_requested=tables,files=files))
  verify_subset(dest)
 # Inventory retains missing incoming relations from the pinned packed-path list.
 d=read_json(archive/'discovery.json')
 if digest(archive/'discovery.json')!=expected['discovery.json']['sha256']:raise ValueError('Discovery integrity')
 inventory=sorted({p.split('/')[1] for p in d['db_paths'] if any(s in p for s in ('abilit','vortex','bombard','winds_of_magic'))})
 write_json(output/'magic/source_relation_inventory.json',dict(snapshot=SNAPSHOT,archive_commit=ARCHIVE_COMMIT,packed_tables=inventory,missing=[dict(table=t,purpose=p,status='packed_in_8.1.1_but_not_archived') for t,p in MISSING.items()],fresh_extraction_blocker=dict(observed_executable='9.0.0.0',observed_build='25507028',checked_utc='2026-09-26',required=SNAPSHOT),note='Inventory is evidence discovery, not a spell/lore classification; incoming schema closure remains incomplete.'))
 print('Verified selective source installation:',output)
if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('archive');p.add_argument('output');a=p.parse_args();run(a.archive,a.output)
