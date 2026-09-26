# Campaign army starts — patch 9.0

Audit date: September 26, 2026 (UTC). Steam build 25507028 was checked against the installed Steam app manifest. This adds actual army positions for all 109 playable Immortal Empires factions; it does not invent capitals for the factions without one. The previous `faction_start_reference` view remains a capital reference.

Read `dataset_manifest.json`, `schema_inventory.csv`, `starting_positions_validation.json`, and `script_audit.md` before using these records. The main query is `SELECT * FROM faction_army_start_reference`; the atlas contains 118 generals, of which 109 match the faction's frontend leader subtype. Additional generals/Black Arks/camp commanders remain separate and do not redefine the primary start. Vlad/Isabella selection shares the same opening location; later hero replacement is outside the primary-army census.

`world_x/y` are the stored world-coordinate pair for unrelocated characters. `logical_x/y` are the distinct hex-grid coordinates used by scripts. They must not be mixed. For scripted destinations only, world coordinates use an independently fitted hex transform, with less than 0.0001 maximum residual across all 1,033 binary character points. All 572 settlement line-of-sight centers fall in their own uniquely colored atlas region. This verifies the existing atlas frame (0–961 by 0–748), palette convention and orientation. It is not evidence of movement turns or traversable borders.

`start_region_key` is a point-in-raster join. It is blank at four human primary points: Noctilus, Aislinn, Wulfrik, and relocated Eltharion. Their world points remain known. `nearest_land_region_key` and `nearest_land_distance` identify the closest land mask cell center for descriptive geography only; they are not the actual maritime region, ownership, a landing entitlement, or a route. Islands still use the atlas raster and adjacency limitations. No portal movement is assumed.

`binary_*` preserves the pre-script location. `script_rule_indexes` points to the zero-based declarative rules in `campaign_start_rules` and `source_exports/custom_start_rules.json`. The human default evaluates only that faction as human. For two-player work, apply `campaign_start_partner_overrides` by `(faction_key, partner_key)`. Five rows suppress Khazrak's default relocation when the partner is one of the five required AI factions. These rules apply to human multiplayer as well as human single-player; AI-only Aislinn/Wulfrik/Daemon Prince relocations do not overwrite human starts. `esf_offset` is a byte offset in the decompressed source, not a persistent campaign CQI. Stable faction and subtype keys identify entities; numeric character/force IDs are snapshot-local evidence.

The source exports retain 326 binary characters, including heroes. This is explicitly not a complete post-script hero census. No game was launched to validate runtime callback order or player choices. Later Gelt/Ostankya/Teclis relocation choices and travel systems remain optional campaign developments.

## Reproduction

Python standard library only, plus Node 24 for the existing atlas validator. Regenerate the original atlas with the parent README's extraction/build command, using the verified 9.0 map-7 source snapshot (do not reuse the old map-5 base). If only objective definitions changed, first rebind the compact committed evidence after exact comparisons of all geographic dependencies with the prior installed atlas. This writes a new work manifest without altering original evidence. If geographic dependencies differ, fresh extraction is required. Enrich the candidate as follows:

```powershell
python scripts/rebind-start-evidence.py --source data/campaign_map/starting_positions/source_exports --prior data/campaign_map/campaign_atlas__wh3__9.0.gpkg --atlas work/base.gpkg --output work/rebound-start-evidence
python scripts/build_campaign_starts.py --source work/rebound-start-evidence --atlas work/base.gpkg --output work/army-start-candidate
node scripts/validate-campaign-atlas.mjs work/army-start-candidate/campaign_atlas__wh3__9.0.gpkg work/army-start-candidate work/source_campaign_atlas__wh3__9.0
$env:CTW_STARTS_ATLAS = (Resolve-Path work/army-start-candidate/campaign_atlas__wh3__9.0.gpkg).Path
python scripts/test_campaign_starts.py
```

The builder refuses in-place mutation. Validate before copying the candidate into production. Two builds from the same base and evidence produce byte-identical GeoPackages and compact CSVs. Existing geographic rows are retained; schema and provenance are extended.

To refresh evidence, extract `script/campaign` and `db/frontend_faction_leaders_tables` from the installed CA packs using `scripts/rpfm-call-locked.ps1 extract_packed_files` (the same extraction mechanism used by the base atlas). Then run:

```powershell
python scripts/extract_campaign_starts.py --startpos "C:/Program Files (x86)/Steam/steamapps/common/Total War WARHAMMER III/data/campaigns/wh3_main_combi/startpos.esf" --steam-manifest "C:/Program Files (x86)/Steam/steamapps/appmanifest_1142710.acf" --atlas work/base.gpkg --frontend work/source/db/frontend_faction_leaders_tables/data__.tsv --scripts work/source/script/campaign --output work/start-evidence --patch 9.0
```

Raw binaries and broad script extracts stay in ignored `work/`. The repository reader uses the MIT ESF format reference credited in `scripts/campaign_esf_LICENSE.txt`; it does not vendor an editor or execute game scripts. Unknown layouts and failed joins stop extraction.
