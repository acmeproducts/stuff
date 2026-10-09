"""Operational corpus assurance; audit time never substitutes for upstream verification."""
import argparse, csv, datetime as dt, hashlib, importlib.util, json, math, statistics, uuid
from pathlib import Path
BASE=Path(__file__).resolve().parent;UTC=dt.timezone.utc
spec=importlib.util.spec_from_file_location('mn_assurance_history',BASE/'market-navigator-rebuild-history.py');h=importlib.util.module_from_spec(spec);spec.loader.exec_module(h)

def gaps(meta,points):
    dates=[dt.date.fromisoformat(h.calendar(p['t'])) for p in points]
    if not dates:return [],[]
    observed=set(dates);expected=set();limitations=[];cadence=meta.get('native_cadence')
    if cadence in ('monthly','quarterly'):
        stride=1 if cadence=='monthly' else 3
        start=dates[0].year*12+dates[0].month-1;stop=dates[-1].year*12+dates[-1].month-1
        expected={dt.date(m//12,m%12+1,1) for m in range(start,stop+1,stride)}
        if any(d.day!=1 or cadence=='quarterly' and d.month not in (1,4,7,10) for d in dates):limitations.append('Invalid native reference-period alignment')
    elif cadence=='weekly':
        expected={dates[0]+dt.timedelta(days=n) for n in range(0,(dates[-1]-dates[0]).days+1,7)}
        if len({d.weekday() for d in dates})!=1:limitations.append('Native weekly reference weekday varies; source confirmation required')
    elif cadence in ('trading-day','daily-nav'):
        day=dates[0]
        while day<=dates[-1]:
            if day.year in (2026,2027,2028) and day.weekday()<5 and day.isoformat() not in h.policy.NYSE_CLOSED[day.year]:expected.add(day)
            day+=dt.timedelta(days=1)
        if dates[0].year<2026 or dates[-1].year>2028:limitations.append('Exchange calendar covers 2026-2028; earlier history uses upstream period comparison')
    elif cadence=='daily' and meta.get('provider_identifier')=='DFF':
        expected={dates[0]+dt.timedelta(days=n) for n in range((dates[-1]-dates[0]).days+1)}
    elif cadence=='daily':limitations.append('Daily source omissions use upstream period comparison; weekdays alone do not prove publication')
    else:limitations.append('Unsupported cadence: '+str(cadence))
    return [d.isoformat() for d in sorted(expected-observed)],limitations

def replay_response(meta, receipt, payload):
    """Independently parse the retained source response; never trust receipt points."""
    provider=receipt['provider'];identifier=receipt['identifier'];points=[]
    if provider=='Yahoo Finance':
        response=json.loads(payload);row=response['chart']['result'][0]
        if row['meta']['symbol'].upper()!=identifier.upper():raise ValueError('Retained Yahoo symbol differs')
        if meta['native_unit'].startswith('USD') and row['meta'].get('currency')!='USD':raise ValueError('Retained Yahoo currency differs')
        for stamp,value in zip(row.get('timestamp',[]),row['indicators']['quote'][0]['close']):
            if value is not None:points.append({'t':int(stamp)*1000,'v':float(value)})
    elif provider=='FRED':
        rows=list(csv.reader(payload.decode('utf-8-sig').splitlines()))
        if len(rows[0])!=2 or rows[0][1]!=identifier:raise ValueError('Retained FRED series identity differs')
        for row in rows[1:]:
            if len(row)==2 and row[1] not in ('','.'):points.append({'t':h.midnight(row[0]),'v':float(row[1])})
    elif provider=='Stooq':
        for row in csv.DictReader(payload.decode('utf-8-sig').splitlines()):points.append({'t':h.midnight(row['Date']),'v':float(row['Close'])})
    elif provider=='Nasdaq Fund Network':
        response=json.loads(payload);data=response['data']
        if data['symbol'].upper()!=identifier.upper() or int(data['totalRecords'])!=len(data['tradesTable']['rows']):raise ValueError('Retained NAV identity/history differs')
        for row in data['tradesTable']['rows']:
            date=dt.datetime.strptime(row['date'],'%m/%d/%Y').date().isoformat();points.append({'t':h.midnight(date),'v':float(row['close'].replace('$','').replace(',',''))})
    else:raise ValueError('Unsupported retained source provider')
    if any(not math.isfinite(p['v']) for p in points):raise ValueError('Invalid retained source value')
    points=sorted({p['t']:p for p in points}.values(),key=lambda p:p['t'])
    checked=h.instant(receipt['checkedAt'])
    if provider in ('Yahoo Finance','Stooq','Nasdaq Fund Network') and meta['native_cadence'] in ('trading-day','daily-nav'):
        cutoff=h.policy.expected_market_session(checked).isoformat();points=[p for p in points if h.calendar(p['t'])<=cutoff]
    if 'year-over-year percent change' in (meta.get('transformation') or '').lower():
        prior={(dt.datetime.fromtimestamp(p['t']/1000,UTC).year,dt.datetime.fromtimestamp(p['t']/1000,UTC).month):p for p in points};changed=[]
        for point in points:
            date=dt.datetime.fromtimestamp(point['t']/1000,UTC);old=prior.get((date.year-1,date.month))
            if old and old['v']:changed.append({'t':point['t'],'v':(point['v']/old['v']-1)*100})
        points=changed
    floor=int((checked-dt.timedelta(days=365.25*10.25)).timestamp()*1000)
    return [p for p in points if p['t']>=floor]

def source_check(root,meta,source,now):
    receipt=source.get('sourceVerification')
    if not receipt:return {'status':'unverified','why':'No retained upstream verification receipt'}
    try:
        checked=h.instant(receipt['checkedAt'])
        if checked>now or now-checked>dt.timedelta(hours=2):raise ValueError('Upstream verification expired')
        if receipt['id']!=meta['id'] or receipt['sourceRevision']!=source['sourceRevision']:raise ValueError('Receipt identity/revision differs')
        if receipt.get('scope')!='full-retained-history':raise ValueError('Only a partial source window was verified')
        if receipt.get('unit')!=meta['native_unit'] or receipt.get('cadence')!=meta['native_cadence']:raise ValueError('Receipt unit/cadence differs')
        vid=receipt['verificationId']
        if len(vid)!=32 or any(c not in '0123456789abcdef' for c in vid):raise ValueError('Invalid verification identity')
        if h.read(root/'market-evidence/source-verifications'/f'{vid}.json')!=receipt:raise ValueError('Stored verification receipt differs')
        if 'verifiedPoints' in receipt and receipt['verifiedPoints']!=source['observations']:raise ValueError('Stored observations differ from verified source vector')
        if receipt.get('method')=='governed-transform':
            parent_meta=next(x for x in h.read(root/'data/market-backend/data-catalog.json')['series'] if x['id']==meta['transform_source_id'])
            parent=h.read(root/'market-evidence/series'/f"{meta['transform_source_id']}.json")
            if source_check(root,parent_meta,parent,now)['status']!='verified':raise ValueError('Transform parent not upstream verified')
            if receipt['parentRevision']!=parent['sourceRevision']:raise ValueError('Transform parent revision differs')
            ts=importlib.util.spec_from_file_location('mn_assurance_transform',BASE/'market-navigator-rebuild-transforms.py');t=importlib.util.module_from_spec(ts);ts.loader.exec_module(t)
            lag=1 if meta['transform']=='qoq_percent_change' else 4
            if t.quarterly_transform(parent['observations'],lag)!=source['observations']:raise ValueError('Governed transform differs from parent')
        else:
            if not receipt.get('responses'):raise ValueError('No source response retained')
            for response in receipt['responses']:
                sha=response['sha256']
                if len(sha)!=64 or any(c not in '0123456789abcdef' for c in sha):raise ValueError('Invalid response digest')
                payload=(root/'market-evidence/source-responses'/f'{sha}.bin').read_bytes()
                if hashlib.sha256(payload).hexdigest()!=sha:raise ValueError('Source response hash differs')
            parsed=replay_response(meta,receipt,payload);retained=[]
            if receipt.get('retainedCapture'):
                if len(receipt['retainedCapture'])!=64 or any(c not in '0123456789abcdef' for c in receipt['retainedCapture']):raise ValueError('Invalid retained capture identity')
                saved=h.read(root/'market-evidence/source-retained'/f"{receipt['retainedCapture']}.json")
                if h.digest(saved)!=receipt['retainedCapture']:raise ValueError('Retained historical capture hash differs')
                h.validate_source(saved,meta['id'],{meta['id']:meta},checked)
                if saved.get('unit')!=meta['native_unit'] or saved.get('cadence')!=meta['native_cadence']:raise ValueError('Retained historical units/cadence differ')
                if (saved['provider'],saved['providerIdentifier'])!=(receipt['provider'],receipt['identifier']):raise ValueError('Historical provider lineage differs')
                floor=int((checked-dt.timedelta(days=365.25*10.25)).timestamp()*1000)
                retained=[p for p in saved['observations'] if floor<=p['t']<parsed[0]['t']]
            if retained+parsed!=source['observations']:raise ValueError('Independent retained response replay differs from stored native history')
        return {'status':'verified','checkedAt':receipt['checkedAt'],'method':receipt['method'],'scope':receipt['scope'],'verificationId':vid,'validUntil':(checked+dt.timedelta(hours=2)).isoformat(),'responses':receipt.get('responses',[]),'changes':receipt.get('changes',{}),'upstreamCoverageStart':h.calendar(receipt['upstreamCoverageStart']) if receipt.get('upstreamCoverageStart') else None,'upstreamCoverageEnd':h.calendar(receipt['upstreamCoverageEnd']) if receipt.get('upstreamCoverageEnd') else None,'retainedCapture':receipt.get('retainedCapture')}
    except (ValueError,KeyError,OSError,TypeError) as error:return {'status':'unverified','checkedAt':receipt.get('checkedAt'),'why':str(error)}

def verify_reports(root,meta,source):
    report=h.read(root/'market-evidence/reports'/f"{meta['id']}.json")
    if report.get('id')!=meta['id'] or report.get('computedRevision')!=h.digest(report['reports']):raise ValueError('Native report identity/digest differs')
    points=source['observations'];end=points[-1];date=dt.datetime.fromtimestamp(end['t']/1000,UTC)
    supported=meta.get('supported_horizons') or h.H
    for horizon in h.H:
        row=report['reports'][horizon]
        if row.get('source_revision')!=source['sourceRevision']:raise ValueError('Native report revision differs')
        if horizon not in supported:
            if row.get('ready'):raise ValueError('Unsupported report horizon marked ready')
            continue
        if horizon in ('1D','5D'):
            lag=1 if horizon=='1D' else 5;anchor=points[-lag-1] if len(points)>lag else None
        else:
            if horizon=='MTD':target=dt.datetime(date.year,date.month,1,tzinfo=UTC)
            elif horizon=='YTD':target=dt.datetime(date.year,1,1,tzinfo=UTC)
            else:
                years={'1YR':1,'3YR':3,'5YR':5}[horizon]
                try:target=date.replace(year=date.year-years)
                except ValueError:target=date.replace(year=date.year-years,month=2,day=28)
            eligible=[p for p in points if p['t']<=target.timestamp()*1000];anchor=eligible[-1] if eligible else None
        if not anchor:
            if row.get('ready'):raise ValueError('Insufficient report history marked ready')
            continue
        values=[p['v'] for p in points if anchor['t']<=p['t']<=end['t']];change=end['v']-anchor['v']
        expected={'t0_date':anchor['t'],'t0_value':anchor['v'],'now_date':end['t'],'now_value':end['v'],'absolute_change':change,'percentage_change':change/anchor['v']*100 if anchor['v'] else None,'observation_count':len(values),'min':min(values),'max':max(values),'mean':statistics.fmean(values),'median':statistics.median(values),'percentile_now':round(100*(sum(v<end['v'] for v in values)+.5*sum(v==end['v'] for v in values))/len(values),2)}
        if not row.get('ready'):raise ValueError('Computable native report marked unavailable')
        for key,value in expected.items():
            actual=row.get(key)
            if value is None and actual is not None or value is not None and (not isinstance(actual,(int,float)) or not math.isclose(value,actual,rel_tol=1e-12,abs_tol=1e-10)):raise ValueError('Native report calculation differs: '+horizon+'/'+key)

def assess(root,now=None,admission=None):
    root=Path(root);now=now or dt.datetime.now(UTC)
    cat=h.read(root/'data/market-backend/data-catalog.json');rules=h.read(root/'data/market-backend/publication-rules.json')
    metas={m['id']:m for m in cat['series'] if m.get('enabled',True)};rows={};findings=[]
    for sid,meta in metas.items():
        row={'id':sid,'unit':meta['native_unit'],'cadence':meta['native_cadence'],'provider':meta['provider'],'identifier':meta['provider_identifier']}
        try:
            source=h.read(root/'market-evidence/series'/f'{sid}.json');h.validate_source(source,sid,metas,now)
            if source.get('unit')!=meta['native_unit'] or source.get('cadence')!=meta['native_cadence']:raise ValueError('Canonical unit/cadence differs from catalog')
            verify_reports(root,meta,source)
            state,expected,why=h.policy.freshness(meta,source,cat,rules,now)
            missing,limitations=gaps(meta,source['observations']);upstream=source_check(root,meta,source,now)
            native_expiry=h.policy.valid_until(meta,source,cat,rules,now).isoformat() if state=='current' else now.isoformat()
            row.update(validUntil=min(native_expiry,upstream.get('validUntil',now.isoformat())),freshness=state,expectedPeriod=expected,latestObservation=h.calendar(source['last']),coverageStart=h.calendar(source['first']),coverageEnd=h.calendar(source['last']),count=len(source['observations']),sourceRevision=source['sourceRevision'],lastCollection=source['last_successful'],sourceVerification=upstream,missingPeriods=missing,limitations=limitations,why=why)
            if upstream.get('retainedCapture'):limitations.append('Older source capture preserved and hash verified; current upstream window does not expose these older observations')
            issues=[]
            if state!='current':issues.append(why)
            if missing and upstream['status']!='verified':issues.append('Expected native periods absent: '+', '.join(missing[:12]))
            elif missing:limitations.append('Fresh retained upstream response also omits these periods; no observations fabricated')
            if any(x.startswith(('Invalid','Unsupported')) for x in limitations):issues.extend(limitations)
            if upstream['status']!='verified':issues.append(upstream.get('why','Upstream verification unavailable'))
            row['status']='needs-attention' if issues else 'verified';row['issues']=issues
        except (ValueError,KeyError,OSError,TypeError) as error:row.update(status='needs-attention',issues=[str(error)],sourceVerification={'status':'unverified'},missingPeriods=[])
        rows[sid]=row
        if row['status']!='verified':findings.append({'id':sid,'issues':row['issues']})
    verified=sum(r['status']=='verified' for r in rows.values())
    expiry=min([r.get('validUntil',now.isoformat()) for r in rows.values()]+[admission['summary']['validUntil'] if admission else now.isoformat()])
    retained_histories=sum(bool(r['sourceVerification'].get('retainedCapture')) for r in rows.values())
    source_omissions=sum(bool(r['missingPeriods']) and r['sourceVerification']['status']=='verified' for r in rows.values())
    ready=bool(rows) and not findings and bool(admission and admission['summary']['ready'])
    return {'schema':'market-navigator-data-assurance-v1','generatedAt':now.isoformat(),'state':('verified-with-limitations' if source_omissions or retained_histories else 'verified') if ready else 'needs-attention','validUntil':expiry,'summary':{'datasets':len(rows),'verified':verified,'needsAttention':len(rows)-verified,'sourceOmissions':source_omissions,'retainedHistories':retained_histories,'admissionReady':bool(admission and admission['summary']['ready'])},'series':rows,'findings':findings,'rule':'All enabled datasets; stored consistency and fresh upstream verification are separate evidence.'}

def event(store,kind,**details):
    stamp=dt.datetime.now(UTC).isoformat();run=uuid.uuid4().hex
    value={'schema':'market-navigator-assurance-event-v1','id':run,'at':stamp,'kind':kind,**details};h.write(Path(store)/'assurance-events'/f'{run}.json',value);return value

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--output');args=parser.parse_args();result=assess(args.root)
    if args.output:h.write(args.output,result)
    print(json.dumps(result,indent=2))
