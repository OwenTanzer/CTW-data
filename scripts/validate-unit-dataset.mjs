import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { matchesTextFingerprint } from "./validation-text.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_exports__wh3__8.1.1");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { UNIT_ROSTERS } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const DATASET = path.resolve(ROOT, process.argv[3] ?? "work/generated_unit_stats__wh3__8.1.1");

function parseDelimited(text, delimiter) {
  if (delimiter === "\t") return parseRpfmTsv(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      if (field.endsWith("\r")) field = field.slice(0, -1);
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseRecords(text, delimiter, skipMeta = false) {
  const data = parseDelimited(text, delimiter);
  const columns = data.shift() ?? [];
  const included = data.filter((row) => row.some((value) => value !== "") && (!skipMeta || !String(row[0] ?? "").startsWith("#")));
  const rows = included.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] ?? ""])));
  return { columns, rows, inconsistent_row_widths: included.filter((row) => row.length !== columns.length).length };
}

async function csv(relative) {
  const buffer = await readFile(path.join(DATASET, relative));
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    fail(`${relative}: file is not valid UTF-8.`);
    text = buffer.toString("utf8");
  }
  if (/\r(?!\n)/.test(text)) fail(`${relative}: contains a bare CR line ending.`);
  const parsed = parseRecords(text, ",");
  if (parsed.inconsistent_row_widths) fail(`${relative}: ${parsed.inconsistent_row_widths} rows have the wrong field count.`);
  return parsed;
}

async function tsv(table) {
  return parseRecords(await readFile(path.join(SOURCE, "db", table, "data__.tsv"), "utf8"), "\t", true).rows;
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    if (!result.has(row[key])) result.set(row[key], []);
    result.get(row[key]).push(row);
  }
  return result;
}

const errors = [];
const warnings = [];
const passes = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const pass = (message) => passes.push(message);

const expectedCounts = Object.fromEntries(UNIT_ROSTERS.map((roster) => [roster.slug, roster.expected_units]));
const expectedTotal = UNIT_ROSTERS.reduce((sum, roster) => sum + roster.expected_units, 0);
const normalizedFiles = (await readdir(path.join(DATASET, "normalized"))).filter((name) => name.endsWith(".csv")).sort();
if (normalizedFiles.length !== UNIT_ROSTERS.length) fail(`Expected ${UNIT_ROSTERS.length} normalized files; found ${normalizedFiles.length}.`);
const normalized = await Promise.all(normalizedFiles.map(async (name) => ({ name, ...(await csv(path.join("normalized", name))) })));
let canonicalColumns = null;
const allRows = [];
for (const file of normalized) {
  const slug = file.name.split("__")[0];
  if (file.rows.length !== expectedCounts[slug]) fail(`${file.name}: expected ${expectedCounts[slug]} rows; found ${file.rows.length}.`);
  if (!canonicalColumns) canonicalColumns = file.columns;
  else if (JSON.stringify(file.columns) !== JSON.stringify(canonicalColumns)) fail(`${file.name}: header differs from the canonical normalized header.`);
  allRows.push(...file.rows);
}
if (allRows.length === expectedTotal) pass(`All ${expectedTotal} roster rows are present.`);
else fail(`Expected ${expectedTotal} total roster rows; found ${allRows.length}.`);

const unitKeys = new Set();
for (const file of normalized) {
  const fileUnitKeys = new Set();
  for (const row of file.rows) {
    if (fileUnitKeys.has(row.unit_key)) fail(`Duplicate normalized unit key within ${file.name}: ${row.unit_key}`);
    fileUnitKeys.add(row.unit_key);
    unitKeys.add(row.unit_key);
  }
}
if (!errors.some((message) => message.startsWith("Duplicate normalized unit key within"))) {
  pass(`Unit keys are unique within each of the ${UNIT_ROSTERS.length} race rosters; intentional cross-race sharing is preserved.`);
}

const required = ["game", "patch", "steam_build_id", "unit_scale", "faction_name", "faction_key", "subculture_key", "military_group", "roster_scope", "is_faction_exclusive", "military_group_count", "permitted_faction_count", "unit_key", "unit_name", "tactical_category", "source_unit_class", "source_caste", "entity_count", "model_count", "source_total_component_count", "hp_per_entity", "total_hp", "primary_component_role", "primary_target_size", "is_large", "is_single_entity", "armour", "shield_block_chance", "melee_defence", "leadership", "melee_attack", "charge_bonus", "speed", "mass", "has_missile_weapon", "source_main_unit_key", "source_land_unit_key", "source_battle_entity_key", "extracted_at_utc", "data_quality_status"];
for (const row of allRows) {
  for (const column of required) if (row[column] === "") fail(`${row.unit_key}: required field ${column} is blank.`);
}

