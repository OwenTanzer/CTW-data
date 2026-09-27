# Unit dataset audit

Status: **PASSED**

Checked 3155 normalized units across 25 faction files.

## Passed checks

- All 3155 roster rows are present.
- Unit keys are unique within each of the 25 race rosters; intentional cross-race sharing is preserved.
- All populated numeric and boolean fields have valid CSV representations.
- Every production CSV is valid UTF-8 with LF or CRLF endings and consistent row widths.
- The machine-readable schema inventory matches every CSV header and column position.
- Primary model counts, health pools, and target-size classifications are internally consistent.
- Curated missile-monster identities override source caste without erasing provenance.
- Every missile, projectile, and explosion reference resolves, including engine-attached weapons.
- Roster membership exactly matches configured military-group unions and reviewed source permission inclusions for 25 races.
- Structured roster availability and exact military-group/faction-permission lookup rows reconcile to source.
- All five new playable lords and reviewed update mount chains have independent coverage checks.
- Reviewed availability inclusions, qualifications and duplicate exclusions reconcile.
- All 804 historical permission cases retain reviewed identities, availability qualifications and exact source permission flags.
- Unit ability relations exactly preserve source culture conditions and wildcard values.
- Golden checks pass for Bestigors, Cygors, Ghorgons, Preytons, Sea Guard, Skaven weapon teams/artillery, Doomwheel, Black Orcs, Doom Divers, Rogue Idols, Arachnaroks, Necrofex, and Skycutters.
- All 290 raw source-export hashes match the manifest.
- No unresolved extraction or join flags remain.

## Warnings

- None.

## Errors

- None.
