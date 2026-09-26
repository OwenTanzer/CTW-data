# Starting-position script evidence — 9.0

The verified map-7 binary yields 109 primary generals, 118 total generals and 326 binary characters. All 572 settlement controls agree with the raster; the fitted logical/world transform uses 1,033 stored points with maximum residual below 0.0001.

The extraction scanned 423 campaign Lua files and retained hashed movement-site evidence for 35 files in `source_exports/movement_script_index.json`. Literal Immortal Empires rules from `wh2_campaign_custom_starts.lua` are preserved in `custom_start_rules.json` and its source excerpt. Human defaults and the five Khazrak partner exceptions are evaluated from these rules. AI-only moves do not overwrite human starts.

The 9.0 movement inventory additionally finds Mortarch acquisition, Archaon subjugation, Black Pyramid network nodes, Thanquol token payloads, Vampire Bloodlines and Neferata Web of Power actions. The inspected Mortarch transfer branch excludes human-controlled donor factions; Web of Power teleport sites are ritual callbacks. These are not unconditional primary-human starting relocations. Episode/crisis and later campaign actions remain outside the static startup layer. This is not an executed or exhaustive runtime callback-order proof, nor a complete spawned-hero census.

Use `faction_army_start_reference` for human primary points, and the partner override table for the exact pair. Four primary maritime points retain known coordinates with no distinct region mask. Nearest land is descriptive geography, never ownership or a travel route. Full source-file hashes and line-level sites remain available for auditing the stated boundary.
