# Dwarfs campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | Dwarfs |
| Race slug | `dwarfs` |
| Playable factions | 6 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The six faction economy CSVs already enumerate constructible surface buildings, their tiers, costs, prerequisites, and standardized income, Growth, control, trade, recruitment, and upkeep outputs. The normalized unit file and typed lookups already cover the 52-unit roster, faction permissions, statistics, abilities, weapons, projectiles, mounts, and related battle data. The 20 character files already contain the skill trees of all six legendary lords, Garagrim, Mikael Leadstrong, the Clan Angrund ancestors, Thorek's artifact Thane, and the generic Dwarf lords and heroes. Those rows are not repeated here. This document records the campaign systems, acquisition rules, persistent state, and cross-system relationships that the catalogs do not express.

## Mechanically relevant material not captured elsewhere

### Grudges, Ages of Reckoning, and Grudge Settlers

**Applicability:** Grudge marks are culture-wide; the Age tracker, Great Book panel, and confederation rituals operate for human players using any of the six playable faction keys. AI-controlled playable Dwarf factions receive a zero target and the level-0 reward bundle rather than resolving Ages.

Hostile actions accumulate Grudge values on enemy armies and settlements. The current script records trespassing, raiding, attacks, agent actions, occupation, sacking, razing, casualties inflicted on Dwarfs, treaty-breaking, and war declarations; peace and positive diplomacy reduce the relevant values. Defeating the marked army or taking the marked settlement transfers its remaining value into the Dwarf faction's settled-Grudge resources and the current Age tracker.

An Age of Reckoning currently lasts **15 turns**. This supersedes Creative Assembly's original Update 5.0 description of a 10-turn Age. A target is generated only when world Grudges exceed 5,000 and at least one faction owning a region adjacent to the Dwarf faction's territory carries Grudges. Before modifiers, it is 75% of the army and settlement Grudges carried by those adjacent-region owners plus 1,000, rounded down to a hundred-point step. The script then changes that target by the previous Age result and campaign difficulty:

| Input | Target modifier |
|---|---:|
| Delayed previous Age / level 0 | +20% |
| Previous level 1 | -20% |
| Previous level 2 | -10% |
| Previous level 3 | 0% |
| Previous level 4 | +10% |
| Previous level 5 | +20% |
| Easy / Normal / Hard / Very Hard / Legendary | -20% / 0% / +5% / +10% / +20% |

The five result bands are 0–24%, 25–49%, 50–74%, 75–99%, and 100% of the target. At resolution, the corresponding faction bundle lasts through the next Age:

| Level | Province effects | Grudge Settler effect | Pool additions |
|---:|---|---|---:|
| 1 | -15 Growth; -2 Control | +100% upkeep | 0 variants |
| 2 | — | +50% upkeep | 2 variants |
| 3 | +10 Growth; +1 Control | — | 4 variants |
| 4 | +25 Growth; +3 Control | -25% upkeep | 6 variants |
| 5 | +50 Growth; +5 Control | -50% upkeep | 8 variants plus a temporary army |

Each listed variant is added once to the faction mercenary pool. The level-5 force has disabled upkeep and no ordinary replenishment. When the following Age resolves, the script kills any surviving temporary Grudge Settler army before conditionally creating a new one. Choosing the delay option creates a target-free interval; the following calculated target receives the level-0 +20% modifier.

The Great Book button unlocks after a human Dwarf faction reaches 400 current settled Grudges. Legendary-lord confederation is implemented as six rituals in its lord tab. Each has a base cost of 7,500 settled Grudges, increased by 10% for every settlement currently owned by the target faction. The ritual corresponding to a human player's own faction is locked, preventing self-confederation through the panel.

### Legendary Grudges and the Underway Travel network

**Applicability:** culture-wide among human Dwarf players. Immortal Empires has all ten missions below; Realm of Chaos has Karaz Ankor, Chaos Dwarfs, Norse Dwarfs, Skavenblight/Hell Pit, and Silver Pinnacle.

