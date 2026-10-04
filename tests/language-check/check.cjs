// Language coverage check for chat-test.html. Lists every selectable language and what each has.
// Run: NODE_PATH=$(npm root -g) CHAT_BROWSER_CHANNEL=chromium node tests/language-check/check.cjs
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'../..');
// Gaps the owner knows about. A gap not on this list fails the check; a listed gap that gets fixed also fails, so the list stays honest.
const KNOWN={};
(async()=>{
 const b=await chromium.launch({channel:process.env.CHAT_BROWSER_CHANNEL||undefined});const page=await b.newPage();
 await page.goto('file://'+path.join(root,'chat-test.html'));await page.waitForFunction(()=>typeof window.langCheck==='function');
 const rows=await page.evaluate(()=>window.langCheck());await b.close();
 const dicts=new Set(fs.readdirSync(path.join(root,'dict')).filter(f=>/^[a-z]+\.json$/.test(f)).map(f=>f.replace('.json','')));
 const found={};console.log('code  name                    flag  stt           tts     keyboard  dict');
 for(const r of rows){
  const gaps=[];if(!r.flag)gaps.push('flag');if(!r.stt)gaps.push('stt');if(!r.tts)gaps.push('tts');if(!r.keyboard)gaps.push('keyboard');if(!dicts.has(r.code))gaps.push('dict');
  found[r.code]=gaps;
  console.log(r.code.padEnd(5),r.name.padEnd(23),(r.flag||'-').padEnd(5),String(r.stt||'-').padEnd(13),String(r.tts||'-').padEnd(7),String(r.keyboard||'-').padEnd(9),dicts.has(r.code)?'yes':'-',gaps.length?'  GAPS: '+gaps.join(','):'');
 }
 let bad=0;for(const r of rows){const got=found[r.code].join(','),want=(KNOWN[r.code]||[]).join(',');if(got!==want){bad++;console.log('UNEXPECTED',r.code,'has gaps ['+got+'], known ['+want+']')}}
 // Keyboard coverage: every letter native to the language must be typeable. Lists come from a frequency audit of dict/<lang>.json, restricted to the language's own letters (loanword noise left out).
 const REQUIRED={th:'บถึุู๊ภฎๅํ',ar:'د',hi:'षःॅ',ru:'ёъ',fr:'âïë',pt:'à',nl:'ëéïèöüáóí',tr:'âîû',km:'ើួឹៀឺៈឧឯឥឱឿឰឦ',lo:'ຽ'};
 for(const r of rows){const keys=new Set(Array.from((r.keys||'').normalize('NFC')));
  for(const ch of Array.from(REQUIRED[r.code]||'')){if(!keys.has(ch)){bad++;console.log('KEYBOARD GAP',r.code,'cannot type',ch)}}}
 // Vietnamese: every precomposed letter must be reachable from the base keys plus the five tone keys.
 { const vi=rows.find(r=>r.code==='vi'),keys=new Set(Array.from((vi.keys||'').normalize('NFC'))),tones=/[\u0300\u0301\u0303\u0309\u0323]/g;
   const letters=[];for(let c=0xC0;c<=0x1EF9;c++){const ch=String.fromCharCode(c);if(/^[a-zA-ZàáâãèéêìíòóôõùúýăđĩũơưÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯ\u1EA0-\u1EF9]$/.test(ch)&&ch.normalize('NFD')!==ch||/^[ăđơưĂĐƠƯ]$/.test(ch))letters.push(ch)}
   const missing=[];for(const ch of letters){const nfd=ch.normalize('NFD'),t=nfd.match(tones)||[],base=nfd.replace(tones,'').normalize('NFC').toLowerCase();if(t.length>1||(t.length&&!keys.has(t[0]))||!keys.has(base))missing.push(ch)}
   if(missing.length){bad++;console.log('KEYBOARD GAP vi cannot type',missing.join(''))} }
 // Look-alike languages must not share a speech, voice or translation code.
 for(const [a,c] of [['ms','id']]){const x=rows.find(r=>r.code===a),y=rows.find(r=>r.code===c);if(x.stt===y.stt||x.tts===y.tts){bad++;console.log('SIBLING CLASH',a,c)}}
 console.log(bad?'FAIL: '+bad+' unexpected':'OK: '+rows.length+' languages, only the known gaps above');process.exit(bad?1:0);
})().catch(e=>{console.error(e);process.exit(1)});
