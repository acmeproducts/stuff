#!/usr/bin/env python3
from __future__ import annotations
import csv,datetime as dt,hashlib,json,math,urllib.parse,urllib.request
from pathlib import Path

MODEL=Path('data/market-backend/trend-model-v1.json'); ROOT=Path('market-evidence'); SERIES=ROOT/'trend-series'; OUT=ROOT/'trend-v1.json'; REPORT=ROOT/'reports'/'trend-backtest-v1.json'; PERSIST=ROOT/'derived-indices-persistent-v1.json'
UA='MarketNavigatorTrend/1.0 (+https://github.com/acmeproducts/stuff)'; DAY=86400000

def now(): return dt.datetime.now(dt.timezone.utc)
def iso(x=None): return (x or now()).replace(microsecond=0).isoformat().replace('+00:00','Z')
def write(p,o): p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(o,indent=2,sort_keys=True)+'\n')
def fred(identifier):
    url='https://fred.stlouisfed.org/graph/fredgraph.csv?'+urllib.parse.urlencode({'id':identifier,'cosd':'2015-01-01'})
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'text/csv,*/*'})
    with urllib.request.urlopen(req,timeout=30) as r: rows=r.read().decode('utf-8-sig','replace').splitlines()
    out=[]
    for row in csv.reader(rows[1:]):
        if len(row)<2 or row[1].strip() in ('','.'): continue
        try:
            d=dt.date.fromisoformat(row[0]);v=float(row[1]);
            if math.isfinite(v): out.append({'date':d.isoformat(),'t':int(dt.datetime(d.year,d.month,d.day,tzinfo=dt.timezone.utc).timestamp()*1000),'v':v})
        except: pass
    if len(out)<5: raise RuntimeError(identifier+' insufficient observations')
    return out

def weekly_vote(obs,direction,asof=None):
    z=[x for x in obs if asof is None or x['t']<=asof]
    if len(z)<5:return 'UNAVAILABLE'
    z=z[-5:];moves=[]
    for a,b in zip(z,z[1:]):
        q=(b['v']-a['v'])*direction;moves.append(1 if q>0 else -1 if q<0 else 0)
    pos=sum(x>0 for x in moves);neg=sum(x<0 for x in moves)
    if pos>=3:return 'POSITIVE'
    if neg>=3:return 'NEGATIVE'
    return 'NEUTRAL'

def monthly_vote(obs,direction,asof=None):
    z=[x for x in obs if asof is None or x['t']<=asof]
    if len(z)<2:return 'UNAVAILABLE'
    q=(z[-1]['v']-z[-2]['v'])*direction
    return 'POSITIVE' if q>0 else 'NEGATIVE' if q<0 else 'NEUTRAL'

def source_vote(src,obs,asof=None): return monthly_vote(obs,src['favorableDirection'],asof) if src['cadence']=='monthly' else weekly_vote(obs,src['favorableDirection'],asof)
def publish(votes):
    usable=[x for x in votes if x!='UNAVAILABLE']
    if len(usable)<2:return 'UNAVAILABLE'
    p=usable.count('POSITIVE');n=usable.count('NEGATIVE')
    if p>=2 and n<2:return 'POSITIVE'
    if n>=2 and p<2:return 'NEGATIVE'
    return 'NEUTRAL'
def nearest(curve,t):
    z=None
    for p in curve:
        if int(p['t'])<=t:z=p
        else:break
    return z
def future(curve,t,days):
    target=t+days*DAY
    for p in curve:
        if int(p['t'])>=target:return p
    return None
def outcome(kind,a,b,eps=.02):
    if not a or not b:return None
    d=float(b['v'])-float(a['v'])
    # RSK higher means more risk; favorable Trend is therefore the inverse.
    if kind=='risk':d=-d
    return 'POSITIVE' if d>eps else 'NEGATIVE' if d<-eps else 'NEUTRAL'
def backtest(kind,srcs,data,curve):
    if not curve:return {'status':'UNAVAILABLE','reason':'persistent current-index curve unavailable'}
    start=max(min(x['t'] for x in data[s['id']]) for s in srcs)
    end=min(max(x['t'] for x in data[s['id']]) for s in srcs)
    # weekly as-of grid; no future observations are visible to the vote.
    t=start;rows=[]
    while t<=end:
        votes=[source_vote(s,data[s['id']],t) for s in srcs];sig=publish(votes);a=nearest(curve,t)
        row={'t':t,'date':dt.datetime.fromtimestamp(t/1000,dt.timezone.utc).date().isoformat(),'signal':sig,'votes':votes}
        for days in (10,20,30): row[str(days)]=outcome(kind,a,future(curve,t,days))
        rows.append(row);t+=7*DAY
    stats={}
    for days in (10,20,30):
        valid=[r for r in rows if r['signal']!='UNAVAILABLE' and r[str(days)]];directional=[r for r in valid if r['signal']!='NEUTRAL']
        hits=sum(r['signal']==r[str(days)] for r in directional);neutral=[r for r in valid if r['signal']=='NEUTRAL']
        stats[str(days)]={'observations':len(valid),'directionalSignals':len(directional),'directionalHitRate':round(hits/len(directional),4) if directional else None,'neutralSignals':len(neutral)}
    return {'status':'COMPLETE','start':rows[0]['date'] if rows else None,'end':rows[-1]['date'] if rows else None,'stats':stats,'rows':rows}
def main():
    model=json.loads(MODEL.read_text());SERIES.mkdir(parents=True,exist_ok=True);data={};sources={}
    for m in model['models'].values():
        for s in m['sources']:sources[s['id']]=s
    for sid,s in sources.items():
        obs=fred(s['identifier']);data[sid]=obs;write(SERIES/f'{sid}.json',{'schema':'market-navigator-trend-series-v1','id':sid,'provider':'FRED','providerIdentifier':s['identifier'],'cadence':s['cadence'],'count':len(obs),'first':obs[0]['date'],'last':obs[-1]['date'],'observations':obs})
    current={}
    for kind,m in model['models'].items():
        details=[]
        for s in m['sources']:
            v=source_vote(s,data[s['id']]);o=data[s['id']][-1];details.append({'id':s['id'],'name':s['name'],'family':s['family'],'vote':v,'latestObservation':o['date'],'latestValue':o['v']})
        state=publish([x['vote'] for x in details]);current[kind]={'state':state,'label':m['label'],'horizon':model['horizon'],'sources':details}
    payload={'schema':'market-navigator-trend-evidence-v1','modelVersion':model['version'],'generatedAt':iso(),'indices':current};payload['revision']=hashlib.sha256(json.dumps(payload,sort_keys=True).encode()).hexdigest()[:16];write(OUT,payload)
    p=json.loads(PERSIST.read_text()) if PERSIST.exists() else {};tests={}
    for kind,m in model['models'].items():
        curve=(((p.get('indices') or {}).get(kind) or {}).get('horizons') or {}).get('5YR',{}).get('curve') or []
        tests[kind]=backtest(kind,m['sources'],data,curve)
    report={'schema':'market-navigator-trend-backtest-v1','modelVersion':model['version'],'generatedAt':iso(),'method':'weekly historical as-of votes; outcomes are subsequent governed persistent Current-index movement at 10/20/30 calendar days; RSK outcome sign inverted because lower risk is favorable','tests':tests};write(REPORT,report)
    print(json.dumps({'ok':True,'revision':payload['revision'],'current':{k:v['state'] for k,v in current.items()},'backtest':{k:v.get('stats') for k,v in tests.items()}},indent=2))
if __name__=='__main__':main()
