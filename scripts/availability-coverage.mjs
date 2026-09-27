import { readFileSync } from 'node:fs';
// Reviewed decisions are independent of the selector in scope-9.0.json.
export const decisions = JSON.parse(readFileSync(new URL('../docs/development/update-9.0/availability-decisions.json', import.meta.url))).cases;
export function availabilityCoverageErrors(rosters, mounts, abilities = []) {
  const errors = [];
  for (const c of decisions) {
    const rows = rosters.get(c.race) ?? new Map();
    const row = rows.get(c.unit);
    if (c.decision === 'exclude_duplicate') {
      if (row) errors.push(`Excluded duplicate present: ${c.race}/${c.unit}`);
      if (!rosters.get(c.canonical_race ?? c.race)?.has(c.canonical_unit)) errors.push(`Duplicate counterpart missing: ${c.race}/${c.canonical_unit}`);
    } else {
      if (!row) errors.push(`Approved configuration missing: ${c.race}/${c.unit}`);
      else if (row.availability_notes !== c.availability_note) errors.push(`Availability qualification missing or changed: ${c.unit}`);
      for (const a of c.required_abilities ?? [])
        if (!abilities.some(row => row.unit_key === c.unit && row.ability_key === a.ability_key && row.culture_key === a.culture_key))
          errors.push(`Required ability missing: ${c.unit}/${a.ability_key}/${a.culture_key}`);
      for (const e of c.mount_edges)
        if (!mounts.some(m => m.base_unit_key === e.base_unit && m.mounted_unit_key === c.unit))
          errors.push(`Approved mount edge missing: ${e.base_unit} -> ${c.unit}`);
    }
  }
  return errors;
}
