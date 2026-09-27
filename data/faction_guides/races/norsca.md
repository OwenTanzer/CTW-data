# Norsca campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Norsca | `race_slug=norsca` | **Playable factions:** 3

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy catalog already records the enabled building variants, construction costs and times, prerequisites, ordinary building effects, and recruitment outputs for Dolgan, the World Walkers, and Wintertooth. The normalized unit file and typed lookups already record the roster, faction permissions, unit statistics, abilities, weapons, mounts, and attributes. The character catalog already contains the skill trees for Sayl, Wulfrik, Throgg, Beorg, the four god-linked champions, and generic Norscan characters. This guide therefore concentrates on the scripted resource lifecycles, occupation choices, courier armies, campaign actions, hunt state, confederation rule, progression gates, and faction-specific systems required to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Spoils, Pillaging Forces, and foreign settlement expansion

**Applicability:** all three playable faction keys.

Norscan expansion is built around Spoils (`wh3_dlc27_nor_spoils`) rather than ordinary occupation everywhere. Settlements outside Norsca's homelands require Spoils to occupy, while **Pillage & Raze** converts a conquered settlement into a temporary, player-controlled Pillaging Force carrying temporary Spoils (`wh3_dlc27_nor_spoils_temp`). The new force starts with half of its action points, always contains at least two Marauders and one Marauder Horsemen unit, and receives further units from a scripted pool; its configured base size is five before bonuses, clamped to 1–19 units.

The cargo is not banked merely by winning the settlement battle. The force must enter a qualifying owned settlement, or occupy a qualifying settlement itself. The script then transfers its temporary resource into the faction's permanent Spoils pool and removes the courier force. It can raid more settlements before delivery, increasing the value at risk. This explains why the economy CSVs contain Spoils-priced construction shortcuts and variants without themselves describing how the resource reaches the treasury.

Pillage & Raze can also award a **Raider Reward**. The current script rolls a 25% unique-reward chance; each unique entry can be received only once per faction. A failed unique roll falls back to the generic ancillary pool, and current help text promises at least a common item or follower.

Collecting **The Dark Gods' Gifts** ancillary set adds a separate battle trigger. After its bearer wins a non-naval battle against a force with a general, the script applies **Curse of the Dark Gods** to a random enemy force in the province for two turns. Three different penalties are selected from a pool covering movement, reinforcement, battle fatigue, leadership, speed, and attrition; this is a set-completion interaction rather than an ordinary ancillary stat row.

The province-level Marauding action panel is mutually exclusive while an action is active. The nonstandard scripted relations are:

- **Despoilment** is shared. It grants 1,250 treasury for each settlement in the target province not owned by the acting faction; its separate scripted payload reduces control in the target province by 50.
- **Idolatry** is the World Walkers/Wintertooth altar action. For five turns, each matching altar in the province scales its god-specific local effect: Hound reduces recruitment cost by 5%, Crow adds 10% replenishment, Serpent adds 5 control and 20 Growth, and Eagle adds 5 Winds of Magic.
- **Subterfuge** is Sayl's province action. While active, each subsequent Manipulation in that province steps up a custom effect bundle—army attack and armour bonuses for Sayl and enemy miscast chance—until the scripted caps of 16, 16, and 60 respectively. Its duration is taken from the action's current cooldown record, so modifiers remain data-driven.

The ordinary effects of the remaining data-driven actions, including Fearmongering and Sayl's Profanity, remain in the installed ritual/effect rows and are not duplicated here.

### Chaos Altars, Allegiance, and the end choice

**Applicability:** `wh_dlc08_nor_norsca` and `wh_dlc08_nor_wintertooth` only. Dolgan uses the separate Dark Ritual branch below.

The World Walkers and Wintertooth can dedicate Chaos Altars to the Hound (Khorne), Crow (Nurgle), Eagle (Tzeentch), or Serpent (Slaanesh). Allegiance is recomputed from current altar-derived building values, so losing or converting an altar can lower the corresponding resource; it is not permanent progress. The installed thresholds are 5, 10, and 15.

