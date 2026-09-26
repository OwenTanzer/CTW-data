# Slaanesh campaign systems

> **9.0 compatibility:** This is historical 8.1.1 prose. Read [the compatibility notes](../COMPATIBILITY_9.0.md) before applying it to the current database.

> **Scope:** *Total War: WARHAMMER III* | patch **8.1.1** | Steam build **24237342**  
> **Race:** Slaanesh | `race_slug=slaanesh` | **Playable factions:** 3

## Catalog boundary

Ordinary technology nodes, costs, prerequisites, effects and direct unlock junctions are now owned by `data/technology_trees/`. Read its audit before interpreting conditional variants; the scripted campaign rules below remain relevant where static records do not resolve runtime behavior.

The economy CSVs already describe constructible building levels, base construction costs and times, prerequisites, and standardized outputs for all three playable factions. The normalized unit files and typed lookups describe the roster, faction permissions, unit statistics, abilities, and attributes. The character files contain the complete skill trees for N'Kari, the Masque, Dechala, Styrkaar, and every generic Slaanesh character. Those rows are not repeated here. This guide records pooled-resource loops, campaign actions, foreign-slot lifecycle, acquisition and replacement rules, human/AI branches, and faction-specific systems needed to interpret those catalogs.

## Mechanically relevant material not captured elsewhere

### Gifts of Slaanesh

**Applicability:** all three playable factions, with a different tag record for each campaign.

An enemy character receives a Gift of Slaanesh when its army loses to a Slaanesh Lord or when a Slaanesh Hero successfully targets it. The tag follows the character rather than a region. A gifted Lord or embedded Hero removes it by defeating a Slaaneshi army; a gifted Hero can also remove it by successfully acting against a Slaaneshi target. The Gift is also removed if the faction which applied it is destroyed. The current faction-tag records exclude Slaanesh characters as recipients.

Every current Gift applies +5 Slaanesh corruption in the gifted character's province. Its other outputs depend on the giver:

- N'Kari's Gift adds 3 Seductive Influence to the target faction, reduces the cost of Seduce Units against that character's army by 10%, and supplies 5 Devotees per turn to N'Kari. The upgraded faction effect supplies 25 instead of 5.
- The Masque's Gift has the same -10% Seduce Units cost and supplies 5 Devotees per turn, or 25 with the upgraded faction effect, but it does not add N'Kari's Seductive Influence.
- Dechala's Gift reduces the Thrall cost of corrupted units in that character's army by 10% and supplies 5 Thralls per turn, or 25 with the upgraded faction effect.

The upgrade sources themselves are technology/skill effects represented in the technology-tree and character datasets; the tag's trigger, persistence, removal, and faction-specific outputs are the uncataloged relationships recorded here.

### N'Kari: Devotees and Seductive Influence

**Applicability:** `wh3_main_sla_seducers_of_slaanesh`, except where the following Devotee actions explicitly include the Masque.

N'Kari and the Masque use Devotees; Dechala is explicitly excluded from the shared Devotee-income script and uses Thralls instead. On a successful Slaanesh settlement attack followed by looting/occupation or sacking, the saved Devotee payout is:

`50 + (0.2 × current province control) + (0.01 × region GDP)`

Each raiding army receives Devotees at its faction-turn start according to:

`(5 + 0.01 × region GDP + 0.2 × province control) × (0.05 × units in the army)`

Only a positive result is paid. Both formulas apply to N'Kari and the Masque, not Dechala.

Seductive Influence itself is **N'Kari-only** in the installed campaign feature and faction-set records. Eligible targets are the Kislev, Cathay, Empire, Bretonnia, Norsca, Beastmen, Wood Elf, High Elf, and Dark Elf subcultures, subject to an explicit exclusion list for unsuitable factions. Its scripted recurring inputs are concrete:

- signing a positive diplomatic deal adds 20 immediately; a treasury gift of at least 500 instead adds `min(round(gift / 100), 50)`;
- each active non-aggression pact, trade agreement, defensive alliance, military alliance, or vassal relationship adds 5 per turn;
- a battle involving the target faction adds 10;
- each region the target owns adds 10 influence capacity and reduces its resistance by 1 per turn;
- Gifts add the separate +3 faction effect described above. Vassalage forces the target's influence state to its maximum.

At maximum influence N'Kari may use **Force Vassalisation** on an eligible non-human faction for 300 Devotees with a 10-turn cooldown. The ritual target explicitly excludes human factions.

