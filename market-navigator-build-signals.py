#!/usr/bin/env python3
from __future__ import annotations
import bisect, json, math, statistics
from pathlib import Path

ROOT=Path('market-data')
SERIES=ROOT/'series'
MODEL_PATH=ROOT/'signal-model.json'
OUT=ROOT/'signals'
HORIZONS={'1M':31,'3M':93,'6M':186,'1Y':366,'5Y':1830,'All':None}
DAY=86400000

def read(p): return json.loads(p.read_text(encoding='utf-8'))
def write(p,o):
    p.parent.mkdir(parents=True,exist_ok=True)
    text=json.dumps(o,ensure_ascii=False,indent=2,sort_keys=True)+'\n'
    old=p.read_text(encoding='utf-8') if p.exists() else None
    if old==text:return False
    p.write_text(text,encoding='utf-8');return True

def percentile(values,x):
    vals=sorted(v for v in values if isinstance(v,(int,float)) and math.isfinite(v))
    if not vals:return None
    return round(100*bisect.bisect_right(vals,x)/len(vals),1)

def pct(a,b):
    return None if a in (None,0) or b is None else (b/a-1)*100

def sign(x,eps=1e-9):
    if x is None or abs(x)<=eps:return 0
    return 1 if x>0 else -1

def position_label(p):
    if p is None:return 'Unavailable'
    if p<=10:return 'Very Low'
    if p<=30:return 'Low'
    if p<=70:return 'Normal'
    if p<=90:return 'High'
    return 'Very High'

def series_stats(obj,horizon,trend_periods):
    obs=obj.get('observations') or []
    if not obs:return None
    end=obs[-1]['t'];days=HORIZONS[horizon]
    start_t=obs[0]['t'] if days is None else end-days*DAY
    win=[p for p in obs if p['t']>=start_t]
    if len(win)<2:return None
    t0,now=win[0]['v'],win[-1]['v'];delta=now-t0;dpct=pct(t0,now)
    vals=[p['v'] for p in win];per=percentile(vals,now)
    n=max(2,min(int(trend_periods or 3),len(obs)-1))
    recent=obs[-(n+1):]
    recent_change=pct(recent[0]['v'],recent[-1]['v'])
    prev=None
    if len(obs)>=2*n+1:
        prior=obs[-(2*n+1):-(n)]
        prev=pct(prior[0]['v'],prior[-1]['v']) if len(prior)>=2 else None
    trend='Stable'
    threshold=.05 if obj.get('unit')=='percent' else .15
    if recent_change is not None:
        if recent_change>threshold:trend='Rising'
        elif recent_change<-threshold:trend='Falling'
    persistence=1
    dirs=[]
    for a,b in zip(obs[-min(len(obs),n+1):],obs[-min(len(obs),n+1)+1:]): dirs.append(sign(b['v']-a['v']))
    if dirs:
        last=dirs[-1];persistence=0
        for d in reversed(dirs):
            if d==last and d!=0:persistence+=1
            else:break
        if last==0:persistence=0
    acceleration='Unavailable'
    if recent_change is not None and prev is not None:
        diff=recent_change-prev
        acceleration='Accelerating' if diff>.1 else 'Decelerating' if diff<-.1 else 'Steady'
    return {
      't0':t0,'now':now,'delta':delta,'deltaPct':dpct,
      'relativePercentile':per,'relativePosition':position_label(per),
      'trend':trend,'persistence':persistence,'recentChangePct':recent_change,
      'priorComparableChangePct':prev,'acceleration':acceleration,
      'firstTimestamp':win[0]['t'],'lastTimestamp':win[-1]['t'],'observationsInWindow':len(win)
    }

def implication(evidence,stats):
    sid=evidence['id'];trend=stats['trend'];p=stats['relativePercentile']
    higher=evidence.get('higherMeaning')
    if evidence.get('evidenceClass')=='ambiguous-context':return 'Ambiguous'
    if higher in ('more risk','more restrictive','weaker growth'):
        if p is not None and p>=80:return 'Unfavorable'
        if trend=='Rising':return 'Unfavorable'
        if p is not None and p<=30 and trend!='Rising':return 'Favorable'
        if trend=='Falling':return 'Favorable'
    if sid in ('cpi','coreCpi','corePce','pce','breakeven10y','wti'):
        if trend=='Rising' and (p is None or p>=50):return 'Unfavorable'
        if trend=='Falling':return 'Favorable'
    if sid in ('payrolls','industrialProduction','retailSales','realGdp','qqq','spy'):
        if trend=='Rising':return 'Favorable'
        if trend=='Falling':return 'Unfavorable'
    return 'Neutral'

def fam_inflation(items):
    direct=[x for x in items if x['evidenceClass']=='direct' and x['available']]
    conf=[x for x in items if x['evidenceClass'] in ('expectations','input') and x['available']]
    rising=sum(x['stats']['trend']=='Rising' and x['stats']['persistence']>=2 for x in direct)
    falling=sum(x['stats']['trend']=='Falling' and x['stats']['persistence']>=2 for x in direct)
    high=sum((x['stats']['relativePercentile'] or 0)>=70 for x in direct)
    conf_rising=sum(x['stats']['trend']=='Rising' for x in conf)
    if direct and high>=1 and rising>=1 and conf_rising>=1:return 'High & Persistent','Deteriorating','high'
    if rising>=2 or (rising>=1 and conf_rising>=1):return 'Building','Deteriorating','medium'
    if falling>=2 or (falling>=1 and all(x['stats']['trend']!='Rising' for x in conf)):return 'Easing','Improving','medium'
    return 'Contained','Stable','medium' if direct else 'low'

