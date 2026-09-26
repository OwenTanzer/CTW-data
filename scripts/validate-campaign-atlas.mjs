import { DatabaseSync } from "node:sqlite";
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ATLAS = path.resolve(ROOT, process.argv[2] ?? "data/campaign_map/campaign_atlas__wh3__8.1.1.gpkg");
const REPORT_DIR = path.resolve(ROOT, process.argv[3] ?? path.dirname(ATLAS));
const JSON_REPORT = path.join(REPORT_DIR, "validation_report.json");
const MD_REPORT = path.join(REPORT_DIR, "VALIDATION.md");

const db = new DatabaseSync(ATLAS, { readOnly: true });
const errors = [];
const warnings = [];
const checks = [];

function scalar(sql, parameters = []) { return db.prepare(sql).get(...parameters); }
function check(name, actual, expected, severity = "error", note = "") {
  const passed = typeof expected === "function" ? expected(actual) : actual === expected;
  checks.push({ name, passed, actual, expected: typeof expected === "function" ? "predicate" : expected, severity, note });
  if (!passed) (severity === "warning" ? warnings : errors).push(`${name}: got ${JSON.stringify(actual)}${note ? `; ${note}` : ""}`);
}

const applicationId = scalar("PRAGMA application_id").application_id;
const userVersion = scalar("PRAGMA user_version").user_version;
const integrity = scalar("PRAGMA integrity_check").integrity_check;
const foreignKeyErrors = scalar("SELECT COUNT(*) count FROM pragma_foreign_key_check").count;
check("GeoPackage application ID", applicationId, 1196444487);
check("GeoPackage user version", userVersion, 10300);
check("SQLite integrity", integrity, "ok");
check("Foreign-key violations", foreignKeyErrors, 0);

const metadata = Object.fromEntries(db.prepare("SELECT key, value FROM metadata").all().map((row) => [row.key, row.value]));
check("Campaign key", metadata.campaign_key, "wh3_main_combi");
check("Campaign map revision", metadata.campaign_map_key, "wh3_main_combi_map_5");
check("Patch", metadata.patch, "8.1.1");
check("Steam build", metadata.steam_build_id, "24237342");
if (metadata.schema_version === "1.1.0") {
  check("Primary army start coverage", scalar("SELECT COUNT(*) count FROM faction_army_start_reference").count, 104);
  check("Primary army start uniqueness", scalar("SELECT COUNT(DISTINCT faction_key) count FROM faction_army_start_reference").count, 104);
  check("Primary army points complete", scalar("SELECT COUNT(*) count FROM faction_army_start_reference WHERE world_x IS NULL OR world_y IS NULL").count, 0);
  check("All starting generals retained", scalar("SELECT COUNT(*) count FROM campaign_army_starts").count, 109);
  check("Explicit maritime primary points", scalar("SELECT COUNT(*) count FROM faction_army_start_reference WHERE start_region_key IS NULL").count, 4);
  check("Human partner position exceptions", scalar("SELECT COUNT(*) count FROM campaign_start_partner_overrides").count, 5);
  check("Army start regions resolve", scalar("SELECT COUNT(*) count FROM campaign_army_starts a WHERE start_region_key IS NOT NULL AND NOT EXISTS (SELECT 1 FROM regions r WHERE r.region_key=a.start_region_key)").count, 0);
}

const counts = {};
for (const table of [
  "regions", "provinces", "factions", "region_points", "region_adjacency", "region_groups",
  "strategic_nodes", "strategic_links", "objectives", "objective_conditions", "battle_maps",
  "battle_selection_rules", "map_assets", "source_files", "evidence", "coverage",
]) counts[table] = scalar(`SELECT COUNT(*) count FROM ${table}`).count;

check("Current IE regions", counts.regions, 641);
check("IE provinces", counts.provinces, 214);
check("Playable IE factions", scalar("SELECT COUNT(*) count FROM factions WHERE playable = 1").count, 104);
check("Region centroid features", counts.region_points, 571, "warning", "70 black sea/special regions share one lookup colour and are intentionally non-spatial individually");
check("Region ownership rows", scalar("SELECT COUNT(*) count FROM regions WHERE start_owner_faction_key IS NOT NULL").count, (value) => value >= 540);
check("Region/province orphan count", scalar("SELECT COUNT(*) count FROM regions WHERE province_key IS NULL").count, 72, "warning", "maritime/special regions intentionally have no province");
check("Raster adjacency relations", counts.region_adjacency, 1317);

