#!/usr/bin/env python3
import importlib.util,json,os,sys,time,mimetypes,subprocess,hashlib,shutil,uuid,re,threading,fnmatch
from http.server import ThreadingHTTPServer,BaseHTTPRequestHandler
from pathlib import Path
HERE=Path(__file__).resolve().parent;sp=importlib.util.spec_from_file_location("sotreleasec",HERE/"sot-turn02-release-c-engine.py");m=importlib.util.module_from_spec(sp);sys.modules[sp.name]=m;sp.loader.exec_module(m)
S=m.Store();M=m.Manager(S,workers=max(2,min(8,os.cpu_count() or 4)),queue_capacity=128)
asp=importlib.util.spec_from_file_location("sotreleasecai",HERE/"sot-turn02-release-c-ai.py");ai_mod=importlib.util.module_from_spec(asp);sys.modules[asp.name]=ai_mod;asp.loader.exec_module(ai_mod)
AI=None
TARGET_FILE=Path.home()/".sot-turn02"/"target.json"
CREATION_REV_FILE=Path.home()/".sot-turn02"/"creation-revision.json"
def creation_revision():
 try:return json.loads(CREATION_REV_FILE.read_text()).get("revision",0)
 except Exception:return 0
def bump_creation_revision():
 r=int(time.time()*1000);CREATION_REV_FILE.parent.mkdir(parents=True,exist_ok=True);tmp=CREATION_REV_FILE.with_suffix(".tmp");tmp.write_text(json.dumps({"revision":r}));tmp.replace(CREATION_REV_FILE);return r
MOUNT_HELPER="/usr/local/sbin/sot-mount-drive"
MOUNT_RETRY_SECONDS=20
MOUNT_STATE={}
MOUNT_LOCK=threading.RLock()

def normalize_mount_source(v):
 raw=str(v or "").strip()
 suffixes=(chr(92)+"x5c",chr(92)+"x2f",chr(92),"/")
 changed=True
 while changed:
  changed=False
  for suffix in suffixes:
   if raw.lower().endswith(suffix.lower()):
    raw=raw[:-len(suffix)];changed=True;break
 return raw.upper()

def mount_info(root):
 try:
  z=subprocess.run(["findmnt","-rn","-M",str(root),"-o","TARGET,FSTYPE,SOURCE"],text=True,capture_output=True,timeout=5)
  if z.returncode!=0 or not z.stdout.strip():return None
  parts=z.stdout.strip().split(None,2)
  if len(parts)<3:return None
  return {"target":parts[0],"fstype":parts[1].lower(),"source":parts[2]}
 except Exception:return None

def verified_windows_mount(letter):
 letter=str(letter or "").strip().lower()
 if not re.match(r"^[a-z]$",letter):return False,{"error":"invalid Windows drive"}
 root="/mnt/"+letter;mi=mount_info(root);expected=(letter+":").upper()
 if not mi:return False,{"root":root,"error":"not mounted"}
 if mi["target"]!=root:return False,{"root":root,"mount":mi,"error":"mount target mismatch"}
 if mi["fstype"] not in ("9p","drvfs"):return False,{"root":root,"mount":mi,"error":"not a Windows-backed WSL mount"}
 if normalize_mount_source(mi["source"])!=expected:return False,{"root":root,"mount":mi,"error":"mount source mismatch"}
 try:
  p=Path(root)
  if not p.is_dir() or not os.access(p,os.R_OK|os.X_OK):return False,{"root":root,"mount":mi,"error":"mount is not readable"}
  next(p.iterdir(),None)
  return True,{"root":root,"mount":mi}
 except Exception as e:return False,{"root":root,"mount":mi,"error":"mount unreadable: "+str(e)}

def windows_logical_drives():
 if "microsoft" not in os.uname().release.lower():return []
 ps=Path("/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe")
 if not ps.exists():return []
 script="$ErrorActionPreference='Stop'; Get-CimInstance Win32_LogicalDisk | Select-Object DeviceID,VolumeName,DriveType,ProviderName,FreeSpace,Size,VolumeSerialNumber | ConvertTo-Json -Compress"
 try:
  r=subprocess.run([str(ps),"-NoProfile","-Command",script],text=True,capture_output=True,timeout=15)
  if r.returncode!=0:return []
  z=json.loads(r.stdout or "[]")
  if isinstance(z,dict):z=[z]
  out=[];types={2:"removable",3:"fixed",4:"network",5:"optical",6:"ramdisk"}
  for d in z:
   dev=str(d.get("DeviceID") or "").strip()
   if not re.match(r"^[A-Za-z]:$",dev):continue
   letter=dev[0].lower();ok,detail=verified_windows_mount(letter);label=d.get("VolumeName") if isinstance(d.get("VolumeName"),str) else ""
   out.append({"label":label.strip() or dev,"windows":True,"windows_drive":dev,"windows_path":dev+"\\","path":"/mnt/"+letter,
               "mounted":bool(ok),"available":bool(ok),"mount_error":None if ok else detail.get("error"),
               "drive_type":types.get(int(d.get("DriveType") or 0),"unknown"),"provider":d.get("ProviderName"),
               "volume_serial":d.get("VolumeSerialNumber"),"stable_volume_id":str(d.get("VolumeSerialNumber") or d.get("ProviderName") or dev),
               "free_bytes":d.get("FreeSpace"),"total_bytes":d.get("Size")})
  return out
 except Exception:return []