const booleans = ["is_faction_exclusive", "in_encyclopedia", "is_renown", "is_large", "is_single_entity", "melee_is_magical", "melee_is_flaming", "has_missile_weapon", "missile_is_magical", "missile_is_flaming", "projectile_can_damage_buildings", "projectile_can_damage_allies", "projectile_is_spell", "explosion_is_magical", "explosion_is_flaming", "explosion_affects_allies"];
const numerics = ["military_group_count", "permitted_faction_count", "tier", "entity_count", "model_count", "source_total_component_count", "hp_per_entity", "total_hp", "barrier_health", "armour", "shield_block_chance", "melee_defence", "leadership", "physical_resistance", "missile_resistance", "spell_resistance", "ward_save", "fire_resistance", "melee_attack", "weapon_base_damage", "weapon_ap_damage", "charge_bonus", "bonus_vs_infantry", "bonus_vs_large", "attack_interval", "max_splash_targets", "speed", "mass", "accuracy", "ammunition", "range", "reload_time", "missile_base_damage", "missile_ap_damage", "missile_bonus_vs_infantry", "missile_bonus_vs_large", "projectiles_per_shot", "shots_per_volley", "burst_size", "burst_shot_delay", "projectile_velocity", "projectile_spread", "marksmanship_bonus", "calibration_distance", "calibration_area", "projectile_expiry_range", "explosion_base_damage", "explosion_ap_damage", "explosion_radius", "multiplayer_cost", "campaign_recruit_cost", "campaign_upkeep"];
for (const row of allRows) {
  for (const column of booleans) if (row[column] !== "" && !["true", "false"].includes(row[column])) fail(`${row.unit_key}: ${column} is not a lowercase boolean.`);
  for (const column of numerics) if (row[column] !== "" && !Number.isFinite(Number(row[column]))) fail(`${row.unit_key}: ${column} is not numeric.`);
}
if (!errors.some((message) => message.includes("not numeric") || message.includes("lowercase boolean"))) pass("All populated numeric and boolean fields have valid CSV representations.");

const components = await csv(path.join("lookups", `unit_components__wh3__${PATCH}__ultra.csv`));
const weaponLinks = await csv(path.join("lookups", `unit_weapon_links__wh3__${PATCH}__ultra.csv`));
const projectiles = await csv(path.join("lookups", `projectiles__wh3__${PATCH}.csv`));
const explosions = await csv(path.join("lookups", `explosions__wh3__${PATCH}.csv`));
const abilities = await csv(path.join("lookups", `unit_abilities__wh3__${PATCH}__ultra.csv`));
const attributes = await csv(path.join("lookups", `unit_attributes__wh3__${PATCH}__ultra.csv`));
const contacts = await csv(path.join("lookups", `unit_contact_effects__wh3__${PATCH}__ultra.csv`));
const rosters = await csv(path.join("lookups", `unit_rosters__wh3__${PATCH}__ultra.csv`));
const mountVariants = await csv(path.join("lookups", `unit_mount_variants__wh3__${PATCH}__ultra.csv`));
const quality = await csv(path.join("lookups", `data_quality_flags__wh3__${PATCH}__ultra.csv`));
const schemaInventory = await csv(`schema_inventory__v${SNAPSHOT.unitSchema}.csv`);
if (!errors.some((message) => message.includes("valid UTF-8") || message.includes("line ending") || message.includes("wrong field count"))) pass("Every production CSV is valid UTF-8 with LF or CRLF endings and consistent row widths.");

