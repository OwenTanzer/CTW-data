# Technology tree audit

Status: **PASSED**

109 faction files; 109 variants; 6500 nodes; 1722 distinct technologies; 6665 dependency rows; 13982 ordinary effect rows; 340 script-lock reason rows; 847 direct unlock rows.

## Checks

- 109 unique indexed faction files; 25 race representatives; hashes, sizes, context, canonical schema, selector variants and source fields verified.
- All nodes, technologies, prerequisite links, research costs, effect junctions, scopes, priorities and localizations reconcile to source.
- Prerequisite DAGs checked; zero required_parents means all source parents. Hidden and repeated technology nodes are retained and classified.
- Nakai wh2_dlc13 branches, ordering, prerequisites, costs and effects verified against complete lzd_nakai source membership.
- Explicit selector totals and the two Changeling campaigns verified; 96 structured script definitions and bounded evidence validated; zero whole Lua files.
- Shared fingerprints recomputed and faction-specific Wood Elf structure distinguished.
- Two independent builds and the candidate are byte-identical across all builder artifacts.

## Warnings and evidence limits

- 5478 missing localization occurrences (1528 distinct keys); structural records retained.
- 43 bounded lock sites are not normalized. See script_audit.json for individual source locations and scopes; this count is not a complete list of runtime mechanics.
- 9 explicit faction DB assignments replace generic fallbacks. Read each rule interpretation_status: source review is distinguished from observed gameplay. The binary engine selector is not decoded.
- Feature forests and transitions are retained in source, but runtime feature transitions and script-controlled effect/unlock behavior are not statically executed.

## Errors

None.
