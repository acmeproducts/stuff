#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
EXPECTED_BUILD='2026.08.29.sot-turn01-base-20'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base20-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
RUNTIME_BACKUP="$TMP/sot-api.before.js"
HTML_BACKUP="$TMP/base.before.html"
WINDOWS_TEST_PATH=''
HAD_HTML=0
CUTOVER=0
SUCCESS=0
ROLLBACK_ATTEMPTED=0

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-36s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }
info(){ record INFO "$1" "$2"; }
trap 'rc=$?; record FAIL UNHANDLED "rc=$rc line=$LINENO command=$BASH_COMMAND" || true' ERR

cleanup_windows_test(){
  [ -n "$WINDOWS_TEST_PATH" ] || return 0
  local ps=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
  if [ -x "$ps" ]; then
    printf '%s' "$WINDOWS_TEST_PATH" | "$ps" -NoProfile -NonInteractive -Command '$p=[Console]::In.ReadToEnd(); if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force -Recurse -ErrorAction SilentlyContinue }' >/dev/null 2>&1 || true
  fi
}

print_summary(){
  echo
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-36s %s\n",$1,$2,$3}' "$SUMMARY" || true
  echo "persistent log: $LOG"
  echo "summary file:   $SUMMARY"
  echo "run directory:  $QUAL_DIR"
}

cleanup(){
  local rc=$?
  cleanup_windows_test
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
    rb=0
    for i in {1..30}; do
      code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
      info ROLLBACK_HEALTH_ATTEMPT "attempt=$i HTTP=$code"
      if [ "$code" = 200 ]; then rb=1; break; fi
      sleep 1
    done
    if [ "$rb" -eq 1 ]; then
      if rb_build="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/rollback-health.json')).get('build',''))")"; then pass ROLLBACK_HEALTH "service recovered build=$rb_build"; else record FAIL ROLLBACK_HEALTH 'HTTP=200 but body parse failed' || true; fi
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
run_id=turn01-base20-$STAMP
started=$(date -Is)
expected_build=$EXPECTED_BUILD
installer_commit=$INSTALLER_COMMIT
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
direct_generator=0e31ce5ad9e82aa7e7065ce92d05d0d967de32e4/generate-SOT-turn01-base20.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
ui_integrator=e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py
ui_picker_state=5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py
idle_refresh=7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] && pass INSTALLER_IDENTITY "$INSTALLER_COMMIT" || fail INSTALLER_IDENTITY 'pinned installer identity required'

echo '=== TURN 01 BASE-20 DIRECT CLEAN STDIN QUALIFICATION ==='

code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] && pass PRE_HEALTH_HTTP 'HTTP=200' || fail PRE_HEALTH_HTTP "HTTP=$code before mutation"
if meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" 2>&1)"; then pass PRE_HEALTH_PARSE "$meta"; else fail PRE_HEALTH_PARSE "$meta"; fi
IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] && pass PRE_BUILD "$CURRENT_BUILD" || fail PRE_BUILD "expected Base-9 got=$CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] && pass PRE_SCHEMA 'schema=4' || fail PRE_SCHEMA "schema=$CURRENT_SCHEMA"
[ "$CURRENT_STATUS" = ok ] && pass PRE_STATUS ok || fail PRE_STATUS "status=$CURRENT_STATUS"

BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
declare -a NAMES=(pre.js integrate.py generate.py pre.html ui.py uistate.py idle.py)
declare -a URLS=(
 "$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js"
 "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py"
 "$BASE/0e31ce5ad9e82aa7e7065ce92d05d0d967de32e4/generate-SOT-turn01-base20.py"
 "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html"
 "$BASE/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py"
 "$BASE/5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py"
 "$BASE/7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py"
)
for i in "${!NAMES[@]}"; do
  n="${NAMES[$i]}"; u="${URLS[$i]}"
  if curl --max-time 30 -fsSL "$u" -o "$TMP/$n"; then pass "FETCH_$n" "bytes=$(stat -c %s "$TMP/$n") sha256=$(sha256sum "$TMP/$n"|awk '{print $1}') url=$u"; else fail "FETCH_$n" "$u"; fi
done
for f in integrate.py generate.py ui.py uistate.py idle.py; do
  if python3 -m py_compile "$TMP/$f"; then pass "PYCOMPILE_$f" ok; else fail "PYCOMPILE_$f" failed; fi
