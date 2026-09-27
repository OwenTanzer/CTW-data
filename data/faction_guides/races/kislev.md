# Kislev campaign systems

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | Kislev |
| Race slug | `kislev` |
| Playable factions | 4 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The four Kislev economy CSVs already describe buildings, construction gates and costs, ordinary province outputs, recruitment access, and standardized modifiers. The normalized unit catalog and typed roster/ability lookups cover unit permissions, statistics, and battle abilities; the 17 Kislev character files cover skill nodes and their numeric effects. Those facts are not repeated here. The material below concerns campaign resources, scripted progression, character acquisition and governance, and faction/campaign branches that those catalogs do not encode.

## Mechanically relevant material not captured elsewhere

### Court & Orthodoxy

**Applicability:** all four playable factions.

The post-6.1 system tracks Ice Court Support and Orthodoxy Support independently. Every 100 Support raises that side's Tier and grants its corresponding Boon currency; Boons purchase permanent rewards in battle, character, global, magic, and settlement categories. New campaigns begin asymmetrically: the Great Orthodoxy has 40 Orthodoxy/20 Ice Court Support, the Ice Court 20/40, and both Daughters of the Forest and Ursun Revivalists 30/30. A human Kislev faction also receives the alignment dilemma on turn 5.

Support comes from aligned buildings and characters, Ataman dedication where Atamans are enabled, and scripted battle results. Against enemies aligned with the chosen side, a win normally adds 10 and a loss 5; battles against Chaos can advance both tracks for a faction that is not itself the corresponding aligned faction. After `wh3_main_ksl_boon_cost` becomes active, the aligned-enemy battle award gains another 5 and all panel rewards cost one additional Boon. `Zealous Conscription` initializes an instant-recruit pool containing two each of Kislevite Warriors, Kossars (bows), and Kossars (spears); each has a cap of two and replenishes at 0.2 per turn.

The `Frontier Forces` panel reward is a narrower settlement interaction rather than a race-wide occupation replacement: after colonizing a ruin it gives the new force +1 unit rank and applies a one-turn accelerator that the installed text describes as greatly reducing construction cost and duration. The data does not expose a safe numeric reduction, so none is inferred.

The tracks must also remain within their separately permitted Tier differences. Neglect worsens each faction turn: its common bundle begins at -2 provincial Devotion, -3 army leadership, and -10% research, then escalates. Ice Court neglect additionally raises Ice Court training costs and harms relations with the Ice Court; Orthodoxy neglect raises infrastructure construction costs and harms relations with the Great Orthodoxy. Lord skills and panel rewards can modify the permitted imbalance, so the operative tolerance is the value shown for each side rather than a universal fixed number. The former supporter race, forced confederation endpoint, and prohibition on intra-Kislev war are obsolete; normal diplomacy now applies, while declaring war on any Kislev-culture faction removes 10 Devotion from every owned province.

### Provincial Devotion and Invocations of the Motherland

**Applicability:** all four playable factions.

Devotion replaces the normal Control presentation and resource in Kislev provinces. It is local to the province from which an Invocation is paid. The executable script makes an Invocation available at 25 Devotion but deducts 50 when it completes; this differs from the 6.1 release-note wording that said 50 was required. Army and province versions last five turns and carry matching local cooldown markers.

| Invocation | Army target | Province target |
|---|---|---|
| Dazh | Flaming and Scorching Attacks; +50% character experience | Construction rush |
| Salyak | +10% replenishment; replenishment in foreign territory; +100% healing cap | +50 Growth; +3 recruitment capacity; immediate garrison healing |
| Tor | Magical Attacks; +8 melee attack; Wrath of the Bear army ability | During sieges: +800 barrier, -50% vigour loss, +25% weapon strength, and Thorsen's Thunderstorm |
| Ursun | +20% movement; +15% weapon strength for War Bear and Elemental Bear units; Bitterness of Winter army ability | Applies the scripted storm to enemy armies in the province |

The current official description also says that Devotion of 75 or more nullifies climate penalties, negative Devotion grants deployed Atamans additional experience, and -100 causes a Chaos incursion. Those three threshold outcomes were not independently located in the decoded Lua/database relations and are therefore official-source-only here; Daughters of the Forest has no Atamans to receive the negative-Devotion XP interaction.

### Ice Court character training

**Applicability:** all four playable factions.

Frost Maidens and Ice Witches are created through training slots rather than ordinary direct recruitment. Slots are unlocked by technologies and other explicit effects. Starting a candidate has a treasury cost; successive panel dilemmas determine lore and permanent training traits, after which the finished character enters the relevant recruitment pool and still obeys its capacity rules. The official 6.1 redesign describes three successive-turn trait dilemmas with four deterministic choices at each step and a halved overall training time. The installed player-side sequence is engine/table driven, so no numeric base initiation price is claimed from the Lua.

