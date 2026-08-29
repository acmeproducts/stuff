#!/usr/bin/env bash
set -euo pipefail

REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
STATE=/home/support/.openclaw/sot
DB="$STATE/sot.sqlite"
SERVICE=openclaw-report-server.service
HELPER=/usr/local/sbin/sot-mount-drive
SUDOERS=/etc/sudoers.d/sot-drvfs
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
EXPECTED_BUILD='2026.08.29.sot-turn01-base-11'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
RUNTIME_BACKUP="$TMP/sot-api.js.before-base11"
HTML_BACKUP="$TMP/SOT-turn01-base.html.before-base11"
HAD_HTML=0
HAD_HELPER=0
HAD_SUDOERS=0
CUTOVER=0
SUCCESS=0

# Clean governed rebuild. No rejected Base-4..10 generated candidate is a build input.
BACKEND_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js'
BACKEND_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py'
MOUNTSTATE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/3b7694a0f542adcb247b0a8ac510071770c86c71/patch-SOT-turn01-base-storage-mountstate.py'
UI_PREBASE_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html'
UI_INTEGRATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py'
IDLE_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/94d5ecdd4d71bd5f9ea58b7dbade952093f548f9/patch-SOT-turn01-base-idle-refresh.py'

cleanup() {
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    echo
    echo '=== BASE-11 GATE FAILED — AUTOMATIC ROLLBACK ==='
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

echo '=== TURN 01 BASE-11 CLEAN F/I MOUNT-SOURCE CORRECTION ==='
curl --max-time 30 -fsSL "$BACKEND_PREBASE_URL" -o "$TMP/sot-api-pre-base.js"
curl --max-time 30 -fsSL "$BACKEND_INTEGRATOR_URL" -o "$TMP/integrate-backend.py"
curl --max-time 30 -fsSL "$MOUNTSTATE_PATCH_URL" -o "$TMP/patch-mountstate.py"
curl --max-time 30 -fsSL "$UI_PREBASE_URL" -o "$TMP/SOT-turn01-pre-base.html"
curl --max-time 30 -fsSL "$UI_INTEGRATOR_URL" -o "$TMP/integrate-ui.py"
curl --max-time 30 -fsSL "$IDLE_PATCH_URL" -o "$TMP/patch-idle.py"

python3 -m py_compile "$TMP/integrate-backend.py" "$TMP/patch-mountstate.py" "$TMP/integrate-ui.py" "$TMP/patch-idle.py"
python3 "$TMP/integrate-backend.py" "$TMP/sot-api-pre-base.js" "$TMP/sot-api-base3.js"
python3 "$TMP/patch-mountstate.py" "$TMP/sot-api-base3.js" "$TMP/sot-api.js"
python3 "$TMP/integrate-ui.py" "$TMP/SOT-turn01-pre-base.html" "$TMP/SOT-turn01-base-before-idle.html"
python3 "$TMP/patch-idle.py" "$TMP/SOT-turn01-base-before-idle.html" "$TMP/SOT-turn01-base.html"

node --check "$TMP/sot-api.js"
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" "$EXPECTED_BUILD" <<'PY'
from pathlib import Path
import sys
api = Path(sys.argv[1]).read_text()
html = Path(sys.argv[2]).read_text()
expected = sys.argv[3]
checks = [
    ('backend build', f"const BUILD = '{expected}';", api),
    ('mount-source normalizer', 'function normalizeWindowsMountSource(value)', api),
    ('hex escape decoder', "source.replace(/\\\\x([0-9a-f]{2})/gi", api),
    ('octal escape decoder', "source.replace(/\\\\([0-7]{3})/g", api),
    ('9p/drvfs mount acceptance', "['9p','drvfs'].includes(fstype)", api),
    ('postmount diagnostic', 'mount helper completed but SOT rejected mount state', api),
    ('idle refresh suppression', 'function fullyIndexedStable(p)', html),
]
for label, marker, body in checks:
    if marker not in body:
        raise SystemExit(f'generated-source gate failed: {label}: missing {marker!r}')
print('generated-source contract: ok')
PY

python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
import pathlib,re,sys
html=pathlib.Path(sys.argv[1]).read_text()
assert 'SOT-turn01-base' in html
assert 'TURN01_BASE_STORAGE_PICKER' in html
assert '/turn01/volumes' in html
assert '/turn01/fs?path=' in html
assert 'function fullyIndexedStable(p)' in html
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I)
assert scripts, 'no executable UI script found'
pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
print('UI contract unchanged: Base storage picker + idle suppression')
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
if(api.BUILD!=='2026.08.29.sot-turn01-base-11') throw new Error('wrong candidate build');
console.log('temp DB/API preflight: ok; projects:',projects.length,'build:',api.BUILD);
NODE

echo '=== ARCHIVE CURRENT LIVE BASE-9 BEFORE PATCH ==='
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base11-fi-mount-correction"
mkdir -p "$LIVE_ARCHIVE"
cp -a "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/sot-api.js"
[ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp -a "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/SOT-turn01-base.html"
printf '%s\n' 'Accepted Base-9 live state archived immediately before governed Base-11 F:/I: mount-source correction.' "Timestamp: $STAMP" > "$LIVE_ARCHIVE/ARCHIVE-MANIFEST.txt"
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

mount_state() {
  TARGET="$(findmnt -T "$ROOT" -n -o TARGET 2>/dev/null || true)"
  FSTYPE="$(findmnt -T "$ROOT" -n -o FSTYPE 2>/dev/null || true)"
  SOURCE="$(findmnt -T "$ROOT" -n -o SOURCE 2>/dev/null || true)"
  SOURCE_NORM="$(python3 - "$SOURCE" <<'PY'
import re,sys
s=sys.argv[1].strip()
s=re.sub(r'\\x([0-9a-fA-F]{2})',lambda m: chr(int(m.group(1),16)),s)
s=re.sub(r'\\([0-7]{3})',lambda m: chr(int(m.group(1),8)),s)
print(s.rstrip('\\/').upper())
PY
)"
}

