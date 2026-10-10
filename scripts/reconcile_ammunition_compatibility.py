"""Generate an exact reviewed ammunition migration; never reset the payload baseline."""
import argparse
import csv
import io
import json
from pathlib import Path
import shutil
import subprocess
from magic_pipeline import ROOT, readj, writej, digest
from magic_audit import fingerprint
BEFORE='3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196'
AFTER='2b5965e78c85dc795451dad188756a173b247be5'
WEAPONS='data/unit_stats/lookups/unit_weapon_links__wh3__9.0__ultra.csv'
MIGRATION='scripts/ammunition_compatibility_migration.json'
def historical(ref,path):
 return subprocess.check_output(['git','show',ref+':'+path],cwd=ROOT)
def rows(raw):return list(csv.DictReader(io.StringIO(raw.decode())))
def generate():
 baseline=readj(ROOT/'scripts/magic_payload_baseline.json')
 columns=baseline['files'][WEAPONS]['columns']
 before=rows(historical(BEFORE,WEAPONS));after=rows(historical(AFTER,WEAPONS))
 if len(before)!=len(after):raise ValueError('Weapon row count changed')
 transitions=[]
 for old,new in zip(before,after):
  changed={k for k in old if old[k]!=new[k]}
  if not changed:continue
  if not changed<= {'ammunition_pool','ammunition'}:raise ValueError('Unreviewed weapon change')
  transitions.append({'identity':{k:new[k] for k in ['unit_key','component_role','slot','missile_weapon_key','projectile_key']},
   'before':{k:old[k] for k in ['ammunition_pool','ammunition']},
   'after':{k:new[k] for k in ['ammunition_pool','ammunition']},
   'before_fingerprint':fingerprint({c:old[c] for c in columns}),
   'after_fingerprint':fingerprint({c:new[c] for c in columns})})
 if len(transitions)!=255:raise ValueError('Expected 255 reviewed weapon changes')
 rosters=[]
 for faction in ['norsca','nurgle','skaven']:
  path=f'data/unit_stats/normalized/{faction}__wh3__9.0__ultra.csv'
  old=rows(historical(BEFORE,path));new=rows(historical(AFTER,path))
  if len(old)!=len(new):raise ValueError('Roster count changed')
  for x,y in zip(old,new):
   changed={k for k in x if x[k]!=y[k]}
   if not changed:continue
   if changed!={'ammunition'}:raise ValueError('Unreviewed roster change')
   rosters.append({'path':path,'unit_key':y['unit_key'],'before':x['ammunition'],'after':y['ammunition']})
 if len(rosters)!=6:raise ValueError('Expected six reviewed roster changes')
 return {'schema_version':1,'baseline_commit':baseline['commit'],'before_commit':BEFORE,'reviewed_source_commit':AFTER,
  'path':WEAPONS,'allowed_columns':['ammunition_pool','ammunition'],'transitions':transitions,'roster_changes':rosters}
def main():
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
 if a.output.resolve()==ROOT:raise ValueError('Use a candidate output directory')
 migration=generate();writej(a.output/MIGRATION,migration)
 # Copy the generated owner inventory, as in the existing magic mutation harness.
 manifest=json.loads(historical(AFTER,'data/magic/output_manifest.json'))
 for rel in manifest:
  target=a.output/rel;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/rel,target)
 from magic_audit import baseline_check
 writej(a.output/'data/magic/payload_baseline_comparison.json',baseline_check(a.output,migration=migration))
 refreshed={rel:digest(a.output/rel) for rel in manifest}
 changed={rel for rel in manifest if manifest[rel]!=refreshed[rel]}
 allowed={WEAPONS,'data/unit_stats/dataset_manifest.json','data/magic/payload_baseline_comparison.json',*[r['path'] for r in migration['roster_changes']]}
 if changed!=allowed:raise ValueError('Unexpected changed artifacts: '+str(changed^allowed))
 writej(a.output/'data/magic/output_manifest.json',refreshed)
 print(json.dumps({'weapon_changes':255,'roster_changes':6,'refreshed_artifacts':sorted(changed)}))
if __name__=='__main__':main()
