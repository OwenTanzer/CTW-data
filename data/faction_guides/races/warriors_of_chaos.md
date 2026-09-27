# Warriors of Chaos campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**
>
> **Race:** Warriors of Chaos | `race_slug=warriors_of_chaos` | **Playable factions:** 8

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The eight economy exports already contain the ordinary Dark Fortress and minor-settlement building levels, construction costs and times, prerequisites, and standardized effects. The normalized unit file and typed lookups already contain roster permissions, unit statistics, abilities, mounts, and attributes. The 33 character files already contain the eight legendary-lord trees, Harald Hammerstorm, generic Undivided and marked characters, and the four challenger proxies. Those records are not repeated here. This guide supplies the campaign-state rules needed to interpret them: settlement eligibility, local Warband pools and upgrades, Souls and Gifts, Authority, Path to Glory replacement, faction mechanics, vassal/confederation behavior, unique-character access, human/AI branches, and campaign-specific victory state.

## Mechanically relevant material not captured elsewhere

### Branch matrix

> **9.0 disposition:** The eight-faction census and Sigvald all-gods exception below are historical. Glottkin is not covered by that matrix. See [current routing](../UPDATE_9.0_CLAIMS.md).

All eight factions use Dark Fortresses, Warbands, Souls, Gifts of Chaos, Authority, and Path to Glory. Seven also use the Eye of the Gods; **Shadow Legion is excluded from the Eye ritual group**. Their available branches are deliberately asymmetric:

| Faction | Character / Authority branches | Additional campaign system |
|---|---|---|
| Warhost of the Apocalypse — `wh_main_chs_chaos` | Undivided and all four gods | Archaon's vassal scaling; forced WoC confederation |
| Shadow Legion — `wh3_main_chs_shadow_legion` | Undivided and all four gods | Shadow Rifts, four Unholy Manifestations, Be'lakor's Shadow; no Eye; no Gifted-unit army cap; forced WoC confederation |
| Heralds of the Tempest — `wh3_dlc20_chs_kholek` | Undivided and all four gods | Kholek's per-vassal scaling and Dragon Ogre Warband capacity |
| The Decadent Host — `wh3_dlc20_chs_sigvald` | Undivided and all four gods; Slaanesh emphasis | Gifts of Slaanesh, Seductive Influence, and unit Seduction |
| The Ecstatic Legions — `wh3_dlc20_chs_azazel` | Undivided plus Slaanesh only | Gifts of Slaanesh, Seductive Influence, and unit Seduction |
| The Fecundites — `wh3_dlc20_chs_festus` | Undivided plus Nurgle only | Plague Cauldron and Infections |
| Legion of the Gorequeen — `wh3_dlc20_chs_valkia` | Undivided plus Khorne only | Bloodletting |
| Puppets of Misrule — `wh3_dlc20_chs_vilitch` | Undivided plus Tzeentch only | five Souls-funded Changing actions and Teleport stance |

The marked Champions therefore do not have cross-god Marks, Authorities, Daemon Princes, or Gift branches merely because those records exist elsewhere in the race data. Sigvald is the exception among patron-themed factions: his campaign remains mechanically Undivided and retains access to all gods.

### Dark Fortresses, minor settlements, and vassals

> **9.0 disposition:** Use current atlas region-group membership for fortress locations; the homeland/revival claims below remain historical. See [current routing](../UPDATE_9.0_CLAIMS.md).

**Applicability:** all eight factions; both campaigns where that faction is playable.

Only designated Dark Fortress regions support the full Warriors of Chaos settlement. An ordinary occupied settlement has one building slot and only the narrow minor-settlement choices, even in a nominally suitable climate. Climate instead affects the local Warband pool; it does not turn an ordinary region into a Fortress or unlock the Fortress catalog.

