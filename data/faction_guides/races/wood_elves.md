# Wood Elves campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Wood Elves | `race_slug=wood_elves` | **Playable factions:** 4  
> **Campaign:** Immortal Empires (`main_warhammer`). The installed Realm-of-Chaos Wood Elf narrative loader contains no parallel playable campaign branch.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The four economy CSVs already describe constructible building variants, their normal tiers, costs, construction times, prerequisites, fixed income, Growth, control, trade, and broad recruitment/upkeep effects. The normalized unit file and typed lookups already describe roster membership, faction permissions, unit statistics, weapons, abilities, attributes, and mounts. The character index and 26 Wood Elf character files already describe the static skill trees for legendary, generic, and special characters. Those records are not repeated here. This guide records the scripted forest-health loop, travel and ritual lifecycle, encounters and invasions, special acquisition and replacement rules, councils, faction-specific campaign systems, conditional recruitment pools, human/AI branches, and campaign setup/victory exceptions needed to interpret the catalogs.

## Mechanically relevant material not captured elsewhere

### Magical Forest ownership, Heathlands, and Forest Health

**Applicability:** all four playable factions when human, except where stated. The installed Worldroots updater does not run this player loop for AI factions.

The Immortal Empires network has ten Magical Forests: Athel Loren (the Oak of Ages), Laurelorn Forest, Gaean Vale, Heart of the Jungle (Oreon's Camp), Gryphon Wood, Forest of Gloom, the Witchwood, the Sacred Pools, Jungles of Chi'an, and the Haunted Forest. Each has a separate Forest Health pooled resource, but a scripted transaction made for one human Wood Elf faction is mirrored to the other human Wood Elf factions. Only the primary human Wood Elf faction runs the once-per-round update, preventing duplicate co-op ticks.

Health updates only while a human Wood Elf faction controls that forest's glade, the forest's Rebirth rite is neither active nor complete, and the campaign is past new-game initialization. Each bordering Heathland is classified relative to the glade owner:

- **Pacified:** abandoned; owned by the glade owner; or owned by that owner's ally, vassal, or client. Each contributes **+1 Health per turn**.
- **Hostile:** its owner is at war with the glade owner. Each contributes **-1 Health per turn**.
- **Neutral:** an unrelated owner that is neither allied nor at war. It contributes **0**.

The other installed base transactions are **+5** when a human Wood Elf character razes a Heathland adjacent to its forest, **+2** when a human Wood Elf wins a battle in a Magical Forest or one of its Heathlands, and **-1 per turn** while corruption in the forest region is at least 50. Forest encounters normally add **+10** on resolution. Technologies, buildings, and explicit bonus values can add to the battle, razing, or per-turn amounts. Scripted subtraction cannot leave displayed Health below zero.

Occupation is not itself a one-time Health grant. Its relationship is that occupying a Heathland makes it pacified while the glade owner or a qualifying ally controls it; razing supplies both the immediate +5 and an abandoned, therefore pacified, Heathland afterward. A faction can capture territory from any culture, but full Elven Halls are confined to Athel Loren and the other Magical Forests. Captured settlements elsewhere use the much smaller Asrai Lookout building set. Ordinary chains and slots remain in the economy catalog.

Patch 4.2 added two lifecycle protections reflected in current behavior: Forest Health does not decline while its Ritual of Rebirth is active, and Athel Loren's natural decline does not resume after that ritual is complete. Completion similarly marks every forest as guaranteed/complete so the ordinary updater no longer changes it.

### Forest encounters and incursions

**Applicability:** human Wood Elf factions. AI factions do not generate the player's encounter-marker loop.

On eligible faction turns the Worldroots script selects a valid forest controlled by a human Wood Elf, tests the encounter's faction filter, forest filter, spawn turn, and custom condition, and creates its marker only if the shared marker cooldown is clear. The installed cooldown is **5 ticks**. One-off completions and the next eligible marker time are saved; an encounter marked completed is not regenerated. The Bowmen of Oreon encounter is removed if that faction is dead or already confederated.

Talsyn and Argwylon have turn-1 introductory encounters, Wargrove of Woe a turn-2 introduction, and Heralds of Ariel a turn-6 introduction. Individual encounters may offer a peaceful dilemma, a battle, a confederation-related result, or an expiry callback that creates a hostile incursion. Both ordinary peaceful and battle resolutions are wired to a +10 Health result for the relevant forest; the actor's dilemma/battle payload and the script's mirror-to-other-human-factions path prevent this shared resource from becoming separate co-op state. Encounter armies receive temporary upkeep/regionless-attrition protection and are cleaned up by their scripted resolution. These are one-off authored encounters, not a symmetric repeatable reward table.

### Rituals of Rebirth, staged invasions, and the Grand Defense

**Applicability:** human Wood Elves controlling the relevant glade. The Worldroots script blocks these rites for AI factions.

All ten healing rites are interruptible, take **8 turns**, have an **8-turn cooldown**, and use a **10-turn failure cooldown**. The installed resource-cost relation requires and expends **500** Athel Loren Health for its rite and **100** of the relevant resource for each other forest. The UI and database both say 100 for the Witchwood; however, the current Lua's *ready incident* threshold override for `wh2_dlc16_ritual_rebirth_naggarond_glade` is **300**. This is a real installed mismatch: the engine cost/gate remains 100, while the scripted reminder can wait until 300. The guide does not substitute the reminder threshold for the resource cost.

Starting a rite sets persistent active state, applies ritual VFX and a temporary settlement lock, and creates one staged invasion marker at **every** authored spawn point: **four** around Athel Loren and **three** around each other forest. A marker advances by countdown and can be intercepted before expiry. If it expires, the associated invasion army is created and ordered toward the glade. Army strength scales with campaign turn, difficulty, and the number of already completed Rebirth rites; if the primary invader faction is human, the script chooses its configured alternative instead. The rite's `interruptable` and failure-cooldown records govern failure, but the decoded Lua does not establish a second bespoke faction-defeat or ownership-transfer recovery rule.

Successful completion removes the ritual lock, markers, and surviving scripted invasion forces; marks the forest complete; and locks that specific rite for every human Wood Elf faction. Completion is therefore global and one-time in co-op, not repeatable separately by each player. Region-specific rites unlock their authored lasting landmark/reward relationship. Installed help also awards Amber from completed Rebirth rites; Amber is then spent by designated technologies. Wargrove of Woe receives one Amber during new-game Worldroots setup.

Completing Athel Loren's rite issues `wh_dlc05_qb_wef_grand_defense_of_the_oak`. In non-multiplayer, winning the Grand Defense removes remaining Beastmen quest forces and completes the `delay_victory` listener; the set-piece-battle objective itself remains in the shared Wood Elf long-victory definitions. For Talsyn it also completes the separate `athel_healed` scripted short-victory condition. The final battle is not the generic Immortal Empires Wild Hunt endgame crisis; that crisis is a separate global system.

### Worldroots stance and Deeproots travel

**Applicability:** all four playable factions; the documented Deeproots unlock/incident is a human branch.

The ordinary **Use Worldroots** army stance is short-range tunnelling movement through otherwise impassable terrain. The army must emerge within the same movement phase, can be intercepted by a nearby enemy army, and cannot continue normal movement after emerging. It is distinct from Deeproots teleportation.

At turn **10**, the script unlocks all ten `WORLDROOTS_TELEPORTATION` rites for every human Wood Elf faction and fires the Deeproots-available incident. To use them, select an eligible army currently in a Magical Forest region and choose a *different* Magical Forest destination through its settlement overlay. The selected force may originate in any Magical Forest region regardless of ownership; the target criteria include every other forest and do not test region ownership. Eligible forces are marked in the Lords and Heroes list. Teleporting is instant and the rites have no individual cooldown, but they share a **10-turn global category cooldown** for that faction.

### Confederation missions and diplomacy exceptions

**Applicability:** asymmetric by player faction and target. These are optional scripted routes in addition to ordinary diplomacy; the records do not disable diplomatic confederation or AI targeting for their Wood Elf targets.

Each eligible route is generated once. The target must still be a living, non-human faction; if it dies after mission generation, the mission is cancelled. Success opens a four-choice dilemma. Only choice 0 accepts and force-confederates the target; every other choice declines. After the dilemma, peace is forced if the target is still alive. Generated/completed state is saved. Human Wood Elves are excluded from the generic five-turn post-confederation lock, so this system does not impose a waiting period between their confederations.

| Target | Eligible player factions and issue gate | Mission objective |
|---|---|---|
| Talsyn / Orion | Argwylon or Heralds; Oak of Ages main building level 3; no diplomatic contact required | Raze or sack 10 different settlements. |
| Torgovann | Talsyn, Argwylon, or Heralds; Oak level 2; no contact required | Defeat 3 Bretonnian armies. |
| Wydrioth | Talsyn, Argwylon, or Heralds; Oak level 2; no contact required | Defeat 3 Greenskin armies. |
| Heralds of Ariel / Sisters | Talsyn or Argwylon; Oak level 3; no contact required; human claimant needs *The Twisted & The Twilight* entitlement | Defeat 3 Skaven armies. |
| Argwylon / Durthu | Talsyn, Heralds, or Wargrove; Oak level 3; no contact required | Defeat 3 Dwarf armies. |
| Wargrove of Woe / Drycha | Argwylon only; turn 2 or later; diplomatic contact required | Defeat 5 Wood Elf-subculture armies. |
| Laurelorn Forest | Talsyn, Argwylon, or Heralds; diplomatic contact required | Defeat 1 Norscan army. |
| Bowmen of Oreon | Talsyn, Argwylon, or Heralds; diplomatic contact required | Defeat 1 Bowmen of Oreon army in a victory. |
| Spirits of Shanlin | Talsyn, Argwylon, or Heralds; diplomatic contact required | Defeat 1 Cathayan army. |

The race's diplomacy setup separately prevents AI Wood Elf factions from declaring war on another Wood Elf. When a campaign contains a human Wood Elf, setup enables ordinary Wood-Elf-to-Wood-Elf confederation from each non-Drycha human faction: Talsyn, Argwylon, and Heralds. Drycha is the exception: she is barred from confederating Wood Elves generally and explicitly permitted to confederate only Argwylon. No bespoke resurrection-after-defeat route was found; dead scripted targets cancel rather than being recreated.

### Councils and offices

**Applicability:** every faction has a different council. Each non-leader post has one concurrent occupant, no assignment cost, no minimum term, and no scripted expiry; faction-leader posts are fixed. Building-gated office unlock chains and their construction requirements are already in the economy catalog.

- **Talsyn — Orion's Chosen:** Orion is fixed as Master of the Hunt. Its assignable seats are Talon of Kurnous, Herald of the Hunt, Spirit of the Hunt, Master of Supplies, Master of Drums, and Master of Scouts. The Elven seats reject Ancient/Malevolent Treemen and Drycha; conversely the Spirit of the Hunt seat rejects Elven lords. This is the only council read by Orion's Wild Hunt script.
- **Argwylon — Gathering of the Ancients:** Durthu is fixed as the Eldest of Ancients. The four assignable posts are Ancients of Delliandra, Druthandor, Talrennic, and Threllock. Elven lords, Orion, and the Sisters are excluded; the intended occupants are Ancient or eligible Tree Spirit lords.
- **Heralds of Ariel — Court of the Mage-Queen:** the Sisters are fixed as Heralds of Isha. Assignable seats are Queen's Champion, Darkweaver, Highweaver, Treesinger of Isha, Beastbinder of Kurnous, and Glamourweaver of Loec. Queen's Champion accepts Orion or a Glade Lord, not the Sisters/Tree lords; Darkweaver and Highweaver require the corresponding lore-qualified Spellweaver, and the remaining religious seats have their installed subtype restrictions rather than accepting any lord.
- **Wargrove of Woe — Court of Addaivoch:** Drycha is fixed as Handmaiden of Coeddil. Its four assignable posts are Speakers for the Embittered, Forgotten, Lost, and Wild, using Drycha's forest-spirit/malevolent lord pool rather than the Elven councils.

Office effect bundles apply while the eligible character occupies the post. Reassignment replaces the beneficiary; nothing in the decoded Wood Elf scripts duplicates a post or preserves its bundle after the occupant leaves it.

### Talsyn, Orion, and the Wild Hunt

**Applicability:** `wh_dlc05_wef_wood_elves` only. Confederating Orion into another faction does not transfer Talsyn's faction script.

The first Wild Hunt is scheduled for faction turn **1**, provided Talsyn's faction leader has a military force. A hunt lasts **5 turns**; the next begins **5 turns after the previous hunt ends**, producing a ten-turn start-to-start cycle. Start/end turns are saved. At the start, the script visits Talsyn characters who both lead a force and occupy one of the seven mapped posts (including Orion's leader post), then applies that post's active-hunt army bundle for the hunt duration plus the script's one-turn boundary allowance. An empty post or an office holder without a force receives no army bundle. Installed office/effect tables remain authoritative for the individual payload values.

