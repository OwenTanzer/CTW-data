import test from 'node:test';
import assert from 'node:assert/strict';
import { historicalDecisions as decisions, historicalRosterErrors as check } from './historical-roster-coverage.mjs';
function fixture() {
  const rosters = new Map(), mounts = [], permissions = [];
  const put=(race,key,row)=>{if(!rosters.has(race))rosters.set(race,new Map());rosters.get(race).set(key,row);};
  for(const c of decisions) {
    if(c.decision==='exclude_duplicate') {put(c.canonical_race,c.canonical_unit,{availability_notes:c.canonical_availability_note});continue;}
    put(c.race,c.unit,{source_land_unit_key:c.land_unit,availability_notes:c.availability_note});
    for(const e of c.mount_edges)mounts.push({base_unit_key:e.base_unit,mounted_unit_key:c.unit});
    for(const p of c.permissions)permissions.push({...p,record_type:'faction_permission',race_slug:c.race,unit_key:c.unit,faction_permission_key:p.faction});
  }
  return {rosters,mounts,permissions};
}
const run=f=>check(f.rosters,f.mounts,f.permissions);
test('all original cases and four additional faction discoveries are accounted for',()=>{
  assert.equal(decisions.length,804);assert.equal(decisions.filter(c=>c.decision==='include').length,788);
  assert.equal(decisions.filter(c=>c.decision==='exclude_duplicate').length,16);
  assert.deepEqual(run(fixture()),[]);
});
test('loss of every included identity, note or source identity is rejected',()=>{
  const f=fixture();
  for(const c of decisions.filter(c=>c.decision==='include')) {
    const rows=f.rosters.get(c.race),old=rows.get(c.unit);
    rows.delete(c.unit);assert.ok(run(f).some(e=>e.includes(c.unit)));rows.set(c.unit,old);
    for(const field of ['availability_notes','source_land_unit_key']) {
      const value=old[field];old[field]='';assert.ok(run(f).some(e=>e.includes(c.unit)));old[field]=value;
    }
  }
});
test('mount loss, permission substitution and campaign flag drift are rejected',()=>{
  const f=fixture(), edge=f.mounts[0];f.mounts=f.mounts.filter(m=>m.base_unit_key!==edge.base_unit_key || m.mounted_unit_key!==edge.mounted_unit_key);
  assert.ok(run(f).some(e=>e.includes('mount edge')));
  for(const field of ['faction_permission_key','campaign_exclusive']) {
    const g=fixture(),p=g.permissions.find(p=>p.faction_permission_key==='wh3_dlc29_vmp_neferata' && p.unit_key==='wh3_dlc23_neu_cha_ulrika');
    assert.ok(p);p[field]=field==='campaign_exclusive'?'false':'wh_main_vmp_vampire_counts';
    assert.ok(run(g).some(e=>e.includes('exact permission')));
  }
});
test('combat alias insertion and canonical loss are rejected',()=>{
  const f=fixture();
  for(const c of decisions.filter(c=>c.decision==='exclude_duplicate')) {
    if(!f.rosters.has(c.race))f.rosters.set(c.race,new Map());
    f.rosters.get(c.race).set(c.unit,{});assert.ok(run(f).some(e=>e.includes('Excluded alias')));f.rosters.get(c.race).delete(c.unit);
    const rows=f.rosters.get(c.canonical_race),old=rows.get(c.canonical_unit);rows.delete(c.canonical_unit);
    assert.ok(run(f).some(e=>e.includes('Canonical counterpart')));rows.set(c.canonical_unit,old);
  }
});
test('Spirit of Grungni MP is retained as a distinct represented combat configuration',()=>{
  assert.equal(decisions.find(c=>c.unit==='wh3_dlc25_dwf_veh_thunderbarge_grungni_mp').decision,'include');
});
