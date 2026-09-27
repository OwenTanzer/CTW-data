# Shared ability effect bindings and scopes

This is a bounded shared foundation for magic #14 and modifier semantics #7.
It contains source-backed effect-to-ability/group/phase bindings, related binding
families and scope definitions. It is not a completed campaign modifier resolver.

Read `dataset_manifest.json` and `schema_inventory.json`. Native columns and
bonus-value identifiers retain their exact source spelling (including
`enable_overchage`). One effect can have multiple bindings; never deduplicate
only by effect or replace group modifiers with unconditional spell grants.
Operations, targets, scope definitions and conditions are separate evidence;
raw bonus identifiers do not certify engine arithmetic or active applicability.

Canonical shared source paths and provenance are routed through
[data/magic/source_registry.json](../magic/source_registry.json). Query users
start with [magic retrieval](../magic/README.md). Rebuild through
`scripts/magic_pipeline.py`; validate with `npm run validate:magic`. No reader
needs an MSI workstation path or the earlier experimental modifier index.
