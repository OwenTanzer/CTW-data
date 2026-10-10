# Unit stat data

This directory is the versioned, reproducible data layer for computational analysis of *Total War: WARHAMMER III* units.

## Baseline

- Game: `warhammer_3`
- Patch: `9.0`
- Steam build ID: `25507028`
- Unit scale: `ultra`
- Rank: `0`
- Context: unmodified custom-battle base stats
- Exclusions: technologies, red-line skills, lord effects, campaign difficulty bonuses, temporary abilities, fatigue, terrain, charge decay, and mods

## Directory layout

- `source_exports/` — untouched schema-decoded exports from the installed game packs, plus `source_manifest.json` with byte counts and SHA-256 hashes.
- `normalized/` — 25 analysis-ready race CSVs, each containing the deduplicated union of its core and configured faction-variant military groups, plus reviewed current units supported by explicit custom-battle faction permissions.
- `lookups/` — one-to-many components, weapons, projectiles, explosions, abilities, attributes, contact effects, roster permissions, mount variants, and data-quality flags.
- `archive/` — previous extracts retained unchanged for comparison and recovery.
- `schema_inventory__v4.csv` — the authoritative dataset-to-column mapping and column order for every generated CSV.
- `dataset_manifest.json` — schema version, source path, row counts, and build timestamp.
- `audit_report.md` and `audit_report.json` — the most recent validation results.

Do not edit `source_exports/` by hand. Regenerate normalized and lookup files from the source snapshot.

## CSV conventions

- UTF-8, comma delimiter, LF line endings, one header row, and lowercase `snake_case` headers.
- Stable game keys are identifiers; display names are labels.
- The normalized unique key is `(game, patch, unit_scale, subculture_key, unit_key)`. A source unit may legitimately appear in multiple race rosters.
- Numbers use an unformatted decimal point and no thousands separators.
- Percentage-like game stats use percentage points: `20`, not `0.20` or `20%`.
- Booleans are lowercase `true` or `false`.
- Blank means not applicable or unavailable from the source relation. Zero means an observed zero.
- Lists are never stored in cells. One-to-many relationships belong in `lookups/`.
- Derived outputs such as hit chance, AP ratio, expected damage, or DPS are calculated downstream and are not stored here.

The full header inventory is machine-readable in `schema_inventory__v4.csv`; that file is generated from the same column definitions as the CSV writers and is checked against every output header during validation.

## Normalized schema v3 semantics

The 25 files in `normalized/` retain convenient one-row-per-unit statistics, but the following fields have precise meanings:

- `tactical_category` is the canonical coarse body-plan category for comparison and retrieval: `character`, `artillery`, `monster`, `cavalry`, or `infantry` where those categories apply. It is a curated analytical semantic, not a verbatim Creative Assembly field. Units whose tactical body plan conflicts with an internal database label are deliberately normalized here; missile hunting packs, Cygors, and ranged Soul Grinders are monsters.
- `source_unit_class` and `source_caste` preserve Creative Assembly's raw `land_units.class` and `main_units.caste` values for provenance. Do not use them as the primary tactical ontology.
- `entity_count` and `model_count` are the number of primary targetable bodies represented on the unit card. They remain identical for compatibility with schema v2 consumers.
- `source_total_component_count` preserves CA's `main_units.num_men`, which can include crew, riders, engines, or decorative sub-entities and must not be treated as the displayed model count.
- `hp_per_entity` is the primary body's hit-point contribution and is never an average across heterogeneous components.
- `total_hp` is the source-derived unit health pool. It equals `entity_count × hp_per_entity` for homogeneous and composite-body units; crewed artillery additionally includes its separately modeled crew health. `unit_components` exposes the exact summands.
- `primary_component_role` identifies whether the primary body is a man, mount, or engine.
- `primary_target_size` is the raw battle-entity size class. `is_large` is true for `large` and `very_large` primary bodies.
- `has_missile_weapon` is derived from all supported attachment paths: the land unit, unit/weapon junctions, the primary artillery engine, and extra engines.
- Inline missile and explosion columns describe the selected default projectile for convenient comparisons. Every attached weapon and alternate projectile is retained in `lookups/unit_weapon_links__wh3__9.0__ultra.csv`.
- Missile-only fields, including `accuracy`, are blank on units without a resolved missile weapon.
- `source_*` columns preserve the exact joined CA keys used for the normalized row.
- `roster_scope` distinguishes core, core-and-variant, faction-exclusive, and shared-variant availability. `is_faction_exclusive` is true when a unit is outside the core military group (configured variant membership or reviewed permission-only inclusion).
- `military_group_count` and `permitted_faction_count` provide convenient structured availability counts without embedding lists in normalized rows.
- `availability_notes` provides a concise human-readable qualification when availability needs explanation. Exact memberships and permissions remain authoritative in the typed `unit_rosters` lookup rather than being encoded as prose or delimited lists.
- `data_quality_status` is `complete` only when all required joins resolve. Any failure is also written to the data-quality lookup.

