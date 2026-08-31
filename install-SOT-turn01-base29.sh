#!/usr/bin/env bash
set -euo pipefail

BASE28_COMMIT='c22bd37998a506cb07a095bd351c85b5f6b19d4b'
BASE28_URL="https://raw.githubusercontent.com/acmeproducts/stuff/${BASE28_COMMIT}/install-SOT-turn01-base28.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SRC="$TMP/base28.sh"
RUN="$TMP/base29.sh"

curl --max-time 30 -fsSL "$BASE28_URL" -o "$SRC"

python3 - "$SRC" "$RUN" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()
bad='  local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f'
good='  local html="$1" tag="$2"\n  local dir combined count f\n  dir="$TMP/scripts-$tag"\n  combined="$TMP/combined-$tag.js"'
if src.count(bad)!=1:
    raise SystemExit(f'Base29 qualifier correction boundary changed: expected 1 buggy local declaration, found {src.count(bad)}')
src=src.replace(bad,good,1)
# Candidate/run identity only. The clean Base-28 AI integrator is intentionally reused
# as a deterministic source transformer; no failed generated HTML is consumed.
src=src.replace('turn01-base28-qualification','turn01-base29-qualification')
src=src.replace('__base28_probe_','__base29_probe_')
src=src.replace('turn01-base-before-base28','turn01-base-before-base29')
src=src.replace('restoring pre-Base28 HTML','restoring pre-Base29 HTML')
src=src.replace('all Base-28 mechanical gates passed','all Base-29 mechanical gates passed')
src=src.replace('=== TURN 01 BASE-28 RELEASE-QUALITY QUALIFICATION ===','=== TURN 01 BASE-29 RELEASE-QUALITY QUALIFICATION ===')
src=src.replace('GENERATE_BASE28_UI','GENERATE_BASE29_UI')
src=src.replace('pass INSTALL_UI Base28','pass INSTALL_UI Base29')
src=src.replace("pass QUALIFICATION 'Base-28 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'","pass QUALIFICATION 'Base-29 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'")
src=src.replace('=== TURN 01 BASE-28 MECHANICALLY QUALIFIED ===','=== TURN 01 BASE-29 MECHANICALLY QUALIFIED ===')
Path(sys.argv[2]).write_text(src)
PY

bash -n "$RUN"
grep -Fq 'local html="$1" tag="$2" dir="$TMP/scripts-$tag"' "$RUN" && { echo 'Base29 qualifier still contains rejected dependent-local declaration' >&2; exit 1; }
grep -Fq 'dir="$TMP/scripts-$tag"' "$RUN"
grep -Fq 'combined="$TMP/combined-$tag.js"' "$RUN"

echo '=== TURN 01 BASE-29 QUALIFIER CORRECTION ==='
echo 'GY-014 fixed: dependent Bash locals split before nounset expansion'
SOT_INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}" bash "$RUN"
