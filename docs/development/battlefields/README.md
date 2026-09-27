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
