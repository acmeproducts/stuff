from pathlib import Path

builder = Path('market-navigator-build-turn17.py')
s = builder.read_text()

# Repair the exact replay defect that blocked the prior publish.  Older
# normalization searched inside "async function openData17" and could leave an
# extra leading async token on a second pass.
s = s.replace('async async function dataSeries17(z,state)', 'async function dataSeries17(z,state)')

old = "    'Correlation', 'Native', 'Index 100', 'data-emphasis',\n"
new = "    'Correlation', 'Native', 'Index 100', 'dataset.emphasis',\n"
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Turn 17 self-check correction anchor missing')

# These first-pass normalizations may already be committed by a successful
# qualification run.  Apply them only when the old form is still present.
old_bind = """# Presentation-only Data bindings. Existing AI/Print/download behavior is left intact.
end = s.rfind('</script>')
if end < 0:
    raise SystemExit('main script closing tag missing')
bindings = r'''$('dataClose').onclick=()=>$('dataModal').classList.add('hidden');$('nowData').onclick=()=>{$('nowMoreMenu').classList.add('hidden');openData17(nowAnalysisState())};$('moreData').onclick=()=>{$('moreMenu').classList.add('hidden');openData17(S.analysisChartState)};$('exploreData').onclick=async()=>{$('exploreMoreMenu').classList.add('hidden');openData17(await exploreState())};'''
s = s[:end] + bindings + s[end:]
"""
new_bind = r'''# Presentation-only Data bindings live in the same app-IIFE scope as the existing menus.
rep("$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowPrint').onclick=", "$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowData').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await openData17(nowAnalysisState())};$('nowPrint').onclick=", 'NOW Data binding')
rep("$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('morePrint').onclick=", "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreData').onclick=async()=>{$('moreMenu').classList.add('hidden');await openData17(S.analysisChartState)};$('morePrint').onclick=", 'COMPONENT Data binding')
rep("$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('explorePrint').onclick=", "$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('exploreData').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await openData17(await exploreState())};$('explorePrint').onclick=", 'EXPLORE Data binding')
rep("$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');", "$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');$('dataClose').onclick=()=>$('dataModal').classList.add('hidden');", 'Data close binding')
'''
if old_bind in s:
    s = s.replace(old_bind, new_bind, 1)
elif 'NOW Data binding' not in s:
    raise SystemExit('Turn 17 Data binding source anchor missing')

old_active = "else S.libraryActive=id}function syncActive()"
new_active = "else S.libraryActive=id;if(focus&&which==='now'&&S.nowChartState){S.nowChartState.active=id;if(S.nowChartState.chart)S.nowChartState.chart.active=id}if(focus&&which==='analysis'&&S.analysisChartState){S.analysisChartState.active=id;if(S.analysisChartState.chart)S.analysisChartState.chart.active=id}}function syncActive()"
if old_active in s:
    s = s.replace(old_active, new_active, 1)
elif new_active not in s:
    raise SystemExit('Turn 17 exact-active-state anchor missing')

if '#dataModal{z-index:50}' not in s:
    anchor = '.dataCard{width:min(1180px,calc(100% - 24px));'
    if anchor not in s:
        raise SystemExit('Turn 17 Data z-index anchor missing')
    s = s.replace(anchor, '#dataModal{z-index:50}' + anchor, 1)

