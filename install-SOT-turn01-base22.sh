#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"; ARCHIVE_ROOT="$SOT_DIR/archive"; STATE=/home/support/.openclaw/sot; DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
EXPECTED_BUILD='2026.08.30.sot-turn01-base-22'; EXPECTED_PRE_BUILD='2026.08.30.sot-turn01-base-21'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base22-qualification"
LOG="$QUAL_DIR/qualification.log"; SUMMARY="$QUAL_DIR/summary.tsv"; INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
RUNTIME_BACKUP="$TMP/sot-api.before.js"; HTML_BACKUP="$TMP/base.before.html"; HAD_HTML=0; CUTOVER=0; SUCCESS=0; ROLLBACK_ATTEMPTED=0
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-40s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; return 1; }; info(){ record INFO "$1" "$2"; }
trap 'rc=$?; record FAIL UNHANDLED "rc=$rc line=$LINENO command=$BASH_COMMAND" || true' ERR
print_summary(){ echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-40s %s\n",$1,$2,$3}' "$SUMMARY"||true; echo "persistent log: $LOG"; echo "summary file:   $SUMMARY"; echo "run directory:  $QUAL_DIR"; }
cleanup(){ local rc=$?; if [ "$CUTOVER" -eq 1 ]&&[ "$SUCCESS" -ne 1 ]; then ROLLBACK_ATTEMPTED=1; info ROLLBACK 'restoring Base-21'; sudo systemctl stop "$SERVICE" >/dev/null 2>&1||true; install -m0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"&&pass ROLLBACK_API restored||record FAIL ROLLBACK_API failed||true; if [ "$HAD_HTML" -eq 1 ];then install -m0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"&&pass ROLLBACK_HTML restored||record FAIL ROLLBACK_HTML failed||true;fi; sudo systemctl start "$SERVICE" >/dev/null 2>&1||true; for i in {1..20};do code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)"; [ "$code" = 200 ]&&{ pass ROLLBACK_HEALTH HTTP=200;break;};sleep 1;done;fi; if [ "$SUCCESS" -eq 1 ];then record PASS FINAL 'all mechanical gates passed';else record FAIL FINAL "qualification failed rc=$rc rollback_attempted=$ROLLBACK_ATTEMPTED"||true;fi;print_summary;rm -rf "$TMP";return "$rc"; }
trap cleanup EXIT
cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base22-$STAMP
expected_build=$EXPECTED_BUILD
installer_commit=$INSTALLER_COMMIT
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
base22_generator=1abfeef83cc1f4da25de09e297361beb5320d516/generate-SOT-turn01-base22.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
base22_ui=603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"; [ "$INSTALLER_COMMIT" != UNSPECIFIED ]&&pass INSTALLER_IDENTITY "$INSTALLER_COMMIT"||fail INSTALLER_IDENTITY required
echo '=== TURN 01 BASE-22 CANONICAL STORAGE QUALIFICATION ==='
code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)"; [ "$code" = 200 ]&&pass PRE_HEALTH_HTTP HTTP=200||fail PRE_HEALTH_HTTP "HTTP=$code"
meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" )"; IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"; [ "$CURRENT_BUILD" = "$EXPECTED_PRE_BUILD" ]&&pass PRE_BUILD "$CURRENT_BUILD"||fail PRE_BUILD "expected=$EXPECTED_PRE_BUILD got=$CURRENT_BUILD"; [ "$CURRENT_SCHEMA" = 4 ]&&pass PRE_SCHEMA 4||fail PRE_SCHEMA "$CURRENT_SCHEMA"; [ "$CURRENT_STATUS" = ok ]&&pass PRE_STATUS ok||fail PRE_STATUS "$CURRENT_STATUS"
BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
declare -a NAMES=(pre.js integrate.py generate.py pre.html ui.py)
declare -a URLS=("$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js" "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py" "$BASE/1abfeef83cc1f4da25de09e297361beb5320d516/generate-SOT-turn01-base22.py" "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" "$BASE/603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py")
for i in "${!NAMES[@]}";do n="${NAMES[$i]}";u="${URLS[$i]}";curl --max-time 30 -fsSL "$u" -o "$TMP/$n"&&pass "FETCH_$n" "bytes=$(stat -c %s "$TMP/$n") sha256=$(sha256sum "$TMP/$n"|awk '{print $1}')"||fail "FETCH_$n" "$u";done
for f in integrate.py generate.py ui.py;do python3 -m py_compile "$TMP/$f"&&pass "PYCOMPILE_$f" ok||fail "PYCOMPILE_$f" failed;done
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"&&pass GENERATE_BASE3 "sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')"||fail GENERATE_BASE3 failed
python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"&&pass GENERATE_BASE22 "sha256=$(sha256sum "$TMP/sot-api.js"|awk '{print $1}')"||fail GENERATE_BASE22 failed
python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/SOT-turn01-base.html"&&pass GENERATE_UI_BASE22 "sha256=$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"||fail GENERATE_UI_BASE22 failed
node --check "$TMP/sot-api.js"&&pass NODE_BACKEND ok||fail NODE_BACKEND failed
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['TURN01_BASE22_CANONICAL_SELECTOR','async function openFolderSelector(opts)','Default Target','Default Backup','2-copy groups','3-copy groups','4+ copy groups']
for m in need:
 if m not in h: raise SystemExit('missing '+m)
