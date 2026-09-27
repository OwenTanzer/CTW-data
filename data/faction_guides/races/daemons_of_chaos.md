# Daemons of Chaos campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Daemons of Chaos | `race_slug=daemons_of_chaos` | **Playable factions:** 1

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSV already describes the Legion of Chaos's constructible building levels, costs, times, prerequisites, and standardized outputs, including the god-specific settlement and recruitment chains. The normalized unit file and typed lookups already describe the race roster, faction permissions, unit statistics, abilities, attributes, weapons, and mounts. The character file already contains the Daemon Prince's skill tree. Those rows are not repeated here. This document records the Glory economy that controls their availability, settlement-template choices, ascension state, Daemonic Gifts, borrowed god mechanics, post-battle Daemon recovery, climate rule, campaign-specific victory coupling, and scripted character-acquisition chains.

## Mechanically relevant material not captured elsewhere

### Daemonic Glory and reward tracks

**Applicability:** `wh3_main_dae_daemon_prince` (Legion of Chaos).

The faction has five faction-scoped pooled resources: Khorne, Nurgle, Slaanesh, Tzeentch, and Undivided Glory. Each starts at zero. Before ascension, each resource has a current maximum of 3,080. The Legion has no faction-, culture-, or subculture-linked technology node set in the installed data; these Glory tracks therefore provide its campaign progression in place of a conventional research tree.

The four aligned resources accept factors for buildings, commandments, captives, events, passive gain, and captured settlements. Undivided Glory accepts captives, events, passive gain, and captured settlements, but has no building or commandment factor. Two nonstandard transactions are especially important:

- After battle, the Khorne, Nurgle, Slaanesh, Tzeentch, or Undivided captive option adds 2 matching Glory per captive counted by the post-battle system, capped at 500 Glory for that result. The five choices use different ordinary captive outcomes: Khorne and Undivided kill, Nurgle replenishes, Slaanesh releases, and Tzeentch kills while also applying a Winds-of-Magic force transaction.
- Colonising or resettling with a god dedication adds 60 Glory to that god and 60 Undivided Glory. Occupying with a god dedication instead uses a 0.1 resource-loot multiplier for both the selected god and Undivided resources, so its yield depends on the captured settlement result rather than being a flat amount.

Glory thresholds invoke operation sets that unlock Daemonic Gifts, recruitment permissions, and factionwide effect bundles. The individual units and buildings remain in the catalogs; the progression rule is that their permission bundles are awarded only when their linked threshold is reached. Current Daemonic Gift thresholds are:

| Track | Gift thresholds before the 3,080 ascension point | Gift thresholds reachable only after choosing that ascension |
|---|---|---|
| Each god | 210, 490, 770, 1,050, 1,330, 1,610, 1,890, 2,170, 2,450, 2,730, 3,010 | 3,290 and 3,570 |
| Undivided | 315, 735, 1,155, 1,575, 1,995, 2,415, 2,835 | 3,255, 3,675, 4,095, 4,515, 4,935, and 5,355 |

The threshold record keys contain older nominal numbers; the values above are the operative `lower_bound` fields in patch 8.1.1. Post-ascension faction and recruitment rewards continue beyond the gift thresholds, reaching 4,400 for a chosen god and 5,610 for Undivided. The Undivided sequence grants late recruitment permissions across all four god rosters; a god sequence concentrates on that god's late roster and aligned faction bonuses.

### Ascension and the four early god-mechanic unlocks

**Applicability:** `wh3_main_dae_daemon_prince`.

Five initially available ascension rituals correspond to the five Glory resources. Each is instant, has no treasury cost, and consumes exactly 3,080 of the selected Glory. Its payload unlocks the post-ascension operation set only for the chosen resource. The unchosen resources retain their pre-ascension operation sets and maxima; no decoded payload removes rewards already earned on them.

Final ascension is not the gate for the four borrowed god mechanics. At 770 current Glory in a god track, its faction-feature bundle enables the following system and adds 5 percentage points to the matching god's Daemonic Reforging chance:

| Glory track | Feature enabled at 770 | Verified extra rule |
|---|---|---|
| Khorne | Daemon Prince Bloodletting | The unlock is `wh3_main_effect_unlock_bloodletting_daemon_prince`; it does not grant the wider Khorne campaign package. |
| Nurgle | Daemon Prince plagues | The unlock is `wh3_main_effect_unlock_plague_daemon_prince`; cults and Unholy Manifestations are not attached to it. |
| Slaanesh | pre-battle unit seduction | The unlock is `wh3_main_effect_unlock_seduce_units_daemon_prince`; no Devotees resource is assigned to the Legion by this bundle. |
| Tzeentch | Teleport stance | Its current base cost is 40 army Winds of Magic. Teleport attacks count as ambushes and the faction feature prevents interception. |

These are independent threshold rewards, so more than one can be enabled before the final 3,080-Glory choice. Final ascension determines which track receives its otherwise inaccessible late operation sets.

### Campaign progression branch

> **9.0 disposition:** The requirements below are historical. Use the current atlas objective_reference with variant_key and its recorded runtime boundaries. See [current routing](../UPDATE_9.0_CLAIMS.md).

**Applicability:** `wh3_main_dae_daemon_prince` in Immortal Empires (`main_warhammer`); human-controlled faction only for the scripted listener.

Performing any one of the five ascension rituals completes the Legion-specific `daemon_prince_ascend_ritual` objective inside its Immortal Empires short victory. The active `RitualCompletedEvent` listener accepts the Khorne, Nurgle, Slaanesh, Tzeentch, or Undivided ascension ritual; it does not require a particular dedication. This is one objective within the short victory, not a claim that ascension alone completes the entire victory.

The Realm of Chaos victory script instead includes the Legion in shared campaign target and domination structures; no comparable Legion-specific objective block was located there. The shared four-soul and final-battle framework is not repeated as a race mechanic.

### God-dedicated settlements

**Applicability:** `wh3_main_dae_daemon_prince`.

Occupation, colonisation, and resettlement expose four dedicated settlement types: Khorne, Nurgle, Slaanesh, and Tzeentch. There is no Undivided settlement type. The selected type controls the settlement template and therefore which aligned main, infrastructure, and recruitment chains can be built there. The choice is local to the settlement, allowing different regions in the same empire to use different god templates. It is separate from the later factionwide ascension choice.

The linked occupation records also perform the selected-god and Undivided Glory transactions described above. The economy catalog is authoritative for the resulting building levels and their ordinary outputs; it does not encode the occupation choice that selects the template.

### Daemonic Gifts and complete sets

**Applicability:** `wh3_main_dae_daemon_prince`; the dedicated Daemon Prince subtypes use their corresponding aligned armory sets.

Daemonic Gifts are an armory system rather than items in the Daemon Prince skill-tree file. The installed armory contains 352 Daemon Prince parts across ten slots: head, left arm, right arm, legs, torso, wings, tail, shield, weapon 1, and weapon 2. Glory operation sets award the parts; each of the 13 gift thresholds per track links two alternative armory-item operation sets.

Equipped parts can satisfy complete-set definitions that apply additional effect bundles. There are four named sets for each alignment:

| Alignment | Complete sets |
|---|---|
| Undivided | The Undivided Prince of Chaos; The Armoured Prince of Chaos; The Scorched Prince of Chaos; Armaments of Chaos |
| Khorne | The Burning Prince of Chaos; The Bloodthirsty Prince of Chaos; Armaments of War; The Fierce Prince of Chaos |
| Nurgle | The Enlarged Prince of Chaos; The Charitable Prince of Chaos; Armaments of Blight; The Foul Prince of Chaos |
| Slaanesh | The Radiant Prince of Chaos; The Adorned Prince of Chaos; Armaments of Desire; The Sensuous Prince of Chaos |
| Tzeentch | The Jewelled Prince of Chaos; The Mystic Prince of Chaos; Armaments of Change; The Withered Prince of Chaos |

Their bundles include character, army, and campaign effects, including combinations of recruitment or upkeep changes, corruption, Glory modifiers, and abilities. The operative relationship not present in the skill catalog is conditional: the set bundle applies from the equipped matching parts, while access to those parts comes from the selected Glory thresholds.

### Daemonic Reforging

**Applicability:** race-wide campaign feature for `wh3_main_dae_daemons`, including `wh3_main_dae_daemon_prince`.

Daemonic Reforging gives destroyed Daemonic units a post-battle chance to return to their army. The installed campaign variable sets the base saving chance to 10%. The engine's calculation also exposes modifiers for unit level and cost, Lords and Heroes, battle sites, and the province's state-religion/corruption percentage; returned strength is calculated separately from a low base and related modifiers.

