# Ogre Kingdoms campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

| Field | Value |
|---|---|
| Game | Total War: Warhammer III |
| Patch | 8.1.1 |
| Steam build | 24237342 |
| Race | Ogre Kingdoms |
| Race slug | `ogre_kingdoms` |
| Playable factions | 3 |

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The three economy CSVs already enumerate constructible settlement and Camp building levels, ordinary construction costs and times, prerequisites, standardized outputs, and recruitment modifiers. The normalized unit file and typed lookups already cover the Ogre roster, faction permissions, statistics, weapons, mounts, attributes, and ability payloads. The 18 character files already contain the skill trees and ordinary skill/ancillary grants of the playable lords, Bragg, the Paymaster, the Camp Tyrant, and the generic Ogre characters. Those facts are not repeated here. This document records the campaign systems, acquisition rules, resource state, scripted limits, and faction branches that those catalogs cannot express.

## Mechanically relevant material not captured elsewhere

### Meat, Hunger, and battle abilities

**Applicability:** race-wide — The Maneaters (`wh3_dlc26_ogr_golgfag`), Disciples of the Maw (`wh3_main_ogr_disciples_of_the_maw`), and Goldtooth (`wh3_main_ogr_goldtooth`).

Meat (`wh3_main_ogr_meat`) belongs to an individual military force rather than the faction. Each unit consumes one Meat per turn. An army may transfer Meat to or from an Ogre Camp, but not directly to another army or another Camp. Meat pays for Camp deployment and construction and for active Offerings to the Great Maw. Battle, raiding, post-battle, and settlement actions generate it; the post-battle award is capped at 250.

Zero Meat no longer causes the old Meat attrition. Instead, each army receives a Hunger state from its current balance:

| Meat | Hunger | Force effects |
|---:|---|---|
| 0–4 | Starving | -20% unit mass, -15% casualty replenishment, +10% upkeep, -5 leadership |
| 5–12 | Famished | +5% unit mass, +3% speed, +3 charge bonus; enables Dismember |
| 13–25 | Ravenous | +10% unit mass, +10% Meat consumed, +6% speed, +6 charge bonus, -5% upkeep; enables Dismember and Massacre |
| 26+ | Gluttonous | +25% unit mass, +25% Meat consumed, +10% speed, +10 charge bonus, -10% upkeep; enables Dismember, Massacre, and Butcher |

Official Update 6.0 states that the enabled army abilities build their shared battle resource from enemy entities killed by charging Ogre units. Their combat payloads are already represented by the typed ability data; the installed uncataloged rule is that the army's current Hunger band determines which abilities are available.

Ogre settlement outcomes also convert a share of the settlement's loot basis to the capturing army's Meat: Loot & Occupy uses a 0.05 multiplier, Sack 0.10, and Raze 0.80. Ordinary Occupy has no Meat transaction.

### Ogre Camps and foreign mercenary recruitment

**Applicability:** race-wide; Golgfag has one starting-Camp grant noted below.

Deploying a Camp costs 250 Meat and creates a mobile `OGRE_CAMP` force led by a no-upkeep Camp Tyrant (`wh3_main_ogr_tyrant_camp`) in fixed-Camp stance. A newly created Camp starts with three buildings and a recruitment sphere of radius 35. Camp buildings consume the Camp's Meat instead of ordinary Horde Growth, and the Camp force itself has no ordinary army upkeep. Units stationed in a Camp cannot be exchanged directly with field armies.

The base race trait permits one Camp. **Bigga Camps** (`wh3_main_tech_ogr_1_11_0`) adds one; **Ogre Throng** (`wh3_main_tech_ogr_0_2_0`) adds one and causes each tier-5 Camp centre to add another Camp slot. The tier-3 Pottery resource building adds one further slot where available; its building availability is already in the economy catalog. The Maneaters' starting Camp receives 250 Meat on turn 1.

Other factions near an Ogre Camp can recruit from its `ogre_mercenaries` pool. That foreign pool gains one unit every five turns, improves in quality with Camp tier, and limits each recruiting army to three such mercenaries. Payment is made by the recruiter and produces income for the Camp owner. These foreign purchases are distinct from the Camp owner's ordinary building recruitment.

