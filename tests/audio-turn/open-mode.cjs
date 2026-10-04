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
test('Filipino listens with the code Deepgram accepts (tl), never fil',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:true,resumeMs:300}))});
 await create(page,'FilRoom','en','fil');await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 assert.ok(page.testSockets.some(w=>w.url().includes('language=tl&')),'a speech connection uses tl');
 assert.equal(page.testSockets.filter(w=>w.url().includes('language=fil')).length,0,'no speech connection uses fil');
});
test('open mode: opening the North keyboard does not cut read-aloud that is playing, and the speaker button stays on',async({page})=>{
 await page.evaluate(()=>{window.ttsLog=[];speechSynthesis.speak=u=>{window.ttsLog.push(u.text);setTimeout(()=>u.onstart&&u.onstart(),10)}});
 const s=await openRoom(page,'TtsMid');
 await page.locator('#strip-north .tts').click();
 final(s.south,'hello friend',.93);await settled(page,1);
 await page.waitForFunction(()=>window.ttsLog.length===1&&audioTurn.state().phase==='playing');
 await page.locator('#in-north').focus();await page.waitForFunction(()=>INPUT.owner==='north'&&INPUT.mode==='kb');
 assert.equal(await page.evaluate(()=>audioTurn.state().phase),'playing','read-aloud still playing after the North keyboard opens');
 assert.equal(await page.locator('#strip-north .tts').getAttribute('data-on'),'true','speaker button stays on');
});
test('open mode: English and Filipino channels both hear the same speech; the words decide who spoke, ties still go to compose',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:true,resumeMs:300}))});
 await page.route(/\/dict\/(en|fil)\.json/,route=>{const l=/\/dict\/(en|fil)\.json/.exec(route.request().url())[1];return route.fulfill({path:require('node:path').join(__dirname,'../../dict/'+l+'.json'),contentType:'application/json',headers:{'access-control-allow-origin':'*'}})});
 await create(page,'EnFil','en','fil');await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 await page.waitForFunction(()=>{try{return JSON.parse(localStorage.getItem('duck_dict_fil')||'[]').length===10636&&JSON.parse(localStorage.getItem('duck_dict_en')||'[]').length===17523}catch(e){return false}},null,{timeout:15000});
 const sock=l=>page.testSockets.filter(w=>w.url().includes('language='+l)).slice(-1)[0];
 const both=(text,sc,nc)=>{final(sock('en-US'),text,sc);final(sock('tl'),text,nc)};
 both('I would like to order a coffee please',.99,.97);await settled(page,1);
 assert.equal(await page.evaluate(()=>HIST[0].side),'south','English words go to South even though the Filipino channel scored almost the same');
 both('Gusto ko ng kape pakiusap',.96,.97);await settled(page,2);
 assert.equal(await page.evaluate(()=>HIST[1].side),'north','Filipino words go to North');
 await page.waitForTimeout(1700);both('Okay thank you',.99,.97);await page.waitForTimeout(1500);
 assert.equal(await page.evaluate(()=>HIST.length),2,'words that fit both languages are not guessed: they go to compose as before');
 assert.ok((await events(page,'low-confidence-owner')).length>=1);
});
test('Malay room: speech heard on the Malay channel is never rewritten (voice trusts the channel language); Indonesian typed in a Malay room is kept too',async({page})=>{
 await page.evaluate(()=>{localStorage.setItem('tb_dg_key','synthetic-key');localStorage.setItem('chat_test_audio',JSON.stringify({mode:'open',tones:true,resumeMs:300}))});
 await create(page,'MsRoom','en','ms');await page.waitForFunction(()=>mic.south.active&&mic.north.active);
 const ms=page.testSockets.filter(w=>w.url().includes('language=ms')).slice(-1)[0];
 // the app's language guess is forced to Indonesian, as the real detector did on the device
 await page.evaluate(()=>{window.__guess=window.detectLangAsync;});
 final(ms,'Ini adalah sistem yang sederhana',.95);await settled(page,1);
 const m=await page.evaluate(()=>({text:HIST[0].text,src:HIST[0].src,side:HIST[0].side}));
 assert.equal(m.side,'north');assert.equal(m.text,'Ini adalah sistem yang sederhana','spoken words kept');assert.equal(m.src,'ms');
 const r=await page.evaluate(()=>normalizeOutgoing({myLang:'ms',theirLang:'en',myLangMode:'fixed'},'Ini adalah sistem yang sederhana','id'));
 assert.equal(r.text,'Ini adalah sistem yang sederhana','typed/guessed Indonesian in a Malay room is kept');assert.equal(r.lang,'ms');
 const r2=await page.evaluate(()=>normalizeOutgoing({myLang:'id',theirLang:'en',myLangMode:'fixed'},'Ini adalah sistem yang mudah','ms'));
 assert.equal(r2.text,'Ini adalah sistem yang mudah');assert.equal(r2.lang,'id');
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
