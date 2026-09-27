"""Build shared ability relations and indexed character-to-magic evidence.

No combat simulation or automatic skill allocation. Source values retain their
native units and sentinels; the query reports source facts, never effective stats.
"""
import argparse
import collections
import csv
import hashlib
import json
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[1]
PROFILES = {'9.0': ('25507028', '9.0.0.0'), '9.0.1': ('25546563', '9.0.1.0')}
PROVENANCE = ['source_path', 'source_line', 'source_patch']
# Each source table has one normalized owner. All shared ability records remain
# here, including non-spells, so #7 can consume precisely the same relations.
NAMES = {
 'unit_abilities': 'ability_definitions', 'unit_special_abilities': 'ability_casting',
 'special_ability_phases': 'ability_phases',
 'special_ability_to_special_ability_phase_junctions': 'ability_phase_links',
 'special_ability_phase_stat_effects': 'phase_stat_effects',
 'special_ability_phase_attribute_effects': 'phase_attribute_effects',
 'special_ability_groups': 'ability_groups',
 'special_ability_groups_to_unit_abilities_junctions': 'ability_group_members',
 'battle_vortexs': 'vortices', 'projectile_bombardments': 'bombardments',
 'effect_bonus_value_unit_ability_junctions': 'ability_bindings',
 'effect_bonus_value_special_ability_group_junctions': 'ability_group_bindings',
 'effect_bonus_value_special_ability_phase_record_junctions': 'phase_bindings',
}
EXCLUDED_PREFIX = ('audio_', 'battle_ai_', 'battle_personalities', 'battle_currency_', 'battle_purchasable_', 'deployables', 'storm_of_magic_', 'army_special_abilities', 'ability_to_ui_', 'battle_context_')
EXTERNAL = {'agent_subtypes', 'land_units_to_unit_abilites_junctions', 'melee_weapons', 'missile_weapons', 'missile_weapons_to_projectiles', 'projectiles', 'projectiles_explosions', 'projectile_shrapnels'}
MAGIC_TYPES = {'spell', 'bound', 'rune', 'cataclysm', 'lore'}


