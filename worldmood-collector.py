#!/usr/bin/env python3
"""WorldPulse v1.8 collector.

Broad GDELT supplies the geographic/sentiment signal. Separate targeted
publisher queries deliberately add mainstream journalism so the reader pane
is not dependent on whatever domains happen to dominate the broad sample.
"""
from __future__ import annotations

import datetime as dt
import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

VERSION = "1.8.0"
BASE = os.environ.get("WORLDMOOD_GDELT_GKG_URL", "https://api.gdeltproject.org/api/v1/gkg_geojson")
OUTPUT = Path(os.environ.get("WORLDMOOD_OUTPUT", "worldmood-data.json"))
WINDOWS = [60, 180, 360, 720, 1440]
MAXROWS = int(os.environ.get("WORLDMOOD_MAXROWS", "5000"))
QUALITY_MAXROWS = int(os.environ.get("WORLDMOOD_QUALITY_MAXROWS", "180"))
TIMEOUT = int(os.environ.get("WORLDMOOD_TIMEOUT", "45"))
USER_AGENT = "WorldPulseCollector/1.8 (+https://github.com/acmeproducts/stuff)"

# Reader ranking. The broad signal is intentionally not restricted to these.
QUALITY = {
    "bbc.com": 100,
    "bbc.co.uk": 100,
    "reuters.com": 99,
    "apnews.com": 99,
    "npr.org": 95,
    "theguardian.com": 94,
    "aljazeera.com": 93,
    "dw.com": 92,
    "france24.com": 92,
    "abc.net.au": 91,
    "cbc.ca": 91,
    "cbsnews.com": 87,
    "nbcnews.com": 87,
    "abcnews.go.com": 87,
    "cnn.com": 85,
    "nytimes.com": 85,
    "washingtonpost.com": 85,
}

# These are deliberately queried on every collection cycle. Keeping the list
# fairly small avoids turning the collector into a general crawler.
TARGET_DOMAINS = [
    "bbc.co.uk",
    "bbc.com",
    "reuters.com",
    "apnews.com",
    "npr.org",
    "theguardian.com",
    "aljazeera.com",
    "dw.com",
    "france24.com",
    "abc.net.au",
    "cbc.ca",
]


def utc_now():
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def num(v, d=0.0):
    try:
        n = float(v)
        return n if n == n else d
    except Exception:
        return d


def clean_domain(v):
    return str(v or "").lower().removeprefix("www.")


def quality_score(v):
    d = clean_domain(v)
    return max((score for domain, score in QUALITY.items() if d == domain or d.endswith("." + domain)), default=0)


def region(lat, lon):
    if lat < -60:
        return "Antarctica"
    if -170 <= lon < -30 and lat >= 7:
        return "North America"
    if -95 <= lon < -30 and lat < 15:
        return "South America"
    if -20 <= lon < 55 and lat >= 35:
        return "Europe"
    if -25 <= lon < 60 and -40 < lat < 35:
        return "Africa"
    if (lon >= 110 or lon < -170) and lat < -10:
        return "Oceania"
    return "Asia"


def place(name, p, lat, lon):
    raw = str(name or p.get("name") or p.get("location") or "Unknown place").strip()
    parts = [x.strip() for x in raw.split(",") if x.strip()]
    country = str(p.get("country") or p.get("countryname") or p.get("country_name") or (parts[-1] if parts else "Other"))
    admin1 = str(p.get("adm1") or p.get("admin1") or p.get("state") or p.get("province") or (parts[-2] if len(parts) >= 3 else "Other"))
    city = str(parts[0] if parts else raw) or "Other"
    return {
        "region": region(lat, lon),
        "country": country or "Other",
        "admin1": admin1 or "Other",
        "city": city,
    }


def fetch_json(url):
    started = time.monotonic()
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    status = {"ok": False, "http_status": None, "latency_ms": None, "error": None}
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read()
            status.update(
                ok=True,
                http_status=getattr(r, "status", 200),
                latency_ms=round((time.monotonic() - started) * 1000),
            )
            return json.loads(body.decode("utf-8", errors="replace")), status
    except urllib.error.HTTPError as e:
        status.update(
            http_status=e.code,
            latency_ms=round((time.monotonic() - started) * 1000),
            error=f"HTTP {e.code}: {e.reason}",
        )
        raise
    except Exception as e:
        status.update(
            latency_ms=round((time.monotonic() - started) * 1000),
            error=f"{type(e).__name__}: {e}",
        )
        raise


