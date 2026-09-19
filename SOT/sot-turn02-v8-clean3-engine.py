#!/usr/bin/env python3
import hashlib,json,os,queue,sqlite3,threading,time,uuid
from pathlib import Path
VERSION="turn02-pre-base-v8-clean3";SCHEMA=11;DB_DEFAULT=Path.home()/".sot-turn02"/"sot-v11-clean.db"
DDL="""
PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY,v TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sources(source_id TEXT PRIMARY KEY,label TEXT NOT NULL,root TEXT NOT NULL UNIQUE,estate TEXT NOT NULL UNIQUE,failure_domain TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'primary',enabled INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS jobs(job_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,state TEXT NOT NULL,created REAL NOT NULL,started REAL,last_progress REAL,ended REAL,control TEXT NOT NULL DEFAULT 'RUN');
CREATE TABLE IF NOT EXISTS job_sources(job_id TEXT NOT NULL,source_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING',producer_state TEXT NOT NULL DEFAULT 'PENDING',queue_depth INTEGER NOT NULL DEFAULT 0,queue_capacity INTEGER NOT NULL DEFAULT 0,active_workers INTEGER NOT NULL DEFAULT 0,current_folder TEXT,current_file TEXT,discovered_files INTEGER NOT NULL DEFAULT 0,discovered_bytes INTEGER NOT NULL DEFAULT 0,hashed_files INTEGER NOT NULL DEFAULT 0,hashed_bytes INTEGER NOT NULL DEFAULT 0,warnings INTEGER NOT NULL DEFAULT 0,errors INTEGER NOT NULL DEFAULT 0,last_progress REAL,PRIMARY KEY(job_id,source_id));
CREATE TABLE IF NOT EXISTS placements(placement_id TEXT PRIMARY KEY,placement_no INTEGER NOT NULL UNIQUE,job_id TEXT NOT NULL,revision INTEGER NOT NULL,source_id TEXT NOT NULL,estate TEXT NOT NULL,path TEXT NOT NULL,filename TEXT NOT NULL,extension TEXT,size INTEGER,created REAL,modified REAL,scanned_at REAL NOT NULL,fingerprint TEXT,content_id TEXT,lifecycle TEXT NOT NULL DEFAULT 'NONE',plan TEXT,disposition TEXT NOT NULL DEFAULT 'NONE',availability TEXT NOT NULL DEFAULT 'AVAILABLE',error_detail TEXT,duplicate_group TEXT,duplicate_cardinality INTEGER,role TEXT,rationale TEXT,last_verified REAL);
CREATE INDEX IF NOT EXISTS idx_place_job ON placements(job_id);CREATE INDEX IF NOT EXISTS idx_place_fp ON placements(job_id,fingerprint);
CREATE TABLE IF NOT EXISTS events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,ts REAL NOT NULL,severity TEXT NOT NULL,event_type TEXT NOT NULL,job_id TEXT,source_id TEXT,message TEXT NOT NULL,detail_json TEXT);
"""
class Store:
 def __init__(self,path=DB_DEFAULT,batch_size=200,batch_ms=.20):
  self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True);self.batch_size=batch_size;self.batch_ms=batch_ms
  c=sqlite3.connect(self.path,timeout=30);c.executescript(DDL);c.execute("INSERT OR REPLACE INTO meta(k,v) VALUES('schema',?)",(str(SCHEMA),));c.commit();c.close()
  self.q=queue.Queue(maxsize=8192);self.stop=threading.Event();self.writer_error=None
  self.t=threading.Thread(target=self._writer,name="sot-db-writer",daemon=True);self.t.start()
 def _connect(self,ro=False):
  if ro:
   c=sqlite3.connect("file:"+str(self.path)+"?mode=ro",uri=True,timeout=2,check_same_thread=False)
  else:c=sqlite3.connect(self.path,timeout=30,check_same_thread=False)
  c.row_factory=sqlite3.Row;c.execute("PRAGMA busy_timeout=2000");c.execute("PRAGMA foreign_keys=ON")
  if not ro:c.execute("PRAGMA journal_mode=WAL");c.execute("PRAGMA synchronous=NORMAL")
  return c
 def _writer(self):
  c=self._connect(False)
  while not self.stop.is_set():
   try:first=self.q.get(timeout=.1)
   except queue.Empty:continue
   batch=[first];deadline=time.monotonic()+self.batch_ms
   while len(batch)<self.batch_size and time.monotonic()<deadline:
    try:batch.append(self.q.get_nowait())
    except queue.Empty:break
   try:
    for item in batch:
     kind,sql,args,ev,box=item
     if kind=="sql":c.execute(sql,args)
     elif kind=="many":c.executemany(sql,args)
    c.commit()
    for _,_,_,ev,box in batch:
     if box is not None:box.append(True)
     if ev:ev.set()
   except Exception as e:
    c.rollback();self.writer_error=repr(e)
    for _,_,_,ev,box in batch:
     if box is not None:box.append(e)
     if ev:ev.set()
   finally:
    for _ in batch:self.q.task_done()
  c.close()
 def submit(self,sql,args=(),wait=False):
  if self.writer_error:raise RuntimeError("DB writer failed: "+self.writer_error)
  ev=threading.Event() if wait else None;box=[] if wait else None;self.q.put(("sql",sql,args,ev,box))
  if wait:
   if not ev.wait(10):raise TimeoutError("DB writer acknowledgement timeout")
   if isinstance(box[0],Exception):raise box[0]
 def many(self,sql,args,wait=False):
  ev=threading.Event() if wait else None;box=[] if wait else None;self.q.put(("many",sql,args,ev,box))
  if wait:
   if not ev.wait(10):raise TimeoutError("DB writer acknowledgement timeout")
   if isinstance(box[0],Exception):raise box[0]
 def drain(self,timeout=30):
  end=time.monotonic()+timeout
  while self.q.unfinished_tasks and time.monotonic()<end:
   if self.writer_error:raise RuntimeError(self.writer_error)
   time.sleep(.01)
  if self.q.unfinished_tasks:raise TimeoutError("DB writer drain timeout")
 def rows(self,sql,args=()):
  c=self._connect(True)
  try:return [dict(x) for x in c.execute(sql,args).fetchall()]
  finally:c.close()
 def db_probe(self,timeout=.15):
  out={"state":"busy"}
  def f():
   try:
    c=self._connect(True);c.execute("SELECT 1").fetchone();c.close();out["state"]="healthy"
   except Exception as e:out.update(state="failed",error=str(e))
  t=threading.Thread(target=f,daemon=True);t.start();t.join(timeout);return out
 def close(self):self.drain();self.stop.set();self.t.join(2)
