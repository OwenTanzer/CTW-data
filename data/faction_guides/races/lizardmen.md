# Lizardmen campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Specific 9.0 corrections:** See [targeted historical-guide errata](../COMPATIBILITY_9.0.md#targeted-historical-guide-errata) before using rite cooldowns, Books ownership, Krell or Vlad/Isabella role descriptions below. Other claims retain their stated historical scope.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Lizardmen | `race_slug=lizardmen` | **Playable factions:** 7

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe constructible settlement and horde building levels, base costs and times, prerequisites, and standardized income, Growth, control, resource, recruitment, and upkeep effects. The normalized unit file and typed lookups already describe the Lizardmen roster, faction permissions, statistics, abilities, and typed unit relations. The character files already contain the complete skill trees for the seven legendary lords, generic characters, Slann variants, and Lord Kroak. Those rows are not repeated here. This document records campaign systems, pooled-resource and recruitment lifecycles, scripted acquisition, settlement and vassal rules, mission state, and faction-specific interactions that those catalogs do not express.

## Mechanically relevant material not captured elsewhere

### Geomantic Web and Astromancy

**Geomantic Web applicability:** the six settlement factions: `wh2_dlc12_lzd_cult_of_sotek`, `wh2_dlc17_lzd_oxyotl`, `wh2_main_lzd_hexoatl`, `wh2_main_lzd_itza`, `wh2_main_lzd_last_defenders`, and `wh2_main_lzd_tlaqua`. Spirit of the Jungle is a horde and does not operate settlement province-capital nodes.

Each owned province capital is a Geomantic node. Its building chain supplies potential strength, but a node operates at that potential only when it has a link to another node of equal or greater strength. Allied province capitals can supply stronger links than unallied capitals. The campaign UI marks a node that is operating below its building potential. The ordinary building levels and commandment effect rows remain in the economy catalog; the link requirement and network-level relationship do not.

**Astromancy applicability:** all seven playable faction keys.

Astromancy (`MILITARY_FORCE_ACTIVE_STANCE_TYPE_ASTROMANCY`) applies `wh2_main_bundle_stance_army_astromancy`: +150% line of sight, +50% ambush defence, +50% interception chance against Underway-, Beastpaths-, and Worldroots-type movement, and Vanguard Deployment for Lizardmen units, with -25% campaign movement. Patch 8.1 changed the 25-point movement charge so it is paid when the army enters the stance, not again on every turn it remains in the stance.

### Spawning Sequence, Blessed recruitment, and Slann awakening

**Applicability:** all seven playable factions, with the mission and faction-specific exceptions below.

Blessed variants occupy a separate recruitment pool, `wh2_main_lzd_spawnings_pool`, linked to all seven factions through their mercenary sets. Its 21 Blessed unit groups each begin with one available unit, have a base maximum of two, and carry automatic replenishment data. Recruiting from the pool spends Spawning Sequence (`wh3_main_lzd_sacred_spawning`). Current official patch 6.3 material gives the unmodified cost range as 50 Sequence for a Blessed Skink Cohort through 350 for a Blessed Carnosaur; the complete per-unit cost matrix was not safely re-extracted from the high-cardinality cost junction and is not reconstructed here.

For human Lizardmen other than Spirit of the Jungle, `wh2_campaign_blessed_spawnings.lua` begins issuing Blessed missions from turn 5. The active mission types require captives, defeated armies, killed entities, or razed/sacked settlements. Mission pools change at turns 50 and 100; each successful issue starts a 15-turn issuance timer, and a 20% roll upgrades the mission to its rare reward tier. Current mission payloads grant:

| Mission pool | Normal Sequence | Rare Sequence |
|---|---:|---:|
| Early | 100-150 | 250-350 |
| Mid | 150-200 | 300-400 |
| Late | 200-250 | 350-400 |

AI Lizardmen use a separate fallback: from turn 15, each AI faction has a 10% chance per turn to receive the script's fixed Blessed-pool addition. Spirit of the Jungle is deliberately excluded from the human mission scheduler.

Sequence acquisition branches by faction. The standard Geomantic energy chain used by the base-game/FLC settlement factions grants 10/25/50 Sequence at tiers 3/4/5. Nakai's rank-two horde support building grants 25; Oxyotl's two Sanctum cores grant 5/10; and Tlaqua's faction flyer building grants 10. The Rite of Awakening grants 250 Sequence. Cult of Sotek sacrifices, Nakai's Temples and rites, and Oxyotl's Visions can also add Blessed units or resources. These conditional relationships are not expressed by the ordinary building rows alone.

