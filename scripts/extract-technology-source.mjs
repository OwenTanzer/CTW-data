import { beginSource, finishSource, verifyDecoder } from "./snapshot-source.mjs";
import { fileURLToPath } from "node:url";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { createHash } from "node:crypto";

const output = path.resolve(
  process.argv[2] ?? "work/source_technology__wh3__8.1.1",
);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceContext = await beginSource(output, root, process.argv[3] ?? "8.1.1");
// Reusing an existing snapshot could retain files deleted from the game.
try {
  if ((await readdir(output)).length)
    throw new Error("Extraction requires an empty destination: " + output);
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const game =
  process.env.CTW_GAME_PATH ??
  "C:/Program Files (x86)/Steam/steamapps/common/Total War WARHAMMER III";
const appManifest = path.resolve(game, "../../appmanifest_1142710.acf");
const manifestText = await readFile(appManifest, "utf8");
const build = manifestText.match(/"buildid"\s+"(\d+)"/)?.[1];
const version = execFileSync(
  "powershell.exe",
  [
    "-NoProfile",
    "-Command",
    `(Get-Item -LiteralPath '${game.replaceAll("'", "''")}/Warhammer3.exe').VersionInfo.ProductVersion`,
  ],
  { encoding: "utf8" },
).trim();
if (build !== sourceContext.profile.steam_build_id || version !== sourceContext.profile.executable_version)
  throw new Error(
    `Snapshot mismatch: build ${build}, executable ${version}; require ${sourceContext.profile.steam_build_id} / ${sourceContext.profile.executable_version}.`,
  );
// Import only after the snapshot gate has passed.
const { call } = await import("./technology-rpfm.mjs");
await call("set_game_selected", {
  game_name: "warhammer_3",
  rebuild_dependencies: false,
});
const configured = await call("settings_get_path_buf", {
  value: "warhammer_3",
});
if (
  !JSON.stringify(configured)
    .replaceAll("\\\\", "/")
    .toLowerCase()
    .includes(game.replaceAll("\\", "/").toLowerCase())
)
  throw new Error(
    `RPFM path does not match verified install: ${JSON.stringify(configured)}`,
  );
const decoderEvidence = await verifyDecoder(call, sourceContext);
const loaded = await call("load_all_ca_pack_files");
const pack = loaded.StringContainerInfo[0];
const schema = (await call("get_schema")).Schema;
async function paths(prefix) {
  const r = await call(
    "get_packed_files_names_starting_with_path_from_all_sources",
    { path: JSON.stringify({ Folder: prefix }) },
  );
  return [
    ...new Set(
      (r.HashMapDataSourceHashSetContainerPath.PackFile ?? [])
        .map((x) => x.File)
        .filter(Boolean),
    ),
  ].sort();
}
const dbPaths = await paths("db");
const locPaths = await paths("text/db");
const scriptPaths = (await paths("script")).filter(
  (p) =>
    p.endsWith(".lua") &&
    (p.startsWith("script/campaign/") || p.startsWith("script/_lib/")),
);
const available = new Set(dbPaths.map((p) => p.split("/")[1]));
const direct = [...available].filter(
  (t) =>
    /technolog|research/.test(t) ||
    schema.definitions[t]?.some((d) =>
      d.fields.some((f) => f.is_reference?.[0]?.startsWith("technolog")),
    ),
);
const support = [
  "factions_tables",
  "cultures_subcultures_tables",
  "cultures_tables",
  "frontend_faction_leaders_tables",
  "campaigns_tables",
  "effects_tables",
  "campaign_effect_scopes_tables",
  "ancillaries_tables",
  "agent_subtypes_tables",
  "character_trait_levels_tables",
  "resource_costs_tables",
  "resource_cost_pooled_resource_junctions_tables",
  "pooled_resources_tables",
  "pooled_resource_factor_junctions_tables",
  "pooled_resource_factors_tables",
  "pooled_resource_change_contexts_tables",
  "ui_resource_transaction_pooled_resource_junctions_tables",
  "building_levels_tables",
  "initiatives_tables",
  "campaign_effect_lists_tables",
  "campaign_effect_list_effect_junctions_tables",
  "unit_upgrade_to_unit_groups_tables",
  "mercenary_unit_groups_tables",
  "effect_bundles_tables",
  "effect_bundles_to_effects_junctions_tables",
];
const features = [...available].filter(
  (t) =>
    /feature/.test(t) &&
    !/region_features|slot_set|military_force_type_feature/.test(t),
);
const tables = [
  ...new Set(
    [...direct, ...support, ...features].filter((t) => available.has(t)),
  ),
].sort();
const loc = locPaths.filter(
  (p) =>
    /technolog/.test(p) ||
    /\/(effects|effects_additional_tooltip_details|factions|frontend_factions|ancillaries|pooled_resources|character_trait_levels|initiatives)__\.loc$/.test(
      p,
    ),
);
await mkdir(output, { recursive: true });
async function extract(files, dest = output) {
  for (let i = 0; i < files.length; i += 80)
    await call("extract_packed_files", {
      pack_key: pack,
      source_paths: JSON.stringify({
        PackFile: files.slice(i, i + 80).map((File) => ({ File })),
      }),
      destination_path: dest,
      export_as_tsv: true,
    });
}
await extract(dbPaths.filter((p) => tables.includes(p.split("/")[1])));
await extract(loc);
for (const p of dbPaths.filter(p => tables.includes(p.split("/")[1]))) await readFile(path.join(output, p + ".tsv"));
console.log(
  `Exported ${tables.length} tables and ${loc.length} localization files.`,
);
// Full scripts exist only in ignored scratch. Production receives hashes, typed
// mechanics and bounded excerpts generated from these authoritative bytes.
const scriptScratch = path.resolve(output, "../technology_script_scan");
await mkdir(scriptScratch, { recursive: true });
await extract(scriptPaths, scriptScratch);
const scan = [];
const pattern = /technolog|research|tech_tree|tech_node/i;
for (const p of scriptPaths) {
  const data = await readFile(path.join(scriptScratch, p));
  const retained = pattern.test(data.toString("utf8"));
  scan.push({
    path: p,
    sha256: createHash("sha256").update(data).digest("hex"),
    bytes: data.length,
    contains_technology: retained,
    line_count: data.toString("utf8").split(/\r?\n/).length,
  });
}
const { compactScripts } = await import("./technology-script-source.mjs");
const compact = await compactScripts(output, scriptScratch, scan);
const selectedSchema = Object.fromEntries(
  tables.map((t) => [t, schema.definitions[t]]),
);
await writeFile(
  path.join(output, "decoded_schema.json"),
  JSON.stringify(selectedSchema, null, 2) + "\n",
);
await writeFile(
  path.join(output, "discovery.json"),
  JSON.stringify(
    {
      db_paths: dbPaths,
      localisation_paths: locPaths,
      technology_relations: direct.sort(),
      extracted_tables: tables,
      script_scope: "script/campaign/**/*.lua and script/_lib/**/*.lua",
      script_pattern: pattern.source,
      scripts: scan,
    },
    null,
    2,
  ) + "\n",
);
const files = [];
async function walk(dir) {
  for (const e of (await readdir(dir, { withFileTypes: true })).sort((a, b) =>
    a.name < b.name ? -1 : 1,
  )) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name !== "source_manifest.json") {
      const b = await readFile(p);
      files.push({
        path: path.relative(output, p).replaceAll("\\", "/"),
        bytes: b.length,
        sha256: createHash("sha256").update(b).digest("hex"),
      });
    }
  }
}
await walk(output);
const installationEvidence = await finishSource(sourceContext);
// Verify again in case Steam updated while extracting.
if ((await readFile(appManifest, "utf8")) !== manifestText)
  throw new Error(
    "Steam manifest changed during extraction. Do not install this candidate.",
  );
await writeFile(
  path.join(output, "source_manifest.json"),
  JSON.stringify(
    {
      game: "warhammer_3",
      ...sourceContext.profile,
      installation_evidence: installationEvidence,
      decoder_schema_sha256: decoderEvidence.schema_sha256,
      executable_version: version,
      appmanifest_sha256: createHash("sha256")
        .update(manifestText)
        .digest("hex"),
      decoder: "RPFM 5.0.6",
      table_folders_requested: tables,
      localisation_files_requested: loc,
      files,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Snapshot complete: ${files.length} files; ${scan.length} Lua files scanned, 0 whole Lua files retained; ${compact.mechanic_records} mechanics and ${compact.excerpt_count} bounded excerpts.`,
);
