# Magic: first source-backed retrieval increment (#14)

This increment resumes the preserved September 26 checkpoint on main
`63c93e453a8ed35ba8f8a166253c4c03b9eb1ac5`. It does **not close #14**.
The prior checkpoint remains at `checkpoint/magic-partial-20260926`; its importer
and 8.1.1 snapshot assumptions are not promoted into the production workflow.

## Evidence recovered

The MSI installation now reports executable 9.0.1.0 / Steam build 25546563.
The 9.0 guard correctly rejected it. An explicit 9.0.1 profile then performed
fresh read-only extraction under the existing shared RPFM mutex. Neither a game
pack nor an existing production snapshot was modified. The user explicitly
excluded a separate hotfix migration from this work.

The extractor recovered 79 tables / 50,742 records. All nine previously missing
relation families are present. Source validation checks the exact file inventory,
hashes, sizes, selected packed paths, schema versions/columns, native types and
source-key uniqueness. Every database export overlapping a current owner is
text-identical to that owner's 9.0 export. This is a bounded source comparison,
not a claim about all hotfix content. Unchanged sources are referenced in place.

The source archive is retained on a development checkpoint, not default agent
routing: commit `4d16368f1d5ab822197dade576c4e27ce24d5596`, path
`work/magic-source-9.0.1.tar.gz`. Its extraction manifest is included in the
magic dataset; its metadata records installation checks before and after the run.
The installation check includes executable hashing and pack name/size/mtime,
not a full content digest of every pack.

## Delivered contract

- Shared unit ability/casting/phase/lifecycle/vortex/bombardment relations:
  `data/unit_stats/abilities/`.
- Shared effect, ability/group/phase bindings and scope definitions:
  `data/effect_semantics/`.
- Spell-candidate inventory, per-character relation indices, coverage and source
  routing: `data/magic/`.
- Existing skill trees own progression and constraints. Indices point to exact
  skill rows; group modifiers are not expanded into thousands of copied grants.
- Existing projectile, explosion, land-unit and main-unit sources retain their
  owners. Their source-only payload records are explicitly marked by queries.

There are 59 normalized shared tables / 35,220 rows, 3,179 ability identities,
696 magic candidates, and 44,275 skill-binding rows across 323 of 550 indexed
characters. These are distinct counts. “Magic candidate” is the documented
union of source types spell/bound/rune/cataclysm/lore and explicit group
membership, not a count of distinct playable spells. The whole ability inventory
is retained so provisional classification never erases another source type.

## Reproduce

From a checkout containing the source-checkpoint commit:

```bash
mkdir -p work
# Use Python to avoid binary redirection corruption in older Windows PowerShell.
python -c "import subprocess,pathlib; pathlib.Path('work/magic-source.tar.gz').write_bytes(subprocess.check_output(['git','show','4d16368f1d5ab822197dade576c4e27ce24d5596:work/magic-source-9.0.1.tar.gz']))"
tar -xzf work/magic-source.tar.gz -C work
python scripts/magic_pipeline.py verify-source work/magic-source-9.0.1
python scripts/magic_pipeline.py build work/magic-source-9.0.1 work/magic-candidate
python scripts/validate_magic.py --data-root work/magic-candidate
CTW_MAGIC_TEST_ROOT=work/magic-candidate python scripts/test_magic.py
```

If the checkpoint object is absent, fetch the named checkpoint branch first.
Build into a fresh ignored work directory. Install generated `data/` artifacts
only after validation passes; preserve the human-authored README files.
On PowerShell, set `$env:CTW_MAGIC_TEST_ROOT='work/magic-candidate'` before running
the test command. A fresh live extraction uses:

```powershell
powershell.exe -NoProfile -File scripts/extract-magic-source.ps1 work/magic-fresh 9.0.1
```

Never remove the snapshot guard or relabel existing archived rows.

## Validation and remaining work

`npm run validate:magic` reconciles every normalized row to its canonical source,
checks all generated/input hashes, checks every character skill/binding pointer,
and runs concrete query fixtures. `npm run test:magic` includes mutations with
refreshed output hashes: crossed phase links, recipient flags, conflated overcast
costs, wrong skill ranks and sentinel-to-zero conversion must still fail.
Two fresh builds produced identical artifact hashes. This is source/structural
validation, not live battle validation or an independent reviewer approval.

Outstanding #14 scope:

1. Normalize complete spell-reachable projectile/explosion closure under the
   existing shared owner; expose remaining projectile and contact-effect fields
   without a parallel payload database.
2. Extend access coverage to item/trait/form/mount/scripted grants and unit-set /
   battle-context bindings. The latter sources are retained but not interpreted
   as direct character grants by this increment.
3. Reconcile active/inactive/legacy content and all lore/passive acquisition
   routes. Missing labels must continue to leave stable keys queryable.
4. Resolve supported units/operations/sentinels and engine-dependent timing,
   conditions and stacking. Unresolved values must remain visibly unresolved;
   no numerical damage predictions or build arithmetic are implemented here.
5. Expand fixtures and coverage to the remaining grant and payload families,
   then assess the full issue's completion criteria separately.

The relation audit reports 49,944 references resolved within the extracted
relations and 8,914 resolved through existing owners. Its 43,000 external or
unextracted references include visual/audio assets and engine enums as well as
mechanical definitions; they are reference occurrences, not 43,000 missing
spells. They remain queryable in `unresolved_relations.csv`.