Glory reward bundles interact directly with this feature. Each 770 god-feature bundle adds 5 percentage points to the corresponding god's saving chance. Later aligned bundles can add another 5 points and 10 points of restored health, while the Undivided post-ascension sequence has a generic Daemon-saving bundle with +5 chance and +10 restored health. These are post-battle recovery rules and are not represented by the roster's unit statistics.

### Legendary-character acquisition chains

**Applicability:** `wh3_main_dae_daemon_prince`, subject to the listed content entitlement and the character not already having been assigned elsewhere.

The shared legendary-character script explicitly supplies Legion of Chaos eligibility and Daemon-specific mission variants. These acquisition triggers are outside the character and skill-tree catalogs:

| Character | Human trigger | Content gate | AI fallback |
|---|---|---|---:|
| Blue Scribes | faction leader reaches rank 10; the chain ends in the Blue Scribes choice dilemma | *Shadows of Change* Tzeentch entitlement | turn 30 |
| Aekold Helbrass | faction leader reaches rank 12; the chain ends in the Aekold choice dilemma | no DLC requirement in the character block | turn 30 |
| Karanak | faction leader reaches rank 16 | no DLC requirement in the character block | turn 25 |
| Skarr Bloodwrath | construct `wh3_main_dae_advanced_kho_3` to start his chain | *Omens of Destruction* Khorne entitlement | turn 30 |
| Scyla Anfingrimm | faction leader reaches rank 12 | *Omens of Destruction* Khorne entitlement | turn 30 |

Fallback assignment is considered only when no eligible human claimant owns the character; the script then selects an eligible AI faction, with Karanak giving the Exiles of Khorne priority.

### Climate suitability

**Applicability:** subculture `wh3_main_sc_dae_daemons`, including `wh3_main_dae_daemon_prince`.

All eleven installed campaign climate types are mapped to the Daemons of Chaos `regular` suitability members: Chaotic Wasteland, desert, frozen, island, jungle, magical forest, mountain, ocean, savannah, temperate, and wasteland. Consequently the Legion does not have a yellow or red climate category among the current climate records.

## Faction coverage

- **Legion of Chaos** — `wh3_main_dae_daemon_prince`: all sections apply, with the Campaign progression branch limited to Immortal Empires. It is the only playable faction in the Daemons of Chaos race index. No separate faction-specific cult, Unholy Manifestation family, Supply Lines exception, or diplomacy override was established; ordinary cataloged and shared campaign rules are therefore not repeated.

## Evidence register

### Project material consulted

- `README.md`
- `data/economy/README.md`
- `data/economy/faction_index__wh3__8.1.1.csv`
- `data/economy/factions/daemons_of_chaos/wh3_main_dae_daemon_prince.csv`
- `data/economy/source_exports/db/building_effects_junction_tables/data__.tsv`
- `data/unit_stats/README.md`
- `data/unit_stats/normalized/daemons_of_chaos__wh3__8.1.1__ultra.csv`
- Relevant Daemons of Chaos rows in the typed unit lookups under `data/unit_stats/lookups/`
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and `data/skill_trees/characters/daemons_of_chaos/Daemon_Prince.csv`

### Installed vanilla game files and stable records

Read through the read-only RPFM interface with merged vanilla `GameFiles` (`pack_key=$CA` where required):

