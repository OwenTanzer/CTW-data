import { readVictoryConfig, SOURCE_PATH } from "./victory-config.mjs";
import { buildSnapshot } from "./snapshot-build.mjs";
import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_campaign_atlas__wh3__8.1.1");
const OUTPUT = path.resolve(ROOT, process.argv[3] ?? "work/generated_campaign_atlas__wh3__8.1.1/campaign_atlas__wh3__8.1.1.gpkg");
const SNAPSHOT = await buildSnapshot(SOURCE);
const DB_DIR = path.join(SOURCE, "db");
const LOC_DIR = path.join(SOURCE, "text", "db");
const MAP_KEY = SNAPSHOT.context.patch === "9.0" ? "wh3_main_combi_map_7" : "wh3_main_combi_map_5";
const MAP_DIR = path.join(SOURCE, "campaign_maps", MAP_KEY);
let VICTORY_SCRIPT = path.join(SOURCE, "script", "campaign", "main_warhammer", "victory_objectives.lua");
try { await stat(VICTORY_SCRIPT); }
catch { if (SNAPSHOT.context.patch !== "8.1.1") throw Error("Current victory script missing from verified snapshot"); VICTORY_SCRIPT = path.join(ROOT, "work", "pilot_online_audit_gamefiles", "script", "campaign", "main_warhammer", "victory_objectives.lua"); }

const CAMPAIGN = "wh3_main_combi";
const GAME = "warhammer_3";
const PATCH = SNAPSHOT.context.patch;
const BUILD = SNAPSHOT.context.steam_build_id;

function parseDelimited(text, delimiter = "\t") {
  if (delimiter === "\t") return parseRpfmTsv(text);
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === "") quoted = true;
    else if (char === delimiter) { row.push(field); field = ""; }
    else if (char === "\n") {
      if (field.endsWith("\r")) field = field.slice(0, -1);
      row.push(field); rows.push(row); row = []; field = "";
    } else field += char;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function recordsFromText(text) {
  const rows = parseDelimited(text.replace(/^\uFEFF/, ""));
  const headers = rows.shift() ?? [];
  return rows.filter((row) => row.some(Boolean) && !String(row[0] ?? "").startsWith("#"))
    .map((row) => Object.fromEntries(headers.map((header, i) => [header, row[i] ?? ""])));
}

async function table(name) {
  return recordsFromText(await readFile(path.join(DB_DIR, name, "data__.tsv"), "utf8"));
}

async function loc(name) {
  return recordsFromText(await readFile(path.join(LOC_DIR, `${name}.loc.tsv`), "utf8"));
}

function indexBy(rows, key) { return new Map(rows.map((row) => [row[key], row])); }
function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
}
function number(value) { const n = Number(value); return value === "" || !Number.isFinite(n) ? null : n; }
function boolean(value) { return value === "true" ? 1 : value === "false" ? 0 : null; }
function sha256(buffer) { return createHash("sha256").update(buffer).digest("hex"); }
async function walkFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkFiles(fullPath));
    else if (entry.isFile()) files.push(fullPath);
  }
  return files;
}

// The lookup image is an uncompressed, colour-mapped TGA. Each non-black
// palette colour is the stable regions_tables colour for exactly one IE region.
function decodeRegionLookup(buffer) {
  const idLength = buffer[0];
  const colourMapType = buffer[1];
  const imageType = buffer[2];
  const colourMapFirst = buffer.readUInt16LE(3);
  const colourMapLength = buffer.readUInt16LE(5);
  const colourMapDepth = buffer[7];
  const width = buffer.readUInt16LE(12);
  const height = buffer.readUInt16LE(14);
  const pixelDepth = buffer[16];
  const descriptor = buffer[17];
  if (colourMapType !== 1 || imageType !== 1 || colourMapDepth !== 32 || pixelDepth !== 16) {
    throw new Error(`Unsupported region lookup TGA: cmap=${colourMapType}, type=${imageType}, cmapDepth=${colourMapDepth}, pixelDepth=${pixelDepth}`);
  }
  const paletteOffset = 18 + idLength;
  const pixelOffset = paletteOffset + colourMapLength * 4;
  let pixelIndexMin = 65535, pixelIndexMax = 0;
  for (let i = 0; i < width * height; i++) {
    const value = buffer.readUInt16LE(pixelOffset + i * 2);
    pixelIndexMin = Math.min(pixelIndexMin, value);
    pixelIndexMax = Math.max(pixelIndexMax, value);
  }
  // CA's lookup TGA declares a colour-map origin of 18 but stores pixel
  // indices as the zero-based 0..571 palette offsets. Detect that concrete
  // encoding rather than shifting every region by 18 palette entries.
  const paletteIndexBase = pixelIndexMin === 0 && pixelIndexMax < colourMapLength ? 0 : colourMapFirst;
  const palette = new Map();
  for (let i = 0; i < colourMapLength; i++) {
    const offset = paletteOffset + i * 4;
    const [b, g, r] = [buffer[offset], buffer[offset + 1], buffer[offset + 2]];
    palette.set(paletteIndexBase + i, [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase());
  }
  // This CA lookup also declares a bottom-right origin while its rows are
  // concretely stored in top-left order. Treat the decoded pixel array as
  // authoritative; honouring the descriptor mirrors known landmarks.
  const colours = new Array(width * height);
  const stats = new Map();
  for (let i = 0; i < width * height; i++) {
    const paletteIndex = buffer.readUInt16LE(pixelOffset + i * 2);
    const colour = palette.get(paletteIndex) ?? null;
    const storedX = i % width;
    const storedY = Math.floor(i / width);
    const x = storedX;
    const yTop = storedY;
    colours[yTop * width + x] = colour;
    if (!colour) continue;
    const item = stats.get(colour) ?? { count: 0, sumX: 0, sumY: 0, minX: x, maxX: x, minY: yTop, maxY: yTop };
    item.count++; item.sumX += x; item.sumY += yTop;
    item.minX = Math.min(item.minX, x); item.maxX = Math.max(item.maxX, x);
    item.minY = Math.min(item.minY, yTop); item.maxY = Math.max(item.maxY, yTop);
    stats.set(colour, item);
  }
  return { width, height, palette, colours, stats };
}

function luaTokens(text) {
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    if (/\s/.test(text[i])) { i++; continue; }
    if (text.startsWith("--[[", i)) { const end = text.indexOf("]]", i + 4); i = end < 0 ? text.length : end + 2; continue; }
    if (text.startsWith("--", i)) { const end = text.indexOf("\n", i + 2); i = end < 0 ? text.length : end + 1; continue; }
    const char = text[i];
    if ("{}[]=,;".includes(char)) { tokens.push({ type: char, value: char }); i++; continue; }
    if (char === '"' || char === "'") {
      const quote = char; let value = ""; i++;
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\" && i + 1 < text.length) {
          const escaped = text[++i]; value += escaped === "n" ? "\n" : escaped === "r" ? "\r" : escaped === "t" ? "\t" : escaped; i++;
        } else value += text[i++];
      }
      if (text[i] !== quote) throw new Error("Unterminated Lua string.");
      i++; tokens.push({ type: "string", value }); continue;
    }
    const numberMatch = text.slice(i).match(/^-?\d+(?:\.\d+)?/);
    if (numberMatch) { tokens.push({ type: "number", value: Number(numberMatch[0]) }); i += numberMatch[0].length; continue; }
    const identMatch = text.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identMatch) { tokens.push({ type: "identifier", value: identMatch[0] }); i += identMatch[0].length; continue; }
    throw new Error(`Unexpected Lua token ${JSON.stringify(char)} near offset ${i}.`);
  }
  return tokens;
}

