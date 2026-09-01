#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
API_LOCAL="${SOT_API_LOCAL:-http://127.0.0.1:18080/api/sot}"
PUBLIC_BASE="${SOT_PUBLIC_BASE:-https://oc-ref.fell-dojo.ts.net/report/SOT}"
PUBLIC_URL="$PUBLIC_BASE/SOT-turn01-base.html"
EXPECTED_API_BUILD='2026.08.30.sot-turn01-base-22'
EXPECTED_SCHEMA='4'
EXPECTED_CANDIDATE_SHA='48c3f1ccb8af820331816cdfb94fbfcfd546ba078c9c4e28642eda54513d645c'

PRE_UI_COMMIT='7a377c27e1ac078510b9d1e4fe66da4f997f25f3'
BASE22_UI_COMMIT='603e8a331b13b72a097e9ebb9640e33707279777'
BASE24_UI_COMMIT='083aa1334208b1e6995fa18852e82722a815f331'
BASE_AI_COMMIT='5660a5fd6f0aaa6c7b734f2ad04b468b65693eb5'
PRE_UI_SHA256='a3ad6fc054790791c4fedee0ae6e12e63f0c37fb6765f8413d1715de2b61c069'
BASE22_UI_SHA256='58299f1b5bb8393d0e3e0772cf49bdf28636a72dbcd18c3b14070732d1acf844'
BASE24_UI_SHA256='45959cdcd1125ceb4f1536b2d7f5e70a983b208088ed77385cce6a2d43316556'
BASE_AI_SHA256='57a60c6816763318aced87837ccee644b71e4475f3b010b6c05c51fdf0e043c3'

TMP="$(mktemp -d -t sot-turn01-base.XXXXXXXX)"
STAMP="$(date +%Y%m%d-%H%M%S)"
QUAL_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base-qualification"
LOG="$QUAL_DIR/qualification.log"
SUMMARY="$QUAL_DIR/summary.tsv"
TARGET_HTML="$SOT_DIR/SOT-turn01-base.html"
HTML_BACKUP="$TMP/base.before.html"
PROBE_NAME="__sot_base_probe_${STAMP}.html"
PROBE_PATH="$SOT_DIR/$PROBE_NAME"
PROBE_URL="$PUBLIC_BASE/$PROBE_NAME"
HARNESS_NAME="__sot_browser_selftest_${STAMP}.html"
HARNESS_PATH="$SOT_DIR/$HARNESS_NAME"
HARNESS_URL="$PUBLIC_BASE/$HARNESS_NAME"
HAD_HTML=0
CUTOVER=0
SUCCESS=0
WINDOWS_PROFILE_ACTIVE=''

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$QUAL_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){
  printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"
  printf '[%s] %-5s %-48s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"
}
pass(){ record PASS "$1" "$2"; }
info(){ record INFO "$1" "$2"; }
die(){ record FAIL "$1" "$2"; exit 1; }

remove_windows_profile(){
  local profile
  profile="$1"
  [ -n "$profile" ] || return 0
  printf '%s' "$profile" | "$POWERSHELL" -NoProfile -NonInteractive -Command '
    $p=[Console]::In.ReadToEnd()
    if([string]::IsNullOrWhiteSpace($p)){exit 2}
    for($i=0;$i -lt 12 -and (Test-Path -LiteralPath $p);$i++){
      try{Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction Stop}catch{}
      if(Test-Path -LiteralPath $p){Start-Sleep -Milliseconds 250}
    }
    if(Test-Path -LiteralPath $p){Write-Error "browser profile cleanup failed: $p";exit 3}
  '
}

