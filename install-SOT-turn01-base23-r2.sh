#!/usr/bin/env bash
set -Eeuo pipefail

INNER_URL='https://raw.githubusercontent.com/acmeproducts/stuff/ce901c5ef0164a65fefa83b99b8b97fd8bbfcd36/install-SOT-turn01-base23.sh'
EXPECTED_INNER_SHA='02212e67f16542cebf14922c591c82e6427115f7'
TMP="$(mktemp)"
CHILD=''

cleanup_file(){ rm -f "$TMP"; }
interrupt(){
  printf '\n=== BASE-23 QUALIFICATION INTERRUPTED ===\n' >&2
  if [ -n "$CHILD" ]; then
    kill -TERM -- "-$CHILD" 2>/dev/null || true
    sleep 1
    kill -KILL -- "-$CHILD" 2>/dev/null || true
  fi
  cleanup_file
  trap - INT TERM EXIT
  exit 130
}
trap interrupt INT TERM
trap cleanup_file EXIT

curl --max-time 30 -fsSL "$INNER_URL" -o "$TMP"
bash -n "$TMP"
actual="$(git hash-object "$TMP")"
if [ "$actual" != "$EXPECTED_INNER_SHA" ]; then
  printf 'Base-23 inner qualifier identity mismatch: expected %s got %s\n' "$EXPECTED_INNER_SHA" "$actual" >&2
  exit 1
fi
printf '=== TURN 01 BASE-23 QUALIFIER R2 ===\n'
printf 'interrupt handling: process-group TERM/KILL, exit 130\n'
printf 'product inputs: unchanged\n'

setsid env SOT_INSTALLER_COMMIT="${SOT_INSTALLER_COMMIT:-UNSPECIFIED}" bash "$TMP" &
CHILD=$!
set +e
wait "$CHILD"
rc=$?
set -e
CHILD=''
exit "$rc"
