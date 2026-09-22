#!/usr/bin/env bash
set -euo pipefail

REF="bf0715b0700d805877fe756ece092529402941cb"
ROOT="$HOME/.sot-turn02/release-c"
BASE="https://raw.githubusercontent.com/acmeproducts/stuff/$REF"
SERVICE_C="sot-turn02-release-c.service"
SERVICE_B="sot-turn02-release-b.service"
UNIT_C="$HOME/.config/systemd/user/$SERVICE_C"
DB12="$HOME/.sot-turn02/sot-v12-release-a.db"
DB13="$HOME/.sot-turn02/sot-v13-release-b.db"
STAGE="$(mktemp -d "$HOME/.sot-turn02/release-c-stage.XXXXXXXX")"
PREV_DIR=""
UNIT_PREV=""
DB_BACKUP=""
HELPER_BACKUP=""
SUDOERS_BACKUP=""
HELPER_PATH="/usr/local/sbin/sot-mount-drive"
SUDOERS_PATH="/etc/sudoers.d/sot-mount-drive"
C_ACTIVE=0
B_ACTIVE=0
ROLLBACK_ARMED=0

cleanup(){
  rm -rf "$STAGE" 2>/dev/null || true
  [[ -n "$UNIT_PREV" ]] && rm -f "$UNIT_PREV" 2>/dev/null || true
  [[ -n "$DB_BACKUP" ]] && rm -f "$DB_BACKUP" 2>/dev/null || true
  [[ -n "$HELPER_BACKUP" ]] && rm -f "$HELPER_BACKUP" 2>/dev/null || true
  [[ -n "$SUDOERS_BACKUP" ]] && rm -f "$SUDOERS_BACKUP" 2>/dev/null || true
}
rollback(){
  set +e
  echo "Release C cutover failed; restoring previous SOT runtime." >&2
  systemctl --user stop "$SERVICE_C" >/dev/null 2>&1 || true
  rm -rf "$ROOT/SOT" 2>/dev/null || true
  if [[ -n "$PREV_DIR" && -d "$PREV_DIR" ]]; then mv "$PREV_DIR" "$ROOT/SOT"; fi
  if [[ -n "$UNIT_PREV" && -f "$UNIT_PREV" ]]; then cp -a "$UNIT_PREV" "$UNIT_C"; else rm -f "$UNIT_C"; fi
  if [[ -n "$DB_BACKUP" && -f "$DB_BACKUP" ]]; then cp -f "$DB_BACKUP" "$DB13"; fi
  if [[ -n "$HELPER_BACKUP" && -f "$HELPER_BACKUP" ]]; then sudo install -o root -g root -m 0755 "$HELPER_BACKUP" "$HELPER_PATH"; fi
  if [[ -n "$SUDOERS_BACKUP" && -f "$SUDOERS_BACKUP" ]]; then sudo install -o root -g root -m 0440 "$SUDOERS_BACKUP" "$SUDOERS_PATH"; fi
  systemctl --user daemon-reload >/dev/null 2>&1 || true
  if [[ "$C_ACTIVE" -eq 1 ]]; then systemctl --user enable "$SERVICE_C" >/dev/null 2>&1 || true; systemctl --user restart "$SERVICE_C" >/dev/null 2>&1 || true
  elif [[ "$B_ACTIVE" -eq 1 ]]; then systemctl --user enable "$SERVICE_B" >/dev/null 2>&1 || true; systemctl --user restart "$SERVICE_B" >/dev/null 2>&1 || true
  fi
}
trap 'rc=$?; if [[ "$ROLLBACK_ARMED" -eq 1 ]]; then rollback; fi; cleanup; exit $rc' ERR
trap cleanup EXIT

mkdir -p "$STAGE/SOT" "$HOME/.config/systemd/user" "$HOME/.sot-turn02"
FILES=(
  "sot-turn02-release-a-engine.py"
  "sot-turn02-release-c-engine.py"
  "sot-turn02-release-c-ai.py"
  "sot-turn02-release-c-server.py"
  "sot-turn02-release-c.service"
  "sot-turn02-release-c.html"
  "sot-mount-drive.sh"
  "qualify-release-c.py"
)
for f in "${FILES[@]}"; do curl -fsSL "$BASE/SOT/$f" -o "$STAGE/SOT/$f"; done

python3 -m py_compile "$STAGE/SOT/sot-turn02-release-c-engine.py" "$STAGE/SOT/sot-turn02-release-c-ai.py" "$STAGE/SOT/sot-turn02-release-c-server.py" "$STAGE/SOT/qualify-release-c.py"
bash -n "$STAGE/SOT/sot-mount-drive.sh"
python3 "$STAGE/SOT/qualify-release-c.py"
python3 - "$STAGE/SOT/sot-turn02-release-c.html" <<'PY'
from pathlib import Path
import sys
s=Path(sys.argv[1]).read_text()
required=[
 "SOT Turn 02 Release C","FOLDER SEARCH","Folder Search Results","fschip","moveCheckedFolderResults",
 "Compare Converted Files","Comparison Sources","Edit Sources","Refresh","compare_converted_files",
 ".dbgrid tbody tr:nth-child(odd) td{background:#20262d;color:#fff}",
]
missing=[x for x in required if x not in s]
assert not missing,missing
assert "Compare Paths / Folders" not in s and "Path A" not in s and "Path B" not in s
js=s.rsplit("<script>",1)[1].split("</script>",1)[0]
Path("/tmp/sot-release-c.js").write_text(js)
print("PASS Release C governed UI markers")
PY
if command -v node >/dev/null 2>&1; then node --check /tmp/sot-release-c.js; fi

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Installing required FFmpeg suite..."
  sudo apt-get update
  sudo apt-get install -y ffmpeg
