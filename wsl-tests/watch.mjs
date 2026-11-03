// Watch-size screens: the view must not scroll up and down while playing. Usage: node wsl-tests/watch.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=260;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
async function open(vp,cfg,mobile=true){const c=await b.newContext({viewport:vp,isMobile:mobile,hasTouch:mobile});const p=await c.newPage();seeded(p,cfg);const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);return {p,c,errs};}
const S=p=>p.evaluate(()=>__wsl());
const rectIn=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;},sel);
async function camYRange(p,ms){let lo=1e9,hi=-1e9;const t0=Date.now();while(Date.now()-t0<ms){const s=await S(p);lo=Math.min(lo,s.camY);hi=Math.max(hi,s.camY);await p.waitForTimeout(40);}return hi-lo;}
const startRide=p=>p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});
// ---- 1. a watch: fixed-height view is chosen automatically and nothing scrolls vertically
for(const vp of [{width:200,height:200},{width:198,height:242},{width:240,height:240}]){
  const {p,c,errs}=await open(vp,{mode:'regular'});let s=await S(p);const nm=`${vp.width}x${vp.height}`;
  ok(`${nm}: fixed-height view is chosen automatically`,s.fixedView===true,{fixed:s.fixedView,profile:s.profile});
  ok(`${nm}: its own tuning profile`,/^watch-/.test(s.profile),s.profile);
  await p.evaluate(pts=>{__wslLoad(pts);},slope(10));await p.waitForTimeout(900);
  const y0=(await S(p)).camY;await startRide(p);
  const r1=camYRange(p,900);await p.waitForTimeout(250);await p.evaluate(()=>__tap(100,60));const rng=await r1;
  s=await S(p);ok(`${nm}: riding and jumping does not scroll the view up or down`,rng<0.5&&Math.abs(s.camY-y0)<0.5,{range:+rng.toFixed(2)});
  ok(`${nm}: the game ran (no errors)`,errs.length===0&&(s.state===1||s.state===2||s.state===6||s.boomDlg),{st:s.state,err:errs[0]});
  await c.close();
}
// ---- 2. a fall does not scroll, and an uncaught cart still explodes
{const {p,c}=await open({width:200,height:200},{mode:'regular'});
 await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+10,innerHeight*0.9,8,250);});
 await p.evaluate(()=>__release());
 let lo=1e9,hi=-1e9,boom=false;for(let i=0;i<300;i++){const s=await S(p);lo=Math.min(lo,s.camY);hi=Math.max(hi,s.camY);if(s.boomDlg||s.state===6){boom=true;break;}await p.waitForTimeout(30);}
 ok('falling does not scroll the view, and an uncaught cart still explodes',boom&&hi-lo<0.5,{range:+(hi-lo).toFixed(2),boom});await c.close();}
// ---- 3. riding a track off the bottom of the screen also explodes (the cart cannot be followed down)
{const {p,c}=await open({width:200,height:200},{mode:'regular'});
 await p.evaluate(pts=>{__wslLoad(pts);},slope(40));await p.waitForTimeout(900);await startRide(p);
 let boom=false;for(let i=0;i<400;i++){const s=await S(p);if(s.boomDlg||s.state===6){boom=true;break;}await p.waitForTimeout(30);}
 ok('a cart that rides off the bottom of a fixed view explodes instead of vanishing',boom,boom);await c.close();}
// ---- 4. watch layout
{const {p,c}=await open({width:200,height:200},{mode:'regular'});let s=await S(p);
 ok('watch: cart is 14-22 px on screen',s.cartPx>=14&&s.cartPx<=22,s.cartPx);
 ok('watch: score fits on screen',await rectIn(p,'#score'));
 ok('watch: the gear fits on screen',await rectIn(p,'#btnSettings'));
 ok('watch: the busy stats row is hidden',await p.evaluate(()=>getComputedStyle(document.getElementById('hud2')).display==='none'));
 await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+10,innerHeight*0.9,8,250);});await p.evaluate(()=>__release());
 for(let i=0;i<300&&!(await S(p)).boomDlg;i++)await p.waitForTimeout(30);
 ok('watch: the explosion message fits the screen',await rectIn(p,'#boomDlg .card'));
 await p.click('#boomOk');await p.waitForTimeout(200);
 await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(200);
 ok('watch: the pause card fits the screen',await rectIn(p,'#pauseDlg .card'));
 await p.click('#pauseGo');await p.waitForTimeout(150);
 await p.click('#btnSettings');await p.waitForTimeout(150);
 ok('watch: settings open and Save & Close can be reached',await p.evaluate(()=>{const e=document.getElementById('closeSettings');e.scrollIntoView();const r=e.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.right<=innerWidth+1;}));
 await p.click('#closeSettings');await c.close();}
// ---- 5. pinch zoom is off in a fixed view
{const {p,c}=await open({width:200,height:200},{mode:'regular'});
 const z0=(await S(p)).zoom;await p.evaluate(()=>__pinch(60,140,100,100));await p.waitForTimeout(150);const z1=(await S(p)).zoom;
 ok('pinch zoom is ignored in the fixed view (it would shift the picture up or down)',Math.abs(z1-z0)<0.001,{z0,z1});await c.close();}
// ---- 6. the setting: Auto / Scrolling / Fixed height, remembered
{const {p,c}=await open({width:1280,height:800},{mode:'regular'},false);let s=await S(p);
 ok('desktop: scrolling view by default',s.fixedView===false&&s.view==='auto',{f:s.fixedView,v:s.view});
 await p.click('#btnSettings');await p.waitForTimeout(100);
 ok('settings offer Auto, Scrolling and Fixed height',(await p.$$('[data-view]')).length===3);
 await p.click('[data-view="fixed"]');await p.click('#closeSettings');await p.waitForTimeout(200);s=await S(p);
 ok('choosing Fixed height works on a big screen too',s.fixedView===true&&s.view==='fixed',{f:s.fixedView});
 await p.evaluate(pts=>{__wslLoad(pts);},slope(10));await p.waitForTimeout(500);await startRide(p);
 const rng=await camYRange(p,1200);ok('desktop in Fixed height: the view does not scroll vertically',rng<0.5,rng);
 await p.reload();await p.waitForTimeout(500);s=await S(p);ok('the choice is remembered after a reload',s.view==='fixed'&&s.fixedView===true,s.view);
 await p.evaluate(HELPERS);await p.click('#btnSettings');await p.click('[data-view="scroll"]');await p.click('#closeSettings');await p.waitForTimeout(200);s=await S(p);
 ok('choosing Scrolling turns it off again',s.fixedView===false,s.view);
 await p.evaluate(pts=>{__wslLoad(pts);},slope(25));await p.waitForTimeout(500);await startRide(p);
 const rng2=await camYRange(p,1500);ok('(control) in Scrolling the view does follow a falling track',rng2>20,+rng2.toFixed(1));await c.close();}
// ---- 7. a watch can be set to Scrolling
{const {p,c}=await open({width:200,height:200},{mode:'regular',view:'scroll'});const s=await S(p);ok('a watch set to Scrolling scrolls',s.fixedView===false,s.fixedView);await c.close();}
await b.close();done();
