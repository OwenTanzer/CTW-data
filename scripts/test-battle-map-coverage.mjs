import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { battleMapCoverageErrors } from './battle-map-coverage.mjs';

const source = new DatabaseSync(process.env.CTW_BATTLE_ATLAS ?? 'data/campaign_map/campaign_atlas__wh3__9.0.gpkg', { readOnly: true });
function candidate() {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE source_files(source_path TEXT,sha256 TEXT); CREATE TABLE battle_group_maps(battle_group_key TEXT,battle_map_key TEXT,catchment_name TEXT,tile_upgrades TEXT)');
  for (const r of source.prepare('SELECT source_path,sha256 FROM source_files').all()) db.prepare('INSERT INTO source_files VALUES (?,?)').run(r.source_path,r.sha256);
  for (const r of source.prepare('SELECT * FROM battle_group_maps').all()) db.prepare('INSERT INTO battle_group_maps VALUES (?,?,?,?)').run(r.battle_group_key,r.battle_map_key,r.catchment_name,r.tile_upgrades);
  return db;
}
test('complete source variants reconcile', () => {
  const db=candidate(); assert.deepEqual(battleMapCoverageErrors(db),[]); db.close();
});
test('reject historical pair-only collapse even when all map identities survive', () => {
  const db=candidate();
  db.exec('DELETE FROM battle_group_maps WHERE rowid NOT IN (SELECT min(rowid) FROM battle_group_maps GROUP BY battle_group_key,battle_map_key)');
  assert(battleMapCoverageErrors(db).some(e=>e.startsWith('Missing battle-map variants:'))); db.close();
});
test('reject lost tile-upgrade qualification', () => {
  const db=candidate();
  assert(db.prepare('SELECT count(*) AS n FROM battle_group_maps WHERE tile_upgrades IS NOT NULL').get().n>0);
  db.exec('UPDATE battle_group_maps SET tile_upgrades=NULL WHERE rowid=(SELECT rowid FROM battle_group_maps WHERE tile_upgrades IS NOT NULL LIMIT 1)');
  assert(battleMapCoverageErrors(db).length>0); db.close();
});
test('lookup view exposes relation-specific catchment and tile variants', () => {
  const expected = source.prepare(`SELECT DISTINCT g.battle_group_key,g.battle_map_key,g.catchment_name,g.tile_upgrades
    FROM battle_group_maps g JOIN battle_selection_rules r USING(battle_group_key)`).all();
  const actual = source.prepare(`SELECT DISTINCT battle_group_key,battle_map_key,catchment_name,map_tile_upgrades AS tile_upgrades
    FROM battle_context_reference WHERE battle_map_key IS NOT NULL`).all();
  const canon = rows => rows.map(r => JSON.stringify([r.battle_group_key,r.battle_map_key,r.catchment_name,r.tile_upgrades])).sort();
  assert.deepEqual(canon(actual), canon(expected));
});