For the six settlement factions, performing the Rite of Awakening after constructing a Star Chamber grants 250 Sequence and opens `wh2_main_lzd_slann_selection`, a nine-choice dilemma covering the lores of Beasts, Death, Fire, Heavens, High, Life, Light, Metal, and Shadows; the selected Slann becomes available to lead an army. Spirit of the Jungle has separately permitted horde Slann subtypes and obtains Slann through its horde/Temple ritual routes rather than the settlement Star Chamber lifecycle. The Slann skill trees and faction subtype permissions are cataloged; the rite-to-dilemma acquisition relation is not.

### Lord Kroak acquisition

**Applicability:** all seven playable factions; Itza has the start-state exception.

In Immortal Empires, Itza (`wh2_main_lzd_itza`) owns Lord Kroak (`wh2_dlc12_lzd_lord_kroak`) at campaign start. For each other playable Lizardmen faction, the legendary-character framework unlocks a faction-specific Lord Kroak quest battle when the player's faction leader reaches rank 15. Its payload supplies 5,000 treasury and invokes the scripted Kroak spawn after the mission. The six mission keys are:

| Faction | Mission key |
|---|---|
| Cult of Sotek | `wh3_main_ie_tehenhauin_lord_kroak` |
| Spirit of the Jungle | `wh3_main_ie_nakai_lord_kroak` |
| Ghosts of Pahuax | `wh3_main_ie_qb_oxyotl_lord_kroak` |
| Hexoatl | `wh3_main_ie_mazdamundi_lord_kroak` |
| Last Defenders | `wh3_main_ie_kroqgar_lord_kroak` |
| Tlaqua | `wh3_main_ie_tiktaqto_lord_kroak` |

Non-playable Lizardmen factions are not eligible. If no human claimant owns Kroak, the strongest eligible AI Lizardmen faction receives him through the framework's turn-30 fallback. Kroak's unit and skill rows are cataloged; starting ownership, the mission gate, and the AI fallback are not.

### Prophecy of Sotek and Sacrifices

**Applicability:** Cult of Sotek (`wh2_dlc12_lzd_cult_of_sotek`) only.

A human Cult of Sotek campaign starts with 200 Sacrificial Offerings (`lzd_sacrificial_offerings`) and a saved three-stage Prophecy. The active mission structure is:

| Stage | Required missions | Scripted state change |
|---|---|---|
| I | Control 2 provinces; perform 5 Sacrifice rituals | Stage I bundle remains active until progression. |
| II | Control 3 provinces; defeat 3 Skaven armies; construct `wh2_main_lzd_worship_sotek_2`; perform 5 Sacrifice rituals | Replaces the Stage I bundle, forces every living Lizardmen faction to war with each living non-human Skaven faction, and prevents Cult of Sotek from making peace with those Skaven factions. |
| III | Perform 5 Sacrifice rituals | Replaces the Stage II bundle with the final Prophecy bundle. |

Each objective pays 200 Offerings; the province and Skaven-army objectives also include 5,000 treasury, while the temple objective applies its linked bundle. The recurring five-ritual objectives are generated by Lua rather than stored as ordinary static mission-option rows.

The stage bundles materially change campaign operation. Stage I imposes +200% Saurus upkeep. Stage II removes that penalty, gives +30 Lizardmen diplomacy and +1 Blessed capacity. Stage III gives +10 leadership against Skaven, +10% physical resistance, +20% research rate, and +2 Blessed capacity. Sacrifice rituals consume between 100 and 1,000 Offerings in the current ritual records and can apply faction bundles, award a random banner or follower, add Blessed units, provide the unique Red-Crested Skink Chief lord, or perform the Great Invocation. The sacrifice-panel effects are separate from the ordinary unit and ancillary catalog rows.

AI Cult of Sotek does not execute the human Prophecy mission chain. On a new AI campaign, the script instead unlocks all sacrifice rituals directly.

### Nakai's horde, Defenders vassal, and Temples of the Old Ones

**Applicability:** Spirit of the Jungle (`wh2_dlc13_lzd_spirits_of_the_jungle`) only.

