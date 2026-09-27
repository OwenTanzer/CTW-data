"""Reproduce #23 decisions from pinned discovery evidence, never from the selector output.

Run with --apply-scope to install reviewed selection decisions; output is an audit
register, not manually authored production rows. Source schemas remain unchanged.
"""
import argparse, csv, hashlib, json, subprocess
from collections import Counter, defaultdict
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
BASE = '6282fd8b6181c6ba4dd6390753a86527b3812c23'
hashes = {}
def pinned(path):
    return subprocess.check_output(['git', 'show', f'{BASE}:{path}'], cwd=ROOT)
def table(owner, name):
    p = ROOT / f'data/{owner}/source_exports/db/{name}_tables/data__.tsv'
    hashes[str(p.relative_to(ROOT))] = hashlib.sha256(p.read_bytes()).hexdigest()
    # RPFM TSV exports have literal tab separators, not CSV quote escaping.
    lines = p.read_text(encoding='utf-8-sig').splitlines()
    head = lines[0].split('\t')
    return [dict(zip(head, line.split('\t'))) for line in lines[1:] if line and not line.startswith('#')]
def clean(row, omit): return {k:v for k,v in row.items() if k not in omit}
def stable(x): return json.dumps(x, sort_keys=True, separators=(',', ':'))
main = {r['unit']:r for r in table('unit_stats','main_units')}
land = {r['key']:r for r in table('unit_stats','land_units')}
perms = table('unit_stats','units_custom_battle_permissions')
mounts = table('unit_stats','units_custom_battle_mounts')
relations = [(table('unit_stats',name), col, omit) for name,col,omit in [
    ('land_units_to_unit_abilites_junctions','land_unit',[]),
    ('unit_missile_weapon_junctions','unit',['id']),
    ('land_units_to_extra_engines','land_unit',[])]]
def combat(key):
    m=main[key]; l=land[m['land_unit']]
    return [clean(m,['unit','land_unit']),clean(l,['key'])] + [
        sorted(stable(clean(r,[col]+omit)) for r in rows if r[col]==m['land_unit'])
        for rows,col,omit in relations]
def signature(key): return hashlib.sha256(stable(combat(key)).encode()).hexdigest()
# Explicit same-race aliases only. Do not choose arbitrary equal-stat characters,
# transfer permissions, or discard a record merely because its key ends in _mp.
aliases = {
 ('greenskins','wh2_twa03_grn_mon_wyvern_0'):'wh2_dlc15_grn_mon_wyvern_waaagh_0',
 ('tzeentch','wh3_main_tze_cha_kairos_fateweaver_custom_battle_0'):'wh3_main_tze_cha_kairos_fateweaver_0',
 ('warriors_of_chaos','wh3_main_nur_inf_forsaken_0'):'wh3_main_nur_inf_forsaken_0_warriors',
 ('warriors_of_chaos','wh3_main_nur_mon_spawn_of_nurgle_0'):'wh3_main_nur_mon_spawn_of_nurgle_0_warriors',
}
discovery_path='docs/development/update-9.0/historical-availability.json'
discovery=json.loads(pinned(discovery_path));hashes[f'{BASE}:{discovery_path}']=hashlib.sha256(pinned(discovery_path)).hexdigest()
for path,expected in discovery['source_and_output_sha256'].items():
    if '/source_exports/' in path:
        assert hashlib.sha256((ROOT/path).read_bytes()).hexdigest()==expected, f'Source drift: {path}'
prior=json.loads(pinned('docs/development/update-9.0/availability-decisions.json'))
prior_by={(c['race'],c['unit']):c for c in prior['cases']}
scope=json.loads(pinned('scripts/scope-9.0.json'))
rosters={r['slug']:r for r in scope['UNIT_ROSTERS']}
present={race:{r['unit_key'] for r in csv.DictReader(pinned(f'data/unit_stats/normalized/{race}__wh3__9.0__ultra.csv').decode().splitlines())} for race in rosters}
by_perm=defaultdict(list)
for p in perms: by_perm[p['unit']].append(p)
by_mount=defaultdict(list)
for m in mounts: by_mount[m['mounted_unit']].append(m)
cases=[]
for old in discovery['cases']:
    c=dict(old);race=c['race'];key=c['unit'];c['permissions']=by_perm[key]
    assert any(p['faction']==c['faction'] for p in c['permissions'])
    assert main[key]['land_unit']==c['land_unit'] and c['land_unit'] in land
    c['combat_signature_sha256']=signature(key)
    if old['classification']=='approved_duplicate_exclusion':
        d=prior_by[race,key];c.update(decision='exclude_duplicate',canonical_unit=d['canonical_unit'],canonical_race=d.get('canonical_race',race),basis='Previously reviewed and approved alias; preserve original evidence and exact permissions.')
    elif (race,key) in aliases:
        target=aliases[race,key]
        assert target in present[race] and combat(key)==combat(target)
        assert not any(m['base_unit'] in (key,target) or m['mounted_unit'] in (key,target) for m in mounts)
        c.update(decision='exclude_duplicate',canonical_unit=target,canonical_race=race,basis='All non-identity main/land fields and culture-qualified abilities, missile attachments and extra-engine relations match; neither identity has mount edges. Shared referenced keys preserve components, attributes, weapons and contact effects. Permissions remain distinct and are not transferred.',canonical_combat_signature_sha256=signature(target),canonical_permissions=by_perm[target])
        note=f'Equivalent combat alias {key} has separate source permissions; see historical-roster-decisions.json. Canonical permissions in unit_rosters are not alias permissions; no campaign access equivalence is inferred.'
        rosters[race].setdefault('permission_unit_notes',{})[target]=note
        c['canonical_availability_note']=note
    else:
        note=f'Source-supported configuration for {c["faction"]}; exact custom-battle permissions and campaign_exclusive flags are in unit_rosters. Race inclusion does not imply access by every campaign faction.'
        if c['exact_faction_permitted_subtypes']:
            note+=' A recruitable base subtype also has a non-disabled permission for this exact faction; campaign unlocks and mount grants are not established.'
        elif c['mount_edges']:
            note+=' Source mount relation retained; campaign unlock and acquisition conditions are unverified.'
        else:
            note+=' Campaign acquisition is unverified; this is not a claim of ordinary recruitment.'
        c.update(decision='include',basis='Valid source main/land identity and explicit exact-faction permission; no reviewed equivalent already covers this race/unit configuration.',availability_note=note)
        r=rosters[race];r.setdefault('permission_units',[]).append(key);r.setdefault('permission_unit_notes',{})[key]=note
    cases.append(c)
