# Tzeentch campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Tzeentch | `race_slug=tzeentch` | **Playable factions:** 2

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe constructible building levels, base costs and times, prerequisites, and standardized outputs for both playable factions. The normalized unit file and typed lookups already describe the Tzeentch roster, faction permissions, unit statistics, barriers, abilities, and attributes. The character files already contain the complete skill trees for Kairos, the Changeling, generic characters, and unique heroes. Those rows are not repeated here. This document records the pooled-resource loops, scripted foreign-slot rules, campaign actions, progression state, and faction-specific systems needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Grimoires and Changing of the Ways

**Applicability:** both `wh3_main_tze_oracles_of_tzeentch` and `wh3_dlc24_tze_the_deceivers`, except where noted.

Grimoires (`wh3_main_tze_grimoires`) are the spendable resource for Changing of the Ways and for some technologies. Vanilla localisation identifies buildings and battles as the principal sources. The following current base costs, cooldowns, and targets are encoded in `rituals_tables`, `resource_cost_pooled_resource_junctions_tables`, and `campaign_group_diplomatic_manipulation_category_junctions_tables`:

| Action | Base Grimoires | Cooldown | Operative target or result |
|---|---:|---:|---|
| Reveal Shroud | 50 | no action cooldown; target faction 5 turns | Reveals the shroud over the target faction's territory. |
| Track Army | 80 | 5 turns | Transfers line of sight from a non-allied army. |
| Halt Army | 70 | 5 turns | Disables a non-allied army's campaign movement; the applied bundle has duration 2 and the localisation describes the result as one turn. |
| Open Gates | 100 | 10 turns | Targets an enemy walled region and opens its gates. |
| Force Rebellion | 200 | 5 turns | Forces a rebellion in the target region. |
| Break Alliance | 175 | 10 turns | Breaks an alliance through diplomatic manipulation. |
| Force Peace | 100 | 5 turns | Forces peace through diplomatic manipulation. |
| Force War | 200 | 10 turns | Forces war through diplomatic manipulation. |
| Transfer Settlement | 150 | 10 turns | Transfers a settlement, subject to the excluded-region set `wh3_main_transfer_settlement_excluded_regions`. |

`wh3_main_tze_oracles_of_tzeentch` additionally receives **Borrow Time**: 100 Grimoires, 10-turn cooldown, restoring an owned army's movement range. `wh3_dlc24_tze_the_deceivers` instead has **Spread Corruption** (`wh3_dlc24_ritual_tze_cotw_the_changeling_spread_corruption`): 125 Grimoires, 5-turn cooldown, targeting an owned force.

The same installed tables contain Spawnification, Drain Magic, Muddle Minds, and other alternate Changing-of-the-Ways records under `wh3_dlc20_feature_vilitch`. They are not omissions from the table above: that campaign group belongs to Vilitch's Warriors of Chaos faction, not to either playable faction in the Tzeentch race catalog.

The actions are not all initially available. Verified technology unlock effects include Reveal Shroud (`wh3_main_tech_tze_0_8`), Borrow Time (`wh3_main_tech_tze_1_1`), Force War (`wh3_main_tech_tze_2_3`), Force Rebellion (`wh3_main_tech_tze_2_9`), Track Army (`wh3_main_tech_tze_3_5`), Halt Army (`wh3_main_tech_tze_3_7`), Break Alliance (`wh3_main_tech_tze_4_1`), and Open Gates (`wh3_main_tech_tze_4_9`). The Changeling's Transfer Settlement unlock is attached separately to `wh3_dlc24_tech_tze_1_1_changeling`.

### Winds of Magic manipulation and Teleport stance

Winds manipulation is an **Oracles-only** feature. The current `campaign_features_tables` row enables `winds_of_magic_manipulation` for `wh3_main_feature_tzeentch` but explicitly disables it for `wh3_dlc24_tze_the_deceivers`. It operates only on controlled provinces. Lowering a province's Winds strength creates one manipulation use; increasing another controlled province consumes one use, so the total assigned strength remains constant. The cost relation is one unit of `wh3_main_tze_winds_of_magic_manipulation` per increase.

Teleport stance applies to **both playable factions**. It repositions an army across nearby terrain for 40 Winds of Magic power reserve (`wh3_main_tunnel_tze_winds_of_magic`). A Teleport attack is an ambush and cannot be intercepted; after teleporting, the army cannot move again that turn. Technology and other effects may modify stance cost. This is distinct from the Changeling's permanent Trickster Rift network below.