fi
command -v ffmpeg >/dev/null
command -v ffprobe >/dev/null
echo "PASS FFmpeg suite available"

if systemctl --user is-active --quiet "$SERVICE_C"; then C_ACTIVE=1; fi
if systemctl --user is-active --quiet "$SERVICE_B"; then B_ACTIVE=1; fi
test -f "$DB13" || {
  test -f "$DB12"
  python3 - "$DB12" "$DB13" <<'PY'
import sqlite3,sys
a=sqlite3.connect(sys.argv[1]);b=sqlite3.connect(sys.argv[2])
try:a.backup(b);b.commit()
finally:b.close();a.close()
print("PASS schema-13 seed created from preserved Release A database")
PY
}
DB_BACKUP="$(mktemp "$HOME/.sot-turn02/sot-v13-release-c.rollback.XXXXXXXX.db")"
python3 - "$DB13" "$DB_BACKUP" <<'PY'
import sqlite3,sys
a=sqlite3.connect(sys.argv[1]);b=sqlite3.connect(sys.argv[2])
try:a.backup(b);b.commit()
finally:b.close();a.close()
print("PASS Release C database rollback snapshot")
PY

ROLLBACK_ARMED=1
systemctl --user stop "$SERVICE_C" >/dev/null 2>&1 || true
systemctl --user stop "$SERVICE_B" >/dev/null 2>&1 || true

mkdir -p "$ROOT"
if [[ -d "$ROOT/SOT" ]]; then PREV_DIR="$ROOT/SOT.previous.$(date +%s)"; mv "$ROOT/SOT" "$PREV_DIR"; fi
if [[ -f "$UNIT_C" ]]; then UNIT_PREV="$(mktemp "$HOME/.sot-turn02/release-c-unit.XXXXXXXX")"; cp -a "$UNIT_C" "$UNIT_PREV"; fi
mv "$STAGE/SOT" "$ROOT/SOT"
install -m 0644 "$ROOT/SOT/$SERVICE_C" "$UNIT_C"

if sudo test -f "$HELPER_PATH"; then HELPER_BACKUP="$(mktemp "$HOME/.sot-turn02/sot-mount-drive.previous.XXXXXXXX")"; sudo cat "$HELPER_PATH" > "$HELPER_BACKUP"; fi
if sudo test -f "$SUDOERS_PATH"; then SUDOERS_BACKUP="$(mktemp "$HOME/.sot-turn02/sot-mount-drive-sudoers.previous.XXXXXXXX")"; sudo cat "$SUDOERS_PATH" > "$SUDOERS_BACKUP"; fi
sudo install -o root -g root -m 0755 "$ROOT/SOT/sot-mount-drive.sh" "$HELPER_PATH"
printf '%s ALL=(root) NOPASSWD: %s\n' "$USER" "$HELPER_PATH" > "$STAGE/sot-mount-drive.sudoers"
sudo visudo -cf "$STAGE/sot-mount-drive.sudoers" >/dev/null
sudo install -o root -g root -m 0440 "$STAGE/sot-mount-drive.sudoers" "$SUDOERS_PATH"
sudo -n "$HELPER_PATH" C
echo "PASS governed Windows lazy-mount helper"

systemctl --user daemon-reload
systemctl --user enable "$SERVICE_C" >/dev/null
systemctl --user restart "$SERVICE_C"

rm -f /tmp/sot-release-c-health.json
for _ in $(seq 1 120); do
  if curl -fsS --max-time 2 http://127.0.0.1:8765/api/health >/tmp/sot-release-c-health.json 2>/dev/null; then break; fi
  sleep .25
done
test -s /tmp/sot-release-c-health.json
python3 - <<'PY'
import json,urllib.request
h=json.load(open("/tmp/sot-release-c-health.json"))
assert h["ok"] and h["version"]=="turn02-release-c" and h["schema"]==13 and h["process"]=="healthy",h
a=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/ai/tasks",timeout=15))
assert a["ok"] and "compare_converted_files" in a["task_types"] and "compare_paths" not in a["task_types"],a
v=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/volumes",timeout=30))
assert v["ok"] and any(str(x.get("windows_drive","")).upper()=="C:" and x.get("available") for x in v["volumes"]),v
p=json.load(urllib.request.urlopen("http://127.0.0.1:8765/api/plan",timeout=15))
assert p["ok"],p
print("PASS Release C health + converted-file catalog + live volumes + Plan")
PY

curl -fsS --max-time 15 https://oc-ref.fell-dojo.ts.net/sot/api/health >/tmp/sot-release-c-https.json
python3 - <<'PY'
import json
h=json.load(open("/tmp/sot-release-c-https.json"))
assert h["ok"] and h["version"]=="turn02-release-c",h
print("PASS shared-origin Release C HTTPS")
PY

systemctl --user disable "$SERVICE_B" >/dev/null 2>&1 || true
ROLLBACK_ARMED=0
rm -rf "$PREV_DIR" 2>/dev/null || true
PREV_DIR=""
rm -f "$UNIT_PREV" "$DB_BACKUP" "$HELPER_BACKUP" "$SUDOERS_BACKUP" 2>/dev/null || true
UNIT_PREV="";DB_BACKUP="";HELPER_BACKUP="";SUDOERS_BACKUP=""

APP="https://acmeproducts.github.io/stuff/SOT/sot-turn02-release-c.html?v=$REF&api=https%3A%2F%2Foc-ref.fell-dojo.ts.net%2Fsot"
echo "APP $APP"
echo "QUALIFIED_REF $REF"
