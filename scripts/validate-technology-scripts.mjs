import { readFile } from "node:fs/promises";
import path from "node:path";
import { hash, group, stable, walk } from "./technology-lib.mjs";
import { SCRIPT_COLUMNS } from "./technology-rules.mjs";

// Independent gameplay contracts: do not call the extractor's Lua parser or
// the builder's selection implementation here.
export const GAMEPLAY_TREES = {
  wh2_dlc13_lzd_spirits_of_the_jungle: ["lzd_nakai", 44],
  wh3_dlc20_chs_azazel: ["chs_mil_azazel", 33],
  wh3_dlc20_chs_festus: ["chs_mil_festus", 33],
  wh3_dlc20_chs_valkia: ["chs_mil_valkia", 33],
  wh3_dlc20_chs_vilitch: ["chs_mil_vilitch", 33],
  wh3_main_chs_shadow_legion: ["chs_mil_belakor", 47],
};
export const CHANGELING = "wh3_dlc24_tze_the_deceivers";
export const CHANGELING_CAMPAIGNS = { wh3_main_chaos: 51, wh3_main_combi: 57 };

export function selectorTrees(patch) {
  return patch === "9.0" ? { ...GAMEPLAY_TREES,
    wh3_dlc20_chs_sigvald: ["chs_mil_sigvald", 33],
    wh3_dlc29_chs_host_of_the_triplets: ["chs_mil_glottkin", 33] } : GAMEPLAY_TREES;
}

export function gameplayTrees(faction, rows, check, patch = "8.1.1") {
  const sets = rows.filter((r) => r.record_type === "node_set");
  check(
    !(
      sets.some((r) => r.set_faction_key) &&
      sets.some((r) => !r.set_faction_key)
    ),
    `Override combination: ${faction}`,
  );
  const expected = selectorTrees(patch)[faction];
  if (expected)
    check(
      sets.length === 1 &&
        sets[0].node_set_key === expected[0] &&
        rows.filter((r) => r.record_type === "node").length === expected[1],
      `Gameplay override total/set: ${faction} must have ${expected[1]} nodes in ${expected[0]}`,
    );
  if (faction === CHANGELING) {
    check(
      sets.length === 2 &&
        sets.every((r) => r.node_set_key === "tze_the_changeling") &&
        stable(sets.map((r) => r.campaign_key).sort()) ===
          stable(Object.keys(CHANGELING_CAMPAIGNS).sort()),
      "Changeling requires exactly two legitimate campaign variants, no generic or blank campaign",
    );
    check(
      !rows.some((r) => r.variant_key && !r.campaign_key),
      "Blank Changeling campaign variant",
    );
    for (const [campaign, count] of Object.entries(CHANGELING_CAMPAIGNS))
      check(
        rows.filter(
          (r) => r.record_type === "node" && r.campaign_key === campaign,
        ).length === count,
        `Changeling gameplay count ${campaign}: ${count}`,
      );
  }
}

export function scriptRows(s, p, vr, check) {
  const keys = new Set(
    vr.filter((r) => r.record_type === "node").map((r) => r.technology_key),
  );
  const expected = s.mechanics.filter(
    (r) =>
      keys.has(r.technology_key) &&
      (!r.scope_faction_key || r.scope_faction_key === p.faction.key) &&
      (!r.scope_culture_key || r.scope_culture_key === p.culture),
  );
  const actual = vr.filter((r) =>
    ["scripted_requirement", "scripted_reward"].includes(r.record_type),
  );
  const project = (r) =>
    Object.fromEntries(SCRIPT_COLUMNS.map((k) => [k, r[k] ?? ""]));
  check(
    stable(
      actual
        .map(project)
        .sort((a, b) => a.mechanic_id.localeCompare(b.mechanic_id)),
    ) ===
      stable(
        expected
          .map(project)
          .sort((a, b) => a.mechanic_id.localeCompare(b.mechanic_id)),
      ),
    `Structured mechanic completeness/fidelity: ${p.faction.key}/${vr[0]?.variant_key}`,
  );
  for (const r of actual)
    check(
      r.record_type ===
        (r.reward_type ? "scripted_reward" : "scripted_requirement"),
      `Structured mechanic record type ${r.mechanic_id}`,
    );
}

