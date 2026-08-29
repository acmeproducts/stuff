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
EXPECTED_BUILD='2026.08.29.sot-turn01-base-14'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
RUNTIME_BACKUP="$TMP/sot-api.before-base14.js"
HTML_BACKUP="$TMP/base.before-base14.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0

# Frozen accepted sources only. Base-10..13 generated candidates are not inputs.
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py'
BASE14_GENERATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py'
UI_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html'
UI_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py'
UI_STATE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py'
IDLE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py'

cleanup(){
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    echo
    echo '=== BASE-14 GATE FAILED — AUTOMATIC ROLLBACK ==='
    sudo systemctl stop "$SERVICE" || true
    [ -f "$RUNTIME_BACKUP" ] && install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"
    if [ "$HAD_HTML" -eq 1 ] && [ -f "$HTML_BACKUP" ]; then
      install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"
    else
      rm -f "$SOT_DIR/SOT-turn01-base.html"
    fi
    sudo systemctl start "$SERVICE" || true
    sleep 1
    echo 'rollback health:'
    curl -sS http://127.0.0.1:18080/api/sot/health || true
    echo
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT"

echo '=== TURN 01 BASE-14 CLEAN REBUILD ==='
CURRENT_BUILD="$(curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('build',''))" 2>/dev/null || true)"
echo "current live build: ${CURRENT_BUILD:-unavailable}"
if [ "$CURRENT_BUILD" = '2026.08.29.sot-turn01-base-12' ]; then
  ACCEPTED_ARCHIVE="$(find "$ARCHIVE_ROOT" -maxdepth 1 -type d -name '*-turn01-accepted-before-base12' -printf '%T@ %p\n' 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2-)"
  [ -n "$ACCEPTED_ARCHIVE" ] || { echo 'Base-12 is live but accepted-before-base12 archive is missing'; false; }
  echo "restoring accepted Base-9 before rebuild: $ACCEPTED_ARCHIVE"
  sudo systemctl stop "$SERVICE"
  install -m 0644 "$ACCEPTED_ARCHIVE/sot-api.js" "$REPORT_ROOT/sot-api.js"
  if [ -f "$ACCEPTED_ARCHIVE/SOT-turn01-base.html" ]; then install -m 0644 "$ACCEPTED_ARCHIVE/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; else rm -f "$SOT_DIR/SOT-turn01-base.html"; fi
  sudo systemctl start "$SERVICE"
  for attempt in {1..30}; do curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/rollback-health.json" && break; sleep 1; done
  CURRENT_BUILD="$(python3 -c "import json; print(json.load(open('$TMP/rollback-health.json')).get('build',''))")"
fi
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] || { echo "refusing Base-14 rebuild from unexpected live build: $CURRENT_BUILD"; false; }

echo '=== FETCH FROZEN SOURCES ==='
curl --max-time 30 -fsSL "$BACKEND_PREBASE_URL" -o "$TMP/pre.js"
curl --max-time 30 -fsSL "$BACKEND_INTEGRATOR_URL" -o "$TMP/integrate.py"
curl --max-time 30 -fsSL "$BASE14_GENERATOR_URL" -o "$TMP/base14.py"
curl --max-time 30 -fsSL "$UI_PREBASE_URL" -o "$TMP/pre.html"
curl --max-time 30 -fsSL "$UI_INTEGRATOR_URL" -o "$TMP/ui-integrate.py"
curl --max-time 30 -fsSL "$UI_STATE_PATCH_URL" -o "$TMP/ui-state.py"
curl --max-time 30 -fsSL "$IDLE_PATCH_URL" -o "$TMP/idle.py"
python3 -m py_compile "$TMP/integrate.py" "$TMP/base14.py" "$TMP/ui-integrate.py" "$TMP/ui-state.py" "$TMP/idle.py"

echo '=== GENERATE FROM CLEAN BASE-3 ==='
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"
python3 "$TMP/base14.py" "$TMP/base3.js" "$TMP/sot-api.js"
python3 "$TMP/ui-integrate.py" "$TMP/pre.html" "$TMP/base-ui0.html"
python3 "$TMP/ui-state.py" "$TMP/base-ui0.html" "$TMP/base-ui1.html"
python3 "$TMP/idle.py" "$TMP/base-ui1.html" "$TMP/SOT-turn01-base.html"

node --check "$TMP/sot-api.js"
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
api=Path(sys.argv[1]).read_text(); html=Path(sys.argv[2]).read_text()
for marker in [
 "const BUILD = '2026.08.29.sot-turn01-base-14';",
 'function windowsListDirectories(value)',
 'function windowsDirectoryExists(value)',
 'target_browse_root:', 'backup_browse_root:',
 'windowsListDirectories(requested)'
]: assert marker in api,marker
for rejected in ['normalizeWindowsMountSource','mount helper completed but SOT rejected mount state']:
 assert rejected not in api,rejected
for marker in ['SOT-turn01-base','TURN01_BASE_STORAGE_PICKER','captureBrowse','`${kind}_browse_root`','function fullyIndexedStable(p)']:
 assert marker in html,marker
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I); assert scripts
Path(sys.argv[3]).write_text('\n;\n'.join(scripts))
print('generated-source contract: ok')
PY
node --check "$TMP/ui.js"

