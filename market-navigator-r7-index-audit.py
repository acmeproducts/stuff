#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt,json,math,statistics,hashlib
from pathlib import Path

ROOT=Path('market-evidence'); SERIES=ROOT/'series'; HEALTH=ROOT/'health-envelope.json'
DEF=Path('data/market-backend/derived-index-definition.json'); OUT=ROOT/'derived-indices.json'; H=['1D','5D','MTD','YTD','1YR','3YR','5YR']; UTC=dt.timezone.utc

def read(p): return json.loads(p.read_text())
def sha(x): return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16]
def write(p,o): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(o,indent=2,sort_keys=True)+'\n')
def iso_ms(ms): return dt.datetime.fromtimestamp(ms/1000,UTC).date().isoformat() if ms else None
def asof(obs,t):
 z=None
 for p in obs:
  if p['t']<=t:z=p
  else:break
 return z
def shift_year(d,n):
 try:return d.replace(year=d.year-n)
 except:return d.replace(year=d.year-n,month=2,day=28)
def market_starts(spy):
 obs=spy['observations']; end=obs[-1]; ed=dt.datetime.fromtimestamp(end['t']/1000,UTC)
 def nth(n): return obs[-(n+1)]['t'] if len(obs)>n else None
 return {
  '1D':nth(1),'5D':nth(5),
  'MTD':int(dt.datetime(ed.year,ed.month,1,tzinfo=UTC).timestamp()*1000),
  'YTD':int(dt.datetime(ed.year,1,1,tzinfo=UTC).timestamp()*1000),
  '1YR':int(shift_year(ed,1).timestamp()*1000),
  '3YR':int(shift_year(ed,3).timestamp()*1000),
  '5YR':int(shift_year(ed,5).timestamp()*1000)}

def main():
 d=read(DEF); health=read(HEALTH); spy=read(SERIES/'spy.json'); anchor=spy['observations'][-1]['t']; starts=market_starts(spy); results={}; usable=[]
 for ik,idef in d['indices'].items():
  horizons={}; comps=idef['components']
  for h in H:
   rows=[]; omitted=[]; t0_anchor=starts[h]
   if not t0_anchor:
    horizons[h]={'status':'unavailable','reason':'common market anchor lacks horizon history','componentsUsed':0,'componentsDefined':len(comps),'componentCoverage':0}; usable.append(False); continue
   for c in comps:
    sid=c['id']; sp=SERIES/f'{sid}.json'
    if not sp.exists(): omitted.append({'id':sid,'reason':'canonical evidence file missing'}); continue
    s=read(sp); obs=s.get('observations') or []
    p0=asof(obs,t0_anchor); p1=asof(obs,anchor)
    if not p0 or not p1:
      omitted.append({'id':sid,'reason':'insufficient canonical history at common horizon anchors'}); continue
    t0=float(p0['v']); now=float(p1['v'])
    if not math.isfinite(t0) or not math.isfinite(now) or t0<=0:
      omitted.append({'id':sid,'reason':'nonpositive or invalid baseline; ratio rebasing not meaningful under the canonical definition'}); continue
    oriented=100 + int(c['direction'])*((now/t0)-1)*100
    rows.append({'id':sid,'direction':int(c['direction']),'commonT0':iso_ms(t0_anchor),'sourceT0Date':iso_ms(p0['t']),'t0Value':t0,'commonNow':iso_ms(anchor),'sourceNowDate':iso_ms(p1['t']),'nowValue':now,'orientedIndex':oriented,'moveFrom100':oriented-100,'health':health.get('series',{}).get(sid,{}).get('classification','unknown'),'noNewReleaseInHorizon':p0['t']==p1['t']})
   n=len(rows); value=statistics.fmean([x['orientedIndex'] for x in rows]) if rows else None
   abs_moves=[abs(x['moveFrom100']) for x in rows]; total=sum(abs_moves); concentration=(max(abs_moves)/total if total else 0.0) if rows else None
   health_bad=[x for x in rows if x['health'] not in ('current','expected-lag')]
   # Canonical definition explicitly says arithmetic mean of available components and contains no minimum-count rule.
   # Do not invent one here. Any governed omission makes the result degraded and is exposed in metadata.
   status='unavailable' if n==0 else ('degraded' if omitted or health_bad else 'current')
   reasons=[]
   if not rows: reasons.append('no component is mathematically usable under the canonical formula')
   if omitted: reasons.append('omitted: '+', '.join(x['id'] for x in omitted))
   if health_bad: reasons.append('non-current evidence: '+', '.join(x['id']+':'+x['health'] for x in health_bad))
   horizons[h]={'status':status,'value':value,'baseline':100,'commonT0':iso_ms(t0_anchor),'commonNow':iso_ms(anchor),'componentsUsed':n,'componentsDefined':len(comps),'componentCoverage':n/len(comps),'absoluteMoveConcentration':concentration,'components':rows,'omitted':omitted,'reasons':reasons}
   usable.append(status!='unavailable')
  results[ik]={'name':idef['name'],'higherMeans':idef.get('higher_means'),'horizons':horizons}
 out={'schema':'market-navigator-derived-indices-v1','version':'1.2.0-r7','generatedAt':dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00','Z'),'definitionVersion':d.get('version'),'commonMarketAnchor':iso_ms(anchor),'formula':d.get('display_contract',{}).get('index_formula'),'indices':results}
 out['coherence']={'allIndexHorizonsComputable':all(usable),'rule':'Every index uses one common market anchor and one common horizon start. Each component contributes its last actual published observation at or before each anchor; low-frequency series with no new release contribute 100, not a month-over-month move mislabeled as 1D/5D. The canonical definition requires the arithmetic mean of available components and specifies no minimum component threshold. Every omission is explicit and causes degraded status; no substitute series or transformation is invented.'}; out['revision']=sha(out); write(OUT,out)
 if not out['coherence']['allIndexHorizonsComputable']:
  bad=[f'{i}:{h}' for i,v in results.items() for h,x in v['horizons'].items() if x['status']=='unavailable']; raise SystemExit('Derived index coherence failed: '+', '.join(bad))
 print(json.dumps({'ok':True,'revision':out['revision'],'anchor':out['commonMarketAnchor'],'indices':{i:{h:{'status':x['status'],'value':round(x['value'],4) if x.get('value') is not None else None,'used':x.get('componentsUsed'),'defined':x.get('componentsDefined')} for h,x in v['horizons'].items()} for i,v in results.items()}},indent=2))

if __name__=='__main__': main()
