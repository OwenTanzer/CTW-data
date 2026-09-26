# Chaos Dwarfs campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | Chaos Dwarfs |
| Race slug | `chaos_dwarfs` |
| Playable factions | 3 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already enumerate the enabled Outpost, Factory, and Tower building variants, their tiers, costs, prerequisites, and standardized outputs for all three factions. The normalized unit file and typed lookups already cover the roster, exact military-group permissions, unit statistics, abilities, weapons, and mounts. The character files already contain the complete skill trees of Astragoth, Drazhoath, Zhatan, Gorduz, the Convoy Overseer, and the generic Chaos Dwarf lords and heroes. Those rows are not repeated here. This document records only campaign systems whose operation is not expressible in those catalogs.

## Mechanically relevant material not captured elsewhere

### Industrial resource loop and settlement roles

**Applicability:** race-wide — `wh3_dlc23_chd_astragoth`, `wh3_dlc23_chd_legion_of_azgorh`, and `wh3_dlc23_chd_zhatan`.

The building catalog shows the three settlement templates but not their resource relationship. Chaos Dwarf settlements do not use ordinary Growth/population surplus: their main-chain advancement instead uses the resource costs recorded in the building catalog, with Raw Materials as the central development input. Outpost Mines add provincial Workload and generate Raw Materials. Factory Assembly Lines consume that upstream production to generate Armaments; other Factory chains convert Raw Materials to treasury. Towers are the full provincial-capital template and generate Conclave Influence. Armaments pay for advanced military construction, Hell-Forge unit-cap increases, and active Manufactory modifications. Conclave Influence pays for Tower of Zharr seats and retained settlement levels.

On occupation or colonization, an ordinary generic minor settlement offers the Outpost or Factory alternatives, while an eligible provincial capital offers the Tower alternative; special forts and unique chains retain the alternatives allowed by their own occupation records. Establishing a Tower costs 500 Raw Materials. Retaining an occupied settlement at tier 2, 3, 4, or 5 uses 50, 125, 225, or 375 Conclave Influence respectively. Razing has a dedicated Raw Materials factor, but its final engine-calculated yield is not asserted here.

All eleven campaign climates are suitable to Chaos Dwarfs. `campaign_group_members_tables` maps every `wh3_dlc20_climate_suitable_*` group—from Chaotic Wasteland through Temperate and Ocean—to the corresponding `wh3_dlc23_chd_regular_*` member, and `campaign_group_member_criteria_climates_tables` resolves those members to all eleven climate keys. Their expansion constraints therefore come from the industrial resource loop and settlement specialization, not climate suitability penalties.

Labour is a province-managed resource. Labour gained from battle is divided evenly among provinces enabled for new intake. The transfer UI can redistribute Labour between provinces and charges the treasury amount calculated by the UI; `wh3_dlc23_labour_move.lua` validates the confirmation event and deducts that amount. A new campaign grants 500 Labour to each human Chaos Dwarf faction's starting province.

All three playable factions can also **Rush Construction** with Labour. `building_instant_constructions_tables` assigns the Chaos Dwarf rush-cost record to each faction at `FACTION_PROVINCE` scope, while its pooled-resource junction charges 100 Labour per construction turn skipped. This is a province-level acceleration option, not another ordinary construction-cost column: the available Labour belongs to the province in which the building is being rushed.

Raiding an enemy-owned region also adds Labour at the raiding faction's turn start. For each raiding army, the script divides the region's GDP by the number of same-faction raiding armies there, then calculates `floor((GDP share × unit count / 100) + unit count + (force strength / 200000))`. The resulting Labour is divided evenly among provinces whose intake is enabled. Because the GDP term is shared, stacking more raiding armies in one region does not multiply that part of the yield without limit.

Each province compares Labour with Workload. The script stores a shortfall value of `100 - ceil(100 × Labour / Workload)`, clamped to 0–100; `campaign_effect_list_effect_junctions_tables` applies `-1%` Raw Material output per shortfall point. Thus Labour at least equal to Workload produces no efficiency penalty, while partial coverage proportionally reduces Raw Material output.

