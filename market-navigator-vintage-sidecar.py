#!/usr/bin/env python3
"""
Market Navigator FRED/ALFRED availability/vintage sidecar builder.

NON-PRODUCTION until C4 approval.

Requires environment variable:
    MARKET_NAVIGATOR_FRED_API_KEY

This does not replace the current no-auth FRED CSV path used for latest canonical
values. It builds historical raw-source availability events so a future persistent
index can use only information that was publicly available as of each calculation
date.

Important: CPI/Core PCE canonical series are YoY transforms of raw FRED price
indices. This sidecar intentionally stores raw-source vintage events. The as-of
YoY transform must be computed later from the raw vintage state that existed on
the relevant availability date; it must not use today's revised t-12 value.
"""
from __future__ import annotations
import datetime as dt, json, os, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

CATALOG=Path("data/market-backend/data-catalog.json")
DEFINITION=Path("data/market-backend/derived-index-definition.json")
OUT=Path("market-evidence/vintage")
API="https://api.stlouisfed.org/fred/series/observations"
START="2015-01-01"
UTC=dt.timezone.utc
KEY=os.environ.get("MARKET_NAVIGATOR_FRED_API_KEY","").strip()
RESUME=os.environ.get("MARKET_NAVIGATOR_VINTAGE_RESUME","").strip()=="1"

def read(p): return json.loads(Path(p).read_text())
def iso_now(): return dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")

