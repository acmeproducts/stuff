#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_STATE=/home/support/.openclaw/sot
SOT_DATABASE="$SOT_STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/1515897ba38326e52b14717b918e5c9450e2f028
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-r2-wizard.html?v=20260824-compact-destinations-6'
EXPECTED_BUILD=2026.08.24.sot-compact-destinations-6
TEMP_ROOT="$(mktemp -d)"
CUTOVER_STARTED=0
SERVICE_STOPPED=0

TARGETS=(
  "$REPORT_ROOT/sot-api.js"
  "$REPORT_ROOT/sot-worker.js"
  "$REPORT_ROOT/sot-db-manage.js"
  "$REPORT_ROOT/sot-sqlite.py"
  "$REPORT_ROOT/sot-db/migrations/001-initial.sql"
  "$REPORT_ROOT/sot-db/migrations/002-project-list-metrics.sql"
  "$REPORT_ROOT/sot-db/migrations/003-project-run-controls.sql"
  "$REPORT_ROOT/sot-db/migrations/004-live-byte-progress.sql"
  "$REPORT_ROOT/integrate-sot-server.js"
  "$REPORT_ROOT/SOT/sot-turn01-r2-wizard.html"
  "$REPORT_ROOT/SOT/project.html"
  "$REPORT_ROOT/SOT/sot-dbadmin.html"
  "$REPORT_ROOT/session-server.js"
  "$SOT_DATABASE"
  "$SOT_DATABASE-wal"
  "$SOT_DATABASE-shm"
)

restore_cutover() {
  set +e
  echo '=== UPDATE FAILED — RESTORING ==='
  sudo systemctl stop "$SERVICE"
  for target in "${TARGETS[@]}"; do
    rm -f "$target"
    if [[ -f "$TEMP_ROOT/rollback$target" ]]; then
      mkdir -p "$(dirname "$target")"
      cp -a "$TEMP_ROOT/rollback$target" "$target"
    fi
  done
  sudo systemctl start "$SERVICE"
  SERVICE_STOPPED=0
}

finish() {
  status=$?
  if [[ $status -ne 0 && $CUTOVER_STARTED -eq 1 ]]; then
    restore_cutover
  elif [[ $status -ne 0 && $SERVICE_STOPPED -eq 1 ]]; then
    sudo systemctl start "$SERVICE"
  fi
  rm -rf "$TEMP_ROOT"
  exit "$status"
}
trap finish EXIT

systemctl is-active --quiet "$SERVICE"
test -s "$SOT_DATABASE"
mkdir -p "$TEMP_ROOT/sot-db/migrations"

echo '=== FETCH COMPACT DESTINATION CANDIDATE ==='
FILES=(
  sot-api.js
  sot-worker.js
  sot-db-manage.js
  sot-sqlite.py
  sot-db/migrations/001-initial.sql
  sot-db/migrations/002-project-list-metrics.sql
  sot-db/migrations/003-project-run-controls.sql
  sot-db/migrations/004-live-byte-progress.sql
  sot-turn01-r2-wizard.html
  sot-dbadmin.html
  integrate-sot-server.js
  test-sot-clean-e2e.js
  test-sot-concurrency.js
  test-sot-ui-contract.js
  test-sot-row-controls.js
  test-sot-observability.js
)
for file in "${FILES[@]}"; do
  mkdir -p "$TEMP_ROOT/$(dirname "$file")"
  curl --max-time 30 -fsSL "$BASE/$file" -o "$TEMP_ROOT/$file"
done

node --check "$TEMP_ROOT/sot-api.js"
node --check "$TEMP_ROOT/sot-worker.js"
node --check "$TEMP_ROOT/sot-db-manage.js"
node --check "$TEMP_ROOT/integrate-sot-server.js"
node --check "$TEMP_ROOT/test-sot-clean-e2e.js"
node --check "$TEMP_ROOT/test-sot-concurrency.js"
node --check "$TEMP_ROOT/test-sot-ui-contract.js"
node --check "$TEMP_ROOT/test-sot-row-controls.js"
node --check "$TEMP_ROOT/test-sot-observability.js"
python3 -m py_compile "$TEMP_ROOT/sot-sqlite.py"
python3 - "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$TEMP_ROOT/sot-dbadmin.html" "$TEMP_ROOT" <<'PY'
import pathlib,re,sys
for index,filename in enumerate(sys.argv[1:3]):
    html=pathlib.Path(filename).read_text()
    scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
    if not scripts: raise SystemExit('inline script missing: '+filename)
    pathlib.Path(sys.argv[3],f'ui-{index}.js').write_text('\n;\n'.join(scripts))
markers=['2026.08.24.sot-compact-destinations-6','2026.08.24.sot-compact-destinations-6']
for marker,filename in zip(markers,sys.argv[1:3]):
    if marker not in pathlib.Path(filename).read_text():
        raise SystemExit('UI marker missing: '+marker)
