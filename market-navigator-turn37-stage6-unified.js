/* TURN37_STAGE6_UNIFIED_CONTROLLER */
(()=>{
  const api=window.MNChartController37,counts={total:0,byReason:{}};
  window.__mn37Shadow={resolve:spec=>api.resolve(spec)};
  standaloneAnalysisState26=()=>S.analysisChartState?JSON.parse(JSON.stringify(S.analysisChartState)):mnxShipState({});
  let nowController=null;

  function decorate(r){
    return r.series.map(z=>({
      ...z,
      label:displayLabel(z.id),
      full:IDX.includes(z.id)?S.def.indices[z.id]?.name:name(z.id),
      color:seriesColor(z.id),
      renderType:'line',
      axisLabel:z.axis===1?(z.unit||'Native'):(r.root===null?(z.unit||'Index'):(r.mode==='indexed'?'Indexed 100':(z.unit||'Index')))
    }))
  }
  function resolveRefs(root){
    const q=(role,id)=>root.querySelector('[data-mn-role="'+role+'"]')||(id?root.querySelector('#'+id):null);
    return{
      title:q('title','nowCrumb'),horizons:q('horizons','hzs'),more:q('more','nowMoreBtn'),close:q('close'),
      legend:q('legend','legend'),wrap:q('wrap','nowWrap'),canvas:q('canvas','nowChart'),info:q('info','indexInfoBtn'),
      tip:q('tip','nowTip'),footer:q('footer','nowMeta')
    }
  }
  api.attach=function(surfaceRoot,spec){
    if(!surfaceRoot)throw Error('MNChartController37 surfaceRoot required');
    let current={...spec,series:[...(spec.series||[])]},last=null,destroyed=false,seq=0,picker=null,pickerOwned=false;
    const refs=resolveRefs(surfaceRoot),isNow=!!surfaceRoot.querySelector('#nowChart');
    if(!refs.horizons||!refs.legend||!refs.canvas||!refs.wrap||!refs.footer)throw Error('MNChartController37 surface role map incomplete');
    let instance;

    function state(){return{...current,series:[...(current.series||[])]}}
    function payload(){return{spec:state(),resolved:last?JSON.parse(JSON.stringify(last)):null,destroyed}}
    function notify(reason){counts.total++;counts.byReason[reason]=(counts.byReason[reason]||0)+1;current.onStateChange?.(payload(),reason)}
    function pickerState(){return{...state(),windowIndex:current.root||'risk'}}
    function ensurePicker(){
      if(picker||!api.createBatchPicker)return;
      let host=isNow?$('nowPicker'):null;
      if(!host){host=document.createElement('div');surfaceRoot.appendChild(host);pickerOwned=true}
      picker=api.createBatchPicker(host,{
        getState:pickerState,
        onInfo:id=>current.onInfo?.(id),
        apply:async(selected,next,active)=>instance.update({series:next,activeSeries:active},'batch-add')
      })
    }
    function renderTitle(){
      if(isNow){current.renderTitle?.(state(),last,instance);return}
      if(refs.title){refs.title.textContent=current.title||displayLabel(current.root);refs.title.title=current.title||displayLabel(current.root)}
    }
    function renderHorizons(){
      refs.horizons.innerHTML=H.map(h=>'<button class="hz '+(h===current.timeHorizon?'on':'')+'" '+(isNow?'data-h':'data-mn-h')+'="'+h+'">'+h+'</button>').join('');
      refs.horizons.querySelectorAll(isNow?'[data-h]':'[data-mn-h]').forEach(b=>b.onclick=()=>instance.update({timeHorizon:isNow?b.dataset.h:b.dataset.mnH},'horizon'))
    }
    function infoWire(btn,id){
      if(!current.onInfo)return;
      let t=null;btn.addEventListener('pointerdown',()=>{t=setTimeout(()=>current.onInfo(id),450)});
      for(const ev of ['pointerup','pointercancel','pointerleave'])btn.addEventListener(ev,()=>{if(t)clearTimeout(t)});
      btn.oncontextmenu=e=>{e.preventDefault();current.onInfo(id)}
    }
    function activate(id){
      if(current.root===null&&isNow){
        const comps=(S.def.indices[id]?.components||[]).map(x=>x.id);
        return instance.update({root:id,windowIndex:id,series:[id,...comps],activeSeries:id,componentsExpanded:true},'open-index')
      }
      if(isNow&&id===current.root&&!current.componentsExpanded){
        const comps=(S.def.indices[id]?.components||[]).map(x=>x.id),cmp=current.series.filter(x=>x!==id&&!comps.includes(x));
        return instance.update({series:[id,...comps,...cmp],activeSeries:id,componentsExpanded:true},'expand-components')
      }
      return instance.update({activeSeries:id},'active')
    }
    function renderLegend(sets){
      const html=sets.map(z=>{
        const cls=isNow?(current.root===null?'lg':('lg '+(z.id===current.activeSeries?'active':'')+' '+(z.a.length?'':'empty'))):('lg '+(z.id===current.activeSeries?'active':'')+' '+(z.a.length?'':'empty'));
        const removable=current.root!==null&&z.id!==current.root;
        const key=isNow?'data-id':'data-mn-series';
        const rm=isNow?'data-rm':'data-mn-remove';
        return'<button class="'+cls+'" '+key+'="'+esc(z.id)+'" title="'+esc(z.full)+(z.a.length?'':' · unavailable for '+current.timeHorizon)+'" '+(z.a.length?'':'disabled aria-disabled="true"')+'>'+legendSample(z)+esc(z.label)+(removable?'<span class="'+(isNow?'nowRemove':'nowRemove')+'" '+rm+'="'+esc(z.id)+'" aria-label="Remove '+esc(z.label)+'">×</span>':'')+'</button>'
      }).join('');
      const add=current.root===null?'':(isNow?'<button class="lg nowAddChip" id="nowAddSeries">+ Add</button>':'<button class="lg" data-mn-controller-add>+ Add</button>');
      refs.legend.innerHTML=html+add;
      refs.legend.querySelectorAll(isNow?'[data-id]':'[data-mn-series]').forEach(btn=>{
        const id=isNow?btn.dataset.id:btn.dataset.mnSeries;
        btn.onclick=e=>{if(e.target.closest(isNow?'[data-rm]':'[data-mn-remove]')||btn.disabled)return;activate(id)};
        infoWire(btn,id)
      });
      refs.legend.querySelectorAll(isNow?'[data-rm]':'[data-mn-remove]').forEach(x=>x.onclick=e=>{
        e.stopPropagation();const id=isNow?x.dataset.rm:x.dataset.mnRemove,next=current.series.filter(v=>v!==id);
        instance.update({series:next,activeSeries:current.activeSeries===id?current.root:current.activeSeries},'remove')
      });
      const addBtn=isNow?refs.legend.querySelector('#nowAddSeries'):refs.legend.querySelector('[data-mn-controller-add]');
      if(addBtn)addBtn.onclick=()=>{ensurePicker();picker.open()}
    }
    function renderFooter(){
      if(isNow){
        const rep=last.mode,display=current.displayMode==='horizon'?'rebase':'fixed';
        refs.footer.innerHTML='<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>'+esc(last.w.startLabel)+' → '+esc(last.w.endLabel)+'</span><span class="footerSep">|</span><select id="nowRepresentation" aria-label="Chart representation"><option value="indexed" '+(rep==='indexed'?'selected':'')+'>Indexed 100</option>'+(last.dualEligible?'<option value="dual" '+(rep==='dual'?'selected':'')+'>Y1 + Y2</option>':'')+'</select><select id="nowIndexDisplay" aria-label="Index display"><option value="fixed" '+(display==='fixed'?'selected':'')+'>Fixed</option><option value="rebase" '+(display==='rebase'?'selected':'')+'>Horizon</option></select>';
        $('nowRepresentation').onchange=()=>instance.update({representation:$('nowRepresentation').value},'representation');
        $('nowIndexDisplay').onchange=()=>instance.update({displayMode:$('nowIndexDisplay').value==='rebase'?'horizon':'fixed'},'display');
      }else{
        refs.footer.innerHTML='<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>'+esc(last.w.startLabel)+' → '+esc(last.w.endLabel)+'</span><span class="footerSep">|</span><select data-mn-representation aria-label="Chart representation"><option value="indexed">Indexed 100</option>'+(last.dualEligible?'<option value="dual">Y1 + Y2</option>':'')+'</select><select data-mn-display aria-label="Index display"><option value="fixed">Fixed</option><option value="horizon">Horizon</option></select>';
        const rep=refs.footer.querySelector('[data-mn-representation]'),disp=refs.footer.querySelector('[data-mn-display]');rep.value=last.mode;disp.value=current.displayMode||'fixed';rep.onchange=()=>instance.update({representation:rep.value},'representation');disp.onchange=()=>instance.update({displayMode:disp.value},'display')
      }
    }
    function bindCrumbs(){
      if(!isNow)return;
      const env=$('crumbEnvironment');if(env)env.onclick=()=>instance.update({root:null,windowIndex:'risk',series:[...IDX],activeSeries:null,componentsExpanded:false},'crumb-env');
      const idx=$('crumbIndex22');if(idx)idx.onclick=()=>{
        const comps=(S.def.indices[current.root]?.components||[]).map(x=>x.id),cmp=current.series.filter(x=>x!==current.root&&!comps.includes(x));
        instance.update({series:[current.root,...cmp],activeSeries:current.root,componentsExpanded:false},'crumb-index')
      }
    }
    function paint(sets){
      const which=isNow?'now':'analysis';
      draw(which,sets,{...last.w,horizon:current.timeHorizon},last.mode)
    }
    async function render(reason='render'){
      const n=++seq;last=await api.resolve(current);if(destroyed||n!==seq)return instance;current.activeSeries=last.active;
      current.onBeforeRender?.(state(),last,instance);
      const sets=decorate(last);
      renderTitle();renderHorizons();renderLegend(sets);renderFooter();bindCrumbs();
      if(refs.more)refs.more.onclick=()=>current.onMore?.();
      if(refs.close)refs.close.onclick=()=>current.onClose?.();
      if(refs.info)refs.info.onclick=()=>current.onInfo?.(current.root);
      paint(sets);
      current.onAfterRender?.(state(),last,sets,instance);
      notify(reason);
      return instance
    }
    async function update(patch={},reason='update'){current={...current,...patch,series:[...(patch.series||current.series||[])]};return render(reason)}
    function rendererSetActive(id,focus=false){const changed=current.activeSeries!==id;current.activeSeries=id;if(changed||focus){current.onRendererActive?.(id,focus);notify('renderer-active')}}
    function getState(){return payload()}
    function getResolved(){return last}
    function resize(){if(last)paint(decorate(last))}
    function destroy(){destroyed=true;seq++;if(picker)picker.destroy();if(pickerOwned&&picker?.host)picker.host.remove();current.onDestroy?.();last=null}
    instance={ready:null,update,rendererSetActive,getState,getResolved,resize,destroy,openPicker:()=>{ensurePicker();return picker.open()},getPickerState:()=>picker?.getState()||null};
    instance.ready=render('attach');return instance
  };

  function nowSpec(){
    const env=S.level===1,root=env?null:S.index,comps=root?(S.def.indices[root]?.components||[]).map(x=>x.id):[],series=env?[...IDX]:[root,...(S.componentsExpanded?comps.filter(id=>!S.hiddenComponents.includes(id)):[]),...S.nowComparisons.filter(id=>id!==root&&!comps.includes(id))];
    return{root,windowIndex:root||'risk',series,timeHorizon:S.h,displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',representation:S.nowRepresentation||'indexed',activeSeries:env?null:(S.nowActive||root),componentsExpanded:env?false:!!S.componentsExpanded}
  }
  function mirrorNow(st){
    S.h=st.timeHorizon;S.indexDisplay=st.displayMode==='horizon'?'rebase':'fixed';S.nowRepresentation=st.representation||'indexed';
    if(st.root===null){S.level=1;S.index=null;S.componentsExpanded=false;S.hiddenComponents=[];S.nowComparisons=[];S.nowActive=null;S.nowFocus=null;$('nowTitle').textContent='ENV';return}
    S.level=2;S.index=st.root;S.componentsExpanded=!!st.componentsExpanded;const comps=(S.def.indices[st.root]?.components||[]).map(x=>x.id),have=new Set(st.series||[]);
    S.hiddenComponents=comps.filter(id=>!have.has(id));S.nowComparisons=(st.series||[]).filter(id=>id!==st.root&&!comps.includes(id));S.nowActive=st.activeSeries||st.root;S.nowFocus=S.nowActive;$('nowTitle').textContent=AB[st.root]
  }
  function ensureNow(spec=nowSpec()){
    if(nowController)return nowController;
    nowController=api.attach(document.querySelector('#view-now .chartCard'),{
      ...spec,
      onBeforeRender:st=>{mirrorNow(st);renderNowCrumb()},
      renderTitle:()=>renderNowCrumb(),
      onInfo:id=>showNowSeriesInfo25(id),
      onMore:()=>$('nowMoreMenu').classList.toggle('hidden'),
      onAfterRender:(st,r,sets)=>{mirrorNow(st);captureNowState(sets,r.w,r.mode);if(st.root===null&&S.nowChartState){S.nowChartState.active=null;if(S.nowChartState.chart)S.nowChartState.chart.active=null}S.nowPaint25={sets,w:r.w,mode:r.mode}},
      onStateChange:()=>{}
    });
    window.__mn37NowController=nowController;return nowController
  }
  window.renderV1=()=>{const spec={root:null,windowIndex:'risk',series:[...IDX],timeHorizon:S.h,displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',representation:S.nowRepresentation||'indexed',activeSeries:null,componentsExpanded:false};const c=ensureNow(spec);return c.getResolved()?c.update(spec,'render-v1'):c.ready};
  window.openV2=k=>{const comps=(S.def.indices[k]?.components||[]).map(x=>x.id),spec={root:k,windowIndex:k,series:[k,...comps],timeHorizon:S.h,displayMode:(S.indexDisplay||'fixed')==='rebase'?'horizon':'fixed',representation:S.nowRepresentation||'indexed',activeSeries:k,componentsExpanded:true};const c=ensureNow(spec);return c.update(spec,'open-index')};
  window.renderV2=()=>{const spec=nowSpec(),c=ensureNow(spec);return c.getResolved()?c.update(spec,'render-v2'):c.ready};
  window.renderNow=()=>S.level===1?window.renderV1():window.renderV2();
  window.openNowPicker25=()=>ensureNow().openPicker();
  window.renderNowPicker25=()=>Promise.resolve();
  window.__mn37Stage6={
    ready:()=>!!nowController?.getResolved(),
    state:()=>nowController?.getState()||null,
    counts:()=>api.stage6Counts?api.stage6Counts():JSON.parse(JSON.stringify(counts)),
    picker:()=>nowController?.getPickerState()||null,
    async parity(){const live=nowController?.getResolved();if(!live)return{equal:false};const shadow=await api.resolve(nowController.getState().spec);return{equal:JSON.stringify(live)===JSON.stringify(shadow),live,shadow}}
  };
  api.stage6Counts=()=>JSON.parse(JSON.stringify(counts));
})();