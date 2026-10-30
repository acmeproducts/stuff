// Flip scoring (+100 x progressive multiplier) and the explosion at the last 10% of the screen. Usage: node wsl-tests/flips.mjs [file]
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=200;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
const expect=n=>{let t=0;for(let k=1;k<=n;k++)t+=100*Math.min(k,5);return t;};
async function open(vp,cfg){const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,cfg);const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);return {p,errs};}
async function ride(p){await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(250);}
async function flight(p,taps){ // jump, record everything until landing
  const seen=[];await p.evaluate(async n=>{for(let i=0;i<n;i++){await __tap(200,150);await __sleep(90);}},taps);
  let land=null;for(let i=0;i<120;i++){const s=await p.evaluate(()=>__wsl());seen.push({fl:s.flips});if(s.state===1&&i>3){land=s;break;}await p.waitForTimeout(40);}
  return {land,seen};
}
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  { // normal jump
    const {p,errs}=await open(vp,{mode:'regular'});await ride(p);
    const s0=await p.evaluate(()=>__wsl());
    let txt=null;const watch=(async()=>{for(let i=0;i<60;i++){await p.waitForTimeout(40);const t=await p.evaluate(()=>{const e=document.getElementById('flipmult');return e&&getComputedStyle(e).display!=='none'?e.textContent:null;});if(t)txt=t;}})();
    const {land}=await flight(p,1);await watch;
    console.log('  normal jump: flips',land&&land.flips,'flip points',land&&land.flipPts,'mult label seen:',txt);
    ok('a jump lands back on the track (no explosion)',land&&land.state===1&&land.boom===false,land&&land.state);
    ok('successive flips are counted (at least 2 in one flight)',land.flips>=2,land.flips);
    ok('flip points = +100 x multiplier for each successive flip (x1, x2, x3 ...)',land.flipPts===expect(land.flips),{flips:land.flips,pts:land.flipPts,want:expect(land.flips)});
    ok('flip points are in the score',land.score>=s0.score+land.flipPts,{s0:s0.score,s:land.score});
    ok('multiplier shown on screen (FLIP x2 or more)',!!txt&&/×[2-5]/.test(txt),txt);
    await p.waitForTimeout(1800);const after=await p.evaluate(()=>{const e=document.getElementById('flipmult');return e?getComputedStyle(e).display:'none';});
    ok('multiplier clears after landing',after==='none',after);
    ok('no page errors',errs.length===0,errs.slice(0,2));await p.close();
  }
  { // big jump: cap at x5
    const {p}=await open(vp,{mode:'regular'});await ride(p);
    const {land}=await flight(p,3);console.log('  big jump: flips',land&&land.flips,'pts',land&&land.flipPts);
    ok('a long flight reaches the x5 cap and stays there',land.flips>=6&&land.flipPts===expect(land.flips)&&land.mult===5,{flips:land.flips,pts:land.flipPts,mult:land.mult});
    await p.close();
  }
  { // explosion when not caught
    const {p}=await open(vp,{mode:'regular'});
    await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});
    await p.evaluate(()=>__release());
    let boomSeen=false,fr=[];for(let i=0;i<120;i++){const s=await p.evaluate(()=>__wsl());if(s.state===2)fr.push(s.cartSY);if(s.state===6){boomSeen=true;break;}await p.waitForTimeout(30);}
    const s=await p.evaluate(()=>__wsl());
    ok('an uncaught cart explodes',boomSeen,s.state);
    ok('it explodes in the last 10% of the screen (88-97% down)',s.boomFrac>=0.88&&s.boomFrac<=0.97,s.boomFrac);
    const inc=fr.length>3&&fr.every((v,i)=>i===0||v>=fr[i-1]-0.002);
    ok('the view does not chase a falling cart down the screen',inc,fr.slice(0,6).map(v=>+v.toFixed(2)));
    for(let i=0;i<60&&!(await p.evaluate(()=>__wsl().boomDlg));i++)await p.waitForTimeout(100);
    const g=await p.evaluate(()=>({dlg:__wsl().boomDlg,ch:__wsl().charges,msg:document.getElementById('boomDlg').innerText}));
    ok('after the explosion a message appears and a rescue is spent',g.dlg===true&&g.ch===2&&/rescue/i.test(g.msg),{dlg:g.dlg,ch:g.ch});
    await p.close();
  }
  { // catching it in time prevents the explosion
    const {p}=await open(vp,{mode:'regular'});
    await p.evaluate(pts=>{__wslLoad(pts.slice(0,4));},slope(8).slice(0,4).map((q,i)=>({x:q.x,y:q.y})));await p.waitForTimeout(900);
    await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/3)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});
    for(let i=0;i<100&&(await p.evaluate(()=>__wsl().state))!==2;i++)await p.waitForTimeout(30);
    await p.evaluate(()=>{const s=__wsl();const q=__scr(s.cart.x,s.cart.y);return __drag(q.x-40,innerHeight*0.62,q.x+260,innerHeight*0.66,8,150);});
    let st=null;for(let i=0;i<80;i++){const s=await p.evaluate(()=>__wsl());st=s.state;if(st===1||st===6)break;await p.waitForTimeout(40);}
    ok('drawing a track under it in time catches it (no explosion)',st===1,st);
    await p.close();
  }
}
{ // Zen: no explosion
  const {p}=await open({w:390,h:800},{mode:'zen'});
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});await p.evaluate(()=>__release());
  let boom=false;for(let i=0;i<150;i++){const s=await p.evaluate(()=>__wsl());if(s.state===6||s.state===4)boom=true;await p.waitForTimeout(40);}
  ok('Zen never explodes',!boom,boom);await p.close();
}
await b.close();done();
