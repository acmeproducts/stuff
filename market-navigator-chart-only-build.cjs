'use strict';
// Chart-only construction from hash-pinned, pure extraction stages. No data,
// collector, calendar or later review-policy builder is loaded or executed.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const dependencies=Object.freeze({
 'market-navigator-chart-only-extract.cjs':'acc9bd25ca75a0b0bd096d5a34ff72231333e98d8ff0d919fd33fc214dd9717d',
 'market-navigator-chart-only-analyze.cjs':'bbd113e2627d2dce72575ca376f8a135c85df38165f38d7c14e6e161cbfa00d6',
 'market-navigator-rebuild-runtime.cjs':'163004f9bb10cc3a6cfc993058e7a23d06cf26bb2edf7265b87f7292239486a7'
});
for(const [name,expected] of Object.entries(dependencies))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,name))).digest('hex'),expected,'Pinned chart-only dependency '+name);
const {babel}=require('./market-navigator-rebuild-runtime.cjs');
const directory=path.join(__dirname,'market-navigator-chart-only-review');
const baselinePath=path.join(directory,'market-navigator-turn28-post-ship.html');
const accepted=fs.readFileSync(baselinePath);
const blob=crypto.createHash('sha1').update(Buffer.from('blob '+accepted.length+'\0')).update(accepted).digest('hex');
assert.equal(blob,'9ce7f67451f9e1b7804927ce5c56adb667614724','Exact accepted post-ship source required');
const extracted=require('./market-navigator-chart-only-extract.cjs')(accepted.toString('utf8'),babel);
const base=require('./market-navigator-chart-only-analyze.cjs')(extracted,babel),match=/<script>([\s\S]*?)<\/script>/.exec(base),code=match[1],offset=match.index+8;
const ast=babel.babelParse(code,'chart-only-accepted-source',false),edits=[];
function change(name,transform){let count=0;babel.traverse(ast,{FunctionDeclaration(p){const old=code.slice(p.node.start,p.node.end);if(p.node.id?.name===name&&!(name==='draw'&&p.node.params[0]?.name==='which')&&!(name==='renderV2'&&old.includes('ensureRebuildNow()'))){count++;edits.push({start:p.node.start,end:p.node.end,text:transform(old)})}}});assert.equal(count,1,'Unique chart-only seam '+name)}
function replace(source,before,after){assert(source.includes(before),'Missing chart-only seam '+before);return source.replace(before,after)}
// Input ownership, rendering and cleanup are instance-local. Rendering equations,
// source windows, availability and compact inspection content remain accepted code.
change('publish',s=>replace(s,'services.onState?.(getState())','services.onState?.(getState());if(S.pickerOpen)void renderNowPicker25()'));
change('destroy',s=>replace(s,'observer.disconnect();','observer.disconnect();cancelAnimationFrame(frame);frame=0;'));
change('captureNowState',s=>replace(s,"index:S.index||'risk'","index:IDX.includes(S.index)?S.index:(S.level===1?'risk':null)"));
change('renderV2',s=>{
 s=s.replace("if(id===k&&!S.componentsExpanded&&!S.anchored){S.componentsExpanded=true;S.hiddenComponents=[];S.nowActive=k;S.nowFocus=k;renderV2();return}",'');
 return s;
});
change('draw',s=>{
 // Focus the actual drawn segment, without changing a single paint coordinate.
 const begin=s.indexOf('function locate(e)'),end=s.indexOf('function inspect(e,allowSelect=false)',begin);
 assert(begin>0&&end>begin,'Accepted inspection locator');
 const locator=`function segmentDistance(cx,cy,a,b){const dx=b.x-a.x,dy=b.y-a.y,d=dx*dx+dy*dy,u=d?Math.max(0,Math.min(1,((cx-a.x)*dx+(cy-a.y)*dy)/d)):0;return Math.hypot(cx-a.x-u*dx,cy-a.y-u*dy)}
 function locate(e){const r=c.getBoundingClientRect(),cx=(e.touches?.[0]?.clientX??e.clientX)-r.left,cy=(e.touches?.[0]?.clientY??e.clientY)-r.top,{p,pw,ph}=model;if(cx<p.l||cx>p.l+pw||cy<p.t||cy>p.t+ph)return null;const target=w.start+(cx-p.l)/pw*(w.end-w.start),cands=sets.filter(z=>z.a.length).map(z=>{const points=displayPoints18(z.a,w.horizon);let dist=Infinity;for(let i=0;i<points.length;i++){const q=model.xy(z,points[i]);dist=Math.min(dist,Math.hypot(cx-q.x,cy-q.y));if(i)dist=Math.min(dist,segmentDistance(cx,cy,model.xy(z,points[i-1]),q))}return{z,dist}});if(!cands.length)return null;return{cx,cy,target,near:cands.reduce((a,b)=>b.dist<a.dist?b:a)}}
 `;
 s=s.slice(0,begin)+locator+s.slice(end);
 const unwanted="if(services.selectionInformation!==false&&S.level!==1){if(IDX.includes(sel.id))$('info').classList.add('hidden');else{S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)}}";
 s=replace(s,unwanted,'');
 s=replace(s,'sel=hit.near.z;setActive(sel.id,true);syncActive();',"sel=hit.near.z;if(S.level===1&&IDX.includes(sel.id)){openV2(sel.id);return}setActive(sel.id,true);syncActive();publish();");
 // One pointer-event owner prevents a touch from selecting or opening twice.
 s=replace(s,'c.onpointerdown=e=>inspect(e,true);',"c.style.touchAction='none';c.onpointerdown=e=>{if(e.pointerType==='touch')e.preventDefault();inspect(e,true)};");
 s=replace(s,"c.ontouchstart=e=>{e.preventDefault();inspect(e,true)};c.ontouchmove=e=>{e.preventDefault();inspect(e,false)}","c.ontouchstart=null;c.ontouchmove=null");
 return s;
});
change('renderNowPicker25',()=>`async function renderNowPicker25(){
 const token=++pickerSequence,q=$('nowPickerSearch').value.toLowerCase(),groups=['Risk','Growth','Macro','Other'];S.nowPickerToken25=token;
 $('nowPickerCats').innerHTML=groups.map(x=>'<button class="cat '+(S.nowPickerCat===x?'on':'')+'" data-now-cat="'+x+'">'+x+'</button>').join('');
 $('nowPickerCats').querySelectorAll('[data-now-cat]').forEach(b=>b.onclick=()=>{S.nowPickerCat=b.dataset.nowCat;renderNowPicker25()});
 const present=visibleIds25(),ids=[...IDX,...S.catalog.series.map(x=>x.id).filter(id=>id!=='realGdp')].filter(id=>q||present.includes(id)||(IDX.includes(id)?'Other':pickerGroups25(id))===S.nowPickerCat).filter(id=>(id+' '+(IDX.includes(id)?S.def.indices[id]?.name:name(id))+' '+(IDX.includes(id)?AB[id]:label(id))).toLowerCase().includes(q));
 const pairs=await Promise.all(ids.map(async id=>[id,IDX.includes(id)?true:await seriesAvailable(id)]));if(dead||!S.pickerOpen||token!==S.nowPickerToken25)return;const available=Object.fromEntries(pairs);
 $('nowPickerList').innerHTML=ids.map(id=>{const added=present.includes(id),good=!!available[id],meta=IDX.includes(id)?{native_unit:'Index',native_cadence:'derived'}:cat(id);return '<div class="row pickerRow '+(good?'':'empty')+'"><div class="rowMain"><strong>'+esc(IDX.includes(id)?AB[id]:label(id))+' · '+esc(IDX.includes(id)?S.def.indices[id]?.name:name(id))+'</strong><span class="rowMeta">'+esc(meta.native_unit||'—')+' · '+esc(meta.native_cadence||'—')+' · '+(good?'available':'unavailable')+' for '+S.h+'</span></div><button class="btn" data-about-now="'+id+'">About</button>'+(added?'<span class="chartOnlyAdded" data-added-now="'+id+'">Added'+(id!==S.index?'<button class="chartOnlyRemove" data-picker-remove="'+id+'" aria-label="Remove '+esc(IDX.includes(id)?AB[id]:label(id))+'">×</button>':'')+'</span>':'<button class="btn" data-add-now="'+id+'" '+(good?'':'disabled aria-disabled="true"')+'>Add</button>')+'</div>'}).join('')||'<div class="rowMeta" style="padding:10px">No matching series.</div>';
 $('nowPickerList').querySelectorAll('[data-about-now]').forEach(b=>b.onclick=()=>showNowSeriesInfo25(b.dataset.aboutNow));
 $('nowPickerList').querySelectorAll('[data-add-now]').forEach(b=>b.onclick=async()=>{if(b.disabled||!S.pickerOpen)return;b.disabled=true;const id=b.dataset.addNow;if(!S.nowComparisons.includes(id))S.nowComparisons.push(id);S.nowActive=id;S.nowFocus=id;await renderV2();if(S.pickerOpen)await renderNowPicker25()});
 $('nowPickerList').querySelectorAll('[data-picker-remove]').forEach(b=>b.onclick=()=>{const id=b.dataset.pickerRemove;S.nowComparisons=S.nowComparisons.filter(x=>x!==id);removeNowSeries25(id)});
}`);
change('openStandaloneAnalysis26',()=>`async function openStandaloneAnalysis26(id){
 if(S.view!=='now'||rebuildAnalyze||!rebuildNow)return false;
 const now=rebuildNow.getState();if(now.spec.level!==2||!now.state?.series.includes(id))return false;
 const services=rebuildServices();services.canAnalyze=false;services.namespace='mn-analyze-';services.breadcrumb=spec=>'Analyze / '+displayLabel(spec.index);services.lineage=spec=>'ANALYZE/'+displayLabel(spec.index);
 rebuildNow.dismissInfo();
 rebuildAnalyze=MNChart.mount($('view-analyze'),{level:2,index:id,clockIndex:now.spec.index,anchored:true,componentsExpanded:false,nowComparisons:[],nowActive:id,nowFocus:id,h:now.spec.h,indexDisplay:now.spec.indexDisplay,nowRepresentation:now.spec.nowRepresentation==='dual'?null:now.spec.nowRepresentation},services);
 nav('now');return true;
}`);
change('closeStandaloneAnalysis26',()=>`function closeStandaloneAnalysis26(){if(!rebuildAnalyze)return;rebuildAnalyze.destroy();rebuildAnalyze=null;nav('now')}`);
change('nav',s=>{
 s=replace(s,"const restore=v==='now'","if(v==='analyze')v='now';const restore=v==='now'");
 return replace(s,"if(restore){S.view='analyze';", "if(restore){const chart=rebuildAnalyze.getState().state?.chart;if(chart?.series.some(z=>z.color!==seriesColor(z.id)||z.lineWidth!==seriesStyle(z.id).width||z.lineStyle!==seriesStyle(z.id).lineStyle))rebuildAnalyze.update({});S.view='analyze';");
});
change('repaintCharts',s=>replace(s,'function repaintCharts(){',"function repaintCharts(){if(S.view==='analyze'&&rebuildAnalyze){rebuildAnalyze.update({});return}"));
change('mnxBuildNowPrintReport',s=>{
 s=replace(s,'function mnxBuildNowPrintReport(stateOverride)','function mnxBuildNowPrintReport(stateOverride,canvasOverride)');
 return replace(s,"let canvas=$('nowChart')","let canvas=canvasOverride||$('nowChart')");
});
change('mnxPrintNow',s=>replace(replace(s,'function mnxPrintNow(stateOverride)','function mnxPrintNow(stateOverride,canvasOverride)'),'mnxBuildNowPrintReport(stateOverride)','mnxBuildNowPrintReport(stateOverride,canvasOverride)'));
// Library deliberately retains its exact original painter/controls. It is not
// another mutable chart host and no saved record is rewritten by this builder.
const originalCode=/<script>([\s\S]*?)<\/script>/.exec(accepted.toString('utf8'))[1],originalAst=babel.babelParse(originalCode,'accepted-library-painter',false);let originalDraw;
babel.traverse(originalAst,{FunctionDeclaration(p){if(p.node.id?.name==='draw')originalDraw=originalCode.slice(p.node.start,p.node.end)}});
assert(originalDraw,'Accepted Library painter');
let output=code;for(const e of edits.sort((a,b)=>b.start-a.start))output=output.slice(0,e.start)+e.text+output.slice(e.end);
output=output.replace('let dead=false,pending=false,visible=true,frame=0;','let dead=false,pending=false,visible=true,frame=0,pickerSequence=0;');
// A raw Analyze anchor inherits its originating governed clock; the accepted
// availability function itself is unchanged, just as for the window adapter.
output=replace(output,'services.available(id,h,k)',"services.available(id,h,IDX.includes(k)?k:(S.clockIndex||'risk'))");
output=replace(output,"return mnxPrintNow(state)","return mnxPrintNow(state,canvas)");
// Picker rows own only Add/remove. Existing explicit information gestures outside
// the picker retain their accepted behavior.
output=output.replace(/<button class="btn" data-about-now="'\+id\+'">About<\/button>/g,'');
output=output.replace("$('nowPickerList').querySelectorAll('[data-about-now]').forEach(b=>b.onclick=()=>showNowSeriesInfo25(b.dataset.aboutNow));",'');
const modifiedAst=babel.babelParse(output,'chart-only-final-wiring',false),finalEdits=[];
babel.traverse(modifiedAst,{FunctionDeclaration(p){if(p.node.id?.name==='draw'&&p.node.params[0]?.name==='which')finalEdits.push({start:p.node.start,end:p.node.end,text:originalDraw})}});
assert.equal(finalEdits.length,1,'Restore only original Library drawing entry');
for(const e of finalEdits)output=output.slice(0,e.start)+e.text+output.slice(e.end);
output=output.replace('getState,update(patch={})',`getState,getOptions:()=>readOnly(getState().spec),getSnapshot:()=>readOnly(getState().state),whenReady:async()=>{while(!dead&&(pending||!S.nowChartState))await new Promise(r=>requestAnimationFrame(r));return getState()},dismissInfo(){closePicker();$('nowSeriesAbout')?.classList.add('hidden')},update(patch={})`);
// A normal NOW control creates Analyze for the currently selected series.
output=output.replace('Object.assign(S,result.spec);S.nowChartState=result.state;S.nowPaint25=result.paint',"Object.assign(S,result.spec);S.nowChartState=result.state;S.nowPaint25=result.paint;const launch=$('chartOnlyAnalyze');if(launch)launch.disabled=result.spec.level!==2");
output=output.replace('boot();',`window.__chartOnly={...window.__mnRebuild,launchAnalyze:openStandaloneAnalysis26,closeAnalyze:closeStandaloneAnalysis26,navigate:nav};$('chartOnlyAnalyze').onclick=()=>{$('nowMoreMenu').classList.add('hidden');return openStandaloneAnalysis26(rebuildNow?.getState().spec.nowActive||rebuildNow?.getState().spec.index)};\nboot();`);
new vm.Script(output);
let html=base.slice(0,offset)+output+base.slice(offset+code.length);
const nowStart=html.indexOf('<section class="view on" id="view-now">'),nowEnd=html.indexOf('</section>',nowStart);assert(nowStart>=0&&nowEnd>nowStart);
const menu='<div class="nowMoreMenu hidden" id="nowMoreMenu">';
const nowMarkup=replace(html.slice(nowStart,nowEnd),menu,menu+'<button id="chartOnlyAnalyze" disabled aria-label="Analyze selected series">Analyze selected series</button>');
html=html.slice(0,nowStart)+nowMarkup+html.slice(nowEnd);
html=html.replace('</head>','<style>.chartOnlyAdded{display:inline-flex;align-items:center;gap:7px;color:var(--good);border:1px solid var(--good);border-radius:8px;padding:4px 8px;font-weight:700}.chartOnlyRemove{border:0;background:transparent;color:inherit;font-size:16px;cursor:pointer}@media(max-width:700px){#view-analyze .chartChromeRow{grid-template-columns:minmax(42px,76px) minmax(0,1fr) 64px}}</style></head>');
const destination=path.join(directory,'market-navigator-chart-only-candidate.html');
fs.writeFileSync(destination,html);
console.log(JSON.stringify({output:destination,baselineBlob:blob,dependencies,dataChanges:0,calendarPolicies:'unchanged accepted baseline',stages:'pure original NOW extraction and Analyze host only'}));
