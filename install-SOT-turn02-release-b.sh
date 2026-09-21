#!/usr/bin/env bash
set -euo pipefail

REF="3c329c691e065a3e3c4845a0d0e0e765d0885fee"
ROOT="$HOME/.sot-turn02/release-b"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
SERVICE_NEW="sot-turn02-release-b.service"
SERVICE_A="sot-turn02-release-a.service"
UNIT_NEW="$HOME/.config/systemd/user/$SERVICE_NEW"
DB12="$HOME/.sot-turn02/sot-v12-release-a.db"
DB13="$HOME/.sot-turn02/sot-v13-release-b.db"
STAGE="$(mktemp -d "$HOME/.sot-turn02/release-b-stage.XXXXXXXX")"
PREV_DIR=""
UNIT_PREV=""
DB13_BACKUP=""
DB13_ARCHIVE=""
B_ACTIVE=0
A_ACTIVE=0
ROLLBACK_ARMED=0

cleanup(){
  rm -rf "$STAGE" 2>/dev/null || true
  [[ -n "$UNIT_PREV" ]] && rm -f "$UNIT_PREV" 2>/dev/null || true
  [[ -n "$DB13_BACKUP" ]] && rm -f "$DB13_BACKUP" 2>/dev/null || true
}

rollback(){
  set +e
  echo "Release B cutover failed; restoring previous SOT runtime." >&2
  systemctl --user stop "$SERVICE_NEW" >/dev/null 2>&1 || true
  rm -rf "$ROOT/SOT" 2>/dev/null || true
  if [[ -n "$PREV_DIR" && -d "$PREV_DIR" ]]; then mv "$PREV_DIR" "$ROOT/SOT"; fi
  if [[ -n "$UNIT_PREV" && -f "$UNIT_PREV" ]]; then cp -a "$UNIT_PREV" "$UNIT_NEW"; fi
  if [[ -n "$DB13_BACKUP" && -f "$DB13_BACKUP" ]]; then cp -f "$DB13_BACKUP" "$DB13"; fi
  if [[ -n "$DB13_ARCHIVE" && -f "$DB13_ARCHIVE" && ! -f "$DB13" ]]; then cp -f "$DB13_ARCHIVE" "$DB13"; fi
  systemctl --user daemon-reload >/dev/null 2>&1 || true
  if [[ "$B_ACTIVE" -eq 1 ]]; then
    systemctl --user enable "$SERVICE_NEW" >/dev/null 2>&1 || true
    systemctl --user restart "$SERVICE_NEW" >/dev/null 2>&1 || true
  elif [[ "$A_ACTIVE" -eq 1 ]]; then
    systemctl --user enable "$SERVICE_A" >/dev/null 2>&1 || true
    systemctl --user restart "$SERVICE_A" >/dev/null 2>&1 || true
  fi
}

trap 'rc=$?; if [[ "$ROLLBACK_ARMED" -eq 1 ]]; then rollback; fi; cleanup; exit $rc' ERR
trap 'cleanup' EXIT

mkdir -p "$STAGE/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"

FILES=(
  "sot-turn02-release-a-engine.py"
  "sot-turn02-release-b-engine.py"
  "sot-turn02-release-b-ai.py"
  "sot-turn02-release-b-server.py"
  "sot-turn02-release-b.service"
  "sot-turn02-release-b.html"
  "qualify-release-b.py"
)
for f in "${FILES[@]}"; do
  curl -fsSL "$BASE/SOT/$f" -o "$STAGE/SOT/$f"
done

python3 -m py_compile   "$STAGE/SOT/sot-turn02-release-b-engine.py"   "$STAGE/SOT/sot-turn02-release-b-ai.py"   "$STAGE/SOT/sot-turn02-release-b-server.py"   "$STAGE/SOT/qualify-release-b.py"

python3 "$STAGE/SOT/qualify-release-b.py"

python3 - "$STAGE/SOT/sot-turn02-release-b.html" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
assert "SOT Turn 02 Release B" in s
assert "const names=['Estate','Analyze','Database','Grid','Plan','AI','Activity']" in s
assert "Apply approved tags" in s
assert "['path','Folder']" in s
assert ".dbgrid tbody tr:nth-child(odd) td{background:#343a40;color:#fff}" in s
assert ".dbgrid tbody tr:nth-child(even) td{background:#fff;color:#343a40}" in s
js=s.rsplit("<script>",1)[1].split("</script>",1)[0]
Path("/tmp/sot-release-b.js").write_text(js)
print("PASS Release B governed UI markers")
PY
if command -v node >/dev/null 2>&1; then node --check /tmp/sot-release-b.js; fi

if systemctl --user is-active --quiet "$SERVICE_NEW"; then B_ACTIVE=1; fi
if systemctl --user is-active --quiet "$SERVICE_A"; then A_ACTIVE=1; fi

ROLLBACK_ARMED=1
systemctl --user stop "$SERVICE_NEW" >/dev/null 2>&1 || true
systemctl --user stop "$SERVICE_A" >/dev/null 2>&1 || true

