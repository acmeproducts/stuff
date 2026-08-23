/* SOT stabilization admin — database snapshots, source preflight, recycle-bin skip policy */
const SOT_STABILITY_ADMIN_BUILD='2026.08.23.stability-admin-1';
const {spawnSync}=require('child_process');

function saNow(){return new Date().toISOString()}
function saRecycle(p){return /(^|[\\/])\$RECYCLE\.BIN([\\/]|$)/i.test(String(p||''))}
function saDriveRoot(p){const m=String(p||'').match(/^\/mnt\/([a-z])(?:\/|$)/i);return m?'/mnt/'+m[1].toLowerCase():null}
function saMountInfo(p){
  try{
    const out=execFileSync('findmnt',['-T',String(p),'-n','-o','TARGET,FSTYPE,SOURCE'],{encoding:'utf8',timeout:1500}).trim();
    const parts=out.split(/\s+/);return {target:parts[0]||'',fstype:parts[1]||'',source:parts.slice(2).join(' ')};
  }catch(e){return {target:'',fstype:'',source:'',error:String(e.message||e)}}
}
function saSourcePreflightRow(s){
  const p=String(s.normalized_path_or_locator||s.path||'');
  if(saRecycle(p))return {source_id:s.source_id||s.id,path:p,status:'ignored_recycle_bin',blocking:false,warning:'Legacy $RECYCLE.BIN source will be skipped.'};
  if(String(s.source_type||'wsl_path')!=='wsl_path')return {source_id:s.source_id||s.id,path:p,status:'ready',blocking:false};
  const drive=saDriveRoot(p),mount=saMountInfo(p);let exists=false,readable=false;
  try{exists=fs.existsSync(p)}catch{}
  try{fs.accessSync(p,fs.constants.R_OK);readable=true}catch{}
  if(drive && mount.target!==drive)return {source_id:s.source_id||s.id,path:p,status:'not_mounted',blocking:true,mount,warning:`${drive} is not mounted; processing must not start.`};
  if(!exists)return {source_id:s.source_id||s.id,path:p,status:'missing',blocking:true,mount,warning:'Source path does not exist.'};
  if(!readable)return {source_id:s.source_id||s.id,path:p,status:'unreadable',blocking:true,mount,warning:'Source path is not readable.'};
  return {source_id:s.source_id||s.id,path:p,status:'ready',blocking:false,mount};
}
function saProjectPreflight(t){
  const p=project(t);if(!p)throw new Error('project not found');
  const sources=(p.sources||[]).map(saSourcePreflightRow),blocking=sources.filter(x=>x.blocking),warnings=sources.filter(x=>!x.blocking&&x.warning);
  return {build:SOT_STABILITY_ADMIN_BUILD,project_token:t,project_name:p.project_name,sources,ready:blocking.length===0,blocking_count:blocking.length,warning_count:warnings.length,checked_at:saNow()};
}
function saDbStatus(){
  init();const c=cfg(),db=c.database_path,st=fs.statSync(db);const tabs=rows(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).map(x=>x.name);
  const counts={};for(const t of tabs){try{counts[t]=Number(rows(`SELECT COUNT(*) n FROM ${ident(t)}`)[0]?.n||0)}catch{counts[t]=null}}
  return {build:SOT_STABILITY_ADMIN_BUILD,database_path:db,backup_path:c.database_backup_path,size:st.size,modified_at:st.mtime.toISOString(),integrity:integrity(),journal_mode:rows('PRAGMA journal_mode;')[0],tables:counts};
}
function saStamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z$/,'Z')}
function saBackup(){
  init();const c=cfg(),db=c.database_path,dir=c.database_backup_path||path.join(path.dirname(db),'backups');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,`sot-${saStamp()}.sqlite`);
  const r=spawnSync('sqlite3',[db,`.backup '${dest.replace(/'/g,"''")}'`],{encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});
  if(r.error||r.status!==0)throw new Error(`backup failed: ${r.error?.message||r.stderr||'sqlite3 status '+r.status}`);
  const st=fs.statSync(dest);audit('database',dest,'backup',{source:db,size:st.size});return {ok:true,path:dest,size:st.size,created_at:st.mtime.toISOString()};
}
function saDump(){
  init();const c=cfg(),db=c.database_path,dir=c.database_backup_path||path.join(path.dirname(db),'backups');fs.mkdirSync(dir,{recursive:true});const dest=path.join(dir,`sot-${saStamp()}.sql`),fd=fs.openSync(dest,'w');
  try{const r=spawnSync('sqlite3',[db,'.dump'],{stdio:['ignore',fd,'pipe'],encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024});if(r.error||r.status!==0)throw new Error(`dump failed: ${r.error?.message||r.stderr||'sqlite3 status '+r.status}`)}finally{fs.closeSync(fd)}
  const st=fs.statSync(dest);audit('database',dest,'dump',{source:db,size:st.size});return {ok:true,path:dest,size:st.size,created_at:st.mtime.toISOString()};
}
function saBackups(){
  const c=cfg(),dir=c.database_backup_path||path.join(path.dirname(c.database_path),'backups');if(!fs.existsSync(dir))return {path:dir,files:[]};
  const files=fs.readdirSync(dir).filter(x=>/^sot-.*\.(sqlite|sql)$/i.test(x)).map(name=>{const p=path.join(dir,name),st=fs.statSync(p);return {name,path:p,size:st.size,modified_at:st.mtime.toISOString()}}).sort((a,b)=>b.modified_at.localeCompare(a.modified_at));return {path:dir,files};
}

// Historical source rows that point directly at $RECYCLE.BIN are ignored at enumeration time.
// New project/path validation may continue to reject adding them; legacy rows must not stop a run.
const saPriorCollectFiles=typeof collectFiles==='function'?collectFiles:null;
if(saPriorCollectFiles){
  collectFiles=async function(rootPath){
    if(saRecycle(rootPath))return [];
    const out=[],stack=[{dir:rootPath,rel:''}];
    while(stack.length){const {dir,rel}=stack.pop();let ents;try{ents=await fsp.readdir(dir,{withFileTypes:true})}catch{continue}
      for(const e of ents){const full=path.join(dir,e.name),r=rel?rel+'/'+e.name:e.name;if(e.isDirectory()){if(saRecycle(full))continue;stack.push({dir:full,rel:r})}else if(e.isFile()){try{const st=await fsp.stat(full);out.push({full,rel:r,size:st.size,mtime:st.mtimeMs})}catch{}}}
    }return out;
  };
}

const saPriorHandle=handle;
handle=async function(req,res,url){
  const pn=url.pathname;
  try{
    if(pn==='/api/sot/admin/db/status'&&req.method==='GET'){json(res,200,saDbStatus());return true}
    if(pn==='/api/sot/admin/db/backup'&&req.method==='POST'){json(res,200,saBackup());return true}
    if(pn==='/api/sot/admin/db/dump'&&req.method==='POST'){json(res,200,saDump());return true}
    if(pn==='/api/sot/admin/db/backups'&&req.method==='GET'){json(res,200,saBackups());return true}
    let m=pn.match(/^\/api\/sot\/admin\/projects\/([^/]+)\/preflight$/);
    if(m&&req.method==='GET'){json(res,200,saProjectPreflight(decodeURIComponent(m[1])));return true}
    return saPriorHandle(req,res,url);
  }catch(e){json(res,400,{error:e.message,build:SOT_STABILITY_ADMIN_BUILD});return true}
};
