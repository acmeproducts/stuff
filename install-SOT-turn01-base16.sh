#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN_ID="turn01-base16-$STAMP"
EXPECTED_BUILD='2026.08.29.sot-turn01-base-16'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base16-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
RUNTIME_BACKUP="$TMP/sot-api.before.js"
HTML_BACKUP="$TMP/base.before.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
ROLLBACK_ATTEMPTED=0

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %s — %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
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
}

cleanup(){
  local rc=$?
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    ROLLBACK_ATTEMPTED=1
    record INFO ROLLBACK 'fatal post-cutover gate failed; restoring exact pre-cutover API/HTML' || true
    sudo systemctl stop "$SERVICE" || true
    if [ -f "$RUNTIME_BACKUP" ]; then install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js" && pass ROLLBACK_API 'restored prior sot-api.js' || record FAIL ROLLBACK_API 'restore failed'; fi
    if [ "$HAD_HTML" -eq 1 ] && [ -f "$HTML_BACKUP" ]; then
      install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html" && pass ROLLBACK_HTML 'restored prior Base HTML' || record FAIL ROLLBACK_HTML 'restore failed'
    else
      rm -f "$SOT_DIR/SOT-turn01-base.html" && pass ROLLBACK_HTML 'removed candidate Base HTML; no prior file existed' || record FAIL ROLLBACK_HTML 'remove failed'
    fi
    sudo systemctl start "$SERVICE" || true
    RB_OK=0
    for attempt in {1..30}; do
      code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
      echo "rollback health attempt=$attempt http=$code"
      if [ "$code" = 200 ]; then RB_OK=1; break; fi
      sleep 1
    done
    if [ "$RB_OK" -eq 1 ]; then
      rb_build="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/rollback-health.json')).get('build',''))" 2>/dev/null || true)"
      pass ROLLBACK_HEALTH "service recovered build=$rb_build"
    else
      record FAIL ROLLBACK_HEALTH 'service did not recover within 30 attempts' || true
    fi
  fi
  [ "$SUCCESS" -eq 1 ] && record PASS FINAL 'all mechanical gates passed' || record FAIL FINAL "qualification failed rc=$rc rollback_attempted=$ROLLBACK_ATTEMPTED"
  print_summary
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=$RUN_ID
started=$(date -Is)
expected_build=$EXPECTED_BUILD
installer_commit=TO_BE_PINNED_BY_CALLER
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
clean_generator=be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
ui_integrator=e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py
ui_picker_state=5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py
idle_refresh=7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py
EOF
pass RUN_MANIFEST "created $QUAL_DIR/RUN-MANIFEST.txt"

echo '=== TURN 01 BASE-16 FULLY INSTRUMENTED CLEAN REBUILD ==='
code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] || fail PRE_HEALTH "health HTTP=$code before any mutation"
CURRENT_BUILD="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/pre-health.json')).get('build',''))")"
CURRENT_SCHEMA="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/pre-health.json')).get('database_version',''))")"
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] || fail PRE_BUILD "expected accepted Base-9, got $CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] || fail PRE_SCHEMA "expected schema 4, got $CURRENT_SCHEMA"
pass PRE_HEALTH "build=$CURRENT_BUILD schema=$CURRENT_SCHEMA"

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
  curl --max-time 30 -fsSL "$url" -o "$TMP/$name" || fail "FETCH_$name" "$url"
  hash="$(sha256sum "$TMP/$name" | awk '{print $1}')"
  size="$(stat -c %s "$TMP/$name")"
  pass "FETCH_$name" "bytes=$size sha256=$hash url=$url"
done

for f in integrate.py generate.py ui.py uistate.py idle.py; do
  python3 -m py_compile "$TMP/$f" && pass "PYCOMPILE_$f" 'ok' || fail "PYCOMPILE_$f" 'failed'
done

