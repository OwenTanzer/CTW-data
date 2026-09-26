import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { matchesTextFingerprint } from "./validation-text.mjs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "data/economy/source_exports");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { SKILL_RACES: RACES } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const DATASET = path.resolve(ROOT, process.argv[3] ?? "data/economy");
const DB = path.join(SOURCE, "db");
const LOC = path.join(SOURCE, "text", "db");

const EXPECTED_COLUMNS = [
  "game", "patch", "steam_build_id",
  "race", "race_slug", "culture_key", "subculture_key",
  "faction_name", "faction_key", "campaign_key",
  "building_name", "building_key", "building_chain_name", "building_chain_key",
  "building_level", "settlement_tier_requirement",
  "construction_cost", "construction_turns", "building_upkeep",
  "only_in_capital", "resource_requirement_key", "required_building_key",
  "income", "growth", "control",
  "trade_resource_key", "trade_resource_quantity",
  "recruitment_cost_modifier", "upkeep_modifier",
  "is_unique",
];

const GROWTH_EFFECTS = new Set([
  "wh_main_effect_province_growth_building",
  "wh_main_effect_hordebuilding_growth_core",
  "wh_main_effect_blackark_growth_core",
  "wh2_dlc11_cst_ship_growth",
  "wh3_dlc27_effect_dragonship_growth_core",
  "wh3_main_effect_province_growth_faction",
]);
const CONTROL_EFFECTS = new Set(["wh_main_effect_public_order_base", "wh_main_effect_public_order_base_negative"]);
const RECRUITMENT_COST_EFFECTS = new Set([
  "wh_main_effect_force_all_campaign_recruitment_cost_all",
  "wh3_main_effect_recruitment_cost_kho_all",
  "wh3_main_effect_recruitment_cost_nur_all",
  "wh3_main_effect_recruitment_cost_sla_all",
  "wh3_main_effect_recruitment_cost_tze_all",
]);
const UPKEEP_EFFECTS = new Set(["wh_main_effect_force_all_campaign_upkeep"]);
const RESOURCE_SUFFIX_TO_KEY = new Map(Object.entries({
  animals: "res_animals", beer: "res_beer", dyes: "res_dyes", furs: "res_rom_furs",
  gem: "res_gems", gold_idols: "res_gold_idols", iron: "res_rom_iron", ivory: "res_ivory",
  marble: "res_rom_marble", medicine: "res_medicine", obsidian: "res_obsidian",
  pottery: "res_pottery", salt: "res_salt", spices: "res_spices", timber: "res_rom_timber",
  trinkets: "res_trinkets", wine: "res_rom_wine",
}));

function parseDelimited(text, delimiter) {
  if (delimiter === "\t") return parseRpfmTsv(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') { field += '"'; index++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n") {
      if (field.endsWith("\r")) field = field.slice(0, -1);
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function recordsFromText(text, delimiter) {
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
  const headers = rows.shift() ?? [];
  const records = rows
    .filter((row) => row.some((value) => value !== "") && !String(row[0] ?? "").startsWith("#"))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
  return { headers, records };
}

async function loadTable(name) {
  return recordsFromText(await readFile(path.join(DB, name, "data__.tsv"), "utf8").then((buffer) => buffer.toString("utf8")), "\t").records;
}

async function loadLoc(name) {
  return recordsFromText(await readFile(path.join(LOC, `${name}.loc.tsv`), "utf8"), "\t").records;
}

function indexBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    if (!result.has(row[key])) result.set(row[key], []);
    result.get(row[key]).push(row);
  }
  return result;
}


function sumEffectRows(rows) {
  if (!rows.length) return null;
  return rows.reduce((total, row) => total + Number(row.value), 0);
}

function singleEffectValue(rows) {
  return rows.length === 1 ? Number(rows[0].value) : null;
}

