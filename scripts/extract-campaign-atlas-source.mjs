import { beginSource, verifyDecoder, finishSource } from "./snapshot-source.mjs";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "http://127.0.0.1:45127/mcp";
const OUTPUT = path.resolve(ROOT, process.argv[2] ?? "work/source_campaign_atlas__wh3__8.1.1");

// This is deliberately broader than the first normalized atlas. The snapshot
// preserves nearby source relations so later atlas revisions do not require a
// fresh game extraction merely to add another audited join.
if (process.argv[3] && process.argv[3] !== "8.1.1" && !process.argv[2]) throw Error("Explicit candidate destination required");
const sourceContext = await beginSource(OUTPUT, ROOT, process.argv[3] ?? "8.1.1");

const MAP_KEY = sourceContext.profile.patch === "9.0" ? "wh3_main_combi_map_7" : "wh3_main_combi_map_5";

const TABLES = [
  "campaign_map_playable_areas_tables",
  "campaign_map_regions_tables",
  "campaign_map_settlements_tables",
  "campaign_map_roads_tables",
  "campaign_map_route_networks_tables",
  "campaign_map_route_nodes_tables",
  "campaign_map_route_segments_tables",
  "campaign_map_areas_of_interest_tables",
  "campaign_map_areas_of_interest_label_positions_tables",
  "campaign_camera_map_bounds_tables",
  "campaign_ground_types_tables",
  "campaign_ambush_ground_types_tables",
  "campaign_terrain_patch_areas_tables",
  "regions_tables",
  "provinces_tables",
  "region_to_province_junctions_tables",
  "region_features_tables",
  "region_groups_tables",
  "regions_to_region_groups_junctions_tables",
  "start_pos_regions_tables",
  "start_pos_factions_tables",
  "start_pos_entity_association_faction_regions_tables",
  "factions_tables",
  "cultures_subcultures_tables",
  "frontend_faction_leaders_tables",
  "frontend_factions_tables",
  "climates_tables",
  "settlement_climate_types_tables",
  "settlement_types_tables",
  "resources_tables",
  "commodities_tables",
  "battle_catchment_override_areas_tables",
  "battle_catchment_override_groups_tables",
  "battle_catchment_override_group_battles_tables",
  "battle_catchment_override_battle_mappings_tables",
  "battles_tables",
  "battle_types_tables",
  "battle_weather_types_tables",
  "battle_climate_weather_descriptions_tables",
  "campaign_battle_scenes_tables",
  "missions_tables",
  "mission_groups_tables",
  "mission_groups_to_missions_tables",
  "cdir_events_mission_payloads_tables",
  "cdir_events_mission_option_junctions_tables",
  "campaign_victory_conditions_tables",
  "victory_conditions_tables",
  "victory_types_tables",
  "victory_type_links_tables",
  "teleportation_networks_tables",
  "teleportation_network_nodes_tables",
  "teleportation_node_templates_tables",
];

const LOC_FILES = [
  "regions__.loc",
  "provinces__.loc",
  "start_pos_regions__.loc",
  "start_pos_factions__.loc",
  "start_pos_settlements__.loc",
  "factions__.loc",
  "frontend_factions__.loc",
  "settlement_climate_types__.loc",
  "settlement_types__.loc",
  "campaign_ground_types__.loc",
  "battle_types__.loc",
  "battles__.loc",
  "missions__.loc",
  "mission_text__.loc",
  "scripted_objectives__.loc",
  "victory_types__.loc",
  "teleportation_node_templates__.loc",
];

const PACK_FILES = [
  `campaign_maps/${MAP_KEY}/wh3_main_combi_lookup.tga`,
  `campaign_maps/${MAP_KEY}/prebattle_map.png`,
  `campaign_maps/${MAP_KEY}/camera_heightmap.png`,
  `campaign_maps/${MAP_KEY}/display/borders/borders.pbd`,
  "script/campaign/main_warhammer/victory_objectives.lua",
];

function parseSse(text) {
  return text.split(/\r?\n/)
    .filter((line) => line.startsWith("data: {") || line.startsWith("data:{"))
    .map((line) => JSON.parse(line.slice(line.indexOf("{")).trim()));
}

async function post(body, sessionId) {
  const headers = { Accept: "application/json, text/event-stream", "Content-Type": "application/json" };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const response = await fetch(ENDPOINT, { method: "POST", headers, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return { response, messages: parseSse(await response.text()) };
}

let requestId = 1;
const initialized = await post({
  jsonrpc: "2.0", id: requestId++, method: "initialize",
  params: { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "campaign-atlas-extractor", version: "1.0.0" } },
});
const sessionId = initialized.response.headers.get("mcp-session-id");
if (!sessionId) throw new Error("RPFM did not return an MCP session ID.");
await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionId);

