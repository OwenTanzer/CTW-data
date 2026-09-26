import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { snapshotProfile, assertIdentity, beginSource } from './snapshot-source.mjs';
import { parseRpfmTsv } from './rpfm-tsv.mjs';

test('explicit snapshot rejects a newer or mixed installation', () => {
  assert.doesNotThrow(() => assertIdentity(snapshotProfile('9.0'), '25507028', '9.0.0.0'));
  assert.throws(() => assertIdentity(snapshotProfile('8.1.1'), '25507028', '9.0.0.0'));
  assert.throws(() => assertIdentity(snapshotProfile('9.0'), '25507028', '9.0.1.0'));
  assert.throws(() => snapshotProfile('latest'));
});
test('source output cannot reach production through a work symlink', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'ctw-guard-'));
  try {
    await mkdir(path.join(root, 'work'));
    await mkdir(path.join(root, 'data'));
    await symlink(path.join(root, 'data'), path.join(root, 'work', 'escape'), 'junction');
    await assert.rejects(beginSource(path.join(root, 'work', 'escape', 'candidate'), root, '9.0'), /escapes work/);
    await assert.rejects(beginSource(path.join(root, 'data', 'candidate'), root, '9.0'), /under ignored work/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
test('RPFM prose with unmatched quotation marks cannot swallow skill records', () => {
  const rows = parseRpfmTsv('key\tdescription\n#metadata\t\nskill_a\t"Opening quote, curly closing quote”\nskill_b\tLater skill\n');
  assert.deepEqual(rows[2], ['skill_a', '"Opening quote, curly closing quote”']);
  assert.deepEqual(rows[3], ['skill_b', 'Later skill']);
  assert.throws(() => parseRpfmTsv('key\tvalue\nbroken\n'), /expected 2 columns/);
});
