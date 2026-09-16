#!/usr/bin/env python3
# SOT Turn 02 clean pre-base backend — observable/non-blocking lineage
import os, json, sqlite3, hashlib, threading, time, uuid, traceback
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor, as_completed

HOME=os.path.expanduser('~'); ROOT=os.path.join(HOME,'.sot-turn02'); DB=os.path.join(ROOT,'sot.db')
os.makedirs(ROOT,exist_ok=True)
DB_LOCK=threading.RLock(); JOB_LOCK=threading.RLock(); ACTIVE={}

def conn():
 c=sqlite3.connect(DB,timeout=30); c.row_factory=sqlite3.Row; c.execute('PRAGMA journal_mode=WAL'); c.execute('PRAGMA busy_timeout=30000'); return c

def init():
 with conn() as c:
  c.executescript('''CREATE TABLE IF NOT EXISTS sources(id INTEGER PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL UNIQUE,role TEXT NOT NULL DEFAULT 'source',failure_domain TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS placements(id INTEGER PRIMARY KEY,job_id TEXT,source_id INTEGER,path TEXT,size INTEGER,mtime REAL,sha256 TEXT,available INTEGER DEFAULT 1);
CREATE INDEX IF NOT EXISTS idx_p_hash ON placements(sha256); CREATE INDEX IF NOT EXISTS idx_p_job ON placements(job_id);
CREATE TABLE IF NOT EXISTS decisions(id INTEGER PRIMARY KEY,job_id TEXT,sha256 TEXT,source_id INTEGER,path TEXT,size INTEGER,decision TEXT,reason TEXT);
CREATE INDEX IF NOT EXISTS idx_d_job ON decisions(job_id);
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY,state TEXT NOT NULL,created REAL,started REAL,finished REAL,total_files INTEGER DEFAULT 0,total_bytes INTEGER DEFAULT 0,scanned_files INTEGER DEFAULT 0,scanned_bytes INTEGER DEFAULT 0,unique_count INTEGER DEFAULT 0,unique_bytes INTEGER DEFAULT 0,duplicate_groups INTEGER DEFAULT 0,duplicate_bytes INTEGER DEFAULT 0,review_count INTEGER DEFAULT 0,review_bytes INTEGER DEFAULT 0,reclaimable_bytes INTEGER DEFAULT 0,current_source TEXT,current_path TEXT,warnings INTEGER DEFAULT 0,errors INTEGER DEFAULT 0,skipped INTEGER DEFAULT 0,message TEXT);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,ts REAL NOT NULL,severity TEXT NOT NULL,event_type TEXT NOT NULL,job_id TEXT,source_id INTEGER,message TEXT NOT NULL,detail TEXT);
''')

def event(sev,typ,msg,job=None,source=None,detail=None):
 try:
  with DB_LOCK,conn() as c: c.execute('INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail) VALUES(?,?,?,?,?,?,?)',(time.time(),sev,typ,job,source,msg,json.dumps(detail) if detail is not None else None))
 except Exception: print('LOG FAILURE',traceback.format_exc(),flush=True)

def upd(job,**kw):
 if not kw:return
 with DB_LOCK,conn() as c: c.execute('UPDATE jobs SET '+','.join(f'{k}=?' for k in kw)+' WHERE id=?',list(kw.values())+[job])

def jobrow(job):
 with conn() as c:
  r=c.execute('SELECT * FROM jobs WHERE id=?',(job,)).fetchone(); return dict(r) if r else None

def controls(job):
 with JOB_LOCK:return ACTIVE.get(job)

def checkpoint(job):
 ctl=controls(job)
 if not ctl:return False
 while ctl['pause'].is_set() and not ctl['stop'].is_set():
  if jobrow(job)['state']!='paused': upd(job,state='paused',message='Paused'); event('INFO','job.paused','Analysis paused',job)
  time.sleep(.2)
 if ctl['stop'].is_set():return False
 if jobrow(job)['state']=='paused': upd(job,state='running',message='Resumed'); event('INFO','job.resumed','Analysis resumed',job)
 return True

def hashfile(path,job,sid):
 h=hashlib.sha256(); n=0
 try:
  with open(path,'rb') as f:
   while True:
    if not checkpoint(job): return None,n,'stopped'
    b=f.read(1024*1024)
    if not b:break
    h.update(b); n+=len(b)
  return h.hexdigest(),n,None
 except Exception as e:
  event('ERROR','file.hash_failed',f'Hash failed: {path}',job,sid,{'error':str(e)}); return None,n,str(e)