The installed AI controller starts from one possible Camp and adds one for each of Bigga Camps and Ogre Throng. It transfers army Meat above 500 to a random Camp in ten-point transactions. Patch 6.3.4 improved AI Camp construction and Meat budgeting but explicitly left some AI Camp-building and Meat-use limitations; those AI limitations do not change the human Camp rules above.

### Offerings to the Great Maw and Big Names

**Applicability:** race-wide.

Offerings are persistent character initiatives that can be toggled for an army. Multiple armies may sustain Offerings simultaneously. The current choices are **All-Consuming Stomachs**, **Ravening Horde**, **Bone to Pot**, and **Feasting Frenzy**. Each installed initiative has indefinite duration and references the same intended ongoing cost of 20 Meat per turn from its army; changing the choice is governed by the ten-turn target-category cooldown.

| Offering | Current installed effects |
|---|---|
| All-Consuming Stomachs | +10% campaign movement range; enables tunnelling stance |
| Ravening Horde | +20% income from raiding; enables Offerings-to-the-Maw attrition against enemies in the province |
| Bone to Pot | +2 Winds of Magic power reserve per turn; enables the passive ability Bone to Pot for the army's general |
| Feasting Frenzy | +5 melee attack; enables the ability Feasting Frenzy for the army's general |

Each current Offering also contributes one active-Offering point to the Disciples of the Maw's Path of the Butcher recount. The installed database retains the pre-rework ten-turn rituals Bloody 'n' Raw, Come 'n' Get It, Fill Yer Bellies, and Give Me Gut Magic and their old bundles, but those legacy rows are not the current Offering choices: active campaign setup and Path of the Butcher listen to the four reworked initiative keys above. A public 8.1.1 bug report says only Feasting Frenzy actually deducts the per-turn Meat in live play; that is a runtime discrepancy from the common upkeep configured for all four records.

Big Names apply to Ogre Lords and Heroes, including the named playable lords and Bragg. Each character has challenge-driven unlocks; installed listeners cover battle results and opponents, force composition, sacking or razing, rank and stance, Meat state, Camp deployment, spell use, and other character-specific conditions. Unlocked Big Names are persistent, have no activation cost or cooldown in their initiative records, and multiple names may be active at once. Their individual effect values are not duplicated because those overlap the character/effect data; the uncataloged behavior is the per-character challenge and simultaneous-activation lifecycle.

### Rolling Bounties

**Applicability:** every human Ogre-culture faction, including The Maneaters alongside Golgfag's Mercenary Contracts.

Bounties begin on turn 3 and maintain three simultaneous mission slots. A vacant slot is replenished on the next faction turn after completion, expiry, or cancellation. Objectives are one of: kill a named character, capture a named region, or sack/raze a named settlement.

An issuer must be a met, living AI faction at peace with the player and with a home region. The script prefers issuers near the player's capital. It targets an eligible enemy of that issuer; if none exists, it can use the issuer's lowest-attitude eligible non-human, non-vassal relationship. The exact target is the closest eligible general or region. Duration is distance-derived and clamped to 10–30 turns.

The treasury reward is distance-scaled with a minimum of 2,000 and is increased by 25% when the target is a province capital or immortal character. Completion also grants +6 attitude with the issuer. The three slots rotate these extra rewards: five turns of -10% Meat construction cost for Camp buildings, a random rare ancillary, and +200 Meat to the player's army with the lowest Meat.

### The Maneaters: Mercenary Contracts

**Applicability:** The Maneaters (`wh3_dlc26_ogr_golgfag`) only.

Golgfag's offer list is built from met, living factions that are at peace with him, are not vassals, and are not at war with a member of his team. Monogod/Daemons, Beastmen, Warriors of Chaos, Nakai, and Aislinn cannot be clients, although they can be contract enemies. Accepting an offer clears the other offers, makes the client's enemies contract targets through the engine war-contract system, prevents those targets from confederating while the contract is active, and unlocks one cost-free teleport to a client region. The teleport is locked after it is used or the contract resolves.

