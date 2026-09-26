"""Build a validated candidate atlas with army starts; never edits the input atlas."""
import argparse
from copy import deepcopy
import csv
import json
from math import hypot
from pathlib import Path
import shutil
import sqlite3
import struct
from extract_campaign_starts import digest, write_csv, write_json


class Raster:
    def __init__(self, db):
        self.raw=db.execute("select data from map_assets where asset_key='region_lookup'").fetchone()[0]
        b=self.raw
        if (b[1],b[2],b[7],b[16])!=(1,1,32,16):raise ValueError('Unsupported lookup encoding')
        self.width,self.height=struct.unpack_from('<HH',b,12)
        self.palette_start=18+b[0];self.count=struct.unpack_from('<H',b,5)[0]
        self.pixel_start=self.palette_start+self.count*4
        colors={r['lookup_colour_hex']:r['region_key'] for r in db.execute('select * from regions where pixel_count is not null and province_key is not null')}
        self.palette={}
        for i in range(self.count):
            blue,green,red=b[self.palette_start+4*i:self.palette_start+4*i+3]
            self.palette[i]=colors.get(f'{red:02X}{green:02X}{blue:02X}')

    def pixel(self,x,y):
        i=struct.unpack_from('<H',self.raw,self.pixel_start+2*(y*self.width+x))[0]
        return self.palette[i]

    def region(self,x,y):
        px=int(x/961*self.width);py=int((748-y)/748*self.height)
        return self.pixel(px,py) if 0<=px<self.width and 0<=py<self.height else None

    def nearest_land(self,x,y):
        # Expanding pixel ring finds the nearest mask-cell center without treating
        # that cell as a claimed maritime region or an actual landing route.
        px=int(x/961*self.width);py=int((748-y)/748*self.height)
        best=(float('inf'),'')
        for radius in range(max(self.width,self.height)):
            if radius*min(961/self.width,748/self.height)>best[0]+2:break
            cells=[(i,py-radius) for i in range(px-radius,px+radius+1)]
            if radius:cells += [(i,py+radius) for i in range(px-radius,px+radius+1)]
            cells += [(px-radius,j) for j in range(py-radius+1,py+radius)]
            if radius:cells += [(px+radius,j) for j in range(py-radius+1,py+radius)]
            for i,j in cells:
                if not 0<=i<self.width or not 0<=j<self.height:continue
                key=self.pixel(i,j)
                if key:
                    d=hypot((i+.5)*961/self.width-x,748-(j+.5)*748/self.height-y)
                    best=min(best,(d,key))
        return best[1],best[0]


def human_positions(raw,rules,humans,transform):
    rows=deepcopy(raw)
    def keys(value):return set(value if isinstance(value,list) else [value]) if value else set()
    for index,rule in enumerate(rules):
        if not keys(rule.get('if_human'))<=humans or keys(rule.get('if_ai'))&humans:continue
        for change in rule['changes']:
            if change[0] not in ('teleport_character','teleport_character_faction_leader'):continue
            action,key,*values=change
            if key not in humans:continue # only human start semantics in this dataset
            candidates=[r for r in rows if r['faction_key']==key]
            if action=='teleport_character':
                sx,sy,x,y,general=values
                candidates=[r for r in candidates if (r['agent_type']=='general')==general]
                candidates.sort(key=lambda r:((r['logical_x']-sx)**2+(r['logical_y']-sy)**2,r['character_id']))
            else:
                x,y=values;candidates=[r for r in candidates if r['is_primary']]
            if not candidates:raise ValueError('Missing scripted target '+key)
            row=candidates[0]
            row['logical_x'],row['logical_y']=x,y
            row['world_x']=x*transform['logical_x_scale']
            row['world_y']=(y+(x%2)*.5)*transform['logical_y_scale']
            row.setdefault('applied_rules',[]).append(index)
    return rows


