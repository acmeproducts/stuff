// snow-w.html: a game built for a round Galaxy Watch screen. Usage: node wsl-tests/snow-w.mjs [file]
import {launch,reporter} from './lib.mjs';
import {statSync} from 'fs';
const file=process.argv[2]||'snow-w.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const HELP=()=>{
  const dial=()=>document.getElementById('dial');
  window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));
  window.__p=(t,id,x,y)=>{const r=dial().getBoundingClientRect();dial().dispatchEvent(new PointerEvent(t,{pointerId:id,clientX:r.left+x,clientY:r.top+y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch'}));};
  window.__tap=async(x,y)=>{__p('pointerdown',1,x,y);await __sleep(60);__p('pointerup',1,x,y);};
  window.__drag=async(x0,y0,x1,y1,n,ms)=>{__p('pointerdown',1,x0,y0);for(let i=1;i<=n;i++){await __sleep(ms/n);__p('pointermove',1,x0+(x1-x0)*i/n,y0+(y1-y0)*i/n);}__p('pointerup',1,x1,y1);};
  window.__hold=async(x,y,ms)=>{__p('pointerdown',1,x,y);await __sleep(ms);__p('pointerup',1,x,y);};
  window.__ride=async()=>{const s=__sw.s();const m=s.pts[Math.floor(s.pts.length/30)];const q=__sw.scr(m.x,m.y);await __tap(q.x,q.y);};
};
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=260;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
async function open(vp,init,dpr=2){const c=await b.newContext({viewport:vp,isMobile:true,hasTouch:true,deviceScaleFactor:dpr});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));const reqs=[];p.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:'))reqs.push(r.url());});if(init)await p.addInitScript(init);await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELP);return {p,c,errs,reqs};}
const S=p=>p.evaluate(()=>__sw.s());
const until=async(p,fn,ms=8000)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await p.evaluate(fn))return true;await p.waitForTimeout(40);}return false;};
const inCircle=(p,sel)=>p.evaluate(s=>{const d=document.getElementById('dial').getBoundingClientRect(),R=d.width/2,cx=d.left+R,cy=d.top+R;const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();if(!r.width)return null;
  return [[r.left,r.top],[r.right,r.top],[r.left,r.bottom],[r.right,r.bottom]].every(([x,y])=>Math.hypot(x-cx,y-cy)<=R+1);},sel);
const sizeOf=(p,sel)=>p.evaluate(s=>[...document.querySelectorAll(s)].filter(e=>e.getBoundingClientRect().width>0).map(e=>{const r=e.getBoundingClientRect();return Math.min(r.width,r.height);}),sel);
const long=async(p)=>{await p.evaluate(pts=>__sw.load(pts),slope(9));await p.waitForTimeout(300);};

