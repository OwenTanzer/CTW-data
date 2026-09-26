// Read-only extraction from the verified vanilla install. Use the locking PS1 wrapper.
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SNAPSHOT, discover, filesBelow, sha256 } from "./effect-foundation-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, process.argv[2] ?? "work/source_effect_semantics__wh3__8.1.1");
if (!output.startsWith(path.join(root,"work") + path.sep)) throw new Error("Extract to an ignored work/ candidate, never production data");
try { if ((await readdir(output)).length) throw new Error("Extraction requires a fresh empty destination"); }
catch (e) { if (e.code !== "ENOENT") throw e; }
const game = process.env.CTW_GAME_PATH ?? "C:/Program Files (x86)/Steam/steamapps/common/Total War WARHAMMER III";
const appManifest = path.resolve(game,"../../appmanifest_1142710.acf");
async function inspectInstall() {
  const manifest = await readFile(appManifest);
  const build = manifest.toString("utf8").match(/"buildid"\s+"(\d+)"/)?.[1];
  const version = execFileSync("powershell.exe",["-NoProfile","-Command",
    `(Get-Item -LiteralPath '${game.replaceAll("'","''")}/Warhammer3.exe').VersionInfo.ProductVersion`],{encoding:"utf8"}).trim();
  if (build !== SNAPSHOT.steam_build_id || version !== SNAPSHOT.executable_version) {
    throw new Error(`Snapshot mismatch: ${build} / ${version}; expected ${SNAPSHOT.steam_build_id} / ${SNAPSHOT.executable_version}`);
  }
  return {manifest,build,version};
}
const before = await inspectInstall();
// Import the read-only transport only after local snapshot checks have passed.
const { call } = await import("./technology-rpfm.mjs");
await call("set_game_selected",{game_name:SNAPSHOT.game,rebuild_dependencies:false});
const configured = await call("settings_get_path_buf",{value:SNAPSHOT.game});
const configuredPath = typeof configured === "string" ? configured : configured?.PathBuf;
const normalized = p => String(p).replaceAll("\\","/").replace(/\/$/,"").toLowerCase();
// Existing RPFM versions may wrap the path differently. Unknown wrappers fail closed.
if (!configuredPath || normalized(configuredPath) !== normalized(game)) throw new Error(`RPFM configured install cannot be verified: ${JSON.stringify(configured)}`);
const loaded = await call("load_all_ca_pack_files");
const pack = loaded?.StringContainerInfo?.[0];
if (!pack) throw new Error("No merged vanilla pack key returned");
const schema = (await call("get_schema"))?.Schema;
if (!schema?.definitions) throw new Error("No decoded game schema returned");
const listing = await call("get_packed_files_names_starting_with_path_from_all_sources",{path:JSON.stringify({Folder:"db"})});
const dbPaths = [...new Set((listing?.HashMapDataSourceHashSetContainerPath?.PackFile ?? []).map(r=>r.File).filter(Boolean))].sort();
const plan = discover(dbPaths,schema.definitions);
if (plan.selected_tables.some(t => !schema.definitions[t])) throw new Error("Selected foundation tables lack decoded schemas");
const selectedPaths = dbPaths.filter(p=>plan.selected_tables.includes(p.split("/")[1]));
await mkdir(output,{recursive:true});
for (let i=0;i<selectedPaths.length;i+=50) {
  await call("extract_packed_files",{pack_key:pack,
    source_paths:JSON.stringify({PackFile:selectedPaths.slice(i,i+50).map(File=>({File}))}),
    destination_path:output,export_as_tsv:true});
  console.log(`Exported ${Math.min(i+50,selectedPaths.length)}/${selectedPaths.length} packed paths`);
}
const selectedSchema = Object.fromEntries(plan.selected_tables.map(t=>[t,schema.definitions[t]]));
await writeFile(path.join(output,"decoded_schema.json"),JSON.stringify(selectedSchema,null,2)+"\n");
await writeFile(path.join(output,"discovery.json"),JSON.stringify({...plan,db_paths:dbPaths,selected_paths:selectedPaths},null,2)+"\n");
const after = await inspectInstall();
if (!before.manifest.equals(after.manifest)) throw new Error("Steam manifest changed during extraction; discard candidate");
const files=[];
for (const p of await filesBelow(output)) {
  const bytes=await readFile(p);
  files.push({path:path.relative(output,p).replaceAll("\\","/"),bytes:bytes.length,sha256:sha256(bytes)});
}
await writeFile(path.join(output,"source_manifest.json"),JSON.stringify({...SNAPSHOT,
  appmanifest_sha256:sha256(before.manifest),decoder:"RPFM schema-decoded TSV; version to be verified on host",
  source_kind:"read-only merged vanilla CA packs",table_folders_requested:plan.selected_tables,files},null,2)+"\n");
console.log(`Source candidate written: ${plan.selected_tables.length} tables. Run validate:effect-source before interpreting it.`);
