// Pause: double-tap the score to pause, single top Resume button. Usage: node wsl-tests/pause.mjs [file]
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=140;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  const run=async()=>{await p.evaluate(pts=>{__wslLoad(pts);},slope(10));await p.waitForTimeout(900);await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(300);};
  const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>0;},sel);
  await run();let s=await S();ok('running',s.state===1,s.state);
  ok('no Resume button while playing',!(await vis('#resumeBtn')));
  // single tap on the score: nothing happens (and it does not jump)
  await p.click('#score');await p.waitForTimeout(150);s=await S();
  ok('single tap on the score does not pause or jump',s.userPaused===false&&s.state===1&&s.flip===0,{p:s.userPaused,st:s.state,flip:s.flip});
  await p.waitForTimeout(500);   // let the double-tap window pass
  // two slow taps are not a double tap
  await p.click('#score');await p.waitForTimeout(700);await p.click('#score');await p.waitForTimeout(100);s=await S();
  ok('two slow taps do not pause',s.userPaused===false,s.userPaused);
  await p.waitForTimeout(500);
  // double tap
  await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(150);s=await S();
  ok('double-tapping the score pauses',s.userPaused===true&&s.paused===true,{p:s.userPaused});
  ok('a single Resume button appears at the top',(await vis('#resumeBtn'))&&await p.evaluate(()=>document.getElementById('resumeBtn').getBoundingClientRect().top<90)&&(await p.$$('#resumeBtn')).length===1);
  const a=await S();await p.waitForTimeout(700);const c=await S();
  ok('the game is frozen (cart, timer, distance)',a.cart.x===c.cart.x&&a.timer===c.timer&&a.dist===c.dist,{ax:a.cart.x,cx:c.cart.x});
  const n0=c.npts;await p.evaluate(()=>__drag(100,400,220,430,6,200));await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(150);const d=await S();
  ok('taps and drawing on the canvas are ignored while paused',d.npts===n0&&d.state===c.state&&d.flip===0,{n0,n:d.npts});
  // settings can still be opened and closed without resuming
  await p.click('#btnSettings');await p.waitForTimeout(100);await p.click('#closeSettings');await p.waitForTimeout(100);s=await S();
  ok('closing settings keeps it paused',s.userPaused===true&&s.paused===true,s.paused);
  await p.click('#resumeBtn');await p.waitForTimeout(200);s=await S();
  ok('Resume continues the game and hides the button',s.userPaused===false&&s.paused===false&&!(await vis('#resumeBtn')),{p:s.userPaused});
  const e1=await S();await p.waitForTimeout(600);const e2=await S();
  ok('the cart moves again after resuming',e2.cart.x>e1.cart.x||e2.state!==1,{a:e1.cart.x,b:e2.cart.x});
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
// Zen hides the score, so the Flow label works too
{
  const p=await b.newPage({viewport:{width:390,height:800}});seeded(p,{mode:'zen'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>__release());await p.waitForTimeout(500);
  await p.click('#flowtxt');await p.waitForTimeout(80);await p.click('#flowtxt');await p.waitForTimeout(150);
  let s=await p.evaluate(()=>__wsl());ok('Zen: double-tap the Flow label pauses',s.userPaused===true,s.userPaused);
  await p.click('#resumeBtn');await p.waitForTimeout(150);s=await p.evaluate(()=>__wsl());ok('Zen: resume works',s.userPaused===false,s.userPaused);
  ok('no page errors (zen)',errs.length===0,errs.slice(0,2));await p.close();
}
await b.close();done();
