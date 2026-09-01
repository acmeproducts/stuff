#!/usr/bin/env python3
from __future__ import annotations
import calendar,datetime as dt,json
from pathlib import Path

CAT=Path('data/market-backend/data-catalog.json')
SERIES=Path('market-evidence/series')
MAN=Path('market-evidence/operational-manifest.json')
SOURCE_HEALTH=Path('data/market-backend/source-health.json')
OUT=Path('market-evidence/health-envelope.json')
UTC=dt.timezone.utc

def read(p,d=None):
 try:return json.loads(p.read_text())
 except:return {} if d is None else d
def write(p,o):
 p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n')
def iso_date(ms):
 if not ms:return None
 return dt.datetime.fromtimestamp(ms/1000,UTC).date().isoformat()
def month_end(y,m):return dt.date(y,m,calendar.monthrange(y,m)[1])
def prev_month(y,m,n=1):
 x=y*12+(m-1)-n;return x//12,x%12+1
def expected_month(today,release_day):
 n=1 if today.day>=release_day else 2
 return prev_month(today.year,today.month,n)
def expected_quarter(today,release_day=30):
 q=(today.month-1)//3+1;q-=1
 if q<=0:return today.year-1,4
 return today.year,q
def latest_expected(meta,catalog,today):
 cad=meta.get('native_cadence') or meta.get('canonical_storage_cadence')
 ov=(catalog.get('publication_schedule') or {}).get('series_overrides',{}).get(meta['id'],{})
 if cad=='monthly':
  day=int(ov.get('expected_day_of_month') or 20);y,m=expected_month(today,day);return month_end(y,m),f"monthly release around day {day}; latest expected reference month {y:04d}-{m:02d}"
 if cad=='quarterly':
  day=int(ov.get('expected_day_of_month') or 30);y,q=expected_quarter(today,day);m=q*3;return month_end(y,m),f"quarterly release around day {day}; latest expected reference quarter Q{q} {y}"
 return None,None
def classify(meta,actual_ms,state,collector,catalog,today,market_anchor):
 cad=meta.get('native_cadence') or meta.get('canonical_storage_cadence') or 'unknown';actual=dt.datetime.fromtimestamp(actual_ms/1000,UTC).date() if actual_ms else None;expected,note=latest_expected(meta,catalog,today)
 last_success=state.get('last_successful');err=state.get('last_error');status=state.get('status');why=[];root='current'
 if not actual:
  root='failed' if err or status=='unavailable' else 'missing';why.append('No canonical observation exists.')
 elif expected:
  if actual < expected:
   if err:
    root='failed';why.append(f"A {cad} observation through {expected.isoformat()} is expected, but canonical evidence ends {actual.isoformat()} and the latest collection attempt failed: {err}")
   elif last_success:
    root='stale';why.append(f"A {cad} observation through {expected.isoformat()} is expected, but canonical evidence ends {actual.isoformat()} even though collection reports success. The successful fetch/persistence path did not yield the publicly expected reference period.")
   else:
    root='stale';why.append(f"A {cad} observation through {expected.isoformat()} is expected, but canonical evidence ends {actual.isoformat()} and there is no successful collection proving the gap is legitimate publication lag.")
  else:
   root='current';why.append(f"Canonical evidence reaches {actual.isoformat()}, satisfying the deterministic expected reference period through {expected.isoformat()}.")
  if note:why.append(note+'.')
 else:
  anchor=dt.datetime.fromtimestamp(market_anchor/1000,UTC).date() if market_anchor else today;age=(anchor-actual).days
  cur={'trading-day':5,'daily':5,'weekly':10}.get(cad,7);lag={'trading-day':7,'daily':7,'weekly':18}.get(cad,14)
  if err and age>cur:root='failed';why.append(f"Canonical evidence ends {actual.isoformat()} ({age} days behind the common market anchor) and collection failed: {err}")
  elif age<=cur:root='current';why.append(f"Canonical evidence ends {actual.isoformat()}, within the governed {cad} allowance relative to the common market anchor {anchor.isoformat()}.")
  elif age<=lag:root='expected-lag';why.append(f"Canonical evidence ends {actual.isoformat()}, beyond current allowance but still inside the governed {cad} expected-lag window relative to {anchor.isoformat()}.")
  else:root='stale';why.append(f"Canonical evidence ends {actual.isoformat()}, {age} days behind common market anchor {anchor.isoformat()}, beyond the governed {cad} freshness allowance.")
 if collector:
  if collector.get('lastAttempt'):why.append('Collector last attempt '+str(collector.get('lastAttempt'))+'.')
  if collector.get('lastSuccess'):why.append('Collector last success '+str(collector.get('lastSuccess'))+'.')
  if collector.get('lastError'):why.append('Collector error '+str(collector.get('lastError'))+'.')
 coverage=state.get('horizon_readiness') or {};density=state.get('observation_count') or 0
 if root=='current' and coverage and not all(coverage.values()):root='sparse';why.append('One or more governed horizons lack sufficient canonical history.')
 return root,expected.isoformat() if expected else None,' '.join(why),coverage,density

