"""Cross-family collection, corruption and variant-isolation regressions."""
import gzip
import hashlib
import json
from pathlib import Path
import sqlite3
import struct
import tempfile
import unittest
import zipfile
from battlefield_tile_list import decode_tile_list
from battlefield_tiles import decode_tiles, RECORD
from build_battlefield_collection import source_bytes, source_index, ROOT
from query_battlefield import query, query_asset


class CollectionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(dir=ROOT/'work')
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.database = Path(cls.tmp.name)/'assets.sqlite'
        candidate = ROOT/'work/battlefield-collection/assets.sqlite'
        committed = ROOT/'docs/development/battlefields/collection/assets.sqlite.gz'
        if committed.exists():
            cls.database.write_bytes(gzip.decompress(committed.read_bytes()))
        else:
            with sqlite3.connect(candidate) as src, sqlite3.connect(cls.database) as dst:
                src.backup(dst)

    def test_exact_cross_family_variants(self):
        with sqlite3.connect(self.database) as db:
            rows = db.execute('SELECT battle_key,packet_json FROM variants').fetchall()
        for pattern in ('coast','river','forest','hills','major','minor'):
            candidates = [(key,json.loads(raw)) for key,raw in rows if pattern in key]
            candidates = [(key,p) for key,p in candidates if p['status']=='native_evidence_available']
            self.assertTrue(candidates, pattern)
            key, expected = candidates[0]
            actual = query(self.database, key)['packet']
            self.assertEqual(actual, expected)
            self.assertTrue(actual['source_assets'])
            self.assertFalse(actual['terrain_evidence']['effective_world_alignment_verified'])

    def test_all_tile_upgrades_isolated(self):
        with sqlite3.connect(self.database) as db:
            packets = [json.loads(r) for r, in db.execute('SELECT packet_json FROM variants')]
        upgraded = [p for p in packets if p['tile_upgrade']]
        self.assertTrue(upgraded)
        for packet in upgraded:
            self.assertEqual(packet['status'],'tile_upgrade_assembly_unresolved')
            self.assertEqual(packet['source_assets'],[])
            self.assertEqual(packet['terrain_evidence']['rasters'],[])
            self.assertEqual(packet['unselected_procedural_assets'],[])
            self.assertEqual(packet['unselected_alternate_layers'],[])

    def test_same_map_different_catchment(self):
        coast = query(self.database,'chs_wastes_coast_a_01')['packet']
        other = query(self.database,'chs_wastes_coast_a_02')['packet']
        self.assertNotEqual(coast['variant_key'],other['variant_key'])
        for packet in (coast,other):
            catchment = packet['catchment_name']
            selected = [r['source_path'] for r in packet['source_assets'] if '/catchment_' in r['source_path']]
            self.assertTrue(selected)
            self.assertTrue(all(p.endswith('/'+catchment+'_layer_bmd_data.bin') for p in selected))
        self.assertEqual(query(self.database,'terrain/battles/chs_wastes_coast_a')['status'],'ambiguous')

    def test_unsupported_source_is_retrievable(self):
        with sqlite3.connect(self.database) as db:
            path, = db.execute("SELECT path FROM assets WHERE json_extract(record_json,'$.status')='unsupported_or_failed' LIMIT 1").fetchone()
        asset = query_asset(self.database,path)['asset']
        self.assertTrue(asset['error'])
        self.assertNotIn('boundaries',asset)
        self.assertEqual(query_asset(self.database,'missing.bmd')['status'],'not_found')

    def test_tile_list_record_and_corruption(self):
        path=b'terrain/tiles/battle/test/tile_11/'
        prefix=b'FASTBIN0'+struct.pack('<HHIH',2,1,1,len(path))+path+struct.pack('<I',0)+bytes(69)+struct.pack('<I',1)
        record=struct.pack('<HI',1,0)+bytes(range(15))
        source=prefix+record+b'\x07'
        result=decode_tile_list(source)
        self.assertEqual(result['placements'][0]['record_hex'],record.hex())
        self.assertEqual(result['suffix_hex'],'07')
        for corrupt in (source[:-1],source+b'\0',prefix+struct.pack('<HI',1,1)+bytes(15)+b'\0'):
            with self.assertRaises(ValueError): decode_tile_list(corrupt)

    def test_irregular_membership_preserved(self):
        records=[RECORD.pack(1,16,0,0,0,0,0,0),RECORD.pack(-1,16,0,0,0,0,0,0),RECORD.pack(-1,16,0,0,0,0,0,0),bytes(20)]
        path=b'terrain/tiles/battle/test/'
        tiles=b''.join(records)+bytes(8*20)+struct.pack('<IH',1,len(path))+path+struct.pack('<I',0)
        index=struct.pack('<III',11,2,2)
        with self.assertRaises(ValueError): decode_tiles(index,tiles)
        p=decode_tiles(index,tiles,allow_irregular=True)['placements'][0]
        self.assertFalse(p['membership_rectangular'])
        self.assertEqual(p['member_cell_indices'],[0,1,2])

    def test_source_hash_fail_closed(self):
        path=Path(self.tmp.name)/'source.zip'
        with zipfile.ZipFile(path,'w') as z: z.writestr('asset.bmd',b'bad')
        with self.assertRaises(ValueError):
            source_bytes({'archive':str(path),'path':'asset.bmd','bytes':3,'sha256':hashlib.sha256(b'good').hexdigest()})


if __name__ == '__main__':
    unittest.main()
