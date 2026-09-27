# Beastmen campaign mechanics — patch 8.1.1

> **9.0 retrieval rule:** These paragraphs remain an 8.1.1 archive. Use the [claim dispositions and new-content supplement](../UPDATE_9.0_CLAIMS.md) for affected systems, and current normalized owners for table values. Historical lists do not prove current exclusion.


> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Beastmen | `race_slug=beastmen` | **Playable factions:** 4

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The four faction economy exports already describe ordinary horde and Herdstone building levels, costs, prerequisites, and standardized outputs. The normalized unit file and typed lookups already describe roster permissions, unit statistics, abilities, weapons, and mounts. The character exports already contain the ordinary skill trees for Khazrak, Malagor, Morghur, Taurox, and generic Beastmen lords and heroes. Those rows are not repeated here. This document records the campaign feature exceptions, occupation loop, pooled resources, scripted progression, capacity system, challenge technologies, stances, and faction-specific rules needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Horde campaign chassis

**Applicability:** all four playable factions.

Beastmen development is attached principally to army hordes and Herdstones rather than to a conventional regional economy. Their campaign feature group disables background income, region Growth, region wealth, control, generic factionwide recruitment, and additional-army upkeep. Consequently, another ordinary army does not add the usual difficulty-scaled Supply Lines percentage, and army recruitment/development depends on the relevant horde and Herdstone rules rather than a shared global recruitment pool.

The default movement stance has proactive ambush. Beast-Paths cross otherwise impassable terrain. Base Raiding grants +200 general experience per turn, attrition immunity, +10 Winds of Magic, +3 Bestial Rage, and -5 horde Growth, and starts battles winded. Hidden Encampment costs 10% action points, grants attrition immunity, +10 replenishment, a hidden state and stealth effects, and modifies Bestial Rage by -2; installed UI text says it cannot be entered while another army can see the force.

### Herdstones, Bloodgrounds, and Rituals of Ruin

**Applicability:** all four playable factions.

Each faction receives one Herdstone Shard at a new campaign's start. Establishing a Herdstone creates a Bloodground from regions in the same province and scripted adjacent and double-adjacent searches. A region cannot belong to overlapping Bloodgrounds.

Devastation is stored for the Bloodground. A Beastmen victory there adds 2; razing a settlement adds twice the settlement level, with the Herdstone-establishing battle also contributing its 2-point victory amount when that level is available. At 10 Devastation the Ritual of Ruin becomes available.

For a human-controlled faction, completing the ritual converts the Bloodground's Devastation into Marks of Ruination, rounded after any peak Dark Moon multiplier: ×1.1 during a full moon, ×1.2 during a lunar eclipse, or ×1.3 during a solar eclipse. It also grants one Herdstone Shard. An AI-owned Bloodground instead auto-completes at 10 Devastation and enters the completed state without calling that human-only Marks-and-shard reward function. Abandoned non-Herdstone regions in a completed Bloodground receive the Beastmen occupation block, while Bloodground regions also receive the applicable Beastmen capture block. Losing the Herdstone dissolves its Bloodground; if it is lost before the ritual, the previous Beastmen owner receives the shard back. The scripted raze options restore either 20% or 40% of the acting army's movement.

Some Herdstone auxiliary chains propagate a Bloodground-wide rule rather than an ordinary local output: vision, a 2% plague chance per region on each update, or resistance effects. Their ordinary building data remains in the economy catalog.

### Marks of Ruination progression

**Applicability:** all four playable factions.

Marks are cumulative and unlock eight passive tiers, including the starting tier. Later bundles replace earlier ones but carry forward their unlocked cap purchases.

| Marks | Cumulative army capacity | Horde construction cost | Other progression changes |
|---:|---:|---:|---|
| Start | — | — | Ungor, Harpy, and poison Warhound/Razorgor cap purchases available. |
| 25 | +1 | — | Adds Gor, Centigor, and Tuskgor Chariot cap purchases. |
| 60 | +2 | -10% | Adds Bestigor, Chaos Spawn, Tzaangor, Pestigor, Khorngor, and Slaangor cap purchases. |
| 100 | +3 | -10% | Adds all three Minotaur cap groups; cumulative +1 shard. |
| 150 | +3 | -15% | Adds Cygor, Ghorgon, Jabberslythe/Cockatrice, Incarnate Elemental, and Preyton/Chimera groups; cumulative +2 shards. |
| 220 | +4 | -15% | Retains the prior unlock set and two cumulative milestone shards. |
| 320 | +4 | -25% | Cumulative +3 shards; unlocks the repeatable army-capacity purchase. |
| 500 | +4 | -25% | Cumulative +5 shards, universal army attrition immunity, and the final battle. |

