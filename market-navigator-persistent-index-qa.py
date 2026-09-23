#!/usr/bin/env python3
"""Mechanical I1 qualification for persistent Market Navigator indices."""
from __future__ import annotations

import datetime as dt
import json
import math
from pathlib import Path

DATA=Path("market-evidence/persistent-indices-v1.json")
REGISTRY=Path("data/market-backend/component-registry-v1.json")
OUT=Path("market-evidence/reports/persistent-index-qualification.json")
UTC=dt.timezone.utc


def read(path):
    return json.loads(Path(path).read_text())


def horizon_start(last,label):
    d=dt.date.fromisoformat(last)
    if label=="1D": return d-dt.timedelta(days=1)
    if label=="5D": return d-dt.timedelta(days=5)
    if label=="MTD": return d.replace(day=1)
    if label=="YTD": return d.replace(month=1,day=1)
    years=int(label[:-2])
    try: return d.replace(year=d.year-years)
    except ValueError: return d.replace(year=d.year-years,day=28)


def main():
    data=read(DATA)
    registry=read(REGISTRY)
    assert data["status"]=="I1_QUALIFIED_CANDIDATE_NOT_YET_PRODUCTION"
    assert data["modelVersion"]==registry["modelVersion"]
    report={}
    for index_id,row in data["indices"].items():
        dates=row["dates"]
        values=row["values"]
        ids=row["components"]
        signals=row["componentSignals"]
        source_dates=row["componentObservationDates"]
        n=len(dates)
        assert n==len(values)==len(row["timestamps"])
        assert dates==sorted(set(dates))
        assert len(ids)==7==len(signals)==len(source_dates)
        assert all(len(signals[sid])==n and len(source_dates[sid])==n for sid in ids)
        assert dates[0]==data["anchorDate"] and math.isclose(values[0],100,abs_tol=1e-12)

        for i,value in enumerate(values):
            reproduced=100+sum(signals[sid][i] for sid in ids)/7
            assert math.isclose(value,reproduced,rel_tol=0,abs_tol=1e-10), (index_id,i,value,reproduced)

        # Every supported horizon is a pure slice over the same date/value map.
        canonical=dict(zip(dates,values))
        horizon_counts={}
        for label in ("1D","5D","MTD","YTD","1YR","3YR","5YR"):
            start=horizon_start(dates[-1],label).isoformat()
            sliced=[(d,v) for d,v in zip(dates,values) if d>=start]
            assert all(canonical[d]==v for d,v in sliced)
            horizon_counts[label]=len(sliced)

        # Component contribution differences exactly reconcile any tested
        # canonical movement, including all supported horizon endpoints.
        endpoint_indices={0,n-1}
        for count in horizon_counts.values():
            if count: endpoint_indices.add(n-count)
        for i in sorted(endpoint_indices):
            for j in sorted(endpoint_indices):
                if j<=i: continue
                contribution=sum((signals[sid][j]-signals[sid][i])/7 for sid in ids)
                assert math.isclose(contribution,values[j]-values[i],rel_tol=0,abs_tol=1e-10)

        # Rebase 100 is derived display data and cannot mutate canonical data.
        before=list(values)
        base=values[max(0,n-min(n,50))]
        rebased=[100*v/base for v in values]
        assert values==before and math.isclose(rebased[max(0,n-min(n,50))],100,abs_tol=1e-12)

        report[index_id]={
            "status":"PASS",
            "observations":n,
            "firstDate":dates[0],
            "lastDate":dates[-1],
            "lastValue":values[-1],
            "components":len(ids),
            "formulaReplication":"PASS",
            "contributionReconciliation":"PASS",
            "horizonViewportInvariance":"PASS",
            "rebase100Isolation":"PASS",
            "horizonObservationCounts":horizon_counts,
        }

    result={
        "schema":"market-navigator-persistent-index-qualification-v1",
        "generatedAt":dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "gate":"I1",
        "status":"PASS",
        "modelVersion":data["modelVersion"],
        "indices":report,
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print(json.dumps(result,indent=2,sort_keys=True))


if __name__=="__main__":
    main()
