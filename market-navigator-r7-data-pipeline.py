#!/usr/bin/env python3
from __future__ import annotations
import csv,datetime as dt,hashlib,json,math,os,statistics,urllib.parse,urllib.request
from pathlib import Path

CATALOG=Path('data/market-backend/data-catalog.json');ROOT=Path('market-evidence');SERIES=ROOT/'series';REPORTS=ROOT/'reports';MANIFEST=ROOT/'operational-manifest.json'
VERSION='2.1.0-turn23';UA='MarketNavigatorEvidence/2.1 (+https://github.com/acmeproducts/stuff)';TIMEOUT=30;BOOT=os.environ.get('MARKET_NAVIGATOR_BOOTSTRAP','').lower() in {'1','true','yes'};DAY=86400000

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
 q=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':accept})
 with urllib.request.urlopen(q,timeout=TIMEOUT) as r:return r.read(),getattr(r,'status',200)
def canon(a):
 d={}
 for p in a or []:
  try:
   t=int(p['t']);v=float(p['v'])
   if math.isfinite(v):d[t]={'t':t,'v':v}
  except:pass
 return [d[k] for k in sorted(d)]
def yahoo(sym,boot):
 rng='10y' if boot else '1mo';url='https://query1.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(sym,safe='')+'?'+urllib.parse.urlencode({'range':rng,'interval':'1d','includePrePost':'false','events':'div,splits'})
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
def fred(sid,boot):
 start='2015-01-01' if boot else (now()-dt.timedelta(days=430)).date().isoformat();url='https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id':sid,'cosd':start});raw,http=get(url,'text/csv,*/*');rows=raw.decode('utf-8-sig','replace').splitlines();out=[]
 for r in csv.reader(rows[1:]):
  if len(r)<2 or r[1].strip() in ('','.'):continue
  try:out.append({'t':int(dt.datetime.fromisoformat(r[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000),'v':float(r[1])})
  except:pass
 if not out:raise RuntimeError('FRED returned zero observations')
 return canon(out),http
def fetch_source(provider,identifier,boot):
 if provider=='Yahoo Finance':return yahoo(identifier,boot)
 if provider=='Stooq':return stooq(identifier,boot)
 if provider=='FRED':return fred(identifier,boot)
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
def merge(a,b):return canon((a or [])+(b or []))
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
 SERIES.mkdir(parents=True,exist_ok=True);REPORTS.mkdir(parents=True,exist_ok=True);states={};failures=[]
 for m in c.get('series',[]):
  if not m.get('enabled',True):continue
  sid=m['id'];p=SERIES/f'{sid}.json';old=read(p,{});obs0=old.get('observations') or [];attempt=iso();err=None;http=None;used=None;source_errors=[]
  try:
   raw=None
   for pos,src in enumerate(chain_for(m)):
    try:
     raw,http=fetch_source(src.get('provider'),src.get('identifier'),BOOT or not obs0);used={**src,'position':pos};break
    except Exception as e:source_errors.append(f"{src.get('provider')}: {e}")
   if raw is None:raise RuntimeError('; '.join(source_errors) or 'no provider configured')
   if 'year-over-year percent change' in (m.get('transformation') or '').lower():raw=yoy(raw)
   obs=merge(obs0,raw);success=iso()
  except Exception as e:
   err=str(e);obs=canon(obs0);success=old.get('last_successful');failures.append(f'{sid}: {e}')
  if obs:
   cutoff=int((now()-dt.timedelta(days=365.25*10.25)).timestamp()*1000);obs=[x for x in obs if x['t']>=cutoff]
  rev=sha(obs);configured=chain_for(m);provider_name=(used or {}).get('provider') or old.get('provider') or m.get('provider');provider_id=(used or {}).get('identifier') or old.get('providerIdentifier') or m.get('provider_identifier')
  obj={'schema':'market-navigator-evidence-series-v1','pipelineVersion':VERSION,'id':sid,'catalogVersion':c.get('version'),'provider':provider_name,'providerIdentifier':provider_id,'providerChain':configured,'providerFallbackUsed':bool(used and used.get('position',0)>0),'providerErrors':source_errors,'unit':m.get('native_unit'),'cadence':m.get('native_cadence'),'description':m.get('description'),'first':obs[0]['t'] if obs else None,'last':obs[-1]['t'] if obs else None,'count':len(obs),'sourceRevision':rev,'last_attempted':attempt,'last_successful':success,'last_error':err,'http':http,'observations':obs};write(p,obj)
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
