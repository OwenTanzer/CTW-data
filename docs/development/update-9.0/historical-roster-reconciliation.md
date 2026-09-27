# Historical roster reconciliation (#23)

Baseline: merged main `6282fd8b6181c6ba4dd6390753a86527b3812c23`, patch 9.0 / Steam build 25507028. Source exports and schema v4 are unchanged. This repair is proposed, not merged.

## Dispositions and output

| Evidence set | Include | Exclude equivalent combat aliases | Total |
|---|---:|---:|---:|
| Original representative-faction discovery | 784 | 16 | 800 |
| Additional same-subculture faction permissions | 4 | 0 | 4 |
| Combined | 788 | 16 | 804 |

The sixteen exclusions include the twelve already approved in the DLC29 pass. The four new exclusions are Greenskins' feral Wyvern alias, Kairos's custom-battle alias, and the Nurgle Forsaken/Spawn aliases in Warriors of Chaos. Each has an existing same-race canonical row, identical non-identity main/land fields, identical culture-qualified abilities, missile-weapon attachments and extra engines, and no mount edges. Identical referenced entity, attribute-group and weapon keys preserve the remaining represented combat dependencies. Their permissions are not identical in general: keep them under their original source keys in the decision register, never transfer them to the canonical key. Canonical notes make this distinction explicit. External script equivalence is not claimed.

Conversely, Spirit of Grungni's `_mp` variant differs in ability and weapon junctions despite matching main/land fields; it remains a separate record. Malus and Daemon Prince mode-specific identities also remain distinct. No suffix-based exclusion is applied. Dark Elves retain the Wyvern identity permitted to their source faction; the Greenskins' counterpart does not grant Dark Elf permission.

The four additional cases are `wh3_dlc23_chd_cha_zhatan_the_black_lammasu` and `wh3_dlc23_chd_veh_iron_daemon_3payload_qb`, explicitly permitted to `wh3_dlc23_chd_legion_of_azgorh`, plus Ulrika foot/warhorse explicitly permitted to `wh3_dlc29_vmp_neferata`. Existing availability notes retain this restricted evidence. Neither unit-key naming nor a custom-battle permission establishes ordinary campaign recruitment. Source `campaign_exclusive` flags are preserved literally, not translated into invented acquisition rules.

The regenerated candidate has **3,155 race/unit rows**, up from 2,367, across the same 25 race rosters. All old rows remain. Excluding regenerated timestamp metadata, old combat fields are unchanged; only four canonical availability notes change. All companion tables are regenerated, including components, weapons/projectiles, culture-qualified abilities, attributes, contact effects, permissions and mount relations. Repanse and all twelve Great Bray-Shaman configurations in the discovery register are included.

## Reproduction and checks

- `python3 scripts/reconcile-historical-rosters.py`: regenerate [all case decisions](historical-roster-decisions.json) from pinned discovery/scope/production evidence and hash-checked source. Add `--apply-scope` to install reviewed selector entries. This is separate from production generation.
- `node scripts/build-unit-dataset.mjs data/unit_stats/source_exports work/roster23/candidate`
- `node scripts/validate-unit-dataset.mjs data/unit_stats/source_exports work/roster23/candidate`: passes before installation.
- `npm run validate:units`: installed owner validation plus the previous lord/availability regressions and five new historical-coverage tests pass.
- `python3 scripts/audit-historical-roster-output.py`: independently compares old/new records, exact inclusion decisions and represented mount bases; [output audit](historical-roster-output-audit.json).

Independent coverage checks do not import the selector. They reject lost identities, substituted land-unit keys, missing qualifications, missing mount edges, altered exact-faction permission flags, excluded alias insertions and lost canonical counterparts. The all-faction permission scan is limited to source factions with a matching represented subculture, not guessed culture from unit names.

## Remaining boundary

All original recorded candidates and four additional same-subculture custom-battle permission cases are dispositioned by this candidate. This does not prove exhaustive script-only acquisition, alliance borrowing, confederation reachability, or every campaign unlock. Those paths are not silently inferred from custom-battle evidence. The historical discovery report remains pinned as provenance; it is superseded for these cases by the decision and output registers here. Issues #23 and #16 remain open pending review/merge and acceptance reconciliation. Magic #14 stays paused; no recruitment simulator or new mechanic schema is introduced.
