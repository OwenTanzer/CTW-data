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

## Deployment dependency checkpoint

PR #32 merged at `5f49a881aa689b95120d446f884d6da5e56a1cf4`. PR #33 was
independently reviewed at `a7ed3666ddf2d92570951671aadc52412c72c75d`; its 25 bounded
checks passed and the reviewer found no blockers within the experimental scope.

`prefab-probe/` now resolves both referenced land and ambush deployment prefabs
from verified vanilla source. `catchments-probe/` retains the other six discovered
catchment layers for coastal `tile_11`. The bounded extractor permits the
`prefabs/` root with the same path validation and source verification as terrain.
These targeted extractions do not expand the original discovery inventory.

`deployment-summary.json` joins each decoded layer to its exact prefab key and
retains native category, zone/region indices, boundary type, points, orientation,
instance transform and uint64 identifier. Native deployment has two forms here:

| Layer | Source of deployment | Decoder status |
| --- | --- | --- |
| catchment 01 | land prefab, identity rotation/scale block | exact roundtrip |
| catchment 02 | land prefab, identity rotation/scale block | exact roundtrip |
| catchment 08 | direct `DAC_RIVER` polygons | exact roundtrip |
| catchment 12 | ambush prefab, rotated matrix | exact roundtrip |
| catchment 13 | land prefab, rotated matrix | exact roundtrip |
| catchment 14 | land prefab, rotated matrix | exact roundtrip |
| catchment 20 | unavailable to the pinned decoder | unsupported `CompositeSceneReference` version 12 |

All prefab instances have nonzero translation. Eight of nine inputs
(two prefabs plus seven layers) round-trip exactly. All five decoded prefab
references resolve within this bounded source set. This does not establish all
scene dependencies, including the unsupported catchment 20 asset.

The builder also emits **conditional projections**, explicitly separate from
runtime-verified geometry. It assumes source 2D polygon `(x,y)` lies in prefab
3D `(x,z)`, and applies the horizontal row-vector matrix:

```
projected_x = x*m00 + y*m20 + m30
projected_y = x*m02 + y*m22 + m32
```

The pinned library's `prefab_instance_list/mod.rs` exporter uses `m30,m31,m32`
as placement position. That supports the translation-field interpretation; it
does not prove the complete game coordinate convention or tile-to-world mapping.
The projections are diagnostic hypotheses. Tilt, perspective, singular or
nonfinite transforms fail; unresolved instance conditions are not projected.
Zone indices are not assigned attacker/defender/alliance identities, and the
source region orientation is retained without interpreting it as another polygon
rotation.

For catchment 01, both standard boundaries remain inside its set rectangle
under this projection. Each guerrilla-exclusion boundary has six vertices outside,
reaching x=1056 while the rectangle starts at x=1088. These points are preserved.
They are neither silently clipped nor asserted to be game-data errors; engine
clipping, coordinate conventions and runtime selection still require verification.
Raw floating-point values are retained, including small rotation residuals.

```bash
python scripts/build_battlefield_deployment.py --decoder work/battlefield-decoder-target/debug/ctw-battlefield-decoder --output work/new-deployment
python scripts/test_battlefield_deployment.py work/battlefield-decoder-target/debug/ctw-battlefield-decoder
```

Seven new checks cover exact report reproduction, dependency resolution and
uint64 identity, direct river deployment, preservation of out-of-bounds points,
translation/rotation convention, unsupported matrices and output guards. The
five discovery and four composition checks also pass after this increment.
Full-repository validation retains the previously documented memory limitation.
Next: bind these layers to an exact selectable custom-battle variant, verify
world-coordinate placement and runtime deployment, and decode terrain/height.

## Connection and evidence assembly interface

PR #34 merged at `f49e505f7318bf10cda4cfc9fd03127de92b6230`, after an independent
review of `800ce1d918efaef233cf74d1f7a86885f7f04e47` found no blockers and passed
16 relevant checks. Its source polygons feed the connection builder below.

