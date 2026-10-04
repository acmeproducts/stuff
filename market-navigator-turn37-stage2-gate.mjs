import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=fs.readFileSync('market-navigator-turn28-post-ship.html','utf8');
const cand=fs.readFileSync('market-navigator-turn37-stage2-shadow.html','utf8');
const begin='/* TURN37_STAGE2_SHADOW_BEGIN',end='/* TURN37_STAGE2_SHADOW_END */';
const i=cand.indexOf(begin),j=cand.indexOf(end,i);
assert(i>=0&&j>i,'shadow block missing');
const stripped=cand.slice(0,i)+cand.slice(j+end.length).replace(/^\n\n/,'');
assert.equal(stripped,base,'Stage 2 candidate changes accepted bytes outside shadow insertion');
const block=cand.slice(i,j+end.length);
for(const banned of ['S.h','S.index','S.now','S.analysis','renderV2(','renderStandaloneAnalysis26(','sourceSet25(','sourceSetStandalone26(','draw(','setNowFooter(','renderNowPicker25(','renderAnalysisPicker26(']){
  const controllerOnly=block.slice(0,block.indexOf('window.MNChartController37=MNChartController37;'));
  assert(!controllerOnly.includes(banned),'controller depends on banned legacy/app state: '+banned);
}
assert(block.includes('window.MNChartController37=MNChartController37'));
assert(block.includes('function attach(')&&block.includes('async function resolve('));
console.log('PASS Stage 2 source isolation');
