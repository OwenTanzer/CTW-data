"""Compare retained source files, without treating changed rows as reviewed semantics."""
import collections, hashlib, json, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OLD='8ad5a33a4d08eab6cf1273815501846f91d4647a'
NEW='66c0dbe38fbf1a574c7d4d7a22b8d9ad8f5ea530'
def tree(ref):
 out=subprocess.check_output(['git','ls-tree','-r',ref,'data'],cwd=ROOT,text=True)
 return {p:(meta.split()[2]) for line in out.splitlines() for meta,p in [line.split('\t',1)] if '/source_exports/' in p}
def blob(sha):return subprocess.check_output(['git','cat-file','blob',sha],cwd=ROOT)
def records(b):
 lines=b.decode('utf-8-sig').splitlines();h=lines[0].split('\t')
 return h,collections.Counter(tuple(x.split('\t')) for x in lines[1:] if x and not x.startswith('#'))
old,new=tree(OLD),tree(NEW);rows=[]
for p in sorted(old.keys()|new.keys()):
 a,b=old.get(p),new.get(p);status='unchanged' if a==b else 'added' if a is None else 'removed' if b is None else 'changed'
 r={'path':p,'owner':p.split('/')[1],'status':status,'old_git_blob':a,'new_git_blob':b}
 if status!='unchanged':
  aa=blob(a) if a else None;bb=blob(b) if b else None
  r.update(old_sha256=hashlib.sha256(aa).hexdigest() if aa is not None else None,new_sha256=hashlib.sha256(bb).hexdigest() if bb is not None else None)
  if p.endswith('.tsv'):
   ah,ar=records(aa) if aa else ([],collections.Counter());bh,br=records(bb) if bb else ([],collections.Counter())
   r.update(old_rows=sum(ar.values()),new_rows=sum(br.values()),header_changed=ah!=bh)
   if ah==bh:
    r.update(removed_row_occurrences=sum((ar-br).values()),added_row_occurrences=sum((br-ar).values()))
    if ar==br:r['status']='encoding_metadata_or_order_only'
   r['disposition']='unchanged_table_content' if r['status']=='encoding_metadata_or_order_only' else 'changed_source_content_requires_owner_accounting'
  else:r['disposition']='non_tsv_source_or_extraction_metadata_requires_owner_accounting'
 rows.append(r)
summary={owner:dict(collections.Counter(r['status'] for r in rows if r['owner']==owner)) for owner in sorted({r['owner'] for r in rows})}
report={'old_commit':OLD,'new_commit':NEW,'scope':'All retained files under data/**/source_exports at both pinned commits. TSV comparisons use literal tabs, preserve multiplicity and ignore RPFM metadata lines. Header changes are not coerced. Other formats receive byte-level comparison only. Added/removed files describe retained export coverage, not proof of game additions/removals. Campaign binary/source checkpoints outside these paths require separate accounting. No claim of semantic completeness or guide factual verification.','summary':summary,'files':rows}
(ROOT/'docs/development/update-9.0/source-inventory.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(summary,indent=2))
