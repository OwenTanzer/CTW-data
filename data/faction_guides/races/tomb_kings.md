# Tomb Kings campaign mechanics guide

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Specific 9.0 corrections:** See [targeted historical-guide errata](../COMPATIBILITY_9.0.md#targeted-historical-guide-errata) before using rite cooldowns, Books ownership, Krell or Vlad/Isabella role descriptions below. Other claims retain their stated historical scope.

Snapshot: Total War: WARHAMMER III 8.1.1, Steam build 24237342. The installed playable catalog contains four Tomb Kings factions, all in the Immortal Empires (`main_warhammer`) branch.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy catalog already records the constructible building levels for Khemri, Exiles of Nehek, Court of Lybaras, and Followers of Nagash, including ordinary construction inputs, income, Growth, control, trade output, and broad recruitment modifiers. The unit catalog records the 44-unit Tomb Kings roster, unit statistics, abilities, and exact faction permissions, including Arkhan's four faction-exclusive Vampire Counts-derived units. The character catalog records Settra, Khatep, Khalida, Arkhan, generic Tomb Kings, six Dynasty Kings, four Liche Priest lores, Tomb Princes, Necrotects, and Ptra's Necrotect with their ordinary skill-tree effects.

This guide therefore does not repeat building rows, unit statistics, combat abilities, ordinary skills, magic-item statistics, or banner effects. It covers the campaign systems and lifecycle rules those standardized rows do not express: the zero-cost/cap economy, army and character capacity, Canopic Jar transactions, Mortuary Cult operations, Dynasty acquisition, rites, Books of Nagash, Dune Restoration, confederation restrictions, scripted human/AI branches, and current campaign-specific exceptions.

## Mechanically relevant material not captured elsewhere

### Zero-cost armies, dynamic unit capacity, and post-battle income

**Applicability:** race-wide for all four playable factions unless a faction exception is stated.

Tomb Kings pay no ordinary recruitment cost or upkeep for Lords, Heroes, or armies. The race bundle applies effectively total reductions to both categories, while the campaign feature `additional_army_upkeep` is disabled; additional armies therefore do not create Supply Lines. The same feature set removes the normal background-income bonus. Settlement income, trade, sacking, post-battle rewards, and other explicit receipts must support construction and paid transactions even though field armies are free. The race also constructs one battering ram or two siege towers per siege-equipment step.

That race bundle also offsets the engine's default Hero capacity by one, leaving zero race-wide base capacity before faction, technology, building, Book, or Mortuary Cult additions. It reduces magic-item drop chance from battle by 25%. Its hidden Lord-replacement-rank modifier is `-1000`; this suppresses ordinary rank inheritance when a Lord is replaced after the engine clamps the result rather than producing a negative-rank Lord.

Military buildings add faction-wide recruitment capacity for specified unit pools. Those additions are live building effects, not permanent unlock counters: upgrading, losing, converting, or demolishing the source immediately recalculates capacity. Existing units are not deleted when capacity falls below the number already fielded, but an over-cap pool cannot replace losses or recruit another affected unit until capacity again exceeds its fielded count. The building catalog remains the source for individual structures; this is the nonstandard relationship between those structures and the roster.

The relationship also applies to Arkhan's exclusive chain. Followers of Nagash's Burial Mound supplies caps for Dire Wolves, Fell Bats, and Crypt Ghouls at its first level, then larger caps plus Hexwraith capacity at its second. Those units are free like the rest of the faction roster but still consume their building-derived pool capacity.

Patch 6.3 removed the former captive-option Jar payment. Installed reward routing has two distinct records that must not be added together: the generic money-equivalence mapper for the four playable faction keys returns 25% of nominal value as treasury plus Jars equal to 2% of nominal value, while the battle-specific campaign-group relation implements the Jar side from destroyed-unit combat potential. For battle input `V`, its installed curve is `(0.000100000005 × V) + (0.23 × V)`, clamped between 0 and 1,000 Jars per resolution. This automatic battle-value income is separate from the chosen post-battle option.

The three current chosen post-battle options carry no Jar transaction and apply for two turns:

| Option | Captive outcome | Temporary output |
|---|---|---|
| Inscribed Time | Kill | +50 unit experience to the force and +5 Growth in its province. |
| Bind Souls | Enslave | +8% replenishment for the force. |
| Endless March | Release | +20% campaign movement for the force. |

Settlement capture is separate again. The standard **Occupy** option directly carries an absolute +50-Jar transaction. Tomb Kings otherwise use the ordinary colonise, sack, resettle, do-nothing, raze, and occupy set rather than a bespoke extra occupation choice.

Campaign difficulty applies a Tomb Kings-specific second layer. Human sacking and post-battle loot modifiers are 0% on Easy, -20% on Normal, -50% on Hard, -60% on Very Hard, and -70% on Legendary. AI Tomb Kings receive research modifiers of +5%, +10%, +15%, +20%, and +25% respectively; their global/local recruitment-slot adjustments are -2/-2, -2/-1, -1/0, 0/0, and +1/0. The setup script applies these permanent bundles to non-quest Tomb Kings factions according to whether each faction is human or AI.

### Army capacity, Dynasties, and scripted characters

Army capacity begins at one. Completing each of the six main Dynasty technologies adds one, and the Mortuary Cult army-capacity transaction adds another permanent slot per purchase. The installed script recognizes at most 30 purchased capacity bundles. Its pre-modifier base cost is 10,000 treasury plus 800 Canopic Jars. Each prior use adds 75% of each base component rather than compounding, so the schedule begins 10,000/800, 17,500/1,400, and 25,000/2,000 treasury/Jars. Khatep's -20% crafting-cost modifier applies to each purchase after that use-based schedule is calculated.

Book 5 adds a separate permanent army slot. Arkhan's Followers of Nagash campaign starts with another slot from its leader bundle. These are outside the script's base-plus-Dynasties-plus-30-purchases calculation. A Mortuary Cult confederation explicitly grants no army capacity, so absorbing armies can leave the faction over cap; the armies persist, but another Lord cannot be created until the live count is below the live cap.

Each Dynasty has a follow-on named-King technology costing 500 Jars. When a human faction completes it, the script adds the corresponding immortal Lord to the recruitment pool:

| Dynasty | Named King |
|---|---|
| First | Wakhaf |
| Second | Rakhash |
| Third | Thutep |
| Fourth | Lahmizzash |
| Fifth | Setep |
| Sixth | Alkhazzar II |

The seven Herald technologies cost 500 Jars by family and grant their exact named Herald follower to a human faction. Hero-unlock and ordinary Dynasty-priced nodes use the 250-Jar family; Patronage nodes use the 500-Jar family. The named-King and Herald listeners are human-only. An AI faction can receive the ordinary effects of technology it researches, but does not receive the scripted named King or Herald ancillary from these listeners.

The battle ability sequence normally reaches its terminal Realm of Souls reward once. Researching **Proclamation of the First Dynasty** permits the sequence to cycle again. This guide records that campaign unlock only; the ability thresholds and battlefield effects belong to the unit/ability layer.

### Canopic Jars, Mortuary Cult, and Nehekharan Decrees

Every Tomb Kings campaign-group member starts with 100 Canopic Jars. Further Jars come from the battle conversion above, the +50 Occupy transaction, buildings and character effects already present in the catalogs, events and missions, Book rewards, and the Great Incantation of Geheb. They are spent by technology families, the Mortuary Cult, confederation purchases, and Decrees. Ordinary item crafting can also require treasury and owned trade resources. The installed magic-item recipes consume 100, 250, 500, or 750 Jars according to recipe; their ritual records have no cooldown, but ingredient availability and ancillary ownership rules still gate actual crafting.

The four **Legions of Legend** are one-use Mortuary Cult unlocks, not direct unit spawns:

| Unlock | Treasury | Canopic Jars |
|---|---:|---:|
| The Flock of Djaf (Carrion) | 250 | 100 |
| Usirian's Legion of the Netherworld (Nehekharan Warriors) | 500 | 250 |
| Storm Riders of Khsar (Nehekharan Horsemen) | 750 | 500 |
| Venom Knights of Asaph (Necropolis Knights) | 1,250 | 750 |

Each removes that unit's event-recruitment restriction for the human performing faction. The ritual records use a 9,999-turn cooldown, making each unlock effectively one-time. The script deliberately performs this release only for a human faction; AI completion does not run the Legion-unlock branch. Once released, recruitment and replacement follow the event-restricted Regiment-of-Renown pool rather than adding a unit directly to an army.

Three repeatable capacity recipes add one permanent Hero cap. Tomb Prince, Liche Priest, and Necrotect capacity each begin at 2,500 treasury plus 250 Jars. Each recipe independently adds 50% of both base components after every use: 2,500/250, 3,750/375, 5,000/500 treasury/Jars, and so on. There is no decoded use cap.

Five new non-Settra banners—Centuries' Sigil, Cursing Word, Khsar's Fury, Icon of the Sacred Eye, and Ualatp's Order—cost 500 Jars each and have zero ritual cooldown, so they can be crafted repeatedly subject to ownership rules. Khemri alone receives the Royal Standard of Settra recipe; it costs 1,000 Jars and has the 9,999-turn one-use cooldown. Their assigned combat effects are not repeated here.

Three province-targeted **Nehekharan Decrees** are initially available to the race. They have no faction cooldown, but their payload blocks another Decree in the target province while active:

| Decree | Cost | Output and lifecycle |
|---|---:|---|
| Scholarly Purity | 500 Jars | Five turns: +10% research rate, +2 control, and local corruption disabled across the province. |
| Rightful Reclamation | 750 Jars | Five turns: +2 local recruitment capacity and province garrisons receive the extended attack range used to sally against besiegers. |
| Heed the Will | 500 Jars | Immediate 2,500 treasury; its Decree-block payload lasts one turn. |

### The four Great Incantations

Human factions begin with the rites script-locked until their individual event gates are met; AI factions are not passed through that human-only lock setup. The rites spend treasury but no Canopic Jars. A human standard-rite completion also establishes the shared five-turn global rite cooldown.

| Rite | Treasury | Human unlock | Own cooldown | Output |
|---|---:|---|---:|---|
| Great Incantation of Khsar | 3,000 | Own at least three settlements; the acquisition event rechecks total owned regions | 20 turns | Five turns of faction-territory sandstorms, Sand Veil, immunity to sandstorm attrition, and +50% ambush success for faction armies. Foreign armies in the affected territory suffer the storm. |
| Great Incantation of Geheb | 2,000 | Construct a Nehekharan Citadel, or occupy a region already containing its first level | 25 turns | Ten turns of +25 Growth, -25% construction time, +25 Jars per turn, and Tombswarm for faction armies. |
| Great Incantation of Tahoth | 2,500 | Field more than 19 units across non-garrison military forces | 10 turns | Permanently releases Casket of Souls recruitment for that faction; for five turns, new units receive +2 rank and Lords +3 rank. It removes the Casket's restriction rather than inserting a unit into an army. |
| Great Incantation of Ptra | 4,000 | Perform a character- or garrison-target action with a Necrotect-type engineer | 15 turns | Spawns Ptra's Necrotect with full action points at the faction leader's force, another eligible force, or an unsieged owned settlement. Its unique action colonizes a ruin directly at tier 3 and kills the Necrotect. |

Ptra's spawn helper has an exact edge case: if the faction has no suitable leader/force and no unsieged settlement, it has no final spawn target and produces no agent. The Ptra agent is marked as a transient subtype and cannot be saved as a normal recruitable pool character. Tahoth's unlock is permanent after the first completion even when its temporary rank bundle expires.

### Books of Nagash and Dune Restoration

> **9.0 disposition:** The old ownership and reward lifecycle below is historical; do not present it as current Books behavior. See [current routing](../UPDATE_9.0_CLAIMS.md).

**Applicability:** scripted for eligible human participants in Immortal Empires. For this guide, the participants are all four playable Tomb Kings factions. AI Tomb Kings receive no Book missions or Book rewards from the setup script.

At new-game setup, each Tomb Kings human receives eight permanent-reward missions. In single-player, the faction has a bespoke set of four region targets and four rogue-army targets. The script randomly permutes those eight targets over mission IDs 1-8, while reward bundle 1 always belongs to mission 1, reward 2 to mission 2, and so forth. A reward is therefore not tied to one fixed location across campaigns.

Region objectives require the target region and explicitly ignore allied ownership. Rogue objectives require victory against the exact spawned force. A completed Book remains a permanent faction bundle if the captured region is later lost. The first eligible human processed at setup spawns the shared rogue forces. If an AI becomes involved in a war with a Book rogue army, the failsafe makes peace and locks diplomacy; a human declaration releases that army from its patrol. These rules prevent an AI war from making a Book unobtainable.

The single-player target pools are:

| Faction | Region targets | Rogue-army targets |
|---|---|---|
| Khemri | Lahmia; Skavenblight; Karak Eight Peaks; Black Pyramid of Nagash | Black Creek Raiders; Eyes of the Jungle; Dwellers of Zardok; Shrouded Wanderers of Undeath |
| Followers of Nagash | Temple of Skulls; Skavenblight; Karak Eight Peaks; Black Pyramid of Nagash | Black Creek Raiders; Eyes of the Jungle; Dwellers of Zardok; Pilgrims of Myrmidia |
| Court of Lybaras | Lost Plateau; Sartosa; Castle Drakenhof; Black Pyramid of Nagash | Black Creek Raiders; Eyes of the Jungle; Dwellers of Zardok; Pilgrims of Myrmidia |
| Exiles of Nehek | Couronne; Hexoatl; Ancient City of Quintex; White Tower of Hoeth | Black Creek Raiders; Eyes of the Jungle; Dwellers of Zardok; Pilgrims of Myrmidia |

Multiplayer replaces all faction lists with one deterministic pool: Altdorf, Hexoatl, Karaz-a-Karak, White Tower of Hoeth, Black Creek Raiders, Eyes of the Jungle, Dwellers of Zardok, and Pilgrims of Myrmidia. When an eligible human completes a Book mission, the same mission key fails for every other eligible human. The Books are therefore competitive in a multi-human campaign rather than duplicated rewards.

Every collectible Book 1-8 permanently adds 3 percentage points to **Dune Restoration** chance and 2 percentage points to the HP of a restored destroyed Construct. No separate base chance bundle was located; collecting all eight reaches 24% chance and 16% restored HP. Non-Construct units are ineligible. Book 9 does not add Dune Restoration.

The other permanent or triggered rewards are:

| Book | Tomb Kings reward |
|---|---|
| 1 | +1 capacity for every Hero type, -50% Hero-action cost, +10% Hero-action success. |
| 2 | +20% trade tariffs; Gold, Gems, and Marble resource regions are revealed immediately and refreshed in shroud at each human turn start. |
| 3 | Sandstorm-attrition immunity. Sacking or occupying a settlement refreshes a five-turn +15% replenishment bundle on the acting army and creates a five-turn land storm in that region. |
| 4 | +3 Lord recruit rank and -1 wound-recovery turn; mission completion also makes a one-time grant of 1,500 Jars and releases the Necrosphinx Regiment of Renown. |
| 5 | +1 army capacity and +5 shared capacity for Tomb Guard, Tomb Guard (Halberds), and Skeleton Chariots. |
| 6 | Unlocks Liche Priest (Shadows) recruitment and adds +10 Winds of Magic reserve capacity. |
| 7 | +50 Jars per turn and +10% research rate. |
| 8 | Adds bonuses to the Tomb Kings commandment set: construction cost -10%, corruption -1, recruit rank +1, replenishment +10%, ambush success +8%, campaign movement +5%, melee defence +3, Growth +8, tax +3%, and control +3, each on the commandment to which its effect is assigned. |
| 9 | Followers of Nagash only: enables the enhanced Vampire Counts-derived roster permission. |

Arkhan's Book 9 scripted mission auto-completes at setup for Followers of Nagash and fails for everyone else. It is an additional starting ownership branch, not a ninth world target. The current Immortal Empires victory definitions do not count collected Books.

### Confederation and diplomacy restrictions

Tomb Kings do not have symmetric ordinary confederation. Their battle route listens for a Tomb Kings-versus-Tomb Kings battle in which the defeated faction leader commanded the losing force. The target must be AI, must not be a human player's vassal, and must pass the script's target list. Khemri, Followers of Nagash, and the named non-playable/quest factions are excluded, leaving AI Exiles of Nehek and Court of Lybaras as the two playable Legendary Lord targets. A human victor receives the confederation dilemma; an AI victor directly force-confederates a valid target.

The resulting playable-leader matrix is intentionally asymmetric:

| Player faction | Defeat-and-confederate target | Mortuary Cult target |
|---|---|---|
| Khemri / Settra | Khatep or Khalida | Khalida |
| Exiles of Nehek / Khatep | Khalida | Khalida |
| Court of Lybaras / Khalida | Khatep | Khatep |
| Followers of Nagash / Arkhan | Khatep or Khalida | none |

Each Mortuary Cult confederation costs 50,000 treasury plus 2,500 Jars and has the 9,999-turn one-use cooldown. If the named target faction is alive, it is confederated; if already destroyed, the Legendary Lord is still added to the Lord pool. The transaction explicitly adds no army slot. When another relevant Tomb Kings faction is human, setup locks both Cult confederation rituals, preventing that route from consuming a human participant.

Three diplomacy states are faction-specific. Court of Lybaras begins permanently unable to make peace with the Lahmian Sisterhood. Followers of Nagash begins with -60 relations with Tomb Kings and +40 with Vampiric Undead; these values do not create an alternate ordinary confederation route. Khemri cannot be made anyone's vassal: campaign setup disables every faction's vassal action against Settra's faction.

### Entombed stance and recruitment access

**Entombed Beneath the Sands** consumes 50% campaign movement. While active, the army can replenish in foreign territory, is immune to all campaign attrition, has +75% ambush defence, gains Vanguard Deployment and Sand Veil, and may recruit while encamped. Tomb Kings global and allied recruitment are available only to a garrisoned army or an army in this stance. This is a recruitment gate as well as a movement/combat posture.

### Faction and Immortal Empires exceptions

> **9.0 disposition:** Historical Arkhan access descriptions are not exhaustive; consult current roster permissions and their notes. See [current routing](../UPDATE_9.0_CLAIMS.md).

The following starting effects alter the common systems and are not ordinary roster rows:

- **Khemri / Settra:** +1 Tomb Prince capacity, -1 turn to construction time, and +20 Growth. Khemri alone can craft the one-use Royal Standard of Settra. Its short-victory faction objective requires eliminating Followers of Nagash, Volkmar's Cult of Sigmar, and Mannfred's Vampire Counts.
- **Exiles of Nehek / Khatep:** +1 Liche Priest capacity, +25% character experience, a minimum +10 Winds of Magic reserve contribution, and -20% Mortuary Cult crafting costs. Khatep's starting named agent receives 3,000 scripted XP. Its short victory has a human-only counter requiring all four one-use Legions of Legend to be awakened through the Mortuary Cult.
- **Court of Lybaras / Khalida:** +1 Liche Priest capacity, +15% research rate, +4 control, and +10 diplomatic relations, plus the permanent Lahmian Sisterhood war restriction. Its short-victory target list is the Silver Host, Necrarch Brotherhood, Mannfred's Vampire Counts, and Sires of Mourkain; its long objective additionally targets Followers of Nagash.
- **Followers of Nagash / Arkhan:** +1 Tomb Prince capacity, +1 army capacity, -60 Tomb Kings relations, +40 Vampiric Undead relations, Book 9, and the enhanced Vampire-derived unit permission represented in the unit catalog. Its short-victory faction objective requires eliminating Khemri and Court of Lybaras.

The shared Immortal Empires long objective requires all eleven listed regions: Black Pyramid of Nagash, Black Tower of Arkhan, Khemri, Wizard Caliph's Palace, Al Haikk, Numas, Ka-Sabar, Galbaraz, Karag Orrud, Lahmia, and Rasetra. It also requires all seven special pyramids: Pyramid of King Alcadizaar, Pyramid of King Amenemhetum, Pyramid of King Khatep, Pyramid of King Phar, Great Pyramid of Settra, Pyramid of Prince Tutankhanut, and Vault of Nagash. Khalida's Followers-of-Nagash target is an additional faction long objective. Collected Books do not count toward either victory tier.

Khemri also has a bespoke opening narrative target—Numas and the Land of the Dead province—but this changes mission routing rather than defining another persistent mechanic. No playable Realm of Chaos or Vortex branch for these four factions appears in the installed catalog snapshot; legacy Black Pyramid finale rules and the unattached `wh2_dlc09_tomb_king_victory` bundle are therefore not carried into this guide.

## Faction coverage

- **Khemri** (`wh2_dlc09_tmb_khemri`): all race-wide systems; Settra's growth/construction/Tomb Prince effects and immunity to being vassalized; Royal Standard recipe; both defeat routes, Khalida-only Cult route; Khemri Book pool; current Immortal Empires opening and victory targets.
- **Exiles of Nehek** (`wh2_dlc09_tmb_exiles_of_nehek`): all race-wide systems; Khatep's Liche Priest, XP, Winds and crafting discount; Khalida defeat/Cult routes; Khatep Book pool; four-Legion short-victory counter and starting-agent XP.
- **Followers of Nagash** (`wh2_dlc09_tmb_followers_of_nagash`): all race-wide systems; Arkhan's extra army slot, diplomacy, exclusive building-cap relationship and cataloged roster; automatic Book 9; defeat routes to Khatep/Khalida but no Cult confederation; Arkhan Book pool and current victory target.
- **Court of Lybaras** (`wh2_dlc09_tmb_lybaras`): all race-wide systems; Khalida's Liche Priest/research/control/diplomacy effects and Lahmian no-peace state; Khatep defeat/Cult routes; Khalida Book pool and current victory targets.

No additional faction-exclusive resource panel, Legendary Hero acquisition chain, foreign-slot lifecycle, climate/Growth replacement, or bespoke extra occupation option was located for the four cataloged factions. Differences confined to buildings, roster permissions, combat statistics, ordinary control/corruption bands, or ordinary skills remain in the standardized catalogs.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all four files under `data/economy/factions/tomb_kings/`.
- `data/unit_stats/normalized/tomb_kings__wh3__8.1.1__ultra.csv` and the typed unit/ability lookups.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 18 Tomb Kings character files.
- Current source exports under `data/economy/source_exports/db/`, `data/skill_trees/source_exports/db/`, and `data/unit_stats/source_exports/text/db/`.

### Installed vanilla game files inspected through RPFM

- Scripts: `script/campaign/wh2_dlc09_tomb_kings.lua`, `script/campaign/wh2_dlc09_dynasty_tree.lua`, `script/campaign/wh2_dlc09_books_of_nagash.lua`, `script/campaign/wh2_dlc09_books_of_nagash_locations.lua`, `script/campaign/wh2_dlc09_books_of_nagash_effects.lua`, `script/campaign/wh2_campaign_rites.lua`, `script/campaign/wh_campaign_ror_recruitment.lua`, `script/campaign/wh3_campaign_subjugation.lua`, `script/campaign/wh3_campaign_payload_remapping.lua`, `script/campaign/wh_campaign_setup.lua`, `script/campaign/main_warhammer/victory_objectives.lua`, and `script/campaign/main_warhammer/wh3_ie_narrative_events.lua`.
- Tables: `db/campaign_features_tables/data__`, `db/faction_groups_tables/data__`, `db/campaign_group_pooled_resources_tables/data__`, `db/campaign_group_post_battle_looted_pooled_resources_tables/data__`, `db/campaign_post_battle_captive_options_tables/data__`, `db/pooled_resource_factor_junctions_tables/data__`, `db/culture_settlement_occupation_options_tables/data__`, `db/campaign_stance_effects_junctions_tables/data__`, `db/rituals_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/resource_costs_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, `db/effect_bundles_to_effects_junctions_tables/data__`, `db/building_effects_junction_tables/data__`, `db/technologies_tables/data__`, `db/faction_sets_tables/data__`, and `db/faction_set_items_tables/data__`.
- Stable keys included the four playable faction keys, six Dynasty Lord subtype keys, `wh2_dlc09_tmb_necrotect_ritual`, `tmb_canopic_jars`, `wh2_dlc09_ritual_tmb`, `wh2_dlc09_feature_tomb_kings`, `wh2_dlc09_books_of_nagash_1` through `_9`, `wh3_main_tmb_confederate`, and all linked Tomb Kings ritual families.

All installed-pack calls were sequential and read-only through `scripts/rpfm-call-locked.ps1`, using source `PackFile` and the literal `$CA` merged-pack placeholder. No pack was edited or saved.

### Web grounding

- Creative Assembly Patch 8.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes
- Creative Assembly Hotfix 8.1.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-total-war-warhammer/threads/14865-total-war-warhammer-iii-hotfix-8-1-1
- Creative Assembly Patch 6.3 developer blog: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/77-total-war-warhammer-iii-%E2%80%93-patch-6-3-dev-blog
- Creative Assembly Patch 6.3 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/78-total-war-warhammer-iii-patch-notes-6-3Total
- Creative Assembly Hotfix 6.3.1: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-total-war-warhammer/threads/11329-hotfix-6-3-1-available-now-as-steam-beta
- Official Rise of the Tomb Kings DLC page: https://store.steampowered.com/app/617870/Total_War_WARHAMMER_IIRise_of_the_Tomb_Kings/?l=english
- Official Total War Academy campaign overview: https://academy.totalwar.com/tomb-kings-campaign-tactics/
- Official Total War Academy leader overview: https://academy.totalwar.com/tomb-kings-legendary-lords/
- Honga current faction data was used only as a discovery aid: https://www.honga.net/totalwar/en/warhammer3/factions/wh2_dlc09_tmb_exiles_of_nehek

### Evidence limitations

Current installed help text and resource relations confirm that ordinary item recipes may combine treasury, trade resources, and Jars. Item-by-item treasury/trade-resource quantities are deliberately not asserted because ordinary magic-item recipes and statistics are outside this guide's catalog boundary; the campaign relationships and Jar tiers are retained.

The post-battle pooled-resource table exposes its formula fields and 1,000 cap, but final integer rounding of combat-potential input is engine-bound. Dynamic over-cap retention, event-restricted unit replenishment, and the hidden `-1000` replacement-rank clamp are also partly executable behavior. The guide states only the behavior corroborated by installed relations and official material, without inventing hidden rounding, timing, or negative replacement ranks.
