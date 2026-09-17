
/* ===================== Turn 25 Ship — governed model manifests + canonical Index Explanation =====================
   Arithmetic source of truth: data/market-backend/derived-index-definition.json (display_contract) and
   market-evidence/derived-indices.json. Production construction, proven by replication:
     oriented_index_i = 100 + direction_i * ((value_now_i / value_t0_i) - 1) * 100
     index            = arithmetic mean of oriented_index over the components AVAILABLE at the horizon
   Therefore the governed contribution of component i to index movement is:
     contribution_i   = (oriented_index_i - 100) / componentsUsed
   Equal weighting and 1/n renormalisation are read from the governed definition, never assumed.
   No value on this path is read from chart pixels, estimated, forward-filled or produced by AI. */
const MNX_RECONCILE_TOL=0.005;      /* percentage points */
const MNX_REPLICATION_TOL=1e-6;     /* index points */
const MNX_CONCENTRATION_WATCH=0.5;  /* largest single |contribution| share */
const MNX_COVERAGE_DEGRADED=0.75;
let mnxExplanationFrozen=null;      /* canonical snapshot currently rendered in the modal */
let mnxLastFocus=null;
let mnxHealthTab='sources';
let mnxSensitivityLoaded=false;

function mnxHash(str){let h1=0x811c9dc5>>>0,h2=0x01000193>>>0;for(let i=0;i<str.length;i++){let c=str.charCodeAt(i);h1=Math.imul(h1^c,16777619)>>>0;h2=(Math.imul(h2+c+1,2246822519)>>>0)^(h1>>>7)}return h1.toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0')}
function mnxNum(v,d=2){return Number.isFinite(+v)?(+v).toFixed(d):'—'}
function mnxSigned(v,d,suffix){return Number.isFinite(+v)?`${+v>0?'+':''}${(+v).toFixed(d)}${suffix}`:'—'}
function mnxPct(v,d=2){return mnxSigned(v,d,'%')}
function mnxPp(v,d=3){return mnxSigned(v,d,' pp')}
function mnxDefIndex(k){return S.def&&S.def.indices?S.def.indices[k]:null}
function mnxBlock(k,h){let ix=S.derived&&S.derived.indices?S.derived.indices[k]:null;return ix&&ix.horizons?(ix.horizons[h]||null):null}
function mnxCompName(id){try{return name(id)||id}catch(e){return id}}
function mnxCompCadence(id){try{return cat(id).native_cadence||''}catch(e){return ''}}
function mnxCompHealth(id){try{return health(id).classification||'unknown'}catch(e){return 'unknown'}}

function mnxModelHash(k){
  let d=mnxDefIndex(k),dc=(S.def&&S.def.display_contract)||{};
  return mnxHash(JSON.stringify([k,(S.def&&S.def.version)||'',dc.component_formula||'',dc.index_formula||'',dc.weighting||'',((d&&d.components)||[]).map(c=>[c.id,c.direction])]));
}
function mnxManifest(k){
  let d=mnxDefIndex(k),dc=(S.def&&S.def.display_contract)||{},
      elig=(S.derived&&S.derived.ratioEligibility)||{},
      blocks=(S.derived&&S.derived.indices&&S.derived.indices[k]&&S.derived.indices[k].horizons)||{},
      comps=((d&&d.components)||[]).map(c=>{
        let e=elig[c.id]||{};
        return{id:c.id,name:mnxCompName(c.id),role:c.role||'',direction:c.direction,
               expectedCadence:mnxCompCadence(c.id),dataHealth:mnxCompHealth(c.id),
               ratioEligible:e.eligible!==false,ratioIneligibleReason:e.eligible===false?(e.reason||''):null};
      });
  return{schema:'market-navigator-model-manifest-v1',modelId:k,modelName:(d&&d.name)||k,shortName:AB[k]||k,
    purpose:'DESCRIPTIVE',purposeBasis:dc.interpretation_rule||'',
    definitionVersion:(S.def&&S.def.version)||'',definitionStatus:(S.def&&S.def.status)||'',
    effectiveDate:(S.def&&S.def.effective_date)||'',modelHash:mnxModelHash(k),
    higherMeans:(d&&d.higher_means)||'',
    componentFormula:dc.component_formula||'',indexFormula:dc.index_formula||'',weightingRule:dc.weighting||'',
    renormalizationRule:'Each available component carries weight 1/n where n is the number of components available at the horizon; components excluded by the governed ratio-eligibility rule are omitted and the remaining weights renormalise through the arithmetic mean.',
    missingStaleRule:dc.mixed_frequency_rule||'',ratioEligibilityRule:dc.ratio_eligibility_rule||'',
    nonpositiveBaselineRule:dc.nonpositive_baseline_rule||'',
    components:comps,componentsDefined:comps.length,excludedComponents:(d&&d.excluded_components)||[],
    methodologyHistory:[{effectiveDate:(S.def&&S.def.effective_date)||'',definitionVersion:(S.def&&S.def.version)||'',definitionStatus:(S.def&&S.def.status)||'',note:(d&&d.construction_detail)||'Accepted governed definition.'}],
    horizonsAvailable:Object.keys(blocks),
    evidenceRevision:(S.derived&&S.derived.revision)||'',evidenceVersion:(S.derived&&S.derived.version)||'',
    evidenceGeneratedAt:(S.derived&&S.derived.generatedAt)||'',
    catalogVersion:(S.catalog&&S.catalog.version)||'',
    commonMarketAnchor:(S.derived&&S.derived.commonMarketAnchor)||'',
    validationTimestamp:(S.derived&&S.derived.generatedAt)||''};
}
function mnxManifests(){return IDX.map(mnxManifest)}

function mnxRecord(k,h){
  let man=mnxManifest(k),b=mnxBlock(k,h),
      head={schema:'market-navigator-index-explanation-v1',indexId:k,indexName:man.modelName,shortName:man.shortName,
        higherMeans:man.higherMeans,purpose:man.purpose,
        modelDefinitionVersion:man.definitionVersion,modelHash:man.modelHash,
        evidenceRevision:man.evidenceRevision,evidenceGeneratedAt:man.evidenceGeneratedAt,
        horizon:h,componentFormula:man.componentFormula,indexFormula:man.indexFormula,
        weightingRule:man.weightingRule,renormalizationRule:man.renormalizationRule,
        componentsDefined:man.componentsDefined,estimatedValuesUsed:false,derivedFrom:'governed-derived-evidence'};
  if(!b)return Object.assign({},head,{status:'UNAVAILABLE',statusReason:`No governed derived-index evidence exists for ${man.shortName} at horizon ${h}.`,missingPrerequisite:`derived-indices horizon block ${k}.${h}`,componentsUsed:0,components:[],omitted:[],replication:null,reconciliation:null});
  let defMap={};man.components.forEach(c=>{defMap[c.id]=c});
  let raw=(b.components||[]).filter(c=>Number.isFinite(+c.orientedIndex)&&Number.isFinite(+c.moveFrom100)&&Number.isFinite(+c.t0Value)&&Number.isFinite(+c.nowValue)&&+c.t0Value!==0),
      n=raw.length,
      omitted=(b.omitted||[]).map(o=>({componentId:o.id,displayName:mnxCompName(o.id),reason:o.reason||'excluded by governed rule',estimated:false}));
  if(!n)return Object.assign({},head,{status:'UNAVAILABLE',statusReason:`No governed component attribution is available for ${man.shortName} at horizon ${h}.`,missingPrerequisite:'eligible component observations',componentsUsed:0,components:[],omitted:omitted,replication:null,reconciliation:null});
  let w=1/n,anchorNow=b.commonNow||'',anchorT0=b.commonT0||'',
      components=raw.map(c=>{
        let dm=defMap[c.id]||{},contribution=(+c.moveFrom100)*w;
        return{componentId:c.id,displayName:dm.name||mnxCompName(c.id),role:dm.role||'',
          direction:+c.direction,weight:w,weightRule:`1/${n} equal weight over components available at this horizon`,
          transform:man.componentFormula,
          baselineObservationDate:c.sourceT0Date||'',baselineValue:+c.t0Value,
          endObservationDate:c.sourceNowDate||'',endValue:+c.nowValue,
          horizonBaselineDate:c.commonT0||anchorT0,horizonEndDate:c.commonNow||anchorNow,
          observationAlignedToAnchor:(c.sourceNowDate||'')===(c.commonNow||anchorNow),
          rawMovementPercent:(((+c.nowValue)/(+c.t0Value))-1)*100,
          orientedIndex:+c.orientedIndex,orientedMovementPercent:+c.moveFrom100,
          indexContributionPercentPoints:contribution,
          dataHealth:c.health||mnxCompHealth(c.id),
          noNewReleaseInHorizon:!!c.noNewReleaseInHorizon,
          expectedCadence:dm.expectedCadence||mnxCompCadence(c.id),
          sourceRevision:man.evidenceRevision,estimated:false};
      }),
      replicatedOriented=raw.map(c=>100+(+c.direction)*((((+c.nowValue)/(+c.t0Value)))-1)*100),
      maxComponentError=replicatedOriented.reduce((a,v,i)=>Math.max(a,Math.abs(v-(+raw[i].orientedIndex))),0),
      recomputedIndex=replicatedOriented.reduce((a,x)=>a+x,0)/n,
      publishedIndex=+b.value,
      indexError=Math.abs(recomputedIndex-publishedIndex),
      replicationResult=(maxComponentError<=MNX_REPLICATION_TOL&&indexError<=MNX_REPLICATION_TOL)?'PASS':'FAIL',
      summed=components.reduce((a,c)=>a+c.indexContributionPercentPoints,0),
      baselineIndexValue=Number.isFinite(+b.baseline)?+b.baseline:100,
      movement=publishedIndex-baselineIndexValue,
      residual=movement-summed,
      coverage=man.componentsDefined?n/man.componentsDefined:0,
      status,statusReason='';
  if(replicationResult!=='PASS'){status='DEGRADED';statusReason='Independent replication of the governed formula did not reproduce the published index value within tolerance. No contribution has been estimated.'}
  else if(Math.abs(residual)>MNX_RECONCILE_TOL){status='DEGRADED';statusReason='Component contributions do not reconcile to the governed index movement within tolerance. No missing contribution has been estimated.'}
  else{status='RECONCILED'}
  return Object.assign({},head,{
    componentsUsed:n,componentCoverage:coverage,coverageStatus:coverage>=1?'COMPLETE':'PARTIAL',
    baselineDate:anchorT0,endDate:anchorNow,commonMarketAnchor:man.commonMarketAnchor,
    baselineIndexValue:baselineIndexValue,endIndexValue:publishedIndex,indexMovementPercent:movement,
    components:components,omitted:omitted,
    replication:{result:replicationResult,recomputedIndexValue:recomputedIndex,publishedIndexValue:publishedIndex,maxComponentError:maxComponentError,indexError:indexError,tolerance:MNX_REPLICATION_TOL},
    reconciliation:{summedContribution:summed,indexMovement:movement,residual:residual,tolerance:MNX_RECONCILE_TOL},
    evidenceStatus:b.status||'',evidenceReasons:b.reasons||[],
    noNewReleaseComponents:b.noNewReleaseComponents||[],
    status:status,statusReason:statusReason});
}
function mnxRecordFingerprint(r){
  return mnxHash(JSON.stringify([r.indexId,r.horizon,r.modelDefinitionVersion,r.modelHash,r.evidenceRevision,r.status,
    r.baselineDate,r.endDate,r.baselineIndexValue,r.endIndexValue,r.indexMovementPercent,r.componentsUsed,r.componentsDefined,
    (r.components||[]).map(c=>[c.componentId,c.direction,c.weight,c.baselineObservationDate,c.baselineValue,c.endObservationDate,c.endValue,c.orientedIndex,c.indexContributionPercentPoints]),
    (r.omitted||[]).map(o=>[o.componentId,o.reason]),
    r.reconciliation?[r.reconciliation.summedContribution,r.reconciliation.residual]:null]));
}
function mnxScopeIndices(state){
  let out=[],seen={};
  let push=id=>{if(IDX.indexOf(id)>=0&&!seen[id]){seen[id]=1;out.push(id)}};
  if(state){if(state.root)push(state.root);(state.series||[]).forEach(push)}
  return out;
}
function mnxPlain(r){
  if(r.status==='UNAVAILABLE')return `Component attribution is unavailable for ${r.shortName} over this horizon. ${r.statusReason} No contribution has been estimated.`;
  let sorted=(r.components||[]).slice().sort((a,b)=>Math.abs(b.indexContributionPercentPoints)-Math.abs(a.indexContributionPercentPoints)),
      top=sorted[0];
  if(!top)return 'No governed component contribution is available.';
  let totalAbs=sorted.reduce((a,c)=>a+Math.abs(c.indexContributionPercentPoints),0),
      share=totalAbs?Math.abs(top.indexContributionPercentPoints)/totalAbs:0,
      dir=r.indexMovementPercent>0.005?`rose ${mnxNum(Math.abs(r.indexMovementPercent))}%`:r.indexMovementPercent<-0.005?`fell ${mnxNum(Math.abs(r.indexMovementPercent))}%`:'was essentially unchanged',
      lead=`${r.shortName} ${dir} over the ${r.horizon} horizon, meaning ${r.higherMeans?String(r.higherMeans).toLowerCase():'a change in the composite'} ${r.indexMovementPercent>0.005?'increased':r.indexMovementPercent<-0.005?'decreased':'held steady'}.`,
      body;
  if(share>=0.5)body=` ${top.displayName} accounted for the largest single share of that move, contributing ${mnxPp(top.indexContributionPercentPoints)} of the ${mnxPp(r.reconciliation.summedContribution)} total.`;
  else if(sorted[1])body=` The move was spread across components; ${top.displayName} (${mnxPp(top.indexContributionPercentPoints)}) and ${sorted[1].displayName} (${mnxPp(sorted[1].indexContributionPercentPoints)}) were the two largest governed contributors.`;
  else body=` ${top.displayName} was the only governed contributor, at ${mnxPp(top.indexContributionPercentPoints)}.`;
  let cover=r.coverageStatus==='COMPLETE'?'':` ${r.componentsDefined-r.componentsUsed} of ${r.componentsDefined} defined components are excluded by the governed ratio-eligibility rule and are not estimated.`;
  let degrade=r.status==='RECONCILED'?'':` ${r.statusReason}`;
  return lead+body+cover+degrade;
}
