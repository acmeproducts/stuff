// Pause: double-tap the score; centred Continue with a running counter; -25% of the score per full minute paused.
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=200;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>0;},sel);
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(300);
  await p.evaluate(()=>__wslSetScore(400));
  let s=await S();ok('running with a score',s.state===1&&s.score===400,{st:s.state,score:s.score});
  await p.click('#score');await p.waitForTimeout(500);s=await S();
  ok('single tap on the score does not pause',s.userPaused===false&&!(await vis(p,'#pauseDlg')),s.userPaused);
  await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(200);s=await S();
  ok('double-tapping the score pauses',s.userPaused===true&&s.paused===true&&await vis(p,'#pauseDlg'),s.userPaused);
  const box=await p.evaluate(()=>{const r=document.getElementById('pauseGo').getBoundingClientRect();return {cx:(r.left+r.width/2)/innerWidth,cy:(r.top+r.height/2)/innerHeight};});
  ok('the Continue button is in the centre of the screen',Math.abs(box.cx-0.5)<0.12&&Math.abs(box.cy-0.5)<0.18,box);
  const t0=await p.evaluate(()=>document.getElementById('pauseClock').textContent);
  await p.waitForTimeout(2300);const t1=await p.evaluate(()=>document.getElementById('pauseClock').textContent);
  ok('a counter shows how long you have been paused',/^0:0\d$/.test(t0)&&t1!==t0&&/^0:0[2-9]$/.test(t1),{t0,t1});
  ok('the pause screen states the penalty (25% of score per minute)',/25%/.test(await p.evaluate(()=>document.getElementById('pauseDlg').innerText)));
  const a=await S();await p.waitForTimeout(500);const c=await S();
  ok('the game is frozen while paused',a.cart.x===c.cart.x&&a.timer===c.timer,{ax:a.cart.x,cx:c.cart.x});
  const n0=c.npts;await p.evaluate(()=>__drag(100,400,220,430,6,200));await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(100);
  ok('taps and drawing are ignored while paused',(await S()).npts===n0&&(await S()).userPaused===true);
  await p.click('#pauseGo');await p.waitForTimeout(250);s=await S();
  ok('Continue resumes, and a short pause costs nothing',s.userPaused===false&&!(await vis(p,'#pauseDlg'))&&s.score>=400,{p:s.userPaused,score:s.score});
  const e1=await S();await p.waitForTimeout(500);ok('the cart moves again',(await S()).cart.x>e1.cart.x||(await S()).state!==1);
  // penalties: simulate time paused
  await p.evaluate(()=>__wslSetScore(400));await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(150);
  await p.evaluate(()=>__wslAddPause(65));await p.waitForTimeout(200);
  const clk=await p.evaluate(()=>document.getElementById('pauseClock').textContent);ok('counter shows 1:05 after a simulated minute',/^1:0[5-9]$/.test(clk),clk);
  ok('screen shows the penalty so far (-25%)',/25%/.test(await p.evaluate(()=>document.getElementById('pausePenalty').textContent)),await p.evaluate(()=>document.getElementById('pausePenalty').textContent));
  await p.click('#pauseGo');await p.waitForTimeout(200);s=await S();
  ok('one full minute paused cost 25% of the score (400 -> about 300)',s.score>=300&&s.score<=330,s.score);
  await p.evaluate(()=>__wslSetScore(400));await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(150);
  await p.evaluate(()=>__wslAddPause(125));await p.waitForTimeout(150);await p.click('#pauseGo');await p.waitForTimeout(200);s=await S();
  ok('two minutes cost 50% (400 -> about 200)',s.score>=200&&s.score<=230,s.score);
  await p.evaluate(()=>__wslSetScore(400));await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(150);
  await p.evaluate(()=>__wslAddPause(400));await p.waitForTimeout(150);await p.click('#pauseGo');await p.waitForTimeout(200);s=await S();
  ok('the penalty stops at the whole score (never negative)',s.score>=0&&s.score<=30,s.score);
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
{ // Zen: pausing works (via the Flow label) and costs nothing
  const p=await b.newPage({viewport:{width:390,height:800}});seeded(p,{mode:'zen'});await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>__release());await p.waitForTimeout(400);
  await p.click('#flowtxt');await p.waitForTimeout(80);await p.click('#flowtxt');await p.waitForTimeout(150);
  let s=await p.evaluate(()=>__wsl());ok('Zen: double-tap the Flow label pauses',s.userPaused===true&&await vis(p,'#pauseDlg'),s.userPaused);
  ok('Zen: no penalty mentioned',!/25%/.test(await p.evaluate(()=>document.getElementById('pauseDlg').innerText)));
  await p.click('#pauseGo');await p.waitForTimeout(150);s=await p.evaluate(()=>__wsl());ok('Zen: continue works',s.userPaused===false,s.userPaused);
  await p.close();
}
await b.close();done();
