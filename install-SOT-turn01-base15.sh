#!/usr/bin/env bash
set -euo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"; ARCHIVE_ROOT="$SOT_DIR/archive"; STATE=/home/support/.openclaw/sot; DB="$STATE/sot.sqlite"; SERVICE=openclaw-report-server.service
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; EXPECTED_BUILD='2026.08.29.sot-turn01-base-15'; PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
RUNTIME_BACKUP="$TMP/sot-api.before.js"; HTML_BACKUP="$TMP/base.before.html"; HAD_HTML=0; CUTOVER=0; SUCCESS=0
cleanup(){ if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then echo '=== BASE-15 GATE FAILED — AUTOMATIC ROLLBACK ==='; sudo systemctl stop "$SERVICE" || true; cp -a "$RUNTIME_BACKUP" "$REPORT_ROOT/sot-api.js"; if [ "$HAD_HTML" -eq 1 ]; then cp -a "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; else rm -f "$SOT_DIR/SOT-turn01-base.html"; fi; sudo systemctl start "$SERVICE" || true; fi; rm -rf "$TMP"; }
trap cleanup EXIT
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT"
echo '=== TURN 01 BASE-15 CLEAN REBUILD ==='
CURRENT_BUILD="$(curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health 2>/dev/null | python3 -c "import json,sys; print(json.load(sys.stdin).get('build',''))" 2>/dev/null || true)"
echo "current live build: ${CURRENT_BUILD:-unavailable}"
[ "$CURRENT_BUILD" = '2026.08.28.sot-turn01-base-9' ] || { echo "refusing rebuild from unexpected live build: $CURRENT_BUILD"; false; }
BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
curl -fsSL "$BASE/9422453c180f8fce4e7d5fe362867912dc8005d1/sot-api.js" -o "$TMP/pre.js"
curl -fsSL "$BASE/1aebf2624621b08880a595ef9d1f58f2c8cde1b/integrate-SOT-turn01-base.py" -o "$TMP/integrate.py"
curl -fsSL "$BASE/be6daf3341015b02c3544f0021287b5cf8fbd571/generate-SOT-turn01-base14.py" -o "$TMP/generate.py"
curl -fsSL "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" -o "$TMP/pre.html"
curl -fsSL "$BASE/e5a73821c7bd9296c8088b6d53e76082af2bf63b/integrate-SOT-turn01-base-ui.py" -o "$TMP/ui.py"
curl -fsSL "$BASE/5a37f9a043665a81b8dddc791a6a71b21b6eb24a/patch-SOT-turn01-base-ui-picker-state.py" -o "$TMP/uistate.py"
curl -fsSL "$BASE/7b43ef8d906e08e455021bd96f54d537f002453c/patch-SOT-turn01-base-idle-refresh-v2.py" -o "$TMP/idle.py"
python3 -m py_compile "$TMP/integrate.py" "$TMP/generate.py" "$TMP/ui.py" "$TMP/uistate.py" "$TMP/idle.py"
python3 "$TMP/integrate.py" "$TMP/pre.js" "$TMP/base3.js"
python3 "$TMP/generate.py" "$TMP/base3.js" "$TMP/sot-api.js"
sed -i "s/2026.08.29.sot-turn01-base-14/2026.08.29.sot-turn01-base-15/g" "$TMP/sot-api.js"
python3 "$TMP/ui.py" "$TMP/pre.html" "$TMP/ui0.html"
python3 "$TMP/uistate.py" "$TMP/ui0.html" "$TMP/ui1.html"
python3 "$TMP/idle.py" "$TMP/ui1.html" "$TMP/SOT-turn01-base.html"
node --check "$TMP/sot-api.js"
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
api=Path(sys.argv[1]).read_text(); html=Path(sys.argv[2]).read_text()
for m in ["const BUILD = '2026.08.29.sot-turn01-base-15';",'function windowsListDirectories(value)','target_browse_root:','backup_browse_root:']: assert m in api,m
for m in ['captureBrowse','function fullyIndexedStable(p)','/turn01/fs?path=']: assert m in html,m
for bad in ['normalizeWindowsMountSource','mount helper completed but SOT rejected mount state']: assert bad not in api,bad
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',html,re.I); assert scripts
Path(sys.argv[3]).write_text('\n;\n'.join(scripts))
print('generated-source contract: ok')
PY
node --check "$TMP/ui.js"
mkdir -p "$TMP/sot-db/migrations"; for m in 001-initial.sql 002-project-list-metrics.sql 003-project-run-controls.sql 004-live-byte-progress.sql; do cp "$REPORT_ROOT/sot-db/migrations/$m" "$TMP/sot-db/migrations/"; done; cp "$DB" "$TMP/test.sqlite"
SOT_DB_PATH="$TMP/test.sqlite" SOT_SQLITE_ADAPTER="$REPORT_ROOT/sot-sqlite.py" node - "$TMP/sot-api.js" <<'NODE'
const api=require(process.argv[2]); if(api.BUILD!=='2026.08.29.sot-turn01-base-15') throw new Error('wrong build'); if(!Array.isArray(api._test.listProjects())) throw new Error('projects'); console.log('temp DB/API preflight: ok')
NODE
LIVE_ARCHIVE="$ARCHIVE_ROOT/$STAMP-turn01-base9-before-base15"; mkdir -p "$LIVE_ARCHIVE"; cp "$REPORT_ROOT/sot-api.js" "$LIVE_ARCHIVE/"; [ -f "$SOT_DIR/SOT-turn01-base.html" ] && cp "$SOT_DIR/SOT-turn01-base.html" "$LIVE_ARCHIVE/" || true
cp "$REPORT_ROOT/sot-api.js" "$RUNTIME_BACKUP"; if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi
CUTOVER=1; sudo systemctl stop "$SERVICE"; install -m 0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"; install -m 0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; sudo systemctl start "$SERVICE"
for i in {1..30}; do curl --max-time 3 -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" && break; sleep 1; done
python3 - "$TMP/health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('status')=='ok' and x.get('database_version')==4 and x.get('build')=='2026.08.29.sot-turn01-base-15',x
print('health:',x['build'])
PY
POWERSHELL=/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe
"$POWERSHELL" -NoProfile -NonInteractive -Command "(Get-PSDrive -PSProvider FileSystem | Select-Object -ExpandProperty Name) -join ','" | tr -d '\r' > "$TMP/windows.txt"
curl -fsS http://127.0.0.1:18080/api/sot/turn01/volumes -o "$TMP/volumes.json"
IFS=',' read -r -a DRIVES <<< "$(cat "$TMP/windows.txt")"; for DRIVE in "${DRIVES[@]}"; do DRIVE="$(echo "$DRIVE"|tr -d '[:space:]'|tr '[:lower:]' '[:upper:]')"; [ -n "$DRIVE" ] || continue; LOWER="$(echo "$DRIVE"|tr '[:upper:]' '[:lower:]')"; ONLINE="$("$POWERSHELL" -NoProfile -NonInteractive -Command "if (Test-Path -LiteralPath '${DRIVE}:\\' -PathType Container) { '1' } else { '0' }"|tr -d '\r\n')"; echo "--- $DRIVE: Windows-readable=$ONLINE ---"; if [ "$ONLINE" = 1 ]; then CODE="$(curl -sSG --data-urlencode "path=/mnt/$LOWER" -o "$TMP/$DRIVE.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/fs)"; [ "$CODE" = 200 ] || { cat "$TMP/$DRIVE.json"; false; }; python3 - "$TMP/$DRIVE.json" "$DRIVE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert isinstance(x.get('folders'),list),x; print(sys.argv[2]+': folder API OK; folders:',len(x['folders']))
PY
fi; done
curl -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"; TOKEN="$(python3 -c "import json; p=json.load(open('$TMP/projects.json'))['projects']; print(p[0]['project_token'])")"; curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" -o "$TMP/before.json"; PROBE="$(python3 -c "import json; v=json.load(open('$TMP/volumes.json'))['volumes']; print(v[0]['path'])")"; python3 - "$PROBE" "$TMP/probe.json" <<'PY'
import json,sys; open(sys.argv[2],'w').write(json.dumps({'target_browse_root':sys.argv[1]}))
PY
curl -fsS -X PUT -H 'Content-Type: application/json' --data-binary "@$TMP/probe.json" "http://127.0.0.1:18080/api/sot/turn01/projects/$TOKEN/storage" -o "$TMP/after.json"; python3 - "$TMP/after.json" "$PROBE" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('target_browse_root')==sys.argv[2],x; print('picker state persisted:',x['target_browse_root'])
PY
SUCCESS=1; echo '=== TURN 01 BASE-15 MECHANICALLY QUALIFIED ==='; echo "TEST URL: $PUBLIC_URL"
