"""Rebuild one pinned Cold Mires hypothesis from source bytes; no game writes."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import struct
import zipfile
import numpy as np
from native_height import decode_height
from tree_list import decode as decode_trees
from barrier_prefix import prefix, Reader

ROOT=Path(__file__).resolve().parents[2]
DOC=ROOT/'docs/development/battlefields/cold-mires'

def write_json(path,value):
    path.write_text(json.dumps(value,indent=2,ensure_ascii=False,allow_nan=False)+'\n',encoding='utf-8')

def build(output,source=None):
    output=output.resolve()
    if not output.is_relative_to(ROOT/'work'):
        raise ValueError('Build into a new directory under work/')
    if output.exists(): raise ValueError('Output must not already exist')
    spec=json.loads((DOC/'build_spec.json').read_text(encoding='utf-8'))
    data={}
    with zipfile.ZipFile(DOC/'source/supplemental.zip') as z:
        for key,record in spec['sources'].items():
            path=record['path']
            if source:
                raw=(source/path).read_bytes()
            elif key=='ground':
                raw=(ROOT/'docs/development/battlefields/xml-probe'/path).read_bytes()
            else:
                raw=z.read(Path(path).name)
            if hashlib.sha256(raw).hexdigest()!=record['sha256']:
                raise ValueError('Pinned source hash mismatch: '+path)
            data[key]=raw
    rasters={}; reports={}
    for key in ['ground','water']:
        raw,meta=decode_height(data[key])
        if raw.shape!=(2304,2304): raise ValueError('Unexpected source raster shape')
        header=struct.unpack('<6f',bytes.fromhex(meta['opaque_header_hex']))
        values=header[1]+raw.astype(float)/65535*(header[4]-header[1])
        rasters[key]=values[896:1408,672:1152]
        rasters['raw_'+key]=raw[896:1408,672:1152]
        reports[key]=meta
    trees=decode_trees(data['vegetation_def_bleak'])
    veg=[]
    for group in trees['groups']:
        for v in group['records']:
            x,y,z=v['xyz_candidate']
            if not np.isfinite([x,y,z]).all(): raise ValueError('Nonfinite tree coordinates')
            if 1088<=x<2048 and 1536<=z<2560:
                model=group['model']
                veg.append(dict(model=model,xyz=[x,y,z],opaque_tail_hex=v['opaque_tail_hex'],id=f'vegetation-{len(veg)+1}',
                                kind='spruce' if 'spruce' in model.lower() else 'reed' if 'reed' in model.lower() else 'other'))
    b=prefix(data['base_bmd'])
    empty=prefix(data['nogo_bmd'])
    if empty['buildings'] or empty['go_outlines'] or empty['non_terrain_outlines']:
        raise ValueError('Unexpected no-go prefix')
    nr=Reader(data['nogo_bmd']); nr.pos=empty['prefix_bytes']
    for _ in range(3): # empty zone, prefab and BMD outline lists in pinned source
        nr.expect('H',1); nr.expect('I',0)
    start=nr.pos; nr.rebuilt=bytearray(); nogo=nr.outlines()
    if bytes(nr.rebuilt)!=data['nogo_bmd'][start:nr.pos]: raise ValueError('No-go section roundtrip failed')
    buildings=[dict(key=v['key'],xyz=list(v['transform'][9:12])) for v in b['buildings']
               if 1088<=v['transform'][9]<2048 and 1536<=v['transform'][11]<2560]
    features=dict(coordinate_frame='native_scene_xz_provisional',vegetation=veg,
                  blockage_candidates=[dict(id=f'nonterrain-{i+1}',points_xz=p,source='base_bmd',status='blocking_semantics_unverified') for i,p in enumerate(b['non_terrain_outlines'])],
                  terrain_nogo_outlines=[dict(id=f'terrain-nogo-{i+1}',points_xz=p,source='nogo_bmd') for i,p in enumerate(nogo)],
                  go_outlines=b['go_outlines'],building_origins=buildings)
    if (len(veg),len(buildings),len(nogo),len(b['non_terrain_outlines']))!=(1305,937,43,32):
        raise ValueError('Unexpected pinned-source feature counts')
    output.mkdir(parents=True)
    np.savez_compressed(output/'rasters.npz',**rasters)
    write_json(output/'features.json',features)
    spec['data_sha256']={n:hashlib.sha256((output/n).read_bytes()).hexdigest() for n in ['rasters.npz','features.json']}
    spec['build_machinery']='scripts/cold_mires/build.py'
    write_json(output/'manifest.json',spec)
    write_json(output/'decode_report.json',dict(rasters=reports,tree_groups=len(trees['groups']),tree_records=sum(len(g['records']) for g in trees['groups']),
             tree_roundtrip=trees['roundtrip_byte_equal'],base_prefix_bytes=b['prefix_bytes'],base_prefix_roundtrip=b['prefix_roundtrip'],
             base_undecoded_suffix_bytes=b['unparsed_suffix_bytes'],nogo_section=[start,nr.pos],nogo_section_roundtrip=True,runtime_verified=False))
    from query_map import Map
    m=Map(output)
    write_json(output/'examples.json',dict(deep_water_target=m.point(1820,1892,20),outcrop_target=m.point(1770,1850,20),
                central_region=m.region([1400,1700,1900,2200]),whole_crop=m.region([1088,1536,2048,2560])))
    return output

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--source',type=Path,help='Optional extractor output root with exact game-relative paths; hashes must match')
    args=ap.parse_args()
    print(build(args.output,args.source))
