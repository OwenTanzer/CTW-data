"""Generate bounded BMD evidence under work/, not production layout geometry."""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoder', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    output = args.output.resolve()
    if not output.is_relative_to((ROOT / 'work').resolve()) or output == (ROOT / 'work').resolve():
        raise ValueError('Candidate output must be below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty candidate output')
    source = ROOT / 'docs/development/battlefields/field-probe/terrain/battles/chs_wastes_coast_a/tile_map.bmd'
    raw = subprocess.check_output([str(args.decoder.resolve()), str(source)])
    # Python preserves 64-bit masks; do not round-trip this payload through JS Number.
    decoded = json.loads(raw)
    if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != source.stat().st_size:
        raise ValueError('Native decode did not pass exact byte roundtrip')
    summary = {
        'status': 'decoded_asset_only_not_resolved_battlefield',
        'source_asset': 'terrain/battles/chs_wastes_coast_a/tile_map.bmd',
        'source_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
        'decoder_revision': decoded['revision'], 'roundtrip_byte_equal': True,
        'source_bytes': decoded['source_bytes'], 'decoded_sha256': hashlib.sha256(raw).hexdigest(),
        'prop_records': len(decoded['bmd']['prop_list']['props']),
        'prop_model_keys': len(decoded['bmd']['prop_list']['keys']),
        'playable_area_has_been_set': decoded['bmd']['playable_area']['has_been_set'],
        'deployment_records_in_this_asset': len(decoded['bmd']['deployment_list']['deployment_areas']),
        'unresolved': ['Exact playable variant and tile/catchment composition',
                       'Effective deployment and playable boundary',
                       'Height raster decoding and coordinate alignment',
                       'Collision, navigation and concealment semantics',
                       'Visual and live verification'],
        'boundaries': ['Prop transforms are native placement evidence, not collision geometry.',
                       'Empty lists describe this asset only, not absence in the assembled battlefield.',
                       'Unset playable-area defaults must not become effective geometry.'],
    }
    output.mkdir(parents=True, exist_ok=True)
    (output / 'native-bmd.json').write_bytes(raw)
    (output / 'summary.json').write_text(json.dumps(summary, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
