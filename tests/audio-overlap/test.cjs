const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');let now=10000,spoken=[],cancels=0;
const synth={cancel(){cancels++},speak(u){spoken.push(u)}};
const ctx={window:{speechSynthesis:synth},document:{hidden:false,getElementById(){return null},addEventListener(){}},SpeechSynthesisUtterance:function(text){this.text=text},gL:l=>({tts:l}),norm:s=>s.trim(),setInterval(){},Date:class extends Date {static now(){return now}}};
vm.runInNewContext(fs.readFileSync(__dirname+'/controller.js','utf8'),ctx);const a=ctx.window.audioOverlap;
a.setMode('gaps');a.observe([.1,.1]);a.enqueue('one','en');assert.equal(spoken.length,0);now+=901;a.tick();assert.equal(spoken.length,1);
a.enqueue('two','en');assert.equal(spoken.length,1);spoken[0].onend();now+=901;a.tick();assert.equal(spoken[1].text,'two');
a.enqueue('old room','en');synth.cancel();spoken[1].onend();now+=1000;a.tick();assert.equal(a.state().queued,0);assert.equal(spoken.length,2);
a.setMode('continuous');a.observe([.5]);a.enqueue('overlap','en');assert.equal(spoken.length,3);a.toggleHold();assert.equal(a.state().playing,false);a.enqueue('held','en');assert.equal(spoken.length,3);a.toggleHold();a.tick();assert.equal(spoken.length,4);spoken[3].onerror();assert.equal(a.state().playing,false);
a.clear();ctx.document.hidden=true;a.enqueue('hidden','en');assert.equal(spoken.length,4);
console.log('PASS gap scheduling, FIFO, room cancellation, stale callbacks, continuous playback, hold/resume, playback error, hidden page');

a.clear();ctx.document.hidden=false;ctx.window.mic={north:{on:true}};a.setMode('guarded');a.enqueue('held for speaker','en');const count=spoken.length;a.tick();assert.equal(spoken.length,count);ctx.window.mic.north.on=false;a.cancelFor('self-toggle-off');a.tick();assert.equal(spoken.length,count+1);assert.equal(spoken.at(-1).text,'held for speaker');console.log('PASS active mic blocks TTS; mic stop retains and releases queue');
