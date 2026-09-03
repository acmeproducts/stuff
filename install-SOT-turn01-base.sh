#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"; STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"; DB="$STATE/sot.sqlite"; SERVICE=openclaw-report-server.service
ARCHIVE_ROOT="$SOT_DIR/archive"; PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-1'; EXPECTED_SCHEMA=5
SRC_COMMIT='5d0cc9bd0874d68cfbc27732f799a1692d20c406'; WORKER_COMMIT='ffaee4ad31fd35ed9000db932ddf81a16a83f44f'
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; RUN="$ARCHIVE_ROOT/$STAMP-turn01-coordination-release"; mkdir -p "$RUN"; LOG="$RUN/release.log"; SUMMARY="$RUN/summary.tsv"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
CUTOVER=0; SUCCESS=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }; pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; exit 1; }
cleanup(){ rc=$?; set +e; if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then sudo systemctl stop "$SERVICE" >/dev/null 2>&1; cp "$RUN/sot.sqlite.before" "$DB"; cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"; cp "$RUN/sot-worker.js.before" "$REPORT_ROOT/sot-worker.js" 2>/dev/null || true; cp "$RUN/sot-coordinator.js.before" "$REPORT_ROOT/sot-coordinator.js" 2>/dev/null || true; cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html" 2>/dev/null || true; rm -f "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql"; sudo systemctl start "$SERVICE" >/dev/null 2>&1; record PASS ROLLBACK restored; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY"; echo "log: $LOG"; rm -rf "$TMP"; exit "$rc"; }; trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done; pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail DATABASE missing
mkdir -p "$REPORT_ROOT/sot-db/migrations" "$ARCHIVE_ROOT"
cp "$DB" "$RUN/sot.sqlite.before"; cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"; cp "$REPORT_ROOT/sot-worker.js" "$RUN/sot-worker.js.before" 2>/dev/null || true; cp "$REPORT_ROOT/sot-coordinator.js" "$RUN/sot-coordinator.js.before" 2>/dev/null || true; cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before" 2>/dev/null || true; pass ARCHIVE_PRECHANGE "$RUN"
RAW=https://raw.githubusercontent.com/acmeproducts/stuff
fetch(){ curl --max-time 30 -fsSL "$1" -o "$2" || fail FETCH "$1"; }
fetch "$RAW/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js" "$TMP/pre.js"
fetch "$RAW/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py" "$TMP/base.py"
fetch "$RAW/1abfeef83cc1f4da25de09e297361beb5320d516/generate-SOT-turn01-base22.py" "$TMP/base22.py"
fetch "$RAW/$SRC_COMMIT/integrate-SOT-turn01-coordination.py" "$TMP/coord.py"
fetch "$RAW/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" "$TMP/pre.html"
fetch "$RAW/603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py" "$TMP/ui22.py"
fetch "$RAW/083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py" "$TMP/ui24.py"
fetch "$RAW/5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5/integrate-SOT-turn01-base-ai.py" "$TMP/uiai.py"
fetch "$RAW/$SRC_COMMIT/integrate-SOT-turn01-coordination-ui.py" "$TMP/coordui.py"
fetch "$RAW/$SRC_COMMIT/sot-db/migrations/005-project-coordination.sql" "$TMP/005.sql"
fetch "$RAW/$WORKER_COMMIT/sot-worker.js" "$TMP/sot-worker.js"; fetch "$RAW/$WORKER_COMMIT/sot-coordinator.js" "$TMP/sot-coordinator.js"
python3 -m py_compile "$TMP/base.py" "$TMP/base22.py" "$TMP/coord.py" "$TMP/ui22.py" "$TMP/ui24.py" "$TMP/uiai.py" "$TMP/coordui.py" || fail PYTHON_PARSE failed
python3 "$TMP/base.py" "$TMP/pre.js" "$TMP/base3.js"; python3 "$TMP/base22.py" "$TMP/base3.js" "$TMP/sot-api.js"; python3 "$TMP/coord.py" "$TMP/sot-api.js" "$TMP/sot-api-coord.js" || fail BACKEND_GENERATION failed
python3 "$TMP/ui22.py" "$TMP/pre.html" "$TMP/ui22.html"; python3 "$TMP/ui24.py" "$TMP/ui22.html" "$TMP/ui24.html"; python3 "$TMP/uiai.py" "$TMP/ui24.html" "$TMP/ui-base.html"; python3 "$TMP/coordui.py" "$TMP/ui-base.html" "$TMP/SOT-turn01-base.html" || fail UI_GENERATION failed
node --check "$TMP/sot-api-coord.js" || fail BACKEND_JS_PARSE failed; node --check "$TMP/sot-worker.js" || fail WORKER_JS_PARSE failed; node --check "$TMP/sot-coordinator.js" || fail COORDINATOR_JS_PARSE failed
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); s='\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)); Path(sys.argv[2]).write_text(s)
for x in ['function sotOperatorBusy()','Default Target','Default Backup','2-copy groups','3-copy groups','4+ copy groups','Previous / Stale Plan','Current Plan']:
 assert x in h,x
