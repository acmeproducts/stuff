#!/usr/bin/env python3
# SOT Turn 02 pre-base v4.1 — schema-4 compatible, live enumeration telemetry
import os,json,sqlite3,hashlib,threading,time,uuid,traceback
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from urllib.parse import urlparse,parse_qs
from concurrent.futures import ThreadPoolExecutor,as_completed
ROOT=os.path.expanduser('~/.sot-turn02');DB=os.path.join(ROOT,'sot-v4.db');LOCK=threading.RLock();ACTIVE={};ALOCK=threading.RLock();os.makedirs(ROOT,exist_ok=True)
def cx():
 c=sqlite3.connect(DB,timeout=30);c.row_factory=sqlite3.Row;c.execute('PRAGMA journal_mode=WAL');c.execute('PRAGMA busy_timeout=30000');return c
def init():
 if not os.path.exists(DB):raise RuntimeError('sot-v4.db not found; install v4 first')
 with cx() as c:
  r=c.execute("SELECT value FROM meta WHERE key='schema_version'").fetchone()
  if not r or r[0]!='4':raise RuntimeError('unsupported database schema')
  cols={x['name'] for x in c.execute('PRAGMA table_info(jobs)')}
  # v4.1 deliberately uses existing schema-4 fields: total_* are live discovered totals during enumeration.
def event(sev,typ,msg,jid=None,sid=None,detail=None):
 try:
  with LOCK,cx() as c:c.execute('INSERT INTO events(ts,severity,event_type,job_id,source_id,message,detail) VALUES(?,?,?,?,?,?,?)',(time.time(),sev,typ,jid,sid,msg,json.dumps(detail) if detail is not None else None))
 except Exception as e:print('EVENT FAILURE',e,flush=True)
def upd(jid,**kw):
 if not kw:return
 with LOCK,cx() as c:c.execute('UPDATE jobs SET '+','.join(k+'=?' for k in kw)+' WHERE id=?',list(kw.values())+[jid])
def getjob(jid):
 with cx() as c:r=c.execute('SELECT * FROM jobs WHERE id=?',(jid,)).fetchone();return dict(r) if r else None
def latest():
 with cx() as c:r=c.execute('SELECT * FROM jobs ORDER BY created_at DESC LIMIT 1').fetchone();return dict(r) if r else None
def ctrl(jid):
 with ALOCK:return ACTIVE.get(jid)
def checkpoint(jid,stage=None):
 x=ctrl(jid)
 if not x:return False
 while x['pause'].is_set() and not x['stop'].is_set():
  if getjob(jid)['state']!='paused':upd(jid,state='paused',message='Paused');event('INFO','job.paused','Analysis paused',jid)
  time.sleep(.2)
 if x['stop'].is_set():return False
 if getjob(jid)['state']=='paused':upd(jid,state=stage or 'enumerating',message=('Enumerating storage' if stage=='enumerating' else 'Hashing content'));event('INFO','job.resumed','Analysis resumed',jid)
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
 p=os.path.realpath(os.path.expanduser(raw));roots=[os.path.realpath(x['path']) for x in volumes()];r=next((x for x in roots if p==x or p.startswith(x+os.sep)),None);return p,r
def browse(raw):
 p,r=allowed(raw)
 if not r or not os.path.isdir(p):raise ValueError('Folder is outside available storage')
 a=[]
 for e in sorted(os.scandir(p),key=lambda x:x.name.lower()):
  try:
   if e.is_dir(follow_symlinks=False) and not e.name.startswith('.'):a.append({'name':e.name,'path':e.path})
  except Exception as ex:event('WARNING','folder.entry_failed',e.path,detail={'error':str(ex)})
 return {'path':p,'root':r,'parent':None if p==r else os.path.dirname(p),'folders':a}
def enumerate_source(s,jid):
 out=[];nf=nb=0;event('INFO','source.enumeration_started','Enumerating '+s['name'],jid,s['id'],{'path':s['path']})
 for dp,dn,fn in os.walk(s['path']):
  if not checkpoint(jid,'enumerating'):break
  dn[:]=[x for x in dn if not x.startswith('.sot')]
  upd(jid,current_source=s['name'],current_path=dp,message='Enumerating folder')
  event('INFO','folder.enumerating','Enumerating folder',jid,s['id'],{'path':dp})
  for name in fn:
   if not checkpoint(jid,'enumerating'):break
   p=os.path.join(dp,name);upd(jid,current_source=s['name'],current_path=p,message='Enumerating file')
   try:
    st=os.stat(p);out.append((p,st.st_size,st.st_mtime,getattr(st,'st_birthtime',None)));nf+=1;nb+=st.st_size
    j=getjob(jid);upd(jid,total_files=(j['total_files'] or 0)+1,total_bytes=(j['total_bytes'] or 0)+st.st_size)
   except Exception as e:
    j=getjob(jid);upd(jid,skipped=(j['skipped'] or 0)+1,warnings=(j['warnings'] or 0)+1);event('WARNING','file.stat_failed','Skipped unreadable file',jid,s['id'],{'path':p,'error':str(e)})
 event('INFO','source.enumeration_complete','Enumeration complete: '+s['name'],jid,s['id'],{'files':nf,'bytes':nb});return out
