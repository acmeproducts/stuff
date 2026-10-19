function showInspection(q,sel){
 const qxy=model.xy(sel,q),xx=qxy.x,yy=qxy.y;
 model=paint({x:xx,y:yy,z:sel,t:q.sourceT||q.t});
 const iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v;
 const rawURL=cat(sel.id).source_reference_url||healthEntryUrl26(sel.id),url=new URL(rawURL,location.href);
 const href=['http:','https:','file:'].includes(url.protocol)?url.href:healthEntryUrl26(sel.id);
 const native=IDX.includes(sel.id)?'—':(/usd|dollar/i.test(sel.unit||'')?'$'+chartNumber(nv,sel.unit):chartNumber(nv,sel.unit)+(sel.unit?' '+sel.unit:''));
 tip.innerHTML='<button class="tipClose" data-tip-close aria-label="Close inspection">×</button><span class="inspectionValues"><a data-inspection-source href="'+esc(href)+'" target="_blank" rel="noopener noreferrer" aria-label="'+esc(sel.label)+' source for '+esc(full(q.sourceT||q.t))+'">'+esc(full(q.sourceT||q.t))+'</a><span aria-hidden="true"> | </span><span data-inspection-index>'+esc(Number.isFinite(iv)?chartNumber(iv):'—')+'</span><span aria-hidden="true"> | </span><span data-inspection-native>'+esc(native)+'</span></span>';
 tip.style.display='block';tip.style.boxSizing='border-box';tip.style.width='max-content';tip.style.minWidth='0';tip.style.maxWidth=Math.max(1,model.W-12)+'px';tip.style.maxHeight=Math.max(1,model.H-12)+'px';tip.style.whiteSpace='normal';tip.style.overflow='auto';tip.style.pointerEvents='none';
 const tr=tip.getBoundingClientRect();if(tip.scrollHeight>tip.clientHeight)tip.style.pointerEvents='auto';tip.style.left=Math.max(6,Math.min(model.W-tr.width-6,xx+8))+'px';tip.style.top=Math.max(6,Math.min(model.H-tr.height-6,yy-tr.height-8))+'px';
 const tc=tip.querySelector('[data-tip-close]');if(tc){tc.style.pointerEvents='auto';tc.onclick=e=>{e.stopPropagation();S.inspection=null;tip.style.display='none';model=paint()}}
 const link=tip.querySelector('[data-inspection-source]');link.style.pointerEvents='auto';link.style.color='#D9E6F2';link.style.textDecoration='underline';link.onpointerdown=e=>e.stopPropagation();link.onclick=e=>e.stopPropagation();
}
