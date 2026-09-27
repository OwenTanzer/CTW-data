# Magic retrieval

Read `dataset_manifest.json`, `coverage.json` and `schema_inventory.json` first.
This is a **partial** source-backed retrieval layer for #14, using 9.0 character
and unit owners plus explicitly verified 9.0.1 extraction evidence. It does not
claim all spells are obtainable or all runtime effects are modeled.

## Start with a character or ability

```bash
python scripts/query_magic.py --character 'Mage (High)' --ability wh2_main_spell_high_magic_apotheosis
python scripts/query_magic.py --character Teclis --ability wh_main_spell_heavens_chain_lightning
python scripts/query_magic.py --ability wh2_dlc15_spell_bound_chain_lightning
```

`--character` accepts an exact unique display name or subtype key. Without
`--ability`, it returns the compact skill-binding possibilities. For spell-name
lookup, filter `ability_index.csv` by `display_name`, then select an exact
`ability_key`; multiple normal/bound/overcast identities may share a label.
Blank labels remain blank. Pass `--output work/result.json` for a file result.

Queries read one character file and shared relation tables. They never scan all
character CSVs for ordinary retrieval. `character_index.csv` includes all 550
characters, including those with no indexed relation. An empty path means no
route established by this index, not proof that the character cannot cast.

## Interpretation

The result separates base casting records and payloads from skill grants and
modifiers. Every skill record retains rank, scope, source value and its applicable
node-set/tree conditions. No allocation is selected and successive skill ranks
are never summed. A group cost modifier does not grant the group's spells.
Normal/overcast relationships use `overpower_option`; replacement sets and
source-type labels are preserved separately. `source_type=spell` does not prove
an ordinary Winds-funded version: the bound Chain Lightning fixture demonstrates
that counterexample.

Phase links preserve ordering and self/friend/enemy flags as part of their full
identity. Casting restrictions and phase recipients are separate layers. Phase
stat operations retain their literal `how` values; they are not all additions.
Negative native use/recharge sentinels retain their source values and unresolved
interpretation. Numeric fields are unconverted source values, not computed
per-cast totals. Intensity, lore-passive activation and refresh conditions are
source evidence, not automatically permanent effects.

Summons keep `land_units` keys and return the one-to-many main-unit mapping.
Projectile/explosion payloads currently remain explicitly marked source-only
records under unit ownership. No duplicate normalized projectile catalog exists.
The query returns culture-qualified unit grants as separate evidence; they do
not establish campaign acquisition by the selected character.

## Files and owners

- `ability_index.csv`: all ability identities, labels, source classifications,
  magic-candidate selection, relation counts and unresolved access status.
- `character_index.csv` and `characters/`: derived pointers from skill effects to
  direct ability, ability-group and phase bindings; no copied skill trees.
- `coverage*.csv/json` and `unresolved_relations.csv`: explicit coverage and gaps.
- `source_registry.json`: one canonical source path per included relation;
  shared exports are reused after comparison, not copied under magic.
- `schema_inventory.json`: normalized table paths, exact keys, native types and
  foreign-key definitions. Source column names remain literal.
- `input_lock.json` / `output_manifest.json`: hashed inputs and generated output.
- `extraction_manifest.json` / `shared_source_comparison.json`: extraction identity
  and bounded 9.0/9.0.1 compatibility evidence.

Shared ability truth lives in `data/unit_stats/abilities/`; effect binding/scope
truth lives in `data/effect_semantics/`; character progression remains in
`data/skill_trees/`. Source-only discovery exports outside this increment stay
in the pinned development archive. `source_line` is a 1-based physical source
line; `skill_source_line` is the logical CSV row including its header.

Reproduction, validation and remaining acceptance gates:
[development handoff](../../docs/development/magic/README.md).
