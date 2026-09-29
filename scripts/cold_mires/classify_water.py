"""Conditional shallow/deep diagnostic; never asserts runtime terrain or passability."""
import argparse
import json
from pathlib import Path
import numpy as np

LABELS = {0: 'coverage_unknown', 1: 'no_exposed_water_candidate',
          2: 'shoreline_uncertain', 3: 'shallow_candidate',
          4: 'shallow_deep_boundary_uncertain', 5: 'deep_candidate'}

def classify(ground, water, raw_water, *, threshold, uncertainty):
    if ground.shape != water.shape or ground.shape != raw_water.shape:
        raise ValueError('Rasters must have identical aligned shapes')
    if not np.isfinite(threshold) or not np.isfinite(uncertainty) or threshold <= 0 or not 0 <= uncertainty < threshold:
        raise ValueError('Invalid threshold or uncertainty')
    # Raw zero is a suspected sentinel; deliberately keep it unknown.
    valid = np.isfinite(ground) & np.isfinite(water) & (raw_water != 0)
    depth = np.where(valid, water - ground, np.nan)
    labels = np.zeros(ground.shape, dtype=np.uint8)
    labels[valid & (depth < -uncertainty)] = 1
    labels[valid & (np.abs(depth) <= uncertainty)] = 2
    labels[valid & (depth > uncertainty) & (depth < threshold-uncertainty)] = 3
    labels[valid & (depth >= threshold-uncertainty) & (depth <= threshold+uncertainty)] = 4
    labels[valid & (depth > threshold+uncertainty)] = 5
    return labels, depth

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('input',type=Path); ap.add_argument('output',type=Path)
    ap.add_argument('--threshold',type=float,default=.5)
    ap.add_argument('--uncertainty',type=float,required=True)
    args=ap.parse_args()
    a=np.load(args.input,allow_pickle=False)
    labels,depth=classify(a['ground'],a['water'],a['raw_water'],threshold=args.threshold,uncertainty=args.uncertainty)
    args.output.mkdir(parents=True,exist_ok=False)
    np.savez_compressed(args.output/'classification.npz',labels=labels,candidate_depth=depth)
    report={'status':'conditional_depth_candidates_not_runtime_classes','labels':LABELS,
      'counts':{name:int((labels==k).sum()) for k,name in LABELS.items()},
      'threshold_native_units':args.threshold,'quantization_uncertainty_native_units':args.uncertainty,
      'threshold_basis':'Historical official TWWAKT Making a Lake: below 0.5 m shallow; above 0.5 m deep/impassable; equality unspecified.',
      'source':'https://wiki.totalwar.com/w/TWWAKT_Making_a_Lake',
      'required_assumptions':['Current height interpolation is valid','One native height unit equals one metre','Ground and water share coordinates and datum','Historical threshold applies to this build'],
      'limitations':['Assumptions remain unverified','Uncertainty band covers assumed half-step quantization only, not alignment or calibration error','Raw zero stays coverage_unknown','No runtime class or movement exclusion inferred']}
    (args.output/'classification.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report))
if __name__=='__main__': main()
