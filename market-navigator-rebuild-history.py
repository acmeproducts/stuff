"""Recover daily governed calculations from immutable, actually collected inputs.

Calendar dates are chart coordinates, not collection instants. Original model
rows are retained; recovered calculations carry their exact archive provenance.
"""
import argparse,base64,copy,datetime as dt,hashlib,json,math,importlib.util,time,uuid
import urllib.request
from pathlib import Path
UTC=dt.timezone.utc
H=('1D','5D','MTD','YTD','1YR','3YR','5YR')
BASELINE_BLOB='5dc07f7368efc0bd2e03e70af720c7d491611f75'
REGISTRY_BLOB='e423bd96ec47b960ff4dbbb169e3be6a42165f4a'
_spec=importlib.util.spec_from_file_location('mn_rebuild_policy',Path(__file__).with_name('market-navigator-rebuild-policy.py'))
policy=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(policy)
_spec=importlib.util.spec_from_file_location('mn_rebuild_integrity',Path(__file__).with_name('market-navigator-rebuild-integrity.py'))
integrity=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(integrity)
def read(path):return json.loads(Path(path).read_text(encoding='utf-8'))
def encode(obj):return (json.dumps(obj,sort_keys=True,separators=(',',':'))+'\n').encode()
def digest(obj):return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def blob(data):return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
def archived_bytes(path,sha,cache=None):
    """Restore exact retained bytes; never replace a historical vector with live data."""
    path=Path(path);original=path.read_bytes() if path.exists() else None
    if original is not None and blob(original)==sha:return original
    cache=Path(cache or Path(__file__).with_name('market-navigator-rebuild-archive'))/'blobs'/(sha+'.json')
    payload=cache.read_bytes() if cache.exists() else None
    if payload is None or blob(payload)!=sha:
        request=urllib.request.Request('https://api.github.com/repos/acmeproducts/stuff/git/blobs/'+sha,headers={'User-Agent':'MarketNavigatorExactArchiveRecovery/1.0'})
        try:
            with urllib.request.urlopen(request,timeout=30) as response:obj=json.loads(response.read())
            if obj.get('sha')!=sha or obj.get('encoding')!='base64':raise ValueError('Exact archive response identity differs')
            payload=base64.b64decode(obj['content'])
        except (OSError,KeyError,ValueError) as error:raise ValueError('Exact archived source unavailable: '+sha) from error
    if blob(payload)!=sha:raise ValueError('Exact archived source response hash differs: '+sha)
    path.parent.mkdir(parents=True,exist_ok=True)
    if original is not None:path.with_name(path.name+'.quarantined-'+uuid.uuid4().hex).write_bytes(original)
    temporary=path.with_name(path.name+'.restored-'+uuid.uuid4().hex);temporary.write_bytes(payload);temporary.replace(path)
    return payload
def instant(value):return dt.datetime.fromisoformat(value.replace('Z','+00:00')).astimezone(UTC)
def calendar(stamp):return dt.datetime.fromtimestamp(stamp/1000,UTC).date().isoformat()
def midnight(date):return int(dt.datetime.fromisoformat(date).replace(tzinfo=UTC).timestamp()*1000)
def write(path,obj):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True);payload=encode(obj)
    if path.exists() and path.read_bytes()==payload:return
    temp=path.with_name(path.name+'.'+uuid.uuid4().hex+'.tmp');temp.write_bytes(payload)
    # Windows sync/readers may briefly hold a destination. Keep atomic replacement;
    # never delete the last good file as a workaround for a sharing violation.
    for attempt in range(30):
        try:temp.replace(path);return
        except PermissionError:
            if attempt==29:raise
            time.sleep(.2)
