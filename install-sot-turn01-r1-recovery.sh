#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
LIVE_UI="$ROOT/SOT/project.html"
OUT_UI="$ROOT/SOT/sot-turn01-pre-base.html"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BUILD=2026.08.22.turn01-r1-recovery
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
[[ -s "$LIVE_UI" ]] || { echo 'FAIL: proven live project.html is missing/empty' >&2; exit 1; }

# Reconstruct backend from the pre-TURN01 6.9.1 backup, never from the rejected TURN01 candidate.
BASE_API="$(ls -1t "$API".before-turn01-* 2>/dev/null | while read -r f; do grep -q '2026.08.20.6.9.1-wsl-path-centric-analysis' "$f" && { echo "$f"; break; }; done)"
[[ -n "$BASE_API" ]] || { echo 'FAIL: no verified pre-TURN01 6.9.1 backend backup found' >&2; exit 1; }
echo "Recovery base backend: $BASE_API"

echo '=== DOWNLOAD + OFFLINE GATES ==='
for f in sot-backend-turn01-prebase-addon.js sot-backend-turn01-r1-bridge-addon.js sot-ui-turn01-r1-recovery-addon.js; do
  curl -fsSL "$BASE/$f" -o "$TMP/$f"
done
node --check "$TMP/sot-backend-turn01-prebase-addon.js"
node --check "$TMP/sot-backend-turn01-r1-bridge-addon.js"
node --check "$TMP/sot-ui-turn01-r1-recovery-addon.js"

echo '=== RECONSTRUCT FROM VERIFIED 6.9.1 ==='
cp -a "$BASE_API" "$TMP/sot-api.candidate.js"
cp -a "$LIVE_UI" "$TMP/turn01-r1.html"
python3 - "$TMP/sot-api.candidate.js" "$TMP/sot-backend-turn01-prebase-addon.js" "$TMP/sot-backend-turn01-r1-bridge-addon.js" "$TMP/turn01-r1.html" "$TMP/sot-ui-turn01-r1-recovery-addon.js" <<'PY'
import pathlib,sys
api=pathlib.Path(sys.argv[1]); a1=pathlib.Path(sys.argv[2]).read_text(); a2=pathlib.Path(sys.argv[3]).read_text(); ui=pathlib.Path(sys.argv[4]); uia=pathlib.Path(sys.argv[5]).read_text()
s=api.read_text(); h=ui.read_text()
if '2026.08.20.6.9.1-wsl-path-centric-analysis' not in s: raise SystemExit('verified 6.9.1 marker missing from recovery base')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('backend export marker missing')
s=s.replace(marker,a1+'\n'+a2+'\n'+marker,1); api.write_text(s)
if '</body></html>' not in h: raise SystemExit('live project.html closing marker missing')
h=h.replace('</body></html>','<script>\n'+uia+'\n</script>\n</body></html>',1); ui.write_text(h)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
python3 - "$TMP/turn01-r1.html" "$TMP/ui.js" <<'PY'
import re,sys,pathlib
h=pathlib.Path(sys.argv[1]).read_text(); pathlib.Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
if 'TURN01 R1' not in h: raise SystemExit('TURN01 R1 UI marker missing')
PY
node --check "$TMP/ui.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"