const actualSchemas = new Map([
  [`normalized/<faction>__wh3__${PATCH}__ultra.csv`, canonicalColumns],
  [`lookups/unit_components__wh3__${PATCH}__ultra.csv`, components.columns],
  [`lookups/unit_weapon_links__wh3__${PATCH}__ultra.csv`, weaponLinks.columns],
  [`lookups/projectiles__wh3__${PATCH}.csv`, projectiles.columns],
  [`lookups/explosions__wh3__${PATCH}.csv`, explosions.columns],
  [`lookups/unit_abilities__wh3__${PATCH}__ultra.csv`, abilities.columns],
  [`lookups/unit_attributes__wh3__${PATCH}__ultra.csv`, attributes.columns],
  [`lookups/unit_contact_effects__wh3__${PATCH}__ultra.csv`, contacts.columns],
  [`lookups/unit_rosters__wh3__${PATCH}__ultra.csv`, rosters.columns],
  [`lookups/unit_mount_variants__wh3__${PATCH}__ultra.csv`, mountVariants.columns],
  [`lookups/data_quality_flags__wh3__${PATCH}__ultra.csv`, quality.columns],
]);
for (const [dataset, columns] of actualSchemas) {
  const documented = schemaInventory.rows
    .filter((row) => row.dataset === dataset)
    .sort((a, b) => Number(a.column_position) - Number(b.column_position))
    .map((row) => row.column_name);
  if (JSON.stringify(documented) !== JSON.stringify(columns)) fail(`${dataset}: schema inventory does not match the actual header.`);
}
if (!errors.some((message) => message.includes("schema inventory"))) pass("The machine-readable schema inventory matches every CSV header and column position.");

const componentsByUnit = new Map();
for (const row of components.rows) {
  if (!componentsByUnit.has(row.unit_key)) componentsByUnit.set(row.unit_key, []);
  componentsByUnit.get(row.unit_key).push(row);
}
for (const row of allRows) {
  const primary = (componentsByUnit.get(row.unit_key) ?? []).filter((component) => component.is_primary_health_pool === "true");
  if (primary.length !== 1) fail(`${row.unit_key}: expected one primary component; found ${primary.length}.`);
  else {
    if (primary[0].component_count !== row.entity_count) fail(`${row.unit_key}: component count disagrees with entity_count.`);
    if (Number(primary[0].known_hp_total) !== Number(row.hp_per_entity) * Number(row.entity_count)) fail(`${row.unit_key}: primary component HP disagrees with hp_per_entity × entity_count.`);
    if (row.tactical_category === "artillery") {
      const componentTotal = (componentsByUnit.get(row.unit_key) ?? []).reduce((sum, component) => sum + Number(component.known_hp_total || 0), 0);
      if (componentTotal !== Number(row.total_hp)) fail(`${row.unit_key}: artillery component HP does not sum to total_hp.`);
    } else if (primary[0].known_hp_total !== row.total_hp) fail(`${row.unit_key}: primary component HP disagrees with total_hp.`);
    if (primary[0].battle_entity_key !== row.source_battle_entity_key) fail(`${row.unit_key}: primary component source key disagrees with normalized source.`);
  }
  if (row.tactical_category !== "artillery" && Number(row.total_hp) !== Number(row.hp_per_entity) * Number(row.entity_count)) fail(`${row.unit_key}: total_hp is not hp_per_entity × entity_count.`);
  if ((row.entity_count === "1") !== (row.is_single_entity === "true")) fail(`${row.unit_key}: is_single_entity disagrees with entity_count.`);
  if (!["large", "very_large"].includes(row.primary_target_size) !== (row.is_large !== "true")) fail(`${row.unit_key}: is_large disagrees with the primary target size.`);
}
if (!errors.some((message) => message.includes("component") || message.includes("total_hp") || message.includes("is_single_entity") || message.includes("is_large"))) pass("Primary model counts, health pools, and target-size classifications are internally consistent.");

const monsterOverrides = new Set([
  "wh2_dlc12_lzd_mon_salamander_pack_0",
  "wh2_dlc12_lzd_mon_salamander_pack_0_blessed",
  "wh2_dlc13_lzd_mon_razordon_pack_0",
  "wh2_dlc13_lzd_mon_razordon_pack_0_blessed",
  "wh3_dlc25_nur_mon_soul_grinder_0_ror",
  "wh3_main_nur_mon_soul_grinder_0",
  "wh3_main_tze_mon_soul_grinder_0",
  "wh_dlc03_bst_inf_cygor_0",
]);
for (const unitKey of monsterOverrides) {
  const rows = allRows.filter((row) => row.unit_key === unitKey);
  if (!rows.length) fail(`${unitKey}: tactical-category golden unit is absent from all normalized rosters.`);
  for (const row of rows) {
    if (row.tactical_category !== "monster") fail(`${unitKey}: expected tactical_category monster; found ${row.tactical_category}.`);
    if (row.source_caste !== "missile_infantry") fail(`${unitKey}: expected preserved source_caste missile_infantry; found ${row.source_caste}.`);
  }
}
if (!errors.some((message) => message.includes("tactical_category") || message.includes("source_caste"))) pass("Curated missile-monster identities override source caste without erasing provenance.");

