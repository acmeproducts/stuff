#!/usr/bin/env python3
"""
Market Navigator component shadow audit.

NON-PRODUCTION: compares candidate component transformations/scales against
canonical evidence without modifying derived-index-definition.json or
market-evidence/derived-indices.json.

C3 questions:
- Does equal nominal weight create structurally concentrated realized influence?
- Are VIX/MOVE better behaved as log/proportional or additive level changes?
- How sensitive MAC is to Treasury-curve direction semantics?
- How stable is the composite direction under leave-one-component-out tests?

C4 information-time/vintage truth is intentionally NOT solved here.
"""
from __future__ import annotations
import datetime as dt, json, math, statistics
from pathlib import Path

ROOT=Path("market-evidence/series")
DEF=Path("data/market-backend/derived-index-definition.json")
OUT=Path("market-evidence/reports/component-shadow-audit.json")
UTC=dt.timezone.utc


BASE_FAMILY={
    # RSK
    "spy":"log","vix":"log","hySpread":"diff","hyg":"log","dxy":"log","move":"log","nfci":"diff",
    # GRW
    "qqq":"log","copper":"log","smallCaps":"log","manufacturingProduction":"log","wti":"diff","unemployment":"diff","payrolls":"log",
    # MAC
    "tenYear":"diff","twoYear":"diff","curve10y2y":"diff","curve10y3m":"diff","cpi":"diff","corePce":"diff","fedFunds":"diff",
}

SCENARIOS={
    "S2A_EVENT_FREQ":{
        "description":"Leading candidate: economically meaningful change / event SD / sqrt(observed events per year); VIX/MOVE log; current curve directions.",
        "overrides":{},"direction_overrides":{},"scale_lookback_years":None,"nonzero_event_frequency":False
    },
    "S2B_VOL_LEVEL":{
        "description":"Sensitivity: VIX and MOVE use additive level changes instead of log changes.",
        "overrides":{"vix":"diff","move":"diff"},"direction_overrides":{},"scale_lookback_years":None,"nonzero_event_frequency":False
    },
    "S2C_CURVE_INVERTED_PRESSURE":{
        "description":"Sensitivity: same as S2A but Treasury-curve directions reversed so deeper inversion raises MAC pressure.",
        "overrides":{},"direction_overrides":{"curve10y2y":-1,"curve10y3m":-1},"scale_lookback_years":None,"nonzero_event_frequency":False
    },
    "S2D_NONZERO_EVENT_FREQ":{
        "description":"Sensitivity: for additive/rate families, event frequency counts only non-zero information changes; price/log families retain observed cadence.",
        "overrides":{},"direction_overrides":{},"scale_lookback_years":None,"nonzero_event_frequency":True
    },
    "S2E_5Y_SCALE":{
        "description":"Sensitivity: S2A architecture with scale parameters estimated from the latest five years of canonical observations.",
        "overrides":{},"direction_overrides":{},"scale_lookback_years":5,"nonzero_event_frequency":False
    },
    "S2F_3Y_SCALE":{
        "description":"Sensitivity: S2A architecture with scale parameters estimated from the latest three years of canonical observations.",
        "overrides":{},"direction_overrides":{},"scale_lookback_years":3,"nonzero_event_frequency":False
    },
}

HORIZONS=("1D","5D","MTD","YTD","1YR","3YR","5YR")

def read(p): return json.loads(Path(p).read_text())
def iso(ms): return dt.datetime.fromtimestamp(ms/1000,UTC).date().isoformat()

def asof(obs,t):
    z=None
    lo,hi=0,len(obs)
    while lo<hi:
        mid=(lo+hi)//2
        if obs[mid]["t"]<=t: z=obs[mid];lo=mid+1
        else: hi=mid
    return z

def sd(a):
    return statistics.stdev(a) if len(a)>=2 else None

def event_sigma(obs,family):
    vals=[float(p["v"]) for p in obs if p.get("v") is not None and math.isfinite(float(p["v"]))]
    d=[]
    for a,b in zip(vals,vals[1:]):
        if family=="log":
            if a>0 and b>0: d.append(math.log(b/a))
        else:
            d.append(b-a)
    s=sd(d)
    return s if s and math.isfinite(s) and s>0 else None

