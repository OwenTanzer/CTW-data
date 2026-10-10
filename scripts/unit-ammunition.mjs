// Native weapon pool selection is independent of attachment/component identity.
// Capacity is not expenditure, attack eligibility or an infinite-supply limit.
export function missileSupply(weapon, land) {
  const flag = weapon?.use_secondary_ammo_pool;
  const ammoPool = flag === "true" ? "secondary" : flag === "false" ? "primary" : null;
  const raw = ammoPool ? land?.[`${ammoPool}_ammo`] : null;
  const ammo = raw === "" || raw === null || raw === undefined ? null : Number(raw);
  if (ammo !== null && !Number.isFinite(ammo)) throw new Error("Invalid native ammunition capacity");
  return { ammoPool, ammo };
}
