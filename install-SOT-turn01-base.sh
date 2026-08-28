#!/usr/bin/env bash
set -euo pipefail

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Base-5 is failed evidence and is never installed directly by this wrapper.
# Rebuild its installer definition, apply only the WSL2 9p mount correction,
# and let the generated installer retain the existing archive/rollback/gates.
BASE5_WRAPPER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/a38287b25097289369ff92651e58654aec0dd69c/install-SOT-turn01-base.sh'
INSTALLER_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/6cf85fc3f200f652b877e8eaed30586e594d4abf/patch-SOT-turn01-base-installer-wsl9p.py'
WSL9P_PATCH_URL='https://raw.githubusercontent.com/acmeproducts/stuff/f60d33eb5f1deaa250637a9e35f59a516ce73d96/patch-SOT-turn01-base-wsl9p.py'

curl --max-time 30 -fsSL "$BASE5_WRAPPER_URL" -o "$TMP/base5-wrapper.sh"
curl --max-time 30 -fsSL "$INSTALLER_PATCH_URL" -o "$TMP/patch-installer.py"
curl --max-time 30 -fsSL "$WSL9P_PATCH_URL" -o "$TMP/patch-wsl9p.py"

python3 "$TMP/patch-installer.py" "$TMP/base5-wrapper.sh" "$TMP/base6-wrapper.sh" "$WSL9P_PATCH_URL"
bash -n "$TMP/base6-wrapper.sh"
grep -q "2026.08.28.sot-turn01-base-6" "$TMP/base6-wrapper.sh"
grep -q "fstype === '9p' || fstype === 'drvfs'" "$TMP/patch-wsl9p.py"
grep -q 'FSTYPE.*9p' "$TMP/base6-wrapper.sh"
grep -q 'FSTYPE.*drvfs' "$TMP/base6-wrapper.sh"

exec bash "$TMP/base6-wrapper.sh"
