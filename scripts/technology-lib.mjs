import { fallbackLockLimitation } from "./technology-lock-limitations.mjs";
import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { SCRIPT_COLUMNS } from "./technology-rules.mjs";
import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { buildSnapshot } from "./snapshot-build.mjs";


export const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
export const hash = (x) => createHash("sha256").update(x).digest("hex");
export const stable = (x) =>
  Array.isArray(x)
    ? `[${x.map(stable).join(",")}]`
    : x && typeof x === "object"
      ? `{${Object.keys(x)
          .sort()
          .map((k) => JSON.stringify(k) + ":" + stable(x[k]))
          .join(",")}}`
      : JSON.stringify(x);
export function parse(text, delimiter = ",") {
  if (delimiter === "\t") {
    const [columns = [], ...data] = parseRpfmTsv(text);
    return { columns, rows: data.filter(r => !r[0].startsWith("#")).map(r => Object.fromEntries(columns.map((c, i) => [c, r[i]]))) };
  }
  const data = [];
  let row = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"' && !field) quoted = true;
    else if (c === delimiter) {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field.replace(/\r$/, ""));
      data.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (quoted) throw new Error("Unclosed quoted field");
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    data.push(row);
  }
  const columns = data.shift() ?? [];
  columns[0] = columns[0]?.replace(/^\uFEFF/, "");
  return {
    columns,
    rows: data
      .filter((r) => r.some(Boolean) && !r[0].startsWith("#"))
      .map((r) => {
        if (r.length !== columns.length)
          throw new Error(`Row width ${r.length} != ${columns.length}`);
        return Object.fromEntries(columns.map((c, i) => [c, r[i]]));
      }),
  };
}
export function csv(columns, rows) {
  const cell = (v) => {
    v = String(v ?? "");
    return /[",\r\n]/.test(v) ? '"' + v.replaceAll('"', '""') + '"' : v;
  };
  return (
    [
      columns.join(","),
      ...rows.map((r) => columns.map((c) => cell(r[c])).join(",")),
    ].join("\r\n") + "\r\n"
  );
}
export async function writeCsv(file, columns, rows) {
  await mkdir(path.dirname(file), { recursive: true });
  const t = csv(columns, rows);
  await writeFile(file, t);
  return t;
}
export async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out.sort(cmp);
}
export const group = (rows, key) => {
  const m = new Map();
  for (const r of rows) {
    const k = typeof key === "function" ? key(r) : r[key];
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
};
export const index = (rows, key) => new Map(rows.map((r) => [r[key], r]));

// Each source field has a lossless column mapping. Junctions remain individual
// typed rows, including resource transactions and conditional effect payloads.
export const CONFIG = {
  technology_node_sets: [
    "node_set",
    "set",
    {
      key: "node_set_key",
      campaign_key: "set_campaign_key",
      faction_key: "set_faction_key",
      culture: "set_culture_key",
      subculture: "set_subculture_key",
    },
  ],
  technology_nodes: [
    "node",
    "node",
    {
      key: "node_key",
      technology_key: "technology_key",
      technology_node_set: "node_set_key",
      faction_key: "node_faction_key",
      campaign_key: "node_campaign_key",
      research_points_required: "research_points_required",
      cost_per_round: "cost_per_round",
      food_cost: "food_cost",
      resource_cost: "resource_cost_key",
      optional_ui_group: "ui_group_key",
      required_parents: "required_parents",
    },
  ],
  technologies: ["technology", "technology", { key: "technology_key" }],
  technology_node_links: [
    "dependency_link",
    "link",
    { parent_key: "parent_node_key", child_key: "child_node_key" },
  ],
  technology_required_technology_junctions: [
    "technology_prerequisite",
    "prerequisite",
    {
      technology: "technology_key",
      required_technology: "required_technology_key",
    },
  ],
  technology_effects_junction: [
    "effect",
    "effect_junction",
    {
      technology: "technology_key",
      effect: "effect_key",
      effect_scope: "effect_scope",
      value: "effect_value",
    },
  ],
  technology_script_lock_reasons: [
    "script_lock",
    "script_lock",
    { technology: "technology_key" },
  ],
  technology_required_building_levels_junctions: [
    "building_requirement",
    "building_requirement",
    {
      technology: "technology_key",
      required_building_level: "required_building_level_key",
    },
  ],
  technology_nodes_to_ancillaries_junctions: [
    "ancillary_unlock",
    "ancillary_unlock",
    { technology_node: "node_key", ancillary: "ancillary_key" },
  ],
  technology_character_traits_junctions: [
    "trait_unlock",
    "trait_unlock",
    {
      technology_node: "node_key",
      character_trait: "character_trait_level_key",
    },
  ],
  technology_initiative_effects: [
    "initiative_effect",
    "initiative",
    {
      technology: "technology_key",
      initiative: "initiative_key",
      additional_effect_list: "effect_list_key",
    },
  ],
  unit_upgrade_to_tech_requirements: [
    "unit_upgrade_unlock",
    "upgrade",
    { technology: "technology_key", unit_upgrade: "unit_upgrade_key" },
  ],
  mercenary_pool_to_groups_junctions: [
    "mercenary_unlock",
    "mercenary",
    {
      tech_requirement: "technology_key",
      faction_requirement: "unlock_faction_key",
      subculture_requirement: "unlock_subculture_key",
    },
  ],
  resource_costs: [
    "resource_cost",
    "resource_cost",
    { id: "resource_cost_key" },
  ],
  resource_cost_pooled_resource_junctions: [
    "pooled_resource_cost",
    "pooled_cost",
    { resource_cost: "resource_cost_key" },
  ],
  pooled_resource_factor_junctions: [
    "resource_factor",
    "resource_factor",
    {
      unique_id: "pooled_resource_factor_key",
      resource: "pooled_resource_key",
    },
  ],
  technology_ui_groups: ["ui_group", "group", { key: "ui_group_key" }],
  technology_ui_groups_to_technology_nodes_junctions: [
    "ui_group_bounds",
    "group_bounds",
    { tech_ui_group: "ui_group_key" },
  ],
  technology_ui_tabs: ["ui_tab", "tab", { key: "ui_tab_key" }],
  technology_ui_tabs_to_technology_nodes_junctions: [
    "tab_membership",
    "tab_membership",
    { node: "node_key", tab: "ui_tab_key" },
  ],
  technology_category_modules: [
    "category_module",
    "module",
    { technology_node_set: "node_set_key", effect_bundle: "effect_bundle_key" },
  ],
  campaign_effect_list_effect_junctions: [
    "conditional_effect",
    "conditional_effect",
    {
      effect: "effect_key",
      effect_list: "effect_list_key",
      scope: "effect_scope",
      value: "effect_value",
    },
  ],
  effect_bundles_to_effects_junctions: [
    "category_effect",
    "category_effect",
    {
      effect_bundle_key: "effect_bundle_key",
      effect_key: "effect_key",
      effect_scope: "effect_scope",
      value: "effect_value",
    },
  ],
};
export const mapped = (t, c) => CONFIG[t][2][c] ?? `${CONFIG[t][1]}_${c}`;
export const BASE = [
  "record_type",
  "game",
  "patch",
  "steam_build_id",
  "race",
  "race_slug",
  "faction_key",
  "faction_name",
  "culture_key",
  "subculture_key",
  "feature_forest_key",
  "variant_key",
  "variant_status",
  "applicability_basis",
  "campaign_key",
  "node_set_key",
  "set_faction_key",
  "set_culture_key",
  "set_subculture_key",
  "set_campaign_key",
  "node_key",
  "node_faction_key",
  "node_campaign_key",
  "technology_key",
  "technology_name",
  "technology_short_description",
  "technology_long_description",
  "effect_key",
  "effect_scope",
  "effect_value",
  "effect_description",
  "effect_additional_tooltip",
  "node_set_name",
  "node_set_tooltip",
  "ui_group_name",
  "ui_group_description",
  "ui_tab_name",
  "ui_tab_tooltip",
  "lock_reason",
  "ancillary_granted_text",
  "required_technology_key",
  "parent_node_key",
  "child_node_key",
  "link_type",
  "classification",
  "source_table",
  "source_path",
  "source_row_number",
  "source_key",
];

export async function loadSource(source) {
  const snapshot = await buildSnapshot(source);
  const { manifest, context, scope } = snapshot;
  const { SKILL_RACES } = scope;
  const schema = JSON.parse(
    await readFile(path.join(source, "decoded_schema.json"), "utf8"),
  );
  const tables = {},
    headers = {},
    defs = {};
  for (const f of manifest.files.filter((f) => f.path.startsWith("db/"))) {
    const t = f.path.split("/")[1].replace(/_tables$/, "");
    const txt = await readFile(path.join(source, f.path), "utf8");
    const { columns, rows } = parse(txt, "\t");
    const version = Number(txt.split("\n")[1].split(";")[1]);
    headers[t] = columns;
    defs[t] = schema[t + "_tables"]?.find((d) => d.version === version);
    if (!defs[t])
      throw new Error(`No decoded schema for ${t} version ${version}`);
    tables[t] ??= [];
    rows.forEach((r, i) =>
      tables[t].push({ ...r, _path: f.path, _row: String(i + 3) }),
    );
  }
  const loc = new Map();
  for (const f of manifest.files.filter((f) => f.path.startsWith("text/db/"))) {
    for (const r of parse(
      await readFile(path.join(source, f.path), "utf8"),
      "\t",
    ).rows) {
      if (loc.has(r.key) && loc.get(r.key) !== r.text)
        throw new Error(`Conflicting localization ${r.key}`);
      loc.set(r.key, r.text);
    }
  }
  const factions = index(tables.factions, "key"),
    cultures = index(tables.cultures_subcultures, "subculture"),
    races = index(SKILL_RACES, "subculture_key");
  const playable = [
    ...new Set(
      tables.frontend_faction_leaders
        .map((r) => r.faction)
        .filter((k) => k && k !== "wh3_prologue_kislev_expedition"),
    ),
  ]
    .sort(cmp)
    .map((k) => {
      const f = factions.get(k);
      if (!f || !races.has(f.subculture))
        throw new Error(`Unresolved faction/race ${k}`);
      return {
        faction: f,
        race: races.get(f.subculture),
        culture: cultures.get(f.subculture)?.culture,
      };
    });
  if (playable.length !== snapshot.factionCount)
    throw new Error(`Expected ${snapshot.factionCount} playable factions, got ${playable.length}`);
  const columns = [...new Set([...BASE, ...SCRIPT_COLUMNS])];
  for (const [t] of Object.entries(CONFIG))
    for (const c of headers[t] ?? [])
      if (!columns.includes(mapped(t, c))) columns.push(mapped(t, c));
  for (const c of headers.effects)
    if (c !== "effect") columns.push(`effect_definition_${c}`);
  const precedence = JSON.parse(
    await readFile(path.join(source, "node_set_precedence.json"), "utf8"),
  );
  const scriptEvidence = JSON.parse(
    await readFile(path.join(source, "script_evidence.json"), "utf8"),
  );
  // Older compact exports used a Beastmen-specific default for unrelated sites.
  // Reclassify descriptive metadata while preserving the hashed source evidence.
  for (const site of scriptEvidence.unmodeled_lock_sites)
    if (site.limitation.startsWith("Beastmen challenge"))
      site.limitation = fallbackLockLimitation(site.source_file);
  const mechanics = parse(
    await readFile(path.join(source, "script_mechanics.csv"), "utf8"),
  ).rows;
  return {
    source,
    context,
    snapshot,
    manifest,
    tables,
    headers,
    defs,
    loc,
    playable,
    columns,
    precedence,
    scriptEvidence,
    mechanics,
  };
}
export function provenance(s, t, r) {
  const fields = s.defs[t].fields
    .filter((f) => f.is_key && s.headers[t].includes(f.name))
    .map((f) => f.name);
  return {
    source_table: t + "_tables",
    source_path: r._path,
    source_row_number: r._row,
    source_key: fields.length
      ? fields.map((k) => r[k]).join("|")
      : hash(stable(Object.fromEntries(s.headers[t].map((k) => [k, r[k]])))),
  };
}
export function project(s, t, r) {
  return {
    ...Object.fromEntries(s.headers[t].map((c) => [mapped(t, c), r[c]])),
    ...provenance(s, t, r),
  };
}
export function members(s, p, set) {
  return s.tables.technology_nodes.filter(
    (n) =>
      n.technology_node_set === set.key &&
      (!n.faction_key || n.faction_key === p.faction.key) &&
      (!n.campaign_key ||
        !set.campaign_key ||
        n.campaign_key === set.campaign_key),
  );
}
export function structuralHash(rows) {
  // Stable source keys, node conditions, costs, layout, dependencies and payloads
  // define structure; file ownership/localization/provenance do not.
  const excluded = new Set([
    "mechanic_id",
    "source_file",
    "source_start_line",
    "source_end_line",
    "source_sha256",
    "evidence_id",
    "behavior_evidence_id",
    ...BASE.filter(
      (k) =>
        ![
          "record_type",
          "node_set_key",
          "node_key",
          "node_faction_key",
          "node_campaign_key",
          "technology_key",
          "effect_key",
          "effect_scope",
          "effect_value",
          "required_technology_key",
          "parent_node_key",
          "child_node_key",
          "link_type",
          "classification",
        ].includes(k),
    ),
  ]);
  const selected = rows.filter(
    (r) =>
      !["faction", "script_reference", "feature_evidence"].includes(
        r.record_type,
      ),
  );
  return hash(
    stable(
      selected
        .map((r) =>
          Object.fromEntries(
            Object.entries(r).filter(([k, v]) => !excluded.has(k) && v !== ""),
          ),
        )
        .sort((a, b) => cmp(stable(a), stable(b))),
    ),
  );
}