The cumulative shard column means the Lua awards one new shard at 100, one at 150, one at 320, and two at 500. It is separate from the initial shard and the shard granted by each human-completed Ritual of Ruin. Four sequential Dread purchases upgrade the Herdstone tier. Reaching 500 Marks triggers `wh_dlc03_qb_bst_the_final_battle` and the completion event for the progression. In the current 8.1 chain, completing Fall of Man then triggers The Fall of Men and grants the Beastmen-exclusive Banner of the Fallen Kings.

For AI Beastmen, the same Lua has a fallback rather than requiring normal player interaction: it injects 2,000 Dread for cap upgrades and advances Herdstone, unit-cap, and army-cap state on 25-, 20-, 15-, and 25-turn cadences.

### Dread purchases, capacity, and confederation

**Applicability:** all four playable factions.

Dread is earned through the Beastmen campaign group's post-battle relation and from razing. The installed battle relation has 50 as its base parameter and bounds its computed result between 75 and 125; the separate razing transaction grants 20 Dread. The engine formula is not strengthened here into a more specific casualty rule.

The Dread panel controls campaign availability rather than ordinary unit statistics. Current base costs include:

- Herdstone upgrades: 375, 750, 1,500, and 2,250 in sequence.
- Horde recruitment-cap upgrades: 750, 1,000, and 1,500.
- New-lord recruit-rank upgrades: 1,000, 1,500, and 2,000, granting +5, +10, and +15.
- Bray-Shaman, Gorebull, and Wargor capacity: 500 for +1 of the respective hero category.
- Additional army capacity: 1,500 after the purchase is unlocked at 320 Marks; the script supports at most 25 crafted increases.
- Another playable Legendary Lord faction: 1,200 each.
- Unit-cap purchases: 100–600 according to group. Purchases give +2 for Ungors, Gors, and poison Warhounds/Razorgor, and +1 for every other listed group.

Unit-cap prices escalate after purchase. The first scripted increase adds 15 Dread to the base price; later increases set the next price to the old price plus 10% of that price plus 15. Hero-cap prices use the same rule with 10 instead of 15.

Ordinary same-culture confederation is explicitly disabled by the campaign setup. The four 1,200-Dread Legendary Lord rituals instead target the four playable factions and use `awake_from_death=true`, so they can acquire the corresponding Lord even after that target faction has been destroyed.

### Bestial Rage and diplomacy pressure

**Applicability:** all four playable factions; the value is army-specific where the effect scope is a force.

Bestial Rage has four installed bands:

| Rage | Active consequences |
|---:|---|
| 80+ | +8 charge bonus, +8 replenishment, +8 horde Growth, and animosity modifier -2. |
| 40–79 | +3 horde Growth. |
| 20–39 | -1 leadership, -5 horde Growth, and animosity modifier +1. |
| Below 20 | -2 leadership, -20 horde Growth, and animosity modifier +1. |

The low and very-low bundles also contain the legacy-named `wh_dlc03_low_morale_attrition_immunity` effect, while campaign setup permanently applies a faction bundle with the same effect key. The decoded relations do not establish the engine's override semantics safely enough to claim that low Rage currently causes attrition; the Growth, leadership, and animosity changes above are the directly verified consequences.

Beastmen diplomacy is force-restricted by default to war, payments, and peace, with a permitted-faction set providing exceptions. For a human-controlled Beastmen proposer or recipient, forming an alliance, peace treaty, or non-aggression pact applies a five-turn bundle that modifies Bestial Rage by -1.

### Dark Moon cycle

**Applicability:** every human-controlled Beastmen faction.

The Dark Moon follows an eight-turn cycle. Phases 1–3 grant +8, +6, and +4 horde replenishment; phase 4 grants +2 replenishment and +5% post-battle loot; phases 5–7 grant +10%, +15%, and +20% post-battle loot. On phase 8 the script selects full moon at 35%, lunar eclipse at 35%, or solar eclipse at 30%; the first phase-8 event is forced to solar eclipse.

The phase-8 bundles grant, respectively, +5/+10/+15 character-generated Chaos corruption, +5/+15/+25 Winds reserve capacity, and +30/+40/+50% post-battle loot. They also provide the 10/20/30 Ruination modifier consumed by the Bloodgrounds script as the ×1.1/×1.2/×1.3 conversion above.

At phase 8, the dilemma presents four distinct effects dynamically drawn from replenishment, Bestial Rage, campaign movement, unit experience, unit statistics, horde Growth, and recruitment cost. The selected moon state determines low/medium/high strength. Their scripted durations by effect family are 2, 3, 3, 5, 3, 6, and 3 turns.

### Challenge-gated technologies

**Applicability:** every human-controlled Beastmen-culture faction.

