# Source, availability and documentation follow-up

Audit date: September 27, 2026 UTC. Baseline: `8ad5a33a4d08eab6cf1273815501846f91d4647a` (8.1.1); production: `66c0dbe38fbf1a574c7d4d7a22b8d9ad8f5ea530` (9.0, after PR #20). PR #21 remains a separate reviewed documentation/target-chain change. Magic #14 remains paused.

## Reproducible retained-source inventory

Run `python3 scripts/audit-9.0-source-inventory.py`. The [machine-readable inventory](source-inventory.json) accounts for all 448 retained source-export paths across both commits. It records source blob identities, SHA-256 hashes for changed files, and literal-tab row-multiset deltas where headers agree. Multiplicity is retained; schema/header changes are explicitly separated.

| Owner | Unchanged files | Changed files | Added export files |
|---|---:|---:|---:|
| campaign_map | 0 | 6 | 0 |
| economy | 8 | 26 | 0 |
| skill_trees | 3 | 29 | 0 |
| technology_trees | 21 | 63 | 1 |
| unit_stats | 119 | 158 | 14 |

These are retained-export deltas, not a declaration that every source change has been mapped to production. Export additions do not prove game additions. The campaign atlas binary and checkpoint source outside `source_exports/` need separate accounting. Localization and extraction metadata are inventoried without being mistaken for unit-stat changes.

Useful next targets: economy building-level headers changed; technology building prerequisites lose 12 source relation rows; technology effects gain 456 and lose 112 row occurrences; skill and character sources change independently of announcement headlines. Counts of added/removed row occurrences include modifications and must not be presented as counts of newly added/removed technologies.

## Availability findings that remain closure work

Run `python3 scripts/audit-9.0-historical-availability.py`. The [case register](historical-availability.json) subtracts current race rosters from exact configured representative-faction custom-battle permissions and traces main/land records, mount links and recruitable subtype permissions. All source/output hashes are recorded.

| Classification, applied in this order | Missing race/unit configurations |
|---|---:|
| supported_mount_of_present_base | 124 |
| exact_faction_recruitable_character | 319 |
| permission_supported_pending_identity_review | 345 |
| approved_duplicate_exclusion | 12 |

**800 permission candidates remain after PR #20: 12 already-approved duplicates, 788 requiring further disposition.** The 124 mount cases and 319 exact-faction character cases are stronger inclusion evidence, not proof of automatic campaign recruitment. The categories are mutually exclusive by precedence; a mount case may also have character evidence. The remaining 345 still have exact custom-battle permission and are not excluded for lacking a direct character mapping.

Concrete current omissions include Repanse (`wh2_dlc14_brt_cha_repanse_de_lyonesse_0` and `_1`) in Bretonnia and the Great Bray-Shaman variants in Beastmen. These are older source identities, not newly introduced DLC29 units. The narrow DLC29 reconciliation therefore cannot establish complete historical roster coverage.

**Before issue #16 closes:** compare candidate identities against canonical records and existing companion relations; implement supported distinct configurations through the existing permission selector; regenerate/validate all companions and update independent coverage decisions. Preserve limited/faction-specific conditions in existing availability notes. Do not exclude by `_mp` suffix alone, call all 788 proven distinct omissions, or invent campaign unlocks. Search additional faction permissions/scripts separately; this representative-faction inventory is a lower-bound discovery audit.

## Existing-scope disposition and documentation register

| Area / evidence | Current disposition | Remaining action |
|---|---|---|
| DLC29 units, mounts and special configurations; PRs #18–19 and `availability-decisions.json` | Implemented; 43 original remaining configurations included and 12 explicit duplicates excluded, plus canonical Arkhan records | Historical roster audit above remains separate |
| Kroxigor Ancient / Spawn-Kin and Arkhan mount regressions; PR #20 | Merged, reviewed, validated; production 2,367 rows | None for this bounded repair |
| Grom, Bloodshriek Chimera, Rakarth target relations; PR #21 | Source chains verified; no normalized-stat repair identified | PR #21 awaits merge; static evidence is not runtime certification |
| Grom/Rakarth/Prince effects and Skaven building prerequisites; PR #21 | 347 emitted nodes / 1,397 matching effects; seven faction technology files checked | Does not independently certify every tree lock or script |
| Slaanesh recruitment building changes; issue #16 existing reconciliation evidence | Nine existing economy level/tier/cost/duration checks match | Recruitment lifecycle remains outside narrow economy columns |
| Tomb Scorpion | Economy settlement tier and unit-record tier are distinct fields | Do not overwrite unit tier merely because the building tier changed |
| Tiger Stalkers movement | Existing run-speed field remains scoped; charge speed and acceleration are separate source fields | No new movement schema required for migration closure |
| Historical rite tables, Books, Krell and Vlad/Isabella; PR #21 | Specific errata and affected-guide links supplied; historical guide scope retained | Wider changed conditions, costs and scripted behavior still need claim-level accounting |
| `relations.tex`; PR #21 | Historical 8.1.1 baseline pinned explicitly | Native addresses/equations are not relabeled as 9.0-verified |
| Vampire Counts, Warriors of Chaos, Empire, Skaven and shared undead guide narratives | Compatibility notice identifies obsolete areas | Trace remaining affected assertions individually; guide structural validation is insufficient |
| Campaign atlas geography and starts | Existing version-7 geography/starts refreshed in PR #17 | Compare binary/checkpoint source and smaller landmark/Dark Fortress/map changes separately |
| New lifecycle, effects, magic, dynamic maps and progression models | Deferred capabilities under existing related issues | Not completion gates for this compatibility refresh |

This register links completed evidence and newly discovered gaps; it does not yet account for every gameplay section of the six official articles listed in issue #16. Keep that broader official-source reconciliation open rather than converting a source-file inventory into a false completeness claim.

## Documentation interpretation

The historical guides already carry 8.1.1 scope. PR #21 corrects selected obsolete statements and the historical mechanics reference; it must not be described as a full 9.0 guide audit. Current normalized unit data remains authoritative for rows it contains, but an absent unit is not evidence of unavailability while the historical omission register remains open. The compatibility refresh needs accurate qualifications and missing existing content repaired; it does not require new campaign simulation models.
