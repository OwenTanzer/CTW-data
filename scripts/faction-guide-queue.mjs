import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GUIDE_ROOT = path.join(ROOT, "data", "faction_guides");
const QUEUE_PATH = path.join(GUIDE_ROOT, "queue.json");
const INDEX_PATH = path.join(GUIDE_ROOT, "reference", "faction_index__wh3__8.1.1.csv");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  const [headers, ...data] = rows;
  return data.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

async function loadState() {
  const queue = JSON.parse(await readFile(QUEUE_PATH, "utf8"));
  const index = parseCsv(await readFile(INDEX_PATH, "utf8"));
  return { queue, index };
}

async function status() {
  const { queue } = await loadState();
  const counts = Object.create(null);
  for (const race of queue.races) counts[race.status] = (counts[race.status] ?? 0) + 1;
  console.log(JSON.stringify({ total: queue.races.length, counts, active_run: queue.active_run }, null, 2));
}

async function validate(raceSlug) {
  const { queue, index } = await loadState();
  const race = queue.races.find((item) => item.race_slug === raceSlug);
  if (!race) throw new Error(`Unknown race_slug: ${raceSlug}`);

  const factions = index.filter((row) => row.race_slug === raceSlug);
  if (!factions.length) throw new Error(`No economy-index factions found for ${raceSlug}.`);

  const guidePath = path.join(GUIDE_ROOT, "races", `${raceSlug}.md`);
  const guide = await readFile(guidePath, "utf8");
  const errors = [];

  if (guide.length < 1000) errors.push("guide is unexpectedly short (<1000 characters)");
  for (const marker of [
    "# ",
    "Catalog boundary",
    "Mechanically relevant material not captured elsewhere",
    "Faction coverage",
    "Evidence register",
    "8.1.1",
    "24237342",
  ]) {
    if (!guide.includes(marker)) errors.push(`missing required marker: ${marker}`);
  }
  for (const faction of factions) {
    if (!guide.includes(faction.faction_key)) errors.push(`missing faction key: ${faction.faction_key}`);
    if (!guide.includes(faction.faction_name)) errors.push(`missing faction name: ${faction.faction_name}`);
  }
  if (/\b(?:TODO|TBD|FIXME)\b/i.test(guide)) errors.push("contains unresolved placeholder text");
  if (!/(?:script\/campaign\/|db\/[a-z0-9_]+_tables\/|text\/db\/)/i.test(guide)) {
    errors.push("evidence register does not contain a recognizable game-file path");
  }
  if (!/https?:\/\//i.test(guide)) errors.push("evidence register does not contain a web URL");

  if (errors.length) {
    console.error(JSON.stringify({ status: "failed", race_slug: raceSlug, guide_path: guidePath, errors }, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    status: "passed",
    race: race.race,
    race_slug: raceSlug,
    playable_factions: factions.length,
    guide_path: guidePath,
  }, null, 2));
}

async function validateAll() {
  const { queue } = await loadState();
  for (const race of queue.races) await validate(race.race_slug);
}

const [command = "status", raceSlug] = process.argv.slice(2);
if (command === "status") await status();
else if (command === "validate") {
  if (!raceSlug) throw new Error("Usage: node scripts/faction-guide-queue.mjs validate <race_slug>");
  await validate(raceSlug);
} else if (command === "validate-all") await validateAll();
else throw new Error(`Unknown command: ${command}`);