const missileLinksByUnit = new Map();
for (const row of weaponLinks.rows.filter((link) => link.attack_type === "missile")) {
  if (!missileLinksByUnit.has(row.unit_key)) missileLinksByUnit.set(row.unit_key, []);
  missileLinksByUnit.get(row.unit_key).push(row);
}
const projectileKeys = new Set(projectiles.rows.map((row) => row.projectile_key));
const explosionKeys = new Set(explosions.rows.map((row) => row.explosion_key));
for (const row of allRows) {
  const links = missileLinksByUnit.get(row.unit_key) ?? [];
  const has = row.has_missile_weapon === "true";
  if (has !== (links.length > 0)) fail(`${row.unit_key}: has_missile_weapon disagrees with weapon links.`);
  if (has && (!row.source_missile_weapon_key || !row.source_projectile_key)) fail(`${row.unit_key}: missile source keys are missing.`);
  if (!has) {
    for (const column of ["accuracy", "ammunition", "range", "reload_time", "missile_base_damage", "missile_ap_damage", "projectiles_per_shot", "shots_per_volley", "projectile_velocity", "calibration_distance", "calibration_area", "source_missile_weapon_key", "source_projectile_key"]) {
      if (row[column] !== "") fail(`${row.unit_key}: non-missile unit has populated ${column}.`);
    }
  }
  for (const link of links) if (!projectileKeys.has(link.projectile_key)) fail(`${row.unit_key}: unresolved projectile link ${link.projectile_key}.`);
  if (row.explosion_key && !explosionKeys.has(row.explosion_key)) fail(`${row.unit_key}: unresolved explosion ${row.explosion_key}.`);
}
for (const projectile of projectiles.rows) if (projectile.explosion_key && !explosionKeys.has(projectile.explosion_key)) fail(`${projectile.projectile_key}: unresolved explosion lookup ${projectile.explosion_key}.`);
if (!errors.some((message) => message.includes("missile") || message.includes("projectile") || message.includes("explosion"))) pass("Every missile, projectile, and explosion reference resolves, including engine-attached weapons.");

const main = new Map((await tsv("main_units_tables")).map((row) => [row.unit, row]));
const land = new Map((await tsv("land_units_tables")).map((row) => [row.key, row]));
const groupLinks = await tsv("units_to_groupings_military_permissions_tables");
const sourceGroupCounts = new Map();
const sourceGroupsByUnit = new Map();
for (const row of groupLinks) {
  if (!sourceGroupCounts.has(row.military_group)) sourceGroupCounts.set(row.military_group, new Set());
  sourceGroupCounts.get(row.military_group).add(row.unit);
  if (!sourceGroupsByUnit.has(row.unit)) sourceGroupsByUnit.set(row.unit, new Set());
  sourceGroupsByUnit.get(row.unit).add(row.military_group);
}
const rosterConfigBySlug = new Map(UNIT_ROSTERS.map((roster) => [roster.slug, roster]));
for (const file of normalized) {
  const slug = file.name.split("__")[0];
  const rosterConfig = rosterConfigBySlug.get(slug);
  const expectedUnitKeys = new Set((rosterConfig?.military_groups ?? []).flatMap((group) => [...(sourceGroupCounts.get(group) ?? [])]));
  const actualUnitKeys = new Set(file.rows.map((row) => row.unit_key));
  if (JSON.stringify([...actualUnitKeys].sort()) !== JSON.stringify([...expectedUnitKeys].sort())) fail(`${file.name}: roster membership differs from its configured source military-group union.`);
  for (const row of file.rows) {
    const sourceMain = main.get(row.unit_key);
    const sourceLand = sourceMain ? land.get(sourceMain.land_unit) : null;
    if (!sourceMain || !sourceLand) fail(`${row.unit_key}: missing from raw main/land source tables.`);
    if (sourceMain && row.source_land_unit_key !== sourceMain.land_unit) fail(`${row.unit_key}: source_land_unit_key disagrees with raw main_units.`);
    if (sourceMain && row.source_caste !== sourceMain.caste) fail(`${row.unit_key}: source_caste disagrees with raw main_units.`);
    if (sourceLand && row.source_unit_class !== sourceLand.class) fail(`${row.unit_key}: source_unit_class disagrees with raw land_units.`);
  }
}
if (!errors.some((message) => message.includes("military-group union") || message.includes("raw main/land"))) pass(`Roster membership exactly matches all configured source military-group unions for ${UNIT_ROSTERS.length} races.`);

