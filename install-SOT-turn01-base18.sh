#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
EXPECTED_BUILD='2026.08.29.sot-turn01-base-18'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base18-qualification"
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
trap 'rc=$?; record FAIL UNHANDLED "rc=$rc line=$LINENO command=$BASH_COMMAND" || true' ERR

print_summary(){ echo; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-34s %s\n",$1,$2,$3}' "$SUMMARY" || true; echo "persistent log: $LOG"; echo "summary file:   $SUMMARY"; echo "run directory:  $QUAL_DIR"; }
cleanup(){
  local rc=$?
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    ROLLBACK_ATTEMPTED=1; info ROLLBACK 'fatal post-cutover failure; restoring exact pre-cutover API/HTML'
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    [ -f "$RUNTIME_BACKUP" ] && install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js" && pass ROLLBACK_API 'restored prior sot-api.js' || record FAIL ROLLBACK_API 'restore failed' || true
    if [ "$HAD_HTML" -eq 1 ]; then install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html" && pass ROLLBACK_HTML 'restored prior Base HTML' || record FAIL ROLLBACK_HTML 'restore failed' || true; else rm -f "$SOT_DIR/SOT-turn01-base.html" && pass ROLLBACK_HTML 'removed candidate Base HTML' || true; fi
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    rb=0; for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; info ROLLBACK_HEALTH_ATTEMPT "attempt=$i HTTP=$code"; [ "$code" = 200 ] && { rb=1; break; }; sleep 1; done
    [ "$rb" -eq 1 ] && pass ROLLBACK_HEALTH "build=$(python3 -c "import json;print(json.load(open('$QUAL_DIR/rollback-health.json')).get('build',''))")" || record FAIL ROLLBACK_HEALTH 'service did not recover' || true
  fi
  [ "$SUCCESS" -eq 1 ] && record PASS FINAL 'all mechanical gates passed' || record FAIL FINAL "qualification failed rc=$rc rollback_attempted=$ROLLBACK_ATTEMPTED" || true
  print_summary; rm -rf "$TMP"; return "$rc"
}
trap cleanup EXIT

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base18-$STAMP
started=$(date -Is)
expected_build=$EXPECTED_BUILD
installer_commit=$INSTALLER_COMMIT
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
clean_generator=be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py
powershell_transport=b56a19e580427d84d7ef7cfaabc5b922ed2c3efa/patch-SOT-turn01-base18-powershell-env.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
ui_integrator=e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py
ui_picker_state=5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py
idle_refresh=7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] && pass INSTALLER_IDENTITY "$INSTALLER_COMMIT" || fail INSTALLER_IDENTITY 'pinned installer identity required'

echo '=== TURN 01 BASE-18 PRE-CUTOVER-FIRST QUALIFICATION ==='
code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; [ "$code" = 200 ] && pass PRE_HEALTH_HTTP HTTP=200 || fail PRE_HEALTH_HTTP "HTTP=$code"
meta="$(python3 -c "import json; x=json.load(open('$QUAL_DIR/pre-health.json')); print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" )" || fail PRE_HEALTH_PARSE "body=$(cat "$QUAL_DIR/pre-health.json")"
IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] && pass PRE_BUILD "$CURRENT_BUILD" || fail PRE_BUILD "expected Base-9 got=$CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] && pass PRE_SCHEMA schema=4 || fail PRE_SCHEMA "schema=$CURRENT_SCHEMA"
[ "$CURRENT_STATUS" = ok ] && pass PRE_STATUS ok || fail PRE_STATUS "status=$CURRENT_STATUS"

BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
declare -a NAMES=(pre.js integrate.py generate.py transport.py pre.html ui.py uistate.py idle.py)
declare -a URLS=(
 "$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js"
 "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py"
 "$BASE/be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py"
 "$BASE/b56a19e580427d84d7ef7cfaabc5b922ed2c3efa/patch-SOT-turn01-base18-powershell-env.py"
 "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html"
 "$BASE/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py"
 "$BASE/5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py"
 "$BASE/7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py"
)
for i in "${!NAMES[@]}"; do n="${NAMES[$i]}"; u="${URLS[$i]}"; if curl --max-time 30 -fsSL "$u" -o "$TMP/$n"; then pass "FETCH_$n" "bytes=$(stat -c %s "$TMP/$n") sha256=$(sha256sum "$TMP/$n"|awk '{print $1}')"; else fail "FETCH_$n" "$u"; fi; done
for f in integrate.py generate.py transport.py ui.py uistate.py idle.py; do python3 -m py_compile "$TMP/$f" && pass "PYCOMPILE_$f" ok || fail "PYCOMPILE_$f" failed; done
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js" && pass GENERATE_BASE3 "sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')" || fail GENERATE_BASE3 failed
python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/base14.js" && pass GENERATE_INTERMEDIATE 'clean-source generator completed' || fail GENERATE_INTERMEDIATE failed
python3 "$TMP/transport.py" "$TMP/base14.js" "$TMP/sot-api.js" && pass POWERSHELL_TRANSPORT_PATCH 'environment-variable transport applied' || fail POWERSHELL_TRANSPORT_PATCH failed
python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/ui0.html" && pass UI_INTEGRATE ok || fail UI_INTEGRATE failed
python3 "$TMP/uistate.py" "$TMP/ui0.html" "$TMP/ui1.html" && pass UI_PICKER_STATE ok || fail UI_PICKER_STATE failed
python3 "$TMP/idle.py" "$TMP/ui1.html" "$TMP/SOT-turn01-base.html" && pass UI_IDLE_REFRESH ok || fail UI_IDLE_REFRESH failed
node --check "$TMP/sot-api.js" && pass NODE_BACKEND ok || fail NODE_BACKEND failed
if grep -Fq '$args[0]' "$TMP/sot-api.js" || grep -Fq '$args[1]' "$TMP/sot-api.js"; then fail REJECTED_PS_ARGS 'rejected $args transport survived'; else pass REJECTED_PS_ARGS 'absent'; fi
grep -Fq '$env:SOT_PATH' "$TMP/sot-api.js" && pass PS_ENV_PATH present || fail PS_ENV_PATH missing
grep -Fq '$env:SOT_NAME' "$TMP/sot-api.js" && pass PS_ENV_NAME present || fail PS_ENV_NAME missing
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js" && pass BUILD_MARKER "$EXPECTED_BUILD" || fail BUILD_MARKER missing
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); req=['SOT-turn01-base','captureBrowse','`${kind}_browse_root`','function fullyIndexedStable(p)','/turn01/volumes','/turn01/fs?path=']
for m in req:
    if m not in h: raise SystemExit('missing '+m)
s=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)
if not s: raise SystemExit('no scripts')
Path(sys.argv[2]).write_text('\n;\n'.join(s))
PY
pass UI_CONTRACT 'picker/common inventory/persistence markers present'
node --check "$TMP/ui.js" && pass NODE_UI ok || fail NODE_UI failed

mkdir -p "$TMP/sot-db/migrations"; for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/$m" && pass "MIGRATION_$m" copied || fail "MIGRATION_$m" failed; done
cp "$DB" "$TMP/test.sqlite" && pass TEMP_DB_COPY "bytes=$(stat -c %s "$TMP/test.sqlite")" || fail TEMP_DB_COPY failed
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(api.BUILD!=='2026.08.29.sot-turn01-base-18') throw Error(api.BUILD); if(api.EXPECTED_MIGRATION!==4) throw Error('migration'); if(!Array.isArray(p)) throw Error('projects'); console.log(JSON.stringify({build:api.BUILD,migration:api.EXPECTED_MIGRATION,projects:p.length}));
NODE
pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.json")"

POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] && pass POWERSHELL "$POWERSHELL" || fail POWERSHELL missing
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$QUAL_DIR/windows-drives.txt" || fail WINDOWS_INVENTORY command_failed
WIN="$(cat "$QUAL_DIR/windows-drives.txt")"; [ -n "$WIN" ] && pass WINDOWS_INVENTORY "$WIN" || fail WINDOWS_INVENTORY empty
python3 - "$QUAL_DIR/windows-drives.txt" <<'PY'
import sys
x=[v.strip().upper() for v in open(sys.argv[1]).read().split(',') if v.strip()]
assert x and 'C' in x and len(x)==len(set(x)),x
print('count='+str(len(x))+' drives='+','.join(x))
PY
pass WINDOWS_INVENTORY_SANITY "$(python3 -c "x=[v.strip().upper() for v in open('$QUAL_DIR/windows-drives.txt').read().split(',') if v.strip()]; print('count='+str(len(x))+' drives='+','.join(x))")"
: > "$QUAL_DIR/readable-drives.txt"
IFS=',' read -r -a DRIVES <<< "$WIN"
for D in "${DRIVES[@]}"; do D="$(echo "$D"|tr -d '[:space:]'|tr '[:lower:]' '[:upper:]')"; [ -n "$D" ] || continue; R="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${D}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')" || fail "DRIVE_${D}_WINDOWS" command_failed; [ "$R" = 1 ] && { echo "$D" >> "$QUAL_DIR/readable-drives.txt"; pass "DRIVE_${D}_WINDOWS" readable=1; } || info "DRIVE_${D}_WINDOWS" readable=0; done