At every world-round start from turn 2, provincial Labour decays according to Control. The loss is floored after applying the percentage, with a minimum loss of 5 Labour:

| Control | Labour lost |
|---|---:|
| -100 to -75 | 20% |
| -74 to -50 | 15% |
| -49 to -25 | 10% |
| -24 to 49 | 5% |
| 50 to 100 | 3% |

Three province-targeted Labour Actions each consume 200 Labour. Set an Example grants +10 Control and blocks another Labour Action in that province for five turns. Sacrifices for Zharr-Naggrund grants 10 Conclave Influence and Sell Labour grants 1,500 treasury; their payload bundles last one turn. The Industry technology **Workforce Diktats** upgrades Set an Example to +15 Control and Sell Labour to 2,250 treasury. The Sorcery technology **Sacrificial Vats** upgrades Sacrifices for Zharr-Naggrund to 15 Conclave Influence.

The three technology branches also have resource-priced gateway records in low/medium/high bands: Industry uses 1,000/1,500/2,000 Raw Materials, Military uses 200/250/500 Armaments, and Sorcery uses 25/50/100 Conclave Influence. These are separate from the ordinary technology rows represented in the project exports.

The ordinary additional-army-upkeep feature is explicitly disabled for `wh3_dlc23_feature_chaos_dwarfs`. The Supply Lines script therefore does not add its difficulty-scaled faction-wide upkeep percentage for a second or later ordinary Chaos Dwarf army. This does not remove the normal upkeep of the army's units or the separate Armament upkeep of active Hell-Forge modifications.

### Hell-Forge capacity and Manufactory modifications

**Applicability:** race-wide — all three playable faction keys.

The roster catalog records which units exist but not their campaign supply caps. Hell-Forge rituals spend Armaments to add one capacity to a named unit or grouped War Machine cap. Base costs are:

| Capacity purchase | Armaments |
|---|---:|
| Chaos Dwarf Warriors | 100 |
| Blunderbusses | 150 |
| War Machines group | 200 |
| Infernal Guard | 250 |
| Great Taurus | 250 |
| Bull Centaur Renders | 300 |
| Hellcannon | 300 |
| Infernal Guard (Fireglaives) | 300 |
| K'daai Fireborn | 300 |
| Infernal Ironsworn | 350 |
| Lammasu | 350 |
| Bale Taurus | 450 |
| K'daai Destroyer | 500 |

After each purchase, the script raises the future price of that same capacity ritual by 25%. Only the grouped War Machines capacity ritual uses the lower 10% increase; despite Hellcannon belonging to the War Machine unit set for other purposes, its individual capacity ritual takes the ordinary 25% increase. The increase is persistent and uncapped by the ritual record.

Total capacity in six categories—melee infantry, missile infantry, Bull Centaurs, flying beasts, K'daai, and War Machines—unlocks permanent-duration Manufactory modifications for that category. Each category initially permits three Forgecraft options to be active simultaneously and has a three-turn activation cooldown; the Military technology **Total War!** raises the maximum by two options for every category. Active modifications consume Armaments each turn in five cost bands: 8, 10, 12, 14, or 16 Armaments, and remain active only while that upkeep can be met. Their capacity gates are category-specific: melee infantry 5/7/10/13/16/18 (with a final 30-cap gate), missile infantry 4/6/9/12/15/18 (final 30), Bull Centaurs 2/4/6/8/10 (final 20), flying beasts 4/6/8/10/12 (final 20), K'daai 3/5/7/9/11 (final 20), and War Machines 4/6/8/10/12 (final 24). Individual modification effects are database initiative/effect records; their combat values are not duplicated because the unit and ability catalogs remain the quantitative battle layer.

Armament upkeep for active modifications is multiplied by the number of eligible active units in the corresponding category: the script applies `(count - 1) × 100%` as the category cost modifier. Convoy armies and listed Regiments of Renown are excluded. Dreadquake carriage combinations count as two War Machine bodies for this calculation. The modifier is recalculated after training, merging, disbanding, upgrading, battles, force creation, confederation, and at turn boundaries.

