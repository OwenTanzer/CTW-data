# Grand Cathay campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Grand Cathay | `race_slug=grand_cathay` | **Playable factions:** 4

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already enumerate constructible building levels, costs, times, prerequisites, and standardized outputs for all four playable factions. They do **not** encode building Yin/Yang alignment or the scripted provincial Harmony state, which are documented below. The normalized unit file and typed lookups already describe the Grand Cathay and Tiger Warrior rosters, faction permissions, unit statistics, Battle Harmony abilities, attributes, weapons, and mounts. The character files already contain the complete skill trees for Miao Ying, Zhao Ming, Yuan Bo, Bhashiva, Saytang, Taoyan, Sawai variants, and every generic Cathayan character. Those rows are not repeated here. This document records the provincial, scripted, pooled-resource, route, acquisition, and victory systems needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Provincial Harmony

**Applicability:** all four playable factions through Cathay culture, including `wh3_cp1_cth_tiger_warriors`.

Campaign Harmony is province-based. Constructed buildings contribute Yin or Yang to their province; the individual contributions live in installed building/effect relations rather than the economy CSV schema and are not enumerated here. The installed bands are Harmony at zero, then three degrees of imbalance in either direction: **1–2**, **3–5**, and **6+** Yin or Yang. Their growth, control, income, and related bundle effects are ordinary localized effect rows and are not duplicated here.

The campaign script recalculates the province resource after building completion and when a region changes between a human Cathay owner and another owner. Consequently, capture and demolition can change a province's state immediately; this is not a once-per-turn faction meter.

Tiger Warrior settlements still participate in this provincial layer, but Tiger Warrior units do not natively use the normal Battle Harmony relationship. Their Tiger Court and Armies of Shang-Yang progression can add positive interaction later. Battle Harmony's unit-level effects remain in the unit/ability catalogs and are distinct from this provincial resource.

### Wu Xing Compass

**Applicability:** the standard Cathayan campaign layer used by the Northern and Western Provinces; Yuan Bo uses the expanded Jade Compass described below. No standard-compass claim is made for the Tiger Warriors.

The standard compass has four directions: **Great Bastion**, **Warpstone Desert**, **Celestial Lake**, and **Dragon Emperor's Wrath**. The selected direction gains 2 power at each round end. Great Bastion, Celestial Lake, and Wrath have a 20-power maximum; their passive effects strengthen through the power chain. Corruption in an unselected direction can erode stored power through the generic compass actions.

Selecting a direction also applies an immediate effect list:

- **Great Bastion:** -2 Bastion Threat change, -10% recruitment cost in friendly territory, and Ancestral Warriors for friendly-territory armies. Stored power adds replenishment in friendly territory and settlement supply points, reaching +10% replenishment and +2,500 supplies at its highest stage.
- **Warpstone Desert:** +20% Caravan cargo capacity and cargo value, plus Caravan Master experience each turn. Its direction record has no stored-power range; this is a selection effect rather than another 0–20 progression.
- **Celestial Lake:** +15% income and +40 Winds of Magic change in owned regions while selected. Stored power adds province control, reaching +4.
- **Dragon Emperor's Wrath:** enables Celestial Intervention for friendly-territory armies. Stored power reduces corruption, reaching -6. At 20 power, the player action applies a three-turn attrition bundle to the hostile regions listed beyond the Bastion and resets Wrath's power to zero.

### Great Bastion Threat

**Applicability:** `wh3_main_cth_the_northern_provinces` and `wh3_main_cth_the_western_provinces`. Current UI-feature relations do not grant the Bastion Threat panel to the Jade Court or Tiger Warriors.

The meter starts at 10 and normally rises by 6 each world round, plus 2 for each of the Snake, Turtle, and Dragon Gates that is ruined or not held by a Cathay-subculture faction. Compass and other bonus values can modify the change, but the script clamps the per-round increase to at least 1 and the meter to at most 100.

