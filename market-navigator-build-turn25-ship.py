#!/usr/bin/env python3
import pathlib, subprocess, sys

BASE="ddf275a8da943cfb8b0e9c5e610649b36424b886"
SRC="market-navigator-turn25-pre-ship.html"
OUT="market-navigator-turn25-ship.html"

def die(msg):
    raise SystemExit(msg)

def replace_once(text, old, new, label):
    n=text.count(old)
    if n != 1:
        die(f"{label}: expected 1 anchor, found {n}")
    return text.replace(old,new,1)

base=subprocess.check_output(["git","show",f"{BASE}:{SRC}"],text=True)
if "Index Movement Explanation" in base or 'id="indexInfoBtn"' in base:
    die("authoritative baseline unexpectedly contains later Index Explanation implementation")

css=r'''
/* Turn 25 Ship: objective explainability, derived-model health, dedicated NOW print */
.index-info-ship{position:absolute;right:12px;top:12px;z-index:9;width:40px;height:40px;border:0;background:transparent;color:#aebfd8;font-size:22px;line-height:40px;text-align:center;border-radius:50%;cursor:pointer;touch-action:manipulation}
.index-info-ship:hover,.index-info-ship:focus-visible{background:#16253a;color:#fff;outline:1px solid #55708f;outline-offset:-1px}
.index-info-ship[aria-expanded="true"]{background:#16253a;color:#fff}
.ship-modal{position:fixed;inset:0;z-index:90;background:rgba(1,8,18,.78);display:flex;align-items:center;justify-content:center;padding:18px}
.ship-modal[hidden]{display:none}
.ship-modal-card{width:min(980px,96vw);max-height:92vh;background:#071323;border:1px solid #263b55;border-radius:10px;box-shadow:0 20px 70px rgba(0,0,0,.55);display:flex;flex-direction:column;overflow:hidden}
.ship-modal-head{display:flex;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid #20334b;background:#0a182a;position:sticky;top:0;z-index:2}
.ship-modal-title{font-weight:800;flex:1}.ship-modal-horizon{color:#9db0c9;font-size:12px}.ship-modal-actions{display:flex;gap:8px}
.ship-modal-body{padding:16px 18px;overflow:auto;overscroll-behavior:contain}.ship-modal-body table{width:100%;border-collapse:collapse;margin:10px 0 18px}.ship-modal-body th,.ship-modal-body td{padding:7px 8px;border-bottom:1px solid #1d3047;text-align:left;vertical-align:top}.ship-modal-body th:not(:first-child),.ship-modal-body td:not(:first-child){text-align:right}.ship-modal-body h2{margin:18px 0 8px}.ship-modal-body h3{margin:14px 0 7px}.ship-status{font-size:12px;color:#9db0c9}.ship-health-tabs{display:flex;gap:8px;margin:0 0 12px}.ship-health-tabs button.active{border-color:#7b9bc1;color:#fff}.ship-model-card{border:1px solid #263b55;border-radius:8px;background:#0a1728;padding:12px;margin:10px 0}.ship-model-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:10px}.ship-model-metric{background:#081321;border:1px solid #1d3047;border-radius:6px;padding:8px}.ship-model-metric b{display:block;margin-top:3px}.ship-model-card details{margin-top:10px}.ship-model-card table{width:100%;border-collapse:collapse;margin-top:8px}.ship-model-card th,.ship-model-card td{padding:6px;border-bottom:1px solid #1d3047;text-align:right}.ship-model-card th:first-child,.ship-model-card td:first-child{text-align:left}
#nowPrintReportShip{display:none}
@media(max-width:640px){.ship-modal{padding:0}.ship-modal-card{width:100vw;max-height:100vh;height:100vh;border-radius:0}.ship-modal-head{flex-wrap:wrap}.ship-modal-title{min-width:60%}.ship-modal-actions{width:100%}.ship-modal-body{padding:12px;overflow:auto}.ship-modal-body .table-wrap{overflow-x:auto}.index-info-ship{right:8px;top:8px}}
@media print{
 body.ship-printing-now>*:not(#nowPrintReportShip){display:none!important}
 body.ship-printing-now #nowPrintReportShip{display:block!important;position:static!important;width:auto!important;height:auto!important;overflow:visible!important;background:#fff!important;color:#111!important;padding:0!important;margin:0!important}
 body.ship-printing-now #nowPrintReportShip .ship-print-chart{width:100%!important;height:auto!important;max-height:none!important;display:block!important;margin:12px 0 18px!important}
 body.ship-printing-now #nowPrintReportShip table{width:100%;border-collapse:collapse;break-inside:auto}
 body.ship-printing-now #nowPrintReportShip th,body.ship-printing-now #nowPrintReportShip td{border:1px solid #bbb;padding:5px 6px;text-align:left}
 body.ship-printing-now #nowPrintReportShip a{color:#111;text-decoration:underline}
 body.ship-printing-now #nowPrintReportShip h1,body.ship-printing-now #nowPrintReportShip h2,body.ship-printing-now #nowPrintReportShip h3{break-after:avoid}
}
'''
base=replace_once(base,"</style>",css+"\n</style>","style close")