AI Talsyn has a separate strategic-personality cycle: it begins defensive for 60 Talsyn faction turns, switches aggressive for 10, then defensive for 50, and repeats the 10/50 cycle. Human players receive the change incidents. In multiplayer with any human Wood Elf, the setup forces playable AI Wood Elf factions defensive and minor Wood Elf factions aggressive. This AI behavior is not the player's timed Wild Hunt buff.

### Argwylon, Durthu, Drycha, and Aspects

**Applicability:** manual Aspect purchase is available to Argwylon and Wargrove of Woe. The installed ban table excludes Talsyn and Heralds of Ariel from all nine Aspect purchases. Argwylon's other faction systems remain with `wh_dlc05_wef_argwylon` and are not transferred merely by recruiting Durthu elsewhere.

Each eligible Dryad, Treekin, or Treeman unit may hold one of three purchased Aspects. Buying a different Aspect causes the script to unpurchase every other Aspect on that unit, so upgrades are mutually exclusive rather than cumulative. The treasury costs are **150 for Dryads**, **300 for Treekin**, and **500 for Treemen**, regardless of which Aspect is chosen:

| Aspect | Dryad | Treekin | Treeman |
|---|---|---|---|
| Birch | +8 armour-piercing weapon damage, +10% speed, -10% physical resistance | +12 AP damage, +10% speed, -10% physical resistance | +75 AP damage, +10% speed, -10% physical resistance |
| Oak | Charge defence vs large, +20 armour, -10% speed | Expert charge defence, +20 armour, -10% speed | +20 armour, +10% missile resistance, -10% speed |
| Willow | -3 AP damage, +6 bonus vs infantry, +6 melee defence | -6 AP damage, +8 bonus vs infantry, +8 melee defence | +250 base weapon strength with -150 AP damage, +12 melee defence |

