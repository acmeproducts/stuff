// Gesture arbitration: gestures must never cancel or hijack each other. Usage: node wsl-tests/gestures.mjs [file]
import {launch,VIEWPORTS,HELPERS,fresh,reporter} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('wsl_settings',JSON.stringify({mode:'regular'}));}catch(e){}});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  // 1. drawing is immediate: no delay, no flip, even when fast, while the cart runs
  await fresh(p);let s=await S();const n0=s.pts.length;
  await p.evaluate(()=>{__ptr('pointerdown',1,100,300);__ptr('pointermove',1,125,300);__ptr('pointermove',1,150,302);});
  s=await S();ok('drawing starts at once (no waiting window)',s.pts.length>n0&&s.flip===0,{n0,n:s.pts.length});
  await p.evaluate(()=>__ptr('pointerup',1,150,302));
  // 2. pinch never flips, swipe never zooms
  await fresh(p);await p.evaluate(()=>__pinch(100,200,200,300));s=await S();
  ok('pinch: zooms, no flip',s.zoom>1.4&&s.flip===0&&s.gphase==='idle',{z:s.zoom,flip:s.flip,ph:s.gphase});
  await fresh(p);await p.evaluate(()=>__swipe2(110,150));s=await S();
  ok('two-finger swipe: no flip, no zoom, nothing',s.flip===0&&Math.abs(s.zoom-1)<0.01&&s.gphase==='idle',{z:s.zoom,flip:s.flip});
  // 3. a hold that moves is a drawing, not a rescue; a hold that stays is a rescue
  await fresh(p);await p.evaluate(()=>{__ptr('pointerdown',1,150,500);return __sleep(500).then(()=>__ptr('pointermove',1,200,520));});
  await p.waitForTimeout(500);s=await S();
  ok('moving finger cancels rescue hold',s.charges===3&&s.state!==5,{ch:s.charges,st:s.state});
  await p.evaluate(()=>__ptr('pointerup',1,200,520));
  // 4. after every gesture type the recogniser is idle again
  await fresh(p);
  const seq=[['tap',()=>__tap(200,250)],['drag',()=>__drag(100,400,220,430,6,200)],['pinch',()=>__pinch(100,180,200,300)],['pinch in',()=>__pinch(180,90,200,300)],
    ['swipe2 R',()=>__swipe2(100,150)],['swipe2 L',()=>__swipe2(-100,150)],['hold',()=>__hold(150,500,900)],['short hold',()=>__hold(150,500,400)],
    ['two-finger tap',async()=>{__ptr('pointerdown',1,180,500);__ptr('pointerdown',2,220,500);await __sleep(80);__ptr('pointerup',2,220,500);__ptr('pointerup',1,180,500);}]];
  let stuck=null;
  for(const [name,fn] of seq){await p.evaluate(fn);await p.waitForTimeout(80);const q=await S();if(q.gphase!=='idle'){stuck=name;break;}}
  ok('recogniser idle after each gesture type',stuck===null,stuck);
  // 5. fuzz: 60 random gestures, game keeps accepting input
  const kinds=seq.map(x=>x[0]);let bad=null;
  for(let i=0;i<60&&!bad;i++){
    const [name,fn]=seq[Math.floor(Math.random()*seq.length)];
    await p.evaluate(fn).catch(e=>{bad='eval '+e.message.slice(0,60);});await p.waitForTimeout(40);
    const q=await S();if(q.gphase!=='idle')bad=name+' left phase '+q.gphase;
  }
  ok('fuzz: 60 random gestures never leave input stuck',bad===null,bad);
  s=await S();if(s.state===4){await p.evaluate(()=>__tap(200,300));await p.waitForTimeout(100);}
  const n1=(await S()).npts;await p.evaluate(()=>__drag(100,300,200,330,6,200));s=await S();
  ok('after the fuzz, drawing still works',s.npts>n1,{n1,n:s.npts,st:s.state});
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