def source_url(minutes, query="", maxrows=None):
    fields = "url,name,domain,title,tone,lang,wordcount,themes,names"
    return BASE + "?" + urllib.parse.urlencode(
        {
            "QUERY": query,
            "OUTPUTFIELDS": fields,
            "OUTPUTTYPE": "1",
            "MAXROWS": str(maxrows or MAXROWS),
            "TIMESPAN": str(minutes),
        }
    )


def fetch_features(minutes, query="", maxrows=None):
    source, http = fetch_json(source_url(minutes, query, maxrows))
    features = source.get("features") if isinstance(source, dict) else None
    if not isinstance(features, list):
        raise ValueError("GDELT response did not contain a features array")
    return features, http


def targeted_quality_features(minutes):
    """Fetch reputable publishers in parallel, independently of broad sampling."""
    all_features = []
    source_status = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {
            executor.submit(fetch_features, minutes, f"domain:{domain}", QUALITY_MAXROWS): domain
            for domain in TARGET_DOMAINS
        }
        for future in as_completed(futures):
            domain = futures[future]
            try:
                features, http = future.result()
                all_features.extend(features)
                source_status[domain] = {
                    "ok": True,
                    "records": len(features),
                    "http_status": http.get("http_status"),
                    "latency_ms": http.get("latency_ms"),
                }
            except Exception as e:
                source_status[domain] = {
                    "ok": False,
                    "records": 0,
                    "error": f"{type(e).__name__}: {e}",
                }
    return all_features, source_status


def normalize(f):
    g = f.get("geometry") or {}
    c = g.get("coordinates")
    if g.get("type") != "Point" or not isinstance(c, list) or len(c) < 2:
        return None
    lon, lat = num(c[0], 999), num(c[1], 999)
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        return None
    p = f.get("properties") or {}
    q = place(str(p.get("name") or ""), p, lat, lon)
    tone = num(p.get("urltone", p.get("avgurltone", p.get("tone", p.get("avgtone", p.get("avgTone", 0))))))
    url = str(p.get("url") or p.get("articleurl") or "")
    domain = str(p.get("domain") or p.get("urldomain") or "")
    return {
        "name": str(p.get("name") or q["city"]),
        "lat": round(lat, 5),
        "lon": round(lon, 5),
        "tone": round(tone, 4),
        **q,
        "count": max(1, int(round(num(p.get("count", p.get("nummentions", p.get("mentions", 1))), 1)))),
        "url": url,
        "domain": domain,
        "quality": quality_score(domain),
        "title": str(p.get("title") or p.get("urltitle") or ""),
        "lang": str(p.get("urllangcode") or p.get("lang") or ""),
        "wordcount": int(round(num(p.get("urlwordcnt", p.get("wordcount", 0)), 0))),
        "themes": str(p.get("mentionedthemes") or p.get("themes") or ""),
        "names": str(p.get("mentionednames") or p.get("names") or ""),
        "published": str(p.get("urlpubtimedate") or ""),
    }


def compact(records, limit=16):
    groups = {}
    for d in records:
        k = (
            d["region"],
            d["country"],
            d["admin1"],
            d["city"],
            round(d["lat"], 1),
            round(d["lon"], 1),
        )
        g = groups.get(k)
        if g is None:
            g = {
                "name": d["name"],
                "lat": d["lat"],
                "lon": d["lon"],
                "region": d["region"],
                "country": d["country"],
                "admin1": d["admin1"],
                "city": d["city"],
                "count": 0,
                "tone_sum": 0.0,
                "weight": 0,
                "article_candidates": [],
            }
            groups[k] = g
        w = max(1, int(d.get("count", 1)))
        g["count"] += w
        g["tone_sum"] += float(d.get("tone", 0)) * w
        g["weight"] += w
        if d.get("url"):
            a = {key: d.get(key) for key in ("title", "url", "domain", "tone", "lang", "wordcount", "themes", "names", "published", "quality")}
            if not any(x.get("url") == a["url"] for x in g["article_candidates"]):
                g["article_candidates"].append(a)

    out = []
    for g in groups.values():
        weight = g.pop("weight")
        tone_sum = g.pop("tone_sum")
        candidates = g.pop("article_candidates")
        candidates.sort(
            key=lambda a: (
                int(a.get("quality") or 0),
                str(a.get("published") or ""),
                int(a.get("wordcount") or 0),
            ),
            reverse=True,
        )
        g["articles"] = candidates[:limit]
        g["tone"] = round(tone_sum / weight if weight else 0, 4)
        out.append(g)
    return sorted(out, key=lambda x: x["count"], reverse=True)


