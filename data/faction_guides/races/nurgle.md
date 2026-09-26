# Nurgle campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Nurgle | `race_slug=nurgle` | **Playable factions:** 3

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe the 207 applicable building rows and 78 unique constructible building levels for each playable faction, including ordinary costs, build times, prerequisites, and standardized outputs. The normalized unit file and typed lookups already describe Nurgle's 77 roster rows, faction permissions, statistics, weapons, abilities, and mounts. The 21 indexed character files already contain the skill trees for Ku'gath, Epidemius, Tamurkhan, generic characters, Kayzk, the other five Chieftains, the Cult Magus, and the Plague Cultist. Those facts are not repeated here. This document records the resource transactions, plague state, cyclical-building and recruitment rules, foreign-slot network, manifestation eligibility, character conversion, and faction-specific progression needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Infections, plague construction, and the symptom cycle

**Applicability:** all three playable Nurgle factions.

Infections (`wh3_main_nur_infections`) pay for plagues, cyclical military buildings and their acceleration, selected technologies, and cult construction. Ordinary building production remains in the economy catalog. One hidden race-wide transaction is not: when the campaign remaps a money-equivalent payload for a playable Nurgle faction, it returns 75% of the original money and Infections equal to 10% of that original value.

The plague panel does not unlock merely because the faction holds 200 Infections. The current script tracks cumulative positive Infections earned and opens the panel only after that counter reaches 200; spending or losing Infections does not advance it.

A plague combines three connected symptoms from an 18-symptom web. Using a symptom unlocks it as a possible starting node on a later web. The web reshuffles after every third player-created plague. At each reshuffle, the script randomly marks up to the faction's current maximum number of ordinary symptoms as **Blessed**; Blessed symptoms have double effects, cannot be mutations, and lose that Blessed state when used.

Duration, post-plague immunity, and spread are three independent mutation tracks—not one combined tier. Each track can be bought at level 0/1/2/3 for an added 0/50/100/150 Infections:

| Track | Level 0 | Level 1 | Level 2 | Level 3 |
|---|---:|---:|---:|---:|
| Duration | 3 turns | 4 turns | 5 turns | 6 turns |
| Immunity after expiry | 5 turns | 4 turns | 3 turns | 2 turns |
| Ordinary proximity spread | 25% | 35% | 45% | 55% |

The three surcharges are additive. These mutation profiles disable force-to-force battle infection; their spread values apply to the ordinary proximity channels instead.

The current direct-plague and Plague-Cultist ritual-cost records each consume 200 Infections before those track surcharges. Direct variants target an owned army or settlement. Agent variants create the campaign-only Plague Cultist at an owned army or settlement with full action points. Delivery removes Blessed state from its carried symptoms and destroys the Plague Cultist after it spreads the plague, so this route cannot export Blessed doubling.

The initial Blessed maxima are two for Poxmakers of Nurgle and one each for the Maggot Host and Tallymen of Pestilence. Technology `wh3_main_tech_nur_growth_21` adds one for every playable faction. Ku'gath additionally gains one maximum Blessed symptom each time he crosses a rank multiple of 10.

### Cyclical military buildings and instant recruitment

**Applicability:** all three playable faction keys.

Only Nurgle's military buildings remain cyclical. Their five initial construction transactions cost 200/200/200/400/400 Infections; later stages advance automatically. As a chain advances through its growth-and-decay stages, the stage's unit is added to the faction's instant recruitment pool; a stage can be gated by the settlement's main-chain level. All other Nurgle building types are static. The building rows and ordinary outputs remain in the economy catalog.

All three faction keys have the same **Rush Cycle** operation. It instantly completes the current stage and immediately awards that stage's units, charging 50 Infections per cycle turn skipped. This is a faction-scoped acceleration rule rather than another construction-cost column.

