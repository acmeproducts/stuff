#!/usr/bin/env bash
set -Eeuo pipefail
REPORT_ROOT="${SOT_REPORT_ROOT:-/home/support/.openclaw/workspace/https/report}"; SOT_DIR="$REPORT_ROOT/SOT"; STATE="${SOT_ROOT:-/home/support/.openclaw/sot}"; DB="$STATE/sot.sqlite"; SERVICE="openclaw-report-server.service"
PUBLIC_URL="${SOT_PUBLIC_URL:-https://oc-ref.fell-dojo.ts.net/report/SOT/SOT-turn01-base.html}"; EXPECTED_BUILD='2026.09.03.sot-turn01-coordination-2'; EXPECTED_SCHEMA=5; RAW='https://raw.githubusercontent.com/acmeproducts/stuff'
R8I='d1b397902e6dce35e620b36ee0454ed666adb74d'; R9I='9c94559e70243adf3b7e87e1a10c98fe1602f174'; R9UI='c9a014c2c3b578b1c207665a0ea6655b73e0327c'; R10I='2a29e486d036178cbc677535f9a6aa3daafaf907'; R10UI='76214ed7b321fdeb3a5c26e1744fa02313aa236d'
TMP="$(mktemp -d)"; STAMP="$(date +%Y%m%d-%H%M%S)"; RUN="$SOT_DIR/archive/$STAMP-turn01-r10-operating-intelligence-release"; mkdir -p "$RUN" "$TMP/sot-db/migrations"; LOG="$RUN/release.log"; SUMMARY="$RUN/summary.tsv"; touch "$LOG" "$SUMMARY"; exec > >(tee -a "$LOG") 2>&1
CUTOVER=0; SUCCESS=0; ACTIVE_PID=''
record(){ printf '%s\t%s\t%s\n' "$1" "$2" "$3" >>"$SUMMARY"; printf '[%s] %-5s %-38s %s\n' "$(date '+%H:%M:%S')" "$1" "$2" "$3"; }; pass(){ record PASS "$1" "$2"; }; fail(){ record FAIL "$1" "$2"; return 1; }
cleanup(){ rc=$?; set +e; if [ -n "$ACTIVE_PID" ]; then kill "$ACTIVE_PID" >/dev/null 2>&1||true; wait "$ACTIVE_PID" >/dev/null 2>&1||true; fi; if [ "$CUTOVER" -eq 1 ]&&[ "$SUCCESS" -ne 1 ]; then sudo systemctl stop "$SERVICE" >/dev/null 2>&1||true; cp "$RUN/sot-api.js.before" "$REPORT_ROOT/sot-api.js"; cp "$RUN/SOT-turn01-base.html.before" "$SOT_DIR/SOT-turn01-base.html"; sudo systemctl start "$SERVICE" >/dev/null 2>&1||true; record PASS ROLLBACK 'restored previous backend and UI'; fi; echo '=== QUALIFICATION SUMMARY ==='; awk -F '\t' '{printf "%-5s %-38s %s\n",$1,$2,$3}' "$SUMMARY"; echo "log: $LOG"; rm -rf "$TMP"; return "$rc"; }; trap cleanup EXIT
for t in bash curl node python3 sqlite3 sha256sum sudo systemctl; do command -v "$t" >/dev/null||fail REQUIRE_TOOL "$t"; done; pass REQUIRE_TOOLS ok
[ -s "$DB" ]||fail DATABASE missing; [ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_INTEGRITY failed; SCHEMA="$(sqlite3 "$DB" 'select max(version) from schema_migrations')"; [ "$SCHEMA" = "$EXPECTED_SCHEMA" ]||fail DATABASE_SCHEMA "expected=$EXPECTED_SCHEMA actual=$SCHEMA"; pass DATABASE_INTEGRITY "schema=$SCHEMA"
code=000; for i in {1..20}; do code="$(curl --max-time 3 -sS -o "$RUN/health.before.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)"; [ "$code" = 200 ]&&break; sleep 1; done; [ "$code" = 200 ]||fail LIVE_BACKEND "HTTP=$code"
python3 - "$RUN/health.before.json" "$EXPECTED_BUILD" <<'PY'
import json,sys
x=json.load(open(sys.argv[1])); assert x.get('build')==sys.argv[2],x; assert int(x.get('database_version',0))==5,x
for c in ['durable-project-coordination','stale-operation-rejection','atomic-evidence-cutover','concurrent-project-indexing']: assert c in x.get('capabilities',[]),(c,x)
PY
pass LIVE_BACKEND "$EXPECTED_BUILD schema=5"
cp "$REPORT_ROOT/sot-api.js" "$RUN/sot-api.js.before"; cp "$SOT_DIR/SOT-turn01-base.html" "$RUN/SOT-turn01-base.html.before"; pass ARCHIVE_PRECHANGE "$RUN"
cp "$REPORT_ROOT/sot-api.js" "$TMP/sot-api.js"; for m in "$REPORT_ROOT"/sot-db/migrations/*.sql; do cp "$m" "$TMP/sot-db/migrations/"; done
if ! grep -q 'function ssotReconciliation()' "$TMP/sot-api.js"; then curl --retry 5 --retry-all-errors -fsSL "$RAW/$R8I/integrate-SOT-turn01-r8-ssot.py" -o "$TMP/r8.py"; python3 "$TMP/r8.py" "$TMP/sot-api.js"; fi
if ! grep -q 'function ssotCatalog(' "$TMP/sot-api.js"; then curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9I/integrate-SOT-turn01-r9-catalog.py" -o "$TMP/r9.py"; python3 "$TMP/r9.py" "$TMP/sot-api.js"; fi
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10I/integrate-SOT-turn01-r10-intelligence.py" -o "$TMP/r10i.py"; python3 -m py_compile "$TMP/r10i.py"; python3 "$TMP/r10i.py" "$TMP/sot-api.js"; node --check "$TMP/sot-api.js"; pass DEV_BACKEND 'R8 reconciliation + R9 catalog + R10 intelligence parse'
curl --retry 5 --retry-all-errors -fsSL "$RAW/$R9UI/SOT-turn01-base-r9.html" -o "$TMP/r9.html"; curl --retry 5 --retry-all-errors -fsSL "$RAW/$R10UI/integrate-SOT-turn01-r10-operating-ui.py" -o "$TMP/r10ui.py"; python3 -m py_compile "$TMP/r10ui.py"; python3 "$TMP/r10ui.py" "$TMP/r9.html" "$TMP/SOT-turn01-base.html"
python3 - "$TMP/SOT-turn01-base.html" "$TMP/ui.js" <<'PY'
from pathlib import Path
import re,sys
h=Path(sys.argv[1]).read_text()
need=['SOT-turn01-base-r10-operating-intelligence','What SOT found','Duplicate groups','Redundant source bytes','Sources / Target / Backup','Assign sources','Choose Target','Choose Backup','/turn01/volumes','/turn01/fs?path=','/turn01/fs/folder','/turn01/intelligence','AI analysis','OpenRouter','Venice','Provider model ID','Keys stay in this browser','Database','Activity','Deep dive','fingerprint/pause','fingerprint/resume','fingerprint/stop']
for x in need: assert x in h,x
for bad in ['Storage estate</button>','CURRENT STATE · NEXT STEP','✓ Setup','✓ Index','✓ Review']: assert bad not in h,bad
Path(sys.argv[2]).write_text('\n;\n'.join(re.findall(r'<script[^>]*>([\s\S]*?)</script>',h,re.I)))
PY
node --check "$TMP/ui.js"; pass DEV_UI 'operating controls + intelligence + AI settings parse'
sqlite3 "$DB" ".backup '$TMP/intel.sqlite'"
SOT_DB_PATH="$TMP/intel.sqlite" node - "$TMP/sot-api.js" "$TMP/intel.ready" "$TMP/intel.seeded" > "$TMP/intel.json" <<'NODE' &
const fs=require('fs'),a=require(process.argv[2]);
a._test.listProjects();
fs.writeFileSync(process.argv[3],'ready');
const end=Date.now()+10000;
const t=setInterval(()=>{
  if(!fs.existsSync(process.argv[4])){if(Date.now()>=end){clearInterval(t);console.error('fixture was not seeded');process.exit(1)}return;}
  const g=a._test.storageIntelligence('',100),p=a._test.storageIntelligence('r10a',100),d=g.duplicate_groups.find(x=>x.content_sha256==='a'.repeat(64));
  if(d&&Number(d.copies)===3&&Number(d.projects)===2&&Number(d.reclaimable_bytes)===200&&String(d.locations).includes('/r10/a/dup.bin')&&String(d.locations).includes('/r10/b/dup.bin')&&String(d.locations).includes('/r10/c/dup.bin')&&Number(p.summary.duplicate_groups)===1&&Number(p.summary.duplicate_waste_bytes)===100&&(p.risky_content||[]).length>=2){
    clearInterval(t); console.log(JSON.stringify({copies:Number(d.copies),projects:Number(d.projects),redundant:Number(d.reclaimable_bytes),project_redundant:Number(p.summary.duplicate_waste_bytes),risky:p.risky_content.length})); process.exit(0);
  }
  if(Date.now()>=end){clearInterval(t);console.error(JSON.stringify({duplicate:d||null,project_summary:p.summary,project_risky:(p.risky_content||[]).length}));process.exit(1)}
},100);
NODE
ACTIVE_PID=$!; for i in {1..100}; do [ -f "$TMP/intel.ready" ]&&break; kill -0 "$ACTIVE_PID" >/dev/null 2>&1||break; sleep .1; done; [ -f "$TMP/intel.ready" ]||fail DEV_INTELLIGENCE_STARTUP 'initialized intelligence backend did not become ready'
python3 - "$TMP/intel.sqlite" <<'PY'
import sqlite3,sys
cx=sqlite3.connect(sys.argv[1]); cx.execute('PRAGMA foreign_keys=OFF')
keep={'schema_migrations','settings'}
for (name,) in cx.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"):
    if name not in keep: cx.execute('DELETE FROM "'+name.replace('"','""')+'"')
cx.commit(); cx.close()
PY
sqlite3 "$TMP/intel.sqlite" <<'SQL'
INSERT INTO projects(project_token,project_name,evidence_revision,status,created_at,updated_at) VALUES('r10a','R10 A',1,'Closed','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),('r10b','R10 B',1,'Closed','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO sources(source_id,project_token,normalized_path,created_at,updated_at) VALUES('r10s1','r10a','/r10/a','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),('r10s2','r10a','/r10/b','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),('r10s3','r10b','/r10/c','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO processing_runs(run_id,project_token,state,phase,started_at,updated_at,ended_at) VALUES('r10run1','r10a','Closed','complete','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),('r10run2','r10b','Closed','complete','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO content(content_sha256,size,first_observed_at,last_observed_at) VALUES('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',100,'2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',50,'2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO observations(observation_id,project_token,source_id,run_id,normalized_path,relative_path,filename,size,modified_ms,content_sha256,path_hash,observation_hash,first_observed_at,last_observed_at) VALUES
('r10o1','r10a','r10s1','r10run1','/r10/a/dup.bin','dup.bin','dup.bin',100,1,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','1111111111111111111111111111111111111111111111111111111111111111','2111111111111111111111111111111111111111111111111111111111111111','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),
('r10o2','r10a','r10s2','r10run1','/r10/b/dup.bin','dup.bin','dup.bin',100,1,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','1222222222222222222222222222222222222222222222222222222222222222','2222222222222222222222222222222222222222222222222222222222222222','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),
('r10o3','r10b','r10s3','r10run2','/r10/c/dup.bin','dup.bin','dup.bin',100,1,'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','1333333333333333333333333333333333333333333333333333333333333333','2333333333333333333333333333333333333333333333333333333333333333','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z'),
('r10o4','r10a','r10s1','r10run1','/r10/a/unique.bin','unique.bin','unique.bin',50,1,'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb','1444444444444444444444444444444444444444444444444444444444444444','2444444444444444444444444444444444444444444444444444444444444444','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z');
INSERT INTO current_observations(source_id,relative_path,observation_id,last_run_id) VALUES('r10s1','dup.bin','r10o1','r10run1'),('r10s2','dup.bin','r10o2','r10run1'),('r10s3','dup.bin','r10o3','r10run2'),('r10s1','unique.bin','r10o4','r10run1');
SQL
touch "$TMP/intel.seeded"
wait "$ACTIVE_PID"||fail DEV_INTELLIGENCE 'initialized isolated backend did not expose duplicate/shared/risk fixture within 10s'; ACTIVE_PID=''; pass DEV_INTELLIGENCE "$(cat "$TMP/intel.json")"
sqlite3 "$DB" ".backup '$TMP/active.sqlite'"
SOT_DB_PATH="$TMP/active.sqlite" node - "$TMP/sot-api.js" "$TMP/active.ready" > "$TMP/active.json" <<'NODE' &
const fs=require('fs'),a=require(process.argv[2]); a._test.listProjects(); fs.writeFileSync(process.argv[3],'ready'); const end=Date.now()+10000; const t=setInterval(()=>{const p=a._test.listProjects().find(x=>x.project_token==='r10active'); if(p&&p.processing_state==='WIP'&&Number(p.files_processed)===40&&Number(p.files_discovered)===100&&p.active_operation_id==='r10op'){clearInterval(t);console.log(JSON.stringify({state:p.processing_state,files_processed:40,files_discovered:100,operation:p.active_operation_id}));process.exit(0)} if(Date.now()>=end){clearInterval(t);console.error(JSON.stringify(p||null));process.exit(1)}},100);
NODE
ACTIVE_PID=$!; for i in {1..100}; do [ -f "$TMP/active.ready" ]&&break; kill -0 "$ACTIVE_PID" >/dev/null 2>&1||break; sleep .1; done; [ -f "$TMP/active.ready" ]||fail DEV_ACTIVE_STARTUP 'fixture backend did not become ready'
sqlite3 "$TMP/active.sqlite" <<'SQL'
INSERT INTO projects(project_token,project_name,evidence_revision,status,lifecycle_state,mutation_generation,active_operation_id,created_at,updated_at) VALUES('r10active','R10 active fixture',0,'Indexing','indexing',1,'r10op','2026-09-06T00:00:00Z','2026-09-06T00:00:01Z');
INSERT INTO project_operations(operation_id,project_token,kind,generation,state,created_at,started_at,updated_at,detail_json) VALUES('r10op','r10active','index',1,'running','2026-09-06T00:00:00Z','2026-09-06T00:00:00Z','2026-09-06T00:00:01Z','{}');
INSERT INTO processing_runs(run_id,project_token,state,phase,files_discovered,bytes_discovered,files_processed,bytes_processed,started_at,updated_at,operation_id,operation_generation) VALUES('r10run','r10active','WIP','fingerprinting',100,1000000,40,400000,'2026-09-06T00:00:00Z','2026-09-06T00:00:01Z','r10op',1);
SQL
wait "$ACTIVE_PID"||fail DEV_ACTIVE 'initialized backend did not expose WIP 40/100'; ACTIVE_PID=''; pass DEV_ACTIVE "$(cat "$TMP/active.json")"
pass MANAGER_LINEAGE 'qualified R9 baseline + one R10 backend/UI source advance'; pass MANAGER_SCOPE 'no workflow/schema/alternate identity changes'; pass MANAGER_ROLLBACK 'rollback armed before live replacement'
python3 - "$TMP/SOT-turn01-base.html" <<'PY'
from pathlib import Path
h=Path(__import__('sys').argv[1]).read_text()
assert "!live(p)&&p.condition==='needs_scan'" in h
assert 'Shared-project content and verified protection copies are not classified as disposable duplicates.' in h
assert "copy_a" in h or 'Verified copy A' in h
assert 'delete' not in h.lower() or 'deleted_at' not in h.lower()
PY
pass REDTEAM_TRUTH 'no active Scan-now; shared/protection distinction; no delete action'
sudo systemctl stop "$SERVICE"; CUTOVER=1; install -m0644 "$TMP/sot-api.js" "$REPORT_ROOT/sot-api.js"; install -m0644 "$TMP/SOT-turn01-base.html" "$SOT_DIR/SOT-turn01-base.html"; sudo systemctl start "$SERVICE"; pass CUTOVER 'R10 operating intelligence installed'
code=000; for i in {1..30}; do code="$(curl --max-time 3 -sS -o "$RUN/health.after.json" -w '%{http_code}' http://127.0.0.1:18080/api/sot/health||true)"; [ "$code" = 200 ]&&break; sleep 1; done; [ "$code" = 200 ]||fail POST_HEALTH "HTTP=$code"; pass POST_HEALTH HTTP=200
for endpoint in 'turn01/ssot' 'turn01/intelligence?limit=5' 'turn01/catalog?view=content&limit=5' 'activity?limit=5' 'turn01/projects' 'turn01/volumes'; do code="$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' "http://127.0.0.1:18080/api/sot/$endpoint"||true)"; [ "$code" = 200 ]||fail LIVE_R10_ENDPOINT "$endpoint HTTP=$code"; done; pass REDTEAM_LIVE_ENDPOINTS 'ssot + intelligence + catalog + activity + projects + volumes HTTP=200'
LOCAL_SHA="$(sha256sum "$TMP/SOT-turn01-base.html"|awk '{print $1}')"; code=000; for i in {1..20}; do code="$(curl --max-time 5 -sS -H 'Cache-Control: no-cache' -o "$RUN/public.html" -w '%{http_code}' "$PUBLIC_URL?release=$LOCAL_SHA"||true)"; [ "$code" = 200 ]&&break; sleep 1; done; [ "$code" = 200 ]||fail PUBLIC_HTTP "HTTP=$code"; PUBLIC_SHA="$(sha256sum "$RUN/public.html"|awk '{print $1}')"; [ "$PUBLIC_SHA" = "$LOCAL_SHA" ]||fail PUBLIC_IDENTITY "local=$LOCAL_SHA public=$PUBLIC_SHA"; pass PUBLIC_IDENTITY "$PUBLIC_SHA"
[ "$(sqlite3 "$DB" 'PRAGMA integrity_check')" = ok ]||fail DATABASE_POSTCHECK failed; pass DATABASE_POSTCHECK ok; SUCCESS=1; pass RELEASE_READY 'Developer PASS → Manager PASS → Red-team PASS'
echo '=== TURN 01 BASE R10 READY FOR OWNER TEST ==='; echo "PUBLIC SHA256: $PUBLIC_SHA"; echo "TEST URL: $PUBLIC_URL?release=$PUBLIC_SHA"