for (const tier of ["short", "long", "domination"]) {
  check(`${tier} objectives cover every playable faction`, scalar("SELECT COUNT(DISTINCT faction_key) count FROM objectives WHERE victory_tier = ?", [tier]).count, 104);
}
check("Objectives have types", scalar("SELECT COUNT(*) count FROM objectives WHERE objective_type IS NULL OR objective_type = 'UNKNOWN'").count, 0);
check("Region objective targets resolve", scalar("SELECT COUNT(*) count FROM objective_conditions c WHERE c.condition_type = 'region' AND NOT EXISTS (SELECT 1 FROM regions r WHERE r.region_key = c.target_key)").count, 0);
check("Province objective targets resolve", scalar("SELECT COUNT(*) count FROM objective_conditions c WHERE c.condition_type = 'province' AND NOT EXISTS (SELECT 1 FROM provinces p WHERE p.province_key = c.target_key)").count, 0);

check("Battle selection rules", counts.battle_selection_rules, (value) => value >= 1300);
check("Battle rules resolve groups", scalar("SELECT COUNT(*) count FROM battle_selection_rules r WHERE NOT EXISTS (SELECT 1 FROM battle_groups g WHERE g.battle_group_key = r.battle_group_key)").count, 0);
const rulesWithoutMaps = scalar("SELECT COUNT(*) count FROM battle_selection_rules r WHERE NOT EXISTS (SELECT 1 FROM battle_group_maps gm WHERE gm.battle_group_key = r.battle_group_key)").count;
check("Battle rules without an exposed group map", rulesWithoutMaps, 0, "warning", "Some engine-resolved catchment groups do not expose a direct group-map row");

check("Embedded map assets", counts.map_assets, 4);
check("Embedded asset hash coverage", scalar("SELECT COUNT(*) count FROM map_assets WHERE length(sha256) = 64 AND bytes = length(data)").count, 4);
check("Source provenance entries", counts.source_files, (value) => value >= 70);
check("Source provenance hashes", scalar("SELECT COUNT(*) count FROM source_files WHERE length(sha256) != 64 OR bytes <= 0").count, 0);
check("GeoPackage region feature registration", scalar("SELECT COUNT(*) count FROM gpkg_geometry_columns WHERE table_name = 'region_points' AND geometry_type_name = 'POINT' AND srs_id = 100000").count, 1);

const report = {
  status: errors.length ? "failed" : "passed",
  atlas: ATLAS,
  bytes: (await stat(ATLAS)).size,
  metadata,
  counts,
  checks,
  errors,
  warnings,
  validated_at_utc: new Date().toISOString(),
};

await mkdir(REPORT_DIR, { recursive: true });
await writeFile(JSON_REPORT, `${JSON.stringify(report, null, 2)}\n`, "utf8");
const lines = [
  "# Campaign atlas validation",
  "",
  `- Status: **${report.status}**`,
  `- Atlas: \`${path.basename(ATLAS)}\``,
  `- Size: ${report.bytes.toLocaleString("en-US")} bytes`,
  `- Regions / provinces / playable factions: ${counts.regions} / ${counts.provinces} / ${scalar("SELECT COUNT(*) count FROM factions WHERE playable = 1").count}`,
  `- Objectives / conditions: ${counts.objectives} / ${counts.objective_conditions}`,
  `- Battle maps / IE selection rules: ${counts.battle_maps} / ${counts.battle_selection_rules}`,
  "",
  "## Checks",
  "",
  ...checks.map((item) => `- ${item.passed ? "PASS" : item.severity === "warning" ? "WARN" : "FAIL"}: ${item.name} — ${JSON.stringify(item.actual)}${item.note ? ` (${item.note})` : ""}`),
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None."]),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None."]),
  "",
];
await writeFile(MD_REPORT, lines.join("\n"), "utf8");
db.close();
console.log(JSON.stringify({ status: report.status, errors: errors.length, warnings: warnings.length, counts, json_report: JSON_REPORT, markdown_report: MD_REPORT }, null, 2));
if (errors.length) process.exitCode = 1;
