# Three repositories, three responsibilities

CTW-data supplies source-backed game records and their constraints. CTW-analysis
investigates what those records imply. CTW-adviser turns selected evidence and
explicit models into a usable, versioned decision service. A calculation's owner
depends on its purpose, not merely on whether it performs arithmetic.

This is the proposed organizational contract in this PR. The observed source
state and outstanding work are in the [dated inventory](../development-state.md).
It does not claim that planned adviser services already run.

## Responsibility and handoff

| Concern | Canonical owner | Consumer and boundary |
| --- | --- | --- |
| Extraction, native identities, normalized facts, provenance, source constraints | CTW-data | Both consumers read pinned snapshots; neither quietly repairs imported facts |
| Unit, weapon, shared ability, effect-binding and progression relations | CTW-data, in their existing dataset owners | Magic composes discovery indices; it does not own duplicate payloads or skill trees |
| Spatial source records, exact map identities, source-grounded annotations | CTW-data | Development geometry remains explicitly provisional until supported; map geometry is not a tactical rating |
| Research hypotheses, clustering, campaign comparisons, exploratory simulators, calibration studies | CTW-analysis | Methods, assumptions, source locks, compact results and empirical evidence stay together |
| Serving import, lossless aliases, indexed SQLite store, evidence packets, inspection interface | CTW-adviser | Derived and rebuildable; source keys and qualifiers survive consolidation |
| Operational single-unit matchup equations, scenario validation and versioned results | CTW-adviser, issue #5 | Analysis can supply research/calibration evidence; the product exposes one implementation, not a second experimental engine |
| Model Context Protocol (MCP), client adapters, ChatGPT/Claude guidance | CTW-adviser | Transport delegates to the same library; clients do not duplicate data or equations |
| Controlled experiments and observations | CTW-analysis for reusable study records; Adviser retains its model acceptance fixtures/results | Reference a shared experiment ID and immutable evidence; observations do not overwrite extracted source values |
| General campaign build search/optimization | CTW-analysis until a separately scoped operational product adopts it | Missing acquisition/constraint records remain CTW-data work |

Current scope references: [Data #1](https://github.com/OwenTanzer/CTW-data/issues/1),
[Data #7](https://github.com/OwenTanzer/CTW-data/issues/7),
[Analysis #5](https://github.com/OwenTanzer/CTW-analysis/issues/5),
[Adviser #1](https://github.com/OwenTanzer/CTW-adviser/issues/1),
[Adviser #5](https://github.com/OwenTanzer/CTW-adviser/issues/5), and
[Adviser #9](https://github.com/OwenTanzer/CTW-adviser/issues/9).

Data has no runtime dependency on either consumer. Analysis reads Data. Adviser
reads Data and may adopt reviewed Analysis evidence; an Analysis checkout must
not become an undeclared runtime prerequisite. Research that evaluates Adviser
must also pin its model version, rather than creating a circular build dependency.

## Within CTW-data

Keep the physical `data/` owners and their public paths stable. They already have
purposeful retrieval granularity: race rosters, individual character trees,
faction technology/economy records and narrow atlas views.

| Owner | Owns | Does not imply |
| --- | --- | --- |
| `data/unit_stats/` | Unit profiles, components, weapon/roster relations and shared projectile/explosion lookups | Recruitment legality, active passive effects, battle outcomes |
| `data/unit_stats/abilities/` | Shared native ability, casting, phase, lifecycle and payload companions | Complete runtime semantics or spell obtainability |
| `data/effect_semantics/` | Bounded native effect bindings, stat definitions, scopes and contexts | A complete campaign modifier evaluator |
| `data/skill_trees/` | Character progression, rank/node-set constraints and effects | An acquired or legal selected build |
| `data/technology_trees/` | Faction/variant research, unlocks and bounded scripted requirements/rewards | All campaign acquisition routes |
| `data/economy/` | Narrow standardized building/economy facts | A recruitment graph hidden inside building CSVs |
| `data/campaign_map/` | Geography, source-evaluated starts, objectives and battle selection identities | Travel cost, effective battlefield geometry or runtime encounter resolution |
| `data/magic/` | Derived character/ability discovery, source routing and coverage | Private copies of shared payloads or progression |
| `data/faction_guides/` | Historical qualitative mechanics with compatibility notes | Freshly verified 9.0 numeric truth |

The catalog's `datasets` contains production retrieval routes and shared owners.
`development_datasets` is explicit opt-in. The location of a validation report
under `docs/development/` does not demote its production dataset: authority comes
from the owner contract and qualified evidence, not the directory name alone.

## Three independent classifications

1. **Repository responsibility:** source record, research result, or operational service.
2. **Lifecycle:** published production, committed development, source branch, open
   PR, closed unmerged work, or historical note.
3. **Evidence:** extracted, source-integrity validated, normalized, hypothesis,
   or semantically/runtime verified within a stated scope.

Merged is a lifecycle event, not a scientific result. Cold Mires can be useful,
reproducible, committed development while remaining runtime-unverified. Magic
can be a production retrieval layer with partial acquisition coverage. An
Analysis result on main is published analysis, never an upstream game fact.

## Change routing examples

| Request | First owner/action |
| --- | --- |
| A source projectile relation is absent | Data: inspect existing owner and missing edge; do not patch a private source copy in Adviser |
| A packet drops a valid culture or secondary payload | Adviser: repair import/query representation against the existing source contract |
| A phase's runtime activation is unknown | Data exposes the uncertainty; Analysis tests a hypothesis; Adviser qualifies affected predictions |
| Estimate a specified pair's damage under declared assumptions | Adviser #5's shared operational model |
| Compare alternative contact or morale models across experiments | Analysis, with a pinned Data snapshot and any evaluated Adviser version |
| A new faction/building recruitment relation is needed | Data #1; Analysis owns the eventual access metric |
| A map seems favorable for a faction | Analysis: condition on armies, opponent, deployment and the exact map evidence |

## Compatibility and promotion

Consumers pin commit, selected file fingerprints, owner schema/snapshot and their
own import/model version. A Data documentation edit can invalidate an Adviser's
lock because it fingerprints `AGENTS.md` and `context_catalog.json`. Existing
pinned builds remain valid; do not point an old lock at new main or change hashes
merely to silence validation. See [catalog v2](catalog-v2.md).

A research result moves into a source lookup only if it has a demonstrated
retrieval purpose, source-backed meaning, explicit uncertainty, stable identity,
reproducible generation, schema, provenance and appropriate validation. Preserve
the research history; do not wholesale promote an experimental index. A supported
operational model moves into Adviser with versioned assumptions, fixtures and a
reference to its evidence; the study remains in Analysis.

`relations.tex` is historical working research physically retained in Data for
compatibility. New model research should live in Analysis; Adviser #5 must state
any 8.1.1-to-9.0 applicability assumption. Migration of the historical document
requires a separately reviewed destination and reference-preserving handoff.
