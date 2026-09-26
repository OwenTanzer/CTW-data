# Effect semantics foundation: extraction increment

Tracks [issue #7](https://github.com/OwenTanzer/computational-total-war/issues/7).
This increment supplies executable source discovery, a read-only extractor and
source-integrity validation. **It does not install a new production dataset or
resolve campaign stat semantics.** Live extraction and initial source inspection
passed on 2026-09-19 after the validator fixes described below. Normalized bindings
remain a subsequent implementation gate.

## Live exercise: 2026-09-19

Ran the unmodified extractor from PR head
`fc7a7bd83d1c9bcb0af07bbc87bae6bf2b75cb16` against the verified Windows
installation (build 24237342, executable 8.1.1.0, Node 24.15.0). The local RPFM
server handshake and all 220 packed-file exports succeeded. The full installed
schema expanded the 80 root tables into 220 tables, compared with the partial
offline audit's 81. The candidate has 222 manifest-covered files, 14,488,501 bytes
and 109,408 data rows. Nothing was promoted to production.

The original validator rejected valid exports for two reasons: RPFM puts key
columns before other fields, and combines schema-annotated RGB fields into hex
columns in five supporting tables. Validation now checks exact unique column
membership by name and explicitly validates the supported RGB projection and
six-digit hex values. Missing, extra and duplicate columns still fail. Unknown
colour layouts fail; decoder projections are reported rather than represented
as unchanged binary fields. No original colour values are reconstructed.

The corrected validator passes file hashes, exact manifest coverage,
schema/version and packed-path reconciliation, and source-key uniqueness for
the whole candidate. Nine focused tests cover the live export shapes and their
negative cases. The compact record in
[`effect-foundation-live-validation.json`](effect-foundation-live-validation.json)
includes the source-manifest hash, dependency boundary counts and sampled
stat-related schemas/rows. Candidate exports remain under ignored
`work/source_effect_exercise_20260919` in the isolated MSI exercise checkout.

Initial inspection recovered explicit scope components; effect-to-bonus bindings;
unit-set membership selectors and exclusion flags; experience-level filters;
and native experience parameter tables. These establish source structure, not
the engine's evaluation or stacking rules. The next task is typed normalization
and semantic verification, not restoring host access.

## Existing-source audit

```bash
npm run audit:effect-foundation
```

The audit uses the existing technology extraction's full packed-file inventory,
its retained partial schema, and the four existing source manifests. At the
current snapshot it discovers 80 root tables and one additional schema dependency:
two tables are present and 79 require extraction. This is a file-presence audit;
even a present file does not certify resolved semantics. Missing root schemas
make the offline dependency closure explicitly incomplete. The live extractor
uses the complete installed schema to finish that closure.

The regenerable report is `work/effect_foundation_audit/coverage.json`. It records
the inventory hash, exact source paths, existing source copies, relation families
and unresolved schema coverage. No missing relation is represented by an empty
production CSV or an invented zero-valued rule.

## Read-only extraction on the verified Windows installation

From this checkout, with RPFM (Rusted PackFile Manager) running on its existing
local endpoint and the verified game installation available:

```powershell
powershell.exe -NoProfile -File scripts/extract-effect-source.ps1
npm run validate:effect-source
```

Use the PowerShell wrapper: it holds the repository's shared RPFM research mutex
for the entire extraction. If another extraction owns the lock it exits promptly.
The default candidate destination is
`work/source_effect_semantics__wh3__8.1.1`; reruns require a new empty destination,
which can be passed as the wrapper's `-Output` argument and then to the validator.
`CTW_GAME_PATH` optionally specifies the installed game directory.

The extractor:

1. Verifies Steam build 24237342 and executable 8.1.1.0 before opening RPFM.
2. Verifies that RPFM targets that exact installation and loads only merged vanilla
   Creative Assembly packs. It never saves or modifies a game pack.
3. Discovers effect bindings, battle contexts, scopes, unit targets, experience
   and stat-rule tables from actual packed paths. Table-name patterns select
   evidence to inspect; they do not assign target membership or stat operations.
4. Follows decoded schema references, retaining explicit boundaries for data
   owned by existing catalogs and references without packed rows. A closure above
   400 tables fails for ownership review instead of silently truncating.
5. Exports decoded TSV files plus selected schema and discovery metadata to the
   ignored candidate directory. No full Lua, executables or tooling binaries are
   added to production.
6. Checks the game build/version and Steam manifest again and hashes every output.

The source validator checks exact manifest coverage, hashes, snapshot identity,
selected-table and packed-file reconciliation, exported schema versions/headers and duplicate
source-key conflicts. Duplicate keys fail for precedence inspection; they are
not silently overwritten. This gate **does not certify** target resolution,
foreign-key semantics, native experience formulas, arithmetic order or legal
campaign builds. The live server handshake/extraction was exercised successfully
on 2026-09-19; unexpected server response shapes still fail closed.

## Next normalization gate

After live extraction passes, inspect the actual binding and progression schemas
and their values. Implement typed effect/bonus/target joins and native rank
relations with external-owner reconciliation. Only then generate
`data/effect_semantics/` candidates with manifests, schemas, audits and catalog
registration. Keep native unit progression under `data/unit_stats/` ownership.
Preserve all conditions and unresolved engine rules; do not infer them from
English descriptions or similar identifier spelling.

The foundation remains independent of recruitment issue #1 until army acquisition
and capacity checks are added. Broad campaign acquisition, items, rituals and
ability lifecycle work remain later increments of issue #7.

## Tests

```bash
npm run test:effect-foundation
```

The tests use synthetic fixtures to check dependency closure, explicit missing
coverage, snapshot failures, tampered or stale files, manifest path handling,
schema mismatches, missing packed files and conflicting source keys.
They validate this infrastructure, not live game mechanics. Existing production
dataset validation commands remain unchanged.
