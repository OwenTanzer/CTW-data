// Source verification for explicit, isolated snapshot candidates.
import { readFile, readdir, stat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const profiles = {
  '8.1.1': { patch: '8.1.1', steam_build_id: '24237342', executable_version: '8.1.1.0' },
  '9.0': { patch: '9.0', steam_build_id: '25507028', executable_version: '9.0.0.0' },
};
export function snapshotProfile(name = '8.1.1') {
  if (!Object.hasOwn(profiles, name)) throw Error(`Unsupported snapshot: ${name}`);
  return { game: 'warhammer_3', ...profiles[name] };
}
export function assertIdentity(profile, build, version) {
  if (build !== profile.steam_build_id || version !== profile.executable_version)
    throw Error(`Snapshot mismatch: ${build} / ${version}; expected ${profile.steam_build_id} / ${profile.executable_version}`);
}
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function inspectInstall(game, profile) {
  const manifest = await readFile(path.resolve(game, '../../appmanifest_1142710.acf'));
  const executable = path.join(game, 'Warhammer3.exe');
  const version = execFileSync('powershell.exe', ['-NoProfile', '-Command',
    `(Get-Item -LiteralPath '${executable.replaceAll("'", "''")}').VersionInfo.ProductVersion`], { encoding: 'utf8' }).trim();
  const build = manifest.toString().match(/"buildid"\s+"(\d+)"/)?.[1];
  assertIdentity(profile, build, version);
  const packs = [];
  for (const name of (await readdir(path.join(game, 'data'))).filter(n => n.endsWith('.pack')).sort()) {
    const info = await stat(path.join(game, 'data', name));
    packs.push({ name, bytes: info.size, modified_ms: info.mtimeMs });
  }
  if (!packs.length) throw Error('No installed pack files');
  return { ...profile, installation: await realpath(game), appmanifest_sha256: hash(manifest),
    executable_sha256: hash(await readFile(executable)), pack_inventory: packs,
    pack_identity_method: 'filename, byte count and modification time; not a full pack-content digest' };
}
export async function beginSource(output, root, name) {
  const profile = snapshotProfile(name);
  const work = path.resolve(root, 'work');
  const resolved = path.resolve(output);
  if (!resolved.startsWith(work + path.sep)) throw Error('Source candidates must be under ignored work/');
  // Resolve the nearest existing ancestor to reject symlinks escaping work/.
  let ancestor = resolved;
  while (true) {
    try { const actual = await realpath(ancestor); const rootActual = await realpath(root);
      const target = path.resolve(actual, path.relative(ancestor, resolved));
      if (!target.startsWith(path.join(rootActual, 'work') + path.sep)) throw Error('Output escapes work/');
      break;
    } catch (e) { if (e.code !== 'ENOENT') throw e; ancestor = path.dirname(ancestor); }
  }
  try { if ((await readdir(resolved)).length) throw Error('Use an empty source destination'); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const game = process.env.CTW_GAME_PATH ?? 'C:/Program Files (x86)/Steam/steamapps/common/Total War WARHAMMER III';
  const before = await inspectInstall(game, profile);
  return { profile, game, before };
}
export async function verifyDecoder(call, context) {
  const configured = await call('settings_get_path_buf', { value: context.profile.game });
  const configuredPath = typeof configured === 'string' ? configured : configured?.PathBuf;
  if (!configuredPath || (await realpath(configuredPath)).toLowerCase() !== (await realpath(context.game)).toLowerCase())
    throw Error('Decoder installation differs from verified installation');
  const schema = await call('get_schema');
  if (!schema?.Schema?.definitions) throw Error('Decoder schema unavailable');
  return { schema, schema_sha256: hash(JSON.stringify(schema)) };
}
export async function finishSource(context) {
  const after = await inspectInstall(context.game, context.profile);
  if (JSON.stringify(after) !== JSON.stringify(context.before)) throw Error('Source installation changed during extraction');
  return context.before;
}
