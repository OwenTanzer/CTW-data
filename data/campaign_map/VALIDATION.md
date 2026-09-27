# Campaign atlas validation

- Status: **passed**
- Atlas: `campaign_atlas__wh3__9.0.gpkg`
- Size: 17,199,104 bytes
- Regions / provinces / playable factions: 644 / 215 / 109
- Objectives / conditions: 1175 / 4074
- Battle maps / IE selection rules: 1645 / 2750

## Checks

- PASS: GeoPackage application ID — 1196444487
- PASS: GeoPackage user version — 10300
- PASS: SQLite integrity — "ok"
- PASS: Foreign-key violations — 0
- PASS: Battle-map source variants — []
- PASS: Campaign key — "wh3_main_combi"
- PASS: Campaign map revision — "wh3_main_combi_map_7"
- PASS: Patch — "9.0"
- PASS: Steam build — "25507028"
- PASS: Primary army start coverage — 109
- PASS: Primary army start uniqueness — 109
- PASS: Primary army points complete — 0
- PASS: All starting generals retained — 118
- PASS: Explicit maritime primary points — 4
- PASS: Human partner position exceptions — 5
- PASS: Army start regions resolve — 0
- PASS: Current IE regions — 644
- PASS: IE provinces — 215
- PASS: Playable IE factions — 109
- PASS: Region centroid features — 574 (70 black sea/special regions share one lookup colour and are intentionally non-spatial individually)
- PASS: Region ownership rows — 556
- PASS: Region/province orphan count — 72 (maritime/special regions intentionally have no province)
- PASS: Raster adjacency relations — 1316
- PASS: short objectives cover every playable faction — 109
- PASS: long objectives cover every playable faction — 109
- PASS: domination objectives cover every playable faction — 109
- PASS: Active source objectives, conditions, variants and boundaries reconcile — 1175
- PASS: Objectives have types — 0
- PASS: Region objective targets resolve — 0
- PASS: Province objective targets resolve — 0
- PASS: Battle selection rules — 2750
- PASS: Battle rules resolve groups — 0
- WARN: Battle rules without an exposed group map — 3 (Some engine-resolved catchment groups do not expose a direct group-map row)
- PASS: Embedded map assets — 4
- PASS: Embedded asset hash coverage — 4
- PASS: Source provenance entries — 83
- PASS: Source provenance hashes — 0
- PASS: GeoPackage region feature registration — 1

## Errors

- None.

## Warnings

- Battle rules without an exposed group map: got 3; Some engine-resolved catchment groups do not expose a direct group-map row
