#!/usr/bin/env python3
import hashlib,json,os,queue,sqlite3,threading,time,uuid
from pathlib import Path
VERSION="turn02-release-d";SCHEMA=14;DB_DEFAULT=Path.home()/".sot-turn02"/"sot-v14-release-d.db";PREDECESSOR=Path.home()/".sot-turn02"/"sot-v13-release-b.db"
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
  if self.path==DB_DEFAULT and not self.path.exists() and PREDECESSOR.exists():
   src=sqlite3.connect(PREDECESSOR,timeout=30);dst=sqlite3.connect(self.path,timeout=30)
   try:src.backup(dst);dst.commit()
   finally:dst.close();src.close()
  c=sqlite3.connect(self.path,timeout=30);c.executescript(DDL);cols={r[1] for r in c.execute("PRAGMA table_info(placements)")};
  additions={
   "tags":"TEXT NOT NULL DEFAULT '[]'",
   "notes":"TEXT",
   "quality_rating":"INTEGER",
   "content_rating":"INTEGER",
   "system_classification":"TEXT",
   "placement_state":"TEXT NOT NULL DEFAULT 'ACTIVE'",
   "retired_at":"REAL"
  }
  for name,decl in additions.items():
   if name not in cols:c.execute(f"ALTER TABLE placements ADD COLUMN {name} {decl}")
  job_cols={r[1] for r in c.execute("PRAGMA table_info(jobs)")}
  job_additions={
   "job_type":"TEXT NOT NULL DEFAULT 'analysis'",
   "title":"TEXT",
   "scope_json":"TEXT",
   "queued":"REAL",
   "deleted":"INTEGER NOT NULL DEFAULT 0",
   "deleted_at":"REAL",
   "parent_job_id":"TEXT",
   "delete_requested":"INTEGER NOT NULL DEFAULT 0"
  }
  for name,decl in job_additions.items():
   if name not in job_cols:c.execute(f"ALTER TABLE jobs ADD COLUMN {name} {decl}")
  source_cols={r[1] for r in c.execute("PRAGMA table_info(sources)")}
  source_additions={
   "metadata_signature":"TEXT",
   "metadata_checked":"REAL",
   "stale":"INTEGER NOT NULL DEFAULT 0",
   "deleted_at":"REAL"
  }
  for name,decl in source_additions.items():
   if name not in source_cols:c.execute(f"ALTER TABLE sources ADD COLUMN {name} {decl}")
  c.executescript("""
CREATE TABLE IF NOT EXISTS operations(
 operation_id TEXT PRIMARY KEY,bulk_id TEXT,operation_type TEXT NOT NULL,placement_no INTEGER,
 pre_placement_id TEXT,post_placement_id TEXT,prior_path TEXT,new_path TEXT,requested REAL NOT NULL,
 completed REAL,success INTEGER NOT NULL DEFAULT 0,result TEXT,error_detail TEXT,verification TEXT,
 evidence_revision INTEGER,detail_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_operations_placement ON operations(placement_no,requested);
CREATE TABLE IF NOT EXISTS delete_authorizations(
 token TEXT PRIMARY KEY,created REAL NOT NULL,expires REAL NOT NULL,ids_json TEXT NOT NULL,used INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS ai_tasks(
 task_id TEXT PRIMARY KEY,
 task_type TEXT NOT NULL,
 title TEXT NOT NULL,
 status TEXT NOT NULL,
 created REAL NOT NULL,
 updated REAL NOT NULL,
 scope_json TEXT NOT NULL,
 evidence_revision INTEGER,
 provider TEXT,
 model TEXT,
 summary TEXT,
 proposal_json TEXT,
 result_markdown TEXT,
 error_detail TEXT,
 approval_json TEXT,
 applied_result_json TEXT,
 cancelled INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_ai_tasks_updated ON ai_tasks(updated DESC);
CREATE TABLE IF NOT EXISTS ai_turns(
 turn_id TEXT PRIMARY KEY,
 task_id TEXT NOT NULL,
 ordinal INTEGER NOT NULL,
 role TEXT NOT NULL,
 content TEXT NOT NULL,
 created REAL NOT NULL,
 status TEXT NOT NULL DEFAULT 'ready',
 evidence_revision INTEGER,
 scope_json TEXT,
 evidence_manifest_json TEXT,
 provider TEXT,
 model TEXT,
 error_detail TEXT,
 UNIQUE(task_id,ordinal)
);
CREATE INDEX IF NOT EXISTS idx_ai_turns_task ON ai_turns(task_id,ordinal);
CREATE TABLE IF NOT EXISTS job_scope_sources(
 job_id TEXT NOT NULL,
 source_id TEXT NOT NULL,
 label TEXT NOT NULL,
 root TEXT NOT NULL,
 estate TEXT NOT NULL,
 failure_domain TEXT NOT NULL,
 role TEXT NOT NULL,
 PRIMARY KEY(job_id,source_id)
);
CREATE INDEX IF NOT EXISTS idx_job_scope_sources_job ON job_scope_sources(job_id);
CREATE TABLE IF NOT EXISTS ai_compare_jobs(
 compare_job_id TEXT PRIMARY KEY,
 task_id TEXT NOT NULL,
 status TEXT NOT NULL,
 scope_json TEXT NOT NULL,
 created REAL NOT NULL,
 started REAL,
 updated REAL NOT NULL,
 ended REAL,
 phase TEXT NOT NULL DEFAULT 'QUEUED',
 current_path TEXT,
 current_file TEXT,
 folders_scanned INTEGER NOT NULL DEFAULT 0,
 files_scanned INTEGER NOT NULL DEFAULT 0,
 media_files INTEGER NOT NULL DEFAULT 0,
 probed_files INTEGER NOT NULL DEFAULT 0,
 validated_files INTEGER NOT NULL DEFAULT 0,
 groups_compared INTEGER NOT NULL DEFAULT 0,
 media_duration_seconds REAL NOT NULL DEFAULT 0,
 processing_seconds REAL NOT NULL DEFAULT 0,
 verified INTEGER NOT NULL DEFAULT 0,
 review INTEGER NOT NULL DEFAULT 0,
 suspect INTEGER NOT NULL DEFAULT 0,
 legacy_only INTEGER NOT NULL DEFAULT 0,
 converted_only INTEGER NOT NULL DEFAULT 0,
 ambiguous INTEGER NOT NULL DEFAULT 0,
 last_progress REAL,
 error_detail TEXT,
 result_json TEXT,
 manifest_json TEXT,
 cancel_requested INTEGER NOT NULL DEFAULT 0,
 deleted INTEGER NOT NULL DEFAULT 0,
 parent_job_id TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_compare_task ON ai_compare_jobs(task_id,created DESC);
CREATE TABLE IF NOT EXISTS ai_compare_events(
 event_id INTEGER PRIMARY KEY AUTOINCREMENT,
 compare_job_id TEXT NOT NULL,
 ts REAL NOT NULL,
 severity TEXT NOT NULL,
 phase TEXT,
 message TEXT NOT NULL,
 detail_json TEXT
);
CREATE INDEX IF NOT EXISTS idx_ai_compare_events_job ON ai_compare_events(compare_job_id,event_id);
""")
  # One current placement per physical source/path. Collapse historical job-scoped observations in place.
  rows=c.execute("SELECT placement_id,placement_no,source_id,path,revision,fingerprint,lifecycle FROM placements ORDER BY source_id,path,(fingerprint IS NOT NULL) DESC,revision DESC,placement_no DESC").fetchall()
  seen=set()
  for old_id,pno,sid,path,rev,fp,life in rows:
   key=(sid,path)
   if key in seen:c.execute("DELETE FROM placements WHERE placement_id=?",(old_id,));continue
   seen.add(key);stable=hashlib.sha256((sid+"\\0"+path).encode()).hexdigest()
   if stable!=old_id:
    c.execute("DELETE FROM placements WHERE placement_id=? AND placement_id<>?",(stable,old_id))
    c.execute("UPDATE placements SET placement_id=? WHERE placement_id=?",(stable,old_id))
  c.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_place_source_path ON placements(source_id,path)")
  # Release D legacy-job migration: recover immutable restart scope metadata from durable historical job/source records.
  c.execute("""
INSERT OR IGNORE INTO job_scope_sources(job_id,source_id,label,root,estate,failure_domain,role)
SELECT js.job_id,s.source_id,s.label,s.root,s.estate,s.failure_domain,s.role
FROM job_sources js
JOIN sources s ON s.source_id=js.source_id
WHERE NOT EXISTS (SELECT 1 FROM job_scope_sources x WHERE x.job_id=js.job_id AND x.source_id=js.source_id)
""")
  c.execute("INSERT OR REPLACE INTO meta(k,v) VALUES('schema',?)",(str(SCHEMA),))
  c.execute("INSERT OR IGNORE INTO meta(k,v) VALUES('catalog_revision',?)",(str(int(time.time()*1000)),))
  c.commit();c.close()
  self.q=queue.Queue(maxsize=8192);self.stop=threading.Event();self.writer_error=None;self.last_writer_error=None
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
   outcomes=[]
   for item in batch:
    kind,sql,args,ev,box=item
    err=None
    try:
     c.execute("SAVEPOINT sot_item")
     if kind=="sql":c.execute(sql,args)
     elif kind=="many":c.executemany(sql,args)
     elif kind=="tx":
      for stmt,params in sql:c.execute(stmt,params)
     c.execute("RELEASE sot_item")
    except Exception as e:
     err=e
     try:c.execute("ROLLBACK TO sot_item");c.execute("RELEASE sot_item")
     except Exception:pass
     self.last_writer_error={"at":time.time(),"error":repr(e),"kind":kind}
    outcomes.append((ev,box,err))
   try:c.commit()
   except Exception as e:
    c.rollback();self.last_writer_error={"at":time.time(),"error":repr(e),"kind":"commit"}
    outcomes=[(ev,box,e) for ev,box,_ in outcomes]
   for ev,box,err in outcomes:
    if box is not None:box.append(err if err is not None else True)
    if ev:ev.set()
   for _ in batch:self.q.task_done()
  c.close()
 def submit(self,sql,args=(),wait=False):
  ev=threading.Event() if wait else None;box=[] if wait else None;self.q.put(("sql",sql,args,ev,box))
  if wait:
   if not ev.wait(10):raise TimeoutError("DB writer acknowledgement timeout")
   if isinstance(box[0],Exception):raise box[0]
 def many(self,sql,args,wait=False):
  ev=threading.Event() if wait else None;box=[] if wait else None;self.q.put(("many",sql,args,ev,box))
  if wait:
   if not ev.wait(10):raise TimeoutError("DB writer acknowledgement timeout")
   if isinstance(box[0],Exception):raise box[0]
 def tx(self,statements,wait=True):
  ev=threading.Event() if wait else None;box=[] if wait else None;self.q.put(("tx",list(statements),(),ev,box))
  if wait:
   if not ev.wait(30):raise TimeoutError("DB transaction acknowledgement timeout")
   if isinstance(box[0],Exception):raise box[0]
 def catalog_revision(self):
  r=self.rows("SELECT v FROM meta WHERE k='catalog_revision'");return int(r[0]["v"]) if r else 0
 def bump_catalog_revision(self):
  cur=self.catalog_revision();rev=max(cur+1,int(time.time()*1000))
  self.submit("INSERT OR REPLACE INTO meta(k,v) VALUES('catalog_revision',?)",(str(rev),),True);return rev
 def drain(self,timeout=30):
  end=time.monotonic()+timeout
  while self.q.unfinished_tasks and time.monotonic()<end:
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
 def __init__(self,store,workers=8,queue_capacity=128,stall_seconds=30,max_active_jobs=4):
  self.s=store;self.workers=max(1,int(workers));self.capacity=queue_capacity;self.stall=stall_seconds;self.max_active_jobs=max(1,int(max_active_jobs));self.runs={};self.lock=threading.RLock();self.scheduler_paused=False;self.last_scheduler_error=None
  now=time.time();self.s.submit("UPDATE jobs SET state='INTERRUPTED',ended=?,control='INTERRUPTED' WHERE state IN ('RUNNING','PAUSED','STOPPING')",(now,),True);self.s.submit("UPDATE job_sources SET state='INTERRUPTED',active_workers=0,queue_depth=0 WHERE state IN ('RUNNING','PAUSED','STOPPING')",(),True)
  self.seq_lock=threading.Lock();self.next_no=(self.s.rows("SELECT COALESCE(MAX(placement_no),0)+1 n FROM placements")[0]["n"])
  self.recompute_classifications()
  self.scheduler_stop=threading.Event();self.scheduler_thread=threading.Thread(target=self._scheduler,name="sot-job-scheduler",daemon=True);self.scheduler_thread.start()
 def _snapshot_sources(self,source_ids=None):
  rows=self.s.rows("SELECT * FROM sources WHERE enabled=1 ORDER BY source_id")
  if source_ids:
   wanted=set(source_ids);rows=[r for r in rows if r["source_id"] in wanted]
   missing=wanted-{r["source_id"] for r in rows}
   if missing:raise RuntimeError("Unknown or disabled source(s): "+", ".join(sorted(missing)))
  if not rows:raise RuntimeError("no enabled sources")
  return rows
 def _live_source_coverage(self):
  rows=self.s.rows("""SELECT j.job_id,j.state,j.created,sc.source_id
                     FROM jobs j JOIN job_scope_sources sc ON sc.job_id=j.job_id
                     WHERE j.deleted=0 AND j.job_type='analysis' AND j.state IN ('QUEUED','RUNNING','PAUSED','STOPPING')
                     ORDER BY j.created,j.job_id""")
  by_source={}
  for r in rows:by_source.setdefault(r["source_id"],[]).append(r["job_id"])
  return by_source
 def _dedupe_rows(self,rows):
  uniq=[];seen=set()
  for r in rows:
   sid=r["source_id"]
   if sid in seen:continue
   seen.add(sid);uniq.append(r)
  coverage=self._live_source_coverage();uncovered=[];covered={}
  for r in uniq:
   ids=coverage.get(r["source_id"],[])
   if ids:covered[r["source_id"]]=ids
   else:uncovered.append(r)
  covering=sorted({jid for ids in covered.values() for jid in ids})
  return uniq,uncovered,covered,covering
 def _enqueue_snapshots(self,rows,parent_job_id=None,title=None,detail=None):
  rev=int(self.s.rows("SELECT COALESCE(MAX(revision),0)+1 n FROM jobs")[0]["n"]);jid=uuid.uuid4().hex;now=time.time()
  scope=[{"source_id":x["source_id"],"label":x["label"],"root":x["root"],"estate":x["estate"],"failure_domain":x["failure_domain"],"role":x["role"]} for x in rows]
  stmts=[("INSERT INTO jobs(job_id,revision,state,created,last_progress,control,job_type,title,scope_json,queued,deleted,parent_job_id,delete_requested) VALUES(?,?,'QUEUED',?,?, 'RUN','analysis',?,?,?,?,?,0)",(jid,rev,now,now,title or ("Analyze "+str(len(rows))+" source"+("" if len(rows)==1 else "s")),json.dumps(scope),now,0,parent_job_id))]
  for x in rows:stmts.append(("INSERT INTO job_scope_sources(job_id,source_id,label,root,estate,failure_domain,role) VALUES(?,?,?,?,?,?,?)",(jid,x["source_id"],x["label"],x["root"],x["estate"],x["failure_domain"],x["role"])))
  self.s.tx(stmts,True);payload={"source_count":len(rows),"roots":[x["root"] for x in rows]};payload.update(detail or {});self.event("job_queued","Analysis job queued",jid,None,"INFO",payload);self.s.drain(10)
  return jid
 def enqueue_info(self,source_ids=None,parent_job_id=None,title=None):
  requested=self._snapshot_sources(source_ids);all_rows,rows,covered,covering=self._dedupe_rows(requested)
  info={"requested_source_count":len(all_rows),"queued_source_count":len(rows),"suppressed_source_count":len(all_rows)-len(rows),"covering_job_ids":covering,"covered_sources":covered,"created":False,"deduped":bool(covered)}
  if not rows:
   info["job_id"]=covering[0] if covering else None
   return info
  detail={"suppressed_source_count":info["suppressed_source_count"],"covering_job_ids":covering}
  jid=self._enqueue_snapshots(rows,parent_job_id,title,detail);info.update(job_id=jid,created=True);return info
 def enqueue(self,source_ids=None,parent_job_id=None,title=None):
  return self.enqueue_info(source_ids,parent_job_id,title).get("job_id")
 def restart_info(self,jid):
  meta=self.s.rows("SELECT deleted FROM jobs WHERE job_id=?",(jid,))
  if not meta:raise RuntimeError("job not found")
  if meta[0]["deleted"]:raise RuntimeError("Restore the soft-deleted job before restarting it")
  rows=self.s.rows("SELECT source_id,label,root,estate,failure_domain,role FROM job_scope_sources WHERE job_id=? ORDER BY source_id",(jid,))
  if not rows:raise RuntimeError("job has no persisted source snapshot")
  all_rows,uncovered,covered,covering=self._dedupe_rows(rows)
  info={"requested_source_count":len(all_rows),"queued_source_count":len(uncovered),"suppressed_source_count":len(all_rows)-len(uncovered),"covering_job_ids":covering,"covered_sources":covered,"created":False,"deduped":bool(covered),"parent_job_id":jid}
  if not uncovered:
   info["job_id"]=covering[0] if covering else None
   return info
  njid=self._enqueue_snapshots(uncovered,jid,"Restart of "+jid[:8],{"suppressed_source_count":info["suppressed_source_count"],"covering_job_ids":covering});info.update(job_id=njid,created=True);return info
 def restart(self,jid):
  return self.restart_info(jid).get("job_id")
 def scheduler_status(self):
  queued=self.s.rows("SELECT COUNT(*) n FROM jobs WHERE deleted=0 AND job_type='analysis' AND state='QUEUED'")[0]["n"]
  paused=self.s.rows("SELECT COUNT(*) n FROM jobs WHERE deleted=0 AND job_type='analysis' AND state='PAUSED'")[0]["n"]
  with self.lock:active=len(self.runs)
  return {"paused":bool(self.scheduler_paused),"active_jobs":active,"queued_jobs":int(queued or 0),"paused_jobs":int(paused or 0),"max_active_jobs":self.max_active_jobs,"workers_per_job":self.workers,"last_error":self.last_scheduler_error}
 def pause_all(self):
  self.scheduler_paused=True;now=time.time()
  with self.lock:runs=list(self.runs.items())
  for jid,rt in runs:
   rt["pause"].set();self.s.submit("UPDATE jobs SET state='PAUSED',control='PAUSE',last_progress=? WHERE job_id=? AND state='RUNNING'",(now,jid));self.s.submit("UPDATE job_sources SET state='PAUSED',last_progress=? WHERE job_id=? AND state='RUNNING'",(now,jid));self.event("job_paused","Paused by Pause All",jid)
  self.s.drain(10);return self.scheduler_status()
 def resume_all(self):
  self.scheduler_paused=False;now=time.time()
  with self.lock:runs=list(self.runs.items())
  for jid,rt in runs:
   rt["pause"].clear();self.s.submit("UPDATE jobs SET state='RUNNING',control='RUN',last_progress=? WHERE job_id=? AND state='PAUSED'",(now,jid));self.s.submit("UPDATE job_sources SET state='RUNNING',last_progress=? WHERE job_id=? AND state='PAUSED'",(now,jid));self.event("job_resumed","Resumed by Start All",jid)
  self.s.drain(10);return self.scheduler_status()
 def _wait_if_paused(self,rt):
  while rt["pause"].is_set() and not rt["stop"].is_set():time.sleep(.05)
 def _active_source_ids(self):
  ids=set()
  for jid in list(self.runs):
   for r in self.s.rows("SELECT source_id FROM job_scope_sources WHERE job_id=?",(jid,)):ids.add(r["source_id"])
  return ids
 def _scheduler(self):
  while not self.scheduler_stop.is_set():
   try:
    if self.scheduler_paused:
     self.scheduler_stop.wait(.25);continue
    with self.lock:active=len(self.runs)
    if active<self.max_active_jobs:
     busy=self._active_source_ids()
     queued=self.s.rows("SELECT job_id FROM jobs WHERE state='QUEUED' AND deleted=0 AND job_type='analysis' ORDER BY queued,created")
     for row in queued:
      if active>=self.max_active_jobs:break
      ids={x["source_id"] for x in self.s.rows("SELECT source_id FROM job_scope_sources WHERE job_id=?",(row["job_id"],))}
      if ids & busy:continue
      try:self._launch(row["job_id"]);active+=1;busy.update(ids)
      except Exception as e:
       with self.lock:self.runs.pop(row["job_id"],None)
       now=time.time();self.s.submit("UPDATE jobs SET state='FAILED',ended=?,last_progress=? WHERE job_id=?",(now,now,row["job_id"]),True);self.event("job_launch_failed",str(e),row["job_id"],None,"ERROR")
   except Exception as e:self.last_scheduler_error=str(e)
   self.scheduler_stop.wait(.25)
 def _launch(self,jid):
  rows=self.s.rows("SELECT * FROM job_scope_sources WHERE job_id=? ORDER BY source_id",(jid,))
  if not rows:raise RuntimeError("job scope snapshot missing")
  now=time.time();self.s.submit("UPDATE jobs SET state='RUNNING',started=COALESCE(started,?),last_progress=?,control='RUN' WHERE job_id=? AND state='QUEUED'",(now,now,jid),True)
  job=self.s.rows("SELECT revision,state FROM jobs WHERE job_id=?",(jid,))[0]
  if job["state"]!="RUNNING":return
  rev=job["revision"];src=[dict(x) for x in rows];owners={x["source_id"]:x for x in src}
  rt={"queues":{x["source_id"]:queue.Queue(self.capacity) for x in src},"done":set(),"stop":threading.Event(),"pause":threading.Event(),"rr":0,"sched":threading.Lock(),"src":{x["source_id"]:x for x in src},"owners":owners,"activity":{},"seen":{x["source_id"]:set() for x in src}}
  with self.lock:self.runs[jid]=rt
  for x in src:self.s.submit("INSERT OR REPLACE INTO job_sources(job_id,source_id,state,producer_state,queue_capacity,last_progress) VALUES(?,?,'RUNNING','RUNNING',?,?)",(jid,x["source_id"],self.capacity,now))
  self.event("job_started","Analysis job started",jid,None,"INFO",{"source_count":len(src)})
  for x in src:threading.Thread(target=self._produce,args=(jid,rev,x,rt),daemon=True,name="sot-producer-"+jid[:6]+"-"+x["source_id"][:4]).start()
  for n in range(self.workers):threading.Thread(target=self._worker,args=(jid,rev,rt,n),daemon=True,name="sot-hash-"+jid[:6]+"-"+str(n)).start()
  threading.Thread(target=self._supervise,args=(jid,rev,rt),daemon=True,name="sot-supervise-"+jid[:8]).start()
 def alloc_no(self):
  with self.seq_lock:
   n=self.next_no;self.next_no+=1;return n
 def recompute_classifications(self):
  rows=self.s.rows("SELECT placement_id,placement_no,fingerprint FROM placements WHERE placement_state='ACTIVE' AND availability='AVAILABLE' AND fingerprint IS NOT NULL ORDER BY fingerprint,placement_no")
  groups={}
  for r in rows:groups.setdefault(r["fingerprint"],[]).append(r)
  stmts=[("UPDATE placements SET system_classification=NULL,duplicate_group=NULL,duplicate_cardinality=NULL WHERE placement_state<>'ACTIVE' OR availability<>'AVAILABLE' OR fingerprint IS NULL",()),
         ("UPDATE placements SET system_classification=NULL,duplicate_group=NULL,duplicate_cardinality=NULL WHERE placement_state='ACTIVE' AND availability='AVAILABLE' AND fingerprint IS NOT NULL",())]
  for fp,items in groups.items():
   if len(items)==1:
    stmts.append(("UPDATE placements SET system_classification='UNIQUE',duplicate_cardinality=1 WHERE placement_id=?",(items[0]["placement_id"],)))
   else:
    group=fp[:16];n=len(items)
    for i,r in enumerate(items):
     stmts.append(("UPDATE placements SET system_classification=?,duplicate_group=?,duplicate_cardinality=? WHERE placement_id=?",("KEEP" if i==0 else "EXCESS",group,n,r["placement_id"])))
  self.s.tx(stmts,True)
  return {"unique":sum(1 for x in groups.values() if len(x)==1),"duplicate_groups":sum(1 for x in groups.values() if len(x)>1)}
 def event(self,typ,msg,jid=None,sid=None,severity="INFO",detail=None):
  self.s.submit("INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail_json) VALUES(?,?,?,?,?,?,?)",(time.time(),severity,typ,jid,sid,msg,json.dumps(detail or {})))
 def _source_rows(self):
  return self.s.rows("SELECT * FROM sources WHERE enabled=1 ORDER BY source_id")
 def metadata_signature(self,source_id):
  srcs=self._source_rows();byid={x["source_id"]:x for x in srcs};src=byid.get(source_id)
  if not src:raise RuntimeError("source not found")
  root=Path(src["root"]).resolve()
  h=hashlib.sha256();count=0;total=0;newest=0.0
  for cur,dirs,files in os.walk(root):
   dirs[:]=sorted(d for d in dirs if not Path(cur,d).is_symlink())
   for name in sorted(files):
    p=Path(cur,name)
    try:
     if not p.is_file() or p.is_symlink():continue
     ps=str(p.resolve())
     if self._owner_source(ps,byid)!=source_id:continue
     st=p.stat();rel=str(p.resolve().relative_to(root))
     line=(rel+"\0"+str(int(st.st_size))+"\0"+repr(float(st.st_mtime))+"\n").encode()
     h.update(line);count+=1;total+=int(st.st_size);newest=max(newest,float(st.st_mtime))
    except OSError:continue
  return {"digest":h.hexdigest(),"files":count,"bytes":total,"newest_mtime":newest}
 def placement_signature(self,source_id):
  src=self.s.rows("SELECT root FROM sources WHERE source_id=?",(source_id,))
  if not src:raise RuntimeError("source not found")
  root=Path(src[0]["root"]).resolve();h=hashlib.sha256();count=0;total=0;newest=0.0
  rows=self.s.rows("SELECT path,size,modified FROM placements WHERE source_id=? AND placement_state='ACTIVE' AND availability='AVAILABLE' ORDER BY path",(source_id,))
  for r in rows:
   try:rel=str(Path(r["path"]).resolve().relative_to(root))
   except Exception:rel=str(r["path"])
   size=int(r["size"] or 0);mtime=float(r["modified"] or 0.0)
   h.update((rel+"\0"+str(size)+"\0"+repr(mtime)+"\n").encode());count+=1;total+=size;newest=max(newest,mtime)
  return {"digest":h.hexdigest(),"files":count,"bytes":total,"newest_mtime":newest}
 def check_source_metadata(self,source_id):
  src=self.s.rows("SELECT * FROM sources WHERE source_id=? AND enabled=1",(source_id,))
  if not src:return {"source_id":source_id,"checked":False,"reason":"not enabled"}
  src=src[0]
  live=self.metadata_signature(source_id)
  baseline=json.loads(src["metadata_signature"]) if src["metadata_signature"] else self.placement_signature(source_id)
  changed=live!=baseline
  now=time.time()
  if not src["metadata_signature"]:
   self.s.submit("UPDATE sources SET metadata_signature=?,metadata_checked=?,stale=? WHERE source_id=?",(json.dumps(baseline,sort_keys=True),now,1 if changed else 0,source_id),True)
  else:self.s.submit("UPDATE sources SET metadata_checked=?,stale=? WHERE source_id=?",(now,1 if changed else 0,source_id),True)
  if changed:self.event("source_stale","Source metadata changed; analysis pending",None,source_id,"INFO",{"baseline":baseline,"live":live})
  self.s.drain(10)
  return {"source_id":source_id,"checked":True,"changed":changed,"baseline":baseline,"live":live}
 def refresh_source_baseline(self,source_id):
  sig=self.placement_signature(source_id);now=time.time()
  self.s.submit("UPDATE sources SET metadata_signature=?,metadata_checked=?,stale=0 WHERE source_id=?",(json.dumps(sig,sort_keys=True),now,source_id),True)
  return sig
 def add_source(self,label,root,failure_domain,role="primary",estate=None):
  root=str(Path(root).resolve());estate=estate or label
  if self.s.rows("SELECT 1 FROM sources WHERE root=? LIMIT 1",(root,)):raise RuntimeError("Estate root already registered")
  if self.s.rows("SELECT 1 FROM sources WHERE estate=? LIMIT 1",(estate,)):estate=str(estate)+" · "+root
  sid=hashlib.sha256(root.encode()).hexdigest()[:16]
  self.s.submit("INSERT INTO sources(source_id,label,root,estate,failure_domain,role,enabled,stale) VALUES(?,?,?,?,?,?,1,1)",(sid,label,root,estate,failure_domain,role),True);return sid
 def _owner_source(self,path,src):
  p=str(Path(path).resolve());matches=[]
  for x in src.values() if isinstance(src,dict) else src:
   r=str(Path(x["root"]).resolve())
   if p==r or p.startswith(r.rstrip("/")+"/"):matches.append((len(r),x["source_id"]))
  return max(matches)[1] if matches else None
 def _normalize_source_ownership(self,src):
  byid={x["source_id"]:x for x in src};rows=self.s.rows("SELECT placement_id,placement_no,source_id,path FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
  for r in rows:
   owner=self._owner_source(r["path"],byid)
   if not owner or owner==r["source_id"]:continue
   target=byid[owner];newid=hashlib.sha256((owner+"\0"+r["path"]).encode()).hexdigest()
   existing=self.s.rows("SELECT placement_id FROM placements WHERE placement_id=?",(newid,))
   tx=[]
   if existing:tx.append(("DELETE FROM placements WHERE placement_id=?", (newid,)))
   tx.append(("UPDATE placements SET placement_id=?,source_id=?,estate=? WHERE placement_id=?",(newid,owner,target["estate"],r["placement_id"])))
   self.s.tx(tx,True)
 def start(self,source_ids=None):
  return self.enqueue(source_ids)
 def created_time(self,p,st):
  v=getattr(st,"st_birthtime",None)
  return v if v is not None else None
 def _produce(self,jid,rev,src,rt):
  sid=src["source_id"];q=rt["queues"][sid];self.event("source_started","Enumeration started",jid,sid)
  try:
   for root,dirs,files in os.walk(src["root"]):
    self._wait_if_paused(rt)
    if rt["stop"].is_set():break
    dirs[:]=[d for d in dirs if not Path(root,d).is_symlink()]
    for name in files:
     self._wait_if_paused(rt)
     if rt["stop"].is_set():break
     p=str(Path(root,name))
     if self._owner_source(p,rt["owners"])!=sid:continue
     rt["seen"][sid].add(p)
     try:
      st=os.stat(p,follow_symlinks=False)
      if not os.path.isfile(p):continue
      pid=hashlib.sha256((sid+"\0"+p).encode()).hexdigest();now=time.time();created=self.created_time(p,st)
      old=self.s.rows("SELECT placement_no,size,modified,fingerprint,content_id FROM placements WHERE placement_id=?",(pid,))
      unchanged=bool(old and old[0]["fingerprint"] and old[0]["size"]==st.st_size and old[0]["modified"]==st.st_mtime)
      if old:
       self.s.submit("UPDATE placements SET job_id=?,revision=?,estate=?,filename=?,extension=?,size=?,created=COALESCE(?,created),modified=?,scanned_at=?,lifecycle=?,plan=NULL,rationale=NULL,availability='AVAILABLE',error_detail=NULL,role=?,last_verified=?,placement_state='ACTIVE',retired_at=NULL WHERE placement_id=?",(jid,rev,src["estate"],name,Path(name).suffix.lower(),st.st_size,created,st.st_mtime,now,'HASHED' if unchanged else 'NONE',src["role"],now,pid))
       if not unchanged:self.s.submit("UPDATE placements SET fingerprint=NULL,content_id=NULL,duplicate_group=NULL,duplicate_cardinality=NULL WHERE placement_id=?",(pid,))
      else:
       pno=self.alloc_no();self.s.submit("INSERT INTO placements(placement_id,placement_no,job_id,revision,source_id,estate,path,filename,extension,size,created,modified,scanned_at,lifecycle,role,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?, 'NONE',?,?)",(pid,pno,jid,rev,sid,src["estate"],p,name,Path(name).suffix.lower(),st.st_size,created,st.st_mtime,now,src["role"],now))
      self.s.submit("UPDATE job_sources SET discovered_files=discovered_files+1,discovered_bytes=discovered_bytes+?,hashed_files=hashed_files+?,hashed_bytes=hashed_bytes+?,current_folder=?,current_file=?,last_progress=? WHERE job_id=? AND source_id=?",(st.st_size,1 if unchanged else 0,st.st_size if unchanged else 0,root,name,now,jid,sid))
      if not unchanged:
       while not rt["stop"].is_set():
        self._wait_if_paused(rt)
        if rt["stop"].is_set():break
        try:q.put((pid,p,st.st_size),timeout=.1);break
        except queue.Full:continue
      self.s.submit("UPDATE jobs SET last_progress=? WHERE job_id=?",(now,jid))
     except Exception as e:
      now=time.time();pid=hashlib.sha256((sid+"\0"+p).encode()).hexdigest();old=self.s.rows("SELECT placement_no FROM placements WHERE placement_id=?",(pid,))
      if old:self.s.submit("UPDATE placements SET job_id=?,revision=?,estate=?,filename=?,extension=?,scanned_at=?,lifecycle='NONE',availability='ERROR',error_detail=?,role=?,last_verified=? WHERE placement_id=?",(jid,rev,src["estate"],name,Path(name).suffix.lower(),now,str(e),src["role"],now,pid))
      else:
       pno=self.alloc_no();self.s.submit("INSERT INTO placements(placement_id,placement_no,job_id,revision,source_id,estate,path,filename,extension,scanned_at,lifecycle,availability,error_detail,role,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,'NONE','ERROR',?,?,?)",(pid,pno,jid,rev,sid,src["estate"],p,name,Path(name).suffix.lower(),now,str(e),src["role"],now))
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
   self._wait_if_paused(rt)
   if rt["stop"].is_set():break
   sid,q,w=self._next(rt)
   if w is None:
    with rt["sched"]:finished=len(rt["done"])==len(rt["queues"])
    if finished and all(x.empty() for x in rt["queues"].values()):break
    time.sleep(.01);continue
   pid,p,size=w;now=time.time();rt["activity"][n]={"worker":n,"placement_id":pid,"path":p,"filename":Path(p).name,"size":size,"bytes":0,"source_id":sid,"started":now,"updated":now}
   try:
    self.s.submit("UPDATE placements SET lifecycle='IN_PROCESS' WHERE placement_id=?",(pid,))
    self.s.submit("UPDATE job_sources SET active_workers=active_workers+1,current_file=?,last_progress=? WHERE job_id=? AND source_id=?",(Path(p).name,now,jid,sid))
    h=hashlib.sha256();heartbeat=now
    with open(p,"rb") as f:
     while True:
      self._wait_if_paused(rt)
      if rt["stop"].is_set():break
      b=f.read(1024*1024)
      if not b:break
      h.update(b);tick=time.time();a=rt["activity"].get(n);a and a.update(bytes=min(size,a["bytes"]+len(b)),updated=tick,mbps=(min(size,a["bytes"]+len(b))/1048576/max(.001,tick-a["started"])))
      if tick-heartbeat>=1.0:
       heartbeat=tick;self.s.submit("UPDATE jobs SET last_progress=? WHERE job_id=?",(tick,jid));self.s.submit("UPDATE job_sources SET last_progress=?,current_file=? WHERE job_id=? AND source_id=?",(tick,Path(p).name,jid,sid))
    if rt["stop"].is_set():raise RuntimeError("job stopped during fingerprint")
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
   now=time.time()
   for sid in rt["queues"]:
    seen=rt["seen"].get(sid,set())
    active=self.s.rows("SELECT placement_id,path FROM placements WHERE source_id=? AND placement_state='ACTIVE'",(sid,))
    missing=[r["placement_id"] for r in active if r["path"] not in seen]
    if missing:
     self.s.many("UPDATE placements SET placement_state='RETIRED',retired_at=?,availability='UNAVAILABLE',plan=NULL,system_classification=NULL,duplicate_group=NULL,duplicate_cardinality=NULL WHERE placement_id=?",[(now,pid) for pid in missing],True)
     self.event("source_missing_retired",f"{len(missing)} missing placements retired",jid,sid,"INFO",{"count":len(missing)})
   self._infer(jid);self.s.drain(60)
   for sid in rt["queues"]:self.refresh_source_baseline(sid)
   self.s.drain(30);state="COMPLETED"
  now=time.time();self.s.submit("UPDATE jobs SET state=?,ended=?,last_progress=? WHERE job_id=?",(state,now,now,jid));self.s.submit("UPDATE job_sources SET state=?,queue_depth=0,active_workers=0 WHERE job_id=?",(state,jid));self.event("job_"+state.lower(),state.title(),jid);self.s.drain(30)
  delete_req=self.s.rows("SELECT delete_requested FROM jobs WHERE job_id=?",(jid,))
  if delete_req and delete_req[0]["delete_requested"]:self.s.submit("UPDATE jobs SET deleted=1,deleted_at=COALESCE(deleted_at,?) WHERE job_id=?",(time.time(),jid),True)
  with self.lock:self.runs.pop(jid,None)
 def _infer(self,jid):
  groups=self.s.rows("SELECT fingerprint,COUNT(*) n,MAX(size) size FROM placements WHERE job_id=? AND fingerprint IS NOT NULL GROUP BY fingerprint",(jid,))
  for g in groups:
   fp,n,size=g["fingerprint"],g["n"],g["size"]
   self.s.submit("UPDATE placements SET plan=CASE WHEN availability='ERROR' THEN 'REVIEW' ELSE 'IN_PLAY' END,rationale=CASE WHEN ?=1 THEN 'Unique content awaiting TARGET landing' ELSE 'Content has multiple source placements; remains in play until TARGET is landed and verified' END,lifecycle='COMPLETED' WHERE job_id=? AND fingerprint=?",(n,jid,fp))
  self.s.drain(60);self.recompute_classifications();self.s.bump_catalog_revision()
 def control(self,jid,action):
  row=self.s.rows("SELECT * FROM jobs WHERE job_id=?",(jid,))
  if not row:raise RuntimeError("job not found")
  j=row[0];action=str(action or "").lower()
  if action in ("abort-delete","abort_delete","soft-delete","soft_delete","delete"):
   if j["deleted"]:return
   now=time.time()
   if j["state"]=="QUEUED":
    self.s.submit("UPDATE jobs SET state='ABORTED',ended=?,last_progress=?,control='ABORT',deleted=1,deleted_at=?,delete_requested=1 WHERE job_id=?",(now,now,now,jid),True);self.event("job_soft_deleted","Queued job aborted and soft deleted",jid);return
   if j["state"] in ("RUNNING","PAUSED","STOPPING"):
    rt=self.runs.get(jid)
    if rt:rt["stop"].set();rt["pause"].clear()
    self.s.submit("UPDATE jobs SET state='STOPPING',control='ABORT',deleted=1,deleted_at=?,delete_requested=1,last_progress=? WHERE job_id=?",(now,now,jid),True);self.event("job_soft_delete_requested","Abort + soft delete requested",jid);return
   self.s.submit("UPDATE jobs SET deleted=1,deleted_at=?,delete_requested=0 WHERE job_id=?",(now,jid),True);self.event("job_soft_deleted","Job soft deleted",jid);return
  if action=="restore":
   if not j["deleted"]:return
   if jid in self.runs or j["state"] in ("RUNNING","PAUSED","STOPPING"):raise RuntimeError("Job is still stopping; restore after it reaches a terminal state")
   self.s.submit("UPDATE jobs SET deleted=0,deleted_at=NULL,delete_requested=0 WHERE job_id=?",(jid,),True);self.event("job_restored","Soft-deleted job restored",jid);return
  if action in ("purge","permanent-delete","permanent_delete"):
   if not j["deleted"]:raise RuntimeError("Soft delete the job before permanent deletion")
   if jid in self.runs or j["state"] in ("RUNNING","PAUSED","STOPPING"):raise RuntimeError("Job is still active; permanent deletion is blocked")
   self.s.tx([
    ("DELETE FROM events WHERE job_id=?",(jid,)),
    ("DELETE FROM job_sources WHERE job_id=?",(jid,)),
    ("DELETE FROM job_scope_sources WHERE job_id=?",(jid,)),
    ("DELETE FROM jobs WHERE job_id=?",(jid,))
   ],True);return
  if j["deleted"]:raise RuntimeError("Restore the soft-deleted job before changing it")
  if action=="stop":
   rt=self.runs.get(jid)
   if not rt:raise RuntimeError("job not active in this process")
   rt["stop"].set();rt["pause"].clear();self.s.submit("UPDATE jobs SET state='STOPPING',control='STOP',last_progress=? WHERE job_id=?",(time.time(),jid),True);self.event("job_stop","Stop requested",jid);return
  raise RuntimeError("bad action")
 def source_control(self,source_id,action):
  rows=self.s.rows("SELECT * FROM sources WHERE source_id=?",(source_id,))
  if not rows:raise RuntimeError("source not found")
  src=rows[0];action=str(action or "").lower();now=time.time()
  if action in ("soft-delete","soft_delete","delete"):
   if not src["enabled"]:return
   self.s.submit("UPDATE sources SET enabled=0,deleted_at=?,stale=1 WHERE source_id=?",(now,source_id),True);self.event("source_soft_deleted","Source soft deleted",None,source_id,"INFO",{"root":src["root"]});return
  if action=="restore":
   if src["enabled"]:return
   self.s.submit("UPDATE sources SET enabled=1,deleted_at=NULL,stale=1 WHERE source_id=?",(source_id,),True);self.event("source_restored","Source restored; currentness review required",None,source_id,"INFO",{"root":src["root"]});return
  if action in ("purge","permanent-delete","permanent_delete"):
   if src["enabled"]:raise RuntimeError("Soft delete the source before permanent deletion")
   self.s.submit("DELETE FROM sources WHERE source_id=?",(source_id,),True);self.event("source_purged","Source registration permanently deleted; evidence preserved",None,source_id,"INFO",{"root":src["root"]});return
  raise RuntimeError("bad source action")
 def snapshot(self,jid):
  j=self.s.rows("SELECT * FROM jobs WHERE job_id=?",(jid,))
  if not j:return None
  ss=self.s.rows("SELECT js.*,COALESCE(sc.label,s.label) label,COALESCE(sc.root,s.root) root,COALESCE(sc.estate,s.estate) estate,COALESCE(sc.failure_domain,s.failure_domain) failure_domain,COALESCE(sc.role,s.role) role FROM job_sources js LEFT JOIN job_scope_sources sc ON sc.job_id=js.job_id AND sc.source_id=js.source_id LEFT JOIN sources s ON s.source_id=js.source_id WHERE js.job_id=? ORDER BY label",(jid,))
  m=self.s.rows("SELECT COUNT(*) discovered_files,COALESCE(SUM(size),0) discovered_bytes,SUM(CASE WHEN fingerprint IS NOT NULL THEN 1 ELSE 0 END) hashed_files,COALESCE(SUM(CASE WHEN fingerprint IS NOT NULL THEN size ELSE 0 END),0) hashed_bytes,SUM(CASE WHEN plan='REVIEW' THEN 1 ELSE 0 END) review_count,0 reclaimable_bytes FROM placements WHERE job_id=?",(jid,))[0]
  ev=self.s.rows("SELECT * FROM events WHERE job_id=? ORDER BY event_id DESC LIMIT 100",(jid,))
  job=dict(j[0]);now=time.time();base=job.get("started") or job.get("created") or now
  job["elapsed_seconds"]=max(0.0,(job.get("ended") or now)-base);job["last_progress_age"]=max(0.0,now-(job.get("last_progress") or base))
  rt=self.runs.get(jid,{})
  activity=list(rt.get("activity",{}).values())
  if activity:
   freshest=max(float(x.get("updated") or 0) for x in activity)
   if freshest>float(job.get("last_progress") or 0):job["last_progress_age"]=max(0.0,now-freshest)
  unfinished=job["state"] in ("RUNNING","STOPPING")
  job["effective_state"]="STALLED" if unfinished and job["last_progress_age"]>self.stall else job["state"]
  job["lifecycle_status"]="SOFT_DELETED" if job.get("deleted") else job["effective_state"]
  for x in ss:
   x["remaining_files"]=max(0,int(x.get("discovered_files") or 0)-int(x.get("hashed_files") or 0))
   x["remaining_bytes"]=max(0,int(x.get("discovered_bytes") or 0)-int(x.get("hashed_bytes") or 0))
   x["enumeration_complete"]=x.get("producer_state")=="COMPLETED"
  total_hashed=sum(int(x.get("hashed_files") or 0) for x in ss);total_bytes=sum(int(x.get("hashed_bytes") or 0) for x in ss)
  job["throughput_mbps"]=total_bytes/1048576/max(.001,job["elapsed_seconds"])
  job["queue_depth"]=sum(int(x.get("queue_depth") or 0) for x in ss);job["active_workers"]=sum(int(x.get("active_workers") or 0) for x in ss)
  job["errors"]=sum(int(x.get("errors") or 0) for x in ss);job["warnings"]=sum(int(x.get("warnings") or 0) for x in ss);job["source_count"]=len(self.s.rows("SELECT 1 FROM job_scope_sources WHERE job_id=?",(jid,)))
  job["known_remaining_files"]=sum(int(x.get("remaining_files") or 0) for x in ss);job["known_remaining_bytes"]=sum(int(x.get("remaining_bytes") or 0) for x in ss)
  scopes=self.s.rows("SELECT source_id,label,root,estate,failure_domain,role FROM job_scope_sources WHERE job_id=? ORDER BY label",(jid,))
  return {"job":job,"scope_sources":scopes,"sources":ss,"metrics":m,"events":ev,"activity":activity}
 def list_jobs(self,limit=100,include_deleted=True):
  where="job_type='analysis'" if include_deleted else "deleted=0 AND job_type='analysis'"
  rows=self.s.rows("SELECT job_id,state,deleted FROM jobs WHERE "+where+" ORDER BY deleted ASC,created DESC LIMIT ?",(int(limit),))
  items=[self.snapshot(x["job_id"]) for x in rows]
  live=[x for x in items if x and not x["job"].get("deleted") and x["job"]["state"] in ("QUEUED","RUNNING","PAUSED","STOPPING")]
  source_jobs={}
  for x in live:
   for sc in x.get("scope_sources",[]):source_jobs.setdefault(sc["source_id"],set()).add(x["job"]["job_id"])
  for x in items:
   if not x:continue
   jid=x["job"]["job_id"];overlap=set()
   for sc in x.get("scope_sources",[]):
    overlap.update(source_jobs.get(sc["source_id"],set())-{jid})
   x["job"]["overlap_job_ids"]=sorted(overlap)
   x["job"]["overlap_source_count"]=sum(1 for sc in x.get("scope_sources",[]) if (source_jobs.get(sc["source_id"],set())-{jid}))
  return items
