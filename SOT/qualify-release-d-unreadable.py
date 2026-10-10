#!/usr/bin/env python3
"""Unreadable files (cloud-only OneDrive placeholders, locked files, broken links) must be reported as errors, not fail the whole source."""
import builtins,importlib.util,os,sys,tempfile,time
from pathlib import Path
HERE=Path(__file__).resolve().parent
def load(name,path):
 sp=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(sp);sys.modules[name]=m;sp.loader.exec_module(m);return m
def wait_job(mgr,jid,timeout=60):
 end=time.time()+timeout
 while time.time()<end:
  z=mgr.snapshot(jid)
  if z and z["job"]["state"] in ("COMPLETED","FAILED","STOPPED","ABORTED","INTERRUPTED"):return z
  time.sleep(.05)
 raise RuntimeError("job timeout")
old=os.environ.get("HOME");real_open=builtins.open
def guarded(file,*a,**k):
 if "locked" in str(file):raise PermissionError(13,"Cloud operation was unsuccessful",str(file))
 return real_open(file,*a,**k)
try:
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("unreadable_fixture",HERE/"sot-turn02-release-d-server.py")
  root=home/"estate";root.mkdir()
  for n,b in [("good1.txt","aaa"),("good2.txt","bbbb"),("locked1.txt","x"),("locked2.txt","yy")]:(root/n).write_text(b)
  os.symlink(str(root/"nowhere"),str(root/"ghost.lnk"))
  sid=srv.M.add_source("Estate",str(root),"d1",estate="Estate")
  builtins.open=guarded
  try:
   info=srv.M.enqueue_info([sid]);z=wait_job(srv.M,info["job_id"])
  finally:builtins.open=real_open
  state=z["job"]["state"];assert state=="COMPLETED",("a source with unreadable files must still complete",state,[e for e in srv.S.rows("SELECT event_type,message FROM events WHERE severity='ERROR' ORDER BY ts DESC LIMIT 6")])
  print("PASS a source containing unreadable files completes (state COMPLETED) instead of FAILED")
  src=srv.S.rows("SELECT errors,hashed_files FROM job_sources WHERE job_id=? AND source_id=?",(info["job_id"],sid))[0]
  assert src["errors"]>=2 and src["hashed_files"]==2,dict(src)
  print("PASS the unreadable files are counted as errors (%d) and the readable files are fingerprinted (2)"%src["errors"])
  rows=srv.S.rows("SELECT availability,COUNT(*) n FROM placements WHERE source_id=? AND placement_state='ACTIVE' GROUP BY availability",(sid,))
  by={r["availability"]:r["n"] for r in rows};assert by.get("AVAILABLE")==2 and by.get("ERROR",0)>=2,by
  print("PASS errored placements stay visible as ERROR (REVIEW), good ones are AVAILABLE")
  js=srv.S.rows("SELECT state FROM job_sources WHERE job_id=? AND source_id=?",(info["job_id"],sid))[0]["state"];assert js=="COMPLETED",js
  print("PASS the source row is COMPLETED, so it records a last synchronized time (it was 'Never' before)")
finally:
 builtins.open=real_open
 if old is not None:os.environ["HOME"]=old
