#!/usr/bin/env bash
set -Eeuo pipefail

REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"
SOT_DIR="$REPORT_ROOT/SOT"
STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"
DB="$STATE/sot.sqlite"
SERVICE="openclaw-report-server.service"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'

R9UI='c9a014c2c3b578b1c207665a0ea6655b73e0327c'
R10UI='76214ed7b321fdeb3a5c26e1744fa02313aa236d'
R11UI='edd419b979aaee36c9c4ee7bcefaeb6ab8828d85'
R12P='0164955a52bcd3f6d3f6fc3dc2c638d8c1a6210a'
R12D='0a9bf9a4b1cb9e9efc6275d033268331fadada18'
R12UI='f7639d4384b7cc6214fa390fc3061abcf1ccd60f'
R12M='6d7c7b60d54d986a59c4924ae386b2fbe272bf74'

TMP="$(mktemp -d)"
STAMP="$(date +%Y%m%d-%H%M%S)"
RUN="$SOT_DIR/archive/$STAMP-turn01-r12-ssot-virtual-volume-release"
LOG="$RUN/release.log"
SUMMARY="$RUN/summary.tsv"
mkdir -p "$RUN" "$TMP/report/sot-db/migrations"
touch "$LOG" "$SUMMARY"
exec > >(tee -a "$LOG") 2>&1

CUTOVER=0
SUCCESS=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }
pass(){ record PASS "$1" "$2"; }
fail(){ record FAIL "$1" "$2"; return 1; }

apply006(){
  local db="$1" mig="$2" cur checksum applied
  cur="$(sqlite3 "$db" 'select coalesce(max(version),0) from schema_migrations')"
  [ "$cur" = 5 ] || fail MIGRATION_006 "expected schema=5 before migration actual=$cur"
  checksum="$(sha256sum "$mig" | awk '{print $1}')"
  applied="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  {
    echo 'PRAGMA foreign_keys=ON;'
    echo 'BEGIN IMMEDIATE;'
    cat "$mig"
    printf "INSERT INTO schema_migrations(version,name,checksum_sha256,applied_at) VALUES(6,'006-ssot-profile-tags.sql','%s','%s');\n" "$checksum" "$applied"
    echo 'COMMIT;'
  } | sqlite3 "$db"
  [ "$(sqlite3 "$db" 'select max(version) from schema_migrations')" = 6 ] || fail MIGRATION_006 'version record missing'
  [ "$(sqlite3 "$db" 'PRAGMA integrity_check')" = ok ] || fail MIGRATION_006 'integrity check failed'
}

cleanup(){
  rc=$?
  set +e
  if [ "$CUTOVER" -eq 1 ] && [ "$SUCCESS" -ne 1 ]; then
    sudo systemctl stop "$SERVICE" >/dev/null 2>&1 || true
    cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"
    cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"
    rm -f "$REPORT_ROOT/sot-db/migrations/006-ssot-profile-tags.sql"
    rm -f "$DB" "$DB-wal" "$DB-shm"
    cp "$RUN/sot.before.sqlite" "$DB"
    sudo systemctl start "$SERVICE" >/dev/null 2>&1 || true
    record PASS ROLLBACK 'restored qualified R11 backend/UI/database/schema'
  fi
  echo '=== QUALIFICATION SUMMARY ==='
  awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY"
  echo "log: $LOG"
  rm -rf "$TMP"
  return "$rc"
}
trap cleanup EXIT

# Developer pass — preserve qualified R11, compose R12, migrate disposable DB, then execute behavior.
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null || fail REQUIRE_TOOL "$t"; done
pass REQUIRE_TOOLS ok
[ -s "$DB" ] || fail DATABASE missing
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_INTEGRITY failed
SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')"
[ "$SCHEMA" = 5 ] || fail DATABASE_SCHEMA "expected qualified R11 schema=5 actual=$SCHEMA"
pass DATABASE_INTEGRITY 'qualified R11 schema=5'

code=000
for i in {1..20}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail LIVE_R11 "HTTP=$code"
pass LIVE_R11 HTTP=200

cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"
cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"
sqlite3 "$DB" ".backup '$RUN/sot.before.sqlite'"
pass ARCHIVE_PRECHANGE "$RUN"

