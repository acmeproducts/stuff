#!/usr/bin/env bash
set -euo pipefail

BASE28_COMMIT='c22bd37998a506cb07a095bd351c85b5f6b19d4b'
BASE28_URL="https://raw.githubusercontent.com/acmeproducts/stuff/${BASE28_COMMIT}/install-SOT-turn01-base28.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SRC="$TMP/base28.sh"
RUN="$TMP/base32.sh"

curl --max-time 30 -fsSL "$BASE28_URL" -o "$SRC"

python3 - "$SRC" "$RUN" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()

# Repair every known set -u dependent-local declaration in the inherited harness.
fixes=[
(
'  local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f',
'  local html="$1" tag="$2"\n  local dir combined count f\n  dir="$TMP/scripts-$tag"\n  combined="$TMP/combined-$tag.js"',
'parse_scripts'
),
(
'  local url="$1" tag="$2" dump="$QUAL_DIR/browser-$tag.dom" err="$QUAL_DIR/browser-$tag.stderr" profile="$TMP/browser-profile-$tag" profarg',
'  local url="$1" tag="$2"\n  local dump err profile profarg\n  dump="$QUAL_DIR/browser-$tag.dom"\n  err="$QUAL_DIR/browser-$tag.stderr"\n  profile="$TMP/browser-profile-$tag"',
'run_browser-original'
)
]
for old,new,name in fixes:
    if src.count(old)!=1:
        raise SystemExit(f'Base32 harness correction boundary changed for {name}: expected 1, found {src.count(old)}')
    src=src.replace(old,new,1)

# Runtime-safe async declaration gate. This corrects only a concrete lexical
# line-terminator hazard and then proves none remain.
needle='python3 "$TMP/base28-ai.py" "$TMP/clean-base24-behavior.html" "$TMP/SOT-turn01-base.html" || die GENERATE_BASE28_UI failed\n'
if src.count(needle)!=1:
    raise SystemExit(f'Base32 async gate boundary changed: {src.count(needle)}')
async_gate=needle+r'''python3 - "$TMP/SOT-turn01-base.html" "$TMP/async-fix-count.txt" <<'PYASYNC'
from pathlib import Path
import re,sys
p=Path(sys.argv[1]); out=Path(sys.argv[2]); s=p.read_text()
pat=re.compile(r'(?m)^([ \t]*)async[ \t]*\r?\n([ \t]*)function\b')
matches=list(pat.finditer(s))
if matches:
    s=pat.sub(lambda m: m.group(2)+'async function',s)
p.write_text(s)
if pat.search(s):
    raise SystemExit('async declaration line-terminator hazard remains after normalization')
out.write_text(str(len(matches)))
PYASYNC
ASYNC_FIX_COUNT="$(cat "$TMP/async-fix-count.txt")"
pass ASYNC_DECLARATION_RUNTIME_SAFE "normalized=$ASYNC_FIX_COUNT"
'''
src=src.replace(needle,async_gate,1)

# Add browser self-test paths and ensure trap cleanup removes them.
probe="PROBE_URL=\"$PUBLIC_BASE/$PROBE_NAME\"\n"
if src.count(probe)!=1:
    raise SystemExit('Base32 probe variable boundary changed')
src=src.replace(probe,probe+'HARNESS_NAME="__base32_browser_selftest_${STAMP}.html"\nHARNESS_PATH="$SOT_DIR/$HARNESS_NAME"\nHARNESS_URL="$PUBLIC_BASE/$HARNESS_NAME"\n',1)
src=src.replace('rm -f "$PROBE_PATH" 2>/dev/null || true;', 'rm -f "$PROBE_PATH" "$HARNESS_PATH" 2>/dev/null || true;',1)

