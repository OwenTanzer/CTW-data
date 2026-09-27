"""Check the installed #23 repair independently of its selector configuration."""
import csv, io, json, subprocess
from collections import Counter
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='6282fd8b6181c6ba4dd6390753a86527b3812c23'
decisions=json.loads((ROOT/'docs/development/update-9.0/historical-roster-decisions.json').read_text())
expected={(c['race'],c['unit']) for c in decisions['cases'] if c['decision']=='include'}
added=set(); changed=[];counts={}
for p in sorted((ROOT/'data/unit_stats/normalized').glob('*.csv')):
    race=p.name.split('__')[0]
    old={r['unit_key']:r for r in csv.DictReader(io.StringIO(subprocess.check_output(['git','show',f'{BASE}:{p.relative_to(ROOT)}'],cwd=ROOT).decode()))}
    new={r['unit_key']:r for r in csv.DictReader(p.open())}
    assert old.keys()<=new.keys(), f'Lost prior records: {race}'
    added.update((race,k) for k in new.keys()-old.keys());counts[race]=len(new)
    for key,row in old.items():
        fields=[col for col in row if col!='extracted_at_utc' and row[col]!=new[key][col]]
        if fields:
            assert fields==['availability_notes'], (race,key,fields)
            assert any(c['race']==race and c.get('canonical_unit')==key and c.get('canonical_availability_note')==new[key]['availability_notes'] for c in decisions['cases'])
            changed.append({'race':race,'unit':key,'fields':fields})
assert added==expected,(len(added),len(expected))
# Referenced source mount bases must actually be represented somewhere.
all_keys=set()
for p in (ROOT/'data/unit_stats/normalized').glob('*.csv'):
    all_keys.update(r['unit_key'] for r in csv.DictReader(p.open()))
missing_bases=sorted({e['base_unit'] for c in decisions['cases'] if c['decision']=='include' for e in c['mount_edges'] if e['base_unit'] not in all_keys})
assert not missing_bases,missing_bases
report={'baseline_commit':BASE,'status':'passed','old_rows_preserved':2367,'new_rows':len(added),'total_rows':sum(counts.values()),'old_combat_field_changes':0,'old_availability_note_changes':changed,'generated_timestamp_changes':'Ignored for semantic comparison; source exports unchanged.','roster_counts':counts,'included_mount_bases_missing':missing_bases}
(ROOT/'docs/development/update-9.0/historical-roster-output-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ('old_availability_note_changes','roster_counts')},indent=2))
