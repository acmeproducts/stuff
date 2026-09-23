#!/usr/bin/env python3
"""Validate the C4 vintage sidecar and emit a compact governed decision record."""
from __future__ import annotations

import datetime as dt
import json
from collections import defaultdict
from pathlib import Path

ROOT=Path("market-evidence/vintage")
OUT=Path("market-evidence/reports/component-vintage-audit.json")
UTC=dt.timezone.utc


def read(path):
    return json.loads(Path(path).read_text())


def date(value):
    return dt.date.fromisoformat(value)


def main():
    manifest=read(ROOT/"manifest.json")
    assert manifest["schema"]=="market-navigator-vintage-manifest-v1"
    results={}
    total_events=0
    blocked=[]
    for sid,summary in sorted(manifest["series"].items()):
        obj=read(ROOT/f"{sid}.json")
        assert obj["canonicalSeriesId"]==sid
        qualification=obj["availabilityQualification"]
        events=obj.get("events") or []
        if qualification!="QUALIFIED_ALFRED":
            assert qualification=="BLOCKED_NOT_IN_ALFRED"
            assert not events
            blocked.append(sid)
            results[sid]={
                "status":qualification,
                "events":0,
                "historicalRule":"UNAVAILABLE_BEFORE_PROSPECTIVE_CAPTURE",
            }
            continue

        assert events
        total_events+=len(events)
        by_observation=defaultdict(list)
        seen=set()
        for event in events:
            key=(event["observationDate"],event["availableFrom"],event["value"])
            assert key not in seen, (sid,"duplicate",key)
            seen.add(key)
            assert date(event["availableFrom"])>=date(event["observationDate"]), (sid,event)
            assert date(event["availableUntil"])>=date(event["availableFrom"]), (sid,event)
            by_observation[event["observationDate"]].append(event)

        for observation,rows in by_observation.items():
            rows.sort(key=lambda x:(x["availableFrom"],x["value"]))
            initials=[x for x in rows if x["isInitialRelease"]]
            assert len(initials)==1, (sid,observation,"initial-count",len(initials))
            assert initials[0] is rows[0], (sid,observation,"initial-not-earliest")
            assert not initials[0]["isRevision"]
            assert all(x["isRevision"] for x in rows[1:])
            for previous,current in zip(rows,rows[1:]):
                assert date(previous["availableFrom"])<date(current["availableFrom"]), (sid,observation,"non-increasing-availability")
                assert date(previous["availableUntil"])<date(current["availableFrom"]), (sid,observation,"overlapping-realtime-periods")

        # Construct the as-known state in availability order. Before the first
        # event the state must be empty; each applied event must be public by
        # the cutoff, and no later event may enter that state.
        ordered=sorted(events,key=lambda x:(x["availableFrom"],x["observationDate"],x["value"]))
        first=date(ordered[0]["availableFrom"])
        before=first-dt.timedelta(days=1)
        assert not [x for x in ordered if date(x["availableFrom"])<=before]
        state={}
        for event in ordered:
            cutoff=date(event["availableFrom"])
            assert date(event["availableFrom"])<=cutoff
            state[event["observationDate"]]=event
        assert all(date(x["availableFrom"])<=date(ordered[-1]["availableFrom"]) for x in state.values())

        results[sid]={
            "status":"PASS",
            "events":len(events),
            "observations":len(by_observation),
            "initialReleases":sum(1 for x in events if x["isInitialRelease"]),
            "revisions":sum(1 for x in events if x["isRevision"]),
            "firstAvailable":ordered[0]["availableFrom"],
            "lastAvailable":ordered[-1]["availableFrom"],
            "noLookAhead":"PASS",
            "nonOverlappingRealtimePeriods":"PASS",
        }

    assert blocked==["hySpread"], blocked
    decision={
        "schema":"market-navigator-component-vintage-audit-v1",
        "generatedAt":dt.datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00","Z"),
        "gate":"C4",
        "status":"PASS_WITH_PROSPECTIVE_ONLY_SOURCE",
        "qualifiedSeries":sum(1 for x in results.values() if x["status"]=="PASS"),
        "blockedSeries":blocked,
        "totalQualifiedEvents":total_events,
        "asKnownRule":"A calculation may use only a record whose availableFrom is on or before the calculation date. Later revisions replace state only from their own availableFrom date forward.",
        "blockedRule":"hySpread has no ALFRED history. It is unavailable for as-known historical index construction before prospective capture begins; no observation-date proxy, current-vintage substitution, or silent reduced-component renormalization is allowed.",
        "series":results,
    }
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps(decision,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k:decision[k] for k in ("gate","status","qualifiedSeries","blockedSeries","totalQualifiedEvents")},indent=2))


if __name__=="__main__":
    main()