def validate_source(obj,sid,catalog,known_by):
    if obj.get('id')!=sid:raise ValueError('Canonical identity mismatch: '+sid)
    meta=catalog[sid];chain=meta.get('provider_chain') or [{'provider':meta['provider'],'identifier':meta['provider_identifier']}]
    if (obj.get('provider'),obj.get('providerIdentifier')) not in [(x['provider'],x['identifier']) for x in chain]:raise ValueError('Unqualified provider identity: '+sid)
    if obj.get('last_error') or not obj.get('last_successful'):raise ValueError('Collection did not succeed: '+sid)
    collected=instant(obj['last_successful'])
    if collected>known_by:raise ValueError('Collection is not known by archive time: '+sid)
    points=obj.get('observations') or []
    if any(not isinstance(q,dict) or any(isinstance(q.get(k),bool) or not isinstance(q.get(k),(int,float)) or not math.isfinite(q[k]) for k in ('t','v')) for q in points):raise ValueError('Malformed observation: '+sid)
    times=[q.get('t') for q in points]
    if not points or times!=sorted(set(times)):raise ValueError('Missing/duplicate/unordered observations: '+sid)
    if any(not isinstance(q.get('v'),(int,float)) or not math.isfinite(q['v']) or not isinstance(q.get('t'),(int,float)) or q['t']>collected.timestamp()*1000 for q in points):raise ValueError('Malformed/future observation: '+sid)
    if obj.get('sourceRevision')!=digest(points) or obj.get('count')!=len(points) or obj.get('first')!=times[0] or obj.get('last')!=times[-1]:raise ValueError('Native revision or vector metadata mismatch: '+sid)
    return collected
def archive_capture(entry,cache,catalog,ids):
    known=instant(entry['committedAt']);lookup={x['path']:x for x in entry['files']};sources={};proof={}
    manifest_entry=lookup['market-evidence/operational-manifest.json'];raw=(Path(cache)/(manifest_entry['sha']+'.json')).read_bytes()
    if blob(raw)!=manifest_entry['sha']:raise ValueError('Archive manifest blob mismatch')
    manifest=json.loads(raw)
    for sid in ids:
        f=lookup.get('market-evidence/series/'+sid+'.json')
        if not f:raise ValueError('Required archived input missing: '+sid)
        payload=(Path(cache)/(f['sha']+'.json')).read_bytes()
        if blob(payload)!=f['sha']:raise ValueError('Archive blob mismatch: '+sid)
        obj=json.loads(payload);collected=validate_source(obj,sid,catalog,known)
        registered=manifest['series'][sid]
        if registered.get('source_revision')!=obj['sourceRevision'] or registered.get('last_successful')!=obj['last_successful']:raise ValueError('Archived manifest/source mismatch: '+sid)
        if known-collected>dt.timedelta(hours=48):raise ValueError('Archived collection heartbeat expired: '+sid)
        sources[sid]=obj
        proof[sid]={'blob':f['sha'],'sourceRevision':obj['sourceRevision'],'collectedAt':obj['last_successful'],'observationDate':calendar(obj['last']),'nativeTimestamp':obj['last'],'nativeValue':obj['observations'][-1]['v'],'provider':obj['provider'],'providerIdentifier':obj['providerIdentifier']}
    return {'calendarDate':known.date().isoformat(),'knownBy':entry['committedAt'],'archiveCommit':entry['commit'],'kind':'recovered-calculation-from-archived-collections','sources':sources,'provenance':proof}
def live_capture(root,catalog,ids,now):
    sources={};proof={}
    for sid in ids:
        path=Path(root)/'market-evidence/series'/f'{sid}.json';payload=path.read_bytes();obj=json.loads(payload)
        collected=validate_source(obj,sid,catalog,now)
        if now-collected>dt.timedelta(hours=48):raise ValueError('Live collector heartbeat expired: '+sid)
        sources[sid]=obj;proof[sid]={'blob':blob(encode(obj)),'canonicalFileBlob':blob(payload),'sourceRevision':obj['sourceRevision'],'collectedAt':obj['last_successful'],'observationDate':calendar(obj['last']),'nativeTimestamp':obj['last'],'nativeValue':obj['observations'][-1]['v'],'provider':obj['provider'],'providerIdentifier':obj['providerIdentifier']}
    captured=max(instant(obj['last_successful']) for obj in sources.values())
    return {'calendarDate':captured.date().isoformat(),'knownBy':captured.isoformat().replace('+00:00','Z'),'kind':'live-collected-calculation','sources':sources,'provenance':proof}