mount_state
if [ "$TARGET" = "$ROOT" ] && { [ "$FSTYPE" = '9p' ] || [ "$FSTYPE" = 'drvfs' ]; } && [ "$SOURCE_NORM" = "${LETTER}:" ] && ls -A "$ROOT" >/dev/null 2>&1; then
  exit 0
fi

if mountpoint -q "$ROOT"; then umount "$ROOT"; fi
mount -t drvfs "${LETTER}:" "$ROOT"
mount_state
if [ "$TARGET" != "$ROOT" ] || { [ "$FSTYPE" != '9p' ] && [ "$FSTYPE" != 'drvfs' ]; } || [ "$SOURCE_NORM" != "${LETTER}:" ]; then
  echo "failed to establish Windows mount for ${LETTER}: at $ROOT (target=$TARGET fstype=$FSTYPE source=$SOURCE normalized=$SOURCE_NORM)" >&2
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
echo '=== INSTALL BASE-11 CANDIDATE ==='
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
[ "$HEALTH_OK" -eq 1 ] || { echo 'live health never became ready'; false; }
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('status')=='ok',x
assert x.get('database_version')==4,x
assert x.get('build')=='2026.08.29.sot-turn01-base-11',x
print('health:',x['status'],'schema:',x['database_version'],'build:',x['build'])
PY

echo '=== WINDOWS DRIVE DISCOVERY + ONLINE QUALIFICATION ==='
POWERSHELL='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe'
[ -x "$POWERSHELL" ] || { echo "PowerShell unavailable at $POWERSHELL"; false; }
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows-drives.txt"
echo "Windows drives: $(cat "$TMP/windows-drives.txt")"
curl --max-time 10 -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
python3 - "$TMP/volumes.json" "$TMP/windows-drives.txt" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('build')=='2026.08.29.sot-turn01-base-11',x
windows={v.strip().upper() for v in open(sys.argv[2]).read().split(',') if v.strip()}
seen={str(v.get('name','')).rstrip(':').upper() for v in x.get('volumes',[]) if v.get('kind')=='drive'}
assert not windows-seen,f'Windows drives missing from SOT inventory: {sorted(windows-seen)}'
for v in x.get('volumes',[]): print(v.get('name'),v.get('path'),'mounted=',v.get('mounted'),'free=',v.get('free_bytes'))
PY

IFS=',' read -r -a DRIVES <<< "$(cat "$TMP/windows-drives.txt")"
for DRIVE in "${DRIVES[@]}"; do
  DRIVE="$(printf '%s' "$DRIVE" | tr -d '[:space:]' | tr '[:lower:]' '[:upper:]')"
  [ -n "$DRIVE" ] || continue
  LOWER="$(printf '%s' "$DRIVE" | tr '[:upper:]' '[:lower:]')"
  VOL_PATH="/mnt/$LOWER"
  WIN_ONLINE="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${DRIVE}:\\') { '1' } else { '0' }" | tr -d '\r\n')"
  echo "--- $DRIVE: Windows-readable=$WIN_ONLINE -> $VOL_PATH ---"
  HTTP_CODE="$(curl --max-time 25 -sSG --data-urlencode "path=$VOL_PATH" -o "$TMP/$DRIVE-folders.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs || true)"
  if [ "$WIN_ONLINE" = '1' ] && [ "$HTTP_CODE" != '200' ]; then
    echo "FAIL: Windows can read $DRIVE: but SOT browse returned HTTP $HTTP_CODE"
    cat "$TMP/$DRIVE-folders.json" 2>/dev/null || true
    echo
    false
  fi
  if [ "$HTTP_CODE" = '200' ]; then
    python3 - "$TMP/$DRIVE-folders.json" "$DRIVE" "$VOL_PATH" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); drive=sys.argv[2]; expected=sys.argv[3]
assert x.get('path')==expected,(x,expected)
assert x.get('volume',{}).get('name')==drive+':',(x,drive)
assert x.get('volume',{}).get('mounted') is True,(x,drive)
assert isinstance(x.get('folders'),list),x
print('USABLE',drive+':','folders=',len(x['folders']))
PY
    findmnt -T "$VOL_PATH" -n -o TARGET,FSTYPE,SOURCE || true
  else
    echo "UNAVAILABLE $DRIVE: HTTP $HTTP_CODE (Windows-readable=$WIN_ONLINE)"
    cat "$TMP/$DRIVE-folders.json" 2>/dev/null || true
    echo
  fi
done

echo '=== LIVE UI READBACK ==='
curl --max-time 10 -fsS http://127.0.0.1:18080/SOT/SOT-turn01-base.html -o "$TMP/live.html"
cmp -s "$TMP/SOT-turn01-base.html" "$TMP/live.html" || { echo 'served Base HTML differs from built artifact'; false; }

SUCCESS=1
echo
echo '=== TURN 01 BASE-11 MECHANICALLY QUALIFIED ==='
echo "TEST: $PUBLIC_URL"
echo "ARCHIVE: $LIVE_ARCHIVE"
