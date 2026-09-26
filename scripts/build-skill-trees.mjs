import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_skill_trees__wh3__8.1.1");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { CHARACTER_RACE_OVERRIDES, CHARACTER_SUBTYPE_EXCLUSIONS, SKILL_RACES: RACES } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const OUTPUT = path.resolve(ROOT, process.argv[3] ?? "work/generated_skill_trees__wh3__8.1.1");
const DB = path.join(SOURCE, "db");
const LOC = path.join(SOURCE, "text", "db");

const CONTEXT = { ...SNAPSHOT.context };

const CHARACTER_NAME_OVERRIDES = new Map(Object.entries({
  wh_dlc03_bst_khazrak: "Khazrak One-Eye",
  wh_dlc03_bst_malagor: "Malagor the Dark Omen",
  wh_dlc05_bst_morghur: "Morghur the Shadowgave",
  wh2_dlc17_bst_taurox: "Taurox the Brass Bull",
  wh_dlc07_brt_alberic: "Alberic de Bordeleaux",
  wh_dlc07_brt_fay_enchantress: "The Fay Enchantress",
  wh_main_brt_louen_leoncouer: "King Louen Leoncoeur",
  wh2_dlc14_brt_repanse: "Repanse de Lyonesse",
  wh3_dlc23_chd_astragoth: "Astragoth Ironhand",
  wh3_dlc23_chd_drazhoath: "Drazhoath the Ashen",
  wh3_dlc23_chd_zhatan: "Zhatan the Black",
  wh_dlc06_grn_skarsnik: "Skarsnik",
  wh_dlc06_grn_wurrzag_da_great_prophet: "Wurrzag da Great Green Prophet",
  wh_main_grn_azhag_the_slaughterer: "Azhag the Slaughterer",
  wh_main_grn_grimgor_ironhide: "Grimgor Ironhide",
  wh2_dlc15_grn_goblin_great_shaman_raknik: "Raknik Spiderclaw",
  wh2_dlc15_grn_grom_the_paunch: "Grom the Paunch",
  wh2_dlc15_grn_orc_warboss_oglok: "Oglok the 'Orrible",
  wh3_dlc26_grn_gorbad_ironclaw: "Gorbad Ironclaw",
  wh3_dlc26_grn_night_goblin_big_boss: "Night Goblin Big Boss",
  wh3_dlc26_grn_savage_orc_great_shaman: "Savage Orc Great Shaman",
  wh3_dlc26_grn_snagla_grobpsit: "Snagla Grobspit",
  wh2_dlc10_hef_alarielle: "Alarielle the Radiant",
  wh2_dlc10_hef_alith_anar: "Alith Anar",
  wh2_dlc15_hef_eltharion: "Eltharion the Grim",
  wh2_dlc15_hef_imrik: "Imrik",
  wh2_main_hef_teclis: "Teclis",
  wh2_main_hef_tyrion: "Tyrion",
  wh3_dlc27_hef_aislinn: "Sea Lord Aislinn",
  wh2_main_hef_prince_alastar: "Alastar the White Lion",
  wh2_dlc09_skv_tretch_craventail: "Tretch Craventail",
  wh2_dlc12_skv_ikit_claw: "Ikit Claw",
  wh2_dlc14_skv_deathmaster_snikch: "Deathmaster Snikch",
  wh2_dlc16_skv_throt_the_unclean: "Throt the Unclean",
  wh2_main_skv_lord_skrolk: "Lord Skrolk",
  wh2_main_skv_queek_headtaker: "Queek Headtaker",
  wh3_dlc27_sla_dechala: "Dechala the Denied One",
  wh3_dlc27_sla_masque_of_slaanesh: "The Masque of Slaanesh",
  wh3_main_sla_nkari: "N'Kari",
  wh2_dlc11_cst_aranessa: "Aranessa Saltspite",
  wh2_dlc11_cst_cylostra: "Cylostra Direfin",
  wh2_dlc11_cst_harkon: "Luthor Harkon",
  wh2_dlc11_cst_noctilus: "Count Noctilus",
  wh3_dlc27_sla_styrkaar_the_sortsvinaer: "Styrkaar the Sortsvinaer",
  wh2_dlc10_def_crone_hellebron: "Crone Hellebron",
  wh2_dlc11_def_lokhir: "Lokhir Fellheart",
  wh2_twa03_def_rakarth: "Rakarth",
  wh_dlc06_dwf_belegar: "Belegar Ironhammer",
  wh2_dlc17_dwf_thorek: "Thorek Ironbrow",
  wh_pro01_dwf_grombrindal: "Grombrindal",
  wh2_dlc13_emp_cha_markus_wulfhart: "Markus Wulfhart",
  wh3_dlc25_emp_elspeth_von_draken: "Elspeth von Draken",
  wh_dlc04_emp_volkmar: "Volkmar the Grim",
  wh3_cp1_cth_bhashiva: "Bhashiva",
  wh3_cp1_cth_cha_taoyan: "Taoyan",
  wh3_cp1_cth_clawspeaker_beasts: "Clawspeaker (Beasts)",
  wh3_cp1_cth_clawspeaker_life: "Clawspeaker (Life)",
  wh3_cp1_cth_clawspeaker_shadows: "Clawspeaker (Shadows)",
  wh3_cp1_cth_sawai: "Sawai",
  wh3_dlc26_kho_arbaal_the_undefeated: "Arbaal the Undefeated",
  wh3_pro12_kho_cha_karanak: "Karanak",
  wh3_main_ksl_boris: "Boris Ursus",
  wh3_main_ksl_katarin: "Tzarina Katarin",
  wh2_dlc09_tmb_arkhan: "Arkhan the Black",
  wh2_dlc09_tmb_khalida: "High Queen Khalida",
  wh2_dlc09_tmb_khatep: "Grand Hierophant Khatep",
  wh2_dlc09_tmb_settra: "Settra the Imperishable",
  wh3_main_tze_kairos: "Kairos Fateweaver",
  wh3_main_nur_kugath: "Ku'gath Plaguefather",
  wh3_main_ogr_skrag_the_slaughterer: "Skrag the Slaughterer",
  wh_pro02_vmp_isabella_von_carstein: "Isabella von Carstein",
  wh_pro02_vmp_isabella_von_carstein_hero: "Isabella von Carstein (Hero)",
  wh_dlc04_vmp_vlad_con_carstein: "Vlad von Carstein",
  wh_main_vmp_mannfred_von_carstein: "Mannfred von Carstein",
  wh_main_chs_archaon: "Archaon the Everchosen",
  wh3_main_dae_belakor: "Be'lakor",
  wh3_dlc20_nur_festus: "Festus the Leechlord",
  wh3_dlc20_kho_valkia: "Valkia the Bloody",
  wh3_dlc20_tze_vilitch: "Vilitch the Curseling",
  wh3_pro11_chs_cha_harald_hammerstorm: "Harald Hammerstorm",
  wh2_dlc16_wef_sisters_of_twilight: "Sisters of Twilight",
}));

