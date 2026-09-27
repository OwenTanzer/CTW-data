# Greenskins campaign mechanics — patch 8.1.1

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** Total War: WARHAMMER III, patch **8.1.1**, Steam build **24237342**. Race: Greenskins (`greenskins`). Playable factions: 6.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

This guide records campaign mechanics that are not represented adequately by the existing normalized catalogs. Constructible building variants, costs, tiers, prerequisites, and standardized outputs belong to the six Greenskin economy exports. Unit statistics, roster permissions, weapons, mounts, and battle abilities belong to the normalized unit catalog and typed lookups. Ordinary Lord and hero skill-node effects belong to the 19 indexed Greenskin character exports. Those facts are not repeated here. References to units, buildings, technologies, abilities, or Snagla's indexed subtype below identify inputs or outputs of campaign systems, not replacement catalog entries.

## Mechanically relevant material not captured elsewhere

### Reputation and Call to WAAAGH!

**Applies to:** all six playable factions.

Reputation is the pooled resource `grn_waaagh`. The campaign script adds 1 each faction turn; technology `tech_grn_final_1_2` adds another 5 per turn. Battles add Reputation from the participating army's value, relative army strength, and the fraction of the opposing force killed. The resource is capped at 100. At 100, the faction can invoke `wh2_main_ritual_grn_waaagh`, select an enemy settlement as the prize, and choose Gork or Mork. The ritual lasts 20 turns and spends 100 Reputation. Its temporary choice bundle also lasts 20 turns and supplies the matching faction-leader Big WAAAGH! ability package.

The target's current strength rank fixes the reward tier when the WAAAGH! begins: rank 1–10 gives tier 3, rank 11–30 tier 2, and lower-ranked targets tier 1. The target owner's culture fixes the trophy family; the installed mappings cover humans, Dwarfs, Chaos, undead, Elves, Greenskins, Lizardmen, Skaven, Daemons, and Ogres. The active trophy is previewed while the WAAAGH! is running. Success requires the prize to have been razed during the ritual, or to be held by the caller, razed, or abandoned when the ritual ends.

On success, the previous permanent WAAAGH! trophy is removed and replaced by the new culture/tier bundle. The faction also gains 10 Reputation per reward tier and receives a custom reward dilemma whose choices can supply treasury, Scrap, or units to the dedicated WAAAGH! mercenary pool. The older direct unit-pool grant remains commented out in the installed script; the dilemma is the operative route. Failure clears the preview and active target state without installing the trophy. The attached WAAAGH! armies and their dedicated post-success recruitment pool are campaign state, not ordinary roster rows.

### Scrap and permanent unit upgrades

**Applies to:** all six playable factions.

Scrap (`grn_salvage`) is acquired after battles and razing settlements and is spent on technologies and permanent unit equipment upgrades. Since Update 6.0, a unit can carry multiple compatible upgrades; every upgrade already applied adds 30 Scrap to the next upgrade's cost. The upgrade controller initially locks technology-specific choices and unlocks their junctions when the corresponding eight Scrap technologies are researched. `tech_grn_final_1_1` adds 10 Scrap per turn to a human faction.

Each playable faction has one mutually exclusive faction upgrade junction: Bonerattlaz `wh2_dlc15_grn_upgrade_sorcery_weapon`; Crooked Moon `wh2_dlc15_grn_upgrade_fungus_flask`; Grimgor's 'Ardboyz `wh2_dlc15_grn_upgrade_immortual_armour`; The Bloody Handz `wh2_dlc15_grn_upgrade_idol_of_gork`; Broken Axe `wh3_dlc26_grn_upgrade_less_lucky_banner`; and Ironclaw Orcs `wh3_dlc26_grn_upgrade_big_banner_boyz`. Other factions' exclusive junctions are script-locked at campaign start. AI Greenskin factions do not use Scrap: every tenth turn the script attempts to purchase one randomly available upgrade for each eligible non-garrison unit instead.

The individual upgrade effects remain in the linked effect relations and are not duplicated as a second unit-stat catalog here.

### Technology-unlocked named Lords

**Applies to:** all six playable factions.