async function call(name, args = {}) {
  const id = requestId++;
  const response = await post({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, sessionId);
  const message = response.messages.find((item) => item.id === id);
  if (!message) throw new Error(`No response from RPFM for ${name}.`);
  if (message.error) throw new Error(`${name}: ${message.error.message}`);
  if (message.result?.isError) throw new Error(`${name}: ${message.result.content?.map((item) => item.text).join("\n")}`);
  const text = message.result?.content?.find((item) => item.type === "text")?.text;
  if (text === undefined) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function walkFiles(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...await walkFiles(fullPath));
    else if (entry.isFile()) results.push(fullPath);
  }
  return results;
}

await mkdir(OUTPUT, { recursive: true });
await call("set_game_selected", { game_name: "warhammer_3", rebuild_dependencies: false });
const decoderEvidence = await verifyDecoder(call, sourceContext);
const loaded = await call("load_all_ca_pack_files");
const packKey = loaded?.StringContainerInfo?.[0];
if (!packKey) throw new Error("RPFM did not return a key for the merged CA packs.");

for (let offset = 0; offset < TABLES.length; offset += 8) {
  const batch = [...new Set(TABLES.slice(offset, offset + 8))];
  await call("extract_packed_files", {
    pack_key: packKey,
    source_paths: JSON.stringify({ PackFile: batch.map((table) => ({ Folder: `db/${table}` })) }),
    destination_path: OUTPUT,
    export_as_tsv: true,
  });
  console.log(`Exported ${batch.join(", ")}`);
}

await call("extract_packed_files", {
  pack_key: packKey,
  source_paths: JSON.stringify({ PackFile: LOC_FILES.map((file) => ({ File: `text/db/${file}` })) }),
  destination_path: OUTPUT,
  export_as_tsv: true,
});

await call("extract_packed_files", {
  pack_key: packKey,
  source_paths: JSON.stringify({ PackFile: PACK_FILES.map((file) => ({ File: file })) }),
  destination_path: OUTPUT,
  export_as_tsv: false,
});

const missing = [];
for (const table of new Set(TABLES)) {
  try { await stat(path.join(OUTPUT, "db", table, "data__.tsv")); }
  catch { missing.push(`db/${table}/data__.tsv`); }
}
for (const loc of LOC_FILES) {
  try { await stat(path.join(OUTPUT, "text", "db", `${loc}.tsv`)); }
  catch { missing.push(`text/db/${loc}.tsv`); }
}
for (const file of PACK_FILES) {
  try { await stat(path.join(OUTPUT, ...file.split("/"))); }
  catch { missing.push(file); }
}
if (missing.length) throw new Error(`RPFM did not export required files:\n${missing.join("\n")}`);

// RPFM can return raw binary without failing when a table is undecodable.
const undecoded = (await walkFiles(path.join(OUTPUT, "db"))).filter(file => !file.endsWith(".tsv"));
if (undecoded.length) throw Error(`Undecoded source tables: ${undecoded.join(", ")}`);
const installationEvidence = await finishSource(sourceContext);
const files = (await walkFiles(OUTPUT)).filter((file) => !file.endsWith("source_manifest.json"));
const manifestFiles = [];
for (const file of files.sort()) {
  const contents = await readFile(file);
  manifestFiles.push({
    path: path.relative(OUTPUT, file).replaceAll(path.sep, "/"),
    bytes: (await stat(file)).size,
    sha256: createHash("sha256").update(contents).digest("hex"),
  });
}
await writeFile(path.join(OUTPUT, "source_manifest.json"), `${JSON.stringify({
  game: "warhammer_3",
  campaign: "main_warhammer",
  ...sourceContext.profile,
  installation_evidence: installationEvidence,
  decoder_schema_sha256: decoderEvidence.schema_sha256,
  decoder: "RPFM MCP schema-decoded export; schema identity recorded separately",
  extracted_at_utc: new Date().toISOString(),
  table_folders_requested: [...new Set(TABLES)],
  localisation_files_requested: LOC_FILES,
  packed_files_requested: PACK_FILES,
  files: manifestFiles,
}, null, 2)}\n`, "utf8");
console.log(`Wrote ${manifestFiles.length} source exports to ${OUTPUT}`);
