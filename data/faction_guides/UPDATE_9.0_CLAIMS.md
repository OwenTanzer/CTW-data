# 9.0 claim dispositions and new-content supplement

Reviewed September 27, 2026 UTC. The 24 race guides are preserved 8.1.1 research, not current campaign specifications. This supplement supplies concise announcement-backed orientation and precise retrieval boundaries. It does not invent costs, unlock thresholds, runtime guarantees or new normalized mechanics.

## Affected historical claims

The Vampire Counts recruitment overview is superseded: Raise Dead is the main recruitment route, with infrastructure-backed capacities, provincial Corpses and Blood. Vampire Lords come through developed Lairs; Bloodline empowerment is repeatable rather than the old fixed awakening ladder. Confederation has task and resource requirements. These qualitative changes are described in [the free-update article](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/103); the old Kiss prices, probability tables and battle-marker thresholds must not supply current values.

Neferata's faction uses hero-operated Covens and Web of Power actions, governed by Manipulation and Concealment. Campaign Handmaidens must not be conflated with the battlefield unit. Current unit, character and faction identities belong to their normalized owners; this summary does not specify action prices or recruitment unlocks.

The [9.0 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/110) supersede Sigvald's all-gods interpretation, expand Archaon's acquisition options, and invalidate fixed Books ownership, summon-only Krell and permanently fixed Vlad/Isabella roles. Their exact implementation is not reconstructed from historical prose. [Existing errata](COMPATIBILITY_9.0.md#targeted-historical-guide-errata) record rite corrections; section-local notices identify other affected assertions.

## New faction orientation

These are bounded summaries of the linked official campaign articles. Stable keys are independently present in the current repository. They supplement the historical race guides without marking those guides freshly audited.

| Faction and current owner | Campaign orientation | Boundary |
|---|---|---|
| Neferata — `wh3_dlc29_vmp_neferata`, Vampire Counts | Covens and Web of Power; see the free-update summary above. | No current numeric campaign-system guide is claimed. |
| Nagash — `wh3_dlc29_nag_host_of_nagash`, Undead Legions | [Necropolises gather Necromantic Energy; the Black Pyramid supplies progression; Mortarchs extend character acquisition.](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/104) | An empty ordinary technology selector is not absence of progression. Specialized progression and acquisition conditions are not ordinary technology rows. |
| Glottkin — `wh3_dlc29_chs_host_of_the_triplets`, Warriors of Chaos | [Souls fund Nurgle-themed gifts, rituals, blessings and Gardens of Corruption.](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/105) | Nurgle association does not change the faction's Warriors of Chaos owner. Do not copy Festus's complete campaign rules onto it. |
| Thanquol — `wh3_dlc29_skv_clan_scruten`, Skaven | [Masterplans use underlings and evolving Schemes; Warpstone supports dealings with other clans.](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/106) | Plans and complications are not flattened into ordinary income or research. Campaign underlings are not automatically battlefield units. |
| Boris — `wh_main_emp_middenland`, Empire | [Fervour develops the Temple of Ulric; responses to Beastmen threats are part of his campaign.](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/107) | The old Empire faction census is incomplete. Temple progression is not inferred from ordinary building tiers. |

## Current owners and historical boundaries

| Question | Use | Do not infer |
|---|---|---|
| Unit/character configurations, mounts and faction permissions | `data/unit_stats/`, `data/skill_trees/` and their availability qualifications | An absent historical roster entry proves unavailability; [#23](https://github.com/OwenTanzer/computational-total-war/issues/23) tracks omissions. |
| Skill values and research structure | Current character/faction files and audits | An old guide's numerical bonus or target list is exhaustive. |
| Construction facts and narrow economic outputs | `data/economy/` | A blank column is zero, or conditional recruitment/resource mechanics are standardized income. |
| Army starts, geographic groups and map relations | Current atlas and starting-position evidence | A capital is an army start, straight-line distance is travel time, or static map rows simulate a crisis. |
| Initial victory conditions | `objective_reference` filtered by `variant_key`, with objective boundaries | The old generic victory text or initial configuration describes every runtime completion/reward. |
| Native mechanics and equations | Explicitly pinned 8.1.1 evidence in `relations.tex` | Historical addresses or formulas have been revalidated against the 9.0 executable. |

Old crisis descriptions, numerical hero-acquisition conditions, wound-recovery values and capacity rules retain their stated historical scope unless a current owner or specific erratum replaces them. Silence in an announcement does not prove unchanged behavior. New magic integration, campaign lifecycle simulation, dynamic battlefield resolution and detailed new progression models remain deferred under their existing issues.

The [claim register](../../docs/development/update-9.0/historical-claim-dispositions.json) identifies every guide and each point-of-use qualification added by this pass. This completes the explicit qualification of the identified historical claims, not a wholesale revalidation of every 8.1.1 script. The [release-section disposition register](../../docs/development/update-9.0/release-section-dispositions.md) maps announcement groups to existing owners and bounded evidence.
