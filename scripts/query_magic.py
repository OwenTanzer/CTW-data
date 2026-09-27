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
from magic_relations import resolve_target
from magic_payloads import graph

class Magic:
 def __init__(self, base=ROOT):
  self.base=Path(base); self.magic=self.base/'data/magic'
  self.schema=readj(self.magic/'schema_inventory.json'); self.cache={}; self.indices={}; self.routes={}
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
   if not spec:
    paths={'projectiles':'data/unit_stats/lookups/projectiles__wh3__9.0.csv','explosions':'data/unit_stats/lookups/explosions__wh3__9.0.csv','payload_provenance':'data/unit_stats/abilities/payload_provenance.csv'}
    if name not in paths: raise ValueError('No normalized table '+name)
    spec={'path':paths[name]}
   self.cache[name]=csvrows(self.file(spec['path']))
  return self.cache[name]
 def find(self, name, column, value):
  if (name,column) not in self.indices:
   idx=collections.defaultdict(list)
   for r in self.table(name): idx[r[column]].append(r)
   self.indices[name,column]=idx
  return self.indices[name,column].get(value,[])
 def route(self,kind,key):
  if (kind,key) not in self.routes: self.routes[kind,key]=resolve_target(self.table,kind,key)
  return self.routes[kind,key]
 def phase_definitions(self,stats,attributes):
  return dict(stats=[dict(effect=r,definition=self.one('modifiable_unit_stats','stat_key',r['stat']),operation=r['how'],operation_status='engine_enum_no_packed_definition') for r in stats],attributes=[dict(effect=r,definition=self.one('unit_attributes','key',r['attribute'])) for r in attributes])
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
  if not cast: packet['missing'].append('casting_record')
  phase_links=sorted(self.find('ability_phase_links','special_ability',ability),key=lambda r:(int(r['order']),r['target_self'],r['target_friends'],r['target_enemies']))
  for link in phase_links:
   phase=self.one('ability_phases','id',link['phase'])
   packet['phases'].append(dict(link=link,phase=phase,stat_effects=self.find('phase_stat_effects','phase',link['phase']),attribute_effects=self.find('phase_attribute_effects','phase',link['phase']),mechanical_definitions=self.phase_definitions(self.find('phase_stat_effects','phase',link['phase']),self.find('phase_attribute_effects','phase',link['phase']))))
   if phase is None: packet['missing'].append('phase:'+link['phase'])
  for name,col in [('special_ability_to_invalid_target_flags','special_ability'),('special_ability_to_invalid_usage_flags','special_ability'),('special_ability_to_auto_deactivate_flags','special_ability'),('special_ability_to_recharge_contexts','special_ability'),('special_ability_intensity_settings','ability'),('special_ability_behaviour_to_ability_junctions','ability')]:
   spec=next((s for s in self.schema.values() if Path(s['path']).stem==name),None)
   if spec and col in spec['columns']: packet['conditions'][name]=self.find(name,col,ability)
  packet['target_displays']={f:self.one('area_of_effect_displays','key',cast[f]) for f in ['targetting_aoe','passive_aoe','active_aoe'] if cast and cast[f]}
  packet['unsupported_components']=[dict(source_field='casting.mom_vortex_key',key=cast['mom_vortex_key'],status='unmodeled_payload_namespace')] if cast and cast.get('mom_vortex_key') else []
  packet['unit_grants']=[r for r in self.source('land_units_to_unit_abilites_junctions') if r['ability']==ability]
  packet['groups']=self.find('ability_group_members','unit_special_abilities',ability)
  packet['replacement_set_members']=self.find('unit_ability_superseded_abilities_set_elements','set_key',definition['superseded_abilities_set']) if definition['superseded_abilities_set'] else []
  packet['payloads'],packet['payload_edges'],missing=graph(self,ability,cast,phase_links)
  packet['missing'].extend(missing)
  packet['structural_coverage']=dict(status='missing_references' if packet['missing'] else 'unsupported_components' if packet['unsupported_components'] else 'supported_graph_resolved',missing_references=packet['missing'],node_count=len(packet['payloads']),edge_count=len(packet['payload_edges']),unnormalized_components=[dict(kind=n['kind'],key=n['key'],status=n['evidence_status']) for n in packet['payloads'] if n['evidence_status']!='normalized_shared_record'])
  records=[definition,cast]+[p['phase'] for p in packet['phases']]+[n['record'] for n in packet['payloads']]
  for n in packet['payloads']:
   records.extend(n.get('stat_effects',[]));records.extend(n.get('attribute_effects',[]))
   if n.get('provenance'): records.append(n['provenance'])
  identities={(r['source_path'],str(r['source_line'])) for r in records if r and 'source_path' in r}
  if 'dependency_audit' not in self.cache: self.cache['dependency_audit']=csvrows(self.file('data/magic/dependency_audit.csv'))
  packet['definition_dependencies']=[r for r in self.cache['dependency_audit'] if (r['source_path'],r['source_line']) in identities]
  packet['runtime_coverage']=dict(status='not_evaluated',unknowns=['engine timing, collision and stacking','negative sentinel interpretation','effective build and active acquisition'])
  return packet
 def query(self, character=None, ability=None, selected_skills=None):
  if selected_skills is not None and (not character or any(len(pair)!=2 or not all(pair) for pair in selected_skills)): raise ValueError('Supply a character and exact KEY:LEVEL skill pairs')
  result=dict(manifest=readj(self.magic/'dataset_manifest.json'),mode='potential_access_and_source_effects',effective_build_evaluated=False,boundaries=readj(self.magic/'coverage.json')['boundaries'])
  relations=[]; skills=[]; matched=None
  if character:
   chars=csvrows(self.file('data/magic/character_index.csv'))
   found=[c for c in chars if character in {c['agent_subtype_key'],c['character_name']}]
   if len(found)!=1: raise ValueError('Use an exact unique subtype/name; matches='+str(len(found)))
   matched=found[0]; result['character']=matched
   skills=csvrows(self.file(matched['skill_source_path']))
   relations=csvrows(self.file('data/magic/'+matched['path'])) if matched['path'] else []
   if selected_skills is not None:
    requested=set(selected_skills)
    # Level-description rows are optional; nodes and effects also establish
    # represented ranks. Recognition does not establish build legality.
    represented={(r['skill_key'],r['skill_level']) for r in skills if r['record_type'] in {'skill_level','effect'} and r['skill_key'] and r['skill_level']}
    for r in skills:
     if r['record_type']=='node' and r['skill_key'] and r['skill_max_level']:
      represented.update((r['skill_key'],str(level)) for level in range(1,int(r['skill_max_level'])+1))
    result['supplied_build']=dict(selected_skills=[dict(skill_key=k,skill_level=v) for k,v in sorted(requested)],unresolved_components=[dict(skill_key=k,skill_level=v) for k,v in sorted(requested-represented)],legality_status='not_evaluated')
    relations=[r for r in relations if (r['skill_key'],r['skill_level']) in requested]
   result['non_skill_access']=readj(self.file('data/magic/access/'+matched['agent_subtype_key']+'.json'))
  if not ability:
   if not character: raise ValueError('Supply --character or --ability')
   result['skill_relations']=relations
   result['conditional_routes']=[dict(kind=k,key=v,route=self.route(k,v)) for k,v in sorted({(r['target_kind'],r['target_key']) for r in relations if r['target_kind'] not in {'ability','ability_group','phase'}})]
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
  relevant=[]
  for r in relations:
   route=self.route(r['target_kind'],r['target_key'])
   if set(route['ability_keys'])&variants or set(route['phase_keys'])&ps: relevant.append(r)
  mods=[]
  for r in relevant:
   source=skills[int(r['skill_source_line'])-2]
   if any(source[k]!=r[k] for k in ['skill_key','skill_level','effect_key','node_set_key','node_key']): raise ValueError('Skill pointer mismatch')
   mods.append(dict(relation=r,skill_effect=source,target_route=self.route(r['target_kind'],r['target_key']),scope_definition=self.one('campaign_effect_scopes','key',source['effect_scope'])))
  result['skill_grants_and_modifiers']=mods
  nodes={r['node_key'] for r in relevant}; sk={r['skill_key'] for r in relevant}; sets={r['node_set_key'] for r in relevant}
  result['skill_conditions']=[r for r in skills if (r['record_type']=='node_set' and r['node_set_key'] in sets) or (r['record_type'] in {'node','skill_level','prerequisite','skill_lock','ancillary_lock'} and (r['node_key'] in nodes or r['parent_node_key'] in nodes or r['child_node_key'] in nodes or r['locked_skill_key'] in sk))]
  result['spell_variants']=[self.payload(a) for a in sorted(variants)]
  # A direct ability binding can enable another character's ability.
  # Only source-backed character-local scopes support personal access.
  grants=[]
  for mod in mods:
   r=mod['relation']; scope=mod['scope_definition'] or {}
   if r['bonus_value_id']=='enable' and r['target_kind']=='ability' and all(scope.get(k)==v for k,v in {'source':'character','target':'character','location':'character','ownership':'yours'}.items()):
    grants.append(r)
  result['character_access_status']='potential_skill_grant_found' if grants else 'modifiers_only_access_not_established' if relevant else 'not_established_by_this_query' if character else 'character_not_selected'
  return result

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__);p.add_argument('--data-root',default=str(ROOT));p.add_argument('--character');p.add_argument('--ability');p.add_argument('--skill',action='append',metavar='KEY:LEVEL');p.add_argument('--output')
 a=p.parse_args(); value=Magic(a.data_root).query(a.character,a.ability,[tuple(v.rsplit(':',1)) for v in a.skill] if a.skill is not None else None); text=json.dumps(value,indent=2,ensure_ascii=False)+'\n'
 if a.output: Path(a.output).write_text(text,encoding='utf8')
 else: print(text,end='')
