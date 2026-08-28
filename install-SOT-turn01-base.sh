#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUNTIME_BACKUP="$TMP/sot-api.js.before-base"
HTML_BACKUP="$TMP/SOT-turn01-base.html.before-base"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
EXPECTED_BUILD='2026.08.27.sot-turn01-base-2'

# Frozen accepted sources. The rejected Base candidate is not a build input.
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/48308062f3ab181b55acaadf98b9b7caf226c480/integrate-SOT-turn01-base.py'
UI_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html'
UI_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py'

cleanup() {
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    echo
    echo '=== BASE GATE FAILED — AUTOMATIC ROLLBACK ==='
    sudo systemctl stop "$SERVICE" || true
    if [ -f "$RUNTIME_BACKUP" ]; then install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"; fi
    if [ "$HAD_HTML" -eq 1 ] && [ -f "$HTML_BACKUP" ]; then
      install -m 0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"
    else
      rm -f "$SOT_DIR/SOT-turn01-base.html"
    fi
    sudo systemctl start "$SERVICE" || true
    sleep 1
    echo 'rollback health:'
    curl -sS http://127.0.0.1:18080/api/sot/health || true
    echo
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

mkdir -p "$SOT_DIR"

echo '=== BUILD TURN 01 BASE FROM ACCEPTED PRE-BASE ==='
curl --max-time 30 -fsSL "$BACKEND_PREBASE_URL" -o "$TMP/sot-api-pre-base.js"
curl --max-time 30 -fsSL "$BACKEND_INTEGRATOR_URL" -o "$TMP/integrate-backend.py"
curl --max-time 30 -fsSL "$UI_PREBASE_URL" -o "$TMP/SOT-turn01-pre-base.html"
curl --max-time 30 -fsSL "$UI_INTEGRATOR_URL" -o "$TMP/integrate-ui.py"

python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api.js"
python3 "$TMP/integrate-ui.py" "$TMP/SOT-turn01-pre-base.html" "$TMP/SOT-turn01-base.html"

node --check "$TMP/sot-api-pre-base.js"
node --check "$TMP/sot-api.js"
grep -q "TURN01_BASE_DIRECT_INTEGRATION" "$TMP/sot-api.js"
grep -q "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js"
if grep -q "sot-api-core-pre-base" "$TMP/sot-api.js"; then
  echo 'FAIL: rejected wrapper/core architecture reappeared'
  false
fi

python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
import pathlib,re,sys
html=pathlib.Path(sys.argv[1]).read_text()
assert 'SOT-turn01-base' in html
assert 'TURN01_BASE_STORAGE_PICKER' in html
assert '/turn01/volumes' in html
assert '/turn01/fs?path=' in html
start=html.index('async function openDestinationPicker')
end=html.index('function openConfig(){',start)
fn=html[start:end]
assert 'data-volume' in fn
assert 'd.folders' in fn
assert '/turn01/fs?path=' in fn
assert 'api(`/fs?path=' not in fn
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no executable UI script found')
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
print('UI contract: volume click -> constrained real-folder browse')
PY
node --check "$TMP/ui.js"

echo '=== TEMP DATABASE / API PREFLIGHT ==='
mkdir -p "$TMP/sot-db/migrations"
cp -a "$REPORT_ROOT/sot-db/migrations/001-initial.sql" "$TMP/sot-db/migrations/"
cp -a "$REPORT_ROOT/sot-db/migrations/002-project-list-metrics.sql" "$TMP/sot-db/migrations/"
cp -a "$REPORT_ROOT/sot-db/migrations/003-project-run-controls.sql" "$TMP/sot-db/migrations/"
cp -a "$REPORT_ROOT/sot-db/migrations/004-live-byte-progress.sql" "$TMP/sot-db/migrations/"
cp -a "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects();
if(!Array.isArray(projects)) throw new Error('project list contract failed');
if(api.BUILD!=='2026.08.27.sot-turn01-base-2') throw new Error('wrong candidate build');
console.log('temp DB/API preflight: ok; projects:',projects.length);
NODE

echo '=== CAPTURE EXACT LIVE ROLLBACK ==='
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then
  cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"
  HAD_HTML=1
fi

CUTOVER=1

echo '=== INSTALL CANDIDATE ==='
sudo systemctl stop "$SERVICE"
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"

echo '=== LIVE HEALTH GATE ==='
HEALTH_OK=0
for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"; then
    HEALTH_OK=1
    break
  fi
  sleep 1
done
if [ "$HEALTH_OK" -ne 1 ]; then
  echo 'live health never became ready'
  curl -sS -i http://127.0.0.1:18080/api/sot/health || true
  false
fi
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('status')=='ok',x
assert x.get('database_version')==4,x
assert x.get('build')=='2026.08.27.sot-turn01-base-2',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY

echo '=== LIVE REAL-VOLUME / REAL-FOLDER GATE ==='
curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" "$TMP/volume-path.txt" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('build')=='2026.08.27.sot-turn01-base-2',x
vols=x.get('volumes')
assert isinstance(vols,list) and vols,'no WSL-visible volumes discovered'
for v in vols:
    print(v.get('name'),v.get('path'),'free=',v.get('free_bytes'))
open(sys.argv[2],'w').write(vols[0]['path'])
PY
VOL_PATH="$(cat "$TMP/volume-path.txt")"
curl --max-time 10 -fsSG --data-urlencode "path=$VOL_PATH" http://127.0.0.1:18080/api/sot/turn01/fs -o "$TMP/folders.json"
python3 - "$TMP/folders.json" "$VOL_PATH" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); expected=sys.argv[2]
assert x.get('path')==expected,(x,expected)
assert x.get('volume',{}).get('path')==expected,(x,expected)
assert isinstance(x.get('folders'),list),x
print('real folder browse:',x['volume'].get('name'),x['path'])
print('folders returned:',len(x['folders']))
for f in x['folders'][:12]: print(' -',f.get('name'))
PY

echo '=== LIVE UI READBACK ==='
curl --max-time 10 -fsS http://127.0.0.1:18080/SOT/SOT-turn01-base.html -o "$TMP/live.html"
cmp -s "$TMP/SOT-turn01-base.html" "$TMP/live.html" || { echo 'served Base HTML differs from built artifact'; false; }
grep -q '/turn01/fs?path=' "$TMP/live.html"
grep -q 'TURN01_BASE_STORAGE_PICKER' "$TMP/live.html"

SUCCESS=1

echo
echo '=== TURN 01 BASE QUALIFIED ==='
echo "TEST: $PUBLIC_URL"
echo 'Target/Backup volume clicks are wired to the live constrained folder endpoint.'
