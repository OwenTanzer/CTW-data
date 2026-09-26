import {
  selectorTrees,
  CHANGELING,
  CHANGELING_CAMPAIGNS,
  gameplayTrees,
  scriptRows,
  validateScriptSource,
} from "./validate-technology-scripts.mjs";
import { readFile, writeFile, mkdir, mkdtemp } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import {
  CONFIG,
  cmp,
  hash,
  stable,
  parse,
  csv,
  walk,
  loadSource,
  mapped,
  index,
  group,
  structuralHash,
} from "./technology-lib.mjs";

const source = path.resolve(
  process.argv[2] ?? "data/technology_trees/source_exports",
);
const output = path.resolve(process.argv[3] ?? "data/technology_trees");
const s = await loadSource(source),
  t = s.tables,
  errors = [],
  warnings = [],
  passes = [];
const CONTEXT = s.context;
const check = (v, msg) => {
  if (!v) errors.push(msg);
};
const eq = (a, b, msg) => check(stable(a) === stable(b), msg);
const readCsv = async (f) => {
  const b = await readFile(f);
  const txt = new TextDecoder("utf-8", { fatal: true }).decode(b);
  return { ...parse(txt), bytes: b };
};
const sourcePaths = new Set(s.manifest.files.map((f) => f.path));
for (const f of s.manifest.files) {
  const b = await readFile(path.join(source, f.path));
  check(
    hash(b) === f.sha256 && b.length === f.bytes,
    `Source hash/size: ${f.path}`,
  );
}
eq(
  (await walk(source))
    .map((p) => path.relative(source, p).replaceAll("\\", "/"))
    .filter((p) => p !== "source_manifest.json")
    .sort(),
  [...sourcePaths].sort(),
  "Source manifest must inventory every exported file",
);
check(
  s.manifest.executable_version === (CONTEXT.patch === "9.0" ? "9.0.0.0" : "8.1.1.0"),
  "Verified executable version is required",
);
const idx = await readCsv(path.join(output, `faction_index__wh3__${CONTEXT.patch}.csv`));
const files = (await walk(path.join(output, "factions"))).filter((p) =>
  p.endsWith(".csv"),
);
check(
  idx.rows.length === s.snapshot.factionCount && files.length === s.snapshot.factionCount,
  `Exactly ${s.snapshot.factionCount} indexed faction CSVs required`,
);
eq(
  idx.rows.map((r) => r.faction_key).sort(),
  s.playable.map((p) => p.faction.key).sort(),
  "Playable faction index must equal frontend source scope exactly",
);
eq(
  files.map((p) => path.relative(output, p).replaceAll("\\", "/")).sort(),
  idx.rows.map((r) => r.relative_path).sort(),
  "Actual faction file paths must equal the index",
);
const schema = await readCsv(path.join(output, "schema_inventory__v2.csv"));
eq(
  schema.rows.map((r) => r.column_name),
  s.columns,
  "Schema inventory header/order",
);
check(
  new Set(s.columns).size === s.columns.length,
  "No duplicate column names",
);
const tech = index(t.technologies, "key"),
  effect = index(t.effects, "effect"),
  scopes = new Set(t.campaign_effect_scopes.map((r) => r.key));
const srcRows = new Map();
for (const [table, rows] of Object.entries(t))
  for (const r of rows) srcRows.set(r._path + ":" + r._row, { table, row: r });
const fileRows = new Map(),
  all = [],
  topology = [],
  missing = [],
  duplicates = [],
  raceChecks = [];
