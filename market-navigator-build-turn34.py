#!/usr/bin/env python3
from pathlib import Path
SRC=Path('market-navigator-turn28-ship.html'); OUT=Path('market-navigator-turn34-pre-ship.html'); s=SRC.read_text()
def rr(a,b,new,label):
 global s
 i=s.find(a); j=s.find(b,i)
 if i<0 or j<0: raise SystemExit(f'{label}: anchor missing')
 s=s[:i]+new+s[j:]
def one(a,b,label):
 global s
 n=s.count(a)
 if n!=1: raise SystemExit(f'{label}: expected 1 got {n}')
 s=s.replace(a,b,1)
module=r'''/* TURN34_ONE_CALLABLE_CHART_CONTROLLER */
const MNChart34={
 async prepare({root,series,horizon,display='fixed',active}){
  let parent=IDX.includes(root)?root:(IDX.find(k=>(S.def.indices[k]?.components||[]).some(c=>c.id===root))||S.index||'risk');
  let w=horizonWindow(horizon,parent),colors=chartColors(series),sets=[];
  for(let id of series){
   if(IDX.includes(id)){
    let x=S.derived.indices[id].horizons[horizon],curve=x?.curve||[];
    let a=display==='rebase'?rebasePersistent28(curve):curve.map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));
    sets.push({id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color:colors[id],renderType:'line',a});
   }else{
    try{let src=await getSeries(id);sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:nativeIndexed(src,w)})}
    catch{sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:[]})}
   }
  }
  let available=sets.filter(z=>z.a.length),plan=axisPlan(available.map(z=>z.id)),mode=plan.mode;
  if(display==='fixed'&&IDX.includes(root)&&sets.length>1){mode='dual';sets.forEach(z=>{z.axis=z.id===root?0:1;z.axisLabel=z.id===root?'Persistent Index':'Indexed 100';if(z.id!==root)z.a=z.a.map(q=>({...q,v:Number.isFinite(+q.idx)?+q.idx:+q.v}))})}
  else sets.forEach(z=>{z.axis=mode==='dual'?(plan.map[z.id]||0):0;z.axisLabel=mode==='indexed'?'Indexed 100':(z.unit||z.label);z.a=z.a.map(q=>({...q,v:mode==='indexed'?(Number.isFinite(+q.idx)?+q.idx:+q.v):+q.raw}))});
  let chosen=sets.some(z=>z.id===active&&z.a.length)?active:(available[0]?.id||root);
  return{root,series:[...series],horizon,display,active:chosen,w,sets,mode,plan};
 },
 async open(cfg){
  let r=await this.prepare(cfg),target=cfg.target;
  if(target==='now'){
   S.nowActive=r.active;S.nowFocus=r.active;captureNowState(r.sets,r.w,r.mode);S.nowPaint25={sets:r.sets,w:r.w,mode:r.mode};draw('now',r.sets,r.w,r.mode);
  }else if(target==='analysis'){
   S.analysisActive=r.active;S.analysisFocus=r.active;let state={lineage:'STANDALONE / '+displayLabel(r.root),root:r.root,active:r.active,series:[...r.series],horizon:r.horizon,index:IDX.includes(r.root)?r.root:null,evidence:r.series.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,r.sets,r.w,r.mode,'MNChart34');S.analysisChartState=mnxShipState(JSON.parse(JSON.stringify(state)));S.analysisSets26=r.sets;S.analysisWindow26=r.w;draw('analysis',r.sets,{...r.w,horizon:r.horizon},r.mode);
  }else throw new Error('MNChart34 target');
  return r;
 }
};
window.MNChart34=MNChart34;
'''
insert=s.find('async function openV2(')
if insert<0: raise SystemExit('module insertion anchor missing')
s=s[:insert]+module+s[insert:]
new_v2=r'''async function renderV2(){let seq=++S.v2RenderSeq,k=S.index,ids=visibleIds25(),r=await MNChart34.open({target:'now',root:k,series:ids,horizon:S.h,display:S.indexDisplay||'fixed',active:S.nowActive});if(seq!==S.v2RenderSeq)return;$('nowTitle').textContent=AB[k];renderCrumb();$('range').textContent=`${r.w.startLabel} → ${r.w.endLabel}`;let el=$('legend');el.innerHTML=r.sets.map(z=>`<button class="lg ${z.id===S.nowActive?'active':''} ${z.a.length?'':'empty'}" data-id="${esc(z.id)}" ${z.a.length?'':'disabled aria-disabled="true"'}>${legendSample(z)}${esc(z.label)}${z.id===k?'':`<span class="seriesX" data-rm="${esc(z.id)}">×</span>`}</button>`).join('')+'<button class="btn" id="nowAddSeries">+ Add</button>';wireLegend19(el,(id,e)=>{if(e.target.closest('[data-rm]'))return;S.nowActive=id;S.nowFocus=id;$('nowTip').style.display='none';renderV2()});el.querySelectorAll('[data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();removeNowSeries25(x.dataset.rm)});$('nowAddSeries').onclick=openNowPicker25;setNowFooter(r.w,r.mode,r.mode==='dual')}'''
rr('async function renderV2(){','function componentCard',new_v2,'NOW controller call')
# Retire the duplicate standalone preparation engine; Analyze uses MNChart34.prepare/open.
rr('async function sourceSetStandalone26','function renderAnalysisHz26','', 'remove standalone preparation engine')
new_analysis=r'''async function renderStandaloneAnalysis26(){let seq=++S.analysisRenderSeq,h=S.analysisH26||S.h,display=S.analysisDisplay34||'fixed',r=await MNChart34.open({target:'analysis',root:S.analysisRoot,series:[...S.analysisSeries],horizon:h,display,active:S.analysisActive});if(seq!==S.analysisRenderSeq)return;let crumb=$('standaloneAnalysisTitle26');crumb.textContent=displayLabel(S.analysisRoot);crumb.title=(IDX.includes(S.analysisRoot)?S.def.indices[S.analysisRoot]?.name:name(S.analysisRoot))||displayLabel(S.analysisRoot);crumb.setAttribute('aria-label','Analysis root '+displayLabel(S.analysisRoot));renderAnalysisHz26();let el=$('seriesBar');el.innerHTML=r.sets.map(z=>`<button class="chip ${z.id===S.analysisActive?'on':''} ${z.a.length?'':'empty'}" data-analysis-id="${esc(z.id)}" ${z.a.length?'':'disabled aria-disabled="true"'}>${legendSample(z)}${esc(z.label)}${z.id===S.analysisRoot?'':`<span class="seriesX" data-analysis-rm="${esc(z.id)}">×</span>`}</button>`).join('')+'<button class="btn" id="analysisAdd26">+ Add</button>';el.querySelectorAll('[data-analysis-id]').forEach(b=>{wireLongPress25(b,b.dataset.analysisId);b.onclick=e=>{if(e.target.closest('[data-analysis-rm]')||b.disabled)return;S.analysisActive=b.dataset.analysisId;S.analysisFocus=S.analysisActive;renderStandaloneAnalysis26()}});el.querySelectorAll('[data-analysis-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();let id=x.dataset.analysisRm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisActive===id){S.analysisActive=S.analysisRoot;S.analysisFocus=S.analysisRoot}renderStandaloneAnalysis26()});$('analysisAdd26').onclick=openAnalysisPicker26;$('analysisMeta26').innerHTML=`<span>MNChart34</span><span class="footerSep">|</span><span>${esc(r.w.startLabel)} → ${esc(r.w.endLabel)}</span><span class="footerSep">|</span><select id="analysisDisplay34" aria-label="Index display mode"><option value="fixed" ${display==='fixed'?'selected':''}>Fixed</option><option value="rebase" ${display==='rebase'?'selected':''}>Horizon</option></select><span class="footerSep">|</span><span>${r.mode==='dual'?'Y1 + Y2':r.mode==='native'?'Native':'Indexed 100'}</span>`;$('analysisDisplay34').onchange=()=>{S.analysisDisplay34=$('analysisDisplay34').value;renderStandaloneAnalysis26()}}'''
rr('async function renderStandaloneAnalysis26(){','async function openAnalysisPicker26()',new_analysis,'Analyze controller call')
# Analyze display is independent from NOW; initialize only when opening a new modal.
one("S.analysisRoot=id;S.analysisSeries=[id];S.analysisActive=id;S.analysisFocus=id;S.analysisH26=S.h;", "S.analysisRoot=id;S.analysisSeries=[id];S.analysisActive=id;S.analysisFocus=id;S.analysisH26=S.h;S.analysisDisplay34=S.indexDisplay||'fixed';", 'analysis local display init')
s=s.replace('Market Navigator · Turn 28 Corrective Candidate','Market Navigator · Turn 34 One Chart Controller Candidate')
one('</body>','<div id="turn34Marker" class="hidden" data-contract="MNChart34-one-callable-controller"></div></body>','marker')
OUT.write_text(s);print('PASS Turn34 rebuilt from accepted Turn28',OUT.stat().st_size)
