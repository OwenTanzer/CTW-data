# Empire campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | Empire |
| Race slug | `empire` |
| Playable factions | 5 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The five faction economy CSVs already enumerate enabled building levels, costs, construction times, prerequisites, standardized outputs, and ordinary recruitment effects. The normalized unit file and typed lookups already cover Empire unit statistics, abilities, attributes, weapons, mounts, military-group membership, and faction permissions. The 27 character files already contain the skill trees of the five legendary lords, the four Hunters, Ulrika Magdova, Theodore Bruckner, and the generic Empire characters. Those rows are not repeated here. This document records campaign systems, acquisition rules, resource loops, faction branches, and scripted availability rules that the catalogs cannot express.

## Mechanically relevant material not captured elsewhere

### Imperial Authority after Update 5.0

**Applicability:** all five playable factions in Immortal Empires: Reikland (`wh_main_emp_empire`), The Golden Order (`wh2_dlc13_emp_golden_order`), The Huntsmarshal's Expedition (`wh2_dlc13_emp_the_huntmarshals_expedition`), Cult of Sigmar (`wh3_main_emp_cult_of_sigmar`), and Wissenland & Nuln (`wh_main_emp_wissenland`). The Realm of Chaos dispatch contains only Wissenland & Nuln; the exact activation lifecycle there remains bounded below.

Imperial Authority (`emp_imperial_authority_new`) is a territorial percentage, not a currency accumulated and spent. The script calculates `floor(100 * E / T)`, where `E` is the number of regions in the Empire region group owned by any Empire-culture faction and `T` is the total number of regions in that group. The resource factor is `empire_settlements_owned`.

The five installed bands and their effects on the player's owned Empire provinces or regions are:

| Authority | Control | Growth | Income |
|---:|---:|---:|---:|
| 0–25 | -4 | -20 | -10% |
| 26–50 | -2 | -10 | — |
| 51–75 | +1 | +5 | — |
| 76–99 | +2 | +10 | — |
| 100 | +3 | +20 | +10% |

In Immortal Empires, Reikland and Wissenland & Nuln begin with the system active. The Golden Order, Huntsmarshal's Expedition, and Cult of Sigmar begin with it hidden at `-1`; when one of those factions first acquires a region in the Empire region group, the region-change listener marks it active and sets its current percentage. The Realm of Chaos table names Wissenland & Nuln as active, but the same file also defines a Realm-of-Chaos reset to `-1`; the narrow audit did not establish the executable call path for that reset, so no more specific Realm of Chaos activation claim is made.

### Reikland: Elector politics, Prestige, and Emperor's Decrees

**Applicability:** Reikland (`wh_main_emp_empire`) only.

The Elector politics script models ten living Elector factions but thirteen offices, adding the historic seats of Solland, Sylvania, and Marienburg. Each office links a capital, ministerial position, State Troop, and Runefang or other unique ancillary. Listeners maintain Fealty and political events, Elector deaths, appointments and rewards, wars and peace, invasions and civil wars, confederation transitions, and the occupation decision that can return an Elector region.

While this system operates, the script disables the ordinary confederation and non-aggression diplomatic paths with Electors; political events and Fealty provide the alternate relationship and confederation route. On a completed construction above engine building level 0, Prestige is added as `3 × (building:building_level() + 1)`; it is not a flat 3 per completion. Prestige is also the input for Emperor's Decrees; the current official description identifies decree outcomes such as Inquisition, Send Aid, and Casus Belli, but exact 8.1.1 decree costs were not established from the decoded relations and are therefore not stated.

`wh3_dlc25_summon_the_elector_counts` no longer replenishes State Troop pools. It teleports appointed Elector characters who are alive, unwounded, not besieging, and not resident in a garrison to Karl Franz. Creative Assembly's Update 5.0 description additionally states that Reikland receives trespass immunity in Empire territory; that high-level rule is official-source-only in this audit. The ordinary State Troop unit records and their battle data remain in the unit catalog. Update 5.0's current official notes specify a 3% State Troop upkeep reduction for each held Elector seat.

### The Golden Order: Colleges of Magic and the Cathay branch

**Applicability:** The Golden Order (`wh2_dlc13_emp_golden_order`) only.

Arcane Essays (`wh3_dlc25_emp_arcane_essays`) are generated after battles by armies containing Imperial Wizards; the localized resource rule states that additional Wizards generate additional Essays. The pending-battle listener disables the Essays post-battle resource when the force contains no Wizard. Essays are spent through the Colleges of Magic panel on recruitment, campaign actions, items, cost modifiers, and Cataclysm spells. AI-controlled Golden Order instead receives a per-turn fallback of 50, 50, 75, 100, or 100 Essays at campaign-difficulty indexes 1 through 5.

