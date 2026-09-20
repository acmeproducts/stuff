#!/usr/bin/env python3
import hashlib,importlib.util,json,os,sqlite3,sys,tempfile,time
from pathlib import Path

HERE=Path(__file__).resolve().parent

def wait_job(mgr,jid,timeout=30):
 end=time.time()+timeout
 while time.time()<end:
  z=mgr.snapshot(jid)
  if z and z["job"]["state"] in ("COMPLETED","FAILED","STOPPED"):return z
  time.sleep(.03)
 raise RuntimeError("fixture job timeout")

def h(path):
 x=hashlib.sha256()
 with Path(path).open("rb") as f:
  while True:
   b=f.read(1024*1024)
   if not b:break
   x.update(b)
 return x.hexdigest()

with tempfile.TemporaryDirectory() as td:
 home=Path(td)/"home";home.mkdir()
 old_home=os.environ.get("HOME");os.environ["HOME"]=str(home)
 try:
  sp=importlib.util.spec_from_file_location("release_a_server",HERE/"sot-turn02-release-a-server.py")
  srv=importlib.util.module_from_spec(sp);sys.modules[sp.name]=srv;sp.loader.exec_module(srv)
  assert srv.m.SCHEMA==12 and srv.m.VERSION=="turn02-release-a"
  s,m=srv.S,srv.M

  e1=home/"estate1";e2=home/"estate2";target=home/"target"
  e1.mkdir();e2.mkdir();target.mkdir()
  (e1/"unique-a.txt").write_text("unique-a")
  for p in (e1/"dup-a.bin",e1/"dup-b.bin",e2/"dup-c.bin"):p.write_bytes(b"duplicate-content")
  (e2/"unique-b.txt").write_text("unique-b")
  sid1=m.add_source("Estate 1",str(e1),"domain-1",estate="Estate 1")
  sid2=m.add_source("Estate 2",str(e2),"domain-2",estate="Estate 2")
  jid=m.start([sid1,sid2]);z=wait_job(m,jid);s.drain(10)
  assert z["job"]["state"]=="COMPLETED",z["job"]
  rows=s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
  assert len(rows)==5,len(rows)
  classes={}
  for r in rows:classes[r["system_classification"]]=classes.get(r["system_classification"],0)+1
  assert classes=={"UNIQUE":2,"KEEP":1,"EXCESS":2},classes
  dup=s.rows("SELECT placement_no,system_classification FROM placements WHERE fingerprint=(SELECT fingerprint FROM placements WHERE filename='dup-a.bin') AND placement_state='ACTIVE' ORDER BY placement_no")
  assert [x["system_classification"] for x in dup]==["KEEP","EXCESS","EXCESS"],dup
  print("PASS classification UNIQUE + deterministic KEEP + EXCESS")

  cfg=srv.target_set(str(target))
  assert cfg["configured"] and cfg["free_bytes"]>0
  plan=srv.plan_summary()
  assert plan["analysis"]["unique"]["bytes"]+plan["analysis"]["keep"]["bytes"]+plan["analysis"]["excess"]["bytes"]==plan["analysis"]["estate"]["bytes"]
  assert plan["capacity"]["estate"]["bytes"]+plan["capacity"]["open"]["bytes"]==plan["capacity"]["target"]["bytes"]
  assert plan["operations"]["in_play"]["bytes"]+plan["operations"]["landed"]["bytes"]==plan["operations"]["estate"]["bytes"]
  print("PASS additive Plan arithmetic X + Y = Z")

  chosen=[rows[0]["placement_id"],rows[1]["placement_id"]]
  rev0=srv.catalog_revision()
  md=srv.metadata_update({"ids":chosen,"updates":{"add_tags":["alpha","project-x"],"notes":"fixture note","quality_rating":4,"content_rating":5}})
  assert md["catalog_revision"]>rev0
  changed=s.rows("SELECT tags,notes,quality_rating,content_rating,system_classification FROM placements WHERE placement_id IN (?,?)",tuple(chosen))
  assert all("#alpha" in json.loads(x["tags"]) and "#project-x" in json.loads(x["tags"]) for x in changed)
  assert all(x["notes"]=="fixture note" and x["quality_rating"]==4 and x["content_rating"]==5 for x in changed)
  assert all(x["system_classification"] in ("UNIQUE","KEEP","EXCESS") for x in changed)
  print("PASS owner metadata persistence separate from system classification")

  before=s.rows("SELECT * FROM placements WHERE filename='unique-a.txt' AND placement_state='ACTIVE'")[0]
  old_no=before["placement_no"];dest=e2/"grouped";dest.mkdir()
  pf=srv.move_preflight([before["placement_id"]],str(dest));assert pf["count"] if "count" in pf else len(pf["items"])==1
  mv=srv.execute_move([before["placement_id"]],str(dest));ok=[x for x in mv["results"] if x["success"]]
  assert len(ok)==1,mv
  new_id=ok[0]["new_placement_id"];new_path=Path(ok[0]["new_path"])
  assert new_path.is_file() and not (e1/"unique-a.txt").exists()
  after=s.rows("SELECT * FROM placements WHERE placement_id=?",(new_id,))[0]
  assert after["placement_no"]==old_no and after["source_id"]==sid2 and after["path"]==str(new_path)
  assert h(new_path)==before["fingerprint"]
  assert s.rows("SELECT COUNT(*) n FROM operations WHERE operation_type='FOLDER' AND success=1")[0]["n"]==1
  plan=mv["plan"];assert plan["analysis"]["unique"]["bytes"]+plan["analysis"]["keep"]["bytes"]+plan["analysis"]["excess"]["bytes"]==plan["analysis"]["estate"]["bytes"]
  print("PASS Folder filesystem + Database/status/classification/Plan reconciliation")

  probe=e1/"copy-probe.bin";probe.write_bytes(b"copy verification branch");probe_dst=e2/"copy-probe.bin";expected=h(probe)
  real_link=srv.os.link
  try:
   srv.os.link=lambda *a,**k: (_ for _ in ()).throw(OSError("fixture forces copy path"))
   method,got=srv.safe_move(probe,probe_dst,expected)
  finally:srv.os.link=real_link
  assert method=="copy-verify-remove" and got==expected and probe_dst.is_file() and not probe.exists()
  print("PASS cross-filesystem-style copy -> verify -> remove branch")

  duprows=s.rows("SELECT * FROM placements WHERE fingerprint=(SELECT fingerprint FROM placements WHERE filename='dup-a.bin') AND placement_state='ACTIVE' ORDER BY placement_no")
  assert len(duprows)==3
  id_ok,id_fail=duprows[1]["placement_id"],duprows[2]["placement_id"]
  path_ok=Path(duprows[1]["path"])
  real_trash=srv.trash_one
  def partial_trash(path):
   if Path(path).resolve()==path_ok.resolve():
    Path(path).unlink();return "fixture-trash"
   raise RuntimeError("fixture trash unavailable")
  srv.trash_one=partial_trash
  try:
   dj=srv.delete_batch([id_ok,id_fail],"trash")
  finally:srv.trash_one=real_trash
  assert dj["needs_permanent"] and set(dj["permanent_ids"])=={id_fail},dj
  rr={x["placement_id"]:x for x in dj["results"]}
  assert rr[id_ok]["success"] and not rr[id_fail]["success"]
  state_ok=s.rows("SELECT placement_state FROM placements WHERE placement_id=?",(id_ok,))[0]["placement_state"]
  state_fail=s.rows("SELECT placement_state FROM placements WHERE placement_id=?",(id_fail,))[0]["placement_state"]
  assert state_ok=="TRASHED" and state_fail=="ACTIVE"
  assert not path_ok.exists() and Path(duprows[2]["path"]).exists()
  print("PASS partial trash success/failure remains explicit per placement")

  pj=srv.delete_batch([id_fail],"permanent",dj["permanent_token"])
  assert pj["results"][0]["success"] and not Path(duprows[2]["path"]).exists()
  assert s.rows("SELECT placement_state FROM placements WHERE placement_id=?",(id_fail,))[0]["placement_state"]=="DELETED"
  left=s.rows("SELECT system_classification FROM placements WHERE fingerprint=? AND placement_state='ACTIVE'",(duprows[0]["fingerprint"],))
  assert len(left)==1 and left[0]["system_classification"]=="UNIQUE",left
  assert s.rows("SELECT used FROM delete_authorizations WHERE token=?",(dj["permanent_token"],))[0]["used"]==1
  print("PASS second-confirmation authorization subset + post-delete reclassification")

  active=s.rows("SELECT COUNT(*) n FROM placements WHERE placement_state='ACTIVE'")[0]["n"]
  served=len(srv.active_rows([r["placement_id"] for r in s.rows("SELECT placement_id FROM placements WHERE placement_state='ACTIVE'")]))
  assert active==served
  assert s.rows("SELECT COUNT(*) n FROM placements WHERE placement_state IN ('TRASHED','DELETED')")[0]["n"]==2
  assert s.rows("SELECT COUNT(*) n FROM operations WHERE success=0")[0]["n"]>=1
  p=srv.plan_summary()
  assert p["analysis"]["unique"]["bytes"]+p["analysis"]["keep"]["bytes"]+p["analysis"]["excess"]["bytes"]==p["analysis"]["estate"]["bytes"]
  assert p["capacity"]["estate"]["bytes"]+p["capacity"]["open"]["bytes"]==p["capacity"]["target"]["bytes"]
  assert p["operations"]["in_play"]["bytes"]+p["operations"]["landed"]["bytes"]==p["operations"]["estate"]["bytes"]
  print("PASS retired history preserved while current catalog/Plan remain authoritative")

  s.close()

  # Fresh schema-12 database must be copied from, not overwrite, a v11 predecessor.
  with tempfile.TemporaryDirectory() as md:
   mh=Path(md);os.environ["HOME"]=str(mh)
   ep=importlib.util.spec_from_file_location("migration_engine",HERE/"sot-turn02-release-a-engine.py")
   eng=importlib.util.module_from_spec(ep);sys.modules[ep.name]=eng;ep.loader.exec_module(eng)
   eng.PREDECESSOR.parent.mkdir(parents=True,exist_ok=True)
   c=sqlite3.connect(eng.PREDECESSOR);c.executescript(eng.DDL)
   c.execute("INSERT INTO meta(k,v) VALUES('schema','11')")
   c.execute("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled) VALUES('s','Legacy','/legacy','Legacy','legacy','primary',1)")
   c.execute("INSERT INTO placements(placement_id,placement_no,job_id,revision,source_id,estate,path,filename,extension,size,scanned_at,lifecycle,availability) VALUES('p',1,'j',1,'s','Legacy','/legacy/a.txt','a.txt','.txt',1,1,'COMPLETED','AVAILABLE')")
   c.commit();c.close()
   predecessor_bytes=eng.PREDECESSOR.read_bytes()
   ms=eng.Store()
   assert eng.DB_DEFAULT.exists() and eng.PREDECESSOR.read_bytes()==predecessor_bytes
   cols={r["name"] for r in ms.rows("PRAGMA table_info(placements)")}
   assert {"notes","quality_rating","content_rating","system_classification","placement_state","retired_at"}.issubset(cols),cols
   assert ms.rows("SELECT placement_no FROM placements")[0]["placement_no"]==1
   ms.close()
   print("PASS v11 preserved + schema-12 copy migration")
 finally:
  if old_home is None:os.environ.pop("HOME",None)
  else:os.environ["HOME"]=old_home

print("PASS RELEASE A BACKEND QUALIFICATION")