cleanup(){
  local rc=$?
  local final_rc
  final_rc=$rc
  set +e
  if [ -n "$WINDOWS_PROFILE_ACTIVE" ]; then
    if ! remove_windows_profile "$WINDOWS_PROFILE_ACTIVE" >/dev/null 2>&1; then
      record FAIL WINDOWS_PROFILE_CLEANUP "$WINDOWS_PROFILE_ACTIVE"
      final_rc=1
    fi
    WINDOWS_PROFILE_ACTIVE=''
  fi
  rm -f "$PROBE_PATH" "$HARNESS_PATH" 2>/dev/null || true
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    info ROLLBACK 'restoring exact pre-cutover public state'
    if [ "$HAD_HTML" -eq 1 ]; then
      if install -m0644 "$HTML_BACKUP" "$TARGET_HTML"; then
        pass ROLLBACK_HTML restored
      else
        record FAIL ROLLBACK_HTML failed
        final_rc=1
      fi
    else
      if rm -f "$TARGET_HTML"; then
        pass ROLLBACK_HTML removed-new-target
      else
        record FAIL ROLLBACK_HTML failed
        final_rc=1
      fi
    fi
  fi
  if [ "$SUCCESS" -eq 1 ]; then
    pass FINAL 'all canonical Base mechanical gates passed'
  else
    record FAIL FINAL "qualification failed rc=$rc"
    final_rc=1
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-48s %s\n",$1,$2,$3}' "$SUMMARY" || true
  echo "persistent log: $LOG"
  echo "run directory:  $QUAL_DIR"
  rm -rf "$TMP"
  trap - EXIT
  exit "$final_rc"
}
trap cleanup EXIT
trap 'record FAIL INTERRUPTED "signal received; exit=130"; exit 130' HUP INT TERM

for tool in bash curl install node python3 sha256sum timeout; do
  command -v "$tool" >/dev/null 2>&1 || die REQUIRE_TOOL "$tool"
done
pass REQUIRE_TOOLS ok

find_powershell(){
  local found candidate
  found="$(command -v powershell.exe 2>/dev/null || true)"
  [ -n "$found" ] && { printf '%s\n' "$found"; return 0; }
  for candidate in "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe" "/mnt/c/Windows/System32/WindowsPowerShell/v1.0/PowerShell.exe" "/mnt/c/Program Files/PowerShell/7/pwsh.exe"; do
    [ -x "$candidate" ] && { printf '%s\n' "$candidate"; return 0; }
  done
  return 1
}
POWERSHELL="$(find_powershell || true)"
[ -n "$POWERSHELL" ] || die REQUIRE_POWERSHELL 'Windows PowerShell executable not found on PATH or canonical Windows paths'
pass REQUIRE_POWERSHELL "$POWERSHELL"

bash -n "${BASH_SOURCE[0]}" || die INSTALLER_BASH_PARSE failed
python3 - "${BASH_SOURCE[0]}" <<'PY'
from pathlib import Path
import re,sys
s=Path(sys.argv[1]).read_text()
for n,line in enumerate(s.splitlines(),1):
    m=re.match(r'^\s*local\s+(.+)$',line)
    if not m: continue
    decl=m.group(1)
    names=re.findall(r'(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=',decl)
    for name in names:
        if re.search(r'\$\{?'+re.escape(name)+r'\}?',decl):
            raise SystemExit(f'nounset-unsafe local declaration at line {n}: {name}')
required=['set -Eeuo pipefail','find_powershell','Join-Path $env:TEMP','[Console]::In.ReadToEnd()','JS_BROWSER_HARNESS_SELFTEST','PUBLIC_ARTIFACT_IDENTITY']
for marker in required:
    if marker not in s: raise SystemExit('installer contract missing '+marker)
for rejected in [
    ''.join(('SOT_', 'BASE32_WIN_PROFILE')),
    'base28' + '.sh',
]:
    if rejected in s: raise SystemExit('rejected installer pattern present '+rejected)
rejected = 'wsl' + 'path'
if rejected in s:
    raise SystemExit('rejected installer pattern present ' + rejected)
PY
pass INSTALLER_BASH_PARSE true
pass INSTALLER_STRUCTURAL_AUDIT true

SELF_SHA="$(sha256sum "${BASH_SOURCE[0]}" | awk '{print $1}')"
cat > "$QUAL_DIR/RUN-MANIFEST.txt" <<EOF
run_id=turn01-base-$STAMP
installer_sha256=$SELF_SHA
frozen_ui=$PRE_UI_COMMIT/SOT-turn01-pre-base.html
clean_base22_ui_integrator=$BASE22_UI_COMMIT/integrate-SOT-turn01-base22-ui.py
clean_base24_behavior_integrator=$BASE24_UI_COMMIT/integrate-SOT-turn01-base24-ui.py
canonical_ai_integrator=$BASE_AI_COMMIT/integrate-SOT-turn01-base-ai.py
backend_contract_unchanged=$EXPECTED_API_BUILD
schema_contract_unchanged=$EXPECTED_SCHEMA
EOF
pass RUN_MANIFEST "$QUAL_DIR/RUN-MANIFEST.txt"
echo '=== TURN 01 CANONICAL BASE RELEASE QUALIFICATION ==='

