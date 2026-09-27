# Skaven campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Specific 9.0 corrections:** See [targeted historical-guide errata](../COMPATIBILITY_9.0.md#targeted-historical-guide-errata) before using rite cooldowns, Books ownership, Krell or Vlad/Isabella role descriptions below. Other claims retain their stated historical scope.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Skaven | `race_slug=skaven` | **Playable factions:** 6

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The six faction economy CSVs already enumerate enabled constructible settlement and Under-City building levels and the standardized fields they can represent: base costs and times, tiers, simple prerequisites, unconditional outputs, recruitment access, and broad recruitment/upkeep modifiers. Conditional discoverability, spread, pooled-resource transactions, and scripted campaign behavior are not ordinary economy columns. The normalized unit file and typed lookups already describe Skaven roster permissions, unit statistics, abilities, attributes, weapons, projectiles, and mounts. The character files already contain the skill trees for all six legendary lords, Ghoritch, the ritual agents, and every generic Skaven lord and hero. Those records are not repeated here.

This guide covers the campaign state machines and exceptions needed to interpret those catalogs: Food, Menace Below, hidden settlements, Under-Cities, campaign movement, loyalty, plague transmission, ritual-agent availability, the four DLC faction systems, Ghoritch and Iyann Rocksburrow, Clan Mors at Karak Eight Peaks, and Clan Rictus's scripted triggers.

## Mechanically relevant material not captured elsewhere

### Food

**Applicability:** all six playable factions. Clan Mors has a Menace Below price exception; Clan Moulder has additional laboratory spends.

The shared Food resource starts at **52** and normally loses **1 per owned region** and **1 per army** each turn. Battles, sacking, raiding, post-battle choices, and buildings provide Food; the individual building values remain in the economy catalog. The Eat Captives post-battle choice adds **2 Food**. When occupying or resettling a ruin, Food can buy a higher starting settlement tier: tiers 2–5 cost **20, 40, 80, and 120** respectively.

Food state is determined as a percentage of current capacity, so capacity increases move the absolute thresholds:

| Capacity band | State | Installed campaign effects |
|---|---|---|
| 0–20% | Starving | -25% sacking, post-battle loot, and raiding income; +30% construction cost; -10 leadership; -2 control; -20 Growth |
| 21–40% | Shortage | +20% construction cost; -5 leadership; -1 control; -5 Growth |
| 41–60% | Average | +10% construction cost; +3 Growth |
| 61–80% | Surplus | +5 leadership in own or allied territory; +1 control; +10 Growth |
| 81–100% | Plentiful | +10 leadership in own or allied territory; +2 control; +20 Growth |

At exactly zero Skaven corruption, an owned province receives **+5 control** and contributes **+3 Food**. This is a deliberate low-corruption counterweight, not a contradiction of the normal high-corruption Menace Below benefit.

### Menace Below and Skaven corruption

**Applicability:** all six playable factions; the Clan Mors purchase schedule is different.

Skaven corruption reduces control but adds free Menace Below uses to battles in the local province. Additional uses may be bought before battle with Food. The standard five purchases cost **3, 6, 9, 12, and 15 Food**. Clan Mors can instead buy up to ten additional uses at **2 Food per use**. Other faction, lord, building, or skill modifiers may add uses or ambush chance; their ordinary effect rows remain cataloged.

Menace Below is therefore both a local-corruption benefit and a pre-battle Food sink. The corruption-provided and purchased uses are separate contributors to the battle total.

### Hidden settlements and Under-Cities

**Applicability:** all six playable factions; Clan Mors has a scripted starting Under-City in Immortal Empires.

Normal Skaven settlements appear as ruins to non-Skaven factions. Skaven always see one another's settlements. A non-Skaven army exposes the occupant by attempting to colonize the apparent ruin, while a hero can investigate without committing an army.

An Under-City is a foreign-slot network beneath a settlement the Skaven faction does not own. It can be established through the dedicated agent action or the Skaven settlement-capture option; eligible Under-City buildings can also spread the network. After a successful agent establishment action, the faction receives a **10-turn** establishment cooldown, modified by relevant bonuses. Discoverability and detection are opposing values: the owner of the surface settlement can remove an exposed network, and razing the settlement removes it outright. Constructible Under-City rows and their standardized unconditional fields remain in the economy CSVs; conditional discoverability, spread, income, Food, and corruption interactions belong to the campaign relations summarized here.

Three terminal branches change campaign state rather than merely producing an effect:

- **Doomsphere:** the final building kills an army stationed in the settlement, destroys the Under-City, abandons the surface settlement, and leaves the nuclear-ruin state.
- **Vermintide:** the final war-camp building spawns a Skaven army, removes the Under-City, and declares war on the surface owner when the factions are not teammates.
- **Plague Cauldron:** the Clan Pestilens terminal building infects the region if it is not already infected.

At the start of a new Immortal Empires campaign, the script creates three weighted Under-Cities for nearby AI Skaven factions. It also always gives Clan Mors an Under-City at Karak Eight Peaks and reveals the region to Mors. Human Mors begins with its first slot upgraded immediately to the tier-5 settlement warren; AI Mors instead receives Deeper Tunnels. A separate contingency can seed AI Clan Moulder beneath human-held Altdorf (35% roll), otherwise AI Clan Skryre beneath Ubersreik on a further 20% roll.

### Campaign movement and offensive ambushes

**Applicability:** all six playable factions.

Skaven armies use **Stalking** as their normal mobile stance. It conceals the army while moving and can turn an attack into an ambush, so an offensive move can begin with an ambush deployment rather than requiring a stationary ambush stance. The result still depends on ambush success and detection modifiers.

Skaven also have the **Tunnelling** stance, which crosses otherwise obstructing terrain. Like other underway-style movement, the destination can be intercepted. These are campaign movement rules; unit Stalk attributes and lord/hero ambush bonuses remain in their respective catalogs.

### Loyalty

**Applicability:** non-faction-leader Skaven lords. Legendary faction leaders are not subject to it. Clan Eshin has the exception below.

Loyalty ranges from 0 to 10. Recruiting units into a lord's army, gifting items, completing missions, friendly diplomatic actions, and keeping the faction leader at a higher rank tend to raise it; opposite outcomes tend to lower it. At **0**, the lord rebels with the army and forms a new faction. Installed dilemma pools use **0–3** as low loyalty and **8–10** as high loyalty.

Clan Eshin disables the faction's `loyalty_of_lords` campaign feature. Its non-faction-leader lords therefore do not use the normal Skaven loyalty/defection loop; this is a faction-wide exception, not merely protection for Eshin-themed lord subtypes.

### Ritual agents and Skaven plague

**Applicability:** Clan Rictus, Clan Mors, Clan Moulder, Clan Skryre, and Clan Pestilens can perform the Scheme of DOOOOM! Clan Eshin cannot. The same five factions can create the Pestilent Scheme Priest; Pestilens has the faster version. Clan Eshin instead has its separate Sewer Pestilence Shadowy Dealing.

The **Scheme of DOOOOM!** costs **800 treasury**, has a 30-turn faction cooldown and 5-turn global ritual cooldown, and supplies the expendable DOOOOM! Engineer used to establish an Under-City. The standard **Pestilent Scheme** costs **1,000 treasury**, has the same 30/5 cooldowns, and supplies an expendable Pestilent Scheme Priest whose successful action creates the Skaven plague. Clan Pestilens's replacement Pestilent Scheme has a **15-turn** faction cooldown and the same 5-turn global cooldown.

The installed Skaven plague lasts **5 turns**. It can spread at most **6 times**. Force-to-force after battle, force-to-force proximity, force-to-region, region-to-force, and region-to-region transmission each start at **20%**; each successful spread reduces the infection chance by **50%**, with a **5%** floor. Recovery grants **5 turns** of immunity.

Effects depend on the infected faction:

| Target | Force effects | Settlement effects |
|---|---|---|
| Clan Pestilens | +8 leadership, +5% replenishment, Frenzy, -50% vigour loss | +25 Growth, +15% income, -33% construction time |
| Every other faction, including other Skaven | Plague attrition and -9 leadership | -30 Growth and -50% income |

Thus Pestilens profits from its own infection while allied or rival non-Pestilens Skaven do not.

### Clan Skryre: Forbidden Workshop

**Applicability:** `wh2_main_skv_clan_skryre` only.

The Workshop spends **Warp Fuel** and Food on permanent upgrade branches for weapon teams, Doom-Flayers, Doomwheels, and Doomrockets. Skryre starts with **5 Warp Fuel** and **1 Doomrocket**. The default rocket stock cap is **5**; a Workshop upgrade raises it to **8**. A rocket can be used once in a battle and one stock is consumed after the battle. The ability is unavailable at zero stock, and manufacturing locks at the cap.

