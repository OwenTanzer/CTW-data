# Battlefield implementation checkpoint — issue #9

This is development evidence, **not a production battlefield dataset**. Start here
instead of reading the full path inventories. Nothing here closes #9 or certifies
a map ready for controlled testing. No production data has been changed.

## Verified findings

- Installed extraction source: 9.0.1, Steam build 25546563. The atlas is 9.0.
  The freshly extracted `battles_tables` and
  `battle_catchment_override_group_battles_tables` are byte-identical to the
  atlas's recorded sources. The patch-label difference is not a blocker for
  these joins; only relevant content differences should affect this work.
- The terrain path inventory contains 70,530 assets and 552 top-level battle
  asset families. These are **not** counts of unique selectable layouts.
- 1,616 of 1,645 atlas records match a top-level battle asset prefix. This is
  path reconciliation, not exact variant resolution; 29 require investigation.
- The source battle table has 1,319 rows; 785 have release enabled and either
  single-player or multiplayer enabled. Those flags alone do not prove menu
  availability. All 1,136 atlas group/map/catchment/tile relations are retained.
- The first sample is `terrain/battles/chs_wastes_coast_a/`, referenced by
  multiple configured battle records/catchments. Its tile manifest names six
  tile paths, but their placement/composition has not been decoded.

## Decoder discovery

The installed Rusted PackFile Manager (RPFM) server returns `Unknown` for BMD
(Battle Map Definition) files. Upstream source explains why: its server's
`decode_and_send_file` explicitly skips BMD file types. This response is not
proof that the library cannot decode them.

The standalone read-only adapter under `scripts/battlefield-decoder/` uses
the upstream library pinned to commit
`a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f`:

- [Server decode dispatch](https://github.com/Frodo45127/rpfm/blob/a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f/rpfm_server/src/background_thread.rs)
- [BMD format implementation](https://github.com/Frodo45127/rpfm/blob/a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f/rpfm_lib/src/files/bmd/mod.rs)

It decodes the sample's version-27 binary, consumes all 213,255 bytes, and
re-encodes byte-identically. The source contains 1,860 prop placements and 30
model keys. Transform matrices are native source evidence; no collision,
navigation, concealment, effective height or coordinate-frame claim follows.
Preserve large integer masks using an integer-safe JSON reader, such as Python.

The sample's deployment list is empty and its playable rectangle has
`has_been_set=false`. Neither becomes effective geometry. The separate XML
examples also contain unset/empty records. Generic `terrain/deployment/*.xml`
contains polygons but is **not yet bound** to an exact map variant. Do not
attach these templates to a battlefield by filename intuition.

## Reproduce

On the verified MSI installation, the PowerShell wrappers take the existing
shared research mutex, fail promptly if busy, and never write to game packs:

```powershell
scripts/discover-battlefield-source.ps1 -Output work/new-battlefield-discovery -Snapshot 9.0.1
scripts/extract-battlefield-probe.ps1 -Request request.json -Output work/new-battlefield-probe -Snapshot 9.0.1
```

Exact request paths are retained in each probe manifest. Reproduce a request
from its `request` member, not by feeding the whole manifest to the extractor.
Use an empty output directory. Discovery inventories `terrain`, `db` and `text`
from the merged vanilla source only. It does not establish full dependency closure.

Offline checks from the repository root:

```bash
node scripts/audit-battlefield-discovery.mjs
node --test scripts/test-battlefield-discovery.mjs
cargo build --locked --manifest-path scripts/battlefield-decoder/Cargo.toml --target-dir work/battlefield-decoder-target
python scripts/test_battlefield_decoder.py work/battlefield-decoder-target/debug/ctw-battlefield-decoder
python scripts/build_battlefield_probe.py --decoder work/battlefield-decoder-target/debug/ctw-battlefield-decoder --output work/decoded-field-probe
```

On Windows use the executable's `.exe` suffix. The Rust adapter requires a
compatible Rust toolchain; `Cargo.lock` pins transitive dependencies. Tests reject
bad signatures, unsupported versions, truncation and trailing bytes, and retain
unset geometry and 64-bit masks. Native decoded output remains under `work/`.
`audit-battlefield-discovery.mjs --map-index` provides bounded atlas-prefix
reconciliation records without loading raw asset lists into an agent's context.

## Evidence layout

- `discovery/`: immutable path inventories, source verification and atlas hash.
- `field-probe/`: exact original map/join tables and first field-family assets.
- `xml-probe/`: targeted XML, localization, one catchment binary and one height
  raster source for format investigation, not normalized geometry.
- `decoded-field-summary.json`: generated compact decoder checkpoint.

The source manifests hash 22 evidence files. Preserve exact bytes via the local
`.gitattributes`; the large decoded scene is reproducible and intentionally not
committed. The original server probe's `decoder_returned_unvalidated` label
records an `Unknown` response in `decoded-0.json`; the updated extractor now
classifies that response explicitly as `not_exposed_by_server`.

## Next implementation gate

Checkpoint validation: five discovery tests, five decoder tests and four atlas
variant-regression tests pass; the campaign validator passes with its existing
unresolved-group warning. Unit validation and its 15 tests also passed. The full
`npm run validate` attempt stopped in the unchanged skill-tree validator; a
separate retry also exited without a report while the container's out-of-memory
kill counter increased. This environment has an 8 GiB memory limit. The full
repository gate is therefore **not green** and must be rerun before review.

Resolve the sample's `tile_map.tiles` structure, tile placement transforms,
catchment-specific layer composition, effective deployment and playable bounds.
Decode height/terrain layers with their actual units and coordinate transforms.
Then build and visually validate an exact custom-battle variant evidence query.
The current asset decode is progress toward that first end-to-end checkpoint,
not its completion. Remaining representative maps, qualitative relations,
spatial validation and production integration remain as specified in #9.

Campaign encounter selection remains #29. Live outcome reports and tactical
interpretations remain in the Analysis repository.

## Tile-reference checkpoint following PR #32

PR #32 was independently reviewed at `71e2f7406de7133fc768fc860a1c81f15f0645ab`.
The reviewer found no blocking findings within its discovery/decoder scope;
they reproduced the five discovery, five decoder and four atlas-variant checks.
This does not establish full-repository validation or battlefield completeness.
The full validation gate still needs an environment with sufficient memory.

`composition-probe/` adds 15 hashed source files from the verified installation.
`composition-summary.json` is reproduced by `build_battlefield_composition.py`.
It contains experimental tile membership and scoped BMD results, not a production
layout. The reader's format assumptions are inferred from two independent raw
map fixtures, rather than an authoritative file-format specification.

| Source asset | Grid | Placements | Distinct tile paths | Occupied cells |
| --- | --- | --- | --- | --- |
| `chs_wastes_coast_a` | 64 × 64 | 6 | 6 | 1,536 |
| `def_plains_infield_a` | 80 × 80 | 25 | 4 | 6,400 |

Both index files contain three little-endian uint32 values: version 11, grid
width and grid height. Their `.tiles` files contain three grid-sized planes of
20-byte records, followed by two counted string tables. Only the first plane is
occupied in these fixtures; meanings of the three planes remain unresolved.
Positive signed references select a one-based path-table entry. Negative
references select a one-based anchor-cell address within the plane. Zero marks
an unoccupied cell. Grouping members yields rectangular footprints, independently
checked against the stored origin. Bounds in the summary use an exclusive upper
edge in **grid cells**, with no claimed conversion to world distance.

Each record is read as `i32, u8, u8, u16, u16, u16, u32, u32`.
The two middle u16 fields agree with the footprint origin. Other fields remain
opaque, including the anchor's last eight bytes. Byte 4 varies between 16, 32,
64 and 128 on the second map's anchors, while all its member values are 16;
therefore it must not be interpreted as tile size. Rotation, world transforms,
height offsets and plane semantics need independent verification. Raw files
remain the complete source; the generated report is a summary, not a lossless
replacement for every cell record.

Of 13 new BMD inputs, 12 decode and re-encode byte-for-byte. Coastal
`tile_11/bmd_data.bin` fails with unsupported `CompositeSceneReference` version 12.
The builder records this failure and does not emit a decoded asset for it.
It does not bypass the unsupported record or claim dependency closure.

`tile_11/catchment_01_layer_bmd_data.bin` explicitly sets a native playable
rectangle `(1088, 1536)`–`(2048, 2560)` and references
`prefabs/deployment_land_battle_1024x1024.bmd`, with its original transform and
uint64 identifier retained. This is **asset-local evidence**, not an effective
custom-battle boundary or deployment area. The deployment list in the layer is
empty; the prefab reference is a concrete next dependency to resolve. The current
discovery inventory covers terrain/db/text, so it does not establish whether this
prefab exists elsewhere in the merged packs. Missing `bmd_data.bin` paths for
other selected tiles likewise do not establish missing runtime content.

Reproduce the checkpoint into a fresh candidate directory:

```bash
npm run test:battlefield-tiles
python scripts/build_battlefield_composition.py --decoder work/battlefield-decoder-target/debug/ctw-battlefield-decoder --output work/new-composition
python scripts/test_battlefield_composition.py work/battlefield-decoder-target/debug/ctw-battlefield-decoder
```

Seven tile tests cover both grids, repeated tile paths, malformed references,
origin disagreement, truncated/trailing data, unsafe paths and unsupported index
headers. Four composition checks cover exact summary reproduction, explicit partial
decoder coverage, native boundary/prefab preservation and output guards. Existing
discovery, decoder and atlas-variant checks still pass. The default validation
chain includes the Python tile tests; composition tests require the separately
built Rust adapter. No generated production files change in this checkpoint.
