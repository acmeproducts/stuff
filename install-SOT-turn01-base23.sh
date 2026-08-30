#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"; ARCHIVE_ROOT="$SOT_DIR/archive"; SERVICE=openclaw-report-server.service
EXPECTED_API_BUILD='2026.08.30.sot-turn01-base-22'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base23-qualification"
LOG="$QUAL_DIR/qualification.log"; SUMMARY="$QUAL_DIR/summary.tsv"; INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
HTML_BACKUP="$TMP/base.before.html"; HAD_HTML=0; CUTOVER=0; SUCCESS=0
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-42s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; return 1; }; info(){ record INFO "$1" "$2"; }
trap 'rc=$?; record FAIL UNHANDLED "rc=$rc line=$LINENO command=$BASH_COMMAND" || true' ERR
cleanup(){ local rc=$?; if [ "$CUTOVER" -eq 1 ]&&[ "$SUCCESS" -ne 1 ]&&[ "$HAD_HTML" -eq 1 ];then info ROLLBACK 'restoring pre-Base23 HTML';install -m0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"&&pass ROLLBACK_HTML restored||record FAIL ROLLBACK_HTML failed||true;fi;if [ "$SUCCESS" -eq 1 ];then record PASS FINAL 'all Base-23 UI mechanical gates passed';else record FAIL FINAL "qualification failed rc=$rc"||true;fi;echo '=== QUALIFICATION SUMMARY ===';awk -F '\t' '{printf "%-5s %-42s %s\n",$1,$2,$3}' "$SUMMARY"||true;echo "persistent log: $LOG";rm -rf "$TMP";return "$rc"; }
trap cleanup EXIT
cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base23-$STAMP
installer_commit=$INSTALLER_COMMIT
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
clean_base22_ui_integrator=603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py
base23_owner_gate_integrator=dac83146154592793e11653de46378a392ab803e/integrate-SOT-turn01-base23-ui.py
backend_contract_unchanged=$EXPECTED_API_BUILD
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt";[ "$INSTALLER_COMMIT" != UNSPECIFIED ]&&pass INSTALLER_IDENTITY "$INSTALLER_COMMIT"||fail INSTALLER_IDENTITY required
echo '=== TURN 01 BASE-23 OWNER-GATE UI QUALIFICATION ==='
# Bounded health read; Base-23 does not mutate backend.
code=000
for i in {1..8};do code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";info PRE_HEALTH_ATTEMPT "attempt=$i HTTP=$code";[ "$code" = 200 ]&&break;sleep 1;done
[ "$code" = 200 ]||fail PRE_HEALTH_HTTP "HTTP=$code"
meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" )";IFS='|' read -r B S ST <<< "$meta";[ "$B" = "$EXPECTED_API_BUILD" ]&&pass BACKEND_UNCHANGED "$B"||fail BACKEND_UNCHANGED "expected=$EXPECTED_API_BUILD got=$B";[ "$S" = 4 ]&&pass PRE_SCHEMA 4||fail PRE_SCHEMA "$S";[ "$ST" = ok ]&&pass PRE_STATUS ok||fail PRE_STATUS "$ST"
BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
curl --max-time 30 -fsSL "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" -o "$TMP/pre.html"&&pass FETCH_PRE_UI "bytes=$(stat -c %s "$TMP/pre.html")"||fail FETCH_PRE_UI failed
curl --max-time 30 -fsSL "$BASE/603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py" -o "$TMP/base22-ui.py"&&pass FETCH_CLEAN_INTEGRATOR "bytes=$(stat -c %s "$TMP/base22-ui.py")"||fail FETCH_CLEAN_INTEGRATOR failed
curl --max-time 30 -fsSL "$BASE/dac83146154592793e11653de46378a392ab803e/integrate-SOT-turn01-base23-ui.py" -o "$TMP/base23-ui.py"&&pass FETCH_BASE23_INTEGRATOR "bytes=$(stat -c %s "$TMP/base23-ui.py")"||fail FETCH_BASE23_INTEGRATOR failed
python3 -m py_compile "$TMP/base22-ui.py" "$TMP/base23-ui.py"&&pass PYCOMPILE ok||fail PYCOMPILE failed
python3 "$TMP/base22-ui.py" "$TMP/pre.html" "$TMP/clean-intermediate.html"&&pass GENERATE_CLEAN_INTERMEDIATE "sha256=$(sha256sum "$TMP/clean-intermediate.html"|awk '{print $1}')"||fail GENERATE_CLEAN_INTERMEDIATE failed
python3 "$TMP/base23-ui.py" "$TMP/clean-intermediate.html" "$TMP/SOT-turn01-base.html"&&pass GENERATE_BASE23_UI "sha256=$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"||fail GENERATE_BASE23_UI failed
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
checks={
'INDEX_COMPLETED_NO_POLL_RERENDER':"state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel))",
'INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH':'async function renderIndex(p,silent=false)',
'PLAN_CURRENT_STALE_SEPARATION':'Previous / Stale Plan',
'PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT':'Current Plan',
'PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY':'Current fingerprint evidence is unavailable.',
'PLAN_REINDEX_ACTION':'Re-index now',
'AVAILABLE_PANEL_SCROLL':'paneBody{min-height:0;overflow:auto}',
'SELECTED_PANEL_SCROLL':'selectedPaneBody',
'AVAILABLE_SEARCH_PRESENT':'availableFolderSearch',
'AVAILABLE_SEARCH_LOCAL_ONLY':"$('availableFolderSearch').oninput",
'SELECTOR_COMMIT_IN_MODAL_FOOTER':'id=\"selectorCommit\"',
}
for k,v in checks.items():
 if v not in h: raise SystemExit(k+' missing')
if 'selectorDone' in h: raise SystemExit('SELECTOR_COMMIT_NOT_IN_PANEL3 failed')
if "availableFolderSearch').oninput=e=>{filter=e.target.value;draw(lastData)" not in h: raise SystemExit('AVAILABLE_SEARCH_LOCAL_ONLY failed')
# ensure search handler itself contains no api call
m=re.search(r"\$\('availableFolderSearch'\)\.oninput=e=>\{([^}]*)\}",h)
if not m or 'api(' in m.group(1): raise SystemExit('AVAILABLE_SEARCH_LOCAL_ONLY network call')
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I);Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
for g in INDEX_COMPLETED_NO_POLL_RERENDER INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH PLAN_CURRENT_STALE_SEPARATION PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY PLAN_REINDEX_ACTION AVAILABLE_PANEL_SCROLL SELECTED_PANEL_SCROLL AVAILABLE_SEARCH_PRESENT AVAILABLE_SEARCH_LOCAL_ONLY SELECTOR_COMMIT_IN_MODAL_FOOTER SELECTOR_COMMIT_NOT_IN_PANEL3;do pass "$g" true;done
node --check "$TMP/ui.js"&&pass NODE_UI ok||fail NODE_UI failed
# Verify storage architecture remains present in the freshly generated UI.
for marker in TURN01_BASE22_CANONICAL_SELECTOR 'data-add=' 'data-remove=' 'Default Target' 'Default Backup' '2-copy groups' '3-copy groups' '4+ copy groups';do grep -Fq "$marker" "$TMP/SOT-turn01-base.html"||fail BASE22_ARCHITECTURE_RETAINED "missing $marker";done;pass BASE22_ARCHITECTURE_RETAINED true
# Archive current live HTML before replacement.
if [ -f "$SOT_DIR/SOT-turn01-base.html" ];then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP";HAD_HTML=1;fi
ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base22-before-base23";mkdir -p "$ARCH";[ "$HAD_HTML" -eq 1 ]&&cp "$HTML_BACKUP" "$ARCH/SOT-turn01-base.html";pass ARCHIVE_PRECUTOVER "$ARCH"
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html";CUTOVER=1;pass INSTALL_UI Base23
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL"||true)";[ "$code" = 200 ]&&pass PUBLIC_PAGE_HTTP HTTP=200||fail PUBLIC_PAGE_HTTP "$code"
grep -Fq 'TURN01_BASE23_OWNER_GATE' "$QUAL_DIR/public.html"&&pass PUBLIC_PAGE_MARKER Base23||fail PUBLIC_PAGE_MARKER missing
# Backend must still be unchanged after HTML cutover.
code="$(curl --max-time 5 -sS -o "$QUAL_DIR/post-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";[ "$code" = 200 ]||fail POST_HEALTH_HTTP "$code";post="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/post-health.json'));print(x.get('build',''))")";[ "$post" = "$EXPECTED_API_BUILD" ]&&pass POST_BACKEND_UNCHANGED "$post"||fail POST_BACKEND_UNCHANGED "$post"
SUCCESS=1;pass QUALIFICATION 'Base-23 mechanically qualified';echo '=== TURN 01 BASE-23 MECHANICALLY QUALIFIED ===';echo "TEST URL: $PUBLIC_URL";echo "QUALIFICATION LOG: $LOG"
