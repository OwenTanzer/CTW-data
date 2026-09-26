# Vampire Counts campaign mechanics — patch 8.1.1

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** Total War: WARHAMMER III, patch **8.1.1**, Steam build **24237342**. Race: Vampire Counts (`vampire_counts`). Playable factions: 4. Campaign: Immortal Empires (`wh3_main_combi`); this installed snapshot maps none of these factions to a playable Realms of Chaos campaign.

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy exports already record constructible building variants, tiers, costs, times, prerequisites, and the narrow standardized income, Growth, control, trade, recruitment-cost, and upkeep fields. They do not flatten every conditional building effect, corruption value, unit permission, or character capacity. The normalized unit catalog records the race roster, faction permissions, unit statistics, battle abilities, mounts, and attributes. The character exports record ordinary Lord and Hero skill nodes. This guide does not repeat those catalogs. It records the shared Bloodline resource and unlock lifecycle, local Raise Dead pools, post-battle Dead Rise Again recovery, settlement and corruption exceptions, faction scripts, fixed character forms, campaign branches, and other operating rules that those catalogs do not express.

## Mechanically relevant material not captured elsewhere

### Blood Kisses and Bloodline awakenings

**Applies to:** all four playable factions.

Blood Kisses (`vmp_blood_kiss`) begin at zero in the pooled-resource relation. Campaign setup adds one to Sylvania and one to The Drakenhof Conclave when Mannfred's start trait is present; The Barrow Legion and Caravan of Blue Roses receive no scripted starting Kiss. A faction gains one Kiss from each of these installed triggers:

- win a battle in which the opposing faction leader is killed or sent into convalescence;
- first acquisition of each tracked vassal, whether through ordinary vassalage or liberation; ending and recreating the same vassalage does not pay again;
- a successful or critical-success action from the installed wound/assassinate action set; and
- technology `wh_main_tech_vmp_blood_01`.

The five Bloodlines each have three awakenings costing **3, 6, and 12** Kisses. The rituals have no cast time or cooldown. Each level replaces the previous level's bundle with a cumulative bundle, raises the faction's ordinary Lord/army capacity by one, and generates one Bloodline general in the recruitment pool. The generated Lord is **not immortal**. Wounding uses ordinary convalescence, but permanent loss does not reopen an awakening or generate a replacement. Each faction's own ritual state can therefore generate three Lords per track and fifteen in total. Confederation can additionally transfer another faction's surviving, already-instantiated Bloodline Lords; it does not replenish a permanently killed one.

The cumulative track rewards are:

| Bloodline | First awakening | Second awakening | Third awakening |
|---|---|---|---|
| Blood Dragon | +15% cavalry weapon strength | +100% parent-army XP from successful agent actions | +2 Blood Knight Raise Dead capacity |
| Lahmian | +20% character XP | +30 diplomacy with Empire, Kislev, Cathay, and Bretonnia | +150% line of sight |
| Necrarch | +25% research | +15 Winds reserve capacity | -10% unit upkeep |
| Strigoi | +20% ambush attack chance and +2 Crypt Ghoul Raise Dead capacity | +5 Vampiric corruption in owned provinces | +2 Crypt Horror Raise Dead capacity |
| Von Carstein | +10% casualty replenishment and Sylvanian Crossbowmen access | +5 control | Sylvanian Handgunners access |

Every Von Carstein awakening adds one Sylvanian Crossbowmen slot to a saved faction pool; the third also adds one Handgunners slot. The Bloodline skill `Cattle Herder` adds another Crossbowmen slot. Recruiting a unit consumes a current slot. At Vampire Counts faction-turn start, the script computes `saved capacity - saved in-pool count - surviving non-garrison units` and adds that whole missing quantity. However, it then increments the saved in-pool counter by only **one**, not by the quantity added; recruiting decrements it once per trained unit. A one-entry deficit therefore behaves like an ordinary replenishing slot, but a multi-entry deficit can overfill or desynchronise the pool across turns. Treat the saved capacity as the intended target, not as a strictly enforced cap. This remains a special pool, not permanent one-copy recruitment or ordinary building recruitment.

AI factions use the same Kiss, ritual, and pool systems. Their scripted priority differs: The Drakenhof Conclave and Sylvania use a sequence beginning with Von Carstein, while The Barrow Legion and Caravan of Blue Roses begin with Necrarch. The priority is not an extra resource grant.

