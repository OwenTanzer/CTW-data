import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decisions, availabilityCoverageErrors } from './availability-coverage.mjs';
function fixture() {
  const rosters = new Map(), mounts = [];
  for (const c of decisions) {
    if (!rosters.has(c.race)) rosters.set(c.race, new Map());
    if (c.canonical_race && !rosters.has(c.canonical_race)) rosters.set(c.canonical_race, new Map());
    rosters.get(c.canonical_race ?? c.race).set(c.decision === 'include' ? c.unit : c.canonical_unit, { availability_notes: c.availability_note });
    if (c.decision === 'include') for (const e of c.mount_edges) mounts.push({base_unit_key:e.base_unit, mounted_unit_key:c.unit});
  }
  return {rosters, mounts};
}
test('reviewed 46 inclusions and 12 exclusions are complete', () => {
  assert.equal(decisions.filter(c => c.decision === 'include').length,46);
  assert.equal(decisions.filter(c => c.decision === 'exclude_duplicate').length,12);
  const f=fixture(); assert.deepEqual(availabilityCoverageErrors(f.rosters,f.mounts),[]);
});
test('every omitted configuration, lost qualification and duplicate insertion is detected', () => {
  for (const c of decisions) {
    const f=fixture(), rows=f.rosters.get(c.race);
    if(c.decision==='include') rows.delete(c.unit); else rows.set(c.unit,{});
    assert.ok(availabilityCoverageErrors(f.rosters,f.mounts).some(e=>e.includes(c.unit)));
    if(c.decision==='include') {
      const f=fixture();f.rosters.get(c.race).get(c.unit).availability_notes='';
      assert.ok(availabilityCoverageErrors(f.rosters,f.mounts).some(e=>e.includes('qualification')));
    }
  }
  for(const edge of fixture().mounts) {
    const f=fixture(); f.mounts=f.mounts.filter(m=>m.base_unit_key!==edge.base_unit_key || m.mounted_unit_key!==edge.mounted_unit_key);
    assert.ok(availabilityCoverageErrors(f.rosters,f.mounts).some(e=>e.includes('mount edge')));
  }
});

test('each excluded alias retains a canonical counterpart in its reviewed roster', () => {
  for (const c of decisions.filter(c => c.decision === 'exclude_duplicate')) {
    const f = fixture();
    f.rosters.get(c.canonical_race ?? c.race).delete(c.canonical_unit);
    assert.ok(availabilityCoverageErrors(f.rosters, f.mounts).some(e => e.includes(`Duplicate counterpart missing: ${c.race}/${c.canonical_unit}`)));
  }
});
