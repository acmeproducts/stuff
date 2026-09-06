#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
if 'function storageIntelligence(' in s: raise SystemExit('R10 intelligence already integrated')
anchor='function evidenceStatus() {'
assert s.count(anchor)==1
fn=r'''function storageIntelligence(projectToken = '', requestedLimit = 100) {
  const limit=Math.max(10,Math.min(500,Number(requestedLimit)||100));
  const project=String(projectToken||'').trim();
  const projectFilter=project?`AND s.project_token=${sqlQuote(project)}`:'';
  const base=`FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id JOIN projects p ON p.project_token=s.project_token WHERE s.removed_at IS NULL AND p.deleted_at IS NULL ${projectFilter}`;
  const summary=(rows(`WITH g AS (SELECT o.content_sha256,MAX(o.size) size,COUNT(DISTINCT o.normalized_path) copies,COUNT(DISTINCT s.project_token) projects ${base} GROUP BY o.content_sha256)
    SELECT COUNT(*) fingerprints,COALESCE(SUM(size),0) logical_bytes,
      COALESCE(SUM(CASE WHEN copies>1 THEN 1 ELSE 0 END),0) duplicate_groups,
      COALESCE(SUM(CASE WHEN copies>1 THEN size*(copies-1) ELSE 0 END),0) duplicate_waste_bytes,
      COALESCE(SUM(CASE WHEN projects>1 THEN 1 ELSE 0 END),0) shared_groups,
      COALESCE(SUM(CASE WHEN projects>1 THEN size ELSE 0 END),0) shared_bytes
    FROM g;`)[0]) || {};
  const duplicateGroups=rows(`WITH g AS (SELECT o.content_sha256,MAX(o.size) size,MAX(o.filename) filename,COUNT(DISTINCT o.normalized_path) copies,COUNT(DISTINCT s.project_token) projects,group_concat(DISTINCT o.normalized_path) locations,group_concat(DISTINCT p.project_name) project_names ${base} GROUP BY o.content_sha256 HAVING COUNT(DISTINCT o.normalized_path)>1)
    SELECT content_sha256,size,filename,copies,projects,size*(copies-1) reclaimable_bytes,locations,project_names FROM g ORDER BY reclaimable_bytes DESC,copies DESC LIMIT ${limit};`);
  const risky=rows(`WITH g AS (SELECT o.content_sha256,MAX(o.size) size,MAX(o.filename) filename,COUNT(DISTINCT o.normalized_path) source_copies,group_concat(DISTINCT o.normalized_path) locations ${base} GROUP BY o.content_sha256)
    SELECT g.content_sha256,g.size,g.filename,g.source_copies,g.locations,COALESCE(th.verification_status,'missing') copy_a,COALESCE(bh.verification_status,'missing') copy_b
    FROM g LEFT JOIN target_holdings th ON th.content_sha256=g.content_sha256 LEFT JOIN backup_holdings bh ON bh.content_sha256=g.content_sha256
    WHERE COALESCE(th.verification_status,'missing')!='verified' OR COALESCE(bh.verification_status,'missing')!='verified' ORDER BY g.size DESC LIMIT ${limit};`);
  const sourceRows=rows(`SELECT s.project_token,p.project_name,s.normalized_path,s.preflight_status,s.last_preflight_at FROM sources s JOIN projects p ON p.project_token=s.project_token WHERE s.removed_at IS NULL AND p.deleted_at IS NULL ${project?`AND s.project_token=${sqlQuote(project)}`:''} ORDER BY p.project_name,s.normalized_path LIMIT ${limit};`);
  const rec=[];
  const waste=Number(summary.duplicate_waste_bytes||0), dup=Number(summary.duplicate_groups||0), risk=risky.length;
  if(risk) rec.push({priority:1,kind:'protect',title:`Protect ${risk} high-value unprotected items shown`,detail:'Verified Copy A and Copy B are missing for these fingerprints. Protect or verify existing copies before deleting anything.'});
  if(dup) rec.push({priority:2,kind:'duplicates',title:`Review ${dup} duplicate groups`,detail:`Source duplicates account for up to ${waste} bytes of redundant storage. Shared-project content and verified protection copies are not classified as disposable duplicates.`});
  if(!risk && !dup) rec.push({priority:3,kind:'healthy',title:'No immediate duplicate or protection exception in this view',detail:'Continue indexing remaining unknown sources and verify copy coverage.'});
  return {model:'storage-intelligence-v1',project_token:project||null,summary,duplicate_groups:duplicateGroups,risky_content:risky,sources:sourceRows,recommendations:rec};
}

'''
s=s.replace(anchor,fn+anchor,1)
route="if (pathname === '/api/sot/turn01/catalog' && req.method === 'GET')"
assert s.count(route)==1
s=s.replace(route,"if (pathname === '/api/sot/turn01/intelligence' && req.method === 'GET') { json(res, 200, storageIntelligence(url.searchParams.get('project_token') || '', url.searchParams.get('limit') || 100)); return true; }\n    "+route,1)
old='activityLog, ssotReconciliation, ssotCatalog, runtime, sqlite }'
assert s.count(old)==1
s=s.replace(old,'activityLog, ssotReconciliation, ssotCatalog, storageIntelligence, runtime, sqlite }',1)
p.write_text(s)
print('R10 storage intelligence integrated')
