
/* ===================== Turn 25 Ship — HEALTH: Sources | Derived Models ===================== */
function mnxLifeColor(l){return l==='ACTIVE'?'var(--good)':l==='SUSPENDED'?'var(--bad)':l==='DEGRADED'?'var(--bad)':'var(--accent)'}
function mnxEnsureHealthTabs(){
  let host=$('healthRows');if(!host||!host.parentNode)return null;
  let bar=$('mnxHealthTabs');
  if(!bar){
    bar=document.createElement('div');bar.id='mnxHealthTabs';bar.className='mnxHealthTabs';bar.setAttribute('role','tablist');
    bar.innerHTML=`<button class="btn" type="button" role="tab" data-mnx-health="sources">Sources</button><button class="btn" type="button" role="tab" data-mnx-health="models">Derived Models</button><button class="btn" type="button" role="tab" data-mnx-health="glossary">Glossary</button>`;
    host.parentNode.insertBefore(bar,host);
    bar.addEventListener('click',e=>{let b=e.target.closest('[data-mnx-health]');if(!b)return;mnxHealthTab=b.dataset.mnxHealth;mnxRenderHealth()});
  }
  bar.querySelectorAll('[data-mnx-health]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.mnxHealth===mnxHealthTab)));
  return bar;
}
function mnxGlossaryHtml(){
 const terms=[
  ['Formula replication','Can Market Navigator independently reproduce the published derived-index value from the governed component arithmetic?','A failure means the model calculation cannot be trusted and is suspended.'],
  ['Components available','How many defined model components can participate truthfully at the selected horizon.','Missing components reduce coverage. Governed fallback renormalizes remaining eligible components; Health remains WATCH/DEGRADED as appropriate.'],
  ['Reconciliation residual','Difference between the index movement and the sum of component contributions.','Near zero means the explanation accounts for the index movement. A material residual suspends the model.'],
  ['Concentration share','Share of absolute index movement attributable to the largest component (and top two).','High concentration means the current index move is being driven by very few factors even if all components are present.'],
  ['Effective components','Diversification implied by current contribution shares (inverse Herfindahl concentration).','A value near 1 means the index currently behaves like roughly one dominant factor; larger values indicate broader participation.'],
  ['Leave-one-out impact','How much the index changes when one component is removed and the remaining governed weights are renormalized.','Large impact means the result depends heavily on that component.'],
  ['Direction stability','Fraction of leave-one-out tests that preserve the sign of the canonical index move.','Below 100% means the directional conclusion depends on component inclusion.'],
  ['Specification robustness','Fraction of governed nearby weighting diagnostics that preserve the direction of the canonical move.','It tests fragility only; it never replaces or changes the canonical model.'],
  ['Standardized sensitivity','Model response to component-scaled historical shocks.','Large values identify components to which the index is unusually sensitive. Missing sensitivity is never estimated.'],
  ['Yield Curve factor','MAC first-class factor combining the governed 10Y−2Y and 10Y−3M Treasury spreads.','When both are eligible it carries 2/7 (28.6%) of canonical MAC weight. INVERTED means at least one current spread is below zero; visibility does not dynamically change weight.'],
  ['Data Health','Whether canonical source observations are current and usable.','Good Data Health does not prove the derived model is healthy; model construction is assessed separately.'],
  ['ACTIVE / WATCH / DEGRADED / SUSPENDED','Derived-model lifecycle from governed tests.','ACTIVE is healthy; WATCH flags material diagnostics; DEGRADED means the model remains calculable but incomplete/compromised; SUSPENDED means it should not be treated as a valid model output.']
 ];
 let models=IDX.map(k=>mnxManifest(k));
 return '<div class="mnxGlossary"><h3>Health terminology</h3><div class="mnxTableWrap"><table><thead><tr><th>Term</th><th>What it is</th><th>Why it matters</th></tr></thead><tbody>'+terms.map(x=>'<tr><td><strong>'+esc(x[0])+'</strong></td><td>'+esc(x[1])+'</td><td>'+esc(x[2])+'</td></tr>').join('')+'</tbody></table></div><h3>Model components</h3>'+models.map(m=>'<h4>'+esc(m.shortName)+' — '+esc(m.modelName)+'</h4><div class="mnxTableWrap"><table><thead><tr><th>Component</th><th>What / relevance</th><th>Direction</th><th>Transform</th><th>Current implication</th><th>Acquisition</th></tr></thead><tbody>'+m.components.map(c=>{let current=c.dataHealth==='current'?'Source current. ':('Source '+c.dataHealth+'. '),participates=c.transform==='signed_level_sd'?'Zero-crossing safe: additive change standardized by canonical historical level SD; remains eligible across inversion/uninversion.':(c.ratioEligible?'Ratio-rebased when horizon evidence is available.':'Currently structurally excluded: '+(c.ratioIneligibleReason||'ratio transform unavailable')+'. Remaining eligible weights renormalize automatically; model coverage falls.');let provider='';try{let z=cat(c.id);provider=(z.provider||'')+(z.provider==='FRED'?' · public CSV · authentication none':'')}catch(e){}return '<tr><td><strong>'+esc(c.name)+'</strong><br><span class="mnxNote">'+esc(c.expectedCadence||'—')+'</span></td><td>'+esc(c.role||'Governed component')+'</td><td>'+(c.direction>0?'+1':'−1')+'</td><td>'+esc(c.transform||'ratio')+(c.transformScale?'<br><span class="mnxNote">scale '+mnxNum(c.transformScale,4)+'</span>':'')+'</td><td>'+esc(current+participates)+'</td><td>'+esc(provider||'canonical provider')+'</td></tr>'}).join('')+'</tbody></table></div>').join('')+'<p class="mnxNote">FRED macro series are currently collected through FRED public chart CSV endpoints; Market Navigator does not require a FRED API key for this acquisition path.</p></div>';
}
function mnxSensitivityCell(m){
  let s=m.sensitivity;
  if(!s||!s.available)return 'Not loaded';
  return `${mnxPp(s.maxOneSdIndexImpactPercentPoints)} (max, ±1 SD)`;
}
function mnxModelCardHtml(m){
  let r=m.record,cov=`${m.componentsAvailable}/${m.componentsRequired}`,yc=r.factorDiagnostics&&r.factorDiagnostics.yieldCurve;
  return `<article class="mnxModelCard" data-mnx-model="${esc(m.modelId)}">
  <h3>${esc(m.shortName)} — ${esc(m.modelName)}<span class="mnxLife" style="color:${mnxLifeColor(m.lifecycle)}">${esc(m.lifecycle)}</span></h3>
  <div class="mnxModelMeta">${esc(m.purpose)} · definition ${esc(m.definitionVersion)} (${esc(m.modelHash)}) · evidence ${esc(m.evidenceRevision)} · validated ${esc(m.validationTimestamp||'—')} · horizon ${esc(m.horizon)}</div>
  <p class="mnxNote">${esc(m.lifecycleReason)}</p>
  ${m.modelId==='macro'&&yc?`<section class="mnxYieldCurve" data-mnx-yield-curve><h4>Yield Curve — ${esc(yc.state||yc.status)}</h4><div class="mnxGrid"><div class="mnxMetric">Canonical MAC weight<b>${mnxNum((yc.canonicalWeight||0)*100,1)}%</b></div><div class="mnxMetric">10Y−2Y<b>${Number.isFinite(yc.levels&&yc.levels.curve10y2y)?mnxNum(yc.levels.curve10y2y,2)+' pp':'—'}</b></div><div class="mnxMetric">10Y−3M<b>${Number.isFinite(yc.levels&&yc.levels.curve10y3m)?mnxNum(yc.levels.curve10y3m,2)+' pp':'—'}</b></div><div class="mnxMetric">MAC contribution<b>${Number.isFinite(yc.contributionPercentPoints)?mnxPp(yc.contributionPercentPoints):'—'}</b></div></div><p class="mnxNote">INVERTED means at least one governed spread is below zero. Weight is governed and does not increase dynamically during inversion.</p></section>`:''}
  <div class="mnxGrid">
   <div class="mnxMetric">Formula replication<b>${esc(m.replication?m.replication.result:'—')}</b></div>
   <button class="mnxMetric mnxMetricButton" type="button" data-mnx-coverage="${esc(m.modelId)}">Components available<b>${esc(cov)} (${esc(m.coverageStatus||'—')})</b></button>
   <div class="mnxMetric">Weight total<b>${m.weightTotalValid?'1.000 valid':'invalid'}</b></div>
   <div class="mnxMetric">Reconciliation residual<b>${m.reconciliation?mnxPp(m.reconciliation.residual,6):'—'}</b></div>
   <div class="mnxMetric">Largest contribution<b>${m.concentration?esc(m.concentration.largestComponentName)+' '+mnxPp(m.concentration.largestContributionPercentPoints):'—'}</b></div>
   <div class="mnxMetric">Concentration share<b>${m.concentration?mnxNum(m.concentration.largestContributionShare*100,1)+'% · top2 '+mnxNum(m.concentration.topTwoShare*100,1)+'%':'—'}</b></div>
   <div class="mnxMetric">Effective components<b>${m.concentration&&m.concentration.effectiveComponentCount?mnxNum(m.concentration.effectiveComponentCount,2):'—'}</b></div>
   <div class="mnxMetric">Max leave-one-out impact<b>${m.leaveOneOut?mnxPp(m.leaveOneOut.maxImpactPercentPoints):'—'}</b></div>
   <div class="mnxMetric">Direction stability<b>${Number.isFinite(m.directionStability)?mnxNum(m.directionStability*100,1)+'%':'—'}</b></div>
   <div class="mnxMetric">Specification robustness<b>${Number.isFinite(m.specificationRobustness)?mnxNum(m.specificationRobustness*100,1)+'%':'—'}</b></div>
   <div class="mnxMetric">Standardized sensitivity<b>${esc(mnxSensitivityCell(m))}</b></div>
   <div class="mnxMetric">Data Health (separate)<b>${m.dataHealth.currentCount}/${m.dataHealth.definedCount} sources current</b></div>
  </div>
  <details data-mnx-section="components"><summary>Components</summary><div class="mnxTableWrap"><table><thead><tr><th>Component</th><th>Direction</th><th>Cadence</th><th>Governed transform</th><th>Data health</th></tr></thead><tbody>${m.dataHealth.components.map(c=>`<tr><td>${esc(c.displayName)}</td><td>${c.direction>0?'+1':'−1'}</td><td>${esc(c.expectedCadence||'—')}</td><td>${esc(c.transform||'ratio')}${c.transform==='ratio'&&!c.ratioEligible?' — excluded: '+esc(c.ratioIneligibleReason||''):c.transform==='signed_level_sd'?' — zero-crossing safe':''}</td><td>${esc(c.classification)}</td></tr>`).join('')}</tbody></table></div><p class="mnxNote">Source availability above is Data Health. It is not evidence that the derived model is healthy.</p></details>
  <details data-mnx-section="contribution"><summary>Contribution</summary><div class="mnxTableWrap"><table><thead><tr><th>Component</th><th>Weight</th><th>Observation dates</th><th>Movement</th><th>Impact</th></tr></thead><tbody>${(r.components||[]).map(c=>`<tr><td>${esc(c.displayName)}</td><td>${mnxNum(c.weight*100,1)}%</td><td>${esc(c.baselineObservationDate||'—')} → ${esc(c.endObservationDate||'—')}</td><td>${mnxPct(c.rawMovementPercent)}</td><td>${mnxPp(c.indexContributionPercentPoints)}</td></tr>`).join('')}</tbody></table></div>${(m.omitted&&m.omitted.length)?`<p class="mnxNote">Omitted, not estimated: ${m.omitted.map(o=>esc(o.displayName)+' — '+esc(o.reason)).join('; ')}</p>`:''}<p class="mnxNote">Σ contributions ${m.reconciliation?mnxPp(m.reconciliation.summedContribution):'—'} vs governed index movement ${m.reconciliation?mnxPp(m.reconciliation.indexMovement):'—'} · residual ${m.reconciliation?mnxPp(m.reconciliation.residual,6):'—'}</p></details>
  <details data-mnx-section="sensitivity"><summary>Sensitivity</summary>${(m.sensitivity&&m.sensitivity.available)?`<div class="mnxTableWrap"><table><thead><tr><th>Component</th><th>±1 SD shock</th><th>Index impact</th><th>p95 shock</th><th>Index impact</th></tr></thead><tbody>${m.sensitivity.components.map(c=>c.available?`<tr><td>${esc(c.displayName)}</td><td>${mnxNum(c.oneSdShockPercent,3)}%</td><td>${mnxPp(c.oneSdIndexImpactPercentPoints)}</td><td>${mnxNum(c.p95ShockPercent,3)}%</td><td>${mnxPp(c.p95IndexImpactPercentPoints)}</td></tr>`:`<tr><td>${esc(c.displayName)}</td><td colspan="4">${esc(c.reason)}</td></tr>`).join('')}</tbody></table></div>`:'<p class="mnxNote">Standardized sensitivity requires canonical component history. It has not been estimated.</p>'}<p class="mnxNote">Shocks are component-scaled (±1 historical standard deviation and historical 95th-percentile absolute move of each component own returns), never a uniform percentage shock across heterogeneous series.</p><button class="btn" type="button" id="mnxLoadSensitivity">Load standardized sensitivity evidence</button></details>
  <details data-mnx-section="robustness"><summary>Robustness</summary><div class="mnxTableWrap"><table><thead><tr><th>Nearby specification</th><th>Recomputed index</th><th>Movement</th><th>Direction preserved</th></tr></thead><tbody>${(m.specifications||[]).map(s=>`<tr><td>${esc(s.specification)}</td><td>${mnxNum(s.recomputedIndexValue)}</td><td>${mnxPct(s.recomputedMovementPercent)}</td><td>${s.directionPreserved?'yes':'no'}</td></tr>`).join('')}</tbody></table></div><p class="mnxNote">Nearby specifications are diagnostics only. The canonical index is never replaced and no model-risk haircut is applied to it.</p></details>
  <details data-mnx-section="history"><summary>History</summary><div class="mnxTableWrap"><table><thead><tr><th>Horizon</th><th>Attribution status</th><th>Components</th><th>Coverage</th><th>Replication</th><th>Residual</th></tr></thead><tbody>${(m.attributionCoverage||[]).map(a=>`<tr><td>${esc(a.horizon)}</td><td>${esc(a.status)}</td><td>${a.componentsUsed}/${a.componentsDefined}</td><td>${mnxNum(a.coverage*100,1)}%</td><td>${esc(a.replication)}</td><td>${a.residual===null?'—':mnxPp(a.residual,6)}</td></tr>`).join('')}</tbody></table></div><p class="mnxNote">Methodology: ${esc((mnxManifest(m.modelId).methodologyHistory[0]||{}).note||'')} Effective ${esc(mnxManifest(m.modelId).effectiveDate||'—')}. ${esc(m.backtestNote)}</p></details>
 </article>`;
}
async function mnxLoadSensitivityEvidence(){
  let ids={};IDX.forEach(k=>mnxManifest(k).components.forEach(c=>{ids[c.id]=1}));
  await Promise.all(Object.keys(ids).map(id=>getSeries(id).catch(()=>null)));
  mnxSensitivityLoaded=true;
  if(S.view==='health'&&mnxHealthTab==='models')mnxRenderHealth();
  return mnxSensitivityLoaded;
}
function mnxRenderHealth(){
  mnxEnsureHealthTabs();
  let host=$('healthRows');if(!host)return;
  if(mnxHealthTab==='sources'){renderHealth();return}
  if(mnxHealthTab==='glossary'){host.innerHTML=mnxGlossaryHtml();return}
  let h=S.h,models=IDX.map(k=>mnxModelHealth(k,h));
  host.innerHTML=`<p class="mnxNote" id="mnxModelsIntro">Derived Model Health — horizon ${esc(h)} · definition ${esc((S.def&&S.def.version)||'—')} · evidence ${esc((S.derived&&S.derived.revision)||'—')}. This surface measures composite integrity, concentration, sensitivity and stability. It is separate from Sources / Data Health.</p>`+models.map(mnxModelCardHtml).join('');
  host.querySelectorAll('[data-mnx-coverage]').forEach(b=>b.onclick=()=>{let m=models.find(x=>x.modelId===b.dataset.mnxCoverage);if(!m)return;let omitted=(m.omitted||[]).map(o=>o.displayName+' — '+o.reason).join('; ');alert(m.shortName+' uses '+m.componentsAvailable+' of '+m.componentsRequired+' defined components at '+m.horizon+'. '+(omitted?('Excluded: '+omitted+'. '):'No components are excluded. ')+'Remaining eligible components are renormalized to 100%. Current lifecycle: '+m.lifecycle+'. '+m.lifecycleReason)});
  let load=$('mnxLoadSensitivity');
  if(load)host.querySelectorAll('#mnxLoadSensitivity').forEach(b=>{b.onclick=()=>{b.disabled=true;b.textContent='Loading canonical component history…';mnxLoadSensitivityEvidence()}});
}

/* ===================== Turn 25 Ship — frozen analytical state enrichment ===================== */
function mnxShipState(state){
  if(!state)return state;
  let explanation=mnxExplain(state),health=mnxModelHealthSnapshot(state);
  state.indexExplanation=explanation;
  state.modelHealth=health;
  state.explanationFingerprint=explanation.fingerprint;
  return state;
}

/* ===================== Turn 25 Ship — dedicated NOW Chart Report =====================
   Same accepted architecture as the qualified Library Analysis Report: freeze state, build a dedicated
   report surface, embed the exact frozen chart, make the report print-visible, invoke native print once,
   clean up. The interactive viewport is never printed and NOW state is never mutated or refetched. */
function mnxNowContextRows(state){
  let chart=state.chart||{},win=chart.window||{},
      series=(chart.series||[]).map(x=>x.label||x.id).filter(Boolean),
      rev=chart.dataRevision||{},
      ex=state.indexExplanation||null,
      rows=[['Context',state.lineage||'ENV'],
        ['Scope',state.root?`Governed index ${AB[state.root]||state.root}`:'Environment composite'],
        ['Horizon',chart.horizon||state.horizon||'—'],
        ['Visible date range',`${win.startLabel||'—'} → ${win.endLabel||'—'}`],
        ['Representation',chart.mode==='dual'?'Dual axis (native)':chart.mode==='indexed'?'Indexed 100':chart.mode==='native'?'Native Y1':(chart.mode||'—')],
        ['Visible series',series.length?series.join(' · '):'—'],
        ['Evidence revision',rev.derived||'—'],
        ['Evidence generated',rev.derivedGeneratedAt||'—'],
        ['Catalog version',rev.catalog||'—'],
        ['Model definition',(ex&&ex.modelDefinitionVersion)||(S.def&&S.def.version)||'—'],
        ['Governed indices in scope',ex&&ex.scope.length?ex.scope.map(k=>AB[k]||k).join(' · '):'none'],
        ['Explanation identity',ex&&ex.applicable?ex.fingerprint:'not applicable'],
        ['Report generated',new Date().toISOString()]];
  return rows;
}
function mnxBuildNowPrintReport(stateOverride){
  let canvas=$('nowChart');
  if(!canvas||!canvas.width||!canvas.height)throw new Error('The NOW chart is not rendered.');
  let state=mnxShipState(stateOverride||nowAnalysisState()),
      r=$('nowPrintReport');
  if(!r)throw new Error('NOW report surface is unavailable.');
  $('nowPrintTitle').textContent=`${state.lineage||'ENV'} · ${state.horizon||S.h}`;
  let dl=$('nowPrintContext');dl.replaceChildren();
  for(let [k,v] of mnxNowContextRows(state)){let dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=k;dd.textContent=String(v);dl.append(dt,dd)}
  $('nowPrintChart').src=canvas.toDataURL('image/png');
  let ex=state.indexExplanation,body=$('nowPrintExplanation');
  if(ex&&ex.applicable)body.innerHTML=`<h2>Index Movement Explanation</h2>${mnxRenderMarkdown(ex.markdown)}`;
  else body.innerHTML=`<h2>Index Movement Explanation</h2><p>${esc(ex?ex.note:'No governed composite index is within this analytical scope.')}</p>`;
  r.setAttribute('aria-hidden','false');
  document.documentElement.classList.add('mnx-now-print');
  return{context:state.lineage||'ENV',horizon:state.horizon||S.h,
    explanationFingerprint:ex&&ex.applicable?ex.fingerprint:null,
    governedIndices:ex?ex.scope.slice():[],
    seriesCount:((state.chart||{}).series||[]).length,state:state};
}
function mnxCleanupNowPrint(){
  let r=$('nowPrintReport');if(!r)return;
  r.setAttribute('aria-hidden','true');
  $('nowPrintTitle').textContent='';
  $('nowPrintContext').replaceChildren();
  $('nowPrintChart').removeAttribute('src');
  $('nowPrintExplanation').replaceChildren();
  document.documentElement.classList.remove('mnx-now-print');
}
async function mnxPrintNow(stateOverride){
  let beforeJson=S.nowChartState?JSON.stringify(S.nowChartState):null,
      built=mnxBuildNowPrintReport(stateOverride),
      img=$('nowPrintChart');
  if(img&&img.getAttribute('src')){
    try{
      if(img.decode)await img.decode();
      else if(!img.complete)await new Promise((res,rej)=>{img.onload=res;img.onerror=rej});
    }catch(e){mnxCleanupNowPrint();throw new Error('The frozen NOW chart could not be prepared for printing.')}
  }
  await new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(res)));
  window.__mnNowPrintInvariant25={context:built.context,horizon:built.horizon,
    explanationFingerprint:built.explanationFingerprint,governedIndices:built.governedIndices,
    chartWidth:img?(img.naturalWidth||0):0,chartHeight:img?(img.naturalHeight||0):0,
    before:beforeJson};
  window.print();
  window.__mnNowPrintInvariant25.after=S.nowChartState?JSON.stringify(S.nowChartState):null;
  return window.__mnNowPrintInvariant25;
}