`build_battlefield_assembly.py` produces an indexed SQLite **development** database
under `work/`. This is evidence-packet assembly: world-coordinate spatial assembly
remains unresolved. It projects the 1,319 existing `battles_tables` records through
their atlas identities and does not establish 1,319 playable maps or menu entries.
It does not create an alternative canonical map catalog.

```bash
python scripts/build_battlefield_assembly.py --decoder work/battlefield-decoder-target/debug/ctw-battlefield-decoder --output work/battlefield-connections
python scripts/query_battlefield.py --database work/battlefield-connections/battlefield_connections.sqlite --select chs_wastes_coast_a_01 --mode singleplayer
python scripts/query_battlefield.py --database work/battlefield-connections/battlefield_connections.sqlite --select 'Cold Mires – Chaos Coast'
python scripts/query_battlefield.py --database work/battlefield-connections/battlefield_connections.sqlite --select terrain/battles/chs_wastes_coast_a
python scripts/test_battlefield_assembly.py work/battlefield-decoder-target/debug/ctw-battlefield-decoder
```

The first two selectors return the same exact configured variant. The third
returns 12 candidates, never a silently selected catchment. A selector can be a
versioned variant key, atlas `battle:` key, original battle key, exact localized
label or shared specification path. Mode filters apply the source's release and
singleplayer/multiplayer flags; these are configuration, not observed menu
availability. Unknown selections return `not_found`.

### Version 1 connection contract

- Variant identity is `battlefield-v1:` plus SHA-256 of canonical JSON
  `[atlas_map_key, catchment_name, tile_upgrade]`, with missing selectors as null.
  These are source-configured identities; unrelated source changes do not rename
  them. Schema/method changes require a new version. Each packet retains the
  pinned atlas hash, source build and original source keys through its provenance.
- Each battle row must join exactly to `battle:<source key>` with matching raw
  specification, catchment, tile upgrade and battle type. A mismatch fails the
  build. Labels never establish identity.
- Atlas group relations join through exact source map location **and** exact
  catchment/tile-upgrade qualifiers. Returned relations retain all four fields
  `(battle_group_key, battle_map_key, catchment_name, tile_upgrades)`, including
  nulls. A `location:` relation is not rewritten as a `battle:` relation. These
  are source selector matches, not proof of campaign selection or runtime mode.
- Decoded tile membership supplies exact tile paths. A candidate layer must
  exist in the verified inventory with the exact requested catchment filename.
  This binding rule is named in every candidate and explicitly lacks engine
  selection verification. Nonempty tile upgrades remain unresolved; they never
  inherit the unqualified geometry.
- Connected assets retain source hashes, decode status, native polygons and
  prefab references. Conditional projections remain inside the source evidence;
  `effective_geometry.status` stays `unresolved` with a null coordinate frame.
  A missing decoder result never becomes an empty playable battlefield.

The SQLite `variants` table has unique variant, atlas and source battle keys,
indexed labels/specifications, configured availability, and a JSON packet.
`metadata` contains the versioned manifest. Packets include selectors, original
atlas relations, tile membership, candidate catchment bindings, decoded/failing
source layers, resolved prefab evidence, and explicit missing/unresolved layers.
The query returns `resolved_configured_variant`, `ambiguous` or `not_found`;
resolution of identity does not mean resolution of geometry. This nested evidence
interface is provisional; normalized spatial features and qualitative relations
remain required for production promotion.

`assembly-summary.json` records reproducible coverage. Four battle records connect
to decoded source layers: `chs_wastes_coast_a_01`, `_02`, `_08` and `_12`. Sayl's
`wh3_dlc27_qb_nor_sayl_final_battle` connects to catchment 20's explicit decoder
failure. The remaining coastal variants expose inventory candidates without
invented geometry. Catchments 13/14 are not custom-battle rows in this source
snapshot and are not manufactured as selectable variants. There are currently
**zero verified effective world layouts** in this interface.

The builder re-audits atlas/source hashes, rebuilds deployment evidence and checks
SQLite integrity. Nine tests cover key/label agreement, ambiguity, missing and
unsupported layers, wrong-variant isolation, complete atlas relation identity,
source selector drift, tile-upgrade isolation, mode rejection and deterministic
rebuilds. Database hashes reproduce within the tested SQLite environment; a
cross-version SQLite byte-stability guarantee is not claimed. Seven deployment
regressions also pass. Full validation retains the documented memory limitation.

