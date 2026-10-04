/* TURN37_STAGE4_SHARED_BATCH_PICKER */
(()=>{
  const api=window.MNChartController37;
  const GROUPS=['Risk','Growth','Macro','Other'];
  function groupOf(id){
    if(id==='risk')return'Risk';
    if(id==='growth')return'Growth';
    if(id==='macro')return'Macro';
    const owner=Object.entries(S.def.indices).find(([,v])=>(v.components||[]).some(c=>c.id===id))?.[0];
    return owner?owner[0].toUpperCase()+owner.slice(1):'Other';
  }
  function alpha(a,b){
    const x=displayLabel(a),y=displayLabel(b),c=x.localeCompare(y,undefined,{sensitivity:'base'});
    return c||String(a).localeCompare(String(b));
  }
  function createBatchPicker(host,adapter){
    if(!host)throw Error('batch picker host required');
    let open=false,group='Risk',query='',staged=new Set(),eligible=new Map(),seq=0,destroyed=false;
    host.classList.add('mn37BatchPicker','hidden');
    host.innerHTML='<div class="mn37BatchHead"><input class="search" data-mn37-picker-search placeholder="Search Add"><div class="mn37BatchActions"><button class="btn" data-mn37-picker-ok>OK</button><button class="btn" data-mn37-picker-cancel>Cancel</button><button class="btn" data-mn37-picker-x aria-label="Close Add">×</button></div></div><div class="mn37BatchTabs" data-mn37-picker-tabs></div><div class="mn37BatchList" data-mn37-picker-list></div>';
    const search=host.querySelector('[data-mn37-picker-search]'),tabs=host.querySelector('[data-mn37-picker-tabs]'),list=host.querySelector('[data-mn37-picker-list]');
    async function model(){
      const token=++seq,st=adapter.getState(),existing=new Set(st.series||[]);
      const all=[...IDX,...S.catalog.series.map(x=>x.id).filter(id=>id!=='realGdp')];
      const ids=[...new Set(all)]
        .filter(id=>!existing.has(id)&&groupOf(id)===group)
        .filter(id=>(id+' '+(IDX.includes(id)?S.def.indices[id]?.name:name(id))+' '+displayLabel(id)).toLowerCase().includes(query.toLowerCase()))
        .sort(alpha);
      const pairs=await Promise.all(ids.map(async id=>[id,IDX.includes(id)?true:await seriesAvailable(id,st.timeHorizon,st.windowIndex||st.root||'risk')]));
      if(token!==seq||destroyed)return null;
      for(const [id,ok] of pairs)eligible.set(id,!!ok);
      return{
        groups:[...GROUPS],group,query,staged:[...staged],
        rows:ids.map(id=>({id,label:displayLabel(id),name:IDX.includes(id)?S.def.indices[id]?.name:name(id),unit:IDX.includes(id)?'Index':unit(id),eligible:eligible.get(id)===true,checked:staged.has(id)}))
      };
    }
    async function render(){
      if(!open||destroyed)return;
      tabs.innerHTML=GROUPS.map(g=>'<button class="cat '+(g===group?'on':'')+'" data-mn37-picker-group="'+g+'">'+g+'</button>').join('');
      tabs.querySelectorAll('[data-mn37-picker-group]').forEach(b=>b.onclick=()=>{group=b.dataset.mn37PickerGroup;render()});
      const m=await model();if(!m||!open||destroyed)return;
      list.innerHTML=m.rows.map(r=>'<div class="row mn37BatchRow '+(r.eligible?'':'empty')+'"><input type="checkbox" data-mn37-picker-id="'+esc(r.id)+'" aria-label="Add '+esc(r.label)+'" '+(r.checked?'checked ':'')+(r.eligible?'':'disabled aria-disabled="true"')+'><div class="rowMain"><strong>'+esc(r.label)+' · '+esc(r.name)+'</strong><span class="rowMeta">'+esc(r.unit||'—')+' · '+(r.eligible?'available':'unavailable')+' for '+esc(adapter.getState().timeHorizon)+'</span></div><button type="button" class="btn" data-mn37-picker-info="'+esc(r.id)+'">About</button></div>').join('')||'<div class="rowMeta" style="padding:10px">No matching series.</div>';
      list.querySelectorAll('[data-mn37-picker-id]').forEach(c=>c.onchange=()=>{if(c.checked)staged.add(c.dataset.mn37PickerId);else staged.delete(c.dataset.mn37PickerId)});
      list.querySelectorAll('[data-mn37-picker-info]').forEach(b=>b.onclick=e=>{e.preventDefault();e.stopPropagation();adapter.onInfo?.(b.dataset.mn37PickerInfo)});
    }
    async function openPicker(){
      open=true;group='Risk';query='';staged.clear();eligible.clear();search.value='';host.classList.remove('hidden');await render();return apiObj;
    }
    function cancel(){
      open=false;staged.clear();eligible.clear();host.classList.add('hidden');return apiObj;
    }
    async function apply(){
      const selected=[...staged].filter(id=>eligible.get(id)===true).sort((a,b)=>GROUPS.indexOf(groupOf(a))-GROUPS.indexOf(groupOf(b))||alpha(a,b));
      const st=adapter.getState(),next=[...(st.series||[])];
      for(const id of selected)if(!next.includes(id))next.push(id);
      open=false;staged.clear();host.classList.add('hidden');
      if(selected.length)await adapter.apply?.(selected,next,selected[selected.length-1]);
      return selected;
    }
    search.oninput=()=>{query=search.value;render()};
    host.querySelector('[data-mn37-picker-cancel]').onclick=cancel;
    host.querySelector('[data-mn37-picker-x]').onclick=cancel;
    host.querySelector('[data-mn37-picker-ok]').onclick=()=>apply();
    const apiObj={
      open:openPicker,cancel,apply,render,
      async setGroup(g){if(GROUPS.includes(g)){group=g;await render()}return apiObj},
      async setQuery(q){query=String(q||'');search.value=query;await render();return apiObj},
      toggle(id,on){if(on)staged.add(id);else staged.delete(id);return apiObj},
      getState:()=>({open,group,query,staged:[...staged]}),
      getModel:model,
      destroy(){destroyed=true;seq++;host.classList.add('hidden');host.replaceChildren()}
    };
    return apiObj;
  }
  api.createBatchPicker=createBatchPicker;
  api.pickerGroups=()=>[...GROUPS];

  const baseAttach=api.attach;
  api.attach=function(surfaceRoot,spec){
    let instance,picker,originalStateChange=spec.onStateChange;
    const wrappedSpec={...spec,onStateChange:(payload,reason)=>{originalStateChange?.(payload,reason);queueMicrotask(()=>ensureAdd())}};
    instance=baseAttach(surfaceRoot,wrappedSpec);
    const host=document.createElement('div');surfaceRoot.appendChild(host);
    picker=createBatchPicker(host,{
      getState:()=>instance.getState().spec,
      onInfo:id=>spec.onInfo?.(id),
      apply:async(selected,next,active)=>{await instance.update({series:next,activeSeries:active})}
    });
    function ensureAdd(){
      if(!instance||!surfaceRoot.isConnected)return;
      const legend=surfaceRoot.querySelector('[data-mn-role="legend"]');if(!legend||legend.querySelector('[data-mn-controller-add]'))return;
      const b=document.createElement('button');b.className='lg';b.dataset.mnControllerAdd='';b.textContent='+ Add';b.onclick=()=>picker.open();legend.appendChild(b);
    }
    const baseUpdate=instance.update.bind(instance);
    instance.update=async(...args)=>{const out=await baseUpdate(...args);ensureAdd();return out};
    const baseDestroy=instance.destroy.bind(instance);
    instance.destroy=()=>{picker.destroy();baseDestroy()};
    instance.openPicker=()=>picker.open();
    instance.cancelPicker=()=>picker.cancel();
    instance.applyPicker=()=>picker.apply();
    instance.getPickerState=()=>picker.getState();
    instance.getPickerModel=()=>picker.getModel();
    instance.setPickerGroup=g=>picker.setGroup(g);
    instance.setPickerQuery=q=>picker.setQuery(q);
    instance.togglePicker=(id,on)=>picker.toggle(id,on);
    instance.ready=Promise.resolve(instance.ready).then(()=>{ensureAdd();return instance});
    return instance;
  };
})();