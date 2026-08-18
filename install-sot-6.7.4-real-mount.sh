#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
UI="$ROOT/SOT/project.html"
API="$ROOT/sot-api.js"
BASE=https://raw.githubusercontent.com/acmeproducts/stuff/main
BUILD=2026.08.18.6.7.4-wsl-real-mount
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/prehealth.json"

curl -fsSL "$BASE/sot-backend-6.7.4-real-mount-addon.js" -o "$TMP/addon.js"
node --check "$TMP/addon.js"

cp -a "$API" "$TMP/sot-api.candidate.js"
API_CAND="$TMP/sot-api.candidate.js" ADDON="$TMP/addon.js" python3 - <<'PY'
import os,pathlib
api=pathlib.Path(os.environ['API_CAND']); addon=pathlib.Path(os.environ['ADDON']).read_text(); s=api.read_text()
if '2026.08.18.6.7.3-wsl-mount-safe' not in s: raise SystemExit('Expected live 6.7.3 backend; refusing to patch unknown base')
marker='module.exports={handle,VERSION,BUILD};'
if marker not in s: raise SystemExit('Backend export marker missing')
if 'REAL_MOUNT_BUILD' not in s:s=s.replace(marker,addon+'\n'+marker,1)
api.write_text(s)
PY
node --check "$TMP/sot-api.candidate.js"
node -e "require(process.argv[1]); console.log('candidate require OK')" "$TMP/sot-api.candidate.js"
grep -q "$BUILD" "$TMP/sot-api.candidate.js"

STAMP="$(date +%Y%m%d-%H%M%S)"
API_BAK="$API.before-6.7.4-$STAMP"
cp -a "$API" "$API_BAK"
rollback(){
  echo '=== 6.7.4 GATE FAILED — ROLLBACK ===' >&2
  cp -a "$API_BAK" "$API"
  sudo systemctl restart openclaw-report-server.service || true
  exit 1
}
trap rollback ERR

cp -a "$TMP/sot-api.candidate.js" "$API"
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do sleep 1; if curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/health.json" 2>/dev/null; then break; fi; done
python3 - "$TMP/health.json" "$BUILD" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1])
if not p.exists(): raise SystemExit('No health response')
x=json.loads(p.read_text())
if x.get('status')!='ok' or x.get('build')!=sys.argv[2]: raise SystemExit('Wrong build: '+repr(x))
print(json.dumps(x,indent=2))
PY

curl -fsS 'http://127.0.0.1:18080/api/sot/fs?path=/' -o "$TMP/roots.json"
python3 - "$TMP/roots.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); loc=x.get('locations',[])
print(json.dumps(loc,indent=2))
for r in loc:
    p=r.get('path','')
    if p.startswith('/mnt/') and len(p)==6 and not r.get('mounted',True): raise SystemExit('Advertised unmounted root: '+p)
PY

python3 - "$TMP/roots.json" > "$TMP/paths.txt" <<'PY'
import json,sys
for r in json.load(open(sys.argv[1])).get('locations',[]):
    p=r.get('path','')
    if p.startswith('/mnt/') and len(p)==6 and r.get('available'): print(p)
PY
while read -r p; do
  [[ -z "$p" ]] && continue
  enc=$(python3 -c 'import sys,urllib.parse;print(urllib.parse.quote(sys.argv[1]))' "$p")
  curl -fsS "http://127.0.0.1:18080/api/sot/fs?path=$enc" -o "$TMP/root.json"
  python3 - "$TMP/root.json" "$p" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); p=sys.argv[2]
if 'folders' not in x or 'files' not in x: raise SystemExit('Bad browse payload for '+p)
print(p, 'folders=',len(x['folders']),'files=',len(x['files']))
PY
done < "$TMP/paths.txt"

echo '=== SUCCESS ==='
echo "Backend: $BUILD"
echo 'UI unchanged'
echo 'Only actual WSL-mounted drive roots are now advertised.'
trap - ERR
