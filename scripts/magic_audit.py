"""Build companion audits from verified sources, then certify deterministic outputs."""
import collections
import csv
import hashlib
import io
import json
import subprocess
from pathlib import Path
from magic_pipeline import ROOT, csvrows, digest, readj, writecsv, writej, tsv

def fingerprint(row): return hashlib.sha256(json.dumps(row,sort_keys=True,separators=(',',':')).encode()).hexdigest()

def baseline_check(base):
 baseline=readj(ROOT/'scripts/magic_payload_baseline.json');result={}
 for rel,spec in baseline['files'].items():
  rows=csvrows(Path(base)/rel)
  current=collections.Counter(fingerprint({c:r[c] for c in spec['columns']}) for r in rows)
  missing=collections.Counter(spec['row_fingerprints'])-current
  if missing: raise ValueError('Pre-pass payload/weapon values changed: '+rel)
  if 'unit_weapon_links' in rel and len(rows)!=spec['row_count']: raise ValueError('Weapon links changed')
  result[rel]=dict(retained_rows=spec['row_count'],added_rows=len(rows)-spec['row_count'],added_columns=[c for c in rows[0] if c not in spec['columns']],changed_existing_rows=0)
 return dict(baseline_commit=baseline['commit'],status='passed',files=result)

def access_packet(c,subtype,main,grants,mounts,defs):
 base=subtype['associated_unit_override'];missing=[];forms=[]
 if not base: missing.append('agent_subtype.associated_unit_override:blank; requires agent/culture/default mapping')
 unit_routes=[(base,dict(kind='associated_unit_override',record=subtype))] if base else []
 unit_routes.extend((r['mounted_unit_key'],dict(kind='mount_variant',record=r,unlock_status='mount_selection_and_unlock_not_evaluated')) for r in mounts if r['base_unit_key']==base)
 for key,via in unit_routes:
  unit=main.get(key)
  if not unit: missing.append('main_unit:'+key);continue
  links=[dict(record=r,requires_effect_enabling=defs.get(r['ability'],{}).get('requires_effect_enabling'),availability='conditional_unit_definition_not_proof_of_active_access') for r in grants[unit['land_unit']]]
  forms.append(dict(main_unit_key=key,land_unit_key=unit['land_unit'],via=via,ability_links=links))
 missing.extend(['item_trait_and_script_acquisition_not_fully_indexed','scripted_transformations_and_dynamic_forms_not_fully_indexed'])
 packet=dict(agent_subtype_key=c['agent_subtype_key'],skill_relation_count=int(c['relation_count']),unit_forms=forms,unresolved_routes=missing,interpretation='No indexed skill grant does not mean cannot cast; source caster flags do not establish access.')
 return packet

