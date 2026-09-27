import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parseRpfmTsv } from './rpfm-tsv.mjs';

export function battleMapCoverageErrors(db) {
  const errors = [];
  const bytes = readFileSync(new URL('../data/campaign_map/battle_source_exports/battle_catchment_override_group_battles.tsv', import.meta.url));
  const sourcePath = 'db/battle_catchment_override_group_battles_tables/data__.tsv';
  const recorded = db.prepare('SELECT sha256 FROM source_files WHERE source_path=?').get(sourcePath);
  if (recorded?.sha256 !== createHash('sha256').update(bytes).digest('hex'))
    return ['Battle-map source evidence hash disagrees with atlas provenance'];
  const [header, ...lines] = parseRpfmTsv(bytes.toString('utf8'));
  const expected = new Set(lines.filter(row => row.some(Boolean) && !row[0].startsWith('#')).map(row => {
    const r = Object.fromEntries(header.map((h, i) => [h, row[i] ?? '']));
    return JSON.stringify([r.group, 'location:' + r.battle_map_location, r.catchment_name || null, r.tile_upgrades || null]);
  }));
  const rows = db.prepare('SELECT battle_group_key,battle_map_key,catchment_name,tile_upgrades FROM battle_group_maps').all();
  const actual = new Set(rows.map(r => JSON.stringify([r.battle_group_key,r.battle_map_key,r.catchment_name,r.tile_upgrades])));
  const missing = [...expected].filter(k => !actual.has(k));
  const extra = [...actual].filter(k => !expected.has(k));
  if (missing.length) errors.push(`Missing battle-map variants: ${missing.length}; example ${missing[0]}`);
  if (extra.length) errors.push(`Unexpected battle-map variants: ${extra.length}; example ${extra[0]}`);
  if (actual.size !== rows.length) errors.push('Duplicate battle-map variants');
  return errors;
}
