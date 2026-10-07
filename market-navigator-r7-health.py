#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt,json
import importlib.util
from pathlib import Path
_spec=importlib.util.spec_from_file_location('mn_corpus_policy',Path(__file__).resolve().with_name('market-navigator-corpus.py'));_policy=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_policy)
RULES=Path('data/market-backend/publication-rules.json')

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
def prev_month(y,m,n=1):
 x=y*12+(m-1)-n;return x//12,x%12+1
def expected_month(today,release_day):
 n=1 if today.day>=release_day else 2
 return prev_month(today.year,today.month,n)
def expected_quarter(today,release_day=30):
 q=(today.month-1)//3+1
 if today.month in (1,4,7,10) and today.day<release_day:q-=2
 else:q-=1
 while q<=0:q+=4;today=dt.date(today.year-1,today.month,today.day)
 return today.year,q
def latest_expected(meta,catalog,today):
 cad=meta.get('native_cadence') or meta.get('canonical_storage_cadence')
 ov=(catalog.get('publication_schedule') or {}).get('series_overrides',{}).get(meta['id'],{})
 if cad in ('monthly','daily-nav'):
  if cad=='daily-nav':return None,None
  day=int(ov.get('expected_day_of_month') or 20);y,m=expected_month(today,day)
  return dt.date(y,m,1),f"monthly release around day {day}; latest expected reference month {y:04d}-{m:02d}"
 if cad=='quarterly':
  day=int(ov.get('expected_day_of_month') or 30);y,q=expected_quarter(today,day);m=(q-1)*3+1
  return dt.date(y,m,1),f"quarterly release around day {day}; latest expected reference quarter Q{q} {y}"
 return None,None
def classify(meta,actual_ms,state,collector,catalog,today,market_anchor):
 cad=meta.get('native_cadence') or 'unknown'
 evidence=read(SERIES/f"{meta['id']}.json")
 root,expected,why=_policy.freshness(meta,evidence,catalog,read(RULES),dt.datetime.now(UTC))
 # These are the canonical collector facts; the retired legacy source-health file is not evidence of this collection.
 for field,title in (('last_attempted','Canonical last attempt'),('last_successful','Canonical last success'),('last_error','Canonical collection error')):
  if evidence.get(field):why+=' '+title+' '+str(evidence[field])+'.'
 coverage=state.get('horizon_readiness') or {};supported=meta.get('supported_horizons') or list(coverage);missing=[h for h in supported if not coverage.get(h)];density=evidence.get('count') or 0
 if root=='current' and missing:root='sparse';why+=' Supported horizons lacking canonical history: '+', '.join(missing)+'.'
 return root,expected,why,coverage,density,supported

def main():
 c=read(CAT);m=read(MAN);sh=(read(SOURCE_HEALTH).get('data') or {});today=dt.datetime.now(UTC).date();metas={x['id']:x for x in c.get('series',[]) if x.get('enabled',True)}
 anchors=[]
 for sid in ('spy','qqq','vix'):
  s=read(SERIES/f'{sid}.json')
  if s.get('last'):anchors.append(int(s['last']))
 market_anchor=max(anchors) if anchors else None
 indices={'risk':['spy','vix','hySpread','hyg','dxy','move','nfci'],'growth':['qqq','copper','smallCaps','manufacturingProduction','wti','unemployment','payrolls'],'macro':['tenYear','twoYear','curve10y2y','curve10y3m','cpi','corePce','fedFunds']}
 impacts={}
 for k,ids in indices.items():
  for sid in ids:impacts.setdefault(sid,[]).append(k)
 rows={};counts={k:0 for k in ('current','expected-lag','stale','missing','failed','sparse')}
 for sid,meta in metas.items():
  s=read(SERIES/f'{sid}.json');st=(m.get('series') or {}).get(sid,{});collector=sh.get(('market:' if meta.get('domain')=='market' else 'macro:')+sid,{})
  actual=s.get('last') or st.get('latest_observation');cls,expected,why,coverage,density,supported=classify(meta,actual,st,collector,c,today,market_anchor);counts[cls]=counts.get(cls,0)+1
  idx=impacts.get(sid,[]);impact=('Affects '+', '.join(x.title() for x in idx)+' derived index/V2 evidence and any Analysis using '+(meta.get('short_name') or sid)+'.') if idx else ('Affects direct Analysis using '+(meta.get('short_name') or sid)+'.')
  provider=st.get('provider_used') or s.get('provider') or meta.get('provider');fallback=bool(st.get('provider_fallback_used') or s.get('providerFallbackUsed'))
  if fallback:why+=' Provider fallback was used for this canonical collection.'
  rows[sid]={'id':sid,'name':meta.get('name'),'shortName':meta.get('short_name'),'provider':provider,'providerIdentifier':st.get('provider_identifier_used') or s.get('providerIdentifier') or meta.get('provider_identifier'),'providerChain':meta.get('provider_chain') or s.get('providerChain') or [],'providerFallbackUsed':fallback,'providerErrors':st.get('provider_errors') or s.get('providerErrors') or [],'instrumentClass':meta.get('instrument_class'),'canonicalMeasure':meta.get('canonical_measure'),'customSource':bool(meta.get('custom_source')),'cadence':meta.get('native_cadence'),'classification':cls,'latestPubliclyExpectedObservation':expected,'actualLatestCanonicalObservation':iso_date(actual),'lastCollectionAttempt':s.get('last_attempted'),'lastSuccessfulCollection':s.get('last_successful'),'collectorStatus':st.get('status'),'collectorError':st.get('last_error'),'horizonCoverage':coverage,'supportedHorizons':supported,'observationCount':density,'why':why,'chartImpact':impact,'affectedIndices':idx}
 out={'schema':'market-navigator-health-envelope-v1','version':'1.3.0-corpus','generatedAt':dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00','Z'),'marketAnchor':iso_date(market_anchor),'summary':{'series':len(rows),**counts},'series':rows};write(OUT,out)
 required=set(sum(indices.values(),[]));missing=required-set(rows)
 if missing:raise SystemExit('Missing accepted health components: '+','.join(sorted(missing)))
 for sid in ('cpi','corePce','payrolls'):
  r=rows[sid]
  if r['latestPubliclyExpectedObservation'] and r['actualLatestCanonicalObservation'] and r['actualLatestCanonicalObservation']<r['latestPubliclyExpectedObservation'] and r['classification']=='expected-lag':raise SystemExit(sid+' incorrectly classified expected-lag')
 print(json.dumps(out['summary'],indent=2))

if __name__=='__main__':main()