class Manager:
 def __init__(self,store,workers=8,queue_capacity=128,stall_seconds=30):
  self.s=store;self.workers=workers;self.capacity=queue_capacity;self.stall=stall_seconds;self.runs={};self.lock=threading.RLock();self.seq_lock=threading.Lock();self.next_no=(self.s.rows("SELECT COALESCE(MAX(placement_no),0)+1 n FROM placements")[0]["n"])
 def alloc_no(self):
  with self.seq_lock:
   n=self.next_no;self.next_no+=1;return n
 def event(self,typ,msg,jid=None,sid=None,severity="INFO",detail=None):
  self.s.submit("INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail_json) VALUES(?,?,?,?,?,?,?)",(time.time(),severity,typ,jid,sid,msg,json.dumps(detail or {})))
 def add_source(self,label,root,failure_domain,role="primary",estate=None):
  root=str(Path(root).resolve());estate=estate or label
  for x in self.s.rows("SELECT root FROM sources"):
   a=str(Path(x["root"]).resolve())
   if root==a or root.startswith(a.rstrip("/")+"/") or a.startswith(root.rstrip("/")+"/"):raise RuntimeError("overlapping Estate root")
  sid=hashlib.sha256(root.encode()).hexdigest()[:16]
  self.s.submit("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled) VALUES(?,?,?,?,?,?,1)",(sid,label,root,estate,failure_domain,role),True);return sid
 def start(self,source_ids=None):
  src=self.s.rows("SELECT * FROM sources WHERE enabled=1 ORDER BY source_id")
  if source_ids:src=[x for x in src if x["source_id"] in source_ids]
  if not src:raise RuntimeError("no enabled sources")
  old=self.s.rows("SELECT 1 FROM jobs WHERE state IN ('RUNNING','PAUSED') LIMIT 1")
  if old:raise RuntimeError("job already active")
  rev=(self.s.rows("SELECT COALESCE(MAX(revision),0)+1 n FROM jobs")[0]["n"]);jid=uuid.uuid4().hex;now=time.time()
  self.s.submit("INSERT INTO jobs(job_id,revision,state,created,started,last_progress) VALUES(?,?,'RUNNING',?,?,?)",(jid,rev,now,now,now),True)
  rt={"queues":{x["source_id"]:queue.Queue(self.capacity) for x in src},"done":set(),"stop":threading.Event(),"pause":threading.Event(),"rr":0,"sched":threading.Lock(),"src":{x["source_id"]:x for x in src},"activity":{}}
  self.runs[jid]=rt
  for x in src:self.s.submit("INSERT INTO job_sources(job_id,source_id,state,producer_state,queue_capacity,last_progress) VALUES(?,?,'RUNNING','RUNNING',?,?)",(jid,x["source_id"],self.capacity,now))
  self.event("job_started","Analysis started",jid)
  for x in src:threading.Thread(target=self._produce,args=(jid,rev,x,rt),daemon=True).start()
  for n in range(self.workers):threading.Thread(target=self._worker,args=(jid,rev,rt,n),daemon=True).start()
  threading.Thread(target=self._supervise,args=(jid,rev,rt),daemon=True).start();return jid
 def _produce(self,jid,rev,src,rt):
  sid=src["source_id"];q=rt["queues"][sid];self.event("source_started","Enumeration started",jid,sid)
  try:
   for root,dirs,files in os.walk(src["root"]):
    if rt["stop"].is_set():break
    dirs[:]=[d for d in dirs if not Path(root,d).is_symlink()]
    for name in files:
     while rt["pause"].is_set() and not rt["stop"].is_set():time.sleep(.05)
     if rt["stop"].is_set():break
     p=str(Path(root,name))
     try:
      st=os.stat(p,follow_symlinks=False)
      if not os.path.isfile(p):continue
      pid=hashlib.sha256((jid+"\0"+sid+"\0"+p).encode()).hexdigest();pno=self.alloc_no();now=time.time();created=getattr(st,"st_birthtime",None)
      if created is None and os.name=="nt":created=getattr(st,"st_ctime",None)
      self.s.submit("INSERT INTO placements(placement_id,placement_no,job_id,revision,source_id,estate,path,filename,extension,size,created,modified,scanned_at,lifecycle,role,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?, 'NONE',?,?)",(pid,pno,jid,rev,sid,src["estate"],p,name,Path(name).suffix.lower(),st.st_size,created,st.st_mtime,now,src["role"],now))
      self.s.submit("UPDATE job_sources SET discovered_files=discovered_files+1,discovered_bytes=discovered_bytes+?,current_folder=?,current_file=?,last_progress=? WHERE job_id=? AND source_id=?",(st.st_size,root,name,now,jid,sid))
      q.put((pid,p,st.st_size));self.s.submit("UPDATE jobs SET last_progress=? WHERE job_id=?",(now,jid))
     except Exception as e:
      now=time.time();pid=hashlib.sha256((jid+"\0"+sid+"\0"+p).encode()).hexdigest();pno=self.alloc_no()
      self.s.submit("INSERT OR IGNORE INTO placements(placement_id,placement_no,job_id,revision,source_id,estate,path,filename,extension,scanned_at,lifecycle,availability,error_detail,role,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,'NONE','ERROR',?,?,?)",(pid,pno,jid,rev,sid,src["estate"],p,name,Path(name).suffix.lower(),now,str(e),src["role"],now))
      self.s.submit("UPDATE job_sources SET errors=errors+1,last_progress=? WHERE job_id=? AND source_id=?",(now,jid,sid));self.event("source_file_error",str(e),jid,sid,"ERROR")
  except Exception as e:self.event("source_failed",str(e),jid,sid,"ERROR")
  finally:
   with rt["sched"]:rt["done"].add(sid)
   self.s.submit("UPDATE job_sources SET producer_state='COMPLETED',last_progress=? WHERE job_id=? AND source_id=?",(time.time(),jid,sid));self.event("source_complete","Enumeration complete",jid,sid)
 def _next(self,rt):
  with rt["sched"]:
   ids=list(rt["queues"]);n=len(ids)
   for i in range(n):
    idx=(rt["rr"]+i)%n;sid=ids[idx];q=rt["queues"][sid]
    try:w=q.get_nowait();rt["rr"]=(idx+1)%n;return sid,q,w
    except queue.Empty:pass
  return None,None,None
 def _worker(self,jid,rev,rt,n):
  self.event("worker_started",f"Fingerprint worker {n} started",jid)
  while not rt["stop"].is_set():
   if rt["pause"].is_set():time.sleep(.05);continue
   sid,q,w=self._next(rt)
   if w is None:
    with rt["sched"]:finished=len(rt["done"])==len(rt["queues"])
    if finished and all(x.empty() for x in rt["queues"].values()):break
    time.sleep(.01);continue
   pid,p,size=w;now=time.time();rt["activity"][n]={"worker":n,"placement_id":pid,"path":p,"filename":Path(p).name,"size":size,"bytes":0,"source_id":sid,"updated":now}
   try:
    self.s.submit("UPDATE placements SET lifecycle='IN_PROCESS' WHERE placement_id=?",(pid,))
    self.s.submit("UPDATE job_sources SET active_workers=active_workers+1,current_file=?,last_progress=? WHERE job_id=? AND source_id=?",(Path(p).name,now,jid,sid))
    h=hashlib.sha256()
    with open(p,"rb") as f:
     while True:
      b=f.read(1024*1024)
      if not b:break
      h.update(b);a=rt["activity"].get(n);a and a.update(bytes=min(size,a["bytes"]+len(b)),updated=time.time())
    fp=h.hexdigest();now=time.time();rt["activity"].pop(n,None)
    self.s.submit("UPDATE placements SET fingerprint=?,content_id=?,lifecycle='HASHED',last_verified=? WHERE placement_id=?",(fp,fp,now,pid))
    self.s.submit("UPDATE job_sources SET hashed_files=hashed_files+1,hashed_bytes=hashed_bytes+?,active_workers=MAX(active_workers-1,0),last_progress=? WHERE job_id=? AND source_id=?",(size,now,jid,sid))
    self.s.submit("UPDATE jobs SET last_progress=? WHERE job_id=?",(now,jid))
   except Exception as e:
    rt["activity"].pop(n,None);now=time.time();self.s.submit("UPDATE placements SET availability='ERROR',error_detail=?,last_verified=? WHERE placement_id=?",(str(e),now,pid));self.s.submit("UPDATE job_sources SET errors=errors+1,active_workers=MAX(active_workers-1,0),last_progress=? WHERE job_id=? AND source_id=?",(now,jid,sid));self.event("fingerprint_error",str(e),jid,sid,"ERROR")
   finally:q.task_done()
  self.event("worker_stopped",f"Fingerprint worker {n} stopped",jid)
 def _supervise(self,jid,rev,rt):
  while True:
   with rt["sched"]:done=len(rt["done"])==len(rt["queues"])
   if done and all(q.unfinished_tasks==0 for q in rt["queues"].values()):break
   if rt["stop"].is_set():break
   for sid,q in rt["queues"].items():self.s.submit("UPDATE job_sources SET queue_depth=? WHERE job_id=? AND source_id=?",(q.qsize(),jid,sid))
   time.sleep(.25)
  self.s.drain(60)
  if rt["stop"].is_set():state="STOPPED"
  else:
   self._infer(jid);self.s.drain(60);state="COMPLETED"
  now=time.time();self.s.submit("UPDATE jobs SET state=?,ended=?,last_progress=? WHERE job_id=?",(state,now,now,jid));self.s.submit("UPDATE job_sources SET state=?,queue_depth=0,active_workers=0 WHERE job_id=?",(state,jid));self.event("job_"+state.lower(),state.title(),jid);self.s.drain(30)
 def _infer(self,jid):
  groups=self.s.rows("SELECT fingerprint,COUNT(*) n,MAX(size) size FROM placements WHERE job_id=? AND fingerprint IS NOT NULL GROUP BY fingerprint",(jid,))
  for g in groups:
   fp,n,size=g["fingerprint"],g["n"],g["size"]
   if n>1:self.s.submit("UPDATE placements SET duplicate_group=?,duplicate_cardinality=? WHERE job_id=? AND fingerprint=?",(fp[:16],n,jid,fp))
   self.s.submit("UPDATE placements SET plan=CASE WHEN availability='ERROR' THEN 'REVIEW' WHEN ?=1 THEN 'KEEP' ELSE 'REVIEW' END,rationale=CASE WHEN ?=1 THEN 'Unique content' ELSE 'Duplicate content requires protection/canonical policy' END,lifecycle='COMPLETED' WHERE job_id=? AND fingerprint=?",(n,n,jid,fp))
 def control(self,jid,action):
  rt=self.runs.get(jid)
  if not rt:raise RuntimeError("job not active in this process")
  if action=="pause":rt["pause"].set();state="PAUSED"
  elif action=="resume":rt["pause"].clear();state="RUNNING"
  elif action=="stop":rt["stop"].set();state="STOPPING"
  else:raise RuntimeError("bad action")
  self.s.submit("UPDATE jobs SET state=?,control=?,last_progress=? WHERE job_id=?",(state,action.upper(),time.time(),jid),True);self.event("job_"+action,action.title(),jid)
 def snapshot(self,jid):
  j=self.s.rows("SELECT * FROM jobs WHERE job_id=?",(jid,))
  if not j:return None
  ss=self.s.rows("SELECT js.*,s.label,s.root,s.estate,s.failure_domain,s.role FROM job_sources js JOIN sources s USING(source_id) WHERE js.job_id=? ORDER BY s.label",(jid,))
  m=self.s.rows("SELECT COUNT(*) discovered_files,COALESCE(SUM(size),0) discovered_bytes,SUM(CASE WHEN fingerprint IS NOT NULL THEN 1 ELSE 0 END) hashed_files,COALESCE(SUM(CASE WHEN fingerprint IS NOT NULL THEN size ELSE 0 END),0) hashed_bytes,SUM(CASE WHEN plan='REVIEW' THEN 1 ELSE 0 END) review_count,0 reclaimable_bytes FROM placements WHERE job_id=?",(jid,))[0]
  ev=self.s.rows("SELECT * FROM events WHERE job_id=? ORDER BY event_id DESC LIMIT 100",(jid,))
  return {"job":j[0],"sources":ss,"metrics":m,"events":ev,"activity":list(self.runs.get(jid,{}).get("activity",{}).values())}