# Full-series Data is already native to the current builder after the successful
# qualification.  Only upgrade an older first-pass builder that lacks it.
if 'async function dataSeries17(z,state)' not in s:
    start = s.find('function openData17(state){')
    if start < 0:
        raise SystemExit('Turn 17 openData17 start missing')
    end = s.find("'''", start)
    if end < 0:
        raise SystemExit('Turn 17 openData17 runtime terminator missing')
    full_data = r"""async function dataSeries17(z,state){let chart=state.chart||{},w=chart.window||{},plotted=z.points||[];if(IDX.includes(z.id))return{...z,points:plotted.map(p=>({t:+p.t,sourceT:+(p.sourceT||p.t),v:+p.v,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:+p.v}))};let src=await getSeries(z.id),obs=(src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>({t:+p.t,sourceT:+p.t,v:+p.v,raw:+p.v})),before=obs.filter(p=>p.t<=+w.start),base=before.at(-1)||obs[0]||null,dir=1;if(base&&Number.isFinite(+base.v)&&+base.v!==0){let probe=plotted.find(p=>Number.isFinite(+p.idx)&&Number.isFinite(+p.raw)&&Math.abs((+p.raw/+base.v)-1)>1e-9);if(probe){let d=((+probe.idx-100)/100)/((+probe.raw/+base.v)-1);if(Number.isFinite(d)&&Math.abs(d)>.5)dir=d<0?-1:1}}return{...z,points:obs.map(p=>({...p,idx:base&&Number.isFinite(+base.v)&&+base.v!==0?100+dir*((p.v/+base.v)-1)*100:null}))}}async function openData17(state){if(!state?.chart)throw Error('Visible chart data is not ready');let chart=state.chart,source=chart.series||[],activeId=state.active||chart.active||source[0]?.id,series=await Promise.all(source.map(z=>dataSeries17(z,state))),ref=series.find(z=>z.id===activeId)||series[0],corr=Object.fromEntries(series.map(z=>[z.id,corr17(z,ref)]));$('dataTitle').textContent=`Data · ${ref?.label||ref?.id||'Series'}`;$('dataMeta').textContent=`${state.horizon||chart.horizon||''} · full canonical series history · Index 100 uses active chart baseline · correlation vs ${ref?.label||ref?.id||'active series'} using same-date real values`;$('dataRows').innerHTML=series.flatMap(z=>(z.points||[]).map(p=>{let native=Number.isFinite(+p.raw)?+p.raw:(Number.isFinite(+p.v)?+p.v:null),idx=Number.isFinite(+p.idx)?+p.idx:null,r=corr[z.id];return`<tr data-series="${esc(z.id)}" data-active="${z.id===ref?.id?'true':'false'}"><td>${esc(z.label||z.id)}</td><td>${esc(dayKey17(p.sourceT||p.t))}</td><td>${native==null?'—':esc(fmt(native))}${z.unit?` ${esc(z.unit)}`:''}</td><td>${idx==null?'—':esc(fmt(idx))}</td><td>${Number.isFinite(r)?r.toFixed(3):'N/A'}</td></tr>`})).join('');$('dataModal').classList.remove('hidden')}"""
    # Preserve a preceding async token when the old renderer itself was async.
    prefix = 'async ' if s[max(0, start-6):start] == 'async ' else ''
    if prefix:
        start -= 6
    s = s[:start] + full_data + s[end:]

