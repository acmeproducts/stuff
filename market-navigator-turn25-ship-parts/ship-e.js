
/* ===================== Turn 25 Ship — wiring and qualification hooks =====================
   The explanation modal and the NOW report surface are parsed after this script (they sit beside the
   qualified Library report, outside .app, so print media can show them while the app is hidden).
   Wiring therefore waits for the document to finish parsing; binding synchronously would silently
   skip every control inside them and leave an info icon that opens but cannot be closed. */
function mnxWireWhenReady(){
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mnxWire,{once:true});
  else mnxWire();
}
function mnxWire(){
  if(mnxWire.done)return;
  if(!$('mnxModal')||!$('nowPrintReport'))throw new Error('Turn 25 Ship surfaces are missing from the document');
  mnxWire.done=true;
  let btn=$('indexInfoBtn');
  if(btn){
    btn.addEventListener('pointerdown',e=>{e.stopPropagation()});
    btn.addEventListener('touchstart',e=>{e.stopPropagation()},{passive:true});
    btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();mnxOpenExplanation()});
  }
  let close=$('mnxClose');if(close)close.addEventListener('click',e=>{e.preventDefault();mnxCloseExplanation()});
  let copy=$('mnxCopy');if(copy)copy.addEventListener('click',e=>{e.preventDefault();mnxCopyExplanation()});
  let dl=$('mnxDownload');if(dl)dl.addEventListener('click',e=>{e.preventDefault();mnxDownloadExplanation()});
  let modal=$('mnxModal');
  if(modal)modal.addEventListener('click',e=>{if(e.target===modal)mnxCloseExplanation()});
  document.addEventListener('keydown',e=>{
    let m=$('mnxModal');
    if(!m||m.hidden)return;
    if(e.key==='Escape'){e.preventDefault();mnxCloseExplanation()}
  });
  window.addEventListener('afterprint',mnxCleanupNowPrint);
  /* Deterministic qualification surface. Read-only accessors over the same canonical calculation path. */
  window.__mnShip25={
    version:'turn25-ship-1',
    manifests:()=>mnxManifests(),
    record:(k,h)=>{let r=mnxRecord(k,h||S.h);r.fingerprint=mnxRecordFingerprint(r);return r},
    explain:st=>mnxExplain(st||(S.nowChartState?nowAnalysisState():null)),
    markdown:st=>mnxExplain(st||(S.nowChartState?nowAnalysisState():null)).markdown,
    modelHealth:(k,h)=>mnxModelHealth(k,h||S.h),
    modelHealthSnapshot:st=>mnxModelHealthSnapshot(st||(S.nowChartState?nowAnalysisState():null)),
    shipState:st=>mnxShipState(st||nowAnalysisState()),
    frozenExplanation:()=>mnxExplanationFrozen,
    openExplanation:()=>mnxOpenExplanation(),
    closeExplanation:()=>mnxCloseExplanation(),
    printNow:st=>mnxPrintNow(st),
    buildNowReport:st=>mnxBuildNowPrintReport(st),
    cleanupNowReport:()=>mnxCleanupNowPrint(),
    loadSensitivity:()=>mnxLoadSensitivityEvidence(),
    setHealthTab:t=>{mnxHealthTab=t;mnxRenderHealth();return mnxHealthTab},
    healthTab:()=>mnxHealthTab,
    nowState:()=>S.nowChartState?JSON.parse(JSON.stringify(S.nowChartState)):null,
    horizon:()=>S.h,
    view:()=>S.view,
    level:()=>S.level,
    indexContext:()=>S.index||null,
    activeAnalysis:()=>S.activeAnalysis||null,
    evidenceRevision:()=>(S.derived&&S.derived.revision)||'',
    ready:()=>!!(S.derived&&S.def&&S.catalog&&S.health&&S.nowChartState),
    aiEvidence:st=>aiEvidenceState(mnxShipState(st||nowAnalysisState())),
    startAI:st=>startAI(mnxShipState(st||nowAnalysisState()))
  };
}
