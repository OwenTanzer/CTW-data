import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { matchesTextFingerprint } from "./validation-text.mjs";
import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

if (!process.execArgv.some((argument) => argument.startsWith("--max-old-space-size="))) {
  const child = spawnSync(process.execPath, ["--max-old-space-size=8192", fileURLToPath(import.meta.url), ...process.argv.slice(2)], { stdio: "inherit" });
  if (child.error) throw child.error;
  process.exit(child.status ?? 1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_skill_trees__wh3__8.1.1");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { CHARACTER_RACE_OVERRIDES, CHARACTER_SUBTYPE_EXCLUSIONS, SKILL_RACES: RACES } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const DATASET = path.resolve(ROOT, process.argv[3] ?? "work/generated_skill_trees__wh3__8.1.1");
const DB = path.join(SOURCE, "db");

const errors = [];
const warnings = [];
const passes = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);
const pass = (message) => passes.push(message);

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

function parseRecords(text, delimiter, skipMeta = false) {
  const data = parseDelimited(text.replace(/^\uFEFF/, ""), delimiter);
  const columns = data.shift() ?? [];
  const included = data.filter((row) => row.some((value) => value !== "") && (!skipMeta || !String(row[0] ?? "").startsWith("#")));
  return {
    columns,
    rows: included.map((row) => Object.fromEntries(columns.map((column, index) => [column, row[index] ?? ""]))),
    inconsistentWidths: included.filter((row) => row.length !== columns.length).length,
  };
}

async function csv(file) {
  const buffer = await readFile(file);
  let text;
  try { text = new TextDecoder("utf-8", { fatal: true }).decode(buffer); }
  catch { fail(`${file}: not valid UTF-8.`); text = buffer.toString("utf8"); }
  if (/\r(?!\n)/.test(text)) fail(`${file}: contains bare CR line endings.`);
  const parsed = parseRecords(text, ",");
  if (parsed.inconsistentWidths) fail(`${file}: ${parsed.inconsistentWidths} rows have the wrong field count.`);
  return { ...parsed, text, buffer };
}

async function tsv(name) {
  return parseRecords(await readFile(path.join(DB, name, "data__.tsv"), "utf8"), "\t", true).rows;
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

async function walk(directory) {
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...(await walk(full)));
    else if (entry.isFile()) results.push(full);
  }
  return results;
}

const TABLE_NAMES = [
  "factions_tables", "agent_subtypes_tables", "unique_agents_tables", "frontend_faction_leaders_tables",
  "faction_agent_permitted_subtypes_tables", "character_skill_node_sets_tables", "character_skill_node_set_items_tables",
  "character_skill_nodes_tables", "character_skill_node_links_tables", "character_skill_nodes_skill_locks_tables",
  "character_skill_node_ancillary_locks_tables", "character_skills_tables", "character_skill_level_details_tables",
  "character_skill_level_to_effects_junctions_tables", "character_skill_level_to_ancillaries_junctions_tables",
  "character_skill_level_to_dilemmas_junctions_tables", "effects_tables", "ancillaries_tables", "dilemmas_tables",
];
const tables = Object.fromEntries(await Promise.all(TABLE_NAMES.map(async (name) => [name, await tsv(name)])));