Some Dark Fortresses are also Norscan homeland capitals. Conquering one with its homeland relation intact exposes **Occupy and Vassalize**: the associated Norscan faction becomes the occupier's vassal. Not every Dark Fortress has a tribe, and the relation is settlement-specific rather than a blanket Norsca rule. A homeland can span several provinces, but has one capital; its other tagged settlements can be gifted to the associated tribe once it is your vassal. Patch 8.1 repaired incorrectly configured homeland settlements, so current behavior must not be inferred from pre-8.1 bug reports. The installed vassal-personality script changes an affected tribe to a dedicated WoC-vassal AI personality while it remains a vassal, then restores its campaign-specific normal personality if the relation ends; Immortal Empires and Realm of Chaos use different personality keys, with explicit restoration cases for Wulfrik, Throgg, and Dolgan/Sayl.

This evidence proves vassalization of the **respective extant faction**. It does not prove that every destroyed or Norscan-confederated tribe will be recreated. A missing, dead, or absorbed tribe can therefore leave the fortress without a usable liberation target; the guide makes no general revival promise.

Beyond homeland capture, Warriors of Chaos can subjugate eligible factions on their final settlement. The installed-era 2.1 change explicitly extended this to all human and elven races. Subjugation preserves the target as a separate vassal; it does not place that faction's legendary lord in the WoC lord pool. A human WoC faction with at least one vassal also receives a 7% faction-turn-start roll, after the opening turn, for one of four vassal dilemma families. The script chooses a valid vassal and, where needed, a character or region; outcomes include favour, XP, ancillaries, development, building damage, or character wounding. There is no equivalent AI dilemma listener.

Archaon's faction gains **+10 research rate, +10 diplomatic relations with Daemons/WoC/Beastmen/Norsca, and +25 Souls per turn for each current vassal**. Kholek personally gains **+5% weapon strength, mass, and armour per current vassal**. These bonuses are live vassal-count effects, not one-time rewards.

Patron-aligned leaders also alter every current vassal: Azazel and Sigvald grant **Immune to Psychology** and Slaanesh-corruption spread; Festus grants **Poison Attacks** and Nurgle-corruption spread; Valkia grants **Frenzy** and Khorne-corruption spread; Vilitch grants increased **Barrier hit points** and Tzeentch-corruption spread. These are leader/faction effects, not rewards for a particular homeland.

### Warband recruitment and unit upgrades

**Applicability:** all eight factions; available to armies rather than tied to a conventional recruitment queue.

Warband Recruitment hires instantly from a finite local pool. The candidate set and replenishment weights depend on local climate, corruption, and buildings. Basic mortals replenish more readily; military buildings add capacity or improve access to particular families, and some faction relations replace or extend those families—for example Kholek's Dark Fortresses add Dragon Ogre capacity. Hiring removes that candidate from the local pool until its data-driven replenishment roll restores it. Recruit-rank, cost, pool-capacity, and replenishment effects apply to this Warband transaction; Patch 8.1 specifically repaired **Raise the Banners** so that both its rank and cost modifiers apply.

Warband Upgrades transform an experienced unit in an army into one of the displayed successors. The operation is immediate, costs Favour, and requires the source unit to meet the target's experience-rank gate; technology gates also protect major steps such as Chosen and Chaos Knights. Marks are branches in this same graph, not removable equipment. The current graph contains one-to-many choices rather than a symmetric ladder: infantry, cavalry/chariot, monster, marked, and faction/DLC branches diverge, and an unavailable patron branch is not inferred. The transformed unit retains most of its accumulated experience, so the process is not disband-and-recruit, but its target identity, attributes, and applicable Authority change immediately. Valkia additionally has the installed Bloodletter-to-Exalted-Bloodletter upgrade branch.

The WoC campaign feature group disables **additional-army upkeep**. All eight factions therefore avoid the standard Supply Lines multiplier from fielding extra armies, although every army still pays its ordinary unit and character upkeep.

### Souls, Gifts of Chaos, and Gifted Units

> **9.0 disposition:** Historical costs and patron permissions below do not establish current Sigvald or Glottkin access. See [current routing](../UPDATE_9.0_CLAIMS.md).

**Applicability:** all eight factions, with faction-specific sources and branch restrictions below.