Legendary Grudges are persistent scripted missions rather than ordinary Age targets. Every one grants 2,500 settled Grudges. Their additional current rewards are:

| Objective family | Additional reward |
|---|---|
| Rebuild the Karaz Ankor | Unlocks the main Underway Travel network: eight Immortal Empires endpoints or six Realm of Chaos endpoints. |
| Defeat the Chaos Dwarfs | Unlocks Karak Azorn and Uzkulak travel endpoints and grants the configured Ancestor Relics. |
| Secure the Norse Dwarfs | Reduces the cooldown after Underway Travel by 3 turns. |
| Destroy the Skavenblight/Hell Pit targets | Enables the Miners summon army ability for own forces in friendly territory. |
| Retake Karak Eight Peaks | Adds 2 to the Grudge Settler recruitment source. |
| Secure the Silver Pinnacle | Unlocks the reclaimed-hold landmark upgrade. |
| Retake Karak Zorn | Also grants 2,500 Oathgold. |
| Defeat the High Elves | Unlocks the Hall of Dragons at Vaul's Anvil; while it remains built, its script awards a random item from the configured High Elf ancillary list every five faction turns. |
| Defeat Athel Loren | Unlocks the Dwarf landmark at the Oak of Ages. |
| Defeat Malekith and the listed Dark Elf factions | Adds the immortal unique lord Mikael Leadstrong to every participating human Dwarf faction's recruitment pool. |

For scripted region and province objectives, completion is propagated to all human Dwarf players. Underway Travel rituals are likewise unlocked for every human Dwarf faction, while faction-bound landmarks are unlocked for the faction that completed the relevant mission. This teleport network is separate from the broadly shared Underway army stance; the generic stance and interception rules are therefore not reproduced here.

### Oathgold, the Forge, and technology gates

**Applicability:** race-wide — all six playable faction keys.

The Forge is initially disabled for a human Dwarf faction and permanently unlocks once its current Oathgold reaches 200. Forge rituals create ancillary items and runes; the current recipe costs fall into 30, 90, 200, 500, and 1,000 Oathgold bands. Scrapping items returns Oathgold in 20, 60, 130, 195, 300, or 600 bands according to the scrap ritual used. Individual item and rune effects are ordinary ancillary/effect records and are not duplicated here.

Oathgold is also a progression input for the two-tab Dwarf technology tree. Active gateway nodes reference resource-cost records charging 250, 500, or 1,000 Oathgold in addition to their research-point requirement. This makes Forge spending, technology access, and the Deeps compete for one pooled resource even though their output records live in separate database relations. Ordinary Oathgold-producing building rows remain in the economy catalog.

### The Deeps

**Applicability:** race-wide. Karaz-a-Karak (`wh_main_dwf_dwarfs`) and Clan Angrund (`wh_main_dwf_karak_izor`) start with two Deeps-capacity points; the other four playable factions start with one.

Constructing the surface entrance `wh3_main_DWARFS_underdeep_1` consumes one `dwf_underdeeps` capacity and creates a Dwarf foreign-slot set beneath that owned region. Major and minor settlements receive different layouts. Their underground entrance has three levels: the higher levels return capacity, and three technologies can add further capacity. Thorgrim has three cataloged skills whose separate scripted listener also adds one capacity when each is allocated.

Ordinary major Deeps begin with four blocked slots and minor Deeps with two. In mountain climate, the level-2 entrance clears some ordinary blockers and the level-3 entrance clears all five possible ordinary blocker positions. Karak Eight Peaks, Skavenblight, and Zharr-Naggrund instead use special layouts with two extra slots and location-specific building effects.

Random unique blockers carry operational risks not conveyed by the building catalog. Dismantling an Old Doomsphere has a 100% chance to destroy the region; an own Master Engineer in the region reduces that chance to 1%. A Warpstone Cache is automatically demolished only when the region has the Master Engineer demolition bonus. Removing the Gold blocker grants 500 Oathgold.

