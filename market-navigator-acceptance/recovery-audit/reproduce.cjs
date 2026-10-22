'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const seams=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const day=d=>Date.parse(d+'T00:00:00Z'),dates=['2026-10-14','2026-10-15','2026-10-16','2026-10-19','2026-10-20'],src={observations:[{t:day('2016-09-01'),v:-.35},{t:day('2026-10-09'),v:-.502},{t:day('2026-10-16'),v:-.496}]};
(async()=>{
 const results={scope:'Pure production functions with synthetic values; geometry diagnosis, not source qualification',sessionDates:dates,expectedSessionFractions:[0,.25,.5,.75,1],implementations:{}};
 for(const [name,seam]of Object.entries(seams)){
  const ctx={Date,Number,Math,S:{h:'5D',indexDisplay:'fixed'},IDX:['risk','growth','macro'],cat:()=>({native_cadence:'weekly'}),health:()=>({classification:'verified-batch'}),label:id=>id,name:id=>id,unit:()=> 'Index',seriesAvailable:async()=>true,getSeries:async()=>src,obsRange:(s,w)=>s.observations.filter(p=>p.t>=w.start&&p.t<=w.end),baseline:(s,w)=>s.observations.filter(p=>p.t<=w.start).at(-1)};
  vm.createContext(ctx);vm.runInContext(seam.window+'\n'+seam.source+'\nglobalThis.windowFn=observationWindow;globalThis.sourceFn=sourceSet25',ctx);
  const window=()=>({horizon:'5D',start:day(dates[0]),end:day(dates.at(-1))+86400000-1});
  const daily={id:'risk',a:dates.map(d=>({t:day(d),v:100}))},alone=ctx.windowFn([structuredClone(daily)],window());
  const w=window(),weekly=await ctx.sourceFn('nfci',w,'#00ffaa'),mixed=ctx.windowFn([structuredClone(daily),weekly],w);
  const fraction=t=>(t-mixed.start)/((mixed.plotEnd??mixed.end)-mixed.start);
  results.implementations[name]={dailyOnlyPlotEnd:new Date(alone.plotEnd??alone.end).toISOString(),withWeeklyPlotEnd:new Date(mixed.plotEnd??mixed.end).toISOString(),dailyFractions:dates.map(d=>fraction(day(d))),weekendToWeekdayWidthRatio:(fraction(day('2026-10-19'))-fraction(day('2026-10-16')))/(fraction(day('2026-10-16'))-fraction(day('2026-10-15'))),dailyRightGapAt374px:(1-fraction(day(dates.at(-1))))*374,syntheticWeeklyPoints:weekly.a.filter(p=>p.held).map(p=>({plotDate:new Date(p.t).toISOString(),sourceDate:new Date(p.sourceT).toISOString()}))};
 }
 assert.equal(results.implementations.baseline.dailyRightGapAt374px,0);
 assert(results.implementations.current.dailyRightGapAt374px>53&&results.implementations.current.dailyRightGapAt374px<54);
 assert(Math.abs(results.implementations.current.weekendToWeekdayWidthRatio-3)<1e-9);
 assert.notEqual(results.implementations.current.dailyOnlyPlotEnd,results.implementations.current.withWeeklyPlotEnd);
 fs.writeFileSync(process.argv[3],JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