AI Chaos Dwarf factions reassess their Hell-Forge initiative context every tenth turn from their current roster mix. The executable thresholds are 40% for either infantry category, 15% for War Machines, and 20% for Bull Centaurs, flying beasts, or K'daai; the script retries five percentage points lower and otherwise defaults to missile infantry.

### Tower of Zharr

**Applicability:** race-wide competition among the three playable factions; the scripted participant list is exactly the three faction keys above.

The Tower contains Industry, Military, and Sorcery districts. Seat costs by tier are 75, 150, 300, and 600 Conclave Influence. A seat reward belongs only to its current holder; completing every seat in a district grants that district's reward to all Chaos Dwarf participants. Completing any two districts in a tier unlocks the next tier.

A claimed tier 1–3 seat is protected from usurpation for five turns. Thereafter another participant can claim it at an increased price. Each successful usurpation increments that seat's surcharge by 50 percentage points (`50 × (1 + prior usurp count)`) and applies a five-turn diplomatic penalty between usurper and displaced faction. Tier-4 Conclave seats cannot be usurped.

The four tier-4 seats map to Astragoth, Drazhoath, Zhatan, and the non-playable Servants of the Conclave. Claiming a mapped seat enables confederation of that target; the script temporarily adjusts the seat-claim cost while transferring seats already held by the confederated faction. This Tower mapping is the installed race-specific confederation lifecycle; no separate Chaos Dwarf vassal system was located.

Each playable faction has a distinct cumulative Tower specialism. The effect scales linearly through eight matching seats, then uses a larger ninth-seat bundle:

| Faction | Matching seats | Cumulative effect at 1–8 seats | Effect at 9 seats |
|---|---|---:|---:|
| Disciples of Hashut (`wh3_dlc23_chd_astragoth`) | Sorcery | +3 Winds of Magic reserve capacity per seat | +30 Winds of Magic reserve capacity |
| The Legion of Azgorh (`wh3_dlc23_chd_legion_of_azgorh`) | Industry | -2% construction cost per seat | -20% construction cost |
| The Warhost of Zharr (`wh3_dlc23_chd_zhatan`) | Military | -1% upkeep per seat | -10% upkeep |

Several seats are script-driven rather than static effect bundles. Verified examples include periodic random ancillary awards, temporary zero-cost capacity purchases, and the Field Marshal occupation-triggered Hobgoblin army. The script counters and exact record keys are retained in the evidence register; exhaustive seat reward text is omitted because it would reproduce ordinary effect rows rather than explain the system.

To keep AI competitors operative, every non-human Chaos Dwarf faction receives 7 Conclave Influence at faction-turn end after turn 10. This scripted grant is independent of settlement output.

### Convoys

**Applicability:** race-wide; convoy forces use the dedicated lord subtype `wh3_dlc23_chd_lord_convoy_overseer`.

Convoys are persistent off-map-trade forces sent along the caravan network with cargo, route risk, travel time, destination rewards, and en-route dilemmas or battles. The Chaos Dwarf event script can change cargo, add or remove units, attach a battle to a dilemma, apply temporary force bundles, and place each named event on cooldown. It also switches several encounter army templates to stronger versions after turn 50. Convoy units are deliberately excluded from Hell-Forge per-unit Armament-upkeep multiplication.

The installed contract table defines four standard exchanges. Cargo converts Armaments to Labour at `1:1.3` with a 400-cargo maximum, Armaments to treasury at `1:6` with a 400 maximum, treasury to Labour at `1:0.34` with a 1,000 maximum, or treasury to Raw Materials at `1:0.25` with a 1,000 maximum. The Karond Kar contract set is narrower, containing only the two Labour-buying contracts. Contracts are irrevocable after dispatch. The Chaos Dwarf networks use `armaments_labour` as their default contract in both Realm of Chaos and Immortal Empires.

