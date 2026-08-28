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
RUNTIME_BACKUP="$TMP/sot-api.js.before-base9"
HTML_BACKUP="$TMP/SOT-turn01-base.html.before-base9"
HELPER=/usr/local/sbin/sot-mount-drive
SUDOERS=/etc/sudoers.d/sot-drvfs
HAD_HTML=0
HAD_HELPER=0
HAD_SUDOERS=0
CUTOVER=0
SUCCESS=0
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
EXPECTED_BUILD='2026.08.28.sot-turn01-base-9'

# CLEAN GOVERNED BASE REBUILD.
# Build inputs are only frozen accepted pre-base sources + accepted Base-3
# integrators + the single consolidated Base-9 storage patch + UI idle patch.
# No Base-4/5/6/7/8 candidate and no prior generated installer is an input.
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py'
STORAGE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/0fcd305b96be6631f5c5a26e019a141ac2995bad/patch-SOT-turn01-base-storage-final.py'
UI_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html'
UI_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py'
IDLE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py'

cleanup() {
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    echo
    echo '=== BASE GATE FAILED — AUTOMATIC ROLLBACK ==='
    sudo systemctl stop "$SERVICE" || true
    [ -f "$RUNTIME_BACKUP" ] && install -m 0644 "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"
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

echo '=== TURN 01 BASE-9 CLEAN REBUILD FROM ACCEPTED PRE-BASE ==='
curl --max-time 30 -fsSL "$BACKEND_PREBASE_URL" -o "$TMP/sot-api-pre-base.js"
curl --max-time 30 -fsSL "$BACKEND_INTEGRATOR_URL" -o "$TMP/integrate-backend.py"
curl --max-time 30 -fsSL "$STORAGE_PATCH_URL" -o "$TMP/patch-storage-final.py"
curl --max-time 30 -fsSL "$UI_PREBASE_URL" -o "$TMP/SOT-turn01-pre-base.html"
curl --max-time 30 -fsSL "$UI_INTEGRATOR_URL" -o "$TMP/integrate-ui.py"
curl --max-time 30 -fsSL "$IDLE_PATCH_URL" -o "$TMP/patch-idle.py"

python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api-base3.js"
python3 "$TMP/patch-storage-final.py" "$TMP/sot-api-base3.js" "$TMP/sot-api.js"
python3 "$TMP/integrate-ui.py" "$TMP/SOT-turn01-pre-base.html" "$TMP/SOT-turn01-base-before-idle.html"
python3 "$TMP/patch-idle.py" "$TMP/SOT-turn01-base-before-idle.html" "$TMP/SOT-turn01-base.html"

node --check "$TMP/sot-api-pre-base.js"
node --check "$TMP/sot-api-base3.js"
node --check "$TMP/sot-api.js"
grep -Fq "const BUILD = '$EXPECTED_BUILD';" "$TMP/sot-api.js"
grep -Fq '/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe' "$TMP/sot-api.js"
grep -Fq "fstype === '9p' || fstype === 'drvfs'" "$TMP/sot-api.js"
grep -Fq 'fs.readdirSync(root)' "$TMP/sot-api.js"
grep -Fq 'function fullyIndexedStable(p)' "$TMP/SOT-turn01-base.html"
grep -Fq "if(active){let p=await api('/projects')" "$TMP/SOT-turn01-base.html"
if grep -Fq "execFileSync('powershell.exe'" "$TMP/sot-api.js"; then
  echo 'FAIL: PATH-based PowerShell discovery remains'
  false
fi
if grep -Fq 'sot-api-core-pre-base' "$TMP/sot-api.js"; then
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
assert 'function fullyIndexedStable(p)' in html
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
if not scripts: raise SystemExit('no executable UI script found')
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
print('UI contract: canonical Base storage picker + stable-index idle suppression')
PY
node --check "$TMP/ui.js"

echo '=== TEMP DATABASE / API PREFLIGHT ==='
mkdir -p "$TMP/sot-db/migrations"
for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do
  cp -a "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"
done
cp -a "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]);
const projects=api._test.listProjects();
if(!Array.isArray(projects)) throw new Error('project list contract failed');
if(api.BUILD!=='2026.08.28.sot-turn01-base-9') throw new Error('wrong candidate build');
console.log('temp DB/API preflight: ok; projects:',projects.length,'build:',api.BUILD);
NODE

echo '=== ARCHIVE CURRENT LIVE SOT BEFORE PATCH ==='
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base-before-base9-clean-patch"
mkdir -p "$LIVE_ARCHIVE"
cp -a "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp -a "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"
cat > "$LIVE_ARCHIVE/ARCHIVE-MANIFEST.txt" <<EOF
Archived immediately before clean Turn 01 Base-9 cutover.
Timestamp: $STAMP
Build input lineage: accepted pre-base only; rejected Base-4..8 candidates are not inputs.
EOF
echo "archive: $LIVE_ARCHIVE"

echo '=== CAPTURE EXACT LIVE ROLLBACK ==='
cp -a "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"
if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp -a "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi
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
TARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"
FSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"
SOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"
SOURCE_NORM="$(printf '%s' "$SOURCE" | sed 's#[\\/]$##')"
if [ "$TARGET" = "$ROOT" ] && { [ "$FSTYPE" = '9p' ] || [ "$FSTYPE" = 'drvfs' ]; } && [ "${SOURCE_NORM^^}" = "${LETTER}:" ] && ls -A "$ROOT" >/dev/null 2>&1; then
  exit 0
fi
if mountpoint -q "$ROOT"; then
  umount "$ROOT"
fi
mount -t drvfs "${LETTER}:" "$ROOT"
TARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"
FSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"
SOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"
SOURCE_NORM="$(printf '%s' "$SOURCE" | sed 's#[\\/]$##')"
if [ "$TARGET" != "$ROOT" ] || { [ "$FSTYPE" != '9p' ] && [ "$FSTYPE" != 'drvfs' ]; } || [ "${SOURCE_NORM^^}" != "${LETTER}:" ]; then
  echo "failed to establish Windows mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE)" >&2
  exit 1
fi
if ! ls -A "$ROOT" >/dev/null 2>&1; then
  echo "Windows drive ${LETTER}: mounted at $ROOT but is not readable from WSL" >&2
  exit 1
fi
SH
chmod 0755 "$TMP/sot-mount-drive"
cat > "$TMP/sot-drvfs" <<'EOF'
support ALL=(root) NOPASSWD: /usr/local/sbin/sot-mount-drive *
EOF
chmod 0440 "$TMP/sot-drvfs"

CUTOVER=1

echo '=== INSTALL CLEAN BASE-9 CANDIDATE ==='
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
  if curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"; then HEALTH_OK=1; break; fi
  sleep 1
done
if [ "$HEALTH_OK" -ne 1 ]; then echo 'live health never became ready'; false; fi
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('status')=='ok',x
assert x.get('database_version')==4,x
assert x.get('build')=='2026.08.28.sot-turn01-base-9',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY

echo '=== WINDOWS DRIVE DISCOVERY GATE ==='
POWERSHELL='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
[ -x "$POWERSHELL" ] || { echo "PowerShell unavailable at $POWERSHELL"; false; }
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows-drives.txt"
echo "Windows drives: $(cat "$TMP/windows-drives.txt")"
curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" "$TMP/windows-drives.txt" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('build')=='2026.08.28.sot-turn01-base-9',x
vols=x.get('volumes'); assert isinstance(vols,list) and vols,'no volumes discovered'
windows={v.strip().upper() for v in open(sys.argv[2]).read().split(',') if v.strip()}
seen={str(v.get('name','')).rstrip(':').upper() for v in vols if v.get('kind')=='drive'}
missing=windows-seen
assert not missing,f'Windows drives missing from SOT inventory: {sorted(missing)}'
for v in vols:
    print(v.get('name'),v.get('path'),'mounted=',v.get('mounted'),'free=',v.get('free_bytes'))
PY

echo '=== USABLE DRIVE BROWSE QUALIFICATION ==='
python3 - "$TMP/volumes.json" <<'PY' > "$TMP/drive-list.txt"
import json,sys
x=json.load(open(sys.argv[1]))
for v in x.get('volumes',[]):
    if v.get('kind')=='drive': print(str(v.get('name','')).rstrip(':').upper())
PY
while IFS= read -r DRIVE; do
  [ -n "$DRIVE" ] || continue
  LOWER="$(printf '%s' "$DRIVE" | tr '[:upper:]' '[:lower:]')"
  VOL_PATH="/mnt/$LOWER"
  echo "--- $DRIVE: -> $VOL_PATH ---"
  HTTP_CODE="$(curl --max-time 20 -sSG --data-urlencode "path=$VOL_PATH" -o "$TMP/$DRIVE-folders.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
  if [ "$HTTP_CODE" != '200' ]; then
    echo "UNAVAILABLE $DRIVE: HTTP $HTTP_CODE"
    cat "$TMP/$DRIVE-folders.json" 2>/dev/null || true
    echo
    continue
  fi
  python3 - "$TMP/$DRIVE-folders.json" "$DRIVE" "$VOL_PATH" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); drive=sys.argv[2]; expected=sys.argv[3]
