#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
UI="$ROOT/SOT/sot-turn01-r2-wizard.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
systemctl is-active --quiet openclaw-report-server.service
[[ -s "$API" && -s "$UI" ]] || { echo 'FAIL: R2 backend/wizard missing' >&2; exit 1; }
grep -q 'TURN01_R2' "$API" || { echo 'FAIL: live backend is not TURN01 R2' >&2; exit 1; }
grep -q '2026.08.22.turn01-r2-wizard' "$UI" || { echo 'FAIL: live R2 wizard missing' >&2; exit 1; }

echo '=== DOWNLOAD + OFFLINE GATES ==='
curl -fsSL "$BASE/sot-backend-turn01-r2-perf2-addon.js" -o "$TMP/perf2.js"
curl -fsSL "$BASE/sot-ui-turn01-r2-project-action-fix.js" -o "$TMP/uifix.js"
node --check "$TMP/perf2.js"; node --check "$TMP/uifix.js"

cp -a "$API" "$TMP/api.js"; cp -a "$UI" "$TMP/ui.html"
python3 - "$TMP/api.js" "$TMP/perf2.js" "$TMP/ui.html" "$TMP/uifix.js" <<'PY'
import pathlib,sys
api=pathlib.Path(sys.argv[1]);a=pathlib.Path(sys.argv[2]).read_text();ui=pathlib.Path(sys.argv[3]);u=pathlib.Path(sys.argv[4]).read_text()
s=api.read_text();h=ui.read_text();marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
if 'TURN01_R2_PERF2' not in s:s=s.replace(marker,a+'\n'+marker,1)
api.write_text(s)
if '</body></html>' not in h: raise SystemExit('wizard closing marker missing')
if 'TURN01_R2_UIFIX' not in h:h=h.replace('</body></html>','<script>\n'+u+'\n</script>\n</body></html>',1)
ui.write_text(h)
PY
node --check "$TMP/api.js"
python3 - "$TMP/ui.html" "$TMP/ui.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
for m in ['TURN01_R2_UIFIX','Opening project','Creating project']:
    if m not in h: raise SystemExit('UI action marker missing: '+m)
PY
node --check "$TMP/ui.js"

echo '=== INSTALL STEP-1 ACTION FIX ==='
STAMP="$(date +%Y%m%d-%H%M%S)";AB="$API.before-r2-project-actions-$STAMP";UB="$UI.before-r2-project-actions-$STAMP"
cp -a "$API" "$AB";cp -a "$UI" "$UB"
rollback(){ echo '=== GATE FAILED — RESTORING ===' >&2;cp -a "$AB" "$API" || true;cp -a "$UB" "$UI" || true;sudo systemctl restart openclaw-report-server.service || true;exit 1; }
trap rollback ERR
cp -a "$TMP/api.js" "$API";cp -a "$TMP/ui.html" "$UI";sudo systemctl restart openclaw-report-server.service
for i in {1..15};do sleep 1;if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null;then break;fi;done
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print(json.dumps(x,indent=2))
if x.get('status')!='ok' or 'turn01-step-aware-snapshots' not in (x.get('capabilities') or []): raise SystemExit('perf2 health gate failed')
PY

echo '=== STEP 1/2 LATENCY GATE ==='
DB="$HOME/.openclaw/sot/sot.sqlite"
TOKEN="$(sqlite3 "$DB" "SELECT project_token FROM turn01_workflow_state WHERE current_step<=2 ORDER BY current_step,updated_at DESC LIMIT 1;" 2>/dev/null || true)"
if [[ -n "$TOKEN" ]];then
 Q="$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$TOKEN")"
 T0=$(date +%s%3N);curl --max-time 5 -fsS "http://127.0.0.1:18080/api/sot/turn01/workflow/$Q" -o "$TMP/wf.json";T1=$(date +%s%3N)
 python3 - "$TMP/wf.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));s=(x.get('workflow') or {}).get('current_step');
if s not in (1,2): raise SystemExit('latency gate did not hit Step 1/2')
print('workflow step:',s,'project:',(x.get('project') or {}).get('project_name'),'sources:',len(x.get('sources') or []))
PY
 echo "step response ms: $((T1-T0))"
else
 echo 'No existing project currently at Step 1/2; skipped latency sample.'
fi

echo '=== PUBLIC UI GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-r2-wizard.html?v=20260823-r2p2"
curl --max-time 15 -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q 'TURN01_R2_UIFIX' "$TMP/public.html"
echo '=== R2 PROJECT ACTION FIX INSTALLED ==='
echo "URL: $PUBLIC"
trap - ERR