### Raise Dead and famous battle sites

**Applies to:** all four playable factions.

Generic factionwide/global recruitment is disabled for the Vampire Counts campaign feature. Raise Dead instead recruits immediately from the selected army's current regional mercenary pool for the displayed treasury cost. It consumes the pool entry and has no training time. Patch 8.1 makes the treasury check include costs already pending in the Raise Dead queue, so several unaffordable units cannot be over-queued.

Installed relations separate **initial entries** from **group maxima**. The faction mercenary pool and province pool each link two Zombies and one of each Skeleton Warrior variant initially; the province pool also links one Fell Bats initially. Separately, group maxima are three Zombies, one of each Skeleton variant, one Dire Wolves, and two Fell Bats; those maxima are not opening counts. The installed base per-turn replenishment chances are 35% for Zombies; 20% for Skeleton variants, Crypt Ghouls, Dire Wolves, and Fell Bats; 10% for Grave Guard, Cairn Wraiths, and Crypt Horrors; and 5% for each Blood Knight variant. Other linked high-tier entries begin at zero and rely on battle-site additions. The panel can combine the army's applicable faction and province relations, and faction unit permissions still apply, so these rows are neither a promised summed opening display nor a second roster.

A famous battle site requires at least **2,150 total casualties**, **1,000 men on each side**, and **14 units on each side**. A qualifying fully AI-resolved battle has a 100% site-add chance; the campaign retains at most 200 famous battles. Battle casualties feed installed capacity and replenishment inputs, with the calculated bonus capped at two added unit-capacity entries and 50 percentage points of replenish chance. The database exposes the inputs and clamps but not a safe complete tier formula, so no derived unit-by-unit result is asserted.

The marker is a public region battle site created by a qualifying battle. It is not a private stockpile of the player's casualties, and recruiting from it does not consume a faction-specific “dead pool.”

The campaign feature also makes the enslave-captives post-battle outcome replenish the resolving force. Its native percentage was not exposed by the inspected script/data boundary and is not invented here.

### Dead Rise Again

**Applies to:** all four playable factions.

Dead Rise Again is separate from Raise Dead. After battle, a unit destroyed in that battle can be restored directly to its army, including after a defeat; it does not enter the region's Raise Dead pool. The installed base saving chance is **10%**. Lords and Heroes add 10 percentage points, unit experience adds one point per level, unit cost contributes `0.5 × (cost / 100)`, and each famous battle site in the province adds two points. The state-religion/corruption inputs in this definition are explicitly marked defunct.

Returned strength is calculated separately: base 1%, +5 points for a Lord or Hero, +1 per unit level, `1 × (cost / 200)`, and +5 per battle site, with variance 2. The installed variables do not expose the final rounding and clamping order, so those inputs should not be read as a promise of an exact displayed percentage in every case.

### Vampiric territory, attrition, occupation, and climate

**Applies to:** all four playable factions except where a faction override is named.

Vampire Counts factions are immune to `vampire_territory` attrition but ordinarily not to `non_vampire_territory`. The installed territory-attrition damage record is **11%**, so low/non-Vampiric territory threatens their armies while established Vampiric territory protects them and can damage non-immune living armies. High Vampiric corruption also supports Vampire Counts control and produces Vampiric rebellions. The precise engine threshold that changes territory state was not exposed in the safely retained relations and is not assigned a speculative percentage.

All four playable factions are separately immune to generic desert, mountain, snow, swamp, and wasteland attrition. Heinrich Kemmler's own army has a localized effect granting immunity to non-Vampire Counts territory attrition; this is personal to Kemmler, not a faction-wide immunity for The Barrow Legion.

The current occupation group permits colonise, do nothing, loot and occupy, occupy, raze, resettle, sack, and subjugate. Its active entries contain no required tag, region group, or settlement-type restriction. Older localization claiming Vampire Counts can capture only Vampire/human settlements except Norsca is therefore not an operative patch-8.1.1 rule. Colonising applies the one-turn vulnerable-colonisation bundle, and the listed capture/colonise actions consume the army's remaining action for that turn.

Climate suitability changes consequences rather than forbidding occupation:

| Faction | Suitable | Unsuitable | Uninhabitable |
|---|---|---|---|
| The Drakenhof Conclave; Sylvania | Desert, jungle, temperate, wasteland | Frozen, island, mountain, savannah | Chaotic Wasteland, magical forest, ocean |
| The Barrow Legion | Desert, mountain, temperate, wasteland | Frozen, island, jungle, savannah | Chaotic Wasteland, magical forest, ocean |
| Caravan of Blue Roses | Desert, magical forest, mountain, temperate, wasteland | Frozen, island, jungle, savannah | Chaotic Wasteland, ocean |

### Playable-faction start traits

**Applies to:** only the faction or selected Sylvania start named below.

- **The Drakenhof Conclave / Mannfred:** +20% research and +20 diplomacy with Vampire Counts and Followers of Nagash; enables the Mannfred Books/Malevolent Museum branch and supplies the scripted starting Kiss condition.
- **The Barrow Legion / Heinrich Kemmler:** Necromancers gain +25% XP, Raise Dead recruitment costs are -10%, the faction is immune to Chaos attrition, and diplomacy is +30 with Warriors of Chaos, Beastmen, and Norsca.
- **Caravan of Blue Roses / Helman Ghorst:** faction Zombies, Skeleton Spearmen, and Skeleton Warriors gain poison attacks; faction forces gain +10% casualty replenishment; Corpse Cart and Mortis Engine units gain the bound Lesser Raise Dead spell; regional Raise Dead capacity for Zombies is +4.
- **Sylvania with Vlad selected:** all faction characters gain +10% campaign movement; Vlad supplies Castle Drakenhof unique-building access, the starting Kiss condition, and Isabella's Hero form.
- **Sylvania with Isabella selected:** Vampire Hero capacity is +3 and their weapon strength is +25%; Isabella supplies the same unique-building access and starting Kiss condition, plus Vlad's Hero form.

These are start-role/faction effects. They do not grant the other factions the named Legendary Lord, alternate partner form, or faction-specific script.

### Mannfred's Books of Nagash

**Applies only to:** human-controlled The Drakenhof Conclave (`wh_main_vmp_vampire_counts`). AI Mannfred has no independent Book setup or fallback collection path.

Mannfred receives eight numbered Book missions. In single player, four capture objectives—Lahmia, Skavenblight, Karak Eight Peaks, and the White Tower of Hoeth—and four rogue armies—Black Creek Raiders, Eyes of the Jungle, Dwellers of Zardok, and Pilgrims of Myrmidia—are randomly assigned without replacement to reward numbers 1–8 each campaign. The reward attached to a number is stable, but its map objective is not. Multiplayer uses a fixed list: Altdorf, Hexoatl, Karaz-a-Karak, the White Tower, and the same four rogue armies. The first eligible participant creates the shared rogue forces, and when one eligible human completes a numbered mission the matching mission is failed for other eligible humans.

Completion adds a saved count and permanent reward bundle; Books are not transferable items and have no loss, theft, or recapture lifecycle. Book 9 is available only to Arkhan and is failed for Mannfred. Book 7's first acquisition additionally grants **3 Blood Kisses** once; changing its Museum state does not grant them again.

The eight base rewards are:

1. -25% agent-action cost, +5% action success, +1 all-Hero capacity.
2. +15% trade tariffs; the human turn also reveals regions containing gold, gems, or marble.
3. Sandstorm immunity; after sacking or occupying a settlement, a five-turn +10% local-force replenishment bundle and five-turn regional land storm.
4. -1 wound-recovery turn, +2 general recruit rank, -10% general recruitment cost.
5. -10% all-unit recruitment cost, -5% upkeep, +1 local recruitment capacity.
6. +1 Necromancer capacity, province-wide Necromancer recruitment permission, +7 Winds reserve capacity.
7. +10% research, plus the one-time Kiss grant above.
8. Commandments: Evocation +1 recruit rank; Foster -5% construction cost, +10 growth, and +1 Vampiric corruption; Harvest +3% income; Repress +2 control.

