/* Browser regression tests for the actual lab HTML. Network services are stubbed.
 * Run: npm --prefix tests/chat-keyboard install && npm --prefix tests/chat-keyboard test
 * CHAT_BROWSER_CHANNEL=msedge uses an installed Edge instead of bundled Chromium.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(root, 'chat-lab.html'), 'utf8');
const production = fs.readFileSync(path.join(root, 'chat.html'), 'utf8');
const block = s => s.slice(s.indexOf('/* ######## pipeline + switch ######## */'), s.indexOf('/* ######## config/bubbles/send ######## */'));
assert.ok(block(html).length > 10000);
assert.equal(block(html), block(production), 'Speech and ownership block must match production');
const dictionary = ['water', 'watter', 'waterer', 'wait', 'waiting', 'tomorrow', 'time', 'timely', 'thanks', ...Array.from({length:100}, (_, i) => 'fixture' + i)];
const tests = [];
function test(name, run) { tests.push({name, run}); }
async function type(page, side, text) {
  await page.evaluate(({side, text}) => { for (const key of text) window.press(side, key); }, {side, text});
}
async function draft(page, side) { return page.locator('#in-' + side).inputValue(); }
async function swipe(page, side) {
  await page.waitForTimeout(220); // wait for the existing keyboard-open transition
  return page.evaluate(side => {
    const rects = window.keyRectsFor(side);
    const points = [...'water'].map(k => rects.find(r => r.k === k)).map(r => ({x:r.cx,y:r.cy}));
    window.swype.pts = window.swResample(points,48);
    window.swype.letters = [...'water'];
    window.resolveSwype(side);
    return {value:document.getElementById('in-'+side).value, alternatives:window.cands[side].slice()};
  }, side);
}
for (const side of ['south','north']) {
  test(side + ': swipe alternative replaces instead of appending', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'), side);
    const result = await swipe(page,side);
    assert.ok(result.alternatives.length, 'Fixture must produce a real alternative');
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    assert.equal(await draft(page,side), result.alternatives[0]+' ');
  });
  test(side + ': correction Undo restores the recognized word', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'), side);
    const result = await swipe(page,side);
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    if(process.env.CHAT_SCREENSHOT_DIR){
      fs.mkdirSync(process.env.CHAT_SCREENSHOT_DIR,{recursive:true});
      await page.screenshot({path:path.join(process.env.CHAT_SCREENSHOT_DIR,side+'-correction.png')});
    }
    await page.locator('#kb-'+side+' [data-undo]').click({timeout:1500});
    assert.equal(await draft(page,side),result.value);
  });
  test(side + ': stale completion cannot follow cursor movement', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'), side);
    await type(page,side,'tom');
    await page.evaluate(side => {
      const input=document.getElementById('in-'+side);
      input.setSelectionRange(0,0);
      window.pickCand(side,0);
    },side);
    assert.equal(await draft(page,side),'tom');
  });
  test(side + ': Clear removes candidates and composition', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'), side);
    await type(page,side,'tom');
    await page.locator('#strip-'+side+' .clearbtn').click();
    await page.evaluate(side => window.pickCand(side,0),side);
    assert.equal(await draft(page,side),'');
    assert.equal(await page.evaluate(side=>window.cands[side].length,side),0);
  });
  test(side + ': Korean Send commits once without resurrecting draft', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'),side);
    await type(page,side,'ㄱㅏ');
    assert.equal(await draft(page,side),'가');
    await page.locator('#strip-'+side+' .sendbtn').click();
    await page.waitForFunction(()=>window.HIST.length===1);
    assert.equal(await page.evaluate(()=>window.HIST[0].text),'가');
    assert.equal(await draft(page,side),'');
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await type(page,side,'ㄴㅏ');
    assert.equal(await draft(page,side),'나');
  });
  test(side + ': Korean Clear begins a fresh composition', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'),side);
    await type(page,side,'ㄱㅏ');
    await page.locator('#strip-'+side+' .clearbtn').click();
    await type(page,side,'ㄴㅏ');
    assert.equal(await draft(page,side),'나');
  });
  test(side + ': native selection during composition does not rewrite other text', async page => {
    await page.evaluate(side => window.requestInput(side,'kb'),side);
    await type(page,side,'ㄱㅏ');
    await page.evaluate(side => {document.getElementById('in-'+side).setSelectionRange(0,0);window.press(side,'CLOSE');},side);
    assert.equal(await draft(page,side),'가');
  });
  test(side + ': native Enter uses the same send finalization', async page => {
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await type(page,side,'ㄱㅏ');
    await page.locator('#in-'+side).press('Enter');
    await page.waitForFunction(()=>window.HIST.length===1);
    assert.equal(await draft(page,side),'');
    assert.equal(await page.evaluate(()=>window.HIST[0].text),'가');
  });
  test(side + ': completion in a sentence preserves surrounding text',async page=>{
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await page.locator('#in-'+side).fill('bring tom now');
    await page.evaluate(side=>{document.getElementById('in-'+side).setSelectionRange(9,9);window.updateAutocomplete(side);},side);
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    assert.equal(await draft(page,side),'bring tomorrow now');
  });
  test(side + ': swipe replaces selected text and keeps its neighbors',async page=>{
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await page.locator('#in-'+side).fill('bring tea now');
    await page.evaluate(side=>document.getElementById('in-'+side).setSelectionRange(6,9),side);
    const result=await swipe(page,side);
    assert.equal(result.value,'bring water now');
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    assert.equal(await draft(page,side),'bring '+result.alternatives[0]+' now');
  });
  test(side + ': Space accepts a swipe without doubling its separator',async page=>{
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    const result=await swipe(page,side);
    await type(page,side,' ');
    assert.equal(await draft(page,side),result.value);
    assert.equal(await page.evaluate(side=>window.cands[side].length,side),0);
  });
  test(side + ': detached candidate and undo controls cannot edit a later draft',async page=>{
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await type(page,side,'tom');
    await page.evaluate(side=>{window.oldCandidate=document.querySelector('#kb-'+side+' .kcand');},side);
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    await page.evaluate(side=>{window.oldUndo=document.querySelector('#kb-'+side+' [data-undo]');},side);
    await type(page,side,'ti');
    await page.evaluate(()=>{window.oldCandidate.click();window.oldUndo.click();});
    assert.equal(await draft(page,side),'tomorrow ti');
  });
  test(side + ': Japanese candidate selection commits only the composition',async page=>{
    await page.route('https://inputtools.google.com/**',route=>route.fulfill({json:['SUCCESS',[['かな',['仮名']]]]}));
    await page.evaluate(side=>window.requestInput(side,'kb'),side);
    await type(page,side,'kana ');
    await page.waitForFunction(side=>window.cands[side][0]==='仮名',side);
    await page.locator('#kb-'+side+' .kcand[data-i="0"]').click();
    assert.equal(await draft(page,side),'仮名');
    await page.locator('#strip-'+side+' .sendbtn').click();
    await page.waitForFunction(()=>window.HIST.length===1);
    assert.equal(await page.evaluate(()=>window.HIST[0].text),'仮名');
    assert.equal(await draft(page,side),'');
  });
}
test('handoff preserves both drafts and isolates candidates',async page=>{
  await page.evaluate(()=>window.requestInput('south','kb'));
  await type(page,'south','tom');
  await page.evaluate(()=>{window.requestInput('north','kb');window.resolveAsk(false);});
  assert.equal(await page.evaluate(()=>window.INPUT.owner),'south');
  assert.equal(await draft(page,'south'),'tom');
  await page.evaluate(()=>{window.requestInput('north','kb');window.resolveAsk(true);});
  await type(page,'north','time');
  await page.evaluate(()=>window.pickCand('south',0));
  assert.equal(await draft(page,'south'),'tom');
  assert.equal(await draft(page,'north'),'time');
});
test('late Japanese conversion after Clear is ignored',async page=>{
  let release;
  const arrived=new Promise(resolve=>{release=resolve;});
  let finish;
  const held=new Promise(resolve=>{finish=resolve;});
  await page.route('https://inputtools.google.com/**',async route=>{
    release();await held;
    await route.fulfill({json:['SUCCESS',[['かな',['仮名']]]]});
  });
  await page.evaluate(()=>window.requestInput('south','kb'));
  await type(page,'south','kana ');
  await arrived;
  await page.locator('#strip-south .clearbtn').click();
  finish();
  await page.waitForTimeout(100);
  assert.equal(await draft(page,'south'),'');
  assert.equal(await page.evaluate(()=>window.cands.south.length),0);
});
test('late Japanese conversion after Send is ignored',async page=>{
  let release,finish;
  const arrived=new Promise(resolve=>{release=resolve;});
  const held=new Promise(resolve=>{finish=resolve;});
  await page.route('https://inputtools.google.com/**',async route=>{release();await held;await route.fulfill({json:['SUCCESS',[['かな',['仮名']]]]});});
  await page.evaluate(()=>window.requestInput('south','kb'));
  await type(page,'south','kana ');await arrived;
  await page.locator('#strip-south .sendbtn').click();finish();
  await page.waitForFunction(()=>window.HIST.length===1);
  await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.HIST[0].text),'かな');
  assert.equal(await draft(page,'south'),'');
  assert.equal(await page.evaluate(()=>window.cands.south.length),0);
});
test('older Japanese conversion cannot overwrite a newer result',async page=>{
  let release,finish;
  const arrived=new Promise(resolve=>{release=resolve;});
  const held=new Promise(resolve=>{finish=resolve;});
  let requests=0;
  await page.route('https://inputtools.google.com/**',async route=>{
    if(++requests===1){release();await held;return route.fulfill({json:['SUCCESS',[['かな',['OLD']]]]});}
    return route.fulfill({json:['SUCCESS',[['かなな',['NEW']]]]});
  });
  await page.evaluate(()=>window.requestInput('south','kb'));
  await type(page,'south','kana ');await arrived;
  await type(page,'south','na ');
  await page.waitForFunction(()=>window.cands.south[0]==='NEW');
  finish();await page.waitForTimeout(100);
  assert.equal(await page.evaluate(()=>window.cands.south[0]),'NEW');
});
test('reopening keyboard does not multiply candidate handlers',async page=>{
  await page.evaluate(()=>{for(let i=0;i<5;i++){window.requestInput('south','kb');window.press('south','CLOSE');}window.requestInput('south','kb');});
  await type(page,'south','tom');
  await page.locator('#kb-south .kcand[data-i="0"]').click();
  assert.equal(await draft(page,'south'),'tomorrow ');
});
test('speech final callback keeps microphone ownership',async page=>{
  await page.evaluate(()=>{window.INPUT.owner='south';window.INPUT.mode='mic';window.sendFrom('south','spoken test',true);});
  await page.waitForFunction(()=>window.HIST.length===1);
  assert.deepEqual(await page.evaluate(()=>window.INPUT),{owner:'south',mode:'mic'});
  assert.equal(await page.evaluate(()=>window.HIST[0].text),'spoken test');
});
(async()=>{
  const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  let browser,failed=0;
  try {
    browser=await chromium.launch({headless:true,...(process.env.CHAT_BROWSER_CHANNEL?{channel:process.env.CHAT_BROWSER_CHANNEL}:{})});
    console.log('Browser '+browser.version()+'; viewport 412x915; speech block unchanged');
    for(const t of tests){
      const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true});
      const page=await context.newPage();
      page.setDefaultTimeout(4000);
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',async route=>{
        const request=route.request().url();
        if(request.startsWith(url))return route.continue();
        if(/\/dict\/bigram-/.test(request))return route.fulfill({json:{}});
        if(/\/dict\//.test(request))return route.fulfill({json:dictionary});
        return route.abort();
      });
      await context.addInitScript(words=>{
        localStorage.setItem('duck_dict_en',JSON.stringify(words));
        localStorage.setItem('duck_haptic','off');
      },dictionary);
      try {
        const lang=/Korean|native selection|native Enter/.test(t.name)?'ko':/Japanese/.test(t.name)?'ja':'en';
        await page.goto(url+'/?s='+lang+'&n='+lang);
        await page.evaluate(()=>window.setFtForTest({predict:()=>[]}));
        await t.run(page);
        assert.deepEqual(errors,[],'No unhandled application errors');
        console.log('PASS '+t.name);
      } catch(e){failed++;console.error('FAIL '+t.name+'\n  '+e.message.split('\n').slice(0,5).join('\n  '));}
      finally{await context.close();}
    }
    console.log(`${tests.length-failed}/${tests.length} tests passed`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
  process.exitCode=failed?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
