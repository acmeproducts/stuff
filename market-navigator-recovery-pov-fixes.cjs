// Owner-requested current raw windows and measured relationship evidence.
const assert=require('node:assert/strict');
const helpers=String.raw`
function recoveryObservationDate26(t){return Number.isFinite(+t)?new Date(+t).toISOString().slice(0,10):''}
function recoveryCadence26(id){let c=String(S.catMap[id]?.native_cadence||S.health.series[id]?.cadence||'').toLowerCase();return IDX.includes(id)?'derived':/intraday|minute|hour/.test(c)?'intraday':/daily|trading|nav/.test(c)?'daily':/week/.test(c)?'weekly':/month/.test(c)?'monthly':/quarter/.test(c)?'quarterly':'unknown'}
function recoveryRawBounds26(end,h){let d=new Date(end+'T00:00:00Z');if(h==='1D'||h==='5D')d.setUTCDate(d.getUTCDate()-(h==='1D'?1:5));else if(h==='MTD')d.setUTCDate(1);else if(h==='YTD')d=new Date(Date.UTC(d.getUTCFullYear(),0,1));else{let m=d.getUTCMonth(),y=d.getUTCFullYear()-Number(h.slice(0,-2));d.setUTCFullYear(y);if(d.getUTCMonth()!==m)d=new Date(Date.UTC(y,m+1,0))}return{horizon:h,start:+d,end:Date.parse(end+'T23:59:59.999Z'),startLabel:recoveryObservationDate26(+d),endLabel:end}}
async function recoveryChartWindow26(h,k,ids){
 let governed=ids.filter(id=>IDX.includes(id));if(governed.length)return horizonWindow(h,IDX.includes(k)?k:governed[0]);
 let daily=ids.filter(id=>['daily','intraday'].includes(recoveryCadence26(id))),dates=[];
 for(let id of daily){try{let src=await getSeries(id),a=[...new Set((src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>recoveryObservationDate26(p.t)))].sort();if(a.length)dates.push(a)}catch{}}
 let end=S.health.marketAnchor||S.derived.commonMarketAnchor,alignment='market anchor for periodic series; actual source dates retained; no fill';
 if(dates.length){let common=new Set(dates[0]);for(let a of dates.slice(1)){let next=new Set(a);common=new Set([...common].filter(d=>next.has(d)))}let shared=[...common].sort();end=shared.at(-1)||dates.map(a=>a.at(-1)).sort()[0];alignment=shared.length?'latest shared observation date; no fill':'no shared observation dates; earliest latest individual date; no fill'}
 return{...recoveryRawBounds26(end,h),clock:'native-observations',alignment,healthMarketAnchor:S.health.marketAnchor||null};
}
function recoveryRelationshipFingerprint26(state){let c=state.chart||{};return mnxHash(JSON.stringify([c.window,(c.series||[]).map(z=>[z.id,(z.points||[]).map(p=>[p.sourceT||p.t,p.raw])])]))}
function recoveryRelationshipEvidence26(state,histories={}){
 const chart=state.chart||{},window=chart.window||{},minimum=20;
 const dateMap=points=>{let map=new Map();for(let p of points||[]){let t=+(p.sourceT||p.t),v=p.raw??p.v;if(!Number.isFinite(t)||!Number.isFinite(v))continue;let d=recoveryObservationDate26(t),prior=map.get(d);if(!prior||t>=prior.t)map.set(d,{t,v})}return map};
 const statistic=(a,b,excluded=0)=>{let n=a.length;if(n<minimum)return{r:null,n,excluded,reason:'insufficient-observations'};let ax=a.reduce((x,y)=>x+y,0)/n,bx=b.reduce((x,y)=>x+y,0)/n,c=0,va=0,vb=0;for(let i=0;i<n;i++){let x=a[i]-ax,y=b[i]-bx;c+=x*y;va+=x*x;vb+=y*y}return{r:va>1e-20&&vb>1e-20?Math.max(-1,Math.min(1,c/Math.sqrt(va*vb))):null,n,excluded,reason:va>1e-20&&vb>1e-20?null:'zero-variance'}};
 const price=id=>measurementFamily(id).startsWith('price:')||/usd|dollar/.test(String(S.catMap[id]?.native_unit||'').toLowerCase());
 function sample(a,b,from,to,ids){
  let dates=[...a.keys()].filter(d=>b.has(d)&&(!from||d>=from)&&(!to||d<=to)).sort(),av=dates.map(d=>a.get(d).v),bv=dates.map(d=>b.get(d).v),changeDates=[],x=[],y=[],excluded=0;
  let ca=recoveryCadence26(ids[0]),cb=recoveryCadence26(ids[1]),compatible=ca===cb&&ca!=='unknown'&&ca!=='intraday',pa=price(ids[0]),pb=price(ids[1]);
  for(let i=1;i<dates.length;i++){if((pa&&(av[i-1]<=0||av[i]<=0))||(pb&&(bv[i-1]<=0||bv[i]<=0))){excluded++;continue}x.push(pa?av[i]/av[i-1]-1:av[i]-av[i-1]);y.push(pb?bv[i]/bv[i-1]-1:bv[i]-bv[i-1]);changeDates.push(dates[i])}
  let changes=compatible?statistic(x,y,excluded):{r:null,n:x.length,excluded,reason:'incompatible-cadences'},recent60=compatible&&x.length>=60?statistic(x.slice(-60),y.slice(-60)):{r:null,n:Math.min(60,x.length),excluded,reason:compatible?'fewer-than-60-changes':'incompatible-cadences'};
  return{start:dates[0]||null,end:dates.at(-1)||null,pairedObservations:dates.length,levels:compatible?statistic(av,bv):{r:null,n:dates.length,excluded:0,reason:'incompatible-cadences'},changes:{...changes,measures:ids.map((id,i)=>({id,kind:(i===0?pa:pb)?'simple-percentage-change':'native-unit-change',unit:(i===0?pa:pb)?'fraction':IDX.includes(id)?'index points':S.catMap[id]?.native_unit||'native units'}))},recent60:{...recent60,start:changeDates.slice(-60)[0]||null,end:changeDates.at(-1)||null},sameDirectionFraction:compatible&&x.length?x.filter((v,i)=>Math.sign(v)===Math.sign(y[i])).length/x.length:null};
 }
 let series=chart.series||[],pairs=[];
 for(let i=0;i<series.length;i++)for(let j=i+1;j<series.length;j++){
  let a=series[i],b=series[j],ids=[a.id,b.id],mapA=dateMap(a.points),mapB=dateMap(b.points),current=sample(mapA,mapB,window.startLabel,window.endLabel,ids),reference3Y=null;
  if(histories[a.id]&&histories[b.id]&&current.end){
   const before=(id,z)=>[...(histories[id].observations||[]).filter(p=>+p.t<window.start).map(p=>({t:p.t,sourceT:p.t,raw:p.v})),...(z.points||[])],historyA=dateMap(before(a.id,a)),historyB=dateMap(before(b.id,b)),bounds=recoveryRawBounds26(current.end,'3YR');
   reference3Y=sample(historyA,historyB,bounds.startLabel,current.end,ids);reference3Y.requestedStart=bounds.startLabel;reference3Y.overlapsSelectedWindow=true;
   let allowance={daily:7,weekly:14,monthly:35,quarterly:100,derived:7}[recoveryCadence26(a.id)]||7,gap=reference3Y.start?(Date.parse(reference3Y.start)-bounds.start)/86400000:Infinity;reference3Y.coverage=gap<=allowance?'complete':'partial';if(reference3Y.coverage==='partial')reference3Y.changes={...reference3Y.changes,r:null,reason:'incomplete-three-year-history'};
  }
  pairs.push({ids,labels:[a.label||label(a.id),b.label||label(b.id)],cadences:ids.map(recoveryCadence26),window:current,reference3Y});
 }
 let sources=series.map(z=>({id:z.id,sourceRevision:histories[z.id]?.sourceRevision||null,lastSuccessful:histories[z.id]?.last_successful||null,referenceHistoryProvided:!!histories[z.id]})),chartFingerprint=recoveryRelationshipFingerprint26(state);
 return{schema:'market-navigator-relationship-evidence-v1',fingerprint:mnxHash(JSON.stringify([chartFingerprint,sources,pairs])),chartFingerprint,sources,window:{startLabel:window.startLabel||null,endLabel:window.endLabel||null},method:{coefficient:'Pearson',alignment:'UTC native observation dates; latest observation per date; no fill or interpolation; consecutive shared-date intervals may span closures',minimumChanges:minimum,priceChanges:'simple percentage changes; exclude nonpositive price endpoints',otherChanges:'native-unit differences',limits:['Descriptive association does not establish causation or forecasting ability.','Shared calendar dates do not synchronize intraday closes.','Native quote changes are not dividend-adjusted total returns or futures-roll-adjusted returns.','Price-level association can reflect trends; interpret change correlation separately.','Three-year reference overlaps the selected window; differences are not a formal significance test.']},pairs};
}
function recoveryFreezeRelationships26(state){return{...state,relationshipEvidence:recoveryRelationshipEvidence26(state,S.series)}}
function recoveryAiDataRevision26(state){let r=state.chart?.dataRevision||{},nativeSources=state.relationshipEvidence?.sources||[];return mnxScopeIndices(state).length?{...r,nativeSources}:{catalog:r.catalog||'',healthGeneratedAt:r.healthGeneratedAt||'',nativeSources}}
function recoveryRelationshipMarkdown26(state){
 let evidence=state.relationshipEvidence||recoveryRelationshipEvidence26(state),pairs=evidence.pairs||[];if(!pairs.length)return'';
 const value=(s,count='changes')=>s?.r===null||!s?'unavailable ('+(s?.reason||'no evidence').replace(/-/g,' ')+')':(s.r>=0?'+':'')+s.r.toFixed(2)+' · '+s.n+' '+count;
 let lines=['## Measured relationship',''];for(let pair of pairs){let w=pair.window;lines.push('**'+pair.labels.join(' / ')+'** · '+(w.start||'no shared observations')+' → '+(w.end||'—')+'.','', 'Change correlation (Pearson): **'+value(w.changes)+'**. Level correlation: '+value(w.levels,'paired observations')+'.');if(w.recent60.r!==null)lines.push('Last 60 matched changes: '+value(w.recent60)+'.');if(pair.reference3Y)lines.push('Three-year reference '+pair.reference3Y.start+' → '+pair.reference3Y.end+': '+value(pair.reference3Y.changes)+'.');lines.push('')}
 lines.push('Prices use percentage changes; rates, quantities and governed indices use native-unit changes. Matched native observation dates, no fill; intervals may span closures. Association does not establish causation or prediction. Quote changes are not total returns or futures-roll-adjusted returns.');
 return lines.join('\n');
}
function recoveryAttachRelationship26(answer,state){let section=recoveryRelationshipMarkdown26(state);if(!section)return answer;let at=answer.indexOf('\n## Context & Further Reading');return at<0?answer+'\n\n'+section:answer.slice(0,at)+'\n\n'+section+'\n'+answer.slice(at)}
`;
const instruction='Use the supplied pairwiseRelationships as deterministic evidence: distinguish price-level correlation from change correlation; state direction and practical strength, compare recent and three-year measurements when available, and explain whether this supports tandem movement, divergence, or an unstable relationship. Endpoint gains alone cannot establish correlation. Missing/insufficient/mixed-cadence metrics must remain unavailable; do not invent coefficients, significance, lead/lag, causation, or predictions. Shared dates do not synchronize closes; native quotes are not total returns or roll-adjusted futures returns. Three-year comparisons overlap the selected sample. Discuss plausible mechanisms as hypotheses and what dated evidence would distinguish them. Do not claim a current market driver without a dated supporting source; reference/data landing pages do not establish contemporaneous news. Separate chart observation dates, latest canonical observation dates, and report generation date; daily cadence does not guarantee a completed observation today. The application appends an authoritative Measured relationship section; interpret it without duplicating the table. ';
function moduleFixes(text){const seam='k=S.index,w=windowFor(S.h,k),ids=visibleIds25(),colors=';assert(text.includes(seam),'chart window resolution seam');return text.replace(seam,"k=S.index,ids=visibleIds25(),w=await services.resolveWindow(S.h,IDX.includes(k)?k:S.clockIndex||'risk',ids),colors=")}
function applicationFixes(out){
 const freeze='let state=stateOverride||nowAnalysisState(),level=';assert(out.includes(freeze),'AI freeze seam');out=out.replace(freeze,'let state=recoveryFreezeRelationships26(stateOverride||nowAnalysisState()),level=');
 out=out.replace('governedIndexExplanation:state.indexExplanation||null,','pairwiseRelationships:state.relationshipEvidence||recoveryRelationshipEvidence26(state),governedIndexExplanation:state.indexExplanation||null,');
 out=out.replace('dataRevision:chart.dataRevision,series:(chart.series||[])','dataRevision:recoveryAiDataRevision26(state),series:(chart.series||[])');
 out=out.replace('Produce a substantive analysis, never an empty response.',instruction+'Produce a substantive analysis, never an empty response.');
 out=out.replace('ORIGINAL FROZEN EVIDENCE and LIVE GOVERNED QUERY EVIDENCE',instruction+'ORIGINAL FROZEN EVIDENCE and LIVE GOVERNED QUERY EVIDENCE');
 out=out.replace('Continue this Market Navigator analysis using frozen evidence',instruction+'Continue this Market Navigator analysis using frozen evidence');
 out=out.replace('out=ctx.answer,saved=analyses()', 'out=recoveryAttachRelationship26(ctx.answer,state),saved=analyses()');
 out=out.replace('state.chart=fresh;','state.chart=fresh;state.relationshipEvidence=recoveryRelationshipEvidence26(state,S.series);');
 out=out.replace('w=horizonWindow(h,k),loaded=[]',"w=origin==='live-query-turn26'?await recoveryChartWindow26(h,k,ids):horizonWindow(h,k),loaded=[]");
 out=out.replace('if(snap.markdown)sections.push',"if(raw.length>1)sections.push('\\n'+recoveryRelationshipMarkdown26(recoveryFreezeRelationships26(state)));if(snap.markdown)sections.push");
 out=out.replace('boot();',helpers+'\nboot();');return out;
}
module.exports={moduleFixes,applicationFixes,instruction};