def enumerate_source(src,job):
 sid=src['id']; root=src['path']; files=[]; total=0
 event('INFO','source.enumeration_started',f'Enumerating {src["name"]}',job,sid,{'path':root})
 try:
  for dp,dn,fn in os.walk(root):
   if not checkpoint(job):break
   for name in fn:
    p=os.path.join(dp,name)
    try:
     st=os.stat(p); files.append((p,st.st_size,st.st_mtime)); total+=st.st_size
    except Exception as e:
     upd(job,skipped=jobrow(job)['skipped']+1,warnings=jobrow(job)['warnings']+1); event('WARNING','file.stat_failed',f'Skipped unreadable file: {p}',job,sid,{'error':str(e)})
  event('INFO','source.enumeration_complete',f'Enumerated {len(files)} files in {src["name"]}',job,sid,{'files':len(files),'bytes':total}); return files,total
 except Exception as e:
  upd(job,errors=jobrow(job)['errors']+1); event('ERROR','source.enumeration_failed',f'Enumeration failed: {src["name"]}',job,sid,{'error':str(e)}); return [],0

def scan_source(src,job,files):
 sid=src['id']; event('INFO','source.scan_started',f'Scanning {src["name"]}',job,sid)
 for p,size,mt in files:
  if not checkpoint(job):break
  upd(job,current_source=src['name'],current_path=p)
  sha,n,err=hashfile(p,job,sid)
  if sha:
   with DB_LOCK,conn() as c:c.execute('INSERT INTO placements(job_id,source_id,path,size,mtime,sha256,available) VALUES(?,?,?,?,?,?,1)',(job,sid,p,size,mt,sha))
   r=jobrow(job); upd(job,scanned_files=r['scanned_files']+1,scanned_bytes=r['scanned_bytes']+size)
  elif err!='stopped':
   r=jobrow(job); upd(job,skipped=r['skipped']+1,errors=r['errors']+1)
 event('INFO','source.scan_complete',f'Scan worker finished: {src["name"]}',job,sid)

def infer(job):
 event('INFO','inference.started','Inference started',job)
 with conn() as c:
  rows=[dict(x) for x in c.execute('SELECT p.*,s.name source_name,s.role,s.failure_domain FROM placements p JOIN sources s ON s.id=p.source_id WHERE p.job_id=?',(job,))]
 groups={}
 for r in rows:groups.setdefault(r['sha256'],[]).append(r)
 decisions=[]; unique_bytes=0; dup_groups=0; dup_bytes=0; reclaim=0; reviewc=0; reviewb=0
 for sha,g in groups.items():
  unique_bytes+=g[0]['size']
  if len(g)==1: decisions.append((g[0],'KEEP','Only observed placement')); continue
  dup_groups+=1; dup_bytes+=(len(g)-1)*g[0]['size']; cans=[x for x in g if x['role']=='canonical']
  if len(cans)!=1:
   for x in g: decisions.append((x,'REVIEW','Duplicate group does not have exactly one explicit canonical placement')); reviewc+=1; reviewb+=x['size']
   continue
  can=cans[0]; decisions.append((can,'KEEP','Explicit canonical placement'))
  backups=[x for x in g if x['role']=='backup' and x['failure_domain']!=can['failure_domain']]
  if not backups:
   for x in g:
    if x is not can: decisions.append((x,'REVIEW','No independent protection placement established')); reviewc+=1; reviewb+=x['size']
  else:
   prot=sorted(backups,key=lambda x:(x['failure_domain'],x['path']))[0]; decisions.append((prot,'PROTECT','Independent protection placement'))
   for x in g:
    if x is not can and x is not prot: decisions.append((x,'REMOVE','Redundant after canonical and independent protection')); reclaim+=x['size']
 with DB_LOCK,conn() as c:
  c.execute('DELETE FROM decisions WHERE job_id=?',(job,))
  c.executemany('INSERT INTO decisions(job_id,sha256,source_id,path,size,decision,reason) VALUES(?,?,?,?,?,?,?)',[(job,x['sha256'],x['source_id'],x['path'],x['size'],d,why) for x,d,why in decisions])
 upd(job,unique_count=len(groups),unique_bytes=unique_bytes,duplicate_groups=dup_groups,duplicate_bytes=dup_bytes,review_count=reviewc,review_bytes=reviewb,reclaimable_bytes=reclaim)
 event('INFO','inference.complete','Inference completed',job,detail={'unique':len(groups),'duplicate_groups':dup_groups,'reclaimable_bytes':reclaim,'review':reviewc})

