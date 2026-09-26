# Campaign atlas validation

- Status: **passed**
- Atlas: `campaign_atlas__wh3__8.1.1.gpkg`
- Size: 15,536,128 bytes
- Regions / provinces / playable factions: 641 / 214 / 104
- Objectives / conditions: 749 / 2388
- Battle maps / IE selection rules: 1533 / 1348

## Checks

- PASS: GeoPackage application ID — 1196444487
- PASS: GeoPackage user version — 10300
- PASS: SQLite integrity — "ok"
- PASS: Foreign-key violations — 0
- PASS: Campaign key — "wh3_main_combi"
- PASS: Campaign map revision — "wh3_main_combi_map_5"
- PASS: Patch — "8.1.1"
- PASS: Steam build — "24237342"
- PASS: Primary army start coverage — 104
- PASS: Primary army start uniqueness — 104
- PASS: Primary army points complete — 0
- PASS: All starting generals retained — 109
- PASS: Explicit maritime primary points — 4
- PASS: Human partner position exceptions — 5
- PASS: Army start regions resolve — 0
- PASS: Current IE regions — 641
- PASS: IE provinces — 214
- PASS: Playable IE factions — 104
- PASS: Region centroid features — 571 (70 black sea/special regions share one lookup colour and are intentionally non-spatial individually)
- PASS: Region ownership rows — 553
- PASS: Region/province orphan count — 72 (maritime/special regions intentionally have no province)
- PASS: Raster adjacency relations — 1317
- PASS: short objectives cover every playable faction — 104
- PASS: long objectives cover every playable faction — 104
- PASS: domination objectives cover every playable faction — 104
- PASS: Objectives have types — 0
- PASS: Region objective targets resolve — 0
- PASS: Province objective targets resolve — 0
- PASS: Battle selection rules — 1348
- PASS: Battle rules resolve groups — 0
- WARN: Battle rules without an exposed group map — 3 (Some engine-resolved catchment groups do not expose a direct group-map row)
- PASS: Embedded map assets — 4
- PASS: Embedded asset hash coverage — 4
- PASS: Source provenance entries — 84
- PASS: Source provenance hashes — 0
- PASS: GeoPackage region feature registration — 1

## Errors

- None.

## Warnings

- Battle rules without an exposed group map: got 3; Some engine-resolved catchment groups do not expose a direct group-map row
