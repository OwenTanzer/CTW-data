# Minor reconciliation and historical evidence

Reviewed September 26, 2026 (Pacific). Production remains 9.0 / Steam build 25507028. Base: `3ce90d80bcead2b7f5604c1b3ebfb307d3ff670f`.

## Verified retained-source checks

Run `python3 scripts/audit-9.0-minor-reconciliation.py` to reproduce `minor-reconciliation.json`, including exact input hashes. Grom, Rakarth and the Prince's 347 emitted node occurrences contain 1,397 effect occurrences matching the retained source by effect key, level, scope, value and multiplicity. All emitted conditional Prince variants are covered by this bounded comparison. Yvresse's variant includes Immortality and Mentor. This comparison does not independently certify node selection, prerequisite locks or final unit targets.

All seven active Skaven faction technology files have zero source building prerequisites among their selected technology keys. This verifies the ordinary DB requirement relation; scripted locks remain subject to the technology audit's separate boundaries.

## Completed targeted source audit

The user accepted the current installation for this audit and treats the hotfix as non-blocking. Read-only extraction on September 27, 2026 UTC verified executable 9.0.1.0 / build 25546563 before and after extraction. Production remains 9.0; no production rows or snapshot guard were changed. [Evidence](effect-target-evidence.json) preserves source identities, decoder and file hashes, and selected exact junction rows. These are static source chains, not runtime observations.

| Case | Verified chain | Disposition |
|---|---|---|
| Grom | Doom Diver `wh_main_grn_art_doom_diver_catapult` is explicitly included in both `grn_goblins` and `wh2_dlc15_grn_regular_goblins`. These resolve His Great Immensity leadership +9 and innate leadership +8 / physical resistance +10. | Relevant Goblin targets verified; retained skill rows already match. No base-stat adjustment needed. |
| Bloodshriek Chimera | `wh3_dlc27_woc_mon_chimera_ror` belongs to the Unchained Beasts melee-attack +8 set and the Gorefeast ability sets, including the unrestricted RoR route. All three Freakish Mutations effects resolve to its rank-7 and RoR sets. | Target coverage verified; rank filters retained. The resistance effect key says physical but its source bonus ID is `unit_damage_resistance_all_mod`; do not infer semantics from the key name. |
| Rakarth | Harpyclaw enables missile junctions `1787225455`, `1971218159`, `872549507` (Rakarth mount, Scourgerunner, Reaper). The Reaper weapon retains the normal bolt as default. Retained 9.0 projectile junctions also contain ordinary spread fire and the suppressing projectile. | Additional ammunition route verified with both ordinary modes retained. The retained 9.0 missile-weapon and unit-junction rows agree with the fresh selected rows. No normalized-stat repair identified. |

The evidence records target semantics without adding a normalized effects model. No new schema or magic work is required for these checks.

## Historical documentation review

`relations.tex` now points to the preserved 8.1.1 commit instead of treating the current unit README as its historical baseline. No native address or combat equation is promoted to 9.0 evidence by this edit.

The race guides remain 8.1.1 documents. A focused [9.0 errata section](../../../data/faction_guides/COMPATIBILITY_9.0.md#targeted-historical-guide-errata) gives corrected rite cooldowns and warns about obsolete Books, Krell and partner-role interpretations. Changed sections receive direct pointers. Other guide numbers, conditions and scripts are not silently relabeled as verified.

The original migration README incorrectly said main was unchanged and called 2,295 the current total. It now separates historical checkpoint counts from merged coverage.

## Remaining accounting

Issue #16 remains open. PR #20 has an exact-head no-blocker review and successful full validation, but awaits merge authorization. Finish the broader retained-source change register, remaining relevant permission omissions, and explicit disposition of smaller building/map changes. Physical battle-map pathing, quest-battle scripting and cosmetic behavior are not certified by static geography or unit CSV validation. Existing historical-guide boundaries must remain visible while their factual review continues.
