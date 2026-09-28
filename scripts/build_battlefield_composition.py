"""Build bounded tile and BMD evidence; does not assemble effective battlefields."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
from battlefield_tiles import decode_tiles

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/development/battlefields'


def build(decoder, output):
    output = output.resolve()
    if not output.is_relative_to((ROOT / 'work').resolve()) or output == (ROOT / 'work').resolve():
        raise ValueError('Candidate output must be below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty candidate output')
    probe = EVIDENCE / 'composition-probe'
    manifest = json.loads((probe / 'probe_manifest.json').read_bytes())
    for item in manifest['files']:
        raw = (probe / item['path']).read_bytes()
        if len(raw) != item['bytes'] or hashlib.sha256(raw).hexdigest() != item['sha256']:
            raise ValueError('Composition source hash mismatch: ' + item['path'])
    layouts = []
    for source, name in [('field-probe', 'chs_wastes_coast_a'),
                         ('composition-probe', 'def_plains_infield_a')]:
        folder = EVIDENCE / source / 'terrain/battles' / name
        layouts.append({'map_asset': name, **decode_tiles((folder / 'tile_map.index').read_bytes(),
                                                        (folder / 'tile_map.tiles').read_bytes())})
    output.mkdir(parents=True, exist_ok=True)
    layers = []
    for item in manifest['files']:
        if not item['path'].endswith(('.bin', '.bmd')):
            continue
        result = subprocess.run([str(decoder.resolve()), str(probe / item['path'])], capture_output=True)
        layer = {'source_asset': item['path'], 'source_sha256': item['sha256']}
        if result.returncode:
            layer.update(status='decoder_failed', error=result.stderr.decode().strip())
        else:
            decoded = json.loads(result.stdout)  # Python preserves native uint64 identifiers.
            if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != item['bytes']:
                raise ValueError('Nonexact BMD roundtrip: ' + item['path'])
            native = output / 'native' / (item['path'] + '.json')
            native.parent.mkdir(parents=True, exist_ok=True)
            native.write_bytes(result.stdout)
            bmd = decoded['bmd']
            layer.update(status='decoded_asset_only', roundtrip_byte_equal=True,
                         decoder_revision=decoded['revision'], decoder_patch_set=decoded.get('patch_set'),
                         decoded_sha256=hashlib.sha256(result.stdout).hexdigest(),
                         playable_area=bmd['playable_area'],
                         deployment_records=len(bmd['deployment_list']['deployment_areas']),
                         prefab_instance_count=len(bmd['prefab_instance_list']['prefab_instances']),
                         set_playable_area_prefab_instances=(bmd['prefab_instance_list']['prefab_instances']
                             if bmd['playable_area']['has_been_set'] else None))
        layers.append(layer)
    report = {'status': 'development_composition_evidence_not_effective_geometry',
              'checked_composition_files': len(manifest['files']), 'layouts': layouts, 'layers': layers,
              'unresolved': ['Prefab dependency closure and effective deployment',
                             'Tile orientation, world transforms and catchment binding',
                             'Unsupported BMD subrecord versions',
                             'Height decoding, terrain semantics and runtime validation']}
    (output / 'summary.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoder', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    report = build(args.decoder, args.output)
    print(json.dumps({'layouts': len(report['layouts']), 'layers': len(report['layers']),
                      'decoder_failures': sum(x['status'] == 'decoder_failed' for x in report['layers'])}))
