import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LORD_UNIT_FIXTURES, UPDATE_MOUNT_FIXTURES, lordUnitCoverageErrors } from './lord-unit-coverage.mjs';
const ALL_FIXTURES = [...LORD_UNIT_FIXTURES, ...UPDATE_MOUNT_FIXTURES];
function fixture() {
  const rosters = new Map();
  for (const f of ALL_FIXTURES) rosters.set(f.race, new Set([...(rosters.get(f.race) ?? []), f.base, ...f.mounts]));
  return {
    rosters,
    mounts: ALL_FIXTURES.flatMap(f => f.mounts.map(key => ({ base_unit_key: f.base, mounted_unit_key: key }))),
  };
}
test('all five playable lords and reviewed update mount chains satisfy independent coverage', () => {
  const f = fixture(); assert.deepEqual(lordUnitCoverageErrors(f.rosters, f.mounts), []);
});
test('each missing unit or mount relation fails even when selector counts could agree', () => {
  for (const lord of ALL_FIXTURES) for (const key of [lord.base, ...lord.mounts]) {
    const f = fixture(); f.rosters.get(lord.race).delete(key);
    assert.ok(lordUnitCoverageErrors(f.rosters, f.mounts).some(e => e.includes(key)));
  }
  for (const edge of fixture().mounts) {
    const f = fixture(); f.mounts = f.mounts.filter(r => r.mounted_unit_key !== edge.mounted_unit_key);
    assert.ok(lordUnitCoverageErrors(f.rosters, f.mounts).some(e => e.includes('mount relation')));
  }
});
test('a legacy Boris identity cannot substitute for the current unit', () => {
  const f = fixture(); f.rosters.get('empire').delete('wh3_dlc29_emp_cha_boris_todbringer_toddy_0');
  f.rosters.get('empire').add('wh_dlc03_emp_cha_boris_todbringer_0');
  assert.equal(lordUnitCoverageErrors(f.rosters, f.mounts).length, 1);
});
