#!/usr/bin/env bash
set -uo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
EXPECTED_API_BUILD='2026.08.30.sot-turn01-base-22'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base25-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
HTML_BACKUP="$TMP/base.before.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-46s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
info(){ record INFO "$1" "$2"; }
die(){ record FAIL "$1" "$2"; exit 1; }
cleanup(){ rc=$?; if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ] && [ "$HAD_HTML" -eq 1 ]; then info ROLLBACK 'restoring pre-Base25 HTML'; if install -m0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; then pass ROLLBACK_HTML restored; else record FAIL ROLLBACK_HTML failed; fi; fi; if [ "$SUCCESS" -eq 1 ]; then pass FINAL 'all Base-25 mechanical gates passed'; else record FAIL FINAL "qualification failed rc=$rc"; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-46s %s\n",$1,$2,$3}' "$SUMMARY" || true; echo "persistent log: $LOG"; echo "run directory:  $QUAL_DIR"; rm -rf "$TMP"; }
trap cleanup EXIT
trap 'record FAIL INTERRUPTED "signal received; exit=130"; exit 130' INT TERM

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base25-$STAMP
installer_commit=$INSTALLER_COMMIT
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
clean_base22_ui_integrator=603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py
clean_base24_behavior_integrator=083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py
base25_ai_integrator=d13a50912ed200450414fba101e6371a20d93b06/integrate-SOT-turn01-base25-ai.py
backend_contract_unchanged=$EXPECTED_API_BUILD
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] || die INSTALLER_IDENTITY required
pass INSTALLER_IDENTITY "$INSTALLER_COMMIT"
echo '=== TURN 01 BASE-25 OPERATIONAL-AI QUALIFICATION ==='

code=000
for i in 1 2 3 4 5 6 7 8; do
  code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  info PRE_HEALTH_ATTEMPT "attempt=$i HTTP=$code"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || die PRE_HEALTH_HTTP "HTTP=$code"
meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" 2>/dev/null || true)"
IFS='|' read -r B S ST <<< "$meta"
[ "$B" = "$EXPECTED_API_BUILD" ] || die BACKEND_UNCHANGED "expected=$EXPECTED_API_BUILD got=$B"
pass BACKEND_UNCHANGED "$B"
[ "$S" = 4 ] || die PRE_SCHEMA "$S"
pass PRE_SCHEMA 4
[ "$ST" = ok ] || die PRE_STATUS "$ST"
pass PRE_STATUS ok

BASE='https://raw.githubusercontent.com/acmeproducts/stuff'
if curl --max-time 30 -fsSL "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" -o "$TMP/pre.html"; then pass FETCH_PRE_UI "bytes=$(stat -c %s "$TMP/pre.html")"; else die FETCH_PRE_UI failed; fi
if curl --max-time 30 -fsSL "$BASE/603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py" -o "$TMP/base22-ui.py"; then pass FETCH_BASE22_INTEGRATOR "bytes=$(stat -c %s "$TMP/base22-ui.py")"; else die FETCH_BASE22_INTEGRATOR failed; fi
if curl --max-time 30 -fsSL "$BASE/083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py" -o "$TMP/base24-ui.py"; then pass FETCH_BASE24_BEHAVIOR "bytes=$(stat -c %s "$TMP/base24-ui.py")"; else die FETCH_BASE24_BEHAVIOR failed; fi
if curl --max-time 30 -fsSL "$BASE/d13a50912ed200450414fba101e6371a20d93b06/integrate-SOT-turn01-base25-ai.py" -o "$TMP/base25-ai.py"; then pass FETCH_BASE25_AI "bytes=$(stat -c %s "$TMP/base25-ai.py")"; else die FETCH_BASE25_AI failed; fi
python3 -m py_compile "$TMP/base22-ui.py" "$TMP/base24-ui.py" "$TMP/base25-ai.py" >/dev/null 2>&1 || die PYCOMPILE failed
pass PYCOMPILE ok
python3 "$TMP/base22-ui.py" "$TMP/pre.html" "$TMP/clean-base22.html" || die GENERATE_CLEAN_BASE22 failed
pass GENERATE_CLEAN_BASE22 "sha256=$(sha256sum "$TMP/clean-base22.html"|awk '{print $1}')"
python3 "$TMP/base24-ui.py" "$TMP/clean-base22.html" "$TMP/clean-base24-behavior.html" || die REGENERATE_BASE24_BEHAVIOR failed
pass REGENERATE_BASE24_BEHAVIOR "sha256=$(sha256sum "$TMP/clean-base24-behavior.html"|awk '{print $1}')"
python3 "$TMP/base25-ai.py" "$TMP/clean-base24-behavior.html" "$TMP/SOT-turn01-base.html" || die GENERATE_BASE25_UI failed
pass GENERATE_BASE25_UI "sha256=$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"

