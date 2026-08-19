#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
API="$ROOT/sot-api.js"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BASE66=2026.08.17.6.6-wsl-recovery
BUILD=2026.08.19.6.8-wsl-multiproject-reporting
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
STAMP="$(date +%Y%m%d-%H%M%S)"
LIVE_API_BAK="$API.before-6.8-$STAMP"
LIVE_UI_BAK="$UI.before-6.8-$STAMP"
cp -a "$API" "$LIVE_API_BAK"
cp -a "$UI" "$LIVE_UI_BAK"

API66="$(ls -1t "$API".before-6.7.1-* 2>/dev/null | head -1 || true)"
UI66="$(ls -1t "$UI".before-6.7.1-* 2>/dev/null | head -1 || true)"
[[ -n "$API66" && -n "$UI66" ]] || { echo 'FAIL: verified pre-6.7.1 6.6 pair not found' >&2; exit 1; }
grep -q "$BASE66" "$API66"
grep -q "$BASE66" "$UI66"

echo '=== DOWNLOAD REVIEWED COMPONENTS ==='
FILES=(
 sot-backend-6.7-addon.js
 sot-backend-6.7.1-hotfix.js
 sot-backend-6.7.3-mount-safe-addon.js
 sot-backend-6.8-multiproject-addon.js
 sot-ui-6.7-addon.js
 sot-ui-6.7.1-hotfix.js
 sot-ui-6.7.2-telemetry-hotfix.js
 sot-ui-6.7.3-mount-safe-addon.js
 sot-ui-6.8-multiproject-addon.js
)
for f in "${FILES[@]}"; do curl -fsSL "$BASE/$f" -o "$TMP/$f"; node --check "$TMP/$f"; done

echo '=== RECONSTRUCT 6.8 FROM VERIFIED 6.6 ==='
cp -a "$API66" "$TMP/sot-api.candidate.js"
cp -a "$UI66" "$TMP/project.candidate.html"
TMP="$TMP" python3 - <<'PY'
import os,pathlib,re
T=pathlib.Path(os.environ['TMP'])
api=T/'sot-api.candidate.js'; ui=T/'project.candidate.html'
s=api.read_text(); h=ui.read_text()
if '2026.08.17.6.6-wsl-recovery' not in s or '2026.08.17.6.6-wsl-recovery' not in h:
    raise SystemExit('verified 6.6 base markers missing')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
backend=[
 'sot-backend-6.7-addon.js','sot-backend-6.7.1-hotfix.js',
 'sot-backend-6.7.3-mount-safe-addon.js','sot-backend-6.8-multiproject-addon.js']
s=s.replace(marker,'\n'.join((T/x).read_text() for x in backend)+'\n'+marker,1)
api.write_text(s)
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
frontend=[
 'sot-ui-6.7-addon.js','sot-ui-6.7.1-hotfix.js','sot-ui-6.7.2-telemetry-hotfix.js',
 'sot-ui-6.7.3-mount-safe-addon.js','sot-ui-6.8-multiproject-addon.js']
h=h.replace(marker,''.join('<script>\n'+(T/x).read_text()+'\n</script>\n' for x in frontend)+marker,1)
ui.write_text(h)
PY

node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text()
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/project.candidate.html"

echo '=== INSTALL CANDIDATE ==='
rollback(){
  echo '=== 6.8 GATE FAILED — RESTORE PRE-6.8 LIVE PAIR ===' >&2
  cp -a "$LIVE_API_BAK" "$API" || true
  cp -a "$LIVE_UI_BAK" "$UI" || true
  sudo systemctl restart openclaw-report-server.service || true
  exit 1
}
trap rollback ERR
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/project.candidate.html" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..15}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('no health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('wrong build: '+repr(x))
need={'global-multi-project-scheduler','durable-file-inventory','inventory-reporting'}
if not need.issubset(set(x.get('capabilities') or [])): raise SystemExit('capability gate failed: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo '=== SCHEDULER API GATE ==='
curl -fsS http://127.0.0.1:18080/api/sot/scheduler/status -o "$TMP/scheduler.json"
python3 - "$TMP/scheduler.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('worker_pool')!=4 or not isinstance(x.get('workers'),list) or len(x['workers'])!=4:
    raise SystemExit('scheduler shape failed: '+repr(x))
print('worker_pool=',x['worker_pool'],'queue=',len(x.get('queue') or []))
PY

echo '=== DB GATE ==='
curl -fsS http://127.0.0.1:18080/api/sot/db/info -o "$TMP/db.json"
python3 - "$TMP/db.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not x.get('integrity',{}).get('ok'): raise SystemExit('DB integrity failed: '+repr(x))
PY
sqlite3 "$HOME/.openclaw/sot/sot.sqlite" "SELECT name FROM sqlite_master WHERE type='table' AND name='mp_queue';" | grep -qx mp_queue

echo '=== INVENTORY REPORTING API GATE ==='
curl -fsS http://127.0.0.1:18080/api/sot/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" "$TMP" <<'PY'
import json,sys,subprocess,urllib.parse,pathlib
x=json.load(open(sys.argv[1])); projects=x if isinstance(x,list) else x.get('projects',[])
if projects:
    p=projects[0]; token=p.get('project_token')
    if token:
        base='http://127.0.0.1:18080/api/sot/projects/'+urllib.parse.quote(token,safe='')+'/inventory/folders'
        y=json.loads(subprocess.check_output(['curl','-fsS',base],text=True))
        if 'folders' not in y: raise SystemExit('inventory folders shape failed')
        print('reporting folders gate:',len(y['folders']))
else:
    print('no projects available; reporting route existence covered by syntax/health gates')
PY

echo '=== UI GATES ==='
grep -q "$BUILD" "$UI"
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260819-680"
curl -fsS "$PUBLIC" -o "$TMP/public-ui.html"
grep -q "$BUILD" "$TMP/public-ui.html"

echo '=== SUCCESS ==='
echo "Backend/UI: $BUILD"
echo 'Workers:    4 global workers shared across projects'
echo 'Reporting:  Project -> Folder -> File durable inventory explorer'
echo "URL:        $PUBLIC"
trap - ERR
