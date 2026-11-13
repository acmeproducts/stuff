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
ap.add_argument("--all", action="store_true", help="restore every key found in older index copies, not just the known project sessions")
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
backups = []
for root in roots:
    for dp, dn, fn in os.walk(root):
        dn[:] = [d for d in dn if d not in ("node_modules", ".git")]
        for f in fn:
            p = os.path.join(dp, f)
            if f.startswith("sessions.json") and p not in seen and os.path.abspath(p) != os.path.abspath(index_path):
                seen.add(p)
                try:
                    d = json.load(open(p))
                    d = d["sessions"] if isinstance(d, dict) and isinstance(d.get("sessions"), dict) else d
                    if isinstance(d, dict):
                        backups.append((p, d))
                except Exception:
                    pass
                continue
            if ".jsonl" not in f or ".trajectory." in f or ".checkpoint." in f:
                continue
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
print("transcript files found:", sum(dirs.values()), "| older sessions.json copies:", len(backups))
for p, d in backups:
    print("  index copy:", len(d), "entries", p)
for d, n in dirs.most_common(8):
    print(f"  {n:5d}  {d}")

def best(paths):
    live = [p for p in paths if p.endswith(".jsonl")]
    pool = live or paths
    return max(pool, key=lambda p: os.path.getmtime(p))

template = next((v for k, v in index.items() if ":dashboard:" in k and isinstance(v, dict)),
                next((v for v in index.values() if isinstance(v, dict)), {}))

def first_user_text(path):
    try:
        with open(path, "r", errors="ignore") as fh:
            for n, line in enumerate(fh):
                if n > 80:
                    break
                try:
                    obj = json.loads(line)
                except Exception:
                    continue
                stack = [obj]
                while stack:
                    o = stack.pop()
                    if isinstance(o, dict):
                        if o.get("role") == "user":
                            c = o.get("content")
                            if isinstance(c, list):
                                c = " ".join(x.get("text", "") for x in c if isinstance(x, dict))
                            if isinstance(c, str) and c.strip():
                                return " ".join(c.split())
                        stack.extend(v for v in o.values() if isinstance(v, (dict, list)))
                    elif isinstance(o, list):
                        stack.extend(o)
    except OSError:
        pass
    return ""

claimed = {os.path.basename(str(v.get("sessionFile", ""))).split(".")[0] for v in index.values() if isinstance(v, dict)} | {v.get("sessionId") for v in index.values() if isinstance(v, dict)}
titles = None
def title_index():
    global titles
    if titles is None:
        titles = []
        for sid, paths in files.items():
            if sid in claimed or sid not in {os.path.basename(p).split(".")[0] for p in paths}:
                continue
            p = best(paths)
            t = first_user_text(p)
            if t:
                titles.append((sid, p, t))
    return titles

def by_label(label):
    lab = label.strip().rstrip("…").rstrip(".").strip()
    lab = " ".join(lab.split())
    if len(lab) < 15 or lab.startswith("Conversation info"):
        return None, 0
    hits = [(sid, p) for sid, p, t in title_index() if t.startswith(lab)]
    return (hits[0] if len(hits) == 1 else None), len(hits)

old = collections.defaultdict(list)   # key -> entries from older sessions.json copies, newest first
for p, d in backups:
    for k, v in d.items():
        if isinstance(v, dict) and v.get("sessionId"):
            old[k].append(v)
for k in old:
    old[k].sort(key=lambda v: v.get("updatedAt") or 0, reverse=True)
wanted = list(keymap) if not a.all else list(dict.fromkeys(list(keymap) + list(old)))
add, lost = [], []
for key in wanted:
    if key in index:
        continue
    m = keymap.get(key, {})
    entries = old.get(key, [])
    cands = [(e["sessionId"], e) for e in entries] + [(c, None) for c in (m.get("sessionId"), *UUID.findall(key)) if c]
    pick = next(((sid, e, best(files[sid])) for sid, e in cands if files.get(sid)), None)
    why = ""
    if not pick:
        for e in entries:
            sf = str(e.get("sessionFile", ""))
            if sf and os.path.exists(sf):
                pick = (e["sessionId"], e, sf)
                break
    if not pick and m.get("label"):
        hit, n = by_label(m["label"])
        if hit:
            pick = (hit[0], None, hit[1])
            why = " (matched by first message)"
        elif n > 1:
            why = f" ({n} transcripts start the same; skipped)"
    if pick:
        add.append((key, m, pick[0], pick[2], pick[1], why))
    else:
        lost.append((key, m, None, None, None, why))
print(f"\nrestorable: {len(add)} | not found anywhere: {len(lost)} | already in sessions.json: {sum(1 for k in keymap if k in index)}")
for key, m, sid, hit, ent, why in add:
    print("  restore", key[14:], "<-", os.path.basename(hit)[:60], "|", m.get("project", ""), "|", (m.get("label") or "")[:40] + why)
for key, m, sid, hit, ent, why in lost:
    print("  not found", key[14:], "|", (m.get("label") or "")[:50] + why)

if not a.apply:
    print("\nDry run. Nothing changed. Re-run with --apply to restore.")
    sys.exit(0)
if not add:
    sys.exit("Nothing to restore.")

backup = index_path + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy2(index_path, backup)
print("backup:", backup)
KEEP = ("agentHarnessId", "modelProvider", "model", "channel", "chatType", "deliveryContext", "lastChannel", "origin", "systemSent")
import copy
for key, m, sid, hit, ent, why in add:
    live = os.path.join(a.dir, sid + ".jsonl")
    if not os.path.exists(live) and not hit.endswith(".jsonl") or not os.path.exists(live):
        shutil.copy2(hit, live)
    mt = int(os.path.getmtime(live) * 1000)
    if ent:
        entry = copy.deepcopy(ent)
        entry["sessionFile"] = live
        entry.setdefault("updatedAt", mt)
    else:
        entry = {k: template[k] for k in KEEP if k in template}
        entry.update(sessionId=sid, sessionFile=live, updatedAt=mt, startedAt=mt, status="done", abortedLastRun=False, compactionCount=0)
    if m.get("label") and not entry.get("label"):
        entry["label"] = m["label"]
    index[key] = entry
tmp = index_path + ".tmp"
json.dump(raw, open(tmp, "w"), indent=2)
os.replace(tmp, index_path)
print(f"restored {len(add)} sessions. Start the Gateway, then refresh Session Manager.")
