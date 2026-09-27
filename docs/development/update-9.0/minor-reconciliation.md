# Minor reconciliation and historical evidence

Reviewed September 26, 2026 (Pacific). Production remains 9.0 / Steam build 25507028. Base: `3ce90d80bcead2b7f5604c1b3ebfb307d3ff670f`.

## Verified retained-source checks

Run `python3 scripts/audit-9.0-minor-reconciliation.py` to reproduce `minor-reconciliation.json`, including exact input hashes. Grom, Rakarth and the Prince's 347 emitted node occurrences contain 1,397 effect occurrences matching the retained source by effect key, level, scope, value and multiplicity. All emitted conditional Prince variants are covered by this bounded comparison. Yvresse's variant includes Immortality and Mentor. This comparison does not independently certify node selection, prerequisite locks or final unit targets.

All seven active Skaven faction technology files have zero source building prerequisites among their selected technology keys. This verifies the ordinary DB requirement relation; scripted locks remain subject to the technology audit's separate boundaries.

## Effect-target limitations

| Case | Retained production evidence | Remaining verification |
|---|---|---|
| Grom | Skill effects match the source | Whether Goblin-target unit sets include Doom Divers; labels alone cannot establish membership |
| Bloodshriek Chimera | `wh3_dlc20_chs_und_shared_beasts` has current effects in the Warriors of Chaos technology owner | Unit-set membership for this exact Regiment of Renown and the Freakish Mutations skill |
| Rakarth | Harpyclaw skill preserves `wh2_twa03_effect_suppressed_scourgerunners_bolt_throwers`; current projectile data is present | Effect-to-additional-ammunition route, retaining the ordinary firing modes |

The relevant effect-target junction exports are not present in these production owners. This is an uncompleted source audit, not evidence of incorrect current unit statistics, and does not authorize a new normalized effect model.

A fresh read-only extraction was attempted on September 26, 2026 (Pacific). The existing snapshot guard rejected the installation: executable **9.0.1.0**, Steam build **25546563**, versus expected **9.0.0.0 / 25507028**. It stopped before loading/exporting tables. No guard was relaxed and no 9.0.1 data was installed. Complete the exact 9.0 checks only with retained version-matched evidence; otherwise explicitly scope a separate hotfix comparison. Magic #14 remains paused.

## Historical documentation review

`relations.tex` now points to the preserved 8.1.1 commit instead of treating the current unit README as its historical baseline. No native address or combat equation is promoted to 9.0 evidence by this edit.

The race guides remain 8.1.1 documents. A focused [9.0 errata section](../../../data/faction_guides/COMPATIBILITY_9.0.md#targeted-historical-guide-errata) gives corrected rite cooldowns and warns about obsolete Books, Krell and partner-role interpretations. Changed sections receive direct pointers. Other guide numbers, conditions and scripts are not silently relabeled as verified.

The original migration README incorrectly said main was unchanged and called 2,295 the current total. It now separates historical checkpoint counts from merged coverage.

## Remaining accounting

Issue #16 remains open. PR #20 has an exact-head no-blocker review and successful full validation, but awaits merge authorization. Finish effect-target source evidence, the broader retained-source change register, remaining relevant permission omissions, and explicit disposition of smaller building/map changes. Physical battle-map pathing, quest-battle scripting and cosmetic behavior are not certified by static geography or unit CSV validation. Existing historical-guide boundaries must remain visible while their factual review continues.
