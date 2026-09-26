# High Elves campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | High Elves |
| Race slug | `high_elves` |
| Playable factions | 7 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already enumerate constructible High Elf buildings, their costs, times, prerequisites, and standardized effects. The normalized unit file and typed lookups cover unit statistics, roster permissions, military groups, abilities, attributes, contact effects, weapons, and mounts. The character index and per-character files cover skill nodes, effects, prerequisites, locks, and ancillary grants. This document therefore does not restate ordinary building output, roster differences, battle statistics, or skill effects. A cataloged building, unit, character, or skill is mentioned only when it is an input to a separate campaign system.

## Mechanically relevant material not captured elsewhere

### Influence, Patrons of the Realms, and High Elf confederation

**Applies to:** all seven playable High Elf factions.

Influence is both a race currency and an input to Patrons of the Realms. It also prices recruitable High Elf lords and heroes by their starting trait: higher Influence costs correspond to stronger traits, while zero-cost candidates can have detrimental traits. The available candidates are a live recruitment pool rather than a fixed skill-tree list. High Elf victories against non-High-Elf enemies generate Influence according to the battle result: 3 for a pyrrhic or close victory and 7 for a decisive or heroic victory. Tyrion replaces those values as described below.

Patrons of the Realms represents eleven Ulthuan regional seats, each with three ranks. A seat can be occupied only while its associated provincial capital is High-Elf-owned. Taking a seat and increasing its rank consume Influence; the installed court rituals use 30 Influence to take an available seat and 100 to increase its rank. Rank-3 seats cannot be threatened. Each held rank produces 1, 2, or 3 Favour per turn and grants the seat's thematic effect bundle. The system becomes available on turn 5 or earlier after the faction has accumulated 40 Influence.

Favour of the Phoenix King is the court's progression resource, but its attainable maximum also reflects the state of Ulthuan. A non-High-Elf occupier reduces maximum Favour by 45 for a provincial capital, 15 for a minor settlement, and 30 for a gate. Current Favour is penalized by defeating another High Elf (-30), losing a defensive battle (-10), and concluding positive diplomacy with specified rival subcultures (-20). Court actions include taking, upgrading, ceding, protecting, threatening, swapping, and extracting tribute from seats; protection is temporary and a protected seat cannot simply be displaced through the normal threat path.

Confederation through the court initially requires Favour tier 5 and the target's associated seat or seats at maximum rank. Each successful court confederation increases the Favour tier required for the next one by one. Aislinn uses a separate colony condition alongside Favour. Creative Assembly's current Q&A also states that confederating Aislinn through this system transfers his existing Dragonships. These rules supplement rather than replace ordinary diplomacy where that remains available.

### Tyrion: Champion of Ulthuan

**Applies to:** Eataine (`wh2_main_hef_eataine`).

Tyrion's non-High-Elf battle victories generate 5, 10, 15, or 20 Influence for pyrrhic, close, decisive, and heroic results respectively; those awards are doubled when the battle is in one of the script's Ulthuan regions.

Champion of Ulthuan provides nine Heir actions and six actions associated with the other playable High Elf legendary factions. The alliance actions unlock when Eataine confederates or forms the required alliance with Alarielle, Alith Anar, Teclis, Eltharion, Imrik, or Aislinn, and lock again if a qualifying alliance ends. Installed actions cost 40–150 Influence and have cooldowns of 3–10 turns. Their scripted and database payloads include restoring army movement, adding a veterancy rank, granting character experience to a force, raising a temporary militia army from a garrison, temporarily borrowing a qualifying allied army, and other army or regional interventions. The panel is thus a spend-and-cooldown system whose alliance branch expands with Tyrion's relations to the other legendary High Elf factions; it is not represented by Tyrion's skill tree.

### Teclis: Secrets of the White Tower

**Applies to:** Order of Loremasters (`wh2_main_hef_order_of_loremasters`).

The White Tower is divided into five floors: Being, Brilliance, Darkness, High Loremaster, and Oblivion. Its actions spend Scrolls of Knowledge. Battle-derived Scrolls require at least one eligible mage in the winning force; without one, the script applies a disabling state for that source. Buildings and other linked factors can provide further Scroll income.

