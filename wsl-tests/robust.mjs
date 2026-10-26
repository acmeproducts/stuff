// Robustness: broken storage, extreme screens, stale touches, settings can't be used as a free pause. Usage: node wsl-tests/robust.mjs
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=200;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
async function mk(vp,init,mobile=true){const c=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));if(init)await p.addInitScript(init);return {c,p,errs};}
// 1. storage that throws
{const {c,p,errs}=await mk({width:390,height:800},()=>{const t=()=>{throw new Error('blocked');};Object.defineProperty(window,'localStorage',{get:t});});
 await p.goto(url);await p.waitForTimeout(600);
 const ok0=await p.evaluate(()=>typeof __wsl==='function');
 ok('storage blocked: game still loads',ok0&&errs.length===0,errs.slice(0,2));
 if(ok0){await p.evaluate(HELPERS);await p.click('#modeRegular').catch(()=>{});await p.waitForTimeout(200);const s=await p.evaluate(()=>__wsl());ok('storage blocked: the start screen works and a mode can be chosen',s.mode==='regular',s.mode);}
 await c.close();}
// 2. corrupted saved settings
{const c=await b.newContext({viewport:{width:390,height:800}});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('wsl_settings','{not json');localStorage.setItem('scl_best','banana');}catch(e){}});
 await p.goto(url);await p.waitForTimeout(600);
 ok('corrupted saved settings: loads and asks for a mode',errs.length===0&&await p.evaluate(()=>typeof __wsl==='function'),errs.slice(0,2));await c.close();}
// 3. extreme screens
for(const vp of [{width:320,height:480},{width:2560,height:1440},{width:1024,height:600}]){
  const {c,p,errs}=await mk(vp,null,vp.width<1000);seeded(p,{mode:'regular'});await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>__release());await p.waitForTimeout(1200);const s=await p.evaluate(()=>__wsl());
  ok(`${vp.width}x${vp.height}: plays, cart ${s.cartPx}px, no errors`,errs.length===0&&(s.state===1||s.state===2)&&s.cartPx>=24&&s.cartPx<=60,{st:s.state,cartPx:s.cartPx,err:errs[0]});
  await c.close();}
// 4. a touch whose "up" never arrives must not break the next touch
{const {c,p,errs}=await mk({width:390,height:800});seeded(p,{mode:'regular'});await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
 await p.evaluate(()=>{__ptr('pointerdown',7,150,300);});          // finger 7 goes down and its up is lost
 await p.evaluate(()=>{__ptr('pointerdown',8,100,300);__ptr('pointerup',8,100,300);});
 await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
 await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(250);
 let s=await p.evaluate(()=>__wsl());
 ok('a lost touch-up does not break later taps (the ride started)',s.state===1||s.state===2,{st:s.state,ph:s.gphase});
 await p.evaluate(()=>__tap(200,150));await p.waitForTimeout(120);s=await p.evaluate(()=>__wsl());ok('and a tap still jumps',s.state===2,s.state);
 await c.close();}
// 5. settings must not be a free pause
{const {c,p}=await mk({width:390,height:800});seeded(p,{mode:'regular'});await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
 await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
 await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(250);
 await p.evaluate(()=>__wslSetScore(400));
 await p.click('#btnSettings');await p.waitForTimeout(150);
 let s=await p.evaluate(()=>__wsl());ok('opening settings pauses the game',s.paused===true,s.paused);
 ok('...without the Continue card',!(await p.evaluate(()=>{const e=document.getElementById('pauseDlg');return getComputedStyle(e).display!=='none';})));
 await p.evaluate(()=>__wslAddPause(65));await p.click('#closeSettings');await p.waitForTimeout(200);s=await p.evaluate(()=>__wsl());
 ok('a minute spent in settings costs 25% like any pause (400 -> about 300)',s.score>=300&&s.score<=330&&s.paused===false,{score:s.score,paused:s.paused});
 await c.close();}
await b.close();done();
