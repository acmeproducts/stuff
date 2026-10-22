'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const seams=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const result={scope:'Pure current-function probes with mocked events/layout; not physical Android reproduction',selection:[],popup:{}};
for(const distance of [10,25]){
 const B={id:'B',a:[{t:1,v:1}]},A={id:'A',a:[{t:1,v:2}]},ctx={sel:B,S:{nowActive:'B'},locate:()=>({near:{z:A,dist:distance},target:1}),setActive(id){ctx.S.nowActive=id},syncActive(){},inspectedPoint:z=>z.a[0],showInspection(q,z){ctx.inspected=z.id},publish(){}};
 vm.createContext(ctx);vm.runInContext(seams.inspect+'\ninspect({},true)',ctx);
 result.selection.push({nearestSeries:'A',distance,selectedSeries:ctx.S.nowActive,inspectedSeries:ctx.inspected});
}
assert.equal(result.selection[0].selectedSeries,'A');
assert.equal(result.selection[1].selectedSeries,'B');assert.equal(result.selection[1].inspectedSeries,'A');
const link={style:{}},close={style:{}},tip={style:{},innerHTML:'',scrollHeight:40,clientHeight:40,getBoundingClientRect:()=>({width:200,height:40}),querySelector:s=>s==='[data-tip-close]'?close:link};
const model={W:500,H:300,xy:()=>({x:250,y:150})},ctx={model,tip,mode:'dual',IDX:[],cat:()=>({source_reference_url:'https://example.test/source'}),healthEntryUrl26:()=> 'https://example.test/source',URL,location:{href:'https://example.test/chart'},chartNumber:v=>Number(v).toFixed(2),esc:String,full:()=> 'Oct 20, 2026',paint:()=>model,S:{}};
vm.createContext(ctx);vm.runInContext(seams.popup+"\nshowInspection({t:1,sourceT:1,idx:110,raw:50,v:50},{id:'A',label:'Series A',unit:'USD'})",ctx);
result.popup={dataPointX:250,boxLeft:Number.parseFloat(tip.style.left),positionedToRight:Number.parseFloat(tip.style.left)>250,visibleSeriesTitle:tip.innerHTML.includes('>Series A<'),singleInlineValues:tip.innerHTML.includes('<span class="inspectionValues">')};
assert(result.popup.positionedToRight);assert.equal(result.popup.visibleSeriesTitle,false);
fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
