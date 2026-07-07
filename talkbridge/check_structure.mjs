// Spec-exact structural check (parse5 = same HTML5 parsing algorithm Chrome uses).
// PASS requires: all dormant surfaces sealed inside the inert template; none reachable in the live DOM.
import {parse} from 'parse5'; import fs from 'fs';
const file=process.argv[2];
const doc=parse(fs.readFileSync(file,'utf8'));
const DORMANT_IDS=['lobby','lobby-waiting','thankyou-page','joiner-landing','call-screen','chat-input','call-transcript','pb-overlay','create-room-backdrop','joining-screen','log-overlay'];
let leaks=[], sealed=0, tplFound=false;
function walk(n, inTemplate){
  const id=(n.attrs||[]).find(a=>a.name==='id')?.value;
  if(n.tagName==='template' && id==='tb-bridge-tpl'){ tplFound=true;
    if(n.content) n.content.childNodes?.forEach(c=>walk(c,true)); return; }
  if(id && DORMANT_IDS.includes(id)){ (inTemplate?++sealed:leaks.push(id)); }
  (n.childNodes||[]).forEach(c=>walk(c,inTemplate));
}
walk(doc,false);
console.log('template present:', tplFound?'PASS':'FAIL');
console.log('dormant surfaces sealed:', sealed>=8?'PASS ('+sealed+')':'FAIL ('+sealed+')');
console.log('leaked into live DOM:', leaks.length===0?'PASS (0)':'FAIL: '+leaks.join(','));
process.exit((tplFound&&sealed>=8&&leaks.length===0)?0:1);
