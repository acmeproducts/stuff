#!/usr/bin/env python3
from pathlib import Path

APP=Path('market-navigator-turn25-pre-ship.html')
QA=Path('market-navigator-turn25-qa.mjs')
s=APP.read_text()

residual="document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings()}"
assert s.count(residual)==1,('config residual',s.count(residual))
s=s.replace(residual,'',1)

old="filter(id=>{let g=IDX.includes(id)?'Other':pickerGroups25(id);return g===S.nowPickerCat}).filter(id=>`${id} ${IDX.includes(id)?S.def.indices[id]?.name:name(id)} ${IDX.includes(id)?AB[id]:label(id)}`.toLowerCase().includes(q))"
new="filter(id=>{let g=IDX.includes(id)?'Other':pickerGroups25(id);return q?true:g===S.nowPickerCat}).filter(id=>`${id} ${IDX.includes(id)?S.def.indices[id]?.name:name(id)} ${IDX.includes(id)?AB[id]:label(id)}`.toLowerCase().includes(q))"
assert s.count(old)==1,('global Add search',s.count(old))
s=s.replace(old,new,1)

old="let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);if(sel)setActive(sel.id,false);model=paint();syncActive();"
new="let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);let neutralEnv=which==='now'&&S.level===1&&!S.nowFocus;if(sel&&!neutralEnv)setActive(sel.id,false);if(neutralEnv){active=null;S.nowActive=null;S.nowFocus=null}model=paint();syncActive();"
assert s.count(old)==1,('neutral draw fallback',s.count(old))
s=s.replace(old,new,1)

old="captureNowState(sets,w,'indexed');S.nowPaint25={sets,w,mode:'indexed'};draw('now',sets,w,'indexed')}async function openV2"
new="captureNowState(sets,w,'indexed');S.nowPaint25={sets,w,mode:'indexed'};draw('now',sets,w,'indexed');S.nowActive=null;S.nowFocus=null;if(S.nowChartState){S.nowChartState.active=null;if(S.nowChartState.chart)S.nowChartState.chart.active=null}$('nowChart').dataset.emphasis='false'}async function openV2"
assert s.count(old)==1,('ENV neutral snapshot',s.count(old))
s=s.replace(old,new,1)

old="if(androidSpeech25()){try{speechSynthesis.cancel()}catch{}libSpeechUtterance17=null;libSpeechState17='paused'}"
new="if(androidSpeech25()){if(libSpeechUtterance17)libSpeechUtterance17.onend=null;try{speechSynthesis.cancel()}catch{}libSpeechUtterance17=null;libSpeechState17='paused'}"
assert s.count(old)==1,('Android pause',s.count(old))
s=s.replace(old,new,1)
old="function stopLibSpeech17(){libSpeechUtterance17=null;libSpeechState17='idle';if('speechSynthesis'in window){try{speechSynthesis.cancel()}catch{}}syncLibListen17()}"
new="function stopLibSpeech17(){if(libSpeechUtterance17)libSpeechUtterance17.onend=null;libSpeechUtterance17=null;libSpeechState17='idle';if('speechSynthesis'in window){try{speechSynthesis.cancel()}catch{}}syncLibListen17()}"
assert s.count(old)==1,('stop speech',s.count(old))
s=s.replace(old,new,1)
old="let resume=libSpeechState17==='playing';try{speechSynthesis.cancel()}catch{}libSpeechState17='idle';libSpeechUtterance17=null;"
new="let resume=libSpeechState17==='playing';if(libSpeechUtterance17)libSpeechUtterance17.onend=null;try{speechSynthesis.cancel()}catch{}libSpeechState17='idle';libSpeechUtterance17=null;"
assert s.count(old)==2,('speech navigation cancel',s.count(old))
s=s.replace(old,new,2)

