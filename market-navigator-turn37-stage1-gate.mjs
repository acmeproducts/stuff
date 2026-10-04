import assert from 'node:assert/strict';
import fs from 'node:fs';
const html=fs.readFileSync('market-navigator-turn28-post-ship.html','utf8');
const m=JSON.parse(fs.readFileSync('market-navigator-turn37-stage1-map.json','utf8'));
assert.equal(m.baseline.blob,'9ce7f67451f9e1b7804927ce5c56adb667614724');
const allLegacy=new Set(m.operations.flatMap(x=>x.legacy));
for(const name of allLegacy){
  const patterns=[`function ${name}(`,`async function ${name}(`,`const ${name}=`,`let ${name}=`];
  assert(patterns.some(p=>html.includes(p)),`mapped legacy symbol missing from baseline: ${name}`);
}
for(const group of Object.values(m.domRoles)) for(const sel of group){
  if(sel.startsWith('#')) assert(html.includes(`id="${sel.slice(1)}"`),`mapped DOM role missing: ${sel}`);
}
const sStart=html.indexOf('const S={'),sEnd=html.indexOf('};const $=',sStart);
assert(sStart>=0&&sEnd>sStart,'state object not found');
const stateText=html.slice(sStart+9,sEnd);
const keys=[...stateText.matchAll(/(?:^|,)([A-Za-z0-9_]+):/g)].map(x=>x[1]);
const chartish=keys.filter(k=>/^(view|level|index|now|analysis|componentsExpanded|hiddenComponents|geometryRAF25|v2RenderSeq|priorV2|lineage|activeAnalysis)/.test(k));
if(keys.includes('h')&&!chartish.includes('h'))chartish.push('h');
const missing=chartish.filter(k=>!m.stateKeys.includes(k));
assert.deepEqual(missing,[],`unmapped chart-related S keys: ${missing.join(', ')}`);
const allowedOwners=new Set(['consumer-adapter','MNChartController','shared-renderer-called-by-controller','consumer-callback','application-shell']);
for(const op of m.operations) assert(allowedOwners.has(op.futureOwner),`unknown future owner: ${op.futureOwner}`);
const requiredOps=['visible series ordering','series resolution','horizon/window','active/focus series','add picker lifecycle','display Fixed/Horizon','representation Indexed/Y1+Y2','crosshair/tooltip','Analyze lifecycle','workspace navigation'];
for(const op of requiredOps) assert(m.operations.some(x=>x.operation===op),`missing operation mapping: ${op}`);
console.log('PASS Stage 1 dependency map',m.operations.length,'operations',m.stateKeys.length,'state keys');