Every faction receives the shared culture resources with **1,000 starting Souls**. Souls are gained from victories, captive sacrifice, razing, settlement/vassalization payloads, missions/events, and faction modifiers. The battle/razing target set excludes Khorne, Nurgle, Slaanesh, Tzeentch, and Daemons of Chaos: a Daemonic faction does not yield Souls merely because its army contains mortal units. Current faction exceptions include Archaon's +25 Souls per vassal per turn, Festus's Souls when a plague spreads, Vilitch's conversion of part of his own battle casualties, Valkia's +50% Souls from sacrificing captives, and +25 Souls per turn from an enemy character bearing Azazel's or Sigvald's Gift of Slaanesh.

Gifts are unlocked by technology and by cumulative Souls sacrificed to Undivided or a god. Spending through Path to Glory and the relevant technology counters also advances that patron's cumulative total. The installed tier pattern is:

| Gift tier | Activation cost | Souls upkeep per turn | Cumulative sacrifice gates found in current records |
|---:|---:|---:|---:|
| 1 | 500 | 50 | 1,000 |
| 2 | 750 | 100 | 2,500 |
| 3 | 1,500 | 150 | 5,000 or 7,500, depending on record |
| 4 | 2,000 | 200 | 15,000 |
| 5 | 2,500 | 350 | 20,000 or 25,000, depending on record |

These are base resource relations; technologies, traits, and faction effects can modify the displayed cost or add active slots. A Gift occupies a compatible active slot and charges its upkeep each turn. If upkeep cannot be paid, its effects are lost. Gifted-unit Gifts add their named unit to the separate Gifted Units pool immediately and then at the interval stated by that Gift. Recruitment from that pool is instant, consumes a stored unit, and still pays the unit's recruitment cost. Gifted units are not generated by local Warband climate/building rolls.

Installed leader effects add one Undivided Gift slot for Archaon and Kholek and one matching patron slot for each marked Champion. Be'lakor starts with all four patron Gift slots; Sigvald instead receives **-25% activation cost for Slaanesh Gifts**. These slot/cost effects do not expand a faction's permitted Mark or Daemon-Prince branches.

Except for Shadow Legion, an army can contain at most **six Gifted units**. Be'lakor has no per-army Gifted-unit limit and begins with broader Gift access; this does not make his stored pool infinite. Pool capacity and periodic Gift production still apply.

### Authority and army applicability

Authority is a per-army calculation, not a faction-wide alignment meter. The installed script sums the general and embedded heroes, then refreshes the five resource managers on character recruitment, army-assist/embedding, convalescence or death, and skill allocation. Each Authority affects only units bearing its matching Mark or Undivided identity in that army.

Positive Authority reduces upkeep, recruitment cost, and Warband upgrade cost and raises casualty replenishment for matching units; installed effect bundles cover positive states 0–10 and negative records -1 through -5, whose localization describes the inverse penalties. The character/faction permissions in the branch matrix determine which tracks are operative. A marked unit in a mixed army does not benefit from the lord's unrelated Undivided or rival-god Authority.

### Path to Glory, Marks, boons, and Daemon Princes

> **9.0 disposition:** Do not derive current cross-god permissions from the historical Sigvald branch matrix. See [current routing](../UPDATE_9.0_CLAIMS.md).

**Applicability:** eligible non-legendary mortal lords and heroes. Legendary characters are not replacement candidates.

Each eligible character has its own initiative set. Boons have heterogeneous personal triggers—battle wins, kills, army composition, Winds, corruption or climate, stance and post-battle choices, rank, surviving defeat, and hero actions are all represented—so progress on one character does not advance another and there is no universal boon counter. Completing an initiative grants its attached character boon. Subtype-specific successor records carry applicable boons across a permitted replacement; this is separate from the reset skill tree.

Dedication becomes available at **rank 5** and spends **2,000 Souls for an eligible hero** or **3,000 for an eligible lord**. It replaces the mortal subtype with the patron-marked counterpart allowed by the faction and character lore; sorcerer branches can also change the available lore of magic. The replacement normally begins at half the former rank and resets skill choices; Path-level retention modifiers can improve that fraction. A Mark is not later swapped freely to a rival god, and the original recruitment trait is not guaranteed to survive subtype replacement.

