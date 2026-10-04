// Momentum modes. Earned: speed must be built and bleeds away. Classic: original fast feel.
// Usage: node wsl-tests/physics.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=120;i++)pts.push({x:100+i*20*Math.cos(a),y:200+i*20*Math.sin(a)});return pts;};
for(const momentum of ['earned','classic']){
  console.log('--- momentum: '+momentum);
  const p=await b.newPage({viewport:{width:390,height:800}});
  seeded(p,{mode:'regular',momentum});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(400);await p.evaluate(HELPERS);
  async function run(deg,v0,secs){await p.evaluate(pts=>{__wslLoad(pts);},slope(deg));await p.waitForTimeout(900);
    await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/40)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(50);
    await p.evaluate(v=>__wslSetV(v),v0);const out=[];const t0=Date.now();
    while(Date.now()-t0<secs*1000){await p.waitForTimeout(100);const s=await p.evaluate(()=>__wsl());out.push({t:(Date.now()-t0)/1000,v:s.cart.v,st:s.state});if(s.state!==1)break;}
    return out;}
  ok('mode applied',(await p.evaluate(()=>__wsl().momentum))===momentum);
  const down=await run(30,100,6);
  const tTo500=(down.find(o=>o.v>=500)||{}).t;const peak=Math.max(...down.map(o=>o.v));
  console.log('  downhill 30deg from v=100: time to 500 =',tTo500,'s ; peak v =',Math.round(peak));
  const flat=await run(0,700,2.5);const fv=flat.length?flat[flat.length-1].v:null;
  console.log('  flat track from v=700: v after 2.5 s =',fv&&Math.round(fv));
  if(momentum==='earned'){
    ok('regain 100 -> 500 px/s takes at least 2.5 s',tTo500===undefined||tTo500>=2.5,tTo500);
    ok('top speed at or under 1100 px/s',peak<=1100,Math.round(peak));
    ok('flat track bleeds speed (< 500 after 2.5 s)',fv<500,fv&&Math.round(fv));
  }else{
    ok('classic: regain 100 -> 500 px/s in under 1.5 s',tTo500!==undefined&&tTo500<1.5,tTo500);
    ok('classic: reaches over 1100 px/s',peak>1100,Math.round(peak));
    ok('classic: flat track keeps more speed than earned (>= 450 after 2.5 s)',fv>=450,fv&&Math.round(fv));
  }
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
await b.close();done();
