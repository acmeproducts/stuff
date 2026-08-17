'use strict';
const fs=require('fs');
const path=require('path');
const os=require('os');
const {execFileSync}=require('child_process');

const ROOT=path.join(os.homedir(),'.openclaw','sot');
const DB=path.join(ROOT,'sot.sqlite');

function run(sql){return execFileSync('sqlite3',[DB,sql],{encoding:'utf8'}).trim();}
function rows(sql){const out=execFileSync('sqlite3',['-json',DB,sql],{encoding:'utf8'}).trim();return out?JSON.parse(out):[];}
function hasColumn(table,col){return rows(`PRAGMA table_info(${table});`).some(r=>r.name===col);}
function addColumn(table,col,ddl){if(!hasColumn(table,col)){run(`ALTER TABLE ${table} ADD COLUMN ${col} ${ddl};`);console.log(`added ${table}.${col}`);}}

if(!fs.existsSync(DB))throw new Error(`Database not found: ${DB}`);
const backup=DB+`.before-0.4.1-migration-${new Date().toISOString().replace(/[:.]/g,'-')}`;
fs.copyFileSync(DB,backup);
console.log(`backup: ${backup}`);

run('PRAGMA journal_mode=WAL;');

addColumn('projects','active','INTEGER NOT NULL DEFAULT 1');
addColumn('projects','current_run_id','TEXT');
addColumn('projects','deleted_at','TEXT');
run("UPDATE projects SET status='Pending' WHERE lower(status) IN ('new','pending');");
run("UPDATE projects SET status='WIP' WHERE lower(status) IN ('running','wip');");
run("UPDATE projects SET status='Closed' WHERE lower(status) IN ('complete','completed','closed');");
run("UPDATE projects SET current_stage='setup' WHERE lower(current_stage) IN ('intake','new','setup');");

const srcCols=rows('PRAGMA table_info(sources);').map(r=>r.name);
const needsSourceRebuild=!srcCols.includes('source_type')||!srcCols.includes('original_path_or_locator')||!srcCols.includes('normalized_path_or_locator')||!srcCols.includes('operator_label')||!srcCols.includes('operator_note')||!srcCols.includes('registered_at')||!srcCols.includes('source_status');
if(needsSourceRebuild){
  const legacy='sources_legacy_041';
  run(`DROP TABLE IF EXISTS ${legacy}; ALTER TABLE sources RENAME TO ${legacy};`);
  run(`CREATE TABLE sources(
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
    file_count INTEGER NOT NULL DEFAULT 0,
    byte_count INTEGER NOT NULL DEFAULT 0,
    UNIQUE(project_token,source_type,normalized_path_or_locator)
  );`);
  const lc=rows(`PRAGMA table_info(${legacy});`).map(r=>r.name);
  const pathExpr=lc.includes('path')?'path':"''";
  const fpExpr=lc.includes('fingerprint')?"NULLIF(fingerprint,'')":'NULL';
  const createdExpr=lc.includes('created_at')?'created_at':"datetime('now')";
  const fcExpr=lc.includes('file_count')?'file_count':'0';
  const bcExpr=lc.includes('byte_count')?'byte_count':'0';
  run(`INSERT INTO sources(source_id,project_token,source_type,original_path_or_locator,normalized_path_or_locator,operator_label,operator_note,registered_at,last_seen_at,fingerprint,fingerprinted_at,source_status,parent_sot_generation_id,file_count,byte_count)
       SELECT source_id,project_token,'wsl_path',${pathExpr},${pathExpr},${pathExpr},'',${createdExpr},NULL,${fpExpr},CASE WHEN ${fpExpr} IS NOT NULL THEN ${createdExpr} ELSE NULL END,CASE WHEN ${fpExpr} IS NOT NULL THEN 'fingerprinted' ELSE 'registered' END,NULL,${fcExpr},${bcExpr} FROM ${legacy};`);
  run(`DROP TABLE ${legacy};`);
  console.log('rebuilt sources table to 0.4.1 schema');
}

run(`CREATE TABLE IF NOT EXISTS manifests(manifest_id TEXT PRIMARY KEY,project_token TEXT NOT NULL,source_id TEXT NOT NULL,relative_path TEXT NOT NULL,size INTEGER NOT NULL,modified_at REAL NOT NULL,sha256 TEXT NOT NULL,inventory_at TEXT NOT NULL,UNIQUE(project_token,source_id,relative_path));
CREATE INDEX IF NOT EXISTS idx_manifests_project_source ON manifests(project_token,source_id);
CREATE TABLE IF NOT EXISTS fs_scope_cache(cache_key TEXT PRIMARY KEY,path TEXT NOT NULL,signature TEXT NOT NULL,payload TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS meta(key TEXT PRIMARY KEY,value TEXT NOT NULL);
INSERT OR REPLACE INTO meta(key,value) VALUES('schema_version','0.4.1');`);

for(const [c,d] of [['files_total','INTEGER NOT NULL DEFAULT 0'],['files_done','INTEGER NOT NULL DEFAULT 0'],['bytes_done','INTEGER NOT NULL DEFAULT 0']])addColumn('runs',c,d);

const integrity=rows('PRAGMA integrity_check;');
console.log('integrity:',JSON.stringify(integrity));
console.log('projects:',rows('SELECT project_token,project_name,status,current_stage,active,current_run_id,deleted_at FROM projects;'));
console.log('sources:',rows('SELECT source_id,project_token,source_type,original_path_or_locator,source_status,file_count,byte_count FROM sources;'));
console.log('migration complete');