def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def readj(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def writej(p, v):
 p=Path(p); p.parent.mkdir(parents=True, exist_ok=True)
 p.write_text(json.dumps(v, indent=2, ensure_ascii=False)+'\n', encoding='utf8', newline='\n')
def csvrows(p):
 with Path(p).open(encoding='utf-8-sig', newline='') as f: return list(csv.DictReader(f))
def writecsv(p, cols, rows):
 p=Path(p); p.parent.mkdir(parents=True, exist_ok=True)
 with p.open('w', encoding='utf8', newline='') as f:
  w=csv.DictWriter(f, fieldnames=cols, lineterminator='\n'); w.writeheader(); w.writerows(rows)
def tsv(p):
 # RPFM quotation marks are literal text, not RFC-4180 quoting.
 lines=Path(p).read_text(encoding='utf-8-sig').splitlines()
 cols=lines[0].split('\t'); meta=lines[1].split('\t')[0].split(';')
 rows=[]
 for n,line in enumerate(lines[2:],3):
  if not line: continue
  values=line.split('\t')
  if len(values)!=len(cols): raise ValueError(f'Ragged TSV {p}:{n}')
  rows.append((n,dict(zip(cols,values))))
 return cols,meta,rows

def owner(table):
 short=table.removesuffix('_tables')
 if short in EXTERNAL or short.startswith(EXCLUDED_PREFIX): return None
 return 'effect_semantics' if short.startswith(('effect_bonus_', 'campaign_effect_scope')) else 'unit_stats/abilities'
def normname(t): return NAMES.get(t.removesuffix('_tables'), t.removesuffix('_tables'))

def verify_source(source):
 source=Path(source); m=readj(source/'source_manifest.json')
 expected=PROFILES.get(m['patch'])
 if not expected or (str(m['steam_build_id']),m['executable_version'])!=expected: raise ValueError('Unsupported source identity')
 sv=m['source_verification']
 for k in ['patch','steam_build_id','executable_version']:
  if str(sv[k])!=str(m[k]): raise ValueError('Conflicting installation evidence')
 files={f['path']:f for f in m['files']}
 if len(files)!=len(m['files']): raise ValueError('Duplicate manifest paths')
 actual={p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file()}-{'source_manifest.json'}
 if actual!=set(files): raise ValueError('Manifest does not cover source files exactly')
 for name,f in files.items():
  p=source/name
  if not p.resolve().is_relative_to(source.resolve()) or digest(p)!=f['sha256'] or p.stat().st_size!=f['bytes']: raise ValueError('Source integrity '+name)
 schema=readj(source/'decoded_schema.json'); discovery=readj(source/'discovery.json')
 if sorted(schema)!=sorted(m['table_folders_requested']) or sorted(schema)!=sorted(discovery['selected_tables']): raise ValueError('Table inventory mismatch')
 expected_paths=sorted(p for p in discovery['db_paths'] if p.split('/')[1] in schema)
 if expected_paths!=sorted(discovery['selected_paths']): raise ValueError('Packed inventory mismatch')
 tables={}; paths=[]
 for name in sorted(files):
  if not name.startswith('db/'): continue
  cols,meta,rows=tsv(source/name); table=name.split('/')[1]
  if meta[0]!='#'+table or meta[2]+'.tsv'!=name: raise ValueError('Bad packed metadata '+name)
  paths.append(meta[2]); d=next(d for d in schema[table] if d['version']==int(meta[1]))
  shape=[]; colours=collections.defaultdict(list)
  for f in d['fields']:
   if f.get('is_part_of_colour') is None: shape.append(f['name'])
   else: colours[f['is_part_of_colour']].append(f['name'])
  for group in colours.values():
   red=next(x for x in group if x.endswith('_r')); prefix=red[:-2]
   if set(group)!={prefix+'_'+c for c in 'rgb'}: raise ValueError('Unsupported colour projection')
   shape.append(prefix+'_hex')
  if len(cols)!=len(set(cols)) or set(cols)!=set(shape): raise ValueError('Schema mismatch '+name)
  fields={f['name']:f for f in d['fields']}; keys=[f['name'] for f in d['fields'] if f['is_key']]
  entry=tables.setdefault(table,dict(columns=cols,definition=d,keys=keys,rows=[],seen=set()))
  if entry['columns']!=cols or entry['definition']!=d: raise ValueError('Mixed table schema '+table)
  for n,r in rows:
   key=tuple(r[k] for k in keys)
   if keys and key in entry['seen']: raise ValueError('Unresolved source-key precedence '+table+str(key))
   entry['seen'].add(key)
   for c,v in r.items():
    typ=fields.get(c,{}).get('field_type')
    if not v: continue
    if typ=='Boolean' and v not in {'true','false'}: raise ValueError('Bad boolean')
    if typ in {'I16','I32','I64','U16','U32','U64'}: int(v)
    if typ in {'F32','F64'}: float(v)
   entry['rows'].append((name,n,r))
 if sorted(paths)!=expected_paths: raise ValueError('Missing exported paths')
 return m,tables


def build(source, output):
 source=Path(source).resolve(); output=Path(output).resolve()
 if not output.is_relative_to(ROOT/'work') or output.exists(): raise ValueError('Use a fresh ignored work/ candidate')
 m,tables=verify_source(source); output.mkdir(parents=True)
 registry=[]; normalized={}; inputs={}; comparisons=[]
 # Pin all normalized skill inputs and source unit identities used below.
 skills=ROOT/'data/skill_trees'; units=ROOT/'data/unit_stats'
 for rel in ['db/main_units_tables/data__.tsv','db/land_units_tables/data__.tsv','db/land_units_to_unit_abilites_junctions_tables/data__.tsv','text/db/unit_abilities__.loc.tsv']:
  pp=units/'source_exports'/rel; inputs[pp.relative_to(ROOT).as_posix()]=digest(pp)
 labels={r['key']:r['text'] for _,r in tsv(units/'source_exports/text/db/unit_abilities__.loc.tsv')[2]}
 for d in [skills, units]:
  dm=readj(d/'dataset_manifest.json')
  if dm['patch']!='9.0': raise ValueError('Reassess owner snapshot before building')
  inputs[(d/'dataset_manifest.json').relative_to(ROOT).as_posix()]=digest(d/'dataset_manifest.json')
 # Compare every overlapping database export. Presentation metadata is not DB data.
 for table,spec in tables.items():
  own=owner(table); rows=[]
  for rel,n,r in spec['rows']:
   rows.append(dict(r,source_path='',source_line=n,source_patch=m['patch']))
  for rel in sorted({r[0] for r in spec['rows']}):
   existing=[]
   for family in ['unit_stats','skill_trees','economy','technology_trees']:
    path=ROOT/'data'/family/'source_exports'/rel
    if path.exists():
     if path.read_text(encoding='utf-8-sig')!=(source/rel).read_text(encoding='utf-8-sig'): raise ValueError('Shared input changed: '+str(path))
     existing.append(path)
   if existing:
    canonical=existing[0]; target=canonical.relative_to(ROOT).as_posix()
    inputs[target]=digest(canonical)
    comparisons.append(dict(path=target,status='identical_text',extracted_sha256=digest(source/rel),retained_sha256=digest(canonical)))
   elif own:
    target='data/'+own+'/source_exports/'+rel
    dest=output/target; dest.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(source/rel,dest)
   else:
    target=''; # Out-of-scope source evidence stays in the archived candidate.
   registry.append(dict(table=table,packed_path=rel,source_path=target,normalized_owner=own or '',extracted_sha256=digest(source/rel),status='canonical_source' if target else 'archived_outside_increment'))
   for row,(rr,_,_) in zip(rows,spec['rows']):
    if rr==rel: row['source_path']=target
  if own:
   name=normname(table); path='data/'+own+'/tables/'+name+'.csv'
   writecsv(output/path,spec['columns']+PROVENANCE,rows)
   normalized[table]=dict(path=path,keys=spec['keys'],columns=spec['columns'],definition=spec['definition'],rows=len(rows))
 writej(output/'data/magic/source_registry.json',registry)
 writej(output/'data/magic/shared_source_comparison.json',dict(source_patch=m['patch'],base_patch='9.0',comparisons=comparisons,scope='Every DB export overlapping this extraction; not a global hotfix audit.'))
 # Reuse original source spelling and exact group membership. Index every ability
 # so source-type classification never erases bound spells labelled "spell".
 def rs(t): return [r for _,_,r in tables[t+'_tables']['rows']]
 abilities={r['key']:r for r in rs('unit_abilities')}; casting={r['key']:r for r in rs('unit_special_abilities')}
 groups=collections.defaultdict(list)
 for r in rs('special_ability_groups_to_unit_abilities_junctions'): groups[r['unit_special_abilities']].append(r['special_ability_groups'])
 magic_keys={k for k,a in abilities.items() if a['source_type'] in MAGIC_TYPES or k in groups}
 members=collections.defaultdict(list)
 for ability,gs in groups.items():
  for g in gs: members[g].append(ability)
 phases=collections.defaultdict(list)
 for r in rs('special_ability_to_special_ability_phase_junctions'): phases[r['special_ability']].append(r)
 phase_abilities=collections.defaultdict(set)
 for a,ps in phases.items():
  for r in ps: phase_abilities[r['phase']].add(a)
 links=collections.defaultdict(list)
 for t,target,kind in [('effect_bonus_value_unit_ability_junctions','unit_ability','ability'),('effect_bonus_value_special_ability_group_junctions','special_ability_group','ability_group'),('effect_bonus_value_special_ability_phase_record_junctions','special_ability_phase','phase')]:
  for rel,n,r in tables[t+'_tables']['rows']:
   targets=[r[target]] if kind=='ability' else members[r[target]] if kind=='ability_group' else sorted(phase_abilities[r[target]])
   if targets: links[r['effect']].append(dict(ability_key=r[target] if kind=='ability' else '',binding_table=normname(t),binding_source_path=next(e['source_path'] for e in registry if e['packed_path']==rel),binding_source_line=n,bonus_value_id=r['bonus_value_id'],target_kind=kind,target_key=r[target]))
 # Per-character indices carry pointers to skill rows, not a second skill tree.
 index=[]; access=collections.Counter(); missing_bindings=[]
 for c in csvrows(skills/'character_index__wh3__9.0.csv'):
  # Field name is checked below against the authoritative index.
  relative=c.get('relative_path') or c.get('file_path') or c.get('path')
  if not relative: raise ValueError('Unknown character index path field '+str(c.keys()))
  p=skills/relative
  if not p.exists(): p=ROOT/relative
  inputs[p.relative_to(ROOT).as_posix()]=digest(p)
  records=csvrows(p); char=next(r for r in records if r['record_type']=='character'); out=[]
  for line,r in enumerate(records,2):
   if r['record_type']!='effect': continue
   for binding in links.get(r['effect_key'],[]):
    targets=[binding['target_key']] if binding['target_kind']=='ability' else members[binding['target_key']] if binding['target_kind']=='ability_group' else sorted(phase_abilities[binding['target_key']])
    targets=set(targets)&magic_keys
    if not targets: continue
    out.append(dict(agent_subtype_key=char['agent_subtype_key'],node_set_key=r['node_set_key'],node_key=r['node_key'],skill_key=r['skill_key'],skill_level=r['skill_level'],effect_key=r['effect_key'],skill_source_path=p.relative_to(ROOT).as_posix(),skill_source_line=line,**binding))
    for a in targets: access[a]+=1
  target='characters/'+char['race_slug']+'/'+char['agent_subtype_key']+'.csv'
  cols=['agent_subtype_key','node_set_key','node_key','skill_key','skill_level','effect_key','skill_source_path','skill_source_line','ability_key','binding_table','binding_source_path','binding_source_line','bonus_value_id','target_kind','target_key']
  if out: writecsv(output/'data/magic'/target,cols,out)
  index.append(dict(agent_subtype_key=char['agent_subtype_key'],character_name=char['character_name'],character_class=char['character_class'],is_caster=char['is_caster'],path=target if out else '',skill_source_path=p.relative_to(ROOT).as_posix(),relation_count=len(out),direct_ability_count=len({r['ability_key'] for r in out if r['ability_key']})))
 writecsv(output/'data/magic/character_index.csv',list(index[0]),index)
 inventory=[]
 for key,a in sorted(abilities.items()):
  inventory.append(dict(ability_key=key,display_name=labels.get('unit_abilities_onscreen_name_'+key,''),source_type=a['source_type'],ability_type=a['type'],magic_candidate='true' if a['source_type'] in MAGIC_TYPES or key in groups else 'false',group_count=len(groups[key]),has_casting_record=str(key in casting).lower(),phase_link_count=len(phases[key]),skill_relation_count=access[key],access_status='skill_binding_present_conditional' if access[key] else 'not_established_by_skill_binding',classification_status='source_type_and_membership_only',overpower_option=a['overpower_option'],requires_effect_enabling=a['requires_effect_enabling']))
 writecsv(output/'data/magic/ability_index.csv',list(inventory[0]),inventory)
 # Report structural foreign keys for every selected normalized relation. Missing
 # engine enums and external namespaces are visible boundaries, never zero.
 unresolved=[]; fk_counts=collections.Counter(); external_cache={}
 for table,spec in tables.items():
  if table not in normalized: continue
  for f in spec['definition']['fields']:
   ref=f.get('is_reference')
   if not ref: continue
   target=ref[0].removesuffix('_tables')+'_tables'; col=ref[1]
   target_rows=tables.get(target)
   values={r[col] for _,_,r in target_rows['rows']} if target_rows else None
   external=False
   if values is None:
    if (target,col) not in external_cache:
     paths=next((sorted((ROOT/'data'/o/'source_exports/db'/target).glob('*.tsv')) for o in ['unit_stats','skill_trees','technology_trees','economy'] if (ROOT/'data'/o/'source_exports/db'/target).exists()),[])
     external_cache[(target,col)]=None
     if paths:
      found=set()
      for p in paths:
       inputs[p.relative_to(ROOT).as_posix()]=digest(p)
       found.update(r[col] for _,r in tsv(p)[2])
      external_cache[(target,col)]=found
    values=external_cache[(target,col)]; external=values is not None
   for rel,n,r in spec['rows']:
    value=r[f['name']]
    if not value: continue
    status=('external_owner_resolved' if external else 'resolved') if values is not None and value in values else 'missing_target_key' if values is not None else 'external_or_unextracted'
    fk_counts[status]+=1
    if status not in {'resolved','external_owner_resolved'}: unresolved.append(dict(source_table=table,source_line=n,source_column=f['name'],target_table=target,target_column=col,target_key=value,status=status))
 writecsv(output/'data/magic/unresolved_relations.csv',['source_table','source_line','source_column','target_table','target_column','target_key','status'],unresolved)
 boundaries=[
  'Inventory includes source records, not a certified inventory of obtainable playable spells; inactive/legacy/scripted access remains unresolved.',
  'Skill bindings describe conditional possibilities; they are not selected skills or proof of active availability. Query retains the source tree and rank conditions.',
  'Item, trait, form, mount and scripted grants are not fully reconstructed; unit grants can be retrieved separately with culture conditions.',
  'The character index covers direct ability, ability-group and phase skill bindings. Unit-set and battle-context binding families are retained under effect semantics but not expanded in character queries.',
  'Lore groups are exact source memberships, including composite and upgraded groups; membership does not grant every group spell to a character.',
  'Source_type is not a complete classifier of ordinary versus bound variants. No key-name classification is used.',
  'Base numeric values and bonus_value_id tokens are reported separately; engine arithmetic, stacking, intensity and tick scheduling are not simulated.',
  'Phase order and recipient flags are source records; runtime simultaneity, trigger and refresh behavior is not fully established.',
  'Negative use/recharge values are native sentinels whose runtime interpretation is unresolved; never negative resources.',
  'Projectile/explosion payloads expose explicitly marked source-only records from the canonical unit source; normalized spell payload closure remains a follow-up.',
 ]
 required=['special_ability_to_special_ability_phase_junctions','special_ability_groups_to_unit_abilities_junctions','special_ability_phase_attribute_effects','special_ability_to_invalid_target_flags','special_ability_to_invalid_usage_flags','special_ability_to_auto_deactivate_flags','special_ability_to_recharge_contexts','special_ability_intensity_settings','unit_ability_superseded_abilities_set_elements']
 recovered=sum(t+'_tables' in normalized for t in required)
 if recovered!=len(required): raise ValueError('Missing required relation family')
 audit=dict(status='partial_source_backed_increment',issue_complete=False,source_tables=len(tables),normalized_tables=len(normalized),ability_records=len(abilities),magic_candidates=sum(r['magic_candidate']=='true' for r in inventory),characters=len(index),characters_with_skill_bindings=sum(bool(r['path']) for r in index),skill_ability_relations=sum(r['relation_count'] for r in index),foreign_keys=dict(fk_counts),missing_relation_families_recovered=recovered,boundaries=boundaries)
 writej(output/'data/magic/coverage.json',audit)
 group_coverage=[dict(group_key=g,ability_count=len(set(aa)),abilities_with_casting=sum(a in casting for a in set(aa)),abilities_with_skill_bindings=sum(bool(access[a]) for a in set(aa)),obtainability_status='not_certified') for g,aa in sorted(members.items())]
 writecsv(output/'data/magic/coverage_by_group.csv',list(group_coverage[0]),group_coverage)
 type_coverage=[dict(source_type=t,ability_count=sum(a['source_type']==t for a in abilities.values()),classification='source_type_only') for t in sorted({a['source_type'] for a in abilities.values()})]
 writecsv(output/'data/magic/coverage_by_source_type.csv',list(type_coverage[0]),type_coverage)
 writej(output/'data/magic/schema_inventory.json',normalized)
 writej(output/'data/magic/input_lock.json',inputs)
 writej(output/'data/magic/extraction_manifest.json',m)
 writej(output/'data/magic/dataset_manifest.json',dict(schema_version=1,base_patch='9.0',extraction_patch=m['patch'],extraction_build=m['steam_build_id'],source_manifest_sha256=digest(source/'source_manifest.json'),source_archive_ref='checkpoint/magic-source-9.0.1-20260927',source_archive_commit='4d16368f1d5ab822197dade576c4e27ce24d5596',coverage='partial',issue=14))
 # Per-owner schemas retain native type/reference metadata and provenance units.
 for own in ['unit_stats/abilities','effect_semantics']:
  writej(output/'data'/own/'schema_inventory.json',{t:s for t,s in normalized.items() if s['path'].startswith('data/'+own+'/')})
  writej(output/'data'/own/'dataset_manifest.json',dict(schema_version=1,extraction_patch=m['patch'],base_patch='9.0',tables={t:s['rows'] for t,s in normalized.items() if s['path'].startswith('data/'+own+'/')},source_registry='data/magic/source_registry.json',source_completeness='partial'))
 files={p.relative_to(output).as_posix():digest(p) for p in sorted(output.rglob('*')) if p.is_file()}
 writej(output/'data/magic/output_manifest.json',files)
 print(json.dumps(audit,indent=2))

if __name__=='__main__':
 p=argparse.ArgumentParser(description=__doc__); sub=p.add_subparsers(dest='command',required=True)
 b=sub.add_parser('build'); b.add_argument('source'); b.add_argument('output')
 v=sub.add_parser('verify-source'); v.add_argument('source')
 a=p.parse_args()
 if a.command=='build': build(a.source,a.output)
 else:
  m,t=verify_source(a.source); print(json.dumps(dict(status='passed',patch=m['patch'],tables=len(t),rows=sum(len(s['rows']) for s in t.values()))))
