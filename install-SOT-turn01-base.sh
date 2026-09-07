#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
SERVICE="openclaw-report-server.service"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2'
EXPECTED_SCHEMA=5
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'
R8I='d1b397902e6dce35e620b36ee0454ed666adb74d'
R9I='9c94559e70243adf3b7e87e1a10c98fe1602f174'
R9UI='c9a014c2c3b578b1c207665a0ea6655b73e0327c'
R10I='2a29e486d036178cbc677535f9a6aa3daafaf907'
R10UI='76214ed7b321fdeb3a5c26e1744fa02313aa236d'
R11UI='edd419b979aaee36c9c4ee7bcefaeb6ab8828d85'

TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$SOT_DIR/archive/$STAMP-turn01-r11-action-release"
LOG="$RUN/release.log"
SUMMARY="$RUN/summary.tsv"
mkdir -p "$RUN" "$TMP/sot-db/migrations"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

CUTOVER=0
SUCCESS=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){
  rc=$?
  set +e
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"
    cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    record PASS ROLLBACK 'restored previous backend and UI'
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY"
  echo "log: $LOG"
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

# Developer pass: environment, database, current live baseline, clean candidate composition.
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail DATABASE missing
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_INTEGRITY failed
SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')"
[ "$SCHEMA" = "$EXPECTED_SCHEMA" ] || fail DATABASE_SCHEMA "expected=$EXPECTED_SCHEMA actual=$SCHEMA"
pass DATABASE_INTEGRITY "schema=$SCHEMA"

code=000
for i in {1..20}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail LIVE_BACKEND "HTTP=$code"
python3 - "$RUN/health.before.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('build')==sys.argv[2],x
assert int(x.get('database_version',0))==5,x
for c in ['durable-project-coordination','stale-operation-rejection','atomic-evidence-cutover','concurrent-project-indexing']:
    assert c in x.get('capabilities',[]),(c,x)
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=5"

cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"
cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"
pass ARCHIVE_PRECHANGE "$RUN"
cp "$REPORT_ROOT/sot-api.js" "$TMP/sot-api.js"
for m in "$REPORT_ROOT"/sot-db/migrations/*.sql; do cp "$m" "$TMP/sot-db/migrations/"; done

if ! grep -q 'function ssotReconciliation()' "$TMP/sot-api.js"; then
  curl --retry 5 --retry-all-errors -fsSL "$RAW/$R8I/integrate-SOT-turn01-r8-ssot.py" -o "$TMP/r8.py"
  python3 -m py_compile "$TMP/r8.py"
  python3 "$TMP/r8.py" "$TMP/sot-api.js"
fi
if ! grep -q 'function ssotCatalog(' "$TMP/sot-api.js"; then
  curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9I/integrate-SOT-turn01-r9-catalog.py" -o "$TMP/r9.py"
  python3 -m py_compile "$TMP/r9.py"
  python3 "$TMP/r9.py" "$TMP/sot-api.js"
fi
if ! grep -q 'function storageIntelligence(' "$TMP/sot-api.js"; then
  curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10I/integrate-SOT-turn01-r10-intelligence.py" -o "$TMP/r10i.py"
  python3 -m py_compile "$TMP/r10i.py"
  python3 "$TMP/r10i.py" "$TMP/sot-api.js"
fi
node --check "$TMP/sot-api.js"
pass DEV_BACKEND 'qualified live backend preserved; R8/R9/R10 capabilities present'

curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9UI/SOT-turn01-base-r9.html" -o "$TMP/r9.html"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10UI/integrate-SOT-turn01-r10-operating-ui.py" -o "$TMP/r10ui.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R11UI/integrate-SOT-turn01-r11-action-dashboard.py" -o "$TMP/r11ui.py"
python3 -m py_compile "$TMP/r10ui.py" "$TMP/r11ui.py"
python3 "$TMP/r10ui.py" "$TMP/r9.html" "$TMP/r10.html"
python3 "$TMP/r11ui.py" "$TMP/r10.html" "$TMP/SOT-turn01-base.html"
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['SOT-turn01-base-r11-action-first-cleanup','Cleanup & protection progress','Safe / certified-ready','Remaining','Next actions','tap for next step','boundedEvidence','Progress, safety, and the one action','openProjectDetail','This project has not been indexed yet.','Start scan','Protect / verify','Review certification','Sources / Target / Backup','/turn01/intelligence','AI analysis','OpenRouter','Venice','Database','Activity','Deep dive','fingerprint/pause','fingerprint/resume','fingerprint/stop']
for x in need: assert x in h,x
for x in ['<h3>Largest duplicate groups</h3>${duplicateHTML(state.intel)}',"${sel?detailHTML(sel):''}"]:
    assert x not in h,x
assert '.boundedEvidence{max-height:' in h and 'overflow:auto' in h
assert "function detailHTML(p){return''}" in h
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js"
pass DEV_UI 'R11 action-first UI composes, contracts pass, JavaScript parses'

# Manager pass: one UI-only advance from qualified R10; operating hierarchy matches owner correction.
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
b=Path(sys.argv[1]).read_text(); h=Path(sys.argv[2]).read_text()
for x in ['function storageIntelligence(',"/api/sot/turn01/intelligence",'size*(copies-1)','Shared-project content and verified protection copies are not classified as disposable duplicates.']:
    assert x in b,x
for x in ['Cleanup & protection progress','Next actions','tap for next step','Duplicate evidence ·','boundedEvidence','Next action','Start scan','Protect / verify','Review certification','Sources / Target / Backup','OpenRouter','Venice']:
    assert x in h,x
assert '<h3>Largest duplicate groups</h3>${duplicateHTML(state.intel)}' not in h
assert "${sel?detailHTML(sel):''}" not in h
assert "function detailHTML(p){return''}" in h
PY
pass MANAGER_SCOPE 'R11 is a direct UI hierarchy correction; backend/schema/architecture unchanged'
pass MANAGER_LINEAGE 'qualified R9 source → pinned R10 integrator → pinned R11 integrator'
pass MANAGER_ROLLBACK 'prechange backend/UI archived before cutover'

# Red-team pre-cutover: enforce action-first and progressive disclosure rules.
python3 - "$TMP/sot-api.js" "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
b=Path(sys.argv[1]).read_text(); h=Path(sys.argv[2]).read_text()
assert 'Shared-project content and verified protection copies are not classified as disposable duplicates.' in b
assert 'target_holdings' in b and 'backup_holdings' in b
assert 'This project has not been indexed yet.' in h
assert 'There is no cleanup, duplicate, or protection result to interpret until a scan commits fingerprint evidence.' in h
assert '<details id="globalEvidence" class="evidenceDrawer">' in h
assert 'max-height:330px;overflow:auto' in h
assert 'Start scan' in h and 'Protect / verify' in h and 'Review certification' in h
assert 'fingerprint/stop' in h and 'fingerprint/pause' in h and 'fingerprint/resume' in h
assert '<h3>Largest duplicate groups</h3>${duplicateHTML(state.intel)}' not in h
PY
pass REDTEAM_PRECUTOVER 'action routing, bounded evidence, unscanned truth, and safety controls present'

# Cut over once; every subsequent failure restores the archived qualified R10 live files.
sudo systemctl stop "$SERVICE"
CUTOVER=1
install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"
pass CUTOVER 'R11 action-first candidate installed'

code=000
for i in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail POST_HEALTH "HTTP=$code"
pass POST_HEALTH HTTP=200

for endpoint in 'turn01/ssot' 'turn01/intelligence?limit=100' 'turn01/catalog?view=content&limit=5' 'activity?limit=5' 'turn01/projects' 'turn01/volumes'; do
  code="$(curl --max-time 20 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint" || true)"
  [ "$code" = 200 ] || fail LIVE_R11_ENDPOINT "$endpoint HTTP=$code"
done
pass REDTEAM_LIVE_ENDPOINTS 'ssot + intelligence + catalog + activity + projects + volumes HTTP=200'

curl --max-time 20 -fsS 'http://127.0.0.1:18080/api/sot/turn01/intelligence?limit=100' -o "$RUN/intelligence.live.json"
python3 - "$RUN/intelligence.live.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('model')=='storage-intelligence-v1',x.get('model')
s=x.get('summary') or {}
for k in ['fingerprints','logical_bytes','duplicate_groups','duplicate_waste_bytes','shared_groups','shared_bytes']:
    assert k in s,k
    assert int(s[k] or 0)>=0,(k,s[k])
d=x.get('duplicate_groups'); r=x.get('risky_content'); recs=x.get('recommendations')
assert isinstance(d,list) and isinstance(r,list) and isinstance(recs,list)
for g in d:
    size=int(g.get('size') or 0); copies=int(g.get('copies') or 0); reclaim=int(g.get('reclaimable_bytes') or 0)
    assert copies>=2,g
    assert reclaim==size*(copies-1),(g,reclaim,size,copies)
    assert g.get('content_sha256') and g.get('locations'),g
for item in r:
    assert item.get('content_sha256'),item
    assert item.get('copy_a') is not None and item.get('copy_b') is not None,item
if int(s.get('duplicate_groups') or 0)>0: assert len(d)>0,'summary reports duplicate groups but list is empty'
assert len(recs)>0,'recommendations empty'
PY
pass REDTEAM_INTELLIGENCE 'live SSOT intelligence remains structurally and mathematically valid'

LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html" | awk '{print $1}')"
code=000
for i in {1..20}; do
  code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA" || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$RUN/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"
pass PUBLIC_IDENTITY "$PUBLIC_SHA"
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_POSTCHECK failed
pass DATABASE_POSTCHECK ok
SUCCESS=1
pass RELEASE_READY 'Developer PASS → Manager PASS → Red-team PASS'
echo '=== TURN 01 BASE R11 READY FOR OWNER TEST ==='
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
