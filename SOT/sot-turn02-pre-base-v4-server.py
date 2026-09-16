#!/usr/bin/env python3
# SOT Turn 02 pre-base v4 — clean versioned read-only evidence engine
import os,json,sqlite3,hashlib,threading,time,uuid,traceback
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
from concurrent.futures import ThreadPoolExecutor,as_completed
ROOT=os.path.expanduser('~/.sot-turn02'); os.makedirs(ROOT,exist_ok=True)
DB=os.path.join(ROOT,'sot-v4.db'); SCHEMA=4; LOCK=threading.RLock(); ACTIVE={}; ACTIVE_LOCK=threading.RLock()
DDL='''CREATE TABLE meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE sources(id INTEGER PRIMARY KEY,name TEXT NOT NULL,path TEXT NOT NULL UNIQUE,role TEXT NOT NULL DEFAULT 'source',failure_domain TEXT NOT NULL,enabled INTEGER NOT NULL DEFAULT 1,created_at REAL NOT NULL);
CREATE TABLE revisions(id INTEGER PRIMARY KEY AUTOINCREMENT,job_id TEXT UNIQUE NOT NULL,created_at REAL NOT NULL,state TEXT NOT NULL);
CREATE TABLE jobs(id TEXT PRIMARY KEY,revision_id INTEGER NOT NULL,state TEXT NOT NULL,created_at REAL,started_at REAL,finished_at REAL,total_files INTEGER DEFAULT 0,total_bytes INTEGER DEFAULT 0,scanned_files INTEGER DEFAULT 0,scanned_bytes INTEGER DEFAULT 0,unique_count INTEGER DEFAULT 0,unique_bytes INTEGER DEFAULT 0,duplicate_groups INTEGER DEFAULT 0,duplicate_excess_bytes INTEGER DEFAULT 0,review_count INTEGER DEFAULT 0,review_bytes INTEGER DEFAULT 0,reclaimable_bytes INTEGER DEFAULT 0,current_source TEXT,current_path TEXT,warnings INTEGER DEFAULT 0,errors INTEGER DEFAULT 0,skipped INTEGER DEFAULT 0,message TEXT);
CREATE TABLE placements(id INTEGER PRIMARY KEY AUTOINCREMENT,revision_id INTEGER NOT NULL,source_id INTEGER NOT NULL,path TEXT NOT NULL,filename TEXT NOT NULL,extension TEXT NOT NULL,created_time REAL,modified_time REAL,size INTEGER NOT NULL,scanned_at REAL NOT NULL,sha256 TEXT,content_id TEXT,lifecycle TEXT NOT NULL,availability TEXT NOT NULL,error_detail TEXT,last_verified REAL,UNIQUE(revision_id,source_id,path));
CREATE INDEX idx_place_rev ON placements(revision_id); CREATE INDEX idx_place_hash ON placements(revision_id,sha256);
CREATE TABLE duplicate_groups(id TEXT NOT NULL,revision_id INTEGER NOT NULL,content_id TEXT NOT NULL,sha256 TEXT NOT NULL,cardinality INTEGER NOT NULL,content_size INTEGER NOT NULL,physical_bytes INTEGER NOT NULL,excess_bytes INTEGER NOT NULL,PRIMARY KEY(revision_id,id));
CREATE TABLE duplicate_members(revision_id INTEGER NOT NULL,group_id TEXT NOT NULL,placement_id INTEGER NOT NULL,PRIMARY KEY(revision_id,group_id,placement_id));
CREATE TABLE decisions(revision_id INTEGER NOT NULL,placement_id INTEGER NOT NULL,plan TEXT NOT NULL,rationale TEXT NOT NULL,disposition TEXT NOT NULL DEFAULT 'NONE',PRIMARY KEY(revision_id,placement_id));
CREATE TABLE events(id INTEGER PRIMARY KEY AUTOINCREMENT,ts REAL NOT NULL,severity TEXT NOT NULL,event_type TEXT NOT NULL,job_id TEXT,source_id INTEGER,message TEXT NOT NULL,detail TEXT);
'''
def cx():
 c=sqlite3.connect(DB,timeout=30);c.row_factory=sqlite3.Row;c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA busy_timeout=30000');return c