Both playable factions are explicitly immune to the installed map-attrition types `chaos_territory`, `chaos_wastes`, `non_vampire_territory`, and `snow`. The Deceivers additionally have immunity to `regionless` attrition. These are exact faction-immunity rows, not a claim that Tzeentch replaces the general climate system.

### Daemon Reforging and post-battle sacrifice

**Applicability:** both playable faction keys.

Tzeentch has the race feature `daemonic_unit_saving_postbattle`: when a Daemonic unit is destroyed, Daemon Reforging can return it after battle. The return chance depends on unit value, local Tzeentch corruption, local Winds strength, and skills or technologies; the restored hit-point percentage is separately modified. In the current effect data, local corruption adds 2 percentage points to both return chance and restored hit points per 10-point band, from +2 at corruption 1-10 through +20 at 91-100. The high-Winds Tzeentch bundle adds another +5 percentage points to return chance.

The Tzeentch post-battle captive option is **Offer to Tzeentch** (`2017353944`). It sacrifices captives and feeds the Tzeentch devotion/captive factor plus Winds of Magic: the current relations encode one Tzeentch point per captive and a 5-Winds transaction with a two-captives-per-transaction scaling value, capped at 500 captives for this option.

### Standard Tzeentch cult network

**Applicability:** `wh3_main_tze_oracles_of_tzeentch` only. The shared daemon-cult script maps the standard Tzeentch slot set only to this playable Tzeentch faction; the Deceivers use a separate scripted slot set.

At new-game start, a human Oracles campaign has two preset cults at Montfort and the Crystal Spires. Those locations are stated in the current official Patch 6.1 notes; the faction-start Lua itself contains only intro setup, not the start-position foreign-slot rows. AI Oracles use a separate installed-script branch: two random standard cults are seeded in valid occupied foreign regions within one or two adjacency steps of the home region. The weighting favors enemies and regions without another foreign slot.

Since the 5.2 cult rework, cults are deliberately established by Cultist actions rather than spawned from corruption. A normal cult has two building slots. Developing its Acolyte Trials chain through `wh3_main_cult_magus_trial_2` spawns a campaign-only Tzeentch Cult Magus and dismantles the completed trial building. The Cult Magus is consumed when it establishes a three-slot cult. Discovery uses the foreign-slot discoverability system; a discovered cult can be removed by the region owner.

From Update 7.0 onward, the Oracles can initiate diplomacy from turn 1 with factions whose territory contains one of their cults. This contact rule is an official current campaign behavior, not an output represented by the economy rows.

The ordinary building rows are in the economy catalog, but their nonstandard relationships are not:

- `wh3_main_tze_cult_2` supplies 10 Grimoires and 5% adjacent-region spread chance, with additional records of 20 Grimoires and 5% spread while `WoMGreaterThan3` is satisfied.
- `wh3_main_tze_cult_3` consumes 20 Grimoires while applying an 80% reduction to Changing-of-the-Ways costs. `wh3_main_effect_limit_machination_dummy` restricts this Machination to one cult at a time.
- Completing `wh3_main_tze_cult_4` adds 500 Grimoires, pushes the Winds in its province and adjacent provinces to Tempestuous, and destroys that cult.
- Completing the Cult-Magus-only `wh3_main_tze_cult_special` creates three standard Tzeentch cults in random valid regions and destroys the originating cult.
- Completing `wh3_main_tze_cult_teleport` summons the faction leader to the cult region and destroys the cult.

### Unholy Manifestations

**Applicability:** `wh3_main_tze_oracles_of_tzeentch` only. The relevant campaign-group records use `wh3_main_feature_tzeentch_excluding_the_changeling`.

The four manifestations have 15-turn cooldowns and base/upgraded variants. Their availability is governed by the Great Game/corruption system; the precise engine-side transition selecting base versus upgraded variants is not exposed by the decoded Lua.

