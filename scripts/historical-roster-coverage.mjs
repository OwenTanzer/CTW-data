import { readFileSync } from 'node:fs';
// Pinned, separately reconciled source decisions; deliberately independent of scope-9.0.json.
export const historicalDecisions = JSON.parse(readFileSync(new URL('../docs/development/update-9.0/historical-roster-decisions.json', import.meta.url))).cases;
export function historicalRosterErrors(rosters, mounts, permissions) {
  const errors = [];
  const edges = new Set(mounts.map(m => `${m.base_unit_key}/${m.mounted_unit_key}`));
  const fields = ['general_unit', 'siege_unit_attacker', 'siege_unit_defender', 'campaign_exclusive', 'supports_upgrades'];
  const typed = new Map(permissions.filter(p => p.record_type === 'faction_permission').map(p => [`${p.race_slug}/${p.unit_key}/${p.faction_permission_key}`, p]));
  for (const c of historicalDecisions) {
    const row = rosters.get(c.race)?.get(c.unit);
    if (c.decision === 'exclude_duplicate') {
      if (row) errors.push(`Excluded alias present: ${c.race}/${c.unit}`);
      const canonical = rosters.get(c.canonical_race)?.get(c.canonical_unit);
      if (!canonical) errors.push(`Canonical counterpart missing: ${c.race}/${c.unit}`);
      if (c.canonical_availability_note && canonical?.availability_notes !== c.canonical_availability_note)
        errors.push(`Alias permission qualification missing: ${c.unit}`);
      continue;
    }
    if (!row) errors.push(`Historical configuration missing: ${c.race}/${c.unit}`);
    else {
      if (row.source_land_unit_key !== c.land_unit) errors.push(`Wrong source identity: ${c.unit}`);
      if (row.availability_notes !== c.availability_note) errors.push(`Historical availability qualification missing: ${c.unit}`);
    }
    for (const e of c.mount_edges)
      if (!edges.has(`${e.base_unit}/${c.unit}`)) errors.push(`Historical mount edge missing: ${e.base_unit}/${c.unit}`);
    for (const p of c.permissions) {
      const actual = typed.get(`${c.race}/${c.unit}/${p.faction}`);
      if (!actual || fields.some(f => actual[f] !== p[f])) errors.push(`Historical exact permission missing or altered: ${c.race}/${c.unit}/${p.faction}`);
    }
  }
  return errors;
}
