#!/usr/bin/env python3
from pathlib import Path
import re, sys

if len(sys.argv) != 3:
    raise SystemExit('usage: integrate-SOT-turn01-coordination.py <base22-api.js> <output-api.js>')
src=Path(sys.argv[1]).read_text()
for marker in ["const BUILD = '2026.08.30.sot-turn01-base-22';","const EXPECTED_MIGRATION = 4;","async function processRun(runId, projectToken) {","function startProcessing(projectToken) {","function generatePlan(projectToken) {","async function executePlan(planId) {","function startExecution(projectToken) {"]:
    if src.count(marker)!=1: raise SystemExit(f'coordination input contract failed: {marker} count={src.count(marker)}')
src=src.replace("const BUILD = '2026.08.30.sot-turn01-base-22';","const BUILD = '2026.09.03.sot-turn01-coordination-1';",1)
src=src.replace('const EXPECTED_MIGRATION = 4;','const EXPECTED_MIGRATION = 5;',1)

def span(text,name):
    m=list(re.finditer(r'(?m)^(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(',text))
    if len(m)!=1: raise SystemExit(f'function boundary {name}: {len(m)}')
    a=m[0].start(); b=text.find('{',m[0].end()); depth=0; quote=None; esc=False; i=b
    while i<len(text):
        c=text[i]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}':
                depth-=1
                if depth==0:return a,i+1
        i+=1
    raise SystemExit('unbalanced '+name)

def replace_fn(text,name,new):
    a,b=span(text,name); return text[:a]+new.strip()+text[b:]