# Throwaway export only: exercise exact candidate Windows helpers before cutover.
cp "$TMP/sot-api.js" "$TMP/sot-api-test.js"
python3 - "$TMP/sot-api-test.js" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(); old='_test: { review,'; new='_test: { windowsDirectoryExists, windowsListDirectories, storageFor, saveStorage, review,'
if s.count(old)!=1: raise SystemExit('test export marker count='+str(s.count(old)))
p.write_text(s.replace(old,new,1))
PY
pass TEMP_TEST_EXPORT 'candidate helpers exported only in throwaway copy'
node --check "$TMP/sot-api-test.js" && pass TEMP_TEST_EXPORT_SYNTAX ok || fail TEMP_TEST_EXPORT_SYNTAX failed
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$QUAL_DIR/readable-drives.txt" > "$QUAL_DIR/precutover-windows-helper.jsonl" <<'NODE'
const fs=require('fs'); const api=require(process.argv[2]); const ds=fs.readFileSync(process.argv[3],'utf8').split(/\s+/).filter(Boolean); for(const d of ds){const p='/mnt/'+d.toLowerCase(); const exists=api._test.windowsDirectoryExists(p); if(!exists) throw new Error('exists false '+d); const folders=api._test.windowsListDirectories(p); if(!Array.isArray(folders)) throw new Error('folders not array '+d); console.log(JSON.stringify({drive:d,exists,folders:folders.length}));}
NODE
pass PRECUTOVER_WINDOWS_HELPERS "$(tr '\n' ';' < "$QUAL_DIR/precutover-windows-helper.jsonl")"
for S in F I; do if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then grep -q '"drive":"'$S'"' "$QUAL_DIR/precutover-windows-helper.jsonl" && pass "PRECUTOVER_SPECIAL_$S" passed || fail "PRECUTOVER_SPECIAL_$S" missing; else info "PRECUTOVER_SPECIAL_$S" 'not Windows-readable this run'; fi; done

# Copied-DB persistence proof before cutover; live DB is never mutated by qualification.
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" > "$QUAL_DIR/persistence.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(!p.length) throw Error('no project'); const t=p[0].project_token; const before=api._test.storageFor(t); const probe='/mnt/c'; api._test.saveStorage(t,{target_browse_root:probe}); const after=api._test.storageFor(t); if(after.target_browse_root!==probe) throw Error('persistence mismatch'); api._test.saveStorage(t,{target_browse_root:before.target_browse_root||''}); const restored=api._test.storageFor(t); if(restored.target_browse_root!==(before.target_browse_root||'')) throw Error('restore mismatch'); console.log(JSON.stringify({token:t,probe,persisted:after.target_browse_root,restored:restored.target_browse_root}));
NODE
pass PICKER_PERSISTENCE_COPY_DB "$(cat "$QUAL_DIR/persistence.json")"

LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base18"; mkdir -p "$LIVE_ARCHIVE"; cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js" && pass ARCHIVE_API "$LIVE_ARCHIVE/sot-api.js" || fail ARCHIVE_API failed; if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html" && HAD_HTML=1 && pass ARCHIVE_HTML "$LIVE_ARCHIVE/SOT-turn01-base.html" || fail ARCHIVE_HTML failed; else info ARCHIVE_HTML none; fi
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"; [ "$HAD_HTML" -eq 1 ] && cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP" || true
CUTOVER=1
sudo systemctl stop "$SERVICE" && pass SERVICE_STOP stopped || fail SERVICE_STOP failed
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js" && pass INSTALL_API "sha256=$(sha256sum "$REPORT_ROOT/sot-api.js"|awk '{print $1}')" || fail INSTALL_API failed
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html" && pass INSTALL_HTML "sha256=$(sha256sum "$SOT_DIR/SOT-turn01-base.html"|awk '{print $1}')" || fail INSTALL_HTML failed
sudo systemctl start "$SERVICE" && pass SERVICE_START started || fail SERVICE_START failed
ok=0; for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; info LIVE_HEALTH_ATTEMPT "attempt=$i HTTP=$code"; [ "$code" = 200 ] && { ok=1; break; }; sleep 1; done; [ "$ok" -eq 1 ] || fail LIVE_HEALTH_HTTP not_ready
python3 - "$QUAL_DIR/live-health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok' and x.get('database_version')==4 and x.get('build')=='2026.08.29.sot-turn01-base-18',x
PY
pass LIVE_HEALTH_CONTRACT "$(cat "$QUAL_DIR/live-health.json")"

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/sot-volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"; [ "$code" = 200 ] || fail SOT_INVENTORY_HTTP "HTTP=$code"
python3 - "$QUAL_DIR/windows-drives.txt" "$QUAL_DIR/sot-volumes.json" > "$QUAL_DIR/inventory-compare.txt" <<'PY'
import json,sys
w={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}; v=json.load(open(sys.argv[2])); s={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}; print('windows='+','.join(sorted(w))); print('sot='+','.join(sorted(s))); print('missing='+','.join(sorted(w-s))); print('extra='+','.join(sorted(s-w))); assert w==s,(w,s)
PY
pass INVENTORY_EXACT_MATCH "$(tr '\n' ' ' < "$QUAL_DIR/inventory-compare.txt")"
while read -r D; do [ -n "$D" ] || continue; L="$(echo "$D"|tr '[:upper:]' '[:lower:]')"; code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$L" -o "$QUAL_DIR/drive-$D.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"; [ "$code" = 200 ] || fail "DRIVE_${D}_BROWSE" "HTTP=$code body=$(cat "$QUAL_DIR/drive-$D.json" 2>/dev/null || true)"; c="$(python3 -c "import json; x=json.load(open('$QUAL_DIR/drive-$D.json')); assert isinstance(x.get('folders'),list); print(len(x['folders']))")" || fail "DRIVE_${D}_BROWSE_PARSE" failed; pass "DRIVE_${D}_BROWSE" "HTTP=200 folders=$c"; done < "$QUAL_DIR/readable-drives.txt"
for S in F I; do if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then grep -q $'PASS\tDRIVE_'"$S"'_BROWSE' "$SUMMARY" && pass "SPECIAL_$S" 'pre/post browse passed' || fail "SPECIAL_$S" failed; else info "SPECIAL_$S" 'not Windows-readable this run'; fi; done
pass TARGET_BACKUP_COMMON_INVENTORY '/turn01/volumes contract present in qualified UI'
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/projects.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/projects || true)"; [ "$code" = 200 ] && pass PROJECTS_ENDPOINT HTTP=200 || fail PROJECTS_ENDPOINT "HTTP=$code"
TOKEN="$(python3 -c "import json;p=json.load(open('$QUAL_DIR/projects.json')).get('projects') or [];assert p;print(p[0]['project_token'])")" || fail PROJECT_TOKEN missing
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/storage.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"; [ "$code" = 200 ] && pass STORAGE_ENDPOINT "HTTP=200 body=$(cat "$QUAL_DIR/storage.json")" || fail STORAGE_ENDPOINT "HTTP=$code"
code="$(curl --max-time 15 -sS -o "$QUAL_DIR/base-page.html" -w '%{http_code}' "$PUBLIC_URL" || true)"; [ "$code" = 200 ] || fail PUBLIC_PAGE_HTTP "HTTP=$code"; grep -Fq 'SOT-turn01-base' "$QUAL_DIR/base-page.html" && pass PUBLIC_PAGE_MARKER 'canonical marker present' || fail PUBLIC_PAGE_MARKER missing

SUCCESS=1; pass QUALIFICATION 'Base-18 mechanically qualified'; echo '=== TURN 01 BASE-18 MECHANICALLY QUALIFIED ==='; echo "TEST URL: $PUBLIC_URL"; echo "QUALIFICATION LOG: $LOG"
