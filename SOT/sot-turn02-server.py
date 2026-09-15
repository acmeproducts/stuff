#!/usr/bin/env python3
# SOT Turn 02 clean-lineage backend v1
import hashlib,json,os,sqlite3,threading,time,uuid
from concurrent.futures import ThreadPoolExecutor
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from urllib.parse import urlparse
ROOT=os.path.expanduser('~/.sot-turn02'); DB=os.path.join(ROOT,'sot.db'); os.makedirs(ROOT,exist_ok=True)
LOCK=threading.Lock(); JOBS={}
def db():
 c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; c.executescript('''CREATE TABLE IF NOT EXISTS sources(id TEXT PRIMARY KEY,name TEXT,path TEXT UNIQUE,role TEXT,failure_domain TEXT,enabled INT DEFAULT 1);CREATE TABLE IF NOT EXISTS placements(source_id TEXT,path TEXT,size INT,mtime REAL,sha256 TEXT,available INT DEFAULT 1,PRIMARY KEY(source_id,path));CREATE TABLE IF NOT EXISTS decisions(sha256 TEXT,source_id TEXT,path TEXT,size INT,decision TEXT,reason TEXT,PRIMARY KEY(source_id,path));'''); return c
def scan_source(s):
 out=[]
 for root,dirs,files in os.walk(s['path']):
  dirs[:]=[d for d in dirs if not d.startswith('.sot')]
  for fn in files:
   p=os.path.join(root,fn)
   try:
    st=os.stat(p); h=hashlib.sha256()
    with open(p,'rb') as f:
     for b in iter(lambda:f.read(1024*1024),b''): h.update(b)
    out.append((s['id'],p,st.st_size,st.st_mtime,h.hexdigest(),1))
   except OSError: pass
 return out
def infer(c):
 rows=[dict(r) for r in c.execute('SELECT p.*,s.role,s.failure_domain FROM placements p JOIN sources s ON s.id=p.source_id WHERE s.enabled=1')]; groups={}
 for r in rows: groups.setdefault(r['sha256'],[]).append(r)
 c.execute('DELETE FROM decisions'); reclaim=0; counts={x:0 for x in ['KEEP','PROTECT','REMOVE','REVIEW']}
 for h,g in groups.items():
  canon=[x for x in g if x['role']=='canonical']
  assigned={}
  if len(g)==1: assigned[g[0]['path']]=('KEEP','unique content retained')
  elif len(canon)!=1:
   for x in g: assigned[x['path']]=('REVIEW','no unique canonical placement established')
  else:
   k=canon[0]; assigned[k['path']]=('KEEP','explicit canonical placement')
   backups=sorted([x for x in g if x['role']=='backup' and x['failure_domain']!=k['failure_domain']],key=lambda x:x['path'])
   if backups: assigned[backups[0]['path']]=('PROTECT','required independent protection placement')
   for x in g:
    if x['path'] not in assigned: assigned[x['path']]=(('REMOVE','verified redundant exact-content placement') if backups else ('REVIEW','no independent protection copy established'))
  for x in g:
   d,r=assigned[x['path']]; counts[d]+=1; reclaim += x['size'] if d=='REMOVE' else 0; c.execute('INSERT INTO decisions VALUES(?,?,?,?,?,?)',(h,x['source_id'],x['path'],x['size'],d,r))
 return {'contentObjects':len(groups),'placements':len(rows),'reclaimableBytes':reclaim,'counts':counts}
def run_job(jid):
 try:
  with db() as c:
   ss=[dict(r) for r in c.execute('SELECT * FROM sources WHERE enabled=1')]
  JOBS[jid].update(state='scanning',total=len(ss)); allp=[]
  with ThreadPoolExecutor(max_workers=min(8,max(1,len(ss)))) as ex:
   for n,rows in enumerate(ex.map(scan_source,ss),1): allp+=rows; JOBS[jid]['done']=n
  with db() as c:
   c.execute('DELETE FROM placements'); c.executemany('INSERT OR REPLACE INTO placements VALUES(?,?,?,?,?,?)',allp); summary=infer(c); c.commit()
  JOBS[jid].update(state='complete',summary=summary,finished=time.time())
 except Exception as e: JOBS[jid].update(state='failed',error=str(e))
