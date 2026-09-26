import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { validateVictoryConfig } from './validate-victory-config.mjs';
import { tableAt, generateObjective } from './victory-config.mjs';
const atlas=process.env.CTW_VICTORY_ATLAS??'data/campaign_map/campaign_atlas__wh3__9.0.gpkg';
const source=process.env.CTW_VICTORY_SOURCE??'data/campaign_map/objective_source_exports';
await mkdir('work/test-victory',{recursive:true});
await copyFile(atlas,'work/test-victory/atlas.gpkg');
const db=new DatabaseSync('work/test-victory/atlas.gpkg');
function objectives(variant,tier='short') {
  return db.prepare('SELECT objective_key,objective_type FROM objectives WHERE variant_key=? AND victory_tier=? ORDER BY objective_order').all(variant,tier).map(r=>[r.objective_type,db.prepare('SELECT raw_condition FROM objective_conditions WHERE objective_key=? ORDER BY condition_order').all(r.objective_key).map(c=>c.raw_condition)]);
}
// Hand-transcribed expectations from config lines 1859-1866 and helper semantics,
// independent of the parser/generator being tested. Zero is truthy in Lua.
test('Nagash active short victory retains four source objectives and zero progress',()=> {
 assert.deepEqual(objectives('wh3_dlc29_nag_host_of_nagash'),[
 ['DESTROY_FACTION',['faction wh2_dlc09_tmb_khemri','faction wh3_main_emp_cult_of_sigmar','confederation_valid']],
 ['PERFORM_RITUAL',['ritual_category NAGASH_MORTARCH_LORDS','total 2','override_text mission_text_text_wh3_dlc29_nagash_unlock_mortarchs_short']],
 ['SCRIPTED',['script_key wh3_dlc29_nag_build_landmark_short','override_text mission_text_text_wh3_dlc29_nag_build_landmark_short']],
 ['SCRIPTED',['script_key wh3_dlc29_nag_black_pyramid_sigils_short','override_text mission_text_text_wh3_dlc29_nag_black_pyramid_sigils','total 50','count 0']],
 ]);
});
test('Khazrak rework replaces generic settlement objectives, with explicit unit-size boundary',()=> {
 const rows=objectives('wh_dlc03_bst_beastmen');
 assert.deepEqual(rows.map(r=>r[0]),['DESTROY_FACTION','PERFORM_RITUAL','PERFORM_RITUAL','KILL_X_ENTITIES_BY','HAVE_AT_LEAST_X_OF_A_POOLED_RESOURCE','SCRIPTED']);
 assert.deepEqual(rows[0][1],['faction wh_main_emp_middenland','confederation_valid']);
 assert.deepEqual(rows[3][1],['total 2800 * runtime_unit_size_multiplier','unit_set bst_dlc03_bestigors','override_text mission_text_text_wh3_dlc29_bst_kill_n_entities_with_bestigor_herd_short']);
 assert.deepEqual(rows[4][1],['pooled_resource bst_ruination','total 60','additive true','override_text mission_text_text_wh3_dlc29_bst_reach_ruination_tier_short']);
 assert.equal(db.prepare("SELECT numeric_value FROM objective_conditions WHERE objective_key='wh_dlc03_bst_beastmen:short:004' AND condition_type='total'").get().numeric_value,null);
});
test('Vlad and Isabella preserve distinct lord selectors and their different requirements',()=> {
 const v=objectives('wh_dlc04_vmp_vlad_con_carstein'),i=objectives('wh_pro02_vmp_isabella_von_carstein');
 assert.equal(v.length,4);assert.equal(i.length,5);
 assert.deepEqual(v[0],['SCRIPTED',['script_key wh3_dlc29_vmp_vlad_perform_carstein_empower_rituals_short','override_text mission_text_text_wh3_dlc29_vmp_vlad_perform_carstein_empower_rituals','total 3','count 0','count_completion']]);
 assert.deepEqual(i[0],['SPEND_AT_LEAST_X_OF_A_POOLED_RESOURCE',['total 7500','pooled_resource wh3_dlc29_vmp_power','override_text mission_text_text_wh3_dlc29_vmp_isabella_spend_shyish_on_recruitement','pooled_resource_factor recruitment']]);
 assert.deepEqual(i[3],['CONSTRUCT_N_BUILDINGS_INCLUDING',['total 1','faction wh_main_vmp_schwartzhafen','building_level wh3_dlc29_vmp_vampires_3']]);
 assert.equal(db.prepare("SELECT COUNT(DISTINCT variant_key) n FROM objectives WHERE faction_key='wh_main_vmp_schwartzhafen'").get().n,2);
});
test('all configured objectives reconcile against verified source',async()=>assert.equal(await validateVictoryConfig(db,source),1175));
for(const [name,sql] of [
 ['obsolete generic objective',"UPDATE objectives SET objective_type='OCCUPY_LOOT_RAZE_OR_SACK_X_SETTLEMENTS' WHERE objective_key='wh3_dlc29_nag_host_of_nagash:short:001'"],
 ['omitted configured objective',"DELETE FROM objective_conditions WHERE objective_key='wh_dlc03_bst_beastmen:short:004'; DELETE FROM objective_boundaries WHERE objective_key='wh_dlc03_bst_beastmen:short:004'; DELETE FROM objectives WHERE objective_key='wh_dlc03_bst_beastmen:short:004'"],
 ['collapsed lord variant',"UPDATE objectives SET variant_key='wh_main_vmp_schwartzhafen' WHERE variant_key='wh_pro02_vmp_isabella_von_carstein'"],
 ['lost zero condition',"DELETE FROM objective_conditions WHERE objective_key='wh3_dlc29_nag_host_of_nagash:short:004' AND condition_type='count'"],
 ['invented fixed kill threshold',"UPDATE objective_conditions SET numeric_value=2800 WHERE objective_key='wh_dlc03_bst_beastmen:short:004' AND condition_type='total'"],
 ['removed runtime boundary',"DELETE FROM objective_boundaries WHERE kind='dynamic_objectives_after_short_victory'"],
]) test(`validator rejects ${name}`,async()=>{db.exec('BEGIN');try{db.exec(sql);await assert.rejects(validateVictoryConfig(db,source));}finally{db.exec('ROLLBACK');}});
test('bounded parser rejects executable Lua and unknown generators',async()=> {
 assert.throws(()=>tableAt('x = { os.execute("bad") }','x =',true));
 const utils=await readFile(source+'/script/campaign/main_warhammer/victory_objectives_config_utils.lua','utf8');
 assert.throws(()=>generateObjective({helper:'generate_UNKNOWN_objective',args:[]},utils));
});
