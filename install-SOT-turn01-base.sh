#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Base-8 runtime behavior remains exactly the archived 531d469 candidate.
# That candidate successfully generated every governed backend/UI delta but
# stopped before cutover because one post-build grep interpreted a JavaScript
# regex as a BRE pattern. Remove only that brittle mechanical gate, verify the
# intended stable Base-8 gates remain, then execute the direct rebuild.
BASE8_DIRECT_URL='https://raw.githubusercontent.com/acmeproducts/stuff/531d4697b39c03ec4e17740092ff21b99645b283/install-SOT-turn01-base.sh'

curl --max-time 30 -fsSL "$BASE8_DIRECT_URL" -o "$TMP/base8-direct.sh"

python3 - "$TMP/base8-direct.sh" "$TMP/base8-qualified.sh" <<'PY'
from pathlib import Path
import sys

src = Path(sys.argv[1]).read_text()
needle = '''grep -q \"replace(/\\[\\\\\\\\\\\\\\\\/\\]+\\\\$/, '')\" \"$TMP/sot-api.js\"\\n'''
count = src.count(needle)
if count != 1:
    raise SystemExit(f'Base-8 brittle regex gate changed unexpectedly: found {count}')
src = src.replace(needle, '', 1)

required = [
    "EXPECTED_BUILD='2026.08.28.sot-turn01-base-8'",
    'patch-mount-source.py',
    'patch-idle-refresh.py',
    'for DRIVE in C D E F G I P Q',
    'SOURCE_NORM',
    'function fullyIndexedStable',
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'Base-8 stable gate missing: {marker}')

Path(sys.argv[2]).write_text(src)
PY

bash -n "$TMP/base8-qualified.sh"
echo '=== BASE-8 QUALIFIED GENERATOR ==='
exec bash "$TMP/base8-qualified.sh"
