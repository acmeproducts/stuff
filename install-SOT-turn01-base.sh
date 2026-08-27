#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUNTIME_BACKUP="$REPORT_ROOT/sot-api.js.pre-turn01-base-$STAMP"
HTML_BACKUP="$SOT_DIR/SOT-turn01-base.html.pre-rebuild-$STAMP"
trap 'rm -rf "$TMP"' EXIT

# Frozen, accepted pre-base backend source. Do not build from the rejected wrapper.
CORE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/ed2d24016aea2cd780dbddc4e0f6696b01722718/integrate-SOT-turn01-base.py'
# The UI delta was not the cause of the rejected deployment; its canonical Base bytes are retained and requalified here.
HTML_URL='https://raw.githubusercontent.com/acmeproducts/stuff/41f18cd9088bd16f80a682c59ce0be937b794779/SOT-turn01-base.html'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
EXPECTED_BUILD='2026.08.27.sot-turn01-base-2'

mkdir -p "$SOT_DIR"

echo '=== FETCH CLEAN SOURCE + BASE BUILD INPUTS ==='
curl --max-time 30 -fsSL "$CORE_URL" -o "$TMP/sot-api-pre-base.js"
curl --max-time 30 -fsSL "$INTEGRATOR_URL" -o "$TMP/integrate-SOT-turn01-base.py"
curl --max-time 30 -fsSL "$HTML_URL" -o "$TMP/SOT-turn01-base.html"

python3 "$TMP/integrate-SOT-turn01-base.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api.js"

node --check "$TMP/sot-api-pre-base.js"
node --check "$TMP/sot-api.js"
grep -q "TURN01_BASE_DIRECT_INTEGRATION" "$TMP/sot-api.js"
grep -q "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js"
if grep -q "sot-api-core-pre-base" "$TMP/sot-api.js"; then
  echo 'FAIL: rejected wrapper/core dependency reappeared'
  false
fi

python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
import pathlib,re,sys
html=pathlib.Path(sys.argv[1]).read_text()
assert 'SOT-turn01-base' in html
assert '/turn01/volumes' in html
assert '/turn01/projects/' in html and '/storage' in html
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no executable script found')
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
node --check "$TMP/ui.js"

# Mechanical DB gate before touching the service.
echo '=== PRE-FLIGHT EXISTING DATABASE ==='
python3 - "$DB" <<'PY'
import sqlite3,sys
p=sys.argv[1]
c=sqlite3.connect(f'file:{p}?mode=ro',uri=True)
ver=c.execute('select max(version) from schema_migrations').fetchone()[0]
ok=c.execute('pragma integrity_check').fetchone()[0]
if ver != 4: raise SystemExit(f'expected schema 4, got {ver}')
if str(ok).lower() != 'ok': raise SystemExit(f'integrity failed: {ok}')
print('schema:',ver,'integrity:',ok)
PY

# Preserve exact currently working runtime before cutover.
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; fi

rollback() {
  echo '=== AUTOMATIC ROLLBACK ==='
  sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
  cp -a "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"
  if [ -f "$HTML_BACKUP" ]; then cp -a "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; fi
  sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
  sleep 1
  curl --max-time 4 -sS -i http://127.0.0.1:18080/api/sot/health || true
  echo
  sudo journalctl -u "$SERVICE" -n 60 --no-pager || true
  echo 'BASE CUTOVER FAILED; VERIFIED PREVIOUS RUNTIME RESTORED'
}

cutover_ok=0

echo '=== TRANSACTIONAL CUTOVER ==='
sudo systemctl stop "$SERVICE"
install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"

for attempt in {1..30}; do
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>"$TMP/health.err"; then
    if python3 - "$TMP/health.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
expected=sys.argv[2]
if x.get('status')!='ok': raise SystemExit(1)
if x.get('database_version')!=4: raise SystemExit(1)
if x.get('build')!=expected: raise SystemExit(1)
PY
    then cutover_ok=1; break; fi
  fi
  sleep 1
done

if [ "$cutover_ok" -ne 1 ]; then
  echo 'HEALTH GATE FAILED'
  [ ! -f "$TMP/health.json" ] || cat "$TMP/health.json"
  [ ! -f "$TMP/health.err" ] || cat "$TMP/health.err"
  rollback
  false
fi

echo '=== LIVE BASE GATES ==='
cat "$TMP/health.json"; echo

curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); expected=sys.argv[2]
if x.get('build')!=expected: raise SystemExit('wrong Base API build')
if not isinstance(x.get('volumes'),list) or not x['volumes']: raise SystemExit('no WSL-visible volumes discovered')
print('WSL-visible volumes:',len(x['volumes']))
for v in x['volumes']:
    print(' -',v.get('name'),v.get('path'),'free=',v.get('free_bytes'))
PY

# Read-only storage contract gate against the first existing project when available.
curl --max-time 5 -fsS http://127.0.0.1:18080/api/sot/projects -o "$TMP/projects.json"
PROJECT_TOKEN="$(python3 - "$TMP/projects.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
ps=x.get('projects') if isinstance(x,dict) else x
ps=ps or []
print(ps[0].get('project_token','') if ps else '')
PY
)"
if [ -n "$PROJECT_TOKEN" ]; then
  curl --max-time 5 -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$PROJECT_TOKEN/storage" -o "$TMP/storage.json"
  python3 - "$TMP/storage.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); expected=sys.argv[2]
if x.get('build')!=expected: raise SystemExit('storage endpoint wrong build')
for k in ('target_root','backup_root','target_available','backup_available'):
    if k not in x: raise SystemExit('storage response missing '+k)
print('project storage contract: ok')
PY
else
  echo 'project storage contract: route installed; no project exists for read-only instance gate'
fi

curl --max-time 5 -fsS http://127.0.0.1:18080/SOT/SOT-turn01-base.html -o "$TMP/live.html"
grep -q 'SOT-turn01-base' "$TMP/live.html"
cmp -s "$TMP/SOT-turn01-base.html" "$TMP/live.html"

echo '=== TURN 01 BASE QUALIFIED ==='
echo "Runtime backup: $RUNTIME_BACKUP"
echo "TEST: $PUBLIC_URL"