def calculate(row,meta,sources):
    values={sid:float(sources[sid]['observations'][-1]['v']) for sid in row['components']};signals={}
    for sid,value in values.items():
        rule=meta[sid];anchor=row['componentValues'][sid][0];scale=rule['scale']['annualizedScale']
        if rule['coefficient']!=1/7 or not scale or not math.isfinite(scale):raise ValueError('Frozen coefficient/scale mismatch')
        if rule['transformFamily']=='log_return':
            if value<=0 or anchor<=0:raise ValueError('Invalid logarithmic component: '+sid)
            move=math.log(value/anchor)
        elif rule['transformFamily'] in ('signed_price_change','rate_change','signed_level_change'):move=value-anchor
        else:raise ValueError('Unsupported frozen transform: '+rule['transformFamily'])
        signals[sid]=rule['direction']*move/scale
    return 100+sum(signals.values())/7,values,signals
def recover(seed,registry,captures):
    result=copy.deepcopy(seed);meta={x['id']:x for x in registry['components']};proof={};end=max(c['calendarDate'] for c in captures)
    for key,row in result['indices'].items():
        n=len(row['dates']);daily={}
        for capture in sorted(captures,key=lambda c:instant(c['knownBy'])):
            if capture['calendarDate']>row['dates'][-1]:daily[capture['calendarDate']]=capture
        if not daily:raise ValueError('No recovery inputs for '+key)
        expected={str(dt.date.fromisoformat(row['dates'][-1])+dt.timedelta(days=i)) for i in range(1,(dt.date.fromisoformat(end)-dt.date.fromisoformat(row['dates'][-1])).days+1)}
        row['unavailableCapturedDays']=sorted(expected-set(daily))
        row['recoveredCalculations']=[]
        for date,capture in sorted(daily.items()):
            level,values,signals=calculate(row,meta,capture['sources'])
            row['dates'].append(date);row['timestamps'].append(midnight(date));row['values'].append(level)
            for sid in row['components']:
                row['componentValues'][sid].append(values[sid]);row['componentSignals'][sid].append(signals[sid]);row['componentObservationDates'][sid].append(calendar(capture['sources'][sid]['last']))
            row['recoveredCalculations'].append({k:v for k,v in capture.items() if k!='sources' and k!='provenance'}|{'sources':{sid:capture['provenance'][sid] for sid in row['components']}})
        proof[key]={'retainedRows':n,'recoveredCalendarDays':len(daily),'firstRecoveredDate':min(daily),'lastRecoveredDate':max(daily)}
    result['datasetVersion']='MN-NATIVE-PROJECTION-RECOVERY-3';result['captureRule']='One UTC calendar coordinate per actually captured day. Missing captured states remain unavailable; native-period projection is reconstructed from retained source vectors with later knownBy, not claimed as historical availability.'
    result['recoveryRule']='Original baseline rows retained exactly. Later rows are recalculated from immutable archived collections; not claimed to have been published index values. No current-vintage substitution or synthetic gap interpolation.'
    result['calendarContract']='UTC calendar date of collected index state, not a market closing timestamp or the instant of availability.'
    result['baselinePersistentBlob']=BASELINE_BLOB;result['generatedAt']=max(c['knownBy'] for c in captures);return result,proof
def start(end,h):
    d=dt.date.fromisoformat(end)
    if h in ('1D','5D'):return str(d-dt.timedelta(days=int(h[:-1])))
    if h=='MTD':return str(d.replace(day=1))
    if h=='YTD':return str(d.replace(month=1,day=1))
    try:return str(d.replace(year=d.year-int(h[:-2])))
    except ValueError:return str(d.replace(year=d.year-int(h[:-2]),day=28))