At the maximum threshold, the player may accept that god's champion or refuse. Acceptance locks the other champions, grants the chosen character, creates the rival-god challenger faction, and issues a mission to destroy it. The reward mapping is:

| Allegiance | Character at rank 25 | Type |
|---|---|---|
| Crow / Nurgle | Burplesmirk Spewpit (`wh3_main_ie_nor_burplesmirk_spewpit`) | Exalted Great Unclean One lord |
| Eagle / Tzeentch | Arzik (`wh_dlc08_nor_arzik`) | Lord of Change lord |
| Hound / Khorne | Killgore Slaymaim (`wh3_main_ie_nor_killgore_slaymaim`) | champion hero |
| Serpent / Slaanesh | Kihar the Tormentor (`wh_dlc08_nor_kihar`) | wizard hero |

Refusing preserves the current allegiance effects and leaves another god available. Refusing all four summons all four challenger factions and issues `wh3_dlc27_nor_allegiance_ultimate_refusal`; destroying them grants the permanent ultimate-refusal reward bundle. These acquisition routes—not the characters' skills—are the part absent from the character catalog.

### Monstrous Arcanum

**Applicability:** all three playable faction keys.

The reworked Monstrous Arcanum is a stateful hunt system rather than a simple unit-unlock table. **Glorious Hunts** are one-time hunts that award Regiments of Renown. Completing one unlocks **Taming Hunts**: their first stage is one-time, while the second stage can be repeated to obtain special monster units. Completing three first-stage Taming Hunts unlocks **Trophy Hunts**, which are one-time hunts for powerful trophies and rewards. Hunt categories use a four-turn cooldown in the script.

An active hunt places climate-sensitive map markers and advances through event dilemmas. Each turn has a 30% chance to issue a progression dilemma, with no more than five progression dilemmas in one hunt. At 15 turns, a prolonged-hunt dilemma either grants a five-turn extension or abandons the hunt. Some hunt rewards branch on DLC ownership and substitute a vanilla monster when the DLC-specific unit is unavailable.

The script registers all three playable factions for the same ultimate-hunter effect bundle. Wintertooth is forced into an initial hunt on turn 5, while the Arcanum unlock timing is turn 8 for the World Walkers and Dolgan and turn 5 for Wintertooth. Global stage rewards provide treasury and Spoils, and Wintertooth also receives Trollkind; individual hunt stages can override those defaults, so the mission panel remains authoritative for a specific hunt's payout.

Those progression rules describe a human player. The AI does not run the player's random dilemma loop: its eligible hunt tiers come online at turns 5, 20, and 40, and a selected incomplete hunt advances on a scripted six-turn cadence.

### Tribal Confederation and altar conversion

**Applicability:** all three playable faction keys when fighting other Norscan tribes.

The installed Norsca campaign help still defines Tribal Confederation as defeating and killing a Norscan faction leader in battle, which forces that faction to confederate. This is a battle-triggered race rule, not the ordinary diplomatic-confederation description.

The overhaul also handles the otherwise incompatible altar systems when Sayl and another Norscan faction confederate. If a World Walkers/Wintertooth confederation absorbs Dolgan, Undivided altar main chains are converted to the corresponding god-aligned Norscan chain. If Dolgan absorbs a god-allegiance Norscan faction, the inherited altar chains are converted to Undivided. The individual converted building rows remain in the economy catalog.

### Beorg Bearstruck recruitment

**Applicability:** all three playable faction keys, with the *Tides of Torment* Norsca entitlement required.

Beorg is unlocked through the shared legendary-character system. Reaching faction-leader rank 8 starts `wh3_dlc27_nor_beorg_bearstruck_unlock_1`; its completion hands off to the second mission, whose installed text instructs the player to raid. Completion unlocks Beorg and grants his Bear Fang Talisman. The installed eligibility list includes Dolgan, the World Walkers, and Wintertooth, as well as several out-of-scope Warriors of Chaos factions. If no eligible human claimant takes him, the AI fallback becomes available on turn 20 and gives Dolgan priority. His unit and skills are already represented in the unit and character catalogs.

