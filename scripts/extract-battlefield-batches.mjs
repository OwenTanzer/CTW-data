// Resumable, bounded extraction through the existing verified, mutex-held probe.
import {readFile, writeFile, mkdir, access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {beginSource, verifyDecoder, finishSource} from './snapshot-source.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [kind, destination, requestFile] = process.argv.slice(2);
if (!['layouts', 'bmd', 'height', 'prefabs', 'paths'].includes(kind) || !destination)
  throw Error('Usage: layouts|bmd|height|prefabs|paths work/destination [request.json]');
const output = path.resolve(root, destination);
if (!output.startsWith(path.join(root, 'work') + path.sep)) throw Error('Use work/');
const inventory = JSON.parse(await readFile(path.join(root, 'docs/development/battlefields/discovery/paths-terrain.json')));
let selected = ['prefabs','paths'].includes(kind) ? JSON.parse(await readFile(requestFile)).sort() : inventory.filter(p => kind === 'layouts'
  ? /^terrain\/battles\/[^/]+\/(tile_map\.(index|tiles|bmd|bmd.xml)|tile_list.bin|battle_locations_map\.(bin|xml))$/.test(p)
  : kind === 'bmd' ? /\/(bmd_data.bin|bmd_nogo_data.bin|[^/]+_layer_bmd_data.bin)$/.test(p)
  : p.endsWith('/tile_height_map.compressed_map')).sort();
await mkdir(output, {recursive: true});
if (selected.some(p => !/^(terrain|prefabs)\//.test(p) || p.split('/').some(s=>!s || s==='.' || s==='..') || /[\\\x00-\x1f:]/.test(p))) throw Error('Unsafe source path');
const batchSize = kind === 'height' ? 8 : 50;

const context = await beginSource(path.join(output, 'session-' + Date.now()), root, '9.0.1');
const {call} = await import('./technology-rpfm.mjs');
await call('set_game_selected', {game_name: context.profile.game, rebuild_dependencies: false});
const decoder = await verifyDecoder(call, context);
const pack = (await call('load_all_ca_pack_files'))?.StringContainerInfo?.[0];
if (!pack) throw Error('Merged vanilla source unavailable');
const listing = await call('get_packed_files_names_starting_with_path_from_all_sources', {path: JSON.stringify({Folder:kind === 'prefabs' ? 'prefabs' : 'terrain'})});
const available = new Set(listing.HashMapDataSourceHashSetContainerPath.PackFile.map(x=>x.File));
const missing = selected.filter(p=>!available.has(p));
await writeFile(path.join(output, 'missing-source-paths.json'), JSON.stringify(missing, null, 2));
if (missing.length && kind !== 'prefabs') throw Error('Inventory changed: source path missing');
selected = selected.filter(p=>available.has(p));
const plan = {kind, batchSize, paths:selected};
try {
  const previous = JSON.parse(await readFile(path.join(output, 'plan.json')));
  if (JSON.stringify(previous) !== JSON.stringify(plan)) throw Error('Resume plan changed; use a new output directory');
} catch (error) { if (error.code !== 'ENOENT') throw error; }
await writeFile(path.join(output, 'plan.json'), JSON.stringify(plan, null, 2));
for (let start = 0; start < selected.length; start += batchSize) {
  const id = String(start / batchSize).padStart(5, '0');
  const batch = path.join(output, id);
  try {
    let saved = batch;
    try { saved = JSON.parse(await readFile(path.join(output, `${id}-result.json`))).target; } catch {}
    await access(path.join(saved, 'probe_manifest.json')); console.log(`${id}: already extracted`); continue; }
  catch {}
  // Incomplete outputs are retained for diagnosis; never overwrite them.
  let target = batch;
  for (let attempt = 1; ; attempt++) {
    try { await access(target); target = `${batch}-retry-${attempt}`; } catch { break; }
  }
  const request = path.join(output, `${id}-request.json`);
  await writeFile(request, JSON.stringify({paths: selected.slice(start, start + batchSize)}));
  await mkdir(target, {recursive: true});
  try {
    const paths = selected.slice(start, start + batchSize);
    await call('extract_packed_files', {pack_key: pack, source_paths: JSON.stringify({PackFile:paths.map(File=>({File}))}), destination_path:target, export_as_tsv:true});
    const files = [];
    for (const p of paths) {
      const bytes = await readFile(path.join(target, p));
      files.push({path:p, bytes:bytes.length, sha256:createHash('sha256').update(bytes).digest('hex')});
    }
    const source = await finishSource(context);
    await writeFile(path.join(target,'probe_manifest.json'), JSON.stringify({schema_version:1, snapshot:context.profile, source_verification:source, decoder_schema_sha256:decoder.schema_sha256, request:{paths}, files, probes:[], status:'source_probe_not_validated_geometry'},null,2));
    await writeFile(path.join(output,`${id}-result.json`),JSON.stringify({target,exit:0}));
    console.log(`${id}: extracted ${start+paths.length}/${selected.length}`);
  } catch(error) {
    await writeFile(path.join(output,`${id}-result.json`),JSON.stringify({target,error:String(error)}));
    throw error;
  }
}
