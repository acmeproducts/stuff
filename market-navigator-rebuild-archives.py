"""Recover missed collection days from public, hash-verified Git archives."""
import concurrent.futures,datetime as dt,hashlib,json,urllib.parse,urllib.request,uuid
from pathlib import Path

REPOSITORY='acmeproducts/stuff'
def request(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'MarketNavigatorArchiveRecovery/1.0'}),timeout=45) as response:return response.read()

def hydrate_inventory(entries,cache,ids):
    """A clean runner and a damaged cache both recover from pinned public Git bytes."""
    jobs={f['sha']:(entry,f) for entry in entries for f in entry['files'] if Path(f['path']).stem in ids or f['path']=='market-evidence/operational-manifest.json'}
    def hydrate(job):
        entry,file=job;target=Path(cache)/'blobs'/(file['sha']+'.json');target.parent.mkdir(parents=True,exist_ok=True)
        existing=target.read_bytes() if target.exists() else None
        def matches(payload):return hashlib.sha1(b'blob '+str(len(payload)).encode()+b'\0'+payload).hexdigest()==file['sha']
        if existing is not None and matches(existing):return 'verified'
        payload=request('https://raw.githubusercontent.com/'+REPOSITORY+'/'+entry['commit']+'/'+file['path'])
        if not matches(payload):raise ValueError('Pinned historical source response hash differs')
        if existing is not None:target.with_name(target.name+'.quarantined-'+uuid.uuid4().hex).write_bytes(existing)
        temporary=target.with_name(target.name+'.'+uuid.uuid4().hex+'.tmp');temporary.write_bytes(payload);temporary.replace(target)
        return 'repaired' if existing is not None else 'retrieved'
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:outcomes=list(pool.map(hydrate,jobs.values()))
    return {kind:outcomes.count(kind) for kind in ('verified','retrieved','repaired')}

def ensure_days(inventory,cache,required_days,ids,qualify=None):
    entries=json.loads(Path(inventory).read_text(encoding='utf-8'));hydrate_inventory(entries,cache,ids);present={x['committedAt'][:10] for x in entries};missing=set(required_days)-present
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