# Inject the follow-on owner scope into the builder exactly once.  This code
# executes after the established Turn 17 transforms and before the generated
# HTML is written.
feature_marker = '# TURN17_CARD_NAV_AND_BROWSER_TTS'
if feature_marker not in s:
    patch = r'''
# TURN17_CARD_NAV_AND_BROWSER_TTS
# Card arrows traverse selectable INDEX components; Library Listen reuses the
# PRISM browser SpeechSynthesis interaction.  Downloadable MP3 remains backlog.
extra_css = r'''\
.infoNav{display:flex;gap:4px;margin-right:auto}.infoNav .btn{min-width:30px;padding:4px 8px!important}.infoNav .btn:disabled{opacity:.35;cursor:not-allowed}.libModeDock{position:relative;border-top:1px solid var(--line);background:#081522}.libModeTabs{position:absolute;left:10px;top:-28px;display:flex;overflow:hidden;border:1px solid var(--line);border-radius:8px 8px 0 0;background:#081522;z-index:9}.libModeTab{height:27px;min-width:58px;border:0;border-right:1px solid var(--line);background:#0b1928;color:var(--muted);font-size:9px;font-weight:900}.libModeTab:last-child{border-right:0}.libModeTab.on{background:var(--panel2);color:var(--text)}.libModeTab:disabled{opacity:.35}.libListenBar{min-height:62px;display:grid;grid-template-columns:minmax(110px,1fr) repeat(5,40px);gap:5px;align-items:center;padding:8px}.libListenBar.hidden,.libComposer.hidden{display:none!important}.libListenStatus{min-width:0}.libListenStatus b,.libListenStatus span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.libListenStatus b{font-size:10px}.libListenStatus span{font-size:8px;color:var(--muted);margin-top:2px}.libListenControl{width:40px;height:40px;border:1px solid var(--line);border-radius:9px;background:var(--panel2);font-size:15px;display:grid;place-items:center}.libListenControl.primary{border-color:var(--accent);color:var(--accent)}.libListenControl:disabled{opacity:.3;cursor:not-allowed}@media(max-width:700px){.libListenBar{grid-template-columns:minmax(74px,1fr) repeat(5,34px);gap:3px;padding:6px}.libListenControl{width:34px;height:36px;font-size:13px}.libModeTab{min-width:52px}}\
'''
if '.libListenBar{' not in s:
    s = s.replace('</style>', extra_css + '</style>', 1)

old_composer = '<div class="composer"><div class="attachPreview" id="attachPreview"></div><button class="btn" id="attachBtn" title="Attach image or spreadsheet" aria-label="Attach image or spreadsheet">📎</button><input id="attachInput" type="file" accept="image/*,.csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple class="hidden"><textarea id="compose" placeholder="Continue this analysis…"></textarea><button class="btn" id="send" title="Send with real-time web search">Send</button></div>'
new_composer = '<div class="libModeDock" id="libModeDock"><div class="libModeTabs" aria-label="Library mode"><button id="libChatMode" class="libModeTab on" aria-pressed="true">Chat</button><button id="libListenMode" class="libModeTab" aria-pressed="false">Listen</button></div><div class="composer libComposer" id="libComposer"><div class="attachPreview" id="attachPreview"></div><button class="btn" id="attachBtn" title="Attach image or spreadsheet" aria-label="Attach image or spreadsheet">📎</button><input id="attachInput" type="file" accept="image/*,.csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple class="hidden"><textarea id="compose" placeholder="Continue this analysis…"></textarea><button class="btn" id="send" title="Send with real-time web search">Send</button></div><div class="libListenBar hidden" id="libListenBar" aria-label="Analysis readout controls"><div class="libListenStatus"><b id="libListenTitle">Listen</b><span id="libListenProgress">No completed response</span></div><button id="libListenPrevTurn" class="libListenControl" aria-label="Previous response" title="Previous response">⏮</button><button id="libListenBack" class="libListenControl" aria-label="Previous row" title="Previous row">⏪</button><button id="libListenPlay" class="libListenControl primary" aria-label="Play readout" title="Play readout">▶</button><button id="libListenForward" class="libListenControl" aria-label="Next row" title="Next row">⏩</button><button id="libListenNextTurn" class="libListenControl" aria-label="Next response" title="Next response">⏭</button></div></div>'
if 'id="libModeDock"' not in s:
    if old_composer not in s:
        raise SystemExit('Turn 17 Library composer anchor missing')
    s = s.replace(old_composer, new_composer, 1)

# Replace the contextual component-card function with arrow navigation while
# preserving the existing data fields and More-info path.
if 'id="prevInfo"' not in s:
    a = s.find('async function componentCard(id){')
    b = s.find("}$('nowMoreBtn').onclick", a)
    if a < 0 or b < 0:
        raise SystemExit('Turn 17 component card range missing')
    card_fn = r'''function indexCardIds17(){return[...document.querySelectorAll('#legend [data-id]')].filter(b=>!b.disabled&&b.dataset.id!==S.index).map(b=>b.dataset.id)}async function activateIndexComponent17(id){if(!id||id===S.index)return;S.nowActive=id;S.nowFocus=id;if(S.priorV2)S.priorV2.component=id;$('nowTip').style.display='none';await renderV2();await componentCard(id)}async function componentCard(id){let s=await getSeries(id),d=S.def.indices[S.index].components.find(x=>x.id===id),last=(s.observations||[]).at(-1),c=cat(id),h=health(id),ids=indexCardIds17(),pos=ids.indexOf(id),prev=pos>0?ids[pos-1]:null,next=pos>=0&&pos<ids.length-1?ids[pos+1]:null;$('info').innerHTML=`<h3>${esc(label(id))} · ${esc(name(id))}</h3><div class="kv"><span>Role</span><span>${esc(d?.role||'')}</span><span>Direction</span><span>${d?.direction>0?'+1':'−1'}</span><span>Provider</span><span>${esc(c.provider||h.provider||'—')}</span><span>Unit</span><span>${esc(c.native_unit||'—')}</span><span>Cadence</span><span>${esc(c.native_cadence||s.cadence||'—')}</span><span>Latest</span><span>${last?full(last.t)+' · '+fmt(last.v):'—'}</span><span>Health</span><span>${esc(h.classification||'unknown')}</span>${(hrec(S.index).omitted||[]).find(x=>x.id===id)?`<span>Composite</span><span>not used in derived ratio · direct series remains available</span>`:''}</div><div class="actions"><span class="infoNav"><button class="btn" id="prevInfo" aria-label="Previous series" title="Previous series" ${prev?'':'disabled'}>←</button><button class="btn" id="nextInfo" aria-label="Next series" title="Next series" ${next?'':'disabled'}>→</button></span><button class="btn" id="moreInfo">More info</button><button class="btn" id="closeInfo">×</button></div>`;$('info').classList.remove('hidden');$('prevInfo').onclick=()=>{if(prev)activateIndexComponent17(prev)};$('nextInfo').onclick=()=>{if(next)activateIndexComponent17(next)};$('closeInfo').onclick=()=>$('info').classList.add('hidden');$('moreInfo').onclick=()=>openAnalysis([id],'NOW',id)}'''
    s = s[:a] + card_fn + s[b+1:]

old_chip = "else{S.nowActive=id;S.nowFocus=id;S.priorV2.component=id;$('nowTip').style.display='none';componentCard(id);renderV2()}"
if old_chip in s:
    s = s.replace(old_chip, "else{activateIndexComponent17(id)}", 1)

# Browser TTS donor adapted from the current PRISM Library.  Only completed
# assistant responses are spoken; no audio-file generation is attempted.
if 'function syncLibListen17()' not in s:
    anchor = "function currentAnalysis(){return analyses().find(x=>x.id===S.activeAnalysis&&!x.deletedAt)}"
    if anchor not in s:
        raise SystemExit('Turn 17 Library currentAnalysis anchor missing')
    tts = r'''let libDockMode17='chat',libListenAnalysis17=null,libListenTurns17=[],libListenTurnPos17=0,libListenRows17=[],libListenRowPos17=0,libSpeechState17='idle',libSpeechUtterance17=null;function completedAssistantTurns17(a){return(a?.turns||[]).map((t,i)=>t.role==='assistant'&&!t.processing&&String(t.content||'').trim()?i:-1).filter(i=>i>=0)}function splitSpeechRow17(text){let clean=String(text||'').replace(/\s+/g,' ').trim();if(clean.length<=520)return clean?[clean]:[];let sentences=clean.match(/[^.!?]+(?:[.!?]+|$)/g)||[clean],out=[],part='';for(let sentence of sentences){let next=(part+' '+sentence).trim();if(next.length>520&&part){out.push(part);part=sentence.trim()}else part=next}if(part)out.push(part);return out}function markdownSpeechRows17(markdown){let source=String(markdown||'').trim();if(!source)return[];let box=document.createElement('div');if(window.marked&&window.DOMPurify)box.innerHTML=DOMPurify.sanitize(marked.parse(source));else box.textContent=source.replace(/[#*_`>\[\]()]/g,' ');let selector='h1,h2,h3,h4,h5,h6,p,li,tr,blockquote,pre',nodes=[...box.querySelectorAll(selector)].filter(n=>!n.parentElement?.closest(selector)),rows=[];for(let n of nodes){let prefix=/^H[1-6]$/.test(n.tagName)?'Heading. ':n.tagName==='TR'?'Table row. ':n.tagName==='LI'?'List item. ':n.tagName==='BLOCKQUOTE'?'Quote. ':n.tagName==='PRE'?'Code. ':'';rows.push(...splitSpeechRow17(prefix+(n.textContent||'')))}return rows.length?rows:splitSpeechRow17(box.textContent||source)}function setLibListenResponse17(a,turnIndex=null){let turns=completedAssistantTurns17(a),same=libListenAnalysis17===a?.id,retained=same?libListenTurns17[libListenTurnPos17]:-1;libListenAnalysis17=a?.id||null;libListenTurns17=turns;if(!turns.length){libListenTurnPos17=0;libListenRows17=[];libListenRowPos17=0;return false}let requested=Number.isInteger(turnIndex)?turns.indexOf(turnIndex):-1,retainedPos=turns.indexOf(retained);libListenTurnPos17=requested>=0?requested:retainedPos>=0?retainedPos:0;libListenRows17=markdownSpeechRows17(a.turns[turns[libListenTurnPos17]]?.content);libListenRowPos17=Math.min(libListenRowPos17,Math.max(0,libListenRows17.length-1));return libListenRows17.length>0}function syncLibListen17(){let a=currentAnalysis(),available=!!a&&completedAssistantTurns17(a).length>0,dock=$('libModeDock');if(!dock)return;dock.hidden=!a;if(!a){libDockMode17='chat';return}if(libListenAnalysis17&&libListenAnalysis17!==a.id&&libSpeechState17!=='idle'){try{speechSynthesis.cancel()}catch{}libSpeechState17='idle';libSpeechUtterance17=null}if(libDockMode17==='listen'&&!available)libDockMode17='chat';$('libChatMode').classList.toggle('on',libDockMode17==='chat');$('libChatMode').setAttribute('aria-pressed',String(libDockMode17==='chat'));$('libListenMode').classList.toggle('on',libDockMode17==='listen');$('libListenMode').setAttribute('aria-pressed',String(libDockMode17==='listen'));$('libListenMode').disabled=!available;$('libComposer').classList.toggle('hidden',libDockMode17!=='chat');$('libListenBar').classList.toggle('hidden',libDockMode17!=='listen');if(libDockMode17!=='listen')return;if(libListenAnalysis17!==a.id||completedAssistantTurns17(a).join(',')!==libListenTurns17.join(','))setLibListenResponse17(a);$('libListenTitle').textContent=a.title;$('libListenProgress').textContent=libListenRows17.length?`Response ${libListenTurnPos17+1} of ${libListenTurns17.length} · Row ${libListenRowPos17+1} of ${libListenRows17.length}`:'No completed response';$('libListenPrevTurn').disabled=libListenTurnPos17<=0;$('libListenNextTurn').disabled=libListenTurnPos17>=libListenTurns17.length-1;$('libListenBack').disabled=libListenRowPos17<=0;$('libListenForward').disabled=!libListenRows17.length||libListenRowPos17>=libListenRows17.length-1;let canSpeak='speechSynthesis'in window&&'SpeechSynthesisUtterance'in window;$('libListenPlay').disabled=!libListenRows17.length||!canSpeak;$('libListenPlay').textContent=libSpeechState17==='playing'?'⏸':'▶';let lab=libSpeechState17==='playing'?'Pause readout':libSpeechState17==='paused'?'Resume readout':'Play readout';$('libListenPlay').setAttribute('aria-label',lab);$('libListenPlay').title=lab}function stopLibSpeech17(){libSpeechUtterance17=null;libSpeechState17='idle';if('speechSynthesis'in window){try{speechSynthesis.cancel()}catch{}}syncLibListen17()}function speakLibRow17(){if(!('speechSynthesis'in window)||!('SpeechSynthesisUtterance'in window)||!libListenRows17.length)return;try{speechSynthesis.cancel()}catch{}let utterance=new SpeechSynthesisUtterance(libListenRows17[libListenRowPos17]);libSpeechUtterance17=utterance;libSpeechState17='playing';utterance.rate=.96;utterance.onend=()=>{if(libSpeechUtterance17!==utterance)return;libSpeechUtterance17=null;libSpeechState17='idle';if(libListenRowPos17<libListenRows17.length-1){libListenRowPos17++;syncLibListen17();speakLibRow17();return}let a=currentAnalysis();if(a&&libListenTurnPos17<libListenTurns17.length-1){libListenTurnPos17++;libListenRows17=markdownSpeechRows17(a.turns[libListenTurns17[libListenTurnPos17]]?.content);libListenRowPos17=0;syncLibListen17();speakLibRow17();return}syncLibListen17()};utterance.onerror=e=>{if(libSpeechUtterance17!==utterance)return;libSpeechUtterance17=null;libSpeechState17='idle';syncLibListen17()};syncLibListen17();speechSynthesis.speak(utterance)}function toggleLibSpeech17(){if(libSpeechState17==='playing'){speechSynthesis.pause();libSpeechState17='paused';syncLibListen17();return}if(libSpeechState17==='paused'){speechSynthesis.resume();libSpeechState17='playing';syncLibListen17();return}speakLibRow17()}function moveLibRow17(delta){let next=libListenRowPos17+delta;if(next<0||next>=libListenRows17.length)return;let resume=libSpeechState17==='playing';try{speechSynthesis.cancel()}catch{}libSpeechState17='idle';libSpeechUtterance17=null;libListenRowPos17=next;syncLibListen17();if(resume)speakLibRow17()}function moveLibTurn17(delta){let a=currentAnalysis(),next=libListenTurnPos17+delta;if(!a||next<0||next>=libListenTurns17.length)return;let resume=libSpeechState17==='playing';try{speechSynthesis.cancel()}catch{}libSpeechState17='idle';libSpeechUtterance17=null;libListenTurnPos17=next;libListenRows17=markdownSpeechRows17(a.turns[libListenTurns17[next]]?.content);libListenRowPos17=0;syncLibListen17();if(resume)speakLibRow17()}function setLibDock17(mode){if(mode==='listen'){let a=currentAnalysis();if(!a||!setLibListenResponse17(a))return;libDockMode17='listen';syncLibListen17();return}stopLibSpeech17();libDockMode17='chat';syncLibListen17()}$('libChatMode').onclick=()=>setLibDock17('chat');$('libListenMode').onclick=()=>setLibDock17('listen');$('libListenPrevTurn').onclick=()=>moveLibTurn17(-1);$('libListenBack').onclick=()=>moveLibRow17(-1);$('libListenPlay').onclick=toggleLibSpeech17;$('libListenForward').onclick=()=>moveLibRow17(1);$('libListenNextTurn').onclick=()=>moveLibTurn17(1);window.addEventListener('pagehide',()=>{if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch{}});'''
    s = s.replace(anchor, anchor + tts, 1)

old_render_end = "$('transcript').scrollTop=$('transcript').scrollHeight}async function commitLibraryTitle()"
if old_render_end in s:
    s = s.replace(old_render_end, "$('transcript').scrollTop=$('transcript').scrollHeight;syncLibListen17()}async function commitLibraryTitle()", 1)
elif 'scrollHeight;syncLibListen17()}async function commitLibraryTitle()' not in s:
    raise SystemExit('Turn 17 Library sync anchor missing')

old_empty = "$('transcript').innerHTML='<p style=\"color:var(--muted)\">Select an Analysis.</p>';return}"
if old_empty in s:
    s = s.replace(old_empty, "$('transcript').innerHTML='<p style=\"color:var(--muted)\">Select an Analysis.</p>';syncLibListen17();return}", 1)
'''
    if 'DST.write_text(s)' not in s:
        raise SystemExit('Turn 17 builder write anchor missing')
    s = s.replace('DST.write_text(s)', patch + '\nDST.write_text(s)', 1)

builder.write_text(s)

# Keep the style fixture deterministic.  Add the follow-on UX checks once.
qa = Path('market-navigator-turn17-qa.mjs')
t = qa.read_text()
oldq = "    p.schema='market-navigator-series-style-v2';\n    p.widths=Array(10).fill(7);"
newq = "    p.schema='market-navigator-series-style-v2';\n    p.colors=p.colors||['#27D3F5','#FFD166','#48D597','#FF5A6F','#A78BFA','#FF9F1C','#4C78FF','#FF6EC7','#B8E43C','#AEB8C4'];\n    p.assignments=p.assignments||{risk:0,growth:1,macro:2};\n    p.widths=Array(10).fill(7);"
if oldq in t:
    t = t.replace(oldq, newq, 1)
elif newq not in t:
    raise SystemExit('Turn 17 QA style fixture anchor missing')

if 'TURN17_TTS_MOCK' not in t:
    old_page = "  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];\n"
    new_page = old_page + "  // TURN17_TTS_MOCK: deterministic browser-speech surface for headless qualification.\n  await page.addInitScript(()=>{class U{constructor(text){this.text=String(text);this.rate=1;this.onend=null;this.onerror=null}};Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});const speech={last:null,cancelCount:0,paused:false,speak(u){this.last=u;this.paused=false},cancel(){this.cancelCount++;this.paused=false},pause(){this.paused=true},resume(){this.paused=false}};Object.defineProperty(window,'speechSynthesis',{value:speech,configurable:true});window.__qaSpeech=speech});\n"
    if old_page not in t:
        raise SystemExit('Turn 17 QA page anchor missing')
    t = t.replace(old_page, new_page, 1)

if 'card arrow must move to the next selectable series' not in t:
    anchor = "  assert.notEqual(await page.locator('#moreInfo').evaluate(el=>getComputedStyle(el).pointerEvents),'none','More info remains operable');\n"
    add = anchor + "\n  // Card arrows navigate the selectable component legend order without extra focus clicks.\n  assert.equal(await page.locator('#prevInfo').count(),1,'card previous arrow');\n  assert.equal(await page.locator('#nextInfo').count(),1,'card next arrow');\n  assert.equal(await page.locator('#nextInfo').isDisabled(),false,'HYG should have a next selectable component in the governed RSK legend');\n  await page.locator('#nextInfo').click();\n  await page.waitForTimeout(80);\n  const arrowNext=await page.locator('#legend .lg.active').getAttribute('data-id');\n  assert(arrowNext&&arrowNext!=='hyg','card arrow must move to the next selectable series');\n  assert.equal(await page.locator('#nowChart').getAttribute('data-active-series'),arrowNext,'arrow navigation must update chart isolation');\n  assert.equal(await page.locator('#prevInfo').isDisabled(),false,'next card must allow previous navigation');\n  await page.locator('#prevInfo').click();\n  await page.waitForTimeout(80);\n  assert.equal(await page.locator('#legend .lg.active').getAttribute('data-id'),'hyg','previous arrow must return to prior series');\n"
    if anchor not in t:
        raise SystemExit('Turn 17 QA card insertion anchor missing')
    t = t.replace(anchor, add, 1)

if 'Library Listen must reuse browser SpeechSynthesis' not in t:
    anchor = "  await page.locator('#dataClose').click();\n\n  // Phone card remains compact/top-right and chart chrome remains one row.\n"
    add = "  await page.locator('#dataClose').click();\n\n  // Library Listen must reuse browser SpeechSynthesis with PRISM-style navigation.\n  await page.evaluate(async()=>{\n    const rec={id:'qa-tts',title:'QA Browser TTS',status:'ready',createdAt:'2099-01-01T00:00:00Z',updatedAt:'2099-01-01T00:00:00Z',state:{horizon:'5D',series:['spy'],active:'spy',index:'risk',evidence:[],chart:{schema:'market-navigator-chart-snapshot-v1',origin:'qa',horizon:'5D',window:{horizon:'5D',start:1788220800000,end:1788998399000,startLabel:'2026-09-01',endLabel:'2026-09-09'},mode:'native',active:'spy',series:[{id:'spy',label:'SPY',full:'SPY',unit:'USD',color:'#27D3F5',renderType:'line',axis:0,axisLabel:'USD',available:true,points:[{t:1788307200000,sourceT:1788307200000,v:100,raw:100,idx:100},{t:1788393600000,sourceT:1788393600000,v:101,raw:101,idx:101}]}],dataRevision:{derived:'qa'}}},turns:[{role:'assistant',content:'# First analysis\\n\\nFirst sentence. Second sentence.',at:'2099-01-01T00:00:00Z'},{role:'user',content:'Follow up',at:'2099-01-01T00:01:00Z'},{role:'assistant',content:'## Second analysis\\n\\nThird sentence.',at:'2099-01-01T00:02:00Z'}]};\n    await new Promise((resolve,reject)=>{const r=indexedDB.open('marketNavigatorLocal',1);r.onsuccess=()=>{const tx=r.result.transaction('analyses','readwrite');tx.objectStore('analyses').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)};r.onerror=()=>reject(r.error)});\n  });\n  await page.reload({waitUntil:'networkidle'});\n  await page.locator('[data-view=\"library\"]').click();\n  await page.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');\n  assert.equal(await page.locator('#libModeDock').isVisible(),true,'Library TTS dock visible for selected Analysis');\n  assert.equal(await page.locator('#libListenMode').isDisabled(),false,'Listen enabled for completed assistant analysis');\n  await page.locator('#libListenMode').click();\n  assert.equal(await page.locator('#libListenBar').isVisible(),true,'Listen controls visible');\n  assert.equal(await page.locator('#libComposer').isVisible(),false,'Chat composer hidden in Listen mode');\n  assert.match(await page.locator('#libListenProgress').innerText(),/Response 1 of 2 · Row 1 of/i);\n  await page.locator('#libListenPlay').click();\n  assert.equal(await page.locator('#libListenPlay').innerText(),'⏸','play toggles to pause');\n  assert(await page.evaluate(()=>window.__qaSpeech.last?.text?.length>0),'Library Listen must reuse browser SpeechSynthesis');\n  assert.equal(await page.locator('#libListenNextTurn').isDisabled(),false,'next response navigation enabled');\n  await page.locator('#libListenNextTurn').click();\n  assert.match(await page.locator('#libListenProgress').innerText(),/Response 2 of 2/i);\n  await page.locator('#libListenPrevTurn').click();\n  assert.match(await page.locator('#libListenProgress').innerText(),/Response 1 of 2/i);\n  await page.locator('#libChatMode').click();\n  assert.equal(await page.locator('#libComposer').isVisible(),true,'Chat mode restores composer');\n  assert.equal(await page.locator('#libListenBar').isVisible(),false,'Chat mode hides Listen controls');\n\n  // Phone card remains compact/top-right and chart chrome remains one row.\n"
    if anchor not in t:
        raise SystemExit('Turn 17 QA TTS insertion anchor missing')
    t = t.replace(anchor, add, 1)

qa.write_text(t)

print('TURN 17 NORMALIZE: PASS')
