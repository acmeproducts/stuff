'use strict';
// No live data access: attribution uses only frozen endpoints and model rules.
module.exports=function mnxFrozenBlock(k,state,manifest){
 const series=state?.chart?.series?.find(s=>s.id===k),points=(series?.points||[]).filter(p=>!p.held),first=points[0],last=points.at(-1);
 if(!first||!last||!Number.isFinite(first.raw)||!Number.isFinite(last.raw)||manifest.components.length!==7)return null;
 const date=t=>new Date(t).toISOString().slice(0,10),a=first.nativeInputs||first.baselineInputs,b=last.nativeInputs||last.baselineInputs;
 if(!a||!b)return null;
 const components=[];
 for(const rule of manifest.components){
  const p=a[rule.id],q=b[rule.id],scale=rule.transformScale;
  if(!p||!q||!Number.isFinite(p.t)||!Number.isFinite(q.t)||!Number.isFinite(p.v)||!Number.isFinite(q.v)||!Number.isFinite(scale)||scale<=0||![-1,1].includes(rule.direction))return null;
  if(!['log_return','signed_price_change','rate_change','signed_level_change'].includes(rule.transform))return null;
  if(rule.transform==='log_return'&&(p.v<=0||q.v<=0))return null;
  const movement=rule.direction*(rule.transform==='log_return'?Math.log(q.v)-Math.log(p.v):q.v-p.v)/scale;
  components.push({id:rule.id,direction:rule.direction,transform:rule.transform,transformScale:scale,transformScaleRule:rule.transformScaleRule,
   health:rule.dataHealth,commonT0:date(first.t),commonNow:date(last.t),sourceT0Date:date(p.t),sourceNowDate:date(q.t),t0Value:p.v,nowValue:q.v,
   signalT0:0,signalNow:movement,orientedIndex:100+movement,moveFrom100:movement,noNewReleaseInHorizon:false,noNewReferencePeriod:p.t===q.t});
 }
 return{baseline:first.raw,value:last.raw,commonT0:date(first.t),commonNow:date(last.t),components,omitted:[],status:'frozen-endpoint-attribution',
  reasons:[],factorDiagnostics:{},noNewReleaseComponents:[],noNewReferencePeriodComponents:components.filter(c=>c.noNewReferencePeriod).map(c=>c.id),
  frozenScope:{requestedWindow:structuredClone(state.chart.requestedWindow||state.chart.window),plottedWindow:structuredClone(state.chart.window),
   baseline:{t:first.t,raw:first.raw,knownBy:first.knownBy||null,dateKind:first.dateKind||null,inputs:structuredClone(a)},
   end:{t:last.t,raw:last.raw,knownBy:last.knownBy||null,dateKind:last.dateKind||null,inputs:structuredClone(b)}}};
};