def ensure_windows_drive_mounted(letter,force=False):
 letter=str(letter or "").strip().lower()
 if not re.match(r"^[a-z]$",letter):return {"ok":False,"error":"invalid Windows drive"}
 ok,detail=verified_windows_mount(letter)
 if ok:return {"ok":True,**detail}
 inventory={str(v.get("windows_drive",""))[:1].lower():v for v in windows_logical_drives()}
 if letter not in inventory:return {"ok":False,"root":"/mnt/"+letter,"error":letter.upper()+": is not currently available in Windows"}
 now=time.time()
 with MOUNT_LOCK:
  prev=MOUNT_STATE.get(letter)
  if not force and prev and not prev.get("ok") and now-float(prev.get("at",0))<MOUNT_RETRY_SECONDS:return dict(prev)
  try:
   z=subprocess.run(["sudo","-n",MOUNT_HELPER,letter.upper()],text=True,capture_output=True,timeout=25)
   if z.returncode!=0:
    result={"ok":False,"root":"/mnt/"+letter,"error":(z.stderr or z.stdout or "mount helper failed").strip()[:600],"at":now}
   else:
    good,check=verified_windows_mount(letter)
    result={"ok":bool(good),"root":"/mnt/"+letter,"error":None if good else check.get("error","mount verification failed"),"mount":check.get("mount"),"at":now}
  except Exception as e:result={"ok":False,"root":"/mnt/"+letter,"error":str(e)[:600],"at":now}
  MOUNT_STATE[letter]=result
  return dict(result)

def windows_letter_for_path(path):
 m=re.match(r"^/mnt/([A-Za-z])(?:/|$)",str(path))
 return m.group(1).lower() if m else None

def reconcile_windows_path(path,require_write=False):
 raw=str(path);letter=windows_letter_for_path(raw)
 if not letter:return str(Path(raw).resolve())
 z=ensure_windows_drive_mounted(letter)
 if not z.get("ok"):raise RuntimeError(z.get("error") or (letter.upper()+": unavailable"))
 p=Path(raw).resolve()
 mode=os.R_OK|os.X_OK|(os.W_OK if require_write else 0)
 if not os.access(p,mode):raise RuntimeError(str(p)+" is not accessible with required permissions")
 return str(p)

def reconcile_sources(source_ids=None):
 rows=S.rows("SELECT source_id,root FROM sources WHERE enabled=1 ORDER BY source_id")
 if source_ids:rows=[r for r in rows if r["source_id"] in source_ids]
 for r in rows:reconcile_windows_path(r["root"],False)
 return rows
def reconcile_ai_scope(scope):
 scope=dict(scope or {})
 if scope.get("type")=="compare_converted_files":
  roots=[];seen=set()
  for raw in scope.get("roots",[]):
   raw=str(raw or "").strip()
   if not raw:continue
   p=reconcile_windows_path(raw,False)
   if p not in seen:seen.add(p);roots.append(p)
  scope={"type":"compare_converted_files","roots":roots}
 return scope

def folder_search_tokens(raw):
 raw=str(raw or "").strip()
 if not raw:return []
 parts=re.findall(r'(?:[^\s"]+:"[^"]*"|"[^"]*"|[^\s]+)',raw)
 out=[]
 for token in parts:
  token=token.strip()
  if not token:continue
  neg=token.startswith("-")
  if neg:token=token[1:]
  if token.startswith("#"):token=token[1:]
  k=token.find(":");field=None
  if k>0 and token[:k].lower() in ("folder","file"):
   field=token[:k].lower();value=token[k+1:]
  else:value=token
  value=value.strip('"')
  if value:out.append({"negative":neg,"field":field,"value":value})
 return out

def folder_search_match(value,pattern):
 value=str(value or "");pattern=str(pattern or "")
 if "*" in pattern or "?" in pattern:return fnmatch.fnmatch(value.lower(),pattern.lower())
 return pattern.lower() in value.lower()

