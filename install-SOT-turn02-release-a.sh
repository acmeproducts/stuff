#!/usr/bin/env bash
set -euo pipefail

REF="338ef8d59d4c830a506c7e32db0ea92db61589ca"
ROOT="$HOME/.sot-turn02/release-a"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
SERVICE_NEW="sot-turn02-release-a.service"
SERVICE_OLD="sot-turn02-v8-clean3.service"
UNIT_PATH="$HOME/.config/systemd/user/$SERVICE_NEW"
DB11="$HOME/.sot-turn02/sot-v11-clean.db"
DB12="$HOME/.sot-turn02/sot-v12-release-a.db"
STAGE="$(mktemp -d "$HOME/.sot-turn02/release-a-stage.XXXXXXXX")"
PREV_DIR=""
UNIT_PREV=""
DB12_BACKUP=""
CURRENT_RELEASE_ACTIVE=0
OLD_ACTIVE=0
ROLLBACK_ARMED=0

cleanup() {
  rm -rf "$STAGE" 2>/dev/null || true
  [[ -n "$UNIT_PREV" ]] && rm -f "$UNIT_PREV" 2>/dev/null || true
  [[ -n "$DB12_BACKUP" ]] && rm -f "$DB12_BACKUP" 2>/dev/null || true
}

rollback() {
  set +e
  echo "Release A update failed; restoring the previously running SOT runtime." >&2
  systemctl --user stop "$SERVICE_NEW" >/dev/null 2>&1 || true
  rm -rf "$ROOT/SOT" 2>/dev/null || true
  if [[ -n "$PREV_DIR" && -d "$PREV_DIR" ]]; then
    mv "$PREV_DIR" "$ROOT/SOT"
  fi
  if [[ -n "$UNIT_PREV" && -f "$UNIT_PREV" ]]; then
    cp -a "$UNIT_PREV" "$UNIT_PATH"
  fi
  if [[ -n "$DB12_BACKUP" && -f "$DB12_BACKUP" ]]; then
    cp -f "$DB12_BACKUP" "$DB12"
  fi
  systemctl --user daemon-reload >/dev/null 2>&1 || true
  if [[ "$CURRENT_RELEASE_ACTIVE" -eq 1 ]]; then
    systemctl --user enable "$SERVICE_NEW" >/dev/null 2>&1 || true
    systemctl --user restart "$SERVICE_NEW" >/dev/null 2>&1 || true
  elif [[ "$OLD_ACTIVE" -eq 1 ]]; then
    systemctl --user enable "$SERVICE_OLD" >/dev/null 2>&1 || true
    systemctl --user restart "$SERVICE_OLD" >/dev/null 2>&1 || true
  fi
}

trap 'rc=$?; if [[ "$ROLLBACK_ARMED" -eq 1 ]]; then rollback; fi; cleanup; exit $rc' ERR
trap 'cleanup' EXIT

mkdir -p "$STAGE/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"

FILES=(
  "sot-turn02-release-a-engine.py"
  "sot-turn02-release-a-server.py"
  "sot-turn02-release-a.service"
  "sot-turn02-pre-base-release-a.html"
  "qualify-release-a.py"
)
for f in "${FILES[@]}"; do
  curl -fsSL "$BASE/SOT/$f" -o "$STAGE/SOT/$f"
done

python3 -m py_compile   "$STAGE/SOT/sot-turn02-release-a-engine.py"   "$STAGE/SOT/sot-turn02-release-a-server.py"   "$STAGE/SOT/qualify-release-a.py"

python3 "$STAGE/SOT/qualify-release-a.py"

python3 - "$STAGE/SOT/sot-turn02-pre-base-release-a.html" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
assert "SOT Turn 02 Release A" in s
assert "const names=['Estate','Analyze','Database','Grid','Plan','Activity']" in s
assert "<b>Evidence Database</b>" not in s
assert "onclick=\"runOmni()\">Go</button>" not in s
assert "o.addEventListener('blur'" in s
assert ".dbgrid tbody tr:nth-child(odd)" in s and ".dbgrid tbody tr:nth-child(even)" in s
assert ".dbgrid tbody tr:hover td{background:#fff!important;color:#000!important}" in s
assert "toggleExportMenu()" in s and "function chooseExport(kind)" in s
assert "tag-modal-x" in s and 'autocapitalize="none"' in s
assert ".map(x=>x.trim().toLowerCase())" in s
assert "{ok:'Close',hideCancel:true}" not in s
js=s.rsplit("<script>",1)[1].split("</script>",1)[0]
Path("/tmp/sot-release-a.js").write_text(js)
print("PASS compact Database + lowercase-tag UI contract")
PY
if command -v node >/dev/null 2>&1; then
  node --check /tmp/sot-release-a.js
  echo "PASS Release A browser JavaScript syntax"
fi

if systemctl --user is-active --quiet "$SERVICE_NEW"; then
  CURRENT_RELEASE_ACTIVE=1
fi
if systemctl --user is-active --quiet "$SERVICE_OLD"; then
  OLD_ACTIVE=1
