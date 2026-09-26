"""Read-only, bounded ESF record reader for the campaign-start extraction.

Format reference: taw/etwng esfxml/lib/esf_parser.rb (MIT; see
campaign_esf_LICENSE.txt). ABCB string widths are checked against the installed
file's table boundaries. No third-party executable or runtime package needed.
Unknown scalar types fail closed; unrelated record bodies stay unparsed.
"""
from dataclasses import dataclass
import lzma
import struct


@dataclass
class Node:
    file: object
    tag: int
    start: int
    payload: int
    end: int
    name: str = ""
    version: int = 0
    count: int = 0

    def children(self):
        if not self.name:
            raise ValueError("Not a record")
        if self.tag & 64:
            pos = self.payload
            for _ in range(self.count):
                size, body = self.file.varint(pos)
                end = body + size
                if end > self.end:
                    raise ValueError("Array entry overrun")
                yield Node(self.file, 128, pos, body, end, "ENTRY")
                pos = end
            if pos != self.end:
                raise ValueError("Array length mismatch")
        else:
            pos = self.payload
            while pos < self.end:
                node = self.file.node(pos, self.end)
                yield node
                pos = node.end
            if pos != self.end:
                raise ValueError("Record length mismatch")

    def child(self, name):
        found = [c for c in self.children() if c.name == name]
        if len(found) != 1:
            raise ValueError(f"Expected one {name} in {self.name}, found {len(found)}")
        return found[0]

    def value(self):
        b = self.file.data[self.payload:self.end]
        if self.name:
            raise ValueError("Record is not scalar")
        if self.tag & 64:
            return b
        if self.tag in (14, 15):
            return self.file.strings[self.tag][int.from_bytes(b, "little")]
        if self.tag in (18, 19):
            return self.tag == 18
        if self.tag in (20, 25, 29):
            return 0
        if self.tag == 21:
            return 1
        if self.tag in (10, 11, 12, 13):
            vals = struct.unpack("<" + {10:"f",11:"d",12:"ff",13:"fff"}[self.tag], b)
            return vals[0] if len(vals) == 1 else vals
        return int.from_bytes(b, "big" if self.tag in (24,28) else "little", signed=self.tag in (2,3,4,5,26,27,28))


class Esf:
    SIZES = {1:1,2:1,3:2,4:4,5:8,6:1,7:2,8:4,9:8,
             10:4,11:8,12:8,13:12,14:4,15:4,16:2,18:0,19:0,
             20:0,21:0,22:1,23:2,24:3,25:0,26:1,27:2,28:3,29:0,
             33:4,35:1,36:2,37:4}

    def __init__(self, data):
        self.data = data
        magic, reserved, self.timestamp, table = struct.unpack_from("<4I", data)
        if magic not in (0xabca, 0xabcb) or reserved != 0:
            raise ValueError("Unsupported ESF header")
        self.magic = magic
        self.table = table
        pos = table
        def integer(width):
            nonlocal pos
            n = int.from_bytes(data[pos:pos+width], "little")
            pos += width
            if pos > len(data):
                raise ValueError("Truncated table")
            return n
        def string(width, encoding):
            nonlocal pos
            n = integer(width) * (2 if encoding == "utf-16-le" else 1)
            s = data[pos:pos+n].decode(encoding)
            pos += n
            return s
        self.names = [string(2, "ascii") for _ in range(integer(2))]
        self.strings = {}
        for tag, encoding in ((14,"utf-16-le"),(15,"latin1")):
            values = {}
            for _ in range(integer(4)):
                value = string(4 if magic == 0xabcb else 2, encoding)
                key = integer(4)
                if key in values:
                    raise ValueError("Duplicate string ID")
                values[key] = value
            self.strings[tag] = values
        if pos != len(data):
            raise ValueError("String table boundary mismatch")
        self.root = self.node(16, table)
        if self.root.end != table:
            raise ValueError("Root boundary mismatch")

    def varint(self, pos):
        n = 0
        for _ in range(5):
            b = self.data[pos]
            pos += 1
            n = n * 128 + (b & 127)
            if b < 128:
                return n, pos
        raise ValueError("Oversized varint")

    def node(self, start, limit):
        tag = self.data[start]
        pos = start + 1
        name, version, count = "", 0, 0
        if tag >= 128:
            if start == 16 or tag & 32:
                index, version = struct.unpack_from("<HB", self.data, pos)
                pos += 3
            else:
                header = (tag << 8) + self.data[pos]
                index, version = header & 511, (header >> 9) & 15
                pos += 1
            name = self.names[index]
            size, pos = self.varint(pos)
            if tag & 64:
                count, pos = self.varint(pos)
        elif tag & 64:
            size, pos = self.varint(pos)
        else:
            if tag not in self.SIZES:
                raise ValueError(f"Unsupported scalar {tag:#x} at {start:#x}")
            size = self.SIZES[tag]
        end = pos + size
        if end > limit:
            raise ValueError(f"Node overrun at {start:#x}")
        return Node(self, tag, start, pos, end, name, version, count)

    def decompress(self):
        compressed = [c for c in self.root.children() if c.name == "COMPRESSED_DATA"]
        if not compressed:
            return self
        node, = compressed
        payload, info = list(node.children())
        size, properties = list(info.children())
        expected = size.value()
        if expected > 512 * 1024 * 1024:
            raise ValueError("Unreasonable decompressed size")
        header = properties.value() + struct.pack("<Q", expected)
        decoder = lzma.LZMADecompressor(format=lzma.FORMAT_ALONE)
        data = decoder.decompress(header + payload.value(), max_length=expected + 1)
        if len(data) != expected:
            raise ValueError("Decompressed size mismatch")
        return Esf(data)
