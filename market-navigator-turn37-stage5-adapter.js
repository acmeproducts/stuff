/* TURN37_STAGE5_NOW_CUTOVER */
(()=>{
const api=window.MNChartController37,baseAttach=api.attach,legacyV1=renderV1,legacyV2=renderV2;
let ctl=null,picker=null;const counts={total:0,byReason:{}};
function env(){return{root:null,windowIndex:'risk',series:[...IDX],timeHorizon:S.h,displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',representation:S.nowRepresentation||'indexed',activeSeries:null,componentsExpanded:false,acceptedNow:true}}
function v2(root=S.index){let comps=(S.def.indices[root]?.components||[]).map(x=>x.id),series=[root];if(S.componentsExpanded)series.push(...comps.filter(id=>!S.hiddenComponents.includes(id)));series.push(...S.nowComparisons.filter(id=>!series.includes(id)));return{root,windowIndex:root,series,timeHorizon:S.h,displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',representation:S.nowRepresentation||'indexed',activeSeries:S.nowActive||root,componentsExpanded:!!S.componentsExpanded,acceptedNow:true}}
function mirror(st){S.h=st.timeHorizon;S.indexDisplay=st.displayMode==='horizon'?'rebase':'fixed';S.nowRepresentation=st.representation||'indexed';if(st.root===null){S.level=1;S.index=null;S.componentsExpanded=false;S.hiddenComponents=[];S.nowComparisons=[];S.nowActive=null;S.nowFocus=null;return}S.level=2;S.index=st.root;S.componentsExpanded=!!st.componentsExpanded;let comps=(S.def.indices[st.root]?.components||[]).map(x=>x.id),set=new Set(st.series||[]);S.hiddenComponents=comps.filter(id=>!set.has(id));S.nowComparisons=(st.series||[]).filter(id=>id!==st.root&&!comps.includes(id));S.nowActive=st.activeSeries||st.root;S.nowFocus=S.nowActive}
api.attach=function(root,spec){
 if(!spec?.acceptedNow)return baseAttach(root,spec);
 let cur={...spec,series:[...(spec.series||[])]},resolved=null,dead=false,seq=0,inst;
 async function refresh(reason='render'){let n=++seq;resolved=await api.resolve(cur);if(dead||n!==seq)return inst;if(cur.root===null)resolved.active=null;mirror(cur);if(cur.root===null)legacyV1();else await legacyV2();bind();counts.total++;counts.byReason[reason]=(counts.byReason[reason]||0)+1;return inst}
 async function update(p={},reason='update'){cur={...cur,...p,series:[...(p.series||cur.series||[])]};return refresh(reason)}
 function adopt(p={},reason='adopt'){cur={...cur,...p,series:[...(p.series||cur.series||[])]};counts.total++;counts.byReason[reason]=(counts.byReason[reason]||0)+1}
 function bind(){
  document.querySelectorAll('#hzs [data-h]').forEach(b=>b.onclick=()=>update({timeHorizon:b.dataset.h},'horizon'));
  document.querySelectorAll('#legend [data-id]').forEach(b=>{let id=b.dataset.id;b.onclick=e=>{if(e.target.closest('[data-rm]')||b.disabled)return;if(cur.root===null){let c=(S.def.indices[id]?.components||[]).map(x=>x.id);update({root:id,windowIndex:id,series:[id,...c],activeSeries:id,componentsExpanded:true},'open-index')}else update({activeSeries:id},'active-series')}});
  document.querySelectorAll('#legend [data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();let id=x.dataset.rm,next=cur.series.filter(v=>v!==id);update({series:next,activeSeries:cur.activeSeries===id?cur.root:cur.activeSeries},'remove-series')});
  let add=$('nowAddSeries');if(add)add.onclick=()=>picker?.open();
  let rep=$('nowRepresentation');if(rep)rep.onchange=()=>update({representation:rep.value},'representation');
  let disp=$('nowIndexDisplay');if(disp)disp.onchange=()=>update({displayMode:disp.value==='rebase'?'horizon':'fixed'},'display');
  let ce=$('crumbEnvironment');if(ce)ce.onclick=()=>update(env(),'crumb-env');
  let ci=$('crumbIndex22');if(ci)ci.onclick=()=>{let comps=(S.def.indices[cur.root]?.components||[]).map(x=>x.id),cmp=cur.series.filter(x=>x!==cur.root&&!comps.includes(x));update({series:[cur.root,...cmp],activeSeries:cur.root,componentsExpanded:false},'crumb-index')};
  let c=$('nowChart');if(c){let down=c.onpointerdown,touch=c.ontouchstart;c.onpointerdown=e=>{down?.(e);if(S.nowActive)adopt({activeSeries:S.nowActive},'inspect-select')};c.ontouchstart=e=>{touch?.(e);if(S.nowActive)adopt({activeSeries:S.nowActive},'inspect-select')}}
 }
 inst={ready:null,update,adopt,getState:()=>({spec:{...cur,series:[...cur.series]},resolved:resolved?JSON.parse(JSON.stringify(resolved)):null,destroyed:dead}),getResolved:()=>resolved,resize:()=>scheduleGeometry25(),destroy:()=>{dead=true;seq++;resolved=null}};
 inst.ready=refresh('attach');return inst
};
function start(){
 if(ctl)return ctl;
 ctl=api.attach(document.querySelector('#view-now .chartCard'),{...(S.level===1?env():v2()),acceptedNow:true});
 picker=api.createBatchPicker($('nowPicker'),{getState:()=>ctl.getState().spec,onInfo:id=>showNowSeriesInfo25(id),apply:async(selected,next,active)=>ctl.update({series:next,activeSeries:active},'batch-add')});
 openNowPicker25=()=>picker.open();renderNowPicker25=()=>picker.render();
 renderV1=()=>ctl.update(env(),'render-v1');openV2=k=>{let c=(S.def.indices[k]?.components||[]).map(x=>x.id);return ctl.update({root:k,windowIndex:k,series:[k,...c],activeSeries:k,componentsExpanded:true},'open-index')};renderV2=()=>ctl.update(v2(),'render-v2');renderNow=()=>S.level===1?renderV1():renderV2();
 return ctl
}
const timer=setInterval(()=>{if(window.__mnShip25?.ready?.()){clearInterval(timer);start()}},20);
window.__mn37Stage5={controller:()=>ctl,state:()=>ctl?.getState()||null,counts:()=>JSON.parse(JSON.stringify(counts)),picker:()=>picker?.getState()||null,parity:async()=>{const live=ctl?.getState()?.resolved,shadow=await window.__mn37Shadow.resolveNow();return{equal:JSON.stringify(live)===JSON.stringify(shadow),live,shadow}},ready:()=>!!ctl};
})();