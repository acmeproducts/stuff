#!/usr/bin/env bash
set -euo pipefail
ROOT=/home/support/.openclaw/workspace/https/report
API="$ROOT/sot-api.js"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
cd "$ROOT"

systemctl is-active --quiet openclaw-report-server.service
curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/pre.json"
python3 - "$TMP/pre.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
if x.get('build')!='2026.08.18.6.7.4-wsl-real-mount':
    raise SystemExit('Expected live 6.7.4; refusing to alter unknown build: '+repr(x.get('build')))
PY

BAK="$(ls -1t "$API".before-6.7.4-* 2>/dev/null | head -1 || true)"
if [[ -z "$BAK" ]]; then echo 'FAIL: pre-6.7.4 backend backup not found.' >&2; exit 1; fi
grep -q '2026.08.18.6.7.3-wsl-mount-safe' "$BAK"
cp -a "$API" "$API.before-rollback-from-6.7.4-$(date +%Y%m%d-%H%M%S)"
cp -a "$BAK" "$API"
sudo systemctl restart openclaw-report-server.service
for i in {1..12}; do sleep 1; curl -fsS http://127.0.0.1:18080/api/sot/health -o "$TMP/post.json" 2>/dev/null && break; done
python3 - "$TMP/post.json" <<'PY'
import json,sys,pathlib
p=pathlib.Path(sys.argv[1]);
if not p.exists(): raise SystemExit('No health after rollback')
x=json.load(open(p))
if x.get('status')!='ok' or x.get('build')!='2026.08.18.6.7.3-wsl-mount-safe':
    raise SystemExit('Rollback failed: '+repr(x))
print('SUCCESS: rolled back to',x['build'])
PY
