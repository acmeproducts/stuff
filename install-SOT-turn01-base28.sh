#!/usr/bin/env bash
set -uo pipefail
REPORT_ROOT=/home/support/.openclaw/workspace/https/report
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
EXPECTED_API_BUILD='2026.08.30.sot-turn01-base-22'
PUBLIC_URL='https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html'
PUBLIC_BASE='https://oc-ref.fell-dojo.ts.net/report/SOT'
TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base28-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}"
HTML_BACKUP="$TMP/base.before.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
PROBE_NAME="__base28_probe_${STAMP}.html"
PROBE_PATH="$SOT_DIR/$PROBE_NAME"
PROBE_URL="$PUBLIC_BASE/$PROBE_NAME"
mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-48s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
info(){ record INFO "$1" "$2"; }
die(){ record FAIL "$1" "$2"; exit 1; }
cleanup(){ rc=$?; rm -f "$PROBE_PATH" 2>/dev/null || true; if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ] && [ "$HAD_HTML" -eq 1 ]; then info ROLLBACK 'restoring pre-Base28 HTML'; if install -m0644 "$HTML_BACKUP" "$SOT_DIR/SOT-turn01-base.html"; then pass ROLLBACK_HTML restored; else record FAIL ROLLBACK_HTML failed; fi; fi; if [ "$SUCCESS" -eq 1 ]; then pass FINAL 'all Base-28 mechanical gates passed'; else record FAIL FINAL "qualification failed rc=$rc"; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-48s %s\n",$1,$2,$3}' "$SUMMARY" || true; echo "persistent log: $LOG"; echo "run directory:  $QUAL_DIR"; rm -rf "$TMP"; }
trap cleanup EXIT
trap 'record FAIL INTERRUPTED "signal received; exit=130"; exit 130' INT TERM

cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base28-$STAMP
installer_commit=$INSTALLER_COMMIT
frozen_ui=7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html
clean_base22_ui_integrator=603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py
clean_base24_behavior_integrator=083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py
base28_ai_boot_integrator=8734014cec0aa8461d8dcdff784fdf18cc5a063f/integrate-SOT-turn01-base28-ai.py
backend_contract_unchanged=$EXPECTED_API_BUILD
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
[ "$INSTALLER_COMMIT" != UNSPECIFIED ] || die INSTALLER_IDENTITY required
pass INSTALLER_IDENTITY "$INSTALLER_COMMIT"
echo '=== TURN 01 BASE-28 RELEASE-QUALITY QUALIFICATION ==='

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
curl --max-time 30 -fsSL "$BASE/7a377c27e1ac078510b9d1e4fe66da4f997f25f3/SOT-turn01-pre-base.html" -o "$TMP/pre.html" || die FETCH_PRE_UI failed
pass FETCH_PRE_UI "bytes=$(stat -c %s "$TMP/pre.html")"
curl --max-time 30 -fsSL "$BASE/603e8a331b13b72a097e9ebb9640e33707279777/integrate-SOT-turn01-base22-ui.py" -o "$TMP/base22-ui.py" || die FETCH_BASE22_INTEGRATOR failed
pass FETCH_BASE22_INTEGRATOR "bytes=$(stat -c %s "$TMP/base22-ui.py")"
curl --max-time 30 -fsSL "$BASE/083aa1334208b1e6995fa18852e82722a815f331/integrate-SOT-turn01-base24-ui.py" -o "$TMP/base24-ui.py" || die FETCH_BASE24_BEHAVIOR failed
pass FETCH_BASE24_BEHAVIOR "bytes=$(stat -c %s "$TMP/base24-ui.py")"
curl --max-time 30 -fsSL "$BASE/8734014cec0aa8461d8dcdff784fdf18cc5a063f/integrate-SOT-turn01-base28-ai.py" -o "$TMP/base28-ai.py" || die FETCH_BASE28_INTEGRATOR failed
pass FETCH_BASE28_INTEGRATOR "bytes=$(stat -c %s "$TMP/base28-ai.py")"
python3 -m py_compile "$TMP/base22-ui.py" "$TMP/base24-ui.py" "$TMP/base28-ai.py" >/dev/null 2>&1 || die PYCOMPILE failed
pass PYCOMPILE ok
python3 "$TMP/base22-ui.py" "$TMP/pre.html" "$TMP/clean-base22.html" || die GENERATE_CLEAN_BASE22 failed
pass GENERATE_CLEAN_BASE22 "sha256=$(sha256sum "$TMP/clean-base22.html"|awk '{print $1}')"
python3 "$TMP/base24-ui.py" "$TMP/clean-base22.html" "$TMP/clean-base24-behavior.html" || die REGENERATE_BASE24_BEHAVIOR failed
pass REGENERATE_BASE24_BEHAVIOR "sha256=$(sha256sum "$TMP/clean-base24-behavior.html"|awk '{print $1}')"
python3 "$TMP/base28-ai.py" "$TMP/clean-base24-behavior.html" "$TMP/SOT-turn01-base.html" || die GENERATE_BASE28_UI failed
CAND_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"
pass GENERATE_BASE28_UI "sha256=$CAND_SHA"
printf 'candidate_sha256=%s\n' "$CAND_SHA" >> "$QUAL_DIR/RUN-MANIFEST.txt"
pass GENERATED_ARTIFACT_IDENTITY "$CAND_SHA"

