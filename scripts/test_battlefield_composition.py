"""Check exact reproduction and honest partial coverage of composition evidence."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from build_battlefield_composition import build, ROOT, EVIDENCE

DECODER = Path(sys.argv.pop(1)).resolve() if len(sys.argv) > 1 else ROOT / 'work/battlefield-decoder-target/debug/ctw-battlefield-decoder'


class CompositionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(dir=ROOT / 'work')
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.report = build(DECODER, Path(cls.tmp.name))

    def test_reproduces_committed_summary(self):
        # JSON strings normalize integer dictionary keys without losing uint64 values.
        self.assertEqual(json.loads(json.dumps(self.report)),
                         json.loads((EVIDENCE / 'composition-summary.json').read_bytes()))

    def test_partial_decoder_coverage(self):
        failed = [x for x in self.report['layers'] if x['status'] == 'decoder_failed']
        self.assertEqual(failed, [])
        self.assertEqual(sum(x.get('roundtrip_byte_equal', False) for x in self.report['layers']), 13)

    def test_set_boundary_and_prefab_preserve_source_scope(self):
        layer, = [x for x in self.report['layers'] if x.get('playable_area', {}).get('has_been_set')]
        self.assertEqual(layer['playable_area']['area'],
                         {'min_x': 1088.0, 'min_y': 1536.0, 'max_x': 2048.0, 'max_y': 2560.0})
        prefab, = layer['set_playable_area_prefab_instances']
        self.assertEqual(prefab['key'], 'prefabs/deployment_land_battle_1024x1024.bmd')
        self.assertEqual(prefab['uid'], 110966528067332153)
        self.assertEqual(layer['status'], 'decoded_asset_only')

    def test_output_guard(self):
        with self.assertRaises(ValueError):
            build(DECODER, EVIDENCE)
        with self.assertRaises(ValueError):
            build(DECODER, Path(self.tmp.name))


if __name__ == '__main__':
    unittest.main()