function standardEffects(rows) {
  const unconditional = rows.filter((row) => !row.context_requirement);
  const income = unconditional.filter((row) => /effect_economy_gdp_(?!mod_)/.test(row.effect));
  const growth = unconditional.filter((row) => GROWTH_EFFECTS.has(row.effect));
  const control = unconditional.filter((row) => CONTROL_EFFECTS.has(row.effect));
  const recruitment = unconditional.filter((row) => RECRUITMENT_COST_EFFECTS.has(row.effect));
  const upkeep = unconditional.filter((row) => UPKEEP_EFFECTS.has(row.effect));
  const resourceRows = unconditional
    .map((row) => ({ row, match: row.effect.match(/effect_region_resource_(.+)_production$/) }))
    .filter((item) => item.match)
    .map((item) => ({ ...item.row, resource: RESOURCE_SUFFIX_TO_KEY.get(item.match[1]) ?? `res_${item.match[1]}` }));
  const resourceKeys = [...new Set(resourceRows.map((row) => row.resource))];
  return {
    income: sumEffectRows(income),
    growth: sumEffectRows(growth),
    control: sumEffectRows(control),
    trade_resource_key: resourceKeys.length === 1 ? resourceKeys[0] : "",
    trade_resource_quantity: resourceKeys.length === 1 ? sumEffectRows(resourceRows) : null,
    recruitment_cost_modifier: singleEffectValue(recruitment),
    upkeep_modifier: singleEffectValue(upkeep),
  };
}

function sameNumber(observed, expected) {
  if (expected === null || expected === undefined) return observed === "";
  return observed !== "" && Number(observed) === Number(expected);
}

async function walkCsv(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walkCsv(fullPath)));
    else if (entry.isFile() && entry.name.endsWith(".csv")) results.push(fullPath);
  }
  return results;
}

const errors = [];
const warnings = [];
const passes = [];

const sourceManifestPath = path.join(SOURCE, "source_manifest.json");
const sourceManifest = JSON.parse(await readFile(sourceManifestPath, "utf8"));
for (const file of sourceManifest.files) {
  const fullPath = path.join(SOURCE, ...file.path.split("/"));
  try {
    const contents = await readFile(fullPath);
    if (!matchesTextFingerprint(contents, file.sha256, file.bytes)) errors.push(`Source hash mismatch: ${file.path}`);
  } catch {
    errors.push(`Missing source export: ${file.path}`);
  }
}
if (!errors.length) passes.push(`All ${sourceManifest.files.length} authoritative source-export hashes match their manifest.`);

const [
  levels,
  chains,
  availabilities,
  availabilitySets,
  variants,
  buildingEffects,
  requiredBuildings,
  factions,
  culturesSubcultures,
  frontendLeaders,
  buildingVariantLoc,
  buildingChainLoc,
  factionLoc,
] = await Promise.all([
  loadTable("building_levels_tables"),
  loadTable("building_chains_tables"),
  loadTable("building_chain_availabilities_tables"),
  loadTable("building_chain_availability_sets_tables"),
  loadTable("building_culture_variants_tables"),
  loadTable("building_effects_junction_tables"),
  loadTable("building_level_required_buildings_tables"),
  loadTable("factions_tables"),
  loadTable("cultures_subcultures_tables"),
  loadTable("frontend_faction_leaders_tables"),
  loadLoc("building_culture_variants__"),
  loadLoc("building_chains__"),
  loadLoc("factions__"),
]);

const factionByKey = indexBy(factions, "key");
const cultureBySubculture = new Map(culturesSubcultures.map((row) => [row.subculture, row.culture]));
const raceBySubculture = new Map(RACES.map((race) => [race.subculture_key, race]));
const chainByKey = indexBy(chains, "key");
const levelByKey = indexBy(levels, "level_name");
const levelsByChain = groupBy(levels, "chain");
const chainsBySet = groupBy(availabilitySets, "id");
const variantsByBuilding = groupBy(variants, "building");
const effectsByBuilding = groupBy(buildingEffects, "building");
const requiredBuildingByLevel = indexBy(requiredBuildings, "building_level");
const buildingVariantLocByKey = new Map(buildingVariantLoc.map((row) => [row.key, row.text]));
const buildingChainLocByKey = new Map(buildingChainLoc.map((row) => [row.key, row.text]));
const factionLocByKey = new Map(factionLoc.map((row) => [row.key, row.text]));
const playableFactionKeys = [...new Set(frontendLeaders
  .map((row) => row.faction)
  .filter((key) => key && key !== "wh3_prologue_kislev_expedition"))].sort();

