#!/usr/bin/env bash
set -euo pipefail
REF="23bbdc8aa04d43c459e1929beba258b228640c35"
ROOT="$HOME/.sot-turn02/v8-clean3"; BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
for f in sot-turn02-v8-clean3-engine.py sot-turn02-v8-clean3-server.py sot-turn02-v8-clean3.service sot-turn02-pre-base-v8.html; do
  curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"
done
python3 -m py_compile "$ROOT/SOT/sot-turn02-v8-clean3-engine.py" "$ROOT/SOT/sot-turn02-v8-clean3-server.py"
python3 - "$ROOT/SOT/sot-turn02-v8-clean3-engine.py" <<'PY'
import importlib.util,sys,tempfile,time,threading,builtins
from pathlib import Path
p=Path(sys.argv[1]);sp=importlib.util.spec_from_file_location("q",p);m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m)
assert m.SCHEMA==11 and m.VERSION=="turn02-pre-base-v8-clean3"
real_open=builtins.open
class Slow:
 def __init__(self,f):self.f=f
 def read(self,*a,**k):time.sleep(.003);return self.f.read(*a,**k)
 def __enter__(self):return self
 def __exit__(self,*a):return self.f.__exit__(*a)
 def __getattr__(self,n):return getattr(self.f,n)
def slowopen(*a,**k):
 f=real_open(*a,**k)
 return Slow(f) if len(a)>1 and "b" in str(a[1]) and "r" in str(a[1]) else f
m.open=slowopen
with tempfile.TemporaryDirectory() as td:
 roots=[]
 for n in range(3):
  r=Path(td)/f"estate{n}";r.mkdir();roots.append(r)
  payload=bytes([31+n])*32768
  for i in range(600):(r/f"f{i:04}.bin").write_bytes(payload+str(i).encode())
 st=m.Store(Path(td)/"saturation.db",batch_size=100,batch_ms=.05);mg=m.Manager(st,workers=6,queue_capacity=24,stall_seconds=5)
 ids=[mg.add_source(f"E{n}",str(r),f"domain{n}",estate=f"E{n}") for n,r in enumerate(roots)]
 jid=mg.start(ids);seen={x:False for x in ids};stop=threading.Event();lat=[];read_errors=[]
 def reader():
  while not stop.is_set():
   t=time.monotonic()
   try:
    st.db_probe(.10);st.rows("SELECT state,last_progress FROM jobs WHERE job_id=?",(jid,));st.rows("SELECT COUNT(*) n FROM events WHERE job_id=?",(jid,))
   except Exception as e:read_errors.append(repr(e))
   lat.append(time.monotonic()-t);time.sleep(.01)
 ts=[threading.Thread(target=reader,daemon=True) for _ in range(4)]
 for t in ts:t.start()
 deadline=time.time()+90;last=-1;forward=0
 while time.time()<deadline:
  z=mg.snapshot(jid);cur=z["metrics"]["hashed_files"] or 0
  if cur>last:forward+=1;last=cur
  for row in z["sources"]:
   if row["hashed_files"]>0:seen[row["source_id"]]=True
  if z["job"]["state"] in ("COMPLETED","FAILED","STOPPED"):break
  time.sleep(.04)
 stop.set()
 for t in ts:t.join(1)
 z=mg.snapshot(jid);st.drain(10)
 assert z["job"]["state"]=="COMPLETED",z["job"]
 assert z["metrics"]["discovered_files"]==1800,z["metrics"]
 assert z["metrics"]["hashed_files"]==1800,z["metrics"]
 assert all(seen.values()),seen
 assert forward>=5,forward
 assert not read_errors,read_errors[:3]
 assert lat and max(lat)<.75,(max(lat),len(lat))
 assert not st.writer_error,st.writer_error
 assert not st.rows("SELECT * FROM events WHERE job_id=? AND severity='ERROR'",(jid,))
 rows=st.rows("SELECT placement_no,created,modified FROM placements WHERE job_id=? ORDER BY placement_no",(jid,));assert len(rows)==1800;nums=[r["placement_no"] for r in rows];assert len(nums)==len(set(nums)) and nums==sorted(nums);assert all(r["modified"] is not None for r in rows)
 print("PASS saturation 3-source / 1800-file / 6-worker / 4-reader gate")
 print("PASS immutable unique placement numbers + filesystem timestamps gate")
 print("PASS max concurrent DB read/probe latency %.3fs" % max(lat))
 st.close()
PY
install -m 0644 "$ROOT/SOT/sot-turn02-v8-clean3.service" "$HOME/.config/systemd/user/sot-turn02-v8-clean3.service"
systemctl --user disable --now sot-turn02-v8-clean2.service 2>/dev/null || true
systemctl --user disable --now sot-turn02-v8-clean.service 2>/dev/null || true
systemctl --user daemon-reload
systemctl --user enable sot-turn02-v8-clean3.service >/dev/null
systemctl --user restart sot-turn02-v8-clean3.service
for _ in $(seq 1 80); do curl -fsS http://127.0.0.1:8765/api/health >/tmp/sot-health.json 2>/dev/null && break; sleep .25; done
python3 - <<'PY'
import json
x=json.load(open("/tmp/sot-health.json"));assert x["ok"] and x["schema"]==11 and x["process"]=="healthy",x
print("PASS independent local health",x["version"],"schema",x["schema"],"db",x["db"]["state"])
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
x=json.load(open("/tmp/sot-https.json"));assert x["ok"] and x["schema"]==11,x
print("PASS shared-origin /sot HTTPS health")
PY
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-v8.html?v=%s&api=https%%3A%%2F%%2F%s%%2Fsot\n' "$REF" "$DNS"
