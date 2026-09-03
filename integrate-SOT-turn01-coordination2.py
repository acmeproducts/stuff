#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-coordination2.py <coordination-api.js> <output-api.js>')
s=Path(sys.argv[1]).read_text()
def one(old,new,label):
 global s
 if s.count(old)!=1: raise SystemExit(f'{label}: expected 1 marker, got {s.count(old)}')
 s=s.replace(old,new,1)
one("const BUILD = '2026.09.03.sot-turn01-coordination-1';","const BUILD = '2026.09.03.sot-turn01-coordination-2';",'build')
anchor="function claimProjectOperation(projectToken,kind){"
helper=r'''function stableProjectView(projectToken){
  const p=projectRow(projectToken); if(!p)return {workflow_step:1,status:'Pending',lifecycle:'idle'};
  const plan=rows(`SELECT state,evidence_revision FROM plans WHERE project_token=${sqlQuote(projectToken)} AND evidence_revision=${Number(p.evidence_revision||0)} ORDER BY created_at DESC LIMIT 1;`)[0];
  if(plan&&plan.state==='complete')return {workflow_step:6,status:'Executed',lifecycle:'executed'};
  if(plan&&['draft','approved'].includes(plan.state))return {workflow_step:5,status:'Plan',lifecycle:'planned'};
  if(Number(p.evidence_revision||0)>0)return {workflow_step:4,status:'Review',lifecycle:'indexed'};
  return {workflow_step:Math.min(3,Math.max(1,Number(p.workflow_step||1))),status:Number(p.workflow_step||1)>=2?'Sources':'Pending',lifecycle:'idle'};
}
function restoreStableProject(projectToken,operationId,generation){const v=stableProjectView(projectToken),at=now();execute(`UPDATE projects SET workflow_step=${v.workflow_step},status=${sqlQuote(v.status)},lifecycle_state=${sqlQuote(v.lifecycle)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(operationId)} AND mutation_generation=${Number(generation)};`);return v;}
'''
if s.count(anchor)!=1: raise SystemExit('helper anchor changed')
s=s.replace(anchor,helper+anchor,1)
one("    UPDATE projects SET active_operation_id=NULL,lifecycle_state=CASE WHEN evidence_revision>0 THEN 'indexed' ELSE 'idle' END,updated_at=${sqlQuote(interruptedAt)} WHERE active_operation_id IS NOT NULL;","    UPDATE projects SET active_operation_id=NULL,lifecycle_state=CASE WHEN evidence_revision>0 THEN 'indexed' ELSE 'idle' END,workflow_step=CASE WHEN evidence_revision>0 THEN MAX(workflow_step,4) ELSE MIN(workflow_step,3) END,status=CASE WHEN evidence_revision>0 THEN CASE WHEN workflow_step>=5 THEN status ELSE 'Review' END ELSE 'Interrupted' END,updated_at=${sqlQuote(interruptedAt)} WHERE active_operation_id IS NOT NULL;",'restart stable view')
one("`UPDATE projects SET workflow_step=3,status='Processing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`","`UPDATE projects SET workflow_step=CASE WHEN evidence_revision>0 THEN workflow_step ELSE 3 END,status=CASE WHEN evidence_revision>0 THEN 'Reindexing' ELSE 'Processing' END,updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`",'index start committed view')
one("`UPDATE projects SET workflow_step=3,status='Processing',lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`","`UPDATE projects SET workflow_step=CASE WHEN evidence_revision>0 THEN workflow_step ELSE 3 END,status=CASE WHEN evidence_revision>0 THEN 'Reindexing' ELSE 'Processing' END,lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`",'resume committed view')
one("      finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:runId,reason:'stopped'});","      const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stable.lifecycle,{run_id:runId,reason:'stopped'});",'worker stop restore')
one("      pauseOperation(projectToken,op.operation_id,op.operation_generation);","      const stable=stableProjectView(projectToken); pauseOperation(projectToken,op.operation_id,op.operation_generation);\n      execute(`UPDATE projects SET workflow_step=${stable.workflow_step},status='Paused',updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`);",'pause preserve')
one("      finishOperation(projectToken,op.operation_id,op.operation_generation,'failed',stableLifecycle(projectToken),{run_id:runId,error:error.message});","      const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'failed',stable.lifecycle,{run_id:runId,error:error.message});",'worker error restore')
one("const op=runOperation(run.run_id); if(op.operation_id)finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:run.run_id,reason:'stopped'});","const op=runOperation(run.run_id); if(op.operation_id){const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stable.lifecycle,{run_id:run.run_id,reason:'stopped'});}",'paused stop restore')
old="`UPDATE projects SET workflow_step=4,evidence_revision=evidence_revision+1,status='Review',lifecycle_state='indexed',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)} AND mutation_generation=${Number(op.operation_generation)};`,\n      `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved','complete');`,"
new="`UPDATE projects SET workflow_step=4,evidence_revision=evidence_revision+1,status='Review',lifecycle_state='indexed',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)} AND mutation_generation=${Number(op.operation_generation)};`,\n      `UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND evidence_revision < (SELECT evidence_revision FROM projects WHERE project_token=${sqlQuote(projectToken)}) AND state IN ('draft','approved','complete');`,"
one(old,new,'evidence cutover plan stale exactness')
one("finishOperation(projectToken,op.operation_id,op.operation_generation,'completed','indexed',{run_id:runId});","finishOperation(projectToken,op.operation_id,op.operation_generation,'completed','indexed',{run_id:runId,evidence_revision:Number(projectRow(projectToken)?.evidence_revision||0)});",'evidence event revision')
if "p.lifecycle_state" not in s: raise SystemExit('generated coordination API does not expose lifecycle_state')
for marker in ["coordination-2","function stableProjectView(projectToken)","status=CASE WHEN evidence_revision>0 THEN 'Reindexing'","evidence_revision < (SELECT evidence_revision FROM projects"]:
 if marker not in s: raise SystemExit('missing v2 contract '+marker)
Path(sys.argv[2]).write_text(s);print('SOT coordination behavior v2 integrated')
