// Independently transcribed from 9.0 current main_units and custom-battle mount links.
// This fixture deliberately does not import the roster selector/configuration.
export const LORD_UNIT_FIXTURES = [
  { race: 'empire', base: 'wh3_dlc29_emp_cha_boris_todbringer_toddy_0', mounts: [1, 2, 3].map(i => `wh3_dlc29_emp_cha_boris_todbringer_toddy_${i}`) },
  { race: 'undead_legions', base: 'wh3_dlc29_vmp_cha_nagash', mounts: [] },
  { race: 'warriors_of_chaos', base: 'wh3_dlc29_chs_cha_glottkin', mounts: [] },
  { race: 'skaven', base: 'wh3_dlc29_skv_cha_thanquol', mounts: ['warpfire_braziers', 'warpfire_projectors'].map(s => `wh3_dlc29_skv_cha_thanquol_boneripper_${s}`) },
  { race: 'vampire_counts', base: 'wh3_dlc29_vmp_cha_neferata', mounts: ['barded_nightmare', 'coven_throne', 'dread_abyssal', 'hellsteed', 'zombie_dragon'].map(s => `wh3_dlc29_vmp_cha_neferata_${s}`) },
];


// Independently reviewed mount chains of already included base units.
export const UPDATE_MOUNT_FIXTURES = [
  {
    "race": "empire",
    "base": "wh3_dlc29_emp_cha_emil_valgeir",
    "mounts": [
      "wh3_dlc29_emp_cha_emil_valgeir_warhorse"
    ]
  },
  {
    "race": "skaven",
    "base": "wh2_main_skv_cha_lord_skrolk",
    "mounts": [
      "wh3_dlc29_skv_cha_lord_skrolk_cauldron"
    ]
  },
  {
    "race": "skaven",
    "base": "wh2_main_skv_cha_plague_priest_0",
    "mounts": [
      "wh3_dlc29_skv_cha_plague_priest_cauldron"
    ]
  },
  {
    "race": "tomb_kings",
    "base": "wh3_dlc29_tmb_cha_liche_high_priest_death",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_high_priest_death_skeletal_steed"
    ]
  },
  {
    "race": "tomb_kings",
    "base": "wh3_dlc29_tmb_cha_liche_high_priest_light",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_high_priest_light_skeletal_steed"
    ]
  },
  {
    "race": "tomb_kings",
    "base": "wh3_dlc29_tmb_cha_liche_high_priest_nehekhara",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_high_priest_nehekhara_skeletal_steed"
    ]
  },
  {
    "race": "tomb_kings",
    "base": "wh3_dlc29_tmb_cha_liche_high_priest_shadow",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_high_priest_shadow_skeletal_steed"
    ]
  },
  {
    "race": "tomb_kings",
    "base": "wh3_dlc29_tmb_cha_tomb_herald",
    "mounts": [
      "wh3_dlc29_tmb_cha_tomb_herald_skeletal_steed",
      "wh3_dlc29_tmb_cha_tomb_herald_skeleton_chariot"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_cst_cha_vampire_fleet_admiral_female_undeath",
    "mounts": [
      "wh3_dlc29_cst_cha_vampire_fleet_admiral_female_undeath_rotting_promethean"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_cst_cha_vampire_fleet_admiral_undeath",
    "mounts": [
      "wh3_dlc29_cst_cha_vampire_fleet_admiral_undeath_rotting_promethean"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_cst_cha_vampire_fleet_captain_undeath",
    "mounts": [
      "wh3_dlc29_cst_cha_vampire_fleet_captain_undeath_rotting_promethean"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_tmb_cha_liche_high_priest_undeath",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_high_priest_undeath_skeletal_steed"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_tmb_cha_liche_priest_undeath",
    "mounts": [
      "wh3_dlc29_tmb_cha_liche_priest_undeath_skeletal_steed"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_tmb_cha_tomb_herald",
    "mounts": [
      "wh3_dlc29_tmb_cha_tomb_herald_skeletal_steed",
      "wh3_dlc29_tmb_cha_tomb_herald_skeleton_chariot"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_vmp_cha_master_necromancer_undeath",
    "mounts": [
      "wh3_dlc29_vmp_cha_master_necromancer_undeath_barded_nightmare",
      "wh3_dlc29_vmp_cha_master_necromancer_undeath_corpse_cart",
      "wh3_dlc29_vmp_cha_master_necromancer_undeath_corpse_cart_balefire",
      "wh3_dlc29_vmp_cha_master_necromancer_undeath_corpse_cart_lodestone",
      "wh3_dlc29_vmp_cha_master_necromancer_undeath_hellsteed"
    ]
  },
  {
    "race": "undead_legions",
    "base": "wh3_dlc29_vmp_cha_necromancer_undeath",
    "mounts": [
      "wh3_dlc29_vmp_cha_necromancer_undeath_barded_nightmare",
      "wh3_dlc29_vmp_cha_necromancer_undeath_corpse_cart",
      "wh3_dlc29_vmp_cha_necromancer_undeath_corpse_cart_balefire",
      "wh3_dlc29_vmp_cha_necromancer_undeath_corpse_cart_lodestone"
    ]
  }
];

export function lordUnitCoverageErrors(rosterUnits, mounts) {
  const errors = [];
  for (const f of [...LORD_UNIT_FIXTURES, ...UPDATE_MOUNT_FIXTURES]) {
    for (const key of [f.base, ...f.mounts]) {
      if (!rosterUnits.get(f.race)?.has(key)) errors.push(`Reviewed 9.0 unit missing: ${f.race}/${key}`);
    }
    for (const key of f.mounts) {
      if (!mounts.some(r => r.base_unit_key === f.base && r.mounted_unit_key === key))
        errors.push(`Reviewed 9.0 mount relation missing: ${f.base} -> ${key}`);
    }
  }
  return errors;
}