def runjob(job):
 try:
  upd(job,state='enumerating',started=time.time(),message='Enumerating storage'); event('INFO','job.started','Analysis started',job)
  with conn() as c:srcs=[dict(x) for x in c.execute('SELECT * FROM sources WHERE enabled=1 ORDER BY id')]
  allf={}; tf=tb=0
  for s in srcs:
   if not checkpoint(job):break
   fs,b=enumerate_source(s,job); allf[s['id']]=fs; tf+=len(fs);tb+=b;upd(job,total_files=tf,total_bytes=tb)
  if not checkpoint(job): upd(job,state='stopped',finished=time.time(),message='Stopped');event('WARNING','job.stopped','Analysis stopped',job);return
  upd(job,state='running',total_files=tf,total_bytes=tb,message='Hashing content')
  with ThreadPoolExecutor(max_workers=min(8,max(1,len(srcs)))) as ex:
   fut=[ex.submit(scan_source,s,job,allf.get(s['id'],[])) for s in srcs]
   for f in as_completed(fut): f.result()
  if not checkpoint(job): upd(job,state='stopped',finished=time.time(),message='Stopped');event('WARNING','job.stopped','Analysis stopped',job);return
  upd(job,state='inferring',message='Inferring consolidation plan');infer(job);upd(job,state='complete',finished=time.time(),current_path='',message='Complete');event('INFO','job.complete','Analysis completed successfully',job)
 except Exception as e:
  upd(job,state='failed',finished=time.time(),message=str(e),errors=(jobrow(job) or {}).get('errors',0)+1);event('ERROR','job.failed','Analysis failed',job,detail={'error':str(e),'trace':traceback.format_exc()})
 finally:
  with JOB_LOCK:ACTIVE.pop(job,None)

def start_job():
 jid=str(uuid.uuid4());
 with DB_LOCK,conn() as c:c.execute('INSERT INTO jobs(id,state,created,message) VALUES(?,?,?,?)',(jid,'queued',time.time(),'Queued'))
 with JOB_LOCK:ACTIVE[jid]={'pause':threading.Event(),'stop':threading.Event()}
 event('INFO','job.created','Analysis job created',jid);threading.Thread(target=runjob,args=(jid,),daemon=True).start();return jid

def latest_job():
 with conn() as c:
  r=c.execute('SELECT * FROM jobs ORDER BY created DESC LIMIT 1').fetchone();return dict(r) if r else None