const COLUMNS = [
  "record_type",
  "game", "patch", "steam_build_id",
  "race", "race_slug", "subculture_key",
  "character_name", "character_slug", "character_class",
  "agent_subtype_key", "primary_agent_type", "permitted_agent_types", "permitted_faction_keys",
  "is_legendary_lord", "is_unique_agent", "is_recruitable", "show_in_ui", "auto_generate",
  "is_caster", "magic_lore", "recruitment_category",
  "node_set_key", "node_set_name", "node_set_index", "node_set_agent_key",
  "node_set_for_army", "node_set_for_navy", "node_set_faction_key", "node_set_campaign_key", "node_set_subculture_key",
  "node_key", "skill_key", "skill_name", "skill_description", "skill_icon_path",
  "node_tier", "node_indent", "points_on_creation", "required_num_parents", "visible_in_ui",
  "skill_unlocked_at_rank", "skill_max_level",
  "skill_level", "level_name", "level_description", "level_unlocked_at_rank", "level_image_path",
  "level_campaign_key", "level_faction_key", "level_subculture_key",
  "effect_key", "effect_description", "effect_additional_tooltip", "effect_scope", "effect_value",
  "effect_category", "effect_priority", "effect_is_positive_value_good", "effect_icon", "effect_icon_negative",
  "parent_node_key", "parent_skill_key", "parent_skill_name",
  "child_node_key", "child_skill_key", "child_skill_name",
  "link_type", "initial_descent_tiers", "parent_link_position", "child_link_position",
  "parent_link_position_offset", "child_link_position_offset",
  "locked_skill_key", "locked_skill_name", "locked_skill_level",
  "ancillary_key", "ancillary_name", "ancillary_type", "ancillary_category",
  "dilemma_key", "dilemma_title", "dilemma_random_selection",
  "source_table", "source_key",
];

