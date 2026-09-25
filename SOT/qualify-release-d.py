#!/usr/bin/env python3
import importlib.util,json,os,sys,tempfile,threading,time,uuid
from pathlib import Path

HERE=Path(__file__).resolve().parent

def load(name,path):
 sp=importlib.util.spec_from_file_location(name,path)
 m=importlib.util.module_from_spec(sp);sys.modules[name]=m;sp.loader.exec_module(m);return m

def wait_job(mgr,jid,timeout=30):
 end=time.time()+timeout
 while time.time()<end:
  z=mgr.snapshot(jid)
  if z and z["job"]["state"] in ("COMPLETED","FAILED","STOPPED","ABORTED","INTERRUPTED"):return z
  time.sleep(.03)
 raise RuntimeError("analysis job timeout: "+jid)

def wait_compare(A,jid,timeout=30):
 end=time.time()+timeout
 while time.time()<end:
  rows=A.s.rows("SELECT * FROM ai_compare_jobs WHERE compare_job_id=?",(jid,))
  if rows and rows[0]["status"] in ("COMPLETED","FAILED","ABORTED","INTERRUPTED"):return A.compare_public(rows[0],True)
  time.sleep(.03)
 raise RuntimeError("comparison job timeout: "+jid)

def wait_task(A,tid,timeout=15):
 end=time.time()+timeout
 while time.time()<end:
  z=A.row(tid)
  if z and z["status"] not in ("analyzing","applying"):return z
  time.sleep(.03)
 raise RuntimeError("AI task timeout")

