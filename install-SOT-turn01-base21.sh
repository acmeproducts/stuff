#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
EXPECTED_BUILD='2026.08.30.sot-turn01-base-21'
EXPECTED_PRE_BUILD='2026.08.29.sot-turn01-base-20'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base21-qualification"
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

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
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
  awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY" || true
  echo "persistent log: $LOG"
  echo "summary file:   $SUMMARY"
  echo "run directory:  $QUAL_DIR"
}

cleanup(){
  local rc=$?
  cleanup_windows_test
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    ROLLBACK_ATTEMPTED=1
    info ROLLBACK 'fatal post-cutover failure; restoring exact pre-cutover API/HTML'
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    if [ -f "$RUNTIME_BACKUP" ] && install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"; then pass ROLLBACK_API 'restored prior sot-api.js'; else record FAIL ROLLBACK_API 'restore failed' || true; fi
    if [ "$HAD_HTML" -eq 1 ]; then
      if install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; then pass ROLLBACK_HTML 'restored prior Base HTML'; else record FAIL ROLLBACK_HTML 'restore failed' || true; fi
    else
      rm -f "$SOT_DIR/SOT-turn01-base.html" || true
    fi
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    rb=0
    for i in {1..30}; do
      code="$(curl --max-time 3 -sS -o "$QUAL_DIR/rollback-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
      info ROLLBACK_HEALTH_ATTEMPT "attempt=$i HTTP=$code"
      if [ "$code" = 200 ]; then rb=1; break; fi
      sleep 1
    done
    if [ "$rb" -eq 1 ]; then pass ROLLBACK_HEALTH "build=$(python3 -c "import json;print(json.load(open('$QUAL_DIR/rollback-health.json')).get('build',''))")"; else record FAIL ROLLBACK_HEALTH 'service did not recover' || true; fi
  fi
  if [ "$SUCCESS" -eq 1 ]; then record PASS FINAL 'all mechanical gates passed'; else record FAIL FINAL "qualification failed rc=$rc rollback_attempted=$ROLLBACK_ATTEMPTED" || true; fi
  print_summary
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base21-$STAMP
started=$(date -Is)
expected_build=$EXPECTED_BUILD
pre_build=$EXPECTED_PRE_BUILD
installer_commit=$INSTALLER_COMMIT
frozen_backend=9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js
backend_integrator=1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py
base21_generator=1c39bb2d73e8bec5592b56504f59cebc96db93cf/generate-SOT-turn01-base21.py
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
base21_ui_integrator=6036e0a89dd7f239f5311bebe3e9dc7b96951916/integrate-SOT-turn01-base21-ui.py
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] && pass INSTALLER_IDENTITY "$INSTALLER_COMMIT" || fail INSTALLER_IDENTITY 'pinned installer identity required'

echo '=== TURN 01 BASE-21 UNIFIED STORAGE QUALIFICATION ==='

code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] && pass PRE_HEALTH_HTTP HTTP=200 || fail PRE_HEALTH_HTTP "HTTP=$code"
if meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" 2>&1)"; then pass PRE_HEALTH_PARSE "$meta"; else fail PRE_HEALTH_PARSE "$meta"; fi
IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"
[ "$CURRENT_BUILD" = "$EXPECTED_PRE_BUILD" ] && pass PRE_BUILD "$CURRENT_BUILD" || fail PRE_BUILD "expected=$EXPECTED_PRE_BUILD got=$CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] && pass PRE_SCHEMA schema=4 || fail PRE_SCHEMA "schema=$CURRENT_SCHEMA"
[ "$CURRENT_STATUS" = ok ] && pass PRE_STATUS ok || fail PRE_STATUS "status=$CURRENT_STATUS"

BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
declare -a NAMES=(pre.js integrate.py generate.py pre.html ui.py)
declare -a URLS=(
 "$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js"
 "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py"
 "$BASE/1c39bb2d73e8bec5592b56504f59cebc96db93cf/generate-SOT-turn01-base21.py"
 "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html"
 "$BASE/6036e0a89dd7f239f5311bebe3e9dc7b96951916/integrate-SOT-turn01-base21-ui.py"
)
for i in "${!NAMES[@]}"; do
  n="${NAMES[$i]}"; u="${URLS[$i]}"
  if curl --max-time 30 -fsSL "$u" -o "$TMP/$n"; then pass "FETCH_$n" "bytes=$(stat -c %s "$TMP/$n") sha256=$(sha256sum "$TMP/$n"|awk '{print $1}')"; else fail "FETCH_$n" "$u"; fi
