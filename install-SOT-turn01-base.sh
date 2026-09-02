#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
ARCHIVE_ROOT="$SOT_DIR/archive"
API_LOCAL="${SOT_API_LOCAL:-http://127.0.0.1:18080/api/sot}"
PUBLIC_BASE="${SOT_PUBLIC_BASE:-https://oc-ref.fell-dojo.ts.net/report/SOT}"
PUBLIC_URL="$PUBLIC_BASE/SOT-turn01-base.html"
TARGET_HTML="$SOT_DIR/SOT-turn01-base.html"
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
RUN_DIR="$ARCHIVE_ROOT/$STAMP-turn01-base-release"
LOG="$RUN_DIR/release.log"
SUMMARY="$RUN_DIR/summary.tsv"
BACKUP="$TMP/base.before.html"
HAD_HTML=0
CUTOVER=0
SUCCESS=0

mkdir -p "$SOT_DIR" "$ARCHIVE_ROOT" "$RUN_DIR"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-40s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
die(){ record FAIL "$1" "$2"; exit 1; }

cleanup(){
  local rc=$?
  set +e
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    record INFO ROLLBACK 'restoring pre-cutover HTML'
    if [ "$HAD_HTML" -eq 1 ]; then
      install -m0644 "$BACKUP" "$TARGET_HTML" && record PASS ROLLBACK_HTML restored || record FAIL ROLLBACK_HTML failed
    else
      rm -f "$TARGET_HTML" && record PASS ROLLBACK_HTML removed-new-target || record FAIL ROLLBACK_HTML failed
    fi
  fi
  echo '=== RELEASE SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-40s %s\n",$1,$2,$3}' "$SUMMARY" || true
  echo "log: $LOG"
  rm -rf "$TMP"
  trap - EXIT
  exit "$rc"
}
trap cleanup EXIT

for tool in bash curl install node python3 sha256sum; do command -v "$tool" >/dev/null 2>&1 || die REQUIRE_TOOL "$tool"; done
pass REQUIRE_TOOLS ok
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
PY
pass INSTALLER_BASH_PARSE true

health_check(){
  local out="$1" code actual
  code="$(curl --max-time 8 -sS -o "$out" -w '%{http_code}' "$API_LOCAL/health" || true)"
  [ "$code" = 200 ] || return 1
  actual="$(python3 - "$out" "$EXPECTED_API_BUILD" "$EXPECTED_SCHEMA" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); b=sys.argv[2]; s=int(sys.argv[3])
assert x.get('build')==b,(x.get('build'),b)
assert int(x.get('database_version',-1))==s,x.get('database_version')
assert x.get('status')=='ok',x.get('status')
print(f"{b} schema={s} status=ok")
PY
)" || return 1
  printf '%s\n' "$actual"
}
PRE_HEALTH="$(health_check "$RUN_DIR/pre-health.json" || true)"
[ -n "$PRE_HEALTH" ] || die PRE_BACKEND_HEALTH failed
pass PRE_BACKEND_HEALTH "$PRE_HEALTH"

fetch_pinned(){
  local name="$1" url="$2" expected="$3" out="$4" actual
  curl --max-time 30 -fsSL "$url" -o "$out" || die "FETCH_${name}" failed
  actual="$(sha256sum "$out" | awk '{print $1}')"
  [ "$actual" = "$expected" ] || die "FETCH_${name}_IDENTITY" "expected=$expected actual=$actual"
  pass "FETCH_${name}_IDENTITY" "$actual"
}
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'
fetch_pinned PRE_UI "$RAW/$PRE_UI_COMMIT/SOT-turn01-pre-base.html" "$PRE_UI_SHA256" "$TMP/pre.html"
fetch_pinned BASE22_UI "$RAW/$BASE22_UI_COMMIT/integrate-SOT-turn01-base22-ui.py" "$BASE22_UI_SHA256" "$TMP/base22.py"
fetch_pinned BASE24_UI "$RAW/$BASE24_UI_COMMIT/integrate-SOT-turn01-base24-ui.py" "$BASE24_UI_SHA256" "$TMP/base24.py"
fetch_pinned BASE_AI "$RAW/$BASE_AI_COMMIT/integrate-SOT-turn01-base-ai.py" "$BASE_AI_SHA256" "$TMP/base-ai.py"

