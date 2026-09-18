#!/usr/bin/env python3
import importlib.util,json,mimetypes,os,sys,time
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
HERE=Path(__file__).resolve().parent;spec=importlib.util.spec_from_file_location('sotv5',HERE/'sot-turn02-v8-engine.py');m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
S=m.Store();M=m.Manager(S,workers=max(2,min(8,(os.cpu_count() or 4))),queue_capacity=128)
API_VERSION='turn02-pre-base-v8'
def latest():
 r=S.rows('SELECT job_id FROM jobs ORDER BY created DESC LIMIT 1');return M.snapshot(r[0]['job_id']) if r else None
class H(BaseHTTPRequestHandler):
 def _send(self,x,code=200):
  b=json.dumps(x,default=str).encode();self.send_response(code);self.send_header('Content-Type','application/json');self.send_header('Access-Control-Allow-Origin','*');self.send_header('Access-Control-Allow-Headers','Content-Type');self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS');self.send_header('Cache-Control','no-store');self.end_headers();self.wfile.write(b)
 def do_OPTIONS(self):self._send({})
 def body(self):
  n=int(self.headers.get('Content-Length','0'));return json.loads(self.rfile.read(n) or b'{}')
 def do_GET(self):
  try:
   p=self.path.split('?',1)[0]
   if p=='/api/health':return self._send({'ok':True,'version':API_VERSION,'schema':m.SCHEMA,'time':time.time(),'active_jobs':len(M.runtime)})
   if p=='/api/job/latest':return self._send({'ok':True,'snapshot':latest()})
   if p=='/api/sources':return self._send({'ok':True,'sources':S.rows('SELECT * FROM sources ORDER BY estate,label')})
   if p=='/api/events':return self._send({'ok':True,'events':S.rows('SELECT * FROM events ORDER BY event_id DESC LIMIT 500')})
   if p=='/api/placements':return self._send({'ok':True,'placements':S.rows('SELECT * FROM placements ORDER BY scanned_at DESC LIMIT 5000')})
   if p=='/api/volumes':
    vols=[{'label':'WSL','path':'/'}]
    for base in ('/mnt','/media'):
     q=Path(base)
     if q.exists():
      for x in q.iterdir():
       if x.is_dir() and os.path.ismount(x) and os.access(x,os.R_OK|os.X_OK):
        try:
         os.statvfs(x); next(os.scandir(x),None); vols.append({'label':x.name,'path':str(x)})
        except OSError: pass
    return self._send({'ok':True,'volumes':vols})
   if p.startswith('/api/folders'):
    from urllib.parse import urlparse,parse_qs
    q=parse_qs(urlparse(self.path).query);root=Path(q.get('path',['/'])[0]).resolve();items=[]; registered=S.rows('SELECT estate,root FROM sources WHERE enabled=1')
    for x in root.iterdir():
     if x.is_dir() and not x.is_symlink():
      xp=str(x.resolve()); overlaps=[r for r in registered if os.path.commonpath([xp,r['root']]) in (xp,r['root'])];items.append({'name':x.name,'path':xp,'registered':bool(overlaps),'estate':overlaps[0]['estate'] if overlaps else None})
    return self._send({'ok':True,'path':str(root),'folders':sorted(items,key=lambda z:z['name'].lower())})
   self._send({'ok':False,'error':'not found'},404)
  except Exception as e:S.event('ERROR','api_get_error',None,None,str(e),{'path':self.path});self._send({'ok':False,'error':str(e)},500)
 def do_POST(self):
  try:
   p=self.path.split('?',1)[0];b=self.body()
   if p=='/api/sources':
    sid=M.add_source(b['label'],b['root'],b.get('failure_domain',b['root']),b.get('role','primary'),b.get('estate'));return self._send({'ok':True,'source_id':sid})
   if p=='/api/job/start':return self._send({'ok':True,'job_id':M.start(b.get('source_ids'))})
   if p=='/api/job/continue':return self._send({'ok':True,'job_id':M.continue_job(b.get('job_id'))})
   if p.startswith('/api/job/') and p.rsplit('/',1)[-1] in ('pause','resume','stop'):
    snap=latest();
    if not snap:raise RuntimeError('no job')
    a=p.rsplit('/',1)[-1];M.control(snap['job']['job_id'],a);return self._send({'ok':True})
   self._send({'ok':False,'error':'not found'},404)
  except Exception as e:S.event('ERROR','api_post_error',None,None,str(e),{'path':self.path});self._send({'ok':False,'error':str(e)},400)
 def log_message(self,fmt,*args):pass
if __name__=='__main__':ThreadingHTTPServer(('0.0.0.0',int(os.environ.get('SOT_PORT','8765'))),H).serve_forever()