Before a full invasion, a ruined gate can cause a small Kurgan force to be maintained near it. Destroying a Kurgan Warband army while no full invasion is active removes 20 threat. As the meter approaches 100, the script selects and warns about a gate target; the full invasion begins when the meter fills.

The base invasion scales by campaign turn:

| Turn band | Base armies | Base units per army |
|---|---:|---:|
| Through turn 25 | 3 | 8 |
| Turns 26–40 | 4 | 15 |
| Turns 41–60 | 5 | 17 |
| Turn 61 onward | 5 | 19 |

Harder campaign difficulties can add armies or units. An active invasion ends and resets threat after 20 turns, when the Kurgan faction is destroyed, or when eight monitored Bastion-area regions are ruined or cease to be Cathayan. Miao Ying and Zhao Ming also have a special battle presentation when personally defending a Bastion gate; this changes presentation, not campaign arithmetic.

### Ivory Road Caravans

**Applicability:** all four playable factions; the Tiger Warriors use Sawai caravan leaders and the additional integrations below.

Caravans are persistent route forces. A Caravan Master or Sawai's innate background selects the initial escort; later dilemmas can add or remove units, cargo, movement, or temporary effects. At each world round, one active caravan per human faction is selected for the route-event query. Event probability is weighted by the route state, including average banditry and hostile-owned regions; the generic roll also includes a 25-weight no-event result. Some encounters become stronger after turn 50.

On arrival, the script records total cargo moved and completed journeys, triggers the completion event, and checks the destination-specific reward tuple. Cathayan destinations can award a unique ancillary and a foreign unit rather than one symmetric reward. Arrival adds `floor(-cargo / 18)` to that destination's demand—equivalently, it reduces demand by `ceil(cargo / 18)`—and demand otherwise regenerates by 2 per world round. The executable setter enforces a -60 lower bound. Although it first calculates a 200 upper clamp, the next line overwrites that result from the original value, so there is no effective +200 ceiling in the installed script. Repeatedly using one destination therefore depresses its future cargo-value modifier.

Tiger Warrior route completion additionally awards **150 Iron Favour**. If the destination region contains an unclaimed Bhashiva Relic, arrival transfers it to the Tiger Warriors. Their Sawai backgrounds mix Tiger and Cathayan starting escorts, but the individual unit rows are left to the roster catalog.

### Legendary-hero recruitment chains

**Applicability:** the Northern Provinces, Western Provinces, and Jade Court in both Immortal Empires and Realm of Chaos; the Tiger Warriors in Immortal Empires only. Content ownership and whether another eligible faction has already claimed the character still apply.

- **Saytang the Watcher:** faction-leader rank **13** starts the two-stage chain. Stage 1 requires **1,500 kills**. Stage 2 requires ownership of any **five** Jet Lions, Jade Lions, Terracotta Sentinels, or the Terracotta Sentinel Regiment of Renown, counted additively. Completion triggers Saytang's choice dilemma and his Wind Bow is configured as his ancillary. The script requires the Cathay *Shadows of Change* entitlement. If no eligible human claimant receives him, the strongest eligible AI Cathay faction can receive him from turn 30.
- **Taoyan the Merciless:** the current executable trigger is faction-leader rank **8**; the nearby rank-13 Lua comment and older rank-12 promotional description are stale. Stage 1 requires **1,000 kills** and pays 1,000 treasury. Stage 2 requires **650 battle captives**, pays 500 treasury, and spawns Taoyan with Tyrant's Talon. If no eligible human claimant receives her, the strongest eligible AI Cathay faction can receive her from turn 20.

### Yuan Bo: Matters of State

**Applicability:** `wh3_dlc24_cth_the_celestial_court` only.

Matters of State uses **Stone** and **Steel** action tokens. The initial combined capacity is four, with four further capacity upgrades tracked by the script. Tokens cycle into the opposite type: spending Steel queues the same amount of Stone, while spending Stone queues Steel. A base recovery counter of five decreases at Jade Court faction-turn start and after a **manually fought victory** while the pool is below capacity. When the counter completes, at most one pending Stone and one pending Steel are restored before it resets. The first four Commercial/Fortress declarations also increase the shared capacity; Commercial grants Stone capacity/token state and Fortress grants Steel capacity/token state.

