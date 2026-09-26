# 9.0 compatibility migration — work in progress

Tracks #16. Production remains 8.1.1/build 24237342 until all owners and connections pass a coherent migration. This branch does not publish a completed 9.0 database.

## Verified installation and extraction

On 2026-09-26 the MSI installation reported Warhammer3.exe 9.0.0.0, Steam build 25507028. Executable SHA-256: `fa06fa719e68eabd0522091cace8f750d4e5ef46346ccdc86b0a7a3bdb682d97`. Extraction checks identity before and after, records the executable and appmanifest hashes, 271 pack filenames/sizes/mtimes, configured decoder installation, and decoder schema SHA-256. Pack metadata is not a full content digest.

The original RPFM schema could not decode six changed table types. Updated the upstream schema using RPFM's update_schemas command. Extractors now reject raw binary DB fallbacks instead of reporting success. Valid replacement exports are in the isolated MSI checkout `C:\Users\Owen\ctw-update-9\work`:

| Owner | Source candidate | Files |
|---|---|---:|
| Units | source_units_9.0_retry | 290 |
| Skills | source_skills_9.0_retry | 31 |
| Economy | source_economy_9.0_retry | 33 |
| Campaign atlas | source_atlas_9.0_retry | 74 |
| Technology | source_technology_9.0 | 84 |

Initial candidates without `_retry` are superseded and must not be promoted.

## Reviewed scope decisions

- Preserve the existing union-of-military-groups roster policy, adding Undead Legions. Source faction assignments replace Festus's old group with `wh3_dlc20_group_chs_festus_glottkin` and add Archaon's `wh3_dlc29_group_chs_archaon`.
- Frontend faction cohort is 109 distinct non-prologue keys across 25 subcultures. This does not imply 109 new factions or all campaign variants.
- Preserve existing canonical character owners when expanded cross-race permissions make them shared. Canonical owner is a retrieval choice, not exclusive recruitment availability.
- New shared subtypes use explicitly configured owners in scope-9.0.json. Glottkin/Gutrot are filed under Warriors of Chaos; shared Coast/Tomb Kings/Vampire Counts subtypes remain under their corresponding source race families. Nagash is under Undead Legions. All source permissions and node-set variants remain in each character file. The mapping is an editorial normalization policy, not a claim that the game declares a single owner.
- Gotrek lord/hero and generic/named Handmaidens have separate subtype/node-set identities but matching tree structures. Exact pairs are documented exceptions; other duplicate structures still fail.
- Unit schema v4 adds `culture_key` to ability links and their uniqueness key. Preserve literal `*` as the source wildcard. Specific cultures are conditions; blanks are not to be treated as universal. This is compatibility work, not the deferred spell-effect integration.

## Validation and remaining work

Initial unit and economy candidates passed their validators (25 rosters; 109 economy files and 26,438 building rows). Skill validation exposed an existing parser bug: RPFM literal TSV quotation marks were interpreted as CSV delimiters, swallowing later records. The new TSV reader rejects inconsistent widths and preserves quotes; 919 available TSV files passed a literal width check. Rebuild and revalidation are required after this fix.

Technology generation correctly stops on the newly overlapping Sigvald selector. Glottkin also has a new faction selector. Their replacement semantics require explicit review/evidence before adding overrides; existing Azazel semantics must not be blindly copied. Source script compaction currently retains the existing typed families (96 mechanics) and bounded references; that is not proof that new scripted behavior is fully normalized.

Still required: technology selector/script review, campaign atlas and binary starting-position rebuilds, source-versus-normalized change reconciliation, cross-owner key checks, guide/catalog/readme compatibility revisions, and coherent promotion only after all required validators pass. Magic #14 remains deferred; its separate checkpoint is preserved.

## Reproduction

Extract to a fresh ignored work directory with an explicit snapshot argument, for example:

```powershell
node scripts/extract-source.mjs work/source_units_9.0_fresh 9.0
node scripts/build-unit-dataset.mjs work/source_units_9.0_fresh work/generated_units_9.0_fresh
node scripts/validate-unit-dataset.mjs work/source_units_9.0_fresh work/generated_units_9.0_fresh
```

Skills, economy and technology use their corresponding extract/build/validate scripts. Builders derive the snapshot from validated source manifests; extraction defaults remain pinned to 8.1.1 and reject a mismatched installation. Do not use the old README extraction commands that write directly to production source directories.
