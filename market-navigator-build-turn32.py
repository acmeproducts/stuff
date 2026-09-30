#!/usr/bin/env python3
from pathlib import Path
SRC=Path('market-navigator-turn28-ship.html'); OUT=Path('market-navigator-turn32-pre-ship.html'); s=SRC.read_text()
def one(old,new,label):
 global s
 n=s.count(old)
 if n!=1: raise SystemExit(f'{label}: expected 1 match, got {n}')
 s=s.replace(old,new,1)
def rr(a,b,new,label):
 global s
 i=s.find(a); j=s.find(b,i)
 if i<0 or j<0: raise SystemExit(f'{label}: anchor missing')
 s=s[:i]+new+s[j:]
one('<div class="card chartCard">','<div class="card chartCard" id="chartSurface32" data-surface-instance="mn-chart-surface">','single physical chart surface id')
one('.standaloneAnalysis26{position:relative}', '.standaloneAnalysis26{position:relative;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;border-radius:8px}.modal:has(#standaloneAnalysis26){padding:8px;place-items:stretch}.analysisMount32{position:absolute;inset:0;min-width:0;min-height:0}.analysisMount32 #chartSurface32{height:100%;border-radius:8px}.analysisClose32{position:absolute;right:10px;top:8px;z-index:80;width:34px;height:34px;border:1px solid var(--line);background:#102338;border-radius:8px;color:var(--text);font-size:18px;font-weight:900}', 'full workspace host CSS')
shared=r'''/* TURN32_TRUE_SINGLE_SURFACE: exactly one physical chart surface is mounted in NOW or Analyze. */
function surfaceIds32(){return S.surfaceMode32==='analysis'?[...(S.nowVisible||[])]:[S.index,...(S.nowVisible||[]).filter(x=>x!==S.index)]}
function surfaceRoot32(){return S.surfaceMode32==='analysis'?S.surfaceRoot32:S.index}
function surfaceParent32(id){return IDX.includes(id)?id:(IDX.find(k=>(S.def.indices[k]?.components||[]).some(c=>c.id===id))||S.index||'growth')}
function surfaceSnapshot32(){return JSON.parse(JSON.stringify({level:S.level,index:S.index,h:S.h,componentsExpanded:S.componentsExpanded,nowVisible:S.nowVisible||[],nowActive:S.nowActive,nowFocus:S.nowFocus,nowRepresentation:S.nowRepresentation,indexDisplay:S.indexDisplay,nowState:S.nowState||null}))}
function surfaceRestore32(x){S.level=x.level;S.index=x.index;S.h=x.h;S.componentsExpanded=x.componentsExpanded;S.nowVisible=[...(x.nowVisible||[])];S.nowActive=x.nowActive;S.nowFocus=x.nowFocus;S.nowRepresentation=x.nowRepresentation;S.indexDisplay=x.indexDisplay;S.nowState=x.nowState}
function enforcePickerFamilies32(){if(S.surfaceMode32!=='analysis')return;let fam=[...new Set((S.nowVisible||[]).map(measurementFamily))];document.querySelectorAll('[data-add-now]').forEach(b=>{let id=b.dataset.addNow,nf=measurementFamily(id);if(!fam.includes(nf)&&fam.length>=2){b.disabled=true;b.setAttribute('aria-disabled','true');b.title='Maximum two measurement types in Analyze'}})}
async function openSurfacePicker32(){await openNowPicker25();enforcePickerFamilies32();let p=$('nowPicker');if(p){S.surfacePickerObserver32?.disconnect();S.surfacePickerObserver32=new MutationObserver(()=>enforcePickerFamilies32());S.surfacePickerObserver32.observe(p,{childList:true,subtree:true})}}
async function surfaceSets32(ids,w,h,root){let colors=chartColors(ids),sets=[];for(let id of ids){if(IDX.includes(id)){let x=S.derived.indices[id].horizons[h],curve=x?.curve||[],a=(S.indexDisplay||'fixed')==='rebase'?rebasePersistent28(curve):curve.map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));sets.push({id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color:colors[id],renderType:'line',a})}else{try{let src=await getSeries(id);sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:nativeIndexed(src,w)})}catch{sets.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',a:[]})}}}let available=sets.filter(z=>z.a.length),plan=axisPlan(available.map(z=>z.id));if(plan.kinds.length>2)throw new Error('THIRD_MEASUREMENT_FAMILY');let mode=plan.mode;sets.forEach(z=>{z.axis=mode==='dual'?(plan.map[z.id]||0):0;z.axisLabel=mode==='indexed'?'Indexed 100':(z.unit||z.label);z.a=z.a.map(q=>({...q,v:mode==='indexed'?(Number.isFinite(+q.idx)?+q.idx:+q.v):+q.raw}))});return{sets,mode,plan}}
function surfaceLegend32(sets,root){let el=$('legend');el.innerHTML=sets.map(z=>`<button class="lg ${z.id===S.nowActive?'active':''} ${z.a.length?'':'empty'}" data-surface-id="${esc(z.id)}" ${z.a.length?'':'disabled aria-disabled="true"'}>${legendSample(z)}${esc(z.label)}${z.id===root?'':`<span class="seriesX" data-surface-rm="${esc(z.id)}">×</span>`}</button>`).join('')+'<button class="btn" id="surfaceAdd32">+ Add</button>';el.querySelectorAll('[data-surface-id]').forEach(b=>{let id=b.dataset.surfaceId;wireLongPress25(b,id);b.onclick=e=>{if(e.target.closest('[data-surface-rm]')||b.disabled)return;S.nowActive=id;S.nowFocus=id;$('nowTip').style.display='none';renderV2()}});el.querySelectorAll('[data-surface-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();let id=x.dataset.surfaceRm;S.nowVisible=(S.nowVisible||[]).filter(v=>v!==id);if(S.nowActive===id){S.nowActive=root;S.nowFocus=root}renderV2()});$('surfaceAdd32').onclick=openSurfacePicker32}
async function renderChartSurface32(){let seq=++S.v2RenderSeq,root=surfaceRoot32(),h=S.h,ids=surfaceIds32(),parent=surfaceParent32(root),w=horizonWindow(h,parent),r=await surfaceSets32(ids,w,h,root);if(seq!==S.v2RenderSeq)return;if(!r.sets.some(z=>z.id===S.nowActive&&z.a.length)){let q=r.sets.find(z=>z.a.length);S.nowActive=q?q.id:root;S.nowFocus=S.nowActive}surfaceLegend32(r.sets,root);$('range').textContent=`${w.startLabel} → ${w.endLabel}`;$('nowTitle').textContent=displayLabel(root);if(S.surfaceMode32==='analysis'){let c=$('nowCrumb');if(c){c.textContent=displayLabel(root);c.title=IDX.includes(root)?(S.def.indices[root]?.name||displayLabel(root)):(name(root)||displayLabel(root))}}else renderCrumb();setNowFooter(w,r.mode,r.mode==='dual');if(S.surfaceMode32!=='analysis')captureNowState(r.sets,w,r.mode);S.nowPaintModel={sets:r.sets,w:{...w},mode:r.mode};draw('now',r.sets,w,r.mode);S.surfaceLast32={root,ids:[...ids],mode:r.mode,plan:r.plan,node:$('chartSurface32')}}
'''
insert=s.find('async function openV2(')
if insert<0: raise SystemExit('shared surface insertion anchor missing')
s=s[:insert]+shared+s[insert:]
rr('async function renderV2(){','function componentCard','async function renderV2(){return renderChartSurface32()}\n','replace NOW renderer with one surface renderer')
openclose=r'''async function openStandaloneAnalysis26(id){
 if(S.surfaceMode32==='analysis')return;S.surfaceFrozen32=surfaceSnapshot32();S.surfaceMode32='analysis';S.surfaceRoot32=id;S.analysisRoot=id;S.analysisChartState=null;
 let modal=$('standaloneAnalysis26'),old=Array.from(modal.children);old.forEach(n=>n.classList.add('hidden'));let mount=document.createElement('div');mount.id='analysisMount32';mount.className='analysisMount32';let close=document.createElement('button');close.id='analysisClose32';close.className='analysisClose32';close.type='button';close.setAttribute('aria-label','Close analysis');close.textContent='×';modal.append(mount,close);
 let surface=$('chartSurface32');S.surfaceHome32={parent:surface.parentNode,next:surface.nextSibling,node:surface};mount.appendChild(surface);modal.classList.remove('hidden');S.level=2;S.index=surfaceParent32(id);S.componentsExpanded=true;S.nowVisible=[id];S.nowActive=id;S.nowFocus=id;S.nowRepresentation=null;S.h=S.surfaceFrozen32.h;close.onclick=closeStandaloneAnalysis26;await renderV2()
}
async function closeStandaloneAnalysis26(){
 if(S.surfaceMode32!=='analysis')return;let modal=$('standaloneAnalysis26'),home=S.surfaceHome32,surface=$('chartSurface32');S.surfacePickerObserver32?.disconnect();S.surfacePickerObserver32=null;if(home?.next&&home.next.parentNode===home.parent)home.parent.insertBefore(surface,home.next);else home?.parent?.appendChild(surface);modal.querySelector('#analysisMount32')?.remove();modal.querySelector('#analysisClose32')?.remove();Array.from(modal.children).forEach(n=>n.classList.remove('hidden'));modal.classList.add('hidden');let frozen=S.surfaceFrozen32;S.surfaceMode32=null;S.surfaceRoot32=null;S.surfaceHome32=null;S.surfaceFrozen32=null;if(frozen)surfaceRestore32(frozen);await renderV2()
}
'''
rr('async function openStandaloneAnalysis26(id){','function analysisWindow26(',openclose+'function analysisWindow26(', 'replace Analyze open/close with physical mount')
s=s.replace('async function renderStandaloneAnalysis26(){','async function retiredStandaloneAnalysis26(){',1)
s=s.replace('Market Navigator · Turn 28 Corrective Candidate','Market Navigator · Turn 32 True Single Surface Candidate')
one('</body>','<div id="turn32Marker" class="hidden" data-source-blob="544661884a412c57aac08fada4f961012a4bc496" data-contract="physical-single-chart-surface"></div></body>','Turn 32 marker')
OUT.write_text(s); print('PASS built',OUT,OUT.stat().st_size)