Two Greenskin technologies add named Lords to the faction recruitment pool. `tech_grn_mid_1_1` applies `wh2_dlc15_effect_greenskin_lord_unlock_1`, unlocking the Goblin Great Shaman Raknik Spiderclaw (`wh2_dlc15_grn_goblin_great_shaman_raknik`); `tech_grn_mid_2_1` applies `wh2_dlc15_effect_greenskin_lord_unlock_2`, unlocking the Orc Warboss Oglok the 'Orrible (`wh2_dlc15_grn_orc_warboss_oglok`). Both subtypes are permitted for every playable Greenskin faction. Their ordinary skill trees and effects remain in the character catalog; this records only their campaign acquisition gate.

### Tribal confederation after defeating a faction leader

**Applies to:** all six playable factions, subject to the losing-faction gates below.

When a Greenskin defeats another Greenskin faction leader, the shared subjugation listener checks that both factions have the same culture, the loser is AI-controlled, the target remains valid, and the battle was not an excluded invasion context. A losing faction that is vassal to any human faction, or is a Warriors of Chaos vassal, is ineligible.

A human victor receives the Greenskin confederation dilemma. The script selects the execution-capable variant unless the defeated faction is itself potentially human-playable, in which case it uses the no-execution variant. The confederation outcome is therefore mediated by the dilemma rather than forced immediately. An AI victor that passes the same checks force-confederates the loser automatically.

### Greenskin army stances and engine-backed campaign features

**Applies to:** all six playable factions.

The Underway stance moves an army across otherwise impassable terrain, but the army must emerge at a valid surface destination and can be intercepted into an underground battle by nearby armies. Raidin' Camp combines raiding with recruitment while in enemy territory; installed UI rules make it the Greenskin stance that permits global and allied recruitment away from a garrison.

The campaign feature table also enables `enslaving_captives_replenishes_hitpoints` and `settlement_vandalisation` for `wh_main_feature_greenskins`. These are the engine-backed Eat Captives replenishment and Vandalised Structure behaviors. Their existence and applicability are explicit in the feature table, while their result magnitudes and native execution are not exposed by the decoded Lua inspected for this guide; no unsupported numeric values are asserted.

Ordinary Supply Lines remains enabled. The reverse pass found no Greenskin-specific replacement for climate suitability, Growth, colonization, foreign settlement slots, or generic occupation ownership. Those generic rules are excluded.

### Broken Axe: Grom's Cauldron and Blacktoof progression

**Applies only to:** Broken Axe (`wh2_dlc15_grn_broken_axe`).

Grom's Cauldron tracks ingredients, cooked dishes, recipes, food challenges, merchant timing, and Grom's food trait as saved campaign state. The installed data contains ten ordinary recipes and five secret recipes. Troll meat begins unlocked. Other ingredients are unlocked through specific actions, including possessing listed mount ancillaries, completing a successful WAAAGH!, satisfying missions, holding the Elven WAAAGH! trophy, reaching hero rank 15, sacking specified subcultures, recruiting or defeating listed units, and eligible sea encounters.

The Food Merchant is scheduled on a ten-turn cadence. Cooking can schedule her for the following turn, except when the dish was cooked by the Hag. Merchant dilemmas supply ingredient, recipe, or food-challenge outcomes. Completing food challenges expands the secondary-ingredient capacity until two additional slots are available, permitting four ingredients in a dish; the three challenge rewards are respectively 3,000 treasury, 3,000 treasury, and then 150 Scrap plus 5,000 treasury. Cooking 4, 8, 12, and 15 unique recipes advances Grom's food-collector trait.

Blacktoof's human-only chain begins on turn 2 and then advances through cooking a dish, meeting the Food Merchant, unlocking six ingredients, and cooking twelve recipes. Intermediate scripted rewards include treasury, Scrap, and a permanent secret-recipe unlock bundle. The subsequent prophecies include the all-Cauldron-slots condition; completing that condition unlocks another secret recipe and pays 8,000 treasury. Completing `wh2_dlc15_grn_grom_black_toof_4` marks the scripted `complete_blacktoof_revenge` long-victory objective. The current Cauldron script also gives AI Broken Axe a random cooking action every 12 turns and food-trait progress every 40 turns.

The installed cooking-recipe relation could not be recovered through a stable narrow decode during this task, so this guide does not assert an exact Scrap cooking cost or dish-effect duration.

### Ironclaw Orcs: Da Plan

**Applies only to:** Ironclaw Orcs (`wh3_dlc26_grn_gorbad_ironclaw`).