insert=span(src,'projectRow')[1]
helpers=r'''

function activeProjectOperation(projectToken){
  return rows(`SELECT * FROM project_operations WHERE project_token=${sqlQuote(projectToken)} AND state IN ('queued','running','paused') ORDER BY generation DESC LIMIT 1;`)[0]||null;
}
function stableLifecycle(projectToken){
  const p=projectRow(projectToken); if(!p)return 'idle';
  const plan=rows(`SELECT state,evidence_revision FROM plans WHERE project_token=${sqlQuote(projectToken)} ORDER BY created_at DESC LIMIT 1;`)[0];
  if(plan&&Number(plan.evidence_revision)===Number(p.evidence_revision)&&['draft','approved','complete'].includes(plan.state))return plan.state==='complete'?'executed':'planned';
  return Number(p.evidence_revision||0)>0?'indexed':'idle';
}
function claimProjectOperation(projectToken,kind){
  const p=projectRow(projectToken); if(!p)throw httpError(404,'project not found');
  const active=activeProjectOperation(projectToken); if(active)throw httpError(409,`project is busy: ${active.kind}`);
  const operationId=randomId(16), generation=Number(p.mutation_generation||0)+1, at=now();
  const lifecycle=kind==='index'?'indexing':kind==='plan'?'planning':'executing';
  transaction([
    `INSERT INTO project_operations(operation_id,project_token,kind,generation,state,created_at,updated_at,detail_json) VALUES(${sqlQuote(operationId)},${sqlQuote(projectToken)},${sqlQuote(kind)},${generation},'queued',${sqlQuote(at)},${sqlQuote(at)},'{}');`,
    `UPDATE projects SET mutation_generation=${generation},active_operation_id=${sqlQuote(operationId)},lifecycle_state=${sqlQuote(lifecycle)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id IS NULL;`,
    `INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'operation.queued',${sqlQuote(at)},${sqlQuote(JSON.stringify({operation_id:operationId,kind,generation,lifecycle}))});`
  ]);
  return {operation_id:operationId,generation,kind,lifecycle};
}
function operationOwns(projectToken,operationId,generation){
  const p=projectRow(projectToken); return !!p&&p.active_operation_id===operationId&&Number(p.mutation_generation)===Number(generation);
}
function requireOperation(projectToken,operationId,generation){if(!operationOwns(projectToken,operationId,generation))throw new Error('stale project operation');}
function startOperation(projectToken,operationId,generation){
  requireOperation(projectToken,operationId,generation); const at=now();
  transaction([`UPDATE project_operations SET state='running',started_at=COALESCE(started_at,${sqlQuote(at)}),updated_at=${sqlQuote(at)} WHERE operation_id=${sqlQuote(operationId)} AND generation=${Number(generation)} AND state='queued';`,`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'operation.running',${sqlQuote(at)},${sqlQuote(JSON.stringify({operation_id:operationId,generation}))});`]);
}
function pauseOperation(projectToken,operationId,generation){
  if(!operationOwns(projectToken,operationId,generation))return; const at=now();
  transaction([`UPDATE project_operations SET state='paused',updated_at=${sqlQuote(at)} WHERE operation_id=${sqlQuote(operationId)};`,`UPDATE projects SET lifecycle_state='paused',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(operationId)};`]);
}
function resumeOperation(projectToken,operationId,generation){
  requireOperation(projectToken,operationId,generation); const at=now();
  transaction([`UPDATE project_operations SET state='queued',updated_at=${sqlQuote(at)} WHERE operation_id=${sqlQuote(operationId)} AND state='paused';`,`UPDATE projects SET lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(operationId)};`]);
}
function finishOperation(projectToken,operationId,generation,state,lifecycle,detail={}){
  if(!operationOwns(projectToken,operationId,generation))return false; const at=now();
  transaction([`UPDATE project_operations SET state=${sqlQuote(state)},updated_at=${sqlQuote(at)},ended_at=${sqlQuote(at)},detail_json=${sqlQuote(JSON.stringify(detail))} WHERE operation_id=${sqlQuote(operationId)} AND generation=${Number(generation)};`,`UPDATE projects SET active_operation_id=NULL,lifecycle_state=${sqlQuote(lifecycle)},updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(operationId)} AND mutation_generation=${Number(generation)};`,`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},${sqlQuote('operation.'+state)},${sqlQuote(at)},${sqlQuote(JSON.stringify({operation_id:operationId,generation,...detail}))});`]); return true;
}
function assertProjectIdle(projectToken){const op=activeProjectOperation(projectToken);if(op)throw httpError(409,`project is busy: ${op.kind}`);}
function runOperation(runId){return rows(`SELECT operation_id,operation_generation FROM processing_runs WHERE run_id=${sqlQuote(runId)} LIMIT 1;`)[0]||{};}
'''
src=src[:insert]+helpers+src[insert:]

# startup recovery: preserve committed evidence, clear abandoned operation ownership
needle="""    UPDATE plans SET state='error' WHERE state='executing';
    COMMIT;`);"""
replacement="""    UPDATE plans SET state='error' WHERE state='executing';
    UPDATE project_operations SET state='interrupted',updated_at=${sqlQuote(interruptedAt)},ended_at=${sqlQuote(interruptedAt)},detail_json='{\"reason\":\"Service restarted\"}' WHERE state IN ('queued','running','paused');
    UPDATE projects SET active_operation_id=NULL,lifecycle_state=CASE WHEN evidence_revision>0 THEN 'indexed' ELSE 'idle' END,updated_at=${sqlQuote(interruptedAt)} WHERE active_operation_id IS NOT NULL;
    COMMIT;`);"""
if src.count(needle)!=1: raise SystemExit('startup recovery marker changed')
src=src.replace(needle,replacement,1)

