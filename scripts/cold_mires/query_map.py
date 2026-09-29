"""Query the Cold Mires hypothesis. Python 3.10+, NumPy; no network required."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np
from classify_water import classify, LABELS

DATASET=Path(__file__).resolve().parents[2]/'docs/development/battlefields/cold-mires/dataset'

def contains(points, polygon):
    """Boundary-inclusive ray casting; accepts vectorized Nx2 scene X,Z points."""
    points=np.asarray(points,dtype=float).reshape(-1,2)
    x,z=points.T
    inside=np.zeros(len(points),dtype=bool)
    boundary=inside.copy()
    for a,b in zip(polygon,polygon[1:]+polygon[:1]):
        ax,az=a; bx,bz=b
        cross=(x-ax)*(bz-az)-(z-az)*(bx-ax)
        boundary |= (np.abs(cross)<=1e-7)&(x>=min(ax,bx)-1e-9)&(x<=max(ax,bx)+1e-9)&(z>=min(az,bz)-1e-9)&(z<=max(az,bz)+1e-9)
        if bz!=az:
            inside ^= ((az>z)!=(bz>z)) & (x < ax+(z-az)*(bx-ax)/(bz-az))
    return inside|boundary

def intersects_box(poly, bounds):
    """Clip polygon to closed rectangle; also retains boundary contacts."""
    pts=list(poly)
    for axis,limit,sign in [(0,bounds[0],1),(0,bounds[2],-1),(1,bounds[1],1),(1,bounds[3],-1)]:
        out=[]
        for a,b in zip(pts,pts[1:]+pts[:1]):
            ai=sign*(a[axis]-limit)>=0; bi=sign*(b[axis]-limit)>=0
            if ai: out.append(a)
            if ai!=bi:
                t=(limit-a[axis])/(b[axis]-a[axis])
                out.append([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])])
        pts=out
        if not pts: return False
    return True

class Map:
    def __init__(self, directory=None):
        self.root=Path(directory) if directory else DATASET
        self.manifest=json.loads((self.root/'manifest.json').read_text())
        for name,digest in self.manifest['data_sha256'].items():
            if hashlib.sha256((self.root/name).read_bytes()).hexdigest()!=digest:
                raise ValueError('Data hash mismatch: '+name)
        self.r=np.load(self.root/'rasters.npz',allow_pickle=False)
        self.f=json.loads((self.root/'features.json').read_text())
        self.labels,self.depth=classify(self.r['ground'],self.r['water'],self.r['raw_water'],**self.manifest['water_classifier']['parameters'])
        assert self.labels.shape==(512,480)
    def status(self):
        return dict(dataset=self.manifest['dataset_id'],coordinate_frame='native_scene_xz_provisional',
                    world_alignment_verified=False,passability='unknown',concealment='unknown',
                    projectile_obstruction='unknown',provenance='manifest.json#sources')
    def point(self,x,z,radius=10):
        x,z,radius=map(float,(x,z,radius))
        if not np.isfinite([x,z,radius]).all() or radius<0: raise ValueError('Invalid coordinates/radius')
        if not (1088<=x<2048 and 1536<=z<2560): raise ValueError('Outside packaged crop; no extrapolation')
        row=int((z-1536)//2); col=int((x-1088)//2)
        vegetation=[]
        for v in self.f['vegetation']:
            distance=float(np.hypot(x-v['xyz'][0],z-v['xyz'][2]))
            if distance<=radius: vegetation.append(dict(id=v['id'],kind=v['kind'],distance_native_units=distance,source='vegetation_def_bleak'))
        matches=[v['id'] for v in self.f['blockage_candidates'] if contains([[x,z]],v['points_xz'])[0]]
        water_code=int(self.labels[row,col]); depth=float(self.depth[row,col])
        return {**self.status(),'query':dict(x=x,z=z,vegetation_radius_native_units=radius),
                'sample':dict(row=row,column=col,x=1088+col*2,z=1536+row*2,method='lower_grid_sample_no_interpolation'),
                'elevation':dict(value=float(self.r['ground'][row,col]),units='native_unverified_metres',source='ground'),
                'water':dict(classification=LABELS[water_code],surface_native=float(self.r['water'][row,col]) if water_code else None,depth_native=depth if np.isfinite(depth) else None,source='water'),
                'candidate_blockage_ids':matches,'vegetation_within_radius':vegetation,
                'vegetation_search_truncated_by_crop':x-radius<1088 or x+radius>=2048 or z-radius<1536 or z+radius>=2560,
                'interpretation':'Nearby placements do not define forest coverage; missing blockage matches do not establish passability.'}
    def region(self,bounds):
        x0,z0,x1,z1=map(float,bounds)
        if not np.isfinite(bounds).all() or not (1088<=x0<x1<=2048 and 1536<=z0<z1<=2560):
            raise ValueError('Region must be a nonempty rectangle inside crop')
        xs=1088+2*np.arange(480); zs=1536+2*np.arange(512)
        cols=np.where((xs>=x0)&(xs<x1))[0]; rows=np.where((zs>=z0)&(zs<z1))[0]
        xx,zz=np.meshgrid(xs[cols],zs[rows]); pts=np.column_stack([xx.ravel(),zz.ravel()])
        labels=self.labels[np.ix_(rows,cols)].ravel()
        blocked=np.zeros(len(pts),bool)
        ids=[]
        for poly in self.f['blockage_candidates']:
            if intersects_box(poly['points_xz'],[x0,z0,x1,z1]):
                ids.append(poly['id']); blocked |= contains(pts,poly['points_xz'])
        veg=[v for v in self.f['vegetation'] if x0<=v['xyz'][0]<x1 and z0<=v['xyz'][2]<z1]
        overlaps={}
        veg_blockage={kind:0 for kind in ['spruce','reed','other']}
        vegpts=np.array([[v['xyz'][0],v['xyz'][2]] for v in veg]).reshape(-1,2)
        vegblocked=np.zeros(len(veg),bool)
        for poly in self.f['blockage_candidates']:
            vegblocked |= contains(vegpts,poly['points_xz'])
        for i,v in enumerate(veg):
            x,_,z=v['xyz']; code=int(self.labels[int((z-1536)//2),int((x-1088)//2)])
            key=v['kind']+' / '+LABELS[code]
            overlaps[key]=overlaps.get(key,0)+1
            if vegblocked[i]:
                veg_blockage[v['kind']]+=1
        elev=self.r['ground'][np.ix_(rows,cols)]
        return {**self.status(),'bounds_xz_half_open':[x0,z0,x1,z1],
                'sample_count':len(pts),'ground_native_range':[float(elev.min()),float(elev.max())] if elev.size else None,
                'water_sample_counts':{name:int((labels==code).sum()) for code,name in LABELS.items()},
                'candidate_blockage_ids_intersecting_closed_box':ids,
                'samples_in_candidate_blockages':int(blocked.sum()),
                'water_by_blockage_sample_counts':{name:int(((labels==code)&blocked).sum()) for code,name in LABELS.items()},
                'vegetation_counts':{kind:sum(v['kind']==kind for v in veg) for kind in ['spruce','reed','other']},
                'vegetation_by_water_sample_counts':overlaps,
                'vegetation_points_in_candidate_blockages':veg_blockage,
                'interpretation':'Counts refer to grid sample locations and placement points, not measured forest area or navigable area.'}

if __name__=='__main__':
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--dataset',type=Path,default=DATASET)
    sub=ap.add_subparsers(dest='command',required=True)
    pt=sub.add_parser('point'); pt.add_argument('x',type=float); pt.add_argument('z',type=float); pt.add_argument('--radius',type=float,default=10)
    reg=sub.add_parser('region'); reg.add_argument('bounds',nargs=4,type=float,metavar=('X_MIN','Z_MIN','X_MAX','Z_MAX'))
    sub.add_parser('summary')
    args=ap.parse_args(); m=Map(args.dataset)
    try:
        result=m.point(args.x,args.z,args.radius) if args.command=='point' else m.region(args.bounds if args.command=='region' else [1088,1536,2048,2560])
        print(json.dumps(result,indent=2,allow_nan=False))
    except ValueError as error: ap.error(str(error))
