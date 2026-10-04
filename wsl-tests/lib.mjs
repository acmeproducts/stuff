import {createRequire} from 'module';import {execSync} from 'child_process';
export const r=createRequire(execSync('npm root -g').toString().trim()+'/');
export const pw=r('playwright');
export const launch=()=>pw.chromium.launch({executablePath:process.env.CHROMIUM||'/opt/pw-browsers/chromium'});
export const VIEWPORTS=[{n:'phone',w:390,h:800},{n:'desktop',w:1280,h:800}];
export const HELPERS=()=>{
  window.__ptr=(type,id,x,y)=>document.getElementById('game').dispatchEvent(new PointerEvent(type,{pointerId:id,clientX:x,clientY:y,bubbles:true,cancelable:true,isPrimary:id===1,pointerType:'touch'}));
  window.__sleep=ms=>new Promise(r=>setTimeout(r,ms));
  window.__scr=(wx,wy)=>{const s=window.__wsl();return{x:(wx-s.camX)*s.zoom,y:(wy-s.camY)*s.zoom};};
  window.__drag=async(x0,y0,x1,y1,steps,ms)=>{__ptr('pointerdown',1,x0,y0);for(let i=1;i<=steps;i++){await __sleep(ms/steps);__ptr('pointermove',1,x0+(x1-x0)*i/steps,y0+(y1-y0)*i/steps);}__ptr('pointerup',1,x1,y1);};
  window.__tap=async(x,y)=>{__ptr('pointerdown',1,x,y);await __sleep(60);__ptr('pointerup',1,x,y);};
  window.__hold=async(x,y,ms)=>{__ptr('pointerdown',1,x,y);await __sleep(ms);__ptr('pointerup',1,x,y);};
  window.__pinch=async(d0,d1,cx,cy)=>{__ptr('pointerdown',1,cx-d0/2,cy);__ptr('pointerdown',2,cx+d0/2,cy);for(let i=1;i<=10;i++){await __sleep(16);const d=d0+(d1-d0)*i/10;__ptr('pointermove',1,cx-d/2,cy);__ptr('pointermove',2,cx+d/2,cy);}__ptr('pointerup',2,cx+d1/2,cy);__ptr('pointerup',1,cx-d1/2,cy);};
  window.__swipe2=async(dx,ms,cx=200,cy=300)=>{__ptr('pointerdown',1,cx-30,cy);__ptr('pointerdown',2,cx+30,cy);const n=6;for(let i=1;i<=n;i++){await __sleep(ms/n);__ptr('pointermove',1,cx-30+dx*i/n,cy);__ptr('pointermove',2,cx+30+dx*i/n,cy);}__ptr('pointerup',2,cx+30+dx,cy);__ptr('pointerup',1,cx-30+dx,cy);};
  window.__release=async()=>{const s=window.__wsl();const m=s.pts[Math.floor(s.pts.length/2)];const q=__scr(m.x,m.y);await __tap(q.x,q.y);};
};
export async function fresh(p,release=true){await p.reload();await p.waitForTimeout(400);await p.evaluate(HELPERS);if(release){await p.evaluate(()=>__release());await p.waitForTimeout(120);}}
export function reporter(){let fails=0;return{ok(n,c,x){console.log((c?'PASS ':'FAIL ')+n+(x!==undefined?'  '+JSON.stringify(x):''));if(!c)fails++;},done(){console.log(fails?`\n${fails} FAILED`:'\nALL PASSED');process.exit(fails?1:0);}};}
