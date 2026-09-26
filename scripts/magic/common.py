"""Exact-key source and CSV helpers; no spell-name or effect arithmetic inference."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = dict(game='warhammer_3', patch='8.1.1', steam_build_id='24237342', executable_version='8.1.1.0')
ARCHIVE_COMMIT = 'f61fd8ab2a65931abb494340a6918faaeedfdd7d'
ARCHIVE_HASH = 'fd8eabe1b1ea0c18076b5c1d5c00cf3a6ee5aa40d0c478b7b79a5b9c6e89f701'
SHARED = {
 'ability_definitions': ('unit_abilities_tables','key','unit_stats/source_exports'),
 'ability_casting': ('unit_special_abilities_tables','key','unit_stats/abilities/source_exports'),
 'ability_phases': ('special_ability_phases_tables','id','unit_stats/source_exports'),
 'phase_stat_effects': ('special_ability_phase_stat_effects_tables',None,'unit_stats/source_exports'),
 'vortices': ('battle_vortexs_tables','vortex_key','unit_stats/abilities/source_exports'),
 'bombardments': ('projectile_bombardments_tables','bombardment_key','unit_stats/abilities/source_exports'),
 'ability_groups': ('special_ability_groups_tables','ability_group','unit_stats/abilities/source_exports'),
}
BINDINGS = {
 'ability_bindings': ('effect_bonus_value_unit_ability_junctions_tables',None,'effect_semantics/source_exports'),
 'ability_group_bindings': ('effect_bonus_value_special_ability_group_junctions_tables',None,'effect_semantics/source_exports'),
 'phase_bindings': ('effect_bonus_value_special_ability_phase_record_junctions_tables',None,'effect_semantics/source_exports'),
 'scopes': ('campaign_effect_scopes_tables','key','effect_semantics/source_exports'),
}
MISSING = {
 'special_ability_to_special_ability_phase_junctions_tables': 'Ability-to-phase lifecycle, ordering and applicability',
 'special_ability_groups_to_unit_abilities_junctions_tables': 'Lore/group membership and group-targeted modifiers',
 'special_ability_phase_attribute_effects_tables': 'Phase attribute payloads',
 'special_ability_to_invalid_target_flags_tables': 'Additional casting target restrictions',
 'special_ability_to_invalid_usage_flags_tables': 'Activation restrictions',
 'special_ability_to_auto_deactivate_flags_tables': 'Termination conditions',
 'special_ability_to_recharge_contexts_tables': 'Recharge conditions',
 'special_ability_intensity_settings_tables': 'Intensity scaling',
 'unit_ability_superseded_abilities_set_elements_tables': 'Replacement set membership',
}
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def read_json(p): return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def write_json(p, value):
 p=Path(p); p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n',encoding='utf8',newline='\n')
def records(p, delimiter=','):
 with Path(p).open(encoding='utf-8-sig',newline='') as f:
  reader=csv.DictReader(f,delimiter=delimiter)
  for r in reader:
   if None in r: raise ValueError('Ragged source '+str(p))
   if next(iter(r.values()),'').startswith('#'):continue
   yield reader.line_num,r

def write_csv(p,columns,rows):
 p=Path(p);p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('w',encoding='utf8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=columns,lineterminator='\n');w.writeheader();w.writerows(rows)
def csv_rows(p):return [r for _,r in records(p)]
def source_rows(base, table):
 result=[]; columns=None
 for p in sorted((Path(base)/'db'/table).glob('*.tsv')):
  with p.open(encoding='utf-8-sig') as f:header=next(csv.reader(f,delimiter='\t'))
  if columns is not None and header!=columns:raise ValueError('Conflicting source headers')
  columns=header
  for line,r in records(p,'\t'):result.append((p,line,r))
 if columns is None:raise ValueError('Missing table '+table)
 return columns,result

def verify_subset(base):
 base=Path(base);m=read_json(base/'source_manifest.json')
 for k,v in SNAPSHOT.items():
  if str(m[k])!=v:raise ValueError('Snapshot mismatch '+k)
 for f in m['files']:
  p=base/f['path']
  if p.is_absolute() and not p.resolve().is_relative_to(base.resolve()):raise ValueError('Unsafe source path')
  if digest(p)!=f['sha256'] or p.stat().st_size!=f['bytes']:raise ValueError('Source integrity '+str(p))
 actual={p.relative_to(base).as_posix() for p in base.rglob('*') if p.is_file() and p.name!='source_manifest.json'}
 if actual!={f['path'] for f in m['files']}:raise ValueError('Source manifest coverage')
 return m
