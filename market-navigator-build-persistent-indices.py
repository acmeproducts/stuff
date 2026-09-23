#!/usr/bin/env python3
"""Build governed persistent RSK/GRW/MAC candidate evidence from the C5 registry."""
from __future__ import annotations

import bisect
import datetime as dt
import json
import math
from collections import defaultdict
from pathlib import Path

REGISTRY=Path("data/market-backend/component-registry-v1.json")
SERIES=Path("market-evidence/series")
VINTAGE=Path("market-evidence/vintage")
OUT=Path("market-evidence/persistent-indices-v1.json")
UTC=dt.timezone.utc
ANCHOR="2016-09-01"


def read(path):
    return json.loads(Path(path).read_text())


def iso_ms(ms):
    return dt.datetime.fromtimestamp(ms/1000,UTC).date().isoformat()


def ms(value):
    return int(dt.datetime.combine(dt.date.fromisoformat(value),dt.time(),UTC).timestamp()*1000)


def prior_year(value):
    d=dt.date.fromisoformat(value)
    try:
        return d.replace(year=d.year-1).isoformat()
    except ValueError:
        return d.replace(year=d.year-1,day=28).isoformat()


def canonical_events(sid):
    obj=read(SERIES/f"{sid}.json")
    return [{"date":iso_ms(x["t"]),"value":float(x["v"]),"observationDate":iso_ms(x["t"])} for x in obj["observations"]]


def vintage_events(sid):
    obj=read(VINTAGE/f"{sid}.json")
    if obj["availabilityQualification"]!="QUALIFIED_ALFRED":
        return canonical_events(sid)
    grouped=defaultdict(list)
    for event in obj["events"]:
        grouped[event["availableFrom"]].append(event)
    raw={}
    out=[]
    last=None
    for available,updates in sorted(grouped.items()):
        for event in updates:
            raw[event["observationDate"]]=float(event["value"])
        if sid in ("cpi","corePce"):
            eligible=[d for d in raw if prior_year(d) in raw]
            if not eligible:
                continue
            observation=max(eligible)
            value=(raw[observation]/raw[prior_year(observation)]-1)*100
        else:
            observation=max(raw)
            value=raw[observation]
        current=(value,observation)
        if current!=last:
            out.append({"date":available,"value":value,"observationDate":observation})
            last=current
    return out


def asof(events,date_value):
    dates=[x["date"] for x in events]
    i=bisect.bisect_right(dates,date_value)-1
    return events[i] if i>=0 else None


def change(family,a,b):
    if family=="log_return":
        if a<=0 or b<=0:
            return None
        return math.log(b/a)
    return b-a


def main():
    registry=read(REGISTRY)
    assert registry["status"]=="C5_APPROVED_NOT_YET_PRODUCTION"
    meta={x["id"]:x for x in registry["components"]}
    events={}
    for sid,row in meta.items():
        events[sid]=vintage_events(sid) if row["provider"]=="FRED" else canonical_events(sid)
        events[sid].sort(key=lambda x:x["date"])

    result={
        "schema":"market-navigator-persistent-indices-v1",
        "status":"I1_QUALIFIED_CANDIDATE_NOT_YET_PRODUCTION",
        "modelVersion":registry["modelVersion"],
        "generatedAt":dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "anchorDate":ANCHOR,
        "anchorValue":100,
        "candidateEffectiveDate":registry["effectiveDate"],
        "historyLabel":"RETROSPECTIVE BACKCAST",
        "horizonRule":"VIEWPORT_ONLY",
        "rebase100Rule":"DISPLAY_ONLY",
        "indices":{},
    }
    for index_id,idef in registry["indices"].items():
        ids=idef["components"]
        anchors={sid:asof(events[sid],ANCHOR) for sid in ids}
        assert all(anchors.values()), (index_id,"missing-anchor",[x for x in ids if not anchors[x]])
        dates=sorted({e["date"] for sid in ids for e in events[sid] if e["date"]>=ANCHOR})
        values=[]
        signals={sid:[] for sid in ids}
        component_values={sid:[] for sid in ids}
        source_dates={sid:[] for sid in ids}
        retained_dates=[]
        for day in dates:
            current={sid:asof(events[sid],day) for sid in ids}
            if not all(current.values()):
                continue
            row_signals={}
            complete=True
            for sid in ids:
                rule=meta[sid]
                movement=change(rule["transformFamily"],anchors[sid]["value"],current[sid]["value"])
                scale=rule["scale"]["annualizedScale"]
                if movement is None or not scale:
                    complete=False
                    break
                row_signals[sid]=rule["direction"]*movement/scale
            if not complete:
                continue
            level=100+sum(row_signals.values())/7
            retained_dates.append(day)
            values.append(level)
            for sid in ids:
                signals[sid].append(row_signals[sid])
                component_values[sid].append(current[sid]["value"])
                source_dates[sid].append(current[sid]["observationDate"])
        assert retained_dates and retained_dates[0]==ANCHOR
        assert math.isclose(values[0],100,abs_tol=1e-12)
        result["indices"][index_id]={
            "name":idef["name"],
            "dates":retained_dates,
            "timestamps":[ms(x) for x in retained_dates],
            "values":values,
            "components":ids,
            "componentSignals":signals,
            "componentValues":component_values,
            "componentObservationDates":source_dates,
        }
    OUT.write_text(json.dumps(result,separators=(",",":"),sort_keys=True)+"\n")
    print(json.dumps({k:{"observations":len(v["dates"]),"first":v["dates"][0],"last":v["dates"][-1],"lastValue":v["values"][-1]} for k,v in result["indices"].items()},indent=2))


if __name__=="__main__":
    main()
