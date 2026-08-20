/* SOT 0.4.1 / 6.9 path-centric projects, global hash reuse, explorer index, analysis */
const PC_BUILD='2026.08.20.6.9-wsl-path-centric-analysis';
const pcVolumeCache=new Map();
const pcExplorerJobs=new Map();
function pcNow(){return new Date().toISOString();}
function pcEnsureSchema(){
 mpEnsureSchema();
 sql(`CREATE TABLE IF NOT EXISTS volume_observations(
  volume_id TEXT PRIMARY KEY, platform_identity TEXT, observed_locator TEXT NOT NULL,
  label TEXT, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL);
 CREATE INDEX IF NOT EXISTS idx_volume_locator ON volume_observations(observed_locator);
 CREATE TABLE IF NOT EXISTS path_catalog(
  path_id TEXT PRIMARY KEY, volume_id TEXT NOT NULL, relative_root TEXT NOT NULL,
  last_observed_locator TEXT NOT NULL, metadata_tree_sha256 TEXT, content_tree_sha256 TEXT,
  file_count INTEGER NOT NULL DEFAULT 0, folder_count INTEGER NOT NULL DEFAULT 0,
  byte_count INTEGER NOT NULL DEFAULT 0, last_indexed_at TEXT, last_fingerprinted_at TEXT,
  UNIQUE(volume_id,relative_root));
 CREATE TABLE IF NOT EXISTS project_paths(
  project_token TEXT NOT NULL, path_id TEXT NOT NULL, source_id TEXT,
  operator_label TEXT NOT NULL DEFAULT '', operator_note TEXT NOT NULL DEFAULT '',
  added_at TEXT NOT NULL, removed_at TEXT,
  PRIMARY KEY(project_token,path_id));
 CREATE INDEX IF NOT EXISTS idx_project_paths_active ON project_paths(project_token,removed_at);
 CREATE TABLE IF NOT EXISTS file_catalog(
  sha256 TEXT PRIMARY KEY, size INTEGER NOT NULL, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS file_observations(
  path_id TEXT NOT NULL, relative_path TEXT NOT NULL, filename TEXT NOT NULL,
  full_path TEXT, size INTEGER NOT NULL, modified_at REAL NOT NULL, sha256 TEXT,
  status TEXT NOT NULL, observed_at TEXT NOT NULL,
  PRIMARY KEY(path_id,relative_path));
 CREATE INDEX IF NOT EXISTS idx_file_obs_sha ON file_observations(sha256);
 CREATE INDEX IF NOT EXISTS idx_file_obs_path ON file_observations(path_id,relative_path);
 CREATE TABLE IF NOT EXISTS file_hash_cache(
  path_id TEXT NOT NULL, relative_path TEXT NOT NULL, size INTEGER NOT NULL,
  modified_at REAL NOT NULL, sha256 TEXT NOT NULL, verified_at TEXT NOT NULL,
  PRIMARY KEY(path_id,relative_path,size,modified_at));
 CREATE TABLE IF NOT EXISTS explorer_index(
  root_locator TEXT PRIMARY KEY, state TEXT NOT NULL, current_path TEXT,
  folders_seen INTEGER NOT NULL DEFAULT 0, files_seen INTEGER NOT NULL DEFAULT 0,
  bytes_seen INTEGER NOT NULL DEFAULT 0, started_at TEXT, updated_at TEXT, completed_at TEXT, error TEXT);
 CREATE TABLE IF NOT EXISTS explorer_entries(
  root_locator TEXT NOT NULL, full_path TEXT NOT NULL, parent_path TEXT NOT NULL,
  name TEXT NOT NULL, kind TEXT NOT NULL, size INTEGER, modified_at REAL,
  PRIMARY KEY(root_locator,full_path));
 CREATE INDEX IF NOT EXISTS idx_explorer_parent ON explorer_entries(root_locator,parent_path);`);
 for(const t of ['volume_observations','path_catalog','project_paths','file_catalog','file_observations','file_hash_cache','explorer_index','explorer_entries'])TABLE_ALLOW.add(t);
}
function pcBlockedPath(p){return String(p||'').split(/[\\/]+/).some(x=>x.toUpperCase()==='$RECYCLE.BIN');}
function pcAssertPath(p){if(pcBlockedPath(p))throw new Error('$RECYCLE.BIN is a system path and cannot be added to a project');}
function pcDriveRoot(locator){const m=String(locator||'').match(/^\/mnt\/([a-z])(?:\/|$)/i);return m?'/mnt/'+m[1].toLowerCase():null;}
function pcWindowsVolumeIdentity(root){
 if(!root)return null;if(pcVolumeCache.has(root))return pcVolumeCache.get(root);
 const letter=root.slice(-1).toUpperCase(),ps='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';let id=null;
 try{if(fs.existsSync(ps)){const cmd=`$v=Get-Volume -DriveLetter '${letter}' -ErrorAction SilentlyContinue; if($v){ $u=$v.UniqueId; $s=$v.SerialNumber; $f=$v.FileSystem; Write-Output ($u+'|'+$s+'|'+$f) }`;const out=execFileSync(ps,['-NoProfile','-Command',cmd],{encoding:'utf8',timeout:7000,maxBuffer:1024*1024}).trim();if(out)id='windows-volume:'+out;}}catch(e){recoveryLog('warn','identity','volume.identity.failed',{root,error:e.message},null,null,root)}
 if(!id){try{const st=fs.statSync(root);id='wsl-device:'+String(st.dev)}catch{id='locator:'+root}}
 pcVolumeCache.set(root,id);return id;
}
function pcIdentity(locator){
 const full=path.resolve(String(locator)),root=pcDriveRoot(full)||'/';const platform=pcWindowsVolumeIdentity(root)||('wsl-root:'+root);let rel=root==='/'?full.replace(/^\/+/, ''):path.relative(root,full);if(!rel)rel='.';rel=rel.replace(/\\/g,'/');
 const volumeId=crypto.createHash('sha256').update(platform).digest('hex').slice(0,24),pathId=crypto.createHash('sha256').update(volumeId+'\0'+rel).digest('hex').slice(0,32),now=pcNow();
 sql(`INSERT INTO volume_observations(volume_id,platform_identity,observed_locator,label,first_seen_at,last_seen_at) VALUES(${esc(volumeId)},${esc(platform)},${esc(root)},${esc(root==='/'?'WSL':root.toUpperCase())},${esc(now)},${esc(now)}) ON CONFLICT(volume_id) DO UPDATE SET platform_identity=excluded.platform_identity,observed_locator=excluded.observed_locator,last_seen_at=excluded.last_seen_at;
 INSERT INTO path_catalog(path_id,volume_id,relative_root,last_observed_locator,last_indexed_at) VALUES(${esc(pathId)},${esc(volumeId)},${esc(rel)},${esc(full)},NULL) ON CONFLICT(path_id) DO UPDATE SET last_observed_locator=excluded.last_observed_locator;`);
 return {path_id:pathId,volume_id:volumeId,platform_identity:platform,relative_root:rel,locator:full,root};
}
function pcSyncProjectPaths(projectToken){
 pcEnsureSchema();const src=rows(`SELECT source_id,normalized_path_or_locator,operator_label,operator_note,registered_at FROM sources WHERE project_token=${esc(projectToken)} ORDER BY registered_at`);
 for(const s of src){if(pcBlockedPath(s.normalized_path_or_locator))continue;const i=pcIdentity(s.normalized_path_or_locator);sql(`INSERT INTO project_paths(project_token,path_id,source_id,operator_label,operator_note,added_at,removed_at) VALUES(${esc(projectToken)},${esc(i.path_id)},${esc(s.source_id)},${esc(s.operator_label||path.basename(s.normalized_path_or_locator))},${esc(s.operator_note||'')},${esc(s.registered_at||pcNow())},NULL) ON CONFLICT(project_token,path_id) DO UPDATE SET source_id=excluded.source_id,operator_label=excluded.operator_label,operator_note=excluded.operator_note,removed_at=NULL;`)}
 return pcProjectPaths(projectToken);
}
function pcProjectPaths(projectToken){return rows(`SELECT pp.*,pc.volume_id,pc.relative_root,pc.last_observed_locator AS path,pc.file_count,pc.folder_count,pc.byte_count,pc.metadata_tree_sha256,pc.content_tree_sha256,pc.last_indexed_at,pc.last_fingerprinted_at FROM project_paths pp JOIN path_catalog pc ON pc.path_id=pp.path_id WHERE pp.project_token=${esc(projectToken)} AND pp.removed_at IS NULL ORDER BY pp.added_at,pp.path_id`)};
function pcReplaceProjectPaths(projectToken,input){
 pcEnsureSchema();const p=project(projectToken);if(!p)throw new Error('project not found');const now=pcNow(),wanted=[];
 for(const x of input||[]){const locator=path.resolve(String(x.path||x.locator||''));if(!locator)continue;pcAssertPath(locator);const i=pcIdentity(locator),label=String(x.operator_label||x.name||path.basename(locator)||locator),note=String(x.note||x.operator_note||'');wanted.push({...i,label,note});}
 const ids=new Set(wanted.map(x=>x.path_id));const existing=pcProjectPaths(projectToken);
 sql('BEGIN;');
 try{
  for(const e of existing)if(!ids.has(e.path_id)){sql(`UPDATE project_paths SET removed_at=${esc(now)} WHERE project_token=${esc(projectToken)} AND path_id=${esc(e.path_id)};DELETE FROM sources WHERE project_token=${esc(projectToken)} AND source_id=${esc(e.source_id||'')};`)}
  for(const w of wanted){const sid=sourceId(projectToken,'wsl_path',w.locator);sql(`INSERT INTO sources(source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note,registered_at,source_status) VALUES(${esc(sid)},${esc(projectToken)},'wsl_path',${esc(w.locator)},${esc(w.locator)},${esc(w.label)},${esc(w.note)},${esc(now)},'registered') ON CONFLICT(project_token,source_type,normalized_path_or_locator) DO UPDATE SET operator_label=excluded.operator_label,operator_note=excluded.operator_note;
 INSERT INTO project_paths(project_token,path_id,source_id,operator_label,operator_note,added_at,removed_at) VALUES(${esc(projectToken)},${esc(w.path_id)},${esc(sid)},${esc(w.label)},${esc(w.note)},${esc(now)},NULL) ON CONFLICT(project_token,path_id) DO UPDATE SET source_id=excluded.source_id,operator_label=excluded.operator_label,operator_note=excluded.operator_note,removed_at=NULL;`)}
  sql(`UPDATE projects SET updated_at=${esc(now)},status=CASE WHEN status='Closed' THEN 'Pending' ELSE status END WHERE project_token=${esc(projectToken)};COMMIT;`);
 }catch(e){try{sql('ROLLBACK;')}catch{}throw e}
 audit('projects',projectToken,'replace_paths',{paths:wanted.map(x=>x.locator)});return pcProjectPaths(projectToken);
}
function pcCacheForFile(projectToken,f){
 const src=rows(`SELECT normalized_path_or_locator FROM sources WHERE project_token=${esc(projectToken)} AND source_id=${esc(f.source_id)} LIMIT 1`)[0];if(!src)return null;const i=pcIdentity(src.normalized_path_or_locator);return {...i,cache:rows(`SELECT sha256 FROM file_hash_cache WHERE path_id=${esc(i.path_id)} AND relative_path=${esc(f.relative_path)} AND size=${Number(f.size)} AND modified_at=${Number(f.modified_at)} LIMIT 1`)[0]?.sha256||null};
}
function pcRecordFile(i,f,sha,status='done'){
 const now=pcNow(),fn=path.basename(f.relative_path);sql(`INSERT INTO file_observations(path_id,relative_path,filename,full_path,size,modified_at,sha256,status,observed_at) VALUES(${esc(i.path_id)},${esc(f.relative_path)},${esc(fn)},${esc(f.full_path)},${Number(f.size)},${Number(f.modified_at)},${sha?esc(sha):'NULL'},${esc(status)},${esc(now)}) ON CONFLICT(path_id,relative_path) DO UPDATE SET filename=excluded.filename,full_path=excluded.full_path,size=excluded.size,modified_at=excluded.modified_at,sha256=excluded.sha256,status=excluded.status,observed_at=excluded.observed_at;`);if(sha)sql(`INSERT INTO file_catalog(sha256,size,first_seen_at,last_seen_at) VALUES(${esc(sha)},${Number(f.size)},${esc(now)},${esc(now)}) ON CONFLICT(sha256) DO UPDATE SET last_seen_at=excluded.last_seen_at;
 INSERT OR REPLACE INTO file_hash_cache(path_id,relative_path,size,modified_at,sha256,verified_at) VALUES(${esc(i.path_id)},${esc(f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(sha)},${esc(now)});`);
}
function pcRefreshPathSummary(pathId){
 const rs=rows(`SELECT relative_path,size,modified_at,sha256,status FROM file_observations WHERE path_id=${esc(pathId)} ORDER BY relative_path`),meta=crypto.createHash('sha256'),content=crypto.createHash('sha256');let bytes=0;const folders=new Set();let all=true;
 for(const r of rs){bytes+=Number(r.size||0);const d=path.posix.dirname(r.relative_path);if(d&&d!=='.')folders.add(d);meta.update(`${r.relative_path}\0${r.size}\0${r.modified_at}\n`);if(r.sha256)content.update(`${r.relative_path}\0${r.size}\0${r.sha256}\n`);else all=false}
 sql(`UPDATE path_catalog SET metadata_tree_sha256=${esc(meta.digest('hex'))},content_tree_sha256=${all?esc(content.digest('hex')):'NULL'},file_count=${rs.length},folder_count=${folders.size},byte_count=${bytes},last_indexed_at=${esc(pcNow())},last_fingerprinted_at=${all?esc(pcNow()):'last_fingerprinted_at'} WHERE path_id=${esc(pathId)};`);
}
// Override the 6.8 fingerprint unit: reuse hashes globally by path identity, not by project token.
mpFingerprintOne=async function(q,workerId){
 const f=parallelClaimFile(q.run_id,workerId);if(!f){const active=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(q.run_id)} AND status='active'`)[0]?.n||0),pending=Number(rows(`SELECT COUNT(*) n FROM fingerprint_inventory WHERE run_id=${esc(q.run_id)} AND status='pending'`)[0]?.n||0);if(active||pending)return false;const p=project(q.project_token);if(p)await parallelFinalize(q.project_token,q.run_id,p);for(const x of pcSyncProjectPaths(q.project_token))pcRefreshPathSummary(x.path_id);sql(`UPDATE mp_queue SET state='Closed',phase='complete',updated_at=${esc(pcNow())} WHERE project_token=${esc(q.project_token)};`);return true;}
 mpSetWorker(workerId,{project_token:q.project_token,run_id:q.run_id,phase:'fingerprinting',path:f.full_path,item:f.relative_path,started_at:pcNow()});let hash=null,reuse=0,error=null,i=null;
 try{i=pcCacheForFile(q.project_token,f);if(i?.cache){hash=i.cache;reuse=1}else hash=await hashPath(f.full_path)}catch(e){error=e}
 const now=pcNow();if(error){sql(`UPDATE fingerprint_inventory SET status='error',error=${esc(error.message)},hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(q.run_id)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};`);if(i)pcRecordFile(i,f,null,'error');recoveryLog('error','fingerprinting','file.read.error',{error:error.message,code:error.code||'',worker_id:workerId},q.project_token,q.run_id,f.full_path)}else{if(i)pcRecordFile(i,f,hash,'done');const mid=crypto.createHash('sha256').update(q.project_token+'\0'+f.source_id+'\0'+f.relative_path).digest('hex');sql(`BEGIN;UPDATE fingerprint_inventory SET status='done',sha256=${esc(hash)},reused=${reuse},error=NULL,hashed_at=${esc(now)},worker_id=NULL WHERE run_id=${esc(q.run_id)} AND source_id=${esc(f.source_id)} AND relative_path=${esc(f.relative_path)};INSERT OR REPLACE INTO manifests(manifest_id,project_token,source_id,relative_path,size,modified_at,sha256,inventory_at) VALUES(${esc(mid)},${esc(q.project_token)},${esc(f.source_id)},${esc(f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(hash)},${esc(now)});COMMIT;`)}
 const t=mpTotals(q.run_id),pct=t.bytes?Math.min(100,t.bytes_done/t.bytes*100):(t.files?Math.min(100,(t.done+t.errors)/t.files*100):0);sql(`UPDATE runs SET files_total=${t.files},files_done=${t.done},bytes_done=${t.bytes_done},progress_percent=${pct},error_count=${t.errors},checkpoint_state=${esc(JSON.stringify({phase:'fingerprinting',scheduler:'global',worker_pool:MP_WORKERS,bytes_total:t.bytes,global_hash_reuse:true}))} WHERE run_id=${esc(q.run_id)};`);mpTouch(q.project_token);return true;
};
async function pcExplorerRun(root){
 pcEnsureSchema();const job=pcExplorerJobs.get(root);if(!job)return;const stack=[root];let folders=0,files=0,bytes=0;sql(`DELETE FROM explorer_entries WHERE root_locator=${esc(root)};INSERT OR REPLACE INTO explorer_index(root_locator,state,current_path,folders_seen,files_seen,bytes_seen,started_at,updated_at,completed_at,error) VALUES(${esc(root)},'WIP',${esc(root)},0,0,0,${esc(pcNow())},${esc(pcNow())},NULL,NULL);`);
 try{while(stack.length){const d=stack.pop();if(pcBlockedPath(d))continue;job.current=d;let ents=[];try{ents=await fsp.readdir(d,{withFileTypes:true})}catch(e){continue}folders++;for(const e of ents){const full=path.join(d,e.name);if(pcBlockedPath(full)){sql(`INSERT OR REPLACE INTO explorer_entries(root_locator,full_path,parent_path,name,kind,size,modified_at) VALUES(${esc(root)},${esc(full)},${esc(d)},${esc(e.name)},'blocked',NULL,NULL);`);continue}try{const st=await fsp.stat(full);if(e.isDirectory()){stack.push(full);sql(`INSERT OR REPLACE INTO explorer_entries(root_locator,full_path,parent_path,name,kind,size,modified_at) VALUES(${esc(root)},${esc(full)},${esc(d)},${esc(e.name)},'folder',NULL,${Number(st.mtimeMs||0)});`)}else if(e.isFile()){files++;bytes+=Number(st.size||0);sql(`INSERT OR REPLACE INTO explorer_entries(root_locator,full_path,parent_path,name,kind,size,modified_at) VALUES(${esc(root)},${esc(full)},${esc(d)},${esc(e.name)},'file',${Number(st.size||0)},${Number(st.mtimeMs||0)});`)}}catch{} }
 if((folders%20)===0){sql(`UPDATE explorer_index SET current_path=${esc(d)},folders_seen=${folders},files_seen=${files},bytes_seen=${bytes},updated_at=${esc(pcNow())} WHERE root_locator=${esc(root)};`);await new Promise(r=>setTimeout(r,0));}}
 sql(`UPDATE explorer_index SET state='Closed',current_path=NULL,folders_seen=${folders},files_seen=${files},bytes_seen=${bytes},updated_at=${esc(pcNow())},completed_at=${esc(pcNow())} WHERE root_locator=${esc(root)};`);
 }catch(e){sql(`UPDATE explorer_index SET state='Error',error=${esc(e.message)},updated_at=${esc(pcNow())} WHERE root_locator=${esc(root)};`)}finally{pcExplorerJobs.delete(root)}
}
function pcExplorerStart(root){root=path.resolve(String(root));pcAssertPath(root);const active=pcExplorerJobs.get(root);if(active)return rows(`SELECT * FROM explorer_index WHERE root_locator=${esc(root)} LIMIT 1`)[0]||{state:'WIP'};pcExplorerJobs.set(root,{root,current:root});setImmediate(()=>pcExplorerRun(root));return {root_locator:root,state:'WIP'};}
function pcAnalysis(projectToken){
 pcEnsureSchema();const paths=pcSyncProjectPaths(projectToken),ids=paths.map(x=>x.path_id);if(!ids.length)return {project_token:projectToken,paths:0,files:0,bytes:0,exact_duplicate_groups:0,duplicate_files:0,reclaimable_bytes:0,target_copy_bytes:0,target_required_with_10pct_margin:0,conflicts:0};const list=ids.map(esc).join(',');
 const obs=rows(`SELECT path_id,relative_path,full_path,size,modified_at,sha256,status FROM file_observations WHERE path_id IN (${list})`);const physical=new Map();for(const x of obs){const k=x.full_path||x.path_id+'\0'+x.relative_path;physical.set(k,x)}const vals=[...physical.values()],by=new Map();let total=0;for(const x of vals){total+=Number(x.size||0);if(!x.sha256)continue;const a=by.get(x.sha256)||[];a.push(x);by.set(x.sha256,a)}let groups=0,dupFiles=0,reclaim=0,uniqueCopy=0;for(const [sha,a] of by){const size=Number(a[0]?.size||0);uniqueCopy+=size;if(a.length>1){groups++;dupFiles+=a.length-1;reclaim+=size*(a.length-1)}}const conflicts=rows(`SELECT COUNT(*) n FROM (SELECT relative_path,COUNT(DISTINCT sha256) c FROM file_observations WHERE path_id IN (${list}) AND sha256 IS NOT NULL GROUP BY relative_path HAVING c>1)`)[0]?.n||0;return {project_token:projectToken,paths:paths.length,files:vals.length,bytes:total,exact_duplicate_groups:groups,duplicate_files:dupFiles,reclaimable_bytes:reclaim,target_copy_bytes:uniqueCopy,target_required_with_10pct_margin:Math.ceil(uniqueCopy*1.10),conflicts:Number(conflicts||0),unfingerprinted:vals.filter(x=>!x.sha256).length};
}
const pcPriorHandle=handle;
handle=async function(req,res,url){const pn=url.pathname;try{
 if(!pn.startsWith('/api/sot/'))return pcPriorHandle(req,res,url);pcEnsureSchema();
 if(pn==='/api/sot/health'&&req.method==='GET'){json(res,200,{service:'sot',status:'ok',version:VERSION,build:PC_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','path-centric-projects','progressive-explorer-index','inventory-reporting','impact-analysis','db-admin','diagnostic-log']});return true}
 let m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/paths$/);if(m&&req.method==='GET'){const t=decodeURIComponent(m[1]);json(res,200,{project_token:t,paths:pcSyncProjectPaths(t)});return true}if(m&&req.method==='PUT'){const t=decodeURIComponent(m[1]),b=await body(req);json(res,200,{project_token:t,paths:pcReplaceProjectPaths(t,b.paths||[])});return true}
 m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/analysis$/);if(m&&req.method==='GET'){json(res,200,pcAnalysis(decodeURIComponent(m[1])));return true}
 if(pn==='/api/sot/path/identity'&&req.method==='GET'){const p=url.searchParams.get('path')||'';pcAssertPath(p);json(res,200,pcIdentity(p));return true}
 if(pn==='/api/sot/explorer/index/start'&&req.method==='POST'){const b=await body(req);json(res,202,pcExplorerStart(b.path));return true}
 if(pn==='/api/sot/explorer/index/status'&&req.method==='GET'){const root=path.resolve(String(url.searchParams.get('path')||'/'));json(res,200,rows(`SELECT * FROM explorer_index WHERE root_locator=${esc(root)} LIMIT 1`)[0]||{root_locator:root,state:'NotStarted',folders_seen:0,files_seen:0,bytes_seen:0});return true}
 if(pn==='/api/sot/explorer/entries'&&req.method==='GET'){const root=path.resolve(String(url.searchParams.get('root')||'/')),parent=path.resolve(String(url.searchParams.get('parent')||root)),q=String(url.searchParams.get('q')||'').trim();const wh=q?` AND lower(name) LIKE ${esc('%'+q.toLowerCase()+'%')}`:'';json(res,200,{root,parent,rows:rows(`SELECT * FROM explorer_entries WHERE root_locator=${esc(root)} AND parent_path=${esc(parent)}${wh} ORDER BY CASE kind WHEN 'folder' THEN 0 WHEN 'file' THEN 1 ELSE 2 END,name COLLATE NOCASE`) });return true}
 if(pn==='/api/sot/catalog/files'&&req.method==='GET'){const pathId=url.searchParams.get('path_id'),q=String(url.searchParams.get('q')||'').trim().toLowerCase(),sort={filename:'filename',size:'size',modified:'modified_at',path:'relative_path',hash:'sha256',status:'status'}[url.searchParams.get('sort')]||'relative_path',dir=url.searchParams.get('dir')==='desc'?'DESC':'ASC';if(!pathId)throw new Error('path_id required');const wh=q?` AND (lower(filename) LIKE ${esc('%'+q+'%')} OR lower(relative_path) LIKE ${esc('%'+q+'%')} OR lower(COALESCE(sha256,'')) LIKE ${esc('%'+q+'%')} OR lower(status) LIKE ${esc('%'+q+'%')})`:'';const rr=rows(`SELECT filename,size,modified_at,relative_path,sha256,status,full_path FROM file_observations WHERE path_id=${esc(pathId)}${wh} ORDER BY ${sort} ${dir} LIMIT 5000`);json(res,200,{path_id:pathId,total:rr.length,rows:rr});return true}
 // Backend block even if an older client attempts to create a project containing recycle bin.
 if(pn==='/api/sot/projects'&&req.method==='POST'){const b=await body(req);for(const s of b.sources||[])pcAssertPath(s.path||s.locator||s.original_path_or_locator);const name=String(b.project_name||'').trim();if(!name)throw new Error('project_name is required');if(!(b.sources||[]).length)throw new Error('at least one path is required');const now=pcNow(),t=token(),src=sourceRowsFromBody(t,b.sources,now);sql('BEGIN;'+`INSERT INTO projects(project_token,project_name,active,created_at,updated_at,status,current_stage,notes) VALUES(${esc(t)},${esc(name)},1,${esc(now)},${esc(now)},'Pending','setup',${esc(b.notes||'')});`+src.map(s=>`INSERT INTO sources(source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note,registered_at,source_status) VALUES(${esc(s.source_id)},${esc(t)},${esc(s.source_type)},${esc(s.original)},${esc(s.normalized)},${esc(s.label)},${esc(s.note)},${esc(now)},'registered');`).join('')+`COMMIT;`);pcSyncProjectPaths(t);json(res,201,project(t));return true}
 return pcPriorHandle(req,res,url);
 }catch(e){json(res,400,{error:e.message});return true}
};