- **Scriveners of Insanity** targets an owned army in enemy territory that is not besieging. Its 2-turn performance bundle drains 7 Winds per turn and grants 125 Grimoires per turn. Completion grants +20% post-battle Grimoires for 5 turns; the upgraded completion also performs a 250-Grimoire transaction.
- **Mutagenic Energies** targets an enemy land army and forces attrition regardless of immunity for 5 turns. Its upgraded record also raises casualties suffered from all attrition by 25%.
- **Magic Flare** targets an owned army for 3 turns: the base form gives +25% barrier hit points, +20% ammunition, and +20% range; the upgraded form gives +40%, +30%, and +30% respectively.
- **Night of Madness** targets an owned army in enemy territory. The army is immobilized during the 3-turn cast. For 5 turns after completion, the base form gives the army +15 Winds reserve per turn and its province +25 Tzeentch corruption and -50 control for enemies; the upgraded values are +25 Winds and +35 corruption, with the same -50 control.

### Kairos's Fragments of Sorcery

**Applicability:** `wh3_main_tze_oracles_of_tzeentch`; character subtype `wh3_main_tze_kairos` only.

This is a character-details initiative system, not part of the skill-tree CSV. Kairos has six mutually selected spell slots. Two common slots are active at rank 1; further slots unlock at ranks 5, 10, 15, and 20. Each new slot defaults to its Lore of Tzeentch initiative if no initiative in that set is active. Between battles, a slot can be freely switched among its equivalent spells from Tzeentch plus the eight standard lores: Beasts, Death, Fire, Heavens, Life, Light, Metal, and Shadows. The script imposes no change-frequency limit.

### Legendary-hero recruitment chains

**Applicability:** both playable faction keys, subject to character availability and the ownership requirements enforced by the game.

The Blue Scribes and Aekold Helbrass appear in the character catalog, but their acquisition sequences do not. The current `wh3_main_legendary_characters.lua` data explicitly permits both the Oracles and the Deceivers and supplies faction-specific mission variants:

- **The Blue Scribes:** reaching faction-leader rank 10 starts the chain; the Lua comment saying rank 8 is stale. Stage 1 requires 500 battle captives. Stage 2 selects a nearby region within distance 4: the standard branch requires its capture when the faction is at war with its owner and otherwise uses a move-to-region variant; the Changeling has its own move-to-region mission. Stage 3 requires `wh3_main_tze_library_3` for the Oracles or `wh3_dlc24_tze_the_changeling_caster_3` for the Deceivers. Completion triggers the Blue Scribes choice dilemma rather than silently adding the hero. Their data block also requires the Tzeentch *Shadows of Change* entitlement; absent an eligible human claimant, the strongest eligible AI faction can receive them from turn 30.
- **Aekold Helbrass:** reaching faction-leader rank 12 begins a three-stage chain. Stage 1 requires `wh3_main_tze_monster_barracks_3` for the Oracles or `wh3_dlc24_tze_the_changeling_monster_barracks_3` for the Deceivers. Stage 2 requires any eight Tzeentch Chaos Warriors, Tzeentch Chaos Warriors (Halberds), or Chaos Knights of Tzeentch. Stage 3 is the dedicated set-piece battle, after which the Aekold choice dilemma is triggered. If no eligible human faction claims him, the strongest eligible AI faction can receive him from turn 30.

### Generic-lord ascension

**Applicability:** both playable faction keys; only the listed generic subtypes qualify.

At rank 15, a Herald of Tzeentch (Metal or Tzeentch) who is in a region, is not besieging, and is not the faction leader can receive a dilemma to be replaced by the matching Exalted Lord of Change. Tzeentch-marked Chaos Lords and Tzeentch/Metal Sorcerer Lords use the same system to become a Tzeentch Daemon Prince. Accepting replaces the character and grants the replacement experience to a target rank calculated as `floor(previous rank × 0.5) + 1`; deferring makes the offer eligible again after 10 turns, while refusal is permanent. Eligible AI generals do not receive the dilemma: each has a 25% upgrade roll on its faction turn. This is a campaign acquisition/conversion rule; the resulting characters' skill trees remain in the character catalog.

### Trickster Cults and Cult Supplies

**Applicability:** `wh3_dlc24_tze_the_deceivers` only.

The Deceivers establish Trickster Cults instead of occupying settlements and use `wh3_dlc24_slot_set_tze_changeling` plus pooled resource `wh3_dlc24_tze_cult_supplies`, rather than the standard cult network. They can recruit and replenish in foreign territory and receive trespass immunity. Their armies are hidden while in a region containing one of their Trickster Cult buildings, but entering Raiding stance explicitly makes the army visible regardless of the local cult. Cult Supplies are produced chiefly by Trickster Cult infrastructure and Scheme rewards and are the construction currency for Trickster Cult buildings. The decoded resource-cost rows define six building-cost bands: 10, 20, 30, 40, 50, and 100 Cult Supplies. The economy catalog remains authoritative for the individual building chains and their ordinary outputs.

