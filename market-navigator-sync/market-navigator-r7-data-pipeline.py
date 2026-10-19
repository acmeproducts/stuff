#!/usr/bin/env python3
from __future__ import annotations
import csv,datetime as dt,hashlib,json,math,os,statistics,urllib.parse,urllib.request
from pathlib import Path
import importlib.util

CATALOG=Path('data/market-backend/data-catalog.json');ROOT=Path('market-evidence');SERIES=ROOT/'series';REPORTS=ROOT/'reports';MANIFEST=ROOT/'operational-manifest.json'
VERSION='2.1.0-turn23';UA='MarketNavigatorEvidence/2.1 (+https://github.com/acmeproducts/stuff)';TIMEOUT=30;BOOT=os.environ.get('MARKET_NAVIGATOR_BOOTSTRAP','').lower() in {'1','true','yes'};DAY=86400000
_spec=importlib.util.spec_from_file_location('mn_etl_schedule',Path(__file__).with_name('market-navigator-etl-schedule.py'))
_scheduler=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_scheduler)
RETRY_COMPONENT=os.environ.get('MARKET_NAVIGATOR_RETRY_COMPONENT','').strip()
RETRY_STREAM=os.environ.get('MARKET_NAVIGATOR_RETRY_STREAM','').lower() in {'1','true','yes'}
RULES=Path('data/market-backend/publication-rules.json')
RUNLOG=ROOT/'run-log.json'

def now():return dt.datetime.now(dt.timezone.utc)
def iso(x=None):return (x or now()).astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def read(p,d=None):
 try:return json.loads(p.read_text())
 except:return {} if d is None else d
def write(p,o):
 p.parent.mkdir(parents=True,exist_ok=True);s=json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n';old=p.read_text() if p.exists() else None
 if old==s:return False
 p.write_text(s);return True
