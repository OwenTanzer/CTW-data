# Startup script audit

The source manifest hashes the installed IE startpos, the frontend leader table, and the custom-start script. `movement_script_index.json` retains exact file hashes, line numbers and movement call sites from 373 extracted campaign Lua files. This is a bounded static audit, not an assertion that a regex proves complete runtime behavior.

Primary human position changes are reproduced from the actual literal `me_custom_start_factions` table. `custom_starts_ie.lua` is the extracted table; `custom_start_rules.json` is its parsed form. The custom-start helper selects the closest general/non-general to the supplied source coordinate, not an exact coordinate match. Accordingly both Khazrak general moves execute sequentially on his one general. The resulting target is (516,725), unless one of Empire, Drycha, Sisters, Durthu or Orion is human. Eltharion moves to (573,407), his additional general to (327,569), and Orion to (471,517). Rule indexes and binary coordinates are preserved per row.

Reviewed scope boundaries:

| Source relative to script/campaign | Relevant behavior | Treatment |
|---|---|---|
| wh2_campaign_custom_starts.lua | Campaign, human and AI predicates; ordered closest-character moves | IE human branches evaluated; five pair-specific exceptions generated |
| main_warhammer/wh_start.lua; faction_intro.lua; main_warhammer/faction_intro/main_warhammer_faction_intro.lua | Startup callbacks and camera introductions | Camera coordinates are not army positions |
| wh3_dlc27_aislinn.lua | Initial AI-only transfer and teleport to (928,132); later AI move | Human start retains binary (898,87) |
| main_warhammer/wh_dlc07_schwartzhafen_undying_love.lua | Spawn/replace Vlad/Isabella hero and move hero | Primary army unchanged; hero census remains pre-script |
| wh3_dlc25_gelt_dilemmas.lua | Dilemma-selected later return from Cathay | Excluded from opening position |
| wh3_dlc24_mother_ostankya.lua | Turn-two human dilemma and probabilistic AI return | Excluded from opening position |
| wh3_dlc27_secrets_of_the_white_tower.lua | Teclis dilemma-selected confederation/teleport | Excluded from opening position |
| wh3_dlc27_valiant_imperatives.lua | Ritual loan-and-teleport | Excluded from opening position |
| wh3_dlc27_eternal_dance.lua | Ritual displacement | Excluded from opening position |
| wh3_campaign_bonus_values.lua | Conditional ancillary-triggered teleport | Not an unconditional startup move |
| wh3_campaign_great_game.lua | Opens Albion, Southern Wastes and Gryphon Wood portal nodes | Availability context, not an automatic army relocation or universal teammate route |
| wh3_dlc24_the_changeling.lua | Opens campaign rifts | No automatic primary starting-position change |
| main_warhammer/wh3_sea_lanes.lua; wh3_campaign_caravans_core.lua | Travel after player/route actions | Not a startup move or walking edge |
| wh2_dlc13_empire_politics.lua; main_warhammer/endgame/*; main_warhammer/wh_dlc08_monster_hunt.lua | Confederation handling, crisis forces, quest battle transitions | Not unconditional initial human placement |
| wh3_main_chaos/*; wh3_main_prologue/* | Other campaigns | Excluded from IE |

All 104 primary positions are backed by binary records. The raw evidence also preserves heroes and all secondary generals. MP restrictions, later decision branches, engine adjustments on teleport, mod effects and full travel eligibility require separate validation; the study must carry these caveats rather than treating source decoding as gameplay testing.