Normal weapon and vehicle upgrades cost **3 Warp Fuel** plus **3, 5, 7, or 10 Food** by upgrade level. The six nuclear upgrade records cost **2 Warp Fuel and 5 Food** each. Manufacturing a Doomrocket costs **4 Warp Fuel and 5 Food**; the relevant upgrade gives a 25% chance of producing a second rocket.

Warp Fuel acquisition is scripted rather than a normal building output:

- Ikit Claw's victorious battles roll a base **40%** chance.
- A Warlock Master victory rolls **20%**.
- A Warlock Engineer's successful campaign action rolls **30%**.
- Failed battle rolls increase the next chance through a saved failure streak; character bonuses can modify the roll.
- Completing a Workshop progress level awards **5 Warp Fuel**.

Workshop progress also unlocks ancillaries and a unique Regiment of Renown. Some tiers are gated by missions involving Warlock character ranks or Doomrocket use, so possessing enough resources alone does not guarantee access. AI Skryre bypasses those human missions and initializes at Workshop progress level 4.

### Clan Eshin: Shadowy Dealings and Greater Clan Contracts

**Applicability:** `wh2_main_skv_clan_eshin` only.

Shadowy Dealings spend **Schemes** charges. Capacity starts at **1** and rises by one after each of four progression missions, to **5**. Deal tiers cost **1–5 charges**. While the human player is below capacity, one charge regenerates every **5 turns** until the pool is full. Deals use one to five participating characters; each performer gains **1,200 experience**. The action can also put a participating character into recovery. Action-family cooldowns range from none for basic work to 10, 20, 50, or 100 turns for stronger schemes.

The highest-impact exceptions are state-changing rather than ordinary bundle modifiers:

- **Overthrow Under-City** transfers a rival Skaven Under-City to Eshin.
- **Sewer Pestilence** disables recruitment, applies local-force attrition, and reduces Growth in the target province; it has a 50-turn action cooldown and leaves Snikch recovering for 5 turns.
- **Plunge Into Anarchy** removes the target faction leader and overthrows the faction with rebels. It targets a faction through one of its armies or settlements, excludes human and Chaos targets, has a 100-turn action cooldown, and leaves Snikch recovering for 5 turns.

The four Greater Clan reputations—Mors, Moulder, Pestilens, and Skryre—range from **-20 to 100**. Their installed bands are -20 to -11, -10 to -1, 0, 1–19, 20–39, 40–79, and 80–100. Negative standing penalizes diplomacy and the relevant clan's specialty; positive standing improves diplomacy and progressively offsets Eshin's baseline **+200% recruitment-cost surcharge** for non-Eshin clan units. At 80+, each clan grants its strongest specialty benefit. The four top-band distinctions are: Mors, lord/hero rank and control; Moulder, lord/hero rank and construction cost; Pestilens, lord/hero rank and Food per army; Skryre, lord/hero rank and research rate.

The first contract council is scheduled after **3 turns**. Thereafter the script permits a 5% early roll each turn but forces a new council within **10 turns**. An issued contract remains active for **10 turns**. Contract tier 2 requires reputation 1 with the issuing clan; tier 3 requires 20. Completion changes the issuing and target clan reputations and can award treasury, Food, or a Schemes charge. It also unlocks diplomacy with a positively regarded issuing clan.

The **Revitalising Scheme** costs 2,500 treasury and has a 30-turn cooldown. It immediately ends convalescence for all Eshin characters and fully restores every unit in the faction's armies. This is a scripted faction-wide repair, not merely a displayed effect bundle.

### Clan Moulder: Flesh Laboratory

**Applicability:** `wh2_main_skv_clan_moulder` only.

The Flesh Laboratory starts with **0 Growth Juice** and **100 Mutagen**. It adds **60 Growth Juice per turn**. The operative Mutagen cap is 100, raised to 200 by an upgrade; excess Mutagen degenerates by up to 20 per turn until the operative cap is reached. The much larger generic pooled-resource ceiling is not the Laboratory's usable cap.

Infantry and monster mutations each have three price bands: **25, 25, and 50 Mutagen**. A newly recruited unit from the Laboratory pool receives a random augmentation; an upgrade can add more. Each normal augmentation also rolls for Instability. The base chance is the unit's resulting mutation count times 10%, halved for the first two mutations: **5%, 10%, 30%, 40%**, and so on. Once a unit is already unstable, another mutation advances its negative Instability stage rather than making an independent fresh state.