Patch 8.1 also adds **Convert Lord** to N'Kari. It costs 500 Devotees, has a 20-turn cooldown, and targets a foreign generic Lord in the same province once its faction is at least 50% Seduced. The target general is killed; a Slaanesh Chaos Lord and the remaining army appear near N'Kari. The script removes `ceil(25% × target unit count)` of the army and replaces the same count from a weighted Marauder/Chaos Warrior pool. Legendary Lords are excluded by the target definition. This is conversion by replacement, not a persistent ownership loan.

### Vassals of Slaanesh

**Applicability:** all three playable factions; the Thrall income below is Dechala-only.

The installed diplomatic relationship records give every vassal of a Slaanesh faction immunity to Chaos attrition and apply a paired, engine-facing forced-vassalage state switch. The records do not expose a safe broader UI interpretation for that hidden flag pair. If Dechala is the master, she also receives **25 Thralls per vassal per turn**. N'Kari's separate rule that vassalage sets Seductive Influence to its maximum remains as described above.

### Devotee and Thrall campaign actions

**Applicability:** N'Kari and the Masque pay Devotees; Dechala has cloned actions that pay Thralls.

The three Pleasurable Acts target one owned region, cost 100/200/100 of the applicable resource, block another Pleasurable Act in the same province while active, and last 5 turns:

| Act | Cost | Current effect |
|---|---:|---|
| Pleasure Arena | 100 | +20% province income and +12% research rate; performing the standard N'Kari/Masque ritual also immediately reduces province control by 50. |
| Pleasure Hunt | 200 | +2 recruit rank, -25% recruitment cost, and +20 control in the province. |
| Pleasure Party | 100 | +50 Growth and +5 control in the province. |

Dechala's three rituals use the same payload bundles but spend Thralls. The installed control-reduction listener names only the legacy `wh3_main_ritual_sla_pleasure_arena`; it does not match Dechala's cloned Arena key, so no unsupported -50 control is attributed to Dechala's version.

**Proliferate Cults** costs 1,000 Devotees for N'Kari/the Masque or 1,000 Thralls for Dechala and has a 10-turn cooldown. Completion randomly selects at most three occupied regions belonging to Kislev, Cathay, Empire, Bretonnia, Norsca, Dark Elves, High Elves, or Wood Elves which currently have no foreign-slot manager. It creates the standard cult slot set for N'Kari/the Masque and Dechala's replacement cult set for the Tormentors. If fewer than three regions qualify, it creates fewer cults.

### Disciple Armies

**Applicability:** N'Kari and the Masque. The campaign feature explicitly excludes Dechala.

Summoning a Disciple Army costs 300 Devotees and requires an owned parent army with at least 10 units, in enemy territory with at least 25 Slaanesh corruption. Use applies a 5-turn cooldown to both the summoning Lord and the province. The newly created force receives full action points and pays no ordinary upkeep, but it cannot recruit, replenish, or exchange units; its Lord cannot gain skills or use items. It loses 20 Devotees per turn and suffers continuous Disciple Army attrition unless it is in an area with very high Slaanesh corruption. Its hidden post-battle saving modifier is -999, so destroyed daemon units in it are not restored by Daemon Reforging. The army is therefore a temporary expedition sustained by Devotees and corruption, not a normal recruitable stack.

The installed force record names the `slaanesh_disciples` budget formula and a permitted-unit list, but the engine-side budget calculation is not exposed. Consequently this guide does not repeat the secondary claims that force size equals the parent army plus three, that its Lord copies the summoner's rank, or that unit quality scales by corruption.

The fourth Slaanesh manifestation can create another Disciple Army beside its target army each turn. Those spawned forces receive the same persistent Disciple Army bundle and lifecycle.

### Slaanesh cult network

**Applicability:** all three playable factions. N'Kari and the Masque use `wh3_main_slot_set_sla_cult`; Dechala uses `wh3_dlc27_slot_set_sla_cult_dechala`.

Every cult reveals its region to its Slaanesh owner. A cult building with a positive adjacent-expansion bonus rolls once at its owner's faction-turn start; on success it creates one cult in the first valid adjacent occupied foreign region lacking that faction's foreign-slot manager. Cult discovery and removal remain governed by the foreign-slot discoverability system. Ordinary Slaanesh cults have two building slots; a Cult Magus establishes the corresponding three-slot Magus set with a 100% action result and is consumed by the action.

Completing the shared Cult Magus trial spawns a campaign-only Slaanesh Cult Magus near the settlement and dismantles that trial building. Buildings on the script's one-use list remove the entire cult after their completion effect resolves, including the standard Slaanesh capstone and teleport building, the Masque special building, and Dechala's teleport and special buildings. The special branches are deliberately asymmetric:

- N'Kari's Cult-Magus special gives the host faction 5,000 treasury and adds 200 Seductive Influence to that host faction, then destroys the cult.
- The Masque's special gives the host faction 5,000 treasury and the Accursed Troupe 1,000 Devotees, then destroys the cult.
- Dechala's special gives the host faction 5,000 treasury and the Tormentors 1,000 Decadence, then destroys the cult.

Patch 8.1 also gives the two DLC factions adjusted current cult options whose conditional foreign-slot lifecycle is not captured by ordinary building summaries:

- The Masque's adjusted **Charm Offensive** costs 3 Devotees per turn, plus 1 while host control is above 50 and 1 while local Slaanesh corruption is at least 50. It gives +3 relations with the host and adds +50% host-region GDP for each of those two conditions which is met. Her Magus-only **Ritual of Excess** costs 1,500 treasury, gives the Accursed Troupe 1,000 Devotees and the host 5,000 treasury, then destroys the cult.
- Dechala's adjusted **Charm Offensive** costs 10 Thralls per turn, makes enemy armies in the region begin battles very tired, gives +5 relations with the host, and adds +100% host-region GDP plus another +50% at host control above 50 and +50% at local Slaanesh corruption 50 or higher. Her Magus-only **Ritual of Excess** has no treasury construction cost, gives the Tormentors 1,000 Decadence and the host 5,000 treasury, then destroys the cult.

At new-game start the installed AI-seeding branch gives **AI N'Kari only** two random standard cults near its home region. It does not seed equivalent starting cults for AI Masque or AI Dechala. N'Kari also has a cult-building bonus-value branch which applies a permanent no-replenishment bundle to the host settlement's garrison while that building effect is present; the script removes the bundle when the building or foreign-slot manager is lost. That branch is faction-keyed to N'Kari and does not silently carry over to the Masque.

Separately, Creative Assembly's current [Tides of Torment Q&A](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/88-total-war-warhammer-iii-tides-of-torment-q-a-answers) states that a human Accursed Troupe campaign begins with two pre-placed cults for long-range access. That scenario starting state is official-source-supported but was not exposed by the narrow current startpos relations used here; it is not the AI N'Kari script branch above.

### Unholy Manifestations and the Great Game

**Applicability:** N'Kari and the Masque. The installed group is `wh3_dlc27_main_feature_slaanesh_excluding_dechala`.

All four manifestations have 15-turn cooldowns and base/upgraded records. Availability and selection of the upgraded form are controlled by the Great Game/corruption system; the decoded records do not expose a safe numeric threshold for the engine-side selection.

- **Manifestation I** targets an owned army for 6 turns. Both forms apply 6% army damage through the ritual's damage component. The base form gives +6% campaign movement, charge bonus, speed, and weapon strength; the upgraded form gives +12% to those four values.
- **Manifestation II** targets a qualifying region not owned by the performer; the target excludes ruins, enemies, and existing cult locations. Its 2-turn start payload creates a Slaanesh cult. On completion, the 1-turn base bundle gives +33 Slaanesh corruption, -66 Growth, and 100 Devotees; the upgraded form gives +66 corruption, -132 Growth, and 200 Devotees.
- **Manifestation III** targets an owned army for 4 turns. The base form gives +100% Seduce Units budget and +20% post-battle captives; the upgraded form gives +150% and +40%.
- **Manifestation IV** targets an owned army in enemy territory. The base form lasts 3 turns and applies -66% campaign movement; the upgraded form lasts 5 turns and applies -33%. Both summon a Disciple Army near the target each turn.

Dechala is not a user of these records. The Great Game Lua contains an attempted substitution to `_dechala` ritual keys for manifestations II-IV, and two matching base effect bundles remain in the data, but the current merged `rituals_tables` contains no such ritual records and `campaign_group_rituals_tables` grants no manifestation group to the Tormentors. They are orphan references in this installed snapshot, not usable Dechala actions.

### Daemon Reforging and post-battle captives

**Applicability:** all three playable factions.

When a Daemonic unit is destroyed, Daemon Reforging can return it after battle. The return chance and returned hit-point percentage are separate values. Current Slaanesh-corruption bundles add 2 percentage points to both values in each ten-point band: +2 at corruption 1-10, then +4, +6, and so on through +20 at 91-100. High Winds of Magic adds another +5 percentage points to the return chance. Unit value and other skill/technology effects also feed the engine calculation. Disciple Armies are explicitly excluded as described above. Creative Assembly's [Update 6.0 notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0) describe the system's corruption, Winds, and post-battle inputs.