done

if python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"; then pass GENERATE_BASE3 "bytes=$(stat -c %s "$TMP/base3.js") sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')"; else fail GENERATE_BASE3 failed; fi
if python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"; then pass GENERATE_BASE20 "bytes=$(stat -c %s "$TMP/sot-api.js") sha256=$(sha256sum "$TMP/sot-api.js"|awk '{print $1}')"; else fail GENERATE_BASE20 failed; fi
if python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/ui0.html"; then pass UI_INTEGRATE 'accepted pre-base -> Base UI'; else fail UI_INTEGRATE failed; fi
if python3 "$TMP/uistate.py" "$TMP/ui0.html" "$TMP/ui1.html"; then pass UI_PICKER_STATE 'durable picker state applied'; else fail UI_PICKER_STATE failed; fi
if python3 "$TMP/idle.py" "$TMP/ui1.html" "$TMP/SOT-turn01-base.html"; then pass UI_IDLE_REFRESH 'idle refresh suppression applied'; else fail UI_IDLE_REFRESH failed; fi

if node --check "$TMP/sot-api.js"; then pass NODE_BACKEND ok; else fail NODE_BACKEND failed; fi
for bad in '$args[0]' '$args[1]' '$env:SOT_PATH' '$env:SOT_NAME'; do if grep -Fq "$bad" "$TMP/sot-api.js"; then fail REJECTED_PS_TRANSPORT "survived=$bad"; fi; done
pass REJECTED_PS_TRANSPORT 'positional and implicit environment transports absent'
grep -Fq '[Console]::In.ReadToEnd()' "$TMP/sot-api.js" && pass PS_STDIN_READER present || fail PS_STDIN_READER missing
grep -Fq 'input:winPath' "$TMP/sot-api.js" && pass NODE_STDIN_PATH present || fail NODE_STDIN_PATH missing
grep -Fq 'input:payload' "$TMP/sot-api.js" && pass NODE_STDIN_JSON present || fail NODE_STDIN_JSON missing
grep -Fq 'ConvertFrom-Json' "$TMP/sot-api.js" && pass PS_JSON_PARSE present || fail PS_JSON_PARSE missing
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js" && pass BUILD_MARKER "$EXPECTED_BUILD" || fail BUILD_MARKER missing

if python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" "$QUAL_DIR/ui-contract.txt" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); report=[]
for m in ['SOT-turn01-base','TURN01_BASE_STORAGE_PICKER','captureBrowse','`${kind}_browse_root`','function fullyIndexedStable(p)','/turn01/volumes','/turn01/fs?path=',"openDestinationPicker(p,'target',storage)","openDestinationPicker(p,'backup',storage)"]:
    if m not in h: raise SystemExit('missing UI marker: '+m)
    report.append('PRESENT '+m)
start=h.index('async function openDestinationPicker'); end=h.index('function openConfig(){',start); fn=h[start:end]
if "api('/turn01/volumes')" not in fn: raise SystemExit('picker does not use common /turn01/volumes inventory')
report.append('COMMON_INVENTORY /turn01/volumes')
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)
if not scripts: raise SystemExit('no UI scripts')
Path(sys.argv[2]).write_text('\n;\n'.join(scripts)); Path(sys.argv[3]).write_text('\n'.join(report)+'\n')
PY
then pass UI_CONTRACT "$(tr '\n' ';' < "$QUAL_DIR/ui-contract.txt")"; pass TARGET_BACKUP_COMMON_INVENTORY '/turn01/volumes'; else fail UI_CONTRACT 'see preceding diagnostic'; fi
if node --check "$TMP/ui.js"; then pass NODE_UI ok; else fail NODE_UI failed; fi

mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do
  if cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/$m"; then pass "MIGRATION_$m" copied; else fail "MIGRATION_$m" failed; fi
done
if cp "$DB" "$TMP/test.sqlite"; then pass TEMP_DB_COPY "bytes=$(stat -c %s "$TMP/test.sqlite")"; else fail TEMP_DB_COPY failed; fi
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(api.BUILD!=='2026.08.29.sot-turn01-base-20') throw Error('build='+api.BUILD); if(api.EXPECTED_MIGRATION!==4) throw Error('migration='+api.EXPECTED_MIGRATION); if(!Array.isArray(p)) throw Error('projects-not-array'); console.log(JSON.stringify({build:api.BUILD,migration:api.EXPECTED_MIGRATION,projects:p.length}));
NODE
then pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.json")"; else fail TEMP_DB_PREFLIGHT 'candidate/copy DB preflight failed'; fi

POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] && pass POWERSHELL "$POWERSHELL" || fail POWERSHELL missing
if "$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$QUAL_DIR/windows-drives.txt"; then pass WINDOWS_INVENTORY_COMMAND ok; else fail WINDOWS_INVENTORY_COMMAND failed; fi
WIN="$(cat "$QUAL_DIR/windows-drives.txt")"
[ -n "$WIN" ] && pass WINDOWS_INVENTORY "$WIN" || fail WINDOWS_INVENTORY empty
if sanity="$(python3 - "$QUAL_DIR/windows-drives.txt" <<'PY'
import sys
x=[v.strip().upper() for v in open(sys.argv[1]).read().split(',') if v.strip()]
if not x or 'C' not in x or len(x)!=len(set(x)): raise SystemExit('invalid inventory '+repr(x))
print('count='+str(len(x))+' drives='+','.join(x))
PY
)"; then pass WINDOWS_INVENTORY_SANITY "$sanity"; else fail WINDOWS_INVENTORY_SANITY "$sanity"; fi

: > "$QUAL_DIR/readable-drives.txt"
IFS=',' read -r -a DRIVES <<< "$WIN"
for D in "${DRIVES[@]}"; do
  D="$(echo "$D"|tr -d '[:space:]'|tr '[:lower:]' '[:upper:]')"; [ -n "$D" ] || continue
  if R="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${D}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')"; then
    if [ "$R" = 1 ]; then echo "$D" >> "$QUAL_DIR/readable-drives.txt"; pass "DRIVE_${D}_WINDOWS" readable=1; else info "DRIVE_${D}_WINDOWS" readable=0; fi
  else fail "DRIVE_${D}_WINDOWS" 'PowerShell Test-Path command failed'; fi
done

if cp "$TMP/sot-api.js" "$TMP/sot-api-test.js"; then pass TEMP_TEST_COPY ok; else fail TEMP_TEST_COPY failed; fi
if python3 - "$TMP/sot-api-test.js" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(); old='_test: { review,'; new='_test: { windowsDirectoryExists, windowsListDirectories, windowsCreateDirectory, storageFor, saveStorage, review,'
if s.count(old)!=1: raise SystemExit('test-export marker count='+str(s.count(old)))
p.write_text(s.replace(old,new,1))
PY
then pass TEMP_TEST_EXPORT 'Windows/storage helpers exported only in throwaway copy'; else fail TEMP_TEST_EXPORT failed; fi
if node --check "$TMP/sot-api-test.js"; then pass TEMP_TEST_EXPORT_SYNTAX ok; else fail TEMP_TEST_EXPORT_SYNTAX failed; fi

while read -r D; do
  [ -n "$D" ] || continue
  if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$D" > "$QUAL_DIR/precutover-drive-$D.json" <<'NODE'
const api=require(process.argv[2]); const d=process.argv[3], p='/mnt/'+d.toLowerCase(); const exists=api._test.windowsDirectoryExists(p); if(!exists) throw Error('exists=false drive='+d); const folders=api._test.windowsListDirectories(p); if(!Array.isArray(folders)) throw Error('folders-not-array drive='+d); console.log(JSON.stringify({drive:d,exists,folders:folders.length}));
NODE
  then pass "PRECUTOVER_DRIVE_${D}" "$(cat "$QUAL_DIR/precutover-drive-$D.json")"; else fail "PRECUTOVER_DRIVE_${D}" 'exact candidate Windows stdin helper failed'; fi
done < "$QUAL_DIR/readable-drives.txt"
for S in F I; do
  if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then grep -q $'PASS\tPRECUTOVER_DRIVE_'"$S" "$SUMMARY" && pass "PRECUTOVER_SPECIAL_$S" passed || fail "PRECUTOVER_SPECIAL_$S" missing; else info "PRECUTOVER_SPECIAL_$S" 'not Windows-readable this run'; fi
done