src=replace_fn(src,'startProcessing',r'''function startProcessing(projectToken) {
  if (!projectRow(projectToken)) throw httpError(404, 'project not found');
  const active = rows(`SELECT run_id FROM processing_runs WHERE project_token=${sqlQuote(projectToken)} AND state IN ('Queued','WIP','Paused') LIMIT 1;`)[0];
  if (active) throw httpError(409, 'project is already processing');
  const preflight = preflightProject(projectToken);
  if (!preflight.ready) throw httpError(409, `source preflight blocked processing: ${preflight.message || `${preflight.blocking_count} source(s) blocked`}`);
  const op=claimProjectOperation(projectToken,'index');
  const runId=randomId(12),at=now();
  transaction([`INSERT INTO processing_runs(run_id,project_token,state,phase,started_at,updated_at,operation_id,operation_generation) VALUES(${sqlQuote(runId)},${sqlQuote(projectToken)},'Queued','queued',${sqlQuote(at)},${sqlQuote(at)},${sqlQuote(op.operation_id)},${op.generation});`,`UPDATE projects SET workflow_step=3,status='Processing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`,`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.started',${sqlQuote(at)},${sqlQuote(JSON.stringify({run_id:runId,operation_id:op.operation_id,generation:op.generation}))});`]);
  const job=launchBackground('index',runId,projectToken); event(projectToken,'processing.worker.launched',{run_id:runId,pid:job?.pid||null,operation_id:op.operation_id});
  return {project_token:projectToken,run_id:runId,status:'Queued',worker_pid:job?.pid||null,operation_id:op.operation_id};
}''')

# processRun ownership checks and operation transitions
old="async function processRun(runId, projectToken) {\n  try {"
new="async function processRun(runId, projectToken) {\n  const op=runOperation(runId);\n  try {\n    if(!op.operation_id||!op.operation_generation)throw new Error('processing run has no coordination operation');\n    requireOperation(projectToken,op.operation_id,op.operation_generation);\n    startOperation(projectToken,op.operation_id,op.operation_generation);"
if src.count(old)!=1: raise SystemExit('processRun start marker changed')
src=src.replace(old,new,1)
# require ownership immediately before evidence cutover
cut="    const sourceIds = sources.map(source => sqlQuote(source.source_id)).join(',');\n    const at = now();"
if src.count(cut)!=1: raise SystemExit('evidence cutover marker changed')
src=src.replace(cut,"    requireOperation(projectToken,op.operation_id,op.operation_generation);\n    const sourceIds = sources.map(source => sqlQuote(source.source_id)).join(',');\n    const at = now();",1)
# project completion only while owned; complete operation after evidence transaction
old="`UPDATE projects SET workflow_step=4,evidence_revision=evidence_revision+1,status='Review',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)};`,"
new="`UPDATE projects SET workflow_step=4,evidence_revision=evidence_revision+1,status='Review',lifecycle_state='indexed',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)} AND mutation_generation=${Number(op.operation_generation)};`,"
if src.count(old)!=1: raise SystemExit('index project commit marker changed')
src=src.replace(old,new,1)
needle="    transaction(statements);\n  } catch (error) {"
if src.count(needle)!=1: raise SystemExit('processRun completion marker changed')
src=src.replace(needle,"    transaction(statements);\n    finishOperation(projectToken,op.operation_id,op.operation_generation,'completed','indexed',{run_id:runId});\n  } catch (error) {",1)
# pause/stop/error release/retain ownership after existing state transaction
src=src.replace("      ]);\n    } else if (error instanceof PauseRequested) {","      ]);\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:runId,reason:'stopped'});\n    } else if (error instanceof PauseRequested) {",1)
src=src.replace("      ]);\n    } else {\n      transaction([","      ]);\n      pauseOperation(projectToken,op.operation_id,op.operation_generation);\n    } else {\n      transaction([",1)
# first occurrence after process error transaction is followed by closing catch; target unique event text
errneedle="`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.error',${sqlQuote(at)},${sqlQuote(JSON.stringify({ run_id: runId, error: error.message }))});`\n      ]);"
if src.count(errneedle)!=1: raise SystemExit('processing error marker changed')
src=src.replace(errneedle,errneedle+"\n      finishOperation(projectToken,op.operation_id,op.operation_generation,'failed',stableLifecycle(projectToken),{run_id:runId,error:error.message});",1)