base=replace_once(base,'<canvas id="nowChart" aria-label="Market chart"></canvas>','<canvas id="nowChart" aria-label="Market chart"></canvas><button id="indexInfoBtn" class="index-info-ship" type="button" aria-label="Explain index movement" aria-haspopup="dialog" aria-expanded="false">ⓘ</button>',"chart canvas")

modal=r'''
<div id="indexExplanationModal" class="ship-modal" hidden role="dialog" aria-modal="true" aria-labelledby="indexExplanationTitle">
 <div class="ship-modal-card">
  <div class="ship-modal-head"><div id="indexExplanationTitle" class="ship-modal-title">Index Explanation</div><div id="indexExplanationHorizon" class="ship-modal-horizon"></div><div class="ship-modal-actions"><button id="indexExplanationCopy" type="button">Copy</button><button id="indexExplanationDownload" type="button">Download MD</button><button id="indexExplanationClose" type="button" aria-label="Close">×</button></div></div>
  <div id="indexExplanationBody" class="ship-modal-body"></div>
 </div>
</div>
<section id="nowPrintReportShip" aria-hidden="true"></section>
'''
base=replace_once(base,'<section id="libraryPrintReport" aria-hidden="true"></section>',modal+'<section id="libraryPrintReport" aria-hidden="true"></section>',"library print report")

