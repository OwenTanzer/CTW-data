import { parseRpfmTsv } from "./rpfm-tsv.mjs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSnapshot } from "./snapshot-build.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.resolve(ROOT, process.argv[2] ?? "work/source_exports__wh3__8.1.1");
const SNAPSHOT = await buildSnapshot(SOURCE);
const { UNIT_ROSTERS: ROSTERS } = SNAPSHOT.scope;
const PATCH = SNAPSHOT.context.patch;
const OUTPUT = path.resolve(ROOT, process.argv[3] ?? "work/generated_unit_stats__wh3__8.1.1");
const DB = path.join(SOURCE, "db");

const CONTEXT = { ...SNAPSHOT.context, unit_scale: "ultra" };

function parseDelimited(text, delimiter) {
  if (delimiter === "\t") return parseRpfmTsv(text);
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index++;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      if (field.endsWith("\r")) field = field.slice(0, -1);
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function recordsFromText(text, delimiter) {
  const rows = parseDelimited(text, delimiter);
  const headers = rows.shift() ?? [];
  return rows
    .filter((row) => row.some((value) => value !== "") && !String(row[0] ?? "").startsWith("#"))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

async function loadTable(name) {
  const file = path.join(DB, name, "data__.tsv");
  try {
    return recordsFromText(await readFile(file, "utf8"), "\t");
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function indexBy(rows, key) {
  return new Map(rows.map((row) => [row[key], row]));
}

function groupBy(rows, key) {
  const result = new Map();
  for (const row of rows) {
    const value = row[key];
    if (!result.has(value)) result.set(value, []);
    result.get(value).push(row);
  }
  return result;
}

function number(value) {
  if (value === "" || value === undefined || value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function bool(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function out(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function csvCell(value) {
  const text = out(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

async function writeCsv(file, columns, rows) {
  const text = [columns.join(","), ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(","))].join("\n") + "\n";
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, text, "utf8");
}

const TACTICAL_CATEGORY_OVERRIDES = new Map([
  ["wh2_dlc12_lzd_mon_salamander_pack_0", "monster"],
  ["wh2_dlc12_lzd_mon_salamander_pack_0_blessed", "monster"],
  ["wh2_dlc13_lzd_mon_razordon_pack_0", "monster"],
  ["wh2_dlc13_lzd_mon_razordon_pack_0_blessed", "monster"],
  ["wh3_dlc25_nur_mon_soul_grinder_0_ror", "monster"],
  ["wh3_main_nur_mon_soul_grinder_0", "monster"],
  ["wh3_main_tze_mon_soul_grinder_0", "monster"],
  ["wh_dlc03_bst_inf_cygor_0", "monster"],
]);

function tacticalCategory(unitKey, main, land) {
  const override = TACTICAL_CATEGORY_OVERRIDES.get(unitKey);
  if (override) return override;
  if (["lord", "hero"].includes(main.caste)) return "character";
  if (land.category === "artillery" || land.class === "art_fld") return "artillery";
  if (["monster", "warmachine"].includes(main.caste) || ["war_machine", "war_beast"].includes(land.category)) return "monster";
  if (["cav", "chariot"].includes(land.class) || ["cavalry", "chariot"].includes(land.category)) return "cavalry";
  if (land.category.includes("inf")) return "infantry";
  return land.category || main.caste || "unknown";
}

const tables = Object.fromEntries(
  await Promise.all(
    [
      "main_units_tables",
      "land_units_tables",
      "battle_entities_tables",
      "battlefield_engines_tables",
      "mounts_tables",
      "land_units_to_extra_engines_tables",
      "unit_armour_types_tables",
      "unit_shield_types_tables",
      "melee_weapons_tables",
      "missile_weapons_tables",
      "missile_weapons_to_projectiles_tables",
      "unit_missile_weapon_junctions_tables",
      "projectiles_tables",
      "projectiles_explosions_tables",
      "projectile_penetration_junctions_tables",
      "projectile_shrapnels_tables",
      "projectile_homing_params_tables",
      "projectiles_scaling_damages_tables",
      "land_units_to_unit_abilites_junctions_tables",
      "unit_attributes_to_groups_junctions_tables",
      "units_to_groupings_military_permissions_tables",
      "units_custom_battle_permissions_tables",
      "units_custom_battle_mounts_tables",
    ].map(async (name) => [name, await loadTable(name)]),
  ),
);

const mainByKey = indexBy(tables.main_units_tables, "unit");
const landByKey = indexBy(tables.land_units_tables, "key");
const entityByKey = indexBy(tables.battle_entities_tables, "key");
const engineByKey = indexBy(tables.battlefield_engines_tables, "key");
const mountByKey = indexBy(tables.mounts_tables, "key");
const armourByKey = indexBy(tables.unit_armour_types_tables, "key");
const shieldByKey = indexBy(tables.unit_shield_types_tables, "key");
const meleeByKey = indexBy(tables.melee_weapons_tables, "key");
const missileByKey = indexBy(tables.missile_weapons_tables, "key");
const projectileByKey = indexBy(tables.projectiles_tables, "key");
const explosionByKey = indexBy(tables.projectiles_explosions_tables, "key");
const penetrationByKey = indexBy(tables.projectile_penetration_junctions_tables, "key");
const shrapnelByKey = indexBy(tables.projectile_shrapnels_tables, "key");
const homingByKey = indexBy(tables.projectile_homing_params_tables, "key");
const scalingDamageByKey = indexBy(tables.projectiles_scaling_damages_tables, "key");
const extraEnginesByUnit = groupBy(tables.land_units_to_extra_engines_tables, "land_unit");
const unitMissilesByUnit = groupBy(tables.unit_missile_weapon_junctions_tables, "unit");
const alternateProjectilesByWeapon = groupBy(tables.missile_weapons_to_projectiles_tables, "missile_weapon");
const abilitiesByUnit = groupBy(tables.land_units_to_unit_abilites_junctions_tables, "land_unit");
const attributesByGroup = groupBy(tables.unit_attributes_to_groups_junctions_tables, "attribute_group");
const groupingLinks = groupBy(tables.units_to_groupings_military_permissions_tables, "military_group");
const permissionsByUnit = groupBy(tables.units_custom_battle_permissions_tables, "unit");
const mountVariantsByBase = groupBy(tables.units_custom_battle_mounts_tables, "base_unit");

const locFile = path.join(SOURCE, "text", "db", "land_units__.loc.tsv");
const loc = indexBy(recordsFromText(await readFile(locFile, "utf8"), "\t"), "key");
const unitName = (landKey) => loc.get(`land_units_onscreen_name_${landKey}`)?.text ?? "";

function primaryBody(main, land) {
  if (land.engine) {
    const engine = engineByKey.get(land.engine);
    return {
      role: "engine",
      relationshipKey: land.engine,
      entityKey: engine?.battle_entity ?? "",
      count: number(land.num_engines) ?? 1,
      linkSource: "land_units.engine",
    };
  }
  if (land.mount) {
    const mount = mountByKey.get(land.mount);
    return {
      role: "mount",
      relationshipKey: land.mount,
      entityKey: mount?.entity ?? "",
      count: number(land.num_mounts) ?? 1,
      linkSource: "land_units.mount",
    };
  }
  return {
    role: "man",
    relationshipKey: "",
    entityKey: land.man_entity,
    count: number(main.num_men) ?? 0,
    linkSource: "land_units.man_entity",
  };
}

function projectileKeysForWeapon(weaponKey) {
  const weapon = missileByKey.get(weaponKey);
  const keys = [weapon?.default_projectile, ...(alternateProjectilesByWeapon.get(weaponKey) ?? []).map((row) => row.projectile)].filter(Boolean);
  return [...new Set(keys)];
}

function missileLinksForUnit(unitKey, land) {
  const candidates = [];
  const add = (weaponKey, componentRole, slot, linkSource, ammoPool, ammo) => {
    if (!weaponKey) return;
    candidates.push({ weaponKey, componentRole, slot, linkSource, ammoPool, ammo });
  };

  add(land.primary_missile_weapon, "unit", "primary", "land_units.primary_missile_weapon", "primary", number(land.primary_ammo));
  for (const junction of unitMissilesByUnit.get(unitKey) ?? []) {
    const existingPrimary = junction.missile_weapon === land.primary_missile_weapon;
    add(
      junction.missile_weapon,
      junction.battle_entity_stats_override ? "entity_override" : "unit",
      existingPrimary ? "primary" : "additional",
      "unit_missile_weapon_junctions",
      existingPrimary ? "primary" : "secondary",
      number(existingPrimary ? land.primary_ammo : land.secondary_ammo),
    );
  }
  if (land.engine) {
    add(engineByKey.get(land.engine)?.missile_weapon, "engine", "engine", "battlefield_engines.missile_weapon", "primary", number(land.primary_ammo));
  }
  for (const extra of extraEnginesByUnit.get(unitKey) ?? []) {
    add(engineByKey.get(extra.battle_engine)?.missile_weapon, "extra_engine", `extra_engine_${extra.attach_articulation}`, "battlefield_engines.missile_weapon", "secondary", number(land.secondary_ammo));
  }

  const unique = [];
  const seen = new Set();
  for (const candidate of candidates) {
    const signature = `${candidate.weaponKey}\u0000${candidate.componentRole}\u0000${candidate.slot}`;
    if (!seen.has(signature)) {
      seen.add(signature);
      unique.push(candidate);
    }
  }
  return unique;
}

const NORMALIZED_COLUMNS = [
  "game", "patch", "steam_build_id", "unit_scale", "faction_name", "faction_key", "subculture_key", "military_group",
  "roster_scope", "is_faction_exclusive", "military_group_count", "permitted_faction_count", "availability_notes",
  "unit_key", "unit_name", "tactical_category", "source_unit_class", "source_caste", "tier", "weight", "in_encyclopedia", "is_renown",
  "entity_count", "model_count", "source_total_component_count", "hp_per_entity", "total_hp", "barrier_health", "primary_component_role", "primary_target_size", "is_large", "is_single_entity",
  "armour", "shield_block_chance", "melee_defence", "leadership", "physical_resistance", "missile_resistance", "spell_resistance", "ward_save", "fire_resistance",
  "melee_attack", "weapon_base_damage", "weapon_ap_damage", "charge_bonus", "bonus_vs_infantry", "bonus_vs_large", "attack_interval", "max_splash_targets", "melee_is_magical", "melee_is_flaming", "speed", "mass",
  "has_missile_weapon", "accuracy", "ammunition", "range", "reload_time", "missile_base_damage", "missile_ap_damage", "missile_bonus_vs_infantry", "missile_bonus_vs_large", "projectiles_per_shot", "shots_per_volley", "burst_size", "burst_shot_delay", "projectile_velocity", "projectile_spread", "marksmanship_bonus", "calibration_distance", "calibration_area", "missile_is_magical", "missile_is_flaming",
  "projectile_shot_type", "projectile_penetration_class", "projectile_expiry_range", "projectile_can_damage_buildings", "projectile_can_damage_allies", "projectile_is_spell", "projectile_contact_effect",
  "explosion_key", "explosion_base_damage", "explosion_ap_damage", "explosion_radius", "explosion_is_magical", "explosion_is_flaming", "explosion_affects_allies", "explosion_contact_effect",
  "multiplayer_cost", "campaign_recruit_cost", "campaign_upkeep",
  "source_main_unit_key", "source_land_unit_key", "source_battle_entity_key", "source_man_entity_key", "source_mount_entity_key", "source_engine_entity_key", "source_melee_weapon_key", "source_missile_weapon_key", "source_projectile_key",
  "extracted_at_utc", "data_quality_status", "notes",
];

const COMPONENT_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "component_role", "relationship_key", "battle_entity_key", "component_count", "base_hp_per_component", "bonus_hp_per_component", "known_hp_total", "size_class", "is_large", "is_primary_health_pool", "can_be_targeted", "link_source", "notes"];
const WEAPON_LINK_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "attack_type", "component_role", "slot", "melee_weapon_key", "missile_weapon_key", "projectile_key", "is_default_projectile", "ammunition_pool", "ammunition", "link_source"];
const PROJECTILE_COLUMNS = ["game", "patch", "projectile_key", "category", "shot_type", "projectile_number", "effective_range", "minimum_range", "muzzle_velocity", "marksmanship_bonus", "spread", "base_damage", "ap_damage", "base_reload_time", "calibration_distance", "calibration_area", "bonus_vs_infantry", "bonus_vs_large", "burst_size", "burst_shot_delay", "shots_per_volley", "collision_radius", "mass", "gravity", "ignition_amount", "is_magical", "can_target_airborne", "can_damage_allies", "can_damage_buildings", "building_damage_multiplier", "projectile_penetration", "penetration_entity_size_cap", "max_penetration", "expiry_range", "expire_on_impact", "can_bounce", "can_roll", "homing_params", "scaling_damage", "contact_stat_effect", "explosion_key", "shrapnel_key", "is_spell"];
const EXPLOSION_COLUMNS = ["game", "patch", "explosion_key", "detonator_type", "detonation_type", "radius", "duration", "speed", "base_damage", "ap_damage", "force", "ignition_amount", "is_magical", "affects_allies", "contact_phase_effect", "shrapnel_key", "is_spell"];
const ABILITY_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "ability_key", ...(PATCH === "9.0" ? ["culture_key"] : [])];
const ATTRIBUTE_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "attribute_key"];
const CONTACT_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "attack_type", "source_key", "effect_key"];
const ROSTER_COLUMNS = ["record_type", "game", "patch", "unit_scale", "race_slug", "unit_key", "military_group", "faction_permission_key", "general_unit", "siege_unit_attacker", "siege_unit_defender", "campaign_exclusive", "supports_upgrades"];
const MOUNT_VARIANT_COLUMNS = ["game", "patch", "unit_scale", "base_unit_key", "mounted_unit_key", "icon_name"];
const QUALITY_COLUMNS = ["game", "patch", "unit_scale", "unit_key", "severity", "flag", "detail"];
const SCHEMA_INVENTORY_COLUMNS = ["schema_version", "dataset", "column_position", "column_name"];

const normalizedByRoster = new Map();
const components = [];
const weaponLinks = [];
const projectileKeysUsed = new Set();
const explosionKeysUsed = new Set();
const abilities = [];
const attributes = [];
const contacts = [];
const rosterRows = [];
const mountVariantRows = [];
const quality = [];
const selectedUnitKeys = new Set();
const extractedAt = new Date().toISOString();

for (const roster of ROSTERS) {
  const rows = [];
  const membershipsByUnit = new Map();
  for (const militaryGroup of roster.military_groups) {
    for (const membership of groupingLinks.get(militaryGroup) ?? []) {
      if (!membershipsByUnit.has(membership.unit)) membershipsByUnit.set(membership.unit, new Set());
      membershipsByUnit.get(membership.unit).add(militaryGroup);
    }
  }
  // Reviewed current units can have custom-battle permissions without military-group membership.
  // Retain the real permission relation; never synthesize a military-group link.
  for (const key of roster.permission_units ?? []) {
    if (!(permissionsByUnit.get(key) ?? []).some(p => p.faction === (roster.permission_unit_factions?.[key] ?? roster.faction_key)))
      throw Error(`Missing source faction permission for ${roster.slug}/${key}`);
  }
  const unitKeys = [...new Set([...membershipsByUnit.keys(), ...(roster.permission_units ?? [])])].sort();
  for (const unitKey of unitKeys) {
    selectedUnitKeys.add(unitKey);
    const main = mainByKey.get(unitKey);
    const land = main ? landByKey.get(main.land_unit) : null;
    if (!main || !land) {
      quality.push({ ...CONTEXT, unit_key: unitKey, severity: "error", flag: "missing_core_source", detail: `main=${Boolean(main)} land=${Boolean(land)}` });
      continue;
    }

    const body = primaryBody(main, land);
    const bodyEntity = entityByKey.get(body.entityKey);
    const manEntity = entityByKey.get(land.man_entity);
    const armour = armourByKey.get(land.armour);
    const shield = shieldByKey.get(land.shield);
    const melee = meleeByKey.get(land.primary_melee_weapon);
    const missileLinks = missileLinksForUnit(unitKey, land);
    const primaryMissileLink = missileLinks.find((link) => link.slot === "primary") ?? missileLinks.find((link) => link.componentRole === "engine") ?? missileLinks[0];
    const primaryMissile = primaryMissileLink ? missileByKey.get(primaryMissileLink.weaponKey) : null;
    const primaryProjectile = primaryMissile ? projectileByKey.get(primaryMissile.default_projectile) : null;
    const explosion = primaryProjectile?.explosion_type ? explosionByKey.get(primaryProjectile.explosion_type) : null;
    const bodyBaseHp = number(bodyEntity?.hit_points);
    const manBaseHp = number(manEntity?.hit_points);
    const bonusHp = number(land.bonus_hit_points) ?? 0;
    const modelCount = body.count;
    const isCrewedArtillery = body.role === "engine" && land.category === "artillery";
    const hpPerEntity = bodyBaseHp === null ? null : bodyBaseHp + bonusHp + (isCrewedArtillery ? (manBaseHp ?? 0) : 0);
    const totalHp = hpPerEntity === null
      ? null
      : isCrewedArtillery && manBaseHp !== null
        ? (number(main.num_men) ?? 0) * (manBaseHp + bonusHp) + modelCount * bodyBaseHp
        : hpPerEntity * modelCount;
    const isLarge = bodyEntity ? ["large", "very_large"].includes(bodyEntity.size) : null;
    const militaryGroups = [...(membershipsByUnit.get(unitKey) ?? [])].sort();
    const permissionRows = permissionsByUnit.get(unitKey) ?? [];
    const permittedFactionCount = new Set(permissionRows.map((permission) => permission.faction).filter(Boolean)).size;
    const isCore = militaryGroups.includes(roster.military_group);
    const isFactionExclusive = !isCore;
    const rosterScope = isCore
      ? militaryGroups.length > 1 ? "race_core_and_variant" : "race_core"
      : permittedFactionCount === 1 ? "faction_exclusive" : "shared_variant";
    const errors = [];
    if (!bodyEntity) errors.push(`missing battle entity ${body.entityKey || "<blank>"}`);
    if (!armour) errors.push(`missing armour type ${land.armour || "<blank>"}`);
    if (!shield) errors.push(`missing shield type ${land.shield || "<blank>"}`);
    if (land.primary_melee_weapon && !melee) errors.push(`missing melee weapon ${land.primary_melee_weapon}`);
    if (primaryMissileLink && (!primaryMissile || !primaryProjectile)) errors.push(`missing missile/projectile for ${primaryMissileLink.weaponKey}`);
    for (const detail of errors) quality.push({ ...CONTEXT, unit_key: unitKey, severity: "error", flag: "unresolved_join", detail });

    const row = {
      ...CONTEXT,
      faction_name: roster.faction_name,
      faction_key: roster.faction_key,
      subculture_key: roster.subculture_key,
      military_group: roster.military_group,
      roster_scope: rosterScope,
      is_faction_exclusive: isFactionExclusive,
      military_group_count: militaryGroups.length,
      permitted_faction_count: permittedFactionCount,
      availability_notes: roster.permission_unit_notes?.[unitKey] ?? (militaryGroups.length === 0 ? "Included through reviewed source custom-battle faction permission; no military-group membership. See unit_rosters." : isFactionExclusive ? "Faction-variant roster unit; see unit_rosters for exact military-group and faction permissions." : ""),
      unit_key: unitKey,
      unit_name: unitName(main.land_unit),
      tactical_category: tacticalCategory(unitKey, main, land),
      source_unit_class: land.class,
      source_caste: main.caste,
      tier: number(main.tier),
      weight: main.weight,
      in_encyclopedia: bool(main.in_encyclopedia),
      is_renown: bool(main.is_renown),
      entity_count: modelCount,
      model_count: modelCount,
      source_total_component_count: number(main.num_men),
      hp_per_entity: hpPerEntity,
      total_hp: totalHp,
      barrier_health: number(main.barrier_health),
      primary_component_role: body.role,
      primary_target_size: bodyEntity?.size ?? "",
      is_large: isLarge,
      is_single_entity: modelCount === 1,
      armour: number(armour?.armour_value),
      shield_block_chance: number(shield?.missile_block_chance),
      melee_defence: number(land.melee_defence),
      leadership: number(land.morale),
      physical_resistance: number(land.damage_mod_physical),
      missile_resistance: number(land.damage_mod_missile),
      spell_resistance: number(land.damage_mod_magic),
      ward_save: number(land.damage_mod_all),
      fire_resistance: number(land.damage_mod_flame),
      melee_attack: number(land.melee_attack),
      weapon_base_damage: number(melee?.damage),
      weapon_ap_damage: number(melee?.ap_damage),
      charge_bonus: number(land.charge_bonus),
      bonus_vs_infantry: number(melee?.bonus_v_infantry),
      bonus_vs_large: number(melee?.bonus_v_large),
      attack_interval: number(melee?.melee_attack_interval),
      max_splash_targets: number(melee?.splash_attack_max_attacks),
      melee_is_magical: bool(melee?.is_magical),
      melee_is_flaming: (number(melee?.ignition_amount) ?? 0) > 0,
      speed: number(bodyEntity?.run_speed),
      mass: number(bodyEntity?.mass),
      has_missile_weapon: Boolean(primaryProjectile),
      accuracy: primaryProjectile ? number(land.accuracy) : null,
      ammunition: primaryProjectile ? primaryMissileLink?.ammo : null,
      range: number(primaryProjectile?.effective_range),
      reload_time: number(primaryProjectile?.base_reload_time),
      missile_base_damage: number(primaryProjectile?.damage),
      missile_ap_damage: number(primaryProjectile?.ap_damage),
      missile_bonus_vs_infantry: number(primaryProjectile?.bonus_v_infantry),
      missile_bonus_vs_large: number(primaryProjectile?.bonus_v_large),
      projectiles_per_shot: number(primaryProjectile?.projectile_number),
      shots_per_volley: number(primaryProjectile?.shots_per_volley),
      burst_size: number(primaryProjectile?.burst_size),
      burst_shot_delay: number(primaryProjectile?.burst_shot_delay),
      projectile_velocity: number(primaryProjectile?.muzzle_velocity),
      projectile_spread: number(primaryProjectile?.spread),
      marksmanship_bonus: number(primaryProjectile?.marksmanship_bonus),
      calibration_distance: number(primaryProjectile?.calibration_distance),
      calibration_area: number(primaryProjectile?.calibration_area),
      missile_is_magical: primaryProjectile ? bool(primaryProjectile.is_magical) : null,
      missile_is_flaming: primaryProjectile ? (number(primaryProjectile.ignition_amount) ?? 0) > 0 : null,
      projectile_shot_type: primaryProjectile?.shot_type ?? "",
      projectile_penetration_class: primaryProjectile?.projectile_penetration ?? "",
      projectile_expiry_range: number(primaryProjectile?.expiry_range),
      projectile_can_damage_buildings: primaryProjectile ? bool(primaryProjectile.can_damage_buildings) : null,
      projectile_can_damage_allies: primaryProjectile ? bool(primaryProjectile.can_damage_allies) : null,
      projectile_is_spell: primaryProjectile ? bool(primaryProjectile.is_spell) : null,
      projectile_contact_effect: primaryProjectile?.contact_stat_effect ?? "",
      explosion_key: explosion?.key ?? "",
      explosion_base_damage: number(explosion?.detonation_damage),
      explosion_ap_damage: number(explosion?.detonation_damage_ap),
      explosion_radius: number(explosion?.detonation_radius),
      explosion_is_magical: explosion ? bool(explosion.is_magical) : null,
      explosion_is_flaming: explosion ? (number(explosion.ignition_amount) ?? 0) > 0 : null,
      explosion_affects_allies: explosion ? bool(explosion.affects_allies) : null,
      explosion_contact_effect: explosion?.contact_phase_effect ?? "",
      multiplayer_cost: number(main.multiplayer_cost),
      campaign_recruit_cost: number(main.recruitment_cost),
      campaign_upkeep: number(main.upkeep_cost),
      source_main_unit_key: main.unit,
      source_land_unit_key: main.land_unit,
      source_battle_entity_key: body.entityKey,
      source_man_entity_key: land.man_entity,
      source_mount_entity_key: land.mount ? mountByKey.get(land.mount)?.entity ?? "" : "",
      source_engine_entity_key: land.engine ? engineByKey.get(land.engine)?.battle_entity ?? "" : "",
      source_melee_weapon_key: land.primary_melee_weapon,
      source_missile_weapon_key: primaryMissileLink?.weaponKey ?? "",
      source_projectile_key: primaryProjectile?.key ?? "",
      extracted_at_utc: extractedAt,
      data_quality_status: errors.length ? "error" : "complete",
      notes: errors.join("; "),
    };
    rows.push(row);

    const componentRows = [];
    const addComponent = (role, relationshipKey, entityKey, count, primary, linkSource, note = "", componentBonus = primary ? bonusHp : 0, baseHpOverride = null) => {
      if (!entityKey || !count) return;
      const entity = entityByKey.get(entityKey);
      const entityHp = baseHpOverride ?? number(entity?.hit_points);
      componentRows.push({
        ...CONTEXT,
        unit_key: unitKey,
        component_role: role,
        relationship_key: relationshipKey,
        battle_entity_key: entityKey,
        component_count: count,
        base_hp_per_component: entityHp,
        bonus_hp_per_component: componentBonus,
        known_hp_total: entityHp === null ? null : (entityHp + componentBonus) * count,
        size_class: entity?.size ?? "",
        is_large: entity ? ["large", "very_large"].includes(entity.size) : null,
        is_primary_health_pool: primary,
        can_be_targeted: primary ? true : null,
        link_source: linkSource,
        notes: note || (primary ? "" : "Targetability is not encoded by these database joins."),
      });
    };
    addComponent(body.role, body.relationshipKey, body.entityKey, body.count, true, body.linkSource, isCrewedArtillery ? "Primary artillery body includes the engine entity plus its crew entity slot." : "", bonusHp, isCrewedArtillery && bodyBaseHp !== null && manBaseHp !== null ? bodyBaseHp + manBaseHp : null);
    if (body.role !== "man") {
      const secondaryCount = Math.max(0, (number(main.num_men) ?? 0) - body.count);
      addComponent("crew_or_rider", "", land.man_entity, secondaryCount, false, "main_units.num_men minus primary body count", "", isCrewedArtillery ? bonusHp : 0);
    }
    for (const extra of extraEnginesByUnit.get(unitKey) ?? []) {
      const extraEngine = engineByKey.get(extra.battle_engine);
      addComponent("extra_engine", extra.battle_engine, extraEngine?.battle_entity, 1, false, "land_units_to_extra_engines_tables", `attach_articulation=${extra.attach_articulation}`);
    }
    components.push(...componentRows);

    if (land.primary_melee_weapon) {
      weaponLinks.push({ ...CONTEXT, unit_key: unitKey, attack_type: "melee", component_role: "unit", slot: "primary", melee_weapon_key: land.primary_melee_weapon, missile_weapon_key: "", projectile_key: "", is_default_projectile: "", ammunition_pool: "", ammunition: "", link_source: "land_units.primary_melee_weapon" });
      if (melee?.contact_phase) contacts.push({ ...CONTEXT, unit_key: unitKey, attack_type: "melee", source_key: melee.key, effect_key: melee.contact_phase });
    }
    for (const link of missileLinks) {
      const weapon = missileByKey.get(link.weaponKey);
      for (const projectileKey of projectileKeysForWeapon(link.weaponKey)) {
        projectileKeysUsed.add(projectileKey);
        const projectile = projectileByKey.get(projectileKey);
        if (projectile?.explosion_type) explosionKeysUsed.add(projectile.explosion_type);
        weaponLinks.push({ ...CONTEXT, unit_key: unitKey, attack_type: "missile", component_role: link.componentRole, slot: link.slot, melee_weapon_key: "", missile_weapon_key: link.weaponKey, projectile_key: projectileKey, is_default_projectile: projectileKey === weapon?.default_projectile, ammunition_pool: link.ammoPool, ammunition: link.ammo, link_source: link.linkSource });
        if (projectile?.contact_stat_effect) contacts.push({ ...CONTEXT, unit_key: unitKey, attack_type: "projectile", source_key: projectileKey, effect_key: projectile.contact_stat_effect });
        const projectileExplosion = projectile?.explosion_type ? explosionByKey.get(projectile.explosion_type) : null;
        if (projectileExplosion?.contact_phase_effect) contacts.push({ ...CONTEXT, unit_key: unitKey, attack_type: "explosion", source_key: projectileExplosion.key, effect_key: projectileExplosion.contact_phase_effect });
      }
    }
    for (const ability of abilitiesByUnit.get(main.land_unit) ?? []) abilities.push({ ...CONTEXT, unit_key: unitKey, ability_key: ability.ability, culture_key: ability.culture });
    for (const attribute of attributesByGroup.get(land.attribute_group) ?? []) attributes.push({ ...CONTEXT, unit_key: unitKey, attribute_key: attribute.attribute });
    for (const militaryGroup of militaryGroups) {
      rosterRows.push({ record_type: "military_group", ...CONTEXT, race_slug: roster.slug, unit_key: unitKey, military_group: militaryGroup, faction_permission_key: "", general_unit: "", siege_unit_attacker: "", siege_unit_defender: "", campaign_exclusive: "", supports_upgrades: "" });
    }
    for (const permission of permissionRows) {
      rosterRows.push({ record_type: "faction_permission", ...CONTEXT, race_slug: roster.slug, unit_key: unitKey, military_group: "", faction_permission_key: permission.faction, general_unit: permission.general_unit, siege_unit_attacker: permission.siege_unit_attacker, siege_unit_defender: permission.siege_unit_defender, campaign_exclusive: permission.campaign_exclusive, supports_upgrades: permission.supports_upgrades });
    }
  }
  normalizedByRoster.set(roster, rows);
}

for (const unitKey of [...selectedUnitKeys].sort()) {
  for (const variant of mountVariantsByBase.get(unitKey) ?? []) mountVariantRows.push({ ...CONTEXT, base_unit_key: unitKey, mounted_unit_key: variant.mounted_unit, icon_name: variant.icon_name });
}

const projectileRows = [...projectileKeysUsed].sort().map((key) => {
  const row = projectileByKey.get(key);
  const penetration = penetrationByKey.get(row?.projectile_penetration);
  return {
    ...CONTEXT,
    projectile_key: key,
    category: row?.category,
    shot_type: row?.shot_type,
    projectile_number: number(row?.projectile_number),
    effective_range: number(row?.effective_range),
    minimum_range: number(row?.minimum_range),
    muzzle_velocity: number(row?.muzzle_velocity),
    marksmanship_bonus: number(row?.marksmanship_bonus),
    spread: number(row?.spread),
    base_damage: number(row?.damage),
    ap_damage: number(row?.ap_damage),
    base_reload_time: number(row?.base_reload_time),
    calibration_distance: number(row?.calibration_distance),
    calibration_area: number(row?.calibration_area),
    bonus_vs_infantry: number(row?.bonus_v_infantry),
    bonus_vs_large: number(row?.bonus_v_large),
    burst_size: number(row?.burst_size),
    burst_shot_delay: number(row?.burst_shot_delay),
    shots_per_volley: number(row?.shots_per_volley),
    collision_radius: number(row?.collision_radius),
    mass: number(row?.mass),
    gravity: number(row?.gravity),
    ignition_amount: number(row?.ignition_amount),
    is_magical: bool(row?.is_magical),
    can_target_airborne: bool(row?.can_target_airborne),
    can_damage_allies: bool(row?.can_damage_allies),
    can_damage_buildings: bool(row?.can_damage_buildings),
    building_damage_multiplier: number(row?.building_damage_multiplier),
    projectile_penetration: row?.projectile_penetration,
    penetration_entity_size_cap: penetration?.entity_size_cap,
    max_penetration: number(penetration?.max_penetration),
    expiry_range: number(row?.expiry_range),
    expire_on_impact: bool(row?.expire_on_impact),
    can_bounce: bool(row?.can_bounce),
    can_roll: bool(row?.can_roll),
    homing_params: row?.homing_params,
    scaling_damage: row?.scaling_damage,
    contact_stat_effect: row?.contact_stat_effect,
    explosion_key: row?.explosion_type,
    shrapnel_key: explosionByKey.get(row?.explosion_type)?.shrapnel ?? "",
    is_spell: bool(row?.is_spell),
  };
});

const explosionRows = [...explosionKeysUsed].sort().map((key) => {
  const row = explosionByKey.get(key);
  return {
    ...CONTEXT,
    explosion_key: key,
    detonator_type: row?.detonator_type,
    detonation_type: row?.detonation_type,
    radius: number(row?.detonation_radius),
    duration: number(row?.detonation_duration),
    speed: number(row?.detonation_speed),
    base_damage: number(row?.detonation_damage),
    ap_damage: number(row?.detonation_damage_ap),
    force: number(row?.detonation_force),
    ignition_amount: number(row?.ignition_amount),
    is_magical: bool(row?.is_magical),
    affects_allies: bool(row?.affects_allies),
    contact_phase_effect: row?.contact_phase_effect,
    shrapnel_key: row?.shrapnel,
    is_spell: bool(row?.is_spell),
  };
});

const uniqueRows = (rows, columns) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = columns.map((column) => out(row[column])).join("\u0000");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const componentRows = uniqueRows(components, ["unit_key", "component_role", "relationship_key", "battle_entity_key", "component_count", "is_primary_health_pool"]);
const weaponLinkRows = uniqueRows(weaponLinks, ["unit_key", "attack_type", "component_role", "slot", "melee_weapon_key", "missile_weapon_key", "projectile_key"]);
const abilityRows = uniqueRows(abilities, ["unit_key", "ability_key", ...(PATCH === "9.0" ? ["culture_key"] : [])]);
const attributeRows = uniqueRows(attributes, ["unit_key", "attribute_key"]);
const contactRows = uniqueRows(contacts, ["unit_key", "attack_type", "source_key", "effect_key"]);
const unitRosterRows = uniqueRows(rosterRows, ["record_type", "race_slug", "unit_key", "military_group", "faction_permission_key"]);
const unitMountVariantRows = uniqueRows(mountVariantRows, ["base_unit_key", "mounted_unit_key"]);
const qualityRows = uniqueRows(quality, ["unit_key", "flag", "detail"]);

for (const [roster, rows] of normalizedByRoster) {
  await writeCsv(path.join(OUTPUT, "normalized", `${roster.slug}__wh3__${PATCH}__ultra.csv`), NORMALIZED_COLUMNS, rows);
}
await writeCsv(path.join(OUTPUT, "lookups", `unit_components__wh3__${PATCH}__ultra.csv`), COMPONENT_COLUMNS, componentRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_weapon_links__wh3__${PATCH}__ultra.csv`), WEAPON_LINK_COLUMNS, weaponLinkRows);
await writeCsv(path.join(OUTPUT, "lookups", `projectiles__wh3__${PATCH}.csv`), PROJECTILE_COLUMNS, projectileRows);
await writeCsv(path.join(OUTPUT, "lookups", `explosions__wh3__${PATCH}.csv`), EXPLOSION_COLUMNS, explosionRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_abilities__wh3__${PATCH}__ultra.csv`), ABILITY_COLUMNS, abilityRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_attributes__wh3__${PATCH}__ultra.csv`), ATTRIBUTE_COLUMNS, attributeRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_contact_effects__wh3__${PATCH}__ultra.csv`), CONTACT_COLUMNS, contactRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_rosters__wh3__${PATCH}__ultra.csv`), ROSTER_COLUMNS, unitRosterRows);
await writeCsv(path.join(OUTPUT, "lookups", `unit_mount_variants__wh3__${PATCH}__ultra.csv`), MOUNT_VARIANT_COLUMNS, unitMountVariantRows);
await writeCsv(path.join(OUTPUT, "lookups", `data_quality_flags__wh3__${PATCH}__ultra.csv`), QUALITY_COLUMNS, qualityRows);
const schemaInventory = [
  [`normalized/<faction>__wh3__${PATCH}__ultra.csv`, NORMALIZED_COLUMNS],
  [`lookups/unit_components__wh3__${PATCH}__ultra.csv`, COMPONENT_COLUMNS],
  [`lookups/unit_weapon_links__wh3__${PATCH}__ultra.csv`, WEAPON_LINK_COLUMNS],
  [`lookups/projectiles__wh3__${PATCH}.csv`, PROJECTILE_COLUMNS],
  [`lookups/explosions__wh3__${PATCH}.csv`, EXPLOSION_COLUMNS],
  [`lookups/unit_abilities__wh3__${PATCH}__ultra.csv`, ABILITY_COLUMNS],
  [`lookups/unit_attributes__wh3__${PATCH}__ultra.csv`, ATTRIBUTE_COLUMNS],
  [`lookups/unit_contact_effects__wh3__${PATCH}__ultra.csv`, CONTACT_COLUMNS],
  [`lookups/unit_rosters__wh3__${PATCH}__ultra.csv`, ROSTER_COLUMNS],
  [`lookups/unit_mount_variants__wh3__${PATCH}__ultra.csv`, MOUNT_VARIANT_COLUMNS],
  [`lookups/data_quality_flags__wh3__${PATCH}__ultra.csv`, QUALITY_COLUMNS],
].flatMap(([dataset, columns]) => columns.map((column_name, index) => ({ schema_version: SNAPSHOT.unitSchema, dataset, column_position: index + 1, column_name })));
await writeCsv(path.join(OUTPUT, `schema_inventory__v${SNAPSHOT.unitSchema}.csv`), SCHEMA_INVENTORY_COLUMNS, schemaInventory);

const counts = Object.fromEntries([...normalizedByRoster].map(([roster, rows]) => [roster.slug, rows.length]));
const manifest = {
  ...CONTEXT,
  schema_version: SNAPSHOT.unitSchema,
  built_at_utc: extractedAt,
  source_manifest: path.relative(ROOT, path.join(SOURCE, "source_manifest.json")).replaceAll(path.sep, "/"),
  roster_counts: counts,
  total_units: Object.values(counts).reduce((sum, count) => sum + count, 0),
  lookup_counts: {
    unit_components: componentRows.length,
    unit_weapon_links: weaponLinkRows.length,
    projectiles: projectileRows.length,
    explosions: explosionRows.length,
    unit_abilities: abilityRows.length,
    unit_attributes: attributeRows.length,
    unit_contact_effects: contactRows.length,
    unit_rosters: unitRosterRows.length,
    unit_mount_variants: unitMountVariantRows.length,
    data_quality_flags: qualityRows.length,
  },
  schema_inventory_columns: schemaInventory.length,
};
await writeFile(path.join(OUTPUT, "dataset_manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify(manifest, null, 2));
