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
 return {'1D':nth(1),'5D':nth(5),'MTD':int(dt.datetime(ed.year,ed.month,1,tzinfo=UTC).timestamp()*1000),'YTD':int(dt.datetime(ed.year,1,1,tzinfo=UTC).timestamp()*1000),'1YR':int(shift_year(ed,1).timestamp()*1000),'3YR':int(shift_year(ed,3).timestamp()*1000),'5YR':int(shift_year(ed,5).timestamp()*1000)}

def trailing_scale(obs,anchor,years=5):
 end=dt.datetime.fromtimestamp(anchor/1000,UTC); start=int(shift_year(end,years).timestamp()*1000)
 vals=[float(p['v']) for p in obs if start<=p['t']<=anchor and p.get('v') is not None and math.isfinite(float(p['v']))]
 if len(vals)<3: vals=[float(p['v']) for p in obs if p.get('v') is not None and math.isfinite(float(p['v']))]
 if len(vals)<2:return None,{'reason':'insufficient observations for normalization scale','count':len(vals)}
 med=statistics.median(vals); mad=statistics.median([abs(v-med) for v in vals]); robust=1.4826*mad
 pstdev=statistics.pstdev(vals); span=max(vals)-min(vals)
 floor=max(pstdev*0.5,span/10.0,1e-9)
 scale=max(robust,floor)
 return scale,{'windowYears':years,'count':len(vals),'median':med,'mad':mad,'robustSigma':robust,'populationStdDev':pstdev,'range':span,'rangeFloor':span/10.0,'scale':scale}

def main():
 d=read(DEF); health=read(HEALTH); spy=read(SERIES/'spy.json'); anchor=spy['observations'][-1]['t']; starts=market_starts(spy); results={}; usable=[]; scales={}
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
    if sid not in scales: scales[sid]=trailing_scale(obs,anchor)
    scale,scale_meta=scales[sid]
    if not scale: omitted.append({'id':sid,'reason':scale_meta.get('reason','normalization scale unavailable')}); continue
    p0=asof(obs,t0_anchor); p1=asof(obs,anchor)
    if not p0 or not p1: omitted.append({'id':sid,'reason':'insufficient canonical history at common horizon anchors'}); continue
    t0=float(p0['v']); now=float(p1['v'])
    if not math.isfinite(t0) or not math.isfinite(now): omitted.append({'id':sid,'reason':'non-finite canonical value'}); continue
    normalized_delta=(now-t0)/scale
    oriented=100 + 10*int(c['direction'])*normalized_delta
    rows.append({'id':sid,'direction':int(c['direction']),'commonT0':iso_ms(t0_anchor),'sourceT0Date':iso_ms(p0['t']),'t0Value':t0,'commonNow':iso_ms(anchor),'sourceNowDate':iso_ms(p1['t']),'nowValue':now,'normalizationScale':scale,'normalizedDelta':normalized_delta,'orientedIndex':oriented,'moveFrom100':oriented-100,'health':health.get('series',{}).get(sid,{}).get('classification','unknown'),'noNewReleaseInHorizon':p0['t']==p1['t']})
   n=len(rows); value=statistics.fmean([x['orientedIndex'] for x in rows]) if rows else None
   abs_moves=[abs(x['moveFrom100']) for x in rows]; total=sum(abs_moves); concentration=(max(abs_moves)/total if total else 0.0) if rows else None
   health_bad=[x for x in rows if x['health'] not in ('current','expected-lag')]
   no_release=[x['id'] for x in rows if x['noNewReleaseInHorizon']]
   concentration_note=None
   if concentration is not None and concentration>0.80 and n>1: concentration_note='movement is highly concentrated in one component; inspect component contribution before interpretation'
   status='unavailable' if n==0 else ('degraded' if omitted or health_bad else 'current')
   reasons=[]
   if not rows: reasons.append('no component is mathematically usable under the canonical formula')
   if omitted: reasons.append('omitted: '+', '.join(x['id'] for x in omitted))
   if health_bad: reasons.append('non-current evidence: '+', '.join(x['id']+':'+x['health'] for x in health_bad))
   if concentration_note: reasons.append(concentration_note)
   horizons[h]={'status':status,'value':value,'baseline':100,'commonT0':iso_ms(t0_anchor),'commonNow':iso_ms(anchor),'componentsUsed':n,'componentsDefined':len(comps),'componentCoverage':n/len(comps),'absoluteMoveConcentration':concentration,'concentrationDiagnostic':concentration_note,'noNewReleaseComponents':no_release,'components':rows,'omitted':omitted,'reasons':reasons}
   usable.append(status!='unavailable')
  results[ik]={'name':idef['name'],'higherMeans':idef.get('higher_means'),'horizons':horizons}
 out={'schema':'market-navigator-derived-indices-v1','version':'2.0.0-r7','generatedAt':dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00','Z'),'definitionVersion':d.get('version'),'commonMarketAnchor':iso_ms(anchor),'formula':'oriented_index_t = 100 + 10 * direction * ((value_t - value_t0) / trailing_5y_robust_scale)','normalizationScales':{sid:meta for sid,(scale,meta) in scales.items()},'indices':results}
 out['coherence']={'allIndexHorizonsComputable':all(usable),'rule':'Every index uses one common market anchor and horizon start. Components are equal-weighted after unitless normalization by a fixed trailing-five-year robust level scale. The scale is the greater of 1.4826*MAD, half the population standard deviation, or one tenth of the five-year observed range. This avoids percentage explosions for rates, spreads, policy rates and any series near or across zero while preserving direction and comparable contribution magnitude. Low-frequency series use only real published observations; no synthetic daily points or hidden substitutes are created.'}; out['revision']=sha(out); write(OUT,out)
 if not out['coherence']['allIndexHorizonsComputable']:
  bad=[f'{i}:{h}' for i,v in results.items() for h,x in v['horizons'].items() if x['status']=='unavailable']; raise SystemExit('Derived index coherence failed: '+', '.join(bad))
 extreme=[f'{i}:{h}:{x["value"]:.3f}' for i,v in results.items() for h,x in v['horizons'].items() if x.get('value') is not None and abs(x['value']-100)>100]
 if extreme: raise SystemExit('Derived index normalized-magnitude coherence failed: '+', '.join(extreme))
 print(json.dumps({'ok':True,'revision':out['revision'],'anchor':out['commonMarketAnchor'],'indices':{i:{h:{'status':x['status'],'value':round(x['value'],4) if x.get('value') is not None else None,'used':x.get('componentsUsed'),'defined':x.get('componentsDefined'),'concentration':round(x['absoluteMoveConcentration'],3) if x.get('absoluteMoveConcentration') is not None else None,'noNewRelease':x.get('noNewReleaseComponents')} for h,x in v['horizons'].items()} for i,v in results.items()}},indent=2))

if __name__=='__main__': main()
