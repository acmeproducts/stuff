'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const os=require('os');
const {execFileSync}=require('child_process');

const VERSION='0.3.1',BUILD='2026.08.12.5.1';
const ROOT=path.join(os.homedir(),'.openclaw','sot');
const DEFAULT_DB=path.join(ROOT,'sot.sqlite');
const DEFAULT_BACKUP=path.join(ROOT,'backups');
const CONFIG=path.join(ROOT,'config.json');
const HOME=os.homedir();
const TABLE_ALLOW=new Set(['meta','projects','sources','events','runs','inventory_runs','duplicate_clusters','conflicts','sot_generations','lineage','admin_events']);
const MUTABLE={
  projects:new Set(['project_name','active','status','current_stage','notes','deleted_at']),
  sources:new Set(['operator_label','operator_note','source_status','last_seen_at']),
  runs:new Set(['status','checkpoint_state','progress_percent','estimated_completion_at','ended_at']),
  meta:new Set(['value'])
};

function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6){reject(new Error('request too large'));req.destroy();}});req.on('end',()=>{try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);}});req.on('error',reject);});}
function cfg(){try{return {...{database_path:DEFAULT_DB,database_backup_path:DEFAULT_BACKUP},...JSON.parse(fs.readFileSync(CONFIG,'utf8'))};}catch(_){return {database_path:DEFAULT_DB,database_backup_path:DEFAULT_BACKUP};}}
function saveCfg(c){fs.mkdirSync(path.dirname(CONFIG),{recursive:true});fs.writeFileSync(CONFIG,JSON.stringify(c,null,2));}
function sql(q,db=cfg().database_path){fs.mkdirSync(path.dirname(db),{recursive:true});return execFileSync('sqlite3',['-json',db,q],{encoding:'utf8'}).trim();}
function esc(v){return "'"+String(v??'').replace(/'/g,"''")+"'";}
function ident(v){if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(v))throw new Error('invalid identifier');return v;}
function parseRows(x){return x?JSON.parse(x):[];}
function rows(q){init();return parseRows(sql(q));}
function ensureColumn(table,col,ddl){try{sql(`ALTER TABLE ${ident(table)} ADD COLUMN ${ident(col)} ${ddl};`);}catch(e){if(!String(e.message||e).includes('duplicate column name'))throw e;}}
function init(){
  const db=cfg().database_path;
  sql(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS projects(
      project_token TEXT PRIMARY KEY,
      project_name TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      current_stage TEXT NOT NULL DEFAULT 'setup',
      current_run_id TEXT,
      notes TEXT NOT NULL DEFAULT '',
      deleted_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sources(
      source_id TEXT PRIMARY KEY,
      project_token TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'wsl_path',
      original_path_or_locator TEXT NOT NULL,
      normalized_path_or_locator TEXT NOT NULL,
      operator_label TEXT NOT NULL DEFAULT '',
      operator_note TEXT NOT NULL DEFAULT '',
      registered_at TEXT NOT NULL,
      last_seen_at TEXT,
      fingerprint TEXT,
      fingerprinted_at TEXT,
      source_status TEXT NOT NULL DEFAULT 'registered',
      parent_sot_generation_id TEXT,
      UNIQUE(project_token,source_type,normalized_path_or_locator)
    );
    CREATE TABLE IF NOT EXISTS events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,project_token TEXT,event_type TEXT NOT NULL,created_at TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS runs(run_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,started_at TEXT,ended_at TEXT,status TEXT NOT NULL DEFAULT 'Pending',checkpoint_state TEXT,progress_percent REAL NOT NULL DEFAULT 0,estimated_completion_at TEXT);
    CREATE TABLE IF NOT EXISTS inventory_runs(inventory_run_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,source_id TEXT NOT NULL,started_at TEXT,last_progress_at TEXT,completed_at TEXT,elapsed_seconds REAL,files_seen INTEGER NOT NULL DEFAULT 0,bytes_seen INTEGER NOT NULL DEFAULT 0,files_per_second REAL,bytes_per_second REAL,estimated_remaining_seconds REAL,status TEXT,checkpoint_state TEXT,error_count INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS duplicate_clusters(cluster_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,content_hash TEXT,file_count INTEGER NOT NULL DEFAULT 0,bytes_each INTEGER NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'exact');
    CREATE TABLE IF NOT EXISTS conflicts(conflict_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,path_key TEXT,detail TEXT NOT NULL DEFAULT '',status TEXT NOT NULL DEFAULT 'open');
    CREATE TABLE IF NOT EXISTS sot_generations(generation_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,created_at TEXT NOT NULL,target_path TEXT,verification_status TEXT,status TEXT NOT NULL DEFAULT 'candidate');
    CREATE TABLE IF NOT EXISTS lineage(lineage_id INTEGER PRIMARY KEY AUTOINCREMENT,project_token TEXT NOT NULL,source_id TEXT,parent_generation_id TEXT,child_generation_id TEXT,created_at TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS admin_events(admin_event_id INTEGER PRIMARY KEY AUTOINCREMENT,created_at TEXT NOT NULL,table_name TEXT,row_key TEXT,action TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '');
    INSERT OR IGNORE INTO meta(key,value) VALUES('schema_version','0.3.1');`,db);
  // Migrate earlier v0.3.1 schemas in place.
  ensureColumn('projects','active','INTEGER NOT NULL DEFAULT 1');ensureColumn('projects','deleted_at','TEXT');ensureColumn('projects','current_run_id','TEXT');
  ensureColumn('sources','source_type',"TEXT NOT NULL DEFAULT 'wsl_path'");ensureColumn('sources','original_path_or_locator',"TEXT NOT NULL DEFAULT ''");ensureColumn('sources','normalized_path_or_locator',"TEXT NOT NULL DEFAULT ''");ensureColumn('sources','operator_label',"TEXT NOT NULL DEFAULT ''");ensureColumn('sources','operator_note',"TEXT NOT NULL DEFAULT ''");ensureColumn('sources','registered_at',"TEXT NOT NULL DEFAULT ''");ensureColumn('sources','last_seen_at','TEXT');ensureColumn('sources','fingerprinted_at','TEXT');ensureColumn('sources','source_status',"TEXT NOT NULL DEFAULT 'registered'");ensureColumn('sources','parent_sot_generation_id','TEXT');
  try{sql(`UPDATE sources SET original_path_or_locator=COALESCE(NULLIF(original_path_or_locator,''),path),normalized_path_or_locator=COALESCE(NULLIF(normalized_path_or_locator,''),path),operator_label=COALESCE(NULLIF(operator_label,''),path),operator_note=COALESCE(NULLIF(operator_note,''),note),registered_at=COALESCE(NULLIF(registered_at,''),created_at) WHERE 1=1;`);}catch(_){}
  try{sql(`UPDATE projects SET status=CASE WHEN lower(status) IN ('new','pending') THEN 'Pending' WHEN lower(status) IN ('running','wip') THEN 'WIP' WHEN lower(status) IN ('complete','closed') THEN 'Closed' ELSE status END;`);}catch(_){}
}
function integrity(){init();const r=rows('PRAGMA integrity_check;');const value=r[0]?.integrity_check||r[0]?.['integrity_check']||Object.values(r[0]||{})[0]||'unknown';return {ok:String(value).toLowerCase()==='ok',result:value,database_path:cfg().database_path};}
function roots(){const out=[];for(const letter of 'cdefghijklmnopqrstuvwxyz'){const p='/mnt/'+letter;try{if(fs.statSync(p).isDirectory())out.push({name:letter.toUpperCase()+':',path:p,kind:'storage'});}catch(_){}}out.push({name:'WSL Home',path:HOME,kind:'storage'});return out;}
function browse(p){if(!p||p==='/')return {path:'/',folders:roots().map(x=>x.name),files:[],paths:Object.fromEntries(roots().map(x=>[x.name,x.path])),locations:roots()};const rp=path.resolve(p);const items=fs.readdirSync(rp,{withFileTypes:true});const folders=[],files=[];for(const e of items){if(e.isDirectory())folders.push(e.name);else if(e.isFile())files.push(e.name);}folders.sort((a,b)=>a.localeCompare(b));files.sort((a,b)=>a.localeCompare(b));return {path:rp,parent:path.dirname(rp),folders,files};}
function token(){return crypto.randomBytes(12).toString('hex');}
function sourceId(projectToken,type,locator){return crypto.createHash('sha256').update(projectToken+'\0'+type+'\0'+locator).digest('hex').slice(0,24);}
function normalizeLocator(type,v){if(type==='wsl_path'){try{return path.resolve(v);}catch{return v;}}return v;}
function sourceRowsFromBody(projectToken,input,now){return (input||[]).map(x=>typeof x==='string'?{source_type:'wsl_path',path:x,operator_label:path.basename(x)||x,note:''}:x).map(x=>{const type=String(x.source_type||'wsl_path'),orig=String(x.path||x.locator||x.original_path_or_locator||''),norm=normalizeLocator(type,orig);return {source_id:sourceId(projectToken,type,norm),project_token:projectToken,source_type:type,original:orig,normalized:norm,label:String(x.operator_label||path.basename(orig)||orig),note:String(x.note||x.operator_note||''),registered_at:now};}).filter(x=>x.original);}
function project(t){const p=rows(`SELECT * FROM projects WHERE project_token=${esc(t)} LIMIT 1`)[0];if(!p)return null;p.sources=rows(`SELECT source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note AS note,registered_at,last_seen_at,fingerprint,fingerprinted_at,source_status,parent_sot_generation_id FROM sources WHERE project_token=${esc(t)} ORDER BY registered_at,source_id`);p.run=p.current_run_id?rows(`SELECT * FROM runs WHERE run_id=${esc(p.current_run_id)} LIMIT 1`)[0]||null:null;return p;}
function audit(table,key,action,detail){sql(`INSERT INTO admin_events(created_at,table_name,row_key,action,detail) VALUES(${esc(new Date().toISOString())},${esc(table)},${esc(key||'')},${esc(action)},${esc(JSON.stringify(detail||{}))});`);}
function projectReport(t){const p=project(t);if(!p)return null;const inv=rows(`SELECT COALESCE(SUM(files_seen),0) files,COALESCE(SUM(bytes_seen),0) bytes,COUNT(*) runs FROM inventory_runs WHERE project_token=${esc(t)} AND status IN ('complete','completed','Closed')`)[0]||{files:0,bytes:0,runs:0};const dup=rows(`SELECT COALESCE(SUM(CASE WHEN file_count>1 THEN file_count-1 ELSE 0 END),0) duplicate_files,COALESCE(SUM(CASE WHEN file_count>1 THEN (file_count-1)*bytes_each ELSE 0 END),0) duplicate_bytes,COUNT(*) clusters FROM duplicate_clusters WHERE project_token=${esc(t)}`)[0]||{};const conflicts=rows(`SELECT * FROM conflicts WHERE project_token=${esc(t)} ORDER BY conflict_id LIMIT 200`);return {project:p,inventory:{available:Number(inv.runs)>0,...inv},duplicates:{available:Number(dup.clusters)>0,...dup},conflicts:{available:conflicts.length>0,items:conflicts}};}
function primaryKey(table){return {meta:'key',projects:'project_token',sources:'source_id',events:'event_id',runs:'run_id',inventory_runs:'inventory_run_id',duplicate_clusters:'cluster_id',conflicts:'conflict_id',sot_generations:'generation_id',lineage:'lineage_id',admin_events:'admin_event_id'}[table];}
function tableColumns(table){return rows(`PRAGMA table_info(${ident(table)});`).map(x=>({name:x.name,type:x.type,pk:!!x.pk,notnull:!!x.notnull,default:x.dflt_value}));}

async function handle(req,res,url){
  const pn=url.pathname;
  if(!pn.startsWith('/api/sot/'))return false;
  try{
    if(pn==='/api/sot/health'){init();json(res,200,{service:'sot',status:'ok',version:VERSION,build:BUILD,server:'session-server.js',port:18080});return true;}
    if(pn==='/api/sot/fs'&&req.method==='GET'){json(res,200,browse(url.searchParams.get('path')||'/'));return true;}
    if(pn==='/api/sot/config'&&req.method==='GET'){init();json(res,200,{...cfg(),schema_version:'0.3.1'});return true;}
    if(pn==='/api/sot/config'&&req.method==='POST'){const b=await body(req),c={...cfg()};if(b.database_path!=null)c.database_path=String(b.database_path).trim();if(b.database_backup_path!=null)c.database_backup_path=String(b.database_backup_path).trim();if(!c.database_path)throw new Error('database_path is required');if(!c.database_backup_path)throw new Error('database_backup_path is required');saveCfg(c);init();json(res,200,{...c,...integrity(),schema_version:'0.3.1'});return true;}
    if(pn==='/api/sot/config/integrity'&&req.method==='GET'){json(res,200,integrity());return true;}
    if(pn==='/api/sot/projects'&&req.method==='GET'){const includeDeleted=url.searchParams.get('include_deleted')==='1';json(res,200,rows(`SELECT * FROM projects ${includeDeleted?'':'WHERE deleted_at IS NULL'} ORDER BY created_at DESC`));return true;}
    if(pn==='/api/sot/projects'&&req.method==='POST'){const b=await body(req),name=String(b.project_name||'').trim();if(!name)throw new Error('project_name is required');if(!(b.sources||[]).length)throw new Error('at least one source is required');const now=new Date().toISOString(),t=token(),src=sourceRowsFromBody(t,b.sources,now);if(!src.length)throw new Error('at least one valid source is required');sql('BEGIN;'+`INSERT INTO projects(project_token,project_name,active,created_at,updated_at,status,current_stage,notes) VALUES(${esc(t)},${esc(name)},1,${esc(now)},${esc(now)},'Pending','setup',${esc(b.notes||'')});`+src.map(s=>`INSERT INTO sources(source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note,registered_at,source_status) VALUES(${esc(s.source_id)},${esc(t)},${esc(s.source_type)},${esc(s.original)},${esc(s.normalized)},${esc(s.label)},${esc(s.note)},${esc(now)},'registered');`).join('')+`INSERT INTO events(project_token,event_type,created_at,detail) VALUES(${esc(t)},'project.created',${esc(now)},${esc(JSON.stringify({sources:src.length}))});COMMIT;`);json(res,201,project(t));return true;}
    if(pn==='/api/sot/projects/bulk'&&req.method==='PATCH'){const b=await body(req),tokens=Array.isArray(b.project_tokens)?b.project_tokens:[];if(!tokens.length)throw new Error('project_tokens required');const active=b.active?1:0,now=new Date().toISOString();sql(`UPDATE projects SET active=${active},updated_at=${esc(now)} WHERE project_token IN (${tokens.map(esc).join(',')});`);audit('projects',tokens.join(','),'bulk.update',{active});json(res,200,{success:true,count:tokens.length});return true;}
    let m=pn.match(/^\/api\/sot\/projects\/([^/]+)$/);
    if(m&&req.method==='GET'){const p=project(decodeURIComponent(m[1]));json(res,p?200:404,p||{error:'not found'});return true;}
    if(m&&req.method==='PATCH'){const t=decodeURIComponent(m[1]),b=await body(req),sets=[];if(b.project_name!=null)sets.push(`project_name=${esc(String(b.project_name).trim())}`);if(b.notes!=null)sets.push(`notes=${esc(b.notes)}`);if(b.active!=null)sets.push(`active=${b.active?1:0}`);if(b.status!=null){const st=String(b.status);if(!['Pending','WIP','Closed'].includes(st))throw new Error('invalid status');sets.push(`status=${esc(st)}`);}if(Object.prototype.hasOwnProperty.call(b,'deleted_at'))sets.push(`deleted_at=${b.deleted_at?esc(b.deleted_at):'NULL'}`);if(!sets.length)throw new Error('nothing to update');sets.push(`updated_at=${esc(new Date().toISOString())}`);sql(`UPDATE projects SET ${sets.join(',')} WHERE project_token=${esc(t)};`);audit('projects',t,'update',b);json(res,200,project(t));return true;}
    if(m&&req.method==='DELETE'){const t=decodeURIComponent(m[1]),now=new Date().toISOString();sql(`UPDATE projects SET deleted_at=${esc(now)},active=0,updated_at=${esc(now)} WHERE project_token=${esc(t)};`);audit('projects',t,'soft.delete',{});json(res,200,project(t));return true;}
    m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/restore$/);
    if(m&&req.method==='POST'){const t=decodeURIComponent(m[1]),now=new Date().toISOString();sql(`UPDATE projects SET deleted_at=NULL,active=1,updated_at=${esc(now)} WHERE project_token=${esc(t)};`);audit('projects',t,'restore',{});json(res,200,project(t));return true;}
    m=pn.match(/^\/api\/sot\/projects\/([^/]+)\/report$/);
    if(m&&req.method==='GET'){const r=projectReport(decodeURIComponent(m[1]));json(res,r?200:404,r||{error:'not found'});return true;}
    m=pn.match(/^\/api\/sot\/sources\/([^/]+)$/);
    if(m&&req.method==='PATCH'){const sid=decodeURIComponent(m[1]),b=await body(req),sets=[];for(const [k,v] of Object.entries(b)){if(MUTABLE.sources.has(k))sets.push(`${ident(k)}=${v==null?'NULL':esc(v)}`);}if(!sets.length)throw new Error('no mutable source fields supplied');sql(`UPDATE sources SET ${sets.join(',')} WHERE source_id=${esc(sid)};`);audit('sources',sid,'update',b);json(res,200,rows(`SELECT * FROM sources WHERE source_id=${esc(sid)} LIMIT 1`)[0]||{});return true;}
    if(pn==='/api/sot/reports/summary'&&req.method==='GET'){const p=rows(`SELECT COUNT(*) total,SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) current,SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) deleted,SUM(CASE WHEN active=1 AND deleted_at IS NULL THEN 1 ELSE 0 END) active,SUM(CASE WHEN active=0 AND deleted_at IS NULL THEN 1 ELSE 0 END) inactive,SUM(CASE WHEN status='Pending' AND deleted_at IS NULL THEN 1 ELSE 0 END) pending,SUM(CASE WHEN status='WIP' AND deleted_at IS NULL THEN 1 ELSE 0 END) wip,SUM(CASE WHEN status='Closed' AND deleted_at IS NULL THEN 1 ELSE 0 END) closed FROM projects`)[0]||{};const s=rows('SELECT COUNT(*) count FROM sources')[0]?.count||0,e=rows('SELECT COUNT(*) count FROM events')[0]?.count||0;json(res,200,{projects:p,sources:s,events:e});return true;}
    if(pn==='/api/sot/reports/timeline'&&req.method==='GET'){json(res,200,rows('SELECT * FROM events ORDER BY created_at DESC LIMIT 500'));return true;}
    if(pn==='/api/sot/db/tables'&&req.method==='GET'){json(res,200,[...TABLE_ALLOW].map(name=>({name,columns:tableColumns(name)})));return true;}
    m=pn.match(/^\/api\/sot\/db\/table\/([^/]+)$/);
    if(m&&req.method==='GET'){const table=decodeURIComponent(m[1]);if(!TABLE_ALLOW.has(table))throw new Error('table not allowed');const limit=Math.max(1,Math.min(200,Number(url.searchParams.get('limit')||50))),offset=Math.max(0,Number(url.searchParams.get('offset')||0));json(res,200,{table,primary_key:primaryKey(table),columns:tableColumns(table),rows:rows(`SELECT * FROM ${ident(table)} LIMIT ${limit} OFFSET ${offset}`),limit,offset});return true;}
    m=pn.match(/^\/api\/sot\/db\/table\/([^/]+)\/([^/]+)$/);
    if(m&&req.method==='PATCH'){const table=decodeURIComponent(m[1]),key=decodeURIComponent(m[2]);if(!TABLE_ALLOW.has(table)||!MUTABLE[table])throw new Error('table is read-only');const pk=primaryKey(table),b=await body(req),sets=[];for(const [k,v] of Object.entries(b)){if(MUTABLE[table].has(k))sets.push(`${ident(k)}=${v==null?'NULL':esc(v)}`);}if(!sets.length)throw new Error('no mutable fields supplied');sql(`UPDATE ${ident(table)} SET ${sets.join(',')} WHERE ${ident(pk)}=${esc(key)};`);audit(table,key,'row.update',b);json(res,200,{success:true});return true;}
    if(m&&req.method==='DELETE'){const table=decodeURIComponent(m[1]),key=decodeURIComponent(m[2]);if(table==='projects'){const now=new Date().toISOString();sql(`UPDATE projects SET deleted_at=${esc(now)},active=0,updated_at=${esc(now)} WHERE project_token=${esc(key)};`);audit('projects',key,'soft.delete',{});json(res,200,{success:true,soft:true});return true;}if(!['meta'].includes(table))throw new Error('delete not allowed for this table');const pk=primaryKey(table);sql(`DELETE FROM ${ident(table)} WHERE ${ident(pk)}=${esc(key)};`);audit(table,key,'row.delete',{});json(res,200,{success:true});return true;}
    json(res,404,{error:'SOT route not found'});return true;
  }catch(e){json(res,500,{error:e.message});return true;}
}
module.exports={handle,VERSION,BUILD};
