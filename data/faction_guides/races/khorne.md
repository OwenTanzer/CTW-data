# Khorne campaign mechanics — patch 8.1.1

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Khorne | `race_slug=khorne` | **Playable factions:** 3

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe the 207 applicable building-level rows for each playable faction, including ordinary costs, build times, prerequisites, and standardized outputs. The normalized unit file and typed lookups already describe Khorne's roster, faction permissions, unit statistics, and battle abilities. The character files already contain the skill trees for all 13 indexed Khorne lords and heroes. Those rows are not repeated here. This document records the scripted resources, force state, settlement rules, foreign-slot network, progression counters, and faction-specific campaign lifecycles needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Skulls, the Skull Throne, and Combat Trials

**Applicability:** all three playable Khorne factions.

Skulls are Khorne's campaign resource for occupying settlements, creating Blood Hosts, buying technologies, and invoking the Skull Throne. The Skull Throne is a ten-action progression arranged in four tiers. The three tier-1 actions cost 1,000 Skulls each, the three tier-2 actions 2,000 each, the three tier-3 actions 4,000 each, and the tier-4 action 8,000. Each action also advances lifetime Skull expenditure by the same amount; the action records carry a 10-turn cooldown. Among the script-controlled actions, `wh3_dlc26_ritual_kho_the_skull_throne_3_1` restores the faction leader's action points, `_3_2` fully heals the leader's force, and `_4_1` creates a Blood Host. The leader actions are unavailable while the leader has no force.

The channeling stance is Khorne's **Combat Trials**: at faction-turn start it awards one Skull per unit in the army. Battles not involving Khorne can also create collectible skull piles for a human Khorne faction. Their value is `clamp(floor(total casualties × 0.2 + 1), 50, 500)` before the faction's `skull_piles_modifier`; their lifetime is clamped to 10–40 turns according to the distance of the closest Khorne character. Spawn chance is affected by local Khorne/Chaos corruption, how many piles already exist, and whether a Khorne faction can see the battle.

### Bloodletting and Blood Hosts

**Applicability:** all three playable Khorne factions.

Bloodletting is stored per army as the streak `wh3_main_kho_win_streak`. Its four active bands cover 0–1, 2–4, 5–7, and 8 or more victories. Update 6.0 describes the current benefits as army replenishment, upkeep, and recruitment bonuses. A surviving localisation string instead mentions provincial Growth; because that conflicts with the current official description and the exact effect relation could not be decoded safely, Growth is not asserted here.

The **Blood for the Blood God** occupation decision (`1673500944`) razes a settlement and creates a temporary Blood Host. The script generates nine units before modifiers, clamps the final size to 1–19, and guarantees a Flesh Hound unit, a Fury unit, and four Bloodletter units before filling the remaining slots from a randomized Khorne pool. Blood Hosts have no upkeep. A Skull Throne upgrade can replace the spawned Herald general with an Exalted Bloodthirster. A new host has four turns of protection from its inherent attrition; each completed battle adds two turns plus applicable modifiers, with the protected duration capped at five. Hotfix 6.0.3 additionally makes the Blood-Host occupation option more expensive while Blood Hosts remain on the map.

### Razing, ruin attraction, and settlement type

**Applicability:** all three playable Khorne factions.

Khorne has two scripted razing choices: **Blood for the Blood God**, which creates a Blood Host, and **Skulls for the Skull Throne** (`2135151227`), which harvests Skulls. Direct occupation spends Skulls rather than using a normal colonization payment.

**Drawn to Destruction** tests abandoned settlements once per world round after the opening round. Every owned source region carrying the spread bonus rolls independently for every ruin in its province; its chance is the sum of source-region, source-province, and target-region bonus values. Success transfers the ruin to the source owner, while failure applies the target-tracking state used by later rolls. Ruins inside a Beastmen-defiled bloodground are excluded. Update 6.0 adds a three-turn devastated-settlement state to ruins created by Khorne: during it they cannot be manually recolonized by any faction but remain valid Drawn-to-Destruction targets.

Update 6.0 also divides Khorne settlements into **Mortal** and **Daemonic** types. Mortal units recruit only from Mortal settlements and daemonic units only from Daemonic settlements; the economy source records identify the corresponding sets as `wh3_dlc26_set_khorne_settlement_mortal` and `wh3_dlc26_set_khorne_settlement_daemon`.

### Burning Books of Khorne

