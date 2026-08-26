#!/usr/bin/env python3
from __future__ import annotations

import csv, datetime as dt, hashlib, json, math, os, statistics, urllib.parse, urllib.request
from pathlib import Path

CATALOG = Path('data/market-backend/data-catalog.json')
ROOT = Path('market-evidence')
SERIES_DIR = ROOT / 'series'
REPORT_DIR = ROOT / 'reports'
MANIFEST = ROOT / 'operational-manifest.json'
PIPELINE_VERSION = '1.0.0'
UA = 'MarketNavigatorEvidencePipeline/1.0 (+https://github.com/acmeproducts/stuff)'
TIMEOUT = 30
BOOTSTRAP = os.environ.get('MARKET_NAVIGATOR_BOOTSTRAP', '').lower() in {'1','true','yes'}
DAY = 86400000


def now():
    return dt.datetime.now(dt.timezone.utc)

def iso(t=None):
    return (t or now()).astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')

def read_json(path, default=None):
    try:
        return json.loads(path.read_text(encoding='utf-8'))
    except Exception:
        return {} if default is None else default

def write_json(path, obj):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + '\n'
    old = path.read_text(encoding='utf-8') if path.exists() else None
    if old == text:
        return False
    path.write_text(text, encoding='utf-8')
    return True

def sha_obj(obj):
    return hashlib.sha256(json.dumps(obj, sort_keys=True, separators=(',',':')).encode()).hexdigest()

def get(url, accept='*/*'):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': accept})
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return r.read(), getattr(r, 'status', 200)

def canon(points):
    out = {}
    for p in points or []:
        try:
            t = int(p['t']); v = float(p['v'])
            if math.isfinite(v): out[t] = {'t': t, 'v': v}
        except Exception:
            pass
    return [out[k] for k in sorted(out)]

def yahoo_points(symbol, bootstrap):
    rng = '10y' if bootstrap else '1mo'
    url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + urllib.parse.quote(symbol, safe='') + '?' + urllib.parse.urlencode({'range':rng,'interval':'1d','includePrePost':'false','events':'div,splits'})
    raw, status = get(url, 'application/json')
    j = json.loads(raw)
    result = ((j.get('chart') or {}).get('result') or [None])[0]
    if not result: raise RuntimeError('Yahoo returned no chart result')
    ts = result.get('timestamp') or []
    close = (((result.get('indicators') or {}).get('quote') or [{}])[0].get('close') or [])
    pts = []
    for i,t in enumerate(ts):
        try:
            v = float(close[i])
            if math.isfinite(v): pts.append({'t':int(t)*1000,'v':v})
        except Exception: pass
    if not pts: raise RuntimeError('Yahoo returned zero observations')
    return canon(pts), status

def fred_points(series_id, bootstrap):
    start = '2015-01-01' if bootstrap else (now() - dt.timedelta(days=430)).date().isoformat()
    url = 'https://fred.stlouisfed.org/graph/fredgraph.csv?' + urllib.parse.urlencode({'id':series_id,'cosd':start})
    raw, status = get(url, 'text/csv,*/*')
    lines = raw.decode('utf-8-sig','replace').splitlines()
    pts=[]
    for row in csv.reader(lines[1:]):
        if len(row)<2 or row[1].strip() in {'','.'}: continue
        try:
            t = int(dt.datetime.fromisoformat(row[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000)
            v = float(row[1]); pts.append({'t':t,'v':v})
        except Exception: pass
    if not pts: raise RuntimeError('FRED returned zero observations')
    return canon(pts), status

def yoy(points):
    pts=canon(points); out=[]
    # FRED monthly source series: compare by year/month instead of assuming contiguous array offsets.
    by_month={}
    for p in pts:
        d=dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc)
        by_month[(d.year,d.month)] = p
    for p in pts:
        d=dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc)
        prior=by_month.get((d.year-1,d.month))
        if prior and prior['v']:
            out.append({'t':p['t'],'v':(p['v']/prior['v']-1)*100})
    return canon(out)