A marked mortal lord can ascend to the matching Daemon Prince at **rank 20 for 5,000 Souls**. A rank-30 Undivided lord can ascend directly to an Undivided or permitted god-aligned prince for **10,000 Souls**. The new character is a replacement at **half the former rank**, with skill points reset for the new tree; the old subtype is removed rather than retained as a wounded duplicate. The human choice supports accept, delay, and refusal states; delaying applies the Path cooldown before the decision can progress again. Faction leaders, legendary lords, heroes, already-Daemonic characters, and patron branches outside the faction matrix are ineligible.

Be'lakor's separate conversion does not use this rank/choice path. After Shadow Legion wins a fought battle against, or completes a successful hero action on, a qualifying enemy general, that non-unique, non-faction-leader human-culture lord receives Be'lakor's Shadow for ten turns. Losing a battle to that target removes it. If the target survives the timer, the original is killed and a **level-21 Undivided Daemon Prince** is added to Shadow Legion's recruitment pool. Destroying Shadow Legion clears all outstanding marks. Converted princes remain Undivided; there is no later patron-dedication branch.

### Eye of the Gods

**Applicability:** Warhost of the Apocalypse, Heralds of the Tempest, The Decadent Host, and all four Champions. **Shadow Legion does not have this mechanic.** A broad culture resource record can still assign its faction 20 inert progress, but the installed ritual group expressly excludes Be'lakor and supplies him no Eye dilemma route.

The seven eligible factions begin with **20 Eye progress**. Each active Gift adds **1 progress per turn**. When an eligible human faction reaches the **50-point** ritual cost at faction-turn start, the script automatically performs `wh3_dlc20_ritual_chs_eye_of_the_gods`, spends 50 progress, and opens a four-choice dilemma. The four Champions use patron-specific dilemma keys; Archaon, Kholek, and Sigvald use the default.

The choices are randomly drawn from four installed payload families: army rewards, character rewards, faction/Dark-Fortress or Gifted-unit rewards, and Gift activation-cost rewards. Every selected outcome also applies the progress-cost payload. Festus's **The Gift of Choice** result is specifically **-75% Gifts of Chaos activation cost**; it does not reduce unlock thresholds. Other scripted examples include character XP with a rank-45 targeting limit and fallback, hero capacity, uncommon/rare ancillaries, and one-time patron items whose adverse result can wound a random character. The listener iterates eligible human factions only; AI WoC factions do not receive this panel or scripted automatic roll.

### Patron and lord-specific campaign systems

#### Slaanesh: Azazel and Sigvald

Both factions can Seduce non-character enemy units on the pre-battle panel by spending Favour, within a per-battle budget and unit-count cap. Lords and heroes, quest/survival battles, and reinforcement-only participation are ineligible. Surviving seduced units return to their owner after battle unless that army is destroyed.

Diplomatic/battle contact, Slaanesh corruption, and Gifts of Slaanesh build Seductive Influence over human, elven, and Beastmen factions. Defeating an enemy lord or succeeding with a hero action can place a Gift of Slaanesh: for these WoC factions it supplies line of sight, +5 local Slaanesh corruption, a leadership penalty against Slaanesh, +8 influence per turn, and +25 Souls per turn to the giver. It is removed when the marked character defeats the gifting WoC faction, a marked hero succeeds against it, or the gifting faction is destroyed. At maximum influence an eligible non-human-controlled target can be forcibly vassalized; the installed WoC ritual costs **2,000 Souls**, has a **10-turn cooldown**, and explicitly excludes human targets.

Azazel additionally has **+80 diplomatic relations with Empire, Kislev, Cathay, and Bretonnia**, one extra Slaanesh Gift slot, and the **Sweet Sorrow** army ability. Sigvald has the Slaanesh Gift activation reduction described above. Both leaders grant their vassals Immune to Psychology and Slaanesh-corruption spread.

#### Festus

