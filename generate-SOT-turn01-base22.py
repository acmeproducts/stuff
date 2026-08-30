#!/usr/bin/env python3
from pathlib import Path
import re, sys

if len(sys.argv) != 3:
    raise SystemExit('usage: generate-SOT-turn01-base22.py <clean-base3-api.js> <output-api.js>')

src = Path(sys.argv[1]).read_text()
required = [
    "const BUILD = '2026.08.28.sot-turn01-base-3';",
    '// TURN01_BASE_DIRECT_INTEGRATION',
    'function windowsDriveLetters() {',
    'function volumeRecord(letter) {',
    'function volumeRoots() {',
    'function sourcePreflight(source) {',
    'function createProject(input) {',
    'function replaceSources(projectToken, inputSources) {',
    'function review(projectToken) {',
    'function generatePlan(projectToken) {',
    'function listStorageFolder(inputPath) {'
]
for marker in required:
    if src.count(marker) != 1:
        raise SystemExit(f'clean-source contract failed for {marker!r}: count={src.count(marker)}')
for rejected in ['normalizeWindowsMountSource', 'mount helper completed but SOT rejected mount state']:
    if rejected in src:
        raise SystemExit(f'rejected lineage detected in clean input: {rejected}')

def function_span(text, name):
    pat = re.compile(r'(?m)^(?:async\s+)?function\s+' + re.escape(name) + r'\s*\(')
    matches = list(pat.finditer(text))
    if len(matches) != 1: raise SystemExit(f'function boundary ambiguous for {name}: {len(matches)} matches')
    start=matches[0].start(); brace=text.find('{',matches[0].end()); depth=0; quote=None; esc=False; i=brace
    while i < len(text):
        ch=text[i]
        if quote:
            if esc: esc=False
            elif ch=='\\': esc=True
            elif ch==quote: quote=None
        else:
            if ch in "'\"`": quote=ch
            elif ch=='{': depth+=1
            elif ch=='}':
                depth-=1
                if depth==0: return start,i+1
        i+=1
    raise SystemExit(f'unbalanced braces for {name}')

def replace_function(text,name,replacement):
    a,b=function_span(text,name); return text[:a]+replacement.rstrip()+text[b:]

