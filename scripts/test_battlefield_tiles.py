"""Fixture and corruption checks for experimental tile composition evidence."""
from pathlib import Path
import struct
import unittest
from battlefield_tiles import decode_tiles

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/development/battlefields'


class TileTests(unittest.TestCase):
    def setUp(self):
        folder = EVIDENCE / 'field-probe/terrain/battles/chs_wastes_coast_a'
        self.index = (folder / 'tile_map.index').read_bytes()
        self.tiles = (folder / 'tile_map.tiles').read_bytes()

    def test_coast_references(self):
        result = decode_tiles(self.index, self.tiles)
        self.assertEqual(result['occupied_cells_by_plane'], [1536, 0, 0])
        self.assertEqual(len(result['placements']), 6)
        self.assertEqual(result['placements'][0]['grid_bounds_exclusive'], [8, 8, 24, 24])
        self.assertEqual(result['placements'][-1]['grid_bounds_exclusive'], [40, 24, 56, 40])
        self.assertEqual(result['consumed_bytes'], len(self.tiles))

    def test_independent_grid_and_reused_paths(self):
        folder = EVIDENCE / 'composition-probe/terrain/battles/def_plains_infield_a'
        result = decode_tiles((folder / 'tile_map.index').read_bytes(), (folder / 'tile_map.tiles').read_bytes())
        self.assertEqual([result['grid_width'], result['grid_height']], [80, 80])
        self.assertEqual(result['occupied_cells_by_plane'], [6400, 0, 0])
        self.assertEqual(len(result['placements']), 25)
        self.assertEqual(len(result['tile_paths_raw']), 4)
        self.assertEqual({p['opaque_u8_4'] for p in result['placements']}, {16, 32, 64, 128})
        self.assertTrue(all(p['member_cells'] == 256 for p in result['placements']))

    def test_reject_index_version_dimensions_and_length(self):
        for index in [self.index[:-1], self.index + b'\0', struct.pack('<III', 12, 64, 64),
                      struct.pack('<III', 11, 0, 64), struct.pack('<III', 11, 2**32 - 1, 64)]:
            with self.assertRaises(ValueError):
                decode_tiles(index, self.tiles)

    def test_reject_truncation_and_trailing_bytes(self):
        for tiles in [self.tiles[:20], self.tiles[:-1], self.tiles + b'\0']:
            with self.assertRaises(ValueError):
                decode_tiles(self.index, tiles)

    def test_reject_invalid_membership_and_path_references(self):
        for offset, value in [(520 * 20, -1), (1480 * 20, 7), (520 * 20, 0)]:
            tiles = bytearray(self.tiles)
            struct.pack_into('<i', tiles, offset, value)
            with self.assertRaises(ValueError):
                decode_tiles(self.index, tiles)

    def test_reject_metadata_and_origin_disagreement(self):
        for offset in [520 * 20 + 5, 1480 * 20 + 6]:
            tiles = bytearray(self.tiles)
            tiles[offset] ^= 1
            with self.assertRaises(ValueError):
                decode_tiles(self.index, tiles)

    def test_reject_unsafe_path(self):
        with self.assertRaises(ValueError):
            decode_tiles(self.index, self.tiles.replace(b'terrain\\tiles', b'terrain\\..les', 1))


if __name__ == '__main__':
    unittest.main()