Da Plan is a Lord-level tactics system backed by the pooled resource `wh3_dlc26_grn_yooreeka`. Four tactics begin unlocked: `light_em_up_1`, `orcs_are_da_best_1`, `erd_mentality_1`, and `netted_targets_1`. The installed controller contains 34 additional mission tactics. Non-scripted tactic missions are issued at the start of a human campaign; successful missions append their tactic to saved faction state and unlock it for every current general. Newly recruited or confederated generals are synchronized with the saved unlock list.

Every battle won by Gorbad as faction leader adds 2 Planz. Script-tracked tactic missions additionally require 50 Gorbad victories, three ambush victories, 10/50/100 casts from the enumerated Big and Little WAAAGH! spell list, and one/three starts of the Call to WAAAGH! ritual. These counters and the unlocked-tactic list are saved and restored.

Creative Assembly's current official description states that a Lord can use one to three active tactics depending on rank and that tactics require matching units in the Lord's army. The installed initiative table was decoded once under the constrained-memory exception, but its large response was truncated before the Greenskin rows could be retained safely. Exact per-tactic point costs, durations, and cooldowns are therefore not reproduced here.

### Crooked Moon: Karak Eight Peaks lock

**Applies only to:** Crooked Moon (`wh_main_grn_crooked_moon`).

Until Crooked Moon owns `wh3_main_combi_region_karak_eight_peaks`, the campaign applies `wh_dlc06_skarsnik_karak_owned_false`, giving -2 control in every owned province, and locks the Orc military chains `wh_main_grn_military_1`, `_2`, `_3`, `wh_main_grn_boars_2`, `wh3_dlc26_grn_boars_3`, `wh_dlc06_grn_boars_2_skarsnik`, and `wh3_dlc26_grn_boars_3_skarsnik`. Forbidden Orc buildings found after occupying a settlement are dismantled immediately.

Owning Karak Eight Peaks removes those restrictions and swaps to `wh_dlc06_skarsnik_karak_owned_true`, which enables Skarsnik's Stalk stance. Losing the region reapplies the restrictions and immediately dismantles every listed Orc building across all Crooked Moon regions. This is a scripted availability rule; the ordinary building rows themselves remain in the economy catalog.

The same Eight Peaks controller permanently disables peace between Crooked Moon and Clan Angrund (`wh_main_dwf_karak_izor`).

### The Bloody Handz: Savage Orc-site buildings

**Applies only to:** The Bloody Handz (`wh_main_grn_orcs_of_the_bloody_hand`).

Effigies of Gork & Mork (`wh3_dlc26_special_gork_mork_idols_1`) is linked to the Savage Orc settlement-resource set rather than being generally constructible. The current official location list is Darkhold, Agrul Mighdal, Ash Ridge Mountains, Ekrund, Galbaraz, Gor Gazan, Jade Wind Mountain, Pahuax Statues of the Gods, Sun-Tree Glades, and The Bone Gulch. Wurrzag also has fixed landmark chains at Cuexotl (Bone Nose Idols), Springs of Eternal Life (Bonewood Totems), and Stormhenge (Iron Penz). Their costs and effects remain in the economy catalog; the uncataloged fact here is where the chains can exist.

### Snagla Grobspit acquisition

**Applies to:** any of the six playable Greenskin factions that owns the Omens of Destruction Greenskin entitlement. Immortal Empires mission key: `wh3_dlc26_ie_grn_snagla_stage_1`.

Completing any tier of the Forest Beasts/Spider Rider building chain (`wh_main_grn_forest_beasts_1`, `_2`, or `_3`) issues Snagla's mission. It requires owning six units drawn from Deff Creepers, Forest Goblin Spider Riders, and their archer variant. Success pays 2,500 treasury; the Lua listener then spawns Snagla (`wh3_dlc26_grn_snagla_grobpsit`) for the completing faction, gives Fangspike and Sting of Snagla, and cancels competing human missions so the unique hero cannot be duplicated.

If no human Greenskin faction is eligible for the chain, the turn-based fallback assigns Snagla to the strongest valid AI Greenskin faction from turn 30 onward. Snagla's unit and ordinary skill data remain in the existing catalogs; this subsection records only the campaign acquisition lifecycle.

## Faction coverage