If the faction owns Castle Drakenhof and has the Malevolent Museum building, acquired rewards change to studied versions. The condition is rechecked on building completion, delayed mission completion, and faction-round start. Removing the Museum while Mannfred still owns Drakenhof swaps studied rewards back to base; restoring the owned-region/building condition reapplies studied versions. **Losing Drakenhof does not reliably revert them:** the installed script checks the new region owner's bundles before attempting removal from Mannfred, so studied bundles can remain on Mannfred after region loss. Studied values become: Book 1 -50%/+10%/+2; Book 2 +30%; Book 3 +20% replenishment; Book 4 -2 turns/+4 rank/-25% cost; Book 5 -20% recruitment/-10% upkeep/+2 capacity; Book 6 +2 Necromancer capacity/+15 Winds; Book 7 +20% research; and Book 8 Evocation +1 rank and +1 capacity, Foster -10% construction, +20 growth, and +1 Vampiric corruption, Harvest +5% income, Repress +4 control.

### Sylvania's Vlad/Isabella role choice

**Applies only to:** Sylvania (`wh_main_vmp_schwartzhafen`).

The frontend offers Vlad or Isabella as faction leader. Selecting Vlad instantiates Vlad as the Legendary Lord and Isabella as a unique Hero; selecting Isabella reverses those roles. The Hero form is hidden from ordinary recruitment, is not auto-generated through the recruitment UI, has unique cap 1, and is permitted only to Sylvania. There is no later conversion listener and no second Legendary-Lord recruitment unlock: the chosen roles remain fixed for that campaign.

When the pair fight in the same battle as army/reinforcing partners, Undying Love gives the general +15 melee attack and +15 melee defence. A wound uses ordinary convalescence and preserves the forms. Confederating a surviving Sylvania can transfer the instantiated characters in their current roles, but does not convert the Hero to a Lord. Destroying Sylvania or defeating either partner provides no bespoke defeated-Lord recruitment route. AI Sylvania follows its campaign start-position leader rather than receiving the human frontend choice.

### Kemmler and Krell

**Applies only to:** Heinrich Kemmler in The Barrow Legion (`wh2_dlc11_vmp_the_barrow_legion`).

Krell is not a campaign Hero. Kemmler's innate `Wanderer` enables the baseline Lord of Undeath battle summon. The normal summon has a 144-second Unbinding phase. `Eternal Bastion`, available at Kemmler rank 11, disables the preceding degradation state and enables the final summon version; that version persists for the rest of the battle. Earlier progression can extend the Unbinding phase to 288 seconds, while `Perpetual Regeneration` changes combat/regeneration behavior without creating a campaign agent.

Because Krell is a summoned battle unit, unbinding or defeat gives him no campaign death, wound, convalescence, capacity, cost, or replacement state. Kemmler can use the appropriate summon again in a later battle. The remaining skill-node values are left to Kemmler's character catalog.

### Character acquisition, diplomacy, and loss boundaries

**Applies to:** all four playable factions unless narrowed below.

Ordinary same-subculture confederation can absorb a surviving Vampire Counts faction and its currently instantiated characters. No Vampire Counts-specific system recruits a Legendary Lord merely by defeating that Lord or destroying the faction, and the shared installed legendary-character controller has no Vampire Counts eligibility branch.

The Red Duke is campaign-mapped but permitted for recruitment only to non-playable Mousillon, not to these four factions. No shared mission, defeat unlock, or direct playable-faction recruitment route assigns him. Ordinary confederation transfers characters that actually exist in the target faction, but the retained installed relations did not establish a current Red Duke start instance; this guide therefore does not advertise him as a guaranteed Mousillon-confederation reward. Kevon Lloydstein has low-level permission records but is hidden, not auto-generated, absent from campaign-agent and unique-agent mappings, and has no installed acquisition mission or script; he is not a playable-faction recruit route.

### Immortal Empires victory routing

**Applies to:** human-controlled factions. These are victory-mission conditions, not AI progression mechanics.

The shared death-alignment layer uses 30/60 occupied, looted, razed, or sacked settlements. The ordinary Vampire Counts subculture route also uses control of 13 named Empire provinces and resolution of Reikland/Karl Franz through the objective's elimination/confederation-valid state. Faction-specific objectives add or replace material as follows:

- **The Drakenhof Conclave:** short—destroy Khemri, Cult of Sigmar, and Chevaliers de Lyonesse and control the Land of the Dead. Its long listener requires seven completed Bloodline awakenings and control of Broken Teeth, Crater of the Waking Dead, Great Mortis Delta, Marshes of Madness, Eight Peaks, and the Plain of Bones. Mannfred has `no_subculture_objective=true`; collecting eight Books is **not** the long-victory trigger.
- **The Barrow Legion:** eliminate Argwylon and control Bastonne, Forest of Chalons, and Carcassonne.
- **Sylvania:** control Northern Sylvania, Southern Sylvania, and Altdorf.
- **Caravan of Blue Roses:** eliminate the Poxmakers of Nurgle and control Nagashizzar.

The installed Vampire Counts narrative loader is empty for this race, so it adds no separate Realm-of-Chaos or tutorial campaign progression to these four IE starts.

## Faction coverage

- **The Drakenhof Conclave** (`wh_main_vmp_vampire_counts`): all race-wide Bloodline, Raise Dead, Dead Rise Again, corruption/occupation, and climate rules; Mannfred start traits; human-only Books and Malevolent Museum; Mannfred-specific IE victory route.
- **Sylvania** (`wh_main_vmp_schwartzhafen`): all race-wide systems and base climate profile; human Vlad/Isabella frontend choice, fixed alternate Hero role, Undying Love, and start-dependent faction traits; Sylvania-specific victory route.
- **The Barrow Legion** (`wh2_dlc11_vmp_the_barrow_legion`): all race-wide systems with mountain-suitable/jungle-unsuitable climate; Kemmler faction traits and personal living-territory protection; Krell's summon-only lifecycle; The Barrow Legion victory route.
- **Caravan of Blue Roses** (`wh3_main_vmp_caravan_of_blue_roses`): all race-wide systems with magical-forest/mountain-suitable and jungle-unsuitable climate; Ghorst Zombie/Skeleton poison, replenishment, Corpse Cart/Mortis Engine Lesser Raise Dead, and local Zombie-pool traits; Ghorst victory route.

## Evidence register

### Project catalogs reviewed first

- `data/faction_guides/TASK_A_PROMPT.md`, `data/faction_guides/TASK_B_PROMPT.md`, and `data/faction_guides/RESEARCH_SPEC.md` — authoritative scope, independent-audit boundary, selection rule, evidence hierarchy, and validation contract.
- `data/economy/README.md`, `data/economy/faction_index__wh3__8.1.1.csv`, and all four exports under `data/economy/factions/vampire_counts/` — playable-faction boundary and normalized building/economy coverage.
- `data/unit_stats/README.md`, `data/unit_stats/normalized/vampire_counts__wh3__8.1.1__ultra.csv`, typed lookup files, and source-export localization — roster permissions, unit/ability records, campaign vocabulary, and catalog boundary.
- `data/skill_trees/README.md`, `data/skill_trees/character_index__wh3__8.1.1.csv`, and all 22 indexed Vampire Counts character exports — ordinary skill coverage, alternate Vlad/Isabella forms, Bloodline Lords, Red Duke, and Kevon Lloydstein records.

### Installed patch 8.1.1 evidence through locked read-only RPFM

All live installed-file requests were serialized through `scripts/rpfm-call-locked.ps1`; operations requiring the merged vanilla packs used literal `$CA`. No game pack was edited or saved.