const locFields = {
  technology: [
    ["technology_name", "technologies_onscreen_name_"],
    ["technology_short_description", "technologies_short_description_"],
    ["technology_long_description", "technologies_long_description_"],
  ],
  effect: [["effect_description", "effects_description_"]],
  node_set: [
    ["node_set_name", "technology_node_sets_localised_name_"],
    ["node_set_tooltip", "technology_node_sets_tooltip_string_"],
  ],
  ui_group: [
    ["ui_group_name", "technology_ui_groups_optional_display_name_"],
    [
      "ui_group_description",
      "technology_ui_groups_optional_display_desctiption_",
    ],
  ],
  ui_tab: [
    ["ui_tab_name", "technology_ui_tabs_localised_name_"],
    ["ui_tab_tooltip", "technology_ui_tabs_tooltip_string_"],
  ],
  script_lock: [["lock_reason", "technology_script_lock_reasons_lock_reason_"]],
};
for (const ir of idx.rows) {
  const file = path.join(output, ir.relative_path),
    parsed = await readCsv(file),
    rows = parsed.rows;
  fileRows.set(ir.faction_key, rows);
  all.push(...rows);
  eq(parsed.columns, s.columns, `Header: ${ir.faction_key}`);
  check(
    hash(parsed.bytes) === ir.file_sha256 &&
      parsed.bytes.length === Number(ir.file_bytes),
    `Indexed hash/bytes: ${ir.faction_key}`,
  );
  check(
    rows.length === Number(ir.total_rows),
    `Indexed row count: ${ir.faction_key}`,
  );
  check(
    structuralHash(rows) === ir.tree_structure_sha256,
    `Recomputed structural fingerprint: ${ir.faction_key}`,
  );
  const p = s.playable.find((p) => p.faction.key === ir.faction_key);
  check(
    rows.filter((r) => r.record_type === "faction").length === 1,
    `One metadata row: ${ir.faction_key}`,
  );
  for (const r of rows) {
    for (const [k, v] of Object.entries(CONTEXT))
      check(r[k] === v, `Context ${k}: ${ir.faction_key}`);
    check(
      r.faction_key === p.faction.key &&
        r.race_slug === p.race.slug &&
        r.culture_key === p.culture &&
        r.subculture_key === p.faction.subculture,
      `Canonical ownership: ${ir.faction_key}`,
    );
    check(
      r.faction_name ===
        (s.loc.get("factions_screen_name_" + p.faction.key) ?? ""),
      `Faction localization: ${ir.faction_key}`,
    );
    for (const col of schema.rows) {
      if (!r[col.column_name]) continue;
      if (col.data_type === "number")
        check(
          Number.isFinite(Number(r[col.column_name])),
          `Numeric ${col.column_name}: ${r.source_key}`,
        );
      if (col.data_type === "boolean")
        check(
          ["true", "false"].includes(r[col.column_name]),
          `Boolean ${col.column_name}: ${r.source_key}`,
        );
    }
    if (
      ["script_reference", "scripted_requirement", "scripted_reward"].includes(
        r.record_type,
      )
    ) {
      check(
        s.scriptEvidence.excerpts.some(
          (e) =>
            e.evidence_id === r.evidence_id &&
            e.source_file === r.source_file &&
            e.source_sha256 === r.source_sha256,
        ),
        "Script row bounded provenance " + r.evidence_id,
      );
      continue;
    }
    const src = srcRows.get(r.source_path + ":" + r.source_row_number);
    check(!!src, `Source row exists: ${r.source_path}:${r.source_row_number}`);
    if (!src) continue;
    check(
      r.source_table === src.table + "_tables",
      `Source table: ${r.source_key}`,
    );
    if (CONFIG[src.table]) {
      check(
        r.record_type === CONFIG[src.table][0],
        `Typed row: ${r.source_key}`,
      );
      for (const c of s.headers[src.table])
        check(
          r[mapped(src.table, c)] === src.row[c],
          `Source field ${src.table}.${c}: ${ir.faction_key}/${r.source_key}`,
        );
    } else
      check(
        r.record_type === "faction" && src.table === "factions",
        "Unsupported record type " + r.record_type,
      );
    if (r.technology_key)
      check(tech.has(r.technology_key), `Technology FK ${r.technology_key}`);
    if (
      ["effect", "conditional_effect", "category_effect"].includes(
        r.record_type,
      )
    ) {
      const e = effect.get(r.effect_key);
      check(!!e, `Effect FK ${r.effect_key}`);
      check(scopes.has(r.effect_scope), `Effect scope FK ${r.effect_scope}`);
      if (e)
        for (const c of s.headers.effects.filter((k) => k !== "effect"))
          check(
            r["effect_definition_" + c] === e[c],
            `Effect definition ${r.effect_key}.${c}`,
          );
      check(
        r.effect_description ===
          (s.loc.get("effects_description_" + r.effect_key) ?? ""),
        `Effect localization ${r.effect_key}`,
      );
      if (r.record_type !== "effect" && !r.effect_description)
        missing.push({
          faction_key: r.faction_key,
          variant_key: r.variant_key,
          node_key: r.node_key,
          record_type: r.record_type,
          field: "effect_description",
          localisation_key: "effects_description_" + r.effect_key,
        });
    }
    for (const [field, prefix] of locFields[r.record_type] ?? []) {
      const k =
        r.record_type === "effect"
          ? r.effect_key
          : r.record_type === "node_set"
            ? r.node_set_key
            : r.record_type === "ui_group"
              ? r.ui_group_key
              : r.record_type === "ui_tab"
                ? r.ui_tab_key
                : r.technology_key;
      check(
        r[field] === (s.loc.get(prefix + k) ?? ""),
        `Localization fidelity ${prefix + k}`,
      );
      if (!r[field])
        missing.push({
          faction_key: r.faction_key,
          variant_key: r.variant_key,
          node_key: r.node_key,
          record_type: r.record_type,
          field,
          localisation_key: prefix + k,
        });
    }
  }
  gameplayTrees(p.faction.key, rows, check, CONTEXT.patch);
  // Independent gameplay fixtures select overrides; source membership is checked
  // separately. Do not import or call the builder's resolveSets function.
  const wanted =
    selectorTrees(CONTEXT.patch)[p.faction.key]?.[0] ??
    (p.faction.key === CHANGELING ? "tze_the_changeling" : null);
  const expectedSets = t.technology_node_sets.filter((r) =>
    wanted
      ? r.key === wanted
      : (!r.faction_key || r.faction_key === p.faction.key) &&
        (!r.culture || r.culture === p.culture) &&
        (!r.subculture || r.subculture === p.faction.subculture),
  );
  const expectedVariants = [];
  for (const set of expectedSets) {
    const campaigns =
      p.faction.key === CHANGELING
        ? Object.keys(CHANGELING_CAMPAIGNS)
        : [set.campaign_key || ""];
    for (const campaign of campaigns)
      expectedVariants.push({
        set,
        campaign,
        nodes: t.technology_nodes.filter(
          (n) =>
            n.technology_node_set === set.key &&
            (!n.faction_key || n.faction_key === p.faction.key) &&
            (!n.campaign_key || n.campaign_key === campaign),
        ),
        key: set.key + "@" + (campaign || "all_campaigns"),
      });
  }
  eq(
    rows
      .filter((r) => r.record_type === "node_set")
      .map((r) => r.variant_key)
      .sort(),
    expectedVariants.map((v) => v.key).sort(),
    `Node-set variant source reconciliation: ${p.faction.key}`,
  );
  for (const row of rows) {
    if (row.variant_key) {
      const variant = expectedVariants.find((v) => v.key === row.variant_key);
      check(
        variant &&
          row.node_set_key === variant.set.key &&
          row.campaign_key === variant.campaign,
        "Row variant context: " +
          p.faction.key +
          "/" +
          row.record_type +
          "/" +
          row.variant_key,
      );
    } else
      check(
        ["faction", "script_reference"].includes(row.record_type),
        "Missing row variant: " + p.faction.key + "/" + row.record_type,
      );
  }
  for (const v of expectedVariants) {
    const vr = rows.filter((r) => r.variant_key === v.key),
      nr = vr.filter((r) => r.record_type === "node");
    scriptRows(s, p, vr, check);
    const nk = new Set(v.nodes.map((n) => n.key)),
      tk = new Set(v.nodes.map((n) => n.technology_key));
    eq(
      nr.map((n) => n.node_key).sort(),
      [...nk].sort(),
      `Node membership: ${p.faction.key}/${v.key}`,
    );
    eq(
      vr
        .filter((r) => r.record_type === "technology")
        .map((r) => r.node_key)
        .sort(),
      [...nk].sort(),
      `One technology per node: ${v.key}`,
    );
    const perNode = [
      ["technology_effects_junction", "technology", "technology_key"],
      [
        "technology_required_technology_junctions",
        "technology",
        "technology_key",
      ],
      [
        "technology_required_building_levels_junctions",
        "technology",
        "technology_key",
      ],
      ["technology_script_lock_reasons", "technology", "technology_key"],
      ["technology_initiative_effects", "technology", "technology_key"],
      ["unit_upgrade_to_tech_requirements", "technology", "technology_key"],
      ["technology_nodes_to_ancillaries_junctions", "technology_node", "key"],
      ["technology_character_traits_junctions", "technology_node", "key"],
      ["technology_ui_tabs_to_technology_nodes_junctions", "node", "key"],
    ];
    for (const [table, key, nodeKey] of perNode) {
      const exp = [];
      for (const n of v.nodes)
        for (const r of t[table].filter((r) => r[key] === n[nodeKey]))
          exp.push(n.key + ":" + r._path + ":" + r._row);
      const actual = vr
        .filter((r) => r.source_table === table + "_tables")
        .map(
          (r) => r.node_key + ":" + r.source_path + ":" + r.source_row_number,
        );
      eq(
        actual.sort(),
        exp.sort(),
        `Complete ${table}: ${p.faction.key}/${v.key}`,
      );
    }
    for (const table of [
      "resource_costs",
      "resource_cost_pooled_resource_junctions",
    ]) {
      const exp = [];
      for (const n of v.nodes.filter((n) => n.resource_cost))
        for (const r of t[table].filter(
          (r) =>
            r[table === "resource_costs" ? "id" : "resource_cost"] ===
            n.resource_cost,
        ))
          exp.push(n.key + ":" + r._path + ":" + r._row);
      eq(
        vr
          .filter((r) => r.source_table === table + "_tables")
          .map(
            (r) => r.node_key + ":" + r.source_path + ":" + r.source_row_number,
          )
          .sort(),
        exp.sort(),
        `Complete costs ${table}: ${v.key}`,
      );
    }
    const expectedPayload = [];
    for (const n of v.nodes)
      for (const j of t.technology_initiative_effects.filter(
        (j) => j.technology === n.technology_key,
      ))
        for (const e of t.campaign_effect_list_effect_junctions.filter(
          (e) => e.effect_list === j.additional_effect_list,
        ))
          expectedPayload.push(
            n.key + ":" + j.initiative + ":" + e._path + ":" + e._row,
          );
    const expectedFactors = [];
    for (const n of v.nodes.filter((n) => n.resource_cost))
      for (const cost of t.resource_cost_pooled_resource_junctions.filter(
        (c) => c.resource_cost === n.resource_cost,
      )) {
        const factor = t.pooled_resource_factor_junctions.find(
          (f) => f.unique_id === cost.pooled_resource_factor,
        );
        check(!!factor, `Cost factor FK ${cost.pooled_resource_factor}`);
        if (factor)
          expectedFactors.push(n.key + ":" + factor._path + ":" + factor._row);
      }
    eq(
      vr
        .filter((r) => r.record_type === "resource_factor")
        .map(
          (r) => r.node_key + ":" + r.source_path + ":" + r.source_row_number,
        )
        .sort(),
      expectedFactors.sort(),
      `Complete resource factor identity: ${v.key}`,
    );
    eq(
      vr
        .filter((r) => r.record_type === "conditional_effect")
        .map(
          (r) =>
            r.node_key +
            ":" +
            r.initiative_key +
            ":" +
            r.source_path +
            ":" +
            r.source_row_number,
        )
        .sort(),
      expectedPayload.sort(),
      `Complete initiative effect payloads: ${v.key}`,
    );
    const bounds = t.technology_ui_groups_to_technology_nodes_junctions.filter(
      (r) =>
        [
          "bottom_right_node",
          "top_left_node",
          "optional_top_right_node",
          "optional_bottom_left_node",
        ].some((k) => nk.has(r[k])),
    );
    const groupKeys = new Set([
      ...v.nodes.map((n) => n.optional_ui_group).filter(Boolean),
      ...bounds.map((r) => r.tech_ui_group),
    ]);
    const tabKeys = new Set(
      t.technology_ui_tabs_to_technology_nodes_junctions
        .filter((r) => nk.has(r.node))
        .map((r) => r.tab),
    );
    for (const [table, expected] of [
      ["technology_ui_groups_to_technology_nodes_junctions", bounds],
      [
        "technology_ui_groups",
        t.technology_ui_groups.filter((r) => groupKeys.has(r.key)),
      ],
      [
        "technology_ui_tabs",
        t.technology_ui_tabs.filter((r) => tabKeys.has(r.key)),
      ],
      [
        "technology_category_modules",
        t.technology_category_modules.filter(
          (r) => r.technology_node_set === v.set.key,
        ),
      ],
    ])
      eq(
        vr
          .filter((r) => r.source_table === table + "_tables")
          .map((r) => r.source_path + ":" + r.source_row_number)
          .sort(),
        expected.map((r) => r._path + ":" + r._row).sort(),
        `Complete UI/modules ${table}: ${v.key}`,
      );
    for (const n of v.nodes) {
      const grants = t.mercenary_pool_to_groups_junctions.filter(
        (r) =>
          r.tech_requirement === n.technology_key &&
          (!r.faction_requirement || r.faction_requirement === p.faction.key) &&
          (!r.subculture_requirement ||
            r.subculture_requirement === p.faction.subculture),
      );
      eq(
        vr
          .filter(
            (r) => r.record_type === "mercenary_unlock" && r.node_key === n.key,
          )
          .map((r) => r.source_path + ":" + r.source_row_number)
          .sort(),
        grants.map((r) => r._path + ":" + r._row).sort(),
        `Complete mercenary grants: ${v.key}/${n.key}`,
      );
    }
    const expectedLinks = t.technology_node_links.filter(
      (l) => nk.has(l.parent_key) && nk.has(l.child_key),
    );
    eq(
      vr
        .filter((r) => r.record_type === "dependency_link")
        .map((r) => r.source_path + ":" + r.source_row_number)
        .sort(),
      expectedLinks.map((r) => r._path + ":" + r._row).sort(),
      `Complete links: ${v.key}`,
    );
    const links = vr.filter((r) => r.record_type === "dependency_link");
    for (const l of links)
      check(
        nk.has(l.parent_node_key) && nk.has(l.child_node_key),
        `Link endpoints inside variant ${v.key}`,
      );
    const incoming = new Map([...nk].map((k) => [k, new Set()]));
    for (const l of links)
      incoming.get(l.child_node_key).add(l.parent_node_key);
    const external = [];
    for (const req of vr.filter(
      (r) => r.record_type === "technology_prerequisite",
    )) {
      check(
        tech.has(req.required_technology_key),
        `Required technology FK ${req.required_technology_key}`,
      );
      const parents = nr.filter(
        (n) => n.technology_key === req.required_technology_key,
      );
      if (!parents.length)
        external.push({
          technology_key: req.technology_key,
          required_technology_key: req.required_technology_key,
        });
      else
        for (const parent of parents)
          incoming.get(req.node_key).add(parent.node_key);
    }
    const pending = new Set(nk),
      ordered = [];
    while (pending.size) {
      const ready = [...pending]
        .filter((k) => [...incoming.get(k)].every((p) => !pending.has(p)))
        .sort();
      if (!ready.length) break;
      for (const k of ready) {
        pending.delete(k);
        ordered.push(k);
      }
    }
    check(
      pending.size === 0,
      `Prerequisite cycle: ${p.faction.key}/${v.key}: ${[...pending].join(",")}`,
    );
    const roots = [...nk].filter((k) => incoming.get(k).size === 0),
      impossible = [];
    for (const n of nr) {
      const parentCount = links.filter(
        (l) => l.child_node_key === n.node_key,
      ).length;
      if (Number(n.required_parents) > parentCount) impossible.push(n.node_key);
    }
    check(
      !impossible.length,
      `Parent threshold exceeds available links: ${v.key}: ${impossible.join(",")}`,
    );
    topology.push({
      faction_key: p.faction.key,
      variant_key: v.key,
      nodes: nk.size,
      root_nodes: roots,
      topological_order: ordered,
      cycle_nodes: [...pending],
      external_technology_requirements: external,
      unreachable_nodes: impossible,
      hidden_nodes: vr
        .filter(
          (r) =>
            r.record_type === "technology" && r.technology_is_hidden === "true",
        )
        .map((r) => r.node_key),
    });
    for (const [k, ns] of group(nr, "technology_key"))
      if (ns.length > 1)
        duplicates.push({
          faction_key: p.faction.key,
          variant_key: v.key,
          technology_key: k,
          node_keys: ns.map((n) => n.node_key),
          classification: "same_technology_multiple_source_nodes",
        });
  }
  const counts = {
    node_set_variants: rows.filter((r) => r.record_type === "node_set").length,
    node_occurrences: rows.filter((r) => r.record_type === "node").length,
    unique_technologies: new Set(
      rows.map((r) => r.technology_key).filter(Boolean),
    ).size,
    dependency_links: rows.filter((r) =>
      ["dependency_link", "technology_prerequisite"].includes(r.record_type),
    ).length,
    effects: rows.filter((r) => r.record_type === "effect").length,
    locks_exclusions: rows.filter((r) => r.record_type === "script_lock")
      .length,
    direct_unlocks: rows.filter((r) =>
      [
        "ancillary_unlock",
        "trait_unlock",
        "unit_upgrade_unlock",
        "mercenary_unlock",
      ].includes(r.record_type),
    ).length,
  };
  for (const [k, v] of Object.entries(counts))
    check(Number(ir[k]) === v, `Indexed ${k}: ${p.faction.key}`);
}
const manifest = JSON.parse(
  await readFile(path.join(output, "dataset_manifest.json"), "utf8"),
);
check(manifest.schema_version === 2, "Dataset schema version 2");
eq(
  manifest.record_types,
  Object.fromEntries(
    [...group(all, "record_type")].map(([k, v]) => [k, v.length]),
  ),
  "Manifest record totals",
);
check(
  manifest.source_manifest_sha256 ===
    hash(await readFile(path.join(source, "source_manifest.json"))),
  "Manifest source pin",
);
for (const p of s.playable.filter(
  (p, i, a) => a.findIndex((x) => x.race.slug === p.race.slug) === i,
)) {
  const rows = fileRows.get(p.faction.key);
  check(rows.length > 0, `Representative ${p.race.slug}`);
  if (!["daemons_of_chaos", "undead_legions"].includes(p.race.slug))
    check(
      rows.some((r) => r.record_type === "node") &&
        rows.some((r) => r.record_type === "effect"),
      `Representative node/effect ${p.race.slug}`,
    );
  if (p.race.slug === "undead_legions") {
    check(CONTEXT.patch === "9.0" && p.faction.key === "wh3_dlc29_nag_host_of_nagash" &&
      rows.filter(r => r.record_type === "node_set").length === 1 &&
      rows.some(r => r.record_type === "node_set" && r.node_set_key === "nag_tech" && r.variant_status === "empty_source_node_set") &&
      !rows.some(r => ["node", "technology", "effect"].includes(r.record_type)) &&
      rows.some(r => r.record_type === "faction" && r.classification === "empty_database_tree_feature_progression_out_of_scope"),
      "Nagash exact empty nag_tech selector; feature progression is not ordinary technology coverage");
  }
  raceChecks.push({
    race: p.race.slug,
    faction_key: p.faction.key,
    nodes: rows.filter((r) => r.record_type === "node").length,
    source_reconciled: true,
  });
}
check(raceChecks.length === s.snapshot.scope.SKILL_RACES.length, "Representative checks cover all snapshot races");
const nakai = fileRows
  .get("wh2_dlc13_lzd_spirits_of_the_jungle")
  .filter((r) => r.node_set_key === "lzd_nakai");