helpers_at=function_span(src,'driveMounted')[0]
helpers=r'''let windowsVolumeCache={at:0,rows:[]};
let folderCatalog=new Map();

function windowsPowerShell(){return ['/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe','/mnt/c/WINDOWS/System32/WindowsPowerShell/v1.0/powershell.exe'].find(x=>fs.existsSync(x))||''}
function windowsVolumeSnapshot(force=false){const t=Date.now();if(!force&&windowsVolumeCache.rows.length)return windowsVolumeCache.rows;const ps=windowsPowerShell();if(!ps)return [];try{const out=execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop'; @(Get-PSDrive -PSProvider FileSystem | ForEach-Object { [pscustomobject]@{name=[string]$_.Name;free=[Int64]$_.Free;used=[Int64]$_.Used} }) | ConvertTo-Json -Compress"],{encoding:'utf8',timeout:10000,maxBuffer:4*1024*1024}).trim();const p=out?JSON.parse(out):[];const rows=(Array.isArray(p)?p:[p]).map(x=>({name:String(x.name||'').toLowerCase(),free_bytes:Number(x.free),total_bytes:Number(x.free)+Number(x.used)})).filter(x=>/^[a-z]$/.test(x.name)&&Number.isFinite(x.free_bytes)&&Number.isFinite(x.total_bytes));windowsVolumeCache={at:t,rows};return rows}catch{return windowsVolumeCache.rows||[]}}
function windowsPathForPosix(value){const r=path.resolve(String(value||'')),m=r.match(/^\/mnt\/([a-z])(?:\/(.*))?$/i);if(!m)return '';const tail=String(m[2]||'').split('/').filter(Boolean).join('\\\\');return `${m[1].toUpperCase()}:\\\\${tail}`}
function windowsDirectoryExists(value){const ps=windowsPowerShell(),p=windowsPathForPosix(value);if(!ps||!p)return false;try{return execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"$p=[Console]::In.ReadToEnd(); if(Test-Path -LiteralPath $p -PathType Container){'1'}else{'0'}"],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024,input:p}).trim()==='1'}catch{return false}}
function windowsDirectoryReadable(value){const ps=windowsPowerShell(),p=windowsPathForPosix(value);if(!ps||!p)return false;try{return execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';$p=[Console]::In.ReadToEnd();if(!(Test-Path -LiteralPath $p -PathType Container)){throw 'missing'};Get-ChildItem -LiteralPath $p -Force -ErrorAction Stop|Select-Object -First 1|Out-Null;'1'"],{encoding:'utf8',timeout:15000,maxBuffer:1024*1024,input:p}).trim()==='1'}catch{return false}}
function windowsListDirectories(value){const ps=windowsPowerShell(),p=windowsPathForPosix(value);if(!ps||!p)throw httpError(409,'Windows filesystem access is unavailable');try{const out=execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';$p=[Console]::In.ReadToEnd();if(!(Test-Path -LiteralPath $p -PathType Container)){throw 'missing'};@(Get-ChildItem -LiteralPath $p -Directory -Force|Where-Object{$_.Name -ne '$RECYCLE.BIN'}|Select-Object -ExpandProperty Name)|ConvertTo-Json -Compress"],{encoding:'utf8',timeout:20000,maxBuffer:16*1024*1024,input:p}).trim();if(!out)return [];const j=JSON.parse(out);return(Array.isArray(j)?j:[j]).map(String)}catch(e){throw httpError(409,`Windows cannot enumerate ${p}: ${String(e.stderr||e.message||e).trim()}`)}}
function windowsCreateDirectory(parent,name){const ps=windowsPowerShell(),p=windowsPathForPosix(parent);if(!ps||!p)throw httpError(409,'Windows filesystem access is unavailable');const payload=JSON.stringify({path:p,name:String(name)});try{execFileSync(ps,['-NoProfile','-NonInteractive','-Command',"$ErrorActionPreference='Stop';$j=[Console]::In.ReadToEnd()|ConvertFrom-Json;$p=[string]$j.path;$n=[string]$j.name;if(!(Test-Path -LiteralPath $p -PathType Container)){throw 'missing'};$d=Join-Path $p $n;New-Item -ItemType Directory -Path $d -ErrorAction Stop|Out-Null"],{encoding:'utf8',timeout:20000,maxBuffer:1024*1024,input:payload})}catch(e){throw httpError(409,`Windows could not create folder: ${String(e.stderr||e.message||e).trim()}`)}}
function browsePathKey(projectToken,kind){return `project.${projectToken}.${kind}_browse_root`}
function catalogRemember(result){folderCatalog.set(path.resolve(result.path),{...result,cached_at:now()});return result}
function catalogKnownPath(value){const r=path.resolve(String(value||''));if(folderCatalog.has(r))return true;for(const row of folderCatalog.values())if((row.folders||[]).some(f=>path.resolve(f.path)===r))return true;return false}
function validateCatalogAssignment(value,label){const r=path.resolve(String(value||''));if(!catalogKnownPath(r))throw httpError(409,`${label} must be selected from the current storage catalog`);return r}
function validateBrowseLocation(candidate,label='Folder'){const raw=String(candidate||'').trim();if(!raw)return '';const r=path.resolve(raw),letter=driveLetterForPath(r);if(letter){if(!windowsDriveLetters().includes(letter))throw httpError(409,`${letter.toUpperCase()}: is not currently available in Windows`);if(!windowsDirectoryExists(r))throw httpError(400,`${label} does not exist in Windows`);return r}const home=os.homedir();if(!(r===home||r.startsWith(home+path.sep)))throw httpError(400,`${label} must be on discovered storage`);let st;try{st=fs.statSync(r)}catch{throw httpError(400,`${label} does not exist`)}if(!st.isDirectory())throw httpError(400,`${label} must be a folder`);return r}
'''
src=src[:helpers_at]+helpers+src[helpers_at:]

