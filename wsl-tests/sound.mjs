// Sound: no clicks at note edges, safe mixing, custom sounds. Usage: node wsl-tests/sound.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const wav=(sec,hz=440,rate=22050)=>{const n=Math.floor(sec*rate),buf=Buffer.alloc(44+n*2);buf.write('RIFF',0);buf.writeUInt32LE(36+n*2,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(1,22);buf.writeUInt32LE(rate,24);buf.writeUInt32LE(rate*2,28);buf.writeUInt16LE(2,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*2,40);
  for(let i=0;i<n;i++)buf.writeInt16LE(Math.round(Math.sin(2*Math.PI*hz*i/rate)*0.5*32767),44+i*2);return buf;};
const c=await b.newContext({viewport:{width:390,height:800}});const p=await c.newPage();seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(url);await p.waitForTimeout(600);await p.evaluate(HELPERS);
// ---- 1. clicks at the start/end of a note: old recipe (reference copy) vs the game's current voice
const edge=a=>{ // biggest sample-to-sample jump in the first and last 2 ms of the sound, relative to its loudest sample
  let peak=0,on=-1,off=-1;for(let i=0;i<a.length;i++){const v=Math.abs(a[i]);peak=Math.max(peak,v);if(v>1e-7){if(on<0)on=i;off=i;}}
  if(on<0||peak<1e-6)return 0;const k=Math.round(44100*0.002);let m=Math.abs(a[on]);   // silence -> first sample
  for(let i=on+1;i<Math.min(a.length,on+k);i++)m=Math.max(m,Math.abs(a[i]-a[i-1]));
  m=Math.max(m,Math.abs(a[off]));                                                         // last sample -> silence
  for(let i=Math.max(on+1,off-k);i<=off;i++)m=Math.max(m,Math.abs(a[i]-a[i-1]));
  return m/peak;};
const oldRender=(th,f,durMs)=>p.evaluate(async([th,f,durMs])=>{const T={calm:{type:'sine',mult:0.8,gain:0.06,dur:1.4},fun:{type:'triangle',mult:1,gain:0.07,dur:1},whimsical:{type:'square',mult:1.5,gain:0.035,dur:0.8},zen:{type:'sine',mult:0.5,gain:0.05,dur:2.4}}[th];
  const d=durMs*T.dur/1000;const ctx=new OfflineAudioContext(1,Math.ceil(44100*(d+0.1)),44100);const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=f*T.mult;o.type=T.type;
  g.gain.setValueAtTime(T.gain,0.01);g.gain.exponentialRampToValueAtTime(0.001,0.01+d);o.connect(g);g.connect(ctx.destination);o.start(0.01);o.stop(0.01+d);
  return Array.from((await ctx.startRendering()).getChannelData(0));},[th,f,durMs]);