PY
node --check "$TEMP_ROOT/ui-0.js"
node --check "$TEMP_ROOT/ui-1.js"

echo '=== UI VIEWPORT + DESTINATION CONTRACT TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-ui-contract.js
)

echo '=== EMPTY-DATABASE ACCEPTANCE TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-clean-e2e.js | tee "$TEMP_ROOT/e2e.json"
)
grep -q '"result": "PASS"' "$TEMP_ROOT/e2e.json"

echo '=== NON-BLOCKING CONCURRENCY + REUSE TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-concurrency.js | tee "$TEMP_ROOT/concurrency.json"
)
grep -q '"result": "PASS"' "$TEMP_ROOT/concurrency.json"

echo '=== PROJECT ROW CONTROL TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-row-controls.js | tee "$TEMP_ROOT/row-controls.json"
)
grep -q '"result": "PASS"' "$TEMP_ROOT/row-controls.json"

echo '=== WORKER VISIBILITY + CRASH TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-observability.js | tee "$TEMP_ROOT/observability.json"
)
grep -q '"result": "PASS"' "$TEMP_ROOT/observability.json"

echo '=== VERSION 3 TO VERSION 4 MIGRATION GATE ==='
mkdir -p "$TEMP_ROOT/v3-migrations"
cp "$TEMP_ROOT/sot-db/migrations/001-initial.sql" "$TEMP_ROOT/v3-migrations/"
cp "$TEMP_ROOT/sot-db/migrations/002-project-list-metrics.sql" "$TEMP_ROOT/v3-migrations/"
cp "$TEMP_ROOT/sot-db/migrations/003-project-run-controls.sql" "$TEMP_ROOT/v3-migrations/"
SOT_MIGRATIONS_DIR="$TEMP_ROOT/v3-migrations" \
SOT_SQLITE_ADAPTER="$TEMP_ROOT/sot-sqlite.py" \
node "$TEMP_ROOT/sot-db-manage.js" create "$TEMP_ROOT/v3.sqlite" >/dev/null
SOT_MIGRATIONS_DIR="$TEMP_ROOT/sot-db/migrations" \
SOT_SQLITE_ADAPTER="$TEMP_ROOT/sot-sqlite.py" \
node "$TEMP_ROOT/sot-db-manage.js" migrate "$TEMP_ROOT/v3.sqlite" > "$TEMP_ROOT/upgrade.json"
python3 - "$TEMP_ROOT/upgrade.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))['status']
if not x.get('ok') or x.get('integrity')!='ok' or x.get('current_version')!=4:
    raise SystemExit('v3 to v4 migration gate failed: '+repr(x))
print('migration: 3 -> 4; integrity: ok')
PY

echo '=== NON-DESTRUCTIVE CUTOVER ==='
sudo systemctl stop "$SERVICE"
SERVICE_STOPPED=1
for target in "${TARGETS[@]}"; do
  if [[ -f "$target" ]]; then
    mkdir -p "$TEMP_ROOT/rollback$(dirname "$target")"
    cp -a "$target" "$TEMP_ROOT/rollback$target"
  fi
done
CUTOVER_STARTED=1

mkdir -p "$REPORT_ROOT/SOT" "$REPORT_ROOT/sot-db/migrations" "$SOT_STATE"
install -m 0644 "$TEMP_ROOT/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0755 "$TEMP_ROOT/sot-worker.js" "$REPORT_ROOT/sot-worker.js"
install -m 0644 "$TEMP_ROOT/sot-db-manage.js" "$REPORT_ROOT/sot-db-manage.js"
install -m 0755 "$TEMP_ROOT/sot-sqlite.py" "$REPORT_ROOT/sot-sqlite.py"
install -m 0644 "$TEMP_ROOT/sot-db/migrations/001-initial.sql" "$REPORT_ROOT/sot-db/migrations/001-initial.sql"
install -m 0644 "$TEMP_ROOT/sot-db/migrations/002-project-list-metrics.sql" "$REPORT_ROOT/sot-db/migrations/002-project-list-metrics.sql"
install -m 0644 "$TEMP_ROOT/sot-db/migrations/003-project-run-controls.sql" "$REPORT_ROOT/sot-db/migrations/003-project-run-controls.sql"
install -m 0644 "$TEMP_ROOT/sot-db/migrations/004-live-byte-progress.sql" "$REPORT_ROOT/sot-db/migrations/004-live-byte-progress.sql"
install -m 0644 "$TEMP_ROOT/integrate-sot-server.js" "$REPORT_ROOT/integrate-sot-server.js"
install -m 0644 "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$REPORT_ROOT/SOT/sot-turn01-r2-wizard.html"
install -m 0644 "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$REPORT_ROOT/SOT/project.html"
install -m 0644 "$TEMP_ROOT/sot-dbadmin.html" "$REPORT_ROOT/SOT/sot-dbadmin.html"