The Fecundites start with **50 Infections** and use the Nurgle Plague Cauldron with Festus-specific campaign availability. A plague is assembled from unlocked components, paid for with Infections, and applied to an owned army or settlement; Festus has no Plague Cultist target option. Infected armies and settlements spread their plague through contact and adjacency according to component spread/duration effects. Friendly carriers receive the positive half and enemies the harmful half. Every successful spread supplies the faction's +25-Souls source. Ordinary component effect values are data-driven and are not duplicated here; this access rule does not grant Nurgle's cyclical settlements or recruitment system.

Festus has one extra Nurgle Gift slot and enables **Curse of the Slug** for his armies. His vassals gain Poison Attacks and spread Nurgle corruption.

#### Valkia

Bloodletting is tracked separately for each Legion army. Victories raise its tier; after **two inactive turns**, continued inactivity begins lowering it, and the fully inactive state applies penalties. Higher tiers provide the Legion-specific battle/economy bonuses; they are not assumed to equal the main Khorne faction's bundles. Valkia also restores 35% campaign movement after her own victories, the faction restores 15% for other characters, vassals receive Frenzy and spread Khorne corruption, and captive sacrifice yields +50% Souls.

Valkia also has one extra Khorne Gift slot and enables **Horn of Khorne** for her armies.

#### Vilitch

All five actions are initially available and spend **250 Souls** each:

| Action | Cooldown | Target and result |
|---|---:|---|
| Drain Magic | 5 turns | Any army; drains up to 40 Winds and transfers part over time to Vilitch's faction leader. |
| Muddle Minds | 10 turns | A non-allied, non-self army; reduces movement, ambush defence, and leadership. |
| Spawnify | 15 turns | Any army; adds up to three Chaos Spawn. |
| Spread Corruption | 5 turns | An owned force; spreads Tzeentch corruption to its province. |
| Reveal Shroud | no action cooldown; target faction 5 turns | Any faction; reveals the shroud over its territory. |

His Teleport stance is non-interceptable and a Teleport attack is an ambush. The Changing actions use Souls, not the Tzeentch race's Grimoires. An unattached installed `show_ai_intentions` ritual row is not a sixth player action.

At high Winds of Magic, Vilitch's affected armies gain **+1 Tzeentch Authority**, **+20% experience gain for Tzeentch units**, and **+5% Daemons Reforged chance** for destroyed Tzeentch Daemons to return after battle. He also has one extra Tzeentch Gift slot, enables **Arcane Surge** for his armies, and grants vassals increased Barrier hit points plus Tzeentch-corruption spread.

#### Be'lakor

Shadow Legion starts Immortal Empires with three permanent Shadow Rifts. Its lords, armies, and heroes can traverse between open nodes; an army spends its remaining movement and retains the stance in which it entered. Other factions cannot use or destroy the nodes. Be'lakor also receives **-25% upkeep for Daemon units** and all four patron Gift slots, but no Eye of the Gods route.

Four Unholy Manifestations unlock separately by defeating an army aligned to Khorne, Nurgle, Slaanesh, or Tzeentch. Each use costs **2,000 Souls** and has a **15-turn cooldown**. Their current base outcomes are: an eight-turn Khorne combat bundle plus Bloodletters; a seven-turn Nurgle corruption bundle plus Plaguebearers; immediate Slaanesh target-army damage plus Daemonettes; or a Tzeentch-created Rift in the target army's province plus Pink Horrors. When the corresponding god is Ascendant, the Gifted unit is its Exalted version. The Rift appears in the target region rather than at an exact player-selected coordinate.

### Defeat, confederation, and legendary-character acquisition

> **9.0 disposition:** The old acquisition list is not exhaustive for Archaon's current subjugation system. See [current routing](../UPDATE_9.0_CLAIMS.md).

Only **Warhost of the Apocalypse and Shadow Legion** have the installed forced-confederation route. When either captures another WoC faction's final settlement, the settlement decision can confederate that faction; its legendary leader then enters the victor's lord recruitment pool. Defeating the lord in an ordinary field battle is not sufficient. The other six WoC factions can vassalize or destroy rivals but cannot collect their legendary lords through this rule. If the target faction has already been destroyed by someone else, no general retroactive recruitment is supplied.

The current generic legendary-character script adds these WoC routes beyond the character skill catalog:

| Character | Eligible WoC factions | Human gate | AI fallback / limitation |
|---|---|---:|---|
| Harald Hammerstorm | all eight | faction leader rank 15; one-stage mission | strongest AI WoC at turn 25 if no human WoC route |
| Blue Scribes | Vilitch, Kholek, Sigvald, Archaon, Be'lakor | leader rank 10; WoC mission chain; *Shadows of Change* entitlement | turn 30 |
| Aekold Helbrass | same five | leader rank 12; faction/campaign mission variant; free route with no current CA Account gate | turn 30 |
| Karanak | Valkia, Kholek, Archaon, Be'lakor | leader rank 16; faction/campaign mission variant | turn 25; Skarbrand is the priority AI recipient |
| Skarr Bloodwrath | Valkia only | installed two-stage *Omens of Destruction* route | turn 30 |
| Scyla Anfingrimm | Valkia, Sigvald, Kholek, Archaon, Be'lakor | leader rank 12; two-stage *Omens of Destruction* route | turn 30 |
| Styrkaar | Azazel, Sigvald, Kholek, Archaon, Be'lakor | leader rank 11; two-stage *Tides of Torment* Slaanesh route | turn 30 |
| Beorg Bearstruck | all eight | leader rank 8; two-stage *Tides of Torment* Norsca route | turn 20; Sayl is the priority AI recipient |

Eligibility does not bypass the named entitlement. Mission completion recruits the unique character once; losing or declining a branch does not create duplicate copies.

### Campaign and victory applicability

> **9.0 disposition:** The requirements below are historical. Use the current atlas objective_reference with variant_key and its recorded runtime boundaries. See [current routing](../UPDATE_9.0_CLAIMS.md).

All eight factions have Immortal Empires short, long, Domination, and optional ultimate-crisis routes encoded as faction missions; control through vassals/allies counts only where that objective says so. Archaon, Be'lakor, Kholek, and Sigvald are Immortal-Empires-only playable factions in this snapshot.

Azazel, Festus, Valkia, and Vilitch are additionally playable in Realm of Chaos and replace the Ursun race with **Path to Zanbaijin**. Cumulative positive Souls gains—not current balance and not expenditure—advance thresholds at **10,000 / 30,000 / 50,000**. They award **2 / 2 / 3 Rift Sigils** and progressively open the network. The displayed objective is **eight open rifts**: the free home rift plus seven nodes claimed with those Sigils. Traversing an owned node costs **250 Souls**; claiming an unowned node spends one Sigil. Reaching all three thresholds and completing the eight-rift network unlocks that faction's Zanbaijin final battle. Victory completes its narrative objective. This route is specific to the four Champions and must not be applied to the other four factions.

## Faction coverage