const factionByKey = indexBy(tables.factions_tables, "key");
const raceBySubculture = new Map(RACES.map((race) => [race.subculture_key, race]));
const raceBySlug = new Map(RACES.map((race) => [race.slug, race]));
const relevantSubcultures = new Set(RACES.map((race) => race.subculture_key));
const relevantFactions = new Set(tables.factions_tables.filter((row) => relevantSubcultures.has(row.subculture)).map((row) => row.key));
const setsBySubtype = groupBy(tables.character_skill_node_sets_tables.filter((row) => row.agent_subtype_key), "agent_subtype_key");
const itemsBySet = groupBy(tables.character_skill_node_set_items_tables.filter((row) => row.mod_disabled !== "true"), "set");
const nodeByKey = indexBy(tables.character_skill_nodes_tables, "key");
const levelsBySkill = groupBy(tables.character_skill_level_details_tables, "skill_key");
const effectsBySkill = groupBy(tables.character_skill_level_to_effects_junctions_tables, "character_skill_key");
const skillLocksByNode = groupBy(tables.character_skill_nodes_skill_locks_tables, "character_skill_node");
const ancillaryLocksByNode = groupBy(tables.character_skill_node_ancillary_locks_tables, "character_skill_node");
const ancillaryGrantsBySkill = groupBy(tables.character_skill_level_to_ancillaries_junctions_tables, "skill");
const dilemmaGrantsBySkill = groupBy(tables.character_skill_level_to_dilemmas_junctions_tables, "character_skill_key");
const skillKeys = new Set(tables.character_skills_tables.map((row) => row.key));
const effectKeys = new Set(tables.effects_tables.map((row) => row.effect));
const ancillaryKeys = new Set(tables.ancillaries_tables.map((row) => row.key));
const dilemmaKeys = new Set(tables.dilemmas_tables.map((row) => row.key));

const candidateRacesBySubtype = new Map();
const addCandidateRace = (subtype, race) => {
  if (!candidateRacesBySubtype.has(subtype)) candidateRacesBySubtype.set(subtype, new Map());
  candidateRacesBySubtype.get(subtype).set(race.slug, race);
};
for (const row of tables.faction_agent_permitted_subtypes_tables) {
  const faction = factionByKey.get(row.faction);
  const race = faction ? raceBySubculture.get(faction.subculture) : null;
  if (row.mod_disabled !== "true" && !CHARACTER_SUBTYPE_EXCLUSIONS.has(row.subtype) && race && setsBySubtype.has(row.subtype)) addCandidateRace(row.subtype, race);
}
for (const row of tables.frontend_faction_leaders_tables) {
  const faction = factionByKey.get(row.faction);
  const race = faction ? raceBySubculture.get(faction.subculture) : null;
  if (race && !CHARACTER_SUBTYPE_EXCLUSIONS.has(row.agent_subtype_record) && setsBySubtype.has(row.agent_subtype_record)) addCandidateRace(row.agent_subtype_record, race);
}
const expectedRaceBySubtype = new Map();
for (const [subtype, racesBySlug] of candidateRacesBySubtype) {
  const races = [...racesBySlug.values()];
  if (races.length === 1) expectedRaceBySubtype.set(subtype, races[0]);
  else {
    const ownerSlug = CHARACTER_RACE_OVERRIDES.get(subtype);
    const owner = ownerSlug ? raceBySlug.get(ownerSlug) : null;
    if (!owner || !racesBySlug.has(owner.slug)) fail(`${subtype}: shared source subtype has no valid canonical race owner.`);
    else expectedRaceBySubtype.set(subtype, owner);
  }
}
const expectedSubtypes = new Set(expectedRaceBySubtype.keys());
const expectedCharacterCount = RACES.reduce((sum, race) => sum + race.expected_characters, 0);
if (expectedSubtypes.size !== expectedCharacterCount) fail(`Source scope expected ${expectedCharacterCount} subtypes; found ${expectedSubtypes.size}.`);
else pass(`The source scope resolves to exactly ${expectedCharacterCount} character subtypes.`);

const files = (await walk(path.join(DATASET, "characters"))).filter((file) => file.endsWith(".csv")).sort();
if (files.length !== expectedCharacterCount) fail(`Expected ${expectedCharacterCount} character CSVs; found ${files.length}.`);
else pass(`All ${expectedCharacterCount} character CSV files are present.`);

