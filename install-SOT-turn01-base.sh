#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"; SOT_DIR="$REPORT_ROOT/SOT"; STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"; DB="$STATE/sot.sqlite"; SERVICE=openclaw-report-server.service
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"; EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2'; EXPECTED_SCHEMA=5
RAW='https://raw.githubusercontent.com/acmeproducts/stuff'; R8_COMMIT='aa8216611132fb8008f13e12a6dd8bc8d572dc35'; INTEGRATOR_COMMIT='70ec640fd706859e2c1452a6218920741c7d4767'
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; RUN="$SOT_DIR/archive/$STAMP-turn01-r8-global-reconciliation-release"; mkdir -p "$RUN" "$TMP/sot-db/migrations"; LOG="$RUN/release.log"; SUMMARY="$RUN/summary.tsv"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
CUTOVER=0; SUCCESS=0
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >> "$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }; pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){ rc=$?; set +e; if [ "$CUTOVER" -eq 1 ]&&[ "$SUCCESS" -ne 1 ];then sudo systemctl stop "$SERVICE" >/dev/null 2>&1||true; cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"; cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"; sudo systemctl start "$SERVICE" >/dev/null 2>&1||true; record PASS ROLLBACK 'restored previous backend and UI';fi; echo '=== QUALIFICATION SUMMARY ===';awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY";echo "log: $LOG";rm -rf "$TMP";return "$rc";};trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl;do command -v "$t" >/dev/null||{ fail REQUIRE_TOOL "$t";return 1 2>/dev/null||true;};done;pass REQUIRE_TOOLS ok
[ -s "$DB" ]||fail DATABASE missing;[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_INTEGRITY failed;SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')";[ "$SCHEMA" = "$EXPECTED_SCHEMA" ]||fail DATABASE_SCHEMA "expected=$EXPECTED_SCHEMA actual=$SCHEMA";pass DATABASE_INTEGRITY "schema=$SCHEMA"
code=000;for i in {1..20};do code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail LIVE_BACKEND "HTTP=$code"
python3 - "$RUN/health.before.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));assert x.get('build')==sys.argv[2],x;assert int(x.get('database_version',0))==5,x
for c in ['durable-project-coordination','stale-operation-rejection','atomic-evidence-cutover','concurrent-project-indexing']:assert c in x.get('capabilities',[]),(c,x)
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=5"
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before";cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before";pass ARCHIVE_PRECHANGE "$RUN"
cp "$REPORT_ROOT/sot-api.js" "$TMP/sot-api.js";for f in sot-worker.js sot-coordinator.js sot-sqlite.py;do [ -f "$REPORT_ROOT/$f" ]&&cp "$REPORT_ROOT/$f" "$TMP/$f"||true;done;for m in "$REPORT_ROOT"/sot-db/migrations/*.sql;do cp "$m" "$TMP/sot-db/migrations/";done
curl --retry 5 --retry-all-errors -fsSL "$RAW/$INTEGRATOR_COMMIT/integrate-SOT-turn01-r8-ssot.py" -o "$TMP/integrate.py";python3 -m py_compile "$TMP/integrate.py";python3 "$TMP/integrate.py" "$TMP/sot-api.js";node --check "$TMP/sot-api.js";pass R8_BACKEND_PARSE 'global reconciliation integrated'
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R8_COMMIT/SOT-turn01-base-r8.html" -o "$TMP/SOT-turn01-base.html";python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text();need=['SOT-turn01-base-r8-global-reconciliation','Your storage','unique physical content','safe copy a','safe copy b','shared by projects','/turn01/ssot','Physical overlap','Advanced / diagnostics']
for x in need:assert x in h,x
for bad in ['✓ Setup','✓ Index','✓ Review','CURRENT STATE · NEXT STEP']:assert bad not in h,bad
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js";pass R8_UI_CONTRACT 'storage reconciliation, not workflow machinery'
cp "$DB" "$TMP/test.sqlite";SOT_DB_PATH="$TMP/test.sqlite" node - "$TMP/sot-api.js" > "$TMP/before.json" <<'NODE'
const a=require(process.argv[2]);console.log(JSON.stringify(a._test.ssotReconciliation().global));
NODE
sqlite3 "$TMP/test.sqlite" <<'SQL'
PRAGMA foreign_keys=ON;
INSERT INTO projects(project_token,project_name,evidence_revision,status,created_at,updated_at) VALUES('r8fixtureA','R8 fixture A',1,'Review','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),('r8fixtureB','R8 fixture B',1,'Review','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO sources(source_id,project_token,normalized_path,preflight_status,created_at,updated_at) VALUES('r8srcA','r8fixtureA','/tmp/r8a','ready','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),('r8srcB','r8fixtureB','/tmp/r8b','ready','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO processing_runs(run_id,project_token,state,phase,started_at,updated_at,ended_at) VALUES('r8runA','r8fixtureA','Closed','complete','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),('r8runB','r8fixtureB','Closed','complete','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO content(content_sha256,size,first_observed_at,last_observed_at) VALUES('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',1000,'2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',2000,'2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO observations(observation_id,project_token,source_id,run_id,normalized_path,relative_path,filename,size,modified_ms,content_sha256,path_hash,observation_hash,first_observed_at,last_observed_at) VALUES
('r8obsA1','r8fixtureA','r8srcA','r8runA','/tmp/r8a/shared','shared','shared',1000,0,'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),
('r8obsB1','r8fixtureB','r8srcB','r8runB','/tmp/r8b/shared','shared','shared',1000,0,'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc','dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),
('r8obsA2','r8fixtureA','r8srcA','r8runA','/tmp/r8a/only','only','only',2000,0,'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','1111111111111111111111111111111111111111111111111111111111111111','2222222222222222222222222222222222222222222222222222222222222222','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO current_observations(source_id,relative_path,observation_id,last_run_id) VALUES('r8srcA','shared','r8obsA1','r8runA'),('r8srcB','shared','r8obsB1','r8runB'),('r8srcA','only','r8obsA2','r8runA');
INSERT INTO target_holdings(content_sha256,target_path,verification_status,verified_sha256,established_at,verified_at) VALUES('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','/tmp/r8-target-shared','verified','ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z'),('eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','/tmp/r8-target-only','verified','eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
INSERT INTO backup_holdings(content_sha256,backup_path,verification_status,verified_sha256,established_at,verified_at) VALUES('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','/tmp/r8-backup-shared','verified','ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff','2026-09-05T00:00:00Z','2026-09-05T00:00:00Z');
SQL
SOT_DB_PATH="$TMP/test.sqlite" node - "$TMP/sot-api.js" > "$TMP/after.json" <<'NODE'
const a=require(process.argv[2]);console.log(JSON.stringify(a._test.ssotReconciliation()));
NODE
python3 - "$TMP/before.json" "$TMP/after.json" <<'PY'
import json,sys
b=json.load(open(sys.argv[1]));a=json.load(open(sys.argv[2]));g=a['global']
assert g['unique_bytes']-b['unique_bytes']==3000,(b,g)
assert g['shared_bytes']-b['shared_bytes']==1000,(b,g)
assert g['protected_bytes']-b['protected_bytes']==1000,(b,g)
assert g['missing_copy_b_bytes']-b['missing_copy_b_bytes']==2000,(b,g)
pa=next(x for x in a['projects'] if x['project_token']=='r8fixtureA');pb=next(x for x in a['projects'] if x['project_token']=='r8fixtureB')
assert pa['shared_bytes']==1000 and pa['project_only_bytes']==2000,(pa,pb)
assert pb['shared_bytes']==1000 and pb['project_only_bytes']==0,(pa,pb)
PY
pass R8_DEDUP_BEHAVIOR 'shared 1KB counted once globally; overlap and missing copy reconciled'
sudo systemctl stop "$SERVICE";install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js";install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html";CUTOVER=1;sudo systemctl start "$SERVICE";pass CUTOVER 'backend read model + R8 UI installed'
code=000;for i in {1..30};do code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail POST_HEALTH "HTTP=$code";pass POST_HEALTH HTTP=200
code="$(curl --max-time 10 -sS -o "$RUN/ssot.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/turn01/ssot||true)";[ "$code" = 200 ]||fail LIVE_SSOT "HTTP=$code";python3 - "$RUN/ssot.json" <<'PY'
import json,sys
x=json.load(open(sys.argv[1]));assert x.get('model')=='global-content-reconciliation-v1',x;g=x['global'];assert g['protected_bytes']<=g['unique_bytes'];
for p in x['projects']:
 if not p['unique_content'] or not p['logical_bytes']:assert p['condition']!='protected',p
PY
pass LIVE_SSOT 'global truth endpoint; zero-content protected impossible'
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')";code=000;for i in {1..20};do code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA"||true)";[ "$code" = 200 ]&&break;sleep 1;done;[ "$code" = 200 ]||fail PUBLIC_HTTP "HTTP=$code";PUBLIC_SHA="$(sha256sum "$RUN/public.html"|awk '{print $1}')";[ "$PUBLIC_SHA" = "$LOCAL_SHA" ]||fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA";pass PUBLIC_IDENTITY "$PUBLIC_SHA"
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_POSTCHECK failed;pass DATABASE_POSTCHECK ok;SUCCESS=1;pass RELEASE_READY "R8 global reconciliation"
echo '=== TURN 01 BASE R8 READY FOR OWNER TEST ===';echo "PUBLIC SHA256: $PUBLIC_SHA";echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"