function parseLuaVictoryTable(text) {
  const assignment = text.indexOf("victory_objectives_ie");
  const open = text.indexOf("{", assignment);
  if (assignment < 0 || open < 0) throw new Error("victory_objectives_ie table not found.");
  let depth = 0, quote = null, close = -1;
  for (let i = open; i < text.length; i++) {
    if (quote) {
      if (text[i] === "\\") i++;
      else if (text[i] === quote) quote = null;
      continue;
    }
    if (text.startsWith("--[[", i)) { const end = text.indexOf("]]", i + 4); i = end < 0 ? text.length : end + 1; continue; }
    if (text.startsWith("--", i)) { const end = text.indexOf("\n", i + 2); i = end < 0 ? text.length : end; continue; }
    if (text[i] === '"' || text[i] === "'") { quote = text[i]; continue; }
    if (text[i] === "{") depth++;
    else if (text[i] === "}" && --depth === 0) { close = i; break; }
  }
  if (close < 0) throw new Error("victory_objectives_ie closing brace not found.");
  const tokens = luaTokens(`victory_objectives_ie = ${text.slice(open, close + 1)}`);
  let at = 0;
  const peek = (offset = 0) => tokens[at + offset];
  const take = (type) => {
    const token = tokens[at++];
    if (!token || token.type !== type) throw new Error(`Expected Lua ${type}, got ${token?.type ?? "EOF"}.`);
    return token;
  };
  function value() {
    const token = peek();
    if (token.type === "{") return tableValue();
    if (token.type === "string" || token.type === "number") { at++; return token.value; }
    if (token.type === "identifier") {
      at++;
      if (token.value === "true") return true;
      if (token.value === "false") return false;
      if (token.value === "nil") return null;
      return token.value;
    }
    throw new Error(`Unexpected Lua value token ${token.type}.`);
  }
  function tableValue() {
    take("{");
    const array = []; const object = {}; let keyed = false;
    while (peek()?.type !== "}") {
      if (peek()?.type === "identifier" && peek(1)?.type === "=") {
        const key = take("identifier").value; take("="); object[key] = value(); keyed = true;
      } else if (peek()?.type === "[") {
        take("["); const key = value(); take("]"); take("="); object[key] = value(); keyed = true;
      } else array.push(value());
      if (peek()?.type === "," || peek()?.type === ";") at++;
    }
    take("}");
    if (!keyed) return array;
    if (array.length) object.__array = array;
    return object;
  }
  while (peek() && !(peek().type === "identifier" && peek().value === "victory_objectives_ie" && peek(1)?.type === "=")) at++;
  take("identifier"); take("=");
  return value();
}

function gpkgPoint(x, y, srsId = 100000) {
  const blob = Buffer.alloc(29);
  blob.write("GP", 0, "ascii"); blob[2] = 0; blob[3] = 1;
  blob.writeInt32LE(srsId, 4);
  blob[8] = 1; blob.writeUInt32LE(1, 9); blob.writeDoubleLE(x, 13); blob.writeDoubleLE(y, 21);
  return blob;
}

await mkdir(path.dirname(OUTPUT), { recursive: true });
try { await stat(OUTPUT); await rm(OUTPUT); } catch {}

const [
  playableAreas, mapRegions, mapSettlements, regionRows, provinceRows, regionProvinceRows,
  startRegions, startFactions, factionRows, subcultures, regionGroups, regionGroupLinks,
  routeNetworks, routeNodes, routeSegments, areasOfInterest, areaLabels,
  teleportNetworks, teleportNodes, battleAreas, battleGroups, battleGroupMaps, battleMappings,
  battles, missionRows,
  regionLocRows, provinceLocRows, factionLocRows, startFactionLocRows,
] = await Promise.all([
  table("campaign_map_playable_areas_tables"), table("campaign_map_regions_tables"), table("campaign_map_settlements_tables"),
  table("regions_tables"), table("provinces_tables"), table("region_to_province_junctions_tables"),
  table("start_pos_regions_tables"), table("start_pos_factions_tables"), table("factions_tables"), table("cultures_subcultures_tables"),
  table("region_groups_tables"), table("regions_to_region_groups_junctions_tables"),
  table("campaign_map_route_networks_tables"), table("campaign_map_route_nodes_tables"), table("campaign_map_route_segments_tables"),
  table("campaign_map_areas_of_interest_tables"), table("campaign_map_areas_of_interest_label_positions_tables"),
  table("teleportation_networks_tables"), table("teleportation_network_nodes_tables"),
  table("battle_catchment_override_areas_tables"), table("battle_catchment_override_groups_tables"),
  table("battle_catchment_override_group_battles_tables"), table("battle_catchment_override_battle_mappings_tables"),
  table("battles_tables"), table("missions_tables"),
  loc("regions__"), loc("provinces__"), loc("factions__"), loc("start_pos_factions__"),
]);

