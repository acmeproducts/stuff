#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
SERVICE="openclaw-report-server.service"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn02-pre-base.html}"
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'
BASE='fad404b26c0ea66d55a2a19d0d36c8dbd16c6d9a'
UI='c81804640a2d2d32216907f23eeb1fab4849c900'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$SOT_DIR/archive/$STAMP-turn02-pre-base-reset-r2"
LOG="$RUN/reset.log"
SUMMARY="$RUN/summary.tsv"
CUTOVER=0
SUCCESS=0
mkdir -p "$RUN" "$TMP/migrations"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY"; printf '[%s] %-5s %-34s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){ rc=$?; set +e; if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true; rm -f "$DB" "$DB-wal" "$DB-shm"; cp "$RUN/sot.before.sqlite" "$DB"; rm -f "$SOT_DIR/SOT-turn02-pre-base.html"; sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true; record PASS ROLLBACK 'restored archived Turn 01 database; removed Turn 02 UI'; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-34s %s\n",$1,$2,$3}' "$SUMMARY"; echo "log: $LOG"; rm -rf "$TMP"; return "$rc"; }
trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail LIVE_DATABASE missing
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail LIVE_DATABASE integrity
pass LIVE_DATABASE 'current database integrity ok'
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before" || true
sqlite3 "$DB" ".backup '$RUN/sot.before.sqlite'"
[ "$(sqlite3 "$RUN/sot.before.sqlite" 'PRAGMA integrity_check')" = ok ] || fail ARCHIVE_DATABASE 'backup integrity failed'
pass ARCHIVE_DATABASE "$RUN/sot.before.sqlite"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$BASE/sot-db-manage.js" -o "$TMP/sot-db-manage.js"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql 005-project-coordination.sql 006-ssot-profile-tags.sql; do curl --retry 5 --retry-all-errors -fsSL "$RAW/$BASE/sot-db/migrations/$m" -o "$TMP/migrations/$m"; done
curl --retry 5 --retry-all-errors -fsSL "$RAW/$UI/SOT-turn02-pre-base.html" -o "$TMP/SOT-turn02-pre-base.html"
SOT_MIGRATIONS_DIR="$TMP/migrations" node "$TMP/sot-db-manage.js" create "$TMP/fresh.sqlite" > "$RUN/fresh-db-status.json"
[ "$(sqlite3 "$TMP/fresh.sqlite" 'PRAGMA integrity_check')" = ok ] || fail DEV_DATABASE integrity
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select max(version) from schema_migrations')" = 6 ] || fail DEV_DATABASE schema
for t in projects sources processing_runs content observations current_observations target_holdings backup_holdings plans plan_items actions certifications events tags tag_assignments; do n="$(sqlite3 "$TMP/fresh.sqlite" "select count(*) from $t")"; [ "$n" = 0 ] || fail DEV_EMPTY "$t=$n"; done
pass DEV_DATABASE 'fresh schema=6; all owner/work tables empty'
SOT_DB_PATH="$TMP/fresh.sqlite" node - "$REPORT_ROOT/sot-api.js" <<'NODE'
const api=require(process.argv[2]); if(api.EXPECTED_MIGRATION!==6) throw Error('backend migration contract is not 6'); const t=api._test; const p=t.ssotProfile('',100); if(p.model!=='ssot-profile-v1'||!Array.isArray(p.items)||p.items.length!==0) throw Error('fresh profile contract'); const d=t.discoverSources(); if(!Array.isArray(d.sources)||d.sources.length!==0) throw Error('fresh discover contract'); console.log('fresh backend fixture pass');
NODE
pass DEV_BACKEND 'qualified backend accepts fresh empty schema-6 database'
python3 - "$TMP/SOT-turn02-pre-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
for x in ["SOT-turn02-pre-base-simple-mobile",'>Discover</button>','>Profile</button>','>Action</button>','Manual refresh only','Type tag and press Enter','No copy, delete, reconcile, or bulk actions']: assert x in h,x
for x in ['setInterval(', '>Dashboard</button>', '>Database</button>', '>Activity</button>', 'bulk delete']: assert x not in h,x
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js"
pass DEV_UI 'standalone mobile-first UI parses; no background polling'
grep -Fq 'grid-template-columns:repeat(3,1fr)' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'simple mobile nav absent'
grep -Fq 'Manual refresh only' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'manual-refresh contract absent'
! grep -Fq '>Dashboard</button>' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'dashboard surface present'
! grep -Fq '>Database</button>' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'database surface present'
! grep -Fq '>Activity</button>' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'activity surface present'
! grep -Fq 'setInterval(' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE 'background polling present'
pass MANAGER_SCOPE 'Discover / Profile / Action only; manual refresh; no legacy work surface'
pass MANAGER_LINEAGE 'standalone Turn 02 UI; no Turn 01 generated UI ancestry'
pass MANAGER_ROLLBACK 'pre-reset DB/backend/UI archive completed'
[ -s "$RUN/sot.before.sqlite" ] || fail REDTEAM_PRECUTOVER 'database archive missing'
[ "$(sqlite3 "$RUN/sot.before.sqlite" 'PRAGMA integrity_check')" = ok ] || fail REDTEAM_PRECUTOVER 'database archive corrupt'
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select count(*) from projects')" = 0 ] || fail REDTEAM_PRECUTOVER 'fresh projects not empty'
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select count(*) from tags')" = 0 ] || fail REDTEAM_PRECUTOVER 'fresh tags not empty'
! grep -Fq 'setInterval(' "$TMP/SOT-turn02-pre-base.html" || fail REDTEAM_PRECUTOVER 'background polling found'
! grep -Eqi 'delete selected|remove selected files|bulk delete' "$TMP/SOT-turn02-pre-base.html" || fail REDTEAM_PRECUTOVER 'physical delete surface found'
pass REDTEAM_PRECUTOVER 'archive + empty DB + no polling + no physical delete PASS'
sudo systemctl stop "$SERVICE"
CUTOVER=1
rm -f "$DB" "$DB-wal" "$DB-shm"
cp "$TMP/fresh.sqlite" "$DB"
install -m0644 "$TMP/SOT-turn02-pre-base.html" "$SOT_DIR/SOT-turn02-pre-base.html"
sudo systemctl start "$SERVICE"
pass CUTOVER 'old DB cleared; fresh schema-6 DB + Turn 02 pre-base UI installed'
code=000
for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"; [ "$code" = 200 ] && break; sleep 1; done
[ "$code" = 200 ] || fail POST_HEALTH "HTTP=$code"
pass POST_HEALTH HTTP=200
for endpoint in 'turn01/profile?limit=20' 'turn01/discover' 'turn01/tags'; do code="$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint" || true)"; [ "$code" = 200 ] || fail LIVE_ENDPOINT "$endpoint HTTP=$code"; done
pass LIVE_ENDPOINTS 'profile + discover + tags HTTP=200'
for t in projects sources processing_runs content observations current_observations target_holdings backup_holdings plans plan_items actions certifications events tags tag_assignments; do n="$(sqlite3 "$DB" "select count(*) from $t")"; [ "$n" = 0 ] || fail LIVE_EMPTY "$t=$n"; done
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_POSTCHECK integrity
[ "$(sqlite3 "$DB" 'select max(version) from schema_migrations')" = 6 ] || fail DATABASE_POSTCHECK schema
pass DATABASE_POSTCHECK 'fresh live DB integrity ok schema=6 owner/work rows=0'
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn02-pre-base.html" | awk '{print $1}')"
code=000
for i in {1..20}; do code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA" || true)"; [ "$code" = 200 ] && break; sleep 1; done
[ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$RUN/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"
pass PUBLIC_IDENTITY "$PUBLIC_SHA"
SUCCESS=1
pass RELEASE_READY 'Developer PASS → Manager PASS → Red-team PASS'
echo '=== SOT TURN 02 PRE-BASE RESET READY ==='
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
