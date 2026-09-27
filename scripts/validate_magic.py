"""Validate canonical source reconciliation, skill pointers, and query fixtures."""
import argparse
import collections
import json
from pathlib import Path
from magic_pipeline import ROOT, csvrows, readj, digest, tsv
from query_magic import Magic
from magic_relations import BINDINGS, resolve_target
from magic_audit import baseline_check, access_packet
from magic_payloads import EDGES, KINDS
from decimal import Decimal, InvalidOperation


def validate(base=ROOT):
 base=Path(base); db=Magic(base); magic=base/'data/magic'
 outputs=readj(magic/'output_manifest.json'); inputs=readj(magic/'input_lock.json')
 for rel,expected in outputs.items():
  if digest(base/rel)!=expected: raise ValueError('Generated hash mismatch '+rel)
 for rel,expected in inputs.items():
  p=base/rel
  if not p.exists(): p=ROOT/rel
  if digest(p)!=expected: raise ValueError('Input hash mismatch '+rel)
 registry=readj(magic/'source_registry.json'); schema=readj(magic/'schema_inventory.json')
 rows=0
 for table,spec in schema.items():
  records=csvrows(base/spec['path']); expected=[]; keys=set()
  for entry in registry:
   if entry['table']!=table: continue
   p=db.file(entry['source_path']); cols,meta,source=tsv(p)
   if set(cols)!=set(spec['columns']): raise ValueError('Source schema differs '+table)
   for line,r in source:
    expected.append(dict(r,source_path=entry['source_path'],source_line=str(line),source_patch=readj(magic/'dataset_manifest.json')['extraction_patch']))
  if records!=expected: raise ValueError('Normalized records differ from canonical source '+table)
  if len(records)!=spec['rows']: raise ValueError('Row count '+table)
  for r in records:
   key=tuple(r[k] for k in spec['keys'])
   if spec['keys'] and key in keys: raise ValueError('Duplicate identity '+table)
   keys.add(key)
  rows+=len(records)
 # Audit every pointer to existing skill evidence and every binding row. The
 # character index must not lose characters with no established magic route.
 index=csvrows(base/'data/magic/character_index.csv')
 canonical=csvrows(ROOT/'data/skill_trees/character_index__wh3__9.0.csv')
 if {r['agent_subtype_key'] for r in index}!={r['agent_subtype_key'] for r in canonical}: raise ValueError('Character coverage')
 bindings={name:{(r['source_path'],r['source_line']):r for r in db.table(name)} for name,_,_,_ in BINDINGS}
 binding_specs={name:(effect,target,kind) for name,effect,target,kind in BINDINGS}
 by_effect=collections.defaultdict(list)
 for name,effect,target,kind in BINDINGS:
  for r in db.table(name): by_effect[r[effect]].append((name,r['source_path'],r['source_line'],r['bonus_value_id'],kind,r[target]))
 main={r['unit']:r for r in db.source('main_units')}
 grants=collections.defaultdict(list)
 for r in db.source('land_units_to_unit_abilites_junctions'):
  row={k:v for k,v in r.items() if k!='evidence_status'};row.update(source_line=str(r['source_line']),source_patch='9.0.1');grants[r['land_unit']].append(row)
 subtypes={r['key']:r for r in db.table('agent_subtypes')};defs={r['key']:r for r in db.table('ability_definitions')}
 mounts=csvrows(db.file('data/unit_stats/lookups/unit_mount_variants__wh3__9.0__ultra.csv'))
 checked=0
 for c in index:
  expected_access=access_packet(c,subtypes[c['agent_subtype_key']],main,grants,mounts,defs)
  if readj(db.file('data/magic/access/'+c['agent_subtype_key']+'.json'))!=expected_access: raise ValueError('Character unit/form access differs from source')
  source=csvrows(db.file(c['skill_source_path']))
  links=csvrows(base/'data/magic'/c['path']) if c['path'] else []
  if len(links)!=int(c['relation_count']): raise ValueError('Character count')
  expected_links=collections.Counter((str(n),*binding) for n,r in enumerate(source,2) if r['record_type']=='effect' for binding in by_effect[r['effect_key']])
  actual_links=collections.Counter(tuple(r[k] for k in ['skill_source_line','binding_table','binding_source_path','binding_source_line','bonus_value_id','target_kind','target_key']) for r in links)
  if expected_links!=actual_links: raise ValueError('Dropped or added character binding: '+c['agent_subtype_key'])
  for link in links:
   r=source[int(link['skill_source_line'])-2]
   if r['record_type']!='effect' or any(r[k]!=link[k] for k in ['agent_subtype_key','node_set_key','node_key','skill_key','skill_level','effect_key']): raise ValueError('Skill pointer mismatch')
   b=bindings[link['binding_table']][(link['binding_source_path'],link['binding_source_line'])]
   effect,target,kind=binding_specs[link['binding_table']]
   if b[effect]!=link['effect_key'] or b['bonus_value_id']!=link['bonus_value_id'] or b[target]!=link['target_key']: raise ValueError('Binding mismatch')
   checked+=1
 payload_checks=validate_payloads(db)
 golden=golden_checks(db)
 return dict(status='passed',normalized_tables=len(schema),normalized_rows=rows,character_relations_checked=checked,golden_checks=golden,payload_checks=payload_checks,issue_complete=False)


