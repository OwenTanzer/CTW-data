import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSnapshot } from './snapshot-build.mjs';
import { readVictoryConfig, SOURCE_PATH } from './victory-config.mjs';

// Reconcile each configured objective/condition/variant, not merely faction counts.
export async function validateVictoryConfig(db,source) {
  const snapshot=await buildSnapshot(source);
  if(snapshot.context.patch!=='9.0')throw Error('Expected 9.0 objective evidence');
  for (const required of [SOURCE_PATH+'victory_objectives.lua', SOURCE_PATH+'victory_objectives_config.lua', SOURCE_PATH+'victory_objectives_config_utils.lua', 'script/campaign/wh3_dlc29_archaon_narrative.lua']) {
    if (!snapshot.manifest.files.some(entry => entry.path === required)) throw Error(`Missing verified objective dependency: ${required}`);
  }
  for(const entry of snapshot.manifest.files) {
    const actual=db.prepare('SELECT sha256,bytes FROM source_files WHERE source_path=?').get(entry.path);
    if(!actual||actual.sha256!==entry.sha256||actual.bytes!==entry.bytes)throw Error(`Objective source provenance mismatch: ${entry.path}`);
  }
  const config=await readFile(path.join(source,SOURCE_PATH,'victory_objectives_config.lua'),'utf8');
  const utils=await readFile(path.join(source,SOURCE_PATH,'victory_objectives_config_utils.lua'),'utf8');
  const archaon=await readFile(path.join(source,'script/campaign/wh3_dlc29_archaon_narrative.lua'),'utf8');
  const groups=(helper,key)=> {
    const column=helper.startsWith('province')?'r.province_key':'r.region_key';
    const rows=db.prepare(`SELECT DISTINCT ${column} value FROM region_groups g JOIN regions r USING(region_key) WHERE g.region_group_key=? AND ${column} IS NOT NULL ORDER BY value`).all(key);
    if(!rows.length)throw Error(`Missing group ${key}`);return rows.map(r=>r.value);
  };
  const expected=readVictoryConfig(config,utils,db.prepare('SELECT faction_key FROM factions WHERE playable=1').all().map(r=>r.faction_key),groups,archaon);
  const actual=db.prepare('SELECT * FROM objectives').all();
  if(expected.length!==actual.length)throw Error(`Configured objective count differs: ${actual.length}/${expected.length}`);
  const byKey=new Map(actual.map(r=>[r.objective_key,r]));
  for(const row of expected) {
    const key=`${row.variant}:${row.tier}:${String(row.order).padStart(3,'0')}`;
    const stored=byKey.get(key);
    if(!stored || stored.faction_key!==row.faction || stored.variant_key!==row.variant || stored.objective_type!==row.type || stored.victory_tier!==row.tier || stored.objective_order!==row.order || stored.source_scope!=='active_9.0_config' || stored.source_scope_key!==row.variant || stored.helper_key!==row.helper)throw Error(`Configured objective differs: ${key}`);
    const conditions=db.prepare('SELECT * FROM objective_conditions WHERE objective_key=? ORDER BY condition_order').all(key);
    if(conditions.length!==row.conditions.length)throw Error(`Configured condition count differs: ${key}`);
    row.conditions.forEach((raw,i)=> {
      const m=raw.match(/^(\S+)(?:\s+(.+))?$/),target=m?.[2]??null;
      const numeric=target!==null&&Number.isFinite(Number(target))?Number(target):null;
      const c=conditions[i];
      if(c.condition_order!==i+1||c.raw_condition!==raw||c.condition_type!==m[1]||c.target_key!==target||c.numeric_value!==numeric)throw Error(`Configured condition differs: ${key}/${i+1}`);
    });
    const boundaries=db.prepare('SELECT kind,detail FROM objective_boundaries WHERE objective_key=? ORDER BY boundary_order').all(key);
    if(JSON.stringify(boundaries)!==JSON.stringify(row.boundaries.map(b=>({kind:b.kind,detail:JSON.stringify(b)}))))throw Error(`Objective boundary differs: ${key}`);
  }
  return expected.length;
}
