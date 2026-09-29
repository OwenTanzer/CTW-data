"""Unified, explicitly provisional Cold Mires hypothesis map."""
import json
import argparse
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap, ListedColormap
from matplotlib.patches import Polygon, Patch
from matplotlib.lines import Line2D
from classify_water import classify
from query_map import Map, DATASET

ap=argparse.ArgumentParser(description=__doc__)
ap.add_argument('--dataset',type=Path,default=DATASET)
ap.add_argument('--output',type=Path,required=True)
args=ap.parse_args()
m=Map(args.dataset)
a={k:m.r[k][::3,::3] for k in m.r.files}
b={'non_terrain_outlines':[v['points_xz'] for v in m.f['blockage_candidates']]}
trees=m.f['vegetation']
lab,depth=classify(a['ground'],a['water'],a['raw_water'],**m.manifest['water_classifier']['parameters'])
extent=(1088,2048,2560,1536)
fig,ax=plt.subplots(figsize=(11,12.5),facecolor='#f7f4ec')
earth=LinearSegmentedColormap.from_list('earth',['#eee9d8','#d8c9aa','#b29876','#82674f'])
im=ax.imshow(a['ground'],cmap=earth,origin='upper',extent=extent,vmin=60,vmax=150,interpolation='bilinear')
cont=ax.contour(a['ground'],levels=[70,90,110,130,150],colors='#857565',linewidths=.5,alpha=.5,origin='upper',extent=extent)
ax.clabel(cont,inline=True,fontsize=7,fmt='%d')
for value,color in [(0,'#ddd9d1'),(2,'#b5dbdf'),(3,'#68bbd0'),(4,'#eab448'),(5,'#253f86')]:
    ax.imshow(np.ma.masked_where(lab!=value,np.ones(lab.shape)),cmap=ListedColormap([color]),origin='upper',extent=extent,interpolation='nearest')
for poly in b['non_terrain_outlines']:
    ax.add_patch(Polygon(poly,closed=True,facecolor='#bc6252',edgecolor='#853c33',alpha=.55,lw=1.05,zorder=4))
for kind,color,size in [('reed','#a46b21',4),('spruce','#174e30',11)]:
    pts=np.array([r['xyz'] for r in trees if kind in r['model'].lower()])
    ax.scatter(pts[:,0],pts[:,2],s=size,c=color,alpha=.85,linewidths=0,zorder=5)
for index in [1,8,18]:
    xy=np.mean(b['non_terrain_outlines'][index-1],axis=0)
    ax.text(*xy,str(index),ha='center',va='center',fontsize=10,weight='bold',color='#652e29',bbox=dict(facecolor='#fff9ed',edgecolor='none',alpha=.8,pad=1.5),zorder=6)
ax.set(xlim=(1088,2048),ylim=(2560,1536),xlabel='Native scene X',ylabel='Native scene Z',aspect='equal')
ax.tick_params(labelsize=9)
ax.set_title('Cold Mires | Unified hypothesis map',loc='left',fontsize=22,weight='bold',pad=29)
ax.text(0,1.012,'Elevation · water · vegetation · candidate blockages',transform=ax.transAxes,fontsize=12,color='#555149')
cax=fig.add_axes([.895,.38,.018,.32])
fig.colorbar(im,cax=cax,label='Ground elevation · native units',extend='both')
handles=[Patch(color='#68bbd0',label='Shallow-water candidate'),Patch(color='#253f86',label='Deep-water candidate'),Patch(color='#eab448',label='Depth class uncertain'),Patch(color='#b5dbdf',label='Shoreline uncertain'),Line2D([],[],marker='o',linestyle='',color='#174e30',label='Spruce placements',markersize=5),Line2D([],[],marker='o',linestyle='',color='#a46b21',label='Reed placements',markersize=4),Patch(facecolor='#bc6252',edgecolor='#853c33',alpha=.55,label='Candidate blockage outline'),Patch(color='#ddd9d1',label='Water coverage unresolved')]
fig.legend(handles=handles,loc='lower left',bbox_to_anchor=(.095,.108),ncol=2,frameon=False,fontsize=10,columnspacing=2.7,handlelength=1.6,labelspacing=.7)
fig.text(.105,.063,'WORKING HYPOTHESIS — spatial alignment and gameplay effects await live testing.\nWater classes use a conditional 0.5 native-unit cutoff; deep water is not confirmed impassable.\nVegetation dots are not forest boundaries. Unshaded ground is not certified passable.',fontsize=9.5,color='#555149',linespacing=1.5)
fig.text(.105,.027,'Tile 11 · def_bleak vegetation candidate · 19 blockage outlines intersect crop\nLabels 1, 8 and 18 identify live-check targets. Raster displayed at every third source cell.',fontsize=9,color='#716c63')
fig.subplots_adjust(left=.105,right=.865,top=.90,bottom=.245)
args.output.parent.mkdir(parents=True,exist_ok=True)
fig.savefig(args.output,dpi=200,facecolor=fig.get_facecolor())
