# Using historical faction guides with the 9.0 database

The 24 race guides were researched for **8.1.1/build 24237342**. Their source references remain historical evidence. The normalized database is now **9.0/build 25507028**. A passing guide-structure check does not certify old prose against 9.0.

For numerical unit statistics, permissions, skill effects, buildings, technology nodes and starting positions, use the current database owner and its audit. Do not use old guide counts, unlock descriptions or lord effects to override it. This compatibility pass does not claim a complete rewrite of new bespoke campaign systems.

| Existing guide area | Required 9.0 interpretation |
|---|---|
| Warriors of Chaos | Sigvald's old all-gods access and Undivided technology claims are obsolete; use his explicit current source tree. Archaon's subjugation rules changed. Glottkin has a separate faction/tree, Festus and Glottkin share a revised military group, and additional Dark Fortresses exist. Do not apply the old eight-faction census. |
| Vampire Counts | Race systems, building resources, skill trees and lord effects changed substantially. The old Blood Kisses/Bloodlines, Raise Dead, corruption, commandments and recruitment narratives need re-audit. Neferata, new shared undead characters, Krell's unique-agent role, Red Duke access and Mourngul access are reflected where existing database schemas support them. |
| Skaven | Building prerequisites were removed from technologies. Skrolk, Throt and Ikit were updated for new units. Thanquol is an additional faction. New bespoke mechanics are outside this limited compatibility pass. |
| Empire | Boris/Middenland is now playable. New Ulric characters and units, updated Arch Lector/Warrior Priest trees and changed lord skills belong to the current indexes. Historical counts and prior Boris descriptions are obsolete. |
| Tomb Kings and Vampire Coast | Shared Nagash access does not change a subtype's canonical retrieval identity. Arkhan has expanded units, Tomb Scorpion's tier changed, and Books of Nagash rules changed. Use current DB effects and permissions; do not treat the old book-ownership description as current. |
| Slaanesh | Recruitment building chains and tiers changed. Use the current economy building catalog; its narrow numeric columns still do not constitute a complete recruitment lifecycle. |
| All races | Wound-recovery effects, Regiments of Renown capacity, skills, statistics and applicable source relations can change without a bespoke faction rework. Current effect/skill rows supersede old numeric prose. |
| Undead Legions | Nagash is the new 25th database race. No historical 8.1.1 guide exists. His `nag_tech` ordinary technology selector is empty; Black Pyramid feature progression is explicitly outside the normalized technology layer. Do not interpret zero ordinary nodes as no progression. |
| Campaign geography | The current atlas uses map revision 7, with 644 regions, 215 provinces and 109 primary faction army starts. Old map revision 5 and old starting positions are historical only. Dynamic crisis battle-map selection remains outside the existing static bridge. |

These notes identify changed boundaries; they do not substitute for a future full 9.0 guide audit. Spell-effect integration, expanded recruitment semantics, Black Pyramid progression and new campaign-state models remain separate work.

Official source register (read September 26, 2026):

- [9.0 release notes, including September 24 corrections](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/110)
- [Free update and Neferata](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/103)
- [Nagash](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/104)
- [Glottkin](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/105)
- [Thanquol](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/106)
- [Boris Todbringer](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/107)

Exact shipped keys and values come from the verified installation manifests and source exports, not announcement prose. The historical guide validator uses its preserved 8.1.1 faction index; current database coverage is validated separately against 109 factions.

## Targeted historical guide errata

These are narrow announcement-backed corrections to the historical guides, not a new installed-script audit. Source: [9.0 release notes, “Rites Cooldown Rebalancing”](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/110), read September 26, 2026. Other rite costs, rewards and conditions retain their historical scope. The shared global cooldown remains five turns.

| Race | Rite | 9.0 cooldown (turns) |
|---|---|---:|
| Skaven | Dominating Scheme | 13 |
| Skaven | Thirteenth Scheme | 13 |
| Skaven, excluding Clan Pestilens | Pestilent Scheme | 20 |
| Skaven | Scheme of DOOOOM! | 20 |
| Dark Elves | Hekarti | 15 |
| Dark Elves | Atharti | 15 |
| Dark Elves | Mathlann | 20 |
| Dark Elves | Khaine | 25 |
| Dark Elves | Drakira | 25 |
| Dark Elves | Anath Raema | 20 |
| Dark Elves | Warmaster | 25 |
| Lizardmen | Primeval Glory | 25 |
| Lizardmen | Tzunki | 15 |
| Vampire Coast | Sea Mist | 20 |
| Vampire Coast | Eternal Service | 15 |
| Vampire Coast | Queen's Cannon | 20 |

The same official notes invalidate the old permanent, nontransferable Books interpretation: ownership can change. Krell's former summon-only description and fixed Vlad/Isabella role assumptions are also historical. Consult current character/skill records; this erratum does not certify every campaign transition or reward.

## Claim-level review and new faction orientation

See [UPDATE_9.0_CLAIMS.md](UPDATE_9.0_CLAIMS.md) for point-of-use historical qualifications, current retrieval routing and concise announcement-backed coverage of Neferata, Nagash, Glottkin, Thanquol and Boris. This supplements the historical guides without changing their audit version or asserting a new mechanics model.
