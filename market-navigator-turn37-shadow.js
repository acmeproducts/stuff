/* TURN37_STAGE2_SHADOW_CONTROLLER */
const MNChartController37=(()=>{
  function copyPoint(p){return{t:+p.t,v:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:null,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,sourceT:+(p.sourceT||p.t)}}
  function indexPoints(id,h,displayMode){
    let a=(S.derived.indices[id]?.horizons?.[h]?.curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));
    if(displayMode==='horizon'&&a.length){
      const base=a[0].raw;
      if(Number.isFinite(base)&&base!==0)a=a.map(p=>({...p,v:100*p.raw/base,idx:100*p.raw/base}));
    }
    return a;
  }
  function family(id){
    if(IDX.includes(id))return'derived-index:'+id;
    let u=String(unit(id)||'').toLowerCase();
    if(/percent|percentage|basis point|bps/.test(u))return'percent';
    if(/usd|dollar|currency/.test(u))return'money';
    if(/index|indexed/.test(u))return'index';
    if(/persons|people|claims|count|thousand|million/.test(u))return'count';
    return u||'other';
  }
  function axisPolicy(ids){
    const kinds=[...new Set(ids.map(family))];
    if(kinds.length<=1)return{mode:'native',map:Object.fromEntries(ids.map(id=>[id,0])),kinds};
    if(kinds.length===2)return{mode:'dual',map:Object.fromEntries(ids.map(id=>[id,kinds.indexOf(family(id))])),kinds};
    return{mode:'indexed',map:Object.fromEntries(ids.map(id=>[id,0])),kinds};
  }
  async function baseSeries(id,w,h,displayMode){
    if(IDX.includes(id))return{id,a:indexPoints(id,h,displayMode),unit:'Index'};
    try{
      const src=await getSeries(id);
      return{id,a:indexed(src,w,1).map(copyPoint),unit:unit(id)};
    }catch{return{id,a:[],unit:unit(id)}}
  }
  async function resolve(spec){
    const ids=[...spec.series],w=windowFor(spec.timeHorizon,spec.windowIndex||spec.root||'risk'),sets=[];
    for(const id of ids)sets.push(await baseSeries(id,w,spec.timeHorizon,spec.displayMode||'fixed'));
    let active=sets.some(z=>z.id===spec.activeSeries&&z.a.length)?spec.activeSeries:(spec.root&&sets.some(z=>z.id===spec.root&&z.a.length)?spec.root:(sets.find(z=>z.a.length)?.id||spec.activeSeries||spec.root||null));
    let dualEligible=!!sets.find(z=>z.id===active&&!IDX.includes(z.id)&&z.a.some(q=>Number.isFinite(+q.raw)));
    let mode=spec.representation==='dual'&&dualEligible?'dual':'indexed';
    const out=sets.map(z=>{
      const q={id:z.id,axis:mode==='dual'&&z.id===active&&!IDX.includes(z.id)?1:0,axisLabel:'Indexed 100',unit:z.unit,a:z.a.map(copyPoint)};
      if(q.axis===1){q.a=q.a.map(p=>({...p,v:+p.raw}));q.axisLabel=q.unit||'Native'}else if(spec.root===null)q.axisLabel=q.unit||'Index'
      return q;
    });
    return{root:spec.root||null,series:ids,active,window:{...w},mode,dualEligible,sets:out,axisPolicy:axisPolicy(ids)};
  }
  class Controller{
    constructor(spec){this.spec={...spec,series:[...(spec.series||[])]};this.resolved=null}
    async update(next){this.spec={...this.spec,...next,series:[...(next.series||this.spec.series||[])]};this.resolved=await resolve(this.spec);return this.resolved}
    async getResolved(){if(!this.resolved)this.resolved=await resolve(this.spec);return this.resolved}
    getState(){return{...this.spec,series:[...(this.spec.series||[])]}}
    destroy(){this.resolved=null}
  }
  return{create:spec=>new Controller(spec),resolve,axisPolicy};
})();
window.MNChartController37=MNChartController37;

function mn37NowShadowSpec(){
  const env=S.level===1;
  return{
    root:env?null:S.index,
    windowIndex:S.index||'risk',
    series:env?[...IDX]:visibleIds25(),
    timeHorizon:S.h,
    displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',
    representation:S.nowRepresentation||'indexed',
    activeSeries:env?null:(S.nowActive||S.index)
  };
}
function mn37NormalizeLegacyNow(){
  const c=S.nowChartState?.chart;if(!c)return null;
  return{
    root:S.nowChartState.root??null,
    series:(c.series||[]).map(z=>z.id),
    active:S.level===1?null:(S.nowChartState.active||c.active||null),
    window:{horizon:c.window?.horizon,start:+c.window?.start,end:+c.window?.end,startLabel:c.window?.startLabel,endLabel:c.window?.endLabel},
    mode:c.mode,
    sets:(c.series||[]).map(z=>({id:z.id,axis:+(z.axis||0),axisLabel:z.axisLabel||'',unit:z.unit||'',a:(z.points||[]).map(p=>({t:+p.t,v:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:null,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,sourceT:+(p.sourceT||p.t)}))}))
  };
}
function mn37ComparableResolved(r,spec){
  return{
    root:spec.root??null,
    series:[...r.series],
    active:spec.root===null?null:r.active,
    window:{horizon:r.window.horizon,start:+r.window.start,end:+r.window.end,startLabel:r.window.startLabel,endLabel:r.window.endLabel},
    mode:r.mode,
    sets:r.sets.map(z=>({id:z.id,axis:+(z.axis||0),axisLabel:z.axisLabel||'',unit:z.unit||'',a:z.a.map(p=>({t:+p.t,v:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:null,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,sourceT:+(p.sourceT||p.t)}))}))
  };
}
window.__mn37Shadow={
  spec:()=>JSON.parse(JSON.stringify(mn37NowShadowSpec())),
  async compareNow(){
    const spec=mn37NowShadowSpec(),legacy=mn37NormalizeLegacyNow(),resolved=await MNChartController37.resolve(spec),shadow=mn37ComparableResolved(resolved,spec);
    const equal=JSON.stringify(legacy)===JSON.stringify(shadow);
    return{equal,legacy,shadow};
  },
  resolve:spec=>MNChartController37.resolve(spec)
};
