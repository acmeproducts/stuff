'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const os=require('os');
const {execFileSync}=require('child_process');

const VERSION='0.3.1', BUILD='2026.08.12.5.0';
const ROOT=path.join(os.homedir(),'.openclaw','sot');
const DEFAULT_DB=path.join(ROOT,'sot.sqlite');
const DEFAULT_BACKUP=path.join(ROOT,'backups');
const CONFIG=path.join(ROOT,'config.json');
const HOME=os.homedir();

function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6){reject(new Error('request too large'));req.destroy();}});req.on('end',()=>{try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);}});req.on('error',reject);});}
function cfg(){try{return {...{database_path:DEFAULT_DB,database_backup_path:DEFAULT_BACKUP},...JSON.parse(fs.readFileSync(CONFIG,'utf8'))};}catch(_){return {database_path:DEFAULT_DB,database_backup_path:DEFAULT_BACKUP};}}
function saveCfg(c){fs.mkdirSync(path.dirname(CONFIG),{recursive:true});fs.writeFileSync(CONFIG,JSON.stringify(c,null,2));}
function sql(q,db=cfg().database_path){fs.mkdirSync(path.dirname(db),{recursive:true});return execFileSync('sqlite3',['-json',db,q],{encoding:'utf8'}).trim();}
function esc(v){return "'"+String(v??'').replace(/'/g,"''")+"'";}
function ensureColumn(table,col,ddl){try{sql(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl};`);}catch(e){if(!String(e.message||e).includes('duplicate column name'))throw e;}}
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
      status TEXT NOT NULL DEFAULT 'new',
      current_stage TEXT NOT NULL DEFAULT 'setup',
      current_run_id TEXT,
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS sources(
      source_id TEXT PRIMARY KEY,
      project_token TEXT NOT NULL,
      source_type TEXT NOT NULL DEFAULT 'wsl_path',
      path TEXT,
      locator TEXT,
      operator_label TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      fingerprint TEXT,
      fingerprinted_at TEXT,
      created_at TEXT NOT NULL,
      last_seen_at TEXT,
      source_status TEXT NOT NULL DEFAULT 'registered',
      parent_sot_generation_id TEXT,
      UNIQUE(project_token,source_type,path,locator)
    );
    CREATE TABLE IF NOT EXISTS runs(
      run_id TEXT PRIMARY KEY,
      project_token TEXT NOT NULL,
      started_at TEXT,
      ended_at TEXT,
      status TEXT NOT NULL DEFAULT 'not_started',
      restart_of_run_id TEXT,
      checkpoint_state TEXT
    );
    CREATE TABLE IF NOT EXISTS events(
      event_id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_token TEXT,
      run_id TEXT,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'operator',
      detail TEXT NOT NULL DEFAULT ''
    );
    INSERT OR REPLACE INTO meta(key,value) VALUES('schema_version','0.3.1');`,db);
  ensureColumn('projects','active','INTEGER NOT NULL DEFAULT 1');
  ensureColumn('projects','current_run_id','TEXT');
  ensureColumn('sources','source_type',"TEXT NOT NULL DEFAULT 'wsl_path'");
  ensureColumn('sources','locator','TEXT');
  ensureColumn('sources','operator_label',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('sources','note',"TEXT NOT NULL DEFAULT ''");
  ensureColumn('sources','fingerprinted_at','TEXT');
  ensureColumn('sources','last_seen_at','TEXT');
  ensureColumn('sources','source_status',"TEXT NOT NULL DEFAULT 'registered'");
  ensureColumn('sources','parent_sot_generation_id','TEXT');
  return db;
}
function rows(q){init();const x=sql(q);return x?JSON.parse(x):[];}
function roots(){const out=[];for(const letter of 'cdefghijklmnopqrstuvwxyz'){const p='/mnt/'+letter;try{if(fs.statSync(p).isDirectory())out.push({name:letter.toUpperCase()+':',path:p,kind:'storage'});}catch(_){}}out.push({name:'WSL Home',path:HOME,kind:'storage'});return out;}
function browse(p){if(!p||p==='/')return {path:'/',folders:roots().map(x=>x.name),files:[],paths:Object.fromEntries(roots().map(x=>[x.name,x.path])),locations:roots()};const rp=path.resolve(p);const items=fs.readdirSync(rp,{withFileTypes:true});const folders=[],files=[];for(const e of items){if(e.isDirectory())folders.push(e.name);else if(e.isFile())files.push(e.name);}folders.sort((a,b)=>a.localeCompare(b));files.sort((a,b)=>a.localeCompare(b));return {path:rp,parent:path.dirname(rp),folders,files,paths:Object.fromEntries(folders.map(n=>[n,path.join(rp,n)]))};}
function token(){return crypto.randomBytes(12).toString('hex');}
function sourceId(projectToken,src){return crypto.createHash('sha256').update(projectToken+'\0'+src.source_type+'\0'+(src.path||src.locator||'')).digest('hex').slice(0,24);}
function normalizeSource(x){
  if(typeof x==='string')return {source_type:'wsl_path',path:x,locator:null,operator_label:path.basename(x)||x,note:''};
  const type=String(x?.source_type||'wsl_path');
  const p=x?.path?String(x.path):null, loc=x?.locator?String(x.locator):null;
  return {source_type:type,path:p,locator:loc,operator_label:String(x?.operator_label||path.basename(p||loc||'')||p||loc||''),note:String(x?.note||'')};
}
function project(t){const p=rows(`SELECT * FROM projects WHERE project_token=${esc(t)} LIMIT 1`)[0];if(!p)return null;p.sources=rows(`SELECT source_id,source_type,path,locator,operator_label,note,fingerprint,fingerprinted_at,created_at,last_seen_at,source_status,parent_sot_generation_id FROM sources WHERE project_token=${esc(t)} ORDER BY created_at,source_id`);p.runs=rows(`SELECT * FROM runs WHERE project_token=${esc(t)} ORDER BY started_at DESC`);return p;}
function integrity(){const db=init();const r=execFileSync('sqlite3',[db,'PRAGMA integrity_check;'],{encoding:'utf8'}).trim();return {ok:r==='ok',result:r,database_path:db,schema_version:rows("SELECT value FROM meta WHERE key='schema_version'")[0]?.value||VERSION};}
function validateConfigInput(b){const db=String(b.database_path||'').trim(),backup=String(b.database_backup_path||'').trim();if(!db)throw new Error('database_path is required');if(!path.isAbsolute(db))throw new Error('database_path must be an absolute path');if(backup&&!path.isAbsolute(backup))throw new Error('database_backup_path must be an absolute path');return {database_path:db,database_backup_path:backup||DEFAULT_BACKUP};}
function record(projectToken,eventType,detail,runId=null){sql(`INSERT INTO events(project_token,run_id,event_type,created_at,detail) VALUES(${esc(projectToken)},${runId?esc(runId):'NULL'},${esc(eventType)},${esc(new Date().toISOString())},${esc(JSON.stringify(detail||{}))});`);}

async function handle(req,res,url){
  const pn=url.pathname;
  if(!pn.startsWith('/api/sot/'))return false;
  try{
    if(pn==='/api/sot/health'){const i=integrity();json(res,200,{service:'sot',status:i.ok?'ok':'error',version:VERSION,build:BUILD,server:'session-server.js',port:18080,database_path:i.database_path,schema_version:i.schema_version,engine:{ready:false,reason:'ENGINE_NOT_READY'}});return true;}
    if(pn==='/api/sot/fs'&&req.method==='GET'){json(res,200,browse(url.searchParams.get('path')||'/'));return true;}
    if(pn==='/api/sot/config'&&req.method==='GET'){const c=cfg();let i=null;try{i=integrity();}catch(e){i={ok:false,result:e.message,database_path:c.database_path};}json(res,200,{...c,integrity:i});return true;}
    if(pn==='/api/sot/config'&&req.method==='POST'){const c=validateConfigInput(await body(req));saveCfg(c);fs.mkdirSync(path.dirname(c.database_path),{recursive:true});fs.mkdirSync(c.database_backup_path,{recursive:true});const i=integrity();json(res,200,{...c,integrity:i});return true;}
    if(pn==='/api/sot/config/integrity'&&req.method==='GET'){json(res,200,integrity());return true;}
    if(pn==='/api/sot/projects/health'){const i=integrity();json(res,200,{status:i.ok?'ok':'error',version:VERSION,build:BUILD,schema_version:i.schema_version});return true;}
    if(pn==='/api/sot/projects'&&req.method==='GET'){json(res,200,rows('SELECT * FROM projects ORDER BY created_at DESC'));return true;}
    if(pn==='/api/sot/projects'&&req.method==='POST'){
      const b=await body(req),name=String(b.project_name||b.name||'').trim(),sourceRows=(b.sources||[]).map(normalizeSource).filter(x=>x.path||x.locator);
      if(!name||!sourceRows.length){json(res,400,{error:'project_name and at least one source are required'});return true;}
      const now=new Date().toISOString(),t=token(),active=b.active===false||b.active===0?0:1;
      init();
      sql('BEGIN;'+`INSERT INTO projects(project_token,project_name,active,created_at,updated_at,status,current_stage,notes) VALUES(${esc(t)},${esc(name)},${active},${esc(now)},${esc(now)},'new','setup',${esc(b.notes||'')});`+sourceRows.map(src=>`INSERT INTO sources(source_id,project_token,source_type,path,locator,operator_label,note,created_at,last_seen_at,source_status) VALUES(${esc(sourceId(t,src))},${esc(t)},${esc(src.source_type)},${src.path?esc(src.path):'NULL'},${src.locator?esc(src.locator):'NULL'},${esc(src.operator_label)},${esc(src.note)},${esc(now)},${esc(now)},'registered');`).join('')+'COMMIT;');
      record(t,'project.created',{sources:sourceRows.length,active:!!active});json(res,201,project(t));return true;
    }
    if(pn==='/api/sot/projects/bulk'&&req.method==='PATCH'){
      const b=await body(req),tokens=Array.isArray(b.project_tokens)?b.project_tokens.map(String).filter(Boolean):[];
      if(!tokens.length||typeof b.active!=='boolean'){json(res,400,{error:'project_tokens and boolean active are required'});return true;}
      const now=new Date().toISOString(),list=tokens.map(esc).join(',');sql(`UPDATE projects SET active=${b.active?1:0},updated_at=${esc(now)} WHERE project_token IN (${list});`);for(const t of tokens)record(t,'project.active_changed',{active:b.active,bulk:true});json(res,200,{updated:tokens.length,active:b.active});return true;
    }
    let m=pn.match(/^\/api\/sot\/projects\/([^/]+)$/);
    if(m&&req.method==='GET'){const p=project(decodeURIComponent(m[1]));json(res,p?200:404,p||{error:'not found'});return true;}
    if(m&&req.method==='PATCH'){
      const t=decodeURIComponent(m[1]),b=await body(req),sets=[];
      if(b.project_name!=null){const n=String(b.project_name).trim();if(!n){json(res,400,{error:'project_name cannot be empty'});return true;}sets.push(`project_name=${esc(n)}`);}
      if(b.notes!=null)sets.push(`notes=${esc(b.notes)}`);
      if(typeof b.active==='boolean')sets.push(`active=${b.active?1:0}`);
      if(!sets.length){json(res,400,{error:'nothing mutable to update'});return true;}
      sets.push(`updated_at=${esc(new Date().toISOString())}`);sql(`UPDATE projects SET ${sets.join(',')} WHERE project_token=${esc(t)}`);record(t,'project.updated',{fields:Object.keys(b).filter(k=>['project_name','notes','active'].includes(k))});json(res,200,project(t));return true;
    }
    let sm=pn.match(/^\/api\/sot\/projects\/([^/]+)\/sources\/([^/]+)$/);
    if(sm&&req.method==='PATCH'){
      const t=decodeURIComponent(sm[1]),sid=decodeURIComponent(sm[2]),b=await body(req),sets=[];
      if(b.operator_label!=null)sets.push(`operator_label=${esc(b.operator_label)}`);
      if(b.note!=null)sets.push(`note=${esc(b.note)}`);
      if(b.source_status!=null)sets.push(`source_status=${esc(b.source_status)}`);
      if(!sets.length){json(res,400,{error:'nothing mutable to update'});return true;}
      sql(`UPDATE sources SET ${sets.join(',')} WHERE source_id=${esc(sid)} AND project_token=${esc(t)};`);record(t,'source.updated',{source_id:sid,fields:Object.keys(b)});json(res,200,project(t));return true;
    }
    if(m&&req.method==='DELETE'){const t=decodeURIComponent(m[1]);sql(`DELETE FROM sources WHERE project_token=${esc(t)}; DELETE FROM runs WHERE project_token=${esc(t)}; DELETE FROM events WHERE project_token=${esc(t)}; DELETE FROM projects WHERE project_token=${esc(t)};`);json(res,200,{success:true});return true;}
    if(pn==='/api/sot/reports/aggregate'){json(res,200,{projects:rows('SELECT COUNT(*) AS count FROM projects')[0]?.count||0,active_projects:rows('SELECT COUNT(*) AS count FROM projects WHERE active=1')[0]?.count||0,sources:rows('SELECT COUNT(*) AS count FROM sources')[0]?.count||0});return true;}
    if(pn==='/api/sot/reports/timeline'){json(res,200,rows('SELECT * FROM events ORDER BY created_at DESC LIMIT 500'));return true;}
    json(res,404,{error:'SOT route not found'});return true;
  }catch(e){json(res,500,{error:e.message});return true;}
}
module.exports={handle,VERSION,BUILD};
