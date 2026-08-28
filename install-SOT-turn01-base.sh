#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Rebuild from the accepted pre-base lineage through the mechanically checked
# Base-6 generator, then apply the two scoped Base-7 deltas before any live
# cutover: full real-volume inventory and completed-project idle refresh.
BASE6_GENERATOR_URL='https://raw.githubusercontent.com/acmeproducts/stuff/e182835393f1ab7b9c2508684275b06d476e37f7/install-SOT-turn01-base.sh'
WRAPPER7_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/7e44fdf2fb5ef962102a35999f7014caedf1eab7/patch-SOT-turn01-base-wrapper7.py'

curl --max-time 30 -fsSL "$BASE6_GENERATOR_URL" -o "$TMP/base6-generator.sh"
curl --max-time 30 -fsSL "$WRAPPER7_PATCH_URL" -o "$TMP/patch-wrapper7.py"

# Intercept the generated Base-6 wrapper before execution. Base-6 remains an
# intermediate build artifact only; it is never installed live by this wrapper.
python3 - "$TMP/base6-generator.sh" "$TMP/base7-generator.sh" "$WRAPPER7_PATCH_URL" <<'PY'
from pathlib import Path
import sys
src=Path(sys.argv[1]).read_text()
patch_url=sys.argv[3]
old='exec bash "$TMP/base6-wrapper.sh"'
new=f'''curl --max-time 30 -fsSL "{patch_url}" -o "$TMP/patch-wrapper7.py"\npython3 "$TMP/patch-wrapper7.py" "$TMP/base6-wrapper.sh" "$TMP/base7-wrapper.sh"\nbash -n "$TMP/base7-wrapper.sh"\ngrep -q "2026.08.28.sot-turn01-base-7" "$TMP/base7-wrapper.sh"\ngrep -q "patch-SOT-turn01-base-volume-union.py" "$TMP/base7-wrapper.sh"\ngrep -q "patch-SOT-turn01-base-idle-refresh.py" "$TMP/base7-wrapper.sh"\nexec bash "$TMP/base7-wrapper.sh"'''
if src.count(old)!=1:
    raise SystemExit(f'Base-6 execution anchor changed unexpectedly: {src.count(old)}')
src=src.replace(old,new,1)
Path(sys.argv[2]).write_text(src)
PY

bash -n "$TMP/base7-generator.sh"
grep -q 'patch-wrapper7.py' "$TMP/base7-generator.sh"

exec bash "$TMP/base7-generator.sh"
