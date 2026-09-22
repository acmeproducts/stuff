// Run the unchanged 32-case keyboard regression suite against the new portal.
// Only the fixture's page choice and room setup differ; assertions are unchanged.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const source=path.join(__dirname,'../chat-keyboard/r1.cjs');
let suite=fs.readFileSync(source,'utf8').replace("path.join(root, 'chat-lab.html')","path.join(root, 'chatlink-turn01-pre-base.html')");
const anchor="await page.goto(url+'/?s='+lang+'&n='+lang);";
if(!suite.includes(anchor))throw new Error('Baseline test setup changed');
suite=suite.replace(anchor,anchor+`
        await page.evaluate(()=>window.setFtForTest({predict:()=>[]}));
        await page.waitForFunction(()=>document.documentElement.dataset.chatlinkReady==='true');
        await page.locator('#cl-new').click();
        await page.getByLabel('Conversation name',{exact:true}).fill('Parity fixture');
        await page.getByLabel('Device owner · South',{exact:true}).selectOption(lang);
        await page.getByLabel('Partner · North',{exact:true}).selectOption(lang);
        await page.getByRole('button',{name:'Create conversation',exact:true}).click();
        await page.waitForFunction(()=>!document.body.classList.contains('cl-open'));
`);
const runner=new Module(source,module);runner.filename=source;runner.paths=module.paths;runner._compile(suite,source);