python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
checks={
'INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH':'async function renderIndex(p,silent=false)',
'INDEX_COMPLETED_NO_POLL_RERENDER':"state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel))",
'INDEX_COMPLETED_DUPLICATE_2':'2-copy groups',
'INDEX_COMPLETED_DUPLICATE_3':'3-copy groups',
'INDEX_COMPLETED_DUPLICATE_4PLUS':'4+ copy groups',
'INDEX_COMPLETED_DUPLICATE_DRILLDOWN':'dupDrill',
'PLAN_CURRENT_STALE_SEPARATION':'Previous / Stale Plan',
'PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT':'Current Plan',
'PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY':'Current fingerprint evidence is unavailable.',
'PLAN_REINDEX_ACTION':'Re-index now',
'AVAILABLE_PANEL_SCROLL':'paneBody{min-height:0;overflow:auto}',
'SELECTED_PANEL_SCROLL':'selectedPaneBody',
'AVAILABLE_SEARCH_PRESENT':'availableFolderSearch',
'AVAILABLE_SEARCH_LOCAL_ONLY':"$('availableFolderSearch').oninput",
'SELECTOR_COMMIT_IN_MODAL_FOOTER':'id="selectorCommit"',
'CANONICAL_SELECTOR':'TURN01_BASE22_CANONICAL_SELECTOR',
'PROJECT_CREATE_SOURCE_TARGET':'Create Project',
'DEFAULT_TARGET':'Default Target',
'DEFAULT_BACKUP':'Default Backup',
'MOVE_ADD':'data-add=',
'MOVE_REMOVE':'data-remove=',
'AI_VENICE_MODEL_DISCOVERY':'https://api.venice.ai/api/v1/models',
'AI_OPENROUTER_MODEL_DISCOVERY':'https://openrouter.ai/api/v1/models',
'AI_OPENROUTER_KEY_VALIDATION':'https://openrouter.ai/api/v1/auth/key',
'AI_REAL_PROVIDER_VALIDATION':'async function aiValidateProvider(provider,key,model)',
'AI_ACTIVE_PROVIDER_MODEL_STATE':'const SOT_AI_KEYS=',
'AI_KEYS_BROWSER_LOCAL_ONLY':"localStorage.getItem(k)",
'AI_SUPERVISOR_PROMPT_PRESENT':'const SOT_AI_SUPERVISOR=',
'AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE':'No validated AI provider is active.',
'AI_INSIGHTS_CONFIG_RECOVERY':'Open Configuration',
'AI_VALIDATE_UI':'Validate & activate',
'AI_STORAGE_DEFAULTS_RETAINED':'Save storage defaults',
}
for k,v in checks.items():
    if v not in h: raise SystemExit(k+' missing')
if 'selectorDone' in h: raise SystemExit('SELECTOR_COMMIT_NOT_IN_PANEL3 failed')
if "availableFolderSearch').oninput=e=>{filter=e.target.value;draw(lastData)" not in h: raise SystemExit('AVAILABLE_SEARCH_LOCAL_ONLY failed')
m=re.search(r"\$\('availableFolderSearch'\)\.oninput=e=>\{([^}]*)\}",h)
if not m or 'api(' in m.group(1): raise SystemExit('AVAILABLE_SEARCH_LOCAL_ONLY network call')
needle="messages=[{role:'system',content:SOT_AI_SUPERVISOR},{role:'system',content:context},...history,{role:'user',content:user}]"
if needle not in h: raise SystemExit('AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE / AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR failed')
vm=re.search(r"async function aiValidateProvider\(provider,key,model\)\{([\s\S]*?)\nfunction aiActiveProvider",h)
if not vm or '/chat/completions' not in vm.group(1) or "messages:[{role:'system',content:SOT_AI_SUPERVISOR},{role:'user',content:'Reply OK.'}]" not in vm.group(1):
    raise SystemExit('AI_REAL_PROVIDER_VALIDATION request contract failed')
for bad in ['venice_api_key','openrouter_api_key','provider_api_key','ai_api_key']:
    if bad in h: raise SystemExit('AI_KEYS_BROWSER_LOCAL_ONLY prohibited backend key field '+bad)
