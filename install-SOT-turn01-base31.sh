#!/usr/bin/env bash
set -euo pipefail

BASE28_COMMIT='c22bd37998a506cb07a095bd351c85b5f6b19d4b'
BASE28_URL="https://raw.githubusercontent.com/acmeproducts/stuff/${BASE28_COMMIT}/install-SOT-turn01-base28.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SRC="$TMP/base28.sh"
RUN="$TMP/base31.sh"

curl --max-time 30 -fsSL "$BASE28_URL" -o "$SRC"

python3 - "$SRC" "$RUN" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()

# Fix every known nounset-unsafe dependent-local declaration in the inherited
# qualification harness before it is allowed to run.
fixes=[
(
'  local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f',
'  local html="$1" tag="$2"\n  local dir combined count f\n  dir="$TMP/scripts-$tag"\n  combined="$TMP/combined-$tag.js"',
'parse_scripts'
),
(
'  local url="$1" tag="$2" dump="$QUAL_DIR/browser-$tag.dom" err="$QUAL_DIR/browser-$tag.stderr" profile="$TMP/browser-profile-$tag" profarg',
'  local url="$1" tag="$2"\n  local dump err profile profarg\n  dump="$QUAL_DIR/browser-$tag.dom"\n  err="$QUAL_DIR/browser-$tag.stderr"\n  profile="$TMP/browser-profile-$tag"',
'run_browser'
)
]
for old,new,name in fixes:
    if src.count(old)!=1:
        raise SystemExit(f'Base31 harness correction boundary changed for {name}: expected 1, found {src.count(old)}')
    src=src.replace(old,new,1)

# Add a deterministic correction/gate for the owner-observed runtime hazard.
needle='python3 "$TMP/base28-ai.py" "$TMP/clean-base24-behavior.html" "$TMP/SOT-turn01-base.html" || die GENERATE_BASE28_UI failed\n'
if src.count(needle)!=1:
    raise SystemExit(f'Base31 async runtime correction boundary changed: {src.count(needle)}')
async_fix=needle+r'''python3 - "$TMP/SOT-turn01-base.html" "$TMP/async-fix-count.txt" <<'PYASYNC'
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
src=src.replace(needle,async_fix,1)

# Candidate/run identity only. Generated HTML is still rebuilt from accepted
# pre-base -> clean Base22 -> clean Base24 behavior -> deterministic Base28 integrator.
src=src.replace('turn01-base28-qualification','turn01-base31-qualification')
src=src.replace('__base28_probe_','__base31_probe_')
src=src.replace('turn01-base-before-base28','turn01-base-before-base31')
src=src.replace('restoring pre-Base28 HTML','restoring pre-Base31 HTML')
src=src.replace('all Base-28 mechanical gates passed','all Base-31 mechanical gates passed')
src=src.replace('=== TURN 01 BASE-28 RELEASE-QUALITY QUALIFICATION ===','=== TURN 01 BASE-31 RELEASE-QUALITY QUALIFICATION ===')
src=src.replace('GENERATE_BASE28_UI','GENERATE_BASE31_UI')
src=src.replace('pass INSTALL_UI Base28','pass INSTALL_UI Base31')
src=src.replace("pass QUALIFICATION 'Base-28 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'","pass QUALIFICATION 'Base-31 mechanically qualified only after async runtime safety + protected defaults + exact generated/public parse + browser boot'")
src=src.replace('=== TURN 01 BASE-28 MECHANICALLY QUALIFIED ===','=== TURN 01 BASE-31 MECHANICALLY QUALIFIED ===')
Path(sys.argv[2]).write_text(src)
PY

bash -n "$RUN"

# Generic harness self-audit: under set -u, no variable declared by a `local`
# statement may be referenced on that same declaration line.
python3 - "$RUN" <<'PY'
from pathlib import Path
import re,sys
p=Path(sys.argv[1])
for n,line in enumerate(p.read_text().splitlines(),1):
    m=re.match(r'^\s*local\s+(.+)$',line)
    if not m: continue
    decl=m.group(1)
    names=re.findall(r'(?:^|\s)([A-Za-z_][A-Za-z0-9_]*)=',decl)
    for name in names:
        if re.search(r'\$\{?'+re.escape(name)+r'\}?',decl):
            raise SystemExit(f'nounset-unsafe local self/dependent reference at line {n}: {name}')
PY

grep -Fq 'ASYNC_DECLARATION_RUNTIME_SAFE' "$RUN"
grep -Fq 'data-sot-boot="base28-ok"' "$RUN"
grep -Fq 'Uncaught (SyntaxError|ReferenceError|TypeError|Error)' "$RUN"

echo '=== TURN 01 BASE-31 QUALIFIER SELF-AUDIT PASSED ==='
echo 'Bash syntax + generic nounset local audit + async runtime gate + browser error gate present'
SOT_INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}" bash "$RUN"
