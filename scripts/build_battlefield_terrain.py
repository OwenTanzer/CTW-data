"""Decode height evidence and test a conditional tile-coordinate assembly."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import numpy as np
from battlefield_height import decode_height
from battlefield_tiles import decode_tiles
from build_battlefield_deployment import ROOT, EVIDENCE, verify_probe


def alignment_candidates(raster, transforms):
    xyz = np.array([[p['m30'], p['m31'], p['m32']] for p in transforms])
    results = []
    for scale in [0.5, 1.0, 2.0]:
        for border in [0, 64, 128, 256]:
            for reflect_y in [False, True]:
                x = np.rint(xyz[:, 0] * scale + border).astype(int)
                y = np.rint(xyz[:, 2] * scale + border).astype(int)
                if reflect_y:
                    y = raster.shape[0] - 1 - y
                valid = (x >= 0) & (x < raster.shape[1]) & (y >= 0) & (y < raster.shape[0])
                sampled, prop_y = raster[y[valid], x[valid]], xyz[valid, 1]
                if len(sampled) < 3 or not np.std(sampled) or not np.std(prop_y):
                    correlation = None
                else:
                    correlation = float(np.corrcoef(sampled, prop_y)[0, 1])
                results.append({'samples_per_native_unit': scale, 'border_samples': border,
                                'reflect_y': reflect_y, 'valid_props': int(valid.sum()),
                                'total_props': len(xyz), 'pearson_r': correlation,
                                'height_rmse': float(np.sqrt(np.mean((sampled - prop_y)**2))) if len(sampled) else None,
                                'height_median_residual': float(np.median(sampled - prop_y)) if len(sampled) else None})
    return results


def assemble_candidate(tiles, placements):
    """Explicit hypothesis: 128 samples/grid cell, border 128, identity tag 16.

Missing tiles remain NaN with a separate coverage mask. No overlap blending.
"""
    selected = [(p, tiles[p['tile_path_raw'].replace('\\', '/').rstrip('/').split('/')[-1]])
                for p in placements if p['tile_path_raw'].replace('\\', '/').rstrip('/').split('/')[-1] in tiles]
    if not selected:
        raise ValueError('No candidate tiles')
    if any(p['plane'] != 0 or p['opaque_u8_4'] != 16 for p, _ in selected):
        raise ValueError('Candidate supports only plane 0 / observed orientation tag 16')
    left = min(p['grid_bounds_exclusive'][0] for p, _ in selected)
    bottom = min(p['grid_bounds_exclusive'][1] for p, _ in selected)
    right = max(p['grid_bounds_exclusive'][2] for p, _ in selected)
    top = max(p['grid_bounds_exclusive'][3] for p, _ in selected)
    shape = ((top-bottom)*128, (right-left)*128)
    if max(shape) > 8192:
        raise ValueError('Candidate extent too large')
    mosaic = np.full(shape, np.nan, dtype='<f4')
    covered = np.zeros(shape, dtype=bool)
    for p, raster in selected:
        x0, y0, x1, y1 = p['grid_bounds_exclusive']
        patch = raster[128:-128, 128:-128]
        if patch.shape != ((y1-y0)*128, (x1-x0)*128):
            raise ValueError('Tile raster/footprint mismatch')
        ys, xs = slice((y0-bottom)*128,(y1-bottom)*128), slice((x0-left)*128,(x1-left)*128)
        if covered[ys,xs].any():
            raise ValueError('Overlapping candidate tiles')
        mosaic[ys,xs], covered[ys,xs] = patch, True
    return mosaic, covered, [left, bottom, right, top]


def build(decoder, output):
    output = output.resolve()
    if not output.is_relative_to((ROOT/'work').resolve()) or output == (ROOT/'work').resolve():
        raise ValueError('Candidate output must be below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use empty output')
    for probe in ['xml-probe', 'height-probe', 'composition-probe', 'field-probe']:
        verify_probe(EVIDENCE/probe)
    output.mkdir(parents=True, exist_ok=True)
    paths = [next((EVIDENCE/'xml-probe').rglob('tile_height_map.compressed_map'))]
    paths += sorted((EVIDENCE/'height-probe').rglob('tile_height_map.compressed_map'))
    metadata, tiles = [], {}
    for path in paths:
        raster, meta = decode_height(path.read_bytes())
        tile = path.parent.name
        np.save(output/(tile+'-raw-u16.npy'), raster, allow_pickle=False)
        fields = struct.unpack('<6f', bytes.fromhex(meta['opaque_header_hex']))
        # Candidate min/max interpretation, not a declared engine format contract.
        scaled = raster.astype(np.float64) * (fields[4]-fields[1])/65535 + fields[1]
        tiles[tile] = scaled
        meta.update(tile=tile, source_path=str(path.relative_to(EVIDENCE)),
                    candidate_vertical_bounds=[fields[1],fields[4]])
        metadata.append(meta)
    prop_path = EVIDENCE/'composition-probe/terrain/tiles/battle/chs_wastes/chs_wastes_coast_a/tile_21/bmd_data.bin'
    raw = subprocess.check_output([str(decoder.resolve()), str(prop_path)])
    decoded = json.loads(raw)
    if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != prop_path.stat().st_size:
        raise ValueError('Nonexact prop decode')
    transforms = [p['transform'] for p in decoded['bmd']['prop_list']['props'] if p['height_mode']=='BHM_ABSOLUTE']
    candidates = alignment_candidates(tiles['tile_21'], transforms)
    folder = EVIDENCE/'field-probe/terrain/battles/chs_wastes_coast_a'
    layout = decode_tiles((folder/'tile_map.index').read_bytes(), (folder/'tile_map.tiles').read_bytes())
    mosaic, mask, bounds = assemble_candidate(tiles, layout['placements'])
    np.save(output/'conditional-height-mosaic.npy', mosaic, allow_pickle=False)
    np.save(output/'coverage-mask.npy', mask, allow_pickle=False)
    report = {'status':'conditional_terrain_assembly_not_world_verified', 'rasters':metadata,
              'alignment_evidence': {'prop_source_sha256':hashlib.sha256(prop_path.read_bytes()).hexdigest(),
                                     'prop_selection':'BHM_ABSOLUTE only; placement height need not equal ground',
                                     'candidate_comparisons':candidates},
              'assembly_hypothesis': {'samples_per_grid_cell':128, 'native_units_per_sample':2,
                                      'border_samples':128, 'orientation_tag_16':'assumed unrotated',
                                      'vertical_scaling':'opaque header float[1] + u16/65535 * (float[4]-float[1])',
                                      'opaque_tile_anchor_tail_applied':False,
                                      'grid_bounds_exclusive':bounds},
              'mosaic': {'shape':list(mosaic.shape), 'covered_samples':int(mask.sum()),
                         'unknown_samples':int((~mask).sum()), 'unknown_representation':'NaN plus false coverage mask',
                         'raw_f32_sha256':hashlib.sha256(mosaic.tobytes()).hexdigest()},
              'unresolved':['Engine coordinate convention and world origin',
                            'Opaque tile anchor fields and blending/height adjustments',
                            'Alignment to effective deployment and source preview/runtime comparison',
                            'Remaining tile height assets and other terrain semantics']}
    (output/'summary.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    return report


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoder',required=True,type=Path)
    parser.add_argument('--output',required=True,type=Path)
    args=parser.parse_args()
    report=build(args.decoder,args.output)
    print(json.dumps({'status':report['status'],'rasters':len(report['rasters']),'mosaic':report['mosaic']}))