The surface entrance and an underground main entrance must both remain. At faction-turn start, if either side is missing, the foreign-slot system or its matching surface entrance is dismantled. When a Dwarf loses a region, an Underdeep with the Slayer-defence branch can cause the captured region to be abandoned; when a Dwarf gains a region, incompatible foreign slots and the previous surface entrance are removed.

The tall-income branch at level 2 or 3 applies a settlement-income percentage in its region equal to `5 × current turn - 5 × number of settlements owned`. Its value therefore rises with campaign time but falls as the faction grows wider.

Several Deeps branches depend on script-maintained conditions rather than static building rows. Owning no more than five regions activates `DwfLowRegionCount`: **Seal the Hold!** gains a further 500 initial supplies, 50% ammunition, and 10 leadership for the region's defending forces, while **To the Last Dawi!** gains Immune to Psychology and 20% replenishment for own forces in the region. A region adjacent to territory owned by a *different* Dwarf faction activates `RegionHasAdjacentDwarfFaction`. **Drinking Halls** then add 10% Dwarf allegiance-point gain, one each to Thane, Engineer, and Runesmith capacity, and 5 beer; **Underdeep Trade Routes** add 10% trade-goods output, 30% tariffs, 10% research rate, and 10 Dwarf diplomatic relations. Counting Rooms gain further surface-income percentages above 2,000 and 5,000 regional income, while **Repurposed Clan Goldsmiths** gain additional Oathgold above 1,000, 2,000, and 5,000. An own Master Engineer also removes the conditional -50% local income, -10 Growth, -4 Control, and +5 Skaven-corruption penalties from **Unstable Magma Caverns**, in addition to handling the blockers above.

The ordinary Grudge branch also feeds back into Ages and Settlers: while built, its three levels add 3%, 5%, or 10% to the target calculation, add 1, 2, or 3 to the Grudge Settler recruitment source, and reduce their recruitment cost by 5%, 10%, or 20% and upkeep by 2%, 3%, or 5%. At the three special Deeps locations, the alternative Halls of Remembering branch `wh3_main_underdeep_dwf_grudges_2_a` disables the Age of Reckoning while it is built. It costs 10,000 treasury, takes one turn, has 2,000 upkeep, reserves five Deeps-capacity points, and adds 10% Grudge Settler upkeep. Dismantling it restarts the Age timer. Upgrading the Karak Eight Peaks underground entrance to level 3 also triggers a dilemma whose first choice changes the faction's home region to Karak Eight Peaks.

### Malakai's Adventures and the Spirit of Grungni

**Applicability:** Masters of Innovation (`wh3_dlc25_dwf_malakai`); the human Adventure system is faction-exclusive. Spirit support state follows Malakai if his faction is confederated.

The Adventures panel unlocks on turn 5. It contains seven sets: Dragon Hunters, Dreadquake Destruction, Spider Swarm, Undead Empowered, Malevolent Tree Spirits, Exalted Bloodthirster, and Warpstone Bomb. Activating or switching an Adventure is handled by paired rituals, and only one set is active at a time. Each set contains six preparation missions with persistent completion state. Dragon Hunters and Dreadquake Destruction unlock their final battle after any three preparations; the other five require four.

Preparation rewards and final-battle rewards apply permanent faction bundles that upgrade the relevant war machine or the Spirit of Grungni. The individual combat modifiers belong to the effect and unit relations and are not restated. In Immortal Empires, each final battle increments both Malakai's short- and long-victory counters; in Realm of Chaos it increments the long-victory counter. AI-controlled Malakai does not execute the mission sets: the script instead grants predetermined permanent reward bundles and ancillaries at turns 10, 20, 30, 40, 50, 60, and 70.

The Spirit is Malakai's force-building tree and campaign support source. Constructing its radius tiers sets the scripted sphere around his force to 25 and then 50; that radius is reapplied at faction-turn start and saved across reloads. If Malakai is confederated, the script locates his character inside the new faction and transfers the tracked sphere to his force.