if (playableFactionKeys.length !== SNAPSHOT.factionCount) errors.push(`Expected ${SNAPSHOT.factionCount} playable faction keys, found ${playableFactionKeys.length}.`);
else passes.push(`The source frontend roster resolves to exactly ${SNAPSHOT.factionCount} non-prologue playable faction keys.`);

function matchingVariant(buildingKey, factionKey, subcultureKey, cultureKey) {
  const candidates = (variantsByBuilding.get(buildingKey) ?? [])
    .filter((row) => (!row.faction || row.faction === factionKey)
      && (!row.subculture || row.subculture === subcultureKey)
      && (!row.culture || row.culture === cultureKey))
    .map((row) => ({ row, score: (row.faction ? 4 : 0) + (row.subculture ? 2 : 0) + (row.culture ? 1 : 0) }))
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.row ?? null;
}

function expectedRowsForFaction(factionKey) {
  const faction = factionByKey.get(factionKey);
  if (!faction) return new Set();
  const cultureKey = cultureBySubculture.get(faction.subculture) ?? "";
  const scopes = new Map();
  for (const availability of availabilities.filter((row) => (!row.faction || row.faction === factionKey)
    && (!row.sub_culture || row.sub_culture === faction.subculture)
    && (!row.culture || row.culture === cultureKey))) {
    for (const item of chainsBySet.get(availability.set_id) ?? []) {
      if (!scopes.has(item.building_chain)) scopes.set(item.building_chain, new Set());
      scopes.get(item.building_chain).add(availability.campaign || "");
    }
  }
  for (const campaigns of scopes.values()) {
    if (campaigns.has("")) {
      campaigns.clear();
      campaigns.add("");
    }
  }
  const result = new Set();
  for (const [chainKey, campaigns] of scopes) {
    const chain = chainByKey.get(chainKey);
    if (!chain || chain.chain_category === "abandoned" || chain.chain_category === "slum") continue;
    for (const level of levelsByChain.get(chainKey) ?? []) {
      if (level.visible_in_ui !== "true" || /_ruin$/.test(level.level_name)) continue;
      const variant = matchingVariant(level.level_name, factionKey, faction.subculture, cultureKey);
      if (!variant || variant.disables === "true") continue;
      for (const campaignKey of campaigns) result.add(`${campaignKey}\u0000${level.level_name}`);
    }
  }
  return result;
}

const indexPath = path.join(DATASET, `faction_index__wh3__${PATCH}.csv`);
const indexText = await readFile(indexPath, "utf8");
const index = recordsFromText(indexText, ",").records;
if (index.length !== playableFactionKeys.length) errors.push(`Faction index has ${index.length} rows, expected ${playableFactionKeys.length}.`);
if (new Set(index.map((row) => row.faction_key)).size !== index.length) errors.push("Faction index contains duplicate faction keys.");
const indexedKeys = new Set(index.map((row) => row.faction_key));
for (const key of playableFactionKeys) if (!indexedKeys.has(key)) errors.push(`Faction index is missing ${key}.`);
if (!errors.some((error) => error.includes("Faction index"))) passes.push("The faction index contains every playable faction exactly once.");

const factionCsvPaths = (await walkCsv(path.join(DATASET, "factions"))).sort();
if (factionCsvPaths.length !== playableFactionKeys.length) errors.push(`Found ${factionCsvPaths.length} faction CSVs, expected ${playableFactionKeys.length}.`);
else passes.push(`All ${SNAPSHOT.factionCount} faction economy CSV files are present.`);

