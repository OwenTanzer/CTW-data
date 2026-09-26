# Reviewed 9.0 availability decisions

Implements the approved disposition of 55 candidates on issue #16: 43 inclusions with qualifications and 12 excluded duplicate identities. `availability-decisions.json` preserves each source key, faction permission, mount relation, character evidence, decision and qualification, plus source hashes. Source exports are unchanged.

Validation exposed an additional gap: Arkhan's three canonical foot/steed/chariot counterparts existed in source but were absent from all normalized rosters. They are now included under their explicit Host of Nagash permissions. Therefore this change adds 46 roster rows, from 2,320 to 2,366. Excluded `_mp` aliases preserve Tomb Kings custom-battle permission evidence in the decision register; their permissions are not fabricated on canonical identities.

Remaining uncertainty concerns access detail rather than inclusion: four Nagash-specific Vampire Lord configurations lack a traced campaign acquisition/replacement mapping; Arkhan/Mannfred Dread Abyssal unlock conditions are unverified. Neferata has conditional Mortarch access. These qualifications are emitted into existing availability_notes. No new acquisition simulator or schema is introduced.

Duplicate equivalence covers all main/land fields except identity and all culture-qualified ability links, not every external script reference. The reviewed mappings prevent counting the twelve alternate identities as missing distinct combat profiles.

Rebuild: `node scripts/build-unit-dataset.mjs data/unit_stats/source_exports work/availability-units`. Validate that candidate with `node scripts/validate-unit-dataset.mjs data/unit_stats/source_exports work/availability-units`. Run `node --test scripts/test-availability-coverage.mjs scripts/test-lord-unit-coverage.mjs`.

Independent decision checks reject missing configurations, dropped notes, duplicate insertion, missing canonical counterparts and missing recorded mount links. Issue #16 remains open for broader reconciliation. Magic #14 stays paused.
