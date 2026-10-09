#!/usr/bin/env python3
from __future__ import annotations
import csv,datetime as dt,hashlib,json,math,os,statistics,urllib.parse,urllib.request,uuid
from pathlib import Path

CATALOG=Path('data/market-backend/data-catalog.json');ROOT=Path('market-evidence');SERIES=ROOT/'series';REPORTS=ROOT/'reports';MANIFEST=ROOT/'operational-manifest.json'
VERSION='2.2.0-corpus';UA='MarketNavigatorEvidence/2.1 (+https://github.com/acmeproducts/stuff)';TIMEOUT=30;BOOT=os.environ.get('MARKET_NAVIGATOR_BOOTSTRAP','').lower() in {'1','true','yes'};DAY=86400000

def now():return dt.datetime.now(dt.timezone.utc)
def iso(x=None):return (x or now()).astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def read(p,d=None):
 try:return json.loads(p.read_text(encoding='utf-8'))
 except:return {} if d is None else d
def write(p,o):
 p.parent.mkdir(parents=True,exist_ok=True);s=json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n';old=p.read_text(encoding='utf-8') if p.exists() else None
 if old==s:return False
 p.write_text(s,encoding='utf-8',newline='\n');return True
def sha(o):return hashlib.sha256(json.dumps(o,sort_keys=True,separators=(',',':')).encode()).hexdigest()
SOURCE_RESPONSES=[]
def get(url,accept='*/*'):
 headers={'User-Agent':UA,'Accept':accept}
 if urllib.parse.urlparse(url).netloc=='api.nasdaq.com':headers.update({'User-Agent':'Mozilla/5.0 (compatible; MarketNavigatorEvidence/2.2)','Origin':'https://www.nasdaq.com','Referer':'https://www.nasdaq.com/'})
 q=urllib.request.Request(url,headers=headers)
 with urllib.request.urlopen(q,timeout=TIMEOUT) as r:
  payload=r.read();status=getattr(r,'status',200);digest=hashlib.sha256(payload).hexdigest();target=ROOT/'source-responses'/f'{digest}.bin';target.parent.mkdir(parents=True,exist_ok=True)
  if not target.exists():target.write_bytes(payload)
  SOURCE_RESPONSES.append({'url':url,'sha256':digest,'http':status,'receivedAt':iso()});return payload,status
def canon(a):
 d={}
 for p in a or []:
  try:
   t=int(p['t']);v=float(p['v'])
   if math.isfinite(v):d[t]={'t':t,'v':v}
  except:pass
 return [d[k] for k in sorted(d)]
def canon_fred(a):
 out={}
 for p in canon(a):
  d=dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc).date().isoformat()
  q=out.get(d)
  if q is None or p['t']<q['t']:out[d]=p
 return [out[k] for k in sorted(out)]
def yahoo(sym,boot,host='query1.finance.yahoo.com',bounded=False):
 rng='10y' if boot else '1mo';url='https://'+host+'/v8/finance/chart/'+urllib.parse.quote(sym,safe='')+'?'+urllib.parse.urlencode({'range':rng,'interval':'1d','includePrePost':'false','events':'div,splits'})
 if bounded:
  end=now();start=end-dt.timedelta(days=365.25*10 if boot else 30);url='https://'+host+'/v8/finance/chart/'+urllib.parse.quote(sym,safe='')+'?'+urllib.parse.urlencode({'period1':int(start.timestamp()),'period2':int(end.timestamp()),'interval':'1d'})
 raw,http=get(url,'application/json');j=json.loads(raw);r=((j.get('chart') or {}).get('result') or [None])[0]
 if not r:raise RuntimeError('Yahoo returned no chart result')
 if str((r.get('meta') or {}).get('symbol','')).upper()!=str(sym).upper():raise RuntimeError('Yahoo response instrument identity mismatch')
 ts=r.get('timestamp') or [];cl=(((r.get('indicators') or {}).get('quote') or [{}])[0].get('close') or []);out=[]
 for i,t in enumerate(ts):
  try:
   v=float(cl[i]);
   if math.isfinite(v):out.append({'t':int(t)*1000,'v':v})
  except:pass
 if not out:raise RuntimeError('Yahoo returned zero observations')
 return canon(out),http