let totalRows = 0;
let localizedNameGaps = 0;
const recordsByFaction = new Map();
for (const indexRow of index) {
  const fullPath = path.join(DATASET, ...indexRow.relative_path.split("/"));
  let buffer;
  try { buffer = await readFile(fullPath); } catch { errors.push(`Missing indexed file: ${indexRow.relative_path}`); continue; }
  const text = buffer.toString("utf8");
  if (text.includes("\uFFFD")) errors.push(`Invalid UTF-8 replacement character: ${indexRow.relative_path}`);
  if (/\r(?!\n)/.test(text)) errors.push(`Bare CR line ending: ${indexRow.relative_path}`);
  const { headers, records } = recordsFromText(text, ",");
  recordsByFaction.set(indexRow.faction_key, records);
  if (headers.join("\u0000") !== EXPECTED_COLUMNS.join("\u0000")) errors.push(`Header mismatch: ${indexRow.relative_path}`);
  if (Number(indexRow.building_rows) !== records.length) errors.push(`Index row-count mismatch: ${indexRow.relative_path}`);
  if (!matchesTextFingerprint(buffer, indexRow.file_sha256, indexRow.file_bytes)) errors.push(`Index hash mismatch: ${indexRow.relative_path}`);
  const expected = expectedRowsForFaction(indexRow.faction_key);
  const observed = new Set();
  for (const row of records) {
    if (row.game !== "warhammer_3" || row.patch !== PATCH || row.steam_build_id !== SNAPSHOT.context.steam_build_id) errors.push(`Context mismatch in ${indexRow.relative_path}: ${row.building_key}`);
    if (row.faction_key !== indexRow.faction_key || row.race_slug !== indexRow.race_slug) errors.push(`Ownership mismatch in ${indexRow.relative_path}: ${row.building_key}`);
    const key = `${row.campaign_key}\u0000${row.building_key}`;
    if (observed.has(key)) errors.push(`Duplicate faction/building/campaign row in ${indexRow.relative_path}: ${row.building_key}`);
    observed.add(key);
    if (!expected.has(key)) errors.push(`Unexpected building row in ${indexRow.relative_path}: ${row.campaign_key}/${row.building_key}`);
    const sourceLevel = levelByKey.get(row.building_key);
    if (!sourceLevel) errors.push(`Unknown building key in ${indexRow.relative_path}: ${row.building_key}`);
    const faction = factionByKey.get(row.faction_key);
    const variant = faction
      ? matchingVariant(row.building_key, row.faction_key, faction.subculture, cultureBySubculture.get(faction.subculture) ?? "")
      : null;
    if (!variant || variant.disables === "true") errors.push(`No applicable enabled culture variant in ${indexRow.relative_path}: ${row.building_key}`);
    else {
      const locKey = `building_culture_variants_name_${row.building_key}${variant.culture}${variant.subculture}${variant.faction}`;
      const localizedName = buildingVariantLocByKey.get(locKey);
      if (!localizedName) errors.push(`Missing English building localisation in ${indexRow.relative_path}: ${row.building_key}`);
      else if (row.building_name !== localizedName) errors.push(`Building-name mismatch in ${indexRow.relative_path}: ${row.building_key}`);
    }
    if (faction && sourceLevel) {
      const race = raceBySubculture.get(faction.subculture);
      const cultureKey = cultureBySubculture.get(faction.subculture) ?? "";
      const sourceChain = chainByKey.get(sourceLevel.chain);
      const expectedFactionName = factionLocByKey.get(`factions_screen_name_${row.faction_key}`) || row.faction_key;
      const expectedChainName = buildingChainLocByKey.get(`building_chains_chain_tooltip_${sourceLevel.chain}`) || sourceLevel.chain;
      if (row.race !== race?.name || row.race_slug !== race?.slug || row.subculture_key !== faction.subculture || row.culture_key !== cultureKey) errors.push(`Faction/race metadata mismatch in ${indexRow.relative_path}: ${row.building_key}`);
      if (row.faction_name !== expectedFactionName) errors.push(`Faction-name mismatch in ${indexRow.relative_path}: ${row.building_key}`);
      if (row.building_chain_key !== sourceLevel.chain || row.building_chain_name !== expectedChainName) errors.push(`Building-chain mismatch in ${indexRow.relative_path}: ${row.building_key}`);
      for (const [column, expectedValue] of [
        ["building_level", sourceLevel.level],
        ["settlement_tier_requirement", sourceLevel.primary_slot_building_building_level_requirement],
        ["construction_cost", sourceLevel.create_cost],
        ["construction_turns", sourceLevel.create_time],
        ["building_upkeep", sourceLevel.upkeep_cost],
      ]) {
        if (!sameNumber(row[column], Number(expectedValue))) errors.push(`Source-value mismatch for ${column} in ${indexRow.relative_path}: ${row.building_key}`);
      }
      if (row.only_in_capital !== sourceLevel.only_in_capital) errors.push(`Source-value mismatch for only_in_capital in ${indexRow.relative_path}: ${row.building_key}`);
      if (row.resource_requirement_key !== sourceLevel.resource_requirement) errors.push(`Source-value mismatch for resource_requirement_key in ${indexRow.relative_path}: ${row.building_key}`);
      if (row.required_building_key !== (requiredBuildingByLevel.get(row.building_key)?.required ?? "")) errors.push(`Source-value mismatch for required_building_key in ${indexRow.relative_path}: ${row.building_key}`);
      const expectedUnique = sourceLevel.faction_unique === "true" || /(?:^|_)(?:special|landmark)(?:_|$)/.test(sourceLevel.chain);
      if (row.is_unique !== (expectedUnique ? "true" : "false")) errors.push(`Source-value mismatch for is_unique in ${indexRow.relative_path}: ${row.building_key}`);
      if (!sourceChain) errors.push(`Missing source chain for ${row.building_key}: ${sourceLevel.chain}`);
      const metrics = standardEffects(effectsByBuilding.get(row.building_key) ?? []);
      for (const column of ["income", "growth", "control", "trade_resource_quantity", "recruitment_cost_modifier", "upkeep_modifier"]) {
        if (!sameNumber(row[column], metrics[column])) errors.push(`Standard-metric mismatch for ${column} in ${indexRow.relative_path}: ${row.building_key}`);
      }
      if (row.trade_resource_key !== metrics.trade_resource_key) errors.push(`Standard-metric mismatch for trade_resource_key in ${indexRow.relative_path}: ${row.building_key}`);
    }
    for (const booleanColumn of ["only_in_capital", "is_unique"]) {
      if (!new Set(["true", "false"]).has(row[booleanColumn])) errors.push(`Invalid boolean ${booleanColumn} in ${indexRow.relative_path}: ${row.building_key}`);
    }
    for (const numericColumn of ["building_level", "settlement_tier_requirement", "construction_cost", "construction_turns", "building_upkeep", "income", "growth", "control", "trade_resource_quantity", "recruitment_cost_modifier", "upkeep_modifier"]) {
      if (row[numericColumn] !== "" && !Number.isFinite(Number(row[numericColumn]))) errors.push(`Invalid numeric ${numericColumn} in ${indexRow.relative_path}: ${row.building_key}`);
    }
    if (row.building_name === row.building_key) localizedNameGaps++;
  }
  for (const key of expected) if (!observed.has(key)) errors.push(`Missing expected building row in ${indexRow.relative_path}: ${key.replace("\u0000", "/")}`);
  totalRows += records.length;
}

