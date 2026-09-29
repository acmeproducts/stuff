#!/usr/bin/env bash
set -Eeuo pipefail
REF="46c8fdbc70acbb3c769216ff38c7048bde2290a7"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF/SOT"
ROOT="$HOME/.sot-turn02/release-d/SOT"
UNIT="$HOME/.config/systemd/user/sot-turn02-release-d.service"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$ROOT" "$HOME/.config/systemd/user"
for f in sot-turn02-release-d-autosync.py sot-turn02-release-d.service qualify-release-d-autosync.py sot-turn02-release-d-source-actions.html; do curl -fsSL "$BASE/$f" -o "$TMP/$f"; done
python3 -m py_compile "$TMP/sot-turn02-release-d-autosync.py" "$TMP/qualify-release-d-autosync.py"
python3 "$TMP/qualify-release-d-autosync.py"
install -m 0644 "$TMP/sot-turn02-release-d-autosync.py" "$ROOT/sot-turn02-release-d-autosync.py"
install -m 0644 "$TMP/qualify-release-d-autosync.py" "$ROOT/qualify-release-d-autosync.py"
install -m 0644 "$TMP/sot-turn02-release-d-source-actions.html" "$ROOT/sot-turn02-release-d-source-actions.html"
install -m 0644 "$TMP/sot-turn02-release-d.service" "$UNIT"
systemctl --user daemon-reload
systemctl --user restart sot-turn02-release-d.service
for _ in $(seq 1 60); do curl -fsS --max-time 2 http://127.0.0.1:8765/api/health >"$TMP/health.json" 2>/dev/null && break; sleep .5; done
python3 - "$TMP/health.json" <<'PY'
import json,sys
h=json.load(open(sys.argv[1]));assert h.get('ok') and h.get('version')=='turn02-release-d' and h.get('schema')==14,h
print('PASS continuous SSOT runtime healthy')
PY
systemctl --user show sot-turn02-release-d.service -p ExecStart --value | grep -q 'sot-turn02-release-d-autosync.py'
sleep 1
curl -fsS http://127.0.0.1:8765/api/jobs >"$TMP/jobs.json"
curl -fsS http://127.0.0.1:8765/api/sources >"$TMP/sources.json"
python3 - "$TMP/jobs.json" "$TMP/sources.json" <<'PY'
import json,sys
jobs=json.load(open(sys.argv[1])).get('jobs',[])
sources=json.load(open(sys.argv[2])).get('sources',[])
live=set()
for z in jobs:
    j=z.get('job',z)
    raw=str(j.get('state','')).upper()
    effective=str(j.get('effective_state') or raw).upper()
    if raw in {'QUEUED','RUNNING','PAUSED','STOPPING'} or effective in {'QUEUED','RUNNING','PAUSED','STOPPING'}:
        live.update(str(x.get('source_id')) for x in z.get('scope_sources',[]) if x.get('source_id'))
needs=[]
for s in sources:
    if s.get('soft_deleted') or not s.get('enabled',1):
        continue
    state=str(s.get('analysis_state') or '').upper()
    if s.get('pending') or state in {'READY','STALE','RETRY'}:
        needs.append(str(s.get('source_id')))
uncovered=[x for x in needs if x not in live]
assert not uncovered,{'uncovered_registered_sources':uncovered,'live_source_ids':sorted(live)}
print('PASS stale/pending registered sources are covered by automatic live work')
PY
echo "PASS Queue/Sources owner workflow replaced by continuous SSOT"
echo "TEST https://acmeproducts.github.io/stuff/SOT/sot-turn02-release-d-source-actions.html?v=$REF&api=https%3A%2F%2Foc-ref.fell-dojo.ts.net%2Fsot"
