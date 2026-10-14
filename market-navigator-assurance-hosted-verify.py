"""Independently verify the hosted delivery, source replay and frozen index mathematics."""
import argparse,concurrent.futures,copy,datetime as dt,hashlib,importlib.util,json,tempfile,time,urllib.request
from pathlib import Path
BASE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('assurance_verify_worker',BASE/'market-navigator-rebuild-worker.py');w=importlib.util.module_from_spec(spec);spec.loader.exec_module(w)
spec=importlib.util.spec_from_file_location('assurance_verify_export',BASE/'market-navigator-assurance-export.py');delivery=importlib.util.module_from_spec(spec);spec.loader.exec_module(delivery)
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'MarketNavigatorAssuranceVerifier/1.0','Cache-Control':'no-cache'})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=30) as response:return response.read()
        except (urllib.error.URLError,TimeoutError) as error:
            if isinstance(error,urllib.error.HTTPError) and error.code not in (429,500,502,503,504):raise
            if attempt==2:raise
            time.sleep(.5*(attempt+1))
def receipt_rebuild_matches(root,rebuilt,model):
    """Original archive formatting and compact receipt formatting may hash differently.

    Accept only complete JSON object equality between two independently hash-checked
    retained blobs; every other model field must reconstruct exactly.
    """
    aligned=copy.deepcopy(rebuilt)
    for key,row in model['indices'].items():
        if key not in aligned['indices']:return False
        reconstructed=aligned['indices'][key].get('recoveredCalculations',[])
        if len(reconstructed)!=len(row.get('recoveredCalculations',[])):return False
        for original,replay in zip(row['recoveredCalculations'],reconstructed):
            if set(original['sources'])!=set(replay['sources']):return False
            for sid,proof in original['sources'].items():
                other=replay['sources'][sid]
                if proof['blob']==other['blob']:continue
                objects=[]
                for identity in (proof['blob'],other['blob']):
                    if len(identity)!=40 or any(c not in '0123456789abcdef' for c in identity):raise ValueError('Invalid replay source identity')
                    payload=(Path(root)/'market-evidence/collection-archive/blobs'/(identity+'.json')).read_bytes()
                    if w.h.blob(payload)!=identity:raise ValueError('Replay source hash differs')
                    objects.append(json.loads(payload))
                # JSON serialization distinguishes booleans, integers and floats;
                # Python's ordinary equality would equate False with zero.
                if json.dumps(objects[0],sort_keys=True,separators=(',',':'),allow_nan=False)!=json.dumps(objects[1],sort_keys=True,separators=(',',':'),allow_nan=False):return False
                other['blob']=proof['blob']
    return json.dumps(aligned,sort_keys=True,separators=(',',':'),allow_nan=False)==json.dumps(model,sort_keys=True,separators=(',',':'),allow_nan=False)
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
        delivery.referenced_index_evidence(root)
        catalog=w.h.read(root/'data/market-backend/data-catalog.json');registry=w.h.read(root/'data/market-backend/component-registry-v1.json')
        captures=w.h.load_receipts(root,{m['id']:m for m in catalog['series']},[r['id'] for r in registry['components']])
        rebuilt,_=w.h.recover(w.h.read(BASE/'market-navigator-rebuild-seed.json'),registry,captures)
        if not receipt_rebuild_matches(root,rebuilt,w.h.read(root/'market-evidence/persistent-indices-v1.json')):raise ValueError('Delivered receipt replay differs from admitted index model')
        admission=w.audit(root);assurance=w.assurance.assess(root,admission=admission)
        if assurance['state'] not in ('verified','verified-with-limitations'):raise ValueError('Hosted independent assurance failed: '+json.dumps(assurance['findings']))
        if assurance['summary']['datasets']!=39:raise ValueError('Corpus coverage changed; inventory review required')
        if dt.datetime.now(dt.timezone.utc)-w.h.instant(status['heartbeatAt'])>dt.timedelta(hours=1):raise ValueError('Hosted collector heartbeat expired')
        return {'schema':'market-navigator-hosted-assurance-proof-v1','verifiedAt':dt.datetime.now(dt.timezone.utc).isoformat(),'url':url,'generation':status['generation'],'filesVerified':len(manifest['files']),'summary':assurance['summary'],'state':assurance['state'],'independentStoredAndSourceReplay':True,'frozenIndexMathematicsReproduced':True,'deliveredReceiptRebuildReproduced':True}
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--url',required=True);p.add_argument('--generation');p.add_argument('--output',default='market-navigator-assurance-hosted-proof.json');args=p.parse_args();proof=verify(args.url,args.generation);w.h.write(args.output,proof);print(json.dumps(proof,indent=2))
