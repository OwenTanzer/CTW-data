# Development and evidence inventory

<!-- Generated from development_inventory.json by scripts/validate_architecture.py. -->

Observed **2026-10-04 UTC**. Dated evidence inventory, not a live tracker. Refresh relevant repository main, issue state, PR head/merge state and durable paths before relying on progress. A different head or 30 elapsed days makes the observation due for refresh; no automatic network calls in validation.

Lifecycle and evidence maturity are independent. `production_main` in Analysis
or Adviser means published work in that repository, not authoritative Data facts.
Remote artifact links are immutable snapshots. Prior reported tests do not certify
a newer PR head. Local evidence links refer to this Data checkout.

## production-source-owners

[OwenTanzer/CTW-data: context_catalog.json](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/context_catalog.json) at `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

- Owner: CTW-data; consumers: CTW-analysis, CTW-adviser.
- Lifecycle: **production_main**; evidence: normalized, source_integrity_validated.
- Observation (2026-10-04): main inspected.
- Boundary: Owner-specific patches and coverage; not a global 9.0.1 snapshot.
- Next step: Use selected dataset and owner manifest before joining.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [data/unit_stats/audit_report.json](../data/unit_stats/audit_report.json); [data/skill_trees/audit_report.json](../data/skill_trees/audit_report.json); [data/economy/audit_report.json](../data/economy/audit_report.json); [data/technology_trees/audit_report.json](../data/technology_trees/audit_report.json); [data/campaign_map/validation_report.json](../data/campaign_map/validation_report.json).

Tracking: [CTW-data #15](https://github.com/OwenTanzer/CTW-data/issues/15).

## shared-magic-foundation

[OwenTanzer/CTW-data: data/magic/README.md](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/data/magic/README.md) at `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

- Owner: CTW-data; consumers: CTW-adviser, CTW-analysis.
- Lifecycle: **production_main**; evidence: normalized, source_integrity_validated.
- Observation (2026-10-04): #14 closed; #31 open; #30 merged.
- Boundary: Core #14 completed; broader acquisition and runtime semantics remain #31. Partial data is still production data.
- Next step: Extend source-backed gaps under #31; never reactivate obsolete #14 closure requirements.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [data/magic/dataset_manifest.json](../data/magic/dataset_manifest.json); [data/magic/coverage.json](../data/magic/coverage.json); [docs/development/magic/validation.json](../docs/development/magic/validation.json).

