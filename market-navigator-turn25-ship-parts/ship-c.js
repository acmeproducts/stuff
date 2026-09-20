
/* ===================== Turn 25 Ship — deterministic Derived Model Health =====================
   Model Health answers "how stable/concentrated/reproducible is this governed composite", and is kept
   strictly separate from Sources / Data Health, which answers "can the observations be trusted".
   Every measurement below is recomputed from the governed arithmetic; none is inherited from source status. */
function mnxSeriesStats(id){
  let s=S.series[id];
  if(!s||!Array.isArray(s.observations)||s.observations.length<4)return null;
  let obs=s.observations.slice().sort((a,b)=>(+a.t)-(+b.t)),rets=[];
  for(let i=1;i<obs.length;i++){let p=+obs[i-1].v,c=+obs[i].v;if(Number.isFinite(p)&&Number.isFinite(c)&&p!==0)rets.push((c/p)-1)}
  if(rets.length<3)return null;
  let mean=rets.reduce((a,x)=>a+x,0)/rets.length,
      sd=Math.sqrt(rets.reduce((a,x)=>a+(x-mean)*(x-mean),0)/(rets.length-1)),
      abs=rets.map(Math.abs).sort((a,b)=>a-b),
      p95=abs[Math.max(0,Math.min(abs.length-1,Math.round(0.95*(abs.length-1))))];
  return{observationCount:obs.length,returnCount:rets.length,sd:sd,p95:p95,
    firstObservation:new Date(+obs[0].t).toISOString().slice(0,10),
    lastObservation:new Date(+obs[obs.length-1].t).toISOString().slice(0,10),
    sourceRevision:s.sourceRevision||'',cadence:s.cadence||''};
}
function mnxModelHealth(k,h){
  let man=mnxManifest(k),r=mnxRecord(k,h);
  r.fingerprint=mnxRecordFingerprint(r);
  let dataHealth=man.components.map(c=>({componentId:c.id,displayName:c.name,classification:c.dataHealth,expectedCadence:c.expectedCadence,transform:c.transform,transformScale:c.transformScale,transformScaleRule:c.transformScaleRule,role:c.role,direction:c.direction,ratioEligible:c.ratioEligible,ratioIneligibleReason:c.ratioIneligibleReason})),
      dataHealthCurrent=dataHealth.filter(c=>c.classification==='current').length,
      base={schema:'market-navigator-model-health-v1',modelId:k,shortName:man.shortName,modelName:man.modelName,
        horizon:h,purpose:man.purpose,definitionVersion:man.definitionVersion,modelHash:man.modelHash,
        evidenceRevision:man.evidenceRevision,evidenceGeneratedAt:man.evidenceGeneratedAt,
        catalogVersion:man.catalogVersion,validationTimestamp:man.validationTimestamp,
        dataHealth:{components:dataHealth,currentCount:dataHealthCurrent,definedCount:dataHealth.length,
          note:'Source / Data Health is reported separately from Model Health and is never treated as evidence that the derived model is healthy.'},
        explanationFingerprint:r.fingerprint,record:r};
  if(r.status==='UNAVAILABLE'||!r.components.length)
    return Object.assign({},base,{lifecycle:'SUSPENDED',lifecycleReason:r.statusReason||'Mandatory governed evidence is unavailable at this horizon.',
      replication:r.replication,reconciliation:r.reconciliation,
      componentsRequired:man.componentsDefined,componentsAvailable:0,componentCoverage:0,
      weightTotal:0,weightTotalValid:false,concentration:null,sensitivity:null,leaveOneOut:null,
      directionStability:null,specificationRobustness:null,attributionCoverage:mnxAttributionCoverage(k)});
  let comps=r.components,n=comps.length,oriented=comps.map(c=>c.orientedIndex),
      canonicalMove=r.indexMovementPercent,
      contribAbs=comps.map(c=>Math.abs(c.indexContributionPercentPoints)),
      totalAbs=contribAbs.reduce((a,x)=>a+x,0),
      shares=contribAbs.map(x=>totalAbs?x/totalAbs:0),
      order=shares.map((s,i)=>({i:i,s:s})).sort((a,b)=>b.s-a.s),
      hhi=shares.reduce((a,x)=>a+x*x,0),
      largest=comps[order[0].i],
      weightTotal=comps.reduce((a,c)=>a+c.weight,0);
  /* Leave-one-component-out under the governed renormalisation rule (arithmetic mean of remaining available components) */
  let loo=comps.map((c,i)=>{
        if(n<2)return{componentId:c.componentId,displayName:c.displayName,applicable:false,recomputedIndexValue:null,impactPercentPoints:null,directionPreserved:null};
        let rest=oriented.filter((_,j)=>j!==i),v=rest.reduce((a,x)=>a+x,0)/rest.length,move=v-r.baselineIndexValue;
        return{componentId:c.componentId,displayName:c.displayName,applicable:true,recomputedIndexValue:v,
          impactPercentPoints:v-r.endIndexValue,recomputedMovementPercent:move,
          directionPreserved:Math.abs(canonicalMove)<0.005?true:(move>0)===(canonicalMove>0)};
      }),
      looApplicable=loo.filter(x=>x.applicable),
      maxLoo=looApplicable.length?looApplicable.reduce((a,x)=>Math.max(a,Math.abs(x.impactPercentPoints)),0):0,
      directionStable=looApplicable.length?looApplicable.filter(x=>x.directionPreserved).length/looApplicable.length:1;
  /* Explicitly enumerated nearby specifications. The canonical index is never replaced or haircut. */
  let specs=[];
  comps.forEach((c,i)=>{
    [1.25,0.8].forEach(f=>{
      let ws=comps.map((_,j)=>j===i?f:1),den=ws.reduce((a,x)=>a+x,0),
          v=oriented.reduce((a,x,j)=>a+x*ws[j],0)/den,move=v-r.baselineIndexValue;
      specs.push({specification:`relative-weight-perturbation ${f}x on ${c.displayName}`,recomputedIndexValue:v,
        recomputedMovementPercent:move,directionPreserved:Math.abs(canonicalMove)<0.005?true:(move>0)===(canonicalMove>0)});
    });
  });
  looApplicable.forEach(x=>specs.push({specification:`omit ${x.displayName} (governed renormalisation)`,recomputedIndexValue:x.recomputedIndexValue,recomputedMovementPercent:x.recomputedMovementPercent,directionPreserved:x.directionPreserved}));
  let robustness=specs.length?specs.filter(x=>x.directionPreserved).length/specs.length:1;
  /* Standardised sensitivity: component-scaled shocks (±1 historical SD and historical p95 absolute move),
     never a uniform +-10% raw shock across heterogeneous series. Requires canonical component history. */
  let sens=comps.map(c=>{
        if(c.transform==='signed_level_sd')return{componentId:c.componentId,displayName:c.displayName,available:false,reason:'Signed-series sensitivity requires level-difference volatility diagnostics; return-based sensitivity is intentionally not substituted.',oneSdShockPercent:null,oneSdIndexImpactPercentPoints:null,p95ShockPercent:null,p95IndexImpactPercentPoints:null};
        let st=mnxSeriesStats(c.componentId);
        if(!st)return{componentId:c.componentId,displayName:c.displayName,available:false,
          reason:'Canonical component history is not loaded; standardized sensitivity is not estimated.',
          oneSdShockPercent:null,oneSdIndexImpactPercentPoints:null,p95ShockPercent:null,p95IndexImpactPercentPoints:null};
        let unit=c.transform==='signed_level_sd'?(c.direction/((Number.isFinite(c.transformScale)&&c.transformScale>0)?c.transformScale:1))/n:(c.direction*(c.endValue/c.baselineValue)*100)/n; /* governed transform response */
        return{componentId:c.componentId,displayName:c.displayName,available:true,
          historyObservations:st.observationCount,historyFrom:st.firstObservation,historyTo:st.lastObservation,
          oneSdShockPercent:st.sd*100,oneSdIndexImpactPercentPoints:c.transform==='signed_level_sd'?null:unit*st.sd,
          p95ShockPercent:st.p95*100,p95IndexImpactPercentPoints:c.transform==='signed_level_sd'?null:unit*st.p95,
          shockDefinition:'End-value multiplicative shock of +1 historical standard deviation (and historical 95th-percentile absolute move) of the component own observation-to-observation returns, recomputed through the governed composite.'};
      }),
      sensAvailable=sens.filter(x=>x.available),
      maxSens=sensAvailable.length?sensAvailable.reduce((a,x)=>Math.max(a,Math.abs(x.oneSdIndexImpactPercentPoints)),0):null,
      coverage=r.componentCoverage,
      lifecycle,lifecycleReason;
  if(r.replication.result!=='PASS'){lifecycle='SUSPENDED';lifecycleReason='Governed formula could not be independently replicated within tolerance.'}
  else if(Math.abs(r.reconciliation.residual)>MNX_RECONCILE_TOL){lifecycle='SUSPENDED';lifecycleReason='Contribution attribution does not reconcile to the governed index movement.'}
  else if(coverage<MNX_COVERAGE_DEGRADED){lifecycle='DEGRADED';lifecycleReason=`Only ${r.componentsUsed} of ${r.componentsDefined} defined components are structurally eligible at this horizon.`}
  else if(coverage<1||shares[order[0].i]>MNX_CONCENTRATION_WATCH||directionStable<1||robustness<1){
    lifecycle='WATCH';
    lifecycleReason=[coverage<1?`component coverage ${r.componentsUsed}/${r.componentsDefined}`:'',
      shares[order[0].i]>MNX_CONCENTRATION_WATCH?`largest contribution share ${(shares[order[0].i]*100).toFixed(1)}%`:'',
      directionStable<1?`direction stability ${(directionStable*100).toFixed(1)}%`:'',
      robustness<1?`specification robustness ${(robustness*100).toFixed(1)}%`:''].filter(Boolean).join('; ');
  }
  else{lifecycle='ACTIVE';lifecycleReason='Replication, reconciliation, coverage, concentration, direction stability and specification robustness all satisfy governed thresholds.'}
  return Object.assign({},base,{
    lifecycle:lifecycle,lifecycleReason:lifecycleReason,
    replication:r.replication,reconciliation:r.reconciliation,
    componentsRequired:man.componentsDefined,componentsAvailable:n,componentCoverage:coverage,
    coverageStatus:r.coverageStatus,omitted:r.omitted,
    weightTotal:weightTotal,weightTotalValid:Math.abs(weightTotal-1)<=1e-9,
    concentration:{largestComponentId:largest.componentId,largestComponentName:largest.displayName,
      largestContributionPercentPoints:largest.indexContributionPercentPoints,
      largestContributionShare:shares[order[0].i],
      topTwoShare:order.slice(0,2).reduce((a,x)=>a+x.s,0),
      herfindahl:hhi,effectiveComponentCount:hhi?1/hhi:null},
    sensitivity:{available:sensAvailable.length,required:n,maxOneSdIndexImpactPercentPoints:maxSens,
      note:sensAvailable.length===n?'Standardized sensitivity computed from canonical component history.':'Standardized sensitivity is reported only for components whose canonical history is loaded; missing values are not estimated.',
      components:sens},
    leaveOneOut:{maxImpactPercentPoints:maxLoo,components:loo},
    directionStability:directionStable,
    specificationRobustness:robustness,
    specifications:specs,
    attributionCoverage:mnxAttributionCoverage(k),
    thresholds:{reconciliationTolerancePp:MNX_RECONCILE_TOL,replicationTolerance:MNX_REPLICATION_TOL,
      concentrationWatchShare:MNX_CONCENTRATION_WATCH,coverageDegradedBelow:MNX_COVERAGE_DEGRADED},
    backtestNote:'Purpose is DESCRIPTIVE. Forecast-accuracy metrics are deliberately not reported; a descriptive composite is not evaluated as a forecasting model.'});
}
function mnxAttributionCoverage(k){
  let blocks=(S.derived&&S.derived.indices&&S.derived.indices[k]&&S.derived.indices[k].horizons)||{};
  return H.filter(h=>blocks[h]).map(h=>{
    let r=mnxRecord(k,h);
    return{horizon:h,status:r.status,componentsUsed:r.componentsUsed||0,componentsDefined:r.componentsDefined,
      coverage:r.componentCoverage||0,replication:r.replication?r.replication.result:'N/A',
      residual:r.reconciliation?r.reconciliation.residual:null};
  });
}
function mnxModelHealthSnapshot(state){
  let h=(state&&state.horizon)||S.h,ids=state?mnxScopeIndices(state):IDX,list=(ids.length?ids:IDX).map(k=>mnxModelHealth(k,h));
  return{schema:'market-navigator-model-health-set-v1',horizon:h,scope:ids,models:list,
    modelDefinitionVersion:(S.def&&S.def.version)||'',evidenceRevision:(S.derived&&S.derived.revision)||'',
    computedAt:new Date().toISOString(),
    fingerprint:mnxHash(JSON.stringify([h,list.map(m=>[m.modelId,m.lifecycle,m.explanationFingerprint])])),
    note:'Derived Model Health is computed from governed arithmetic and is independent of Sources / Data Health.'};
}