python3 -m py_compile "$TMP/base22.py" "$TMP/base24.py" "$TMP/base-ai.py" >/dev/null 2>&1 || die PYTHON_INTEGRATORS_PARSE failed
pass PYTHON_INTEGRATORS_PARSE true
python3 "$TMP/base22.py" "$TMP/pre.html" "$TMP/base22.html" || die GENERATE_BASE22 failed
python3 "$TMP/base24.py" "$TMP/base22.html" "$TMP/base24.html" || die GENERATE_BASE24 failed
python3 "$TMP/base-ai.py" "$TMP/base24.html" "$TMP/candidate.html" || die GENERATE_BASE failed
CAND_SHA="$(sha256sum "$TMP/candidate.html" | awk '{print $1}')"
[ "$CAND_SHA" = "$EXPECTED_CANDIDATE_SHA" ] || die GENERATED_ARTIFACT_IDENTITY "expected=$EXPECTED_CANDIDATE_SHA actual=$CAND_SHA"
pass GENERATED_ARTIFACT_IDENTITY "$CAND_SHA"

python3 - "$TMP/candidate.html" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
required=[
'2-copy groups','3-copy groups','4+ copy groups','dupDrill','Previous / Stale Plan','Current Plan','Re-index now',
'availableFolderSearch','selectedPaneBody','id="selectorCommit"','Default Target','Default Backup',
'https://api.venice.ai/api/v1/models','https://openrouter.ai/api/v1/models','async function aiValidate(provider,key,model)',
'sot.ai.activeProvider','const SOT_SUPERVISOR_PROMPT=','SOT PROJECT / EVIDENCE CONTEXT (authoritative supplied data)'
]
for marker in required:
    if marker not in h: raise SystemExit('missing product contract: '+marker)
if h.count('const API=')!=1: raise SystemExit('API declaration count != 1')
if re.search(r'(?m)^[ \t]*async[ \t]*(?:;)?[ \t]*$',h): raise SystemExit('standalone async hazard')
if re.search(r'(?m)^[ \t]*async[ \t]*\r?\n',h): raise SystemExit('async line-terminator hazard')
PY
pass STATIC_PRODUCT_CONTRACTS true
pass ASYNC_RUNTIME_HAZARDS_ABSENT true

parse_html_js(){
  local html tag dir combined count file
  html="$1"
  tag="$2"
  dir="$TMP/js-$tag"
  combined="$TMP/$tag-combined.js"
  mkdir -p "$dir"
  count="$(python3 - "$html" "$dir" "$combined" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text(); out=Path(sys.argv[2]); combined=Path(sys.argv[3]); scripts=[]
for m in re.finditer(r'<script(?P<a>[^>]*)>(?P<b>[\s\S]*?)</script>',h,re.I):
    a=m.group('a') or ''
    if re.search(r'\bsrc\s*=',a,re.I): continue
    scripts.append(m.group('b'))
if not scripts: raise SystemExit('no inline scripts')
for i,s in enumerate(scripts,1): (out/f'script-{i:02d}.js').write_text(s)
combined.write_text('\n;\n'.join(scripts))
print(len(scripts))
PY
)" || return 1
  for file in "$dir"/*.js; do node --check "$file" >/dev/null || return 1; done
  node --check "$combined" >/dev/null || return 1
  printf '%s\n' "$count"
}
COUNT="$(parse_html_js "$TMP/candidate.html" generated || true)"
[ -n "$COUNT" ] || die JS_GENERATED_PARSE failed
pass JS_GENERATED_PARSE "scripts=$COUNT"

if [ -f "$TARGET_HTML" ]; then cp "$TARGET_HTML" "$BACKUP"; HAD_HTML=1; fi
ARCH="$ARCHIVE_ROOT/$STAMP-turn01-base-before-cutover"
mkdir -p "$ARCH"
[ "$HAD_HTML" -eq 0 ] || cp "$BACKUP" "$ARCH/SOT-turn01-base.html"
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
code="$(curl --max-time 12 -sS -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' -o "$RUN_DIR/public.html" -w '%{http_code}' "$PUBLIC_URL" || true)"
[ "$code" = 200 ] || die PUBLIC_PAGE_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$RUN_DIR/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$CAND_SHA" ] || die PUBLIC_ARTIFACT_IDENTITY "candidate=$CAND_SHA public=$PUBLIC_SHA"
pass PUBLIC_ARTIFACT_IDENTITY "$PUBLIC_SHA"
PUBLIC_COUNT="$(parse_html_js "$RUN_DIR/public.html" public || true)"
[ -n "$PUBLIC_COUNT" ] || die JS_PUBLIC_PARSE failed
pass JS_PUBLIC_PARSE "scripts=$PUBLIC_COUNT"
POST_HEALTH="$(health_check "$RUN_DIR/post-health.json" || true)"
[ -n "$POST_HEALTH" ] || die POST_BACKEND_HEALTH failed
pass POST_BACKEND_HEALTH "$POST_HEALTH"

SUCCESS=1
pass RELEASE_READY 'lightweight mechanical QA passed'
echo '=== TURN 01 BASE READY FOR OWNER TEST ==='
echo "TEST URL: $PUBLIC_URL"