def finish_candidate(output, source, tables, registry, inputs):
 unitout=output/'data/unit_stats'
 subprocess.run(['node',str(ROOT/'scripts/build-unit-dataset.mjs'),str(ROOT/'data/unit_stats/source_exports'),str(unitout),str(source)],check=True,stdout=subprocess.DEVNULL)
 # Original roster/component outputs are rebuilt by their owner, never copied or
 # manually patched. Preserve their immutable source pins in the combined lock.
 for p in (ROOT/'data/unit_stats/source_exports').rglob('*'):
  if p.is_file(): inputs[p.relative_to(ROOT).as_posix()]=digest(p)
 writej(output/'data/magic/payload_baseline_comparison.json',baseline_check(output))
 provenance=[]
 for table,kind in [('projectiles_tables','projectile'),('projectiles_explosions_tables','explosion')]:
  keys={r[kind+'_key'] for r in csvrows(unitout/'lookups'/(('projectiles' if kind=='projectile' else 'explosions')+'__wh3__9.0.csv'))}
  for rel,n,r in tables[table]['rows']:
   if r['key'] in keys:
    provenance.append(dict(kind=kind,key=r['key'],source_path=next(e['source_path'] for e in registry if e['packed_path']==rel),source_line=n,source_patch='9.0.1'))
 writecsv(unitout/'abilities/payload_provenance.csv',['kind','key','source_path','source_line','source_patch'],provenance)
 available={p.split('/')[1] for p in readj(source/'discovery.json')['db_paths']}
 mechanical=[]
 for row in csvrows(output/'data/magic/unresolved_relations.csv'):
  target=row['target_table']
  if target.startswith(('audio_','particle_','composite_','videos','battle_vortex_composite','projectile_display','special_ability_phase_display','entity_vfx','ancillary_uniqueness')): category='presentation_or_audio'
  elif target not in available: category='engine_definition_no_packed_table'
  else: category='unextracted_dependency'
  mechanical.append(dict(row,dependency_category=category))
 writecsv(output/'data/magic/dependency_audit.csv',list(mechanical[0]),mechanical)
 counts=collections.Counter(r['dependency_category'] for r in mechanical)
 writej(output/'data/magic/mechanical_definition_coverage.json',dict(categories=dict(counts),interpretation='No packed table is an evidence boundary, not proof of engine semantics. Packed unresolved dependencies remain explicit.',by_target=[dict(table=t,category=c,reference_count=n) for (t,c),n in sorted(collections.Counter((r['target_table'],r['dependency_category']) for r in mechanical).items())]))
 def source_rows(name): return [dict(r,source_path=next(e['source_path'] for e in registry if e['packed_path']==rel),source_line=str(n),source_patch='9.0.1') for rel,n,r in tables[name+'_tables']['rows']]
 subtypes={r['key']:r for r in source_rows('agent_subtypes')}
 defs={r['key']:r for r in source_rows('unit_abilities')}
 main={r['unit']:r for _,r in tsv(ROOT/'data/unit_stats/source_exports/db/main_units_tables/data__.tsv')[2]}
 grants=collections.defaultdict(list)
 for r in source_rows('land_units_to_unit_abilites_junctions'): grants[r['land_unit']].append(r)
 mounts=csvrows(unitout/'lookups/unit_mount_variants__wh3__9.0__ultra.csv')
 access_coverage=[]
 for c in csvrows(output/'data/magic/character_index.csv'):
  packet=access_packet(c,subtypes[c['agent_subtype_key']],main,grants,mounts,defs)
  forms=packet['unit_forms'];missing=packet['unresolved_routes']
  writej(output/'data/magic/access'/ (c['agent_subtype_key']+'.json'),packet)
  access_coverage.append(dict(agent_subtype_key=c['agent_subtype_key'],unit_forms=len(forms),unit_ability_links=sum(len(r['ability_links']) for r in forms),skill_relations=c['relation_count'],access_completeness='partial',unresolved_route_count=len(missing)))
 writecsv(output/'data/magic/coverage_by_character.csv',list(access_coverage[0]),access_coverage)
 writej(output/'data/magic/input_lock.json',inputs)
 # Bootstrap a candidate reader only after all query inputs have been materialized.
 writej(output/'data/magic/output_manifest.json',{p.relative_to(output).as_posix():digest(p) for p in sorted(output.rglob('*')) if p.is_file() and p.name!='output_manifest.json'})
 from query_magic import Magic
 db=Magic(output);coverage=[]
 for r in csvrows(output/'data/magic/ability_index.csv'):
  if r['magic_candidate']!='true': continue
  packet=db.payload(r['ability_key']);sc=packet['structural_coverage']
  coverage.append(dict(ability_key=r['ability_key'],status=sc['status'],node_count=sc['node_count'],edge_count=sc['edge_count'],missing_reference_count=len(sc['missing_references']),unnormalized_component_count=len(sc['unnormalized_components']),runtime_status='not_evaluated'))
 writecsv(output/'data/magic/coverage_by_variant.csv',list(coverage[0]),coverage)
 # The caller writes the final manifest; don't hash a previous manifest into itself.
 (output/'data/magic/output_manifest.json').unlink()
