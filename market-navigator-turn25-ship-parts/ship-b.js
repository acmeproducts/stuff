function mnxRecordMarkdown(r){
  let s=`## ${r.shortName} — ${r.horizon}\n\n`;
  if(r.status==='UNAVAILABLE'){
    s+=`**Attribution unavailable**\n\n${r.statusReason}\n\nMissing prerequisite: \`${r.missingPrerequisite||'governed component evidence'}\`.\n\nNo contribution values have been estimated, forward-filled or inferred.\n\nModel definition ${r.modelDefinitionVersion||'—'} (${r.modelHash}) · evidence revision ${r.evidenceRevision||'—'}\n`;
    return s;
  }
  s+=`**Index movement: ${mnxPct(r.indexMovementPercent)}**\n\n`;
  s+=`${r.shortName} (${r.indexName}) moved from **${mnxNum(r.baselineIndexValue)} → ${mnxNum(r.endIndexValue)}** over the selected ${r.horizon} horizon (${r.baselineDate} → ${r.endDate}).\n\n`;
  s+=`| Component | Weight | Direction | Observation dates | Component movement | ${r.shortName} impact |\n|---|---:|---:|---|---:|---:|\n`;
  r.components.forEach(c=>{
    s+=`| ${c.displayName} | ${mnxNum(c.weight*100,1)}% | ${c.direction>0?'+1':'−1'} | ${c.baselineObservationDate||'—'} → ${c.endObservationDate||'—'} | ${mnxNum(c.baselineValue,4)} → ${mnxNum(c.endValue,4)} · ${mnxPct(c.rawMovementPercent)} | ${mnxPp(c.indexContributionPercentPoints)} |\n`;
  });
  s+=`| **${r.shortName} total** | **100.0%** | | | | **${mnxPp(r.reconciliation.summedContribution)}** |\n\n`;
  if(r.omitted&&r.omitted.length){
    s+=`**Omitted components (${r.componentsDefined-r.componentsUsed} of ${r.componentsDefined}) — excluded by governed rule, not estimated:**\n\n`;
    r.omitted.forEach(o=>{s+=`- **${o.displayName}** — ${o.reason}\n`});
    s+=`\n`;
  }
  let stale=(r.components||[]).filter(c=>c.noNewReleaseInHorizon||!c.observationAlignedToAnchor);
  if(stale.length){
    s+=`**Observation alignment:** the following components carry their most recent real observation at or before the common anchor; no synthetic observation was written and nothing was restamped to the horizon boundary:\n\n`;
    stale.forEach(c=>{s+=`- ${c.displayName} — latest real observation ${c.endObservationDate||'—'} against common anchor ${c.horizonEndDate||'—'}${c.noNewReleaseInHorizon?' (no new release in horizon)':''}\n`});
    s+=`\n`;
  }
  s+=`**In simple terms:** ${mnxPlain(r)}\n\n`;
  s+=`Calculation status: **${r.status}** · coverage ${r.componentsUsed}/${r.componentsDefined} (${r.coverageStatus}) · formula replication ${r.replication.result} (max component error ${r.replication.maxComponentError.toExponential(2)}, index error ${r.replication.indexError.toExponential(2)}) · reconciliation residual ${mnxPp(r.reconciliation.residual,6)} against tolerance ±${r.reconciliation.tolerance} pp · evidence revision ${r.evidenceRevision||'—'} · model definition ${r.modelDefinitionVersion||'—'} (${r.modelHash})\n\n`;
  s+=`Weighting rule: ${r.weightingRule}. ${r.renormalizationRule}\n\nComponent transform: \`${r.componentFormula}\`\n\nIndex: \`${r.indexFormula}\`\n`;
  if(r.status!=='RECONCILED')s+=`\n${r.statusReason}\n`;
  return s;
}
function mnxExplain(state){
  let ids=mnxScopeIndices(state),horizon=(state&&state.horizon)||S.h,
      records=ids.map(k=>{let r=mnxRecord(k,horizon);r.fingerprint=mnxRecordFingerprint(r);return r}),
      markdown=records.length?records.map(mnxRecordMarkdown).join('\n---\n\n'):'';
  return{schema:'market-navigator-index-explanation-set-v1',horizon:horizon,scope:ids,
    lineage:(state&&state.lineage)||'',applicable:records.length>0,
    records:records,markdown:markdown,
    fingerprint:mnxHash(JSON.stringify([horizon,(state&&state.lineage)||'',records.map(r=>r.fingerprint)])),
    evidenceRevision:(S.derived&&S.derived.revision)||'',
    modelDefinitionVersion:(S.def&&S.def.version)||'',
    computedAt:new Date().toISOString(),
    provenance:'Deterministic governed arithmetic computed from canonical derived-index evidence. Not generated, estimated or altered by AI.',
    note:records.length?'':'No governed composite index is within the frozen analytical scope. No index explanation is applicable and none has been fabricated.'};
}
function mnxRenderMarkdown(md){
  if(!md)return '';
  try{return DOMPurify.sanitize(marked.parse(md))}catch(e){return `<pre>${esc(md)}</pre>`}
}
function mnxSetModalStatus(t){let el=$('mnxStatus');if(el)el.textContent=t||''}
function mnxOpenExplanation(){
  let state=S.nowChartState?nowAnalysisState():null,snap=mnxExplain(state);
  mnxExplanationFrozen=snap;
  let modal=$('mnxModal'),body=$('mnxBody'),btn=$('indexInfoBtn');
  $('mnxHorizon').textContent=snap.horizon;
  if(snap.applicable){
    body.innerHTML=`<div class="mnxTableWrap">${mnxRenderMarkdown(snap.markdown)}</div>`;
  }else{
    body.innerHTML=`<h2>Attribution not applicable</h2><p>${esc(snap.note)}</p><p class="mnxNote">Current analytical scope: ${esc((state&&state.lineage)||'—')}. Raw and component series are shown as plain relative rebasing; no composite index explanation has been fabricated for them.</p>`;
  }
  mnxSetModalStatus(snap.applicable?`${snap.records.length} governed index record${snap.records.length===1?'':'s'} · fingerprint ${snap.fingerprint}`:'No governed composite index in scope.');
  mnxLastFocus=document.activeElement;
  modal.hidden=false;
  if(btn)btn.setAttribute('aria-expanded','true');
  let close=$('mnxClose');if(close)close.focus();
  return snap;
}
function mnxCloseExplanation(){
  let modal=$('mnxModal'),btn=$('indexInfoBtn');
  if(!modal||modal.hidden)return;
  modal.hidden=true;
  if(btn)btn.setAttribute('aria-expanded','false');
  let back=(mnxLastFocus&&document.contains(mnxLastFocus))?mnxLastFocus:btn;
  if(back&&back.focus)back.focus();
  mnxLastFocus=null;
}
function mnxCurrentMarkdown(){return mnxExplanationFrozen?mnxExplanationFrozen.markdown:''}
function mnxCopyExplanation(){
  let md=mnxCurrentMarkdown();
  if(!md){mnxSetModalStatus('No governed explanation is in scope to copy.');return Promise.resolve(false)}
  let done=ok=>{mnxSetModalStatus(ok?'Markdown copied to clipboard.':'Clipboard unavailable — use Download MD.');return ok};
  try{
    if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(md).then(()=>done(true),()=>done(false));
  }catch(e){}
  return Promise.resolve(done(false));
}
function mnxDownloadExplanation(){
  let md=mnxCurrentMarkdown();
  if(!md){mnxSetModalStatus('No governed explanation is in scope to download.');return false}
  let hz=(mnxExplanationFrozen&&mnxExplanationFrozen.horizon||S.h||'').toLowerCase();
  downloadBlob(`market-navigator-index-explanation-${hz}.md`,'text/markdown',md+'\n');
  mnxSetModalStatus('Markdown downloaded.');
  return true;
}
