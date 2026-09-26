import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { snapshotProfile } from './snapshot-source.mjs';
import { matchesTextFingerprint } from './validation-text.mjs';
import * as legacy from './dataset-scope.mjs';

export async function buildSnapshot(source) {
  const manifest = JSON.parse(await readFile(path.join(source, 'source_manifest.json'), 'utf8'));
  const profile = snapshotProfile(manifest.patch);
  if (manifest.game !== profile.game || manifest.steam_build_id !== profile.steam_build_id)
    throw Error('Source manifest snapshot identity mismatch');
  if (!manifest.files?.length) throw Error('Source manifest has no files');
  for (const entry of manifest.files) {
    const file = path.resolve(source, entry.path);
    if (!file.startsWith(path.resolve(source) + path.sep)) throw Error('Source path escapes snapshot');
    if (entry.path.startsWith('db/') && !entry.path.endsWith('.tsv')) throw Error('Undecoded database source');
    if (!matchesTextFingerprint(await readFile(file), entry.sha256, entry.bytes))
      throw Error(`Source fingerprint mismatch: ${entry.path}`);
  }
  let scope = legacy;
  if (profile.patch === '9.0') {
    if (manifest.installation_evidence?.executable_version !== profile.executable_version || !manifest.decoder_schema_sha256)
      throw Error('9.0 requires verified extraction provenance');
    const config = JSON.parse(await readFile(new URL('./scope-9.0.json', import.meta.url), 'utf8'));
    scope = { ...config, CHARACTER_RACE_OVERRIDES: new Map(Object.entries(config.CHARACTER_RACE_OVERRIDES)),
      CHARACTER_SUBTYPE_EXCLUSIONS: new Set(config.CHARACTER_SUBTYPE_EXCLUSIONS) };
  }
  const { executable_version, ...context } = profile;
  return { context, scope, manifest, factionCount: profile.patch === '9.0' ? 109 : 104,
    unitSchema: profile.patch === '9.0' ? 4 : 3 };
}
