/* SOT 0.4.1 / 6.7.2 telemetry layout hotfix */
if(typeof WSL!=='undefined' && WSL){
  const TELEMETRY_BUILD='2026.08.18.6.7.2-wsl-telemetry';
  const TELEMETRY_WORKERS=4;
  const buildEl=document.querySelector('.build');
  if(buildEl)buildEl.textContent='UI v0.4.1 · '+TELEMETRY_BUILD;

  function tFmtMinutes(v){return Number(v||0).toFixed(Number(v||0)>=10?1:2)+' min'}
  function tFmtClock(v){return v?new Date(v).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—'}
  function tElapsedMinutes(start,end){if(!start)return 0;const a=new Date(start).getTime(),b=end?new Date(end).getTime():Date.now();return Math.max(0,(b-a)/60000)}
  function tBaseName(p){const s=String(p||'').replace(/\/$/,'');return s.split('/').pop()||s||'—'}

  function activeWorkerRows(live){
    const job=live?.job||{},workers=Array.isArray(job.workers)?job.workers:[];
    const byId=new Map(workers.map(w=>[Number(w.worker_id),w]));
    return Array.from({length:TELEMETRY_WORKERS},(_,i)=>{
      const id=i+1,w=byId.get(id)||{};
      const active=!!(w.folder||w.item||w.started_at);
      const folder=w.folder?(w.phase==='fingerprinting'?w.folder:tBaseName(w.folder)):'Idle';
      const item=w.item||'';
      const mins=active?tElapsedMinutes(w.started_at,null):0;
      return `<tr><td><strong>Worker ${id}</strong><div class="muted">${esc(folder)}</div></td><td class="mono">${esc(item)}</td><td>${active?fmtBytes(Number(w.bytes||0)):'—'}</td><td>${active?Number(w.files||0).toLocaleString():'—'}</td><td>${active?tFmtClock(w.started_at):'—'}</td><td>—</td><td>${active?tFmtMinutes(mins):'—'}</td></tr>`;
    }).join('');
  }

  function liveTotalsBand(live){
    const run=live?.run||{},t=live?.totals||{},job=live?.job||{};
    const start=run.started_at||job.started_at||null,end=run.ended_at||null;
    const folders=Number(t.folders||0),files=Number(t.files||run.files_total||0),bytes=Number(t.bytes||0),mins=tElapsedMinutes(start,end);
    return `<div class="tableWrap" style="margin-top:10px;max-height:none"><table class="dataTable" style="min-width:760px"><thead><tr><th># of Folders</th><th># of Files</th><th>Size</th><th>Start</th><th>End</th><th>Cumulative Minutes</th></tr></thead><tbody><tr><td><strong>${folders.toLocaleString()}</strong></td><td><strong>${files.toLocaleString()}</strong></td><td><strong>${fmtBytes(bytes)}</strong></td><td>${tFmtClock(start)}</td><td>${tFmtClock(end)}</td><td>${tFmtMinutes(mins)}</td></tr></tbody></table></div>`;
  }

  function completedFolderRows(live){
    const rows=(live?.folder_rows||[]).filter(r=>r.ended_at||r.status==='done'||r.status==='error').sort((a,b)=>String(a.ended_at||'').localeCompare(String(b.ended_at||'')));
    if(!rows.length)return '<tr><td colspan="6">No completed folders yet.</td></tr>';
    return rows.map(r=>`<tr><td title="${esc(r.dir_path||'')}"><strong>${esc(r.relative_dir||tBaseName(r.dir_path))}</strong><div class="mono muted">${esc(r.dir_path||'')}</div></td><td>${fmtBytes(Number(r.bytes_seen||0))}</td><td>${Number(r.files_seen||0).toLocaleString()}</td><td>${tFmtClock(r.started_at)}</td><td>${tFmtClock(r.ended_at)}</td><td>${tFmtMinutes(r.elapsed_seconds||tElapsedMinutes(r.started_at,r.ended_at))}</td></tr>`).join('');
  }

  fingerprintProjectHtml=function(p){
    const live=state.fp.live||{},run=live.run||null,job=live.job||null,status=run?.status||p.status||'Pending',phase=job?.phase||run?.status||'Ready',t=live.totals||{},total=Number(run?.files_total||t.files||0),done=Number(run?.files_done||t.done||0),errors=Number(run?.error_count||t.errors||0),processed=done+errors,pct=total?Math.min(100,processed/total*100):0,has=!!live.has_checkpoint,running=['WIP','Running'].includes(status),paused=['Paused','Stopped','Error'].includes(status),canContinue=paused&&has;
    return `<div class="actions" style="margin-bottom:10px"><input class="input" id="fpProjectName" value="${esc(p.project_name)}" style="font-size:18px;font-weight:800;max-width:520px" title="Rename project; Enter or blur saves"><span class="badge ${running?'warn':'good'}">${esc(status)}</span></div>
    <div class="statusGrid"><div class="statusCell"><div class="k">Phase</div><div class="v">${esc(phase)}</div></div><div class="statusCell"><div class="k">Progress</div><div class="v">${phase==='fingerprinting'&&total?Math.round(pct)+'%':'—'}</div>${phase==='fingerprinting'&&total?`<div class="progressTrack"><div class="progressFill" style="width:${pct}%"></div></div>`:''}</div><div class="statusCell"><div class="k">Files</div><div class="v">${total?processed.toLocaleString()+' / '+total.toLocaleString():Number(t.files||0).toLocaleString()}</div></div><div class="statusCell"><div class="k">Folders</div><div class="v">${Number(t.folders_done||0).toLocaleString()} / ${Number(t.folders||0).toLocaleString()}</div></div><div class="statusCell"><div class="k">Size</div><div class="v">${fmtBytes(Number(t.bytes||0))}</div></div><div class="statusCell"><div class="k">Errors</div><div class="v">${errors.toLocaleString()}</div></div></div>
    <div class="actions" style="margin-top:10px"><button class="btn primary" id="fpStart" ${running||paused?'disabled':''}>Start</button><button class="btn" id="fpPause" ${!running?'disabled':''}>Pause</button><button class="btn primary" id="fpContinue" ${!canContinue?'disabled':''}>Continue</button><button class="btn danger" id="fpRestart" ${running?'disabled':''}>Restart</button>${paused&&!has?'<span class="callout warn">No durable checkpoint exists for this older run. Use Restart.</span>':''}</div>
    <div style="margin-top:12px;font-weight:800">Current folders actively being worked</div>
    <div class="tableWrap" style="max-height:none"><table class="dataTable"><thead><tr><th>Folder Name</th><th>Item Name</th><th>Size Cumulative</th><th># of Files Cumulative</th><th>Start</th><th>End</th><th>Cumulative Minutes</th></tr></thead><tbody>${activeWorkerRows(live)}</tbody></table></div>
    ${liveTotalsBand(live)}
    <div style="margin-top:12px;font-weight:800">Completed indexed folders</div>
    <div class="tableWrap" style="max-height:360px"><table class="dataTable"><thead><tr><th>Folder Name</th><th>Size Cumulative</th><th># of Files Cumulative</th><th>Start</th><th>End</th><th>Cumulative Minutes</th></tr></thead><tbody>${completedFolderRows(live)}</tbody></table></div>`;
  };

  const priorRenderFingerprinting=renderFingerprinting;
  renderFingerprinting=function(){priorRenderFingerprinting();setTimeout(()=>{const b=document.querySelector('.build');if(b)b.textContent='UI v0.4.1 · '+TELEMETRY_BUILD},0)};
  if(state.route==='fingerprinting')renderFingerprinting();
}