python3 - "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
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
'SAVE_STORAGE_DEFAULTS':'Save storage defaults',
'MOVE_ADD':'data-add=',
'MOVE_REMOVE':'data-remove=',
'AI_VENICE_MODEL_DISCOVERY':'https://api.venice.ai/api/v1/models',
'AI_OPENROUTER_MODEL_DISCOVERY':'https://openrouter.ai/api/v1/models',
'AI_OPENROUTER_KEY_VALIDATION':'https://openrouter.ai/api/v1/auth/key',
'AI_REAL_PROVIDER_VALIDATION':'async function aiValidate(provider,key,model)',
'AI_ACTIVE_PROVIDER_MODEL_STATE':'sot.ai.activeProvider',
'AI_KEYS_BROWSER_LOCAL_ONLY':'localStorage.setItem(s.key,key)',
'AI_SUPERVISOR_PROMPT_PRESENT':'const SOT_SUPERVISOR_PROMPT=',
'AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE':"messages=[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'system',content:'SOT PROJECT / EVIDENCE CONTEXT",
'AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR':'SOT PROJECT / EVIDENCE CONTEXT (authoritative supplied data)',
'AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE':'No validated AI provider is active.',
'AI_VALIDATE_UI':'Validate & activate',
'AI_BOOT_GUARD':'base28BootGuard',
'AI_BOOT_SENTINEL':"data-sot-boot','base28-ok'",
}
for k,v in checks.items():
    if v not in h: raise SystemExit(k+' missing')
if 'selectorDone' in h: raise SystemExit('SELECTOR_COMMIT_NOT_IN_PANEL3 failed')
if "availableFolderSearch').oninput=e=>{filter=e.target.value;draw(lastData)" not in h: raise SystemExit('AVAILABLE_SEARCH_LOCAL_ONLY failed')
for bad in ['venice_api_key','openrouter_api_key','provider_api_key','ai_api_key']:
    if bad in h: raise SystemExit('prohibited key persistence token '+bad)
PY
[ "$?" -eq 0 ] || die STATIC_CONTRACTS failed
for g in INDEX_ACTIVE_REFRESH_NO_LOADING_FLASH INDEX_COMPLETED_NO_POLL_RERENDER INDEX_COMPLETED_DUPLICATE_2 INDEX_COMPLETED_DUPLICATE_3 INDEX_COMPLETED_DUPLICATE_4PLUS INDEX_COMPLETED_DUPLICATE_DRILLDOWN PLAN_CURRENT_STALE_SEPARATION PLAN_GENERATE_SUCCESS_VISIBLE_CURRENT PLAN_NO_EVIDENCE_PERSISTENT_RECOVERY PLAN_REINDEX_ACTION AVAILABLE_PANEL_SCROLL SELECTED_PANEL_SCROLL AVAILABLE_SEARCH_PRESENT AVAILABLE_SEARCH_LOCAL_ONLY SELECTOR_COMMIT_IN_MODAL_FOOTER SELECTOR_COMMIT_NOT_IN_PANEL3 CANONICAL_SELECTOR PROJECT_CREATE_SOURCE_TARGET DEFAULT_TARGET DEFAULT_BACKUP SAVE_STORAGE_DEFAULTS MOVE_ADD MOVE_REMOVE AI_VENICE_MODEL_DISCOVERY AI_OPENROUTER_MODEL_DISCOVERY AI_OPENROUTER_KEY_VALIDATION AI_REAL_PROVIDER_VALIDATION AI_ACTIVE_PROVIDER_MODEL_STATE AI_KEYS_BROWSER_LOCAL_ONLY AI_SUPERVISOR_PROMPT_PRESENT AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE AI_VALIDATE_UI; do pass "$g" true; done