Every tenth world turn, the Worldroots script checks AI Wood Elves other than Argwylon and Drycha for an automated Aspect purchase, but the current executable guard admits only **armed-citizenry** forces. It therefore does not configure ordinary AI field armies; treat it as a garrison/armed-citizenry fallback rather than a general workaround for the player-facing faction bans. Argwylon and Drycha are excluded because their factions have manual Aspect access.

Immortal Empires setup gives a human Argwylon ownership of the Oak of Ages if Talsyn is AI. Argwylon is also the only faction with the scripted route to confederate Drycha, while Talsyn, Heralds, and Drycha can use the Oak-level-3 route to acquire Argwylon and Durthu.

### Heralds of Ariel, the Sisters, and the Forge of Daith

**Applicability:** `wh2_dlc16_wef_sisters_of_twilight` only. Confederating the Sisters does not transfer the faction's Forge state machine.

The Forge tracks **16 items** across four themed sets (Dragon, Dreaming, Eagle, and Twilight) and four equipment classes. Each item has an unowned state, permanent upgrade tier, and optional reforge timer. A battle won by the Sisters as faction leader—whether primary general or participating secondary general—awards **1 Daith's Favour**, with an `increase_daiths_favour_chance` percentage roll able to raise the award to 2. Favour has an installed hard maximum of **3**, so a 2-point award is clamped at that cap. The gain goes on cooldown until Heralds' faction-turn end, so multiple victories in one faction turn do not each pay Favour.