const parsedFiles = [];
let canonicalColumns = null;
for (const file of files) {
  const parsed = await csv(file);
  if (!canonicalColumns) canonicalColumns = parsed.columns;
  else if (JSON.stringify(parsed.columns) !== JSON.stringify(canonicalColumns)) fail(`${file}: header differs from the canonical character schema.`);
  parsedFiles.push({ file, ...parsed });
}
if (!errors.some((message) => /UTF-8|line endings|field count|header differs/.test(message))) {
  pass("Every character CSV is valid UTF-8, uses LF or CRLF endings, has consistent row widths, and shares one canonical header.");
}

const allowedTypes = new Set(["character", "node_set", "node", "skill_level", "effect", "prerequisite", "skill_lock", "ancillary_lock", "ancillary_grant", "dilemma_grant"]);
const booleanColumns = ["is_legendary_lord", "is_unique_agent", "is_recruitable", "show_in_ui", "auto_generate", "is_caster", "node_set_for_army", "node_set_for_navy", "visible_in_ui", "effect_is_positive_value_good", "dilemma_random_selection"];
const numericColumns = ["node_set_index", "node_tier", "node_indent", "points_on_creation", "required_num_parents", "skill_unlocked_at_rank", "skill_max_level", "skill_level", "level_unlocked_at_rank", "effect_value", "effect_priority", "initial_descent_tiers", "parent_link_position_offset", "child_link_position_offset", "locked_skill_level"];
const requiredCommon = ["record_type", "game", "patch", "steam_build_id", "race", "race_slug", "subculture_key", "character_name", "character_slug", "character_class", "agent_subtype_key", "source_table", "source_key"];
const fileBySubtype = new Map();

for (const parsed of parsedFiles) {
  const characterRows = parsed.rows.filter((row) => row.record_type === "character");
  if (characterRows.length !== 1) { fail(`${parsed.file}: expected one character row; found ${characterRows.length}.`); continue; }
  const character = characterRows[0];
  if (fileBySubtype.has(character.agent_subtype_key)) fail(`Duplicate character subtype across files: ${character.agent_subtype_key}.`);
  fileBySubtype.set(character.agent_subtype_key, parsed);
  if (!expectedSubtypes.has(character.agent_subtype_key)) fail(`${parsed.file}: subtype is outside the ${RACES.length}-race source scope.`);
  else if (character.race_slug !== expectedRaceBySubtype.get(character.agent_subtype_key)?.slug) fail(`${parsed.file}: subtype is assigned to ${character.race_slug} instead of its canonical race owner.`);
  for (const row of parsed.rows) {
    if (!allowedTypes.has(row.record_type)) fail(`${parsed.file}: unknown record_type ${row.record_type}.`);
    for (const column of requiredCommon) if (!row[column]) fail(`${parsed.file}: ${row.record_type} row has blank required field ${column}.`);
    if (row.agent_subtype_key !== character.agent_subtype_key) fail(`${parsed.file}: mixed agent subtype ${row.agent_subtype_key}.`);
    for (const column of booleanColumns) if (row[column] && !["true", "false"].includes(row[column])) fail(`${parsed.file}: ${column} is not a lowercase boolean.`);
    for (const column of numericColumns) if (row[column] && !Number.isFinite(Number(row[column]))) fail(`${parsed.file}: ${column} is not numeric.`);
    if (["node", "skill_level", "effect", "skill_lock", "ancillary_lock", "ancillary_grant", "dilemma_grant"].includes(row.record_type)) {
      if (!row.node_set_key || !row.node_key || !row.skill_key) fail(`${parsed.file}: ${row.record_type} row is missing node-set, node, or skill identity.`);
      if (!skillKeys.has(row.skill_key)) fail(`${parsed.file}: unresolved skill key ${row.skill_key}.`);
    }
    if (row.record_type === "effect" && !effectKeys.has(row.effect_key)) fail(`${parsed.file}: unresolved effect key ${row.effect_key}.`);
    if (["ancillary_lock", "ancillary_grant"].includes(row.record_type) && !ancillaryKeys.has(row.ancillary_key)) fail(`${parsed.file}: unresolved ancillary key ${row.ancillary_key}.`);
    if (row.record_type === "dilemma_grant" && !dilemmaKeys.has(row.dilemma_key)) fail(`${parsed.file}: unresolved dilemma key ${row.dilemma_key}.`);
    if (row.record_type === "skill_lock" && !skillKeys.has(row.locked_skill_key)) fail(`${parsed.file}: unresolved locked skill ${row.locked_skill_key}.`);
  }
}

