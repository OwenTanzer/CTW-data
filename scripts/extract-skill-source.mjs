import { beginSource, verifyDecoder, finishSource } from "./snapshot-source.mjs";
import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "http://127.0.0.1:45127/mcp";
const OUTPUT = path.resolve(ROOT, process.argv[2] ?? "work/source_skill_trees__wh3__8.1.1");

if (process.argv[3] && process.argv[3] !== "8.1.1" && !process.argv[2]) throw Error("Explicit candidate destination required");
const sourceContext = await beginSource(OUTPUT, ROOT, process.argv[3] ?? "8.1.1");

const TABLES = [
  "factions_tables",
  "agent_subtypes_tables",
  "unique_agents_tables",
  "frontend_faction_leaders_tables",
  "campaign_to_agent_subtypes_tables",
  "faction_agent_permitted_subtypes_tables",
  "character_skill_node_sets_tables",
  "character_skill_node_set_items_tables",
  "character_skill_nodes_tables",
  "character_skill_node_links_tables",
  "character_skill_node_link_types_tables",
  "character_skill_nodes_skill_locks_tables",
  "character_skill_node_ancillary_locks_tables",
  "character_skills_tables",
  "character_skill_level_details_tables",
  "character_skill_level_to_effects_junctions_tables",
  "character_skill_level_to_ancillaries_junctions_tables",
  "character_skill_level_to_dilemmas_junctions_tables",
  "effects_tables",
  "ancillaries_tables",
  "dilemmas_tables",
];

const LOC_FILES = [
  "agent_subtypes__.loc",
  "character_skills__.loc",
  "character_skill_level_details__.loc",
  "character_skill_node_sets__.loc",
  "effects__.loc",
  "effects_additional_tooltip_details__.loc",
  "ancillaries__.loc",
  "dilemmas__.loc",
  "factions__.loc",
  "frontend_factions__.loc",
];

function parseSse(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data: {") || line.startsWith("data:{"))
    .map((line) => JSON.parse(line.slice(line.indexOf("{")).trim()));
}

async function post(body, sessionId) {
  const headers = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return { response, messages: parseSse(await response.text()) };
}

let requestId = 1;
const initialized = await post({
  jsonrpc: "2.0",
  id: requestId++,
  method: "initialize",
  params: {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "computational-total-war-skill-extractor", version: "1.0.0" },
  },
});
const sessionId = initialized.response.headers.get("mcp-session-id");
if (!sessionId) throw new Error("RPFM did not return an MCP session ID.");
await post({ jsonrpc: "2.0", method: "notifications/initialized" }, sessionId);

async function call(name, args = {}) {
  const id = requestId++;
  const response = await post(
    { jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } },
    sessionId,
  );
  const message = response.messages.find((item) => item.id === id);
  if (!message) throw new Error(`No response from RPFM for ${name}.`);
  if (message.error) throw new Error(`${name}: ${message.error.message}`);
  if (message.result?.isError) {
    throw new Error(`${name}: ${message.result.content?.map((item) => item.text).join("\n")}`);
  }
  const text = message.result?.content?.find((item) => item.type === "text")?.text;
  if (text === undefined) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function walkFiles(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walkFiles(fullPath)));
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
  const batch = TABLES.slice(offset, offset + 8);
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
console.log(`Exported ${LOC_FILES.length} localisation files`);

const missing = [];
for (const table of TABLES) {
  const file = path.join(OUTPUT, "db", table, "data__.tsv");
  try { await stat(file); } catch { missing.push(`db/${table}/data__.tsv`); }
}
for (const loc of LOC_FILES) {
  const file = path.join(OUTPUT, "text", "db", `${loc}.tsv`);
  try { await stat(file); } catch { missing.push(`text/db/${loc}.tsv`); }
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
  const info = await stat(file);
  manifestFiles.push({
    path: path.relative(OUTPUT, file).replaceAll(path.sep, "/"),
    bytes: info.size,
    sha256: createHash("sha256").update(contents).digest("hex"),
  });
}
const manifest = {
  game: "warhammer_3",
  ...sourceContext.profile,
  installation_evidence: installationEvidence,
  decoder_schema_sha256: decoderEvidence.schema_sha256,
  decoder: "RPFM MCP schema-decoded export; schema identity recorded separately",
  extracted_at_utc: new Date().toISOString(),
  table_folders_requested: TABLES,
  localisation_files_requested: LOC_FILES,
  files: manifestFiles,
};
await writeFile(path.join(OUTPUT, "source_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Wrote ${manifestFiles.length} source exports to ${OUTPUT}`);