if (!errors.some((error) => /Header|UTF-8|line ending|boolean|numeric|Duplicate/.test(error))) {
  passes.push("Every faction CSV is valid UTF-8 with LF or CRLF endings, the canonical header, typed numeric fields, lowercase booleans, and unique building rows.");
}
if (!errors.some((error) => /expected building|Unexpected building|Missing expected|culture variant|building localisation/.test(error))) {
  passes.push(`All ${totalRows} constructible building rows reconcile to faction availability, visibility, enabled culture variants, and English localisation.`);
}
if (!errors.some((error) => /mismatch|Missing source chain/.test(error))) passes.push("Every intrinsic building field, localized label, uniqueness flag, and standardized economic metric recomputes exactly from the source tables.");
if (!errors.some((error) => /Index .*mismatch/.test(error))) passes.push("The faction index reconciles every path, row count, byte count, and SHA-256 file hash.");

const schemaText = await readFile(path.join(DATASET, "schema_inventory__v1.csv"), "utf8");
const schema = recordsFromText(schemaText, ",").records;
if (schema.map((row) => row.column_name).join("\u0000") !== EXPECTED_COLUMNS.join("\u0000")) errors.push("Schema inventory does not match the canonical faction CSV header.");
else passes.push("The machine-readable schema inventory matches every faction CSV column and position.");

