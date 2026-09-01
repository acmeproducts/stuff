#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt,json,math,statistics,hashlib
from pathlib import Path

ROOT=Path('market-evidence'); SERIES=ROOT/'series'; REPORTS=ROOT/'reports'; HEALTH=ROOT/'health-envelope.json'
DEF=Path('data/market-backend/derived-index-definition.json'); OUT=ROOT/'derived-indices.json'; H=['1D','5D','MTD','YTD','1YR','3YR','5YR']

def read(p): return json.loads(p.read_text())
def iso_ms(ms): return dt.datetime.fromtimestamp(ms/1000,dt.timezone.utc).date().isoformat() if ms else None
def sha(x): return hashlib.sha256(json.dumps(x,sort_keys=True,separators=(',',':')).encode()).hexdigest()[:16]
def write(p,o): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(o,indent=2,sort_keys=True)+'\n')

def main():
 d=read(DEF); health=read(HEALTH); results={}; overall=[]
 for ik,idef in d['indices'].items():
  horizons={}; comps=idef['components']
  for h in H:
   rows=[]; omitted=[]
   for c in comps:
    sid=c['id']; rp=REPORTS/f'{sid}.json'; sp=SERIES/f'{sid}.json'
    if not rp.exists() or not sp.exists(): omitted.append({'id':sid,'reason':'canonical evidence file missing'}); continue
    r=read(rp)['reports'].get(h,{})
    if not r.get('ready'): omitted.append({'id':sid,'reason':r.get('reason','horizon not ready')}); continue
    t0=float(r['t0_value']); now=float(r['now_value'])
    if not math.isfinite(t0) or not math.isfinite(now) or t0<=0:
      omitted.append({'id':sid,'reason':'nonpositive or invalid baseline; ratio rebasing not meaningful'}); continue
    oriented=100 + int(c['direction'])*((now/t0)-1)*100
    rows.append({'id':sid,'direction':int(c['direction']),'t0Date':iso_ms(r['t0_date']),'t0Value':t0,'nowDate':iso_ms(r['now_date']),'nowValue':now,'orientedIndex':oriented,'moveFrom100':oriented-100,'health':health.get('series',{}).get(sid,{}).get('classification','unknown')})
   n=len(rows); needed=max(5,len(comps)-1)
   value=statistics.fmean([x['orientedIndex'] for x in rows]) if rows else None
   abs_moves=[abs(x['moveFrom100']) for x in rows]; total=sum(abs_moves)
   concentration=(max(abs_moves)/total if total else 0.0) if rows else None
   health_bad=[x for x in rows if x['health'] not in ('current','expected-lag')]
   status='unavailable'
   if n>=needed:
      status='degraded' if omitted or health_bad else 'current'
   reasons=[]
   if n<needed: reasons.append(f'only {n}/{len(comps)} components are mathematically usable; minimum {needed}')
   if omitted: reasons.append('omitted: '+', '.join(x['id'] for x in omitted))
   if health_bad: reasons.append('non-current evidence: '+', '.join(x['id']+':'+x['health'] for x in health_bad))
   horizons[h]={'status':status,'value':value,'baseline':100,'componentsUsed':n,'componentsDefined':len(comps),'componentCoverage':n/len(comps),'absoluteMoveConcentration':concentration,'components':rows,'omitted':omitted,'reasons':reasons}
   overall.append(status!='unavailable')
  results[ik]={'name':idef['name'],'higherMeans':idef.get('higher_means'),'horizons':horizons}
 out={'schema':'market-navigator-derived-indices-v1','version':'1.0.0-r7','generatedAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'definitionVersion':d.get('version'),'formula':d.get('display_contract',{}).get('index_formula'),'indices':results}
 out['revision']=sha(out); out['coherence']={'allIndexHorizonsUsable':all(overall),'rule':'A horizon is usable only when at least 6 of 7 defined components (minimum 5) are mathematically valid; unavailable components are omitted explicitly, never substituted. Health degradation is preserved in status.'}
 write(OUT,out)
 if not out['coherence']['allIndexHorizonsUsable']:
   bad=[f'{i}:{h}' for i,v in results.items() for h,x in v['horizons'].items() if x['status']=='unavailable']
   raise SystemExit('Derived index coherence failed: '+', '.join(bad))
 print(json.dumps({'ok':True,'revision':out['revision'],'indices':{i:{h:x['status'] for h,x in v['horizons'].items()} for i,v in results.items()}},indent=2))

if __name__=='__main__': main()