done
for f in integrate.py generate.py ui.py; do if python3 -m py_compile "$TMP/$f"; then pass "PYCOMPILE_$f" ok; else fail "PYCOMPILE_$f" failed; fi; done

if python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"; then pass GENERATE_BASE3 "bytes=$(stat -c %s "$TMP/base3.js") sha256=$(sha256sum "$TMP/base3.js"|awk '{print $1}')"; else fail GENERATE_BASE3 failed; fi
if python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"; then pass GENERATE_BASE21 "bytes=$(stat -c %s "$TMP/sot-api.js") sha256=$(sha256sum "$TMP/sot-api.js"|awk '{print $1}')"; else fail GENERATE_BASE21 failed; fi
if python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/SOT-turn01-base.html"; then pass GENERATE_UI_BASE21 "bytes=$(stat -c %s "$TMP/SOT-turn01-base.html") sha256=$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"; else fail GENERATE_UI_BASE21 failed; fi

if node --check "$TMP/sot-api.js"; then pass NODE_BACKEND ok; else fail NODE_BACKEND failed; fi
for bad in '$args[0]' '$args[1]' '$env:SOT_PATH' '$env:SOT_NAME'; do if grep -Fq "$bad" "$TMP/sot-api.js"; then fail REJECTED_PS_TRANSPORT "survived=$bad"; fi; done
pass REJECTED_PS_TRANSPORT absent
grep -Fq '[Console]::In.ReadToEnd()' "$TMP/sot-api.js" && pass PS_STDIN_READER present || fail PS_STDIN_READER missing
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js" && pass BUILD_MARKER "$EXPECTED_BUILD" || fail BUILD_MARKER missing

if python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" "$QUAL_DIR/ui-contract.txt" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); report=[]
for m in ['TURN01_BASE21_UNIFIED_STORAGE','async function openSourcePicker','async function openDestinationPicker','Source, Target and Backup use the same dynamically discovered storage inventory.','function fullyIndexedStable(p)']:
    if m not in h: raise SystemExit('missing '+m)
    report.append('PRESENT '+m)
s=h[h.index('async function openSourcePicker'):h.index('async function openDestinationPicker')]
d=h[h.index('async function openDestinationPicker'):h.index('function openConfig(){')]
if s.count("api('/turn01/volumes')")!=1 or s.count('/turn01/fs?path=')!=1: raise SystemExit('source snapshot contract')
if 'api(`/fs?path=' in s or "api('/fs" in s: raise SystemExit('legacy source /fs survived')
if d.count("api('/turn01/volumes')")!=1 or d.count('/turn01/fs?path=')!=1: raise SystemExit('destination snapshot contract')
if "assigned=current.map" not in s: raise SystemExit('source initial assigned location missing')
report += ['SOURCE=/turn01/volumes+/turn01/fs','DESTINATION=/turn01/volumes+/turn01/fs','SNAPSHOT_REUSE=true','LEGACY_SOURCE_FS=false','SOURCE_INITIAL_ASSIGNED=true']
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)
Path(sys.argv[2]).write_text('\n;\n'.join(scripts)); Path(sys.argv[3]).write_text('\n'.join(report)+'\n')
PY
then pass SOURCE_DESTINATION_INVENTORY_CONTRACT "$(tr '\n' ';' < "$QUAL_DIR/ui-contract.txt")"; pass LEGACY_SOURCE_WINDOWS_AUTHORITY_ABSENT true; pass INVENTORY_SNAPSHOT_REUSE true; pass SOURCE_INITIAL_BROWSE true; else fail UI_CONTRACT failed; fi
if node --check "$TMP/ui.js"; then pass NODE_UI ok; else fail NODE_UI failed; fi

mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do if cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/$m"; then pass "MIGRATION_$m" copied; else fail "MIGRATION_$m" failed; fi; done
cp "$DB" "$TMP/test.sqlite" && pass TEMP_DB_COPY "bytes=$(stat -c %s "$TMP/test.sqlite")" || fail TEMP_DB_COPY failed
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" > "$QUAL_DIR/temp-preflight.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(api.BUILD!=='2026.08.30.sot-turn01-base-21') throw Error(api.BUILD); if(api.EXPECTED_MIGRATION!==4) throw Error('migration'); if(!Array.isArray(p)) throw Error('projects'); console.log(JSON.stringify({build:api.BUILD,migration:api.EXPECTED_MIGRATION,projects:p.length}));
NODE
then pass TEMP_DB_PREFLIGHT "$(cat "$QUAL_DIR/temp-preflight.json")"; else fail TEMP_DB_PREFLIGHT failed; fi

POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$POWERSHELL" ] && pass POWERSHELL "$POWERSHELL" || fail POWERSHELL missing
if "$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$QUAL_DIR/windows-drives.txt"; then pass WINDOWS_INVENTORY_COMMAND ok; else fail WINDOWS_INVENTORY_COMMAND failed; fi
WIN="$(cat "$QUAL_DIR/windows-drives.txt")"; [ -n "$WIN" ] && pass WINDOWS_INVENTORY "$WIN" || fail WINDOWS_INVENTORY empty
: > "$QUAL_DIR/readable-drives.txt"
IFS=',' read -r -a DRIVES <<< "$WIN"
for D in "${DRIVES[@]}"; do
  D="$(echo "$D"|tr -d '[:space:]'|tr '[:lower:]' '[:upper:]')"; [ -n "$D" ] || continue
  if R="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${D}:\\' -PathType Container) { '1' } else { '0' }" | tr -d '\r\n')"; then
    if [ "$R" = 1 ]; then echo "$D" >> "$QUAL_DIR/readable-drives.txt"; pass "DRIVE_${D}_WINDOWS" readable=1; else info "DRIVE_${D}_WINDOWS" readable=0; fi
  else fail "DRIVE_${D}_WINDOWS" command_failed; fi
done

cp "$TMP/sot-api.js" "$TMP/sot-api-test.js"
if python3 - "$TMP/sot-api-test.js" <<'PY'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text(); old='_test: { review,'; new='_test: { windowsDirectoryExists, windowsDirectoryReadable, windowsListDirectories, windowsCreateDirectory, volumeRoots, sourcePreflight, activeSources, storageFor, saveStorage, listProjects, review,'
if s.count(old)!=1: raise SystemExit('test export marker count='+str(s.count(old)))
p.write_text(s.replace(old,new,1))
PY
then pass TEMP_TEST_EXPORT ok; else fail TEMP_TEST_EXPORT failed; fi
node --check "$TMP/sot-api-test.js" && pass TEMP_TEST_EXPORT_SYNTAX ok || fail TEMP_TEST_EXPORT_SYNTAX failed

if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$QUAL_DIR/windows-drives.txt" > "$QUAL_DIR/capacity.jsonl" <<'NODE'
const fs=require('fs'),api=require(process.argv[2]); const expected=new Set(fs.readFileSync(process.argv[3],'utf8').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean)); const drives=api._test.volumeRoots().filter(v=>v.kind==='drive'); const seen=new Set(drives.map(v=>v.name.replace(':','').toUpperCase())); if(seen.size!==expected.size||[...expected].some(x=>!seen.has(x))) throw Error('inventory mismatch'); for(const v of drives){if(!Number.isFinite(v.free_bytes)||!Number.isFinite(v.total_bytes)||v.free_bytes<0||v.total_bytes<=0||v.free_bytes>v.total_bytes) throw Error('bad capacity '+JSON.stringify(v)); console.log(JSON.stringify({drive:v.name,free:v.free_bytes,total:v.total_bytes,authority:v.authority}));}
NODE
then while IFS= read -r line; do D="$(python3 -c 'import json,sys;print(json.loads(sys.argv[1])["drive"].rstrip(":"))' "$line")"; pass "WINDOWS_CAPACITY_$D" "$line"; done < "$QUAL_DIR/capacity.jsonl"; else fail WINDOWS_CAPACITY 'candidate Windows-native capacity failed'; fi

while read -r D; do
  [ -n "$D" ] || continue
  if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$D" > "$QUAL_DIR/precutover-drive-$D.json" <<'NODE'
const api=require(process.argv[2]); const d=process.argv[3],p='/mnt/'+d.toLowerCase(); if(!api._test.windowsDirectoryExists(p)) throw Error('exists=false'); if(!api._test.windowsDirectoryReadable(p)) throw Error('readable=false'); const f=api._test.windowsListDirectories(p); if(!Array.isArray(f)) throw Error('folders'); console.log(JSON.stringify({drive:d,exists:true,readable:true,folders:f.length}));
NODE
  then pass "PRECUTOVER_DRIVE_$D" "$(cat "$QUAL_DIR/precutover-drive-$D.json")"; else fail "PRECUTOVER_DRIVE_$D" failed; fi
done < "$QUAL_DIR/readable-drives.txt"

for S in F I; do
  if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then
    if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$S" > "$QUAL_DIR/source-preflight-$S.json" <<'NODE'