python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js" && pass GENERATE_BASE3 "bytes=$(stat -c %s "$TMP/base3.js") sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')" || fail GENERATE_BASE3 'integration failed'
python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js" && pass GENERATE_BACKEND 'clean generator completed' || fail GENERATE_BACKEND 'generator failed'
sed -i "s/2026.08.29.sot-turn01-base-14/2026.08.29.sot-turn01-base-16/g" "$TMP/sot-api.js"
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js" && pass BUILD_MARKER "$EXPECTED_BUILD" || fail BUILD_MARKER 'candidate build marker missing'

python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/ui0.html" && pass UI_INTEGRATE 'accepted pre-base -> Base storage UI' || fail UI_INTEGRATE 'failed'
python3 "$TMP/uistate.py" "$TMP/ui0.html" "$TMP/ui1.html" && pass UI_PICKER_STATE 'durable picker state integration completed' || fail UI_PICKER_STATE 'failed'
python3 "$TMP/idle.py" "$TMP/ui1.html" "$TMP/SOT-turn01-base.html" && pass UI_IDLE_REFRESH 'idle refresh integration completed' || fail UI_IDLE_REFRESH 'failed'

node --check "$TMP/sot-api.js" && pass NODE_BACKEND 'node --check passed' || fail NODE_BACKEND 'node --check failed'
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
api=Path(sys.argv[1]).read_text(); html=Path(sys.argv[2]).read_text()
required_api=["const BUILD = '2026.08.29.sot-turn01-base-16';",'function windowsListDirectories(value)','function windowsDirectoryExists(value)','target_browse_root:','backup_browse_root:','windowsListDirectories(requested)']
required_ui=['SOT-turn01-base','TURN01_BASE_STORAGE_PICKER','captureBrowse','`${kind}_browse_root`','function fullyIndexedStable(p)','/turn01/volumes','/turn01/fs?path=']
rejected=['normalizeWindowsMountSource','mount helper completed but SOT rejected mount state']
for m in required_api:
    if m not in api: raise SystemExit('missing API marker: '+m)
for m in required_ui:
    if m not in html: raise SystemExit('missing UI marker: '+m)
for m in rejected:
    if m in api: raise SystemExit('rejected marker present: '+m)
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no executable UI scripts')
Path(sys.argv[3]).write_text('\n;\n'.join(scripts))
print('contract markers: PASS')
PY
pass CONTRACT_MARKERS 'required present; rejected absent'
node --check "$TMP/ui.js" && pass NODE_UI 'extracted UI JavaScript passed node --check' || fail NODE_UI 'node --check failed'

mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"; done
cp "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.txt" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects();
if(api.BUILD!=='2026.08.29.sot-turn01-base-16') throw new Error('wrong candidate build '+api.BUILD);
if(!Array.isArray(projects)) throw new Error('project list contract failed');
console.log(JSON.stringify({build:api.BUILD,projects:projects.length}));
NODE
pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.txt") schema=4 copy=$TMP/test.sqlite"

LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base16"
mkdir -p "$LIVE_ARCHIVE"
cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html" || true
sha256sum "$LIVE_ARCHIVE"/* > "$QUAL_DIR/precutover-sha256.txt" 2>/dev/null || true
pass PRECUTOVER_ARCHIVE "$LIVE_ARCHIVE checksums=$QUAL_DIR/precutover-sha256.txt"
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi

CUTOVER=1
sudo systemctl stop "$SERVICE" && pass SERVICE_STOP 'stopped for candidate cutover' || fail SERVICE_STOP 'failed'
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js" && pass INSTALL_API "sha256=$(sha256sum "$REPORT_ROOT/sot-api.js"|awk '{print $1}')" || fail INSTALL_API 'failed'
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html" && pass INSTALL_HTML "sha256=$(sha256sum "$SOT_DIR/SOT-turn01-base.html"|awk '{print $1}')" || fail INSTALL_HTML 'failed'
sudo systemctl start "$SERVICE" && pass SERVICE_START 'start requested' || fail SERVICE_START 'failed'

HEALTH_OK=0
for attempt in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  echo "health attempt=$attempt http=$code"
  if [ "$code" = 200 ]; then HEALTH_OK=1; break; fi
  sleep 1
done
[ "$HEALTH_OK" -eq 1 ] || fail LIVE_HEALTH 'HTTP 200 not reached in 30 attempts'
python3 - "$QUAL_DIR/live-health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('status')=='ok',x
assert x.get('database_version')==4,x
assert x.get('build')=='2026.08.29.sot-turn01-base-16',x
print(json.dumps(x,sort_keys=True))
PY
pass LIVE_HEALTH "$(cat "$QUAL_DIR/live-health.json")"

POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] || fail POWERSHELL "not executable: $POWERSHELL"
pass POWERSHELL "$POWERSHELL"
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$QUAL_DIR/windows-drives.txt"
pass WINDOWS_INVENTORY "$(cat "$QUAL_DIR/windows-drives.txt")"
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/sot-volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"
[ "$code" = 200 ] || fail SOT_INVENTORY "HTTP=$code body=$(cat "$QUAL_DIR/sot-volumes.json" 2>/dev/null || true)"
python3 - "$QUAL_DIR/windows-drives.txt" "$QUAL_DIR/sot-volumes.json" > "$QUAL_DIR/inventory-compare.txt" <<'PY'
import json,sys
windows={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}
v=json.load(open(sys.argv[2])); seen={str(x.get('name','')).rstrip(':').upper() for x in v.get('volumes',[]) if x.get('kind')=='drive'}
print('windows='+','.join(sorted(windows)))
print('sot='+','.join(sorted(seen)))
missing=windows-seen
print('missing='+','.join(sorted(missing)))
if missing: raise SystemExit(1)
PY
pass INVENTORY_MATCH "$(tr '\n' ' ' < "$QUAL_DIR/inventory-compare.txt")"

IFS=',' read -r -a DRIVES <<< "$(cat "$QUAL_DIR/windows-drives.txt")"
for DRIVE in "${DRIVES[@]}"; do
  DRIVE="$(printf '%s' "$DRIVE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')"
  [ -n "$DRIVE" ] || continue
  LOWER="$(printf '%s' "$DRIVE" | tr '[:upper:]' '[:lower:]')"
  ONLINE="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${DRIVE}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')"
  record INFO "DRIVE_${DRIVE}_WINDOWS" "readable=$ONLINE"
  python3 - "$QUAL_DIR/sot-volumes.json" "$DRIVE" <<'PY'
import json,sys
v=json.load(open(sys.argv[1])).get('volumes') or []; d=sys.argv[2]
assert any(str(x.get('name','')).rstrip(':').upper()==d for x in v),d
PY
  pass "DRIVE_${DRIVE}_PRESENT" 'present in SOT volume inventory'
  if [ "$ONLINE" = 1 ]; then
    code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$LOWER" -o "$QUAL_DIR/drive-$DRIVE-browse.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
    if [ "$code" != 200 ]; then
      fail "DRIVE_${DRIVE}_BROWSE" "Windows-readable=1 HTTP=$code body=$(cat "$QUAL_DIR/drive-$DRIVE-browse.json" 2>/dev/null || true)"
    fi
    count="$(python3 - "$QUAL_DIR/drive-$DRIVE-browse.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); f=x.get('folders'); assert isinstance(f,list),x; print(len(f))
PY
)"
    pass "DRIVE_${DRIVE}_BROWSE" "Windows-readable=1 HTTP=200 folders=$count"
  else
    record INFO "DRIVE_${DRIVE}_BROWSE" 'Windows-readable=0; browse gate not required'
  fi
done

for SPECIAL in F I; do
  if grep -Eq "(^|,)$SPECIAL(,|$)" "$QUAL_DIR/windows-drives.txt"; then
    grep -q $'PASS\tDRIVE_'"$SPECIAL"'_BROWSE' "$SUMMARY" && pass "SPECIAL_${SPECIAL}" "$SPECIAL present and browse gate passed" || fail "SPECIAL_${SPECIAL}" "$SPECIAL present but browse gate did not pass"
  else
    record INFO "SPECIAL_${SPECIAL}" "$SPECIAL not present in this Windows inventory"
  fi
done

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/projects.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/projects || true)"
[ "$code" = 200 ] || fail PROJECTS_ENDPOINT "HTTP=$code"
TOKEN="$(python3 -c "import json;p=json.load(open('$QUAL_DIR/projects.json')).get('projects') or [];assert p;print(p[0]['project_token'])")"
pass PROJECTS_ENDPOINT "HTTP=200 token=$TOKEN"
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/storage-before.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] || fail STORAGE_GET "HTTP=$code body=$(cat "$QUAL_DIR/storage-before.json" 2>/dev/null || true)"
pass STORAGE_GET "HTTP=200 before=$(cat "$QUAL_DIR/storage-before.json")"
PROBE="$(python3 -c "import json;v=json.load(open('$QUAL_DIR/sot-volumes.json')).get('volumes') or [];print(next((x['path'] for x in v if x.get('kind')=='drive'),v[0]['path'] if v else ''))")"
[ -n "$PROBE" ] || fail PICKER_PROBE 'no volume available'
ORIGINAL="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/storage-before.json')).get('target_browse_root',''))")"
python3 - "$PROBE" "$QUAL_DIR/probe.json" <<'PY'
import json,sys; open(sys.argv[2],'w').write(json.dumps({'target_browse_root':sys.argv[1]}))
PY
code="$(curl --max-time 10 -sS -X PUT -H 'Content-Type: application/json' --data-binary "@$QUAL_DIR/probe.json" -o "$QUAL_DIR/storage-put.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] || fail PICKER_PUT "HTTP=$code body=$(cat "$QUAL_DIR/storage-put.json" 2>/dev/null || true)"
pass PICKER_PUT "HTTP=200 probe=$PROBE"
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/storage-after.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] || fail PICKER_GET "HTTP=$code"
actual="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/storage-after.json')).get('target_browse_root',''))")"
[ "$actual" = "$PROBE" ] || fail PICKER_EQUALITY "expected=$PROBE actual=$actual"
pass PICKER_EQUALITY "persisted=$actual"
python3 - "$ORIGINAL" "$QUAL_DIR/restore.json" <<'PY'
import json,sys; open(sys.argv[2],'w').write(json.dumps({'target_browse_root':sys.argv[1]}))
PY
code="$(curl --max-time 10 -sS -X PUT -H 'Content-Type: application/json' --data-binary "@$QUAL_DIR/restore.json" -o "$QUAL_DIR/storage-restore.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" || true)"
[ "$code" = 200 ] || fail PICKER_RESTORE "HTTP=$code"
restored="$(python3 -c "import json;print(json.load(open('$QUAL_DIR/storage-restore.json')).get('target_browse_root',''))")"
[ "$restored" = "$ORIGINAL" ] || fail PICKER_RESTORE "expected original=$ORIGINAL actual=$restored"
pass PICKER_RESTORE "restored original=$ORIGINAL"

code="$(curl --max-time 15 -sS -o "$QUAL_DIR/base-page.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || fail PUBLIC_PAGE "HTTP=$code url=$PUBLIC_URL"
grep -Fq 'SOT-turn01-base' "$QUAL_DIR/base-page.html" || fail PUBLIC_PAGE 'HTTP 200 but canonical Base marker missing'
pass PUBLIC_PAGE "HTTP=200 canonical marker present bytes=$(stat -c %s "$QUAL_DIR/base-page.html")"

SUCCESS=1
pass QUALIFICATION 'Base-16 mechanically qualified with persistent good/bad instrumentation'
echo '=== TURN 01 BASE-16 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