def compatibility(model,registry,catalog=None,root=None):
    if catalog is None:
        catalog=read(Path(__file__).with_name('market-navigator-rebuild-data')/'data/market-backend/data-catalog.json')
    catalog_meta={x['id']:x for x in catalog['series']}
    seed=read(Path(__file__).with_name('market-navigator-rebuild-seed.json'))
    root=Path(root or Path(__file__).with_name('market-navigator-rebuild-data'))
    projected={key:integrity.latest_projection(root,row,seed['indices'][key],catalog_meta,registry) for key,row in model['indices'].items()}
    meta={x['id']:x for x in registry['components']};end=min(calendar(points[-1]['t']) for points in projected.values())
    evidence={'schema':'market-navigator-derived-indices-persistent-v1','version':model['modelVersion'],'definitionVersion':registry['modelVersion'],'datasetVersion':model['datasetVersion'],'generatedAt':model['generatedAt'],'revision':digest(model)[:16],'commonMarketAnchor':end,'calendarContract':'Native daily reference period; latest captured vintage; knownBy retained separately','capturedStateCalendarContract':model['calendarContract'],'formula':'index(t) = 100 + fixed mean of seven governed component signals','coherence':{'allIndexHorizonsComputable':True,'rule':'Every horizon is a native-period projection over retained captured states; original rows and frozen mathematics retained.'},'componentTransforms':{},'ratioEligibility':{},'indices':{}}
    for sid,m in meta.items():evidence['componentTransforms'][sid]={'eligible':True,'kind':m['transformFamily'],'reason':None,'scale':m['scale']['annualizedScale'],'scaleRule':m['scale']['method']};evidence['ratioEligibility'][sid]={'eligible':True,'reason':'governed persistent transform'}
    for key,row in model['indices'].items():
        horizons={}
        for h in H:
            requested=start(end,h);curve=[p for p in projected[key] if requested<=calendar(p['t'])<=end]
            if not curve:raise ValueError('No required horizon history: '+key+' '+h)
            components=[]
            def input_value(point,sid):
                return point['nativeInputs'][sid]['v'] if 'nativeInputs' in point else row['componentValues'][sid][row['dates'].index(calendar(point['t']))]
            def input_date(point,sid):
                return calendar(point['nativeInputs'][sid]['t']) if 'nativeInputs' in point else row['componentObservationDates'][sid][row['dates'].index(calendar(point['t']))]
            for sid in row['components']:
                a,b=input_value(curve[0],sid),input_value(curve[-1],sid);m=meta[sid];anchor=row['componentValues'][sid][0]
                def signal(v):return m['direction']*(math.log(v/anchor) if m['transformFamily']=='log_return' else v-anchor)/m['scale']['annualizedScale']
                s0,s1=signal(a),signal(b)
                components.append({'id':sid,'direction':m['direction'],'health':'current','commonT0':calendar(curve[0]['t']),'commonNow':end,'sourceT0Date':input_date(curve[0],sid),'sourceNowDate':input_date(curve[-1],sid),'t0Value':a,'nowValue':b,'rawMovement':b-a,'rawMovementPercent':100*(b/a-1) if a else None,'signalT0':s0,'signalNow':s1,'orientedIndex':100+s1-s0,'moveFrom100':s1-s0,'transform':m['transformFamily'],'transformScale':m['scale']['annualizedScale'],'transformScaleRule':m['scale']['method'],'noNewReleaseInHorizon':input_date(curve[0],sid)==input_date(curve[-1],sid)})
            horizons[h]={'baseline':curve[0]['v'],'value':curve[-1]['v'],'commonT0':requested,'firstObservationDate':calendar(curve[0]['t']),'commonNow':end,'componentsDefined':7,'componentsUsed':7,'componentCoverage':1,'components':components,'omitted':[],'reasons':[],'status':'current','calculationDateRule':'Native daily reference period; latest captured vintage; knownBy retained separately','noNewReleaseComponents':[x['id'] for x in components if x['noNewReleaseInHorizon']],'curve':curve}
        evidence['indices'][key]={'name':registry['indices'][key]['name'],'higherMeans':registry['indices'][key]['higherMeans'],'horizons':horizons}
    return evidence
def verify_cadence(capture,catalog,registry,rules):
    for sid,source in capture['sources'].items():
        status,expected,why=policy.freshness(catalog[sid],source,registry,rules,instant(capture['knownBy']))
        if status!='current':raise ValueError('Native publication shortfall: '+sid+' '+why)

def save_receipt(root,capture):
    folder=Path(root)/'market-evidence/collection-archive';receipt=copy.deepcopy({k:v for k,v in capture.items() if k!='sources'})
    for sid,source in capture['sources'].items():
        # Retain the actual collected object, including its complete source revision.
        payload=encode(source);sha=blob(payload);receipt['provenance'][sid]=dict(receipt['provenance'][sid],blob=sha)
        path=folder/'blobs'/(sha+'.json');path.parent.mkdir(parents=True,exist_ok=True)
        if not path.exists():path.write_bytes(payload)
        elif path.read_bytes()!=payload:raise ValueError('Collection archive hash collision')
    write(folder/'receipts'/(capture['calendarDate']+'-'+digest(receipt)[:16]+'.json'),receipt)