def sha(o):return hashlib.sha256(json.dumps(o,sort_keys=True,separators=(',',':')).encode()).hexdigest()
def get(url,accept='*/*'):
 headers={'User-Agent':UA,'Accept':accept}
 if urllib.parse.urlparse(url).netloc=='api.nasdaq.com':headers.update({'User-Agent':'Mozilla/5.0 (compatible; MarketNavigatorEvidence/2.2)','Origin':'https://www.nasdaq.com','Referer':'https://www.nasdaq.com/'})
 q=urllib.request.Request(url,headers=headers)
 with urllib.request.urlopen(q,timeout=TIMEOUT) as r:return r.read(),getattr(r,'status',200)
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
def yahoo(sym,boot):
 window={'period1':1420070400,'period2':int(now().timestamp())+86400} if boot else {'range':'1mo'}
 url='https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(sym,safe='')+'?'+urllib.parse.urlencode({**window,'interval':'1d','includePrePost':'false','events':'div,splits'})
 raw,http=get(url,'application/json');j=json.loads(raw);r=((j.get('chart') or {}).get('result') or [None])[0]
 if not r:raise RuntimeError('Yahoo returned no chart result')
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
def fred(sid,boot,start=None,end=None):
 start=start or ('2015-01-01' if boot else (now()-dt.timedelta(days=430)).date().isoformat());params={'id':sid,'cosd':start}
 if end:params['coed']=end
 url='https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode(params);raw,http=get(url,'text/csv,*/*');rows=raw.decode('utf-8-sig','replace').splitlines();out=[]
 for r in csv.reader(rows[1:]):
  if len(r)<2 or r[1].strip() in ('','.'):continue
  try:out.append({'t':int(dt.datetime.fromisoformat(r[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000),'v':float(r[1])})
  except:pass
 if not out:raise RuntimeError('FRED returned zero observations')
 return canon(out),http
def missing_native_periods(meta,observations):
 cadence=meta.get('native_cadence')
 if cadence in ('trading-day','daily-nav') and len(observations)>1:
  dates=sorted({_scheduler.date_of(p['t']) for p in observations});present=set(dates);day=max(dates[0],dt.date(2026,1,1));end=min(dates[-1],dt.date(2026,12,31));missing=[]
  closed=set(_scheduler.MARKET_CLOSED)
  if meta.get('id')=='move':closed.update({'2026-10-12','2026-11-11'})
  while day<end:
   if day.weekday()<5 and day.isoformat() not in closed and day not in present:missing.append(day.isoformat())
   day+=dt.timedelta(days=1)
  return missing
 if cadence not in ('weekly','monthly','quarterly') or len(observations)<2:return []
 dates=sorted({_scheduler.date_of(p['t']) for p in observations});present=set(dates);day=dates[0];missing=[]
 absent={x['period'] for x in meta.get('documented_absent_periods',[]) if x.get('source') and x.get('reason')}
 while day<dates[-1]:
  if cadence=='weekly':day+=dt.timedelta(days=7)
  else:
   month=day.month+(3 if cadence=='quarterly' else 1);year=day.year+(month-1)//12;day=dt.date(year,(month-1)%12+1,1)
  if day<dates[-1] and day not in present and day.isoformat() not in absent:missing.append(day.isoformat())
 return missing

def fetch_source(provider,identifier,boot):
 if provider=='Yahoo Finance':return yahoo(identifier,boot)
 if provider=='Stooq':return stooq(identifier,boot)
 if provider=='FRED':return fred(identifier,boot)
 if provider=='Nasdaq Fund Network':return nasdaq_fund(identifier,boot)
 raise RuntimeError('unsupported provider '+str(provider))

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
 # Native daily period, rather than changing provider candle timestamps,
 # determines identity. A later final candle replaces its provisional row.
 periods={}
 for point in canon(a)+canon(b):periods[dt.datetime.fromtimestamp(point['t']/1000,dt.timezone.utc).date()]=point
 z=[periods[k] for k in sorted(periods)]
 return canon_fred(z) if provider=='FRED' else z

def source_snapshot(old,incoming,complete=False):
 incoming=canon(incoming)
 if not incoming:raise RuntimeError('Source returned no native observations')
 if not complete:return merge(old,incoming)
 first=_scheduler.date_of(incoming[0]['t']);last=_scheduler.date_of(incoming[-1]['t'])
 # A complete provider window supersedes its covered periods, including
 # withdrawn provisional records. A vendor's limited earlier coverage cannot
 # erase accumulated history outside that window. Git retains prior vectors.
 retained=[p for p in canon(old) if not first<=_scheduler.date_of(p['t'])<=last]
 return merge(retained,incoming)
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
def main():
 c=read(CATALOG,{});assert c.get('schema')=='market-navigator-data-catalog-v1';H=c.get('canonical_horizons') or ['1D','5D','MTD','YTD','1YR','3YR','5YR'];assert H==['1D','5D','MTD','YTD','1YR','3YR','5YR']
 SERIES.mkdir(parents=True,exist_ok=True);REPORTS.mkdir(parents=True,exist_ok=True);states={};failures=[];entries=[]
 publication_rules=read(RULES,{}).get('rules',{});prior_states=read(MANIFEST,{}).get('series',{})
 enabled_ids={x['id'] for x in c.get('series',[]) if x.get('enabled',True)}
 if RETRY_COMPONENT and RETRY_COMPONENT not in enabled_ids:raise SystemExit('Unknown or disabled retry component: '+RETRY_COMPONENT)

 for m in c.get('series',[]):
  if not m.get('enabled',True):continue
  sid=m['id'];p=SERIES/f'{sid}.json';old=read(p,{});obs0=old.get('observations') or [];attempt=iso();err=None;http=None;used=None;source_errors=[]
  if RETRY_COMPONENT and sid!=RETRY_COMPONENT:
   decision='not-selected';due=False
  elif RETRY_COMPONENT==sid:
   decision='explicit-component-retry';due=True
  else:
   prior=prior_states.get(sid,{})
   due,decision=_scheduler.eligibility(m,{**old,'missing_periods':missing_native_periods(m,obs0),'last_error':prior.get('last_error',old.get('last_error'))},now(),publication_rules,force=BOOT,last_attempt=prior.get('last_attempted',old.get('last_attempted')) if not prior.get('last_error',old.get('last_error')) else None)
  if not due and not obs0 and decision!='not-selected':due=True;decision='missing-history'
  if not due:
   prior_report=read(REPORTS/f'{sid}.json',{})
   previous=prior_report.get('reports',{})
   oldstate={'status':'healthy' if obs0 and not old.get('last_error') else ('stale' if obs0 else 'unavailable'),'first_observation':old.get('first'),'latest_observation':old.get('last'),'observation_count':len(obs0),'last_attempted':old.get('last_attempted'),'last_successful':old.get('last_successful'),'last_error':old.get('last_error'),'history_years':round((obs0[-1]['t']-obs0[0]['t'])/(365.25*DAY),2) if len(obs0)>1 else 0,'provider_used':old.get('provider'),'provider_identifier_used':old.get('providerIdentifier'),'source_revision':old.get('sourceRevision'),'computed_revision':prior_report.get('computedRevision'),'horizon_readiness':{h:bool(previous.get(h,{}).get('ready')) for h in H},'supported_horizons':m.get('supported_horizons') or H,'bootstrap_complete':((obs0[-1]['t']-obs0[0]['t'])/(365.25*DAY)>=float(c.get('bootstrap_policy',{}).get('minimum_history_years',6))) if len(obs0)>1 else False,'skip_reason':decision}
   expected=_scheduler.expectation(m,now(),publication_rules)
   oldstate['missing_periods']=missing_native_periods(m,obs0)
   states[sid]=oldstate;entries.append({'id':sid,'frequency':m.get('native_cadence'),'expected_period':expected['period'],'schedule':expected['schedule'],
       'status':'not due' if decision.endswith('period-present') else 'skipped','reason':decision,'latest_observation':old.get('last'),
       'last_observation':_scheduler.date_of(old.get('last')).isoformat() if old.get('last') else None,'last_attempt':old.get('last_attempted'),'added':0,'revised':0});continue

  try:
   raw=None
   for pos,src in enumerate(chain_for(m)):
    try:
     source_boot=BOOT or not obs0 or (old.get('provider') and (old.get('provider'),old.get('providerIdentifier'))!=(src.get('provider'),src.get('identifier')))
     raw,http=fetch_source(src.get('provider'),src.get('identifier'),source_boot)
     gaps=missing_native_periods(m,obs0)
     if gaps and src.get('provider')=='FRED' and not source_boot:
      repair,_=fred(src['identifier'],False,min(gaps),max(gaps));raw=canon(raw+repair)
     expected=_scheduler.expectation(m,now(),publication_rules)['period']
     if pos+1<len(chain_for(m)) and expected and _scheduler.date_of(raw[-1]['t'])<_scheduler.date_of(expected):raise RuntimeError('Provider has not returned expected native period '+expected)
     used={**src,'position':pos,'bootstrap':source_boot};break
    except Exception as e:
     raw=None
     source_errors.append(f"{src.get('provider')}: {e}")
   if raw is None:raise RuntimeError('; '.join(source_errors) or 'no provider configured')
   native_raw=canon(raw)
   if 'year-over-year percent change' in (m.get('transformation') or '').lower():raw=yoy(raw)
   used_provider=(used or {}).get('provider')
   used_identifier=(used or {}).get('identifier')
   old_provider=old.get('provider');old_identifier=old.get('providerIdentifier')
   same_lineage=(old_provider==used_provider and old_identifier==used_identifier)
   # Never retain observations from a different historical provider lineage when a full bootstrap is available.
   # FRED canonical evidence is additionally one observation per UTC source date; this removes legacy same-day rows
   # (for example the former Yahoo ^TNX values that contaminated canonical DGS10 after migration).
   if obs0 and not same_lineage and not used.get('bootstrap'):raise RuntimeError('Source identity changed without a complete approved source history')
   if obs0 and not same_lineage:obs=canon(raw)
   else:obs=source_snapshot(obs0,raw,BOOT)
   if used_provider=='FRED': obs=canon_fred(obs)
   native_path=ROOT/'source-observations'/f'{sid}.json';prior_native=read(native_path,{})
   native_same=(prior_native.get('provider'),prior_native.get('providerIdentifier'))==(used_provider,used_identifier)
   native_base=prior_native.get('observations',[]) if native_same else []
   if not prior_native and same_lineage and 'year-over-year percent change' not in (m.get('transformation') or '').lower():native_base=obs0
   native=source_snapshot(native_base,native_raw,used.get('bootstrap',False))
   native_revision=sha(native)
   if prior_native.get('sourceRevision')!=native_revision:write(native_path,{'schema':'market-navigator-native-source-v1','id':sid,'provider':used_provider,'providerIdentifier':used_identifier,'cadence':m.get('native_cadence'),'sourceRevision':native_revision,'observations':native})
   success=iso()
  except Exception as e:
   err=str(e);obs=canon(obs0);success=old.get('last_successful');failures.append(f'{sid}: {e}')
  old_by_t={_scheduler.date_of(x['t']):x['v'] for x in obs0};new_by_t={_scheduler.date_of(x['t']):x['v'] for x in obs}
  added=sum(t not in old_by_t for t in new_by_t);revised=sum(t in old_by_t and old_by_t[t]!=v for t,v in new_by_t.items());withdrawn=sum(t not in new_by_t for t in old_by_t)
  expected=_scheduler.expectation(m,now(),publication_rules)
  waiting=bool(not err and expected['period'] and obs and _scheduler.date_of(obs[-1]['t'])<_scheduler.date_of(expected['period']))
  entries.append({'id':sid,'frequency':m.get('native_cadence'),'expected_period':expected['period'],'schedule':expected['schedule'],
                  'last_observation':_scheduler.date_of(obs[-1]['t']).isoformat() if obs else None,'last_attempt':attempt,
                  'status':'failed' if err else ('awaiting release' if waiting else 'success'),'reason':err or ('Provider has not returned expected period '+expected['period'] if waiting else decision),
                  'previous_count':len(obs0),'new_count':len(obs),'added':added,'revised':revised,'withdrawn':withdrawn,'changed':sha(obs)!=sha(obs0)})
  # Accumulated native histories include fixed model anchors. Never age them
  # out on a rolling retention cutoff or rebase a fixed index silently.
  rev=sha(obs);configured=chain_for(m);provider_name=(used or {}).get('provider') or old.get('provider') or m.get('provider');provider_id=(used or {}).get('identifier') or old.get('providerIdentifier') or m.get('provider_identifier')
  obj={'schema':'market-navigator-evidence-series-v1','pipelineVersion':VERSION,'id':sid,'catalogVersion':c.get('version'),'provider':provider_name,'providerIdentifier':provider_id,'providerChain':configured,'providerFallbackUsed':bool(used and used.get('position',0)>0),'providerErrors':source_errors,'unit':m.get('native_unit'),'cadence':m.get('native_cadence'),'description':m.get('description'),'first':obs[0]['t'] if obs else None,'last':obs[-1]['t'] if obs else None,'count':len(obs),'sourceRevision':rev,'last_attempted':attempt,'last_successful':success,'last_error':err,'http':http,'observations':obs}
  if old.get('sourceRevision')!=rev or (old.get('provider'),old.get('providerIdentifier'))!=(provider_name,provider_id):write(p,obj)
  supported=set(m.get('supported_horizons') or H);rr={}
  for h in H:
   rr[h]=report(obs,h) if h in supported else {'ready':False,'reason':'unsupported horizon for canonical evidence cadence'}
  for h,r in rr.items():r.update(source_revision=rev,source=provider_name,series_id=sid,horizon=h)
  robj={'schema':'market-navigator-evidence-report-v1','pipelineVersion':VERSION,'id':sid,'generatedAt':iso(),'reports':rr};crev=sha(rr);robj['computedRevision']=crev
  prior_report=read(REPORTS/f'{sid}.json',{})
  if prior_report.get('computedRevision')!=crev:write(REPORTS/f'{sid}.json',robj)
  years=(obs[-1]['t']-obs[0]['t'])/(365.25*DAY) if len(obs)>1 else 0;ready={h:bool(rr[h].get('ready')) for h in H};missing_periods=missing_native_periods(m,obs)
  states[sid]={'status':'healthy' if obs and not err else ('stale' if obs else 'unavailable'),'first_observation':obs[0]['t'] if obs else None,'latest_observation':obs[-1]['t'] if obs else None,'observation_count':len(obs),'history_years':round(years,2),'last_attempted':attempt,'last_successful':success,'next_due':'next scheduled evidence workflow','bootstrap_complete':years>=float(c.get('bootstrap_policy',{}).get('minimum_history_years',6)),'horizon_readiness':ready,'supported_horizons':sorted(supported,key=lambda x:H.index(x) if x in H else 99),'missing_periods':missing_periods,'last_error':err,'provider_used':provider_name,'provider_identifier_used':provider_id,'provider_fallback_used':bool(used and used.get('position',0)>0),'provider_errors':source_errors,'source_revision':rev,'computed_revision':crev,'http':http}
 required=[m['id'] for m in c.get('series',[]) if m.get('enabled',True) and m.get('required')];block=[]
 for sid in required:
  st=states.get(sid,{})
  if st.get('status')=='unavailable':block.append(f'{sid}: unavailable')
  if not st.get('bootstrap_complete'):block.append(f'{sid}: bootstrap history below minimum')
  supported=set(st.get('supported_horizons') or H)
  if any(not st.get('horizon_readiness',{}).get(h,False) for h in supported):block.append(f'{sid}: one or more supported horizons unavailable')
 log=read(RUNLOG,{'schema':'market-navigator-run-log-v1','runs':[]})
 run={'at':iso(),'mode':'component-retry' if RETRY_COMPONENT else ('bootstrap' if BOOT else ('stream-retry' if RETRY_STREAM else 'scheduled')),'components':entries,'success':sum(x['status']=='success' for x in entries),'failed':sum(x['status']=='failed' for x in entries),'skipped':sum(x['status'] in ('skipped','not due') for x in entries)}
 log['runs']=(log.get('runs',[])+[run])[-90:];write(RUNLOG,log)
 man={'schema':'market-navigator-operational-manifest-v1','pipelineVersion':VERSION,'catalogVersion':c.get('version'),'generatedAt':iso(),'mode':'bootstrap' if BOOT else 'incremental','canonicalHorizons':H,'series':states,'summary':{'catalogSeries':len(c.get('series',[])),'processedSeries':len(states),'requiredSeries':len(required),'sourceFailures':failures,'acceptanceBlockers':block,'ready':not block}};man['revision']=sha(man)[:16];write(MANIFEST,man);print(json.dumps({'ok':not block,'revision':man['revision'],'failures':failures,'blockers':block},indent=2))

if __name__=='__main__':main()