## Companion relations

- `unit_components__wh3__9.0__ultra.csv` separates primary bodies, crew/riders, and extra engines. Secondary-component targetability is left blank where the source tables do not encode it.
- `unit_weapon_links__wh3__9.0__ultra.csv` records melee and missile attachment paths, component roles, slots, ammunition pools, missile weapons, every projectile variant, and the default-projectile flag.
- `projectiles__wh3__9.0.csv` preserves direct damage, AP damage, bonuses, timing, burst/volley counts, collision, calibration, penetration, expiry, homing, friendly-fire, building-damage, contact-effect, shrapnel, and explosion references.
- `explosions__wh3__9.0.csv` preserves radius, direct/AP damage, force, ignition, magical/spell flags, ally interaction, contact effects, and shrapnel.
- `unit_abilities`, `unit_attributes`, and `unit_contact_effects` provide normalized one-to-many keys.
- `unit_rosters` uses typed rows to preserve exact race-specific military-group memberships and custom-battle faction permissions separately.
- `unit_mount_variants` preserves base-to-mounted unit relationships.
- `data_quality_flags` is empty only when no unresolved join or extraction error remains.

## Reproduction

The installed game stores its records inside `.pack` archives. RPFM 5.0.6 supplies the versioned Warhammer III schemas used for this snapshot.

From the workspace root, with `rpfm_server.exe` running locally:

```powershell
node .\scripts\extract-source.mjs work\source_units_9.0 9.0
node .\scripts\build-unit-dataset.mjs work\source_units_9.0 work\generated_unit_stats__final
node .\scripts\validate-unit-dataset.mjs work\source_units_9.0 work\generated_unit_stats__final
```

Install generated files only after the validator exits successfully. The validator checks source hashes, roster completeness, keys, headers, types, primary components, health identities, size classifications, every missile/projectile/explosion link, companion-table references, and representative golden units.

## Historical repair

The original six normalized files are preserved under `archive/8.1.1__initial_extract_2026-08-24/`. Schema v2 repaired the failed missile joins, component-count/health averaging, large-unit classification, undocumented headers, non-applicable accuracy values, missing one-to-many relations, and absent raw-source provenance. Schema v3 separates the canonical `tactical_category` from the explicitly named `source_unit_class` and `source_caste` provenance fields.

## 9.0 compatibility

Schema v4 retains `culture_key` on ability links. `*` is the literal unrestricted source value; a named culture conditions the relationship. Join on unit, ability and culture together. The Undead Legions roster is included; Archaon and Festus/Glottkin military-group changes are preserved. These are source roster permissions, not a complete runtime recruitment model.

## 9.0 lord coverage repair

Boris Todbringer's four current `wh3_dlc29_emp_cha_boris_todbringer_toddy_*` variants and `wh3_dlc29_vmp_cha_nagash` have valid custom-battle faction permissions but no military-group membership. Reviewed `permission_units` entries in the snapshot scope include these records without inventing military-group links. Such rows have `military_group_count=0`; the inline `military_group` remains the roster's core identifier, not evidence of membership. Exact permissions live in `unit_rosters`. This remains the existing unit schema, not a campaign recruitment model.

Legacy Boris custom-battle permissions and land-unit records remain in source evidence, but have no matching legacy `main_units` records in this snapshot. They must not replace the current identities. Independent coverage fixtures check all five new playable lords and ten mount links; mutation tests reject missing units, missing links and legacy substitution. This bounded repair is not a claim that every older permission-only unit has been reconciled.

## Reviewed obtainable configurations

The availability follow-up includes 43 previously omitted race/unit configurations plus three canonical Arkhan records recovered while resolving duplicates. Limited or special access is described in `availability_notes`; it is not an exclusion criterion. Notes distinguish source character permissions, Host of Nagash Mortarch access and unverified campaign unlock details. Exact custom-battle permissions remain in `unit_rosters`; race-level inclusion does not promise access by every faction.

