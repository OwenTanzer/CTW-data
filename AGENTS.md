# Agent usage guide

This repository is a machine-readable context source for agents assisting with
*Total War: WARHAMMER III*. Answers must remain scoped to patch 9.0, Steam
build 25507028, unless the user supplies newer evidence.

## Retrieval order

1. Read `context_catalog.json`.
2. Select the relevant dataset and read its `README.md`.
3. Read its manifest and schema inventory.
4. Use an index to locate only the relevant race, faction, or character file.
5. Filter rows or query SQLite before bringing records into model context.
6. Check the dataset's validation report and carry its caveats into the answer.

Do not load all character CSVs, all source exports, or the entire GeoPackage
into context. The self-contained character files intentionally repeat metadata
to support independent retrieval; that repetition is not evidence of distinct
mechanics.

## Evidence rules

- Stable database keys are canonical. Localized English names are labels and
  may be missing.
- Prefer normalized production data for ordinary facts and typed relations.
- Use source exports to audit provenance or answer questions outside normalized
  coverage; do not silently override normalized semantics with a raw column.
- In unit data, use `tactical_category` for body-plan comparisons and retrieval.
  `source_unit_class` and `source_caste` are provenance, not the canonical
  tactical ontology.
- Use faction guides for bespoke campaign systems, conditional rules, and
  omissions explicitly called out by the economy or catalog documentation.
- Distinguish base unit-card data from technologies, skills, lord effects,
  difficulty, fatigue, terrain, temporary abilities, and mods.
- Never present blank as zero. Never infer a missing label from a similar key.
- When datasets disagree or a requested mechanic is out of scope, report the
  boundary rather than inventing a value.

- Technology data is owned by `data/technology_trees/`; the economy snapshot does not own technology records.
- In faction technology files, filter by `variant_key`. Faction-specific overrides replace generic fallbacks according to `source_exports/node_set_precedence.json`; only legitimate campaign variants are emitted.
- Read `script_audit.json` and `audit_report.json` before asserting research availability. Typed scripted requirements and rewards retain their scopes, triggers and targets; bounded script references are evidence pointers, not unconditional effects; the Daemon Prince explicitly has no ordinary research tree.

## Repository maintenance

Production data under `data/` is generated and must not be edited manually.
Build candidates belong under ignored `work/` paths and may replace production
files only after their validator passes. When changing a schema or snapshot,
update `context_catalog.json`, the relevant manifest and README, and validation
expectations together.

## Campaign starting positions

For army starts, use `faction_army_start_reference` filtered by faction key.
`faction_start_reference` describes capitals and must not substitute for army
positions. Read the starting_positions README and its scoped manifest/schema.
For two human players, apply `campaign_start_partner_overrides` for that exact
faction/partner pair. A maritime point has known coordinates but no resolved
land region; nearest-land anchors are descriptive, not ownership or routes.
Use raw character/script exports only for a specific provenance question that
the normalized views cannot answer. Startup positions are statically evaluated
source evidence, not observed runtime results or movement-distance estimates.

## Historical guide boundary

The race guides retain their 8.1.1 audit scope. Read `data/faction_guides/COMPATIBILITY_9.0.md` first; do not treat their campaign mechanics as freshly verified 9.0 behavior. For units, skills, buildings, technology selectors and starting positions, use the current database owners. Unit ability `culture_key` values must be retained when joining; `*` is the source wildcard.

## Victory objectives

Use `objective_reference` with `variant_key`; Vlad and Isabella have separate requirements. Read `data/campaign_map/objective_manifest.json` and `objective_boundaries` before interpreting victory conditions. These are initial configured 9.0 objectives; scripted completion, runtime unit-size scaling and Archaon later path additions are explicit boundaries. Rewards, crisis and multiplayer objectives remain out of scope.

## Magic and shared ability effects

For character-to-spell queries, read `data/magic/README.md` and `coverage.json`,
then use its character/ability indices and `scripts/query_magic.py`. Magic is a
partial retrieval layer: base payloads, skill modifiers and access conditions
must remain separate. A group modifier does not grant the group's spells, and
successive skill ranks must not be summed. Shared ability/casting/phase truth is
owned by `data/unit_stats/abilities/`; binding/scope truth by
`data/effect_semantics/`; progression stays in `data/skill_trees/`.
The magic extraction is explicitly 9.0.1/build 25546563, with identical shared
9.0 inputs checked and pinned. This is a scoped exception to the base snapshot,
not a global database migration. Supported projectile/explosion graphs use the existing unit lookups. Read
per-variant structural, definition and runtime coverage separately. Conditional
army/unit-set/context bindings are not personal spell grants; unit/form links
retain enabling and culture conditions. Source-only summons and unresolved
acquisition/runtime routes must remain labelled; do not claim #14 is complete.
