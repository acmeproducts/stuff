#!/usr/bin/env python3
from pathlib import Path
SRC=Path('market-navigator-turn28-ship.html'); OUT=Path('market-navigator-turn31-pre-ship.html'); s=SRC.read_text()
def replace_range(start,end,new,label):
 global s
 a=s.find(start); b=s.find(end,a)
 if a<0 or b<0: raise SystemExit(f'{label}: anchor missing')
 s=s[:a]+new+s[b:]
shared=r'''async function chartSurface31(cfg){
 let {host,ids,h,root,active,indexDisplay='fixed'}=cfg,w=horizonWindow(h,IDX.includes(root)?root:(S.index||'risk')),colors=chartColors(ids),sets=[];
 for(let id of ids){if(IDX.includes(id)){let x=S.derived.indices[id].horizons[h],curve=x?.curve||[],a=indexDisplay==='rebase'?rebasePersistent28(curve):curve.map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));sets.push({id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color:colors[id],renderType:'line',a})}else{try{let src=await getSeries(id);sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:nativeIndexed(src,w)})}catch{sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:[]})}}}
 let available=sets.filter(z=>z.a.length),plan=axisPlan(available.map(z=>z.id)),mode=plan.mode;
 sets.forEach(z=>{z.axis=mode==='dual'?(plan.map[z.id]||0):0;z.axisLabel=mode==='indexed'?'Indexed 100':(z.unit||z.label);z.a=z.a.map(q=>({...q,v:mode==='indexed'?(Number.isFinite(+q.idx)?+q.idx:+q.v):+q.raw}))});
 if(host==='now'){S.nowActive=sets.some(z=>z.id===active&&z.a.length)?active:(available[0]?.id||root);S.nowFocus=S.nowActive;captureNowState(sets,w,mode);S.nowPaint25={sets,w,mode};draw('now',sets,w,mode)}else{S.analysisActive=sets.some(z=>z.id===active&&z.a.length)?active:(available[0]?.id||root);S.analysisFocus=S.analysisActive;let state={lineage:'STANDALONE / '+displayLabel(root),root,active:S.analysisActive,series:[...ids],horizon:h,index:IDX.includes(root)?root:null,evidence:ids.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,sets,w,mode,'shared-chart-surface');S.analysisChartState=mnxShipState(JSON.parse(JSON.stringify(state)));S.analysisSets26=sets;S.analysisWindow26=w;draw('analysis',sets,w,mode)}
 return{sets,w,mode,plan}
}
function chartSurfaceLegend31(host,sets,root){let el=host==='now'?$('legend'):$('seriesBar');el.innerHTML=sets.map(z=>`<button class="${host==='now'?'lg':'chip'} ${z.id===(host==='now'?S.nowActive:S.analysisActive)?(host==='now'?'active':'on'):''} ${z.a.length?'':'empty'}" data-surface-id="${esc(z.id)}" ${z.a.length?'':'disabled aria-disabled="true"'}>${legendSample(z)}${esc(z.label)}${z.id===root?'':`<span class="seriesX" data-surface-rm="${esc(z.id)}">×</span>`}</button>`).join('')+'<button class="btn" data-surface-add>+ Add</button>';return el}
'''
insert=s.find('async function openV2(')
if insert<0: raise SystemExit('shared insertion anchor missing')
s=s[:insert]+shared+s[insert:]
new_v2=r'''async function renderV2(){let seq=++S.v2RenderSeq,k=S.index,ids=visibleIds25(),result=await chartSurface31({host:'now',ids,h:S.h,root:k,active:S.nowActive,indexDisplay:S.indexDisplay||'fixed'});if(seq!==S.v2RenderSeq)return;$('nowTitle').textContent=AB[k];renderCrumb();$('range').textContent=`${result.w.startLabel} → ${result.w.endLabel}`;let el=chartSurfaceLegend31('now',result.sets,k);el.querySelectorAll('[data-surface-id]').forEach(b=>{let id=b.dataset.surfaceId;wireLongPress25(b,id);b.onclick=e=>{if(e.target.closest('[data-surface-rm]')||b.disabled)return;S.nowActive=id;S.nowFocus=id;$('nowTip').style.display='none';renderV2()}});el.querySelectorAll('[data-surface-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();removeNowSeries25(x.dataset.surfaceRm)});el.querySelector('[data-surface-add]').onclick=openNowPicker25;setNowFooter(result.w,result.mode,result.mode==='dual')}'''
replace_range('async function renderV2(){','function componentCard',new_v2,'renderV2')
# Remove the old standalone data-preparation engine completely.
replace_range('async function sourceSetStandalone26','function renderAnalysisHz26','', 'duplicate standalone series engine')
new_analysis=r'''async function renderStandaloneAnalysis26(){let seq=++S.analysisRenderSeq,h=S.analysisH26||S.h,ids=[...S.analysisSeries],result=await chartSurface31({host:'analysis',ids,h,root:S.analysisRoot,active:S.analysisActive,indexDisplay:S.indexDisplay||'fixed'});if(seq!==S.analysisRenderSeq)return;let crumb=$('standaloneAnalysisTitle26');crumb.textContent=displayLabel(S.analysisRoot);crumb.title=(IDX.includes(S.analysisRoot)?S.def.indices[S.analysisRoot]?.name:name(S.analysisRoot))||displayLabel(S.analysisRoot);crumb.setAttribute('aria-label','Analysis root '+displayLabel(S.analysisRoot));renderAnalysisHz26();let el=chartSurfaceLegend31('analysis',result.sets,S.analysisRoot);el.querySelectorAll('[data-surface-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-surface-rm]'))return;S.analysisActive=b.dataset.surfaceId;S.analysisFocus=S.analysisActive;renderStandaloneAnalysis26()});el.querySelectorAll('[data-surface-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();let id=x.dataset.surfaceRm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisActive===id){S.analysisActive=S.analysisRoot;S.analysisFocus=S.analysisRoot}renderStandaloneAnalysis26()});el.querySelector('[data-surface-add]').onclick=openAnalysisPicker26;$('analysisMeta26').innerHTML=`<span>${result.mode==='dual'?'Y1 + Y2 native units':result.mode==='native'?'Native units':'Indexed 100'}</span><span class="footerSep">|</span><span>${esc(result.w.startLabel)} → ${esc(result.w.endLabel)}</span>`}'''
replace_range('async function renderStandaloneAnalysis26(){','async function openAnalysisPicker26()',new_analysis,'standalone analysis')
s=s.replace('Market Navigator · Turn 28 Corrective Candidate','Market Navigator · Turn 31 Shared Chart Surface Candidate')
s=s.replace('</script>','\n/* TURN31_SHARED_CHART_SURFACE: NOW and Analyze call chartSurface31; no standalone chart preparation engine. */\n</script>',1)
OUT.write_text(s); print(OUT)
