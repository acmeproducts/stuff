// Session replay: zoom out to the whole journey, zoom in to the start, play it back. Usage: node wsl-tests/replay.mjs [file]
import {launch,VIEWPORTS,HELPERS,fresh,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const until=async(p,fn,ms=15000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(80);}return false;};
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  // a short run that ends in game over
  await fresh(p,false);
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});
  await p.evaluate(()=>__release());
  await until(p,()=>__wsl().state===4,40000);
  let s=await S();const finalPts=s.npts,finalScore=s.last&&s.last.final;
  ok('run ended and was recorded',s.state===4&&s.rec&&s.rec.n>20,s.rec);
  ok('Replay button on the game-over screen',await p.evaluate(()=>{const e=document.getElementById('btnReplay');return !!e&&getComputedStyle(e).display!=='none';}));
  await p.click('#btnReplay');await p.waitForTimeout(150);s=await S();
  ok('replay starts zoomed out showing the whole journey',s.replay.active&&s.replay.phase==='overview'&&s.zoom<0.9&&s.replay.fit===true,{ph:s.replay.phase,z:s.zoom,fit:s.replay.fit});
  ok('overview shows the finished track',s.replay.tracksPts===finalPts,{shown:s.replay.tracksPts,final:finalPts});
  ok('game-over screen hidden during replay',await p.evaluate(()=>getComputedStyle(document.getElementById('overlay')).display==='none'));
  await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(100);s=await S();
  ok('taps are ignored during replay',s.replay.active);
  const zOver=s.zoom;
  ok('then zooms in to the start',await until(p,()=>__wsl().replay.phase==='zoom',8000));
  await p.waitForTimeout(600);const zMid=(await S()).zoom;ok('zoom is increasing while zooming in',zMid>zOver,{zOver,zMid});
  ok('then plays from the start',await until(p,()=>__wsl().replay.phase==='play',8000));
  s=await S();ok('play starts at normal zoom with the track empty-ish',Math.abs(s.zoom-1)<0.1&&s.replay.tracksPts<finalPts,{z:s.zoom,pts:s.replay.tracksPts,final:finalPts});
  await p.waitForTimeout(700);const s2=await S();
  ok('the cart moves and the track grows during replay',Math.hypot(s2.cart.x-s.cart.x,s2.cart.y-s.cart.y)>1||s2.replay.tracksPts>s.replay.tracksPts,{a:s.cart,b:s2.cart});
  for(let i=0;i<3;i++){const sp=await p.evaluate(()=>__wsl().replay.speed);if(sp>=4)break;await p.click('#repSpeed');}
  ok('speed control reaches 4x',(await S()).replay.speed===4,(await S()).replay.speed);
  ok('replay finishes',await until(p,()=>__wsl().replay.phase==='done',30000));
  s=await S();ok('finished replay shows the whole track again',s.replay.tracksPts===finalPts,{shown:s.replay.tracksPts,final:finalPts});
  await p.click('#repClose');await p.waitForTimeout(200);s=await S();
  ok('Close restores the finished game exactly',!s.replay.active&&s.state===4&&s.last.final===finalScore&&s.npts===finalPts,{st:s.state,final:s.last&&s.last.final,pts:s.npts});
  ok('game-over screen is back',await p.evaluate(()=>getComputedStyle(document.getElementById('overlay')).display!=='none'));
  // skip control
  await p.click('#btnReplay');await p.waitForTimeout(100);await p.click('#repSkip');await p.waitForTimeout(50);await p.click('#repSkip');await p.waitForTimeout(150);
  s=await S();ok('Skip jumps ahead through the phases',s.replay.phase==='play',s.replay.phase);
  await p.click('#repClose');await p.waitForTimeout(150);
  // tap after closing restarts the game normally
  await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(150);s=await S();
  ok('game restarts normally after the replay',s.state===0,s.state);
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
// Zen: replay from settings, game continues afterwards
{
  const p=await b.newPage({viewport:{width:390,height:800}});seeded(p,{mode:'zen'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>__release());await p.waitForTimeout(2500);
  await p.click('#btnSettings');await p.waitForTimeout(100);
  ok('Replay button in settings',await p.evaluate(()=>!!document.getElementById('btnReplaySession')));
  await p.click('#btnReplaySession');await p.waitForTimeout(200);let s=await p.evaluate(()=>__wsl());
  ok('Zen replay starts',s.replay.active&&!await p.evaluate(()=>getComputedStyle(document.getElementById('settingsPanel')).display!=='none'),s.replay);
  await p.click('#repClose');await p.waitForTimeout(300);s=await p.evaluate(()=>__wsl());
  ok('Zen game continues after the replay',!s.replay.active&&!s.paused&&(s.state===1||s.state===2),{st:s.state,paused:s.paused});
  ok('no page errors (zen)',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
