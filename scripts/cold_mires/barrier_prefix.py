"""Bounded prefix reader for Cold Mires BMD v27, based on pinned RPFM readers.
Reads buildings and go/non-terrain outlines; explicitly leaves suffix undecoded.
RPFM revision a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f (MIT).
"""
import struct

class Reader:
    def __init__(self, data):
        self.data, self.pos, self.rebuilt = data, 0, bytearray()
    def get(self, fmt):
        fmt = '<'+fmt
        n = struct.calcsize(fmt)
        result = struct.unpack_from(fmt, self.data, self.pos)
        self.rebuilt.extend(struct.pack(fmt, *result))
        self.pos += n
        return result[0] if len(result)==1 else result
    def string(self):
        n = self.get('H')
        raw = self.data[self.pos:self.pos+n]
        if len(raw)!=n: raise ValueError('Truncated string')
        value = raw.decode('utf-8')
        self.rebuilt.extend(value.encode('utf-8')); self.pos += n
        return value
    def expect(self, fmt, value):
        actual = self.get(fmt)
        if actual != value: raise ValueError((self.pos, actual, value))
    def outlines(self):
        count = self.get('I')
        if count>100000: raise ValueError('Excessive outline count')
        result=[]
        for _ in range(count):
            n=self.get('I')
            if n>(len(self.data)-self.pos)//8: raise ValueError('Truncated points')
            result.append([self.get('2f') for _ in range(n)])
        return result

def prefix(data):
    r=Reader(data)
    r.expect('8s', b'FASTBIN0'); r.expect('H',27)
    r.expect('H',1); count=r.get('I'); buildings=[]
    for _ in range(count):
        r.expect('H',11)
        bid=r.string(); parent=r.get('i'); key=r.string(); ptype=r.string()
        transform=r.get('12f'); r.expect('H',11)
        propid=r.string(); damage=r.get('f'); flags=r.get('15B')
        if any(f not in (0,1) for f in flags): raise ValueError('Invalid bool')
        height=r.string(); uid=r.get('Q')
        buildings.append(dict(key=key,transform=transform,parent=parent,height_mode=height,flags=flags,uid=uid))
    r.expect('H',1); r.expect('I',0) # empty far buildings
    r.expect('H',11); r.expect('I',0) # empty capture locations
    r.expect('I',0) # empty EF lines
    go=r.outlines(); nonterrain=r.outlines()
    if bytes(r.rebuilt)!=data[:r.pos]: raise ValueError('Prefix roundtrip mismatch')
    return dict(buildings=buildings,go_outlines=go,non_terrain_outlines=nonterrain,
                prefix_bytes=r.pos,prefix_roundtrip=True,unparsed_suffix_bytes=len(data)-r.pos)
