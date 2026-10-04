# CTW-data organizational diagnosis and redesign

Audit: **2026-10-04**. Author: **Steven**. This is a concrete redesign proposal
with its first implementation in this PR, not a claim that follow-on migrations
or downstream services are complete.

## Finding

CTW-data's core dataset design is substantially better than its organizational
surface. Stable keys, narrow owner datasets, manifests, explicit missingness and
per-character/per-faction retrieval are worth preserving. The failure is that
maintainers and consumers cannot reliably distinguish **what exists, who owns it,
what its evidence establishes, and which version they can safely consume** from
the root documentation alone. The remedy is explicit responsibility and evidence
contracts before physical file movement.

The project has grown from a two-repository separation into a three-repository
system. “Calculations belong in Analysis” is now too broad: Adviser #5 explicitly
owns operational single-unit matchup calculations. Analysis owns research and
experimental models; Data owns source-backed inputs/constraints. Treating Adviser
as just a UI would leave its planned model homeless or duplicate it in Analysis.

## Inspected baselines

| Repository | Main inspected | Actual scope at that baseline |
| --- | --- | --- |
| [CTW-data](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196) | `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196` | Source owners, magic integration and committed battlefield hypotheses |
| [CTW-analysis](https://github.com/OwenTanzer/CTW-analysis/tree/fb17eb88c3a5f9f5707245ecfea9fa36d65518f1) | `fb17eb88c3a5f9f5707245ecfea9fa36d65518f1` | Historical race-strategy study; four open research PRs are separate from main |
| [CTW-adviser](https://github.com/OwenTanzer/CTW-adviser/tree/2c849b821e71ce36f39987053fd667fcff102f02) | `2c849b821e71ce36f39987053fd667fcff102f02` | Source/import contracts, fixtures and SQLite builder, phases 1–2 |

Read current PRs and issues before implementing a follow-up. The checked-in
[development inventory](../development-state.md) records exact observed heads and
remaining steps; it does not track GitHub continuously. Adviser #11 was open at
`804206d7fbf4edd3581de1f6446dbf0c2d028211`; its description reports a validation
checkpoint at `68df993`, which is not certification of the newer observed head.

The audit inspected root/agent instructions, catalog, owner READMEs/manifests,
representative schemas/CSV headers, atlas schema, pipeline/test wiring, consumer
locks/contracts, current issue scope and relevant merged/closed/open PR metadata.
It did not freshly extract the game or verify in-game behavior.

## Organizational defects

| Priority | Demonstrated defect | Consequence | Proposed response |
| --- | --- | --- | --- |
| High | Root README lists five data owners but omits magic, shared abilities and effect semantics from its dataset route list | New work can rediscover or duplicate already normalized relations | Complete root/documentation routes and expose shared owners directly |
| High | Catalog v1 puts `cold_mires_hypothesis` inside `datasets` alongside ordinary production routes | Generic enumeration can ingest provisional geography as game facts despite its caveat string | Catalog v2 gives development its own explicit collection |
| High | Root and catalog use a blanket 9.0 boundary while magic/shared owners and Cold Mires have scoped 9.0.1 evidence and guides remain 8.1.1 | Readers may reject legitimate compatible joins or relabel all data as the newest patch | Require per-owner scope and existing fingerprint compatibility evidence |
| High | `AGENTS.md`, effect-foundation prose and magic development notes still instruct readers not to complete #14 after its bounded scope was closed via #30 | Work can be restarted against superseded requirements | Replace stale closure instructions; distinguish completed core scope from #31's remaining coverage |
| High | No central connection registry describes owner, namespace, cardinality, qualifiers and missing edges together | Main-unit/land-unit confusion, collapsed culture/phase qualifiers and false recruitment joins become easy | Add checked, deliberately selective relation contracts and concrete examples |
| High | Source-only 8.1.1 effect evidence, bounded production 9.0.1 effect data, merged battlefield prototypes and closed #38 coexist without a single lifecycle index | “It exists” or “it merged” can be mistaken for usable current semantics | Add dated immutable evidence inventory with independent lifecycle and maturity fields |
| High | Adviser pins metadata bytes as well as data; Analysis studies use older or study-specific pins | Even apparently harmless renames/document edits can fail consumers; historical results can be silently reinterpreted | Explicit catalog migration; retain old pins and public paths; deliberate downstream update later |
| Medium | `relations.tex` mixes historical combat observations and model abstractions in Data's root | Research ownership appears to live in the source database; later model implementations may fork | Label retained historical custody; route new research to Analysis and operational equations to Adviser |
| Medium | 106 directly contained `scripts/` files mix extraction, production builders, queries, experimental probes, regression tests and one-time migration programs | Contributors cannot tell what to run or which runtime a task needs | Add purpose-based pipeline guide now; reorganize physical packages only with reference/pin-aware follow-up |
| Medium | README says validation requires only Node built-ins although the aggregate calls Python; CI push trigger names an old feature branch | Clean-checkout expectations and post-merge validation are misleading | Document Node/Python/optional scientific dependencies; select Python in CI and include main pushes |
| Medium | Aggregate `validate` is described as complete but several regression/development suites are separate | A green command can be overreported as all tests or runtime verification | Publish precise gate coverage; run focused tests according to the changed owner |
| Medium | The skill validator respawns with an 8 GB heap and exceeds this 8 GB container during the aggregate check | Routine verification is costly and its parent masks a signal as exit 1 | Document the observed blocker; follow up on streaming/bounded validation without weakening checks |
| Medium | Legacy validators write reports to installed production directories | Verification creates incidental diffs and can muddy review | Document isolated checks/candidates and report side effects; keep architecture checks read-only |
| Medium | `docs/` lacks a maintainer entry point or proportional change template | Agent rules accumulate topic-specific paragraphs while maintainers miss overlapping work | Add a routed documentation map and a bounded implementation checklist |

Evidence is directly inspectable at the Data baseline:
[root README](https://github.com/OwenTanzer/CTW-data/blob/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/README.md),
[catalog](https://github.com/OwenTanzer/CTW-data/blob/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/context_catalog.json),
[agent instructions](https://github.com/OwenTanzer/CTW-data/blob/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/AGENTS.md),
[package scripts](https://github.com/OwenTanzer/CTW-data/blob/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/package.json),
[workflow](https://github.com/OwenTanzer/CTW-data/blob/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/.github/workflows/validate.yml),
and [Adviser source lock](https://github.com/OwenTanzer/CTW-adviser/blob/2c849b821e71ce36f39987053fd667fcff102f02/source_lock.json).
[Data #14](https://github.com/OwenTanzer/CTW-data/issues/14) explicitly says older
in-repository incompleteness statements refer to superseded scope.

## What should not be “cleaned up” blindly

The checkout contains **2,868 tracked files and about 611.8 MB of tracked content**
(decimal units, excluding Git history; calculated from the audited checkout).
Skill-tree content contributes roughly 348.7 MB. That is a distribution cost,
not evidence that self-contained character files are a design mistake. Their
repeated context supports independent retrieval; removing it can shift complexity
and context load onto consumers. Raw exports and audits also serve provenance.

There is no demonstrated need to turn the entire source repository into a single
SQLite database just because Adviser uses one. Data's versioned files and atlas
serve different access patterns. Adviser already provides a rebuildable serving
projection with alias reconstruction; duplicating that service in Data would
create competing identities and lifecycle rules.

Nor should research-like filenames automatically move to Analysis. Native format
decoders, source-normalized relations and source integrity tests belong with Data.
Tactical metrics and experimental interpretation belong in Analysis. Cold Mires
contains both extracted evidence and hypotheses, so its immediate correction is
explicit development classification; an eventual split must retain exact source,
transform and annotation provenance rather than moving a whole folder by label.

## Target design

The [repository boundary contract](repository-boundaries.md) defines the enduring
division of labor. Within Data, organize access by two routes:

- **Fact retrieval:** catalog → selected owner README → manifest/schema → bounded
  index/query → coverage/validation caveats.
- **Maintenance:** architecture → connection contract → dated evidence inventory
  plus live issue/PR refresh → targeted owner/source inspection → candidate build
  and relevant checks.

Source ownership is domain-specific and stays at existing paths. Shared ability
and effect owners become directly discoverable; magic remains a derived retrieval
layer over them and skills. A dependency is a typed relation, not a copied CSV or
an English-name match. The relation registry covers skills/technologies to effect
bindings, weapons/payloads, qualified unit abilities, main/land-unit namespaces,
missing recruitment routes, map identity boundaries and army/partner starts.

Physical lifecycle labels do not substitute for evidence. Use a record's immutable
source, owner manifest, stated coverage and evidence dimensions together. Historical
8.1.1 Analysis results remain valid as historical studies, not current 9.0 claims.

## Implementation in this PR

1. Catalog schema v2 separates development, exposes both shared owners, and adds
   maintenance routing without moving generated data.
2. Root README, documentation map, repository contract, migration instructions,
   contribution checklist and pipeline guide form a coherent entry hierarchy.
3. Two compact registries hold selected connection contracts and dated evidence;
   their readable guides are generated, so prose tables cannot silently diverge.
4. Offline validation checks registry structure, real local paths, all referenced
   CSV fields, native inventory mappings, SQLite table/column references, canonical
   ownership and authority separation. Mutation tests reject meaningful corruption.
5. CI runs the architecture checks and explicitly selects Python; main pushes
   also trigger validation. Existing aggregate checks remain in place.
6. Stale magic closure language and historical effect-foundation framing are
   corrected without editing generated production records or loosening caveats.

This advances [Data #15](https://github.com/OwenTanzer/CTW-data/issues/15) and adds
the organizational proposal requested here. #15 originally excluded a repository
reorganization; this PR's broader proposal comes from the new user request, not
from interpreting that older issue as permission. No issue closure is asserted
until its acceptance is reviewed. This is a first implementation of the redesign,
not a folder-only proposal awaiting all useful work.

## Sequenced follow-ups and acceptance

| Stage | Repository / change | Dependency and completion test |
| --- | --- | --- |
| 1 — this PR | Data: navigation, ownership, contracts, evidence lifecycle, versioned catalog | Offline contract/mutation checks; unchanged generated datasets and public entry points; documented aggregate-test limitations |
| 2 — consumer adoption | Adviser: deliberate source-lock/catalog-v2 migration; Analysis: update active study scope only where intended | Keep existing pins until separately reviewed; exact import/alias reconstruction and representative arbitrary lookup checks; no automatic patch relabeling |
| 3 — research custody | Analysis: accept historical combat notes and experiment conventions; Data retains a forwarding reference | Preserve full historical text, build scope and evidence links at an immutable destination; update Adviser #5 references; no second operational evaluator |
| 4 — maintainable implementation packages | Data: group scripts by source owner/shared infrastructure/development domain | Inventory relative imports, hashed builder paths, templates and branch-only scripts; preserve command shims initially; byte-identical candidate comparisons and consumer reference audit before removal |
| 5 — distribution | Data: evaluate compact per-owner releases/artifacts with manifests and source archives | Measure clone/use cost; design retention and reproducibility before any history rewrite or artifact removal; license/NOTICE preserved |
| 6 — adviser packaging | Adviser #9 after #2 acceptance | Separate runtime/build/test assets, regenerate fixtures, demonstrate package operation without development-only files |

Stages 3–5 are proposals, not implemented changes or newly imposed gates on
ongoing magic/battlefield extraction. Stages can proceed independently where their
specific contracts allow. No branch/history deletion, deployment, game extraction,
consumer pin update or cross-repository move is part of this PR.

A successful organization lets a contributor find the existing owner and exact
missing edge before extracting anything; lets a consumer distinguish source facts,
research results and service outputs; and lets an agent answer a small game
question without reading the project's entire development history.
