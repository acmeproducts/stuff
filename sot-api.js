'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const os=require('os');
const {execFileSync}=require('child_process');

const VERSION='0.3.1', BUILD='2026.08.10.4.2';
const DEFAULT_DB=path.join(os.homedir(),'.openclaw','sot','sot.sqlite');
const CONFIG=path.join(os.homedir(),'.openclaw','sot','config.json');
const HOME=os.homedir();
function json(res,status,obj){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj));}
function body(req){return new Promise((resolve,reject)=>{let b='';req.on('data',c=>{b+=c;if(b.length>2e6)req.destroy();});req.on('end',()=>{try{resolve(b?JSON.parse(b):{});}catch(e){reject(e);}});req.on('error',reject);});}
function cfg(){try{return {...{database_path:DEFAULT_DB,database_backup_path:''},...JSON.parse(fs.readFileSync(CONFIG,'utf8'))};}catch(_){return {database_path:DEFAULT_DB,database_backup_path:''};}}
function saveCfg(c){fs.mkdirSync(path.dirname(CONFIG),{recursive:true});fs.writeFileSync(CONFIG,JSON.stringify(c,null,2));}
function sql(q,db=cfg().database_path){fs.mkdirSync(path.dirname(db),{recursive:true});return execFileSync('sqlite3',['-json',db,q],{encoding:'utf8'}).trim();}
function esc(v){return "'"+String(v??'').replace(/'/g,"''")+"'";}
function init(){const db=cfg().database_path;sql(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS projects(project_token TEXT PRIMARY KEY,project_name TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'new',current_stage TEXT NOT NULL DEFAULT 'intake',notes TEXT NOT NULL DEFAULT ''); CREATE TABLE IF NOT EXISTS sources(source_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,path TEXT NOT NULL,fingerprint TEXT NOT NULL,created_at TEXT NOT NULL,UNIQUE(project_token,path)); CREATE TABLE IF NOT EXISTS events(event_id INTEGER PRIMARY KEY AUTOINCREMENT,project_token TEXT,event_type TEXT NOT NULL,created_at TEXT NOT NULL,detail TEXT NOT NULL DEFAULT '');` ,db);}
function rows(q){init();const x=sql(q);return x?JSON.parse(x):[];}
function roots(){const out=[];for(const letter of 'cdefghijklmnopqrstuvwxyz'){const p='/mnt/'+letter;try{if(fs.statSync(p).isDirectory())out.push({name:letter.toUpperCase()+':',path:p,kind:'storage'});}catch(_){}}out.push({name:'WSL Home',path:HOME,kind:'storage'});return out;}
function browse(p){if(!p||p==='/')return {path:'/',folders:roots().map(x=>x.name),files:[],paths:Object.fromEntries(roots().map(x=>[x.name,x.path])),locations:roots()};const rp=path.resolve(p);const items=fs.readdirSync(rp,{withFileTypes:true});const folders=[],files=[];for(const e of items){if(e.isDirectory())folders.push(e.name);else if(e.isFile())files.push(e.name);}folders.sort();files.sort();return {path:rp,parent:path.dirname(rp),folders,files,paths:Object.fromEntries(folders.map(n=>[n,path.join(rp,n)]))};}
function token(name,sources){return crypto.createHash('sha256').update(new Date().toISOString()+'\0'+name+'\0'+sources.join('\0')).digest('hex').slice(0,24);}
function fingerprint(p){let st;try{st=fs.statSync(p);}catch(_){st=null;}return crypto.createHash('sha256').update(`${p}\0${st?st.dev:''}\0${st?st.ino:''}`).digest('hex');}
function project(token){const p=rows(`SELECT * FROM projects WHERE project_token=${esc(token)} LIMIT 1`)[0];if(!p)return null;p.sources=rows(`SELECT source_id,path,fingerprint,created_at FROM sources WHERE project_token=${esc(token)} ORDER BY created_at`);return p;}

async function handle(req,res,url){
  const pn=url.pathname;
  if(!pn.startsWith('/api/sot/'))return false;
  try{
    if(pn==='/api/sot/health'){init();json(res,200,{service:'sot',status:'ok',version:VERSION,build:BUILD,server:'session-server.js',port:18080});return true;}
    if(pn==='/api/sot/fs'&&req.method==='GET'){json(res,200,browse(url.searchParams.get('path')||'/'));return true;}
    if(pn==='/api/sot/config'&&req.method==='GET'){json(res,200,cfg());return true;}
    if(pn==='/api/sot/config'&&req.method==='POST'){const b=await body(req),c={...cfg(),...b};saveCfg(c);init();json(res,200,c);return true;}
    if(pn==='/api/sot/projects/health'){init();json(res,200,{status:'ok',version:VERSION,build:BUILD});return true;}
    if(pn==='/api/sot/projects'&&req.method==='GET'){json(res,200,rows('SELECT * FROM projects ORDER BY created_at DESC'));return true;}
    if(pn==='/api/sot/projects'&&req.method==='POST'){
      const b=await body(req),name=String(b.project_name||b.name||'').trim(),sources=(b.sources||[]).map(x=>typeof x==='string'?x:x.path).filter(Boolean);
      if(!name||!sources.length){json(res,400,{error:'project_name and at least one source are required'});return true;}
      const now=new Date().toISOString(),t=token(name,sources);
      init();
      sql('BEGIN;'+`INSERT OR IGNORE INTO projects(project_token,project_name,created_at,updated_at,status,current_stage,notes) VALUES(${esc(t)},${esc(name)},${esc(now)},${esc(now)},'new','intake',${esc(b.notes||'')});`+sources.map(p=>{const sid=crypto.createHash('sha256').update(t+'\0'+p).digest('hex').slice(0,24);return `INSERT OR IGNORE INTO sources(source_id,project_token,path,fingerprint,created_at) VALUES(${esc(sid)},${esc(t)},${esc(p)},${esc(fingerprint(p))},${esc(now)});`;}).join('')+`INSERT INTO events(project_token,event_type,created_at,detail) VALUES(${esc(t)},'project.created',${esc(now)},${esc(JSON.stringify({sources:sources.length}))});COMMIT;`);
      json(res,201,project(t));return true;
    }
    let m=pn.match(/^\/api\/sot\/projects\/([^/]+)$/);
    if(m&&req.method==='GET'){const p=project(m[1]);json(res,p?200:404,p||{error:'not found'});return true;}
    if(m&&req.method==='PATCH'){const b=await body(req),sets=[];if(b.project_name!=null)sets.push(`project_name=${esc(b.project_name)}`);if(b.notes!=null)sets.push(`notes=${esc(b.notes)}`);if(!sets.length){json(res,400,{error:'nothing to update'});return true;}sets.push(`updated_at=${esc(new Date().toISOString())}`);sql(`UPDATE projects SET ${sets.join(',')} WHERE project_token=${esc(m[1])}`);json(res,200,project(m[1]));return true;}
    if(m&&req.method==='DELETE'){sql(`DELETE FROM sources WHERE project_token=${esc(m[1])}; DELETE FROM events WHERE project_token=${esc(m[1])}; DELETE FROM projects WHERE project_token=${esc(m[1])};`);json(res,200,{success:true});return true;}
    if(pn==='/api/sot/reports/aggregate'){json(res,200,{projects:rows('SELECT COUNT(*) AS count FROM projects')[0]?.count||0,sources:rows('SELECT COUNT(*) AS count FROM sources')[0]?.count||0});return true;}
    if(pn==='/api/sot/reports/timeline'){json(res,200,rows('SELECT * FROM events ORDER BY created_at DESC LIMIT 500'));return true;}
    json(res,404,{error:'SOT route not found'});return true;
  }catch(e){json(res,500,{error:e.message});return true;}
}
module.exports={handle,VERSION,BUILD};
