// Reintroduce Analyze only after the independently passing NOW checkpoint.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm');
const {babel}=require('./market-navigator-rebuild-runtime.cjs');
require('./market-navigator-rebuild-chart.cjs');
const base=fs.readFileSync('market-navigator-rebuild-now.html','utf8'),match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8;
const ast=babel.babelParse(code,'passing-now.js',false),nodes=new Map();
babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id)nodes.set(p.node.id.name,p.node)}});
const edits=[];function alter(name,fn){const n=nodes.get(name);assert(n,'Missing function '+name);const old=code.slice(n.start,n.end);edits.push({start:n.start,end:n.end,text:fn(old)});}
alter('nowBreadcrumbText',s=>s.replace("if(S.level===1)","if(services.breadcrumb)return services.breadcrumb(getState().spec);if(S.level===1)"));
alter('renderNowCrumb',s=>s.replace("if(S.level===1){","if(services.breadcrumb){c.innerHTML='<span class=\"chromeCrumbText\">'+esc(full)+'</span>';return}if(S.level===1){"));
alter('captureNowState',s=>s.replace("lineage:S.level===1?'ENV':","lineage:services.lineage?services.lineage(getState().spec):S.level===1?'ENV':"));
alter('renderV2',s=>s.replace("textContent=AB[k]","textContent=displayLabel(k)").replace("if(id===k&&!S.componentsExpanded)","if(id===k&&!S.componentsExpanded&&!S.anchored)"));
alter('showNowSeriesInfo25',s=>s.replace('<button class="btn analyzeIcon26" id="analyzeNowSeries26" title="Analyze" aria-label="Analyze">${chartIcon26()}</button>','${services.canAnalyze===false?\'\':`<button class="btn analyzeIcon26" id="analyzeNowSeries26" title="Analyze" aria-label="Analyze">${chartIcon26()}</button>`}').replace("$('analyzeNowSeries26').onclick=","if($('analyzeNowSeries26'))$('analyzeNowSeries26').onclick="));
alter('nav',s=>s.replace('function nav(v)','function rebuildNavigateBase(v)'));
alter('openStandaloneAnalysis26',()=>`async function openStandaloneAnalysis26(id){
 if(S.view!=='now'||rebuildAnalyze||!rebuildNow)return false;
 const now=rebuildNow.getState();if(now.spec.level!==2||!now.state?.series.includes(id))return false;
 const services=rebuildServices();services.canAnalyze=false;services.namespace='mn-analyze-';services.breadcrumb=spec=>'Analyze / '+displayLabel(spec.index);services.lineage=spec=>'ANALYZE/'+displayLabel(spec.index);
 rebuildAnalyze=MNChart.mount($('view-analyze'),{level:2,index:id,clockIndex:now.spec.index,anchored:true,componentsExpanded:false,nowComparisons:[],nowActive:id,nowFocus:id,h:now.spec.h,indexDisplay:now.spec.indexDisplay,nowRepresentation:now.spec.nowRepresentation},services);
 nav('now');return true;
}`);
alter('closeStandaloneAnalysis26',()=>`function closeStandaloneAnalysis26(){
 if(!rebuildAnalyze)return;rebuildAnalyze.destroy();rebuildAnalyze=null;nav('now');
}`);
const obsolete=['captureAnalysisState17','standaloneAnalysisState26','analysisWindow26','renderAnalysisHz26','renderStandaloneAnalysis26','openAnalysisPicker26','renderAnalysisPicker26','analysisMarkdown26','analysisCsv26','analysisPrintStandalone26','downloadAnalysisState'];
for(const name of obsolete)alter(name,()=>name==='standaloneAnalysisState26'?'function standaloneAnalysisState26(){return rebuildAnalyze?.getState().state||null}':'');
alter('mnxOpenExplanation',s=>s.replace('function mnxOpenExplanation(){','function mnxOpenExplanation(stateOverride=null){').replace('let state=S.nowChartState?nowAnalysisState():null','let state=stateOverride||(S.nowChartState?nowAnalysisState():null)'));
for(const node of ast.program.body[0].expression.callee.body.body){if(node.type!=='ExpressionStatement')continue;const text=code.slice(node.start,node.end);if(/^\$\('(?:standaloneAnalysis26|analysis(?:Close26|More26|PickerClose26|PickerSearch26|AI26|Data26|Print26|Markdown26|Csv26|Json26))'\)/.test(text))edits.push({start:node.start,end:node.end,text:''});}
let output=code;for(const e of edits.sort((a,b)=>b.start-a.start))output=output.slice(0,e.start)+e.text+output.slice(e.end);
output=output.replace('let rebuildNow=null,rebuildLibrary=null;','let rebuildNow=null,rebuildLibrary=null,rebuildAnalyze=null;');
output=output.replace("const $=id=>services.roles?.[id]||host.querySelector('[id=\"'+id+'\"]');","const $=id=>services.roles?.[id]||host.querySelector('[data-mn-role=\"'+id+'\"]')||host.querySelector('[id=\"'+id+'\"]');");
output=output.replace("services.window(h,k)","services.window(h,IDX.includes(k)?k:(S.clockIndex||'risk'))");
output=output.replace("'nowPickerCat'].map","'nowPickerCat','anchored','clockIndex'].map");
output=output.replace('function publish(){pending=false;','function publish(){if(services.namespace)for(const el of host.querySelectorAll(\'[id]\'))if(!el.dataset.mnRole){el.dataset.mnRole=el.id;el.id=services.namespace+el.id}pending=false;');
output=output.replace('onInfo:()=>mnxOpenExplanation()','onInfo:state=>mnxOpenExplanation(state)');
output=output.replace("now:()=>rebuildNow?.getState(),instances:()=>({now:rebuildNow,library:rebuildLibrary})","now:()=>rebuildNow?.getState(),analyze:()=>rebuildAnalyze?.getState(),instances:()=>({now:rebuildNow,analyze:rebuildAnalyze,library:rebuildLibrary})");
output=output.replace('if(visible)resize();else{','if(visible)resize();else{cancelAnimationFrame(frame);frame=0;');
output=output.replace("if(!el.dataset.mnRole){","if(!el.dataset.mnRole&&el.id!=='rebuildAnalyzeClose'){");
output=output.replace("for(const element of host.querySelectorAll('*'))for(const event", "for(const element of host.querySelectorAll('*'))if(element.id!=='rebuildAnalyzeClose')for(const event");
const navigation=`
function nav(v){
 const restore=v==='now'&&!!rebuildAnalyze;
 rebuildNow?.setVisible(v==='now'&&!restore);rebuildAnalyze?.setVisible(restore);
 rebuildNavigateBase(restore?'now':v);
 if(restore){S.view='analyze';$('view-now').classList.remove('on');$('view-analyze').classList.add('on');$('shell').classList.add('nowMode')}
}
$('rebuildAnalyzeClose').onclick=closeStandaloneAnalysis26;
`;
output=output.replace('boot();',navigation+'\nboot();');new vm.Script(output);
let html=base.slice(0,offset)+output+base.slice(offset+code.length);
const now=/<section class="view on" id="view-now">[\s\S]*?<\/section>/.exec(base)[0];
let analyze=now.replace('<section class="view on" id="view-now">','<section class="view" id="view-analyze">');
const roles=new Set([...now.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));roles.delete('view-now');for(const name of ['crumbEnvironment','crumbIndex22','nowRepresentation','nowIndexDisplay','nowAddSeries','analyzeNowSeries26','closeNowSeriesAbout'])roles.add(name);
analyze=analyze.replace(/id="([^"]+)"/g,(all,id)=>id==='view-analyze'?all:'id="mn-analyze-'+id+'" data-mn-role="'+id+'"');
analyze=analyze.replace('<div class="chromeRight">','<div class="chromeRight"><button class="btn" id="rebuildAnalyzeClose" aria-label="Close Analyze">×</button>');
html=html.replace('<section class="view" id="view-library">',analyze+'<section class="view" id="view-library">');
const modalStart=html.indexOf('<div class="modal hidden" id="standaloneAnalysis26"'),modalEnd=html.indexOf('<div class="modal hidden" id="dataModal"',modalStart);assert(modalStart>0&&modalEnd>modalStart);html=html.slice(0,modalStart)+html.slice(modalEnd);
html=html.replace(/<style>([\s\S]*?)<\/style>/g,(whole,css)=>'<style>'+css.replace(/#([a-zA-Z][\w-]*)/g,(match,id)=>id==='view-now'?':is(#view-now,#view-analyze)':roles.has(id)?':is(#'+id+',[data-mn-role="'+id+'"])':match)+'</style>');
html=html.replace('</head>','<style>#view-analyze .chromeRight{display:flex;gap:4px}#rebuildAnalyzeClose{order:2}</style></head>');
assert(!html.includes('function renderStandaloneAnalysis26'),'Retired painter survived');
fs.writeFileSync('market-navigator-rebuild-analyze.html',html);
fs.writeFileSync('market-navigator-rebuild-analyze.json',JSON.stringify({baselineBlob:'9ce7f67451f9e1b7804927ce5c56adb667614724',passingNOWCommit:'580623aafb55e80cda250321a4c72b496a213264',creation:'normal NOW only',parking:'Library hides without updating chart state; NOW restores; X destroys',initialSeries:'sole selected NOW anchor',retiredFunctions:obsolete,stage:'Analyze architecture; behavior qualification pending'},null,2));
console.log('Built separate full-page Analyze from the passing shared NOW implementation');