The Spirit's upper branches extend support to other own forces inside the sphere. At their highest relevant levels, the Beer Hall grants -20% recruitment cost within the sphere, the Cargo Hold grants +8% replenishment and -30% attrition suffered, and the Engines grant +10% campaign movement range and the Spirit of Grungni battle summon. The radius chain also grants one and then two recruitment points. Malakai's own horde-building effects remain distinct from these sphere-scoped benefits.

### Thorek's Artefact Vault

**Applicability:** human Ironbrow's Expedition (`wh2_dlc17_dwf_thorek_ironbrow`) only.

Sixteen one-time pooled-resource parts are tied to sixteen Immortal Empires regions and form eight matched pairs. A part is awarded when Thorek uses an eligible occupation decision in its region, when he forms a military alliance or vassalage with its owner, or when the region changes to Thorek or an allied vassal/client state. The script's occupation listener excludes decision key `596`. Once awarded, a part cannot be collected again.

Each of the eight crafting rituals consumes both parts in its pair and creates the configured artifact reward. Completing ritual 2 also spawns the unique artifact Thane (`wh2_dlc17_dwf_thane_ghost_artifact`). Craft counts are saved: five artifacts satisfy Thorek's short-victory scripted objective, while all eight satisfy his long-victory and co-op objectives.

### Clan Angrund and Karak Eight Peaks

**Applicability:** Clan Angrund (`wh_main_dwf_karak_izor`) in Immortal Empires.

Peace between Clan Angrund and Crooked Moon is disabled. A human Belegar campaign starts with King Lunn Ironhammer, Throni Ironbrow, Halkenhaf Stonebeard, and Dramar Hammerfist; the script advances each ancestor companion to rank 5 and assigns its starting skills. AI Clan Angrund retains Lunn and Throni but removes Halkenhaf and Dramar.

Before Clan Angrund has first captured Karak Eight Peaks, `wh_dlc06_belegar_karak_owned_false_first` applies +50% upkeep faction-wide. Capturing the region permanently removes that opening bundle and switches the faction to the owned-state marker. If the region is later lost, the script uses `wh_dlc06_belegar_karak_owned_false`, which applies -5 Control rather than restoring the original +50% upkeep penalty. Karak Eight Peaks' constructible surface-building differences remain in the economy catalog; its level-3 Deeps capital-move interaction is documented above.

### Grombrindal's Living Ancestor choice

**Applicability:** human Ancestral Throng (`wh3_main_dwf_the_ancestral_throng`) only.

The first Living Ancestor dilemma occurs on turn 3. It then recurs every 25 turns; allocating `wh_pro01_skill_dwf_lord_unique_grombrindal_dilemma` shortens the future interval to 15 turns. The choice persists until the next dilemma, and the script maintains both a faction-scoped bundle and a permanent-duration force copy attached to Grombrindal:

| Choice | Current effects |
|---|---|
| Grimnir | +10 melee attack and +10 melee defence for infantry; +10 reload-time reduction for missile infantry. |
| Grungni | -10% construction cost, -10% recruitment cost, -20% upkeep, and +20% research rate. |
| Valaya | -20 corruption, +20% replenishment, and +10 Control. |
| White Dwarf | +10 melee attack, +15 melee defence, and +30% weapon strength for Grombrindal. |

### Unique-character acquisition

**Applicability:** varies by character and campaign; the character catalog records their skills but not these entry conditions.

- **Garagrim Ironfist:** if Karak Kadrin is human, its priority branch triggers his mission once the faction leader reaches rank 2. If no human Karak Kadrin exists, eligible human Dwarf factions use the general rank-10 threshold; the character remains unique and the first completed chain claims him. The mission requires eight units from its current Slayer-family list and rewards 100 Oathgold plus Slayer's Axe before the script spawns Garagrim with Axes of Kadrin. With no eligible human claimant, the turn-30 AI fallback prefers Karak Kadrin.
- **Gotrek and Felix:** a human Masters of Innovation campaign spawns both characters at campaign start. In Immortal Empires, Karaz-a-Karak, Karak Kadrin, Clan Angrund, the Ancestral Throng, and Ironbrow's Expedition instead receive their faction-specific quest battle when the faction leader reaches rank 15; completing it spawns both characters.
- **Ulrika Magdova:** among Dwarfs, only Masters of Innovation is eligible. At faction-leader rank 11 it receives a two-stage chain: construct `wh3_dlc25_dwarf_spirit_of_grungni_crew_weapons_2`, then hold 15,000 treasury. The second completion triggers Ulrika's recruit-or-decline dilemma; the configured recruit choice is option 0.
- **Mikael Leadstrong, the Clan Angrund ancestors, and Thorek's artifact Thane:** their acquisition is part of the Legendary Grudge, Karak Eight Peaks, and Artefact Vault systems above rather than ordinary recruitment.

