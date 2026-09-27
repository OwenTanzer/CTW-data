# Archaon scripted roster availability

Patch 9.0 / Steam build 25507028. Baseline main after PR #26: `4747d01b37c161571b75fc3203206cae8b3b0e55` (3,155 race/unit rows).

## Existing availability route

The official 9.0 release notes list eleven non-Warriors of Chaos legendary lords who can be acquired by Archaon. The retained installed script `script/campaign/wh3_dlc29_archaon_subjugation.lua` has SHA-256 `db259f7f1f2a1d17e031ea2949ae81d3ccd0c95bd5333bee4aaf27490b7369e8`, matching the script discovery index. Lines 26–45 map each source faction to its leader subtype; current `agent_subtypes.associated_unit_override` resolves eleven base unit keys. Lines 234–295 also list six chieftain subtypes for conditional transfer when vassalizing specified Nurgle factions. The nine mounted keys are linked to these 17 base identities by `units_custom_battle_mounts`.

[The source-backed case register](archaon-scripted-availability.json) names each source faction, subtype, canonical unit, optional mount base and exact DB permission owner. It contains **26 Warriors of Chaos roster entries**: eleven leaders, six conditional chieftains and nine mounted forms. Each row's availability note identifies **Archaon only** and the scripted route. A mount record describes a possible unit configuration of the transferred character; the script does not establish that all mounts are automatically unlocked on transfer. Some transferred characters require specific vassalization conditions. There is no general Warriors of Chaos custom-battle permission for these identities; their original exact faction permissions are left under their original keys, with no invented military-group relation.

This is a race-roster inclusion for possible campaign configurations, consistent with the general availability policy. It does not imply that another Warriors of Chaos faction can recruit them or that Archaon can recruit them ordinarily. The source script still governs acquisition. No new simulation model or unit-stat schema is introduced.

## Reproduction and checks

1. Verify the retained script hash and mappings above; `data/technology_trees/source_exports/discovery.json` pins the source script hash. Run `python3 scripts/reconcile-archaon-availability.py --apply-scope` to check source DB identities and mount edges, write the case register, and install only the reviewed roster selector entries.
2. Build to an ignored candidate: `node scripts/build-unit-dataset.mjs data/unit_stats/source_exports work/archaon27/candidate`. Validate it with `node scripts/validate-unit-dataset.mjs data/unit_stats/source_exports work/archaon27/candidate` before replacing production outputs.
3. Run `npm run validate:units` and `python3 scripts/audit-archaon-roster-output.py`. The latter compares directly with merged PR #26 and writes [the output audit](archaon-output-audit.json).

Candidate and installed owner validation pass. Three new mutation tests reject missing keys, altered qualifications/land identities, invented Warriors of Chaos permissions or military-group links, and missing mount edges; existing unit regressions continue to pass. The output audit confirms **3,181 race/unit rows**, 26 additions to Warriors of Chaos, zero old semantic row changes and no old companion rows removed. Original typed source permission identities and flags are preserved. The nine selected-base mount edges already existed in the global lookup because the base characters are in their native rosters; they remain available to the added race roster without duplication.

## Boundary

Static Lua configuration and source DB links establish possible configurations; no live campaign was run. The listed source-faction conditions and character-specific mount unlocks are retained as qualifiers, not converted into an unconditional recruiting claim. Magic #14 remains paused.
