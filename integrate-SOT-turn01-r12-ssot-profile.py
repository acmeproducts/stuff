#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
if 'function ssotProfile(' in s: raise SystemExit('R12 profile already integrated')
for old,new in [("const EXPECTED_MIGRATION = 5;","const EXPECTED_MIGRATION = 6;"),("const BUILD = '2026.09.03.sot-turn01-coordination-2';","const BUILD = '2026.09.07.sot-turn01-r12-ssot-profile-1';")]:
    if old not in s: raise SystemExit('R12 backend contract missing '+old)
    s=s.replace(old,new,1)
anchor='function evidenceStatus() {'
if s.count(anchor)!=1: raise SystemExit('R12 backend evidence anchor mismatch')
fn=r'''function normalizeTag(value) {
  return String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
}
function profileRevision() {
  const r=rows('SELECT revision,committed_at,reason FROM profile_revisions ORDER BY revision DESC LIMIT 1;')[0];
  return r || {revision:0,committed_at:null,reason:'none'};
}
function tagPool(q='') {
  const n=normalizeTag(q), where=n?`WHERE normalized_name LIKE ${sqlQuote('%'+n+'%')}`:'';
  return rows(`SELECT tag_id,normalized_name,display_name,created_at,updated_at FROM tags ${where} ORDER BY normalized_name LIMIT 250;`);
}
function tagAssignments() {
  return rows(`SELECT a.assignment_id,a.target_type,a.target_key,t.tag_id,t.normalized_name,t.display_name FROM tag_assignments a JOIN tags t ON t.tag_id=a.tag_id ORDER BY a.target_type,a.target_key,t.normalized_name;`);
}
function ssotProfile(query='', requestedLimit=1000) {
  const limit=Math.max(1,Math.min(5000,Number(requestedLimit)||1000)), needle=String(query||'').trim().toLowerCase();
  const obs=rows(`SELECT o.normalized_path,o.relative_path,o.filename,o.size,o.modified_ms,o.content_sha256,o.first_observed_at,o.last_observed_at,s.normalized_path source_path FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id JOIN projects p ON p.project_token=s.project_token WHERE s.removed_at IS NULL AND p.deleted_at IS NULL ORDER BY lower(o.normalized_path) LIMIT ${limit};`);
  const assignments=tagAssignments(), direct=new Map();
  for(const a of assignments){const k=a.target_type+'|'+a.target_key;if(!direct.has(k))direct.set(k,[]);direct.get(k).push({tag_id:a.tag_id,name:a.normalized_name,display_name:a.display_name,direct:true,from:a.target_key});}
  const folders=new Map();
  function ensureFolder(fp,source){if(!fp)return; if(!folders.has(fp))folders.set(fp,{type:'folder',key:fp,path:fp,name:fp.split(/[\\/]/).filter(Boolean).pop()||fp,source_path:source||'',size:0,file_count:0,direct_tags:direct.get('folder|'+fp)||[],effective_tags:[]});}
  for(const o of obs){let full=String(o.normalized_path||''), parent=full.replace(/[\\/][^\\/]*$/,'');ensureFolder(parent,o.source_path);let cur=parent;while(cur){let up=cur.replace(/[\\/][^\\/]*$/,'');if(!up||up===cur)break;ensureFolder(up,o.source_path);cur=up;}}
  function inheritedFor(path){let out=new Map(),cur=path;while(cur){for(const t of (direct.get('folder|'+cur)||[]))if(!out.has(t.tag_id))out.set(t.tag_id,{...t,direct:false,from:cur});let up=cur.replace(/[\\/][^\\/]*$/,'');if(!up||up===cur)break;cur=up;}return out;}
  for(const f of folders.values()){let eff=inheritedFor(f.path);for(const t of f.direct_tags)eff.set(t.tag_id,t);f.effective_tags=[...eff.values()];}
  const files=obs.map(o=>{let path=String(o.normalized_path||''),parent=path.replace(/[\\/][^\\/]*$/,''),dt=direct.get('file|'+path)||[],eff=inheritedFor(parent);for(const t of dt)eff.set(t.tag_id,t);let f=folders.get(parent);if(f){f.size+=Number(o.size||0);f.file_count++;}return{type:'file',key:path,path,name:o.filename,size:Number(o.size||0),created_at:o.first_observed_at,modified_at:o.modified_ms?new Date(Number(o.modified_ms)).toISOString():o.last_observed_at,fingerprint:o.content_sha256,source_path:o.source_path,direct_tags:dt,effective_tags:[...eff.values()]};});
  let items=[...folders.values(),...files];
  if(needle)items=items.filter(x=>{let hay=[x.path,x.name,x.fingerprint,...x.effective_tags.map(t=>t.name)].join(' ').toLowerCase();return hay.includes(needle)});
  return {model:'ssot-profile-v1',profile:profileRevision(),summary:{folders:folders.size,files:files.length,bytes:files.reduce((n,x)=>n+x.size,0)},tags:tagPool(),items};
}
function mutateTags(input) {
  const revision=Number(input.profile_revision), current=profileRevision();
  if(revision!==Number(current.revision)) throw httpError(409,`stale profile revision ${revision}; current is ${current.revision}`);
  const op=String(input.operation||''), targets=Array.isArray(input.targets)?input.targets:[], raw=String(input.tag||''), norm=normalizeTag(raw);
  if(!['add','remove'].includes(op))throw httpError(400,'operation must be add or remove');
  if(!targets.length||targets.length>5000)throw httpError(400,'targets must contain 1..5000 stable items');
  if(!norm)throw httpError(400,'tag required');
  const at=now(),tagId=sha('tag:'+norm),statements=[];
  if(op==='add')statements.push(`INSERT INTO tags(tag_id,normalized_name,display_name,created_at,updated_at) VALUES(${sqlQuote(tagId)},${sqlQuote(norm)},${sqlQuote(raw.trim()||norm)},${sqlQuote(at)},${sqlQuote(at)}) ON CONFLICT(normalized_name) DO UPDATE SET updated_at=excluded.updated_at;`);
  const tagRow=rows(`SELECT tag_id FROM tags WHERE normalized_name=${sqlQuote(norm)} LIMIT 1;`)[0];
  const effectiveTagId=tagRow?.tag_id||tagId;
  for(const t of targets){const type=String(t.type||''),key=String(t.key||'');if(!['folder','file'].includes(type)||!key)throw httpError(400,'invalid stable target');if(op==='add')statements.push(`INSERT OR IGNORE INTO tag_assignments(assignment_id,tag_id,target_type,target_key,created_at) VALUES(${sqlQuote(sha('assign:'+effectiveTagId+':'+type+':'+key))},${sqlQuote(effectiveTagId)},${sqlQuote(type)},${sqlQuote(key)},${sqlQuote(at)});`);else statements.push(`DELETE FROM tag_assignments WHERE tag_id IN (SELECT tag_id FROM tags WHERE normalized_name=${sqlQuote(norm)}) AND target_type=${sqlQuote(type)} AND target_key=${sqlQuote(key)};`);}
  statements.push(`INSERT INTO profile_revisions(committed_at,reason,evidence_json) VALUES(${sqlQuote(at)},${sqlQuote('tag-'+op)},${sqlQuote(JSON.stringify({prior_revision:revision,tag:norm,count:targets.length}))});`);
  execute('BEGIN IMMEDIATE;\n'+statements.join('\n')+'\nCOMMIT;');
  return {ok:true,operation:op,tag:norm,count:targets.length,profile:profileRevision()};
}

'''
s=s.replace(anchor,fn+anchor,1)
route="if (pathname === '/api/sot/turn01/intelligence' && req.method === 'GET')"
if s.count(route)!=1: raise SystemExit('R12 route anchor mismatch')
insert="""if (pathname === '/api/sot/turn01/profile' && req.method === 'GET') { json(res, 200, ssotProfile(url.searchParams.get('q') || '', url.searchParams.get('limit') || 1000)); return true; }\n    if (pathname === '/api/sot/turn01/tags' && req.method === 'GET') { json(res, 200, {profile:profileRevision(),tags:tagPool(url.searchParams.get('q') || '')}); return true; }\n    if (pathname === '/api/sot/turn01/tags/bulk' && req.method === 'POST') { json(res, 200, mutateTags(await requestBody(req))); return true; }\n    """
s=s.replace(route,insert+route,1)
old='activityLog, ssotReconciliation, ssotCatalog, storageIntelligence, runtime, sqlite }'
if s.count(old)!=1: raise SystemExit('R12 export anchor mismatch')
s=s.replace(old,'activityLog, ssotReconciliation, ssotCatalog, storageIntelligence, ssotProfile, tagPool, mutateTags, normalizeTag, profileRevision, runtime, sqlite }',1)
for marker in ["const EXPECTED_MIGRATION = 6;","2026.09.07.sot-turn01-r12-ssot-profile-1","function ssotProfile(","function mutateTags(","stale profile revision","/api/sot/turn01/tags/bulk"]:
    if marker not in s: raise SystemExit('R12 output contract missing '+marker)
p.write_text(s)
print('R12 SSOT profile/tag API integrated')