The installed resource junctions distinguish repeatable actions (100 Scrolls), floor-rank actions (100 for High Loremaster and 150 for the other floors), cataclysms (200 for Teclis's and 150 for the others), Winds of Magic actions (100/150), unique-mage summons (300), and final mastery (600). Repeatable actions have an 8-turn cooldown and cataclysms a 10-turn cooldown; rank, mastery, and unique summon entries are one-use. Scripted effects include fully healing a target army and forcing a selected enemy force into a retreated state for two turns.

Each applicable floor can summon one special immortal mage from the supported lores. The script removes ordinary generated traits and assigns that mage's fixed trait pair, so this is a unique acquisition system rather than merely a roster permission.

In Immortal Empires, Teclis receives an early Saphery chain from turn 2. Its mission requires ownership of one complete province and rewards Scrolls before a dilemma. The associated implementation can relocate Teclis to the White Tower and temporarily permit the required movement through foreign territory. Creative Assembly describes the opening decision as staying in the Southlands, returning home, or pursuing both positions.

### Alarielle: Defender of Ulthuan

**Applies to:** Avelorn (`wh2_main_hef_avelorn`).

Defender of Ulthuan continuously classifies Ulthuan into three states: at least one inner region lost, only outer regions lost, or every tracked region controlled. An abandoned region and a region owned by a non-High-Elf faction both count as lost. Changing state resets the state's progression to tier 1; remaining in that state advances its bundle by one tier on each Avelorn turn, up to tier 10. Restoring every tracked region switches to the complete-control series and completes the script's `ulthuan_controlled` objective. The forest-spirit roster itself is already in the unit permissions catalog and is not duplicated here.

### Nagarythe: assassination network and Shadow Realms

**Applies to:** Nagarythe (`wh2_main_hef_nagarythe`).

Alith Anar's assassination system maintains three marked-character missions on a 20-turn cycle. Completing the current set immediately generates another. Each mission requires killing its target by any means. Treasury and Influence rewards are calculated from target rank, attached force, diplomatic state, target race, and distance; the installed caps are 25,000 treasury and 120 Influence. Malekith, Morathi, and Hellebron have dedicated special-target mission records.

The Hand of the Shadow Crown is created by Nagarythe's dedicated rite, whose installed cooldown is 15 turns and whose unlock is tied to issuing the Reaver Patrols commandment. The resulting `wh2_dlc10_hef_shadow_walker` agent is a unique assassination asset: its special action is guaranteed by the active presentation/rite chain and consumes the agent. This lifecycle is outside the unit and character-stat catalogs.

Nagarythe's faction bundle also unlocks the Shadow Realms army stance for its forces. The installed effect describes it as teleportation across normally impassable terrain that cannot be intercepted. This is a faction-wide movement exception, not an Alith Anar skill node.

### Imrik: dragon encounters and Caledor

**Applies to:** Knights of Caledor (`wh2_dlc15_hef_imrik`).

Imrik's first dragon-encounter marker is scheduled after 11 turns. Subsequent markers use a 15-turn cooldown and each marker remains available for 20 turns. Five special encounters correspond to Shackolot, Bruwor, Lamoureux, Ymwrath, and Gordinar. The encounter dilemma can resolve without a battle or issue the named dragon battle; winning that mission adds the corresponding unique dragon to the faction recruitment pool at a capacity of one. Progress events occur after the first, second, and fifth special victories. Once all special dragons have been processed, the system continues with generic encounters. The dragons' unit records are cataloged, but this marker, dilemma, mission, and capped-pool lifecycle is not.

An Immortal Empires confederation mission for Caledor becomes eligible from turn 2. It requires occupying, looting, razing, or sacking six settlements and then triggers a four-choice dilemma. Three choices permit confederating the Caledor target under different dilemma outcomes; the fourth declines. The mission payload also supplies 1,500 treasury and 25 Influence before the choice. Direct AI control of the target's confederation behavior is disabled while this chain is being prepared.

### Eltharion: Athel Tamarha, prisoners, and the Mists

**Applies to:** Yvresse (`wh2_main_hef_yvresse`).

Athel Tamarha begins with prison capacity one; the prison upgrade raises it to two. In autoresolve, Yvresse has a 50% capture roll when it is the attacker and the battle is actually fought. Manual capture is mediated by Warden's Cage, which is enabled only while prison capacity remains. A single night-battle capture candidate is selected where applicable.

Prisoner actions have separate persistent consequences:

- **Indoctrinate** grants 3 Warden's Supplies, releases the target, preserves sight over that character, and transfers 5% of the target faction's treasury to Yvresse each turn while the character remains alive.
- **Execute** grants 3 Supplies and 500 experience to Yvresse's faction leader.
- **Interrogate** applies the captured race's Mistwalker mirror bundle while that prisoner remains held. The improved interrogation tier also grants 250 experience to every army general when the action is taken.

The script makes a 5% escape roll for each eligible prisoner on the faction turn and records at most one escape candidate in that pass. This prevents the prison from being treated as permanent storage.

Athel Tamarha restoration upgrades cost 5 Warden's Supplies each. Most also add 5 Yvresse Defence, while Tor Yvresse's settlement chain contributes further defence. The operational thresholds are 25, 50, and 75: they advance the Mists and defensive ability tiers. The Mists apply within the script's defined region sets to non-abandoned regions owned by Yvresse or allied High Elves, and the relevant rite empowers them. At 75 or more Defence, human Yvresse receives the tier-3 regional Mist bundle; AI Yvresse remains on the tier-2 regional bundle. At rank 15, an eligible non-unique, non-faction-leader, non-loaned lord receives the Mistwalker path dilemma.

During the opening five turns, Eltharion's first qualifying settlement occupation/loot can trigger the current Immortal Empires branch dilemma. Its departure branch transfers Tor Yvresse to Eataine (or Cothique when needed), makes peace with the Skull Crag faction, and removes the secondary army at Yvresse. This campaign-opening state transition is distinct from the old Warhammer II narrative final-battle data and is the active branch documented here.

### Aislinn: Asur Domination, colonies, and Dragonships

**Applies to:** High Elf Sea Patrol (`wh3_dlc27_hef_aislinn`). This faction and its associated content require Tides of Torment.

Aislinn starts with one Dragonship, 400 Dragonship Supplies (`wh3_dlc27_hef_naval_supplies`), and 100 Dedication/Asur Domination progress (`wh3_dlc27_hef_aislinn_focus`). He has permanent trespass permission with High Elf factions. His bespoke occupation option gifts a conquered settlement to one of the six other playable legendary High Elf factions and creates an Aislinn-owned three-slot outpost there. The script calculates the diplomatic award from settlement size, the recipient's climate suitability, its ownership elsewhere in the province, and adjacent-province ownership. Aislinn cannot use ordinary region trading. Repeated gifting can also escalate a former owner's scripted reaction; at the third qualifying reaction the result is war rather than another diplomatic penalty.

Outposts generate Elven Trade, Dedication, income, and a small flow of supplies. They also let Aislinn control the host settlement's garrison in defensive battles, including after the outpost is upgraded. The Sea Patrol can issue commandments without owning every region in the province. A limited number of Elven Colonies convert Elven Trade into Dragonship Supplies and can provide recruitment. If Aislinn loses or leaves a region while its primary chain remains an eligible Elven Colony chain, the script refunds one colony-capacity point. Colony capacity is also awarded by several Asur Domination thresholds and initiatives. The panel unlocks after either 500 Dedication or two gifted settlements. Progress along its Outpost, Colony, and Dragonship tracks unlocks restricted buildings, capacity, and three Dragonship admirals; a further initiative unlocks the fourth. Together with Aislinn's vessel, this produces the five-Dragonship fleet required by the narrative.

Dragonships are mobile building platforms rather than ordinary settlement chains. Their structures consume Dragonship Supplies, grow the vessel, and project an influence radius within which friendly Dragonships share recruitment. Sea Patrol armies can use Mist Landing to move instantly from sea to land within range, but not from land to sea; it consumes the force's entire movement range, ignores impassable coastlines, and still permits direct attacks on armies or settlements and reinforcement of friendly battles. Aislinn's sea-lane journeys have zero travel time. His global recruitment is available only while the force is garrisoned, encamped, or using Dragonship Expansion. The introductory mission sequence establishes an outpost and colony, destroys a pirate faction and a spawned Black Ark, opens the special sea lanes, and offers a regional campaign branch. Reaching five vessels completes the gathering mission; three turns later the invasion dilemma triggers the final-battle mission. The four fleet-growth dilemmas select which High Elf legendary allies are represented and establish an outpost at the selected faction's capital when possible. Final victory adds another Dragonship captain to the pool.

Invocation of Mathlann unlocks after Aislinn establishes two colonies. Its installed ritual has a 10-turn cooldown. Its faction-to-force bundle gives perfect vigour to Merwyrms, makes Ship's Company and Sea Guard unbreakable, gives frozen contact to Oceanids and Sea Elementals, and adds 20% campaign speed at sea. Creative Assembly describes the invocation as lasting 5 turns and additionally states that destroyed High Elf units have a chance to be restored at full health during that period; the restoration is engine-mediated rather than exposed as a plain Lua payload.

### Caradryan recruitment

**Applies to:** all seven playable High Elf factions with Tides of Torment; Aislinn uses a separate first-stage trigger.

For Eataine, Avelorn, Nagarythe, Order of Loremasters, Yvresse, and Knights of Caledor, Caradryan's chain requires a faction leader of at least rank 10 and begins by constructing the Shrine of Asuryan chain's first building. Aislinn instead advances the first stage by constructing the specified Dragonship beasts building. The next mission requires ownership of five units from the Phoenix Guard mission set. Completing the final mission spawns the immortal Caradryan (`wh3_dlc27_hef_caradryan`) with the Phoenix Blade. If no human faction claims the chain, the script assigns it to the strongest eligible AI High Elf faction from turn 30. This acquisition and AI fallback are not represented by Caradryan's character or unit rows.

## Faction coverage

- **Knights of Caledor** (`wh2_dlc15_hef_imrik`): race-wide Influence/Patrons, Imrik's dragon encounters and Caledor confederation, and the standard Caradryan chain.
- **Avelorn** (`wh2_main_hef_avelorn`): race-wide Influence/Patrons, Defender of Ulthuan, and the standard Caradryan chain.
- **Eataine** (`wh2_main_hef_eataine`): race-wide Influence/Patrons, Champion of Ulthuan, and the standard Caradryan chain. Alastar is already represented by the Eataine subtype permission and character catalogs; no separate active acquisition chain was located.
- **Nagarythe** (`wh2_main_hef_nagarythe`): race-wide Influence/Patrons, assassination missions, Hand of the Shadow Crown, Shadow Realms stance, and the standard Caradryan chain.
- **Order of Loremasters** (`wh2_main_hef_order_of_loremasters`): race-wide Influence/Patrons, Secrets of the White Tower and its Saphery opening branch, and the standard Caradryan chain.
- **Yvresse** (`wh2_main_hef_yvresse`): race-wide Influence/Patrons, Athel Tamarha/prison/Mists and the opening Yvresse branch, and the standard Caradryan chain.
- **High Elf Sea Patrol** (`wh3_dlc27_hef_aislinn`): race-wide Influence/Patrons with Aislinn's separate court-confederation condition, Asur Domination/colonies/Dragonships, Mist Landing and sea-lane exceptions, Invocation of Mathlann, the five-vessel narrative, and the Aislinn-specific Caradryan trigger.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all files under `data/economy/factions/high_elves/`.
- `data/unit_stats/normalized/high_elves__wh3__8.1.1__ultra.csv` and the typed source exports for roster permissions, abilities, attributes, effects, and mounts.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all corresponding files under `data/skill_trees/characters/high_elves/`.
- Bretonnia, Chaos Dwarfs, and Tzeentch race documents were consulted only for the validated document contract and evidence-register standard.

### Installed patch 8.1.1 evidence

- Campaign scripts: `script/campaign/wh3_dlc27_intrigue_at_the_court.lua`, `wh3_dlc27_valiant_imperatives.lua`, `wh3_dlc27_secrets_of_the_white_tower.lua`, `wh2_dlc10_alarielle.lua`, `wh2_dlc10_alith_anar.lua`, `wh2_campaign_rites.lua`, `wh2_dlc15_dragon_encounters.lua`, `wh2_campaign_confederation_missions.lua`, `wh2_dlc15_eltharion_lair.lua`, `wh2_dlc15_eltharion_mist.lua`, `wh2_dlc15_eltharion_yvresse_defence.lua`, `wh3_main_eltharion_yvresse.lua`, `wh3_dlc27_aislinn.lua`, `wh3_dlc27_asur_domination.lua`, `wh3_dlc27_dragonship.lua`, `wh3_dlc27_aislinn_war.lua`, and `wh3_main_legendary_characters.lua`.
- Locked read-only RPFM decode from the merged vanilla `$CA` source: `db/patronage_slots_tables/data__`, verifying 33 current seat-rank records (11 seats x 3 ranks).
- Existing narrow table extracts: `rituals_tables`, `resource_cost_pooled_resource_junctions_tables`, and `effect_bundles_to_effects_junctions_tables`. Stable keys include `wh3_dlc27_hef_favour`, `wh3_dlc27_hef_scrolls_of_power`, `wh3_dlc27_hef_naval_supplies`, `wh3_dlc27_hef_aislinn_focus`, `wh3_dlc27_ritual_hef_mathlann`, `wh2_dlc10_lord_trait_hef_alith_anar`, `wh3_26_effect_enable_stance_tunnelling_alith_anar`, and the `wh3_dlc27_hef_aislinn_focus_*` threshold bundles. Installed localization supplies the Influence recruitment-trait contract, Mist Landing direction/movement/attack rules, zero-time Aislinn sea lanes, commandment and global-recruitment exceptions, and settlement-garrison control text.
- Reverse searches were run from all seven faction keys; all seven legendary-lord subtypes; the Shadow Crown, Caradryan, and Alastar subtypes; the pooled-resource keys; and the court, White Tower, Athel Tamarha, dragon-encounter, assassination, Asur Domination, and Dragonship mission/ritual families. Mandatory exception categories were checked: occupation/colonization, climate, Growth replacement, Supply Lines, caps/pools, movement/attrition, diplomacy/confederation, foreign slots, acquisition, AI fallback, and campaign/DLC branches. No additional High-Elf-specific Supply Lines, generic Growth replacement, or attrition exception survived the selection test.

### Web grounding and vocabulary discovery

- Creative Assembly, [Total War: WARHAMMER III Update 7.0 — High Elves](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/84).
- Creative Assembly, [Tides of Torment: Meet Aislinn](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/81-tides-of-torment-meet-aislinn).
- Creative Assembly, [Tides of Torment Q&A answers](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/88-total-war-warhammer-iii-tides-of-torment-q-a-answers).
- Creative Assembly, [Total War: WARHAMMER III Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes).
- Steam, [Tides of Torment](https://store.steampowered.com/app/3450960/Total_War_WARHAMMER_III____Tides_of_Torment/).
- Total War: Warhammer Wiki pages for High Elves, Patrons of the Realms, Favour of the Phoenix King, Avelorn, Secrets of the White Tower, Athel Tamarha, Imrik, and Knights of Caledor, plus a current KeenGamer Aislinn campaign guide, were used only as candidate and omission checklists. Precise rules above were retained only where supported by the installed files or a current official source.

### Evidence limitations

- The current stance-junction table was not available through the attempted narrow merged-pack path after the host interruption. Nagarythe's stance is nevertheless linked directly by the installed `wh2_dlc10_lord_trait_hef_alith_anar` bundle to `wh3_26_effect_enable_stance_tunnelling_alith_anar`, whose current English localization supplies the operational description.
- Manual Warden's Cage targeting and some settlement-option presentation are engine-mediated. The document reports the active Lua state, database costs/effects, and official description without inventing an unexposed targeting algorithm.
- Teclis's opening choice labels are grounded in Creative Assembly's current description; the active script verifies the Saphery mission, dilemma, relocation, and temporary access behavior but does not itself expose every localized choice sentence.
- Mathlann's destroyed-unit restoration chance and the transfer of Aislinn's existing Dragonships on court confederation are current Creative Assembly claims whose surrounding rite/confederation paths are installed-file verified, but whose engine transitions are not exposed as plain Lua payloads.
