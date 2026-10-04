/* TURN37_STAGE3_GENERIC_ATTACH */
(()=>{
  const api=window.MNChartController37;
  function rootEl(x){return typeof x==='string'?document.querySelector(x):x}
  api.attach=function(surfaceRoot,spec,options={}){
    const root=rootEl(surfaceRoot);if(!root)throw Error('MNChartController37 surface root missing');
    const ctl=api.create(spec),roles=options.roles||{};
    const el=role=>{const sel=roles[role];return sel?root.querySelector(sel):null};
    let destroyed=false,renderSeq=0,lastResolved=null;
    function state(){return{...ctl.spec,series:[...(ctl.spec.series||[])]}}
    function decorate(r){
      const colors=chartColors(r.series);
      r.sets.forEach(z=>{z.label=IDX.includes(z.id)?AB[z.id]:label(z.id);z.full=IDX.includes(z.id)?S.def.indices[z.id]?.name:name(z.id);z.color=colors[z.id];z.renderType='line'});
      return r;
    }
    async function render(reason='render'){
      if(destroyed)return;
      const seq=++renderSeq,r=decorate(await ctl.update(ctl.spec));if(destroyed||seq!==renderSeq)return;
      ctl.spec.activeSeries=r.active;lastResolved=r;
      const title=el('title'),hz=el('horizons'),legend=el('legend'),footer=el('footer'),more=el('more');
      if(title)options.renderTitle?options.renderTitle(title,state(),r):title.textContent=options.title||displayLabel(ctl.spec.root);
      if(hz){
        hz.innerHTML=H.map(h=>'<button class="hz '+(h===ctl.spec.timeHorizon?'on':'')+'" data-h="'+h+'">'+h+'</button>').join('');
        hz.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>update({timeHorizon:b.dataset.h},'horizon'));
      }
      if(legend){
        legend.innerHTML=r.sets.map(z=>'<button class="lg '+(z.id===ctl.spec.activeSeries?'active':'')+' '+(z.a.length?'':'empty')+'" data-id="'+esc(z.id)+'" '+(z.a.length?'':'disabled aria-disabled="true"')+'>'+legendSample(z)+esc(z.label)+(z.id===ctl.spec.root?'':'<span class="'+esc(options.removeClass||'seriesX')+'" data-rm="'+esc(z.id)+'" aria-label="Remove '+esc(z.label)+'">×</span>')+'</button>').join('')+(options.showAdd===false?'':'<button class="'+esc(options.addClass||'lg')+'" data-controller-add>+ Add</button>');
        legend.querySelectorAll('[data-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-rm]')||b.disabled)return;update({activeSeries:b.dataset.id},'active')});
        legend.querySelectorAll('[data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();const id=x.dataset.rm,next=ctl.spec.series.filter(v=>v!==id);update({series:next,activeSeries:ctl.spec.activeSeries===id?ctl.spec.root:ctl.spec.activeSeries},'remove')});
        const add=legend.querySelector('[data-controller-add]');if(add)add.onclick=()=>options.onAdd?.(instance);
      }
      if(footer){
        footer.innerHTML='<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>'+esc(r.window.startLabel)+' → '+esc(r.window.endLabel)+'</span><span class="footerSep">|</span><select data-controller-rep aria-label="Chart representation"><option value="indexed">Indexed 100</option>'+(r.dualEligible?'<option value="dual">Y1 + Y2</option>':'')+'</select><select data-controller-display aria-label="Index display"><option value="fixed">Fixed</option><option value="horizon">Horizon</option></select>';
        const rep=footer.querySelector('[data-controller-rep]'),disp=footer.querySelector('[data-controller-display]');
        rep.value=r.mode;disp.value=ctl.spec.displayMode||'fixed';
        rep.onchange=()=>update({representation:rep.value},'representation');
        disp.onchange=()=>update({displayMode:disp.value},'display');
      }
      if(more)more.onclick=()=>options.onMore?.(instance);
      await options.paint?.(r,instance);
      options.onStateChange?.(state(),r,reason,instance);
    }
    async function update(patch={},reason='update'){ctl.spec={...ctl.spec,...patch,series:[...(patch.series||ctl.spec.series||[])]};await render(reason);return instance}
    function rendererSetActive(id,focus=false){
      ctl.spec.activeSeries=id;
      options.onRendererActive?.(id,focus,instance);
      options.onStateChange?.(state(),lastResolved,'renderer-active',instance);
    }
    function getState(){return state()}
    function getResolved(){return lastResolved}
    function destroy(){destroyed=true;renderSeq++;options.onDestroy?.(instance);ctl.destroy()}
    const instance={update,render,getState,getResolved,rendererSetActive,destroy,get root(){return root},ready:null};
    instance.ready=render('attach');
    return instance;
  };
})();
