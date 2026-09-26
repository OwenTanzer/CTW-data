import { resolveSets } from "./technology-rules.mjs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  CONFIG,
  cmp,
  hash,
  stable,
  writeCsv,
  loadSource,
  provenance,
  project,
  members,
  index,
  group,
  structuralHash,
  mapped,
} from "./technology-lib.mjs";

const source = path.resolve(
  process.argv[2] ?? "work/source_technology__wh3__8.1.1",
);
const output = path.resolve(
  process.argv[3] ?? "work/generated_technology__wh3__8.1.1",
);
const s = await loadSource(source),
  t = s.tables;
const CONTEXT = s.context;
await mkdir(output, { recursive: true });
const tech = index(t.technologies, "key"),
  effect = index(t.effects, "effect");
const loc = (k) => s.loc.get(k) ?? "";
const effectData = (r) => {
  const e = effect.get(r.effect_key);
  if (!e) throw new Error(`Unknown effect ${r.effect_key}`);
  return {
    ...Object.fromEntries(
      s.headers.effects
        .filter((k) => k !== "effect")
        .map((k) => ["effect_definition_" + k, e[k]]),
    ),
    effect_description: loc("effects_description_" + r.effect_key),
    effect_additional_tooltip: loc(
      "effects_additional_tooltip_details_localised_description_" +
        r.effect_key,
    ),
  };
};
const rowsByTech = {};
for (const [table, key] of [
  ["technology_effects_junction", "technology"],
  ["technology_required_technology_junctions", "technology"],
  ["technology_required_building_levels_junctions", "technology"],
  ["technology_script_lock_reasons", "technology"],
  ["technology_initiative_effects", "technology"],
  ["unit_upgrade_to_tech_requirements", "technology"],
  ["mercenary_pool_to_groups_junctions", "tech_requirement"],
])
  rowsByTech[table] = group(t[table], key);
const discovery = JSON.parse(
  await readFile(path.join(source, "discovery.json"), "utf8"),
);
const scriptByTech = group(s.mechanics, "technology_key");
const indexRows = [],
  allRows = [],
  classifications = [];