def validate_payloads(db):
 baseline=baseline_check(db.base)
 aliases={'projectile':{'key':'projectile_key','damage':'base_damage','bonus_v_infantry':'bonus_vs_infantry','bonus_v_large':'bonus_vs_large','explosion_type':'explosion_key'},'explosion':{'key':'explosion_key','detonation_radius':'radius','detonation_duration':'duration','detonation_speed':'speed','detonation_damage':'base_damage','detonation_damage_ap':'ap_damage','detonation_force':'force','shrapnel':'shrapnel_key'}}
 def equal(a,b):
  if a==b: return True
  if not a or not b: return False
  try: return Decimal(a)==Decimal(b)
  except InvalidOperation: return False
 for kind,table in [('projectile','projectiles'),('explosion','projectiles_explosions')]:
  source={r['key']:r for r in db.source(table)}
  for row in db.table('projectiles' if kind=='projectile' else 'explosions'):
   r=source[row[kind+'_key']]
   if kind=='projectile':
    penetration=db.one('projectile_penetration_junctions','key',r['projectile_penetration']) if r['projectile_penetration'] else None
    if not equal(row['max_penetration'],penetration['max_penetration'] if penetration else '') or row['penetration_entity_size_cap']!=(penetration['entity_size_cap'] if penetration else ''): raise ValueError('Derived penetration fields changed')
    explosion=db.one('explosions','explosion_key',r['explosion_type']) if r['explosion_type'] else None
    if row['shrapnel_key']!=(explosion['shrapnel_key'] if explosion else ''): raise ValueError('Derived shrapnel reference changed')
   for col,value in r.items():
    if col in {'source_path','source_line','evidence_status'}: continue
    if not equal(row[aliases[kind].get(col,col)],value): raise ValueError('Payload source value changed '+kind+':'+r['key']+':'+col)
 # Recompute every variant audit and verify graph topology independently of the
 # cached report. Every node's outgoing fields and every direct phase row count.
 reports=csvrows(db.file('data/magic/coverage_by_variant.csv'))
 for report in reports:
  p=db.payload(report['ability_key']);sc=p['structural_coverage']
  if report['status']!=sc['status'] or int(report['edge_count'])!=sc['edge_count'] or int(report['missing_reference_count'])!=len(p['missing']): raise ValueError('False structural completeness')
  actual=collections.Counter((e['source_kind'],e['source_key'],e['source_field'],e['target_kind'],e['target_key']) for e in p['payload_edges'])
  expected=collections.Counter()
  records=[('casting',p['ability_key'],p['casting'])]+[(n['kind'],n['key'],n['record']) for n in p['payloads']]
  for kind,key,r in records:
   if not r: continue
   for field,child in EDGES.get(kind,[]):
    if r.get(field): expected[(kind,key,field,child,r[field])]+=1
  for phase in p['phases']: expected[('ability',p['ability_key'],'ability_phase_links','phase',phase['link']['phase'])]+=1
  if expected!=actual: raise ValueError('Dropped payload branch')
  for n in p['payloads']:
   if n['kind']=='phase' and n['record']:
    if n['stat_effects']!=db.find('phase_stat_effects','phase',n['key']) or n['attribute_effects']!=db.find('phase_attribute_effects','phase',n['key']): raise ValueError('Indirect phase effects dropped')
 if len(reports)!=sum(r['magic_candidate']=='true' for r in csvrows(db.file('data/magic/ability_index.csv'))): raise ValueError('Variant audit coverage')
 return dict(baseline=baseline,variants=len(reports))


