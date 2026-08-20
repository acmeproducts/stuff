/* SOT 0.4.1 / 6.9.1 hardening for path identity/reuse and atomic project edits */
const PC_HARDEN_BUILD='2026.08.20.6.9.1-wsl-path-centric-analysis';
const pcEnsureSchemaBase=pcEnsureSchema;
pcEnsureSchema=function(){
 pcEnsureSchemaBase();
 sql(`CREATE TABLE IF NOT EXISTS file_locator_cache(
  volume_id TEXT NOT NULL,
  volume_relative_path TEXT NOT NULL,
  size INTEGER NOT NULL,
  modified_at REAL NOT NULL,
  sha256 TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  PRIMARY KEY(volume_id,volume_relative_path,size,modified_at));
 CREATE INDEX IF NOT EXISTS idx_file_locator_sha ON file_locator_cache(sha256);`);
 TABLE_ALLOW.add('file_locator_cache');
};

pcWindowsVolumeIdentity=function(root){
 if(!root)return null;
 if(pcVolumeCache.has(root))return pcVolumeCache.get(root);
 const letter=root.slice(-1).toUpperCase();
 const ps='/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe';
 let id=null;
 try{
  if(fs.existsSync(ps)){
   const cmd=`$d=Get-CimInstance Win32_LogicalDisk -Filter \"DeviceID='${letter}:'\" -ErrorAction SilentlyContinue; if($d){ Write-Output (($d.VolumeSerialNumber)+'|'+($d.FileSystem)+'|'+($d.Size)) }`;
   const out=execFileSync(ps,['-NoProfile','-Command',cmd],{encoding:'utf8',timeout:7000,maxBuffer:1024*1024}).trim();
   if(out&&out!=='||')id='windows-volume:'+out;
   if(!id){
    const cmd2=`$v=Get-Volume -DriveLetter '${letter}' -ErrorAction SilentlyContinue; if($v){ Write-Output (($v.UniqueId)+'|'+($v.SerialNumber)+'|'+($v.FileSystem)) }`;
    const out2=execFileSync(ps,['-NoProfile','-Command',cmd2],{encoding:'utf8',timeout:7000,maxBuffer:1024*1024}).trim();
    if(out2&&out2!=='||')id='windows-volume:'+out2;
   }
  }
 }catch(e){recoveryLog('warn','identity','volume.identity.failed',{root,error:e.message},null,null,root)}
 if(!id){
  try{const st=fs.statSync(root);id='wsl-device:'+String(st.dev)+':'+root}
  catch{id='locator:'+root}
 }
 pcVolumeCache.set(root,id);
 return id;
};

pcReplaceProjectPaths=function(projectToken,input){
 pcEnsureSchema();
 const p=project(projectToken);if(!p)throw new Error('project not found');
 const now=pcNow(),wanted=[];
 for(const x of input||[]){
  const raw=String(x.path||x.locator||'').trim();if(!raw)continue;
  const locator=path.resolve(raw);pcAssertPath(locator);
  const i=pcIdentity(locator),label=String(x.operator_label||x.name||path.basename(locator)||locator),note=String(x.note||x.operator_note||'');
  wanted.push({...i,label,note});
 }
 const ids=new Set(wanted.map(x=>x.path_id)),existing=pcProjectPaths(projectToken),statements=[];
 for(const e of existing){
  if(ids.has(e.path_id))continue;
  statements.push(`UPDATE project_paths SET removed_at=${esc(now)} WHERE project_token=${esc(projectToken)} AND path_id=${esc(e.path_id)};`);
  if(e.source_id)statements.push(`DELETE FROM sources WHERE project_token=${esc(projectToken)} AND source_id=${esc(e.source_id)};`);
 }
 for(const w of wanted){
  const sid=sourceId(projectToken,'wsl_path',w.locator);
  statements.push(`INSERT INTO sources(source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note,registered_at,source_status) VALUES(${esc(sid)},${esc(projectToken)},'wsl_path',${esc(w.locator)},${esc(w.locator)},${esc(w.label)},${esc(w.note)},${esc(now)},'registered') ON CONFLICT(project_token,source_type,normalized_path_or_locator) DO UPDATE SET operator_label=excluded.operator_label,operator_note=excluded.operator_note;`);
  statements.push(`INSERT INTO project_paths(project_token,path_id,source_id,operator_label,operator_note,added_at,removed_at) VALUES(${esc(projectToken)},${esc(w.path_id)},${esc(sid)},${esc(w.label)},${esc(w.note)},${esc(now)},NULL) ON CONFLICT(project_token,path_id) DO UPDATE SET source_id=excluded.source_id,operator_label=excluded.operator_label,operator_note=excluded.operator_note,removed_at=NULL;`);
 }
 statements.push(`UPDATE projects SET updated_at=${esc(now)},status=CASE WHEN status='Closed' THEN 'Pending' ELSE status END WHERE project_token=${esc(projectToken)};`);
 sql('BEGIN;'+statements.join('')+'COMMIT;');
 audit('projects',projectToken,'replace_paths',{paths:wanted.map(x=>x.locator)});
 return pcProjectPaths(projectToken);
};

