#!/usr/bin/env python3
"""Keep rule: landed copy wins, then highest-ranked root, then shortest path. Manual Keep ticks stick across re-ranks."""
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
  srv=load("keep_rule_fixture",HERE/"sot-turn02-release-d-server.py");M,S=srv.M,srv.S
  a=home/"a";b=home/"b";a.mkdir();b.mkdir()
  (a/"index.html").write_text("same");(a/"index (1).html").write_text("same");(b/"index.html").write_text("same")
  (a/"x.jpg").write_text("photo");(b/"deep").mkdir();(b/"deep"/"x.jpg").write_text("photo")
  (b/"only.txt").write_text("unique")
  sa=M.add_source("A",str(a),"d1",estate="A");sb=M.add_source("B",str(b),"d2",estate="B")
  z=wait_job(M,M.enqueue_info([sa,sb])["job_id"]);assert z["job"]["state"]=="COMPLETED",z["job"]["state"]
  def cls(path):return S.rows("SELECT system_classification c FROM placements WHERE path=? AND placement_state='ACTIVE'",(str(path),))[0]["c"]
  def pid(path):return S.rows("SELECT placement_id FROM placements WHERE path=?",(str(path),))[0]["placement_id"]
  M.set_source_rank([sb,sa])
  assert cls(b/"index.html")=="KEEP" and cls(a/"index.html")=="EXCESS" and cls(a/"index (1).html")=="EXCESS"
  print("PASS the copy in the highest-ranked root is Keep (B ranked first)")
  M.set_source_rank([sa,sb])
  assert cls(a/"index.html")=="KEEP" and cls(a/"index (1).html")=="EXCESS" and cls(b/"index.html")=="EXCESS"
  print("PASS re-ranking moves Keep; inside one root the shortest path wins (index.html over index (1).html)")
  assert cls(a/"x.jpg")=="KEEP" and cls(b/"deep"/"x.jpg")=="EXCESS" and cls(b/"only.txt")=="UNIQUE"
  print("PASS unique files stay Unique")
  M.set_keep(pid(b/"deep"/"x.jpg"),True)
  assert cls(b/"deep"/"x.jpg")=="KEEP" and cls(a/"x.jpg")=="KEEP"
  M.set_keep(pid(a/"x.jpg"),False)
  assert cls(a/"x.jpg")=="EXCESS" and cls(b/"deep"/"x.jpg")=="KEEP"
  print("PASS a manual Keep tick moves Keep to the chosen copy; keeping both or neither is allowed")
  M.set_source_rank([sa,sb]);M.set_source_rank([sb,sa]);M.set_source_rank([sa,sb])
  assert cls(a/"x.jpg")=="EXCESS" and cls(b/"deep"/"x.jpg")=="KEEP"
  print("PASS manual decisions survive any number of re-ranks")
  M.set_keep(pid(b/"only.txt"),False);assert cls(b/"only.txt")=="EXCESS"
  print("PASS unticking a unique file marks it Excess")
  S.submit("UPDATE placements SET plan='LANDED' WHERE path=?",(str(b/"index.html"),),True);S.drain(5);M.recompute_classifications()
  assert cls(b/"index.html")=="KEEP" and cls(a/"index.html")=="EXCESS"
  print("PASS a landed copy wins Keep over a higher-ranked root")
  ranked=[r["source_id"] for r in srv.source_status_rows(False)];assert ranked==[sa,sb],ranked
  print("PASS the sources list comes back in rank order")
finally:
 if old is not None:os.environ["HOME"]=old
