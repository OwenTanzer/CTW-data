# Documentation routes

For an ordinary game fact, start at [`context_catalog.json`](../context_catalog.json)
and the selected dataset README. Development artifacts are not default evidence.

For implementation or organizational work, read in order:

1. [Repository boundaries](architecture/repository-boundaries.md): which repository
   and dataset owns the change.
2. [Connection contracts](dataset-connections.md): existing joins, namespaces,
   conditions and explicitly missing edges.
3. [Development inventory](development-state.md): dated immutable evidence,
   source branches and open work. Refresh GitHub state before relying on it.
4. [Contribution process](../CONTRIBUTING.md) and [pipeline guide](../scripts/README.md):
   rebuild, validate and update the relevant contracts together.

The [organizational diagnosis and redesign](architecture/restructuring-proposal.md)
explains the rationale, implemented scope and staged follow-ups.
[Catalog v2 migration](architecture/catalog-v2.md) documents the consumer boundary.
[Verification](architecture/verification.md) records what was actually exercised.

## Retained evidence collections

| Collection | Use |
| --- | --- |
| [9.0 migration](development/update-9.0/README.md) | Historical source reconciliation and migration decisions |
| [Magic](development/magic/README.md) | Production reconstruction and scoped validation; wider gaps now #31 |
| [Battlefields](development/battlefields/README.md) | Development extraction; no general verified spatial dataset |
| [Cold Mires](development/battlefields/cold-mires/README.md) | Reproducible single-map hypothesis and inspection map |
| [Effect foundation](effect-foundation.md) | Historical extraction infrastructure and bounded later integration |
| [Combat relations](../relations.tex) | Historical working equations; not a current source schema |

For relevant provisional maps, use the [discovery/use policy](architecture/provisional-evidence.md).
For experiments shared across repositories, use the [evidence handoff](architecture/experiment-evidence.md).

The [registry format](architecture/registry-format.md) documents fields, statuses
and validation limits. The machine-readable registries point to existing manifests and inventories.
They do not replace those owners or copy every source table definition.
