#!/usr/bin/env bash
set -euo pipefail

RUNTIME_REF="3f1be97fe9fa425a6263c3f291bd4037e1497b95"
UI_REF="62c7b01a6f2b33acd9dce0915ab393903518af75"
ROOT="$HOME/.sot-turn02/release-a"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$RUNTIME_REF"
SERVICE_NEW="sot-turn02-release-a.service"
SERVICE_OLD="sot-turn02-v8-clean3.service"
DB11="$HOME/.sot-turn02/sot-v11-clean.db"
DB12="$HOME/.sot-turn02/sot-v12-release-a.db"
ARCHIVE_ROOT="$HOME/.sot-turn02/archive/release-a-cutover"
CUTOVER_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"

mkdir -p "$ROOT/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02" "$ARCHIVE_ROOT"

FILES=(
  "sot-turn02-release-a-engine.py"
  "sot-turn02-release-a-server.py"
  "sot-turn02-release-a.service"
  "sot-turn02-pre-base-release-a.html"
  "qualify-release-a.py"
)
for f in "${FILES[@]}"; do
  curl -fsSL "$BASE/SOT/$f" -o "$ROOT/SOT/$f"
done

echo "STAGE pre-cutover qualification"
python3 -m py_compile   "$ROOT/SOT/sot-turn02-release-a-engine.py"   "$ROOT/SOT/sot-turn02-release-a-server.py"   "$ROOT/SOT/qualify-release-a.py"
python3 "$ROOT/SOT/qualify-release-a.py"

python3 - "$ROOT/SOT/sot-turn02-pre-base-release-a.html" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
assert "SOT Turn 02 Release A" in s
assert "const names=['Estate','Analyze','Database','Grid','Plan','Activity']" in s
assert 'type="range" min="1" max="10" step="1"' in s
assert "Edit Tags" in s and "Edit Notes & Ratings" in s
assert "db-selected" in s
assert "subnav(['Analysis','Capacity','Operations']" in s
assert "IN PLAY - LANDED" not in s
js=s.rsplit("<script>",1)[1].split("</script>",1)[0]
Path("/tmp/sot-release-a.js").write_text(js)
print("PASS Release A governed UI markers")
PY
if command -v node >/dev/null 2>&1; then
  node --check /tmp/sot-release-a.js
  echo "PASS Release A browser JavaScript syntax"
fi

install -m 0644 "$ROOT/SOT/$SERVICE_NEW" "$HOME/.config/systemd/user/$SERVICE_NEW"

OLD_ACTIVE=0
if systemctl --user is-active --quiet "$SERVICE_OLD"; then
  OLD_ACTIVE=1
fi

archive_db12() {
  local reason="$1"
  local found=0
  for suffix in "" "-wal" "-shm"; do
    if [[ -e "${DB12}${suffix}" ]]; then found=1; break; fi
  done
  if [[ "$found" -eq 0 ]]; then return 0; fi
  local dir="$ARCHIVE_ROOT/${CUTOVER_ID}-${reason}"
  mkdir -p "$dir"
  for suffix in "" "-wal" "-shm"; do
    if [[ -e "${DB12}${suffix}" ]]; then
      mv "${DB12}${suffix}" "$dir/$(basename "${DB12}${suffix}")"
    fi
  done
  printf 'ARCHIVED_SCHEMA12 %s\n' "$dir"
}

DB11_SUM=""
ROLLBACK_ARMED=0
rollback() {
  local rc=$?
  set +e
  echo "Release A cutover failed; preserving failed schema-12 attempt and restoring prior SOT service." >&2
  systemctl --user disable --now "$SERVICE_NEW" >/dev/null 2>&1 || true
  archive_db12 "rollback" >/dev/null 2>&1 || true
  if [[ "$OLD_ACTIVE" -eq 1 ]]; then
    systemctl --user enable "$SERVICE_OLD" >/dev/null 2>&1 || true
    systemctl --user restart "$SERVICE_OLD" >/dev/null 2>&1 || true
  fi
  exit "$rc"
}
trap 'if [[ "$ROLLBACK_ARMED" -eq 1 ]]; then rollback; fi' ERR

echo "STAGE cutover begin"
ROLLBACK_ARMED=1

if [[ "$OLD_ACTIVE" -eq 1 ]]; then
  systemctl --user stop "$SERVICE_OLD"
fi

echo "STAGE predecessor stabilize"
if [[ -f "$DB11" ]]; then
  python3 - "$DB11" <<'PY'
import sqlite3,sys
p=sys.argv[1]
c=sqlite3.connect("file:"+p+"?mode=ro",uri=True,timeout=30)
try:
    q=c.execute("PRAGMA quick_check").fetchone()[0]
    assert q=="ok",q
    tables={r[0] for r in c.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    required={"sources","jobs","job_sources","placements","events"}
    missing=required-tables
    assert not missing,missing
    print("PASS stabilized predecessor v11 quick_check")
finally:
    c.close()
PY
  DB11_SUM="$(sha256sum "$DB11" | awk '{print $1}')"
  sleep 0.5
  test "$(sha256sum "$DB11" | awk '{print $1}')" = "$DB11_SUM"
  echo "PASS predecessor v11 checksum captured after service stop"
fi

archive_db12 "pre-retry"

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
  echo "PASS stabilized predecessor v11 remained byte-for-byte unchanged during migration"
fi
test -f "$DB12"
echo "PASS fresh Release A schema-12 database exists"

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

if [[ "$OLD_ACTIVE" -eq 1 ]]; then
  systemctl --user disable "$SERVICE_OLD" >/dev/null 2>&1 || true
fi
ROLLBACK_ARMED=0
trap - ERR

ENC_API="https%3A%2F%2F${DNS}%2Fsot"
printf 'APP https://acmeproducts.github.io/stuff/SOT/sot-turn02-pre-base-release-a1.html?v=%s&api=%s\n' "$UI_REF" "$ENC_API"
printf 'RUNTIME_REF %s\n' "$RUNTIME_REF"
printf 'CUTOVER PASS\n'
