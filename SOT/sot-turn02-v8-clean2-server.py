#!/usr/bin/env python3
import importlib.util,json,os,sys,time
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
HERE=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location("sotclean2",HERE/"sot-turn02-v8-clean2-engine.py");m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
S=m.Store();M=m.Manager(S,workers=max(2,min(8,(os.cpu_count() or 4))),queue_capacity=128)
def latest():
 r=S.rows("SELECT job_id FROM jobs ORDER BY created DESC LIMIT 1");return M.snapshot(r[0]["job_id"]) if r else None
class H(BaseHTTPRequestHandler):
 def sendj(self,x,code=200):
  b=json.dumps(x,default=str).encode();self.send_response(code)
  for k,v in [("Content-Type","application/json"),("Access-Control-Allow-Origin","*"),("Access-Control-Allow-Headers","Content-Type"),("Access-Control-Allow-Methods","GET,POST,OPTIONS"),("Cache-Control","no-store")]:self.send_header(k,v)
  self.end_headers();self.wfile.write(b)
 def do_OPTIONS(self):self.sendj({})
 def body(self):
  n=int(self.headers.get("Content-Length","0"));return json.loads(self.rfile.read(n) or b"{}")
 def do_GET(self):
  try:
   from urllib.parse import urlparse,parse_qs
   u=urlparse(self.path);p=u.path
   if p=="/api/health":return self.sendj({"ok":S.ping(),"version":m.VERSION,"schema":m.SCHEMA,"time":time.time()})
   if p=="/api/job/latest":return self.sendj({"ok":True,"snapshot":latest()})
   if p=="/api/sources":return self.sendj({"ok":True,"sources":S.rows("SELECT * FROM sources ORDER BY estate,label")})
   if p=="/api/events":return self.sendj({"ok":True,"events":S.rows("SELECT * FROM events ORDER BY event_id DESC LIMIT 500")})
   if p=="/api/placements":return self.sendj({"ok":True,"placements":S.rows("SELECT * FROM placements ORDER BY scanned_at DESC LIMIT 5000")})
   if p=="/api/volumes":
    vols=[{"label":"WSL","path":"/"}]
    for base in ("/mnt","/media"):
     q=Path(base)
     if q.exists():
      for x in q.iterdir():
       if base=="/mnt" and x.name.lower() in ("wsl","wslg"):continue
       try:
        if x.is_dir() and os.path.ismount(x) and os.access(x,os.R_OK|os.X_OK):os.statvfs(x);vols.append({"label":x.name,"path":str(x)})
       except OSError:pass
    return self.sendj({"ok":True,"volumes":vols})
   if p=="/api/folders":
    root=Path(parse_qs(u.query).get("path",["/"])[0]).resolve();items=[]
    for x in root.iterdir():
     try:
      if x.is_dir() and not x.is_symlink():items.append({"name":x.name,"path":str(x.resolve())})
     except OSError:pass
    return self.sendj({"ok":True,"path":str(root),"folders":sorted(items,key=lambda z:z["name"].lower())})
   return self.sendj({"ok":False,"error":"not found"},404)
  except Exception as e:return self.sendj({"ok":False,"error":str(e)},500)
 def do_POST(self):
  try:
   p=self.path.split("?",1)[0];b=self.body()
   if p=="/api/sources":return self.sendj({"ok":True,"source_id":M.add_source(b["label"],b["root"],b.get("failure_domain",b["root"]),b.get("role","primary"),b.get("estate"))})
   if p=="/api/job/start":return self.sendj({"ok":True,"job_id":M.start(b.get("source_ids"))})
   if p.startswith("/api/job/") and p.rsplit("/",1)[-1] in ("pause","resume","stop"):
    z=latest()
    if not z:raise RuntimeError("no job")
    M.control(z["job"]["job_id"],p.rsplit("/",1)[-1]);return self.sendj({"ok":True})
   return self.sendj({"ok":False,"error":"not found"},404)
  except Exception as e:return self.sendj({"ok":False,"error":str(e)},400)
 def log_message(self,*a):pass
if __name__=="__main__":ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("SOT_PORT","8765"))),H).serve_forever()
