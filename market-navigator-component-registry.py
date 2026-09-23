#!/usr/bin/env python3
"""Merge passed C3 scale records and C4 availability records into C5."""
from __future__ import annotations

import datetime as dt
import json
from pathlib import Path

CATALOG=Path("data/market-backend/data-catalog.json")
DEFINITION=Path("data/market-backend/derived-index-definition.json")
C3=Path("market-evidence/reports/component-shadow-audit.json")
C4=Path("market-evidence/reports/component-vintage-audit.json")
OUT=Path("data/market-backend/component-registry-v1.json")
UTC=dt.timezone.utc

FAMILY={
    "spy":"log_return","vix":"log_return","hySpread":"rate_change",
    "hyg":"log_return","dxy":"log_return","move":"log_return",
    "nfci":"signed_level_change","qqq":"log_return","copper":"log_return",
    "smallCaps":"log_return","manufacturingProduction":"log_return",
    "wti":"signed_price_change","unemployment":"rate_change",
    "payrolls":"log_return","tenYear":"rate_change","twoYear":"rate_change",
    "curve10y2y":"signed_level_change","curve10y3m":"signed_level_change",
    "cpi":"rate_change","corePce":"rate_change","fedFunds":"rate_change",
}


def read(path):
    return json.loads(Path(path).read_text())


def main():
    catalog=read(CATALOG)
    definition=read(DEFINITION)
    c3=read(C3)
    c4=read(C4)
    assert c4["status"]=="PASS_WITH_PROSPECTIVE_ONLY_SOURCE"
    scales=c3["scenarios"]["S2A_EVENT_FREQ"]["scales"]
    cmap={x["id"]:x for x in catalog["series"]}
    components=[]
    indices={}
    for index_id,idef in definition["indices"].items():
        ids=[x["id"] for x in idef["components"]]
        indices[index_id]={
            "name":idef["name"],
            "higherMeans":idef["higher_means"],
            "components":ids,
            "coefficientRule":"EQUAL_1_OF_7",
            "coefficient":1/7,
            "missingRule":"UNAVAILABLE_UNLESS_ALL_7_COMPONENTS_HAVE_GOVERNED_STATE",
        }
        for source in idef["components"]:
            sid=source["id"]
            meta=cmap[sid]
            direction=-1 if sid in ("curve10y2y","curve10y3m") else int(source["direction"])
            provider=meta.get("provider")
            if provider=="FRED":
                c4row=c4["series"][sid]
                availability=(
                    "ALFRED_REALTIME_PERIODS"
                    if c4row["status"]=="PASS"
                    else "RETROSPECTIVE_CURRENT_VINTAGE_BACKCAST_THEN_PROSPECTIVE_CAPTURE"
                )
                vintage_status=c4row["status"]
            else:
                availability="RETROSPECTIVE_MARKET_HISTORY_BACKCAST_THEN_PROSPECTIVE_CAPTURE"
                vintage_status="NOT_REVISED_MACRO_SERIES"
            scale=scales[sid]
            components.append({
                "id":sid,
                "index":index_id,
                "role":source["role"],
                "provider":provider,
                "providerIdentifier":meta.get("provider_identifier"),
                "nativeCadence":meta.get("native_cadence"),
                "nativeUnit":meta.get("native_unit"),
                "transformFamily":FAMILY[sid],
                "direction":direction,
                "coefficient":1/7,
                "scale":{
                    "method":"EVENT_CHANGE_SD_X_SQRT_OBSERVED_EVENTS_PER_YEAR",
                    "eventChangeSD":scale["eventSigma"],
                    "eventsPerYear":scale["eventsPerYear"],
                    "annualizedScale":scale["annualizedScale"],
                    "calibrationStart":scale["calibrationStart"],
                    "calibrationEnd":scale["calibrationEnd"],
                    "observationCount":scale["calibrationObservationCount"],
                    "frequencyRule":scale["frequencyRule"],
                    "frozenForModelVersion":True,
                },
                "availabilityMode":availability,
                "vintageQualification":vintage_status,
                "preEffectiveLabel":"RETROSPECTIVE BACKCAST",
            })

    assert len(components)==21
    assert all(len(x["components"])==7 for x in indices.values())
    registry={
        "schema":"market-navigator-component-registry-v1",
        "status":"C5_APPROVED_NOT_YET_PRODUCTION",
        "modelVersion":"MN-PERSISTENT-1.0.0",
        "approvedAt":dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "effectiveDate":"2026-09-23",
        "calibrationEvidenceCutoff":c3["calibrationCandidate"]["diagnosticCutoff"],
        "c3Decision":"S2A_EVENT_FREQ_WITH_FROZEN_MODEL_VERSION_SCALE",
        "c4Decision":c4["status"],
        "historyRule":"All dates before effectiveDate are RETROSPECTIVE BACKCAST. They are not represented as values published or knowable on those dates.",
        "publishedRule":"Published canonical values begin on effectiveDate and use only prospectively captured or ALFRED-qualified state available by the calculation date.",
        "revisionRule":"A later source revision affects prospective state only from its own availableFrom date. A model-version restatement must be explicit and may not silently rewrite published values.",
        "weightRule":"Seven equal nominal coefficients per index; no horizon-dependent weights, adaptive reweighting, or silent reduced-set renormalization.",
        "indices":indices,
        "components":components,
    }
    OUT.write_text(json.dumps(registry,indent=2,sort_keys=True)+"\n")
    print(json.dumps({"status":registry["status"],"modelVersion":registry["modelVersion"],"components":len(components),"indices":list(indices)},indent=2))


if __name__=="__main__":
    main()
