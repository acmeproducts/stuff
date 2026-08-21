/* SOT TURN01 pre-base: minimum corpus evidence + realtime intelligence/lifecycle */
const TURN01_BUILD='2026.08.21.turn01-pre-base';

function t1Now(){return new Date().toISOString();}
function t1NormPath(v){
 let s=String(v||'').replace(/\\/g,'/').replace(/\/{2,}/g,'/');
 if(s.length>1)s=s.replace(/\/$/,'');
 return s||'/';
}
function t1Hash(v){return crypto.createHash('sha256').update(String(v??'')).digest('hex');}
function t1ObsHash(p,fp,modified,size){return t1Hash([t1NormPath(p),String(fp||''),String(Number(modified||0)),String(Number(size||0))].join('\0'));}
function t1Verified(v){return /^(verified|yes|ok|true|complete)$/i.test(String(v||''));}

function t1EnsureSchema(){
 pcEnsureSchema();
 for(const [c,d] of [['path_hash','TEXT'],['observation_hash','TEXT']]){try{ensureColumn('file_observations',c,d)}catch{}}
 sql(`CREATE TABLE IF NOT EXISTS turn01_observation_history(
  observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  path_id TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  normalized_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  modified_at REAL NOT NULL,
  file_fingerprint TEXT,
  path_hash TEXT NOT NULL,
  observation_hash TEXT NOT NULL,
  status TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  UNIQUE(path_id,relative_path,observation_hash));
 CREATE INDEX IF NOT EXISTS idx_t1_hist_fp ON turn01_observation_history(file_fingerprint);
 CREATE INDEX IF NOT EXISTS idx_t1_hist_path ON turn01_observation_history(path_id,relative_path,observed_at);
 CREATE TABLE IF NOT EXISTS turn01_target_holdings(
  file_fingerprint TEXT PRIMARY KEY,
  target_path TEXT NOT NULL,
  library_location TEXT NOT NULL DEFAULT '',
  established_at TEXT NOT NULL,
  verified_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'recorded',
  note TEXT NOT NULL DEFAULT '');
 CREATE TABLE IF NOT EXISTS turn01_backup_holdings(
  file_fingerprint TEXT PRIMARY KEY,
  backup_path TEXT NOT NULL,
  library_location TEXT NOT NULL DEFAULT '',
  backed_up_at TEXT NOT NULL,
  verified_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'recorded',
  note TEXT NOT NULL DEFAULT '');
 CREATE TABLE IF NOT EXISTS turn01_transfer_events(
  transfer_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_token TEXT,
  file_fingerprint TEXT,
  source_path TEXT NOT NULL DEFAULT '',
  target_path TEXT NOT NULL DEFAULT '',
  event_type TEXT NOT NULL,
  library_location TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  verified_at TEXT,
  verification_status TEXT NOT NULL DEFAULT 'recorded',
  note TEXT NOT NULL DEFAULT '');
 CREATE INDEX IF NOT EXISTS idx_t1_transfer_fp ON turn01_transfer_events(file_fingerprint,occurred_at);
 CREATE TABLE IF NOT EXISTS turn01_source_dispositions(
  disposition_id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_token TEXT,
  source_id TEXT,
  source_path TEXT NOT NULL,
  disposition_status TEXT NOT NULL,
  library_location TEXT NOT NULL DEFAULT '',
  disposition_at TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '');
 CREATE INDEX IF NOT EXISTS idx_t1_disp_project ON turn01_source_dispositions(project_token,disposition_at);`);
 for(const t of ['turn01_observation_history','turn01_target_holdings','turn01_backup_holdings','turn01_transfer_events','turn01_source_dispositions'])TABLE_ALLOW.add(t);
}

const t1PriorRecordFile=pcRecordFile;
pcRecordFile=function(i,f,sha,status='done'){
 t1PriorRecordFile(i,f,sha,status);
 try{
  t1EnsureSchema();
  const normalized=t1NormPath(f.full_path||path.join(i.locator||'',f.relative_path||''));
  const ph=t1Hash(normalized),oh=t1ObsHash(normalized,sha,f.modified_at,f.size),now=t1Now(),fn=path.basename(f.relative_path||normalized);
  sql(`UPDATE file_observations SET path_hash=${esc(ph)},observation_hash=${esc(oh)} WHERE path_id=${esc(i.path_id)} AND relative_path=${esc(f.relative_path)};
  INSERT OR IGNORE INTO turn01_observation_history(path_id,relative_path,normalized_path,filename,size,modified_at,file_fingerprint,path_hash,observation_hash,status,observed_at)
  VALUES(${esc(i.path_id)},${esc(f.relative_path)},${esc(normalized)},${esc(fn)},${Number(f.size||0)},${Number(f.modified_at||0)},${sha?esc(sha):'NULL'},${esc(ph)},${esc(oh)},${esc(status)},${esc(now)});`);
 }catch(e){try{recoveryLog('warn','turn01','observation.history.failed',{error:e.message},null,null,f.full_path||f.relative_path)}catch{}}
};