The active action set and current token costs are:

| Action | Cost |
|---|---:|
| Swap a settlement's Harmony building alignment | 3 Stone |
| Force success for an agent action | 2 Steel |
| Generate ancillaries | 3 Steel |
| Grant 5,000 character experience | 5 Stone |
| Grant an army trespass immunity | 3 Steel |
| Reset a province's corruption and control problems | 2 Stone |
| Generate an elite Astromancer | 6 Stone |
| Convert a settlement to Commercial City | 4 Steel |
| Convert a settlement to Fortress City | 4 Stone |
| Deploy a settlement garrison as a temporary army | 5 Steel |
| Refresh action points for all owned armies | 7 Steel |
| Select a doctrine | 4 Stone and 4 Steel |

The **Doctrine of Conflict**, **Doctrine of Tranquillity**, **Doctrine of Progress**, and **Doctrine of Prosperity** are mutually exclusive. The installed DB contains additional Matters-of-State ritual records, but the production list above follows the twelve action keys actually registered by the current Jade Court campaign script.

In Immortal Empires, a separate early dilemma can occur after occupying the High Sentinel while still owning Shang-Wu and before turn 25. One choice transfers Shang-Wu to the Jade Custodians and heals their garrison; retaining it is the alternative. This is a scripted start decision, not a general settlement-transfer power.

### Yuan Bo: Jade Compass and Astromantic Relays

**Applicability:** the Jade Court only.

Yuan Bo's Jade Compass adds four initially locked directions: **Ashshair**, **Broken Lands**, **Dragon River**, and **Nongchang Basin**. Their permanent selection effects specialize in magic, experience, army endurance, and construction/development; the ordinary effect values are traceable in the installed effect-list relations. Each is tied to an Astromantic Relay objective.

Completing a Relay starts a six-turn Lizardmen incursion. The four successive incursions use 9, 13, 16, and 19 units at script power ratings 4, 6, 8, and 10. Interacting with the early invasion marker reduces the spawned force by five, three, or one units depending on timing. Completing the incursion unlocks the corresponding advanced direction and advances the Relay objective.

Two completed Relays satisfy the script's short-victory gate. Four Relays trigger Yuan Bo's campaign-specific final-battle mission; winning that battle completes the scripted long-victory objective. These gates are saved scripted state rather than an inference from the ordinary Astromantic Relay building row.

### Bhashiva: Relics and scripted campaign progression

**Applicability:** `wh3_cp1_cth_tiger_warriors` in Immortal Empires only.

Bhashiva can hold and use up to **15 Relics**. Capturing a settlement transfers one regional Relic to the faction when present. The Ivory Road separately schedules Relic discoveries on turn 8, a random turn from 30–40, and a random turn from 50–60; a Sawai caravan must still reach the Relic region to collect it. From turn 20 onward, reaching the cap removes remaining unclaimed Relics, and more than 15 turns without collecting one can trigger a reminder.

The narrative chain asks Bhashiva to capture the Bloodpeak target, spend one Relic, own a province, and win four battles before escalating into marked invasions and the final battle. The Khorne marker has a four-turn countdown; reaching it and then defeating the invasion awards staged treasury and Iron Favour. The next stage spends four Relics and repeats the pattern with a Nurgle invasion, followed by another four-Relic spend and `wh3_cp1_qb_cth_bhashiva_final_battle`. The Relic spends therefore compete directly with Tiger Court development below.

### Bhashiva: Tiger Court

**Applicability:** the Tiger Warriors in Immortal Empires only.

The Tiger Court invests Relics across three five-tier paths:

- **Prophecy of the White Tiger:** allied recruitment and scripted Tiger reinforcement development. In an eligible non-garrison battle involving the Tiger Warriors faction in a Tiger Warriors-owned region, the script can create a Tiger reinforcement force; it does not require Bhashiva personally to participate. Its strength is assembled from regional and provincial bonus values and capped by the configured force list.
- **Teachings of Kamau:** ambush and territorial intelligence. The script can reveal enemy forces that trespass in Tiger Warriors territory for the configured marked-for-prey duration, excluding allied, vassal, and client-state territory.
- **Way of a Thousand Gods:** local/global recruitment and settlement-development support.

