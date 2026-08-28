#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUNTIME_BACKUP="$TMP/sot-api.js.before-base"
HTML_BACKUP="$TMP/SOT-turn01-base.html.before-base"
HELPER=/usr/local/sbin/sot-mount-drive
SUDOERS=/etc/sudoers.d/sot-drvfs
HAD_HTML=0
HAD_HELPER=0
HAD_SUDOERS=0
CUTOVER=0
SUCCESS=0
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
EXPECTED_BUILD='2026.08.28.sot-turn01-base-3'

# Frozen accepted sources. Rejected Base candidates are not build inputs.
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/1aebf2624621b08880a595ef9d1f58f2c8cde1b5/integrate-SOT-turn01-base.py'
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
    if [ "$HAD_HELPER" -eq 1 ]; then sudo install -o root -g root -m 0755 "$TMP/sot-mount-drive.before" "$HELPER"; else sudo rm -f "$HELPER"; fi
    if [ "$HAD_SUDOERS" -eq 1 ]; then sudo install -o root -g root -m 0440 "$TMP/sot-drvfs.before" "$SUDOERS"; else sudo rm -f "$SUDOERS"; fi
    sudo systemctl start "$SERVICE" || true
    sleep 1
    echo 'rollback health:'
    curl -sS http://127.0.0.1:18080/api/sot/health || true
    echo
  fi
  rm -rf "$TMP"
}
trap cleanup EXIT

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT"

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
grep -q "windowsDriveLetters" "$TMP/sot-api.js"
grep -q "sot-mount-drive" "$TMP/sot-api.js"
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
if(api.BUILD!=='2026.08.28.sot-turn01-base-3') throw new Error('wrong candidate build');
console.log('temp DB/API preflight: ok; projects:',projects.length);
NODE

echo '=== ARCHIVE CURRENT LIVE SOT BEFORE PATCH ==='
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base-before-dynamic-drive-patch"
mkdir -p "$LIVE_ARCHIVE"
cp -a "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp -a "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"; fi
cat > "$LIVE_ARCHIVE/ARCHIVE-MANIFEST.txt" <<EOF
Archived before SOT dynamic Windows-drive patch
Timestamp: $STAMP
Previous live API and Base HTML are preserved here before replacement.
GitHub archive lineage: SOT/archive/2026-08-28-0221-turn01-base-before-dynamic-drives/
EOF
echo "archive: $LIVE_ARCHIVE"

echo '=== CAPTURE EXACT LIVE ROLLBACK ==='
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then
  cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"
  HAD_HTML=1
fi
if sudo test -f "$HELPER"; then sudo cp -a "$HELPER" "$TMP/sot-mount-drive.before"; HAD_HELPER=1; fi
if sudo test -f "$SUDOERS"; then sudo cp -a "$SUDOERS" "$TMP/sot-drvfs.before"; HAD_SUDOERS=1; fi

cat > "$TMP/sot-mount-drive" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
if [ "$#" -ne 1 ] || [[ ! "$1" =~ ^[A-Za-z]$ ]]; then
  echo 'usage: sot-mount-drive <drive-letter>' >&2
  exit 64
fi
LETTER="${1^^}"
LOWER="${1,,}"
ROOT="/mnt/$LOWER"
mkdir -p "$ROOT"
if [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" = "$ROOT" ]; then
  exit 0
fi
mount -t drvfs "${LETTER}:" "$ROOT"
if [ "$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)" != "$ROOT" ]; then
  echo "failed to mount ${LETTER}: at $ROOT" >&2
  exit 1
fi
SH
chmod 0755 "$TMP/sot-mount-drive"
cat > "$TMP/sot-drvfs" <<'EOF'
support ALL=(root) NOPASSWD: /usr/local/sbin/sot-mount-drive *
EOF
chmod 0440 "$TMP/sot-drvfs"

CUTOVER=1

echo '=== INSTALL DYNAMIC DRIVE HELPER + CANDIDATE ==='
sudo install -o root -g root -m 0755 "$TMP/sot-mount-drive" "$HELPER"
sudo install -o root -g root -m 0440 "$TMP/sot-drvfs" "$SUDOERS"
sudo visudo -cf "$SUDOERS" >/dev/null
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
assert x.get('build')=='2026.08.28.sot-turn01-base-3',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY

echo '=== WINDOWS DRIVE DISCOVERY GATE ==='
powershell.exe -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows-drives.txt"
echo "Windows drives: $(cat "$TMP/windows-drives.txt")"
curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" "$TMP/windows-drives.txt" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('build')=='2026.08.28.sot-turn01-base-3',x
vols=x.get('volumes')
assert isinstance(vols,list) and vols,'no volumes discovered'
windows={v.strip().upper() for v in open(sys.argv[2]).read().split(',') if v.strip()}
seen={str(v.get('name','')).rstrip(':').upper() for v in vols if v.get('kind')=='drive'}
missing=windows-seen
assert not missing,f'Windows drives missing from SOT: {sorted(missing)}'
for v in vols:
    print(v.get('name'),v.get('path'),'mounted=',v.get('mounted'),'free=',v.get('free_bytes'))
for required in {'D','F','Q'}:
    if required in windows: assert required in seen,f'{required}: missing from SOT volume list'
PY

echo '=== D / F / Q REAL-FOLDER BROWSE GATE ==='
for DRIVE in D F Q; do
  if tr ',' '\n' < "$TMP/windows-drives.txt" | tr '[:lower:]' '[:upper:]' | grep -qx "$DRIVE"; then
    LOWER="$(printf '%s' "$DRIVE" | tr '[:upper:]' '[:lower:]')"
    VOL_PATH="/mnt/$LOWER"
    echo "--- $DRIVE: -> $VOL_PATH ---"
    curl --max-time 20 -fsSG --data-urlencode "path=$VOL_PATH" http://127.0.0.1:18080/api/sot/turn01/fs -o "$TMP/$DRIVE-folders.json"
    python3 - "$TMP/$DRIVE-folders.json" "$DRIVE" "$VOL_PATH" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); drive=sys.argv[2]; expected=sys.argv[3]
assert x.get('path')==expected,(x,expected)
assert x.get('volume',{}).get('name')==drive+':',(x,drive)
assert x.get('volume',{}).get('mounted') is True,(x,drive)
assert isinstance(x.get('folders'),list),x
print('real folder browse:',drive+':',expected,'folders=',len(x['folders']))
for f in x['folders'][:12]: print(' -',f.get('name'))
PY
    findmnt -T "$VOL_PATH" -n -o TARGET,FSTYPE,SOURCE
  fi
done

echo '=== LIVE UI READBACK ==='
curl --max-time 10 -fsS http://127.0.0.1:18080/SOT/SOT-turn01-base.html -o "$TMP/live.html"
cmp -s "$TMP/SOT-turn01-base.html" "$TMP/live.html" || { echo 'served Base HTML differs from built artifact'; false; }
grep -q '/turn01/fs?path=' "$TMP/live.html"
grep -q 'TURN01_BASE_STORAGE_PICKER' "$TMP/live.html"

SUCCESS=1

echo
echo '=== TURN 01 BASE QUALIFIED ==='
echo "TEST: $PUBLIC_URL"
echo 'Windows drives are discovered dynamically. Clicking a drive lazy-mounts it, lists its real folders, and supports selecting or creating a folder.'
echo "ARCHIVE: $LIVE_ARCHIVE"
