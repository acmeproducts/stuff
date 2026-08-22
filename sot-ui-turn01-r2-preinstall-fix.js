/* TURN01 R2 pre-install UI correction: step 1 can create a new project before a token exists. */
const t1r2ConfigureFooterBase=configureFooter;
configureFooter=function(){
  const s=step();
  if(s!==1)return t1r2ConfigureFooterBase();
  $('#backBtn').style.visibility='hidden';
  $('#backBtn').disabled=true;
  $('#forwardBtn').textContent='Choose Sources →';
  const name=String($('#projectName')?.value||state.snap?.project?.project_name||'').trim();
  const complete=!!state.snap?.workflow?.completed_at;
  $('#forwardBtn').disabled=!name||complete;
  $('#gateText').textContent=name?'Ready to continue':'Enter a project name.';
};
const t1r2RenderProjectBase=renderProject;
renderProject=function(){
  t1r2RenderProjectBase();
  const n=$('#projectName');
  if(n)n.oninput=configureFooter;
  configureFooter();
};
