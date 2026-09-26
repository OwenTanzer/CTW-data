import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
// Exercise real generators, not template string copies. Published documentation
// must survive a fresh rebuild, including ownership and localisation caveats.
for (const [owner, builder, extractor] of [
  ['economy', 'build-economy-dataset.mjs', 'extract-economy-source.mjs'],
  ['skill_trees', 'build-skill-trees.mjs', 'extract-skill-source.mjs'],
]) test(`${owner} regeneration preserves published README and safe extraction command`, async () => {
  await mkdir('work', { recursive: true });
  const output = await mkdtemp(`work/readme-${owner}-`);
  try {
    execFileSync(process.execPath, [`scripts/${builder}`, `data/${owner}/source_exports`, output], { stdio: 'pipe' });
    const generated = await readFile(`${output}/README.md`, 'utf8');
    assert.equal(generated, await readFile(`data/${owner}/README.md`, 'utf8'));
    if (owner === 'skill_trees') {
      const manifest = JSON.parse(await readFile(`${output}/dataset_manifest.json`, 'utf8'));
      for (const [label, key] of [['Character files', 'character_files'], ['Underlying conditional node sets', 'node_sets'], ['Node occurrences', 'nodes'], ['Effect rows', 'effects']])
        assert.ok(generated.includes(`- ${label}: ${manifest[key].toLocaleString('en-US')}`));
    }
    const command = generated.split('\n').find(line => line.includes(extractor));
    assert.ok(command, 'extraction instructions missing');
    assert.match(command, / work\\\S+ 9\.0$/);
  } finally { await rm(output, { recursive: true, force: true }); }
});
