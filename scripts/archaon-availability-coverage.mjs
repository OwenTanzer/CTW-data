import { readFileSync } from 'node:fs';
// Pinned source-script subtype relationships, resolved independently of the roster selector.
export const archaonEvidence = JSON.parse(readFileSync(new URL('../docs/development/update-9.0/archaon-scripted-availability.json', import.meta.url)));
export function archaonAvailabilityErrors(rosters, mounts, permissions) {
  const errors=[];
  const rows=rosters.get('warriors_of_chaos')??new Map();
  const edgeSet=new Set(mounts.map(m=>`${m.base_unit_key}/${m.mounted_unit_key}`));
  for (const c of archaonEvidence.cases) {
    const r=rows.get(c.unit);
    if (!r) {errors.push(`Archaon available unit missing: ${c.unit}`);continue;}
    if (r.source_land_unit_key!==c.source_land_unit) errors.push(`Wrong source unit for Archaon: ${c.unit}`);
    if (r.availability_notes!==c.availability_note) errors.push(`Archaon access qualification missing: ${c.unit}`);
    if (r.military_group_count!=='0') errors.push(`Invented military-group link for Archaon: ${c.unit}`);
    if (c.mount&&!edgeSet.has(`${c.base_unit}/${c.unit}`)) errors.push(`Archaon mount edge missing: ${c.base_unit}/${c.unit}`);
    const rowsForKey=permissions.filter(p=>p.race_slug==='warriors_of_chaos'&&p.unit_key===c.unit);
    if (rowsForKey.some(p=>p.record_type==='military_group'||p.faction_permission_key==='wh_main_chs_chaos'))
      errors.push(`Invented Warriors of Chaos DB permission for Archaon: ${c.unit}`);
    const actualPerms=rowsForKey.filter(p=>p.record_type==='faction_permission').map(p=>p.faction_permission_key).sort();
    if (JSON.stringify(actualPerms)!==JSON.stringify(c.source_permissions)) errors.push(`Archaon source faction permission changed: ${c.unit}`);
  }
  return errors;
}