old="function keyRow25(p){return document.querySelector(`[data-key-row=\"${p}\"]`)}function renderAIConfig(){let r=aiRegistry(),ps=r.providers||{};$('defaultProvider').value=r.defaultProvider||'venice';for(let p of ['venice','openrouter','anthropic']){let q=ps[p]||{},replacing=!!S.keyReplace25[p],row=keyRow25(p),btn=document.querySelector(`[data-replace-key=\"${p}\"]`);$(p+'Key').value='';row?.classList.toggle('hidden',!!q.verified&&!replacing);if(btn){btn.classList.toggle('hidden',!q.verified);btn.textContent=replacing?'Cancel replacement':'Replace key'}if(p==='anthropic')$('anthropicModel').value=q.model||'';else fillModelSelect(p+'Model',q.models||([q.model].filter(Boolean)),q.model);setPStatus(p,q.verified?`registered · ${q.model}`:(q.key?'saved · validation required':'not registered'),q.verified?true:null)}$('cfgSummary').textContent=`Default: ${providerName($('defaultProvider').value)}. Registered keys remain browser-local and are not repopulated into editable fields.`}function workingKey25(p){let typed=$(p+'Key').value.trim(),q=providerRec(p);return typed||q.key||''}"
new="function keyRow25(p){return document.querySelector(`[data-key-row=\"${p}\"]`)}function renderAIConfig(){let r=aiRegistry(),ps=r.providers||{};$('defaultProvider').value=r.defaultProvider||'venice';for(let p of ['venice','openrouter','anthropic']){let q=ps[p]||{},hasKey=!!q.key,replacing=!!S.keyReplace25[p],row=keyRow25(p),btn=document.querySelector(`[data-replace-key=\"${p}\"]`),key=$(p+'Key');key.value='';row?.classList.toggle('hidden',hasKey&&!replacing);if(btn){btn.classList.toggle('hidden',!hasKey);btn.hidden=!hasKey;btn.textContent=replacing?'Cancel replacement':'Replace key';btn.setAttribute('aria-expanded',String(replacing))}if(p==='anthropic')$('anthropicModel').value=q.model||'';else fillModelSelect(p+'Model',q.models||([q.model].filter(Boolean)),q.model);setPStatus(p,q.verified?`registered · ${q.model}`:(hasKey?'saved · validation required':'not registered'),q.verified?true:null)}$('cfgSummary').textContent=`Default: ${providerName($('defaultProvider').value)}. Registered keys remain browser-local and are not repopulated into editable fields.`}function workingKey25(p){let typed=$(p+'Key').value.trim(),q=providerRec(p);return typed||q.key||''}"
assert s.count(old)==1,('credential transactional display',s.count(old))
s=s.replace(old,new,1)

old="$('settingsGear').onclick=openConfig;"
new="$('settingsGear').onclick=()=>openConfig('ai');"
assert s.count(old)==1,('Config gear explicit AI tab',s.count(old))
s=s.replace(old,new,1)

