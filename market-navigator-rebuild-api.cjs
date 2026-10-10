'use strict';
// Final portability layer: retain the qualified painter; expose a public chart contract.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{babel}=require('./market-navigator-rebuild-runtime.cjs');
require('./market-navigator-rebuild-behavior.cjs');
const base=fs.readFileSync('market-navigator-rebuild-candidate.html','utf8'),match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8;
const ast=babel.babelParse(code,'qualified-chart.js',false),functions=new Map();let moduleNode;
babel.traverse(ast,{FunctionDeclaration(p){functions.set(p.node.id?.name,p.node)},VariableDeclarator(p){if(p.node.id.name==='MNChart')moduleNode=p.node}});
const source=name=>{const n=functions.get(name);assert(n,'Missing '+name);return code.slice(n.start,n.end)};
const section=/<section class="view on" id="view-now">([\s\S]*?)<\/section>/.exec(base)[1];
const markup=section.replace(/id="([^"]+)"/g,(_,id)=>'data-mn-role="'+id+'"');
const css=[...base.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
const utilities=['short','cat','health','label','name','unit','evidenceFor','displayLabel','fmt','full','tick','baseline','obsRange','scale','dashFor','legendSample','measurementFamily','renderDensity18','bucketKey18','representative18','displayPoints18','chartIcon26','setCanvas','chartSnapshotFromSets'];
let helpers=utilities.map(source).join('\n').replace('S.catMap[id]','S.catalog.series.find(x=>x.id===id)').replace('paletteState().name',"services.paletteName?.()||'Normal'").replace('devicePixelRatio||1',"(S.canvasSize.pixelRatio==='auto'?globalThis.devicePixelRatio:S.canvasSize.pixelRatio)||1");
helpers+=`\nconst H=['1D','5D','MTD','YTD','1YR','3YR','5YR'],IDX=['risk','growth','macro'],AB={risk:'RSK',growth:'GRW',macro:'MAC'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaultColors=['#27D3F5','#FFD166','#48D597','#FF5A6F','#A78BFA','#FF9F1C','#4C78FF','#FF6EC7','#B8E43C','#AEB8C4'],slots=new Map(IDX.map((id,i)=>[id,i]));
function chartColors(ids){if(services.colors)return services.colors(ids);return Object.fromEntries(ids.map(id=>{if(!slots.has(id))slots.set(id,slots.size%10);return[id,defaultColors[slots.get(id)]]}))}
function seriesStyle(id){return services.style?.(id)||{width:2,lineStyle:'line',dash:[]}}
function paintStyle(z){return Number.isFinite(+z.lineWidth)&&z.lineStyle?{width:+z.lineWidth,lineStyle:z.lineStyle,dash:dashFor(z.lineStyle)}:seriesStyle(z.id)}
function healthEntryUrl26(id){return services.informationURL?.(id)||'#source-'+encodeURIComponent(id)}
`;
const contract=fs.readFileSync('market-navigator-rebuild-api-contract.js','utf8');
let component=code.slice(moduleNode.init.start,moduleNode.init.end);
component=component.replace('mount(host,initialState={},services){',`mount(host,initialState={},services={}){
 if(services.readOnly){const m=services.metadata||{};services={...services,metadata:{...m,derived:m.derived||{indices:{}},def:m.def||{indices:{}},catalog:m.catalog||{series:[]},health:m.health||{series:{}}},getSeries:services.getSeries||(()=>{throw Error('Frozen chart has no live data service')})}}
 if(!services.metadata?.derived||!services.metadata?.def||!services.metadata?.catalog||!services.metadata?.health||typeof services.getSeries!=='function')throw new TypeError('Canonical metadata and getSeries service are required');
 const metadata=freeze(structuredClone(services.metadata));const prepared=prepareHost(host,services);services={...prepared.services,metadata};
 const publicInitial=initialState;initialState={};
`);
component=component.replace("pickerOpen:false,...structuredClone(initialState)","pickerOpen:false,canvasSize:{width:'auto',height:'auto',pixelRatio:'auto'},axisOptions:'auto',controls:'full',...structuredClone(initialState)");
component=component.replace("let dead=false",helpers+'\n'+contract+'\n let dead=false');
component=component.replace('const getSeries=id=>services.getSeries(id),windowFor=',"const getSeries=async id=>freeze(structuredClone(await services.getSeries(id))),windowFor=");
component=component.replace("services.window(h,IDX.includes(k)?k:(S.clockIndex||'risk'))", "(services.window||canonicalWindow)(h,IDX.includes(k)?k:(S.clockIndex||'risk'))");
component=component.replace("services.available(id,h,IDX.includes(k)?k:(S.clockIndex||'risk'))", "(services.available||canonicalAvailable)(id,h,IDX.includes(k)?k:(S.clockIndex||'risk'))");
component=component.replace('async function renderNow(){', 'async function performRenderNow(){').replace('async function renderV2(){','async function performRenderV2(){');
component=component.replace('function canonicalWindow(', 'function renderNow(){const epoch=++requestEpoch;pending=true;renderError=null;const task=performRenderNow(epoch);task.catch(error=>renderFailed(error,epoch));return task}\n function renderV2(){const epoch=++requestEpoch;pending=true;renderError=null;const task=performRenderV2(epoch);task.catch(error=>renderFailed(error,epoch));return task}\n function canonicalWindow(');
component=component.replace('services.onState?.(getState())','services.onState?.(getState());services.onChange?.({options:getOptions(),snapshot:getSnapshot()})');
component=component.replace('function resize(){',"function resize(size){if(size)return resizeConfigured(size); ");
component=component.replace('services.onAnalyze(id)','services.onAnalyze?.(id)');
component=component.replace('services.onAction(action,','services.onAction?.(action,').replace('services.onInfo(nowAnalysisState(),','services.onInfo?.(nowAnalysisState(),');
component=component.replace('function destroy(){if(dead)return;','function destroy(){if(dead)return;');
component=component.replace("services.closeInfo?.()}\n const observer", "services.closeInfo?.();restoreHost()}\n const observer");
component=component.replace("const observer=new ResizeObserver(resize);observer.observe($('nowWrap'));", "try{applyOptions(publicInitial);applySize()}catch(error){restoreHost();throw error}const observer=new ResizeObserver(()=>resize());observer.observe($('nowWrap'));");

component=component.replace("$('indexInfoBtn').onclick=e=>","for(const [id,action]of Object.entries({nowAnalyze:'ai',nowData:'data',nowPrint:'print',nowMarkdown:'md',nowCsv:'csv',nowJson:'json'}))$(id).hidden=!services.onAction||(services.actions&&!services.actions.includes(action));$('indexInfoBtn').hidden=!services.onInfo;$('nowMoreBtn').hidden=!services.onAction;$('indexInfoBtn').onclick=e=>");
component=component.replaceAll('services.breadcrumb(getState().spec)','services.breadcrumb(getOptions())').replaceAll('services.lineage(getState().spec)','services.lineage(getOptions())');
component=component.replace('function publish(){if(services.namespace)', 'function publish(){renderError=null;if(services.namespace)');
component=component.replace('getState,dismissInfo()', 'getOptions,getSnapshot,configure,whenReady,renderSnapshotState,getState,dismissInfo()');
component=component.replace("S.nowRepresentation=$('nowRepresentation').value;renderNow()", "S.axisOptions='auto';S.nowRepresentation=$('nowRepresentation').value;renderNow()");
component=component.replace("${dualEligible?`<option value=\"dual\"", "${S.nowRepresentation==='native'?'<option value=\"native\" selected>Native</option>':''}${dualEligible?`<option value=\"dual\"");
component=component.replace("let rep=S.nowRepresentation==='dual'&&dualEligible?'dual':'indexed'", "let rep=S.nowRepresentation==='native'?'native':S.nowRepresentation==='dual'&&dualEligible?'dual':'indexed'");
component=component.replace("setNowFooter(w,chartMode,dualEligible);captureNowState", "chartMode=applyAxes(sets,chartMode);setNowFooter(w,chartMode,dualEligible||chartMode==='dual');captureNowState");
// Explicit axis overrides are opt-in; default scale mathematics remain byte-for-byte equivalent.
component=component.replace(source('visibleIds25'),source('visibleIds25').replace('return ids}',"return S.orderedSeries?[...S.orderedSeries.filter(id=>ids.includes(id)),...ids.filter(id=>!S.orderedSeries.includes(id))]:ids}"));
component=component.replace('scales[a]=scale(values)', "scales[a]=axisScale(a,values)");
component=component.replace("let neutralEnv=S.level===1&&!S.nowFocus", "let neutralEnv=S.level===1&&!S.nowFocus");
component=require('./market-navigator-rebuild-chart-review.cjs')(component,babel);
new vm.Script('const MNChart='+component);
const prelude=fs.readFileSync('market-navigator-rebuild-api-view.js','utf8').replace('__MN_MARKUP__',JSON.stringify(markup)).replace('__MN_CSS__',JSON.stringify(css));
const standalone=`// Market Navigator reusable chart v1. Qualified Turn 28 painter; no application globals.\n(()=>{'use strict';${prelude}\nconst MNChart=${component};globalThis.MNChart=MNChart;})();\n`;
new vm.Script(standalone);fs.writeFileSync('market-navigator-rebuild-chart.js',standalone);
const demo=fs.readFileSync('market-navigator-rebuild-custom-template.html','utf8').replace('__MN_STANDALONE__',standalone);fs.writeFileSync('market-navigator-rebuild-custom.html',demo);
let output=code.slice(0,moduleNode.init.start)+component+code.slice(moduleNode.init.end);
// Application adapters provide data/actions/styles, never a mutable chart state.
output=output.replace('const MNChart=',prelude+'\nconst MNChart=');
output=output.replace('boot();',`function rebuildNowServices(){return{...rebuildServices(),onChange:({options,snapshot})=>{Object.assign(S,{level:options.view==='overview'?1:2,index:options.anchor,h:options.horizon,componentsExpanded:options.expandedComponents,hiddenComponents:options.hiddenComponents,nowComparisons:options.comparisonSeries,nowActive:options.activeSeries,nowFocus:options.emphasis?options.activeSeries:null,nowRepresentation:options.representation,indexDisplay:options.display==='horizon'?'rebase':'fixed',nowPickerCat:options.addCategory});S.nowChartState=snapshot}}}\nboot();`);
output=output.replace('const services=rebuildServices();services.onState=result=>{Object.assign(S,result.spec);S.nowChartState=result.state;S.nowPaint25=result.paint};rebuildNow=', 'const services=rebuildNowServices();rebuildNow=');
output=output.replace('return ensureRebuildNow().getState().state','return ensureRebuildNow().getSnapshot()');
output=output.replace('const now=rebuildNow.getState();if(now.spec.level!==2||!now.state?.series.includes(id))return false;', "const nowState=rebuildNow.getSnapshot(),nowOptions=rebuildNow.getOptions();if(nowOptions.view==='overview'||!nowState?.series.includes(id))return false;");
output=output.replace("services.breadcrumb=spec=>'Analyze / '+displayLabel(spec.index);services.lineage=spec=>'ANALYZE/'+displayLabel(spec.index)","services.breadcrumb=options=>'Analyze / '+displayLabel(options.anchor);services.lineage=options=>'ANALYZE/'+displayLabel(options.anchor)");
output=output.replace('beforeRender:()=>rebuildRefreshData(),selectionInformation:false,','beforeRender:()=>rebuildRefreshData(),selectionInformation:false,colors:chartColors,style:seriesStyle,paletteName:()=>paletteState().name,informationURL:healthEntryUrl26,');
output=output.replace("MNChart.mount($('view-now'),{},services)","MNChart.mount($('view-now'),{view:'overview'},services)");
output=output.replace("{level:2,index:id,clockIndex:now.spec.index,anchored:true,componentsExpanded:false,nowComparisons:[],nowActive:id,nowFocus:id,h:now.spec.h,indexDisplay:now.spec.indexDisplay,nowRepresentation:now.spec.nowRepresentation}","{view:'series',anchor:id,series:[id],clockIndex:nowOptions.clockIndex||nowState.root,activeSeries:id,emphasis:true,horizon:nowOptions.horizon,display:nowOptions.display,representation:nowOptions.representation==='dual'?'indexed':nowOptions.representation}");
output=output.replace("const spec=rebuildNow.getState().spec;rebuildDataApplying=true", "const options=rebuildNow.getOptions();rebuildDataApplying=true");
output=output.replace("MNChart.mount($('view-now'),spec,rebuildServices())", "MNChart.mount($('view-now'),options,rebuildNowServices())");
output=output.replace("ensureRebuildNow().update({level:1,index:null,componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:null,nowFocus:null})", "ensureRebuildNow().configure({view:'overview'})");
output=output.replace('while(!rebuildNow.getState().idle||!rebuildNow.getState().state)await new Promise(r=>requestAnimationFrame(r));','await rebuildNow.whenReady();');
output=output.replace('function rebuildRefreshStyles(instance){const chart=instance?.getState().state?.chart','function rebuildRefreshStyles(instance){const chart=instance?.getSnapshot()?.chart');
output=output.replace("seriesPromises:{}},spec)","seriesPromises:{}})");
output=output.replaceAll('ensureRebuildNow().update({})','ensureRebuildNow().configure({})').replace('instance.update({})','instance.configure({})');
output=require('./market-navigator-rebuild-report-review.cjs')(output,babel);
output=require('./market-navigator-rebuild-refresh-review.cjs')(output,babel);
new vm.Script(output);
fs.writeFileSync('market-navigator-rebuild-candidate.html',base.slice(0,offset)+output+base.slice(offset+code.length));
console.log('Built portable MNChart: blank-host view, isolated data/helpers, public options, explicit dimensions/axes, shared NOW/Analyze');
