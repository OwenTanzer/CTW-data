"""Focused format, source-join, human-branch, and spatial validation."""
import csv
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import unittest
from campaign_esf import Esf
from extract_campaign_starts import lua_table


ROOT=Path(__file__).resolve().parents[1]
ATLAS=Path(os.environ.get('CTW_STARTS_ATLAS',ROOT/'data/campaign_map/campaign_atlas__wh3__8.1.1.gpkg')).resolve()


class FormatTests(unittest.TestCase):
    def test_reject_wrong_magic(self):
        with self.assertRaises(ValueError):Esf(bytes(32))

    def test_literal_lua_and_comment(self):
        self.assertEqual(lua_table('{ if_human = "f", -- note\n changes = {{"teleport_character", "f", 1, 2, 3, 4, true}} }')['changes'][0][-1],True)

    def test_never_execute_lua(self):
        with self.assertRaises(ValueError):lua_table('{ dangerous_function() }')


class AtlasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db=sqlite3.connect(ATLAS.as_uri()+'?mode=ro',uri=True);cls.db.row_factory=sqlite3.Row
    @classmethod
    def tearDownClass(cls):cls.db.close()
    def start(self,key):return dict(self.db.execute('select * from faction_army_start_reference where faction_key=?',(key,)).fetchone())

    def test_primary_coverage_and_uniqueness(self):
        expected={r[0] for r in self.db.execute('select faction_key from factions where playable=1')}
        rows=list(self.db.execute('select faction_key,world_x,world_y from faction_army_start_reference'))
        self.assertEqual(len(rows),104);self.assertEqual({r[0] for r in rows},expected)
        self.assertTrue(all(r[1] is not None and r[2] is not None for r in rows))
        self.assertEqual(self.db.execute('select count(*) from campaign_army_starts').fetchone()[0],109)

    def test_gelt_has_army_without_capital(self):
        r=self.start('wh2_dlc13_emp_golden_order')
        self.assertIsNone(r['capital_region_key'])
        self.assertEqual(r['start_region_key'],'wh3_main_combi_region_temple_of_elemental_winds')
        self.assertEqual((r['logical_x'],r['logical_y']),(1137,451))

    def test_maritime_are_points_not_fictitious_capitals(self):
        rows=[r for r in self.db.execute('select * from faction_army_start_reference') if r['start_region_key'] is None]
        self.assertEqual({r['faction_key'] for r in rows},{'wh2_dlc11_cst_noctilus','wh2_main_hef_yvresse','wh3_dlc27_hef_aislinn','wh_dlc08_nor_norsca'})
        self.assertTrue(all(0<r['nearest_land_distance']<12 for r in rows))

    def test_human_relocations_and_secondary_force(self):
        r=self.start('wh2_main_hef_yvresse');self.assertEqual((r['logical_x'],r['logical_y']),(573,407))
        self.assertEqual(r['binary_region_key'],'wh3_main_combi_region_tor_yvresse')
        second=self.db.execute("select * from campaign_army_starts where faction_key='wh2_main_hef_yvresse' and is_primary=0").fetchone()
        self.assertEqual(second['start_region_key'],'wh3_main_combi_region_tor_yvresse')
        self.assertEqual(self.start('wh_dlc05_wef_wood_elves')['start_region_key'],'wh3_main_combi_region_castle_carcassonne')

    def test_partner_condition(self):
        self.assertEqual(self.start('wh_dlc03_bst_beastmen')['logical_x'],516)
        rows=list(self.db.execute('select * from campaign_start_partner_overrides'))
        self.assertEqual(len(rows),5)
        self.assertTrue(all(r['logical_x']==514 and r['logical_y']==723 for r in rows))

    def test_ai_only_relocations_not_applied_to_humans(self):
        self.assertEqual(self.start('wh_dlc08_nor_norsca')['logical_x'],153)
        self.assertEqual(self.start('wh3_dlc27_hef_aislinn')['logical_x'],898)
        self.assertEqual(self.start('wh3_main_dae_daemon_prince')['logical_y'],942)

    def test_committed_csv_matches_every_army_and_override_field(self):
        for filename,table in [('army_starts.csv','campaign_army_starts'),
                               ('partner_overrides.csv','campaign_start_partner_overrides')]:
            with (ROOT/'data/campaign_map/starting_positions'/filename).open(newline='') as f:
                expected=list(csv.DictReader(f))
            actual=[{k:'' if v is None else str(v) for k,v in dict(r).items()}
                    for r in self.db.execute('SELECT * FROM '+table)]
            self.assertEqual(sorted(expected,key=repr),sorted(actual,key=repr))

    def test_retained_lua_matches_parsed_rules(self):
        source=ROOT/'data/campaign_map/starting_positions/source_exports'
        rules=json.loads((source/'custom_start_rules.json').read_text())
        self.assertEqual(lua_table((source/'custom_starts_ie.lua').read_text()),rules)
        stored=[json.loads(r[0]) for r in self.db.execute(
            'SELECT rule_json FROM campaign_start_rules ORDER BY rule_index')]
        self.assertEqual(stored,rules)

    def test_evidence_and_published_csv_hashes(self):
        folder=ROOT/'data/campaign_map/starting_positions'
        for manifest,base in [(folder/'dataset_manifest.json',folder),
                              (folder/'source_exports/source_manifest.json',folder/'source_exports')]:
            for name,expected in json.loads(manifest.read_text())['files'].items():
                with self.subTest(file=name):
                    self.assertEqual(hashlib.sha256((base/name).read_bytes()).hexdigest(),expected)

    def test_source_and_region_links(self):
        self.assertEqual(self.db.execute('pragma integrity_check').fetchone()[0],'ok')
        self.assertEqual(len(list(self.db.execute('pragma foreign_key_check'))),0)
        for r in self.db.execute('select * from campaign_army_starts'):
            self.assertGreater(r['esf_offset'],0)
            for field in ('start_region_key','nearest_land_region_key','binary_region_key'):
                if r[field]:self.assertIsNotNone(self.db.execute('select 1 from regions where region_key=?',(r[field],)).fetchone())


if __name__=='__main__':unittest.main()
