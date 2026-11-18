#!/usr/bin/env python3
"""Read-only inventory of OpenClaw session data under one folder (default: your home).
Changes nothing. Prints a short summary and writes full detail to inventory.json in the current folder."""
import argparse, collections, datetime, json, os, re, subprocess, sys, urllib.request

MAP_URL = "https://raw.githubusercontent.com/acmeproducts/stuff/main/session-manager-key-map.json"
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
PHONE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
SKIP = {"node_modules", ".git", ".npm", ".cache", "__pycache__"}

ap = argparse.ArgumentParser()
ap.add_argument("--root", default=os.path.expanduser("~"))
ap.add_argument("--map", default=MAP_URL)
a = ap.parse_args()

def when(t):
    return datetime.datetime.fromtimestamp(t).strftime("%Y-%m-%d")

def kind(name):
    for k in ("trajectory", "checkpoint", "deleted", "reset", "migrated"):
        if "." + k in name:
            return k
    return "live"

transcripts, indexes, dbs = [], [], []
for dp, dn, fn in os.walk(a.root):
    dn[:] = [d for d in dn if d not in SKIP]
    for f in fn:
        p = os.path.join(dp, f)
        try:
            st = os.stat(p)
        except OSError:
            continue
        if f.startswith("sessions.json"):
            try:
                d = json.load(open(p))
                d = d["sessions"] if isinstance(d, dict) and isinstance(d.get("sessions"), dict) else d
                indexes.append({"path": p, "mtime": st.st_mtime, "entries": len(d) if isinstance(d, dict) else None,
                                "keys": list(d) if isinstance(d, dict) else []})
            except Exception as e:
                indexes.append({"path": p, "mtime": st.st_mtime, "entries": None, "keys": [], "error": str(e)[:80]})
        elif ".jsonl" in f:
            transcripts.append({"path": p, "dir": dp, "name": f, "kind": kind(f), "size": st.st_size, "mtime": st.st_mtime})
        elif f.endswith((".sqlite", ".sqlite3", ".db")):
            dbs.append({"path": p, "size": st.st_size, "mtime": st.st_mtime})

def peek(p):
    first_user, ts, n = "", [], 0
    try:
        with open(p, "r", errors="ignore") as fh:
            for i, line in enumerate(fh):
                n += 1
                if i < 400:
                    try:
                        o = json.loads(line)
                    except Exception:
                        continue
                    stack = [o]
                    while stack:
                        x = stack.pop()
                        if isinstance(x, dict):
                            t = x.get("timestamp") or x.get("ts")
                            if isinstance(t, (int, float)) and t > 1e9:
                                ts.append(t / 1000 if t > 1e11 else t)
                            if not first_user and x.get("role") == "user":
                                c = x.get("content")
                                if isinstance(c, list):
                                    c = " ".join(y.get("text", "") for y in c if isinstance(y, dict))
                                if isinstance(c, str) and c.strip():
                                    first_user = " ".join(c.split())
                            stack.extend(v for v in x.values() if isinstance(v, (dict, list)))
                        elif isinstance(x, list):
                            stack.extend(x)
    except OSError:
        pass
    return first_user, (min(ts) if ts else None), (max(ts) if ts else None), n

by_uuid = collections.defaultdict(list)
for t in transcripts:
    m = UUID.search(t["name"])
    t["uuid"] = m.group(0) if m else None
    if t["uuid"] and t["kind"] in ("live", "deleted", "reset", "migrated"):
        by_uuid[t["uuid"]].append(t)

cur = next((i for i in indexes if i["path"].endswith("/agents/default/sessions/sessions.json")), None)
cur_keys = set(cur["keys"]) if cur else set()
cur_ids = {UUID.search(k).group(0) for k in cur_keys if UUID.search(k)}

sessions = {}
for u, ts in by_uuid.items():
    best = max(ts, key=lambda t: (t["kind"] == "live", t["size"]))
    ft, t0, t1, n = peek(best["path"])
    sessions[u] = {"uuid": u, "files": [t["path"] for t in ts], "kinds": sorted({t["kind"] for t in ts}), "lines": n,
                   "first": when(t0) if t0 else "", "last": when(t1) if t1 else "", "first_user": PHONE.sub("***", ft)[:120], "_raw": ft}

