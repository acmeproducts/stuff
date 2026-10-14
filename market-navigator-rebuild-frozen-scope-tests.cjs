'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),scope=require('./market-navigator-rebuild-frozen-scope.cjs');
const stamp=d=>Date.parse(d+'T00:00:00Z'),ids=['a','b','c','d','e','f','g'];
const manifest={components:ids.map((id,i)=>({id,direction:i===1?-1:1,transform:i===1?'rate_change':'log_return',transformScale:i===1?2:1,dataHealth:'current'}))};
const inputs=day=>Object.fromEntries(ids.map((id,i)=>[id,{t:stamp(day),v:i===1?4:100,provenance:'immutable-original-seed'}]));
const a=inputs('2026-10-07'),b=inputs('2026-10-09');b.a.v=200;b.b.v=6;
const movement=(Math.log(2)-1)/7;
const state={chart:{requestedWindow:{start:stamp('2026-10-07'),end:stamp('2026-10-12')},window:{start:stamp('2026-10-07'),end:stamp('2026-10-12')},series:[{id:'macro',points:[{t:stamp('2026-10-07'),raw:110,v:100,baselineInputs:a},{t:stamp('2026-10-09'),raw:110+movement,v:100*(110+movement)/110,nativeInputs:b,knownBy:'2026-10-13T02:00:00Z'}]}]}};
const r=scope('macro',state,manifest);assert.equal(r.commonT0,'2026-10-07');assert.equal(r.commonNow,'2026-10-09');assert.equal(r.baseline,110);assert.equal(r.value,110+movement);assert(Math.abs(r.components.reduce((sum,c)=>sum+c.moveFrom100/7,0)-movement)<1e-14);assert.equal(r.frozenScope.plottedWindow.end,stamp('2026-10-12'));assert.equal(r.frozenScope.end.knownBy,'2026-10-13T02:00:00Z');
const saved=structuredClone(r);b.a.v=900;assert.deepEqual(r,saved,'Frozen record owns endpoint inputs');
const one=structuredClone(state);one.chart.series[0].points=[one.chart.series[0].points[0]];assert.equal(scope('macro',one,manifest).components.reduce((sum,c)=>sum+c.moveFrom100,0),0);
const missing=structuredClone(state);delete missing.chart.series[0].points[0].baselineInputs;assert.equal(scope('macro',missing,manifest),null,'No live canonical fallback');
const invalid=structuredClone(state);invalid.chart.series[0].points[0].baselineInputs.a.v=0;assert.equal(scope('macro',invalid,manifest),null);
// Test the actual source transformer, without regenerating a candidate artifact.
const {babel}=require('./market-navigator-rebuild-runtime.cjs'),patch=require('./market-navigator-rebuild-report-review.cjs');
const source=`function mnxRecord(k,h){let man=mnxManifest(k),b=mnxBlock(k,h);return {b,derivedFrom:'governed-derived-evidence'}}
function mnxExplain(state){let horizon='5D';return ['macro'].map(k=>mnxRecord(k,horizon))}
function mnxModelHealth(k,h){let r=mnxRecord(k,h);return r}
function mnxModelHealthSnapshot(state){let h='5D';return ['macro'].map(k=>mnxModelHealth(k,h))}
function mnxRecordFingerprint(r){return JSON.stringify([r.factorDiagnostics||{}])}`;
const context={structuredClone,mnxManifest:()=>manifest,mnxBlock:()=>{throw Error('Live horizon block must not be used')}};vm.createContext(context);vm.runInContext(patch(source,babel),context);
const explanation=context.mnxExplain(state)[0],health=context.mnxModelHealthSnapshot(state)[0];assert.equal(explanation.b.commonT0,'2026-10-07');assert.equal(health.b.commonNow,'2026-10-09');assert.deepEqual(explanation.b,health.b);assert.equal(explanation.derivedFrom,'frozen-plotted-endpoints');
console.log('PASS frozen endpoint dates, governed contributions, input ownership, one-point scope, missing inputs, invalid inputs and explanation/model-health transformer wiring');
// Read the actual generated functions to qualify filtering, rebasing, capture,
// model freezing and saved-state enrichment together, without editing artifacts.
const fs=require('node:fs');
function functionsFrom(code,names){const selected=new Map();babel.traverse(babel.babelParse(code,'generated-scope-regression',false),{FunctionDeclaration(p){if(names.includes(p.node.id.name))selected.set(p.node.id.name,code.slice(p.node.start,p.node.end))}});assert.equal(selected.size,names.length,'All generated consumer functions exist');return [...selected.values()].join('\n')}
const chart=fs.readFileSync('market-navigator-rebuild-chart.js','utf8'),app=/<script>([\s\S]*?)<\/script>/.exec(fs.readFileSync('market-navigator-rebuild-candidate.html','utf8'))[1];
const model={version:'test-v1',indices:{macro:{name:'Macro',components:manifest.components}},display_contract:{}};
const derived={revision:'frozen-v1',componentTransforms:Object.fromEntries(manifest.components.map(c=>[c.id,{kind:c.transform,scale:c.transformScale}])),indices:{},ratioEligibility:{}};
const live={def:model,derived,catalog:{series:ids.map(id=>({id,name:id,native_cadence:'daily'}))},health:{series:Object.fromEntries(ids.map(id=>[id,{classification:'current'}]))},indexDisplay:'rebase'};
const generated={S:live,structuredClone,MNInsights:require('./market-navigator-rebuild-insights.js'),IDX:['risk','growth','macro'],AB:{macro:'MAC'},H:['5D'],services:{},paintStyle:()=>({width:2,lineStyle:'line'}),MNX_REPLICATION_TOL:1e-6,MNX_RECONCILE_TOL:.005,MNX_COVERAGE_DEGRADED:.75,MNX_CONCENTRATION_WATCH:.5};
vm.createContext(generated);
vm.runInContext(functionsFrom(chart,['obsRange','indexDisplayCurve28','chartSnapshotFromSets'])+'\n'+functionsFrom(app,['mnxFrozenBlock','mnxFrozenScopeKey','mnxModelHash','mnxManifest','mnxHash','mnxNum','mnxSigned','mnxPp','mnxRecord','mnxRecordFingerprint','mnxScopeIndices','mnxPlain','mnxRecordMarkdown','mnxExplain','mnxModelHealth','mnxModelHealthSnapshot','mnxShipState']),generated);
const points=structuredClone(state.chart.series[0].points);points[1].nativeInputs.a.v=200;for(const p of points)p.v=p.raw;
const ranged=generated.obsRange({observations:points},state.chart.window),rebased=generated.indexDisplayCurve28(ranged);
assert.deepEqual(rebased[0].baselineInputs,points[0].baselineInputs);assert.deepEqual(rebased[1].nativeInputs,points[1].nativeInputs);assert.equal(rebased[1].knownBy,'2026-10-13T02:00:00Z');
const frozen={root:'macro',horizon:'5D',series:['macro'],lineage:'MAC'};frozen.chart=generated.chartSnapshotFromSets(frozen,[{id:'macro',label:'MAC',full:'Macro',unit:'Index',color:'#fff',a:rebased}],state.chart.window,'indexed');
generated.mnxShipState(frozen);const record=frozen.indexExplanation.records[0];assert.equal(record.status,'RECONCILED');assert.equal(record.baselineDate,'2026-10-07');assert.equal(record.endDate,'2026-10-09');assert(Math.abs(record.reconciliation.summedContribution-movement)<1e-12);assert.equal(frozen.modelHealth.models[0].explanationFingerprint,record.fingerprint);
const savedFrozen=JSON.stringify(frozen);live.derived.revision='live-v2';live.derived.componentTransforms.a.scale=900;generated.mnxShipState(frozen);assert.equal(JSON.stringify(frozen),savedFrozen,'Saved record and model health survive live rule and revision changes');
delete frozen.indexExplanation;delete frozen.modelHealth;generated.mnxShipState(frozen);assert.equal(frozen.indexExplanation.records[0].fingerprint,record.fingerprint,'Recomputation uses snapshot-owned model rules');
const absent=structuredClone(frozen);delete absent.indexExplanation;delete absent.modelHealth;delete absent.chart.modelEvidence;generated.mnxShipState(absent);assert.equal(absent.indexExplanation.records[0].status,'UNAVAILABLE','Legacy missing model rules never borrow live rules');
console.log('PASS generated filtering → rebasing → snapshot → explanation/model health; frozen seed and recovered provenance; saved-generation isolation and missing-manifest refusal');
const closedContext={structuredClone,mnxManifest:()=>manifest,mnxBlock:()=>{throw Error('Live horizon block forbidden')}};vm.createContext(closedContext);
const closedSource="(()=>{'use strict';"+source+"\nfunction mnxHash(x){return x}\nfunction mnxShipState(state){if(!state)return state;let explanation=mnxExplain(state),health=mnxModelHealthSnapshot(state);state.indexExplanation=explanation;state.modelHealth=health;return state}\nglobalThis.shipFrozen=mnxShipState;})();";
vm.runInContext(patch(closedSource,babel),closedContext);assert.equal(closedContext.mnxHash,undefined,'Hash helper is private to the app');assert.equal(closedContext.shipFrozen(structuredClone(state)).indexExplanation[0].b.commonNow,'2026-10-09');
console.log('PASS fingerprint and attribution helpers execute inside the actual application closure');
