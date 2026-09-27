"""Bounded building-field and map-relation reconciliation from retained 9.0 sources."""
import csv,hashlib,json,sqlite3,subprocess
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='8ad5a33a4d08eab6cf1273815501846f91d4647a'
CHECKPOINT='56388cf86ad2852a9a47c1fc6894a7b4e3cce1aa'
PREFIX='archive/campaign_map/9.0_source_exports/'
hashes={};errors=[]
def read(p):
 b=(ROOT/p).read_bytes();hashes[p]=hashlib.sha256(b).hexdigest();return b
def gitread(ref,p):
 b=subprocess.check_output(['git','show',ref+':'+p],cwd=ROOT);hashes[ref+':'+p]=hashlib.sha256(b).hexdigest();return b
def tsv(b):
 lines=b.decode('utf-8-sig').splitlines();h=lines[0].split('\t');out=[]
 for line in lines[1:]:
  if not line or line.startswith('#'):continue
  v=line.split('\t');assert len(v)==len(h)
  out.append(dict(zip(h,v)))
 return out
def table(name):return tsv(read('data/economy/source_exports/db/'+name+'_tables/data__.tsv'))
def mtable(name):
 p='db/'+name+'_tables/data__.tsv';b=gitread(CHECKPOINT,PREFIX+p)
 expected=atlas.execute('select sha256 from source_files where source_path=?',(p,)).fetchone()
 assert expected and expected[0]==hashlib.sha256(b).hexdigest(),p
 return tsv(b)
def norm(v):
 try:return str(float(v))
 except ValueError:return v
levels={r['level_name']:r for r in table('building_levels')};levelpath='data/economy/source_exports/db/building_levels_tables/data__.tsv'
oldlevels={r['level_name']:r for r in tsv(gitread(OLD,levelpath))}
fields={'building_chain_key':'chain','building_level':'level','settlement_tier_requirement':'primary_slot_building_building_level_requirement','construction_cost':'create_cost','construction_turns':'create_time','building_upkeep':'upkeep_cost','only_in_capital':'only_in_capital','resource_requirement_key':'resource_requirement'}
rows=[]
for p in sorted((ROOT/'data/economy/factions').glob('*/*.csv')):
 rows+=list(csv.DictReader(read(str(p.relative_to(ROOT))).decode('utf-8-sig').splitlines()))
for r in rows:
 s=levels[r['building_key']]
 for out,src in fields.items():
  if norm(r[out])!=norm(s[src]):errors.append({'faction':r['faction_key'],'building':r['building_key'],'field':out,'actual':r[out],'expected':s[src]})
represented={r['building_key'] for r in rows};changes=[]
for k in sorted(levels.keys()|oldlevels.keys()):
 a,b=oldlevels.get(k),levels.get(k)
 if a and b and all(a[c]==b[c] for c in a.keys()&b.keys()):continue
 changed={c:{'old':a.get(c),'new':b.get(c)} for c in sorted(a.keys()&b.keys()) if a[c]!=b[c]} if a and b else {}
 changes.append({'building_key':k,'status':'added' if a is None else 'removed' if b is None else 'changed','represented':k in represented,'normalized_row_occurrences':sum(r['building_key']==k for r in rows),'field_changes':changed})
selected=[r for r in rows if any(x in r['building_key'] for x in ['silver_pinnacle_tomb','lahmia_temple_of_blood','special_dragon_grave','scorpion']) or (r['race_slug']=='slaanesh' and any(x in r['building_key'] for x in ['marauders_4','warrior_halls_3','warrior_halls_4','chariots_2','followers_2']))]
# Landmark effect changes remain source evidence, not normalized conditional effects.
effectpath='data/economy/source_exports/db/building_effects_junction_tables/data__.tsv'
ea=tsv(gitread(OLD,effectpath));eb=table('building_effects_junction')
landmarks={r['building_key'] for r in rows if r['is_unique']=='true'}
def effects(rs,k):return Counter(tuple(sorted(r.items())) for r in rs if r['building']==k)
landmark_effect_deltas=[]
for k in sorted(landmarks):
 a,b=effects(ea,k),effects(eb,k)
 if a!=b:landmark_effect_deltas.append({'building_key':k,'removed':[dict(x) for x in (a-b).elements()],'added':[dict(x) for x in (b-a).elements()]})
