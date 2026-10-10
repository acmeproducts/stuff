'use strict';
// Application refresh lifecycle. The reusable chart keeps owning its own state.
module.exports=(code,babel)=>{
 const ast=babel.babelParse(code,'refresh-lifecycle',false),edits=[];
 const change=(name,fn)=>babel.traverse(ast,{FunctionDeclaration(p){if(p.node.id.name===name){edits.push({start:p.node.start,end:p.node.end,text:fn(code.slice(p.node.start,p.node.end))})}}});
 change('rebuildScheduleData',()=>`function rebuildScheduleData(){clearTimeout(rebuildDataTimer);if(!window.__mnDataBroker||!S.derived)return;rebuildRefreshStatus();rebuildDataTimer=setTimeout(()=>{void rebuildRefreshData(true)},Math.max(15000,rebuildNextCheck-Date.now(),60000))}`);
 change('rebuildRefreshData',()=>`async function rebuildRefreshData(force=false){
 const broker=window.__mnDataBroker;if(!broker||!S.derived||rebuildDataApplying)return false;
 if(rebuildDataPending)return rebuildDataPending;
 if(Date.now()<rebuildNextCheck)return false;
 const previous=broker.status();if(!force&&previous&&Date.now()<Date.parse(previous.validUntil))return false;
 rebuildNextCheck=Date.now()+60000;
 rebuildDataPending=(async()=>{let staged=null;
 try{
  const next=await broker.check();
  if(next.generation===previous?.generation){broker.commit(next);rebuildCheckError=null;rebuildCheckFailures=Date.now()>=Date.parse(next.validUntil)?rebuildCheckFailures+1:0;return false}
  if(!Number.isFinite(Date.parse(next.validUntil))||Date.now()>=Date.parse(next.validUntil))throw Error('Incoming verification has expired');
  // An open or parked Analyze owns its original generation until X.
  if(rebuildAnalyze)return false;
  const [derived,def,health,catalog,sourceRegistry]=await Promise.all(['market-evidence/derived-indices-persistent-v1.json','data/market-backend/derived-index-definition-persistent-v1.json','market-evidence/health-envelope.json','data/market-backend/data-catalog.json','data/market-backend/source-registry.json'].map(p=>broker.json(p,next.generation)));
  if(!derived.coherence?.allIndexHorizonsComputable)throw Error('New collection failed coherence');
  const series=Object.fromEntries(await Promise.all(catalog.series.map(async x=>[x.id,await broker.json('market-evidence/series/'+x.id+'.json',next.generation)])));
  const metadata={derived,def,health,catalog,sourceRegistry},host=document.createElement('div');host.style.cssText='position:fixed;left:-20000px;top:0;width:640px;height:480px';document.body.append(host);
  try{staged=MNChart.mount(host,rebuildNow.getOptions(),{metadata,getSeries:async id=>series[id],namespace:'mn-refresh-stage-'});await staged.whenReady()}finally{staged?.destroy();staged=null;host.remove()}
  if(rebuildAnalyze)return false;
  const options=rebuildNow.getOptions(),oldServices=rebuildNowServices(),old={derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry,catMap:S.catMap,series:S.series,seriesPromises:S.seriesPromises};
  rebuildDataApplying=true;rebuildNow.destroy();
  try{Object.assign(S,{...metadata,catMap:Object.fromEntries(catalog.series.map(x=>[x.id,x])),series,seriesPromises:{}});broker.commit(next);rebuildNow=MNChart.mount($('view-now'),options,rebuildNowServices());await rebuildNow.whenReady()}
  catch(error){rebuildNow?.destroy();Object.assign(S,old);broker.commit(previous);rebuildNow=MNChart.mount($('view-now'),options,oldServices);await rebuildNow.whenReady();throw error}
  rebuildNow.setVisible(S.view==='now');rebuildCheckFailures=0;rebuildCheckError=null;return true;
 }catch(error){rebuildCheckFailures++;rebuildCheckError=String(error.message||error);return false}
 finally{rebuildDataApplying=false;rebuildDataPending=null;rebuildNextCheck=Date.now()+Math.min(300000,60000*Math.pow(2,Math.min(3,rebuildCheckFailures)));rebuildScheduleData()}
 })();return rebuildDataPending;
}`);
 change('openStandaloneAnalysis26',s=>s.replace(/if\(window\.__mnDataBroker&&!rebuildAnalyze\)\{[\s\S]*?return false\}/,`if(window.__mnDataBroker&&!rebuildAnalyze){rebuildRefreshStatus();void rebuildRefreshData(true)}`));
 change('closeStandaloneAnalysis26',s=>s.replace('void rebuildRefreshData(true);','rebuildNextCheck=0;void rebuildRefreshData(true);'));
 change('rebuildServices',s=>s.replace('function rebuildServices(){return{beforeRender:()=>rebuildRefreshData(),',`function rebuildServices(){const qualification=rebuildQualification(),broker=window.__mnDataBroker,generation=broker?.status()?.generation,cache=S.series;return{beforeRender:()=>{void rebuildRefreshData()},`).replace('getSeries:async id=>readOnly(structuredClone(await getSeries(id))),window:horizonWindow,available:rebuildSeriesAvailable,',`getSeries:async id=>readOnly(structuredClone(cache[id]||(generation?await broker.json('market-evidence/series/'+id+'.json',generation):await getSeries(id)))),`).replace('onInfo:(state,button)=>mnxOpenExplanation(state,button)','onInfo:(state,button)=>mnxOpenExplanation(rebuildScopeQualification(state,qualification),button)').replace('onAction:(action,state,canvas)=>{','onAction:(action,state,canvas)=>{state=rebuildScopeQualification(state,qualification);'));
 change('aiEvidenceState',s=>s.replace('return{governedIndexExplanation:', 'return{verification:state.verification||null,verificationInstruction:state.verification?.status===\'delayed\'?\'This is an integrity-checked historical snapshot. Live source verification was delayed when this scope was captured. State its verification timestamp; do not claim it is currently source-verified.\':null,governedIndexExplanation:'));
 for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 code=code.replace('function rebuildScheduleData(){',`let rebuildNextCheck=0,rebuildCheckFailures=0,rebuildCheckError=null;
 function rebuildQualification(){const q=window.__mnDataBroker?.status();if(!q)return null;const a=q.assurance;return{generation:q.generation,revision:q.revision,verifiedAt:a?.lastSuccess?.at||a?.assurance?.checkedAt||a?.heartbeatAt||null,validUntil:q.validUntil||null,status:Date.now()<Date.parse(q.validUntil)?'verified':'delayed',capturedAt:new Date().toISOString()}}
 function rebuildScopeQualification(state,qualification){return qualification?{...state,verification:{...structuredClone(qualification),status:Date.now()<Date.parse(qualification.validUntil)?'verified':'delayed'}}:state}
 function rebuildRefreshStatus(){const q=rebuildQualification();let node=$('rebuildVerificationStatus');const delayed=q?.status==='delayed'||!!rebuildCheckError;if(!delayed){node?.remove();return}if(!node){node=document.createElement('div');node.id='rebuildVerificationStatus';node.setAttribute('role','status');node.style.cssText='position:fixed;bottom:3px;left:56px;right:8px;z-index:30;font:11px system-ui;color:var(--muted);pointer-events:none;background:var(--panel);padding:3px 6px;border-radius:4px';document.body.append(node)}node.textContent='Live verification delayed. Showing verified snapshot'+(q?.verifiedAt?' from '+new Date(q.verifiedAt).toLocaleString():'')+'. Background checks continue.'}
 function rebuildScheduleData(){`);
 return code;
};