The Growth Vat can be released at **500 Growth Juice** and releases automatically at **1,000**. The five batch bands are 500–649, 650–799, 800–899, 900–999, and 1,000; higher bands select larger or stronger generated pools. Releasing resets Growth Juice to zero, grants **10 Food** (**15** after the relevant upgrade), and advances the saved batch counter.

The three Laboratory upgrade tiers unlock after **1, 4, and 8** Vat releases. Their purchases cost **5, 10, and 15 Food** respectively. The upgrades alter matters such as specimen collection, Vat output, recycling, Mutagen capacity, mutation behavior, and generated-unit quality; ordinary bundle effects are not duplicated here.

Disbanding an unstable unit recycles it for **50 Growth Juice**; the Bio-Recycle upgrade also adds **5 Food**. Skavenslaves automatically augmented by Clone Warfare carry a hidden no-refund marker, preventing an infinite recycle loop.

Three repeatable Laboratory actions unlock on turn 2; each has 10-turn action, global, and category cooldown records. Mutagen Buy-Back converts **5,000 treasury into 100 Mutagen**; Harvest Organs spends **20 Food** for faction replenishment support; Unclean Energy Bar spends **10 Mutagen** on Throt's force for three turns.

### Ghoritch

**Applicability:** Clan Moulder only; entitlement and the character not already being claimed still apply.

A human Clan Moulder campaign receives Ghoritch after completing Throt's **Whip of Domination** quest battle (`wh3_main_ie_qb_skv_throt_main_whip_of_domination`), through the `wh2_dlc16_incident_skv_ghoritch_arrives` incident. AI Clan Moulder receives him when Throt reaches rank 5. His unit and skill details remain in the unit and character catalogs.

### Clan Pestilens and Iyann Rocksburrow

**Applicability:** `wh2_main_skv_clan_pestilens` only.

Clan Pestilens begins with **Iyann Rocksburrow**, a uniquely named Warlord, available in its lord recruitment pool. Once recruited, his dedicated **Brutally Honest** trait (`wh2_main_trait_brutally_honest`) grants **+25% income from Salvage buildings factionwide**. This is easy to miss because the trait is not shown normally while he remains in the pool. The installed database confirms the dedicated trait and effect records; the name and starting-pool linkage are consistently reported by current community records but were not exposed by a narrow installed start-position relation. No exact disappearance turn is asserted here. His unique Sea Cucumber ancillary is not quantified because its current start-position linkage and effects were not independently closed in the installed files.

### Clan Mors and Karak Eight Peaks

**Applicability:** `wh2_main_skv_clan_mors` only.

Human Clan Mors begins with a faction-wide **-2 control** penalty while it does not own Karak Eight Peaks. Capturing the settlement removes that penalty and applies the owned state: **+1 loyalty per turn chance**, Frenzy for Clanrats and Stormvermin, and **+2 lord recruit rank**. The start-of-campaign Under-City and cheaper Menace Below purchases are described in their race-wide sections above.

When any of the three Karak Eight Peaks claimants—Clan Mors, Crooked Moon, or Clan Angrund—is human, the script locks the Mutinous Gits out of normal diplomacy while explicitly keeping war available between them and each claimant. In multiplayer it then reopens diplomacy for non-mercenary human factions other than Crooked Moon and Clan Angrund—including a human Clan Mors—but still blocks confederation with the Mutinous Gits. This is claimant-state setup, not a general Skaven diplomacy restriction.

### Clan Rictus and Tretch Craventail

**Applicability:** the war-declaration effect is human `wh2_dlc09_skv_clan_rictus`; the withdrawal trigger specifically requires Tretch.

When Tretch withdraws from a defensive battle in which he was the defender, his force gains **+13 melee attack**. The bundle remains until the next fought battle involving him, when it is removed.

When human Clan Rictus declares war, the faction receives a three-turn bundle: vanguard deployment for all units, **+1 Menace Below use**, **+50% enemy reinforcement time**, and **+25% ambush attack chance**. The executable trigger is a war declaration; it does not require a treaty to have been broken even though older descriptive text associates the effect with betrayal.

## Faction coverage