Twelve `_mp` identities are excluded as duplicate main/land records with matching culture-qualified ability links. Their key mappings and original permissions are retained in `docs/development/update-9.0/availability-decisions.json`. Arkhan's three canonical counterparts are selected in Undead Legions, where they have explicit source permission; their excluded aliases have Tomb Kings custom-battle permission. Canonicalization does not transfer one identity's permissions to another. External script equivalence is not claimed.

## Minor 9.0 coverage follow-up

Kroxigor Ancient (`wh2_dlc13_lzd_cha_kroxigor_ancient_0`) is restored through its explicit Lizardmen permission, bringing that historical checkpoint to 2,367 roster rows. Its culture-qualified Spawn-Kin link has independent regression coverage. The reviewed canonical Arkhan steed/chariot edges are now in the availability decision register and its removal tests. Source exports and the schema are unchanged.

## Historical roster reconciliation (#23)

The completed custom-battle-permission checkpoint contained 3,155 race/unit rows. The 800 original permission
candidates resolve to 784 inclusions and 16 combat-alias exclusions (including
the 12 previously approved). An all-source-faction permission scan adds four
more configurations: two Chaos Dwarf records and Ulrika foot/warhorse for
Neferata. These 788 additions preserve the existing unit and companion schemas.

The generated [case register](../../docs/development/update-9.0/historical-roster-decisions.json)
records every decision, source permission flag, mount relation and evidence
boundary. Reproduce it with `python3 scripts/reconcile-historical-rosters.py`;
`--apply-scope` also regenerates the reviewed selector configuration. Per-unit
`permission_unit_factions` overrides identify the exact evidence faction when
it differs from the race roster's representative faction. They do not grant
permissions to that representative faction.

Four newly excluded aliases have identical represented combat relations to an
existing same-race canonical row. Their source permissions remain in the audit
register and untouched exports; those permissions are never transferred to the
canonical key. Conversely, Spirit of Grungni's `_mp` record has different weapon
and ability relations and is retained. Suffixes and equal headline stats are not
duplicate tests. Availability notes separate source-supported configurations
from unverified campaign acquisition. This pass exhausts the recorded candidates
and same-subculture custom-battle permission scan; it does not certify arbitrary
script-only recruitment, alliance borrowing or every campaign unlock.

## Archaon scripted acquisitions

The current snapshot has 3,181 race/unit rows. The [Archaon scripted roster
report](../../docs/development/update-9.0/archaon-scripted-roster-reconciliation.md)
adds 26 source-backed Warriors of Chaos configurations: eleven subjugatable
leaders, six characters conditionally transferred with specified Nurgle
vassalizations, and nine source-linked mounts. `availability_notes` states
Archaon-only access and qualification for each entry. `unit_rosters` retains
actual source custom-battle faction permissions; it has no invented Warriors of
Chaos permission or military-group membership for these additions. A race row
is therefore possible campaign access for Archaon, not ordinary recruitment
for the race. Individual mount unlocks are not certified.

## Shared ability relations and magic

Generic definitions, casting, phases, lifecycle, vortices and bombardments now
have a [shared ability owner](abilities/README.md). The [magic entry point](../magic/README.md)
connects character skill effects to those records. It preserves the existing
unit roster and projectile lookup contracts. Spell projectiles use these shared
normalized lookups. Runtime interpretation and wider acquisition coverage remain
explicitly qualified.


The magic review pass extends existing projectile/explosion lookups additively
(schema v4 headers are recorded in the regenerated inventory). Every previous
row value and weapon link is preserved. Extra columns retain native source names,
including spawned vortices, overhead phases and fuse settings. Existing renamed
columns keep their prior meanings and numeric formatting. `payload_extension`
in the manifest records the scoped 9.0.1 extraction; unchanged 9.0 sources remain
authoritative for the retained fields.

The ordinary 9.0 unit builder loads ability roots from the shared ability source
owner. For a fresh magic extraction, `magic_pipeline.py build` supplies its verified
candidate source as the fourth unit-builder argument. Validate the combined
candidate with both unit and magic validators before installing it.

## Native ammunition mapping correction

Weapon supply selection follows `missile_weapons.use_secondary_ammo_pool`: true
selects the owning land unit's `secondary_ammo`; false selects `primary_ammo`.
The attachment's component role and slot do not select the supply. Blank flags
remain unresolved. All projectile alternatives of a weapon retain its selection.
The count is a native capacity, not guaranteed volleys or a finite exhaustion
limit when `land_units.infinite_secondary_ammo` is true. Variant eligibility and
physical firing multiplicity remain separate. See `docs/ammunition-pools.md`.