def folder_search(root,query,exclude=None,limit=500):
 root=Path(reconcile_windows_path(root,False)).resolve()
 if not root.is_dir():raise RuntimeError("Folder Search root is not a directory")
 terms=folder_search_tokens(query)
 if not terms:raise RuntimeError("Folder Search query required")
 excluded={str(Path(x).resolve()) for x in (exclude or []) if str(x or "").strip()}
 limit=max(1,min(2000,int(limit or 500)));results=[];seen=set();scanned_folders=0;scanned_files=0;truncated=False
 for current,dirs,files in os.walk(root):
  dirs[:]=[d for d in dirs if not Path(current,d).is_symlink()]
  scanned_folders+=1;scanned_files+=len(files)
  folder_path=str(Path(current).resolve());folder_name=Path(current).name
  def hit(term):
   field=term["field"];pat=term["value"]
   if field=="folder":return folder_search_match(folder_path,pat) or folder_search_match(folder_name,pat)
   if field=="file":return any(folder_search_match(name,pat) for name in files)
   return folder_search_match(folder_path,pat) or folder_search_match(folder_name,pat) or any(folder_search_match(name,pat) for name in files)
  positives=[t for t in terms if not t["negative"]];negatives=[t for t in terms if t["negative"]]
  matched=(all(hit(t) for t in positives) if positives else True) and not any(hit(t) for t in negatives)
  if matched and folder_path not in excluded and folder_path not in seen:
   seen.add(folder_path);results.append({"path":folder_path,"name":folder_name or folder_path})
   if len(results)>=limit:truncated=True;break
 return {"root":str(root),"query":str(query),"results":sorted(results,key=lambda z:z["path"].lower()),"count":len(results),"truncated":truncated,"scanned_folders":scanned_folders,"scanned_files":scanned_files}

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
  z=json.loads(TARGET_FILE.read_text());reconcile_windows_path(z["path"],False);p=Path(z["path"]).resolve()
  if not p.is_dir():return {"configured":True,"path":str(p),"label":z.get("label",p.name or str(p)),"available":False}
  st=os.statvfs(p);return {"configured":True,"path":str(p),"label":z.get("label",p.name or str(p)),"configured_at":z.get("configured_at"),"available":os.access(p,os.R_OK|os.W_OK|os.X_OK),"registered_free_bytes":z.get("registered_free_bytes"),"registered_total_bytes":z.get("registered_total_bytes"),"free_bytes":st.f_bavail*st.f_frsize,"total_bytes":st.f_blocks*st.f_frsize}
 except Exception:return {"configured":False}
def target_set(path,label=""):
 path=reconcile_windows_path(path,True);p=Path(path).resolve()
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

def catalog_revision():return S.catalog_revision()
def stable_pid(source_id,path):return hashlib.sha256((source_id+"\0"+str(path)).encode()).hexdigest()
def active_rows(ids):
 ids=[str(x) for x in ids if x]
 if not ids:return []
 q=",".join("?" for _ in ids);rows=S.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' AND placement_id IN ("+q+")",tuple(ids));by={r["placement_id"]:r for r in rows}
 return [by[x] for x in ids if x in by]
def destination_source(path):
 p=Path(path).resolve();best=None
 for z in S.rows("SELECT * FROM sources WHERE enabled=1"):
  r=Path(z["root"]).resolve()
  if p==r or str(p).startswith(str(r).rstrip("/")+"/"):
   if best is None or len(str(r))>len(str(Path(best["root"]).resolve())):best=z
 return best
def sha256_file(path):
 h=hashlib.sha256()
 with Path(path).open("rb") as f:
  while True:
   b=f.read(1024*1024)
   if not b:break
   h.update(b)
 return h.hexdigest()
def normalize_tag(x):
 x=str(x or "").strip().lower()
 if not x:return ""
 if not x.startswith("#"):x="#"+x
 return x
def parse_tags(v):
 try:
  z=json.loads(v or "[]");return [str(x) for x in z if str(x).strip()] if isinstance(z,list) else []
 except Exception:return []
