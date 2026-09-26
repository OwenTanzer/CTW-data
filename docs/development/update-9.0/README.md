# 9.0 database compatibility refresh

Implements the bounded database refresh in #16. The review branch contains 9.0/build 25507028; main is unchanged until review and merge. Magic #14 remains deferred on its preserved checkpoint.

| Owner | Validated coverage |
|---|---|
| Units | 25 race rosters, 2,290 rows; schema v4 retains ability culture qualifiers |
| Skills | 550 distinct subtypes, 575 node sets; 50 added subtypes, 483 changed existing structural fingerprints |
| Economy | 109 faction files, 26,438 building rows |
| Technology | 109 faction files, 6,500 node occurrences, 1,722 technologies; explicit empty Nagash selector |
| Campaign | Map revision 7, 644 regions, 215 provinces, 109 primary starts and 118 total generals |

`connections-and-delta.json` records stable-key additions/removals/changes and raw-table deltas. All 109 faction keys match across economy, technology and atlas; every primary lord joins to a skill file. Nine overlapping raw DB tables have identical source hashes across owners. Raw row-set differences count modifications on both sides and are not counts of distinct new mechanics.

## Source and compatibility fixes

Installation verified September 26, 2026: executable 9.0.0.0, Steam build 25507028, executable SHA-256 `fa06fa719e68eabd0522091cace8f750d4e5ef46346ccdc86b0a7a3bdb682d97`. Extractors check source identity before/after and pin decoder schema and configured installation. Pack inventory records 271 names, sizes and mtimes, not full pack-content digests.

Updated the upstream RPFM schema after six table types failed decoding. Raw binary DB fallbacks now fail extraction. Fixed literal TSV parsing so unmatched prose quotation marks cannot swallow later records. Added source fingerprint checks before building, explicit patch profiles, fresh work-only extraction guards, and snapshot-specific scope.

Retained the existing military-group union policy; added Undead Legions and the changed Archaon/Festus/Glottkin groups. Shared character owners remain retrieval choices, not exclusive recruitment claims. Two reviewed subtype pairs share complete trees: Gotrek lord/hero and generic/named Handmaidens. Other duplicate structures still fail.

The old atlas extraction still requested map revision 5. Binary starting-position verification caught the mismatch; revision 7 was freshly extracted and rebuilt. All 572 settlement controls pass against its raster. The initial refresh incorrectly composed obsolete victory objectives. The PR #17 repair replaces that composition with the active 9.0 configuration: 1,175 initial objectives, 4,074 conditions and separate Vlad/Isabella variants. See `pr17-repair.md` for source boundaries and validation.

## Evidence limits

Read `technology-selectors.md`: Sigvald's override has official rework corroboration; Glottkin is a specifically reviewed source interpretation, with runtime not observed. Nagash's Black Pyramid is outside ordinary technology normalization. The technology audit retains 43 unmodeled lock sites, 96 typed script definitions and 5,478 missing-localization occurrences. Skills retain 190 unnamed node occurrences and 1,613 undescribed effect occurrences; keys and typed relations remain available.

The 24 faction guides retain their 8.1.1 evidence scope. Each links to `data/faction_guides/COMPATIBILITY_9.0.md`; the catalog distinguishes historical guide completion from current database coverage. Full new bespoke-mechanics guides, spell effects, expanded recruitment models, dynamic crisis maps and downstream analysis-project migration are not claimed complete by this database refresh.

## Validation

Passed: `npm run validate` across all database owners plus historical guide structure; eight technology corruption tests; thirteen campaign-start tests; validation-text and effect-foundation suites; three new snapshot/parser regression tests. Technology generation is byte-identical across two independent builds. Source and cross-owner audits are retained alongside this report. No game sessions were launched for runtime verification.

## Reproduction and retained evidence

Extract into a fresh ignored work destination with explicit final argument `9.0`; build and validate before installing source/output together. Example: `node scripts/extract-source.mjs work/source_units_9.0_fresh 9.0`. Builders infer the profile from verified source manifests. Historical 8.1.1 profiles remain available and reject a 9.0 installation.

The full map-7 atlas source is preserved separately on `checkpoint/campaign-map-9.0-source-20260926` under `archive/campaign_map/9.0_source_exports`; normal retrieval uses the GeoPackage. The compact starting-position evidence remains under its existing production owner. Raw game binaries and broad script scans stay out of production.

## Post-merge existing-table review

See [lord-coverage-reconciliation.md](lord-coverage-reconciliation.md) for the Boris/Nagash repair (current total 2,295 roster rows), independent lord fixtures and the remaining bounded reconciliation. Historical checkpoint counts above describe PR #17. No new mechanics model is included.
