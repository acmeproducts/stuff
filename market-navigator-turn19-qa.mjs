import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const url=process.env.MARKET_NAVIGATOR_URL||'http://127.0.0.1:8123/market-navigator-turn19-pre-ship.html';
const browser=await chromium.launch({headless:true});

async function makePage(width,height){
  const page=await browser.newPage({viewport:{width,height}}),errors=[],failed=[];
  await page.addInitScript(()=>{class U{constructor(text){this.text=String(text);this.rate=1}};Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});Object.defineProperty(window,'speechSynthesis',{value:{speak(){},cancel(){},pause(){},resume(){}},configurable:true})});
  page.on('pageerror',e=>errors.push(`page: ${e.message}`));
  page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
  page.on('response',r=>{if(r.status()>=400&&!/favicon/.test(r.url()))failed.push(`${r.status()} ${r.url()}`)});
  await page.route('https://cdn.jsdelivr.net/npm/marked/marked.min.js',r=>r.fulfill({contentType:'application/javascript',body:"window.marked={parse:s=>'<div>'+String(s)+'</div>'};"}));
  await page.route('https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js',r=>r.fulfill({contentType:'application/javascript',body:'window.DOMPurify={sanitize:s=>s};'}));
  await page.goto(url,{waitUntil:'networkidle'});
  return {page,errors,failed};
}

async function chromeGeometry(page,root='#nowChrome',center='#hzs',more='#nowMoreBtn'){
  const row=await page.locator(root).boundingBox(),mid=await page.locator(center).boundingBox(),btn=await page.locator(more).boundingBox();
  assert(row&&mid&&btn,'chrome geometry must exist');
  const rc=row.x+row.width/2,mc=mid.x+mid.width/2;
  assert(Math.abs(rc-mc)<3,`horizons must stay centered: row ${rc} vs controls ${mc}`);
  assert(btn.x>=row.x-1&&btn.x+btn.width<=row.x+row.width+1,'More button must remain inside top strip');
  return {row,mid,btn};
}
async function longPress(page,locator){const box=await locator.boundingBox();assert(box,'long-press target');await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.waitForTimeout(620);await page.mouse.up();await page.waitForTimeout(100)}