# Governed Library Print: a dedicated document surface built from the selected
# frozen Library record and the already-rendered frozen chart canvas. Normal
# Library layout is untouched; only @media print exposes the report.
print_css=r'''
/* TURN25_LIBRARY_PRINT_REPORT */
#libraryPrintReport{display:none}
@media print{
 html,body{width:auto!important;height:auto!important;overflow:visible!important;background:#fff!important;color:#111!important}
 .app{display:none!important}
 #libraryPrintReport{display:block!important;position:static!important;width:auto!important;height:auto!important;max-width:none!important;max-height:none!important;overflow:visible!important;background:#fff!important;color:#111!important;font:11pt/1.45 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
 #libraryPrintReport *{max-height:none!important;overflow:visible!important}
 #libraryPrintReport header{border-bottom:1px solid #bbb;margin:0 0 14pt;padding:0 0 10pt}
 #libraryPrintReport .printBrand{font-size:9pt;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
 #libraryPrintReport h1{font-size:20pt;line-height:1.15;margin:4pt 0 8pt}
 #libraryPrintReport h1,#libraryPrintReport h2,#libraryPrintReport h3,#libraryPrintReport h4,#libraryPrintReport h5,#libraryPrintReport h6{break-after:avoid-page;page-break-after:avoid}
 #libraryPrintContext{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:2pt 10pt;margin:0;font-size:9pt}
 #libraryPrintContext dt{font-weight:800}#libraryPrintContext dd{margin:0;overflow-wrap:anywhere}
 #libraryPrintChartWrap{margin:0 0 16pt;break-inside:avoid;page-break-inside:avoid}
 #libraryPrintChart{display:block;width:100%;height:auto;max-width:100%!important;break-inside:avoid;page-break-inside:avoid}
 #libraryPrintTranscript{display:block!important;position:static!important;width:auto!important;height:auto!important;max-height:none!important;overflow:visible!important}
 #libraryPrintTranscript .turn{display:block!important;height:auto!important;max-height:none!important;overflow:visible!important;break-inside:auto;page-break-inside:auto;border-bottom:1px solid #ddd;padding:8pt 0}
 #libraryPrintTranscript .who{color:#555!important;font-size:8pt}
 #libraryPrintTranscript p,#libraryPrintTranscript ul,#libraryPrintTranscript ol,#libraryPrintTranscript blockquote{orphans:3;widows:3}
 #libraryPrintTranscript table{width:100%;border-collapse:collapse;break-inside:auto;page-break-inside:auto}
 #libraryPrintTranscript thead{display:table-header-group}#libraryPrintTranscript tr{break-inside:avoid;page-break-inside:avoid}
 #libraryPrintTranscript th,#libraryPrintTranscript td{border:1px solid #aaa;padding:4pt;vertical-align:top}
 #libraryPrintTranscript blockquote,#libraryPrintTranscript img{break-inside:avoid;page-break-inside:avoid}
 #libraryPrintTranscript img{max-width:100%!important;height:auto!important}
 #libraryPrintTranscript a{color:#111!important;text-decoration:underline}
}
'''
assert s.count('</style>')>=1
s=s.replace('</style>',print_css+'</style>',1)
report_markup='''<section id="libraryPrintReport" aria-hidden="true" data-print-surface="library-analysis-report"><header><div class="printBrand">Market Navigator Analysis Report</div><h1 id="libraryPrintTitle"></h1><dl id="libraryPrintContext"></dl></header><figure id="libraryPrintChartWrap"><img id="libraryPrintChart" alt="Frozen Market Navigator analysis chart"></figure><article id="libraryPrintTranscript"></article></section>'''
assert s.count('</body>')==1
s=s.replace('</body>',report_markup+'</body>',1)
print_js=r'''
function printContextRows25(a){let st=a?.state||{},chart=st.chart||a?.chart||{},series=(chart.series||[]).map(x=>x.label||x.id).filter(Boolean),rev=chart.dataRevision||st.dataRevision||st.evidenceRevision||a?.evidenceRevision||null,evidence=st.evidence||a?.evidence||null,rows=[['Horizon',chart.horizon||st.horizon||a?.horizon||'—'],['Series',series.length?series.join(' · '):(Array.isArray(st.series)?st.series.join(' · '):'—')],['Evidence / revision',rev?JSON.stringify(rev):'—']];if(evidence)rows.push(['Saved evidence',Array.isArray(evidence)?`${evidence.length} saved evidence item${evidence.length===1?'':'s'}`:JSON.stringify(evidence)]);if(a?.createdAt)rows.push(['Created',a.createdAt]);if(a?.updatedAt)rows.push(['Updated',a.updatedAt]);return rows}
function cleanupLibraryPrint25(){let r=$('libraryPrintReport');if(!r)return;r.setAttribute('aria-hidden','true');$('libraryPrintTitle').textContent='';$('libraryPrintContext').replaceChildren();$('libraryPrintChart').removeAttribute('src');$('libraryPrintTranscript').replaceChildren();document.documentElement.classList.remove('library-print-active')}
function buildLibraryPrintReport25(){let a=currentAnalysis();if(!a)throw new Error('Select a saved Library analysis before printing.');let canvas=$('libChart');if(!canvas||!canvas.width||!canvas.height)throw new Error('Frozen Library chart is not rendered.');let r=$('libraryPrintReport');$('libraryPrintTitle').textContent=a.title||'Market Navigator Analysis';let dl=$('libraryPrintContext');dl.replaceChildren();for(let [k,v] of printContextRows25(a)){let dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=String(v);dl.append(dt,dd)}$('libraryPrintChart').src=canvas.toDataURL('image/png');let src=$('transcript'),dst=$('libraryPrintTranscript');dst.replaceChildren(...[...src.childNodes].map(n=>n.cloneNode(true)));r.setAttribute('aria-hidden','false');document.documentElement.classList.add('library-print-active');return{analysisId:a.id,title:a.title,chartSnapshot:a?.state?.chart||a?.chart||null,turnCount:Array.isArray(a.turns)?a.turns.length:0}}
function printLibraryAnalysis25(){let before=currentAnalysis(),beforeJson=before?JSON.stringify(before):null;buildLibraryPrintReport25();window.__libraryPrintInvariant25={id:before?.id||null,before:beforeJson};window.print();let after=currentAnalysis();window.__libraryPrintInvariant25.after=after?JSON.stringify(after):null;return window.__libraryPrintInvariant25}
window.addEventListener('afterprint',cleanupLibraryPrint25);
if($('libPrint'))$('libPrint').onclick=()=>{$('libMenu')?.classList.add('hidden');printLibraryAnalysis25()};
'''
pos=s.rfind('</script>')
assert pos>0,'script close missing'
s=s[:pos]+print_js+s[pos:]
APP.write_text(s)

