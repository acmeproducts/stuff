#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_STATE=/home/support/.openclaw/sot
SOT_DATABASE="$SOT_STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/6f5e76c2095fa1a80476685e08c3ace55b68ea42
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-r2-wizard.html?v=20260823-clean1'
TEMP_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEMP_ROOT"' EXIT

systemctl is-active --quiet "$SERVICE"
mkdir -p "$TEMP_ROOT/sot-db/migrations"

echo '=== FETCH CLEAN CANDIDATE ==='
FILES=(
  sot-api.js
  sot-db-manage.js
  sot-sqlite.py
  sot-db/migrations/001-initial.sql
  sot-turn01-r2-wizard.html
  sot-dbadmin.html
  integrate-sot-server.js
  test-sot-clean-e2e.js
)
for file in "${FILES[@]}"; do
  mkdir -p "$TEMP_ROOT/$(dirname "$file")"
  curl --max-time 30 -fsSL "$BASE/$file" -o "$TEMP_ROOT/$file"
done

node --check "$TEMP_ROOT/sot-api.js"
node --check "$TEMP_ROOT/sot-db-manage.js"
node --check "$TEMP_ROOT/integrate-sot-server.js"
node --check "$TEMP_ROOT/test-sot-clean-e2e.js"
python3 -m py_compile "$TEMP_ROOT/sot-sqlite.py"
python3 - "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$TEMP_ROOT/sot-dbadmin.html" "$TEMP_ROOT" <<'PY'
import pathlib,re,sys
for index,filename in enumerate(sys.argv[1:3]):
    html=pathlib.Path(filename).read_text()
    scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
    pathlib.Path(sys.argv[3],f'ui-{index}.js').write_text('\n;\n'.join(scripts))
for marker in ['2026.08.23.sot-clean-ui-1','2026.08.23.sot-clean-admin-1']:
    if not any(marker in pathlib.Path(name).read_text() for name in sys.argv[1:3]):
        raise SystemExit('UI marker missing: '+marker)
PY
node --check "$TEMP_ROOT/ui-0.js"
node --check "$TEMP_ROOT/ui-1.js"

echo '=== EMPTY-DATABASE ACCEPTANCE TEST ==='
(
  cd "$TEMP_ROOT"
  node test-sot-clean-e2e.js | tee "$TEMP_ROOT/e2e.json"
)
grep -q '"result": "PASS"' "$TEMP_ROOT/e2e.json"

echo '=== CANDIDATE SCHEMA GATE ==='
mkdir -p "$TEMP_ROOT/candidate-state"
SOT_MIGRATIONS_DIR="$TEMP_ROOT/sot-db/migrations" \
SOT_SQLITE_ADAPTER="$TEMP_ROOT/sot-sqlite.py" \
node "$TEMP_ROOT/sot-db-manage.js" create "$TEMP_ROOT/candidate-state/sot.sqlite" > "$TEMP_ROOT/create.json"
SOT_DB_PATH="$TEMP_ROOT/candidate-state/sot.sqlite" \
SOT_ROOT="$TEMP_ROOT/candidate-state" \
SOT_SQLITE_ADAPTER="$TEMP_ROOT/sot-sqlite.py" \
node -e "const api=require(process.argv[1]);if(api.BUILD!=='2026.08.23.sot-clean-1')throw new Error('wrong candidate build');console.log(api.BUILD)" "$TEMP_ROOT/sot-api.js"

echo '=== DESTRUCTIVE CLEAN CUTOVER ==='
sudo systemctl stop "$SERVICE"
mkdir -p "$REPORT_ROOT/SOT" "$REPORT_ROOT/sot-db/migrations" "$SOT_STATE"
install -m 0644 "$TEMP_ROOT/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TEMP_ROOT/sot-db-manage.js" "$REPORT_ROOT/sot-db-manage.js"
install -m 0755 "$TEMP_ROOT/sot-sqlite.py" "$REPORT_ROOT/sot-sqlite.py"
install -m 0644 "$TEMP_ROOT/sot-db/migrations/001-initial.sql" "$REPORT_ROOT/sot-db/migrations/001-initial.sql"
install -m 0644 "$TEMP_ROOT/integrate-sot-server.js" "$REPORT_ROOT/integrate-sot-server.js"
install -m 0644 "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$REPORT_ROOT/SOT/sot-turn01-r2-wizard.html"
install -m 0644 "$TEMP_ROOT/sot-turn01-r2-wizard.html" "$REPORT_ROOT/SOT/project.html"
install -m 0644 "$TEMP_ROOT/sot-dbadmin.html" "$REPORT_ROOT/SOT/sot-dbadmin.html"
rm -f "$REPORT_ROOT/SOT/sot-turn01-pre-base.html"
rm -f "$SOT_DATABASE" "$SOT_DATABASE-wal" "$SOT_DATABASE-shm"

SOT_MIGRATIONS_DIR="$REPORT_ROOT/sot-db/migrations" \
SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" \
node "$REPORT_ROOT/sot-db-manage.js" create "$SOT_DATABASE" > "$TEMP_ROOT/live-create.json"

node "$REPORT_ROOT/integrate-sot-server.js" "$REPORT_ROOT/session-server.js"
sudo systemctl start "$SERVICE"

echo '=== LIVE HEALTH + EMPTY STATE GATES ==='
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TEMP_ROOT/health.json"; then break; fi
  sleep 1
done
python3 - "$TEMP_ROOT/health.json" <<'PY'
import json,pathlib,sys
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('SOT health did not become ready')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!='2026.08.23.sot-clean-1' or x.get('database_version')!=1:
    raise SystemExit('wrong live health: '+repr(x))
print(json.dumps(x,indent=2))
PY

curl --max-time 5 -fsS -w '%{time_total}' http://127.0.0.1:18080/api/sot/turn01/projects -o "$TEMP_ROOT/projects.json" > "$TEMP_ROOT/projects.seconds"
python3 - "$TEMP_ROOT/projects.json" "$TEMP_ROOT/projects.seconds" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));elapsed=float(open(sys.argv[2]).read())
if x.get('projects')!=[]: raise SystemExit('clean database is not empty')
if elapsed>=1.0: raise SystemExit(f'empty project list too slow: {elapsed:.3f}s')
print(f'empty project list: {elapsed:.3f}s')
PY

curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/admin/db/status -o "$TEMP_ROOT/status.json"
python3 - "$TEMP_ROOT/status.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not (x.get('integrity') or {}).get('ok'): raise SystemExit('live database integrity failed')
if [m.get('version') for m in x.get('migrations',[])] != [1]: raise SystemExit('wrong live migration set')
print('database:',x.get('database_path'))
print('integrity:',x['integrity']['result'])
print('migration:',x['migrations'][0]['name'])
PY

echo '=== PUBLIC UI GATE ==='
curl --max-time 20 -fsS "$PUBLIC_URL" -o "$TEMP_ROOT/public.html"
grep -q '2026.08.23.sot-clean-ui-1' "$TEMP_ROOT/public.html"
grep -q 'PROJECT.*SOURCES.*PROCESS.*REVIEW.*PLAN.*EXECUTE.*CERTIFY' "$TEMP_ROOT/public.html" || grep -q "const stepLabels=\['Project','Sources','Process','Review','Plan','Execute','Certify'\]" "$TEMP_ROOT/public.html"

echo '=== CLEAN SOT INSTALLED ==='
echo 'Historical SOT project/corpus database rows were intentionally discarded.'
echo 'Source, Target, and Backup file content was not deleted.'
echo "URL: $PUBLIC_URL"