The shared campaign feature also makes the **Devour Captives** (`enslave`) outcome restore force hit points for Slaanesh. Separate kill outcomes convert captives into faction resources at one resource per five captives: Devotees for N'Kari/the Masque and Thralls for Dechala. Patch 8.1 explicitly extended Devour Captives to Slaanesh Daemon Princes in the current character-upgrade path ([official patch notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes)).

### Generic-lord ascension

**Applicability:** all three factions; only the listed generic subtypes qualify.

At rank 15, an eligible generic Lord who is in a region, is not besieged, and is not the faction leader may be replaced through the ascension system:

- Herald of Slaanesh (Slaanesh or Shadows) becomes the matching Exalted Keeper of Secrets.
- Chaos Lord of Slaanesh, Chaos Sorcerer Lord of Slaanesh, or Chaos Sorcerer Lord of Shadows becomes a Slaanesh Daemon Prince.

A human player receives a dilemma. Accepting replaces the old character at a base target rank of `floor(old rank × 0.5) + 1`, plus any active `char_upgrade_level_preserved_sla` preserved-level bonus; deferring makes the offer eligible again after 10 turns, while refusing is permanent for that character. The new character inherits the old localized name, every trait, all ancillaries, and remaining action points before the old family member is killed. Eligible AI Lords instead make a 25% upgrade roll on each faction turn. This is still a subtype replacement rather than a mount or reversible transformation, but it does **not** discard the character's name, traits, ancillaries, or current-turn movement state.

### Styrkaar of the Sortsvinaer

**Applicability:** all three playable faction keys, with the Slaanesh *Tides of Torment* entitlement required.

The executable acquisition data starts Styrkaar's two-stage chain when the faction leader reaches rank **11**; the adjacent Lua comment which says rank 10 is stale. Completion recruits Styrkaar and grants his three configured ancillaries. His stats and skills remain in the character catalog.

If no eligible human faction has claimed him, the strongest eligible AI faction may receive him from turn 30. The current mission-option relation is too large to justify another full decode after an earlier bounded-filter attempt over-serialized it, so this guide does not invent exact objective counts for the two stages. Rank, faction eligibility, entitlement, stage count, configured rewards, and AI fallback are all directly present in the narrow legendary-character script.

## The Accursed Troupe: the Eternal Dance

**Applicability:** `wh3_dlc27_sla_masque_of_slaanesh`; the system is assigned per army/Lord, not only to the Masque character.

The official [Update 7.0 overview](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/84) describes four Dances with four Movements. The installed implementation exposes **The Burning Bacchanal** (engine category Greed), **The Symphony of Excess** (Envy), and **The Pageant of Pain** (Excess) immediately; **The Final Dance** (Pride) unlocks only after all three have been completed. Each army chooses one Dance and advances its own Tempo through four levels. Levels 1-3 each offer four mutually selected Steps; level 4 unlocks that Dance's final ritual and allows the finished selection to be recorded in the faction Repertoire. Loading a recorded Dance preselects its saved Steps, while a completed record may later be overwritten.

The four Dance themes have distinct always-on army effects:

- **The Burning Bacchanal / Greed:** +3% replenishment.
- **The Symphony of Excess / Envy:** +40% Seduce Units budget and -20% Seduce Units cost.
- **The Pageant of Pain / Excess:** +15% unit experience gain.
- **The Final Dance / Pride:** +20% ancillary drop chance and +3 Winds of Magic power reserve per turn.

Tempo is a per-force resource capped at 3,700. Battles are its principal concrete positive source. The installed resource junction also registers positive factor categories for events, Pleasurable Acts, and Unholy Manifestations, but their exact numeric transactions are not exposed by the decoded relations; no fixed award is inferred. The settlement-occupation resource table contains no Masque Tempo row. Army stances are concrete: Ambush, Channeling, Encamp, and Mustering apply -20/-10/-30/-30 Tempo respectively, while March and Raiding apply +10/+20. At Tempo 4, default stance gives +10% movement, March gives +10% battle speed, and Raiding gives +20% raiding income.

Changing a selected Step at Tempo levels 1/2/3 costs 200/300/400 Tempo. Switching to a different Dance or replacing its general transfers 50% of the current Tempo and applies Dissonance: -50% Tempo gain for a number of turns equal to the current Tempo level, subject to technology modifiers. If the general is killed, the force's Tempo is reset to zero. The script contains a five-turn fatigue matrix, but both calls which would apply natural fatigue are commented out in this build; therefore Tempo does **not** receive the dormant scripted fatigue subtraction described by that matrix.

Completing a Dance once applies a permanent faction Repertoire bundle; each also gives all Lords +5% Tempo gain:

| Completed Dance | Permanent faction result |
|---|---|
| The Pageant of Pain / Excess | +10% raiding, razing, and sacking income. |
| The Symphony of Excess / Envy | -10% construction cost, +5% income from culture buildings, +50 Growth. |
| The Burning Bacchanal / Greed | +5% replenishment, -15% attrition casualties, -1 wound-recovery turn. |
| The Final Dance / Pride | -1 global recruitment duration, -10% recruitment cost, +1 global recruitment capacity. |

The final rituals are not symmetric generic buffs:

- **The Dance of Dunces / Masque of Destruction:** enemy region; 10-turn cooldown. It randomly damages the garrison by 50-80% and awards twice that percentage as Devotees, hence 100-160. It does nothing if somehow pointed at a friendly region.
- **The Path to Nowhere / Masque of Displacement:** ungarrisoned enemy army; 8-turn cooldown. It teleports the target to a random valid nearby location, initially searching 15-30 map units away and expanding the placement search if needed.
- **The Flow of Desire / Masque of Reforging:** enemy army in the same region; 10-turn cooldown. Its one-turn database payload applies Silenced and -100% ammunition. The Lua handler is empty because the operative effect is supplied by the ritual payload bundle; the unrelated dormant 100% daemon-saving bundle is not the live result.
- **The Ending Without End / Masque of Attraction:** enemy army led by a generic Lord in the same province; 20-turn cooldown. The entire force is transferred to the Unholy Pageant rogue faction, its general is replaced by a Herald, and a non-respawning scripted invasion makes it attack other enemies while treating the Accursed Troupe as exempt. The script disables recruitment/maintenance and contains no transfer-back path; the original owner permanently loses the force.

AI Accursed Troupe armies receive a hidden +50% Tempo modifier and automatically select available Step variants. Disciple Army generals are excluded from the AI Step-selection branch. Confederated forces are registered and have Dance locks refreshed when they join the Accursed Troupe.

## The Tormentors: Pillars of Cruelty

**Applicability:** `wh3_dlc27_sla_the_tormentors` only.

Creative Assembly's [Dechala overview](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/82) describes the campaign's three settlement conversions; the installed script and resource records expose their lifecycle:

- **Thrall Camp:** an exploitation settlement with a finite regional Thrall stock. Occupying seeds 1,000 regional Thralls, Loot and Occupy seeds 600, and colonising seeds 400 while costing 400 faction Thralls. Sacking instead awards 250 faction Thralls. Ordinary building drain/output rates are already in the economy catalog.
- **Tormentors' Hold:** the military/recruitment settlement. It does not substitute a second hidden pooled-resource loop for the Thrall Camp stock.
- **Pleasure Palace:** available only in province capitals and paid for with Thralls rather than normal settlement Growth. Establishing tier 1 costs 500 Thralls; upgrades to tiers 2/3/4/5 cost 1,000/2,000/3,000/4,500. Only one Palace at main-chain level 0-2 may exist or be under conversion at a time; reaching level 3 or higher reopens availability for another Palace. Thus Palace capacity expands through development rather than a fixed global hard cap.

The starting home region receives 1,000 regional Thralls and is marked permanent through engine-facing script state on the first tick. An internal ritual listener whose localisation is explicitly marked deprecated can apply the same state to an owned target region. The Lua does not expose the engine consequence of that state, so it is not safe to present this listener as a user-facing action or to infer a particular immunity from depletion.

Region trading has a specific anti-exploit rule. A newly traded-in region receives 1,000 regional Thralls. If Dechala previously traded that same region away and later receives it through diplomacy, its stock is regenerated as `floor((1000 / 30) × turns absent)`, with absence capped at 30 turns, and its saved trade entry is then cleared. It is not restored to 1,000 immediately unless it has been absent for the full 30 turns.

### Thralls, Decadence, and Caresses

Thralls replace Devotees as Dechala's ritual and special-unit currency. Besides settlement exploitation, Gifts supply 5 per turn (25 when upgraded), the kill-captives outcome converts one Thrall per five captives, and each current vassal supplies 25 per turn. AI Dechala receives an additional hidden 220 Thralls per turn. That AI support is not a human income source.

Decadence is generated by Pleasure Palace infrastructure and by battle result. The scripted battle transactions are +100/+200/+300/+400 for pyrrhic/close/decisive/heroic victories and -50/-100/-150/-200 for valiant/close/decisive/crushing defeats.

Dechala's three Caresses target an owned army, each last 5 turns, and their shared block effect prevents stacking another Caress on that force during the duration:

| Caress | Thralls | Current army result |
|---|---:|---|
| Desire | 125 | +50% Lord/Hero campaign experience and +50% unit experience gain. |
| Subtlety | 225 | Stalk and +50% ambush-attack success chance. |
| Eagerness | 350 | +4 armour-piercing weapon damage and the Wayfarer campaign/battle ability. |