def hash_one(p,jid,sid):
 h=hashlib.sha256()
 try:
  with open(p,'rb') as f:
   while True:
    if not checkpoint(jid,'hashing'):return None,'stopped'
    b=f.read(1024*1024)
    if not b:break
    h.update(b)
  return h.hexdigest(),None
 except Exception as e:event('ERROR','file.hash_failed','Hash failed',jid,sid,{'path':p,'error':str(e)});return None,str(e)
def scan_source(s,jid,rev,items):
 event('INFO','source.scan_started','Hashing '+s['name'],jid,s['id'])
 for p,size,mt,ct in items:
  if not checkpoint(jid,'hashing'):break
  upd(jid,current_source=s['name'],current_path=p,message='Hashing file');sha,err=hash_one(p,jid,s['id']);now=time.time();fn=os.path.basename(p);ext=os.path.splitext(fn)[1].lower().lstrip('.')
  if sha:
   with LOCK,cx() as c:c.execute('INSERT OR REPLACE INTO placements(revision_id,source_id,path,filename,extension,created_time,modified_time,size,scanned_at,sha256,content_id,lifecycle,availability,last_verified) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',(rev,s['id'],p,fn,ext,ct,mt,size,now,sha,sha,'HASHED','AVAILABLE',now))
   j=getjob(jid);upd(jid,scanned_files=(j['scanned_files'] or 0)+1,scanned_bytes=(j['scanned_bytes'] or 0)+size)
  elif err!='stopped':
   j=getjob(jid);upd(jid,errors=(j['errors'] or 0)+1,skipped=(j['skipped'] or 0)+1)
 event('INFO','source.scan_complete','Hashing complete: '+s['name'],jid,s['id'])
def infer(jid,rev):
 upd(jid,state='inferring',message='Cross-referencing duplicates and planning',current_path='');event('INFO','inference.started','Inference started',jid)
 with cx() as c:rows=[dict(x) for x in c.execute('SELECT p.*,s.name source_name,s.role,s.failure_domain FROM placements p JOIN sources s ON s.id=p.source_id WHERE p.revision_id=?',(rev,))]
 groups={}
 for r in rows:groups.setdefault(r['sha256'],[]).append(r)
 ds=[];gs=[];ms=[];ub=de=rec=rb=rc=0
 for sha,g in groups.items():
  ub+=g[0]['size'];gid='dup-'+sha[:20]
  if len(g)>1:
   ex=(len(g)-1)*g[0]['size'];de+=ex;gs.append((gid,rev,sha,sha,len(g),g[0]['size'],len(g)*g[0]['size'],ex));ms += [(rev,gid,x['id']) for x in g]
  if len(g)==1:ds.append((g[0],'KEEP','Only observed placement'))
  else:
   cans=[x for x in g if x['role']=='canonical']
   if len(cans)!=1:
    for x in g:ds.append((x,'REVIEW','Duplicate group does not have exactly one explicit canonical placement'));rc+=1;rb+=x['size']
   else:
    can=cans[0];ds.append((can,'KEEP','Explicit canonical placement'));backs=[x for x in g if x['role']=='backup' and x['failure_domain']!=can['failure_domain']]
    if not backs:
     for x in g:
      if x['id']!=can['id']:ds.append((x,'REVIEW','No independent protection placement established'));rc+=1;rb+=x['size']
    else:
     prot=sorted(backs,key=lambda x:(x['failure_domain'],x['path']))[0];ds.append((prot,'PROTECT','Independent protection placement'))
     for x in g:
      if x['id'] not in (can['id'],prot['id']):ds.append((x,'REMOVE','Redundant after canonical and independent protection'));rec+=x['size']
 with LOCK,cx() as c:
  c.executemany('INSERT INTO duplicate_groups VALUES(?,?,?,?,?,?,?,?)',gs);c.executemany('INSERT INTO duplicate_members VALUES(?,?,?)',ms);c.executemany('INSERT INTO decisions(revision_id,placement_id,plan,rationale,disposition) VALUES(?,?,?,?,?)',[(rev,x['id'],d,w,'NONE') for x,d,w in ds]);c.execute("UPDATE placements SET lifecycle='COMPLETED' WHERE revision_id=?",(rev,))
 upd(jid,unique_count=len(groups),unique_bytes=ub,duplicate_groups=len(gs),duplicate_excess_bytes=de,review_count=rc,review_bytes=rb,reclaimable_bytes=rec);event('INFO','inference.complete','Inference and planning complete',jid,detail={'content_objects':len(groups),'duplicate_groups':len(gs),'reclaimable_bytes':rec,'review_count':rc})