- **Bonerattlaz** (`wh2_dlc15_grn_bonerattlaz`): all race-wide systems, including the two technology-unlocked named Lords; Sorcery Weapon as its exclusive Scrap upgrade; eligible for Snagla with the required entitlement. No further faction-specific campaign system was located beyond cataloged buildings, units, skills, traits, and start state.
- **Broken Axe** (`wh2_dlc15_grn_broken_axe`): all race-wide systems, including the two technology-unlocked named Lords; Less Lucky Banner as its exclusive Scrap upgrade; Grom's Cauldron and Blacktoof progression; eligible for Snagla.
- **Ironclaw Orcs** (`wh3_dlc26_grn_gorbad_ironclaw`): all race-wide systems, including the two technology-unlocked named Lords; Big Banner Boyz as its exclusive Scrap upgrade; Da Plan and Planz; eligible for Snagla.
- **Crooked Moon** (`wh_main_grn_crooked_moon`): all race-wide systems, including the two technology-unlocked named Lords; Fungus Flask as its exclusive Scrap upgrade; Karak Eight Peaks building/control/stance lock and forced no-peace rule; eligible for Snagla.
- **Grimgor's 'Ardboyz** (`wh_main_grn_greenskins`): all race-wide systems, including the two technology-unlocked named Lords; Immortul Armour as its exclusive Scrap upgrade; eligible for Snagla. No further faction-specific campaign system was located beyond cataloged differences.
- **The Bloody Handz** (`wh_main_grn_orcs_of_the_bloody_hand`): all race-wide systems, including the two technology-unlocked named Lords; Idol of Gork as its exclusive Scrap upgrade; Savage Orc-site and fixed-landmark availability; eligible for Snagla. Building costs and effects are represented by the economy catalog.

## Evidence register

### Project catalogs reviewed first

- `README.md`, `data/faction_guides/RESEARCH_SPEC.md`, and the economy, unit-stat, and skill-tree READMEs — project contract and catalog boundaries.
- `data/economy/faction_index__wh3__8.1.1.csv` and all six exports under `data/economy/factions/greenskins/` — playable faction boundary and normalized constructible-building coverage.
- `data/unit_stats/normalized/greenskins__wh3__8.1.1__ultra.csv`, typed unit lookups, manifests, and English source-export localization — roster permissions, stats, abilities, mounts, and campaign vocabulary.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 19 indexed exports under `data/skill_trees/characters/greenskins/` — ordinary character skill coverage, including Snagla's indexed subtype.

### Installed patch 8.1.1 evidence through locked read-only RPFM

All RPFM requests for this task were serialized through `scripts/rpfm-call-locked.ps1`; operations requiring the merged vanilla packs used the literal `$CA` placeholder. Existing narrow extracts were used where their exact paths matched the installed source.

- `script/campaign/wh2_dlc15_waaagh.lua` — resource gain, ritual state, reward rank/culture mappings, Gork/Mork bundles, target-success tests, trophy replacement, Reputation reward, custom dilemma payload construction, AI handling, and saved state.
- `script/campaign/wh2_dlc15_salvage.lua` — upgrade locks, faction-exclusive junctions, technology unlocks, +10 per-turn technology reward, and ten-turn AI upgrading.
- `script/campaign/wh3_campaign_subjugation.lua` — same-culture leader-defeat gates, human dilemma branch, vassal exclusions, and automatic AI confederation.
- `script/campaign/wh2_dlc15_grom_cauldron.lua` and `script/campaign/wh2_dlc15_grom_story.lua` — ingredient listeners, merchant cadence, recipes and challenges, trait thresholds, AI cadence, Blacktoof chain, payloads, victory flag, and saved state.
- `script/campaign/wh3_dlc26_da_plan.lua` — starting and mission tactics, Planz gain, scripted counters, initiative synchronization, and saved state.
- `script/campaign/main_warhammer/wh_dlc06_karak_eight_peaks.lua` — Crooked Moon building restrictions, occupation dismantling, ownership/loss transitions, and bundle swap.
- `script/campaign/wh3_main_legendary_characters.lua` — Snagla entitlement/culture gates, building trigger, mission success spawn, ancillary grant, cross-player cancellation, and turn-30 AI fallback.
- `script/campaign/wh_campaign_setup.lua` and `db/campaign_features_tables/data__` — ordinary Supply Lines dispatch and the Greenskin Eat Captives/vandalisation feature flags.
- Database relations: `rituals_tables` (`wh2_main_ritual_grn_waaagh`, cast time 20); `campaign_group_rituals_tables`; `effect_bundles_to_effects_junctions_tables` (Skarsnik bundles and +30 Scrap incremental-upgrade effect); `technology_effects_junction_tables` (`tech_grn_mid_1_1` and `tech_grn_mid_2_1` named-Lord unlocks); `faction_agent_permitted_subtypes_tables` (Raknik/Oglok permissions); `missions_tables`; `cdir_events_mission_option_junctions_tables`; and `cdir_events_mission_payloads_tables` (Snagla objective and reward).
- Wurrzag location relations in the economy source exports: `building_chain_set_items_tables` (`wh3_dlc26_special_gork_mork_idols` -> `wh3_main_secondary_addon_res_savage_orcs`, plus the three fixed landmark sets), `building_chain_availability_sets_tables`, `building_culture_variants_tables`, and `building_effects_junction_tables`.
- Reverse-search anchors: all six faction keys; `wh_main_grn_azhag_the_slaughterer`, `wh2_dlc15_grn_grom_the_paunch`, `wh3_dlc26_grn_gorbad_ironclaw`, `wh_dlc06_grn_skarsnik`, `wh_main_grn_grimgor_ironhide`, `wh_dlc06_grn_wurrzag_da_great_prophet`, `wh3_dlc26_grn_snagla_grobpsit`; `wh_main_feature_greenskins`; `grn_waaagh`; `grn_salvage`; `wh2_main_ritual_grn_waaagh`; and `wh3_dlc26_grn_yooreeka`.
- Localization cross-checks under `data/unit_stats/source_exports/text/db/`: `pooled_resources__.loc.tsv`, `ui_text_replacements__.loc.tsv`, `cooking_recipes__.loc.tsv`, `initiatives__.loc.tsv`, `initiative_sets__.loc.tsv`, `missions__.loc.tsv`, `dilemmas__.loc.tsv`, `effect_bundles__.loc.tsv`, and building-chain/variant localization.