Using the three tiers of **In Praise of Slaanesh** consumes 200/400/600 Thralls. Pleasure Palace wall-chain effects make the corresponding army ability available to armies in adjacent provinces; it summons a Giant Spawn of Slaanesh. The building unlock and ordinary ability statistics remain in their respective catalogs.

### Tormentor's Tributes

For a human Tormentors campaign, Marks of Cruelty unlock when current Decadence first reaches 200. There are six Marks of Vindictiveness—Ecstasy of Pain, Heed the Lash, Slothful Indolence, the Scent of Despair, Coy Denial, and Supreme Ascendancy. Each purchase costs 50 Decadence and grants a bundle of three pre-battle consumable marks. Upgrading a Mark chain is permanent: level II costs 250 Decadence and level III costs 500. Upgrading improves future purchases; it does not make the consumable battle mark permanent. The official overview confirms both the three-per-purchase bundle and permanent upgrade model.

AI Dechala does not use the human 200-Decadence unlock listener. It unlocks after obtaining one complete province or at turn 20, whichever comes first, then upgrades one random not-yet-processed Mark chain every 5 turns.

There are also six **Opulent Gifts**. Each is a unique Slaanesh ancillary ritual costing 500 Decadence and has cooldown -1, making it a one-time purchase. The six **Exquisite Spoils** each cost 1,000 Decadence and apply a permanent faction bundle. Their operational campaign results are:

- +25% experience for Dechala and -33% attrition casualties for her army;
- +2 global recruitment capacity;
- +15% income from all sources;
- +5% Lord and Hero experience in owned provinces;
- +1 allied-recruitment point, +50% Allegiance gain, and +1 maximum tier for corruption-recruited units;
- +2 Slaanesh corruption and +2 control in owned provinces.

Each Spoil also enables or alters the matching Pleasure Palace chain named in its effect. Those constructible building rows and their standardized outputs remain in the economy catalog. Patch 8.1 fixed Opulent Gifts remaining usable while Dechala was wounded or after an unrelated Hero action ([official notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes)).

### Daemonic Attraction

Researching `wh3_dlc27_tech_sla_daemonic_attraction` removes the event restriction from seven Dechala-specific daemon variants: Daemonettes, Chaos Furies, Fiends, Heartseekers, Pleasureseekers, an Exalted Seeker Chariot, and a Keeper of Secrets. They are instantly recruited from a bounded pool for Thralls; their installed unit-specific costs range from 75 to 450 Thralls. Pool capacities, individual unit permissions, and ordinary unit data are cataloged elsewhere. AI Tormentors do not wait for normal research behavior: on turn 30 the campaign-AI script researches this technology if necessary and unlocks the variants.

Each attracted daemon adds the following modifier to every non-Daemonic unit in its army: Daemonettes +3 Leadership; Chaos Furies +4 charge bonus; Fiends +3% weapon strength; Heartseekers +3% speed; Pleasureseekers +3% missile-block chance; Exalted Seeker Chariots -5% vigour loss; Keepers of Secrets +3% physical resistance. These values stack once per matching attracted unit.

Whenever one is trained or disbanded, armies merge, or a battle completes, the script rebuilds the army's permanent Daemonic Attraction bundle by counting every qualifying unit and reapplying its effect list once per copy. The bonuses therefore scale with the actual attracted-daemon composition and disappear when those units leave the army; they are not a one-time technology reward.

The human-only eight-stage Dechala narrative begins from turn 2: (1) establish a Pleasure Palace; (2) upgrade it or perform the Exquisite Import; (3) establish a Palace in a different climate; (4) raise five generals to rank 10; (5) defeat three Cathayan armies, unless no valid Cathayan target remains; (6) complete the first quest battle; (7) abandon a region; and (8) complete the final quest battle. Stages 1-3 award 500 Thralls each, stages 4-5 award 1,000 each, and stage 7 awards 1,500; each of those six stages also awards 1,525 treasury. After stage 6 a four-choice dilemma charges 10,000 treasury for whichever option is selected. After stage 8 a one-choice finale applies the permanent Fruits of Torment bundle. Following Patch 8.1, that bundle gives +2 Daemonic Attraction capacity, shortens pool replenishment, and reduces corrupted-unit cost. The AI does not run this mission listener.

## Faction coverage

