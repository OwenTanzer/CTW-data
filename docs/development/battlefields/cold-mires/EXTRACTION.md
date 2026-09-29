# Source-to-hypothesis machinery

Scope: `chs_wastes_coast_a_01`, catchment 01, tile 11, candidate def_bleak
vegetation, game 9.0.1 / Steam build 25546563. Crop X[1088,2048),
Z[1536,2560). This is an explicit one-map hypothesis, not an automatic map selector.
Its crop and vegetation selection are inputs supported by earlier source evidence;
they are not runtime-certified outputs of the decoder.

## Rebuild offline

From the repository root (Python 3.10+):

```sh
python -m pip install -r scripts/cold_mires/requirements.txt
python scripts/cold_mires/build.py --output work/cold-mires-check
python scripts/cold_mires/render.py --dataset work/cold-mires-check --output work/cold-mires-check/map.png
python scripts/cold_mires/query_map.py --dataset work/cold-mires-check point 1820 1892
python scripts/cold_mires/test_map.py
python scripts/cold_mires/test_rebuild.py
```

Use a new output directory each time. The build only writes under `work/`.
The query and renderer read the committed dataset by default. NumPy is needed
for decoding/querying; Matplotlib is only needed for rendering. Raster samples
and JSON objects are compared exactly; PNG byte identity across rendering-library
versions is not guaranteed. The raster display samples every third source cell.

The repository already retains tile 11's ground source in `../xml-probe/`.
`source/supplemental.zip` adds only the four missing exact files: water height,
def_bleak tree list, base BMD (Battle Map Definition), and no-go BMD. No collection
index, other map family, Rust toolchain, scratch directory or unmerged branch is
required to rebuild. Every file must match its SHA-256 in `build_spec.json`.

## Re-extract from the game

Use the existing verified-install, read-only extraction wrapper on MSI:

```powershell
scripts/extract-battlefield-probe.ps1 -Request docs/development/battlefields/cold-mires/source-request.json -Output work/cold-mires-fresh-source -Snapshot 9.0.1
python scripts/cold_mires/build.py --source work/cold-mires-fresh-source --output work/cold-mires-fresh-build
```

The wrapper owns the shared research mutex, vanilla inventory checks, install
verification and extraction manifest. Read the parent battlefield README and
existing snapshot-source setup before using it on a new installation. The build
then checks the same five pinned hashes. A changed game file fails rather than
silently claiming compatibility with this snapshot. Original extraction history
is recorded in issue #39; the retained bytes permit offline verification.

## Interpretation chain

1. `native_height.py` decodes FASTBIN0 v3 TABLE_INDEXED uint16 samples and
   re-encodes each block exactly. It is the scoped optimized reader recovered
   from repository commit `0247f213f50c1ea2c216e39e715b8e52c91c203b` (closed PR #38).
   Compared with the older reader on main, it supports both observed packed-block
   padding forms and vectorizes decoding. The old shared reader is unchanged.
2. Header floats 1 and 4 are interpreted as low/high elevation, with
   `low + raw/65535*(high-low)`. Native X/Z map to source column/row as
   `coordinate/2 + 128`. These are coordinate/calibration hypotheses, supported
   by prior placement-height correlations, not engine-certified units.
3. Water minus ground feeds `classify_water.py`. Raw-zero water remains unknown.
   The conditional 0.5 cutoff comes from historical official mapmaking guidance:
   https://wiki.totalwar.com/w/TWWAKT_Making_a_Lake . The uncertainty band covers
   quantization only. Current rules, metre equivalence and passability are unverified.
4. `tree_list.py` consumes the complete FASTBIN0 v4 file, reading model groups
   and 18-byte placement records. XYZ are candidate coordinates; the remaining
   six bytes stay opaque. Re-encoding is byte-identical. Model paths distinguish
   spruce/reed/other; they do not establish canopy, collision or forest coverage.
5. `barrier_prefix.py` reads only the supported base BMD prefix: buildings,
   go outlines and non-terrain outlines. Its 699,004 bytes roundtrip exactly;
   the remaining 337,927 bytes are explicitly not decoded. For the hash-pinned
   no-go source, the empty prefix and three empty lists locate the terrain outline
   section without byte scanning; that section also re-encodes exactly.
   Layout reference: RPFM (Rusted PackFile Manager), MIT-licensed upstream commit
   `a4e0a69e0c1a7d948e9b34ef3769a3bb4bbdb66f`, `rpfm_lib/src/files/bmd/`.
6. `build.py` preserves complete polygon coordinates and filters vegetation and
   building origins to the crop. It does not compose alternate procedural sets,
   prefab collisions or go/no-go overrides. `query_map.py` reports evidence and
   unknown gameplay status; `render.py` illustrates those same files.

`build_spec.json` is the reviewed hypothesis configuration; generated data hashes
are refreshed by the builder. Source hashes are immutable expectations. The
manifest records retained bytes and interpretation assumptions separately.

## Consolidated live checks

- Register map orientation and coordinates using ridge 1, outcrop 18 and cluster 8.
- Walk ground units across/around outlines and through gaps. Compare body sizes
  and formation widths. Look for blockages outside the candidate polygons too.
- Compare shallow/deep candidates, including X1820 Z1892; record tooltip and
  actual crossing behavior independently of depth estimates.
- Compare spruce, reed-only ground and bare ground with the same Hide (forest)
  unit without Stalk. Compare reed-free shallow water to control for water effects.
- Check movement, melee effects and firing separately; verify missile obstruction
  and visibility from each relevant angle. Test large/Aquatic contrasts when useful.

These checks remain deferred under issue #39. Their absence does not invalidate
the extraction, but it prevents promotion to verified navigation or terrain rules.
