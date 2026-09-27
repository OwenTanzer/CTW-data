"""Bounded source/production checks; does not infer effect-target membership."""
import csv, json, hashlib
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
hashes={}
def read(p,tsv=False):
 p=ROOT/p; b=p.read_bytes(); hashes[str(p.relative_to(ROOT))]=hashlib.sha256(b).hexdigest()
 lines=b.decode('utf-8-sig').splitlines()
 return list(csv.DictReader((s for s in lines if not tsv or not s.startswith('#')),delimiter='\t' if tsv else ',',quoting=csv.QUOTE_NONE if tsv else csv.QUOTE_MINIMAL))
def canon(x):return str(float(x))
source=read('data/skill_trees/source_exports/db/character_skill_level_to_effects_junctions_tables/data__.tsv',True)
by_skill={}
for r in source:by_skill.setdefault(r['character_skill_key'],[]).append((r['effect_key'],r['level'],r['effect_scope'],canon(r['value'])))
results=[]
for name in ['dark_elves/Rakarth','greenskins/Grom_the_Paunch','high_elves/Prince']:
 rows=read('data/skill_trees/characters/'+name+'.csv'); nodes=[r for r in rows if r['record_type']=='node']; errors=[]; checked=0
 for n in nodes:
  actual=Counter((r['effect_key'],r['skill_level'],r['effect_scope'],canon(r['effect_value'])) for r in rows if r['record_type']=='effect' and r['node_set_key']==n['node_set_key'] and r['node_key']==n['node_key'])
  expected=Counter(by_skill.get(n['skill_key'],[])); checked+=sum(expected.values())
  if actual!=expected: errors.append({'node':n['node_key'],'set':n['node_set_key']})
 result={'character':name,'nodes':len(nodes),'effect_occurrences':checked,'mismatches':errors}
 if name.endswith('/Prince'):
  result['yvresse_skills']=[{k:r[k] for k in ['node_set_key','node_key','skill_key','skill_name']} for r in nodes if 'yvresse' in r['node_set_key'] and r['skill_key'] in ['wh2_main_skill_all_immortality_lord','wh3_main_skill_all_mentor_lord']]
 results.append(result)
required=read('data/technology_trees/source_exports/db/technology_required_building_levels_junctions_tables/data__.tsv',True)
skaven=[]
for p in sorted((ROOT/'data/technology_trees/factions/skaven').glob('*.csv')):
 rows=read(str(p.relative_to(ROOT))); keys={r['technology_key'] for r in rows if r['record_type']=='node'}
 skaven.append({'file':str(p.relative_to(ROOT)),'technology_keys':len(keys),'source_building_requirements':[r for r in required if r['technology'] in keys]})
report={'snapshot':'9.0 / 25507028','base_commit':'3ce90d80bcead2b7f5604c1b3ebfb307d3ff670f','scope':'Selected skill effect rows and active Skaven technology building prerequisites; no effect-target semantics certified.','skills':results,'skaven':skaven,'source_and_output_sha256':hashes}
out=ROOT/'docs/development/update-9.0/minor-reconciliation.json';out.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'skills':results,'skaven_files':len(skaven),'skaven_building_requirements':sum(len(x['source_building_requirements']) for x in skaven)},indent=2))
if any(r['mismatches'] for r in results):raise SystemExit(1)