def jsend(h,obj,status=200):
 b=json.dumps(obj).encode();h.send_response(status);h.send_header('Content-Type','application/json');h.send_header('Access-Control-Allow-Origin','*');h.send_header('Access-Control-Allow-Headers','Content-Type');h.send_header('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.send_header('Content-Length',str(len(b)));h.end_headers();h.wfile.write(b)

def body(h):
 try:return json.loads(h.rfile.read(int(h.headers.get('Content-Length','0') or 0)) or b'{}')
 except:return {}

class H(BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def do_OPTIONS(self):jsend(self,{})
 def do_GET(self):
  try:
   u=urlparse(self.path);p=u.path;q=parse_qs(u.query)
   if p=='/api/health':return jsend(self,{'ok':True,'version':'turn02-clean-3','time':time.time(),'active_jobs':len(ACTIVE)})
   if p=='/api/sources':
    with conn() as c:r=[dict(x) for x in c.execute('SELECT * FROM sources ORDER BY id')]
    return jsend(self,r)
   if p=='/api/volumes':
    out=[]
    if os.path.isdir('/mnt'):
     for n in sorted(os.listdir('/mnt')):
      pp='/mnt/'+n
      if os.path.isdir(pp):
       try:st=os.statvfs(pp);out.append({'name':n.upper()+':','path':pp,'total':st.f_blocks*st.f_frsize,'free':st.f_bavail*st.f_frsize})
       except:out.append({'name':n.upper()+':','path':pp,'total':0,'free':0})
    return jsend(self,out)
   if p=='/api/folders':
    path=q.get('path',['/'])[0];out=[]
    try:
     for n in sorted(os.listdir(path),key=str.lower):
      pp=os.path.join(path,n)
      if os.path.isdir(pp):out.append({'name':n,'path':pp})
     return jsend(self,{'path':path,'folders':out})
    except Exception as e:event('ERROR','folder.browse_failed',f'Folder browse failed: {path}',detail={'error':str(e)});return jsend(self,{'error':str(e)},400)
   if p=='/api/jobs':
    with conn() as c:r=[dict(x) for x in c.execute('SELECT * FROM jobs ORDER BY created DESC LIMIT 50')]
    return jsend(self,r)
   if p=='/api/job':return jsend(self,latest_job() or {})
   if p=='/api/events':
    lim=min(1000,int(q.get('limit',['300'])[0]));sev=q.get('severity',[''])[0]
    with conn() as c:
     sql='SELECT * FROM events '+('WHERE severity=? ' if sev else '')+'ORDER BY id DESC LIMIT ?';args=([sev] if sev else [])+[lim];r=[dict(x) for x in c.execute(sql,args)]
    return jsend(self,r)
   if p=='/api/database':
    search=q.get('q',[''])[0];decision=q.get('decision',[''])[0];job=q.get('job',[''])[0] or ((latest_job() or {}).get('id',''))
    with conn() as c:
     sql='''SELECT p.sha256,p.path,p.size,p.source_id,s.name source,s.role,s.failure_domain,COALESCE(d.decision,'') decision,COALESCE(d.reason,'') reason FROM placements p JOIN sources s ON s.id=p.source_id LEFT JOIN decisions d ON d.job_id=p.job_id AND d.source_id=p.source_id AND d.path=p.path WHERE p.job_id=?''';args=[job]
     if search:sql+=' AND (p.path LIKE ? OR p.sha256 LIKE ? OR s.name LIKE ?)';args += ['%'+search+'%']*3
     if decision:sql+=' AND d.decision=?';args.append(decision)
     sql+=' ORDER BY p.sha256,p.path LIMIT 2000';r=[dict(x) for x in c.execute(sql,args)]
    return jsend(self,r)
   if p=='/api/plan':
    j=q.get('job',[''])[0] or ((latest_job() or {}).get('id',''))
    with conn() as c:r=[dict(x) for x in c.execute('SELECT d.*,s.name source FROM decisions d JOIN sources s ON s.id=d.source_id WHERE d.job_id=? ORDER BY d.sha256,d.decision,d.path',(j,))]
    return jsend(self,r)
   return jsend(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.get_failed',self.path,detail={'error':str(e)});jsend(self,{'error':str(e)},500)
 def do_POST(self):
  try:
   p=urlparse(self.path).path;b=body(self)
   if p=='/api/sources':
    path=b.get('path','').rstrip('/') or '/';name=b.get('name') or os.path.basename(path) or path;role=b.get('role','source');fd=b.get('failure_domain') or (path.split('/')[2] if path.startswith('/mnt/') and len(path.split('/'))>2 else path)
    if role not in ('source','canonical','backup') or not os.path.isdir(path):return jsend(self,{'error':'Path must be a readable WSL directory and role must be source/canonical/backup'},400)
    with DB_LOCK,conn() as c:cur=c.execute('INSERT OR IGNORE INTO sources(name,path,role,failure_domain) VALUES(?,?,?,?)',(name,path,role,fd));sid=cur.lastrowid or c.execute('SELECT id FROM sources WHERE path=?',(path,)).fetchone()[0]
    event('INFO','source.registered',f'Storage registered: {name}',source=sid,detail={'path':path,'role':role,'failure_domain':fd});return jsend(self,{'ok':True,'id':sid})
   if p=='/api/analyze':return jsend(self,{'ok':True,'job_id':start_job()})
   if p.startswith('/api/jobs/'):
    a=p.split('/');jid=a[3];act=a[4] if len(a)>4 else ''
    ctl=controls(jid)
    if act=='pause' and ctl:ctl['pause'].set();event('INFO','job.pause_requested','Pause requested',jid);return jsend(self,{'ok':True})
    if act=='resume' and ctl:ctl['pause'].clear();event('INFO','job.resume_requested','Resume requested',jid);return jsend(self,{'ok':True})
    if act=='stop' and ctl:ctl['stop'].set();ctl['pause'].clear();upd(jid,state='stopping',message='Stopping');event('WARNING','job.stop_requested','Stop requested',jid);return jsend(self,{'ok':True})
    if act=='restart':
     if ctl:ctl['stop'].set();ctl['pause'].clear()
     return jsend(self,{'ok':True,'job_id':start_job()})
    return jsend(self,{'error':'Job is not active'},409)
   return jsend(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.post_failed',self.path,detail={'error':str(e)});jsend(self,{'error':str(e)},500)
 def do_DELETE(self):
  try:
   p=urlparse(self.path).path
   if p.startswith('/api/sources/'):
    sid=int(p.rsplit('/',1)[1]);
    with DB_LOCK,conn() as c:c.execute('DELETE FROM sources WHERE id=?',(sid,))
    event('WARNING','source.unregistered',f'Storage registration removed: {sid}',source=sid);return jsend(self,{'ok':True})
   jsend(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.delete_failed',self.path,detail={'error':str(e)});jsend(self,{'error':str(e)},500)

if __name__=='__main__':
 init();event('INFO','backend.started','SOT backend started',detail={'version':'turn02-clean-3'});ThreadingHTTPServer(('0.0.0.0',8765),H).serve_forever()