The campaign script announces the initial convoy unlock on turn 5 and new contracts every tenth turn. A Convoy Overseer's innate trait selects the force's initial composition; units can subsequently change through events and route completion. Each eligible destination has a unique completion tuple consisting of an ancillary, an incident, and a foreign-unit reward rather than a single symmetric destination prize. Completion also records total cargo and route count, lowers that destination's demand by `floor(cargo / 18)`, and, when the relevant technology bonus is active, permanently stacks its trade-tariff modifier once per completed convoy. The generic convoy-event cooldown ceiling is 15 turns.

### Gorduz Backstabber recruitment

**Applicability:** race-wide — all three playable factions, provided Gorduz has not already been claimed by another eligible faction.

Gorduz's presence in the character catalog does not encode how he enters a campaign. In the current executable configuration, completing either level of the Hobgoblin military chain (`wh3_dlc23_chd_military_hobgoblins_1` or `_2`) triggers his mission; the nearby Lua comment that says faction-leader rank 5 is stale because the data block has no `unlock_rank` field and the dispatcher selects its `required_buildings` listener instead. The mission requires ownership of any eight eligible Hobgoblin units: Hobgoblin Archers, Cutthroats, Sneaky Gits, any of the three listed Wolf Raider variants (including the Regiment of Renown), or a Hobgoblin Bolt Thrower. Completion awards 500 temporary/global Labour and causes the script to spawn Gorduz. If no human Chaos Dwarf faction is eligible, the strongest eligible AI faction can receive him from turn 30.

### Great Drill and Ancestor Relics (Realm of Chaos)

**Applicability:** all three playable factions in the `wh3_main_chaos` narrative campaign; not asserted for Immortal Empires.

Completing the faction-specific Drill structure mission unlocks eight Ancestor Relic missions. Three major relics use set-piece battles; three lesser relics require control of named regions; two lesser relics require defeating spawned rogue armies. On each completed relic mission, the player chooses between binding the relic to the Drill or taking the faction reward. Major-relic faction rewards grant the corresponding ancillary plus 300 Conclave Influence; lesser-relic faction rewards grant the ancillary plus 75 Influence.

Four bound relics unlock the faction-specific final Drill battle. If four faction rewards have already been chosen, the next completed relic is forced into the Drill path; conversely, after four bound relics, later completions are taken as faction rewards. Winning the final battle completes the scripted Chaos Dwarf long-victory objective and triggers the epilogue sequence.

### Ancestor Relic quest battles (Immortal Empires)

**Applicability:** all three playable factions when human in `main_warhammer`; this is separate from the Realm of Chaos Drill progression.

After the faction completes `wh_main_short_victory`, the Immortal Empires loader triggers three major-relic missions: Grimnir, Grungni, and Valaya. Their successful mission payloads award the Major Relic of Grimnir talisman, Major Relic of Grungni armour, and Major Relic of Valaya enchanted item respectively. There is no Drill binding choice or Influence reward in these Immortal Empires payloads.

## Faction coverage

- **Disciples of Hashut** (`wh3_dlc23_chd_astragoth`): all race-wide systems, including the Gorduz chain and Immortal Empires relic battles; Sorcery-seat specialism in **Tower of Zharr**; faction-specific Drill location and final battle in the Realm of Chaos system.
- **The Legion of Azgorh** (`wh3_dlc23_chd_legion_of_azgorh`): all race-wide systems, including the Gorduz chain and Immortal Empires relic battles; Industry-seat specialism in **Tower of Zharr**; faction-specific Drill location and final battle in the Realm of Chaos system.
- **The Warhost of Zharr** (`wh3_dlc23_chd_zhatan`): all race-wide systems, including the Gorduz chain and Immortal Empires relic battles; Military-seat specialism in **Tower of Zharr**; faction-specific Drill location and final battle in the Realm of Chaos system.

No additional faction-exclusive scripted panel or resource loop was located. The remaining lord/faction differences are ordinary effects or skill-tree entries already represented by the source catalogs and localization records.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and every CSV under `data/economy/factions/chaos_dwarfs/`.
- `data/unit_stats/normalized/chaos_dwarfs__wh3__8.1.1__ultra.csv`; typed roster and ability lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all files under `data/skill_trees/characters/chaos_dwarfs/`.
- English localization records under `data/unit_stats/source_exports/text/db/`, especially `pooled_resources__.loc.tsv`, `pooled_resource_factors__.loc.tsv`, `rituals__.loc.tsv`, `effects__.loc.tsv`, `technologies__.loc.tsv`, `uied_component_texts__.loc.tsv`, and `ui_text_replacements__.loc.tsv`.

