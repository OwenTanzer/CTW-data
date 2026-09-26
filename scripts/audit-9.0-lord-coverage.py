"""Read-only reconciliation of existing unit/skill coverage; no new mechanics model."""
import csv
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def csv_rows(path):
    with path.open() as stream:
        return list(csv.DictReader(stream))

def source_rows(name):
    path = ROOT / f'data/unit_stats/source_exports/db/{name}_tables/data__.tsv'
    with path.open() as stream:
        return list(csv.DictReader((line for line in stream if not line.startswith('#')), delimiter='\t'))

scope = json.loads((ROOT / 'scripts/scope-9.0.json').read_text())
main = {r['unit']: r for r in source_rows('main_units')}
permissions = source_rows('units_custom_battle_permissions')
coverage = []
for race in scope['UNIT_ROSTERS']:
    path = ROOT / f"data/unit_stats/normalized/{race['slug']}__wh3__9.0__ultra.csv"
    keys = {r['unit_key'] for r in csv_rows(path)}
    permitted = {r['unit'] for r in permissions if r['faction'] == race['faction_key'] and r['unit'] in main}
    missing = sorted(permitted - keys)
    coverage.append({'race': race['slug'], 'normalized_file': str(path.relative_to(ROOT)),
                     'permission_only_candidates_missing': missing,
                     'new_dlc29_candidates_missing': [k for k in missing if k.startswith('wh3_dlc29_')],
                     'status': 'requires_source_identity_and_scope_review' if missing else 'no_gap_in_this_comparison'})

index = csv_rows(ROOT / 'data/skill_trees/character_index__wh3__9.0.csv')
targets = ['Vlad', 'Isabella', 'Heinrich Kemmler', 'Helman Ghorst', 'Red Duke', 'Throt', 'Ikit', 'Skrolk',
           'Settra', 'Arkhan', 'Arch Lector', 'Herald of Nurgle', 'Exalted Great Unclean One', 'Lahmian', 'Necrarch']
skills = []
for row in index:
    if not any(t.lower() in row['character_name'].lower() for t in targets):
        continue
    path = ROOT / 'data/skill_trees' / row['relative_path']
    records = csv_rows(path)
    evidence = [{k: r[k] for k in ['record_type', 'skill_key', 'skill_name', 'skill_unlocked_at_rank',
                                 'effect_key', 'effect_description', 'effect_scope', 'effect_value', 'ancillary_key']}
                for r in records if r['record_type'] in ['node', 'effect', 'ancillary_grant', 'dilemma_grant']
                and ('dlc29' in r['skill_key'] or 'stormfiend' in r['effect_description'].lower()
                     or 'becomes a' in r['effect_description'])]
    skills.append({'character': row['character_name'], 'subtype': row['agent_subtype_key'],
                   'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                   'status': 'current_file_present_not_complete_change_reconciliation', 'evidence': evidence})
report = {'patch': '9.0', 'steam_build_id': 25507028, 'review_date': '2026-09-26',
          'scope': 'Existing unit and skill tables only; permission differences are candidates, not automatic inclusion decisions.',
          'unit_permission_comparison': coverage, 'skill_evidence': skills,
          'excluded_new_capabilities': ['campaign lifecycle/state simulation', 'new ability phase model', 'new item effects model'],
          'completion': 'partial_reconciliation_remaining_in_scope_candidates_require_review'}
out = ROOT / 'docs/development/update-9.0/lord-coverage-reconciliation.json'
out.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({'races_with_candidates': sum(bool(r['permission_only_candidates_missing']) for r in coverage),
                  'candidate_roster_rows': sum(len(r['permission_only_candidates_missing']) for r in coverage),
                  'dlc29_candidate_roster_rows': sum(len(r['new_dlc29_candidates_missing']) for r in coverage),
                  'skill_files_checked': len(skills)}))
for row in coverage:
    if row['new_dlc29_candidates_missing']:
        print(row['race'], len(row['new_dlc29_candidates_missing']), row['new_dlc29_candidates_missing'][:5])
