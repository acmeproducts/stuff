// Character picker and mid-flight landing burst. Usage: node wsl-tests/character.mjs [file]
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=140;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
async function open(vp,cfg){
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,cfg);
  await p.addInitScript(()=>{window.__txt=[];const f=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t){window.__txt.push(String(t));return f.apply(this,arguments);};});
  const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);return {p,errs};
}
// one run: ride a long gentle slope, jump, optionally tap the character mid-flight, report what happens on landing
async function flight(vp,{arm,tapElsewhere}){
  const {p}=await open(vp,{mode:'regular'});
  await p.evaluate(pts=>{__wslLoad(pts);},slope(8));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/30)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});
  await p.waitForTimeout(250);
  await p.evaluate(()=>__tap(200,150));              // jump (tap anywhere)
  await p.waitForTimeout(350);
  const mid=await p.evaluate(()=>__wsl());
  if(arm){await p.evaluate(()=>{const s=__wsl();const q=__scr(s.cart.x,s.cart.y);return __tap(q.x,q.y);});}
  if(tapElsewhere){await p.evaluate(()=>{const s=__wsl();const q=__scr(s.cart.x,s.cart.y);return __tap(Math.max(10,q.x-200),Math.min(innerHeight-10,q.y+250));});}
  await p.waitForTimeout(60);const armed=(await p.evaluate(()=>__wsl())).armed;
  let land=null;for(let i=0;i<60;i++){await p.waitForTimeout(50);const s=await p.evaluate(()=>__wsl());if(s.state===1){land=s;break;}}
  const x0=land&&land.cart.x;await p.waitForTimeout(1000);const s1=await p.evaluate(()=>__wsl());
  await p.waitForTimeout(2200);const s3=await p.evaluate(()=>__wsl());
  await p.close();return {mid,armed,land,dist1:land&&s1.cart.x-x0,burstLater:s3.burst,vLater:s3.cart.v};
}
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  // ---- character picker
  const {p,errs}=await open(vp,{mode:'regular'});
  await p.click('#btnSettings');await p.waitForTimeout(100);
  const n=(await p.$$('[data-char]')).length;ok('settings offer 12+ characters and objects',n>=12,n);
  await p.click('[data-char="penguin"]');await p.click('#closeSettings');await p.waitForTimeout(150);
  let s=await p.evaluate(()=>__wsl());
  ok('selected character is saved',s.character==='penguin',s.character);
  const drawn=await p.evaluate(()=>{__txt.length=0;return __sleep(200).then(()=>__txt.slice());});
  ok('the chosen character is drawn on the cart (not the snowman)',drawn.includes('🐧')&&!drawn.includes('⛄'),[...new Set(drawn)]);
  await p.reload();await p.waitForTimeout(400);s=await p.evaluate(()=>__wsl());
  ok('character persists after reload',s.character==='penguin',s.character);
  await p.close();
  // ---- landing burst
  const ctl=await flight(vp,{});
  ok('(control) normal jump lands on the track',ctl.land&&ctl.land.state===1,ctl.land&&ctl.land.state);
  const el=await flight(vp,{tapElsewhere:true});
  ok('tapping away from the character in flight does not arm a burst',el.armed===false,el.armed);
  const bu=await flight(vp,{arm:true});
  console.log('  control dist in 1s after landing:',Math.round(ctl.dist1),' armed:',Math.round(bu.dist1),' burst at landing:',bu.land&&Math.round(bu.land.burst),' v landing control/armed:',ctl.land&&Math.round(ctl.land.cart.v),bu.land&&Math.round(bu.land.cart.v));
  ok('tapping the character mid-flight arms a burst',bu.mid.state===2&&bu.armed===true,{st:bu.mid.state,armed:bu.armed});
  ok('landing gives a short burst of speed',bu.land&&bu.land.burst>=300,bu.land&&bu.land.burst);
  ok('the burst carries it further than a normal landing (>= 100 px in the next second)',bu.dist1>=ctl.dist1+100,{ctl:Math.round(ctl.dist1),armed:Math.round(bu.dist1)});
  ok('normal momentum is untouched by the burst (landing speed within 15%)',Math.abs(bu.land.cart.v-ctl.land.cart.v)<=0.15*Math.max(30,ctl.land.cart.v),{c:ctl.land.cart.v,a:bu.land.cart.v});
  ok('burst fades away and normal speed resumes (burst 0 after 3 s)',bu.burstLater===0,bu.burstLater);
}
await b.close();done();
