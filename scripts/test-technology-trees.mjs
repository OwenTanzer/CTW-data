import { fallbackLockLimitation } from "./technology-lock-limitations.mjs";
import { cp, readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { parse, csv, hash, structuralHash } from "./technology-lib.mjs";
const source = path.resolve(
  process.argv[2] ?? "data/technology_trees/source_exports",
);
const dataset = path.resolve(process.argv[3] ?? "data/technology_trees");
const audit = JSON.parse(await readFile(path.join(dataset, 'script_audit.json'), 'utf8'));
for (const site of audit.unmodeled_lock_sites) {
  if (!site.source_file.includes('beastmen')) assert.ok(!site.limitation.includes('Beastmen'), site.source_file);
}
assert.match(fallbackLockLimitation('script/campaign/wh2_dlc17_beastmen_tech.lua'), /Beastmen/);
assert.doesNotMatch(fallbackLockLimitation('script/campaign/future_technology.lua'), /Beastmen/);
await mkdir("work", { recursive: true });
const fixture = await mkdtemp(path.resolve("work/technology_mutations_"));
await cp(dataset, fixture, { recursive: true });
const sourcePatch = JSON.parse(await readFile(path.join(source, "source_manifest.json"), "utf8")).patch;
const indexPath = path.join(fixture, `faction_index__wh3__${sourcePatch}.csv`);
const originalIndex = await readFile(indexPath, "utf8");
const ix = parse(originalIndex);
const nakai = "wh2_dlc13_lzd_spirits_of_the_jungle",
  changeling = "wh3_dlc24_tze_the_deceivers",
  khorne = "wh3_dlc26_kho_arbaal";
const generic = parse(
  await readFile(
    path.join(
      dataset,
      ix.rows.find((r) => r.faction_key === "wh2_dlc12_lzd_cult_of_sotek")
        .relative_path,
    ),
    "utf8",
  ),
).rows;
const cases = [
  {
    name: "missing source node",
    faction: nakai,
    expected: "Node membership",
    mutate: (rows) =>
      rows.splice(
        rows.findIndex((r) => r.record_type === "node"),
        1,
      ),
  },
  {
    name: "changed effect value with refreshed hashes",
    faction: nakai,
    expected: "Source field technology_effects_junction.value",
    mutate: (rows) => {
      rows.find((r) => r.record_type === "effect").effect_value = "987654.0000";
    },
  },
  {
    name: "cyclic dependency",
    faction: nakai,
    expected: "Prerequisite cycle",
    mutate: (rows) => {
      const l = rows.find((r) => r.record_type === "dependency_link");
      l.parent_node_key = l.child_node_key;
    },
  },
  {
    name: "generic override combination with refreshed hashes and counts",
    faction: nakai,
    expected: "Override combination",
    mutate: (rows) => {
      const meta = rows[0];
      for (const r of generic.filter((r) => r.variant_key))
        rows.push({
          ...r,
          ...Object.fromEntries(
            [
              "faction_key",
              "faction_name",
              "race",
              "race_slug",
              "culture_key",
              "subculture_key",
              "feature_forest_key",
            ].map((k) => [k, meta[k]]),
          ),
        });
    },
  },
  {
    name: "synthetic blank Changeling campaign",
    faction: changeling,
    expected: "Blank Changeling campaign variant",
    mutate: (rows) => {
      for (const r of [...rows].filter(
        (r) => r.campaign_key === "wh3_main_chaos",
      ))
        rows.push({
          ...r,
          campaign_key: "",
          variant_key: "tze_the_changeling@all_campaigns",
        });
    },
  },
  {
    name: "required structured mechanic removed",
    faction: khorne,
    expected: "Structured mechanic completeness/fidelity",
    mutate: (rows) =>
      rows.splice(
        rows.findIndex((r) => r.mechanic_type === "khorne_battle_wins"),
        1,
      ),
  },
  {
    name: "structured battle threshold corrupted",
    faction: khorne,
    expected: "Structured mechanic completeness/fidelity",
    mutate: (rows) => {
      rows.find((r) => r.mechanic_type === "khorne_battle_wins").threshold =
        "999";
    },
  },
  {
    name: "whole Lua file installed",
    faction: nakai,
    expected: "Whole Lua source files",
    mutate: () => {},
    lua: true,
  },
];
for (const c of cases) {
  const ir = ix.rows.find((r) => r.faction_key === c.faction),
    file = path.join(fixture, ir.relative_path);
  const original = await readFile(file, "utf8"),
    parsed = parse(original);
  c.mutate(parsed.rows);
  const text = csv(parsed.columns, parsed.rows);
  await writeFile(file, text);
  const current = parse(originalIndex),
    r = current.rows.find((r) => r.faction_key === c.faction);
  Object.assign(r, {
    file_sha256: hash(text),
    file_bytes: Buffer.byteLength(text),
    total_rows: parsed.rows.length,
    tree_structure_sha256: structuralHash(parsed.rows),
    node_set_variants: parsed.rows.filter((r) => r.record_type === "node_set")
      .length,
    node_occurrences: parsed.rows.filter((r) => r.record_type === "node")
      .length,
  });
  await writeFile(indexPath, csv(current.columns, current.rows));
  const lua = path.join(fixture, "forbidden_whole_source.lua");
  if (c.lua) await writeFile(lua, "-- whole source copies are forbidden\n");
  const result = spawnSync(
    process.execPath,
    [
      "scripts/validate-technology-trees.mjs",
      source,
      fixture,
      "--skip-rebuild",
    ],
    { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 },
  );
  assert.equal(result.status, 1, c.name + " must fail: " + result.stderr);
  const report = JSON.parse(
    await readFile(path.join(fixture, "audit_report.json"), "utf8"),
  );
  assert.ok(
    report.errors.some((e) => e.includes(c.expected)),
    c.name + " must fail for expected reason: " + report.errors.slice(0, 5),
  );
  console.log("PASS: " + c.name);
  await writeFile(file, original);
  await writeFile(indexPath, originalIndex);
  if (c.lua) await rm(lua);
}
