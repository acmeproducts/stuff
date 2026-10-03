// Language coverage check for chat-test.html. Lists every selectable language and what each has.
// Run: NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/language-check/check.cjs
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.join(__dirname,'../..');
// Gaps the owner knows about. A gap not on this list fails the check; a listed gap that gets fixed also fails, so the list stays honest.
const KNOWN={km:['stt','tts','dict'],lo:['stt','tts','dict'],zh:['dict']};
(async()=>{
 const b=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||undefined});const page=await b.newPage();
 await page.goto('file://'+path.join(root,'chat-test.html'));await page.waitForFunction(()=>typeof window.langCheck==='function');
 const rows=await page.evaluate(()=>window.langCheck());await b.close();
 const dicts=new Set(fs.readdirSync(path.join(root,'dict')).filter(f=>/^[a-z]+\.json$/.test(f)).map(f=>f.replace('.json','')));
 const found={};console.log('code  name                    flag  stt     tts     keyboard  dict');
 for(const r of rows){
  const gaps=[];if(!r.flag)gaps.push('flag');if(!r.stt)gaps.push('stt');if(!r.tts)gaps.push('tts');if(!r.keyboard)gaps.push('keyboard');if(!dicts.has(r.code))gaps.push('dict');
  found[r.code]=gaps;
  console.log(r.code.padEnd(5),r.name.padEnd(23),(r.flag||'-').padEnd(5),String(r.stt||'-').padEnd(7),String(r.tts||'-').padEnd(7),String(r.keyboard||'-').padEnd(9),dicts.has(r.code)?'yes':'-',gaps.length?'  GAPS: '+gaps.join(','):'');
 }
 let bad=0;for(const r of rows){const got=found[r.code].join(','),want=(KNOWN[r.code]||[]).join(',');if(got!==want){bad++;console.log('UNEXPECTED',r.code,'has gaps ['+got+'], known ['+want+']')}}
 // Siblings must not share a speech, voice or translation code.
 for(const [a,c] of [['ms','id']]){const x=rows.find(r=>r.code===a),y=rows.find(r=>r.code===c);if(x.stt===y.stt||x.tts===y.tts){bad++;console.log('SIBLING CLASH',a,c)}}
 console.log(bad?'FAIL: '+bad+' unexpected':'OK: '+rows.length+' languages, only the known gaps above');process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