const api=require(process.argv[2]); const d=process.argv[3],r=api._test.sourcePreflight({source_id:'qualification-'+d,normalized_path:'/mnt/'+d.toLowerCase()}); if(r.blocking||r.status!=='ready') throw Error(JSON.stringify(r)); console.log(JSON.stringify(r));
NODE
    then pass "SOURCE_PREFLIGHT_$S" "$(cat "$QUAL_DIR/source-preflight-$S.json")"; pass "SOURCE_PICKER_$S" 'present via common /turn01/volumes inventory'; else fail "SOURCE_PREFLIGHT_$S" failed; fi
  else info "SOURCE_PREFLIGHT_$S" not-readable-this-run; fi
done

if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$QUAL_DIR/readable-drives.txt" > "$QUAL_DIR/existing-source-preflight.jsonl" <<'NODE'
const fs=require('fs'),api=require(process.argv[2]); const readable=new Set(fs.readFileSync(process.argv[3],'utf8').split(/\s+/).filter(Boolean).map(x=>x.toLowerCase())); let count=0; for(const p of api._test.listProjects()){for(const s of api._test.activeSources(p.project_token)){const m=String(s.normalized_path||'').match(/^\/mnt\/([a-z])(?:\/|$)/i); if(!m||!readable.has(m[1].toLowerCase())) continue; const r=api._test.sourcePreflight(s); if(r.blocking||r.status!=='ready') throw Error('source='+s.normalized_path+' result='+JSON.stringify(r)); console.log(JSON.stringify({project:p.project_token,path:s.normalized_path,status:r.status,authority:r.authority})); count++;}} console.error('checked='+count);
NODE
then pass EXISTING_SOURCE_PREFLIGHT "checked readable Windows-backed active Sources; rows=$(wc -l < "$QUAL_DIR/existing-source-preflight.jsonl")"; else fail EXISTING_SOURCE_PREFLIGHT failed; fi

if WIN_TEMP="$("$POWERSHELL" -NoProfile -NonInteractive -Command '$env:TEMP' | tr -d '\r\n')"; then pass WINDOWS_TEMP_PATH "$WIN_TEMP"; else fail WINDOWS_TEMP_PATH failed; fi
TEMP_POSIX="$(wslpath -u "$WIN_TEMP")" || fail WINDOWS_TEMP_TRANSLATION failed
TEST_NAME="sot-base21-qual-$STAMP"; WINDOWS_TEST_PATH="${WIN_TEMP%\\}\\$TEST_NAME"
if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" "$TEMP_POSIX" "$TEST_NAME" > "$QUAL_DIR/create-folder.json" <<'NODE'
const api=require(process.argv[2]); const parent=process.argv[3],name=process.argv[4]; api._test.windowsCreateDirectory(parent,name); const child=parent.replace(/\/$/,'')+'/'+name; if(!api._test.windowsDirectoryExists(child)) throw Error('create failed'); console.log(JSON.stringify({parent,name,child}));
NODE
then pass PRECUTOVER_FOLDER_CREATE "$(cat "$QUAL_DIR/create-folder.json")"; else fail PRECUTOVER_FOLDER_CREATE failed; fi
if printf '%s' "$WINDOWS_TEST_PATH" | "$POWERSHELL" -NoProfile -NonInteractive -Command '$p=[Console]::In.ReadToEnd(); if(Test-Path -LiteralPath $p){Remove-Item -LiteralPath $p -Force -Recurse -ErrorAction Stop}; if(Test-Path -LiteralPath $p){exit 3}'; then pass PRECUTOVER_FOLDER_CLEANUP removed; WINDOWS_TEST_PATH=''; else fail PRECUTOVER_FOLDER_CLEANUP failed; fi

if SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api-test.js" > "$QUAL_DIR/persistence.json" <<'NODE'
const api=require(process.argv[2]); const p=api._test.listProjects(); if(!p.length) throw Error('no project'); const t=p[0].project_token,b=api._test.storageFor(t),probe='/mnt/c'; api._test.saveStorage(t,{target_browse_root:probe}); const a=api._test.storageFor(t); if(a.target_browse_root!==probe) throw Error('persist'); api._test.saveStorage(t,{target_browse_root:b.target_browse_root||''}); console.log(JSON.stringify({token:t,persisted:a.target_browse_root,restored:b.target_browse_root||''}));
NODE
then pass PICKER_PERSISTENCE_COPY_DB "$(cat "$QUAL_DIR/persistence.json")"; else fail PICKER_PERSISTENCE_COPY_DB failed; fi

LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base20-before-base21"; mkdir -p "$LIVE_ARCHIVE"
cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js" && pass ARCHIVE_API "$LIVE_ARCHIVE/sot-api.js" || fail ARCHIVE_API failed
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html" && HAD_HTML=1 && pass ARCHIVE_HTML "$LIVE_ARCHIVE/SOT-turn01-base.html" || fail ARCHIVE_HTML failed; fi
sha256sum "$LIVE_ARCHIVE"/* > "$QUAL_DIR/precutover-sha256.txt" && pass PRECUTOVER_CHECKSUMS "$(tr '\n' ';' < "$QUAL_DIR/precutover-sha256.txt")" || fail PRECUTOVER_CHECKSUMS failed
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"; [ "$HAD_HTML" -eq 1 ] && cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP" || true

CUTOVER=1
sudo systemctl stop "$SERVICE" && pass SERVICE_STOP stopped || fail SERVICE_STOP failed
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js" && pass INSTALL_API "sha256=$(sha256sum "$REPORT_ROOT/sot-api.js"|awk '{print $1}')" || fail INSTALL_API failed
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html" && pass INSTALL_HTML "sha256=$(sha256sum "$SOT_DIR/SOT-turn01-base.html"|awk '{print $1}')" || fail INSTALL_HTML failed
sudo systemctl start "$SERVICE" && pass SERVICE_START started || fail SERVICE_START failed
ok=0; for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$QUAL_DIR/live-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; info LIVE_HEALTH_ATTEMPT "attempt=$i HTTP=$code"; if [ "$code" = 200 ]; then ok=1; break; fi; sleep 1; done
[ "$ok" -eq 1 ] || fail LIVE_HEALTH_HTTP not_ready
if live="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/live-health.json'));assert x.get('build')=='$EXPECTED_BUILD' and x.get('database_version')==4 and x.get('status')=='ok',x;print(x['build'])" 2>&1)"; then pass LIVE_HEALTH_CONTRACT "$live schema=4 status=ok"; else fail LIVE_HEALTH_CONTRACT "$live"; fi

code="$(curl --max-time 15 -sS -o "$QUAL_DIR/volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"; [ "$code" = 200 ] && pass LIVE_VOLUMES HTTP=200 || fail LIVE_VOLUMES "HTTP=$code"
if inv="$(python3 - "$QUAL_DIR/windows-drives.txt" "$QUAL_DIR/volumes.json" <<'PY'
import json,sys
w={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}; v=json.load(open(sys.argv[2])); ds=[x for x in v.get('volumes',[]) if x.get('kind')=='drive']; s={str(x.get('name','')).rstrip(':').upper() for x in ds}; assert s==w,(s,w)
for x in ds:
    assert isinstance(x.get('free_bytes'),(int,float)) and isinstance(x.get('total_bytes'),(int,float)) and x['total_bytes']>0 and x['free_bytes']>=0,(x)
print('windows='+','.join(sorted(w))+' sot='+','.join(sorted(s))+' capacity=native')
PY
)"; then pass INVENTORY_EXACT_MATCH "$inv"; pass LIVE_WINDOWS_CAPACITY "$inv"; else fail INVENTORY_EXACT_MATCH "$inv"; fi

while read -r D; do [ -n "$D" ] || continue; L="$(echo "$D"|tr '[:upper:]' '[:lower:]')"; code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$L" -o "$QUAL_DIR/drive-$D.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"; [ "$code" = 200 ] || fail "DRIVE_${D}_BROWSE" "HTTP=$code"; c="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/drive-$D.json'));assert isinstance(x.get('folders'),list);print(len(x['folders']))")" || fail "DRIVE_${D}_BROWSE_PARSE" failed; pass "DRIVE_${D}_BROWSE" "HTTP=200 folders=$c"; done < "$QUAL_DIR/readable-drives.txt"
for S in F I; do if grep -qx "$S" "$QUAL_DIR/readable-drives.txt"; then grep -q $'PASS\tDRIVE_'"$S"'_BROWSE' "$SUMMARY" && pass "SPECIAL_$S" unified-source-destination-browse-passed || fail "SPECIAL_$S" failed; fi; done

code="$(curl --max-time 15 -sS -o "$QUAL_DIR/base-page.html" -w '%{http_code}' "$PUBLIC_URL" || true)"; [ "$code" = 200 ] && pass PUBLIC_PAGE_HTTP HTTP=200 || fail PUBLIC_PAGE_HTTP "HTTP=$code"
grep -Fq 'TURN01_BASE21_UNIFIED_STORAGE' "$QUAL_DIR/base-page.html" && pass PUBLIC_PAGE_MARKER Base21 || fail PUBLIC_PAGE_MARKER missing

SUCCESS=1
pass QUALIFICATION 'Base-21 mechanically qualified'
echo '=== TURN 01 BASE-21 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
