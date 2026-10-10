# Native ammunition-pool normalization

Correction against CTW-data 3b5d13d94c5ed3eb4b9c6ce61cc75854b4426196,
10 October 2026. This is a correction to the projection of patch 9.0 native
settings, not a new game extraction or an in-game firing experiment.

## Decision and evidence

`missile_weapons.use_secondary_ammo_pool` is the explicit native selector.
`land_units.primary_ammo` and `secondary_ammo` supply the two capacities.
The primary-missile field, missile junction, battlefield-engine field and
extra-engine junction identify attachments; none supplies a competing pool
selector. `battle_entity_stats_override` changes referenced weapon identity,
not a native ammunition-pool field. Every projectile belonging to a weapon
inherits that weapon's selector.

The old builder instead inferred primary/secondary from attachment role.
Its disagreement with the flag was not independent evidence of engine
precedence: it was our own normalization rule. This revision replaces that
rule at its authoritative upstream owner. It does not apply a serving-layer
exception or infer availability/simultaneous fire from attachment presence.

A missing weapon or blank flag remains null; missing count is null and zero
remains zero. Negative native sentinels survive. Infinite secondary supply is
separate from capacity: the configured 50 is not an exhaustion limit for an
infinite secondary pool. No ammunition is added across alternate weapons.

## Representative source chains

- Lothern Sea Guard anti-infantry bow: native flag false; native primary 22,
  secondary 0. Corrected from secondary/0 to primary/22.
- Iron Daemon–Dreadquake: mortar flag false → primary/15; engine cannonade
  flag true → secondary/40. The regiment-of-renown engine changes from primary/15 to secondary/560; its mortar stays primary/15. Engine attachment does not override the selector.
- Thunderbarge and ordinary Spirit of Grungni: primary bomb remains primary;
  secondary cannon/flame-bomb profiles remain secondary/50. Their owning
  native land rows have infinite_secondary_ammo=true. The multiplayer Spirit
  identity does not gain absent secondary attachments.

Exact evidence is in the unchanged exports under
`data/unit_stats/source_exports/db/`: `missile_weapons_tables`,
`land_units_tables`, `unit_missile_weapon_junctions_tables`,
`battlefield_engines_tables`, `land_units_to_extra_engines_tables` and
`battle_entity_stats_tables`. Main-unit to land-unit identities are retained.
The RPFM schema at 57a23a849fcaa805ccf3afe743bf46fd14a1a43c independently
confirms the selector's Boolean type and capacities' integer types, but its
blank descriptions are not cited as proof of observed engine behavior.

## Scope and validation

An unmodified rebuild reproduced every committed generated file exactly.
The corrected candidate changes 255 of 3,181 weapon-link rows across 152 unit
keys: 253 additional-weapon rows and 2 engine rows. Only ammunition_pool and
ammunition change. Six default roster ammunition values also change: four
Skaven entries and the Norsca/Nurgle War Mammoth entries. These use a default
weapon reached through an additional attachment; the old role heuristic gave
zero despite a populated native primary pool. No other CSV fields change.

The full candidate validator passes, including unchanged raw-export hashes,
all roster/source relationships and an independent comparison of every
missile attachment with its native selector and owning land-unit count.
`node --test scripts/test-unit-ammunition.mjs` covers true/false, blank/missing,
zero, negative sentinel and invalid capacity. Generate under work/ first:

```sh
node scripts/build-unit-dataset.mjs data/unit_stats/source_exports work/ammo-candidate
node scripts/validate-unit-dataset.mjs data/unit_stats/source_exports work/ammo-candidate
node --test scripts/test-unit-ammunition.mjs
```

This establishes the database-defined supply mapping. Runtime consumption,
per-emitter volley arithmetic, enabling conditions and ammunition modifiers
remain distinct downstream questions; no such claims are needed to correct
this normalization.

## Historical payload compatibility

The third Chej review found five stale magic output fingerprints and a second
historical-baseline gate. `reconcile_ammunition_compatibility.py` now generates
an exact migration from 3b5d13d to 2b5965e and refreshes the owner manifest plus
its baseline comparison in a candidate directory. The original 13b4ff9 baseline
is unchanged. Each of the 255 changed weapon rows must match its reviewed full
fingerprint; only its ammunition fields are restored in memory for comparison
against the original baseline. Missing, duplicated or altered migrated rows fail.
Unrelated weapon, projectile and explosion changes still fail. Six normalized
roster ammunition deltas are separately recorded by the generator; all other
roster columns and row counts are required to match the reviewed migration.

Reproduce with `python scripts/reconcile_ammunition_compatibility.py --output
work/ammo-compat`, then `python scripts/validate_magic.py --data-root
work/ammo-compat`. The generator requires the two recorded Git commits locally;
validation uses committed evidence and does not require repository history.
Run `npm run validate` and `npm run test:magic` before acceptance.
