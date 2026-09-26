# Bretonnia campaign mechanics — patch 8.1.1

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** Total War: WARHAMMER III, patch **8.1.1**, Steam build **24237342**. Race: Bretonnia (`bretonnia`). Playable factions: 4. Campaign: Immortal Empires (`wh3_main_combi`); no Bretonnian faction is playable in the Realms of Chaos campaign in this snapshot.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

This guide records campaign mechanics that are not represented adequately by the existing normalized catalogs. Building chains, costs, income, and ordinary building effects belong to the Bretonnian economy exports. Unit statistics, permissions, and battle abilities belong to the unit catalog. Lord and hero skill-node effects belong to the skill-tree exports. Those facts are not repeated here. References to a building, unit class, ability, or hidden skill node below identify an input to a script or campaign system, not a replacement catalog entry.

## Mechanically relevant material not captured elsewhere

### Chivalry tiers and campaign outcomes

**Applies to:** all four playable factions: Couronne (`wh_main_brt_bretonnia`), Bordeleaux Errant (`wh_main_brt_bordeleaux`), Carcassonne (`wh_main_brt_carcassonne`), and Chevaliers de Lyonesse (`wh2_dlc14_brt_chevaliers_de_lyonesse`).

Chivalry is the pooled resource for the campaign group `wh_main_feature_bretonnia`. Its five installed thresholds are 0–1,999, 2,000–3,999, 4,000–5,999, 6,000–7,999, and 8,000–10,000. The tier bundles provide the following campaign-level progression:

- Tier 1: +2 leadership for faction armies.
- Tier 2: one Green Knight charge, +4 leadership, and +1 recruit rank for Bretonnian knight units.
- Tier 3: one Green Knight charge, +6 leadership, +2 knight recruit rank, +1 general recruit rank, and the Knight's Vow by default for newly recruited Lords.
- Tier 4: one Green Knight charge, -1 local corruption, +8 leadership, +3 knight recruit rank, +3 general recruit rank, and the Knight's Vow by default for new Lords.
- Tier 5: effectively unlimited Green Knight charges, -2 local corruption, +10 leadership, +4 knight recruit rank, +5 general recruit rank, +100% army experience gained from successful agent actions, and both the Knight's and Questing Vows by default for new Lords.

Every Bretonnian participant in a resolved battle receives a result-based change: heroic victory +50, decisive victory +20, close victory +10, pyrrhic victory +5, valiant defeat -2, close defeat -5, decisive defeat -10, and crushing defeat -20. Technologies can add a flat bonus when fighting specified enemy subcultures. A human Bretonnian faction that proposes war against another Bretonnian faction loses 200 Chivalry.

Several active campaign choices also change Chivalry. Each army in Ambush or Raiding stance costs 2 Chivalry per turn. Sacking costs 30, razing a human settlement costs 100, and the Bretonnian enemy-raze option grants 50; the neutral raze record has no Chivalry cost. Ransoming captives after battle costs 5. These values come from the active stance and pooled-resource cost junctions: an older occupation effect-bundle row still contains `+30` for enemy razing, but it is not the active cost record and is not used here.

At 8,000 Chivalry, each faction receives its final Errantry War choice once. Couronne, Bordeleaux Errant, and Carcassonne choose between an encounter against Chaos or Greenskins; either victory awards 2,000 Chivalry. Chevaliers de Lyonesse instead choose between Tomb Kings and Vampire Coast encounters; either victory awards 5,000 treasury and 200 Chivalry. Winning the selected quest battle satisfies the scripted `win_errantry_war` long-victory objective; reaching 10,000 satisfies `max_chivalry`.

### Green Knight charges

**Applies to:** all four playable factions.

The Green Knight is a unique champion summoned through the campaign UI. The faction begins with zero charges; Chivalry tiers 2, 3, and 4 each expose one charge, while tier 5 exposes 9,999,999 charges, functioning as an unlimited summon. The installed UI text says the summoned character remains for a limited period and cannot be summoned while already active. The decoded script and database rows inspected here do not state the duration, so no exact turn count is asserted.

When no Bretonnian faction is human-controlled, the AI fallback checks each human-capable Bretonnian faction at faction-turn start and attempts to spawn its valid Green Knight unique agent. Human factions instead use the charge-gated UI lifecycle above.

### Peasant Economy

**Applies to:** all four playable factions when human-controlled.

Each owned region contributes two to the Peasant Economy capacity, before additive effects `peasant_increase_per_region` and `peasant_increase_base_amount`; the race's installed faction-trait bundle supplies a base `+6` to the latter. The resulting capacity has a minimum of one. The script counts a fixed list of 16 peasant unit records in non-garrison armies and explicitly excludes armed-citizen/garrison forces.