pcCacheForFile=function(projectToken,f){
 const src=rows(`SELECT normalized_path_or_locator FROM sources WHERE project_token=${esc(projectToken)} AND source_id=${esc(f.source_id)} LIMIT 1`)[0];
 if(!src)return null;
 const i=pcIdentity(src.normalized_path_or_locator);
 const volumeRel=(i.relative_root==='.'?f.relative_path:(i.relative_root+'/'+f.relative_path)).replace(/^\.\//,'');
 const direct=rows(`SELECT sha256 FROM file_hash_cache WHERE path_id=${esc(i.path_id)} AND relative_path=${esc(f.relative_path)} AND size=${Number(f.size)} AND modified_at=${Number(f.modified_at)} LIMIT 1`)[0]?.sha256;
 const relocated=rows(`SELECT sha256 FROM file_locator_cache WHERE volume_id=${esc(i.volume_id)} AND volume_relative_path=${esc(volumeRel)} AND size=${Number(f.size)} AND modified_at=${Number(f.modified_at)} LIMIT 1`)[0]?.sha256;
 return {...i,volume_relative_path:volumeRel,cache:direct||relocated||null};
};

pcRecordFile=function(i,f,sha,status='done'){
 const now=pcNow(),fn=path.basename(f.relative_path);
 sql(`INSERT INTO file_observations(path_id,relative_path,filename,full_path,size,modified_at,sha256,status,observed_at) VALUES(${esc(i.path_id)},${esc(f.relative_path)},${esc(fn)},${esc(f.full_path)},${Number(f.size)},${Number(f.modified_at)},${sha?esc(sha):'NULL'},${esc(status)},${esc(now)}) ON CONFLICT(path_id,relative_path) DO UPDATE SET filename=excluded.filename,full_path=excluded.full_path,size=excluded.size,modified_at=excluded.modified_at,sha256=excluded.sha256,status=excluded.status,observed_at=excluded.observed_at;`);
 if(sha){
  sql(`INSERT INTO file_catalog(sha256,size,first_seen_at,last_seen_at) VALUES(${esc(sha)},${Number(f.size)},${esc(now)},${esc(now)}) ON CONFLICT(sha256) DO UPDATE SET last_seen_at=excluded.last_seen_at;
 INSERT OR REPLACE INTO file_hash_cache(path_id,relative_path,size,modified_at,sha256,verified_at) VALUES(${esc(i.path_id)},${esc(f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(sha)},${esc(now)});
 INSERT OR REPLACE INTO file_locator_cache(volume_id,volume_relative_path,size,modified_at,sha256,verified_at) VALUES(${esc(i.volume_id)},${esc(i.volume_relative_path||f.relative_path)},${Number(f.size)},${Number(f.modified_at)},${esc(sha)},${esc(now)});`);
 }
};

pcAnalysis=function(projectToken){
 pcEnsureSchema();
 const paths=pcSyncProjectPaths(projectToken),ids=paths.map(x=>x.path_id);
 if(!ids.length)return {project_token:projectToken,paths:0,files:0,bytes:0,exact_duplicate_groups:0,duplicate_files:0,reclaimable_bytes:0,target_copy_bytes:0,target_required_with_10pct_margin:0,conflicts:0,unfingerprinted:0};
 const list=ids.map(esc).join(',');
 const obs=rows(`SELECT path_id,relative_path,full_path,size,modified_at,sha256,status FROM file_observations WHERE path_id IN (${list})`);
 const physical=new Map();for(const x of obs){const k=x.full_path||x.path_id+'\0'+x.relative_path;physical.set(k,x)}
 const vals=[...physical.values()],by=new Map();let total=0,unknownBytes=0;
 for(const x of vals){total+=Number(x.size||0);if(!x.sha256){unknownBytes+=Number(x.size||0);continue}const a=by.get(x.sha256)||[];a.push(x);by.set(x.sha256,a)}
 let groups=0,dupFiles=0,reclaim=0,uniqueCopy=0;
 for(const [,a] of by){const size=Number(a[0]?.size||0);uniqueCopy+=size;if(a.length>1){groups++;dupFiles+=a.length-1;reclaim+=size*(a.length-1)}}
 const conflicts=rows(`SELECT COUNT(*) n FROM (SELECT relative_path,COUNT(DISTINCT sha256) c FROM file_observations WHERE path_id IN (${list}) AND sha256 IS NOT NULL GROUP BY relative_path HAVING c>1)`)[0]?.n||0;
 const copy=uniqueCopy+unknownBytes;
 return {project_token:projectToken,paths:paths.length,files:vals.length,bytes:total,exact_duplicate_groups:groups,duplicate_files:dupFiles,reclaimable_bytes:reclaim,target_copy_bytes:copy,target_required_with_10pct_margin:Math.ceil(copy*1.10),conflicts:Number(conflicts||0),unfingerprinted:vals.filter(x=>!x.sha256).length};
};

const pcHardPriorHandle=handle;
handle=async function(req,res,url){
 if(url.pathname==='/api/sot/health'&&req.method==='GET'){
  json(res,200,{service:'sot',status:'ok',version:VERSION,build:PC_HARDEN_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','volume-relative-hash-reuse','path-centric-projects','progressive-explorer-index','inventory-reporting','impact-analysis','db-admin','diagnostic-log']});return true;
 }
 return pcHardPriorHandle(req,res,url);
};
