"""Probe-level decoder checks; no claim of complete battlefield coverage."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
DECODER = Path(sys.argv.pop(1)).resolve() if len(sys.argv) > 1 else ROOT / 'work/battlefield-decoder-target/debug/ctw-battlefield-decoder'
SOURCE = ROOT / 'docs/development/battlefields/field-probe/terrain/battles/chs_wastes_coast_a/tile_map.bmd'


class DecoderTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SOURCE.read_bytes()
        cls.result = json.loads(subprocess.check_output([str(DECODER), str(SOURCE)]))

    def test_exact_consumption_and_roundtrip(self):
        self.assertEqual(self.result['source_bytes'], 213255)
        self.assertEqual(self.result['consumed_bytes'], len(self.source))
        self.assertTrue(self.result['roundtrip_byte_equal'])
        self.assertEqual(hashlib.sha256(self.source).hexdigest(), '740f71f3923c794e75d06f3bfc680ebc7856b37d3e495f98f7bc9e7101addec3')

    def test_native_records_and_uint64_retained(self):
        bmd = self.result['bmd']
        self.assertEqual(bmd['serialise_version'], 27)
        self.assertEqual(len(bmd['prop_list']['props']), 1860)
        self.assertEqual(len(bmd['prop_list']['keys']), 30)
        self.assertEqual(bmd['prop_list']['props'][0]['pdlc_mask'], 18446744073709551615)

    def test_unset_playable_area_and_missing_deployment_remain_explicit(self):
        bmd = self.result['bmd']
        self.assertFalse(bmd['playable_area']['has_been_set'])
        self.assertEqual(bmd['deployment_list']['deployment_areas'], [])

    def test_deterministic_decode(self):
        again = json.loads(subprocess.check_output([str(DECODER), str(SOURCE)]))
        self.assertEqual(again, self.result)

    def test_invalid_binary_rejected(self):
        mutations = {'signature': b'BADBYTES' + self.source[8:],
                     'truncated': self.source[:-1], 'trailing': self.source + b'\x00',
                     'version': self.source[:8] + b'\xff\xff' + self.source[10:]}
        with tempfile.TemporaryDirectory() as tmp:
            for name, data in mutations.items():
                with self.subTest(name=name):
                    p = Path(tmp) / (name + '.bmd')
                    p.write_bytes(data)
                    result = subprocess.run([str(DECODER), str(p)], capture_output=True)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(result.stdout, b'')


if __name__ == '__main__':
    unittest.main()