src=replace_fn(src,'resumeProcessing',r'''function resumeProcessing(projectToken) {
  const run=latestRun(projectToken); if(!run||run.state!=='Paused')throw httpError(409,'no paused processing run');
  const op=runOperation(run.run_id); if(!op.operation_id||!operationOwns(projectToken,op.operation_id,op.operation_generation))throw httpError(409,'paused run no longer owns the project');
  resumeOperation(projectToken,op.operation_id,op.operation_generation); const at=now();
  transaction([`DELETE FROM run_files WHERE run_id=${sqlQuote(run.run_id)};`,`DELETE FROM folder_progress WHERE run_id=${sqlQuote(run.run_id)};`,`DELETE FROM processing_workers WHERE run_id=${sqlQuote(run.run_id)};`,`UPDATE processing_runs SET state='Queued',phase='queued',files_discovered=0,bytes_discovered=0,files_processed=0,bytes_processed=0,hashes_reused=0,hashes_computed=0,warning_count=0,error_count=0,folder_count=0,top_level_item_count=0,worker_pid=NULL,pause_requested=0,stop_requested=0,current_source='',current_item='',updated_at=${sqlQuote(at)},ended_at=NULL,error_message='' WHERE run_id=${sqlQuote(run.run_id)};`,`UPDATE projects SET workflow_step=3,status='Processing',lifecycle_state='indexing',updated_at=${sqlQuote(at)} WHERE project_token=${sqlQuote(projectToken)} AND active_operation_id=${sqlQuote(op.operation_id)};`,`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'processing.resumed',${sqlQuote(at)},${sqlQuote(JSON.stringify({run_id:run.run_id,operation_id:op.operation_id}))});`]);
  const job=launchBackground('index',run.run_id,projectToken,true); event(projectToken,'processing.worker.launched',{run_id:run.run_id,pid:job?.pid||null,resumed:true,operation_id:op.operation_id}); return {project_token:projectToken,run_id:run.run_id,status:'Queued',resumed:true,worker_pid:job?.pid||null};
}''')

# paused stop must release operation
old="""    return { project_token: projectToken, run_id: run.run_id, status: 'stopped', worker_signaled: false };"""
new="""    const op=runOperation(run.run_id); if(op.operation_id)finishOperation(projectToken,op.operation_id,op.operation_generation,'cancelled',stableLifecycle(projectToken),{run_id:run.run_id,reason:'stopped'});
    return { project_token: projectToken, run_id: run.run_id, status: 'stopped', worker_signaled: false };"""
if src.count(old)!=1: raise SystemExit('paused stop marker changed')
src=src.replace(old,new,1)

# planning is a serialized synchronous mutation
orig=src[span(src,'generatePlan')[0]:span(src,'generatePlan')[1]]
body=orig.replace("  const project = projectRow(projectToken);","  const project = projectRow(projectToken);\n  assertProjectIdle(projectToken);",1)
body=body.replace("  const planId = randomId(16);\n  const at = now();","  const op=claimProjectOperation(projectToken,'plan');\n  startOperation(projectToken,op.operation_id,op.generation);\n  const planId = randomId(16);\n  const at = now();",1)
body=body.replace("`INSERT INTO plans(plan_id,project_token,evidence_revision,state,created_at) VALUES(${sqlQuote(planId)},${sqlQuote(projectToken)},${Number(project.evidence_revision)},'draft',${sqlQuote(at)});`","`INSERT INTO plans(plan_id,project_token,evidence_revision,state,created_at,operation_id,operation_generation) VALUES(${sqlQuote(planId)},${sqlQuote(projectToken)},${Number(project.evidence_revision)},'draft',${sqlQuote(at)},${sqlQuote(op.operation_id)},${op.generation});`",1)
body=body.replace("  transaction(statements);\n  return planDetail(planId);","  transaction(statements);\n  finishOperation(projectToken,op.operation_id,op.generation,'completed','planned',{plan_id:planId,evidence_revision:Number(project.evidence_revision)});\n  return planDetail(planId);",1)
src=replace_fn(src,'generatePlan',body)