q=QA.read_text()
old="window.__qaSpeech=speech;window.__opened=[];window.clean=s=>String(s||'').replace(/\\s+/g,' ').trim();window.open=(u)=>{window.__opened.push(String(u));return null};"
new="window.__qaSpeech=speech;window.__opened=[];window.__printCount=0;window.print=()=>{window.__printCount++};window.clean=s=>String(s||'').replace(/\\s+/g,' ').trim();window.open=(u)=>{window.__opened.push(String(u));return null};"
if q.count(old)==1:q=q.replace(old,new,1)
else:assert q.count('window.__printCount=0;window.print=()=>{window.__printCount++}')==1,('QA print mock',q.count(old),q.count(new))

old="await p.reload({waitUntil:'networkidle'});await p.locator('[data-view=\"library\"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');"
new="await p.reload({waitUntil:'networkidle'});if(await p.locator('#rail').evaluate(el=>el.classList.contains('closed')))await p.locator('#toggle').click();await p.locator('[data-view=\"library\"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');if(!(await p.locator('#libListenMode').isVisible())){await p.locator('#libList [data-id]').first().click();await p.waitForFunction(()=>document.querySelector('#libraryWorkspace')?.classList.contains('detailOpen'))}"
if q.count(old)==1:q=q.replace(old,new,1)

old="assert.equal(await key.isHidden(),true);assert.equal(await replace.isVisible(),true);await replace.click();"
new="assert.equal(await key.isHidden(),true,'registered key field hidden');let replaceState=await replace.evaluate(el=>({visible:!!(el.offsetWidth||el.offsetHeight||el.getClientRects().length),hidden:el.hidden,cls:el.className,parent:el.parentElement?.className||'',panel:document.querySelector('#cfgAi')?.className||''}));assert.equal(replaceState.visible,true,`Replace key explicit ${JSON.stringify(replaceState)}`);await replace.click();"
if q.count(old)==1:q=q.replace(old,new,1)

