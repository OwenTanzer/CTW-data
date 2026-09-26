// Requires the installed pinned game and read-only RPFM. Re-extract into a fresh
// directory, then compare the complete snapshot, including compact Lua evidence.
import { mkdir, mkdtemp, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import { walk } from "./technology-lib.mjs";
const expected = path.resolve(
  process.argv[2] ?? "data/technology_trees/source_exports",
);
await mkdir("work", { recursive: true });
const fresh = await mkdtemp(path.resolve("work/technology_extraction_verify_"));
const patch = JSON.parse(await readFile(path.join(expected, "source_manifest.json"), "utf8")).patch;
const result = spawnSync(
  process.execPath,
  ["scripts/extract-technology-source.mjs", fresh, patch],
  { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 },
);
assert.equal(result.status, 0, result.stdout + result.stderr);
const paths = async (root) =>
  (await walk(root)).map((f) => path.relative(root, f));
const files = await paths(expected);
assert.deepEqual(await paths(fresh), files);
for (const file of files)
  assert.ok(
    (await readFile(path.join(fresh, file))).equals(
      await readFile(path.join(expected, file)),
    ),
    "Authoritative extraction differs: " + file,
  );
console.log(result.stdout.trim());
console.log(
  `PASS: ${files.length} source artifacts byte-identical to a fresh verified MSI extraction.`,
);
