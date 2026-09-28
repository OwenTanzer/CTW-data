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
    packed_end = start + 32 * bits
    padding = block[packed_end:]
    if len(block) not in (packed_end, packed_end + 3) or any(padding):
        raise ValueError('Invalid packed block length or padding')
    packed = int.from_bytes(block[start:packed_end], 'little')
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
    return values, block[:start] + rebuilt.to_bytes(32 * bits, 'little') + padding


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
    # Group equal codecs and vectorize bit packing. Each decoded block is
    # re-encoded from its sample values, retaining source palette/base choices.
    groups = {}
    consumed = 0
    tags = Counter()
    for i, (start, length) in enumerate(zip(offsets, lengths)):
        if start != consumed or not length or start + length > size:
            raise ValueError('Noncontiguous or out-of-bounds block')
        tag = payload[start]
        groups.setdefault((tag, length), []).append(i)
        tags[tag] += 1
        consumed += length
    if consumed != size:
        raise ValueError('Unconsumed raster payload')
    blocks = np.empty((count, 256), dtype='<u2')
    for (tag, length), members in groups.items():
        for begin in range(0, len(members), 512):
            ids = members[begin:begin+512]
            raw = np.stack([np.frombuffer(payload, dtype=np.uint8, count=length, offset=offsets[i]) for i in ids])
            if tag == 0:
                if length != 3: raise ValueError('Invalid constant block')
                samples = np.repeat(raw[:, 1:].copy().view('<u2'), 256, axis=1)
                rebuilt = np.concatenate((raw[:, :1], samples[:, :1].copy().view(np.uint8)), axis=1)
            elif tag == 143:
                if length != 513: raise ValueError('Invalid direct block')
                samples = raw[:, 1:].copy().view('<u2')
                rebuilt = np.concatenate((raw[:, :1], samples.copy().view(np.uint8)), axis=1)
            else:
                if tag > 142: raise ValueError('Unsupported block tag')
                bits = (tag & 127) + 1 if tag >= 128 else tag.bit_length()
                start = 3 if tag >= 128 else 1 + 2 * (tag + 1)
                packed_end = start + 32 * bits
                if length not in (packed_end, packed_end + 3) or raw[:, packed_end:].any():
                    raise ValueError('Invalid packed block length or padding')
                unpacked = np.unpackbits(raw[:, start:packed_end], axis=1, bitorder='little').reshape(-1, 256, bits)
                shifts = np.arange(bits, dtype=np.uint32)
                indices = (unpacked.astype(np.uint32) << shifts).sum(axis=2, dtype=np.uint32)
                if tag >= 128:
                    base = raw[:, 1:3].copy().view('<u2').astype(np.uint32)
                    samples = indices + base
                    if samples.max() > 65535: raise ValueError('Sample overflow')
                    encoded = samples - base
                else:
                    palette = raw[:, 1:start].copy().view('<u2')
                    order = np.argsort(palette, axis=1)
                    ordered = np.take_along_axis(palette, order, axis=1)
                    if indices.max() >= palette.shape[1] or (np.diff(ordered.astype(np.int32), axis=1) == 0).any():
                        raise ValueError('Invalid palette/index')
                    samples = np.take_along_axis(palette, indices, axis=1)
                    row_offsets = (np.arange(len(ids), dtype=np.uint64) * 65536)[:, None]
                    locations = np.searchsorted((ordered + row_offsets).ravel(), (samples + row_offsets).ravel())
                    encoded = order.ravel()[locations].reshape(samples.shape)
                packed = np.packbits(((encoded[:, :, None] >> shifts) & 1).astype(np.uint8).reshape(len(ids), -1), axis=1, bitorder='little')
                rebuilt = np.concatenate((raw[:, :start], packed, np.zeros((len(ids), length-packed_end), dtype=np.uint8)), axis=1)
            if not np.array_equal(raw, rebuilt): raise ValueError('Nonexact block roundtrip')
            blocks[ids] = samples
    raster = blocks.reshape(height // 16, width // 16, 16, 16).transpose(0, 2, 1, 3).reshape(height, width)
    return raster, {'status': 'decoded_native_samples_world_alignment_unverified',
                    'source_sha256': hashlib.sha256(source).hexdigest(), 'source_bytes': len(source),
                    'width': width, 'height': height, 'block_width': bw, 'block_height': bh,
                    'codec': codec.decode(), 'opaque_header_hex': opaque.hex(),
                    'raw_u16_sha256': hashlib.sha256(raster.tobytes()).hexdigest(),
                    'sample_min': int(raster.min()), 'sample_max': int(raster.max()),
                    'blocks': count, 'block_tags': dict(sorted(tags.items())),
                    'roundtrip_byte_equal': True, 'coordinate_units': 'unresolved'}
