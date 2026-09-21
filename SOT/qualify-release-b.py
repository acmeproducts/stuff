#!/usr/bin/env python3
import importlib.util,json,os,sqlite3,sys,tempfile,time
from pathlib import Path

HERE=Path(__file__).resolve().parent

def load(name,path):
 sp=importlib.util.spec_from_file_location(name,path)
 m=importlib.util.module_from_spec(sp);sys.modules[name]=m;sp.loader.exec_module(m);return m

def wait_job(mgr,jid,timeout=30):
 end=time.time()+timeout
 while time.time()<end:
  z=mgr.snapshot(jid)
  if z and z["job"]["state"] in ("COMPLETED","FAILED","STOPPED"):return z
  time.sleep(.03)
 raise RuntimeError("job timeout")

def wait_task(A,tid,timeout=15):
 end=time.time()+timeout
 while time.time()<end:
  z=A.row(tid)
  if z and z["status"] not in ("analyzing","applying"):return z
  time.sleep(.03)
 raise RuntimeError("AI task timeout")

old_home=os.environ.get("HOME")
try:
 # Migration: v12 is copied, never mutated, and v13 gains task tables.
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  a=load("release_a_migration",HERE/"sot-turn02-release-a-engine.py")
  sa=a.Store();sa.submit("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled) VALUES('s','Legacy','/legacy','Legacy','legacy','primary',1)",(),True);sa.close()
  p12=a.DB_DEFAULT;before=p12.read_bytes()
  b=load("release_b_migration",HERE/"sot-turn02-release-b-engine.py")
  sb=b.Store()
  assert b.SCHEMA==13 and b.VERSION=="turn02-release-b"
  assert b.DB_DEFAULT.exists() and p12.read_bytes()==before
  tables={r["name"] for r in sb.rows("SELECT name FROM sqlite_master WHERE type='table'")}
  assert {"ai_tasks","ai_turns","placements","operations"}.issubset(tables),tables
  assert sb.rows("SELECT label FROM sources")[0]["label"]=="Legacy"
  sb.close()
  print("PASS v12 preserved + schema-13 task migration")

 # Runtime + AI task behavior on disposable estate.
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("release_b_server_fixture",HERE/"sot-turn02-release-b-server.py")
  e1=home/"estate1";e2=home/"estate2";target=home/"target";e1.mkdir();e2.mkdir();target.mkdir()
  (e1/"photo-one.jpg").write_bytes(b"one")
  (e1/"dup-a.bin").write_bytes(b"same")
  (e2/"dup-b.bin").write_bytes(b"same")
  (e2/"doc.txt").write_text("document")
  sid1=srv.M.add_source("Estate 1",str(e1),"domain-1",estate="Estate 1")
  sid2=srv.M.add_source("Estate 2",str(e2),"domain-2",estate="Estate 2")
  jid=srv.M.start([sid1,sid2]);z=wait_job(srv.M,jid);srv.S.drain(10)
  assert z["job"]["state"]=="COMPLETED"
  rows=srv.S.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
  assert len(rows)==4
  classes=sorted(r["system_classification"] for r in rows)
  assert classes.count("UNIQUE")==2 and classes.count("KEEP")==1 and classes.count("EXCESS")==1,classes
  srv.target_set(str(target))

  A=srv.get_ai()
  assert set(srv.ai_mod.TASK_TYPES)=={"auto_tag","analyze_estate","explain_duplicates","find_review_candidates","propose_target_structure","plan_target_landing"}
  task=A.create("auto_tag",{"type":"entire_sot"})
  assert task["status"]=="draft" and task["turns"]==[]
  first=rows[0]["placement_id"]
  original_class=rows[0]["system_classification"]
  def fake_provider(provider,model,key,messages):
   return json.dumps({"summary":"fixture tags","changes":[{"placement_id":first,"add":["#Travel","#PHOTO"],"remove":[],"reason":"fixture evidence"}]})
  A.provider=fake_provider
  A.run(task["task_id"],"tag the evidence","venice","fixture-model","fixture-key",{"type":"entire_sot"})
  ready=wait_task(A,task["task_id"])
  assert ready["status"]=="proposal-ready",ready
  pub=A.public(ready,True)
  assert len(pub["turns"])==2 and pub["proposal"]["changes"][0]["add"]==["#photo","#travel"],pub["proposal"]
  assert pub["evidence_revision"]==srv.catalog_revision()
  print("PASS durable Auto Tag proposal + evidence manifest")

  applied=A.apply(task["task_id"],"fixture explicit approval")
  p=srv.S.rows("SELECT tags,system_classification FROM placements WHERE placement_id=?",(first,))[0]
  tags=json.loads(p["tags"])
  assert "#photo" in tags and "#travel" in tags and all(x==x.lower() for x in tags)
  assert p["system_classification"]==original_class
  assert applied["status"]=="complete" and applied["approval"] and applied["applied_result"]
  assert srv.S.rows("SELECT COUNT(*) n FROM events WHERE event_type='ai_auto_tag_applied'")[0]["n"]==1
  print("PASS explicit Auto Tag Apply uses governed metadata without changing classification")

  # Persistent task cards and read-only tasks.
  A2=srv.ai_mod.AIManager(srv.S,srv.M,srv.catalog_revision,srv.target_get,srv.plan_summary,srv.active_rows,srv.parse_tags,srv.normalize_tag,srv.metadata_update)
  assert any(x["task_id"]==task["task_id"] for x in A2.list())
  read=A2.create("analyze_estate",{"type":"plan"})
  A2.provider=lambda *args:"## Fixture analysis\n\nEvidence-backed result."
  A2.run(read["task_id"],"analyze","openrouter","fixture-model","fixture-key",{"type":"plan"})
  done=wait_task(A2,read["task_id"])
  assert done["status"]=="complete" and "Fixture analysis" in done["result_markdown"]
  assert not done["proposal_json"]
  print("PASS durable read-only task + transcript persistence")

  # Folder/landing task stays proposal text only: no operations are created.
  before_ops=srv.S.rows("SELECT COUNT(*) n FROM operations")[0]["n"]
  ft=A2.create("propose_target_structure",{"type":"entire_sot"})
  A2.provider=lambda *args:"## Proposed TARGET\n\n- Photos/2026/"
  A2.run(ft["task_id"],"propose structure","venice","fixture-model","fixture-key")
  fdone=wait_task(A2,ft["task_id"])
  after_ops=srv.S.rows("SELECT COUNT(*) n FROM operations")[0]["n"]
  assert fdone["status"]=="complete" and before_ops==after_ops
  print("PASS TARGET structure task is proposal-only")

  # Stale Auto Tag proposal cannot apply.
  stale=A2.create("auto_tag",{"type":"selected","placement_ids":[first]})
  A2.provider=fake_provider
  A2.run(stale["task_id"],"tag","venice","fixture-model","fixture-key",{"type":"selected","placement_ids":[first]})
  wait_task(A2,stale["task_id"])
  srv.S.bump_catalog_revision()
  rejected=False
  try:A2.apply(stale["task_id"],"should fail")
  except RuntimeError as ex:rejected="stale" in str(ex).lower()
  assert rejected
  print("PASS stale AI proposal rejected")

  # Task deletion only deletes task records, never placements.
  n_before=srv.S.rows("SELECT COUNT(*) n FROM placements WHERE placement_state='ACTIVE'")[0]["n"]
  A2.delete(ft["task_id"])
  assert A2.row(ft["task_id"]) is None
  assert srv.S.rows("SELECT COUNT(*) n FROM placements WHERE placement_state='ACTIVE'")[0]["n"]==n_before
  print("PASS task deletion cannot mutate owner evidence")

  srv.S.close()

 print("PASS RELEASE B QUALIFICATION")
finally:
 if old_home is None:os.environ.pop("HOME",None)
 else:os.environ["HOME"]=old_home