- **Seducers of Slaanesh** — `wh3_main_sla_seducers_of_slaanesh`; Realm of Chaos and Immortal Empires: faction-specific Gifts; Devotee capture/raiding income, Pleasurable Acts, Proliferate Cults and gated Disciple Armies; N'Kari-only Seductive Influence, forced vassalisation and Convert Lord; standard/Magus cults with the N'Kari special, AI starting-cult branch, and garrison-replenishment suppression; Unholy Manifestations; shared vassal effects; Daemon Reforging/captive outcomes; preserving generic ascension; Styrkaar chain and AI fallback.
- **The Accursed Troupe** — `wh3_dlc27_sla_masque_of_slaanesh`; Immortal Empires only: Masque-specific Gifts; shared Devotees, Acts, Proliferate Cults, gated Disciple Armies, adjusted standard/Magus cults and Unholy Manifestations, but no Seductive Influence; official two-cult human start; Eternal Dance/Tempo, Repertoire, four asymmetric finales, AI Tempo/Step behavior and confederation integration; shared vassal effects; Daemon Reforging/captive outcomes; preserving generic ascension; Styrkaar eligibility.
- **The Tormentors** — `wh3_dlc27_sla_the_tormentors`; Immortal Empires only: Dechala-specific Gifts and adjusted cult sets; Thralls instead of Devotees; no Seductive Influence, Disciple Army action, or usable Unholy Manifestations; shared vassal effects plus 25 Thralls per vassal; Pillars of Cruelty settlement conversions and Palace capacity lifecycle; traded-region stock regeneration; Decadence, Caresses, In Praise of Slaanesh, Tormentor's Tributes, AI resource/turn-30 Attraction unlock behavior, Daemonic Attraction, and exact human-only narrative finale; Daemon Reforging/captive outcomes; preserving generic ascension; Styrkaar eligibility.

## Evidence register

### Project material consulted

- `README.md`; `data/economy/README.md`; `data/unit_stats/README.md`; `data/skill_trees/README.md`.
- `data/economy/faction_index__wh3__8.1.1.csv` and all three `data/economy/factions/slaanesh/*.csv` files.
- `data/economy/source_exports/db/*`, especially building/resource relations used to keep ordinary rows outside this guide.
- `data/unit_stats/normalized/slaanesh__wh3__8.1.1__ultra.csv`, Slaanesh roster/ability lookups, and relevant source-localisation exports.
- `data/skill_trees/character_index__wh3__8.1.1.csv` and all 16 files under `data/skill_trees/characters/slaanesh/`.
- Pilot-form guides `data/faction_guides/races/bretonnia.md`, `chaos_dwarfs.md`, and `tzeentch.md`.

### Installed vanilla files and stable records

Read through the locked, read-only RPFM workflow against the merged vanilla CA packs (`PackFile`, `pack_key=$CA` where required):

