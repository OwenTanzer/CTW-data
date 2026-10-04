# Redesign verification

Date: 2026-10-04. Data baseline:
`3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196`. Node **24.19.0**, Python **3.12.14**,
Linux, **8 GiB** container memory limit. This is author verification, not an
independent review or a live-game test. The PR identifies the published tested
commit; this file avoids a self-referential commit hash.

## Passed checks

| Check | Result / scope |
| --- | --- |
| `npm run validate:architecture` | 9 production routes, 1 development route, 19 concrete endpoints, 8 connection contracts and 15 evidence records; CSV headers/native inventory and read-only SQLite field checks pass |
| `npm run test:architecture` | 13 tests pass, including mutations of authority separation, canonical owner, CSV/SQLite fields, native schema, join endpoints, duplicate IDs, unresolved status, immutable pin, path traversal, evidence paths and generated-view drift |
| `npm run test:snapshot` | 3 tests pass: snapshot rejection, output containment and source text parsing |
| `npm run test:validation-text` | Passes newline/content corruption checks |
| `npm run test:magic` | 13 existing regressions pass |
| `npm run test:campaign-starts` | 13 existing regressions pass |
| Unit validation portion of aggregate | Unit source audit passes and 15 existing unit/roster/availability tests pass before the aggregate reaches skills |
| Documented examples | Both SQL examples execute read-only (2 rule/map rows; 1 exact partner-adjusted army row); Mage (High)/Apotheosis query returns valid JSON |
| Local documentation links | Relative Markdown links in changed/new documentation resolve; wildcard dataset patterns are rendered as code, not broken links |
| Generated production data | `git diff --exit-code 3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196 -- data/` is clean |
| Formatting | `git diff --check` passes |

Architecture checks establish structural references, not the truth of all
free-text claims, exhaustive row-level relation validity or empirical semantics.
Source owner validators and explicit evidence retain those responsibilities.

## Downstream compatibility exercise

Using Adviser main `2c849b821e71ce36f39987053fd667fcff102f02`:

```bash
python3 scripts/verify_sources.py --ctw-root ../CTW-data-baseline
python3 scripts/verify_sources.py --ctw-root ../CTW-data
```

The first command passes against an isolated checkout of Data's original pinned
commit: **134 files**, **72 datasets**, **25 roster files**, **3,181 roster rows**,
**2,409 distinct unit keys**. The second intentionally fails the old lock with
exactly two errors:

- `AGENTS.md: locked fingerprint mismatch`
- `context_catalog.json: locked fingerprint mismatch`

This is expected, not a weakened gate or a claimed migrated consumer. Existing
pinned builds keep working. Selecting new Data requires the deliberate migration
in [catalog-v2.md](catalog-v2.md). No Adviser or Analysis lock was changed.

## Aggregate limitation

`npm run validate` was attempted before altering its existing dataset pipeline.
The unit checks passed; `validate:skills` exited 1 without an audit report. One
focused rerun reproduced exit 1 and recorded peak child resident memory of
**8,001,832 KiB**. The unchanged validator respawns Node with
`--max-old-space-size=8192` and maps a null child status to exit 1 without reporting
the signal. The container limit is **8,589,934,592 bytes** and its memory controller
reported out-of-memory kills. Together these observations support a memory-limit
termination, not a demonstrated skill-data regression.

The full aggregate did **not** pass here. Later aggregate stages were not reached
in that run; only independently exercised checks above are claimed. We did not
change skill validation, relax expected values, or repeatedly exhaust memory.
Incidental unit-audit timestamp changes from the validator were restored; no
production audit report is included in this PR. Memory-bounded skill validation
is a separate implementation follow-up.

## Remote and historical evidence

Repository default branches and listed issue/PR metadata were read on the audit
date. Analysis PRs #7–10 were fetched and their documented study paths inspected.
The preserved effect-source and magic-source checkpoint branch heads and directory
contents were verified at their recorded immutable commits. An upstream report
at an earlier head is not independent clearance of a later head. The inventory
retains that distinction for Adviser #11 and the superseded battlefield #38.

No fresh game extraction, game launch, live geometry verification, downstream
service deployment, exhaustive consumer test run or independent review is claimed.