def plan_summary():
 rows=S.rows("SELECT placement_id,size,system_classification FROM placements WHERE placement_state='ACTIVE' AND availability='AVAILABLE' AND fingerprint IS NOT NULL")
 def agg(cls):
  a=[r for r in rows if r["system_classification"]==cls];return {"files":len(a),"bytes":sum(int(r["size"] or 0) for r in a)}
 unique=agg("UNIQUE");keep=agg("KEEP");excess=agg("EXCESS")
 estate={"files":unique["files"]+keep["files"]+excess["files"],"bytes":unique["bytes"]+keep["bytes"]+excess["bytes"]}
 retained={"files":unique["files"]+keep["files"],"bytes":unique["bytes"]+keep["bytes"]}
 t=target_get();target=int(t.get("free_bytes") or t.get("registered_free_bytes") or 0) if t.get("configured") else 0
 open_bytes=target-retained["bytes"] if t.get("configured") else 0
 landed={"files":0,"bytes":0};inplay={"files":retained["files"],"bytes":retained["bytes"]}
 return {"analysis":{"unique":unique,"keep":keep,"excess":excess,"estate":estate},
         "capacity":{"estate":retained,"open":{"files":None,"bytes":open_bytes},"target":{"files":None,"bytes":target},"configured":bool(t.get("configured"))},
         "operations":{"in_play":inplay,"landed":landed,"estate":retained},
         "catalog_revision":catalog_revision()}
def op_insert(bulk_id,typ,row,requested,success,result,error=None,post_id=None,new_path=None,verification=None,detail=None):
 return ("INSERT INTO operations(operation_id,bulk_id,operation_type,placement_no,pre_placement_id,post_placement_id,prior_path,new_path,requested,completed,success,result,error_detail,verification,detail_json) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
         (uuid.uuid4().hex,bulk_id,typ,row.get("placement_no"),row.get("placement_id"),post_id,row.get("path"),new_path,requested,time.time(),1 if success else 0,result,error,verification,json.dumps(detail or {})))
def finalize_bulk(bulk_id,event_type,message,detail):
 M.recompute_classifications();rev=S.bump_catalog_revision();S.submit("UPDATE operations SET evidence_revision=? WHERE bulk_id=?",(rev,bulk_id),True);M.event(event_type,message,None,None,"INFO",detail);S.drain(30)
 return rev
def move_preflight(ids,destination):
 rows=active_rows(ids)
 if len(rows)!=len(ids):raise RuntimeError("One or more selected placements are missing or no longer active")
 destination=reconcile_windows_path(destination,True);dest=Path(destination).resolve()
 if not dest.is_dir():raise RuntimeError("Destination folder does not exist")
 ds=destination_source(dest)
 if not ds:raise RuntimeError("Destination must be inside a registered Estate root")
 if not os.access(dest,os.R_OK|os.W_OK|os.X_OK):raise RuntimeError("Destination is not readable/writable")
 seen=set();items=[];cross_bytes=0
 for r in rows:
  reconcile_windows_path(r["path"],False);src=Path(r["path"]).resolve()
  if r["availability"]!="AVAILABLE" or not src.is_file():raise RuntimeError("Selected file unavailable: "+r["filename"])
  dst=(dest/r["filename"]).resolve()
  if dst==src:raise RuntimeError("Destination is already the current folder for "+r["filename"])
  key=os.path.normcase(str(dst))
  if key in seen:raise RuntimeError("Selected files collide at destination: "+r["filename"])
  seen.add(key)
  if dst.exists():raise RuntimeError("Destination already exists: "+str(dst))
  if S.rows("SELECT placement_id FROM placements WHERE source_id=? AND path=? LIMIT 1",(ds["source_id"],str(dst))):raise RuntimeError("Destination path already exists in SOT history: "+str(dst))
  same=os.stat(src).st_dev==os.stat(dest).st_dev
  if not same:cross_bytes+=int(r["size"] or src.stat().st_size)
  items.append({"row":r,"src":str(src),"dst":str(dst),"same_device":same})
 st=os.statvfs(dest);free=st.f_bavail*st.f_frsize
 if cross_bytes>free:raise RuntimeError("Destination has insufficient free capacity")
 return {"destination":str(dest),"destination_source":ds,"items":items,"cross_bytes":cross_bytes,"free_bytes":free}
def safe_move(src,dst,expected=None):
 src=Path(src);dst=Path(dst);dst.parent.mkdir(parents=True,exist_ok=True)
 if dst.exists():raise RuntimeError("Destination exists: "+str(dst))
 expected=expected or sha256_file(src)
 same=os.stat(src).st_dev==os.stat(dst.parent).st_dev
 if same:
  try:
   os.link(src,dst);src.unlink();return "same-filesystem-link",expected
  except OSError:
   if dst.exists():dst.unlink()
 h=hashlib.sha256()
 try:
  with src.open("rb") as rf,dst.open("xb") as wf:
   while True:
    b=rf.read(1024*1024)
    if not b:break
    wf.write(b);h.update(b)
  shutil.copystat(src,dst)
  got=h.hexdigest()
  if got!=expected:raise RuntimeError("Destination byte verification failed")
  src.unlink();return "copy-verify-remove",got
 except Exception:
  try:
   if dst.exists():dst.unlink()
  except Exception:pass
  raise
