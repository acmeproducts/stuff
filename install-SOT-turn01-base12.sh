#!/usr/bin/env bash
set -euo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
EXPECTED_BUILD='2026.08.29.sot-turn01-base-12'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
RUNTIME_BACKUP="$TMP/sot-api.before-base12.js"
HTML_BACKUP="$TMP/base.before-base12.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py'
DISCOVERY_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/2a00af5bd7f033b45c8faf161babf79cf86b06d9/patch-SOT-turn01-base-discovery-authority.py'
UI_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html'
UI_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py'
IDLE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py'
cleanup(){
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    echo '=== BASE-12 GATE FAILED — AUTOMATIC ROLLBACK ==='
    sudo systemctl stop "$SERVICE" || true
    cp -a "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"
    if [ "$HAD_HTML" -eq 1 ]; then cp -a "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; else rm -f "$SOT_DIR/SOT-turn01-base.html"; fi
    sudo systemctl start "$SERVICE" || true
    sleep 1
    curl -sS http://127.0.0.1:18080/api/sot/health || true; echo
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT"
echo '=== TURN 01 BASE-12 CLEAN DISCOVERY-AUTHORITY REBUILD ==='
curl -fsSL "$BACKEND_PREBASE_URL" -o "$TMP/pre.js"
curl -fsSL "$BACKEND_INTEGRATOR_URL" -o "$TMP/integrate.py"
curl -fsSL "$DISCOVERY_PATCH_URL" -o "$TMP/discovery.py"
curl -fsSL "$UI_PREBASE_URL" -o "$TMP/pre.html"
curl -fsSL "$UI_INTEGRATOR_URL" -o "$TMP/ui.py"
curl -fsSL "$IDLE_PATCH_URL" -o "$TMP/idle.py"
python3 -m py_compile "$TMP/integrate.py" "$TMP/discovery.py" "$TMP/ui.py" "$TMP/idle.py"
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"
python3 "$TMP/discovery.py" "$TMP/base3.js" "$TMP/sot-api.js"
python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/base-ui.html"
python3 "$TMP/idle.py" "$TMP/base-ui.html" "$TMP/SOT-turn01-base.html"
node --check "$TMP/sot-api.js"
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys,re
api=Path(sys.argv[1]).read_text(); html=Path(sys.argv[2]).read_text()
for marker in ["const BUILD = '2026.08.29.sot-turn01-base-12';",'const locations = windowsDriveLetters().map(volumeRecord);','Windows discovery is authoritative for volume existence.']:
    assert marker in api, marker
for rejected in ['normalizeWindowsMountSource','mount helper completed but SOT rejected mount state']:
    assert rejected not in api, rejected
for marker in ['SOT-turn01-base','TURN01_BASE_STORAGE_PICKER','/turn01/volumes','/turn01/fs?path=','function fullyIndexedStable(p)']:
    assert marker in html, marker
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I); assert scripts
Path(sys.argv[1]+'.ui.js').write_text('\n;\n'.join(scripts))
print('generated-source contract: ok')
PY
node --check "$TMP/sot-api.js.ui.js"
echo '=== TEMP DATABASE / API PREFLIGHT ==='
mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do cp -a "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"; done
cp -a "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]); const projects=api._test.listProjects();
if(!Array.isArray(projects)) throw new Error('project list contract failed');
if(api.BUILD!=='2026.08.29.sot-turn01-base-12') throw new Error('wrong build');
console.log('temp DB/API preflight: ok; projects:',projects.length,'build:',api.BUILD);
NODE
echo '=== ARCHIVE ACCEPTED LIVE STATE BEFORE CUTOVER ==='
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-accepted-before-base12"
mkdir -p "$LIVE_ARCHIVE"; cp -a "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp -a "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"
printf '%s\n' 'Accepted live state immediately before clean Base-12 cutover.' > "$LIVE_ARCHIVE/ARCHIVE-MANIFEST.txt"
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi
CUTOVER=1
sudo systemctl stop "$SERVICE"
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"
for attempt in {1..30}; do curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" && break; sleep 1; done
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok',x; assert x.get('database_version')==4,x; assert x.get('build')=='2026.08.29.sot-turn01-base-12',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY
echo '=== DYNAMIC VOLUME INVENTORY GATE ==='
POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows.txt"
curl -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/windows.txt" "$TMP/volumes.json" <<'PY'
import json,sys
windows={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}
v=json.load(open(sys.argv[2])); assert v.get('build')=='2026.08.29.sot-turn01-base-12',v
seen={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}
assert windows <= seen,(windows,seen)
print('Windows drives:',','.join(sorted(windows)))
print('SOT discovered drives:',','.join(sorted(seen)))
PY
SUCCESS=1
echo '=== TURN 01 BASE-12 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