def dedupe_features(features):
    seen = set()
    out = []
    for f in features:
        p = f.get("properties") or {}
        g = f.get("geometry") or {}
        key = (
            p.get("url") or p.get("articleurl") or "",
            p.get("name") or "",
            str(g.get("coordinates") or ""),
        )
        if key in seen:
            continue
        seen.add(key)
        out.append(f)
    return out


def previous():
    try:
        return json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else None
    except Exception:
        return None


def main():
    old = previous()
    windows = {}
    statuses = {}
    successes = 0

    for minutes in WINDOWS:
        st = {
            "source": "GDELT GKG GeoJSON 1.0 + targeted quality publishers",
            "endpoint": BASE,
            "window_minutes": minutes,
            "ok": False,
            "http_status": None,
            "latency_ms": None,
            "raw_records": 0,
            "targeted_raw_records": 0,
            "mapped_records": 0,
            "clustered_places": 0,
            "tone_nonzero_records": 0,
            "quality_articles": 0,
            "quality_domains": {},
            "targeted_sources": {},
            "tone_min": None,
            "tone_max": None,
            "error": None,
        }
        try:
            broad_features, http = fetch_features(minutes)
            st.update(http)
            targeted, targeted_status = targeted_quality_features(minutes)
            st["targeted_sources"] = targeted_status
            st["raw_records"] = len(broad_features)
            st["targeted_raw_records"] = len(targeted)

            merged = dedupe_features(broad_features + targeted)
            mapped = [x for x in (normalize(f) for f in merged) if x]
            st["mapped_records"] = len(mapped)

            tones = [x["tone"] for x in mapped]
            st["tone_nonzero_records"] = sum(1 for x in tones if abs(x) > 1e-9)
            if tones:
                st["tone_min"], st["tone_max"] = round(min(tones), 3), round(max(tones), 3)

            quality_records = [x for x in mapped if x.get("quality")]
            st["quality_articles"] = len(quality_records)
            for x in quality_records:
                d = clean_domain(x.get("domain"))
                st["quality_domains"][d] = st["quality_domains"].get(d, 0) + 1
            st["quality_domains"] = dict(
                sorted(st["quality_domains"].items(), key=lambda kv: kv[1], reverse=True)[:20]
            )

            clustered = compact(mapped)
            st["clustered_places"] = len(clustered)
            if not clustered:
                raise ValueError("No mappable point records returned")
            windows[str(minutes)] = clustered
            st["ok"] = True
            successes += 1
        except Exception as e:
            st["error"] = st.get("error") or f"{type(e).__name__}: {e}"
            if old and isinstance(old.get("windows", {}).get(str(minutes)), list):
                windows[str(minutes)] = old["windows"][str(minutes)]
                st["using_previous_cache"] = True
            else:
                windows[str(minutes)] = []

        statuses[str(minutes)] = st
        print(json.dumps(st, ensure_ascii=False), flush=True)

    result = {
        "schema": "worldmood-cache-v1",
        "app_version": VERSION,
        "generated_at": utc_now(),
        "collector_ok": successes == len(WINDOWS),
        "collector_partial": 0 < successes < len(WINDOWS),
        "successful_windows": successes,
        "total_windows": len(WINDOWS),
        "previous_generated_at": old.get("generated_at") if old else None,
        "source_note": "Broad GDELT supplies geography/sentiment; separate targeted publisher queries deliberately add mainstream journalism. Media tone, not public opinion.",
        "quality_publishers": QUALITY,
        "targeted_publishers": TARGET_DOMAINS,
        "source_status": statuses,
        "windows": windows,
    }
    tmp = OUTPUT.with_suffix(OUTPUT.suffix + ".tmp")
    tmp.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    tmp.replace(OUTPUT)
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes), successes={successes}/{len(WINDOWS)}")
    return 0 if successes else 2


if __name__ == "__main__":
    raise SystemExit(main())