wait_health(){
  local output label tries code i
  output="$1"
  label="$2"
  tries="$3"
  code=000
  for ((i=1;i<=tries;i++)); do
    code="$(curl --max-time 5 -sS -o "$output" -w '%{http_code}' "$API_LOCAL/health" || true)"
    info "${label}_HEALTH_ATTEMPT" "attempt=$i HTTP=$code"
    [ "$code" = 200 ] && break
    sleep 1
  done
  [ "$code" = 200 ] || return 1
}

validate_health(){
  local input label actual
  input="$1"
  label="$2"
  actual="$(python3 - "$input" "$EXPECTED_API_BUILD" "$EXPECTED_SCHEMA" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
expected_build=sys.argv[2]; expected_schema=int(sys.argv[3])
assert x.get('build')==expected_build,(x.get('build'),expected_build)
assert int(x.get('database_version',-1))==expected_schema,x.get('database_version')
assert x.get('status')=='ok',x.get('status')
print(f"{x['build']} schema={expected_schema} status=ok")
PY
)" || return 1
  pass "${label}_BACKEND_UNCHANGED" "$actual"
}

wait_health "$QUAL_DIR/pre-health.json" PRE 12 || die PRE_HEALTH_HTTP unavailable
validate_health "$QUAL_DIR/pre-health.json" PRE || die PRE_HEALTH_CONTRACT failed

fetch_pinned(){
  local name url expected output actual
  name="$1"
  url="$2"
  expected="$3"
  output="$4"
  curl --max-time 30 -fsSL "$url" -o "$output" || die "FETCH_${name}" failed
  actual="$(sha256sum "$output" | awk '{print $1}')"
  [ "$actual" = "$expected" ] || die "FETCH_${name}_IDENTITY" "expected=$expected actual=$actual"
  pass "FETCH_${name}_IDENTITY" "$actual"
}

RAW='https://raw.githubusercontent.com/acmeproducts/stuff'
fetch_pinned PRE_UI "$RAW/$PRE_UI_COMMIT/SOT-turn01-pre-base.html" "$PRE_UI_SHA256" "$TMP/pre.html"
fetch_pinned BASE22_UI "$RAW/$BASE22_UI_COMMIT/integrate-SOT-turn01-base22-ui.py" "$BASE22_UI_SHA256" "$TMP/base22-ui.py"
fetch_pinned BASE24_UI "$RAW/$BASE24_UI_COMMIT/integrate-SOT-turn01-base24-ui.py" "$BASE24_UI_SHA256" "$TMP/base24-ui.py"
fetch_pinned BASE_AI "$RAW/$BASE_AI_COMMIT/integrate-SOT-turn01-base-ai.py" "$BASE_AI_SHA256" "$TMP/base-ai.py"

python3 -m py_compile "$TMP/base22-ui.py" "$TMP/base24-ui.py" "$TMP/base-ai.py" >/dev/null 2>&1 || die PYTHON_INTEGRATORS_PARSE failed
pass PYTHON_INTEGRATORS_PARSE true
python3 "$TMP/base22-ui.py" "$TMP/pre.html" "$TMP/clean-base22.html" || die GENERATE_CLEAN_BASE22 failed
python3 "$TMP/base24-ui.py" "$TMP/clean-base22.html" "$TMP/clean-base24.html" || die GENERATE_CLEAN_BASE24 failed
python3 "$TMP/base-ai.py" "$TMP/clean-base24.html" "$TMP/candidate.html" || die GENERATE_CANONICAL_BASE failed
CAND_SHA="$(sha256sum "$TMP/candidate.html" | awk '{print $1}')"
[ "$CAND_SHA" = "$EXPECTED_CANDIDATE_SHA" ] || die GENERATED_ARTIFACT_DETERMINISM "expected=$EXPECTED_CANDIDATE_SHA actual=$CAND_SHA"
printf 'candidate_sha256=%s\n' "$CAND_SHA" >> "$QUAL_DIR/RUN-MANIFEST.txt"
pass GENERATED_ARTIFACT_IDENTITY "$CAND_SHA"
pass GENERATED_ARTIFACT_DETERMINISM true