export async function validateScriptSource(s, source, output, check) {
  check(
    s.precedence.schema_version === 2 && s.precedence.overrides.length === (s.context.patch === "9.0" ? 9 : 7),
    "Snapshot-specific explicit precedence rules",
  );
  check(
    s.precedence.campaign_variants.length === 2,
    "Two source-backed campaign variants",
  );
  check(
    !(await walk(output)).some((f) => f.endsWith(".lua")) &&
      !(await walk(source)).some((f) => f.endsWith(".lua")),
    "Whole Lua source files must not be installed",
  );
  const discovery = JSON.parse(
    await readFile(path.join(source, "discovery.json"), "utf8"),
  );
  const files = new Map(discovery.scripts.map((r) => [r.path, r]));
  const excerpts = new Map(
    s.scriptEvidence.excerpts.map((r) => [r.evidence_id, r]),
  );
  check(
    excerpts.size === s.scriptEvidence.excerpts.length &&
      s.scriptEvidence.whole_lua_files_retained === 0,
    "Compact evidence IDs and no whole Lua",
  );
  for (const e of excerpts.values()) {
    const f = files.get(e.source_file),
      n = e.source_end_line - e.source_start_line + 1;
    check(
      f &&
        f.sha256 === e.source_sha256 &&
        e.source_start_line >= 1 &&
        n > 0 &&
        n <= 80 &&
        n < f.line_count &&
        e.text.split("\n").length === n &&
        hash(e.text) === e.excerpt_sha256,
      `Bounded hashed script evidence: ${e.evidence_id}`,
    );
  }
  const expectedCounts = {
    khorne_battle_wins: 30,
    norsca_target_culture_wins: 23,
    norsca_region_gate: 21,
    technology_ancillary_reward: 18,
    vampire_coast_lord_reward: 4,
  };
  check(
    stable(
      Object.fromEntries(
        [...group(s.mechanics, "mechanic_type")].map(([k, v]) => [k, v.length]),
      ),
    ) === stable(expectedCounts),
    "Required structured scripted mechanic source counts",
  );
  check(
    new Set(s.mechanics.map((r) => r.mechanic_id)).size === 96,
    "96 unique structured mechanic definitions",
  );
  check(
    s.mechanics.filter(
      (r) =>
        r.mechanic_type === "technology_ancillary_reward" &&
        r.technology_key.startsWith("wh2_dlc11_tech_cst_"),
    ).length === 9,
    "Nine Vampire Coast ancillary reward definitions",
  );
  for (const r of s.mechanics) {
    const e = excerpts.get(r.evidence_id),
      b = excerpts.get(r.behavior_evidence_id),
      text = e?.text ?? "";
    const hasLiteral = (value) =>
      new RegExp("(?:^|[\\s{,])" + value + "\\s*=").test(text) ||
      text.includes('"' + value + '"') ||
      text.includes("'" + value + "'");
    check(
      e &&
        b &&
        e.source_file === r.source_file &&
        e.source_sha256 === r.source_sha256 &&
        Number(r.source_start_line) === e.source_start_line &&
        Number(r.source_end_line) === e.source_end_line &&
        b.source_file === r.source_file,
      `Structured mechanic evidence: ${r.mechanic_id}`,
    );
    check(
      hasLiteral(r.technology_key) &&
        (!r.target_key || hasLiteral(r.target_key)) &&
        (!r.scope_culture_key ||
          hasLiteral(r.scope_culture_key) ||
          b?.text.includes('"' + r.scope_culture_key + '"')),
      `Structured mechanic literal keys: ${r.mechanic_id}`,
    );
    check(
      s.tables.technologies.some((t) => t.key === r.technology_key),
      `Script technology FK ${r.technology_key}`,
    );
    if (r.target_type === "ancillary")
      check(
        s.tables.ancillaries.some((t) => t.key === r.target_key),
        `Script ancillary FK ${r.target_key}`,
      );
    if (r.target_type === "agent_subtype")
      check(
        s.tables.agent_subtypes.some((t) => t.key === r.target_key),
        `Script lord subtype FK ${r.target_key}`,
      );
    if (r.target_type === "culture")
      check(
        s.tables.cultures.some((t) => t.key === r.target_key),
        `Script target culture FK ${r.target_key}`,
      );
    if (r.mechanic_type.endsWith("_wins")) {
      check(
        r.threshold === text.match(/\bvalue\s*=\s*(\d+)/)?.[1] &&
          r.comparison === "greater_than_or_equal" &&
          r.value === "1" &&
          r.operation === "unlock_technology" &&
          r.trigger === "BattleCompleted" &&
          r.human_only === "false" &&
          r.initially_locked === "true" &&
          b?.text.includes("wins >= value"),
        `Structured mechanic battle threshold/operation: ${r.mechanic_id}`,
      );
      check(
        r.counter_policy ===
          (r.mechanic_type === "khorne_battle_wins"
            ? "one_increment_per_distinct_winning_faction"
            : "one_increment_per_winner_last_eligible_loser_culture_in_cache"),
        `Structured mechanic counter policy ${r.mechanic_id}`,
      );
    } else if (r.mechanic_type === "norsca_region_gate")
      check(
        r.allow_allies === text.match(/allow_allies\s*=\s*(true|false)/)?.[1] &&
          r.operation === "toggle_technology_lock" &&
          r.target_type === "region" &&
          r.relock_policy === "only_when_region_owner_absent" &&
          r.campaign_scope === "campaign_containing_target_region",
        `Structured mechanic region policy ${r.mechanic_id}`,
      );
    else if (r.mechanic_type === "technology_ancillary_reward")
      check(
        r.value === text.match(/count\s*=\s*(\d+)/)?.[1] &&
          r.operation === "add_ancillary_to_faction" &&
          r.reward_type === "ancillary" &&
          r.human_only === "false" &&
          r.scope_kind === "technology_ownership" &&
          b?.text.includes("cm:add_ancillary_to_faction"),
        `Structured mechanic ancillary reward ${r.mechanic_id}`,
      );
    else if (r.mechanic_type === "vampire_coast_lord_reward")
      check(
        r.operation === "spawn_character_to_pool" &&
          r.reward_type === "recruitable_lord" &&
          r.value === "1" &&
          r.human_only === "true" &&
          r.scope_culture_key === "wh2_dlc11_cst_vampire_coast" &&
          b?.text.includes("faction:is_human()"),
        `Structured mechanic lord reward ${r.mechanic_id}`,
      );
  }
  for (const threshold of ["5", "10", "15", "20", "25"])
    check(
      s.mechanics.filter(
        (r) =>
          r.mechanic_type === "khorne_battle_wins" && r.threshold === threshold,
      ).length === 6,
      `Khorne six thresholds at ${threshold}`,
    );
  for (const site of s.scriptEvidence.unmodeled_lock_sites)
    check(
      excerpts.has(site.evidence_id) &&
        site.limitation &&
        files.get(site.source_file)?.sha256 === site.source_sha256,
      `Unmodeled lock site evidence ${site.source_file}:${site.source_line}`,
    );
  for (const rule of s.precedence.overrides) {
    const a = s.tables.technology_node_sets.find(
        (t) => t.key === rule.selected_node_set_key,
      ),
      b = s.tables.technology_node_sets.find(
        (t) => t.key === rule.overridden_node_set_key,
      );
    check(
      a?.faction_key === rule.faction_key &&
        b?.faction_key === "" &&
        a?.culture === b?.culture &&
        hash(await readFile(path.join(source, rule.source_file))) ===
          rule.source_sha256,
      `Precedence DB evidence ${rule.faction_key}`,
    );
    const projection = (row) =>
      Object.fromEntries(
        Object.entries(row ?? {}).filter(([k]) => !k.startsWith("_")),
      );
    check(
      stable(projection(a)) === stable(rule.selected_selectors) &&
        stable(projection(b)) === stable(rule.overridden_selectors) &&
        Number(a?._row) === rule.selected_source_row &&
        Number(b?._row) === rule.overridden_source_row &&
        rule.rule === "faction_specific_replaces_generic",
      `Precedence selector/row fidelity ${rule.faction_key}`,
    );
  }
  for (const v of s.precedence.campaign_variants) {
    const campaign = s.tables.campaigns.find(
        (c) => c.campaign_name === v.campaign_key,
      ),
      evidence = excerpts.get(v.evidence_id);
    check(
      v.faction_key === CHANGELING &&
        v.node_set_key === "tze_the_changeling" &&
        Object.hasOwn(CHANGELING_CAMPAIGNS, v.campaign_key) &&
        campaign?.script_path === "script/campaign/" + v.script_campaign_key &&
        evidence?.source_file === v.source_file &&
        evidence?.source_sha256 === v.source_sha256 &&
        evidence?.text.includes(v.script_campaign_key) &&
        hash(await readFile(path.join(source, v.db_source_file))) ===
          v.db_source_sha256,
      `Campaign alias DB/script evidence ${v.campaign_key}`,
    );
  }
}
