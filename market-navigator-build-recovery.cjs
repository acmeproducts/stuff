// Extract the approved source itself. Rejected candidates are never inputs.
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {babel}=require('./market-navigator-recovery-runtime.cjs');
const final=process.argv.includes('--final');
const base=fs.readFileSync('market-navigator-turn28-post-ship.html','utf8');
assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(base)+'\0').update(base).digest('hex'),'9ce7f67451f9e1b7804927ce5c56adb667614724');
const match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8,ast=babel.babelParse(code,'baseline.js',false),nodes=new Map();
babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id)nodes.set(p.node.id.name,p.node)}});
const source=name=>{assert(nodes.has(name),'missing baseline function '+name);let n=nodes.get(name);return code.slice(n.start,n.end)};
const names=['nowBreadcrumbText','renderNowCrumb','setNowFooter','makeHz','wireNowHz','horizonWindow','windowFor','indexed','seriesAvailability','seriesAvailable','tick','draw','renderNow','chartSnapshotFromSets','captureNowState','nowAnalysisState','renderV1','openV2','componentIds25','visibleIds25','sourceSet25','removeNowSeries25','wireLongPress25','showNowSeriesInfo25','renderV2','componentCard','pickerGroups25','openNowPicker25','renderNowPicker25','indexDisplayCurve28'];
let extracted=names.map(source).join('\n');
// Canonical data primitives are shared with Library; always pass instance context.
const shared=['horizonWindow','windowFor','indexed','seriesAvailability','seriesAvailable','tick','chartSnapshotFromSets'];
for(const n of shared)extracted=extracted.replace(source(n),'');
extracted+=`\nfunction windowFor(h=S.h,k=S.index||'risk'){return services.window(h,k)}\nfunction seriesAvailable(id,h=S.h,k=S.index||'risk'){return services.available(id,h,k)}`;
// Remove painter identity branches while preserving its drawing/inspection body.
let painter=source('draw');
painter=painter.replace("function draw(which,sets,w,mode='indexed')","function draw(sets,w,mode='indexed')");
painter=painter.replace(/let ids=which==='now'\?[\s\S]*?let base;/,`let c=$('nowChart'),tip=$('nowTip'),wrap=$('nowWrap'),active=S.nowActive,focusId=S.nowFocus;function setActive(id,focus=false){active=id;S.nowActive=id;if(focus)S.nowFocus=id;focusId=S.nowFocus;if(focus&&S.nowChartState){S.nowChartState.active=id;if(S.nowChartState.chart)S.nowChartState.chart.active=id}}function syncActive(){$('legend').querySelectorAll('[data-id]').forEach(n=>n.classList.toggle('active',n.dataset.id===active))}let base;`);
painter=painter.replace("which==='now'&&S.level===1&&!S.nowFocus","S.level===1&&!S.nowFocus").replace("which==='now'&&S.level!==1","S.level!==1");
assert(!painter.includes('which'),'painter still depends on consumer identity');
extracted=extracted.replace(source('draw'),painter).replaceAll("draw('now',",'draw(');
extracted=extracted.replace('renderCrumb();','renderNowCrumb();').replaceAll('renderCrumb();','renderNowCrumb();');
extracted=extracted.replace('()=>openStandaloneAnalysis26(id)','()=>services.onAnalyze(id)');
extracted=extracted.replaceAll("b.addEventListener(",'listen(b,');
extracted=extracted.replace("function renderV1(){","function renderV1(){if(dead)return;pending=false;counts.renderRequests++;S.v2RenderSeq++;S.nowPickerToken25=null;S.pickerOpen=false;counts.transitions++;");
extracted=extracted.replace("async function renderV2(){","async function renderV2(){if(dead)return;pending=true;counts.renderRequests++;counts.transitions++;");
extracted=extracted.replace("if(seq!==S.v2RenderSeq)return;","if(dead||seq!==S.v2RenderSeq)return;");
extracted=extracted.replace("if(S.nowPickerToken25!==token)return;","if(dead||!S.pickerOpen||S.nowPickerToken25!==token)return;");
extracted=extracted.replace("function openNowPicker25(){","function openNowPicker25(){S.pickerOpen=true;");
extracted=extracted.replace("$('nowPicker').classList.add('hidden');renderV2()","closePicker();renderV2()");
extracted=extracted.replace("$('nowChart').dataset.emphasis='false'","$('nowChart').dataset.emphasis='false';publish()");
extracted=extracted.replace("draw(sets,w,chartMode)","draw(sets,w,chartMode);publish()");
if(final){
extracted=extracted.replace("index:S.index||'risk'", "index:S.level===1?'risk':IDX.includes(S.index)?S.index:null");
extracted=extracted.replace('function paint(cross=null){','function paint(cross=null){counts.canvasPaints++;').replace('let hit=locate(e);if(!hit)return;', 'let hit=locate(e);if(!hit)return;counts.inspections++;');
extracted=extracted.replaceAll('listen(b,','listenLegend(b,').replace('if(dead||seq!==S.v2RenderSeq)return;', 'if(dead||seq!==S.v2RenderSeq)return;clearLegendListeners();').replace('if(dead)return;pending=false;', 'if(dead)return;clearLegendListeners();pending=false;');
extracted=extracted.replace("lineage:S.level===1?'ENV':", "lineage:S.anchored?(IDX.includes(S.index)?AB[S.index]:label(S.index)):S.level===1?'ENV':");
extracted=extracted.replace("function componentIds25(){return", "function componentIds25(){return");
extracted=extracted.replace('id===k&&!S.componentsExpanded','id===k&&!S.componentsExpanded&&IDX.includes(k)');
extracted=extracted.replace('dualEligible=!!y2','dualEligible=!!y2&&sets.length>1');
extracted=extracted.replace('return services.window(h,k)','return services.window(h,IDX.includes(k)?k:S.clockIndex||\'risk\')').replace('return services.available(id,h,k)','return services.available(id,h,IDX.includes(k)?k:S.clockIndex||\'risk\')');
extracted=extracted.replace("if(S.level===1){c.innerHTML=", "if(S.anchored){let title=IDX.includes(S.index)?AB[S.index]:label(S.index);c.title=title;c.setAttribute('aria-label',title);c.innerHTML='<span class=\"chromeCrumbText\">'+esc(title)+'</span>';return}if(S.level===1){c.innerHTML=");
// Single Add keeps the accepted picker layout and grouping, removes only About.
extracted=extracted.replace('<button class="btn" data-about-now="${id}">About</button>','');
extracted=extracted.replace("$('nowPickerList').querySelectorAll('[data-about-now]').forEach(b=>b.onclick=()=>showNowSeriesInfo25(b.dataset.aboutNow));",'');
extracted=extracted.replace('function openNowPicker25(){S.pickerOpen=true;','function openNowPicker25(){$(\'nowSeriesAbout\').classList.add(\'hidden\');S.pickerOpen=true;');
extracted=extracted.replace("else S.nowComparisons=S.nowComparisons.filter(x=>x!==id);", "S.nowComparisons=S.nowComparisons.filter(x=>x!==id);");
// One pointer path on modern browsers, touch fallback on older browsers.
extracted=extracted.replace("c.onpointermove=e=>{if(e.pointerType!=='touch')inspect(e,false)}", "c.onpointermove=e=>{if(e.pointerType!=='touch'||e.buttons)inspect(e,false)}");
extracted=extracted.replace('c.onpointerdown=e=>inspect(e,true)', "c.onpointerdown=e=>{if(e.pointerType==='touch')e.preventDefault();inspect(e,true)}");
extracted=extracted.replace('c.ontouchstart=e=>', "c.ontouchstart=window.PointerEvent?null:e=>").replace('c.ontouchmove=e=>', "c.ontouchmove=window.PointerEvent?null:e=>");
extracted=extracted.replace('t=setTimeout(()=>{long=true;showNowSeriesInfo25(id)},450)','t=schedule(()=>{long=true;showNowSeriesInfo25(id)},450)');
extracted=extracted.replace("if(allowSelect&&hit.near.dist<24){sel=hit.near.z;", "if(allowSelect&&hit.near.dist<24){counts.transitions++;sel=hit.near.z;");
extracted=extracted.replace("model=paint({x:xx,y:yy,z:sel});", "S.inspection={id:sel.id,t:q.t};model=paint({x:xx,y:yy,z:sel});");
extracted=extracted.replace("tip.style.display='none';model=paint()", "S.inspection=null;tip.style.display='none';model=paint()");
extracted=extracted.replace("S.pickerOpen=false;counts.transitions++;", "S.pickerOpen=false;S.inspection=null;counts.transitions++;");
extracted=extracted.replace("pending=true;counts.renderRequests++;counts.transitions++;", "pending=true;S.inspection=null;counts.renderRequests++;counts.transitions++;");
extracted=extracted.replace('model=paint();syncActive();', `model=paint();if(S.inspection){let z=sets.find(z=>z.id===S.inspection.id),q=z?.a.find(q=>q.t===S.inspection.t);if(q){let xy=model.xy(z,q);model=paint({x:xy.x,y:xy.y,z})}}syncActive();`);
extracted=extracted.replace("$('analyzeNowSeries26').onclick=()=>services.onAnalyze(id)", "if(services.canAnalyze)$('analyzeNowSeries26').onclick=()=>services.onAnalyze(id);else $('analyzeNowSeries26').remove();indexRoles()");
}
if(final)extracted=require('./market-navigator-recovery-owner-fixes.cjs').moduleFixes(extracted);
const moduleCode=`
/* MNChart: accepted Turn 28 NOW implementation, scoped to one surface. */
const MNChart=(()=>{
function mount(host,initialState,services){
const S={level:1,index:null,h:'5D',componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:null,nowFocus:null,nowRepresentation:null,indexDisplay:'fixed',nowPickerCat:'Other',v2RenderSeq:0,nowPaint25:null,nowChartState:null,pickerOpen:false,...JSON.parse(JSON.stringify(initialState))};
for(const k of ['derived','def','health','catalog','sourceRegistry'])Object.defineProperty(S,k,{get:()=>services.metadata[k]});
const roles=new Map();
function indexRoles(){host.querySelectorAll('[id]').forEach(e=>{let id=e.dataset.mnRole||e.id;roles.set(id,e);if(services.idPrefix){e.dataset.mnRole=id;e.id=services.idPrefix+id}})}indexRoles();
const $=id=>{let el=roles.get(id);if(!el||!host.contains(el)){el=host.querySelector('[data-mn-role="'+id+'"]')||host.querySelector('[id="'+id+'"]');if(el)roles.set(id,el)}if(!el)throw Error('Missing chart role '+id);return el};
let dead=false,visible=true,pending=false,raf=0,counts={transitions:0,renderRequests:0,paints:0,canvasPaints:0,inspections:0},cleanups=[],pointerTimers=new Set();
const signal=new AbortController();
let legendSignal=new AbortController();
function listen(el,type,fn,options={}){el.addEventListener(type,fn,{...options,signal:options.signal||signal.signal})}
function listenLegend(el,type,fn){listen(el,type,fn,{signal:legendSignal.signal})}
function clearLegendListeners(){legendSignal.abort();legendSignal=new AbortController();pointerTimers.forEach(clearTimeout);pointerTimers.clear()}
const getSeries=id=>services.getSeries(id);
function closePicker(){S.pickerOpen=false;S.nowPickerToken25=null;$('nowPicker').classList.add('hidden');$('nowSeriesAbout').classList.add('hidden')}
function schedule(fn,delay){let t=setTimeout(()=>{pointerTimers.delete(t);if(!dead)fn()},delay);pointerTimers.add(t);return t}
function publish(){pending=false;indexRoles();counts.paints++;services.onState?.(getState());}
function getState(){let spec={};for(const k of ['level','index','h','componentsExpanded','hiddenComponents','nowComparisons','nowActive','nowFocus','nowRepresentation','indexDisplay','nowPickerCat','pickerOpen','clockIndex','anchored','inspection'])spec[k]=S[k];return JSON.parse(JSON.stringify({spec,state:S.nowChartState,paint:S.nowPaint25,counts,idle:!pending}));}
${extracted}
$('nowPickerSearch').oninput=renderNowPicker25;$('nowPickerClose').onclick=closePicker;
$('nowMoreBtn').onclick=()=>$('nowMoreMenu').classList.toggle('hidden');
for(const [id,action]of Object.entries({nowAnalyze:'ai',nowData:'data',nowPrint:'print',nowMarkdown:'md',nowCsv:'csv',nowJson:'json'}))$(id).onclick=()=>{$('nowMoreMenu').classList.add('hidden');return services.onAction(action,nowAnalysisState(),$('nowChart'))};
$('indexInfoBtn').onclick=e=>{e.preventDefault();e.stopPropagation();services.onInfo(nowAnalysisState(),$('indexInfoBtn'))};
listen($('indexInfoBtn'),'pointerdown',e=>e.stopPropagation());listen($('indexInfoBtn'),'touchstart',e=>e.stopPropagation(),{passive:true});
const observer=new ResizeObserver(()=>resize());observer.observe($('nowWrap'));
function resize(){if(dead||!visible||raf)return;raf=requestAnimationFrame(()=>{raf=0;if(S.nowPaint25&&visible){let p=S.nowPaint25;draw(p.sets,p.w,p.mode)}})}
function setVisible(value){value=!!value;if(value===visible)return;visible=value;if(!visible){pointerTimers.forEach(clearTimeout);pointerTimers.clear();services.closeInfo?.()}else resize()}
function destroy(){if(dead)return;dead=true;signal.abort();legendSignal.abort();observer.disconnect();cancelAnimationFrame(raf);pointerTimers.forEach(clearTimeout);pointerTimers.clear();S.v2RenderSeq++;closePicker();for(const e of host.querySelectorAll('*'))for(const k of ['onclick','oninput','onchange','oncontextmenu','onpointermove','onpointerdown','ontouchstart','ontouchmove'])e[k]=null;services.closeInfo?.();cleanups.forEach(f=>f());}
wireNowHz();renderNow();
return Object.freeze({getState,isIdle:()=>!pending,update(patch){if(dead)return;Object.assign(S,JSON.parse(JSON.stringify(patch)));wireNowHz();return renderNow()},resize,setVisible,destroy,refreshCrumb:renderNowCrumb,showSeriesInfo:showNowSeriesInfo25});
}return Object.freeze({mount});})();window.MNChart=MNChart;
let recoveryNow=null,recoveryAnalyze=null;
const recoveryTemplate=$('view-now').innerHTML;
function recoveryServices(onState){return {metadata:{derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry},getSeries,window:horizonWindow,available:seriesAvailable,
onState,canAnalyze:true,onAnalyze:openStandaloneAnalysis26,onInfo:(st,button)=>mnxOpenExplanation(st,button),closeInfo:()=>{mnxCloseExplanation();$('dataModal').classList.add('hidden')},
onAction:(action,st,canvas)=>{st=mnxShipState(st);if(action==='ai')return startAI(st);if(action==='data')return openData17(st);if(action==='print')return mnxPrintNow(st,canvas);return downloadState(st,'market-navigator-'+st.lineage.toLowerCase()+'-'+st.horizon,action)}}}
function recoveryEnsureNow(){if(!recoveryNow){recoveryNow=MNChart.mount($('view-now'),{},recoveryServices(x=>{Object.assign(S,x.spec);S.nowChartState=x.state;S.nowPaint25=x.paint}));}return recoveryNow}
window.__mnRecovery={now:()=>recoveryNow?.getState(),analyze:()=>recoveryAnalyze?.getState()||null,idle:()=>!!recoveryNow?.isIdle()&&(!recoveryAnalyze||recoveryAnalyze.isIdle()),instances:()=>({now:recoveryNow,analyze:recoveryAnalyze})};
`;
const replacements=[];
for(const name of names){if(shared.includes(name))continue;let n=nodes.get(name);let replacement='';if(['renderNow','renderV1','renderV2'].includes(name))replacement=`function ${name}(){return recoveryEnsureNow().update(${name==='renderV1'?'{level:1,index:null,componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:null,nowFocus:null}':'{}'})}`;if(name==='renderNowCrumb')replacement='function renderNowCrumb(){return recoveryNow?.refreshCrumb()}';if(name==='nowAnalysisState')replacement='function nowAnalysisState(){return recoveryEnsureNow().getState().state}';if(name==='draw'){
// Library remains on its accepted path; remove dead NOW/Analyze branches from it.
replacement=source('draw').replace(/let ids=which==='now'\?[\s\S]*?let base;/,"let c=$('libChart'),tip=$('libChartTip'),wrap=$('libChartWrap'),active=S.libraryActive,focusId=null;function setActive(id){active=id;S.libraryActive=id}function syncActive(){document.querySelectorAll('#libChartLegend [data-lib-series]').forEach(n=>n.classList.toggle('active',n.dataset.libSeries===active))}let base;").replace("which==='now'&&S.level===1&&!S.nowFocus","false").replace(/if\(which==='now'&&S.level!==1\)\{[\s\S]*?componentCard\(sel.id\)\}\}/,'');
}replacements.push({start:n.start,end:n.end,text:replacement});}
// Existing top-level NOW handlers are replaced by the instance-owned handlers above.
const body=ast.program.body[0].expression.callee.body.body;
for(const n of body){if(n.type==='ExpressionStatement'){let s=code.slice(n.start,n.end);if(/^wireNowHz\(\)/.test(s)||/^\$\('now(?:Picker|More|Analyze|Data|Print|Markdown|Csv|Json)/.test(s))replacements.push({start:n.start,end:n.end,text:''});}}
let out=code;for(const p of replacements.sort((a,b)=>b.start-a.start))out=out.slice(0,p.start)+p.text+out.slice(p.end);
out=out.replace('function mnxOpenExplanation(){','function mnxOpenExplanation(stateOverride,buttonOverride){').replace('let state=S.nowChartState?nowAnalysisState():null,snap=mnxExplain(state);','let state=stateOverride||(S.nowChartState?nowAnalysisState():null),snap=mnxExplain(state);').replace("body=$('mnxBody'),btn=$('indexInfoBtn');","body=$('mnxBody'),btn=buttonOverride||$('indexInfoBtn');");
out=out.replace('let mnxExplanationFrozen=null;','let mnxInfoButton=null;let mnxExplanationFrozen=null;').replace("body=$('mnxBody'),btn=buttonOverride||$('indexInfoBtn');","body=$('mnxBody'),btn=buttonOverride||$('indexInfoBtn');mnxInfoButton=btn;").replace("let modal=$('mnxModal'),btn=$('indexInfoBtn');","let modal=$('mnxModal'),btn=mnxInfoButton||$('indexInfoBtn');");
out=out.replace("let modal=$('mnxModal'),btn=mnxInfoButton||$('indexInfoBtn');","let modal=$('mnxModal'),btn=mnxInfoButton||$('indexInfoBtn');mnxInfoButton=null;");
// Module owns the info-button event path; retained modal close/copy/download remain shared services.
out=out.replace(/  let btn=\$\('indexInfoBtn'\);\n  if\(btn\)\{[\s\S]*?\n  \}/,"  let btn=$('indexInfoBtn');");
out=out.replace('function mnxBuildNowPrintReport(stateOverride){','function mnxBuildNowPrintReport(stateOverride,canvasOverride){').replace("let canvas=$('nowChart');","let canvas=canvasOverride||$('nowChart');");
out=out.replace('async function mnxPrintNow(stateOverride){','async function mnxPrintNow(stateOverride,canvasOverride){').replace('mnxBuildNowPrintReport(stateOverride);','mnxBuildNowPrintReport(stateOverride,canvasOverride);');
out=out.replace('built=mnxBuildNowPrintReport(stateOverride),','built=mnxBuildNowPrintReport(stateOverride,canvasOverride),');
out=out.replace('function geometryRepaint25(){',"function geometryRepaint25(){if(recoveryNow){recoveryNow.resize();return}");
out=out.replace('function setupGeometry25(){','function setupGeometry25(){return;');
// Insert before boot() executes; retained application closure supplies data/action services.
let lifecycle='';
if(final){
const retired=['legend','geometryRepaint25','setupGeometry25','captureAnalysisState17','openStandaloneAnalysis26','closeStandaloneAnalysis26','standaloneAnalysisState26','analysisWindow26','sourceSetStandalone26','renderAnalysisHz26','renderStandaloneAnalysis26','openAnalysisPicker26','renderAnalysisPicker26','analysisMarkdown26','analysisCsv26','analysisPrintStandalone26'];
const ast2=babel.babelParse(out,'extracted.js',false),removals=[];
babel.traverse(ast2,{FunctionDeclaration(p){if(retired.includes(p.node.id?.name))removals.push({start:p.node.start,end:p.node.end})},ExpressionStatement(p){let s=out.slice(p.node.start,p.node.end);if(/^\$\('analysis(?:Close|More|Picker|AI|Data|Print|Markdown|Csv|Json)/.test(s)||/^\$\('standaloneAnalysis26'\)\.addEventListener/.test(s))removals.push({start:p.node.start,end:p.node.end})}});
const disjoint=removals.filter(n=>!removals.some(m=>m!==n&&m.start<=n.start&&m.end>=n.end));
for(const n of disjoint.sort((a,b)=>b.start-a.start))out=out.slice(0,n.start)+out.slice(n.end);
out=out.replace('if(neutralEnv){active=null;S.nowActive=null;S.nowFocus=null}','');
lifecycle=`
function geometryRepaint25(){recoveryNow?.resize();recoveryAnalyze?.resize()}
function setupGeometry25(){}
function recoveryWorkspace(){let host=$('view-analyze');if(host){let on=S.view==='now';host.classList.toggle('on',on);$('view-now').classList.toggle('on',!on&&S.view==='now');recoveryNow.setVisible(false);recoveryAnalyze.setVisible(on)}else recoveryNow?.setVisible(S.view==='now')}
async function openStandaloneAnalysis26(id){if(S.view!=='now'||recoveryAnalyze||(!IDX.includes(id)&&!S.catMap[id]))return false;let spec=recoveryNow.getState().spec;let host=document.createElement('section');host.id='view-analyze';host.className='view on mnAnalyzeSurface';host.setAttribute('aria-label','Analyze');host.innerHTML=recoveryTemplate;$('view-now').after(host);let close=document.createElement('button');close.className='btn';close.textContent='×';close.setAttribute('aria-label','Close Analyze');close.dataset.analyzeClose='';close.onclick=closeStandaloneAnalysis26;host.querySelector('.chromeRight').append(close);let services=recoveryServices();services.canAnalyze=false;services.idPrefix='mnchart-analysis-';recoveryNow.setVisible(false);$('nowSeriesAbout').classList.add('hidden');recoveryAnalyze=MNChart.mount(host,{level:2,index:id,h:spec.h,clockIndex:spec.index||'risk',anchored:true,componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:id,nowFocus:id,indexDisplay:spec.indexDisplay,nowRepresentation:spec.nowRepresentation},services);recoveryWorkspace();return true}
function closeStandaloneAnalysis26(){if(!recoveryAnalyze)return;recoveryAnalyze.destroy();recoveryAnalyze=null;$('view-analyze').remove();nav('now');recoveryNow.resize()}
function standaloneAnalysisState26(){return recoveryAnalyze?.getState().state||null}
`;
out=out.replace("renderCrumb();if(v==='library')", "renderCrumb();recoveryWorkspace();if(v==='library')");
out=out.replace("function renderNowCrumb(){return recoveryNow?.refreshCrumb()}","function renderNowCrumb(){return (recoveryAnalyze||recoveryNow)?.refreshCrumb()}");
out=out.replace("state:()=>S.analysisChartState?JSON.parse(JSON.stringify(S.analysisChartState)):null,open:","state:standaloneAnalysisState26,open:");
out=out.replace("nowState:()=>S.nowChartState?JSON.parse(JSON.stringify(S.nowChartState)):null,", "nowState:()=>recoveryNow?.getState().state||null,");
}
if(final)out=require('./market-navigator-recovery-owner-fixes.cjs').applicationFixes(out,babel);
out=out.replace('boot();',moduleCode+'\n'+lifecycle+'\nboot();');
new vm.Script(out);
let html=base.slice(0,offset)+out+base.slice(offset+code.length);
if(final){
html=html.replace('.mnxInfo{','.mnxBody a{color:var(--accent)}\n.mnxInfo{');
html=html.replace(/<div class="modal hidden" id="standaloneAnalysis26"[\s\S]*?(?=<div class="modal hidden" id="dataModal")/,'');
html=html.replace(/<style>([\s\S]*?)<\/style>/,(whole,css)=>'<style>'+css.replace(/#(nowPicker|nowTip|indexInfoBtn)(?![\w-])/g,(_,id)=>':is(#'+id+',[data-mn-role="'+id+'"])')+`\n.mnAnalyzeSurface .chromeRight{gap:4px}.mnAnalyzeSurface .chromeRight .btn{padding:6px 8px}@media(max-width:700px){.mnAnalyzeSurface .chartChromeRow{grid-template-columns:minmax(36px,58px) minmax(0,1fr) 60px}.mnAnalyzeSurface .chromeRight .btn{padding:5px 6px;font-size:10px}}\n`+'</style>');
}
fs.writeFileSync(final?'market-navigator-recovery-candidate.html':'market-navigator-recovery-now.html',html);
fs.writeFileSync('market-navigator-recovery-extraction.json',JSON.stringify({baselineBlob:'9ce7f67451f9e1b7804927ce5c56adb667614724',extractedFunctions:names,donors:[],interface:'MNChart.mount(host, initialState, services)'},null,2));
console.log('Built NOW extraction from verified Turn 28',names.length,'functions');