Exceeding capacity does not block recruitment. Instead, the script calculates the percentage over capacity, capped at 100%, and applies the correspondingly numbered penalty bundle. Farm income is reduced by exactly that percentage. At 80–89% over capacity, replenishment for non-knight units is reduced by 50%; at 90–100% over capacity, it is reduced by 90%. At no overage, the zero bundle grants -100% upkeep to Peasant Mob and -10% upkeep to other non-knight units. Recalculation listeners cover faction turn start, unit merging/destruction or disbanding, confederation, and battles.

### Additional-army upkeep exemption

**Applies to:** all four playable factions when human-controlled.

The campaign's Supply Lines script applies its faction-wide upkeep increment only when the faction has the `additional_army_upkeep` campaign feature. `campaign_features_tables` explicitly disables that feature for `wh_main_feature_bretonnia`. Consequently, recruiting a second or later ordinary army does not add the usual difficulty-scaled Supply Lines percentage to Bretonnian army upkeep. This exemption is separate from the Peasant Economy limits and the Vow-dependent upkeep penalties on knight units; those systems still operate as documented above and below.

### Baseline race operations

**Applies to:** all four playable factions.

The installed Bretonnia faction-trait bundle applies +200% upkeep to each of the Knight's-Vow, Questing-Vow, and Grail-Vow unit classes until the matching character Vow removes its class penalty. It also gives -50% income from post-battle loot, +100% income from raiding, +100% income from sacking, +1 local recruitment capacity, and one fewer turn for both Sea Lane and Underworld Sea journeys. For siege construction, each siege item constructed produces one battering ram or two siege towers. The same bundle supplies the Peasant Economy's base +6 capacity documented above. Hidden army-cap, stance-enablement, and cross-race Seductive Influence implementation rows are not treated as separate player-facing Bretonnian mechanics.

### Blessing of the Lady

**Applies to:** all four playable factions when human-controlled.

After a battle, the primary Bretonnian attacker or defender can gain the army-level Blessing bundle if the army is not a garrison and is not already blessed. The chance is 100% after a heroic victory, 20% after a decisive victory, 10% after a close victory, and 0% after a pyrrhic victory or other result. Withdrawing or retreating removes the bundle; the listener contains a narrow exception for an attacking force that is also a settlement garrison residence. The bundle enables the cataloged Blessing of the Lady force ability; its battle effect is intentionally left to the unit/ability catalog.

### Vows and Troths

**Applies to:** all four playable factions. Male Lords and Repanse use Vows; female characters use Troths. Paladins, Henri le Massif, and Damsels use the corresponding agent progress paths. The Fay Enchantress has special final-Troth reward variants.

The three stages are sequential and each stage requires one selected pledge:

1. **Knight's Vow / Troth of Protection.** A leading Lord can complete the Knowledge pledge by researching five technologies, the Order pledge through five qualifying building completions in the character's region, or the Chivalry pledge by gaining five ranks. The Order listener makes one progress call for every eligible character in the completed building's region; Lords and eligible agents therefore use the same five-completion requirement after selecting the pledge. For agents, Knowledge instead requires five successful hero actions, while Chivalry uses the analogous rank listener.
2. **Questing Vow / Troth of Wisdom.** Campaign requires two qualifying attacking victories in Desert or Jungle siege/settlement battles. Manann/Heroism requires two victories at sea. Protect requires two victories over a unique or legendary Lord belonging to the Ogre, Beastmen, Greenskin, or Dark Elf subcultures. Eligible heroes embedded in the victorious Lord's army receive the scripted progress too.
3. **Grail Vow / Troth of Virtue.** Untaint requires two victories over a unique or legendary Lord from Warriors of Chaos, Daemons/monogods, Skaven, Vampire Counts, or Vampire Coast. Destroy advances when a province capital is razed, with the displayed requirement of five. Valour has an installed evidence conflict: localization tells the player to kill five enemy Lords in battle, while the listener increments the pledge after any battle victory by that character. The latter is the concrete installed script behavior; the guide does not reconcile it speculatively.

Completion traits are campaign state, not ordinary skill-tree nodes. In condensed form: the first Lord stage removes the upkeep penalty from Knight's-Vow units and adds campaign/command benefits; the second does the same for Questing-Vow units and adds movement/offensive or Winds-of-Magic benefits; the final stage does the same for Grail-Vow units and grants the expected Grail package, including immortality and perfect vigour. Agent and Troth rewards differ, and the Fay Enchantress uses dedicated final-Troth effects. Exact trait-effect rows remain traceable in the evidence register rather than being duplicated as a second skill catalog.