test -f "$DB12"
DB12_SUM="$(sha256sum "$DB12" | awk '{print $1}')"
echo "PASS stabilized Release A database found"

if [[ -f "$DB13" ]]; then
  DB13_BACKUP="$(mktemp "$HOME/.sot-turn02/sot-v13-release-b.rollback.XXXXXXXX.db")"
  python3 - "$DB13" "$DB13_BACKUP" <<'PY'
import sqlite3,sys
a=sqlite3.connect(sys.argv[1]);b=sqlite3.connect(sys.argv[2])
try:a.backup(b);b.commit()
finally:b.close();a.close()
print("PASS existing Release B database rollback snapshot")
PY
  if [[ "$B_ACTIVE" -eq 0 ]]; then
    DB13_ARCHIVE="$HOME/.sot-turn02/sot-v13-release-b.failed-$(date +%Y%m%d-%H%M%S).db"
    mv "$DB13" "$DB13_ARCHIVE"
    echo "PASS prior inactive schema-13 attempt archived"
  fi
fi

mkdir -p "$ROOT"
if [[ -d "$ROOT/SOT" ]]; then PREV_DIR="$ROOT/SOT.previous.$(date +%s)"; mv "$ROOT/SOT" "$PREV_DIR"; fi
if [[ -f "$UNIT_NEW" ]]; then UNIT_PREV="$(mktemp "$HOME/.sot-turn02/release-b-unit.XXXXXXXX")"; cp -a "$UNIT_NEW" "$UNIT_PREV"; fi

mv "$STAGE/SOT" "$ROOT/SOT"
install -m 0644 "$ROOT/SOT/$SERVICE_NEW" "$UNIT_NEW"
systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NEW" >/dev/null
systemctl --user restart "$SERVICE_NEW"

rm -f /tmp/sot-release-b-health.json
for _ in $(seq 1 120); do
  if curl -fsS --max-time 2 http://127.0.0.1:8765/api/health > /tmp/sot-release-b-health.json 2>/dev/null; then break; fi
  sleep .25
done
test -s /tmp/sot-release-b-health.json

python3 - <<'PY'
import json,urllib.request
h=json.load(open("/tmp/sot-release-b-health.json"))
assert h["ok"] and h["version"]=="turn02-release-b" and h["schema"]==13 and h["process"]=="healthy",h
p=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/placements",timeout=15))
assert p["ok"] and isinstance(p["placements"],list)
a=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/ai/tasks",timeout=15))
assert a["ok"] and len(a["task_types"])==6 and isinstance(a["tasks"],list),a
q=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/plan",timeout=15))["plan"]
assert q["analysis"]["unique"]["bytes"]+q["analysis"]["keep"]["bytes"]+q["analysis"]["excess"]["bytes"]==q["analysis"]["estate"]["bytes"]
if q["capacity"]["configured"]:
    assert q["capacity"]["estate"]["bytes"]+q["capacity"]["open"]["bytes"]==q["capacity"]["target"]["bytes"]
assert q["operations"]["in_play"]["bytes"]+q["operations"]["landed"]["bytes"]==q["operations"]["estate"]["bytes"]
print("PASS Release B health + Database + task catalog + additive Plan")
PY

test "$(sha256sum "$DB12" | awk '{print $1}')" = "$DB12_SUM"
test -f "$DB13"
echo "PASS Release A predecessor preserved and schema-13 database active"

DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
SERVE="$(tailscale serve status 2>&1)"
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:18789" >/dev/null
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:18080" >/dev/null
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:8765" >/dev/null
curl -fsS --max-time 10 "https://$DNS/" >/dev/null
curl -fsS --max-time 10 "https://$DNS/report/" >/dev/null
curl -fsS --max-time 10 "https://$DNS/sot/api/health" > /tmp/sot-release-b-https.json
python3 - <<'PY'
import json
h=json.load(open("/tmp/sot-release-b-https.json"))
assert h["ok"] and h["version"]=="turn02-release-b" and h["schema"]==13,h
print("PASS existing access plane + shared-origin Release B HTTPS")
PY

systemctl --user disable "$SERVICE_A" >/dev/null 2>&1 || true
ROLLBACK_ARMED=0
[[ -n "$PREV_DIR" && -d "$PREV_DIR" ]] && rm -rf "$PREV_DIR"
[[ -n "$DB13_BACKUP" && -f "$DB13_BACKUP" ]] && rm -f "$DB13_BACKUP" && DB13_BACKUP=""
[[ -n "$UNIT_PREV" && -f "$UNIT_PREV" ]] && rm -f "$UNIT_PREV" && UNIT_PREV=""

ENC_API="https%3A%2F%2F${DNS}%2Fsot"
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-release-b.html?v=%s&api=%s\n' "$REF" "$ENC_API"
printf 'QUALIFIED_REF %s\n' "$REF"
