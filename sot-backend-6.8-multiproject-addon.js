/* SOT 0.4.1 / 6.8 global multi-project scheduler + inventory reporting */
const MP_BUILD='2026.08.19.6.8-wsl-multiproject-reporting';
const MP_WORKERS=4;
const mpRuntime={running:false,workers:Array.from({length:MP_WORKERS},(_,i)=>({worker_id:i+1,project_token:null,run_id:null,phase:'idle',path:'',item:'',started_at:null}))};
function mpNow(){return new Date().toISOString();}
function mpSleep(ms){return new Promise(r=>setTimeout(r,ms));}
function mpEnsureSchema(){
 parallelEnsureSchema();
 sql(`CREATE TABLE IF NOT EXISTS mp_queue(
  project_token TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'WIP',
  phase TEXT NOT NULL DEFAULT 'indexing',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  fingerprint_started_at TEXT,
  last_error TEXT
 );
 CREATE INDEX IF NOT EXISTS idx_mp_queue_state_updated ON mp_queue(state,updated_at);`);
}
function mpQueueRow(projectToken){return rows(`SELECT * FROM mp_queue WHERE project_token=${esc(projectToken)} LIMIT 1`)[0]||null;}
function mpRunRow(runId){return rows(`SELECT * FROM runs WHERE run_id=${esc(runId)} LIMIT 1`)[0]||null;}
function mpTotals(runId){
 const f=rows(`SELECT COUNT(*) files,COALESCE(SUM(size),0) bytes,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) done,SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) errors,COALESCE(SUM(CASE WHEN status='done' THEN size ELSE 0 END),0) bytes_done FROM fingerprint_inventory WHERE run_id=${esc(runId)}`)[0]||{};
 const d=rows(`SELECT COUNT(*) folders,SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) folders_done,SUM(CASE WHEN status='error' THEN 1 ELSE 0 END) folder_errors FROM fingerprint_dirs WHERE run_id=${esc(runId)}`)[0]||{};
 return {files:Number(f.files||0),bytes:Number(f.bytes||0),done:Number(f.done||0),errors:Number(f.errors||0),bytes_done:Number(f.bytes_done||0),folders:Number(d.folders||0),folders_done:Number(d.folders_done||0),folder_errors:Number(d.folder_errors||0)};
}
function mpSummary(projectToken,runId){
 const q=mpQueueRow(projectToken),r=mpRunRow(runId),t=mpTotals(runId);
 const phase=q?.phase||((t.folders&&t.folders_done>=t.folders)?'fingerprinting':'indexing');
 const startedMs=Date.parse(q?.fingerprint_started_at||r?.started_at||'')||0,elapsed=startedMs?Math.max(0,(Date.now()-startedMs)/1000):0;
 const bps=elapsed>0?t.bytes_done/elapsed:0,remaining=Math.max(0,t.bytes-t.bytes_done),eta=bps>0?remaining/bps:null;
 const bytePct=t.bytes?Math.min(100,t.bytes_done/t.bytes*100):0,filePct=t.files?Math.min(100,(t.done+t.errors)/t.files*100):0;
 return {project_token:projectToken,run_id:runId,state:q?.state||r?.status||'Pending',phase,totals:t,progress:{bytes_percent:bytePct,files_percent:filePct,bytes_per_second:bps,eta_seconds:eta},run:r||null};
}
function mpSetWorker(id,data){mpRuntime.workers[id-1]={worker_id:id,project_token:null,run_id:null,phase:'idle',path:'',item:'',started_at:null,...data};}
function mpActiveQueue(){return rows("SELECT * FROM mp_queue WHERE state='WIP' ORDER BY updated_at ASC,created_at ASC");}
function mpTouch(projectToken){sql(`UPDATE mp_queue SET updated_at=${esc(mpNow())} WHERE project_token=${esc(projectToken)};`);}
function mpCreateRun(projectToken,restart=false){
 const p=project(projectToken);if(!p)throw new Error('project not found');
 const existing=mpQueueRow(projectToken);if(existing&&existing.state==='WIP'&&!restart)throw new Error('project is already scheduled');
 const runId=token(),now=mpNow();
 sql(`INSERT INTO runs(run_id,project_token,started_at,status,checkpoint_state,progress_percent,files_total,files_done,bytes_done) VALUES(${esc(runId)},${esc(projectToken)},${esc(now)},'WIP',${esc(JSON.stringify({phase:'indexing',scheduler:'global',worker_pool:MP_WORKERS}))},0,0,0,0);
 UPDATE projects SET current_run_id=${esc(runId)},status='WIP',current_stage='indexing',updated_at=${esc(now)} WHERE project_token=${esc(projectToken)};
 INSERT OR REPLACE INTO mp_queue(project_token,run_id,state,phase,created_at,updated_at,fingerprint_started_at,last_error) VALUES(${esc(projectToken)},${esc(runId)},'WIP','indexing',${esc(now)},${esc(now)},NULL,NULL);`);
 parallelSeed(projectToken,runId,p);parallelResetActive(runId);
 recoveryLog('info','scheduler','project.queued',{worker_pool:MP_WORKERS,restart:!!restart},projectToken,runId);
 mpWake();return {project_token:projectToken,run_id:runId,status:'WIP',scheduler:'global'};
}
function mpContinue(projectToken){
 const p=project(projectToken);if(!p||!p.current_run_id)throw new Error('no checkpointed run');const runId=p.current_run_id;
 const n=Number(rows(`SELECT (SELECT COUNT(*) FROM fingerprint_dirs WHERE run_id=${esc(runId)})+(SELECT COUNT(*) FROM fingerprint_inventory WHERE run_id=${esc(runId)}) n`)[0]?.n||0);if(!n)throw new Error('no durable checkpoint exists — use Restart');
 parallelResetActive(runId);const t=mpTotals(runId),phase=(t.folders&&t.folders_done>=t.folders)?'fingerprinting':'indexing',now=mpNow();
 sql(`INSERT OR REPLACE INTO mp_queue(project_token,run_id,state,phase,created_at,updated_at,fingerprint_started_at,last_error) VALUES(${esc(projectToken)},${esc(runId)},'WIP',${esc(phase)},COALESCE((SELECT created_at FROM mp_queue WHERE project_token=${esc(projectToken)}),${esc(now)}),${esc(now)},CASE WHEN ${esc(phase)}='fingerprinting' THEN COALESCE((SELECT fingerprint_started_at FROM mp_queue WHERE project_token=${esc(projectToken)}),${esc(now)}) ELSE NULL END,NULL);
 UPDATE runs SET status='WIP',ended_at=NULL WHERE run_id=${esc(runId)};UPDATE projects SET status='WIP',current_stage=${esc(phase)},updated_at=${esc(now)} WHERE project_token=${esc(projectToken)};`);
 mpWake();return {project_token:projectToken,run_id:runId,status:'WIP',resumed:true,scheduler:'global'};
}
function mpPause(projectToken){const q=mpQueueRow(projectToken);if(!q)throw new Error('project is not scheduled');const now=mpNow();sql(`UPDATE mp_queue SET state='Paused',updated_at=${esc(now)} WHERE project_token=${esc(projectToken)};UPDATE runs SET status='Paused',checkpoint_state=${esc(JSON.stringify({phase:q.phase,scheduler:'global',worker_pool:MP_WORKERS}))} WHERE run_id=${esc(q.run_id)};UPDATE projects SET status='Paused',updated_at=${esc(now)} WHERE project_token=${esc(projectToken)};`);recoveryLog('info','scheduler','project.paused',{},projectToken,q.run_id);return {status:'Paused'};}
async function mpIndexOne(q,workerId){
 const d=parallelClaimDir(q.run_id,workerId);if(!d){
  const active=Number(rows(`SELECT COUNT(*) n FROM fingerprint_dirs WHERE run_id=${esc(q.run_id)} AND status='active'`)[0]?.n||0),pending=Number(rows(`SELECT COUNT(*) n FROM fingerprint_dirs WHERE run_id=${esc(q.run_id)} AND status='pending'`)[0]?.n||0);if(active||pending)return false;
  const t=mpTotals(q.run_id),now=mpNow();sql(`UPDATE mp_queue SET phase='fingerprinting',fingerprint_started_at=COALESCE(fingerprint_started_at,${esc(now)}),updated_at=${esc(now)} WHERE project_token=${esc(q.project_token)};UPDATE runs SET files_total=${t.files},files_done=${t.done},bytes_done=${t.bytes_done},status='WIP',checkpoint_state=${esc(JSON.stringify({phase:'fingerprinting',scheduler:'global',worker_pool:MP_WORKERS,bytes_total:t.bytes}))} WHERE run_id=${esc(q.run_id)};UPDATE projects SET current_stage='fingerprinting',updated_at=${esc(now)} WHERE project_token=${esc(q.project_token)};`);return true;
 }
 const started=Date.now();mpSetWorker(workerId,{project_token:q.project_token,run_id:q.run_id,phase:'indexing',path:d.dir_path,item:'',started_at:mpNow()});
 let ents=[];try{ents=await fsp.readdir(d.dir_path,{withFileTypes:true})}catch(e){sql(`UPDATE fingerprint_dirs SET status='error',error=${esc(e.message)},worker_id=NULL,ended_at=${esc(mpNow())} WHERE run_id=${esc(q.run_id)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);recoveryLog('warn','indexing','directory.unreadable',{error:e.message,worker_id:workerId},q.project_token,q.run_id,d.dir_path);return true;}
 let localFiles=0,localBytes=0,last='';
 for(const e of ents){const still=mpQueueRow(q.project_token);if(!still||still.state!=='WIP'){sql(`UPDATE fingerprint_dirs SET status='pending',worker_id=NULL,current_item=${esc(last)} WHERE run_id=${esc(q.run_id)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);return true;}const full=path.join(d.dir_path,e.name),rel=d.relative_dir?d.relative_dir+'/'+e.name:e.name;last=e.name;mpSetWorker(workerId,{project_token:q.project_token,run_id:q.run_id,phase:'indexing',path:d.dir_path,item:e.name,started_at:mpRuntime.workers[workerId-1].started_at});try{if(e.isDirectory())sql(`INSERT OR IGNORE INTO fingerprint_dirs(run_id,project_token,source_id,dir_path,relative_dir,status,files_seen,bytes_seen,elapsed_seconds) VALUES(${esc(q.run_id)},${esc(q.project_token)},${esc(d.source_id)},${esc(full)},${esc(rel)},'pending',0,0,0);`);else if(e.isFile()){const st=await fsp.stat(full);localFiles++;localBytes+=Number(st.size||0);sql(`INSERT OR IGNORE INTO fingerprint_inventory(run_id,project_token,source_id,relative_path,full_path,size,modified_at,status,discovered_at) VALUES(${esc(q.run_id)},${esc(q.project_token)},${esc(d.source_id)},${esc(rel)},${esc(full)},${Number(st.size||0)},${Number(st.mtimeMs||0)},'pending',${esc(mpNow())});`);}}catch(err){recoveryLog('warn','indexing','item.stat.error',{error:err.message,worker_id:workerId},q.project_token,q.run_id,full)}}
 sql(`UPDATE fingerprint_dirs SET status='done',worker_id=NULL,current_item=${esc(last)},files_seen=${localFiles},bytes_seen=${localBytes},ended_at=${esc(mpNow())},elapsed_seconds=elapsed_seconds+${(Date.now()-started)/1000} WHERE run_id=${esc(q.run_id)} AND source_id=${esc(d.source_id)} AND dir_path=${esc(d.dir_path)};`);mpTouch(q.project_token);return true;
}
async function mpFingerprintOne(q,workerId){
 const f=parallelClaimFile(q.run_id,workerId);if(!f){
  const active=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(q.run_id)} AND status='active'`)[0]?.n||0),pending=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(q.run_id)} AND status='pending'`)[0]?.n||0);if(active||pending)return false;
  const p=project(q.project_token);if(p)await parallelFinalize(q.project_token,q.run_id,p);sql(`UPDATE mp_queue SET state='Closed',phase='complete',updated_at=${esc(mpNow())} WHERE project_token=${esc(q.project_token)};`);return true;
 }
 mpSetWorker(workerId,{project_token:q.project_token,run_id:q.run_id,phase:'fingerprinting',path:f.full_path,item:f.relative_path,started_at:mpNow()});let hash=null,reuse=0,error=null;const prev=rows(`SELECT sha256,size,modified_at FROM manifests WHERE project_token=${esc(q.project_token)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)} LIMIT 1`)[0];
 try{if(prev&&Number(prev.size)===Number(f.size)&&Number(prev.modified_at)===Number(f.modified_at)&&prev.sha256){hash=prev.sha256;reuse=1}else hash=await hashPath(f.full_path)}catch(e){error=e}
 const now=mpNow();if(error){sql(`UPDATE fingerprint_inventory SET status='error',error=${esc(error.message)},hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(q.run_id)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};`);recoveryLog('error','fingerprinting','file.read.error',{error:error.message,code:error.code||'',worker_id:workerId},q.project_token,q.run_id,f.full_path)}else{const mid=crypto.createHash('sha256').update(q.project_token+'\0'+f.source_id+'\0'+f.relative_path).digest('hex');sql(`BEGIN;UPDATE fingerprint_inventory SET status='done',sha256=${esc(hash)},reused=${reuse},error=NULL,hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(q.run_id)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};INSERT OR REPLACE INTO manifests(manifest_id,project_token,source_id,relative_path,size,modified_at,sha256,inventory_at) VALUES(${esc(mid)},${esc(q.project_token)},${esc(f.source_id)},${esc(f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(hash)},${esc(now)});COMMIT;`)}
 const t=mpTotals(q.run_id),pct=t.bytes?Math.min(100,t.bytes_done/t.bytes*100):(t.files?Math.min(100,(t.done+t.errors)/t.files*100):0);sql(`UPDATE runs SET files_total=${t.files},files_done=${t.done},bytes_done=${t.bytes_done},progress_percent=${pct},error_count=${t.errors},checkpoint_state=${esc(JSON.stringify({phase:'fingerprinting',scheduler:'global',worker_pool:MP_WORKERS,bytes_total:t.bytes}))} WHERE run_id=${esc(q.run_id)};`);mpTouch(q.project_token);return true;
}
async function mpWorker(workerId){
 while(true){const qs=mpActiveQueue();if(!qs.length){mpSetWorker(workerId,{});return;}let did=false;for(const q of qs){const fresh=mpQueueRow(q.project_token);if(!fresh||fresh.state!=='WIP')continue;try{did=(fresh.phase==='indexing'?await mpIndexOne(fresh,workerId):await mpFingerprintOne(fresh,workerId))||did;}catch(e){sql(`UPDATE mp_queue SET state='Error',last_error=${esc(e.message)},updated_at=${esc(mpNow())} WHERE project_token=${esc(fresh.project_token)};UPDATE runs SET status='Error',ended_at=${esc(mpNow())} WHERE run_id=${esc(fresh.run_id)};UPDATE projects SET status='Error',updated_at=${esc(mpNow())} WHERE project_token=${esc(fresh.project_token)};`);recoveryLog('error','scheduler','worker.error',{error:e.message,worker_id:workerId},fresh.project_token,fresh.run_id)}if(did)break;}if(!did)await mpSleep(80);}
}
function mpWake(){if(mpRuntime.running)return;mpRuntime.running=true;setImmediate(async()=>{try{await Promise.all(Array.from({length:MP_WORKERS},(_,i)=>mpWorker(i+1)))}finally{mpRuntime.running=false;mpRuntime.workers.forEach((_,i)=>mpSetWorker(i+1,{}));if(mpActiveQueue().length)setTimeout(mpWake,100)}});}
function mpLatestRun(projectToken){const p=project(projectToken);return p?.current_run_id||rows(`SELECT run_id FROM runs WHERE project_token=${esc(projectToken)} ORDER BY started_at DESC LIMIT 1`)[0]?.run_id||null;}
function mpFolderRows(projectToken){const runId=mpLatestRun(projectToken);if(!runId)return [];const inv=rows(`SELECT source_id,relative_path,size,modified_at,status FROM fingerprint_inventory WHERE run_id=${esc(runId)} ORDER BY source_id,relative_path`),m=new Map();for(const x of inv){const i=x.relative_path.lastIndexOf('/'),folder=i>=0?x.relative_path.slice(0,i):'(root)',key=x.source_id+'\0'+folder,o=m.get(key)||{source_id:x.source_id,folder,file_count:0,size_bytes:0,modified_at:0,done:0,errors:0};o.file_count++;o.size_bytes+=Number(x.size||0);o.modified_at=Math.max(o.modified_at,Number(x.modified_at||0));if(x.status==='done')o.done++;if(x.status==='error')o.errors++;m.set(key,o)}return [...m.values()].sort((a,b)=>a.folder.localeCompare(b.folder));}
function mpFileRows(projectToken,url){const runId=mpLatestRun(projectToken);if(!runId)return {run_id:null,total:0,rows:[]};const folder=url.searchParams.get('folder')||'',q=(url.searchParams.get('q')||'').toLowerCase(),sort=url.searchParams.get('sort')||'filename',dir=url.searchParams.get('dir')==='desc'?-1:1,limit=Math.max(1,Math.min(1000,Number(url.searchParams.get('limit')||250))),offset=Math.max(0,Number(url.searchParams.get('offset')||0));let inv=rows(`SELECT source_id,relative_path,full_path,size,modified_at,sha256,status,error,hashed_at FROM fingerprint_inventory WHERE run_id=${esc(runId)} ORDER BY relative_path`);inv=inv.map(x=>({...x,filename:x.relative_path.split('/').pop()||x.relative_path,folder:x.relative_path.includes('/')?x.relative_path.slice(0,x.relative_path.lastIndexOf('/')):'(root)'})).filter(x=>(!folder||x.folder===folder)&&(!q||[x.filename,x.relative_path,x.sha256,x.status].some(v=>String(v||'').toLowerCase().includes(q))));const key={filename:'filename',path:'relative_path',size:'size',modified:'modified_at',hash:'sha256',status:'status'}[sort]||'filename';inv.sort((a,b)=>{const av=a[key],bv=b[key];return((typeof av==='number'&&typeof bv==='number')?av-bv:String(av||'').localeCompare(String(bv||'')))*dir});return {run_id:runId,total:inv.length,rows:inv.slice(offset,offset+limit)};}

