// Certifies source integrity/schema shape only, not stat semantics or campaign ceilings.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { verifyManifest, discover, exportShape } from "./effect-foundation-lib.mjs";
import { parse } from "./technology-lib.mjs";

const source = path.resolve(process.argv[2] ?? "work/source_effect_semantics__wh3__8.1.1");
const manifest = await verifyManifest(source);
const schema = JSON.parse(await readFile(path.join(source,"decoded_schema.json"),"utf8"));
const discovery = JSON.parse(await readFile(path.join(source,"discovery.json"),"utf8"));
const recomputed = discover(discovery.db_paths,schema);
if (recomputed.selected_tables.some(t => !schema[t]?.length)) throw new Error("Selected tables lack decoded schemas");
if (JSON.stringify(recomputed.selected_tables) !== JSON.stringify(discovery.selected_tables)) throw new Error("Source selection does not reproduce from schema/inventory");
if (JSON.stringify(manifest.table_folders_requested) !== JSON.stringify(discovery.selected_tables)) throw new Error("Requested tables disagree with discovery");
const expectedPaths = [...new Set(discovery.db_paths.filter(p => recomputed.selected_tables.includes(p.split("/")[1])))].sort();
if (JSON.stringify(expectedPaths) !== JSON.stringify(discovery.selected_paths)) throw new Error("Selected packed paths disagree with inventory");
let rows = 0;
const exportProjections = [];
const present = new Set(), exportedPaths = new Set(), keys = new Map(), duplicateKeys = [];
for (const f of manifest.files.filter(f=>f.path.startsWith("db/"))) {
  const table=f.path.split("/")[1];
  if (!discovery.selected_tables.includes(table)) throw new Error(`Unexpected table ${table}`);
  present.add(table);
  const text=await readFile(path.join(source,f.path),"utf8");
  const metadata = text.split(/\r?\n/)[1]?.split("\t")[0].split(";");
  if (metadata?.[0] !== "#" + table) throw new Error(`Missing RPFM schema metadata: ${f.path}`);
  if (!expectedPaths.includes(metadata[2]) || exportedPaths.has(metadata[2]) || metadata[2].split("/")[1] !== table) throw new Error(`Unexpected or duplicate packed path: ${f.path}`);
  exportedPaths.add(metadata[2]);
  const version=Number(metadata[1]), definition=schema[table]?.find(d=>d.version===version);
  if (!definition) throw new Error(`No decoded definition for ${table} version ${version}`);
  const parsed=parse(text,"\t"), shape=exportShape(definition), expected=shape.columns;
  // RPFM TSV exports can move primary keys ahead of the schema's field order.
  // Rows are mapped by header name, so require an exact, unique set of columns.
  if (new Set(parsed.columns).size !== parsed.columns.length ||
      parsed.columns.length !== expected.length ||
      expected.some(name => !parsed.columns.includes(name))) throw new Error(`Header/schema mismatch: ${f.path}`);
  if (shape.colours.length) exportProjections.push({path:f.path, colours:shape.colours});
  const keyFields=definition.fields.filter(f=>f.is_key).map(f=>f.name);
  for (const [i,r] of parsed.rows.entries()) {
    rows++;
    for (const colour of shape.colours) {
      if (!/^[0-9A-Fa-f]{6}$/.test(r[colour.column])) throw new Error(`Invalid exported RGB hex: ${f.path}:${i+3}`);
    }
    if (keyFields.length) {
      const key=JSON.stringify([table,...keyFields.map(k=>r[k])]);
      if (keys.has(key)) duplicateKeys.push({table,first:keys.get(key),second:`${f.path}:${i+3}`});
      else keys.set(key,`${f.path}:${i+3}`);
    }
  }
}
const missing=discovery.selected_tables.filter(t=>!present.has(t));
if (missing.length) throw new Error(`Selected tables not exported: ${missing.join(", ")}`);
if (exportedPaths.size !== expectedPaths.length) throw new Error("Selected packed paths not fully exported");
if (duplicateKeys.length) throw new Error(`Unresolved source-key precedence: ${JSON.stringify(duplicateKeys.slice(0,10))}`);
console.log(JSON.stringify({status:"source_integrity_passed",tables:present.size,rows,
  export_projections:exportProjections,
  semantic_validation:"not_implemented_in_extraction_increment",campaign_ceiling_ready:false},null,2));