There are three establishment routes with different state changes:

- Capturing/infiltrating a settlement through `occupation_decision_establish_foreign_slot` establishes a cult and asks for a **symbiotic** or **parasitic** outcome. The script adds one random symbiotic or parasitic growth/income/expansion building at a tier clamped to the host settlement's main-chain level 1-3.
- A special Trickster Cultist action establishes a cult preloaded with either military buildings, parasitic buildings, or high-tier symbiotic buildings, according to the exact action key cached by the script.
- Expansion effects roll at the Deceivers faction-turn start and create a new Trickster Cult in one valid adjacent occupied region without an existing Deceivers foreign-slot manager.

Each cult grants the Deceivers trespass permission against its region owner. A lost battle reveals the Trickster Cult in that region. If the Deceivers have no armies at faction-turn start, all of their cults in occupied regions are revealed to their respective owners. The two capstone army buildings are scripted: the parasitic capstone creates a hostile Chaos-rebel force, while the symbiotic capstone creates a Deceivers army and then dismantles the capstone building.

Trickster Cults are not razing-proof. The current removal listener explicitly handles `ForeignSlotManagerRemovedEvent` where `cause_was_razing()` is true and reports that the cult was destroyed by razing. The same script also dismantles the one-use capstone buildings after their effects resolve.

### Formless Horror forms

**Applicability:** `wh3_dlc24_tze_the_deceivers`; character subtype `wh3_dlc24_tze_the_changeling`.

At new-game start, a human Deceivers campaign receives one randomly selected form from the script's 13-entry `player_free_forms` list. AI Deceivers instead receive every form in the separate 15-entry `ai_free_forms` list.

When the Changeling wins a battle, every valid enemy character subtype in that battle is passed to the transformation system; available, not-yet-known subtypes become permanent unlocked forms. The same grant function is used when specified unique heroes are recruited and when valid characters become available through alliances or confederation. Vlad and Isabella are paired: acquiring either subtype submits both. Form selection changes the Changeling's battle form; the skill-tree and unit catalogs remain authoritative for his own underlying abilities and for cataloged target units.

### Theatres, Schemes, permanent rifts, and victory state

**Applicability:** `wh3_dlc24_tze_the_deceivers` only.

For a human Deceivers faction, the Changeling script issues theatre-specific Minor Scheme missions at campaign start and registers the scripted victory progression below. The AI branch does not run this player mission/victory sequence. Objectives include cult establishment or construction, corruption thresholds, battles, acquiring forms, and targeted character/region events. A theatre's Grand Scheme requires completion of half of its Minor Schemes followed by its quest battle. Grand Scheme completion applies a theatre-specific scripted world change, records a specific allied or enemy reinforcement for the Ultimate Scheme battle, and can grant permanent effects, forms, ancillaries, restricted units, cultists, or Rift Gems. These rewards are data-driven per theatre rather than a symmetric generic reward.

Rift-Gem Scheme rewards add one `wh3_dlc24_tze_rift_gems`. On reaching two gems, the script unlocks the initially script-locked rift technologies. Those technologies open permanent nodes from `wh3_dlc24_teleportation_node_template_the_changeling` in campaign-specific theatre locations. Traversal consumes 250 Grimoires (`wh3_dlc24_teleportation_network_traverse_the_changeling_node`).

Victory progression is explicit saved state. In Immortal Empires, two completed Grand Schemes satisfy the short scripted objective and five trigger the long-victory objective plus the Ultimate Scheme quest battle. In Realm of Chaos, three Grand Schemes trigger the corresponding long objective and final battle. Winning that final battle sets `the_changeling_win`, registers the ending movie, and completes the remaining long-victory objective. Every completed Grand Scheme also changes the final battle through its recorded reinforcement string.

## Faction coverage