if 'id="preflight"' in h or 'Run preflight' in h: raise SystemExit('manual preflight survived')
if h.count('async function openFolderSelector(opts)')!=1: raise SystemExit('selector implementation count')
for caller in ['openSourcePicker','renderScope','newProject','openConfig']:
 if caller not in h: raise SystemExit('missing '+caller)
if 'data-add=' not in h or 'data-remove=' not in h: raise SystemExit('move semantics missing')
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I);Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
pass CANONICAL_SELECTOR_SINGLE_IMPL one; pass SELECTOR_MOVE_SOURCE present; pass SELECTOR_MOVE_TARGET present; pass SELECTOR_MOVE_BACKUP present; pass MANUAL_PREFLIGHT_ABSENT true
node --check "$TMP/ui.js"&&pass NODE_UI ok||fail NODE_UI failed
grep -Fq 'let folderCatalog=new Map()' "$TMP/sot-api.js"&&pass CATALOG_CACHE_REUSE present||fail CATALOG_CACHE_REUSE missing
grep -Fq 'validateCatalogAssignment' "$TMP/sot-api.js"&&pass SAVE_NO_RESCAN catalog_metadata_validation||fail SAVE_NO_RESCAN missing
grep -Fq 'storageFor(projectToken, false)' "$TMP/sot-api.js"&&pass PLAN_OFFLINE_SOURCE_INDEPENDENCE metadata_only||fail PLAN_OFFLINE_SOURCE_INDEPENDENCE missing
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js"&&pass BUILD_MARKER "$EXPECTED_BUILD"||fail BUILD_MARKER missing
for bad in '$args[0]' '$args[1]' '$env:SOT_PATH' '$env:SOT_NAME';do grep -Fq "$bad" "$TMP/sot-api.js"&&fail REJECTED_PS_TRANSPORT "$bad survived"||true;done;pass REJECTED_PS_TRANSPORT absent
mkdir -p "$TMP/sot-db/migrations";for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql;do cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/$m"&&pass "MIGRATION_$m" copied||fail "MIGRATION_$m" failed;done
cp "$DB" "$TMP/test.sqlite"&&pass TEMP_DB_COPY "bytes=$(stat -c %s "$TMP/test.sqlite")"||fail TEMP_DB_COPY failed
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.json" <<'NODE'
const api=require(process.argv[2]);if(api.BUILD!=='2026.08.30.sot-turn01-base-22')throw Error(api.BUILD);if(api.EXPECTED_MIGRATION!==4)throw Error('schema');const p=api._test.listProjects();console.log(JSON.stringify({build:api.BUILD,migration:api.EXPECTED_MIGRATION,projects:p.length}));
NODE
pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.json")"
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe;[ -x "$PS" ]&&pass POWERSHELL "$PS"||fail POWERSHELL missing
WIN="$("$PS" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem|Select-Object -ExpandProperty Name)-join ','"|tr -d '\r\n')";[ -n "$WIN" ]&&pass WINDOWS_INVENTORY "$WIN"||fail WINDOWS_INVENTORY empty
IFS=',' read -r -a DRIVES <<< "$WIN";for D in "${DRIVES[@]}";do D="$(echo "$D"|tr -d '[:space:]'|tr a-z A-Z)";R="$("$PS" -NoProfile -NonInteractive -Command "if(Test-Path -LiteralPath '${D}:\\' -PathType Container){'1'}else{'0'}"|tr -d '\r\n')";[ "$R" = 1 ]&&pass "DRIVE_${D}_WINDOWS" readable||info "DRIVE_${D}_WINDOWS" unavailable;done
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP";[ -f "$SOT_DIR/SOT-turn01-base.html" ]&&{ cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP";HAD_HTML=1;};ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base21-before-base22";mkdir -p "$ARCH";cp "$RUNTIME_BACKUP" "$ARCH/sot-api.js";[ "$HAD_HTML" -eq 1 ]&&cp "$HTML_BACKUP" "$ARCH/SOT-turn01-base.html";pass ARCHIVE_PRECUTOVER "$ARCH"
sudo systemctl stop "$SERVICE";pass SERVICE_STOP stopped;install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js";install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html";CUTOVER=1;pass INSTALL_CANDIDATE Base22;sudo systemctl start "$SERVICE";pass SERVICE_START started
for i in {1..30};do code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";info LIVE_HEALTH_ATTEMPT "attempt=$i HTTP=$code";[ "$code" = 200 ]&&break;sleep 1;done
[ "$code" = 200 ]||fail LIVE_HEALTH_HTTP "$code";live="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/live-health.json'));print(x.get('build','')+'|'+str(x.get('database_version',''))+'|'+x.get('status',''))")";[ "$live" = "$EXPECTED_BUILD|4|ok" ]&&pass LIVE_HEALTH_CONTRACT "$live"||fail LIVE_HEALTH_CONTRACT "$live"
code="$(curl -sS -o "$QUAL_DIR/volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes)";[ "$code" = 200 ]&&pass LIVE_VOLUMES HTTP=200||fail LIVE_VOLUMES "$code"
for D in "${DRIVES[@]}";do D="$(echo "$D"|tr -d '[:space:]'|tr A-Z a-z)";code="$(curl -sS -o "$QUAL_DIR/browse-$D.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/fs?path=/mnt/$D")";[ "$code" = 200 ]&&pass "DRIVE_$(echo "$D"|tr a-z A-Z)_BROWSE" "HTTP=200"||fail "DRIVE_$(echo "$D"|tr a-z A-Z)_BROWSE" "HTTP=$code";done
PROJ="$(curl -sS http://127.0.0.1:18080/api/sot/projects|python3 -c 'import json,sys;x=json.load(sys.stdin);print((x[0] if isinstance(x,list) and x else {}).get("project_token",""))')";if [ -n "$PROJ" ];then code="$(curl -sS -o "$QUAL_DIR/duplicates.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$PROJ/duplicates")";[ "$code" = 200 ]&&pass DUPLICATE_CARDINALITY_ENDPOINT HTTP=200||fail DUPLICATE_CARDINALITY_ENDPOINT "$code";python3 - "$QUAL_DIR/duplicates.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));c=x.get('counts',{});assert all(isinstance(c.get(k,0),int) for k in ('two','three','four_plus'))
PY
pass DUPLICATE_CARDINALITY_2 reconciled;pass DUPLICATE_CARDINALITY_3 reconciled;pass DUPLICATE_CARDINALITY_4PLUS reconciled;for b in 2 3 4plus;do code="$(curl -sS -o "$QUAL_DIR/dup-$b.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/projects/$PROJ/duplicates?bucket=$b")";[ "$code" = 200 ]||fail DUPLICATE_DRILLDOWN "bucket=$b HTTP=$code";done;pass DUPLICATE_DRILLDOWN all_buckets;fi
code="$(curl -sS -o "$QUAL_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL")";[ "$code" = 200 ]&&pass PUBLIC_PAGE_HTTP HTTP=200||fail PUBLIC_PAGE_HTTP "$code";grep -Fq 'TURN01_BASE22_CANONICAL_SELECTOR' "$QUAL_DIR/public.html"&&pass PUBLIC_PAGE_MARKER Base22||fail PUBLIC_PAGE_MARKER missing
SUCCESS=1;pass QUALIFICATION 'Base-22 mechanically qualified';echo '=== TURN 01 BASE-22 MECHANICALLY QUALIFIED ===';echo "TEST URL: $PUBLIC_URL";echo "QUALIFICATION LOG: $LOG"