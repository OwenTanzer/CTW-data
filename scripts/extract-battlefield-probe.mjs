// Bounded read-only source probe; exact paths must come from discovery output.
import {mkdir, readFile, writeFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {beginSource, verifyDecoder, finishSource} from './snapshot-source.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [requestPath, outputPath, snapshot = '9.0.1'] = process.argv.slice(2);
if (!requestPath || !outputPath) throw Error('Usage: request.json work/output [snapshot]');
const request = JSON.parse(await readFile(path.resolve(root, requestPath), 'utf8'));
const output = path.resolve(root, outputPath);
if (!Array.isArray(request.paths) || !request.paths.length || request.paths.length > 100)
  throw Error('Probe requires 1–100 exact paths');
for (const p of request.paths)
  if (typeof p !== 'string' || p.includes('..') || p.includes('\\') || p.startsWith('/'))
    throw Error('Unsafe source path');
const context = await beginSource(output, root, snapshot);
const {call} = await import('./technology-rpfm.mjs');
await call('set_game_selected', {game_name: context.profile.game, rebuild_dependencies: false});
const decoder = await verifyDecoder(call, context);
const pack = (await call('load_all_ca_pack_files'))?.StringContainerInfo?.[0];
if (!pack) throw Error('Merged vanilla source unavailable');
const available = new Set();
for (const prefix of new Set(request.paths.map(p => p.split('/')[0]))) {
  const listing = await call('get_packed_files_names_starting_with_path_from_all_sources', {
    path: JSON.stringify({Folder: prefix}),
  });
  const entries = listing?.HashMapDataSourceHashSetContainerPath?.PackFile;
  if (!Array.isArray(entries)) throw Error(`No vanilla listing for ${prefix}`);
  for (const entry of entries) if (entry.File) available.add(entry.File);
}
for (const p of request.paths) if (!available.has(p)) throw Error(`Source missing: ${p}`);
await mkdir(output, {recursive: true});
await call('extract_packed_files', {pack_key: pack,
  source_paths: JSON.stringify({PackFile: request.paths.map(File => ({File}))}),
  destination_path: output, export_as_tsv: true});
const probes = [];
for (const p of request.decode ?? []) {
  if (!request.paths.includes(p)) throw Error('Decode path not requested for extraction');
  const artifact = `decoded-${probes.length}.json`;
  try {
    const decoded = await call('decode_packed_file', {pack_key: pack, path: p, source: 'PackFile'});
    await writeFile(path.join(output, artifact), JSON.stringify(decoded, null, 2) + '\n');
    probes.push({path: p, status: 'decoder_returned_unvalidated', artifact});
  } catch (error) {
    probes.push({path: p, status: 'decoder_failed', error: String(error)});
  }
}
const files = [];
async function walk(dir) {
  for (const item of await readdir(dir, {withFileTypes: true})) {
    const p = path.join(dir, item.name);
    if (item.isDirectory()) await walk(p);
    else {
      const bytes = await readFile(p);
      files.push({path: path.relative(output, p).replaceAll('\\', '/'), bytes: bytes.length,
        sha256: createHash('sha256').update(bytes).digest('hex')});
    }
  }
}
await walk(output);
const source = await finishSource(context);
await writeFile(path.join(output, 'probe_manifest.json'), JSON.stringify({
  schema_version: 1, snapshot: context.profile, source_verification: source,
  decoder_schema_sha256: decoder.schema_sha256, request, probes,
  files: files.sort((a, b) => a.path.localeCompare(b.path)),
  status: 'source_probe_not_validated_geometry',
}, null, 2) + '\n');
console.log(JSON.stringify({output, files, probes}));