for race,r in rosters.items():
    r['permission_units']=sorted(set(r.get('permission_units',[])))
    r['expected_units']=len(present[race])+sum(c['race']==race and c['decision']=='include' for c in cases)
# Broaden discovery to every source faction in each represented subculture.
factions={r['key']:r for r in table('unit_stats','factions')}
future={race:present[race]|{c['unit'] for c in cases if c['race']==race and c['decision']=='include'} for race in rosters}
resolved={(c['race'],c['unit']) for c in cases}
extra=[]
for race,r in rosters.items():
    for p in perms:
        f=factions.get(p['faction'],{})
        if f.get('subculture')==r['subculture_key'] and p['unit'] not in future[race] and (race,p['unit']) not in resolved:
            extra.append({'race':race,'permission':p,'source_identity_valid':p['unit'] in main and main[p['unit']]['land_unit'] in land})
# Include the four newly discovered, valid exact-faction configurations too.
# The explicit override identifies the evidence faction, not race-wide access.
for e in extra:
    race=e['race'];p=e['permission'];key=p['unit'];assert e['source_identity_valid']
    note=f"Source-supported configuration for {p['faction']} only as evidenced; exact custom-battle permissions and campaign_exclusive flags are retained in unit_rosters. Campaign acquisition and ordinary recruitment are unverified; no access is inferred for the representative faction or every faction in this race."
    c={'race':race,'faction':p['faction'],'unit':key,'land_unit':main[key]['land_unit'],
       'classification':'additional_exact_faction_permission','decision':'include',
       'basis':'Additional same-subculture faction has explicit source permission and a valid main/land identity.',
       'permissions':by_perm[key],'mount_edges':by_mount[key],
       'combat_signature_sha256':signature(key),'availability_note':note}
    cases.append(c);r=rosters[race];r['permission_units'].append(key)
    r.setdefault('permission_unit_factions',{})[key]=p['faction']
    r.setdefault('permission_unit_notes',{})[key]=note;r['expected_units']+=1
for r in rosters.values():r['permission_units']=sorted(set(r['permission_units']))
report={'baseline_commit':BASE,'snapshot':'9.0 / 25507028','scope':'All 800 original representative-faction cases plus four additional same-subculture faction configurations. Exact source custom-battle configurations are supported; campaign routes are not inferred. Duplicate equivalence is limited to represented combat fields, not external scripts or permission identities.','summary':dict(Counter(c['decision'] for c in cases)),'by_race':{race:dict(Counter(c['decision'] for c in cases if c['race']==race)) for race in rosters},'source_sha256':hashes,'additional_faction_permission_discoveries':extra,'cases':cases}
out=ROOT/'docs/development/update-9.0/historical-roster-decisions.json';out.write_text(json.dumps(report,indent=2)+'\n')
parser=argparse.ArgumentParser()
parser.add_argument('--apply-scope',action='store_true')
if parser.parse_args().apply_scope:
    # Preserve the separately reviewed scripted acquisition route when
    # reproducing the older custom-battle permission reconciliation.
    scripted_path=ROOT/'docs/development/update-9.0/archaon-scripted-availability.json'
    if scripted_path.exists():
        scripted=json.loads(scripted_path.read_text())
        r=rosters['warriors_of_chaos']
        scripted_cases={c['unit']:c for c in scripted['cases']}
        r['script_units']=sorted(scripted_cases)
        r['script_unit_notes']={k:c['availability_note'] for k,c in sorted(scripted_cases.items())}
        r['expected_units']+=len(set(scripted_cases)-present['warriors_of_chaos']-{c['unit'] for c in cases if c['race']=='warriors_of_chaos' and c['decision']=='include'})
    (ROOT/'scripts/scope-9.0.json').write_text(json.dumps(scope,indent=2)+'\n')
print(json.dumps({'summary':report['summary'],'new_total':sum(r['expected_units'] for r in rosters.values()),'additional_faction_permission_rows':len(extra)},indent=2))