Instant recruitment health and cost depend on Nurgle corruption in the province from which the army recruits. The official current endpoints are 30% starting health with no cost discount at 0 corruption, rising to 60% starting health and -50% recruitment cost at 100 corruption. Intermediate results are interpolated by the game; no unsupported breakpoint table is asserted.

### Standard Nurgle cult network

**Applicability:** all three playable faction keys.

Since the cult rework, Nurgle cults are established deliberately rather than spawned by a corruption threshold: an ordinary Cultist establishes the standard form, while a Cult Magus establishes the improved form. All three factions use slot set `wh3_main_slot_set_nur_cult`. A cult with an adjacent-expansion bonus rolls that chance at the owner's faction-turn start. On success, it creates one new cult in a valid occupied adjacent foreign region that does not already contain that faction's foreign slot; the new region is revealed to the cult owner.

Completing the shared Acolyte Trials building `wh3_main_cult_magus_trial_2` spawns a Nurgle Cult Magus and dismantles the trial. The economy catalog contains the individual buildings, but not all of their conditional relationships and one-shot results:

- The first infection building produces 5 Infections, plus 20 while an enemy general is present.
- The plagued-region income building gives 50 foreign-building income, plus 300 while the region has a plague. It costs 200 Infections.
- The plague-lifetime building adds 50% plague lifetime, plus another 50% at 75 Nurgle corruption, while consuming 2 Infections and another 3 at that corruption threshold. It costs 200 Infections.
- The 100-Infection plague capstone destroys its cult and creates a Nurgle plague in that region.
- The two corruption branches have higher-threshold records that spread additional corruption and can add research, agent experience, or capacity; their ordinary costs/effect rows remain in the economy source material.
- The Cult Magus branch's unique 500-Infection capstone destroys the cult and creates plagues in the current and adjacent regions.
- The 300-Infection teleport capstone summons the faction leader to the cult region and destroys the cult.

### Unholy Manifestations

**Applicability:** `wh3_main_nur_poxmakers_of_nurgle` and `wh3_dlc25_nur_epidemius` only. The installed campaign group is explicitly named `wh3_main_feature_nurgle_excluding_tamurkhan`, and the Maggot Host is not a member.

The four manifestation families have 15-turn cooldowns and base/upgraded variants. The Great Game selects a different ascendant Chaos god every 10 rounds; when Nurgle is ascendant, its upgraded rituals replace the base forms. Corruption controls how many of the four families are available, but the exact corruption-to-unlock-band mapping was not recovered, so no unsupported threshold is stated.

- **Pestilent Growth** targets an owned army. Its base/upgraded bundles give +10%/+20% recruitment health and -15%/-30% recruitment cost in the operative scope.
- **Blessing of Nurgle** targets an owned army and gives +20%/+40% plague infectivity provincewide.
- **Exponential Growth** targets an owned region. Its base/upgraded bundles give +200/+350 Growth provincewide and -20%/-50% construction cost in the target region.
- **Nurgle's Visitation** heals the selected owned army in its base form. The upgraded script heals every Nurgle army in the selected province.

### Generic lord ascension

**Applicability:** all three playable faction keys; eligible generic Herald and mortal-lord subtypes.

At a playable Nurgle faction's turn start, an eligible non-faction-leader generic lord at rank 15 or above can receive the Greater Daemon dilemma if the character is in a region and is not besieging. Death- and Nurgle-lore Heralds convert to their matching Exalted Great Unclean One. The mortal Nurgle Lord, Death Sorcerer Lord, and Nurgle Sorcerer Lord instead convert to a Nurgle Daemon Prince. Conversion preserves 50% of the original lord's experience.

The player can accept, defer, or permanently ignore the offer for that lord. Deferring makes the same character eligible again after 10 turns. AI factions do not use the dilemma and instead have a 25% conversion chance on each eligible faction turn.

### Epidemius: Tally of Pestilence

**Applicability:** `wh3_dlc25_nur_epidemius` only.