### Wulfrik: Seafang and the overseas start decision

**Applicability:** `wh_dlc08_nor_norsca`; character subtype `wh_dlc08_nor_wulfrik`.

When Wulfrik is at sea near a port, **Seafang Travel** can instantly move him to another visible port. He can attack coastal settlements directly from sea, and other World Walkers fleets inside his zone of control can be selected to travel with him. The cooldown increases with the number of units and accompanying armies. The exact cooldown formula is not exposed in the decoded Lua, so no fixed duration is asserted here.

Human World Walkers in Immortal Empires receive `wh3_dlc27_nor_wulfrik_start_dilemma` on turn 5. Its four routes reveal Marienburg; Castle Alexandronov and Erengrad; Bordeleaux; or Karond Kar and Nagrar, giving Seafang known overseas destinations.

A separate Immortal Empires opening fork follows later. If Wulfrik gains a settlement while still holding Troll Fjord before turn 25, `wh3_dlc27_dilemma_wulfrik_start` is issued. Its second choice abandons or transfers Troll Fjord to the Bjornling faction, supporting an overseas raiding start; the alternative retains the homeland foothold.

### Throgg: Trollkind, Dominion, and Call the Monstrous Horde

**Applicability:** `wh_dlc08_nor_wintertooth` only.

Wintertooth's Troll Kingdom buildings consume Trollkind (`wh3_dlc27_nor_kinfolk`) and advance the six-stage Troll King's Dominion (`wh3_dlc27_nor_troll_expansion`). At faction-turn start, Throgg himself contributes 1 Trollkind. Each qualifying troll unit contributes another 1, or 2 when it is in Throgg's own army; garrisons and forces without a general do not contribute. Buildings and Monster Hunts supply additional data-driven income. Troll Kingdom buildings in specified geographic locations also open limited local pools for Bile, Chaos, River, or Stone Trolls; the economy and unit catalogs remain authoritative for the exact rows and caps.

The five transition thresholds after the base Dominion stage are 20, 40, 60, 80, and 115. Each stage improves the support force summoned by **Call the Monstrous Horde!** Its current Trollkind costs are 20, 40, 60, 80, 100, and 140 across the six levels. At lower levels it attaches a temporary transported force to the targeted lord; at the final stage it creates support forces for all Wintertooth military forces. Activating it applies a ten-turn stop-gain bundle: Trollkind does not accumulate while the summoned force is active, and the temporary army is removed when its duration ends or it is destroyed. Dominion stage 3 is the scripted short-victory checkpoint and stage 6 the long-victory checkpoint.

### Sayl: the Dark Ritual and champion choices

**Applicability:** human `wh3_dlc27_nor_sayl` in Immortal Empires only; the final battle is single-player-only.

Sayl does not use the four Allegiance resources. Once Dolgan owns three settlements, his Dark Ritual interface unlocks and he can raise Undivided Chaos Altars. The unlock also issues **Needs Must**, an introductory mission to raise an altar; it rewards 3,000 treasury and Schalkain's Teeth. Each qualifying altar gained adds 1 Arcane Power (`wh3_dlc27_nor_sayl_dark_ritual`); losing it subtracts 1, and receiving an altar through settlement trade also counts.

The progression is sequential rather than a passive bar with automatic rewards:

| Arcane Power | Gate | Result after victory |
|---:|---|---|
| 4 | Empire quest battle | Tier 1 Manipulations and the first permanent narrative bundle |
| 10 | High Elf quest battle, after the Empire battle | Tier 2 Manipulations and the second bundle |
| 18 | Lizardmen quest battle, after the High Elf battle | Tier 3 Manipulations and the third bundle |
| 30 | Final battle, after all three prior battles | `sayl_final_battle`, campaign completion state, and Sayl's final trait |

