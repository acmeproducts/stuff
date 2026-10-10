"""Independently verify the hosted delivery, source replay and frozen index mathematics."""
import argparse,concurrent.futures,datetime as dt,hashlib,importlib.util,json,tempfile,time,urllib.request
from pathlib import Path
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('assurance_verify_worker',BASE/'market-navigator-rebuild-worker.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MarketNavigatorAssuranceVerifier/1.0','Cache-Control':'no-cache'})
    with urllib.request.urlopen(req,timeout=30) as response:return response.read()
def verify(url,expected=None):
    url=url.rstrip('/')+'/'
    for attempt in range(30):
        try:
            status=json.loads(get(url+'assurance-status.json?verify='+str(time.time_ns())))
            if expected and status['generation']['generation']!=expected:raise ValueError('Requested generation has not reached Pages')
            break
        except Exception:
            if attempt==29:raise
            time.sleep(5)
    manifest=json.loads(get(url+status['deliveryManifest']))
    if manifest['revision']!=status['generation']['revision'] or manifest['generation']!=status['generation']['generation']:raise ValueError('Status/manifest generation mismatch')
    with tempfile.TemporaryDirectory() as folder:
        root=Path(folder)
        def download(item):
            rel,sha=item
            if '..' in rel or not rel.startswith(('market-evidence/','data/market-backend/')):raise ValueError('Invalid manifest path')
            payload=get(url+'generations/'+manifest['generation']+'/'+rel)
            if hashlib.sha256(payload).hexdigest()!=sha:raise ValueError('Delivered bytes differ: '+rel)
            path=root/rel;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(payload)
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:list(pool.map(download,manifest['files'].items()))
        admission=w.audit(root);assurance=w.assurance.assess(root,admission=admission)
        if assurance['state'] not in ('verified','verified-with-limitations'):raise ValueError('Hosted independent assurance failed: '+json.dumps(assurance['findings']))
        if assurance['summary']['datasets']!=39:raise ValueError('Corpus coverage changed; inventory review required')
        if dt.datetime.now(dt.timezone.utc)-w.h.instant(status['heartbeatAt'])>dt.timedelta(hours=1):raise ValueError('Hosted collector heartbeat expired')
        return {'schema':'market-navigator-hosted-assurance-proof-v1','verifiedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'url':url,'generation':status['generation'],'filesVerified':len(manifest['files']),'summary':assurance['summary'],'state':assurance['state'],'independentStoredAndSourceReplay':True,'frozenIndexMathematicsReproduced':True}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--generation');p.add_argument('--output',default='market-navigator-assurance-hosted-proof.json');args=p.parse_args();proof=verify(args.url,args.generation);w.h.write(args.output,proof);print(json.dumps(proof,indent=2))
