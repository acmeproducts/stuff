/* TURN37_STAGE4_NOW_BATCH_ADAPTER */
(()=>{
  const host=$('nowPicker');
  const picker=MNChartController37.createBatchPicker(host,{
    getState:()=>({series:visibleIds25(),timeHorizon:S.h,root:S.index||'risk',windowIndex:S.index||'risk'}),
    onInfo:id=>showNowSeriesInfo25(id),
    apply:async(selected,next,active)=>{
      const comps=new Set(componentIds25());
      for(const id of selected){
        if(comps.has(id))S.hiddenComponents=S.hiddenComponents.filter(x=>x!==id);
        else if(!S.nowComparisons.includes(id))S.nowComparisons.push(id);
      }
      S.nowActive=active;S.nowFocus=active;await renderV2();
    }
  });
  openNowPicker25=()=>picker.open();
  renderNowPicker25=()=>picker.render();
  window.__mn37Stage4={
    nowPicker:()=>picker.getState(),
    nowPickerModel:()=>picker.getModel(),
    analysisPicker:()=>window.__mn37Stage3.instance()?.getPickerState?.()||null,
    analysisPickerModel:()=>window.__mn37Stage3.instance()?.getPickerModel?.()||null
  };
})();