def fam_financial(items):
    avail=[x for x in items if x['available']]
    restrictive=sum(x['implication']=='Unfavorable' and x['importance']=='primary' for x in avail)
    favorable=sum(x['implication']=='Favorable' and x['importance']=='primary' for x in avail)
    high=sum((x['stats']['relativePercentile'] or 0)>=80 and x['implication']=='Unfavorable' for x in avail)
    if restrictive>=3 and high>=2:return 'Very Restrictive','Deteriorating','high'
    if restrictive>=2:return 'Restrictive','Deteriorating','high' if restrictive>=3 else 'medium'
    if favorable>=2:return 'Supportive','Improving','medium'
    return 'Neutral','Stable','medium' if avail else 'low'

def fam_growth(items):
    primary=[x for x in items if x['available'] and x['importance']=='primary']
    rising=sum(x['stats']['trend']=='Rising' for x in primary)
    falling=sum(x['stats']['trend']=='Falling' for x in primary)
    accel=sum(x['stats']['acceleration']=='Accelerating' for x in primary)
    if falling>=3:return 'Contracting' if falling==len(primary) and len(primary)>=3 else 'Weakening','Deteriorating','high'
    if rising>=3 and accel>=1:return 'Strong','Improving','high'
    if rising>=2:return 'Improving','Improving','medium'
    if falling>=2:return 'Weakening','Deteriorating','medium'
    return 'Stable','Stable','medium' if primary else 'low'

def fam_risk(items):
    primary=[x for x in items if x['available'] and x['importance']=='primary']
    high=sum((x['stats']['relativePercentile'] or 0)>=80 for x in primary)
    veryhigh=sum((x['stats']['relativePercentile'] or 0)>=90 for x in primary)
    rising=sum(x['stats']['trend']=='Rising' for x in primary)
    falling=sum(x['stats']['trend']=='Falling' for x in primary)
    if veryhigh>=2:return 'Acute','Deteriorating','high'
    if high>=2:return 'High','Deteriorating','high'
    if high>=1 or rising>=2:return 'Elevated','Deteriorating','medium'
    if falling>=2 and all((x['stats']['relativePercentile'] or 50)<60 for x in primary):return 'Low','Improving','medium'
    return 'Normal','Stable','medium' if primary else 'low'

def classify_family(fid,items):
    if fid=='inflationPressure':return fam_inflation(items)
    if fid=='financialConditions':return fam_financial(items)
    if fid=='growthMomentum':return fam_growth(items)
    if fid=='marketRisk':return fam_risk(items)
    return 'Mixed','Stable','low'

def regime(fams):
    inf=fams['inflationPressure']['state'];fin=fams['financialConditions']['state'];g=fams['growthMomentum']['state'];r=fams['marketRisk']['state']
    if g in ('Improving','Strong') and inf in ('Easing','Contained') and fin in ('Supportive','Neutral') and r in ('Low','Normal'):
        return 'Favorable','expansion','high'
    if g in ('Stable','Improving','Strong') and (inf in ('Building','High & Persistent') or fin in ('Restrictive','Very Restrictive')):
        return 'Caution','late-cycle-pressure','medium'
    if g in ('Weakening','Contracting') and inf in ('Building','High & Persistent') and fin in ('Restrictive','Very Restrictive'):
        return 'Defensive','stagflationary-pressure','high'
    if g in ('Weakening','Contracting') and (r in ('High','Acute') or fin in ('Restrictive','Very Restrictive')):
        return 'Defensive','contraction-risk','high'
    if g=='Improving' and inf in ('Easing','Contained') and fin in ('Supportive','Neutral') and r in ('Low','Normal'):
        return 'Favorable — Improving','early-recovery','medium'
    return 'Neutral / Mixed','mixed','low'

def build_horizon(model,series,h):
    fams={}
    for fid,fdef in model['signals'].items():
        items=[]
        for ev in fdef['evidence']:
            obj=series.get(ev['id']);cad=ev.get('cadence') or (obj or {}).get('cadence','monthly')
            tr=model['trendRules'].get(cad,model['trendRules']['monthly'])['recentPeriods']
            st=series_stats(obj,h,tr) if obj else None
            items.append({**ev,'available':st is not None,'stats':st,'implication':implication(ev,st) if st else 'Unavailable'})
        state,direction,confidence=classify_family(fid,items)
        confirming=[x['id'] for x in items if x['available'] and x['implication'] in ('Favorable','Unfavorable')]
        ambiguous=[x['id'] for x in items if x['available'] and x['implication']=='Ambiguous']
        fams[fid]={'question':fdef['question'],'state':state,'direction':direction,'confidence':confidence,'evidence':items,'confirmingEvidence':confirming,'ambiguousEvidence':ambiguous}
    label,pattern,confidence=regime(fams)
    return {'horizon':h,'regime':{'classification':label,'pattern':pattern,'confidence':confidence},'signals':fams}

def main():
    model=read(MODEL_PATH)
    series={p.stem:read(p) for p in SERIES.glob('*.json')}
    out={'schema':'market-navigator-signal-snapshot-v1','modelVersion':model['modelVersion'],'horizons':{h:build_horizon(model,series,h) for h in HORIZONS}}
    write(OUT/'current.json',out)
    print(json.dumps({'ok':True,'modelVersion':model['modelVersion'],'horizons':{h:out['horizons'][h]['regime'] for h in HORIZONS}},indent=2))
if __name__=='__main__':main()
