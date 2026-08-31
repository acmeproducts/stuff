#!/usr/bin/env bash
set -euo pipefail

BASE28_COMMIT='c22bd37998a506cb07a095bd351c85b5f6b19d4b'
BASE28_URL="https://raw.githubusercontent.com/acmeproducts/stuff/${BASE28_COMMIT}/install-SOT-turn01-base28.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
SRC="$TMP/base28.sh"
RUN="$TMP/base30.sh"

curl --max-time 30 -fsSL "$BASE28_URL" -o "$SRC"

python3 - "$SRC" "$RUN" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()

# GY-015: correct BOTH nounset-unsafe dependent-local declarations, not only
# the first observed occurrence.
old_parse='  local html="$1" tag="$2" dir="$TMP/scripts-$tag" combined="$TMP/combined-$tag.js" count f'
new_parse='  local html="$1" tag="$2"\n  local dir combined count f\n  dir="$TMP/scripts-$tag"\n  combined="$TMP/combined-$tag.js"'
old_browser='  local url="$1" tag="$2" dump="$QUAL_DIR/browser-$tag.dom" err="$QUAL_DIR/browser-$tag.stderr" profile="$TMP/browser-profile-$tag" profarg'
new_browser='  local url="$1" tag="$2"\n  local dump err profile profarg\n  dump="$QUAL_DIR/browser-$tag.dom"\n  err="$QUAL_DIR/browser-$tag.stderr"\n  profile="$TMP/browser-profile-$tag"'
for old,new,name in [(old_parse,new_parse,'parse_scripts'),(old_browser,new_browser,'run_browser')]:
    if src.count(old)!=1:
        raise SystemExit(f'Base30 correction boundary changed for {name}: expected 1, found {src.count(old)}')
    src=src.replace(old,new,1)

# Candidate/run identity only. UI generation remains the governed clean chain:
# accepted pre-base -> clean Base22 -> clean Base24 behavior -> Base28 deterministic integrator.
src=src.replace('turn01-base28-qualification','turn01-base30-qualification')
src=src.replace('__base28_probe_','__base30_probe_')
src=src.replace('turn01-base-before-base28','turn01-base-before-base30')
src=src.replace('restoring pre-Base28 HTML','restoring pre-Base30 HTML')
src=src.replace('all Base-28 mechanical gates passed','all Base-30 mechanical gates passed')
src=src.replace('=== TURN 01 BASE-28 RELEASE-QUALITY QUALIFICATION ===','=== TURN 01 BASE-30 RELEASE-QUALITY QUALIFICATION ===')
src=src.replace('GENERATE_BASE28_UI','GENERATE_BASE30_UI')
src=src.replace('pass INSTALL_UI Base28','pass INSTALL_UI Base30')
src=src.replace("pass QUALIFICATION 'Base-28 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'","pass QUALIFICATION 'Base-30 mechanically qualified only after protected defaults + exact generated/public parse + browser boot'")
src=src.replace('=== TURN 01 BASE-28 MECHANICALLY QUALIFIED ===','=== TURN 01 BASE-30 MECHANICALLY QUALIFIED ===')
Path(sys.argv[2]).write_text(src)
PY

bash -n "$RUN"

# Structural audit: no same-line dependent $tag expansion may remain in local declarations.
if grep -nE '^[[:space:]]*local .*tag=.*\$tag' "$RUN"; then
  echo 'Base30 qualifier still contains nounset-unsafe dependent local expansion' >&2
  exit 1
fi
grep -Fq 'dir="$TMP/scripts-$tag"' "$RUN"
grep -Fq 'combined="$TMP/combined-$tag.js"' "$RUN"
grep -Fq 'dump="$QUAL_DIR/browser-$tag.dom"' "$RUN"
grep -Fq 'err="$QUAL_DIR/browser-$tag.stderr"' "$RUN"
grep -Fq 'profile="$TMP/browser-profile-$tag"' "$RUN"

echo '=== TURN 01 BASE-30 QUALIFIER CORRECTION ==='
echo 'GY-015 fixed: full dependent-local audit passed for parse + browser harness'
SOT_INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}" bash "$RUN"