const localization = new Map([...regionLocRows, ...provinceLocRows, ...factionLocRows, ...startFactionLocRows].map((row) => [row.key, row.text]));
const regionByKey = indexBy(regionRows, "key");
const provinceByKey = indexBy(provinceRows, "key");
const factionByKey = indexBy(factionRows, "key");
const cultureBySubculture = new Map(subcultures.map((row) => [row.subculture, row.culture]));
const provinceLinkByRegion = indexBy(regionProvinceRows, "region");
const settlementByRegion = new Map(mapSettlements.map((row) => [row.settlement_id.replace(/^settlement:(?:settlement:)?/, ""), row]));
const startFactionById = new Map(startFactions.filter((row) => row.campaign === CAMPAIGN).map((row) => [row.ID, row]));
const ieStartRegions = startRegions.filter((row) => row.campaign === CAMPAIGN);
const startRegionByKey = indexBy(ieStartRegions, "region");
const currentRegionKeys = new Set(mapRegions.filter((row) => row.campaign_map === MAP_KEY).map((row) => row.region));
const currentRegions = [...currentRegionKeys].map((key) => regionByKey.get(key)).filter(Boolean);
const currentProvinceKeys = new Set(currentRegions.map((row) => provinceLinkByRegion.get(row.key)?.province).filter(Boolean));
const currentStartFactions = startFactions.filter((row) => row.campaign === CAMPAIGN);
const playableFactions = currentStartFactions.filter((row) => row.playable === "true");
const mapRow = playableAreas.find((row) => row.campaign_key === CAMPAIGN && row.mapname === MAP_KEY);
if (!mapRow) throw Error("Configured map revision does not match the campaign source");
const bounds = { minX: 0, minY: 0, maxX: 961, maxY: 748 };

const lookupBuffer = await readFile(path.join(MAP_DIR, "wh3_main_combi_lookup.tga"));
const lookup = decodeRegionLookup(lookupBuffer);
const regionsByColour = groupBy(currentRegions, "unnamed colour group_1");
const uniqueRegionByColour = new Map([...regionsByColour].filter(([colour, rows]) => colour !== "000000" && rows.length === 1).map(([colour, rows]) => [colour, rows[0].key]));

const adjacency = new Map();
for (let y = 0; y < lookup.height; y++) {
  for (let x = 0; x < lookup.width; x++) {
    const here = uniqueRegionByColour.get(lookup.colours[y * lookup.width + x]);
    if (!here) continue;
    for (const [nx, ny] of [[x + 1, y], [x, y + 1]]) {
      if (nx >= lookup.width || ny >= lookup.height) continue;
      const there = uniqueRegionByColour.get(lookup.colours[ny * lookup.width + nx]);
      if (!there || there === here) continue;
      const [a, b] = here < there ? [here, there] : [there, here];
      const key = `${a}\0${b}`; adjacency.set(key, (adjacency.get(key) ?? 0) + 1);
    }
  }
}

const victory = PATCH === "9.0" ? null : parseLuaVictoryTable(await readFile(VICTORY_SCRIPT, "utf8"));

