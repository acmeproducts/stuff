#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"; STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"; DB="$STATE/sot.sqlite"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2'; EXPECTED_SCHEMA=5
QUALIFIED_BACKEND_COMMIT='b58920f014960c9b18b705a0fdcf0406c621fd5f'
R6_UI_COMMIT='7dc9bc7b3402633bb82601b5123280dca74b57bd'
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'; ARCHIVE_ROOT="$SOT_DIR/archive"
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; RUN="$ARCHIVE_ROOT/$STAMP-turn01-r6-ssot-action-release"
mkdir -p "$RUN" "$SOT_DIR"; LOG="$RUN/release.log"; SUMMARY="$RUN/summary.tsv"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
CUTOVER=0; SUCCESS=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-42s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }; pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){ set +e; if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then if [ -f "$RUN/SOT-turn01-base.html.before" ]; then cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"; else rm -f "$SOT_DIR/SOT-turn01-base.html"; fi; record PASS ROLLBACK 'restored previous SOT UI'; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-42s %s\n",$1,$2,$3}' "$SUMMARY"; echo "log: $LOG"; rm -rf "$TMP"; }
trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum; do command -v "$t" >/dev/null || { fail REQUIRE_TOOL "$t"; return 1 2>/dev/null || true; }; done; pass REQUIRE_TOOLS ok
[ -s "$DB" ] || { fail DATABASE missing; return 1 2>/dev/null || true; }
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || { fail DATABASE_INTEGRITY failed; return 1 2>/dev/null || true; }
SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')"; [ "$SCHEMA" = "$EXPECTED_SCHEMA" ] || { fail DATABASE_SCHEMA "expected=$EXPECTED_SCHEMA actual=$SCHEMA"; return 1 2>/dev/null || true; }; pass DATABASE_INTEGRITY "schema=$SCHEMA"
code=000; for i in {1..20}; do code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; [ "$code" = 200 ] && break; sleep 1; done; [ "$code" = 200 ] || { fail LIVE_BACKEND "HTTP=$code"; return 1 2>/dev/null || true; }
python3 - "$RUN/health.before.json" "$EXPECTED_BUILD" "$EXPECTED_SCHEMA" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok',x; assert x.get('build')==sys.argv[2],x; assert int(x.get('database_version',0))==int(sys.argv[3]),x
for cap in ['durable-project-coordination','stale-operation-rejection','atomic-evidence-cutover','non-blocking-background-workers','concurrent-project-indexing']: assert cap in x.get('capabilities',[]),(cap,x)
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=$EXPECTED_SCHEMA"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"; pass ARCHIVE_PRECHANGE "$RUN"
curl --retry 5 --retry-all-errors --max-time 45 -fsSL "$RAW/$R6_UI_COMMIT/SOT-turn01-base-r6.html" -o "$TMP/SOT-turn01-base.html" || { fail FETCH_UI "$R6_UI_COMMIT"; return 1 2>/dev/null || true; }
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
required=['SOT-turn01-base-r6-ssot-action','SINGLE SOURCE OF TRUTH','PROJECT SOTs','CURRENT STATE · NEXT STEP','Needs Target','Choose Target','Needs Backup','Choose Backup','Setup','Index','Review','Plan','Protect','Verify','function rememberDetails','localStorage.setItem(\'sot.r6.open\'','function patchLive','setInterval(poll,3000)','Activity / diagnostics']
for m in required: assert m in h,m
assert "$('surface').innerHTML" not in h[h.index('function patchLive'):h.index("$('search').oninput")]
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I); assert scripts; Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
node --check "$TMP/ui.js" || { fail UI_JS_PARSE failed; return 1 2>/dev/null || true; }; pass R6_UI_CONTRACT 'SSOT + actionable state + operator-owned disclosure'
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; CUTOVER=1; pass CUTOVER installed
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"; code=000
for i in {1..20}; do code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA" || true)"; [ "$code" = 200 ] && [ -s "$RUN/public.html" ] && break; sleep 1; done
[ "$code" = 200 ] || { fail PUBLIC_HTTP "HTTP=$code"; return 1 2>/dev/null || true; }; PUBLIC_SHA="$(sha256sum "$RUN/public.html"|awk '{print $1}')"; [ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || { fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"; return 1 2>/dev/null || true; }; pass PUBLIC_IDENTITY "$PUBLIC_SHA"
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || { fail DATABASE_POSTCHECK failed; return 1 2>/dev/null || true; }; pass DATABASE_POSTCHECK ok
SUCCESS=1; pass RELEASE_READY "backend=$QUALIFIED_BACKEND_COMMIT ui=$R6_UI_COMMIT"; echo '=== TURN 01 BASE R6 READY FOR OWNER TEST ==='; echo "R6 UI COMMIT: $R6_UI_COMMIT"; echo "PUBLIC SHA256: $PUBLIC_SHA"; echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