for (const subtype of expectedSubtypes) if (!fileBySubtype.has(subtype)) fail(`Missing character file for ${subtype}.`);
if (fileBySubtype.size === expectedCharacterCount && !errors.some((message) => /mixed agent subtype|outside the \d+-race|Missing character file|Duplicate character subtype/.test(message))) {
  pass("Each source subtype maps to exactly one self-contained character file.");
}
if (!errors.some((message) => /lowercase boolean|not numeric|unknown record_type|blank required/.test(message))) {
  pass("Record types, required fields, booleans, and numeric representations are valid across every CSV.");
}
if (!errors.some((message) => /unresolved skill|unresolved effect|unresolved ancillary|unresolved dilemma|unresolved locked/.test(message))) {
  pass("Every skill, effect, lock, ancillary, and dilemma foreign key resolves to its source table.");
}

function expectedSourceKeysForSet(setKey) {
  const members = (itemsBySet.get(setKey) ?? []).map((item) => nodeByKey.get(item.item)).filter(Boolean);
  const memberKeys = new Set(members.map((node) => node.key));
  const result = {
    node: [], skill_level: [], effect: [], prerequisite: [], skill_lock: [], ancillary_lock: [], ancillary_grant: [], dilemma_grant: [],
  };
  for (const node of members) {
    const skill = node.character_skill_key;
    result.node.push(node.key);
    for (const level of levelsBySkill.get(skill) ?? []) result.skill_level.push(`${skill}|${level.level}|${level.campaign_key}|${level.faction_key}|${level.subculture_key}`);
    for (const effect of effectsBySkill.get(skill) ?? []) result.effect.push(`${skill}|${effect.effect_key}|${effect.level}|${effect.effect_scope}`);
    for (const lock of skillLocksByNode.get(node.key) ?? []) result.skill_lock.push(`${node.key}|${lock.character_skill}|${lock.level}`);
    for (const lock of ancillaryLocksByNode.get(node.key) ?? []) result.ancillary_lock.push(`${node.key}|${lock.ancillary_lock}`);
    for (const grant of ancillaryGrantsBySkill.get(skill) ?? []) result.ancillary_grant.push(`${skill}|${grant.granted_ancillary}|${grant.level}`);
    for (const grant of dilemmaGrantsBySkill.get(skill) ?? []) result.dilemma_grant.push(`${skill}|${grant.dilemma_key}|${grant.level}`);
  }
  for (const link of tables.character_skill_node_links_tables) {
    if (memberKeys.has(link.child_key) && memberKeys.has(link.parent_key)) result.prerequisite.push(`${link.parent_key}|${link.child_key}|${link.link_type}`);
  }
  return Object.fromEntries(Object.entries(result).map(([type, keys]) => [type, keys.sort()]));
}