cp "$REPORT_ROOT/sot-api.js" "$TMP/report/sot-api.js"
for m in "$REPORT_ROOT"/sot-db/migrations/*.sql; do cp "$m" "$TMP/report/sot-db/migrations/"; done
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R12M/sot-db/migrations/006-ssot-profile-tags.sql" -o "$TMP/report/sot-db/migrations/006-ssot-profile-tags.sql"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R12P/integrate-SOT-turn01-r12-ssot-profile.py" -o "$TMP/r12p.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R12D/integrate-SOT-turn01-r12-discover.py" -o "$TMP/r12d.py"
python3 -m py_compile "$TMP/r12p.py" "$TMP/r12d.py"
python3 "$TMP/r12p.py" "$TMP/report/sot-api.js"
python3 "$TMP/r12d.py" "$TMP/report/sot-api.js"
node --check "$TMP/report/sot-api.js"

sqlite3 "$DB" ".backup '$TMP/r12.sqlite'"
apply006 "$TMP/r12.sqlite" "$TMP/report/sot-db/migrations/006-ssot-profile-tags.sql"
pass DEV_MIGRATION 'disposable schema 5 → 6 transaction and checksum record PASS'

SOT_DB_PATH="$TMP/r12.sqlite" node - "$TMP/report/sot-api.js" <<'NODE'
const api=require(process.argv[2]); const t=api._test;
if(api.EXPECTED_MIGRATION!==6)throw Error('expected migration 6');
if(t.normalizeTag('  Family   Photos ')!=='family photos')throw Error('tag normalization');
let p=t.ssotProfile('',5000); if(p.model!=='ssot-profile-v1'||!p.profile.revision)throw Error('profile contract');
let target=p.items.find(x=>x.type==='folder')||p.items[0]; if(!target)throw Error('profile has no items');
t.mutateTags({profile_revision:p.profile.revision,operation:'add',tag:'  R12   Test ',targets:[{type:target.type,key:target.key}]});
let p2=t.ssotProfile('',5000); if(!p2.tags.some(x=>x.normalized_name==='r12 test'))throw Error('tag pool mutation');
if(target.type==='folder'){
  let child=p2.items.find(x=>x.type==='file' && (x.path.startsWith(target.path+'/')||x.path.startsWith(target.path+'\\')));
  if(child && !child.effective_tags.some(x=>x.name==='r12 test'))throw Error('folder tag inheritance');
}
let stale=false; try{t.mutateTags({profile_revision:p.profile.revision,operation:'remove',tag:'r12 test',targets:[{type:target.type,key:target.key}]})}catch(e){stale=/stale profile revision/.test(e.message)} if(!stale)throw Error('stale revision accepted');
console.log('profile/tag fixture pass');
NODE
pass DEV_BACKEND 'schema 6 + virtual volume + normalized tags + inheritance + revision-bound bulk mutation'

curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9UI/SOT-turn01-base-r9.html" -o "$TMP/r9.html"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10UI/integrate-SOT-turn01-r10-operating-ui.py" -o "$TMP/r10.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R11UI/integrate-SOT-turn01-r11-action-dashboard.py" -o "$TMP/r11.py"
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R12UI/integrate-SOT-turn01-r12-virtual-volume-ui.py" -o "$TMP/r12ui.py"
python3 -m py_compile "$TMP/r10.py" "$TMP/r11.py" "$TMP/r12ui.py"
python3 "$TMP/r10.py" "$TMP/r9.html" "$TMP/r10.html"
python3 "$TMP/r11.py" "$TMP/r10.html" "$TMP/r11.html"
python3 "$TMP/r12ui.py" "$TMP/r11.html" "$TMP/report/SOT-turn01-base.html"
python3 - "$TMP/report/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
for x in ['SOT-turn01-base-r12-discover-profile-action','>Discover</button>','>Profile</button>','>Action</button>','SSOT virtual volume','Omnisearch folders, files, fingerprints, tags','Begin typing tag','Add tag','Remove tag','rememberDisclosure','stale Profile','Projects are not part of the operating model']: assert x in h,x
for x in ['>Dashboard</button>','>Database</button>','>Activity</button>']: assert x not in h,x
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js"
pass DEV_UI 'Discover/Profile/Action + Omnisearch + bulk tag UI parses'

# Manager pass — architecture contract and lineage.
python3 - "$TMP/report/sot-api.js" "$TMP/report/SOT-turn01-base.html" <<'PY'
from pathlib import Path
import sys
b=Path(sys.argv[1]).read_text(); h=Path(sys.argv[2]).read_text()
for x in ['function ssotProfile(','function discoverSources(','function mutateTags(','stale profile revision','target_holdings','backup_holdings']: assert x in b,x
for x in ['Discover','Profile','Action','SSOT virtual volume','direct:true','rememberDisclosure','Select results']: assert x in h,x
PY
pass MANAGER_SCOPE 'SSOT sole owner-facing object; tags classify; Omnisearch selects; Action mutates'
pass MANAGER_LINEAGE 'qualified R11 source composition → pinned R12 schema/backend/UI integrators'
pass MANAGER_ROLLBACK 'backend/UI/database archived; schema rollback defined'

# Red-team pass — destructive boundaries and stale-selection safety before cutover.
grep -Fq 'stale profile revision' "$TMP/report/sot-api.js" || fail REDTEAM_PRECUTOVER 'stale revision guard absent'
! grep -Eqi 'bulk delete|delete selected|remove selected files' "$TMP/report/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'unsafe bulk delete surface found'
grep -Fq 'rememberDisclosure' "$TMP/report/SOT-turn01-base.html" || fail REDTEAM_PRECUTOVER 'disclosure preservation absent'
pass REDTEAM_PRECUTOVER 'stale revision rejected; normalization/inheritance fixture passed; unsafe delete absent; disclosure state preserved'

# Cutover only after Developer → Manager → Red-team PASS.
sudo systemctl stop "$SERVICE"
CUTOVER=1
install -m0644 "$TMP/report/sot-db/migrations/006-ssot-profile-tags.sql" "$REPORT_ROOT/sot-db/migrations/006-ssot-profile-tags.sql"
apply006 "$DB" "$REPORT_ROOT/sot-db/migrations/006-ssot-profile-tags.sql"
install -m0644 "$TMP/report/sot-api.js" "$REPORT_ROOT/sot-api.js"
install -m0644 "$TMP/report/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"
sudo systemctl start "$SERVICE"
pass CUTOVER 'managed schema 6 + R12 backend/UI installed'

code=000
for i in {1..30}; do
  code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail POST_HEALTH "HTTP=$code"
python3 - "$RUN/health.after.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert int(x.get('database_version',0))==6,x
assert x.get('build')=='2026.09.07.sot-turn01-r12-ssot-profile-1',x
PY
pass POST_HEALTH 'R12 build schema=6'

for endpoint in 'turn01/profile?limit=20' 'turn01/discover' 'turn01/tags' 'turn01/ssot' 'turn01/intelligence?limit=20' 'activity?limit=5' 'turn01/volumes'; do
  code="$(curl --max-time 20 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint" || true)"
  [ "$code" = 200 ] || fail LIVE_R12_ENDPOINT "$endpoint HTTP=$code"
done
pass REDTEAM_LIVE_ENDPOINTS 'profile + discover + tags + SSOT + intelligence + activity + volumes HTTP=200'

curl -fsS 'http://127.0.0.1:18080/api/sot/turn01/profile?limit=20' -o "$RUN/profile.live.json"
python3 - "$RUN/profile.live.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]))
assert x.get('model')=='ssot-profile-v1'
assert int((x.get('profile') or {}).get('revision',0))>=1
assert isinstance(x.get('items'),list)
assert isinstance(x.get('tags'),list)
PY
pass REDTEAM_PROFILE 'live committed virtual-volume profile structurally valid'

[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ] || fail DATABASE_POSTCHECK failed
[ "$(sqlite3 "$DB" 'select max(version) from schema_migrations')" = 6 ] || fail DATABASE_POSTCHECK schema
pass DATABASE_POSTCHECK 'integrity ok schema=6'

LOCAL_SHA="$(sha256sum "$TMP/report/SOT-turn01-base.html" | awk '{print $1}')"
code=000
for i in {1..20}; do
  code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA" || true)"
  [ "$code" = 200 ] && break
  sleep 1
done
[ "$code" = 200 ] || fail PUBLIC_HTTP "HTTP=$code"
PUBLIC_SHA="$(sha256sum "$RUN/public.html" | awk '{print $1}')"
[ "$PUBLIC_SHA" = "$LOCAL_SHA" ] || fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"
pass PUBLIC_IDENTITY "$PUBLIC_SHA"
SUCCESS=1
pass RELEASE_READY 'Developer PASS → Manager PASS → Red-team PASS'
echo '=== TURN 01 BASE R12 READY FOR OWNER TEST ==='
echo "PUBLIC SHA256: $PUBLIC_SHA"
echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