// ---- 0. the file itself
const kb=statSync(file).size/1024;ok(`the game is one small self-contained file (${kb.toFixed(0)} KB, under 70 KB)`,kb<70,Math.round(kb));
for(const vp of [{width:216,height:216},{width:240,height:240},{width:192,height:192},{width:288,height:288},{width:450,height:450},{width:260,height:300}]){
  const nm=`${vp.width}x${vp.height}`;
  const {p,c,errs,reqs}=await open(vp);let s=await S(p);
  // ---- 1. round, locked, no scrolling
  const geo=await p.evaluate(()=>{const d=document.getElementById('dial'),r=d.getBoundingClientRect(),cs=getComputedStyle(d);return {w:r.width,h:r.height,round:cs.borderRadius,ts:getComputedStyle(document.body).touchAction,ov:getComputedStyle(document.documentElement).overflow,meta:document.querySelector('meta[name=viewport]').content,vw:innerWidth,vh:innerHeight};});
  ok(`${nm}: a round dial filling the short side`,Math.abs(geo.w-Math.min(geo.vw,geo.vh))<=1&&Math.abs(geo.w-geo.h)<=1&&/50%|9999|^\d+(\.\d+)?px/.test(geo.round),geo);
  await p.evaluate(()=>{window.scrollTo(0,500);document.body.scrollTop=500;document.documentElement.scrollTop=500;});await p.waitForTimeout(100);
  const sc=await p.evaluate(()=>({y:window.scrollY,h:document.documentElement.scrollHeight,ih:innerHeight}));
  ok(`${nm}: the page itself cannot scroll`,sc.y===0&&sc.h<=sc.ih+1&&geo.ts==='none'&&/user-scalable=no/.test(geo.meta),sc);
  ok(`${nm}: no network requests (works offline)`,reqs.length===0,reqs.slice(0,2));
  ok(`${nm}: HUD inside the round screen`,(await inCircle(p,'#score'))&&(await inCircle(p,'#pips')),{score:await inCircle(p,'#score'),pips:await inCircle(p,'#pips')});
  // ---- 2. fixed view while playing
  await long(p);const y0=(await S(p)).camY;await p.evaluate(()=>__ride());
  let lo=1e9,hi=-1e9;const t0=Date.now();let jumped=false;while(Date.now()-t0<1500){const t=await S(p);lo=Math.min(lo,t.camY);hi=Math.max(hi,t.camY);if(!jumped&&Date.now()-t0>300){jumped=true;await p.evaluate(()=>__tap(60,30));}await p.waitForTimeout(40);}
  s=await S(p);ok(`${nm}: the view never scrolls up or down (ride, jump, fall)`,hi-lo===0&&y0===lo,{range:hi-lo});
  ok(`${nm}: a jump flips and scores (+100 x rising multiplier)`,s.flipPts>=300||s.flips>=1,{flips:s.flips,pts:s.flipPts});
  ok(`${nm}: the cart is readable (7-14% of the dial)`,s.cartPx>=geo.w*0.07&&s.cartPx<=geo.w*0.14,{cart:s.cartPx,dial:geo.w});
  ok(`${nm}: no page errors`,errs.length===0,errs.slice(0,2));
  await c.close();
}
// ---- 3. full play-through on a typical watch (216)
{const {p,c,errs}=await open({width:216,height:216});
 let s=await S(p);ok('starts ready with the starting track drawn',s.state===0&&s.pts.length>3,{st:s.state,pts:s.pts.length});
 const n0=s.pts.length;await p.evaluate(()=>{const s=__sw.s();const e=s.pts[s.pts.length-1];const q=__sw.scr(e.x,e.y);return __drag(q.x,q.y,q.x+20,q.y+10,8,200);});
 s=await S(p);ok('one finger draws the track',s.pts.length>n0,{n0,n:s.pts.length});
 // a second finger must not break anything
 await p.evaluate(()=>{__p('pointerdown',1,80,30);__p('pointerdown',2,120,30);__p('pointermove',2,150,50);__p('pointerup',2,150,50);__p('pointerup',1,80,30);});
 s=await S(p);ok('a second finger is ignored (one-finger game)',s.state===0&&s.gest==='idle',{st:s.state,g:s.gest});
 await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(250);s=await S(p);ok('tapping the track starts the ride',s.state===1||s.state===2,s.state);
 // flips, multiplier, scoring
 const sc0=s.score;await p.evaluate(()=>__tap(60,30));await p.waitForTimeout(100);
 let shown=null;for(let i=0;i<80;i++){const t=await S(p);if(t.mult>=2)shown=await p.evaluate(()=>{const e=document.getElementById('mult');return getComputedStyle(e).display!=='none'?e.textContent:null;});if(t.state===1&&i>5)break;await p.waitForTimeout(40);}
 s=await S(p);ok('the multiplier appears on screen (x2, x3 ...)',!!shown&&/×[2-5]/.test(shown),shown);
 ok('flip points = +100 x multiplier per flip',s.flipPts===[1,2,3,4,5,5,5,5].slice(0,s.flips).reduce((a,m)=>a+100*m,0)&&s.flips>=2,{flips:s.flips,pts:s.flipPts});
 ok('flip points are in the score',s.score>=sc0+s.flipPts,{sc0,score:s.score});
 ok('no errors',errs.length===0,errs.slice(0,2));await c.close();}
