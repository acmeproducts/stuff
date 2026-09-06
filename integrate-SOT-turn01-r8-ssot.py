#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
if "function ssotReconciliation()" in s: raise SystemExit('R8 already integrated')
anchor="function evidenceStatus() {"
assert s.count(anchor)==1
fn=r'''function ssotReconciliation() {
  const global = rows(`WITH membership AS (
      SELECT o.content_sha256,MAX(o.size) size,COUNT(DISTINCT s.project_token) project_count
      FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id
      JOIN sources s ON s.source_id=co.source_id JOIN projects p ON p.project_token=s.project_token
      WHERE s.removed_at IS NULL AND p.deleted_at IS NULL GROUP BY o.content_sha256
    ) SELECT COUNT(*) unique_content,COALESCE(SUM(size),0) unique_bytes,
      COALESCE(SUM(CASE WHEN project_count>1 THEN 1 ELSE 0 END),0) shared_content,
      COALESCE(SUM(CASE WHEN project_count>1 THEN size ELSE 0 END),0) shared_bytes,
      COALESCE(SUM(CASE WHEN th.verification_status='verified' AND bh.verification_status='verified' THEN 1 ELSE 0 END),0) protected_content,
      COALESCE(SUM(CASE WHEN th.verification_status='verified' AND bh.verification_status='verified' THEN m.size ELSE 0 END),0) protected_bytes,
      COALESCE(SUM(CASE WHEN th.verification_status<>'verified' OR th.verification_status IS NULL THEN 1 ELSE 0 END),0) missing_copy_a_content,
      COALESCE(SUM(CASE WHEN th.verification_status<>'verified' OR th.verification_status IS NULL THEN m.size ELSE 0 END),0) missing_copy_a_bytes,
      COALESCE(SUM(CASE WHEN bh.verification_status<>'verified' OR bh.verification_status IS NULL THEN 1 ELSE 0 END),0) missing_copy_b_content,
      COALESCE(SUM(CASE WHEN bh.verification_status<>'verified' OR bh.verification_status IS NULL THEN m.size ELSE 0 END),0) missing_copy_b_bytes,
      COALESCE(SUM(CASE WHEN (th.verification_status<>'verified' OR th.verification_status IS NULL) AND (bh.verification_status<>'verified' OR bh.verification_status IS NULL) THEN 1 ELSE 0 END),0) missing_both_content,
      COALESCE(SUM(CASE WHEN (th.verification_status<>'verified' OR th.verification_status IS NULL) AND (bh.verification_status<>'verified' OR bh.verification_status IS NULL) THEN m.size ELSE 0 END),0) missing_both_bytes
    FROM membership m LEFT JOIN target_holdings th ON th.content_sha256=m.content_sha256 LEFT JOIN backup_holdings bh ON bh.content_sha256=m.content_sha256;`)[0] || {};
  const projectRows = rows(`WITH pm AS (
      SELECT s.project_token,o.content_sha256,MAX(o.size) size
      FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id
      JOIN sources s ON s.source_id=co.source_id JOIN projects p ON p.project_token=s.project_token
      WHERE s.removed_at IS NULL AND p.deleted_at IS NULL GROUP BY s.project_token,o.content_sha256
    ), memberships AS (SELECT content_sha256,COUNT(DISTINCT project_token) project_count FROM pm GROUP BY content_sha256)
    SELECT p.project_token,p.project_name,p.evidence_revision,p.lifecycle_state,p.status,
      COUNT(pm.content_sha256) unique_content,COALESCE(SUM(pm.size),0) logical_bytes,
      COALESCE(SUM(CASE WHEN ms.project_count=1 THEN pm.size ELSE 0 END),0) project_only_bytes,
      COALESCE(SUM(CASE WHEN ms.project_count>1 THEN pm.size ELSE 0 END),0) shared_bytes,
      COALESCE(SUM(CASE WHEN th.verification_status='verified' AND bh.verification_status='verified' THEN pm.size ELSE 0 END),0) protected_bytes,
      COALESCE(SUM(CASE WHEN th.verification_status<>'verified' OR th.verification_status IS NULL THEN pm.size ELSE 0 END),0) missing_copy_a_bytes,
      COALESCE(SUM(CASE WHEN bh.verification_status<>'verified' OR bh.verification_status IS NULL THEN pm.size ELSE 0 END),0) missing_copy_b_bytes,
      (SELECT COUNT(*) FROM sources sx WHERE sx.project_token=p.project_token AND sx.removed_at IS NULL) source_count
    FROM projects p LEFT JOIN pm ON pm.project_token=p.project_token LEFT JOIN memberships ms ON ms.content_sha256=pm.content_sha256
    LEFT JOIN target_holdings th ON th.content_sha256=pm.content_sha256 LEFT JOIN backup_holdings bh ON bh.content_sha256=pm.content_sha256
    WHERE p.deleted_at IS NULL GROUP BY p.project_token ORDER BY lower(p.project_name);`);
  const operations = rows(`SELECT po.project_token,po.kind,po.state,po.detail_json,po.started_at,po.updated_at FROM project_operations po
    JOIN (SELECT project_token,MAX(created_at) created_at FROM project_operations GROUP BY project_token) x ON x.project_token=po.project_token AND x.created_at=po.created_at;`);
  const opMap = Object.fromEntries(operations.map(x=>[x.project_token,x]));
  const projects = projectRows.map(x=>{
    const content=Number(x.unique_content||0), bytes=Number(x.logical_bytes||0), protectedBytes=Number(x.protected_bytes||0);
    let condition='needs_scan', headline='Needs scan', next_action='index';
    if (!Number(x.source_count||0)) { condition='needs_sources'; headline='Needs sources'; next_action='sources'; }
    else if (!content || !bytes || Number(x.evidence_revision||0)<=0) { condition='needs_scan'; headline='Nothing indexed yet'; next_action='index'; }
    else if (protectedBytes===bytes) { condition='protected'; headline='All known content has both verified copies'; next_action='none'; }
    else { condition='needs_copy'; headline='Some content still needs a safe copy'; next_action='protect'; }
    return {...x,unique_content:content,logical_bytes:bytes,project_only_bytes:Number(x.project_only_bytes||0),shared_bytes:Number(x.shared_bytes||0),protected_bytes:protectedBytes,missing_copy_a_bytes:Number(x.missing_copy_a_bytes||0),missing_copy_b_bytes:Number(x.missing_copy_b_bytes||0),condition,headline,next_action,operation:opMap[x.project_token]||null};
  });
  const unknownProjects=projects.filter(x=>x.condition==='needs_scan'||x.condition==='needs_sources').length;
  return { build:BUILD, model:'global-content-reconciliation-v1', global:Object.fromEntries(Object.entries(global).map(([k,v])=>[k,Number(v||0)])), unknown_projects:unknownProjects, projects };
}

'''
s=s.replace(anchor,fn+anchor,1)
route="if (pathname === '/api/sot/turn01/r1/evidence-status' && req.method === 'GET')"
assert s.count(route)==1
s=s.replace(route,"if (pathname === '/api/sot/turn01/ssot' && req.method === 'GET') { json(res, 200, ssotReconciliation()); return true; }\n    "+route,1)
old="activityLog, runtime, sqlite }"
assert s.count(old)==1
s=s.replace(old,"activityLog, ssotReconciliation, runtime, sqlite }",1)
p.write_text(s)
print('R8 SSOT reconciliation integrated')