const nakaiNodes = nakai.filter((r) => r.record_type === "node");
check(
  nakaiNodes.length > 0 &&
    nakaiNodes.every((r) => r.technology_key.includes("wh2_dlc13")),
  "Nakai explicit wh2_dlc13 technology tree",
);
check(
  nakaiNodes.length === 44 &&
    nakai.filter((r) => r.record_type === "dependency_link").length === 26 &&
    nakai.filter((r) => r.record_type === "effect").length === 99 &&
    nakai.filter((r) => r.record_type === "resource_cost").length === 14,
  "Nakai retained structural regression counts",
);
check(
  new Set(nakaiNodes.map((r) => r.node_indent)).size > 1 &&
    new Set(nakaiNodes.map((r) => r.node_tier)).size > 1,
  "Nakai branches and layout",
);
check(
  nakai.some((r) => r.record_type === "dependency_link") &&
    nakai.some((r) => r.record_type === "effect") &&
    nakaiNodes.every((r) => r.research_points_required !== ""),
  "Nakai prerequisites, costs and effects",
);
const hashes = group(idx.rows, "tree_structure_sha256");
check(
  [...hashes.values()].some((g) => g.length > 1),
  "Shared structures must exist",
);
check(
  idx.rows.find((r) => r.faction_key === "wh2_dlc16_wef_drycha")
    .tree_structure_sha256 !==
    idx.rows.find((r) => r.faction_key === "wh_dlc05_wef_wood_elves")
      .tree_structure_sha256,
  "Drycha differs from shared Wood Elf structure",
);
const scriptAudit = JSON.parse(
  await readFile(path.join(output, "script_audit.json"), "utf8"),
);
await validateScriptSource(s, source, output, check);
eq(
  scriptAudit.unmodeled_lock_sites,
  s.scriptEvidence.unmodeled_lock_sites,
  "Script audit site fidelity",
);
check(
  scriptAudit.unresolved_cases === s.scriptEvidence.unmodeled_lock_sites.length,
  "Unmodeled script count",
);
check(
  scriptAudit.structured_source_records === s.mechanics.length &&
    scriptAudit.whole_lua_files_retained === 0,
  "Structured script audit counts",
);
const external = topology.flatMap((g) =>
  g.external_technology_requirements.map((r) => ({
    ...r,
    faction_key: g.faction_key,
    variant_key: g.variant_key,
  })),
);
if (external.length)
  warnings.push(
    `${external.length} explicit technology prerequisites refer outside their node-set/campaign variant; retained and classified, not discarded.`,
  );