const COLUMN_DESCRIPTIONS = {
  record_type: "Row discriminator: character, node_set, node, skill_level, effect, prerequisite, skill_lock, ancillary_lock, ancillary_grant, or dilemma_grant.",
  character_class: "legendary_lord, lord, or hero.",
  agent_subtype_key: "Stable game database key identifying the character subtype and this file.",
  permitted_agent_types: "Pipe-delimited source agent roles permitted for this subtype.",
  permitted_faction_keys: "Pipe-delimited relevant faction keys that permit this subtype.",
  node_set_key: "Applicable character_skill_node_sets key; one subtype file may contain several conditional sets.",
  node_set_index: "Deterministic one-based index of the node-set variant inside this character file.",
  node_key: "Stable character_skill_nodes key.",
  skill_key: "Stable character_skills key granted by the node.",
  node_tier: "Horizontal skill-tree tier/column from the source table.",
  node_indent: "Vertical indentation/row from the source table.",
  required_num_parents: "Number of linked parent nodes required before this node can unlock.",
  skill_max_level: "Highest level found across level-detail, effect, lock, and grant records for this skill.",
  skill_level: "One-based skill rank for level-dependent rows.",
  effect_scope: "Game effect scope such as character_to_character_own or faction_to_faction_own.",
  effect_value: "Signed source value applied at this skill level and scope.",
  parent_node_key: "Parent/prerequisite node for prerequisite rows.",
  child_node_key: "Child/unlocked node for prerequisite rows.",
  locked_skill_key: "Skill disabled or mutually excluded by the current node.",
  ancillary_key: "Ancillary locked or granted by this node/skill depending on record_type.",
  dilemma_key: "Dilemma granted by this skill level.",
  source_table: "Authoritative source table for this record.",
  source_key: "Stable source-row identifier or composite key.",
};

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

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
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

