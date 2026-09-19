#!/usr/bin/env bash
set -euo pipefail
REF="3da8cbd03cd37467143ba8bc7753413687b2c0d8"
ROOT="$HOME/.sot-turn02/v8-clean2"; BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
for f in sot-turn02-v8-clean2-engine.py sot-turn02-v8-clean2-server.py; do curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"; done
curl -fsSL "$BASE/SOT/sot-turn02-v8-clean2.service" -o "$HOME/.config/systemd/user/sot-turn02-v8-clean2.service"
curl -fsSL "$BASE/SOT/sot-turn02-pre-base-v8.html" -o "$ROOT/SOT/sot-turn02-pre-base-v8.html"
python3 -m py_compile "$ROOT/SOT/sot-turn02-v8-clean2-engine.py" "$ROOT/SOT/sot-turn02-v8-clean2-server.py"
python3 - "$ROOT/SOT/sot-turn02-v8-clean2-engine.py" <<'PY'
import importlib.util,sys,tempfile,time,threading
from pathlib import Path
p=Path(sys.argv[1]);sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m)
assert m.SCHEMA==9 and m.VERSION=="turn02-pre-base-v8-clean2"
with tempfile.TemporaryDirectory() as td:
 roots=[]
 for n in range(3):
  r=Path(td)/f"estate{n}";r.mkdir();roots.append(r)
  for i in range(120):(r/f"f{i:03}.bin").write_bytes(bytes([(i+n)%251])*131072)
 st=m.Store(Path(td)/"sustained.db");mg=m.Manager(st,workers=6,queue_capacity=12,stall_seconds=5)
 ids=[mg.add_source(f"E{n}",str(r),f"domain{n}",estate=f"E{n}") for n,r in enumerate(roots)]
 jid=mg.start(ids);seen={x:False for x in ids};deadline=time.time()+45;reads=0
 while time.time()<deadline:
  z=mg.snapshot(jid);reads+=1
  for row in z["sources"]:
   if row["hashed_files"]>0:seen[row["source_id"]]=True
  if z["job"]["state"] in ("COMPLETED","FAILED","STOPPED"):break
  time.sleep(.03)
 z=mg.snapshot(jid)
 assert z["job"]["state"]=="COMPLETED",z["job"]
 assert z["metrics"]["discovered_files"]==360 and z["metrics"]["hashed_files"]==360,z["metrics"]
 assert all(seen.values()),seen
 assert reads>5 and st.ping()
 assert not st.rows("SELECT * FROM events WHERE job_id=? AND severity='ERROR'",(jid,))
 assert all(x["estate"] for x in st.rows("SELECT estate FROM placements WHERE job_id=?",(jid,)))
 print("PASS sustained 3-source / 360-file / 6-worker SQLite+fair-progress gate")
PY
systemctl --user disable --now sot-turn02-v8-clean.service 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable --now sot-turn02-v8-clean2.service
for _ in $(seq 1 80); do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-health.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open("/tmp/sot-health.json"));assert x["ok"] and x["schema"]==9,x
print("PASS local backend",x["version"],"schema",x["schema"])
PY
tailscale serve --bg --https=443 --set-path=/sot http://127.0.0.1:8765 >/dev/null
DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
for _ in $(seq 1 40); do curl -fsS "https://$DNS/sot/api/health" >/tmp/sot-https.json 2>/dev/null && break; sleep .25; done
curl -fsS --max-time 8 "https://$DNS/" >/dev/null
curl -fsS --max-time 8 "https://$DNS/report/" >/dev/null
SERVE="$(tailscale serve status 2>&1)"
printf "%s\n" "$SERVE" | grep -F "127.0.0.1:18789" >/dev/null
printf "%s\n" "$SERVE" | grep -F "127.0.0.1:18080" >/dev/null
printf "%s\n" "$SERVE" | grep -F "127.0.0.1:8765" >/dev/null
python3 - <<'PY'
import json
x=json.load(open("/tmp/sot-https.json"));assert x["ok"] and x["schema"]==9,x
print("PASS shared-origin /sot HTTPS backend")
PY
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v8.html?v=%s&api=https%%3A%%2F%%2F%s%%2Fsot\n' "$REF" "$DNS"
