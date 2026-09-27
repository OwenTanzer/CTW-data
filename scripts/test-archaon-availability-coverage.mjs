import test from 'node:test';
import assert from 'node:assert/strict';
import { archaonEvidence as evidence, archaonAvailabilityErrors as check } from './archaon-availability-coverage.mjs';
function fixture(){
 const rows=new Map(),mounts=[],permissions=[];
 for(const c of evidence.cases){
  rows.set(c.unit,{source_land_unit_key:c.source_land_unit,availability_notes:c.availability_note,military_group_count:'0'});
  if(c.mount)mounts.push({base_unit_key:c.base_unit,mounted_unit_key:c.unit});
  for(const key of c.source_permissions)permissions.push({race_slug:'warriors_of_chaos',unit_key:c.unit,record_type:'faction_permission',faction_permission_key:key});
 }
 return {rosters:new Map([['warriors_of_chaos',rows]]),mounts,permissions};
}
const run=f=>check(f.rosters,f.mounts,f.permissions);
test('source subtype and mount mappings cover 11 leaders and six conditional chieftains',()=>{
 assert.equal(evidence.leader_subtypes,11);assert.equal(evidence.extra_transfer_subtypes,6);
 assert.equal(evidence.cases.length,26);assert.equal(evidence.cases.filter(c=>c.mount).length,9);
 assert.deepEqual(run(fixture()),[]);
});
test('every lost scripted configuration or misrepresented access fails',()=>{
 const f=fixture();for(const c of evidence.cases){
  const rows=f.rosters.get('warriors_of_chaos'),old=rows.get(c.unit);rows.delete(c.unit);
  assert.ok(run(f).some(e=>e.includes(c.unit)));rows.set(c.unit,old);
  for(const field of ['availability_notes','source_land_unit_key','military_group_count']){
   const value=old[field];old[field]=field==='military_group_count'?'1':'';
   assert.ok(run(f).some(e=>e.includes(c.unit)));old[field]=value;
  }
 }
});
test('mount omission and invented Warriors of Chaos permission fail',()=>{
 const f=fixture(),edge=f.mounts[0];f.mounts.shift();assert.ok(run(f).some(e=>e.includes(edge.mounted_unit_key)));
 const g=fixture();g.permissions.push({race_slug:'warriors_of_chaos',unit_key:evidence.cases[0].unit,record_type:'faction_permission',faction_permission_key:'wh_main_chs_chaos'});
 assert.ok(run(g).some(e=>e.includes('Invented Warriors of Chaos')));
});
