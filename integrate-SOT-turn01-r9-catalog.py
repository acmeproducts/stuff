#!/usr/bin/env python3
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
if 'function ssotCatalog(' in s: raise SystemExit('R9 catalog already integrated')
anchor='function evidenceStatus() {'
assert s.count(anchor)==1
fn=r'''function ssotCatalog(view = 'content', query = '', requestedLimit = 250, projectToken = '') {
  const limit=Math.max(1,Math.min(1000,Number(requestedLimit)||250));
  const needle=String(query||'').trim().toLowerCase();
  const project=String(projectToken||'').trim();
  const q=needle ? `%${needle}%` : '';
  if (view === 'content') {
    const where=[];
    if (project) where.push(`s.project_token=${sqlQuote(project)}`);
    if (needle) where.push(`(lower(o.content_sha256) LIKE ${sqlQuote(q)} OR lower(o.filename) LIKE ${sqlQuote(q)} OR lower(o.normalized_path) LIKE ${sqlQuote(q)} OR lower(p.project_name) LIKE ${sqlQuote(q)})`);
    const w=where.length?'WHERE '+where.join(' AND '):'';
    return {view,rows:rows(`WITH m AS (
      SELECT o.content_sha256,MAX(o.size) size,MAX(o.filename) filename,COUNT(DISTINCT s.project_token) project_count,COUNT(DISTINCT o.normalized_path) observed_locations,
      group_concat(DISTINCT p.project_name) projects
      FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id
      JOIN sources s ON s.source_id=co.source_id JOIN projects p ON p.project_token=s.project_token ${w}
      GROUP BY o.content_sha256)
      SELECT m.content_sha256,m.size,m.filename,m.project_count,m.observed_locations,m.projects,
      COALESCE(th.verification_status,'missing') copy_a,COALESCE(bh.verification_status,'missing') copy_b
      FROM m LEFT JOIN target_holdings th ON th.content_sha256=m.content_sha256 LEFT JOIN backup_holdings bh ON bh.content_sha256=m.content_sha256
      ORDER BY m.size DESC,m.content_sha256 LIMIT ${limit};`)};
  }
  if (view === 'locations') {
    const where=needle?`WHERE lower(location) LIKE ${sqlQuote(q)} OR lower(content_sha256) LIKE ${sqlQuote(q)} OR lower(kind) LIKE ${sqlQuote(q)}`:'';
    return {view,rows:rows(`WITH loc AS (
      SELECT o.content_sha256,o.normalized_path location,'source' kind,'observed' verification_status,o.size FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id
      UNION ALL SELECT th.content_sha256,th.target_path,'copy_a',th.verification_status,c.size FROM target_holdings th LEFT JOIN content c ON c.content_sha256=th.content_sha256
      UNION ALL SELECT bh.content_sha256,bh.backup_path,'copy_b',bh.verification_status,c.size FROM backup_holdings bh LEFT JOIN content c ON c.content_sha256=bh.content_sha256)
      SELECT kind,location,content_sha256,size,verification_status FROM loc ${where} ORDER BY kind,location LIMIT ${limit};`)};
  }
  if (view === 'projects') {
    const where=needle?`AND lower(p.project_name) LIKE ${sqlQuote(q)}`:'';
    return {view,rows:rows(`WITH pm AS (SELECT s.project_token,o.content_sha256,MAX(o.size) size FROM current_observations co JOIN observations o ON o.observation_id=co.observation_id JOIN sources s ON s.source_id=co.source_id WHERE s.removed_at IS NULL GROUP BY s.project_token,o.content_sha256), mc AS (SELECT content_sha256,COUNT(DISTINCT project_token) n FROM pm GROUP BY content_sha256)
      SELECT p.project_name,p.project_token,COUNT(pm.content_sha256) fingerprints,COALESCE(SUM(pm.size),0) logical_bytes,COALESCE(SUM(CASE WHEN mc.n>1 THEN pm.size ELSE 0 END),0) shared_bytes,p.evidence_revision,p.lifecycle_state
      FROM projects p LEFT JOIN pm ON pm.project_token=p.project_token LEFT JOIN mc ON mc.content_sha256=pm.content_sha256 WHERE p.deleted_at IS NULL ${where} GROUP BY p.project_token ORDER BY lower(p.project_name) LIMIT ${limit};`)};
  }
  if (view === 'operations') {
    const where=[]; if(project)where.push(`po.project_token=${sqlQuote(project)}`); if(needle)where.push(`(lower(po.project_token) LIKE ${sqlQuote(q)} OR lower(po.kind) LIKE ${sqlQuote(q)} OR lower(po.state) LIKE ${sqlQuote(q)})`); const w=where.length?'WHERE '+where.join(' AND '):'';
    return {view,rows:rows(`SELECT po.operation_id,po.project_token,p.project_name,po.kind,po.state,po.generation,po.started_at,po.updated_at FROM project_operations po LEFT JOIN projects p ON p.project_token=po.project_token ${w} ORDER BY po.created_at DESC LIMIT ${limit};`)};
  }
  throw httpError(400,'catalog view must be content, locations, projects, or operations');
}

'''
s=s.replace(anchor,fn+anchor,1)
route="if (pathname === '/api/sot/turn01/r1/evidence-status' && req.method === 'GET')"
assert s.count(route)==1
s=s.replace(route,"if (pathname === '/api/sot/turn01/catalog' && req.method === 'GET') { json(res, 200, ssotCatalog(url.searchParams.get('view') || 'content', url.searchParams.get('q') || '', url.searchParams.get('limit') || 250, url.searchParams.get('project_token') || '')); return true; }\n    "+route,1)
old='activityLog, ssotReconciliation, runtime, sqlite }'
assert s.count(old)==1
s=s.replace(old,'activityLog, ssotReconciliation, ssotCatalog, runtime, sqlite }',1)
p.write_text(s)
print('R9 SSOT catalog integrated')