function csvText(columns, rows) {
  return [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\r\n") + "\r\n";
}

async function writeCsv(file, columns, rows) {
  await mkdir(path.dirname(file), { recursive: true });
  const text = csvText(columns, rows);
  await writeFile(file, text, "utf8");
  return text;
}

function stripSubtypePrefix(key) {
  return key.replace(/^wh\d?_(?:(?:dlc|pro|twa|cp)\d+|main)_[a-z]+_/, "");
}

function titleCaseKey(key) {
  const replacements = new Map([
    ["fem", "Female"], ["msla", "Slaanesh"], ["chs", "Chaos"], ["skv", "Skaven"],
    ["hef", "High Elf"], ["brt", "Bretonnian"], ["cst", "Vampire Coast"], ["chd", "Chaos Dwarf"],
  ]);
  return stripSubtypePrefix(key)
    .split("_")
    .filter(Boolean)
    .map((token) => replacements.get(token) ?? (/^\d+$/.test(token) ? token : token[0].toUpperCase() + token.slice(1)))
    .join(" ");
}

function safeSlug(name) {
  return name
    .normalize("NFKD")
    .replace(/[’']/g, "_")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "Unnamed";
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

const TABLE_NAMES = [
  "factions_tables", "agent_subtypes_tables", "unique_agents_tables", "frontend_faction_leaders_tables",
  "campaign_to_agent_subtypes_tables", "faction_agent_permitted_subtypes_tables",
  "character_skill_node_sets_tables", "character_skill_node_set_items_tables", "character_skill_nodes_tables",
  "character_skill_node_links_tables", "character_skill_nodes_skill_locks_tables", "character_skill_node_ancillary_locks_tables",
  "character_skills_tables", "character_skill_level_details_tables", "character_skill_level_to_effects_junctions_tables",
  "character_skill_level_to_ancillaries_junctions_tables", "character_skill_level_to_dilemmas_junctions_tables",
  "effects_tables", "ancillaries_tables", "dilemmas_tables",
];
const tables = Object.fromEntries(await Promise.all(TABLE_NAMES.map(async (name) => [name, await loadTable(name)])));

const locFiles = [
  "agent_subtypes__", "character_skills__", "character_skill_level_details__", "character_skill_node_sets__",
  "effects__", "effects_additional_tooltip_details__", "ancillaries__", "dilemmas__", "factions__", "frontend_factions__",
];
const locRows = (await Promise.all(locFiles.map(loadLoc))).flat();
const loc = new Map(locRows.map((row) => [row.key, row.text]));
const locText = (key) => loc.get(key) ?? "";

const raceBySubculture = new Map(RACES.map((race) => [race.subculture_key, race]));
const factionByKey = indexBy(tables.factions_tables, "key");
const relevantFactionKeys = new Set(
  tables.factions_tables.filter((row) => raceBySubculture.has(row.subculture)).map((row) => row.key),
);
const setsBySubtype = groupBy(tables.character_skill_node_sets_tables.filter((row) => row.agent_subtype_key), "agent_subtype_key");
const itemsBySet = groupBy(tables.character_skill_node_set_items_tables.filter((row) => row.mod_disabled !== "true"), "set");
const nodeByKey = indexBy(tables.character_skill_nodes_tables, "key");
const skillByKey = indexBy(tables.character_skills_tables, "key");
const levelsBySkill = groupBy(tables.character_skill_level_details_tables, "skill_key");
const effectsBySkill = groupBy(tables.character_skill_level_to_effects_junctions_tables, "character_skill_key");
const ancillaryGrantsBySkill = groupBy(tables.character_skill_level_to_ancillaries_junctions_tables, "skill");
const dilemmaGrantsBySkill = groupBy(tables.character_skill_level_to_dilemmas_junctions_tables, "character_skill_key");
const skillLocksByNode = groupBy(tables.character_skill_nodes_skill_locks_tables, "character_skill_node");
const ancillaryLocksByNode = groupBy(tables.character_skill_node_ancillary_locks_tables, "character_skill_node");
const effectByKey = indexBy(tables.effects_tables, "effect");
const ancillaryByKey = indexBy(tables.ancillaries_tables, "key");
const dilemmaByKey = indexBy(tables.dilemmas_tables, "key");
const agentSubtypeByKey = indexBy(tables.agent_subtypes_tables, "key");
const uniqueAgentKeys = new Set(tables.unique_agents_tables.map((row) => row.agent_subtype));

const permissionsBySubtype = new Map();
const candidateRacesBySubtype = new Map();
const addCandidateRace = (subtype, race) => {
  if (!candidateRacesBySubtype.has(subtype)) candidateRacesBySubtype.set(subtype, new Map());
  candidateRacesBySubtype.get(subtype).set(race.slug, race);
};
for (const row of tables.faction_agent_permitted_subtypes_tables) {
  if (row.mod_disabled === "true" || CHARACTER_SUBTYPE_EXCLUSIONS.has(row.subtype) || !relevantFactionKeys.has(row.faction) || !setsBySubtype.has(row.subtype)) continue;
  if (!permissionsBySubtype.has(row.subtype)) permissionsBySubtype.set(row.subtype, []);
  permissionsBySubtype.get(row.subtype).push(row);
  const race = raceBySubculture.get(factionByKey.get(row.faction)?.subculture);
  if (race) addCandidateRace(row.subtype, race);
}

const legendarySubtypes = new Set();
for (const row of tables.frontend_faction_leaders_tables) {
  const faction = factionByKey.get(row.faction);
  const race = faction ? raceBySubculture.get(faction.subculture) : null;
  if (race && !CHARACTER_SUBTYPE_EXCLUSIONS.has(row.agent_subtype_record) && setsBySubtype.has(row.agent_subtype_record)) {
    legendarySubtypes.add(row.agent_subtype_record);
    addCandidateRace(row.agent_subtype_record, race);
  }
}

const raceBySlug = new Map(RACES.map((race) => [race.slug, race]));
const subtypeRace = new Map();
for (const [subtype, racesBySlug] of candidateRacesBySubtype) {
  const races = [...racesBySlug.values()];
  if (races.length === 1) subtypeRace.set(subtype, races[0]);
  else {
    const ownerSlug = CHARACTER_RACE_OVERRIDES.get(subtype);
    const owner = ownerSlug ? raceBySlug.get(ownerSlug) : null;
    if (!owner || !racesBySlug.has(owner.slug)) {
      throw new Error(`${subtype}: shared by ${races.map((race) => race.slug).join(", ")} but has no valid canonical owner.`);
    }
    subtypeRace.set(subtype, owner);
  }
}

function characterName(subtype, isLegendary, isUnique) {
  if (CHARACTER_NAME_OVERRIDES.has(subtype)) return CHARACTER_NAME_OVERRIDES.get(subtype);
  const localised = locText(`agent_subtypes_onscreen_name_override_${subtype}`);
  const genericLabel = /^(Legendary Lord|Legendary Hero|Lord|Hero)$/i.test(localised.trim());
  const unresolvedReference = /^\{\{tr:/.test(localised.trim());
  return !localised || genericLabel || unresolvedReference ? titleCaseKey(subtype) : localised;
}

function skillName(skillKey, level = null) {
  if (level !== null) {
    const atLevel = locText(`character_skill_level_details_localised_name_${level}${skillKey}`);
    if (atLevel) return atLevel;
  }
  return locText(`character_skills_localised_name_${skillKey}`) || skillByKey.get(skillKey)?.localised_name || "";
}

function skillDescription(skillKey, level = null) {
  if (level !== null) {
    const atLevel = locText(`character_skill_level_details_localised_description_${level}${skillKey}`);
    if (atLevel) return atLevel;
  }
  return locText(`character_skills_localised_description_${skillKey}`) || skillByKey.get(skillKey)?.localised_description || "";
}

function maxSkillLevel(skillKey) {
  const values = [
    ...(levelsBySkill.get(skillKey) ?? []).map((row) => num(row.level)),
    ...(effectsBySkill.get(skillKey) ?? []).map((row) => num(row.level)),
    ...(ancillaryGrantsBySkill.get(skillKey) ?? []).map((row) => num(row.level)),
    ...(dilemmaGrantsBySkill.get(skillKey) ?? []).map((row) => num(row.level)),
  ].filter((value) => value !== null);
  return values.length ? Math.max(...values) : 1;
}

function primaryAgentType(agentTypes) {
  if (agentTypes.includes("general")) return "general";
  const preferred = ["wizard", "champion", "spy", "engineer", "dignitary", "runesmith"];
  return preferred.find((value) => agentTypes.includes(value)) ?? agentTypes[0] ?? "general";
}

const manifestRows = [];
const usedPaths = new Set();
const orderedSubtypes = [...subtypeRace.keys()].sort((a, b) => {
  const raceOrder = RACES.findIndex((race) => race.slug === subtypeRace.get(a).slug) - RACES.findIndex((race) => race.slug === subtypeRace.get(b).slug);
  return raceOrder || a.localeCompare(b);
});

for (const subtype of orderedSubtypes) {
  const race = subtypeRace.get(subtype);
  const subtypeInfo = agentSubtypeByKey.get(subtype) ?? {};
  const permissionRows = permissionsBySubtype.get(subtype) ?? [];
  const agentTypes = unique(permissionRows.map((row) => row.agent));
  const permittedFactions = unique(permissionRows.map((row) => row.faction));
  const isLegendary = legendarySubtypes.has(subtype);
  const isUnique = uniqueAgentKeys.has(subtype);
  const primaryType = primaryAgentType(agentTypes);
  const charClass = isLegendary ? "legendary_lord" : primaryType === "general" ? "lord" : "hero";
  const name = characterName(subtype, isLegendary, isUnique);
  let slug = safeSlug(name);
  let relativePath = path.join("characters", race.slug, `${slug}.csv`);
  if (usedPaths.has(relativePath.toLowerCase())) {
    slug = `${slug}__${safeSlug(stripSubtypePrefix(subtype))}`;
    relativePath = path.join("characters", race.slug, `${slug}.csv`);
  }
  usedPaths.add(relativePath.toLowerCase());

  const common = {
    game: CONTEXT.game,
    patch: CONTEXT.patch,
    steam_build_id: CONTEXT.steam_build_id,
    race: race.name,
    race_slug: race.slug,
    subculture_key: race.subculture_key,
    character_name: name,
    character_slug: slug,
    character_class: charClass,
    agent_subtype_key: subtype,
    primary_agent_type: primaryType,
    permitted_agent_types: agentTypes.join("|"),
    permitted_faction_keys: permittedFactions.join("|"),
    is_legendary_lord: isLegendary,
    is_unique_agent: isUnique,
    is_recruitable: bool(subtypeInfo.recruitable),
    show_in_ui: bool(subtypeInfo.show_in_ui),
    auto_generate: bool(subtypeInfo.auto_generate),
    is_caster: bool(subtypeInfo.is_caster),
    magic_lore: subtypeInfo.magic_lore ?? "",
    recruitment_category: subtypeInfo.recruitment_category ?? "",
  };
  const rows = [{ ...common, record_type: "character", source_table: "agent_subtypes_tables", source_key: subtype }];
  const subtypeSets = [...(setsBySubtype.get(subtype) ?? [])].sort((a, b) => a.key.localeCompare(b.key));
  const skillKeys = new Set();

  for (let setOffset = 0; setOffset < subtypeSets.length; setOffset++) {
    const set = subtypeSets[setOffset];
    const setContext = {
      node_set_key: set.key,
      node_set_name: locText(`character_skill_node_sets_onscreen_name_${set.key}`),
      node_set_index: setOffset + 1,
      node_set_agent_key: set.agent_key,
      node_set_for_army: bool(set.for_army),
      node_set_for_navy: bool(set.for_navy),
      node_set_faction_key: set.faction_key,
      node_set_campaign_key: set.campaign_key,
      node_set_subculture_key: set.subculture,
    };
    rows.push({ ...common, ...setContext, record_type: "node_set", source_table: "character_skill_node_sets_tables", source_key: set.key });

    const memberNodes = (itemsBySet.get(set.key) ?? [])
      .map((item) => nodeByKey.get(item.item))
      .filter(Boolean)
      .sort((a, b) => (num(a.tier) ?? 0) - (num(b.tier) ?? 0) || (num(a.indent) ?? 0) - (num(b.indent) ?? 0) || a.key.localeCompare(b.key));
    const memberKeys = new Set(memberNodes.map((node) => node.key));

    for (const node of memberNodes) {
      const skill = skillByKey.get(node.character_skill_key) ?? {};
      const maxLevel = maxSkillLevel(node.character_skill_key);
      skillKeys.add(node.character_skill_key);
      const nodeContext = {
        node_key: node.key,
        skill_key: node.character_skill_key,
        skill_name: skillName(node.character_skill_key),
        skill_description: skillDescription(node.character_skill_key),
        skill_icon_path: skill.image_path ?? "",
        node_tier: num(node.tier),
        node_indent: num(node.indent),
        points_on_creation: num(node.points_on_creation),
        required_num_parents: num(node.required_num_parents),
        visible_in_ui: bool(node.visible_in_ui),
        skill_unlocked_at_rank: num(skill.unlocked_at_rank),
        skill_max_level: maxLevel,
      };
      rows.push({ ...common, ...setContext, ...nodeContext, record_type: "node", source_table: "character_skill_nodes_tables", source_key: node.key });

      const levelRows = [...(levelsBySkill.get(node.character_skill_key) ?? [])].sort((a, b) => (num(a.level) ?? 0) - (num(b.level) ?? 0) || stable(a).localeCompare(stable(b)));
      for (const level of levelRows) {
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "skill_level",
          skill_level: num(level.level),
          level_name: skillName(node.character_skill_key, level.level),
          level_description: skillDescription(node.character_skill_key, level.level),
          level_unlocked_at_rank: num(level.unlocked_at_rank),
          level_image_path: level.image_path,
          level_campaign_key: level.campaign_key,
          level_faction_key: level.faction_key,
          level_subculture_key: level.subculture_key,
          source_table: "character_skill_level_details_tables",
          source_key: `${node.character_skill_key}|${level.level}|${level.campaign_key}|${level.faction_key}|${level.subculture_key}`,
        });
      }

      const effectRows = [...(effectsBySkill.get(node.character_skill_key) ?? [])].sort((a, b) => (num(a.level) ?? 0) - (num(b.level) ?? 0) || a.effect_key.localeCompare(b.effect_key) || a.effect_scope.localeCompare(b.effect_scope));
      for (const junction of effectRows) {
        const effect = effectByKey.get(junction.effect_key) ?? {};
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "effect",
          skill_level: num(junction.level),
          level_name: skillName(node.character_skill_key, junction.level),
          level_description: skillDescription(node.character_skill_key, junction.level),
          effect_key: junction.effect_key,
          effect_description: locText(`effects_description_${junction.effect_key}`),
          effect_additional_tooltip: locText(`effects_additional_tooltip_details_localised_description_${junction.effect_key}`),
          effect_scope: junction.effect_scope,
          effect_value: num(junction.value),
          effect_category: effect.category ?? "",
          effect_priority: num(effect.priority),
          effect_is_positive_value_good: bool(effect.is_positive_value_good),
          effect_icon: effect.icon ?? "",
          effect_icon_negative: effect.icon_negative ?? "",
          source_table: "character_skill_level_to_effects_junctions_tables",
          source_key: `${node.character_skill_key}|${junction.effect_key}|${junction.level}|${junction.effect_scope}`,
        });
      }

      for (const lock of skillLocksByNode.get(node.key) ?? []) {
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "skill_lock",
          locked_skill_key: lock.character_skill,
          locked_skill_name: skillName(lock.character_skill),
          locked_skill_level: num(lock.level),
          source_table: "character_skill_nodes_skill_locks_tables",
          source_key: `${node.key}|${lock.character_skill}|${lock.level}`,
        });
      }

      for (const lock of ancillaryLocksByNode.get(node.key) ?? []) {
        const ancillary = ancillaryByKey.get(lock.ancillary_lock) ?? {};
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "ancillary_lock",
          ancillary_key: lock.ancillary_lock,
          ancillary_name: locText(`ancillaries_onscreen_name_${lock.ancillary_lock}`),
          ancillary_type: ancillary.type ?? "",
          ancillary_category: ancillary.category ?? "",
          source_table: "character_skill_node_ancillary_locks_tables",
          source_key: `${node.key}|${lock.ancillary_lock}`,
        });
      }

      for (const grant of ancillaryGrantsBySkill.get(node.character_skill_key) ?? []) {
        const ancillary = ancillaryByKey.get(grant.granted_ancillary) ?? {};
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "ancillary_grant",
          skill_level: num(grant.level),
          ancillary_key: grant.granted_ancillary,
          ancillary_name: locText(`ancillaries_onscreen_name_${grant.granted_ancillary}`),
          ancillary_type: ancillary.type ?? "",
          ancillary_category: ancillary.category ?? "",
          source_table: "character_skill_level_to_ancillaries_junctions_tables",
          source_key: `${node.character_skill_key}|${grant.granted_ancillary}|${grant.level}`,
        });
      }

      for (const grant of dilemmaGrantsBySkill.get(node.character_skill_key) ?? []) {
        const dilemma = dilemmaByKey.get(grant.dilemma_key) ?? {};
        rows.push({
          ...common, ...setContext, ...nodeContext,
          record_type: "dilemma_grant",
          skill_level: num(grant.level),
          dilemma_key: grant.dilemma_key,
          dilemma_title: locText(`dilemmas_localised_title_${grant.dilemma_key}`) || dilemma.localised_title || "",
          dilemma_random_selection: bool(grant.random_selection),
          source_table: "character_skill_level_to_dilemmas_junctions_tables",
          source_key: `${node.character_skill_key}|${grant.dilemma_key}|${grant.level}`,
        });
      }
    }

    const applicableLinks = tables.character_skill_node_links_tables
      .filter((link) => memberKeys.has(link.child_key) && memberKeys.has(link.parent_key))
      .sort((a, b) => a.child_key.localeCompare(b.child_key) || a.parent_key.localeCompare(b.parent_key));
    for (const link of applicableLinks) {
      const parent = nodeByKey.get(link.parent_key) ?? {};
      const child = nodeByKey.get(link.child_key) ?? {};
      rows.push({
        ...common, ...setContext,
        record_type: "prerequisite",
        node_key: link.child_key,
        skill_key: child.character_skill_key ?? "",
        skill_name: skillName(child.character_skill_key ?? ""),
        parent_node_key: link.parent_key,
        parent_skill_key: parent.character_skill_key ?? "",
        parent_skill_name: skillName(parent.character_skill_key ?? ""),
        child_node_key: link.child_key,
        child_skill_key: child.character_skill_key ?? "",
        child_skill_name: skillName(child.character_skill_key ?? ""),
        link_type: link.link_type,
        initial_descent_tiers: num(link.initial_descent_tiers),
        parent_link_position: link.parent_link_position,
        child_link_position: link.child_link_position,
        parent_link_position_offset: num(link.parent_link_position_offset),
        child_link_position_offset: num(link.child_link_position_offset),
        source_table: "character_skill_node_links_tables",
        source_key: `${link.parent_key}|${link.child_key}|${link.link_type}`,
      });
    }
  }

  const file = path.join(OUTPUT, relativePath);
  const text = await writeCsv(file, COLUMNS, rows);
  const counts = Object.fromEntries([...new Set(rows.map((row) => row.record_type))].sort().map((type) => [type, rows.filter((row) => row.record_type === type).length]));
  const structuralRows = rows
    .filter((row) => !["character", "node_set"].includes(row.record_type))
    .map((row) => Object.fromEntries(COLUMNS
      .filter((column) => ![
        "game", "patch", "steam_build_id", "race", "race_slug", "subculture_key", "character_name", "character_slug",
        "character_class", "agent_subtype_key", "primary_agent_type", "permitted_agent_types", "permitted_faction_keys",
        "is_legendary_lord", "is_unique_agent", "is_recruitable", "show_in_ui", "auto_generate", "is_caster", "magic_lore",
        "recruitment_category", "node_set_key", "node_set_name", "node_set_index", "node_set_agent_key", "node_set_for_army",
        "node_set_for_navy", "node_set_faction_key", "node_set_campaign_key", "node_set_subculture_key", "source_table", "source_key",
      ].includes(column)).map((column) => [column, out(row[column])])));
  manifestRows.push({
    game: CONTEXT.game,
    patch: CONTEXT.patch,
    steam_build_id: CONTEXT.steam_build_id,
    race: race.name,
    race_slug: race.slug,
    character_name: name,
    character_slug: slug,
    character_class: charClass,
    agent_subtype_key: subtype,
    is_legendary_lord: isLegendary,
    is_unique_agent: isUnique,
    relative_path: relativePath.replaceAll(path.sep, "/"),
    node_set_count: subtypeSets.length,
    node_count: counts.node ?? 0,
    skill_count: skillKeys.size,
    skill_level_row_count: counts.skill_level ?? 0,
    effect_row_count: counts.effect ?? 0,
    prerequisite_row_count: counts.prerequisite ?? 0,
    skill_lock_row_count: counts.skill_lock ?? 0,
    ancillary_lock_row_count: counts.ancillary_lock ?? 0,
    ancillary_grant_row_count: counts.ancillary_grant ?? 0,
    dilemma_grant_row_count: counts.dilemma_grant ?? 0,
    total_row_count: rows.length,
    tree_structure_sha256: sha256(stable(structuralRows)),
    file_sha256: sha256(text),
    file_bytes: Buffer.byteLength(text, "utf8"),
  });
}

