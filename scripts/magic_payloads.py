"""Cycle-safe payload graph. Nodes are unique; every source edge is retained."""
from collections import deque

EDGES = {
 'casting':[('activated_projectile','projectile'),('bombardment','bombardment'),('vortex','vortex'),('miscast_explosion','explosion'),('spawned_unit','summon')],
 'vortex':[('subsequent_vortex','vortex'),('contact_effect','phase')],
 'bombardment':[('projectile_type','projectile')],
 'projectile':[('explosion_key','explosion'),('spawned_vortex','vortex'),('overhead_stat_effect','phase'),('contact_stat_effect','phase'),('homing_params','homing'),('scaling_damage','scaling'),('projectile_penetration','penetration')],
 'explosion':[('shrapnel_key','shrapnel'),('contact_phase_effect','phase')],
 'shrapnel':[('projectile','projectile')],
 'phase':[('imbue_contact','phase'),('spreading','spreading')],
 'spreading':[('phase','phase')],
}
KINDS = {
 'vortex':('vortices','vortex_key'), 'bombardment':('bombardments','bombardment_key'),
 'projectile':('projectiles','projectile_key'),'explosion':('explosions','explosion_key'),
 'shrapnel':('projectile_shrapnels','key'),'phase':('ability_phases','id'),
 'homing':('projectile_homing_params','key'),'scaling':('projectiles_scaling_damages','key'),
 'penetration':('projectile_penetration_junctions','key'),'spreading':('special_ability_spreadings','key'),
}

def graph(db, ability, cast, phase_links):
 queue=deque(); nodes=[]; edges=[]; missing=[]; seen=set()
 def enqueue(kind,key,source_kind,source_key,field,provenance):
  if not key: return
  edge=dict(source_kind=source_kind,source_key=source_key,source_field=field,target_kind=kind,target_key=key,provenance=provenance)
  edges.append(edge);queue.append((kind,key,edge))
 def provenance(r): return {k:r[k] for k in ['source_path','source_line','source_patch'] if k in r}
 def children(kind,key,r):
  for field,child in EDGES.get(kind,[]): enqueue(child,r.get(field),kind,key,field,provenance(r))
 if cast: children('casting',ability,cast)
 for link in phase_links: enqueue('phase',link['phase'],'ability',ability,'ability_phase_links',link)
 while queue:
  kind,key,via=queue.popleft()
  if (kind,key) in seen: continue
  seen.add((kind,key));status='normalized_shared_record'
  if kind=='summon':
   record=dict(land_unit_key=key,main_unit_keys=[r['unit'] for r in db.source('main_units') if r['land_unit']==key],land_unit=next((r for r in db.source('land_units') if r['key']==key),None))
   status='source_only_land_unit_namespace'
   if record['land_unit'] is None: missing.append('land_unit:'+key)
   if not record['main_unit_keys']: missing.append('summon_main_unit_mapping:'+key)
  else:
   table,col=KINDS[kind];record=db.one(table,col,key)
  node=dict(kind=kind,key=key,via=via,evidence_status=status,record=record)
  if record is None: missing.append(kind+':'+key)
  else:
   if kind in {'projectile','explosion'}:
    ps=db.find('payload_provenance','kind',kind)
    p=next((r for r in ps if r['key']==key),None)
    if p: node['provenance']=p;record=dict(record,**{k:p[k] for k in ['source_path','source_line','source_patch']})
    else: missing.append('payload_provenance:'+kind+':'+key)
   if kind=='phase':
    node['stat_effects']=db.find('phase_stat_effects','phase',key)
    node['attribute_effects']=db.find('phase_attribute_effects','phase',key)
    node['mechanical_definitions']=db.phase_definitions(node['stat_effects'],node['attribute_effects'])
   children(kind,key,record)
  nodes.append(node)
 return nodes,edges,sorted(set(missing))
