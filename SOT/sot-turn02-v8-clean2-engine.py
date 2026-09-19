#!/usr/bin/env python3
# SOT Turn 02 v5 — clean lineage engine. Read-only owner storage.
from __future__ import annotations
import hashlib, json, os, queue, sqlite3, threading, time, uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Optional
VERSION="turn02-pre-base-v8-clean2";SCHEMA=9;DB_DEFAULT=Path.home()/".sot-turn02"/"sot-v9-clean.db";ACTIVE={"STARTING","RUNNING","PAUSING","PAUSED","STOPPING","INFERENCING"}
DDL="""PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS jobs(job_id TEXT PRIMARY KEY,revision INTEGER NOT NULL,state TEXT NOT NULL,stage TEXT NOT NULL,control TEXT NOT NULL DEFAULT 'RUN',created REAL NOT NULL,started REAL,finished REAL,last_progress REAL,error TEXT);
CREATE TABLE IF NOT EXISTS sources(source_id TEXT PRIMARY KEY,label TEXT NOT NULL,root TEXT NOT NULL UNIQUE,estate TEXT NOT NULL UNIQUE,failure_domain TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'primary',enabled INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS job_sources(job_id TEXT NOT NULL,source_id TEXT NOT NULL,state TEXT NOT NULL DEFAULT 'PENDING',producer_state TEXT NOT NULL DEFAULT 'PENDING',queue_depth INTEGER NOT NULL DEFAULT 0,queue_capacity INTEGER NOT NULL DEFAULT 0,active_workers INTEGER NOT NULL DEFAULT 0,discovered_files INTEGER NOT NULL DEFAULT 0,discovered_bytes INTEGER NOT NULL DEFAULT 0,hashed_files INTEGER NOT NULL DEFAULT 0,hashed_bytes INTEGER NOT NULL DEFAULT 0,warnings INTEGER NOT NULL DEFAULT 0,errors INTEGER NOT NULL DEFAULT 0,current_folder TEXT,current_file TEXT,started REAL,last_progress REAL,finished REAL,PRIMARY KEY(job_id,source_id));
CREATE TABLE IF NOT EXISTS placements(placement_id TEXT PRIMARY KEY,job_id TEXT NOT NULL,revision INTEGER NOT NULL,source_id TEXT NOT NULL,estate TEXT NOT NULL,path TEXT NOT NULL,filename TEXT NOT NULL,extension TEXT NOT NULL,size INTEGER,created REAL,modified REAL,scanned_at REAL NOT NULL,fingerprint TEXT,content_id TEXT,lifecycle TEXT NOT NULL DEFAULT 'NONE',plan TEXT,disposition TEXT NOT NULL DEFAULT 'NONE',availability TEXT NOT NULL DEFAULT 'AVAILABLE',error_detail TEXT,duplicate_group TEXT,duplicate_cardinality INTEGER,role TEXT,rationale TEXT,last_verified REAL,UNIQUE(job_id,source_id,path));
CREATE INDEX IF NOT EXISTS ix_place_job_hash ON placements(job_id,fingerprint);
CREATE TABLE IF NOT EXISTS duplicate_groups(job_id TEXT NOT NULL,group_id TEXT NOT NULL,content_id TEXT NOT NULL,cardinality INTEGER NOT NULL,content_size INTEGER NOT NULL,total_bytes INTEGER NOT NULL,excess_bytes INTEGER NOT NULL,PRIMARY KEY(job_id,group_id));
CREATE TABLE IF NOT EXISTS events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,ts REAL NOT NULL,severity TEXT NOT NULL,event_type TEXT NOT NULL,job_id TEXT,source_id TEXT,message TEXT NOT NULL,detail TEXT);"""
@dataclass(frozen=True)
class Work: source_id:str;placement_id:str;path:str;size:int
class Store:
 def __init__(self,path:Path=DB_DEFAULT):
  self.path=Path(path);self.path.parent.mkdir(parents=True,exist_ok=True);self.lock=threading.RLock()
  self.db=sqlite3.connect(self.path,timeout=30,check_same_thread=False);self.db.row_factory=sqlite3.Row
  self.db.execute("PRAGMA foreign_keys=ON");self.db.execute("PRAGMA busy_timeout=30000");self.db.execute("PRAGMA journal_mode=WAL");self.db.execute("PRAGMA synchronous=NORMAL");self._init()
 def con(self):return self.db
 def _init(self):
  new=not self.path.exists()
  with self.lock:
   c=self.db;c.executescript(DDL);row=c.execute("SELECT value FROM meta WHERE key='schema'").fetchone()
   if row and int(row[0])!=SCHEMA:raise RuntimeError(f"unsupported schema {row[0]}, expected {SCHEMA}")
   c.execute("INSERT OR REPLACE INTO meta(key,value) VALUES('schema',?),('version',?)",(str(SCHEMA),VERSION))
  if new:self.event('INFO','database_created',None,None,f'Created schema {SCHEMA}')
  self.recover()
 def execute(self,sql,args=()):
  with self.lock:
   try:
    cur=self.db.execute(sql,args);self.db.commit();return cur.rowcount
   except Exception:self.db.rollback();raise
 def rows(self,sql,args=()):
  with self.lock:return [dict(x) for x in self.db.execute(sql,args).fetchall()]
 def ping(self):
  with self.lock:return self.db.execute("SELECT 1").fetchone()[0]==1
 def event(self,severity,typ,job,source,msg,detail=None):self.execute("INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail) VALUES(?,?,?,?,?,?,?)",(time.time(),severity,typ,job,source,msg,json.dumps(detail,separators=(',',':')) if detail is not None else None))
 def recover(self):
  marks=','.join('?'*len(ACTIVE));jobs=self.rows(f"SELECT job_id,state FROM jobs WHERE state IN ({marks})",tuple(ACTIVE));now=time.time()
  for j in jobs:self.execute("UPDATE jobs SET state='FAILED',stage='RECOVERED',finished=?,error='backend_restart' WHERE job_id=?",(now,j['job_id']));self.event('ERROR','job_recovered',j['job_id'],None,'Prior active job closed after backend restart',{'prior_state':j['state']})