No separate uncataloged faction panel or resource loop was located for Karaz-a-Karak or Karak Kadrin beyond their documented Deeps-capacity and Garagrim interactions. Their remaining lord/faction distinctions are ordinary effects, buildings, units, technologies, or skill nodes rather than separate campaign-state rules.

## Faction coverage

- **Karaz-a-Karak** (`wh_main_dwf_dwarfs`): all race-wide systems; begins with two Deeps-capacity points; Thorgrim's three skill allocations can add capacity. Eligible for Garagrim when no human Karak Kadrin has priority and for the Immortal Empires Gotrek/Felix quest. No additional exclusive scripted panel was located.
- **Karak Kadrin** (`wh_main_dwf_karak_kadrin`): all race-wide systems; **Unique-character acquisition** gives human Karak Kadrin priority for Garagrim from leader rank 2. Eligible for the Immortal Empires Gotrek/Felix quest. Ungrim's remaining Slayer differences are cataloged effects and skills.
- **Clan Angrund** (`wh_main_dwf_karak_izor`): all race-wide systems; begins with two Deeps-capacity points; **Clan Angrund and Karak Eight Peaks**, the special Eight Peaks Deeps branch, and the Immortal Empires Gotrek/Felix quest.
- **The Ancestral Throng** (`wh3_main_dwf_the_ancestral_throng`): all race-wide systems; **Grombrindal's Living Ancestor choice** and the Immortal Empires Gotrek/Felix quest.
- **Ironbrow's Expedition** (`wh2_dlc17_dwf_thorek_ironbrow`): all race-wide systems; **Thorek's Artefact Vault** and the Immortal Empires Gotrek/Felix quest.
- **Masters of Innovation** (`wh3_dlc25_dwf_malakai`): all race-wide systems; **Malakai's Adventures and the Spirit of Grungni**; starts with Gotrek and Felix; exclusively eligible among Dwarfs for Ulrika's chain.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and every CSV under `data/economy/factions/dwarfs/`.
- `data/unit_stats/normalized/dwarfs__wh3__8.1.1__ultra.csv` and the typed roster, ability, weapon, projectile, component, attribute, contact-effect, and mount lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all files under `data/skill_trees/characters/dwarfs/`.
- Source exports used for linked DB and localization checks, especially `building_levels_tables`, `building_effects_junction_tables`, `effects_tables`, `effects__.loc.tsv`, `pooled_resources__.loc.tsv`, `rituals__.loc.tsv`, and `uied_component_texts__.loc.tsv`.

### Installed vanilla game files inspected through RPFM