def main():
 c=read(CAT);m=read(MAN);sh=(read(SOURCE_HEALTH).get('data') or {});today=dt.datetime.now(UTC).date();metas={x['id']:x for x in c.get('series',[]) if x.get('enabled',True)}
 anchors=[]
 for sid in ('spy','qqq','vix'):
  s=read(SERIES/f'{sid}.json')
  if s.get('last'):anchors.append(int(s['last']))
 market_anchor=max(anchors) if anchors else None
 indices={'risk':['spy','vix','hySpread','hyg','dxy','move','nfci'],'growth':['qqq','copper','smallCaps','pmi','wti','unemployment','payrolls'],'macro':['tenYear','twoYear','curve10y2y','curve10y3m','cpi','corePce','fedFunds']}
 impacts={}
 for k,ids in indices.items():
  for sid in ids:impacts.setdefault(sid,[]).append(k)
 rows={};counts={k:0 for k in ('current','expected-lag','stale','missing','failed','sparse')}
 for sid,meta in metas.items():
  s=read(SERIES/f'{sid}.json');st=(m.get('series') or {}).get(sid,{});collector=sh.get(('market:' if meta.get('domain')=='market' else 'macro:')+sid,{})
  actual=s.get('last') or st.get('latest_observation');cls,expected,why,coverage,density=classify(meta,actual,st,collector,c,today,market_anchor);counts[cls]=counts.get(cls,0)+1
  idx=impacts.get(sid,[]);impact=('Affects '+', '.join(x.title() for x in idx)+' derived index/V2 evidence and any Analysis using '+(meta.get('short_name') or sid)+'.') if idx else ('Affects direct Analysis using '+(meta.get('short_name') or sid)+'.')
  rows[sid]={'id':sid,'name':meta.get('name'),'shortName':meta.get('short_name'),'provider':meta.get('provider'),'providerIdentifier':meta.get('provider_identifier'),'cadence':meta.get('native_cadence'),'classification':cls,'latestPubliclyExpectedObservation':expected,'actualLatestCanonicalObservation':iso_date(actual),'lastCollectionAttempt':st.get('last_attempted'),'lastSuccessfulCollection':st.get('last_successful'),'collectorStatus':collector.get('status'),'collectorError':collector.get('lastError') or st.get('last_error'),'horizonCoverage':coverage,'observationCount':density,'why':why,'chartImpact':impact,'affectedIndices':idx}
 out={'schema':'market-navigator-health-envelope-v1','version':'1.0.0-r7','generatedAt':dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00','Z'),'marketAnchor':iso_date(market_anchor),'summary':{'series':len(rows),**counts},'series':rows};write(OUT,out)
 required=set(sum(indices.values(),[]));missing=required-set(rows)
 if missing:raise SystemExit('Missing accepted health components: '+','.join(sorted(missing)))
 for sid in ('cpi','corePce','payrolls'):
  r=rows[sid]
  if r['latestPubliclyExpectedObservation'] and r['actualLatestCanonicalObservation'] and r['actualLatestCanonicalObservation']<r['latestPubliclyExpectedObservation'] and r['classification']=='expected-lag':raise SystemExit(sid+' incorrectly classified expected-lag')
 print(json.dumps(out['summary'],indent=2))

if __name__=='__main__':main()
