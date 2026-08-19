'use strict';
if(typeof WSL!=='undefined'&&WSL){
 let mp68MetricTimer=null;
 function mp68StopMetricTimer(){if(mp68MetricTimer){clearTimeout(mp68MetricTimer);mp68MetricTimer=null}}
 function mp68UpdateMetrics(live){
  const cells=$$('.statusCell');if(cells.length<6)return;
  const run=live?.run||{},job=live?.job||{},t=live?.totals||{},pr=live?.progress||{};
  const phase=job.phase||run.status||'Ready';
  const filesDone=Number(t.done||0)+Number(t.errors||0),filesTotal=Number(t.files||0),bytesDone=Number(t.bytes_done||run.bytes_done||0),bytesTotal=Number(t.bytes||0),pct=Number(pr.bytes_percent||0);
  const set=(i,v)=>{const e=cells[i]?.querySelector('.v');if(e)e.textContent=v};
  set(0,phase);set(1,bytesTotal?mpPct(pct):'—');set(2,fmtBytes(bytesDone)+' / '+fmtBytes(bytesTotal));set(3,filesDone.toLocaleString()+' / '+filesTotal.toLocaleString());set(4,Number(t.folders_done||0).toLocaleString()+' / '+Number(t.folders||0).toLocaleString()+' folders');set(5,mpFmtRate(pr.bytes_per_second)+' · '+mpFmtEta(pr.eta_seconds));
  const fill=cells[1]?.querySelector('.progressFill');if(fill)fill.style.width=Math.max(0,Math.min(100,pct))+'%';
 }
 async function mp68MetricTick(){
  if(state.route!=='fingerprinting'){mp68StopMetricTimer();return}
  const p=state.selectedProject;if(p){try{const live=await api('/projects/'+encodeURIComponent(p.project_token)+'/fingerprint/status');if(state.selectedProject?.project_token===p.project_token){state.fp.live=live;mp68UpdateMetrics(live)}}catch{}}
  mp68MetricTimer=setTimeout(mp68MetricTick,1000);
 }
 const mp68RenderFingerprinting=renderFingerprinting;
 renderFingerprinting=function(){mp68StopMetricTimer();mp68RenderFingerprinting();mp68MetricTimer=setTimeout(mp68MetricTick,500)};
 fpAction67=async function(p,action){
  try{state.fp.running=true;await api('/projects/'+encodeURIComponent(p.project_token)+'/fingerprint/'+action,{method:'POST',body:'{}'});state.fp.live=await api('/projects/'+encodeURIComponent(p.project_token)+'/fingerprint/status');toast(action==='start'?'Project added to global worker pool.':action==='continue'?'Project resumed in global worker pool.':'Project restarted in global worker pool.');renderFingerprinting()}catch(e){toast(e.message,true)}finally{state.fp.running=false}
 };
}