print_case=r'''
async function printCase(){
  const t=await makePage({width:1280,height:800}),p=t.page;await injectTTSAnalysis(p);
  await p.evaluate(async()=>{let r=indexedDB.open('marketNavigatorLocal',1);await new Promise((resolve,reject)=>{r.onsuccess=resolve;r.onerror=()=>reject(r.error)});let db=r.result,rec=await new Promise((resolve,reject)=>{let q=db.transaction('analyses').objectStore('analyses').get('qa-tts25');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error)});let long='## Long response\n\n'+Array.from({length:90},(_,i)=>`Paragraph ${i+1}: governed print content must remain complete across natural pagination.`).join('\n\n')+'\n\n| Item | Value |\n|---|---|\n| Alpha | 1 |\n| Beta | 2 |\n\n> Printable blockquote\n\n[OpenAI](https://openai.com)';rec.title='QA Print Analysis';rec.state.evidence=[{source:'QA source',revision:'rev-print-25'}];rec.state.chart.dataRevision={derived:'rev-print-25',source:'qa-frozen'};rec.turns.push({role:'assistant',content:long,at:'2099-01-01T00:03:00Z'});await new Promise((resolve,reject)=>{let tx=db.transaction('analyses','readwrite');tx.objectStore('analyses').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})});
  await p.reload({waitUntil:'networkidle'});await p.locator('[data-view="library"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Print Analysis');
  let persistedBefore=await p.evaluate(()=>JSON.stringify(currentAnalysis()));
  await p.locator('#libMoreBtn').click();await p.locator('#libPrint').click();
  assert.equal(await p.evaluate(()=>window.__printCount),1,'native print invoked exactly once');
  assert.equal(await p.locator('#libraryPrintTitle').innerText(),'QA Print Analysis','saved title printed');
  let report=await p.locator('#libraryPrintReport').innerText();for(let x of ['5D','SPY','rev-print-25','First analysis','Second analysis','Paragraph 90','Printable blockquote'])assert(report.includes(x),`print report contains ${x}`);
  assert((await p.locator('#libraryPrintChart').getAttribute('src'))?.startsWith('data:image/png'),'exact rendered frozen chart captured');
  for(let x of ['#libMoreBtn','#libListenMode','#libChatMode','#libListenBar','#compose','#send','#attachBtn','#rail','#libList'])assert.equal(await p.locator(`#libraryPrintReport ${x}`).count(),0,`${x} absent from report`);
  let screen=await p.evaluate(()=>({app:getComputedStyle(document.querySelector('.app')).display,report:getComputedStyle(document.querySelector('#libraryPrintReport')).display}));assert.notEqual(screen.app,'none');assert.equal(screen.report,'none','report hidden on ordinary screen');
  await p.emulateMedia({media:'print'});let media=await p.evaluate(()=>{let r=document.querySelector('#libraryPrintReport'),tr=document.querySelector('#libraryPrintTranscript'),turn=tr.querySelector('.turn'),cs=getComputedStyle(r),ts=getComputedStyle(tr);return{app:getComputedStyle(document.querySelector('.app')).display,report:cs.display,rh:cs.height,rmax:cs.maxHeight,ro:cs.overflow,th:ts.height,tmax:ts.maxHeight,to:ts.overflow,turnBreak:turn?getComputedStyle(turn).breakInside:null,bodyOverflow:getComputedStyle(document.body).overflow}});assert.equal(media.app,'none','application hidden in print media');assert.equal(media.report,'block','report visible in print media');assert.equal(media.rmax,'none');assert.equal(media.tmax,'none');assert.equal(media.ro,'visible');assert.equal(media.to,'visible');assert.equal(media.bodyOverflow,'visible');
  let css=await p.evaluate(()=>[...document.styleSheets].flatMap(ss=>{try{return[...ss.cssRules]}catch{return[]}}).filter(r=>r.media&&String(r.media.mediaText).includes('print')).map(r=>r.cssText).join('\n'));for(let x of ['break-inside: avoid','page-break-inside: avoid','display: table-header-group'])assert(css.includes(x),`pagination CSS ${x}`);
  await p.emulateMedia({media:'screen'});await p.evaluate(()=>window.dispatchEvent(new Event('afterprint')));assert.equal(await p.locator('#libraryPrintReport').getAttribute('aria-hidden'),'true','temporary print state cleaned');assert.equal(await p.locator('#libraryPrintTranscript').textContent(),'','temporary transcript cleaned');let persistedAfter=await p.evaluate(()=>JSON.stringify(currentAnalysis()));assert.equal(persistedAfter,persistedBefore,'saved Library analysis unchanged after print');assert.deepEqual(t.errors,[]);assert.deepEqual(t.failed,[]);await t.context.close();
}
'''
if 'async function printCase()' not in q:
    anchor='\ntry{\n'
    assert anchor in q,'QA try anchor missing'
    q=q.replace(anchor,print_case+anchor,1)
if 'await printCase();' not in q:
    q=q.replace('await ttsCase(false);await ttsCase(true);','await ttsCase(false);await ttsCase(true);await printCase();',1)
QA.write_text(q)

print('TURN 25 FINALIZE: PASS')
