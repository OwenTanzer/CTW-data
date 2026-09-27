"""Resolve bounded deployment source dependencies and emit conditional projections.

Projected polygons are coordinate hypotheses, never effective runtime geometry.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE = ROOT / 'docs/development/battlefields'


def project_xz(points, transform):
    """Conditional row-vector X/Z projection; rejects tilt and perspective."""
    if set(transform) != {f'm{i}{j}' for i in range(4) for j in range(4)}:
        raise ValueError('Incomplete transform')
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in transform.values()):
        raise ValueError('Nonfinite transform')
    expected = {'m01': 0, 'm03': 0, 'm10': 0, 'm11': 1, 'm12': 0, 'm13': 0,
                'm21': 0, 'm23': 0, 'm33': 1}
    if any(transform[k] != value for k, value in expected.items()):
        raise ValueError('Tilt or perspective unsupported')
    if abs(transform['m00'] * transform['m22'] - transform['m02'] * transform['m20']) < 1e-12:
        raise ValueError('Singular horizontal transform')
    if len(points) < 3 or not all(math.isfinite(p[k]) for p in points for k in ('x', 'y')):
        raise ValueError('Invalid polygon points')
    projected = [{'x': p['x'] * transform['m00'] + p['y'] * transform['m20'] + transform['m30'],
             'y': p['x'] * transform['m02'] + p['y'] * transform['m22'] + transform['m32']}
            for p in points]
    if not all(math.isfinite(p[k]) for p in projected for k in ('x', 'y')):
        raise ValueError('Nonfinite projection')
    return projected


def boundaries(bmd):
    result = []
    for ai, area in enumerate(bmd['deployment_list']['deployment_areas']):
        for zi, zone in enumerate(area['deployment_zones']):
            for ri, region in enumerate(zone['deployment_regions']):
                for bi, boundary in enumerate(region['boundary_list']):
                    result.append({'area_index': ai, 'zone_index': zi, 'region_index': ri,
                                   'boundary_index': bi, 'category': area['category'],
                                   'region_id': region['id'], 'orientation_raw': region['orientation'],
                                   'snap_facing': region['snap_facing'],
                                   'boundary_type': boundary['deployment_area_boundary_type'],
                                   'points': boundary['boundary']})
    return result


def verify_probe(folder):
    manifest = json.loads((folder / 'probe_manifest.json').read_bytes())
    for item in manifest['files']:
        source = (folder / item['path']).resolve()
        if not source.is_relative_to(folder.resolve()):
            raise ValueError('Unsafe manifest path')
        raw = source.read_bytes()
        if len(raw) != item['bytes'] or hashlib.sha256(raw).hexdigest() != item['sha256']:
            raise ValueError('Source hash mismatch: ' + item['path'])
    return manifest['files']


def build(decoder, output):
    output = output.resolve()
    if not output.is_relative_to((ROOT / 'work').resolve()) or output == (ROOT / 'work').resolve():
        raise ValueError('Candidate output must be below work/')
    if output.exists() and any(output.iterdir()):
        raise ValueError('Use an empty candidate output')
    sources = []
    for probe in ['prefab-probe', 'composition-probe', 'catchments-probe']:
        for item in verify_probe(EVIDENCE / probe):
            if item['path'].startswith('prefabs/') or '_layer_bmd_data.bin' in item['path']:
                sources.append((probe, item))
    output.mkdir(parents=True, exist_ok=True)
    assets, native = [], {}
    for probe, item in sources:
        result = subprocess.run([str(decoder.resolve()), str(EVIDENCE / probe / item['path'])], capture_output=True)
        record = {'source_asset': item['path'], 'source_sha256': item['sha256'], 'source_probe': probe}
        if result.returncode:
            record.update(status='decoder_failed', error=result.stderr.decode().strip())
        else:
            decoded = json.loads(result.stdout)
            if not decoded['roundtrip_byte_equal'] or decoded['consumed_bytes'] != item['bytes']:
                raise ValueError('Nonexact BMD roundtrip')
            dest = output / 'native' / (item['path'] + '.json')
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(result.stdout)
            bmd = native[item['path']] = decoded['bmd']
            record.update(status='decoded_asset_only', roundtrip_byte_equal=True,
                          decoder_revision=decoded['revision'],
                          decoded_sha256=hashlib.sha256(result.stdout).hexdigest(),
                          playable_area=bmd['playable_area'], native_boundaries=boundaries(bmd),
                          prefab_instances=bmd['prefab_instance_list']['prefab_instances'])
        assets.append(record)
    instances = []
    for source, bmd in native.items():
        for instance in bmd['prefab_instance_list']['prefab_instances']:
            row = {'parent_asset': source, 'prefab_asset': instance['key'], 'instance_uid': instance['uid'],
                   'runtime_binding_verified': False}
            if instance['key'] not in native:
                row['status'] = 'dependency_not_extracted'
            elif (instance['property_overrides'] or instance['clamp_to_surface'] or
                  instance['height_mode'] != 'BHM_ABSOLUTE' or instance['campaign_region_key'] or
                  instance['campaign_type_mask']):
                row['status'] = 'instance_conditions_not_resolved'
            else:
                try:
                    polygons = []
                    for boundary in boundaries(native[instance['key']]):
                        points = project_xz(boundary['points'], instance['transform'])
                        area = bmd['playable_area']
                        rect = area['area']
                        outside = (sum(not (rect['min_x'] <= p['x'] <= rect['max_x'] and
                                            rect['min_y'] <= p['y'] <= rect['max_y']) for p in points)
                                   if area['has_been_set'] else None)
                        polygons.append({**boundary, 'points': points,
                                         'vertices_outside_parent_rectangle': outside})
                    row.update(status='conditional_projection_not_effective_geometry',
                               projection='row_vector_xz_assumption', projected_boundaries=polygons)
                except ValueError as error:
                    row.update(status='projection_unsupported', reason=str(error))
            instances.append(row)
    report = {'status': 'deployment_source_evidence_not_runtime_verified', 'assets': assets,
              'instances': instances,
              'boundaries': ['Native polygon points, categories and zone indices are source evidence.',
                             'Zone indices are not assigned to attacker, defender or alliance.',
                             'Projected coordinates assume row-vector X/Z convention; world alignment is unverified.',
                             'Out-of-bounds vertices are retained, not clipped or interpreted as runtime errors.',
                             'Tile transforms, catchment selection and runtime clipping remain unresolved.']}
    (output / 'summary.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--decoder', required=True, type=Path)
    parser.add_argument('--output', required=True, type=Path)
    args = parser.parse_args()
    report = build(args.decoder, args.output)
    print(json.dumps({'assets': len(report['assets']), 'prefab_instances': len(report['instances']),
                      'status': report['status']}))
