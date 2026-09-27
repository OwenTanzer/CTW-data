"""Validate canonical source reconciliation, skill pointers, and query fixtures."""
import argparse
import collections
import json
from pathlib import Path
from magic_pipeline import ROOT, csvrows, readj, digest, tsv
from query_magic import Magic


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
 bindings={name:{(r['source_path'],r['source_line']):r for r in db.table(name)} for name in ['ability_bindings','ability_group_bindings','phase_bindings']}
 checked=0
 for c in index:
  source=csvrows(db.file(c['skill_source_path']))
  links=csvrows(base/'data/magic'/c['path']) if c['path'] else []
  if len(links)!=int(c['relation_count']): raise ValueError('Character count')
  for link in links:
   r=source[int(link['skill_source_line'])-2]
   if r['record_type']!='effect' or any(r[k]!=link[k] for k in ['agent_subtype_key','node_set_key','node_key','skill_key','skill_level','effect_key']): raise ValueError('Skill pointer mismatch')
   b=bindings[link['binding_table']][(link['binding_source_path'],link['binding_source_line'])]
   target={'ability':'unit_ability','ability_group':'special_ability_group','phase':'special_ability_phase'}[link['target_kind']]
   if b['effect']!=link['effect_key'] or b['bonus_value_id']!=link['bonus_value_id'] or b[target]!=link['target_key']: raise ValueError('Binding mismatch')
   checked+=1
 golden=golden_checks(db)
 return dict(status='passed',normalized_tables=len(schema),normalized_rows=rows,character_relations_checked=checked,golden_checks=golden,issue_complete=False)


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
 return dict(apotheosis=True,teclis_chain_lightning=True,bound_source_type_counterexample=True,no_false_single_lore_grant=True,summon=summons[0]['key'],multiple_phases=multi,raw_sentinels=True)

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data-root',default=str(ROOT));p.add_argument('--report')
 a=p.parse_args(); result=validate(a.data_root)
 if a.report: Path(a.report).write_text(json.dumps(result,indent=2)+'\n',encoding='utf8')
 print(json.dumps(result,indent=2))
