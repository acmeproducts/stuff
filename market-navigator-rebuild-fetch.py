"""Preserve pinned daily canonical archives; verify every downloaded Git blob."""
import concurrent.futures,hashlib,json,urllib.request
from pathlib import Path
root=Path('market-navigator-rebuild-data');archive=Path('market-navigator-rebuild-archive')
if not root.exists():raise SystemExit('The isolated rebuild data snapshot must be present; no previous candidate is a construction input.')
registry=json.loads((root/'data/market-backend/component-registry-v1.json').read_text());ids={x['id'] for x in registry['components']}
inventory=json.loads(Path('market-navigator-rebuild-archive-inventory.json').read_text());jobs=[(c,f) for c in inventory for f in c['files'] if Path(f['path']).stem in ids or f['path']=='market-evidence/operational-manifest.json']
cache=archive/'blobs';cache.mkdir(parents=True,exist_ok=True)
def fetch(job):
    c,f=job;target=cache/(f['sha']+'.json')
    if target.exists():data=target.read_bytes()
    else:
        url='https://raw.githubusercontent.com/acmeproducts/stuff/'+c['commit']+'/'+f['path']
        with urllib.request.urlopen(url,timeout=60) as response:data=response.read()
    assert hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()==f['sha'],(c['commit'],f['path'])
    if not target.exists():target.write_bytes(data)
    return f['sha']
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:done=list(pool.map(fetch,jobs))
print(json.dumps({'dailyArchives':len(inventory),'verifiedAssets':len(done),'uniqueBlobs':len(set(done)),'root':str(root)}))
