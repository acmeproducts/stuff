#!/usr/bin/env python3
from pathlib import Path
import hashlib
SRC=Path('market-navigator-turn28-ship.html'); OUT=Path('market-navigator-turn30-pre-ship.html')
def blob(b): return hashlib.sha1(f'blob {len(b)}\0'.encode()+b).hexdigest()
def rep(s,a,b,label):
 n=s.count(a)
 if n!=1: raise SystemExit(f'{label}: expected 1 match, got {n}')
 return s.replace(a,b,1)
s=SRC.read_text()
# Full workspace modal: retain modal context/X but remove legacy 1180x800 cap.
s=rep(s,'.standaloneAnalysis26{position:relative}', '.standaloneAnalysis26{position:relative;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border-radius:8px}.modal:has(#standaloneAnalysis26){padding:8px;place-items:stretch}', 'full-size analysis CSS')
old="""async function sourceSetStandalone26(id,w,color,h){
  if(IDX.includes(id)){let x=S.derived.indices[id].horizons[h];return{id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color,renderType:'line',a:(x?.curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}))}}
  try{let src=await getSeries(id),a=indexed(src,w,1);return{id,label:label(id),full:name(id),unit:unit(id),color,renderType:'line',a}}catch{return{id,label:label(id),full:name(id),unit:unit(id),color,renderType:'line',a:[]}}
}"""
new="""async function sourceSetStandalone30(id,w,color,h,mode='indexed',axis=0){
  if(IDX.includes(id)){let x=S.derived.indices[id].horizons[h],a=(x?.curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));return{id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color,renderType:'line',axis,axisLabel:'Index',a}}
  try{let src=await getSeries(id),a=mode==='indexed'?indexed(src,w,1):nativeIndexed(src,w);return{id,label:label(id),full:name(id),unit:unit(id),color,renderType:'line',axis,axisLabel:unitKind(id)==='percent'?'Percent':unit(id),a}}catch{return{id,label:label(id),full:name(id),unit:unit(id),color,renderType:'line',axis,axisLabel:unit(id),a:[]}}
}"""
s=rep(s,old,new,'standalone source builder')
start=s.index('async function renderStandaloneAnalysis26(){'); end=s.index('\nasync function openAnalysisPicker26()',start)
newrender="""async function renderStandaloneAnalysis26(){
  let seq=++S.analysisRenderSeq,h=S.analysisH26||S.h,w=analysisWindow26(h),ids=[...S.analysisSeries],colors=chartColors(ids),plan=axisPlan(ids),mode=plan.mode;
  if(plan.kinds.length>2){S.analysisSeries=S.analysisSeries.slice(0,-1);alert('Analysis supports a maximum of two measurement types. Remove a series before adding a third type.');return renderStandaloneAnalysis26()}
  let sets=[];for(let id of ids)sets.push(await sourceSetStandalone30(id,w,colors[id],h,mode,plan.map[id]||0));if(seq!==S.analysisRenderSeq)return;
  S.analysisSets26=sets;S.analysisWindow26=w;if(!sets.some(z=>z.id===S.analysisActive&&z.a.length)){let q=sets.find(z=>z.a.length);S.analysisActive=q?q.id:S.analysisRoot;S.analysisFocus=S.analysisActive}
  let crumb=$('standaloneAnalysisTitle26');crumb.textContent=displayLabel(S.analysisRoot);crumb.title=(IDX.includes(S.analysisRoot)?S.def.indices[S.analysisRoot]?.name:name(S.analysisRoot))||displayLabel(S.analysisRoot);crumb.setAttribute('aria-label','Analysis root '+displayLabel(S.analysisRoot));renderAnalysisHz26();
  $('seriesBar').innerHTML=sets.map(z=>`<button class=\"chip ${z.id===S.analysisActive?'on':''} ${z.a.length?'':'empty'}\" data-analysis-id=\"${esc(z.id)}\" title=\"${esc(z.label)} · Y${(z.axis||0)+1}\">${legendSample(z)}${esc(z.label)} <span class=\"axisBadge\">Y${(z.axis||0)+1}</span>${z.id===S.analysisRoot?'':`<span class=\"seriesX\" data-analysis-rm=\"${esc(z.id)}\">×</span>`}</button>`).join('')+'<button class=\"btn\" id=\"analysisAdd26\">+ Add</button>';
  $('seriesBar').querySelectorAll('[data-analysis-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-analysis-rm]'))return;S.analysisActive=b.dataset.analysisId;S.analysisFocus=S.analysisActive;renderStandaloneAnalysis26()});$('seriesBar').querySelectorAll('[data-analysis-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();let id=x.dataset.analysisRm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisActive===id){S.analysisActive=S.analysisRoot;S.analysisFocus=S.analysisRoot}renderStandaloneAnalysis26()});$('analysisAdd26').onclick=openAnalysisPicker26;
  let state={lineage:'STANDALONE / '+displayLabel(S.analysisRoot),root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:h,index:IDX.includes(S.analysisRoot)?S.analysisRoot:null,evidence:S.analysisSeries.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,sets,w,mode,'standalone-analysis');S.analysisChartState=mnxShipState(JSON.parse(JSON.stringify(state)));
  $('analysisMeta26').innerHTML=`<span>${mode==='dual'?'Y1 + Y2 native units':'Y1 native units'} · ${esc(displayLabel(S.analysisActive))}</span><span class=\"footerSep\">|</span><span>${esc(w.startLabel)} → ${esc(w.endLabel)}</span>`;draw('analysis',sets,{...w,horizon:h},mode)
}"""
s=s[:start]+newrender+s[end:]
# Picker disables candidates that would create a third measurement family.
needle="let ok={};for(let id of ids)ok[id]=IDX.includes(id)?true:await seriesAvailable(id,S.analysisH26||S.h,S.index||'risk');"
replacement="let existingFamilies=[...new Set(S.analysisSeries.map(measurementFamily))],ok={};for(let id of ids){let family=measurementFamily(id),familyOK=existingFamilies.includes(family)||existingFamilies.length<2;ok[id]=familyOK&&(IDX.includes(id)?true:await seriesAvailable(id,S.analysisH26||S.h,S.index||'risk'))}"
s=rep(s,needle,replacement,'picker two-family gate')
s=s.replace('Market Navigator · Turn 28 Corrective Candidate','Market Navigator · Turn 30 Component Analysis Candidate')
s=rep(s,'</body>','<div id="turn30AnalysisMarker" class="hidden" data-build="turn30-fullsize-dual-axis"></div></body>','marker')
OUT.write_text(s)
print('built',OUT,OUT.stat().st_size)