const db = new DatabaseSync(OUTPUT);
db.exec(`
  PRAGMA application_id = 1196444487;
  PRAGMA user_version = 10300;
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = DELETE;
  CREATE TABLE gpkg_spatial_ref_sys (
    srs_name TEXT NOT NULL, srs_id INTEGER NOT NULL PRIMARY KEY, organization TEXT NOT NULL,
    organization_coordsys_id INTEGER NOT NULL, definition TEXT NOT NULL, description TEXT
  );
  CREATE TABLE gpkg_contents (
    table_name TEXT NOT NULL PRIMARY KEY, data_type TEXT NOT NULL, identifier TEXT UNIQUE,
    description TEXT DEFAULT '', last_change DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    min_x DOUBLE, min_y DOUBLE, max_x DOUBLE, max_y DOUBLE, srs_id INTEGER,
    FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
  );
  CREATE TABLE gpkg_geometry_columns (
    table_name TEXT NOT NULL, column_name TEXT NOT NULL, geometry_type_name TEXT NOT NULL,
    srs_id INTEGER NOT NULL, z TINYINT NOT NULL, m TINYINT NOT NULL,
    PRIMARY KEY (table_name, column_name), FOREIGN KEY (srs_id) REFERENCES gpkg_spatial_ref_sys(srs_id)
  );
  CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE campaigns (
    campaign_key TEXT PRIMARY KEY, name TEXT NOT NULL, game TEXT NOT NULL, patch TEXT NOT NULL,
    steam_build_id TEXT NOT NULL, map_key TEXT NOT NULL, min_x REAL, min_y REAL, max_x REAL, max_y REAL,
    lookup_width INTEGER, lookup_height INTEGER
  );
  CREATE TABLE factions (
    faction_key TEXT PRIMARY KEY, name TEXT NOT NULL, subculture_key TEXT, culture_key TEXT,
    playable INTEGER NOT NULL, is_major INTEGER, starting_order INTEGER, starting_treasury INTEGER,
    capital_region_key TEXT, FOREIGN KEY (capital_region_key) REFERENCES regions(region_key)
  );
  CREATE TABLE provinces (
    province_key TEXT PRIMARY KEY, name TEXT NOT NULL, capital_region_key TEXT
  );
  CREATE TABLE regions (
    region_key TEXT PRIMARY KEY, name TEXT NOT NULL, province_key TEXT,
    is_province_capital INTEGER NOT NULL, start_owner_faction_key TEXT, is_faction_capital INTEGER,
    settlement_climate_key TEXT, lookup_colour_hex TEXT NOT NULL, terrain_patch_area TEXT,
    pixel_count INTEGER, centroid_pixel_x REAL, centroid_pixel_y_top REAL,
    centroid_x REAL, centroid_y REAL, min_pixel_x INTEGER, min_pixel_y_top INTEGER,
    max_pixel_x INTEGER, max_pixel_y_top INTEGER, geometry_status TEXT NOT NULL,
    FOREIGN KEY (province_key) REFERENCES provinces(province_key),
    FOREIGN KEY (start_owner_faction_key) REFERENCES factions(faction_key)
  );
  CREATE TABLE region_points (
    fid INTEGER PRIMARY KEY AUTOINCREMENT, region_key TEXT NOT NULL UNIQUE, geom BLOB NOT NULL,
    FOREIGN KEY (region_key) REFERENCES regions(region_key)
  );
  CREATE TABLE region_adjacency (
    region_a TEXT NOT NULL, region_b TEXT NOT NULL, shared_raster_edges INTEGER NOT NULL,
    relation_type TEXT NOT NULL, PRIMARY KEY (region_a, region_b),
    FOREIGN KEY (region_a) REFERENCES regions(region_key), FOREIGN KEY (region_b) REFERENCES regions(region_key)
  );
  CREATE TABLE region_groups (
    region_group_key TEXT NOT NULL, region_key TEXT NOT NULL,
    PRIMARY KEY (region_group_key, region_key), FOREIGN KEY (region_key) REFERENCES regions(region_key)
  );
  CREATE TABLE strategic_nodes (
    node_key TEXT PRIMARY KEY, node_type TEXT NOT NULL, network_key TEXT, region_key TEXT,
    name TEXT, x REAL, y REAL, coordinate_source TEXT NOT NULL
  );
  CREATE TABLE strategic_links (
    link_id INTEGER PRIMARY KEY AUTOINCREMENT, network_key TEXT NOT NULL, link_type TEXT NOT NULL,
    from_node_key TEXT NOT NULL, to_node_key TEXT NOT NULL, source_region_or_segment_key TEXT
  );
  CREATE TABLE battle_areas (area_key TEXT PRIMARY KEY, lookup_colour_hex TEXT NOT NULL);
  CREATE TABLE battle_groups (
    battle_group_key TEXT PRIMARY KEY, battle_type_override TEXT, battle_type_requested TEXT
  );
  CREATE TABLE battle_maps (
    battle_map_key TEXT PRIMARY KEY, source_kind TEXT NOT NULL, map_location TEXT,
    battle_type TEXT, is_naval INTEGER, is_underground INTEGER, is_large_settlement INTEGER,
    catchment_name TEXT, tile_upgrade TEXT, battle_environment TEXT, playable_width REAL, playable_height REAL
  );
  CREATE TABLE battle_group_maps (
    battle_group_key TEXT NOT NULL, battle_map_key TEXT NOT NULL, catchment_name TEXT, tile_upgrades TEXT,
    PRIMARY KEY (battle_group_key, battle_map_key),
    FOREIGN KEY (battle_group_key) REFERENCES battle_groups(battle_group_key),
    FOREIGN KEY (battle_map_key) REFERENCES battle_maps(battle_map_key)
  );
  CREATE TABLE battle_selection_rules (
    rule_id INTEGER PRIMARY KEY AUTOINCREMENT, area_key TEXT NOT NULL, attacker_filter TEXT,
    defender_filter TEXT, battle_type TEXT, campaign_battle_path TEXT, required_tile_upgrades TEXT,
    battle_group_key TEXT NOT NULL, relation_status TEXT NOT NULL,
    FOREIGN KEY (area_key) REFERENCES battle_areas(area_key),
    FOREIGN KEY (battle_group_key) REFERENCES battle_groups(battle_group_key)
  );
  CREATE TABLE objectives (
    objective_key TEXT PRIMARY KEY, faction_key TEXT NOT NULL, victory_tier TEXT NOT NULL,
    objective_order INTEGER NOT NULL, objective_type TEXT NOT NULL, source_scope TEXT NOT NULL,
    source_scope_key TEXT NOT NULL, variant_key TEXT NOT NULL DEFAULT '', helper_key TEXT, FOREIGN KEY (faction_key) REFERENCES factions(faction_key)
  );
  CREATE TABLE objective_boundaries (objective_key TEXT NOT NULL REFERENCES objectives(objective_key), boundary_order INTEGER NOT NULL, kind TEXT NOT NULL, detail TEXT NOT NULL, PRIMARY KEY(objective_key,boundary_order));
  CREATE TABLE objective_conditions (
    objective_key TEXT NOT NULL, condition_order INTEGER NOT NULL, condition_type TEXT NOT NULL,
    target_key TEXT, numeric_value REAL, raw_condition TEXT NOT NULL,
    PRIMARY KEY (objective_key, condition_order), FOREIGN KEY (objective_key) REFERENCES objectives(objective_key)
  );
  CREATE TABLE mission_locations (
    mission_key TEXT PRIMARY KEY, mission_type TEXT, title TEXT, description TEXT,
    set_piece_battle_key TEXT, x REAL, y REAL, quest_mission INTEGER
  );
  CREATE TABLE map_assets (
    asset_key TEXT PRIMARY KEY, media_type TEXT NOT NULL, role TEXT NOT NULL,
    source_path TEXT NOT NULL, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, data BLOB NOT NULL
  );
  CREATE TABLE source_files (
    source_path TEXT PRIMARY KEY, sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, role TEXT NOT NULL
  );
  CREATE TABLE evidence (
    evidence_key TEXT PRIMARY KEY, source_path TEXT NOT NULL, extraction_method TEXT NOT NULL,
    confidence TEXT NOT NULL, notes TEXT
  );
  CREATE TABLE coverage (
    subject TEXT PRIMARY KEY, status TEXT NOT NULL, record_count INTEGER, notes TEXT NOT NULL
  );
`);

db.prepare("INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)").run("Undefined Cartesian", -1, "NONE", -1, "undefined", "undefined Cartesian coordinate reference system");
db.prepare("INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)").run("Undefined geographic", 0, "NONE", 0, "undefined", "undefined geographic coordinate reference system");
db.prepare("INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)").run("WGS 84", 4326, "EPSG", 4326, "GEOGCS[\"WGS 84\",DATUM[\"WGS_1984\",SPHEROID[\"WGS 84\",6378137,298.257223563]],PRIMEM[\"Greenwich\",0],UNIT[\"degree\",0.0174532925199433]]", "longitude/latitude coordinates in decimal degrees on the WGS 84 spheroid");
db.prepare("INSERT INTO gpkg_spatial_ref_sys VALUES (?, ?, ?, ?, ?, ?)").run("WH3 Immortal Empires logical map", 100000, "NONE", 100000, "undefined", "Creative Assembly campaign logical X/Y coordinates; not a real-world CRS");
db.exec("BEGIN IMMEDIATE");

