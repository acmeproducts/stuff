"""Recover missed collection days from public, hash-verified Git archives."""
import datetime as dt,hashlib,json,urllib.parse,urllib.request
from pathlib import Path

REPOSITORY='acmeproducts/stuff'
def request(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MarketNavigatorArchiveRecovery/1.0'}),timeout=45) as response:return response.read()

def ensure_days(inventory,cache,required_days,ids,qualify=None):
    entries=json.loads(Path(inventory).read_text(encoding='utf-8'));present={x['committedAt'][:10] for x in entries};missing=set(required_days)-present
    if not missing:return entries
    # Exact publication time is recorded separately from the calendar coordinate.
    for page in range(1,5):
        url='https://api.github.com/repos/'+REPOSITORY+'/commits?'+urllib.parse.urlencode({'path':'market-evidence/operational-manifest.json','per_page':100,'page':page})
        commits=json.loads(request(url))
        for commit in commits:
            committed=commit['commit']['committer']['date'];day=committed[:10]
            if day not in missing:continue
            sha=commit['sha'];tree=json.loads(request('https://api.github.com/repos/'+REPOSITORY+'/git/trees/'+sha+'?recursive=1'))
            if tree.get('truncated'):raise ValueError('Git archive tree is incomplete')
            wanted={'market-evidence/series/'+sid+'.json' for sid in ids}|{'market-evidence/operational-manifest.json'}
            files=[{'path':f['path'],'sha':f['sha']} for f in tree['tree'] if f['path'] in wanted and f['type']=='blob']
            if {f['path'] for f in files}!=wanted:continue
            entry={'commit':sha,'committedAt':committed,'files':files}
            for file in files:
                target=Path(cache)/'blobs'/(file['sha']+'.json');target.parent.mkdir(parents=True,exist_ok=True)
                payload=target.read_bytes() if target.exists() else request('https://raw.githubusercontent.com/'+REPOSITORY+'/'+sha+'/'+file['path'])
                actual=hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\0'+payload).hexdigest()
                if actual!=file['sha']:raise ValueError('Git historical input hash mismatch')
                if not target.exists():target.write_bytes(payload)
            if qualify:
                try:qualify(entry)
                except (ValueError,KeyError):continue
            entries.append(entry);missing.remove(day)
            if not missing:return entries
        if not commits or min(c['commit']['committer']['date'][:10] for c in commits)<min(missing):break
    raise ValueError('No authentic daily collection archive found: '+','.join(sorted(missing)))