def init():
 fresh=not os.path.exists(DB)
 with cx() as c:
  if fresh:c.executescript(DDL);c.execute('INSERT INTO meta VALUES(?,?)',('schema_version',str(SCHEMA)));c.execute('INSERT INTO meta VALUES(?,?)',('product','SOT Turn 02 pre-base v4'))
  row=c.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
  if not row or int(row[0])!=SCHEMA:raise RuntimeError('Unsupported SOT v4 database schema')
def event(sev,typ,msg,job=None,source=None,detail=None):
 try:
  with LOCK,cx() as c:c.execute('INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail) VALUES(?,?,?,?,?,?,?)',(time.time(),sev,typ,job,source,msg,json.dumps(detail) if detail is not None else None))
 except Exception as e:print('EVENT FAILURE',e,flush=True)
def update_job(jid,**kw):
 if kw:
  with LOCK,cx() as c:c.execute('UPDATE jobs SET '+','.join(k+'=?' for k in kw)+' WHERE id=?',list(kw.values())+[jid])
def job(jid):
 with cx() as c:r=c.execute('SELECT * FROM jobs WHERE id=?',(jid,)).fetchone();return dict(r) if r else None
def ctl(jid):
 with ACTIVE_LOCK:return ACTIVE.get(jid)
def checkpoint(jid):
 x=ctl(jid)
 if not x:return False
 while x['pause'].is_set() and not x['stop'].is_set():
  if job(jid)['state']!='paused':update_job(jid,state='paused',message='Paused');event('INFO','job.paused','Analysis paused',jid)
  time.sleep(.2)
 if x['stop'].is_set():return False
 if job(jid)['state']=='paused':update_job(jid,state='hashing',message='Hashing content');event('INFO','job.resumed','Analysis resumed',jid)
 return True
def volumes():
 out=[]
 for base in ('/mnt','/media'):
  if not os.path.isdir(base):continue
  try:names=sorted(os.listdir(base),key=str.lower)
  except Exception as e:event('ERROR','storage.inventory_failed',base,detail={'error':str(e)});continue
  for n in names:
   p=os.path.join(base,n)
   if not os.path.isdir(p):continue
   try:s=os.statvfs(p);total=s.f_blocks*s.f_frsize;free=s.f_bavail*s.f_frsize
   except Exception:total=free=0
   out.append({'name':(n.upper()+':') if base=='/mnt' and len(n)==1 else n,'path':p,'total':total,'free':free})
 return out
def allowed(raw):
 p=os.path.realpath(os.path.expanduser(raw));roots=[os.path.realpath(v['path']) for v in volumes()];root=next((r for r in roots if p==r or p.startswith(r+os.sep)),None);return p,root
def browse(raw):
 p,root=allowed(raw)
 if not root or not os.path.isdir(p):raise ValueError('Folder is outside available storage')
 a=[]
 for e in sorted(os.scandir(p),key=lambda x:x.name.lower()):
  try:
   if e.is_dir(follow_symlinks=False) and not e.name.startswith('.'):a.append({'name':e.name,'path':e.path})
  except Exception as ex:event('WARNING','folder.entry_failed',e.path,detail={'error':str(ex)})
 return {'path':p,'root':root,'parent':None if p==root else os.path.dirname(p),'folders':a}
def enumerate_source(s,jid):
 out=[];total=0;event('INFO','source.enumeration_started','Enumerating '+s['name'],jid,s['id'],{'path':s['path']})
 for dp,dn,fn in os.walk(s['path']):
  if not checkpoint(jid):break
  dn[:]=[x for x in dn if not x.startswith('.sot')]
  for name in fn:
   p=os.path.join(dp,name)
   try:st=os.stat(p);out.append((p,st.st_size,st.st_mtime,getattr(st,'st_birthtime',None)));total+=st.st_size
   except Exception as e:
    r=job(jid);update_job(jid,skipped=r['skipped']+1,warnings=r['warnings']+1);event('WARNING','file.stat_failed','Skipped unreadable file',jid,s['id'],{'path':p,'error':str(e)})
 event('INFO','source.enumeration_complete','Enumeration complete: '+s['name'],jid,s['id'],{'files':len(out),'bytes':total});return out,total