function t1PathIds(projectToken){if(!projectToken)return null;return pcSyncProjectPaths(projectToken).map(x=>x.path_id);}
function t1Observations(projectToken){
 t1EnsureSchema();const ids=t1PathIds(projectToken);if(ids&&ids.length===0)return [];
 const wh=ids?` WHERE fo.path_id IN (${ids.map(esc).join(',')})`:'';
 return rows(`SELECT fo.path_id,fo.relative_path,fo.filename,fo.full_path,fo.size,fo.modified_at,fo.sha256 AS file_fingerprint,fo.status,fo.observed_at,fo.path_hash,fo.observation_hash,pc.last_observed_locator AS source_root FROM file_observations fo LEFT JOIN path_catalog pc ON pc.path_id=fo.path_id${wh}`);
}
function t1TargetMap(){return new Map(rows('SELECT * FROM turn01_target_holdings').map(x=>[x.file_fingerprint,x]));}
function t1BackupMap(){return new Map(rows('SELECT * FROM turn01_backup_holdings').map(x=>[x.file_fingerprint,x]));}
function t1Metrics(obs){
 const target=t1TargetMap(),backup=t1BackupMap(),by=new Map();let bytes=0,unfingerprinted=0;
 for(const x of obs){bytes+=Number(x.size||0);if(!x.file_fingerprint){unfingerprinted++;continue}const a=by.get(x.file_fingerprint)||[];a.push(x);by.set(x.file_fingerprint,a)}
 let uniqueBytes=0,dupCopies=0,dupBytes=0,targetCount=0,targetBytes=0,backupCount=0,backupBytes=0,missingTargetBytes=0,missingBackupBytes=0;
 for(const [fp,a] of by){const size=Number(a[0]?.size||0);uniqueBytes+=size;if(a.length>1){dupCopies+=a.length-1;dupBytes+=size*(a.length-1)}const th=target.get(fp),bh=backup.get(fp);const tv=th&&t1Verified(th.verification_status);const bv=bh&&t1Verified(bh.verification_status);if(tv){targetCount++;targetBytes+=size;if(bv){backupCount++;backupBytes+=size}else missingBackupBytes+=size}else missingTargetBytes+=size}
 return {observations:obs.length,bytes,unique_content:by.size,unique_bytes:uniqueBytes,unfingerprinted,duplicate_copies:dupCopies,duplicate_bytes:dupBytes,target_verified_content:targetCount,target_verified_bytes:targetBytes,target_missing_content:by.size-targetCount,target_missing_bytes:missingTargetBytes,backup_verified_content:backupCount,backup_verified_bytes:backupBytes,backup_missing_bytes:missingBackupBytes,potentially_recoverable_bytes:dupBytes};
}
function t1ChangedPathCount(projectToken){const ids=t1PathIds(projectToken);if(ids&&ids.length===0)return 0;const wh=ids?` WHERE path_id IN (${ids.map(esc).join(',')})`:'';return Number(rows(`SELECT COUNT(*) n FROM (SELECT path_id,relative_path,COUNT(DISTINCT COALESCE(file_fingerprint,'')) c FROM turn01_observation_history${wh} GROUP BY path_id,relative_path HAVING c>1)`)[0]?.n||0);}
function t1Overlap(projectToken){
 if(!projectToken)return [];const mine=new Set(t1Observations(projectToken).map(x=>x.file_fingerprint).filter(Boolean));if(!mine.size)return [];
 const ps=rows(`SELECT project_token,project_name FROM projects WHERE deleted_at IS NULL AND project_token<>${esc(projectToken)} ORDER BY project_name`),out=[];
 for(const p of ps){const other=new Set(t1Observations(p.project_token).map(x=>x.file_fingerprint).filter(Boolean));let common=0;for(const x of mine)if(other.has(x))common++;if(common)out.push({project_token:p.project_token,project_name:p.project_name,shared_content:common,project_content:mine.size,overlap_percent:Math.round(common/mine.size*1000)/10,exclusive_content:mine.size-common});}
 return out.sort((a,b)=>b.overlap_percent-a.overlap_percent).slice(0,20);
}
function t1Intelligence(projectToken=null){const obs=t1Observations(projectToken),m=t1Metrics(obs);return {build:TURN01_BUILD,project_token:projectToken,generated_at:t1Now(),...m,changed_paths:t1ChangedPathCount(projectToken),overlap:projectToken?t1Overlap(projectToken):[]};}
function t1SourceSummaries(projectToken){
 const paths=pcSyncProjectPaths(projectToken);return paths.map(p=>{const obs=rows(`SELECT fo.path_id,fo.relative_path,fo.filename,fo.full_path,fo.size,fo.modified_at,fo.sha256 AS file_fingerprint,fo.status,fo.observed_at FROM file_observations fo WHERE fo.path_id=${esc(p.path_id)}`);const m=t1Metrics(obs);return {...p,...m,target_coverage_percent:m.unique_bytes?Math.round(m.target_verified_bytes/m.unique_bytes*1000)/10:0,backup_coverage_percent:m.unique_bytes?Math.round(m.backup_verified_bytes/m.unique_bytes*1000)/10:0};});
}
function t1Projects(q=''){const qq=String(q||'').trim().toLowerCase(),wh=qq?` AND (lower(project_name) LIKE ${esc('%'+qq+'%')} OR lower(notes) LIKE ${esc('%'+qq+'%')})`:'';return rows(`SELECT project_token,project_name,notes,active,status,current_stage,current_run_id,created_at,updated_at FROM projects WHERE deleted_at IS NULL${wh} ORDER BY updated_at DESC,project_name COLLATE NOCASE`);}
function t1ProjectDetail(t){const p=project(t);if(!p)return null;return {...p,paths:pcSyncProjectPaths(t),intelligence:t1Intelligence(t)};}
function t1CreateProject(b){const name=String(b.project_name||'').trim();if(!name)throw new Error('project_name is required');const now=t1Now(),t=token();sql(`INSERT INTO projects(project_token,project_name,active,created_at,updated_at,status,current_stage,notes) VALUES(${esc(t)},${esc(name)},1,${esc(now)},${esc(now)},'Pending','scope',${esc(b.project_note??b.notes??'')});`);const paths=b.sources||b.paths||[];if(paths.length)pcReplaceProjectPaths(t,paths);audit('projects',t,'turn01.create',{paths:paths.length});return t1ProjectDetail(t);}
function t1UpdateProject(t,b){const p=project(t);if(!p)throw new Error('project not found');const name=String(b.project_name??p.project_name).trim();if(!name)throw new Error('project_name is required');const note=String(b.project_note??b.notes??p.notes??'');sql(`UPDATE projects SET project_name=${esc(name)},notes=${esc(note)},updated_at=${esc(t1Now())} WHERE project_token=${esc(t)};`);if(Array.isArray(b.sources)||Array.isArray(b.paths))pcReplaceProjectPaths(t,b.sources||b.paths||[]);audit('projects',t,'turn01.update',{});return t1ProjectDetail(t);}
function t1DeleteProject(t){if(!project(t))throw new Error('project not found');const now=t1Now();sql(`UPDATE projects SET deleted_at=${esc(now)},active=0,updated_at=${esc(now)} WHERE project_token=${esc(t)};`);audit('projects',t,'turn01.soft_delete',{});return {project_token:t,deleted_at:now};}
function t1Query(url){
 const q=String(url.searchParams.get('q')||'').trim().toLowerCase(),projectToken=url.searchParams.get('project_token')||null,targetFilter=url.searchParams.get('target')||'',backupFilter=url.searchParams.get('backup')||'',minCopies=Math.max(1,Number(url.searchParams.get('copies')||1)),limit=Math.max(1,Math.min(2000,Number(url.searchParams.get('limit')||500)));
 let obs=t1Observations(projectToken),target=t1TargetMap(),backup=t1BackupMap();const copies=new Map();for(const x of t1Observations(null))if(x.file_fingerprint)copies.set(x.file_fingerprint,(copies.get(x.file_fingerprint)||0)+1);
 let out=[];for(const x of obs){const fp=x.file_fingerprint||'',th=fp?target.get(fp):null,bh=fp?backup.get(fp):null,tv=!!(th&&t1Verified(th.verification_status)),bv=!!(bh&&t1Verified(bh.verification_status)),copyCount=fp?(copies.get(fp)||1):1;if(copyCount<minCopies)continue;if(targetFilter==='present'&&!tv)continue;if(targetFilter==='missing'&&tv)continue;if(backupFilter==='present'&&!bv)continue;if(backupFilter==='missing'&&bv)continue;const hay=[x.filename,x.full_path,x.relative_path,fp,x.status].join(' ').toLowerCase();if(q&&!hay.includes(q))continue;const norm=t1NormPath(x.full_path||x.relative_path),ph=x.path_hash||t1Hash(norm),oh=x.observation_hash||t1ObsHash(norm,fp,x.modified_at,x.size);out.push({...x,path_hash:ph,observation_hash:oh,copy_count:copyCount,target_verified:tv,target_path:th?.target_path||'',backup_verified:bv,backup_path:bh?.backup_path||''});if(out.length>=limit)break}
 return {build:TURN01_BUILD,query:{q,project_token:projectToken,target:targetFilter,backup:backupFilter,copies:minCopies,limit},count:out.length,rows:out};
}
function t1Plan(projectToken){
 const obs=t1Observations(projectToken),target=t1TargetMap(),backup=t1BackupMap(),by=new Map();let unresolvedFiles=0,unresolvedBytes=0;
 for(const x of obs){if(!x.file_fingerprint){unresolvedFiles++;unresolvedBytes+=Number(x.size||0);continue}if(!by.has(x.file_fingerprint))by.set(x.file_fingerprint,x)}
 const items=[];const totals={noop_files:0,noop_bytes:0,transfer_files:0,transfer_bytes:0,backup_files:0,backup_bytes:0,verify_target_files:0,verify_target_bytes:0,unresolved_files:unresolvedFiles,unresolved_bytes:unresolvedBytes};
 for(const [fp,x] of by){const size=Number(x.size||0),th=target.get(fp),bh=backup.get(fp),tv=th&&t1Verified(th.verification_status),bv=bh&&t1Verified(bh.verification_status);let action;if(tv&&bv){action='noop';totals.noop_files++;totals.noop_bytes+=size}else if(tv&&!bv){action='backup';totals.backup_files++;totals.backup_bytes+=size}else if(th&&!tv){action='verify_target';totals.verify_target_files++;totals.verify_target_bytes+=size}else{action='transfer';totals.transfer_files++;totals.transfer_bytes+=size}items.push({file_fingerprint:fp,size,filename:x.filename,source_path:x.full_path||x.relative_path,action,target_path:th?.target_path||'',target_status:th?.verification_status||'missing',backup_path:bh?.backup_path||'',backup_status:bh?.verification_status||'missing'});}
 return {build:TURN01_BUILD,project_token:projectToken,generated_at:t1Now(),totals,items};
}
function t1LifecycleRecent(limit=100){return {targets:rows(`SELECT * FROM turn01_target_holdings ORDER BY established_at DESC LIMIT ${Math.max(1,Math.min(500,Number(limit||100)))}`),backups:rows(`SELECT * FROM turn01_backup_holdings ORDER BY backed_up_at DESC LIMIT ${Math.max(1,Math.min(500,Number(limit||100)))}`),transfers:rows(`SELECT * FROM turn01_transfer_events ORDER BY occurred_at DESC,transfer_id DESC LIMIT ${Math.max(1,Math.min(500,Number(limit||100)))}`),dispositions:rows(`SELECT * FROM turn01_source_dispositions ORDER BY disposition_at DESC,disposition_id DESC LIMIT ${Math.max(1,Math.min(500,Number(limit||100)))}`)};}
function t1RecordTarget(b){const fp=String(b.file_fingerprint||b.sha256||'').trim();if(!fp)throw new Error('file_fingerprint is required');const targetPath=String(b.target_path||'').trim();if(!targetPath)throw new Error('target_path is required');const at=String(b.established_at||b.occurred_at||t1Now()),status=String(b.verification_status||'recorded'),verifiedAt=b.verified_at?String(b.verified_at):(t1Verified(status)?at:null);sql(`INSERT INTO turn01_target_holdings(file_fingerprint,target_path,library_location,established_at,verified_at,verification_status,note) VALUES(${esc(fp)},${esc(targetPath)},${esc(b.library_location||'')},${esc(at)},${verifiedAt?esc(verifiedAt):'NULL'},${esc(status)},${esc(b.note||'')}) ON CONFLICT(file_fingerprint) DO UPDATE SET target_path=excluded.target_path,library_location=excluded.library_location,established_at=excluded.established_at,verified_at=excluded.verified_at,verification_status=excluded.verification_status,note=excluded.note;`);return rows(`SELECT * FROM turn01_target_holdings WHERE file_fingerprint=${esc(fp)} LIMIT 1`)[0];}
function t1RecordBackup(b){const fp=String(b.file_fingerprint||b.sha256||'').trim();if(!fp)throw new Error('file_fingerprint is required');const backupPath=String(b.backup_path||'').trim();if(!backupPath)throw new Error('backup_path is required');const at=String(b.backed_up_at||b.occurred_at||t1Now()),status=String(b.verification_status||'recorded'),verifiedAt=b.verified_at?String(b.verified_at):(t1Verified(status)?at:null);sql(`INSERT INTO turn01_backup_holdings(file_fingerprint,backup_path,library_location,backed_up_at,verified_at,verification_status,note) VALUES(${esc(fp)},${esc(backupPath)},${esc(b.library_location||'')},${esc(at)},${verifiedAt?esc(verifiedAt):'NULL'},${esc(status)},${esc(b.note||'')}) ON CONFLICT(file_fingerprint) DO UPDATE SET backup_path=excluded.backup_path,library_location=excluded.library_location,backed_up_at=excluded.backed_up_at,verified_at=excluded.verified_at,verification_status=excluded.verification_status,note=excluded.note;`);return rows(`SELECT * FROM turn01_backup_holdings WHERE file_fingerprint=${esc(fp)} LIMIT 1`)[0];}
function t1RecordTransfer(b){const at=String(b.occurred_at||t1Now()),status=String(b.verification_status||'recorded'),verifiedAt=b.verified_at?String(b.verified_at):(t1Verified(status)?at:null);sql(`INSERT INTO turn01_transfer_events(project_token,file_fingerprint,source_path,target_path,event_type,library_location,occurred_at,verified_at,verification_status,note) VALUES(${b.project_token?esc(b.project_token):'NULL'},${b.file_fingerprint?esc(b.file_fingerprint):'NULL'},${esc(b.source_path||'')},${esc(b.target_path||'')},${esc(b.event_type||'source_to_target')},${esc(b.library_location||'')},${esc(at)},${verifiedAt?esc(verifiedAt):'NULL'},${esc(status)},${esc(b.note||'')});`);return rows('SELECT * FROM turn01_transfer_events ORDER BY transfer_id DESC LIMIT 1')[0];}
function t1RecordDisposition(b){const sourcePath=String(b.source_path||'').trim();if(!sourcePath)throw new Error('source_path is required');const status=String(b.disposition_status||'active').trim();const allowed=new Set(['active','safe_to_retire','archived','cold_stored','disposed_external']);if(!allowed.has(status))throw new Error('invalid disposition_status');sql(`INSERT INTO turn01_source_dispositions(project_token,source_id,source_path,disposition_status,library_location,disposition_at,note) VALUES(${b.project_token?esc(b.project_token):'NULL'},${b.source_id?esc(b.source_id):'NULL'},${esc(sourcePath)},${esc(status)},${esc(b.library_location||'')},${esc(b.disposition_at||t1Now())},${esc(b.note||'')});`);return rows('SELECT * FROM turn01_source_dispositions ORDER BY disposition_id DESC LIMIT 1')[0];}
function t1Backfill(limit=5000){t1EnsureSchema();const rs=rows(`SELECT path_id,relative_path,filename,full_path,size,modified_at,sha256,status,observed_at FROM file_observations WHERE path_hash IS NULL OR observation_hash IS NULL LIMIT ${Math.max(1,Math.min(20000,Number(limit||5000)))}`);if(!rs.length)return {updated:0,remaining:0};let q='BEGIN;';for(const x of rs){const norm=t1NormPath(x.full_path||x.relative_path),ph=t1Hash(norm),oh=t1ObsHash(norm,x.sha256,x.modified_at,x.size);q+=`UPDATE file_observations SET path_hash=${esc(ph)},observation_hash=${esc(oh)} WHERE path_id=${esc(x.path_id)} AND relative_path=${esc(x.relative_path)};INSERT OR IGNORE INTO turn01_observation_history(path_id,relative_path,normalized_path,filename,size,modified_at,file_fingerprint,path_hash,observation_hash,status,observed_at) VALUES(${esc(x.path_id)},${esc(x.relative_path)},${esc(norm)},${esc(x.filename||path.basename(x.relative_path))},${Number(x.size||0)},${Number(x.modified_at||0)},${x.sha256?esc(x.sha256):'NULL'},${esc(ph)},${esc(oh)},${esc(x.status||'done')},${esc(x.observed_at||t1Now())});`; }q+='COMMIT;';sql(q);const remaining=Number(rows('SELECT COUNT(*) n FROM file_observations WHERE path_hash IS NULL OR observation_hash IS NULL')[0]?.n||0);return {updated:rs.length,remaining};}

