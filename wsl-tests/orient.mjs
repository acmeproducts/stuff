// Orientation / window changes must be handled live, in every game state. Usage: node wsl-tests/orient.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=260;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
const PORT={width:390,height:800},LAND={width:844,height:390};
async function open(cfg,vp=PORT){const c=await b.newContext({viewport:vp,isMobile:true,hasTouch:true});const p=await c.newPage();seeded(p,cfg);const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);return {p,c,errs};}
const S=p=>p.evaluate(()=>__wsl());
async function ride(p){await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(250);}
const inView=s=>s.cartSX>=0.02&&s.cartSX<=0.98&&s.cartSY>=0.02&&s.cartSY<=0.95;
const rot=async(p,vp)=>{await p.setViewportSize(vp);await p.waitForTimeout(700);};
const rectIn=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return r.left>=-1&&r.top>=-1&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;},sel);
// 1. ready
{const {p,c,errs}=await open({mode:'regular'});
 let s=await S(p);ok('portrait profile first',s.profile==='phone-portrait',s.profile);
 await rot(p,LAND);s=await S(p);
 ok('READY: rotating to landscape keeps the cart in view',inView(s),{x:s.cartSX,y:s.cartSY});
 ok('READY: canvas matches the new size and the profile follows',s.vw===844&&s.vh===390&&s.profile==='phone-landscape',{vw:s.vw,p:s.profile});
 await p.evaluate(()=>__release());await p.waitForTimeout(200);s=await S(p);
 ok('READY: tapping the track still starts the ride after rotating',s.state===1||s.state===2,s.state);
 ok('no page errors (ready)',errs.length===0,errs.slice(0,2));await c.close();}
// 2. riding
{const {p,c,errs}=await open({mode:'regular'});await ride(p);
 await rot(p,LAND);await p.waitForTimeout(900);let s=await S(p);
 ok('RUN: after rotating the cart is back in view within a second',(s.state===1||s.state===2)&&inView(s),{st:s.state,x:s.cartSX,y:s.cartSY});
 await rot(p,PORT);await p.waitForTimeout(900);s=await S(p);
 ok('RUN: and again when rotating back',(s.state===1||s.state===2||s.boomDlg)&&(s.boomDlg||inView(s)),{st:s.state,x:s.cartSX,y:s.cartSY});
 ok('no page errors (run)',errs.length===0,errs.slice(0,2));await c.close();}
// 3. mid-air
{const {p,c}=await open({mode:'regular'});await ride(p);
 await p.evaluate(()=>__tap(200,150));await p.waitForTimeout(250);
 await rot(p,LAND);await p.waitForTimeout(150);let s=await S(p);
 ok('FALL: rotating mid-air does not blow the cart up',s.state!==6&&!s.boomDlg,s.state);
 for(let i=0;i<60&&(await S(p)).state===2;i++)await p.waitForTimeout(50);s=await S(p);
 ok('FALL: it still lands normally on the track',s.state===1&&!s.boomDlg,s.state);await c.close();}
// 4. paused
{const {p,c}=await open({mode:'regular'});await ride(p);
 await p.click('#score');await p.waitForTimeout(80);await p.click('#score');await p.waitForTimeout(150);
 await rot(p,LAND);let s=await S(p);
 ok('PAUSED: stays paused after rotating, cart still in view',s.userPaused===true&&inView(s),{p:s.userPaused,x:s.cartSX,y:s.cartSY});
 ok('PAUSED: the pause card fits the landscape screen',await rectIn(p,'#pauseDlg .card'));
 await p.click('#pauseGo');await p.waitForTimeout(200);s=await S(p);ok('PAUSED: Continue works after rotating',s.userPaused===false,s.userPaused);await c.close();}
// 5. explosion message
{const {p,c}=await open({mode:'regular'});
 await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight*0.7,10,300);});await p.evaluate(()=>__release());
 for(let i=0;i<300&&!(await S(p)).boomDlg;i++)await p.waitForTimeout(30);
 await rot(p,LAND);let s=await S(p);
 ok('BOOM message: still open, fits the landscape screen',s.boomDlg&&await rectIn(p,'#boomDlg .card'),s.boomDlg);
 await p.click('#boomOk');await p.waitForTimeout(250);s=await S(p);
 ok('BOOM message: OK restarts after rotating, cart in view',s.state===0&&inView(s),{st:s.state,x:s.cartSX,y:s.cartSY});await c.close();}
// 6. replay
{const {p,c}=await open({mode:'regular'});await ride(p);await p.waitForTimeout(1200);
 await p.click('#btnSettings');await p.click('#btnReplaySession');await p.waitForTimeout(300);
 let s=await S(p);ok('REPLAY: started',s.replay.active,s.replay);
 await rot(p,LAND);await p.waitForTimeout(400);s=await S(p);
 ok('REPLAY: rotating keeps the whole journey in view',s.replay.active&&(s.replay.phase!=='overview'||s.replay.fit===true),s.replay);
 ok('REPLAY: the control bar fits the screen',await rectIn(p,'#replayUI'));
 await p.click('#repClose');await p.waitForTimeout(300);s=await S(p);
 ok('REPLAY: closing after a rotation puts the cart back in view',!s.replay.active&&inView(s),{x:s.cartSX,y:s.cartSY});await c.close();}
// 7. rescue hold
{const {p,c}=await open({mode:'regular'});await ride(p);
 await p.evaluate(()=>{const s=__wsl();const q=__scr(s.cart.x+90,s.cart.y+60);__ptr('pointerdown',1,q.x,q.y);});await p.waitForTimeout(500);
 await rot(p,LAND);await p.waitForTimeout(500);let s=await S(p);
 ok('HOLD: rotating during a press leaves no stuck input',s.gphase==='idle'&&s.state!==5,{ph:s.gphase,st:s.state});
 await p.evaluate(()=>__ptr('pointerup',1,200,200));await c.close();}
// 8. rapid rotations + HUD fit on a small landscape phone
{const {p,c,errs}=await open({mode:'regular'});await ride(p);
 for(const v of [LAND,PORT,LAND,PORT,{width:667,height:375},PORT,LAND]){await p.setViewportSize(v);await p.waitForTimeout(120);}
 await p.waitForTimeout(600);let s=await S(p);
 ok('rapid rotations: canvas size and scale correct',s.vw===844&&s.vh===390&&Math.abs(s.scale-844/1280)<0.01,{vw:s.vw,scale:s.scale});
 await p.setViewportSize({width:667,height:375});await p.waitForTimeout(500);
 ok('small landscape phone: score, HUD and gear fit',(await rectIn(p,'#hud'))&&(await rectIn(p,'#hud2'))&&(await rectIn(p,'#btnSettings')));
 await p.click('#btnSettings');await p.waitForTimeout(150);
 ok('small landscape phone: settings can scroll to Save & Close',await p.evaluate(()=>{const e=document.getElementById('closeSettings');e.scrollIntoView();const r=e.getBoundingClientRect();return r.bottom<=innerHeight+1&&r.top>=0;}));
 ok('no page errors (rotations)',errs.length===0,errs.slice(0,2));await c.close();}
await b.close();done();
