import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_economy__wh3__8.1.1");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { SKILL_RACES: RACES } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const OUTPUT = path.resolve(ROOT, process.argv[3] ?? "work/generated_economy__wh3__8.1.1");
const DB = path.join(SOURCE, "db");
const LOC = path.join(SOURCE, "text", "db");

const CONTEXT = { ...SNAPSHOT.context };

const COLUMNS = [
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

const COLUMN_DESCRIPTIONS = {
  game: "Stable game identifier.",
  patch: "Game patch represented by this row.",
  steam_build_id: "Steam build ID represented by this row.",
  race: "Canonical playable race label used by this project.",
  race_slug: "Filesystem-safe canonical race identifier.",
  culture_key: "Source culture key resolved from the faction subculture.",
  subculture_key: "Source subculture key for the playable faction.",
  faction_name: "Localized English playable faction name.",
  faction_key: "Stable playable faction database key and owner of this CSV.",
  campaign_key: "Only populated when the building chain is restricted to a source campaign; blank means campaign-generic.",
  building_name: "Best matching English building-level name for this faction; stable keys remain canonical.",
  building_key: "Stable building_levels level_name key.",
  building_chain_name: "Localized English building-chain label when available.",
  building_chain_key: "Stable building_chains key.",
  building_level: "Zero-based level within the source building chain; this is not the settlement tier.",
  settlement_tier_requirement: "Minimum primary settlement tier recorded on the building level.",
  construction_cost: "Base treasury construction cost before campaign modifiers.",
  construction_turns: "Base construction duration in turns before campaign modifiers.",
  building_upkeep: "Base recurring building upkeep from building_levels.",
  only_in_capital: "Source only_in_capital flag.",
  resource_requirement_key: "Simple source region-resource requirement, if any.",
  required_building_key: "Simple direct building requirement, if any.",
  income: "Sum of unconditional fixed GDP effects on the intact building; excludes percentage and conditional effects.",
  growth: "Sum of unconditional ordinary province, horde, ship, or Black Ark growth effects on the intact building.",
  control: "Sum of unconditional local public-order/control base effects on the intact building.",
  trade_resource_key: "Stable resource key when the building has exactly one unconditional standardized trade-resource output.",
  trade_resource_quantity: "Unconditional intact output for trade_resource_key; blank for multi-resource or nonstandard outputs.",
  recruitment_cost_modifier: "Unconditional all-unit campaign recruitment-cost modifier when exactly one standardized effect applies.",
  upkeep_modifier: "Unconditional all-unit campaign upkeep modifier when exactly one standardized effect applies.",
  is_unique: "True for source faction-unique levels or chain keys identified as special/landmark content.",
};

const GROWTH_EFFECTS = new Set([
  "wh_main_effect_province_growth_building",
  "wh_main_effect_hordebuilding_growth_core",
  "wh_main_effect_blackark_growth_core",
  "wh2_dlc11_cst_ship_growth",
  "wh3_dlc27_effect_dragonship_growth_core",
  "wh3_main_effect_province_growth_faction",
]);

const CONTROL_EFFECTS = new Set([
  "wh_main_effect_public_order_base",
  "wh_main_effect_public_order_base_negative",
]);

const RECRUITMENT_COST_EFFECTS = new Set([
  "wh_main_effect_force_all_campaign_recruitment_cost_all",
  "wh3_main_effect_recruitment_cost_kho_all",
  "wh3_main_effect_recruitment_cost_nur_all",
  "wh3_main_effect_recruitment_cost_sla_all",
  "wh3_main_effect_recruitment_cost_tze_all",
]);

const UPKEEP_EFFECTS = new Set(["wh_main_effect_force_all_campaign_upkeep"]);

const RESOURCE_SUFFIX_TO_KEY = new Map(Object.entries({
  animals: "res_animals",
  beer: "res_beer",
  dyes: "res_dyes",
  furs: "res_rom_furs",
  gem: "res_gems",
  gold_idols: "res_gold_idols",
  iron: "res_rom_iron",
  ivory: "res_ivory",
  marble: "res_rom_marble",
  medicine: "res_medicine",
  obsidian: "res_obsidian",
  pottery: "res_pottery",
  salt: "res_salt",
  spices: "res_spices",
  timber: "res_rom_timber",
  trinkets: "res_trinkets",
  wine: "res_rom_wine",
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
  return rows
    .filter((row) => row.some((value) => value !== "") && !String(row[0] ?? "").startsWith("#"))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

async function loadTable(name) {
  return recordsFromText(await readFile(path.join(DB, name, "data__.tsv"), "utf8"), "\t");
}

async function loadLoc(name) {
  return recordsFromText(await readFile(path.join(LOC, `${name}.loc.tsv`), "utf8"), "\t");
}

function indexBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
}

function bool(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function num(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function out(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function csvCell(value) {
  const text = out(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(rows, columns = COLUMNS) {
  return `${[columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(csvCell).join(","))
    .join("\r\n")}\r\n`;
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sum(rows) {
  if (!rows.length) return null;
  return rows.reduce((total, row) => total + Number(row.value), 0);
}

function singleValue(rows) {
  return rows.length === 1 ? num(rows[0].value) : null;
}

const [
  levels,
  chains,
  availabilities,
  availabilitySets,
  cultureVariants,
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

const chainByKey = indexBy(chains, "key");
const levelsByChain = groupBy(levels, "chain");
const chainsByAvailabilitySet = groupBy(availabilitySets, "id");
const variantsByBuilding = groupBy(cultureVariants, "building");
const effectsByBuilding = groupBy(buildingEffects, "building");
const requiredBuildingByLevel = indexBy(requiredBuildings, "building_level");
const factionByKey = indexBy(factions, "key");
const cultureBySubculture = new Map(culturesSubcultures.map((row) => [row.subculture, row.culture]));
const raceBySubculture = new Map(RACES.map((race) => [race.subculture_key, race]));
const loc = new Map([...buildingVariantLoc, ...buildingChainLoc, ...factionLoc].map((row) => [row.key, row.text]));

const playableFactionKeys = [...new Set(frontendLeaders
  .map((row) => row.faction)
  .filter((key) => key && key !== "wh3_prologue_kislev_expedition"))].sort();

function factionName(key) {
  return loc.get(`factions_screen_name_${key}`) || key;
}

function matchingVariant(buildingKey, factionKey, subcultureKey, cultureKey) {
  const candidates = (variantsByBuilding.get(buildingKey) ?? [])
    .filter((row) => (!row.faction || row.faction === factionKey)
      && (!row.subculture || row.subculture === subcultureKey)
      && (!row.culture || row.culture === cultureKey))
    .map((row) => ({
      row,
      score: (row.faction ? 4 : 0) + (row.subculture ? 2 : 0) + (row.culture ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score);
  return candidates[0]?.row ?? null;
}

function buildingName(buildingKey, variant) {
  if (variant) {
    const key = `building_culture_variants_name_${buildingKey}${variant.culture}${variant.subculture}${variant.faction}`;
    if (loc.has(key)) return loc.get(key);
  }
  const fallbackKey = `building_culture_variants_name_${buildingKey}`;
  return loc.get(fallbackKey) || buildingKey;
}

function standardEffects(buildingKey) {
  const unconditional = (effectsByBuilding.get(buildingKey) ?? []).filter((row) => !row.context_requirement);
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
    income: sum(income),
    growth: sum(growth),
    control: sum(control),
    trade_resource_key: resourceKeys.length === 1 ? resourceKeys[0] : null,
    trade_resource_quantity: resourceKeys.length === 1 ? sum(resourceRows) : null,
    recruitment_cost_modifier: singleValue(recruitment),
    upkeep_modifier: singleValue(upkeep),
    has_nonstandard_resource_output: resourceKeys.length > 1,
  };
}

function campaignScopesForFaction(factionKey, subcultureKey, cultureKey) {
  const matches = availabilities.filter((row) => (!row.faction || row.faction === factionKey)
    && (!row.sub_culture || row.sub_culture === subcultureKey)
    && (!row.culture || row.culture === cultureKey));
  const scopes = new Map();
  for (const availability of matches) {
    for (const item of chainsByAvailabilitySet.get(availability.set_id) ?? []) {
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
  return scopes;
}

await mkdir(path.join(OUTPUT, "factions"), { recursive: true });
const indexRows = [];
let totalRows = 0;
let standardIncomeRows = 0;
let standardGrowthRows = 0;
let standardControlRows = 0;
let standardResourceRows = 0;
let omittedMultiResourceRows = 0;

for (const factionKey of playableFactionKeys) {
  const faction = factionByKey.get(factionKey);
  if (!faction) throw new Error(`Playable faction is absent from factions_tables: ${factionKey}`);
  const race = raceBySubculture.get(faction.subculture);
  if (!race) throw new Error(`Playable faction has an out-of-scope subculture: ${factionKey} -> ${faction.subculture}`);
  const cultureKey = cultureBySubculture.get(faction.subculture) ?? "";
  const campaignScopes = campaignScopesForFaction(factionKey, faction.subculture, cultureKey);
  const rows = [];

  for (const [chainKey, campaigns] of [...campaignScopes.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const chain = chainByKey.get(chainKey);
    if (!chain || chain.chain_category === "abandoned" || chain.chain_category === "slum") continue;
    for (const level of (levelsByChain.get(chainKey) ?? []).sort((a, b) => Number(a.level) - Number(b.level))) {
      if (bool(level.visible_in_ui) !== true || /_ruin$/.test(level.level_name)) continue;
      const variant = matchingVariant(level.level_name, factionKey, faction.subculture, cultureKey);
      // Availability sets operate at chain level and can contain faction-specific
      // alternatives. A level is usable only when its most-specific culture variant
      // applies to this faction; otherwise it belongs to another faction in the same
      // race-level availability set.
      if (!variant || bool(variant.disables) === true) continue;
      const metrics = standardEffects(level.level_name);
      const name = buildingName(level.level_name, variant);
      const chainName = loc.get(`building_chains_chain_tooltip_${chainKey}`) || chainKey;
      const isUnique = bool(level.faction_unique) === true || /(?:^|_)(?:special|landmark)(?:_|$)/.test(chainKey);
      for (const campaignKey of [...campaigns].sort()) {
        rows.push({
          ...CONTEXT,
          race: race.name,
          race_slug: race.slug,
          culture_key: cultureKey,
          subculture_key: faction.subculture,
          faction_name: factionName(factionKey),
          faction_key: factionKey,
          campaign_key: campaignKey,
          building_name: name,
          building_key: level.level_name,
          building_chain_name: chainName,
          building_chain_key: chainKey,
          building_level: num(level.level),
          settlement_tier_requirement: num(level.primary_slot_building_building_level_requirement),
          construction_cost: num(level.create_cost),
          construction_turns: num(level.create_time),
          building_upkeep: num(level.upkeep_cost),
          only_in_capital: bool(level.only_in_capital),
          resource_requirement_key: level.resource_requirement || null,
          required_building_key: requiredBuildingByLevel.get(level.level_name)?.required || null,
          income: metrics.income,
          growth: metrics.growth,
          control: metrics.control,
          trade_resource_key: metrics.trade_resource_key,
          trade_resource_quantity: metrics.trade_resource_quantity,
          recruitment_cost_modifier: metrics.recruitment_cost_modifier,
          upkeep_modifier: metrics.upkeep_modifier,
          is_unique: isUnique,
        });
        if (metrics.income !== null) standardIncomeRows++;
        if (metrics.growth !== null) standardGrowthRows++;
        if (metrics.control !== null) standardControlRows++;
        if (metrics.trade_resource_key !== null) standardResourceRows++;
        if (metrics.has_nonstandard_resource_output) omittedMultiResourceRows++;
      }
    }
  }

  rows.sort((a, b) => a.campaign_key.localeCompare(b.campaign_key)
    || a.building_chain_name.localeCompare(b.building_chain_name)
    || a.building_level - b.building_level
    || a.building_key.localeCompare(b.building_key));
  if (!rows.length) throw new Error(`No constructible building rows resolved for ${factionKey}`);
  const directory = path.join(OUTPUT, "factions", race.slug);
  await mkdir(directory, { recursive: true });
  const relativePath = `factions/${race.slug}/${factionKey}.csv`;
  const contents = csv(rows);
  await writeFile(path.join(OUTPUT, ...relativePath.split("/")), contents, "utf8");
  totalRows += rows.length;
  indexRows.push({
    game: CONTEXT.game,
    patch: CONTEXT.patch,
    steam_build_id: CONTEXT.steam_build_id,
    race: race.name,
    race_slug: race.slug,
    faction_name: factionName(factionKey),
    faction_key: factionKey,
    culture_key: cultureKey,
    subculture_key: faction.subculture,
    building_rows: rows.length,
    unique_building_rows: rows.filter((row) => row.is_unique).length,
    relative_path: relativePath,
    file_sha256: sha256(contents),
    file_bytes: Buffer.byteLength(contents),
  });
}

const INDEX_COLUMNS = [
  "game", "patch", "steam_build_id", "race", "race_slug", "faction_name", "faction_key",
  "culture_key", "subculture_key", "building_rows", "unique_building_rows", "relative_path",
  "file_sha256", "file_bytes",
];
const indexContents = csv(indexRows, INDEX_COLUMNS);
await writeFile(path.join(OUTPUT, `faction_index__wh3__${PATCH}.csv`), indexContents, "utf8");

const schemaRows = COLUMNS.map((column, index) => ({
  column_position: index + 1,
  column_name: column,
  description: COLUMN_DESCRIPTIONS[column] ?? "",
}));
await writeFile(
  path.join(OUTPUT, "schema_inventory__v1.csv"),
  csv(schemaRows, ["column_position", "column_name", "description"]),
  "utf8",
);

const sourceManifest = JSON.parse(await readFile(path.join(SOURCE, "source_manifest.json"), "utf8"));
const manifest = {
  ...CONTEXT,
  generated_at_utc: new Date().toISOString(),
  source_extracted_at_utc: sourceManifest.extracted_at_utc,
  source_decoder: sourceManifest.decoder,
  schema_version: 1,
  playable_factions: indexRows.length,
  building_rows: totalRows,
  standard_metric_rows: {
    income: standardIncomeRows,
    growth: standardGrowthRows,
    control: standardControlRows,
    trade_resource: standardResourceRows,
  },
  deliberately_omitted_from_standard_columns: {
    multi_resource_building_rows: omittedMultiResourceRows,
    conditional_effects: true,
    percentage_income_modifiers: true,
    faction_specific_resource_transactions: true,
  },
  races: Object.fromEntries(RACES.map((race) => [race.slug, indexRows.filter((row) => row.race_slug === race.slug).length])),
  file_layout: "factions/<race>/<faction_key>.csv",
  faction_index: `faction_index__wh3__${PATCH}.csv`,
  schema_inventory: "schema_inventory__v1.csv",
};
await writeFile(path.join(OUTPUT, "dataset_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

const readme = `# Faction economy building dataset\n\nThis dataset is the narrow standardized economy layer for the ${indexRows.length} playable faction keys in the Warhammer III ${CONTEXT.patch} source snapshot. Each faction CSV catalogs its constructible building levels and only the ordinary economic facts that remain semantically comparable across factions.\n\n- Game patch: ${CONTEXT.patch} (Steam build ${CONTEXT.steam_build_id})\n- Playable faction files: ${indexRows.length}\n- Building rows: ${totalRows}\n- Layout: \`factions/<race>/<faction_key>.csv\`\n\n## Deliberately narrow scope\n\nThe CSVs contain applicable enabled culture/faction variants with base construction cost and duration, source level and settlement-tier requirement, simple prerequisites, and a small set of unconditional standardized outputs: fixed income, growth, control, single-resource trade output, and broad recruitment/upkeep modifiers.\n\nThey intentionally do not flatten conditional effects, percentage-income interactions, multi-resource landmarks, pooled-resource transactions, campaign scripts, or bespoke faction mechanics. Those belong in faction Markdown files where their exact numeric rules can be documented without pretending they share a universal column meaning. Blank means not applicable or not safely standardizable; zero means an observed zero.\n\n## Machine-readable companions\n\n- \`faction_index__wh3__${PATCH}.csv\`: one row per playable faction file with counts, paths, hashes, and byte sizes.\n- \`schema_inventory__v1.csv\`: ordered column definitions.\n- \`dataset_manifest.json\`: patch, totals, race coverage, and explicit omissions.\n- \`audit_report.json\` and \`audit_report.md\`: generated by the validator.\n\n## Reproduction\n\nWith \`rpfm_server.exe\` running locally:\n\n\`\`\`powershell\nnode .\\scripts\\extract-economy-source.mjs data\\economy\\source_exports\nnode .\\scripts\\build-economy-dataset.mjs data\\economy\\source_exports work\\generated_economy__final\nnode .\\scripts\\validate-economy-dataset.mjs data\\economy\\source_exports work\\generated_economy__final\n\`\`\`\n`;
await writeFile(path.join(OUTPUT, "README.md"), readme.replaceAll("\n", "\r\n"), "utf8");

console.log(JSON.stringify(manifest, null, 2));