const observedRaceCounts = new Map();
for (const row of index) observedRaceCounts.set(row.race_slug, (observedRaceCounts.get(row.race_slug) ?? 0) + 1);
for (const race of RACES) {
  const sourceCount = playableFactionKeys.filter((key) => factionByKey.get(key)?.subculture === race.subculture_key).length;
  if ((observedRaceCounts.get(race.slug) ?? 0) !== sourceCount) errors.push(`Race faction-count mismatch for ${race.name}.`);
}
if (!errors.some((error) => error.includes("Race faction-count"))) passes.push(`Faction totals reconcile across all ${RACES.length} playable races.`);

for (const representative of [
  ["wh_main_emp_empire", "wh_main_emp_industry_basic_1"],
  ["wh2_main_skv_clan_mors", "wh2_main_skv_energy_3"],
  ["wh3_dlc23_chd_astragoth", "wh3_dlc23_chd_settlement_factory_2"],
]) {
  const rows = recordsByFaction.get(representative[0]);
  if (!rows) { errors.push(`Golden faction absent: ${representative[0]}`); continue; }
  if (!rows.some((row) => row.building_key === representative[1])) errors.push(`Golden building key not found for ${representative[0]}: ${representative[1]}`);
}
if (!errors.some((error) => error.startsWith("Golden"))) passes.push("Golden checks cover conventional, Skaven, and Chaos Dwarf building systems.");

for (const regression of [
  { building: "wh2_dlc14_skv_eshin_assassins_1", owner: "wh2_main_skv_clan_eshin", excluded: "wh2_main_skv_clan_mors" },
  { building: "wh2_main_special_everqueen_court_hef", owner: "wh2_main_hef_avelorn", excluded: "wh2_main_hef_eataine" },
  { building: "wh3_dlc25_special_gelt_embassy_1", owner: "wh2_dlc13_emp_golden_order", excluded: "wh_main_emp_empire" },
]) {
  const ownerRows = recordsByFaction.get(regression.owner) ?? [];
  const excludedRows = recordsByFaction.get(regression.excluded) ?? [];
  if (!ownerRows.some((row) => row.building_key === regression.building)) errors.push(`Faction-variant regression: ${regression.owner} is missing ${regression.building}.`);
  if (excludedRows.some((row) => row.building_key === regression.building)) errors.push(`Faction-variant regression: ${regression.excluded} incorrectly contains ${regression.building}.`);
}
if (!errors.some((error) => error.startsWith("Faction-variant regression"))) passes.push("Faction-specific Eshin, Avelorn, and Golden Order levels remain with their owners and do not leak into peer factions.");
if (localizedNameGaps) errors.push(`${localizedNameGaps} faction/building rows fell back to a database key instead of an English building name.`);

const status = errors.length ? "failed" : "passed";
const report = {
  status,
  checked_at_utc: new Date().toISOString(),
  playable_faction_files: index.length,
  building_rows: totalRows,
  passes,
  warnings,
  errors,
};
await writeFile(path.join(DATASET, "audit_report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = `# Faction economy dataset audit\n\nStatus: **${status.toUpperCase()}**\n\nChecked ${index.length} playable faction files and ${totalRows} building rows.\n\n## Passed checks\n\n${passes.map((item) => `- ${item}`).join("\n") || "- None."}\n\n## Warnings\n\n${warnings.map((item) => `- ${item}`).join("\n") || "- None."}\n\n## Errors\n\n${errors.map((item) => `- ${item}`).join("\n") || "- None."}\n`;
await writeFile(path.join(DATASET, "audit_report.md"), markdown.replaceAll("\n", "\r\n"), "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
