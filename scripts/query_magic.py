"""Query exact character/spell keys without loading all character trees.

Examples:
 python scripts/query_magic.py --character 'Mage (High)' --ability wh2_main_spell_high_magic_apotheosis
 python scripts/query_magic.py --character Teclis --ability wh_main_spell_heavens_chain_lightning
"""
import argparse
import collections
import json
from pathlib import Path
from magic_pipeline import ROOT, csvrows, readj, digest, tsv

class Magic:
 def __init__(self, base=ROOT):
  self.base=Path(base); self.magic=self.base/'data/magic'
  self.schema=readj(self.magic/'schema_inventory.json'); self.cache={}
  self.outputs=readj(self.magic/'output_manifest.json'); self.inputs=readj(self.magic/'input_lock.json')
  self.registry=readj(self.magic/'source_registry.json')
 def file(self, path):
  p=self.base/path
  if not p.exists(): p=ROOT/path
  expected=self.outputs.get(path) or self.inputs.get(path)
  if expected and digest(p)!=expected: raise ValueError('Stale or corrupt input: '+path)
  return p
 def table(self, name):
  if name not in self.cache:
   spec=next((s for s in self.schema.values() if Path(s['path']).stem==name),None)
   if not spec: raise ValueError('No normalized table '+name)
   self.cache[name]=csvrows(self.file(spec['path']))
  return self.cache[name]
 def find(self, name, column, value): return [r for r in self.table(name) if r[column]==value]
 def one(self,name,column,value):
  rows=self.find(name,column,value)
  if len(rows)>1: raise ValueError('Nonunique key '+name+' '+value)
  return rows[0] if rows else None
 def source(self, table):
  cache='source:'+table
  if cache not in self.cache:
   entries=[r for r in self.registry if r['table']==table+'_tables' and r['source_path']]
   if not entries:
    p=ROOT/'data/unit_stats/source_exports/db'/(table+'_tables')/'data__.tsv'
    if not p.exists(): return []
    # Inputs used by this query are independently pinned at build time.
    entries=[dict(source_path=p.relative_to(ROOT).as_posix())]
   result=[]
   for e in entries:
    p=self.file(e['source_path'])
    for n,r in tsv(p)[2]: result.append(dict(r,source_path=e['source_path'],source_line=n,evidence_status='source_only'))
   self.cache[cache]=result
  return self.cache[cache]
 def payload(self, ability):
  definition=self.one('ability_definitions','key',ability)
  if definition is None: raise ValueError('Unknown ability '+ability)
  cast=self.one('ability_casting','key',ability)
  packet=dict(ability_key=ability,coverage_status='partial_source_backed',definition=definition,casting=cast,phases=[],payloads=[],conditions={},missing=[],sentinel_interpretation='Raw negative use/recharge values retained; engine meaning unresolved.')
  queue=[]
  if not cast: packet['missing'].append('casting_record')
  else:
   for field,kind in [('activated_projectile','projectile'),('bombardment','bombardment'),('vortex','vortex'),('miscast_explosion','explosion'),('spawned_unit','summon')]:
    if cast[field]: queue.append((kind,cast[field],{'source_field':'casting.'+field}))
  phase_links=sorted(self.find('ability_phase_links','special_ability',ability),key=lambda r:(int(r['order']),r['target_self'],r['target_friends'],r['target_enemies']))
  for link in phase_links:
   phase=self.one('ability_phases','id',link['phase'])
   packet['phases'].append(dict(link=link,phase=phase,stat_effects=self.find('phase_stat_effects','phase',link['phase']),attribute_effects=self.find('phase_attribute_effects','phase',link['phase'])))
   if phase is None: packet['missing'].append('phase:'+link['phase'])
  for name,col in [('special_ability_to_invalid_target_flags','special_ability'),('special_ability_to_invalid_usage_flags','special_ability'),('special_ability_to_auto_deactivate_flags','special_ability'),('special_ability_to_recharge_contexts','special_ability'),('special_ability_intensity_settings','ability'),('special_ability_behaviour_to_ability_junctions','ability')]:
   spec=next((s for s in self.schema.values() if Path(s['path']).stem==name),None)
   if spec and col in spec['columns']: packet['conditions'][name]=self.find(name,col,ability)
  packet['unit_grants']=[r for r in self.source('land_units_to_unit_abilites_junctions') if r['ability']==ability]
  packet['groups']=self.find('ability_group_members','unit_special_abilities',ability)
  packet['replacement_set_members']=self.find('unit_ability_superseded_abilities_set_elements','set_key',definition['superseded_abilities_set']) if definition['superseded_abilities_set'] else []
  seen=set()
  while queue:
   kind,key,via=queue.pop(0)
   if (kind,key) in seen: continue
   seen.add((kind,key)); record=None; status='normalized_shared_record'
   if kind in {'vortex','bombardment'}:
    record=self.one('vortices' if kind=='vortex' else 'bombardments','vortex_key' if kind=='vortex' else 'bombardment_key',key)
   elif kind in {'projectile','explosion','shrapnel'}:
    table={'projectile':'projectiles','explosion':'projectiles_explosions','shrapnel':'projectile_shrapnels'}[kind]
    record=next((r for r in self.source(table) if r['key']==key),None); status='source_only_shared_owner'
   elif kind=='summon':
    record=dict(land_unit_key=key,main_unit_keys=[r['unit'] for r in self.source('main_units') if r['land_unit']==key],land_unit=next((r for r in self.source('land_units') if r['key']==key),None));status='source_only_land_unit_namespace'
   elif kind=='phase': record=self.one('ability_phases','id',key)
   if record is None: packet['missing'].append(kind+':'+key)
   packet['payloads'].append(dict(kind=kind,key=key,via=via,evidence_status=status,record=record))
   if record:
    edges={'vortex':[('subsequent_vortex','vortex'),('contact_effect','phase')],'bombardment':[('projectile_type','projectile')],'projectile':[('explosion_type','explosion'),('spawned_vortex','vortex'),('overhead_stat_effect','phase')],'explosion':[('shrapnel','shrapnel'),('contact_phase_effect','phase')],'shrapnel':[('projectile','projectile')]}.get(kind,[])
    for field,child in edges:
     if record.get(field): queue.append((child,record[field],dict(source_kind=kind,source_key=key,source_field=field)))
  return packet
 def query(self, character=None, ability=None):
  result=dict(manifest=readj(self.magic/'dataset_manifest.json'),mode='potential_access_and_source_effects',effective_build_evaluated=False,boundaries=readj(self.magic/'coverage.json')['boundaries'])
  relations=[]; skills=[]; matched=None
  if character:
   chars=csvrows(self.file('data/magic/character_index.csv'))
   found=[c for c in chars if character in {c['agent_subtype_key'],c['character_name']}]
   if len(found)!=1: raise ValueError('Use an exact unique subtype/name; matches='+str(len(found)))
   matched=found[0]; result['character']=matched
   skills=csvrows(self.file(matched['skill_source_path']))
   relations=csvrows(self.file('data/magic/'+matched['path'])) if matched['path'] else []
  if not ability:
   if not character: raise ValueError('Supply --character or --ability')
   result['skill_relations']=relations
   result['availability_warning']='Group/phase modifiers do not grant their targets. Inspect a specific ability for payloads.'
   return result
  base=self.one('ability_definitions','key',ability)
  if base is None: raise ValueError('Unknown exact ability key')
  variants={ability}
  if base['overpower_option']: variants.add(base['overpower_option'])
  # Include base if user supplied an overcast variant, via an explicit source edge.
  for row in self.table('ability_definitions'):
   if row['overpower_option']==ability: variants.add(row['key'])
  gs={r['special_ability_groups'] for a in variants for r in self.find('ability_group_members','unit_special_abilities',a)}
  ps={r['phase'] for a in variants for r in self.find('ability_phase_links','special_ability',a)}
  relevant=[r for r in relations if (r['target_kind']=='ability' and r['target_key'] in variants) or (r['target_kind']=='ability_group' and r['target_key'] in gs) or (r['target_kind']=='phase' and r['target_key'] in ps)]
  mods=[]
  for r in relevant:
   source=skills[int(r['skill_source_line'])-2]
   if any(source[k]!=r[k] for k in ['skill_key','skill_level','effect_key','node_set_key','node_key']): raise ValueError('Skill pointer mismatch')
   mods.append(dict(relation=r,skill_effect=source))
  result['skill_grants_and_modifiers']=mods
  nodes={r['node_key'] for r in relevant}; sk={r['skill_key'] for r in relevant}; sets={r['node_set_key'] for r in relevant}
  result['skill_conditions']=[r for r in skills if (r['record_type']=='node_set' and r['node_set_key'] in sets) or (r['record_type'] in {'node','skill_level','prerequisite','skill_lock','ancillary_lock'} and (r['node_key'] in nodes or r['parent_node_key'] in nodes or r['child_node_key'] in nodes or r['locked_skill_key'] in sk))]
  result['spell_variants']=[self.payload(a) for a in sorted(variants)]
  grants=[r for r in relevant if r['bonus_value_id']=='enable' and r['target_kind']=='ability']
  result['character_access_status']='potential_skill_grant_found' if grants else 'modifiers_only_access_not_established' if relevant else 'not_established_by_this_query' if character else 'character_not_selected'
  return result

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data-root',default=str(ROOT));p.add_argument('--character');p.add_argument('--ability');p.add_argument('--output')
 a=p.parse_args(); value=Magic(a.data_root).query(a.character,a.ability); text=json.dumps(value,indent=2,ensure_ascii=False)+'\n'
 if a.output: Path(a.output).write_text(text,encoding='utf8')
 else: print(text,end='')