def hash_one(path,jid,sid):
 h=hashlib.sha256()
 try:
  with open(path,'rb') as f:
   while True:
    if not checkpoint(jid):return None,'stopped'
    b=f.read(1024*1024)
    if not b:break
    h.update(b)
  return h.hexdigest(),None
 except Exception as e:event('ERROR','file.hash_failed','Hash failed',jid,sid,{'path':path,'error':str(e)});return None,str(e)
def scan_source(s,jid,rev,items):
 event('INFO','source.scan_started','Hashing '+s['name'],jid,s['id'])
 for p,size,mt,ct in items:
  if not checkpoint(jid):break
  update_job(jid,current_source=s['name'],current_path=p);sha,err=hash_one(p,jid,s['id']);now=time.time();fn=os.path.basename(p);ext=os.path.splitext(fn)[1].lower().lstrip('.')
  if sha:
   with LOCK,cx() as c:c.execute('INSERT INTO placements(revision_id,source_id,path,filename,extension,created_time,modified_time,size,scanned_at,sha256,content_id,lifecycle,availability,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(rev,s['id'],p,fn,ext,ct,mt,size,now,sha,sha,'HASHED','AVAILABLE',now))
   r=job(jid);update_job(jid,scanned_files=r['scanned_files']+1,scanned_bytes=r['scanned_bytes']+size)
  elif err!='stopped':
   r=job(jid);update_job(jid,errors=r['errors']+1,skipped=r['skipped']+1)
 event('INFO','source.scan_complete','Hash worker complete: '+s['name'],jid,s['id'])
def infer(jid,rev):
 update_job(jid,state='inferring',message='Cross-referencing duplicates and planning');event('INFO','inference.started','Inference started',jid)
 with cx() as c:rows=[dict(x) for x in c.execute('SELECT p.*,s.name source_name,s.role,s.failure_domain FROM placements p JOIN sources s ON s.id=p.source_id WHERE p.revision_id=?',(rev,))]
 groups={}
 for r in rows:groups.setdefault(r['sha256'],[]).append(r)
 decisions=[];dups=[];members=[];unique_bytes=dup_excess=reclaim=review_bytes=review_count=0
 for sha,g in groups.items():
  unique_bytes+=g[0]['size'];gid='dup-'+sha[:20]
  if len(g)>1:
   physical=len(g)*g[0]['size'];excess=(len(g)-1)*g[0]['size'];dup_excess+=excess;dups.append((gid,rev,sha,sha,len(g),g[0]['size'],physical,excess));members += [(rev,gid,x['id']) for x in g]
  if len(g)==1:decisions.append((g[0],'KEEP','Only observed placement'))
  else:
   cans=[x for x in g if x['role']=='canonical']
   if len(cans)!=1:
    for x in g:decisions.append((x,'REVIEW','Duplicate group does not have exactly one explicit canonical placement'));review_count+=1;review_bytes+=x['size']
   else:
    can=cans[0];decisions.append((can,'KEEP','Explicit canonical placement'));backs=[x for x in g if x['role']=='backup' and x['failure_domain']!=can['failure_domain']]
    if not backs:
     for x in g:
      if x['id']!=can['id']:decisions.append((x,'REVIEW','No independent protection placement established'));review_count+=1;review_bytes+=x['size']
    else:
     prot=sorted(backs,key=lambda x:(x['failure_domain'],x['path']))[0];decisions.append((prot,'PROTECT','Independent protection placement'))
     for x in g:
      if x['id'] not in (can['id'],prot['id']):decisions.append((x,'REMOVE','Redundant after canonical and independent protection'));reclaim+=x['size']
 with LOCK,cx() as c:
  c.executemany('INSERT INTO duplicate_groups VALUES(?,?,?,?,?,?,?,?)',dups);c.executemany('INSERT INTO duplicate_members VALUES(?,?,?)',members);c.executemany('INSERT INTO decisions(revision_id,placement_id,plan,rationale,disposition) VALUES(?,?,?,?,?)',[(rev,x['id'],d,why,'NONE') for x,d,why in decisions]);c.execute("UPDATE placements SET lifecycle='PLANNED' WHERE revision_id=?",(rev,));c.execute("UPDATE placements SET lifecycle='COMPLETED' WHERE revision_id=?",(rev,))
 update_job(jid,unique_count=len(groups),unique_bytes=unique_bytes,duplicate_groups=len(dups),duplicate_excess_bytes=dup_excess,review_count=review_count,review_bytes=review_bytes,reclaimable_bytes=reclaim);event('INFO','inference.complete','Inference and planning complete',jid,detail={'content_objects':len(groups),'duplicate_groups':len(dups),'reclaimable_bytes':reclaim,'review_count':review_count})
def run(jid,rev):
 try:
  update_job(jid,state='enumerating',started_at=time.time(),message='Enumerating storage');event('INFO','job.started','Analysis started',jid)
  with cx() as c:ss=[dict(x) for x in c.execute('SELECT * FROM sources WHERE enabled=1 ORDER BY id')]
  allf={};tf=tb=0
  for s in ss:
   if not checkpoint(jid):break
   a,b=enumerate_source(s,jid);allf[s['id']]=a;tf+=len(a);tb+=b;update_job(jid,total_files=tf,total_bytes=tb)
  if not checkpoint(jid):raise InterruptedError
  update_job(jid,state='hashing',message='Hashing content')
  with ThreadPoolExecutor(max_workers=min(8,max(1,len(ss)))) as ex:
   fs=[ex.submit(scan_source,s,jid,rev,allf.get(s['id'],[])) for s in ss]
   for f in as_completed(fs):f.result()
  if not checkpoint(jid):raise InterruptedError
  infer(jid,rev);update_job(jid,state='complete',finished_at=time.time(),current_path='',message='Complete');
  with LOCK,cx() as c:c.execute("UPDATE revisions SET state='complete' WHERE id=?",(rev,))
  event('INFO','job.complete','Analysis completed successfully',jid)
 except InterruptedError:
  update_job(jid,state='stopped',finished_at=time.time(),message='Stopped');event('WARNING','job.stopped','Analysis stopped',jid)
 except Exception as e:
  r=job(jid) or {};update_job(jid,state='failed',finished_at=time.time(),message=str(e),errors=r.get('errors',0)+1);event('ERROR','job.failed','Analysis failed',jid,detail={'error':str(e),'trace':traceback.format_exc()})
 finally:
  with ACTIVE_LOCK:ACTIVE.pop(jid,None)
def start():
 jid=str(uuid.uuid4());now=time.time()
 with LOCK,cx() as c:
  cur=c.execute('INSERT INTO revisions(job_id,created_at,state) VALUES(?,?,?)',(jid,now,'active'));rev=cur.lastrowid;c.execute('INSERT INTO jobs(id,revision_id,state,created_at,message) VALUES(?,?,?,?,?)',(jid,rev,'queued',now,'Queued'))
 with ACTIVE_LOCK:ACTIVE[jid]={'pause':threading.Event(),'stop':threading.Event()}
 event('INFO','job.created','Analysis job created',jid);threading.Thread(target=run,args=(jid,rev),daemon=True).start();return jid
def latest():
 with cx() as c:r=c.execute('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 1').fetchone();return dict(r) if r else None
def send(h,x,code=200):
 b=json.dumps(x).encode();h.send_response(code);h.send_header('Content-Type','application/json');h.send_header('Access-Control-Allow-Origin','*');h.send_header('Access-Control-Allow-Headers','Content-Type');h.send_header('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');h.send_header('Content-Length',str(len(b)));h.end_headers();h.wfile.write(b)
def body(h):
 try:return json.loads(h.rfile.read(int(h.headers.get('Content-Length','0') or 0)) or b'{}')
 except:return {}
class H(BaseHTTPRequestHandler):
 def log_message(self,*a):pass
 def do_OPTIONS(self):send(self,{})
 def do_GET(self):
  try:
   u=urlparse(self.path);p=u.path;q=parse_qs(u.query)
   if p=='/api/health':return send(self,{'ok':True,'version':'turn02-pre-base-v4','schema':SCHEMA,'database':os.path.basename(DB),'time':time.time(),'active_jobs':len(ACTIVE)})
   if p=='/api/volumes':return send(self,volumes())
   if p=='/api/folders':return send(self,browse(q.get('path',[''])[0]))
   if p=='/api/sources':
    with cx() as c:return send(self,[dict(x) for x in c.execute('SELECT * FROM sources ORDER BY id')])
   if p=='/api/job':return send(self,latest() or {})
   if p=='/api/jobs':
    with cx() as c:return send(self,[dict(x) for x in c.execute('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 100')])
   if p=='/api/events':
    lim=min(1000,int(q.get('limit',['500'])[0]));sev=q.get('severity',[''])[0];term=q.get('q',[''])[0]
    sql='SELECT * FROM events WHERE 1=1';a=[]
    if sev:sql+=' AND severity=?';a.append(sev)
    if term:sql+=' AND (message LIKE ? OR event_type LIKE ? OR detail LIKE ?)';a += ['%'+term+'%']*3
    sql+=' ORDER BY id DESC LIMIT ?';a.append(lim)
    with cx() as c:return send(self,[dict(x) for x in c.execute(sql,a)])
   if p=='/api/database':
    j=latest();rev=int(q.get('revision',[str(j['revision_id'] if j else 0)])[0]);term=q.get('q',[''])[0];plan=q.get('plan',[''])[0];status=q.get('status',[''])[0];ext=q.get('extension',[''])[0];card=q.get('cardinality',[''])[0]
    sql='''SELECT p.*,s.name source,s.role,s.failure_domain,COALESCE(d.plan,'') plan,COALESCE(d.rationale,'') rationale,COALESCE(d.disposition,'NONE') disposition,COALESCE(g.id,'') duplicate_group,COALESCE(g.cardinality,1) cardinality FROM placements p JOIN sources s ON s.id=p.source_id LEFT JOIN decisions d ON d.revision_id=p.revision_id AND d.placement_id=p.id LEFT JOIN duplicate_members m ON m.revision_id=p.revision_id AND m.placement_id=p.id LEFT JOIN duplicate_groups g ON g.revision_id=m.revision_id AND g.id=m.group_id WHERE p.revision_id=?''';a=[rev]
    if term:sql+=' AND (p.filename LIKE ? OR p.path LIKE ? OR p.sha256 LIKE ? OR s.name LIKE ? OR g.id LIKE ?)';a += ['%'+term+'%']*5
    if plan:sql+=' AND d.plan=?';a.append(plan)
    if status:sql+=' AND p.lifecycle=?';a.append(status)
    if ext:sql+=' AND p.extension=?';a.append(ext.lower().lstrip('.'))
    if card:sql+=' AND COALESCE(g.cardinality,1)=?';a.append(int(card))
    sql+=' ORDER BY p.sha256,p.path LIMIT 3000'
    with cx() as c:return send(self,[dict(x) for x in c.execute(sql,a)])
   if p=='/api/groups':
    j=latest();rev=int(q.get('revision',[str(j['revision_id'] if j else 0)])[0]);gid=q.get('id',[''])[0]
    with cx() as c:
     if gid:
      g=c.execute('SELECT * FROM duplicate_groups WHERE revision_id=? AND id=?',(rev,gid)).fetchone();ms=[dict(x) for x in c.execute('''SELECT p.*,s.name source,s.role,s.failure_domain,COALESCE(d.plan,'') plan,COALESCE(d.rationale,'') rationale FROM duplicate_members m JOIN placements p ON p.id=m.placement_id JOIN sources s ON s.id=p.source_id LEFT JOIN decisions d ON d.revision_id=p.revision_id AND d.placement_id=p.id WHERE m.revision_id=? AND m.group_id=? ORDER BY p.path''',(rev,gid))];return send(self,{'group':dict(g) if g else None,'placements':ms})
     return send(self,[dict(x) for x in c.execute('SELECT * FROM duplicate_groups WHERE revision_id=? ORDER BY cardinality DESC,excess_bytes DESC',(rev,))])
   if p=='/api/plan':
    j=latest();rev=int(q.get('revision',[str(j['revision_id'] if j else 0)])[0])
    with cx() as c:return send(self,[dict(x) for x in c.execute('''SELECT d.*,p.path,p.filename,p.size,p.sha256,s.name source FROM decisions d JOIN placements p ON p.id=d.placement_id JOIN sources s ON s.id=p.source_id WHERE d.revision_id=? ORDER BY d.plan,p.path''',(rev,))])
   return send(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.get_failed',self.path,detail={'error':str(e)});send(self,{'error':str(e)},500)
 def do_POST(self):
  try:
   p=urlparse(self.path).path;b=body(self)
   if p=='/api/sources':
    path,root=allowed(b.get('path',''))
    if not root or not os.path.isdir(path):return send(self,{'error':'Folder is not on available readable storage'},400)
    role=b.get('role','source')
    if role not in ('source','canonical','backup'):return send(self,{'error':'Invalid role'},400)
    try:
     with LOCK,cx() as c:cur=c.execute('INSERT INTO sources(name,path,role,failure_domain,created_at) VALUES(?,?,?,?,?)',(b.get('name') or os.path.basename(path) or path,path,role,b.get('failure_domain') or root,time.time()));sid=cur.lastrowid
     event('INFO','source.added','Storage source added',source=sid,detail={'path':path,'role':role});return send(self,{'id':sid})
    except sqlite3.IntegrityError:return send(self,{'error':'Storage source already registered'},409)
   if p=='/api/analyze':
    if any(x.get('state') in ('queued','enumerating','hashing','paused','inferring') for x in [latest() or {}]):return send(self,{'error':'Analysis already active'},409)
    jid=start();return send(self,{'job_id':jid})
   if p.startswith('/api/jobs/'):
    a=p.strip('/').split('/');jid=a[2];action=a[3];x=ctl(jid)
    if action=='restart':
     if x:x['stop'].set()
     return send(self,{'job_id':start()})
    if not x:return send(self,{'error':'Job is not active'},409)
    if action=='pause':x['pause'].set();event('INFO','job.pause_requested','Pause requested',jid)
    elif action=='resume':x['pause'].clear();event('INFO','job.resume_requested','Resume requested',jid)
    elif action=='stop':x['stop'].set();event('WARNING','job.stop_requested','Stop requested',jid)
    else:return send(self,{'error':'Unknown action'},404)
    return send(self,{'ok':True,'job_id':jid})
   return send(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.post_failed',self.path,detail={'error':str(e)});send(self,{'error':str(e)},500)
 def do_DELETE(self):
  try:
   p=urlparse(self.path).path
   if p.startswith('/api/sources/'):
    sid=int(p.rsplit('/',1)[-1]);
    with LOCK,cx() as c:c.execute('UPDATE sources SET enabled=0 WHERE id=?',(sid,))
    event('INFO','source.disabled','Storage source disabled',source=sid);return send(self,{'ok':True})
   send(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.delete_failed',self.path,detail={'error':str(e)});send(self,{'error':str(e)},500)
init();event('INFO','backend.started','SOT Turn 02 pre-base v4 started',detail={'schema':SCHEMA,'database':DB})
if __name__=='__main__':print('SOT Turn 02 pre-base v4 http://0.0.0.0:8765',flush=True);ThreadingHTTPServer(('0.0.0.0',8765),H).serve_forever()