python3 - "$TMP/candidate.html" <<'PY'
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
'DEFAULT_TARGET':'Default Target',
'DEFAULT_BACKUP':'Default Backup',
'MOVE_ADD':'data-add=',
'MOVE_REMOVE':'data-remove=',
'AI_VENICE_MODEL_DISCOVERY':'https://api.venice.ai/api/v1/models',
'AI_OPENROUTER_MODEL_DISCOVERY':'https://openrouter.ai/api/v1/models',
'AI_REAL_PROVIDER_VALIDATION':'async function aiValidate(provider,key,model)',
'AI_ACTIVE_PROVIDER_MODEL_STATE':'sot.ai.activeProvider',
'AI_KEYS_BROWSER_LOCAL_ONLY':'localStorage.setItem(s.key,key)',
'AI_SUPERVISOR_PROMPT_PRESENT':'const SOT_SUPERVISOR_PROMPT=',
'AI_SUPERVISOR_FIRST_SYSTEM_MESSAGE':"messages=[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'system',content:'SOT PROJECT / EVIDENCE CONTEXT",
'AI_PROJECT_EVIDENCE_AFTER_SUPERVISOR':'SOT PROJECT / EVIDENCE CONTEXT (authoritative supplied data)',
'AI_NO_ACTIVE_PROVIDER_EXPLICIT_STATE':'No validated AI provider is active.',
'AI_BOOT_GUARD':'base28BootGuard',
'AI_BOOT_SENTINEL':"data-sot-boot','base28-ok'",
}
for key,marker in checks.items():
    if marker not in h: raise SystemExit(key+' missing')
if 'selectorDone' in h: raise SystemExit('SELECTOR_COMMIT_NOT_IN_PANEL3 failed')
if h.count("const API=")!=1: raise SystemExit('API declaration count is not one')
if re.search(r'(?m)^[ \t]*async[ \t]*(?:;)?[ \t]*$',h): raise SystemExit('standalone async runtime hazard')
if re.search(r'(?m)^[ \t]*async[ \t]*\r?\n',h): raise SystemExit('async line-terminator runtime hazard')
for bad in ['venice_api_key','openrouter_api_key','provider_api_key','ai_api_key']:
    if bad in h: raise SystemExit('prohibited key persistence token '+bad)
PY
pass STATIC_PRODUCT_CONTRACTS true
pass ASYNC_RUNTIME_HAZARDS_ABSENT true

extract_scripts(){
  local html outdir combined
  html="$1"
  outdir="$2"
  combined="$3"
  mkdir -p "$outdir"
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
for i,script in enumerate(scripts,1): (out/('script-%02d.js'%i)).write_text(script)
combined.write_text('\n;\n'.join(scripts))
print(len(scripts))
PY
}