def golden_checks(db):
 mage=db.query('Mage (High)','wh2_main_spell_high_magic_apotheosis')
 v={r['ability_key']:r for r in mage['spell_variants']}
 normal=v['wh2_main_spell_high_magic_apotheosis']; upgraded=v['wh2_main_spell_high_magic_apotheosis_upgraded']
 assert normal['casting']['mana_cost']=='5.0000' and upgraded['casting']['mana_cost']=='7.0000', 'Variant costs conflated'
 assert normal['phases'] and normal['phases'][0]['phase']['heal_amount']!='0.0000', 'Healing phase missing'
 assert normal['phases'][0]['link']['phase']==normal['phases'][0]['phase']['id']
 assert mage['effective_build_evaluated'] is False and mage['skill_conditions'], 'Conditions lost'
 assert normal['casting']['target_enemies']=='false' and normal['phases'][0]['phase']['affects_enemies']=='true', 'Casting and phase targets conflated'
 bonuses={r['relation']['bonus_value_id'] for r in mage['skill_grants_and_modifiers']}
 assert {'enable','enable_overchage','cost_mod','recharge_mod'}<=bonuses, 'One-to-many binding lost'
 assert len({r['relation']['skill_level'] for r in mage['skill_grants_and_modifiers']})>1, 'Rank provenance lost'
 teclis=db.query('Teclis','wh_main_spell_heavens_chain_lightning')
 assert teclis['skill_grants_and_modifiers'] and any(p['kind']=='vortex' and p['record']['vortex_key']=='wh_main_spell_heavens_chain_lightning' for v in teclis['spell_variants'] for p in v['payloads']), 'Vortex route broken'
 bound=db.query(ability='wh2_dlc15_spell_bound_chain_lightning')['spell_variants'][0]
 assert bound['definition']['source_type']=='spell', 'Bound fixture classified by spelling'
 assert bound['ability_key']!='wh_main_spell_heavens_chain_lightning'
 assert not normal['missing'] and not teclis['spell_variants'][0]['missing']
 # No selected skill allocation is silently invented; rank values never summed.
 unrelated=db.query('Mage (High)','wh_main_spell_heavens_chain_lightning')
 assert not any(r['relation']['bonus_value_id']=='enable' and r['relation']['target_kind']=='ability' for r in unrelated['skill_grants_and_modifiers']), 'False mixed-lore access'
 cast=db.table('ability_casting'); summons=[r for r in cast if r['spawned_unit']]
 assert summons, 'No summon fixture'
 summon=db.payload(summons[0]['key']); s=next(p for p in summon['payloads'] if p['kind']=='summon')
 assert s['record']['land_unit'] is not None and s['record']['main_unit_keys'], 'Wrong summon namespace'
 counts=collections.Counter(r['special_ability'] for r in db.table('ability_phase_links'))
 multi=next(k for k,n in counts.items() if n>1)
 packet=db.payload(multi)
 assert len(packet['phases'])==counts[multi], 'Multiphase cardinality lost'
 assert [int(p['link']['order']) for p in packet['phases']]==sorted(int(p['link']['order']) for p in packet['phases'])
 assert any(r['num_uses']=='-1' for r in cast), 'Sentinel erased'
 missile=db.payload('wh_main_spell_fire_fireball')
 bombard=db.payload('wh_main_spell_metal_searing_doom')
 chain=db.payload('wh2_main_hero_abilities_doomrocket')
 assert any(n['kind']=='projectile' and n['evidence_status']=='normalized_shared_record' for n in missile['payloads'])
 assert {'bombardment','projectile','explosion'} <= {n['kind'] for n in bombard['payloads']}
 assert {'projectile','explosion','shrapnel'} <= {n['kind'] for n in chain['payloads']}
 normal_fire=missile['casting'];bound_fire=db.payload('wh_main_spell_bound_fireball')['casting']
 assert normal_fire['activated_projectile']!=bound_fire['activated_projectile']
 lokhir=db.query('Lokhir Fellheart','wh2_main_army_abilities_khaines_lash')
 army=[r for r in lokhir['skill_grants_and_modifiers'] if r['relation']['effect_key']=='wh2_twa03_num_uses_black_ark_bombardments']
 assert army and all(r['target_route']['recipient']=='military_force' for r in army), 'Army modifier route lost'
 assert lokhir['character_access_status']!='potential_skill_grant_found', 'Army modifier presented as personal grant'
 conditional=db.query('Rakarth')
 assert any(r['kind']=='unit_set_ability' and any(c['table']=='unit_set_to_unit_junctions' for c in r['route']['conditions']) for r in conditional['conditional_routes']), 'Unit-set membership rules lost'
 assert mage['non_skill_access']['unit_forms'], 'Innate/form route absent'
 sample=mage['skill_grants_and_modifiers'][0]['relation']
 selected=db.query('Mage (High)','wh2_main_spell_high_magic_apotheosis',[(sample['skill_key'],sample['skill_level'])])
 assert all((r['relation']['skill_key'],r['relation']['skill_level'])==(sample['skill_key'],sample['skill_level']) for r in selected['skill_grants_and_modifiers']), 'Supplied skill/rank filter lost'
 return dict(apotheosis=True,teclis_chain_lightning=True,bound_source_type_counterexample=True,no_false_single_lore_grant=True,summon=summons[0]['key'],multiple_phases=multi,raw_sentinels=True,magic_missile=True,bombardment=True,secondary_shrapnel=True,conditional_army=True,unit_set_membership=True,innate_forms=True,supplied_skill_rank=True)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data-root',default=str(ROOT));p.add_argument('--report')
 a=p.parse_args(); result=validate(a.data_root)
 if a.report: Path(a.report).write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
 print(json.dumps(result,indent=2))