const sourcePermissionsByUnit = groupBy(await tsv("units_custom_battle_permissions_tables"), "unit");
const rosterLookupByRaceUnit = new Map();
for (const row of rosters.rows) {
  if (!rosterLookupByRaceUnit.has(`${row.race_slug}\u0000${row.unit_key}`)) rosterLookupByRaceUnit.set(`${row.race_slug}\u0000${row.unit_key}`, []);
  rosterLookupByRaceUnit.get(`${row.race_slug}\u0000${row.unit_key}`).push(row);
  if (row.record_type === "military_group" && (!row.military_group || row.faction_permission_key)) fail(`unit_rosters: malformed military_group row for ${row.unit_key}.`);
  else if (row.record_type === "faction_permission" && (row.military_group || !row.faction_permission_key)) fail(`unit_rosters: malformed faction_permission row for ${row.unit_key}.`);
  else if (!['military_group', 'faction_permission'].includes(row.record_type)) fail(`unit_rosters: unknown record type ${row.record_type}.`);
}
for (const file of normalized) {
  const slug = file.name.split("__")[0];
  const rosterConfig = rosterConfigBySlug.get(slug);
  for (const row of file.rows) {
    const lookupRows = rosterLookupByRaceUnit.get(`${slug}\u0000${row.unit_key}`) ?? [];
    const expectedGroups = [...(sourceGroupsByUnit.get(row.unit_key) ?? [])].filter((group) => rosterConfig.military_groups.includes(group)).sort();
    const actualGroups = lookupRows.filter((item) => item.record_type === "military_group").map((item) => item.military_group).sort();
    if (JSON.stringify(actualGroups) !== JSON.stringify(expectedGroups)) fail(`${slug}/${row.unit_key}: roster military-group lookup differs from source.`);
    const expectedPermissionCount = new Set((sourcePermissionsByUnit.get(row.unit_key) ?? []).map((item) => item.faction).filter(Boolean)).size;
    const actualPermissionCount = new Set(lookupRows.filter((item) => item.record_type === "faction_permission").map((item) => item.faction_permission_key)).size;
    if (actualPermissionCount !== expectedPermissionCount || Number(row.permitted_faction_count) !== expectedPermissionCount) fail(`${slug}/${row.unit_key}: faction-permission count differs from source.`);
    const isCore = expectedGroups.includes(rosterConfig.military_group);
    const expectedExclusive = !isCore;
    const expectedScope = isCore ? expectedGroups.length > 1 ? "race_core_and_variant" : "race_core" : expectedPermissionCount === 1 ? "faction_exclusive" : "shared_variant";
    if ((row.is_faction_exclusive === "true") !== expectedExclusive || row.roster_scope !== expectedScope || Number(row.military_group_count) !== expectedGroups.length) fail(`${slug}/${row.unit_key}: normalized availability metadata differs from source memberships.`);
  }
}
if (!errors.some((message) => /unit_rosters|roster military-group|faction-permission|availability metadata/.test(message))) pass("Structured roster availability and exact military-group/faction-permission lookup rows reconcile to source.");

