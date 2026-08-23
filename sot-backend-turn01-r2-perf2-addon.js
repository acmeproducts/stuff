/* TURN01 R2 perf2 — step-aware workflow snapshots; Step 1/2 must be immediate. */
const TURN01_R2_PERF2='2026.08.23.turn01-r2-wizard-perf2';

function t1r2LiteSources(t){
  return rows(`SELECT source_id,project_token,normalized_path_or_locator AS path,normalized_path_or_locator AS last_observed_locator,operator_label,operator_note
    FROM sources WHERE project_token=${esc(t)} ORDER BY source_id`).map(x=>({...x,note:x.operator_note||''}));
}

function t1r2LiteGate(step,ctx){
  if(step===1)return {ok:!!String(ctx.project?.project_name||'').trim(),reason:'Enter a project name.'};
  if(step===2)return {ok:ctx.sourceCount>0,reason:'Add at least one source path.'};
  return null;
}

const t1r2Perf2HeavySnapshot=t1r2Snapshot;
t1r2Snapshot=function(t){
  const p=project(t);if(!p)throw new Error('project not found');
  const ws=t1r2State(t),step=Math.max(1,Math.min(7,Number(ws.current_step||1)));
  if(step<=2){
    const sources=t1r2LiteSources(t),sourceCount=sources.length;
    const gates={
      1:t1r2LiteGate(1,{project:p,sourceCount}),
      2:t1r2LiteGate(2,{project:p,sourceCount})
    };
    // Future-step gates are intentionally opaque until their step is reached; do not scan corpus here.
    for(let i=3;i<=7;i++)gates[i]={ok:false,reason:'Complete the current workflow steps first.'};
    return {build:TURN01_R2_PERF2,project:p,workflow:{...ws,current_step:step,step_name:T1R2_STEPS[step]},sources,intelligence:{},plan:{totals:{},items:[]},processing:{state:'NotStarted',phase:'idle',complete:false},gates};
  }
  const out=t1r2Perf2HeavySnapshot(t);out.build=TURN01_R2_PERF2;return out;
};

const t1r2Perf2Gate=t1r2Gate;
t1r2Gate=function(t,step){
  if(step===1){const p=project(t);return t1r2LiteGate(1,{project:p,sourceCount:0})}
  if(step===2){const p=project(t),sourceCount=Number(rows(`SELECT COUNT(*) n FROM sources WHERE project_token=${esc(t)}`)[0]?.n||0);return t1r2LiteGate(2,{project:p,sourceCount})}
  return t1r2Perf2Gate(t,step);
};

const t1r2Perf2PriorHandle=handle;
handle=async function(req,res,url){
  if(url.pathname==='/api/sot/health'&&req.method==='GET'){
    json(res,200,{service:'sot',status:'ok',version:VERSION,build:TURN01_R2_PERF2,server:'session-server.js',port:18080,capabilities:['fs-details','projects','global-multi-project-scheduler','durable-file-inventory','global-hash-reuse','path-centric-projects','turn01-minimum-evidence','turn01-existing-evidence-bridge','turn01-realtime-intelligence','turn01-ad-hoc-query','turn01-dynamic-plan','turn01-target-backup-disposition','turn01-linear-workflow-controller','turn01-step-aware-snapshots','db-admin','diagnostic-log']});return true;
  }
  return t1r2Perf2PriorHandle(req,res,url);
};