At 10 Arcane Power, a separate dilemma chooses the Crow or Eagle lord; at 18, a second dilemma chooses Killgore or Kihar. The latter pair spawns at rank 10. These are mutually chosen narrative rewards, distinct from the rank-25 allegiance awards available to Wulfrik and Throgg.

### Sayl: Manipulations and Attention of the Gods

**Applicability:** human `wh3_dlc27_nor_sayl` in Immortal Empires only.

Sayl has sixteen Manipulations arranged as one action for each of four target classes at each of four tiers. Four are available from the start; winning the Dark Ritual battles unlocks the next three tiers. The action families are:

| Tier | Foreign faction | Enemy army | Foreign settlement | Own army |
|---:|---|---|---|---|
| 0 | **Sight Beyond Sight:** factionwide region and army vision | **Fear & Fatigue:** a hostile army debuff | **Twisted Tribute:** grants one item from a high-tier ancillary pool | **Gather Winds:** steals a percentage of every other army's Winds in the province |
| 1 | **Crippling Injunction:** disables local and global recruitment | **Rest From the Wicked:** impairs campaign movement | **Subversion From Within:** establishes Treacheries | **Bloody Promises:** completes one turn of local and global recruitment for the targeted army |
| 2 | **Torn Treaties:** breaks treaties except vassalage and locks other diplomacy for 2 turns | **Exploit Your Rivals:** immediate army damage | **The Viperous Word:** damages the garrison by 50%, causes attrition, and creates ten wall breaches | **Daemonic Summoning:** sacrifices the weakest Marauder infantry unit for a random Greater Daemon |
| 3 | **Blind War:** makes the target declare war on nearly every known valid faction and locks its diplomacy for 5 turns | **Mutinous Whispers:** cannot target the Legendary Lord's army; it wounds characters and turns 50% of eligible units into a ten-turn rebel army led by a rank-40 Great Shaman Sorcerer | **Weakened Reality:** razes the target settlement | **Lies Become Flesh:** adds a temporary transported support army and a random shaman ability bundle for 5 turns |

The installed base cooldowns are 5, 10, 15, and 20 turns for tiers 0–3. Attention cost is randomized within the installed bands: 1–3 for tier 0, 2–4 for tier 1, 3–5 for tier 2, and 8 for tier 3. Crossing 8, 16, or 24 Attention triggers a dilemma drawn from that tier's god-specific pool. At maximum Attention, Manipulations are locked until Attention falls. The reset is checked every eight turns: crossing a nonmaximum threshold marks the first reset to hold that Attention level, then the following reset drops it one level; reaching maximum marks it to drop at the next reset. This makes repeated high-tier use a timed risk loop rather than a conventional cooldown-only system.

### Sayl: Treacheries and Confidence

**Applicability:** human `wh3_dlc27_nor_sayl` in Immortal Empires only. This system was promoted by the reverse game-file audit.

**Subversion From Within** creates a hidden foreign slot in the target settlement with an initial infiltration building. Treacheries have two functional families in the interface: **Inroads**, which prepare the settlement to benefit Sayl after conquest, and **Assault**, which weakens defenders or improves the invading force. The installed system begins with one Treachery allowed per target faction and two target factions. Scripted bonuses can raise those limits to three Treacheries per faction and four target factions.

The player develops the foreign-slot buildings before their shared exposure timer expires. If the timer expires, every Treachery against that faction is revealed and removed and a diplomatic penalty follows. Capturing a prepared settlement activates its completed effects, can postpone exposure, and spreads the foreign slots to adjacent regions still held by the previous owner. Building-selected payloads include treasury theft, temporary regional-income damage, Chaos corruption, garrison and wall sabotage, invader units, local army debuffs, and settlement-chain changes; they are deliberately asymmetric and culture-aware, so there is no single generic payout.

