// Independently transcribed from 9.0 current main_units and custom-battle mount links.
// This fixture deliberately does not import the roster selector/configuration.
export const LORD_UNIT_FIXTURES = [
  { race: 'empire', base: 'wh3_dlc29_emp_cha_boris_todbringer_toddy_0', mounts: [1, 2, 3].map(i => `wh3_dlc29_emp_cha_boris_todbringer_toddy_${i}`) },
  { race: 'undead_legions', base: 'wh3_dlc29_vmp_cha_nagash', mounts: [] },
  { race: 'warriors_of_chaos', base: 'wh3_dlc29_chs_cha_glottkin', mounts: [] },
  { race: 'skaven', base: 'wh3_dlc29_skv_cha_thanquol', mounts: ['warpfire_braziers', 'warpfire_projectors'].map(s => `wh3_dlc29_skv_cha_thanquol_boneripper_${s}`) },
  { race: 'vampire_counts', base: 'wh3_dlc29_vmp_cha_neferata', mounts: ['barded_nightmare', 'coven_throne', 'dread_abyssal', 'hellsteed', 'zombie_dragon'].map(s => `wh3_dlc29_vmp_cha_neferata_${s}`) },
];

export function lordUnitCoverageErrors(rosterUnits, mounts) {
  const errors = [];
  for (const f of LORD_UNIT_FIXTURES) {
    for (const key of [f.base, ...f.mounts]) {
      if (!rosterUnits.get(f.race)?.has(key)) errors.push(`New playable lord unit missing: ${f.race}/${key}`);
    }
    for (const key of f.mounts) {
      if (!mounts.some(r => r.base_unit_key === f.base && r.mounted_unit_key === key))
        errors.push(`New playable lord mount relation missing: ${f.base} -> ${key}`);
    }
  }
  return errors;
}
