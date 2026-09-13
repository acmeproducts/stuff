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

APP.write_text(s)

q=QA.read_text()
old="window.__qaSpeech=speech;window.__opened=[];window.open=(u)=>{window.__opened.push(String(u));return null};"
new="window.__qaSpeech=speech;window.__opened=[];window.clean=s=>String(s||'').replace(/\\s+/g,' ').trim();window.open=(u)=>{window.__opened.push(String(u));return null};"
assert q.count(old)==1,('QA browser clean helper',q.count(old))
q=q.replace(old,new,1)

# On phone, Library opens list-first. Open the rail, enter Library, then open the
# selected analysis card so the detail/Listen dock is genuinely visible.
old="await p.reload({waitUntil:'networkidle'});await p.locator('[data-view=\"library\"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');"
new="await p.reload({waitUntil:'networkidle'});if(await p.locator('#rail').evaluate(el=>el.classList.contains('closed')))await p.locator('#toggle').click();await p.locator('[data-view=\"library\"]').click();await p.waitForFunction(()=>document.querySelector('#libTitle')?.value==='QA Browser TTS');if(!(await p.locator('#libListenMode').isVisible())){await p.locator('#libList [data-id]').first().click();await p.waitForFunction(()=>document.querySelector('#libraryWorkspace')?.classList.contains('detailOpen'))}"
assert q.count(old)==1,('TTS phone navigation',q.count(old))
q=q.replace(old,new,1)
QA.write_text(q)

print('TURN 25 FINALIZE: PASS')