- **Clan Rictus** — `wh2_dlc09_skv_clan_rictus`: shared Food, corruption/Menace, hidden settlements, Under-Cities, movement, loyalty, DOOOOM!/Pestilent Scheme agents and plague rules; Tretch's defensive withdrawal and Rictus war-declaration triggers. No additional uncataloged Rictus resource loop was found.
- **Clan Eshin** — `wh2_main_skv_clan_eshin`: shared Food, corruption/Menace, hidden settlements, Under-Cities, movement, and plague victim rules; non-defection; Shadowy Dealings, Schemes, Greater Clan Contracts/reputations, Plunge Into Anarchy, Sewer Pestilence, and Revitalising Scheme. Eshin does not receive the DOOOOM! or Pestilent Scheme rites.
- **Clan Mors** — `wh2_main_skv_clan_mors`: shared systems; major Skaven rites; cheaper Menace Below purchases; the scripted Karak Eight Peaks Under-City, ownership state, and Mutinous Gits diplomacy lock. No additional uncataloged Queek-only progression loop was found.
- **Clan Moulder** — `wh2_main_skv_clan_moulder`: shared systems and major Skaven rites; Flesh Laboratory, Growth Vat, Growth Juice, Mutagen, mutations, Instability, recycling, repeatable lab actions, and Ghoritch acquisition.
- **Clan Pestilens** — `wh2_main_skv_clan_pestilens`: shared systems; DOOOOM!; the 15-turn Pestilent Scheme replacement; positive plague effects; the Plague Cauldron terminal Under-City branch; and start-pool Warlord Iyann Rocksburrow with Brutally Honest. Lord Skrolk's ordinary faction and skill effects remain cataloged.
- **Clan Skryre** — `wh2_main_skv_clan_skryre`: shared systems and major Skaven rites; Forbidden Workshop, Warp Fuel, upgrade gates, Doomrocket stock/manufacture/use, and AI initialization. Ikit Claw's ordinary faction and skill effects remain cataloged.

Generic occupation choices, ordinary Supply Lines, standard climate suitability, generic confederation, standard short-victory objective lists, endgame Vermintide behavior, opponent-only hooks, diplomacy voice/context records, generic quests, and catalogued faction/character effects were checked and excluded because they add no further normal playable-Skaven operating rule. The Workshop-rank and Eshin-action victory conditions reuse systems already documented above. Thanquol, Clan Scruten, and Skreech Verminking are also excluded because their announced release postdates installed build 24237342.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`; `data/faction_guides/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all six files under `data/economy/factions/skaven/`.
- `data/unit_stats/normalized/skaven__wh3__8.1.1__ultra.csv` and the typed roster, ability, attribute, weapon, projectile, and mount lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 20 indexed Skaven character files under `data/skill_trees/characters/skaven/`.
- Relevant English localization and source-export relations under `data/economy/source_exports/`, `data/unit_stats/source_exports/`, and `data/skill_trees/source_exports/`, especially UI help, effects, effect bundles, rituals, resources, faction sets, and campaign group relations.

### Installed vanilla game files inspected through RPFM

All requests used `scripts/rpfm-call-locked.ps1` and the read-only merged vanilla source (`pack_key=$CA` where required). No game pack was edited or saved.