let totalNodeSets = 0;
let totalNodes = 0;
let totalEffects = 0;
for (const [subtype, parsed] of fileBySubtype) {
  const expectedSets = (setsBySubtype.get(subtype) ?? []).map((row) => row.key).sort();
  const actualSets = parsed.rows.filter((row) => row.record_type === "node_set").map((row) => row.node_set_key).sort();
  if (JSON.stringify(actualSets) !== JSON.stringify(expectedSets)) fail(`${subtype}: node-set coverage differs from source.`);
  totalNodeSets += actualSets.length;
  for (const setKey of expectedSets) {
    const expected = expectedSourceKeysForSet(setKey);
    for (const [type, keys] of Object.entries(expected)) {
      const actual = parsed.rows.filter((row) => row.record_type === type && row.node_set_key === setKey).map((row) => row.source_key).sort();
      if (JSON.stringify(actual) !== JSON.stringify(keys)) fail(`${subtype}/${setKey}: ${type} rows differ from source (expected ${keys.length}, found ${actual.length}).`);
    }
    const setNodeKeys = new Set(parsed.rows.filter((row) => row.record_type === "node" && row.node_set_key === setKey).map((row) => row.node_key));
    for (const link of parsed.rows.filter((row) => row.record_type === "prerequisite" && row.node_set_key === setKey)) {
      if (!setNodeKeys.has(link.parent_node_key) || !setNodeKeys.has(link.child_node_key)) fail(`${subtype}/${setKey}: prerequisite endpoint is absent from the set.`);
    }
    totalNodes += expected.node.length;
    totalEffects += expected.effect.length;
  }
}
if (!errors.some((message) => /node-set coverage|rows differ from source|prerequisite endpoint/.test(message))) {
  pass(`All ${totalNodeSets} node sets, ${totalNodes} node occurrences, and ${totalEffects} effect rows reconcile exactly to the source junctions.`);
  pass("All prerequisite endpoints resolve inside their applicable node-set variant.");
}

for (const race of RACES) {
  const actual = parsedFiles.filter((parsed) => parsed.rows[0]?.race_slug === race.slug).length;
  if (actual !== race.expected_characters) fail(`${race.slug}: expected ${race.expected_characters} files; found ${actual}.`);
}
if (!errors.some((message) => RACES.some((race) => message.startsWith(`${race.slug}:`)))) {
  pass(`Race totals reconcile: ${RACES.map((race) => `${race.expected_characters} ${race.name}`).join(", ")}.`);
}

const indexFile = await csv(path.join(DATASET, `character_index__wh3__${PATCH}.csv`));
if (indexFile.rows.length !== expectedCharacterCount) fail(`Character index contains ${indexFile.rows.length} rows instead of ${expectedCharacterCount}.`);
const indexBySubtype = indexBy(indexFile.rows, "agent_subtype_key");
for (const [subtype, parsed] of fileBySubtype) {
  const index = indexBySubtype.get(subtype);
  if (!index) { fail(`Character index is missing ${subtype}.`); continue; }
  const relative = path.relative(DATASET, parsed.file).replaceAll(path.sep, "/");
  if (index.relative_path !== relative) fail(`${subtype}: indexed path does not match actual path.`);
  if (!matchesTextFingerprint(parsed.buffer, index.file_sha256, index.file_bytes)) fail(`${subtype}: file hash or byte count does not match index.`);
  if (Number(index.total_row_count) !== parsed.rows.length) fail(`${subtype}: indexed total row count does not match file.`);
  for (const [column, type] of [["node_count", "node"], ["skill_level_row_count", "skill_level"], ["effect_row_count", "effect"], ["prerequisite_row_count", "prerequisite"], ["skill_lock_row_count", "skill_lock"], ["ancillary_lock_row_count", "ancillary_lock"], ["ancillary_grant_row_count", "ancillary_grant"], ["dilemma_grant_row_count", "dilemma_grant"]]) {
    if (Number(index[column]) !== parsed.rows.filter((row) => row.record_type === type).length) fail(`${subtype}: indexed ${column} does not match file.`);
  }
}
if (!errors.some((message) => /Character index|indexed|file hash|byte count/.test(message))) pass("The character index reconciles every path, row count, byte count, and SHA-256 file hash.");

const structureGroups = groupBy(indexFile.rows, "tree_structure_sha256");
const duplicateStructures = [...structureGroups.values()].filter((rows) => rows.length > 1);
if (duplicateStructures.length) {
  for (const group of duplicateStructures) {
    const subtypes = group.map(row => row.agent_subtype_key).sort();
    const reviewed = (SNAPSHOT.scope.SHARED_TREE_GROUPS ?? []).find(rule =>
      JSON.stringify([...rule.subtypes].sort()) === JSON.stringify(subtypes));
    if (reviewed) warn(`Shared source tree structure: ${subtypes.join(", ")}. ${reviewed.reason}`);
    else fail(`Duplicate complete tree structure: ${subtypes.join(", ")}.`);
  }
} else pass(`All ${expectedCharacterCount} complete tree-structure hashes are unique; no file is a renamed duplicate.`);