// ---- 4. explosion, rescue cost, OK restarts, game over
{const {p,c}=await open({width:216,height:216});
 await p.evaluate(()=>{const s=__sw.s();const e=s.pts[s.pts.length-1];const q=__sw.scr(e.x,e.y);return __drag(q.x,q.y,q.x+8,q.y+90,8,250);});
 await p.evaluate(()=>__sw.setScore(450));
 const drop=async()=>{await p.evaluate(()=>{const s=__sw.s();const m=s.pts[Math.floor(s.pts.length/3)];const q=__sw.scr(m.x,m.y);return __tap(q.x,q.y);});await until(p,()=>__sw.s().boomDlg||__sw.s().over,9000);return S(p);};
 let s=await drop();
 ok('an uncaught cart explodes and the game pauses with a message',s.boomDlg===true&&/rescue/i.test(await p.evaluate(()=>document.getElementById('dlg').innerText)),s.boomDlg);
 ok('...the message fits the round screen',await inCircle(p,'#dlgcard'));
 ok('...a rescue was spent (3 -> 2)',s.charges===2,s.charges);
 ok('...its OK button is big enough for a finger',(await sizeOf(p,'#dlgbtn')).every(v=>v>=34),await sizeOf(p,'#dlgbtn'));
 const a=await S(p);await p.waitForTimeout(500);const b2=await S(p);ok('...nothing moves while it is open',a.cart.x===b2.cart.x&&a.time===b2.time);
 await p.click('#dlgbtn');await p.waitForTimeout(200);s=await S(p);ok('OK restarts on the track, ready to ride, score kept',s.state===0&&!s.boomDlg&&s.charges===2&&s.score===450,{st:s.state,ch:s.charges,sc:s.score});
 for(let k=0;k<2;k++){s=await drop();if(k===0)await p.click('#dlgbtn');await p.waitForTimeout(150);if(k===0)await p.waitForTimeout(100);}
 s=await S(p);
 // after the third explosion charges are 0 but the restart is still given; the next one ends the run
 if(s.boomDlg){await p.click('#dlgbtn');await p.waitForTimeout(150);}
 s=await drop();ok('with no rescues left the run is over',s.over===true||/no rescue|over/i.test(await p.evaluate(()=>document.getElementById('dlg').innerText)),{over:s.over});
 await p.click('#dlgbtn');await p.waitForTimeout(250);s=await S(p);
 ok('game over shows the score and a New run button',s.over===true||/New run|Best/i.test(await p.evaluate(()=>document.getElementById('dlg').innerText)),s.over);
 await p.click('#dlgbtn');await p.waitForTimeout(250);s=await S(p);
 ok('New run starts fresh (full rescues, score 0)',s.state===0&&s.charges===3&&s.score===0&&!s.over,{st:s.state,ch:s.charges,sc:s.score});
 await c.close();}