const manifestColumns = [
  "game", "patch", "steam_build_id", "race", "race_slug", "character_name", "character_slug", "character_class",
  "agent_subtype_key", "is_legendary_lord", "is_unique_agent", "relative_path", "node_set_count", "node_count", "skill_count",
  "skill_level_row_count", "effect_row_count", "prerequisite_row_count", "skill_lock_row_count", "ancillary_lock_row_count",
  "ancillary_grant_row_count", "dilemma_grant_row_count", "total_row_count", "tree_structure_sha256", "file_sha256", "file_bytes",
];
await writeCsv(path.join(OUTPUT, `character_index__wh3__${PATCH}.csv`), manifestColumns, manifestRows);

const schemaRows = COLUMNS.map((column, index) => ({
  dataset: "characters/<race>/<character>.csv",
  column_position: index + 1,
  column_name: column,
  data_type: [
    "is_legendary_lord", "is_unique_agent", "is_recruitable", "show_in_ui", "auto_generate", "is_caster",
    "node_set_for_army", "node_set_for_navy", "visible_in_ui", "effect_is_positive_value_good", "dilemma_random_selection",
  ].includes(column) ? "boolean" : [
    "node_set_index", "node_tier", "node_indent", "points_on_creation", "required_num_parents", "skill_unlocked_at_rank",
    "skill_max_level", "skill_level", "level_unlocked_at_rank", "effect_value", "effect_priority", "initial_descent_tiers",
    "parent_link_position_offset", "child_link_position_offset", "locked_skill_level",
  ].includes(column) ? "number" : "text",
  required: ["record_type", "game", "patch", "steam_build_id", "race", "race_slug", "subculture_key", "character_name", "character_slug", "character_class", "agent_subtype_key", "source_table", "source_key"].includes(column),
  description: COLUMN_DESCRIPTIONS[column] ?? column.replaceAll("_", " "),
}));
await writeCsv(path.join(OUTPUT, "schema_inventory__v1.csv"), ["dataset", "column_position", "column_name", "data_type", "required", "description"], schemaRows);

