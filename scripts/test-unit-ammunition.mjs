import test from 'node:test';
import assert from 'node:assert/strict';
import { missileSupply } from './unit-ammunition.mjs';
test('native pool flag selects capacity independently of the attachment',()=>{
 const land={primary_ammo:'22',secondary_ammo:'0'};
 assert.deepEqual(missileSupply({use_secondary_ammo_pool:'false'},land),{ammoPool:'primary',ammo:22});
 assert.deepEqual(missileSupply({use_secondary_ammo_pool:'true'},{primary_ammo:'15',secondary_ammo:'20'}),{ammoPool:'secondary',ammo:20});
});
test('blank, zero, negative sentinel and unknown flag remain distinct',()=>{
 for(const [raw,expected] of [['',null],['0',0],['-1',-1]])
  assert.deepEqual(missileSupply({use_secondary_ammo_pool:'true'},{secondary_ammo:raw}),{ammoPool:'secondary',ammo:expected});
 for(const flag of [undefined,'']) assert.deepEqual(missileSupply({use_secondary_ammo_pool:flag},{primary_ammo:'22'}),{ammoPool:null,ammo:null});
 assert.throws(()=>missileSupply({use_secondary_ammo_pool:'true'},{secondary_ammo:'NaN'}));
});
