#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
SOT="$ROOT/SOT"
UI="$SOT/sot-turn01-pre-base.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BUILD=2026.08.21.turn01-pre-base
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/pre-health.json"
python3 - "$TMP/pre-health.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('status')!='ok': raise SystemExit('SOT backend not healthy: '+repr(x))
print('Current backend:',x.get('build'))
PY

echo '=== DOWNLOAD + OFFLINE GATES ==='
curl -fsSL "$BASE/sot-backend-turn01-prebase-addon.js" -o "$TMP/addon.js"
curl -fsSL "$BASE/sot-turn01-pre-base.html" -o "$TMP/turn01.html"
node --check "$TMP/addon.js"
python3 - "$TMP/turn01.html" "$TMP/ui.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text()
js='\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I))
pathlib.Path(sys.argv[2]).write_text(js)
if '2026.08.21.turn01-pre-base' not in h: raise SystemExit('TURN01 build marker missing')
PY
node --check "$TMP/ui.js"

echo '=== BUILD CANDIDATE ==='
cp -a "$API" "$TMP/sot-api.candidate.js"
python3 - "$TMP/sot-api.candidate.js" "$TMP/addon.js" <<'PY'
import pathlib,sys
p=pathlib.Path(sys.argv[1]);addon=pathlib.Path(sys.argv[2]).read_text();s=p.read_text()
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
if 'TURN01_BUILD' not in s:
    if '2026.08.20.6.9.1-wsl-path-centric-analysis' not in s:
        raise SystemExit('TURN01 requires the verified 6.9.1 path-centric backend plumbing')
    s=s.replace(marker,addon+'\n'+marker,1)
p.write_text(s)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"

mkdir -p "$SOT"
STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-turn01-$STAMP"
cp -a "$API" "$API_BAK"
UI_BAK=""
if [[ -f "$UI" ]]; then UI_BAK="$UI.before-turn01-$STAMP"; cp -a "$UI" "$UI_BAK"; fi
rollback(){
  echo '=== TURN01 GATE FAILED — RESTORING ===' >&2
  cp -a "$API_BAK" "$API" || true
  if [[ -n "$UI_BAK" && -f "$UI_BAK" ]]; then cp -a "$UI_BAK" "$UI" || true; else rm -f "$UI" || true; fi
  sudo systemctl restart openclaw-report-server.service || true
  exit 1
}
trap rollback ERR
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/turn01.html" "$UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..20}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('no health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('wrong build: '+repr(x))
need={'global-multi-project-scheduler','turn01-minimum-evidence','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan','turn01-target-backup-disposition'}
if not need.issubset(set(x.get('capabilities') or [])): raise SystemExit('capability gate failed: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo '=== TURN01 DB GATES ==='
DB="$HOME/.openclaw/sot/sot.sqlite"
for t in turn01_observation_history turn01_target_holdings turn01_backup_holdings turn01_transfer_events turn01_source_dispositions; do
  sqlite3 "$DB" "SELECT name FROM sqlite_master WHERE type='table' AND name='$t';" | grep -qx "$t"
done
sqlite3 "$DB" "PRAGMA table_info(file_observations);" | grep -q 'path_hash'
sqlite3 "$DB" "PRAGMA table_info(file_observations);" | grep -q 'observation_hash'

echo '=== API VALUE GATES ==='
curl -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"
curl -fsS http://127.0.0.1:18080/api/sot/turn01/intelligence -o "$TMP/intel.json"
curl -fsS 'http://127.0.0.1:18080/api/sot/turn01/query?limit=5' -o "$TMP/query.json"
curl -fsS http://127.0.0.1:18080/api/sot/scheduler/status -o "$TMP/scheduler.json"
python3 - "$TMP/projects.json" "$TMP/intel.json" "$TMP/query.json" "$TMP/scheduler.json" <<'PY'
import json,sys
p,i,q,s=[json.load(open(x)) for x in sys.argv[1:]]
if 'projects' not in p: raise SystemExit('projects route shape failed')
for k in ['observations','bytes','unique_content','duplicate_bytes','target_missing_bytes','backup_missing_bytes']:
    if k not in i: raise SystemExit('intelligence missing '+k)
if 'rows' not in q: raise SystemExit('query route shape failed')
if s.get('worker_pool')!=4 or len(s.get('workers') or [])!=4: raise SystemExit('scheduler shape failed')
print('projects:',len(p['projects']),'observations:',i['observations'],'unique:',i['unique_content'])
PY

curl -fsS -X POST -H 'Content-Type: application/json' -d '{"limit":5000}' http://127.0.0.1:18080/api/sot/turn01/backfill -o "$TMP/backfill.json"
python3 - "$TMP/backfill.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));print('observation backfill updated:',x.get('updated',0),'remaining:',x.get('remaining',0))
PY

echo '=== PROJECT PLAN ROUTE GATE ==='
python3 - "$TMP/projects.json" <<'PY' > "$TMP/token.txt"
import json,sys
x=json.load(open(sys.argv[1]));ps=x.get('projects') or []
print(ps[0].get('project_token','') if ps else '')
PY
TOKEN="$(cat "$TMP/token.txt")"
if [[ -n "$TOKEN" ]]; then
  Q="$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$TOKEN")"
  curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$Q/sources" -o "$TMP/sources.json"
  curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$Q/plan" -o "$TMP/plan.json"
  python3 - "$TMP/sources.json" "$TMP/plan.json" <<'PY'
import json,sys
s,p=json.load(open(sys.argv[1])),json.load(open(sys.argv[2]))
if 'sources' not in s or 'totals' not in p or 'items' not in p: raise SystemExit('project TURN01 route gate failed')
PY
fi

echo '=== PUBLIC UI GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-pre-base.html?v=20260821-turn01"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q "$BUILD" "$TMP/public.html"
grep -q 'Dynamic execution plan' "$TMP/public.html"
grep -q 'Record lifecycle evidence' "$TMP/public.html"

echo '=== TURN01 PRE-BASE INSTALLED ==='
echo "Backend/UI build: $BUILD"
echo 'Existing project.html was not replaced.'
echo 'TURN01: Project CRUD + hierarchy + global scheduler + central corpus + realtime intelligence + ad hoc query + dynamic plan + lifecycle evidence'
echo "URL: $PUBLIC"
trap - ERR
