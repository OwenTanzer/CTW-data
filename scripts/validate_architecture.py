#!/usr/bin/env python3
"""Offline architecture contract checks; no source generation or remote requests."""
import argparse
import csv
import datetime
import json
from pathlib import Path, PurePosixPath
import re
import sqlite3
import sys

ROOT = Path(__file__).resolve().parents[1]
CONNECTIONS = 'docs/dataset_connections.json'
INVENTORY = 'docs/development_inventory.json'
REPOSITORIES = {'OwenTanzer/CTW-data', 'OwenTanzer/CTW-analysis', 'OwenTanzer/CTW-adviser'}
LIFECYCLES = {'production_main', 'development_main', 'source_branch', 'open_pr', 'closed_unmerged', 'historical_note'}
LEVELS = {'extracted', 'normalized', 'source_integrity_validated', 'hypothesis', 'semantically_validated', 'runtime_verified'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read(root, path):
    return json.loads((root / path).read_text(encoding='utf-8'))


def relative(path):
    require(isinstance(path, str) and path and '\\' not in path, f'invalid path: {path!r}')
    p = PurePosixPath(path)
    require(not p.is_absolute() and '..' not in p.parts, f'path escapes repository: {path}')
    return path


def exists(root, path):
    relative(path)
    require((root / path).exists(), f'missing local reference: {path}')


def strings(value, label, allow_empty=False):
    require(isinstance(value, list) and (value or allow_empty), f'{label}: expected list')
    require(all(isinstance(s, str) and s.strip() for s in value), f'{label}: expected nonempty strings')
    require(len(set(value)) == len(value), f'{label}: duplicates')


def text_fields(item, names, label):
    for name in names:
        require(isinstance(item.get(name), str) and item[name].strip(), f'{label}: missing {name}')


def validate(root, catalog, connections, inventory, check_docs=True):
    require(catalog.get('catalog_schema_version') == 2, 'catalog requires explicit v2')
    datasets = catalog['datasets']
    for name, entry in datasets.items():
        require(entry.get('lifecycle') == 'production', f'{name}: development in production route')
        require(entry.get('role') in {'retrieval_dataset', 'shared_owner', 'historical_guides'}, f'{name}: invalid role')
        require(entry['readme'].startswith('data/'), f'{name}: production owner must be under data/')
        for key in ('readme', 'manifest', 'schema', 'validation', 'source_manifest', 'source_registry', 'index', 'coverage', 'compatibility_notes', 'research_spec'):
            if key in entry and isinstance(entry[key], str):
                exists(root, entry[key])
        for group in ('starting_positions', 'objectives'):
            for key, value in entry.get(group, {}).items():
                if key in {'readme', 'manifest', 'schema', 'validation', 'source_manifest'}:
                    exists(root, value)
    require({'shared_abilities', 'effect_semantics'} <= set(datasets), 'shared owners are not discoverable')
    require('cold_mires_hypothesis' not in datasets, 'Cold Mires is not production')
    development = catalog.get('development_datasets', {})
    require('cold_mires_hypothesis' in development, 'development route lost')
    for name, entry in development.items():
        require(name not in datasets and entry.get('status', '').startswith('development_'), f'{name}: invalid development separation')
        for key in ('readme', 'manifest', 'schema', 'validation', 'query', 'build', 'inspection_map'):
            exists(root, entry[key])
    discovery = catalog.get('development_discovery', {})
    text_fields(discovery, ['policy', 'guide'], 'development discovery')
    exists(root, discovery['guide'])
    require(isinstance(discovery.get('routes'), list) and discovery['routes'], 'missing development discovery routes')
    for route in discovery['routes']:
        require(route.get('dataset') in development, 'discovery must target a development dataset')
        text_fields(route, ['task'], 'discovery route')
        strings(route.get('identities'), 'discovery identities')
        require(route.get('default_action') == 'surface_qualified_candidate', 'discovery cannot promote authority')
        require(route.get('automatic_prediction_input') is False, 'discovery cannot silently feed predictions')
        if route['task'] == 'battlefield_preparation':
            key = route.get('atlas_map_key')
            require(isinstance(key, str) and key in route['identities'], 'atlas identity missing from discovery aliases')
            atlas = root / datasets['campaign_map']['primary_records']
            with sqlite3.connect(atlas.resolve().as_uri() + '?mode=ro', uri=True) as db:
                require(db.execute('SELECT 1 FROM battle_maps WHERE battle_map_key=?', (key,)).fetchone(), 'discovery atlas identity does not exist')
    require(set(catalog.get('maintenance', {})) == {'readme', 'architecture', 'connections', 'connection_guide', 'development_inventory', 'development_guide', 'change_process', 'pipeline_guide', 'proposal', 'catalog_migration'}, 'maintenance routing fields changed')
    for value in catalog['maintenance'].values():
        exists(root, value)
    require(connections.get('schema_version') == 1, 'unsupported connection schema')
    require(re.fullmatch('[0-9a-f]{40}', connections.get('audited_data_commit', '')), 'invalid audited data commit')
    endpoints = connections['endpoints']
    owners = {name: str(PurePosixPath(v['readme']).parent) + '/' for name, v in datasets.items()}
    # Most-specific prefix wins: shared abilities must not silently become a magic/unit-owned copy.
    for name, endpoint in endpoints.items():
        owner = endpoint.get('owner')
        require(owner in owners, f'{name}: unknown owner {owner}')
        path = relative(endpoint['path'])
        matched = [key for key, prefix in owners.items() if path.startswith(prefix)]
        require(matched and max(matched, key=lambda key: len(owners[key])) == owner, f'{name}: canonical owner/path mismatch')
        require('/source_exports/' not in path and '/archive/' not in path, f'{name}: raw/archive endpoint advertised as normalized')
        strings(endpoint.get('fields'), name + ' fields')
        text_fields(endpoint, ['namespace'], name)
        paths = sorted(root.glob(path))
        require(paths, f'{name}: endpoint path has no matches: {path}')
        columns = set(endpoint['fields'])
        if endpoint['format'] == 'csv':
            for file in paths:
                with file.open(newline='', encoding='utf-8-sig') as stream:
                    headers = next(csv.reader(stream))
                require(columns <= set(headers), f'{name}: missing fields {columns - set(headers)} in {file.relative_to(root)}')
        elif endpoint['format'] == 'sqlite':
            require(len(paths) == 1 and 'table' in endpoint, f'{name}: invalid SQLite endpoint')
            with sqlite3.connect(paths[0].resolve().as_uri() + '?mode=ro', uri=True) as db:
                table = endpoint['table']
                require(re.fullmatch('[a-z_]+', table), f'{name}: invalid table identifier')
                headers = {row[1] for row in db.execute(f'PRAGMA table_info("{table}")')}
            require(headers and columns <= headers, f'{name}: missing SQLite table/fields')
        else:
            raise ValueError(f'{name}: unsupported endpoint format')
        if 'schema_inventory' in endpoint:
            exists(root, endpoint['schema_inventory'])
            native = read(root, endpoint['schema_inventory']).get(endpoint.get('schema_table'))
            require(native is not None and native['path'] == path, f'{name}: native schema owner/path mismatch')
            require(columns <= set(native['columns']), f'{name}: fields absent from native schema')
    proposed = connections.get('proposed_owners', {})
    require(not (set(proposed) & set(owners)), 'proposed owner shadows production owner')
    for name, owner in proposed.items():
        require(owner.get('repository') == 'CTW-data' and owner.get('status') == 'proposed', f'{name}: invalid proposed owner')
        text_fields(owner, ['issue', 'boundary'], name)
        require(re.fullmatch(r'https://github.com/OwenTanzer/CTW-data/issues/\d+', owner['issue']), f'{name}: invalid proposed owner issue')
    ids = set()
    for item in connections['connections']:
        name = item['id']
        require(name not in ids, f'duplicate connection id: {name}')
        ids.add(name)
        require(item.get('owner') in set(owners) | set(proposed), f'{name}: invalid owner')
        require(item.get('status') in {'production', 'partial', 'unresolved'}, f'{name}: invalid status')
        text_fields(item, ['cardinality', 'conditions', 'missing_boundary', 'example', 'snapshot_requirements'], name)
        strings(item.get('endpoints'), name + ' endpoints')
        require(set(item['endpoints']) <= endpoints.keys(), f'{name}: missing endpoint reference')
        if item['owner'] in proposed:
            require(item['status'] == 'unresolved', f'{name}: proposed owner cannot advertise a production edge')
        else:
            require(item['owner'] in {endpoints[e]['owner'] for e in item['endpoints']}, f'{name}: owner not represented in endpoints')
        for link in item['joins']:
            for side, field_key in [('from', 'from_fields'), ('to', 'to_fields')]:
                require(link[side] in item['endpoints'], f'{name}: join endpoint outside relation')
                strings(link[field_key], name + ' join fields')
                require(set(link[field_key]) <= set(endpoints[link[side]]['fields']), f'{name}: missing join field')
            require(len(link['from_fields']) == len(link['to_fields']), f'{name}: mismatched join arity')
        strings(item.get('evidence'), name + ' evidence')
        for path in item['evidence']:
            exists(root, path)
        strings(item.get('issues'), name + ' issues')
        require(all(re.fullmatch(r'https://github.com/OwenTanzer/CTW-data/issues/\d+', u) for u in item['issues']), f'{name}: invalid issue URL')
    # Known absent contracts cannot become production through a status-only edit.
    required = {'campaign-capability-routes': 'unresolved', 'campaign-rules-to-battlefield': 'partial', 'skill-effects-to-abilities': 'partial'}
    statuses = {x['id']: x['status'] for x in connections['connections']}
    for name, status in required.items():
        require(statuses.get(name) == status, f'{name}: known gap promoted or omitted without a contract migration')
    require(inventory.get('schema_version') == 1, 'unsupported inventory schema')
    datetime.date.fromisoformat(inventory['observed_at'])
    ids = set()
    for item in inventory['records']:
        name = item['id']
        require(name not in ids, f'duplicate inventory id: {name}')
        ids.add(name)
        require(item['repository'] in REPOSITORIES, f'{name}: invalid repository')
        require(re.fullmatch('[0-9a-f]{40}', item.get('commit', '')), f'{name}: immutable commit required')
        relative(item['path'])
        require(item['lifecycle'] in LIFECYCLES, f'{name}: invalid lifecycle')
        strings(item.get('evidence_levels'), name + ' levels')
        require(set(item['evidence_levels']) <= LEVELS, f'{name}: invalid evidence maturity')
        require(item['owner'] in {'CTW-data', 'CTW-analysis', 'CTW-adviser'}, f'{name}: invalid owner')
        strings(item.get('consumers'), name + ' consumers')
        strings(item.get('evidence'), name + ' evidence', allow_empty=True)
        text_fields(item, ['remaining_boundary', 'next_step', 'observed_status', 'observation_scope'], name)
        datetime.date.fromisoformat(item['observed_at'])
        require(item['observed_at'] <= inventory['observed_at'], f'{name}: date exceeds inventory observation')
        for path in item['evidence']:
            exists(root, path)
        if item['repository'] == 'OwenTanzer/CTW-data' and item['lifecycle'] in {'production_main', 'development_main', 'historical_note'}:
            exists(root, item['path'])
        claims = item.get('evidence_claims', [])
        require(isinstance(claims, list), f'{name}: evidence_claims must be a list')
        claimed = set()
        for claim in claims:
            require(isinstance(claim, dict), f'{name}: evidence claim must be an object')
            level = claim.get('level')
            require(level in {'semantically_validated', 'runtime_verified'} and level in item['evidence_levels'], f'{name}: invalid evidence claim level')
            require(level not in claimed, f'{name}: duplicate evidence claim level')
            claimed.add(level)
            text_fields(claim, ['scope', 'method', 'limitations'], name + ' evidence claim')
            artifact = claim.get('artifact', {})
            require(isinstance(artifact, dict), f'{name}: evidence artifact must be an object')
            require(artifact.get('repository') in REPOSITORIES, f'{name}: invalid evidence repository')
            require(re.fullmatch('[0-9a-f]{40}', artifact.get('commit', '')), f'{name}: immutable evidence commit required')
            relative(artifact.get('path'))
        require(set(item['evidence_levels']) & {'semantically_validated', 'runtime_verified'} <= claimed, f'{name}: scoped evidence claim required')
        strings(item.get('tracking'), name + ' tracking')
        require(all(re.fullmatch(r'https://github.com/OwenTanzer/CTW-(?:data|analysis|adviser)/(?:issues|pull)/\d+', u) for u in item['tracking']), f'{name}: invalid tracking URL')
    if check_docs:
        for path, content in render(connections, inventory).items():
            require((root / path).read_text(encoding='utf-8') == content, f'generated guide drift: {path}; run --write-docs')
    return {'status': 'passed', 'production_routes': len(datasets), 'development_routes': len(development), 'endpoints': len(endpoints), 'connections': len(connections['connections']), 'evidence_records': len(inventory['records'])}


def link(path):
    return f'`{path}`' if '*' in path else f'[{path}](../{path})'


def render(connections, inventory):
    lines = ['# Cross-dataset connection contracts', '', '<!-- Generated from dataset_connections.json by scripts/validate_architecture.py. -->', '',
             'These are selected structural contracts, not a complete foreign-key inventory.',
             'Owner manifests/schemas remain authoritative. `production` means the represented',
             'source relation exists; it does not mean runtime behavior is verified.',
             '`partial` retains existing joins plus explicit gaps; `unresolved` supplies no',
             'complete production edge. Never turn unmatched rows into zero/false.', '',
             'For responsibility boundaries, read [repository architecture](architecture/repository-boundaries.md).', '',
             f'Audited Data commit: `{connections["audited_data_commit"]}`.', '']
    for name, owner in connections.get('proposed_owners', {}).items():
        lines += [f'Proposed owner **{name}**: {owner["boundary"]} See [owning issue]({owner["issue"]}).', '']
    for item in connections['connections']:
        lines += [f'## {item["id"]}', '', f'Owner: **{item["owner"]}**. Status: **{item["status"]}**.', '', '| Endpoint | Location | Referenced fields / namespace |', '| --- | --- | --- |']
        for name in item['endpoints']:
            e = connections['endpoints'][name]
            lines += [f'| `{name}` | {link(e["path"])}' + (f' (`{e["table"]}`)' if 'table' in e else '') + f' | {", ".join("`" + f + "`" for f in e["fields"])}; {e["namespace"]} |']
        lines += ['', '**Join edges:** ' + ('; '.join(f'`{j["from"]}.({", ".join(j["from_fields"])})` → `{j["to"]}.({", ".join(j["to_fields"])})`' for j in item['joins']) or 'No direct cross-table edge asserted.'), '']
        for label,key in [('Cardinality','cardinality'),('Conditions','conditions'),('Missing boundary','missing_boundary'),('Snapshot','snapshot_requirements')]:
            lines += [f'**{label}:** {item[key]}', '']
        example = item['example']
        language = 'sql' if example.startswith('SELECT') else 'bash' if example.startswith('python3 ') else None
        lines += ['**Example:**', '', f'```{language}\n{example}\n```' if language else example, '']
        lines += ['Evidence: ' + '; '.join(link(p) for p in item['evidence']) + '.', '', 'Scope references: ' + ', '.join(f'[#{u.rsplit("/",1)[-1]}]({u})' for u in item['issues']) + '.', '']
    state = ['# Development and evidence inventory', '', '<!-- Generated from development_inventory.json by scripts/validate_architecture.py. -->', '', f'Observed **{inventory["observed_at"]} UTC**. {inventory["refresh_policy"]}', '',
             'Lifecycle and evidence maturity are independent. `production_main` in Analysis',
             'or Adviser means published work in that repository, not authoritative Data facts.',
             'Remote artifact links are immutable snapshots. Prior reported tests do not certify',
             'a newer PR head. Local evidence links refer to this Data checkout.', '']
    for item in inventory['records']:
        url=f'https://github.com/{item["repository"]}/tree/{item["commit"]}/{item["path"]}'
        state += [f'## {item["id"]}', '', f'[{item["repository"]}: {item["path"]}]({url}) at `{item["commit"]}`.', '',
                  f'- Owner: {item["owner"]}; consumers: {", ".join(item["consumers"])}.',
                  f'- Lifecycle: **{item["lifecycle"]}**; evidence: {", ".join(item["evidence_levels"])}.',
                  f'- Observation ({item["observed_at"]}): {item["observed_status"]}.',
                  f'- Boundary: {item["remaining_boundary"]}', f'- Next step: {item["next_step"]}', '',
                  item['observation_scope'], '',
                  'Local evidence: ' + ('; '.join(link(p) for p in item['evidence']) or 'Use the immutable external repository snapshot and its owner contracts.') + '.', '',
                  'Tracking: ' + ', '.join(f'[{u.split("/")[-3]} #{u.split("/")[-1]}]({u})' for u in item['tracking']) + '.', '']
        for claim in item.get('evidence_claims', []):
            a = claim['artifact']
            url = f"https://github.com/{a['repository']}/tree/{a['commit']}/{a['path']}"
            state += [f"Evidence claim **{claim['level']}**: {claim['scope']}", '',
                      f"Method: {claim['method']}. Limits: {claim['limitations']}", '',
                      f"[Immutable supporting artifact]({url})", '']
    return {'docs/dataset-connections.md': '\n'.join(lines), 'docs/development-state.md': '\n'.join(state)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-docs', action='store_true')
    args = parser.parse_args()
    catalog, connections, inventory = (read(ROOT, p) for p in ['context_catalog.json', CONNECTIONS, INVENTORY])
    # Files must exist for routing checks even on the first generation.
    if args.write_docs:
        for path, content in render(connections, inventory).items():
            (ROOT / path).write_text(content, encoding='utf-8')
    try:
        result = validate(ROOT, catalog, connections, inventory)
    except (ValueError, KeyError, TypeError, OSError, StopIteration, sqlite3.Error) as error:
        print(json.dumps({'status':'failed', 'error':str(error)}, indent=2), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
