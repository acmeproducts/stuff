#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
if 'function discoverSources(' in s: raise SystemExit('R12 Discover already integrated')
anchor='function normalizeTag(value) {'
if s.count(anchor)!=1: raise SystemExit('R12 Discover function anchor mismatch')
fn=r'''const SSOT_DISCOVER_TOKEN='__ssot__';
function ensureDiscoverContainer() {
  const at=now();
  execute(`INSERT OR IGNORE INTO projects(project_token,project_name,status,created_at,updated_at) VALUES(${sqlQuote(SSOT_DISCOVER_TOKEN)},'SSOT Discover','Internal',${sqlQuote(at)},${sqlQuote(at)});`);
}
function discoverSources() {
  return {model:'ssot-discover-v1',sources:rows(`SELECT s.source_id,s.normalized_path,s.preflight_status,s.last_preflight_at,s.created_at,s.updated_at,p.project_token FROM sources s JOIN projects p ON p.project_token=s.project_token WHERE s.removed_at IS NULL AND p.deleted_at IS NULL ORDER BY lower(s.normalized_path);`)};
}
function addDiscoverSource(input) {
  const raw=String(input.path||'').trim(); if(!raw)throw httpError(400,'source path required');
  const normalized=path.resolve(raw), at=now();
  let st; try{st=fs.statSync(normalized)}catch{throw httpError(400,'source folder does not exist')};
  if(!st.isDirectory())throw httpError(400,'source must be a folder');
  const existing=rows(`SELECT source_id,project_token,normalized_path FROM sources WHERE removed_at IS NULL AND normalized_path=${sqlQuote(normalized)} LIMIT 1;`)[0];
  if(existing)return {ok:true,existing:true,source:existing};
  ensureDiscoverContainer(); const id=sha('source:'+SSOT_DISCOVER_TOKEN+':'+normalized);
  execute(`INSERT INTO sources(source_id,project_token,normalized_path,operator_label,created_at,updated_at) VALUES(${sqlQuote(id)},${sqlQuote(SSOT_DISCOVER_TOKEN)},${sqlQuote(normalized)},'Discover',${sqlQuote(at)},${sqlQuote(at)});`);
  return {ok:true,existing:false,source:{source_id:id,project_token:SSOT_DISCOVER_TOKEN,normalized_path:normalized}};
}
function removeDiscoverSource(input) {
  const id=String(input.source_id||''); if(!id)throw httpError(400,'source_id required'); const at=now();
  execute(`UPDATE sources SET removed_at=${sqlQuote(at)},updated_at=${sqlQuote(at)} WHERE source_id=${sqlQuote(id)} AND removed_at IS NULL;`);
  return {ok:true,source_id:id};
}

'''
s=s.replace(anchor,fn+anchor,1)
route="if (pathname === '/api/sot/turn01/profile' && req.method === 'GET')"
if s.count(route)!=1: raise SystemExit('R12 Discover route anchor mismatch')
insert="""if (pathname === '/api/sot/turn01/discover' && req.method === 'GET') { json(res, 200, discoverSources()); return true; }\n    if (pathname === '/api/sot/turn01/discover' && req.method === 'POST') { json(res, 201, addDiscoverSource(await requestBody(req))); return true; }\n    if (pathname === '/api/sot/turn01/discover/remove' && req.method === 'POST') { json(res, 200, removeDiscoverSource(await requestBody(req))); return true; }\n    """
s=s.replace(route,insert+route,1)
old='activityLog, ssotReconciliation, ssotCatalog, storageIntelligence, ssotProfile, tagPool, mutateTags, normalizeTag, profileRevision, runtime, sqlite }'
if s.count(old)!=1: raise SystemExit('R12 Discover export anchor mismatch')
s=s.replace(old,'activityLog, ssotReconciliation, ssotCatalog, storageIntelligence, ssotProfile, tagPool, mutateTags, normalizeTag, profileRevision, discoverSources, addDiscoverSource, removeDiscoverSource, runtime, sqlite }',1)
for x in ["SSOT_DISCOVER_TOKEN='__ssot__'","function discoverSources(","/api/sot/turn01/discover/remove"]:
    if x not in s: raise SystemExit('R12 Discover output contract missing '+x)
p.write_text(s)
print('R12 Discover source API integrated')
