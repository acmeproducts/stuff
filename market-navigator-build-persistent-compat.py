#!/usr/bin/env python3
"""Build Turn 27 compatibility evidence/definition from persistent indices."""
from __future__ import annotations

import datetime as dt
import hashlib
import json
from pathlib import Path

PERSISTENT=Path("market-evidence/persistent-indices-v1.json")
REGISTRY=Path("data/market-backend/component-registry-v1.json")
OUT_EVIDENCE=Path("market-evidence/derived-indices-persistent-v1.json")
OUT_DEFINITION=Path("data/market-backend/derived-index-definition-persistent-v1.json")
UTC=dt.timezone.utc
HORIZONS=("1D","5D","MTD","YTD","1YR","3YR","5YR")


def read(path):
    return json.loads(Path(path).read_text())


def shift_start(end,label):
    d=dt.date.fromisoformat(end)
    if label=="1D": return d-dt.timedelta(days=1)
    if label=="5D": return d-dt.timedelta(days=5)
    if label=="MTD": return d.replace(day=1)
    if label=="YTD": return d.replace(month=1,day=1)
    years=int(label[:-2])
    try:return d.replace(year=d.year-years)
    except ValueError:return d.replace(year=d.year-years,day=28)


def main():
    persistent=read(PERSISTENT)
    registry=read(REGISTRY)
    comp={x["id"]:x for x in registry["components"]}
    common_end=min(x["dates"][-1] for x in persistent["indices"].values())
    definition={
        "schema":"market-navigator-derived-index-definition-persistent-v1",
        "status":"turn27-persistent-candidate",
        "version":registry["modelVersion"],
        "effective_date":registry["effectiveDate"],
        "purpose":"Persistent fixed-anchor Risk/Growth/Macro definitions governed by the C5 component registry.",
        "display_contract":{
            "baseline":100,
            "component_formula":"signal_i(t) = direction_i × economic_change(anchor_i, value_i(t)) / frozen_annualized_scale_i",
            "index_formula":"index(t) = 100 + (1/7) × sum(signal_i(t))",
            "weighting":"seven fixed equal coefficients; no reduced-set renormalization",
            "mixed_frequency_rule":"Use the latest governed state available by the calculation date; retain the actual source observation date.",
            "interpretation_rule":"Derived indices are transparent descriptive analytical products, not causal or predictive verdicts.",
            "ratio_eligibility_rule":"Not applicable to persistent v1; every component uses its governed C5 transform family.",
            "signed_series_rule":"Signed and rate components use additive native-unit movement divided by their frozen model-version scale.",
            "nonpositive_baseline_rule":"Nonpositive values are valid only for governed additive transform families; they are never ratio rebased.",
        },
        "indices":{},
    }
    for index_id,idef in registry["indices"].items():
        definition["indices"][index_id]={
            "name":idef["name"],"higher_means":idef["higherMeans"],
            "components":[{
                "id":sid,"direction":comp[sid]["direction"],"role":comp[sid]["role"],
                "transform":comp[sid]["transformFamily"],
                "transform_scale":comp[sid]["scale"]["annualizedScale"],
            } for sid in idef["components"]],
        }

    revision=hashlib.sha256(PERSISTENT.read_bytes()+REGISTRY.read_bytes()).hexdigest()[:16]
    evidence={
        "schema":"market-navigator-derived-indices-persistent-v1",
        "version":persistent["modelVersion"],
        "definitionVersion":registry["modelVersion"],
        "generatedAt":persistent["generatedAt"],
        "revision":revision,
        "commonMarketAnchor":common_end,
        "formula":"index(t) = 100 + fixed mean of seven governed component signals",
        "coherence":{"allIndexHorizonsComputable":True,"rule":"Every horizon is a viewport slice over one persistent canonical series; no horizon recalculation or reduced-set renormalization."},
        "componentTransforms":{},"ratioEligibility":{},"indices":{},
    }
    for sid,c in comp.items():
        evidence["componentTransforms"][sid]={
            "eligible":True,"kind":c["transformFamily"],"reason":None,
            "scale":c["scale"]["annualizedScale"],
            "scaleRule":c["scale"]["method"],
        }
        evidence["ratioEligibility"][sid]={"eligible":True,"reason":"governed persistent transform"}

    for index_id,row in persistent["indices"].items():
        dates=row["dates"]
        end_i=max(i for i,d in enumerate(dates) if d<=common_end)
        horizons={}
        for label in HORIZONS:
            requested=shift_start(common_end,label).isoformat()
            start_i=next((i for i,d in enumerate(dates[:end_i+1]) if d>=requested),0)
            start_date=dates[start_i]
            end_date=dates[end_i]
            components=[]
            for sid in row["components"]:
                s0=row["componentSignals"][sid][start_i]
                s1=row["componentSignals"][sid][end_i]
                v0=row["componentValues"][sid][start_i]
                v1=row["componentValues"][sid][end_i]
                components.append({
                    "id":sid,"direction":comp[sid]["direction"],"health":"current",
                    "commonT0":start_date,"commonNow":end_date,
                    "sourceT0Date":row["componentObservationDates"][sid][start_i],
                    "sourceNowDate":row["componentObservationDates"][sid][end_i],
                    "t0Value":v0,"nowValue":v1,"rawMovement":v1-v0,
                    "rawMovementPercent":((v1/v0)-1)*100 if v0 else None,
                    "signalT0":s0,"signalNow":s1,
                    "orientedIndex":100+(s1-s0),"moveFrom100":s1-s0,
                    "transform":comp[sid]["transformFamily"],
                    "transformScale":comp[sid]["scale"]["annualizedScale"],
                    "transformScaleRule":comp[sid]["scale"]["method"],
                    "noNewReleaseInHorizon":row["componentObservationDates"][sid][start_i]==row["componentObservationDates"][sid][end_i],
                })
            horizons[label]={
                "baseline":row["values"][start_i],"value":row["values"][end_i],
                "commonT0":start_date,"commonNow":end_date,
                "componentsDefined":7,"componentsUsed":7,"componentCoverage":1,
                "components":components,"omitted":[],"reasons":[],"status":"current",
                "noNewReleaseComponents":[x["id"] for x in components if x["noNewReleaseInHorizon"]],
                "curve":[{"t":row["timestamps"][i],"v":row["values"][i]} for i in range(start_i,end_i+1)],
            }
        idef=registry["indices"][index_id]
        evidence["indices"][index_id]={"name":idef["name"],"higherMeans":idef["higherMeans"],"horizons":horizons}

    OUT_DEFINITION.write_text(json.dumps(definition,indent=2,sort_keys=True)+"\n")
    OUT_EVIDENCE.write_text(json.dumps(evidence,separators=(",",":"),sort_keys=True)+"\n")
    print(json.dumps({"definition":str(OUT_DEFINITION),"evidence":str(OUT_EVIDENCE),"revision":revision,"commonMarketAnchor":common_end},indent=2))


if __name__=="__main__":
    main()
