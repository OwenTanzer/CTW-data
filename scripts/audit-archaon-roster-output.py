"""Compare the Archaon scripted-availability candidate against merged PR #26."""
import csv,io,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BASE='4747d01b37c161571b75fc3203206cae8b3b0e55'
fixture=json.loads((ROOT/'docs/development/update-9.0/archaon-scripted-availability.json').read_text())
expected={c['unit'] for c in fixture['cases']};old={}
for p in (ROOT/'data/unit_stats/normalized').glob('*.csv'):
    raw=subprocess.check_output(['git','show',f'{BASE}:{p.relative_to(ROOT)}'],cwd=ROOT).decode()
    old[p.name.split('__')[0]]={r['unit_key']:r for r in csv.DictReader(io.StringIO(raw))}
output=ROOT/'data/unit_stats/normalized/warriors_of_chaos__wh3__9.0__ultra.csv'
new={r['unit_key']:r for r in csv.DictReader(output.open())}
assert set(old['warriors_of_chaos'])<=set(new)
added=set(new)-set(old['warriors_of_chaos']);assert added==expected,(added^expected)
for race,prior in old.items():
    p=ROOT/f'data/unit_stats/normalized/{race}__wh3__9.0__ultra.csv'
    now={r['unit_key']:r for r in csv.DictReader(p.open())}
    assert set(now)==set(prior)| (expected if race=='warriors_of_chaos' else set()),race
    for key,row in prior.items():
        changed={col for col in row if col!='extracted_at_utc' and row[col]!=now[key][col]}
        assert not changed,(race,key,changed)
report={'status':'passed','baseline_commit':BASE,'old_rows':3155,'added_warriors_of_chaos':len(added),'new_rows':sum(len(old[r]) for r in old)+len(added),'old_semantic_row_changes':0,'source_script_sha256':fixture['source_script_sha256'],'coverage':{'leaders':fixture['leader_subtypes'],'conditional_chieftains':fixture['extra_transfer_subtypes'],'mounts':fixture['source_mounts']}}
(ROOT/'docs/development/update-9.0/archaon-output-audit.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