def merge(old, new):
    return canon((old or []) + (new or []))

def nearest_on_or_before(points, target_ms):
    lo, hi = 0, len(points)-1; best=None
    while lo <= hi:
        mid=(lo+hi)//2
        if points[mid]['t'] <= target_ms:
            best=points[mid]; lo=mid+1
        else: hi=mid-1
    return best

def previous_n(points, n):
    return points[-(n+1)] if len(points) > n else None

def shift_years(d, years):
    try: return d.replace(year=d.year-years)
    except ValueError: return d.replace(month=2, day=28, year=d.year-years)

def shift_month(d):
    y=d.year; m=d.month-1
    if m==0: y-=1; m=12
    import calendar
    day=min(d.day,calendar.monthrange(y,m)[1])
    return d.replace(year=y,month=m,day=day)

def horizon_start(points, horizon):
    if not points: return None
    end=dt.datetime.fromtimestamp(points[-1]['t']/1000,dt.timezone.utc)
    if horizon=='1D': return previous_n(points,1)
    if horizon=='5D': return previous_n(points,5)
    if horizon=='1M': target=shift_month(end)
    elif horizon=='YTD': target=dt.datetime(end.year,1,1,tzinfo=dt.timezone.utc)
    elif horizon=='1Y': target=shift_years(end,1)
    elif horizon=='3Y': target=shift_years(end,3)
    elif horizon=='5Y': target=shift_years(end,5)
    else: return None
    return nearest_on_or_before(points,int(target.timestamp()*1000))

def percentile(values, current):
    if not values: return None
    below=sum(1 for v in values if v < current); equal=sum(1 for v in values if v == current)
    return round(100*(below+0.5*equal)/len(values),2)

def report_for(points, horizon):
    if not points: return {'ready':False,'reason':'no observations'}
    start=horizon_start(points,horizon); end=points[-1]
    if start is None: return {'ready':False,'reason':'insufficient history','now_date':end['t'],'now_value':end['v']}
    window=[p for p in points if start['t'] <= p['t'] <= end['t']]
    vals=[p['v'] for p in window]
    change=end['v']-start['v']; pct=(change/start['v']*100) if start['v'] else None
    return {
        'ready':True,
        't0_date':start['t'],'t0_value':start['v'],
        'now_date':end['t'],'now_value':end['v'],
        'absolute_change':change,'percentage_change':pct,
        'observation_count':len(window),
        'min':min(vals),'max':max(vals),
        'mean':statistics.fmean(vals),
        'median':statistics.median(vals),
        'percentile_now':percentile(vals,end['v'])
    }