- **Oracles of Tzeentch** — `wh3_main_tze_oracles_of_tzeentch`: Grimoires and Changing of the Ways; Winds manipulation, Teleport stance, and the documented attrition immunities; Daemon Reforging and post-battle sacrifice; standard Tzeentch cult network, its human/AI starting-cult branches, and cult-based diplomatic contact; Unholy Manifestations; Kairos's Fragments of Sorcery; human-dilemma/AI-roll generic-lord ascension; Oracles variants of the Blue Scribes and Aekold recruitment chains.
- **The Deceivers** — `wh3_dlc24_tze_the_deceivers`: shared Grimoires/Changing-of-the-Ways actions with the documented Borrow-Time/Spread-Corruption exception; Teleport stance but not Winds manipulation, plus the documented attrition immunities; Daemon Reforging and post-battle sacrifice; foreign-territory recruitment/replenishment, cult-region hiding with the raiding exception, Trickster Cults and Cult Supplies; human-dilemma/AI-roll generic-lord ascension; Formless Horror forms and their human/AI start branches; human-only Scheme/victory progression, permanent rifts, and scripted victory state; Changeling-specific variants of the Blue Scribes and Aekold recruitment chains.

## Evidence register

### Project material consulted

- `README.md`
- `data/economy/README.md`
- `data/economy/faction_index__wh3__8.1.1.csv`
- `data/economy/factions/tzeentch/wh3_main_tze_oracles_of_tzeentch.csv`
- `data/economy/factions/tzeentch/wh3_dlc24_tze_the_deceivers.csv`
- `data/economy/source_exports/db/building_effects_junction_tables/data__.tsv`
- `data/unit_stats/README.md`
- `data/unit_stats/normalized/tzeentch__wh3__8.1.1__ultra.csv`
- `data/unit_stats/lookups/unit_rosters__wh3__8.1.1__ultra.csv`
- `data/unit_stats/lookups/unit_abilities__wh3__8.1.1__ultra.csv`
- `data/unit_stats/source_exports/text/db/{campaign_localised_strings,effects,initiative_sets,initiatives,pooled_resources,rituals,ui_text_replacements}__.loc.tsv`
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 17 files under `data/skill_trees/characters/tzeentch/`

### Installed vanilla game files and stable records

Read through the read-only RPFM interface with the merged vanilla CA packs (`PackFile`, using `pack_key=$CA` where required):

