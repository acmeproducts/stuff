/* Playback scheduling experiment: audio energy is NOT speaker identification. */
(function(){
 const synth=window.speechSynthesis, cancelNative=synth.cancel.bind(synth);
 let queue=[],current=null,lastVoice=0,mode='gaps',epoch=0,hold=false,lastError='';
 const status=()=>{const el=document.getElementById('audio-test-status');if(el)el.textContent=(current?'Playing':hold?'Playback held':'Listening')+' · '+queue.length+' queued'+(lastError?' · '+lastError:'');};
 function clear(){epoch++;queue=[];current=null;hold=false;cancelNative();status();}
 // All existing lifecycle cancellation paths also clear pending playback.
 synth.cancel=clear;
 function tick(){
  if(current||hold||!queue.length||document.hidden)return;
  if(mode==='gaps'&&Date.now()-lastVoice<900)return;
  const item=queue.shift(),token=epoch,u=new SpeechSynthesisUtterance(item.text);
  current=u;u.lang=gL(item.lang).tts;
  const done=()=>{if(token!==epoch||current!==u)return;current=null;lastVoice=Date.now();status();};
  u.onend=done;u.onerror=()=>{lastError='Playback failed; use message replay';done();};
  try{synth.speak(u);}catch(e){u.onerror();}status();
 }
 window.audioOverlap={
  enqueue(text,lang){text=norm(text);if(!text)return;if(queue.length>=20){lastError='Queue full; use message replay';status();return;}queue.push({text,lang});status();tick();},
  observe(samples){let sum=0;for(let i=0;i<samples.length;i++)sum+=samples[i]*samples[i];if(samples.length&&Math.sqrt(sum/samples.length)>.025)lastVoice=Date.now();},
  setMode(value){mode=value==='continuous'?'continuous':'gaps';status();},
  toggleHold(){hold=!hold;if(hold&&current){epoch++;current=null;cancelNative();lastError='Interrupted audio remains available on its message';}status();},
  clear,tick,state:()=>({mode,queued:queue.length,playing:!!current,hold})
 };
 setInterval(tick,100);
 document.addEventListener('DOMContentLoaded',()=>{
  const bar=document.createElement('div');bar.id='audio-test-controls';
  bar.style.cssText='position:fixed;bottom:3px;left:64px;right:4px;z-index:1000;font:11px system-ui;background:#fff;color:#123;border-radius:8px;padding:3px;display:flex;gap:4px;align-items:center';
  bar.innerHTML='<label>Audio test <select aria-label="Audio test mode"><option value="gaps">Queue until gap</option><option value="continuous">Continuous + AEC</option></select></label><button type="button">Hold / resume</button><span id="audio-test-status" role="status"></span>';
  bar.querySelector('select').onchange=e=>audioOverlap.setMode(e.target.value);
  bar.querySelector('button').onclick=()=>audioOverlap.toggleHold();document.body.appendChild(bar);status();
 });
})();
