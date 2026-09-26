# Faction technology trees

Authoritative technology dataset for WARHAMMER III patch **9.0**, executable
**9.0.0**, Steam build **25507028**. Start with `dataset_manifest.json`,
`schema_inventory__v2.csv`, and `faction_index__wh3__9.0.csv`. Each of the 109
playable factions has one self-contained long-form CSV. Filter `record_type`
and `variant_key`; blank values are unknown/not applicable, never zero.

## Active trees and precedence

`source_exports/node_set_precedence.json` is the explicit selection model.
Nine explicit overrides replace matching generic sets. The seven historical
rules retain their prior gameplay review; Sigvald adds official 9.0 rework
corroboration, while Glottkin is a source-reviewed interpretation of the same
faction-over-generic model with runtime not observed. Read each rule's
interpretation_status and the review in docs/development/update-9.0/technology-selectors.md.
Both DB selector rows, their locations and hashes remain available. The binary
engine selector itself is not decoded.
Unreviewed overlapping sets fail the build. Source fallback sets remain available
for provenance but are not emitted as active variants of those factions.

The Changeling has exactly two variants: `wh3_main_chaos` (51 nodes) and
`wh3_main_combi` (57 nodes). Campaign identity is joined through
`campaigns.script_path` to the Changeling's literal `rift_regions` map and its
`cm:get_campaign_name()` selection. Common nodes are repeated inside each
legitimate variant. There is no blank campaign variant. Other unqualified trees
use `all_campaigns` in their variant key, with a blank DB campaign selector.
The Daemon Prince has a file with explicit no-research-tree evidence and no nodes.
Nagash retains the empty `nag_tech` selector with zero technology nodes. His Black
Pyramid progression is outside ordinary technology normalization; an empty
selector does not mean that his faction has no progression mechanics.

## Rows and scripted mechanics

Typed rows preserve nodes, layout, tabs/groups, technology definitions, points,
resource costs, prerequisites/link types, effects/scopes/values, lock reasons,
conditional effects and direct DB unlocks. Zero `required_parents` means all
linked parents, per the decoded schema. Research points are not a fixed number
of turns; research rate modifiers are outside this snapshot. UI group bounds
are corner-node references rather than membership lists. `scripted_requirement` and
`scripted_reward` rows retain typed mechanics from `script_mechanics.csv`:
30 Khorne battle thresholds, 23 Norsca target-culture battle counters, 21 Norsca
region gates, 18 ancillary rewards (nine Vampire Coast), and four Vampire Coast
lord-pool rewards. Each source mechanic is repeated only in applicable faction
variants containing its technology. Source scopes remain separate from the
owning faction/campaign context. These 96 definitions are not 96 unique effects.

Script rows expose operation, trigger, target type/key, threshold/value, scope,
human restriction, counter/relock policy, reward kind, interpretation and bounded
evidence IDs. Khorne counts a distinct winning faction once per completed battle.
Norsca assigns the last eligible losing faction's culture encountered in the
pending battle cache to each winner; mixed-enemy battles do not increment every
opponent culture. Counters include supporting winning armies and exclude rebels.
Vampire Coast lords enter the recruitable pool only for human factions of the
explicit culture. Ancillary rewards have no human-only guard.

Norsca region and battle handlers write the same lock state; they are not a
permanent conjunction of requirements. Initialization runs region toggles before
battle locks. With the current `allow_allies=false` definitions, the region
handler unlocks on ownership and relocks only when the region has no owner;
losing a region to another faction does not satisfy its relock predicate.
Region records apply only in a campaign containing the literal target region.
Their region-to-campaign existence is not inferred from key prefixes.

## Evidence and remaining limits

No whole Lua files are distributed. `source_exports/discovery.json` inventories
the bounded scan of campaign/library Lua paths, including complete source hashes.
`script_evidence.json` retains excerpts of at most 80 lines with exact source
locations and excerpt/full-file hashes. The extractor parses literal tables and
fails on unsupported expressions; it never executes Lua. `script_audit.json`
lists every other retained lock site separately. Beastmen challenge counters,
Ostankya hex progression, and Changeling saved-state-guarded rift release (the Empire minor-2 mission or at least two Rift Gems)
are not normalized into executable predicates. Their exact sites, DB lock reasons
and bounded evidence remain available. The reverse audit normalizes the four required mechanic families and inventories
other lock/unlock calls. Other research-event consumers (such as Bretonnian
confederation dilemmas, missions and narrative/UI handlers) remain outside typed
script coverage; their complete-file hashes are in the discovery inventory and
faction guides cover the bespoke systems. Campaign feature transitions are retained
as DB evidence, not simulated. These limitations do not change active tree selection.

Read `audit_report.json`, `topology_audit.json`, `classification_inventory.json`
and `missing_localizations.csv` before asserting availability. Missing English
text is warned and never synthesized. Hidden, duplicated, external prerequisite,
unused registry and scripted-only records remain explicitly classified. Structural
fingerprints include mechanics and source keys but exclude labels and provenance;
self-contained repeated shared trees do not imply different game mechanics.

## Reproduction

On the verified MSI installation, with read-only RPFM listening locally:

```
node scripts/extract-technology-source.mjs work/technology-source 9.0
node scripts/build-technology-trees.mjs work/technology-source work/technology-candidate
node scripts/validate-technology-trees.mjs work/technology-source work/technology-candidate
node scripts/test-technology-trees.mjs work/technology-source work/technology-candidate
```

Use fresh destinations. Extraction checks the executable/build before accessing
the game and verifies RPFM's configured installation. Validation reconciles
source fields and independently checks the reviewed source totals/variant identities and
script contracts. It builds twice into fresh directories and compares all builder
artifacts byte-for-byte with the candidate. Install source and output together
only after validation passes. `npm run validate` also checks all other datasets.
Economy and unit exports are not authoritative homes for technology data.

## Generated totals

- faction_files: 109
- races: 25
- node_set_variants: 109
- unique_node_sets: 33
- node_occurrences: 6500
- technologies: 1722
- technology_occurrences: 6500
- dependency_links: 6665
- effects: 13982
- locks_exclusions: 340
- direct_unlocks: 847
- conditional_initiative_effect_relations: 848
- unique_structures: 56
- structured_script_source_records: 96
- structured_script_occurrences: 306
- unresolved_scripted_cases: 43