def load_receipts(root,catalog,ids):
    folder=Path(root)/'market-evidence/collection-archive';captures=[]
    for path in sorted((folder/'receipts').glob('*.json')):
        receipt=read(path);known=instant(receipt['knownBy']);receipt['sources']={}
        if receipt['calendarDate']!=known.date().isoformat():raise ValueError('Receipt calendar/instant mismatch')
        for sid in ids:
            reference=receipt['provenance'][sid];payload=archived_bytes(folder/'blobs'/(reference['blob']+'.json'),reference['blob'])
            if blob(payload)!=reference['blob']:raise ValueError('Collected receipt blob mismatch: '+sid)
            source=json.loads(payload);validate_source(source,sid,catalog,known)
            if source['sourceRevision']!=reference['sourceRevision'] or source['last']!=reference['nativeTimestamp'] or source['observations'][-1]['v']!=reference['nativeValue']:raise ValueError('Collected receipt metadata mismatch: '+sid)
            receipt['sources'][sid]=source
        captures.append(receipt)
    return captures

def build(root,archive,seed_path,inventory_path,now=None):
    root=Path(root);now=now or dt.datetime.now(UTC);seed_raw=Path(seed_path).read_bytes();registry_path=root/'data/market-backend/component-registry-v1.json'
    if blob(seed_raw)!=BASELINE_BLOB or blob(registry_path.read_bytes())!=REGISTRY_BLOB:raise ValueError('Immutable baseline model/registry differs')
    registry=read(registry_path);cat=read(root/'data/market-backend/data-catalog.json');catalog={x['id']:x for x in cat['series']};ids=[x['id'] for x in registry['components']]
    captures=[archive_capture(entry,Path(archive)/'blobs',catalog,ids) for entry in read(inventory_path)];archived_count=len(captures)
    captures.extend(load_receipts(root,catalog,ids));live=live_capture(root,catalog,ids,now);captures.append(live)
    rules=read(root/'data/market-backend/publication-rules.json')
    for capture in captures:verify_cadence(capture,catalog,cat,rules)
    model,proof=recover(json.loads(seed_raw),registry,captures)
    # A generation must contain the actual blobs behind every recovered input.
    folder=root/'market-evidence/collection-archive/blobs';folder.mkdir(parents=True,exist_ok=True)
    for capture in captures:
        for sid,reference in capture['provenance'].items():
            sha=reference['blob'];destination=folder/(sha+'.json')
            if destination.exists():payload=destination.read_bytes()
            elif (Path(archive)/'blobs'/(sha+'.json')).exists():payload=(Path(archive)/'blobs'/(sha+'.json')).read_bytes()
            else:payload=encode(capture['sources'][sid])
            if blob(payload)!=sha:raise ValueError('Recovered input blob unavailable or corrupt: '+sid)
            if not destination.exists():destination.write_bytes(payload)
    # All source validation, coverage and calculations finish before publication.
    for capture in captures:save_receipt(root,capture)
    evidence=compatibility(model,registry,cat,root)
    write(root/'market-evidence/persistent-indices-v1.json',model);write(root/'market-evidence/derived-indices-persistent-v1.json',evidence)
    report={'schema':'market-navigator-data-rebuild-proof-v1','baselineBlob':BASELINE_BLOB,'registryBlob':REGISTRY_BLOB,'datasetVersion':model['datasetVersion'],'modelVersion':model['modelVersion'],'indices':proof,'archiveAssetsVerified':archived_count*(len(ids)+1),'anchor':evidence['commonMarketAnchor'],'fiveDayCoverage':{key:{'start':z['horizons']['5D']['commonT0'],'end':z['horizons']['5D']['commonNow'],'dates':[calendar(p['t']) for p in z['horizons']['5D']['curve']]} for key,z in evidence['indices'].items()}}
    write(root/'market-evidence/rebuild-proof.json',report);return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',default='market-navigator-rebuild-data');p.add_argument('--archive',default='market-navigator-rebuild-archive');p.add_argument('--seed',default='market-navigator-rebuild-seed.json');p.add_argument('--inventory',default='market-navigator-rebuild-archive-inventory.json');a=p.parse_args();print(json.dumps(build(a.root,a.archive,a.seed,a.inventory),indent=2))
