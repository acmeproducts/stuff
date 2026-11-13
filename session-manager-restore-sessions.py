#!/usr/bin/env python3
"""Re-add Gateway sessions missing from sessions.json whose transcripts still exist anywhere on disk.

Run on the Gateway machine. Dry run by default; --apply writes (after backing up).
Stop the Gateway before --apply and start it after, or it may overwrite the file.

  python3 restore.py                       # report only
  python3 restore.py --apply               # restore
  python3 restore.py --root /some/folder   # also search another folder (repeatable)
"""
import argparse, collections, json, os, re, shutil, sys, time, urllib.request

MAP_URL = "https://raw.githubusercontent.com/acmeproducts/stuff/main/session-manager-key-map.json"
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default=os.path.expanduser("~/.openclaw/agents/default/sessions"))
ap.add_argument("--root", action="append", default=[], help="extra folder to search")
ap.add_argument("--map", default=MAP_URL)
ap.add_argument("--apply", action="store_true")
a = ap.parse_args()

index_path = os.path.join(a.dir, "sessions.json")
raw = json.load(open(index_path))
index = raw["sessions"] if isinstance(raw, dict) and isinstance(raw.get("sessions"), dict) else raw
if not isinstance(index, dict):
    sys.exit("Unexpected sessions.json layout; nothing changed.")
keymap = json.loads(urllib.request.urlopen(a.map).read() if a.map.startswith("http") else open(a.map, "rb").read())

roots = [os.path.expanduser("~/.openclaw"), a.dir] + [os.path.expanduser(r) for r in a.root]
files = collections.defaultdict(list)   # uuid -> [paths]
dirs = collections.Counter()
seen = set()
for root in roots:
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in ("node_modules", ".git")]
        for f in fn:
            if ".jsonl" not in f:
                continue
            p = os.path.join(dp, f)
            if p in seen:
                continue
            seen.add(p)
            dirs[dp] += 1
            ids = set(UUID.findall(f))
            try:
                with open(p, "r", errors="ignore") as fh:
                    ids |= set(UUID.findall(fh.readline()[:600]))
            except OSError:
                pass
            for i in ids:
                files[i].append(p)
print("transcript files found:", len(seen))
for d, n in dirs.most_common(8):
    print(f"  {n:5d}  {d}")

def best(paths):
    live = [p for p in paths if p.endswith(".jsonl")]
    pool = live or paths
    return max(pool, key=lambda p: os.path.getmtime(p))

template = next((v for k, v in index.items() if ":dashboard:" in k and isinstance(v, dict)),
                next((v for v in index.values() if isinstance(v, dict)), {}))
add, lost = [], []
for key, m in keymap.items():
    if key in index:
        continue
    cands = [c for c in (m.get("sessionId"), *UUID.findall(key)) if c]
    hit = next((best(files[c]) for c in cands if files.get(c)), None)
    sid = next((c for c in cands if files.get(c)), None)
    (add if hit else lost).append((key, m, sid, hit))
print(f"\nrestorable: {len(add)} | not found anywhere: {len(lost)} | already in sessions.json: {sum(1 for k in keymap if k in index)}")
for key, m, sid, hit in add:
    print("  restore", key, "<-", hit, "|", m.get("project", ""), "|", (m.get("label") or "")[:40])
for key, m, sid, hit in lost:
    print("  not found", key, "| sessionId", m.get("sessionId"))

if not a.apply:
    print("\nDry run. Nothing changed. Re-run with --apply to restore.")
    sys.exit(0)
if not add:
    sys.exit("Nothing to restore.")

backup = index_path + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy2(index_path, backup)
print("backup:", backup)
KEEP = ("agentHarnessId", "modelProvider", "model", "channel", "chatType", "deliveryContext", "lastChannel", "origin", "systemSent")
for key, m, sid, hit in add:
    live = os.path.join(a.dir, sid + ".jsonl")
    if not os.path.exists(live):
        shutil.copy2(hit, live)
    entry = {k: template[k] for k in KEEP if k in template}
    mt = int(os.path.getmtime(live) * 1000)
    entry.update(sessionId=sid, sessionFile=live, updatedAt=mt, startedAt=mt, status="done", abortedLastRun=False, compactionCount=0)
    if m.get("label"):
        entry["label"] = m["label"]
    index[key] = entry
tmp = index_path + ".tmp"
json.dump(raw, open(tmp, "w"), indent=2)
os.replace(tmp, index_path)
print(f"restored {len(add)} sessions. Start the Gateway, then refresh Session Manager.")
