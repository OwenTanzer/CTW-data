// Read-only gap extraction. Run through extract-magic-source.ps1.
import {readFile, writeFile, mkdir, readdir, copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SNAPSHOT, sha256, filesBelow, verifyManifest} from './effect-foundation-lib.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,process.argv[2]??'work/magic-source');
const candidate=path.resolve(process.argv[3]??'../ctw-pr8-exercise/work/source_effect_exercise_20260919');
if (!output.startsWith(path.join(root,'work')+path.sep)) throw Error('Use ignored work/');
try {if ((await readdir(output)).length) throw Error('Use fresh destination');} catch(e){if(e.code!=='ENOENT')throw e;}
const foundation=await verifyManifest(candidate);
if(sha256(await readFile(path.join(candidate,'source_manifest.json')))!=='fd8eabe1b1ea0c18076b5c1d5c00cf3a6ee5aa40d0c478b7b79a5b9c6e89f701')throw Error('Foundation differs from audited source');
const game=process.env.CTW_GAME_PATH??'C:/Program Files (x86)/Steam/steamapps/common/Total War WARHAMMER III';
const app=path.resolve(game,'../../appmanifest_1142710.acf');
async function inspect(){const b=await readFile(app);const version=execFileSync('powershell.exe',['-NoProfile','-Command',`(Get-Item -LiteralPath '${game}/Warhammer3.exe').VersionInfo.ProductVersion`],{encoding:'utf8'}).trim();if(b.toString().match(/"buildid"\s+"(\d+)"/)?.[1]!==SNAPSHOT.steam_build_id||version!==SNAPSHOT.executable_version)throw Error('Snapshot mismatch');return b;}
const before=await inspect();
const {call}=await import('./technology-rpfm.mjs');
await call('set_game_selected',{game_name:SNAPSHOT.game,rebuild_dependencies:false});
const config=await call('settings_get_path_buf',{value:SNAPSHOT.game});
if(String(typeof config==='string'?config:config?.PathBuf).replaceAll('\\','/').toLowerCase()!==game.toLowerCase())throw Error('Install path mismatch');
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
const selectedTables=[...selected].filter(t=>available.has(t)).sort();
const selectedPaths=dbPaths.filter(p=>selected.has(p.split('/')[1]));
const owners=[['unit_stats',path.join(root,'data/unit_stats/source_exports')],['skill_trees',path.join(root,'data/skill_trees/source_exports')],['effect_foundation',candidate]];
const reuse=[];const missing=[];
await mkdir(output,{recursive:true});
for(const packed of selectedPaths){const relative=packed+'.tsv';const copies=[];for(const [owner,dir] of owners){try{const bytes=await readFile(path.join(dir,relative));copies.push({owner,dir,bytes,hash:sha256(bytes)});}catch(e){if(e.code!=='ENOENT')throw e;}}if(copies.length){const hashes=new Set(copies.map(c=>c.hash));if(hashes.size!==1)throw Error(`Conflicting existing copies ${packed}`);const c=copies[0];await mkdir(path.dirname(path.join(output,relative)),{recursive:true});await copyFile(path.join(c.dir,relative),path.join(output,relative));reuse.push({path:relative,owner:c.owner,sha256:c.hash});}else missing.push(packed);}
for(let i=0;i<missing.length;i+=25){await call('extract_packed_files',{pack_key:pack,source_paths:JSON.stringify({PackFile:missing.slice(i,i+25).map(File=>({File}))}),destination_path:output,export_as_tsv:true});}
await writeFile(path.join(output,'decoded_schema.json'),JSON.stringify(Object.fromEntries(selectedTables.map(t=>[t,definitions[t]])),null,2)+'\n');
await writeFile(path.join(output,'discovery.json'),JSON.stringify({roots:[...core],selected_tables:selectedTables,selected_paths:selectedPaths,db_paths:dbPaths,dependency_edges:edges,relation_inventory:edges.map(e=>({...e,status:selected.has(e.source_table)?'included':e.packed?'outside_selected_scope':'no_packed_table'})),reused:reuse,extracted:missing,foundation_manifest_sha256:sha256(await readFile(path.join(candidate,'source_manifest.json')))},null,2)+'\n');
if(!(await inspect()).equals(before))throw Error('Install changed');
const files=[];for(const p of await filesBelow(output)){const b=await readFile(p);files.push({path:path.relative(output,p).replaceAll('\\','/'),bytes:b.length,sha256:sha256(b)});}
await writeFile(path.join(output,'source_manifest.json'),JSON.stringify({...SNAPSHOT,appmanifest_sha256:sha256(before),source_kind:'read-only merged vanilla CA packs, reconciled existing exports',table_folders_requested:selectedTables,files},null,2)+'\n');
console.log(JSON.stringify({tables:selectedTables.length,reused:reuse.length,extracted:missing.length}));
