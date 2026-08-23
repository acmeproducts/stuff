#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
UI="$ROOT/SOT/sot-dbadmin.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"
systemctl is-active --quiet openclaw-report-server.service

echo '=== DOWNLOAD + OFFLINE GATES ==='
curl -fsSL "$BASE/sot-backend-stability-admin-addon.js" -o "$TMP/addon.js"
curl -fsSL "$BASE/sot-dbadmin.html" -o "$TMP/admin.html"
node --check "$TMP/addon.js"
python3 - "$TMP/admin.html" "$TMP/ui.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
for m in ['SOT DB Admin','Backup SQLite','Dump SQL','Project source preflight','2026.08.23.stability-admin-1']:
    if m not in h: raise SystemExit('admin UI marker missing: '+m)
PY
node --check "$TMP/ui.js"

echo '=== BUILD CANDIDATE FROM CURRENT LIVE BACKEND ==='
cp -a "$API" "$TMP/api.js"
python3 - "$TMP/api.js" "$TMP/addon.js" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]);s=p.read_text();a=pathlib.Path(sys.argv[2]).read_text()
if 'global-multi-project-scheduler' not in s: raise SystemExit('current backend lacks required scheduler plumbing')
if 'SOT_STABILITY_ADMIN_BUILD' not in s:
    marker='module.exports={handle,VERSION,BUILD};'
    if marker not in s: raise SystemExit('backend export marker missing')
    s=s.replace(marker,a+'\n'+marker,1);p.write_text(s)
PY
node --check "$TMP/api.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/api.js"

echo '=== INSTALL ==='
STAMP="$(date +%Y%m%d-%H%M%S)";API_BAK="$API.before-stability-admin-$STAMP";UI_BAK=""
cp -a "$API" "$API_BAK";if [[ -f "$UI" ]]; then UI_BAK="$UI.before-stability-admin-$STAMP";cp -a "$UI" "$UI_BAK";fi
rollback(){ echo '=== STABILITY ADMIN GATE FAILED — RESTORING ===' >&2;cp -a "$API_BAK" "$API" || true;if [[ -n "$UI_BAK" && -f "$UI_BAK" ]]; then cp -a "$UI_BAK" "$UI" || true; else rm -f "$UI" || true;fi;sudo systemctl restart openclaw-report-server.service || true;exit 1; }
trap rollback ERR
cp -a "$TMP/api.js" "$API";mkdir -p "$ROOT/SOT";cp -a "$TMP/admin.html" "$UI";sudo systemctl restart openclaw-report-server.service
for i in {1..20};do sleep 1;if curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/health >/dev/null 2>&1;then break;fi;done

echo '=== DB STATUS GATE ==='
curl --max-time 20 -fsS http://127.0.0.1:18080/api/sot/admin/db/status -o "$TMP/status.json"
python3 - "$TMP/status.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print('database:',x.get('database_path'));print('size:',x.get('size'));print('integrity:',(x.get('integrity') or {}).get('result'));print('tables:',len(x.get('tables') or {}))
if not (x.get('integrity') or {}).get('ok'):raise SystemExit('database integrity gate failed')
PY

echo '=== PROJECT PREFLIGHT GATE ==='
curl --max-time 15 -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" <<'PY' > "$TMP/tokens.txt"
import json,sys
x=json.load(open(sys.argv[1]));
for p in (x.get('projects') or [])[:5]: print(p['project_token'])
PY
while read -r T;do [[ -n "$T" ]]||continue;Q="$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$T")";curl --max-time 5 -fsS "http://127.0.0.1:18080/api/sot/admin/projects/$Q/preflight" -o "$TMP/pf.json";python3 - "$TMP/pf.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print(x.get('project_name'),'=> ready=',x.get('ready'),'blocking=',x.get('blocking_count'),'warnings=',x.get('warning_count'));[(print(' ',s.get('status'),s.get('path'))) for s in x.get('sources',[]) if s.get('status')!='ready']
PY
done < "$TMP/tokens.txt"

echo '=== BACKUP + DUMP GATE ==='
curl --max-time 120 -fsS -X POST -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:18080/api/sot/admin/db/backup -o "$TMP/backup.json"
curl --max-time 120 -fsS -X POST -H 'Content-Type: application/json' -d '{}' http://127.0.0.1:18080/api/sot/admin/db/dump -o "$TMP/dump.json"
python3 - "$TMP/backup.json" "$TMP/dump.json" <<'PY'
import json,sys,os
for p in sys.argv[1:]:
 x=json.load(open(p));print(('backup' if x['path'].endswith('.sqlite') else 'dump')+':',x['path'],x['size']);
 if not x.get('ok') or not os.path.exists(x['path']) or os.path.getsize(x['path'])<1:raise SystemExit('snapshot gate failed')
PY

echo '=== PUBLIC ADMIN UI GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/sot-dbadmin.html?v=20260823-admin1"
curl --max-time 20 -fsS "$PUBLIC" -o "$TMP/public.html";grep -q 'SOT DB Admin' "$TMP/public.html";grep -q 'Project source preflight' "$TMP/public.html"

echo '=== STABILITY ADMIN INSTALLED ==='
echo 'No project workflow UI was changed.'
echo 'Legacy $RECYCLE.BIN sources are warning/skip candidates in the base collector, not fatal sources.'
echo "URL: $PUBLIC"
trap - ERR