echo '=== INSTALL RECOVERY CANDIDATE ==='
STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-turn01-r1-$STAMP"
OUT_BAK=""
cp -a "$API" "$API_BAK"
if [[ -f "$OUT_UI" ]]; then OUT_BAK="$OUT_UI.before-turn01-r1-$STAMP"; cp -a "$OUT_UI" "$OUT_BAK"; fi
rollback(){
  echo '=== TURN01 R1 GATE FAILED — RESTORING PRE-R1 LIVE STATE ===' >&2
  cp -a "$API_BAK" "$API" || true
  if [[ -n "$OUT_BAK" && -f "$OUT_BAK" ]]; then cp -a "$OUT_BAK" "$OUT_UI" || true; else rm -f "$OUT_UI" || true; fi
  sudo systemctl restart openclaw-report-server.service || true
  exit 1
}
trap rollback ERR
cp -a "$TMP/sot-api.candidate.js" "$API"
cp -a "$TMP/turn01-r1.html" "$OUT_UI"
sudo systemctl restart openclaw-report-server.service
for i in {1..20}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('no health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('wrong build: '+repr(x))
need={'global-multi-project-scheduler','turn01-existing-evidence-bridge','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan'}
if not need.issubset(set(x.get('capabilities') or [])): raise SystemExit('capability gate failed: '+repr(x))
print(json.dumps(x,indent=2))
PY

echo '=== BRIDGE EXISTING CORPUS EVIDENCE ==='
curl -fsS http://127.0.0.1:18080/api/sot/turn01/r1/evidence-status -o "$TMP/before.json"
curl -fsS -X POST -H 'Content-Type: application/json' -d '{"limit":200000}' http://127.0.0.1:18080/api/sot/turn01/r1/bridge -o "$TMP/bridge.json"
curl -fsS http://127.0.0.1:18080/api/sot/turn01/r1/evidence-status -o "$TMP/after.json"
python3 - "$TMP/before.json" "$TMP/bridge.json" "$TMP/after.json" <<'PY'
import json,sys
b,x,a=[json.load(open(p)) for p in sys.argv[1:]]
print('before:',{k:b.get(k) for k in ['projects','sources','manifests','inventory','observations']})
print('bridge:',x)
print('after:',{k:a.get(k) for k in ['projects','sources','manifests','inventory','observations','unique_observation_hashes']})
if a.get('projects',0)<1: raise SystemExit('FAIL: no projects visible')
if a.get('sources',0)<1: raise SystemExit('FAIL: no sources visible')
# If the old corpus already contains authoritative manifest hashes, TURN01 must expose real observations.
if b.get('manifests',0)>0 and a.get('observations',0)<1:
    raise SystemExit('FAIL: legacy manifests exist but TURN01 exposes zero observations')
PY

echo '=== REAL PROJECT EVIDENCE GATE ==='
curl -fsS http://127.0.0.1:18080/api/sot/turn01/projects -o "$TMP/projects.json"
python3 - "$TMP/projects.json" <<'PY' > "$TMP/token.txt"
import json,sys
ps=json.load(open(sys.argv[1])).get('projects') or []
print(ps[0]['project_token'] if ps else '')
PY
TOKEN="$(cat "$TMP/token.txt")"
[[ -n "$TOKEN" ]] || { echo 'FAIL: no real project token available' >&2; false; }
Q="$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1],safe=""))' "$TOKEN")"
curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$Q/sources" -o "$TMP/sources.json"
curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$Q/intelligence" -o "$TMP/intel.json"
curl -fsS "http://127.0.0.1:18080/api/sot/turn01/projects/$Q/plan" -o "$TMP/plan.json"
python3 - "$TMP/sources.json" "$TMP/intel.json" "$TMP/plan.json" <<'PY'
import json,sys
s,i,p=[json.load(open(x)) for x in sys.argv[1:]]
if not s.get('sources'): raise SystemExit('FAIL: selected real project exposes no source rows')
for k in ['observations','bytes','unique_content','duplicate_bytes','target_missing_bytes']:
    if k not in i: raise SystemExit('FAIL: intelligence missing '+k)
if 'totals' not in p or 'items' not in p: raise SystemExit('FAIL: plan route shape invalid')
print('project sources:',len(s['sources']),'observations:',i['observations'],'unique:',i['unique_content'],'plan items:',len(p['items']))
PY

echo '=== SCHEDULER GATE ==='
curl -fsS http://127.0.0.1:18080/api/sot/scheduler/status -o "$TMP/scheduler.json"
python3 - "$TMP/scheduler.json" <<'PY'
import json,sys
s=json.load(open(sys.argv[1]))
if s.get('worker_pool')!=4 or len(s.get('workers') or [])!=4: raise SystemExit('global scheduler gate failed')
print('global workers:',s['worker_pool'],'queue:',len(s.get('queue') or []))
PY

echo '=== PUBLIC UI GATE ==='
PUBLIC="https://oc-ref.fell-dojo.ts.net/report/SOT/sot-turn01-pre-base.html?v=20260822-r1"
curl -fsS "$PUBLIC" -o "$TMP/public.html"
grep -q 'TURN01 R1' "$TMP/public.html"
# Proven application must still be present underneath the R1 intelligence overlay.
grep -q 'SOT Project' "$TMP/public.html"

echo '=== TURN01 R1 RECOVERY INSTALLED ==='
echo "Backend: $BUILD"
echo 'UI base: current proven project.html + TURN01 R1 intelligence overlay'
echo 'Original project.html remains untouched.'
echo "URL: $PUBLIC"
trap - ERR
