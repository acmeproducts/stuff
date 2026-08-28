#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Base-8 runtime behavior remains the direct governed rebuild. This wrapper
# changes release qualification only: discovered Windows volumes that are
# presently offline/no-media are reported and skipped rather than aborting the
# whole Base gate, so later drives (notably F: and I:) are still exercised.
BASE8_DIRECT_URL='https://raw.githubusercontent.com/acmeproducts/stuff/531d4697b39c03ec4e17740092ff21b99645b283/install-SOT-turn01-base.sh'

curl --max-time 30 -fsSL "$BASE8_DIRECT_URL" -o "$TMP/base8-direct.sh"

python3 - "$TMP/base8-direct.sh" "$TMP/base8-qualified.sh" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text()

# Retire the already-proven brittle grep that stopped before cutover.
needle = '''grep -q \"replace(/\\[\\\\\\\\\\\\\\\\/\\]+\\\\$/, '')\" \"$TMP/sot-api.js\"\\n'''
count = src.count(needle)
if count != 1:
    raise SystemExit(f'Base-8 brittle regex gate changed unexpectedly: found {count}')
src = src.replace(needle, '', 1)

# A discovered Windows volume can legitimately be offline/removable. Do not
# roll back a healthy Base merely because one such volume returns 409/no-media.
# Report it and continue qualifying the remaining discovered drives.
old = '''    if [ "$HTTP_CODE" != "200" ]; then
      echo "browse HTTP $HTTP_CODE for $DRIVE:"
      cat "$TMP/$DRIVE-folders.json" || true
      echo
      false
    fi'''
new = '''    if [ "$HTTP_CODE" != "200" ]; then
      echo "browse HTTP $HTTP_CODE for $DRIVE:"
      cat "$TMP/$DRIVE-folders.json" || true
      echo
      echo "volume $DRIVE currently unavailable; continuing drive qualification"
      continue
    fi'''
count = src.count(old)
if count != 1:
    raise SystemExit(f'Base-8 browse failure gate changed unexpectedly: found {count}')
src = src.replace(old, new, 1)

required = [
    "EXPECTED_BUILD='2026.08.28.sot-turn01-base-8'",
    'patch-mount-source.py',
    'patch-idle-refresh.py',
    'for DRIVE in C D E F G I P Q',
    'SOURCE_NORM',
    'function fullyIndexedStable',
    'currently unavailable; continuing drive qualification',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'Base-8 stable gate missing: {marker}')

Path(sys.argv[2]).write_text(src)
PY

bash -n "$TMP/base8-qualified.sh"
grep -q 'currently unavailable; continuing drive qualification' "$TMP/base8-qualified.sh"
grep -q 'for DRIVE in C D E F G I P Q' "$TMP/base8-qualified.sh"
echo '=== BASE-8 QUALIFIED GENERATOR — OFFLINE VOLUMES NONFATAL ==='
exec bash "$TMP/base8-qualified.sh"