parse_scripts(){
  local html tag dir combined count file
  html="$1"
  tag="$2"
  dir="$TMP/scripts-$tag"
  combined="$TMP/combined-$tag.js"
  count="$(extract_scripts "$html" "$dir" "$combined")" || return 1
  [ "$count" -gt 0 ] || return 1
  for file in "$dir"/*.js; do
    node --check "$file" > /dev/null 2> "$file.err" || { cat "$file.err"; return 1; }
  done
  pass "JS_${tag^^}_PER_SCRIPT_PARSE" "scripts=$count"
  node --check "$combined" > /dev/null 2> "$combined.err" || { cat "$combined.err"; return 1; }
  pass "JS_${tag^^}_COMBINED_PARSE" true
}
parse_scripts "$TMP/candidate.html" generated || die JS_GENERATED_PARSE failed

find_browser(){
  local browser path
  for browser in google-chrome-stable google-chrome chromium chromium-browser microsoft-edge microsoft-edge-stable; do
    command -v "$browser" 2>/dev/null && return 0
  done
  for path in "/mnt/c/Program Files/Microsoft/Edge/Application/msedge.exe" "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" "/mnt/c/Program Files/Google/Chrome/Application/chrome.exe" "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"; do
    [ -x "$path" ] && { printf '%s\n' "$path"; return 0; }
  done
  return 1
}

check_browser_dom(){
  local dump mode
  dump="$1"
  mode="$2"
  python3 - "$dump" "$mode" <<'PY'
from html.parser import HTMLParser
from pathlib import Path
import sys
class Probe(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip=0; self.html={}; self.ids=set(); self.errors=[]; self.text=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='html': self.html=a
        if a.get('id'): self.ids.add(a['id'])
        classes=set((a.get('class') or '').split())
        if 'errorBox' in classes: self.errors.append(a.get('id') or tag)
        if tag in ('script','style'): self.skip+=1
    def handle_endtag(self,tag):
        if tag in ('script','style') and self.skip: self.skip-=1
    def handle_data(self,data):
        if not self.skip: self.text.append(data)
p=Probe(); p.feed(Path(sys.argv[1]).read_text(errors='replace')); mode=sys.argv[2]; text=' '.join(p.text)
if mode=='selftest':
    assert p.html.get('data-sot-harness')=='ok',p.html
    assert 'root' in p.ids and 'executed' in text,(p.ids,text[:500])
else:
    assert p.html.get('data-sot-boot')=='base28-ok',p.html
    assert 'data-sot-boot-error' not in p.html,p.html.get('data-sot-boot-error')
    assert {'cards','content'}.issubset(p.ids),p.ids
    assert not p.errors,p.errors
    assert 'Central SOT' in text,text[:1000]
    for bad in ['SOT backend unavailable','Loading SOT status']:
        assert bad not in text,bad
PY
}

run_browser(){
  local url tag mode dump err profile rc windows cleanup_rc
  url="$1"
  tag="$2"
  mode="${3:-app}"
  dump="$QUAL_DIR/browser-$tag.dom"
  err="$QUAL_DIR/browser-$tag.stderr"
  profile=''
  rc=0
  windows=0
  cleanup_rc=0
  if [[ "$BROWSER" == *.exe ]]; then
    windows=1
    profile="$("$POWERSHELL" -NoProfile -NonInteractive -Command '$p=Join-Path $env:TEMP ("sot-base-"+[guid]::NewGuid().ToString("N"));New-Item -ItemType Directory -Force -Path $p|Out-Null;[Console]::Out.Write($p)' 2>/dev/null | tr -d '\r\n')"
    [ -n "$profile" ] || { echo 'Windows-native browser profile creation failed'; return 1; }
    [[ "$profile" =~ ^[A-Za-z]:\\ ]] || { echo "non-native Windows profile rejected: $profile"; return 1; }
    [[ "$profile" != \\\\* ]] || { echo "UNC browser profile rejected: $profile"; return 1; }
    WINDOWS_PROFILE_ACTIVE="$profile"
  else
    profile="$TMP/browser-profile-$tag"
    mkdir -p "$profile"
  fi
  args=(--headless=new --disable-gpu --disable-crash-reporter --disable-breakpad --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --ignore-certificate-errors --user-data-dir="$profile" --virtual-time-budget=7000 --dump-dom "$url")
  if [ "$windows" -eq 0 ] && [ "$(id -u)" -eq 0 ]; then args=(--no-sandbox "${args[@]}"); fi
  timeout --foreground 35s "$BROWSER" "${args[@]}" > "$dump" 2> "$err" || rc=$?
  if [ "$windows" -eq 1 ]; then
    remove_windows_profile "$profile" > "$QUAL_DIR/browser-$tag.profile-cleanup" 2>&1 || cleanup_rc=$?
    [ "$cleanup_rc" -eq 0 ] && WINDOWS_PROFILE_ACTIVE=''
  fi
  [ "$rc" -eq 0 ] || { echo "browser process failed rc=$rc"; tail -80 "$err" || true; return 1; }
  [ "$cleanup_rc" -eq 0 ] || { echo "browser profile cleanup failed rc=$cleanup_rc"; cat "$QUAL_DIR/browser-$tag.profile-cleanup" || true; return 1; }
  check_browser_dom "$dump" "$mode" || { echo 'browser DOM contract failed'; tail -80 "$err" || true; return 1; }
  if grep -Eqi 'Uncaught (SyntaxError|ReferenceError|TypeError|Error)|SyntaxError:|ReferenceError:|TypeError:|UnhandledPromiseRejection' "$err"; then
    echo 'critical browser stderr'
    grep -Ei 'Uncaught|SyntaxError|ReferenceError|TypeError|UnhandledPromiseRejection' "$err" | tail -40
    return 1
  fi
}

BROWSER="$(find_browser || true)"
[ -n "$BROWSER" ] || die JS_BROWSER_HARNESS 'no Chrome/Edge browser found'
pass JS_BROWSER_HARNESS "$BROWSER"

cat > "$HARNESS_PATH" <<'HTMLHARNESS'
<!doctype html><html><head><meta charset="utf-8"><title>SOT browser harness self-test</title></head><body><div id="root">harness</div><script>document.documentElement.setAttribute('data-sot-harness','ok');document.getElementById('root').textContent='executed';</script></body></html>
HTMLHARNESS
HARNESS_SHA="$(sha256sum "$HARNESS_PATH" | awk '{print $1}')"
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/browser-harness-readback.html" -w '%{http_code}' "$HARNESS_URL" || true)"
[ "$code" = 200 ] || die JS_BROWSER_HARNESS_SELFTEST "HTTP=$code"
READBACK_SHA="$(sha256sum "$QUAL_DIR/browser-harness-readback.html" | awk '{print $1}')"
[ "$READBACK_SHA" = "$HARNESS_SHA" ] || die JS_BROWSER_HARNESS_SELFTEST_IDENTITY "written=$HARNESS_SHA served=$READBACK_SHA"
run_browser "$HARNESS_URL" harness selftest || die JS_BROWSER_HARNESS_SELFTEST execution-failed
pass JS_BROWSER_HARNESS_SELFTEST true
pass WINDOWS_PROFILE_NATIVE_AND_REMOVED true
rm -f "$HARNESS_PATH"

install -m0644 "$TMP/candidate.html" "$PROBE_PATH" || die PROBE_STAGE failed
code="$(curl --max-time 10 -sS -o "$QUAL_DIR/probe-readback.html" -w '%{http_code}' "$PROBE_URL" || true)"
[ "$code" = 200 ] || die PROBE_HTTP "HTTP=$code"
PROBE_SHA="$(sha256sum "$QUAL_DIR/probe-readback.html" | awk '{print $1}')"
[ "$PROBE_SHA" = "$CAND_SHA" ] || die PROBE_IDENTITY "candidate=$CAND_SHA probe=$PROBE_SHA"
pass PROBE_IDENTITY "$PROBE_SHA"
run_browser "$PROBE_URL" generated app || die JS_GENERATED_BROWSER_BOOT failed
pass JS_GENERATED_BROWSER_BOOT true
pass GENERATED_APP_ROOT_RENDERED true
rm -f "$PROBE_PATH"

WINDOWS_DRIVES="$("$POWERSHELL" -NoProfile -NonInteractive -Command '$n=@(Get-PSDrive -PSProvider FileSystem|ForEach-Object{[string]$_.Name}|Where-Object{$_ -match "^[A-Za-z]$"}|Sort-Object -Unique);[Console]::Out.Write(($n -join ","))' 2>/dev/null | tr -d '\r\n')"
[ -n "$WINDOWS_DRIVES" ] || die WINDOWS_VOLUME_DISCOVERY empty
printf '%s\n' "$WINDOWS_DRIVES" > "$QUAL_DIR/windows-drives.csv"
pass WINDOWS_VOLUME_DISCOVERY "$WINDOWS_DRIVES"
code="$(curl --max-time 15 -sS -o "$QUAL_DIR/volumes.json" -w '%{http_code}' "$API_LOCAL/turn01/volumes?refresh=1" || true)"
[ "$code" = 200 ] || die LIVE_VOLUMES "HTTP=$code"
python3 - "$QUAL_DIR/windows-drives.csv" "$QUAL_DIR/volumes.json" "$QUAL_DIR/readable-drives.txt" <<'PY'
import json,sys
expected={x.strip().upper() for x in open(sys.argv[1]).read().split(',') if x.strip()}
payload=json.load(open(sys.argv[2])); rows=[x for x in payload.get('volumes',[]) if x.get('kind')=='drive']
seen={str(x.get('name','')).rstrip(':').upper() for x in rows}
assert seen==expected,(seen,expected)
for row in rows:
    free=row.get('free_bytes'); total=row.get('total_bytes')
    assert isinstance(free,(int,float)) and isinstance(total,(int,float)),row
    assert 0<=free<=total and total>0,row
open(sys.argv[3],'w').write('\n'.join(sorted(expected))+'\n')
print('windows='+','.join(sorted(expected))+' sot='+','.join(sorted(seen))+' capacity=native')
PY
pass INVENTORY_EXACT_MATCH "$WINDOWS_DRIVES"
pass LIVE_WINDOWS_CAPACITY true
while IFS= read -r drive; do
  [ -n "$drive" ] || continue
  lower="$(printf '%s' "$drive" | tr '[:upper:]' '[:lower:]')"
  code="$(curl --max-time 30 -sSG --data-urlencode "path=/mnt/$lower" -o "$QUAL_DIR/browse-$drive.json" -w '%{http_code}' "$API_LOCAL/turn01/fs" || true)"
  [ "$code" = 200 ] || die "DRIVE_${drive}_BROWSE" "HTTP=$code"
  folders="$(python3 - "$QUAL_DIR/browse-$drive.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert isinstance(x.get('folders'),list),x; print(len(x['folders']))
PY
)" || die "DRIVE_${drive}_BROWSE_PARSE" failed
  pass "DRIVE_${drive}_BROWSE" "folders=$folders"
done < "$QUAL_DIR/readable-drives.txt"

if [ -f "$TARGET_HTML" ]; then
  cp "$TARGET_HTML" "$HTML_BACKUP"
  HAD_HTML=1
fi
ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base-before-cutover"
mkdir -p "$ARCH"
if [ "$HAD_HTML" -eq 1 ]; then cp "$HTML_BACKUP" "$ARCH/SOT-turn01-base.html"; fi
cat > "$ARCH/ARCHIVE-MANIFEST.md" <<EOF
# SOT Turn 01 Base pre-cutover archive

- Archived: $STAMP
- Prior HTML present: $HAD_HTML
- Candidate SHA-256: $CAND_SHA
- Backend retained: $EXPECTED_API_BUILD
- Schema retained: $EXPECTED_SCHEMA
EOF
pass ARCHIVE_PRECUTOVER "$ARCH"

install -m0644 "$TMP/candidate.html" "$TARGET_HTML" || die INSTALL_UI failed
CUTOVER=1
pass INSTALL_UI canonical-base
code="$(curl --max-time 12 -sS -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -o "$QUAL_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || die PUBLIC_PAGE_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$QUAL_DIR/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$CAND_SHA" ] || die PUBLIC_ARTIFACT_IDENTITY "candidate=$CAND_SHA public=$PUBLIC_SHA"
pass PUBLIC_ARTIFACT_IDENTITY "$PUBLIC_SHA"
parse_scripts "$QUAL_DIR/public.html" public || die JS_PUBLIC_PARSE failed
run_browser "$PUBLIC_URL" public app || die JS_PUBLIC_BROWSER_BOOT failed
pass JS_PUBLIC_BROWSER_BOOT true
pass PUBLIC_APP_ROOT_RENDERED true
pass PUBLIC_ZERO_SYNTAX_ERRORS true
pass PUBLIC_ZERO_UNCAUGHT_BOOT_ERRORS true

wait_health "$QUAL_DIR/post-health.json" POST 12 || die POST_HEALTH_HTTP unavailable
validate_health "$QUAL_DIR/post-health.json" POST || die POST_HEALTH_CONTRACT failed

SUCCESS=1
pass QUALIFICATION 'canonical Base exact candidate/public parse + browser execution + runtime + storage + backend gates passed'
echo '=== TURN 01 BASE MECHANICALLY QUALIFIED ==='
echo "TEST URL: $PUBLIC_URL"
echo "QUALIFICATION LOG: $LOG"
