function showInspection(q,sel){
 const qxy=model.xy(sel,q),xx=qxy.x,yy=qxy.y;
 model=paint({x:xx,y:yy,z:sel,t:q.sourceT||q.t});
 const iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v;
 const rawURL=cat(sel.id).source_reference_url||healthEntryUrl26(sel.id),url=new URL(rawURL,location.href);
 const href=['http:','https:','file:'].includes(url.protocol)?url.href:healthEntryUrl26(sel.id);
 const native=IDX.includes(sel.id)?'—':(/usd|dollar/i.test(sel.unit||'')?'$'+chartNumber(nv,sel.unit):chartNumber(nv,sel.unit)+(sel.unit?' '+sel.unit:''));
 tip.innerHTML='<button class="tipClose" data-tip-close aria-label="Close inspection">×</button><strong data-inspection-series>'+esc(sel.label)+'</strong><div class="inspectionDate"><a data-inspection-source href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(full(q.sourceT||q.t))+'</a></div><div class="inspectionValues"><span data-inspection-index>'+esc(Number.isFinite(iv)?chartNumber(iv):'—')+'</span><span aria-hidden="true"> | </span><span data-inspection-native>'+esc(native)+'</span></div>';
 const rect=c.getBoundingClientRect(),pointX=rect.left+xx,pointY=rect.top+yy,available=Math.max(1,pointX-12),width=Math.min(210,available);
 Object.assign(tip.style,{display:'block',position:'fixed',boxSizing:'border-box',width:width+'px',minWidth:'0',maxWidth:width+'px',minHeight:Math.min(130,width/1.6)+'px',maxHeight:(innerHeight-12)+'px',whiteSpace:'normal',overflowWrap:'anywhere',overflow:'auto',pointerEvents:'none',zIndex:'80',left:Math.max(0,pointX-width-8)+'px'});
 tip.querySelector('[data-inspection-series]').style.display='block';tip.querySelector('.inspectionDate').style.margin='8px 0';
 const tr=tip.getBoundingClientRect();tip.style.top=Math.max(6,Math.min(innerHeight-tr.height-6,pointY-tr.height/2))+'px';
 const tc=tip.querySelector('[data-tip-close]');if(tc){tc.style.pointerEvents='auto';tc.onclick=e=>{e.stopPropagation();S.inspection=null;tip.style.display='none';model=paint()}}
 const link=tip.querySelector('[data-inspection-source]');link.style.pointerEvents='auto';link.style.color='#D9E6F2';link.style.textDecoration='underline';link.onpointerdown=e=>e.stopPropagation();link.onclick=e=>e.stopPropagation();
}