const schema = await csv(path.join(DATASET, "schema_inventory__v1.csv"));
const documented = schema.rows.sort((a, b) => Number(a.column_position) - Number(b.column_position)).map((row) => row.column_name);
if (JSON.stringify(documented) !== JSON.stringify(canonicalColumns)) fail("Schema inventory does not match the actual character CSV header and order.");
else pass("The machine-readable schema inventory matches every character CSV column and position.");

const sourceManifest = JSON.parse(await readFile(path.join(SOURCE, "source_manifest.json"), "utf8"));
for (const entry of sourceManifest.files) {
  const file = path.join(SOURCE, ...entry.path.split("/"));
  if (!matchesTextFingerprint(await readFile(file), entry.sha256, entry.bytes)) fail(`Source hash mismatch: ${entry.path}.`);
}
if (!errors.some((message) => message.startsWith("Source hash mismatch"))) pass(`All ${sourceManifest.files.length} authoritative source-export hashes match their manifest.`);

const golden = [
  ["wh_dlc03_bst_khazrak", "Khazrak One-Eye", "legendary_lord", "wh_dlc03_skill_node_bst_khazrak_unique_04"],
  ["wh_dlc03_bst_malagor", "Malagor the Dark Omen", "legendary_lord", "wh_dlc03_skill_node_bst_malagor_unique_02"],
  ["wh_dlc05_bst_morghur", "Morghur the Shadowgave", "legendary_lord", "wh_dlc03_skill_node_bst_morghur_unique_02"],
  ["wh2_dlc17_bst_taurox", "Taurox the Brass Bull", "legendary_lord", "wh2_dlc17_skill_node_bst_taurox_unique_01"],
  ["wh_main_brt_louen_leoncouer", "King Louen Leoncoeur", "legendary_lord", null],
  ["wh3_main_dae_daemon_prince", "Daemon Prince", "legendary_lord", null],
  ["wh2_main_def_malekith", "Malekith", "legendary_lord", null],
  ["wh_main_dwf_thorgrim_grudgebearer", "Thorgrim Grudgebearer", "legendary_lord", null],
  ["wh_main_emp_karl_franz", "Karl Franz", "legendary_lord", null],
  ["wh3_main_cth_miao_ying", "Miao Ying", "legendary_lord", null],
  ["wh3_main_kho_skarbrand", "Skarbrand", "legendary_lord", null],
  ["wh3_main_ksl_katarin", "Tzarina Katarin", "legendary_lord", null],
  ["wh2_main_lzd_lord_mazdamundi", "Lord Mazdamundi", "legendary_lord", null],
  ["wh_dlc08_nor_wulfrik", "Wulfrik", "legendary_lord", null],
  ["wh3_main_nur_kugath", "Ku'gath Plaguefather", "legendary_lord", null],
  ["wh3_main_ogr_greasus_goldtooth", "Greasus Goldtooth", "legendary_lord", null],
  ["wh2_dlc09_tmb_settra", "Settra the Imperishable", "legendary_lord", null],
  ["wh3_main_tze_kairos", "Kairos Fateweaver", "legendary_lord", null],
  ["wh_main_vmp_mannfred_von_carstein", "Mannfred von Carstein", "legendary_lord", null],
  ["wh_main_chs_archaon", "Archaon the Everchosen", "legendary_lord", null],
  ["wh_dlc05_wef_orion", "Orion", "legendary_lord", null],
  ["wh2_dlc12_skv_ikit_claw", "Ikit Claw", "legendary_lord", "wh2_dlc12_skill_node_skv_ikit_claw_unique_00"],
  ["wh2_main_hef_tyrion", "Tyrion", "legendary_lord", "wh2_main_skill_node_hef_tyrion_unique_0"],
  ["wh2_main_hef_mage_high", "Mage (High)", "hero", null],
  ["wh2_dlc11_cst_gunnery_wight", "Gunnery Wight", "hero", null],
  ["wh3_dlc23_chd_sorcerer_prophet_hashut", "Sorcerer-Prophet (Hashut)", "lord", null],
  ["wh3_main_sla_nkari", "N'Kari", "legendary_lord", null],
  ["wh3_dlc26_grn_gorbad_ironclaw", "Gorbad Ironclaw", "legendary_lord", "wh3_dlc26_skill_node_grn_gorbad_unique_04"],
  ["wh3_dlc26_grn_snagla_grobpsit", "Snagla Grobspit", "hero", "wh3_dlc26_skill_grn_snagla_grobspit_self_01"],
  ["wh_dlc06_grn_wurrzag_da_great_prophet", "Wurrzag da Great Green Prophet", "legendary_lord", "wh3_dlc26_skill_node_grn_wurrzag_da_great_prophet_paint_01"],
];
for (const [subtype, expectedName, classification, node] of golden) {
  const parsed = fileBySubtype.get(subtype);
  if (!parsed) fail(`Golden character missing: ${subtype}.`);
  else {
    const character = parsed.rows.find((row) => row.record_type === "character");
    if (character.character_name !== expectedName) fail(`Golden character name failed: ${subtype}; found ${character.character_name}.`);
    if (character.character_class !== classification) fail(`Golden classification failed: ${subtype}.`);
    if (node && !parsed.rows.some((row) => row.record_type === "node" && row.node_key === node)) fail(`Golden node missing: ${node}.`);
    if (!parsed.rows.some((row) => row.record_type === "effect")) fail(`Golden character has no extracted effects: ${subtype}.`);
  }
}
if (!errors.some((message) => message.startsWith("Golden"))) pass("Golden checks cover representative lords or heroes from all 24 races, including unique nodes for Beastmen, Greenskins, High Elves, and Skaven.");