def main():
    catalog=read_json(CATALOG,{})
    if catalog.get('schema')!='market-navigator-data-catalog-v1':
        raise SystemExit('Missing or invalid data catalog')
    SERIES_DIR.mkdir(parents=True,exist_ok=True); REPORT_DIR.mkdir(parents=True,exist_ok=True)
    horizons=catalog.get('canonical_horizons') or ['1D','5D','1M','YTD','1Y','3Y','5Y']
    states={}; failures=[]
    for meta in catalog.get('series',[]):
        if not meta.get('enabled',True): continue
        sid=meta['id']; out_path=SERIES_DIR/f'{sid}.json'; prior=read_json(out_path,{})
        old=prior.get('observations') or []
        attempted=iso(); source_error=None; http=None
        try:
            if meta.get('provider')=='Yahoo Finance': raw,http=yahoo_points(meta['provider_identifier'],BOOTSTRAP or not old)
            elif meta.get('provider')=='FRED': raw,http=fred_points(meta['provider_identifier'],BOOTSTRAP or not old)
            else: raise RuntimeError('unsupported provider '+str(meta.get('provider')))
            if 'year-over-year percent change' in (meta.get('transformation') or '').lower(): raw=yoy(raw)
            obs=merge(old,raw)
            success=iso()
        except Exception as e:
            source_error=str(e); obs=canon(old); success=prior.get('last_successful')
            failures.append(f'{sid}: {e}')
        # Keep ten years maximum when abundant, but never thin observations.
        if obs:
            cutoff=int((now()-dt.timedelta(days=365.25*10.25)).timestamp()*1000)
            obs=[p for p in obs if p['t']>=cutoff]
        source_revision=sha_obj(obs)
        series_obj={
            'schema':'market-navigator-evidence-series-v1','pipelineVersion':PIPELINE_VERSION,
            'id':sid,'catalogVersion':catalog.get('version'),'provider':meta.get('provider'),
            'providerIdentifier':meta.get('provider_identifier'),'unit':meta.get('native_unit'),
            'cadence':meta.get('canonical_storage_cadence'),'description':meta.get('description'),
            'first':obs[0]['t'] if obs else None,'last':obs[-1]['t'] if obs else None,
            'count':len(obs),'sourceRevision':source_revision,'last_attempted':attempted,
            'last_successful':success,'last_error':source_error,'observations':obs
        }
        write_json(out_path,series_obj)
        reports={h:report_for(obs,h) for h in horizons}
        for h,r in reports.items():
            r['source_revision']=source_revision; r['source']=meta.get('provider'); r['series_id']=sid; r['horizon']=h
        report_obj={'schema':'market-navigator-evidence-report-v1','pipelineVersion':PIPELINE_VERSION,'id':sid,'generatedAt':iso(),'reports':reports}
        computed_revision=sha_obj(report_obj['reports']); report_obj['computedRevision']=computed_revision
        write_json(REPORT_DIR/f'{sid}.json',report_obj)
        years=(obs[-1]['t']-obs[0]['t'])/(365.25*DAY) if len(obs)>1 else 0
        readiness={h:bool(reports[h].get('ready')) for h in horizons}
        states[sid]={
            'status':'healthy' if obs and not source_error else ('stale' if obs else 'unavailable'),
            'first_observation':obs[0]['t'] if obs else None,
            'latest_observation':obs[-1]['t'] if obs else None,
            'observation_count':len(obs),
            'history_years':round(years,2),
            'last_attempted':attempted,'last_successful':success,
            'next_due':'next scheduled daily workflow' if meta.get('check_on_daily_run') else None,
            'bootstrap_complete':years >= float(catalog.get('bootstrap_policy',{}).get('minimum_history_years',6)),
            'horizon_readiness':readiness,
            'missing_periods':[],
            'last_error':source_error,
            'source_revision':source_revision,
            'computed_revision':computed_revision,
            'http':http
        }
    required=[m['id'] for m in catalog.get('series',[]) if m.get('enabled',True) and m.get('required')]
    blockers=[]
    for sid in required:
        st=states.get(sid,{})
        if not st.get('bootstrap_complete'): blockers.append(f'{sid}: bootstrap history below minimum')
        if not all(st.get('horizon_readiness',{}).values()): blockers.append(f'{sid}: one or more canonical horizons unavailable')
        if st.get('status')=='unavailable': blockers.append(f'{sid}: unavailable')
    manifest={
        'schema':'market-navigator-operational-manifest-v1','pipelineVersion':PIPELINE_VERSION,
        'catalogVersion':catalog.get('version'),'generatedAt':iso(),
        'mode':'bootstrap' if BOOTSTRAP else 'incremental',
        'canonicalHorizons':horizons,'series':states,
        'summary':{'catalogSeries':len(catalog.get('series',[])),'processedSeries':len(states),'requiredSeries':len(required),'sourceFailures':failures,'acceptanceBlockers':blockers,'ready':not blockers}
    }
    manifest['revision']=sha_obj(manifest)[:16]
    write_json(MANIFEST,manifest)
    print(json.dumps({'ok':not blockers,'mode':manifest['mode'],'revision':manifest['revision'],'failures':failures,'blockers':blockers},indent=2))
    if failures and not states:
        raise SystemExit('All data acquisition failed')

if __name__=='__main__': main()
