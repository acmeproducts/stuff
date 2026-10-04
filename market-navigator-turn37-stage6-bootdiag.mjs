import{createRequire}from'node:module';const{chromium}=createRequire(import.meta.url)('playwright');
const b=await chromium.launch({headless:true}),c=await b.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),events=[];
p.on('pageerror',e=>events.push('pageerror: '+e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))events.push('console '+m.type()+': '+m.text())});
await p.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({body:"window.marked={parse:s=>s}"}));await p.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({body:'window.DOMPurify={sanitize:s=>s}'}));
await p.goto('http://127.0.0.1:8123/market-navigator-turn37-stage6.html',{waitUntil:'domcontentloaded'});await p.waitForTimeout(2500);
const state=await p.evaluate(()=>({ship:!!window.__mnShip25,ready:window.__mnShip25?.ready?.(),stage6:!!window.__mn37Stage6,s6ready:window.__mn37Stage6?.ready?.(),text:document.body.innerText.slice(0,300)})).catch(e=>({evalError:e.message}));
console.log(JSON.stringify({events,state},null,2));await c.close();await b.close();if(!state.ready)process.exit(2);