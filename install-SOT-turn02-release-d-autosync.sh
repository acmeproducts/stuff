#!/usr/bin/env bash
set -Eeuo pipefail
REF="8052cb85906d1e1971f0e3c2b22ae3626a92c036"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF/SOT"
ROOT="$HOME/.sot-turn02/release-d/SOT"
UNIT="$HOME/.config/systemd/user/sot-turn02-release-d.service"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$ROOT" "$HOME/.config/systemd/user"
for f in sot-turn02-release-d-autosync.py sot-turn02-release-d.service qualify-release-d-autosync.py sot-turn02-release-d-source-actions.html sot-turn02-release-d-complete.html; do curl -fsSL "$BASE/$f" -o "$TMP/$f"; done
python3 -m py_compile "$TMP/sot-turn02-release-d-autosync.py" "$TMP/qualify-release-d-autosync.py"
python3 "$TMP/qualify-release-d-autosync.py"
python3 - "$TMP/sot-turn02-release-d-complete.html" "$TMP/complete.js" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
js=s.split("<script>",1)[1].split("</script>",1)[0]
Path(sys.argv[2]).write_text(js)
PY
node --check "$TMP/complete.js"
install -m 0644 "$TMP/sot-turn02-release-d-autosync.py" "$ROOT/sot-turn02-release-d-autosync.py"
install -m 0644 "$TMP/qualify-release-d-autosync.py" "$ROOT/qualify-release-d-autosync.py"
install -m 0644 "$TMP/sot-turn02-release-d-source-actions.html" "$ROOT/sot-turn02-release-d-source-actions.html"
install -m 0644 "$TMP/sot-turn02-release-d-complete.html" "$ROOT/sot-turn02-release-d-complete.html"
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
curl -fsS 'http://127.0.0.1:8765/api/diagnostics/log?limit=5' >"$TMP/log.json"
python3 - "$TMP/log.json" <<'PY'
import json,sys
z=json.load(open(sys.argv[1]));assert z.get('ok') and isinstance(z.get('lines'),list) and isinstance(z.get('publish'),dict),z
print('PASS Config Log / Activity runtime endpoint')
PY
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
python3 - <<'PY'
import json,urllib.parse,urllib.request
after=0
count=0
total=None
revision=None
while True:
    q=urllib.parse.urlencode({'after':after,'limit':5000})
    with urllib.request.urlopen('http://127.0.0.1:8765/api/placements/page?'+q,timeout=30) as r:
        z=json.load(r)
    assert z.get('ok'),z
    if revision is None:revision=z.get('catalog_revision')
    assert z.get('catalog_revision')==revision,(revision,z.get('catalog_revision'))
    total=int(z.get('total',0))
    rows=z.get('placements',[])
    count+=len(rows)
    if not z.get('has_more'):break
    nxt=int(z.get('next_after',0))
    assert nxt>after,(after,nxt)
    after=nxt
assert count==total,(count,total)
print(f'PASS complete live placement delivery rows={count}')
PY
curl -fsS http://127.0.0.1:8765/api/plan >/dev/null
echo "PASS complete live Plan endpoint"
echo "PASS Queue/Sources owner workflow replaced by continuous SSOT"
echo "TEST https://acmeproducts.github.io/stuff/SOT/sot-turn02-release-d-complete.html?v=$REF&api=https%3A%2F%2Foc-ref.fell-dojo.ts.net%2Fsot"
