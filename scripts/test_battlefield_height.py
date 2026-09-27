"""Malformed codec, alignment hypothesis and unknown-coverage regressions."""
import json
from pathlib import Path
import struct
import sys
import tempfile
import unittest
import numpy as np
from battlefield_height import decode_block, decode_height
from build_battlefield_terrain import build, assemble_candidate
from build_battlefield_deployment import ROOT, EVIDENCE

DECODER = Path(sys.argv.pop(1)).resolve() if len(sys.argv)>1 else ROOT/'work/battlefield-decoder-target/debug/ctw-battlefield-decoder'


class HeightTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory(dir=ROOT/'work')
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.output=Path(cls.tmp.name)
        cls.report=build(DECODER,cls.output)

    def test_three_exact_rasters(self):
        self.assertEqual(len(self.report['rasters']),3)
        for raster in self.report['rasters']:
            self.assertTrue(raster['roundtrip_byte_equal'])
            self.assertEqual([raster['width'],raster['height'],raster['blocks']],[2304,2304,20736])
        first=self.report['rasters'][0]
        self.assertEqual(first['raw_u16_sha256'],'64188db7e73aaaa16c6e2f4158654693dfa1de9e7595467fc209b75712fa41ac')

    def test_report_reproduces(self):
        self.assertEqual(json.loads(json.dumps(self.report)),json.loads((EVIDENCE/'terrain-summary.json').read_bytes()))

    def test_block_encoding_families(self):
        for block,expected in [(b'\0'+struct.pack('<H',123),[123]*256),
                               (b'\x8f'+struct.pack('<256H',*range(256)),list(range(256))),
                               (b'\x80'+struct.pack('<H',10)+b'\xaa'*32+b'\0'*3,[10,11]*128),
                               (b'\x01'+struct.pack('<2H',10,20)+b'\xaa'*32+b'\0'*3,[10,20]*128)]:
            values,encoded=decode_block(block)
            self.assertEqual(values,expected)
            self.assertEqual(encoded,block)

    def test_bad_blocks_rejected(self):
        blocks=[b'',b'\x90',b'\0\0',b'\x8f'+b'\0'*511,
                b'\x80'+struct.pack('<H',65535)+b'\xff'*32+b'\0'*3,
                b'\x01'+struct.pack('<2H',1,2)+b'\0'*32+b'\0\0\1',
                b'\x02'+struct.pack('<3H',1,2,3)+b'\xff'*64+b'\0'*3]
        for block in blocks:
            with self.assertRaises(ValueError):decode_block(block)

    def test_bad_raster_headers_rejected(self):
        source=next((EVIDENCE/'xml-probe').rglob('tile_height_map.compressed_map')).read_bytes()
        mutated=bytearray(source);struct.pack_into('<I',mutated,69,1)
        for data in [b'BADBYTES'+source[8:],source[:-1],source+b'\0',bytes(mutated),
                     source[:8]+b'\xff\xff'+source[10:]]:
            with self.assertRaises(ValueError):decode_height(data)

    def test_alignment_evidence_discriminates_reflection(self):
        candidates=self.report['alignment_evidence']['candidate_comparisons']
        same=[x for x in candidates if x['samples_per_native_unit']==.5 and x['border_samples']==128]
        correct,reflected=same
        self.assertEqual(correct['valid_props'],702)
        self.assertGreater(correct['pearson_r'],.97)
        self.assertGreater(correct['pearson_r'],reflected['pearson_r'])
        self.assertEqual(self.report['status'],'conditional_terrain_assembly_not_world_verified')

    def test_missing_tiles_are_unknown(self):
        mosaic=np.load(self.output/'conditional-height-mosaic.npy')
        mask=np.load(self.output/'coverage-mask.npy')
        self.assertEqual(int((~mask).sum()),4194304)
        self.assertTrue(np.isnan(mosaic[~mask]).all())
        self.assertTrue(np.isfinite(mosaic[mask]).all())

    def test_unsupported_orientation_rejected(self):
        p={'tile_path_raw':'terrain/tiles/battle/test/tile_11/', 'plane':0,'opaque_u8_4':32,
           'grid_bounds_exclusive':[0,0,16,16]}
        with self.assertRaises(ValueError):assemble_candidate({'tile_11':np.zeros((2304,2304))},[p])


if __name__=='__main__':unittest.main()
