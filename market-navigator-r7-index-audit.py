#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt,json,math,statistics,hashlib
from pathlib import Path
ROOT=Path('market-evidence'); SERIES=ROOT/'series'; HEALTH=ROOT/'health-envelope.json'; DEF=Path('data/market-backend/derived-index-definition.json'); OUT=ROOT/'derived-indices.json'; H=['1D','5D','MTD','YTD','1YR','3YR','5YR']; UTC=dt.timezone.utc
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
def ratio_eligible(obs):
 vals=[float(p['v']) for p in obs if p.get('v') is not None and math.isfinite(float(p['v']))]
 if not vals:return False,'no finite canonical observations'
 lo,hi=min(vals),max(vals)
 if lo<=0<=hi:return False,f'canonical history spans zero ({lo:g} to {hi:g}); ratio rebasing is structurally unstable'
 if 0 in vals:return False,'canonical history contains zero; ratio rebasing is undefined'
 return True,None
def main():
 d=read(DEF); health=read(HEALTH); spy=read(SERIES/'spy.json'); market_obs=spy['observations']; anchor=market_obs[-1]['t']; starts=market_starts(spy); results={}; usable=[]; eligibility={}; cache={}
 for ik,idef in d['indices'].items():
  horizons={}; comps=idef['components']
  for h in H:
   rows=[]; omitted=[]; t0_anchor=starts[h]
   if not t0_anchor:
    horizons[h]={'status':'unavailable','reason':'common market anchor lacks horizon history','componentsUsed':0,'componentsDefined':len(comps),'componentCoverage':0}; usable.append(False); continue
   bases={}; active=[]
   for c in comps:
    sid=c['id']; sp=SERIES/f'{sid}.json'
    if not sp.exists(): omitted.append({'id':sid,'reason':'canonical evidence file missing'}); continue
    s=cache.setdefault(sid,read(sp)); obs=s.get('observations') or []
    if sid not in eligibility: eligibility[sid]=ratio_eligible(obs)
    eligible,reason=eligibility[sid]
    if not eligible: omitted.append({'id':sid,'reason':reason}); continue
    p0=asof(obs,t0_anchor); p1=asof(obs,anchor)
    if not p0 or not p1: omitted.append({'id':sid,'reason':'insufficient canonical history at common horizon anchors'}); continue
    base=float(p0['v']); now=float(p1['v'])
    if not math.isfinite(base) or not math.isfinite(now) or base<=0: omitted.append({'id':sid,'reason':'nonpositive or invalid baseline; ratio rebasing not meaningful under the canonical definition'}); continue
    direction=int(c['direction']); oriented=100+direction*((now/base)-1)*100; bases[sid]=base; active.append((sid,direction,obs))
    rows.append({'id':sid,'direction':direction,'commonT0':iso_ms(t0_anchor),'sourceT0Date':iso_ms(p0['t']),'t0Value':base,'commonNow':iso_ms(anchor),'sourceNowDate':iso_ms(p1['t']),'nowValue':now,'orientedIndex':oriented,'moveFrom100':oriented-100,'health':health.get('series',{}).get(sid,{}).get('classification','unknown'),'noNewReleaseInHorizon':p0['t']==p1['t']})
   curve=[]
   for mp in market_obs:
    t=mp['t']
    if t<t0_anchor or t>anchor: continue
    vals=[]
    for sid,direction,obs in active:
     p=asof(obs,t)
     if p and float(p['v'])>0: vals.append(100+direction*((float(p['v'])/bases[sid])-1)*100)
    if vals: curve.append({'t':t,'v':statistics.fmean(vals)})
   n=len(rows); value=statistics.fmean([x['orientedIndex'] for x in rows]) if rows else None; abs_moves=[abs(x['moveFrom100']) for x in rows]; total=sum(abs_moves); concentration=(max(abs_moves)/total if total else 0.0) if rows else None; health_bad=[x for x in rows if x['health'] not in ('current','expected-lag')]; no_release=[x['id'] for x in rows if x['noNewReleaseInHorizon']]; concentration_note='movement is highly concentrated in one component; this can be legitimate when low-frequency components have no new release in the selected horizon' if concentration is not None and concentration>0.80 and n>1 else None; status='unavailable' if n==0 else ('degraded' if omitted or health_bad else 'current'); reasons=[]
   if not rows: reasons.append('no component is mathematically usable under the canonical formula')
   if omitted: reasons.append('omitted: '+', '.join(x['id'] for x in omitted))
   if health_bad: reasons.append('non-current evidence: '+', '.join(x['id']+':'+x['health'] for x in health_bad))
   if concentration_note: reasons.append(concentration_note)
   horizons[h]={'status':status,'value':value,'baseline':100,'commonT0':iso_ms(t0_anchor),'commonNow':iso_ms(anchor),'componentsUsed':n,'componentsDefined':len(comps),'componentCoverage':n/len(comps),'absoluteMoveConcentration':concentration,'concentrationDiagnostic':concentration_note,'noNewReleaseComponents':no_release,'components':rows,'omitted':omitted,'reasons':reasons,'curve':curve}; usable.append(status!='unavailable')
  results[ik]={'name':idef['name'],'higherMeans':idef.get('higher_means'),'horizons':horizons}
 out={'schema':'market-navigator-derived-indices-v1','version':'1.5.0-r7','generatedAt':dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace('+00:00','Z'),'definitionVersion':d.get('version'),'commonMarketAnchor':iso_ms(anchor),'formula':d.get('display_contract',{}).get('index_formula'),'ratioEligibility':{sid:{'eligible':v[0],'reason':v[1]} for sid,v in eligibility.items()},'indices':results}; out['coherence']={'allIndexHorizonsComputable':all(usable),'rule':'Every index uses one common market anchor and one common horizon start. Persisted V1 curves are evaluated on real market-session anchors; low-frequency components use their most recent real observation at or before each anchor without creating synthetic source observations. Ratio-ineligible components are omitted consistently and exposed.'}; out['revision']=sha(out); write(OUT,out)
 if not out['coherence']['allIndexHorizonsComputable']: raise SystemExit('Derived index coherence failed')
 print(json.dumps({'ok':True,'revision':out['revision'],'anchor':out['commonMarketAnchor'],'curvePoints':{i:{h:len(x['curve']) for h,x in v['horizons'].items()} for i,v in results.items()}},indent=2))
if __name__=='__main__': main()
