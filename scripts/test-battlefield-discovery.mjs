import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {validateProbeRequest, decoderProbeStatus} from './battlefield-probe-lib.mjs';

test('exact bounded source request', () => {
  const request = {paths: ['terrain/battles/test/tile_map.bmd'], decode: ['terrain/battles/test/tile_map.bmd']};
  assert.equal(validateProbeRequest(request), request);
});
test('unsafe paths rejected', () => {
  for (const p of ['/absolute', 'terrain/../secret', 'terrain//file', 'terrain/./file',
    'terrain/a\\b', 'terrain/a\u0000b', 'terrain/C:bad', 'unknown/file', 1])
    assert.throws(() => validateProbeRequest({paths: [p]}));
});
test('duplicates, empty, oversized and unrequested decoding rejected', () => {
  for (const request of [{paths: []}, {paths: Array(101).fill('terrain/a')},
    {paths: ['terrain/a', 'terrain/a']}, {paths: ['terrain/a'], decode: ['terrain/b']},
    {paths: ['terrain/a'], decode: 'terrain/a'}]) assert.throws(() => validateProbeRequest(request));
});
test('server Unknown is not geometry', () => {
  for (const response of ['Unknown', null, {Unknown: null}])
    assert.equal(decoderProbeStatus(response), 'not_exposed_by_server');
  assert.equal(decoderProbeStatus({BMD: {}}), 'decoder_returned_unvalidated');
});
test('committed source evidence and atlas joins reconcile', () => {
  const report = JSON.parse(execFileSync(process.execPath, ['scripts/audit-battlefield-discovery.mjs'], {encoding: 'utf8'}));
  assert.equal(report.status, 'passed');
  assert.equal(report.checked_evidence_files, 22);
  assert.ok(report.atlas_compatibility.every(x => x.byte_identical_to_atlas_source));
  assert.equal(report.counts.atlas_group_map_variants, 1136);
  assert.equal(report.scope, 'source_discovery_only');
});