// ---- 5. menu = pause + settings, auto-pause, persistence
{const {p,c}=await open({width:216,height:216});
 await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(300);
 await p.click('#menubtn');await p.waitForTimeout(150);let s=await S(p);
 ok('tapping the score opens the menu and pauses',s.menuOpen===true&&s.paused===true,s.menuOpen);
 const sz=await sizeOf(p,'#menu button');ok(`menu buttons are finger-sized (all >= 34 px; ${sz.length} buttons)`,sz.length>=8&&sz.every(v=>v>=34),sz.filter(v=>v<34));
 const a=await S(p);await p.waitForTimeout(600);const b2=await S(p);ok('the game is frozen behind the menu',a.cart.x===b2.cart.x&&a.time===b2.time);
 ok('the menu fits the round screen (its buttons stay inside the circle when scrolled in)',await p.evaluate(()=>{const d=document.getElementById('dial').getBoundingClientRect();return [...document.querySelectorAll('#menu button')].every(b=>{b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return r.left>=d.left-1&&r.right<=d.right+1;});}));
 await p.click('#m-zen');await p.click('#m-sound');await p.click('#m-haptic');await p.click('[data-mom="fast"]');await p.click('[data-rider="penguin"]');await p.waitForTimeout(100);
 await p.reload();await p.waitForTimeout(500);await p.evaluate(HELP);s=await S(p);
 ok('settings are remembered after a reload',s.zen===true&&s.sound===true&&s.haptics===false&&s.mom==='fast'&&s.rider==='penguin',{zen:s.zen,snd:s.sound,hap:s.haptics,mom:s.mom,r:s.rider});
 await p.click('#menubtn');await p.waitForTimeout(100);await p.click('#m-zen');await p.click('#m-sound');await p.click('#m-haptic');await p.click('#menuresume');await p.waitForTimeout(150);
 await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(250);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(150);
 s=await S(p);ok('leaving the app (screen off / wrist down) pauses into the menu',s.menuOpen===true&&s.paused===true,s.menuOpen);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{get:()=>false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
 await p.click('#menuresume');await p.waitForTimeout(150);s=await S(p);ok('Resume continues',s.paused===false,s.paused);await c.close();}
// ---- 6. Zen
{const {p,c}=await open({width:216,height:216},()=>{try{localStorage.setItem('snoww',JSON.stringify({zen:true}));}catch(e){}});
 await p.evaluate(()=>{const s=__sw.s();const e=s.pts[s.pts.length-1];const q=__sw.scr(e.x,e.y);return __drag(q.x,q.y,q.x+8,q.y+90,8,250);});await p.evaluate(()=>{const s=__sw.s();const m=s.pts[Math.floor(s.pts.length/3)];const q=__sw.scr(m.x,m.y);return __tap(q.x,q.y);});
 let boom=false;for(let i=0;i<150;i++){const s=await S(p);if(s.boomDlg||s.over)boom=true;await p.waitForTimeout(40);}
 ok('Zen never explodes (the cart returns to its track)',!boom,boom);await c.close();}
// ---- 7. battery: 30 frames a second at most, idle when paused, vibration and sound only when enabled
{const {p,c}=await open({width:216,height:216},()=>{window.__vib=[];navigator.vibrate=p=>{window.__vib.push(p);return true;};});
 await long(p);await p.evaluate(()=>__ride());const f0=(await S(p)).frames;await p.waitForTimeout(2000);const f1=(await S(p)).frames;const fps=(f1-f0)/2;
 ok('frame rate is capped for battery (20-35 frames a second)',fps>=20&&fps<=35,+fps.toFixed(1));
 await p.click('#menubtn');await p.waitForTimeout(300);const g0=(await S(p)).frames;await p.waitForTimeout(1000);const g1=(await S(p)).frames;
 ok('nothing is redrawn while the menu is open (idle, saves battery)',g1-g0<=3,g1-g0);
 await p.click('#menuresume');await p.waitForTimeout(100);
 await p.evaluate(()=>{window.__vib.length=0;});await p.evaluate(()=>__tap(60,30));await p.waitForTimeout(150);
 ok('haptics: a jump gives a short buzz (on by default)',(await p.evaluate(()=>window.__vib.length))>=1,await p.evaluate(()=>window.__vib));
 ok('sound is off by default (no audio engine started, no battery spent)',(await S(p)).audioStarted===false);
 await p.click('#menubtn');await p.click('#m-haptic');await p.click('#menuresume');await p.waitForTimeout(100);
 await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(250);await p.evaluate(()=>{window.__vib.length=0;});await p.evaluate(()=>__tap(60,30));await p.waitForTimeout(150);
 ok('haptics off: no buzz',(await p.evaluate(()=>window.__vib.length))===0);
 await c.close();}
// ---- 8. same pace on every watch size
{const sps={};for(const d of [192,240,450]){const {p,c}=await open({width:d,height:d});await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(400);const a=await S(p);await p.waitForTimeout(1500);const t=await S(p);sps[d]=Math.hypot(t.cart.x-a.cart.x,t.cart.y-a.cart.y)*t.zoom/t.D/1.5;await c.close();}
 console.log('  dial widths per second:',JSON.stringify(Object.fromEntries(Object.entries(sps).map(([k,v])=>[k,+v.toFixed(3)]))));
 ok('pace is the same on 192, 240 and 450 px dials (within 20%)',Math.abs(sps[192]/sps[240]-1)<0.2&&Math.abs(sps[450]/sps[240]-1)<0.2,sps);}
// ---- 9. resizing (a different watch face size or a rotation of a preview) keeps the cart in view
{const {p,c}=await open({width:240,height:240});await long(p);await p.evaluate(()=>__ride());await p.waitForTimeout(500);
 await p.setViewportSize({width:200,height:200});await p.waitForTimeout(600);const s=await S(p);ok('after a size change the dial is resized and the cart is still on it',s.D===200&&s.cartX>=0&&s.cartX<=1,{D:s.D,x:s.cartX});await c.close();}
// ---- 10. best score is kept
{const {p,c}=await open({width:216,height:216});
 await p.evaluate(()=>{const s=__sw.s();const e=s.pts[s.pts.length-1];const q=__sw.scr(e.x,e.y);return __drag(q.x,q.y,q.x+8,q.y+90,8,250);});
 for(let k=0;k<6;k++){await p.evaluate(()=>{const s=__sw.s();if(s.state===0){const m=s.pts[Math.floor(s.pts.length/3)];const q=__sw.scr(m.x,m.y);return __tap(q.x,q.y);}});await until(p,()=>__sw.s().boomDlg||__sw.s().over,9000);const s=await S(p);if(s.over)break;await p.click('#dlgbtn').catch(()=>{});await p.waitForTimeout(120);}
 const s=await S(p);ok('the run ended with a final score and a best score saved',s.over===true&&s.best>0&&s.best===s.final,{best:s.best,final:s.final});
 await p.reload();await p.waitForTimeout(500);await p.evaluate(HELP);const t=await S(p);ok('the best score survives a reload',t.best===s.best,{best:t.best});await c.close();}
await b.close();done();