### Installed vanilla game files inspected through RPFM

- Scripts: `script/campaign/wh3_dlc23_efficiency.lua`, `script/campaign/wh3_dlc23_labour_loss.lua`, `script/campaign/wh3_dlc23_labour_move.lua`, `script/campaign/wh3_dlc23_labour_raid.lua`, `script/campaign/wh3_dlc23_campaign_chd_hellforge.lua`, `script/campaign/wh3_dlc23_campaign_chd_tower_of_zharr.lua`, `script/campaign/wh3_campaign_chd_convoy_events.lua`, `script/campaign/wh3_campaign_caravans_core.lua`, `script/campaign/wh_campaign_setup.lua`, `script/campaign/wh3_main_legendary_characters.lua`, `script/campaign/wh3_main_chaos/wh3_dlc23_narrative_chaos_dwarfs.lua`, and `script/campaign/main_warhammer/wh3_dlc23_chaos_dwarf_relics.lua`.
- Tables: `db/rituals_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/ritual_payload_resource_transactions_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, `db/campaign_payload_resource_transactions_tables/data__`, `db/effect_bundles_to_effects_junctions_tables/data__`, `db/pooled_resource_scaled_effects_tables/data__`, `db/campaign_effect_list_effect_junctions_tables/data__`, `db/initiative_sets_tables/data__`, `db/initiatives_tables/data__`, `db/technology_effects_junction_tables/data__`, `db/campaign_features_tables/data__`, `db/culture_settlement_occupation_options_tables/data__`, `db/campaign_group_members_tables/data__`, `db/campaign_group_member_criteria_climates_tables/data__`, `db/building_instant_constructions_tables/data__`, `db/campaign_caravan_networks_tables/data__`, `db/caravan_contracts_tables/data__`, `db/caravan_contract_set_items_tables/data__`, `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, and `db/cdir_events_mission_payloads_tables/data__`.
- Stable search terms/keys: `wh3_dlc23_chd_labour`, `wh3_dlc23_chd_workload`, `wh3_dlc23_chd_efficiency`, `wh3_dlc23_chd_armaments`, `wh3_dlc23_chd_conclave_influence`, `HELLFORGE_CAPS`, `wh3_dlc23_bundle_chd_hellforge_upkeep_cost_mods`, `wh3_dlc23_chd_ritual_toz_tier1` through `tier4`, the three playable faction keys, and legendary-lord subtype keys `wh3_dlc23_chd_astragoth`, `wh3_dlc23_chd_drazhoath`, and `wh3_dlc23_chd_zhatan`.

### Web grounding

- Official DLC overview: https://store.steampowered.com/app/2059190/?l=english
- Official release overview: https://sega.prezly.com/total-war-warhammer-iii-the-forge-of-the-chaos-dwarfs-is-out-now
- Creative Assembly patch 8.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes
- Creative Assembly hotfix 8.1.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14865-total-war-warhammer-iii-hotfix-8-1-1
- [Chaos Dwarfs overview](https://totalwarwarhammer.fandom.com/wiki/Chaos_Dwarfs), [Labour Economy](https://totalwarwarhammer.fandom.com/wiki/Labour_Economy), and [Military Convoys](https://totalwarwarhammer.fandom.com/wiki/Military_Convoys) — secondary mechanic checklists used to locate and verify the current installed raiding, contract, and convoy records.

### Evidence limitations

- The decoded script path is returned from RPFM's merged vanilla CA pack as source `PackFile`; `scripts/rpfm-call.mjs` loaded it with the required literal `$CA` placeholder. No pack was saved or edited.
- Labour gained per battle and the final Raw Materials yield from razing depend partly on campaign-engine calculations not exposed by the safely decoded relations. Only directly observed distribution and resource-role rules are stated; raiding Labour is documented separately from the fully decoded script formula.
