"""Read native tile-list references; preserve opaque metadata and placement bytes."""
import struct


def decode_tile_list(data):
    offset = 0

    def take(n):
        nonlocal offset
        if n < 0 or offset + n > len(data):
            raise ValueError('Truncated tile list')
        result = data[offset:offset+n]
        offset += n
        return result

    def number(fmt):
        return struct.unpack(fmt, take(struct.calcsize(fmt)))[0]

    def strings():
        count = number('<I')
        if count > 65536:
            raise ValueError('Invalid string count')
        return [take(number('<H')).decode('utf-8') for _ in range(count)]

    if take(8) != b'FASTBIN0':
        raise ValueError('Invalid tile-list signature')
    version = number('<H')
    if version not in (1, 2) or number('<H') != 1:
        raise ValueError('Unsupported tile-list version')
    paths, labels = strings(), strings()
    for path in paths:
        parts = path.replace('\\', '/').rstrip('/').split('/')
        if parts[:3] != ['terrain', 'tiles', 'battle'] or any(p in ('', '.', '..') or ':' in p for p in parts):
            raise ValueError('Unsafe tile-list path')
    metadata = take(69)
    count = number('<I')
    if count > 1000000:
        raise ValueError('Invalid placement count')
    placements = []
    for index in range(count):
        raw = take(21)
        record_version, reference = struct.unpack_from('<HI', raw)
        if record_version != 1 or reference >= len(paths):
            raise ValueError('Unsupported tile-list record or missing reference')
        placements.append({'placement_index': index, 'tile_path_raw': paths[reference],
                           'reference_0based': reference, 'record_hex': raw.hex(),
                           'transform_status': 'native_record_not_interpreted'})
    suffix = take(1).hex() if version == 2 else ''
    if offset != len(data):
        raise ValueError('Trailing tile-list bytes')
    return {'status': 'decoded_native_tile_references', 'version': version,
            'tile_paths_raw': paths, 'labels_raw': labels, 'metadata_hex': metadata.hex(),
            'suffix_hex': suffix, 'placements': placements, 'consumed_bytes': offset,
            'coordinate_space': 'uninterpreted_native_placement_records'}