src=replace_function(src,'windowsDriveLetters',"function windowsDriveLetters(){return windowsVolumeSnapshot().map(x=>x.name)}")
src=replace_function(src,'volumeRecord',r'''function volumeRecord(letter){const l=String(letter||'').toLowerCase(),root=`/mnt/${l}`,n=windowsVolumeSnapshot().find(x=>x.name===l)||null;return{name:`${l.toUpperCase()}:`,path:root,kind:'drive',mounted:Boolean(n),free_bytes:n?n.free_bytes:null,total_bytes:n?n.total_bytes:null,mount:null,authority:'windows-native'}}''')
src=replace_function(src,'volumeRoots',r'''function volumeRoots(force=false){const locations=windowsVolumeSnapshot(force).map(x=>volumeRecord(x.name));try{const home=os.homedir(),s=fs.statfsSync(home);locations.push({name:'WSL Home',path:home,kind:'wsl',mounted:true,free_bytes:Number(s.bavail)*Number(s.bsize),total_bytes:Number(s.blocks)*Number(s.bsize),authority:'wsl'})}catch{}return locations}''')
src=replace_function(src,'volumeFor',r'''function volumeFor(candidate,mountIfNeeded=false){const r=path.resolve(String(candidate||'')),l=driveLetterForPath(r);if(l){if(!windowsDriveLetters().includes(l))return null;return volumeRecord(l)}const home=os.homedir();if(r===home||r.startsWith(home+path.sep)){try{const s=fs.statfsSync(home);return{name:'WSL Home',path:home,kind:'wsl',mounted:true,free_bytes:Number(s.bavail)*Number(s.bsize),total_bytes:Number(s.blocks)*Number(s.bsize),authority:'wsl'}}catch{return null}}return null}''')
src=replace_function(src,'validateDestination',r'''function validateDestination(candidate,label){const r=validateBrowseLocation(candidate,label);if(!r)return '';const l=driveLetterForPath(r);if(l){if(!windowsDirectoryReadable(r))throw httpError(400,`${label} folder is not readable in Windows`);return r}try{fs.accessSync(r,fs.constants.R_OK|fs.constants.W_OK)}catch{throw httpError(400,`${label} folder is not readable/writable`)}return r}''')
src=replace_function(src,'sourcePreflight',r'''function sourcePreflight(source){const p=String(source.normalized_path||source.path||'');if(recycleBinPath(p))return{source_id:source.source_id,path:p,status:'ignored_recycle_bin',blocking:false};const l=driveLetterForPath(p);if(l){if(!windowsDriveLetters().includes(l))return{source_id:source.source_id,path:p,status:'not_available',blocking:true,message:`${l.toUpperCase()}: is unavailable`,authority:'windows-native'};if(!windowsDirectoryExists(p))return{source_id:source.source_id,path:p,status:'missing',blocking:true,message:'Source path does not exist in Windows.',authority:'windows-native'};if(!windowsDirectoryReadable(p))return{source_id:source.source_id,path:p,status:'unreadable',blocking:true,message:'Source path is not readable in Windows.',authority:'windows-native'};return{source_id:source.source_id,path:p,status:'ready',blocking:false,authority:'windows-native'}}let st;try{st=fs.statSync(p)}catch{return{source_id:source.source_id,path:p,status:'missing',blocking:true}}if(!st.isDirectory())return{source_id:source.source_id,path:p,status:'unreadable',blocking:true};return{source_id:source.source_id,path:p,status:'ready',blocking:false,authority:'wsl'}}''')

src=replace_function(src,'listStorageFolder',r'''function listStorageFolder(inputPath,force=false){const requested=path.resolve(String(inputPath||'').trim());if(!force&&folderCatalog.has(requested))return folderCatalog.get(requested);const letter=driveLetterForPath(requested);let folders;if(letter){if(!windowsDriveLetters().includes(letter))throw httpError(409,`${letter.toUpperCase()}: is not currently available in Windows`);folders=windowsListDirectories(requested).map(name=>({name,path:path.join(requested,name)}))}else{const volume=volumeFor(requested);if(!volume)throw httpError(400,'Folder must be on discovered storage');let stat;try{stat=fs.statSync(requested)}catch{throw httpError(404,'Folder does not exist')}if(!stat.isDirectory())throw httpError(400,'Path is not a folder');folders=fs.readdirSync(requested,{withFileTypes:true}).filter(e=>e.isDirectory()&&!recycleBinPath(e.name)).map(e=>({name:e.name,path:path.join(requested,e.name)}))}folders.sort((a,b)=>a.name.localeCompare(b.name,undefined,{sensitivity:'base'}));const volume=volumeFor(requested);if(!volume)throw httpError(409,'Volume is no longer available');return catalogRemember({build:BUILD,path:requested,parent:requested===volume.path?null:path.dirname(requested),volume,folders})}''')