const sourceManifest = JSON.parse(await readFile(path.join(SOURCE, "source_manifest.json"), "utf8"));
const datasetManifest = {
  game: CONTEXT.game,
  patch: CONTEXT.patch,
  steam_build_id: CONTEXT.steam_build_id,
  generated_at_utc: new Date().toISOString(),
  source_extracted_at_utc: sourceManifest.extracted_at_utc,
  source_decoder: sourceManifest.decoder,
  character_files: manifestRows.length,
  node_sets: manifestRows.reduce((sum, row) => sum + row.node_set_count, 0),
  nodes: manifestRows.reduce((sum, row) => sum + row.node_count, 0),
  effects: manifestRows.reduce((sum, row) => sum + row.effect_row_count, 0),
  races: Object.fromEntries(RACES.map((race) => [race.slug, manifestRows.filter((row) => row.race_slug === race.slug).length])),
  record_types: ["character", "node_set", "node", "skill_level", "effect", "prerequisite", "skill_lock", "ancillary_lock", "ancillary_grant", "dilemma_grant"],
  file_layout: "characters/<race>/<character>.csv",
  character_index: `character_index__wh3__${PATCH}.csv`,
  schema_inventory: "schema_inventory__v1.csv",
};
await writeFile(path.join(OUTPUT, "dataset_manifest.json"), `${JSON.stringify(datasetManifest, null, 2)}\n`, "utf8");