- `script/campaign/wh3_campaign_daemon_cults.lua` — `faction_to_cult`, `buildings_that_destroy_cult`, `ChaosCults_ForeignSlotBuildingCompleteEvent`, `ChaosCults_FactionTurnStart`, `cult_spawn_random_cults`, and the new-game AI two-cult branch.
- `script/campaign/wh3_campaign_unholy_manifestations.lua`.
- `script/campaign/wh3_campaign_greater_daemons.lua` and `script/campaign/wh3_campaign_character_upgrading.lua` — rank-15 subtype mappings, eligibility, replacement experience calculation, dilemma delay/refusal, and the AI 25% upgrade roll for Herald and marked-mortal ascension.
- `script/campaign/wh3_dlc26_fragments_of_sorcery.lua` — `target_faction_key`, six `initiative_set_key` entries, `unlocked_at_rank`, `initialise_default_spells`.
- `script/campaign/wh3_dlc24_the_changeling.lua` — `bonus_cultist_buildings`, `occupation_buildings`, `player_free_forms`, `ai_free_forms`, `rift_regions`, `schemes.victory_conditions`, the human-only Scheme/victory setup, `rift_gem_missions`, `the_changeling_hidden_cults_faction_turn_start`, `the_changeling_loses_battle`, `the_changeling_formless_horror_defeated_in_battle`, `the_changeling_settlement_sacked`, `the_changeling_rift_tech_unlock`, `grant_formless_horror_form`, and `open_rift`.
- `script/campaign/wh3_main_legendary_characters.lua` — current Blue Scribes and Aekold eligibility, unlock ranks, faction-specific mission keys, choice dilemmas, and AI fallback turns.
- `db/rituals_tables/data__` — `wh3_main_ritual_tze_cotw_*`, `wh3_dlc24_ritual_tze_cotw_the_changeling_spread_corruption`, `wh3_main_ritual_tze_gg_*`.
- `db/campaign_group_rituals_tables/data__` — campaign groups `wh3_main_feature_tzeentch`, `wh3_main_feature_tzeentch_excluding_the_changeling`, and `wh3_dlc24_tze_the_deceivers`.
- The same table's `wh3_dlc20_feature_vilitch` rows were checked explicitly to separate Vilitch-only actions such as Spawnification from the two in-scope Tzeentch faction groups.
- `db/campaign_group_diplomatic_manipulation_category_junctions_tables/data__` — `break_alliance`, `force_peace`, `force_war`, `transfer_settlement`.
- `db/resource_cost_pooled_resource_junctions_tables/data__` — Changing-of-the-Ways costs, Cult Supplies bands, `wh3_main_tunnel_tze_winds_of_magic`, and `wh3_dlc24_teleportation_network_traverse_the_changeling_node`.
- `db/campaign_features_tables/data__` — Oracles enablement and Deceivers disablement of `winds_of_magic_manipulation`; Tzeentch `daemonic_unit_saving_postbattle`, `not_intercepted_on_tunneling`, and `tunnel_attack_is_ambush` flags; the Deceivers' foreign-slot recruitment and transformable-leader flags.
- `db/campaign_stance_effects_junctions_tables/data__` and current effect localisation — the Deceivers-specific raiding bundle and its `Visible regardless of local Trickster Cult` override.
- `db/campaign_map_attrition_faction_immunities_tables/data__` — four shared exact immunity keys and the Deceivers-only `regionless` row.
- `db/campaign_post_battle_captive_options_tables/data__` and `db/resource_cost_pooled_resource_junctions_tables/data__` — Offer to Tzeentch, its group, transaction keys, captive scaling/cap, and resource factors.
- `db/technology_effects_junction_tables/data__` — `wh3_main_effect_tze_cotw_enable_*` and the technology keys listed above.
- `db/effect_bundles_to_effects_junctions_tables/data__` and `db/ritual_payload_effect_bundles_tables/data__` — `wh3_main_ritual_tze_gg_*` and `wh3_main_ritual_tze_cotw_halt_faction`.
- `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, and `db/cdir_events_mission_payloads_tables/data__` — objective types, exact amounts/buildings/unit sets, and chain payload hand-offs for the two legendary heroes.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Creative Assembly, [Update 7.0 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/90) — official confirmation of Oracles' turn-one diplomacy contact through cult regions.
- Creative Assembly, [Update 6.0 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0) — official description of Daemon Reforging inputs and outcomes.
- Creative Assembly, [Patch 6.1 notes: Kairos Fragments of Sorcery](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/49-total-war-warhammer-iii-patch-notes-6-1).
- Creative Assembly, [Patch 5.2 dev blog: Chaos Cult rework](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/29).
- Steam, [The Changeling — Shadows of Change](https://store.steampowered.com/app/3301110/Total_War_WARHAMMER_III__The_Changeling__Shadows_of_Change/).
- Warhammer Community, [Shadows of Change overview](https://www.warhammer-community.com/en-gb/articles/j5Kf0OG2/total-war-warhammer-iii-corrupt-coerce-and-concoct-with-the-shadows-of-change-dlc/).
- Creative Assembly, [Patch 4.2 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/2-total-war-warhammer-iii-patch-4-2-0) — official roster confirmation for Aekold Helbrass and the Blue Scribes.
- Creative Assembly, [Patch 6.3 dev blog](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/77-total-war-warhammer-iii-%E2%80%93-patch-6-3-dev-blog) — official confirmation that Aekold's former CA Account requirement was removed.

### Evidence limitations

- RPFM 5.0.6 returned the paths and records above through sequential, read-only calls to `scripts/rpfm-call-locked.ps1`. Merged vanilla pack access used `PackFile` with the literal `$CA` placeholder. One exact `rituals_tables` decode failed with an allocation error and was not retried; exact prefix search and smaller dependent relations supplied the needed closure. One initial exact global-search response was unexpectedly large, so all subsequent reverse searches were captured and reduced immediately to exact match paths and counts. No game pack was edited or saved.
- The fixed human starting-cult locations come from Creative Assembly's current Patch 6.1 notes. The installed daemon-cult Lua exposes the separate AI randomization branch, while the faction-start Lua contains only campaign-intro setup; no unsupported startpos implementation detail is asserted for the human pair.
- The decoded records expose both base and upgraded Unholy Manifestation variants but not the engine-side Great Game transition that selects between them; no unsupported threshold is asserted.
- Localised help text still contains an obsolete Teleport-technology sentence marked `REMOVED`. The reported 40-reserve base cost comes from the current resource-cost relation; no obsolete unlock requirement is asserted.