Twelve technology nodes begin locked and are released by campaign feats rather than by a conventional prerequisite line. The executable thresholds are:

- establish a Herdstone;
- win five settlement-standard siege battles;
- complete two Rituals of Ruin;
- complete five successful hostile agent actions;
- win five night or ambush battles;
- have three characters reach rank 15;
- win five battles in which the opposing faction leader participated;
- win with at least five hero-class characters in the army;
- use Transformation of Kadon, Savage Dominion, or its bound version ten times in total;
- advance the Herdstone climate counter to three;
- advance the defeated-enemy-culture counter to four; and
- win four battles in the same turn.

The installed comments say three Rituals of Ruin and five same-turn battles, but the executed constants are two and four. The climate and culture counters are saved, but their uniqueness loops are not reliable enough to strengthen the rules into “three distinct climates” or “four distinct cultures.”

### Taurox's River of Blood, Rampage, and Momentum

**Applicability:** Slaughterhorn Tribe (`wh2_dlc17_bst_taurox`), specifically battles involving Taurox.

Every battle Taurox wins advances River of Blood in the battle region by one level, removes the prior level, and refreshes the replacement bundle for five turns. Drowned in Blood adds one level, and the result is capped at level 3. At levels 1/2/3, armies belonging to Beastmen, Norsca, or Warriors of Chaos receive +3/+6/+9 leadership while other armies receive -3/-6/-9; the region also receives +2/+4/+6 Khorne corruption. This victory listener is broader than Rampage gain, which requires Taurox to be the attacker.

Only attacking victories involving Taurox add Rampage. The base gain is `6 × enemy/Taurox army-value ratio × same-turn victory multiplier`: the value ratio is clamped to 0.8–1.2, the first victory multiplier is 1, and later wins use `1 + wins/2`; final gain is capped at 25. After four victories in one turn, a hidden trait raises the base from 6 to 9.

Momentum starts and restarts at 3. The first victory in a turn adds 2, later victories add 1, a loss subtracts 2, retreating subtracts 1, and faction-turn start subtracts 1. At zero or below, Rampage is cleared and Momentum restarts. After the first Rampage threshold, Taurox can refill all movement for 3 Momentum; one tier-2 reward reduces this to 2.

Rampage thresholds are 50, 100, and 150. Each exposes four mutually exclusive five-turn reward bundles and grants 50, 100, or 200 Dread when a choice is made:

| Tier | Option 1 | Option 2 | Option 3 | Option 4 |
|---|---|---|---|---|
| 50 | Viletide and +10 Winds capacity | +5% ward save | Bloodgreed and +5 melee attack | -8 enemy leadership and melee defence |
| 100 | +20% razing income and -20% horde construction cost | +25% battle Dread | delegates to the Dark Moon script | movement-refill Momentum cost -1 |
| 150 | -50% Gorebull cap cost and +5 recruit rank | -50% Bray-Shaman cap cost and +5 recruit rank | -50% Wargor cap cost and +5 recruit rank | -25% all Minotaur cap costs |

Reaching 150 immediately completes and restarts the Rampage, clearing the Rampage and Momentum resources. AI Taurox chooses an available reward automatically at turn start and deliberately skips the tier-2 Dark Moon option.

The Dark Moon delegation writes `moon_phase=7` and `solar_eclipse_guaranteed=true`. In the installed moon script, that guarantee variable is never read and the phase is recomputed from the turn number. The intended guaranteed eclipse therefore cannot be asserted as operative in this snapshot.

### Legendary Lord stance variants

**Applicability:** only the named Lord's force.

- Khazrak's Hidden Encampment reduces its Bestial Rage modifier to -1 rather than -2 and adds +15% ambush success; it retains the 10% movement cost, attrition immunity, hidden state, and +10 replenishment.
- Malagor's Deep Beast-Paths costs all movement, adds +50% campaign movement to the stance calculation, enables Beast-Paths interception/movement behavior, forbids attacking that turn, and uses tunnelling retreat behavior.
- Morghur's Despoiler Raiding adds +8 Chaos corruption and hostile-region Chaos attrition to the base raiding pattern.
- Taurox's Juggernaut Raiding adds +25% campaign movement, reduces raiding income by 25%, and starts battles tired rather than merely winded.

## Faction coverage

- **Harbinger of Disaster** (`wh2_dlc17_bst_malagor`): all race-wide systems; Malagor's Deep Beast-Paths stance.
- **Slaughterhorn Tribe** (`wh2_dlc17_bst_taurox`): all race-wide systems; Taurox's River of Blood, Rampage, Momentum, reward choices, movement refill, and Juggernaut Raiding stance.
- **Warherd of the One-Eye** (`wh_dlc03_bst_beastmen`): all race-wide systems; Khazrak's improved Hidden Encampment.
- **Warherd of the Shadowgave** (`wh_dlc05_bst_morghur_herd`): all race-wide systems; Morghur's Despoiler Raiding stance.