SOT_MIGRATIONS_DIR="$REPORT_ROOT/sot-db/migrations" \
SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" \
node "$REPORT_ROOT/sot-db-manage.js" migrate "$SOT_DATABASE" > "$TEMP_ROOT/live-migrate.json"
node "$REPORT_ROOT/integrate-sot-server.js" "$REPORT_ROOT/session-server.js"
sudo systemctl start "$SERVICE"
SERVICE_STOPPED=0

echo '=== LIVE HEALTH + COMPACT WORKFLOW GATES ==='
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TEMP_ROOT/health.json"; then break; fi
  sleep 1
done
python3 - "$TEMP_ROOT/health.json" "$EXPECTED_BUILD" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('SOT health did not become ready')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2] or x.get('database_version')!=4:
    raise SystemExit('wrong live health: '+repr(x))
required={'live-worker-paths','live-in-file-byte-progress','visible-ui-heartbeat','viewport-contained-workflow-actions','three-panel-destination-picker','safe-folder-creation','durable-activity-log','worker-exit-fail-closed'}
if not required.issubset(set(x.get('capabilities') or [])):
    raise SystemExit('observability capabilities missing: '+repr(x))
print(json.dumps(x,indent=2))
PY

curl --max-time 5 -fsS -w '%{time_total}' http://127.0.0.1:18080/api/sot/turn01/projects -o "$TEMP_ROOT/projects.json" > "$TEMP_ROOT/projects.seconds"
curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/rollup -o "$TEMP_ROOT/rollup.json"
curl --max-time 5 -fsS 'http://127.0.0.1:18080/api/sot/activity?limit=5' -o "$TEMP_ROOT/activity.json"
python3 - "$TEMP_ROOT/projects.json" "$TEMP_ROOT/projects.seconds" "$TEMP_ROOT/rollup.json" "$TEMP_ROOT/activity.json" <<'PY'
import json,sys
projects=json.load(open(sys.argv[1])); elapsed=float(open(sys.argv[2]).read())
rollup=json.load(open(sys.argv[3])); activity=json.load(open(sys.argv[4]))
if not isinstance(projects.get('projects'),list): raise SystemExit('project list response invalid')
if elapsed>=1.0: raise SystemExit(f'project list too slow: {elapsed:.3f}s')
if not {'active','phases','corpus'}.issubset(rollup): raise SystemExit('rollup response invalid')
if not isinstance(activity.get('events'),list): raise SystemExit('activity response invalid')
print(f"projects: {len(projects['projects'])}; list: {elapsed:.3f}s; activity: {len(activity['events'])}")
PY

curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/admin/db/status -o "$TEMP_ROOT/status.json"
python3 - "$TEMP_ROOT/status.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not (x.get('integrity') or {}).get('ok'): raise SystemExit('live database integrity failed')
if [m.get('version') for m in x.get('migrations',[])] != [1,2,3,4]: raise SystemExit('wrong live migration set')
print('database:',x.get('database_path'))
print('integrity:',x['integrity']['result'])
print('migrations: 001, 002, 003, 004')
PY

echo '=== PUBLIC UI GATE ==='
for attempt in {1..10}; do
  if curl --max-time 15 -fsS "$PUBLIC_URL" -o "$TEMP_ROOT/public.html" && \
     grep -q '2026.08.24.sot-compact-destinations-6' "$TEMP_ROOT/public.html"; then
    break
  fi
  sleep 2
done
grep -q '2026.08.24.sot-compact-destinations-6' "$TEMP_ROOT/public.html"
grep -q 'Name and live activity' "$TEMP_ROOT/public.html"
grep -q 'data-project-activity' "$TEMP_ROOT/public.html"
grep -q 'SOT activity log' "$TEMP_ROOT/public.html"
grep -q 'Recent project activity' "$TEMP_ROOT/public.html"
grep -q 'id="liveHeartbeat"' "$TEMP_ROOT/public.html"
grep -q 'Bytes actively hashing' "$TEMP_ROOT/public.html"
grep -q 'Recent SOT activity' "$TEMP_ROOT/public.html"
grep -q 'Use current as Target' "$TEMP_ROOT/public.html"
grep -q 'Create folder' "$TEMP_ROOT/public.html"
grep -q 'projectTableScrollLeft' "$TEMP_ROOT/public.html"

CUTOVER_STARTED=0
echo '=== SOT COMPACT DESTINATIONS 6 INSTALLED ==='
echo 'Existing SOT projects, fingerprints, observations, plans, events, and corpus rows were preserved.'
echo 'Source, Target, and Backup file content was not deleted.'
echo "URL: $PUBLIC_URL"
