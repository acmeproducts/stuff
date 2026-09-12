import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const {chromium}=require('playwright');
const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:412,height:915}});
await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
await page.goto('http://127.0.0.1:8123/market-navigator-turn19-pre-ship.html',{waitUntil:'networkidle'});
if(!(await page.locator('#rail').evaluate(el=>el.classList.contains('closed'))))await page.locator('#toggle').click();
await page.waitForTimeout(250);
async function snap(label){let o=await page.evaluate(()=>{function b(s){let e=document.querySelector(s);if(!e)return null;let r=e.getBoundingClientRect(),c=getComputedStyle(e);return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth,minWidth:c.minWidth,maxWidth:c.maxWidth,overflow:c.overflow,position:c.position}}return{innerWidth,docScroll:document.documentElement.scrollWidth,bodyScroll:document.body.scrollWidth,rail:b('#rail'),shell:b('#shell'),view:b('#view-now'),pad:b('#view-now .pad.now'),card:b('#view-now .chartCard'),row:b('#nowChrome'),crumb:b('#nowCrumb'),hz:b('#hzs'),right:b('#nowChrome .chromeRight'),more:b('#nowMoreBtn')}});console.log(label,JSON.stringify(o))}
await snap('PHONE_ENV');
await page.locator('#legend [data-id="risk"]').click();await page.waitForFunction(()=>document.querySelector('#legend [data-id="hyg"]'));await page.waitForTimeout(50);await snap('PHONE_INDEX');
await browser.close();