class H(BaseHTTPRequestHandler):
 def end(self,code=200): self.send_response(code); self.send_header('Content-Type','application/json'); self.send_header('Access-Control-Allow-Origin','*'); self.send_header('Access-Control-Allow-Headers','Content-Type'); self.send_header('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); self.end_headers()
 def out(self,x,code=200): self.end(code); self.wfile.write(json.dumps(x).encode())
 def body(self):
  try:return json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))) or b'{}')
  except:return {}
 def do_OPTIONS(self): self.end(204)
 def do_GET(self):
  p=urlparse(self.path).path
  if p=='/api/health': return self.out({'ok':True,'version':'turn02-clean-1'})
  if p=='/api/sources':
   with db() as c:return self.out([dict(r) for r in c.execute('SELECT * FROM sources ORDER BY name')])
  if p=='/api/jobs': return self.out(list(JOBS.values()))
  if p=='/api/plan':
   with db() as c:
    ds=[dict(r) for r in c.execute('SELECT d.*,s.name source_name,s.role,s.failure_domain FROM decisions d JOIN sources s ON s.id=d.source_id ORDER BY d.decision,d.path')]; rows=[dict(r) for r in c.execute('SELECT sha256,size FROM placements')]
   return self.out({'summary':{'placements':len(rows),'contentObjects':len(set(x['sha256'] for x in rows)),'observedBytes':sum(x['size'] for x in rows),'reclaimableBytes':sum(x['size'] for x in ds if x['decision']=='REMOVE'),'counts':{k:sum(1 for x in ds if x['decision']==k) for k in ['KEEP','PROTECT','REMOVE','REVIEW']}},'decisions':ds})
  self.out({'error':'not found'},404)
 def do_POST(self):
  p=urlparse(self.path).path; b=self.body()
  if p=='/api/sources':
   path=os.path.realpath(os.path.expanduser(b.get('path','')))
   if not os.path.isdir(path): return self.out({'error':'folder not found/readable'},400)
   sid=str(uuid.uuid4()); role=b.get('role','source'); fd=b.get('failure_domain') or path.split(os.sep)[1] if os.sep in path else path
   try:
    with db() as c:c.execute('INSERT INTO sources(id,name,path,role,failure_domain) VALUES(?,?,?,?,?)',(sid,b.get('name') or os.path.basename(path) or path,path,role,fd)); c.commit()
   except sqlite3.IntegrityError:return self.out({'error':'source already registered'},409)
   return self.out({'id':sid,'path':path,'role':role})
  if p=='/api/analyze':
   if any(j.get('state') in ('queued','scanning') for j in JOBS.values()): return self.out({'error':'analysis already running'},409)
   jid=str(uuid.uuid4()); JOBS[jid]={'id':jid,'state':'queued','created':time.time(),'done':0,'total':0}; threading.Thread(target=run_job,args=(jid,),daemon=True).start(); return self.out(JOBS[jid])
  self.out({'error':'not found'},404)
 def do_DELETE(self):
  p=urlparse(self.path).path
  if p.startswith('/api/sources/'):
   sid=p.rsplit('/',1)[-1]
   with db() as c:c.execute('DELETE FROM sources WHERE id=?',(sid,)); c.execute('DELETE FROM placements WHERE source_id=?',(sid,)); c.execute('DELETE FROM decisions WHERE source_id=?',(sid,)); c.commit()
   return self.out({'ok':True})
  self.out({'error':'not found'},404)
 def log_message(self,*a): pass
if __name__=='__main__':
 print('SOT Turn 02 backend http://0.0.0.0:8765',flush=True); ThreadingHTTPServer(('0.0.0.0',8765),H).serve_forever()
