// Apply explicitly requested behavior corrections to the passing shared-chart architecture.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{babel}=require('./market-navigator-rebuild-runtime.cjs');
require('./market-navigator-rebuild-analyze.cjs');
const base=fs.readFileSync('market-navigator-rebuild-analyze.html','utf8'),match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8;
const ast=babel.babelParse(code,'passing-analyze.js',false),nodes=new Map();babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id)nodes.set(p.node.id.name,p.node)}});
const edits=[];function change(name,fn){const n=nodes.get(name);assert(n,'Missing '+name);const prior=edits.find(e=>e.start===n.start);if(prior)prior.text=fn(prior.text);else edits.push({start:n.start,end:n.end,text:fn(code.slice(n.start,n.end))});}
change('openStandaloneAnalysis26',s=>s.replace('rebuildAnalyze=MNChart.mount(',"rebuildNow.dismissInfo();rebuildAnalyze=MNChart.mount("));
change('nav',s=>s.replace("const restore=v==='now'","if(!['now','library','health','config'].includes(v))v='now';const restore=v==='now'"));
change('repaintCharts',s=>s.replace("function repaintCharts(){","function repaintCharts(){if(S.view==='analyze'&&rebuildAnalyze){rebuildRefreshStyles(rebuildAnalyze);return}"));
change('closeStandaloneAnalysis26',s=>s.replace("nav('now');","nav('now');rebuildRefreshStyles(rebuildNow);"));
change('boot',()=>`async function boot(){
 if(innerWidth<=760)$('rail').classList.add('closed');
 S.health={series:{}};S.catalog={series:[]};S.sourceRegistry={registrations:[]};
 try{await initPersistence();renderLibrary();renderAIConfig();setConfigTab('ai');renderAttachPreview();renderDeleted()}catch(e){$('libList').textContent='Saved reports could not be opened: '+e.message}
 const message=document.createElement('div');message.id='rebuildDataStatus';message.style.cssText='position:absolute;inset:32px 12px auto;padding:12px;color:var(--muted);z-index:3;background:var(--panel)';message.textContent='Refreshing market dataâ€¦';$('nowWrap').append(message);
 async function load(){try{
 const [derived,definition,health,catalog,registry]=await Promise.all([j('market-evidence/derived-indices-persistent-v1.json'),j('data/market-backend/derived-index-definition-persistent-v1.json'),j('market-evidence/health-envelope.json'),j('data/market-backend/data-catalog.json'),j('data/market-backend/source-registry.json')]);
 if(!derived.coherence?.allIndexHorizonsComputable)throw Error('Derived evidence failed coherence');
 Object.assign(S,{derived,def:definition,health,catalog,sourceRegistry:registry,catMap:Object.fromEntries(catalog.series.map(x=>[x.id,x]))});
 message.remove();renderV1();mnxRenderHealth();renderSources25();renderCrumb();setupGeometry25();openHealthHash26();
 }catch(e){message.textContent='Repairing market data. Saved reports remain available in Library.';setTimeout(load,15000)}}
 await load();
}`);
change('mnxRenderHealth',s=>s.replace('mnxEnsureHealthTabs();',"mnxEnsureHealthTabs();if(!S.derived){$('healthRows').textContent='Market data recovery is running.';return}"));
change('sourceSet25',()=>`async function sourceSet25(id,w,color){
 if(IDX.includes(id)){const x=S.derived.indices[id].horizons[S.h];return{id,label:AB[id],full:S.def.indices[id].name,unit:'Index',color,renderType:'line',a:indexDisplayCurve28(x.curve||[])}}
 const meta=cat(id),cadence=String(meta.native_cadence||'').toLowerCase(),hh=health(id);
 if(['stale','failed','missing','unknown','cached-stale'].includes(String(hh.classification).toLowerCase()))return{id,label:label(id),full:name(id),unit:unit(id),color,renderType:'line',a:[]};
 const src=await getSeries(id),observations=src.observations||[],periodic=/weekly|month|quarter/.test(cadence),b=S.indexDisplay==='rebase'?baseline(src,w):observations.find(p=>Number.isFinite(+p.v)&&+p.v!==0);
 const normalization={mode:S.indexDisplay==='rebase'?'Horizon':'Fixed',anchorDate:b?.t,anchorValue:b?.v,formula:'100 Ã— native value / reference value'};
 if(!b||!Number.isFinite(+b.v)||+b.v===0)return{id,label:label(id),full:name(id),unit:unit(id),color,normalization,renderType:'line',a:[]};
 let a=obsRange(src,w).map(p=>({t:+p.t,v:100*+p.v/+b.v,idx:100*+p.v/+b.v,raw:+p.v,sourceT:+p.t}));
 if(periodic&&S.h!=='1D'){
  const prior=baseline(src,w);if(prior&&(!a.length||a[0].t>w.start))a.unshift({t:w.start,v:100*+prior.v/+b.v,idx:100*+prior.v/+b.v,raw:+prior.v,sourceT:+prior.t,held:true});
  const last=a.at(-1);if(last&&last.t<w.end)a.push({...last,t:w.end,held:true});
 }
 return{id,label:label(id),full:name(id),unit:unit(id),color,normalization,renderType:periodic?'step':'line',a};
}`);
change('removeNowSeries25',s=>s.replace("if(componentIds25().includes(id))","S.nowComparisons=S.nowComparisons.filter(x=>x!==id);if(componentIds25().includes(id))"));
change('renderNowPicker25',s=>s.replace(/<button class="btn" data-about-now="\$\{id\}">About<\/button>/g,'').replace(/\$\('nowPickerList'\)\.querySelectorAll\('\[data-about-now\]'\)\.forEach\(b=>b\.onclick=\(\)=>showNowSeriesInfo25\(b\.dataset\.aboutNow\)\);/,'').replace("if(b.disabled)return;let id=b.dataset.addNow;","if(b.disabled||!S.pickerOpen)return;b.disabled=true;S.pickerOpen=false;S.nowPickerToken25=null;let id=b.dataset.addNow;"));
change('wireLongPress25',s=>s.replace("if(t)clearTimeout(t)","if(t){clearTimeout(t);timers.delete(t)}").replace('long=true;showNowSeriesInfo25(id)','long=true;b.dataset.longPressHandled=\"true\";showNowSeriesInfo25(id)').replace('long=false;t=schedule','long=false;delete b.dataset.longPressHandled;t=schedule'));
change('renderV2',s=>s.replace("if(e.target.closest('[data-rm]')||b.disabled)return;","if(b.dataset.longPressHandled){delete b.dataset.longPressHandled;return}if(e.target.closest('[data-rm]')||b.disabled)return;"));
change('renderV2',s=>s.replace(/if\(id===k&&!S\.componentsExpanded&&!S\.anchored\)\{S\.componentsExpanded=true;S\.hiddenComponents=\[\];S\.nowActive=k;S\.nowFocus=k;renderV2\(\);return\}/,''));
change('renderV2',s=>s.replace("dualEligible=!!y2", "dualEligible=!!y2&&sets.some(z=>z.id!==y2.id&&z.a.length)"));
change('mnxBuildNowPrintReport',s=>s.replace("function mnxBuildNowPrintReport(stateOverride)", "function mnxBuildNowPrintReport(stateOverride,canvasOverride)").replace("let canvas=$('nowChart')", "let canvas=canvasOverride||$('nowChart')").replace('Index Movement Explanation','Chart Explanation'));
change('mnxPrintNow',s=>s.replace('function mnxPrintNow(stateOverride)', 'function mnxPrintNow(stateOverride,canvasOverride)').replace('mnxBuildNowPrintReport(stateOverride)', 'mnxBuildNowPrintReport(stateOverride,canvasOverride)'));
change('draw',s=>{
 s=s.replace("if(services.selectionInformation!==false&&S.level!==1){if(IDX.includes(sel.id))$('info').classList.add('hidden');else{S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)}}", "");
 // Preserve one pointer-event owner; touch never runs a second touch handler.
 s=s.replace("c.onpointerdown=e=>inspect(e,true);","c.style.touchAction='none';c.onpointerdown=e=>{if(e.pointerType==='touch')e.preventDefault();inspect(e,true)};");
 s=s.replace(/c\.ontouchstart=e=>\{e\.preventDefault\(\);inspect\(e,true\)\};c\.ontouchmove=e=>\{e\.preventDefault\(\);inspect\(e,false\)\}/,"c.ontouchstart=null;c.ontouchmove=null");
 // Held low-frequency values change only at their actual native/reference point.
 s=s.replace("da.forEach((q,i)=>{let qxy=xy(z,q);i?x.lineTo(qxy.x,qxy.y):x.moveTo(qxy.x,qxy.y)})","da.forEach((q,i)=>{let qxy=xy(z,q);if(i){if(z.renderType==='step')x.lineTo(qxy.x,xy(z,da[i-1]).y);x.lineTo(qxy.x,qxy.y)}else x.moveTo(qxy.x,qxy.y)})");
 const from=s.indexOf("model=paint({x:xx,y:yy,z:sel});"),end=s.indexOf("c.onpointermove",from);assert(from>0&&end>from);const old=s.slice(from,end),cut=old.lastIndexOf('}');
 const body=old.slice(0,cut).replace("tc.onclick=e=>{e.stopPropagation();tip.style.display='none';","tc.onclick=e=>{e.stopPropagation();S.inspection=null;tip.style.display='none';");
 const helper="function showInspection(q,sel){const qxy=model.xy(sel,q),xx=qxy.x,yy=qxy.y;"+body.replace("model=paint({x:xx,y:yy,z:sel});","model=paint({x:xx,y:yy,z:sel});")+'}';
 s=s.slice(0,from)+"S.inspection={id:sel.id,t:q.t};showInspection(q,sel)}"+s.slice(end);
 s=s.replace("function inspect(e,allowSelect=false)",helper+"function inspect(e,allowSelect=false)");
 s=s.replace("model=paint();syncActive();","model=paint();syncActive();if(S.inspection){const z=sets.find(z=>z.id===S.inspection.id),q=z?.a.find(q=>q.t===S.inspection.t);if(z&&q){sel=z;showInspection(q,z)}else{S.inspection=null;tip.style.display='none'}}");
 s=s.replace("${full(q.sourceT||q.t)} Â·","${q.held?'As of ':''}${full(q.sourceT||q.t)} Â·");
 return s;
});
change('chartSnapshotFromSets',s=>s.replace("renderType:z.renderType||'line',","renderType:z.renderType||'line',...(z.normalization?{normalization:structuredClone(z.normalization)}:{}),").replace("sourceT:+(q.sourceT||q.t)","sourceT:+(q.sourceT||q.t),...(q.held?{held:true}:{})"));
change('mnxExplain',s=>s.replace("markdown=records.length?records.map(mnxRecordMarkdown).join('\\n---\\n\\n'):''","markdown=(records.length?records.map(mnxRecordMarkdown).join('\\n---\\n\\n')+'\\n\\n':'')+(state?MNInsights.seriesExplanation(state):'')").replace("applicable:records.length>0","applicable:!!markdown,indexAttributionApplicable:records.length>0"));
change('mnxOpenExplanation',s=>s.replace("snap.applicable?`${snap.records.length} governed index record${snap.records.length===1?'':'s'} Â· fingerprint ${snap.fingerprint}`","snap.applicable?`Chart explanation Â· fingerprint ${snap.fingerprint}`"));
change('mnxModelHealthSnapshot',s=>s.replace("(ids.length?ids:IDX)","(state?ids:IDX)"));
change('mnxCopyExplanation',s=>s.replace("No governed explanation is in scope to copy.","No chart explanation is available to copy."));
change('mnxDownloadExplanation',s=>s.replace("No governed explanation is in scope to download.","No chart explanation is available to download.").replace('market-navigator-index-explanation-','market-navigator-chart-explanation-'));
change('aiEvidenceState',s=>s.replace("governedIndexExplanation:state.indexExplanation||null,","governedIndexExplanation:state.indexExplanation||null,relationships:state.relationships||MNInsights.chartRelationships(state),nativeCutoffs:(chart.series||[]).map(z=>({id:z.id,lastNativeDate:MNInsights.observed(z.points).size?[...MNInsights.observed(z.points).keys()].sort().at(-1):null})),"));
change('startAI',s=>s.replace("let state=stateOverride||nowAnalysisState(),level=","let state=stateOverride||nowAnalysisState();await rebuildEnrichState(state);let level=").replace("Begin with one specific H1 Markdown title,","Discuss level correlation separately from correlation of changes, paired-date counts, differing cadences and the supplied longer reference sample. Explain whether the observed association differs from that reference, what economic channels could plausibly connect these exact series, and what could be inferred or remains uncertain. Do not describe descriptive correlation as causation, prediction or an established usual relationship. Use only indices actually present in scope; raw-only scopes contain zero governed index models. State the requested chart window and each actual native cutoff separately; never pretend a native observation occurred at collection time. Do not merely repeat endpoint values. Include dated reporting when verified; never repeat date-not-found placeholders or invent publication dates. Begin with one specific H1 Markdown title,"));
change('contextSourceLine26',()=>`function contextSourceLine26(r){const date=r.date?String(r.date).slice(0,32):'',title=contextClean26(r.title,180)||r.source||r.url,sn=contextClean26(r.content,190);return '- **'+(date?date+' Â· ':'')+(r.source||'Source')+'** â€” ['+title+']('+r.url+')'+(sn?' â€” '+sn:'')}`);
change('contextSourceBundle26',s=>s.replace("return{schema:'market-navigator-context-sources-v1'","reporting=reporting.filter(r=>r.date&&Number.isFinite(Date.parse(r.date)));primary=primary.slice(0,2);reporting=reporting.slice(0,5-primary.length);return{schema:'market-navigator-context-sources-v1'"));
change('mnxExplain',s=>s.replace("schema:'market-navigator-index-explanation-set-v1'","schema:'market-navigator-chart-explanation-set-v2'").replace("records.map(r=>r.fingerprint)]","records.map(r=>r.fingerprint),state?.chart?.mode,(state?.chart?.series||[]).map(s=>[s.id,s.normalization,s.points])]"));
change('contextSourceLine26',s=>s.replace("const date=r.date?String(r.date).slice(0,32):''","const date=r.date&&Number.isFinite(Date.parse(r.date))?new Date(r.date).toISOString().slice(0,10):''"));
change('startAI',s=>s.replace('Do not merely repeat endpoint values.','Keep the narrative concise and lead with the relationship assessment. Use numerical values to support that assessment, rather than inventorying every component. Cite at most five relevant further-reading links. Do not merely repeat endpoint values.'));
change('mnxOpenExplanation',s=>s.replace('function mnxOpenExplanation(stateOverride=null)', 'function mnxOpenExplanation(stateOverride=null,buttonOverride=null)').replace("btn=$('indexInfoBtn')", "btn=buttonOverride||$('indexInfoBtn')").replace('mnxLastFocus=document.activeElement;', 'mnxExplanationButton=btn;mnxLastFocus=document.activeElement;'));
change('mnxCloseExplanation',s=>s.replace("$('indexInfoBtn')", "mnxExplanationButton||$('indexInfoBtn')"));
let output=code;for(const e of edits.sort((a,b)=>b.start-a.start))output=output.slice(0,e.start)+e.text+output.slice(e.end);
output=output.replace("'anchored','clockIndex'].map","'anchored','clockIndex','inspection'].map").replaceAll("$('nowTip').style.display='none'","S.inspection=null;$('nowTip').style.display='none'");
output=output.replace("services.available(id,h,k)","services.available(id,h,IDX.includes(k)?k:(S.clockIndex||'risk'))");
output=output.replace("function rebuildServices(){return{","function rebuildServices(){return{selectionInformation:false,");
output=output.replace("available:seriesAvailable,onAnalyze:","available:async(id,h,k)=>!['stale','failed','missing','unknown','cached-stale'].includes(String(health(id).classification).toLowerCase())&&await seriesAvailable(id,h,k),onAnalyze:");
output=output.replace("available:async(id,h,k)=>!['stale','failed','missing','unknown','cached-stale'].includes(String(health(id).classification).toLowerCase())&&await seriesAvailable(id,h,k)", "available:rebuildSeriesAvailable");
output=output.replace("return mnxPrintNow(state)", "return mnxPrintNow(state,canvas)");
output=output.replace("onInfo:state=>mnxOpenExplanation(state)", "onInfo:(state,button)=>mnxOpenExplanation(state,button)");
output=output.replace('${full(q.sourceT||q.t)} ·',"${q.held?'As of ':''}${full(q.sourceT||q.t)} ·");
const enrich=`
function rebuildRefreshStyles(instance){const chart=instance?.getState().state?.chart;if(chart?.series.some(z=>z.color!==seriesColor(z.id)||z.lineWidth!==seriesStyle(z.id).width||z.lineStyle!==seriesStyle(z.id).lineStyle))return instance.update({})}
let mnxExplanationButton=null;\nasync function rebuildSeriesAvailable(id,h,k){
 if(['stale','failed','missing','unknown','cached-stale'].includes(String(health(id).classification).toLowerCase()))return false;
 if(await seriesAvailable(id,h,k))return true;
 const meta=cat(id),cadence=String(meta.native_cadence||'');
 if(h==='1D'||!/weekly|month|quarter/.test(cadence))return false;
 const supported=meta.supported_horizons;if(supported?.length&&!supported.includes(h))return false;
 const src=await getSeries(id);return !!baseline(src,horizonWindow(h,k));
}
async function rebuildEnrichState(state){
 state.relationships=MNInsights.chartRelationships(state);
 const end=state.chart?.window?.end||Date.now(),start=end-3*365.25*86400000;
 for(const pair of state.relationships){if(IDX.includes(pair.left)||IDX.includes(pair.right))continue;try{const [a,b]=await Promise.all([getSeries(pair.left),getSeries(pair.right)]);const points=s=>(s.observations||[]).filter(p=>p.t>=start&&p.t<=end);pair.reference=MNInsights.relationship(points(a),points(b));pair.reference.label='Available native history within the preceding three years; same frozen collection vintage'}catch(e){pair.reference={available:false,reason:'Reference history could not be qualified'}}}
 return state;
}
`;
output=output.replace(/window\.__mnStandalone26=\{[^\n]+\};/, '');
output=output.replace('getState,update(patch={})',"getState,dismissInfo(){ $('nowSeriesAbout')?.classList.add('hidden') },update(patch={})");
output=output.replace('boot();',enrich+'\nboot();');new vm.Script(output);
let html=base.slice(0,offset)+output+base.slice(offset+code.length);
const insights=fs.readFileSync('market-navigator-rebuild-insights.js','utf8');html=html.replace('<script>','<script>'+insights+'\n');
html=html.replaceAll('Index Explanation','Chart Explanation').replaceAll('aria-label="Explain index movement"','aria-label="Explain chart"');
html=html.replace('</head>','<style>@media(max-width:700px){#view-analyze .chartChromeRow{grid-template-columns:minmax(42px,64px) minmax(0,1fr) 68px}#view-analyze .chromeRight{width:68px;min-width:68px}#view-analyze .chromeRight>.btn{width:32px;padding:6px 0}}</style></head>');
fs.writeFileSync('market-navigator-rebuild-candidate.html',html);
console.log('Built the independently corrected candidate: single Add, explicit information, native normalization, scoped explanations and correlation evidence');