The **Tally of Pestilence** counts non-Nurgle forces and settlement garrisons currently carrying a negative plague created by Epidemius. The installed script applies no diplomacy test: hostility, neutrality, or alliance is not itself the filter. It recounts at his faction-turn start, on infection events, around battles, and on load. A host leaving the infected state is removed, so the Tally and its rewards can fall as well as rise.

| Live infected targets | Tally state | Faction research rate | Effect on each counted infected force or garrison |
|---:|---|---:|---|
| 1-4 | Prodromal | +10% | -4 leadership; 0 Plague Afflicted uses |
| 5-9 | Surging | +20% | -6 leadership, -5% replenishment; 1 Plague Afflicted use |
| 10-19 | Rampant | +35% | -8 leadership, -10% replenishment; 2 Plague Afflicted uses |
| 20+ | Epidemical | +50% | -10 leadership, -15% replenishment; 3 uses of improved Plague Afflicted |

The target bundles are refreshed for one turn from the current live count. They are not permanent unlocks, and hosts infected only by another Nurgle faction do not contribute. CA's 8.0.2 notes say settlement counting was fixed; later public reports allege remaining settlement/UI and neutral-host inconsistencies. Without a live 8.1.1 campaign reproduction, the rules above describe the installed scripted intent rather than guaranteeing bug-free runtime presentation.

### Tamurkhan: Dominance and Chieftain recruitment

**Applicability:** `wh3_dlc25_nur_tamurkhan` only.

Tamurkhan gains one **Dominance** for each battle the player wins; AI Tamurkhan instead gains one each faction turn. The Chieftain panel opens at 7 Dominance, and recruiting any Chieftain consumes 7. Kayzk the Befouled is the only initially unlocked recruit ritual. When the first recruited Chieftain reaches Fealty tier 2, all five remaining recruit rituals unlock.

Recruitment creates the named Chieftain beside Tamurkhan with full action points. The spawned rank is Tamurkhan's current rank, capped at 7. Each receives a unique talisman: Grukmur the Reeking Talisman, Ezar the Cursed Yhetee Jawbone, Khargan the Virulent Boon, Ketzak the Sigil of Madness, Kayzk the Icon of Decay, and Mournhowl the Unkind Taint. Kayzk additionally receives the Sword of Filth. Each Chieftain then unlocks three repeatable pledges that add otherwise foreign units to Tamurkhan's recruitment pool:

| Chieftain | Pledged units and Dominance cost |
|---|---|
| Grukmur Three-Horn | Centigors (Throwing Axes) 2; Cygor 4; Ghorgon 5 |
| Ezar Doombolt | Chaos Dwarf Blunderbusses 2; Infernal Guard (Fireglaives) 3; Dreadquake Mortar 5 |
| Khargan the Crazed | Aspiring Champions 3; Hellcannon 3; Dragon Ogre Shaggoth 5 |
| Ketzak Fimdirach | Fimir Warriors 3; Fimir Warriors (Great Weapons) 3; Chaos Frost Dragon 4 |
| Kayzk the Befouled | Chaos Chariot 2; Rot Knights 4; Toad Dragon 6 |
| Mournhowl | Skin Wolves 2; Feral Mammoth 4; War Mammoth 5 |

### Tamurkhan: Fealty progression, actions, and quests

**Applicability:** `wh3_dlc25_nur_tamurkhan` only.

Fealty has four reward tiers. Its replacement bundles establish cumulative caps for that Chieftain's three pledged units: tier 1 gives 1/0/0; tier 2 gives 2/1/0; tier 3 gives 2/2/1; and tier 4 gives 3/3/2. Tier 1/2/3 unlock the corresponding repeatable Dominance purchase ritual, which adds that unit to the available recruitment pool up to its cap. Tier 3 also issues the Chieftain's quest-battle mission; completing it grants tier 4 and advances Tamurkhan's campaign-specific scripted victory counter.

