#!/usr/bin/env python3
"""Re-add every orphan transcript (a session file with no entry in sessions.json) so the Gateway lists it.

Dry run by default. --apply backs up sessions.json, then writes. Run with the Gateway stopped.
Original session keys are reused when known (so Session Manager projects re-attach);
otherwise the key is agent:default:restored:<uuid>, the same style OpenClaw's earlier restore used.
Cron and dreaming sessions are skipped unless --include-automated."""
import argparse, copy, json, os, re, shutil, subprocess, sys, time, urllib.request

MAP_URL = "https://raw.githubusercontent.com/acmeproducts/stuff/main/session-manager-key-map.json"
UUID = re.compile(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")
PHONE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
ap = argparse.ArgumentParser()
ap.add_argument("--dir", default=os.path.expanduser("~/.openclaw/agents/default/sessions"))
ap.add_argument("--extra", action="append", default=None, help="more folders holding transcripts (default: ~/openclaw-recovered)")
ap.add_argument("--map", default=MAP_URL)
ap.add_argument("--apply", action="store_true")
ap.add_argument("--include-automated", action="store_true")
ap.add_argument("--force", action="store_true", help="apply even if a Gateway process is running")
a = ap.parse_args()
extras = a.extra if a.extra is not None else [os.path.expanduser("~/openclaw-recovered")]

index_path = os.path.join(a.dir, "sessions.json")
raw = json.load(open(index_path))
index = raw["sessions"] if isinstance(raw, dict) and isinstance(raw.get("sessions"), dict) else raw
if not isinstance(index, dict):
    sys.exit("Unexpected sessions.json layout; nothing changed.")
try:
    keymap = json.loads(urllib.request.urlopen(a.map, timeout=20).read() if a.map.startswith("http") else open(a.map, "rb").read())
except Exception as e:
    keymap = {}
    print("key map not loaded (", str(e)[:60], ") - original keys will not be reused")
by_sid = {m["sessionId"]: k for k, m in keymap.items() if m.get("sessionId")}
by_ku = {UUID.search(k).group(0): k for k in keymap if UUID.search(k)}

template = next((v for k, v in index.items() if ":dashboard:" in k and isinstance(v, dict)), next((v for v in index.values() if isinstance(v, dict)), {}))
KEEP = ("agentHarnessId", "modelProvider", "model", "channel", "chatType", "deliveryContext", "lastChannel", "origin", "systemSent")

have = set()
for v in index.values():
    if isinstance(v, dict):
        if v.get("sessionId"):
            have.add(v["sessionId"])
        sf = os.path.basename(str(v.get("sessionFile", "")))
        have.update(UUID.findall(sf))

RANK = {"live": 0, "deleted": 1, "reset": 1, "migrated": 2}
def kind(n):
    for k in ("deleted", "reset", "migrated"):
        if "." + k in n:
            return k
    return "live"

cands = {}
for d in [a.dir] + extras:
    if not os.path.isdir(d):
        continue
    for f in os.listdir(d):
        if ".jsonl" not in f or ".trajectory." in f or ".checkpoint." in f:
            continue
        m = UUID.search(f)
        if not m or m.group(0) in have:
            continue
        p = os.path.join(d, f)
        cands.setdefault(m.group(0), []).append((RANK[kind(f)], -os.path.getmtime(p), p, kind(f)))

def peek(p):
    first, last, n = "", None, 0
    with open(p, "r", errors="ignore") as fh:
        for i, line in enumerate(fh):
            n += 1
            if i > 400 and first:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            st = [o]
            while st:
                x = st.pop()
                if isinstance(x, dict):
                    t = x.get("timestamp") or x.get("ts")
                    if isinstance(t, (int, float)) and t > 1e9:
                        last = t / 1000 if t > 1e11 else t
                    if not first and x.get("role") == "user":
                        c = x.get("content")
                        if isinstance(c, list):
                            c = " ".join(y.get("text", "") for y in c if isinstance(y, dict))
                        if isinstance(c, str) and c.strip():
                            first = " ".join(c.split())
                    st.extend(v for v in x.values() if isinstance(v, (dict, list)))
                elif isinstance(x, list):
                    st.extend(x)
    return first, last, n

plan, skipped = [], {"automated": 0, "empty": 0, "key already used": 0}
for u, files in cands.items():
    files.sort()
    best = files[0]
    first, last, n = peek(best[2])
    key = by_sid.get(u) or by_ku.get(u)
    auto = (key or "").split(":")[2:3] == ["cron"] or "Write a dream diary entry" in first[:160] or "[cron:" in first[:80] or "Read HEARTBEAT.md" in first[:120] or "dreaming-narrative" in (key or "")
    if auto and not a.include_automated:
        skipped["automated"] += 1
        continue
    if not first:
        skipped["empty"] += 1
        continue
    orig = bool(key)
    key = key or f"agent:default:restored:{u}"
    if key in index:
        skipped["key already used"] += 1
        continue
    day = time.strftime("%Y-%m-%d", time.localtime(last or os.path.getmtime(best[2])))
    text = re.sub(r"^\[[A-Z][a-z]{2} \d{4}-\d\d-\d\d \d\d:\d\d [A-Z]{3,4}\]\s*", "", first)
    label = (keymap.get(key, {}).get("label") if orig else "") or f"{text[:50].strip()} ({day})"
    plan.append({"uuid": u, "key": key, "orig": orig, "label": label, "src": best[2], "kind": best[3], "last": last or os.path.getmtime(best[2]), "lines": n})

plan.sort(key=lambda x: -x["last"])
print(f"index entries now: {len(index)} | orphan sessions with transcripts: {len(cands)}")
print(f"will re-add: {len(plan)} ({sum(p['orig'] for p in plan)} under their original key, {sum(not p['orig'] for p in plan)} as restored:<uuid>)")
print("skipped:", skipped)
print("by file kind:", {k: sum(1 for p in plan if p['kind'] == k) for k in RANK})
for p in plan[:12]:
    print(f"  {time.strftime('%Y-%m-%d', time.localtime(p['last']))} {p['kind']:8s} {'orig' if p['orig'] else 'new '} {p['lines']:5d} lines  {PHONE.sub('***', p['label'])[:60]}")
if len(plan) > 12:
    print(f"  ... and {len(plan) - 12} more")

if not a.apply:
    print("\nDry run. Nothing changed. Re-run with --apply to restore.")
    sys.exit(0)
run = subprocess.run(["pgrep", "-af", "openclaw.*gateway"], capture_output=True, text=True).stdout.strip()
if run and not a.force:
    sys.exit("A Gateway process looks to be running:\n" + run[:300] + "\nStop it first (openclaw gateway stop), then re-run --apply. Use --force to skip this check.")
if not plan:
    sys.exit("Nothing to restore.")
backup = index_path + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy2(index_path, backup)
print("backup:", backup)
for p in plan:
    live = os.path.join(a.dir, p["uuid"] + ".jsonl")
    if not os.path.exists(live):
        shutil.copy2(p["src"], live)
    e = {k: template[k] for k in KEEP if k in template}
    ms = int(p["last"] * 1000)
    e.update(sessionId=p["uuid"], sessionFile=live, updatedAt=ms, startedAt=ms, status="done", abortedLastRun=False, compactionCount=0, label=p["label"])
    index[p["key"]] = e
tmp = index_path + ".tmp"
json.dump(raw, open(tmp, "w"), indent=2)
os.replace(tmp, index_path)
print(f"restored {len(plan)} sessions. Start the Gateway (openclaw gateway start), then refresh Session Manager.")
