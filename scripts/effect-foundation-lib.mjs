// Source discovery only: names identify relations to inspect, never stat semantics.
import path from "node:path";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";

export const SNAPSHOT = { game: "warhammer_3", patch: "8.1.1", steam_build_id: "24237342", executable_version: "8.1.1.0" };
export const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;

// Observed RPFM TSV projection: annotated RGB groups become one hex column.
// This describes export shape, not a lossless reconstruction of binary values.
export function exportShape(definition) {
  const groups = new Map(), columns = [], colours = [];
  for (const field of definition.fields) {
    if (field.is_part_of_colour == null) columns.push(field.name);
    else {
      const id = field.is_part_of_colour;
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(field);
    }
  }
  for (const fields of groups.values()) {
    const red = fields.find(f => f.name.endsWith("_r"));
    const prefix = red?.name.slice(0, -2);
    if (!red || fields.length !== 3 ||
        !["r", "g", "b"].every(c => fields.some(f => f.name === `${prefix}_${c}`)) ||
        fields.some(f => f.is_key || f.is_reference)) {
      throw new Error("Unsupported RPFM colour schema projection");
    }
    const column = `${prefix}_hex`;
    columns.push(column);
    colours.push({ column, source_fields: fields.map(f => f.name) });
  }
  if (new Set(columns).size !== columns.length) throw new Error("Duplicate projected schema column");
  return { columns, colours };
}

export function family(table) {
  if (/^effect_bonus_value_/.test(table)) return "effect_bindings";
  if (/^campaign_bonus_value_battle_context_/.test(table)) return "battle_conditions";
  if (/^campaign_effect_scope/.test(table)) return "scope_definitions";
  if (/^unit_set(s_tables|_to_unit_junctions_tables|_unit_|_special_ability_phase)/.test(table)) return "unit_targets";
  if (/^(_kv_experience_bonuses|unit_experience_|unit_stats_land_experience_bonuses)/.test(table)) return "experience";
  if (/^(campaign_unit_stat_bonuses|modifiable_unit_stats|unit_stat_modifiers|scripted_bonus_value_ids)_tables$/.test(table)) return "stat_rule_definitions";
  if (table === "effects_tables") return "effect_definitions";
  return null;
}

// These relation owners already exist. Dependency edges to them remain explicit.
export const EXTERNAL_OWNERS = new Set([
  "main_units_tables", "land_units_tables", "battle_entities_tables",
  "melee_weapons_tables", "missile_weapons_tables", "projectiles_tables",
  "unit_abilities_tables", "special_ability_phases_tables", "unit_attributes_tables",
  "factions_tables", "cultures_tables", "cultures_subcultures_tables",
  "agent_subtypes_tables", "building_levels_tables", "building_chains_tables",
  "technologies_tables", "character_skills_tables",
]);

export function discover(dbPaths, definitions = {}) {
  const available = new Set(dbPaths.filter(p => p.startsWith("db/")).map(p => p.split("/")[1]));
  const roots = [...available].filter(t => family(t)).sort(compare);
  if (!roots.length) throw new Error("No foundation relations in supplied source inventory");
  const selected = new Set(roots), queue = [...roots], edges = [];
  while (queue.length) {
    const source = queue.shift();
    // Retain references from all schema versions; actual export versions are checked later.
    const refs = new Map();
    for (const version of definitions[source] ?? []) {
      for (const f of version.fields ?? []) {
        if (!f.is_reference) continue;
        const target = f.is_reference[0].endsWith("_tables") ? f.is_reference[0] : f.is_reference[0] + "_tables";
        refs.set(`${f.name}|${target}|${f.is_reference[1]}`, { source_table: source, source_column: f.name, target_table: target, target_column: f.is_reference[1] });
      }
    }
    for (const ref of [...refs.values()].sort((a,b) => compare(JSON.stringify(a), JSON.stringify(b)))) {
      ref.status = EXTERNAL_OWNERS.has(ref.target_table) ? "external_dataset_owner"
        : available.has(ref.target_table) ? "selected_dependency" : "no_packed_table_in_inventory";
      edges.push(ref);
      if (ref.status === "selected_dependency" && !selected.has(ref.target_table)) {
        selected.add(ref.target_table); queue.push(ref.target_table);
      }
    }
    if (selected.size > 400) throw new Error("Dependency closure exceeds 400 tables; inspect ownership boundaries before extraction");
  }
  return { roots, selected_tables: [...selected].sort(compare), dependency_edges: edges,
    schema_missing_for_roots: roots.filter(t => !definitions[t]),
    interpretation: "Discovery/coverage evidence, not resolved engine stat semantics" };
}

export async function filesBelow(root) {
  const result = [];
  for (const entry of (await readdir(root, { withFileTypes: true })).sort((a,b) => compare(a.name,b.name))) {
    const p = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...await filesBelow(p));
    else if (entry.isFile()) result.push(p);
  }
  return result;
}

export async function verifyManifest(root) {
  const manifest = JSON.parse(await readFile(path.join(root, "source_manifest.json"), "utf8"));
  for (const [k, v] of Object.entries(SNAPSHOT)) {
    if (String(manifest[k]) !== v) throw new Error(`Source snapshot mismatch: ${k}`);
  }
  const paths = new Set();
  for (const f of manifest.files) {
    if (paths.has(f.path) || path.isAbsolute(f.path) || f.path.split(/[\\/]/).includes("..")) throw new Error("Duplicate or unsafe manifest path");
    paths.add(f.path);
    const b = await readFile(path.join(root, f.path));
    if (b.length !== f.bytes || sha256(b) !== f.sha256) throw new Error(`Source integrity failure: ${f.path}`);
  }
  const actual = (await filesBelow(root)).map(p => path.relative(root,p).replaceAll("\\","/")).filter(p => p !== "source_manifest.json");
  if (actual.some(p => !paths.has(p)) || actual.length !== paths.size) throw new Error("Manifest does not exactly cover source files");
  return manifest;
}