Nakai does not keep conquered settlements. His occupation choice sacks the region while gifting it to the Defenders of the Great Plan (`wh2_dlc13_lzd_defenders_of_the_great_plan`), dedicates it to Quetzl, Itzl, or Xholankha as a level-one temple settlement, assigns the appropriate temple building to the port or secondary slot, and heals the new garrison. The Defenders are forced as Nakai's vassal. Their diplomacy is broadly locked: Nakai and the Defenders cannot break the vassal relationship, outside factions cannot independently declare war or peace with the Defenders, and Nakai receives vision of their regions. Current official patch 6.3 material also states that Nakai's faction incurs no diplomatic penalty for trespassing.

A normal temple settlement counts as one dedication; a province capital counts as three. Each counted dedication produces 2 Old Ones' Favour (`lzd_old_ones_favour`) per faction turn. Each deity has permanent tiers at 5, 10, 15, 20, and 25 counted dedications. The linked bundles progressively provide:

- Itzl: army charge and melee-attack bonuses, an active blessing, weapon strength, and at the capstone army experience, Lizardmen diplomacy, and its upgraded blessing.
- Quetzl: missile resistance and melee defence, an active defensive blessing, ward save, and at the capstone horde replenishment, Lizardmen diplomacy, and its upgraded blessing.
- Xholankha: increasing Winds capacity and research, an active storm blessing, reduced spell costs, and at the capstone ancillary-drop chance, Lizardmen diplomacy, and its upgraded blessing.

The Temple of the Old Ones ritual family spends 100-400 Favour and can add Blessed units, heroes, or Slann. Four separate strategic rites operate directly on the vassal relationship: Hunter's Gaze reveals Defenders regions; Stalwart Defenders gives their settlements five turns of siege defence; Allegiance applies five turns of attrition to enemies in Defenders territory; and Rebirth creates a 19-unit Blessed defensive army for the Defenders. That army has no upkeep and cannot replenish.

Nakai's campaign feature disables additional-army upkeep, so his armies do not incur the ordinary Supply Lines penalty. Settlement public order, region Growth, and region wealth are also disabled for the horde faction; this does not remove its cataloged horde Growth. His primary horde-building progression shares recruitment access with his other hordes/global pool rather than behaving as an isolated settlement chain. Patch 8.1 also explicitly preserves Nakai's horde buildings when he is confederated. The economy catalog contains the individual horde building rows, but not these army-economy, sharing, occupation, vassal, or persistence rules.

### Oxyotl's Visions and Silent Sanctums

**Applicability:** Ghosts of Pahuax (`wh2_dlc17_lzd_oxyotl`) only.

Visions of the Old Ones generates waves of three or four missions. The initial cooldown is 11-13 turns; if the player clears every active Vision while more than three turns remain, the executable scheduler compresses the next cooldown to 1-3 turns. The script's difficulty mix changes at turns 11, 26, and 51: early waves are weighted toward easy missions, while later waves increasingly select medium and hard missions. Possible objectives include hostile armies, Chaos- or daemon-aligned targets and regions, herdstone targets, scripted regions, and Sanctum defence; one mission type can appear at most once in a wave.

Mission lifetime also contracts with campaign difficulty, from 7-10 turns on Easy to 3-6 on Legendary. An ordinary Easy/Medium/Hard Vision randomly selects its primary reward as either 3/6/9 Silent Sanctum Gems (`lzd_sanctum_gems`) or a difficulty-selected Blessed-unit pool addition. It always accumulates +1/+2/+3 Lizardmen diplomacy. A separate secondary roll selects either 1,000/3,000/5,000 treasury or one of the configured five-turn effect bundles; every such bundle also supplies 5/10/20 Sequence per turn at the matching difficulty. The opening mission pays 8 Gems. Failures apply the consequence stored for that mission. The mission manager runs only for a human Ghosts of Pahuax campaign.

Eight Gems convert automatically to one Silent Sanctum Point (`lzd_sanctum_points`). In Immortal Empires, the script creates a turn-one starting Sanctum at `wh3_main_combi_region_the_godless_crater`. Creating a Sanctum reveals its region. A vision core also reveals adjacent regions and reapplies that visibility each faction turn. Only one transport core can exist: constructing another dismantles the previous one. The official Silence & Fury description establishes the travel relationship among Oxyotl's capital, Vision mission targets, and Silent Sanctums; the installed Sanctum script governs the one-transport-core state.