Permanent item acquisition/upgrades cost **1, 2, then 3 Favour** and are instant. Reforging costs **2 Favour**, has a **5-turn ritual cooldown**, temporarily replaces the current item with its level-4 Reforged version, and stores the permanent tier. At Heralds faction-turn starts the reforge timer falls; after five turns the script replaces the temporary item with the stored permanent version. Replacement keeps the item on its living, unwounded bearer. If the bearer is wounded or no bearer is found, the replacement returns to the faction item pool. The script removes any duplicate copy of the incoming item before replacement.

Four separate Forge faction-boon rites cost 1 Favour and have 5-turn cooldowns. Their ordinary effect payloads are data rows rather than a separate lifecycle and are not expanded here. An AI Heralds campaign chooses one of the four themed contexts at new-game start and actively pursues that item set; the choice and Forge item/timer state are saved.

If both Talsyn and Argwylon are AI at Immortal Empires setup, a human Heralds campaign receives the Oak of Ages. This ownership transfer is a start-position exception, not a mid-campaign claim rule.

### Ariel's globally exclusive arrival

**Applicability:** eligible claimants are Talsyn, Argwylon, and Heralds; Wargrove of Woe is explicitly excluded.

For human claimants, completing any of the ten Rebirth rites triggers Ariel's arrival. The first eligible human faction to do so receives the globally unique hero near its faction leader when a valid spawn is available, otherwise through the script's home-region unique-agent fallback, plus her five named ancillaries. The framework then removes the other human ritual listeners and saves `has_spawned`; another player or later confederation does not create a replacement Ariel.

