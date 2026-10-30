// Replay: pinch zoom, sharing as a link and as a video. Usage: node wsl-tests/share.mjs [file]
import {launch,HELPERS,reporter,seeded,endRun} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const shareMock=()=>{window.__shared=null;navigator.canShare=()=>true;navigator.share=async d=>{window.__shared=d;};};
const until=async(p,fn,ms=20000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(100);}return false;};
async function shortRun(p){ // a short real run that ends the game, so there is a journey to replay
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight*0.7,10,300);});
  await endRun(p);
}
const c=await b.newContext({viewport:{width:390,height:800},isMobile:true,hasTouch:true,acceptDownloads:true});const p=await c.newPage();seeded(p,{mode:'regular'});
await p.addInitScript(shareMock);const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(url);await p.waitForTimeout(600);await p.evaluate(HELPERS);
const S=()=>p.evaluate(()=>__wsl());
await shortRun(p);let s=await S();const finalPts=s.npts;const dur=s.rec.duration;
ok('a run to replay exists',s.state===4&&s.rec.n>20,{n:s.rec&&s.rec.n,dur:+dur.toFixed(1)});
await p.click('#btnReplay');await p.waitForTimeout(300);
// ---- pinch zoom during replay
s=await S();const z0=s.zoom;
await p.evaluate(()=>__pinch(100,220,200,400));await p.waitForTimeout(150);s=await S();
ok('overview: pinch out zooms in',s.replay.active&&s.zoom>z0*1.6,{z0:+z0.toFixed(2),z:+s.zoom.toFixed(2)});
const z1=s.zoom;await p.evaluate(()=>__pinch(220,80,200,400));await p.waitForTimeout(150);s=await S();
ok('overview: pinch in zooms back out',s.zoom<z1*0.6,{z1:+z1.toFixed(2),z:+s.zoom.toFixed(2)});
ok('pinching does not end or restart the replay',s.replay.active&&s.replay.phase==='overview',s.replay.phase);
await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(100);ok('taps are still ignored during replay',(await S()).replay.active);
ok('play phase reached',await until(p,()=>__wsl().replay.phase==='play',12000));
await p.waitForTimeout(300);s=await S();const zp=s.zoom;
await p.evaluate(()=>__pinch(100,220,200,400));await p.waitForTimeout(250);s=await S();
ok('play: pinch out zooms in on the action',s.replay.phase==='play'&&s.zoom>zp*1.6,{zp:+zp.toFixed(2),z:+s.zoom.toFixed(2)});
for(let i=0;i<4;i++)await p.evaluate(()=>__pinch(80,300,200,400));await p.waitForTimeout(200);s=await S();
ok('zoom is limited (not unbounded)',s.zoom<=7,s.zoom);
// ---- share as a link
await p.click('#repShare');await p.waitForTimeout(150);
ok('Share offers link and video',await p.evaluate(()=>!!document.getElementById('shareLink')&&!!document.getElementById('shareVideo')&&getComputedStyle(document.getElementById('shareMenu')).display!=='none'));
await p.click('#shareLink');await until(p,()=>!!window.__shared,8000);
const sh=await p.evaluate(()=>window.__shared);
ok('Share link hands a link to the share sheet',!!sh&&/#r=/.test(sh.url||''),sh&&Object.keys(sh));
console.log('  link length:',sh&&sh.url.length,'characters for a',dur.toFixed(1),'s run');
ok('the link is a sensible size (under 16,000 characters)',sh&&sh.url.length<16000,sh&&sh.url.length);
// ---- open the link as a different person
const url2=sh.url.replace(/^.*?#/,url+'#');
const c2=await b.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});const p2=await c2.newPage();const errs2=[];p2.on('pageerror',e=>errs2.push(e.message));
await p2.goto(url2);await p2.waitForTimeout(1200);
let t=await p2.evaluate(()=>__wsl());
ok('opening the link starts the replay at once (even for a first-time visitor)',t.replay.active&&t.replay.phase==='overview'&&t.mode!==null,{act:t.replay.active,ph:t.replay.phase});
ok('the shared journey matches (same track points, same length of run)',Math.abs(t.replay.tracksPts-finalPts)<=Math.max(5,finalPts*0.02)&&Math.abs(t.rec.duration-dur)<0.5,{pts:t.replay.tracksPts,want:finalPts,dur:t.rec.duration});
ok('the replay plays through on the other screen',await p2.evaluate(()=>0)===0&&await until(p2,()=>__wsl().replay.phase==='play',12000));
await p2.click('#repClose');await p2.waitForTimeout(300);t=await p2.evaluate(()=>__wsl());
ok('closing a shared replay starts a fresh game, and the link is cleared',!t.replay.active&&t.state===0&&!/#r=/.test(await p2.evaluate(()=>location.hash)),{st:t.state});
// bad links do no harm
const p3=await c2.newPage();const errs3=[];p3.on('pageerror',e=>errs3.push(e.message));await p3.goto(url+'#r=garbage-not-a-replay');await p3.waitForTimeout(800);
const u=await p3.evaluate(()=>typeof __wsl==='function'?__wsl():null);
ok('a broken link is ignored and the game starts normally',errs3.length===0&&u&&!u.replay.active,errs3.slice(0,2));
ok('no page errors (viewer)',errs2.length===0,errs2.slice(0,2));
await c2.close();
// ---- share as a video
await p.evaluate(()=>{window.__shared=null;});
await p.click('#repShare');await p.waitForTimeout(100);
const hasRec=await p.evaluate(()=>!!window.MediaRecorder&&!!HTMLCanvasElement.prototype.captureStream);
if(!hasRec){ok('video recording is available here',false);}
else{
  await p.click('#shareVideo');await p.waitForTimeout(600);
  const msg=await p.evaluate(()=>document.getElementById('repMsg').textContent);
  ok('video: shows that it is recording',/record/i.test(msg),msg);
  const got=await until(p,()=>!!window.__shared,Math.max(40000,(dur+8)*1000+20000));
  const f=await p.evaluate(()=>{const d=window.__shared;const f=d&&d.files&&d.files[0];return f?{name:f.name,type:f.type,size:f.size}:null;});
  console.log('  video:',JSON.stringify(f));
  ok('video: a video file is handed to the share sheet',got&&!!f&&/^video\//.test(f.type)&&/\.(webm|mp4)$/.test(f.name),f);
  ok('video: the file is not empty (> 5 KB)',!!f&&f.size>5000,f&&f.size);
  s=await S();ok('video: the replay is back to normal controls afterwards',s.replay.active&&!s.replay.recording,{rec:s.replay.recording});
}
await p.click('#repClose');await p.waitForTimeout(200);
ok('no page errors',errs.length===0,errs.slice(0,2));
await b.close();done();