Each permanent tier purchase consumes one Relic and advances the selected path's permanent resource. The three Court rituals then turn path progress into active effects. The White Tiger military ritual targets an army and prevents retreat for two turns; the other two ritual payloads support the corresponding Court themes. Their ordinary effect rows and Tiger-building modifiers are catalog data and are not exhaustively reproduced.

Tiger Warrior settlement chains are their base infrastructure, and Tiger units are their initial military layer. Cathayan recruitment instead comes through modified advanced military chains whose useful levels and unit permissions are unlocked by Tiger Court and Armies of Shang-Yang progress. This explains why a Cathayan building can appear in the economy catalog before its normal roster role is fully available.

### Bhashiva: Armies of Shang-Yang and Iron Favour

**Applicability:** the Tiger Warriors in Immortal Empires only.

**Iron Favour** is earned from Zhao's goals, battles against the relevant enemies, and completed Caravan journeys; each Caravan arrival contributes 150. The Armies of Shang-Yang panel has five mission tiers. Every mission in the current tier must be completed before the next tier unlocks. Their objectives cover owning or improving the supplied units, completing Zhao goals, fighting Chaos, taking captives, occupation, and scoring kills with Shang-Yang troops.

Progress unlocks Cathayan recruitment categories—Jade infantry, archers and cavalry; gunpowder infantry and artillery; specialist cavalry; Celestial beasts and machines; and flying machines—plus four military-building upgrades, three ancillaries, insignias, unit-cap purchases, and an army-cap purchase. The current Iron Favour base bands are:

- Unit/insignia improvement tiers: **50, 50, 60, 80, and 100**.
- Unit-cap purchases by progression band: **50, 50, 80, 100, and 140**.
- Additional army capacity: **250** per activation.

Many individual unit improvements increase their own future price by 10%, 20%, or 25% per use, with record-specific caps. Army capacity is persistent; from the second use onward the script rewrites the bundle's capacity value to the tracked number of purchases. AI Tiger Warriors receive tier unlocks on a randomized schedule after the feature unlock rather than completing the human mission sequence.

### Faction-specific climate suitability

The reverse audit found explicit suitability overrides not represented by building, unit, or skill rows. Yuan Bo treats **Jungle** as suitable. Bhashiva treats **Jungle, Mountain, and Wasteland** as suitable. No additional playable-faction climate override was found for Miao Ying or Zhao Ming.

## Faction coverage

- **The Northern Provinces** — `wh3_main_cth_the_northern_provinces`: provincial Harmony; standard Wu Xing Compass; Great Bastion Threat; Ivory Road Caravans; Saytang and Taoyan chains. No further uncataloged Miao Ying-only resource loop or panel was located.
- **The Western Provinces** — `wh3_main_cth_the_western_provinces`: provincial Harmony; standard Wu Xing Compass; Great Bastion Threat; Ivory Road Caravans; Saytang and Taoyan chains. No further uncataloged Zhao Ming-only resource loop or panel was located.
- **The Jade Court** — `wh3_dlc24_cth_the_celestial_court`: provincial Harmony; Ivory Road Caravans; Saytang and Taoyan chains; Matters of State; Jade Compass and Astromantic Relays; the High Sentinel/Shang-Wu start dilemma; Jungle suitability. The current UI feature relation gives Yuan Bo Jade Compass and Matters of State rather than the Bastion Threat panel.
- **Claws of the White Tiger** — `wh3_cp1_cth_tiger_warriors`: provincial Harmony with the documented Battle-Harmony caveat; Sawai Caravans; Saytang and Taoyan chains; Relics and the scripted victory chain; Tiger Court; Armies of Shang-Yang and Iron Favour; Jungle, Mountain, and Wasteland suitability. No Bastion Threat or Jade Compass UI feature is assigned.