def run(jid,rev):
 try:
  upd(jid,state='enumerating',started_at=time.time(),message='Enumerating storage',total_files=0,total_bytes=0,scanned_files=0,scanned_bytes=0);event('INFO','job.started','Analysis started',jid)
  with cx() as c:ss=[dict(x) for x in c.execute('SELECT * FROM sources WHERE enabled=1 ORDER BY id')]
  allf={}
  for s in ss:
   if not checkpoint(jid,'enumerating'):break
   allf[s['id']]=enumerate_source(s,jid)
  if not checkpoint(jid,'enumerating'):raise InterruptedError
  upd(jid,state='hashing',message='Hashing content',current_path='')
  with ThreadPoolExecutor(max_workers=min(8,max(1,len(ss)))) as ex:
   fs=[ex.submit(scan_source,s,jid,rev,allf.get(s['id'],[])) for s in ss]
   for f in as_completed(fs):f.result()
  if not checkpoint(jid,'hashing'):raise InterruptedError
  infer(jid,rev);upd(jid,state='complete',finished_at=time.time(),current_source='',current_path='',message='Complete')
  with LOCK,cx() as c:c.execute("UPDATE revisions SET state='complete' WHERE id=?",(rev,))
  event('INFO','job.complete','Analysis completed successfully',jid)
 except InterruptedError:upd(jid,state='stopped',finished_at=time.time(),message='Stopped');event('WARNING','job.stopped','Analysis stopped',jid)
 except Exception as e:
  j=getjob(jid) or {};upd(jid,state='failed',finished_at=time.time(),message=str(e),errors=(j.get('errors') or 0)+1);event('ERROR','job.failed','Analysis failed',jid,detail={'error':str(e),'trace':traceback.format_exc()})
 finally:
  with ALOCK:ACTIVE.pop(jid,None)