Seven colleges begin locked: Amber, Amethyst, Bright, Celestial, Grey, Jade, and Light; the Golden Order is the default college. Recruiting or summoning the matching Wizard unlocks that college and its linked actions. Each Wizard-recruitment ritual increases Wizard capacity by one and spawns the corresponding Wizard. The verified college action families include Amber summoning, Amethyst damage to enemy forces, Bright wall damage, Celestial movement restoration, Grey ambush support, Jade healing, and Light protection. The transmutation action supplies 2,000 treasury, and the installed direct-damage proportion is `0.3`; exact costs not established in the decoded relations are omitted.

The early Cathay progression listens for taking a relevant initial region, completing its province, and the destruction of the hostile Burning Wind Nomads. Its final dilemma can force an alliance with Zhao Ming, declare war on him, or return to the Empire. The return branch heals and teleports all Golden Order forces and characters to Altdorf when safe, otherwise to fallback coordinates; it transfers Golden Order regions in Cathay to Zhao Ming and grants ten turns of Empire-territory trespass immunity. This branch does not run when Zhao Ming is human-controlled.

In Immortal Empires, all thirteen State Troops are placed in the Golden Order mercenary pool but start event-locked. Researching the six technology records `wh3_dlc25_tech_emp_state_troops_1` through `_6` removes the corresponding infantry, missile, artillery, and cavalry locks. Unit identities and statistics remain in the catalogs; the technology-driven pool lifecycle does not.

### The Huntsmarshal's Expedition: Mandate, Supplies, and the Hunters

**Applicability:** The Huntsmarshal's Expedition (`wh2_dlc13_emp_the_huntmarshals_expedition`) only.

The Emperor's Mandate is implemented through Acclaim (`emp_progress`), Hostility (`emp_wanted`), and an Imperial Supplies meter. Acclaim has thresholds at 20, 40, 60, 80, and 100. Capturing a settlement adds 3, losing territory subtracts 2, building or upgrading a port adds 1, and unlocking a Hunter adds 4. Progressively higher Acclaim releases scripted building locks: tier 2 unlocks the tier-three barracks and tier-two stables; tier 3 unlocks the tier-two forge, tier-three stables, and tier-three shooting range; tier 4 unlocks the tier-three forge; tier 5 unlocks the tier-four forge.

Hostility has thresholds at 10, 20, 30, 40, 50, and 60. Capturing a settlement adds 7, raiding or sacking adds 2, attacking or defeating an army adds 3, and designated events add 10. Losing a lord subtracts 10, and a reset subtracts 60. If the five-turn inactivity counter reaches zero without another increase, the script applies one `-0.1` adjustment; a new increase resets that counter. Retaliation armies at the six levels contain 5, 5, 10, 14, 14, and 18 units. The battle-time enemy bundle is applied to every opponent in a Huntsmarshal battle, not only Lizardmen, and is removed afterward.

Imperial Supplies starts at 90 and caps at 100. Its turn charge is selected from `2, 3, 4, 6, 8, 1` by the current Hostility state; reaching the cap opens the supplies dilemma. The Elector-support layer tracks ten Electors. Reaching affinity 5 with an Elector grants that Elector's specific reward and State Troop; other supply rewards use the generic path.

The four Hunters—Hertwig van Hal, Jorek Grimm, Kalara of Wydrioth, and Rodrik L'Anguille—have scripted acquisition and progression beyond their cataloged character records. A new human campaign issues all four first-stage missions. Completing stage 1 spawns the corresponding unique agent, replenishes its action points, and retries on the next faction turn if spawning fails. Their chains normally contain five stages, with scripted dilemma or failure branches in several stages. AI-controlled Huntsmarshal factions instead receive the four Hunters on turns 1, 10, 20, and 30. The faction's Lizardmen diplomacy is restricted: ordinary interactions are disabled, then payments, war, and peace are explicitly restored, with a multiplayer-teammate exception.

### Cult of Sigmar: Books of Nagash and State Troop unlocks

**Applicability:** Cult of Sigmar (`wh3_main_emp_cult_of_sigmar`) only.

Volkmar participates in the shared Books of Nagash system. Eight normal book missions require either capturing a designated region or engaging and defeating a book-carrying rogue force; the ninth book is Arkhan-only and automatically fails for the other participants. Book rogue armies cannot use ordinary diplomacy with participants beyond the scripted war setup. Single-player selects from faction-specific book locations, while multiplayer uses a fixed indexed order.

