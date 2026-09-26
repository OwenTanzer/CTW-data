# Dark Elves campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Dark Elves | `race_slug=dark_elves` | **Playable factions:** 6

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe the six factions' constructible building levels, base costs and times, prerequisites, and standardized income, Growth, control, trade, recruitment, and upkeep outputs. The normalized unit file and typed lookups already describe roster permissions, unit statistics, abilities, attributes, weapons, and mounts. The 24 character files already contain the skill trees for the six legendary lords, generic characters, and Black Ark commanders, including Names of Power nodes and dilemma grants. Those facts are not repeated here. This document records the pooled-resource loops, mobile-Black-Ark rules, loyalty, scripted faction mechanics, and campaign-only substitutions needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Slaves and provincial Diktats

**Applicability:** all six playable Dark Elf faction keys, with a replacement Diktat set for `wh2_dlc11_def_the_blessed_dread`.

Slaves (`def_slaves`) are a faction-scoped pooled resource with a floor of 0. Installed help text identifies battles, capturing and upgrading ports, and recruiting Black Arks or Khainite Assassins as acquisition routes. The campaign script adds Slaves at faction-turn start for each army raiding a foreign-owned region:

`floor(region GDP / same-faction raiding-army count × unit count / 100 + unit count + force strength / 200000)`

The GDP component is therefore divided among the faction's raiding armies in that region. Slaves are spent by some building actions, instant construction, rites, and one province-wide Diktat at a time. The ordinary Diktats are:

| Diktat | Cost | Duration | Target-province result |
|---|---:|---:|---|
| Fights to the Death | 200 Slaves | 5 turns | +10 control |
| Slave-Drive | 300 Slaves | 5 turns | +50 Growth |
| Open Markets | 400 Slaves | 1 turn | 1,500 treasury on completion |

The active bundle blocks another Slave Diktat throughout the target province. Blessed Dread instead receives the three Diktats documented under Lokhir below.

### Black Arks, Dread Expansion, and rites

**Applicability:** race-wide except where an exact faction key is named.

Sacrifice to Mathlann makes a Black Ark commander available. A Black Ark must be raised from an owned, unsieged port. It is a sea-locked mobile horde: its population surplus pays for its own building chain, and construction or demolition completes only in Dread Expansion stance. In that stance, the Ark can replenish in foreign waters; same-faction armies inside its sphere can recruit directly from its local pool and replenish, with the stance bundle supplying +10% casualty replenishment. Armies fighting within its bombardment radius receive the Ark's battle support. Black Arks can attack and blockade port settlements directly and reinforce a land army besieging a port. Their `SEA_LOCKED_HORDE` force type has `upkeep_increase_exempt`, so an Ark does not add to the additional-army Supply Lines upkeep increase. Each province or Black Ark can raise only one lord per turn.

The ordinary rite set is not uniform. Atharti (20-turn cooldown), Hekarti (20), Khaine (40), and Mathlann (25) use a shared 5-turn global rite cooldown; the four have an 800-Slave cost relation. Faction-group records substitute Drakira for Har Ganeth, Anath Raema for Blessed Dread, Warmaster and Gift to the Witch King for Hag Graef, and Convocation of Hunters for the Thousand Maws. These substitutions matter to the faction mechanics below. Ordinary rite effect rows are omitted where they are fully presented by the campaign UI.

### Lord loyalty

**Applicability:** all six playable factions; non-faction-leader lords.

Dark Elf loyalty is measured from 0 to 10 and begins at a variable value visible when recruiting a lord. Victories, recruiting units into the lord's army, friendly diplomatic treaties, equipping items, completing missions, and keeping the faction leader at a higher rank can increase it; the opposite outcomes can reduce it. A low-loyalty lord can rebel when replaced as an army commander, taking the force with them, and a lord at 0 cannot be disbanded normally. Malekith has an additional hidden penalty to the chance calculation when a subordinate lord outranks him. The exact random weights are engine-side and are not asserted here.

### Cult of Pleasure: Slaanesh corruption economy

**Applicability:** `wh2_main_def_cult_of_pleasure`.

Cult of Pleasure uses a dedicated ten-band interpretation of Slaanesh corruption. At 1–10 through 41–50 corruption, income from Slaves is increased by 6%, 7%, 8%, 9%, and 10%. The upper bands add further province effects:

| Slaanesh corruption | Slave income | Slaves per turn | Control | Other corruption |
|---|---:|---:|---:|---:|
| 51–60 | +11% | +2 | +1 | -1 |
| 61–70 | +12% | +4 | +2 | -2 |
| 71–80 | +13% | +6 | +3 | -3 |
| 81–90 | +14% | +8 | +4 | -4 |
| 91–100 | +15% | +10 | +5 | -5 |