- Scripts: `script/campaign/wh3_dlc25_grudge_cycles.lua`, `script/campaign/wh3_campaign_grudges.lua`, `script/campaign/wh3_campaign_grudges_legendary.lua`, `script/campaign/wh3_campaign_grudges_starting_missions.lua`, `script/campaign/wh3_campaign_forge.lua`, `script/campaign/wh3_campaign_underdeep.lua`, `script/campaign/wh3_dlc25_malakai_battles.lua`, `script/campaign/wh3_dlc25_spirit_of_grungni.lua`, `script/campaign/wh3_main_legendary_characters.lua`, `script/campaign/main_warhammer/wh2_dlc17_thorek.lua`, `script/campaign/main_warhammer/wh_dlc06_karak_eight_peaks.lua`, and `script/campaign/main_warhammer/wh_pro01_grombrindal.lua`.
- Tables: `db/effect_bundles_to_effects_junctions_tables/data__`, `db/rituals_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/technology_nodes_tables/data__`, `db/technology_node_sets_tables/data__`, `db/building_levels_tables/data__`, `db/building_effects_junction_tables/data__`, `db/campaign_features_tables/data__`, `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, and `db/cdir_events_mission_payloads_tables/data__`.
- Stable search keys: the six playable faction keys; legendary-lord and unique-character subtypes listed in Faction coverage and Unique-character acquisition; `wh3_dlc25_grudge_cycle_1` through `_5`; `wh3_dlc25_dwf_grudge_points`; `wh3_dlc25_dwf_grudge_points_enemy_armies`; `wh3_dlc25_dwf_grudge_points_enemy_settlements`; `wh3_dlc25_dwf_grudge_cycle_tracker`; `dwf_oathgold`; `dwf_underdeeps`; `wh3_main_underdeep_`; `DwfLowRegionCount`; `RegionHasAdjacentDwarfFaction`; `IsMasterEngineerPresent`; `wh3_dlc25_malakai_feature_`; `wh2_dlc17_dwf_ritual_thorek_artifact_`; `wh_dlc06_belegar_karak_owned_`; and `wh_pro01_bundle_god_choice_`.

### Web grounding

- Creative Assembly, *Thrones of Decay: Introducing Malakai Makaisson*: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/15-thrones-of-decay-introducing-malakai-makaisson
- Creative Assembly, *Patch 5.1.0*: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/23-total-war-warhammer-iii-patch-5-1-0
- Creative Assembly, *Patch 5.2 Dev Blog*: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/29
- Creative Assembly, *Patch 5.2.0*: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/30-total-war-warhammer-iii-patch-5-2-0
- Creative Assembly, *Hotfix 5.2.2*: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/6911-total-war-warhammer-iii-hotfix-5-2-2
- Creative Assembly, *Patch 8.1 release notes*: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes
- Creative Assembly, *Hotfix 8.1.1*: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14865-total-war-warhammer-iii-hotfix-8-1-1
- [Warhammer 3 Dwarfs Guide: Grudges, Oathgold and The Deeps Explained](https://guides-factory.com/guides/how-to-play-dwarfs-in-total-war-warhammer-3) — current secondary omission checklist used to locate and independently verify the Age, Forge, Deeps, Belegar, Grombrindal, Thorek, Malakai, and character-acquisition records.
- [The Deeps](https://totalwarwarhammer.fandom.com/wiki/The_Deeps) and [current player discussion of Deeps/Age interactions](https://www.reddit.com/r/totalwar/comments/1j7a61a) — independent secondary omission checks that exposed the adjacent-Dwarf and branch-interaction audit candidates; all precise rules reported above were then verified in the installed script and database.

### Evidence limitations

- Creative Assembly's Update 5.0 article describes 10-turn Ages and comparative Grudge confederation. The installed 8.1.1 Lua and database instead implement 15 turns and a 7,500 settled-Grudge base ritual cost with settlement-count scaling; the executable current records are reported here.
- The delay-choice listener indexes an undefined `faction_key` while passing a zero target override. That lookup does not feed the overridden value; the following active resolution returns level 0 and applies the documented +20% modifier. The claim is bounded to that executable control flow.
- The decoded paths are returned from RPFM's merged vanilla CA packs as source `PackFile`. All resumed queries used `scripts/rpfm-call-locked.ps1`, with `scripts/rpfm-call.mjs` receiving the required literal `$CA` placeholder; no pack was saved or edited.
- The reverse pass found no Dwarf-specific replacement for ordinary Supply Lines, climate suitability, Growth, colonization, generic occupation choices, or the basic Underway stance. Those broadly shared rules are excluded. Likewise, ordinary building, unit, technology-effect, ancillary-effect, and skill values remain in their respective data relations rather than being flattened into this campaign-system document.