**Applicability:** all three playable Khorne factions.

The rare-item system can begin an eight-volume Khorne Book sequence represented by four paired items. While the current pair is equipped, a victory in which its lord is the primary participant has a 50% chance to award the next globally unowned Khorne pair. Once the faction owns all four pairs and the fourth is equipped, the following character-turn check removes the set and triggers the Khorne Books dilemma, which awards the combined Book of Khorne.

The combined book adds a campaign rule beyond its displayed ancillary effects: regions razed by its bearer become permanently unavailable to manual occupation. Khorne's automatic ruin colonization remains able to claim those regions, so Drawn to Destruction is the explicit exception to the permanent block.

### Chaos cult network

**Applicability:** all three playable Khorne factions.

All three faction keys map to the Khorne cult slot set `wh3_main_slot_set_kho_cult`. The ordinary cult-building rows are present in the economy exports, but their conditions and one-shot campaign actions are not flattened into the faction CSVs. At the 50-Khorne-corruption condition, `wh3_main_kho_cult_2` produces 30 Skulls and 200 foreign-building income. `wh3_main_kho_cult_3` instead grants one additional turn of initial Blood Host attrition protection and +2 melee attack to Blood Hosts at that corruption condition; its positive-control condition applies −1 control in the owner's provinces.

The Trial `wh3_main_cult_magus_trial_2` spawns a Khorne Cult Magus and then dismantles itself. Cult actions can spread a new cult into an adjacent region on the owner's turn. The destructive capstones have immediate faction-wide consequences: `wh3_main_kho_cult_4` replenishes all of the faction's units and starts a war with a random eligible faction; `wh3_main_kho_cult_special` grants 5,000 treasury and 1,000 Skulls and also starts a random war; `wh3_main_kho_cult_teleport` summons the faction leader to the cult. Each of these capstone actions destroys its cult.

### Pillars of Khorne technology progression

**Applicability:** all three playable Khorne factions.

Thirty Pillar technologies begin script-locked. They unlock in six-key groups when the faction's persisted count of battle victories reaches 5, 10, 15, 20, and 25. The battle listener credits every victorious participating Khorne faction, including allied participants; this is independent of whether the army's ordinary technology effects appear in the economy or skill catalogs.

### Unholy Manifestations

**Applicability:** `wh3_main_kho_exiles_of_khorne` and `wh3_dlc26_kho_skulltaker`; `wh3_dlc26_kho_arbaal` is excluded from the campaign group.

The Khorne Great Game group `wh3_main_feature_khorne_excluding_arbaal` supplies four manifestation families: **Eternal War**, **Khorne's Glare**, **Slaughter Incarnate**, and **Call of Battle**, each with base and upgraded ritual records. Two upgraded results have additional scripted state changes: upgraded Khorne's Glare raises the target settlement's primary slot to level 2 and heals its garrison, while upgraded Call of Battle removes 100 each of Chaos, Skaven, Vampiric, Nurgle, Slaanesh, and Tzeentch corruption and adds 100 Khorne corruption in the target province. The decoded files do not expose the engine-side Great Game transition that selects upgraded records, so no unsupported upgrade threshold is stated.

### Blooded Wanderers: Cloak of Skulls

**Applicability:** only `wh3_dlc26_kho_skulltaker`.

Skulltaker earns **Champion's Essence** when the enemy general is actually removed after a battle. A target lord's value is 5 plus rank plus battles won, with another 10 if that subtype has never been defeated; an undefeated unique lord doubles the resulting value. The Cloak panel unlocks at 25 faction Essence. It contains ten permanent skull chains with three levels each. Their level costs are 0/25/50 for chain 1; 25/50/100 for chains 2–3; 50/100/200 for chain 4; 100/200/400 for chains 5–8; and 200/400/800 for chains 9–10.

Several rewards scale with the total number of empowered skulls, while others dispatch post-defeat bonuses through campaign bonus values. Those hooks can award Skulls, spread corruption, heal every Blood Host, reveal ruins, create a Blood Host, grant experience, colonize ruins in a province, restore movement, heal an army, or relocate skull piles. The faction also has the enemy-force-targeted ritual `wh3_dlc26_skulltaker_teleport`; its precise Cloak unlock dependency is not asserted because that relation was not available in the narrow extracts.

### Challengers of Khorne: Challenges, Favour, and defeat state

**Applicability:** only `wh3_dlc26_kho_arbaal`.

