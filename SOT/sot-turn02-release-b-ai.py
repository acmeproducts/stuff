#!/usr/bin/env python3
import json,re,threading,time,urllib.request,urllib.error,uuid,os,subprocess,shutil
from pathlib import Path

TASK_TYPES={
 "auto_tag":{"title":"Auto Tag","mode":"proposal","description":"Propose evidence-backed lowercase owner tags. Never change system classification."},
 "analyze_estate":{"title":"Analyze Estate","mode":"read","description":"Analyze composition, concentrations, age/type/size patterns and anomalies."},
 "explain_duplicates":{"title":"Explain Duplicates","mode":"read","description":"Explain duplicate groups, KEEP/EXCESS patterns and byte impact."},
 "find_review_candidates":{"title":"Find Review Candidates","mode":"read","description":"Identify evidence-backed files/groups that warrant owner review."},
 "propose_target_structure":{"title":"Propose TARGET Folder Structure","mode":"proposal_read","description":"Propose a concrete TARGET hierarchy and placement-to-destination mapping. Do not execute moves."},
 "plan_target_landing":{"title":"Plan Landing to TARGET","mode":"proposal_read","description":"Plan landing of IN PLAY content to TARGET. Do not execute copy/move operations."},
 "compare_paths":{"title":"Compare Paths / Folders","mode":"read","description":"Compare two arbitrary filesystem paths with deterministic name/media evidence. Advisory only; never move/archive/delete."}
}