old_home=os.environ.get("HOME")
try:
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("release_d_server_fixture",HERE/"sot-turn02-release-d-server.py")
  assert srv.m.VERSION=="turn02-release-d" and srv.m.SCHEMA==14
  original_verify=srv.verified_windows_mount
  srv.verified_windows_mount=lambda letter:(True,{"root":"/mnt/"+str(letter).lower(),"mount":{"target":"/mnt/"+str(letter).lower(),"fstype":"9p","source":str(letter).upper()+":"}})
  fallback=srv.mounted_windows_drive_record("c")
  srv.verified_windows_mount=original_verify
  assert fallback["windows"] is True and fallback["windows_drive"]=="C:" and fallback["available"] is True and fallback["identity_source"]=="verified_mount",fallback
  print("PASS verified mounted Windows drive retains Windows identity without PowerShell inventory")
  tables={x["name"] for x in srv.S.rows("SELECT name FROM sqlite_master WHERE type='table'")}
  assert {"job_scope_sources","ai_compare_jobs","ai_compare_events","ai_turns"}.issubset(tables),tables
  print("PASS Release D schema + persistent job tables")

  # One rejected write is isolated; the serialized writer remains usable.
  try:
   srv.S.submit("INSERT INTO definitely_missing_table(x) VALUES(1)",(),True)
   raise AssertionError("invalid SQL unexpectedly succeeded")
  except Exception:
   pass
  srv.S.submit("INSERT OR REPLACE INTO meta(k,v) VALUES('writer_recovery','ok')",(),True)
  assert srv.S.rows("SELECT v FROM meta WHERE k='writer_recovery'")[0]["v"]=="ok"
  assert srv.S.last_writer_error and "definitely_missing_table" in srv.S.last_writer_error["error"]
  print("PASS DB writer survives statement failure")

  # Historical pre-D jobs with job_sources but no job_scope_sources gain restartable scope metadata on reopen.
  legacy_path=home/"legacy-scope.db"
  ls=srv.m.Store(path=legacy_path)
  legacy_root=home/"legacy-root";legacy_root.mkdir()
  legacy_sid="legacy-source";legacy_jid="legacy-job"
  ls.submit("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled) VALUES(?,?,?,?,?,?,1)",(legacy_sid,"Legacy Source",str(legacy_root),"Legacy Estate","legacy-domain","primary"),True)
  ls.submit("INSERT INTO jobs(job_id,revision,state,created,last_progress,control,job_type,deleted,delete_requested) VALUES(?,1,'INTERRUPTED',?,?,'INTERRUPTED','analysis',0,0)",(legacy_jid,time.time(),time.time()),True)
  ls.submit("INSERT INTO job_sources(job_id,source_id,state,producer_state,last_progress) VALUES(?,?,'INTERRUPTED','COMPLETED',?)",(legacy_jid,legacy_sid,time.time()),True)
  assert not ls.rows("SELECT 1 FROM job_scope_sources WHERE job_id=?",(legacy_jid,))
  ls.close()
  ls2=srv.m.Store(path=legacy_path)
  recovered=ls2.rows("SELECT source_id,label,root,estate,failure_domain,role FROM job_scope_sources WHERE job_id=?",(legacy_jid,))
  assert len(recovered)==1 and recovered[0]["source_id"]==legacy_sid and recovered[0]["root"]==str(legacy_root),recovered
  lm=srv.m.Manager(ls2,workers=1,queue_capacity=4,max_active_jobs=1)
  restarted=lm.restart(legacy_jid)
  rs=lm.snapshot(restarted)
  assert rs["job"]["state"]=="QUEUED" and rs["job"]["source_count"]==1 and rs["scope_sources"][0]["root"]==str(legacy_root),rs
  lm.control(restarted,"abort-delete");lm.scheduler_stop.set();ls2.drain(5);ls2.close()
  print("PASS historical job scope backfill + restart")

  # Two independent source selections create two immutable jobs; scheduler dispatches them.
  e1=home/"estate-one";e2=home/"estate-two";e1.mkdir();e2.mkdir()
  (e1/"a.bin").write_bytes(b"A"*2048);(e2/"b.bin").write_bytes(b"B"*4096)
  sid1=srv.M.add_source("Estate One",str(e1),"domain-one",estate="Estate One")
  sid2=srv.M.add_source("Estate Two",str(e2),"domain-two",estate="Estate Two")
  paused=srv.M.pause_all();assert paused["paused"] is True and paused["max_active_jobs"]>=4
  i1=srv.M.enqueue_info([sid1]);dup=srv.M.enqueue_info([sid1]);i2=srv.M.enqueue_info([sid2])
  assert i1["created"] and i2["created"] and i1["job_id"]!=i2["job_id"]
  assert dup["created"] is False and dup["deduped"] and dup["suppressed_source_count"]==1 and dup["job_id"]==i1["job_id"],dup
  j1=i1["job_id"];j2=i2["job_id"]
  st=srv.M.scheduler_status();assert st["paused"] and st["queued_jobs"]>=2 and st["active_jobs"]==0,st
  resumed=srv.M.resume_all();assert resumed["paused"] is False
  s1=srv.S.rows("SELECT root FROM job_scope_sources WHERE job_id=?",(j1,))
  s2=srv.S.rows("SELECT root FROM job_scope_sources WHERE job_id=?",(j2,))
  assert [x["root"] for x in s1]==[str(e1.resolve())]
  assert [x["root"] for x in s2]==[str(e2.resolve())]
  z1=wait_job(srv.M,j1);z2=wait_job(srv.M,j2);srv.S.drain(10)
  assert z1["job"]["state"]=="COMPLETED" and z2["job"]["state"]=="COMPLETED",(z1,z2)
  assert len(srv.M.list_jobs())>=2
  assert z1["job"]["source_count"]==1 and z2["job"]["source_count"]==1
  assert z1["job"]["elapsed_seconds"]>=0 and z2["job"]["elapsed_seconds"]>=0
  assert z1["job"]["known_remaining_files"]==0 and z2["job"]["known_remaining_files"]==0
  assert all(x["enumeration_complete"] for x in z1["sources"]+z2["sources"])
  print("PASS Pause/Start All + live-source dedupe + independent queued analysis jobs")

  # Restart copies the prior frozen source list to a new job.
  j3=srv.M.restart(j1);assert j3!=j1
  snap3=srv.M.snapshot(j3)
  assert snap3["job"]["state"]=="QUEUED"
  assert [x["root"] for x in snap3["scope_sources"]]==[str(e1.resolve())]
  z3=wait_job(srv.M,j3);assert z3["job"]["state"]=="COMPLETED"
  print("PASS analysis Restart creates a new queued job from frozen scope")

  # Queued Abort + Delete now maps to visible reversible soft deletion.
  j4=srv.M.enqueue([sid1]);srv.M.control(j4,"abort-delete");time.sleep(.05)
  z4=srv.M.snapshot(j4)
  assert z4 and z4["job"]["lifecycle_status"]=="SOFT_DELETED",z4
  assert not any(x["job"]["job_id"]==j4 for x in srv.M.list_jobs(100,include_deleted=False))
  assert any(x["job"]["job_id"]==j4 for x in srv.M.list_jobs(100,include_deleted=True))
  print("PASS per-job Abort + Soft delete")

  # Owner acceptance: job soft-delete is reversible and permanent metadata deletion preserves file evidence.
  jd=srv.M.enqueue([sid1]);zd=wait_job(srv.M,jd);assert zd["job"]["state"]=="COMPLETED",zd
  evidence_before=srv.S.rows("SELECT COUNT(*) n FROM placements")[0]["n"]
  srv.M.control(jd,"soft-delete")
  soft=srv.M.snapshot(jd);assert soft and soft["job"]["deleted"]==1 and soft["job"]["lifecycle_status"]=="SOFT_DELETED",soft
  assert any(x["job"]["job_id"]==jd and x["job"]["lifecycle_status"]=="SOFT_DELETED" for x in srv.M.list_jobs(100,include_deleted=True))
  srv.M.control(jd,"restore");assert srv.M.snapshot(jd)["job"]["deleted"]==0
  srv.M.control(jd,"soft-delete");srv.M.control(jd,"purge")
  assert srv.M.snapshot(jd) is None
  assert srv.S.rows("SELECT COUNT(*) n FROM placements")[0]["n"]==evidence_before
  print("PASS job soft-delete + restore + permanent metadata delete")

  # Owner acceptance: source soft-delete is reversible and permanent registration deletion preserves evidence/snapshots.
  source_evidence_before=srv.S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=?",(sid2,))[0]["n"]
  frozen_before=srv.S.rows("SELECT COUNT(*) n FROM job_scope_sources WHERE job_id=? AND source_id=?",(j2,sid2))[0]["n"]
  srv.M.source_control(sid2,"soft-delete")
  sr=next(x for x in srv.source_status_rows(include_deleted=True) if x["source_id"]==sid2)
  assert sr["soft_deleted"] is True and sr["analysis_state"]=="SOFT_DELETED",sr
  srv.M.source_control(sid2,"restore")
  rr=srv.S.rows("SELECT enabled,stale FROM sources WHERE source_id=?",(sid2,))[0];assert rr["enabled"]==1 and rr["stale"]==1,rr
  srv.M.source_control(sid2,"soft-delete");srv.M.source_control(sid2,"purge")
  assert not srv.S.rows("SELECT 1 FROM sources WHERE source_id=?",(sid2,))
  assert srv.S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=?",(sid2,))[0]["n"]==source_evidence_before
  assert srv.S.rows("SELECT COUNT(*) n FROM job_scope_sources WHERE job_id=? AND source_id=?",(j2,sid2))[0]["n"]==frozen_before
  print("PASS source soft-delete + restore + permanent registration delete")

  A=srv.get_ai()
  cmp_root=home/"comparison";cmp_root.mkdir()
  (cmp_root/"clip001.avi").write_bytes(b"legacy")
  (cmp_root/"clip001.mp4").write_bytes(b"converted")
  (cmp_root/"legacyonly.avi").write_bytes(b"legacy-only")
  def fake_probe(p):
   return {"available":True,"ok":True,"format_name":Path(p).suffix.lstrip("."),"duration":60.0 if Path(p).suffix==".avi" else 59.8,
           "bit_rate":1000.0,"stream_count":2,"video_codec":"fixture","width":1920,"height":1080,"frame_rate":"30/1",
           "audio_codecs":["aac"],"has_video":True,"has_audio":True}
  A._ffprobe=fake_probe
  A._ffmpeg_validate=lambda p:{"available":True,"ok":True,"returncode":0,"errors":""}
  task=A.create("compare_converted_files",{"type":"compare_converted_files","roots":[]})
  scope={"type":"compare_converted_files","roots":[str(cmp_root)]}
  A.compare_max_active=0
  cj=A.enqueue_compare(task["task_id"],scope);cid=cj["compare_job_id"]
  dupcmp=A.enqueue_compare(task["task_id"],scope)
  assert dupcmp["deduped"] is True and dupcmp["created"] is False and dupcmp["compare_job_id"]==cid,dupcmp
  A.compare_max_active=2
  done=wait_compare(A,cid)
  assert done["status"]=="COMPLETED",done
  assert done["scope"]["roots"]==[str(cmp_root.resolve())]
  assert done["files_scanned"]==3 and done["media_files"]==3
  assert done["groups_compared"]==2 and done["verified"]==1 and done["legacy_only"]==1,done
  assert done["media_duration_seconds"]>0 and done["seconds_per_media_minute"] is not None
  groups=done["result"]["comparison"]["groups"];verified=[g for g in groups if g["state"]=="Verified replacement"]
  assert len(verified)==1 and verified[0]["pairs"],groups
  pair=verified[0]["pairs"][0]
  assert pair["legacy"]["path"].endswith("clip001.avi") and pair["converted"]["path"].endswith("clip001.mp4") and pair["validation_converted"]["ok"] is True,pair
  assert done["events"]
  print("PASS deterministic Compare job + dedupe + persisted paths + concrete pair outcome")

  # AI Send reads the completed deterministic packet; it must not rescan the filesystem.
  A.converted_packet=lambda *a,**k:(_ for _ in ()).throw(AssertionError("Send attempted deterministic rescan"))
  A.provider=lambda *args:"## Evidence conversation\n\nDiscussed persisted comparison evidence only."
  A.run(task["task_id"],"Explain the result","venice","fixture-model","fixture-key",scope)
  td=wait_task(A,task["task_id"])
  assert td["status"]=="complete" and "persisted comparison evidence" in td["result_markdown"]
  pub=A.public(td,True)
  assert len(pub["turns"])==2 and pub["compare_jobs"][0]["compare_job_id"]==cid
  print("PASS Compare Send uses completed evidence without rescanning")

  # Atomic transcript ordinal allocation through the serialized writer.
  tid=uuid.uuid4().hex;now=time.time()
  srv.S.submit("INSERT INTO ai_tasks(task_id,task_type,title,status,created,updated,scope_json) VALUES(?,?,?,?,?,?,?)",(tid,"analyze_estate","Ordinal test","draft",now,now,'{"type":"entire_sot"}'),True)
  errors=[]
  def addturn(n):
   try:
    srv.S.submit("INSERT INTO ai_turns(turn_id,task_id,ordinal,role,content,created,status) SELECT ?,?,COALESCE(MAX(ordinal),0)+1,'user',?,?,'ready' FROM ai_turns WHERE task_id=?",(uuid.uuid4().hex,tid,str(n),time.time(),tid),True)
   except Exception as e:errors.append(e)
  ts=[threading.Thread(target=addturn,args=(n,)) for n in range(20)]
  [t.start() for t in ts];[t.join() for t in ts]
  assert not errors,errors
  ords=[x["ordinal"] for x in srv.S.rows("SELECT ordinal FROM ai_turns WHERE task_id=? ORDER BY ordinal",(tid,))]
  assert ords==list(range(1,21)),ords
  print("PASS atomic AI transcript ordinals")

  srv.M.scheduler_stop.set();A.compare_scheduler_stop.set();srv.S.drain(10);srv.S.close()
finally:
 if old_home is None:os.environ.pop("HOME",None)
 else:os.environ["HOME"]=old_home
print("PASS Release D qualification")