const readme = `# Character skill-tree dataset\n\n` +
  `This dataset contains one self-contained CSV for each lord, hero, named unique character, and legendary lord subtype in the ${RACES.length} in-scope Warhammer III races.\n\n` +
  `- Game patch: ${CONTEXT.patch} (Steam build ${CONTEXT.steam_build_id})\n` +
  `- Character files: ${manifestRows.length}\n` +
  `- Underlying conditional node sets: ${datasetManifest.node_sets}\n` +
  `- Layout: \`characters/<race>/<character>.csv\`\n\n` +
  `## Row model\n\n` +
  `Every character CSV uses one common long-form schema. The \`record_type\` column identifies character metadata, node-set variants, nodes, skill levels, effects, prerequisite links, skill locks, ancillary locks or grants, and dilemma grants. Character and applicability fields are repeated so every row can be filtered or analyzed independently.\n\n` +
  `A character subtype may have multiple node sets for faction- or campaign-specific variants. They stay together in the same character file and are distinguished by \`node_set_key\` and \`node_set_index\`.\n\n` +
  `## Machine-readable companions\n\n` +
  `- \`character_index__wh3__${PATCH}.csv\`: one row per character file with counts, paths, and hashes.\n` +
  `- \`schema_inventory__v1.csv\`: ordered column definitions and data types.\n` +
  `- \`dataset_manifest.json\`: patch, totals, race coverage, and record types.\n` +
  `- \`audit_report.json\` and \`audit_report.md\`: generated by the validator.\n\n` +
  `## Build experiments\n\n` +
  `Filter \`record_type=effect\` to score skill effects by level, scope, and value. Use \`prerequisite\` rows to enforce path dependencies; \`skill_lock\` rows for mutually exclusive choices; and the node tier, indent, rank, and maximum-level fields to model legal point allocation.\n`;
await writeFile(path.join(OUTPUT, "README.md"), PATCH === "9.0" ? await readFile(new URL("./skill-trees-readme-9.0.md", import.meta.url), "utf8") : readme, "utf8");

console.log(JSON.stringify(datasetManifest, null, 2));