### Web grounding and vocabulary discovery

- [Creative Assembly: Gorbad Ironclaw and Da Plan](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/36-omens-of-destruction-gorbad) — current official description of tactics, unit requirements, Lord-rank capacity, and unlock routes.
- [Creative Assembly: Update 6.0.0](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0) — official Scrap multi-upgrade change, dedicated WAAAGH! pool, Skarsnik's revised Eight Peaks restriction, and Greenskin rework context.
- [Creative Assembly: Patch 8.1](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101) — official patch context for the installed snapshot.
- [Omens of Destruction: Gorbad Ironclaw](https://store.steampowered.com/app/2574900/) — official DLC/entitlement grounding.
- [Greenskins overview](https://totalwarwarhammer.fandom.com/wiki/Greenskins), [Call to WAAAGH!](https://totalwarwarhammer.fandom.com/wiki/Call_to_WAAAGH!), [Grom's Cauldron](https://totalwarwarhammer.fandom.com/wiki/Grom%27s_Cauldron), [Da Plan](https://totalwarwarhammer.fandom.com/wiki/Da_Plan), and [Crooked Moon](https://totalwarwarhammer.fandom.com/wiki/Crooked_Moon) — secondary discovery vocabulary only; precise claims above were checked against installed files or explicitly attributed to Creative Assembly.
- [Current Gorbad campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3435073360) — secondary omission checklist only; no numeric claim relies on it.

### Evidence limitations and exclusions

- The full `initiatives_tables` relation had no safe key-filtered route. Its one justified decode completed but the host truncated the large response before the Greenskin rows could be retained. Exact Da Plan tactic costs, durations, and cooldowns are omitted rather than inferred.
- A narrow installed decode did not locate the expected `cooking_recipes_tables/data__` path. Exact Cauldron cooking cost and effect duration are therefore omitted; script-observable recipes, unlocks, counters, and rewards remain documented.
- Eat Captives replenishment and settlement vandalisation are enabled explicitly by the campaign feature table, but their native execution and numeric result values were not exposed by the inspected decoded Lua.
- Creative Assembly's Gorbad introduction describes the Effigies' +5 Winds capacity as conditional on a `Da Tru Prophet` dilemma effect. In the installed 8.1.1 building-effect row the +5 effect has no context condition, and no matching localization or campaign controller was recovered. The guide therefore follows the installed relation and does not assert a dilemma gate.
- Ordinary Supply Lines, climate suitability, Growth, colonization, generic occupation ownership, quest-item battles, generic victory objectives, faction traits, building effects, unit effects, and skill effects were excluded as shared rules or named catalog material unless a separate Greenskin script changed their operation above.
