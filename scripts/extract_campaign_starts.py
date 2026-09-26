"""Extract compact startpos evidence, preserving raw positions and script branches."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
import re
import sqlite3
from campaign_esf import Esf


def digest(data):
    return hashlib.sha256(data).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, sort_keys=True) + '\n', encoding='utf8', newline='\n')


def write_csv(path, rows):
    with path.open('w', encoding='utf8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)


def lua_table(text):
    """Only literal tables; never execute game Lua or accept expressions."""
    pattern = r'\s+|--[^\n]*|"(?:[^"\\]|\\.)*"|[A-Za-z_][A-Za-z_0-9]*|-?\d+(?:\.\d+)?|[{},;=]'
    tokens=[]
    end=0
    for m in re.finditer(pattern,text):
        if text[end:m.start()].strip(): raise ValueError('Nonliteral Lua input')
        end=m.end(); t=m.group()
        if not t.isspace() and not t.startswith('--'):tokens.append(t)
    if text[end:].strip():raise ValueError('Trailing nonliteral Lua')
    pos=0
    def value():
        nonlocal pos
        t=tokens[pos];pos+=1
        if t=='{':
            seq=[];mapping={}
            while tokens[pos]!='}':
                if pos+1<len(tokens) and tokens[pos+1]=='=':
                    k=tokens[pos];pos+=2;mapping[k]=value()
                else:seq.append(value())
                if tokens[pos] in (',',';'):pos+=1
            pos+=1
            if seq and mapping:raise ValueError('Mixed Lua table')
            return mapping if mapping else seq
        if t.startswith('"'):return json.loads(t)
        if t in ('true','false','nil'):return {'true':True,'false':False,'nil':None}[t]
        try:return float(t) if '.' in t else int(t)
        except ValueError:raise ValueError('Nonliteral Lua value '+t)
    result=value()
    if pos!=len(tokens):raise ValueError('Trailing Lua tokens')
    return result


def extract(args):
    output=Path(args.output);output.mkdir(parents=True,exist_ok=True)
    raw=Path(args.startpos).read_bytes(); e=Esf(raw).decompress()
    model=e.root.child('CAMPAIGN_ENV').child('CAMPAIGN_MODEL')
    map_keys=[n.value() for n in model.child('CAMPAIGN_MAP_DATA').children() if n.tag==15]
    if 'wh3_main_combi_map_5' not in map_keys:raise ValueError('Wrong map')
    if args.steam_manifest:
        acf=Path(args.steam_manifest).read_text()
        if not re.search(r'"buildid"\s+"24237342"',acf):raise ValueError('Wrong installed Steam build')
    else:raise ValueError('Steam manifest is required to verify patch provenance')
    w=model.child('WORLD')
    db=sqlite3.connect(Path(args.atlas).resolve().as_uri()+'?mode=ro',uri=True)
    playable={r[0] for r in db.execute('select faction_key from factions where playable=1')}
    frontend=Path(args.frontend).read_text(encoding='utf-8-sig')
    leaders={(r['faction'],r['agent_subtype_record']) for r in csv.DictReader((s for s in frontend.splitlines() if not s.startswith('#')),delimiter='\t')}
    members={}
    for m in w.child('FAMILY_TREE').children():
        if m.name!='FAMILY_MEMBER':continue
        cs=list(m.children());d=list(m.child('CHARACTER_DETAILS').children())
        if m.version!=1 or m.child('CHARACTER_DETAILS').version!=6 or d[13].tag!=15:raise ValueError('Family schema changed')
        members[cs[0].value()]=d[13].value()
    rows=[]; controls=[];allcoords=[];force_checks=0
    for entry in w.child('FACTION_ARRAY').children():
        f=entry.child('FACTION');key=list(f.children())[1].value()
        forces={}
        for en in f.child('ARMY_ARRAY').children():
            mf=en.child('MILITARY_FORCE');mcs=list(mf.children())
            forces[mcs[0].value()]=mcs[1].value()
        for en in f.child('CHARACTER_ARRAY').children():
            c=en.child('CHARACTER');cs=list(c.children());loc=list(c.child('LOCOMOTABLE').children())
            if c.version!=5 or loc[0].tag!=12 or loc[1].tag!=7 or loc[2].tag!=7:raise ValueError('Character schema changed')
            wx,wy=loc[0].value();lx,ly=loc[1].value(),loc[2].value()
            allcoords.append((lx,ly,wx,wy))
            if key not in playable:continue
            cid,member,force=cs[1].value(),cs[3].value(),cs[4].value()
            if force:
                if forces.get(force)!=cid:raise ValueError('Commander / force reverse link mismatch')
                force_checks+=1
            rows.append(dict(faction_key=key,character_id=cid,member_id=member,agent_type=cs[2].value(),
                             subtype_key=members[member],force_id=force,
                             is_primary=int((key,members[member]) in leaders and cs[2].value()=='general'),
                             world_x=wx,world_y=wy,logical_x=lx,logical_y=ly,esf_offset=c.start))
    for en in w.child('REGION_MANAGER').child('REGIONS_ARRAY').children():
        r=en.child('REGION');key=list(r.children())[1].value()
        los=list(r.child('SETTLEMENT').child('GARRISON_RESIDENCE').child('LINE_OF_SIGHT').children())
        a,b=los[1].value(),los[2].value()
        controls.append(dict(region_key=key,world_x=(a[0]+b[0])/2,world_y=(a[1]+b[1])/2,esf_offset=r.start))
    # Fit the hex-grid logical -> world transform from all 1,017 observed points.
    # Stored world points remain authoritative; only scripted target coordinates use this fit.
    sx=sum(x*wx for x,y,wx,wy in allcoords)/sum(x*x for x,y,wx,wy in allcoords)
    sy=sum((y+(x%2)*.5)*wy for x,y,wx,wy in allcoords)/sum((y+(x%2)*.5)**2 for x,y,wx,wy in allcoords)
    error=max(max(abs(wx-x*sx),abs(wy-(y+(x%2)*.5)*sy)) for x,y,wx,wy in allcoords)
    if error>.0001:raise ValueError('Logical/world mapping does not validate')
    source=Path(args.scripts)
    custom=source/'wh2_campaign_custom_starts.lua';text=custom.read_text(encoding='utf-8-sig')
    marker='custom_starts.start_data.me_custom_start_factions = '
    block=text.split(marker,1)[1].split('\nfunction custom_starts:',1)[0].strip()
    rules=lua_table(block)
    (output/'custom_starts_ie.lua').write_text(block+'\n',encoding='utf8',newline='\n')
    write_json(output/'custom_start_rules.json',rules)
    movement=[]
    for path in sorted(source.rglob('*.lua')):
        content=path.read_text(encoding='utf-8-sig')
        hits=[dict(line=i,text=line.strip()) for i,line in enumerate(content.splitlines(),1)
              if re.search(r'cm:(?:teleport|move_to|create_force_with_existing)',line)]
        if hits:movement.append(dict(path=path.relative_to(source).as_posix(),sha256=digest(path.read_bytes()),sites=hits))
    write_json(output/'movement_script_index.json',movement)
    write_csv(output/'characters.csv',sorted(rows,key=lambda r:(r['faction_key'],r['character_id'])))
    write_csv(output/'settlement_controls.csv',sorted(controls,key=lambda r:r['region_key']))
    manifest=dict(schema_version=1,patch='8.1.1',steam_build_id=24237342,campaign='wh3_main_combi',map='wh3_main_combi_map_5',
        stage='binary startpos before scripts; human startup relocations separately preserved',
        startpos_sha256=digest(raw),startpos_bytes=len(raw),decompressed_sha256=digest(e.data),
        frontend_sha256=digest(Path(args.frontend).read_bytes()),atlas_sha256=digest(Path(args.atlas).read_bytes()),
        custom_script_sha256=digest(custom.read_bytes()),script_count=len(list(source.rglob('*.lua'))),
        factions=len(playable),primary_generals=sum(r['is_primary'] for r in rows),characters=len(rows),force_reverse_checks=force_checks,
        coordinate_transform=dict(logical_x_scale=sx,logical_y_scale=sy,odd_x_half_y_offset=True,control_count=len(allcoords),max_residual=error,
                                  evidence_status='analytical fit to all stored logical/world pairs; not movement costs'),
        files={p.name:digest(p.read_bytes()) for p in sorted(output.iterdir()) if p.is_file() and p.name!='source_manifest.json'})
    if len(playable)!=104 or manifest['primary_generals']!=104:raise ValueError('Playable/primary source discrepancy')
    write_json(output/'source_manifest.json',manifest)
    print(json.dumps({k:manifest[k] for k in ('factions','primary_generals','characters','force_reverse_checks','script_count')}))


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__)
    for name in ('startpos','steam-manifest','atlas','frontend','scripts','output'):p.add_argument('--'+name,required=True)
    extract(p.parse_args())
