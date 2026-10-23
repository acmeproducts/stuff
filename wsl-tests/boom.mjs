// Explosion costs a rescue, pauses with a message, OK restarts. Usage: node wsl-tests/boom.mjs [file]
import {launch,VIEWPORTS,HELPERS,reporter,seeded} from './lib.mjs';
const file=process.argv[2]||'wsl.html';const url='file://'+process.cwd()+'/'+file;
const {ok,done}=reporter();const b=await launch();
const vis=(p,sel)=>p.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>0;},sel);
async function drop(p){ // ride off the end of the track and fall without catching
  await p.evaluate(()=>__release());
  for(let i=0;i<260;i++){const s=await p.evaluate(()=>__wsl());if(s.boomDlg||s.state===4)return s;await p.waitForTimeout(30);}
  return p.evaluate(()=>__wsl());
}
for(const vp of VIEWPORTS){
  console.log('--- '+vp.n);
  const p=await b.newPage({viewport:{width:vp.w,height:vp.h}});seeded(p,{mode:'regular'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  const S=()=>p.evaluate(()=>__wsl());
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight*0.7,10,300);});
  await p.evaluate(()=>__wslSetScore(450));
  let s=await drop(p);
  ok('explosion pauses the game with a message',s.boomDlg===true&&s.paused===true&&await vis(p,'#boomDlg'),{dlg:s.boomDlg,paused:s.paused});
  const msg=await p.evaluate(()=>document.getElementById('boomDlg').innerText);
  ok('message says a rescue was lost and how many are left',/rescue/i.test(msg)&&/2/.test(msg),msg.replace(/\n/g,' | '));
  ok('a rescue charge was spent (3 -> 2)',s.charges===2,s.charges);
  const a=await S();await p.waitForTimeout(700);const c=await S();
  ok('nothing moves while the message is up',a.state===c.state&&a.timer===c.timer&&a.cart.x===c.cart.x,{a:a.state,c:c.state});
  await p.click('#boomOk');await p.waitForTimeout(250);s=await S();
  ok('OK restarts: cart is back on the track, ready to ride again (not game over)',!s.boomDlg&&s.state===0&&s.charges===2,{st:s.state,dlg:s.boomDlg,ch:s.charges});
  ok('score is kept',s.score===450,s.score);
  await p.evaluate(()=>__release());await p.waitForTimeout(300);s=await S();
  ok('and it rides again after the restart',s.state===1||s.state===2,s.state);
  s=await drop(p);ok('second explosion: 2 -> 1',s.boomDlg&&s.charges===1,s.charges);await p.click('#boomOk');await p.waitForTimeout(200);
  s=await drop(p);ok('third explosion: 1 -> 0 (still restarts)',s.boomDlg&&s.charges===0&&/rescue/i.test(await p.evaluate(()=>document.getElementById('boomDlg').innerText)),s.charges);
  await p.click('#boomOk');await p.waitForTimeout(200);s=await S();ok('still in the run after the third',s.state===0,s.state);
  s=await drop(p);
  const msg4=await p.evaluate(()=>document.getElementById('boomDlg').innerText);
  ok('with no rescues left the message says the run is over',s.boomDlg&&/no rescue|run is over|over/i.test(msg4),msg4.replace(/\n/g,' | '));
  await p.click('#boomOk');await p.waitForTimeout(300);s=await S();
  ok('OK then shows the game-over screen',s.state===4,s.state);
  ok('no page errors',errs.length===0,errs.slice(0,2));
  await p.close();
}
{ // Zen: no explosion dialog
  const p=await b.newPage({viewport:{width:390,height:800}});seeded(p,{mode:'zen'});await p.goto(url);await p.waitForTimeout(500);await p.evaluate(HELPERS);
  await p.evaluate(()=>{const s=__wsl();const e=s.pts[s.pts.length-1];const q=__scr(e.x,e.y);return __drag(q.x,q.y,q.x+30,innerHeight*0.7,10,300);});await p.evaluate(()=>__release());
  let dlg=false;for(let i=0;i<120;i++){if((await p.evaluate(()=>__wsl())).boomDlg)dlg=true;await p.waitForTimeout(40);}
  ok('Zen never shows the explosion message',!dlg,dlg);await p.close();
}
await b.close();done();
