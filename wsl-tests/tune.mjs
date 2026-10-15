// Momentum fine-tune slider, saved per device type and orientation. Usage: node wsl-tests/tune.mjs [file]
import {launch,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const slope=deg=>{const pts=[];const a=deg*Math.PI/180;for(let i=0;i<=140;i++)pts.push({x:100+i*30*Math.cos(a),y:200+i*30*Math.sin(a)});return pts;};
async function page(kind,cfg){
  const o=kind==='desktop'?{viewport:{width:1280,height:800}}:kind==='phone'?{viewport:{width:390,height:800},isMobile:true,hasTouch:true}:{viewport:{width:820,height:1180},isMobile:true,hasTouch:true};
  const c=await b.newContext(o);const p=await c.newPage();seeded(p,cfg);const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);return {p,c,errs};
}
const S=p=>p.evaluate(()=>__wsl());
const setTune=async(p,v)=>{await p.click('#btnSettings');await p.evaluate(v=>{const e=document.getElementById('momentumTune');e.value=v;e.dispatchEvent(new Event('input'));},v);await p.click('#closeSettings');await p.waitForTimeout(100);};
async function regain(p){ // seconds to go 100 -> 500 px/s on a 30 degree slope, and speed left after 2.5 s on a flat track
  await p.evaluate(pts=>{__wslLoad(pts);},slope(30));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/40)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(50);
  await p.evaluate(()=>__wslSetV(100));const t0=Date.now();let t500;
  while(Date.now()-t0<14000){await p.waitForTimeout(100);const s=await S(p);if(s.state!==1)break;if(s.cart.v>=500){t500=(Date.now()-t0)/1000;break;}}
  await p.evaluate(pts=>{__wslLoad(pts);},slope(0));await p.waitForTimeout(900);
  await p.evaluate(()=>{const s=__wsl();const m=s.pts[Math.floor(s.pts.length/40)];const q=__scr(m.x,m.y);return __tap(q.x,q.y);});await p.waitForTimeout(50);
  await p.evaluate(()=>__wslSetV(700));await p.waitForTimeout(2500);const flat=(await S(p)).cart.v;
  return {t500,flat};
}
// ---- the slider and how strongly it changes the feel (desktop)
{
  const {p,c,errs}=await page('desktop',{mode:'regular'});
  await p.click('#btnSettings');
  const sl=await p.evaluate(()=>{const e=document.getElementById('momentumTune');return e?{min:e.min,max:e.max,val:e.value}:null;});
  ok('Momentum fine-tune slider exists (0-100, default 50)',!!sl&&sl.min==='0'&&sl.max==='100'&&sl.val==='50',sl);
  ok('slider names the device profile',/Desktop/i.test(await p.evaluate(()=>(document.getElementById('tuneProfile')||{}).textContent||'')),await p.evaluate(()=>(document.getElementById('tuneProfile')||{}).textContent));
  await p.click('#closeSettings');
  const r={};
  for(const v of [0,50,100]){await setTune(p,v);r[v]=await regain(p);console.log('  tune',v,JSON.stringify({t500:r[v].t500,flat:Math.round(r[v].flat)}));}
  ok('default (50) feels as before: 100 -> 500 px/s in 2.4-3.3 s',r[50].t500>=2.4&&r[50].t500<=3.3,r[50].t500);
  ok('lower setting = momentum builds slower',(r[0].t500||99)>r[50].t500+0.8,{t0:r[0].t500,t50:r[50].t500});
  ok('higher setting = momentum builds faster',(r[100].t500||99)<r[50].t500-0.5,{t100:r[100].t500,t50:r[50].t500});
  ok('higher setting = holds speed longer on the flat',r[100].flat>r[50].flat+25&&r[50].flat>r[0].flat+25,{f0:Math.round(r[0].flat),f50:Math.round(r[50].flat),f100:Math.round(r[100].flat)});
  ok('no page errors (desktop)',errs.length===0,errs.slice(0,2));
  await c.close();
}
// ---- per device and orientation
{
  const {p,c,errs}=await page('phone',{mode:'regular'});
  let s=await S(p);ok('phone portrait profile',s.profile==='phone-portrait'&&s.tune===50,{p:s.profile,t:s.tune});
  await setTune(p,80);s=await S(p);ok('phone portrait saved 80',s.tune===80,s.tune);
  await p.setViewportSize({width:844,height:390});await p.waitForTimeout(700);s=await S(p);
  ok('rotating to landscape switches to its own profile (default 50, portrait value untouched)',s.profile==='phone-landscape'&&s.tune===50,{p:s.profile,t:s.tune});
  await p.click('#btnSettings');
  ok('slider shows landscape value and label',(await p.evaluate(()=>[document.getElementById('momentumTune').value,document.getElementById('tuneProfile').textContent]))[0]==='50'&&/landscape/i.test(await p.evaluate(()=>document.getElementById('tuneProfile').textContent)));
  await p.click('#closeSettings');
  await setTune(p,20);s=await S(p);ok('landscape saved 20',s.tune===20,s.tune);
  await p.setViewportSize({width:390,height:800});await p.waitForTimeout(700);s=await S(p);
  ok('back to portrait restores 80',s.profile==='phone-portrait'&&s.tune===80,{p:s.profile,t:s.tune});
  await p.reload();await p.waitForTimeout(500);s=await S(p);
  ok('settings persist after reload',s.tune===80&&JSON.stringify(s.tunes)&&s.tunes['phone-landscape']===20,s.tunes);
  await p.click('#btnSettings');await p.click('#tuneReset');await p.click('#closeSettings');await p.waitForTimeout(100);s=await S(p);
  ok('Reset puts this profile back to 50',s.tune===50&&s.tunes['phone-landscape']===20,{t:s.tune,all:s.tunes});
  ok('no page errors (phone)',errs.length===0,errs.slice(0,2));
  await c.close();
}
{
  const {p,c,errs}=await page('tablet',{mode:'regular'});const s=await S(p);
  ok('tablet is its own profile',s.profile==='tablet-portrait',s.profile);
  const d=await page('desktop',{mode:'regular',tune:{'phone-portrait':90}});const sd=await S(d.p);
  ok('a phone setting does not leak to desktop',sd.profile==='desktop-landscape'&&sd.tune===50,{p:sd.profile,t:sd.tune});
  await c.close();await d.c.close();
}
await b.close();done();