Scripted starting completion is asymmetric: Louen Leoncoeur begins with all three stages completed; Alberic de Bordeleaux begins with the Knight's Vow completed; Repanse de Lyonesse begins with the Knight's and Questing Vows completed; Carcassonne receives no equivalent scripted starting progress. AI Bretonnian characters are automatically advanced at ranks 2, 5, and 10.

### Conduct traits and prayer

**Applies to:** all four playable factions.

Campaign listeners award mutually exclusive good or bad behavioral traits from repeated outcomes and conduct. Inputs include win/defeat patterns, peasant-heavy versus knight-heavy victories, sacking, raiding, routing in defeat, fighting Bretonnians or the Empire, fighting Louen, farm or industry completion in the character's region, prolonged presence in hostile territory, low control, reinforcing, and post-battle execution. These traits change faction Chivalry each turn; observed trait levels generally range from +2 up to +8 or from -2 down to -20 per turn depending on the chain and tier.

A Lord stationed in a settlement with the relevant worship chain receives a per-turn attempt to remove one eligible bad trait. The script comment describes displayed chances of 10/20/30%, but its actual random checks are 20/30/40% for the three building tiers. Five praying turns also award the associated positive prayer trait. This discrepancy is reported as implemented script behavior, not normalized building data.

### Technology-triggered confederation dilemmas

**Applies to:** Couronne, Bordeleaux Errant, and Carcassonne. **Excluded:** Chevaliers de Lyonesse, which uses separate mission-triggered confederations.

Completing the named diplomatic technology for Artois, Bastonne, Bordeleaux, Couronne, Carcassonne, Lyonesse, Parravon, or Aquitaine enables confederation diplomacy with that target and, if the target is alive and AI-controlled, opens its dilemma. The two confederating choices pay either Chivalry or treasury; the third declines and grants 200 Chivalry. Minor duchies and Aquitaine cost 700 Chivalry or 5,000 treasury. The playable targets Bordeleaux, Couronne, and Carcassonne cost 1,000 Chivalry or 7,500 treasury.

Human Bretonnian factions are exempt from the generic post-confederation restriction. For factions that are not exempt, the setup script uses five turns for a human confederation and ten for an AI confederation. Its executable exemption table covers the Bretonnian culture and also names Chevaliers de Lyonesse explicitly. This applies whether a confederation came from the technology dilemmas, the Chevaliers missions below, or ordinary diplomacy; it does not mean that every target is available through every route.

### Playable-faction trait differences

**Applies to:** the exact playable faction named in each bullet.

The four start factions add the following campaign-wide operating differences to the shared race systems:

- **Couronne:** +10% movement range for all faction characters, and +50% leadership-aura size for Lords when attacking.
- **Bordeleaux Errant:** +2 recruit rank and -1 local recruitment duration for knight units, +50% income from ports, and immunity to High Seas, Reef, and Storm attrition.
- **Carcassonne:** +5 base Peasant Economy capacity and +15% casualty replenishment.
- **Chevaliers de Lyonesse:** +3 control, -50% upkeep for embedded heroes, +8 melee defence for Questing Knights, and -80 diplomatic relations with Vampire Counts, Vampire Coast, and Tomb Kings factions.

### Chevaliers de Lyonesse: desert supply, banners, and crusader confederations

**Applies only to:** Chevaliers de Lyonesse (`wh2_dlc14_brt_chevaliers_de_lyonesse`).

When a Chevaliers character enters or leaves a settlement, or begins a turn in one, the listener removes any existing desert-supply bundle and then reapplies it for five turns if the army has no other source of desert-attrition immunity. This refreshes the scripted supply while respecting a separate immunity source. Turn-one banner missions ask Repanse to: establish trade with Greybeard's Prospectors (with capturing Vulture Mountain as the fallback if diplomacy fails), defeat three Tomb King armies, and field four Questing Knight or specified Regiment of Renown units. Each grants its named banner ancillary and 200 Chivalry.

Additional timed missions are issued for owning the Coast of Araby province (available rounds 2–4), capturing the Wizard Caliph's Palace on turn 5, the Black Tower of Arkhan on turn 10, and the Black Pyramid of Nagash on turn 20. The first pays 500 treasury and 200 Chivalry; each capture mission pays 1,000 treasury and 200 Chivalry. Completing the Coast of Araby mission triggers an Origo confederation dilemma, and capturing the Wizard Caliph's Palace triggers a Knights of the Flame dilemma. In each, the first choice force-confederates the living target and the second declines; the dilemma payload contains no Chivalry or treasury cost.