echo '=== TEMP DATABASE / API PREFLIGHT ==='
mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do cp -a "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"; done
cp -a "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects();
if(!Array.isArray(projects)) throw new Error('project list contract failed');
if(api.BUILD!=='2026.08.29.sot-turn01-base-14') throw new Error('wrong candidate build');
console.log('temp DB/API preflight: ok; projects:',projects.length,'build:',api.BUILD);
NODE

echo '=== ARCHIVE ACCEPTED LIVE BASE-9 BEFORE CUTOVER ==='
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base14"
mkdir -p "$LIVE_ARCHIVE"
cp -a "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp -a "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"
printf '%s\n' 'Accepted Base-9 live state immediately before governed Base-14 cutover.' > "$LIVE_ARCHIVE/ARCHIVE-MANIFEST.txt"
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi

CUTOVER=1
echo '=== INSTALL BASE-14 CANDIDATE ==='
sudo systemctl stop "$SERVICE"
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"

HEALTH_OK=0
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"; then HEALTH_OK=1; break; fi
  sleep 1
done
[ "$HEALTH_OK" -eq 1 ] || { echo 'live health never became ready'; false; }
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok',x; assert x.get('database_version')==4,x; assert x.get('build')=='2026.08.29.sot-turn01-base-14',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY

echo '=== WINDOWS DISCOVERY + NATIVE FOLDER BROWSE GATE ==='
POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] || { echo "PowerShell unavailable: $POWERSHELL"; false; }
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows.txt"
curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/windows.txt" "$TMP/volumes.json" <<'PY'
import json,sys
windows={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}
v=json.load(open(sys.argv[2])); assert v.get('build')=='2026.08.29.sot-turn01-base-14',v
seen={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}
assert windows <= seen,(windows,seen)
print('Windows drives:',','.join(sorted(windows)))
print('SOT drives:',','.join(sorted(seen)))
PY
IFS=',' read -r -a DRIVES <<< "$(cat "$TMP/windows.txt")"
for DRIVE in "${DRIVES[@]}"; do
  DRIVE="$(printf '%s' "$DRIVE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')"
  [ -n "$DRIVE" ] || continue
  LOWER="$(printf '%s' "$DRIVE" | tr '[:upper:]' '[:lower:]')"
  WIN_ONLINE="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${DRIVE}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')"
  echo "--- $DRIVE: Windows-readable=$WIN_ONLINE ---"
  if [ "$WIN_ONLINE" = '1' ]; then
    HTTP_CODE="$(curl --max-time 25 -sSG --data-urlencode "path=/mnt/$LOWER" -o "$TMP/$DRIVE-folders.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
    [ "$HTTP_CODE" = '200' ] || { echo "FAIL: Windows can browse $DRIVE: but SOT folder API returned $HTTP_CODE"; cat "$TMP/$DRIVE-folders.json"; false; }
    python3 - "$TMP/$DRIVE-folders.json" "$DRIVE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert isinstance(x.get('folders'),list),x
print(sys.argv[2]+': folder API OK; folders:',len(x['folders']))
PY
  fi
done

echo '=== PICKER STATE DATABASE ROUND-TRIP GATE ==='
curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" "$TMP/project-token.txt" <<'PY'
import json,sys
p=json.load(open(sys.argv[1])).get('projects') or []
assert p,'no project available for persistence round-trip'
open(sys.argv[2],'w').write(str(p[0]['project_token']))
PY
TOKEN="$(cat "$TMP/project-token.txt")"
curl --max-time 10 -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" -o "$TMP/storage-before.json"
python3 - "$TMP/storage-before.json" "$TMP/volumes.json" "$TMP/persist.json" <<'PY'
import json,sys
before=json.load(open(sys.argv[1])); vols=json.load(open(sys.argv[2])).get('volumes') or []
probe=next((v['path'] for v in vols if v.get('kind')=='drive'),None) or (vols[0]['path'] if vols else None)
assert probe,'no volume available for persistence gate'
open(sys.argv[3],'w').write(json.dumps({'before':before,'probe':probe}))
PY
PROBE="$(python3 -c "import json; print(json.load(open('$TMP/persist.json'))['probe'])")"
python3 - "$PROBE" "$TMP/probe.json" <<'PY'
import json,sys
open(sys.argv[2],'w').write(json.dumps({'target_browse_root':sys.argv[1]}))
PY
curl --max-time 10 -fsS -X PUT -H 'Content-Type: application/json' --data-binary "@$TMP/probe.json" "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" >/dev/null
curl --max-time 10 -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" -o "$TMP/storage-after.json"
python3 - "$TMP/storage-after.json" "$PROBE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('target_browse_root')==sys.argv[2],x
print('picker state persisted:',x['target_browse_root'])
PY
ORIGINAL="$(python3 -c "import json; print(json.load(open('$TMP/persist.json'))['before'].get('target_browse_root',''))")"
python3 - "$ORIGINAL" "$TMP/restore.json" <<'PY'
import json,sys
open(sys.argv[2],'w').write(json.dumps({'target_browse_root':sys.argv[1]}))
PY
curl --max-time 10 -fsS -X PUT -H 'Content-Type: application/json' --data-binary "@$TMP/restore.json" "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" >/dev/null

SUCCESS=1
echo '=== TURN 01 BASE-14 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