if WIN_TEMP="$("$POWERSHELL" -NoProfile -NonInteractive -Command '$env:TEMP' | tr -d '\r\n')"; then pass WINDOWS_TEMP_PATH "$WIN_TEMP"; else fail WINDOWS_TEMP_PATH command_failed; fi
if TEMP_POSIX="$(wslpath -u "$WIN_TEMP" 2>&1)"; then pass WINDOWS_TEMP_TRANSLATION "$TEMP_POSIX"; else fail WINDOWS_TEMP_TRANSLATION "$TEMP_POSIX"; fi
TEST_NAME="sot-base20-qual-$STAMP"
WINDOWS_TEST_PATH="${WIN_TEMP%\\}\\$TEST_NAME"
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$TEMP_POSIX" "$TEST_NAME" > "$QUAL_DIR/create-folder.json" <<'NODE'
const api=require(process.argv[2]); const parent=process.argv[3], name=process.argv[4]; api._test.windowsCreateDirectory(parent,name); const child=parent.replace(/\/$/,'')+'/'+name; if(!api._test.windowsDirectoryExists(child)) throw Error('created folder not visible'); console.log(JSON.stringify({parent,name,child,exists:true}));
NODE
then pass PRECUTOVER_FOLDER_CREATE "$(cat "$QUAL_DIR/create-folder.json")"; else fail PRECUTOVER_FOLDER_CREATE 'candidate stdin folder creation failed'; fi
if printf '%s' "$WINDOWS_TEST_PATH" | "$POWERSHELL" -NoProfile -NonInteractive -Command '$p=[Console]::In.ReadToEnd(); if (Test-Path -LiteralPath $p) { Remove-Item -LiteralPath $p -Force -Recurse -ErrorAction Stop }; if (Test-Path -LiteralPath $p) { exit 3 }'; then pass PRECUTOVER_FOLDER_CLEANUP "$WINDOWS_TEST_PATH removed"; WINDOWS_TEST_PATH=''; else fail PRECUTOVER_FOLDER_CLEANUP "$WINDOWS_TEST_PATH could not be removed"; fi

if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" > "$QUAL_DIR/persistence.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(!p.length) throw Error('no project'); const t=p[0].project_token; const before=api._test.storageFor(t); const probe='/mnt/c'; api._test.saveStorage(t,{target_browse_root:probe}); const after=api._test.storageFor(t); if(after.target_browse_root!==probe) throw Error('persistence mismatch'); api._test.saveStorage(t,{target_browse_root:before.target_browse_root||''}); const restored=api._test.storageFor(t); if(restored.target_browse_root!==(before.target_browse_root||'')) throw Error('restore mismatch'); console.log(JSON.stringify({token:t,probe,persisted:after.target_browse_root,restored:restored.target_browse_root}));
NODE
then pass PICKER_PERSISTENCE_COPY_DB "$(cat "$QUAL_DIR/persistence.json")"; else fail PICKER_PERSISTENCE_COPY_DB failed; fi

LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base20"
mkdir -p "$LIVE_ARCHIVE"
if cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"; then pass ARCHIVE_API "$LIVE_ARCHIVE/sot-api.js"; else fail ARCHIVE_API failed; fi
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then
  if cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"; then HAD_HTML=1; pass ARCHIVE_HTML "$LIVE_ARCHIVE/SOT-turn01-base.html"; else fail ARCHIVE_HTML failed; fi