The Chevaliers-only mission **Stem the Green Tide** (`wh2_dlc14_brt_repanse_raze_orcs`) becomes eligible while the faction is at war with Savage Orcs. It requires razing one Savage Orc settlement and rewards 1,000 treasury and 200 Chivalry.

The official 8.1 patch notes also specify that Repanse starts with a peace treaty and military access agreement with Lyonesse. This start-state claim is sourced only to the official patch note, not inferred from the campaign scripts above.

Chevaliers also begin with the faction-exclusive Legendary Paladin Henri le Massif alongside Repanse. The installed database permits his subtype only for Chevaliers, uses faction-leader placement for the unique agent, disables UI spawning, and grants no summon charges; no later acquisition listener was found. The start claim is grounded in the official Repanse DLC description and corroborating current faction material rather than a decoded start-position record.

## Faction coverage

- **Couronne** (`wh_main_brt_bretonnia`): all race-wide systems; +10% character movement and +50% attacking Lord aura size; standard Chaos/Greenskin Errantry War; technology-triggered confederation dilemmas; Louen starts with all three Vow stages scripted complete.
- **Bordeleaux Errant** (`wh_main_brt_bordeleaux`): all race-wide systems; knight recruitment, port-income, and sea-attrition faction traits; standard Chaos/Greenskin Errantry War; technology-triggered confederation dilemmas; Alberic starts with only the Knight's Vow scripted complete.
- **Carcassonne** (`wh_main_brt_carcassonne`): all race-wide systems; +5 Peasant capacity and +15% replenishment; standard Chaos/Greenskin Errantry War; technology-triggered confederation dilemmas; no faction-specific starting Vow completion found. The Fay Enchantress uses dedicated final-Troth trait variants.
- **Chevaliers de Lyonesse** (`wh2_dlc14_brt_chevaliers_de_lyonesse`): all race-wide systems; control, hero-upkeep, Questing Knight, and undead-diplomacy faction traits; Tomb Kings/Vampire Coast Errantry War; Repanse starts with Knight's and Questing Vows complete alongside Henri; desert-supply refresh, banner and capture missions, **Stem the Green Tide**, and mission-triggered Origo/Knights of the Flame confederations; excluded from the diplomatic-technology confederation listener.

## Evidence register

### Project catalogs reviewed first

- `data/faction_guides/RESEARCH_SPEC.md` — authoritative scope and document contract.
- `data/economy/README.md`, `data/economy/faction_index__wh3__8.1.1.csv`, and the four Bretonnian economy exports — normalized building coverage and faction keys; used to enforce the catalog boundary.
- `data/unit_stats/README.md`, `data/unit_stats/normalized/bretonnia__wh3__8.1.1__ultra.csv`, and Bretonnian source-export localization — unit, roster, ability, mission, dilemma, incident, effect, and Vow vocabulary without duplicating normalized unit facts.
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 14 indexed Bretonnian skill exports — ordinary skill effects and the presence of hidden Vow placeholder nodes; used to exclude skill-catalog material.

### Installed patch 8.1.1 evidence through read-only RPFM

All paths below were decoded or queried from the installed vanilla packs through the read-only lock wrapper `scripts/rpfm-call-locked.ps1`, with the literal pack placeholder `$CA`.