When a human participant completes a book mission, the matching mission is failed for other human Tomb Kings, Mannfred, or Volkmar participants. Each successful Volkmar mission grants the corresponding permanent bundle `wh3_main_books_of_nagash_volkmar_reward_1` through `_8` and increments `wh3_main_emp_volkmar_books_destroyed` by one.

That count drives a separate State Troop progression. The script initially places thirteen State Troops in the mercenary pool but event-locks them. Counts 1 through 8 unlock, respectively: Spearmen and Swordsmen; Crossbowmen and Halberdiers; Pistoliers and Handgunners; Mortars and Outriders; two Empire Knight variants; Knights of Morr; Carroburg Greatswords; and the Emperor's Wrath Steam Tank. Each stage also grants a linked Runefang or unique ancillary. Unit statistics and permissions remain in the catalogs; the book-driven unlock lifecycle does not.

### Wissenland & Nuln: Gunnery School and Amethyst Armoury

**Applicability:** Wissenland & Nuln (`wh_main_emp_wissenland`) only.

Schematics (`wh3_dlc25_emp_research`) are generated from damage inflicted by gunnery and artillery and spent on permanent Gunnery School upgrades, Amethyst unit access, and special abilities. Field Testing advances through four tiers of three active missions each. Completing all missions in a tier advances the stage and unlocks its unit, ritual, and upgrade families.

- Tier 1 unlocks the upgraded general-gunnery families.
- Tier 2 unlocks Amethyst Ironsides, the Outrider/buckshot material, and Bjuna Bombard.
- Tier 3 unlocks the Deathstorm Battery, Spirit Barrage, and higher general upgrades.
- Tier 4 unlocks the Black Rose/Land Ship material and Purple Eclipse.

The three Amethyst artillery abilities use separate single-use charge resources: `wh3_dlc25_emp_bjuna_bombard_charges`, `wh3_dlc25_emp_spirit_barrage_charges`, and `wh3_dlc25_emp_purple_eclipse_charges`. Battle completion subtracts actual uses, and depletion at or below zero triggers the associated incident. The official panel description states that charges can be restocked. Patch 8.1 fixed a crash after firing Amethyst artillery.

Field Testing also dispatches campaign-specific victory state. In Immortal Empires, `GunnerySchoolTierComplete2` completes the scripted Gunnery School objective in the short-victory mission. In Realm of Chaos, `GunnerySchoolTierComplete3` completes the corresponding objective in the long-victory mission.

### Wissenland & Nuln: Gardens of Morr

**Applicability:** Wissenland & Nuln (`wh_main_emp_wissenland`) only.

The Gardens network unlocks through an incident on turn 5 and is built through `wh3_dlc25_emp_ritual_construct_black_tower`. No more than five Gardens may be active. The construction ritual has a five-turn cooldown. Constructing one adds trespass permission against the host region's owner. War with the owner, invalid ownership, or removal of the foreign slot can destroy it. A transfer to a non-hostile Empire owner can retain the Garden and moves the trespass permission to the new owner.

`wh3_dlc25_emp_ritual_elspeth_teleport` moves Elspeth through the network, has a five-turn cooldown, and sets her remaining action points to zero. The faction feature `can_recruit_lords_in_foreign_slots` permits Wissenland & Nuln to recruit lords from these foreign slots. The active Garden regions are persisted in saved campaign state. For State Troop availability, Wissenland & Nuln's script unlocks most event-locked troops through linked technologies; it can also unlock the Emperor's Wrath from the Nuln building and Knights of Morr from a specific Garden foreign-slot building. Patch 8.1 fixed both the panel's loss of regions after reaching the cap and construction beyond the five-Garden limit.

### Empire legendary-hero acquisition

**Applicability:** Empire-culture factions as specified below; the characters' battle records and skill trees remain cataloged.

Ulrika Magdova's dispatcher permits Empire and Kislev cultures and separately overrides eligibility for Malakai's Dwarf faction. For an eligible Empire human faction, faction-leader rank 11 starts the Immortal Empires mission pair `wh3_dlc23_ie_emp_ulrika_stage_1` and `_stage_2`; Realm of Chaos uses the corresponding `wh3_dlc23_chaos_emp_ulrika_*` pair. The second stage triggers `wh3_dlc23_neu_ulrika_choice`; choice index 0 recruits her for a human faction. The executable threshold is 11 even though an adjacent script comment says 10. Eligible AI handling uses rank 15 and the non-recruit choice path.

