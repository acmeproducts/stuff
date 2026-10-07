"""Audit every persisted Market Navigator JSON; never equate HTTP success with freshness.
Bounded repair uses governed collectors and preserves published persistent history.
"""
from __future__ import annotations
import argparse, collections, datetime as dt, hashlib, importlib.util, json, math, os, shutil, subprocess, sys, tempfile
from pathlib import Path
UTC=dt.timezone.utc
H=("1D","5D","MTD","YTD","1YR","3YR","5YR")
BASE=Path(__file__).resolve().parent

def read(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))
def write(path,obj):
    p=Path(path); p.parent.mkdir(parents=True,exist_ok=True)
    text=json.dumps(obj,ensure_ascii=False,sort_keys=True,indent=None if p.name=="persistent-indices-v1.json" else 2,separators=(",",":") if p.name=="persistent-indices-v1.json" else None,allow_nan=False)+"\n"
    temp=p.with_name(p.name+".tmp");temp.write_text(text,encoding="utf-8");temp.replace(p)
def digest(obj):
    return hashlib.sha256(json.dumps(obj,sort_keys=True,separators=(",",":")).encode()).hexdigest()
def instant(value):
    try:
        x=dt.datetime.fromisoformat(str(value).replace("Z","+00:00"))
        return x.replace(tzinfo=UTC) if not x.tzinfo else x.astimezone(UTC)
    except (TypeError,ValueError):return None
def day(ms):
    return dt.datetime.fromtimestamp(ms/1000,UTC).date()
