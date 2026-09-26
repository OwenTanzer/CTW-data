import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash, parse, csv, cmp } from "./technology-lib.mjs";
import { overridesFor, SCRIPT_COLUMNS } from "./technology-rules.mjs";

// Parse only literal Lua tables. Never evaluate or run the game's Lua code.
// Unknown expressions fail extraction rather than becoming an inferred value.
function tokens(text) {
  const out = [];
  let i = 0,
    line = 1;
  while (i < text.length) {
    let c = text[i];
    if (/\s/.test(c)) {
      if (c === "\n") line++;
      i++;
      continue;
    }
    if (text.startsWith("--", i)) {
      const end = text.indexOf("\n", i);
      i = end < 0 ? text.length : end;
      continue;
    }
    const start = i,
      ln = line;
    if (c === '"' || c === "'") {
      const quote = c;
      i++;
      let value = "";
      while (i < text.length && text[i] !== quote) {
        if (text[i] === "\\") {
          i++;
          value += text[i++];
        } else {
          if (text[i] === "\n") line++;
          value += text[i++];
        }
      }
      if (text[i++] !== quote) throw new Error("Unclosed Lua string");
      out.push({
        kind: "string",
        value,
        start,
        end: i,
        line: ln,
        endLine: line,
      });
      continue;
    }
    const m = text.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*|^-?\d+(?:\.\d+)?/);
    if (m) {
      i += m[0].length;
      out.push({
        kind: /^-?\d/.test(m[0]) ? "number" : "id",
        value: m[0],
        start,
        end: i,
        line: ln,
        endLine: line,
      });
      continue;
    }
    out.push({ kind: c, value: c, start, end: ++i, line: ln, endLine: line });
  }
  return out;
}
function literalTable(text, name) {
  const ts = tokens(text);
  let at = ts.findIndex(
    (t, i) =>
      t.value === name && ts[i + 1]?.value === "=" && ts[i + 2]?.value === "{",
  );
  if (at < 0) throw new Error("Missing Lua table " + name);
  at += 2;
  const take = (v) => {
    const t = ts[at++];
    if (t?.value !== v)
      throw new Error(`Expected ${v} in ${name} at ${t?.line}`);
    return t;
  };
  function value() {
    const t = ts[at];
    if (t.value === "{") return table();
    at++;
    if (t.kind === "string") return t.value;
    if (t.kind === "number") return Number(t.value);
    if (["true", "false"].includes(t.value)) return t.value === "true";
    throw new Error(`Nonliteral expression ${t.value} in ${name}:${t.line}`);
  }
  function table() {
    const start = take("{");
    const entries = [];
    while (ts[at]?.value !== "}") {
      const first = ts[at];
      let key;
      if (ts[at].value === "[") {
        at++;
        key = value();
        take("]");
        take("=");
      } else if (ts[at + 1]?.value === "=") {
        key = ts[at++].value;
        at++;
      } else key = entries.length + 1;
      const v = value();
      entries.push({
        key,
        value: v,
        startLine: first.line,
        endLine: ts[at - 1].endLine,
      });
      if ([",", ";"].includes(ts[at]?.value)) at++;
      else if (ts[at]?.value !== "}")
        throw new Error("Unsupported Lua table syntax " + name);
    }
    const end = take("}");
    return { entries, startLine: start.line, endLine: end.endLine };
  }
  return table();
}
const fields = (table) =>
  Object.fromEntries(table.entries.map((e) => [e.key, e.value]));