def scale_observations(obs,lookback_years):
    if not lookback_years or not obs:return obs
    cutoff=obs[-1]["t"]-int(lookback_years*365.2425*86400000)
    out=[x for x in obs if x["t"]>=cutoff]
    return out if len(out)>=3 else obs

def observed_events_per_year(obs,family,nonzero_only=False):
    if len(obs)<2:return None
    span=(obs[-1]["t"]-obs[0]["t"])/(365.2425*86400000)
    if span<=0:return None
    if not nonzero_only:return (len(obs)-1)/span
    count=0
    vals=[float(p["v"]) for p in obs if p.get("v") is not None and math.isfinite(float(p["v"]))]
    for a,b in zip(vals,vals[1:]):
        ch=economic_change(a,b,family)
        if ch is not None and abs(ch)>1e-12:count+=1
    return count/span if count else None

def economic_change(a,b,family):
    a=float(a);b=float(b)
    if family=="log":
        if a<=0 or b<=0:return None
        return math.log(b/a)
    return b-a

def shift_year(d,n):
    try:return d.replace(year=d.year-n)
    except:return d.replace(year=d.year-n,month=2,day=28)

def window_start(market,idx,h):
    if h=="1D": return market[idx-1]["t"] if idx>=1 else None
    if h=="5D": return market[idx-5]["t"] if idx>=5 else None
    end=dt.datetime.fromtimestamp(market[idx]["t"]/1000,UTC)
    if h=="MTD": target=dt.datetime(end.year,end.month,1,tzinfo=UTC)
    elif h=="YTD": target=dt.datetime(end.year,1,1,tzinfo=UTC)
    elif h=="1YR": target=shift_year(end,1)
    elif h=="3YR": target=shift_year(end,3)
    elif h=="5YR": target=shift_year(end,5)
    else:return None
    return int(target.timestamp()*1000)

def percentile(xs,p):
    if not xs:return None
    ys=sorted(xs); k=(len(ys)-1)*p;f=math.floor(k);c=math.ceil(k)
    if f==c:return ys[int(k)]
    return ys[f]*(c-k)+ys[c]*(k-f)

def sign(x,eps=1e-12):
    return 1 if x>eps else -1 if x<-eps else 0

def summarize_windows(rows):
    largest=[r["largestShare"] for r in rows if r["largestShare"] is not None]
    top2=[r["top2Share"] for r in rows if r["top2Share"] is not None]
    return {
        "windows":len(rows),
        "largestShare":{"median":percentile(largest,.5),"p90":percentile(largest,.9),"p95":percentile(largest,.95),"max":max(largest) if largest else None},
        "top2Share":{"median":percentile(top2,.5),"p90":percentile(top2,.9),"p95":percentile(top2,.95),"max":max(top2) if top2 else None},
    }

