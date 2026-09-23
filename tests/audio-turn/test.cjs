// Controller gates, run without a browser: fake clock, fake speech, fake audio.
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
// The controller lives inside chat-test.html; test it from there.
const html=fs.readFileSync(__dirname+'/../../chat-test.html','utf8'),B='/* ===== audio-turn: begin ===== */',E='/* ===== audio-turn: end ===== */';
if(html.split(B).length!==2||html.split(E).length!==2)throw new Error('audio-turn markers missing');
const code=html.slice(html.indexOf(B)+B.length,html.indexOf(E));
function world(opts){
 opts=opts||{};let now=10000,timers=[],spoken=[],cancels=0,logs=[],diags=[],sent=[],composed=[],store={};
 const synth={cancel(){cancels++},speak(u){spoken.push(u)}};
 const osc=()=>({type:'',frequency:{value:0},connect(){},start(){},stop(){}}),gain=()=>({gain:{setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
 const AC=opts.noAudio?undefined:function(){return{state:'running',currentTime:0,destination:{},createOscillator:osc,createGain:gain}};
 const body={classList:{contains:c=>c==='cl-empty-room'?!!opts.empty:false}};
 const mk=side=>({on:false,started:0,stopped:0,start(){this.started++;if(opts.deny)return Promise.reject({name:'NotAllowedError'});this.on=true;return Promise.resolve()},hardStop(){this.stopped++;this.on=false}});
 const mic={south:mk('south'),north:mk('north')};
 const w={speechSynthesis:synth,localStorage:{getItem:k=>store[k]==null?null:store[k],setItem:(k,v)=>{store[k]=String(v)}},AudioContext:AC};
 const ctx={window:w,document:{hidden:false,body,addEventListener(){}},SpeechSynthesisUtterance:function(t){this.text=t},gL:l=>({tts:l}),norm:s=>String(s||'').trim(),
  log:(ev,d,l)=>logs.push({ev,d,l}),Date:{now:()=>now},setTimeout:(f,ms)=>{const t={at:now+ms,f};timers.push(t);return t},clearTimeout:t=>{timers=timers.filter(x=>x!==t)},Math,JSON,Object,String,Number,Array,Promise};
 vm.runInNewContext(code,ctx);const a=w.audioTurn;
 const langs=Object.assign({south:'en',north:'th'},opts.langs);
 a.bind({mic,langOf:s=>langs[s],diag:(m,e)=>diags.push(m),toast(){},send:(s,t)=>sent.push([s,t]),ownsMic:()=>false,paint(){},compose:(s,t)=>composed.push([s,t])});
 const advance=ms=>{const end=now+ms;for(;;){timers.sort((x,y)=>x.at-y.at);const t=timers[0];if(!t||t.at>end)break;timers.shift();now=t.at;t.f()}now=end};
 return {a,mic,logs,diags,sent,composed,spoken,store,langs,advance,get cancels(){return cancels},tick:()=>new Promise(r=>setImmediate(r)),ev:n=>logs.filter(x=>x.ev==='audio:'+n)};
}
const tests=[];const test=(n,f)=>tests.push([n,f]);

test('TTS start blocks both sides; resume exactly once after decay and speak tone',async()=>{
 const t=world();t.a.speak('สวัสดี','th');
 assert.equal(t.a.admit('south'),false);assert.equal(t.a.admit('north'),false);
 t.advance(500);assert.equal(t.spoken.length,1,'speech starts after wait tone');
 t.spoken[0].onstart();t.spoken[0].onend();t.spoken[0].onend();t.spoken[0].onerror({error:'interrupted'});
 assert.equal(t.ev('tts-completed').length,1);assert.ok(t.ev('tts-end').every(x=>x.d.outcome==='blocked'),'duplicate callbacks are blocked, not repeated');
 t.advance(299);assert.equal(t.a.admit('south'),false,'still in decay');
 t.advance(1);assert.equal(t.a.state().phase,'cue');assert.equal(t.a.admit('north'),false,'tone never reaches STT');
 t.advance(500);assert.equal(t.a.state().phase,'idle');assert.equal(t.a.admit('south'),true);assert.equal(t.a.admit('north'),true);
 assert.equal(t.ev('stt-submit-resumed').filter(x=>x.d.outcome==='ok').length,1);
 assert.deepEqual(t.ev('cue-played').map(x=>x.d.cue),['wait','speak']);
});
test('Cancel during playback resumes immediately with no speak tone; stale end ignored',()=>{
 const t=world();t.a.speak('hello there','en');t.advance(500);const u=t.spoken[0];
 t.a.cancel('room switch');assert.equal(t.a.state().phase,'idle');u.onend();t.advance(2000);
 assert.equal(t.ev('cue-played').filter(x=>x.d.cue==='speak').length,0);assert.equal(t.ev('tts-cancelled').length,1);
});
test('Playback error is an error record and still resumes',()=>{
 const t=world();t.a.speak('hello there','en');t.advance(500);t.spoken[0].onerror({error:'synthesis-failed'});t.advance(1000);
 assert.equal(t.ev('tts-failed')[0].d.outcome,'error');assert.equal(t.a.state().phase,'idle');
});
test('New playback during decay supersedes the old resume timer',()=>{
 const t=world();t.a.speak('one','en');t.advance(500);t.spoken[0].onend();t.a.speak('two','en');t.advance(1000);
 assert.equal(t.a.state().phase,'playing');assert.equal(t.spoken.length,2);
});
test('No tones when turned off; no audio device logs cue-unavailable',()=>{
 const t=world();t.store.chat_test_audio=JSON.stringify({tones:false});t.a.speak('hi there','en');t.advance(1);assert.equal(t.spoken.length,1);assert.equal(t.ev('cue-played').length,0);
 const u=world({noAudio:true});u.a.speak('hi there','en');assert.equal(u.ev('cue-played')[0].d.reason,'cue-unavailable');assert.equal(u.spoken.length,1);
});
test('Echo of read-aloud text is rejected before routing (ask mode too)',()=>{
 const t=world();t.store.chat_test_audio=JSON.stringify({mode:'ask'});t.a.speak('Where is the train station?','en');t.advance(500);t.spoken[0].onend();t.advance(1000);
 t.a.heard('south','where is the train station',null,{confidence:.9});assert.equal(t.sent.length,0);assert.equal(t.ev('transcript-rejected')[0].d.reason,'echo');
 t.a.heard('south','I need coffee','en',{confidence:.9});assert.deepEqual(t.sent,[['south','I need coffee']]);
});
test('Open mode: both mics open; mute toggles one side only',async()=>{
 const t=world();t.a.sync();await t.tick();assert.equal(t.mic.south.on,true);assert.equal(t.mic.north.on,true);assert.equal(t.ev('mic-open').length,2);
 assert.equal(t.a.toggleMute('north'),true);assert.equal(t.mic.north.on,false);assert.equal(t.mic.south.on,true);
 t.a.speak('hi there','en');t.advance(500);t.spoken[0].onend();t.advance(1000);
 assert.equal(t.mic.north.on,false,'mute survives TTS resume');assert.ok(t.ev('stt-submit-resumed').some(x=>x.d.outcome==='blocked'&&x.d.reason==='user-muted'));
 t.a.sync();await t.tick();assert.equal(t.mic.north.on,false);assert.equal(t.mic.north.started,1,'no duplicate starts');
});
test('Open mode: routing picks the confident language before normalization',async()=>{
 const t=world();t.a.sync();await t.tick();
 t.a.heard('south','I would like two coffees please','en',{confidence:.93});t.a.heard('north','ไอ วู้ด ไลค์','th',{confidence:.41});
 assert.equal(t.sent.length,0,'waits for the group window');t.advance(700);
 assert.deepEqual(t.sent,[['south','I would like two coffees please']]);
 t.advance(5000);t.a.heard('north','ขอบคุณครับ','th',{confidence:.88});t.a.heard('south','cop coon','en',{confidence:.52});t.advance(700);
 assert.deepEqual(t.sent[1],['north','ขอบคุณครับ']);assert.equal(t.ev('transcript-routed').length,2);
 assert.ok(t.ev('transcript-routed').every(x=>x.d.src&&x.d.tgt&&typeof x.d.conf==='number'&&x.d.tts));
});
test('Open mode: English channel on the Thai socket routes to the English side',async()=>{
 const t=world();t.a.sync();await t.tick();t.a.heard('north','the bill please','en',{confidence:.9});t.advance(700);assert.deepEqual(t.sent,[['south','the bill please']]);
});
test('Open mode: unsure goes to compose with bong, not sent',async()=>{
 const t=world();t.a.sync();await t.tick();
 t.a.heard('south','okay','en',{confidence:.5});t.a.heard('north','โอเค','th',{confidence:.48});t.advance(700);
 assert.equal(t.sent.length,0);assert.equal(t.composed.length,1);assert.equal(t.ev('low-confidence-owner')[0].d.outcome,'blocked');
 assert.equal(t.ev('cue-played').slice(-1)[0].d.cue,'bong');
});
test('Script veto: Thai characters cannot be owned by the English side',()=>{
 const t=world();assert.equal(t.a.scriptSide('สวัสดีครับ'),'north');assert.equal(t.a.scriptSide('hello'),'south');
});
test('Only one side open: that side owns speech directly',async()=>{
 const t=world();t.a.sync();await t.tick();t.a.toggleMute('south');t.a.heard('north','ขอบคุณ','th',{confidence:.3});assert.deepEqual(t.sent,[['north','ขอบคุณ']]);
});
test('Same-language room falls back to ask mode',async()=>{
 const t=world({langs:{north:'en'}});t.a.sync();await t.tick();assert.equal(t.mic.south.on,false);assert.equal(t.a.toggleMute('south'),false);assert.equal(t.ev('mode-fallback').length,1);
 t.a.heard('north','hello','en',{confidence:.9});assert.deepEqual(t.sent,[['north','hello']]);
});
test('Room switch discards a pending group; keyboard teardown keeps mics',async()=>{
 const t=world();t.a.sync();await t.tick();
 assert.equal(t.a.keepsMic('sent'),true);assert.equal(t.a.keepsMic('acquire:south/kb'),true);assert.equal(t.a.keepsMic('room switch'),false);
 t.a.heard('south','hello friend','en',{confidence:.9});t.a.afterTeardown('room switch');t.advance(1000);
 assert.equal(t.sent.length,0);assert.ok(t.ev('stale-session').length>=1);
});
test('Permission denied is an error record and marks the side muted',async()=>{
 const t=world({deny:true});t.a.sync();await t.tick();await t.tick();
 assert.equal(t.ev('mic-open').filter(x=>x.d.reason==='permission-denied').length,2);assert.equal(t.a.state().muted.south,true);
});
test('Every record carries outcome and generation; no key-like values',async()=>{
 const t=world();t.a.sync();await t.tick();t.a.speak('hi there','en');t.advance(500);t.spoken[0].onend();t.advance(1000);
 t.logs.filter(x=>x.ev.startsWith('audio:')).forEach(x=>{assert.ok(['ok','blocked','error'].includes(x.d.outcome));assert.equal(typeof x.d.gen,'number')});
 assert.ok(t.diags.every(d=>/\[(ok|blocked|error)\]/.test(d)));assert.ok(!t.diags.some(d=>/token|key=/.test(d)));
});
test('Playback that never ends times out and resumes',()=>{
 const t=world();t.a.speak('hi','en');t.advance(500);t.advance(3000);assert.equal(t.ev('tts-failed')[0].d.reason,'tts-timeout');t.advance(1000);assert.equal(t.a.state().phase,'idle');
});
test('Settings persist mode, tones, delay',()=>{
 const t=world();const ui={mode:{value:'ask'},tones:{value:'off'},volume:{value:'0.2'},resume:{value:'450'}};t.a.saveSettings(ui);
 const c=t.a.cfg();assert.equal(c.mode,'ask');assert.equal(c.tones,false);assert.equal(c.resumeMs,450);
});

(async()=>{let fail=0;for(const [n,f] of tests){try{await f();console.log('PASS',n)}catch(e){fail++;console.log('FAIL',n);console.log(e)}}if(fail){process.exitCode=1;console.log(fail+' failed')}else console.log('all '+tests.length+' passed')})();
