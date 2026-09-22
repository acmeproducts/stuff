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
import datetime as dt, json, os, urllib.parse, urllib.request
from pathlib import Path

CATALOG=Path("data/market-backend/data-catalog.json")
DEFINITION=Path("data/market-backend/derived-index-definition.json")
OUT=Path("market-evidence/vintage")
API="https://api.stlouisfed.org/fred/series/observations"
START="2015-01-01"
UTC=dt.timezone.utc
KEY=os.environ.get("MARKET_NAVIGATOR_FRED_API_KEY","").strip()

def read(p): return json.loads(Path(p).read_text())
def iso_now(): return dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z")

def get_json(params):
    if not KEY:
        raise SystemExit("C4 BLOCKED: MARKET_NAVIGATOR_FRED_API_KEY is not configured")
    q={**params,"api_key":KEY,"file_type":"json","limit":100000}
    url=API+"?"+urllib.parse.urlencode(q)
    req=urllib.request.Request(url,headers={"User-Agent":"MarketNavigatorVintageAudit/1.0"})
    with urllib.request.urlopen(req,timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))

def fetch(series_id,output_type):
    today=dt.date.today().isoformat()
    return get_json({
        "series_id":series_id,
        "observation_start":START,
        "realtime_start":START,
        "realtime_end":today,
        "output_type":output_type,
        "sort_order":"asc",
    }).get("observations") or []

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
        initial=fetch(source_id,4)
        changed=fetch(source_id,3)
        initial_keys={(x.get("date"),x.get("realtime_start"),x.get("value")) for x in initial}
        seen=set();events=[]
        for x in changed+initial:
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
                "isInitialRelease":key in initial_keys,
                "isRevision":key not in initial_keys,
            })
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
            "events":events,
            "notes":[
                "availableFrom/Until are FRED/ALFRED real-time periods, not canonical observation dates.",
                "For transformed canonical series such as CPI/Core PCE YoY, derive the value from the raw as-of vintage state later; do not apply today's revised t-12 denominator.",
            ],
        }
        (OUT/f"{sid}.json").write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
        summary[sid]={
            "sourceSeriesId":source_id,
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