The initial human campaign offers fixed six-turn, 250-point contracts from Ostland and Nordland. Later contract duration is `floor(point target / 75) + random(0..3)`, clamped to 5–20 turns. The point target is based on the client enemies' military forces plus one quarter of each owned region's GDP, then reduced through installed diminishing multipliers; offers at 200 points or less are discarded.

The engine awards points for ordinary aggression against contract enemies. Two additional scripted sources are exact: each qualifying Golgfag force in Raiding or fixed-Camp stance in a target-owned region adds 10 points at faction-turn start, and a successful or critical hero action against a target character or garrison adds 25. Points above the target immediately pay 5 treasury each.

On completion, base treasury is 10 per target point and Meat is 2 per point; each total is independently randomized to 80–120%. There is a 45% chance of one secondary reward and a 5% chance of two. Each secondary reward is a seven-turn effect bundle, a client-culture ancillary, or a client-culture banner, and reduces the treasury payout by 10%.

Golgfag's occupation groups add active-contract points to Loot & Occupy, Occupy, and Raze. **Gift to Client** transfers a captured settlement to the current client, uses a 0.10 contract-point loot multiplier, and adds a positive Treasury transaction; settlements gifted this way count as occupied settlements for Golgfag's victory requirements.

Completing, failing, or cancelling a contract opens a cleanup choice when any target survives: continue the wars or force peace with every surviving target. Either path restores target confederation diplomacy and applies a positive diplomatic event; failure also applies a moderate relation penalty with the client. Independently of any active contract, The Maneaters cannot conclude military alliances, defensive alliances, or vassal agreements.

### Goldtooth: Tyrant's Demands

**Applicability:** Goldtooth (`wh3_main_ogr_goldtooth`) only.

Tyrant's Demands are Treasury-funded, zero-cast-time target actions with individual cooldowns:

| Demand | Cost | Cooldown | Target and result |
|---|---:|---:|---|
| Sticky Fingers | 2,500 | 5 turns | Non-allied foreign army; steals one random magic item or compatible ancillary from its Lord, if available |
| Rough 'Em Up | 2,500 | 5 turns | Non-allied foreign army; disables movement and applies Offerings-to-the-Maw attrition for two turns |
| Overtime | 5,000 | 10 turns | Own army; refills campaign movement |
| Veteran Wages | 5,000 | 10 turns | Own army; adds one rank to every unit |
| Money Launderin' | 5,000 | 15 turns | Eligible foreign settlement; installs a foreign building that siphons its income |
| Stompin' Grounds | 5,000 | 15 turns | Own army; grants it 250 Meat |
| Bribe | 20,000 | 25 turns | Non-allied AI army; disbands every non-character unit |
| Buyout | 25,000 | 25 turns | Non-allied AI settlement; transfers the region to Goldtooth |

The target filters deliberately distinguish ordinary foreign targets from AI-only Bribe and Buyout targets. Patch 6.1 corrected several demand-target checks; the table above follows the installed 8.1.1 target records and script handlers.

### Disciples of the Maw: Path of the Butcher

**Applicability:** Disciples of the Maw (`wh3_main_ogr_disciples_of_the_maw`) only; the named abilities apply to Skrag the Slaughterer.

The faction resource `ogr_path_of_the_butcher` resets and recounts active Great Maw Offerings across all of the faction's characters. Offering activation, death, and convalescence all force that recount. The resulting faction-wide thresholds are:

| Active Offerings | Faction effects | Skrag / army ability effects |
|---:|---|---|
| 0 | None | None |
| 1–3 | -5% Winds cost for all spells; +10% Meat from battles | +1 use of Gorger Onslaught for Skrag |
| 4–6 | -10% Winds cost; +20% Meat from battles | Gorger Onslaught and Simmering Pot for Skrag |
| 7–9 | -15% Winds cost; +30% Meat from battles | Upgraded Gorger Onslaught and Boiling Cauldron for Skrag |
| 10+ | -25% Winds cost; +50% Meat from battles | Upgraded Gorger Onslaught for Skrag; Boiling Cauldron army ability for owned forces |

An older official 6.0 description also mentions Camp-construction reduction. That modifier is absent from the installed 8.1.1 Path effect bundles, so it is not asserted for this snapshot.

### Defeat-confederation and trespass immunity

**Applicability:** race-wide.

