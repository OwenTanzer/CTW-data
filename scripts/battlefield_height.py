"""Experimental FASTBIN0 v3 TABLE_INDEXED uint16 raster decoder.

Codec inferred from retained height fixtures. Samples have no asserted world units.
"""
from collections import Counter
import hashlib
import struct
import numpy as np


def decode_block(block):
    if not block:
        raise ValueError('Empty block')
    tag = block[0]
    if tag == 0:
        if len(block) != 3:
            raise ValueError('Invalid constant block')
        value, = struct.unpack_from('<H', block, 1)
        return [value] * 256, bytes([tag]) + struct.pack('<H', value)
    if tag == 143:
        if len(block) != 513:
            raise ValueError('Invalid direct block')
        values = list(struct.unpack_from('<256H', block, 1))
        return values, bytes([tag]) + struct.pack('<256H', *values)
    if tag > 142:
        raise ValueError('Unsupported block tag')
    bits = (tag & 127) + 1 if tag >= 128 else tag.bit_length()
    start = 3 if tag >= 128 else 1 + 2 * (tag + 1)
    if len(block) != start + 32 * bits + 3 or block[-3:] != b'\0\0\0':
        raise ValueError('Invalid packed block length or padding')
    packed = int.from_bytes(block[start:-3], 'little')
    indices = [(packed >> (i * bits)) & ((1 << bits) - 1) for i in range(256)]
    if tag >= 128:
        base, = struct.unpack_from('<H', block, 1)
        values = [base + i for i in indices]
        if max(values) > 65535:
            raise ValueError('Sample overflow')
        encoded_indices = [v - base for v in values]
    else:
        palette = struct.unpack_from('<' + str(tag + 1) + 'H', block, 1)
        if max(indices) >= len(palette) or len(set(palette)) != len(palette):
            raise ValueError('Invalid palette/index')
        values = [palette[i] for i in indices]
        reverse = {v: i for i, v in enumerate(palette)}
        encoded_indices = [reverse[v] for v in values]
    rebuilt = sum(v << (i * bits) for i, v in enumerate(encoded_indices))
    return values, block[:start] + rebuilt.to_bytes(32 * bits, 'little') + b'\0\0\0'


def decode_height(source):
    offset = 0

    def take(size):
        nonlocal offset
        if size < 0 or offset + size > len(source):
            raise ValueError('Truncated raster')
        value = source[offset:offset + size]
        offset += size
        return value

    def number(fmt):
        return struct.unpack(fmt, take(struct.calcsize(fmt)))[0]

    if take(8) != b'FASTBIN0' or number('<H') != 3:
        raise ValueError('Unsupported raster signature/version')
    width, height, bw, bh = [number('<I') for _ in range(4)]
    if not (0 < width <= 4096 and 0 < height <= 4096 and bw == bh == 16 and
            width % bw == height % bh == 0):
        raise ValueError('Unsupported raster dimensions/block size')
    opaque = take(24)
    codec = take(number('<H'))
    if codec != b'TABLE_INDEXED':
        raise ValueError('Unsupported raster codec')
    count = width * height // 256
    if number('<I') != count:
        raise ValueError('Offset count mismatch')
    offsets = struct.unpack('<' + str(count) + 'I', take(count * 4))
    if number('<I') != count:
        raise ValueError('Length count mismatch')
    lengths = struct.unpack('<' + str(count) + 'H', take(count * 2))
    size = number('<I')
    header = source[:offset]
    payload = take(size)
    if offset != len(source):
        raise ValueError('Trailing raster bytes')
    raster = np.empty((height, width), dtype='<u2')
    rebuilt, consumed, tags = [], 0, Counter()
    for i, (start, length) in enumerate(zip(offsets, lengths)):
        if start != consumed or not length or start + length > size:
            raise ValueError('Noncontiguous or out-of-bounds block')
        block = payload[start:start + length]
        values, encoded = decode_block(block)
        if encoded != block:
            raise ValueError('Nonexact block roundtrip')
        rebuilt.append(encoded)
        tags[block[0]] += 1
        y, x = divmod(i, width // 16)
        raster[y*16:y*16+16, x*16:x*16+16] = np.array(values, dtype='<u2').reshape(16, 16)
        consumed += length
    if consumed != size or header + b''.join(rebuilt) != source:
        raise ValueError('Nonexact raster roundtrip')
    return raster, {'status': 'decoded_native_samples_world_alignment_unverified',
                    'source_sha256': hashlib.sha256(source).hexdigest(), 'source_bytes': len(source),
                    'width': width, 'height': height, 'block_width': bw, 'block_height': bh,
                    'codec': codec.decode(), 'opaque_header_hex': opaque.hex(),
                    'raw_u16_sha256': hashlib.sha256(raster.tobytes()).hexdigest(),
                    'sample_min': int(raster.min()), 'sample_max': int(raster.max()),
                    'blocks': count, 'block_tags': dict(sorted(tags.items())),
                    'roundtrip_byte_equal': True, 'coordinate_units': 'unresolved'}
