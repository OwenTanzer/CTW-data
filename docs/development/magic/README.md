# Magic retrieval and shared payload integration (#14, PR #30)

PR #30 merged and completed the bounded core-retrieval scope of #14. Broader
acquisition and runtime coverage remain #31. This production increment does not
implement build legality solving, expected damage or runtime combat simulation.
See the [dated inventory](../../development-state.md) for observed issue state.

## Evidence and ownership

The read-only guarded MSI extraction is 9.0.1 / build 25546563, executable
9.0.1.0. The final source contains 114 tables / 85,299 rows. Every overlapping
DB export matches its existing 9.0 owner, which is reused and hash-pinned.
This records hotfix provenance, not a global snapshot migration.

The source archive is pinned at commit
`9d5c8bee9888fe1092528472f4faa3e0260a8c83`, branch
`checkpoint/magic-source-phase2-20260927`, path `work/magic-source-review.tar.gz`.
The extraction manifest records installation checks before and after extraction,
executable hashing and pack name/size/mtime, not full hashes of every game pack.
Source verification checks the exact inventory, hashes, sizes, packed paths,
schema versions, native column types and source-key uniqueness.

- Shared ability/phase/lifecycle, army/context, unit-set and payload companion
  definitions: `data/unit_stats/abilities/`.
- Existing projectile/explosion lookups: `data/unit_stats/lookups/`. The unit
  builder extends these same files; no second magic payload catalog exists.
- Shared effect bindings, stat definitions and scope/context semantics:
  `data/effect_semantics/`.
- Character progression and constraints: existing `data/skill_trees/`.
- Discovery, source pointers and coverage: `data/magic/`.

There are 98 native normalized tables / 70,759 rows, 3,179 ability identities,
696 source-selected magic candidates, and 50,934 conditional skill-binding rows
across 534 of 550 characters. All 550 remain indexed. Candidate classification
uses source types and exact group memberships; these counts are not a certified
inventory of distinct obtainable spells.

## What the review pass adds

The existing 522 projectile and 121 explosion rows retain every previous field
value. The shared lookups add 238 projectiles and 214 explosions plus native
fields for secondary payloads and targeting/fuse details. All 3,181 weapon links
are unchanged. `scripts/magic_payload_baseline.json` records legacy-column row
fingerprints and the original file hashes at PR head `13b4ff9`;
`payload_baseline_comparison.json` records the exhaustive comparison.

Queries follow projectile, bombardment, explosion, shrapnel, spawned/subsequent
vortex, contact/overhead/imbued/spreading phase and homing/scaling/penetration
relations. Nodes are visited once; all incoming and branching edges remain.
Indirect phases include their stat and attribute effects. All 696 candidate
variants resolve the supported graph in this snapshot. Source-only summoned
land-unit records, definition dependencies and runtime uncertainty are separate
fields; supported graph closure does not mean every mechanic is modeled.

All nine represented binding families reach character retrieval. Unit-set rules
retain exclusions and class/category/caste predicates; army and battle-context
routes retain recipients and conditions. Lokhir's Black Ark modifier is an army
route, not a personal spell grant. Supplied `--skill KEY:LEVEL` selections filter
records while exposing unresolved components and leaving legality unevaluated.

Every character has exact subtype-to-unit evidence; base/mount evidence covers
1,370 unit forms. Culture-qualified unit abilities and enabling flags remain
conditional. This does not certify mount unlocks or scripted transformations.
No indexed skill grant is never interpreted as inability to cast.

Mechanical definitions include stats, attributes, unit-set membership/classifiers,
targeting displays, scopes and battle contexts. The dependency audit distinguishes
packed but unextracted targets, presentation/audio references, and schema targets
without packed tables. Operation enums, phase effect types and scope component
tokens without packed definitions remain uninterpreted. Display geometry does not
by itself certify targeting behavior.

## Reproduce

```bash
git fetch origin checkpoint/magic-source-phase2-20260927
mkdir -p work
python -c "import subprocess,pathlib; pathlib.Path('work/magic-review.tar.gz').write_bytes(subprocess.check_output(['git','show','9d5c8bee9888fe1092528472f4faa3e0260a8c83:work/magic-source-review.tar.gz']))"
tar -xzf work/magic-review.tar.gz -C work
python scripts/magic_pipeline.py verify-source work/magic-source-review
python scripts/magic_pipeline.py build work/magic-source-review work/magic-candidate
python scripts/validate_magic.py --data-root work/magic-candidate
node scripts/validate-unit-dataset.mjs data/unit_stats/source_exports work/magic-candidate/data/unit_stats
CTW_MAGIC_TEST_ROOT=work/magic-candidate python scripts/test_magic.py
```

On PowerShell, set `$env:CTW_MAGIC_TEST_ROOT='work/magic-candidate'` before the
test command. Generate into a fresh ignored directory. Install only after both
validators pass, using the output manifest and preserving authored README files.
Copy the unit validator's audit reports separately; reports are not hashed as
builder outputs. The magic builder invokes the existing unit builder with the
verified source as its fourth argument. The ordinary 9.0 unit builder defaults
to the installed shared ability source owner for its ability roots.

Fresh extraction uses the existing shared RPFM mutex and snapshot guard:

```powershell
powershell.exe -NoProfile -File scripts/extract-magic-source.ps1 work/magic-fresh 9.0.1
```

## Validation and remaining boundaries

The validator reconciles every native normalized row to source, every projected
payload source field, derived penetration/shrapnel fields, every skill/binding
pointer and expected binding cardinality, all character unit/form evidence, every
candidate's coverage report and all graph edges. Baseline comparison detects any
changed previous payload field or weapon link. Golden fixtures cover Apotheosis,
Chain Lightning, normal/bound Fireball, Searing Doom bombardment, Doomrocket
shrapnel, summons, multiple phases, Lokhir, unit sets and supplied skill/rank pairs.

Thirteen regression tests include refreshed-hash mutations for phase recipients,
variant cost, crossed phases, skill ranks, sentinels, secondary references and
omitted conditional bindings, plus dropped-branch and cycle/multiple-parent tests.
Recipient-scope and supplied-rank regressions cover grants to another character,
optional level descriptions, node-only rank evidence and unknown components.
These are source/structural checks, not observed battle execution or independent
review. `validation.json` records the latest candidate result.

Broader scope now tracked in #31:

1. Wider item/trait/script acquisition, dynamic forms and verified mount unlocks.
2. Active/inactive/legacy classification and exhaustive lore/passive obtainability.
3. Engine-only operation/sentinel definitions and runtime timing, stacking,
   refresh, intensity and collision behavior where recoverable.
4. Explicitly listed external definitions and unsupported payload namespaces
   outside the supported graph (for example `mom_vortex_key`).

Database work retains source facts, dependencies and constraints for arbitrary
encountered builds. General build-legality research and optimization belong in
Analysis; operational single-unit matchup calculations belong in Adviser #5. See the
[three-repository boundary](../../architecture/repository-boundaries.md).
Missing acquisition evidence remains a database gap.