- `script/campaign/wh3_campaign_slaanesh_devotees.lua` — settlement/raiding formulas, Pleasurable Acts control listener, Proliferate Cults target list and cap, Disciple Army initialization, and N'Kari-only cult garrison suppression.
- `script/campaign/wh3_campaign_slaanesh_seductive_influence.lua` — eligible subcultures/exclusions, influence inputs/resistance, forced vassalisation, and N'Kari Convert Lord replacement logic.
- `script/campaign/wh3_campaign_daemon_cults.lua` — all three faction/slot-set mappings, AI N'Kari cult seeding, reveal/adjacency spread, one-use destruction, Cult Magus, and three faction-specific special branches.
- `script/campaign/wh3_campaign_great_game.lua`, `wh3_campaign_unholy_manifestations.lua`, and `_narrative/races/wh3_narrative_great_game.lua` — Great Game selection, standard Slaanesh group behavior, Dechala exclusion, and the orphan `_dechala` substitution references.
- `script/campaign/wh3_campaign_greater_daemons.lua` and `wh3_campaign_character_upgrading.lua` — rank-15 subtype mappings, eligibility, replacement-rank calculation, name/trait/ancillary/action-point inheritance, human dilemma lifecycle, and AI 25% roll.
- `script/campaign/wh3_dlc27_eternal_dance.lua` — faction applicability, all four Dance records, Tempo switching/Dissonance, Repertoire completion, final-ritual handlers, AI behavior, confederation registration, saving/loading, and commented-out fatigue application.
- `script/campaign/wh3_dlc27_dechala_settlement_exploitation.lua`, `wh3_dlc27_dechala_decadence.lua`, `wh3_dlc27_dechala_marks_of_cruelty.lua`, `wh3_dlc27_dechala_daemonic_units.lua`, `wh3_dlc27_dechala_daemonic_influence.lua`, and `wh3_dlc27_dechala_narrative.lua`.
- `script/campaign/wh3_campaign_ai.lua` — Dechala's hidden AI Thrall support and turn-30 Daemonic Attraction research/unlock.
- `script/campaign/wh3_main_legendary_characters.lua` — Styrkaar rank, eligibility, entitlement, stages, rewards, and AI fallback.
- `db/campaign_features_tables/data__`, `campaign_groups_tables/data__`, `campaign_group_rituals_tables/data__`, `rituals_tables/data__`, `ritual_payload_effect_bundles_tables/data__`, `resource_cost_pooled_resource_junctions_tables/data__`, and `effect_bundles_to_effects_junctions_tables/data__`.
- `db/faction_character_tags_tables/data__`, `campaign_group_faction_character_tags_tables/data__`, `campaign_effect_list_effect_junctions_tables/data__`, and `text/db/faction_character_tags__.loc`.
- `db/agent_actions_tables/data__`, `action_results_additional_outcomes_tables/data__`, `campaign_group_agent_action_foreign_slots_tables/data__`, and `slot_set_items_tables/data__` — Cult Magus 100% establishment, consumption, faction mappings, and ordinary/Magus slot counts.
- `db/diplomatic_relationship_effects_tables/data__`, `campaign_effect_list_effect_junctions_tables/data__`, and `pooled_resource_factor_junctions_tables/data__` — Slaanesh-vassal state, Dechala's +25 Thralls per vassal, resource caps/factors, and Tempo source categories.
- `db/campaign_group_post_battle_looted_pooled_resources_tables/data__` and `campaign_group_settlement_occupation_looted_pooled_resources_tables/data__` — battle-resource formulas and the absence of a Masque occupation-Tempo row.
- `db/campaign_to_agent_subtypes_tables/data__` — N'Kari dual-campaign and Masque/Dechala Immortal-Empires-only availability.
- `db/cooking_recipes_tables/data__` and `cooking_recipe_chains_tables/data__` — six active Mark chains, three consumables per purchase, and tier-upgrade costs.
- `db/campaign_post_battle_captive_options_tables/data__` — faction-specific kill outcomes and shared enslave/Devour outcome.

### Web grounding

- Creative Assembly, [Patch 8.1 release notes](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/101-total-war-warhammer-iii-patch-8-1-release-notes).
- Creative Assembly, [Tides of Torment: Meet Dechala](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/82).
- Creative Assembly, [Update 7.0 / the Masque and Eternal Dance](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/84).
- Creative Assembly, [Update 6.0 / Daemon Reforging](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/53-total-war-warhammer-iii-update-6-0-0).
- Creative Assembly, [Tides of Torment Q&A](https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/88-total-war-warhammer-iii-tides-of-torment-q-a-answers).
- Steam, [Dechala — Tides of Torment](https://store.steampowered.com/app/3450980/Total_War_WARHAMMER_III____Tides_of_Torment/).

Community faction/mechanic pages and the long-form Steam N'Kari guide were used as omission checklists only. Exact applicability, costs, scripts, and installed values above come from current vanilla game records.

### Evidence limitations

- The RPFM endpoint was initially unavailable and was restarted from the bundled read-only server. Exact decode of the Eternal Dance script returned the current `data_script.pack` file and matched the narrow extract used for line-oriented review. No game pack was edited or saved.
- One attempted filtered decode of the high-cardinality mission-option junction serialized far more data than intended. It was not repeated. Consequently, Styrkaar's exact two mission objectives are deliberately not asserted; all other reported Styrkaar lifecycle facts come from the narrow current Lua.
- Two high-cardinality DB decodes reset the local RPFM endpoint. Neither was retried; the endpoint was restarted hidden and research pivoted to smaller exact relations, source exports, and narrow scripts. A global-search response also appended an unrelated merged-pack file inventory; it was reduced to exact matches and no unrelated path was used as evidence.
- Base and upgraded manifestation records are exposed, but the numeric engine transition selecting the upgraded form is not. No unsupported threshold is supplied.
- Dechala's `_dechala` manifestation keys are referenced by Lua but absent from the current ritual and group tables. The guide reports that mismatch rather than inferring functionality from dead keys.
- The Eternal Dance contains dormant natural-fatigue data and an unused daemon-saving bundle for a ritual whose live payload is Silenced/-100% ammunition. The data registers event/Pleasurable-Act/manifestation Tempo factors but does not expose their exact numeric transaction; operative listeners and payload relations take precedence over comments, placeholder localisation, unused constants, and invented values.
- The current CA Q&A supplies the human Masque two-cult starting state, while the narrow installed startpos relations used here did not expose those placements. It is reported as official-source-supported scenario setup and kept distinct from AI N'Kari's executable cult-seeding branch.
