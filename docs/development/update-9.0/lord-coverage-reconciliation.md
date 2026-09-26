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
| Ikit and Skrolk | Current skill files; Skaven source/roster comparison | Bespoke workshop/faction effects must not be inferred from skills; Skrolk's Cauldron mount is an unresolved unit candidate |
| Arch Lector / Nurgle generic lords | Current character CSVs and changed-key evidence | Current files present; per-change reconciliation pending |
| Sigvald | `technology-selectors.md` reconciles `chs_mil_sigvald` and Azazel membership | Selector already source-reviewed; gifts are not established by this check |
| Arkhan | Source permission comparison includes current variants and shared undead units | Review exact owner/variant inclusion; permission alone is not campaign acquisition evidence |
| Settra / Red Duke items | Skill files do not provide a complete item-effect catalog | No new item-effect model required; check existing grants only where represented |
| N'Kari / Masque / Dechala buildings | Current economy owner retains building levels and tiers | Reconcile those fields only; full unit recruitment semantics are not existing economy coverage |
| Archaon subjugation, Vampire Lairs and other bespoke systems | Existing boundaries in `COMPATIBILITY_9.0.md` | No new structured model or closure requirement introduced by this review |

The broader permission comparison finds **872 candidate race/unit rows across 23 rosters**, including **80 DLC29 candidate rows** after the bounded repair. These are not 872 proven missing playable units: rows repeat across race permissions and include special/custom-battle identities. Do not bulk-import them. Review source identities and applicability before deciding inclusion. Concrete examples include Emil Valgeir's warhorse, Skrolk/Plague Priest Cauldron mounts, and undead caster/mount variants. This pattern predates the two repaired lords and shows why military-group equality alone cannot prove roster completeness.

Next existing-scope review: resolve the DLC29 candidate identities and mount chains, then trace each announced skill/building/research change to current rows and old/new evidence. Keep unresolved cases on #16; do not turn deferred new capabilities into migration blockers.
