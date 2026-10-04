// WSL Build 3 checks: mode choice, Zen, settings, audio vibes, two-finger rescue, rotation.
import {launch,VIEWPORTS,HELPERS,fresh,reporter} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const seed=(p,obj)=>p.addInitScript(o=>{try{if(!sessionStorage.getItem('__seeded')){localStorage.setItem('wsl_settings',JSON.stringify(o));sessionStorage.setItem('__seeded','1');}}catch(e){}},obj);
const steep=p=>p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  // ---- first run: mode choice
  let p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>window.__wsl&&window.__wsl());
  const vis=sel=>p.evaluate(s=>{const e=document.querySelector(s);return !!e&&getComputedStyle(e).display!=='none';},sel);
  ok('start screen asks Regular or Zen',await vis('#modeSel')&&!!(await p.$('#modeRegular'))&&!!(await p.$('#modeZen')));
  await p.evaluate(()=>__release());await p.waitForTimeout(100);let s=await S();
  ok('game input blocked until a mode is chosen',s&&s.state===0,s&&s.state);
  await p.click('#modeZen');await p.waitForTimeout(150);s=await S();
  ok('Zen chosen: screen closes, mode=zen',!(await vis('#modeSel'))&&s.mode==='zen',s.mode);
  await p.reload();await p.waitForTimeout(400);
  ok('mode remembered after reload',!(await vis('#modeSel'))&&(await S()).mode==='zen');
  await p.close();
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});await p.goto(url);await p.waitForTimeout(400);
  await p.click('#modeRegular');await p.waitForTimeout(100);
  ok('Regular chosen',(await p.evaluate(()=>__wsl().mode))==='regular');
  await p.close();
  // ---- settings (regular)
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});p.on('pageerror',e=>errs.push(e.message));await seed(p,{mode:'regular'});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.click('#btnSettings');await p.waitForTimeout(100);
  ok('gear opens settings',await vis('#settingsPanel'));
  await p.click('[data-preset="low"]');s=await S();
  ok('Low preset sets jump/flip',s.jump===500&&s.flipF===450,{j:s.jump,f:s.flipF});
  await p.evaluate(()=>{const e=document.getElementById('jumpForce');e.value=1500;e.dispatchEvent(new Event('input'));});s=await S();
  ok('moving a slider switches preset to custom',s.preset==='custom'&&s.jump===1500,{p:s.preset,j:s.jump});
  await p.click('#closeSettings');await p.reload();await p.waitForTimeout(400);s=await S();
  ok('settings persist',s.jump===1500&&s.preset==='custom',{j:s.jump});
  await p.close();
  // jump force changes jump height
  async function apexWith(preset){const q=await b.newPage({viewport:{width:vp.w,height:vp.h}});await seed(q,{mode:'regular',preset});await q.goto(url);await q.waitForTimeout(400);await q.evaluate(HELPERS);await q.evaluate(()=>__release());await q.waitForTimeout(100);
    const h=await q.evaluate(async()=>{const y0=__wsl().cart.y;let mn=y0;const pr=(async()=>{for(let i=0;i<100;i++){await __sleep(10);mn=Math.min(mn,__wsl().cart.y);}})();await __tap(200,250);await pr;return y0-mn;});await q.close();return h;}
  const hl=await apexWith('low'),hh=await apexWith('high');
  ok('High jump goes higher than Low',hh>hl*1.5,{low:Math.round(hl),high:Math.round(hh)});
  // ---- audio vibes
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});p.on('pageerror',e=>errs.push(e.message));await seed(p,{mode:'regular',audio:'calm'});
  await p.addInitScript(()=>{window.__osc=[];const C=window.AudioContext||window.webkitAudioContext;if(C){const o=C.prototype.createOscillator;C.prototype.createOscillator=function(){const x=o.call(this);window.__osc.push(x);return x;};}});
  await p.goto(url);await p.waitForTimeout(400);await p.evaluate(HELPERS);
  ok('four audio vibes offered',(await p.$$('[data-audio]')).length===4);
  const want={calm:'sine',fun:'triangle',whimsical:'square',zen:'sine'};
  for(const v of ['calm','fun','whimsical','zen']){
    await p.click('#btnSettings');await p.evaluate(()=>{__osc.length=0;});await p.click(`[data-audio="${v}"]`);await p.waitForTimeout(60);
    const t=(await S()).theme;const type=await p.evaluate(()=>__osc.length?__osc[__osc.length-1].type:'none');await p.click('#closeSettings');
    ok(`vibe ${v} sounds ${want[v]}`,t===v&&type===want[v],{theme:t,osc:type});
  }
  await p.close();
  // ---- Zen
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});p.on('pageerror',e=>errs.push(e.message));await seed(p,{mode:'zen',audio:'whimsical'});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  s=await S();ok('Zen forces Zen audio',s.theme==='zen',s.theme);
  ok('Zen hides score, best, timer, distance',await p.evaluate(()=>['score','best','timer','dist'].every(i=>getComputedStyle(document.getElementById(i)).display==='none'||getComputedStyle(document.getElementById(i).parentElement).display==='none')));
  await steep(p);await p.evaluate(()=>__release());
  let over=false,maxSuck=false;for(let i=0;i<24;i++){await p.waitForTimeout(500);const q=await S();if(q.state===4)over=true;if(q.state===3)maxSuck=true;}
  s=await S();ok('Zen: no hole death or game over, cart comes back',!over&&!maxSuck&&(s.state===1||s.state===2),{state:s.state});
  for(let i=0;i<5;i++){const h=await p.evaluate(()=>{const s=__wsl();return __scr(s.cart.x+90,s.cart.y+60);});await p.evaluate(({x,y})=>__hold(x,y,900),h);await p.waitForTimeout(60);}
  s=await S();ok('Zen: rescue is unlimited',s.charges===3&&s.ntracks>=6,{ch:s.charges,nt:s.ntracks});
  await p.close();
  // ---- two-finger tap rescue
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});p.on('pageerror',e=>errs.push(e.message));await seed(p,{mode:'regular'});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>__release());await p.waitForTimeout(150);
  await p.evaluate(async()=>{const s=__wsl();const q=__scr(s.cart.x+80,s.cart.y+60);__ptr('pointerdown',1,q.x-20,q.y);__ptr('pointerdown',2,q.x+20,q.y);await __sleep(80);__ptr('pointerup',2,q.x+20,q.y);__ptr('pointerup',1,q.x-20,q.y);});
  await p.waitForTimeout(100);s=await S();
  ok('two-finger tap = rescue',s.charges===2&&s.ntracks===2&&s.state===1&&s.cartTrack===1,{ch:s.charges,nt:s.ntracks,st:s.state,tr:s.cartTrack});
  const z=s.zoom;ok('two-finger tap did not zoom',Math.abs(z-1)<0.01,z);
  await p.close();
  // ---- rotation
  p=await b.newPage({viewport:{width:vp.w,height:vp.h}});p.on('pageerror',e=>errs.push(e.message));await seed(p,{mode:'regular'});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.setViewportSize({width:vp.h,height:vp.w});await p.waitForTimeout(500);
  const cw=await p.evaluate(()=>[document.getElementById('game').width/(Math.min(devicePixelRatio,2)),innerWidth]);
  ok('canvas follows rotation',Math.abs(cw[0]-cw[1])<2,cw);
  await p.evaluate(()=>__release());await p.waitForTimeout(150);s=await S();
  ok('game still plays after rotation',s.state===1||s.state===2,s.state);
  await p.close();
  ok('no page errors',errs.length===0,errs.slice(0,2));
}
await b.close();done();
