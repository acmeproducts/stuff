#!/usr/bin/env python3
from __future__ import annotations
import csv, datetime as dt, json, math, urllib.request
from pathlib import Path

CATALOG=Path('data/market-backend/data-catalog.json')
AMENDMENT=Path('data/market-backend/data-catalog-amendment-v1.1.json')
HY=Path('market-evidence/series/hySpread.json')
UA='MarketNavigatorEvidenceBootstrap/1.2 (+https://github.com/acmeproducts/stuff)'
DAY=86400000

def load(p): return json.loads(p.read_text(encoding='utf-8'))
def save(p,o): p.parent.mkdir(parents=True,exist_ok=True); p.write_text(json.dumps(o,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

def apply_amendment():
    c=load(CATALOG); a=load(AMENDMENT); overrides=a.get('series_overrides',{})
    for s in c.get('series',[]):
        if s.get('id') in overrides: s.update(overrides[s['id']])
    c['version']=a['version']; c['status']='authoritative-baseline-amended'
    c['applied_amendment']=AMENDMENT.as_posix()
    save(CATALOG,c)
    return c

def history_years(points):
    valid=sorted(int(p['t']) for p in points or [] if p.get('t') is not None)
    return (valid[-1]-valid[0])/(365.25*DAY) if len(valid)>1 else 0.0

def archive_points(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'text/csv,*/*'})
    with urllib.request.urlopen(req,timeout=60) as r: text=r.read().decode('utf-8-sig','replace')
    pts=[]
    for row in csv.reader(text.splitlines()[1:]):
        if len(row)<2 or row[1].strip() in {'','.'}: continue
        try:
            t=int(dt.datetime.fromisoformat(row[0]).replace(tzinfo=dt.timezone.utc).timestamp()*1000); v=float(row[1])
            if math.isfinite(v): pts.append({'t':t,'v':v})
        except Exception: pass
    if not pts: raise RuntimeError('HY archive returned zero observations')
    return pts

def preload_hy(catalog):
    meta=next(x for x in catalog['series'] if x['id']=='hySpread'); arc=meta.get('bootstrap_archive') or {}
    url=arc.get('snapshot_url')
    if not url: return
    prior=load(HY) if HY.exists() else {}
    existing=prior.get('observations',[])
    minimum=float(catalog.get('bootstrap_policy',{}).get('minimum_history_years',6))
    years=history_years(existing)
    if years >= minimum:
        print(f'HY archive bootstrap skipped: persisted history already {years:.2f} years')
        return
    pts=archive_points(url)
    by_t={int(p['t']):{'t':int(p['t']),'v':float(p['v'])} for p in existing if p.get('t') is not None and p.get('v') is not None}
    for p in pts: by_t[p['t']]=p
    obs=[by_t[k] for k in sorted(by_t)]
    prior.update({'schema':'market-navigator-evidence-series-v1','pipelineVersion':'1.0.0','id':'hySpread','catalogVersion':catalog['version'],'provider':'FRED','providerIdentifier':'BAMLH0A0HYM2','unit':'percent','cadence':'daily','description':meta['description'],'first':obs[0]['t'],'last':obs[-1]['t'],'count':len(obs),'bootstrapArchive':arc,'observations':obs})
    save(HY,prior)
    print('Preloaded HY archive:',len(obs),'observations')

def main():
    c=apply_amendment(); preload_hy(c); print('Applied catalog amendment',c['version'])
if __name__=='__main__': main()