def get_json(params):
    if not KEY:
        raise SystemExit("C4 BLOCKED: MARKET_NAVIGATOR_FRED_API_KEY is not configured")
    q={**params,"api_key":KEY,"file_type":"json","limit":100000}
    url=API+"?"+urllib.parse.urlencode(q)
    req=urllib.request.Request(url,headers={"User-Agent":"MarketNavigatorVintageAudit/1.0"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req,timeout=60) as r:
                return json.loads(r.read().decode("utf-8"))
        except urllib.error.HTTPError as exc:
            detail=exc.read().decode("utf-8",errors="replace")
            raise RuntimeError(f"FRED API HTTP {exc.code}: {detail}") from exc
        except (TimeoutError,urllib.error.URLError):
            if attempt==2: raise
            time.sleep(2**attempt)

def fetch(series_id,output_type):
    # FRED caps JSON requests at 2,000 vintage dates. A single 2015-present
    # real-time period now exceeds that ceiling. Two-year windows also keep
    # dense revision streams below the response/read timeout.
    start=dt.date.fromisoformat(START)
    today=dt.date.today()
    rows=[]
    while start <= today:
        end=min(today,dt.date(start.year+2,start.month,start.day)-dt.timedelta(days=1))
        rows.extend(get_json({
            "series_id":series_id,
            "observation_start":START,
            "realtime_start":start.isoformat(),
            "realtime_end":end.isoformat(),
            "output_type":output_type,
            "sort_order":"asc",
        }).get("observations") or [])
        start=end+dt.timedelta(days=1)
    return rows

def clean_value(v):
    if v in (None,"","."): return None
    try:return float(v)
    except:return None

def main():
    catalog=read(CATALOG); defs=read(DEFINITION)
    model_ids={x["id"] for idef in defs["indices"].values() for x in idef["components"]}
    cmap={x["id"]:x for x in catalog["series"]}
    fred_ids=[sid for sid in sorted(model_ids) if cmap.get(sid,{}).get("provider")=="FRED"]
    OUT.mkdir(parents=True,exist_ok=True)
    summary={}
    for sid in fred_ids:
        meta=cmap[sid];source_id=meta["provider_identifier"]
        target=OUT/f"{sid}.json"
        if RESUME and target.exists():
            obj=read(target)
            events=obj.get("events") or []
            summary[sid]={
                "sourceSeriesId":source_id,
                "availabilityQualification":obj.get("availabilityQualification","QUALIFIED_ALFRED"),
                "events":len(events),
                "initial":sum(1 for x in events if x["isInitialRelease"]),
                "revisions":sum(1 for x in events if x["isRevision"]),
                "firstAvailable":events[0]["availableFrom"] if events else None,
                "lastAvailable":events[-1]["availableFrom"] if events else None,
            }
            print(f"C4 RESUME {sid}: {len(events)} existing events",flush=True)
            continue
        print(f"C4 FETCH {sid} ({source_id})",flush=True)
        try:
            periods=fetch(source_id,1)
        except RuntimeError as exc:
            if "does not exist in ALFRED" not in str(exc):
                raise
            obj={
                "schema":"market-navigator-fred-vintage-sidecar-v1",
                "status":"C4_SHADOW_NON_PRODUCTION",
                "generatedAt":iso_now(),
                "canonicalSeriesId":sid,
                "sourceProvider":"FRED/ALFRED",
                "sourceSeriesId":source_id,
                "canonicalTransformation":meta.get("transformation"),
                "nativeCadence":meta.get("native_cadence"),
                "nativeUnit":meta.get("native_unit"),
                "observationStart":START,
                "availabilityQualification":"BLOCKED_NOT_IN_ALFRED",
                "events":[],
                "notes":[
                    "FRED reports this series is not available in ALFRED for the requested historical real-time period.",
                    "No historical availability date is inferred from the observation date or today's current-vintage data.",
                ],
            }
            target.write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
            summary[sid]={
                "sourceSeriesId":source_id,
                "availabilityQualification":"BLOCKED_NOT_IN_ALFRED",
                "events":0,"initial":0,"revisions":0,
                "firstAvailable":None,"lastAvailable":None,
            }
            print(f"C4 BLOCKED {sid}: not available in ALFRED",flush=True)
            continue
        seen=set();events=[]
        for x in periods:
            v=clean_value(x.get("value"))
            if v is None:continue
            key=(x.get("date"),x.get("realtime_start"),x.get("value"))
            if key in seen:continue
            seen.add(key)
            events.append({
                "observationDate":x.get("date"),
                "availableFrom":x.get("realtime_start"),
                "availableUntil":x.get("realtime_end"),
                "value":v,
                "isInitialRelease":False,
                "isRevision":True,
            })
        events.sort(key=lambda x:(x["observationDate"] or "",x["availableFrom"] or "",x["value"]))
        first_by_observation={}
        for event in events:
            first_by_observation.setdefault(event["observationDate"],event)
        for event in first_by_observation.values():
            event["isInitialRelease"]=True
            event["isRevision"]=False
        events.sort(key=lambda x:(x["availableFrom"] or "",x["observationDate"] or "",x["value"]))
        obj={
            "schema":"market-navigator-fred-vintage-sidecar-v1",
            "status":"C4_SHADOW_NON_PRODUCTION",
            "generatedAt":iso_now(),
            "canonicalSeriesId":sid,
            "sourceProvider":"FRED/ALFRED",
            "sourceSeriesId":source_id,
            "canonicalTransformation":meta.get("transformation"),
            "nativeCadence":meta.get("native_cadence"),
            "nativeUnit":meta.get("native_unit"),
            "observationStart":START,
            "availabilityQualification":"QUALIFIED_ALFRED",
            "events":events,
            "notes":[
                "availableFrom/Until are FRED/ALFRED real-time periods, not canonical observation dates.",
                "For transformed canonical series such as CPI/Core PCE YoY, derive the value from the raw as-of vintage state later; do not apply today's revised t-12 denominator.",
            ],
        }
        target.write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
        summary[sid]={
            "sourceSeriesId":source_id,
            "availabilityQualification":"QUALIFIED_ALFRED",
            "events":len(events),
            "initial":sum(1 for x in events if x["isInitialRelease"]),
            "revisions":sum(1 for x in events if x["isRevision"]),
            "firstAvailable":events[0]["availableFrom"] if events else None,
            "lastAvailable":events[-1]["availableFrom"] if events else None,
        }
    manifest={
        "schema":"market-navigator-vintage-manifest-v1",
        "status":"C4_SHADOW_NON_PRODUCTION",
        "generatedAt":iso_now(),
        "series":summary,
        "rule":"Historical as-known-at-time calculations may use only events available on or before the calculation date.",
    }
    (OUT/"manifest.json").write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    print(json.dumps(manifest,indent=2))

if __name__=="__main__":main()