PY
node --check "$TMP/ui.js" || fail UI_JS_PARSE failed
for x in "const BUILD = '$EXPECTED_BUILD';" 'const EXPECTED_MIGRATION = 5;' 'function claimProjectOperation(projectToken,kind)' 'active_operation_id' 'operation_generation' "architecture: 'durable-per-project-coordinator'"; do grep -Fq "$x" "$TMP/sot-api-coord.js" || fail COORDINATION_CONTRACT "$x"; done; pass STATIC_QUALIFICATION passed
cp "$DB" "$TMP/test.sqlite"; sqlite3 "$TMP/test.sqlite" < "$TMP/005.sql" || fail MIGRATION_DRY_RUN failed; C="$(sha256sum "$TMP/005.sql"|awk '{print $1}')"; sqlite3 "$TMP/test.sqlite" "INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(5,'005-project-coordination.sql','$C',strftime('%Y-%m-%dT%H:%M:%fZ','now'));" || fail MIGRATION_LEDGER_DRY_RUN failed; [ "$(sqlite3 "$TMP/test.sqlite" 'select max(version) from schema_migrations')" = 5 ] || fail MIGRATION_DRY_RUN_VERSION failed; pass MIGRATION_DRY_RUN schema5
sudo systemctl stop "$SERVICE" || fail SERVICE_STOP failed; CUTOVER=1
sqlite3 "$DB" < "$TMP/005.sql" || fail LIVE_MIGRATION failed; sqlite3 "$DB" "INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(5,'005-project-coordination.sql','$C',strftime('%Y-%m-%dT%H:%M:%fZ','now'));" || fail LIVE_MIGRATION_LEDGER failed
install -m0644 "$TMP/005.sql" "$REPORT_ROOT/sot-db/migrations/005-project-coordination.sql"; install -m0644 "$TMP/sot-api-coord.js" "$REPORT_ROOT/sot-api.js"; install -m0644 "$TMP/sot-worker.js" "$REPORT_ROOT/sot-worker.js"; install -m0644 "$TMP/sot-coordinator.js" "$REPORT_ROOT/sot-coordinator.js"; install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; pass CUTOVER installed
sudo systemctl start "$SERVICE" || fail SERVICE_START failed
code=000; for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$RUN/health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; [ "$code" = 200 ] && break; sleep 1; done; [ "$code" = 200 ] || fail LIVE_HEALTH "HTTP=$code"
python3 - "$RUN/health.json" "$EXPECTED_BUILD" "$EXPECTED_SCHEMA" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok'; assert x.get('build')==sys.argv[2],x; assert int(x.get('database_version',0))==int(sys.argv[3]),x; assert 'durable-project-coordination' in x.get('capabilities',[]),x
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=$EXPECTED_SCHEMA"
code="$(curl --max-time 10 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"; [ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"; [ "$(sha256sum "$RUN/public.html"|awk '{print $1}')" = "$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')" ] || fail PUBLIC_IDENTITY mismatch; pass PUBLIC_IDENTITY matched
python3 - "$RUN/public.html" "$TMP/public.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I))); assert 'function sotOperatorBusy()' in h
PY
node --check "$TMP/public.js" || fail PUBLIC_JS_PARSE failed; pass PUBLIC_JS_PARSE passed
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_INTEGRITY failed; pass DATABASE_INTEGRITY ok
SUCCESS=1; pass RELEASE_READY 'mechanical gates passed'; echo '=== TURN 01 COORDINATION READY FOR TEST ==='; echo "TEST URL: $PUBLIC_URL"
