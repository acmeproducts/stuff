#!/usr/bin/env bash
set -euo pipefail
REF="0ce4a392787e77c0f2d4530050551e0c0fbee357"
ROOT="$HOME/.sot-turn02/v8-clean"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
for f in sot-turn02-v8-engine.py sot-turn02-pre-base-v8-server.py; do curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"; done
curl -fsSL "$BASE/SOT/sot-turn02-v8-clean.service" -o "$HOME/.config/systemd/user/sot-turn02-v8-clean.service"
curl -fsSL "$BASE/SOT/sot-turn02-pre-base-v8.html" -o "$ROOT/SOT/sot-turn02-pre-base-v8.html"
python3 -m py_compile "$ROOT/SOT/sot-turn02-v8-engine.py" "$ROOT/SOT/sot-turn02-pre-base-v8-server.py"
python3 - "$ROOT/SOT/sot-turn02-pre-base-v8.html" <<'PY'
import re,sys
s=open(sys.argv[1],encoding="utf-8").read()
assert not re.search(r"\b(?:alert|confirm|prompt)\s*\(",s), "native browser dialog prohibited"
for token in ["subtabs","beginResize","localStorage.sotDbWidths","updateSuggest","atomMatch","overflow:hidden","treeRows","Selected Estate Roots","toggleNode","selectRoot"]:
 assert token in s,token
assert "Refresh to load volumes" not in s
print("PASS client modal/toast sub-tabs viewport grid resize Omnisearch hierarchical Estate static gate")
PY
python3 - "$ROOT/SOT/sot-turn02-v8-engine.py" <<'PY'
import importlib.util,sys,tempfile,time
from pathlib import Path
engine=Path(sys.argv[1]);spec=importlib.util.spec_from_file_location("sotv8q",engine);m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
with tempfile.TemporaryDirectory() as td:
 root=Path(td)/"estate";root.mkdir();(root/"probe.txt").write_text("SOT estate write gate\n")
 store=m.Store(Path(td)/"gate.db");mgr=m.Manager(store,workers=2,queue_capacity=8,stall_seconds=5)
 sid=mgr.add_source("Fixture Estate",str(root),str(root),estate="Fixture Estate");jid=mgr.start([sid])
 deadline=time.time()+15
 while time.time()<deadline:
  snap=mgr.snapshot(jid)
  if snap["job"]["state"] in ("COMPLETED","FAILED","STOPPED"):break
  time.sleep(.05)
 snap=mgr.snapshot(jid);rows=store.rows("SELECT estate,fingerprint,lifecycle FROM placements WHERE job_id=?",(jid,))
 assert snap["job"]["state"]=="COMPLETED",snap["job"]
 assert len(rows)==1 and rows[0]["estate"]=="Fixture Estate" and rows[0]["fingerprint"] and rows[0]["lifecycle"]=="COMPLETED",rows
 assert snap["metrics"]["discovered_files"]==1 and snap["metrics"]["hashed_files"]==1,snap["metrics"]
 errs=store.rows("SELECT message FROM events WHERE job_id=? AND event_type='source_file_error'",(jid,))
 assert not errs,errs
 print("PASS fixture placement-write fingerprint estate lifecycle")
src=engine.read_text()
assert "source_id,estate,path,filename,extension,size" in src
assert "source_id,estate,path,filename,extension,scanned_at" in src
assert src.count("src['estate']")>=2
print("PASS normal+error placement Estate write-contract audit")
assert "self.db=sqlite3.connect" in src and "def ping(self)" in src
assert src.count("sqlite3.connect")==1
print("PASS long-lived SQLite Store static gate")
PY
systemctl --user disable --now sot-turn02-v8-recovery.service 2>/dev/null || true
systemctl --user disable --now sot-turn02-v8.service 2>/dev/null || true
systemctl --user disable --now sot-turn02-v7.service 2>/dev/null || true
pkill -f 'sot-turn02-.*server.py' 2>/dev/null || true
echo '=== RESTORING OPENCLAW ROOT / ISOLATING SOT ==='
systemctl --user daemon-reload
systemctl --user enable --now sot-turn02-v8-clean.service
for _ in $(seq 1 60); do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-v8-health.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v8-health.json'));assert x['ok'] and x['schema']==8 and x['version']=='turn02-pre-base-v8',x
print('PASS backend',x['version'],'schema',x['schema'])
PY
tailscale serve --bg --https=443 / http://127.0.0.1:18789 >/dev/null
tailscale serve --bg --https=8443 http://127.0.0.1:8765 >/dev/null
DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
for _ in $(seq 1 40); do curl -fsS "https://$DNS:8443/api/health" >/tmp/sot-v8-https.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open('/tmp/sot-v8-https.json'));assert x['ok'] and x['schema']==8 and x['version']=='turn02-pre-base-v8',x
print('PASS isolated HTTPS backend',x['version'],'schema',x['schema'])
PY
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v8.html?v=%s&api=https%%3A%%2F%%2F%s\n' "$REF" "$DNS"
