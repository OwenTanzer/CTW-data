// Describes evidence boundaries only; does not infer research availability.
export function fallbackLockLimitation(sourceFile) {
  if (sourceFile === 'script/campaign/wh2_dlc17_beastmen_tech.lua')
    return 'Beastmen challenge predicates/counters are not normalized; DB lock reasons and exact lock API site are retained.';
  return 'Scripted technology lock/unlock conditions are not normalized; DB lock reasons and exact lock API site are retained.';
}