for (const p of s.playable) {
  const common = {
    ...CONTEXT,
    faction_key: p.faction.key,
    faction_name: loc("factions_screen_name_" + p.faction.key),
    race: p.race.name,
    race_slug: p.race.slug,
    culture_key: p.culture,
    subculture_key: p.faction.subculture,
    feature_forest_key: p.faction.feature_forest,
  };
  const sets = resolveSets(t, p, s.precedence).sort((a, b) =>
    cmp(a.key, b.key),
  );
  const rows = [
    {
      ...common,
      record_type: "faction",
      classification: sets.length ? "has_database_tree" : "no_database_tree",
      ...provenance(s, "factions", p.faction),
    },
  ];
  if (!sets.length) {
    if (p.faction.key !== "wh3_main_dae_daemon_prince")
      throw new Error("Unclassified missing tree");
    const evidence = s.scriptEvidence.excerpts.find(
      (e) => e.evidence_id === s.scriptEvidence.no_research_tree_evidence_id,
    );
    rows.push({
      ...common,
      record_type: "script_reference",
      classification: "no_research_tree",
      evidence_id: evidence.evidence_id,
      source_file: evidence.source_file,
      source_sha256: evidence.source_sha256,
      source_start_line: String(evidence.source_start_line),
      source_end_line: String(evidence.source_end_line),
      interpretation_status: "explicit_source_comment",
    });
  }
  for (const set of sets) {
    const candidateMembers = members(s, p, set);
    const explicit = s.precedence.campaign_variants.filter(
      (v) => v.faction_key === p.faction.key && v.node_set_key === set.key,
    );
    const variants = explicit.length
      ? explicit.map((v) => v.campaign_key).sort(cmp)
      : [set.campaign_key || ""];
    if (!explicit.length && candidateMembers.some((n) => n.campaign_key))
      throw new Error("Unmodeled campaign overlay " + set.key);
    for (const campaign of variants) {
      const ctx = {
        ...common,
        variant_key: set.key + "@" + (campaign || "all_campaigns"),
        campaign_key: campaign,
        node_set_key: set.key,
        set_faction_key: set.faction_key,
        set_culture_key: set.culture,
        set_subculture_key: set.subculture,
        set_campaign_key: set.campaign_key,
        variant_status: set.faction_key
          ? "active_faction_override"
          : "active_generic_tree",
        applicability_basis: set.faction_key
          ? "Explicit faction selector replaces the reviewed generic fallback; see source_exports/node_set_precedence.json."
          : "Matching source culture/subculture selector with no overriding faction assignment.",
        node_set_name: loc("technology_node_sets_localised_name_" + set.key),
        node_set_tooltip: loc("technology_node_sets_tooltip_string_" + set.key),
      };
      const add = (table, r, extra = {}) => {
        const row = {
          ...ctx,
          record_type: CONFIG[table][0],
          ...project(s, table, r),
          ...extra,
        };
        rows.push(row);
        return row;
      };
      add("technology_node_sets", set);
      const ns = candidateMembers
        .filter((n) => !n.campaign_key || n.campaign_key === campaign)
        .sort(
          (a, b) =>
            Number(a.tier) - Number(b.tier) ||
            Number(a.indent) - Number(b.indent) ||
            cmp(a.key, b.key),
        );
      const nodeKeys = new Set(ns.map((n) => n.key)),
        technologyKeys = new Set(ns.map((n) => n.technology_key));
      for (const n of ns) {
        const technology = tech.get(n.technology_key);
        if (!technology)
          throw new Error(`Unresolved technology ${n.technology_key}`);
        const nctx = {
          node_key: n.key,
          node_faction_key: n.faction_key,
          node_campaign_key: n.campaign_key,
          technology_key: n.technology_key,
          technology_name: loc(
            "technologies_onscreen_name_" + n.technology_key,
          ),
          technology_short_description: loc(
            "technologies_short_description_" + n.technology_key,
          ),
          technology_long_description: loc(
            "technologies_long_description_" + n.technology_key,
          ),
        };
        add("technology_nodes", n, {
          ...nctx,
          classification:
            technology.is_hidden === "true" ? "hidden" : "structural_node",
        });
        add("technologies", technology, nctx);
        for (const table of Object.keys(rowsByTech))
          for (const r of rowsByTech[table].get(n.technology_key) ?? []) {
            if (
              table === "mercenary_pool_to_groups_junctions" &&
              ((r.faction_requirement &&
                r.faction_requirement !== p.faction.key) ||
                (r.subculture_requirement &&
                  r.subculture_requirement !== p.faction.subculture))
            )
              continue;
            const row = add(table, r, nctx);
            if (table === "technology_effects_junction")
              Object.assign(row, effectData(row));
            if (table === "technology_script_lock_reasons")
              row.lock_reason = loc(
                "technology_script_lock_reasons_lock_reason_" +
                  n.technology_key,
              );
            if (table === "technology_required_technology_junctions") {
              row.link_type = "required_technology";
              row.classification = technologyKeys.has(r.required_technology)
                ? "endpoint_resolved"
                : "external_technology_requirement";
            }
            if (table === "technology_initiative_effects")
              for (const payload of t.campaign_effect_list_effect_junctions.filter(
                (x) => x.effect_list === r.additional_effect_list,
              )) {
                const er = add(
                  "campaign_effect_list_effect_junctions",
                  payload,
                  {
                    ...nctx,
                    initiative_key: r.initiative,
                    classification: "conditional_on_initiative",
                  },
                );
                Object.assign(er, effectData(er));
              }
          }
        for (const table of [
          "technology_nodes_to_ancillaries_junctions",
          "technology_character_traits_junctions",
        ])
          for (const r of t[table].filter((x) => x.technology_node === n.key)) {
            const row = add(table, r, nctx);
            if (table === "technology_nodes_to_ancillaries_junctions") {
              const def = s.defs[table];
              const keys = (
                def.localised_key_order?.length
                  ? def.localised_key_order.map((i) => def.fields[i]?.name)
                  : def.fields.filter((f) => f.is_key).map((f) => f.name)
              )
                .map((k) => r[k])
                .join("");
              row.ancillary_granted_text = loc(
                "technology_nodes_to_ancillaries_junctions_granted_text_" +
                  keys,
              );
            }
          }
        if (n.resource_cost) {
          const cost = t.resource_costs.find((x) => x.id === n.resource_cost);
          if (!cost)
            throw new Error(`Unknown resource cost ${n.resource_cost}`);
          add("resource_costs", cost, nctx);
          for (const r of t.resource_cost_pooled_resource_junctions.filter(
            (x) => x.resource_cost === n.resource_cost,
          )) {
            add("resource_cost_pooled_resource_junctions", r, nctx);
            const factor = t.pooled_resource_factor_junctions.find(
              (f) => f.unique_id === r.pooled_resource_factor,
            );
            if (!factor)
              throw new Error(
                "Unresolved pooled resource factor " + r.pooled_resource_factor,
              );
            add("pooled_resource_factor_junctions", factor, {
              ...nctx,
              resource_cost_key: n.resource_cost,
            });
          }
        }
        for (const r of t.technology_ui_tabs_to_technology_nodes_junctions.filter(
          (x) => x.node === n.key,
        ))
          add("technology_ui_tabs_to_technology_nodes_junctions", r, nctx);
      }
      for (const r of t.technology_node_links) {
        if (nodeKeys.has(r.parent_key) && nodeKeys.has(r.child_key))
          add("technology_node_links", r, {
            link_type: "node_parent",
            classification: "endpoint_resolved",
          });
        else if (nodeKeys.has(r.parent_key) || nodeKeys.has(r.child_key))
          classifications.push({
            faction_key: p.faction.key,
            variant_key: ctx.variant_key,
            record_type: "dependency_link",
            source_key: provenance(s, "technology_node_links", r).source_key,
            classification: "endpoint_excluded_by_faction_or_campaign",
            parent_node_key: r.parent_key,
            child_node_key: r.child_key,
          });
      }
      const bounds =
        t.technology_ui_groups_to_technology_nodes_junctions.filter((r) =>
          [
            "bottom_right_node",
            "top_left_node",
            "optional_top_right_node",
            "optional_bottom_left_node",
          ].some((k) => nodeKeys.has(r[k])),
        );
      const groups = new Set([
        ...ns.map((n) => n.optional_ui_group).filter(Boolean),
        ...bounds.map((r) => r.tech_ui_group),
      ]);
      for (const r of bounds)
        add("technology_ui_groups_to_technology_nodes_junctions", r);
      for (const k of [...groups].sort(cmp)) {
        const r = t.technology_ui_groups.find((r) => r.key === k);
        if (!r) throw new Error(`Unknown group ${k}`);
        add("technology_ui_groups", r, {
          ui_group_name: loc("technology_ui_groups_optional_display_name_" + k),
          ui_group_description: loc(
            "technology_ui_groups_optional_display_desctiption_" + k,
          ),
        });
      }
      const tabs = new Set(
        t.technology_ui_tabs_to_technology_nodes_junctions
          .filter((r) => nodeKeys.has(r.node))
          .map((r) => r.tab),
      );
      for (const k of [...tabs].sort(cmp)) {
        const r = t.technology_ui_tabs.find((r) => r.key === k);
        if (!r) throw new Error(`Unknown tab ${k}`);
        add("technology_ui_tabs", r, {
          ui_tab_name: loc("technology_ui_tabs_localised_name_" + k),
          ui_tab_tooltip: loc("technology_ui_tabs_tooltip_string_" + k),
        });
      }
      for (const r of t.technology_category_modules.filter(
        (r) => r.technology_node_set === set.key,
      )) {
        add("technology_category_modules", r);
        for (const e of t.effect_bundles_to_effects_junctions.filter(
          (x) => x.effect_bundle_key === r.effect_bundle,
        )) {
          const er = add("effect_bundles_to_effects_junctions", e, {
            classification: "conditional_on_category_module",
            module_min_tier: r.min_tier,
            module_max_tier: r.max_tier,
          });
          Object.assign(er, effectData(er));
        }
      }
      for (const k of [...technologyKeys].sort(cmp))
        for (const mechanic of scriptByTech.get(k) ?? []) {
          if (
            mechanic.scope_faction_key &&
            mechanic.scope_faction_key !== p.faction.key
          )
            continue;
          if (
            mechanic.scope_culture_key &&
            mechanic.scope_culture_key !== p.culture
          )
            continue;
          rows.push({
            ...ctx,
            ...mechanic,
            record_type: mechanic.reward_type
              ? "scripted_reward"
              : "scripted_requirement",
            classification: "structured_script_mechanic",
          });
        }
    }
  }
  const relative = `factions/${p.race.slug}/${p.faction.key}.csv`;
  const contents = await writeCsv(path.join(output, relative), s.columns, rows);
  const counts = Object.fromEntries(
    [...new Set(rows.map((r) => r.record_type))]
      .sort(cmp)
      .map((k) => [
        k + "_rows",
        rows.filter((r) => r.record_type === k).length,
      ]),
  );
  indexRows.push({
    ...common,
    relative_path: relative,
    node_set_variants: rows.filter((r) => r.record_type === "node_set").length,
    node_occurrences: rows.filter((r) => r.record_type === "node").length,
    unique_technologies: new Set(
      rows.map((r) => r.technology_key).filter(Boolean),
    ).size,
    dependency_links: rows.filter(
      (r) =>
        r.record_type === "dependency_link" ||
        r.record_type === "technology_prerequisite",
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
    total_rows: rows.length,
    tree_structure_sha256: structuralHash(rows),
    file_sha256: hash(contents),
    file_bytes: Buffer.byteLength(contents),
  });
  allRows.push(...rows);
}
await writeCsv(
  path.join(output, `faction_index__wh3__${CONTEXT.patch}.csv`),
  Object.keys(indexRows[0]),
  indexRows,
);
const descriptions = {
  mechanic_type:
    "Decoded scripted mechanic family; each target is a separate typed row.",
  threshold:
    "Source battle-win threshold or region ownership cardinality; blank is not zero.",
  value: "Source reward count or per-battle counter increment.",
  interpretation_status:
    "Explicit decoded behavior classification; see source evidence IDs.",
  campaign_scope:
    "Script scope independent of the database node-set campaign selector.",

  record_type: "Typed record discriminator; junctions are individual rows.",
  variant_key:
    "Active node set plus a supported campaign condition. all_campaigns means a common tree; no blank Changeling variant exists.",
  variant_status:
    "Active generic or faction-override tree; source_exports/node_set_precedence.json documents each replacement.",
  applicability_basis: "Explicit source selector rule and evidence limitation.",
  campaign_key:
    "Variant campaign condition; blank is unspecified, not all campaign-specific overlays combined.",
  required_parents:
    "Observed node parent threshold. Source schema: 0 implies all parents. This is not zero prerequisites.",
  link_type:
    "node_parent for technology_node_links (source has no link-type field); required_technology for explicit technology prerequisite junction.",
  technology_building_level:
    "Legacy technology registry field preserved verbatim. Do not interpret it as a required building; use building_requirement rows.",
  research_points_required:
    "Base source research points; not a fixed number of turns. Research rate and modifiers are outside this snapshot.",
  source_row_number:
    "One-based logical record number in exported TSV (header and RPFM metadata precede records).",
  source_key:
    "Canonical source primary key, or composite joined with |. Not a one-to-many list.",
  classification:
    "Structural/evidence classification; hidden nodes remain included.",
};
const schemaRows = s.columns.map((c, i) => {
  let def, origin;
  for (const table of Object.keys(CONFIG)) {
    const field = s.headers[table]?.find((f) => mapped(table, f) === c);
    if (field) {
      def = s.defs[table].fields.find((f) => f.name === field);
      origin = table + "_tables." + field;
      break;
    }
  }
  if (c.startsWith("effect_definition_")) {
    const k = c.slice(18);
    def = s.defs.effects.fields.find((f) => f.name === k);
    origin = "effects_tables." + k;
  }
  return {
    dataset: "factions/<race_slug>/<faction_key>.csv",
    column_position: i + 1,
    column_name: c,
    data_type: [
      "threshold",
      "value",
      "source_start_line",
      "source_end_line",
    ].includes(c)
      ? "number"
      : ["human_only", "allow_allies", "initially_locked"].includes(c)
        ? "boolean"
        : def?.field_type === "Boolean"
          ? "boolean"
          : /^(I\d|F\d)/.test(def?.field_type ?? "")
            ? "number"
            : "text",
    required: [
      "record_type",
      "game",
      "patch",
      "steam_build_id",
      "race",
      "race_slug",
      "faction_key",
      "culture_key",
      "subculture_key",
    ].includes(c),
    description:
      descriptions[c] ??
      (origin
        ? `Source ${origin}. ${def?.description ?? ""}`
        : c.replaceAll("_", " ")),
  };
});
await writeCsv(
  path.join(output, "schema_inventory__v2.csv"),
  Object.keys(schemaRows[0]),
  schemaRows,
);
const sum = (k) => indexRows.reduce((n, r) => n + Number(r[k]), 0);
const recordCounts = Object.fromEntries(
  [...group(allRows, "record_type")]
    .map(([k, v]) => [k, v.length])
    .sort((a, b) => cmp(a[0], b[0])),
);
const usedTech = new Set(
    allRows
      .filter((r) => r.record_type === "technology")
      .map((r) => r.technology_key),
  ),
  usedNodes = new Set(
    allRows.filter((r) => r.record_type === "node").map((r) => r.node_key),
  );
for (const n of t.technology_nodes)
  if (!usedNodes.has(n.key))
    classifications.push({
      record_type: "node",
      source_key: n.key,
      classification: "outside_playable_faction_selectors",
      technology_key: n.technology_key,
    });
for (const r of t.technologies)
  if (!usedTech.has(r.key))
    classifications.push({
      record_type: "technology",
      source_key: r.key,
      classification: scriptByTech.has(r.key)
        ? "script_referenced_outside_playable_trees"
        : t.technology_nodes.some((n) => n.technology_key === r.key)
          ? "outside_playable_trees"
          : "registry_without_node",
    });
const manifest = {
  ...CONTEXT,
  schema_version: 2,
  source_manifest_sha256: hash(
    await readFile(path.join(source, "source_manifest.json")),
  ),
  faction_files: s.playable.length,
  races: 24,
  node_set_variants: sum("node_set_variants"),
  unique_node_sets: new Set(
    allRows
      .filter((r) => r.record_type === "node_set")
      .map((r) => r.node_set_key),
  ).size,
  node_occurrences: sum("node_occurrences"),
  technologies: usedTech.size,
  technology_occurrences: recordCounts.technology ?? 0,
  dependency_links: sum("dependency_links"),
  effects: sum("effects"),
  locks_exclusions: sum("locks_exclusions"),
  direct_unlocks: sum("direct_unlocks"),
  conditional_initiative_effect_relations: recordCounts.initiative_effect ?? 0,
  record_types: recordCounts,
  unique_structures: new Set(indexRows.map((r) => r.tree_structure_sha256))
    .size,
  structured_script_source_records: s.mechanics.length,
  structured_script_occurrences:
    (recordCounts.scripted_requirement ?? 0) +
    (recordCounts.scripted_reward ?? 0),
  structured_script_mechanics_by_type: Object.fromEntries(
    [
      ...group(
        allRows.filter((r) => r.mechanic_id),
        "mechanic_type",
      ),
    ].map(([k, v]) => [k, v.length]),
  ),
  unresolved_scripted_cases: s.scriptEvidence.unmodeled_lock_sites.length,
  source_scope:
    "Active faction research trees after explicit, reviewed faction overrides and source-backed campaign selection; typed scripted requirements/rewards plus bounded evidence.",
  file_layout: "factions/<race_slug>/<faction_key>.csv",
};
await writeFile(
  path.join(output, "dataset_manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
await writeFile(
  path.join(output, "script_audit.json"),
  JSON.stringify(
    {
      scanned_files: discovery.scripts.length,
      whole_lua_files_retained: 0,
      scope: discovery.script_scope,
      structured_source_records: s.mechanics.length,
      structured_records_by_type: Object.fromEntries(
        [...group(s.mechanics, "mechanic_type")].map(([k, v]) => [k, v.length]),
      ),
      excerpt_count: s.scriptEvidence.excerpts.length,
      unresolved_cases: manifest.unresolved_scripted_cases,
      unmodeled_lock_sites: s.scriptEvidence.unmodeled_lock_sites,
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  path.join(output, "classification_inventory.json"),
  JSON.stringify(classifications, null, 2) + "\n",
);
const readme = await readFile(
  new URL("./technology-readme.md", import.meta.url),
  "utf8",
);
await writeFile(
  path.join(output, "README.md"),
  readme +
    "\n## Generated totals\n\n" +
    Object.entries(manifest)
      .filter(([k, v]) => typeof v === "number" && k !== "schema_version")
      .map(([k, v]) => "- " + k + ": " + v)
      .join("\n") +
    "\n",
);
console.log(JSON.stringify(manifest, null, 2));
