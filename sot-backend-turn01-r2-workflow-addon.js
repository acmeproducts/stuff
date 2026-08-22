/* TURN01 R2 — single linear workflow controller */
const TURN01_R2_BUILD='2026.08.22.turn01-r2-wizard';
const T1R2_STEPS={1:'project',2:'sources',3:'process',4:'review',5:'plan',6:'execute',7:'certify'};

function t1r2Ensure(){
  t1EnsureSchema();
  sql(`CREATE TABLE IF NOT EXISTS turn01_workflow_state(
    project_token TEXT PRIMARY KEY,
    current_step INTEGER NOT NULL DEFAULT 1,
    scope_revision INTEGER NOT NULL DEFAULT 0,
    processing_revision INTEGER NOT NULL DEFAULT 0,
    review_revision INTEGER NOT NULL DEFAULT 0,
    plan_revision INTEGER NOT NULL DEFAULT 0,
    execution_revision INTEGER NOT NULL DEFAULT 0,
    certification_revision INTEGER NOT NULL DEFAULT 0,
    approved_plan_hash TEXT,
    approved_at TEXT,
    execution_verified_at TEXT,
    completed_at TEXT,
    updated_at TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS idx_t1r2_step ON turn01_workflow_state(current_step,updated_at);`);
  TABLE_ALLOW.add('turn01_workflow_state');
}
function t1r2State(t){
  t1r2Ensure();
  let s=rows(`SELECT * FROM turn01_workflow_state WHERE project_token=${esc(t)} LIMIT 1`)[0];
  if(!s){const now=t1Now();sql(`INSERT INTO turn01_workflow_state(project_token,current_step,updated_at) VALUES(${esc(t)},1,${esc(now)});`);s=rows(`SELECT * FROM turn01_workflow_state WHERE project_token=${esc(t)} LIMIT 1`)[0];}
  return s;
}
function t1r2ProjectSourceCount(t){return Number(rows(`SELECT COUNT(*) n FROM sources WHERE project_token=${esc(t)}`)[0]?.n||0)}
function t1r2RunState(t){
  const runId=mpLatestRun(t);if(!runId)return {run_id:null,state:'NotStarted',phase:'idle',complete:false,summary:null};
  const q=mpQueueRow(t),r=mpRunRow(runId),s=mpSummary(t,runId),state=q?.state||r?.status||'Unknown';
  return {run_id:runId,state,phase:s?.phase||q?.phase||'unknown',complete:/^(Closed|ClosedWithErrors)$/i.test(String(state)),summary:s};
}
function t1r2PlanHash(plan){return t1Hash(JSON.stringify({project_token:plan.project_token,totals:plan.totals,items:(plan.items||[]).map(x=>[x.file_fingerprint,x.action,x.size,x.source_path,x.target_path,x.backup_path])}))}
function t1r2Gate(t,step){
  const p=project(t);if(!p)return {ok:false,reason:'Project no longer exists.'};
  const sourceCount=t1r2ProjectSourceCount(t),run=t1r2RunState(t),intel=t1Intelligence(t),plan=t1Plan(t);
  if(step===1)return {ok:!!String(p.project_name||'').trim(),reason:'Enter a project name.'};
  if(step===2)return {ok:sourceCount>0,reason:'Add at least one source path.'};
  if(step===3){
    const ok=run.complete && Number(intel.observations||0)>0;
    return {ok,reason:run.state==='WIP'?'Processing is still running.':run.state==='Paused'?'Resume processing before review.':run.state==='Error'?'Processing has an error that must be resolved.':'No current corpus observations are available for review.'};
  }
  if(step===4){const u=Number(plan.totals?.unresolved_files||0);return {ok:Number(intel.observations||0)>0&&u===0,reason:u?`${u} unresolved file observations must be resolved.`:'No reviewable evidence exists.'};}
  if(step===5){const u=Number(plan.totals?.unresolved_files||0);return {ok:(plan.items||[]).length>0&&u===0,reason:u?`${u} plan items are unresolved.`:'The current plan has no actionable evidence.'};}
  if(step===6){
    const t0=plan.totals||{},remaining=Number(t0.transfer_files||0)+Number(t0.backup_files||0)+Number(t0.verify_target_files||0)+Number(t0.unresolved_files||0);
    return {ok:remaining===0&&(plan.items||[]).length>0,reason:remaining?`${remaining} items still require Target/Backup verification.`:'No verified execution evidence is available.'};
  }
  if(step===7){const t0=plan.totals||{},remaining=Number(t0.transfer_files||0)+Number(t0.backup_files||0)+Number(t0.verify_target_files||0)+Number(t0.unresolved_files||0);return {ok:remaining===0,reason:remaining?'Execution is no longer fully verified.':''};}
  return {ok:false,reason:'Unknown workflow step.'};
}
function t1r2Snapshot(t){
  const p=project(t);if(!p)throw new Error('project not found');
  const state=t1r2State(t),sources=t1SourceSummaries(t),intel=t1Intelligence(t),plan=t1Plan(t),run=t1r2RunState(t),step=Math.max(1,Math.min(7,Number(state.current_step||1)));
  const gates={};for(let i=1;i<=7;i++)gates[i]=t1r2Gate(t,i);
  return {build:TURN01_R2_BUILD,project:p,workflow:{...state,current_step:step,step_name:T1R2_STEPS[step]},sources,intelligence:intel,plan,processing:run,gates};
}
function t1r2SetStep(t,step,extra=''){
  const now=t1Now();sql(`UPDATE turn01_workflow_state SET current_step=${Number(step)},updated_at=${esc(now)}${extra?','+extra:''} WHERE project_token=${esc(t)};`);return t1r2Snapshot(t);
}
function t1r2StartProcessing(t){
  const q=mpQueueRow(t);
  if(q&&q.state==='WIP')return q;
  return mpCreateRun(t,true);
}
function t1r2Forward(t){
  const s=t1r2State(t),step=Number(s.current_step||1),gate=t1r2Gate(t,step);if(!gate.ok)throw new Error(gate.reason||'Current step is incomplete.');
  if(step===1)return t1r2SetStep(t,2);
  if(step===2){t1r2StartProcessing(t);return t1r2SetStep(t,3,`processing_revision=scope_revision`)}
  if(step===3)return t1r2SetStep(t,4,`review_revision=processing_revision`);
  if(step===4)return t1r2SetStep(t,5);
  if(step===5){const plan=t1Plan(t),ph=t1r2PlanHash(plan),now=t1Now();return t1r2SetStep(t,6,`plan_revision=review_revision,approved_plan_hash=${esc(ph)},approved_at=${esc(now)}`)}
  if(step===6){const now=t1Now();return t1r2SetStep(t,7,`execution_revision=plan_revision,execution_verified_at=${esc(now)}`)}
  if(step===7){const now=t1Now();sql(`UPDATE turn01_workflow_state SET certification_revision=execution_revision,completed_at=${esc(now)},updated_at=${esc(now)} WHERE project_token=${esc(t)};UPDATE projects SET status='Closed',current_stage='certified',updated_at=${esc(now)} WHERE project_token=${esc(t)};`);return t1r2Snapshot(t)}
  throw new Error('invalid workflow step');
}
function t1r2Back(t){const s=t1r2State(t),step=Number(s.current_step||1);if(step<=1)throw new Error('Already at the first step.');return t1r2SetStep(t,step-1)}
function t1r2InvalidateScope(t){
  t1r2Ensure();const s=t1r2State(t),next=Math.min(Number(s.current_step||1),2),now=t1Now();
  sql(`UPDATE turn01_workflow_state SET current_step=${next},scope_revision=scope_revision+1,processing_revision=0,review_revision=0,plan_revision=0,execution_revision=0,certification_revision=0,approved_plan_hash=NULL,approved_at=NULL,execution_verified_at=NULL,completed_at=NULL,updated_at=${esc(now)} WHERE project_token=${esc(t)};`);
}
const t1r2PriorUpdateProject=t1UpdateProject;
t1UpdateProject=function(t,b){
  const before=project(t),beforePaths=(before?.sources||[]).map(x=>x.normalized_path_or_locator||x.path).sort().join('\0');
  const out=t1r2PriorUpdateProject(t,b);
  if(Array.isArray(b.sources)||Array.isArray(b.paths)){
    const after=project(t),afterPaths=(after?.sources||[]).map(x=>x.normalized_path_or_locator||x.path).sort().join('\0');
    if(beforePaths!==afterPaths)t1r2InvalidateScope(t);
  }
  return out;
};
const t1r2PriorCreateProject=t1CreateProject;
t1CreateProject=function(b){const out=t1r2PriorCreateProject(b);t1r2State(out.project_token);return out};

const t1r2PriorHandle=handle;
handle=async function(req,res,url){
  const pn=url.pathname;
  try{
    if(pn==='/api/sot/health'&&req.method==='GET'){
      json(res,200,{service:'sot',status:'ok',version:VERSION,build:TURN01_R2_BUILD,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','path-centric-projects','turn01-minimum-evidence','turn01-existing-evidence-bridge','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan','turn01-target-backup-disposition','turn01-linear-workflow-controller','db-admin','diagnostic-log']});return true;
    }
    let m=pn.match(/^\/api\/sot\/turn01\/workflow\/([^/]+)$/);
    if(m&&req.method==='GET'){json(res,200,t1r2Snapshot(decodeURIComponent(m[1])));return true}
    m=pn.match(/^\/api\/sot\/turn01\/workflow\/([^/]+)\/(forward|back)$/);
    if(m&&req.method==='POST'){const t=decodeURIComponent(m[1]);json(res,200,m[2]==='forward'?t1r2Forward(t):t1r2Back(t));return true}
    return t1r2PriorHandle(req,res,url);
  }catch(e){json(res,400,{error:e.message});return true}
};
t1r2Ensure();
