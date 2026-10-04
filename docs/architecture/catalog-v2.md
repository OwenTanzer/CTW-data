# Catalog v2 migration

Version 2 separates authority routes. No production CSV, GeoPackage, source
manifest, owner schema, gameplay value or existing script entry point moves.

| v1 | v2 | Consumer action |
| --- | --- | --- |
| `datasets.cold_mires_hypothesis` | `development_datasets.cold_mires_hypothesis` | Discover matching candidates through `development_discovery`; apply qualified-use rules instead of treating them as facts |
| Shared abilities/effects only nested under magic references | Direct `datasets.shared_abilities` and `datasets.effect_semantics`, `role=shared_owner` | Route exact relations to their existing owners; do not expect race CSVs |
| Implicit entry purpose | `lifecycle` and `role` on production entries | Distinguish retrieval datasets, shared owners and historical guides |
| No implementation route | `maintenance` and `maintenance_loading_strategy` | Maintainers discover joins, evidence and the change process separately |
| Global exclusion of all post-9.0 evidence | Owner-specific snapshot boundary | Retain explicit 9.0.1 additions and 8.1.1 guide scope |

This intentionally changes the catalog major schema version: no silent alias for
Cold Mires remains inside `datasets`. A consumer that only understands version 1
must reject version 2 or remain pinned. Do not enumerate all entries assuming
each has the same storage format; select by ID/role and consult the owner's schema.

The repository's inspected snapshot tests read `catalog.snapshot`; its values
are unchanged. Analysis main pins an older 8.1.1 catalog. Adviser main and its
open packet PR pin Data `3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`, including
catalog and agent-document fingerprints. Those checkouts keep working unchanged.
This PR does not refresh a consumer lock or imply either consumer has adopted v2.

For a later source update: inspect the new catalog and owners, update the
consumer's supported catalog version/routing and selected file inventory, review
all changed hashes and owner scopes, run source verification/import/reconstruction
and lookup tests, and commit lock, contract and fresh evidence together. Rollback
is selecting the previous source pin; no data backfill is necessary for this PR.