let missingSkillNames = 0;
let missingEffectDescriptions = 0;
for (const parsed of parsedFiles) {
  missingSkillNames += parsed.rows.filter((row) => row.record_type === "node" && !row.skill_name).length;
  missingEffectDescriptions += parsed.rows.filter((row) => row.record_type === "effect" && !row.effect_description).length;
}
if (missingSkillNames) warn(`${missingSkillNames} node occurrences have no English skill name in the authoritative localisation source.`);
else pass("Every extracted node has an English skill name.");
if (missingEffectDescriptions) warn(`${missingEffectDescriptions} effect occurrences have no English description in the authoritative localisation source; keys, values, and scopes remain present.`);
else pass("Every extracted effect has an English description.");

const report = {
  status: errors.length ? "failed" : "passed",
  checked_at_utc: new Date().toISOString(),
  character_files: files.length,
  node_sets: totalNodeSets,
  node_occurrences: totalNodes,
  effect_rows: totalEffects,
  passes,
  warnings,
  errors,
};
await writeFile(path.join(DATASET, "audit_report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const markdown = [
  "# Character skill-tree dataset audit", "", `Status: **${report.status.toUpperCase()}**`, "",
  `Checked ${report.character_files} character files, ${report.node_sets} conditional node sets, ${report.node_occurrences} node occurrences, and ${report.effect_rows} effect rows.`, "",
  "## Passed checks", "", ...passes.map((item) => `- ${item}`), "",
  "## Warnings", "", ...(warnings.length ? warnings.map((item) => `- ${item}`) : ["- None."]), "",
  "## Errors", "", ...(errors.length ? errors.map((item) => `- ${item}`) : ["- None."]), "",
].join("\n");
await writeFile(path.join(DATASET, "audit_report.md"), markdown, "utf8");
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