# Replace the browser runner. Windows browser executables MUST use a
# Windows-native %TEMP% profile; WSL/UNC user-data-dir paths are prohibited.
start=src.index('run_browser(){')
end_marker='\n\ninstall -m0644 "$TMP/SOT-turn01-base.html" "$PROBE_PATH"'
end=src.index(end_marker,start)
new_runner=r'''run_browser(){
  local url="$1" tag="$2"
  local mode="${3:-app}"
  local dump err profile rc
  dump="$QUAL_DIR/browser-$tag.dom"
  err="$QUAL_DIR/browser-$tag.stderr"
  rc=0
  if [[ "$BROWSER" == *.exe ]]; then
    profile="$(powershell.exe -NoProfile -Command '$p=Join-Path $env:TEMP ("sot-base32-"+[guid]::NewGuid().ToString("N")); New-Item -ItemType Directory -Force -Path $p | Out-Null; [Console]::Out.Write($p)' 2>/dev/null | tr -d '\r')"
    [ -n "$profile" ] || { echo 'Windows-native browser profile creation failed'; return 1; }
    "$BROWSER" --headless=new --disable-gpu --disable-crash-reporter --disable-breakpad --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --ignore-certificate-errors --user-data-dir="$profile" --virtual-time-budget=7000 --dump-dom "$url" >"$dump" 2>"$err" || rc=$?
    SOT_BASE32_WIN_PROFILE="$profile" powershell.exe -NoProfile -Command 'Remove-Item -LiteralPath $env:SOT_BASE32_WIN_PROFILE -Recurse -Force -ErrorAction SilentlyContinue' >/dev/null 2>&1 || true
  else
    profile="$TMP/browser-profile-$tag"
    mkdir -p "$profile"
    "$BROWSER" --headless=new --disable-gpu --disable-crash-reporter --disable-breakpad --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --ignore-certificate-errors --user-data-dir="$profile" --virtual-time-budget=7000 --dump-dom "$url" >"$dump" 2>"$err" || rc=$?
  fi
  [ "$rc" -eq 0 ] || { echo "browser process failed rc=$rc"; tail -80 "$err" || true; return 1; }
  if [ "$mode" = selftest ]; then
    grep -Fq 'data-sot-harness="ok"' "$dump" || { echo 'browser harness self-test sentinel missing'; tail -80 "$err" || true; return 1; }
    return 0
  fi
  grep -Fq 'data-sot-boot="base28-ok"' "$dump" || { echo 'boot sentinel missing'; tail -80 "$err" || true; return 1; }
  if grep -Fq 'data-sot-boot-error=' "$dump"; then echo 'boot error marker present'; grep -o 'data-sot-boot-error="[^"]*"' "$dump" | head; return 1; fi
  if grep -Eqi 'Uncaught (SyntaxError|ReferenceError|TypeError|Error)|SyntaxError:|ReferenceError:|TypeError:' "$err"; then echo 'critical browser stderr'; grep -Ei 'Uncaught|SyntaxError|ReferenceError|TypeError' "$err" | tail -30; return 1; fi
  return 0
}

cat > "$HARNESS_PATH" <<'HTMLHARNESS'
<!doctype html><html><head><meta charset="utf-8"><title>SOT browser harness self-test</title></head><body><div id="root">harness</div><script>document.documentElement.setAttribute('data-sot-harness','ok');document.getElementById('root').textContent='executed';</script></body></html>
HTMLHARNESS
hcode="$(curl --max-time 10 -sS -o "$QUAL_DIR/browser-harness-readback.html" -w '%{http_code}' "$HARNESS_URL" || true)"
[ "$hcode" = 200 ] || die JS_BROWSER_HARNESS_SELFTEST "self-test HTTP=$hcode"
run_browser "$HARNESS_URL" harness selftest || die JS_BROWSER_HARNESS_SELFTEST 'browser failed deterministic JavaScript/DOM liveness test'
pass JS_BROWSER_HARNESS_SELFTEST true
rm -f "$HARNESS_PATH"
'''
src=src[:start]+new_runner+src[end:]

# Candidate/run identity only. The candidate HTML remains regenerated from the
# accepted lineage and the clean Base28 deterministic integrator.
src=src.replace('turn01-base28-qualification','turn01-base32-qualification')
src=src.replace('__base28_probe_','__base32_probe_')
src=src.replace('turn01-base-before-base28','turn01-base-before-base32')
src=src.replace('restoring pre-Base28 HTML','restoring pre-Base32 HTML')
src=src.replace('all Base-28 mechanical gates passed','all Base-32 mechanical gates passed')
src=src.replace('=== TURN 01 BASE-28 RELEASE-QUALITY QUALIFICATION ===','=== TURN 01 BASE-32 RELEASE-QUALITY QUALIFICATION ===')
src=src.replace('GENERATE_BASE28_UI','GENERATE_BASE32_UI')
src=src.replace('pass INSTALL_UI Base28','pass INSTALL_UI Base32')
src=src.replace("pass QUALIFICATION 'Base-28 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'","pass QUALIFICATION 'Base-32 mechanically qualified only after harness self-test + runtime safety + exact generated/public parse + browser boot'")
src=src.replace('=== TURN 01 BASE-28 MECHANICALLY QUALIFIED ===','=== TURN 01 BASE-32 MECHANICALLY QUALIFIED ===')
Path(sys.argv[2]).write_text(src)
PY

bash -n "$RUN"

# Qualifier self-QA: under set -u, no variable declared on a local statement may
# be referenced on that same declaration line.
python3 - "$RUN" <<'PY'
from pathlib import Path
import re,sys
for n,line in enumerate(Path(sys.argv[1]).read_text().splitlines(),1):
    m=re.match(r'^\s*local\s+(.+)$',line)
    if not m: continue
    decl=m.group(1)
    names=re.findall(r'(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=',decl)
    for name in names:
        if re.search(r'\$\{?'+re.escape(name)+r'\}?',decl):
            raise SystemExit(f'nounset-unsafe local self/dependent reference at line {n}: {name}')
PY

# Browser-harness QA must be structurally present before the installer can run.
grep -Fq 'JS_BROWSER_HARNESS_SELFTEST' "$RUN"
grep -Fq 'Join-Path $env:TEMP' "$RUN"
grep -Fq 'data-sot-harness' "$RUN"
grep -Fq 'ASYNC_DECLARATION_RUNTIME_SAFE' "$RUN"
grep -Fq 'ReferenceError:' "$RUN"
if grep -Fq 'wslpath -w "$profile"' "$RUN"; then
  echo 'Base32 rejected: Windows browser profile still routed through WSL/UNC' >&2
  exit 1
fi

echo '=== TURN 01 BASE-32 QUALIFIER SELF-AUDIT PASSED ==='
echo 'Bash syntax + nounset audit + Windows-native browser profile + harness self-test + runtime error gates present'
SOT_INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}" bash "$RUN"
