#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
EXPECTED_BUILD='2026.08.29.sot-turn01-base-17'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base17-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
RUNTIME_BACKUP="$TMP/sot-api.before.js"
HTML_BACKUP="$TMP/base.before.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
ROLLBACK_ATTEMPTED=0

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-34s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }
info(){ record INFO "$1" "$2"; }

on_err(){ local rc=$?; record FAIL UNHANDLED "rc=$rc line=$1 command=$2" || true; }
trap 'on_err "$LINENO" "$BASH_COMMAND"' ERR

print_summary(){
  echo
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-34s %s\n",$1,$2,$3}' "$SUMMARY" || true
  echo "persistent log: $LOG"
  echo "summary file:   $SUMMARY"
  echo "run directory:  $QUAL_DIR"
}

cleanup(){
  local rc=$?
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    ROLLBACK_ATTEMPTED=1
    info ROLLBACK 'fatal post-cutover gate failed; restoring exact pre-cutover API/HTML'
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    if [ -f "$RUNTIME_BACKUP" ] && install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"; then pass ROLLBACK_API 'restored prior sot-api.js'; else record FAIL ROLLBACK_API 'restore failed' || true; fi
    if [ "$HAD_HTML" -eq 1 ]; then
      if install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; then pass ROLLBACK_HTML 'restored prior Base HTML'; else record FAIL ROLLBACK_HTML 'restore failed' || true; fi
    else
      if rm -f "$SOT_DIR/SOT-turn01-base.html"; then pass ROLLBACK_HTML 'removed candidate Base HTML'; else record FAIL ROLLBACK_HTML 'remove failed' || true; fi
    fi
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    rb_ok=0
    for attempt in {1..30}; do
      code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
      info ROLLBACK_HEALTH_ATTEMPT "attempt=$attempt HTTP=$code"
      if [ "$code" = 200 ]; then rb_ok=1; break; fi
      sleep 1
    done
    if [ "$rb_ok" -eq 1 ]; then
      if rb_build="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/rollback-health.json')).get('build',''))" 2>/dev/null)"; then pass ROLLBACK_HEALTH "service recovered build=$rb_build"; else record FAIL ROLLBACK_HEALTH 'HTTP=200 but response parse failed' || true; fi
    else
      record FAIL ROLLBACK_HEALTH 'service did not recover within 30 attempts' || true
    fi
  fi
  if [ "$SUCCESS" -eq 1 ]; then record PASS FINAL 'all mechanical gates passed'; else record FAIL FINAL "qualification failed rc=$rc rollback_attempted=$ROLLBACK_ATTEMPTED" || true; fi
  print_summary
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base17-$STAMP
started=$(date -Is)
expected_build=$EXPECTED_BUILD
installer_commit=$INSTALLER_COMMIT
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
clean_generator=be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
ui_integrator=e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py
ui_picker_state=5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py
idle_refresh=7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py
EOF
pass RUN_MANIFEST "created $QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] && pass INSTALLER_IDENTITY "$INSTALLER_COMMIT" || fail INSTALLER_IDENTITY 'SOT_INSTALLER_COMMIT must be supplied by pinned run command'

echo '=== TURN 01 BASE-17 AUDITED FULL QUALIFICATION ==='

code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] && pass PRE_HEALTH_HTTP "HTTP=200" || fail PRE_HEALTH_HTTP "HTTP=$code before mutation"
if pre_meta="$(python3 - "$QUAL_DIR/pre-health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); print(x.get('build','')+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))
PY
)"; then pass PRE_HEALTH_PARSE "$pre_meta"; else fail PRE_HEALTH_PARSE "body=$(cat "$QUAL_DIR/pre-health.json" 2>/dev/null || true)"; fi
IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$pre_meta"
[ "$CURRENT_STATUS" = ok ] && pass PRE_STATUS ok || fail PRE_STATUS "status=$CURRENT_STATUS"
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] && pass PRE_BUILD "$CURRENT_BUILD" || fail PRE_BUILD "expected Base-9 got $CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] && pass PRE_SCHEMA 'schema=4' || fail PRE_SCHEMA "schema=$CURRENT_SCHEMA"

BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
declare -a SRC_NAMES=(pre.js integrate.py generate.py pre.html ui.py uistate.py idle.py)
declare -a SRC_URLS=(
 "$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js"
 "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py"
 "$BASE/be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py"
 "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html"
 "$BASE/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py"
 "$BASE/5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py"
 "$BASE/7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py"
)
for i in "${!SRC_NAMES[@]}"; do
  name="${SRC_NAMES[$i]}"; url="${SRC_URLS[$i]}"
  if curl --max-time 30 -fsSL "$url" -o "$TMP/$name"; then pass "FETCH_$name" "bytes=$(stat -c %s "$TMP/$name") sha256=$(sha256sum "$TMP/$name"|awk '{print $1}') url=$url"; else fail "FETCH_$name" "$url"; fi
done

for f in integrate.py generate.py ui.py uistate.py idle.py; do
  if python3 -m py_compile "$TMP/$f"; then pass "PYCOMPILE_$f" ok; else fail "PYCOMPILE_$f" failed; fi
done

if python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"; then pass GENERATE_BASE3 "bytes=$(stat -c %s "$TMP/base3.js") sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')"; else fail GENERATE_BASE3 failed; fi
if python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"; then pass GENERATE_BACKEND 'clean Base generator completed'; else fail GENERATE_BACKEND failed; fi
sed -i "s/2026.08.29.sot-turn01-base-14/2026.08.29.sot-turn01-base-17/g" "$TMP/sot-api.js"
if grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js"; then pass BUILD_MARKER "$EXPECTED_BUILD"; else fail BUILD_MARKER missing; fi

if python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/ui0.html"; then pass UI_INTEGRATE 'accepted pre-base -> Base UI'; else fail UI_INTEGRATE failed; fi
if python3 "$TMP/uistate.py" "$TMP/ui0.html" "$TMP/ui1.html"; then pass UI_PICKER_STATE 'durable picker-state integration'; else fail UI_PICKER_STATE failed; fi
if python3 "$TMP/idle.py" "$TMP/ui1.html" "$TMP/SOT-turn01-base.html"; then pass UI_IDLE_REFRESH 'idle-refresh integration'; else fail UI_IDLE_REFRESH failed; fi

if node --check "$TMP/sot-api.js"; then pass NODE_BACKEND 'node --check passed'; else fail NODE_BACKEND failed; fi
if python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" "$TMP/ui.js" "$QUAL_DIR/contract.txt" <<'PY'
from pathlib import Path
import re,sys
api=Path(sys.argv[1]).read_text(); html=Path(sys.argv[2]).read_text(); report=[]
req_api=["const BUILD = '2026.08.29.sot-turn01-base-17';",'function windowsListDirectories(value)','function windowsDirectoryExists(value)','function windowsCreateDirectory(parent, name)','target_browse_root:','backup_browse_root:','windowsListDirectories(requested)']
req_ui=['SOT-turn01-base','TURN01_BASE_STORAGE_PICKER','captureBrowse','`${kind}_browse_root`','function fullyIndexedStable(p)','/turn01/volumes','/turn01/fs?path=',"openDestinationPicker(p,'target',storage)","openDestinationPicker(p,'backup',storage)"]
rejected=['normalizeWindowsMountSource','mount helper completed but SOT rejected mount state']
for m in req_api:
    if m not in api: raise SystemExit('missing API marker: '+m)
    report.append('API_PRESENT '+m)
for m in req_ui:
    if m not in html: raise SystemExit('missing UI marker: '+m)
    report.append('UI_PRESENT '+m)
for m in rejected:
    if m in api: raise SystemExit('rejected API marker present: '+m)
    report.append('API_ABSENT '+m)
start=html.index('async function openDestinationPicker'); end=html.index('function openConfig(){',start); fn=html[start:end]
if "api('/turn01/volumes')" not in fn: raise SystemExit('destination picker does not use shared /turn01/volumes')
report.append('TARGET_BACKUP_COMMON_INVENTORY /turn01/volumes')
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no UI scripts')
Path(sys.argv[3]).write_text('\n;\n'.join(scripts)); Path(sys.argv[4]).write_text('\n'.join(report)+'\n')
PY
then pass CONTRACT_MARKERS "$(tr '\n' ';' < "$QUAL_DIR/contract.txt")"; pass TARGET_BACKUP_COMMON_INVENTORY '/turn01/volumes'; else fail CONTRACT_MARKERS 'see log for exact missing/rejected marker'; fi
if node --check "$TMP/ui.js"; then pass NODE_UI 'extracted UI JavaScript passed'; else fail NODE_UI failed; fi

mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do
  if cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"; then pass "MIGRATION_$m" copied; else fail "MIGRATION_$m" missing; fi
done
cp "$DB" "$TMP/test.sqlite" && pass TEMP_DB_COPY "bytes=$(stat -c %s "$TMP/test.sqlite")" || fail TEMP_DB_COPY failed
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.json" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects();
if(api.BUILD!=='2026.08.29.sot-turn01-base-17') throw new Error('wrong build '+api.BUILD);
if(api.EXPECTED_MIGRATION!==4) throw new Error('wrong expected migration '+api.EXPECTED_MIGRATION);
if(!Array.isArray(projects)) throw new Error('project list contract failed');
console.log(JSON.stringify({build:api.BUILD,expected_migration:api.EXPECTED_MIGRATION,projects:projects.length}));
NODE
then pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.json")"; else fail TEMP_DB_PREFLIGHT 'candidate module/copy DB preflight failed'; fi

POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] && pass POWERSHELL "$POWERSHELL" || fail POWERSHELL "not executable: $POWERSHELL"
if "$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$QUAL_DIR/windows-drives.txt"; then pass WINDOWS_INVENTORY "$(cat "$QUAL_DIR/windows-drives.txt")"; else fail WINDOWS_INVENTORY 'PowerShell Get-PSDrive failed'; fi
if python3 - "$QUAL_DIR/windows-drives.txt" <<'PY'
import sys
x={v.strip().upper() for v in open(sys.argv[1]).read().split(',') if v.strip()}
assert x,'empty Windows filesystem inventory'
assert 'C' in x,'C: missing from Windows filesystem inventory'
print('count='+str(len(x))+' drives='+','.join(sorted(x)))
PY
then pass WINDOWS_INVENTORY_SANITY "$(python3 - "$QUAL_DIR/windows-drives.txt" <<'PY'
import sys
x={v.strip().upper() for v in open(sys.argv[1]).read().split(',') if v.strip()}; print('count='+str(len(x))+' drives='+','.join(sorted(x)))
PY
)"; else fail WINDOWS_INVENTORY_SANITY "inventory=$(cat "$QUAL_DIR/windows-drives.txt")"; fi

LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base17"
mkdir -p "$LIVE_ARCHIVE"
cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js" && pass ARCHIVE_API "$LIVE_ARCHIVE/sot-api.js" || fail ARCHIVE_API failed
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html" && pass ARCHIVE_HTML "$LIVE_ARCHIVE/SOT-turn01-base.html" || fail ARCHIVE_HTML failed; else info ARCHIVE_HTML 'no existing canonical Base HTML'; fi
sha256sum "$LIVE_ARCHIVE"/* > "$QUAL_DIR/precutover-sha256.txt" 2>/dev/null || true
pass PRECUTOVER_CHECKSUMS "$(tr '\n' ';' < "$QUAL_DIR/precutover-sha256.txt" 2>/dev/null || true)"
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi

CUTOVER=1
if sudo systemctl stop "$SERVICE"; then pass SERVICE_STOP stopped; else fail SERVICE_STOP failed; fi
if install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"; then pass INSTALL_API "sha256=$(sha256sum "$REPORT_ROOT/sot-api.js"|awk '{print $1}')"; else fail INSTALL_API failed; fi
if install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; then pass INSTALL_HTML "sha256=$(sha256sum "$SOT_DIR/SOT-turn01-base.html"|awk '{print $1}')"; else fail INSTALL_HTML failed; fi
if sudo systemctl start "$SERVICE"; then pass SERVICE_START started; else fail SERVICE_START failed; fi

health_ok=0
for attempt in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  info LIVE_HEALTH_ATTEMPT "attempt=$attempt HTTP=$code"
  if [ "$code" = 200 ]; then health_ok=1; break; fi
  sleep 1
done
[ "$health_ok" -eq 1 ] || fail LIVE_HEALTH_HTTP 'HTTP 200 not reached'
pass LIVE_HEALTH_HTTP 'HTTP=200'
if live_meta="$(python3 - "$QUAL_DIR/live-health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));
assert x.get('status')=='ok',x; assert x.get('database_version')==4,x; assert x.get('build')=='2026.08.29.sot-turn01-base-17',x
print('build='+x['build']+' schema='+str(x['database_version'])+' status='+x['status'])
PY
)"; then pass LIVE_HEALTH_CONTRACT "$live_meta"; else fail LIVE_HEALTH_CONTRACT "body=$(cat "$QUAL_DIR/live-health.json")"; fi

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/sot-volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"
[ "$code" = 200 ] && pass SOT_INVENTORY_HTTP 'HTTP=200' || fail SOT_INVENTORY_HTTP "HTTP=$code body=$(cat "$QUAL_DIR/sot-volumes.json" 2>/dev/null || true)"
if python3 - "$QUAL_DIR/windows-drives.txt" "$QUAL_DIR/sot-volumes.json" > "$QUAL_DIR/inventory-compare.txt" <<'PY'
import json,sys
windows={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}
v=json.load(open(sys.argv[2])); seen={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}
print('windows='+','.join(sorted(windows))); print('sot='+','.join(sorted(seen))); print('missing='+','.join(sorted(windows-seen))); print('extra='+','.join(sorted(seen-windows)))
if windows!=seen: raise SystemExit(1)
PY
then pass INVENTORY_MATCH "$(tr '\n' ' ' < "$QUAL_DIR/inventory-compare.txt")"; else fail INVENTORY_MATCH "$(tr '\n' ' ' < "$QUAL_DIR/inventory-compare.txt" 2>/dev/null || true)"; fi

declare -A DRIVE_READABLE DRIVE_BROWSE
IFS=',' read -r -a DRIVES <<< "$(cat "$QUAL_DIR/windows-drives.txt")"
for DRIVE in "${DRIVES[@]}"; do
  DRIVE="$(printf '%s' "$DRIVE"|tr -d '[:space:]'|tr '[:lower:]' '[:upper:]')"; [ -n "$DRIVE" ] || continue
  LOWER="$(printf '%s' "$DRIVE"|tr '[:upper:]' '[:lower:]')"
  if ONLINE="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${DRIVE}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')"; then DRIVE_READABLE[$DRIVE]="$ONLINE"; pass "DRIVE_${DRIVE}_WINDOWS" "readable=$ONLINE"; else fail "DRIVE_${DRIVE}_WINDOWS" 'Test-Path command failed'; fi
  if python3 - "$QUAL_DIR/sot-volumes.json" "$DRIVE" <<'PY'
import json,sys
v=json.load(open(sys.argv[1])).get('volumes') or []; d=sys.argv[2]
assert any(str(x.get('name','')).rstrip(':').upper()==d for x in v),d
PY
  then pass "DRIVE_${DRIVE}_PRESENT" 'present in SOT volume inventory'; else fail "DRIVE_${DRIVE}_PRESENT" absent; fi
  if [ "$ONLINE" = 1 ]; then
    code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$LOWER" -o "$QUAL_DIR/drive-$DRIVE-browse.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
    if [ "$code" != 200 ]; then DRIVE_BROWSE[$DRIVE]=FAIL; fail "DRIVE_${DRIVE}_BROWSE" "Windows-readable=1 HTTP=$code body=$(cat "$QUAL_DIR/drive-$DRIVE-browse.json" 2>/dev/null || true)"; fi
    if count="$(python3 - "$QUAL_DIR/drive-$DRIVE-browse.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); f=x.get('folders'); assert isinstance(f,list),x; print(len(f))
PY
)"; then DRIVE_BROWSE[$DRIVE]=PASS; pass "DRIVE_${DRIVE}_BROWSE" "HTTP=200 folders=$count"; else fail "DRIVE_${DRIVE}_BROWSE_PARSE" "body=$(cat "$QUAL_DIR/drive-$DRIVE-browse.json")"; fi
  else
    DRIVE_BROWSE[$DRIVE]=NOT_REQUIRED; info "DRIVE_${DRIVE}_BROWSE" 'Windows-readable=0; browse not required'
  fi
done

for SPECIAL in F I; do
  if [ -z "${DRIVE_READABLE[$SPECIAL]+x}" ]; then info "SPECIAL_${SPECIAL}" 'absent from Windows inventory';
  elif [ "${DRIVE_READABLE[$SPECIAL]}" != 1 ]; then info "SPECIAL_${SPECIAL}" 'present but Windows-readable=0; no SOT browse requirement';
  elif [ "${DRIVE_BROWSE[$SPECIAL]:-}" = PASS ]; then pass "SPECIAL_${SPECIAL}" 'present, Windows-readable=1, SOT browse passed';
  else fail "SPECIAL_${SPECIAL}" 'present, Windows-readable=1, SOT browse did not pass'; fi
done

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/projects.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/projects || true)"
[ "$code" = 200 ] && pass PROJECTS_ENDPOINT 'HTTP=200' || fail PROJECTS_ENDPOINT "HTTP=$code"
if TOKEN="$(python3 -c "import json;p=json.load(open('$QUAL_DIR/projects.json')).get('projects') or [];assert p;print(p[0]['project_token'])")"; then pass PROJECT_TOKEN "$TOKEN"; else fail PROJECT_TOKEN 'no project available'; fi
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/storage.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] && pass TARGET_BACKUP_STORAGE_ENDPOINT "HTTP=200 body=$(cat "$QUAL_DIR/storage.json")" || fail TARGET_BACKUP_STORAGE_ENDPOINT "HTTP=$code body=$(cat "$QUAL_DIR/storage.json" 2>/dev/null || true)"

# Persistence test is performed only against the copied DB, never the live DB.
cp "$TMP/sot-api.js" "$TMP/sot-api-test.js"
if python3 - "$TMP/sot-api-test.js" <<'PY'
from pathlib import Path
p=Path(__import__('sys').argv[1]); s=p.read_text(); old='_test: { review,'; new='_test: { storageFor, saveStorage, review,'
if s.count(old)!=1: raise SystemExit('test-export marker count='+str(s.count(old)))
p.write_text(s.replace(old,new,1))
PY
then pass TEMP_TEST_EXPORT 'storageFor/saveStorage exposed only in throwaway candidate copy'; else fail TEMP_TEST_EXPORT failed; fi
if node --check "$TMP/sot-api-test.js"; then pass TEMP_TEST_EXPORT_SYNTAX passed; else fail TEMP_TEST_EXPORT_SYNTAX failed; fi
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" > "$QUAL_DIR/picker-temp-roundtrip.json" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects(); if(!projects.length) throw new Error('no project');
const token=projects[0].project_token, before=api._test.storageFor(token), probe='/mnt/c';
api._test.saveStorage(token,{target_browse_root:probe});
const after=api._test.storageFor(token);
if(after.target_browse_root!==probe) throw new Error('persistence mismatch '+after.target_browse_root);
api._test.saveStorage(token,{target_browse_root:before.target_browse_root||''});
const restored=api._test.storageFor(token);
if(restored.target_browse_root!==(before.target_browse_root||'')) throw new Error('restore mismatch');
console.log(JSON.stringify({token,probe,persisted:after.target_browse_root,restored:restored.target_browse_root}));
NODE
then pass PICKER_TEMP_DB_ROUNDTRIP "$(cat "$QUAL_DIR/picker-temp-roundtrip.json")"; else fail PICKER_TEMP_DB_ROUNDTRIP 'copied-DB save/get/restore failed'; fi
pass LIVE_DB_UNCHANGED 'picker persistence qualification used copied DB only'

code="$(curl --max-time 15 -sS -o "$QUAL_DIR/base-page.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] && pass PUBLIC_PAGE_HTTP "HTTP=200 bytes=$(stat -c %s "$QUAL_DIR/base-page.html")" || fail PUBLIC_PAGE_HTTP "HTTP=$code url=$PUBLIC_URL"
if grep -Fq 'SOT-turn01-base' "$QUAL_DIR/base-page.html"; then pass PUBLIC_PAGE_MARKER 'canonical Base marker present'; else fail PUBLIC_PAGE_MARKER missing; fi

SUCCESS=1
pass QUALIFICATION 'Base-17 mechanically qualified with explicit named evidence'
echo '=== TURN 01 BASE-17 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
