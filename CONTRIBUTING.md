# Maintaining CTW-data

Start with the [repository boundary](docs/architecture/repository-boundaries.md),
the relevant [connection](docs/dataset-connections.md), and the selected owner's
README, manifest, schema and audit. Then inspect current related GitHub issues
and PRs. The [inventory](docs/development-state.md) is a dated starting point, not
live issue tracking. Routine investigation does not need a separate approval.

## A bounded change

1. Record the actual starting commit and working branch. Preserve unrelated work.
2. State the missing relation or behavior. Check existing normalized data, raw
   sources and preserved candidates before adding another extraction or owner.
3. Name the owner, consumers, namespaces, cardinality and conditions. Distinguish
   a missing source edge from an interpretation or operational-model question.
4. Build into a fresh ignored `work/` candidate. Validate against the exact source
   snapshot before installing generated production outputs. Never hand-edit them.
5. Update the owner README/manifest/schema/coverage and relevant catalog/connection
   records together. If a README is generated, change its builder/template and
   regenerate; editing the published copy alone will be lost.
6. Run the relevant pipeline checks and the offline architecture checks below.
   Record actual failures and limitations; a structural pass is not runtime proof.
7. Refresh overlapping PR heads and current issue scope before requesting review.
   Accepted scope corrections replace obsolete requirements. Keep historical
   decisions linked, not multiple contradictory 'current' instructions.

## Architecture records

- `context_catalog.json`: retrieval entry points; v2 separates development.
- `docs/dataset_connections.json`: selected cross-owner contracts, existing
  endpoint fields, conditional joins and unresolved edges.
- `docs/development_inventory.json`: durable commit/path pointers, observed
  lifecycle, evidence maturity, owner, consumers and next integration step.
- Generated Markdown views are deliberately separate from authored guidance.

```bash
python3 scripts/validate_architecture.py --write-docs
npm run validate:architecture
npm run test:architecture
```

`--write-docs` regenerates only the two readable registry views. Validation checks
registry structure, owner/path/field references, native inventory membership,
SQLite tables/columns, authority separation and generated-view drift. It is
read-only and offline without that option. Mutation tests verify rejection of
misrouting, missing keys, malformed pins and stale generated views. It does not
prove relation values/cardinality, gameplay semantics, remote path availability,
or that GitHub state is still current; owner validators and review supply those
different checks. `scripts/README.md` describes the wider suites.

## Refreshing remote evidence

For every inventory record relevant to a change, inspect the repository's actual
default-branch SHA, linked issue's current specification/state, PR head, draft and
merge state, and the path at the recorded immutable commit. Retain prior pins if
they identify historical evidence; update the observation and next step rather
than relabeling that evidence current. Verify referenced validation at its exact
tested commit, not merely a later PR head. Date the observation in UTC.

A changed head invalidates a prior head-specific observation immediately. Records
older than 30 days require refresh before being used as current progress evidence.
The offline validator does not enforce wall-clock age or call GitHub. Unknown or
unavailable remote evidence must be labeled unverified; local paths cannot be
the only reusable artifact reference. Do not copy issue bodies into this inventory.

## Downstream compatibility

Keep source records read-only to consumers. A lock update must deliberately
review new fingerprints, schemas, patch compatibility and output semantics.
Even a metadata-only change can require re-verification because Adviser hashes
this repository's instructions and catalog. See [catalog v2](docs/architecture/catalog-v2.md).
Never merge an experimental source branch merely to satisfy a consumer's pin.

Public paths and commands stay stable in this increment. Future file moves need
an explicit old-to-new mapping, a reference/pin audit, reproducible candidates,
and consumer migration evidence before the old interface is removed.