- Scripts: `script/campaign/wh2_dlc12_under_empire.lua`, `script/campaign/wh2_dlc12_ikit_workshop.lua`, `script/campaign/wh2_dlc14_snikch_shadowy_dealings.lua`, `script/campaign/wh2_dlc14_snikch_clan_contracts.lua`, `script/campaign/wh2_dlc14_snikch_revitalizing_rite.lua`, `script/campaign/wh2_dlc16_flesh_lab.lua`, `script/campaign/wh2_dlc09_tretch_craventail.lua`, `script/campaign/main_warhammer/wh_dlc06_karak_eight_peaks.lua`, and `script/campaign/wh3_main_legendary_characters.lua`.
- Resource/state tables: `db/campaign_group_pooled_resources_tables/data__`, `db/pooled_resources_tables/data__`, `db/campaign_group_member_criteria_pooled_resources_tables/data__`, `db/campaign_group_member_criteria_numeric_ranges_tables/data__`, `db/campaign_group_pooled_resource_effects_tables/data__`, `db/resource_costs_tables/data__`, and `db/resource_cost_pooled_resource_junctions_tables/data__`.
- Campaign group and ritual tables: `db/campaign_groups_tables/data__`, `db/campaign_group_members_tables/data__`, `db/campaign_group_member_criteria_factions_tables/data__`, `db/campaign_group_member_criteria_cultures_tables/data__`, `db/campaign_group_member_criteria_subcultures_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/rituals_tables/data__`, `db/ritual_payloads_tables/data__`, and `db/campaign_group_pending_battle_purchasable_effects_tables/data__`.
- Plague/loyalty tables: `db/plagues_tables/data__`, `db/plague_parameters_tables/data__`, `db/plague_effects_tables/data__`, `db/faction_set_effect_bundles_tables/data__`, `db/faction_set_items_tables/data__`, `db/campaign_group_loyalty_dilemmas_tables/data__`, and `db/loyalty_factors_tables/data__`.
- Feature, campaign, and unique-character relations: `db/campaign_features_tables/data__`, `db/campaign_to_agent_subtypes_tables/data__`, `db/unique_agents_tables/data__`, `db/character_traits_tables/data__`, `db/character_trait_levels_tables/data__`, and `db/trait_level_effects_tables/data__`.
- Stable anchors: all six playable faction keys; all 20 indexed character subtypes; `wh2_main_feature_skaven`; `skaven_food`; `wh2_dlc12_slot_set_underempire`; `skv_reactor_core`; `skv_nuke`; `skv_dust`; the four Eshin reputation resources; `skv_growth_vat`; `skv_mutagen`; `wh2_main_plague_skaven`; and `wh3_main_feature_clan_mors`.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Total War Academy, [Skaven campaign tactics](https://academy.totalwar.com/skaven-campaign-tactics/) (older official discovery checklist; not used for current numeric values).
- Steam, [The Prophet & The Warlock](https://store.steampowered.com/app/965220/Total_War_WARHAMMER_II__The_Prophet__The_Warlock/), [The Shadow & The Blade](https://store.steampowered.com/app/1158180/Total_War_WARHAMMER_II__The_Shadow__The_Blade/), and [The Twisted & The Twilight](https://store.steampowered.com/app/1315750/Total_War_WARHAMMER_II__The_Twisted__The_Twilight/).
- Community discovery checklists: [Skaven](https://totalwarwarhammer.fandom.com/wiki/Skaven), [Forbidden Workshop](https://totalwarwarhammer.fandom.com/wiki/Forbidden_Workshop), [Flesh Laboratory](https://totalwarwarhammer.fandom.com/wiki/Flesh_Laboratory), [Clan Eshin](https://totalwarwarhammer.fandom.com/wiki/Clan_Eshin), [Eshin Actions](https://totalwarwarhammer.fandom.com/wiki/Eshin_Actions), [Clan Mors](https://totalwarwarhammer.fandom.com/wiki/Clan_Mors), and [Clan Rictus](https://totalwarwarhammer.fandom.com/wiki/Clan_Rictus). These located candidate systems; current triggers and values above come from the installed snapshot.
- Current omission checks: [Throt campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3216406011) and [Clan Pestilens faction record](https://www.honga.net/totalwar/en/warhammer3/factions/wh2_main_skv_clan_pestilens).
- Iyann Rocksburrow discovery checks: [Skaven character traits](https://totalwarwarhammer.fandom.com/wiki/Character_traits), [Skaven follower record](https://twwhub.dev/culture_v2/wh2_main_skv_skaven/followers), and a [2025 player verification discussion](https://www.reddit.com/r/totalwar/comments/1nxb1he). These support the name/start-pool linkage; installed trait/effect relations control the stated trait key and magnitude.

### Evidence limitations

- The RPFM service was unavailable once and was restarted using the repository's configured local executable. Completed reads remained narrow, sequential, locked, and read-only.
- A final targeted start-position reference query reset the local RPFM endpoint. The installed database had already confirmed `wh2_main_trait_brutally_honest` and its effect relation, but a narrow relation linking that record to Iyann's name and starting pool was not recovered. Those two linkage claims are therefore labeled as current multi-source community evidence, and no exact recruitment-window cutoff or Sea Cucumber effects are asserted.
- One guessed plague-script path and one guessed stance-table packed path did not exist and supplied no evidence. Plague behavior was instead closed through exact plague, faction-set, effect-bundle, ritual, and Under-City records; stance identity was corroborated by installed campaign script references and localization.
- The current DB exposes corruption-provided Menace Below bundles but not a single compact relation tying every UI corruption breakpoint to the siege purchase flow. The guide therefore states the verified direction and granted-use behavior without inventing precise corruption thresholds.
- AI Workshop, Shadowy Dealing, Under-City seeding, and Ghoritch branches are scripted separately from human progression. Only deterministic or bounded behavior directly present in those scripts is reported.
