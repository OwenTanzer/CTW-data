"""Resolve the retained 9.0 Archaon script's subtype keys to unit records.

Source-faction/subtype pairs below were transcribed from the hash-verified
wh3_dlc29_archaon_subjugation.lua, lines 26-45 and 234-295. Re-run against
retained 9.0 DB exports; the module does not invent custom-battle permissions.
"""
import argparse, csv, hashlib, json
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SCRIPT_HASH='db259f7f1f2a1d17e031ea2949ae81d3ccd0c95bd5333bee4aaf27490b7369e8'
SOURCE_SCRIPT='script/campaign/wh3_dlc29_archaon_subjugation.lua'
LEADERS=[
 ('wh3_main_kho_exiles_of_khorne','wh3_main_kho_skarbrand'),
 ('wh3_dlc26_kho_skulltaker','wh3_dlc26_kho_skulltaker'),
 ('wh3_dlc26_kho_arbaal','wh3_dlc26_kho_arbaal_the_undefeated'),
 ('wh3_main_tze_oracles_of_tzeentch','wh3_main_tze_kairos'),
 ('wh3_dlc24_tze_the_deceivers','wh3_dlc24_tze_the_changeling'),
 ('wh3_main_nur_poxmakers_of_nurgle','wh3_main_nur_kugath'),
 ('wh3_dlc25_nur_tamurkhan','wh3_dlc25_nur_tamurkhan'),
 ('wh3_dlc25_nur_epidemius','wh3_dlc25_nur_epidemius'),
 ('wh3_main_sla_seducers_of_slaanesh','wh3_main_sla_nkari'),
 ('wh3_dlc27_sla_the_tormentors','wh3_dlc27_sla_dechala'),
 ('wh3_dlc27_sla_masque_of_slaanesh','wh3_dlc27_sla_masque_of_slaanesh'),
]
CHIEFTAINS=[
 'wh3_dlc25_nur_kayzk_the_befouled',
 'wh3_dlc25_nur_bray_shaman_wild_chieftain',
 'wh3_dlc25_nur_castellan_chieftain',
 'wh3_dlc25_nur_exalted_hero_chieftain',
 'wh3_dlc25_nur_fimir_balefiend_shadow_chieftain',
 'wh3_dlc25_nur_skin_wolf_werekin_chieftain',
]
TRANSFER_FACTIONS=['wh3_dlc25_nur_tamurkhan','wh3_main_nur_poxmakers_of_nurgle','wh3_dlc25_nur_epidemius']
def source(owner, table):
    p=ROOT/f'data/{owner}/source_exports/db/{table}_tables/data__.tsv'
    lines=p.read_text(encoding='utf-8-sig').splitlines()
    head=lines[0].split('\t')
    return [dict(zip(head,row.split('\t'))) for row in lines[1:] if row and not row.startswith('#')],hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--apply-scope',action='store_true');args=parser.parse_args()
    discovery=json.loads((ROOT/'data/technology_trees/source_exports/discovery.json').read_text())
    matches=[s for s in discovery['scripts'] if s.get('path')==SOURCE_SCRIPT]
    assert len(matches)==1 and matches[0]['sha256']==SCRIPT_HASH,'Script checkpoint changed'
    agents,ah=source('skill_trees','agent_subtypes');units,uh=source('unit_stats','main_units')
    land,lh=source('unit_stats','land_units');mounts,mh=source('unit_stats','units_custom_battle_mounts')
    permissions,ph=source('unit_stats','units_custom_battle_permissions')
    by_agent={r['key']:r for r in agents};by_unit={r['unit']:r for r in units};by_land={r['key']:r for r in land}
    by_mount=defaultdict(list)
    for m in mounts:by_mount[m['base_unit']].append(m['mounted_unit'])
    current={r['unit_key'] for r in csv.DictReader((ROOT/'data/unit_stats/normalized/warriors_of_chaos__wh3__9.0__ultra.csv').open())}
    cases=[]
    for source_faction,subtype in LEADERS+[(f,subtype) for subtype in CHIEFTAINS for f in TRANSFER_FACTIONS]:
        unit=by_agent[subtype]['associated_unit_override']
        assert unit in by_unit and by_unit[unit]['land_unit'] in by_land,(subtype,unit)
        if subtype in CHIEFTAINS:
            condition=f'Archaon only: possible character transfer when vassalizing {source_faction} under the retained 9.0 subjugation script. No ordinary recruitment or universal Warriors of Chaos permission.'
            kind='extra_character_transfer'
        else:
            condition=f'Archaon only: may acquire the leader of {source_faction} after eligible subjugation or the scripted defeated-faction encounter; not ordinary Warriors of Chaos recruitment.'
            kind='subjugated_leader'
        for key in [unit]+sorted(by_mount[unit]):
            assert key in by_unit and by_unit[key]['land_unit'] in by_land,(subtype,key)
            is_mount=key!=unit
            note=condition+(f' Source mount configuration of {unit}; availability still depends on the transferred character and its actual mount unlock.' if is_mount else '')+' Source custom-battle faction permissions in unit_rosters belong only to their listed factions and do not grant Archaon access.'
            cases.append({'source_faction':source_faction,'subtype':subtype,'unit':key,'base_unit':unit,'kind':kind,'mount':is_mount,'source_land_unit':by_unit[key]['land_unit'],'availability_note':note,'source_permissions':sorted(p['faction'] for p in permissions if p['unit']==key)})
    combined={}
    for c in cases:
        key=c['unit'];combined.setdefault(key,{'unit':key,'kind':c['kind'],'base_unit':c['base_unit'],'subtypes':set(),'source_factions':set(),'source_land_unit':c['source_land_unit'],'mount':c['mount'],'source_permissions':c['source_permissions']})
        combined[key]['subtypes'].add(c['subtype']);combined[key]['source_factions'].add(c['source_faction'])
    assert len(combined)==26 and sum(c['mount'] for c in combined.values())==9
    for key,c in combined.items():
        c['subtypes']=sorted(c['subtypes']);c['source_factions']=sorted(c['source_factions'])
        c['availability_note']='Archaon only: '+('eligible leader subjugation or defeated-faction encounter' if c['kind']=='subjugated_leader' else 'character transfer when vassalizing a listed Nurgle faction')+'. '+('This source mount configuration requires that transferred character and its actual mount unlock. ' if c['mount'] else '')+'No ordinary recruitment or general Warriors of Chaos access. Exact custom-battle faction permissions in unit_rosters are unchanged and do not themselves grant Archaon access.'
    assert len({c['base_unit'] for c in combined.values() if not c['mount']})==17
    report={'snapshot':'9.0 / Steam build 25507028','source_script_path':SOURCE_SCRIPT,'source_script_sha256':SCRIPT_HASH,'source_script_lines':{'leaders':'26-45','transfers':'234-295'},'source_db_sha256':{'agent_subtypes':ah,'main_units':uh,'land_units':lh,'units_custom_battle_mounts':mh,'units_custom_battle_permissions':ph},'source_faction_subtype_pairs':len(cases)-9,'selected_units':len(combined),'leader_subtypes':len(LEADERS),'extra_transfer_subtypes':len(CHIEFTAINS),'source_mounts':9,'cases':[combined[k] for k in sorted(combined)]}
    path=ROOT/'docs/development/update-9.0/archaon-scripted-availability.json';path.write_text(json.dumps(report,indent=2)+'\n')
    if args.apply_scope:
        scope_path=ROOT/'scripts/scope-9.0.json';scope=json.loads(scope_path.read_text());r=next(r for r in scope['UNIT_ROSTERS'] if r['slug']=='warriors_of_chaos')
        previous=set(r.get('script_units',[]));new=set(combined)
        if previous and previous!=new:raise ValueError('Existing script unit decisions differ from retained source fixture')
        r['script_units']=sorted(new);r['script_unit_notes']={k:combined[k]['availability_note'] for k in sorted(new)}
        r['expected_units']+=len(new-current)
        scope_path.write_text(json.dumps(scope,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['selected_units','leader_subtypes','extra_transfer_subtypes','source_mounts']},indent=2))
if __name__=='__main__':main()
