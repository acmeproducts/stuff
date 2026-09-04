#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
ARCHIVE_ROOT="$SOT_DIR/archive"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2'
EXPECTED_SCHEMA=5
QUALIFIED_COMMIT='b58920f014960c9b18b705a0fdcf0406c621fd5f'
QUALIFICATION_RUN='core=33919314140 ui=33922645501'
PRE_UI='7a377c27e1ac078510b9d1e4fe66da4f997f25f3'
PRE_API='9422453c180f8fce4e7d5fe362867912dc8005d1'
BASE_API='1aebf2624621b08880a595ef9d1f58f2c8cde1b'
BASE22_API='1abfeef83cc1f4da25de09e297361beb5320d516'
UI22='603e8a331b13b72a097e9ebb9640e33707279777'
UI24='083aa1334208b1e6995fa18852e82722a815f331'
UIAI='5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5'
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'

TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$ARCHIVE_ROOT/$STAMP-turn01-base-qualified-release"
mkdir -p "$RUN"
LOG="$RUN/release.log"
SUMMARY="$RUN/summary.tsv"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

CUTOVER=0
SUCCESS=0
MIGRATION_PREEXISTED=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-42s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; exit 1; }
fetch(){ curl --retry 5 --retry-all-errors --max-time 45 -fsSL "$1" -o "$2" || fail FETCH "$1"; }

cleanup(){
  rc=$?
  set +e
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    [ -f "$RUN/sot.sqlite.before" ] && cp "$RUN/sot.sqlite.before" "$DB"
    [ -f "$RUN/sot-api.js.before" ] && cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"
    [ -f "$RUN/sot-worker.js.before" ] && cp "$RUN/sot-worker.js.before" "$REPORT_ROOT/sot-worker.js" || rm -f "$REPORT_ROOT/sot-worker.js"
    [ -f "$RUN/sot-coordinator.js.before" ] && cp "$RUN/sot-coordinator.js.before" "$REPORT_ROOT/sot-coordinator.js" || rm -f "$REPORT_ROOT/sot-coordinator.js"
    [ -f "$RUN/SOT-turn01-base.html.before" ] && cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html" || rm -f "$SOT_DIR/SOT-turn01-base.html"
    if [ "$MIGRATION_PREEXISTED" -eq 1 ]; then
      [ -f "$RUN/005-project-coordination.sql.before" ] && cp "$RUN/005-project-coordination.sql.before" "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql"
    else
      rm -f "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql"
    fi
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    record PASS ROLLBACK 'restored prechange SOT runtime/database'
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-42s %s\n",$1,$2,$3}' "$SUMMARY"
  echo "log: $LOG"
  rm -rf "$TMP"
  exit "$rc"
}
trap cleanup EXIT

for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail DATABASE missing
[ -s "$REPORT_ROOT/sot-sqlite.py" ] || fail SQLITE_ADAPTER "$REPORT_ROOT/sot-sqlite.py missing"
mkdir -p "$REPORT_ROOT/sot-db/migrations" "$ARCHIVE_ROOT" "$SOT_DIR"

cp "$DB" "$RUN/sot.sqlite.before"
[ -f "$REPORT_ROOT/sot-api.js" ] && cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"
[ -f "$REPORT_ROOT/sot-worker.js" ] && cp "$REPORT_ROOT/sot-worker.js" "$RUN/sot-worker.js.before"
[ -f "$REPORT_ROOT/sot-coordinator.js" ] && cp "$REPORT_ROOT/sot-coordinator.js" "$RUN/sot-coordinator.js.before"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"
if [ -f "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql" ]; then MIGRATION_PREEXISTED=1; cp "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql" "$RUN/005-project-coordination.sql.before"; fi
pass ARCHIVE_PRECHANGE "$RUN"

cat >"$RUN/qualified-source.txt" <<EOF
qualified_commit=$QUALIFIED_COMMIT
qualification_run=$QUALIFICATION_RUN
expected_build=$EXPECTED_BUILD
expected_schema=$EXPECTED_SCHEMA
pre_ui=$PRE_UI
pre_api=$PRE_API
EOF
pass QUALIFIED_SOURCE "$QUALIFIED_COMMIT $QUALIFICATION_RUN"

