// Phone vs desktop: the game should look and feel the same on every screen (same pace in screens per second).
// Usage: node wsl-tests/scale.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const VPS=[{n:'desktop',w:1280,h:800},{n:'phone portrait',w:390,h:800},{n:'phone landscape',w:844,h:390},{n:'small phone portrait',w:360,h:640}];
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=160;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
const res={};
for(const vp of VPS){
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  let s=await p.evaluate(()=>__wsl());
  // 1. starting track: where it sits on screen (fractions of the screen)
  const z=s.zoomE||s.zoom;const xs=s.pts.map(q=>(q.x-s.camX)*z/vp.w);
  // 2. pace: identical world track, release, average cart speed in screens per second
  await p.evaluate(pts=>{__wslLoad(pts);},slope(12));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});
  await p.waitForTimeout(500);const a=await p.evaluate(()=>__wsl());await p.waitForTimeout(2000);const c=await p.evaluate(()=>__wsl());
  const zz=c.zoomE||c.zoom;const sps=Math.hypot(c.cart.x-a.cart.x,c.cart.y-a.cart.y)*zz/vp.w/2.0;
  res[vp.n]={sps,cartPx:c.cartPx,landTolPx:c.landTolPx,trackSpan:[Math.min(...xs),Math.max(...xs)]};
  console.log(' ',vp.n,JSON.stringify({screensPerSec:+sps.toFixed(3),cartPx:c.cartPx,landTolPx:c.landTolPx,state:c.state}));
  ok(vp.n+': no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
const base=res.desktop.sps;
for(const vp of VPS.slice(1)){
  const r=res[vp.n].sps/base;
  ok(vp.n+': pace matches desktop in screens per second (within 20%)',r>0.8&&r<1.25,+r.toFixed(2));
  ok(vp.n+': cart is at least 24 px on screen',res[vp.n].cartPx>=24,res[vp.n].cartPx);
  ok(vp.n+': catching a track needs at most a thumb-sized miss (landing tolerance >= 12 px)',res[vp.n].landTolPx>=12,res[vp.n].landTolPx);
  const [x0,x1]=res[vp.n].trackSpan;ok(vp.n+': starting track sits at 10%-60% of the screen width',Math.abs(x0-0.10)<0.04&&Math.abs(x1-0.60)<0.05,[+x0.toFixed(2),+x1.toFixed(2)]);
}
await b.close();done();