From 51 corruption upward, the same band also enables attrition against non-Chaos-worshipping armies in the province. These effects replace the harmful Slaanesh-corruption group assigned to ordinary Dark Elf factions.

### Har Ganeth: Death Night and Blood Voyages

**Applicability:** `wh2_main_def_har_ganeth`; the player-facing listeners are human-only.

Death Night uses a 0–25 meter that begins at 20 and loses 1 at each faction turn start. Holding Death Night refills it to 25, costs 500 Slaves initially, and permanently raises that cost by 50 per use to a maximum of 1,000. It can be activated once per turn. Its five effect bands are below 20%, 20–39%, 40–59%, 60–79%, and at least 80%:

- The two lowest bands apply -4/-2 control and severe/moderate Blood Voyage attrition; the lowest also starts Hellebron winded and supplies +2 Chaos corruption.
- The middle band gives +2 control and +5 army leadership, reduces Blood Voyage attrition, and gives Hellebron +5% physical resistance plus fatigue resistance.
- The fourth gives +4 control, +10 leadership, a +1 loyalty-change chance, removes Blood Voyage attrition, and gives Hellebron +10% physical resistance plus stronger fatigue resistance.
- The top gives +6 control, +10 leadership, a +2 loyalty-change chance, removes Blood Voyage attrition, gives it +5 foreign replenishment, and gives Hellebron +20% physical resistance and Perfect Vigour.

Turn-2 missions to capture the Ancient City of Quintex and Gaean Vale each permanently raise the meter floor by one 20% band. Their completion also applies permanent faction bundles; the Morathi branch adds a 20-turn untainted effect.

Activating Death Night creates a Blood Voyage only if none is active. The voyage is a forced vassal with restricted diplomacy and targets the nearest occupied settlement in the script's Ulthuan target list. Its first army through turn 30 uses the smaller template and later armies use the larger template. Its stored tribute begins at 300 plus a random 1–600; every victory adds 1,000 plus a random 1–1,000. When the force is destroyed, the accumulated treasury is transferred to Har Ganeth.

### Hag Graef: Possession, elixirs, Whispers, and the opening dilemma

**Applicability:** `wh2_main_def_hag_graef`; the detailed meter and Whispers listeners are human-only.

Possession (`def_malus_sanity`) runs from -10, Full Control, to +10, Full Possession. A new human campaign starts at +10. Each faction turn adds +1; if Malus is inside a settlement the same turn also applies -1, for no net change. Using either Tz'arkan battle ability at least once adds +2 once after that battle. An elixir applies -10.

Elixir base cost is 200/400/500/600 treasury on easy/normal/hard/very-hard-or-legendary campaign difficulty. Until the elixir objective is complete, the displayed cost is `base + 25 × ((owned regions - 1) + (turn - 1))`, rounded upward to the next 5. Completing `wh2_dlc14_mortal_empires_elixir_objective` changes the base to 0; the script then bypasses that scaling formula and sets later elixirs to 0 cost.

The meter bands are -10, -9 to -6, -5 to -1, 0, 1 to 5, 6 to 9, and 10. Negative possession disables Tz'arkan and improves faction Growth, possession-corruption reduction, and lord-loyalty change chance, but Full Control gives Malus -25 melee attack. Full Control alone unlocks Rite of the Warmaster. Positive possession enables Tz'arkan and progressively increases Malus's physical resistance and his army's melee attack/missile damage; it also spreads Slaanesh corruption. The 6–9 and 10 bands add +25 and +50 diplomatic relations with Daemons. At Full Possession the listed values reach +40% physical resistance, +10 melee attack, +20% missile damage, and +15 Slaanesh corruption.

Tz'arkan's Whispers issue one mission on turn 2, then use an increasing chance with no more than 12 turns between attempts and a 5-turn system cooldown after a mission is issued. Possible objectives are declaring war within 10 turns, sacking/razing one or two selected settlements within 20 or 25 turns, or killing a turn-scaled 2,000–6,000 entities within 20 turns. Completion adds +2 Possession and rolls a weighted reward: treasury (weight 2, 2,000–15,000), Slaves (weight 2, 500–2,000), or an unawarded unique ancillary (weight 5). Naggarond is excluded as a Whisper target.

