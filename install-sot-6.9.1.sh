#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
UI="$ROOT/SOT/project.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BASE_BACKEND=2026.08.19.6.8-wsl-multiproject-reporting
BUILD=2026.08.20.6.9.1-wsl-path-centric-analysis
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/pre-health.json"
python3 - "$TMP/pre-health.json" "$BASE_BACKEND" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]:
    raise SystemExit('Refusing 6.9.1: live backend is not accepted 6.8: '+repr(x))
print('Base backend verified:',x['build'])
PY

echo '=== DOWNLOAD + OFFLINE GATES ==='
for f in sot-backend-6.9-path-centric-addon.js sot-backend-6.9.1-path-hardening-addon.js sot-ui-6.9.1-path-centric-final.js; do
  curl -fsSL "$BASE/$f" -o "$TMP/$f"
  node --check "$TMP/$f"
done

cp -a "$API" "$TMP/sot-api.candidate.js"
cp -a "$UI" "$TMP/project.candidate.html"
python3 - "$TMP/sot-api.candidate.js" "$TMP/project.candidate.html" "$TMP" <<'PY'
import pathlib,sys
api=pathlib.Path(sys.argv[1]);ui=pathlib.Path(sys.argv[2]);T=pathlib.Path(sys.argv[3])
s=api.read_text();h=ui.read_text()
if '2026.08.19.6.8-wsl-multiproject-reporting' not in s: raise SystemExit('backend base marker missing')
if '2026.08.20.6.9.1-wsl-path-centric-analysis' in s: raise SystemExit('6.9.1 backend already present')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
parts=[(T/'sot-backend-6.9-path-centric-addon.js').read_text(),(T/'sot-backend-6.9.1-path-hardening-addon.js').read_text()]
s=s.replace(marker,'\n'.join(parts)+'\n'+marker,1);api.write_text(s)
if '2026.08.20.6.9.1-wsl-path-centric-analysis' in h: raise SystemExit('6.9.1 UI already present')
marker='</body></html>'
if marker not in h: raise SystemExit('UI body marker missing')
h=h.replace(marker,'<script>\n'+(T/'sot-ui-6.9.1-path-centric-final.js').read_text()+'\n</script>\n'+marker,1);ui.write_text(h)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
python3 - "$TMP/project.candidate.html" "$TMP/project-scripts.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text();pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/project-scripts.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/project.candidate.html"
grep -q 'Add current path' "$TMP/project.candidate.html"
grep -q 'Recall / edit existing project' "$TMP/project.candidate.html"

echo '=== INSTALL ==='
STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-6.9.1-$STAMP"
UI_BAK="$UI.before-6.9.1-$STAMP"
cp -a "$API" "$API_BAK";cp -a "$UI" "$UI_BAK"
rollback(){
 echo '=== 6.9.1 GATE FAILED — RESTORE PRE-6.9.1 LIVE PAIR ===' >&2
 cp -a "$API_BAK" "$API" || true;cp -a "$UI_BAK" "$UI" || true
 sudo systemctl restart openclaw-report-server.service || true
 exit 1
}
trap rollback ERR
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/project.candidate.html" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..15}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists():raise SystemExit('no health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]:raise SystemExit('wrong build: '+repr(x))
need={'path-centric-projects','global-hash-reuse','volume-relative-hash-reuse','progressive-explorer-index','impact-analysis','global-multi-project-scheduler'}
if not need.issubset(set(x.get('capabilities') or [])):raise SystemExit('capability gate failed: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo '=== DB SCHEMA + INTEGRITY ==='
curl -fsS http://127.0.0.1:18080/api/sot/db/info -o "$TMP/db.json"
python3 - "$TMP/db.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if not x.get('integrity',{}).get('ok'):raise SystemExit('DB integrity failed: '+repr(x))
PY
DB="$HOME/.openclaw/sot/sot.sqlite"
for t in volume_observations path_catalog project_paths file_catalog file_observations file_hash_cache file_locator_cache explorer_index explorer_entries; do
  sqlite3 "$DB" "SELECT name FROM sqlite_master WHERE type='table' AND name='$t';" | grep -qx "$t"
done

echo '=== PATH IDENTITY STABILITY ==='
curl -fsS 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc' -o "$TMP/id1.json"
curl -fsS 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc' -o "$TMP/id2.json"
python3 - "$TMP/id1.json" "$TMP/id2.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));y=json.load(open(sys.argv[2]))
if not x.get('path_id') or x.get('path_id')!=y.get('path_id') or x.get('volume_id')!=y.get('volume_id'):raise SystemExit('identity stability failed')
print('stable path_id=',x['path_id'],'volume_id=',x['volume_id'])
PY

echo '=== RECYCLE BIN NEGATIVE GATE ==='
code="$(curl -sS -o "$TMP/recycle.json" -w '%{http_code}' 'http://127.0.0.1:18080/api/sot/path/identity?path=%2Fmnt%2Fc%2F%24RECYCLE.BIN')"
[[ "$code" == "400" ]]
grep -qi 'cannot be added' "$TMP/recycle.json"

echo '=== PROJECT PATH + ANALYSIS ROUTES ==='
curl -fsS http://127.0.0.1:18080/api/sot/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" <<'PY'
import json,sys,subprocess,urllib.parse
x=json.load(open(sys.argv[1]));ps=x if isinstance(x,list) else x.get('projects',[])
if not ps: print('No projects: route mutation skipped');raise SystemExit(0)
t=ps[0].get('project_token');
for suffix,key in [('/paths','paths'),('/analysis','project_token')]:
 u='http://127.0.0.1:18080/api/sot/projects/'+urllib.parse.quote(t,safe='')+suffix
 y=json.loads(subprocess.check_output(['curl','-fsS',u],text=True))
 if key not in y:raise SystemExit('route shape failed '+suffix+': '+repr(y))
print('project path recall + read-only analysis routes OK')
PY

echo '=== EXPLORER STATUS ROUTE ==='
curl -fsS 'http://127.0.0.1:18080/api/sot/explorer/index/status?path=%2Fmnt%2Fc' -o "$TMP/index.json"
python3 - "$TMP/index.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));
if 'state' not in x:raise SystemExit('explorer index status shape failed')
print('explorer state:',x['state'])
PY

echo '=== PUBLIC UI ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/project.html?v=20260820-691"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$BUILD" "$TMP/public.html"
grep -q 'Add current path' "$TMP/public.html"
grep -q 'Recall / edit existing project' "$TMP/public.html"

echo '=== SUCCESS ==='
echo "Backend/UI: $BUILD"
echo 'Project model: recallable/editable path collections'
echo 'Identity: stable-volume + volume-relative path + metadata/content signatures'
echo 'Reuse: project-independent and overlapping-path aware'
echo 'Reporting: Project -> Path -> File SOT Database Explorer'
echo 'Analysis: read-only duplicate/reclaim/copy/target-space assessment'
echo "URL: $PUBLIC"
trap - ERR
