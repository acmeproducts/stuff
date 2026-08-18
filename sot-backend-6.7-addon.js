/* SOT 0.4.1 / 6.7 parallel indexing override */
const PARALLEL_BUILD='2026.08.18.6.7-wsl-parallel';
const PARALLEL_WORKERS=4;

// Harden sqlite CLI calls against ENOBUFS and transient WAL contention.
sql=function(q,db=cfg().database_path){fs.mkdirSync(path.dirname(db),{recursive:true});return execFileSync('sqlite3',['-json',db,'PRAGMA busy_timeout=5000;'+q],{encoding:'utf8',maxBuffer:64*1024*1024,timeout:120000}).trim();};

function parallelNow(){return new Date().toISOString();}
function parallelEnsureSchema(){
 ensureRecoverySchema();
 sql(`CREATE TABLE IF NOT EXISTS setup_draft(draft_key TEXT PRIMARY KEY,payload TEXT NOT NULL,updated_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_diag_log_id ON diagnostic_log(log_id DESC);`);
 for(const [c,d] of [
  ['current_item','TEXT'],['files_seen','INTEGER NOT NULL DEFAULT 0'],['bytes_seen','INTEGER NOT NULL DEFAULT 0'],
  ['started_at','TEXT'],['ended_at','TEXT'],['elapsed_seconds','REAL NOT NULL DEFAULT 0'],['worker_id','INTEGER']
 ]){try{ensureColumn('fingerprint_dirs',c,d)}catch{}}
 try{ensureColumn('fingerprint_inventory','worker_id','INTEGER')}catch{}
 try{ensureColumn('fingerprint_inventory','started_at','TEXT')}catch{}
}

function parallelWindowsDriveLetters(){
 const found=new Set();
 try{for(const n of fs.readdirSync('/mnt'))if(/^[a-z]$/i.test(n))found.add(n.toLowerCase())}catch{}
 const ps='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
 try{
  if(fs.existsSync(ps)){
   const out=execFileSync(ps,['-NoProfile','-Command',"[System.IO.DriveInfo]::GetDrives() | Where-Object {$_.Name -match '^[A-Z]:\\\\$'} | ForEach-Object {$_.Name.Substring(0,1)}"],{encoding:'utf8',timeout:5000,maxBuffer:1024*1024});
   for(const s of out.split(/\r?\n/)){const l=s.trim().toLowerCase();if(/^[a-z]$/.test(l))found.add(l)}
  }
 }catch(e){recoveryLog('warn','fs','windows.volume.discovery.failed',{error:e.message})}
 return [...found].sort();
}
roots=function(){
 const out=[];
 for(const letter of parallelWindowsDriveLetters()){
  const p='/mnt/'+letter;let available=false,error='';
  try{available=fs.statSync(p).isDirectory()}catch(e){error=e.code||e.message}
  if(!available)recoveryLog('warn','fs','volume.unavailable',{drive:letter.toUpperCase()+':',path:p,error},null,null,p);
  out.push({id:'wsl:'+p,name:letter.toUpperCase()+':',label:letter.toUpperCase()+':',path:p,kind:'storage',available,error:error||null});
 }
 out.push({id:'wsl:'+HOME,name:'WSL Home',label:'WSL Home',path:HOME,kind:'storage',available:true,error:null});
 return out;
};

// Project Setup is shallow: immediate child folders only; root files are ignored.
recoveryBrowse=async function(p,force=false){
 if(!p||p==='/')return {path:'/',parent:'/',locations:roots(),folders:[],files:[],cached:false,status:'Ready'};
 const rp=safePath(p),key=crypto.createHash('sha256').update('shallow:'+rp).digest('hex');
 let ents;
 try{ents=await fsp.readdir(rp,{withFileTypes:true})}catch(e){recoveryLog('error','project-setup','folder.list.error',{error:e.message},null,null,rp);throw e}
 const folders=[];
 for(const e of ents){if(!e.isDirectory())continue;const full=path.join(rp,e.name);let last=null;try{last=(await fsp.stat(full)).mtimeMs}catch{}folders.push({name:e.name,path:full,bytes:null,files:null,folders:1,last})}
 folders.sort((a,b)=>a.name.localeCompare(b.name));
 const payload={path:rp,parent:path.dirname(rp),folders,files:[]};
 try{sql(`INSERT OR REPLACE INTO fs_scope_cache(cache_key,path,signature,payload,updated_at) VALUES(${esc(key)},${esc(rp)},'shallow-v1',${esc(JSON.stringify(payload))},${esc(parallelNow())});`)}catch{}
 recoveryLog('info','project-setup','folder.list',{folders:folders.length,root_files_ignored:true},null,null,rp);
 return {...payload,cached:false,status:`Ready · ${folders.length} folders`};
};

