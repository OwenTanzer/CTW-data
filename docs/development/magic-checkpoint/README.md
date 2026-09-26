# Magic builder checkpoint — 2026-09-26

Incomplete development work for issue #14. Not a production dataset or completion claim.
Base: 8ad5a33a4d08eab6cf1273815501846f91d4647a.
Related migration: #16. No production routing or snapshot change is included.

## Preserved work
- Four previously untracked scripts: guarded gap extractor, PowerShell mutual-exclusion wrapper, selective archive importer, and exact-key/hash helpers.
- Source relation inventory, including nine explicitly missing relation families and the observed version mismatch.
- Local and MSI copies of the two extractor files matched SHA-256 at checkpoint time.
- Both locally generated evidence-subset manifests passed the existing helper's snapshot, file-size, hash and coverage checks during preservation. This is an integrity check, not independent gameplay validation.

## Evidence recovery
The existing source-only archive is already retained in Git at commit f61fd8ab2a65931abb494340a6918faaeedfdd7d, under data/effect_semantics/source_exports/. It is development evidence, not integrated production semantics.
The required source_manifest.json SHA-256 is fd8eabe1b1ea0c18076b5c1d5c00cf3a6ee5aa40d0c478b7b79a5b9c6e89f701.
Recover that directory from the exact commit to an ignored work archive, retaining discovery.json and decoded_schema.json. Run:
`python scripts/import-magic-evidence.py work/effect-archive work/magic-evidence-restored`
Use a fresh output directory. The importer verifies the pinned manifest and selected files. Generated subsets are reproducible and are not duplicated into production here.

At preservation time:
- Linux worktree: /workspace/scratch/d0884145f0e9/ctw-magic-builder
- Local source subset: work/effect-archive
- Local generated evidence: work/magic-evidence
- MSI worktree: C:/Users/Owen/ctw-magic-builder, branch feat/magic-character-effects-20260926
- MSI extractor files were uncommitted; no work directory existed there.
- Original MSI archive: C:/Users/Owen/ctw-pr8-exercise/work/source_effect_exercise_20260919

## Blocker and limits
The extraction guard encountered executable 9.0.0.0 / build 25507028 while requiring 8.1.1.0 / build 24237342. No successful fresh gap extraction is claimed.
Ability-to-phase and group-membership junctions, phase attributes and additional activation/recharge/replacement relations remain missing; see source_relation_inventory.json. Incoming dependency closure is incomplete.

No normalized magic builder, final spell dataset, completed skill-to-spell effect joins, or end-to-end validator was found in the inspected worktrees. Preserve these scripts as unfinished code requiring review. In particular, source reuse and installation checks must be reviewed before any new extraction; do not infer that matching snapshot labels prove matching pack content. The extractor's guarded failure is not a successful extraction test.

Resume by choosing a coherent source version under #14/#16, recovering the archived evidence, reviewing these scripts, and resolving missing relations. Never bypass the version guard to insert 9.0 rows into 8.1.1 outputs. Existing main data remains authoritative until a separately validated migration is reviewed.
