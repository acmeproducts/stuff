#!/usr/bin/env python3
"""A completed sync of an unchanged tree must not be reported stale (nested folders, real engine + real scan)."""
import importlib.util,os,sys,tempfile,time
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
old=os.environ.get("HOME")
try:
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("sig_fixture",HERE/"sot-turn02-release-d-server.py")
  root=home/"estate"
  # nested folders whose lexical-path order differs from directory-walk order ("a b" < "a/x" but "a" files walk before "a b")
  for rel,body in [("top.txt","1"),("a/x.txt","22"),("a/y/z.txt","333"),("a b/q.txt","4444"),("a-b/r.txt","55555"),("a/y/deep/w.txt","666666"),("B.txt","7")]:
   p=root/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(body)
  sid=srv.M.add_source("Estate",str(root),"d1",estate="Estate")
  info=srv.M.enqueue_info([sid]);wait_job(srv.M,info["job_id"])
  live=srv.M.metadata_signature(sid);placed=srv.M.placement_signature(sid)
  assert live["files"]==placed["files"]==7 and live["bytes"]==placed["bytes"],(live,placed)
  assert live["digest"]==placed["digest"],"signature depends on traversal order: unchanged tree looks changed\nlive=%s\nplaced=%s"%(live,placed)
  print("PASS an unchanged nested tree has the same live and stored signature (order independent)")
  z=srv.M.check_source_metadata(sid);assert z["changed"] is False,z
  assert not srv.S.rows("SELECT stale FROM sources WHERE source_id=?",(sid,))[0]["stale"]
  print("PASS freshly synced nested source is not reported stale")
  # legacy baseline (old, traversal-order digest) with equal counts must upgrade silently instead of re-syncing forever
  import json
  legacy=dict(live);legacy.pop("v",None);legacy["digest"]="0"*64
  srv.S.submit("UPDATE sources SET metadata_signature=?,stale=1 WHERE source_id=?",(json.dumps(legacy,sort_keys=True),sid),True);srv.S.drain(5)
  z=srv.M.check_source_metadata(sid);assert z["changed"] is False,z
  assert srv.S.rows("SELECT stale FROM sources WHERE source_id=?",(sid,))[0]["stale"]==0
  assert json.loads(srv.S.rows("SELECT metadata_signature FROM sources WHERE source_id=?",(sid,))[0]["metadata_signature"]).get("v")==2
  print("PASS legacy baseline with matching files/bytes/newest-mtime is upgraded silently, not re-synced")
  # real changes are still detected
  (root/"a"/"new.txt").write_text("x");z=srv.M.check_source_metadata(sid);assert z["changed"] is True,z
  (root/"a"/"new.txt").unlink();z=srv.M.check_source_metadata(sid);assert z["changed"] is False,z
  (root/"top.txt").write_text("changed-size");z=srv.M.check_source_metadata(sid);assert z["changed"] is True,z
  print("PASS added / removed / modified files are still detected")
finally:
 if old is not None:os.environ["HOME"]=old