Generic occupation behavior, ordinary Supply Lines, shared Realm-of-Chaos systems, diplomatic context records, and Gotrek/Felix availability were checked during reverse audit and excluded because no distinct Grand Cathay campaign rule was found. Ordinary faction traits and lord/hero skill effects remain in the source catalogs.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`; `data/faction_guides/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all four CSVs under `data/economy/factions/grand_cathay/`.
- `data/unit_stats/normalized/grand_cathay__wh3__8.1.1__ultra.csv`; typed roster and ability lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 21 Grand Cathay character files selected by that index.
- Relevant English localization and source-export relations under `data/economy/source_exports/` and `data/unit_stats/source_exports/`, especially building effects, compass directions, effects, pooled resources, rituals, initiative sets, and UI text.

### Installed vanilla game files inspected through RPFM

All requests used `scripts/rpfm-call-locked.ps1` and the read-only merged vanilla source (`pack_key=$CA` where required).

- Scripts: `script/campaign/wh3_campaign_harmony.lua`, `script/campaign/wh3_campaign_great_bastion.lua`, `script/campaign/wh3_campaign_caravans_core.lua`, `script/campaign/wh3_main_legendary_characters.lua`, `script/campaign/wh3_dlc24_matters_of_state.lua`, `script/campaign/main_warhammer/wh3_dlc24_jade_dragon.lua`, `script/campaign/wh3_cp1_bhashiva.lua`, `script/campaign/wh3_cp1_tiger_court.lua`, and `script/campaign/wh3_cp1_tiger_mercenaries.lua`.
- Tables: `db/compass_directions_tables/data__`, all four `db/winds_of_magic_compass_*_tables/data__` relations, `db/campaign_effect_list_effect_junctions_tables/data__`, `db/ui_features_to_factions_tables/data__`, `db/rituals_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/ritual_payload_resource_transactions_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, `db/cdir_events_mission_payloads_tables/data__`, the mission follow-up relations, `db/campaign_group_member_criteria_factions_tables/data__`, `db/campaign_group_members_tables/data__`, and `db/campaign_group_member_criteria_climates_tables/data__`.
- Stable keys: the four playable faction keys; `wh3_main_chaos_compass_*`; `wh3_dlc24_compass_advanced_*`; `wh3_main_cth_bastion_threat`; `wh3_dlc24_cth_mos_*`; `wh3_cp1_cth_relics`; `wh3_cp1_cth_iron_favour`; the three Tiger Court resources; `wh3_dlc24_cth_saytang_the_watcher`; and `wh3_cp1_cth_cha_taoyan`.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes).
- Creative Assembly, [Bhashiva Character Pack overview](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/97-total-war-warhammer-iii-bhashiva-character-pack-what-s-included).
- Creative Assembly, [Update 8.0 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/98).
- Community discovery checklists: [Grand Cathay](https://totalwarwarhammer.fandom.com/wiki/Grand_Cathay), [Great Bastion](https://totalwarwarhammer.fandom.com/wiki/Great_Bastion), [Matters of State](https://totalwarwarhammer.fandom.com/wiki/Matters_of_State), [The Jade Court](https://totalwarwarhammer.fandom.com/wiki/The_Jade_Court), and [The Northern Provinces](https://totalwarwarhammer.fandom.com/wiki/The_Northern_Provinces). These pages were used to locate candidate systems; current values above come from installed records.

### Evidence limitations

- Three host-wide interruptions stopped the local RPFM service during research. The service was restarted and every completed query remained narrow and read-only; no pack was edited or saved.
- The compass records expose selection actions, power changes, and staged effect lists. Where the exact engine-side stage breakpoint was not present in the decoded relation, the guide reports verified maxima and endpoint values without inventing intermediate thresholds.
- The installed Matters-of-State ritual table contains records beyond the twelve action keys registered by the current Jade Court Lua. Only the executable action set is documented.
- Bhashiva's AI progression uses randomized scheduled turns; no deterministic turn claim is made.