# Current atlas and old normalized atlas; source hash identities checked separately.
p='data/campaign_map/campaign_atlas__wh3__9.0.gpkg';read(p);atlas=sqlite3.connect(f'file:{ROOT/p}?mode=ro',uri=True)
oldpath=ROOT/'work/building-map-audit/old-atlas.gpkg';oldpath.parent.mkdir(parents=True,exist_ok=True);oldpath.write_bytes(gitread(OLD,'data/campaign_map/campaign_atlas__wh3__8.1.1.gpkg'));oldatlas=sqlite3.connect(f'file:{oldpath}?mode=ro',uri=True)
regions={r[0] for r in atlas.execute('select region_key from regions')}
expected={(r['region_group'],r['region']) for r in mtable('regions_to_region_groups_junctions') if r['region'] in regions}
actual=set(atlas.execute('select region_group_key,region_key from region_groups'))
if expected!=actual:errors.append({'region_groups_missing':sorted(expected-actual),'region_groups_extra':sorted(actual-expected)})
fort='wh3_dlc20_dark_fortress_region_group'
a={r[0] for r in oldatlas.execute('select region_key from region_groups where region_group_key=?',(fort,))};b={r for g,r in actual if g==fort}
announced=['black_crag','black_pyramid_of_nagash','couronne','hexoatl','karaz_a_karak','khemri','kislev','lothern','naggarond','skavenblight','the_awakening','the_oak_of_ages','altar_of_ultimate_darkness','castle_carcassonne','erengrad','ghrond','hag_graef','hell_pit','lahmia','nagashizzar']
missing=[k for k in announced if 'wh3_main_combi_region_'+k not in b]
if missing:errors.append({'announced_fortresses_missing':missing})
source_maps=mtable('battle_catchment_override_group_battles');expected={(r['group'],'location:'+r['battle_map_location'],r['catchment_name'] or None,r['tile_upgrades'] or None) for r in source_maps}
actual_maps=set(atlas.execute('select * from battle_group_maps'))
if expected!=actual_maps:errors.append({'battle_group_map_mismatch':True})
source_rules=mtable('battle_catchment_override_battle_mappings');cols=['area','attacker','defender','battle_type','battle_path','required_tile_upgrades','battle_group']
expected=Counter(tuple(r[x] or None for x in cols) for r in source_rules if r['battle_path']=='wh3_main_combi_map')
actual_rules=Counter(atlas.execute('select area_key,attacker_filter,defender_filter,battle_type,campaign_battle_path,required_tile_upgrades,battle_group_key from battle_selection_rules'))
if expected!=actual_rules:errors.append({'battle_rule_mismatch':True})
map_cases=[]
for fragment in ['major_middenheim','major_o_tmb_black_pyramid','major_nagashizzar_megatile']:
 hits=atlas.execute('select battle_map_key,map_location from battle_maps where map_location like ? order by battle_map_key',('%'+fragment+'%',)).fetchall();chains=[]
 for key,loc in hits:
  for g, in atlas.execute('select battle_group_key from battle_group_maps where battle_map_key=?',(key,)):
   chains += [{'map_key':key,'location':loc,'group':g,'rules':[dict(zip(['area','attacker','defender','battle_type','required_tile_upgrades'],r)) for r in atlas.execute('select area_key,attacker_filter,defender_filter,battle_type,required_tile_upgrades from battle_selection_rules where battle_group_key=?',(g,))]}]
 if not any(c['rules'] for c in chains):errors.append({'missing_map_chain':fragment})
 map_cases.append({'fragment':fragment,'chains':chains})
map_deltas={}
for t,columns in [('regions','region_key,name,province_key,is_province_capital,start_owner_faction_key,is_faction_capital,settlement_climate_key'),('region_groups','region_group_key,region_key'),('battle_maps','battle_map_key,map_location'),('battle_group_maps','battle_group_key,battle_map_key,catchment_name,tile_upgrades'),('battle_selection_rules','area_key,attacker_filter,defender_filter,battle_type,campaign_battle_path,required_tile_upgrades,battle_group_key')]:
 arows=Counter(oldatlas.execute('select '+columns+' from '+t));brows=Counter(atlas.execute('select '+columns+' from '+t));map_deltas[t]={'removed_row_occurrences':sum((arows-brows).values()),'added_row_occurrences':sum((brows-arows).values())}
priorpath=ROOT/'work/building-map-audit/prior-production.gpkg';priorpath.write_bytes(gitread('b58627227b00991538a56ceb48d45bd03d09179e',p));prior=sqlite3.connect(f'file:{priorpath}?mode=ro',uri=True)
repair_delta=[]
for (name,) in prior.execute("select name from sqlite_master where type='table' and name not like 'sqlite_%'"):
 arows=prior.execute('select * from '+name).fetchall();brows=atlas.execute('select * from '+name).fetchall()
 if sorted(arows,key=repr)!=sorted(brows,key=repr):repair_delta.append({'table':name,'old_rows':len(arows),'new_rows':len(brows)})
report={'repair_table_delta':repair_delta,'snapshot':'9.0 / 25507028','baseline':OLD,'map_source_checkpoint':CHECKPOINT,'scope':'All emitted economy rows: eight direct source fields; source level-key and represented landmark-effect deltas. All current-region group memberships, battle-group map links and Immortal Empires selection rules reconciled to hash-matched source. No independent economy selection/effect-normalization certification, battle geometry/pathfinding, slot-capacity, scripted landmark placement or dynamic crisis simulation.','economy':{'rows_checked':len(rows),'field_comparisons':len(rows)*len(fields),'direct_fields':fields,'source_level_schema_added_columns':sorted(next(iter(levels.values())).keys()-next(iter(oldlevels.values())).keys()),'source_level_changes':changes,'represented_landmark_effect_deltas':landmark_effect_deltas,'selected_output_rows':selected},'map':{'region_group_links_checked':len(actual),'battle_group_map_links_checked':len(actual_maps),'battle_rule_occurrences_checked':sum(actual_rules.values()),'dark_fortresses':{'old_count':len(a),'new_count':len(b),'added':sorted(b-a),'removed':sorted(a-b),'announced_checked':len(announced),'additional_source_additions':sorted((b-a)-{'wh3_main_combi_region_'+k for k in announced})},'announced_map_chains':map_cases,'normalized_deltas':map_deltas},'sha256':hashes,'errors':errors}
(ROOT/'docs/development/update-9.0/building-map-reconciliation.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'economy_rows':len(rows),'field_comparisons':len(rows)*len(fields),'source_level_changes':len(changes),'landmark_effect_changes':len(landmark_effect_deltas),'map':report['map'],'errors':errors},indent=2))
if errors:raise SystemExit(1)