If **zero eligible human claimant exists at setup**, the strongest eligible AI Talsyn/Argwylon/Heralds faction receives Ariel from world round **20**. AI eligibility uses the installed `faction_has_dlc_or_is_ai` branch, so this fallback is not subject to player DLC ownership. If an eligible human claimant does exist at setup, the ritual listeners are installed instead; the turn-20 AI fallback is not later added merely because no player has claimed her yet. Wargrove is neither a human claimant nor an AI fallback target. Wounding uses the game's ordinary immortal-character recovery; the acquisition script does not grant a second copy after permanent loss or faction destruction.

### Wargrove of Woe, Glamoured Elves, Wild Spirits, and Coeddil

**Applicability:** `wh2_dlc16_wef_drycha` only unless an exact unit/character permission says otherwise.

Drycha's normal Elven recruits are Glamoured: the faction effect reduces their combat power, increases leadership, and makes them Expendable. One of Drycha's cataloged skills removes the combat penalties, but installed help states that the Expendable status remains. The exact unit permissions, malevolent character pool, excluded standard Elven casters/lords, and individual abilities belong to the unit and skill catalogs.

The Wild Spirits & Beasts button instantly recruits from the selected lord's local `raise_dead`-style province pool. The installed Drycha-only pool starts with one Malicious Dryad, one Cave Bat, and one Giant Wolf group; Hawks, Feral Manticore, Giant Spiders, and Feral Bear start at zero. Their maximum local stocks and per-turn random refill chances are:

| Group | Local cap | Refill chance per turn | Maximum refill on success |
|---|---:|---:|---:|
| Malicious Dryads | 1 | 10% | 1 |
| Cave Bats | 3 | 35% | 1 |
| Giant Wolves | 2 | 10% | 1 |
| Hawks | 2 | 5% | 1 |
| Giant Spiders | 2 | 10% | 1 |
| Feral Bear | 2 | 10% | 1 |
| Feral Manticore | 1 | 1% | 1 |

Recruit rank can be modified by the dedicated Wild Spirits effect. This pool is local and gradually replenishing; it is not a factionwide unlimited roster and does not include the Malicious Treekin/Treeman groups found elsewhere in the installed mercenary-unit table.

For current Immortal Empires, Drycha's Fang of Taalroth quest entry is `wh3_main_ie_qb_wef_drycha_coeddil_unchained`. Success of that quest-battle mission family fires a one-shot Worldroots listener that spawns unique hero Coeddil for the completing faction. The installed legendary-character framework also retains the older `wh2_dlc16_wef_drycha_coeddil_unchained_stage_4` route and gives an AI Drycha faction a turn-20 fallback; the separate legacy chain script still contains its patrol, forced-war, and cleanup listeners. No current IE issuer for those legacy stage keys appears in `wh_quests.lua`, so they are recorded as retained compatibility logic, not presented as the normal current player route. Unique-agent spawning prevents duplicate Coeddils.

Drycha has a special Gryphon Wood invasion configuration during its Rebirth lifecycle, and begins with one Amber. Her confederation and council exclusions are described above. She cannot claim Ariel.

### Campaign setup, human/AI state, and victory routes

The active Wood Elf scripts are loaded only into `main_warhammer`. The installed `_narrative/races/wh3_narrative_wood_elves.lua` has no equivalent Realm-of-Chaos player progression, and legacy Vortex objectives are not carried into this guide.

Immortal Empires start setup contains three Wood Elf exceptions: Argwylon receives the Oak of Ages if Argwylon is human and Talsyn is AI; Heralds receive it if Heralds are human and both Talsyn and Argwylon are AI; and a human Talsyn start teleports two Talsyn characters to authored opening positions. Separately, if Gaean Vale is still held by a non-human High Elf at turn 45, Worldroots can replace that ownership with a five-turn Chaos invasion event. This is a fixed AI/start-state correction, not a repeatable player action.

The installed short victory combines the faction-specific condition below with the generic order-alignment requirement to occupy, loot, raze, or sack **30 settlements**:

