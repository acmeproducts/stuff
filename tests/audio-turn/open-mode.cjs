// Open-mode scenarios, appended to the Chatlink harness (uses its create/menu/send/settled helpers).
async function openRoom(page,name){await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:true,resumeMs:300}))});await create(page,name);await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 const byLang=l=>page.testSockets.filter(w=>w.url().includes('language='+l)).slice(-1)[0];return {south:byLang('en-US'),north:byLang('th')};}
const final=(ws,text,confidence)=>{ws.send(JSON.stringify({is_final:true,channel:{alternatives:[{transcript:text,confidence}]}}));ws.send(JSON.stringify({type:'UtteranceEnd'}))};
const events=(page,name)=>page.evaluate(n=>debugLog.filter(e=>e.ev==='audio:'+n).map(e=>e.d),name);
test('open mode: both listen, speaker routed, read-aloud silences the mic, echo dropped, resume',async({page})=>{
 await page.evaluate(()=>{window.ttsLog=[];speechSynthesis.speak=u=>{window.ttsLog.push(u.text);window.finishTTS=()=>u.onend&&u.onend();setTimeout(()=>u.onstart&&u.onstart(),10)}});
 const s=await openRoom(page,'Open');
 await page.locator('#strip-north .tts').click();
 final(s.south,'hello friend',.93);final(s.north,'เฮลโล เฟรนด์',.41);
 await settled(page,1);assert.equal(await page.evaluate(()=>HIST[0].side),'south');assert.equal(await page.evaluate(()=>HIST[0].tr),'สวัสดีเพื่อน');
 await page.waitForFunction(()=>window.ttsLog.length===1);assert.equal(await page.evaluate(()=>audioTurn.state().phase),'playing');
 const mark=page.testZero.length;await page.waitForTimeout(600);const during=page.testZero.slice(mark);
 assert.ok(during.length>2&&during.every(Boolean),'only silence is sent while read-aloud plays');
 final(s.north,'สวัสดีเพื่อน',.95);await page.waitForTimeout(1300);assert.equal(await page.evaluate(()=>HIST.length),1,'echo not sent');
assert.ok((await events(page,'transcript-rejected')).some(d=>d.reason==='echo'));
 await page.evaluate(()=>window.finishTTS());await page.waitForFunction(()=>audioTurn.state().phase==='idle');
 const after=page.testZero.length;await page.waitForTimeout(600);assert.ok(page.testZero.slice(after).some(z=>!z),'real audio flows after resume');
 const cues=(await events(page,'cue-played')).map(d=>d.cue);assert.deepEqual(cues,['wait','speak']);
 assert.equal((await events(page,'stt-submit-resumed')).filter(d=>d.outcome==='ok').length,1);
 assert.equal(await page.locator('#audio-test-controls').count(),0,'old experiment removed');
});
test('open mode: read-aloud stays on while the North keyboard opens and both sides talk',async({page})=>{
 await page.evaluate(()=>{window.ttsLog=[];speechSynthesis.speak=u=>{window.ttsLog.push(u.text);setTimeout(()=>{u.onstart&&u.onstart();setTimeout(()=>u.onend&&u.onend(),20)},10)}});
 const s=await openRoom(page,'TtsStays');
 await page.locator('#strip-north .tts').click();
 assert.equal(await page.locator('#strip-north .tts').getAttribute('data-on'),'true');
 await page.locator('#in-north').focus();
 await page.waitForFunction(()=>INPUT.owner==='north'&&INPUT.mode==='kb');
 assert.equal(await page.locator('#strip-north .tts').getAttribute('data-on'),'true','button stays on after the North keyboard opens');
 final(s.south,'hello friend',.93);await settled(page,1);
 await page.waitForFunction(()=>window.ttsLog.length===1,null,{timeout:4000});
 assert.equal(await page.locator('#strip-north .tts').getAttribute('data-on'),'true','button stays on after a message is read');
 await send(page,'south','second message');await settled(page,2);
 await page.waitForFunction(()=>window.ttsLog.length===2,null,{timeout:4000});
 await page.locator('#strip-south .tts').click();
 await page.locator('#in-north').focus();await page.waitForFunction(()=>INPUT.owner==='north'&&INPUT.mode==='kb');
 await send(page,'north','สวัสดีครับ');await settled(page,3);
 await page.waitForFunction(()=>window.ttsLog.length===3,null,{timeout:4000});
 for(const side of ['south','north'])assert.equal(await page.locator('#strip-'+side+' .tts').getAttribute('data-on'),'true','button stays on: '+side);
});
test('open mode: opening the North keyboard does not cut read-aloud that is playing',async({page})=>{
 await page.evaluate(()=>{window.ttsLog=[];window.cancels=0;const c=speechSynthesis.cancel.bind(speechSynthesis);speechSynthesis.cancel=function(){window.cancels++;return c()};speechSynthesis.speak=u=>{window.ttsLog.push(u.text);setTimeout(()=>u.onstart&&u.onstart(),10)}});
 const s=await openRoom(page,'TtsMid');
 await page.locator('#strip-north .tts').click();
 final(s.south,'hello friend',.93);await settled(page,1);
 await page.waitForFunction(()=>window.ttsLog.length===1&&audioTurn.state().phase==='playing');
 const before=await page.evaluate(()=>window.cancels);
 await page.locator('#in-north').focus();await page.waitForFunction(()=>INPUT.owner==='north'&&INPUT.mode==='kb');
 assert.equal(await page.evaluate(()=>audioTurn.state().phase),'playing','read-aloud still playing after the North keyboard opens');
 assert.equal(await page.evaluate(()=>window.cancels),before,'keyboard open did not cancel speech');
});
test('Malay and Indonesian are sibling languages: speech in one is never rewritten into the other',async({page})=>{
 await openRoom(page,'MsId');
 const run=(mine,detected,text)=>page.evaluate(async([mine,detected,text])=>{let calls=0;const orig=window.translateWithRetry;window.translateWithRetry=async(t,f,to)=>{calls++;return{ok:true,text:'REWRITTEN '+t}};try{const r=await normalizeOutgoing({myLang:mine,theirLang:'en',myLangMode:'fixed'},text,detected);return Object.assign({calls:calls},r)}finally{window.translateWithRetry=orig}},[mine,detected,text]);
 let r=await run('ms','id','Ini adalah sistem yang sederhana');assert.equal(r.text,'Ini adalah sistem yang sederhana','Indonesian words kept in a Malay room');assert.equal(r.lang,'ms');assert.equal(r.calls,0);
 r=await run('id','ms','Ini adalah sistem yang mudah');assert.equal(r.text,'Ini adalah sistem yang mudah','Malay words kept in an Indonesian room');assert.equal(r.lang,'id');assert.equal(r.calls,0);
});
test('a language with no speech engine (Khmer) never opens a speech connection; the other side still listens and read-aloud has a voice code',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:true,resumeMs:300}))});
 await create(page,'KmRoom','en','km');await page.waitForFunction(()=>mic.south.active);await page.waitForTimeout(1500);
 assert.equal(page.testSockets.filter(w=>w.url().includes('language=km')).length,0,'no speech connection for Khmer');
 assert.ok(page.testSockets.some(w=>w.url().includes('language=en-US')),'English side still listens');
 const rows=await page.evaluate(()=>window.langCheck());assert.equal(rows.find(r=>r.code==='km').tts,'km-KH');assert.equal(rows.find(r=>r.code==='lo').tts,'lo-LA');
 assert.equal(await page.evaluate(()=>mic.north.active),false,'Khmer mic is not claimed as listening');
});
test('open mode: mute, typing keeps mics, portal closes and reopens them, unsure goes to compose',async({page})=>{
 const s=await openRoom(page,'Mute');
 await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>!mic.south.on&&mic.north.on);
 await send(page,'north','สวัสดีครับ');await settled(page,1);assert.equal(await page.evaluate(()=>mic.north.on),true,'typing does not close mics');
 await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 await menu(page);await page.waitForFunction(()=>!mic.south.on&&!mic.north.on);await page.locator('#cl-close').click();await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 const t=page.testSockets,en=t.filter(w=>w.url().includes('language=en-US')).slice(-1)[0],th=t.filter(w=>w.url().includes('language=th')).slice(-1)[0];
 final(en,'okay',.5);final(th,'โอเค',.48);await page.waitForTimeout(1300);
 assert.equal(await page.evaluate(()=>HIST.length),1,'unsure is not sent');
 const drafts=await page.evaluate(()=>[document.getElementById('in-south').value,document.getElementById('in-north').value]);assert.ok(drafts.includes('okay')||drafts.includes('โอเค'));
 assert.equal((await events(page,'low-confidence-owner')).length,1);assert.ok((await events(page,'cue-played')).some(d=>d.cue==='bong'));
});
test('open mode: settings show microphone mode and switching to ask restores tap-to-talk',async({page})=>{
 await openRoom(page,'Settings');await menu(page);await page.getByRole('button',{name:/settings/i}).first().click();
 await page.getByLabel('Microphone mode').selectOption('ask');await page.getByRole('button',{name:'Save device settings',exact:true}).click();
 await page.locator('#cl-close').click().catch(()=>{});await page.waitForFunction(()=>!document.body.classList.contains('cl-open'));
 await page.waitForFunction(()=>!mic.south.on&&!mic.north.on);await page.locator('#strip-south .micbtn').click();await page.waitForFunction(()=>INPUT.owner==='south'&&INPUT.mode==='mic'&&mic.south.on&&!mic.north.on);
});
