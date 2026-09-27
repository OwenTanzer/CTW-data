"""Account for retained source paths without treating file deltas as gameplay proof."""
import collections
import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / "docs/development/update-9.0"
inventory = json.loads((BASE / "source-inventory.json").read_text())
source = (ROOT / "scripts/build-unit-dataset.mjs").read_text()
skills = (ROOT / "scripts/build-skill-trees.mjs").read_text()
economy = (ROOT / "scripts/build-economy-dataset.mjs").read_text()

def quoted_names(text, marker, end):
    block = text.split(marker, 1)[1].split(end, 1)[0]
    return set(re.findall(r'"([a-z][a-z0-9_]+)"', block))

unit_tables = quoted_names(source, 'const tables = Object.fromEntries(', '].map(async')
skill_tables = quoted_names(skills, 'const TABLE_NAMES = [', '];')
skill_loc = quoted_names(skills, 'const locFiles = [', '];')
econ_tables = set(re.findall(r'loadTable\("([a-z][a-z0-9_]+)"\)', economy))
econ_loc = {'building_culture_variants__', 'building_chains__', 'factions__'}
manifests = {}
for owner in ('unit_stats', 'skill_trees', 'economy', 'technology_trees'):
    p = ROOT / 'data' / owner / 'source_exports/source_manifest.json'
    manifests[owner] = {r['path']: r for r in json.loads(p.read_text())['files']}

rows = []
for item in inventory['files']:
    owner, rel = item['owner'], item['path'].split('/source_exports/', 1)[1]
    path = ROOT / item['path']
    if not path.is_file():
        raise ValueError(f'Absent retained 9.0 source: {path}')
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    if item['status'] != 'unchanged' and digest != item['new_sha256']:
        raise ValueError(f'Changed source differs from pinned inventory: {path}')
    if rel in manifests.get(owner, {}):
        m = manifests[owner][rel]
        if digest != m['sha256'] or path.stat().st_size != m['bytes']:
            raise ValueError(f'Current source differs from extraction manifest: {path}')
    elif owner != 'campaign_map' and rel.startswith(('db/', 'text/db/')):
        raise ValueError(f'Unmanifested export: {path}')
    table = rel.split('/')[1] if rel.startswith('db/') else None
    loc = rel.rsplit('/', 1)[-1].replace('.loc.tsv', '') if rel.startswith('text/db/') else None
    if owner == 'campaign_map':
        route = 'atlas_and_start_source_or_provenance'
    elif rel in ('source_manifest.json', 'decoded_schema.json', 'discovery.json', 'node_set_precedence.json', 'script_evidence.json'):
        route = 'extraction_or_selector_provenance'
    elif owner == 'unit_stats':
        route = ('direct_unit_builder_table' if table in unit_tables else
                 'retained_unit_auxiliary_db_source' if table else
                 'unit_name_localization' if loc == 'land_units__' else
                 'retained_localization_outside_numeric_schema' if loc else 'retained_auxiliary_source')
    elif owner == 'skill_trees':
        route = ('direct_skill_builder_table' if table in skill_tables else
                 'retained_skill_source_outside_schema' if table else
                 'direct_skill_localization' if loc in skill_loc else
                 'retained_localization_outside_skill_schema' if loc else 'retained_auxiliary_source')
    elif owner == 'economy':
        route = ('direct_economy_builder_table' if table in econ_tables else
                 'retained_economy_source_outside_standardized_columns' if table else
                 'direct_economy_localization' if loc in econ_loc else
                 'retained_localization_outside_economy_schema' if loc else 'retained_auxiliary_source')
    elif owner == 'technology_trees':
        route = ('loaded_technology_source_subject_to_active_selector' if table else
                 'loaded_technology_localization' if loc else 'extraction_or_selector_provenance')
    else:
        raise ValueError(owner)
    rows.append({**item, 'current_sha256': digest, 'route': route})

if len(rows) != 448 or any(r['status'] == 'removed' for r in rows):
    raise ValueError('Unexpected retained-source inventory shape')
summary = {o: dict(sorted(collections.Counter(r['route'] for r in rows if r['owner'] == o and r['status'] != 'unchanged').items())) for o in sorted({r['owner'] for r in rows})}
report = {
    'baseline_commit': inventory['old_commit'],
    'source_checkpoint_commit': inventory['new_commit'],
    'snapshot': '9.0 / Steam 25507028',
    'files_checked': len(rows),
    'changed_file_routes': summary,
    'limits': 'Hash equality proves source identity, not completeness of builder selection or gameplay semantics. Direct inputs undergo separate owner validation. Source-only, localization and bespoke campaign changes require explicit scope or claim review. The official article disposition register supplies that second layer.',
    'files': rows,
}
(BASE / 'final-source-routing.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(summary, indent=2))
