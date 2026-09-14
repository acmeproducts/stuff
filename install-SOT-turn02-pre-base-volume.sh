#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn02-pre-base.html}"
RAW=https://raw.githubusercontent.com/acmeproducts/stuff
FROZEN_BACKEND=9422453c180f8fce4e7d5fe362867912dc8005d1
BASE_INTEGRATOR=1aebf2624621b08880a595ef9d1f58f2c8cde1b
VOLUME_GENERATOR=1abfeef83cc1f4da25de09e297361beb5320d516
DB_TOOLS=fad404b26c0ea66d55a2a19d0d36c8dbd16c6d9a
UI_COMMIT=b9d65ee11e06b20ece07c392f902252aa7f7ed64
EXPECTED_BUILD=2026.08.30.sot-turn01-base-22
EXPECTED_SCHEMA=4

TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$SOT_DIR/archive/$STAMP-turn02-volume-service-rebuild"
LOG="$RUN/release.log"
SUMMARY="$RUN/summary.tsv"
CUTOVER=0
SUCCESS=0
mkdir -p "$RUN" "$TMP/sot-db/migrations"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY"; printf '[%s] %-5s %-36s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){
  rc=$?
  set +e
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    [ -f "$RUN/sot-api.before.js" ] && cp "$RUN/sot-api.before.js" "$REPORT_ROOT/sot-api.js"
    rm -f "$DB" "$DB-wal" "$DB-shm"
    [ -f "$RUN/sot.before.sqlite" ] && cp "$RUN/sot.before.sqlite" "$DB"
    if [ -f "$RUN/SOT-turn02-pre-base.before.html" ]; then cp "$RUN/SOT-turn02-pre-base.before.html" "$SOT_DIR/SOT-turn02-pre-base.html"; else rm -f "$SOT_DIR/SOT-turn02-pre-base.html"; fi
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    record PASS ROLLBACK 'restored prior backend, database, and Turn 02 UI'
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-36s %s\n",$1,$2,$3}' "$SUMMARY"
  echo "log: $LOG"
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok

# Archive current live state before any destructive change.
[ -s "$DB" ] || fail LIVE_DATABASE missing
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail LIVE_DATABASE integrity
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.before.js"
sqlite3 "$DB" ".backup '$RUN/sot.before.sqlite'"
[ "$(sqlite3 "$RUN/sot.before.sqlite" 'PRAGMA integrity_check')" = ok ] || fail ARCHIVE_DATABASE integrity
[ -f "$SOT_DIR/SOT-turn02-pre-base.html" ] && cp "$SOT_DIR/SOT-turn02-pre-base.html" "$RUN/SOT-turn02-pre-base.before.html" || true
pass ARCHIVE_PRECHANGE "$RUN"

# Fetch the pinned qualified engine lineage and fresh Turn 02 UI.
curl --retry 5 --retry-all-errors -fsSL "$RAW/$FROZEN_BACKEND/sot-api.js" -o "$TMP/pre.js"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$BASE_INTEGRATOR/integrate-SOT-turn01-base.py" -o "$TMP/integrate.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$VOLUME_GENERATOR/generate-SOT-turn01-base22.py" -o "$TMP/generate.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$DB_TOOLS/sot-db-manage.js" -o "$TMP/sot-db-manage.js"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do
  curl --retry 5 --retry-all-errors -fsSL "$RAW/$DB_TOOLS/sot-db/migrations/$m" -o "$TMP/sot-db/migrations/$m"
done
curl --retry 5 --retry-all-errors -fsSL "$RAW/$UI_COMMIT/SOT-turn02-pre-base-volume.html" -o "$TMP/SOT-turn02-pre-base.html"
pass FETCH_PINNED 'engine lineage + schema4 migrations + Turn02 UI'

# Developer pass.
python3 -m py_compile "$TMP/integrate.py" "$TMP/generate.py"
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"
python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"
node --check "$TMP/sot-api.js"
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js" || fail DEV_BACKEND build-marker
grep -Fq 'function volumeRoots' "$TMP/sot-api.js" || fail DEV_BACKEND volumes
grep -Fq 'hash_workers' "$TMP/sot-api.js" || fail DEV_BACKEND worker-pool
grep -Fq 'processing_workers' "$TMP/sot-api.js" || fail DEV_BACKEND processing-workers
grep -Fq '/api/sot/turn01/volumes' "$TMP/sot-api.js" || fail DEV_BACKEND volume-route
pass DEV_BACKEND 'persistent Node volume engine + worker pool composes and parses'

SOT_MIGRATIONS_DIR="$TMP/sot-db/migrations" node "$TMP/sot-db-manage.js" create "$TMP/fresh.sqlite" >"$RUN/fresh-db.json"
[ "$(sqlite3 "$TMP/fresh.sqlite" 'PRAGMA integrity_check')" = ok ] || fail DEV_DATABASE integrity
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select max(version) from schema_migrations')" = "$EXPECTED_SCHEMA" ] || fail DEV_DATABASE schema
for t in projects sources processing_runs content observations current_observations target_holdings backup_holdings plans plan_items actions certifications events; do
  [ "$(sqlite3 "$TMP/fresh.sqlite" "select count(*) from $t")" = 0 ] || fail DEV_EMPTY "$t"