try{
  // DESKTOP contract.
  const d=await makePage(1440,900),page=d.page;
  assert.equal(await page.locator('#nowChart').count(),1,'chart boot');
  assert.equal((await page.locator('#nowCrumb').innerText()).trim(),'ENV','visible root token');
  assert(!/ENVIRONMENT/.test(await page.locator('#nowCrumb').innerText()),'old visible root token must not survive');
  await chromeGeometry(page);
  assert.equal(await page.locator('#legend [data-id]').count(),3,'ENV has exactly three index chips');

  // Legend chip drills down; plotted-series inspection remains a separate action.
  await page.locator('#legend [data-id="risk"]').click();
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="hyg"]'));
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / RSK');
  await chromeGeometry(page);
  assert.equal(await page.locator('#info').isVisible(),false,'ordinary INDEX entry must not auto-open info');

  // Long press opens compact information only; it does not drill.
  await longPress(page,page.locator('#legend [data-id="hyg"]'));
  await page.locator('#info').waitFor({state:'visible'});
  assert.equal(await page.locator('#analysisModal').isVisible(),false,'long press must not drill');
  const card=await page.locator('#info').evaluate(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return{w:r.width,h:r.height,right:innerWidth-r.right,top:r.top,bg:c.backgroundColor,color:c.color}});
  assert(card.w<=270&&card.h<=205,'information popover must stay compact');
  assert(card.right<30&&card.top<180,'information popover must be top-right');
  assert.match(card.bg,/rgb\(255, 255, 255\)/,'information popover white background');
  assert.match(await page.locator('#info').innerText(),/Purpose[\s\S]*Usage[\s\S]*Unit[\s\S]*Cadence[\s\S]*Health/i);
  assert.equal(await page.locator('#info [data-info-open]').count(),1);
  assert.equal(await page.locator('#info [data-info-prev]').count(),1);
  assert.equal(await page.locator('#info [data-info-next]').count(),1);
  assert.equal(await page.locator('#info').getByText('More info',{exact:true}).count(),0,'old More info gate removed');
  const before=await page.locator('#legend .lg.active').getAttribute('data-id');
  if(!(await page.locator('#info [data-info-next]').isDisabled())){
    await page.locator('#info [data-info-next]').click();await page.waitForTimeout(120);
    const after=await page.locator('#legend .lg.active').getAttribute('data-id');
    assert(after&&after!==before,'info arrows change active reference without drilling');
    assert.equal(await page.locator('#analysisModal').isVisible(),false);
  }
  await page.locator('#info [data-info-close]').click();

  // Normal component chip tap drills directly to standalone COMPONENT with no card gate.
  await page.locator('#legend [data-id="hyg"]').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.match((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' '),/^ENV \/ RSK \/ HYG/);
  assert.equal(await page.locator('#seriesBar [data-id="hyg"]').count(),1);
  assert.equal(await page.locator('#seriesAbout').isVisible(),false,'component does not auto-open series info');
  await chromeGeometry(page,'#analysisModal .chartChromeRow','#analysisHz','#moreBtn');

  // Crosshair is immediate, full-resolution, pinned on leave, and explicitly dismissible.
  const ab=await page.locator('#analysisChart').boundingBox();assert(ab);
  await page.mouse.move(ab.x+ab.width*.55,ab.y+ab.height*.52);await page.waitForTimeout(100);
  assert.equal(await page.locator('#analysisTip').isVisible(),true,'hover inspection must not require another click');
  await page.mouse.move(ab.x+10,ab.y-20);await page.waitForTimeout(80);
  assert.equal(await page.locator('#analysisTip').isVisible(),true,'inspection must stay pinned after leaving plot');
  assert.equal(await page.locator('#analysisTip [data-tip-close]').count(),1,'pinned inspection has explicit close');
  await page.locator('#analysisTip [data-tip-close]').click();
  assert.equal(await page.locator('#analysisTip').isVisible(),false,'inspection close works');

  // Bottom level chip behavior: add comparison, then tapping chip only changes active/reference.
  await page.locator('#addSeries').click();
  await page.locator('#pickerSearch').fill('QQQ');
  await page.waitForFunction(()=>document.querySelector('#pickerList [data-add="qqq"]'));
  await page.locator('#pickerList [data-add="qqq"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('#seriesBar [data-id]').length===2);
  const crumbBefore=(await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim();
  assert.match(crumbBefore,/ENV \/ RSK \/ HYG \+ 1 Component/);
  await page.locator('#seriesBar [data-id="qqq"]').click();await page.waitForTimeout(100);
  assert.equal(await page.locator('#analysisModal').isVisible(),true,'bottom-level chip must not create deeper navigation');
  assert.equal(await page.locator('#analysisChart').getAttribute('data-active-series'),'qqq','bottom-level chip changes active reference');
  assert.equal((await page.locator('#analysisCrumb').innerText()).replace(/\s+/g,' ').trim(),crumbBefore,'bottom-level chip does not replace root breadcrumb');
  await longPress(page,page.locator('#seriesBar [data-id="qqq"]'));
  await page.locator('#seriesAbout').waitFor({state:'visible'});
  assert.equal(await page.locator('#analysisModal').isVisible(),true,'bottom-level long press stays in COMPONENT');
  assert.match(await page.locator('#seriesAbout').innerText(),/Purpose[\s\S]*Health/i);
  await page.locator('#seriesAbout [data-info-close]').click();

  // Breadcrumb is drill-up.
  await page.locator('#crumbComponentIndex').click();await page.waitForTimeout(120);
  assert.equal(await page.locator('#analysisModal').isVisible(),false);
  assert.equal((await page.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / RSK');

  // INDEX's own chip also drills to a truthful standalone derived-index chart.
  await page.locator('#legend [data-id="risk"]').click();
  await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.equal(await page.locator('#seriesBar [data-id="risk"]').count(),1,'derived index standalone root');
  assert((+(await page.locator('#analysisChart').getAttribute('data-source-points')))>0,'derived standalone chart has observations');
  assert.equal(await page.locator('#analysisRepresentation').inputValue(),'indexed','derived index standalone remains Indexed 100');
  assert.equal(await page.locator('#analysisRepresentation option[value="native"]').isDisabled(),true,'derived index must not be mislabeled native');
  await page.locator('#crumbComponentEnvironment').click();
  await page.waitForFunction(()=>document.querySelector('#nowCrumb')?.textContent.trim()==='ENV');

  // Turn 18 display-density truth remains protected.
  async function horizon(h,density){await page.locator(`#hzs [data-h="${h}"]`).click();await page.waitForFunction(([want,den])=>{let c=document.querySelector('#nowChart');return document.querySelector(`#hzs [data-h="${want}"]`)?.classList.contains('on')&&c?.dataset.renderDensity===den&&+c.dataset.sourcePoints>0},[h,density]);return page.locator('#nowChart').evaluate(c=>({source:+c.dataset.sourcePoints,rendered:+c.dataset.renderedPoints,density:c.dataset.renderDensity}))}
  let q=await horizon('1YR','weekly');assert(q.rendered<q.source&&q.rendered>0,'1YR weekly display reduction');
  q=await horizon('3YR','monthly');assert(q.rendered<q.source&&q.rendered>0,'3YR monthly display reduction');

  // Data/correlation remains complete and canonical.
  await page.locator('#nowMoreBtn').click();await page.locator('#nowData').click();await page.locator('#dataModal').waitFor({state:'visible'});
  assert.deepEqual((await page.locator('#dataModal th').allTextContents()).map(x=>x.trim()),['Series','Date','Native','Index 100','Correlation']);
  assert((await page.locator('#dataRows tr').count())>20,'Data rows preserved beyond rendered monthly density');
  await page.locator('#dataClose').click();

  // WTI remains directly available and now drills directly from Growth INDEX.
  await page.locator('#crumbEnvironment').click().catch(()=>{});
  if(!(await page.locator('#legend [data-id="growth"]').count())){await page.locator('#crumbComponentEnvironment').click().catch(()=>{})}
  await page.locator('#legend [data-id="growth"]').click();
  await page.waitForFunction(()=>document.querySelector('#legend [data-id="wti"]'));
  assert.equal(await page.locator('#legend [data-id="wti"]').isDisabled(),false,'WTI direct availability');
  await page.locator('#legend [data-id="wti"]').click();await page.locator('#analysisModal').waitFor({state:'visible'});
  assert.equal(await page.locator('#seriesBar [data-id="wti"]').count(),1,'WTI direct COMPONENT entry');
  await page.locator('#crumbComponentEnvironment').click();

  // Periodic GDP remains available in Explore.
  await page.locator('[data-view="explore"]').click();await page.locator('[data-cat="Other"]').click();await page.locator('#exploreSearch').fill('GDP');
  await page.waitForFunction(()=>document.querySelector('#exploreList')?.textContent.includes('GDP q/q'));
  assert.equal(await page.locator('#exploreList [data-id="gdpQoq"]').getAttribute('aria-disabled'),'false');
  assert.deepEqual(d.errors,[],'desktop browser errors');
  assert.deepEqual(d.failed,[],'desktop failed resources');
  await page.close();

  // PHONE: top-strip geometry remains reachable at ENV, INDEX and COMPONENT.
  const p=await makePage(412,915),phone=p.page;
  if(!(await phone.locator('#rail').evaluate(el=>el.classList.contains('closed'))))await phone.locator('#toggle').click();
  await chromeGeometry(phone);
  assert.equal((await phone.locator('#nowCrumb').innerText()).trim(),'ENV');
  await phone.locator('#legend [data-id="risk"]').click();await phone.waitForFunction(()=>document.querySelector('#legend [data-id="hyg"]'));
  const g=await chromeGeometry(phone);
  assert(g.btn.x+g.btn.width<=412,'phone More remains visible');
  assert.equal((await phone.locator('#nowCrumb').innerText()).replace(/\s+/g,' ').trim(),'ENV / RSK');
  await phone.locator('#legend [data-id="hyg"]').click();await phone.locator('#analysisModal').waitFor({state:'visible'});
  await chromeGeometry(phone,'#analysisModal .chartChromeRow','#analysisHz','#moreBtn');
  const cr=await phone.locator('#analysisCrumb').boundingBox(),hz=await phone.locator('#analysisHz').boundingBox(),more=await phone.locator('#moreBtn').boundingBox();
  assert(cr&&hz&&more&&cr.x+cr.width<=hz.x+2,'phone breadcrumb is constrained before centered horizons');
  assert(more.x+more.width<=412,'phone component More remains reachable');
  assert.match((await phone.locator('#analysisCrumb').innerText()).replace(/\s+/g,' '),/^ENV \/ RSK \/ HYG/);
  assert.deepEqual(p.errors,[],'phone browser errors');
  assert.deepEqual(p.failed,[],'phone failed resources');
  await phone.close();

  console.log('TURN 19 DESKTOP + PHONE INTERACTION QA: PASS');
} finally {await browser.close()}
