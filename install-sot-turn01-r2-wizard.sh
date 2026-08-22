#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
OUT_UI="$ROOT/SOT/sot-turn01-r2-wizard.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BUILD=2026.08.22.turn01-r2-wizard
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
systemctl is-active --quiet openclaw-report-server.service

BASE_API=""
while IFS= read -r f; do
  [[ -n "$f" ]] || continue
  case "$f" in *.before-turn01-r1-*|*.before-turn01-r2-*) continue;; esac
  grep -q '2026.08.20.6.9.1-wsl-path-centric-analysis' "$f" || continue
  grep -q 'TURN01_BUILD' "$f" && continue
  grep -q 'TURN01_R1_BUILD' "$f" && continue
  grep -q 'TURN01_R2_BUILD' "$f" && continue
  BASE_API="$f";break
done < <(ls -1t "$API".before-turn01-* 2>/dev/null || true)
[[ -n "$BASE_API" ]] || { echo 'FAIL: no clean pre-TURN01 6.9.1 backend backup found' >&2; exit 1; }
echo "Recovery base backend: $BASE_API"

echo '=== DOWNLOAD + OFFLINE GATES ==='
for f in sot-backend-turn01-prebase-addon.js sot-backend-turn01-r1-bridge-addon.js sot-backend-turn01-r2-workflow-addon.js sot-turn01-r2-wizard.html sot-ui-turn01-r2-preinstall-fix.js; do curl -fsSL "$BASE/$f" -o "$TMP/$f"; done
for f in sot-backend-turn01-prebase-addon.js sot-backend-turn01-r1-bridge-addon.js sot-backend-turn01-r2-workflow-addon.js sot-ui-turn01-r2-preinstall-fix.js; do node --check "$TMP/$f"; done
python3 - "$TMP/sot-turn01-r2-wizard.html" "$TMP/sot-ui-turn01-r2-preinstall-fix.js" "$TMP/ui.js" <<'PY'
import re,sys,pathlib
p=pathlib.Path(sys.argv[1]);fix=pathlib.Path(sys.argv[2]).read_text();h=p.read_text()
if '</body></html>' not in h: raise SystemExit('wizard closing marker missing')
h=h.replace('</body></html>','<script>\n'+fix+'\n</script>\n</body></html>',1);p.write_text(h)
pathlib.Path(sys.argv[3]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
for marker in ['1. Project','2. Sources','3. Process','4. Review','5. Plan','6. Execute','7. Certify','2026.08.22.turn01-r2-wizard']:
    if marker not in h: raise SystemExit('UI marker missing: '+marker)
PY
node --check "$TMP/ui.js"

echo '=== RECONSTRUCT BACKEND FROM CLEAN 6.9.1 ==='
cp -a "$BASE_API" "$TMP/sot-api.candidate.js"
python3 - "$TMP/sot-api.candidate.js" "$TMP" <<'PY'
import pathlib,sys
api=pathlib.Path(sys.argv[1]);T=pathlib.Path(sys.argv[2]);s=api.read_text()
if '2026.08.20.6.9.1-wsl-path-centric-analysis' not in s: raise SystemExit('6.9.1 marker missing')
if any(x in s for x in ['TURN01_BUILD','TURN01_R1_BUILD','TURN01_R2_BUILD']): raise SystemExit('contaminated recovery base')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
parts=[(T/x).read_text() for x in ['sot-backend-turn01-prebase-addon.js','sot-backend-turn01-r1-bridge-addon.js','sot-backend-turn01-r2-workflow-addon.js']]
s=s.replace(marker,'\n'.join(parts)+'\n'+marker,1);api.write_text(s)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"

echo '=== INSTALL R2 CANDIDATE ==='
STAMP="$(date +%Y%m%d-%H%M%S)";API_BAK="$API.before-turn01-r2-$STAMP";UI_BAK=""
cp -a "$API" "$API_BAK";if [[ -f "$OUT_UI" ]]; then UI_BAK="$OUT_UI.before-turn01-r2-$STAMP";cp -a "$OUT_UI" "$UI_BAK";fi
rollback(){ echo '=== R2 GATE FAILED — RESTORING PRE-R2 STATE ===' >&2;cp -a "$API_BAK" "$API" || true;if [[ -n "$UI_BAK" && -f "$UI_BAK" ]]; then cp -a "$UI_BAK" "$OUT_UI" || true; else rm -f "$OUT_UI" || true;fi;sudo systemctl restart openclaw-report-server.service || true;exit 1; }
trap rollback ERR
mkdir -p "$ROOT/SOT";cp -a "$TMP/sot-api.candidate.js" "$API";cp -a "$TMP/sot-turn01-r2-wizard.html" "$OUT_UI";sudo systemctl restart openclaw-report-server.service
for i in {1..20}; do sleep 1;if curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null;then break;fi;done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1]);
if not p.exists(): raise SystemExit('no health response')
x=json.loads(p.read_text());
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('wrong build: '+repr(x))
if 'turn01-linear-workflow-controller' not in (x.get('capabilities') or []): raise SystemExit('workflow controller capability missing')
print(json.dumps(x,indent=2))
PY

echo '=== REAL CORPUS + WORKFLOW GATE ==='
curl --max-time 15 -fsS http://127.0.0.1:18080/api/sot/turn01/r1/evidence-status -o "$TMP/evidence.json"
curl --max-time 15 -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"
python3 - "$TMP/evidence.json" "$TMP/projects.json" <<'PY' > "$TMP/token.txt"
import json,sys
e=json.load(open(sys.argv[1]));p=json.load(open(sys.argv[2]));i=e.get('intelligence') or {}
if e.get('projects',0)<1 or e.get('sources',0)<1: raise SystemExit('real project/source corpus missing')
if i.get('observations',0)<1 or i.get('unique_content',0)<1: raise SystemExit('real corpus evidence missing')
ps=p.get('projects') or []
if not ps: raise SystemExit('no project available for workflow gate')
print(ps[0]['project_token'])
PY
TOKEN="$(tail -1 "$TMP/token.txt")";Q="$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$TOKEN")"
curl --max-time 15 -fsS "http://127.0.0.1:18080/api/sot/turn01/workflow/$Q" -o "$TMP/workflow.json"
python3 - "$TMP/workflow.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));w=x.get('workflow') or {};g=x.get('gates') or {}
if w.get('current_step') not in range(1,8): raise SystemExit('invalid workflow step')
if len(x.get('sources') or [])<1: raise SystemExit('workflow project has no sources')
if (x.get('intelligence') or {}).get('observations',0)<1: raise SystemExit('workflow snapshot exposes no evidence')
for n in map(str,range(1,8)):
    if n not in g and int(n) not in g: raise SystemExit('missing gate '+n)
print('workflow step:',w.get('current_step'),w.get('step_name'),'sources:',len(x.get('sources') or []),'observations:',x['intelligence']['observations'],'plan items:',len((x.get('plan') or {}).get('items') or []))
PY

echo '=== PUBLIC WIZARD GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-r2-wizard.html?v=20260822-r2"
curl --max-time 20 -fsS "$PUBLIC" -o "$TMP/public.html"
for m in '1. Project' '2. Sources' '3. Process' '4. Review' '5. Plan' '6. Execute' '7. Certify'; do grep -q "$m" "$TMP/public.html";done

echo '=== TURN01 R2 WIZARD INSTALLED ==='
echo "Backend: $BUILD"
echo 'Workflow: one linear controller; one forward action; one-step Back only.'
echo 'Existing project.html and R1 artifact remain untouched.'
echo "URL: $PUBLIC"
trap - ERR
