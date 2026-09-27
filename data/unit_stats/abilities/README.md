# Shared ability relations

This owner contains generic ability definitions, casting, phase links and payloads,
restrictions, recharge/intensity/replacement relations, vortices and bombardments.
It includes non-magic abilities so #7 and #14 use one shared implementation.

Read `dataset_manifest.json` and `schema_inventory.json`. Every table retains its
native columns, exact source keys and source path/line/patch. Foreign keys and
column types are schema-backed; engine arithmetic is not inferred. Blank remains
unknown or inapplicable; negative sentinels are not coerced to zero. Tables are
CSV with UTF-8/LF and ordinary CSV quoting.

The [magic source registry](../../magic/source_registry.json) routes existing
unit exports to their canonical owner and new exports to this directory. Rebuild
through `scripts/magic_pipeline.py`; validate with `npm run validate:magic`.
Do not hand-edit generated records. Ordinary character/spell retrieval starts
with [magic](../../magic/README.md), not these raw source exports.

This increment uses 9.0.1 extraction evidence with exact comparisons to reused
9.0 inputs. Projectile/explosion normalization remains under the existing unit
lookups; magic queries explicitly expose source-only payloads outside current
lookup coverage. This directory does not create another projectile catalog.