extract_scripts(){
  local html="$1" outdir="$2" combined="$3"
  rm -rf "$outdir"; mkdir -p "$outdir"
  python3 - "$html" "$outdir" "$combined" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); out=Path(sys.argv[2]); combined=Path(sys.argv[3]); scripts=[]
for m in re.finditer(r'<script(?P<attrs>[^>]*)>(?P<body>[\s\S]*?)</script>',h,re.I):
    attrs=m.group('attrs') or ''
    if re.search(r'\bsrc\s*=',attrs,re.I): continue
    typ=re.search(r'\btype\s*=\s*["\']([^"\']+)',attrs,re.I)
    if typ and typ.group(1).lower() not in ('text/javascript','application/javascript','module'): continue
    scripts.append(m.group('body'))
if not scripts: raise SystemExit('no executable inline scripts found')
for i,s in enumerate(scripts,1):(out/('script-%02d.js'%i)).write_text(s)
combined.write_text('\n;\n'.join(scripts)); print(len(scripts))
PY
}
parse_scripts(){
  local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f
  count="$(extract_scripts "$html" "$dir" "$combined")" || return 1
  [ "$count" -gt 0 ] || return 1
  for f in "$dir"/*.js; do node --check "$f" >/dev/null 2>"$f.err" || { cat "$f.err"; return 1; }; done
  pass "JS_${tag^^}_PER_SCRIPT_PARSE" "scripts=$count"
  node --check "$combined" >/dev/null 2>"$combined.err" || { cat "$combined.err"; return 1; }
  pass "JS_${tag^^}_COMBINED_PARSE" true
}
parse_scripts "$TMP/SOT-turn01-base.html" generated || die JS_GENERATED_PARSE failed

find_browser(){
  for b in google-chrome-stable google-chrome chromium chromium-browser microsoft-edge microsoft-edge-stable; do command -v "$b" 2>/dev/null && return 0; done
  for p in "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe" "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"; do [ -x "$p" ] && { printf '%s\n' "$p"; return 0; }; done
  return 1
}
BROWSER="$(find_browser || true)"
[ -n "$BROWSER" ] || die JS_BROWSER_HARNESS 'no Chrome/Edge browser found; qualification blocked'
pass JS_BROWSER_HARNESS "$BROWSER"
run_browser(){
  local url="$1" tag="$2" dump="$QUAL_DIR/browser-$tag.dom" err="$QUAL_DIR/browser-$tag.stderr" profile="$TMP/browser-profile-$tag" profarg
  mkdir -p "$profile"
  if [[ "$BROWSER" == *.exe ]]; then profarg="$(wslpath -w "$profile")"; else profarg="$profile"; fi
  "$BROWSER" --headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --ignore-certificate-errors --user-data-dir="$profarg" --virtual-time-budget=7000 --dump-dom "$url" >"$dump" 2>"$err" || return 1
  grep -Fq 'data-sot-boot="base28-ok"' "$dump" || { echo 'boot sentinel missing'; tail -80 "$err" || true; return 1; }
  if grep -Fq 'data-sot-boot-error=' "$dump"; then echo 'boot error marker present'; grep -o 'data-sot-boot-error="[^"]*"' "$dump" | head; return 1; fi
  if grep -Eqi 'Uncaught (SyntaxError|ReferenceError|TypeError|Error)|SyntaxError:' "$err"; then echo 'critical browser stderr'; grep -Ei 'Uncaught|SyntaxError' "$err" | tail -30; return 1; fi
  return 0
}

install -m0644 "$TMP/SOT-turn01-base.html" "$PROBE_PATH" || die PROBE_STAGE failed
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/probe-readback.html" -w '%{http_code}' "$PROBE_URL" || true)"
[ "$code" = 200 ] || die PROBE_HTTP "HTTP=$code"
PROBE_SHA="$(sha256sum "$QUAL_DIR/probe-readback.html"|awk '{print $1}')"
[ "$PROBE_SHA" = "$CAND_SHA" ] || die PROBE_IDENTITY "candidate=$CAND_SHA probe=$PROBE_SHA"
pass PROBE_IDENTITY "$PROBE_SHA"
run_browser "$PROBE_URL" generated || die JS_GENERATED_BROWSER_BOOT failed
pass JS_GENERATED_BROWSER_BOOT true
pass GENERATED_APP_ROOT_RENDERED true
rm -f "$PROBE_PATH"

code="$(curl --max-time 8 -sS -o "$QUAL_DIR/volumes.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/volumes || true)"
[ "$code" = 200 ] || die LIVE_VOLUMES "HTTP=$code"
pass LIVE_VOLUMES HTTP=200
for drive in F I; do
  code="$(curl --max-time 8 -sS -o "$QUAL_DIR/browse-$drive.json" -w '%{http_code}' "http://127.0.0.1:18080/api/sot/turn01/fs?path=%2Fmnt%2F$(printf '%s' "$drive"|tr 'A-Z' 'a-z')" || true)"
  [ "$code" = 200 ] || die "DRIVE_${drive}_BROWSE" "HTTP=$code"
  pass "DRIVE_${drive}_BROWSE" HTTP=200
done

if [ -f "$SOT_DIR/SOT-turn01-base.html" ]; then cp "$SOT_DIR/SOT-turn01-base.html" "$HTML_BACKUP"; HAD_HTML=1; fi
ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base-before-base28"
mkdir -p "$ARCH"
[ "$HAD_HTML" -eq 1 ] && cp "$HTML_BACKUP" "$ARCH/SOT-turn01-base.html"
pass ARCHIVE_PRECUTOVER "$ARCH"
install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html" || die INSTALL_UI failed
CUTOVER=1
pass INSTALL_UI Base28

code="$(curl --max-time 10 -sS -o "$QUAL_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || die PUBLIC_PAGE_HTTP "$code"
pass PUBLIC_PAGE_HTTP HTTP=200
PUBLIC_SHA="$(sha256sum "$QUAL_DIR/public.html"|awk '{print $1}')"
[ "$PUBLIC_SHA" = "$CAND_SHA" ] || die PUBLIC_ARTIFACT_IDENTITY "candidate=$CAND_SHA public=$PUBLIC_SHA"
pass PUBLIC_ARTIFACT_IDENTITY "$PUBLIC_SHA"
for marker in 'TURN01_BASE28_OPERATIONAL_AI' 'SOT_SUPERVISOR_PROMPT' 'base28BootGuard' 'Default Target' 'Default Backup' 'Save storage defaults' 'Validate & activate' '2-copy groups' '3-copy groups' '4+ copy groups' 'Current Plan' 'Previous / Stale Plan' 'availableFolderSearch' 'selectorCommit'; do grep -Fq "$marker" "$QUAL_DIR/public.html" || die PUBLIC_PROTECTED_MARKER "missing $marker"; done
pass PUBLIC_PROTECTED_MARKERS true
parse_scripts "$QUAL_DIR/public.html" public || die JS_PUBLIC_PARSE failed
run_browser "$PUBLIC_URL" public || die JS_PUBLIC_BROWSER_BOOT failed
pass JS_PUBLIC_BROWSER_BOOT true
pass PUBLIC_APP_ROOT_RENDERED true
pass PUBLIC_ZERO_SYNTAX_ERRORS true
pass PUBLIC_ZERO_UNCAUGHT_BOOT_ERRORS true

code="$(curl --max-time 5 -sS -o "$QUAL_DIR/post-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
[ "$code" = 200 ] || die POST_HEALTH_HTTP "$code"
post="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/post-health.json'));print(x.get('build',''))" 2>/dev/null || true)"
[ "$post" = "$EXPECTED_API_BUILD" ] || die POST_BACKEND_UNCHANGED "$post"
pass POST_BACKEND_UNCHANGED "$post"
SUCCESS=1
pass QUALIFICATION 'Base-28 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'
echo '=== TURN 01 BASE-28 MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
