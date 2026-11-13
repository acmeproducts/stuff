#!/usr/bin/env python3
"""Re-add Gateway sessions that dropped out of sessions.json but still have transcripts on disk.

Run on the Gateway machine. Dry run by default; --apply writes (after backing up).
Stop the Gateway before --apply and start it after, or it may overwrite the file.

  python3 session-manager-restore-sessions.py            # report only
  python3 session-manager-restore-sessions.py --apply    # restore
"""
import argparse, glob, json, os, shutil, sys, time, urllib.request

MAP_URL = "https://raw.githubusercontent.com/acmeproducts/stuff/main/session-manager-key-map.json"

ap = argparse.ArgumentParser()
ap.add_argument("--dir", default=os.path.expanduser("~/.openclaw/agents/default/sessions"))
ap.add_argument("--map", default=MAP_URL, help="URL or path of the key map")
ap.add_argument("--apply", action="store_true")
a = ap.parse_args()

index_path = os.path.join(a.dir, "sessions.json")
raw = json.load(open(index_path))
wrapped = isinstance(raw, dict) and isinstance(raw.get("sessions"), dict)
index = raw["sessions"] if wrapped else raw
if not isinstance(index, dict):
    sys.exit("Unexpected sessions.json layout; nothing changed.")

src = a.map
data = urllib.request.urlopen(src).read() if src.startswith("http") else open(src, "rb").read()
keymap = json.loads(data)

template = next((v for k, v in index.items() if ":dashboard:" in k and isinstance(v, dict)),
                next((v for v in index.values() if isinstance(v, dict)), {}))
print("sessions.json entries:", len(index), "| entry fields:", sorted(template.keys()))

add, no_transcript, already = [], [], 0
for key, m in keymap.items():
    if key in index:
        already += 1
        continue
    sid = m.get("sessionId")
    if not sid:
        no_transcript.append((key, "no session id recorded"))
        continue
    live = os.path.join(a.dir, sid + ".jsonl")
    found = live if os.path.exists(live) else next(iter(sorted(glob.glob(os.path.join(a.dir, sid + ".jsonl.*")))), None)
    if not found:
        no_transcript.append((key, "no transcript on disk"))
        continue
    add.append((key, m, sid, live, found))

print(f"already present: {already} | restorable: {len(add)} | not restorable: {len(no_transcript)}")
for key, why in no_transcript:
    print("  skip", key, "-", why)
for key, m, sid, live, found in add:
    print("  restore", key, "<-", os.path.basename(found), "|", m.get("project", ""), "|", (m.get("label") or "")[:50])

if not a.apply:
    print("\nDry run. Nothing changed. Re-run with --apply to restore.")
    sys.exit(0)
if not add:
    sys.exit("Nothing to restore.")

backup = index_path + ".bak-" + time.strftime("%Y%m%d-%H%M%S")
shutil.copy2(index_path, backup)
print("backup:", backup)
for key, m, sid, live, found in add:
    if found != live:
        shutil.copy2(found, live)
    entry = {"sessionId": sid, "updatedAt": int(os.path.getmtime(live) * 1000)}
    if m.get("label"):
        entry["label"] = m["label"]
    if "sessionFile" in template:
        entry["sessionFile"] = live
    index[key] = entry
tmp = index_path + ".tmp"
json.dump(raw, open(tmp, "w"), indent=2)
os.replace(tmp, index_path)
print(f"restored {len(add)} sessions. Start the Gateway, then refresh Session Manager.")