Next spatial work: establish tile-to-world transforms and terrain raster alignment
for an exact resolved record, then validate the assembled layout visually. Source
binding alone cannot establish those transforms. Production promotion, settlement
coverage and structured qualitative feature relations remain outstanding.

## Native height decoding and conditional coordinate assembly

PR #35 was independently reviewed at `a734620c14f66d0183a2b530832b7b861cf200bd`:
25 bounded checks passed with no blocking findings. This follow-up adds terrain
sources and a coordinate hypothesis to its development connection packets.

`height-probe/` retains adjacent coastal tile 12 and tile 21 height rasters.
Together with tile 11 in `xml-probe/`, three independent files now decode through
`battlefield_height.py`. Each is FASTBIN0 version 3, TABLE_INDEXED, 2304 × 2304
uint16 samples in 20,736 blocks of 16 × 16. The inferred codec supports constant,
palette-indexed, base-plus-packed-delta and direct uint16 blocks. Each decoded
block is re-encoded with its original representation; all three complete sources
round-trip byte-for-byte. Offsets, lengths, palette indices, padding, sample
range and complete input consumption are checked. This is an experimental reader
inferred from retained sources, not an authoritative engine format definition.

`build_battlefield_terrain.py` compares 24 horizontal scale/offset/reflection
hypotheses against 702 absolute prop placements from the independently decoded
tile 21 scene. The tested mapping `sample = native_position / 2 + 128` without
reflection yields Pearson r≈0.97675 and median height residual ≈−0.665 native
units. The height conversion in this comparison interprets opaque header floats
1/4 as minimum/maximum and interpolates the uint16 sample range. Absolute prop
placement height need not equal ground height, so this correlation supports a
coordinate hypothesis rather than proving engine behavior. Comparisons retain
the number of in-bounds props; different coverage must not be silently treated
as equal evidence. Terrain-relative props have zero stored height here and are
not used as ground-height observations.

The conditional mosaic uses 128 samples per tile-grid cell, crops a 128-sample
border, assumes orientation tag 16 is unrotated, and places tile cores using their
decoded grid bounds. This produces a 4096 × 4096 sample mosaic with 12,582,912
covered samples and 4,194,304 unknown samples. Unknowns remain **NaN plus an
explicit false coverage mask**, never flat terrain. Other orientation tags and
overlapping placements fail rather than receive invented transforms. Opaque
anchor-tail fields are deliberately unapplied; their meaning and engine blending
remain unresolved. The two sampled seam differences have median absolute values
approximately 0.90 and 1.83 under this hypothesis, with larger local discrepancies;
these are diagnostics, not certified seamless world assembly.

```bash
python scripts/build_battlefield_terrain.py --decoder work/battlefield-decoder-target/debug/ctw-battlefield-decoder --output work/new-terrain
python scripts/test_battlefield_height.py work/battlefield-decoder-target/debug/ctw-battlefield-decoder
```

NumPy is required. Outputs include native uint16 `.npy` rasters, a conditional
float32 mosaic, its coverage mask and `summary.json`. `terrain-summary.json`
is the committed reproducible summary. The connection builder now invokes this
stage and attaches exact tile-path-matched raster evidence, candidate alignment
and bounded artifact references to relevant variant packets. All packets still
mark effective world alignment unverified. Production datasets remain unchanged.

Eight tests cover the three exact raster roundtrips, report reproduction, codec
families, corrupt blocks/headers, reflection discrimination, unknown coverage and
unsupported orientation. Nine connection regressions also pass. The full
repository validation retains its previously documented memory limitation.

A local diagnostic rendering was inspected for block discontinuities and explicit
missing regions; it is not a comparison against a game/source preview. Remaining
work is to resolve world origin, opaque placement adjustments, layer transforms
and engine blending, and then compare effective deployment/terrain alignment
against source previews or accessible game views. Do not advertise this candidate
as a verified playable world layout or derive tactical terrain effects from it.