- `script/campaign/wh_campaign_bretonnia_chivalry.lua` — thresholds, battle-result changes, technology/subculture bonuses, Bretonnian war-declaration penalty, and tier events.
- `script/campaign/main_warhammer/wh_dlc07_peasant_economy.lua` — capacity formula, counted-unit logic, overage computation, and recalculation listeners.
- `script/campaign/main_warhammer/wh_dlc07_blessing_of_the_lady.lua` — acquisition chances and retreat removal.
- `script/campaign/main_warhammer/wh_dlc07_vows.lua` — pledge listeners, progress propagation, AI rank advancement, faction-leader starting progress, and Chivalry-tier defaults.
- `script/campaign/main_warhammer/wh_dlc07_virtues_and_traits.lua` — conduct-trait triggers, Chivalry-per-turn traits, prayer cleanup, and the comment/implementation probability discrepancy.
- `script/campaign/main_warhammer/wh_dlc07_diplomatic_tech.lua` — technology targets and eligibility; explicit Chevaliers exclusion.
- `script/campaign/main_warhammer/wh_dlc07_bretonnia.lua` — final Errantry War choices, victory flags, Repanse mission schedule, and desert-supply listener.
- `script/campaign/main_warhammer/wh_dlc07_the_green_knight.lua` — unique-agent spawn/despawn handling.
- `script/campaign/wh2_dlc14_repanse_confederation.lua` — Origo and Knights of the Flame mission-triggered dilemma behavior.
- `script/campaign/wh_campaign_setup.lua` and `db/campaign_features_tables/data__` — additional-army-upkeep condition, the explicit Bretonnia feature exemption, and the post-confederation cooldown exemption.
- `script/campaign/wh3_main_legendary_characters.lua` — reverse audit of shared recruitable legendary characters; Gotrek and Felix were excluded as a generic multi-race system.
- Database tables: `campaign_group_pooled_resources_tables`, `pooled_resource_threshold_operation_sets_tables`, `campaign_group_pooled_resource_effects_tables`, `effect_bundles_to_effects_junctions_tables`, `campaign_stance_effects_junctions_tables`, `culture_settlement_occupation_options_tables`, `campaign_post_battle_captive_options_tables`, `resource_cost_pooled_resource_junctions_tables`, `unique_agent_pooled_resource_junctions_tables`, `campaign_group_food_unique_agent_charges_tables`, `campaign_group_unique_agents_tables`, `unique_agents_tables`, `faction_agent_permitted_subtypes_tables`, `agent_subtypes_tables`, `campaign_to_agent_subtypes_tables`, `trait_level_effects_tables`, `cdir_events_mission_option_junctions_tables`, `cdir_events_mission_payloads_tables`, `cdir_events_dilemma_payloads_tables`, and `cdir_events_dilemma_choice_details_tables` — campaign availability, numeric thresholds and bundles, active Chivalry costs, trait rewards, mission gates/payloads, unique-character restrictions, and dilemma costs.
- Key search anchors: `wh_main_feature_bretonnia`, `brt_chivalry`, `Bretonnia_Peasant_Units`, `wh_dlc07_blessing_of_the_lady`, `wh_dlc07_bundle_peasant_penalty_`, `win_errantry_war`, `max_chivalry`, `wh2_dlc14_bundle_desert_supplies`, `wh2_dlc14_repanse_mission_`, `wh2_dlc14_brt_repanse_raze_orcs`, and `wh2_dlc14_repanse_confederation`.
- Localization cross-checks: `text/db/bretonnia_vows__.loc.tsv`, `character_trait_levels__.loc.tsv`, `effects__.loc.tsv`, `ui_text_replacements__.loc.tsv`, `uied_component_texts__.loc.tsv`, `missions__.loc.tsv`, `cdir_events_dilemma_choice_details__.loc.tsv`, and `incidents__.loc.tsv` under `data/unit_stats/source_exports/text/db/`.

### Web grounding and vocabulary discovery

- [Creative Assembly: Total War: WARHAMMER III Patch 8.1](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes) — official patch context and Repanse's Lyonesse start-state change.
- [Bretonnia overview](https://totalwarwarhammer.fandom.com/wiki/Bretonnia), [Bretonnia technology tree](https://totalwarwarhammer.fandom.com/wiki/Bretonnia_tech_tree), [Couronne](https://totalwarwarhammer.fandom.com/wiki/Couronne), [Bordeleaux Errant](https://totalwarwarhammer.fandom.com/wiki/Bordeleaux_Errant), [Carcassonne](https://totalwarwarhammer.fandom.com/wiki/Carcassonne), and [Chevaliers de Lyonesse](https://totalwarwarhammer.fandom.com/wiki/Chevaliers_de_Lyonesse) — discovery sources for mechanic and faction vocabulary only; precision claims above were checked against installed files.
- [Current Bretonnia campaign guide](https://gameslantern.com/article/beginners-guide-to-bretonnia-in-total-war-warhammer-iii) — secondary cross-check that identified the Supply Lines exemption for direct verification in the installed campaign feature table and script.
- [Creative Assembly's Repanse de Lyonesse DLC page on Steam](https://store.steampowered.com/app/1158181/Total_War_WARHAMMER_II__Repanse_de_Lyonesse/) — official grounding that Repanse fights alongside Henri le Massif; installed database rows establish exclusivity and unique-agent properties.

### Evidence limitations

- The installed UI establishes that a Green Knight summon is temporary, but the inspected script and database rows did not expose an exact lifetime.
- The Grail Valour pledge's installed localization and listener disagree, as documented above.
- The prayer script's explanatory comment and executable probability checks disagree, as documented above.
- Henri's installed unique-agent rows do not themselves expose start-position binary placement; the starting-alongside-Repanse statement therefore uses the official DLC description with current faction-page corroboration, while installed rows establish exclusivity, faction-leader spawn behavior, disabled UI spawning, and zero charges.
- No external community claim was used for an exact numeric mechanic when installed 8.1.1 evidence was unavailable.