done
sqlite3 "$TMP/fresh.sqlite" "select name from sqlite_master where type='table'" | grep -Fq processing_workers || fail DEV_DATABASE processing_workers
pass DEV_DATABASE 'fresh schema4 SSOT database; owner/work rows=0'

SOT_DB_PATH="$TMP/fresh.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]);
if(api.BUILD!=='2026.08.30.sot-turn01-base-22')throw Error('build '+api.BUILD);
if(api.EXPECTED_MIGRATION!==4)throw Error('schema '+api.EXPECTED_MIGRATION);
if(api._test.listProjects().length!==0)throw Error('fresh workspace not empty');
console.log('fresh node engine fixture pass');
NODE
pass DEV_ENGINE 'Node runtime accepts fresh DB; no browser/runtime Python dependency'

python3 - "$TMP/SOT-turn02-pre-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['SOT-turn02-pre-base-volume-service-1','>Storage</button>','>SSOT</button>','>Work</button>','/turn01/volumes','/scheduler/status','/rollup','Start / Re-index','Worker pool','Persistent Node service']
for x in need:
    assert x in h,x
for x in ['>Projects</button>','>Tags</button>','>AI</button>']:
    assert x not in h,x
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)
Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
node --check "$TMP/ui.js"
pass DEV_UI 'Storage / SSOT / Work API client parses'

# Manager pass.
grep -Fq 'Physical volumes first' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE volumes-first
grep -Fq 'Source, Target and Backup' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE roles
grep -Fq 'server-side worker pool' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE persistent-workers
! grep -Fq '>Projects<' "$TMP/SOT-turn02-pre-base.html" || fail MANAGER_SCOPE owner-projects
pass MANAGER_SCOPE 'Storage / SSOT / Work; volume roles; persistent server workers; no owner Projects'
pass MANAGER_LINEAGE 'qualified Base22 volume engine + new standalone Turn02 UI'
pass MANAGER_RUNTIME 'browser is API client; service owns processing and SQLite state'

# Red-team pass before cutover.
[ -s "$RUN/sot.before.sqlite" ] || fail REDTEAM_PRECUTOVER archive-missing
[ "$(sqlite3 "$RUN/sot.before.sqlite" 'PRAGMA integrity_check')" = ok ] || fail REDTEAM_PRECUTOVER archive-corrupt
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select count(*) from projects')" = 0 ] || fail REDTEAM_PRECUTOVER carried-projects
[ "$(sqlite3 "$TMP/fresh.sqlite" 'select count(*) from content')" = 0 ] || fail REDTEAM_PRECUTOVER carried-content
PS=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
[ -x "$PS" ] || fail REDTEAM_PRECUTOVER powershell-missing
WIN="$($PS -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r\n')"
[ -n "$WIN" ] || fail REDTEAM_PRECUTOVER windows-volume-inventory-empty
pass REDTEAM_PRECUTOVER "archive + empty DB + Node engine + Windows volumes=$WIN"

# Cutover after Developer -> Manager -> Red-team PASS.
sudo systemctl stop "$SERVICE"
CUTOVER=1
rm -f "$DB" "$DB-wal" "$DB-shm"
cp "$TMP/fresh.sqlite" "$DB"
install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m0644 "$TMP/SOT-turn02-pre-base.html" "$SOT_DIR/SOT-turn02-pre-base.html"
sudo systemctl start "$SERVICE"
pass CUTOVER 'volume-aware Node engine + fresh SSOT DB + Turn02 UI installed'

code=000
for i in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail POST_HEALTH "HTTP=$code"
python3 - "$RUN/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));assert x.get('build')=='2026.08.30.sot-turn01-base-22',x;assert int(x.get('database_version',-1))==4,x;assert x.get('status')=='ok',x
PY
pass POST_HEALTH 'Base22 persistent Node service schema4 HTTP=200'

for endpoint in 'turn01/volumes' 'scheduler/status' 'rollup' 'projects'; do
  code="$(curl --max-time 8 -sS -o "$RUN/${endpoint//\//-}.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint" || true)"
  [ "$code" = 200 ] || fail LIVE_ENDPOINT "$endpoint HTTP=$code"
done
pass LIVE_ENDPOINTS 'volumes + scheduler + rollup + workspace API HTTP=200'
python3 - "$RUN/turn01-volumes.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));assert isinstance(x.get('volumes'),list) and len(x['volumes'])>0,x
PY
pass LIVE_VOLUMES 'live volume inventory non-empty'
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_POSTCHECK integrity
[ "$(sqlite3 "$DB" 'select max(version) from schema_migrations')" = "$EXPECTED_SCHEMA" ] || fail DATABASE_POSTCHECK schema
[ "$(sqlite3 "$DB" 'select count(*) from projects')" = 0 ] || fail DATABASE_POSTCHECK projects
pass DATABASE_POSTCHECK 'fresh live DB integrity ok schema4 workspace rows=0'

LOCAL_SHA="$(sha256sum "$TMP/SOT-turn02-pre-base.html" | awk '{print $1}')"
code=000
for i in {1..20}; do
  code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA" || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$RUN/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"
pass PUBLIC_IDENTITY "$PUBLIC_SHA"
SUCCESS=1
pass RELEASE_READY 'Developer PASS -> Manager PASS -> Red-team PASS'
echo '=== SOT TURN 02 VOLUME SERVICE READY ==='
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
