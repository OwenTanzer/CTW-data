# Vampire Coast campaign mechanics — patch 8.1.1

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Specific 9.0 corrections:** See [targeted historical-guide errata](../COMPATIBILITY_9.0.md#targeted-historical-guide-errata) before using rite cooldowns, Books ownership, Krell or Vlad/Isabella role descriptions below. Other claims retain their stated historical scope.

> **Scope:** Total War: WARHAMMER III, patch **8.1.1**, Steam build **24237342**. Race: Vampire Coast (`vampire_coast`). Playable factions: 4. Campaign: Immortal Empires (`wh3_main_combi`); no Vampire Coast faction is playable in the Realms of Chaos campaign in this snapshot.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

This guide records campaign mechanics that are not represented adequately by the existing normalized catalogs. Ordinary settlement and ship-building levels, costs, construction times, prerequisites and effects belong to the four faction economy exports. Unit permissions, Regiment-of-Renown battle statistics, abilities and attributes belong to the unit catalog. Lord and hero skill-node effects belong to the character and skill-tree exports. Those facts are not repeated here. A building, unit, character subtype, trait or effect named below is an input to a campaign lifecycle or an applicability boundary, not a replacement catalog entry.

## Mechanically relevant material not captured elsewhere

### Pirate Coves

**Applies to:** all four playable factions. The occupation route is available to eligible Vampire Coast armies; the agent route belongs to Vampire Fleet Captains. Neither installed route is human-only.

A Pirate Cove is a hidden, one-building foreign slot owned by the establishing Vampire Coast faction inside another faction's port. Both installed campaign-group routes carry the `ON_SEA` target criterion, matching the help text's foreign-port restriction. It can be established in two ways:

- After winning an eligible battle at a foreign port, **Establish a Pirate Cove** leaves the target faction in possession, releases captives, pays half the settlement's normal building loot, and prevents the attacking army from regaining action points that turn. The installed target criterion does not require the army to have approached the battle from sea.
- A Vampire Fleet Captain can use the settlement action `wh2_dlc11_agent_action_dignitary_hinder_settlement_establish_pirate_cove`. Its installed action record has nominal 100% success and routes every result to establishment. The acting Captain then receives a 15-turn personal lockout. For the same 15 turns, the faction receives a +200% cost modifier for this action: a different Captain may establish another cove during the window at the surcharge, while the original Captain cannot.

The base treasury price of the Captain action is not stored in the decoded action record, so only the installed +200% follow-up modifier is asserted. The settlement owner has no Vampire-Coast-cove discoverability: the installed localization explicitly marks it hidden and “not for display.” Generic foreign-slot discovery buildings therefore do not expose or remove these coves. An ordinary non-razing change of settlement owner preserves the foreign slot; razing or abandoning the host removes it with the settlement. Installed help text also says that if another Vampire Coast faction establishes its own Cove in that port, the original Cove is destroyed and replaced; no automatic transfer of the original owner's Cove is asserted. The cove owner may dismantle its current building and spend one turn constructing a different choice; the four choices are mutually exclusive and do not replace any normal settlement building:

- **Corrupted Tavern** — 2,500 treasury; +20 Infamy per turn, +5 Vampiric corruption in the host region, and +3 in adjacent provinces.
- **Picaroons' Hideout** — 5,000 treasury; transfers income equal to 50% of the host region's income and provides +10 Infamy per turn.
- **Pirates' Rest** — 2,500 treasury; +20 Infamy per turn, +1 Vampire Fleet Admiral recruit rank, +1 Gunnery Wight capacity, and +1 Mourngul Haunter capacity.
- **Smugglers' Cove** — 2,500 treasury; +200 sea-trade GDP, +2% tariffs, +3% research rate, and +10 Infamy per turn.

Host-settlement damage degrades but does not uniformly switch off a cove. At the damaged state, Corrupted Tavern, Picaroons' Hideout and Pirates' Rest retain their non-Infamy benefits while their Infamy falls to 2, 1 and 5 respectively. Smugglers' Cove falls to +100 sea-trade GDP, +2% tariffs, +2% research and +1 Infamy. Ruined values are zero.

### Shipbuilding and eligible admirals

**Applies to:** each faction leader and the four technology-unlocked Legendary Pirates. **Excluded:** ordinary male and female Vampire Fleet Admirals.

An eligible admiral's army is a character-bound horde with ten ship-building slots. Its ship Growth and population surplus belong to that force and are spent on its ship infrastructure; the ship moves with the commander, does not occupy a settlement slot, and can recruit from completed ship buildings while the applicable ship stance/recruitment effect is active. The ship is not a faction pool asset and is not inherited by an ordinary replacement admiral. The eligible legendary and technology admirals recover through their immortality lifecycle, carrying their character-bound infrastructure with them. The four lord-exclusive chains are subtype-locked to Aranessa Saltspite, Cylostra Direfin, Luthor Harkon or Count Noctilus; their remaining eligible ship chains are shared. The economy catalog is authoritative for every level, cost, duration and building effect.

The installed help text explicitly limits shipbuilding to Vampire Coast Legendary Lords and the Legendary Pirates in the technology tree. For a human Vampire Coast faction, after the 600-research-point technology `wh2_dlc11_tech_cst_admirals_00`, which also grants the faction's Storm and Reef attrition immunity, four one-step technologies each require 100 research points and spend 2,000 Infamy. Each is one-time and adds one fixed character to the Lord pool:

- Trusty Montford — Vampire Fleet Admiral (Vampires).
- O'Bones Macdonald — Vampire Fleet Admiral (Deeps).
- Burke Black — Vampire Fleet Admiral (Death).
- Two Toes Adley — Vampire Fleet Admiral (Deeps).

All four technology admirals are loyalty-exempt and their installed innate skills grant both shipbuilding and hidden immortality. They are added to the pool rather than spawned as free armies; normal Lord recruitment still applies. Once recruited, defeat wounds them and they return through the normal immortal-character recovery lifecycle rather than opening a second technology purchase. Ordinary admirals have neither that ship trait nor a ship panel.

### Loyalty, Fleet Offices and post-battle sharing

**Applies to:** the six ordinary male/female admiral subtypes for loyalty. Legendary lords and the four technology admirals have loyalty disabled. The installed personality/event loyalty listeners run only for human-controlled ordinary admirals. Fleet Offices apply race-wide to eligible Lords.

The faction leader automatically holds the Fleet Admiral post, whose holder's army gains +15% sacking income. Eight further offices each accept one occupant, cost nothing to assign, and have no minimum term. Beast Master, Boatswain, Gunnery Chieftain, Sailing Master, Log Keeper and Deck Sergeant require rank 5; Quartermaster requires rank 8; First Mate requires rank 10. The installed position records require loyalty 5 where loyalty is applicable and contain no Vampire Coast subtype-exclusion row. Their campaign effects combine faction-wide support with benefits to the occupant's own force:

- **Beast Master:** faction-wide -10% upkeep for Terrorgheists, Scurvy Dogs and Deck Droppers; own-force +2 recruit rank for the designated giant monsters and +15% weapon strength for the designated flying/dog units.
- **Boatswain:** +10 ship Growth, -15% construction cost and +10% research rate through its faction-wide scopes.
- **Gunnery Chieftain:** faction-wide +10% ammunition for the designated gunnery units; own-force +12% missile strength for gunnery mobs and +10% reload reduction for artillery.
- **Sailing Master:** faction-wide -50% sea-attrition damage, +10% Lord line of sight and +5% campaign movement.
- **Log Keeper:** -30% rite cost, +10% sea-trade income and -15% recruitment cost.
- **Deck Sergeant:** +10 leadership for the designated infantry; the occupant's force also gains +10 melee defence for those units and +10% replenishment.
- **Quartermaster:** +2 loyalty, -8% upkeep and additional recruitment capacity through the installed faction-wide/local scopes.
- **First Mate:** +2 Vampire Fleet Captain capacity and +3 recruit rank for Lords and heroes; the occupant gains Frenzy and 15% physical resistance.

The field-battle **Share the Loot** captive option spends 50 Infamy, adds one loyalty to the commanding ordinary admiral, and applies its three-turn +50-army-XP bundle. The similarly named settlement-capture outcome also adds one loyalty and applies the bundle, but has no -50 Infamy transaction. The generic loyalty feature handles consequences at its minimum; the exact mutiny probability is not exposed by the Vampire Coast records inspected here and is not guessed.

The **Curse of Eternal Service** is the other direct loyalty control: for five turns it prevents loyalty decline, applies the installed positive loyalty-per-turn effect, and adds +5 control. Its cost and cooldown are listed with the other rites below.

### Campaign stances and settlement climates

**Applies to:** all four playable factions, with force-type gates where stated.

- Ordinary armies have the Vampire Coast **Encamp** mapping; eligible shipbuilding forces use the shipbuilding Encamp mapping. Both enable recruitment/replenishment and supply camp attrition immunity, +75% ambush defence, +5 leadership and +5 melee defence; the shipbuilding version also permits ship construction.
- Eligible character-bound ships have **Flagship Expansion**, enabling shipbuilding and recruitment, adding +20 Winds of Magic from channelling to the force and projecting +10 Winds of Magic to nearby owned forces.
- Horde forces have the installed Vampire Coast **Raiding** mapping. **Dig for Treasure** uses the Channeling stance mapping and its separate scripted action-point rule documented below.

The relevant stance resource-cost fields are blank, but no installed record directly establishes a zero movement-point entry cost; that community claim is not promoted into a current rule.

Race-wide climate mapping marks desert, frozen, island, jungle, ocean, savannah and temperate as suitable; mountain and wasteland as unsuitable; and chaotic and magical forest as uninhabitable.

### Raise Dead, sea pools and Renown pools

**Applies to:** all four playable factions. Both land and at-sea vampiric recruitment features are enabled.

The installed data keeps three recruitment systems distinct:

1. `wh2_dlc11_cst_vampire_pirate_merc_pool` is the Vampire Coast casualty/battle-site pool. Its wider eligible roster begins at zero and is populated by the generic vampiric calculation from battle-site casualties and unit tier, with capacity and replenishment clamped by campaign variables. It is separate from the Vampire Counts pool.
2. `wh2_dlc11_cst_vampire_pirate_province_pool` is mapped to Immortal Empires maritime, river and lake regions and also displays as **Raise Dead**. It begins with basic Deckhand/Gunnery/Bloated Corpse availability and has its own per-group caps and replenishment chances, which is why recruitment at sea can remain available without a nearby land battle marker.
3. `wh2_dlc11_cst_units_of_renown_pool` contains Pieces-of-Eight regiments and Queen Bess. It is not replenished or populated by local casualties.

Recruiting consumes a copy from the applicable local pool. Moving to another mapped maritime, river or lake region changes the province pool being consulted; it does not turn those copies into a faction-wide stockpile. A single Mourngul group also appears in the Vampire Counts pool under a Vampire Counts subculture requirement, but that typed permission does not merge the two races' pools.

### Pieces of Eight and their regiments

**Applies to:** human Vampire Coast campaigns; unlock state is faction-specific.

Seven roving pirate carriers hold the first seven Pieces of Eight. At new game, each human playable faction receives one `ENGAGE_FORCE` mission per carrier and must win against that carrier's force. The carriers patrol rather than remaining static; if one respawns before a faction has earned its piece, that faction's replacement mission uses `KILL_CHARACTER_BY_ANY_MEANS`. The installed script contains no universal Vampire-Coast-Lord subtype check on that respawn route.

The eighth unlock, the **Cursed Bullion of Bogenhafen** regiment, comes from the relevant playable lord's own Immortal Empires quest battle: Quest for Slann Gold for Harkon, Captain Roth's Moondial for Noctilus, Krakens' Bane for Aranessa, or The Bordeleaux Flabellum for Cylostra. Mission success removes that regiment's event restriction for the completing faction; it does not globally unlock the unit for other Coast players.

Each regiment's underlying pool group has a maximum count of one. Unlocking a piece does not create multiple copies: recruitment consumes its available copy, and loss/disbanding uses 100% partial replenishment at 0.1 per turn before it can be recruited again. Queen Bess uses the same pool interface but is not a Piece-of-Eight regiment.

### Queen Bess and the four rites

**Applies to:** all four playable factions. Every rite has a five-turn global rite cooldown in addition to its own cooldown. Installed payloads are not marked human-only, although the listed unlock UI and manual choice are player-facing.

- **Curse of the Bountiful Treasure:** unlock condition displayed as owning three Plunder Pile buildings; costs 0; 15-turn cooldown; immediately grants 500 treasury for every owned building in the Buried Treasure chain.
- **Curse of Eternal Service:** unlock condition displayed as owning three settlements; costs 2,000; 20-turn cooldown; lasts five turns; prevents loyalty decline, applies the positive loyalty-per-turn effect and grants +5 control.
- **Curse of the Queen's Cannon:** unlock condition displayed as faction-leader rank 12; costs 1,000; 25-turn cooldown; its bundle lasts ten turns and gives +15% replenishment. It also places one Queen Bess into the Renown pool for recruitment into any army.
- **Curse of the Sea Mist:** unlock condition displayed as completing one treasure-map mission; costs 3,500; 30-turn cooldown; lasts five turns; gives faction armies immunity to Cursed Mist attrition and enables vanguard deployment for the rite's designated monster set.

Queen Bess starts at zero availability, has a faction pool maximum of one, and has no automatic pool-replenishment chance. The rite is repeatable: after the existing field or pool copy is gone and the cooldown permits, recasting supplies the replacement. The one-count cap prevents stockpiling or fielding a second copy.

### Treasure maps and Dig for Treasure

**Applies to:** campaigns with at least one human-controlled Vampire Coast faction. Every human playable faction receives its own starting map, but the active count, category flags, level-three count and chance accumulator are one shared saved script state—not one state per faction.

The generation guard allows a new map only while the shared active counter is below six. While below that threshold, each EndOfRound adds five percentage points to the shared accumulator. A qualifying human Vampire Coast battle victory then tests a base 15% chance plus that accumulator and the faction's `treasure_map_find_chance` bonus. Defeating one of the seven rogue-pirate or three Shanty factions adds 30 points; having no active map adds another 50. When a map triggers, the accumulator resets. Because multi-human setup issues several starting maps while initializing the counter to one, six is not a trustworthy faction-by-faction or actual co-op mission cap.

Normal non-pirate battle generation explicitly requires the winning playable Coast faction to be human. The pirate-target bonus branch only requires a human-involved battle and does not repeat that winner-control check, so a main-side AI playable Coast faction can receive that narrow contingent trigger. AI Coast factions do not receive starting maps or run the ordinary generation branch.

Completing or cancelling a map releases its category and decrements the shared active count; successful completion immediately schedules another map test. In a multi-human Coast campaign, one player's issue/completion/cancellation therefore changes the state used by the others, and new-game bookkeeping starts at one even though a starting map is issued to each human faction. The starting map pays 2,000 treasury and 150 Infamy. Unique maps pay 5,000, 150 Infamy and a random rare ancillary. Ordinary maps pay 1,000–4,000, with their configured tiers adding a common, uncommon or rare ancillary where specified. Count Noctilus's treasure-map war-mission reward forces a 100-point map test and is then removed.

The marked location is evaluated only when the Lord's army searches within its mission radius. Adopting **Dig for Treasure** stance ID 11 consumes all remaining movement and clears the local selection. A failed search displays its failure event but does not cancel the map, so another turn and another full-action search may be required. This action is attached to a military force/general, not to an independent hero.

### Infamy, Shanty rivals and the Battle of the Eternal Tides

**Applies to:** the human Shanty campaign loop for all four playable factions. Infamy itself is faction-scoped. The installed resource has `ai_ignored=true` for AI planning, but that flag does not prevent scripted transactions.

Infamy cannot fall below zero and has an installed ceiling of 1,000,000. Human playable factions start at 200. AI playable Coast factions receive sequentially higher 200-point seeds, while the seven roving and three Shanty pirate values are fixed by script. When any human Coast faction causes the listeners to load, winning battle sides and successful assassination/wound actions award any playable-capable Coast faction that passes the script test, including AI-controlled playables. Shanty hunt missions themselves remain human-only.

Battle Infamy equals the defeated side's force value divided by 10, multiplied by the winner/loser relative-force ratio clamped to 0.5–1.5, multiplied by the killed proportion, then by 0.3; the result is floored and capped at 500 per eligible winning faction. A supported assassination or wound action adds 100. Other positive factor families are missions, Pirate Coves, razing and miscellaneous awards. Negative families are commandments, Share the Loot and technology. Concrete transactions include +200 from the Vampire Coast raze reward, -50 from field-battle Share the Loot, -2,000 for each technology admiral, the cove income listed above, and the treasure-map rewards listed above.

The ranking contains the four playables, seven rogue pirate factions, the Sunken Land Corsairs and three Shanty rivals. A human faction that sequentially exceeds the next Shanty holder's Infamy provokes its hunt mission; defeating that spawned leader takes the verse.

If another playable Vampire Coast faction already holds a verse, the mission text promises a 15% ordinary battle steal, a faction-leader defeat guarantee, or an alliance guarantee. In the installed script, the battle listener indexes numeric winner/loser arrays by faction key and shadows its winner index, so neither battle route is established as operative. The positive-diplomacy and turn-start existing-alliance listeners do explicitly complete the mission. This is a current-code limitation, not a confederation route.

Collecting all three verses issues the faction-appropriate infinite, non-cancellable **Battle of the Eternal Tides** set-piece mission. Harkon, Aranessa, Cylostra and Noctilus each point to their own final-battle variant. The records mark it as a final quest battle; this is the Infamy/Shanty campaign-system finale and is separate from merely reaching an Immortal Empires short- or long-victory threshold.

### Shared scripted campaign events

**Ocean of Opportunities applies to:** a campaign containing any human Vampire Coast faction. The chosen human faction receives the event branch.

The dilemma `wh2_dlc11_cst_dilemma_ocean_of_opportunities` selects one of four fixed Bretonnian, Empire, Dark Elf or Norscan patrol invasions. Selection spawns its army, forces war, disables diplomacy with the spawned faction and issues the matching mission. Mission success destroys the invader army; if not intercepted, the patrol is also cleaned up after returning to its first route endpoint. This is a temporary scripted faction, not an ordinary diplomatic war.

### Faction-specific scripted branches

#### The Awakened — Luthor Harkon's mind

**Applies only to:** The Awakened (`wh2_dlc11_cst_vampire_coast`).

A human Harkon starts in the `mad` personality. While he is alive, leading a force and not restored, each faction-turn start decrements the saved swap counter. At zero the script sets it to `5 + random_number(5)`; with the installed inclusive 1–5 draw, the next swap is 6–10 turns later, despite the script comment saying 5–10. It then selects a personality different from the current one among Coward, Mad, Prideful and Hateful. The old trait is removed and the matching incident applies the new state.

On turn 5, the human receives `wh2_dlc11_harkon_factured_mind_mission`. Permanent restoration requires both construction of `wh2_dlc11_special_ancient_vault_2` and success in `wh3_main_ie_qb_cst_harkon_quest_for_slann_gold`; order does not matter because both flags are saved. Completion replaces the personality with `restored`, completes scripted objective `restore_harkon_mind`, and fires `ScriptEventHarkonRestored` for the mission. An AI-controlled Harkon is set directly to `restored` at new-game setup and does not run the human personality loop.

#### The Dreadfleet — Noctilus's war missions

**Applies only to:** a human-controlled Dreadfleet (`wh2_dlc11_cst_noctilus`).

The saved counter begins at 5. When it reaches zero, the script chooses from met factions that are not Noctilus himself, not already enemies or allies, and still have a military force. The resulting **Declare War** mission has a ten-turn limit and pays 1,500 treasury plus one random reward: either the forced treasure-map test or one of thirteen ten-turn army/faction bundles covering the installed armour, leadership, melee, missile, resistance, raiding, replenishment, sacking, siege, weapon-strength or Winds-of-Magic variants. After issuing, the counter becomes `10 + random_number(10)`, or 11–20 turns under the installed inclusive draw. If no valid target exists, it remains due and checks again next turn. AI Noctilus has no equivalent listener.

#### The Drowned — Damned Paladin

**Applies only to:** The Drowned (`wh2_dlc11_cst_the_drowned`).

The Damned Paladin subtype `wh2_dlc11_cst_ghost_paladin` is permitted only to The Drowned among the four playables and represents Robert Barthelemy. It is hidden from the ordinary recruitment UI and has no recruitment category. No unique-agent charge, acquisition payload, unlock mission or respawn listener was found, so the campaign's starting copy is a contingent unique asset rather than a repeatable hero pool. His cataloged rank-20 Immortality node changes later defeat into wounding; if he is permanently lost before acquiring it, no replacement route is evidenced.

#### Pirates of Sartosa and remaining faction boundaries

**Applies only to:** Pirates of Sartosa (`wh2_dlc11_cst_pirates_of_sartosa`) where noted.

Aranessa's living Sartosan units, faction permissions, unique ship chain, landmark/building differences and skill effects are already represented by the typed roster, economy and character catalogs. No additional Aranessa-only campaign listener, alternate Pieces/Infamy lifecycle, or acquisition script was found. Cylostra likewise has no second faction-local listener beyond the Damned Paladin boundary above and her cataloged ship/building/skill material. Count Noctilus's Galleon's Graveyard economy and unique ship rows are cataloged; his uncataloged recurring war mission is the exception documented above.

### Diplomacy and confederation

**Applies to:** all four playable factions.

Vampire Coast factions cannot confederate one another. The installed material contains no technology, rite, dilemma, forced-confederation payload, defeat-confederation listener or legendary-lord recovery path for the four factions. Consequently, conquering or destroying another playable Coast faction does not transfer its legendary lord or personal ship. Alliances remain ordinary diplomacy and can matter for Shanty-verse transfer; the only additional diplomacy lock found is the temporary scripted one used by Ocean of Opportunities.

## Faction coverage

- **The Dreadfleet** (`wh2_dlc11_cst_noctilus`): every race-wide system; Noctilus ship chain; Captain Roth's Moondial eighth-Regiment route; human-only saved war-declaration mission loop and its treasure-map alternative; no AI mission loop; cannot absorb the other Coast lords.
- **Pirates of Sartosa** (`wh2_dlc11_cst_pirates_of_sartosa`): every race-wide system; Aranessa ship chain; Krakens' Bane eighth-Regiment route; living Sartosan roster/building/skill distinctions remain in their normalized catalogs; no additional faction-only campaign listener found; cannot absorb the other Coast lords.
- **The Drowned** (`wh2_dlc11_cst_the_drowned`): every race-wide system; Cylostra ship chain; The Bordeleaux Flabellum eighth-Regiment route; exclusive, non-repeatable starting Damned Paladin boundary; no additional faction-only listener found; cannot absorb the other Coast lords.
- **The Awakened** (`wh2_dlc11_cst_vampire_coast`): every race-wide system; Harkon ship chain; Quest for Slann Gold eighth-Regiment route and restoration flag; human personality rotation and two-condition restoration, with immediate restored state for AI Harkon; cannot absorb the other Coast lords.

## Evidence register

### Project catalogs reviewed first

- `data/faction_guides/TASK_B_PROMPT.md`, `data/faction_guides/RESEARCH_SPEC.md` and `data/faction_guides/TASK_A_PROMPT.md` — authoritative audit, scope, research and output contract.
- `data/economy/README.md`, `data/economy/faction_index__wh3__8.1.1.csv`, and the four Vampire Coast economy exports — ordinary settlement/ship-building coverage and faction keys; used to enforce the catalog boundary.
- `data/unit_stats/README.md`, `data/unit_stats/normalized/vampire_coast__wh3__8.1.1__ultra.csv`, typed faction permissions and Vampire Coast localization exports — roster, unit, ability, Regiment-of-Renown, mission and campaign vocabulary without duplicating normalized unit facts.
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 20 indexed Vampire Coast character exports — the four legendary lords, six ordinary admirals, four technology admirals, Damned Paladin and ordinary heroes; used to exclude skill-node effects.

### Installed patch 8.1.1 evidence through read-only RPFM

All paths below were decoded or queried from the installed vanilla packs through the read-only lock wrapper `scripts/rpfm-call-locked.ps1`, with the literal pack placeholder `$CA`. No game pack was edited or saved.

- `script/campaign/wh2_dlc11_vampire_coast.lua` — Harkon human/AI state, restoration flags, Noctilus mission selection/counter, Ocean of Opportunities, Dig for Treasure action consumption and Pirate-Cove agent cooldown/surcharge lifecycle.
- `script/campaign/wh2_dlc11_treasure_maps.lua` — starting-map applicability, shared six-map state, normal human generation, contingent AI pirate-battle branch, cancellation/completion lifecycle and reward tiers.
- `script/campaign/wh2_dlc11_infamy.lua` and `script/campaign/wh2_dlc11_roving_pirates.lua` — human/AI Infamy transactions, starting ranks, battle formula, seven Piece carriers, eighth quest-battle unlocks, carrier respawn, human-only Shanty hunts, playable-holder alliance path and the current battle-listener limitation.
- `script/campaign/wh2_dlc11_tech_tree.lua`, `script/campaign/wh2_dlc11_vampire_coast_loyalty.lua`, `script/campaign/wh2_dlc11_ship_upgrades.lua`, and `script/campaign/_narrative/races/wh3_narrative_vampire_coast.lua` — human technology-admiral pool acquisition, ordinary-admiral loyalty actor gates, cosmetic ship-model progression, and the empty WH3 shared narrative loader.
- Database relations: `campaign_features_tables`, `culture_settlement_occupation_options_tables`, `campaign_group_member_criteria_booleans_tables`, `campaign_group_settlement_occupation_option_foreign_slots_tables`, `campaign_group_agent_action_foreign_slots_tables`, `agent_actions_tables`, `action_results_tables`, `building_levels_tables`, `building_effects_junction_tables`, and `effect_bundles_to_effects_junctions_tables` — Cove entry, one-building choices, damage and cooldown behavior; Raise Dead at-sea feature; offices, rites and loyalty bundles.
- Database relations: `pooled_resources_tables`, `pooled_resource_factor_junctions_tables`, `campaign_group_pooled_resources_tables`, `resource_costs_tables`, `resource_cost_pooled_resource_junctions_tables`, `campaign_post_battle_captive_options_tables`, `campaign_group_member_criteria_factions_tables`, `missions_tables`, and `cdir_events_mission_option_junctions_tables` — Infamy scope/factors/transactions and Shanty/final-mission records.
- Database relations: `mercenary_pools_tables`, `mercenary_unit_groups_tables`, `mercenary_pool_to_groups_junctions_tables`, `vampire_mercenary_set_junctions_tables`, and `regions_vampire_mercenary_pools_junctions_tables` — battle-site, sea-region, Renown and Queen Bess pool separation, initial counts, caps and replenishment behavior.
- Database relations: `rituals_tables`, `campaign_group_rituals_tables`, `ritual_payloads_tables`, `ritual_payload_effect_bundles_tables`, `technology_nodes_tables`, `technology_effects_junction_tables`, `trait_level_effects_tables`, `agent_subtypes_tables`, `faction_agent_permitted_subtypes_tables`, `ministerial_positions_tables`, `ministerial_positions_culture_details_tables`, and `ministerial_position_effect_bundles_tables` — rite costs/durations, technology-admiral cost/acquisition/ship trait, loyalty applicability, Damned Paladin exclusivity and office gates. The corresponding character exports establish the technology admirals' innate hidden immortality and the Damned Paladin's rank-20 Immortality node.
- Database relations: `campaign_stance_effects_junctions_tables`, `campaign_stances_tables`, `campaign_group_members_tables`, `campaign_group_member_criteria_climates_tables`, and `campaign_group_member_criteria_subcultures_tables` — force-type stance mappings/effects, absence of a supported zero-entry-cost claim, and the Vampire Coast climate suitability map.
- Localization cross-checks under `data/unit_stats/source_exports/text/db/`: `campaign_group_rituals__.loc.tsv`, `ritual_additional_ui_explanation_texts__.loc.tsv`, `ui_text_replacements__.loc.tsv`, `campaign_localised_strings__.loc.tsv`, `effects__.loc.tsv`, `effect_bundles__.loc.tsv`, `missions__.loc.tsv`, `mission_text__.loc.tsv`, `pooled_resources__.loc.tsv`, and `uied_component_texts__.loc.tsv`.
- Key reverse-search anchors: all four playable faction keys; `wh2_dlc11_cst_harkon`, `wh2_dlc11_cst_noctilus`, `wh2_dlc11_cst_aranessa`, `wh2_dlc11_cst_cylostra`, `wh2_dlc11_cst_ghost_paladin`, `wh2_dlc11_cst_admiral_tech_01`–`04`, `cst_infamy`, `wh2_dlc11_slot_set_pirate_cove`, `wh2_dlc11_cst_vampire_pirate_merc_pool`, `wh2_dlc11_cst_vampire_pirate_province_pool`, `wh2_dlc11_cst_units_of_renown_pool`, and all Vampire Coast rite/mission families.

### Web grounding and vocabulary discovery

- [Creative Assembly: Total War: WARHAMMER III Patch 8.1](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes) — current patch context and the explicit fix for a script error when completing a Sea Shanty mission; installed 8.1.1 files control the remaining exact rules and expose the current playable-holder battle-listener limitation.
- [Creative Assembly's Curse of the Vampire Coast DLC page on Steam](https://store.steampowered.com/app/835670/Total_War_WARHAMMER_II__Curse_of_the_Vampire_Coast/) — official grounding for the four lords, four technology-unlocked admirals, unique ships, Fleet Offices, eight regiments and campaign agenda.
- [Creative Assembly Total War Academy: Vampire Coast](https://academy.totalwar.com/vampire-coast/) — official faction/lord vocabulary and discovery of Harkon's mind and Noctilus's war-mission branches; numeric and lifecycle claims were checked against the installed script.
- [Vampire Coast](https://totalwarwarhammer.fandom.com/wiki/Vampire_Coast), [Pirate Cove](https://totalwarwarhammer.fandom.com/wiki/Pirate_Cove), [Confederation](https://totalwarwarhammer.fandom.com/wiki/Confederation), and the four linked faction pages — secondary discovery/omission sources only; installed data controls precision claims.
- [CA fixed report: army stuck after establishing Pirate Cove](https://community.creative-assembly.com/total-war/total-war-warhammer/bugs/bugs-redirect/6166-vcoast-army-stuck-after-establishing-pirate-cove) — official confirmation that the obsolete post-Cove movement bug was fixed before this snapshot and is not documented as current behavior.

### Evidence limitations

- An initial unfiltered decode of the very large merged `campaign_group_members_tables/data__` response was truncated and discarded. A later one-process, locally filtered read returned only the relevant climate/rite/Infamy membership rows and is the evidence used here.
- Start-position horde and character placement is embedded in campaign start-position data rather than an exposed merged `data__` table. The Damned Paladin start claim therefore uses official/current faction grounding, while installed permission, UI-hidden status and absence of any acquisition/respawn listener establish exclusivity and non-repeatability.
- The cove action record does not expose its base treasury price. Its personal 15-turn lockout and faction +200% follow-up cost modifier are installed facts; no unsupported base number is supplied.
- The installed data exposes the generic vampiric casualty/tier pool inputs and pool caps, but not a single stable per-battle corpse-to-unit formula suitable for prose. Pool separation and lifecycle are stated without inventing such a formula.
- The Battle of the Eternal Tides rows are marked final quest missions. No claim is made that winning one, by itself, overrides the separate current Immortal Empires short/long-victory requirements.
- The installed playable-holder Shanty mission text describes battle-steal and leader-defeat routes, but the current listener's numeric-array/faction-key indexing and shadowed loop index do not establish either as operative. The guide distinguishes that code limitation from the functioning alliance listeners.
- Multi-human treasure-map scripts issue one starting map per human faction but retain one global saved counter/category state initialized at one. The guide reports that installed interference instead of normalizing it into per-faction behavior.
- No external community source is used as authority for an exact numeric mechanic when installed patch 8.1.1 evidence is unavailable.
