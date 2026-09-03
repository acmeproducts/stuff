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

# Stable committed state is independent of an in-flight replacement index.
anchor="function claimProjectOperation(projectToken,kind){"
helper=r'''function stableProjectView(projectToken){
  const p=projectRow(projectToken); if(!p)return {workflow_step:1,status:'Pending',lifecycle:'idle'};
  const plan=rows(`SELECT state,evidence_revision FROM plans WHERE project_token=${sqlQuote(projectToken)} AND evidence_revision=${Number(p.evidence_revision||0)} ORDER BY created_at DESC LIMIT 1;`)[0];
  if(plan&&plan.state==='complete')return {workflow_step:6,status:'Executed',lifecycle:'executed'};
  if(plan&&['draft','approved'].includes(plan.state))return {workflow_step:5,status:'Plan',lifecycle:'planned'};
  if(Number(p.evidence_revision||0)>0)return {workflow_step:4,status:'Review',lifecycle:'indexed'};
  return {workflow_step:Math.min(3,Math.max(1,Number(p.workflow_step||1))),status:Number(p.workflow_step||1)>=2?'Sources':'Pending',lifecycle:'idle'};
}
function restoreStableProject(projectToken,operationId,generation){
  const v=stableProjectView(projectToken),at=now();
  execute(`UPDATE projects SET workflow_step=${v.workflow_step},status=${sqlQuote(v.status)},lifecycle_state=${sqlQuote(v.lifecycle)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(operationId)} AND mutation_generation=${Number(generation)};`);
  return v;
}
'''
if s.count(anchor)!=1: raise SystemExit('helper anchor changed')
s=s.replace(anchor,helper+anchor,1)

# Restart recovery must restore the committed view, not force every project back to Index.
old="    UPDATE projects SET active_operation_id=NULL,lifecycle_state=CASE WHEN evidence_revision>0 THEN 'indexed' ELSE 'idle' END,updated_at=${sqlQuote(interruptedAt)} WHERE active_operation_id IS NOT NULL;"
new="    UPDATE projects SET active_operation_id=NULL,lifecycle_state=CASE WHEN evidence_revision>0 THEN 'indexed' ELSE 'idle' END,workflow_step=CASE WHEN evidence_revision>0 THEN MAX(workflow_step,4) ELSE MIN(workflow_step,3) END,status=CASE WHEN evidence_revision>0 THEN CASE WHEN workflow_step>=5 THEN status ELSE 'Review' END ELSE 'Interrupted' END,updated_at=${sqlQuote(interruptedAt)} WHERE active_operation_id IS NOT NULL;"
one(old,new,'restart stable view')

# Starting/restarting an index must not hide already committed evidence or its current plan.
old="`UPDATE projects SET workflow_step=3,status='Processing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`"
new="`UPDATE projects SET workflow_step=CASE WHEN evidence_revision>0 THEN workflow_step ELSE 3 END,status=CASE WHEN evidence_revision>0 THEN 'Reindexing' ELSE 'Processing' END,updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`"
one(old,new,'index start committed view')

# Resume follows the same rule.
old="`UPDATE projects SET workflow_step=3,status='Processing',lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`"
new="`UPDATE projects SET workflow_step=CASE WHEN evidence_revision>0 THEN workflow_step ELSE 3 END,status=CASE WHEN evidence_revision>0 THEN 'Reindexing' ELSE 'Processing' END,lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`"
one(old,new,'resume committed view')

# Stop/error/pause must never demote committed evidence. Restore the committed project view before releasing ownership.
old="      finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:runId,reason:'stopped'});"
new="      const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stable.lifecycle,{run_id:runId,reason:'stopped'});"
one(old,new,'worker stop restore')
old="      pauseOperation(projectToken,op.operation_id,op.operation_generation);"
new="      const stable=stableProjectView(projectToken); pauseOperation(projectToken,op.operation_id,op.operation_generation);\n      execute(`UPDATE projects SET workflow_step=${stable.workflow_step},status='Paused',updated_at=${sqlQuote(now())} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`);"
one(old,new,'pause preserve')
old="      finishOperation(projectToken,op.operation_id,op.operation_generation,'failed',stableLifecycle(projectToken),{run_id:runId,error:error.message});"
new="      const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'failed',stable.lifecycle,{run_id:runId,error:error.message});"
one(old,new,'worker error restore')
old="const op=runOperation(run.run_id); if(op.operation_id)finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:run.run_id,reason:'stopped'});"
new="const op=runOperation(run.run_id); if(op.operation_id){const stable=restoreStableProject(projectToken,op.operation_id,op.operation_generation);finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stable.lifecycle,{run_id:run.run_id,reason:'stopped'});}"
one(old,new,'paused stop restore')

# A successful evidence cutover stales only plans bound to older evidence, and records both revisions.
old="`UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND state IN ('draft','approved','complete');`,"
new="`UPDATE plans SET state='stale' WHERE project_token=${sqlQuote(projectToken)} AND evidence_revision < (SELECT evidence_revision FROM projects WHERE project_token=${sqlQuote(projectToken)}) AND state IN ('draft','approved','complete');`,"
one(old,new,'plan stale exactness')
old="finishOperation(projectToken,op.operation_id,op.operation_generation,'completed','indexed',{run_id:runId});"
new="finishOperation(projectToken,op.operation_id,op.operation_generation,'completed','indexed',{run_id:runId,evidence_revision:Number(projectRow(projectToken)?.evidence_revision||0)});"
one(old,new,'evidence event revision')

# Project listing must expose the authoritative lifecycle/operation fields used by the UI.
if "p.lifecycle_state" not in s:
    raise SystemExit('generated coordination API does not expose lifecycle_state')

for marker in ["coordination-2","function stableProjectView(projectToken)","status=CASE WHEN evidence_revision>0 THEN 'Reindexing'","evidence_revision < (SELECT evidence_revision FROM projects"]:
    if marker not in s: raise SystemExit('missing v2 contract '+marker)
Path(sys.argv[2]).write_text(s)
print('SOT coordination behavior v2 integrated')