def stooq(sym,boot):
 start=(dt.date(2015,1,1) if boot else (now()-dt.timedelta(days=430)).date()).strftime('%Y%m%d');end=now().date().strftime('%Y%m%d')
 url='https://stooq.com/q/d/l/?'+urllib.parse.urlencode({'s':sym,'d1':start,'d2':end,'i':'d'})
 raw,http=get(url,'text/csv,*/*');rows=raw.decode('utf-8-sig','replace').splitlines();out=[]
 if not rows:raise RuntimeError('Stooq returned empty response')
 for r in csv.DictReader(rows):
  try:
   if not r.get('Date') or not r.get('Close'):continue
   t=int(dt.datetime.fromisoformat(r['Date']).replace(tzinfo=dt.timezone.utc).timestamp()*1000);v=float(r['Close'])
   if math.isfinite(v):out.append({'t':t,'v':v})
  except:pass
 if not out:raise RuntimeError('Stooq returned zero observations')
 return canon(out),http
def fred(sid,boot):
 start='2015-01-01' if boot else (now()-dt.timedelta(days=430)).date().isoformat();url='https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id':sid,'cosd':start});raw,http=get(url,'text/csv,*/*');rows=raw.decode('utf-8-sig','replace').splitlines();out=[]
 for r in csv.reader(rows[1:]):
  if len(r)<2 or r[1].strip() in ('','.'):continue
  try:out.append({'t':int(dt.datetime.fromisoformat(r[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000),'v':float(r[1])})
  except:pass
 if not out:raise RuntimeError('FRED returned zero observations')
 return canon(out),http
def nasdaq_fund(sym,boot):
 start='2015-01-01' if boot else (now()-dt.timedelta(days=430)).date().isoformat()
 url='https://api.nasdaq.com/api/quote/'+urllib.parse.quote(sym,safe='')+'/historical?'+urllib.parse.urlencode({'assetclass':'mutualfunds','fromdate':start,'todate':now().date().isoformat(),'limit':5000})
 raw,http=get(url,'application/json');response=json.loads(raw);data=response.get('data') or {}
 if response.get('status',{}).get('rCode')!=200 or str(data.get('symbol','')).upper()!=sym.upper():raise RuntimeError('Nasdaq fund response identity/status mismatch')
 rows=(data.get('tradesTable') or {}).get('rows') or []
 if not rows or int(data.get('totalRecords',0))!=len(rows):raise RuntimeError('Nasdaq fund history is empty or incomplete')
 out=[]
 for row in rows:
  day=dt.datetime.strptime(row['date'],'%m/%d/%Y').replace(tzinfo=dt.timezone.utc);value=float(str(row['close']).replace('$','').replace(',',''))
  if not math.isfinite(value) or value<=0:raise RuntimeError('Invalid Nasdaq unit value')
  for field in ('open','high','low'):
   if float(str(row[field]).replace('$','').replace(',',''))!=value:raise RuntimeError('Response is not a qualified daily fund unit-value record')
  if row.get('volume')!='N/A':raise RuntimeError('Response is not a fund NAV history')
  out.append({'t':int(day.timestamp()*1000),'v':value})
 return canon(out),http

def fetch_source(provider,identifier,boot):
 if provider=='Yahoo Finance':return yahoo(identifier,boot)
 if provider=='Stooq':return stooq(identifier,boot)
 if provider=='FRED':return fred(identifier,boot)
 if provider=='Nasdaq Fund Network':return nasdaq_fund(identifier,boot)
 raise RuntimeError('unsupported provider '+str(provider))
def yoy(a):
 a=canon(a);m={}
 for p in a:
  d=dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc);m[(d.year,d.month)]=p
 out=[]
 for p in a:
  d=dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc);q=m.get((d.year-1,d.month))
  if q and q['v']:out.append({'t':p['t'],'v':(p['v']/q['v']-1)*100})
 return canon(out)
def merge(a,b,provider=None):
 z=canon((a or [])+(b or []))
 return canon_fred(z) if provider=='FRED' else z
def before(a,t):
 z=None
 for p in a:
  if p['t']<=t:z=p
  else:break
 return z
def priorn(a,n):return a[-(n+1)] if len(a)>n else None
def shifty(d,y):
 try:return d.replace(year=d.year-y)
 except:return d.replace(month=2,day=28,year=d.year-y)
def hstart(a,h):
 if not a:return None
 end=dt.datetime.fromtimestamp(a[-1]['t']/1000,dt.timezone.utc)
 if h=='1D':return priorn(a,1)
 if h=='5D':return priorn(a,5)
 if h=='MTD':target=dt.datetime(end.year,end.month,1,tzinfo=dt.timezone.utc)
 elif h=='YTD':target=dt.datetime(end.year,1,1,tzinfo=dt.timezone.utc)
 elif h=='1YR':target=shifty(end,1)
 elif h=='3YR':target=shifty(end,3)
 elif h=='5YR':target=shifty(end,5)
 else:return None
 return before(a,int(target.timestamp()*1000))