| Chieftain | Tier 2 | Tier 3 | Unique repeatable Fealty source |
|---|---:|---:|---|
| Grukmur | 10 | 30 | +1 when another Chieftain recruit or unit-purchase ritual completes |
| Ezar | 10 | 30 | +1 when a settlement is looted |
| Khargan | 10 | 25 | +1 when a settlement is razed |
| Ketzak | 10 | 25 | +1 per completed Nurgle technology while the completed count remains below 50; at the ceiling, jump to tier 3 if still short |
| Kayzk | 7 | 20 | +1 when a Nurgle plague ritual completes |
| Mournhowl | 10 | 30 | +1 for each army raiding at faction-turn start |

Every Chieftain can also gain Fealty when Tamurkhan defeats factions from that Chieftain's configured rival cultures. AI Tamurkhan receives one additional point on every scripted Fealty award. Because the AI has no mission manager, reaching tier 3 directly grants its tier-4 bundle; AI unit-purchase rituals are also locked for five turns after use.

Every special action costs 1 Dominance and has a 10-turn cooldown. Tier 2 is the narrower version; tier 3 is the stronger or wider version:

- **Grukmur:** grant Tunneling stance for two turns to his army / all faction armies.
- **Mournhowl:** grant Stalking stance for two turns to his army / all faction armies.
- **Ezar:** two turns of enabled replenishment and encampment-stance attrition immunity / heal his embedded army.
- **Khargan:** two turns of Perfect Vigour / restore his embedded army general's action points.
- **Ketzak:** stop enemy movement in the province for two turns / grant the Cataclysm spell bundle.
- **Kayzk:** inflict enemy-province attrition for two turns / grant his tier-3 army-ability bundle.

One-time Chieftain-pair dilemmas can occur only after both involved characters have spawned, are unwounded, and each has at least 3 Fealty. Every valid pair then makes a 40% roll at each faction-turn start. The exact choice effects remain visible in the live dilemma and are not inferred from incomplete localisation.

Karanak is not an omitted Nurgle legendary-hero chain. The current legendary-character script permits him for Khorne, Warriors of Chaos, and Daemons of Chaos, but not any of the three playable Nurgle factions.

## Faction coverage

- **Poxmakers of Nurgle** — `wh3_main_nur_poxmakers_of_nurgle`: all race-wide plague, Infections, cyclical-building, recruitment, cult, and generic-lord-ascension rules; Unholy Manifestations; Ku'gath begins with two Blessed slots and gains another at every rank multiple of 10. No additional Ku'gath-only campaign subsystem was located, including in the Darkness & Disharmony campaign branch.
- **Tallymen of Pestilence** — `wh3_dlc25_nur_epidemius`: all race-wide systems; Unholy Manifestations; Tally of Pestilence live-count progression and its effects on counted forces and settlement garrisons.
- **The Maggot Host** — `wh3_dlc25_nur_tamurkhan`: all race-wide systems; Dominance, six Chieftains, Fealty, pledged-unit pools, special actions, quest battles, and scripted victory increments. The faction is explicitly excluded from standard Nurgle Unholy Manifestations.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all three CSVs under `data/economy/factions/nurgle/`.
- `data/economy/source_exports/db/{building_chain_set_items,building_effects_junction,building_levels,effects,factions}_tables/data__.tsv` and their relevant English localisation.
- `data/unit_stats/normalized/nurgle__wh3__8.1.1__ultra.csv`, `data/unit_stats/lookups/unit_rosters__wh3__8.1.1__ultra.csv`, and `data/unit_stats/lookups/unit_abilities__wh3__8.1.1__ultra.csv`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 21 files under `data/skill_trees/characters/nurgle/`.

### Installed patch 8.1.1 evidence through read-only RPFM

Read from merged vanilla `GameFiles` with literal `pack_key=$CA`, using only the serialized locked wrapper:

- `script/campaign/wh3_campaign_nurgle_plagues.lua` — playable-faction state, 200-earned-Infections unlock, three-plague reshuffle, Blessed lifecycle/maxima, Ku'gath rank progression, technology increment, Plague Cultist state stripping, and Epidemius target/recount/band logic.
- `script/campaign/wh3_dlc25_campaign_nur_chieftains.lua` — Dominance acquisition, panel/recruit thresholds, six Chieftains/items, Fealty thresholds and triggers, pool-cap/ritual unlock order, quest battles, special actions, dilemmas, AI substitutions, and victory counters.
- `script/campaign/wh3_campaign_daemon_cults.lua` — all three faction-to-cult mappings, Cult Magus Trial, adjacent spread, visibility, and cult-destruction dispatch.
- `script/campaign/wh3_campaign_great_game.lua` and `script/campaign/wh3_campaign_unholy_manifestations.lua` — ten-round ascendant-god selection, upgraded-ritual replacement, Nurgle manifestation dispatch, and scripted healing.
- `script/campaign/wh3_campaign_greater_daemons.lua` — Herald and mortal-lord subtype conversions, rank/position requirements, choice cooldown, XP preservation, and AI chance.
- `script/campaign/wh3_campaign_payload_remapping.lua` — money/Infections payload conversion for all three faction keys.
- `script/campaign/wh3_main_legendary_characters.lua` — Karanak faction eligibility exclusion.
- `db/plague_components_tables/data__` and `db/plague_parameters_tables/data__` — 18 symptoms, three independent mutation families, duration, immunity, spread, and battle-transmission profiles.
- `db/resource_cost_pooled_resource_junctions_tables/data__` — plague, mutation, cult, Rush Cycle, Chieftain recruit, and pledged-unit Dominance costs.
- `db/building_levels_tables/data__` and `db/building_instant_constructions_tables/data__` — Infection-paid military-chain starts and the same Rush Cycle record for all three playable factions.
- `db/effect_bundles_to_effects_junctions_tables/data__` — manifestation effects, Epidemius bands, cumulative Chieftain unit caps, and special-action bundles.
- `db/campaign_group_rituals_tables/data__` and `db/campaign_group_members_tables/data__` — standard Nurgle plague rituals, manifestation families, Tally groups, Tamurkhan group, and the explicit manifestation exclusion.
- Current English localisation and the stable 8.1.1 extracts for Nurgle rituals, pooled resources, effect bundles, building conditions, and Chieftain unit display names.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Creative Assembly, [Tamurkhan and the Nurgle 5.0 rework](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/13).
- Creative Assembly, [Epidemius free-content introduction](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/16-total-war-warhammer-iii-patch-5-0-introducing-the-free-content).
- Creative Assembly, [Update 5.0.0 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/17-total-war-warhammer-iii-update-5-0-0).
- Creative Assembly, [Patch 5.2 Chaos Cult rework](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/29).
- Creative Assembly, [Patch 8.0.2 hotfix notes](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14420).
- Steam Community, [Epidemius campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3252215423) — used as a current-system omission checklist; precise rules above rely on official or installed evidence.

### Evidence limitations

- A single decode of `db/agent_actions_tables/data__` reset the read-only endpoint before returning evidence and was not retried. The standard-Cultist/improved-Cult-Magus distinction therefore uses current official documentation plus installed localisation. The bundled service was restarted hidden and no game pack was edited or saved.
- Exact narrow dilemma-table probes exposed the 12 Chieftain dilemma records but not their choice-payload relation. Exact choice effects are consequently omitted.
- Great Game Lua exposes the upgraded-form replacement, but the precise corruption thresholds that unlock each manifestation family were not recovered. No unsupported threshold is asserted.
- Installed Epidemius logic has no diplomacy test and includes settlement garrisons. Official 8.0.2 notes and later public bug reports conflict over runtime counting; no live 8.1.1 campaign reproduction was performed.
- Reverse searches found no Nurgle-specific climate, Supply Lines, generic attrition, diplomacy, confederation, vassal, commandment, or additional movement-stance replacement. Those generic systems, ordinary technologies and victory objectives, and cataloged building/unit/skill facts remain outside this document.