export async function compactScripts(output, scratch, scan, patch = "8.1.1") {
  const excerpts = [],
    mechanics = [],
    cache = new Map();
  async function get(file) {
    if (!cache.has(file)) {
      const buffer = await readFile(path.join(scratch, file));
      cache.set(file, {
        text: buffer.toString("utf8"),
        sha256: hash(buffer),
        lines: buffer.toString("utf8").split(/\r?\n/),
      });
    }
    return cache.get(file);
  }
  async function excerpt(file, start, end, role) {
    const src = await get(file);
    if (start < 1 || end < start || end - start > 79 || end >= src.lines.length)
      throw new Error(`Unbounded excerpt: ${file}:${start}-${end}`);
    const text = src.lines.slice(start - 1, end).join("\n");
    const id = hash(file + ":" + start + ":" + end).slice(0, 24);
    if (!excerpts.some((e) => e.evidence_id === id))
      excerpts.push({
        evidence_id: id,
        source_file: file,
        source_sha256: src.sha256,
        source_start_line: start,
        source_end_line: end,
        role,
        excerpt_sha256: hash(text),
        text,
      });
    return id;
  }
  async function anchored(file, startText, endText, role) {
    const src = await get(file);
    const start = src.lines.findIndex((l) => l.includes(startText));
    const end = src.lines.findIndex(
      (l, i) => i >= start && l.includes(endText),
    );
    if (start < 0 || end < 0)
      throw new Error("Missing behavior anchors " + startText);
    return excerpt(file, start + 1, end + 1, role);
  }
  async function add(file, e, record, behavior) {
    const src = await get(file);
    const id = await excerpt(
      file,
      e.startLine,
      e.endLine,
      "literal_mechanic_definition",
    );
    mechanics.push({
      mechanic_id: hash(
        file +
          ":" +
          e.startLine +
          ":" +
          record.mechanic_type +
          ":" +
          record.target_key,
      ).slice(0, 24),
      ...record,
      source_file: file,
      source_start_line: String(e.startLine),
      source_end_line: String(e.endLine),
      source_sha256: src.sha256,
      evidence_id: id,
      behavior_evidence_id: behavior,
    });
  }
  const general = "script/campaign/wh3_campaign_tech_tree.lua",
    g = await get(general);
  const battleBehavior = await anchored(
    general,
    "function scripted_technology_tree:check_conditions_tech_battle_victories",
    "function scripted_technology_tree:resolve_diplomatic_event",
    "battle_counter_and_threshold",
  );
  const regionBehavior = await anchored(
    general,
    "function scripted_technology_tree:toggle_technology",
    "-- SAVING / LOADING",
    "region_toggle_actual_predicate",
  );
  const ancillaryBehavior = await anchored(
    general,
    '"tech_researched_ancillary_provided"',
    '"region_changed_technology_unlock"',
    "research_reward_listener",
  );
  await anchored(
    general,
    "function scripted_technology_tree:start_technology_listeners",
    "self:toggle_technology(self.norsca_techs_battle_wins)",
    "initialization_order_region_then_battle",
  );
  await anchored(
    general,
    '"khorne_battle_victory_technology_unlock"',
    '"norsca_battle_victory_technology_unlock"',
    "khorne_winner_counter",
  );
  await anchored(
    general,
    '"norsca_battle_victory_technology_unlock"',
    "function scripted_technology_tree:check_conditions_tech_battle_victories",
    "norsca_last_opponent_assignment",
  );
  for (const name of ["khorne_techs_battle_wins", "norsca_techs_battle_wins"])
    for (const e of literalTable(g.text, name).entries) {
      const d = fields(e.value);
      await add(
        general,
        e,
        {
          mechanic_type:
            name === "khorne_techs_battle_wins"
              ? "khorne_battle_wins"
              : "norsca_target_culture_wins",
          technology_key: e.key,
          scope_kind: "culture",
          scope_culture_key: d.culture,
          campaign_scope: "all_supported_campaigns",
          operation: "unlock_technology",
          trigger: "BattleCompleted",
          target_type: d.target_culture ? "culture" : "battle_wins",
          target_key: d.target_culture ?? "",
          threshold: String(d.value),
          comparison: "greater_than_or_equal",
          value: "1",
          human_only: "false",
          initially_locked: "true",
          counter_policy: d.target_culture
            ? "one_increment_per_winner_last_eligible_loser_culture_in_cache"
            : "one_increment_per_distinct_winning_faction",
          relock_policy: "none_from_battle_counter",
          combination_rule: "shared_lock_last_write_wins",
          interpretation_status: d.target_culture
            ? "decoded_last_opponent_assignment"
            : "decoded_literal_and_control_flow",
        },
        battleBehavior,
      );
    }
  for (const region of literalTable(g.text, "region_mapping").entries)
    for (const e of region.value.entries) {
      const d = fields(e.value);
      await add(
        general,
        { startLine: region.startLine, endLine: e.endLine },
        {
          mechanic_type: "norsca_region_gate",
          technology_key: e.key,
          scope_kind: "culture",
          scope_culture_key: d.culture,
          campaign_scope: "campaign_containing_target_region",
          operation: "toggle_technology_lock",
          trigger: "RegionFactionChangeEvent",
          target_type: "region",
          target_key: region.key,
          threshold: "1",
          comparison: "region_owned_by_faction",
          allow_allies: String(d.allow_allies),
          human_only: "false",
          initially_locked: "true",
          relock_policy: d.allow_allies
            ? "source_alliance_predicate"
            : "only_when_region_owner_absent",
          combination_rule:
            "shared_lock_last_write_wins_region_initialization_before_battle_initialization",
          interpretation_status:
            "decoded_predicate_not_permanent_ownership_requirement",
        },
        regionBehavior,
      );
    }
  for (const e of literalTable(g.text, "ancillary_mapping").entries) {
    const d = fields(e.value);
    for (const a of d.ancillaries.entries)
      await add(
        general,
        e,
        {
          mechanic_type: "technology_ancillary_reward",
          technology_key: e.key,
          scope_kind: "technology_ownership",
          campaign_scope: "all_supported_campaigns",
          operation: "add_ancillary_to_faction",
          trigger: "ResearchCompleted",
          target_type: "ancillary",
          target_key: a.value,
          value: String(d.count),
          reward_type: "ancillary",
          human_only: "false",
          interpretation_status: "decoded_literal_and_control_flow",
        },
        ancillaryBehavior,
      );
  }
  const coast = "script/campaign/wh2_dlc11_tech_tree.lua",
    c = await get(coast);
  const coastBehavior = await anchored(
    coast,
    "if faction:is_human()",
    "cm:spawn_character_to_pool",
    "human_culture_filtered_lord_reward",
  );
  const culture = c.text.match(/faction:culture\(\) == "([^"]+)"/)?.[1];
  if (!culture) throw new Error("Missing Vampire Coast culture restriction");
  for (const e of literalTable(c.text, "vampire_coast_lord_techs").entries) {
    const d = fields(e.value);
    await add(
      coast,
      e,
      {
        mechanic_type: "vampire_coast_lord_reward",
        technology_key: e.key,
        scope_kind: "culture",
        scope_culture_key: culture,
        campaign_scope: "all_supported_campaigns",
        operation: "spawn_character_to_pool",
        trigger: "ResearchCompleted",
        target_type: "agent_subtype",
        target_key: d.subtype,
        value: "1",
        reward_type: "recruitable_lord",
        human_only: "true",
        interpretation_status: "decoded_literal_and_control_flow",
      },
      coastBehavior,
    );
  }
  const changeling = "script/campaign/wh3_dlc24_the_changeling.lua",
    ch = await get(changeling);
  const campaigns = parse(
    await readFile(path.join(output, "db/campaigns_tables/data__.tsv"), "utf8"),
    "\t",
  ).rows;
  const variants = [];
  for (const e of literalTable(ch.text, "rift_regions").entries) {
    const campaign = campaigns.find(
      (c) => c.script_path === "script/campaign/" + e.key,
    );
    if (!campaign) throw new Error("Unresolved script campaign alias " + e.key);
    variants.push({
      faction_key: ch.text.match(/faction_key = "([^"]+)"/)[1],
      node_set_key: "tze_the_changeling",
      campaign_key: campaign.campaign_name,
      script_campaign_key: e.key,
      evidence_id: await excerpt(
        changeling,
        e.startLine,
        e.endLine,
        "campaign_rift_map",
      ),
      source_file: changeling,
      source_sha256: ch.sha256,
      db_source_file: "db/campaigns_tables/data__.tsv",
      db_source_sha256: hash(
        await readFile(path.join(output, "db/campaigns_tables/data__.tsv")),
      ),
    });
  }
  await anchored(
    changeling,
    "self.campaign_name = cm:get_campaign_name()",
    "cm:lock_technology(self.faction_key, tech_key)",
    "campaign_runtime_map_selection",
  );
  const noTree =
    "script/campaign/_narrative/wh3_narrative_shared_faction_data.lua";
  const noTreeEvidence = await anchored(
    noTree,
    'if faction_key == "wh3_main_dae_daemon_prince"',
    "daemon prince has no technology",
    "no_research_tree",
  );
  // Keep other lock APIs as bounded unresolved sites, not a copied Lua corpus.
  const unresolved = [];
  for (const info of scan.filter(
    (f) =>
      f.contains_technology &&
      !f.path.startsWith("script/_lib/") &&
      !/prologue|_narrative|help_pages|advice|intervention|scripted_tour/.test(
        f.path,
      ),
  )) {
    const src = await get(info.path);
    for (let i = 0; i < src.lines.length; i++) {
      const line = src.lines[i];
      if (line.trim().startsWith("--")) continue;
      const op = line.match(/cm:((?:lock|unlock)_technology)\(/)?.[1];
      if (!op || info.path === general) continue;
      const evidence = await excerpt(
        info.path,
        Math.max(
          1,
          i -
            (info.path === changeling || info.path.includes("mother_ostankya")
              ? 28
              : 2),
        ),
        Math.min(src.lines.length - 1, i + 4),
        "unmodeled_lock_site",
      );
      unresolved.push({
        source_file: info.path,
        source_sha256: src.sha256,
        source_line: i + 1,
        operation: op,
        evidence_id: evidence,
        limitation:
          info.path === changeling
            ? "Rift lock release depends on the saved unlock flag and either the initial Empire minor-2 mission or at least two Rift Gems; campaign selection is modeled but progress triggers are not."
            : info.path.includes("mother_ostankya")
              ? "Hex unlock progression is not normalized; DB lock reasons and exact lock API site are retained."
              : "Beastmen challenge predicates/counters are not normalized; DB lock reasons and exact lock API site are retained.",
      });
    }
  }
  const setFile = "db/technology_node_sets_tables/data__.tsv",
    setBuffer = await readFile(path.join(output, setFile));
  const sets = parse(setBuffer.toString("utf8"), "\t").rows;
  const overrides = overridesFor(patch).map((r) => {
    const a = sets.find((s) => s.key === r.selected_node_set_key),
      b = sets.find((s) => s.key === r.overridden_node_set_key);
    if (
      !a ||
      a.faction_key !== r.faction_key ||
      !b ||
      b.faction_key ||
      a.culture !== b.culture
    )
      throw new Error("Precedence evidence mismatch " + r.faction_key);
    return {
      ...r,
      source_file: setFile,
      source_sha256: hash(setBuffer),
      selected_source_row: sets.indexOf(a) + 3,
      overridden_source_row: sets.indexOf(b) + 3,
      selected_selectors: a,
      overridden_selectors: b,
    };
  });
  excerpts.sort(
    (a, b) =>
      cmp(a.source_file, b.source_file) ||
      a.source_start_line - b.source_start_line,
  );
  mechanics.sort(
    (a, b) =>
      cmp(a.mechanic_type, b.mechanic_type) ||
      cmp(a.technology_key, b.technology_key) ||
      cmp(a.target_key, b.target_key),
  );
  const evidence = {
    schema_version: 2,
    whole_lua_files_retained: 0,
    excerpts,
    unmodeled_lock_sites: unresolved,
    no_research_tree_evidence_id: noTreeEvidence,
  };
  await writeFile(
    path.join(output, "script_evidence.json"),
    JSON.stringify(evidence, null, 2) + "\n",
  );
  await writeFile(
    path.join(output, "script_mechanics.csv"),
    csv(SCRIPT_COLUMNS, mechanics),
  );
  await writeFile(
    path.join(output, "node_set_precedence.json"),
    JSON.stringify(
      {
        schema_version: 2,
        policy:
          `Only the ${overrides.length} explicitly reviewed faction selectors replace their matching generic fallback; unreviewed overlaps fail the build.`,
        provenance_limit:
          "The binary engine selector is not implemented in Lua. Each explicit override carries its interpretation status and corroborating evidence. Source-reviewed 9.0 mappings are not claims of observed runtime gameplay.",
        overrides,
        campaign_variants: variants,
      },
      null,
      2,
    ) + "\n",
  );
  return {
    mechanic_records: mechanics.length,
    excerpt_count: excerpts.length,
    unmodeled_lock_sites: unresolved.length,
  };
}
