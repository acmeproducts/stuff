// Speed behaviour: a cart that has lost speed must not regain it quickly. Usage: node wsl-tests/physics.mjs [file]
import {launch,HELPERS,reporter} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const p=await b.newPage({viewport:{width:390,height:800}});await p.addInitScript(()=>{try{localStorage.setItem('wsl_settings',JSON.stringify({mode:'regular'}));}catch(e){}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(url);await p.waitForTimeout(400);await p.evaluate(HELPERS);
// 30-degree downhill, 2400 px long
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=120;i++)pts.push({x:100+i*20*Math.cos(a),y:200+i*20*Math.sin(a)});return pts;};
async function run(deg,v0,secs){await p.evaluate(d=>{},0);await p.evaluate(pts=>{__wslLoad(pts);},slope(deg));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[2];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(50);
  await p.evaluate(v=>__wslSetV(v),v0);const out=[];const t0=Date.now();
  while(Date.now()-t0<secs*1000){await p.waitForTimeout(100);const s=await p.evaluate(()=>__wsl());out.push({t:(Date.now()-t0)/1000,v:s.cart.v,st:s.state});if(s.state!==1)break;}
  return out;}
const down=await run(30,100,6);
const tTo500=(down.find(o=>o.v>=500)||{}).t;const peak=Math.max(...down.map(o=>o.v));
console.log('downhill 30deg from v=100: time to 500 =',tTo500,'s ; peak v =',Math.round(peak));
ok('regain 100 -> 500 px/s takes at least 2.5 s on a 30 degree slope',tTo500===undefined||tTo500>=2.5,tTo500);
ok('speed stays at or under 1100 px/s',peak<=1100,Math.round(peak));
// a cart on a gentle 8-degree slope with speed 700 should slow down, not speed up
const gentle=await run(8,700,2);
ok('fast cart on a gentle slope does not gain speed',gentle.length&&gentle[gentle.length-1].v<=720,gentle.length&&Math.round(gentle[gentle.length-1].v));
// flat track bleeds speed
const flat=await run(0,700,2.5);
ok('flat track bleeds speed noticeably (< 500 after 2.5 s)',flat.length&&flat[flat.length-1].v<500,flat.length&&Math.round(flat[flat.length-1].v));
ok('no page errors',errs.length===0,errs.slice(0,2));
await b.close();done();
