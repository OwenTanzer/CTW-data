# Existing-table lord coverage review — 26 September 2026

Scope: repair and reconcile existing 9.0 unit, skill, technology and building coverage. No new campaign-state, recruitment-lifecycle, item-effect or ability-phase model is required. Magic #14 remains paused. This is a partial reconciliation, not permission to close #16.

## Boris and Nagash repair

The unit selector used only configured military groups. Current `main_units` and `units_custom_battle_permissions` contain Boris's four `wh3_dlc29_emp_cha_boris_todbringer_toddy_0`–`_3` records and `wh3_dlc29_vmp_cha_nagash`, but none has a military-group membership. Explicit reviewed permission inclusions restore them under Empire and Undead Legions. The builder checks each inclusion against its source faction permission and produces the existing companion relations without fabricating military-group memberships.

The legacy Boris permissions and land records have no corresponding legacy main-unit records in this snapshot. The new keys are retained; legacy keys are not substituted or duplicated. No stat, ability or source export was manually edited.

Result: 2,290 → 2,295 roster rows; Empire 122 → 126; Undead Legions 150 → 151. Companion deltas: five components, five weapon links, 36 culture-qualified abilities, 15 attributes, five permissions and three mount links. No new schema columns. Unit validation passes with no unresolved joins. Independent fixtures cover the five new playable lords and ten mount links. Mutation checks remove each unit/link and substitute legacy Boris; all are detected.

## Reconciliation evidence and remaining work

Run `python3 scripts/audit-9.0-lord-coverage.py` to reproduce the accompanying JSON. It records exact skill paths, hashes, keys and relevant rows, plus missing permission candidates by roster. This is evidence of current presence and potential selection omissions, not a complete semantic audit or runtime verification.

| Update | Existing coverage/evidence | Review disposition |
|---|---|---|
| Five new playable lords | Independent race-specific unit and mount fixtures in `scripts/lord-unit-coverage.mjs` | Boris/Nagash repaired; all five pass bounded presence/link checks |
| Vlad/Isabella conversion skills | Hero CSVs contain Emperor of Bones / The Countess Commands and explicit conversion effects | Skill declarations present; executing conversion is outside existing tables |
| Kemmler | Current CSV contains ability unlocks, including Eternal Vigour | Verify the whole old/new skill delta; ability payload modeling remains deferred |
| Ghorst, Red Duke, generic Vampire Counts | Current skill files and scoped evidence in JSON | File presence verified; not all individual changed effects reconciled |
| Throt | Stormfiend-targeted effects occur in current skills, including Master of the Mutated | Numeric skill rows present; Flesh Lab runtime behavior is outside scope |
| Ikit and Skrolk | Current skill files; Skaven source/roster comparison | Bespoke workshop/faction effects must not be inferred from skills; Skrolk's Cauldron mount was restored in PR #18 |
| Arch Lector / Nurgle generic lords | Current character CSVs and changed-key evidence | Current files present; per-change reconciliation pending |
| Sigvald | `technology-selectors.md` reconciles `chs_mil_sigvald` and Azazel membership | Selector already source-reviewed; gifts are not established by this check |
| Arkhan | Source permission comparison includes current variants and shared undead units | Review exact owner/variant inclusion; permission alone is not campaign acquisition evidence |
| Settra / Red Duke items | Skill files do not provide a complete item-effect catalog | No new item-effect model required; check existing grants only where represented |
| N'Kari / Masque / Dechala buildings | Current economy owner retains building levels and tiers | Reconcile those fields only; full unit recruitment semantics are not existing economy coverage |
| Archaon subjugation, Vampire Lairs and other bespoke systems | Existing boundaries in `COMPATIBILITY_9.0.md` | No new structured model or closure requirement introduced by this review |

The broader permission comparison finds **801 raw candidate race/unit rows across 23 rosters**, including **12 DLC29 candidate rows** after the availability follow-up. These are not 801 proven missing playable units: rows repeat across race permissions and include special/custom-battle identities. Do not bulk-import them. Review source identities and applicability before deciding inclusion. The 25 confirmed mount omissions described below have now been restored; the 12 DLC29 candidates are reviewed duplicate exclusions, while other candidates still require individual scope review. This pattern predates the two repaired lords and shows why military-group equality alone cannot prove roster completeness.

The DLC29 candidate identities and mount chains are now dispositioned in `availability-decisions.md`. Next existing-scope review: trace each announced skill/building/research change to current rows and old/new evidence. Keep unresolved cases on #16; do not turn deferred new capabilities into migration blockers.

## General update fixes added to PR #18

Restored 25 reviewed mounted race/unit entries whose base units were already covered: Empire 1, Skaven 2, Tomb Kings 6, Undead Legions 16. Each has a current main/land record, an explicit source mount edge, and permission for the roster faction. PR #18 brought coverage to 2,320 rows (30 above its base). The independent fixtures retain all five new playable lords and add every reviewed mount chain. Existing global mount lookup edges were already present; the repair fills the missing race-roster statistics and their associated relations. It does not establish campaign acquisition.

Corrected eight non-Beastmen technology audit descriptions. The extractor and the reader of older compact evidence share a conservative fallback description; original source exports, hashes, line numbers and evidence IDs remain intact. Scripted unlock semantics remain unmodeled.

Skill README totals now render from the generated manifest: 550 files, 575 node sets, 32,385 nodes and 157,965 effects. The template uses placeholders and regeneration tests compare the displayed totals with the manifest.

The availability follow-up resolves the 55 DLC29 decisions (43 included, 12 duplicate identities excluded) and restores three additional canonical Arkhan records under Host of Nagash permissions, bringing coverage to 2,366 rows. See `availability-decisions.md` for qualifications. The JSON comparison deliberately retains excluded identities as raw source candidates; it does not classify them as unresolved omissions. Issue #16 remains open for broader existing-table reconciliation. These repairs add no new mechanics model; magic remains paused.