Tracking: [CTW-data #14](https://github.com/OwenTanzer/CTW-data/issues/14), [CTW-data #31](https://github.com/OwenTanzer/CTW-data/issues/31), [CTW-data #30](https://github.com/OwenTanzer/CTW-data/pull/30).

## army-starts-current

[OwenTanzer/CTW-data: data/campaign_map/starting_positions/README.md](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/data/campaign_map/starting_positions/README.md) at `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

- Owner: CTW-data; consumers: CTW-analysis.
- Lifecycle: **production_main**; evidence: normalized, source_integrity_validated.
- Observation (2026-10-04): #6 merged; current owner subsequently refreshed.
- Boundary: Current 9.0 has 109 primary faction starts. Merged #6's 104-start 8.1.1 result is historical; neither establishes runtime travel.
- Next step: Consume current view only with the intended source pin; preserve partner overrides and maritime nulls.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [data/campaign_map/starting_positions/dataset_manifest.json](../data/campaign_map/starting_positions/dataset_manifest.json); [data/campaign_map/starting_positions/starting_positions_validation.json](../data/campaign_map/starting_positions/starting_positions_validation.json).

Tracking: [CTW-data #6](https://github.com/OwenTanzer/CTW-data/pull/6).

## effect-source-811

[OwenTanzer/CTW-data: data/effect_semantics/source_exports](https://github.com/OwenTanzer/CTW-data/tree/f61fd8ab2a65931abb494340a6918faaeedfdd7d/data/effect_semantics/source_exports) at `f61fd8ab2a65931abb494340a6918faaeedfdd7d`.

- Owner: CTW-data; consumers: CTW-analysis.
- Lifecycle: **source_branch**; evidence: extracted, source_integrity_validated.
- Observation (2026-10-04): #13 closed unmerged; refactor/effect-source-only branch verified.
- Boundary: Historical 220-table source branch is not the bounded 9.0.1 effect owner now on main.
- Next step: Preserve immutable source; focus any promotion on a demonstrated lookup need.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [docs/effect-foundation.md](../docs/effect-foundation.md); [docs/effect-foundation-live-validation.json](../docs/effect-foundation-live-validation.json).

Tracking: [CTW-data #13](https://github.com/OwenTanzer/CTW-data/pull/13), [CTW-data #7](https://github.com/OwenTanzer/CTW-data/issues/7).

## magic-extraction-archive

[OwenTanzer/CTW-data: work/magic-source-review.tar.gz](https://github.com/OwenTanzer/CTW-data/tree/9d5c8bee9888fe1092528472f4faa3e0260a8c83/work/magic-source-review.tar.gz) at `9d5c8bee9888fe1092528472f4faa3e0260a8c83`.

- Owner: CTW-data; consumers: CTW-data.
- Lifecycle: **source_branch**; evidence: extracted, source_integrity_validated.
- Observation (2026-10-04): checkpoint branch verified.
- Boundary: Durable archive lives on a pinned checkpoint branch despite work/ normally being ignored; not a local-only dependency.
- Next step: Reproduce through the documented archive workflow; validate candidates before install.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [data/magic/extraction_manifest.json](../data/magic/extraction_manifest.json); [data/magic/input_lock.json](../data/magic/input_lock.json); [docs/development/magic/README.md](../docs/development/magic/README.md).

Tracking: [CTW-data #30](https://github.com/OwenTanzer/CTW-data/pull/30).

## cold-mires-hypothesis

[OwenTanzer/CTW-data: docs/development/battlefields/cold-mires/README.md](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/docs/development/battlefields/cold-mires/README.md) at `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

- Owner: CTW-data; consumers: CTW-analysis, CTW-adviser.
- Lifecycle: **development_main**; evidence: extracted, source_integrity_validated, hypothesis.
- Observation (2026-10-04): #40 merged; #9/#37 open; #39 closed.
- Boundary: Merged on main does not establish world alignment, water behavior, cover or passability.
- Next step: Use exact-map comparisons to collect evidence; promote only supported spatial facts. Tactical experiments belong downstream.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [docs/development/battlefields/cold-mires/schema.json](../docs/development/battlefields/cold-mires/schema.json); [docs/development/battlefields/cold-mires/dataset/manifest.json](../docs/development/battlefields/cold-mires/dataset/manifest.json); [docs/development/battlefields/cold-mires/validation.json](../docs/development/battlefields/cold-mires/validation.json).

Tracking: [CTW-data #40](https://github.com/OwenTanzer/CTW-data/pull/40), [CTW-data #9](https://github.com/OwenTanzer/CTW-data/issues/9), [CTW-data #37](https://github.com/OwenTanzer/CTW-data/issues/37).

## superseded-battlefield-collection

[OwenTanzer/CTW-data: docs/development/battlefields/README.md](https://github.com/OwenTanzer/CTW-data/tree/fc3fdb603b77af0a406eb87ce8acbf55b38c670a/docs/development/battlefields/README.md) at `fc3fdb603b77af0a406eb87ce8acbf55b38c670a`.

- Owner: CTW-data; consumers: CTW-analysis.
- Lifecycle: **closed_unmerged**; evidence: extracted, hypothesis.
- Observation (2026-10-04): #38 closed unmerged and superseded.
- Boundary: Published extraction did not meet geographic readability. Later MSI repairs are not all in the published PR; no local-only artifact is a reusable dependency here.
- Next step: Retain branch for provenance; do not merge or infer that its reported repaired local index is published.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [docs/development/battlefields/README.md](../docs/development/battlefields/README.md).

Tracking: [CTW-data #38](https://github.com/OwenTanzer/CTW-data/pull/38).

## historical-combat-relations

[OwenTanzer/CTW-data: relations.tex](https://github.com/OwenTanzer/CTW-data/tree/3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196/relations.tex) at `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`.

- Owner: CTW-data; consumers: CTW-analysis, CTW-adviser.
- Lifecycle: **historical_note**; evidence: hypothesis.
- Observation (2026-10-04): historical note retained.
- Boundary: Working equations and historical 8.1.1 binary/behavior evidence, not certified 9.0 mechanics. Physical custody is Data; research stewardship belongs in Analysis.
- Next step: Retain path during pin-compatible reorganization; move future research through the staged Analysis handoff, then let Adviser version supported operational equations.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: [relations.tex](../relations.tex).

Tracking: [CTW-adviser #5](https://github.com/OwenTanzer/CTW-adviser/issues/5).

## analysis-main-study

[OwenTanzer/CTW-analysis: studies/race_strategy_space/methodology.md](https://github.com/OwenTanzer/CTW-analysis/tree/fb17eb88c3a5f9f5707245ecfea9fa36d65518f1/studies/race_strategy_space/methodology.md) at `fb17eb88c3a5f9f5707245ecfea9fa36d65518f1`.

- Owner: CTW-analysis; consumers: CTW-adviser.
- Lifecycle: **production_main**; evidence: hypothesis.
- Observation (2026-10-04): main inspected; status means published analysis only.
- Boundary: Published analysis is not a production game fact. Main source_lock pins 8.1.1 at 8c2169b837288d03ba0188b468f06a2f3bcb4b28.
- Next step: Retain study-specific provenance; do not relabel historical results after a Data upgrade.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-analysis #5](https://github.com/OwenTanzer/CTW-analysis/issues/5).

## analysis-pairings

[OwenTanzer/CTW-analysis: studies/coop_pairings](https://github.com/OwenTanzer/CTW-analysis/tree/8d2e5dd8e3297c02add0630da3e16e21c7a9f5b9/studies/coop_pairings) at `8d2e5dd8e3297c02add0630da3e16e21c7a9f5b9`.

- Owner: CTW-analysis; consumers: CTW-adviser.
- Lifecycle: **open_pr**; evidence: hypothesis.
- Observation (2026-10-04): #7 open; draft=true.
- Boundary: Draft describes all 104 historical starts, not the current 109-faction 9.0 universe.
- Next step: Reconcile study source lock and acceptance against current scope before review; do not silently refresh data.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-analysis #7](https://github.com/OwenTanzer/CTW-analysis/pull/7).

## analysis-modifier-comparison

[OwenTanzer/CTW-analysis: studies/infantry_campaign_comparison](https://github.com/OwenTanzer/CTW-analysis/tree/dc4f2e78e8859046aaad478cf0e32fabc59e49d1/studies/infantry_campaign_comparison) at `dc4f2e78e8859046aaad478cf0e32fabc59e49d1`.

- Owner: CTW-analysis; consumers: CTW-adviser.
- Lifecycle: **open_pr**; evidence: hypothesis.
- Observation (2026-10-04): #8 open; draft=true.
- Boundary: Partial campaign ledgers remain experimental; not a complete attainable-build solver.
- Next step: Inspect exact head and declared modifier gaps before consuming results.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-analysis #8](https://github.com/OwenTanzer/CTW-analysis/pull/8).

## analysis-janus

[OwenTanzer/CTW-analysis: studies/race_strategy_space](https://github.com/OwenTanzer/CTW-analysis/tree/24f7f9792897155909dc11f33288d7f555807fdf/studies/race_strategy_space) at `24f7f9792897155909dc11f33288d7f555807fdf`.

- Owner: CTW-analysis; consumers: CTW-adviser.
- Lifecycle: **open_pr**; evidence: hypothesis.
- Observation (2026-10-04): #9 open; draft=true.
- Boundary: Provisional roster package/access proxies do not certify recruitment legality or army power.
- Next step: Review the full branch with its pinned source and preserved uncertainty.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-analysis #9](https://github.com/OwenTanzer/CTW-analysis/pull/9).

## analysis-modifier-reference

[OwenTanzer/CTW-analysis: studies/modifier_reference](https://github.com/OwenTanzer/CTW-analysis/tree/eec0925cbbccf37a7bb0069e0df5350c00e49dcb/studies/modifier_reference) at `eec0925cbbccf37a7bb0069e0df5350c00e49dcb`.

- Owner: CTW-analysis; consumers: CTW-adviser.
- Lifecycle: **open_pr**; evidence: hypothesis.
- Observation (2026-10-04): #10 open; draft=true.
- Boundary: Experimental index depends on preserved 8.1.1 source branch, not on Data #13 merging.
- Next step: Retain recorded portability/SQLite review findings; do not make this Data's authoritative query service.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-analysis #10](https://github.com/OwenTanzer/CTW-analysis/pull/10).

## adviser-main-serving

[OwenTanzer/CTW-adviser: docs/source-contract.md](https://github.com/OwenTanzer/CTW-adviser/tree/2c849b821e71ce36f39987053fd667fcff102f02/docs/source-contract.md) at `2c849b821e71ce36f39987053fd667fcff102f02`.

- Owner: CTW-adviser; consumers: ChatGPT, Claude.
- Lifecycle: **production_main**; evidence: source_integrity_validated.
- Observation (2026-10-04): main inspected.
- Boundary: Main has phases 1–2 contracts/importer; planned operational model and MCP (Model Context Protocol) remain separate issues. Its source lock hashes Data AGENTS.md and catalog as well as data.
- Next step: Keep the existing source pin; update metadata hashes only in a deliberate reviewed source migration.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-adviser #2](https://github.com/OwenTanzer/CTW-adviser/issues/2), [CTW-adviser #5](https://github.com/OwenTanzer/CTW-adviser/issues/5), [CTW-adviser #3](https://github.com/OwenTanzer/CTW-adviser/issues/3).

## adviser-evidence-packets

[OwenTanzer/CTW-adviser: README.md](https://github.com/OwenTanzer/CTW-adviser/tree/804206d7fbf4edd3581de1f6446dbf0c2d028211/README.md) at `804206d7fbf4edd3581de1f6446dbf0c2d028211`.

- Owner: CTW-adviser; consumers: ChatGPT, Claude.
- Lifecycle: **open_pr**; evidence: source_integrity_validated.
- Observation (2026-10-04): #11 open; non-draft at observation.
- Boundary: Unmerged packet interface is not main. PR description reports tests at 68df993; observed head is newer and this inventory does not certify it.
- Next step: Review actual head and current checks; preserve native facts, explanation attribution and unknown runtime conditions.

Repository content and GitHub metadata; test reports are prior evidence unless this PR's verification says rerun.

Local evidence: Use the immutable external repository snapshot and its owner contracts..

Tracking: [CTW-adviser #11](https://github.com/OwenTanzer/CTW-adviser/pull/11).
