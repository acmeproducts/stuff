#!/usr/bin/env python3
"""WorldMood v1.2 collector.
Fetches GDELT GKG GeoJSON server-side and writes same-origin cache for globe.html.
"""
from __future__ import annotations
import datetime as dt, json, os, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path
from typing import Any
VERSION="1.2.0"
BASE=os.environ.get("WORLDMOOD_GDELT_GKG_URL","https://api.gdeltproject.org/api/v1/gkg_geojson")
OUTPUT=Path(os.environ.get("WORLDMOOD_OUTPUT","worldmood-data.json"))
WINDOWS=[60,180,360,720,1440]
MAXROWS=int(os.environ.get("WORLDMOOD_MAXROWS","5000")); TIMEOUT=int(os.environ.get("WORLDMOOD_TIMEOUT","45"))
USER_AGENT="WorldMoodCollector/1.2 (+https://github.com/acmeproducts/stuff)"
def utc_now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
def num(v,d=0.0):
    try:
        n=float(v); return n if n==n else d
    except Exception: return d
def region(lat,lon):
    if lat<-60:return "Antarctica"
    if -170<=lon<-30 and lat>=7:return "North America"
    if -95<=lon<-30 and lat<15:return "South America"
    if -20<=lon<55 and lat>=35:return "Europe"
    if -25<=lon<60 and -40<lat<35:return "Africa"
    if (lon>=110 or lon<-170) and lat<-10:return "Oceania"
    return "Asia"
def place(name,p,lat,lon):
    raw=str(name or p.get("name") or p.get("location") or "Unknown place").strip(); parts=[x.strip() for x in raw.split(",") if x.strip()]
    return {"region":region(lat,lon),"country":str(p.get("country") or p.get("countryname") or p.get("country_name") or (parts[-1] if parts else "Unknown")),"admin1":str(p.get("adm1") or p.get("admin1") or p.get("state") or p.get("province") or (parts[-2] if len(parts)>=3 else "Other")),"city":str(parts[0] if parts else raw)}
def fetch_json(url):
    t=time.monotonic(); req=urllib.request.Request(url,headers={"User-Agent":USER_AGENT,"Accept":"application/json"}); status={"ok":False,"http_status":None,"latency_ms":None,"error":None}
    try:
        with urllib.request.urlopen(req,timeout=TIMEOUT) as r:
            body=r.read(); status.update(ok=True,http_status=getattr(r,"status",200),latency_ms=round((time.monotonic()-t)*1000)); return json.loads(body.decode("utf-8",errors="replace")),status
    except urllib.error.HTTPError as e:
        status.update(http_status=e.code,latency_ms=round((time.monotonic()-t)*1000),error=f"HTTP {e.code}: {e.reason}"); raise
    except Exception as e:
        status.update(latency_ms=round((time.monotonic()-t)*1000),error=f"{type(e).__name__}: {e}"); raise
def normalize(f):
    g=f.get("geometry") or {}; c=g.get("coordinates")
    if g.get("type")!="Point" or not isinstance(c,list) or len(c)<2:return None
    lon,lat=num(c[0],999),num(c[1],999)
    if not(-90<=lat<=90 and -180<=lon<=180):return None
    p=f.get("properties") or {}; q=place(str(p.get("name") or ""),p,lat,lon); tone=num(p.get("tone",p.get("avgtone",p.get("avgTone",0)))); url=str(p.get("url") or p.get("articleurl") or "")
    return {"name":str(p.get("name") or q["city"]),"lat":round(lat,5),"lon":round(lon,5),"tone":round(tone,4),**q,"count":max(1,int(round(num(p.get("count",p.get("nummentions",p.get("mentions",1))),1)))),"url":url,"domain":str(p.get("domain") or ""),"title":str(p.get("title") or p.get("name") or q["city"])}
def compact(records,limit=6):
    groups={}
    for d in records:
        k=(d["region"],d["country"],d["admin1"],d["city"],round(d["lat"],1),round(d["lon"],1)); g=groups.get(k)
        if g is None:
            g={"name":d["name"],"lat":d["lat"],"lon":d["lon"],"region":d["region"],"country":d["country"],"admin1":d["admin1"],"city":d["city"],"count":0,"tone_sum":0.0,"weight":0,"articles":[]}; groups[k]=g
        w=max(1,int(d.get("count",1))); g["count"]+=w; g["tone_sum"]+=float(d.get("tone",0))*w; g["weight"]+=w
        if len(g["articles"])<limit and (d.get("url") or d.get("title")):
            a={"title":d.get("title") or d["name"],"url":d.get("url") or "","domain":d.get("domain") or "","tone":d.get("tone",0)}
            if a not in g["articles"]:g["articles"].append(a)
    out=[]
    for g in groups.values():
        w=g.pop("weight"); s=g.pop("tone_sum"); g["tone"]=round(s/w if w else 0,4); out.append(g)
    return sorted(out,key=lambda x:x["count"],reverse=True)
def url(minutes): return BASE+"?"+urllib.parse.urlencode({"QUERY":"","OUTPUTFIELDS":"name,geores,url,domain,lang,tone","MAXROWS":str(MAXROWS),"TIMESPAN":str(minutes)})
def previous():
    try:return json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else None
    except Exception:return None
def main():
    old=previous(); windows={}; statuses={}; successes=0
    for minutes in WINDOWS:
        s={"source":"GDELT GKG GeoJSON 1.0","endpoint":BASE,"window_minutes":minutes,"ok":False,"http_status":None,"latency_ms":None,"raw_records":0,"mapped_records":0,"clustered_places":0,"error":None}
        try:
            payload,http=fetch_json(url(minutes)); s.update(http); features=payload.get("features") if isinstance(payload,dict) else None
            if not isinstance(features,list):raise ValueError("GDELT response did not contain a features array")
            s["raw_records"]=len(features); mapped=[x for x in (normalize(f) for f in features) if x]; s["mapped_records"]=len(mapped); clustered=compact(mapped); s["clustered_places"]=len(clustered)
            if not clustered:raise ValueError("No mappable point records returned")
            windows[str(minutes)]=clustered; s["ok"]=True; successes+=1
        except Exception as e:
            s["error"]=s.get("error") or f"{type(e).__name__}: {e}"
            if old and isinstance(old.get("windows",{}).get(str(minutes)),list):windows[str(minutes)]=old["windows"][str(minutes)]; s["using_previous_cache"]=True
            else:windows[str(minutes)]=[]
        statuses[str(minutes)]=s; print(json.dumps(s,ensure_ascii=False),flush=True)
    payload={"schema":"worldmood-cache-v1","app_version":VERSION,"generated_at":utc_now(),"collector_ok":successes==len(WINDOWS),"collector_partial":0<successes<len(WINDOWS),"successful_windows":successes,"total_windows":len(WINDOWS),"previous_generated_at":old.get("generated_at") if old else None,"source_note":"GDELT article-level tone attached to geographic mentions; media tone, not public opinion.","source_status":statuses,"windows":windows}
    tmp=OUTPUT.with_suffix(OUTPUT.suffix+".tmp"); tmp.write_text(json.dumps(payload,ensure_ascii=False,separators=(",",":")),encoding="utf-8"); tmp.replace(OUTPUT); print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes), successes={successes}/{len(WINDOWS)}"); return 0 if successes else 2
if __name__=="__main__": raise SystemExit(main())