const mpBaseHandle=handle;
handle=async function(req,res,url){const pn=url.pathname;try{
 if(!pn.startsWith('/api/sot/'))return mpBaseHandle(req,res,url);mpEnsureSchema();
 if(pn==='/api/sot/health'&&req.method==='GET'){json(res,200,{service:'sot',status:'ok',version:VERSION,build:MP_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','parallel-fingerprint','durable-file-inventory','inventory-reporting','db-admin','diagnostic-log']});return true}
 if(pn==='/api/sot/scheduler/status'&&req.method==='GET'){const queue=rows("SELECT * FROM mp_queue WHERE state IN ('WIP','Paused','Error') ORDER BY updated_at DESC").map(q=>mpSummary(q.project_token,q.run_id));json(res,200,{build:MP_BUILD,worker_pool:MP_WORKERS,running:mpRuntime.running,workers:mpRuntime.workers,queue});return true}
 let m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/fingerprint\/(start|restart|continue|pause)$/);if(m&&req.method==='POST'){const t=decodeURIComponent(m[1]),a=m[2];const out=a==='start'?mpCreateRun(t,false):a==='restart'?mpCreateRun(t,true):a==='continue'?mpContinue(t):mpPause(t);json(res,200,out);return true}
 m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/fingerprint\/status$/);if(m&&req.method==='GET'){const t=decodeURIComponent(m[1]),p=project(t),runId=mpLatestRun(t);if(!p){json(res,404,{error:'project not found'});return true}const s=runId?mpSummary(t,runId):null;json(res,200,{project:p,run:s?.run||null,job:s?{phase:s.phase,worker_count:MP_WORKERS,workers:mpRuntime.workers.filter(w=>w.project_token===t)}:null,totals:s?.totals||{},progress:s?.progress||{},has_checkpoint:!!runId,scheduler:'global'});return true}
 m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/inventory\/folders$/);if(m&&req.method==='GET'){json(res,200,{project_token:decodeURIComponent(m[1]),folders:mpFolderRows(decodeURIComponent(m[1]))});return true}
 m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/inventory\/files$/);if(m&&req.method==='GET'){json(res,200,mpFileRows(decodeURIComponent(m[1]),url));return true}
 return mpBaseHandle(req,res,url);
}catch(e){try{recoveryLog('error','api','6.8.request.error',{method:req.method,path:pn,error:e.message})}catch{}json(res,500,{error:e.message,code:e.code||null});return true}};
mpEnsureSchema();
