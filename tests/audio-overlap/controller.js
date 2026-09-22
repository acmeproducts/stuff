/* Playback scheduling experiment: audio energy is NOT speaker identification. */
(function(){
 const synth=window.speechSynthesis, cancelNative=synth.cancel.bind(synth);
 let queue=[],current=null,lastVoice=0,mode='guarded',epoch=0,hold=false,lastError='';
 const lines=[];let blocked=false;
 function log(event,data){lines.push(new Date().toISOString()+' '+event+' '+JSON.stringify(data||{}));if(lines.length>300)lines.shift();const el=document.getElementById('audio-debug');if(el){el.textContent=lines.join('\n');el.scrollTop=el.scrollHeight;}}
 const micActive=()=>window.INPUT?.mode==='mic'||Object.values(window.mic||{}).some(p=>p.on);
 const status=()=>{const el=document.getElementById('audio-test-status');if(el)el.textContent=(current?'Playing':hold?'Playback held':'Listening')+' · '+queue.length+' queued'+(lastError?' · '+lastError:'');};
 function clear(){log('TTS cancelled',{queued:queue.length});epoch++;queue=[];current=null;hold=false;cancelNative();status();}
 // All existing lifecycle cancellation paths also clear pending playback.
 synth.cancel=clear;
 function tick(){
  if(mode==='guarded'&&micActive()){if(!blocked){log('TTS held: microphone active',{queued:queue.length});blocked=true;}return;}blocked=false;
  if(current||hold||!queue.length||document.hidden)return;
  if(mode==='gaps'&&Date.now()-lastVoice<900)return;
  const item=queue.shift(),token=epoch,u=new SpeechSynthesisUtterance(item.text);
  log('TTS start',{lang:item.lang,text:item.text});current=u;u.lang=gL(item.lang).tts;
  const done=()=>{if(token!==epoch||current!==u)return;current=null;lastVoice=Date.now();log('TTS end');status();};
  u.onend=done;u.onerror=()=>{log('TTS error');lastError='Playback failed; use message replay';done();};
  try{synth.speak(u);}catch(e){u.onerror();}status();
 }
 window.audioOverlap={
  log,
  cancelFor(reason){log('Audio teardown',{reason});if(reason==='self-toggle-off'||reason==='audio-test-play'){const pending=queue.slice();clear();queue=pending;lastVoice=Date.now();status();}else clear();},
  enqueue(text,lang){text=norm(text);if(!text)return;if(queue.length>=20){lastError='Queue full; use message replay';status();return;}queue.push({text,lang});log('TTS queued',{lang,text,queued:queue.length});status();tick();},
  observe(samples){let sum=0;for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];if(samples.length&&Math.sqrt(sum/samples.length)>.025)lastVoice=Date.now();},
  setMode(value){mode=['continuous','gaps','guarded'].includes(value)?value:'guarded';log('Mode changed',{mode});if(mode==='guarded'&&micActive()&&current){epoch++;current=null;cancelNative();log('TTS interrupted: microphone active');}status();},
  toggleHold(){hold=!hold;if(hold&&current){epoch++;current=null;cancelNative();lastError='Interrupted audio remains available on its message';}status();},
  clear,tick,state:()=>({mode,queued:queue.length,playing:!!current,hold})
 };
 setInterval(tick,100);
 document.addEventListener('DOMContentLoaded',()=>{
  const bar=document.createElement('div');bar.id='audio-test-controls';
  bar.style.cssText='position:fixed;bottom:3px;left:64px;right:4px;z-index:1000;font:11px system-ui;background:#fff;color:#123;border-radius:8px;padding:3px;max-height:35vh;overflow:auto';
  bar.innerHTML='<label>Audio test <select aria-label="Audio test mode"><option value="guarded">Hold while mic on</option><option value="gaps">Queue until gap</option><option value="continuous">Continuous + AEC</option></select></label><button type="button">Hold / resume</button><span id="audio-test-status" role="status"></span><button id="audio-play" type="button">Finish speaking / play queue</button><details><summary>Audio debug log</summary><button id="audio-copy" type="button">Copy log</button><pre id="audio-debug" style="max-height:120px;overflow:auto;white-space:pre-wrap"></pre></details>';
  bar.querySelector('select').onchange=e=>audioOverlap.setMode(e.target.value);
  bar.querySelector('button').onclick=()=>audioOverlap.toggleHold();document.body.appendChild(bar);bar.querySelector('#audio-play').onclick=()=>{window.teardown('audio-test-play');tick();};bar.querySelector('#audio-copy').onclick=()=>navigator.clipboard.writeText(lines.join('\n')).catch(()=>log('Copy failed'));log('Audio test ready',{mode,build:'r2'});status();
 });
})();