If Malus still owns Hag Graef and captures or loot-occupies Black Rock by turn 5, the opening dilemma fires. Its transfer choice gives Hag Graef to AI Naggarond, or to Clar Karond when Naggarond is human, and removes the local secondary army. Gift to the Witch King instead opens a character-choice dilemma: Death Hag, Assassin, a random Dark/Fire/Shadow Sorceress, or Master. The spawned character's rank equals Naggarond's region count, capped at 50. AI Hag Graef does not run the human meter; Malus receives a fixed AI effect bundle.

### The Thousand Maws: Monster Pens

**Applicability:** `wh2_twa03_def_rakarth`; capture listeners are human-only.

Monster Pens are a mercenary-style recruitment pool populated by scripted incidents. A valid human attempt comes from raiding, occupying a settlement, or winning a non-garrison battle. The result depends on climate and corruption while raiding, the previous owner's culture when occupying, and naval/underway/ordinary battle context. Examples encoded in the current script include Hydras or Sabretusks in mountains, wolves or bears in temperate regions, Harpies on islands, Ice Bears in frozen regions, Wyverns in deserts, Stegadons or Cold Ones in jungles, and spiders in magical forests. Chaos corruption above 20 progressively replaces the climate pool with Chaos beasts, reaching complete replacement at 80.

Each of the three attempt categories starts with a +100 bad-luck modifier, guaranteeing its first valid result. A failed roll adds +10 up to +30; a success subtracts 75 down to -100, and negative modifiers reset to 0 at the next faction turn. Rakarth's rank and Harpyclaw Bolts skill add to the chance, and occupying a province capital adds +10. A settlement cannot produce two capture incidents in one turn. Only choosing Slaughter after battle receives a second roll when the first fails. Some results remain DLC-gated by their unit entitlement.

Convocation of Hunters has a 15-turn cooldown and triggers a paid Monster-Pen replenishment dilemma. Declaring war on a faction in `non_colonial_empire_factions` triggers the one-time Raid the Zoo mission. Completing Rakarth's Whip of Agony mission adds a rank-18 Black Ark commander to the recruitment pool. AI Thousand Maws bypasses the capture listeners and instead has an automatically replenished pool with a 75% aggregate roll per turn and per-unit maxima defined in the script.

### The Blessed Dread: ports, replacement Diktats, teleport, and sea lanes

**Applicability:** `wh2_dlc11_def_the_blessed_dread`.

Every owned province capital with a port contributes to Lokhir's Black Ark allowance. For a human faction, the script adds rank-18 Black Ark commanders so existing Arks plus available commanders equal that port count; AI allowance is `floor(major ports / 3)`.

Blessed Dread's province actions replace the ordinary Diktats:

| Diktat | Cost | Duration | Result in the target sea region/province |
|---|---:|---:|---|
| Shipbuilding | 300 Slaves | 5 turns | +5 Black Ark Growth to Arks at sea there; +20 provincial Growth |
| Wear Out the Oars | 200 Slaves | 3 turns | +40% campaign movement at sea to forces there |
| Naval Markets | 400 Slaves | 1 turn | 1,000 treasury plus a scripted 500 per counted Black Ark |

For Naval Markets, `wh2_dlc11_lokhir.lua` begins at faction-force-list index 1 and adds 500 for each encountered `SEA_LOCKED_HORDE`; the table's wording therefore does not assume that an Ark at skipped index 0 would be counted.

Travel to a Black Ark requires Lokhir to have 100% movement, costs 1,000 treasury, spends all current movement, and places him beside the selected owned Black Ark at the start of the next turn. Its cooldown is 10 turns.

Completing `wh3_dlc27_def_blessed_dread_control_eastern_isles` opens the Lokhir/Aislinn version of the Eastern Colonies sea-lane nodes. Blessed Dread's replacement Black Ark building rows also carry sea-region context requirements. The table below gives the intact/damaged values; a ruined building supplies 0. Effects scoped to a sphere apply to the relevant same-faction forces or characters inside that Ark's sphere.

