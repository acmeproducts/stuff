#!/usr/bin/env python3
"""Release G engine gate: excluding a root takes its files out of Keep / Excess; including it again recalculates."""
import importlib.util,json,os,sys,tempfile,time
from pathlib import Path
HERE=Path(__file__).resolve().parent
def load(name,path):
 sp=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(sp);sys.modules[name]=m;sp.loader.exec_module(m);return m
def wait_jobs(S,timeout=60):
 end=time.time()+timeout
 while time.time()<end:
  if not S.rows("SELECT COUNT(*) n FROM jobs WHERE state IN ('QUEUED','RUNNING','PAUSED','STOPPING')")[0]["n"]:return
  time.sleep(.05)
 raise RuntimeError("job timeout")
old=os.environ.get("HOME")
try:
 with tempfile.TemporaryDirectory() as td:
  home=Path(td);os.environ["HOME"]=str(home)
  srv=load("release_g_fixture",HERE/"sot-turn02-release-d-server.py");M,S=srv.M,srv.S
  a=home/"a";b=home/"b";c=home/"c"
  for d in (a,b,c):d.mkdir()
  (a/"dup.txt").write_text("same");(b/"dup.txt").write_text("same");(c/"dup.txt").write_text("same");(a/"only.txt").write_text("only in a")
  sa=M.add_source("A",str(a),"d1",estate="A");sb=M.add_source("B",str(b),"d2",estate="B");sc=M.add_source("C",str(c),"d3",estate="C")
  M.enqueue_info([sa,sb,sc]);wait_jobs(S);M.set_source_rank([sa,sb,sc])
  cls=lambda p:S.rows("SELECT system_classification c FROM placements WHERE path=? AND placement_state='ACTIVE'",(str(p),))[0]["c"]
  assert (cls(a/"dup.txt"),cls(b/"dup.txt"),cls(c/"dup.txt"),cls(a/"only.txt"))==("KEEP","EXCESS","EXCESS","UNIQUE")
  M.set_excluded(sa,True)
  assert (cls(a/"dup.txt"),cls(a/"only.txt"))==("EXCLUDED","EXCLUDED") and cls(b/"dup.txt")=="KEEP" and cls(c/"dup.txt")=="EXCESS",(cls(a/"dup.txt"),cls(b/"dup.txt"),cls(c/"dup.txt"))
  assert S.rows("SELECT excluded FROM sources WHERE source_id=?",(sa,))[0]["excluded"]==1
  print("PASS excluding a root marks its files Excluded and Keep moves to the next root in priority")
  M.set_excluded(sa,False)
  assert (cls(a/"dup.txt"),cls(b/"dup.txt"),cls(c/"dup.txt"),cls(a/"only.txt"))==("KEEP","EXCESS","EXCESS","UNIQUE")
  print("PASS including it again recalculates Keep / Excess as before")
  # a manual Keep on a copy in a root that is later excluded: the group falls back to the priority rule
  M.set_keep(S.rows("SELECT placement_id FROM placements WHERE path=?",(str(c/"dup.txt"),))[0]["placement_id"],True)
  M.set_keep(S.rows("SELECT placement_id FROM placements WHERE path=?",(str(a/"dup.txt"),))[0]["placement_id"],False)
  assert (cls(a/"dup.txt"),cls(b/"dup.txt"),cls(c/"dup.txt"))==("EXCESS","EXCESS","KEEP")
  M.set_excluded(sc,True);assert cls(c/"dup.txt")=="EXCLUDED" and cls(a/"dup.txt")=="KEEP" and cls(b/"dup.txt")=="EXCESS",(cls(a/"dup.txt"),cls(b/"dup.txt"))
  M.set_excluded(sc,False);assert cls(c/"dup.txt")=="KEEP" and cls(a/"dup.txt")=="EXCESS",(cls(a/"dup.txt"),cls(c/"dup.txt"))
  print("PASS a manual Keep in an excluded root hands Keep back to the priority rule, and returns when the root is included")
  ids=[r["placement_id"] for r in S.rows("SELECT placement_id FROM placements WHERE source_id=?",(sa,))];M.set_excluded(sa,True)
  srv.target_get=lambda:{"configured":True,"path":str(home/"t"),"free_bytes":10**9}
  assert not srv.land_candidates(ids),"excluded files never land"
  print("PASS files of an excluded root never land")
  # an offline drive (root gone, or an empty mount folder) never retires a root's files
  M.set_excluded(sa,False);n0=S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=? AND placement_state='ACTIVE'",(sb,))[0]["n"]
  b.rename(home/"b-offline");z=M.check_source_metadata(sb);assert z.get("offline") and not z["changed"],z
  M.enqueue_info([sb]);wait_jobs(S);assert S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=? AND placement_state='ACTIVE'",(sb,))[0]["n"]==n0
  b.mkdir();M.enqueue_info([sb]);wait_jobs(S);assert S.rows("SELECT COUNT(*) n FROM placements WHERE source_id=? AND placement_state='ACTIVE'",(sb,))[0]["n"]==n0,"empty mount folder"
  b.rmdir();(home/"b-offline").rename(b);M.enqueue_info([sb]);wait_jobs(S);assert cls(b/"dup.txt") in ("KEEP","EXCESS")
  print("PASS a root that is offline (missing or an empty mount folder) keeps its files; nothing is retired, nothing recalculates")
finally:
 if old is not None:os.environ["HOME"]=old