const t1PriorHandle=handle;
handle=async function(req,res,url){const pn=url.pathname;try{
 if(!pn.startsWith('/api/sot/'))return t1PriorHandle(req,res,url);t1EnsureSchema();
 if(pn==='/api/sot/health'&&req.method==='GET'){json(res,200,{service:'sot',status:'ok',version:VERSION,build:TURN01_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','path-centric-projects','turn01-minimum-evidence','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan','turn01-target-backup-disposition','db-admin','diagnostic-log']});return true}
 if(pn==='/api/sot/turn01/projects'&&req.method==='GET'){json(res,200,{projects:t1Projects(url.searchParams.get('q')||'')});return true}
 if(pn==='/api/sot/turn01/projects'&&req.method==='POST'){json(res,201,t1CreateProject(await body(req)));return true}
 let m=pn.match(/^\/api\/sot\/turn01\/projects\/([^/]+)$/);if(m&&req.method==='GET'){const x=t1ProjectDetail(decodeURIComponent(m[1]));if(!x){json(res,404,{error:'project not found'});return true}json(res,200,x);return true}if(m&&req.method==='PATCH'){json(res,200,t1UpdateProject(decodeURIComponent(m[1]),await body(req)));return true}if(m&&req.method==='DELETE'){json(res,200,t1DeleteProject(decodeURIComponent(m[1])));return true}
 m=pn.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/sources$/);if(m&&req.method==='GET'){json(res,200,{project_token:decodeURIComponent(m[1]),sources:t1SourceSummaries(decodeURIComponent(m[1]))});return true}
 m=pn.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/intelligence$/);if(m&&req.method==='GET'){json(res,200,t1Intelligence(decodeURIComponent(m[1])));return true}
 m=pn.match(/^\/api\/sot\/turn01\/projects\/([^/]+)\/plan$/);if(m&&req.method==='GET'){json(res,200,t1Plan(decodeURIComponent(m[1])));return true}
 if(pn==='/api/sot/turn01/intelligence'&&req.method==='GET'){json(res,200,t1Intelligence(url.searchParams.get('project_token')||null));return true}
 if(pn==='/api/sot/turn01/query'&&req.method==='GET'){json(res,200,t1Query(url));return true}
 if(pn==='/api/sot/turn01/lifecycle'&&req.method==='GET'){json(res,200,t1LifecycleRecent(url.searchParams.get('limit')||100));return true}
 if(pn==='/api/sot/turn01/holdings/target'&&req.method==='POST'){json(res,200,t1RecordTarget(await body(req)));return true}
 if(pn==='/api/sot/turn01/holdings/backup'&&req.method==='POST'){json(res,200,t1RecordBackup(await body(req)));return true}
 if(pn==='/api/sot/turn01/transfers'&&req.method==='POST'){json(res,200,t1RecordTransfer(await body(req)));return true}
 if(pn==='/api/sot/turn01/dispositions'&&req.method==='POST'){json(res,200,t1RecordDisposition(await body(req)));return true}
 if(pn==='/api/sot/turn01/backfill'&&req.method==='POST'){const b=await body(req);json(res,200,t1Backfill(b.limit||5000));return true}
 return t1PriorHandle(req,res,url);
 }catch(e){try{recoveryLog('error','turn01','request.error',{method:req.method,path:pn,error:e.message})}catch{}json(res,500,{error:e.message,code:e.code||null});return true}
};
t1EnsureSchema();
