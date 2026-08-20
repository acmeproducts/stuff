#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
UI="$ROOT/SOT/project.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BUILD=2026.08.20.6.9.1-wsl-path-centric-analysis
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json"
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]:
    raise SystemExit('This verifier only repairs an already-live 6.9.1 backend: '+repr(x))
need={'path-centric-projects','global-hash-reuse','volume-relative-hash-reuse','progressive-explorer-index','impact-analysis','global-multi-project-scheduler'}
missing=need-set(x.get('capabilities') or [])
if missing: raise SystemExit('Missing capabilities: '+repr(sorted(missing)))
print('Backend already live:',x['build'])
PY

node --check "$API"
node -e "require(process.argv[1]); console.log('live backend require OK')" "$API"

echo '=== UI ALIGNMENT ==='
if grep -q "$BUILD" "$UI" && grep -q 'Recall / edit existing project' "$UI" && grep -q 'Add current path' "$UI"; then
  echo 'UI already contains 6.9.1 final authority.'
else
  echo 'Backend is 6.9.1 but UI is not aligned; repairing UI only.'
  curl -fsSL "$BASE/sot-ui-6.9.1-path-centric-final.js" -o "$TMP/ui-final.js"
  node --check "$TMP/ui-final.js"
  cp -a "$UI" "$UI.before-6.9.1-ui-repair-$(date +%Y%m%d-%H%M%S)"
  python3 - "$UI" "$TMP/ui-final.js" <<'PY'
import pathlib,sys
ui=pathlib.Path(sys.argv[1]); addon=pathlib.Path(sys.argv[2]).read_text(); h=ui.read_text()
if '2026.08.20.6.9.1-wsl-path-centric-analysis' not in h:
    marker='</body></html>'
    if marker not in h: raise SystemExit('UI body marker missing')
    h=h.replace(marker,'<script>\n'+addon+'\n</script>\n'+marker,1)
    ui.write_text(h)
PY
  grep -q "$BUILD" "$UI"
  grep -q 'Recall / edit existing project' "$UI"
  grep -q 'Add current path' "$UI"
  echo 'UI repaired.'
fi

echo '=== DATABASE ==='
curl -fsS http://127.0.0.1:18080/api/sot/db/info -o "$TMP/db.json"
python3 - "$TMP/db.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not x.get('integrity',{}).get('ok'): raise SystemExit('DB integrity failed: '+repr(x))
print('DB integrity OK')
PY
DB="$HOME/.openclaw/sot/sot.sqlite"
for t in volume_observations path_catalog project_paths file_catalog file_observations file_hash_cache file_locator_cache explorer_index explorer_entries; do
  sqlite3 "$DB" "SELECT name FROM sqlite_master WHERE type='table' AND name='$t';" | grep -qx "$t"
done
echo '6.9.1 schema OK'

echo '=== PATH IDENTITY ==='
curl -fsS 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc' -o "$TMP/id1.json"
curl -fsS 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc' -o "$TMP/id2.json"
python3 - "$TMP/id1.json" "$TMP/id2.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));y=json.load(open(sys.argv[2]))
if not x.get('path_id') or x.get('path_id')!=y.get('path_id') or x.get('volume_id')!=y.get('volume_id'): raise SystemExit('identity stability failed')
print('stable path_id=',x['path_id'],'volume_id=',x['volume_id'])
PY

echo '=== RECYCLE BIN REJECTION ==='
code="$(curl -sS -o "$TMP/recycle.json" -w '%{http_code}' 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc%2F%24RECYCLE.BIN')"
[[ "$code" == "400" ]]
grep -qi 'cannot be added' "$TMP/recycle.json"
echo '$RECYCLE.BIN rejected correctly'

echo '=== PROJECT/PATH/ANALYSIS ROUTES ==='
curl -fsS http://127.0.0.1:18080/api/sot/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" <<'PY'
import json,sys,subprocess,urllib.parse
x=json.load(open(sys.argv[1])); ps=x if isinstance(x,list) else x.get('projects',[])
if not ps:
    print('No projects yet; project-specific route probes skipped')
    raise SystemExit(0)
t=ps[0].get('project_token')
for suffix,key in [('/paths','paths'),('/analysis','project_token')]:
    u='http://127.0.0.1:18080/api/sot/projects/'+urllib.parse.quote(t,safe='')+suffix
    y=json.loads(subprocess.check_output(['curl','-fsS',u],text=True))
    if key not in y: raise SystemExit('route failed '+suffix+': '+repr(y))
print('project paths + analysis routes OK')
PY

echo '=== EXPLORER INDEX ROUTE ==='
curl -fsS 'http://127.0.0.1:18080/api/sot/explorer/index/status?path=%2Fmnt%2Fc' -o "$TMP/index.json"
python3 - "$TMP/index.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if 'state' not in x: raise SystemExit('explorer index status shape failed')
print('explorer state:',x['state'])
PY

echo '=== PUBLIC UI ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260820-691"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$BUILD" "$TMP/public.html"
grep -q 'Recall / edit existing project' "$TMP/public.html"
grep -q 'Add current path' "$TMP/public.html"
echo 'Public UI marker OK'

echo '=== 6.9.1 VERIFIED ==='
echo "Backend/UI: $BUILD"
echo "URL: $PUBLIC"
