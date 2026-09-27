"""Regression cases for plausible but incorrect spell joins and source semantics."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch
from magic_payloads import graph
from magic_pipeline import ROOT, csvrows, readj, writej, writecsv, digest
from validate_magic import validate, golden_checks
from query_magic import Magic

class MagicRegressions(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.base=Path(__import__('os').environ.get('CTW_MAGIC_TEST_ROOT',str(ROOT)))
 def mutate(self,rel,edit):
  with tempfile.TemporaryDirectory(prefix='ctw-magic-') as temp:
   base=Path(temp)
   # Only copy this increment's generated artifacts. Canonical existing inputs
   # are read-only references to ROOT, just as during candidate validation.
   outputs=readj(self.base/'data/magic/output_manifest.json')
   for name in [*outputs,'data/magic/output_manifest.json']:
    dst=base/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(self.base/name,dst)
   p=base/rel; rows=csvrows(p); cols=list(rows[0]);edit(rows);writecsv(p,cols,rows)
   outputs[rel]=digest(p);writej(base/'data/magic/output_manifest.json',outputs)
   with self.assertRaises((ValueError,AssertionError)): validate(base)
 def test_source_backed_golden_queries(self): golden_checks(Magic(self.base))
 def test_direct_grant_to_general_is_not_personal_access(self):
  result=Magic(self.base).query('Hag Witch (Beasts)','wh_main_item_abilities_potion_of_toughness')
  grants=[m for m in result['skill_grants_and_modifiers'] if m['relation']['bonus_value_id']=='enable']
  self.assertTrue(grants)
  self.assertTrue(all(m['scope_definition']['target']=='character_when_commanding' for m in grants))
  self.assertNotEqual(result['character_access_status'],'potential_skill_grant_found')
 def test_represented_ranks_without_level_descriptions(self):
  pair=('wh2_main_skill_all_magic_heavens_10_chain_lightning_lord','1')
  result=Magic(self.base).query('Teclis','wh_main_spell_heavens_chain_lightning',[pair])
  self.assertTrue(result['skill_grants_and_modifiers'])
  self.assertEqual(result['supplied_build']['unresolved_components'],[])
  self.assertEqual(result['supplied_build']['legality_status'],'not_evaluated')
  self.assertEqual(result['character_access_status'],'potential_skill_grant_found')
  unknown=[(pair[0],'99'),('missing_skill','1')]
  result=Magic(self.base).query('Teclis',selected_skills=unknown)
  self.assertEqual({(r['skill_key'],r['skill_level']) for r in result['supplied_build']['unresolved_components']},set(unknown))
  self.assertEqual(result['skill_relations'],[])
 def test_node_rank_recognized_without_effect_or_description(self):
  db=Magic(self.base)
  import query_magic
  original=query_magic.csvrows
  key='wh2_main_skill_all_magic_heavens_10_chain_lightning_lord'
  def without_optional_rows(path):
   return [r for r in original(path) if not (r.get('skill_key')==key and r.get('record_type') in {'effect','skill_level'})]
  with patch('query_magic.csvrows',without_optional_rows):
   result=db.query('Teclis',selected_skills=[(key,'1')])
  self.assertEqual(result['supplied_build']['unresolved_components'],[])
 def test_recipient_flags_are_part_of_phase_identity(self):
  self.mutate('data/unit_stats/abilities/tables/ability_phase_links.csv',lambda rows:rows[0].update(target_enemies='true' if rows[0]['target_enemies']=='false' else 'false'))
 def test_variant_cost_cannot_be_relabelled_with_refreshed_hash(self):
  def edit(rows):
   next(r for r in rows if r['key']=='wh2_main_spell_high_magic_apotheosis_upgraded')['mana_cost']='5.0000'
  self.mutate('data/unit_stats/abilities/tables/ability_casting.csv',edit)
 def test_same_named_phase_is_not_an_authoritative_join(self):
  self.mutate('data/unit_stats/abilities/tables/ability_phase_links.csv',lambda rows:rows[0].update(phase=rows[1]['phase']))
 def test_skill_rank_pointer_cannot_change(self):
  self.mutate('data/magic/characters/high_elves/wh2_main_hef_mage_high.csv',lambda rows:rows[0].update(skill_level='99'))
 def test_zero_and_sentinel_are_distinct(self):
  def edit(rows): next(r for r in rows if r['num_uses']=='-1')['num_uses']='0'
  self.mutate('data/unit_stats/abilities/tables/ability_casting.csv',edit)

 def test_secondary_reference_mutation(self):
  self.mutate('data/unit_stats/lookups/explosions__wh3__9.0.csv',lambda rows:next(r for r in rows if r['shrapnel_key']).update(shrapnel_key='missing_secondary'))
 def test_dropped_conditional_binding(self):
  self.mutate('data/magic/characters/dark_elves/wh2_dlc11_def_lokhir.csv',lambda rows:rows.pop(next(i for i,r in enumerate(rows) if r['target_kind']=='army_ability')))
 def test_cycle_retains_both_incoming_edges(self):
  db=Magic(self.base)
  db.cache['projectiles']=[dict(projectile_key='test_p',explosion_key='test_e')]
  db.cache['explosions']=[dict(explosion_key='test_e',shrapnel_key='test_s')]
  db.cache['projectile_shrapnels']=[dict(key='test_s',projectile='test_p')]
  db.cache['payload_provenance']=[dict(kind=k,key=v,source_path='synthetic_cycle_fixture',source_line='1',source_patch='fixture') for k,v in [('projectile','test_p'),('explosion','test_e')]]
  nodes,edges,missing=graph(db,'synthetic',dict(activated_projectile='test_p',miscast_explosion='test_e'),[])
  self.assertEqual(len(nodes),3);self.assertEqual(len(edges),5);self.assertFalse(missing)
  self.assertEqual(sum(e['target_kind']=='explosion' for e in edges),2)
 def test_dropped_branch_cannot_claim_closure(self):
  import query_magic
  original=query_magic.graph
  def broken(*args):
   nodes,edges,missing=original(*args)
   return nodes,edges[:-1],missing
  with patch('query_magic.graph',broken), self.assertRaises((ValueError,AssertionError)):
   from validate_magic import validate_payloads
   validate_payloads(Magic(self.base))

if __name__=='__main__': unittest.main()