def percentile(v,x):
 if not v:return None
 return round(100*(sum(1 for z in v if z<x)+.5*sum(1 for z in v if z==x))/len(v),2)
def report(a,h):
 if not a:return {'ready':False,'reason':'no observations'}
 s=hstart(a,h);e=a[-1]
 if s is None:return {'ready':False,'reason':'insufficient history','now_date':e['t'],'now_value':e['v']}
 w=[p for p in a if s['t']<=p['t']<=e['t']];v=[p['v'] for p in w];chg=e['v']-s['v']
 return {'ready':True,'t0_date':s['t'],'t0_value':s['v'],'now_date':e['t'],'now_value':e['v'],'absolute_change':chg,'percentage_change':chg/s['v']*100 if s['v'] else None,'observation_count':len(w),'min':min(v),'max':max(v),'mean':statistics.fmean(v),'median':statistics.median(v),'percentile_now':percentile(v,e['v'])}
def chain_for(m):
 c=m.get('provider_chain') or []
 if c:return c
 return [{'provider':m.get('provider'),'identifier':m.get('provider_identifier')}]
def qualified_source(meta, provider, identifier, bootstrap, catalog, rules):
 from importlib.util import spec_from_file_location,module_from_spec
 spec=spec_from_file_location('mn_native_policy',Path(__file__).resolve().with_name('market-navigator-rebuild-policy.py'))
 policy=module_from_spec(spec);spec.loader.exec_module(policy)
 attempts=[]
 for endpoint in ([None,'query2.finance.yahoo.com','query2.finance.yahoo.com/bounded-period'] if provider=='Yahoo Finance' else [None]):
  try:
   raw,http=(yahoo(identifier,bootstrap,'query2.finance.yahoo.com',True) if endpoint.endswith('/bounded-period') else yahoo(identifier,bootstrap,endpoint)) if endpoint else fetch_source(provider,identifier,bootstrap)
   captured=now()
   if any(p['t']>captured.timestamp()*1000 for p in raw):raise RuntimeError('Future native observation')
   if captured>=dt.datetime(2026,10,8,tzinfo=dt.timezone.utc) and provider in ('Yahoo Finance','Stooq','Nasdaq Fund Network') and meta.get('native_cadence') in ('trading-day','daily-nav'):
    completed=policy.expected_market_session(captured);raw=[p for p in raw if dt.datetime.fromtimestamp(p['t']/1000,dt.timezone.utc).date()<=completed]
   if bootstrap and provider in ('Yahoo Finance','Stooq','Nasdaq Fund Network'):
    missing=policy.missing_history_sessions(meta,raw)
    if missing:raise RuntimeError('Full source window has missing native market sessions: '+', '.join(missing[:12]))
   status,expected,reason=policy.freshness(meta,{'observations':raw,'last_attempted':iso(captured),'last_successful':iso(captured),'last_error':None},catalog,rules,captured)
   if status!='current':raise RuntimeError('Response is not current canonical evidence: '+reason)
   attempts.append({'endpoint':endpoint or ('query1.finance.yahoo.com' if provider=='Yahoo Finance' else provider),'status':'qualified','http':http})
   return raw,http,attempts
  except Exception as error:
   attempts.append({'endpoint':endpoint or ('query1.finance.yahoo.com' if provider=='Yahoo Finance' else provider),'status':'failed','error':str(error)})
 raise RuntimeError('; '.join(str(x['endpoint'])+': '+x.get('error','') for x in attempts))