`wh3_campaign_kislev_ice_court.lua` separately defines AI fallback, not the human lifecycle. After the relevant technologies, AI Kislev can generate a rank-22 Ice Witch or Frost Maiden with three random training traits. Each qualifying technology makes an independent 50% roll on an off-cooldown turn, giving a 50% generation chance with one qualifying technology and 75% with both. Each agent type has an eight-turn cooldown; the pre-increment `> 15` test permits sixteen uses, and Frost Maidens must also have available hero capacity. At campaign creation, all existing Kislev Ice Witches and Frost Maidens also receive three random training traits; that initialization is not human-only.

### Ataman provincial governance

**Applicability:** the Ice Court, Great Orthodoxy, and Ursun Revivalists. `wh3_dlc24_ksl_daughters_of_the_forest` explicitly disables `province_governorship`.

One Ataman slot is granted per two owned provinces. When a slot opens, four candidates are offered and one can be assigned to a province; Atamans cannot be recruited as conventional field lords. An assigned Ataman applies his candidate and learned governor effects, gains experience while deployed, and gains additional experience from local trade resources, walls, low Devotion, and Garrison Sally Attacks. He cannot be moved while the province capital is under siege and cannot be replaced while the province is contested.

The Garrison Sally Attack lets an Ataman-governed province use its garrison to attack a nearby force without converting the Ataman into a normal army commander; the garrison returns after the battle. The numerical effects of Ataman skills remain in the character catalog.

### Golden Knight and Ulrika acquisition

**Applicability:** Golden Knight—every Kislev faction; Ulrika—every Kislev faction and eligible Empire-culture factions. Entitlement evidence differs between the two as described below.

Naryska Leysa, the Golden Knight (agent subtype `wh3_dlc24_ksl_the_golden_knight`), becomes eligible for a human Kislev faction when its leader reaches rank 11 and the account owns either Shadows of Change or the Kislev SKU. The standard Ice Court/Great Orthodoxy/Ursun Revivalists chain first requires 1,500 entities killed and then construction of `wh3_main_ksl_stables_1`. Daughters of the Forest uses the same kill stage but substitutes `wh3_main_foreign_slot_discovery_ksl_2` for the building stage. The intermediate payloads are chain text only; completion launches `wh3_dlc24_ksl_golden_knight_choice`. AI Kislev uses a turn-30 fallback.

Ulrika Magdova (`wh3_dlc23_neu_ulrika`) is allowed for Kislev- and Empire-culture factions. The executable threshold is leader rank 11, despite an adjacent stale comment saying rank 10. Her Kislev chain requires `wh3_main_foreign_slot_discovery_ksl_2` and then possession of at least 15,000 treasury; each completed stage grants 500 treasury before the final dilemma. The second dilemma choice is labelled as refusing/executing her, but the single-player dispatcher instead assigns Ulrika to the strongest eligible AI faction; in multiplayer it leaves the other human acquisition chains active. AI acquisition uses rank 15. The Lua block contains no DLC entitlement test, so any ownership gate enforced outside that dispatcher remains an engine-side evidence limitation.

### Daughters of the Forest: Spirit Essence, the Witch's Hut, and Hex progression

**Applicability:** `wh3_dlc24_ksl_daughters_of_the_forest` only.

Provinces with total corruption below 20 receive `wh3_dlc24_bundle_ostankya_low_corruption`, which generates Spirit Essence (`wh3_dlc24_ksl_spirit_essence`). Spirit Essence spent either on Hexes or Witch's Hut brews is added to a permanent cumulative-spend tracker.

The Witch's Hut contains 22 recipes and knows them all at campaign start, but only the Ursun Totem ingredient begins unlocked. The other 17 ingredients are race-mapped and unlock after defeating the corresponding race in battle or forming an alliance or vassal relationship with it; normal land battles fought on turn one are explicitly ignored for this unlock. Recipes require a primary ingredient and can gain secondary ingredient slots from two technologies. Cooking creates one stored use: standard brews cost 5 Spirit Essence and advanced brews 10. AI Ostankya cooks every four turns while holding fewer than ten stored recipes.