def main():
    defs=read(DEF)
    comp={}
    for index_id,idef in defs["indices"].items():
        for x in idef["components"]:
            comp[x["id"]]={"index":index_id,"direction":int(x["direction"])}
    series={sid:read(ROOT/f"{sid}.json") for sid in comp}
    market=series["spy"]["observations"]
    scenarios={}
    for sname,sc in SCENARIOS.items():
        family={**BASE_FAMILY,**sc["overrides"]}
        direction={sid:sc["direction_overrides"].get(sid,meta["direction"]) for sid,meta in comp.items()}
        scales={}
        for sid,x in series.items():
            sobs=scale_observations(x["observations"],sc.get("scale_lookback_years"))
            ev=event_sigma(sobs,family[sid])
            nz=bool(sc.get("nonzero_event_frequency") and family[sid]=="diff")
            freq=observed_events_per_year(sobs,family[sid],nz)
            scales[sid]={
                "family":family[sid],"eventSigma":ev,"eventsPerYear":freq,
                "annualizedScale":(ev*math.sqrt(freq) if ev and freq else None),
                "cadence":x.get("cadence"),
                "scaleLookbackYears":sc.get("scale_lookback_years"),
                "frequencyRule":"non-zero economic changes per calendar year" if nz else "observed canonical observations per calendar year"
            }
        by_index={}
        for index_id,idef in defs["indices"].items():
            ids=[x["id"] for x in idef["components"]]
            hres={}
            for h in HORIZONS:
                windows=[]
                # Weekly sampling is enough for distribution diagnostics and keeps output bounded.
                for mi in range(5,len(market),5):
                    t1=market[mi]["t"];t0=window_start(market,mi,h)
                    if t0 is None:continue
                    vals=[]
                    complete=True
                    for sid in ids:
                        p0=asof(series[sid]["observations"],t0);p1=asof(series[sid]["observations"],t1)
                        sca=scales[sid]["annualizedScale"]
                        if not p0 or not p1 or not sca:
                            complete=False;break
                        ch=economic_change(p0["v"],p1["v"],family[sid])
                        if ch is None:
                            complete=False;break
                        vals.append({"id":sid,"movement":direction[sid]*ch/sca})
                    if not complete:continue
                    total=sum(abs(x["movement"]) for x in vals)
                    if total<=0:continue
                    full=statistics.fmean(x["movement"] for x in vals)
                    ordered=sorted(vals,key=lambda x:abs(x["movement"]),reverse=True)
                    flips=0;max_loo=0
                    for x in vals:
                        loo=statistics.fmean(y["movement"] for y in vals if y["id"]!=x["id"])
                        if sign(full) and sign(loo) and sign(full)!=sign(loo):flips+=1
                        max_loo=max(max_loo,abs(loo-full))
                    windows.append({
                        "end":iso(t1),"largestComponent":ordered[0]["id"],
                        "largestShare":abs(ordered[0]["movement"])/total,
                        "top2Share":sum(abs(x["movement"]) for x in ordered[:2])/total,
                        "fullMovement":full,"leaveOneOutSignFlips":flips,"maxLeaveOneOutDelta":max_loo
                    })
                summary=summarize_windows(windows)
                summary["anyLeaveOneOutSignFlipRate"]=(sum(1 for w in windows if w["leaveOneOutSignFlips"]>0)/len(windows) if windows else None)
                summary["maxLeaveOneOutDeltaP95"]=percentile([w["maxLeaveOneOutDelta"] for w in windows],.95) if windows else None
                # Which components most often dominate?
                counts={}
                for w in windows:counts[w["largestComponent"]]=counts.get(w["largestComponent"],0)+1
                summary["largestComponentFrequency"]=dict(sorted(counts.items(),key=lambda kv:(-kv[1],kv[0])))
                regimes={
                    "PRE_COVID_2016_2019":(dt.date(2016,1,1),dt.date(2019,12,31)),
                    "COVID_2020":(dt.date(2020,1,1),dt.date(2020,12,31)),
                    "INFLATION_TIGHTENING_2022_2023":(dt.date(2022,1,1),dt.date(2023,12,31)),
                    "RECENT_2024_2026":(dt.date(2024,1,1),dt.date(2026,12,31)),
                }
                summary["regimes"]={}
                for rname,(ra,rb) in regimes.items():
                    rr=[w for w in windows if ra<=dt.date.fromisoformat(w["end"])<=rb]
                    rs=summarize_windows(rr)
                    rs["anyLeaveOneOutSignFlipRate"]=(sum(1 for w in rr if w["leaveOneOutSignFlips"]>0)/len(rr) if rr else None)
                    summary["regimes"][rname]=rs
                hres[h]=summary
            by_index[index_id]=hres
        scenarios[sname]={"description":sc["description"],"scales":scales,"indices":by_index}
    out={
        "schema":"market-navigator-component-shadow-audit-v1",
        "status":"NON_PRODUCTION_C3_SHADOW",
        "generatedAt":dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "warning":"C4 release/vintage information-time semantics are not applied; results are transformation/influence diagnostics only. Scale-window scenarios are retrospective sensitivity tests, not production backcasts.",
        "scenarios":scenarios
    }
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(out,indent=2,sort_keys=True)+"\n")
    compact={}
    for sn,s in scenarios.items():
        compact[sn]={}
        for idx,h in s["indices"].items():
            compact[sn][idx]={k:{
                "largest_p95":round(v["largestShare"]["p95"],4) if v["largestShare"]["p95"] is not None else None,
                "top2_p95":round(v["top2Share"]["p95"],4) if v["top2Share"]["p95"] is not None else None,
                "loo_flip_rate":round(v["anyLeaveOneOutSignFlipRate"],4) if v["anyLeaveOneOutSignFlipRate"] is not None else None
            } for k,v in h.items()}
    print(json.dumps(compact,indent=2))

if __name__=="__main__":main()
