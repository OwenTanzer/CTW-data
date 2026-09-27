// Read-only battlefield format discovery. Run through the locking PS1 wrapper.
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {beginSource, verifyDecoder, finishSource} from './snapshot-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.resolve(root, process.argv[2] ?? 'work/battlefield-discovery');
const context = await beginSource(output, root, process.argv[3] ?? '9.0.1');
const {call} = await import('./technology-rpfm.mjs');
await call('set_game_selected', {game_name: context.profile.game, rebuild_dependencies: false});
const decoder = await verifyDecoder(call, context);
const pack = (await call('load_all_ca_pack_files'))?.StringContainerInfo?.[0];
if (!pack) throw Error('Merged vanilla source unavailable');
await mkdir(output, {recursive: true});
const inventories = [];
for (const prefix of ['terrain', 'db', 'text']) {
  const response = await call('get_packed_files_names_starting_with_path_from_all_sources', {
    path: JSON.stringify({Folder: prefix}),
  });
  const entries = response?.HashMapDataSourceHashSetContainerPath?.PackFile;
  if (!Array.isArray(entries)) throw Error(`Missing merged vanilla listing: ${prefix}`);
  const files = [...new Set(entries.map(x => x.File).filter(Boolean))].sort();
  const filename = `paths-${prefix}.json`;
  await writeFile(path.join(output, filename), JSON.stringify(files, null, 2) + '\n');
  inventories.push({prefix, file: filename, count: files.length});
  const extensions = {};
  for (const file of files) {
    const extension = path.posix.extname(file) || '(none)';
    extensions[extension] = (extensions[extension] ?? 0) + 1;
  }
  console.log(JSON.stringify({prefix, count: files.length, extensions}));
}
const atlas = path.join(root, 'data/campaign_map/campaign_atlas__wh3__9.0.gpkg');
const fingerprint = bytes => createHash('sha256').update(bytes).digest('hex');
const artifacts = [];
for (const item of inventories) {
  const bytes = await readFile(path.join(output, item.file));
  artifacts.push({path: item.file, bytes: bytes.length, sha256: fingerprint(bytes)});
}
const source = await finishSource(context);
await writeFile(path.join(output, 'discovery_manifest.json'), JSON.stringify({
  schema_version: 1, status: 'inventory_only_not_geometry',
  snapshot: context.profile, source_verification: source,
  decoder_schema_sha256: decoder.schema_sha256,
  base_commit: execFileSync('git', ['rev-parse', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim(),
  atlas_sha256: fingerprint(await readFile(atlas)),
  atlas_compatibility: 'not_yet_verified',
  inventories, files: artifacts,
  boundaries: ['Path inventory is not decoded spatial coverage or selectable variant identity.',
    'Only merged vanilla PackFile entries are inventoried; other data sources are excluded.',
    'Pack inventory uses size/mtime; individual source assets require content hashes at extraction.'],
}, null, 2) + '\n');
console.log(`Discovery complete: ${output}`);
