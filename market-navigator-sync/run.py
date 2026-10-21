"""Synchronize and independently gate one atomic chart-data generation.

Latest native observations use the approved no-auth provider adapters. Existing
ALFRED availability history is retained; extending it uses the configured secret.
No chart UI or model weights/anchors/scales are generated here.
"""
import argparse,bisect,concurrent.futures,contextlib,copy,csv,datetime as dt,hashlib,importlib.util,io,json,math,os,shutil,statistics,tempfile,threading,urllib.parse
from pathlib import Path
HERE=Path(__file__).resolve().parent
H=['1D','5D','MTD','YTD','1YR','3YR','5YR'];UTC=dt.timezone.utc
APP='7b4526e0aaf650ab682d9e30cd804cf55fe36bc5'
REGISTRY='e423bd96ec47b960ff4dbbb169e3be6a42165f4a'
HY_PREFIX='05a9a2ca600c573fd3e5a948a7fe2e7672186076c9f955f9db78e8858e90b287'
def load(name):
    spec=importlib.util.spec_from_file_location(name.replace('-','_'),HERE/(name+'.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def read(path):return json.loads(Path(path).read_text(encoding='utf-8'))
def write(path,obj):
    p=Path(path);p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(obj,sort_keys=True,separators=(',',':'))+'\n',encoding='utf-8')
def digest(obj):return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def blob(raw):return hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()
def date(t):return dt.datetime.fromtimestamp(t/1000,UTC).date().isoformat()
def ms(d):return int(dt.datetime.fromisoformat(d).replace(tzinfo=UTC).timestamp()*1000)
def near(a,b):return math.isclose(a,b,rel_tol=0,abs_tol=1e-10)
def shift(end,h):
    d=dt.date.fromisoformat(end)
    if h in ('1D','5D'):return str(d-dt.timedelta(days=1 if h=='1D' else 5))
    if h=='MTD':return str(d.replace(day=1))
    if h=='YTD':return str(d.replace(month=1,day=1))
    try:return str(d.replace(year=d.year-int(h[:-2])))
    except ValueError:return str(d.replace(year=d.year-int(h[:-2]),day=28))
def shared_start(market_dates,end,h):
    days=sorted(d for d in market_dates if d<=end)
    if h in ('1D','5D'):return days[-(2 if h=='1D' else 5)]
    return next(d for d in days if d>=shift(end,h))
@contextlib.contextmanager
def cwd(path):
    before=Path.cwd();os.chdir(path)
    try:yield
    finally:os.chdir(before)
def canonical(native,meta):
    if 'year-over-year percent change' not in (meta.get('transformation') or '').lower():return native
    values={date(p['t']):p['v'] for p in native};out=[]
    for p in native:
        d=dt.date.fromisoformat(date(p['t']))
        try:prior=str(d.replace(year=d.year-1))
        except ValueError:prior=str(d.replace(year=d.year-1,day=28))
        if values.get(prior):out.append({'t':p['t'],'v':100*(p['v']/values[prior]-1)})
    return out
def aggregate(points):
    if not points:return {'ready':False,'observation_count':0,'reason':'No native observations in selected calendar window'}
    values=[p['v'] for p in points];a,b=points[0],points[-1]
    return {'ready':True,'t0_date':a['t'],'t0_value':a['v'],'now_date':b['t'],'now_value':b['v'],'absolute_change':b['v']-a['v'],'percentage_change':100*(b['v']-a['v'])/a['v'] if a['v'] else None,'observation_count':len(points),'min':min(values),'max':max(values),'mean':statistics.fmean(values),'median':statistics.median(values),'percentile_now':round(100*(sum(x<b['v'] for x in values)+.5*sum(x==b['v'] for x in values))/len(values),2)}
def release_probe_due(meta,source,now,market_anchor):
    if meta.get('native_cadence')!='daily' or source.get('provider')!='FRED' or not market_anchor or not source.get('last'):return False
    if date(source['last'])>=market_anchor:return False
    verified=source.get('sourceVerifiedAt')
    return not verified or now-dt.datetime.fromisoformat(verified.replace('Z','+00:00'))>=dt.timedelta(hours=1)
def fred_current_tail(root,identifier,now):
    import urllib.request,urllib.error
    keys=list(dict.fromkeys(os.environ.get(n,'').strip() for n in ('MARKET_NAVIGATOR_FRED_API_KEY','MARKET_NAVIGATOR_FRED_API_KEY_SECONDARY') if os.environ.get(n,'').strip()))
    if not keys:raise ValueError('Configured FRED credential required for daily catch-up verification')
    params={'series_id':identifier,'observation_start':str(now.date()-dt.timedelta(days=14)),'file_type':'json','limit':100000}
    public='https://api.stlouisfed.org/fred/series/observations?'+urllib.parse.urlencode(params)
    for i,key in enumerate(keys):
        try:
            req=urllib.request.Request(public+'&api_key='+urllib.parse.quote(key),headers={'User-Agent':'MarketNavigatorCompleteness/1.0'})
            with urllib.request.urlopen(req,timeout=30) as response:raw=response.read()
            if any(k.encode() in raw for k in keys):raise ValueError('Credential appeared in FRED response; response withheld')
            payload=json.loads(raw);points=[{'t':ms(r['date']),'v':float(r['value'])} for r in payload.get('observations',[]) if r.get('value') not in (None,'','.')]
            if not points:raise ValueError('FRED daily catch-up returned no numeric observations')
            sha=hashlib.sha256(raw).hexdigest();path=root/'market-evidence/sync-responses'/(sha+'.bin');path.parent.mkdir(exist_ok=True);path.write_bytes(raw)
            return points,{'path':str(path.relative_to(root)).replace('\\','/'),'sha256':sha,'url':public,'http':200,'format':'fred-observations-json'}
        except urllib.error.HTTPError as e:
            if e.code in (400,401,403,429) and i+1<len(keys):continue
            raise ValueError('FRED daily catch-up HTTP '+str(e.code)) from None
        except urllib.error.URLError:raise ValueError('FRED daily catch-up connection failed') from None

def collect(root,now,force=False,fetch=None,previous_version=None):
    collector=load('market-navigator-r7-data-pipeline');catalog=read(root/'data/market-backend/data-catalog.json');rules=read(root/'data/market-backend/publication-rules.json')['rules']
    anchor_path=root/'market-evidence/derived-indices-persistent-v1.json'
    market_anchor=read(anchor_path).get('commonMarketAnchor') if anchor_path.exists() else None
    metas=[m for m in catalog['series'] if m.get('enabled',True)];changes=[];results=[];local=threading.local();original=collector.get
    def retained_get(url,accept='*/*'):
        raw,status=original(url,accept);sha=hashlib.sha256(raw).hexdigest()
        path=root/'market-evidence/sync-responses'/(sha+'.bin');path.parent.mkdir(exist_ok=True);path.write_bytes(raw)
        local.responses.append({'path':str(path.relative_to(root)).replace('\\','/'),'sha256':sha,'url':url,'http':status})
        return raw,status
    collector.get=retained_get
    def one(meta):
        sid=meta['id'];source=read(root/f'market-evidence/series/{sid}.json');native=read(root/f'market-evidence/source-observations/{sid}.json');local.responses=[]
        if (source['provider'],source['providerIdentifier']) not in {(p['provider'],p['identifier']) for p in collector.chain_for(meta)}:raise ValueError('Unapproved source identity: '+sid)
        verified=source.get('sourceVerifiedAt')
        due=collector._scheduler.eligibility(meta,source,now,rules,last_attempt=verified)[0]
        probe=release_probe_due(meta,source,now,market_anchor)
        if not force and not probe and verified and not due and now-dt.datetime.fromisoformat(verified.replace('Z','+00:00'))<dt.timedelta(hours=24):return {'id':sid,'status':'not-due','changed':False}
        if fetch:incoming=fetch(meta,source,native,now)
        else:incoming,_=collector.fetch_source(source['provider'],source['providerIdentifier'],True)
        if not fetch and source['provider']=='FRED' and meta['native_cadence']=='daily':
            tail,response=fred_current_tail(root,source['providerIdentifier'],now);local.responses.append(response)
            bydate={date(p['t']):p for p in incoming}
            bydate.update({date(p['t']):p for p in tail});incoming=sorted(bydate.values(),key=lambda p:p['t'])
        if not incoming:raise ValueError('Empty source history: '+sid)
        if meta['native_cadence'] in ('trading-day','daily-nav'):
            completed=collector._scheduler.expectation(meta,now,rules)['period']
            incoming=[p for p in incoming if date(p['t'])<=completed]
        if not incoming:raise ValueError('No completed source observations: '+sid)
        incoming=collector.canon(incoming);old=native['observations'];first,last=date(incoming[0]['t']),date(incoming[-1]['t'])
        prefix=[p for p in old if date(p['t'])<first]
        if prefix and sid!='hySpread':raise ValueError('Provider no longer confirms retained prefix: '+sid)
        if prefix and digest(old[:1893])!=HY_PREFIX:raise ValueError('Retained HY baseline prefix differs from exact approved archive')
        if len(prefix)>1893 and (not previous_version or len(previous_version)!=64):raise ValueError('Rolling HY history requires its previous verified package identity')
        # Approved HY exception: retain only the unchanged trusted package prefix.
        merged=sorted(prefix+incoming,key=lambda p:p['t']);newcanonical=canonical(merged,meta)
        if not newcanonical:raise ValueError('Empty transformed series: '+sid)
        expected=collector._scheduler.expectation(meta,now,rules)['period']
        if expected and date(newcanonical[-1]['t'])<expected:raise ValueError('Provider awaiting expected native period: '+sid+' '+expected)
        oldmap={date(p['t']):p['v'] for p in old};newmap={date(p['t']):p['v'] for p in merged}
        revised=[d for d in oldmap.keys()&newmap.keys() if oldmap[d]!=newmap[d]];added=sorted(newmap.keys()-oldmap.keys());withdrawn=sorted(oldmap.keys()-newmap.keys())
        changed=merged!=old
        at=now.isoformat().replace('+00:00','Z');native.update(observations=merged,sourceRevision=digest(merged));write(root/f'market-evidence/source-observations/{sid}.json',native)
        source.update(observations=newcanonical,sourceRevision=digest(newcanonical),count=len(newcanonical),first=newcanonical[0]['t'],last=newcanonical[-1]['t'],last_attempted=at,last_successful=at,last_error=None,sourceVerifiedAt=at,sourceResponses=local.responses,sourceProofMode='fixture' if fetch else 'retained-provider-response')
        if prefix:source['retainedHistoryProof']={'kind':'unchanged history inherited from hash-verified package','previousVersion':previous_version,'previousCommit':os.environ.get('GITHUB_SHA'),'previousNativeRevision':digest(old),'initialApprovedPrefix':HY_PREFIX,'retainedCount':len(prefix)}
        write(root/f'market-evidence/series/{sid}.json',source)
        return {'id':sid,'status':'verified','changed':changed,'revisedDates':sorted(revised),'addedDates':added,'withdrawnDates':withdrawn,'sourceObservations':len(merged),'approvedRetainedPrefix':len(prefix),'responses':local.responses}
    def guarded(meta):
        try:return one(meta)
        except Exception as error:raise RuntimeError('Source '+meta['id']+' failed: '+str(error)) from None
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        for result in pool.map(guarded,metas):results.append(result)
    return results
def extend_vintages(root,rows,now):
    registry=read(root/'data/market-backend/component-registry-v1.json');required={m['id'] for m in registry['components'] if m['provider']=='FRED'}
    changed=[r['id'] for r in rows if r['changed'] and r['id'] in required]
    if not changed:return []
    extension=load('market-navigator-etl-vintage')
    with cwd(root):return extension.update(changed,read,write,now.isoformat().replace('+00:00','Z'))
def rebuild(root):
    builder=load('market-navigator-build-persistent-indices');compat=load('market-navigator-build-persistent-compat')
    with cwd(root),contextlib.redirect_stdout(io.StringIO()):builder.main();compat.main()
    derived=read(root/'market-evidence/derived-indices-persistent-v1.json');end=derived['commonMarketAnchor'];cat=read(root/'data/market-backend/data-catalog.json')
    for meta in cat['series']:
        if not meta.get('enabled',True):continue
        sid=meta['id'];s=read(root/f'market-evidence/series/{sid}.json');reports={}
        for h in H:
            start=derived['indices']['risk']['horizons'][h]['commonT0'];points=[p for p in s['observations'] if ms(start)<=p['t']<ms(end)+86400000]
            report=aggregate(points);prior=[p for p in s['observations'] if p['t']<=ms(start)]
            report.update(horizon=h,series_id=sid,source=s['provider'],source_revision=s['sourceRevision'],window_start=start,window_end=end,aggregation_rule='actual native observations in shared calendar window; carry state separate',carry_state=prior[-1] if prior else None);reports[h]=report
        write(root/f'market-evidence/reports/{sid}.json',{'schema':'market-navigator-evidence-report-v1','id':sid,'reports':reports,'computedRevision':digest(reports)})
    return derived
def verify_native_response(root,native,source,allow_fixture):
    if allow_fixture and source.get('sourceProofMode')=='fixture':return
    responses=source.get('sourceResponses') or []
    if not responses:raise ValueError('Level 0 retained provider response missing: '+source['id'])
    points=[]
    for response in responses:
        raw=(root/response['path']).read_bytes()
        if hashlib.sha256(raw).hexdigest()!=response['sha256']:raise ValueError('Level 0 response hash mismatch')
        provider=source['provider']
        if provider=='FRED' and response.get('format')=='fred-observations-json':
            if urllib.parse.parse_qs(urllib.parse.urlparse(response['url']).query).get('series_id')!=[source['providerIdentifier']]:raise ValueError('Level 0 API identifier mismatch')
            obj=json.loads(raw)
            points.extend({'t':ms(r['date']),'v':float(r['value'])} for r in obj.get('observations',[]) if r.get('value') not in (None,'','.'))
        elif provider=='FRED':
            rows=list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
            if rows[0][1]!=source['providerIdentifier']:raise ValueError('Level 0 response identifier mismatch')
            for row in rows[1:]:
                if len(row)>=2 and row[1].strip() not in ('','.'):
                    points.append({'t':ms(row[0]),'v':float(row[1])})
        elif provider=='Yahoo Finance':
            obj=json.loads(raw)['chart']['result'][0]
            for t,v in zip(obj['timestamp'],obj['indicators']['quote'][0]['close']):
                if v is not None and math.isfinite(float(v)):points.append({'t':int(t)*1000,'v':float(v)})
        elif provider=='Nasdaq Fund Network':
            obj=json.loads(raw)['data'];rows=obj['tradesTable']['rows']
            if obj['symbol'].upper()!=source['providerIdentifier'].upper() or len(rows)!=int(obj['totalRecords']):raise ValueError('Level 0 fund response identity/count mismatch')
            for row in rows:points.append({'t':int(dt.datetime.strptime(row['date'],'%m/%d/%Y').replace(tzinfo=UTC).timestamp()*1000),'v':float(row['close'].replace('$','').replace(',',''))})
        else:raise ValueError('Level 0 independent parser unavailable: '+provider)
    received={date(p['t']):p['v'] for p in points};saved={date(p['t']):p['v'] for p in native['observations']}
    if not received:raise ValueError('Level 0 empty independent response')
    prefix=[d for d in saved if d<min(received)]
    if prefix and source['id']!='hySpread':raise ValueError('Level 0 unconfirmed retained prefix')
    if prefix and digest(native['observations'][:1893])!=HY_PREFIX:raise ValueError('Level 0 approved HY archive mismatch')
    if len(prefix)>1893:
        proof=source.get('retainedHistoryProof',{})
        if proof.get('initialApprovedPrefix')!=HY_PREFIX or proof.get('retainedCount')!=len(prefix) or len(proof.get('previousVersion',''))!=64 or len(proof.get('previousNativeRevision',''))!=64:raise ValueError('Level 0 rolling HY archive lacks previous verified package linkage')
    expected={d:v for d,v in received.items() if min(saved)<=d<=max(saved)}
    actual={d:v for d,v in saved.items() if d>=min(received)}
    if actual!=expected:raise ValueError('Level 0 native vector differs from independently parsed provider response: '+source['id'])
def qualify(root,allow_fixture=False):
    registry_path=root/'data/market-backend/component-registry-v1.json'
    if blob(registry_path.read_bytes())!=REGISTRY:raise ValueError('Frozen model registry changed')
    registry=read(registry_path);rules={m['id']:m for m in registry['components']};cat=read(root/'data/market-backend/data-catalog.json');model=read(root/'market-evidence/persistent-indices-v1.json');derived=read(root/'market-evidence/derived-indices-persistent-v1.json')
    # Separate event-state replay, independent of builder.vintage_events/asof.
    events={};series={};transforms=0;aggregates=0;terms_checked=0;point_checks=0
    for meta in cat['series']:
        if not meta.get('enabled',True):continue
        sid=meta['id'];native=read(root/f'market-evidence/source-observations/{sid}.json');s=read(root/f'market-evidence/series/{sid}.json');a=s['observations'];series[sid]=a
        if (native['provider'],native['providerIdentifier'],native['cadence'])!=(s['provider'],s['providerIdentifier'],meta['native_cadence']):raise ValueError('Level 0 identity mismatch: '+sid)
        times=[p['t'] for p in native['observations']]
        if times!=sorted(set(times)) or any(not math.isfinite(p['v']) for p in native['observations']):raise ValueError('Level 0 malformed vector: '+sid)
        if 'year-over-year percent change' in (meta.get('transformation') or '').lower():
            monthly={(dt.datetime.fromtimestamp(p['t']/1000,UTC).year,dt.datetime.fromtimestamp(p['t']/1000,UTC).month):p['v'] for p in native['observations']}
            expected=[]
            for p in native['observations']:
                d=dt.datetime.fromtimestamp(p['t']/1000,UTC);before=monthly.get((d.year-1,d.month))
                if before:expected.append({'t':p['t'],'v':100*(p['v']/before-1)})
        else:expected=native['observations']
        if len(a)!=len(expected) or any(p['t']!=q['t'] or not near(p['v'],q['v']) for p,q in zip(a,expected)):raise ValueError('Level 1 transformation mismatch: '+sid)
        if s['sourceRevision']!=digest(a) or native['sourceRevision']!=digest(native['observations']):raise ValueError('Level 0 revision mismatch: '+sid)
        verify_native_response(root,native,s,allow_fixture)
        transforms+=1
        reports=read(root/f'market-evidence/reports/{sid}.json')['reports']
        if set(reports)!=set(H):raise ValueError('Level 1 missing horizon: '+sid)
        for h,report in reports.items():
            start=derived['indices']['risk']['horizons'][h]['commonT0'];end=derived['commonMarketAnchor'];points=[p for p in a if ms(start)<=p['t']<ms(end)+86400000]
            expected={'ready':bool(points),'observation_count':len(points)}
            if points:
                a0,a1=points[0],points[-1];values=sorted(p['v'] for p in points);n=len(values);delta=a1['v']-a0['v']
                expected.update(t0_date=a0['t'],t0_value=a0['v'],now_date=a1['t'],now_value=a1['v'],absolute_change=delta,percentage_change=100*delta/a0['v'] if a0['v'] else None,min=values[0],max=values[-1],mean=math.fsum(values)/n,median=values[n//2] if n%2 else (values[n//2-1]+values[n//2])/2,percentile_now=round(100*(sum(v<a1['v'] for v in values)+.5*sum(v==a1['v'] for v in values))/n,2))
            mismatch=any((report.get(k) is not None if v is None else not near(report.get(k,float('nan')),v)) for k,v in expected.items())
            if mismatch or report.get('window_start')!=start or report.get('window_end')!=end:raise ValueError('Level 1 horizon mismatch: '+sid+' '+h)
            aggregates+=1
        if sid not in rules:continue
        vp=root/f'market-evidence/vintage/{sid}.json';v=read(vp) if vp.exists() else None
        if rules[sid]['provider']=='FRED' and v and v['availabilityQualification']=='QUALIFIED_ALFRED':
            updates={}
            for event in v['events']:updates.setdefault(event['availableFrom'],[]).append(event)
            native_state={};states=[]
            for available,batch in sorted(updates.items()):
                for event in batch:native_state[event['observationDate']]=float(event['value'])
                if sid in ('cpi','corePce'):
                    options=[d for d in native_state if shift(d,'1YR') in native_state]
                    if not options:continue
                    obs=max(options);value=100*(native_state[obs]/native_state[shift(obs,'1YR')]-1)
                else:obs=max(native_state);value=native_state[obs]
                states.append((available,obs,value))
            events[sid]=states
        else:
            if rules[sid]['provider']=='FRED' and sid!='hySpread':raise ValueError('Missing qualified availability history: '+sid)
            events[sid]=[(date(p['t']),date(p['t']),p['v']) for p in a]
    clocks={sid:[x[0] for x in e] for sid,e in events.items()}
    def state(sid,d):
        i=bisect.bisect_right(clocks[sid],d)-1
        if i<0:raise ValueError('Missing anchor/input state: '+sid)
        return events[sid][i]
    anchor=model['anchorDate'];anchors={sid:state(sid,anchor)[2] for sid in rules};market={date(p['t']) for p in series['qqq'] if date(p['t'])>=anchor};proof={}
    for index,row in model['indices'].items():
        if row['components']!=registry['indices'][index]['components'] or len(row['components'])!=7:raise ValueError('Constituents changed: '+index)
        dates=row['dates'];lookup=dict(zip(dates,row['values']))
        if dates!=sorted(set(dates)) or row['timestamps']!=[ms(d) for d in dates]:raise ValueError('Level 3 invalid evaluation clock: '+index)
        if market-set(dates):raise ValueError('Level 3 missing daily index evaluations: '+index)
        for i,d in enumerate(dates):
            signals=[]
            for sid in row['components']:
                _,obs,value=state(sid,d);rule=rules[sid];movement=math.log(value/anchors[sid]) if rule['transformFamily']=='log_return' else value-anchors[sid];signal=rule['direction']*movement/rule['scale']['annualizedScale']
                if not near(value,row['componentValues'][sid][i]) or obs!=row['componentObservationDates'][sid][i] or not near(signal,row['componentSignals'][sid][i]):raise ValueError('Level 3 component mismatch: '+index+' '+sid+' '+d)
                signals.append(signal);terms_checked+=1
            if not near(100+math.fsum(signals)/7,row['values'][i]):raise ValueError('Level 3 arithmetic mismatch: '+index+' '+d)
        if set(derived['indices'][index]['horizons'])!=set(H):raise ValueError('Level 3 missing horizon: '+index)
        for h,z in derived['indices'][index]['horizons'].items():
            requested=shared_start(market,derived['commonMarketAnchor'],h);expected_dates=[d for d in dates if requested<=d<=derived['commonMarketAnchor']];actual_dates=[date(p['t']) for p in z['curve']]
            if actual_dates!=expected_dates or len(actual_dates)<2:raise ValueError('Level 3 horizon coverage mismatch: '+index+' '+h)
            if market.intersection(d for d in market if requested<=d<=derived['commonMarketAnchor'])-set(actual_dates):raise ValueError('Level 3 horizon calendar gap')
            for p in z['curve']:
                if not near(p['v'],lookup[date(p['t'])]):raise ValueError('Level 3 horizon value mismatch')
                point_checks+=1
            i,j=dates.index(actual_dates[0]),dates.index(actual_dates[-1]);contribution=math.fsum((row['componentSignals'][sid][j]-row['componentSignals'][sid][i])/7 for sid in row['components'])
            if not near(contribution,z['value']-z['baseline']):raise ValueError('Level 3 contribution mismatch')
            if not near(z['baseline'],lookup[actual_dates[0]]) or not near(z['value'],lookup[actual_dates[-1]]):raise ValueError('Level 3 endpoint mismatch')
            if [c['id'] for c in z['components']]!=row['components']:raise ValueError('Level 3 incomplete horizon constituents')
            for c in z['components']:
                sid=c['id'];expected={'t0Value':row['componentValues'][sid][i],'nowValue':row['componentValues'][sid][j],'signalT0':row['componentSignals'][sid][i],'signalNow':row['componentSignals'][sid][j],'direction':rules[sid]['direction'],'transformScale':rules[sid]['scale']['annualizedScale']}
                if any(not near(c.get(k,float('nan')),v) for k,v in expected.items()) or c.get('sourceT0Date')!=row['componentObservationDates'][sid][i] or c.get('sourceNowDate')!=row['componentObservationDates'][sid][j]:raise ValueError('Level 3 horizon constituent mismatch: '+sid)
            proof[index+' '+h]={'start':actual_dates[0],'end':actual_dates[-1],'points':len(actual_dates),'value':z['value'],'status':'PASS'}
    return {'status':'PASS','level0Series':transforms,'level1SeriesHorizons':aggregates,'level3IndexHorizons':len(proof),'componentChecks':terms_checked,'horizonPointChecks':point_checks,'horizons':proof,'limitations':['HY approved archived prefix; retrospective current-vintage backcast exception','Historical ALFRED events retained; subsequent availability updates source-checked when FRED data changes']}
def require_complete(root,now):
    gate=load('freshness');return gate.require_complete(root,now,read,load('market-navigator-r7-data-pipeline')._scheduler)
def synchronize(base,output,now=None,force=False,fetch=None,vintage_update=None):
    base=Path(base).resolve();output=Path(output).resolve();now=now or dt.datetime.now(UTC)
    descriptor=read(base/'market-navigator-rebuild-data/package.json')
    data=base/'market-navigator-rebuild-data'
    for p,h in descriptor['resources'].items():
        if hashlib.sha256((data/p).read_bytes()).hexdigest()!=h:raise ValueError('Existing trusted package corrupt: '+p)
    app=(HERE/'approved-chart.html').read_bytes()
    if blob(app)!=APP:raise ValueError('Approved chart source changed')
    output.parent.mkdir(parents=True,exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='mn-sync-',dir=output.parent) as temporary:
        stage=Path(temporary)/'candidate';shutil.copytree(base,stage);root=stage/'market-navigator-rebuild-data'
        rows=collect(root,now,force,fetch,descriptor['version'])
        try:completeness=require_complete(root,now)
        except Exception:
            rejected=output.parent/'rejected-evidence'/now.strftime('%Y%m%dT%H%M%S%fZ')
            shutil.copytree(root,rejected)
            raise
        if all(r['status']=='not-due' for r in rows) and (root/'market-evidence/sync-proof.json').exists() and read(root/'market-evidence/sync-proof.json').get('qualification',{}).get('freshness',{}).get('status')=='PASS' and blob((base/'throwaway.html').read_bytes())==APP:
            if output.exists():raise ValueError('Output must be a new candidate path')
            shutil.copytree(base,output)
            return {'status':'PASS','unchanged':True,'version':descriptor['version'],'previousVersion':descriptor['version'],'changedSeries':[],'qualification':read(root/'market-evidence/sync-proof.json')['qualification']}
        (vintage_update or extend_vintages)(root,rows,now)
        derived=rebuild(root);proof=qualify(root,allow_fixture=fetch is not None)
        previous_model=read(data/'market-evidence/persistent-indices-v1.json');new_model=read(root/'market-evidence/persistent-indices-v1.json')
        for index,row in new_model['indices'].items():
            for sid in row['components']:
                if row['componentValues'][sid][0]!=previous_model['indices'][index]['componentValues'][sid][0]:raise ValueError('A source revision changes the frozen model anchor; preserving verified data: '+sid)
        proof['freshness']=completeness
        proof['sourceProofMode']='fixture replay' if fetch else 'independently parsed retained provider responses'
        write(root/'market-evidence/sync-proof.json',{'generatedAt':now.isoformat(),'sourceCollection':rows,'qualification':proof,'previousVersion':descriptor['version']})
        health=read(root/'market-evidence/health-envelope.json');health.update(generatedAt=now.isoformat(),marketAnchor=derived['commonMarketAnchor'])
        for row in rows:
            sid=row['id'];s=read(root/f'market-evidence/series/{sid}.json');reports=read(root/f'market-evidence/reports/{sid}.json')
            health['series'][sid].update(actualLatestCanonicalObservation=date(s['last']),classification='current',collectorError=None,collectorStatus='healthy',observationCount=s['count'],lastCollectionAttempt=s['last_attempted'],lastSuccessfulCollection=s['last_successful'],sourceRevision=s['sourceRevision'],horizonCoverage={h:bool(r['ready']) for h,r in reports['reports'].items()},why='Approved provider observations verified at '+s['sourceVerifiedAt']+'; native observation dates and index evaluation dates remain distinct.')
        health['summary'].update(current=len(rows),sparse=0,stale=0,failed=0,missing=0)
        write(root/'market-evidence/health-envelope.json',health)
        operational=read(root/'market-evidence/operational-manifest.json');operational['generatedAt']=now.isoformat()
        for row in rows:
            sid=row['id'];s=read(root/f'market-evidence/series/{sid}.json');reports=read(root/f'market-evidence/reports/{sid}.json')
            operational['series'][sid].update(status='healthy',first_observation=s['first'],latest_observation=s['last'],observation_count=s['count'],last_attempted=s['last_attempted'],last_successful=s['last_successful'],source_revision=s['sourceRevision'],computed_revision=reports['computedRevision'],last_error=None,horizon_readiness={h:bool(r['ready']) for h,r in reports['reports'].items()})
        operational['summary'].update(ready=True,sourceFailures=[],acceptanceBlockers=[]);write(root/'market-evidence/operational-manifest.json',operational)
        registration_path=root/'data/market-backend/source-registry.json';registrations=read(registration_path)
        for entry in registrations.get('registrations',[]):
            if entry['id'] not in {r['id'] for r in rows}:continue
            s=read(root/f"market-evidence/series/{entry['id']}.json");entry.update(observationCount=s['count'],lastSuccessfulCollection=s['last_successful'],collectorError=None,healthClassification='current')
        registrations['updatedAt']=now.isoformat();write(registration_path,registrations)
        # Git retains prior responses. The active package contains only response
        # bytes linked by its current native vectors, avoiding unbounded copies.
        active={ref['path'] for meta in read(root/'data/market-backend/data-catalog.json')['series'] if meta.get('enabled',True) for ref in read(root/f"market-evidence/series/{meta['id']}.json").get('sourceResponses',[])}
        for p in (root/'market-evidence/sync-responses').glob('*.bin'):
            if str(p.relative_to(root)).replace('\\','/') not in active:p.unlink()
        # Every output resource, including retained source responses, is pinned.
        resources={str(p.relative_to(root)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(root.rglob('*')) if p.is_file() and p.name!='package.json'}
        version=digest(resources);write(root/'package.json',{'schema':'market-navigator-etl-package-v1','qualified':True,'version':version,'resources':resources})
        (stage/'throwaway.html').write_bytes(app);write(stage/'connection.json',{'application_blob':APP,'approved_baseline_blob':'ee38d9c9da9af4b2795695a39519c76e6c5e5239','data_version':version,'verified_resources':len(resources),'status':'PASS','jobstream_ui':True,'qualification':proof})
        # The caller publishes this completed tree in one Git commit. An error
        # before this point cannot alter either the live or candidate directory.
        if output.exists():raise ValueError('Output must be a new candidate path')
        shutil.copytree(stage,output)
        return {'status':'PASS','version':version,'previousVersion':descriptor['version'],'changedSeries':[r['id'] for r in rows if r['changed']],'qualification':proof}
def main():
    p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--output',required=True);p.add_argument('--force',action='store_true');a=p.parse_args()
    try:result=synchronize(a.base,a.output,force=a.force)
    except Exception as error:
        # API helper redacts configured credentials before exceptions reach here.
        message=str(error)
        for name in ('MARKET_NAVIGATOR_FRED_API_KEY','MARKET_NAVIGATOR_FRED_API_KEY_SECONDARY'):
            key=os.environ.get(name)
            if key:message=message.replace(key,'[redacted]')
        result={'status':'FAIL','error':message,'lastVerifiedVersionPreserved':True,'displayPermitted':False,**({'freshness':error.report} if hasattr(error,'report') else {})};write(Path(a.output).parent/'sync-status.json',result);print(json.dumps(result));raise SystemExit(1)
    write(Path(a.output).parent/'sync-status.json',result);print(json.dumps(result))
if __name__=='__main__':main()