class AIManager:
 def __init__(self,store,manager,catalog_revision,target_get,plan_summary,active_rows,parse_tags,normalize_tag,metadata_update):
  self.s=store;self.m=manager;self.catalog_revision=catalog_revision;self.target_get=target_get;self.plan_summary=plan_summary
  self.active_rows=active_rows;self.parse_tags=parse_tags;self.normalize_tag=normalize_tag;self.metadata_update=metadata_update
  self.runs={};self.lock=threading.RLock()
 def jload(self,v,default):
  try:return json.loads(v) if v else default
  except Exception:return default
 def row(self,task_id):
  r=self.s.rows("SELECT * FROM ai_tasks WHERE task_id=?",(task_id,));return r[0] if r else None
 def turns(self,task_id):
  return self.s.rows("SELECT * FROM ai_turns WHERE task_id=? ORDER BY ordinal",(task_id,))
 def public(self,r,include_turns=False):
  if not r:return None
  z={k:r.get(k) for k in ("task_id","task_type","title","status","created","updated","evidence_revision","provider","model","summary","error_detail","cancelled")}
  z["scope"]=self.jload(r.get("scope_json"),{})
  z["proposal"]=self.jload(r.get("proposal_json"),None)
  z["approval"]=self.jload(r.get("approval_json"),None)
  z["applied_result"]=self.jload(r.get("applied_result_json"),None)
  z["result_markdown"]=r.get("result_markdown")
  if include_turns:
   z["turns"]=[]
   for t in self.turns(r["task_id"]):
    z["turns"].append({"turn_id":t["turn_id"],"ordinal":t["ordinal"],"role":t["role"],"content":t["content"],"created":t["created"],"status":t["status"],"evidence_revision":t["evidence_revision"],"scope":self.jload(t["scope_json"],{}),"evidence_manifest":self.jload(t["evidence_manifest_json"],{}),"provider":t["provider"],"model":t["model"],"error_detail":t["error_detail"]})
  return z
 def list(self):
  return [self.public(x,False) for x in self.s.rows("SELECT * FROM ai_tasks ORDER BY updated DESC")]
 def create(self,task_type,scope=None,title=None):
  if task_type not in TASK_TYPES:raise RuntimeError("Unsupported AI task type")
  now=time.time();tid=uuid.uuid4().hex;cfg=TASK_TYPES[task_type];scope=scope or {"type":"entire_sot"}
  self.s.submit("INSERT INTO ai_tasks(task_id,task_type,title,status,created,updated,scope_json,evidence_revision,summary) VALUES(?,?,?,?,?,?,?,?,?)",(tid,task_type,title or cfg["title"],"draft",now,now,json.dumps(scope),self.catalog_revision(),cfg["description"]),True)
  return self.public(self.row(tid),True)
 def title(self,task_id,title):
  title=str(title or "").strip()
  if not title:raise RuntimeError("Task title required")
  if not self.row(task_id):raise RuntimeError("Task not found")
  self.s.submit("UPDATE ai_tasks SET title=?,updated=? WHERE task_id=?",(title,time.time(),task_id),True);return self.public(self.row(task_id),True)
 def delete(self,task_id):
  if not self.row(task_id):raise RuntimeError("Task not found")
  if task_id in self.runs:raise RuntimeError("Cannot delete a running task")
  self.s.tx([("DELETE FROM ai_turns WHERE task_id=?",(task_id,)),("DELETE FROM ai_tasks WHERE task_id=?",(task_id,))],True)
 def scope_rows(self,scope):
  typ=str((scope or {}).get("type","entire_sot"));ids=[str(x) for x in (scope or {}).get("placement_ids",[]) if x]
  if typ in ("selected","query") and ids:
   by={}
   for i in range(0,len(ids),400):
    chunk=ids[i:i+400];q=",".join("?" for _ in chunk)
    for r in self.s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' AND placement_id IN ("+q+")",tuple(chunk)):by[r["placement_id"]]=r
   rows=[by[x] for x in ids if x in by]
  else:rows=self.s.rows("SELECT * FROM placements WHERE placement_state='ACTIVE' ORDER BY placement_no")
  return rows,typ
 def _cmp_key(self,name):
  stem=Path(str(name)).stem.lower()
  stem=re.sub(r'(?i)(?:[-_. ](?:converted|conversion|transcoded|transcode|mp4|h264|h265|hevc|final|new))+$','',stem)
  stem=re.sub(r'[^a-z0-9]+','',stem)
  return stem
 def _list_path_files(self,value):
  p=Path(str(value)).resolve()
  if not p.exists():raise RuntimeError("Compare path does not exist: "+str(p))
  if p.is_file():return [p]
  if not p.is_dir():raise RuntimeError("Compare path is not a file/folder: "+str(p))
  out=[]
  for root,dirs,files in os.walk(p):
   dirs[:]=[d for d in dirs if not Path(root,d).is_symlink()]
   for name in files:
    fp=Path(root,name)
    try:
     if fp.is_file() and not fp.is_symlink():out.append(fp)
    except OSError:pass
  return out
 def _ffprobe(self,p):
  exe=shutil.which("ffprobe")
  if not exe:return {"available":False,"ok":False,"error":"ffprobe not installed"}
  cmd=[exe,"-v","error","-show_entries","format=format_name,duration,bit_rate,size:stream=index,codec_type,codec_name,width,height,r_frame_rate,duration","-of","json",str(p)]
  try:
   z=subprocess.run(cmd,text=True,capture_output=True,timeout=25)
   if z.returncode!=0:return {"available":True,"ok":False,"error":(z.stderr or "ffprobe failed").strip()[:500]}
   data=json.loads(z.stdout or "{}");fmt=data.get("format") or {};streams=data.get("streams") or []
   video=[x for x in streams if x.get("codec_type")=="video"];audio=[x for x in streams if x.get("codec_type")=="audio"]
   def num(v):
    try:return float(v)
    except Exception:return None
   dur=num(fmt.get("duration"))
   if dur is None:
    ds=[num(x.get("duration")) for x in streams];ds=[x for x in ds if x is not None]
    dur=max(ds) if ds else None
   v=video[0] if video else {}
   return {"available":True,"ok":True,"format_name":fmt.get("format_name"),"duration":dur,"bit_rate":num(fmt.get("bit_rate")),"stream_count":len(streams),
           "video_codec":v.get("codec_name"),"width":v.get("width"),"height":v.get("height"),"frame_rate":v.get("r_frame_rate"),
           "audio_codecs":[x.get("codec_name") for x in audio if x.get("codec_name")],"has_video":bool(video),"has_audio":bool(audio)}
  except Exception as e:return {"available":True,"ok":False,"error":str(e)[:500]}
 def _file_record(self,p,base):
  try:st=p.stat()
  except OSError as e:return {"path":str(p),"filename":p.name,"error":str(e)}
  try:rel=str(p.relative_to(base)) if base.is_dir() else p.name
  except Exception:rel=p.name
  return {"path":str(p),"relative_path":rel,"filename":p.name,"stem":p.stem,"key":self._cmp_key(p.name),"extension":p.suffix.lower(),"size":int(st.st_size),"modified":float(st.st_mtime)}
 def compare_packet(self,scope,probe_limit=400):
  a=Path(str((scope or {}).get("path_a",""))).resolve();b=Path(str((scope or {}).get("path_b",""))).resolve()
  if not str((scope or {}).get("path_a","")).strip() or not str((scope or {}).get("path_b","")).strip():raise RuntimeError("Compare Paths requires Path A and Path B")
  af=self._list_path_files(a);bf=self._list_path_files(b);ar=[self._file_record(x,a) for x in af];br=[self._file_record(x,b) for x in bf]
  ga={};gb={}
  for x in ar:ga.setdefault(x.get("key") or "",[]).append(x)
  for x in br:gb.setdefault(x.get("key") or "",[]).append(x)
  pairs=[];ua=[];ub=[];probe_count=0
  for key in sorted(set(ga)|set(gb)):
   la=sorted(ga.get(key,[]),key=lambda x:(x.get("relative_path","").lower(),x.get("filename","").lower()))
   lb=sorted(gb.get(key,[]),key=lambda x:(x.get("relative_path","").lower(),x.get("filename","").lower()))
   n=min(len(la),len(lb))
   for i in range(n):
    x,y=la[i],lb[i];pa=pb=None
    media={".avi",".mp4",".mov",".mkv",".m4v",".wmv",".mpg",".mpeg",".webm"}
    if (x.get("extension") in media or y.get("extension") in media) and probe_count<probe_limit:
     pa=self._ffprobe(Path(x["path"]));pb=self._ffprobe(Path(y["path"]));probe_count+=2
    dd=None;dp=None
    if pa and pb and pa.get("ok") and pb.get("ok") and pa.get("duration") is not None and pb.get("duration") is not None:
     dd=abs(float(pa["duration"])-float(pb["duration"]));den=max(float(pa["duration"]),float(pb["duration"]),0.001);dp=dd/den*100
    evidence_ok=bool(pa and pb and pa.get("ok") and pb.get("ok") and dd is not None and dp<=1.0 and pa.get("has_video")==pb.get("has_video") and pa.get("has_audio")==pb.get("has_audio"))
    bucket="Verified conversion candidate" if evidence_ok else "Likely match — review" if key else "Probe/error — manual review"
    if pa and pb and ((pa.get("available") and not pa.get("ok")) or (pb.get("available") and not pb.get("ok"))):bucket="Probe/error — manual review"
    pairs.append({"key":key,"a":x,"b":y,"probe_a":pa,"probe_b":pb,"duration_difference_seconds":dd,"duration_difference_percent":dp,"bucket":bucket})
   ua.extend(la[n:]);ub.extend(lb[n:])
  ff=bool(shutil.which("ffprobe"))
  manifest={"catalog_revision":self.catalog_revision(),"scope_type":"compare_paths","scope":scope,"path_a":str(a),"path_b":str(b),"files_a":len(ar),"files_b":len(br),
            "paired":len(pairs),"unmatched_a":len(ua),"unmatched_b":len(ub),"ffprobe_available":ff,"probed_files":probe_count,"pair_evidence_truncated":len(pairs)>500}
  packet={"manifest":manifest,"comparison":{"path_a":str(a),"path_b":str(b),"pairs":pairs[:500],"unmatched_a":ua[:300],"unmatched_b":ub[:300],
          "summary":{"files_a":len(ar),"files_b":len(br),"paired":len(pairs),"unmatched_a":len(ua),"unmatched_b":len(ub),"ffprobe_available":ff}}}
  return packet,manifest
 def packet(self,scope,limit=300):
  if str((scope or {}).get("type",""))=="compare_paths":return self.compare_packet(scope)
  rows,typ=self.scope_rows(scope);all_count=len(rows);all_bytes=sum(int(r.get("size") or 0) for r in rows);cls={};ext={};est={}
  for r in rows:
   c=r.get("system_classification") or "UNCLASSIFIED";cls[c]=cls.get(c,0)+1
   e=r.get("extension") or "(none)";ext[e]=ext.get(e,0)+1
   a=r.get("estate") or "(none)";est[a]=est.get(a,0)+1
  sample=rows[:limit]
  placements=[{"placement_id":r["placement_id"],"placement_no":r["placement_no"],"filename":r["filename"],"folder":str(Path(r["path"]).parent),"extension":r.get("extension"),"size":r.get("size"),"created":r.get("created"),"modified":r.get("modified"),"estate":r.get("estate"),"class":r.get("system_classification"),"lifecycle":r.get("lifecycle"),"fingerprint":r.get("fingerprint"),"tags":self.parse_tags(r.get("tags")),"notes":r.get("notes"),"quality_rating":r.get("quality_rating"),"content_rating":r.get("content_rating")} for r in sample]
  manifest={"catalog_revision":self.catalog_revision(),"scope_type":typ,"scope":scope or {"type":"entire_sot"},"total_placements":all_count,"total_bytes":all_bytes,"included_placement_ids":[r["placement_id"] for r in sample],"truncated":all_count>len(sample)}
  packet={"manifest":manifest,"summary":{"placements":all_count,"bytes":all_bytes,"classes":cls,"extensions":dict(sorted(ext.items())),"estates":dict(sorted(est.items()))},"target":self.target_get(),"plan":self.plan_summary(),"placements":placements}
  return packet,manifest
 def system_prompt(self,task_type):
  cfg=TASK_TYPES[task_type];common="You are the governed SOT storage-estate task engine. Use only supplied SOT evidence. Distinguish evidence from interpretation. Never invent file paths or placement IDs. Never claim an action occurred unless SOT execution results prove it."
  if task_type=="auto_tag":return common+' Return ONLY valid JSON: {"summary":"short summary","changes":[{"placement_id":"exact id from evidence","add":["#lowercase-tag"],"remove":[],"reason":"brief evidence reason"}]}. Tags must be lowercase and evidence-based. Never propose UNIQUE, KEEP or EXCESS as owner tags.'
  if task_type=="propose_target_structure":return common+" Produce Markdown with a proposed TARGET hierarchy and placement-to-destination mapping. Proposal only; do not claim files moved."
  if task_type=="plan_target_landing":return common+" Produce Markdown planning how IN PLAY content would land to TARGET, including capacity, collisions and byte verification. Proposal only; do not claim files copied or moved."
  if task_type=="compare_paths":return common+" Compare the two supplied filesystem paths. Use exact filenames plus normalized pairing keys and ffprobe evidence when available. Do not treat same names alone as proof. Classify pairs into Verified conversion candidate / Likely match — review / Probe/error — manual review, list unmatched files, and identify legacy originals that are reasonable cold-storage or soft-delete REVIEW candidates only when the converted counterpart has strong deterministic evidence. Never claim any move/archive/delete occurred."
  return common+" "+cfg["description"]+" Produce concise Markdown with evidence-backed findings."
 def provider(self,provider,model,key,messages):
  provider=str(provider or "").lower();model=str(model or "").strip();key=str(key or "").strip()
  if not provider or not model or not key:raise RuntimeError("AI provider, model and API key are required in Configuration")
  if provider=="venice":
   url="https://api.venice.ai/api/v1/chat/completions";headers={"Authorization":"Bearer "+key,"Content-Type":"application/json"};body={"model":model,"messages":messages,"temperature":0.2}
  elif provider=="openrouter":
   url="https://openrouter.ai/api/v1/chat/completions";headers={"Authorization":"Bearer "+key,"Content-Type":"application/json","HTTP-Referer":"https://acmeproducts.github.io/stuff/","X-Title":"SOT"};body={"model":model,"messages":messages,"temperature":0.2}
  elif provider=="anthropic":
   url="https://api.anthropic.com/v1/messages";headers={"x-api-key":key,"anthropic-version":"2023-06-01","Content-Type":"application/json"};system="";amsg=[]
   for x in messages:
    if x["role"]=="system":system+=x["content"]+"\n"
    else:amsg.append({"role":"assistant" if x["role"]=="assistant" else "user","content":x["content"]})
   body={"model":model,"max_tokens":4000,"system":system.strip(),"messages":amsg}
  else:raise RuntimeError("Unsupported AI provider")
  req=urllib.request.Request(url,data=json.dumps(body).encode(),headers=headers,method="POST")
  try:
   with urllib.request.urlopen(req,timeout=180) as resp:data=json.loads(resp.read().decode())
  except urllib.error.HTTPError as e:
   detail=e.read().decode(errors="replace")[:800];raise RuntimeError(provider+" HTTP "+str(e.code)+": "+detail)
  if provider=="anthropic":
   return "\n".join(str(x.get("text","")) for x in (data.get("content") or []) if isinstance(x,dict) and x.get("type")=="text").strip()
  try:return str(data["choices"][0]["message"]["content"]).strip()
  except Exception:raise RuntimeError("AI provider returned no assistant content")
 def parse_json(self,text):
  raw=str(text or "").strip();m=re.search(r"\x60\x60\x60(?:json)?\s*(\{.*\})\s*\x60\x60\x60",raw,re.S)
  if m:raw=m.group(1)
  try:return json.loads(raw)
  except Exception:
   a=raw.find("{");b=raw.rfind("}")
   if a>=0 and b>a:return json.loads(raw[a:b+1])
   raise RuntimeError("Auto Tag provider response was not valid JSON")
 def next_ordinal(self,task_id):
  r=self.s.rows("SELECT COALESCE(MAX(ordinal),0)+1 n FROM ai_turns WHERE task_id=?",(task_id,));return int(r[0]["n"])
 def run(self,task_id,prompt,provider,model,key,scope=None):
  task=self.row(task_id)
  if not task:raise RuntimeError("Task not found")
  if task["status"] in ("analyzing","applying"):raise RuntimeError("Task is already running")
  scope=scope or self.jload(task.get("scope_json"),{"type":"entire_sot"});packet,manifest=self.packet(scope);rev=manifest["catalog_revision"];now=time.time()
  ordinal=self.next_ordinal(task_id);user_prompt=str(prompt or "").strip() or "Run this task."
  self.s.tx([
   ("INSERT INTO ai_turns(turn_id,task_id,ordinal,role,content,created,status,evidence_revision,scope_json,evidence_manifest_json,provider,model) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(uuid.uuid4().hex,task_id,ordinal,"user",user_prompt,now,"ready",rev,json.dumps(scope),json.dumps(manifest),provider,model)),
   ("UPDATE ai_tasks SET status='analyzing',updated=?,scope_json=?,evidence_revision=?,provider=?,model=?,error_detail=NULL,cancelled=0 WHERE task_id=?",(now,json.dumps(scope),rev,provider,model,task_id))
  ],True)
  def worker():
   try:
    history=self.turns(task_id);msgs=[{"role":"system","content":self.system_prompt(task["task_type"])}]
    for t in history[-8:]:
     if t["role"] in ("user","assistant") and t["content"]:msgs.append({"role":t["role"],"content":t["content"]})
    msgs.append({"role":"user","content":"SOT EVIDENCE PACKET\n"+json.dumps(packet,default=str,separators=(",",":"))})
    answer=self.provider(provider,model,key,msgs)
    if task["task_type"]=="auto_tag":
     prop=self.parse_json(answer);allowed=set(manifest["included_placement_ids"]);clean=[]
     for ch in prop.get("changes") or []:
      pid=str(ch.get("placement_id",""))
      if pid not in allowed:continue
      add=sorted(set(self.normalize_tag(x) for x in ch.get("add",[]) if self.normalize_tag(x)))
      rem=sorted(set(self.normalize_tag(x) for x in ch.get("remove",[]) if self.normalize_tag(x)))
      add=[x for x in add if x not in ("#unique","#keep","#excess")];rem=[x for x in rem if x not in ("#unique","#keep","#excess")]
      clean.append({"placement_id":pid,"add":add,"remove":rem,"reason":str(ch.get("reason",""))[:500]})
     prop={"summary":str(prop.get("summary","Auto Tag proposal"))[:2000],"changes":clean,"evidence_revision":rev};assistant=json.dumps(prop,ensure_ascii=False);status="proposal-ready";proposal=json.dumps(prop);summary=prop["summary"];result=None
    else:
     assistant=answer;status="complete";proposal=None;summary=TASK_TYPES[task["task_type"]]["description"];result=answer
    now2=time.time();ord2=self.next_ordinal(task_id)
    self.s.tx([
     ("INSERT INTO ai_turns(turn_id,task_id,ordinal,role,content,created,status,evidence_revision,scope_json,evidence_manifest_json,provider,model) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",(uuid.uuid4().hex,task_id,ord2,"assistant",assistant,now2,"ready",rev,json.dumps(scope),json.dumps(manifest),provider,model)),
     ("UPDATE ai_tasks SET status=?,updated=?,summary=?,proposal_json=?,result_markdown=?,error_detail=NULL WHERE task_id=?",(status,now2,summary,proposal,result,task_id))
    ],True)
    self.m.event("ai_task_complete","AI task completed: "+task["task_type"],None,None,"INFO",{"task_id":task_id,"task_type":task["task_type"],"status":status,"evidence_revision":rev})
   except Exception as e:
    now2=time.time();ord2=self.next_ordinal(task_id)
    self.s.tx([
     ("INSERT INTO ai_turns(turn_id,task_id,ordinal,role,content,created,status,evidence_revision,scope_json,evidence_manifest_json,provider,model,error_detail) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",(uuid.uuid4().hex,task_id,ord2,"assistant","",now2,"failed",rev,json.dumps(scope),json.dumps(manifest),provider,model,str(e)[:2000])),
     ("UPDATE ai_tasks SET status='failed',updated=?,error_detail=? WHERE task_id=?",(now2,str(e)[:2000],task_id))
    ],True);self.m.event("ai_task_failed","AI task failed: "+task["task_type"],None,None,"ERROR",{"task_id":task_id,"error":str(e)[:500]})
   finally:
    with self.lock:self.runs.pop(task_id,None)
  t=threading.Thread(target=worker,name="sot-ai-"+task_id[:8],daemon=True)
  with self.lock:self.runs[task_id]=t
  t.start();return self.public(self.row(task_id),True)
 def apply(self,task_id,approval_note=""):
  task=self.row(task_id)
  if not task or task["task_type"]!="auto_tag":raise RuntimeError("Auto Tag task not found")
  if task["status"]!="proposal-ready":raise RuntimeError("Auto Tag proposal is not ready for approval")
  if int(task.get("evidence_revision") or 0)!=self.catalog_revision():raise RuntimeError("Auto Tag proposal is stale because SOT evidence changed; rerun before Apply")
  prop=self.jload(task.get("proposal_json"),{});changes=prop.get("changes") or [];groups={}
  for ch in changes:
   key=(tuple(ch.get("add") or []),tuple(ch.get("remove") or []));groups.setdefault(key,[]).append(ch["placement_id"])
  results=[]
  for (add,remove),ids in groups.items():
   for i in range(0,len(ids),400):
    chunk=ids[i:i+400];z=self.metadata_update({"ids":chunk,"updates":{"add_tags":list(add),"remove_tags":list(remove)}});results.extend(z.get("results") or [])
  now=time.time();appr={"approved_at":now,"note":str(approval_note or ""),"proposal_revision":task["evidence_revision"],"placement_count":len(changes)};applied={"results":results,"catalog_revision":self.catalog_revision(),"placement_count":len(changes)}
  self.s.submit("UPDATE ai_tasks SET status='complete',updated=?,approval_json=?,applied_result_json=?,evidence_revision=? WHERE task_id=?",(now,json.dumps(appr),json.dumps(applied),self.catalog_revision(),task_id),True)
  self.m.event("ai_auto_tag_applied","Auto Tag proposal applied",None,None,"INFO",{"task_id":task_id,"placements":len(changes),"catalog_revision":self.catalog_revision()});return self.public(self.row(task_id),True)
