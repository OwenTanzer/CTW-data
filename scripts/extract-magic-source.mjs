// Read-only gap extraction. Run through extract-magic-source.ps1.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256, filesBelow} from './effect-foundation-lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,process.argv[2]??'work/magic-source');
import {beginSource, verifyDecoder, finishSource} from './snapshot-source.mjs';
const context=await beginSource(output,root,process.argv[3]??'9.0');
const SNAPSHOT=context.profile;
const {call}=await import('./technology-rpfm.mjs');
await call('set_game_selected',{game_name:SNAPSHOT.game,rebuild_dependencies:false});
const decoder=await verifyDecoder(call,context);
const pack=(await call('load_all_ca_pack_files'))?.StringContainerInfo?.[0];
const definitions=(await call('get_schema'))?.Schema?.definitions;
if(!pack||!definitions)throw Error('Missing pack/schema');
const listing=await call('get_packed_files_names_starting_with_path_from_all_sources',{path:JSON.stringify({Folder:'db'})});
const dbPaths=[...new Set(listing.HashMapDataSourceHashSetContainerPath.PackFile.map(x=>x.File).filter(Boolean))].sort();
const available=new Set(dbPaths.map(p=>p.split('/')[1]));
const core=new Set(['unit_abilities_tables','unit_special_abilities_tables','special_ability_phases_tables','special_ability_groups_tables','battle_vortexs_tables','projectile_bombardments_tables','projectiles_tables','projectiles_explosions_tables']);
const edges=[];
for(const [table,versions] of Object.entries(definitions))for(const def of versions)for(const f of def.fields??[]){if(!f.is_reference)continue;const target=f.is_reference[0].replace(/_tables$/,'')+'_tables';if(core.has(table)||core.has(target))edges.push({source_table:table,version:def.version,source_column:f.name,target_table:target,target_column:f.is_reference[1],packed:available.has(table)});}
const selected=new Set([...core,...[...available].filter(t=>/^(special_abilit|unit_abilit|unit_special_abilit|battle_vortex|projectile_bombard|effect_bonus_value_.*abilit|effect_bonus_value_.*phase|campaign_effect_scope|battle_currency_.*abilit|land_units_to_unit_abil|unit_set.*abilit)/.test(t))]);
for(const e of edges)if(e.packed&&!/^(audio_|battle_ai_|battle_set_piece_|battlefield_)/.test(e.source_table))selected.add(e.source_table);
// Bounded mechanical/access dependencies discovered by the pre-review audit.
const mechanical = /^(modifiable_unit_stats|unit_stat_modifiers|special_ability_phase_effect_types|special_ability_stance_enums|special_ability_spawn_types|special_abilities_specific_behaviour_types|campaign_bonus_value_ids_.*abilit|campaign_bonus_value_ids_.*phase|campaign_bonus_value_ids_military_force_ability|campaign_bonus_value_battle_context_|campaign_effect_scope_|unit_sets|unit_set_to_unit_junctions|army_special_abilities|default_army_special_abilities|battle_context_.*abilit|pre_battle_unit_targeted_|unit_attributes_tables|unit_castes_tables|unit_category_tables|unit_class_tables|special_unit_categories_tables|unit_stat_localisations_tables|area_of_effect_displays_tables|campaign_ground_types_tables|military_force_types_tables|faction_sets_tables|faction_set_items_tables|agents_tables|agent_culture_details|agent_uniforms|agent_subtypes|projectile_shrapnels|projectile_homing_params|projectile_penetration_junctions|projectiles_scaling_damages)/;
for (const t of available) if (mechanical.test(t)) selected.add(t);
const selectedTables=[...selected].filter(t=>available.has(t)).sort();
const selectedPaths=dbPaths.filter(p=>selected.has(p.split('/')[1]));
// Fresh extraction: archived 8.1.1 files are never installed as 9.0 evidence.
await mkdir(output,{recursive:true});
for(let i=0;i<selectedPaths.length;i+=25){await call('extract_packed_files',{pack_key:pack,source_paths:JSON.stringify({PackFile:selectedPaths.slice(i,i+25).map(File=>({File}))}),destination_path:output,export_as_tsv:true});console.log(`Extracted ${Math.min(i+25,selectedPaths.length)}/${selectedPaths.length}`);}
await writeFile(path.join(output,'decoded_schema.json'),JSON.stringify(Object.fromEntries(selectedTables.map(t=>[t,definitions[t]])),null,2)+'\n');
await writeFile(path.join(output,'discovery.json'),JSON.stringify({roots:[...core],selected_tables:selectedTables,selected_paths:selectedPaths,db_paths:dbPaths,dependency_edges:edges,relation_inventory:edges.map(e=>({...e,status:selected.has(e.source_table)?'included':e.packed?'outside_selected_scope':'no_packed_table'})),extracted:selectedPaths},null,2)+'\n');
const sourceVerification=await finishSource(context);
const files=[];for(const p of await filesBelow(output)){const b=await readFile(p);files.push({path:path.relative(output,p).replaceAll('\\','/'),bytes:b.length,sha256:sha256(b)});}
await writeFile(path.join(output,'source_manifest.json'),JSON.stringify({...SNAPSHOT,source_verification:sourceVerification,decoder_schema_sha256:decoder.schema_sha256,source_kind:'fresh read-only merged vanilla CA packs',table_folders_requested:selectedTables,files},null,2)+'\n');
console.log(JSON.stringify({tables:selectedTables.length,extracted:selectedPaths.length}));
