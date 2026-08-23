/* TURN01 R2 project action fix — visible, immediate Step 1 interactions. */
const TURN01_R2_UIFIX='2026.08.23.turn01-r2-project-actions';

function t1r2Busy(label){
  const f=$('#forwardBtn');if(f){f.disabled=true;f.textContent=label||'Working…'}
  const g=$('#gateText');if(g)g.textContent=label||'Working…';
}

wireProjectList=function(){
  const q=($('#projectSearch')?.value||'').toLowerCase();
  const rows=state.projects.filter(p=>!q||[p.project_name,p.notes].join(' ').toLowerCase().includes(q));
  const list=$('#projectList');if(!list)return;
  list.innerHTML=rows.map(p=>`<div class="row projectRow" data-token="${esc(p.project_token)}"><b>${esc(p.project_name)}</b><div class="muted">${esc(p.status)} · ${esc(p.current_stage)}</div></div>`).join('')||'<div class="row muted">No matching projects.</div>';
  $$('.projectRow').forEach(r=>r.onclick=async()=>{
    try{
      t1r2Busy('Opening project…');
      $$('.projectRow').forEach(x=>x.style.background='');r.style.background='#eef2f6';
      state.token=r.dataset.token;
      await loadSnap();
      render();
    }catch(e){toast(e.message);configureFooter()}
  });
};

async function t1r2ForwardFixed(){
  try{
    const s=step();
    t1r2Busy(s===1?(state.token?'Saving project…':'Creating project…'):'Working…');
    if(s===1)await saveStep1();
    if(s===2)await saveSources();
    state.snap=await api('/turn01/workflow/'+encodeURIComponent(state.token)+'/forward',{method:'POST',body:'{}'});
    render();
  }catch(e){toast(e.message);render()}
}

$('#forwardBtn').onclick=t1r2ForwardFixed;
setTimeout(()=>{if($('#projectList'))wireProjectList();const n=$('#projectName');if(n)n.oninput=configureFooter;},0);