- **Warhost of the Apocalypse** — `wh_main_chs_chaos`: all shared systems including Eye and all patron branches; +1 Undivided Gift slot; per-vassal research, diplomacy, and Souls; one of the two factions with forced WoC confederation; Immortal Empires route; Harald, Scribes, Aekold, Karanak, Scyla, Styrkaar, and Beorg eligibility.
- **Shadow Legion** — `wh3_main_chs_shadow_legion`: all race-wide systems **except Eye**, with all patron branches; all four patron Gift slots, -25% Daemon upkeep, and unlimited Gifted units per army; Shadow Rifts, four manifestations, and the ten-turn human-lord conversion; forced confederation; Immortal Empires route; the same unique-character set as Archaon.
- **Heralds of the Tempest** — `wh3_dlc20_chs_kholek`: all shared systems including Eye and all patron branches; +1 Undivided Gift slot; Dragon Ogre pool capacity and +5% weapon strength/mass/armour per vassal; no forced confederation; Immortal Empires route; Harald, Scribes, Aekold, Karanak, Scyla, Styrkaar, and Beorg.
- **The Decadent Host** — `wh3_dlc20_chs_sigvald`: all shared systems including Eye and all patron branches with Slaanesh corruption; Seduction, Gifts/Influence, -25% Slaanesh Gift activation cost, patron vassal effects, and forced vassalization; no forced confederation; Immortal Empires route; Harald, Scribes, Aekold, **Scyla**, Styrkaar, and Beorg.
- **The Ecstatic Legions** — `wh3_dlc20_chs_azazel`: Undivided/Slaanesh shared branches including Eye; +1 Slaanesh Gift slot, Sweet Sorrow, +80 relations with Empire/Kislev/Cathay/Bretonnia, patron vassal effects, Seduction, Gifts/Influence, and forced vassalization; IE plus Zanbaijin; Harald, Styrkaar, and Beorg.
- **The Fecundites** — `wh3_dlc20_chs_festus`: Undivided/Nurgle shared branches including Eye; +1 Nurgle Gift slot, Curse of the Slug, patron vassal effects, Infections, and Plague Cauldron without Plague Cultists; IE plus Zanbaijin; Harald and Beorg.
- **Legion of the Gorequeen** — `wh3_dlc20_chs_valkia`: Undivided/Khorne shared branches including Eye; +1 Khorne Gift slot, Horn of Khorne, Bloodletting, patron vassal effects, movement restoration, captive-Souls multiplier, and Exalted Bloodletter upgrade; IE plus Zanbaijin; Harald, Karanak, Skarr, Scyla, and Beorg.
- **Puppets of Misrule** — `wh3_dlc20_chs_vilitch`: Undivided/Tzeentch shared branches including Eye; +1 Tzeentch Gift slot, Arcane Surge, high-Winds and patron-vassal effects, five 250-Souls Changing actions, and Teleport; IE plus Zanbaijin; Harald, Scribes, Aekold, and Beorg.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`; `data/faction_guides/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all eight files under `data/economy/factions/warriors_of_chaos/`.
- `data/unit_stats/normalized/warriors_of_chaos__wh3__8.1.1__ultra.csv`; typed `unit_rosters` and `unit_abilities` lookups; current source localization exports for resources, rituals, initiatives, campaign groups, dilemmas, and UI replacement text.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 33 files under `data/skill_trees/characters/warriors_of_chaos/`.
- Established production form from the three authorized pilots: `bretonnia.md`, `chaos_dwarfs.md`, and `tzeentch.md`.

### Installed vanilla game files and stable records

Read sequentially through `scripts/rpfm-call-locked.ps1` from the merged vanilla CA packs (`PackFile`; literal `pack_key=$CA`; no save/edit operation):