Each deployed Treachery adds 5 **Confidence** to its target. In the current script, ordinary treaty, gift, battle, agent-action, and per-turn treaty inputs are configured to zero; vassalage instead sets an effectively overriding positive value. Treachery activation and exposure can change Confidence through their selected building effects. Confidence should therefore be read as the target faction's tolerance for Sayl's covert network, not as a broad diplomacy resource earned through normal deals. In installed 8.1.1, the automatic below-zero war listener is inert: it tests `can_trigger_war`, while initialization and the separate foreign-slot-removal war path use `can_declare_war`.

## Faction coverage

- **Dolgan** — `wh3_dlc27_nor_sayl`: shared Spoils/Pillaging Forces, Raider Rewards and the Dark Gods' Gifts set curse, Despoilment, Monstrous Arcanum, Tribal Confederation, and Beorg; its human IE campaign replaces god Allegiance with Undivided Altars, the Dark Ritual, champion-choice dilemmas, Manipulations, Attention, Treacheries, and Confidence.
- **World Walkers** — `wh_dlc08_nor_norsca`: shared Spoils/Pillaging Forces, Raider Rewards and the Dark Gods' Gifts set curse, Despoilment, Monstrous Arcanum, Tribal Confederation, and Beorg; four-god Allegiance and Idolatry; Wulfrik's Seafang, turn-5 destination reveal, and overseas-start decision.
- **Wintertooth** — `wh_dlc08_nor_wintertooth`: shared Spoils/Pillaging Forces, Raider Rewards and the Dark Gods' Gifts set curse, Despoilment, Monstrous Arcanum, Tribal Confederation, and Beorg; four-god Allegiance and Idolatry; Throgg's leader contribution to Trollkind, six-stage Dominion, geographic troll recruitment, and Call the Monstrous Horde.

## Evidence register

### Project material consulted

- `README.md`
- `data/economy/README.md`
- `data/economy/faction_index__wh3__8.1.1.csv`
- `data/economy/factions/norsca/wh3_dlc27_nor_sayl.csv`
- `data/economy/factions/norsca/wh_dlc08_nor_norsca.csv`
- `data/economy/factions/norsca/wh_dlc08_nor_wintertooth.csv`
- `data/unit_stats/README.md`
- `data/unit_stats/normalized/norsca__wh3__8.1.1__ultra.csv`
- `data/unit_stats/lookups/unit_rosters__wh3__8.1.1__ultra.csv`
- `data/unit_stats/lookups/unit_abilities__wh3__8.1.1__ultra.csv`
- `data/unit_stats/source_exports/text/db/{advice_info_texts,campaign_group_rituals,campaign_localised_strings,campaign_payload_ui_details,cdir_events_dilemma_choice_details,culture_settlement_occupation_options,effect_bundles,effects,effects_additional_tooltip_details,missions,pooled_resources,rituals,ui_text_replacements}__.loc.tsv`
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 20 indexed files under `data/skill_trees/characters/norsca/`

### Installed vanilla game files and stable records

Read through the project's locked, read-only RPFM path against merged vanilla `GameFiles`; every exact path below was verified through `scripts/rpfm-call-locked.ps1` and no pack was edited or saved:

- `script/campaign/wh3_dlc27_nor_pillaging.lua` — playable faction set, occupation option IDs, Pillaging Force composition and action points, temporary/permanent Spoils transfer, delivery and disband, Despoilment control payload, and Raider Reward roll.
- `script/campaign/main_warhammer/wh3_dlc27_nor_generic.lua` — Idolatry's altar-scaled five-turn effects, Despoilment treasury calculation, Subterfuge's Manipulation scaling, the Dark Gods' Gifts set curse, and Sayl/non-Sayl altar conversion on confederation.
- `script/campaign/main_warhammer/wh_dlc08_norscan_gods.lua` — faction eligibility, thresholds, god mapping, champion subtypes/ranks, refusal state, challenger factions, and ultimate-refusal mission.
- `script/campaign/main_warhammer/wh_dlc08_monster_hunt.lua` — eligible factions, category/stage state, repeatability, cooldowns, human progression/prolonged-hunt dilemmas, AI cadence, reward overrides, forced start, DLC fallback units, and ultimate-hunter reward.
- `script/campaign/wh3_dlc27_nor_kinfolk.lua` — Trollkind force calculation, Throgg multiplier, Dominion thresholds, ritual costs and force templates, ten-turn income lock, all-armies final stage, and victory checkpoints.
- `script/campaign/wh3_dlc27_wulfrik_start.lua` and `script/campaign/main_warhammer/wh_dlc08_norsca.lua` — turn-5 destination reveal, later Troll Fjord decision/transfer, playable legendary-lord boundary, and current campaign-help wiring.
- `script/campaign/wh3_dlc27_sayl_narrative.lua` — human/IE/single-player branches, three-settlement unlock, introductory altar mission/reward, altar resource changes, 4/10/18/30 quest gates, Manipulation tier unlocks, champion dilemmas, final-battle state, and final trait.
- `script/campaign/wh3_dlc27_nor_sayl_manipulation.lua` — sixteen scripted action callbacks, Attention thresholds/reset, diplomacy locks, rebel force, daemon replacement, wall damage, temporary army, and maximum-tier lock.
- `script/campaign/wh3_dlc27_nor_treacheries.lua` and `script/campaign/wh3_dlc27_nor_confidence.lua` — foreign-slot limits, initial infiltration, activation/spread/exposure, building payload callbacks, Confidence inputs, the separate foreign-slot-removal war path, and the inert below-zero listener's field mismatch.
- `script/campaign/wh3_main_legendary_characters.lua` — Beorg's entitlement, faction eligibility, unlock rank, two mission keys, ancillary, AI turn, and Dolgan priority.
- `db/rituals_tables/data__` was inspected for the relevant Norsca ritual families; exact player-facing names and effects were reconciled against the exported localisation files listed above.

### Web grounding

- Creative Assembly, [Update 7.0: Norsca rework](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/84).
- Creative Assembly, [Tides of Torment: Meet Sayl](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/83-tides-of-torment-meet-sayl).
- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Steam, [Tides of Torment](https://store.steampowered.com/app/3450970/Total_War_WARHAMMER_III____Tides_of_Torment/).
- Total War: WARHAMMER Wiki discovery checklists: [Norsca](https://totalwarwarhammer.fandom.com/wiki/Norsca), [Allegiance to the Gods](https://totalwarwarhammer.fandom.com/wiki/Allegiance_to_the_Gods), and [Beorg Bearstruck](https://totalwarwarhammer.fandom.com/wiki/Beorg_Bearstruck).

### Evidence limitations

- The bundled RPFM service was unavailable at first and was restarted hidden. All successful evidence calls were sequential, read-only, and routed through `scripts/rpfm-call-locked.ps1`. One unsuccessful prefix-listing schema probe supplied no evidence. The exact `db/rituals_tables/data__` path was decoded more than once while establishing response shape; only the 16 exact `wh3_dlc27_sayl_manipulations_*` rows from the final in-memory filter support claims here, and no unrelated row was used.
- Seafang's installed help text defines its eligibility, targets, accompanying fleets, and variable cooldown, but the exact cooldown formula is not present in the decoded Lua; no fixed number is asserted.
- Monster Hunt stages can override global rewards, and Subterfuge uses its current data-defined cooldown as duration. The guide describes their stable scripted relationships without presenting mutable per-record values as universal.
- The reverse audit found no additional Norsca-specific scripted stance, Supply Lines, generic attrition-immunity, or additional-army-upkeep exception outside catalog-owned skills, technologies, and effects. Generic campaign rules are therefore intentionally excluded.
- In installed 8.1.1, Confidence's automatic below-zero-war listener is inert because it reads a state field that the exact Confidence/Treacheries scripts never initialize or assign. The guide reports the implemented limitation instead of promising the intended behavior.
