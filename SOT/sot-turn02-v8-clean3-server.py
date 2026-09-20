#!/usr/bin/env python3
import importlib.util,json,os,sys,time,mimetypes,subprocess
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
HERE=Path(__file__).resolve().parent;sp=importlib.util.spec_from_file_location("sotclean3",HERE/"sot-turn02-v8-clean3-engine.py");m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m)
S=m.Store();M=m.Manager(S,workers=max(2,min(8,os.cpu_count() or 4)),queue_capacity=128)
TARGET_FILE=Path.home()/".sot-turn02"/"target.json"
CREATION_REV_FILE=Path.home()/".sot-turn02"/"creation-revision.json"
def creation_revision():
 try:return json.loads(CREATION_REV_FILE.read_text()).get("revision",0)
 except Exception:return 0
def bump_creation_revision():
 r=int(time.time()*1000);CREATION_REV_FILE.parent.mkdir(parents=True,exist_ok=True);tmp=CREATION_REV_FILE.with_suffix(".tmp");tmp.write_text(json.dumps({"revision":r}));tmp.replace(CREATION_REV_FILE);return r
def volume_roots():
 out=[Path("/").resolve()]
 for base in ("/mnt","/media"):
  q=Path(base)
  if q.exists():
   for z in q.iterdir():
    if base=="/mnt" and z.name.lower() in ("wsl","wslg"):continue
    try:
     if z.is_dir() and os.path.ismount(z) and os.access(z,os.R_OK|os.W_OK|os.X_OK):out.append(z.resolve())
    except OSError:pass
 return out
def target_get():
 try:
  z=json.loads(TARGET_FILE.read_text());p=Path(z["path"]).resolve()
  if not p.is_dir():return {"configured":True,"path":str(p),"label":z.get("label",p.name or str(p)),"available":False}
  st=os.statvfs(p);return {"configured":True,"path":str(p),"label":z.get("label",p.name or str(p)),"configured_at":z.get("configured_at"),"available":os.access(p,os.R_OK|os.W_OK|os.X_OK),"registered_free_bytes":z.get("registered_free_bytes"),"registered_total_bytes":z.get("registered_total_bytes"),"free_bytes":st.f_bavail*st.f_frsize,"total_bytes":st.f_blocks*st.f_frsize}
 except Exception:return {"configured":False}
def target_set(path,label=""):
 p=Path(path).resolve()
 if not p.is_dir():raise RuntimeError("TARGET folder does not exist")
 roots=volume_roots()
 if not any(p==r or str(p).startswith(str(r).rstrip("/")+"/") for r in roots):raise RuntimeError("TARGET is not on an available volume")
 if not os.access(p,os.R_OK|os.W_OK|os.X_OK):raise RuntimeError("TARGET requires read/write access")
 for z in S.rows("SELECT root FROM sources"):
  r=Path(z["root"]).resolve()
  if p==r or str(p).startswith(str(r).rstrip("/")+"/") or str(r).startswith(str(p).rstrip("/")+"/"):raise RuntimeError("TARGET must not overlap a registered SOURCE Estate root")
 st=os.statvfs(p);free_bytes=st.f_bavail*st.f_frsize;total_bytes=st.f_blocks*st.f_frsize;cfg={"path":str(p),"label":label or p.name or str(p),"configured_at":time.time(),"registered_free_bytes":free_bytes,"registered_total_bytes":total_bytes};TARGET_FILE.parent.mkdir(parents=True,exist_ok=True);tmp=TARGET_FILE.with_suffix(".tmp");tmp.write_text(json.dumps(cfg));tmp.replace(TARGET_FILE)
 M.event("target_configured","TARGET configured: "+str(p),None,None,"INFO",{"path":str(p),"registered_free_bytes":free_bytes,"registered_total_bytes":total_bytes})
 return {**cfg,"configured":True,"available":True,"free_bytes":free_bytes,"total_bytes":total_bytes}
