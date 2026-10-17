#!/usr/bin/env python3
"""Release E engine gate: the TARGET is fingerprinted, landed content wins, landing copies and verifies, deficits stop, target edits revert."""
import importlib.util,json,os,sys,tempfile,time
from pathlib import Path
HERE=Path(__file__).resolve().parent
def load(name,path):
 sp=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(sp);sys.modules[name]=m;sp.loader.exec_module(m);return m
def wait_jobs(M,S,timeout=60):
 end=time.time()+timeout
 while time.time()<end:
  live=S.rows("SELECT COUNT(*) n FROM jobs WHERE state IN ('QUEUED','RUNNING','PAUSED','STOPPING')")[0]["n"]
  if not live:return
  time.sleep(.05)
 raise RuntimeError("job timeout")
def scan(M,S,ids):M.enqueue_info(ids);wait_jobs(M,S)
def wait_land(srv,timeout=60):
 end=time.time()+timeout
 while time.time()<end:
  if srv.land_status()["state"]=="IDLE":return srv.land_status()["job"]
  time.sleep(.05)
 raise RuntimeError("land timeout")
old=os.environ.get("HOME")
try:
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("release_e_fixture",HERE/"sot-turn02-release-d-server.py");M,S=srv.M,srv.S
  a=home/"a";b=home/"b";t=home/"t";t2=home/"t2"
  for d in (a,b,t,t2,a/"sub"):d.mkdir(parents=True)
  (a/"old.jpg").write_text("landed before SOT");(t/"old.jpg").write_text("landed before SOT")
  (a/"one.txt").write_text("unique one");(a/"sub"/"two.txt").write_text("dup two");(b/"two.txt").write_text("dup two");(b/"three.bin").write_text("x"*5000)
  srv.TARGET_FILE.parent.mkdir(parents=True,exist_ok=True);srv.TARGET_FILE.write_text(json.dumps({"path":str(t),"label":"T"}))
  sa=M.add_source("A",str(a),"d1",estate="A");sb=M.add_source("B",str(b),"d2",estate="B");tsid=srv.ensure_target_source()
  scan(M,S,[sa,sb,tsid]);M.set_source_rank([sa,sb])
  def row(p):
   r=S.rows("SELECT * FROM placements WHERE path=? AND placement_state='ACTIVE'",(str(p),));return r[0] if r else None
  cls=lambda p:(row(p) or {}).get("system_classification")
  assert S.rows("SELECT role FROM sources WHERE source_id=?",(tsid,))[0]["role"]=="target"
  assert cls(t/"old.jpg")=="LANDED" and cls(a/"old.jpg")=="EXCESS",(cls(t/"old.jpg"),cls(a/"old.jpg"))
  print("PASS the TARGET is fingerprinted read-only; a file already on it is Landed and every source copy of it is Excess")
  try:M.set_keep(row(a/"old.jpg")["placement_id"],True);raise SystemExit("FAIL keep on landed content was allowed")
  except RuntimeError:pass
  print("PASS a Keep tick cannot pull already-landed content back into play")
  assert srv.overlaps_target(str(t)) and srv.overlaps_target(str(t/"x")) and not srv.overlaps_target(str(a))
  print("PASS a folder that is the TARGET (or inside it) cannot be added as a root")
  ids=[r["placement_id"] for r in S.rows("SELECT placement_id FROM placements WHERE placement_state='ACTIVE' AND system_classification IN ('UNIQUE','KEEP')")]
  pf=srv.land_preflight(ids);assert pf["fits"] and pf["files"]==3 and pf["deficit_bytes"]==0,pf
  print("PASS preflight: %d files, %d bytes, fits, nothing short"%(pf["files"],pf["bytes"]))
  # collision: a different file already sits where one.txt would land
  dest_one=srv.target_dest(str(a/"one.txt"),str(t));dest_one.parent.mkdir(parents=True,exist_ok=True);dest_one.write_text("someone else's file")
  srv.land_start(ids);j=wait_land(srv);assert j["state"]=="COMPLETED" and j["files_done"]==3 and not j["errors"],j
  assert (dest_one.parent/"one (2).txt").read_text()=="unique one" and dest_one.read_text()=="someone else's file"
  assert srv.target_dest(str(b/"three.bin"),str(t)).read_text()=="x"*5000
  assert not list(t.rglob("*.sotpart"))
  print("PASS landing copies to the mirrored path, verifies the fingerprint, keeps a different same-named file and adds \" (2)\"")
  for p in (a/"one.txt",a/"sub"/"two.txt",b/"two.txt",b/"three.bin"):assert cls(p)=="EXCESS",(p,cls(p))
  assert (a/"one.txt").read_text()=="unique one" and (b/"three.bin").exists()
  print("PASS after landing every source copy is Excess and the sources are untouched")
  ids2=[r["placement_id"] for r in S.rows("SELECT placement_id FROM placements WHERE placement_state='ACTIVE' AND system_classification IN ('UNIQUE','KEEP')")];assert not ids2,ids2
  # TARGET edits revert: delete a landed file on the target and rescan it
  srv.target_dest(str(b/"three.bin"),str(t)).unlink();scan(M,S,[tsid])
  assert cls(b/"three.bin")=="UNIQUE",cls(b/"three.bin")
  print("PASS a file deleted on the TARGET stops being Landed and its source copy goes back in play")
  # deficit: land with almost no room
  (b/"big.bin").write_text("y"*4000);(a/"small.txt").write_text("s");scan(M,S,[sa,sb])
  ids=[r["placement_id"] for r in S.rows("SELECT placement_id FROM placements WHERE placement_state='ACTIVE' AND system_classification IN ('UNIQUE','KEEP')")]
  real=srv.target_get;srv.land_reserve=lambda total:0
  srv.target_get=lambda:{**real(),"free_bytes":100,"total_bytes":10**9}
  pf=srv.land_preflight(ids);assert not pf["fits"] and pf["will_land"]["files"]==1 and [r["source_id"] for r in pf["roots_short"]]==[sb],pf
  print("PASS preflight with a deficit: lands in priority order, lists exactly the roots that will not make it")
  srv.land_start(ids);j=wait_land(srv);assert j["state"]=="COMPLETED" and j["stopped_full"] and j["files_done"]==1,j
  assert cls(a/"small.txt")=="EXCESS" and cls(b/"big.bin")=="UNIQUE"
  print("PASS landing stops when the TARGET is full and keeps what already landed")
  srv.target_get=real
  # change target, keeping the old one as a root
  srv.TARGET_FILE.write_text(json.dumps({"path":str(t2),"label":"T2"}));nt=srv.ensure_target_source(keep_old_as_root=True)
  roles={r["root"]:r["role"] for r in S.rows("SELECT root,role FROM sources WHERE enabled=1")}
  assert roles[str(t2)]=="target" and roles[str(t)]=="primary",roles
  scan(M,S,[nt]);assert cls(a/"old.jpg")=="KEEP" and cls(t/"old.jpg")=="EXCESS",(cls(a/"old.jpg"),cls(t/"old.jpg"))
  print("PASS change target: the new folder becomes the TARGET, the old one stays as a root, everything recalculates")
  # remove a root: its files leave every view, nothing on disk is touched
  M.source_control(sb,"soft-delete")
  assert not S.rows("SELECT 1 FROM placements WHERE source_id=? AND placement_state='ACTIVE'",(sb,)) and (b/"big.bin").exists()
  print("PASS removing a root drops its files from SOT and leaves the disk alone")
  import shutil;shutil.rmtree(a/"sub");a2=home/"gone";a2.mkdir();sg=M.add_source("G",str(a2),"d3",estate="G");a2.rmdir()
  st={x["source_id"]:x for x in srv.source_status_rows(False)};assert st[sg]["reachable"] is False and st[sa]["reachable"] is True
  print("PASS each root reports whether it can be reached")
finally:
 if old is not None:os.environ["HOME"]=old