# ---- summary
print(f"ROOT {a.root}")
print(f"transcript files: {len(transcripts)} | distinct sessions (excluding trajectory/checkpoint): {len(sessions)} | sessions.json copies: {len(indexes)} | databases: {len(dbs)}")
print("\n[A] transcript files by folder (live/deleted/reset/migrated/checkpoint/trajectory | oldest-newest file date)")
hist = collections.defaultdict(lambda: collections.Counter())
rng = {}
for t in transcripts:
    hist[t["dir"]][t["kind"]] += 1
    lo, hi = rng.get(t["dir"], (t["mtime"], t["mtime"]))
    rng[t["dir"]] = (min(lo, t["mtime"]), max(hi, t["mtime"]))
for d, c in sorted(hist.items(), key=lambda x: -sum(x[1].values()))[:12]:
    k = [c.get(x, 0) for x in ("live", "deleted", "reset", "migrated", "checkpoint", "trajectory")]
    print(f"  {sum(c.values()):5d}  {'/'.join(map(str, k))}  {when(rng[d][0])}..{when(rng[d][1])}  {d.replace(a.root, '~')}")

print("\n[B] sessions.json copies (entries | modified)")
for i in sorted(indexes, key=lambda i: i["mtime"]):
    print(f"  {str(i['entries']):>5}  {when(i['mtime'])}  {i['path'].replace(a.root, '~')}")

orph = [s for u, s in sessions.items() if u not in cur_ids]
print(f"\n[C] sessions with a transcript but NOT in the current sessions.json: {len(orph)}")
by_month = collections.Counter(s["last"][:7] for s in orph if s["last"])
print("  by last-message month:", dict(sorted(by_month.items())))
print("  by file kind:", dict(collections.Counter(",".join(s["kinds"]) for s in orph)))

try:
    raw = urllib.request.urlopen(a.map, timeout=20).read() if a.map.startswith("http") else open(a.map, "rb").read()
    keymap = json.loads(raw)
except Exception as e:
    keymap = {}
    print("\n[D] key map not loaded:", str(e)[:80])
if keymap:
    byid = {"sessionId": 0, "keyUUID": 0, "firstMessage": 0}
    hit, miss = [], []
    for key, m in keymap.items():
        sid = m.get("sessionId")
        ku = UUID.search(key)
        how = None
        if sid and sid in sessions:
            how, u = "sessionId", sid
        elif ku and ku.group(0) in sessions:
            how, u = "keyUUID", ku.group(0)
        else:
            lab = " ".join((m.get("label") or "").rstrip("…").rstrip(".").split())
            if len(lab) >= 15 and not lab.startswith("Conversation info"):
                c = [s["uuid"] for s in sessions.values() if s["_raw"].startswith(lab[:100])]
                if len(c) == 1:
                    how, u = "firstMessage", c[0]
        if how:
            byid[how] += 1
            hit.append((key, how, u))
        else:
            miss.append(key)
    print(f"\n[D] key map: {len(keymap)} keys | found by {byid} | found nowhere: {len(miss)}")
    for key, how, u in hit[:10]:
        print(f"  found {how:12s} {key[14:]} -> {sessions[u]['files'][0].replace(a.root, '~')}")
    for key in miss[:10]:
        print(f"  NOT FOUND {key[14:]}  | {(keymap[key].get('label') or '')[:50]}")

print("\n[E] databases")
for d in dbs[:15]:
    print(f"  {d['size']:>10}  {when(d['mtime'])}  {d['path'].replace(a.root, '~')}")

print("\n[F] openclaw")
for cmd in (["openclaw", "--version"], ["openclaw", "config", "get", "session"]):
    try:
        o = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        print("  $", " ".join(cmd), "->", (o.stdout or o.stderr).strip().replace("\n", " ")[:200])
    except Exception as e:
        print("  $", " ".join(cmd), "-> failed:", str(e)[:60])

json.dump({"sessions": [{k: v for k, v in s.items() if k != "_raw"} for s in sessions.values()], "indexes": [{k: v for k, v in i.items() if k != "keys"} for i in indexes], "databases": dbs},
          open("inventory.json", "w"), indent=1)
print("\nFull detail written to inventory.json (read-only run; nothing was changed).")
