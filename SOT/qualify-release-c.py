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
  srv=load("release_c_server_fixture",HERE/"sot-turn02-release-c-server.py")
  assert srv.normalize_mount_source(r"C:\x5c")=="C:"
  assert srv.normalize_mount_source("D:/")=="D:"
  print("PASS findmnt Windows source normalization")
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

  # Newly registered sources must immediately surface as pending and support incremental analysis.
  e3=home/"estate3";e3.mkdir();(e3/"new-source.bin").write_bytes(b"new-source")
  sid3=srv.M.add_source("Estate 3",str(e3),"domain-3",estate="Estate 3")
  st={x["source_id"]:x for x in srv.source_status_rows()}
  assert st[sid1]["analysis_state"]=="CURRENT" and not st[sid1]["pending"]
  assert st[sid2]["analysis_state"]=="CURRENT" and not st[sid2]["pending"]
  assert st[sid3]["analysis_state"]=="READY" and st[sid3]["pending"]
  ps=srv.plan_summary()
  assert ps["readiness"]["pending_sources"]==1 and sid3 in ps["readiness"]["pending_source_ids"]
  jid_pending=srv.M.start([sid3]);zp=wait_job(srv.M,jid_pending);srv.S.drain(10)
  assert zp["job"]["state"]=="COMPLETED"
  st2={x["source_id"]:x for x in srv.source_status_rows()}
  assert all(not st2[x]["pending"] for x in (sid1,sid2,sid3)),st2
  assert st2[sid1]["last_revision"]<st2[sid3]["last_revision"]
  assert srv.S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=? AND fingerprint IS NOT NULL AND placement_state='ACTIVE'",(sid3,))[0]["n"]==1
  assert srv.plan_summary()["readiness"]["pending_sources"]==0
  print("PASS registered source readiness + incremental pending analysis + Plan freshness")
  srv.target_set(str(target))

  A=srv.get_ai()
  assert set(srv.ai_mod.TASK_TYPES)=={"auto_tag","analyze_estate","explain_duplicates","find_review_candidates","propose_target_structure","plan_target_landing","compare_converted_files"}
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

  # Compare Converted Files persists Comparison Sources, groups exact basenames across extensions,
  # uses deterministic probe/decode evidence, refreshes new files, and remains read-only.
  cmp_root=home/"comparison";cmp_root.mkdir()
  (cmp_root/"clip001.avi").write_bytes(b"legacy-video-a")
  (cmp_root/"clip001.mp4").write_bytes(b"converted-video-a")
  (cmp_root/"legacyonly.avi").write_bytes(b"legacy-only")
  def fake_probe(p):
   return {"available":True,"ok":True,"format_name":Path(p).suffix.lstrip("."),"duration":60.0 if p.suffix==".avi" else 59.8,
           "bit_rate":1000.0,"stream_count":2,"video_codec":"fixture","width":1920,"height":1080,"frame_rate":"30/1",
           "audio_codecs":["aac"],"has_video":True,"has_audio":True}
  A2._ffprobe=fake_probe
  A2._ffmpeg_validate=lambda p:{"available":True,"ok":True,"returncode":0,"errors":""}
  cmp_scope={"type":"compare_converted_files","roots":[str(cmp_root)]}
  packet,manifest=A2.converted_packet(cmp_scope)
  groups={x["basename"]:x for x in packet["comparison"]["groups"]}
  assert groups["clip001"]["state"]=="Verified replacement",groups["clip001"]
  assert groups["legacyonly"]["state"]=="Legacy only"
  assert manifest["ffprobe_available"] in (True,False) and "evidence_signature" in manifest
  before_ops=srv.S.rows("SELECT COUNT(*) n FROM operations")[0]["n"]
  ct=A2.create("compare_converted_files",cmp_scope)
  A2.provider=lambda *args:"## Converted-file result\n\nclip001 is a Verified replacement. legacyonly remains Legacy only."
  A2.run(ct["task_id"],"refresh converted media","venice","fixture-model","fixture-key",cmp_scope)
  cdone=wait_task(A2,ct["task_id"])
  assert cdone["status"]=="complete" and "Converted-file result" in cdone["result_markdown"]
  A3=srv.ai_mod.AIManager(srv.S,srv.M,srv.catalog_revision,srv.target_get,srv.plan_summary,srv.active_rows,srv.parse_tags,srv.normalize_tag,srv.metadata_update)
  persisted=A3.public(A3.row(ct["task_id"]),True)
  assert persisted["scope"]["roots"]==[str(cmp_root.resolve())] or persisted["scope"]["roots"]==[str(cmp_root)]
  A3._ffprobe=fake_probe;A3._ffmpeg_validate=lambda p:{"available":True,"ok":True,"returncode":0,"errors":""}
  (cmp_root/"clip002.avi").write_bytes(b"legacy-video-b");(cmp_root/"clip002.mp4").write_bytes(b"converted-video-b")
  p2,m2=A3.converted_packet(persisted["scope"])
  assert any(x["basename"]=="clip002" for x in p2["comparison"]["groups"])
  assert m2["evidence_signature"]!=manifest["evidence_signature"]
  assert srv.S.rows("SELECT COUNT(*) n FROM operations")[0]["n"]==before_ops
  print("PASS persistent Compare Converted Files + FFmpeg evidence + refresh + read-only authority")

  # Overlapping explicit Estate roots remain registered while scan ownership prevents duplicate physical paths.
  overlap=home/"overlap";(overlap/"B"/"C").mkdir(parents=True);(overlap/"B"/"D").mkdir();(overlap/"B"/"E").mkdir()
  (overlap/"B"/"C"/"c.txt").write_text("c");(overlap/"B"/"D"/"d.txt").write_text("d");(overlap/"B"/"E"/"e.txt").write_text("e")
  sid_e=srv.M.add_source("E",str(overlap/"B"/"E"),"fd-e",estate="E")
  sid_c=srv.M.add_source("C",str(overlap/"B"/"C"),"fd-c",estate="C")
  sid_d=srv.M.add_source("D",str(overlap/"B"/"D"),"fd-d",estate="D")
  sid_b=srv.M.add_source("B",str(overlap/"B"),"fd-b",estate="B")
  assert len(srv.S.rows("SELECT source_id FROM sources WHERE source_id IN (?,?,?,?)",(sid_e,sid_c,sid_d,sid_b)))==4
  jid2=srv.M.start([sid_e,sid_c,sid_d,sid_b]);z2=wait_job(srv.M,jid2);srv.S.drain(10);assert z2["job"]["state"]=="COMPLETED"
  phys=srv.S.rows("SELECT path,COUNT(*) n FROM placements WHERE placement_state='ACTIVE' AND path LIKE ? GROUP BY path",(str(overlap/"B")+"%",))
  assert phys and all(int(x["n"])==1 for x in phys),phys
  print("PASS explicit overlapping Estate roots preserved without duplicate physical placements")

  # Correct Folder Search is filesystem-based and exact-exclusion only.
  fs=srv.folder_search(str(overlap/"B"),"#file:*.txt",[str(overlap/"B"/"E")],500)
  paths=[x["path"] for x in fs["results"]]
  assert str((overlap/"B"/"E").resolve()) not in paths
  assert str((overlap/"B"/"C").resolve()) in paths and str((overlap/"B"/"D").resolve()) in paths
  parent=srv.folder_search(str(overlap),"#folder:B",[str(overlap/"B"/"E")],500)
  assert str((overlap/"B").resolve()) in [x["path"] for x in parent["results"]]
  print("PASS Folder Search exact exclusion preserves parent/child/sibling candidates")

  # Live Folder Search progress exposes path/timestamps/counters and completes asynchronously.
  prog=[]
  direct=srv.folder_search(str(overlap/"B"),"#file:*.txt",[],500,lambda z:prog.append(dict(z)))
  assert prog and prog[0]["current_path"] and prog[-1]["scanned_folders"]>=1 and prog[-1]["scanned_files"]>=1
  assert len({x["current_path"] for x in prog})>=2,prog
  started=time.time();sj=srv.folder_search_start(str(overlap/"B"),"#file:*.txt",[],500)
  assert sj["state"]=="RUNNING" and sj["search_id"] and sj["started"]>=started-.5
  deadline=time.time()+10;status=None
  while time.time()<deadline:
   status=srv.folder_search_status(sj["search_id"])
   assert all(k in status for k in ("root","query","current_path","started","updated","scanned_folders","scanned_files","matches"))
   if status["state"]!="RUNNING":break
   time.sleep(.02)
  assert status and status["state"]=="COMPLETED",status
  assert status["scanned_folders"]>=1 and status["scanned_files"]>=1 and isinstance(status["results"],list)
  print("PASS asynchronous Folder Search live path + timer source timestamps + counters")

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

 print("PASS RELEASE C QUALIFICATION")
finally:
 if old_home is None:os.environ.pop("HOME",None)
 else:os.environ["HOME"]=old_home