Purification Chant is unlocked through the initial-enemy mission rather than the spend track. It removes 100 points of each listed corruption resource—Chaos Undivided, Skaven, Vampiric, Khorne, Nurgle, Slaanesh, and Tzeentch—from the target province; its empowered form also removes the enumerated Skaven and Nurgle plague bundles. The other four Hexes issue campaign-specific unlock missions at cumulative Spirit Essence spending of 100 (Coven's Cursemark), 300 (Jinxed Land), 700 (Bewitching Lure), and 1,500 (Recreant Spirit). Completing each mission unlocks the Hex and its upgrade technology.

Those four reusable Hexes last five turns and change when empowered. Coven's Cursemark targets an enemy army: normally it raises spell costs by 40%, disables march and tunnelling stances, and cuts movement by 50%; empowered it raises spell costs by 70% and disables all movement. Jinxed Land teleports a chosen own army to a prescribed magical forest, while its empowered form can target any army. Recreant Spirit creates one disciple army in the target enemy region, or two when empowered. Bewitching Lure leeches 50% income from the target region, or from the entire target province when empowered.

Three unlocked Hexes satisfy the scripted short-victory counter. Five unlock Malediction of Ruin; casting it selects a target culture and issues the campaign-specific final set-piece battle. Winning stores `mother_ostankya_win`, completes the long-victory objective, and permanently applies the Malediction bundle to every living faction of the chosen culture.

Ostankya begins with an exact set of ordinary Kislev buildings script-locked: Barracks tiers 1-3, Cavalry tiers 1-3, Stables tiers 1-2, Ice Guard tiers 1-2, Artillery tiers 1-2, and only the tier-3 Gold/Gold-a and Court/Court-a entries. Owning Kislev, Praag, or Erengrad—or becoming allied with or vassalizing the owner of one of those cities—removes the lock. Captured restricted buildings are dismantled while it remains. In Immortal Empires, a turn-2 dilemma either keeps the Naggaroth start and unlocks two random non-start ingredients, or relocates the faction to Plesk, changes the opening wars and regions, moves the leader and nearby agent, resolves otherwise-impossible opening missions, and removes the building locks. The AI teleport chance is explicitly zero.

### Boris: commandment and Realm of Chaos rescue state

`By Order of the Tzar` (`wh3_dlc24_edict_ksl_anti_chaos`) is available in every eligible province to `wh3_main_ksl_ursun_revivalists`. It is also a Mountains End province-specific commandment for the Ice Court and Great Orthodoxy; Daughters of the Forest has no matching row. It gives -10 corruption, +15% ward save against Chaos Daemons to own armies in the province, and +10 Devotion, at the cost of -33% income.

**Realm of Chaos campaign only:** any human Kislev-culture faction other than Ursun Revivalists can trigger the installed Boris rescue chain; Something Rotten in Kislev is excluded. The same faction must own Kislev, Erengrad, and Praag for ten consecutive faction-turn starts. The Ice Court receives `wh3_main_qb_ksl_katarin_boris_unlock`; every other eligible faction uses `wh3_main_qb_ksl_kostaltyn_boris_unlock`. After victory, the dilemma can establish an allied Ursun Revivalists force in one of the three owned cities that is not under siege, transferring that region to Boris, or add rank-18 Boris directly to the player's lord pool. This in-campaign chain remains operative even though patch 6.1 removed the separate frontend requirement for unlocking Boris as a playable campaign lord.

## Faction coverage

- **Daughters of the Forest** — `wh3_dlc24_ksl_daughters_of_the_forest`: Court & Orthodoxy, Devotion/Invocations, Ice Court training, unique-hero chains, all Ostankya systems, and the Realm of Chaos Boris rescue chain; Atamans and `By Order of the Tzar` are explicitly unavailable.
- **The Great Orthodoxy** — `wh3_main_ksl_the_great_orthodoxy`: all race-wide systems, Atamans, the standard Golden Knight chain, Mountains End access to `By Order of the Tzar`, and the Realm of Chaos Boris rescue chain.
- **The Ice Court** — `wh3_main_ksl_the_ice_court`: all race-wide systems, Atamans, the standard Golden Knight chain, Mountains End access to `By Order of the Tzar`, and the Katarin variant of the Realm of Chaos Boris rescue chain.
- **Ursun Revivalists** — `wh3_main_ksl_ursun_revivalists`: all race-wide systems, Atamans, the standard Golden Knight chain, and global access to `By Order of the Tzar`; as Boris's own faction it does not run the rescue chain.

## Evidence register

### Project material consulted

- `README.md`; economy, unit-stat, and skill-tree dataset READMEs.
- `data/economy/faction_index__wh3__8.1.1.csv` and all four files under `data/economy/factions/kislev/`.
- `data/unit_stats/normalized/kislev__wh3__8.1.1__ultra.csv` and Kislev rows in the typed roster and ability lookups.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 17 files under `data/skill_trees/characters/kislev/`.
- `data/unit_stats/source_exports/text/db/`: `ui_text_replacements__.loc.tsv`, `uied_component_texts__.loc.tsv`, `pooled_resources__.loc.tsv`, `cooking_ingredients__.loc.tsv`, `cooking_recipes__.loc.tsv`, `missions__.loc.tsv`, `dilemmas__.loc.tsv`, `incidents__.loc.tsv`, `effects__.loc.tsv`, and `provincial_initiative_records__.loc.tsv`.

### Installed vanilla patch 8.1.1 evidence through locked read-only RPFM

- Campaign Lua: `script/campaign/wh3_campaign_kislev_devotion.lua`, `script/campaign/wh3_campaign_kislev_motherland.lua`, `script/campaign/wh3_campaign_kislev_ice_court.lua`, `script/campaign/wh3_dlc24_mother_ostankya.lua`, `script/campaign/wh3_main_legendary_characters.lua`, and `script/campaign/wh3_main_chaos/wh3_boris.lua`.
- Ritual/effect relations: `db/ritual_payload_effect_bundles_tables/data__`, `db/effect_bundles_to_effects_junctions_tables/data__`; stable invocation prefix `wh3_main_ritual_ksl_winter_`.
- Court & Orthodoxy stable resources/records: `wh3_main_ksl_support_tracker_ice_court`, `wh3_main_ksl_support_tracker_orthodoxy`, `wh3_main_ksl_support_boon_ice_court`, `wh3_main_ksl_support_boon_orthodoxy`, `wh3_main_ksl_boon_cost`, and `wh3_main_ksl_support_orthodoxy_character_2_2`.
- Governance/feature relations: `db/province_governor_sets_tables/data__`, `db/province_governors_tables/data__`, `db/campaign_features_tables/data__`; keys `wh3_main_feature_kislev`, `province_governorship`, and `wh3_main_ksl_ataman`.
- Hero missions: `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, and `db/cdir_events_mission_payloads_tables/data__`; agent subtype `wh3_dlc24_ksl_the_golden_knight`, script/mission family `wh3_dlc24_ksl_golden_knight`, and keys `wh3_dlc24_ksl_golden_knight_choice`, `wh3_dlc23_neu_ulrika_choice`, `wh3_main_ksl_stables_1`, and `wh3_main_foreign_slot_discovery_ksl_2`.
- Ostankya relations: `db/cooking_recipes_tables/data__`, `db/campaign_group_cooking_recipes_tables/data__`, and `db/resource_cost_pooled_resource_junctions_tables/data__`; keys `wh3_dlc24_ksl_spirit_essence`, `wh3_dlc24_resource_cost_ksl_witchs_hut_brew`, and `wh3_dlc24_resource_cost_ksl_witchs_hut_brew_advanced`.
- Commandment relations: `db/provincial_initiatives_to_subculture_junctions_tables/data__`, `db/effect_bundles_to_effects_junctions_tables/data__`, and `provincial_initiative_records__.loc.tsv`; key `wh3_dlc24_edict_ksl_anti_chaos`.

### Web grounding and vocabulary discovery

- Creative Assembly, [Total War: Warhammer III patch 6.1 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/49-total-war-warhammer-iii-patch-notes-6-1).
- Creative Assembly, [Kislev development article](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/67%20style=button).
- Creative Assembly, [Total War: Warhammer III patch 8.1 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101).
- Community discovery aids: [Kislev](https://totalwarwarhammer.fandom.com/wiki/Kislev), [Court & Orthodoxy](https://totalwarwarhammer.fandom.com/wiki/Court_%26_Orthodoxy), [The Ice Court](https://totalwarwarhammer.fandom.com/wiki/The_Ice_Court_(mechanic)), [Kislev technology](https://totalwarwarhammer.fandom.com/wiki/Kislev_tech_tree), [Ursun Revivalists](https://totalwarwarhammer.fandom.com/wiki/Ursun_Revivalists), and the [Steam Boris campaign checklist](https://steamcommunity.com/sharedfiles/filedetails/?id=2972219604). These were used for discovery and omission checking, not as authority for precise 8.1.1 values.

### Evidence limitations

- Player Ice Court training is engine/table driven; the installed Lua exposes only AI fallback. The current UI confirms slots, a financial initiation cost, multi-turn dilemmas, and permanent outcomes, but no safely traced numeric base price, so none is reported.
- Devotion's 75+ climate nullification, negative-Devotion Ataman XP, and -100 Chaos incursion are retained only as current official-description claims because their threshold bundles were not independently located in the decoded relations.
- The guide documents the Witch's Hut's recipe count, ingredient gating, cost classes, stored-use output, and progression interaction, but does not enumerate all 22 recipe payloads.
- A single decode of `db/provincial_initiative_records_tables/data__` reset the RPFM endpoint and was not retried. No claim depends on that relation: commandment applicability and effects use the narrower subculture junction, effect relation, and localization instead. The reverse audit used direct faction scripts, narrow feature/ritual/governor/mission/commandment tables, stable faction and subtype keys, and existing exports. No Kislev-specific Supply Lines exemption, race-wide settlement/occupation replacement, or special campaign stance/attrition system was found; generic rules in those categories are excluded, with `Frontier Forces` and the target-side Coven's Cursemark behavior documented as bounded exceptions above.