class Manager:
 def __init__(self,store,workers=4,queue_capacity=128,stall_seconds=20):self.s=store;self.worker_count=max(2,workers);self.capacity=max(4,queue_capacity);self.stall_seconds=stall_seconds;self.lock=threading.RLock();self.runtime={}
 def add_source(self,label,root,failure_domain,role='primary',estate=None):
  root=str(Path(root).resolve());estate=estate or label
  for x in self.s.rows("SELECT root FROM sources"):
   a=str(Path(x['root']).resolve())
   if root==a or root.startswith(a.rstrip('/')+'/') or a.startswith(root.rstrip('/')+'/'):raise RuntimeError("overlapping Estate root")
  sid=hashlib.sha256(root.encode()).hexdigest()[:16];self.s.execute("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled) VALUES(?,?,?,?,?,?,1)",(sid,label,root,estate,failure_domain,role));return sid
 def start(self,source_ids:Optional[list[str]]=None):
  active=self.s.rows("SELECT job_id FROM jobs WHERE state IN ('STARTING','RUNNING','PAUSING','PAUSED','STOPPING','INFERENCING')")
  if active:raise RuntimeError(f"active job {active[0]['job_id']}")
  sql="SELECT * FROM sources WHERE enabled=1";args=()
  if source_ids:sql+=f" AND source_id IN ({','.join('?'*len(source_ids))})";args=tuple(source_ids)
  src=self.s.rows(sql,args)
  if not src:raise RuntimeError('no enabled sources')
  rev=self.s.rows("SELECT COALESCE(MAX(revision),0)+1 n FROM jobs")[0]['n'];jid=uuid.uuid4().hex;now=time.time();self.s.execute("INSERT INTO jobs(job_id,revision,state,stage,created,started,last_progress) VALUES(?,?,'STARTING','DISCOVER+HASH',?,?,?)",(jid,rev,now,now,now))
  for x in src:self.s.execute("INSERT INTO job_sources(job_id,source_id,queue_capacity) VALUES(?,?,?)",(jid,x['source_id'],self.capacity))
  rt={'queues':{x['source_id']:queue.Queue(self.capacity) for x in src},'done':set(),'sched_lock':threading.Lock(),'stop':threading.Event(),'pause':threading.Event(),'sources':{x['source_id']:x for x in src},'workers':[],'producer_threads':[],'rr':0};self.runtime[jid]=rt;self.s.event('INFO','job_started',jid,None,'Multi-queue analysis started',{'sources':len(src),'workers':self.worker_count,'queue_capacity_each':self.capacity});self.s.execute("UPDATE jobs SET state='RUNNING' WHERE job_id=?",(jid,))
  for x in src:
   t=threading.Thread(target=self._produce,args=(jid,x),daemon=True);rt['producer_threads'].append(t);t.start()
  for n in range(self.worker_count):
   t=threading.Thread(target=self._worker,args=(jid,n),daemon=True);rt['workers'].append(t);t.start()
  threading.Thread(target=self._supervise,args=(jid,),daemon=True).start();return jid
 def control(self,jid,action):
  a=action.upper();rt=self.runtime.get(jid)
  if a not in {'PAUSE','RESUME','STOP'}:raise ValueError(action)
  self.s.execute("UPDATE jobs SET control=? WHERE job_id=?",('RUN' if a=='RESUME' else a,jid));self.s.event('INFO',f"job_{a.lower()}",jid,None,a)
  if rt:
   if a=='PAUSE':rt['pause'].set();self.s.execute("UPDATE jobs SET state='PAUSED' WHERE job_id=?",(jid,))
   elif a=='RESUME':rt['pause'].clear();self.s.execute("UPDATE jobs SET state='RUNNING' WHERE job_id=?",(jid,))
   else:rt['stop'].set();self.s.execute("UPDATE jobs SET state='STOPPING' WHERE job_id=?",(jid,))
 def _wait(self,rt):
  while rt['pause'].is_set() and not rt['stop'].is_set():time.sleep(.1)
  return not rt['stop'].is_set()
 def _produce(self,jid,src):
  sid=src['source_id'];rt=self.runtime[jid];q=rt['queues'][sid];now=time.time();self.s.execute("UPDATE job_sources SET state='RUNNING',producer_state='ENUMERATING',started=?,last_progress=? WHERE job_id=? AND source_id=?",(now,now,jid,sid));self.s.event('INFO','source_started',jid,sid,'Enumeration started',{'root':src['root']})
  try:
   for base,dirs,files in os.walk(src['root'],topdown=True,followlinks=False):
    if not self._wait(rt):break
    for name in files:
     if not self._wait(rt):break
     p=os.path.join(base,name);pid=hashlib.sha256((jid+'\0'+sid+'\0'+p).encode()).hexdigest()
     try:
      st=os.stat(p,follow_symlinks=False);size=int(st.st_size);created=getattr(st,'st_birthtime',None);now=time.time();self.s.execute("INSERT INTO placements(placement_id,job_id,revision,source_id,estate,path,filename,extension,size,created,modified,scanned_at,lifecycle,role,last_verified) SELECT ?,?,revision,?,?,?,?,?,?,?,?, 'NONE',?,? FROM jobs WHERE job_id=?",(pid,jid,sid,src['estate'],p,name,Path(name).suffix.lower(),size,created,st.st_mtime,now,src['role'],now,jid));self.s.execute("UPDATE job_sources SET discovered_files=discovered_files+1,discovered_bytes=discovered_bytes+?,current_folder=?,current_file=?,last_progress=? WHERE job_id=? AND source_id=?",(size,base,name,now,jid,sid));self.s.execute("UPDATE jobs SET last_progress=? WHERE job_id=?",(now,jid))
      while self._wait(rt):
       try:q.put(Work(sid,pid,p,size),timeout=.25);break
       except queue.Full:self._sync(jid,sid,q)
      self._sync(jid,sid,q)
     except Exception as e:
      now=time.time();self.s.execute("INSERT OR IGNORE INTO placements(placement_id,job_id,revision,source_id,estate,path,filename,extension,scanned_at,lifecycle,availability,error_detail,role,last_verified) SELECT ?,?,revision,?,?,?,?,?,'NONE','ERROR',?,?,? FROM jobs WHERE job_id=?",(pid,jid,sid,src['estate'],p,name,Path(name).suffix.lower(),now,str(e),src['role'],now,jid));self.s.execute("UPDATE job_sources SET errors=errors+1,last_progress=? WHERE job_id=? AND source_id=?",(now,jid,sid));self.s.event('ERROR','source_file_error',jid,sid,str(e),{'path':p})
  except Exception as e:self.s.execute("UPDATE job_sources SET errors=errors+1,state='FAILED',producer_state='FAILED' WHERE job_id=? AND source_id=?",(jid,sid));self.s.event('ERROR','source_failed',jid,sid,str(e))
  finally:
   with rt['sched_lock']:rt['done'].add(sid)
   self.s.execute("UPDATE job_sources SET producer_state='DONE',last_progress=? WHERE job_id=? AND source_id=?",(time.time(),jid,sid));self.s.event('INFO','source_enumeration_complete',jid,sid,'Enumeration complete')
 def _sync(self,jid,sid,q):self.s.execute("UPDATE job_sources SET queue_depth=? WHERE job_id=? AND source_id=?",(q.qsize(),jid,sid))
 def _next(self,rt):
  with rt['sched_lock']:
   ids=list(rt['queues']);n=len(ids)
   for i in range(n):
    idx=(rt['rr']+i)%n;sid=ids[idx];q=rt['queues'][sid]
    try:w=q.get_nowait();rt['rr']=(idx+1)%n;return sid,q,w
    except queue.Empty:pass
  return None,None,None
 def _worker(self,jid,wid):
  rt=self.runtime[jid];self.s.event('INFO','worker_started',jid,None,f'Fingerprint worker {wid} started')
  while not rt['stop'].is_set():
   if not self._wait(rt):break
   sid,q,w=self._next(rt)
   if w is None:
    if len(rt['done'])==len(rt['queues']) and all(x.empty() for x in rt['queues'].values()):break
    time.sleep(.03);continue
   now=time.time();self.s.execute("UPDATE placements SET lifecycle='IN_PROCESS' WHERE placement_id=?",(w.placement_id,));self.s.execute("UPDATE job_sources SET active_workers=active_workers+1,last_progress=? WHERE job_id=? AND source_id=?",(now,jid,sid));self._sync(jid,sid,q)
   try:
    h=hashlib.sha256()
    with open(w.path,'rb',buffering=0) as f:
     while True:
      b=f.read(1048576)
      if not b:break
      h.update(b)
    fp=h.hexdigest();now=time.time();self.s.execute("UPDATE placements SET fingerprint=?,content_id=?,lifecycle='HASHED',last_verified=? WHERE placement_id=?",(fp,fp,now,w.placement_id));self.s.execute("UPDATE job_sources SET hashed_files=hashed_files+1,hashed_bytes=hashed_bytes+?,active_workers=active_workers-1,last_progress=? WHERE job_id=? AND source_id=?",(w.size,now,jid,sid));self.s.execute("UPDATE jobs SET last_progress=? WHERE job_id=?",(now,jid))
   except Exception as e:self.s.execute("UPDATE placements SET availability='ERROR',error_detail=? WHERE placement_id=?",(str(e),w.placement_id));self.s.execute("UPDATE job_sources SET active_workers=active_workers-1,errors=errors+1,last_progress=? WHERE job_id=? AND source_id=?",(time.time(),jid,sid));self.s.event('ERROR','fingerprint_error',jid,sid,str(e),{'path':w.path})
   finally:q.task_done();self._sync(jid,sid,q)
  self.s.event('INFO','worker_stopped',jid,None,f'Fingerprint worker {wid} stopped')
 def _supervise(self,jid):
  rt=self.runtime[jid];last={}
  while True:
   time.sleep(.5);rows=self.s.rows("SELECT * FROM job_sources WHERE job_id=?",(jid,));now=time.time()
   for r in rows:
    q=rt['queues'][r['source_id']];self._sync(jid,r['source_id'],q);age=now-(r['last_progress'] or now);pending=r['source_id'] not in rt['done'] or not q.empty() or r['active_workers']
    if pending and age>=self.stall_seconds and now-last.get(r['source_id'],0)>=self.stall_seconds:last[r['source_id']]=now;self.s.event('WARN','source_stalled',jid,r['source_id'],f'No progress for {age:.1f}s',{'age':age,'queue_depth':q.qsize(),'current_file':r['current_file']})
   if rt['stop'].is_set():
    if all(not t.is_alive() for t in rt['producer_threads']+rt['workers']):self.s.execute("UPDATE jobs SET state='STOPPED',stage='STOPPED',finished=? WHERE job_id=?",(now,jid));break
   elif len(rt['done'])==len(rt['queues']) and all(q.empty() for q in rt['queues'].values()) and all(not t.is_alive() for t in rt['workers']):self._infer(jid);break
  self.runtime.pop(jid,None)
 def _infer(self,jid):
  now=time.time();self.s.execute("UPDATE jobs SET state='INFERENCING',stage='INFER',last_progress=? WHERE job_id=?",(now,jid));self.s.event('INFO','inference_started',jid,None,'Cross-reference and plan inference started');groups=self.s.rows("SELECT fingerprint content_id,COUNT(*) cardinality,MAX(size) content_size,SUM(size) total_bytes FROM placements WHERE job_id=? AND fingerprint IS NOT NULL GROUP BY fingerprint",(jid,))
  for g in groups:
   cid=g['content_id'];card=g['cardinality'];gid=('dup-'+cid[:16]) if card>1 else None
   if card>1:self.s.execute("INSERT INTO duplicate_groups VALUES(?,?,?,?,?,?,?)",(jid,gid,cid,card,g['content_size'],g['total_bytes'],g['total_bytes']-g['content_size']))
   ps=self.s.rows("SELECT p.*,s.failure_domain,s.role source_role FROM placements p JOIN sources s USING(source_id) WHERE p.job_id=? AND p.fingerprint=?",(jid,cid));primary=[p for p in ps if p['source_role']=='canonical']
   if card==1:
    self.s.execute("UPDATE placements SET duplicate_group=NULL,duplicate_cardinality=1,plan='KEEP',rationale='Only known placement of this content.',lifecycle='PLANNED' WHERE placement_id=?",(ps[0]['placement_id'],));continue
   if len(primary)!=1:
    for p in ps:self.s.execute("UPDATE placements SET duplicate_group=?,duplicate_cardinality=?,plan='REVIEW',rationale='Duplicate content has no single explicitly governed canonical source; automatic removal is unsafe.',lifecycle='PLANNED' WHERE placement_id=?",(gid,card,p['placement_id']))
    continue
   canon=primary[0];protected_domain=None
   for p in ps:
    if p['placement_id']==canon['placement_id']:plan='KEEP';why='Placement belongs to the single explicitly governed canonical source.'
    elif p['failure_domain']!=canon['failure_domain'] and protected_domain is None:plan='PROTECT';protected_domain=p['failure_domain'];why='Independent failure-domain copy retained for protection.'
    elif p['failure_domain']==canon['failure_domain'] or p['failure_domain']==protected_domain:plan='REMOVE';why='Byte-identical redundant placement in an already represented failure domain.'
    else:plan='REVIEW';why='Additional failure-domain copy requires explicit protection policy.'
    self.s.execute("UPDATE placements SET duplicate_group=?,duplicate_cardinality=?,plan=?,rationale=?,lifecycle='PLANNED' WHERE placement_id=?",(gid,card,plan,why,p['placement_id']))
  self.s.execute("UPDATE placements SET plan='REVIEW',rationale='Fingerprint unavailable; recommendation unsafe.',lifecycle='PLANNED' WHERE job_id=? AND fingerprint IS NULL",(jid,));self.s.execute("UPDATE placements SET lifecycle='COMPLETED' WHERE job_id=? AND lifecycle='PLANNED'",(jid,));now=time.time();self.s.execute("UPDATE job_sources SET state='COMPLETED',finished=?,queue_depth=0,active_workers=0 WHERE job_id=?",(now,jid));self.s.execute("UPDATE jobs SET state='COMPLETED',stage='COMPLETED',finished=?,last_progress=? WHERE job_id=?",(now,now,jid));self.s.event('INFO','inference_complete',jid,None,'Analysis and recommended plan complete')
 def snapshot(self,jid):
  job=self.s.rows("SELECT * FROM jobs WHERE job_id=?",(jid,));
  if not job:return None
  src=self.s.rows("SELECT js.*,s.label,s.root,s.estate,s.failure_domain,s.role FROM job_sources js JOIN sources s USING(source_id) WHERE job_id=? ORDER BY s.label",(jid,));metrics=self.s.rows("SELECT COUNT(*) discovered_files,COALESCE(SUM(size),0) discovered_bytes,SUM(CASE WHEN fingerprint IS NOT NULL THEN 1 ELSE 0 END) hashed_files,COALESCE(SUM(CASE WHEN fingerprint IS NOT NULL THEN size ELSE 0 END),0) hashed_bytes,SUM(CASE WHEN plan='REVIEW' THEN 1 ELSE 0 END) review_count,COALESCE(SUM(CASE WHEN plan='REMOVE' THEN size ELSE 0 END),0) reclaimable_bytes FROM placements WHERE job_id=?",(jid,))[0];events=self.s.rows("SELECT * FROM events WHERE job_id=? ORDER BY event_id DESC LIMIT 30",(jid,));return {'version':VERSION,'schema':SCHEMA,'job':job[0],'sources':src,'metrics':metrics,'events':events}
