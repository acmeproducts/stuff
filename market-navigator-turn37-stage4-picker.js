/* TURN37_STAGE4_GENERIC_BATCH_PICKER */
(()=>{
  const api=window.MNChartController37,baseAttach=api.attach,GROUPS=['Risk','Growth','Macro','Other'];
  function groupOf(id){
    if(id==='risk')return'Risk';if(id==='growth')return'Growth';if(id==='macro')return'Macro';
    const owner=Object.entries(S.def.indices).find(([,v])=>(v.components||[]).some(c=>c.id===id))?.[0];
    return owner?owner[0].toUpperCase()+owner.slice(1):'Other';
  }
  function alpha(a,b){const x=displayLabel(a),y=displayLabel(b),c=x.localeCompare(y,undefined,{sensitivity:'base'});return c||String(a).localeCompare(String(b))}
  api.attach=function(surfaceRoot,spec,options={}){
    let instance;
    const opt={...options,onAdd:()=>instance.openPicker()};
    instance=baseAttach(surfaceRoot,spec,opt);
    const picker={open:false,group:'Risk',query:'',staged:new Set(),eligible:new Map(),seq:0};
    const box=document.createElement('div');box.className='mn37Picker hidden';box.setAttribute('data-controller-picker','');
    box.innerHTML='<div class="mn37PickerHead"><input class="search" data-picker-search placeholder="Search Add"><div class="mn37PickerActions"><button class="btn" data-picker-ok>OK</button><button class="btn" data-picker-cancel>Cancel</button><button class="btn" data-picker-x aria-label="Close Add">×</button></div></div><div class="mn37PickerTabs" data-picker-tabs></div><div class="mn37PickerList" data-picker-list></div>';
    instance.root.appendChild(box);
    const search=box.querySelector('[data-picker-search]'),tabs=box.querySelector('[data-picker-tabs]'),list=box.querySelector('[data-picker-list]');
    async function model(){
      const token=++picker.seq,st=instance.getState(),existing=new Set(st.series),all=[...IDX,...S.catalog.series.map(x=>x.id).filter(id=>id!=='realGdp')];
      const ids=[...new Set(all)].filter(id=>!existing.has(id)&&groupOf(id)===picker.group).filter(id=>(id+' '+(IDX.includes(id)?S.def.indices[id]?.name:name(id))+' '+displayLabel(id)).toLowerCase().includes(picker.query.toLowerCase())).sort(alpha);
      const pairs=await Promise.all(ids.map(async id=>[id,IDX.includes(id)?true:await seriesAvailable(id,st.timeHorizon,st.windowIndex||st.root||'risk')]));
      if(token!==picker.seq)return null;for(const [id,ok] of pairs)picker.eligible.set(id,ok);
      return{groups:[...GROUPS],group:picker.group,query:picker.query,staged:[...picker.staged],rows:ids.map(id=>({id,label:displayLabel(id),name:IDX.includes(id)?S.def.indices[id]?.name:name(id),unit:IDX.includes(id)?'Index':unit(id),eligible:!!picker.eligible.get(id),checked:picker.staged.has(id)}))};
    }
    async function renderPicker(){
      if(!picker.open)return;
      tabs.innerHTML=GROUPS.map(g=>'<button class="cat '+(g===picker.group?'on':'')+'" data-picker-group="'+g+'">'+g+'</button>').join('');
      tabs.querySelectorAll('[data-picker-group]').forEach(b=>b.onclick=()=>{picker.group=b.dataset.pickerGroup;renderPicker()});
      const m=await model();if(!m||!picker.open)return;
      list.innerHTML=m.rows.map(r=>'<div class="row mn37PickerRow '+(r.eligible?'':'empty')+'"><input type="checkbox" data-picker-id="'+esc(r.id)+'" aria-label="Add '+esc(r.label)+'" '+(r.checked?'checked':'')+' '+(r.eligible?'':'disabled aria-disabled="true"')+'><div class="rowMain"><strong>'+esc(r.label)+' · '+esc(r.name)+'</strong><span class="rowMeta">'+esc(r.unit||'—')+' · '+(r.eligible?'available':'unavailable')+' for '+esc(instance.getState().timeHorizon)+'</span></div></div>').join('')||'<div class="rowMeta" style="padding:10px">No matching series.</div>';
      list.querySelectorAll('[data-picker-id]').forEach(c=>c.onchange=()=>{if(c.checked)picker.staged.add(c.dataset.pickerId);else picker.staged.delete(c.dataset.pickerId)});
    }
    instance.openPicker=async()=>{picker.open=true;picker.group='Risk';picker.query='';picker.staged.clear();picker.eligible.clear();search.value='';box.classList.remove('hidden');await renderPicker();return instance};
    instance.cancelPicker=()=>{picker.open=false;picker.staged.clear();box.classList.add('hidden');return instance};
    instance.setPickerGroup=async g=>{if(GROUPS.includes(g)){picker.group=g;await renderPicker()}return instance};
    instance.setPickerQuery=async q=>{picker.query=String(q||'');search.value=picker.query;await renderPicker();return instance};
    instance.togglePicker=(id,on)=>{if(on)picker.staged.add(id);else picker.staged.delete(id);return instance};
    instance.getPickerState=()=>({open:picker.open,group:picker.group,query:picker.query,staged:[...picker.staged]});
    instance.getPickerModel=model;
    instance.applyPicker=async()=>{
      const st=instance.getState(),selected=[...picker.staged].filter(id=>picker.eligible.get(id)===true).sort((a,b)=>GROUPS.indexOf(groupOf(a))-GROUPS.indexOf(groupOf(b))||alpha(a,b));
      const next=[...st.series];for(const id of selected)if(!next.includes(id))next.push(id);
      picker.open=false;picker.staged.clear();box.classList.add('hidden');
      if(selected.length)await instance.update({series:next,activeSeries:selected[selected.length-1]},'batch-add');
      return selected;
    };
    search.oninput=()=>{picker.query=search.value;renderPicker()};
    box.querySelector('[data-picker-cancel]').onclick=()=>instance.cancelPicker();
    box.querySelector('[data-picker-x]').onclick=()=>instance.cancelPicker();
    box.querySelector('[data-picker-ok]').onclick=()=>instance.applyPicker();
    const baseDestroy=instance.destroy.bind(instance);instance.destroy=()=>{picker.seq++;box.remove();baseDestroy()};
    return instance;
  };
  api.pickerGroups=()=>[...GROUPS];
})();