| Required sea-region context | Black Ark building | Additional effect, intact / damaged |
|---|---|---|
| `SeaRegionNaggarondSeas` | Palace of Dread Knights (`wh3_main_horde_def_lokhir_aristocracy_2`) | +3 / +3 Dark Elf diplomatic relations; +5% / +5% ward save in the sphere |
| `SeaRegionNaggarondSeas` | Estates of the Masters (`wh3_main_horde_def_lokhir_residence_3`) | +5% / +1% chance to gain a magic item per turn |
| `SeaRegionJungleCoasts` | Dragon Tower (`wh3_main_horde_def_lokhir_beasts_3`) | +10% / +5% weapon strength and -20% / -10% recruitment cost for Dark Elf monsters in the sphere |
| `SeaRegionJungleCoasts` | Warrior Hall (`wh3_main_horde_def_lokhir_military_3`) | +50% / +5% razing, looting, and sacking income in the sphere |
| `SeaRegionNorthernSeas` | Arena (`wh3_main_horde_def_lokhir_entertainment_3`) | +10% / +5% casualties captured post-battle in the sphere |
| `SeaRegionNorthernSeas` | Messengers' Lodgehouse (`wh3_main_horde_def_lokhir_riders_2`) | +30 / +15 Slaves per turn |
| `SeaRegionRiver` | House of Exiles (`wh3_main_horde_def_lokhir_exiles_2`) | +20% / +10% campaign movement range in the sphere |
| `SeaRegionRiver` | Warrior Hall (`wh3_main_horde_def_lokhir_military_3`) | +10% / +5% armour-piercing melee damage for Black Ark Corsairs in the sphere |
| `SeaRegionOpenSea` | Prison Wing (`wh3_main_horde_def_lokhir_slavery_3`) | +30% / +15% campaign movement range for the Ark |
| `SeaRegionUlthuanEasternIsles` | Arena (`wh3_main_horde_def_lokhir_entertainment_3`) | +6 / +3 leadership for infantry in the sphere |
| `SeaRegionUlthuanEasternIsles` | Spire of Sorcery (`wh3_main_horde_def_lokhir_sorcery_2`) | +10% / +5% spell cooldown rate in the sphere |
| `SeaRegionUlthuanEasternIsles` | Shrine of Khaine (`wh3_main_horde_def_lokhir_worship_2`) | +10% / +5% melee attack and weapon strength in the sphere |

## Faction coverage

- **Naggarond** — `wh2_main_def_naggarond`: Slaves and ordinary Diktats; Black Arks and ordinary rites; Dark Elf loyalty, including Malekith's subordinate-rank exception. No additional current faction-specific campaign panel or unique-character acquisition chain was located.
- **Cult of Pleasure** — `wh2_main_def_cult_of_pleasure`: shared Slaves, Black Arks, rites, and loyalty; Cult of Pleasure Slaanesh-corruption economy.
- **Har Ganeth** — `wh2_main_def_har_ganeth`: shared systems with the Drakira rite substitution; Death Night and Blood Voyages.
- **The Blessed Dread** — `wh2_dlc11_def_the_blessed_dread`: shared Black Ark and loyalty rules; port-based Ark allowance, replacement Diktats, Ark travel, Eastern Colonies sea lanes, and location-sensitive Ark support.
- **Hag Graef** — `wh2_main_def_hag_graef`: shared systems with Warmaster/Witch King rite substitutions; Possession, elixirs, Whispers, and the opening dilemma.
- **The Thousand Maws** — `wh2_twa03_def_rakarth`: shared systems with Convocation of Hunters; Monster Pens, Zoo Raid, and the Whip-of-Agony Black Ark reward.

## Evidence register

### Project material consulted

- `README.md`
- `data/economy/README.md`
- `data/economy/faction_index__wh3__8.1.1.csv`
- All six CSVs under `data/economy/factions/dark_elves/`
- `data/unit_stats/README.md`
- `data/unit_stats/normalized/dark_elves__wh3__8.1.1__ultra.csv`
- Relevant rows in `data/unit_stats/lookups/unit_rosters__wh3__8.1.1__ultra.csv`, `unit_abilities__wh3__8.1.1__ultra.csv`, `unit_attributes__wh3__8.1.1__ultra.csv`, `unit_weapon_links__wh3__8.1.1__ultra.csv`, and `unit_mount_variants__wh3__8.1.1__ultra.csv`
- `data/unit_stats/source_exports/text/db/{campaign_localised_strings,effect_bundles,effects,pooled_resources,rituals,ui_text_replacements}__.loc.tsv`
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 24 files under `data/skill_trees/characters/dark_elves/`

### Installed vanilla game files and stable records

Read through the read-only RPFM interface with merged vanilla `GameFiles` (`pack_key=$CA` where required):