ship_js=r'''
/* Turn 25 Ship governed model/explainability/print layer. Runs inside canonical app closure and owns no parallel analytical state. */
let shipExplanationMarkdown='';
let shipExplanationRecords=[];
const SHIP_MODEL_VERSION='turn25-ship-manifest-1';
function shipIndicesInScope(){
  const ids=[];
  const add=x=>{const k=String(x||'').toLowerCase();if(['risk','growth','macro'].includes(k)&&!ids.includes(k))ids.push(k)};
  if(S.context==='ENV') ['risk','growth','macro'].forEach(add); else add(S.context);
  (S.visible||[]).forEach(add);
  return ids;
}
function shipIndexName(k){return k==='risk'?'RSK':k==='growth'?'GRW':'MAC'}
function shipHorizonBlock(k,h){return S.derived?.horizons?.[h]?.[k]||null}
function shipComponentMap(k){const arr=S.def?.indices?.[k]?.components||[];return new Map(arr.map(c=>[c.id,c]))}
function shipNum(v,d=2){return Number.isFinite(+v)?Number(v).toFixed(d):'—'}
function shipPct(v,d=1){return Number.isFinite(+v)?`${v>0?'+':''}${Number(v).toFixed(d)}%`:'—'}
function shipPp(v,d=2){return Number.isFinite(+v)?`${v>0?'+':''}${Number(v).toFixed(d)} pp`:'—'}
function shipBuildRecord(k,h){
  const b=shipHorizonBlock(k,h), defs=shipComponentMap(k), name=shipIndexName(k);
  if(!b) return {indexId:k,indexName:name,horizon:h,status:'UNAVAILABLE',reason:'No governed derived-index evidence exists for this horizon.',components:[]};
  const used=(b.components||[]).filter(c=>c.status==='used'&&Number.isFinite(+c.moveFrom100));
  const n=Number(b.componentsUsed)||used.length;
  if(!n) return {indexId:k,indexName:name,horizon:h,status:'UNAVAILABLE',reason:'No governed component attribution is available.',components:[]};
  const components=used.map(c=>{const d=defs.get(c.id)||{};const contribution=Number(c.moveFrom100)/n;return {componentId:c.id,displayName:d.name||c.name||c.id,weight:1/n,direction:d.direction||c.direction||1,transform:'baseline-normalized Indexed 100 with governed direction',baselineObservationDate:c.baselineDate||b.startDate||'',baselineValue:c.baselineValue,endObservationDate:c.latestDate||b.endDate||'',endValue:c.latestValue,indexedEnd:c.indexed,componentMovementPercent:Number(c.indexed)-100,indexContributionPercentPoints:contribution,status:c.status||'used',sourceRevision:S.derived?.revision||''}});
  const summed=components.reduce((a,c)=>a+c.indexContributionPercentPoints,0);
  const movement=Number(b.value)-100;
  const residual=movement-summed;
  const healthy=Math.abs(residual)<=0.02 && components.length===n;
  return {indexId:k,indexName:name,indexDefinitionVersion:S.def?.version||SHIP_MODEL_VERSION,evidenceRevision:S.derived?.revision||'',horizon:h,baselineDate:b.startDate||'',endDate:b.endDate||'',baselineIndexValue:100,endIndexValue:Number(b.value),indexMovementPercent:movement,components,reconciliation:{summedContribution:summed,indexMovement:movement,residual,roundingPrecision:0.02},status:healthy?'RECONCILED':'DEGRADED',reason:healthy?'':'Component attribution does not reconcile within governed tolerance.'};
}
function shipPlain(r){
  if(r.status!=='RECONCILED') return `Exact component attribution is ${r.status.toLowerCase()}. ${r.reason||'No missing contribution has been estimated.'}`;
  const sorted=[...r.components].sort((a,b)=>Math.abs(b.indexContributionPercentPoints)-Math.abs(a.indexContributionPercentPoints));
  const top=sorted[0], second=sorted[1];
  if(!top) return 'No governed component contribution is available.';
  const totalAbs=sorted.reduce((a,c)=>a+Math.abs(c.indexContributionPercentPoints),0)||1;
  const share=Math.abs(top.indexContributionPercentPoints)/totalAbs;
  const dir=r.indexMovementPercent>0.005?'increased':r.indexMovementPercent<-0.005?'decreased':'was essentially unchanged';
  if(share>=0.5) return `${r.indexName} ${dir}. ${top.displayName} was the largest governed contributor, accounting for ${shipPp(top.indexContributionPercentPoints)} of index movement.`;
  if(second) return `${r.indexName} ${dir}. The movement was distributed across components; ${top.displayName} and ${second.displayName} were the two largest governed contributors.`;
  return `${r.indexName} ${dir}. ${top.displayName} was the largest governed contributor.`;
}
function shipMarkdown(records){
  return records.map(r=>{
    let s=`## ${r.indexName} — ${r.horizon}\n\n`;
    if(r.status==='UNAVAILABLE') return s+`**Attribution status: UNAVAILABLE**\n\n${r.reason}\n\nNo contribution values have been estimated.\n`;
    s+=`**Index movement: ${shipPct(r.indexMovementPercent)}**\n\n${r.indexName} moved from **${shipNum(r.baselineIndexValue,2)} → ${shipNum(r.endIndexValue,2)}** over the selected ${r.horizon} horizon (${r.baselineDate} → ${r.endDate}).\n\n`;
    s+=`| Component | Weight | Component movement | ${r.indexName} impact |\n|---|---:|---:|---:|\n`;
    r.components.forEach(c=>{s+=`| ${c.displayName} | ${shipPct(c.weight*100,1)} | ${shipNum(c.baselineValue,2)} → ${shipNum(c.endValue,2)} · ${shipPct(c.componentMovementPercent)} | ${shipPp(c.indexContributionPercentPoints)} |\n`});
    s+=`| **${r.indexName}** | **100.0%** |  | **${shipPp(r.reconciliation.summedContribution)}** |\n\n`;
    s+=`**In simple terms:** ${shipPlain(r)}\n\n`;
    s+=`Calculation status: **${r.status}** · residual ${shipPp(r.reconciliation.residual)} · evidence revision ${r.evidenceRevision||'—'} · definition ${r.indexDefinitionVersion||'—'}\n`;
    if(r.status!=='RECONCILED') s+=`\nNo missing contribution values have been estimated.\n`;
    return s;
  }).join('\n---\n\n');
}
function shipExplanationSnapshot(){const records=shipIndicesInScope().map(k=>shipBuildRecord(k,S.horizon));return {records,markdown:shipMarkdown(records),horizon:S.horizon,evidenceRevision:S.derived?.revision||'',definitionVersion:S.def?.version||''}}
function shipRenderMarkdown(md){try{return DOMPurify.sanitize(marked.parse(md||''))}catch(e){return `<pre>${esc(md||'')}</pre>`}}
function openIndexExplanationShip(){
  const snap=shipExplanationSnapshot();shipExplanationRecords=snap.records;shipExplanationMarkdown=snap.markdown;
  const modal=$('indexExplanationModal'),body=$('indexExplanationBody');$('indexExplanationHorizon').textContent=S.horizon;body.innerHTML=shipRenderMarkdown(shipExplanationMarkdown);modal.hidden=false;$('indexInfoBtn').setAttribute('aria-expanded','true');$('indexExplanationClose').focus();
}
function closeIndexExplanationShip(){const modal=$('indexExplanationModal');modal.hidden=true;$('indexInfoBtn').setAttribute('aria-expanded','false');$('indexInfoBtn').focus()}
async function shipCopyExplanation(){if(!shipExplanationMarkdown)openIndexExplanationShip();try{await navigator.clipboard.writeText(shipExplanationMarkdown);toast('Explanation copied')}catch(e){toast('Copy unavailable')}}
function shipDownloadExplanation(){if(!shipExplanationMarkdown)openIndexExplanationShip();downloadBlob(`market-navigator-index-explanation-${S.horizon.toLowerCase()}.md`,shipExplanationMarkdown+'\n','text/markdown')}
function shipModelHealthRecord(k,h=S.horizon){
  const r=shipBuildRecord(k,h), b=shipHorizonBlock(k,h), defs=shipComponentMap(k), required=defs.size, available=r.components.length;
  if(!b||!r.components.length)return {indexId:k,indexName:shipIndexName(k),status:'SUSPENDED',replication:'FAIL',required,available,reason:r.reason||'No evidence',record:r};
  const contrib=r.components.map(c=>Math.abs(c.indexContributionPercentPoints));const totalAbs=contrib.reduce((a,x)=>a+x,0)||1;const maxIdx=contrib.indexOf(Math.max(...contrib));const largest=r.components[maxIdx];
  const moves=r.components.map(c=>c.componentMovementPercent);const canonical=r.indexMovementPercent;let stable=0;let maxLoo=0;
  moves.forEach((m,i)=>{if(moves.length<2)return;const loo=moves.filter((_,j)=>j!==i).reduce((a,x)=>a+x,0)/(moves.length-1);maxLoo=Math.max(maxLoo,Math.abs(loo-canonical));if(Math.sign(loo)===Math.sign(canonical)||Math.abs(canonical)<.005)stable++});
  let robust=0,total=0;for(let i=0;i<moves.length;i++){for(const f of [.9,1.1]){const ws=moves.map((_,j)=>j===i?f:1),den=ws.reduce((a,x)=>a+x,0),v=moves.reduce((a,x,j)=>a+x*ws[j],0)/den;total++;if(Math.sign(v)===Math.sign(canonical)||Math.abs(canonical)<.005)robust++}}
  const status=r.status==='RECONCILED'&&available===required?'ACTIVE':r.status==='RECONCILED'?'WATCH':'DEGRADED';
  return {indexId:k,indexName:r.indexName,status,replication:r.status==='RECONCILED'?'PASS':'FAIL',required,available,weightTotal:available?100:0,largestContribution:largest?`${largest.displayName} ${shipPp(largest.indexContributionPercentPoints)}`:'—',largestContributionShare:largest?Math.abs(largest.indexContributionPercentPoints)/totalAbs:0,maxLeaveOneOut:maxLoo,directionStability:moves.length?stable/moves.length:0,specificationRobustness:total?robust/total:0,standardizedSensitivity:'Unavailable — standardized historical shock evidence is not persisted in the current derived snapshot',reconciliation:r.reconciliation||null,evidenceRevision:r.evidenceRevision||'',definitionVersion:r.indexDefinitionVersion||S.def?.version||'',record:r};
}
function shipModelHealthSnapshot(){return ['risk','growth','macro'].map(k=>shipModelHealthRecord(k))}
let shipHealthMode='sources';
function renderHealthShip(){
  if(shipHealthMode==='sources'){renderHealth();const host=$('healthRows');if(host&&!host.querySelector('.ship-health-tabs'))host.insertAdjacentHTML('afterbegin','<div class="ship-health-tabs"><button class="active" type="button" data-ship-health="sources">Sources</button><button type="button" data-ship-health="models">Derived Models</button></div>');return}
  const host=$('healthRows');if(!host)return;const rows=shipModelHealthSnapshot();host.innerHTML='<div class="ship-health-tabs"><button type="button" data-ship-health="sources">Sources</button><button class="active" type="button" data-ship-health="models">Derived Models</button></div>'+rows.map(m=>`<article class="ship-model-card"><h3>${m.indexName} — ${m.status}</h3><div class="ship-status">Definition ${esc(m.definitionVersion)} · Evidence ${esc(m.evidenceRevision)}</div><div class="ship-model-grid"><div class="ship-model-metric">Replication<b>${m.replication}</b></div><div class="ship-model-metric">Components<b>${m.available}/${m.required}</b></div><div class="ship-model-metric">Largest contribution<b>${esc(m.largestContribution)}</b></div><div class="ship-model-metric">Max leave-one-out impact<b>${shipPp(m.maxLeaveOneOut)}</b></div><div class="ship-model-metric">Direction stability<b>${shipPct(m.directionStability*100,1)}</b></div><div class="ship-model-metric">Specification robustness<b>${shipPct(m.specificationRobustness*100,1)}</b></div></div><details><summary>Components / Contribution</summary><div class="table-wrap"><table><thead><tr><th>Component</th><th>Weight</th><th>Movement</th><th>Impact</th></tr></thead><tbody>${m.record.components.map(c=>`<tr><td>${esc(c.displayName)}</td><td>${shipPct(c.weight*100,1)}</td><td>${shipPct(c.componentMovementPercent)}</td><td>${shipPp(c.indexContributionPercentPoints)}</td></tr>`).join('')}</tbody></table></div></details><details><summary>Sensitivity / Robustness</summary><p>Standardized sensitivity: ${esc(m.standardizedSensitivity)}</p><p>Leave-one-out and governed relative-weight perturbation are calculated from the current frozen horizon evidence. The canonical index is not modified.</p></details></article>`).join('');
}
function shipAnalysisState(baseState){const snap=shipExplanationSnapshot();return {...baseState,indexExplanation:snap,modelHealth:shipModelHealthSnapshot()}}
async function startAIShip(prompt){
  if(S.aiRunning){toast('AI POV already running');return}
  const pre=await aiPreflight();if(!pre.ok){toast(pre.message);return}
  const base=nowAnalysisState(prompt),state=shipAnalysisState(base),created=await persistAnalysis('processing',state,'');
  S.aiRunning=true;showView('LIBRARY');await loadAnalyses(created.id);renderLibrary();
  try{const out=await callProvider(prompt,state,pre);await persistAnalysis('complete',state,out,created.id);await loadAnalyses(created.id);renderLibrary();toast('Analysis complete')}
  catch(e){await persistAnalysis('failed',state,`Analysis failed: ${e.message||e}`,created.id);await loadAnalyses(created.id);renderLibrary();toast('Analysis failed')}
  finally{S.aiRunning=false}
}
function shipBuildNowPrintReport(){
  const state=shipAnalysisState(nowAnalysisState(''));const report=$('nowPrintReportShip');const chart=$('nowChart');let img='';try{img=chart.toDataURL('image/png')}catch(e){}
  const ctx=S.context==='ENV'?'ENV':crumbs().join(' / ');const range=S.nowChartState?.range||[];const from=range[0]?.date||state.startDate||'',to=range[range.length-1]?.date||state.endDate||'';
  const md=state.indexExplanation?.markdown||'';report.innerHTML=`<h1>Market Navigator Chart Report</h1><p><strong>${esc(ctx)} · ${esc(S.horizon)} · ${esc(S.representation)}</strong></p><p>${esc(from)} → ${esc(to)}</p><p>Evidence revision: ${esc(S.derived?.revision||'—')} · Catalog: ${esc(S.catalog?.version||'—')}</p>${img?`<img class="ship-print-chart" src="${img}" alt="Frozen Market Navigator chart">`:'<p><strong>Chart capture unavailable.</strong></p>'}<h2>Visible series</h2><p>${(S.visible||[]).map(displayName).map(esc).join(' · ')}</p>${md?'<h2>Index Movement Explanation</h2>'+shipRenderMarkdown(md):''}`;return report;
}
function printNowShip(){const report=shipBuildNowPrintReport();report.setAttribute('aria-hidden','false');document.body.classList.add('ship-printing-now');let cleaned=false;const cleanup=()=>{if(cleaned)return;cleaned=true;document.body.classList.remove('ship-printing-now');report.setAttribute('aria-hidden','true');report.innerHTML='';window.removeEventListener('afterprint',cleanup)};window.addEventListener('afterprint',cleanup,{once:true});setTimeout(()=>{window.print();setTimeout(cleanup,1500)},60)}
function shipWire(){
  $('indexInfoBtn')?.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openIndexExplanationShip()});
  $('indexExplanationClose')?.addEventListener('click',closeIndexExplanationShip);$('indexExplanationCopy')?.addEventListener('click',shipCopyExplanation);$('indexExplanationDownload')?.addEventListener('click',shipDownloadExplanation);
  $('indexExplanationModal')?.addEventListener('click',e=>{if(e.target===$('indexExplanationModal'))closeIndexExplanationShip()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('indexExplanationModal')?.hidden)closeIndexExplanationShip()});
  $('healthRows')?.addEventListener('click',e=>{const b=e.target.closest('[data-ship-health]');if(!b)return;shipHealthMode=b.dataset.shipHealth;renderHealthShip()});
  const p=$('ctxPrint');if(p)p.onclick=()=>{closeContextMenu();printNowShip()};
}
'''
anchor="boot();window.addEventListener('resize',scheduleGeometry25);})();"
base=replace_once(base,anchor,ship_js+"\nshipWire();\n"+anchor,"app closure")

# Route AI POV through the ship path without duplicating provider logic.
base=replace_once(base,"startAI(prompt);","startAIShip(prompt);","AI POV launch")

# When HEALTH is entered, retain canonical source render then add the model tabs.
base=replace_once(base,"if(v==='HEALTH')renderHealth();","if(v==='HEALTH')renderHealthShip();","health view")

# Build identity is explicit and unique.
base=base.replace('Market Navigator · Turn 25','Market Navigator · Turn 25 Ship')

# Static qualification guards.
required=[
 'id="indexInfoBtn"','Index Explanation','function shipBuildRecord','function shipModelHealthRecord','function startAIShip','function printNowShip',
 'data-ship-health="models"','market-navigator-turn25-ship','ship-printing-now'
]
for token in required:
    if token not in base: die(f"missing required ship token: {token}")
for bad in ['c3cde56268303d8e2a222012d5a34aee9f26651e']:
    if bad in base: die(f"rejected implementation marker present: {bad}")

pathlib.Path(OUT).write_text(base,encoding='utf-8')
print(f"wrote {OUT}: {len(base)} bytes from {BASE}:{SRC}")
