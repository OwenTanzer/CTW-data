# Registry maintenance contract

The executable v1 schema is enforced by `scripts/validate_architecture.py` using
Python's standard library; no package installation or network access is required.
These are compact routing contracts, not replacements for dataset schemas.

## Connection registry

`docs/dataset_connections.json` has `schema_version=1`, the 40-character
`audited_data_commit`, a scope description, named `endpoints`, and `connections`.

Each endpoint specifies a catalog owner ID, repository-relative path (a CSV glob
is allowed), format (`csv` or `sqlite`), referenced fields and namespace. SQLite
endpoints also specify a table/view. Native shared-table endpoints point to their
existing JSON `schema_inventory` and `schema_table`; exact owner path and column
membership must agree. CSV endpoints check headers of every matching file; SQLite
opens read-only and checks table/column existence. These checks do not assert that
all rows satisfy a foreign key or cardinality; the owner validators cover values.

`proposed_owners` can name a separate future owner with its issue and explicit
boundary, without inventing a production path. Only unresolved connections may
use one. In particular, capability routes do not make economy the owner of a
future recruitment graph.

Each connection has a unique ID, canonical owner, status, endpoint IDs, explicit
join edges, cardinality, conditions, missing boundary, snapshot requirements,
example, local evidence paths and issue URLs. Join edges name each endpoint and
its field tuple. Their lengths must match and every named field must exist.

| Status | Meaning |
| --- | --- |
| `production` | The bounded represented source relation exists; runtime validity remains qualified |
| `partial` | Existing supported joins coexist with the stated missing edge/semantics |
| `unresolved` | No complete production connection is asserted; existing endpoints are evidence only |

A connection can have no cross-table edges, for example a within-row namespace
mapping or a missing capability route. Never invent an empty production table to
make an unresolved contract look implemented. The validator explicitly prevents
status-only promotion of the currently known recruitment, battlefield and broader
magic gaps. A future completion needs new evidence and a reviewed contract/check
migration, not just a new status string.

## Evidence inventory

`docs/development_inventory.json` has `schema_version=1`, an ISO observation date,
refresh policy and unique records. Each record supplies repository, immutable
40-character commit, artifact path, lifecycle, evidence levels, owner, consumers,
local evidence links, boundary, next step, tracking URLs, observed status/date and
observation scope. Remote artifacts always have a commit/path pointer. `evidence`
contains local Data references only; external files are linked by the artifact
pointer. Generated views use immutable repository URLs for those pointers.

| Lifecycle | Meaning |
| --- | --- |
| `production_main` | Published owner work on inspected main; in Analysis it remains analysis |
| `development_main` | Committed developmental evidence, not a production owner |
| `source_branch` | Preserved immutable source evidence outside main |
| `open_pr` | Unmerged work at the observed head |
| `closed_unmerged` | Retained historical/superseded PR evidence |
| `historical_note` | Retained scoped working observations, not current canonical mechanics |

Evidence levels are `extracted`, `normalized`, `source_integrity_validated`,
`hypothesis`, `semantically_validated` and `runtime_verified`. The latter two
require a stated scope and supporting evidence before any maintainer adds them;
this inventory currently makes neither claim. The checker rejects runtime
verification on unreviewed branch/PR records but cannot authenticate empirical
results. Production location alone grants no scientific validity.

## Generated views and review

Run `python3 scripts/validate_architecture.py --write-docs` after editing either
registry, then `npm run validate:architecture` and `npm run test:architecture`.
Do not edit the generated guides separately. Refresh external paths and current
issue/PR state manually as described in [CONTRIBUTING](../../CONTRIBUTING.md).
Offline checks deliberately do not perform remote GitHub lookups, infer freshness
from today's clock, or certify the truth of free-text claims.