src=replace_function(src,'createStorageFolder',r'''async function createStorageFolder(input){const parent=validateBrowseLocation(input.parent,'Parent folder'),name=String(input.name||'').trim();if(!name||name==='.'||name==='..'||/[\\/\0]/.test(name))throw httpError(400,'Invalid folder name');const folder=path.join(parent,name),letter=driveLetterForPath(parent);if(letter)windowsCreateDirectory(parent,name);else await fsp.mkdir(folder,{recursive:false});const cached=folderCatalog.get(parent);if(cached&&!cached.folders.some(f=>f.path===folder)){cached.folders.push({name,path:folder});cached.folders.sort((a,b)=>a.name.localeCompare(b.name));folderCatalog.set(parent,cached)}catalogRemember({build:BUILD,path:folder,parent,volume:volumeFor(folder),folders:[]});return{build:BUILD,path:folder,parent,name,volume:volumeFor(folder)}}''')

src=replace_function(src,'replaceSources',r'''function replaceSources(projectToken,inputSources){if(!projectRow(projectToken))throw httpError(404,'project not found');if(!Array.isArray(inputSources)||!inputSources.length)throw httpError(400,'at least one source is required');const at=now(),desired=[],seen=new Set();for(const input of inputSources){const raw=typeof input==='string'?input:input.path??input.normalized_path,sourcePath=validateCatalogAssignment(raw,'Source');if(recycleBinPath(sourcePath))throw httpError(400,'$RECYCLE.BIN cannot be added as a source');if(seen.has(sourcePath))continue;seen.add(sourcePath);desired.push({source_id:sha(`${projectToken}\0${sourcePath}`).slice(0,32),path:sourcePath,label:String((typeof input==='object'&&(input.operator_label??input.name))||path.basename(sourcePath)||sourcePath),note:String((typeof input==='object'&&(input.operator_note??input.note))||'')})}const keep=desired.map(x=>sqlQuote(x.path)).join(','),statements=[`UPDATE sources SET removed_at=${sqlQuote(at)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND removed_at IS NULL AND normalized_path NOT IN (${keep});`];for(const s of desired)statements.push(`INSERT INTO sources(source_id,project_token,normalized_path,operator_label,operator_note,preflight_status,preflight_message,created_at,updated_at,removed_at) VALUES(${sqlQuote(s.source_id)},${sqlQuote(projectToken)},${sqlQuote(s.path)},${sqlQuote(s.label)},${sqlQuote(s.note)},'ready','',${sqlQuote(at)},${sqlQuote(at)},NULL) ON CONFLICT(project_token,normalized_path) DO UPDATE SET operator_label=excluded.operator_label,operator_note=excluded.operator_note,preflight_status='ready',preflight_message='',updated_at=excluded.updated_at,removed_at=NULL;`);statements.push(`UPDATE projects SET workflow_step=2,scope_revision=scope_revision+1,status='ScopeChanged',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,`UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved','complete');`,`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'sources.replaced',${sqlQuote(at)},${sqlQuote(JSON.stringify({count:desired.length}))});`);transaction(statements);return activeSources(projectToken)}''')

src=replace_function(src,'createProject',r'''function createProject(input){const name=String(input.project_name||'').trim();if(!name)throw httpError(400,'project_name is required');if(!Array.isArray(input.sources)||!input.sources.length)throw httpError(400,'at least one Source is required');const defaults=settings();const target=validateCatalogAssignment(input.target_root||defaults.target_root,'Target');const backupRaw=input.backup_root===undefined?defaults.backup_root:input.backup_root;const backup=backupRaw?validateCatalogAssignment(backupRaw,'Backup'):'';const sources=input.sources.map(x=>validateCatalogAssignment(typeof x==='string'?x:x.path??x.normalized_path,'Source'));if(!target)throw httpError(400,'Target is required');if(backup&&(backup===target||backup.startsWith(target+path.sep)||target.startsWith(backup+path.sep)))throw httpError(400,'Target and Backup must be separate, non-nested folders');const token=randomId(12),at=now(),statements=[`INSERT INTO projects(project_token,project_name,project_note,workflow_step,scope_revision,evidence_revision,status,created_at,updated_at) VALUES(${sqlQuote(token)},${sqlQuote(name)},${sqlQuote(input.project_note??'')},2,1,0,'ReadyToIndex',${sqlQuote(at)},${sqlQuote(at)});`,`INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(token,'target'))},${sqlQuote(target)},${sqlQuote(at)});`,`INSERT INTO settings(key,value,updated_at) VALUES(${sqlQuote(storageKey(token,'backup'))},${sqlQuote(backup)},${sqlQuote(at)});`];for(const p of [...new Set(sources)]){const id=sha(`${token}\0${p}`).slice(0,32);statements.push(`INSERT INTO sources(source_id,project_token,normalized_path,operator_label,operator_note,preflight_status,preflight_message,created_at,updated_at,removed_at) VALUES(${sqlQuote(id)},${sqlQuote(token)},${sqlQuote(p)},${sqlQuote(path.basename(p)||p)},'','ready','',${sqlQuote(at)},${sqlQuote(at)},NULL);`)}statements.push(`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(token)},'project.created',${sqlQuote(at)},${sqlQuote(JSON.stringify({sources:sources.length,target_root:target,backup_root:backup}))});`);transaction(statements);return projectDetail(token)}''')