- **Talsyn:** complete the scripted `athel_healed` state, set by the Athel Loren/Grand Defense lifecycle.
- **Argwylon:** destroy the Barrow Legion, with confederation counting as valid resolution.
- **Heralds of Ariel:** perform two `WORLDROOTS_HEALING` rites.
- **Wargrove of Woe:** control five specified Athel Loren provinces: Argwylon, Wydrioth, Yn Edri Eternos, Talsyn, and Torgovann.

The shared long victory first requires the short victory, then the generic 60-settlement order objective, the Grand Defense set-piece battle, Athel Loren's Rebirth rite, and **8 total** `WORLDROOTS_HEALING` rites. Multiplayer additionally offers the generic team 100-settlement alternative; it does not replace the race/faction routes.

## Faction coverage

- **Talsyn** — `wh_dlc05_wef_wood_elves`: shared forest health, Heathlands, encounters, Rebirth, Grand Defense, Deeproots, Amber, and victory loop; Orion's Chosen council; timed Wild Hunt and AI personality cycle; confederation routes excluding the self-target and Drycha; Ariel eligibility; Talsyn start teleports and `athel_healed` short victory.
- **Argwylon** — `wh_dlc05_wef_argwylon`: shared race systems; Gathering of the Ancients; manual Aspect purchase lifecycle; unique permission to pursue Drycha's confederation mission and routes to Talsyn/Sisters/minors; Ariel eligibility; conditional Oak start ownership; Barrow Legion short victory.
- **Heralds of Ariel** — `wh2_dlc16_wef_sisters_of_twilight`: shared race systems; Court of the Mage-Queen; Forge of Daith Favour/item/reforge lifecycle and AI themed-set branch; Ariel eligibility; conditional Oak start ownership; two-Rebirth short victory. The Forge remains faction-bound after confederation.
- **Wargrove of Woe** — `wh2_dlc16_wef_drycha`: shared race systems with Drycha's Gryphon Wood and diplomacy exceptions; Court of Addaivoch; manual Aspect purchase lifecycle, including malicious Tree Spirits; Glamoured Elves; local Wild Spirits pool and caps; current IE Coeddil quest-battle route plus retained legacy/AI fallbacks; one starting Amber; no Ariel; only the Argwylon confederation target; five-province short victory.

## Evidence register

### Project material consulted

