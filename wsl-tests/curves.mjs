// Line smoothness and momentum modes. Usage: node wsl-tests/curves.mjs [file]
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const turn=pts=>{let m=0;for(let i=2;i<pts.length;i++){const a=Math.atan2(pts[i-1].y-pts[i-2].y,pts[i-1].x-pts[i-2].x),c=Math.atan2(pts[i].y-pts[i-1].y,pts[i].x-pts[i-1].x);let d=Math.abs(c-a);if(d>Math.PI)d=2*Math.PI-d;m=Math.max(m,d);}return m*180/Math.PI;};
const seg=pts=>{let m=0,n=pts.length;for(let i=1;i<n;i++)m=Math.max(m,Math.hypot(pts[i].x-pts[i-1].x,pts[i].y-pts[i-1].y));return m;};
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  seeded(p,{mode:'regular'});
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  // draw a coarse arc (fast finger: ~45 px between events) and measure the stored line
  const n0=(await S()).pts.length;
  await p.evaluate(async()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);const R=130,cx=q.x,cy=q.y+R;
    __ptr('pointerdown',1,q.x,q.y);for(let i=1;i<=9;i++){await __sleep(16);const a=-Math.PI/2+i*0.36;__ptr('pointermove',1,cx+R*Math.cos(a),cy+R*Math.sin(a));}__ptr('pointerup',1,cx,cy);});
  let s=await S();const mine=s.pts.slice(n0+3);
  const t=turn(mine),sg=seg(mine);
  console.log('  max turn between neighbouring segments:',t.toFixed(1),'deg; longest segment:',sg.toFixed(1),'px');
  ok('drawn line is smooth (max turn <= 8 deg)',t<=8,t);
  ok('drawn line is finely sampled (segments <= 10 px)',sg<=10,sg);
  ok('line still ends where the finger went',Math.hypot(s.pts[s.pts.length-1].x-(s.pts[n0-1].x),s.pts[s.pts.length-1].y-(s.pts[n0-1].y))>100);
  // momentum option
  await p.click('#btnSettings');await p.waitForTimeout(100);
  ok('Momentum options offered',(await p.$$('[data-momentum]')).length===2);
  await p.click('[data-momentum="classic"]');s=await S();ok('Classic selected',s.momentum==='classic',s.momentum);
  await p.click('#closeSettings');await p.reload();await p.waitForTimeout(400);s=await S();
  ok('momentum choice persists',s.momentum==='classic',s.momentum);
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