else info ARCHIVE_HTML 'no existing canonical Base HTML'; fi
if sha256sum "$LIVE_ARCHIVE"/* > "$QUAL_DIR/precutover-sha256.txt" 2>&1; then pass PRECUTOVER_CHECKSUMS "$(tr '\n' ';' < "$QUAL_DIR/precutover-sha256.txt")"; else fail PRECUTOVER_CHECKSUMS failed; fi
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP" || fail RUNTIME_BACKUP failed
[ "$HAD_HTML" -eq 1 ] && cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP" || true

CUTOVER=1
if sudo systemctl stop "$SERVICE"; then pass SERVICE_STOP stopped; else fail SERVICE_STOP failed; fi
if install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"; then pass INSTALL_API "sha256=$(sha256sum "$REPORT_ROOT/sot-api.js"|awk '{print $1}')"; else fail INSTALL_API failed; fi
if install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; then pass INSTALL_HTML "sha256=$(sha256sum "$SOT_DIR/SOT-turn01-base.html"|awk '{print $1}')"; else fail INSTALL_HTML failed; fi
if sudo systemctl start "$SERVICE"; then pass SERVICE_START started; else fail SERVICE_START failed; fi

ok=0
for i in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  info LIVE_HEALTH_ATTEMPT "attempt=$i HTTP=$code"
  if [ "$code" = 200 ]; then ok=1; break; fi
  sleep 1
done
[ "$ok" -eq 1 ] || fail LIVE_HEALTH_HTTP not_ready
pass LIVE_HEALTH_HTTP HTTP=200
if live_meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/live-health.json'));assert x.get('status')=='ok' and x.get('database_version')==4 and x.get('build')=='2026.08.29.sot-turn01-base-20',x;print('build='+x['build']+' schema='+str(x['database_version'])+' status='+x['status'])" 2>&1)"; then pass LIVE_HEALTH_CONTRACT "$live_meta"; else fail LIVE_HEALTH_CONTRACT "$live_meta"; fi

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/sot-volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"
[ "$code" = 200 ] && pass SOT_INVENTORY_HTTP HTTP=200 || fail SOT_INVENTORY_HTTP "HTTP=$code body=$(cat "$QUAL_DIR/sot-volumes.json" 2>/dev/null || true)"
if inv="$(python3 - "$QUAL_DIR/windows-drives.txt" "$QUAL_DIR/sot-volumes.json" <<'PY'
import json,sys
w={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}; v=json.load(open(sys.argv[2])); s={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}
if w!=s: raise SystemExit('windows='+','.join(sorted(w))+' sot='+','.join(sorted(s))+' missing='+','.join(sorted(w-s))+' extra='+','.join(sorted(s-w)))
print('windows='+','.join(sorted(w))+' sot='+','.join(sorted(s))+' exact=true')
PY
)"; then pass INVENTORY_EXACT_MATCH "$inv"; else fail INVENTORY_EXACT_MATCH "$inv"; fi

while read -r D; do
  [ -n "$D" ] || continue; L="$(echo "$D"|tr '[:upper:]' '[:lower:]')"
  code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$L" -o "$QUAL_DIR/drive-$D.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
  [ "$code" = 200 ] || fail "DRIVE_${D}_BROWSE" "HTTP=$code body=$(cat "$QUAL_DIR/drive-$D.json" 2>/dev/null || true)"
  if c="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/drive-$D.json'));f=x.get('folders');assert isinstance(f,list),x;print(len(f))" 2>&1)"; then pass "DRIVE_${D}_BROWSE" "HTTP=200 folders=$c"; else fail "DRIVE_${D}_BROWSE_PARSE" "$c"; fi
done < "$QUAL_DIR/readable-drives.txt"
for S in F I; do
  if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then grep -q $'PASS\tDRIVE_'"$S"'_BROWSE' "$SUMMARY" && pass "SPECIAL_$S" 'pre-cutover helper + post-cutover API browse passed' || fail "SPECIAL_$S" failed; else info "SPECIAL_$S" 'not Windows-readable this run'; fi
done

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/projects.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/projects || true)"
[ "$code" = 200 ] && pass PROJECTS_ENDPOINT HTTP=200 || fail PROJECTS_ENDPOINT "HTTP=$code"
if TOKEN="$(python3 -c "import json;p=json.load(open('$QUAL_DIR/projects.json')).get('projects') or [];assert p;print(p[0]['project_token'])" 2>&1)"; then pass PROJECT_TOKEN "$TOKEN"; else fail PROJECT_TOKEN "$TOKEN"; fi
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/storage.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] && pass STORAGE_ENDPOINT "HTTP=200 body=$(cat "$QUAL_DIR/storage.json")" || fail STORAGE_ENDPOINT "HTTP=$code body=$(cat "$QUAL_DIR/storage.json" 2>/dev/null || true)"

code="$(curl --max-time 15 -sS -o "$QUAL_DIR/base-page.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] && pass PUBLIC_PAGE_HTTP HTTP=200 || fail PUBLIC_PAGE_HTTP "HTTP=$code"
grep -Fq 'SOT-turn01-base' "$QUAL_DIR/base-page.html" && pass PUBLIC_PAGE_MARKER 'canonical marker present' || fail PUBLIC_PAGE_MARKER missing

SUCCESS=1
pass QUALIFICATION 'Base-20 mechanically qualified'
echo '=== TURN 01 BASE-20 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
