# Immortal Empires campaign atlas

`campaign_atlas__wh3__9.0.gpkg` is the compact, machine-readable campaign reference for Total War: Warhammer III Immortal Empires on patch 9.0 / Steam build 25507028. It is a GeoPackage 1.3 SQLite database and should not be edited by hand.

## Coverage

- 644 current-map region records and 215 provinces from `wh3_main_combi_map_7`.
- DB scenario ownership and capital relations, with 109 playable faction identities; capital geometry is reported separately in the atlas. Capital placement is not an army start.
- Actual binary primary-general positions for all 109 factions, 118 generals including secondary forces, and separately evaluated human startup relocations. See [starting positions](starting_positions/README.md).
- Exact color-coded raster masks, derived centroids, and raster-border adjacency for 574 regions.
- 1,175 configured initial single-player short/long/domination victory objectives and 4,074 typed conditions across 109 factions / 110 variants. Vlad and Isabella retain distinct lord selectors.
- 1,645 battle-map records, 1,136 group/map/catchment/tile variants and 2,750 Immortal Empires catchment-selection rules.
- Route, area-of-interest, and teleportation nodes and links.
- Embedded region lookup, overview, height, and native-border assets.
- SHA-256 provenance for every source file used by the build.

The `coverage` and `evidence` tables are part of the atlas. Known boundaries are explicit: 70 black maritime/special regions share one lookup color and therefore have no individual raster geometry. The new ESF source supplies army points independently of those masks. Human startup positions are statically evaluated from source, not runtime observations. The binary campaign-coordinate-to-battle-area catchment overlay is not yet decoded. Battle-area rules and their map groups are still preserved exactly.

## Important tables and views

- `regions`, `provinces`, `factions` — canonical map and turn-one scenario state.
- `faction_army_start_reference`, `campaign_army_starts`, `campaign_start_partner_overrides` — primary human start points, all generals, and partner-specific changes; separate from the preserved capital view.
- `region_points`, `region_adjacency`, `region_groups` — spatial and topological reference.
- `strategic_nodes`, `strategic_links` — routes, areas of interest, and teleportation.
- `objectives`, `objective_conditions`, `objective_boundaries` — initial short, long, and domination requirements. Filter `variant_key`; read per-objective runtime boundaries. Conditions remain ordered relational rows.
- `battle_areas`, `battle_groups`, `battle_maps`, `battle_selection_rules` — the campaign-to-battle bridge.
- `map_assets`, `source_files`, `evidence`, `coverage` — embedded assets, hashes, provenance, and limitations.
- `region_reference`, `faction_start_reference`, `objective_reference`, `region_objective_pressure`, `battle_context_reference` — denormalized query views.

All ordinary tables are readable with a standard SQLite client. Spatial software can additionally read `region_points` as a GeoPackage feature layer in the game's custom logical coordinate system.

Example with Node.js 24:

```js
import { DatabaseSync } from "node:sqlite";

const atlas = new DatabaseSync("data/campaign_map/campaign_atlas__wh3__9.0.gpkg", {
  readOnly: true,
});

const neighbors = atlas.prepare(`
  SELECT rr.region_key, rr.region_name, rr.start_owner_name
  FROM region_adjacency a
  JOIN region_reference rr
    ON rr.region_key = CASE
      WHEN a.region_a = ? THEN a.region_b ELSE a.region_a
    END
  WHERE a.region_a = ? OR a.region_b = ?
  ORDER BY rr.region_name
`).all(
  "wh3_main_combi_region_altdorf",
  "wh3_main_combi_region_altdorf",
  "wh3_main_combi_region_altdorf",
);
```

## Victory objective interpretation

Read `objective_manifest.json` and `objective_schema.json`. The active 9.0 configuration replaces the obsolete generic/subculture composition. `variant_key` is normally the faction key; for `wh_main_vmp_schwartzhafen`, select `wh_dlc04_vmp_vlad_con_carstein` or `wh_pro02_vmp_isabella_von_carstein`. Never combine their requirements into a single victory.

The bounded parser does not execute Lua. It preserves helper-generated conditions, including zero initial counts. `objective_boundaries` records scripted completion listeners whose state is not evaluated, runtime unit-size multiplication (the numeric value stays null), and Archaon's later chosen-path additions. This dataset represents initial configured requirements, not every subsequent effective campaign objective. Rewards, crisis simulation and multiplayer objectives remain excluded.

Compact verified source evidence lives in `objective_source_exports/`; use it for audits, not normal retrieval. Its manifest includes the active configuration, helper definitions, Archaon dependency and the legacy dispatch bypass. The validator reconciles every objective, condition, variant and boundary; independent mutation tests reject the old generic output and omitted requirements.

## Rebuild and validation

Run from the repository root:

```powershell
node scripts/extract-campaign-atlas-source.mjs work/source_campaign_atlas__wh3__9.0 9.0
node scripts/build-campaign-atlas.mjs work/source_campaign_atlas__wh3__9.0 work/generated_campaign_atlas__wh3__9.0/campaign_atlas__wh3__9.0.gpkg
node scripts/validate-campaign-atlas.mjs work/generated_campaign_atlas__wh3__9.0/campaign_atlas__wh3__9.0.gpkg work/generated_campaign_atlas__wh3__9.0 work/source_campaign_atlas__wh3__9.0
```

Only install the generated candidate under `data/campaign_map/` after validation reports `passed` with no errors.

The command above generates schema 1.3 geography and active objective definitions, plus `objective_manifest.json` and `objective_schema.json`. Apply the [starting-position enrichment](starting_positions/README.md) before promotion; it preserves schema 1.3. Install the matching objective evidence and metadata with the validated atlas. Run `npm run test:victory` against the installed snapshot.

## Battle-map variant repair

Schema 1.3 retains each `(battle_group_key, battle_map_key, catchment_name, tile_upgrades)` relation. A map/group pair can have several catchments; do not deduplicate on that pair. `battle_context_reference.catchment_name` comes from the group relation, and `map_tile_upgrades` preserves its qualifier separately from the rule requirement. The map catalog's catchment field is not a substitute for the relation-specific value.

The previous pair-only key collapsed 610 source variants (526 rows instead of 1,136). Compact unmodified evidence in `battle_source_exports/` is checked against the atlas source hash and every relation by validation. `npm run test:battle-maps` rejects pair-only collapse and loss of tile qualifiers. Geographic rows, starting armies and objectives are unchanged by this repair.
