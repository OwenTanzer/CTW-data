// Audit only facts in existing snapshots. No empty production dataset is created.
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { discover, family, sha256 } from "./effect-foundation-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, process.argv[2] ?? "work/effect_foundation_audit");
if (!output.startsWith(path.join(root, "work") + path.sep)) throw new Error("Audit outputs must be in ignored work/");
const inventoryPath = "data/technology_trees/source_exports/discovery.json";
const bytes = await readFile(path.join(root,inventoryPath));
const inventory = JSON.parse(bytes);
const schema = JSON.parse(await readFile(path.join(root,"data/technology_trees/source_exports/decoded_schema.json"), "utf8"));
const plan = discover(inventory.db_paths, schema);
const copies = new Map();
for (const dataset of ["unit_stats", "skill_trees", "technology_trees", "economy"]) {
  const source = path.join(root,"data",dataset,"source_exports");
  const manifest = JSON.parse(await readFile(path.join(source,"source_manifest.json"),"utf8"));
  for (const file of manifest.files.filter(f => f.path.startsWith("db/"))) {
    const table = file.path.split("/")[1];
    if (!copies.has(table)) copies.set(table,[]);
    copies.get(table).push({dataset,path:`data/${dataset}/source_exports/${file.path}`,sha256:file.sha256});
  }
}
const relations = plan.selected_tables.map(table => ({ table, family: family(table) ?? "schema_dependency",
  packed_paths: inventory.db_paths.filter(p => p.split("/")[1] === table),
  repository_copies: copies.get(table) ?? [],
  status: copies.has(table) ? "export_present_semantics_not_certified" : "requires_extraction" }));
const report = { source_inventory: inventoryPath, source_inventory_sha256: sha256(bytes),
  source_scope: "Existing pinned patch-8.1.1 packed-file discovery; not a live installation check",
  roots: plan.roots.length, selected_tables: relations.length,
  present_tables: relations.filter(r => r.repository_copies.length).length,
  missing_tables: relations.filter(r => !r.repository_copies.length).length,
  dependency_discovery_complete: plan.schema_missing_for_roots.length === 0,
  schema_missing_for_roots: plan.schema_missing_for_roots,
  ceiling_ready: false, relations, dependency_edges: plan.dependency_edges };
await mkdir(output,{recursive:true});
await writeFile(path.join(output,"coverage.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(Object.fromEntries(Object.entries(report).filter(([k]) => !["relations","dependency_edges","schema_missing_for_roots"].includes(k))),null,2));
