"""Offline source-to-query reproducibility and corruption checks."""
import hashlib,json,struct,tempfile,unittest
from pathlib import Path
import numpy as np
from build import build,ROOT,DOC
from query_map import Map
from tree_list import decode
from native_height import decode_block

class RebuildChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls): (ROOT/'work').mkdir(exist_ok=True)
    def test_source_to_dataset(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as temp:
            out=build(Path(temp)/'rebuilt')
            actual=Map(out); expected=Map()
            for key in actual.r.files:
                np.testing.assert_array_equal(actual.r[key],expected.r[key])
            self.assertEqual(actual.f,expected.f)
            self.assertEqual(actual.region([1088,1536,2048,2560]),expected.region([1088,1536,2048,2560]))
            with self.assertRaises(ValueError): build(out)
    def test_reject_mutated_source(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as temp:
            d=Path(temp); manifest=json.loads((DOC/'build_spec.json').read_text())
            target=d/manifest['sources']['ground']['path']; target.parent.mkdir(parents=True); target.write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError,'hash mismatch'): build(d/'out',d)
    def test_tree_bounds_and_roundtrip(self):
        b=b'FASTBIN0'+struct.pack('<HI',4,1)+struct.pack('<H',4)+b'test'+struct.pack('<I',1)+struct.pack('<3f',1,2,3)+bytes(6)
        self.assertTrue(decode(b)['roundtrip_byte_equal'])
        for bad in [b[:5],b[:-1],b+b'x',b[:8]+struct.pack('<H',5)+b[10:]]:
            with self.assertRaises(ValueError): decode(bad)
    def test_height_padding_variants(self):
        # Two-entry palette, 256 one-bit indices: both observed padding forms.
        raw=bytes([1])+struct.pack('<2H',10,20)+bytes([0b10101010])*32
        for block in [raw,raw+bytes(3)]:
            values,encoded=decode_block(block)
            self.assertEqual(values[:4],[10,20,10,20]); self.assertEqual(encoded,block)
        with self.assertRaises(ValueError): decode_block(raw+b'\0\0\1')
    def test_corrupt_published_data_rejected(self):
        with tempfile.TemporaryDirectory(dir=ROOT/'work') as temp:
            d=Path(temp); manifest=json.loads((DOC/'dataset/manifest.json').read_text())
            (d/'manifest.json').write_text(json.dumps(manifest)); (d/'rasters.npz').write_bytes(b'corrupt')
            with self.assertRaisesRegex(ValueError,'hash mismatch'): Map(d)

if __name__=='__main__': unittest.main()