def build(args):
    source=Path(args.source);output=Path(args.output)
    if output.resolve()==Path(args.atlas).resolve():raise ValueError('Build into work candidate, not source atlas')
    manifest=json.loads((source/'source_manifest.json').read_text())
    for name,expected in manifest['files'].items():
        if digest((source/name).read_bytes())!=expected:raise ValueError('Source hash mismatch '+name)
    raw=list(csv.DictReader((source/'characters.csv').open()))
    for r in raw:
        for k in ('character_id','member_id','force_id','is_primary','logical_x','logical_y','esf_offset'):r[k]=int(r[k])
        for k in ('world_x','world_y'):r[k]=float(r[k])
    rules=json.loads((source/'custom_start_rules.json').read_text())
    output.mkdir(parents=True,exist_ok=True)
    target=output/'campaign_atlas__wh3__8.1.1.gpkg'
    shutil.copyfile(args.atlas,target)
    db=sqlite3.connect(target);db.row_factory=sqlite3.Row
    playable={r[0] for r in db.execute('select faction_key from factions where playable=1')}
    if {r['faction_key'] for r in raw if r['is_primary']}!=playable:raise ValueError('Primary source coverage mismatch')
    raster=Raster(db)
    controls=list(csv.DictReader((source/'settlement_controls.csv').open()))
    matches=sum(raster.region(float(r['world_x']),float(r['world_y']))==r['region_key'] for r in controls)
    if matches!=len(controls) or matches!=569:raise ValueError('World-to-atlas settlement controls failed')
    output_rows=[]
    for key in sorted(playable):
        human=human_positions(raw,rules,{key},manifest['coordinate_transform'])
        for r in human:
            if r['faction_key']!=key or r['agent_type']!='general':continue
            binary=next(b for b in raw if b['character_id']==r['character_id'])
            region=raster.region(r['world_x'],r['world_y'])
            anchor,gap=(region,0.0) if region else raster.nearest_land(r['world_x'],r['world_y'])
            output_rows.append(dict(faction_key=key,character_id=r['character_id'],subtype_key=r['subtype_key'],force_id=r['force_id'],is_primary=r['is_primary'],
                world_x=r['world_x'],world_y=r['world_y'],logical_x=r['logical_x'],logical_y=r['logical_y'],
                start_region_key=region,nearest_land_region_key=anchor,nearest_land_distance=gap,
                position_kind='land_raster_point' if region else 'maritime_point_no_distinct_region',
                binary_world_x=binary['world_x'],binary_world_y=binary['world_y'],binary_logical_x=binary['logical_x'],binary_logical_y=binary['logical_y'],
                binary_region_key=raster.region(binary['world_x'],binary['world_y']),esf_offset=r['esf_offset'],
                script_rule_indexes=json.dumps(r.get('applied_rules',[])),
                stage='human startup statically evaluated; runtime not observed'))
    write_csv(output/'army_starts.csv',output_rows)
    overrides=[]
    for base in (r for r in output_rows if r['is_primary']):
        key=base['faction_key'];partners=set()
        for rule in rules:
            if any(c[0].startswith('teleport_character') and c[1]==key for c in rule['changes']):
                for field in ('if_human','if_ai'):
                    value=rule.get(field) or []
                    partners.update(value if isinstance(value,list) else [value])
        for partner in sorted(partners & playable - {key}):
            r=next(r for r in human_positions(raw,rules,{key,partner},manifest['coordinate_transform']) if r['faction_key']==key and r['is_primary'])
            if (r['logical_x'],r['logical_y'])!=(base['logical_x'],base['logical_y']):
                overrides.append(dict(faction_key=key,partner_key=partner,world_x=r['world_x'],world_y=r['world_y'],logical_x=r['logical_x'],logical_y=r['logical_y'],start_region_key=raster.region(r['world_x'],r['world_y'])))
    write_csv(output/'partner_overrides.csv',overrides)
    db.executescript('DROP VIEW IF EXISTS faction_army_start_reference; DROP TABLE IF EXISTS campaign_army_starts; DROP TABLE IF EXISTS campaign_start_rules; DROP TABLE IF EXISTS campaign_start_partner_overrides;')
    types={k:('INTEGER' if isinstance(v,int) else 'REAL' if isinstance(v,float) else 'TEXT') for k,v in output_rows[0].items()}
    db.execute('CREATE TABLE campaign_army_starts ('+','.join(f'{k} {t}' for k,t in types.items())+',PRIMARY KEY(faction_key,character_id),FOREIGN KEY(faction_key) REFERENCES factions(faction_key))')
    db.executemany('INSERT INTO campaign_army_starts VALUES ('+','.join('?' for k in types)+')',[tuple(r.values()) for r in output_rows])
    db.execute('CREATE TABLE campaign_start_rules (rule_index INTEGER PRIMARY KEY, rule_json TEXT NOT NULL)')
    db.executemany('INSERT INTO campaign_start_rules VALUES (?,?)',[(i,json.dumps(r,sort_keys=True)) for i,r in enumerate(rules)])
    db.execute('CREATE TABLE campaign_start_partner_overrides (faction_key TEXT,partner_key TEXT,world_x REAL,world_y REAL,logical_x INTEGER,logical_y INTEGER,start_region_key TEXT,PRIMARY KEY(faction_key,partner_key))')
    db.executemany('INSERT INTO campaign_start_partner_overrides VALUES (?,?,?,?,?,?,?)',[tuple(r.values()) for r in overrides])
    db.execute('''CREATE VIEW faction_army_start_reference AS SELECT a.*,f.name faction_name,f.capital_region_key,f.culture_key,f.subculture_key,
        r.province_key,r.centroid_x,r.centroid_y,r.name start_region_name
        FROM campaign_army_starts a JOIN factions f USING(faction_key)
        LEFT JOIN regions r ON a.start_region_key=r.region_key WHERE a.is_primary=1''')
    # Atlas metadata and provenance are generated along with the candidate.
    db.execute("UPDATE metadata SET value='1.1.0' WHERE key='schema_version'")
    db.execute("INSERT OR REPLACE INTO metadata VALUES ('starting_positions_audit_date','2026-09-06')")
    db.execute('INSERT OR REPLACE INTO source_files VALUES (?,?,?,?)',('campaigns/wh3_main_combi/startpos.esf',manifest['startpos_sha256'],manifest['startpos_bytes'],'binary army start evidence'))
    for name,sha in manifest['files'].items():
        db.execute('INSERT OR REPLACE INTO source_files VALUES (?,?,?,?)',('starting_positions/source_exports/'+name,sha,(source/name).stat().st_size,'starting position evidence'))
    db.execute('INSERT OR REPLACE INTO coverage VALUES (?,?,?,?)',('starting forces and agents','primary_armies_complete_static_scripts',len(output_rows),'104 primary generals; 109 generals including secondary forces. Raw 308-character evidence; hero replacements not a post-init census.'))
    db.execute('INSERT OR REPLACE INTO evidence VALUES (?,?,?,?,?)',('army_starts','campaigns/wh3_main_combi/startpos.esf + campaign custom starts','ESF CHARACTER / FAMILY_MEMBER / MILITARY_FORCE joins; raster point lookup; literal human startup rules','source_backed_static','569/569 settlement controls. Four human primary starts have no distinct maritime mask. Partner-dependent Khazrak rule retained. Runtime not observed.'))
    for table in ('campaign_army_starts','campaign_start_rules','campaign_start_partner_overrides'):
        db.execute("INSERT OR REPLACE INTO gpkg_contents(table_name,data_type,identifier,description,last_change) VALUES (?,'attributes',?,?,'2026-09-07T00:00:00.000Z')",(table,table,'Army start evidence and static human startup rules'))
    schema=[]
    for table in ('campaign_army_starts','campaign_start_rules','campaign_start_partner_overrides','faction_army_start_reference'):
        for col in db.execute('PRAGMA table_info('+table+')'):
            schema.append(dict(table=table,field=col['name'],type=col['type'],meaning='See starting_positions/README.md; blanks mean unavailable, never zero'))
    write_csv(output/'schema_inventory.csv',schema)
    db.commit();db.execute('VACUUM');db.close()
    primary=[r for r in output_rows if r['is_primary']]
    report=dict(status='passed',schema_version='1.1.0',factions=len(playable),primary_generals=len(primary),army_starts=len(output_rows),
        binary_characters=len(raw),settlement_controls=matches,missing_army_positions=0,partner_overrides=len(overrides),
        maritime_primary_factions=[r['faction_key'] for r in primary if not r['start_region_key']],
        changed_primary_start_regions=[r['faction_key'] for r in primary if r['start_region_key']!=r['binary_region_key']],
        transform=manifest['coordinate_transform'],
        caveats=['Static source audit, not 5,356 runtime multiplayer campaign launches.',
                 'Khazrak human relocation depends on partner identity; consume campaign_start_rules when evaluating a pair.',
                 'Maritime points have no uniquely colored sea-region mask; nearest land is a descriptive anchor, not an owned start or travel route.',
                 'Secondary forces retained separately; pair distance uses the primary general.',
                 'Heroes are binary evidence only; scripted hero spawning and replacement are not a complete post-initialization agent census.'])
    write_json(output/'starting_positions_validation.json',report)
    write_json(output/'dataset_manifest.json',dict(schema_version='1.1.0',patch='8.1.1',steam_build_id=24237342,
        atlas='campaign_atlas__wh3__8.1.1.gpkg',primary_view='faction_army_start_reference',audit_date='2026-09-06',
        source_manifest='starting_positions/source_exports/source_manifest.json',source_startpos_sha256=manifest['startpos_sha256'],
        raw_characters=len(raw),army_starts=len(output_rows),primary_factions=len(primary),
        schema='starting_positions/schema_inventory.csv',validation='starting_positions/starting_positions_validation.json',
        files={n:digest((output/n).read_bytes()) for n in ('army_starts.csv','partner_overrides.csv','schema_inventory.csv')}))
    print(json.dumps({k:v for k,v in report.items() if k not in ('transform','caveats')}))


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('source','atlas','output'):p.add_argument('--'+name,required=True)
    build(p.parse_args())