def start():
 jid=str(uuid.uuid4());now=time.time()
 with LOCK,cx() as c:
  rev=c.execute('INSERT INTO revisions(job_id,created_at,state) VALUES(?,?,?)',(jid,now,'active')).lastrowid;c.execute('INSERT INTO jobs(id,revision_id,state,created_at,message) VALUES(?,?,?,?,?)',(jid,rev,'queued',now,'Queued'))
 with ALOCK:ACTIVE[jid]={'pause':threading.Event(),'stop':threading.Event()}
 event('INFO','job.created','Analysis job created',jid);threading.Thread(target=run,args=(jid,rev),daemon=True).start();return jid
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
   if p=='/api/health':return send(self,{'ok':True,'version':'turn02-pre-base-v4.1','schema':4,'database':'sot-v4.db','time':time.time(),'active_jobs':len(ACTIVE)})
   if p=='/api/volumes':return send(self,volumes())
   if p=='/api/folders':return send(self,browse(q.get('path',[''])[0]))
   if p=='/api/sources':
    with cx() as c:return send(self,[dict(x) for x in c.execute('SELECT * FROM sources WHERE enabled=1 ORDER BY id')])
   if p=='/api/job':return send(self,latest() or {})
   if p=='/api/events':
    lim=min(1000,int(q.get('limit',['500'])[0]));sev=q.get('severity',[''])[0];term=q.get('q',[''])[0];sql='SELECT * FROM events WHERE 1=1';a=[]
    if sev:sql+=' AND severity=?';a.append(sev)
    if term:sql+=' AND (message LIKE ? OR event_type LIKE ? OR detail LIKE ?)';a += ['%'+term+'%']*3
    sql+=' ORDER BY id DESC LIMIT ?';a.append(lim)
    with cx() as c:return send(self,[dict(x) for x in c.execute(sql,a)])
   j=latest();rev=int(q.get('revision',[str(j['revision_id'] if j else 0)])[0])
   if p=='/api/database':
    term=q.get('q',[''])[0];sql='''SELECT p.*,s.name source,s.role,s.failure_domain,COALESCE(d.plan,'') plan,COALESCE(d.rationale,'') rationale,COALESCE(d.disposition,'NONE') disposition,COALESCE(g.id,'') duplicate_group,COALESCE(g.cardinality,1) cardinality FROM placements p JOIN sources s ON s.id=p.source_id LEFT JOIN decisions d ON d.revision_id=p.revision_id AND d.placement_id=p.id LEFT JOIN duplicate_members m ON m.revision_id=p.revision_id AND m.placement_id=p.id LEFT JOIN duplicate_groups g ON g.revision_id=m.revision_id AND g.id=m.group_id WHERE p.revision_id=?''';a=[rev]
    if term:sql+=' AND (p.filename LIKE ? OR p.path LIKE ? OR p.sha256 LIKE ? OR s.name LIKE ?)';a += ['%'+term+'%']*4
    sql+=' ORDER BY p.sha256,p.path LIMIT 3000'
    with cx() as c:return send(self,[dict(x) for x in c.execute(sql,a)])
   if p=='/api/groups':
    gid=q.get('id',[''])[0]
    with cx() as c:
     if gid:
      g=c.execute('SELECT * FROM duplicate_groups WHERE revision_id=? AND id=?',(rev,gid)).fetchone();ms=[dict(x) for x in c.execute('''SELECT p.*,s.name source,s.role,s.failure_domain,COALESCE(d.plan,'') plan,COALESCE(d.rationale,'') rationale FROM duplicate_members m JOIN placements p ON p.id=m.placement_id JOIN sources s ON s.id=p.source_id LEFT JOIN decisions d ON d.revision_id=p.revision_id AND d.placement_id=p.id WHERE m.revision_id=? AND m.group_id=? ORDER BY p.path''',(rev,gid))];return send(self,{'group':dict(g) if g else None,'placements':ms})
     return send(self,[dict(x) for x in c.execute('SELECT * FROM duplicate_groups WHERE revision_id=? ORDER BY cardinality DESC,excess_bytes DESC',(rev,))])
   if p=='/api/plan':
    with cx() as c:return send(self,[dict(x) for x in c.execute('''SELECT d.*,p.path,p.filename,p.size,p.sha256,s.name source FROM decisions d JOIN placements p ON p.id=d.placement_id JOIN sources s ON s.id=p.source_id WHERE d.revision_id=? ORDER BY d.plan,p.path''',(rev,))])
   send(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.get_failed',self.path,detail={'error':str(e)});send(self,{'error':str(e)},500)
 def do_POST(self):
  try:
   p=urlparse(self.path).path;b=body(self)
   if p=='/api/sources':
    path,root=allowed(b.get('path',''))
    if not root or not os.path.isdir(path):return send(self,{'error':'Folder is not on available readable storage'},400)
    role=b.get('role','source')
    with LOCK,cx() as c:
     try:sid=c.execute('INSERT INTO sources(name,path,role,failure_domain,created_at) VALUES(?,?,?,?,?)',(b.get('name') or os.path.basename(path) or path,path,role,b.get('failure_domain') or root,time.time())).lastrowid
     except sqlite3.IntegrityError:return send(self,{'error':'Storage source already registered'},409)
    event('INFO','source.added','Storage source added',source=sid if False else None,detail={'path':path,'role':role});return send(self,{'id':sid})
   if p=='/api/analyze':
    j=latest() or {}
    if j.get('state') in ('queued','enumerating','hashing','paused','inferring'):return send(self,{'error':'Analysis already active'},409)
    return send(self,{'job_id':start()})
   if p.startswith('/api/jobs/'):
    a=p.strip('/').split('/');jid=a[2];action=a[3];x=ctrl(jid)
    if action=='restart':
     if x:x['stop'].set()
     return send(self,{'job_id':start()})
    if not x:return send(self,{'error':'Job is not active'},409)
    if action=='pause':x['pause'].set();event('INFO','job.pause_requested','Pause requested',jid)
    elif action=='resume':x['pause'].clear();event('INFO','job.resume_requested','Resume requested',jid)
    elif action=='stop':x['stop'].set();event('WARNING','job.stop_requested','Stop requested',jid)
    else:return send(self,{'error':'Unknown action'},404)
    return send(self,{'ok':True})
   send(self,{'error':'not found'},404)
  except Exception as e:event('ERROR','api.post_failed',self.path,detail={'error':str(e)});send(self,{'error':str(e)},500)
init();event('INFO','backend.started','SOT v4.1 backend started',detail={'database':DB})
if __name__=='__main__':print('SOT v4.1 http://0.0.0.0:8765',flush=True);ThreadingHTTPServer(('0.0.0.0',8765),H).serve_forever()