def main():
 c=read(CATALOG,{});rules=read(Path('data/market-backend/publication-rules.json'),{});assert c.get('schema')=='market-navigator-data-catalog-v1';H=c.get('canonical_horizons') or ['1D','5D','MTD','YTD','1YR','3YR','5YR'];assert H==['1D','5D','MTD','YTD','1YR','3YR','5YR']
 SERIES.mkdir(parents=True,exist_ok=True);REPORTS.mkdir(parents=True,exist_ok=True);states=read(MANIFEST,{}).get('series',{}) if os.environ.get('MARKET_NAVIGATOR_SERIES_IDS') else {};failures=[]
 selected=set(filter(None,os.environ.get('MARKET_NAVIGATOR_SERIES_IDS','').split(',')))
 replace_ids=set(filter(None,os.environ.get('MARKET_NAVIGATOR_REPLACE_SERIES_IDS','').split(',')))
 # Parent series are collected before their deterministic transforms.
 metas=sorted(c.get('series',[]),key=lambda m:bool(m.get('transform_source_id')))
 if selected:selected.update(m['transform_source_id'] for m in metas if m['id'] in selected and m.get('transform_source_id'))
 for m in metas:
  if not m.get('enabled',True) or selected and m['id'] not in selected and m.get('transform_source_id') not in selected:continue
  SOURCE_RESPONSES.clear()
  sid=m['id'];p=SERIES/f'{sid}.json';old=read(p,{});obs0=old.get('observations') or [];attempt=iso();err=None;http=None;used=None;source_errors=[]
  try:
   raw=None
   transform_source=None
   if m.get('transform_source_id'):
    transform_source=read(SERIES/f"{m['transform_source_id']}.json",{})
    if not transform_source.get('observations') or transform_source.get('last_error'):raise RuntimeError('Transform source unavailable or collection failed')
    src=transform_source['observations'];lag=1 if m.get('transform')=='qoq_percent_change' else 4 if m.get('transform')=='yoy_percent_change' else None
    if lag is None:raise RuntimeError('Unsupported governed transform '+str(m.get('transform')))
    from importlib.util import spec_from_file_location,module_from_spec
    spec=spec_from_file_location('mn_transform',Path(__file__).resolve().with_name('market-navigator-rebuild-transforms.py'));policy=module_from_spec(spec);spec.loader.exec_module(policy)
    raw=policy.quarterly_transform(src,lag)
    used={'provider':transform_source['provider'],'identifier':transform_source['providerIdentifier'],'position':0};http=transform_source.get('http')
   for pos,src in enumerate(chain_for(m)):
    try:
     if raw is not None:break
     raw,http,endpoint_trace=qualified_source(m,src.get('provider'),src.get('identifier'),BOOT or not obs0 or sid in replace_ids or old.get('provider')!=src.get('provider') or old.get('providerIdentifier')!=src.get('identifier'),c,rules);used={**src,'position':pos,'endpointTrace':endpoint_trace};break
    except Exception as e:raw=None;source_errors.append(f"{src.get('provider')}: {e}")
   if raw is None:raise RuntimeError('; '.join(source_errors) or 'no provider configured')
   if 'year-over-year percent change' in (m.get('transformation') or '').lower():raw=yoy(raw)
   used_provider=(used or {}).get('provider')
   used_identifier=(used or {}).get('identifier')
   old_provider=old.get('provider');old_identifier=old.get('providerIdentifier')
   same_lineage=(old_provider==used_provider and old_identifier==used_identifier)
   # Never retain observations from a different historical provider lineage when a full bootstrap is available.
   # FRED canonical evidence is additionally one observation per UTC source date; this removes legacy same-day rows
   # (for example the former Yahoo ^TNX values that contaminated canonical DGS10 after migration).
   # Provider changes were independently qualified using a full bootstrap inside the approved chain.
   retained_capture=None
   if BOOT and same_lineage and not m.get('transform_source_id'):
    # Replace the entire fetched window; preserve older actually captured history.
    # A provider's shortened public window must not delete the historical corpus.
    older=[p for p in obs0 if p['t']<raw[0]['t']];obs=canon(older+raw)
    if older:
     retained_capture=sha(old);write(ROOT/'source-retained'/f'{retained_capture}.json',old)
   elif m.get('transform_source_id') or sid in replace_ids or obs0 and not same_lineage:obs=canon(raw)
   else:obs=merge(obs0,raw,used_provider)
   if not obs or any(p['t']>now().timestamp()*1000 for p in obs):raise RuntimeError('Empty/future canonical source response')
   if used_provider=='FRED': obs=canon_fred(obs)
   success=transform_source.get('last_successful') if transform_source else iso()
  except Exception as e:
   err=str(e);obs=canon(obs0);success=old.get('last_successful');failures.append(f'{sid}: {e}')
  if obs:
   cutoff=int((now()-dt.timedelta(days=365.25*10.25)).timestamp()*1000);obs=[x for x in obs if x['t']>=cutoff]
  rev=sha(obs);configured=chain_for(m);provider_name=(used or {}).get('provider') or old.get('provider') or m.get('provider');provider_id=(used or {}).get('identifier') or old.get('providerIdentifier') or m.get('provider_identifier')
  obj={'schema':'market-navigator-evidence-series-v1','pipelineVersion':VERSION,'id':sid,'catalogVersion':c.get('version'),'provider':provider_name,'providerIdentifier':provider_id,'providerChain':configured,'providerFallbackUsed':bool(used and used.get('position',0)>0),'providerErrors':source_errors,'providerEndpointTrace':(used or {}).get('endpointTrace',[]),'unit':m.get('native_unit'),'cadence':m.get('native_cadence'),'description':m.get('description'),'first':obs[0]['t'] if obs else None,'last':obs[-1]['t'] if obs else None,'count':len(obs),'sourceRevision':rev,'last_attempted':attempt,'last_successful':success,'last_error':err,'http':http,'observations':obs};obj.update({'transform':m['transform'],'transformSourceId':m['transform_source_id'],'transformSourceRevision':transform_source['sourceRevision']}) if m.get('transform_source_id') and transform_source and not err else None;
  if not err:
   old_by_date={dt.datetime.fromtimestamp(x['t']/1000,dt.timezone.utc).date().isoformat():x['v'] for x in obs0};new_by_date={dt.datetime.fromtimestamp(x['t']/1000,dt.timezone.utc).date().isoformat():x['v'] for x in obs}
   receipt={'schema':'market-navigator-source-verification-v1','verificationId':uuid.uuid4().hex,'id':sid,'checkedAt':success,'provider':provider_name,'identifier':provider_id,'unit':m.get('native_unit'),'cadence':m.get('native_cadence'),'sourceRevision':rev,'scope':'full-retained-history' if BOOT else 'recent-response','method':'governed-transform' if transform_source else 'retained-provider-response','responses':list(SOURCE_RESPONSES),'parentRevision':transform_source['sourceRevision'] if transform_source else None,'retainedCapture':retained_capture,'upstreamCoverageStart':raw[0]['t'],'upstreamCoverageEnd':raw[-1]['t'],'changes':{'addedPeriods':sorted(new_by_date.keys()-old_by_date.keys()),'removedPeriods':sorted(old_by_date.keys()-new_by_date.keys()),'revisedPeriods':[d for d in sorted(old_by_date.keys()&new_by_date.keys()) if old_by_date[d]!=new_by_date[d]]}}
   obj['sourceVerification']=receipt;write(ROOT/'source-verifications'/f"{receipt['verificationId']}.json",receipt)
  write(p,obj)
  supported=set(m.get('supported_horizons') or H);rr={}
  for h in H:
   rr[h]=report(obs,h) if h in supported else {'ready':False,'reason':'unsupported horizon for canonical evidence cadence'}
  for h,r in rr.items():r.update(source_revision=rev,source=provider_name,series_id=sid,horizon=h)
  robj={'schema':'market-navigator-evidence-report-v1','pipelineVersion':VERSION,'id':sid,'generatedAt':iso(),'reports':rr};crev=sha(rr);robj['computedRevision']=crev;write(REPORTS/f'{sid}.json',robj)
  years=(obs[-1]['t']-obs[0]['t'])/(365.25*DAY) if len(obs)>1 else 0;ready={h:bool(rr[h].get('ready')) for h in H}
  states[sid]={'status':'healthy' if obs and not err else ('stale' if obs else 'unavailable'),'first_observation':obs[0]['t'] if obs else None,'latest_observation':obs[-1]['t'] if obs else None,'observation_count':len(obs),'history_years':round(years,2),'last_attempted':attempt,'last_successful':success,'next_due':'next scheduled evidence workflow','bootstrap_complete':years>=float(c.get('bootstrap_policy',{}).get('minimum_history_years',6)),'horizon_readiness':ready,'supported_horizons':sorted(supported,key=lambda x:H.index(x) if x in H else 99),'missing_periods':[],'last_error':err,'provider_used':provider_name,'provider_identifier_used':provider_id,'provider_fallback_used':bool(used and used.get('position',0)>0),'provider_errors':source_errors,'source_revision':rev,'computed_revision':crev,'http':http}
 required=[m['id'] for m in c.get('series',[]) if m.get('enabled',True) and m.get('required')];block=[]
 for sid in required:
  st=states.get(sid,{})
  if st.get('status')=='unavailable':block.append(f'{sid}: unavailable')
  if not st.get('bootstrap_complete'):block.append(f'{sid}: bootstrap history below minimum')
  if not all(st.get('horizon_readiness',{}).values()):block.append(f'{sid}: one or more canonical horizons unavailable')
 man={'schema':'market-navigator-operational-manifest-v1','pipelineVersion':VERSION,'catalogVersion':c.get('version'),'generatedAt':iso(),'mode':'bootstrap' if BOOT else 'incremental','canonicalHorizons':H,'series':states,'summary':{'catalogSeries':len(c.get('series',[])),'processedSeries':len(states),'requiredSeries':len(required),'sourceFailures':failures,'acceptanceBlockers':block,'ready':not block}};man['revision']=sha(man)[:16];write(MANIFEST,man);print(json.dumps({'ok':not block,'revision':man['revision'],'failures':failures,'blockers':block},indent=2))

if __name__=='__main__':main()