const metadataInsert = db.prepare("INSERT INTO metadata VALUES (?, ?)");
for (const [key, value] of Object.entries({
  title: "Total War: Warhammer III Immortal Empires Campaign Atlas",
  game: GAME, patch: PATCH, steam_build_id: BUILD, campaign_key: CAMPAIGN, campaign_map_key: MAP_KEY,
  schema_version: PATCH === "9.0" ? "1.2.0" : "1.0.0", source_extracted_at_utc: SNAPSHOT.manifest.extracted_at_utc,
  geometry_model: "Exact colour-coded region raster plus derived centroids and raster-border adjacency; sea-region vectors unavailable",
})) metadataInsert.run(key, value);

db.prepare("INSERT INTO campaigns VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
  CAMPAIGN, "Immortal Empires", GAME, PATCH, BUILD, MAP_KEY,
  bounds.minX, bounds.minY, bounds.maxX, bounds.maxY, lookup.width, lookup.height,
);

const provinceInsert = db.prepare("INSERT INTO provinces VALUES (?, ?, ?)");
for (const key of [...currentProvinceKeys].sort()) {
  const capital = regionProvinceRows.find((row) => row.province === key && row.is_capital === "true")?.region ?? null;
  provinceInsert.run(key, localization.get(`provinces_onscreen_${key}`) || key, capital);
}

// Insert faction identities before regions, then fill capital_region_key after regions exist.
const factionInsert = db.prepare("INSERT INTO factions VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)");
for (const start of currentStartFactions.sort((a, b) => a.faction.localeCompare(b.faction))) {
  const faction = factionByKey.get(start.faction);
  factionInsert.run(
    start.faction, localization.get(`factions_screen_name_${start.faction}`) || start.faction,
    faction?.subculture || null, cultureBySubculture.get(faction?.subculture) || null,
    boolean(start.playable) ?? 0, boolean(start.is_major), number(start.starting_order), number(start.treasury),
  );
}

const regionInsert = db.prepare(`INSERT INTO regions VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)`);
const pointInsert = db.prepare("INSERT INTO region_points(region_key, geom) VALUES (?, ?)");
for (const region of currentRegions.sort((a, b) => a.key.localeCompare(b.key))) {
  const provinceLink = provinceLinkByRegion.get(region.key);
  const start = startRegionByKey.get(region.key);
  const owner = startFactionById.get(start?.owning_faction)?.faction ?? null;
  const colour = region["unnamed colour group_1"].toUpperCase();
  const stats = colour === "000000" ? null : lookup.stats.get(colour);
  const cxPixel = stats ? stats.sumX / stats.count : null;
  const cyPixel = stats ? stats.sumY / stats.count : null;
  const cx = stats ? bounds.minX + ((cxPixel + 0.5) / lookup.width) * (bounds.maxX - bounds.minX) : null;
  const cy = stats ? bounds.maxY - ((cyPixel + 0.5) / lookup.height) * (bounds.maxY - bounds.minY) : null;
  regionInsert.run(
    region.key, localization.get(`regions_onscreen_${region.key}`) || region.key,
    provinceLink?.province ?? null, boolean(provinceLink?.is_capital) ?? 0, owner,
    boolean(start?.faction_capital), settlementByRegion.get(region.key)?.climate_type || null,
    colour, region.terrain_patch_area || null, stats?.count ?? null, cxPixel, cyPixel, cx, cy,
    stats?.minX ?? null, stats?.minY ?? null, stats?.maxX ?? null, stats?.maxY ?? null,
    stats ? "exact_raster_mask_and_derived_centroid" : "no_distinct_lookup_colour",
  );
  if (stats) pointInsert.run(region.key, gpkgPoint(cx, cy));
}

const capitalUpdate = db.prepare("UPDATE factions SET capital_region_key = ? WHERE faction_key = ?");
for (const start of ieStartRegions.filter((row) => row.faction_capital === "true")) {
  const owner = startFactionById.get(start.owning_faction)?.faction;
  if (owner && currentRegionKeys.has(start.region)) capitalUpdate.run(start.region, owner);
}

const adjacencyInsert = db.prepare("INSERT INTO region_adjacency VALUES (?, ?, ?, 'raster_border')");
for (const [key, count] of adjacency) {
  const [a, b] = key.split("\0"); adjacencyInsert.run(a, b, count);
}

const regionGroupInsert = db.prepare("INSERT OR IGNORE INTO region_groups VALUES (?, ?)");
for (const link of regionGroupLinks) if (currentRegionKeys.has(link.region)) regionGroupInsert.run(link.region_group, link.region);