const hasHook=await p.evaluate(()=>typeof __wslRenderVoice==='function');
for(const th of ['calm','fun','whimsical','zen']){
  const o=edge(await oldRender(th,520,140));
  let n=null;if(hasHook)n=edge(await p.evaluate(async([th])=>await __wslRenderVoice(th,520,140),[th]));
  console.log('  edge step vs peak',th,': old',o.toFixed(3),' now',n===null?'n/a':n.toFixed(3));
  // Whimsical is a square wave, whose own edges are steep; for it we require a big drop from the old value instead of a tiny absolute step.
  const pass=th==='whimsical'?(n!==null&&n<=0.2&&n<o/5):(n!==null&&n<=0.05);
  ok(`${th}: no click at the start or end of a note`,pass,{old:+o.toFixed(3),now:n===null?null:+n.toFixed(3)});
}
// ---- 2. many overlapping sounds must not clip
if(hasHook){
  const mix=await p.evaluate(async()=>await __wslRenderMix(14,'whimsical'));let peak=0,hard=0;for(const v of mix){peak=Math.max(peak,Math.abs(v));if(Math.abs(v)>=0.99)hard++;}
  console.log('  14 overlapping sounds: peak',peak.toFixed(3));
  ok('14 overlapping sounds stay under the ceiling (peak < 0.95, no hard clipping)',peak<0.95&&hard===0,{peak:+peak.toFixed(3),hard});
}else ok('overlap test needs the new engine',false);
// ---- 3. voice cap
const cap=await p.evaluate(()=>{if(!window.__wslSfx)return null;for(let i=0;i<60;i++)__wslSfx.synth(500+i*5,300);return __wslSfx.active();});
ok('at most 8 sounds play at once (a storm of 60 requests is capped)',cap!==null&&cap<=8,cap);
// ---- 4. custom sounds
await p.click('#btnSettings');await p.waitForTimeout(150);
const slots=await p.$$('[data-sfxfile]');ok('settings list at least 8 sound slots',slots.length>=8,slots.length);
const status=slot=>p.evaluate(s=>{const r=document.querySelector(`[data-sfxrow="${s}"]`);return r?r.innerText.replace(/\s+/g,' '):'';},slot);
await p.setInputFiles('[data-sfxfile="jump"]',{name:'boing.wav',mimeType:'audio/wav',buffer:wav(0.3)});await p.waitForTimeout(600);
ok('a chosen sound shows its file name',/boing\.wav/.test(await status('jump')),await status('jump'));
await p.evaluate(()=>__wslSfx.clear());await p.click('[data-sfxrow="jump"] [data-sfxplay]');await p.waitForTimeout(100);
let log=await p.evaluate(()=>__wslSfx.log());ok('preview plays the custom sound',log.some(e=>e.slot==='jump'&&e.custom===true),log);
await p.click('#closeSettings');await p.waitForTimeout(100);
// in the game: a jump uses it
await p.evaluate(pts=>{__wslLoad(pts);},(()=>{const pts=[];for(let i=0;i<=120;i++)pts.push({x:100+i*30*0.99,y:200+i*30*0.14});return pts;})());await p.waitForTimeout(900);
await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(250);
await p.evaluate(()=>__wslSfx.clear());await p.evaluate(()=>__tap(200,150));await p.waitForTimeout(150);
log=await p.evaluate(()=>__wslSfx.log());ok('the game plays the custom sound when the cart jumps',log.some(e=>e.slot==='jump'&&e.custom===true),log.slice(0,4));
// a different slot with no file still uses the built-in sound
ok('slots without a file keep the built-in sound',log.every(e=>e.slot!=='flip'||e.custom===false));
// persistence
await p.reload();await p.waitForTimeout(900);await p.evaluate(HELPERS);
await p.click('#btnSettings');await p.waitForTimeout(150);
ok('the custom sound is still there after reloading the page',/boing\.wav/.test(await status('jump')),await status('jump'));
// rejections
await p.setInputFiles('[data-sfxfile="flip"]',{name:'notes.txt',mimeType:'text/plain',buffer:Buffer.from('not audio')});await p.waitForTimeout(500);
ok('a non-audio file is refused with a message',!/notes\.txt/.test(await status('flip'))&&/audio|read|support/i.test(await p.evaluate(()=>document.getElementById('sfxMsg').textContent)),await p.evaluate(()=>document.getElementById('sfxMsg').textContent));
await p.setInputFiles('[data-sfxfile="flip"]',{name:'long.wav',mimeType:'audio/wav',buffer:wav(12)});await p.waitForTimeout(700);
ok('a sound longer than 8 seconds is refused',!/long\.wav/.test(await status('flip'))&&/8|long|short/i.test(await p.evaluate(()=>document.getElementById('sfxMsg').textContent)),await p.evaluate(()=>document.getElementById('sfxMsg').textContent));
await p.setInputFiles('[data-sfxfile="flip"]',{name:'huge.wav',mimeType:'audio/wav',buffer:Buffer.alloc(3*1024*1024,1)});await p.waitForTimeout(500);
ok('a file over 2 MB is refused',!/huge\.wav/.test(await status('flip'))&&/MB|large|big|size/i.test(await p.evaluate(()=>document.getElementById('sfxMsg').textContent)),await p.evaluate(()=>document.getElementById('sfxMsg').textContent));
// remove
await p.click('[data-sfxrow="jump"] [data-sfxdel]');await p.waitForTimeout(300);
ok('remove puts the built-in sound back',!/boing\.wav/.test(await status('jump')),await status('jump'));
await p.evaluate(()=>__wslSfx.clear());await p.click('[data-sfxrow="jump"] [data-sfxplay]');await p.waitForTimeout(100);
log=await p.evaluate(()=>__wslSfx.log());ok('and previewing it plays the built-in sound again',log.some(e=>e.slot==='jump'&&e.custom===false),log);
await p.reload();await p.waitForTimeout(800);await p.click('#btnSettings');await p.waitForTimeout(100);
ok('removal also sticks after a reload',!/boing\.wav/.test(await status('jump')),await status('jump'));
// volume
const vol=await p.evaluate(()=>{const e=document.getElementById('volume');if(!e)return null;e.value=20;e.dispatchEvent(new Event('input'));const a=__wslSfx.volume();e.value=90;e.dispatchEvent(new Event('input'));return [a,__wslSfx.volume()];});
ok('there is a master volume control that changes the output level',vol&&vol[0]<vol[1],vol);
ok('no page errors',errs.length===0,errs.slice(0,2));
await b.close();done();
