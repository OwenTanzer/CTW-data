"""Experimental FASTBIN0 v4 tree-list reader; placement/selection unverified."""
import struct
import hashlib

def decode(data):
    offset = 0
    rebuilt = bytearray()
    def take(n):
        nonlocal offset
        if n < 0 or offset+n > len(data):
            raise ValueError('Truncated tree list')
        b = data[offset:offset+n]; offset += n
        return b
    header = take(14)
    if header[:8] != b'FASTBIN0' or struct.unpack_from('<H',header,8)[0] != 4:
        raise ValueError('Unsupported signature/version')
    count = struct.unpack_from('<I',header,10)[0]
    if count > len(data)//6:
        raise ValueError('Invalid group count')
    rebuilt.extend(header); groups=[]
    for _ in range(count):
        size=take(2); n=struct.unpack('<H',size)[0]; name=take(n)
        key=name.decode('utf-8'); amount=take(4); total=struct.unpack('<I',amount)[0]
        if total > (len(data)-offset)//18:
            raise ValueError('Invalid record count')
        rebuilt.extend(size+key.encode('utf-8')+amount); records=[]
        for _ in range(total):
            raw=take(18); xyz=struct.unpack('<3f',raw[:12]); opaque=raw[12:]
            rebuilt.extend(struct.pack('<3f',*xyz)+opaque)
            records.append({'xyz_candidate':xyz,'opaque_tail_hex':opaque.hex()})
        groups.append({'model':key,'records':records})
    if offset != len(data): raise ValueError('Trailing bytes')
    if bytes(rebuilt) != data: raise ValueError('Nonexact roundtrip')
    return {'source_sha256':hashlib.sha256(data).hexdigest(),'source_bytes':len(data),
            'consumed_bytes':offset,'roundtrip_byte_equal':True,'groups':groups,
            'status':'inferred_record_layout_unverified_runtime_selection_and_coordinates'}