Arbaal's panel unlocks at 5 **Favour** and then maintains eight target-army missions: three Worthy/easy, three Perfect/medium, and two Ultimate/hard Challenges. If the map cannot supply a suitable target in a strength band, the script can create an invasion army. Any Arbaal-faction army can defeat the target, but only Arbaal travels to it. Travel is blocked after he has already travelled that turn, while he or the target is at sea, while he is recruiting, or when he stands in a region owned by a faction already at war with him.

Easy, medium, and hard completions respectively grant 5/10/15 Favour and 2,000/4,000/8,000 treasury. Easy also grants 200 Skulls. Medium randomly grants 400 Skulls or a five-turn recruitment-cost bundle. Hard randomly grants 800 Skulls, a stronger five-turn recruitment-cost bundle, or a five-turn post-battle-loot bundle. The short and long scripted victory missions require eight and fifteen completed Challenges. Boons consume Favour per turn and remain active until deactivated; their individual DB effects and costs are left to their current UI rather than reconstructed from an incomplete relation.

If Arbaal's own character loses a battle, a human player receives a two-outcome dilemma: one outcome removes all Favour and applies `wh3_dlc26_trait_arbaal_lost_battle`, while the other kills the faction. AI Arbaal always receives the first consequence. The AI does not operate the challenge missions or travel ritual; instead, each victory grants it 200 Skulls, and it can receive a Blood Host when its 14-turn counter has elapsed.

### Karanak, Scyla, and Skarr campaign acquisition

**Applicability:** all three playable Khorne factions, subject to the DLC gates below.

The character catalog records these heroes and their skill trees, not how they enter a campaign:

- **Karanak** becomes eligible at faction-leader rank 16 through mission `wh3_pro12_mis_ie_kho_karanak_unlock_01`, followed by choice dilemma `wh3_pro12_kho_karanak_choice`. The campaign script has no `require_dlc` field, but current official support identifies Karanak as a CA Account promotion, so access still depends on that account unlock. AI fallback occurs on turn 25, with Exiles of Khorne preferred when applicable.
- **Scyla Anfingrimm** requires the Omens of Destruction Khorne entitlement. He becomes eligible at rank 12 through a two-stage mission chain; AI fallback is turn 30. A stale script comment says rank 10, but the executable field is 12.
- **Skarr Bloodwrath** also requires the Omens of Destruction Khorne entitlement. Constructing `wh3_main_kho_infra_champion_1` or `_2` starts his chain: first recruit one Skullreaper or Wrathmonger, then kill 1,000 enemies with the `wh3_dlc26_skullreapers_wrathmongers` unit set. He spawns after completion; AI fallback is turn 30.

## Faction coverage

- **Exiles of Khorne** — `wh3_main_kho_exiles_of_khorne`: all race-wide sections; Unholy Manifestations; Karanak, Scyla, and Skarr acquisition. No additional Skarbrand-only panel, resource, mission controller, or campaign lifecycle was located; ordinary displayed faction effects remain outside this mechanics supplement.
- **Blooded Wanderers** — `wh3_dlc26_kho_skulltaker`: all race-wide sections; Unholy Manifestations; Cloak of Skulls and Champion's Essence; Karanak, Scyla, and Skarr acquisition.
- **Challengers of Khorne** — `wh3_dlc26_kho_arbaal`: all race-wide sections; Challenges, Favour, travel, defeat state, and AI fallback; Karanak, Scyla, and Skarr acquisition. Arbaal is explicitly excluded from Khorne's Unholy Manifestation campaign group.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all three CSVs under `data/economy/factions/khorne/`.
- `data/economy/source_exports/db/building_effects_junction_tables/data__.tsv` and relevant building-set, ancillary, and Book-effect localisation source exports.
- `data/unit_stats/normalized/khorne__wh3__8.1.1__ultra.csv`, `data/unit_stats/lookups/unit_rosters__wh3__8.1.1__ultra.csv`, and `data/unit_stats/lookups/unit_abilities__wh3__8.1.1__ultra.csv`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 13 files under `data/skill_trees/characters/khorne/`.

### Installed patch 8.1.1 evidence through read-only RPFM

Read from merged vanilla `GameFiles` with literal `pack_key=$CA`, using the serialized locked wrapper:

- `script/campaign/wh3_campaign_khorne_skulls.lua` — Skull Throne dispatch, skull-pile generation and collection, Combat Trials, occupation decision `1673500944`, Blood Host composition, general substitution, and attrition-protection state.
- `script/campaign/wh3_campaign_bonus_values.lua` — Drawn-to-Destruction round listener, chance accumulation, target tracker, transfer, and Beastmen-bloodground exclusion.
- `script/campaign/wh3_campaign_daemon_cults.lua` — `faction_to_cult`, Khorne Cult Magus Trial, adjacent spread, capstone payloads, random-war dispatch, and cult destruction.
- `script/campaign/wh3_campaign_unholy_manifestations.lua` — upgraded Khorne manifestation settlement and corruption changes.
- `script/campaign/wh3_campaign_tech_tree.lua` — the 30 Khorne lock keys, persisted battle counter, allied-participant credit, and 5/10/15/20/25 thresholds.
- `script/campaign/wh3_dlc26_cloak_of_skulls.lua` — Essence formula and award condition, panel threshold, permanent ritual progression, scaling state, and post-defeat bonus-value hooks.
- `script/campaign/wh3_dlc26_arbaal_wrath_of_khorne.lua` — mission pools, target generation, rewards, travel, victory counters, loss dilemma, faction-death branch, and AI substitutions.
- `script/campaign/wh3_main_legendary_characters.lua` — Karanak, Scyla, and Skarr faction eligibility, ranks, mission/dilemma chains, building/unit-set triggers, entitlement fields, and AI fallback turns.
- `script/campaign/wh3_campaign_rare_items.lua` — Khorne Book-volume progression, equipped-volume victory checks, combined-book dilemma, and the final book's permanent occupation block.
- `db/rituals_tables/data__` — the ten `wh3_dlc26_ritual_kho_the_skull_throne_*` records and cooldowns; `wh3_dlc26_skulltaker_teleport` target/category.
- `db/resource_cost_pooled_resource_junctions_tables/data__` — Skull Throne and Cloak costs and lifetime-progress transactions.
- `db/campaign_streaks_tables/data__` and `db/campaign_streak_effects_tables/data__` — `wh3_main_kho_win_streak` bands.
- English localisation records for `wh3_main_feature_khorne_excluding_arbaal`, `wh3_main_ritual_kho_gg_1..4`, the devastation/travel restrictions, and named UI resources.

### Web grounding

- Creative Assembly, [Update 6.0.0](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0) — current Khorne rework, settlement split, Bloodletting description, and devastation state.
- Creative Assembly, [Skulltaker and the Cloak of Skulls](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/37).
- Creative Assembly, [Arbaal and the Challenges of Khorne](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/40).
- Creative Assembly, [Patch 5.2 cult rework](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/29).
- Creative Assembly, [Patch 5.1 and Karanak](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/23-total-war-warhammer-iii-patch-5-1-0).
- Sega Support, [CA Account promotion: Karanak](https://support.sega.com/hc/en-us/articles/41530039659281-CA-ACCOUNT-PROMOTION-KARANAK).
- Creative Assembly, [Patch 6.2](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/71) and [Hotfix 6.2.2](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-total-war-warhammer/threads/10367-total-war-warhammer-iii-hotfix-6-2-2) — Burning Books of Khorne rollout and fixes.
- Creative Assembly, [Hotfix 6.0.3](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/8436) — active-Blood-Host occupation-cost interaction.
- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- [Current community campaign overview](https://www.youtube.com/watch?v=_zYOBN12LOU) was used only as an omission checklist; no precise rule relies on it.

### Evidence limitations

- A decode of the high-cardinality effect-bundle relation destabilized the shared RPFM endpoint and was not retried. Consequently, exact Bloodletting effect magnitudes, most passive Skull Throne effect values, and the complete Unholy Manifestation payload matrix are omitted rather than inferred.
- The decoded records expose base and upgraded Khorne manifestation keys but not the engine-side Great Game transition selecting them. No unsupported transition threshold is asserted.
- Current official Update 6.0 and surviving Bloodletting localisation conflict on whether provincial Growth is an active reward. The guide follows neither silently: it reports the current official reward categories and flags the unresolved Growth string.
- Reverse searches found no Khorne-specific confederation, vassal, diplomacy, climate, Supply Lines, or additional movement-stance override. Generic rules and ordinary catalog rows remain outside this document.
- The rare-item script and localization expose the Khorne Book lifecycle and occupation behavior, but this guide leaves ordinary ancillary stat lines to the current in-game UI.