const golden = [
  ["wh_dlc03_bst_inf_bestigor_herd_0", 100, false, false],
  ["wh_dlc03_bst_inf_cygor_0", 1, true, true],
  ["wh2_dlc17_bst_mon_ghorgon_0", 1, false, true],
  ["wh3_dlc27_bst_mon_preyton", 1, false, true],
  ["wh2_main_hef_inf_lothern_sea_guard_0", 90, true, false],
  ["wh2_main_hef_inf_lothern_sea_guard_1", 90, true, false],
  ["wh2_dlc12_skv_inf_ratling_gun_0", 32, true, false],
  ["wh2_main_skv_inf_warpfire_thrower", 32, true, false],
  ["wh2_main_skv_art_plagueclaw_catapult", 4, true, true],
  ["wh2_main_skv_veh_doomwheel", 1, true, true],
  ["wh_main_grn_inf_black_orcs", 80, false, false],
  ["wh_main_grn_art_doom_diver_catapult", 4, true, true],
  ["wh2_dlc15_grn_mon_rogue_idol_0", 1, false, true],
  ["wh_main_grn_mon_arachnarok_spider_0", 1, false, true],
  ["wh2_dlc11_cst_mon_necrofex_colossus_0", 1, true, true],
  ["wh3_dlc27_hef_veh_skycutter_bolt_thrower", 4, true, true],
];
const byUnit = new Map(allRows.map((row) => [row.unit_key, row]));
if (PATCH === "9.0") {
  const sourceAbilities = groupBy(await tsv("land_units_to_unit_abilites_junctions_tables"), "land_unit");
  const expected = new Set([...byUnit].flatMap(([key, row]) =>
    (sourceAbilities.get(row.source_land_unit_key) ?? []).map(a => JSON.stringify([key, a.ability, a.culture]))));
  const actual = abilities.rows.map(a => JSON.stringify([a.unit_key, a.ability_key, a.culture_key]));
  if (!abilities.columns.includes("culture_key") || new Set(actual).size !== actual.length ||
      JSON.stringify([...expected].sort()) !== JSON.stringify(actual.sort()))
    fail("Unit ability relations must exactly preserve source culture conditions, including wildcard values.");
  else pass("Unit ability relations exactly preserve source culture conditions and wildcard values.");
}
for (const [key, count, ranged, large] of golden) {
  const row = byUnit.get(key);
  if (!row) fail(`Golden unit missing: ${key}.`);
  else if (Number(row.entity_count) !== count || (row.has_missile_weapon === "true") !== ranged || (row.is_large === "true") !== large) fail(`Golden unit check failed: ${key}.`);
}
if (!errors.some((message) => message.includes("Golden"))) pass("Golden checks pass for Bestigors, Cygors, Ghorgons, Preytons, Sea Guard, Skaven weapon teams/artillery, Doomwheel, Black Orcs, Doom Divers, Rogue Idols, Arachnaroks, Necrofex, and Skycutters.");

const sourceManifest = JSON.parse(await readFile(path.join(SOURCE, "source_manifest.json"), "utf8"));
for (const entry of sourceManifest.files) {
  const file = path.join(SOURCE, ...entry.path.split("/"));
  if (!matchesTextFingerprint(await readFile(file), entry.sha256, entry.bytes)) fail(`Source export hash mismatch: ${entry.path}.`);
}
if (!errors.some((message) => message.includes("hash mismatch"))) pass(`All ${sourceManifest.files.length} raw source-export hashes match the manifest.`);

for (const [name, data] of [["abilities", abilities], ["attributes", attributes], ["contacts", contacts], ["rosters", rosters], ["mount variants", mountVariants]]) {
  for (const row of data.rows) {
    const unitKey = row.unit_key ?? row.base_unit_key;
    if (!unitKeys.has(unitKey)) fail(`${name}: orphan unit reference ${unitKey}.`);
  }
}
if (quality.rows.length) warn(`${quality.rows.length} explicit data-quality flags remain; inspect the companion file.`);
else pass("No unresolved extraction or join flags remain.");

const report = {
  status: errors.length ? "failed" : "passed",
  checked_at_utc: new Date().toISOString(),
  normalized_files: normalizedFiles,
  total_units: allRows.length,
  lookup_rows: {
    components: components.rows.length,
    weapon_links: weaponLinks.rows.length,
    projectiles: projectiles.rows.length,
    explosions: explosions.rows.length,
    abilities: abilities.rows.length,
    attributes: attributes.rows.length,
    contact_effects: contacts.rows.length,
    rosters: rosters.rows.length,
    mount_variants: mountVariants.rows.length,
    quality_flags: quality.rows.length,
  },
  passes,
  warnings,
  errors,
};
await writeFile(path.join(DATASET, "audit_report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# Unit dataset audit",
  "",
  `Status: **${report.status.toUpperCase()}**`,
  "",
  `Checked ${report.total_units} normalized units across ${normalizedFiles.length} faction files.`,
  "",
  "## Passed checks",
  "",
  ...passes.map((item) => `- ${item}`),
  "",
  "## Warnings",
  "",
  ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None."]),
  "",
  "## Errors",
  "",
  ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None."]),
  "",
].join("\n");
await writeFile(path.join(DATASET, "audit_report.md"), markdown, "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
