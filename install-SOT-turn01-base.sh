#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}";SOT_DIR="$REPORT_ROOT/SOT";STATE="${SOT_ROOT:-/home/support/.openclaw/sot}";DB="$STATE/sot.sqlite";SERVICE=openclaw-report-server.service
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}";EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2';EXPECTED_SCHEMA=5
RAW='https://raw.githubusercontent.com/acmeproducts/stuff';R8I='d1b397902e6dce35e620b36ee0454ed666adb74d';R9I='9c94559e70243adf3b7e87e1a10c98fe1602f174';R9UI='c9a014c2c3b578b1c207665a0ea6655b73e0327c'
TMP="$(mktemp -d)";STAMP="$(date +%Y%m%d-%H%M%S)";RUN="$SOT_DIR/archive/$STAMP-turn01-r9-database-master-detail-release";mkdir -p "$RUN" "$TMP/sot-db/migrations";LOG="$RUN/release.log";SUMMARY="$RUN/summary.tsv";touch "$LOG" "$SUMMARY";exec > >(tee -a "$LOG") 2>&1
CUTOVER=0;SUCCESS=0;record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY";printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3";};pass(){ record PASS "$1" "$2";};fail(){ record FAIL "$1" "$2";return 1;}
cleanup(){ rc=$?;set +e;if [ "$CUTOVER" -eq 1 ]&&[ "$SUCCESS" -ne 1 ];then sudo systemctl stop "$SERVICE" >/dev/null 2>&1||true;cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js";cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html";sudo systemctl start "$SERVICE" >/dev/null 2>&1||true;record PASS ROLLBACK 'restored previous backend and UI';fi;echo '=== QUALIFICATION SUMMARY ===';awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY";echo "log: $LOG";rm -rf "$TMP";return "$rc";};trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl;do command -v "$t" >/dev/null||fail REQUIRE_TOOL "$t";done;pass REQUIRE_TOOLS ok
[ -s "$DB" ]||fail DATABASE missing;[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_INTEGRITY failed;SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')";[ "$SCHEMA" = "$EXPECTED_SCHEMA" ]||fail DATABASE_SCHEMA "expected=$EXPECTED_SCHEMA actual=$SCHEMA";pass DATABASE_INTEGRITY "schema=$SCHEMA"
code=000;for i in {1..20};do code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail LIVE_BACKEND "HTTP=$code";python3 - "$RUN/health.before.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));assert x.get('build')==sys.argv[2],x;assert int(x.get('database_version',0))==5,x
for c in ['durable-project-coordination','stale-operation-rejection','atomic-evidence-cutover','concurrent-project-indexing']:assert c in x.get('capabilities',[]),(c,x)
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=5"
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before";cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before";pass ARCHIVE_PRECHANGE "$RUN";cp "$REPORT_ROOT/sot-api.js" "$TMP/sot-api.js"
if ! grep -q 'function ssotReconciliation()' "$TMP/sot-api.js";then curl --retry 5 --retry-all-errors -fsSL "$RAW/$R8I/integrate-SOT-turn01-r8-ssot.py" -o "$TMP/r8.py";python3 "$TMP/r8.py" "$TMP/sot-api.js";fi
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9I/integrate-SOT-turn01-r9-catalog.py" -o "$TMP/r9.py";python3 -m py_compile "$TMP/r9.py";python3 "$TMP/r9.py" "$TMP/sot-api.js";node --check "$TMP/sot-api.js";pass R9_BACKEND_PARSE 'R8 reconciliation + R9 catalog'
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9UI/SOT-turn01-base-r9.html" -o "$TMP/SOT-turn01-base.html";python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['SOT-turn01-base-r9-database-master-detail','Dashboard','Database','Activity','Storage estate','Active now','Unique content','Verified copy A','Verified copy B','Fully protected','Needs protection','Master list · select a row for detail','deep dive','Download JSON','Print','/turn01/catalog','fingerprint/pause','fingerprint/resume','fingerprint/stop']
for x in need:assert x in h,x
for bad in ['Storage estate</button>','CURRENT STATE · NEXT STEP','✓ Setup','✓ Index','✓ Review']:assert bad not in h,bad
assert h.index('Storage estate')<h.index('Active now')<h.index('Projects</h2>')
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js";pass R9_UI_CONTRACT 'dashboard bars + active-now + master/detail + database + deep dive'
cp "$DB" "$TMP/test.sqlite";SOT_DB_PATH="$TMP/test.sqlite" node - "$TMP/sot-api.js" > "$TMP/catalog.json" <<'NODE'
const a=require(process.argv[2]);const c=a._test.ssotCatalog('content','',20,'');const l=a._test.ssotCatalog('locations','',20,'');const p=a._test.listProjects();if(!Array.isArray(c.rows)||!Array.isArray(l.rows)||!Array.isArray(p))throw Error('catalog contract');console.log(JSON.stringify({content:c.rows.length,locations:l.rows.length,projects:p.length}));
NODE
pass R9_DATABASE_BEHAVIOR "$(cat "$TMP/catalog.json")"
sqlite3 "$TMP/test.sqlite" <<'SQL'
INSERT INTO projects(project_token,project_name,evidence_revision,status,created_at,updated_at) VALUES('r9active','R9 active fixture',0,'Pending','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO processing_runs(run_id,project_token,state,phase,files_discovered,bytes_discovered,files_processed,bytes_processed,started_at,updated_at) VALUES('r9run','r9active','WIP','fingerprinting',100,1000000,40,400000,'2026-09-06T00:00:00Z','2026-09-06T00:00:01Z');
SQL
SOT_DB_PATH="$TMP/test.sqlite" node - "$TMP/sot-api.js" <<'NODE'
const a=require(process.argv[2]);const p=a._test.listProjects().find(x=>x.project_token==='r9active');if(!p||p.processing_state!=='WIP'||Number(p.files_processed)!==40||Number(p.files_discovered)!==100)throw Error(JSON.stringify(p));console.log('active fixture: WIP 40/100 visible');
NODE
pass R9_ACTIVE_BEHAVIOR 'running fixture exposes WIP 40/100 before UI cutover'
sudo systemctl stop "$SERVICE";install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js";install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html";CUTOVER=1;sudo systemctl start "$SERVICE";pass CUTOVER 'R9 catalog + database-centered dashboard installed'
code=000;for i in {1..30};do code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail POST_HEALTH "HTTP=$code";pass POST_HEALTH HTTP=200
for endpoint in 'turn01/ssot' 'turn01/catalog?view=content&limit=5' 'activity?limit=5' 'turn01/projects';do code="$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint"||true)";[ "$code" = 200 ]||fail LIVE_R9_ENDPOINT "$endpoint HTTP=$code";done;pass LIVE_R9_ENDPOINTS 'ssot + catalog + activity + project progress HTTP=200'
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')";code=000;for i in {1..20};do code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA"||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail PUBLIC_HTTP "HTTP=$code";PUBLIC_SHA="$(sha256sum "$RUN/public.html"|awk '{print $1}')";[ "$PUBLIC_SHA" = "$LOCAL_SHA" ]||fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA";pass PUBLIC_IDENTITY "$PUBLIC_SHA";[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_POSTCHECK failed;pass DATABASE_POSTCHECK ok;SUCCESS=1;pass RELEASE_READY 'R9 database-centered master/detail'
echo '=== TURN 01 BASE R9 READY FOR OWNER TEST ===';echo "PUBLIC SHA256: $PUBLIC_SHA";echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
