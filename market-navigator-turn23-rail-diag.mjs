import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});
for(const [width,height] of [[1280,800],[768,900],[412,915]]){
 const p=await browser.newPage({viewport:{width,height}});
 await p.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>String(s)};"}));
 await p.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
 await p.goto('http://127.0.0.1:8123/market-navigator-turn23-pre-ship.html',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('#legend [data-id="growth"]'));
 const g=()=>p.evaluate(()=>{const sel=x=>{let r=document.querySelector(x).getBoundingClientRect(),cs=getComputedStyle(document.querySelector(x));return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom,display:cs.display,position:cs.position,flex:cs.flex,widthCss:cs.width}};return{iw:innerWidth,app:sel('.app'),rail:sel('#rail'),shell:sel('#shell'),main:sel('.main'),view:sel('#view-now'),pad:sel('.pad.now'),card:sel('.chartCard'),wrap:sel('#nowWrap'),canvas:sel('#nowChart'),railClass:document.querySelector('#rail').className}});
 let a=await g();await p.locator('#toggle').click();await p.waitForTimeout(350);let b=await g();console.log('RAIL_DIAG',JSON.stringify({width,height,open:a,closed:b}));await p.close();
}
await browser.close();
