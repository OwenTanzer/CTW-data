"""Inventory remaining exact-faction permission candidates; never auto-exclude variants."""
import csv,hashlib,json
from pathlib import Path
from collections import Counter,defaultdict
ROOT=Path(__file__).resolve().parents[1];hashes={}
def table(owner,name):
 p=ROOT/f'data/{owner}/source_exports/db/{name}_tables/data__.tsv';b=p.read_bytes();hashes[str(p.relative_to(ROOT))]=hashlib.sha256(b).hexdigest();lines=b.decode('utf-8-sig').splitlines();h=lines[0].split('\t');return [dict(zip(h,x.split('\t'))) for x in lines[1:] if x and not x.startswith('#')]
main={r['unit']:r for r in table('unit_stats','main_units')};land={r['key']:r for r in table('unit_stats','land_units')}
perms=table('unit_stats','units_custom_battle_permissions');mounts=table('unit_stats','units_custom_battle_mounts');agents=table('skill_trees','agent_subtypes');ap=table('skill_trees','faction_agent_permitted_subtypes')
by_faction=defaultdict(list);by_mount=defaultdict(list);by_unit=defaultdict(list)
for p in perms:by_faction[p['faction']].append(p)
for m in mounts:by_mount[m['mounted_unit']].append(m)
for a in agents:by_unit[a['associated_unit_override']].append(a)
allowed={(p['faction'],p['subtype']) for p in ap if p['mod_disabled']=='false'}
decisions={(c['race'],c['unit']):c for c in json.loads((ROOT/'docs/development/update-9.0/availability-decisions.json').read_text())['cases']}
rosters=json.loads((ROOT/'scripts/scope-9.0.json').read_text())['UNIT_ROSTERS'];cases=[]
for p in ['scripts/scope-9.0.json','docs/development/update-9.0/availability-decisions.json']:
 hashes[p]=hashlib.sha256((ROOT/p).read_bytes()).hexdigest()
for r in rosters:
 p=ROOT/f"data/unit_stats/normalized/{r['slug']}__wh3__9.0__ultra.csv";hashes[str(p.relative_to(ROOT))]=hashlib.sha256(p.read_bytes()).hexdigest();present={x['unit_key'] for x in csv.DictReader(p.open())}
 for key in sorted({p['unit'] for p in by_faction[r['faction_key']]}-present):
  m=main.get(key);valid=m is not None and m['land_unit'] in land
  edges=by_mount[key];bases={key}|{e['base_unit'] for e in edges}
  aa=[a for b in bases for a in by_unit[b] if a['recruitable']=='true'];exact=[a['key'] for a in aa if (r['faction_key'],a['key']) in allowed]
  d=decisions.get((r['slug'],key));status='approved_duplicate_exclusion' if d and d['decision']=='exclude_duplicate' else 'missing_source_identity' if not valid else 'supported_mount_of_present_base' if any(e['base_unit'] in present for e in edges) else 'exact_faction_recruitable_character' if exact else 'permission_supported_pending_identity_review'
  cases.append({'race':r['slug'],'faction':r['faction_key'],'unit':key,'land_unit':m['land_unit'] if m else None,'classification':status,'mount_edges':edges,'recruitable_subtypes':sorted(a['key'] for a in aa),'exact_faction_permitted_subtypes':sorted(exact),'canonical_unit':d.get('canonical_unit') if d else None})
report={'snapshot':'9.0 / 25507028','production_commit':'66c0dbe38fbf1a574c7d4d7a22b8d9ad8f5ea530','scope':'Source permissions for each configured representative faction minus normalized race roster. Not exhaustive across every faction or script. All cases are custom-battle-permission-supported. Mount and character classifications are stronger source evidence, not verified campaign unlocks or duplicate elimination. Only prior explicitly approved duplicate decisions are excluded. No suffix-based exclusion.','summary':dict(Counter(c['classification'] for c in cases)),'by_race':dict(Counter(c['race'] for c in cases)),'source_and_output_sha256':hashes,'cases':cases}
(ROOT/'docs/development/update-9.0/historical-availability.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report['summary'],indent=2));print(json.dumps(report['by_race'],indent=2))
