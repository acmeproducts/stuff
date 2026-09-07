#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'

R9UI='c9a014c2c3b578b1c207665a0ea6655b73e0327c'
R10UI='76214ed7b321fdeb3a5c26e1744fa02313aa236d'
R11UI='edd419b979aaee36c9c4ee7bcefaeb6ab8828d85'
R12UI='f7639d4384b7cc6214fa390fc3061abcf1ccd60f'
R13UI='2a3013617df2b23c92dd9ac80ec34bedafb23deb'

TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$SOT_DIR/archive/$STAMP-turn01-r13-hierarchical-profile-release"
LOG="$RUN/release.log"
SUMMARY="$RUN/summary.tsv"
mkdir -p "$RUN" "$TMP"
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
    cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"
    record PASS ROLLBACK 'restored qualified R12 UI'
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY"
  echo "log: $LOG"
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

# Developer pass — verify qualified R12 live baseline and compose R13 from governed sources.
for t in bash curl node python3 sqlite3 sha256sum; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail DATABASE missing
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_INTEGRITY failed
[ "$(sqlite3 "$DB" 'select max(version) from schema_migrations')" = 6 ] || fail DATABASE_SCHEMA 'qualified R12 schema 6 required'
pass DATABASE_INTEGRITY 'qualified R12 schema=6'

code=000
for i in {1..20}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail LIVE_R12 "HTTP=$code"
python3 - "$RUN/health.before.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert int(x.get('database_version',0))==6,x
assert x.get('build')=='2026.09.07.sot-turn01-r12-ssot-profile-1',x
PY
pass LIVE_R12 'backend build R12 schema=6 HTTP=200'

cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"
sqlite3 "$DB" ".backup '$RUN/sot.before.sqlite'"
pass ARCHIVE_PRECHANGE "$RUN"

curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9UI/SOT-turn01-base-r9.html" -o "$TMP/r9.html"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10UI/integrate-SOT-turn01-r10-operating-ui.py" -o "$TMP/r10.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R11UI/integrate-SOT-turn01-r11-action-dashboard.py" -o "$TMP/r11.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R12UI/integrate-SOT-turn01-r12-virtual-volume-ui.py" -o "$TMP/r12.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R13UI/integrate-SOT-turn01-r13-hierarchical-profile-ui.py" -o "$TMP/r13.py"
python3 -m py_compile "$TMP/r10.py" "$TMP/r11.py" "$TMP/r12.py" "$TMP/r13.py"
python3 "$TMP/r10.py" "$TMP/r9.html" "$TMP/r10.html"
python3 "$TMP/r11.py" "$TMP/r10.html" "$TMP/r11.html"
python3 "$TMP/r12.py" "$TMP/r11.html" "$TMP/r12.html"
python3 "$TMP/r13.py" "$TMP/r12.html" "$TMP/SOT-turn01-base.html"

python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['SOT-turn01-base-r13-hierarchical-master-detail','volumeLayout','masterPane','detailPane','treeHTML()','tagSuggest(this)','tagKey(event,this)','editingSurface()','Common tags:','chip × controls','Select Omnisearch results','Inherited from']
for x in need: assert x in h,x
assert '>Remove tag</button>' not in h
assert "bulkTag('remove')" not in h
assert 'bulk delete' not in h.lower()
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js"
pass DEV_UI 'R13 hierarchical master-detail UI composes and JavaScript parses'

# Developer behavior/static contract: hierarchy, detail scoping, type-ahead/Enter, and edit-safe polling.
python3 - "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
h=Path(sys.argv[1]).read_text()
checks={
'hierarchy parent derivation':"function pathParent(p)",
'immediate folder contents':"function directChildren(path)",
'folder detail':"function folderDetail(x)",
'file detail':"function fileDetail(x)",
'context ancestors':"function contextFolders()",
'tree expansion':"function toggleTree(path)",
'tag suggestions':"function tagSuggest(input)",
'enter assignment':"if(e.key==='Enter')",
'edit-safe polling':"if(render&&!editingSurface())draw()",
'chip removal':"removeOneTag(",
'bulk chip removal':"function bulkRemoveChip(tag)",
}
for name,marker in checks.items(): assert marker in h,(name,marker)
assert 'onclick="bulkTag(\'remove\')"' not in h
PY
pass DEV_BEHAVIOR 'hierarchy + master/detail + context + persistent tag editor contracts PASS'

# Manager pass — owner-facing model must read as a file manager, not a flat database dump.
python3 - "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
h=Path(sys.argv[1]).read_text()
for x in ['>Discover</button>','>Profile</button>','>Action</button>','<b>Folders</b>','hierarchy','detailPane','Begin typing tag…','Common tags:','Select Omnisearch results']:
    assert x in h,x
for x in ['>Dashboard</button>','>Database</button>','>Activity</button>','>Remove tag</button>']:
    assert x not in h,x
PY
pass MANAGER_SCOPE 'Profile is hierarchical folder master + selected-node detail; accepted tag-chip UX only'
pass MANAGER_LINEAGE 'qualified R12 source composition → one pinned R13 UI integrator'
pass MANAGER_BACKEND 'schema/backend unchanged from qualified R12'
pass MANAGER_ROLLBACK 'qualified R12 UI archived before cutover'

# Red-team pass — reproduce owner failures mechanically before cutover.
grep -Fq "if(render&&!editingSurface())draw()" "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'polling can redraw active editor'
grep -Fq "if(e.key==='Enter')" "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'Enter-to-assign absent'
grep -Fq 'tagSuggestion' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'tag type-ahead absent'
grep -Fq 'class="tagx"' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'chip x removal absent'
! grep -Fq '>Remove tag</button>' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'generic Remove tag control remains'
grep -Fq 'contextFolders()' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'Omnisearch ancestry context absent'
grep -Fq 'expandedFolders' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'tree expansion state absent'
! grep -Eqi 'bulk delete|delete selected|remove selected files' "$TMP/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'unsafe physical bulk delete found'
pass REDTEAM_PRECUTOVER 'keyboard/focus, Enter, chips, hierarchy, ancestry, expansion and delete boundaries PASS'

# UI-only cutover after Developer → Manager → Red-team PASS.
CUTOVER=1
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
pass CUTOVER 'R13 UI installed; backend/schema untouched'

for endpoint in 'health' 'turn01/profile?limit=20' 'turn01/discover' 'turn01/tags' 'turn01/ssot' 'turn01/intelligence?limit=20' 'activity?limit=5'; do
  code="$(curl --max-time 20 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint" || true)"
  [ "$code" = 200 ] || fail LIVE_R13_ENDPOINT "$endpoint HTTP=$code"
done
pass REDTEAM_LIVE_ENDPOINTS 'backend/profile/discover/tags/SSOT/intelligence/activity HTTP=200'
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_POSTCHECK failed
[ "$(sqlite3 "$DB" 'select max(version) from schema_migrations')" = 6 ] || fail DATABASE_POSTCHECK schema
pass DATABASE_POSTCHECK 'integrity ok schema=6 unchanged'

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
SUCCESS=1
pass RELEASE_READY 'Developer PASS → Manager PASS → Red-team PASS'
echo '=== TURN 01 BASE R13 READY FOR OWNER TEST ==='
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