def rollback_move(src,dst,expected):
 src=Path(src);dst=Path(dst)
 if src.exists() or not dst.exists():return
 safe_move(dst,src,expected)
def execute_move(ids,destination):
 pf=move_preflight(ids,destination);bulk=uuid.uuid4().hex;requested=time.time();results=[];ops=[];successes=0
 ds=pf["destination_source"]
 for item in pf["items"]:
  r=item["row"];src=item["src"];dst=item["dst"];method=None
  try:
   expected=r.get("fingerprint") or sha256_file(src);method,verified=safe_move(src,dst,expected)
   new_id=stable_pid(ds["source_id"],dst);st=os.stat(dst)
   statements=[
    ("UPDATE placements SET placement_id=?,source_id=?,estate=?,path=?,filename=?,extension=?,size=?,modified=?,availability='AVAILABLE',error_detail=NULL,placement_state='ACTIVE',retired_at=NULL,last_verified=? WHERE placement_id=?",
     (new_id,ds["source_id"],ds["estate"],dst,Path(dst).name,Path(dst).suffix.lower(),st.st_size,st.st_mtime,time.time(),r["placement_id"])),
    op_insert(bulk,"FOLDER",r,requested,True,"MOVED",None,new_id,dst,method,{"destination":pf["destination"]})
   ]
   try:S.tx(statements,True)
   except Exception:
    rollback_move(src,dst,expected);raise
   successes+=1;results.append({"placement_id":r["placement_id"],"new_placement_id":new_id,"success":True,"new_path":dst,"verification":method})
  except Exception as e:
   try:S.submit(*op_insert(bulk,"FOLDER",r,requested,False,"FAILED",str(e),None,dst,method),wait=True)
   except Exception:pass
   results.append({"placement_id":r["placement_id"],"success":False,"error":str(e)})
 if successes:
  rev=finalize_bulk(bulk,"grid_folder","Grid Folder completed",{"selected":len(ids),"successes":successes,"failures":len(ids)-successes,"destination":pf["destination"]})
 else:
  S.drain(30);rev=catalog_revision();M.event("grid_folder_failed","Grid Folder failed",None,None,"ERROR",{"selected":len(ids),"failures":len(ids)})
 return {"results":results,"catalog_revision":rev,"plan":plan_summary()}
def trash_one(path):
 fp=Path(path).resolve()
 if "microsoft" in os.uname().release.lower() and str(fp).startswith("/mnt/"):
  wp=subprocess.check_output(["wslpath","-w",str(fp)],text=True,timeout=5).strip();ps="/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe"
  script="$raw=[Console]::In.ReadToEnd();$o=$raw|ConvertFrom-Json;$p=[string]$o.path;Add-Type -AssemblyName Microsoft.VisualBasic;[Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile($p,[Microsoft.VisualBasic.FileIO.UIOption]::OnlyErrorDialogs,[Microsoft.VisualBasic.FileIO.RecycleOption]::SendToRecycleBin)"
  z=subprocess.run([ps,"-NoProfile","-NonInteractive","-Command",script],input=json.dumps({"path":wp}),text=True,capture_output=True,timeout=60)
  if z.returncode!=0:raise RuntimeError((z.stderr or z.stdout or "Recycle Bin operation failed").strip()[:500])
  return "windows-recycle-bin"
 if shutil.which("gio"):
  z=subprocess.run(["gio","trash",str(fp)],capture_output=True,text=True,timeout=60)
  if z.returncode!=0:raise RuntimeError((z.stderr or "Trash operation failed").strip()[:500])
  return "gio-trash"
 raise RuntimeError("Trash/Recycle Bin is unavailable on this host")
def retire_row(bulk,row,state,mode,requested,verification):
 op=op_insert(bulk,"DELETE",row,requested,True,state,None,None,None,verification,{"mode":mode})
 S.tx([("UPDATE placements SET placement_state=?,retired_at=?,availability='REMOVED',last_verified=? WHERE placement_id=?",(state,time.time(),time.time(),row["placement_id"])),op],True)
