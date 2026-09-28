"""Exact selection, variant isolation and deterministic assembly regressions."""
import json
from pathlib import Path
import sys
import tempfile
import unittest
from build_battlefield_assembly import build, connect, variant_id, ROOT
from query_battlefield import query

DECODER = Path(sys.argv.pop(1)).resolve() if len(sys.argv) > 1 else ROOT / 'work/battlefield-decoder-target/debug/ctw-battlefield-decoder'


class AssemblyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory(dir=ROOT / 'work')
        cls.addClassCleanup(cls.tmp.cleanup)
        cls.output = Path(cls.tmp.name) / 'first'
        cls.manifest = build(DECODER, cls.output)
        cls.database = cls.output / 'battlefield_connections.sqlite'

    def test_exact_label_and_canonical_keys_agree(self):
        results = [query(self.database, s, 'singleplayer') for s in
                   ['Cold Mires – Chaos Coast', 'chs_wastes_coast_a_01', 'battle:chs_wastes_coast_a_01']]
        self.assertEqual(results[0], results[1])
        self.assertEqual(results[1], results[2])
        p = results[0]['packet']
        self.assertEqual(p['catchment_name'], 'catchment_01')
        self.assertEqual(query(self.database, p['variant_key'])['packet'], p)
        self.assertFalse(p['menu_availability_verified'])
        self.assertEqual(p['effective_geometry']['status'], 'unresolved')

    def test_shared_asset_is_ambiguous(self):
        result = query(self.database, 'terrain/battles/chs_wastes_coast_a')
        self.assertEqual(result['status'], 'ambiguous')
        self.assertEqual(len(result['candidates']), 12)

    def test_missing_and_unsupported_stay_explicit(self):
        self.assertEqual(query(self.database, 'no-such-battle')['status'], 'not_found')
        p = query(self.database, 'chs_wastes_coast_a_04')['packet']
        self.assertEqual(p['status'], 'catchment_layers_not_decoded')
        self.assertEqual(p['connected_source_layers'], [])
        p = query(self.database, 'wh3_dlc27_qb_nor_sayl_final_battle')['packet']
        self.assertEqual(p['status'], 'source_layers_connected_world_assembly_unresolved')
        self.assertEqual(p['connected_source_layers'][0]['asset']['status'], 'decoded_asset_only')

    def test_wrong_variant_geometry_not_joined(self):
        p = query(self.database, 'chs_wastes_coast_a_02')['packet']
        self.assertTrue(all(x['asset']['source_asset'].endswith('/catchment_02_layer_bmd_data.bin')
                            for x in p['connected_source_layers']))
        self.assertNotIn('catchment_01_layer', json.dumps(p))
        self.assertEqual(query(self.database, 'chs_wastes_coast_a_13')['status'], 'not_found')

    def test_full_atlas_relation_is_preserved(self):
        r, = query(self.database, 'chs_wastes_coast_a_01')['packet']['atlas_relations']
        self.assertEqual(set(r), {'battle_group_key', 'battle_map_key', 'catchment_name', 'tile_upgrades'})
        self.assertEqual(r['catchment_name'], 'catchment_01')
        self.assertTrue(r['battle_map_key'].startswith('location:'))
        self.assertIsNone(r['tile_upgrades'])
        self.assertNotEqual(variant_id('battle:x', 'a', None), variant_id('battle:x', 'b', None))
        self.assertNotEqual(variant_id('battle:x', 'a', None), variant_id('battle:x', 'a', 'upgrade'))

    def test_selector_drift_rejected(self):
        row = {'key': 'test', 'specification': 'terrain/test', 'catchment_name': 'wrong',
               'tile_upgrade': '', 'type': 'classic'}
        atlas = {'battle:test': {'source_kind': 'battles_tables', 'map_location': 'terrain/test',
                                 'catchment_name': 'correct', 'tile_upgrade': None, 'battle_type': 'classic'}}
        with self.assertRaises(ValueError):
            connect(row, atlas, [], {}, set(), {'assets': []})

    def test_upgrade_never_uses_unqualified_layer(self):
        row = {'key': 'test', 'specification': 'terrain/test', 'catchment_name': 'catchment_01',
               'tile_upgrade': 'walls', 'type': 'classic', 'release': 'true',
               'singleplayer': 'true', 'multiplayer': 'true'}
        atlas = {'battle:test': {'source_kind': 'battles_tables', 'map_location': 'terrain/test',
                                 'catchment_name': 'catchment_01', 'tile_upgrade': 'walls', 'battle_type': 'classic'}}
        packet = connect(row, atlas, [], {'terrain/test': {'placements': []}}, set(), {'assets': []})
        self.assertEqual(packet['status'], 'tile_upgrade_assembly_unresolved')
        self.assertEqual(packet['connected_source_layers'], [])

    def test_invalid_mode_rejected(self):
        with self.assertRaises(ValueError):
            query(self.database, 'chs_wastes_coast_a_01', 'invented-mode')

    def test_reproducible_database_and_coverage(self):
        second = build(DECODER, Path(self.tmp.name) / 'second')
        self.assertEqual(second, self.manifest)
        self.assertEqual(self.manifest['variant_records'], 1319)
        self.assertEqual(self.manifest['variants_with_decoded_source_layers'], 5)
        self.assertEqual(self.manifest['effective_world_layouts'], 0)


if __name__ == '__main__':
    unittest.main()