def creation_backfill():
 rows=S.rows("SELECT placement_id,path FROM placements WHERE created IS NULL AND availability='AVAILABLE' AND path LIKE '/mnt/%'")
 if not rows:return {"eligible":0,"attempted":0,"updated":0,"unavailable":0,"conversion_failed":0,"lookup_failed":0,"revision":creation_revision(),"failures":[]}
 ps="/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe";payload=[];pids=[];srcpaths=[];failures=[];conversion_failed=0
 for r in rows:
  try:
   wp=subprocess.check_output(["wslpath","-w",r["path"]],text=True,timeout=2).strip();payload.append(wp);pids.append(r["placement_id"]);srcpaths.append(r["path"])
  except Exception as e:
   conversion_failed+=1
   if len(failures)<100:failures.append({"path":r["path"],"stage":"wslpath","error":str(e)[:240]})
 script="$raw=[Console]::In.ReadToEnd(); $lines=$raw -split '\\r?\\n'; for($n=0;$n -lt $lines.Length;$n++){ if([string]::IsNullOrWhiteSpace($lines[$n])){continue}; try{$i=Get-Item -LiteralPath $lines[$n] -ErrorAction Stop; [Console]::Out.WriteLine(('{0}{1}{2}{1}' -f $n,[char]9,$i.CreationTimeUtc.ToString('o')))}catch{[Console]::Out.WriteLine(('{0}{1}{1}{2}' -f $n,[char]9,$_.Exception.Message.Replace([Environment]::NewLine,' ')))}}"
 out=subprocess.run([ps,"-NoProfile","-Command",script],input="\n".join(payload),text=True,capture_output=True,timeout=max(30,min(1800,len(payload)//10+30)))
 if out.returncode!=0:raise RuntimeError("Creation-time backfill failed: "+out.stderr.strip()[:500])
 import datetime
 updated=0;lookup_failed=0;seen=set()
 for line in out.stdout.splitlines():
  parts=line.split("\t",2)
  try:idx=int(parts[0])
  except Exception:continue
  if idx<0 or idx>=len(pids):continue
  seen.add(idx);iso=parts[1].strip() if len(parts)>1 else "";err=parts[2].strip() if len(parts)>2 else ""
  if not iso:
   lookup_failed+=1
   if len(failures)<100:failures.append({"path":srcpaths[idx],"stage":"Get-Item","error":err or "no CreationTime returned"})
   continue
  try:
   ts=datetime.datetime.fromisoformat(iso.replace("Z","+00:00")).timestamp();S.submit("UPDATE placements SET created=? WHERE placement_id=? AND created IS NULL",(ts,pids[idx]));updated+=1
  except Exception as e:
   lookup_failed+=1
   if len(failures)<100:failures.append({"path":srcpaths[idx],"stage":"parse/update","error":str(e)[:240]})
 missing=max(0,len(payload)-len(seen));lookup_failed+=missing
 S.drain(60);rev=bump_creation_revision() if updated else creation_revision();unavailable=len(rows)-updated
 M.event("creation_backfill","Creation timestamps backfilled",None,None,"INFO",{"eligible":len(rows),"attempted":len(payload),"updated":updated,"unavailable":unavailable,"conversion_failed":conversion_failed,"lookup_failed":lookup_failed,"revision":rev,"failure_samples":failures[:20]})
 return {"eligible":len(rows),"attempted":len(payload),"updated":updated,"unavailable":unavailable,"conversion_failed":conversion_failed,"lookup_failed":lookup_failed,"revision":rev,"failures":failures[:100]}

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
  from urllib.parse import urlparse,parse_qs
  try:
   u=urlparse(self.path);p=u.path
   if p=="/api/health":
    return self.sendj({"ok":True,"version":m.VERSION,"schema":m.SCHEMA,"process":"healthy","db":S.db_probe(.10),"writer_queue":S.q.qsize(),"writer_error":S.writer_error,"creation_revision":creation_revision(),"time":time.time()})
   if p=="/api/job/latest":return self.sendj({"ok":True,"snapshot":latest()})
   if p=="/api/sources":return self.sendj({"ok":True,"sources":S.rows("SELECT * FROM sources ORDER BY estate,label")})
   if p=="/api/events":return self.sendj({"ok":True,"events":S.rows("SELECT * FROM events ORDER BY event_id DESC LIMIT 500")})
   if p=="/api/target":return self.sendj({"ok":True,"target":target_get()})
   if p=="/api/placements":return self.sendj({"ok":True,"placements":S.rows("SELECT * FROM placements ORDER BY scanned_at DESC LIMIT 5000")})
   if p=="/api/file/info":
    pid=parse_qs(u.query).get("id",[""])[0];r=S.rows("SELECT placement_id,path,filename,size,availability FROM placements WHERE placement_id=?",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    z=r[0];fp=Path(z["path"]).resolve()
    if z["availability"]!="AVAILABLE" or not fp.is_file():return self.sendj({"ok":False,"error":"file unavailable"},404)
    mime=mimetypes.guess_type(str(fp))[0] or "application/octet-stream";ext=fp.suffix.lower()
    preview="image" if mime.startswith("image/") else "video" if mime.startswith("video/") else "text" if ext in (".txt",".md",".markdown") or mime.startswith("text/plain") else "frame" if ext in (".pdf",".html",".htm") else "none"
    return self.sendj({"ok":True,"placement_id":pid,"filename":z["filename"],"size":z["size"],"mime":mime,"preview":preview})
   if p=="/api/file/content":
    pid=parse_qs(u.query).get("id",[""])[0];r=S.rows("SELECT path,availability FROM placements WHERE placement_id=?",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    fp=Path(r[0]["path"]).resolve()
    if r[0]["availability"]!="AVAILABLE" or not fp.is_file():return self.sendj({"ok":False,"error":"file unavailable"},404)
    mime=mimetypes.guess_type(str(fp))[0] or "application/octet-stream";size=fp.stat().st_size;start=0;end=size-1;status=200
    rh=self.headers.get("Range")
    if rh and rh.startswith("bytes="):
     a,b=rh[6:].split("-",1);start=int(a or 0);end=min(int(b) if b else end,end);status=206
    length=end-start+1;self.send_response(status);self.send_header("Content-Type",mime);self.send_header("Accept-Ranges","bytes");self.send_header("Content-Length",str(length));self.send_header("Content-Disposition","inline");self.send_header("Access-Control-Allow-Origin","*");self.send_header("Cache-Control","no-store")
    if status==206:self.send_header("Content-Range",f"bytes {start}-{end}/{size}")
    self.end_headers()
    with fp.open("rb") as f:
     f.seek(start);left=length
     while left:
      chunk=f.read(min(1048576,left))
      if not chunk:break
      self.wfile.write(chunk);left-=len(chunk)
    return
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
   if p=="/api/target":return self.sendj({"ok":True,"target":target_set(b["path"],b.get("label",""))})
   if p=="/api/creation/backfill":return self.sendj({"ok":True,"result":creation_backfill()})
   if p=="/api/folders/create":
    parent=Path(b["parent"]).resolve();name=str(b["name"]).strip()
    if not name or name in (".","..") or "/" in name or "\\" in name:raise RuntimeError("Invalid folder name")
    if not any(parent==r or str(parent).startswith(str(r).rstrip("/")+"/") for r in volume_roots()):raise RuntimeError("Parent is not on an available volume")
    child=parent/name;child.mkdir(exist_ok=False);return self.sendj({"ok":True,"folder":{"name":child.name,"path":str(child.resolve())}})
   if p=="/api/job/start":return self.sendj({"ok":True,"job_id":M.start(b.get("source_ids"))})
   if p=="/api/file/delete":
    pid=b.get("id","");mode=b.get("mode","trash");r=S.rows("SELECT placement_id,path,filename,availability FROM placements WHERE placement_id=?",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    z=r[0];fp=Path(z["path"]).resolve()
    if z["availability"]!="AVAILABLE" or not fp.is_file():return self.sendj({"ok":False,"error":"file unavailable"},404)
    trashed=False
    if mode=="trash":
     try:
      if "microsoft" in os.uname().release.lower() and str(fp).startswith("/mnt/"):
       wp=subprocess.check_output(["wslpath","-w",str(fp)],text=True).strip();ps="/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
       cmd="Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($args[0],'OnlyErrorDialogs','SendToRecycleBin')"
       subprocess.check_call([ps,"-NoProfile","-Command",cmd,wp],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);trashed=True
      elif subprocess.call(["sh","-lc","command -v gio >/dev/null 2>&1"])==0:
       subprocess.check_call(["gio","trash",str(fp)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL);trashed=True
     except Exception:trashed=False
     if not trashed:return self.sendj({"ok":True,"needs_permanent":True})
    elif mode=="permanent":fp.unlink()
    else:return self.sendj({"ok":False,"error":"bad delete mode"},400)
    S.submit("DELETE FROM placements WHERE placement_id=?",(pid,),True);M.event("placement_deleted",("Moved to trash: " if mode=="trash" else "Permanently deleted: ")+z["filename"],None,None,"INFO",{"placement_id":pid,"mode":mode})
    return self.sendj({"ok":True,"message":"Moved to trash and removed from SOT" if mode=="trash" else "Permanently deleted and removed from SOT"})
   if p=="/api/file/open":
    pid=b.get("id","");r=S.rows("SELECT path,availability FROM placements WHERE placement_id=?",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    fp=Path(r[0]["path"]).resolve()
    if r[0]["availability"]!="AVAILABLE" or not fp.is_file():return self.sendj({"ok":False,"error":"file unavailable"},404)
    if os.name=="nt":os.startfile(str(fp))
    elif "microsoft" in os.uname().release.lower():
     wp=subprocess.check_output(["wslpath","-w",str(fp)],text=True).strip()
     subprocess.Popen(["/mnt/c/Windows/System32/cmd.exe","/c","start","",wp],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    else:subprocess.Popen(["xdg-open",str(fp)],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    return self.sendj({"ok":True,"message":"Open requested"})
   if p.startswith("/api/job/") and p.rsplit("/",1)[-1] in ("pause","resume","stop"):
    z=latest()
    if not z:raise RuntimeError("no job")
    M.control(z["job"]["job_id"],p.rsplit("/",1)[-1]);return self.sendj({"ok":True})
   return self.sendj({"ok":False,"error":"not found"},404)
  except Exception as e:return self.sendj({"ok":False,"error":str(e)},400)
 def log_message(self,*a):pass
if __name__=="__main__":ThreadingHTTPServer(("0.0.0.0",int(os.environ.get("SOT_PORT","8765"))),H).serve_forever()
