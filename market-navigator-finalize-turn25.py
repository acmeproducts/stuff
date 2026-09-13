#!/usr/bin/env python3
from pathlib import Path

APP=Path('market-navigator-turn25-pre-ship.html')
QA=Path('market-navigator-turn25-qa.mjs')
s=APP.read_text()

# Remove the tail of Turn 18's former three-tab Config function left after the
# four-tab Turn 25 function is installed. The click binding that follows stays.
residual="document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings()}"
assert s.count(residual)==1,('config residual',s.count(residual))
s=s.replace(residual,'',1)

# Omnisearch is global when the user has typed a query. Category limits only
# apply to empty-query browsing.
old="filter(id=>{let g=IDX.includes(id)?'Other':pickerGroups25(id);return g===S.nowPickerCat}).filter(id=>`${id} ${IDX.includes(id)?S.def.indices[id]?.name:name(id)} ${IDX.includes(id)?AB[id]:label(id)}`.toLowerCase().includes(q))"
new="filter(id=>{let g=IDX.includes(id)?'Other':pickerGroups25(id);return q?true:g===S.nowPickerCat}).filter(id=>`${id} ${IDX.includes(id)?S.def.indices[id]?.name:name(id)} ${IDX.includes(id)?AB[id]:label(id)}`.toLowerCase().includes(q))"
assert s.count(old)==1,('global Add search',s.count(old))
s=s.replace(old,new,1)

# Turn 17/18's draw engine automatically promoted the first plotted series when
# active was null. Neutral ENV explicitly requires no default active/reference.
old="let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);if(sel)setActive(sel.id,false);model=paint();syncActive();"
new="let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);let neutralEnv=which==='now'&&S.level===1&&!S.nowFocus;if(sel&&!neutralEnv)setActive(sel.id,false);if(neutralEnv){active=null;S.nowActive=null;S.nowFocus=null}model=paint();syncActive();"
assert s.count(old)==1,('neutral draw fallback',s.count(old))
s=s.replace(old,new,1)

# Keep the frozen ENV snapshot neutral as well.
old="captureNowState(sets,w,'indexed');S.nowPaint25={sets,w,mode:'indexed'};draw('now',sets,w,'indexed');S.nowActive=null;S.nowFocus=null;if(S.nowChartState){S.nowChartState.active=null;if(S.nowChartState.chart)S.nowChartState.chart.active=null}document.querySelectorAll('#legend [data-id]').forEach(n=>n.classList.remove('active'));$('nowChart').dataset.emphasis='false'}async function openV2"
new="captureNowState(sets,w,'indexed');S.nowPaint25={sets,w,mode:'indexed'};draw('now',sets,w,'indexed');S.nowActive=null;S.nowFocus=null;if(S.nowChartState){S.nowChartState.active=null;if(S.nowChartState.chart)S.nowChartState.chart.active=null}$('nowChart').dataset.emphasis='false'}async function openV2"
assert s.count(old)==1,('ENV neutral snapshot',s.count(old))
s=s.replace(old,new,1)

# Android Chromium-family pause ends/cancels the utterance. Prevent the cancelled
# utterance's onend handler from auto-advancing, then restart the same row on Play.
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

# Playwright serializes waitForFunction/evaluate callbacks into the browser.
# Provide the same whitespace normalizer there instead of relying on Node scope.
q=QA.read_text()
old="window.__qaSpeech=speech;window.__opened=[];window.open=(u)=>{window.__opened.push(String(u));return null};"
new="window.__qaSpeech=speech;window.__opened=[];window.clean=s=>String(s||'').replace(/\\s+/g,' ').trim();window.open=(u)=>{window.__opened.push(String(u));return null};"
assert q.count(old)==1,('QA browser clean helper',q.count(old))
QA.write_text(q.replace(old,new,1))

print('TURN 25 FINALIZE: PASS')
