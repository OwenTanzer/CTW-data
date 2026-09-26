# 9.0 technology selector review

Two narrowly named overrides extend the existing engine precedence interpretation. Neither adds generic Chaos nodes to a faction-specific tree.

| Faction | Selected set | Replaced fallback | Source nodes | Corroboration |
|---|---|---|---:|---|
| wh3_dlc20_chs_sigvald | chs_mil_sigvald | chs_mil | 33 | Official 9.0 notes explicitly change his technologies to Azazel's model; decoded technology-key membership equals Azazel's. |
| wh3_dlc29_chs_host_of_the_triplets | chs_mil_glottkin | chs_mil | 33 | Explicit faction/culture/subculture selector; distinct complete source tree rather than a copy of Festus. Replacement uses the previously reviewed faction-over-generic engine model. Runtime not observed. |

The generic chs_mil set has 48 nodes. Exact selectors, row numbers, and source hashes are emitted in node_set_precedence.json; validators independently pin the two set keys and 33-node memberships and reconcile every retained node to the current source. The Glottkin conclusion is a bounded source interpretation, not independent gameplay verification. Its interpretation_status preserves that distinction. An engine-observed contradiction must invalidate this rule, not be hidden by count adjustments.

Source: decoded technology_node_sets_tables and technology_nodes_tables from verified 9.0/build 25507028. Official corroboration for Sigvald: https://community.creative-assembly.com/total-war/total-war-warhammer/blogs/110 (Sigvald section, read 2026-09-26). Glottkin differs from Festus in 19 technology choices despite the equal node totals; do not substitute either tree for the other.