fetch "$RAW/$PRE_API/sot-api.js" "$TMP/pre.js"
fetch "$RAW/$BASE_API/integrate-SOT-turn01-base.py" "$TMP/base.py"
fetch "$RAW/$BASE22_API/generate-SOT-turn01-base22.py" "$TMP/base22.py"
fetch "$RAW/$QUALIFIED_COMMIT/integrate-SOT-turn01-coordination.py" "$TMP/coord.py"
fetch "$RAW/$QUALIFIED_COMMIT/integrate-SOT-turn01-coordination2.py" "$TMP/coord2.py"
fetch "$RAW/$QUALIFIED_COMMIT/sot-db/migrations/005-project-coordination.sql" "$TMP/005.sql"
fetch "$RAW/$QUALIFIED_COMMIT/sot-worker.js" "$TMP/sot-worker.js"
fetch "$RAW/$QUALIFIED_COMMIT/sot-coordinator.js" "$TMP/sot-coordinator.js"
python3 -m py_compile "$TMP/base.py" "$TMP/base22.py" "$TMP/coord.py" "$TMP/coord2.py" || fail PYTHON_PARSE failed
python3 "$TMP/base.py" "$TMP/pre.js" "$TMP/base3.js"
python3 "$TMP/base22.py" "$TMP/base3.js" "$TMP/base22.js"
python3 "$TMP/coord.py" "$TMP/base22.js" "$TMP/c1.js"
python3 "$TMP/coord2.py" "$TMP/c1.js" "$TMP/sot-api.js" || fail BACKEND_GENERATION failed
node --check "$TMP/sot-api.js" || fail BACKEND_JS_PARSE failed
node --check "$TMP/sot-worker.js" || fail WORKER_JS_PARSE failed
node --check "$TMP/sot-coordinator.js" || fail COORDINATOR_JS_PARSE failed

fetch "$RAW/$PRE_UI/SOT-turn01-pre-base.html" "$TMP/pre.html"
fetch "$RAW/$UI22/integrate-SOT-turn01-base22-ui.py" "$TMP/u22.py"
fetch "$RAW/$UI24/integrate-SOT-turn01-base24-ui.py" "$TMP/u24.py"
fetch "$RAW/$UIAI/integrate-SOT-turn01-base-ai.py" "$TMP/uai.py"
fetch "$RAW/$QUALIFIED_COMMIT/integrate-SOT-turn01-coordination-ui.py" "$TMP/ucoord.py"
fetch "$RAW/$QUALIFIED_COMMIT/integrate-SOT-turn01-coordination2-ui.py" "$TMP/ucoord2.py"
python3 -m py_compile "$TMP/u22.py" "$TMP/u24.py" "$TMP/uai.py" "$TMP/ucoord.py" "$TMP/ucoord2.py" || fail UI_GENERATOR_PARSE failed
python3 "$TMP/u22.py" "$TMP/pre.html" "$TMP/22.html"
python3 "$TMP/u24.py" "$TMP/22.html" "$TMP/24.html"
python3 "$TMP/uai.py" "$TMP/24.html" "$TMP/base.html"
python3 "$TMP/ucoord.py" "$TMP/base.html" "$TMP/u1.html"
python3 "$TMP/ucoord2.py" "$TMP/u1.html" "$TMP/SOT-turn01-base.html" || fail UI_GENERATION failed
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
required=['TURN01_BASE24_OWNER_GATE','TURN01_BASE28_OPERATIONAL_AI','2-copy groups','3-copy groups','4+ copy groups','availableFolderSearch','selectorCommit','Current Plan','Previous / Stale Plan','Default Target','Default Backup','Venice.ai','OpenRouter','function sotOperatorBusy()',"Promise.all([api('/projects'),api('/rollup')])",'state.projects=next','state.selected=selected']
for marker in required: assert marker in h, marker
PY
node --check "$TMP/ui.js" || fail UI_JS_PARSE failed