function parallelResetActive(runId){
 sql(`UPDATE fingerprint_dirs SET status='pending',worker_id=NULL,current_item=NULL WHERE run_id=${esc(runId)} AND status='active';
 UPDATE fingerprint_inventory SET status='pending',worker_id=NULL WHERE run_id=${esc(runId)} AND status='active';`);
}
function parallelSeed(projectToken,runId,p){
 const n=Number(rows(`SELECT COUNT(*) n FROM fingerprint_dirs WHERE run_id=${esc(runId)}`)[0]?.n||0);if(n)return;
 for(const s of p.sources||[]){if(s.source_type!=='wsl_path')continue;sql(`INSERT OR IGNORE INTO fingerprint_dirs(run_id,project_token,source_id,dir_path,relative_dir,status,files_seen,bytes_seen,elapsed_seconds) VALUES(${esc(runId)},${esc(projectToken)},${esc(s.id)},${esc(s.path)},'','pending',0,0,0);`)}
}
function parallelClaimDir(runId,workerId){
 const x=sql(`UPDATE fingerprint_dirs SET status='active',worker_id=${workerId},started_at=COALESCE(started_at,${esc(parallelNow())}),ended_at=NULL
 WHERE rowid=(SELECT rowid FROM fingerprint_dirs WHERE run_id=${esc(runId)} AND status='pending' ORDER BY source_id,relative_dir LIMIT 1)
 RETURNING *;`);return parseRows(x)[0]||null;
}
function parallelClaimFile(runId,workerId){
 const x=sql(`UPDATE fingerprint_inventory SET status='active',worker_id=${workerId},started_at=COALESCE(started_at,${esc(parallelNow())})
 WHERE rowid=(SELECT rowid FROM fingerprint_inventory WHERE run_id=${esc(runId)} AND status='pending' ORDER BY source_id,relative_path LIMIT 1)
 RETURNING *;`);return parseRows(x)[0]||null;
}
function parallelTotals(runId){
 const f=rows(`SELECT COUNT(*) files,COALESCE(SUM(size),0) bytes,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done,SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) errors FROM fingerprint_inventory WHERE run_id=${esc(runId)}`)[0]||{};
 const d=rows(`SELECT COUNT(*) folders,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) folders_done FROM fingerprint_dirs WHERE run_id=${esc(runId)}`)[0]||{};
 return {folders:Number(d.folders||0),folders_done:Number(d.folders_done||0),files:Number(f.files||0),bytes:Number(f.bytes||0),done:Number(f.done||0),errors:Number(f.errors||0)};
}
async function parallelIndexWorker(projectToken,runId,job,p,workerId){
 for(;;){
  if(job.stop)return;
  const d=parallelClaimDir(runId,workerId);if(!d)return;
  const started=Date.now();job.workers[workerId-1]={worker_id:workerId,phase:'indexing',folder:d.dir_path,item:'',started_at:d.started_at,files:0,bytes:0};
  let ents=[];
  try{ents=await fsp.readdir(d.dir_path,{withFileTypes:true})}catch(e){
   sql(`UPDATE fingerprint_dirs SET status='error',error=${esc(e.message)},ended_at=${esc(parallelNow())},elapsed_seconds=elapsed_seconds+${(Date.now()-started)/60000} WHERE run_id=${esc(runId)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);
   recoveryLog('warn','indexing','directory.unreadable',{error:e.message,worker_id:workerId},projectToken,runId,d.dir_path);continue;
  }
  let localFiles=0,localBytes=0;
  for(const e of ents){
   if(job.stop)break;
   const full=path.join(d.dir_path,e.name),rel=d.relative_dir?d.relative_dir+'/'+e.name:e.name;
   job.workers[workerId-1].item=e.name;
   try{
    if(e.isDirectory())sql(`INSERT OR IGNORE INTO fingerprint_dirs(run_id,project_token,source_id,dir_path,relative_dir,status,files_seen,bytes_seen,elapsed_seconds) VALUES(${esc(runId)},${esc(projectToken)},${esc(d.source_id)},${esc(full)},${esc(rel)},'pending',0,0,0);`);
    else if(e.isFile()){
     const st=await fsp.stat(full);localFiles++;localBytes+=Number(st.size||0);
     sql(`INSERT OR IGNORE INTO fingerprint_inventory(run_id,project_token,source_id,relative_path,full_path,size,modified_at,status,discovered_at) VALUES(${esc(runId)},${esc(projectToken)},${esc(d.source_id)},${esc(rel)},${esc(full)},${Number(st.size||0)},${Number(st.mtimeMs||0)},'pending',${esc(parallelNow())});`);
    }
   }catch(err){recoveryLog('warn','indexing','item.stat.error',{error:err.message,worker_id:workerId},projectToken,runId,full)}
   job.workers[workerId-1].files=localFiles;job.workers[workerId-1].bytes=localBytes;
   if((localFiles%25)===0)sql(`UPDATE fingerprint_dirs SET current_item=${esc(e.name)},files_seen=${localFiles},bytes_seen=${localBytes},elapsed_seconds=${(Date.now()-started)/60000} WHERE run_id=${esc(runId)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);
  }
  const status=job.stop?'pending':'done',end=job.stop?'NULL':esc(parallelNow());
  sql(`UPDATE fingerprint_dirs SET status=${esc(status)},worker_id=NULL,current_item=${esc(job.workers[workerId-1].item||'')},files_seen=${localFiles},bytes_seen=${localBytes},ended_at=${end},elapsed_seconds=elapsed_seconds+${(Date.now()-started)/60000} WHERE run_id=${esc(runId)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);
  job.workers[workerId-1]={worker_id:workerId,phase:'indexing',folder:'',item:'',files:0,bytes:0};
 }
}
async function parallelIndex(projectToken,runId,job,p){
 parallelEnsureSchema();parallelResetActive(runId);parallelSeed(projectToken,runId,p);job.phase='indexing';job.worker_count=PARALLEL_WORKERS;job.workers=Array.from({length:PARALLEL_WORKERS},(_,i)=>({worker_id:i+1,phase:'indexing',folder:'',item:'',files:0,bytes:0}));
 recoveryLog('info','indexing','workers.started',{workers:PARALLEL_WORKERS},projectToken,runId);
 await Promise.all(Array.from({length:PARALLEL_WORKERS},(_,i)=>parallelIndexWorker(projectToken,runId,job,p,i+1)));
 if(job.stop)throw new Error('__STOP__');
 const t=parallelTotals(runId);job.files_total=t.files;job.bytes_total=t.bytes;job.folders_total=t.folders;job.folders_done=t.folders_done;
 sql(`UPDATE runs SET files_total=${t.files},files_done=${t.done},bytes_done=(SELECT COALESCE(SUM(size),0) FROM fingerprint_inventory WHERE run_id=${esc(runId)} AND status='done'),status='WIP',checkpoint_state=${esc(JSON.stringify({phase:'fingerprinting',folders:t.folders,files:t.files,bytes:t.bytes,worker_count:PARALLEL_WORKERS}))} WHERE run_id=${esc(runId)};`);
 recoveryLog('info','indexing','complete',{folders:t.folders,files:t.files,bytes:t.bytes},projectToken,runId);
 return t;
}
async function parallelFingerprintWorker(projectToken,runId,job,workerId){
 for(;;){
  if(job.stop)return;
  const f=parallelClaimFile(runId,workerId);if(!f)return;
  const src=rows(`SELECT operator_label FROM sources WHERE source_id=${esc(f.source_id)} LIMIT 1`)[0]?.operator_label||f.source_id;
  job.workers[workerId-1]={worker_id:workerId,phase:'fingerprinting',folder:src,item:f.relative_path,started_at:f.started_at,files:job.files_done||0,bytes:job.bytes_done||0};
  let hash=null,reuse=0,error=null;const prev=rows(`SELECT sha256,size,modified_at FROM manifests WHERE project_token=${esc(projectToken)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)} LIMIT 1`)[0];
  try{if(prev&&Number(prev.size)===Number(f.size)&&Number(prev.modified_at)===Number(f.modified_at)&&prev.sha256){hash=prev.sha256;reuse=1}else hash=await hashPath(f.full_path)}catch(e){error=e}
  const now=parallelNow();
  if(error){sql(`UPDATE fingerprint_inventory SET status='error',error=${esc(error.message)},hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(runId)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};`);recoveryLog('error','fingerprinting','file.read.error',{error:error.message,code:error.code||'',worker_id:workerId},projectToken,runId,f.full_path)}
  else{
   const mid=crypto.createHash('sha256').update(projectToken+'\0'+f.source_id+'\0'+f.relative_path).digest('hex');
   sql(`BEGIN;UPDATE fingerprint_inventory SET status='done',sha256=${esc(hash)},reused=${reuse},error=NULL,hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(runId)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};INSERT OR REPLACE INTO manifests(manifest_id,project_token,source_id,relative_path,size,modified_at,sha256,inventory_at) VALUES(${esc(mid)},${esc(projectToken)},${esc(f.source_id)},${esc(f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(hash)},${esc(now)});COMMIT;`);
  }
  const t=parallelTotals(runId),bytesDone=Number(rows(`SELECT COALESCE(SUM(size),0) n FROM fingerprint_inventory WHERE run_id=${esc(runId)} AND status='done'`)[0]?.n||0),processed=t.done+t.errors,pct=t.files?processed/t.files*100:100;
  job.files_done=t.done;job.error_count=t.errors;job.bytes_done=bytesDone;job.progress=pct;job.files_reused=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(runId)} AND status='done' AND reused=1`)[0]?.n||0);
  sql(`UPDATE runs SET files_done=${t.done},bytes_done=${bytesDone},progress_percent=${pct},error_count=${t.errors},checkpoint_state=${esc(JSON.stringify({phase:'fingerprinting',folders:t.folders,files:t.files,bytes:t.bytes,worker_count:PARALLEL_WORKERS}))} WHERE run_id=${esc(runId)};`);
 }
}
async function parallelFinalize(projectToken,runId,p){
 await recoveryFinalize(projectToken,runId,p);
 const t=parallelTotals(runId),end=parallelNow(),status=t.errors?'ClosedWithErrors':'Closed',pstatus=t.errors?'NeedsAttention':'Closed';
 sql(`UPDATE runs SET status=${esc(status)},ended_at=${esc(end)},progress_percent=100,error_count=${t.errors},checkpoint_state=NULL WHERE run_id=${esc(runId)};UPDATE projects SET status=${esc(pstatus)},current_stage='fingerprinted',updated_at=${esc(end)} WHERE project_token=${esc(projectToken)};`);
 recoveryLog(t.errors?'warn':'info','fingerprinting','complete',{workers:PARALLEL_WORKERS,files:t.files,errors:t.errors},projectToken,runId);
}
runFingerprintJob=async function(projectToken,runId){
 parallelEnsureSchema();const job=jobs.get(runId);if(!job)return;const started=Date.now();job.worker_count=PARALLEL_WORKERS;job.workers=[];job.stop=false;
 try{
  const p=project(projectToken);if(!p)throw new Error('project not found');parallelResetActive(runId);
  const pendingDirs=Number(rows(`SELECT COUNT(*) n FROM fingerprint_dirs WHERE run_id=${esc(runId)} AND status IN ('pending','active')`)[0]?.n||0),inv=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(runId)}`)[0]?.n||0);
  if(pendingDirs||!inv)await parallelIndex(projectToken,runId,job,p);
  if(job.stop)throw new Error('__STOP__');
  job.phase='fingerprinting';job.workers=Array.from({length:PARALLEL_WORKERS},(_,i)=>({worker_id:i+1,phase:'fingerprinting',folder:'',item:'',files:0,bytes:0}));
  recoveryLog('info','fingerprinting','workers.started',{workers:PARALLEL_WORKERS},projectToken,runId);
  await Promise.all(Array.from({length:PARALLEL_WORKERS},(_,i)=>parallelFingerprintWorker(projectToken,runId,job,i+1)));
  if(job.stop)throw new Error('__STOP__');
  await parallelFinalize(projectToken,runId,p);job.status='Closed';job.phase='complete';job.progress=100;
 }catch(e){
  if(e.message==='__STOP__'){
   parallelResetActive(runId);const t=parallelTotals(runId),cp={phase:job.phase||'indexing',folders:t.folders,files:t.files,bytes:t.bytes,worker_count:PARALLEL_WORKERS};
   sql(`UPDATE runs SET status='Paused',checkpoint_state=${esc(JSON.stringify(cp))},files_total=${t.files},files_done=${t.done},progress_percent=${t.files?(t.done+t.errors)/t.files*100:0},error_count=${t.errors} WHERE run_id=${esc(runId)};UPDATE projects SET status='Paused',updated_at=${esc(parallelNow())} WHERE project_token=${esc(projectToken)};`);job.status='Paused';recoveryLog('info',job.phase||'indexing','paused',cp,projectToken,runId);
  }else{
   job.status='Error';job.error=e.message;sql(`UPDATE runs SET status='Error',ended_at=${esc(parallelNow())},checkpoint_state=${esc(JSON.stringify({phase:job.phase||'error',error:e.message,worker_count:PARALLEL_WORKERS}))} WHERE run_id=${esc(runId)};UPDATE projects SET status='Stopped',updated_at=${esc(parallelNow())} WHERE project_token=${esc(projectToken)};`);recoveryLog('error','parallel','run.error',{error:e.message},projectToken,runId);
  }
 }finally{job.elapsed_seconds=(Date.now()-started)/1000;setTimeout(()=>jobs.delete(runId),600000)}
};

fingerprintStatus=function(t){
 parallelEnsureSchema();const p=project(t);if(!p)return null;const run=p.current_run_id?rows(`SELECT * FROM runs WHERE run_id=${esc(p.current_run_id)} LIMIT 1`)[0]||null:null;let job=run?jobs.get(run.run_id)||null:null;
 let cp={};if(run?.checkpoint_state)try{cp=JSON.parse(run.checkpoint_state)}catch{}
 if(!job&&run)job={...cp,status:run.status,phase:cp.phase||run.status,files_total:Number(run.files_total||0),files_done:Number(run.files_done||0),bytes_done:Number(run.bytes_done||0),progress:Number(run.progress_percent||0),error_count:Number(run.error_count||0),workers:[],worker_count:PARALLEL_WORKERS};
 const hasCheckpoint=!!run&&Number(rows(`SELECT (SELECT COUNT(*) FROM fingerprint_dirs WHERE run_id=${esc(run.run_id)})+(SELECT COUNT(*) FROM fingerprint_inventory WHERE run_id=${esc(run.run_id)}) n`)[0]?.n||0)>0;
 const totals=run?parallelTotals(run.run_id):{folders:0,folders_done:0,files:0,bytes:0,done:0,errors:0};
 const folderRows=run?rows(`SELECT source_id,dir_path,relative_dir,status,current_item,files_seen,bytes_seen,started_at,ended_at,elapsed_seconds,worker_id,error FROM fingerprint_dirs WHERE run_id=${esc(run.run_id)} ORDER BY CASE status WHEN 'active' THEN 0 WHEN 'pending' THEN 1 ELSE 2 END,COALESCE(started_at,'') DESC LIMIT 200`):[];
 return {project:p,run,job,has_checkpoint:hasCheckpoint,totals,folder_rows:folderRows,worker_count:PARALLEL_WORKERS};
};

recoveryContinue=function(t){
 parallelEnsureSchema();const p=project(t);if(!p||!p.current_run_id)throw new Error('no checkpointed run');const r=rows(`SELECT * FROM runs WHERE run_id=${esc(p.current_run_id)} LIMIT 1`)[0];
 if(!r)throw new Error('run not found');if(jobs.get(r.run_id))throw new Error('run is already active');
 const n=Number(rows(`SELECT (SELECT COUNT(*) FROM fingerprint_dirs WHERE run_id=${esc(r.run_id)})+(SELECT COUNT(*) FROM fingerprint_inventory WHERE run_id=${esc(r.run_id)}) n`)[0]?.n||0);if(!n)throw new Error('no durable checkpoint exists — use Restart');
 parallelResetActive(r.run_id);let cp={};try{cp=JSON.parse(r.checkpoint_state||'{}')}catch{}
 sql(`UPDATE runs SET status='WIP',ended_at=NULL WHERE run_id=${esc(r.run_id)};UPDATE projects SET status='WIP',current_stage=${esc(cp.phase||'indexing')},updated_at=${esc(parallelNow())} WHERE project_token=${esc(t)};`);
 jobs.set(r.run_id,{run_id:r.run_id,project_token:t,status:'WIP',phase:cp.phase||'indexing',progress:Number(r.progress_percent||0),files_total:Number(r.files_total||0),files_done:Number(r.files_done||0),bytes_done:Number(r.bytes_done||0),error_count:Number(r.error_count||0),stop:false,worker_count:PARALLEL_WORKERS,workers:[]});setImmediate(()=>runFingerprintJob(t,r.run_id));return {run_id:r.run_id,status:'WIP',resumed:true};
};

const parallelBaseHandle=handle;
handle=async function(req,res,url){const pn=url.pathname;try{
 if(!pn.startsWith('/api/sot/'))return parallelBaseHandle(req,res,url);
 parallelEnsureSchema();
 if(pn==='/api/sot/health'&&req.method==='GET'){json(res,200,{service:'sot',status:'ok',version:VERSION,build:PARALLEL_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','parallel-indexing','parallel-fingerprint','manifest','db-admin','diagnostic-log']});return true}
 if(pn==='/api/sot/fs'&&req.method==='GET'){json(res,200,await recoveryBrowse(url.searchParams.get('path')||'/',url.searchParams.get('force')==='1'));return true}
 if(pn==='/api/sot/setup/draft'&&req.method==='GET'){const r=rows("SELECT payload,updated_at FROM setup_draft WHERE draft_key='default' LIMIT 1")[0];json(res,200,r?{...JSON.parse(r.payload),updated_at:r.updated_at}:{name:'',note:'',sources:[]});return true}
 if(pn==='/api/sot/setup/draft'&&req.method==='POST'){const b=await body(req),payload={name:String(b.name||''),note:String(b.note||''),sources:Array.isArray(b.sources)?b.sources:[]};sql(`INSERT OR REPLACE INTO setup_draft(draft_key,payload,updated_at) VALUES('default',${esc(JSON.stringify(payload))},${esc(parallelNow())});`);json(res,200,payload);return true}
 if(pn==='/api/sot/logs'&&req.method==='GET'){
  const level=url.searchParams.get('level'),q=url.searchParams.get('q'),projectToken=url.searchParams.get('project_token'),runId=url.searchParams.get('run_id'),limit=Math.max(1,Math.min(250,Number(url.searchParams.get('limit')||100))),offset=Math.max(0,Number(url.searchParams.get('offset')||0)),wh=[];
  if(level)wh.push(`level=${esc(level)}`);if(projectToken)wh.push(`project_token=${esc(projectToken)}`);if(runId)wh.push(`run_id=${esc(runId)}`);if(q)wh.push(`(event LIKE ${esc('%'+q+'%')} OR component LIKE ${esc('%'+q+'%')} OR detail LIKE ${esc('%'+q+'%')} OR path LIKE ${esc('%'+q+'%')})`);
  json(res,200,rows(`SELECT log_id,created_at,level,component,event,project_token,run_id,path,detail FROM diagnostic_log ${wh.length?'WHERE '+wh.join(' AND '):''} ORDER BY log_id DESC LIMIT ${limit} OFFSET ${offset}`));return true;
 }
 return parallelBaseHandle(req,res,url);
}catch(e){recoveryLog('error','api','parallel.request.error',{method:req.method,path:pn,error:e.message});json(res,500,{error:e.message});return true}};
