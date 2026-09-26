# Raw effect source evidence

Patch 8.1.1, Steam build 24237342. This directory preserves the complete
220-table / 109,408-row extraction from database PR #12, unchanged.

Start with `source_exports/source_manifest.json` and `decoded_schema.json`;
select only the relevant table under `source_exports/db/`. Source values and
schema relations are evidence, not a claim of active bonuses or stacking.

Validate with `node scripts/validate-effect-source.mjs data/effect_semantics/source_exports`.

Experimental candidate targeting, modifier queries, character identity inference,
and derived SQLite indexes now belong to
[Computational Total War Analysis](https://github.com/OwenTanzer/computational-total-war-analysis/tree/feat/modifier-reference-migration/studies/modifier_reference).
Ordinary gameplay lookup continues through the existing normalized datasets.
