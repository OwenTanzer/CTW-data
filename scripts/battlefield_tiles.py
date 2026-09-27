"""Experimental v11 tile-reference reader; grid coordinates are not world geometry.

Inferred from the two hashed development fixtures, not a published format spec.
Opaque fields remain raw bytes. Unsupported structures fail closed.
"""
from collections import Counter
import hashlib
import struct

RECORD = struct.Struct('<iBBHHHII')


def decode_tiles(index_bytes, tiles_bytes):
    if len(index_bytes) != 12:
        raise ValueError('Index must contain exactly three uint32 fields')
    version, width, height = struct.unpack('<III', index_bytes)
    if version != 11 or not 0 < width <= 512 or not 0 < height <= 512:
        raise ValueError('Unsupported index version or grid dimensions')
    cells = width * height
    offset = cells * 3 * RECORD.size
    if len(tiles_bytes) < offset + 8:
        raise ValueError('Truncated tile planes or string tables')

    def read(fmt):
        nonlocal offset
        size = struct.calcsize(fmt)
        if offset + size > len(tiles_bytes):
            raise ValueError('Truncated string table')
        value, = struct.unpack_from(fmt, tiles_bytes, offset)
        offset += size
        return value

    def strings():
        nonlocal offset
        count = read('<I')
        if count > 65536:
            raise ValueError('Unsupported string count')
        result = []
        for _ in range(count):
            length = read('<H')
            if not length or offset + length > len(tiles_bytes):
                raise ValueError('Invalid string length')
            result.append(tiles_bytes[offset:offset + length].decode('ascii'))
            offset += length
        return result

    paths, labels = strings(), strings()
    if offset != len(tiles_bytes):
        raise ValueError('Unexpected trailing bytes')
    for path in paths:
        parts = path.replace('\\', '/').rstrip('/').split('/')
        if parts[:3] != ['terrain', 'tiles', 'battle'] or any(
                not p or p in ('.', '..') or ':' in p or any(ord(c) < 32 for c in p) for p in parts):
            raise ValueError('Unsupported tile path')
    placements, plane_counts = [], []
    for plane in range(3):
        records = [RECORD.unpack_from(tiles_bytes, (plane * cells + i) * RECORD.size)
                   for i in range(cells)]
        anchors = {i: [] for i, r in enumerate(records) if r[0] > 0}
        for i, record in enumerate(records):
            ref = record[0]
            if ref == 0:
                continue
            anchor = i if ref > 0 else -ref - 1
            if anchor not in anchors:
                raise ValueError('Reference does not target a positive anchor in its plane')
            if record[2:6] != records[anchor][2:6]:
                raise ValueError('Member metadata differs from its anchor')
            anchors[anchor].append(i)
        plane_counts.append(sum(len(v) for v in anchors.values()))
        for anchor, members in anchors.items():
            record = records[anchor]
            path_index = record[0] - 1
            if not 0 <= path_index < len(paths):
                raise ValueError('Anchor references a missing tile path')
            xs, ys = [i % width for i in members], [i // width for i in members]
            bounds = [min(xs), min(ys), max(xs) + 1, max(ys) + 1]
            if len(members) != (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]):
                raise ValueError('Nonrectangular tile membership is unsupported')
            if [record[3], record[4]] != bounds[:2]:
                raise ValueError('Stored origin disagrees with tile membership')
            placements.append({
                'plane': plane, 'anchor_cell_index': anchor,
                'anchor_grid_xy': [anchor % width, anchor // width],
                'path_reference_1based': record[0], 'tile_path_raw': paths[path_index],
                'grid_bounds_exclusive': bounds, 'member_cells': len(members),
                'opaque_u8_4': record[1], 'opaque_u8_5': record[2],
                'opaque_u16_10': record[5],
                'opaque_member_u8_4_counts': dict(sorted(Counter(records[i][1] for i in members if i != anchor).items())),
                'opaque_anchor_tail_hex': tiles_bytes[(plane * cells + anchor) * 20 + 12:
                                                     (plane * cells + anchor + 1) * 20].hex(),
                'nonzero_member_tail_count': sum(any(records[i][6:]) for i in members if i != anchor),
            })
    return {
        'status': 'experimental_tile_references_not_effective_geometry',
        'index_version': version, 'grid_width': width, 'grid_height': height,
        'coordinate_space': 'source_grid_cells_world_units_unresolved',
        'index_sha256': hashlib.sha256(index_bytes).hexdigest(),
        'tiles_sha256': hashlib.sha256(tiles_bytes).hexdigest(),
        'consumed_bytes': offset, 'tile_paths_raw': paths, 'trailing_labels_raw': labels,
        'occupied_cells_by_plane': plane_counts, 'placements': placements,
    }
