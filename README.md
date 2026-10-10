# CTW-data

Source-backed, machine-readable reference for **Total War: WARHAMMER III**.
This repository owns game records, identities, provenance, constraints and coverage.
[CTW-analysis](https://github.com/OwenTanzer/CTW-analysis) owns research and experimental
interpretation. [CTW-adviser](https://github.com/OwenTanzer/CTW-adviser) owns derived
serving artifacts, client tools and the planned operational matchup model.
Read the [division of labor](docs/architecture/repository-boundaries.md).

## Choose a route

| Task | Start here |
| --- | --- |
| Answer a game-data question | [Catalog](context_catalog.json), then the selected owner's README, manifest/schema and audit |
| Implement a source/schema/retrieval change | [Documentation map](docs/README.md), [connections](docs/dataset-connections.md), [development inventory](docs/development-state.md), then current issue/PR scope |
| Rebuild or validate | [Pipeline guide](scripts/README.md) and [contribution process](CONTRIBUTING.md) |
| Evaluate the proposed organization | [Diagnosis and redesign](docs/architecture/restructuring-proposal.md), [catalog v2 migration](docs/architecture/catalog-v2.md), [verification](docs/architecture/verification.md) |

[AGENTS.md](AGENTS.md) supplies retrieval and evidence rules. Ordinary fact lookup
must not treat development hypotheses, source-only branches or unmerged consumer
PRs as production truth.

## Snapshot and coverage

Base: **9.0 / Steam build 25507028**, ultra unit scale. Magic/shared ability/effect
additions retain **9.0.1 / 25546563** extraction evidence with checks against reused
9.0 inputs. Historical faction guides retain **8.1.1** scope. These are per-owner
qualifications, not a global patch upgrade. Owner manifests and coverage reports
are authoritative for the counts and limitations below.

| Owner / retrieval layer | Purpose |
| --- | --- |
| [Units](data/unit_stats/README.md) | 25 race rosters, 3,181 roster rows; components, weapons, projectile/explosion and qualified availability relations |
| [Shared abilities](data/unit_stats/abilities/README.md) | Native casting, phase, lifecycle and payload companions used across units and magic |
| [Effect semantics](data/effect_semantics/README.md) | Bounded native bindings, stat definitions and scopes; no complete campaign modifier resolver |
| [Skills](data/skill_trees/README.md) | 550 character files, 575 conditional node sets |
| [Technologies](data/technology_trees/README.md) | 109 faction files with variant selectors and bounded scripted evidence |
| [Economy](data/economy/README.md) | 109 faction building catalogs; recruitment topology remains incomplete |
| [Campaign atlas](data/campaign_map/README.md) | 644 regions, 215 provinces, 109 primary faction army starts, objectives and battle-map relations |
| [Magic](data/magic/README.md) | Partial indexed character-to-ability discovery with separate structural, definition and runtime coverage |
| [Faction guides](data/faction_guides/README.md) | 24 historical qualitative guides; read [compatibility notes](data/faction_guides/COMPATIBILITY_9.0.md) |

[Cold Mires](docs/development/battlefields/cold-mires/README.md) is a discoverable, explicitly qualified
terrain hypothesis. Reproducibility does not certify alignment, water behavior,
forest cover or passability. Battlefield extraction is separate from production
spatial truth. See the [discovery/use policy](docs/architecture/provisional-evidence.md).

## Physical layout

- `data/`: existing owners, generated records, schemas/manifests, retained source
  exports and qualified historical material. Paths stay stable.
- `docs/architecture/`: boundaries, redesign, migration and verification.
- `docs/dataset_connections.json` and `docs/development_inventory.json`: checked
  contracts and dated evidence pointers, with generated readable views.
- `docs/development/`: retained extraction, migration and hypothesis evidence;
  some production validators link their scoped reports here.
- `scripts/`: existing entry points, grouped in the [pipeline guide](scripts/README.md).
- `work/`: ignored candidates, caches, tooling and disposable outputs.
- `relations.tex`: historical combat research retained for compatibility; future
  research/model work follows the three-repository boundary.

## Validate and rebuild

Use **Node.js 24+ and Python 3.11+**. Standard validation uses built-in modules;
optional Cold Mires rendering/rebuild tests need its NumPy/Matplotlib dependencies.
Fresh extraction requires the verified game installation and RPFM (Rusted PackFile
Manager); offline checks do not.

```bash
npm run validate:architecture
npm run test:architecture
npm run validate
```

`validate` is the aggregate dataset gate plus architecture validation, not every
regression test. See [all validation groups](scripts/README.md). Some legacy
validators write audit reports to the validated dataset directory. Use an isolated
checkout and exclude incidental timestamp/environment changes from unrelated PRs.
Architecture validation is read-only.

Extract a verified source snapshot, build a fresh `work/` candidate, then run the
owner's validators before installation. Never hand-edit generated data. Update
generated README templates/builders when appropriate. Text fingerprints accept
only recorded LF/CRLF forms; technology artifacts retain exact bytes through
`.gitattributes`.

## License

Unofficial research project, unaffiliated with Creative Assembly or SEGA. Project
code and authored documentation use the [MIT License](LICENSE). Third-party
content and derived game datasets are not relicensed; see [NOTICE.md](NOTICE.md).
