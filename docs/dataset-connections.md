# Cross-dataset connection contracts

<!-- Generated from dataset_connections.json by scripts/validate_architecture.py. -->

These are selected structural contracts, not a complete foreign-key inventory.
Owner manifests/schemas remain authoritative. `production` means the represented
source relation exists; it does not mean runtime behavior is verified.
`partial` retains existing joins plus explicit gaps; `unresolved` supplies no
complete production edge. Never turn unmatched rows into zero/false.

For responsibility boundaries, read [repository architecture](architecture/repository-boundaries.md).

Audited Data commit: `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

Proposed owner **capability_routes**: A separate capability/recruitment relation owner is proposed; no production path or complete graph is assigned. Reuse economy, technology, skill and unit identities without overloading economy CSVs. See [owning issue](https://github.com/OwenTanzer/CTW-data/issues/1).

## skill-effects-to-abilities

Owner: **magic**. Status: **partial**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `magic_characters` | [data/magic/character_index.csv](../data/magic/character_index.csv) | `agent_subtype_key`, `path`, `skill_source_path`, `relation_count`; agent_subtypes.key; paths point to derived index and skill owner |
| `skill_effects` | `data/skill_trees/characters/*/*.csv` | `record_type`, `agent_subtype_key`, `node_set_key`, `skill_key`, `skill_level`, `effect_key`, `effect_scope`, `effect_value`; agent_subtypes.key / character skill / effect |
| `ability_bindings` | [data/effect_semantics/tables/ability_bindings.csv](../data/effect_semantics/tables/ability_bindings.csv) | `effect`, `bonus_value_id`, `unit_ability`; native effect_bonus_value_unit_ability_junctions_tables |
| `ability_definitions` | [data/unit_stats/abilities/tables/ability_definitions.csv](../data/unit_stats/abilities/tables/ability_definitions.csv) | `key`, `requires_effect_enabling`, `overpower_option`; native unit_abilities_tables |

**Join edges:** `magic_characters.(agent_subtype_key)` → `skill_effects.(agent_subtype_key)`; `skill_effects.(effect_key)` → `ability_bindings.(effect)`; `ability_bindings.(unit_ability)` → `ability_definitions.(key)`

**Cardinality:** One character has many conditional skill/rank effects; an effect can have many typed bindings.

**Conditions:** Filter record_type=effect; preserve subtype, node set, rank, effect_scope, value and binding bonus_value_id. Other binding families use their own owner schema. Never add successive ranks or treat group cost modifiers as grants.

**Missing boundary:** Item/trait/script acquisition, build legality and runtime stacking remain incomplete. A missing indexed route does not establish inability to cast.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

```bash
python3 scripts/query_magic.py --character 'Mage (High)' --ability wh2_main_spell_high_magic_apotheosis
```

Evidence: [data/magic/README.md](../data/magic/README.md); [data/magic/coverage.json](../data/magic/coverage.json); [data/magic/input_lock.json](../data/magic/input_lock.json); [data/magic/shared_source_comparison.json](../data/magic/shared_source_comparison.json); [docs/development/magic/validation.json](../docs/development/magic/validation.json).

Scope references: [#7](https://github.com/OwenTanzer/CTW-data/issues/7), [#14](https://github.com/OwenTanzer/CTW-data/issues/14), [#31](https://github.com/OwenTanzer/CTW-data/issues/31).

## technology-effects-to-bindings

Owner: **effect_semantics**. Status: **partial**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `technology_effects` | `data/technology_trees/factions/*/*.csv` | `record_type`, `faction_key`, `variant_key`, `technology_key`, `effect_key`, `effect_scope`, `target_type`, `target_key`; faction / variant / technology / effect; target_type selects namespace |
| `ability_bindings` | [data/effect_semantics/tables/ability_bindings.csv](../data/effect_semantics/tables/ability_bindings.csv) | `effect`, `bonus_value_id`, `unit_ability`; native effect_bonus_value_unit_ability_junctions_tables |
| `ability_definitions` | [data/unit_stats/abilities/tables/ability_definitions.csv](../data/unit_stats/abilities/tables/ability_definitions.csv) | `key`, `requires_effect_enabling`, `overpower_option`; native unit_abilities_tables |

**Join edges:** `technology_effects.(effect_key)` → `ability_bindings.(effect)`; `ability_bindings.(unit_ability)` → `ability_definitions.(key)`

**Cardinality:** Many contextual technology effect occurrences to zero or many native bindings.

**Conditions:** Choose faction and variant_key, filter record_type=effect, retain effect_scope and value. A native binding is candidate target evidence, not acquired research or active modifier.

**Missing boundary:** No complete technology-to-effective-stat resolver. Non-ability effects require other bindings; absent binding means unresolved coverage, not no effect.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

Filter the selected technology file to effect rows; left-match effect_key to ability_bindings.effect and retain unmatched effects explicitly. Expand every match; keep other native binding families separate.

Evidence: [data/technology_trees/README.md](../data/technology_trees/README.md); [data/technology_trees/script_audit.json](../data/technology_trees/script_audit.json); [data/technology_trees/audit_report.json](../data/technology_trees/audit_report.json); [data/effect_semantics/README.md](../data/effect_semantics/README.md).

Scope references: [#7](https://github.com/OwenTanzer/CTW-data/issues/7).

## unit-components-weapons-payloads

Owner: **units**. Status: **partial**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `unit_profiles` | `data/unit_stats/normalized/*.csv` | `unit_key`, `source_land_unit_key`, `subculture_key`; main_units.unit / land_units.key; roster qualified |
| `unit_components` | [data/unit_stats/lookups/unit_components__wh3__9.0__ultra.csv](../data/unit_stats/lookups/unit_components__wh3__9.0__ultra.csv) | `unit_key`, `component_role`, `relationship_key`, `battle_entity_key`; main unit / component / battle entity |
| `weapon_links` | [data/unit_stats/lookups/unit_weapon_links__wh3__9.0__ultra.csv](../data/unit_stats/lookups/unit_weapon_links__wh3__9.0__ultra.csv) | `unit_key`, `component_role`, `slot`, `missile_weapon_key`, `projectile_key`, `ammunition_pool`; main unit / weapon / projectile |
| `projectiles` | [data/unit_stats/lookups/projectiles__wh3__9.0.csv](../data/unit_stats/lookups/projectiles__wh3__9.0.csv) | `projectile_key`, `explosion_key`, `shrapnel_key`, `spawned_vortex`; projectiles.key |
| `explosions` | [data/unit_stats/lookups/explosions__wh3__9.0.csv](../data/unit_stats/lookups/explosions__wh3__9.0.csv) | `explosion_key`, `shrapnel_key`, `contact_phase_effect`; projectiles_explosions.key |

**Join edges:** `unit_profiles.(unit_key)` → `unit_components.(unit_key)`; `unit_profiles.(unit_key)` → `weapon_links.(unit_key)`; `weapon_links.(projectile_key)` → `projectiles.(projectile_key)`; `projectiles.(explosion_key)` → `explosions.(explosion_key)`

**Cardinality:** A main-unit key occurs in multiple rosters; one unit has multiple components/weapon slots; one projectile has an optional primary explosion plus secondary graph edges.

**Conditions:** Resolve unit_key before joining; avoid multiplying attacks by duplicate roster rows. Preserve component_role, slot and ammunition_pool. Inline default-projectile columns are a projection, not a second weapon. The example covers the primary chain, not exhaustive payload closure.

**Missing boundary:** Firing arcs, animation/cycle nesting, collision and crew targetability are not all established. Shared graph expansion must retain branch edges and cycles.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

Select one exact unit_key; retain every weapon_links row. Left-join nonblank projectile_key, then explosion_key. Distinguish a blank optional reference from a nonblank unresolved reference; never infer damage per second from reload alone.

Evidence: [data/unit_stats/README.md](../data/unit_stats/README.md); [data/unit_stats/audit_report.json](../data/unit_stats/audit_report.json); [data/magic/payload_baseline_comparison.json](../data/magic/payload_baseline_comparison.json).

Scope references: [#11](https://github.com/OwenTanzer/CTW-data/issues/11), [#31](https://github.com/OwenTanzer/CTW-data/issues/31).

## qualified-unit-abilities

Owner: **shared_abilities**. Status: **partial**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `unit_ability_links` | [data/unit_stats/lookups/unit_abilities__wh3__9.0__ultra.csv](../data/unit_stats/lookups/unit_abilities__wh3__9.0__ultra.csv) | `unit_key`, `ability_key`, `culture_key`; main unit / unit ability / culture |
| `ability_definitions` | [data/unit_stats/abilities/tables/ability_definitions.csv](../data/unit_stats/abilities/tables/ability_definitions.csv) | `key`, `requires_effect_enabling`, `overpower_option`; native unit_abilities_tables |
| `ability_phases` | [data/unit_stats/abilities/tables/ability_phase_links.csv](../data/unit_stats/abilities/tables/ability_phase_links.csv) | `order`, `special_ability`, `target_self`, `target_friends`, `target_enemies`, `phase`; native special_ability_to_special_ability_phase_junctions_tables |

**Join edges:** `unit_ability_links.(ability_key)` → `ability_definitions.(key)`; `ability_definitions.(key)` → `ability_phases.(special_ability)`

**Cardinality:** One unit has many culture-qualified abilities; an ability has multiple ordered recipient-qualified phase links.

**Conditions:** Keep (unit_key, ability_key, culture_key); * is literal wildcard. Phase identity includes order and all recipient flags, not only ability/phase. Retain requires_effect_enabling.

**Missing boundary:** A link is not proof that its condition is active; runtime timing, stacking and activation remain qualified.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

Filter unit_ability_links by exact unit_key and preserve all cultures. Join ability_key=key; expand phases retaining order/target_self/target_friends/target_enemies. Return missing definitions explicitly.

Evidence: [data/unit_stats/abilities/schema_inventory.json](../data/unit_stats/abilities/schema_inventory.json); [data/unit_stats/abilities/README.md](../data/unit_stats/abilities/README.md); [docs/development/magic/validation.json](../docs/development/magic/validation.json).

Scope references: [#7](https://github.com/OwenTanzer/CTW-data/issues/7), [#31](https://github.com/OwenTanzer/CTW-data/issues/31).

## land-unit-to-main-unit

Owner: **units**. Status: **production**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `unit_profiles` | `data/unit_stats/normalized/*.csv` | `unit_key`, `source_land_unit_key`, `subculture_key`; main_units.unit / land_units.key; roster qualified |

**Join edges:** No direct cross-table edge asserted.

**Cardinality:** Many main-unit/roster identities can reference one land-unit identity.

**Conditions:** source_land_unit_key is a land_units key; unit_key is a main_units key. Multiple forms and roster appearances are not aliases by default.

**Missing boundary:** No campaign availability or mount unlock follows from this mapping. Source-only summoned land units may lack a normalized roster match.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

Filter source_land_unit_key in the selected normalized roster(s), return every distinct unit_key and its roster context. Never equate a summon land-unit key with unit_key.

Evidence: [data/unit_stats/schema_inventory__v4.csv](../data/unit_stats/schema_inventory__v4.csv); [data/unit_stats/audit_report.json](../data/unit_stats/audit_report.json); [data/magic/README.md](../data/magic/README.md).

Scope references: [#1](https://github.com/OwenTanzer/CTW-data/issues/1), [#31](https://github.com/OwenTanzer/CTW-data/issues/31).

## campaign-capability-routes

Owner: **capability_routes**. Status: **unresolved**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `buildings` | `data/economy/factions/*/*.csv` | `faction_key`, `campaign_key`, `building_key`, `required_building_key`; building_levels.level_name / faction / campaign |
| `technology_effects` | `data/technology_trees/factions/*/*.csv` | `record_type`, `faction_key`, `variant_key`, `technology_key`, `effect_key`, `effect_scope`, `target_type`, `target_key`; faction / variant / technology / effect; target_type selects namespace |
| `unit_profiles` | `data/unit_stats/normalized/*.csv` | `unit_key`, `source_land_unit_key`, `subculture_key`; main_units.unit / land_units.key; roster qualified |

**Join edges:** No direct cross-table edge asserted.

**Cardinality:** Proposed capability routes are many-to-many with AND/OR gates; no complete normalized route layer exists.

**Conditions:** Economy owns building_levels identities; technologies own variant-specific unlock/reward conditions; units own roster permissions. target_type determines target namespace.

**Missing boundary:** Ordinary/special recruitment, stock, capacities and propagation are not a complete production graph. Do not substitute multiplayer cost, tier or roster inclusion for recruitment legality.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

Use existing building and technology records as evidence for a requested route, then return status=unresolved for the missing recruitment edge. Do not join building_key directly to unit_key.

Evidence: [data/economy/README.md](../data/economy/README.md); [data/technology_trees/README.md](../data/technology_trees/README.md); [data/technology_trees/schema_inventory__v2.csv](../data/technology_trees/schema_inventory__v2.csv); [data/unit_stats/README.md](../data/unit_stats/README.md).

Scope references: [#1](https://github.com/OwenTanzer/CTW-data/issues/1), [#7](https://github.com/OwenTanzer/CTW-data/issues/7).

## campaign-rules-to-battlefield

Owner: **campaign_map**. Status: **partial**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `battle_rules` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`battle_selection_rules`) | `rule_id`, `area_key`, `battle_group_key`, `required_tile_upgrades`; snapshot-local rule_id / area / group |
| `group_maps` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`battle_group_maps`) | `battle_group_key`, `battle_map_key`, `catchment_name`, `tile_upgrades`; qualified group/map/catchment/tile relation |
| `battle_maps` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`battle_maps`) | `battle_map_key`, `map_location`; battle map database key / asset selector |

**Join edges:** `battle_rules.(battle_group_key)` → `group_maps.(battle_group_key)`; `group_maps.(battle_map_key)` → `battle_maps.(battle_map_key)`

**Cardinality:** Rule to zero/many qualified group-map rows; map identity is not a unique playable layout.

**Conditions:** Use full (battle_group_key,battle_map_key,catchment_name,tile_upgrades) relation identity with null-safe uniqueness. rule_id is snapshot-local. Asset prefixes return candidates only.

**Missing boundary:** Campaign-coordinate catchment resolution (#29) and effective world geometry (#9/#37) are separate gaps. Cold Mires is a development hypothesis, not a production spatial owner.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

```sql
SELECT r.rule_id, r.battle_group_key, g.battle_map_key, g.catchment_name, g.tile_upgrades FROM battle_selection_rules r LEFT JOIN battle_group_maps g ON g.battle_group_key=r.battle_group_key WHERE r.rule_id=1;
```

Evidence: [data/campaign_map/README.md](../data/campaign_map/README.md); [data/campaign_map/validation_report.json](../data/campaign_map/validation_report.json); [docs/development/battlefields/README.md](../docs/development/battlefields/README.md); [docs/development/battlefields/cold-mires/README.md](../docs/development/battlefields/cold-mires/README.md).

Scope references: [#9](https://github.com/OwenTanzer/CTW-data/issues/9), [#29](https://github.com/OwenTanzer/CTW-data/issues/29), [#37](https://github.com/OwenTanzer/CTW-data/issues/37).

## army-starts-with-partner-overrides

Owner: **campaign_map**. Status: **production**.

| Endpoint | Location | Referenced fields / namespace |
| --- | --- | --- |
| `army_starts` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`faction_army_start_reference`) | `faction_key`, `is_primary`, `character_id`, `world_x`, `world_y`, `start_region_key`; faction / snapshot-local character; world coordinates |
| `partner_overrides` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`campaign_start_partner_overrides`) | `faction_key`, `partner_key`, `world_x`, `world_y`, `start_region_key`; ordered human faction/partner pair |
| `capitals` | [data/campaign_map/campaign_atlas__wh3__9.0.gpkg](../data/campaign_map/campaign_atlas__wh3__9.0.gpkg) (`faction_start_reference`) | `faction_key`, `capital_region_key`, `centroid_x`, `centroid_y`; faction capital; not army position |

**Join edges:** `army_starts.(faction_key)` → `partner_overrides.(faction_key)`; `army_starts.(faction_key)` → `capitals.(faction_key)`

**Cardinality:** One primary army per faction; zero/one override for the exact ordered faction/partner pair. Other generals remain separate.

**Conditions:** Filter is_primary=1 and partner_key to the actual second human faction. Apply the entire override location as a tuple, even when start_region_key is null. Capitals remain separately labeled.

**Missing boundary:** Static startup source evaluation, not measured movement, runtime multiplayer verification or ownership of nearest land. Snapshot-local character IDs do not persist across rebuilds.

**Snapshot:** Pin CTW-data commit and the referenced owner manifests. Base 9.0; shared 9.0.1 joins require data/magic/input_lock.json and shared_source_comparison.json. Do not join by patch label alone.

**Example:**

```sql
SELECT a.faction_key, CASE WHEN o.faction_key IS NOT NULL THEN o.world_x ELSE a.world_x END AS world_x, CASE WHEN o.faction_key IS NOT NULL THEN o.world_y ELSE a.world_y END AS world_y, CASE WHEN o.faction_key IS NOT NULL THEN o.start_region_key ELSE a.start_region_key END AS start_region_key FROM faction_army_start_reference a LEFT JOIN campaign_start_partner_overrides o ON o.faction_key=a.faction_key AND o.partner_key=:partner_key WHERE a.is_primary=1 AND a.faction_key=:faction_key;
```

Evidence: [data/campaign_map/starting_positions/README.md](../data/campaign_map/starting_positions/README.md); [data/campaign_map/starting_positions/schema_inventory.csv](../data/campaign_map/starting_positions/schema_inventory.csv); [data/campaign_map/starting_positions/starting_positions_validation.json](../data/campaign_map/starting_positions/starting_positions_validation.json).

Scope references: [#15](https://github.com/OwenTanzer/CTW-data/issues/15).
