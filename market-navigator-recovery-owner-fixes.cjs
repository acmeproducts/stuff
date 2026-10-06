// October 6 owner feedback. Explicit behavior corrections; Turn 28 stays immutable.
const assert=require('node:assert/strict');
function moduleFixes(text){
const obsolete="if(S.level!==1){if(IDX.includes(sel.id))$('info').classList.add('hidden');else{S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)}}";
assert(text.includes(obsolete),'legacy crosshair card seam');text=text.replace(obsolete,'');
text=text.replace("c.onpointerleave=()=>{};",`c.onpointerleave=()=>{};c.oncontextmenu=e=>{e.preventDefault();if(!sets.some(z=>z.a.length))return;let hit=locate(e);if(hit&&hit.near.dist<24)showNowSeriesInfo25(hit.near.z.id)};`);
text=text.replace('a=indexed(src,w,1)','a=rawDisplay25(src,w)');
text=text.replace('return JSON.parse(JSON.stringify(S.nowChartState))','return {...JSON.parse(JSON.stringify(S.nowChartState)),display:S.indexDisplay}');
text+=`\nfunction rawDisplay25(src,w){if((S.indexDisplay||'fixed')==='rebase')return indexed(src,w,1);let b=(src.observations||[]).find(q=>Number.isFinite(+q.v)&&+q.v!==0);if(!b||+b.t>w.start)return[];return obsRange(src,w).map(q=>({...q,v:100*q.raw/+b.v,idx:100*q.raw/+b.v}))}\n`;
return text;
}
const helpers=String.raw`
function recoveryChartExplanation(state){
 let snap=mnxExplain(state),chart=state?.chart||{},raw=(chart.series||[]).filter(z=>!IDX.includes(z.id)),sections=[];
 const cell=x=>String(x??'—').replace(/\|/g,'/').replace(/[\r\n]+/g,' '),date=t=>Number.isFinite(+t)?new Date(+t).toISOString().slice(0,10):'—';
 if(raw.length){
  sections.push('## Selected series — '+cell(state.horizon)+'\n\nVisible window: '+cell(chart.window?.startLabel)+' → '+cell(chart.window?.endLabel)+'. Representation: '+cell(chart.mode)+'.\n\n'+(state.display==='fixed'?'Fixed keeps the earliest real nonzero canonical observation as each raw series’ base across horizons.':'Horizon uses the most recent real observation at or before the selected window’s start as each raw series’ base.')+' Indexed 100 = 100 × raw value / base value. Native Y2 retains raw units.\n\n| Series | What it measures | Unit / cadence | First visible observation | Last visible observation | Raw change |\n|---|---|---|---|---|---|');
  for(let z of raw){let c=S.catMap[z.id]||{},a=z.points||[],first=a[0],last=a.at(-1),delta=first&&last?last.raw-first.raw:null,change=delta===null?'Unavailable':mnxSigned(delta,4,' '+(z.unit||''))+(first.raw!==0?' ('+mnxSigned(100*delta/Math.abs(first.raw),2,'%')+')':'');
   sections.push('| '+cell(z.label||z.id)+' | '+cell(c.description||c.name||z.full)+' | '+cell(z.unit)+' / '+cell(c.native_cadence||'—')+' | '+(first?date(first.sourceT||first.t)+' · '+mnxNum(first.raw,4):'Unavailable')+' | '+(last?date(last.sourceT||last.t)+' · '+mnxNum(last.raw,4):'Unavailable')+' | '+cell(change)+' |');
  }
  sections.push('\nChanges above compare the first and last real observations visible in this window. Different release cadences may give series different dates; observations are not restamped or interpolated. Relative rebasing is a display transformation, not a governed composite contribution or a causal explanation.');
  for(let z of raw){let c=S.catMap[z.id]||{},tm=timingMeta26(c);if(c.chartImpact)sections.push('\n**'+cell(z.label)+' relevance:** '+cell(c.chartImpact));if(tm.why)sections.push('Timing: '+cell(tm.why)+(tm.caveat?' Caveat: '+cell(tm.caveat):''));if(c.source_reference_url)sections.push('[Source / methodology for '+cell(z.label)+']('+c.source_reference_url+')');}
 }
 if(snap.markdown)sections.push('\n'+snap.markdown);
 return {...snap,applicable:sections.length>0,markdown:sections.join('\n'),rawSeries:raw.map(z=>z.id),fingerprint:raw.length?mnxHash(JSON.stringify([snap.fingerprint,state.display,chart.window,raw.map(z=>[z.id,z.points])])):snap.fingerprint,note:sections.length?'':'No series observations are in this chart.'};
}
function recoverySourceDate26(row){
 let value=row.date||row.published_at||row.published_date||row.publication_date||row.published||row.page_age||'';
 if(!value)return '';let s=String(value).trim(),match=s.match(/^\d{4}-\d{2}-\d{2}/);
 if(match){let t=Date.parse(match[0]+'T00:00:00Z');return Number.isFinite(t)&&new Date(t).toISOString().slice(0,10)===match[0]?match[0]:''}
 if(!/\b\d{4}\b/.test(s))return '';let t=Date.parse(s);return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):'';
}
function recoveryRelevantSource26(row,state){
 let text=(row.title+' '+row.content+' '+row.url).toLowerCase(),ids=contextIds26(state);
 return ids.some(id=>{let c=S.catMap[id]||{},aliases=[id,c.short_name,c.name];if(id==='initialClaims')aliases.push('initial claims','unemployment claims','jobless claims');if(id==='qqq')aliases.push('nasdaq-100','nasdaq 100','invesco qqq');return aliases.filter(Boolean).some(a=>{let terms=String(a).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);return terms.length&&terms.every(t=>text.includes(t))})});
}
function recoverySpecificSource26(row){
 try{let p=new URL(row.url).pathname.replace(/\/+$/,'');return p&&!/^\/(markets|business|business\/finance|news|releases\/calendar|release-calendar|news\/schedule)$/i.test(p)}catch{return false}
}
`;
function applicationFixes(out,babel){
// Record string seams once, rather than retaining repeated ASTs during a build.
const functions=(()=>{let ast=babel.babelParse(out,'owner-fixes.js',false),map=new Map();babel.traverse(ast,{FunctionDeclaration(p){let n=p.node.id?.name;if(n)map.set(n,out.slice(p.node.start,p.node.end))}});return map})();
function replaceFunction(name,replacement){let original=functions.get(name);assert(original&&out.includes(original),'owner fix seam '+name);out=out.replace(original,replacement);}
const fixedData=String.raw`if(!IDX.includes(z.id)&&state.display==='fixed'){let src=await getSeries(z.id),obs=(src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>({t:+p.t,sourceT:+p.t,v:+p.v,raw:+p.v})),probe=(z.points||[]).find(p=>Number.isFinite(+p.raw)&&+p.raw!==0&&Number.isFinite(+p.idx)&&+p.idx!==0),base=probe?100*(+probe.raw)/(+probe.idx):obs.find(p=>p.raw!==0)?.raw;return {...z,points:obs.map(p=>({...p,idx:Number.isFinite(base)&&base!==0?100*p.raw/base:null}))}}`;
replaceFunction('dataSeries17',functions.get('dataSeries17').replace('let chart=',fixedData+'let chart='));
out=out.replace("list=(ids.length?ids:IDX).map(k=>mnxModelHealth(k,h))","list=(state?ids:IDX).map(k=>mnxModelHealth(k,h))");
// Also filter previously saved evidence at the AI boundary; source/Health views
// still expose their complete model inventory when explicitly requested.
out=out.replace('governedModelHealth:state.modelHealth||null','governedModelHealth:state.modelHealth?{...state.modelHealth,scope:mnxScopeIndices(state),models:(state.modelHealth.models||[]).filter(m=>mnxScopeIndices(state).includes(m.modelId))}:null');
out=out.replace('snap=mnxExplain(state);','snap=recoveryChartExplanation(state);');
out=out.replace("$('mnxHorizon').textContent=snap.horizon;","$('mnxTitle').textContent='Chart Explanation';$('mnxHorizon').textContent=snap.horizon;");
out=out.replace('market-navigator-index-explanation-${hz}.md','market-navigator-chart-explanation-${hz}.md');
out=out.replace("`${snap.records.length} governed index record${snap.records.length===1?'':'s'} · fingerprint ${snap.fingerprint}`","`${snap.records.length} governed index record${snap.records.length===1?'':'s'}${snap.rawSeries?.length?' · '+snap.rawSeries.length+' selected raw series':''} · fingerprint ${snap.fingerprint}`");
replaceFunction('analysisMarkdown',String.raw`function analysisMarkdown(a){let out='# '+a.title+'\n\n';for(let t of visibleTurns27(a)){if(t.processing)continue;let body=String(t.content||'');if(t.role==='assistant')body=body.replace(/^# [^\n]+\n+/,'');out+='## '+(t.role==='assistant'?'Analysis':'User')+'\n\n'+body+'\n\n'}return out}`);
replaceFunction('contextVeniceSearch26',String.raw`async function contextVeniceSearch26(query,category,limit=10){let reg=aiRegistry(),p=reg.defaultProvider||'venice',cfg=(reg.providers||{})[p]||{};if(p!=='venice'||!cfg.verified||!cfg.key)return[];try{let r=await fetch('https://api.venice.ai/api/v1/augment/search',{method:'POST',headers:{Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'},body:JSON.stringify({query:String(query||'').slice(0,390),limit,search_provider:'brave'})});if(!r.ok)return[];let x=await r.json();return(x.results||[]).filter(z=>/^https?:\/\//i.test(z.url||'')).map(z=>({category,title:z.title||z.url,url:z.url,date:recoverySourceDate26(z),content:contextClean26(z.content||'',260),source:contextDomain26(z.url)}))}catch{return[]}}`);
replaceFunction('contextSourceBundle26',String.raw`async function contextSourceBundle26(state,question=''){let base=contextPrimaryCatalog26(state).map(x=>({...x,kind:'series-data'})),q=contextQueryTerms26(state),dataQ=q.range+' '+q.labels+' official data releases',newsQ=q.range+' '+q.labels+' related reporting';let [dataSearch,newsSearch]=await Promise.all([contextVeniceSearch26(dataQ,'Data & Releases',10),contextVeniceSearch26(newsQ,'Related Reporting',12)]);let qualify=x=>recoverySpecificSource26(x)&&recoveryRelevantSource26(x,state)&&!!x.date&&(!state.chart?.window?.startLabel||x.date>=state.chart.window.startLabel)&&(!state.chart?.window?.endLabel||x.date<=state.chart.window.endLabel),primary=contextDedupe26([...base,...dataSearch.filter(x=>contextIsPrimaryDomain26(x.source)&&qualify(x))],6),reporting=contextDedupe26(newsSearch.filter(x=>contextIsReportingDomain26(x.source)&&qualify(x)),4);return{schema:'market-navigator-context-sources-v1',retrievedAt:new Date().toISOString(),question,range:q.range,primary,reporting}}`);
out=out.replace('treasury\\.gov|sec\\.gov','treasury\\.gov|dol\\.gov|sec\\.gov');
replaceFunction('contextSourceLine26',String.raw`function contextSourceLine26(r){let date=r.date?String(r.date).slice(0,32)+' · ':'',title=contextClean26(r.title,180)||r.source||r.url,sn=contextClean26(r.content,150);return '- **'+date+(r.source||'Source')+'** — ['+title+']('+r.url+')'+(sn?' — '+sn:'')}`);
replaceFunction('contextMarkdown26',String.raw`function contextMarkdown26(bundle){let primary=bundle.primary||[],catalog=primary.filter(r=>r.kind==='series-data'),releases=primary.filter(r=>r.kind!=='series-data'),reporting=bundle.reporting||[],out='## Context & Further Reading\n\n### Data & Releases\n\n';if(catalog.length)out+='Series data and methodology (publication dates do not apply to these reference pages):\n\n'+catalog.map(contextSourceLine26).join('\n')+'\n\n';if(releases.length)out+='Dated releases:\n\n'+releases.map(contextSourceLine26).join('\n')+'\n\n';out+='### Related Reporting\n\n'+(reporting.length?reporting.map(contextSourceLine26).join('\n'):'No qualifying dated related reporting found for this window.')+'\n\nSources retrieved '+bundle.retrievedAt.slice(0,10)+'. Retrieval date is not a publication date.';return out}`);
const oldRun=/let result=await governedLiveQuery26\(a,intent\),answer,bundle=null;[\s\S]*?answer=ctx.answer;bundle=ctx.bundle/;
assert(oldRun.test(out),'context refresh seam');out=out.replace(oldRun,String.raw`let result,answer,bundle=null;
  if(intent&&intent.operation==='refresh-context'){
    let state=mnxShipState(deepClone26(activeLibraryState26(a))),contract=queryContract26(a,intent);
    result={schema:'market-navigator-live-query-v1',query_id:'context-'+Date.now(),query_timestamp:new Date().toISOString(),parent_state_id:contract.parent_state_id,contract,state};
    bundle=await contextSourceBundle26(state,text);answer=contextMarkdown26(bundle)`);
out=out.replace("answer=await callAI([{role:'system',content:contextSystem26(a,result)}","result=await governedLiveQuery26(a,intent);answer=await callAI([{role:'system',content:contextSystem26(a,result)}");
out=out.replace('Produce a substantive analysis, never an empty response.','Keep the report concise (about 350 words for plain/standard; about 600 for technical), with one discussion of each selected series and no repeated summary. Discuss only the supplied chart series and explicitly scoped indices; component membership alone does not bring its parent index or other components into scope. Do not infer drivers such as earnings or monetary policy from price changes alone. Raw chart series use relative rebasing, not governed component transforms. Produce a substantive analysis, never an empty response.');
out=out.replace('boot();',helpers+'\nboot();');
return out;
}
module.exports={moduleFixes,applicationFixes};
