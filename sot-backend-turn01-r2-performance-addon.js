/* TURN01 R2 performance correction — remove repeated schema/multi-pass intelligence work */
const TURN01_R2_PERF='2026.08.22.turn01-r2-wizard-perf1';

// All required schema has already been established by the preceding addons during module load.
// Do not rerun additive migration probes on every request / every metric pass.
const t1r2PerfEnsureSchema=t1EnsureSchema;
let t1r2SchemaReady=true;
t1EnsureSchema=function(){
  if(t1r2SchemaReady)return;
  t1r2PerfEnsureSchema();
  t1r2SchemaReady=true;
};

// Lightweight corpus status. The old evidence-status route recalculated the entire global
// intelligence model merely to prove that retained evidence existed, which could block
// the single-threaded report server long enough to time out the installer/UI.
t1r1EvidenceStatus=function(){
  const x=rows(`SELECT
    (SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL) projects,
    (SELECT COUNT(*) FROM sources) sources,
    (SELECT COUNT(*) FROM manifests) manifests,
    (SELECT COUNT(*) FROM fingerprint_inventory) inventory,
    (SELECT COUNT(*) FROM file_observations) observations,
    (SELECT COUNT(DISTINCT sha256) FROM file_observations WHERE sha256 IS NOT NULL AND sha256<>'') unique_observation_hashes,
    (SELECT COALESCE(SUM(size),0) FROM file_observations) observation_bytes`)[0]||{};
  return {build:TURN01_R2_PERF,...Object.fromEntries(Object.entries(x).map(([k,v])=>[k,Number(v||0)]))};
};

function t1r2GateFromSnapshot(step,ctx){
  const {project:p,sourceCount,run,intel,plan}=ctx;
  if(!p)return {ok:false,reason:'Project no longer exists.'};
  if(step===1)return {ok:!!String(p.project_name||'').trim(),reason:'Enter a project name.'};
  if(step===2)return {ok:sourceCount>0,reason:'Add at least one source path.'};
  if(step===3){
    const ok=run.complete && Number(intel.observations||0)>0;
    return {ok,reason:run.state==='WIP'?'Processing is still running.':run.state==='Paused'?'Resume processing before review.':run.state==='Error'?'Processing has an error that must be resolved.':'No current corpus observations are available for review.'};
  }
  if(step===4){const u=Number(plan.totals?.unresolved_files||0);return {ok:Number(intel.observations||0)>0&&u===0,reason:u?`${u} unresolved file observations must be resolved.`:'No reviewable evidence exists.'};}
  if(step===5){const u=Number(plan.totals?.unresolved_files||0);return {ok:(plan.items||[]).length>0&&u===0,reason:u?`${u} plan items are unresolved.`:'The current plan has no actionable evidence.'};}
  if(step===6){const t0=plan.totals||{},remaining=Number(t0.transfer_files||0)+Number(t0.backup_files||0)+Number(t0.verify_target_files||0)+Number(t0.unresolved_files||0);return {ok:remaining===0&&(plan.items||[]).length>0,reason:remaining?`${remaining} items still require Target/Backup verification.`:'No verified execution evidence is available.'};}
  if(step===7){const t0=plan.totals||{},remaining=Number(t0.transfer_files||0)+Number(t0.backup_files||0)+Number(t0.verify_target_files||0)+Number(t0.unresolved_files||0);return {ok:remaining===0,reason:remaining?'Execution is no longer fully verified.':''};}
  return {ok:false,reason:'Unknown workflow step.'};
}

// Snapshot previously recomputed intelligence + plan once for the payload and then seven more
// times through t1r2Gate(). Compute them once and derive every gate from that same snapshot.
t1r2Snapshot=function(t){
  const p=project(t);if(!p)throw new Error('project not found');
  const state=t1r2State(t);
  const sources=t1SourceSummaries(t);
  const intel=t1Intelligence(t);
  const plan=t1Plan(t);
  const run=t1r2RunState(t);
  const sourceCount=sources.length;
  const step=Math.max(1,Math.min(7,Number(state.current_step||1)));
  const ctx={project:p,sourceCount,run,intel,plan};
  const gates={};for(let i=1;i<=7;i++)gates[i]=t1r2GateFromSnapshot(i,ctx);
  return {build:TURN01_R2_PERF,project:p,workflow:{...state,current_step:step,step_name:T1R2_STEPS[step]},sources,intelligence:intel,plan,processing:run,gates};
};

// Forward gate should use one fresh snapshot rather than triggering another full set of scans.
t1r2Gate=function(t,step){
  const p=project(t);if(!p)return {ok:false,reason:'Project no longer exists.'};
  const sources=t1SourceSummaries(t),intel=t1Intelligence(t),plan=t1Plan(t),run=t1r2RunState(t);
  return t1r2GateFromSnapshot(step,{project:p,sourceCount:sources.length,run,intel,plan});
};