No additional uncataloged unique-character acquisition chain beyond the four Legendary Lord Dread rituals, and no additional faction-exclusive campaign panel, was located. Ordinary faction and Lord trait effects, character skills, building chains, and quest-item battles remain in their respective catalogs or are outside this document's campaign-system boundary; the final-battle banner above is included because it is an output of the bespoke Marks progression.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and every CSV under `data/economy/factions/beastmen/`.
- `data/unit_stats/normalized/beastmen__wh3__8.1.1__ultra.csv` and the typed roster, ability, weapon, and mount lookups under `data/unit_stats/lookups/`.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and every file under `data/skill_trees/characters/beastmen/`.
- Relevant English localization under `data/unit_stats/source_exports/text/db/`, including pooled-resource, ritual, effect, stance, campaign-feature, and UI text records.

### Installed vanilla game files inspected through RPFM

- Scripts: `script/campaign/wh2_dlc17_bloodgrounds.lua`, `script/campaign/wh2_dlc17_bst_ruination_progression.lua`, `script/campaign/wh2_dlc17_taurox_rampage.lua`, `script/campaign/wh2_dlc17_beastmen_tech.lua`, `script/campaign/main_warhammer/wh_dlc03_beastmen_moon.lua`, `script/campaign/wh_campaign_setup.lua`, `script/campaign/wh_campaign_faction_start.lua`, and `script/campaign/_narrative/races/wh3_narrative_beastmen.lua`.
- Tables: `db/campaign_features_tables/data__`, `db/campaign_group_post_battle_looted_pooled_resources_tables/data__`, `db/campaign_group_pooled_resource_effects_tables/data__`, `db/resource_cost_pooled_resource_junctions_tables/data__`, `db/campaign_group_rituals_tables/data__`, `db/ritual_payload_change_unit_capacities_tables/data__`, `db/ritual_payload_change_agent_capacities_tables/data__`, `db/ritual_payload_form_confederations_tables/data__`, `db/ritual_payload_effect_bundles_tables/data__`, and `db/effect_bundles_to_effects_junctions_tables/data__`.
- Stable reverse-search keys: the four playable faction keys; Legendary Lord subtypes `wh_dlc03_bst_khazrak`, `wh_dlc03_bst_malagor`, `wh_dlc05_bst_morghur`, and `wh2_dlc17_bst_taurox`; campaign group `wh_dlc03_feature_beastmen`; resources `bst_dread`, `bst_ruination`, `bst_herdstone_shard`, Rampage, and Momentum; the River of Blood, Fall of Man, Banner of the Fallen Kings, `wh2_dlc17_bst_ruination_passive_tier_*`, unit-cap ritual, Legendary Lord ritual, and Taurox Rampage families.

### Web grounding

- Creative Assembly patch 8.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes
- Creative Assembly hotfix 8.1.1 notes: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/14865-total-war-warhammer-iii-hotfix-8-1-1
- Creative Assembly hotfix 6.1.3 and patch 6.3 notes used to identify current Beastmen fixes: https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-patch-notes-amp-announcements/threads/9775-total-war-warhammer-iii-hotfix-6-1-3 and https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/78-total-war-warhammer-iii-patch-notes-6-3
- [Beastmen overview](https://totalwarwarhammer.fandom.com/wiki/Beastmen), [Herdstones and Blood-Grounds](https://totalwarwarhammer.fandom.com/wiki/Herdstones_and_Blood-Grounds), and [Slaughterhorn Tribe](https://totalwarwarhammer.fandom.com/wiki/Slaughterhorn_Tribe) — secondary discovery checklists, not authority for the numeric rules above.
- [Beastmen campaign guide](https://steamcommunity.com/sharedfiles/filedetails/?id=2569248526) — secondary omission checklist used during reconciliation.

### Evidence limitations

- RPFM returned the decoded paths from the merged vanilla CA packs as source `PackFile`; all operations used the repository's locked read-only wrapper. No pack was saved or edited.
- The exact engine evaluation of the legacy-named low-Bestial-Rage attrition effect and its permanently applied setup override was not independently resolvable. This guide therefore reports the directly decoded Bestial Rage effects and does not claim low-rage attrition.
- Taurox's tier-2 moon option contains an installed-script disconnect: `solar_eclipse_guaranteed` is written but not read. The guide reports that limitation rather than the localized intended result.
- The empty Beastmen WH3 narrative loader contains no additional campaign chain. Ordinary quest-item missions were excluded because they do not change how the race's campaign systems operate; the Fall of Man reward is retained only as the verified endpoint of the Marks final-battle progression.