def delete_batch(ids,mode="trash",token=None):
 rows=active_rows(ids)
 if len(rows)!=len(ids):raise RuntimeError("One or more selected placements are missing or no longer active")
 if mode=="permanent":
  a=S.rows("SELECT * FROM delete_authorizations WHERE token=? AND used=0",(str(token or ""),))
  if not a or float(a[0]["expires"])<time.time():raise RuntimeError("Permanent-delete authorization expired or invalid")
  allowed=set(json.loads(a[0]["ids_json"])); 
  if not set(ids).issubset(allowed):raise RuntimeError("Permanent-delete scope does not match the failed-trash subset")
 bulk=uuid.uuid4().hex;requested=time.time();results=[];failed=[];successes=0
 for r in rows:
  try:
   reconcile_windows_path(r["path"],True);fp=Path(r["path"]).resolve()
   if r["availability"]!="AVAILABLE" or not fp.is_file():raise RuntimeError("File unavailable")
   if mode=="trash":verification=trash_one(fp);state="TRASHED"
   elif mode=="permanent":fp.unlink();verification="permanent-unlink";state="DELETED"
   else:raise RuntimeError("Bad delete mode")
   retire_row(bulk,r,state,mode,requested,verification);successes+=1
   results.append({"placement_id":r["placement_id"],"success":True,"state":state,"verification":verification})
  except Exception as e:
   S.submit(*op_insert(bulk,"DELETE",r,requested,False,"FAILED",str(e),None,None,None,{"mode":mode}),wait=True)
   failed.append(r["placement_id"]);results.append({"placement_id":r["placement_id"],"success":False,"error":str(e)})
 auth=None
 if mode=="trash" and failed:
  auth=uuid.uuid4().hex;S.submit("INSERT INTO delete_authorizations(token,created,expires,ids_json,used) VALUES(?,?,?,?,0)",(auth,time.time(),time.time()+600,json.dumps(failed)),True)
 if mode=="permanent":
  remaining=[x for x in failed]
  if remaining:S.submit("UPDATE delete_authorizations SET ids_json=? WHERE token=?",(json.dumps(remaining),token),True)
  else:S.submit("UPDATE delete_authorizations SET used=1 WHERE token=?",(token,),True)
 if successes:
  rev=finalize_bulk(bulk,"grid_delete","Grid Delete completed",{"mode":mode,"selected":len(ids),"successes":successes,"failures":len(failed)})
 else:
  S.drain(30);rev=catalog_revision()
 return {"results":results,"needs_permanent":mode=="trash" and bool(failed),"permanent_ids":failed if mode=="trash" else [],"permanent_token":auth,"catalog_revision":rev,"plan":plan_summary(),"message":("Moved selected files to Trash/Recycle Bin" if mode=="trash" and not failed else "Delete operation completed")}
def metadata_update(body):
 ids=[str(x) for x in body.get("ids",[])];rows=active_rows(ids)
 if not ids or len(rows)!=len(ids):raise RuntimeError("Metadata scope contains a missing or inactive placement")
 updates=body.get("updates") or {};add=[normalize_tag(x) for x in updates.get("add_tags",[])];remove={normalize_tag(x).lower() for x in updates.get("remove_tags",[])}
 for k in ("quality_rating","content_rating"):
  if k in updates and updates[k] is not None and int(updates[k]) not in range(1,6):raise RuntimeError(k+" must be 1-5 or null")
 bulk=uuid.uuid4().hex;requested=time.time();stmts=[]
 for r in rows:
  sets=[];args=[]
  if add or remove:
   tags=parse_tags(r.get("tags"));by={}
   for x in tags:
    n=normalize_tag(x)
    if n:by.setdefault(n,n)
   for x in add:
    if x:by.setdefault(x,x)
   for x in remove:by.pop(x,None)
   sets.append("tags=?");args.append(json.dumps(list(by.values())))
  for k in ("notes","quality_rating","content_rating"):
   if k in updates:sets.append(k+"=?");args.append(updates[k])
  if sets:
   args.append(r["placement_id"]);stmts.append(("UPDATE placements SET "+",".join(sets)+" WHERE placement_id=?",tuple(args)))
   stmts.append(op_insert(bulk,"METADATA",r,requested,True,"UPDATED",None,r["placement_id"],r["path"],"database-transaction",{"fields":list(updates)}))
 if not stmts:return {"results":[],"catalog_revision":catalog_revision(),"plan":plan_summary()}
 S.tx(stmts,True);rev=S.bump_catalog_revision();S.submit("UPDATE operations SET evidence_revision=? WHERE bulk_id=?",(rev,bulk),True);M.event("grid_metadata","Grid metadata updated",None,None,"INFO",{"selected":len(ids),"fields":list(updates)});S.drain(30)
 return {"results":[{"placement_id":x,"success":True} for x in ids],"catalog_revision":rev,"plan":plan_summary()}