# Plan generation reasons only over stored evidence; do not block on source preflight or revalidate storage live.
src=src.replace("  if (findings.blocking_sources) throw httpError(409, 'source preflight is not ready');\n",'',1)
src=src.replace('const storage = storageFor(projectToken, true);','const storage = storageFor(projectToken, false);',1)

# Add duplicate cardinality/drilldown helper and routes.
route_marker="if (pathname === '/api/sot/health'"
idx=src.index(route_marker)
dup=r'''function duplicateFindings(projectToken,bucket=''){if(!projectRow(projectToken))throw httpError(404,'project not found');const base=`FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id WHERE s.project_token=${sqlQuote(projectToken)} AND s.removed_at IS NULL`;const groups=rows(`SELECT o.content_sha256,COUNT(*) copies,MAX(o.size) size ${base} GROUP BY o.content_sha256 HAVING COUNT(*)>1 ORDER BY copies DESC,o.content_sha256;`);const enriched=groups.map(g=>({...g,copies:Number(g.copies),size:Number(g.size),bucket:Number(g.copies)===2?'2':Number(g.copies)===3?'3':'4plus'}));const counts={two:enriched.filter(g=>g.bucket==='2').length,three:enriched.filter(g=>g.bucket==='3').length,four_plus:enriched.filter(g=>g.bucket==='4plus').length};if(!bucket)return{build:BUILD,project_token:projectToken,counts};const wanted=bucket==='2'?'2':bucket==='3'?'3':'4plus';const selected=enriched.filter(g=>g.bucket===wanted).map(g=>({...g,files:rows(`SELECT o.normalized_path,o.relative_path,o.filename,o.size,o.source_id ${base} AND o.content_sha256=${sqlQuote(g.content_sha256)} ORDER BY o.normalized_path,o.relative_path;`)}));return{build:BUILD,project_token:projectToken,bucket:wanted,groups:selected}}

'''
src=src[:idx]+dup+"if (pathname === '/api/sot/turn01/volumes' && req.method === 'GET') { json(res,200,{build:BUILD,volumes:volumeRoots(url.searchParams.get('refresh')==='1')}); return true; }\n    if (pathname === '/api/sot/turn01/fs' && req.method === 'GET') { json(res,200,listStorageFolder(url.searchParams.get('path')||os.homedir(),url.searchParams.get('refresh')==='1')); return true; }\n    let dupMatch=pathname.match(/^\\/api\\/sot\\/turn01\\/projects\\/([^/]+)\\/duplicates$/); if(dupMatch&&req.method==='GET'){json(res,200,duplicateFindings(decodeURIComponent(dupMatch[1]),url.searchParams.get('bucket')||''));return true;}\n    "+src[idx:]

src=src.replace("const BUILD = '2026.08.28.sot-turn01-base-3';","const BUILD = '2026.08.30.sot-turn01-base-22';",1)
for marker in ["const BUILD = '2026.08.30.sot-turn01-base-22';",'let folderCatalog=new Map()','function duplicateFindings(projectToken','validateCatalogAssignment','storageFor(projectToken, false)']:
    if marker not in src: raise SystemExit('Base22 marker missing: '+marker)
Path(sys.argv[2]).write_text(src)
print('Base-22 backend generated directly from clean Base-3')