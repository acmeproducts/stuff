// Scoring model: final = base (pages + trick bonuses) + distance inches + survival seconds x10 (+ Flow bonus).
// Usage: node wsl-tests/scoring.mjs [file]
import {launch,VIEWPORTS,HELPERS,fresh,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  await fresh(p,false);
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight-20,14,400);});
  await p.evaluate(()=>__release());
  let s;for(let i=0;i<40&&(s=await S()).state!==4;i++)await p.waitForTimeout(500);
  s=await S();ok('run ended',s.state===4,s.state);
  const L=s.last||{};console.log('  breakdown:',JSON.stringify(L));
  ok('breakdown recorded',L.final!==undefined);
  ok('distance points = inches travelled (20 px per inch)',L.dist===Math.floor(L.distPx/20)&&L.dist>0,{dist:L.dist,px:L.distPx});
  ok('time points = survival seconds x 10',L.time===Math.floor(L.seconds*10)&&L.time>0,{time:L.time,sec:L.seconds});
  ok('final = base + distance + time + flow',L.final===L.base+L.dist+L.time+L.flow,L);
  const ov=await p.evaluate(()=>document.getElementById('overlay').innerText);
  ok('game-over shows the breakdown line',/Base/.test(ov)&&/Time/.test(ov)&&/Flow/.test(ov)&&new RegExp(String(L.final)).test(ov),ov.replace(/\n/g,' | '));
  const best=await p.evaluate(()=>localStorage.getItem('scl_best'));
  ok('best score saves the final score',Number(best)===L.final,{best,final:L.final});
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
