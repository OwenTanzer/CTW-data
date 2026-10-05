# Pipeline and validation guide

Run commands from the repository root. This guide groups existing entry points
without breaking hashed inputs, relative imports or downstream instructions.
Not every script is a production entry point.

## Requirements

Node.js 24+ and Python 3.11+; CI (continuous integration) selects Python 3.12.
Routine checks use built-in modules and need no npm installation. Fresh extraction
uses the verified Windows game installation plus RPFM (Rusted PackFile Manager)
and documented PowerShell wrappers/mutex. Rust/Cargo belongs to the optional
battlefield decoder. Cold Mires build/render tests require
[cold_mires/requirements.txt](cold_mires/requirements.txt).

## Production pipelines

| Owner | Extract/build entry points | Offline verification |
| --- | --- | --- |
| Units | `extract-source.mjs`, `build-unit-dataset.mjs` | `npm run validate:units` includes availability/roster regressions |
| Skills | `extract-skill-source.mjs`, `build-skill-trees.mjs` | `npm run validate:skills` |
| Technology | `extract-technology-source.mjs`, `build-technology-trees.mjs` | `npm run validate:technologies`; `npm run test:technologies` |
| Economy | `extract-economy-source.mjs`, `build-economy-dataset.mjs` | `npm run validate:economy` |
| Atlas/objectives | `extract-campaign-atlas-source.mjs`, `build-campaign-atlas.mjs` | `npm run validate:campaign`; `npm run test:victory`; `npm run test:battle-maps` |
| Army starts | `extract_campaign_starts.py`, `rebind-start-evidence.py`, `build_campaign_starts.py` | `npm run test:campaign-starts` and atlas validation |
| Magic/shared abilities/effects | `extract-magic-source.ps1`, `magic_pipeline.py` | `npm run validate:magic`; `npm run test:magic` |
| Historical guides | `faction-guide-queue.mjs` and guide research process | `npm run validate:guides` |

Exact arguments and source constraints live in owner READMEs. Atlas base building
and army-start enrichment are separate steps. Magic needs its pinned source
archive for full reconstruction; installed-data validation is offline. The older
8.1.1 effect-source branch cannot substitute for current shared owners.

## Shared maintenance

| Purpose | Commands / files |
| --- | --- |
| Architecture and registry views | `npm run validate:architecture`; `npm run test:architecture`; `python3 scripts/validate_architecture.py --write-docs` |
| Snapshot/newline fingerprints | `npm run test:snapshot`; `npm run test:validation-text`; `snapshot-source.mjs`, `snapshot-build.mjs`, `validation-text.mjs` |
| Generated README preservation | `npm run test:readme`; skill/economy/technology README templates and owning builders |
| RPFM helpers | `rpfm-call.mjs`, `rpfm-call-locked.ps1`, `rpfm-tools.mjs`, `rpfm-tsv.mjs` |
| Migration/reconciliation | `scope-9.0.json`, `audit-9.0-*`, `reconcile-*`; evidence in `docs/development/update-9.0/` |

## Development pipelines

| Purpose | Commands | Boundary |
| --- | --- | --- |
| Historical effect foundation | `npm run audit:effect-foundation`; `npm run test:effect-foundation`; `extract-effect-source.ps1` | Extraction defaults to verified 8.1.1 |
| Battlefield discovery/tiles | `npm run test:battlefield-discovery`; `npm run test:battlefield-tiles` | Source identity/membership, not world geometry |
| Assembly/height | `npm run test:battlefield-assembly`; `npm run test:battlefield-height` | Provisional alignment/composition |
| Other focused battlefield suites | `python3 scripts/test_battlefield_composition.py`; `python3 scripts/test_battlefield_deployment.py`; `python3 scripts/test_battlefield_decoder.py` | Read prerequisites; decoder tests may require built tooling |
| Cold Mires | `python3 scripts/cold_mires/test_map.py`; `python3 scripts/cold_mires/test_rebuild.py` | Requires declared dependencies; array agreement is not passability proof |

The `build_battlefield_*`, `extract-battlefield-*`, `discover-battlefield-*`,
`battlefield_*` and `query_battlefield.py` programs remain experimental. Start
with the [battlefield README](../docs/development/battlefields/README.md).

## Gate coverage and side effects

`npm run validate` runs architecture, units, skills, economy, campaign,
technologies, guides, victory/README/battle-map tests, magic, battlefield discovery
and tiles. CI additionally runs architecture mutations, snapshot/newline tests,
technology corruption, effect-foundation, campaign-start and magic regressions.
Optional assembly/height/decoder/Cold Mires suites are not all in the aggregate;
run them when changing their implementations.

Legacy owner validators write audit JSON/Markdown into their target directory.
Build candidates under `work/`; verify installed snapshots in an isolated checkout.
Inspect and exclude incidental report changes from unrelated PRs. If a suite
terminates without diagnostics, retain exit/signal/resource evidence, investigate
only enough to identify the blocker, and continue independent checks. Never weaken
expectations or refresh hashes to force a pass.