- `script/campaign/wh3_dlc20_campaign_chs_eye_of_the_gods.lua` — human turn-start affordability, Champion/default dilemma map, four payload pools, progress cost, XP/capacity/ancillary/item behavior.
- `script/campaign/wh3_dlc20_campaign_chs_dark_authority.lua` — character event listeners and lord-plus-embedded-hero recalculation.
- `script/campaign/wh3_dlc20_campaign_chs_vassal_dilemmas.lua` — human-only 7% roll, vassal/character/region selection, four dilemma families and scripted rewards.
- `script/campaign/wh3_dlc20_campaign_norscan_vassal_personality.lua` — faction sets, vassal-state switch, IE/RoC personalities and special restoration cases.
- `script/campaign/wh3_campaign_belakor.lua` — target filter, battle/hero-action application, ten-turn marker, removal conditions, original-character death, and level-21 replacement.
- `script/campaign/wh3_main_legendary_characters.lua` — every character row in the acquisition table, faction overrides, ranks, campaign mission variants, DLC requirements, and AI turns/priorities.
- `db/rituals_tables/data__`, `db/campaign_group_rituals_tables/data__`, and `db/resource_cost_pooled_resource_junctions_tables/data__` — Eye, Vilitch actions, forced Slaanesh vassalization, Gifts/Path costs, Rift traversal, manifestation cost, targets and cooldowns.
- `db/campaign_group_pooled_resources_tables/data__` — starting Souls/Eye, patron Authorities/spend counters, Champion Rift counters, Festus Infections, and Be'lakor manifestation uses.
- `db/campaign_features_tables/data__` — the WoC additional-army-upkeep/Supply Lines exception, Vilitch diplomatic manipulation, Teleport interception, and ambush flags.
- `db/campaign_group_members_tables/data__` — faction-specific feature groups, Authority bands, Souls target groups, WoC occupation/captive relation groups, Norscan-vassal feature, and corruption identity relations.
- `db/effect_bundles_to_effects_junctions_tables/data__` — leader Gift slots/costs, patron vassal effects, Azazel diplomacy, Champion army abilities, Vilitch high-Winds effects, Be'lakor Daemon upkeep, and Festus's Gift-of-Choice value.
- `db/mercenary_pools_tables/data__`, `db/mercenary_pool_to_groups_junctions_tables/data__`, `db/faction_to_mercenary_set_junctions_tables/data__`, `db/mercenary_unit_groups_tables/data__`, and `db/unit_upgrade_groups_tables/data__` — separate Warband/Gifted pools, faction substitutions, capacity/replenishment relations, and upgrade families.
- Installed mission/incidents/localization for Path to Zanbaijin — 10k/30k/50k stages, 2/2/3 Sigils, the eight-open-rifts objective, four-Champion survival missions, and the free-home-plus-seven-claims relation.
- Current localization tables for `pooled_resources`, `effects`, `effect_bundles`, `rituals`, `initiatives`, `initiative_sets`, `dilemmas`, `cdir_events_dilemma_choice_details`, and `ui_text_replacements` — operative descriptions and rank/choice states.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101) — current installed patch, Norscan homeland repair, Raise the Banners repair, and WoC fixes.
- Creative Assembly, [Update 6.0 content availability](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0) — current Scyla and Skarr faction eligibility, including Sigvald's Scyla route.
- Creative Assembly, [Patch 7.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/93-total-war-warhammer-iii-7-1-patch-notes) — current WoC fixes and the activation-cost definition for Festus's Gift-of-Choice outcome.
- Creative Assembly/Steam, [Champions of Chaos](https://store.steampowered.com/app/1824060/Total_War_WARHAMMER_III__Champions_of_Chaos/) and the [Warriors of Chaos rework deep dive](https://store.steampowered.com/news/posts/?enddate=1659103670&feed=steam_community_announcements) — official mechanic definitions and branch intent.
- Creative Assembly, [Patch 4.2 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/2-total-war-warhammer-iii-patch-4-2-0); installed-era [Update 2.1 notes mirror](https://steamdb.info/patchnotes/9459387/) — legendary-character availability, human/elf subjugation, and Archaon/Be'lakor final-settlement confederation.
- Secondary discovery and hostile-omission layer: [Warriors of Chaos race reference](https://totalwarwarhammer.fandom.com/wiki/Warriors_of_Chaos_(Total_War:_Warhammer_III)), its eight faction and mechanic pages, and the [Archaon campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2940472576). These supplied leads and readable UI behavior; installed scripts/tables and current official notes control conflicts.

### Evidence limitations

- Task A's later occupation-table request reset the local RPFM endpoint (`ECONNRESET`, then `ECONNREFUSED`). During the independent Task B pass, the exact Champion narrative-script request and a later attempt to reformat the already-decoded legendary-character registry each encountered `ECONNREFUSED`; both returned no content and performed no mutation. The endpoint was restarted once per incident and the audit pivoted to installed DB/localization and current official sources rather than repeatedly requesting the same path.
- Settlement claims are therefore restricted to decoded feature/group evidence, the vassal scripts, current CA 8.1 notes, and explicit uncertainty; no unsupported complete Dark-Fortress-to-tribe list or dead-tribe recreation rule is asserted. Exact post-Zanbaijin node counts and internal save/restore implementation were removed because the independent narrative-script read failed.
- Launch rework material predates Update 2.1's forced-confederation change. The installed-era rule supersedes the launch statement that WoC confederation was unavailable.
- Announced post-8.1 **Lords of the End Times / 9.0** Archaon mechanics are later than build 24237342. Defeat-based pan-Chaos confederation, devastation, and a playable Archaon endgame are intentionally excluded.
- Authority has installed negative effect-bundle records through -5 and positive records through 10, while some secondary UI descriptions present 0–10 as the normal attainable range. This guide states the data records and effect direction but does not invent an engine clamp.