def quarterly_transform(observations,lag):
    by_quarter={(day(p["t"]).year*4+(day(p["t"]).month-1)//3):p for p in observations}
    out=[]
    for p in observations:
        d=day(p["t"]);prior=by_quarter.get(d.year*4+(d.month-1)//3-lag)
        if prior and prior["v"]:out.append({"t":p["t"],"v":(p["v"]/prior["v"]-1)*100})
    return out
def load_module(name,path):
    spec=importlib.util.spec_from_file_location(name,path); m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
def points_errors(obj,asof):
    a=obj.get("observations") or []; errors=[]; previous=None
    for p in a:
        if not isinstance(p,dict) or not all(isinstance(p.get(k),(int,float)) and not isinstance(p[k],bool) and math.isfinite(p[k]) for k in ("t","v")):
            errors.append("non-finite or malformed observation");continue
        t=p["t"]
        if previous is not None and t<=previous:errors.append("unordered or duplicate timestamp")
        if t>asof.timestamp()*1000:errors.append("future observation")
        previous=t
    if obj.get("count")!=len(a):errors.append("count differs from observations")
    if a and all(isinstance(p,dict) and "t" in p for p in a):
        if obj.get("first")!=a[0]["t"] or obj.get("last")!=a[-1]["t"]:errors.append("first/last differs from observations")
    if obj.get("sourceRevision")!=digest(a):errors.append("source revision mismatch")
    return sorted(set(errors))

def eastern(asof):
    # Current US DST rule (since 2007), without a platform tzdata dependency.
    def sunday(month,n):
        d=dt.date(asof.year,month,1);return d+dt.timedelta(days=(6-d.weekday())%7+7*(n-1))
    begin=dt.datetime.combine(sunday(3,2),dt.time(7),UTC)
    end=dt.datetime.combine(sunday(11,1),dt.time(6),UTC)
    return asof.astimezone(dt.timezone(dt.timedelta(hours=-4 if begin<=asof<end else -5)))
def federal_holidays(year):
    def nth(month,weekday,n):
        d=dt.date(year,month,1);return d+dt.timedelta(days=(weekday-d.weekday())%7+7*(n-1))
    def observed(d):
        return d-dt.timedelta(days=1) if d.weekday()==5 else d+dt.timedelta(days=1) if d.weekday()==6 else d
    days={observed(dt.date(y,m,d)) for y in (year-1,year,year+1) for m,d in ((1,1),(6,19),(7,4),(11,11),(12,25))}
    days.update((nth(1,0,3),nth(2,0,3),nth(9,0,1),nth(10,0,2),nth(11,3,4)))
    last=dt.date(year,6,1)-dt.timedelta(days=1);days.add(last-dt.timedelta(days=last.weekday()))
    return days
def weekly_expected(rule,asof):
    local=eastern(asof);today=local.date();weekday=rule["release_weekday"];holidays=federal_holidays(today.year)
    scheduled=today-dt.timedelta(days=(today.weekday()-weekday)%7)
    for _ in range(3):
        release=scheduled
        if weekday==2 and any(release-dt.timedelta(days=n) in holidays for n in (0,1,2)):release+=dt.timedelta(days=1)
        while release.weekday()>4 or release in holidays:release+=dt.timedelta(days=1)
        due=dt.datetime.combine(release,dt.time(rule.get("release_hour",8),rule.get("release_minute",30)),local.tzinfo)+dt.timedelta(hours=rule.get("ingestion_grace_hours",24))
        if local>=due:return scheduled-dt.timedelta(days=rule["reference_days_before_release"])
        scheduled-=dt.timedelta(days=7)
    raise ValueError("Cannot resolve governed weekly publication window")

def freshness(meta,obj,catalog,rules,asof):
    today=eastern(asof).date();a=obj.get("observations") or []
    if not a:return "missing",None,"No canonical observations."
    try:actual=day(a[-1]["t"])
    except Exception:return "failed",None,"Invalid last observation."
    cadence=meta.get("native_cadence","unknown"); rule=(rules.get("rules") or {}).get(meta["id"],{})
    expected=None
    if cadence=="weekly" and "release_weekday" in rule:
        expected=weekly_expected(rule,asof)
    elif cadence=="monthly":
        release=int(rule.get("available_by_day_of_month") or catalog.get("publication_schedule",{}).get("series_overrides",{}).get(meta["id"],{}).get("expected_day_of_month") or 31)
        release=min(release,(__import__("calendar").monthrange(today.year,today.month)[1]))
        n=1 if today.day>=release else 2
        month=today.year*12+today.month-1-n;expected=dt.date(month//12,month%12+1,1)
    elif cadence=="quarterly":
        q=(today.month-1)//3; n=2 if today.month in (1,4,7,10) and today.day<30 else 1
        quarter=today.year*4+q-n;expected=dt.date(quarter//4,(quarter%4)*3+1,1)
    if expected:
        stale=actual<expected; explanation=f"Native reference period {actual}; conservative publication rule expects {expected}."
    else:
        allowance=int(rule.get("max_expected_age_days") or catalog.get("publication_schedule",{}).get("cadence_rules",{}).get(cadence,{}).get("current_max_age_days") or (5 if cadence=="daily-nav" else 7))
        stale=(today-actual).days>allowance;explanation=f"Native observation {actual}; wall-clock age {(today-actual).days} days; {cadence} allowance {allowance} days."
        if cadence not in ("daily","trading-day","daily-nav","weekly"):return "unknown",None,"No governed publication rule for "+cadence
    collection=instant(obj.get("last_successful"));attempt=instant(obj.get("last_attempted"))
    if collection and collection>asof or attempt and attempt>asof:return "failed",str(expected) if expected else None,"Collection timestamp is in the future."
    if stale:return "failed" if obj.get("last_error") else "stale",str(expected) if expected else None,explanation
    # Detect stopped collection even if the observation is legitimately monthly/quarterly.
    if not collection or asof-collection>dt.timedelta(hours=48):
        return "stale",str(expected) if expected else None,explanation+" Daily collection heartbeat exceeds 48 hours."
    if obj.get("last_error"):return "degraded",str(expected) if expected else None,explanation+" Latest collection failed; retained observations are within policy."
    return "current",str(expected) if expected else None,explanation

def freshness_deadline(meta,obj,catalog,rules,asof):
    """First policy expiry, including future release boundaries, for consumer admission."""
    if freshness(meta,obj,catalog,rules,asof)[0] not in ("current","degraded"):return asof.isoformat().replace("+00:00","Z")
    collection=instant(obj.get("last_successful")); limit=collection+dt.timedelta(hours=48)
    # Publication expectations are monotone over this heartbeat interval. Resolve the
    # exact next admission boundary using the same policy rather than a second calendar.
    if freshness(meta,obj,catalog,rules,limit)[0] in ("current","degraded"):deadline=limit
    else:
        low,high=asof,limit
        for _ in range(24):
            mid=low+(high-low)/2
            if freshness(meta,obj,catalog,rules,mid)[0] in ("current","degraded"):low=mid
            else:high=mid
        deadline=high
    return deadline.isoformat().replace("+00:00","Z")

def audit(root,asof):
    root=Path(root);cat=read(root/"data/market-backend/data-catalog.json");rules=read(root/"data/market-backend/publication-rules.json")
    registry=read(root/"data/market-backend/component-registry-v1.json")
    manifest=read(root/"market-evidence/operational-manifest.json");health=read(root/"market-evidence/health-envelope.json")
    metas={x["id"]:x for x in cat["series"]}; rows={}; findings=[]; files={}
    def issue(path,code,message,blocking=True):findings.append(dict(path=str(path),code=code,message=message,blocking=blocking))
    for key,idef in registry.get("indices",{}).items():
        if len(idef.get("components",[]))!=7 or len(set(idef.get("components",[])))!=7 or not math.isclose(idef.get("coefficient",0),1/7,abs_tol=1e-15):issue("data/market-backend/component-registry-v1.json","governance","Seven fixed equal components required: "+key)
    for component in registry.get("components",[]):
        if component.get("direction") not in (-1,1) or component.get("transformFamily") not in ("log_return","signed_price_change","rate_change","signed_level_change") or not component.get("scale",{}).get("frozenForModelVersion") or not math.isfinite(component.get("scale",{}).get("annualizedScale",float("nan"))) or component.get("scale",{}).get("annualizedScale",0)<=0 or not math.isclose(component.get("coefficient",0),1/7,abs_tol=1e-15):issue("data/market-backend/component-registry-v1.json","governance","Invalid governed scale/direction/transform/coefficient: "+component.get("id","?"))
    def inventory(path,obj):
        rel=path.relative_to(root).as_posix();schema=obj.get("schema") if isinstance(obj,dict) else None
        # These failed/retired products are audited but never reactivated or presented as live.
        research=rel.startswith("market-evidence/trend-") or "/trend-" in rel or rel.endswith(("trend-v1.json","trend-v2-research.json","trend-model-v1.json"))
        legacy=rel.startswith("data/market-backend/sources/") or rel.endswith(("market-cache.json","macro-cache.json","news-cache.json","market-manifest.json","source-health.json","current-state-v1.json"))
        role="research-only" if research else "legacy-retained" if legacy else "canonical" if "/series/" in rel or "/reports/" in rel else "governance" if rel.startswith("data/") else "derived"
        generated=obj.get("generatedAt") or obj.get("updatedAt") or obj.get("lastSuccess") if isinstance(obj,dict) else None
        age=(asof-instant(generated)).total_seconds()/3600 if instant(generated) else None
        files[rel]=dict(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size,schema=schema,role=role,generatedAt=generated,ageHours=round(age,2) if age is not None else None,status="reviewed")
        counts={"pointVectors":0,"points":0,"invalidPoints":0,"unorderedVectors":0,"futurePoints":0}
        def walk(value):
            if isinstance(value,dict):
                for child in value.values():walk(child)
            elif isinstance(value,list):
                if value and all(isinstance(p,dict) and "t" in p and "v" in p for p in value):
                    counts["pointVectors"]+=1;counts["points"]+=len(value);last=None
                    for p in value:
                        if not all(isinstance(p[k],(float,int)) and not isinstance(p[k],bool) and math.isfinite(p[k]) for k in ("t","v")):counts["invalidPoints"]+=1;continue
                        if last is not None and p["t"]<=last:counts["unorderedVectors"]+=1
                        if p["t"]>asof.timestamp()*1000:counts["futurePoints"]+=1
                        last=p["t"]
                else:
                    for child in value:walk(child)
        walk(obj);files[rel]["pointChecks"]=counts
        if any(counts[k] for k in ("invalidPoints","unorderedVectors","futurePoints")):issue(rel,"point-vector-integrity",str(counts),not legacy and not research)
        if rel.endswith("market-manifest.json"):
            mismatches=[]
            for entry in obj.get("files",{}).values():
                target=root/entry.get("path","")
                if not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest()!=entry.get("sha256"):mismatches.append(entry.get("path"))
            files[rel]["manifestMismatches"]=mismatches
            if mismatches:issue(rel,"legacy-manifest-lineage",str(mismatches),False)
        if age is not None and age<0:issue(rel,"future-artifact","Artifact timestamp is ahead of audit time",not legacy and not research)
        if legacy and (age is None or age>48):
            files[rel]["status"]="stale-retained"
            issue(rel,"legacy-stale","Retained legacy artifact is not current; recovery candidate must not use it as a live source.",False)
        if research:files[rel]["status"]="research-only"
        # News dates are examined even though this legacy cache is not used by recovery.
        if "/sources/news/" in rel or rel.endswith("news-cache.json"):
            records=obj.get("records") or obj.get("data") or []
            if isinstance(records,list):
                missing=sum(1 for x in records if not instant(x.get("publishedAt")))
                future=sum(1 for x in records if instant(x.get("publishedAt")) and instant(x["publishedAt"])>asof)
                files[rel]["newsDates"]=dict(records=len(records),undated=missing,future=future)
                if missing or future:issue(rel,"unqualified-news-date",f"{missing} undated, {future} future stories; cannot support dated market claims.",False)
    for folder in ("market-evidence","data/market-backend"):
        for path in sorted((root/folder).rglob("*.json")):
            if path.name in ("corpus-health.json","corpus-repair.json"):continue
            try:inventory(path,read(path))
            except Exception as e:issue(path.relative_to(root),"invalid-json",str(e))
    for sid,meta in metas.items():
        rel=f"market-evidence/series/{sid}.json"; path=root/rel
        if not meta.get("enabled",True):
            rows[sid]=dict(status="disabled",required=False,reason="Explicitly disabled by governed catalog; no repair/admission.",latest=None)
            continue
        try:
            obj=read(path);errors=points_errors(obj,asof)
            if obj.get("id")!=sid:errors.append("canonical identity mismatch")
            if obj.get("schema")!="market-navigator-evidence-series-v1":errors.append("canonical schema mismatch")
            if obj.get("unit")!=meta.get("native_unit") or obj.get("cadence")!=meta.get("native_cadence"):errors.append("native unit/cadence mismatch")
            if meta.get("transform_source_id"):
                parent=read(root/f'market-evidence/series/{meta["transform_source_id"]}.json')
                lag=1 if meta.get("transform")=="qoq_percent_change" else 4 if meta.get("transform")=="yoy_percent_change" else None
                transformed=quarterly_transform(parent["observations"],lag) if lag else []
                actual_points=obj.get("observations") or []
                if len(transformed)!=len(actual_points) or any(x["t"]!=y["t"] or not math.isclose(x["v"],y["v"],rel_tol=0,abs_tol=1e-10) for x,y in zip(transformed,actual_points)):
                    errors.append("governed transformation differs from native parent")
                if obj.get("transformSourceRevision")!=parent.get("sourceRevision"):errors.append("transform parent revision mismatch")
            chain=meta.get("provider_chain") or [{"provider":meta.get("provider"),"identifier":meta.get("provider_identifier")}]
            if not any(x.get("provider")==obj.get("provider") and x.get("identifier")==obj.get("providerIdentifier") for x in chain):errors.append("provider lineage outside governed chain")
            status,expected,reason=freshness(meta,obj,cat,rules,asof)
            native_status=status
            st=manifest.get("series",{}).get(sid,{})
            for key,field in (("source_revision","sourceRevision"),("latest_observation","last"),("observation_count","count"),("last_successful","last_successful")):
                if st.get(key)!=obj.get(field):errors.append("manifest "+key+" differs from canonical series")
            hh=health.get("series",{}).get(sid,{})
            latest=str(day(obj["observations"][-1]["t"])) if obj.get("observations") and not points_errors(obj,asof) else None
            if hh.get("actualLatestCanonicalObservation")!=latest:errors.append("health latest date differs from canonical series")
            if status not in ("current","degraded") and hh.get("classification")=="current":errors.append("Health falsely claims current")
            report_path=root/f"market-evidence/reports/{sid}.json"
            report=read(report_path)
            if report.get("computedRevision")!=digest(report.get("reports",{})) or st.get("computed_revision")!=report.get("computedRevision"):errors.append("computed report revision mismatch")
            pipeline=load_module("mn_corpus_r7",root/"market-navigator-r7-data-pipeline.py")
            for h in H:
                got=report.get("reports",{}).get(h,{})
                expected_report=pipeline.report(obj.get("observations") or [],h) if h in meta.get("supported_horizons",H) else {"ready":False,"reason":"unsupported horizon for canonical evidence cadence"}
                if any(got.get(k)!=v for k,v in expected_report.items()) or got.get("source_revision")!=obj.get("sourceRevision"):errors.append("report differs from canonical "+h)
                if st.get("horizon_readiness",{}).get(h)!=bool(got.get("ready")):errors.append("manifest horizon readiness mismatch "+h)
            if errors:status="failed"
            rows[sid]=dict(status=status,required=bool(meta.get("required")),latest=latest,expected=expected,cadence=meta.get("native_cadence"),lastSuccessful=obj.get("last_successful"),validUntil=freshness_deadline(meta,obj,cat,rules,asof),sourceRevision=obj.get("sourceRevision"),reason=reason,errors=sorted(set(errors)))
            for error in sorted(set(errors)):issue(rel,"integrity",error)
            if native_status not in ("current","degraded"):issue(rel,"freshness",reason, bool(meta.get("required")))
        except Exception as e:
            rows[sid]=dict(status="failed",required=bool(meta.get("required")),latest=None,reason=str(e),errors=[str(e)])
            issue(rel,"missing-or-invalid",str(e))
    for sid in set(manifest.get("series",{}))-set(metas):issue("market-evidence/operational-manifest.json","orphan-series",sid)
    for path in (root/"market-evidence/series").glob("*.json"):
        if path.stem not in metas:issue(path.relative_to(root),"unregistered-series",path.stem)
    registrations=read(root/"data/market-backend/source-registry.json").get("registrations",[])
    for rec in registrations:
        sid=rec["id"];row=rows.get(sid,{})
        if sid not in metas or not metas[sid].get("custom_source"):issue("data/market-backend/source-registry.json","registration-identity",sid)
        if rec.get("status")=="active" and row.get("status") not in ("current",):issue("data/market-backend/source-registry.json","false-active",sid)
        if row.get("sourceRevision") and rec.get("lastSuccessfulCollection")!=row.get("lastSuccessful"):issue("data/market-backend/source-registry.json","registration-collection",sid)
    model={};persistent_path=root/"market-evidence/persistent-indices-v1.json"
    try:
        p=read(persistent_path);compat=read(root/"market-evidence/derived-indices-persistent-v1.json")
        if p.get("modelVersion")!=registry["modelVersion"] or compat.get("definitionVersion")!=registry["modelVersion"]:issue(persistent_path.relative_to(root),"model-version","Registry/model mismatch")
        if p.get("anchorDate")!="2016-09-01" or p.get("anchorValue")!=100:issue(persistent_path.relative_to(root),"anchor-governance","Persistent v1 fixed anchor changed")
        revision=hashlib.sha256(persistent_path.read_bytes()+(root/"data/market-backend/component-registry-v1.json").read_bytes()).hexdigest()[:16]
        if compat.get("revision")!=revision:issue("market-evidence/derived-indices-persistent-v1.json","derived-lineage","Compatibility revision does not match persistent artifact and registry")
        for key,idef in registry["indices"].items():
            z=p["indices"][key]; dates=z["dates"]; n=len(dates); errors=[]
            if not dates or dates!=sorted(set(dates)) or dates[-1]>str(asof.date()):errors.append("invalid calculation dates")
            if not dates or dates[0]!=p.get("anchorDate") or not math.isclose(z["values"][0],100,abs_tol=1e-12):errors.append("fixed anchor mismatch")
            if z.get("components")!=idef["components"]:errors.append("component order/model mismatch")
            if len(z["values"])!=n or len(z["timestamps"])!=n:errors.append("curve length mismatch")
            for i,date in enumerate(dates):
                if z["timestamps"][i]!=int(dt.datetime.combine(dt.date.fromisoformat(date),dt.time(),UTC).timestamp()*1000):errors.append("curve timestamp mismatch");break
                signals=[]
                for sid in idef["components"]:
                    for field in ("componentSignals","componentValues","componentObservationDates"):
                        if len(z[field][sid])!=n:errors.append("component vector mismatch");break
                    value=z["componentSignals"][sid][i]
                    if not math.isfinite(value) or not math.isfinite(z["componentValues"][sid][i]):errors.append("nonfinite component")
                    if z["componentObservationDates"][sid][i]>date:errors.append("look-ahead source date")
                    signals.append(value)
                    rule=next(c for c in registry["components"] if c["id"]==sid)
                    anchor=z["componentValues"][sid][0];native=z["componentValues"][sid][i]
                    movement=math.log(native/anchor) if rule["transformFamily"]=="log_return" and native>0 and anchor>0 else native-anchor if rule["transformFamily"]!="log_return" else None
                    if movement is None or not math.isclose(value,rule["direction"]*movement/rule["scale"]["annualizedScale"],rel_tol=0,abs_tol=1e-10):errors.append("governed component signal mismatch")
                if not math.isclose(z["values"][i],100+sum(signals)/7,abs_tol=1e-10):errors.append("fixed formula mismatch");break
            healthy=all(rows.get(sid,{}).get("status") in ("current","degraded") for sid in idef["components"])
            capture_dates=[str(instant(rows[sid]["lastSuccessful"]).date()) for sid in idef["components"] if instant(rows.get(sid,{}).get("lastSuccessful"))]
            target=max(capture_dates) if capture_dates else None
            stale=bool(target and dates[-1]<target)
            for sid in idef["components"]:
                native=read(root/f"market-evidence/series/{sid}.json")
                if target and dates[-1]<=target and native.get("observations") and (native["observations"][-1]["v"]!=z["componentValues"][sid][-1] or str(day(native["observations"][-1]["t"]))!=z["componentObservationDates"][sid][-1]):stale=True
            current=dict(status="failed" if errors else "stale" if stale or not healthy else "current",calculationDate=dates[-1],latestCapturedSourceDate=target,errors=sorted(set(errors)),uncapturedGaps=[{"from":x["previousCalculationDate"],"to":x["calculationDate"]} for x in z.get("prospectiveCaptures",[]) if x.get("uncapturedGap")],sourceDates={sid:z["componentObservationDates"][sid][-1] for sid in idef["components"]})
            model[key]=current
            current["validUntil"]=min((rows[sid].get("validUntil",asof.isoformat().replace("+00:00","Z")) for sid in idef["components"]),key=instant)
            if errors:issue(persistent_path.relative_to(root),"derived-integrity",key+": "+", ".join(sorted(set(errors))))
            if stale:issue(persistent_path.relative_to(root),"derived-stale",f"{key} ends {dates[-1]} or has unincorporated revisions; collected component evidence reaches {target}.")
            for h in H:
                ch=compat["indices"][key]["horizons"][h]; curve=ch.get("curve") or []
                if not curve or ch["commonNow"]!=compat["commonMarketAnchor"] or curve[-1]["v"]!=z["values"][dates.index(ch["commonNow"])]:issue("market-evidence/derived-indices-persistent-v1.json","derived-window",key+" "+h)
        if compat.get("commonMarketAnchor")!=min(z["dates"][-1] for z in p["indices"].values()):issue("market-evidence/derived-indices-persistent-v1.json","derived-anchor","Anchor differs from persistent index coverage")
    except Exception as e:issue("market-evidence/persistent-indices-v1.json","derived-invalid",str(e))
    counts=dict(collections.Counter(x["status"] for x in rows.values()));blocking=[x for x in findings if x["blocking"]]
    return dict(schema="market-navigator-corpus-health-v1",generatedAt=asof.isoformat().replace("+00:00","Z"),publicationPolicy="Conservative native-cadence publication rules, UTC wall-clock age, and 48-hour collection heartbeat; no observation filling or synthetic current dates.",summary=dict(files=len(files),series=len(rows),indices=len(model),statuses=counts,blockingFindings=len(blocking),ready=not blocking),series=rows,indices=model,files=files,findings=findings)

def extend_persistent(root,asof):
    """Append captured current states. Never rebuild/alter the preexisting canonical curve."""
    root=Path(root);reg=read(root/"data/market-backend/component-registry-v1.json");p=read(root/"market-evidence/persistent-indices-v1.json")
    report=audit(root,asof);meta={x["id"]:x for x in reg["components"]};changes={}
    for key,idef in reg["indices"].items():
        if any(report["series"][sid]["status"] not in ("current","degraded") for sid in idef["components"]):raise RuntimeError("Cannot advance "+key+": unqualified component evidence")
        z=p["indices"][key];old=digest(z);sources={sid:read(root/f"market-evidence/series/{sid}.json") for sid in idef["components"]}
        captured=max(instant(o["last_successful"]) for o in sources.values());date=str(captured.date())
        revisions={sid:o["sourceRevision"] for sid,o in sources.items()}
        if date<=z["dates"][-1]:
            # Same-day revisions do not silently restate an already captured/published row.
            if date==z["dates"][-1] and any(sources[sid]["observations"][-1]["v"]!=z["componentValues"][sid][-1] for sid in sources):
                raise RuntimeError("Same-day persistent revision requires an explicit later capture date/model restatement: "+key)
            continue
        vals={sid:float(o["observations"][-1]["v"]) for sid,o in sources.items()};signals={}
        for sid,value in vals.items():
            rule=meta[sid];anchor=z["componentValues"][sid][0]
            movement=math.log(value/anchor) if rule["transformFamily"]=="log_return" and value>0 and anchor>0 else value-anchor if rule["transformFamily"]!="log_return" else None
            if movement is None:raise RuntimeError("Invalid governed logarithmic input: "+sid)
            signals[sid]=rule["direction"]*movement/rule["scale"]["annualizedScale"]
        prior=z["dates"][-1];z["dates"].append(date);z["timestamps"].append(int(dt.datetime.combine(captured.date(),dt.time(),UTC).timestamp()*1000));z["values"].append(100+sum(signals.values())/7)
        for sid in vals:
            z["componentSignals"][sid].append(signals[sid]);z["componentValues"][sid].append(vals[sid]);z["componentObservationDates"][sid].append(str(day(sources[sid]["observations"][-1]["t"])))
        z.setdefault("prospectiveCaptures",[]).append(dict(calculationDate=date,capturedAt=captured.isoformat().replace("+00:00","Z"),sourceRevisions=revisions,previousCalculationDate=prior,uncapturedGap=bool((captured.date()-dt.date.fromisoformat(prior)).days>1),rule="Current native values first known through these successful canonical collections; no reconstructed values in an uncaptured gap."))
        changes[key]=dict(previousDigest=old,appendedDate=date,previousDate=prior)
    if changes:
        p["generatedAt"]=asof.isoformat().replace("+00:00","Z")
        p["captureRule"]="Append-only prospective canonical captures; historical published vectors are immutable; observation dates remain native."
        write(root/"market-evidence/persistent-indices-v1.json",p)
    return changes

def rebuild_reports(root):
    pipeline=load_module("mn_repair_r7",Path(root)/"market-navigator-r7-data-pipeline.py")
    cat=read(Path(root)/"data/market-backend/data-catalog.json")
    man=read(Path(root)/"market-evidence/operational-manifest.json")
    for meta in cat["series"]:
        if not meta.get("enabled",True):continue
        obj=read(Path(root)/f'market-evidence/series/{meta["id"]}.json');rr={}
        for h in H:
            r=pipeline.report(obj["observations"],h) if h in meta.get("supported_horizons",H) else {"ready":False,"reason":"unsupported horizon for canonical evidence cadence"}
            r.update(source_revision=obj["sourceRevision"],source=obj["provider"],series_id=meta["id"],horizon=h);rr[h]=r
        target=Path(root)/f'market-evidence/reports/{meta["id"]}.json';old=read(target) if target.exists() else {}
        revision=digest(rr)
        if old.get("reports")!=rr or old.get("computedRevision")!=revision:write(target,dict(schema="market-navigator-evidence-report-v1",pipelineVersion=pipeline.VERSION,id=meta["id"],generatedAt=dt.datetime.now(UTC).isoformat().replace("+00:00","Z"),reports=rr,computedRevision=revision))
        man["series"][meta["id"]]["computed_revision"]=revision
        man["series"][meta["id"]]["horizon_readiness"]={h:bool(rr[h].get("ready")) for h in H}
    man["revision"]=digest({k:v for k,v in man.items() if k!="revision"})[:16]
    write(Path(root)/"market-evidence/operational-manifest.json",man)

def rebuild_transforms(root):
    cat=read(root/"data/market-backend/data-catalog.json");man=read(root/"market-evidence/operational-manifest.json")
    pipeline=load_module("mn_transform_reports",root/"market-navigator-r7-data-pipeline.py")
    for meta in cat["series"]:
        if not meta.get("enabled",True) or not meta.get("transform_source_id"):continue
        parent=read(root/f'market-evidence/series/{meta["transform_source_id"]}.json')
        if points_errors(parent,dt.datetime.now(UTC)) or parent.get("last_error"):raise RuntimeError("Unqualified transformation parent: "+meta["id"])
        lag=1 if meta["transform"]=="qoq_percent_change" else 4 if meta["transform"]=="yoy_percent_change" else None
        if not lag:raise RuntimeError("Unsupported transformation: "+meta["transform"])
        a=quarterly_transform(parent["observations"],lag)
        obj={**parent,"id":meta["id"],"description":meta.get("description"),"unit":meta["native_unit"],"cadence":meta["native_cadence"],"transform":meta["transform"],"transformSourceId":meta["transform_source_id"],"transformSourceRevision":parent["sourceRevision"],"sourceRevision":digest(a),"first":a[0]["t"] if a else None,"last":a[-1]["t"] if a else None,"count":len(a),"observations":a}
        write(root/f'market-evidence/series/{meta["id"]}.json',obj)
        st=man["series"][meta["id"]]
        st.update(source_revision=obj["sourceRevision"],first_observation=obj["first"],latest_observation=obj["last"],observation_count=len(a),last_attempted=obj["last_attempted"],last_successful=obj["last_successful"],last_error=obj.get("last_error"),horizon_readiness={h:pipeline.report(a,h).get("ready",False) for h in H})
    man["revision"]=digest({k:v for k,v in man.items() if k!="revision"})[:16];write(root/"market-evidence/operational-manifest.json",man)

def _repair_staged(root,asof,collect=False):
    root=Path(root).resolve();before=audit(root,asof);actions=[];errors=[]
    def run(script,args=(),env=None):
        completed=subprocess.run([sys.executable,str(root/script),*args],cwd=root,env=env,capture_output=True,text=True)
        if completed.returncode:raise RuntimeError(script+" failed: "+(completed.stderr or completed.stdout)[-1500:])
    if collect:
        ids=[sid for sid,row in before["series"].items() if row["status"] in ("stale","missing","failed")]
        # One targeted retry pass, same governed provider chain; no endless requests or identity substitutions.
        if ids:
            replace_ids={Path(x["path"]).stem for x in before["findings"] if x["code"] in ("integrity","point-vector-integrity") and "/series/" in x["path"] and x["message"] not in ("Health falsely claims current",) and not x["message"].startswith(("manifest ","report ","health "))}
            env={**os.environ,"MARKET_NAVIGATOR_SERIES_IDS":",".join(ids),"MARKET_NAVIGATOR_REPLACE_SERIES_IDS":",".join(sorted(replace_ids)),"MARKET_NAVIGATOR_BOOTSTRAP":"false"}
            run("market-navigator-r7-data-pipeline.py",env=env);actions.append(dict(action="targeted-collection",ids=ids,maximumPasses=1))
    # Do not repair corrupt observations by deleting/normalizing them. They require source recollection.
    canonical_errors=[x for x in audit(root,asof)["findings"] if x["code"]=="integrity" and "/series/" in x["path"] and x["message"] in ("non-finite or malformed observation","unordered or duplicate timestamp","future observation","provider lineage outside governed chain","canonical identity mismatch")]
    if canonical_errors:errors.append("Canonical integrity prevents derived rebuild")
    else:
        try:
            rebuild_transforms(root);rebuild_reports(root);run("market-navigator-r7-health.py")
            for rec in read(root/"data/market-backend/source-registry.json").get("registrations",[]):run("market-navigator-source-state.py",("--query",rec["query"]))
            actions.append(dict(action="reconcile-reports-health-registration"))
            changes=extend_persistent(root,asof);actions.append(dict(action="append-persistent-captures",changes=changes))
            run("market-navigator-build-persistent-compat.py");run("market-navigator-persistent-index-qa.py")
        except Exception as e:errors.append(str(e))
    completed=dt.datetime.now(UTC)
    after=audit(root,completed);write(root/"market-evidence/corpus-health.json",after)
    result=dict(schema="market-navigator-corpus-repair-v1",generatedAt=completed.isoformat().replace("+00:00","Z"),before=before["summary"],after=after["summary"],actions=actions,errors=errors,rule="One targeted collection pass; bounded rebuild; no fabricated observations, reduced-set weights, relabelled old curves, research-model promotion or historical Library rewrite.")
    write(root/"market-evidence/corpus-repair.json",result);return after,result

def repair(root,asof,collect=False):
    """Repair in isolation; a failed attempt publishes status only and retains last good payloads."""
    root=Path(root).resolve()
    with tempfile.TemporaryDirectory(prefix="mn-corpus-repair-") as temp:
        staged=Path(temp)
        for folder in ("market-evidence","data/market-backend"):
            shutil.copytree(root/folder,staged/folder)
        for name in ("market-navigator-corpus.py","market-navigator-r7-data-pipeline.py","market-navigator-r7-health.py","market-navigator-source-state.py","market-navigator-build-persistent-compat.py","market-navigator-persistent-index-qa.py"):
            shutil.copy2(root/name,staged/name)
        try:report,result=_repair_staged(staged,asof,collect)
        except Exception as e:
            report=audit(root,dt.datetime.now(UTC))
            report["summary"]["ready"]=False
            report["findings"].append(dict(path="market-evidence/corpus-repair.json",code="repair-failed",message=str(e),blocking=True))
            result=dict(schema="market-navigator-corpus-repair-v1",generatedAt=report["generatedAt"],errors=[str(e)],actions=[])
        ready=report["summary"]["ready"] and not result.get("errors")
        report["publicationStatus"]="qualified" if ready else "held"
        if ready:
            # Only JSON inside the owned data roots can be promoted. Research/legacy bytes remain unchanged.
            for folder in ("market-evidence","data/market-backend"):
                for src in (staged/folder).rglob("*.json"):
                    if src.name in ("corpus-health.json","corpus-repair.json"):continue
                    dst=root/src.relative_to(staged)
                    if not dst.exists() or src.read_bytes()!=dst.read_bytes():
                        dst.parent.mkdir(parents=True,exist_ok=True)
                        tmp=dst.with_name(dst.name+".tmp");shutil.copy2(src,tmp);tmp.replace(dst)
        else:
            report["retainedPayload"]=audit(root,dt.datetime.now(UTC))["summary"]
            report["summary"]["ready"]=False
        write(root/"market-evidence/corpus-health.json",report)
        write(root/"market-evidence/corpus-repair.json",result)
        return report,result

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--root",default=".");ap.add_argument("--as-of");ap.add_argument("--repair",action="store_true");ap.add_argument("--collect",action="store_true");ap.add_argument("--output");ap.add_argument("--strict",action="store_true")
    args=ap.parse_args();asof=instant(args.as_of) if args.as_of else dt.datetime.now(UTC)
    if not asof:raise SystemExit("Invalid as-of timestamp")
    report,result=repair(args.root,asof,args.collect) if args.repair else (audit(args.root,asof),None)
    if args.output:write(args.output,report)
    print(json.dumps(dict(summary=report["summary"],repair=result),indent=2))
    if args.strict and not report["summary"]["ready"]:raise SystemExit(1)
if __name__=="__main__":main()
