// Reproducible NOW-first extraction. Every product function comes from Turn 28.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {babel}=require('./market-navigator-rebuild-runtime.cjs');
require('./market-navigator-rebuild-baseline.cjs');
const base=fs.readFileSync('market-navigator-rebuild-baseline.html','utf8'),match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8;
const ast=babel.babelParse(code,'immutable-baseline-calendar.js',false),nodes=new Map();
babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id)nodes.set(p.node.id.name,p.node)}});
function source(name){const node=nodes.get(name);assert(node,'Missing baseline function '+name);return code.slice(node.start,node.end)}
const owned=['nowBreadcrumbText','renderNowCrumb','setNowFooter','makeHz','wireNowHz','draw','renderNow','captureNowState','nowAnalysisState','renderV1','openV2','componentIds25','visibleIds25','sourceSet25','removeNowSeries25','wireLongPress25','showNowSeriesInfo25','renderV2','componentCard','pickerGroups25','openNowPicker25','renderNowPicker25','indexDisplayCurve28'];
let chart=owned.map(source).join('\n');
let painter=source('draw').replace("function draw(which,sets,w,mode='indexed')","function draw(sets,w,mode='indexed')");
const begin=painter.indexOf("let ids=which==='now'"),end=painter.indexOf('let base;',begin);assert(begin>0&&end>begin);
painter=painter.slice(0,begin)+`let c=$('nowChart'),tip=$('nowTip'),wrap=$('nowWrap'),active=S.nowActive,focusId=S.nowFocus;
function setActive(id,focus=false){active=id;S.nowActive=id;if(focus&&S.emphasisEnabled!==false)S.nowFocus=id;focusId=S.nowFocus;if(focus&&S.nowChartState){S.nowChartState.active=id;S.nowChartState.chart.active=id}services.onActive?.(id)}
function syncActive(){const legend=$('legend');if(legend)legend.querySelectorAll('[data-id],[data-lib-series]').forEach(e=>e.classList.toggle('active',(e.dataset.id||e.dataset.libSeries)===active))}
`+painter.slice(end);
painter=painter.replace("which==='now'&&S.level===1&&!S.nowFocus","S.level===1&&!S.nowFocus").replace("which==='now'&&S.level!==1","services.selectionInformation!==false&&S.level!==1");
assert(!painter.includes('which'),'Chart painter cannot depend on consumer identity');
chart=chart.replace(source('draw'),painter).replaceAll("draw('now',",'draw(').replaceAll('renderCrumb();','renderNowCrumb();');
chart=chart.replace('()=>openStandaloneAnalysis26(id)','()=>services.onAnalyze(id)');
chart=chart.replaceAll('b.addEventListener(','listenLegend(b,');
chart=chart.replace('function renderV1(){','function renderV1(){if(dead)return;pending=false;S.v2RenderSeq++;clearLegend();');
chart=chart.replace('async function renderV2(){','async function renderV2(){if(dead)return;pending=true;');
chart=chart.replace('if(seq!==S.v2RenderSeq)return;','if(dead||seq!==S.v2RenderSeq)return;clearLegend();');
chart=chart.replace("$('nowChart').dataset.emphasis='false'","$('nowChart').dataset.emphasis='false';publish()").replace('draw(sets,w,chartMode)','draw(sets,w,chartMode);publish()');
chart=chart.replace('function openNowPicker25(){','function openNowPicker25(){S.pickerOpen=true;').replace('if(S.nowPickerToken25!==token)return;','if(dead||!S.pickerOpen||S.nowPickerToken25!==token)return;');
chart=chart.replace('t=setTimeout(()=>{long=true;showNowSeriesInfo25(id)},450)','t=schedule(()=>{long=true;showNowSeriesInfo25(id)},450)');
const moduleCode=`
const MNChart=Object.freeze({mount(host,initialState={},services){
 const S={level:1,index:null,h:'5D',componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:null,nowFocus:null,nowRepresentation:null,indexDisplay:'fixed',nowPickerCat:'Other',v2RenderSeq:0,nowPaint25:null,nowChartState:null,pickerOpen:false,...structuredClone(initialState)};
 for(const key of ['derived','def','health','catalog','sourceRegistry'])Object.defineProperty(S,key,{get:()=>services.metadata[key]});
 let dead=false,pending=false,visible=true,frame=0;const timers=new Set();let legendSignal=new AbortController();const lifetime=new AbortController();
 const $=id=>services.roles?.[id]||host.querySelector('[id="'+id+'"]');
 const getSeries=id=>services.getSeries(id),windowFor=(h=S.h,k=S.index||'risk')=>services.window(h,k),seriesAvailable=(id,h=S.h,k=S.index||'risk')=>services.available(id,h,k);
 function clearLegend(){legendSignal.abort();legendSignal=new AbortController();for(const timer of timers)clearTimeout(timer);timers.clear()}
 function listenLegend(el,type,fn){el.addEventListener(type,fn,{signal:legendSignal.signal})}
 function schedule(fn,delay){const timer=setTimeout(()=>{timers.delete(timer);if(!dead)fn()},delay);timers.add(timer);return timer}
 function getState(){return structuredClone({spec:Object.fromEntries(['level','index','h','componentsExpanded','hiddenComponents','nowComparisons','nowActive','nowFocus','nowRepresentation','indexDisplay','nowPickerCat'].map(k=>[k,S[k]])),state:S.nowChartState,paint:S.nowPaint25,idle:!pending})}
 function publish(){pending=false;services.onState?.(getState())}
 ${chart}
 function resize(){if(dead||!visible||frame)return;frame=requestAnimationFrame(()=>{frame=0;if(S.nowPaint25){const p=S.nowPaint25;draw(p.sets,p.w,p.mode)}})}
 function closePicker(){S.pickerOpen=false;S.nowPickerToken25=null;$('nowPicker')?.classList.add('hidden');$('nowSeriesAbout')?.classList.add('hidden')}
 function destroy(){if(dead)return;dead=true;S.v2RenderSeq++;lifetime.abort();clearLegend();observer.disconnect();cancelAnimationFrame(frame);for(const element of host.querySelectorAll('*'))for(const event of ['onclick','oninput','onchange','oncontextmenu','onpointermove','onpointerdown','ontouchstart','ontouchmove'])element[event]=null;services.closeInfo?.()}
 const observer=new ResizeObserver(resize);observer.observe($('nowWrap'));
 if(!services.readOnly){
  $('nowPickerSearch').oninput=renderNowPicker25;$('nowPickerClose').onclick=closePicker;
  $('nowMoreBtn').onclick=()=>$('nowMoreMenu').classList.toggle('hidden');
  for(const [id,action]of Object.entries({nowAnalyze:'ai',nowData:'data',nowPrint:'print',nowMarkdown:'md',nowCsv:'csv',nowJson:'json'}))$(id).onclick=()=>{$('nowMoreMenu').classList.add('hidden');services.onAction(action,nowAnalysisState(),$('nowChart'))};
  $('indexInfoBtn').onclick=e=>{e.stopPropagation();services.onInfo(nowAnalysisState(),$('indexInfoBtn'))};
  wireNowHz();renderNow();
 }
 return Object.freeze({getState,update(patch={}){if(dead)return;Object.assign(S,structuredClone(patch));wireNowHz();return renderNow()},resize,setVisible(value){visible=!!value;if(visible)resize();else{for(const timer of timers)clearTimeout(timer);timers.clear();services.closeInfo?.()}},destroy,refreshCrumb:renderNowCrumb,
  renderSnapshot(sets,w,mode,active){S.nowActive=active;S.nowPaint25=structuredClone({sets,w,mode});draw(S.nowPaint25.sets,S.nowPaint25.w,mode)}
 });
}});window.MNChart=MNChart;
let rebuildNow=null,rebuildLibrary=null;
function readOnly(value){if(value&&typeof value==='object'){for(const child of Object.values(value))readOnly(child);Object.freeze(value)}return value}
function rebuildServices(){return{metadata:readOnly(structuredClone({derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry})),getSeries:async id=>readOnly(structuredClone(await getSeries(id))),window:horizonWindow,available:seriesAvailable,onAnalyze:openStandaloneAnalysis26,
 onInfo:()=>mnxOpenExplanation(),closeInfo:()=>{mnxCloseExplanation();$('dataModal').classList.add('hidden')},
 onAction:(action,state,canvas)=>{if(action==='ai')return startAI(mnxShipState(state));if(action==='data')return openData17(state);if(action==='print')return mnxPrintNow(state);return downloadState(state,'market-navigator-'+state.lineage.toLowerCase()+'-'+state.horizon,action)}}}
function ensureRebuildNow(){if(!rebuildNow){const services=rebuildServices();services.onState=result=>{Object.assign(S,result.spec);S.nowChartState=result.state;S.nowPaint25=result.paint};rebuildNow=MNChart.mount($('view-now'),{},services)}return rebuildNow}
window.__mnRebuild={now:()=>rebuildNow?.getState(),instances:()=>({now:rebuildNow,library:rebuildLibrary})};
`;
const edits=[];
for(const name of owned){const node=nodes.get(name);let replacement='';
 if(['renderNow','renderV1','renderV2'].includes(name))replacement=`function ${name}(){return ensureRebuildNow().update(${name==='renderV1'?'{level:1,index:null,componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowActive:null,nowFocus:null}':'{}'})}`;
 if(name==='renderNowCrumb')replacement='function renderNowCrumb(){rebuildNow?.refreshCrumb()}';
 if(name==='nowAnalysisState')replacement='function nowAnalysisState(){return ensureRebuildNow().getState().state}';
 if(name==='draw')replacement=`function draw(which,sets,w,mode='indexed'){if(which!=='library')throw Error('Legacy chart creation path is retired');if(!rebuildLibrary){let services=rebuildServices();services.readOnly=true;services.selectionInformation=false;services.roles={nowChart:$('libChart'),nowTip:$('libChartTip'),nowWrap:$('libChartWrap'),legend:$('libChartLegend')};services.onActive=id=>{S.libraryActive=id};rebuildLibrary=MNChart.mount($('libChartWrap'),{level:2,emphasisEnabled:false},services)}rebuildLibrary.renderSnapshot(sets,w,mode,S.libraryActive)}`;
 edits.push({start:node.start,end:node.end,text:replacement});
}
for(const node of ast.program.body[0].expression.callee.body.body){if(node.type==='ExpressionStatement'){const text=code.slice(node.start,node.end);if(/^wireNowHz\(\)/.test(text)||/^\$\('now(?:Picker|More|Analyze|Data|Print|Markdown|Csv|Json)/.test(text))edits.push({start:node.start,end:node.end,text:''})}}
let output=code;for(const edit of edits.sort((a,b)=>b.start-a.start))output=output.slice(0,edit.start)+edit.text+output.slice(edit.end);
output=output.replace('function geometryRepaint25(){','function geometryRepaint25(){if(rebuildNow){rebuildNow.resize();return}').replace('function setupGeometry25(){','function setupGeometry25(){return;');
output=output.replace('boot();',moduleCode+'\nboot();');new vm.Script(output);
fs.writeFileSync('market-navigator-rebuild-now.html',base.slice(0,offset)+output+base.slice(offset+code.length));
fs.writeFileSync('market-navigator-rebuild-extraction.json',JSON.stringify({baselineBlob:'9ce7f67451f9e1b7804927ce5c56adb667614724',productDonors:['immutable Turn 28'],functions:owned,interface:'MNChart.mount(host, initialState, services)',stage:'NOW extraction; Analyze not reintroduced'},null,2));
console.log('Built independent NOW extraction:',owned.length,'accepted functions');