When an Ogre faction leader defeats another Ogre faction leader, the same-culture subjugation controller can confederate the defeated faction. The loser must be AI and cannot be excluded by invasion or vassal state. A human winner receives a dilemma: potentially playable losers use `wh3_dlc26_ogr_confederate_generic_no_execution`; nonplayable losers use `wh3_dlc26_ogr_confederate_generic`, whose decline branch can execute the defeated lord. An AI winner confederates automatically. This is a post-defeat rule, not ordinary diplomacy-panel confederation.

Official Update 6.0 states that all Ogre Kingdoms factions are immune to diplomatic penalties for trespassing; no distinct implementation record was located in the safely inspected installed relations. No separate Ogre vassal system or whole-race Supply Lines replacement was found. The global additional-army-upkeep feature remains enabled for Ogre field armies, while the `OGRE_CAMP` force type is explicitly excluded; only Golgfag has the alliance/vassal restrictions described above.

### Bragg the Gutsman acquisition

**Applicability:** all three playable Ogre factions with `TW_WH3_OMENS_OF_DESTRUCTION_OGR`, provided Bragg has not already been claimed.

When the human faction leader reaches rank 10, **Heads Must Roll** (`wh3_dlc26_ie_ogr_bragg_stage_2`) is issued in either campaign. It is an infinite, non-cancellable assassination quest whose target is constrained to Ogre culture. Success pays 5,000 treasury, spawns Bragg (`wh3_dlc26_ogr_bragg_the_gutsman`), and grants Great Gutgouger (`wh3_dlc26_anc_weapon_great_gutgouger`). If there is no eligible human Ogre recipient, the framework gives Bragg to the strongest eligible AI Ogre faction from turn 30.

## Faction coverage

- **The Maneaters** (`wh3_dlc26_ogr_golgfag`): all race-wide Meat/Hunger, Camp, Offering, Big Name, Bounty, confederation, trespass, and Bragg rules; the faction-exclusive Mercenary Contract, teleport, occupation/gifting, reward, diplomacy, and cleanup rules in **The Maneaters: Mercenary Contracts**.
- **Disciples of the Maw** (`wh3_main_ogr_disciples_of_the_maw`): all race-wide systems and Bragg acquisition; faction-exclusive Offering aggregation and threshold rewards in **Disciples of the Maw: Path of the Butcher**.
- **Goldtooth** (`wh3_main_ogr_goldtooth`): all race-wide systems and Bragg acquisition; faction-exclusive target actions in **Goldtooth: Tyrant's Demands**.

The remaining playable-lord traits, skills, buildings, roster permissions, and ordinary recruitment differences are represented by the economy, unit, and character catalogs.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all three CSVs under `data/economy/factions/ogre_kingdoms/`.
- `data/unit_stats/normalized/ogre_kingdoms__wh3__8.1.1__ultra.csv` and the typed roster, ability, attribute, component, mount, and weapon lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 18 files under `data/skill_trees/characters/ogre_kingdoms/`.
- English localization under `data/unit_stats/source_exports/text/db/`, especially `rituals__.loc.tsv`, `effects__.loc.tsv`, `technologies__.loc.tsv`, `unit_abilities__.loc.tsv`, `missions__.loc.tsv`, and campaign-group/effect-bundle localization.

### Installed vanilla game files inspected through locked RPFM

