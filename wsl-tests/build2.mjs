// WSL Build 2 checks: rescue, flow, timer/distance, jump chain. Usage: node wsl-tests/build2.mjs [file]
import {launch,VIEWPORTS,HELPERS,fresh,reporter} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>window.__wsl&&window.__wsl());
  let s=await S();ok('hook present',!!s&&s.charges===3,s&&s.charges);if(!s||s.charges===undefined){await p.close();continue;}
  // long track ahead for stable runs
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+250,q.y+40,12,400);});
  await p.evaluate(()=>__release());await p.waitForTimeout(150);
  s=await S();ok('running',s.state===1,s.state);
  // rescue: long press
  const hp=await p.evaluate(()=>{const s=__wsl();const q=__scr(s.cart.x+120,s.cart.y+60);return q;});
  const hold1=p.evaluate(({x,y})=>__hold(x,y,1900),hp);await p.waitForTimeout(950);
  s=await S();ok('long press enters rescue (frozen, charge used, track added)',s.state===5&&s.charges===2&&s.ntracks===2,{state:s.state,ch:s.charges,nt:s.ntracks});
  const cx=s.cart.x,t0=s.timer,d0=s.dist;await p.waitForTimeout(250);s=await S();
  ok('physics frozen + timer paused during rescue',Math.abs(s.cart.x-cx)<0.5&&s.timer===t0&&s.dist===d0,{dx:s.cart.x-cx});
  await hold1;await p.waitForTimeout(100);s=await S();
  ok('release finishes rescue; cart rides rescue track',s.state===1&&s.cartTrack===1,{state:s.state,track:s.cartTrack});
  // early release is not a rescue
  await fresh(p);
  const hp2=await p.evaluate(()=>{const s=__wsl();return __scr(s.cart.x+120,s.cart.y+60);});
  await p.evaluate(({x,y})=>__hold(x,y,400),hp2);s=await S();
  ok('short hold is not a rescue',s.charges===3&&s.state!==5,{ch:s.charges,state:s.state});
  // charge limit
  await fresh(p);
  for(let i=0;i<4;i++){
    const h=await p.evaluate(()=>{const s=__wsl();return __scr(s.cart.x+100,s.cart.y+50);});
    await p.evaluate(({x,y})=>__hold(x,y,900),h);await p.waitForTimeout(80);
  }
  s=await S();ok('only 3 rescues',s.charges===0&&s.state!==5,{ch:s.charges,state:s.state,nt:s.ntracks});
  // pinch during rescue ends it cleanly
  await fresh(p);
  const h3=await p.evaluate(()=>{const s=__wsl();return __scr(s.cart.x+100,s.cart.y+50);});
  const hold3=p.evaluate(({x,y})=>__hold(x,y,1500),h3);await p.waitForTimeout(950);
  await p.evaluate(()=>__pinch(100,160,200,400));s=await S();await hold3;
  ok('pinch during rescue does not leave it stuck',s.state!==5,s.state);
  // flow / timer / distance
  await fresh(p,false);
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+250,q.y+30,12,400);});
  await p.evaluate(()=>__release());await p.waitForTimeout(1500);s=await S();
  ok('flow measured while running',s.flow>0,s.flow);
  ok('timer and distance advance',s.timer>0.8&&s.dist>0,{t:s.timer,d:s.dist});
  const hud=await p.evaluate(()=>document.body.innerText);
  ok('HUD shows Flow, timer, distance, rescue charges',/FLOW/.test(hud)&&/\d:\d\d/.test(hud)&&/″/.test(hud)&&/3/.test(hud),hud.replace(/\n/g,' ').slice(0,80));
  // jump chain
  async function apex(taps){await fresh(p);return p.evaluate(async(n)=>{const y0=__wsl().cart.y;let mn=y0;const pr=(async()=>{for(let i=0;i<150;i++){await __sleep(10);mn=Math.min(mn,__wsl().cart.y);}})();
    for(let i=0;i<n;i++){await __tap(200,250);await __sleep(90);}await pr;return y0-mn;},taps);}
  const h1=await apex(1),h3b=await apex(3);
  ok('three quick taps = bigger jump',h3b>h1*1.4,{one:Math.round(h1),three:Math.round(h3b)});
  // game over summary
  await fresh(p,false);await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});await p.evaluate(()=>__release());for(let i=0;i<40&&(await S()).state!==4;i++)await p.waitForTimeout(500);s=await S();
  const ov=await p.evaluate(()=>document.getElementById('overlay').innerText);
  ok('game over shows flow, distance, time',s.state===4&&/Flow/i.test(ov)&&/Time/i.test(ov),{state:s.state,ov:ov.replace(/\n/g,' | ')});
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