fi

DB11_SUM=""
if [[ -f "$DB11" ]]; then
  DB11_SUM="$(sha256sum "$DB11" | awk '{print $1}')"
fi

ROLLBACK_ARMED=1
systemctl --user stop "$SERVICE_NEW" >/dev/null 2>&1 || true
systemctl --user stop "$SERVICE_OLD" >/dev/null 2>&1 || true

if [[ -f "$DB12" ]]; then
  DB12_BACKUP="$(mktemp "$HOME/.sot-turn02/sot-v12-release-a.rollback.XXXXXXXX.db")"
  python3 - "$DB12" "$DB12_BACKUP" <<'PY'
import sqlite3,sys
src,dst=sys.argv[1:3]
a=sqlite3.connect(src);b=sqlite3.connect(dst)
try:a.backup(b);b.commit()
finally:b.close();a.close()
print("PASS Release A database rollback snapshot")
PY
fi

mkdir -p "$ROOT"
if [[ -d "$ROOT/SOT" ]]; then
  PREV_DIR="$ROOT/SOT.previous.$(date +%s)"
  mv "$ROOT/SOT" "$PREV_DIR"
fi
if [[ -f "$UNIT_PATH" ]]; then
  UNIT_PREV="$(mktemp "$HOME/.sot-turn02/release-a-unit.XXXXXXXX")"
  cp -a "$UNIT_PATH" "$UNIT_PREV"
fi

mv "$STAGE/SOT" "$ROOT/SOT"
install -m 0644 "$ROOT/SOT/$SERVICE_NEW" "$UNIT_PATH"
systemctl --user daemon-reload
systemctl --user enable "$SERVICE_NEW" >/dev/null
systemctl --user restart "$SERVICE_NEW"

rm -f /tmp/sot-release-a-health.json
for _ in $(seq 1 100); do
  if curl -fsS --max-time 2 http://127.0.0.1:8765/api/health > /tmp/sot-release-a-health.json 2>/dev/null; then
    break
  fi
  sleep .25
done
test -s /tmp/sot-release-a-health.json

python3 - <<'PY'
import json,urllib.request
h=json.load(open("/tmp/sot-release-a-health.json"))
assert h["ok"] and h["version"]=="turn02-release-a" and h["schema"]==12 and h["process"]=="healthy",h
assert "catalog_revision" in h,h
p=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/placements",timeout=15))
assert p["ok"] and "catalog_revision" in p and isinstance(p["placements"],list),p
q=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/plan",timeout=15))
assert q["ok"],q
plan=q["plan"]
a=plan["analysis"]; c=plan["capacity"]; o=plan["operations"]
assert a["unique"]["bytes"]+a["keep"]["bytes"]+a["excess"]["bytes"]==a["estate"]["bytes"],a
if c["configured"]:
    assert c["estate"]["bytes"]+c["open"]["bytes"]==c["target"]["bytes"],c
assert o["in_play"]["bytes"]+o["landed"]["bytes"]==o["estate"]["bytes"],o
print("PASS local Release A health + placements + additive Plan")
PY

if [[ -n "$DB11_SUM" ]]; then
  test -f "$DB11"
  test "$(sha256sum "$DB11" | awk '{print $1}')" = "$DB11_SUM"
  echo "PASS predecessor v11 database preserved byte-for-byte"
fi
test -f "$DB12"
echo "PASS Release A schema-12 database present"

DNS="$(tailscale status --json | python3 -c 'import json,sys;print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
SERVE="$(tailscale serve status 2>&1)"
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:18789" >/dev/null
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:18080" >/dev/null
printf '%s\n' "$SERVE" | grep -F "127.0.0.1:8765" >/dev/null
echo "PASS existing OpenClaw/report/SOT Tailscale routes preserved"

curl -fsS --max-time 10 "https://$DNS/" >/dev/null
curl -fsS --max-time 10 "https://$DNS/report/" >/dev/null
curl -fsS --max-time 10 "https://$DNS/sot/api/health" > /tmp/sot-release-a-https.json

python3 - <<'PY'
import json
h=json.load(open("/tmp/sot-release-a-https.json"))
assert h["ok"] and h["version"]=="turn02-release-a" and h["schema"]==12,h
print("PASS shared-origin /sot Release A HTTPS health")
PY

systemctl --user disable "$SERVICE_OLD" >/dev/null 2>&1 || true
ROLLBACK_ARMED=0

[[ -n "$PREV_DIR" && -d "$PREV_DIR" ]] && rm -rf "$PREV_DIR"
[[ -n "$DB12_BACKUP" && -f "$DB12_BACKUP" ]] && rm -f "$DB12_BACKUP" && DB12_BACKUP=""
[[ -n "$UNIT_PREV" && -f "$UNIT_PREV" ]] && rm -f "$UNIT_PREV" && UNIT_PREV=""

ENC_API="https%3A%2F%2F${DNS}%2Fsot"
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-release-a.html?v=%s&api=%s\n' "$REF" "$ENC_API"
printf 'QUALIFIED_REF %s\n' "$REF"
