// Corpus freshness and publication guards live in application services, never the shared painter.
const helpers="\nasync function recoveryLoadCorpus26(force=false){\n if(force)S.corpusPromise26=null;\n if(!S.corpusPromise26)S.corpusPromise26=fetch('market-evidence/corpus-health.json',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('Corpus audit unavailable');let x=await r.json();if(x.schema!=='market-navigator-corpus-health-v1')throw Error('Corpus audit schema invalid');S.corpus=x;return x}).catch(e=>{S.corpus={schema:'unavailable',error:e.message};return S.corpus});\n return S.corpusPromise26;\n}\nfunction recoveryCorpusStatus26(){\n let c=S.corpus,age=Date.now()-Date.parse(c?.generatedAt||''),valid=c?.schema==='market-navigator-corpus-health-v1'&&Number.isFinite(age)&&age>=-300000&&age<=172800000;\n return{verified:valid&&c.publicationStatus!=='held',message:!valid?'Data freshness is unverified: corpus audit missing or older than 48 hours.':c.publicationStatus==='held'?'Data repair is held; retained observations are shown.':c.summary?.ready?'Corpus checked · '+c.summary.files+' files · '+c.summary.series+' catalog series':'Corpus checked; some data or models need repair. See Health.',generatedAt:c?.generatedAt||null};\n}\nasync function recoveryCorpusCheck26(state){\n await recoveryLoadCorpus26();\n let status=recoveryCorpusStatus26();if(!status.verified)throw Error(status.message);for(let [path,hash]of Object.entries(S.corpusLoadedHashes||{})){if(S.corpus.files?.[path]?.sha256!==hash)throw Error('Data publication changed; reload the chart before requesting current analysis.')}\n let ids=[...new Set([...(state.chart?.series||[]).map(z=>z.id),...(state.series||[]),state.root].filter(x=>typeof x==='string'))],rows={},models={};\n for(let id of ids){\n  if(IDX.includes(id)){let m=S.corpus.indices?.[id];if(!m||m.status!=='current')throw Error(displayLabel(id)+' index evidence needs repair; current analysis is unavailable.');models[id]=m}\n  else{let row=S.corpus.series?.[id],src=await getSeries(id);if(!row||!['current','degraded'].includes(row.status)||row.sourceRevision!==src.sourceRevision)throw Error(label(id)+' evidence needs repair or has an unmatched revision; current analysis is unavailable.');let frozen=state.relationshipEvidence?.sources?.find(x=>x.id===id);if(frozen?.sourceRevision&&frozen.sourceRevision!==row.sourceRevision)throw Error('Frozen chart revision changed; refresh the chart before requesting current analysis.');rows[id]=row}\n }\n return{schema:'market-navigator-corpus-scope-v1',auditAt:S.corpus.generatedAt,publicationStatus:S.corpus.publicationStatus||'audited',series:rows,indices:models,limits:'Native observation dates differ from collection/calculation dates. Uncaptured persistent history is not reconstructed.'};\n}\nasync function recoveryRequireCorpus26(state){\n try{return await recoveryCorpusCheck26(state)}catch(first){\n  // One cache-bypassing reload can resolve a deployment race; the client never repairs/fabricates provider observations.\n  await recoveryLoadCorpus26(true);S.series={};S.seriesPromises={};\n  return recoveryCorpusCheck26(state);\n }\n}\nfunction recoveryCorpusNotice26(){\n let host=$('healthRows');if(!host)return;let status=recoveryCorpusStatus26(),box=document.createElement('div');box.className='rowMeta';box.dataset.corpusStatus=status.verified?'audited':'unverified';box.textContent=status.message+(status.generatedAt?' · checked '+status.generatedAt:'');host.prepend(box);\n}\n";
const displayHelpers=`
let recoveryBootTimer26=0;
async function recoveryBootFailure26(){
 const wrap=$('nowWrap');let note=wrap.querySelector('[data-bootstrap-hold]');if(!note){note=document.createElement('div');note.dataset.bootstrapHold='';note.setAttribute('role','status');note.style.cssText='position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:24px;background:var(--panel);z-index:6';note.textContent='Current data is temporarily unavailable. Automatic data checks will retry.';wrap.append(note)}$('nowChart').style.visibility='hidden';
 if(innerWidth<=760)$('rail').classList.add('closed');
 if(!S.reliabilityHistory26){try{await initPersistence();renderLibrary();renderAIConfig();S.reliabilityHistory26=true}catch{}}
 clearTimeout(recoveryBootTimer26);recoveryBootTimer26=setTimeout(()=>boot(),60000);
}
function recoveryDisplayCertificate26(ids){
 const c=S.corpus,deadlines=ids.map(id=>Date.parse((IDX.includes(id)?c?.indices?.[id]:c?.series?.[id])?.validUntil||''));
 return{validUntil:Math.min(Date.parse(c?.generatedAt||'')+172800000,...deadlines),ids:[...ids],auditAt:c?.generatedAt};
}
function recoveryCertificateCurrent26(cert){return !!cert&&Number.isFinite(cert.validUntil)&&Date.now()<cert.validUntil&&recoveryCorpusStatus26().verified}
async function recoveryReloadPublished26(){
 if(S.displayReload26)return S.displayReload26;
 S.displayReload26=(async()=>{
  await recoveryLoadCorpus26(true);if(!recoveryCorpusStatus26().verified)throw Error('Current data unavailable');
  const next=await Promise.all([j('market-evidence/derived-indices-persistent-v1.json'),j('data/market-backend/derived-index-definition-persistent-v1.json'),j('market-evidence/health-envelope.json'),j('data/market-backend/data-catalog.json'),j('data/market-backend/source-registry.json')]);
  const hashes=Object.fromEntries(Object.keys(S.corpusLoadedHashes||{}).filter(p=>!p.startsWith('market-evidence/series/')).map(p=>[p,S.corpusLoadedHashes[p]]));
  [S.derived,S.def,S.health,S.catalog,S.sourceRegistry]=next;S.catMap=Object.fromEntries(S.catalog.series.map(x=>[x.id,x]));S.series={};S.seriesPromises={};S.corpusLoadedHashes=hashes;
 })();try{return await S.displayReload26}finally{S.displayReload26=null}
}
async function recoveryDisplayCheck26(ids){
 if(!S.derived||!S.def||!S.catalog||!S.health||!S.sourceRegistry)throw Error('Current data unavailable');
 try{await recoveryCorpusCheck26({series:ids})}catch(first){await recoveryReloadPublished26();await recoveryCorpusCheck26({series:ids})}
 if(!recoveryCertificateCurrent26(recoveryDisplayCertificate26(ids)))throw Error('Data publication deadline passed');
}
`;
const displayModule=`
let displayCertificate26=null,displayHeld26=false,displayTimer26=0;
function holdDisplay26(value){
 displayHeld26=!!value;const wrap=$('nowWrap');let note=wrap.querySelector('[data-data-hold]');
 if(value){if(!note){note=document.createElement('div');note.dataset.dataHold='';note.setAttribute('role','status');note.style.cssText='position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:24px;background:var(--panel);z-index:6';note.textContent='Current data is temporarily unavailable. Automatic data checks will retry.';wrap.append(note)}$('nowChart').style.visibility='hidden';$('nowTip').style.display='none'}
 else{note?.remove();$('nowChart').style.visibility=''}
 for(const id of ['nowMoreBtn','indexInfoBtn'])$(id).disabled=!!value;
}
function watchDisplay26(){
 clearTimeout(displayTimer26);if(dead||!services.preflight)return;
 const remaining=displayCertificate26?.validUntil-Date.now();displayTimer26=setTimeout(async()=>{
  if(dead)return;if(visible&&!pending){
   if(!services.certificateCurrent(displayCertificate26))holdDisplay26(true);
   try{await services.pollDisplay?.()}catch{}
   if(!services.certificateCurrent(displayCertificate26))holdDisplay26(true);
   if(displayHeld26&&services.autoResume!==false)renderNow();
  }watchDisplay26();
 },Number.isFinite(remaining)&&remaining>0?Math.max(1,Math.min(300000,remaining)):60000);
}
async function admitDisplay26(ids,seq){
 if(!services.preflight)return true;
 try{await services.preflight(ids);if(dead||seq!==S.v2RenderSeq)return false;displayCertificate26=services.certificate(ids);holdDisplay26(false);watchDisplay26();return true}
 catch(e){if(dead||seq!==S.v2RenderSeq)return false;holdDisplay26(true);pending=false;publish();watchDisplay26();return false}
}
cleanups.push(()=>clearTimeout(displayTimer26));
listen(document,'visibilitychange',()=>{if(!document.hidden&&visible&&!dead&&displayCertificate26&&!services.certificateCurrent(displayCertificate26)){holdDisplay26(true);if(services.autoResume!==false&&!pending)renderNow()}});
`;
function moduleFixes(text){
 const seam="$('nowRepresentation').onchange=";
 if(!text.includes(seam))throw Error('Missing chart coverage presentation seam');
 text=text.replace(seam,"let coverage=services.coverage?.(S.level===1?IDX:visibleIds25(),S.h),footer=$('nowMeta');footer.parentElement.style.gridTemplateRows=coverage?'44px 34px minmax(0,1fr) auto':'';footer.style.flexWrap=coverage?'wrap':'';footer.style.rowGap=coverage?'2px':'';if(coverage){let note=document.createElement('span');note.setAttribute('role','status');note.className='rowMeta';note.style.cssText='flex:0 0 100%;white-space:normal;text-align:center;overflow-wrap:anywhere';note.textContent=coverage;footer.append(note)}"+seam);
 const v1='function renderV1(){if(dead)return;clearLegendListeners();pending=false;counts.renderRequests++;S.v2RenderSeq++;',v2="let seq=++S.v2RenderSeq,k=S.index,ids=visibleIds25(),w=await";
 if(!text.includes(v1)||!text.includes(v2))throw Error('Missing pre-display admission seam');
 text=text.replace(v1,'async function renderV1(){if(dead)return;pending=true;counts.renderRequests++;let seq=++S.v2RenderSeq;if(!await admitDisplay26(IDX,seq))return;clearLegendListeners();');
 text=text.replace(v2,"let seq=++S.v2RenderSeq,k=S.index,ids=visibleIds25();if(!await admitDisplay26(ids,seq))return;let w=await");
 text=text.replace("function draw(sets,w,mode='indexed'){","function draw(sets,w,mode='indexed'){if(services.preflight&&!services.certificateCurrent(displayCertificate26)){holdDisplay26(true);watchDisplay26();return}");
 return displayModule+text;
}
function applicationFixes(out){
 out=out.replace('async function boot(){try{','async function boot(){try{await recoveryLoadCorpus26();');
 const bootstrapCatch="$('nowWrap').innerHTML=\x60<div style=\"padding:16px;color:var(--bad)\">${esc(e.message)}</div>\x60";
 if(!out.includes(bootstrapCatch))throw Error('Missing bootstrap failure seam');
 out=out.replace(bootstrapCatch,'recoveryBootFailure26()');
 out=out.replace("await initPersistence();renderV1();","if(!S.reliabilityHistory26)await initPersistence();document.querySelector('[data-bootstrap-hold]')?.remove();renderV1();");
 out=out.replace("async function j(p){let r=await fetch(p,{cache:'no-store'});if(!r.ok)throw Error(`${p} HTTP ${r.status}`);return r.json()}","async function j(p){let r=await fetch(p,{cache:'no-store'});if(!r.ok)throw Error(p+' HTTP '+r.status);let text=await r.text(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(x=>x.toString(16).padStart(2,'0')).join(''),expected=S.corpus?.publicationStatus==='held'?null:S.corpus?.files?.[p]?.sha256;if(expected&&expected!==hash){await recoveryLoadCorpus26(true);expected=S.corpus?.publicationStatus==='held'?null:S.corpus?.files?.[p]?.sha256;if(expected&&expected!==hash)throw Error('Data revision mismatch: '+p+'; reload after publication completes.')}S.corpusLoadedHashes={...(S.corpusLoadedHashes||{}),[p]:hash};return JSON.parse(text)}");
 out=out.replace('async function startAI(stateOverride=null){','async function startAI(stateOverride=null){');
 out=out.replace("level=state.interpretationLevel||reg.interpretationLevel||'standard',rootLabel=","level=state.interpretationLevel||reg.interpretationLevel||'standard',rootLabel=");
 const seam="state.interpretationLevel=level;let a=";
 if(!out.includes(seam))throw Error('Missing AI corpus seam');
 out=out.replace(seam,"state.interpretationLevel=level;try{state.corpusQualification=await recoveryRequireCorpus26(state)}catch(e){alert(e.message);return}let a=");
 out=out.replace("function aiEvidenceState(state){let chart=state.chart||{};return{","function aiEvidenceState(state){let chart=state.chart||{};return{corpusQualification:state.corpusQualification||{status:'historical-unverified',rule:'Frozen historical Library evidence is retained; it is not verified current evidence.'},");
 out=out.replace("state.chart=fresh;state.relationshipEvidence=recoveryRelationshipEvidence26(state,S.series);","state.chart=fresh;state.relationshipEvidence=recoveryRelationshipEvidence26(state,S.series);state.corpusQualification=await recoveryRequireCorpus26(state);");
 out=out.replace("if(mnxHealthTab==='sources'){renderHealth();return}","if(mnxHealthTab==='sources'){renderHealth();recoveryCorpusNotice26();return}");
 out=out.replace("metadata:{derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry},getSeries,","get metadata(){return{derived:S.derived,def:S.def,health:S.health,catalog:S.catalog,sourceRegistry:S.sourceRegistry}},preflight:recoveryDisplayCheck26,certificate:recoveryDisplayCertificate26,certificateCurrent:recoveryCertificateCurrent26,pollDisplay:()=>recoveryLoadCorpus26(true),coverage:(ids,h)=>{let selected=ids.filter(id=>IDX.includes(id));return selected.some(id=>S.derived.indices[id]?.horizons[h]?.status==='sparse')?'Insufficient index history after a capture gap':selected.some(id=>S.derived.uncapturedGaps?.[id]?.length)?'Index history contains an uncaptured gap':''},getSeries,");
 out=out.replace('services.canAnalyze=false;','services.canAnalyze=false;services.autoResume=false;');
 if(!out.includes('boot();'))throw Error('Missing corpus helper insertion seam');
 let guardedHelpers=helpers.replace("let m=S.corpus.indices?.[id];if(!m||m.status!=='current')","let m=S.corpus.indices?.[id];if(!m||m.status!=='current'||!(Date.now()<Date.parse(m.validUntil||'')))").replace("!['current','degraded'].includes(row.status)||row.sourceRevision!==src.sourceRevision","!['current','degraded'].includes(row.status)||!(Date.now()<Date.parse(row.validUntil||''))||row.sourceRevision!==src.sourceRevision");
 out=out.replace('boot();',guardedHelpers+displayHelpers+'\nboot();');
 return out;
}
module.exports={applicationFixes,moduleFixes};
