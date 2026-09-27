# Building and map reconciliation

Audited September 27, 2026 UTC against retained 9.0/build 25507028 source. [Official release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/110), including the September 24 correction, were used to select targets. Exact results and input hashes are in [building-map-reconciliation.json](building-map-reconciliation.json). Reproduce with `python3 scripts/audit-9.0-building-map.py`; fetch `checkpoint/campaign-map-9.0-source-20260926` first if commit `56388cf86ad2852a9a47c1fc6894a7b4e3cce1aa` is unavailable locally.

## Buildings

All 26,438 emitted economy rows pass 211,504 independent direct-field comparisons: chain, level, settlement tier, cost, duration, upkeep, capital restriction and resource requirement. The owner validator also passes source-based selection, localization, prerequisite and standardized-metric recomputation for all 109 faction files. No economy data repair was identified.

Compared with retained 8.1.1, the source building-level inventory has 430 added keys, 11 removed keys and 26 modified keys on shared columns. The new `override_startpos_settlement_display_building` source column is recorded separately, avoiding a misleading claim that every existing building changed numerically. Every changed key records whether and how often it appears in current output. This inventory includes source content beyond playable constructible scope; absence alone is not an omission.

The evidence records changed effect rows for 224 represented landmark/unique building keys. Their source deltas are preserved even when an effect is outside standardized economy columns; unchanged normalized income does not imply unchanged bespoke effects. Conditional recruitment and pooled-resource mechanics are not flattened into income or recruitment modifiers.

| Target | Existing-table disposition |
|---|---|
| Slaanesh chains | Selected level/tier/cost/duration rows are preserved for all three factions, including the tier-4 Marauder chain and Dechala warrior-hall tiers 3–4. Full owner selection validation passes. Recruitment payloads remain outside the economy schema. |
| Silver Pinnacle | Neferata's tomb levels, including Opulent Chambers, are present with source construction facts and gem output. Settlement slot capacity is not an atlas/economy field. |
| Lahmia | `wh3_main_vmp_special_lahmia_temple_of_blood` is present in Neferata's catalog: tier 5, cost 10,000, eight turns. Special unit access is not encoded as an unconditional economy modifier. |
| Dragon-grave landmarks | Nine source building keys are preserved where applicable, with tier 3, cost 6,000, four turns. Catalog availability does not assert a landmark's placement in a particular campaign; randomized placement remains scripted. |
| Tomb Scorpion | Building-tier evidence remains distinct from the unit-record tier. No unit stat is rewritten from a building requirement. |

## Map findings and repair

All 7,700 current-region group memberships and all 2,750 Immortal Empires selection-rule occurrences match the hash-verified source checkpoint. The Dark Fortress group grows from 41 to 65 entries, with no removals: all 20 announced additions plus source additions at Altdorf, Castle Drakenhof, Marienburg and Varg Camp. Exact keys are retained in the report.

Middenheim, Black Pyramid and Nagashizzar each resolve through map location → battle group → settlement selection rule. These are preserved static relations, not a newly implemented dynamic map resolver.

The independent comparison found **610 missing group/map/catchment/tile variants**. `battle_group_maps` previously used only `(battle_group_key, battle_map_key)` as its primary key, so `INSERT OR IGNORE` silently discarded distinct catchments sharing that pair. This affected existing content and newly represented source relations.

The repair retains the full four-field identity, including null-safe uniqueness, and restores **1,136 rows instead of 526**. `battle_context_reference` now uses the relation's catchment rather than the map catalog's first catchment, and exposes the relation's tile qualifier separately as `map_tile_upgrades`. Consumers must not collapse these rows back to a map/group pair. Atlas schema is 1.3; no new game-mechanics model is introduced.

The candidate was rebuilt from verified retained source and enriched only after exact geographic-dependency checks. Comparing all tables against pre-repair production finds changes only in atlas metadata and `battle_group_maps`. Geographic tables, starting armies, source-file provenance and configured objectives are unchanged. The lookup view intentionally changes as described above.

## Explicit boundaries for announcement items

Corruption/crisis-dependent map selection, randomized landmark placement, settlement slot capacity and battle deployment/pathfinding/terrain fixes are not represented by the existing static catalog or geography fields. They are recorded as boundaries, not falsely certified by a row-presence test. The battle-map bridge remains partial until its binary coordinate overlay is decoded. Cosmetic settlement appearance and localization-only fixes do not require numerical table edits. These distinctions do not create new schema requirements for issue #16.

## Validation and remaining work

Economy and campaign owner validators pass. Four battle-map checks cover complete source equality, rejection of pair-only collapse, lost tile qualifications and the lookup view's relation-specific values. All 11 victory tests and 13 starting-position tests pass. The new coverage check runs under ordinary campaign validation and the regression suite is included in `npm run validate`.

Buildings and represented static map relations have now been reconciled, with the identified map loss repaired in this candidate. This does not claim completion of all six official content articles, the wider historical-guide factual review, or roster issue #23. Magic #14 remains paused.
