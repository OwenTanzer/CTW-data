"""Regression cases for plausible but incorrect spell joins and source semantics."""
import json
from pathlib import Path
import shutil
import tempfile
import unittest
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

if __name__=='__main__': unittest.main()