- `README.md`; `data/faction_guides/README.md`; `data/faction_guides/TASK_A_PROMPT.md`; `data/faction_guides/TASK_B_PROMPT.md`; `data/faction_guides/RESEARCH_SPEC.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all four files under `data/economy/factions/wood_elves/`.
- `data/unit_stats/normalized/wood_elves__wh3__8.1.1__ultra.csv`; roster, ability, mount, and faction-permission lookups; unit source manifests and current localization.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 26 files under `data/skill_trees/characters/wood_elves/`.
- `work/source_campaign_atlas__wh3__8.1.1/db/{missions_tables,cdir_events_mission_option_junctions_tables}/data__.tsv` and linked current localization.

### Installed vanilla game files and stable records

Read through the repository's read-only locked RPFM workflow with merged vanilla CA packs (`PackFile`, literal `pack_key=$CA` where required):

- `script/campaign/main_warhammer/required.lua` and `wh_start.lua` — active loader topology.
- `script/campaign/wh2_dlc16_wef_worldroots.lua` — forest map, Health transactions and sharing, encounters, ritual markers/invasions/completion, Deeproots unlock/VFX, Drycha diplomacy/Amber/Coeddil listener, AI Aspect fallback, and Gaean Vale invasion.
- `script/campaign/wh2_dlc16_wef_sisters_forge.lua` — Favour cooldown, AI context, item state, replacement/reversion, and save/load lifecycle.
- `script/campaign/main_warhammer/wh_dlc05_wood_elves.lua` — Wild Hunt schedule/office bundles, AI personality cycle, inter-Wood-Elf AI-war protection, and Grand Defense cleanup.
- `script/campaign/wh2_campaign_confederation_missions.lua` — nine Wood Elf route records, gates, dead-target cancellation, dilemma choice, forced peace, and saved state.
- `script/campaign/wh2_dlc16_drycha_coeddil_unchained.lua`, `script/campaign/main_warhammer/wh_quests.lua`, and `script/campaign/wh3_main_legendary_characters.lua` — current IE Coeddil quest, retained legacy route, global unique-agent rules, Ariel/Coeddil claimant sets, and AI fallback turns.
- `script/campaign/wh2_campaign_custom_starts.lua`, `script/campaign/wh_campaign_setup.lua`, and `script/campaign/main_warhammer/victory_objectives.lua` — Oak/start-position transfers, post-confederation exemption, and exact short/long objectives.
- `db/rituals_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/ritual_target_criteria_tables/data__`, `db/ritual_payloads_tables/data__`, and `db/resource_cost_pooled_resource_junctions_tables/data__` — ritual timing, categories, global cooldowns, target rules, teleport destinations, and Health/Favour costs.
- `db/unit_purchasable_effects_tables/data__`, `db/unit_purchasable_effect_sets_tables/data__`, `db/faction_banned_unit_purchasable_effects_tables/data__`, `db/resource_costs_tables/data__`, and `db/effect_bundles_to_effects_junctions_tables/data__` — eligible units, Argwylon/Drycha access versus Talsyn/Heralds bans, 150/300/500 costs, and exact modifiers.
- `db/mercenary_pools_tables/data__`, `db/mercenary_pool_to_groups_junctions_tables/data__`, and `db/mercenary_unit_groups_tables/data__` — Drycha-only local pool, initial counts, caps, and refill chances.
- `db/ministerial_positions_tables/data__`, `db/ministerial_positions_culture_details_tables/data__`, `db/ministerial_position_effect_bundles_tables/data__`, and current subtype-restriction localization — council seats, one-occupant/no-cost/no-term records, and subtype restrictions.
- `db/campaign_features_tables/data__`, `db/culture_settlement_occupation_options_tables/data__`, `db/pooled_resources_tables/data__`, the four current economy exports, and installed help — campaign feature, settlement/outpost boundaries, and the Favour cap.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes).
- Creative Assembly, [The Twisted & The Twilight / Wood Elf rework announcement](https://store.steampowered.com/news/posts/?appids=594570&enddate=1607439628&feed=steam_community_announcements) — historical discovery checklist; current installed scripts/tables take precedence where later data differs.
- Creative Assembly, [Patch 4.2 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/2-total-war-warhammer-iii-patch-4-2-0) — no Health decline during Rebirth and no natural Athel Loren decline after completion.
- Creative Assembly, [Improving AI in Campaign, Part 2](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/69-total-war-warhammer-iii-improving-ai-in-campaign-part-2) — AI Heralds pursue a themed Forge item set.
- Steam/Creative Assembly, [Update 3.1 notes](https://store.steampowered.com/news/app/1142710/view/3730714259954387595) — Ariel arriving after a Ritual of Rebirth.
- Creative Assembly, [Hotfix 6.1.5](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/9955-total-war-warhammer-iii-hotfix-6-1-5) and [Hotfix 6.1.2](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/9507-total-war-warhammer-iii-hotfix-6-1-2) — current jungle-as-forest handling and Gryphon Wood co-op ritual stability.
- Steam, [The Twisted & The Twilight](https://store.steampowered.com/app/1315750/Total_War_WARHAMMER_II__The_Twisted__The_Twilight/) — DLC identity and Sisters/Drycha campaign context.

### Evidence limitations

- Every installed-pack operation was sequential and read-only through `scripts/rpfm-call-locked.ps1`; no pack edit/save method was called. The local RPFM 5.0.6 service was restarted after two endpoint resets, and a high-cardinality reduction of the shared ritual-component relation exhausted one helper process. Failed calls are not evidence and were not repeatedly retried. The common Rebirth payload was therefore left at the bounded installed building-unlock/help relationship rather than expanded into unsupported per-forest reward claims.
- Witchwood has an installed evidence conflict: the Lua readiness incident uses 300 Health, while the current ritual resource-cost relation and UI require/spend 100. Both are stated with their separate roles.
- Current IE Coeddil acquisition uses the `wh3_main_ie_qb_*` quest listener. The still-loaded `wh2_dlc16_*stage_4` framework is retained compatibility logic; it is not silently promoted to the current IE player route.
- Exact settlement start positions and the full startpos binary were not independently decoded. Only scripted ownership transfers and cataloged settlement/building boundaries are asserted.
- Ordinary unit, skill, building, office-effect, ritual-reward, and faction-trait payload rows remain in their standardized catalogs or source relations. They are repeated only where a value is an input, cap, cost, replacement, or exception in the campaign lifecycle above.
