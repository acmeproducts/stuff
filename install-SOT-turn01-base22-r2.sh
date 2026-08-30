#!/usr/bin/env bash
set -Eeuo pipefail

# Base-22 product inputs are unchanged. This wrapper corrects only the
# qualification harness pre-health gate after the 2026-08-30 12:54 PDT
# owner-machine run proved that a single 5-second request can time out before
# any candidate work begins.

TMP="$(mktemp -d)"
cleanup(){ rm -rf "$TMP"; }
trap cleanup EXIT

ORIGINAL_COMMIT='39f3b0d27a06c7ad75ac084284ca8917a8a83e0d'
ORIGINAL_URL="https://raw.githubusercontent.com/acmeproducts/stuff/${ORIGINAL_COMMIT}/install-SOT-turn01-base22.sh"
ORIGINAL="$TMP/original.sh"
PATCHED="$TMP/base22-r2.sh"

curl --max-time 30 -fsSL "$ORIGINAL_URL" -o "$ORIGINAL"

python3 - "$ORIGINAL" "$PATCHED" <<'PY'
from pathlib import Path
import sys
src = Path(sys.argv[1]).read_text()
old = '''code="$(curl --max-time 5 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)"; [ "$code" = 200 ]&&pass PRE_HEALTH_HTTP HTTP=200||fail PRE_HEALTH_HTTP "HTTP=$code"
meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" )"; IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"; [ "$CURRENT_BUILD" = "$EXPECTED_PRE_BUILD" ]&&pass PRE_BUILD "$CURRENT_BUILD"||fail PRE_BUILD "expected=$EXPECTED_PRE_BUILD got=$CURRENT_BUILD"; [ "$CURRENT_SCHEMA" = 4 ]&&pass PRE_SCHEMA 4||fail PRE_SCHEMA "$CURRENT_SCHEMA"; [ "$CURRENT_STATUS" = ok ]&&pass PRE_STATUS ok||fail PRE_STATUS "$CURRENT_STATUS"
'''
new = '''code=000
for i in {1..20}; do
  code="$(curl --max-time 3 -sS -o "$QUAL_DIR/pre-health.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  info PRE_HEALTH_ATTEMPT "attempt=$i HTTP=$code"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] && pass PRE_HEALTH_HTTP HTTP=200 || fail PRE_HEALTH_HTTP "HTTP=$code after 20 attempts"
if meta="$(python3 -c "import json;x=json.load(open('$QUAL_DIR/pre-health.json'));print(str(x.get('build',''))+'|'+str(x.get('database_version',''))+'|'+str(x.get('status','')))" 2>&1)"; then
  pass PRE_HEALTH_PARSE "$meta"
else
  fail PRE_HEALTH_PARSE "$meta"
fi
IFS='|' read -r CURRENT_BUILD CURRENT_SCHEMA CURRENT_STATUS <<< "$meta"
[ "$CURRENT_BUILD" = "$EXPECTED_PRE_BUILD" ] && pass PRE_BUILD "$CURRENT_BUILD" || fail PRE_BUILD "expected=$EXPECTED_PRE_BUILD got=$CURRENT_BUILD"
[ "$CURRENT_SCHEMA" = 4 ] && pass PRE_SCHEMA 4 || fail PRE_SCHEMA "$CURRENT_SCHEMA"
[ "$CURRENT_STATUS" = ok ] && pass PRE_STATUS ok || fail PRE_STATUS "$CURRENT_STATUS"
'''
if src.count(old) != 1:
    raise SystemExit(f'Base-22 pre-health block changed unexpectedly: count={src.count(old)}')
src = src.replace(old, new, 1)
marker = "echo '=== TURN 01 BASE-22 CANONICAL STORAGE QUALIFICATION ==='\n"
if src.count(marker) != 1:
    raise SystemExit('qualification marker changed unexpectedly')
src = src.replace(marker, marker + "pass QUALIFICATION_HARNESS_REVISION 'r2 bounded pre-health retry; Base-22 product inputs unchanged'\n", 1)
Path(sys.argv[2]).write_text(src)
PY

bash -n "$PATCHED"
exec bash "$PATCHED"