- `script/campaign/wh3_campaign_def_slaves.lua` — culture gate, `FactionTurnStart`, foreign-region raiding test, same-faction raider divisor, and Slaves formula.
- `script/campaign/wh2_campaign_names_of_power.lua` — AI-only random trait assignment; compared with player-facing grants already present in the skill-tree catalog.
- `script/campaign/wh2_dlc10_hellebron.lua` — meter state, increasing cost, floor missions, Blood Voyage creation/targeting/army templates, tribute, vassal state, save/load.
- `script/campaign/wh2_dlc14_malus_sanity.lua`, `wh2_dlc14_tzarkans_whispers.lua`, and `wh2_dlc14_malus_malekiths_favour.lua` — Possession transitions, elixir formula, rite locks, mission generation/rewards, Hag Graef transfer, and Witch King character choices.
- `script/campaign/wh2_twa03_rakarth.lua` — capture pools and chances, bad-luck modifiers, corruption substitution, DLC gates, missions, and AI pool fallback.
- `script/campaign/wh2_dlc11_lokhir.lua` — port count, Black Ark commander pool, Naval Markets scaling, Ark travel movement handling, and Eastern Colonies mission listener.
- `db/pooled_resources_tables/data__` — `def_slaves`, `def_malus_sanity`.
- `db/rituals_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/resource_costs_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, and `db/ritual_payload_resource_transactions_tables/data__` — Diktats, rite applicability/cooldowns/costs, and `wh3_dlc27_black_ark_teleport_cost`.
- `db/effect_bundles_to_effects_junctions_tables/data__` — Slave Diktats, `wh2_main_bundle_stance_black_ark_patrol`, ten Cult of Pleasure corruption bands, five Death Night bundles, seven Malus Possession bands, and Lokhir Diktats.
- `db/campaign_groups_tables/data__`, `db/campaign_group_members_tables/data__`, and `db/campaign_group_member_criteria_factions_tables/data__` — Dark Elf ritual groups and Cult of Pleasure's dedicated Slaanesh-corruption groups.
- `db/military_force_type_feature_junctions_tables/data__` — `SEA_LOCKED_HORDE` and `upkeep_increase_exempt`.
- `db/building_effects_junction_tables/data__` — Blessed Dread replacement Black Ark levels under the `wh3_main_horde_def_lokhir_*` prefixes, including their `SeaRegionNaggarondSeas`, `SeaRegionJungleCoasts`, `SeaRegionNorthernSeas`, `SeaRegionRiver`, `SeaRegionOpenSea`, and `SeaRegionUlthuanEasternIsles` context requirements and intact/damaged/ruined values.
- Reverse searches from all six playable faction keys; legendary-lord subtype keys `wh2_main_def_malekith`, `wh2_main_def_morathi`, `wh2_dlc10_def_crone_hellebron`, `wh2_dlc11_def_lokhir`, `wh2_dlc14_def_malus_darkblade`, and `wh2_twa03_def_rakarth`; and the distinctive resource, ritual, mission, dilemma, Black Ark, loyalty, and Shadowblade prefixes.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Creative Assembly, [Hotfix 8.1.1](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14865-total-war-warhammer-iii-hotfix-8-1-1).
- Creative Assembly, [Update 7.0 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/84) — current Lokhir Black Ark travel, Eastern Colonies sea lanes, location effects, and revised victory targets.
- Steam, [The Shadow & The Blade](https://store.steampowered.com/app/1158180/) — official high-level Malus/Tz'arkan/elixir description.
- Total War Academy, [Dark Elves campaign tactics](https://academy.totalwar.com/dark-elves-campaign-tactics/) — discovery vocabulary only.
- Total War: WARHAMMER Wiki discovery pages: [Dark Elves](https://totalwarwarhammer.fandom.com/wiki/Dark_Elves), [Black Arks](https://totalwarwarhammer.fandom.com/wiki/Black_Arks), [Names of Power](https://totalwarwarhammer.fandom.com/wiki/Names_of_Power), [Monster Pens](https://totalwarwarhammer.fandom.com/wiki/Monster_Pens), [The Blessed Dread](https://totalwarwarhammer.fandom.com/wiki/The_Blessed_Dread), [Cult of Pleasure](https://totalwarwarhammer.fandom.com/wiki/Cult_of_Pleasure), [The Thousand Maws](https://totalwarwarhammer.fandom.com/wiki/The_Thousand_Maws), and [Malus Darkblade](https://totalwarwarhammer.fandom.com/wiki/Malus_Darkblade).
- Steam Community, [Rakarth campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3206586217) — current omission checklist only.

### Evidence limitations

- RPFM 5.0.6 repeatedly reset and refused connections during both research passes, then recovered after confirmed outages; all resumed operations used the serialized locked wrapper and narrow sequential decodes. No game pack was edited or saved.
- The exact random weights behind ordinary Dark Elf loyalty changes are not exposed by the decoded script/table relations; only the installed help's documented triggers and outcomes are reported.
- Generic Sword of Khaine rules, ordinary quest/victory missions, climate suitability, and cataloged building, unit, and skill differences are outside this document's gap scope.