python3 - "$TMP/sot-api.js" "$EXPECTED_BUILD" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
required=[f"const BUILD = '{sys.argv[2]}';",'const EXPECTED_MIGRATION = 5;','function claimProjectOperation(projectToken,kind)','active_operation_id','operation_generation','durable-project-coordination']
for marker in required: assert marker in s, marker
PY
pass QUALIFIED_CANDIDATE 'clean lineage + executable-qualified coordination delta'

C="$(sha256sum "$TMP/005.sql"|awk '{print $1}')"
PRE_SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')"
case "$PRE_SCHEMA" in ''|*[!0-9]*) fail DATABASE_SCHEMA "invalid current version: $PRE_SCHEMA";; esac
[ "$PRE_SCHEMA" -le "$EXPECTED_SCHEMA" ] || fail DATABASE_SCHEMA "live schema $PRE_SCHEMA newer than installer $EXPECTED_SCHEMA"
cp "$DB" "$TMP/test.sqlite"
if [ "$PRE_SCHEMA" -lt 5 ]; then
  sqlite3 "$TMP/test.sqlite" < "$TMP/005.sql" || fail MIGRATION_DRY_RUN failed
  sqlite3 "$TMP/test.sqlite" "INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(5,'005-project-coordination.sql','$C',strftime('%Y-%m-%dT%H:%M:%fZ','now'));" || fail MIGRATION_LEDGER_DRY_RUN failed
fi
[ "$(sqlite3 "$TMP/test.sqlite" 'select max(version) from schema_migrations')" = 5 ] || fail MIGRATION_DRY_RUN_VERSION failed
[ "$(sqlite3 "$TMP/test.sqlite" 'PRAGMA integrity_check')" = ok ] || fail MIGRATION_DRY_RUN_INTEGRITY failed
pass MIGRATION_DRY_RUN schema5

sudo systemctl stop "$SERVICE" || fail SERVICE_STOP failed
CUTOVER=1
if [ "$PRE_SCHEMA" -lt 5 ]; then
  sqlite3 "$DB" < "$TMP/005.sql" || fail LIVE_MIGRATION failed
  sqlite3 "$DB" "INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(5,'005-project-coordination.sql','$C',strftime('%Y-%m-%dT%H:%M:%fZ','now'));" || fail LIVE_MIGRATION_LEDGER failed
fi
install -m0644 "$TMP/005.sql" "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql"
install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m0644 "$TMP/sot-worker.js" "$REPORT_ROOT/sot-worker.js"
install -m0644 "$TMP/sot-coordinator.js" "$REPORT_ROOT/sot-coordinator.js"
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
pass CUTOVER installed

sudo systemctl start "$SERVICE" || fail SERVICE_START failed
code=000
for i in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail LIVE_HEALTH "HTTP=$code"
python3 - "$RUN/health.json" "$EXPECTED_BUILD" "$EXPECTED_SCHEMA" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('status')=='ok',x
assert x.get('build')==sys.argv[2],x
assert int(x.get('database_version',0))==int(sys.argv[3]),x
assert 'durable-project-coordination' in x.get('capabilities',[]),x
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=$EXPECTED_SCHEMA"

[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_INTEGRITY failed
pass DATABASE_INTEGRITY ok

code="$(curl --max-time 10 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"
PUBLIC_SHA="$(sha256sum "$RUN/public.html"|awk '{print $1}')"
[ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"
python3 - "$RUN/public.html" "$TMP/public.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
for marker in ['TURN01_BASE28_OPERATIONAL_AI','2-copy groups','Current Plan','Default Target','function sotOperatorBusy()',"Promise.all([api('/projects'),api('/rollup')])",'state.projects=next']: assert marker in h,marker
PY
node --check "$TMP/public.js" || fail PUBLIC_JS_PARSE failed
pass PUBLIC_IDENTITY "$PUBLIC_SHA"

SUCCESS=1
pass RELEASE_READY "qualified $QUALIFICATION_RUN commit=$QUALIFIED_COMMIT"
echo '=== TURN 01 BASE READY FOR OWNER TEST ==='
echo "QUALIFIED COMMIT: $QUALIFIED_COMMIT"
echo "QUALIFICATION RUNS: $QUALIFICATION_RUN"
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL"