- Scripts: `script/campaign/wh3_dlc26_ogre_camps.lua`, `script/campaign/wh3_campaign_ogre_contracts.lua`, `script/campaign/wh3_dlc26_contracts.lua`, `script/campaign/wh3_dlc26_tyrants_demands.lua`, `script/campaign/wh_campaign_setup.lua`, `script/campaign/wh3_campaign_character_initiative_unlocks.lua`, `script/campaign/wh3_main_legendary_characters.lua`, `script/campaign/wh3_campaign_subjugation.lua`, `script/campaign/wh3_campaign_ai.lua`, and `script/campaign/main_warhammer/required.lua`.
- Tables: `db/pooled_resources_tables/data__`, `db/campaign_group_member_criteria_numeric_ranges_tables/data__`, `db/campaign_group_pooled_resource_effects_tables/data__`, `db/effect_bundles_to_effects_junctions_tables/data__`, `db/resource_costs_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/rituals_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, `db/ritual_payload_resource_transactions_tables/data__`, `db/initiatives_tables/data__`, `db/technology_effects_junction_tables/data__`, `db/campaign_features_tables/data__`, `db/culture_settlement_occupation_options_tables/data__`, `db/campaign_group_members_tables/data__`, `db/campaign_group_member_criteria_climates_tables/data__`, `db/missions_tables/data__`, `db/cdir_events_mission_option_junctions_tables/data__`, and `db/cdir_events_mission_payloads_tables/data__`.
- Stable keys/search families: all three faction keys; LL subtypes `wh3_dlc26_ogr_golgfag_maneater`, `wh3_main_ogr_skrag_the_slaughterer`, and `wh3_main_ogr_greasus_goldtooth`; Bragg subtype and mission; `wh3_main_ogr_meat`; `wh3_dlc26_ogr_meat_CAI`; `ogr_path_of_the_butcher`; `wh3_dlc26_bundle_ogr_hunger_*`; `wh3_dlc26_skrag_path_of_the_butcher_*`; `wh3_dlc26_ogr_tyrants_demands_*`; `wh3_dlc26_ogr_ritual_golgfag_teleport`; and the Ogre occupation-decision groups.

### Web grounding

- Creative Assembly, Update 6.0.0: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0
- Creative Assembly, Introducing Golgfag Maneater: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/38-omens-of-destruction-introducing-golgfag-maneater
- Creative Assembly, Patch 5.3.0: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/34
- Creative Assembly, Hotfix 6.0.2: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/8367
- Creative Assembly, Patch 6.1: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/49-total-war-warhammer-iii-patch-notes-6-1
- Creative Assembly, Hotfix 6.3.4: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/11820-total-war-warhammer-iii-hotfix-6-3-4
- Creative Assembly bug report, Offering to the Great Maw upkeep on 8.1.1 (runtime-discrepancy discovery only): https://community.creative-assembly.com/total-war/total-war-warhammer/bugs/bugs-redirect/14069-ogre-offering-to-the-great-maw-bug
- Secondary discovery checklists: https://totalwarwarhammer.fandom.com/wiki/Ogre_Kingdoms ; https://totalwarwarhammer.fandom.com/wiki/Bounties ; https://totalwarwarhammer.fandom.com/wiki/Offer_to_the_Great_Maw ; https://totalwarwarhammer.fandom.com/wiki/Path_of_the_Butcher ; https://totalwarwarhammer.fandom.com/wiki/Bragg_the_Gutsman ; https://www.keengamer.com/articles/guides/total-war-warhammer-iii-omens-of-destruction-golgfag-maneater-faction-guide/

### Evidence limitations

- All installed-pack requests used `scripts/rpfm-call-locked.ps1`, source `PackFile`, and the required literal `$CA` placeholder. Only exact files or table paths were decoded; no pack was saved or edited.
- A recovery decode safely isolated current Offering initiative rows 365–368: all four have indefinite duration and reference `wh3_dlc26_resource_cost_ogr_great_maw_upkeep_cost`; the exact resource junction deducts 20 Meat. The current campaign-effect-list junction verifies the four effect sets reported above. A prior high-cardinality refilter had reset the endpoint and was not repeated; legacy ritual bundles are not presented as current Offering effects.
- Some ordinary Golgfag aggression values and war inheritance are supplied by the campaign engine's war-contract system rather than the decoded Lua. Only the two additional scripted point sources and the observed engine-mediated state changes are quantified.
- Trespass immunity is retained as a current official-source-only rule from Update 6.0; no distinct Ogre effect row or Lua controller for it was found in the safely inspected installed relations.
- Charge-kill generation for the Ogre army-ability battle resource is retained as a current official-source rule from Update 6.0. Installed Hunger bundles verify the ability availability gates, while the generic battle-resource generator itself was not exposed by the inspected campaign relations.
- Installed climate membership still differentiates suitable, unsuitable, and uninhabitable Ogre climate groups. The 6.0 statement that settlement value should be considered strategically rather than by climate is therefore treated as design guidance, not as evidence of climate immunity.
