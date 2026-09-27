"""Source-key routes, shared by indexing and queries; no applicability evaluator."""
BINDINGS = [
 ('ability_bindings','effect','unit_ability','ability'),
 ('ability_group_bindings','effect','special_ability_group','ability_group'),
 ('phase_bindings','effect','special_ability_phase','phase'),
 ('effect_bonus_value_unit_set_unit_ability_junctions','effect','unit_set_ability','unit_set_ability'),
 ('effect_bonus_value_unit_set_special_ability_phase_junctions','effect','unit_set_special_ability_phase_junction','unit_set_phase'),
 ('effect_bonus_value_military_force_ability_junctions','effect','force_ability','army_ability'),
 ('effect_bonus_value_battle_context_unit_ability_junctions','effect_key','battle_context_unit_ability','context_unit_ability'),
 ('effect_bonus_value_battle_context_army_special_ability_junctions','effect','battle_context_army_special_ability','context_army_ability'),
 ('effect_bonus_value_pre_battle_unit_targeted_ability_junctions','effect','pre_battle_unit_targeted_ability','pre_battle_ability'),
]

def resolve_target(table, kind, key):
 result=dict(ability_keys=[],phase_keys=[],conditions=[],missing=[],recipient='character_or_source_scope' if kind in {'ability','ability_group','phase'} else 'conditional_recipient',route_kind=kind)
 def find(name,col,value): return [r for r in table(name) if r[col]==value]
 def follow(name,col,value):
  rows=find(name,col,value)
  if not rows: result['missing'].append(name+':'+value)
  result['conditions'].extend(dict(table=name,record=r) for r in rows)
  return rows
 def walk(k,v):
  if k=='ability': result['ability_keys'].append(v)
  elif k=='phase': result['phase_keys'].append(v)
  elif k=='ability_group': result['ability_keys'].extend(r['unit_special_abilities'] for r in find('ability_group_members','special_ability_groups',v))
  elif k in {'unit_set_ability','unit_set_phase'}:
   for r in follow('unit_set_unit_ability_junctions' if k=='unit_set_ability' else 'unit_set_special_ability_phase_junctions','key',v):
    walk('ability' if k=='unit_set_ability' else 'phase',r['unit_ability' if k=='unit_set_ability' else 'special_ability_phase'])
    follow('unit_sets','key',r['unit_set'])
    result['conditions'].extend(dict(table='unit_set_to_unit_junctions',record=x) for x in find('unit_set_to_unit_junctions','unit_set',r['unit_set']))
  elif k=='army_ability':
   for r in follow('army_special_abilities','army_special_ability',v): walk('ability',r['unit_special_ability'])
   result['recipient']='military_force'
  elif k in {'context_unit_ability','context_army_ability'}:
   for r in follow('battle_context_unit_ability_junctions' if k=='context_unit_ability' else 'battle_context_army_special_ability_junctions','key',v):
    walk('ability' if k=='context_unit_ability' else 'army_ability',r['unit_ability' if k=='context_unit_ability' else 'army_special_ability'])
    follow('campaign_bonus_value_battle_context_specifiers','key',r['battle_context'])
    for suffix in ['battle_type','culture','faction','force_status','ground_type','territory_status']:
     name='campaign_bonus_value_battle_context_'+suffix+'_junctions'
     result['conditions'].extend(dict(table=name,record=x) for x in find(name,'battle_context_key',r['battle_context']))
  elif k=='pre_battle_ability':
   follow('pre_battle_unit_targeted_abilities','key',v)
   result['missing'].append('pre_battle_effect_bundle_evaluation:'+v)
 walk(kind,key)
 result['ability_keys']=sorted(set(result['ability_keys']));result['phase_keys']=sorted(set(result['phase_keys']))
 return result