def get_ai():
 global AI
 if AI is None:AI=ai_mod.AIManager(S,M,catalog_revision,target_get,plan_summary,active_rows,parse_tags,normalize_tag,metadata_update)
 return AI
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
    return self.sendj({"ok":True,"version":m.VERSION,"schema":m.SCHEMA,"process":"healthy","db":S.db_probe(.10),"writer_queue":S.q.qsize(),"writer_error":S.writer_error,"creation_revision":creation_revision(),"catalog_revision":catalog_revision(),"time":time.time()})
   if p=="/api/job/latest":return self.sendj({"ok":True,"snapshot":latest()})
   if p=="/api/sources":return self.sendj({"ok":True,"sources":S.rows("SELECT * FROM sources ORDER BY estate,label")})
   if p=="/api/events":return self.sendj({"ok":True,"events":S.rows("SELECT * FROM events ORDER BY event_id DESC LIMIT 500")})
   if p=="/api/target":return self.sendj({"ok":True,"target":target_get()})
   if p=="/api/plan":return self.sendj({"ok":True,"plan":plan_summary()})
   if p=="/api/placements":return self.sendj({"ok":True,"catalog_revision":catalog_revision(),"placements":S.rows("SELECT * FROM placements WHERE placement_state=\'ACTIVE\' ORDER BY placement_no LIMIT 10000")})
   if p=="/api/ai/tasks":
    A=get_ai();return self.sendj({"ok":True,"task_types":ai_mod.TASK_TYPES,"tasks":A.list()})
   if p=="/api/ai/task":
    tid=parse_qs(u.query).get("id",[""])[0];A=get_ai();t=A.row(tid)
    return self.sendj({"ok":True,"task":A.public(t,True)}) if t else self.sendj({"ok":False,"error":"task not found"},404)
   if p=="/api/file/info":
    pid=parse_qs(u.query).get("id",[""])[0];r=S.rows("SELECT placement_id,path,filename,size,availability FROM placements WHERE placement_id=? AND placement_state=\'ACTIVE\'",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    z=r[0];reconcile_windows_path(z["path"],False);fp=Path(z["path"]).resolve()
    if z["availability"]!="AVAILABLE" or not fp.is_file():return self.sendj({"ok":False,"error":"file unavailable"},404)
    mime=mimetypes.guess_type(str(fp))[0] or "application/octet-stream";ext=fp.suffix.lower()
    preview="image" if mime.startswith("image/") else "video" if mime.startswith("video/") else "text" if ext in (".txt",".md",".markdown") or mime.startswith("text/plain") else "frame" if ext in (".pdf",".html",".htm") else "none"
    return self.sendj({"ok":True,"placement_id":pid,"filename":z["filename"],"size":z["size"],"mime":mime,"preview":preview})
   if p=="/api/file/content":
    pid=parse_qs(u.query).get("id",[""])[0];r=S.rows("SELECT path,availability FROM placements WHERE placement_id=? AND placement_state=\'ACTIVE\'",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    reconcile_windows_path(r[0]["path"],False);fp=Path(r[0]["path"]).resolve()
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
    vols=[{"label":"WSL","path":"/","mounted":True,"available":True,"windows":False}]
    by_path={"/":vols[0]}
    for base in ("/mnt","/media"):
     q=Path(base)
     if q.exists():
      for x in q.iterdir():
       if base=="/mnt" and x.name.lower() in ("wsl","wslg"):continue
       try:
        if x.is_dir() and os.path.ismount(x) and os.access(x,os.R_OK|os.X_OK):
         os.statvfs(x);v={"label":x.name,"path":str(x),"mounted":True,"available":True,"windows":False};vols.append(v);by_path[str(x)]=v
       except OSError:pass
    for w in windows_logical_drives():
     letter=str(w.get("windows_drive",""))[:1].lower()
     if letter:
      state=ensure_windows_drive_mounted(letter)
      w["mounted"]=bool(state.get("ok"));w["available"]=bool(state.get("ok"));w["mount_error"]=state.get("error")
     cur=by_path.get(w["path"])
     if cur:
      cur.update({k:v for k,v in w.items() if k not in ("path","label")})
      if not cur.get("label") or cur["label"]==Path(cur["path"]).name:cur["label"]=w["label"]
     else:
      vols.append(w);by_path[w["path"]]=w
    vols.sort(key=lambda v:(0 if v["path"]=="/" else 1,str(v.get("windows_drive") or v.get("path") or "").lower()))
    return self.sendj({"ok":True,"volumes":vols,"reconciled_at":time.time()})
   if p=="/api/folders":
    raw=parse_qs(u.query).get("path",["/"])[0];raw=reconcile_windows_path(raw,False);root=Path(raw).resolve();items=[];files=[]
    for x in root.iterdir():
     try:
      if x.is_dir() and not x.is_symlink():items.append({"name":x.name,"path":str(x.resolve())})
      elif x.is_file() and not x.is_symlink():files.append({"name":x.name,"path":str(x.resolve()),"size":x.stat().st_size})
     except OSError:pass
    return self.sendj({"ok":True,"path":str(root),"folders":sorted(items,key=lambda z:z["name"].lower()),"files":sorted(files,key=lambda z:z["name"].lower())})
   return self.sendj({"ok":False,"error":"not found"},404)
  except Exception as e:return self.sendj({"ok":False,"error":str(e)},500)
 def do_POST(self):
  try:
   p=self.path.split("?",1)[0];b=self.body()
   if p=="/api/folder-search":
    z=folder_search(b.get("root","/"),b.get("query",""),b.get("exclude") or [],b.get("limit",500));return self.sendj({"ok":True,**z})
   if p=="/api/sources":
    root=reconcile_windows_path(b["root"],False);return self.sendj({"ok":True,"source_id":M.add_source(b["label"],root,b.get("failure_domain",root),b.get("role","primary"),b.get("estate"))})
   if p=="/api/target":return self.sendj({"ok":True,"target":target_set(b["path"],b.get("label",""))})
   if p=="/api/creation/backfill":return self.sendj({"ok":True,"result":creation_backfill()})
   if p=="/api/folders/create":
    parent=Path(reconcile_windows_path(b["parent"],True)).resolve();name=str(b["name"]).strip()
    if not name or name in (".","..") or "/" in name or "\\" in name:raise RuntimeError("Invalid folder name")
    if not any(parent==r or str(parent).startswith(str(r).rstrip("/")+"/") for r in volume_roots()):raise RuntimeError("Parent is not on an available volume")
    child=parent/name;child.mkdir(exist_ok=False);return self.sendj({"ok":True,"folder":{"name":child.name,"path":str(child.resolve())}})
   if p=="/api/job/start":
    reconcile_sources(b.get("source_ids"));return self.sendj({"ok":True,"job_id":M.start(b.get("source_ids"))})
   if p=="/api/ai/task/create":return self.sendj({"ok":True,"task":get_ai().create(b["task_type"],b.get("scope"),b.get("title"))})
   if p=="/api/ai/task/title":return self.sendj({"ok":True,"task":get_ai().title(str(b.get("task_id","")),b.get("title"))})
   if p=="/api/ai/task/scope":
    scope=reconcile_ai_scope(b.get("scope") or {});return self.sendj({"ok":True,"task":get_ai().scope(str(b.get("task_id","")),scope)})
   if p=="/api/ai/task/delete":
    get_ai().delete(str(b.get("task_id","")));return self.sendj({"ok":True})
   if p=="/api/ai/task/run":
    scope=reconcile_ai_scope(b.get("scope") or {});return self.sendj({"ok":True,"task":get_ai().run(str(b.get("task_id","")),b.get("prompt",""),b.get("provider"),b.get("model"),b.get("api_key"),scope)})
   if p=="/api/ai/task/apply":return self.sendj({"ok":True,"task":get_ai().apply(str(b.get("task_id","")),b.get("approval_note",""))})
   if p=="/api/grid/metadata":return self.sendj({"ok":True,**metadata_update(b)})
   if p=="/api/grid/folder/preflight":
    ids=[str(x) for x in b.get("ids",[])];pf=move_preflight(ids,b.get("destination",""))
    return self.sendj({"ok":True,"preflight":{"destination":pf["destination"],"count":len(ids),"cross_bytes":pf["cross_bytes"],"free_bytes":pf["free_bytes"]}})
   if p=="/api/grid/folder":
    ids=[str(x) for x in b.get("ids",[])];return self.sendj({"ok":True,**execute_move(ids,b.get("destination",""))})
   if p=="/api/grid/delete":
    ids=[str(x) for x in b.get("ids",[])];return self.sendj({"ok":True,**delete_batch(ids,b.get("mode","trash"),b.get("token"))})
   if p=="/api/file/delete":
    pid=str(b.get("id",""));z=delete_batch([pid],b.get("mode","trash"),b.get("token"))
    return self.sendj({"ok":True,**z})
   if p=="/api/file/open":
    pid=b.get("id","");r=S.rows("SELECT path,availability FROM placements WHERE placement_id=? AND placement_state=\'ACTIVE\'",(pid,))
    if not r:return self.sendj({"ok":False,"error":"placement not found"},404)
    reconcile_windows_path(r[0]["path"],False);fp=Path(r[0]["path"]).resolve()
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