- `script/campaign/_narrative/races/wh3_narrative_daemon_prince.lua` — five Glory resources and active introductory Glory/Gift/ascension mission listeners.
- `script/campaign/wh3_main_legendary_characters.lua` — Legion eligibility, unlock ranks/building, DLC requirements, faction-specific missions, choice dilemmas, and AI fallback turns for the five characters listed above.
- `script/campaign/wh3_campaign_daemon_cults.lua` — the current `faction_to_cult` map, which does not contain `wh3_main_dae_daemon_prince`.
- `script/campaign/wh3_main_chaos/victory_objectives.lua` — shared Realm-of-Chaos domination targets; no Legion-specific scripted objective block.
- `db/campaign_group_pooled_resources_tables/data__`, `db/pooled_resources_tables/data__`, `db/pooled_resource_factor_junctions_tables/data__`, and `db/pooled_resource_threshold_operation_sets_tables/data__` — Glory membership, initial state, pre-ascension maxima, gain-factor categories, thresholds, and operation-set dispatch.
- `db/campaign_operation_set_effect_bundle_elements_tables/data__`, `db/campaign_operation_effect_bundles_tables/data__`, and `db/effect_bundles_to_effects_junctions_tables/data__` — recruitment/faction rewards, 770-Glory feature unlocks, and Daemonic Reforging modifiers.
- `db/campaign_post_battle_captive_options_tables/data__` and `db/resource_cost_pooled_resource_junctions_tables/data__` — post-battle Glory rates/caps, settlement transactions, 3,080-Glory ascension costs, and the 40-Winds Teleport cost.
- `db/culture_settlement_occupation_options_tables/data__` — four god-specific occupation, colonisation, and resettlement types and their Glory transactions.
- `db/rituals_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/resource_costs_tables/data__`, `db/ritual_payloads_tables/data__`, and `db/campaign_payload_pooled_resource_components_tables/data__` — five initially available ascension rituals and the selected-resource post-ascension payload.
- `db/armory_items_tables/data__`, `db/agent_subtypes_to_armory_item_sets_tables/data__`, `db/campaign_operation_armory_items_tables/data__`, `db/campaign_operation_set_armory_item_elements_tables/data__`, `db/armory_item_sets_tables/data__`, `db/armory_item_set_items_tables/data__`, and `db/armory_item_set_to_effects_tables/data__` — Daemonic Gift slots, Glory unlock linkage, dedicated subtypes, complete sets, and their effects.
- `db/campaign_features_tables/data__`, `db/campaign_variables_tables/data__`, `db/campaign_stance_effects_junctions_tables/data__`, and `db/effect_bonus_value_stance_junctions_tables/data__` — Daemonic Reforging, base saving variables, Teleport availability, non-interception, and ambush attacks.
- `db/campaign_group_member_criteria_subcultures_tables/data__` and `db/campaign_group_member_criteria_climates_tables/data__` — the eleven regular climate mappings and subculture applicability.
- `db/technology_node_sets_tables/data__` and `db/technologies_tables/data__` — absence of a Legion/Daemons-linked conventional technology tree.
- `script/campaign/main_warhammer/victory_objectives.lua` — Legion-specific Immortal Empires short-victory objective `daemon_prince_ascend_ritual` and the human `RitualCompletedEvent` listener accepting all five ascension rituals.

### Web grounding

- Warhammer Community, [Build your own Daemon Prince](https://www.warhammer-community.com/en-gb/articles/n818jrsf/build-your-own-daemon-prince-to-bring-a-personal-touch-to-the-end-times-in-total-war-warhammer-iii/).
- SEGA Support, [Total War: WARHAMMER III FAQ](https://support.sega.com/hc/en-gb/articles/4417717186833-TOTAL-WAR-WARHAMMER-III-FAQ).
- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Creative Assembly, [Daemonic Reforging overview in the Omens of Destruction update](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/37).
- Community discovery aids used only to locate claims for installed-file verification: [Daemons of Chaos](https://totalwarwarhammer.fandom.com/wiki/Daemons_of_Chaos), [Legion of Chaos](https://totalwarwarhammer.fandom.com/wiki/Legion_of_Chaos), [Daemonic Glory](https://totalwarwarhammer.fandom.com/wiki/Daemonic_Glory), and Steam guides [2809243404](https://steamcommunity.com/sharedfiles/filedetails/?id=2809243404) and [3236766718](https://steamcommunity.com/sharedfiles/filedetails/?id=3236766718).

### Evidence limitations

- RPFM 5.0.6 became memory-unstable during several large-table reads. All reported records were obtained through narrow, sequential, read-only calls; no game pack was edited or saved.
- The ascension payload explicitly unlocks only the selected resource's post-ascension operation set. No separate `lock` payload exists for the other resources; their exclusion from late rewards follows from their retained 3,080 maxima and the absence of an unlocked late operation set, not from a named lock record.
- The Daemonic Reforging variables expose its 10% base saving chance and inputs to the engine calculation, but not a complete executable formula. No derived final percentage or returned-health formula is asserted.
- The four 770-Glory bundles identify the feature gates. Except for Teleport's separately exposed cost and stance behavior, the internal Bloodletting, plague, and seduction subsystems are shared engine/game systems and are not reconstructed from unsupported tooltip text here.