Theodore Bruckner requires the Thrones of Decay Empire entitlement, permits Empire culture, and uses `wh3_dlc25_mis_emp_theodore_unlock_1` and `_2`. The human claimant priority is Wissenland & Nuln: if that faction is human-controlled, only it can receive his chain. His human unlock rank is 10; AI Wissenland & Nuln has a turn-20 fallback.

## Faction coverage

- **Reikland** (`wh_main_emp_empire`): Imperial Authority from Immortal Empires campaign start; Elector politics, Fealty, Prestige, Emperor's Decrees, Elector appointments and State Troop rewards; Empire-culture legendary-hero eligibility.
- **The Golden Order** (`wh2_dlc13_emp_golden_order`): Imperial Authority after first acquiring an Empire-group region; Colleges of Magic, Arcane Essays, the Cathay final-choice branch, and technology-driven State Troop locks; Empire-culture legendary-hero eligibility.
- **The Huntsmarshal's Expedition** (`wh2_dlc13_emp_the_huntmarshals_expedition`): Imperial Authority after first acquiring an Empire-group region; Acclaim, Hostility, Imperial Supplies, Elector support, scripted building gates, restricted Lizardmen diplomacy, and four Hunter chains; Empire-culture legendary-hero eligibility.
- **Cult of Sigmar** (`wh3_main_emp_cult_of_sigmar`): Imperial Authority after first acquiring an Empire-group region; Books of Nagash and book-count State Troop progression; Empire-culture legendary-hero eligibility.
- **Wissenland & Nuln** (`wh_main_emp_wissenland`): Imperial Authority from Immortal Empires campaign start; Gunnery School, Schematics, Field Testing and its campaign-specific victory objectives, Amethyst Armoury charges, Gardens of Morr, foreign-slot lord recruitment, and scripted State Troop unlock routes; priority claimant and AI fallback for Theodore Bruckner; general Empire eligibility for Ulrika.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all five files under `data/economy/factions/empire/`: `wh_main_emp_empire.csv`, `wh2_dlc13_emp_golden_order.csv`, `wh2_dlc13_emp_the_huntmarshals_expedition.csv`, `wh3_main_emp_cult_of_sigmar.csv`, and `wh_main_emp_wissenland.csv`.
- `data/unit_stats/normalized/empire__wh3__8.1.1__ultra.csv`; typed lookups `unit_rosters__wh3__8.1.1__ultra.csv`, `unit_abilities__wh3__8.1.1__ultra.csv`, `unit_attributes__wh3__8.1.1__ultra.csv`, `unit_mount_variants__wh3__8.1.1__ultra.csv`, and `unit_weapon_links__wh3__8.1.1__ultra.csv`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 27 indexed files under `data/skill_trees/characters/empire/`.
- Source-export localization under `data/unit_stats/source_exports/text/db/`: `pooled_resources__.loc.tsv`, `ui_text_replacements__.loc.tsv`, `effect_bundles__.loc.tsv`, and `effects__.loc.tsv`.

### Installed patch 8.1.1 evidence through read-only RPFM

All paths below were decoded from the merged vanilla `GameFiles` through `scripts/rpfm-call-locked.ps1`, using the literal `$CA` placeholder where a pack key was required. No pack was edited or saved.