# execution claim and ownership
orig=src[span(src,'startExecution')[0]:span(src,'startExecution')[1]]
orig=orig.replace("  const at = now();","  assertProjectIdle(projectToken);\n  const op=claimProjectOperation(projectToken,'execute');\n  const at = now();",1)
orig=orig.replace("`UPDATE plans SET state='executing',approved_at=${sqlQuote(at)} WHERE plan_id=${sqlQuote(plan.plan_id)};`","`UPDATE plans SET state='executing',approved_at=${sqlQuote(at)},operation_id=${sqlQuote(op.operation_id)},operation_generation=${op.generation} WHERE plan_id=${sqlQuote(plan.plan_id)};`",1)
orig=orig.replace("  const job = launchBackground('execute', plan.plan_id, projectToken);","  const job = launchBackground('execute', plan.plan_id, projectToken);",1)
src=replace_fn(src,'startExecution',orig)
# executePlan start and terminal operation transitions
old="async function executePlan(planId) {\n  const plan = planDetail(planId);\n  if (!plan) return;\n  const projectToken = plan.project_token;\n  try {"
new="async function executePlan(planId) {\n  const plan = planDetail(planId);\n  if (!plan) return;\n  const projectToken = plan.project_token;\n  const op={operation_id:plan.operation_id,generation:Number(plan.operation_generation||0)};\n  try {\n    requireOperation(projectToken,op.operation_id,op.generation);\n    startOperation(projectToken,op.operation_id,op.generation);"
if src.count(old)!=1: raise SystemExit('executePlan start marker changed')
src=src.replace(old,new,1)
# ownership before every item and before completion
src=src.replace("    for (const item of plan.items) {\n      execute(`UPDATE plan_items","    for (const item of plan.items) {\n      requireOperation(projectToken,op.operation_id,op.generation);\n      execute(`UPDATE plan_items",1)
src=src.replace("    const at = now();\n    transaction([\n      `UPDATE plans SET state='complete'","    requireOperation(projectToken,op.operation_id,op.generation);\n    const at = now();\n    transaction([\n      `UPDATE plans SET state='complete'",1)
needle="`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'execution.completed',${sqlQuote(at)},${sqlQuote(JSON.stringify({ plan_id: planId }))});`\n    ]);"
if src.count(needle)!=1: raise SystemExit('execution completion marker changed')
src=src.replace(needle,needle+"\n    finishOperation(projectToken,op.operation_id,op.generation,'completed','executed',{plan_id:planId});",1)
needle="`INSERT INTO events(project_token,event_type,created_at,detail_json) VALUES(${sqlQuote(projectToken)},'execution.error',${sqlQuote(at)},${sqlQuote(JSON.stringify({ plan_id: planId, error: error.message }))});`\n    ]);"
if src.count(needle)!=1: raise SystemExit('execution error marker changed')
src=src.replace(needle,needle+"\n    finishOperation(projectToken,op.operation_id,op.generation,'failed',stableLifecycle(projectToken),{plan_id:planId,error:error.message});",1)

# source/scope and manual workflow navigation cannot mutate underneath an active operation
for name in ['replaceSources','moveBack','certify']:
    a,b=span(src,name); fn=src[a:b]; marker='{'; pos=fn.find(marker)+1; fn=fn[:pos]+"\n  assertProjectIdle(projectToken);"+fn[pos:]; src=src[:a]+fn+src[b:]

# expose operation state in scheduler and health capability
src=src.replace("architecture: 'background-process-per-project',","architecture: 'durable-per-project-coordinator',",1)
src=src.replace("'durable-activity-log',","'durable-activity-log', 'durable-project-coordination', 'stale-operation-rejection', 'atomic-evidence-cutover',",1)

for marker in ["const EXPECTED_MIGRATION = 5;","function claimProjectOperation(projectToken,kind)","active_operation_id","operation_generation","durable-per-project-coordinator","stale-operation-rejection"]:
    if marker not in src: raise SystemExit('missing output contract '+marker)
Path(sys.argv[2]).write_text(src)
print('SOT coordination backend integrated')