assert x.get('path')==expected,(x,expected)
assert x.get('volume',{}).get('name')==drive+':',(x,drive)
assert x.get('volume',{}).get('mounted') is True,(x,drive)
assert isinstance(x.get('folders'),list),x
print('USABLE',drive+':','folders=',len(x['folders']))
for f in x['folders'][:8]: print(' -',f.get('name'))
PY
  findmnt -T "$VOL_PATH" -n -o TARGET,FSTYPE,SOURCE || true
done < "$TMP/drive-list.txt"

echo '=== LIVE UI READBACK ==='
curl --max-time 10 -fsS http://127.0.0.1:18080/SOT/SOT-turn01-base.html -o "$TMP/live.html"
cmp -s "$TMP/SOT-turn01-base.html" "$TMP/live.html" || { echo 'served Base HTML differs from built artifact'; false; }
grep -Fq '/turn01/fs?path=' "$TMP/live.html"
grep -Fq 'TURN01_BASE_STORAGE_PICKER' "$TMP/live.html"
grep -Fq 'function fullyIndexedStable(p)' "$TMP/live.html"

SUCCESS=1

echo
echo '=== TURN 01 BASE-9 MECHANICALLY QUALIFIED ==='
echo "TEST: $PUBLIC_URL"
echo "ARCHIVE: $LIVE_ARCHIVE"
echo 'Owner gate remains: confirm expected usable drives (especially F:/I: when media is readable), folder selection, and completed-project idle behavior.'