- `script/campaign/wh3_dlc25_imperial_authority.lua` — percentage formula, thresholds, bundles, inactive-to-active transition, all-five-faction `main_warhammer` dispatch, Wissenland-only `wh3_main_chaos` dispatch, and the bounded Realm-of-Chaos reset function.
- `script/campaign/wh2_dlc13_empire_politics.lua` — Reikland-only politics, Elector offices, diplomacy replacement, construction-Prestige expression, event listeners, appointments, and `wh3_dlc25_summon_the_elector_counts`.
- `script/campaign/wh3_dlc25_college_of_magic.lua` — Golden Order college gates, Wizard capacity/recruitment, Essay battle condition, actions, and stable resource keys.
- `script/campaign/wh3_dlc25_gelt_dilemmas.lua` — Cathay progression and alliance/return/war branches, including the Zhao Ming human-player exclusion.
- `script/campaign/wh2_dlc13_wulfhart_imperial_reinforcement.lua` — Acclaim, Hostility, Supplies, retaliation sizes, building gates, enemy battle bundles, and Elector support.
- `script/campaign/wh2_dlc13_wulfhart_hunters.lua` — four Hunter mission chains, spawn retry, AI schedule, saved state, and Lizardmen diplomacy restriction.
- `script/campaign/wh2_dlc09_books_of_nagash.lua` and `script/campaign/wh2_dlc09_books_of_nagash_effects.lua` — participant rules, mission competition, location branches, permanent rewards, and Volkmar book-count increments.
- `script/campaign/wh3_main_volkmar_elector_units.lua` — event-locked State Troop pool and book-count unlock sequence.
- `script/campaign/wh3_dlc25_gunnery_school.lua` — Schematics, Field Testing tiers, Amethyst unlocks, three charge resources, use subtraction, depletion incidents, and IE/RoC scripted victory-objective dispatch.
- `script/campaign/wh3_dlc25_gardens_of_morr.lua` — turn-five unlock, five-Garden cap, foreign-slot ownership transitions, trespass permissions, teleport action-point consumption, and saved state.
- `script/campaign/wh3_dlc25_empire_state_troops.lua` — Golden Order/Wissenland event-locked State Troops and technology/building unlock routes, including Golden Order's Immortal Empires initialization.
- `script/campaign/wh3_main_legendary_characters.lua` — Ulrika and Theodore eligibility, rank gates, mission/dilemma keys, claimant priority, DLC gate, and AI fallback.
- `db/rituals_tables/data__` — `cooldown_time = 5` for `wh3_dlc25_emp_ritual_construct_black_tower` and `wh3_dlc25_emp_ritual_elspeth_teleport`.
- `db/campaign_features_tables/data__` — Wissenland's `can_recruit_lords_in_foreign_slots` feature and the reverse-audit check showing no Empire-specific exemption from generic `additional_army_upkeep`. Ordinary Supply Lines were therefore excluded as a generic campaign rule.
- Stable reverse-search anchors included all five faction keys; legendary-lord subtypes `wh_main_emp_karl_franz`, `wh_main_emp_balthasar_gelt`, `wh2_dlc13_emp_cha_markus_wulfhart`, `wh_dlc04_emp_volkmar`, and `wh3_dlc25_emp_elspeth_von_draken`; unique-character subtypes `wh3_dlc23_neu_ulrika`, `wh3_dlc25_emp_theodore_bruckner`, and the four `wh2_dlc13_emp_hunter_*` records; and the pooled-resource, mission, and ritual keys named in the body.

### Web grounding and omission discovery

- Creative Assembly, [Thrones of Decay: Introducing Elspeth von Draken](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/14-thrones-of-decay-introducing-elspeth-von-draken) — official Update 5.0 Empire system descriptions and the broad Imperial Authority applicability claim.
- Creative Assembly, [Total War: WARHAMMER III Update 5.0.0](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/17-total-war-warhammer-iii-update-5-0-0) — official Elector, State Troop, and Empire rework changes.
- Creative Assembly, [Total War: WARHAMMER III Patch 8.1](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101) — current Garden and Amethyst artillery fixes.
- Creative Assembly, [Total War: WARHAMMER III Hotfix 8.1.1](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14865-total-war-warhammer-iii-hotfix-8-1-1) — current snapshot check; no additional Empire mechanic change listed.
- Community discovery pages for [Colleges of Magic](https://totalwarwarhammer.fandom.com/wiki/Colleges_of_Magic), [Emperor's Mandate](https://totalwarwarhammer.fandom.com/wiki/Emperor%27s_Mandate), and [Books of Nagash](https://totalwarwarhammer.fandom.com/wiki/Books_of_Nagash), plus the Creative Assembly forum [Markus Wulfhart omission checklist](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/8-general-discussion/threads/4920-polishing-markus-wulfhearts-campaign-after-tod-and-patch-5-0). These were used for vocabulary and candidate discovery only; operative claims were checked against installed files.

### Evidence limitations and exclusions

- The Realm of Chaos Imperial Authority table contains Wissenland & Nuln, but the same Lua file defines a Realm-of-Chaos reset to hidden `-1`; the narrow audit did not recover the active call path. The guide therefore reports the dispatch and limitation without inventing a more specific activation rule.
- Exact Emperor's Decree, college-action, Gunnery-panel, Garden-construction, and Garden-teleport costs were not all established through stable narrow relations. Their operating loops and the two Garden cooldowns are documented, but unsupported costs are omitted.
- A bounded reverse audit found no Empire-specific climate, Growth replacement, occupation/colonization, movement-stance, vassal, or additional-army-upkeep exception. Ordinary instances of those generic systems are outside this guide's scope.
- RPFM queries were sequential. One broad path listing was not used as evidence; a later prefix-folder listing exhausted the endpoint and was not retried. Exact packed-file paths and narrow DB tables supplied every retained repair.