mi=re.search(r"async function renderIndex\(p,silent=false\)\{([\s\S]*?)\nasync function",h)
body=mi.group(1) if mi else h[h.index('async function renderIndex(p,silent=false)'):]
for token in ["s.state==='Closed'",'data-bucket="2"','data-bucket="3"','data-bucket="4plus"',"runAction(p.project_token,'restart')"]:
    if token not in body: raise SystemExit('INDEX_COMPLETED_PROTECTED_BRANCH missing '+token)
scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)
Path(sys.argv[2]).write_text('\n;\n'.join(scripts))
PY
rc=$?
[ "$rc" -eq 0 ] || die STATIC_CONTRACTS "rc=$rc"
for g in INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH INDEX_COMPLETED_NO_POLL_RERENDER INDEX_COMPLETED_DUPLICATE_2 INDEX_COMPLETED_DUPLICATE_3 INDEX_COMPLETED_DUPLICATE_4PLUS INDEX_COMPLETED_DUPLICATE_DRILLDOWN PLAN_CURRENT_STALE_SEPARATION PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY PLAN_REINDEX_ACTION AVAILABLE_PANEL_SCROLL SELECTED_PANEL_SCROLL AVAILABLE_SEARCH_PRESENT AVAILABLE_SEARCH_LOCAL_ONLY SELECTOR_COMMIT_IN_MODAL_FOOTER SELECTOR_COMMIT_NOT_IN_PANEL3 CANONICAL_SELECTOR PROJECT_CREATE_SOURCE_TARGET DEFAULT_TARGET DEFAULT_BACKUP MOVE_ADD MOVE_REMOVE AI_VENICE_MODEL_DISCOVERY AI_OPENROUTER_MODEL_DISCOVERY AI_OPENROUTER_KEY_VALIDATION AI_REAL_PROVIDER_VALIDATION AI_ACTIVE_PROVIDER_MODEL_STATE AI_KEYS_BROWSER_LOCAL_ONLY AI_SUPERVISOR_PROMPT_PRESENT AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE AI_INSIGHTS_CONFIG_RECOVERY AI_VALIDATE_UI AI_STORAGE_DEFAULTS_RETAINED; do pass "$g" true; done
node --check "$TMP/ui.js" >/dev/null 2>&1 || die NODE_UI failed
pass NODE_UI ok

code="$(curl --max-time 8 -sS -o "$QUAL_DIR/volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"
[ "$code" = 200 ] || die LIVE_VOLUMES "HTTP=$code"
pass LIVE_VOLUMES HTTP=200
for drive in F I; do
  code="$(curl --max-time 8 -sS -o "$QUAL_DIR/browse-$drive.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/fs?path=%2Fmnt%2F$(printf '%s' "$drive"|tr 'A-Z' 'a-z')" || true)"
  [ "$code" = 200 ] || die "DRIVE_${drive}_BROWSE" "HTTP=$code"
  pass "DRIVE_${drive}_BROWSE" HTTP=200
done

if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi
ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base24-before-base25"
mkdir -p "$ARCH"
[ "$HAD_HTML" -eq 1 ] && cp "$HTML_BACKUP" "$ARCH/SOT-turn01-base.html"
pass ARCHIVE_PRECUTOVER "$ARCH"
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html" || die INSTALL_UI failed
CUTOVER=1
pass INSTALL_UI Base25
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || die PUBLIC_PAGE_HTTP "$code"
pass PUBLIC_PAGE_HTTP HTTP=200
for marker in 'TURN01_BASE25_OPERATIONAL_AI' 'SOT_AI_SUPERVISOR' 'Validate & activate' '2-copy groups' '3-copy groups' '4+ copy groups' 'Current Plan' 'Previous / Stale Plan' 'availableFolderSearch' 'selectorCommit' 'Save storage defaults'; do grep -Fq "$marker" "$QUAL_DIR/public.html" || die PUBLIC_PROTECTED_MARKER "missing $marker"; done
pass PUBLIC_PROTECTED_MARKERS true
code="$(curl --max-time 5 -sS -o "$QUAL_DIR/post-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] || die POST_HEALTH_HTTP "$code"
post="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/post-health.json'));print(x.get('build',''))" 2>/dev/null || true)"
[ "$post" = "$EXPECTED_API_BUILD" ] || die POST_BACKEND_UNCHANGED "$post"
pass POST_BACKEND_UNCHANGED "$post"
SUCCESS=1
pass QUALIFICATION 'Base-25 mechanically qualified'
echo '=== TURN 01 BASE-25 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