The two ambush cores roll once against an eligible enemy army at 25% or 33%. A success creates a forced ambush with a scripted 7- or 13-unit force. Its power level increases every 20 turns to a cap of 9, and only one Sanctum ambush can trigger during an enemy faction turn. Sanctum building rows are in the economy catalog; automatic currency conversion, replacement, visibility, and ambush listeners are not.

### Tlaqua's Rite of Tzunki

**Applicability:** Tlaqua (`wh2_main_lzd_tlaqua`) only.

Tlaqua unlocks the Rite of Tzunki (`wh2_dlc12_lzd_tiktaqto_ritual_persistence`) when its faction leader reaches rank 5. The ritual has a 20-turn cooldown, increases the campaign movement range of all faction armies and characters for the current turn, and makes them immune to deep-sea attrition while active. An army that spent its initial movement in March stance cannot switch out of March after the rite extends its range. Tlaqua also has a faction flyer building that supplies 10 Spawning Sequence, alongside the standard Geomantic-chain route described above.

## Faction coverage

| Playable faction | Key | Additional material beyond the catalogs |
|---|---|---|
| Cult of Sotek | `wh2_dlc12_lzd_cult_of_sotek` | Geomantic Web, Astromancy, Blessed/Slann systems, Lord Kroak mission, and the Prophecy/Sacrifices chain. |
| Spirit of the Jungle | `wh2_dlc13_lzd_spirits_of_the_jungle` | Astromancy, Blessed/Slann variants, Lord Kroak mission, and the Nakai horde/Defenders/Temple system, including its occupation, settlement-state, diplomacy, and Supply Lines exceptions; excluded from the Geomantic Web and standard human Blessed-mission scheduler. |
| Ghosts of Pahuax | `wh2_dlc17_lzd_oxyotl` | Geomantic Web, Astromancy, Blessed/Slann systems, Lord Kroak mission, Visions and their branched rewards, and Silent Sanctums. |
| Hexoatl | `wh2_main_lzd_hexoatl` | Geomantic Web, Astromancy, Blessed/Slann systems, and Lord Kroak mission. Reverse searches located no further faction-specific campaign framework beyond cataloged buildings, roster permissions, and character skills. |
| Itza | `wh2_main_lzd_itza` | Geomantic Web, Astromancy, Blessed/Slann systems, and Lord Kroak at campaign start. No further uncataloged faction-specific framework was located. |
| Last Defenders | `wh2_main_lzd_last_defenders` | Geomantic Web, Astromancy, Blessed/Slann systems, and Lord Kroak mission. Reverse searches located no further faction-specific campaign framework beyond cataloged differences. |
| Tlaqua | `wh2_main_lzd_tlaqua` | Geomantic Web, Astromancy, Blessed/Slann systems, Lord Kroak mission, and the Rite of Tzunki. |

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and every Lizardmen faction CSV under `data/economy/factions/lizardmen/`.
- `data/unit_stats/normalized/lizardmen__wh3__8.1.1__ultra.csv`, the roster-permission and ability lookups under `data/unit_stats/lookups/`, and the relevant source exports.
- `data/skill_trees/character_index__wh3__8.1.1.csv`, every Lizardmen character file under `data/skill_trees/characters/lizardmen/`, and `db/faction_agent_permitted_subtypes_tables/data__` in the skill source exports.

### Installed game scripts and tables

