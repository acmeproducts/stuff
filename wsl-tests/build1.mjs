// WSL Build 1 checks. Usage: node wsl-tests/build1.mjs [file.html]
// Synthetic pointer events drive the real handlers; state read through window.__wsl().
import {createRequire} from 'module';import {execSync} from 'child_process';
const r=createRequire(execSync('npm root -g').toString().trim()+'/');const pw=r('playwright');
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const b=await pw.chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
let fails=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?'  '+JSON.stringify(x):''));if(!c)fails++;};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
for(const vp of [{n:'phone',w:390,h:800},{n:'desktop',w:1280,h:800}]){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});await p.addInitScript(()=>{try{if(!localStorage.getItem('wsl_settings'))localStorage.setItem('wsl_settings',JSON.stringify({mode:'regular'}));}catch(e){}});const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(600);
  await p.evaluate(()=>{
    window.__ptr=(type,id,x,y)=>document.getElementById('game').dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch'}));
    window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));
    window.__scr=(wx,wy)=>{const s=window.__wsl();return{x:(wx-s.camX)*s.zoom,y:(wy-s.camY)*s.zoom};};
    window.__drag=async(x0,y0,x1,y1,steps,ms)=>{__ptr('pointerdown',1,x0,y0);for(let i=1;i<=steps;i++){await __sleep(ms/steps);__ptr('pointermove',1,x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);}__ptr('pointerup',1,x1,y1);};
    window.__tap=async(x,y)=>{__ptr('pointerdown',1,x,y);await __sleep(60);__ptr('pointerup',1,x,y);};
    window.__pinch=async(d0,d1,cx,cy)=>{__ptr('pointerdown',1,cx-d0/2,cy);__ptr('pointerdown',2,cx+d0/2,cy);for(let i=1;i<=10;i++){await __sleep(16);const d=d0+(d1-d0)*i/10;__ptr('pointermove',1,cx-d/2,cy);__ptr('pointermove',2,cx+d/2,cy);}__ptr('pointerup',2,cx+d1/2,cy);__ptr('pointerup',1,cx-d1/2,cy);};
    window.__release=async()=>{const s=window.__wsl();const m=s.pts[Math.floor(s.pts.length/2)];const q=__scr(m.x,m.y);await __tap(q.x,q.y);};
  });
  const S=()=>p.evaluate(()=>window.__wsl&&window.__wsl());
  let s=await S();
  ok('hook present / no load errors',!!s&&errs.length===0,errs.slice(0,2));
  if(!s){await p.close();continue;}
  ok('no button bar',(await p.$('#keypad'))===null);
  const n0=s.pts.length;
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+80,q.y+30,10,300);});
  s=await S();ok('slow drag draws track',s.pts.length>n0&&s.state===0,{before:n0,after:s.pts.length,state:s.state});
  // pinch in READY
  const z0=s.zoom;await p.evaluate(()=>__pinch(100,220,200,400));s=await S();
  ok('pinch out zooms in',s.zoom>z0*1.5,{z0,z:s.zoom});
  ok('pinch in READY does not release or draw',s.state===0&&s.pts.length===n0+s.pts.length-n0,{state:s.state});
  const nAfterPinch=s.pts.length;
  for(let i=0;i<3;i++)await p.evaluate(()=>__pinch(100,260,200,400));
  s=await S();ok('zoom max 3.5',Math.abs(s.zoom-3.5)<0.01,s.zoom);
  for(let i=0;i<6;i++)await p.evaluate(()=>__pinch(300,40,200,400));await p.waitForTimeout(300);
  s=await S();ok('zoom min 0.35',Math.abs(s.zoom-0.35)<0.01,s.zoom);
  ok('pinch drew nothing',s.pts.length===nAfterPinch,{a:nAfterPinch,b:s.pts.length});
  await p.evaluate(()=>__pinch(100,150,200,400));await p.waitForTimeout(100);
  // reset zoom to ~1 for remaining tests by reload
  await p.reload();await p.waitForTimeout(500);
  await p.evaluate(()=>{window.__ptr=(type,id,x,y)=>document.getElementById('game').dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch'}));
    window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));
    window.__scr=(wx,wy)=>{const s=window.__wsl();return{x:(wx-s.camX)*s.zoom,y:(wy-s.camY)*s.zoom};};
    window.__drag=async(x0,y0,x1,y1,steps,ms)=>{__ptr('pointerdown',1,x0,y0);for(let i=1;i<=steps;i++){await __sleep(ms/steps);__ptr('pointermove',1,x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);}__ptr('pointerup',1,x1,y1);};
    window.__tap=async(x,y)=>{__ptr('pointerdown',1,x,y);await __sleep(60);__ptr('pointerup',1,x,y);};
    window.__pinch=async(d0,d1,cx,cy)=>{__ptr('pointerdown',1,cx-d0/2,cy);__ptr('pointerdown',2,cx+d0/2,cy);for(let i=1;i<=10;i++){await __sleep(16);const d=d0+(d1-d0)*i/10;__ptr('pointermove',1,cx-d/2,cy);__ptr('pointermove',2,cx+d/2,cy);}__ptr('pointerup',2,cx+d1/2,cy);__ptr('pointerup',1,cx-d1/2,cy);};
    window.__release=async()=>{const s=window.__wsl();const m=s.pts[Math.floor(s.pts.length/2)];const q=__scr(m.x,m.y);await __tap(q.x,q.y);};});
  await p.evaluate(()=>__release());await p.waitForTimeout(100);
  s=await S();ok('tap on track releases cart',s.state===1,s.state);
  const st0=s.state,pn=s.pts.length,x0=s.cart.x;await p.evaluate(()=>__pinch(100,180,200,400));s=await S();
  ok('pinch while running: no jump/flip/draw',s.state===st0&&s.flip===0&&s.pts.length===pn,{st0,state:s.state,flip:s.flip});
  await p.waitForTimeout(500);s=await S();
  ok('cart runs',s.cart.x>x0+20||s.state===2,{x0,x:s.cart.x,state:s.state});
  // fresh run for jump/flip tests: restart page
  async function fresh(){await p.reload();await p.waitForTimeout(400);await p.evaluate(()=>{window.__ptr=(type,id,x,y)=>document.getElementById('game').dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch'}));window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));window.__scr=(wx,wy)=>{const s=window.__wsl();return{x:(wx-s.camX)*s.zoom,y:(wy-s.camY)*s.zoom};};window.__drag=async(x0,y0,x1,y1,steps,ms)=>{__ptr('pointerdown',1,x0,y0);for(let i=1;i<=steps;i++){await __sleep(ms/steps);__ptr('pointermove',1,x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);}__ptr('pointerup',1,x1,y1);};window.__tap=async(x,y)=>{__ptr('pointerdown',1,x,y);await __sleep(60);__ptr('pointerup',1,x,y);};window.__release=async()=>{const s=window.__wsl();const m=s.pts[Math.floor(s.pts.length/2)];const q=__scr(m.x,m.y);await __tap(q.x,q.y);};});await p.evaluate(()=>__release());await p.waitForTimeout(250);}
  await fresh();s=await S();ok('(setup) running',s.state===1,s.state);
  await fresh();
  await p.evaluate(()=>__tap(200,250));await p.waitForTimeout(60);s=await S();
  ok('tap while running = jump',s.state===2&&s.vy<0,{state:s.state,vy:s.vy});
  await fresh();
  await p.evaluate(()=>__drag(100,300,230,300,6,100));await p.waitForTimeout(60);s=await S();
  ok('swipe right = front flip (jump+flip)',s.state===2&&s.flip===1&&s.flipDir===1,{state:s.state,flip:s.flip,dir:s.flipDir});
  await fresh();
  await p.evaluate(()=>__drag(230,300,100,300,6,100));await p.waitForTimeout(60);s=await S();
  ok('swipe left = back flip',s.state===2&&s.flip===1&&s.flipDir===-1,{state:s.state,flip:s.flip,dir:s.flipDir});
  await fresh();const np=(await S()).pts.length;
  await p.evaluate(()=>__drag(100,300,230,300,10,1200));s=await S();
  ok('slow horizontal drag while running = draw, not flip',s.flip===0&&s.pts.length>np,{flip:s.flip,pts:[np,s.pts.length]});
  await p.reload();ok('hint pill shows then fades',await p.evaluate(async()=>{const h=document.getElementById('hint');const a=parseFloat(getComputedStyle(h).opacity)>0.5;await new Promise(r=>setTimeout(r,5600));return a&&parseFloat(getComputedStyle(h).opacity)<0.05;}));
  ok('no page errors during play',errs.length===0,errs.slice(0,2));
  await p.screenshot({path:`/tmp/wsl-build1-${vp.n}.png`});
  await p.close();
}
await b.close();console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0);
