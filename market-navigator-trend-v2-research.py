#!/usr/bin/env python3
"""Trend V2 research gate: compare institutional V1 against naive recent-index direction.
Research only. Does not publish Trend or change application UI.
"""
import json,datetime as dt
from pathlib import Path
DAY=86400000
PERSIST=Path('market-evidence/derived-indices-persistent-v1.json')
V1=Path('market-evidence/reports/trend-backtest-v1.json')
OUT=Path('market-evidence/reports/trend-v2-research.json')

def nearest(curve,t):
    z=None
    for p in curve:
        if int(p['t'])<=t:z=p
        else:break
    return z

def direction(kind,a,b,eps=.02):
    if not a or not b:return 'UNAVAILABLE'
    d=float(b['v'])-float(a['v'])
    if kind=='risk':d=-d
    return 'POSITIVE' if d>eps else 'NEGATIVE' if d<-eps else 'NEUTRAL'

def recent_signal(kind,curve,t,lookback=20):
    return direction(kind,nearest(curve,t-lookback*DAY),nearest(curve,t))

def stats(rows,key,h):
    valid=[r for r in rows if r[key] not in ('UNAVAILABLE','NEUTRAL') and r.get(str(h)) in ('POSITIVE','NEGATIVE','NEUTRAL')]
    hits=sum(r[key]==r[str(h)] for r in valid)
    return {'directionalSignals':len(valid),'directionalHitRate':round(hits/len(valid),4) if valid else None}

def main():
    p=json.loads(PERSIST.read_text());v1=json.loads(V1.read_text());tests={}
    for kind,t in v1['tests'].items():
        curve=p['indices'][kind]['horizons']['5YR']['curve'];rows=[]
        for r in t['rows']:
            base=recent_signal(kind,curve,int(r['t']),20);inst=r['signal']
            agreement=inst if inst in ('POSITIVE','NEGATIVE') and inst==base else 'NEUTRAL'
            rows.append({**r,'naive20d':base,'institutionalV1':inst,'agreement':agreement})
        summary={}
        for h in (10,20,30):
            summary[str(h)]={
                'naive20d':stats(rows,'naive20d',h),
                'institutionalV1':stats(rows,'institutionalV1',h),
                'agreement':stats(rows,'agreement',h)
            }
        tests[kind]={'status':'COMPLETE','method':'fixed 20-calendar-day recent governed-index direction baseline; agreement publishes direction only when V1 institutional signal and baseline agree','stats':summary}
    result={'schema':'market-navigator-trend-v2-research','status':'RESEARCH_ONLY','productionAuthorized':False,'contaminationNotice':'The five-year outcome history was already inspected during V1 qualification. This comparison is diagnostic and cannot by itself qualify a successor production model.','decisionRule':'A future Trend model must materially exceed naive recent-index-direction precision at useful coverage on untouched or prospectively accumulated evidence.','tests':tests}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(json.dumps(tests,indent=2))
if __name__=='__main__':main()