- `script/campaign/wh2_campaign_blessed_spawnings.lua`: human mission gates and pools, Spirit-of-the-Jungle exclusion, timer, rare roll, and AI fallback.
- `script/campaign/wh2_dlc12_tehenhauin.lua`: Offerings initialization, Prophecy saved state and stage transitions, generated five-ritual missions, Stage II war/peace behavior, random ancillary awards, and AI initialization.
- `script/campaign/wh2_dlc13_nakai_temples.lua`: occupation transfer, Defenders vassal locks, temple weighting and income, threshold bundles, and strategic rites.
- `script/campaign/wh2_dlc17_lzd_chaos_map.lua` and `script/campaign/wh2_dlc17_lzd_silent_sanctums.lua`: Vision generation, cooldown compression, primary/secondary reward branching, cumulative diplomacy, Gems-to-Points conversion, starting Sanctum, visibility, transport replacement, and ambush listeners.
- `script/campaign/wh3_main_legendary_characters.lua`: `wh2_dlc12_lzd_lord_kroak`, rank-15 player missions, Itza starting ownership, permitted factions, and turn-30 AI fallback.
- `db/cdir_events_mission_option_junctions_tables/data__` and `db/cdir_events_mission_payloads_tables/data__`: Prophecy objectives and rewards, Blessed mission Sequence payloads, and Lord Kroak mission payload.
- `db/effect_bundles_to_effects_junctions_tables/data__`: Prophecy stage effects, Nakai threshold effects, Astromancy effects, and ritual outputs.
- `db/building_effects_junction_tables/data__`: standard and bespoke Spawning Sequence building sources for settlement factions, Nakai, Oxyotl, and Tlaqua.
- `db/campaign_features_tables/data__`: Nakai's additional-army-upkeep, settlement-state, and gift-region-also-sacks flags.
- `db/rituals_tables/data__`: Sacrifice ritual family, Nakai ritual family, standard Lizardmen rites, and `wh2_dlc12_lzd_tiktaqto_ritual_persistence`.
- `db/mercenary_unit_groups_tables/data__`, `db/mercenary_pool_to_groups_junctions_tables/data__`, and `db/faction_to_mercenary_set_junctions_tables/data__`: Blessed group limits, pool membership, and all-seven-faction applicability.
- `db/campaign_stances_tables/data__` and `db/campaign_stance_effects_junctions_tables/data__`: `MILITARY_FORCE_ACTIVE_STANCE_TYPE_ASTROMANCY` and `wh2_main_bundle_stance_army_astromancy`.
- `db/dilemmas_tables/data__`, `text/db/dilemmas__.loc`, `text/db/cdir_events_dilemma_choice_details__.loc`, `text/db/event_feed_strings__.loc`, and `text/db/ui_text_replacements__.loc`: Slann selection, Astromancy, Geomantic Web, pooled-resource, and campaign-help text.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes): current Astromancy movement charging, Nakai confederation persistence, and relevant 8.1 fixes.
- Creative Assembly, [Patch 6.3 developer blog](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/77-total-war-warhammer-iii-%E2%80%93-patch-6-3-dev-blog) and [Patch 6.3 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/78-total-war-warhammer-iii-patch-notes-6-3Total): Spawning Sequence rework, acquisition routes, official cost endpoints, Nakai's trespass exception, and Rite of Tzunki's deep-sea attrition immunity.
- Creative Assembly, [Hotfix 6.3.1](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-total-war-warhammer/threads/11329-hotfix-6-3-1-available-now-as-steam-beta): bespoke-faction Sequence and Blessed-capacity corrections.
- SEGA/Creative Assembly, [The Silence & The Fury](https://store.steampowered.com/app/1556110/Total_War_WARHAMMER_II__The_Silence__The_Fury/): high-level Visions, Sanctums, and travel relationship.
- [Total War Academy: Lizardmen campaign tactics](https://academy.totalwar.com/lizardmen-campaign-tactics/) and Lizardmen/faction/mechanic community pages were used only as breadth-first terminology and omission checklists. Historical Vortex objectives and Ancient Plaques were excluded because this document covers the current Warhammer III campaign implementation.

### Reverse audit and limitations

All seven playable faction keys, all seven legendary-lord subtypes, Lord Kroak's subtype, the Geomantic, Blessed/Sequence, Slann, Prophecy/Sacrifice, Nakai temple/Favour, Oxyotl Vision/Sanctum, and Tlaqua ritual families were reverse-searched across the project exports and installed scripts/tables. The audit also checked occupation and horde behavior, climate/Growth replacement, army-economy and Supply Lines exceptions, caps and pools, stances and attrition, diplomacy/vassal rules, foreign slots, character acquisition, missions/dilemmas, AI fallback, unusual locations, and campaign branches. It recovered Nakai's Supply Lines and settlement-state exceptions but no further override for the other factions; Oxyotl's Sanctums were the only bespoke foreign-slot lifecycle. Historical Vortex-only progression and the generic Primordial Spawning Pools unusual location were excluded.

The full per-unit Spawning Sequence cost junction was not decoded a second time after one high-cardinality extraction proved unsafe to filter. This guide therefore reports the current official 50-350 endpoints and installed pool/cap relations, not an inferred cost for every Blessed unit. Nakai's no-trespass rule and Tzunki's deep-sea immunity are grounded in current official notes because their direct installed dispatch was not recovered. Some Nakai blessing activation details and the engine-side travel UI are not fully expressed in decoded Lua; only linked effects, state transitions, and current official high-level travel behavior are stated.