- `script/campaign/main_warhammer/wh2_vampire_bloodlines.lua` — starting/gain triggers, ritual completion, Bloodline Lord spawning, Von Carstein unit-pool accounting (including the multi-entry counter defect), saved state, and AI priorities.
- `script/campaign/wh2_dlc09_books_of_nagash.lua`, `wh2_dlc09_books_of_nagash_locations.lua`, and `wh2_dlc09_books_of_nagash_effects.lua` — human eligibility, SP/MP objectives, competition, saved Book state, reward application, one-time Kiss grant, Museum swaps, and the region-loss removal defect.
- `script/campaign/main_warhammer/victory_objectives.lua` and the empty Vampire Counts narrative loader under `script/campaign/_narrative/races/` — IE faction objective routing, human listener, and absence of another campaign branch.
- `db/campaign_group_pooled_resources_tables/data__`, `campaign_group_rituals_tables`, `rituals_tables`, `resource_cost_pooled_resource_junctions_tables`, `ritual_payload_effect_bundles_tables`, and `effect_bundles_to_effects_junctions_tables` — Kiss initialization, 3/6/12 costs, capacities, Bloodline/Museum rewards, and playable-faction start traits.
- `db/campaign_features_tables/data__`, `campaign_variables_tables`, `mercenary_pools_tables`, `mercenary_pool_to_groups_junctions_tables`, `mercenary_unit_groups_tables`, `vampire_mercenary_set_junctions_tables`, and `regions_vampire_mercenary_pools_junctions_tables` — global-recruitment flag, Raise Dead pool, famous-site thresholds/scaling, Dead Rise Again inputs, and captive replenishment feature.
- Campaign attrition, faction-immunity, climate, occupation-option, occupation-effect, faction-to-subtype, unique-agent, frontend-leader, unit-ability, special-ability-phase, and trait/effect relations — territory damage/immunity, current settlement choices, climate overrides, Vlad/Isabella roles, faction traits, Krell's battle-only form, and unavailable character exclusions.
- Reverse-search anchors included every playable faction key; Mannfred, Vlad, Isabella, Kemmler, Ghorst, alternate Hero, Bloodline Lord, Red Duke, and Kevon subtype; `wh_main_feature_vampire_counts`; `vmp_blood_kiss`; all Bloodline rituals; all numbered Book missions/rewards; and distinctive `vmp`/`vampire` installed scripts and localization.

### Web grounding and vocabulary discovery

- [Creative Assembly: Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes) — official installed-patch context and pending-cost Raise Dead fix.
- [Creative Assembly: Hotfix 8.1.1](https://community.creative-assembly.com/total-war/total-war-warhammer/forums/7-total-war-warhammer/threads/14865-total-war-warhammer-iii-hotfix-8-1-1) — official snapshot confirmation.
- [Vampire Counts overview](https://totalwarwarhammer.fandom.com/wiki/Vampire_Counts), [Blood Kiss](https://totalwarwarhammer.fandom.com/wiki/Blood_Kiss), [Raise Dead](https://totalwarwarhammer.fandom.com/wiki/Raise_Dead_(mechanic)), [Books of Nagash](https://totalwarwarhammer.fandom.com/wiki/Books_of_Nagash), [The Drakenhof Conclave](https://totalwarwarhammer.fandom.com/wiki/The_Drakenhof_Conclave), [Sylvania](https://totalwarwarhammer.fandom.com/wiki/Sylvania), and [The Barrow Legion](https://totalwarwarhammer.fandom.com/wiki/The_Barrow_Legion) — secondary discovery vocabulary and omission checklist only; operative claims were checked against installed evidence.
- [Honga: Caravan of Blue Roses](https://www.honga.net/totalwar/en/warhammer3/factions/wh3_main_vmp_caravan_of_blue_roses) and current Reddit/Steam help threads were used as independent omission checks for faction-trait wording and common confusion about Raise Dead pools, Bloodline Lords, corruption, and Vlad/Isabella roles; precise operative claims were still checked against installed relations and localization.
- Creative Assembly's post-snapshot Neferata/9.0 announcement was checked and excluded because it postdates build 24237342.

### Evidence limitations and exclusions

- The exact corruption script was decoded successfully in the independent audit. Its 50/75/100 model-safe building-context dummy bundles do not expose the engine's territory-state threshold or prove a battle-site corruption multiplier, so neither is invented.
- Exact trait/effect joins and current installed localization close Ghorst's poison/Lesser Raise Dead applicability and Kemmler's personal living-territory immunity; neither effect is generalized beyond its installed targets.
- Installed variables expose famous-site and Dead Rise Again inputs and bounds, but not a complete executable rounding/clamping formula. Only the retained inputs, thresholds, and distinction between the systems are stated.
- Raise Dead relations expose initial faction/province entries and group maxima, but the final panel combines applicable pools. The guide states the relations separately instead of promising an unsafely summed opening count.
- The enslave-captives replenishment feature is explicit, but its native numeric result was not exposed; no percentage is asserted.
- Generic battle advice, crumbling/binding, spell use, army composition, unit rankings, ordinary technologies, building effects, unit stats, abilities, mounts, character skills, generic Supply Lines, and generic diplomacy are excluded unless they define one of the campaign exceptions above.