const nodeInsert = db.prepare("INSERT OR IGNORE INTO strategic_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
for (const row of routeNodes) {
  if (!row.key.includes("combi")) continue;
  const regionKey = currentRegionKeys.has(row.key) ? row.key : row.key.match(/(wh3_(?:main|dlc\d+)_combi_region_[a-z0-9_]+)/)?.[1] ?? null;
  nodeInsert.run(row.key, "route_node", null, regionKey, null, number(row.position_x), number(row.position_y), "campaign_map_route_nodes_tables");
}
const ieAois = new Set(areasOfInterest.filter((row) => row.campaign_map === MAP_KEY).map((row) => row.key));
for (const row of areaLabels) if (ieAois.has(row.campaign_map_area_of_interest)) {
  nodeInsert.run(`aoi:${row.campaign_map_area_of_interest}`, "area_of_interest", null, null,
    row.campaign_map_area_of_interest, number(row.logical_position_x), number(row.logical_position_y), "campaign_map_areas_of_interest_label_positions_tables");
}
const ieTeleportNetworks = new Set(teleportNetworks.filter((row) => row.campaign === CAMPAIGN).map((row) => row.key));
for (const row of teleportNodes) if (ieTeleportNetworks.has(row.network)) {
  nodeInsert.run(row.key, "teleportation_node", row.network, null, row.key, number(row.position_x), number(row.position_y), "teleportation_network_nodes_tables");
}

const linkInsert = db.prepare("INSERT INTO strategic_links(network_key, link_type, from_node_key, to_node_key, source_region_or_segment_key) VALUES (?, ?, ?, ?, ?)");
const ieRouteNetworks = new Set(routeNetworks.filter((row) => row.campaign === CAMPAIGN).map((row) => row.key));
for (const row of routeSegments) if (ieRouteNetworks.has(row.network)) linkInsert.run(row.network, "route_segment", row.from, row.to, row.regions || null);

const areaInsert = db.prepare("INSERT INTO battle_areas VALUES (?, ?)");
for (const row of battleAreas) areaInsert.run(row.area, row["unnamed colour group_1"].toUpperCase());
const battleGroupInsert = db.prepare("INSERT INTO battle_groups VALUES (?, ?, ?)");
for (const row of battleGroups) battleGroupInsert.run(row.group, row.battle_type_override || null, row.battle_type_requested || null);
const battleMapInsert = db.prepare("INSERT OR IGNORE INTO battle_maps VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
for (const row of battles) battleMapInsert.run(
  `battle:${row.key}`, "battles_tables", row.specification || row.map_path || null, row.type || null,
  boolean(row.is_naval), boolean(row.is_underground), boolean(row.is_large_settlement), row.catchment_name || null,
  row.tile_upgrade || null, row.battle_environment || null, number(row.playable_area_width), number(row.playable_area_height),
);
for (const row of battleGroupMaps) battleMapInsert.run(
  `location:${row.battle_map_location}`, "battle_catchment_override_group_battles_tables", row.battle_map_location,
  null, null, null, null, row.catchment_name || null, row.tile_upgrades || null, null, null, null,
);
const groupMapInsert = db.prepare("INSERT OR IGNORE INTO battle_group_maps VALUES (?, ?, ?, ?)");
for (const row of battleGroupMaps) groupMapInsert.run(row.group, `location:${row.battle_map_location}`, row.catchment_name || null, row.tile_upgrades || null);
const ruleInsert = db.prepare("INSERT INTO battle_selection_rules(area_key, attacker_filter, defender_filter, battle_type, campaign_battle_path, required_tile_upgrades, battle_group_key, relation_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
for (const row of battleMappings.filter((row) => row.battle_path === "wh3_main_combi_map")) ruleInsert.run(
  row.area, row.attacker || null, row.defender || null, row.battle_type || null, row.battle_path,
  row.required_tile_upgrades || null, row.battle_group, "authoritative_area_rule_region_overlay_not_decoded",
);

function addObjective(factionKey, tier, order, objective, sourceScope, sourceKey, variantKey = factionKey) {
  const key = `${variantKey}:${tier}:${String(order).padStart(3, "0")}`;
  db.prepare("INSERT INTO objectives VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(key, factionKey, tier, order, objective.type ?? "UNKNOWN", sourceScope, sourceKey, variantKey, objective.helper ?? null);
  for(const [i,b] of (objective.boundaries??[]).entries()) db.prepare("INSERT INTO objective_boundaries VALUES (?,?,?,?)").run(key,i+1,b.kind,JSON.stringify(b));
  const conditionInsert = db.prepare("INSERT INTO objective_conditions VALUES (?, ?, ?, ?, ?, ?)");
  const conditions = [...(objective.conditions ?? [])];
  if (PATCH !== "9.0" && ["CONSTRUCT_N_BUILDINGS_FROM", "CONSTRUCT_N_BUILDINGS_INCLUDING", "CONSTRUCT_N_OF_A_BUILDING"].includes(objective.type)) conditions.push(`faction ${factionKey}`);
  for (const [index, raw] of conditions.entries()) {
    const match = String(raw).match(/^(\S+)(?:\s+(.+))?$/);
    const type = match?.[1] ?? "unknown"; const target = match?.[2] ?? null;
    conditionInsert.run(key, index + 1, type, target, target !== null && Number.isFinite(Number(target)) ? Number(target) : null, String(raw));
  }
}

if(PATCH === "9.0") {
  const config=await readFile(path.join(SOURCE,SOURCE_PATH,'victory_objectives_config.lua'),'utf8');
  const utils=await readFile(path.join(SOURCE,SOURCE_PATH,'victory_objectives_config_utils.lua'),'utf8');
  const archaon=await readFile(path.join(SOURCE,'script/campaign/wh3_dlc29_archaon_narrative.lua'),'utf8');
  const groupResolver=(helper,key)=>{
    const column=helper.startsWith('province')?'r.province_key':'r.region_key';
    const rows=db.prepare(`SELECT DISTINCT ${column} value FROM region_groups g JOIN regions r USING(region_key) WHERE g.region_group_key=? AND ${column} IS NOT NULL ORDER BY value`).all(key);
    if(!rows.length)throw Error(`Empty configured region group ${key}`);return rows.map(r=>r.value);
  };
  for(const row of readVictoryConfig(config,utils,playableFactions.map(r=>r.faction),groupResolver,archaon))
    addObjective(row.faction,row.tier,row.order,row,'active_9.0_config',row.variant,row.variant);
} else {
for (const start of playableFactions.sort((a, b) => a.faction.localeCompare(b.faction))) {
  const factionKey = start.faction;
  const subcultureKey = factionByKey.get(factionKey)?.subculture;
  const subcultureSpec = victory.subcultures?.[subcultureKey] ?? {};
  const factionSpec = victory.factions?.[factionKey] ?? {};
  const alignmentKey = subcultureSpec.alignment ?? victory.alignments?.default ?? "destruction";
  let order = 0;
  for (const objective of factionSpec.objectives ?? []) addObjective(factionKey, "short", ++order, objective, "faction", factionKey);
  if (factionSpec.no_alignment_objective !== true) for (const objective of victory.alignments?.[alignmentKey]?.wh_main_short_victory?.objectives ?? []) {
    addObjective(factionKey, "short", ++order, objective, "alignment", alignmentKey);
  }
  order = 0;
  addObjective(factionKey, "long", ++order, { type: "SCRIPTED", conditions: ["script_key complete_faction_victory", "override_text mission_text_text_ie_attain_faction_victory"] }, "shared", "complete_faction_victory");
  if (factionSpec.no_alignment_objective !== true) for (const objective of victory.alignments?.[alignmentKey]?.wh_main_long_victory?.objectives ?? []) {
    addObjective(factionKey, "long", ++order, objective, "alignment", alignmentKey);
  }
  for (const objective of factionSpec.long_objectives ?? []) addObjective(factionKey, "long", ++order, objective, "faction", factionKey);
  if (victory.factions?.[factionKey] && factionSpec.no_subculture_objective !== true) for (const objective of subcultureSpec.objectives ?? []) {
    addObjective(factionKey, "long", ++order, objective, "subculture", subcultureKey);
  }
  addObjective(factionKey, "domination", 1, {
    type: "OCCUPY_LOOT_RAZE_OR_SACK_X_SETTLEMENTS",
    conditions: ["total 272"],
  }, "shared", "create_domination_objective");
}

}

const missionInsert = db.prepare("INSERT INTO mission_locations VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
for (const row of missionRows) {
  const x = number(row.location_x), y = number(row.location_y);
  if ((!x && !y) && !row.set_piece_battle) continue;
  missionInsert.run(row.key, row.mission_type || null, row.localised_title || null, row.localised_description || null,
    row.set_piece_battle || null, x, y, boolean(row.quest_mission));
}

const assetInsert = db.prepare("INSERT INTO map_assets VALUES (?, ?, ?, ?, ?, ?, ?)");
for (const [assetKey, filename, mediaType, role] of [
  ["region_lookup", "wh3_main_combi_lookup.tga", "image/x-tga", "exact_colour_coded_region_raster"],
  ["campaign_overview", "prebattle_map.png", "image/png", "campaign_reference_overview"],
  ["camera_heightmap", "camera_heightmap.png", "image/png", "campaign_camera_height_raster"],
  ["campaign_borders", path.join("display", "borders", "borders.pbd"), "application/octet-stream", "native_campaign_border_geometry"],
]) {
  const filePath = path.join(MAP_DIR, filename); const data = await readFile(filePath);
  assetInsert.run(assetKey, mediaType, role, `campaign_maps/${MAP_KEY}/${filename.replaceAll(path.sep, "/")}`, sha256(data), data.length, data);
}

const sourceFileInsert = db.prepare("INSERT OR REPLACE INTO source_files VALUES (?, ?, ?, ?)");
for (const filePath of (await walkFiles(SOURCE)).sort()) {
  if (filePath.endsWith("source_manifest.json")) continue;
  const data = await readFile(filePath);
  sourceFileInsert.run(path.relative(SOURCE, filePath).replaceAll(path.sep, "/"), sha256(data), data.length, "RPFM source snapshot");
}
const victoryData = await readFile(VICTORY_SCRIPT);
const victoryRelativeToSource = path.relative(SOURCE, VICTORY_SCRIPT);
const victorySourceKey = victoryRelativeToSource.startsWith("..")
  ? path.relative(ROOT, VICTORY_SCRIPT)
  : victoryRelativeToSource;
sourceFileInsert.run(victorySourceKey.replaceAll(path.sep, "/"), sha256(victoryData), victoryData.length, "Immortal Empires victory-objective script");

const evidenceInsert = db.prepare("INSERT INTO evidence VALUES (?, ?, ?, ?, ?)");
for (const row of [
  ["region_identity", "db/campaign_map_regions_tables + db/regions_tables", "RPFM TSV extraction and stable-key join", "authoritative", `Current map revision filtered to ${MAP_KEY}`],
  ["region_raster", `campaign_maps/${MAP_KEY}/wh3_main_combi_lookup.tga`, "CA zero-based/top-left TGA decode joined to regions_tables colour", "authoritative", `Exact raster masks for ${uniqueRegionByColour.size} current regions; black sea/special records share one colour and remain individually non-spatial`],
  ["start_ownership", "db/start_pos_regions_tables + db/start_pos_factions_tables", "campaign and numeric faction-ID join", "authoritative", "Turn-one region ownership and capitals"],
  ["objectives", PATCH === "9.0" ? "script/campaign/main_warhammer/victory_objectives_config.lua" : "script/campaign/main_warhammer/victory_objectives.lua", "Active 9.0 configured initial SP objectives, helper conditions and explicit lord variants; legacy composition only for 8.1.1", "authoritative", "Runtime scripted progress, unit-size scaling and Archaon later chosen-path objectives not flattened; see objective_boundaries. Rewards, crisis and multiplayer excluded"],
  ["battle_rules", "db/battle_catchment_override_*", "Area-rule and battle-group relational join", "authoritative_partial", "The native area-to-map rules are present; the binary catchment overlay connecting arbitrary campaign coordinates to areas is not decoded"],
]) evidenceInsert.run(...row);

const coverageInsert = db.prepare("INSERT INTO coverage VALUES (?, ?, ?, ?)");
for (const row of [
  ["IE regions", currentRegions.length === (PATCH === "9.0" ? 644 : 641) ? "complete" : "review", currentRegions.length, `All current campaign_map_regions rows for ${MAP_KEY}`],
  ["turn-one region ownership", ieStartRegions.length === currentRegions.length ? "complete" : "review", ieStartRegions.length, "Owner, province capital, and faction capital relations"],
  ["playable factions", playableFactions.length >= 100 ? "complete" : "review", playableFactions.length, "All start_pos_factions rows marked playable for wh3_main_combi"],
  ["region raster geometry", "partial", db.prepare("SELECT COUNT(*) count FROM region_points").get().count, "Exact masks/centroids/adjacency for 571 uniquely coloured regions; 70 black sea/special-region rows share one mask and lack individual shapes"],
  ["starting forces and agents", "unavailable", 0, "Not exposed by the decoded DB start-position relations in this source pass"],
  ["victory objectives", "configured_initial_short_long_domination_with_explicit_boundaries", db.prepare("SELECT COUNT(*) count FROM objectives").get().count, "Initial single-player objective definitions from active configuration; filter variant_key and read objective_boundaries before interpretation"],
  ["battle-map selection", "partial", db.prepare("SELECT COUNT(*) count FROM battle_selection_rules").get().count, "Rules and map groups present; exact campaign-coordinate catchment overlay remains binary"],
]) coverageInsert.run(...row);

db.exec("COMMIT");
db.exec(`
  CREATE VIEW region_reference AS
  SELECT r.region_key, r.name AS region_name, r.province_key, p.name AS province_name,
         r.is_province_capital, r.start_owner_faction_key, f.name AS start_owner_name,
         r.is_faction_capital, r.settlement_climate_key, r.lookup_colour_hex,
         r.pixel_count, r.centroid_x, r.centroid_y, r.geometry_status
  FROM regions r LEFT JOIN provinces p USING (province_key)
  LEFT JOIN factions f ON f.faction_key = r.start_owner_faction_key;
  CREATE VIEW faction_start_reference AS
  SELECT f.faction_key, f.name AS faction_name, f.subculture_key, f.culture_key,
         f.is_major, f.starting_order, f.starting_treasury, f.capital_region_key,
         r.name AS capital_region_name, r.province_key, r.centroid_x, r.centroid_y
  FROM factions f LEFT JOIN regions r ON r.region_key = f.capital_region_key
  WHERE f.playable = 1;
  CREATE VIEW objective_reference AS
  SELECT o.objective_key, o.faction_key, f.name AS faction_name, o.victory_tier, o.objective_order, o.variant_key, o.helper_key,
         o.objective_type, o.source_scope, o.source_scope_key,
         c.condition_order, c.condition_type, c.target_key, c.numeric_value, c.raw_condition
  FROM objectives o JOIN factions f USING (faction_key)
  LEFT JOIN objective_conditions c USING (objective_key);
  CREATE VIEW region_objective_pressure AS
  SELECT c.target_key AS region_key, r.name AS region_name,
         COUNT(DISTINCT o.faction_key) AS targeting_factions,
         COUNT(DISTINCT o.objective_key) AS targeting_objectives
  FROM objective_conditions c JOIN objectives o USING (objective_key)
  JOIN regions r ON r.region_key = c.target_key
  WHERE c.condition_type = 'region' GROUP BY c.target_key, r.name;
  CREATE VIEW battle_context_reference AS
  SELECT r.area_key, r.attacker_filter, r.defender_filter, r.battle_type,
         r.required_tile_upgrades, r.battle_group_key, gm.battle_map_key,
         bm.map_location, bm.catchment_name, r.relation_status
  FROM battle_selection_rules r
  LEFT JOIN battle_group_maps gm USING (battle_group_key)
  LEFT JOIN battle_maps bm USING (battle_map_key);
`);

const attributeTables = ["metadata", "campaigns", "factions", "provinces", "regions", "region_adjacency", "region_groups", "strategic_nodes", "strategic_links", "battle_areas", "battle_groups", "battle_maps", "battle_group_maps", "battle_selection_rules", "objectives", "objective_conditions", "objective_boundaries", "mission_locations", "map_assets", "source_files", "evidence", "coverage"];
const contentInsert = db.prepare("INSERT INTO gpkg_contents(table_name, data_type, identifier, description, min_x, min_y, max_x, max_y, srs_id) VALUES (?, 'attributes', ?, ?, NULL, NULL, NULL, NULL, NULL)");
for (const tableName of attributeTables) contentInsert.run(tableName, tableName, `Campaign atlas ${tableName}`);
db.prepare("INSERT INTO gpkg_contents(table_name, data_type, identifier, description, min_x, min_y, max_x, max_y, srs_id) VALUES ('region_points', 'features', 'region_points', 'Derived centroids of uniquely coloured Immortal Empires region masks', ?, ?, ?, ?, 100000)").run(bounds.minX, bounds.minY, bounds.maxX, bounds.maxY);
db.prepare("INSERT INTO gpkg_geometry_columns VALUES ('region_points', 'geom', 'POINT', 100000, 0, 0)").run();

db.prepare("UPDATE gpkg_contents SET last_change = ?").run(SNAPSHOT.manifest.extracted_at_utc);
db.exec("PRAGMA optimize; VACUUM;");
const integrity = db.prepare("PRAGMA integrity_check").get().integrity_check;
if (integrity !== "ok") throw new Error(`SQLite integrity check failed: ${integrity}`);
const summary = Object.fromEntries([
  "regions", "provinces", "factions", "region_points", "region_adjacency", "objectives",
  "objective_conditions", "battle_maps", "battle_selection_rules", "strategic_nodes", "strategic_links",
].map((name) => [name, db.prepare(`SELECT COUNT(*) count FROM ${name}`).get().count]));
if (PATCH === "9.0") {
  const tables = ["objectives", "objective_conditions", "objective_boundaries", "objective_reference"];
  const schema = Object.fromEntries(tables.map(name => [name, db.prepare(`PRAGMA table_info(${name})`).all()]));
  const manifest = {
    schema_version: "1.2.0", patch: PATCH, steam_build_id: BUILD,
    source_manifest: "objective_source_exports/source_manifest.json",
    schema: "objective_schema.json", primary_view: "objective_reference",
    objectives: summary.objectives, conditions: summary.objective_conditions,
    faction_count: playableFactions.length,
    variant_count: db.prepare("SELECT COUNT(DISTINCT variant_key) n FROM objectives").get().n,
    boundaries: db.prepare("SELECT kind, COUNT(*) count FROM objective_boundaries GROUP BY kind ORDER BY kind").all(),
    scope: "Configured initial single-player short/long/domination objectives; select variant_key and read objective_boundaries. Rewards, scripted listener state, crisis and multiplayer excluded."
  };
  await writeFile(path.join(path.dirname(OUTPUT), "objective_schema.json"), JSON.stringify(schema, null, 2) + "\n");
  await writeFile(path.join(path.dirname(OUTPUT), "objective_manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
}
db.close();
console.log(JSON.stringify({ output: OUTPUT, bytes: (await stat(OUTPUT)).size, ...summary }, null, 2));
