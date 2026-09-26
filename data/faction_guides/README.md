> **Current database: 9.0.** These guides retain their 8.1.1 evidence scope. Read [COMPATIBILITY_9.0.md](COMPATIBILITY_9.0.md) first. Their structural completion status is historical, not a 9.0 mechanics certification.

# Race campaign guides

This directory is the qualitative companion to the normalized unit, character, technology-tree,
and economy datasets. It contains one Markdown document per playable race for
*Total War: WARHAMMER III* patch 8.1.1.

The guides do not restate the catalogs. Their narrow purpose is to document the
mechanically relevant campaign information that remains unaccounted for after
the following production material has been reviewed:

- `data/unit_stats/`
- `data/skill_trees/`
- `data/economy/`
- `data/technology_trees/` — active research structure, faction overrides, payloads and typed scripted requirements/rewards; guides retain campaign mechanics beyond normalized coverage.

Each race document covers race-wide systems and any additional faction-specific
systems, rules, exceptions, permissions, resources, or state transitions. The
amount and organization of prose may differ substantially between races.

## Completion status

All 24 playable-race documents are present for patch 8.1.1 / Steam build
24237342 and collectively cover all 104 playable factions. Every document
passes the repository's structural completion validator: required scope and
evidence sections, faction names and stable keys, recognizable game-file paths,
external source URLs, and absence of unresolved placeholder text.

Run the complete guide validation from the repository root:

```powershell
node scripts/faction-guide-queue.mjs validate-all
```

Use `node scripts/faction-guide-queue.mjs validate <race_slug>` to validate one
guide or `node scripts/faction-guide-queue.mjs status` to inspect completion
state. Structural validation confirms documentation completeness; it does not
independently reproduce every documented game mechanic.

## Layout

- `RESEARCH_SPEC.md` — authoritative research and writing contract.
- `queue.json` — the 24-race work queue and completion state.
- `races/<race_slug>.md` — completed race documents.

`scripts/faction-guide-queue.mjs` reports queue status and validates an individual
race document. Pilot tasks receive explicit race assignments and must not edit
the shared queue; their results can be reconciled after all pilots finish. Do not
read other completed race documents while researching a race; structural
compatibility comes from the specification, not imitation.
