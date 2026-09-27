// Development evidence audit, not a production battlefield builder.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {parseRpfmTsv} from './rpfm-tsv.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidence = path.join(root, 'docs/development/battlefields');
const hash = b => createHash('sha256').update(b).digest('hex');
const json = p => JSON.parse(readFileSync(p, 'utf8'));
const errors = [];
let checked = 0;
for (const [dir, manifest] of [['discovery', 'discovery_manifest.json'],
  ['field-probe', 'probe_manifest.json'], ['xml-probe', 'probe_manifest.json']]) {
  for (const f of json(path.join(evidence, dir, manifest)).files) {
    const bytes = readFileSync(path.join(evidence, dir, f.path));
    checked++;
    if (bytes.length !== f.bytes || hash(bytes) !== f.sha256) errors.push(`Evidence mismatch: ${dir}/${f.path}`);
  }
}
const atlasPath = path.join(root, 'data/campaign_map/campaign_atlas__wh3__9.0.gpkg');
const discovery = json(path.join(evidence, 'discovery/discovery_manifest.json'));
if (hash(readFileSync(atlasPath)) !== discovery.atlas_sha256) errors.push('Pinned atlas changed');
const db = new DatabaseSync(atlasPath, {readOnly: true});
const compatibility = [];
for (const table of ['battles_tables', 'battle_catchment_override_group_battles_tables']) {
  const source = `db/${table}/data__.tsv`;
  const expected = db.prepare('SELECT sha256 FROM source_files WHERE source_path=?').get(source)?.sha256;
  const actual = hash(readFileSync(path.join(evidence, 'field-probe', source)));
  compatibility.push({table, byte_identical_to_atlas_source: actual === expected});
  if (actual !== expected) errors.push(`Atlas source differs: ${table}`);
}
const terrainPaths = json(path.join(evidence, 'discovery/paths-terrain.json'));
const families = new Map();
for (const p of terrainPaths) {
  const match = /^terrain\/battles\/([^/]+)\//.exec(p);
  if (!match) continue;
  const prefix = `terrain/battles/${match[1]}/`;
  const group = families.get(prefix) ?? [];
  group.push(p); families.set(prefix, group);
}
const normalize = p => (p ?? '').replaceAll('\\', '/').toLowerCase().replace(/\/*$/, '/');
const maps = db.prepare('SELECT * FROM battle_maps ORDER BY battle_map_key').all();
const mapIndex = maps.map(row => ({battle_map_key: row.battle_map_key,
  source_kind: row.source_kind, asset_prefix: normalize(row.map_location),
  catchment_name: row.catchment_name, tile_upgrade: row.tile_upgrade,
  matching_top_level_asset_count: families.get(normalize(row.map_location))?.length ?? 0,
  status: 'asset_prefix_match_only_not_layout_resolution'}));
const [header, ...lines] = parseRpfmTsv(readFileSync(path.join(evidence, 'field-probe/db/battles_tables/data__.tsv'), 'utf8'));
const battles = lines.filter(r => !r[0].startsWith('#')).map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
const configured = battles.filter(r => r.release === 'true' && (r.singleplayer === 'true' || r.multiplayer === 'true'));
const report = {
  status: errors.length ? 'failed' : 'passed', scope: 'source_discovery_only', errors,
  source_build: discovery.snapshot.steam_build_id, checked_evidence_files: checked,
  atlas_compatibility: compatibility,
  counts: {terrain_asset_paths: terrainPaths.length, top_level_battle_asset_families: families.size,
    atlas_map_records: maps.length, atlas_group_map_variants: db.prepare('SELECT count(*) AS n FROM battle_group_maps').get().n,
    battles_table_rows: battles.length, configured_released_single_or_multiplayer_rows: configured.length,
    atlas_records_with_asset_prefix_match: mapIndex.filter(r => r.matching_top_level_asset_count > 0).length},
  boundaries: ['Configured flags do not prove UI availability or runtime selection.',
    'Asset families and atlas records are not counts of unique playable layouts.',
    'Prefix matches do not decode tile dependencies, deployment, height, or exact variants.',
    'Byte-identical map joins are compatible despite the patch label difference; this does not audit all game data.'],
};
db.close();
console.log(JSON.stringify(process.argv.includes('--map-index') ? {report, map_index: mapIndex} : report, null, 2));
if (errors.length) process.exitCode = 1;