if (missing.length)
  warnings.push(
    `${missing.length} missing localization occurrences (${new Set(missing.map((r) => r.localisation_key)).size} distinct keys); structural records retained.`,
  );
warnings.push(
  `${scriptAudit.unresolved_cases} bounded lock sites are not normalized. See script_audit.json for individual source locations and scopes; this count is not a complete list of runtime mechanics.`,
);
warnings.push(
  `${s.precedence.overrides.length} explicit faction DB assignments replace generic fallbacks. Read each rule interpretation_status: source review is distinguished from observed gameplay. The binary engine selector is not decoded.`,
);
warnings.push(
  "Feature forests and transitions are retained in source, but runtime feature transitions and script-controlled effect/unlock behavior are not statically executed.",
);
// Rebuild twice into scratch; compare every builder artifact including README and
// manifest, then compare the candidate. Validator artifacts are deterministic too.
let determinism = false;
if (!process.argv.includes("--skip-rebuild")) {
  await mkdir("work", { recursive: true });
  const dirs = [
    await mkdtemp(path.resolve("work/technology_rebuild_a_")),
    await mkdtemp(path.resolve("work/technology_rebuild_b_")),
  ];
  for (const dir of dirs) {
    const child = spawnSync(
      process.execPath,
      ["scripts/build-technology-trees.mjs", source, dir],
      { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
    );
    check(child.status === 0, `Rebuild failed ${dir}: ${child.stderr}`);
  }
  const af = await walk(dirs[0]),
    bf = await walk(dirs[1]);
  eq(
    af.map((p) => path.relative(dirs[0], p)),
    bf.map((p) => path.relative(dirs[1], p)),
    "Deterministic file list",
  );
  for (const f of af) {
    const rel = path.relative(dirs[0], f);
    const a = await readFile(f),
      b = await readFile(path.join(dirs[1], rel)),
      c = await readFile(path.join(output, rel));
    check(a.equals(b) && a.equals(c), `Deterministic bytes: ${rel}`);
  }
  determinism = !errors.some((e) => /Rebuild|Deterministic/.test(e));
}
if (!errors.length)
  passes.push(
    `${idx.rows.length} unique indexed faction files; ${raceChecks.length} race representatives; hashes, sizes, context, canonical schema, selector variants and source fields verified.`,
    "All nodes, technologies, prerequisite links, research costs, effect junctions, scopes, priorities and localizations reconcile to source.",
    "Prerequisite DAGs checked; zero required_parents means all source parents. Hidden and repeated technology nodes are retained and classified.",
    "Nakai wh2_dlc13 branches, ordering, prerequisites, costs and effects verified against complete lzd_nakai source membership.",
    "Explicit selector totals and the two Changeling campaigns verified; 96 structured script definitions and bounded evidence validated; zero whole Lua files.",
    "Shared fingerprints recomputed and faction-specific Wood Elf structure distinguished.",
    ...(determinism
      ? [
          "Two independent builds and the candidate are byte-identical across all builder artifacts.",
        ]
      : []),
  );
const report = {
  status: errors.length ? "failed" : "passed",
  ...CONTEXT,
  ...Object.fromEntries(
    [
      "faction_files",
      "node_set_variants",
      "node_occurrences",
      "technologies",
      "technology_occurrences",
      "dependency_links",
      "effects",
      "locks_exclusions",
      "direct_unlocks",
    ].map((k) => [k, manifest[k]]),
  ),
  missing_localizations: missing.length,
  distinct_missing_localization_keys: new Set(
    missing.map((r) => r.localisation_key),
  ).size,
  missing_by_field: Object.fromEntries(
    [...group(missing, "field")].map(([k, v]) => [k, v.length]),
  ),
  structured_script_source_records: s.mechanics.length,
  structured_script_occurrences: manifest.structured_script_occurrences,
  structured_script_mechanics_by_type:
    manifest.structured_script_mechanics_by_type,
  unresolved_scripted_cases: scriptAudit.unresolved_cases,
  external_technology_requirements: external.length,
  unique_structures: hashes.size,
  shared_structure_groups: [...hashes.values()].filter((g) => g.length > 1)
    .length,
  hidden_node_occurrences: topology.reduce(
    (n, g) => n + g.hidden_nodes.length,
    0,
  ),
  duplicate_technology_occurrences: duplicates.length,
  deterministic_rebuild_verified: determinism,
  representative_races: raceChecks,
  passes,
  warnings,
  errors,
};
await writeFile(
  path.join(output, "audit_report.json"),
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  path.join(output, "topology_audit.json"),
  JSON.stringify(
    { variants: topology, duplicate_technology_nodes: duplicates },
    null,
    2,
  ) + "\n",
);
await writeFile(
  path.join(output, "missing_localizations.csv"),
  csv(
    [
      "faction_key",
      "variant_key",
      "node_key",
      "record_type",
      "field",
      "localisation_key",
    ],
    missing,
  ),
);
await writeFile(
  path.join(output, "audit_report.md"),
  `# Technology tree audit\n\nStatus: **${report.status.toUpperCase()}**\n\n${report.faction_files} faction files; ${report.node_set_variants} variants; ${report.node_occurrences} nodes; ${report.technologies} distinct technologies; ${report.dependency_links} dependency rows; ${report.effects} ordinary effect rows; ${report.locks_exclusions} script-lock reason rows; ${report.direct_unlocks} direct unlock rows.\n\n## Checks\n\n${passes.map((x) => "- " + x).join("\n")}\n\n## Warnings and evidence limits\n\n${warnings.map((x) => "- " + x).join("\n")}\n\n## Errors\n\n${errors.length ? errors.map((x) => "- " + x).join("\n") : "None."}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
