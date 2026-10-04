/* TURN37_STAGE3_ANALYZE_ADAPTER */
let mn37AnalysisController=null;
function mn37AnalysisState(){
  if(!mn37AnalysisController)return null;
  const st=mn37AnalysisController.getState(),r=mn37AnalysisController.getResolved();if(!r)return null;
  const state={lineage:'STANDALONE / '+displayLabel(st.root),root:st.root,active:st.activeSeries,series:[...st.series],horizon:st.timeHorizon,index:IDX.includes(st.root)?st.root:null,evidence:st.series.map(evidenceFor)};
  state.chart=chartSnapshotFromSets(state,r.sets,r.window,r.mode,'standalone-analysis');
  return mnxShipState(state);
}
function mn37MirrorAnalysis(r,inst){
  const st=inst.getState();
  S.analysisRoot=st.root;S.analysisSeries=[...st.series];S.analysisActive=st.activeSeries;S.analysisFocus=st.activeSeries;S.analysisH26=st.timeHorizon;
  S.analysisSets26=r.sets;S.analysisWindow26=r.window;
  const snap=mn37AnalysisState();if(snap)S.analysisChartState=JSON.parse(JSON.stringify(snap));
}
function mn37AnalysisMenu(surface){
  let m=surface.querySelector('#mn37AnalysisMenu');if(m)return m;
  m=document.createElement('div');m.id='mn37AnalysisMenu';m.className='nowMoreMenu hidden';
  m.innerHTML='<button data-a="ai" class="aiAction">AI POV</button><button data-a="data">Data</button><button data-a="print">Print</button><button data-a="md">Download Markdown</button><button data-a="csv">Download CSV</button><button data-a="json">Download JSON</button>';
  surface.appendChild(m);
  m.querySelectorAll('[data-a]').forEach(b=>b.onclick=async()=>{m.classList.add('hidden');const st=mn37AnalysisState();if(!st)return;const a=b.dataset.a;if(a==='ai'){closeStandaloneAnalysis26();await startAI(st)}else if(a==='data')await openData17(st);else if(a==='print')await analysisPrintStandalone26();else if(a==='md')downloadState(st,'market-navigator-standalone-analysis','md');else if(a==='csv')downloadState(st,'market-navigator-standalone-analysis','csv');else if(a==='json')downloadState(st,'market-navigator-standalone-analysis','json')});
  return m;
}
function mn37EnsureAnalysisSurface(){
  const modal=$('standaloneAnalysis26');let surface=modal.querySelector('#mn37AnalysisSurface');if(surface)return surface;
  modal.replaceChildren();
  surface=document.querySelector('#view-now .chartCard').cloneNode(true);surface.id='mn37AnalysisSurface';surface.classList.add('modalCard','analysis');
  const ids={nowChrome:'analysisChrome37',nowCrumb:'standaloneAnalysisTitle26',hzs:'analysisHz',legend:'seriesBar',nowWrap:'analysisWrap',nowChart:'analysisChart',indexInfoBtn:'analysisInfoBtn37',nowTip:'analysisTip',nowMeta:'analysisMeta26',nowMoreBtn:'analysisMore26'};
  for(const [from,to] of Object.entries(ids)){const e=surface.querySelector('#'+from);if(e)e.id=to}
  const close=document.createElement('button');close.id='mn37AnalysisClose';close.className='btn mn37AnalysisClose';close.setAttribute('aria-label','Close analysis');close.textContent='×';close.style.position='static';close.onclick=()=>closeStandaloneAnalysis26();(surface.querySelector('.chromeRight')||surface).appendChild(close);
  mn37AnalysisMenu(surface);modal.appendChild(surface);return surface;
}
function mn37ParkAnalysis(park){
  const modal=$('standaloneAnalysis26');if(!modal||modal.classList.contains('hidden'))return;
  modal.classList.toggle('mn37Parked',!!park);
}
const mn37LegacyNav=nav;
nav=function(v){if(v!=='now')mn37ParkAnalysis(true);mn37LegacyNav(v);if(v==='now')mn37ParkAnalysis(false)};
standaloneAnalysisState26=function(){return mn37AnalysisState()||mnxShipState({})};
openStandaloneAnalysis26=async function(id){
  if(mn37AnalysisController){mn37AnalysisController.destroy();mn37AnalysisController=null}
  const modal=$('standaloneAnalysis26'),surface=mn37EnsureAnalysisSurface();
  modal.classList.remove('hidden','mn37Parked');$('nowSeriesAbout').classList.add('hidden');
  S.analysisRoot=id;S.analysisSeries=[id];S.analysisActive=id;S.analysisFocus=id;S.analysisH26=S.h;S.analysisChartState=null;
  mn37AnalysisController=MNChartController37.attach(surface,{
    root:id,windowIndex:IDX.includes(id)?id:(S.index||'risk'),series:[id],timeHorizon:S.h,displayMode:'fixed',representation:'indexed',activeSeries:id
  },{
    roles:{title:'#standaloneAnalysisTitle26',horizons:'#analysisHz',legend:'#seriesBar',footer:'#analysisMeta26',more:'#analysisMore26'},
    title:displayLabel(id),showAdd:true,
    paint:async(r,inst)=>{mn37MirrorAnalysis(r,inst);draw('analysis',r.sets,{...r.window,horizon:inst.getState().timeHorizon},r.mode)},
    onStateChange:(st,r,reason,inst)=>{if(r)mn37MirrorAnalysis(r,inst)},
    onRendererActive:(active,focus,inst)=>{S.analysisActive=active;if(focus)S.analysisFocus=active},
    onMore:()=>mn37AnalysisMenu(surface).classList.toggle('hidden'),
    onDestroy:()=>{mn37AnalysisMenu(surface).classList.add('hidden')}
  });
  window.__mn37AnalysisController=mn37AnalysisController;
  await mn37AnalysisController.ready;
  return mn37AnalysisController;
};
closeStandaloneAnalysis26=function(){
  const modal=$('standaloneAnalysis26');modal.classList.remove('mn37Parked');modal.classList.add('hidden');
  if(mn37AnalysisController){mn37AnalysisController.destroy();mn37AnalysisController=null}
  window.__mn37AnalysisController=null;S.analysisChartState=null;S.analysisSets26=null;S.analysisWindow26=null;S.analysisH26=null;
};
renderStandaloneAnalysis26=async function(){
  if(!mn37AnalysisController)return;
  await mn37AnalysisController.update({root:S.analysisRoot,windowIndex:IDX.includes(S.analysisRoot)?S.analysisRoot:(S.index||'risk'),series:[...S.analysisSeries],timeHorizon:S.analysisH26||S.h,activeSeries:S.analysisActive},'legacy-adapter-update');
};
window.__mn37Stage3={
  open:id=>openStandaloneAnalysis26(id),close:()=>closeStandaloneAnalysis26(),
  state:()=>mn37AnalysisController?.getState()||null,
  resolved:()=>mn37AnalysisController?.getResolved()||null,
  parked:()=>$('standaloneAnalysis26').classList.contains('mn37Parked')
};

window.__mn37Stage4={
  open:id=>openStandaloneAnalysis26(id),close:()=>closeStandaloneAnalysis26(),
  state:()=>mn37AnalysisController?.getState()||null,
  resolved:()=>mn37AnalysisController?.getResolved()||null,
  picker:()=>mn37AnalysisController?.getPickerState?.()||null,
  pickerModel:()=>mn37AnalysisController?.getPickerModel?.()||null,
  parked:()=>$('standaloneAnalysis26').classList.contains('mn37Parked')
};
