from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.5'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.5 baseline')

s=s.replace('<title>Market Navigator 3.9.5</title>','<title>Market Navigator 3.9.6</title>')
s=s.replace('Version 3.9.5</small>','Version 3.9.6</small>')
s=s.replace("const VERSION='3.9.5'","const VERSION='3.9.6'")
s=s.replace('Market Navigator 3.9.5\nUsage:','Market Navigator 3.9.6\nUsage:')
s=s.replace('Version: 3.9.5','Version: 3.9.6')

css='''\n/* 3.9.6 authoritative Now contract */\n.now396{height:100%;display:grid;grid-template-rows:minmax(0,1.35fr) minmax(0,.65fr);gap:10px;overflow:hidden}.regime396{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;cursor:pointer}.regime396:hover,.regime396:focus-visible,.category396:hover,.category396:focus-visible{border-color:var(--accent);outline:2px solid #9ed1ff;outline-offset:2px}.regime396Head{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.regime396Metric{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}.regime396Metric strong{font-size:28px}.categoryGrid396{min-height:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.category396{min-height:0;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:4px;cursor:pointer}.category396 .value{font-size:22px}.category396 canvas{min-height:0;width:100%;height:100%}.driverNote396{font-size:10px;color:var(--muted)}.microGrid396{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;height:100%;min-height:0}.micro396{border:1px solid var(--line);background:#0b1728;color:var(--text);border-radius:14px;padding:10px;display:grid;grid-template-rows:auto minmax(0,1fr) auto;gap:7px;min-height:0;text-align:left;cursor:pointer}.micro396:hover,.micro396:focus-visible{border-color:var(--accent);outline:2px solid #9ed1ff;outline-offset:2px}.microBars396{display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end;min-height:70px}.microCol396{height:100%;display:grid;grid-template-rows:minmax(0,1fr) auto;align-items:end;gap:4px}.microBar396{width:100%;min-height:3px;border-radius:6px 6px 2px 2px;background:#6db7ff}.microBar396.end{background:#2dd47b}.microLegend396{display:flex;justify-content:space-between;gap:8px;font-size:10px;color:var(--muted)}.modalPanel{border-radius:18px;overflow:hidden}.modalChart,.stats{min-height:0}.stats{overflow:hidden}@media(max-width:520px){.now396{grid-template-rows:minmax(0,1.28fr) minmax(0,.72fr)}.categoryGrid396{gap:6px}.category396{padding:8px}.category396 h3{font-size:13px}.category396 .value{font-size:18px}.category396 .chip{font-size:9px;padding:3px 5px}.modal{padding:10px}.modalPanel{width:calc(100% - 4px);height:calc(100dvh - 20px);max-height:none;border-radius:18px}.microGrid396{grid-template-columns:1fr}.micro396{grid-template-columns:1fr 120px 1fr;grid-template-rows:auto;align-items:center}.microBars396{min-height:60px}}\n'''
s=s.replace('</style>',css+'</style>',1)

js=r'''
/* 3.9.6 authoritative Now / drill-down contract. This block intentionally comes last. */
TABS.now=[['Now','nowSnapshot']];

function indexChart396(canvas,data,name,color,range=state.range,compact=false){
  const {x,w,h}=setupCanvas(canvas),pad=compact?{l:28,r:5,t:22,b:18}:{l:42,r:8,t:24,b:26};
  x.clearRect(0,0,w,h);x.font=compact?'9px system-ui':'10px system-ui';x.textBaseline='middle';
  x.fillStyle=color;x.fillRect(pad.l,6,12,3);x.fillStyle='#eef5ff';x.fillText(name,pad.l+18,8);
  if(!data?.length){x.fillStyle='#c2cfdd';x.fillText('Data unavailable',pad.l,pad.t+12);return}
  let t0=data[0].t,t1=data.at(-1).t;if(t0===t1)t1+=864e5;
  const ticks=compact?[0,50,100]:[0,25,50,75,100];
  x.strokeStyle='#334965';x.fillStyle='#cbd8e6';for(const v of ticks){const y=pad.t+(100-v)/100*(h-pad.t-pad.b);x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke();if(!compact||v===0||v===100)x.fillText(String(v),3,y)}
  const xTicks=compact?[t0,t1]:[t0,t0+(t1-t0)/2,t1];for(const t of xTicks){const px=pad.l+(t-t0)/(t1-t0)*(w-pad.l-pad.r),lab=axisDate391(t,range);x.fillStyle='#cbd8e6';x.fillText(lab,Math.max(2,Math.min(w-54,px-18)),h-7)}
  x.strokeStyle=color;x.lineWidth=compact?1.6:2;x.beginPath();data.forEach((p,i)=>{const px=pad.l+(p.t-t0)/(t1-t0)*(w-pad.l-pad.r),py=pad.t+(100-Math.max(0,Math.min(100,p.v)))/100*(h-pad.t-pad.b);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
  const inspect=e=>{e.stopPropagation();document.getElementById('tip')?.remove();const r=canvas.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(e.clientX-r.left-pad.l)/(Math.max(1,r.width-pad.l-pad.r)))),target=t0+ratio*(t1-t0),p=data.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a,data[0]),tip=document.createElement('div');tip.id='tip';styleObj(tip,{position:'fixed',zIndex:'160',background:'#fff',color:'#07111e',padding:'8px 10px',borderRadius:'9px',fontSize:'12px',boxShadow:'0 8px 24px #0008',left:`${Math.min(innerWidth-230,e.clientX+10)}px`,top:`${Math.max(8,e.clientY-76)}px`,pointerEvents:'none'});tip.innerHTML=`<div class="chartTipRow"><span class="chartTipSwatch" style="background:${color}"></span><span><b>${name}</b> · ${p.v.toFixed(0)}/100<div>${new Date(p.t).toLocaleDateString()}</div></span></div>`;document.body.appendChild(tip)};
  canvas.onpointerdown=inspect;canvas.onpointermove=e=>{if(e.pointerType==='mouse'||e.buttons===1)inspect(e)};canvas.onpointerleave=()=>document.getElementById('tip')?.remove();
}

function microComponent396(id){
  const d=rangeData(id,state.range),z=q(id,state.range),m=META[id];
  if(!d.length)return `<button class="micro396" data-component396="${id}"><div><div class="kicker">${m.role}</div><b>${m.short}</b></div><div class="muted">Unavailable for ${H[state.range].label}</div></button>`;
  const start=d[0].v,end=d.at(-1).v,min=Math.min(...d.map(x=>x.v)),max=Math.max(...d.map(x=>x.v)),span=max-min||1,startIndex=Math.max(0,Math.min(100,Math.round((start-min)/span*100))),endIndex=Math.max(0,Math.min(100,Math.round((end-min)/span*100)));
  return `<button class="micro396" data-component396="${id}"><div><div class="kicker">${m.role}</div><b>${m.short}</b><div class="driverNote396">Relative position · 0–100</div></div><div class="microBars396" aria-label="${m.short} start and end relative-position columns"><div class="microCol396"><div class="microBar396" style="height:${Math.max(3,startIndex)}%"></div><span class="muted tiny">Start ${startIndex}</span></div><div class="microCol396"><div class="microBar396 end" style="height:${Math.max(3,endIndex)}%"></div><span class="muted tiny">End ${endIndex}</span></div></div><div><div class="microLegend396"><span>${fmt(id,start)}</span><span>${fmt(id,end)}</span></div><b>${z?pct(z.p):'Unavailable'} · ${H[state.range].label}</b></div></button>`;
}

renderNow=function(){
  const r=regimeSummary(state.range),rd=regimeSeries393(state.range),rchg=periodChange393(rd);
  $('#nowSnapshot').innerHTML=`<div class="now396"><article class="card regime396" data-regime396 tabindex="0" role="button" aria-label="Open Regime index detail"><div class="regime396Head"><div><div class="kicker">REGIME SENTIMENT INDEX · 0–100</div><div class="regime396Metric"><strong>${r?r.score:'—'}</strong><span>/100</span><span class="chip ${r?.score>=58?'good':r?.score<=42?'bad':'neutral'}">${r?.label||'Unavailable'}</span></div><div class="muted">${H[state.range].label} · ${rd.length?dateRangeLabel392(rd,state.range):'insufficient history'} · ${Number.isFinite(rchg)?pct(rchg):'Unavailable'} change</div></div><div class="flow393"><b>Regime</b><span>→</span><span>Risk / Growth / Macro</span><span>→</span><span>Drivers</span></div></div><div class="chartBox"><canvas id="regime396Chart" class="chart"></canvas></div></article><div class="categoryGrid396">${['risk','growth','macro'].map(key=>{const c=CATEGORY[key],z=categoryIndex(key,state.range),d=categoryHistory393(key,state.range),chg=periodChange393(d);return `<article class="card category396" data-category396="${key}" tabindex="0" role="button" aria-label="Open ${c.name} category detail"><div class="row"><h3>${c.name}</h3><span class="chip ${z?.cls||'neutral'}">${z?.label||'Unavailable'}</span></div><div><div class="value">${z?z.score:'—'}<span class="muted" style="font-size:11px"> /100</span></div><div class="muted tiny">${H[state.range].label} · ${Number.isFinite(chg)?pct(chg):'Unavailable'} change</div></div><canvas data-category-chart396="${key}"></canvas></article>`}).join('')}</div></div>`;
  setTimeout(()=>{indexChart396($('#regime396Chart'),rd,'Regime index','#f3b347',state.range,false);$$('[data-category-chart396]').forEach(c=>{const key=c.dataset.categoryChart396;indexChart396(c,categoryHistory393(key,state.range),`${CATEGORY[key].name} index`,'#6db7ff',state.range,true)});const ro=()=>openRegime393();$('[data-regime396]')?.addEventListener('click',ro);$('[data-regime396]')?.addEventListener('keydown',e=>{if(e.key==='Enter')ro()});$$('[data-category396]').forEach(e=>{const fn=()=>openCategory(e.dataset.category396);e.onclick=fn;e.onkeydown=ev=>{if(ev.key==='Enter')fn()}})},0);
  renderGlobalRange();
};

const drawCategory396Base=drawCategory;
drawCategory=async function(){
  const key=state.detail?.category;if(!key)return drawCategory396Base();
  const c=CATEGORY[key],z=categoryIndex(key,state.range),d=categoryHistory393(key,state.range),chg=periodChange393(d);
  $('#detailKicker').textContent='CATEGORY INDEX';$('#detailTitle').innerHTML=`${c.name} · ${z?z.score:'—'}/100<div class="dateRange">${dateRangeLabel392(d,state.range)}</div><div class="modalSub393">${directionCopy393(key,z)}</div>`;
  $('#detailRanges').innerHTML=Object.entries(H).map(([k,v])=>`<button data-cr396="${k}" class="${k===state.range?'active':''}">${v.label}</button>`).join('');
  indexChart396($('#detailChart'),d,`${c.name} index`,'#6db7ff',state.range,false);
  $('#detailStats').innerHTML=`<div class="stat"><span class="kicker">INDEX</span><b>${z?z.score:'—'} /100</b></div><div class="stat"><span class="kicker">SIGNAL</span><b><span class="chip ${z?.cls||'neutral'}">${z?.label||'Unavailable'}</span></b></div><div class="stat"><span class="kicker">${H[state.range].label} CHANGE</span><b>${Number.isFinite(chg)?pct(chg):'Unavailable'}</b></div><div style="grid-column:1/-1;min-height:0;overflow:hidden"><div class="kicker" style="margin:3px 0 6px">DRIVERS · START / END · CLICK FOR DETAIL</div><div class="microGrid396">${c.components.map(microComponent396).join('')}</div></div>`;
  $('#saveDetail').style.display='';$('#saveDetail').textContent='Add to Analysis';$('#saveDetail').onclick=()=>saveAnalysis(`${c.name} ${H[state.range].label} index`,{type:'category',category:key,range:state.range,index:z,data:d});
  $$('[data-cr396]').forEach(b=>b.onclick=async()=>{state.range=b.dataset.cr396;state.detail.range=state.range;renderGlobalRange();renderNow();await drawCategory()});
  $$('[data-component396]').forEach(b=>b.onclick=()=>openDetail(b.dataset.component396));
};

const drawRegime396Base=drawRegime393;
drawRegime393=async function(){
  const d=regimeSeries393(state.range),r=regimeSummary(state.range),chg=periodChange393(d);$('#detailKicker').textContent='REGIME SENTIMENT INDEX';$('#detailTitle').innerHTML=`Regime · ${r?r.score:'—'}/100<div class="dateRange">${dateRangeLabel392(d,state.range)}</div>`;$('#detailRanges').innerHTML=Object.entries(H).map(([k,v])=>`<button data-regime396-range="${k}" class="${k===state.range?'active':''}">${v.label}</button>`).join('');indexChart396($('#detailChart'),d,'Regime index','#f3b347',state.range,false);$('#detailStats').innerHTML=`<div class="stat"><span class="kicker">CURRENT</span><b>${r?r.score:'—'} /100</b></div><div class="stat"><span class="kicker">SIGNAL</span><b>${r?.label||'Unavailable'}</b></div><div class="stat"><span class="kicker">${H[state.range].label} CHANGE</span><b>${Number.isFinite(chg)?pct(chg):'Unavailable'}</b></div><div class="stat"><span class="kicker">BASELINE</span><b>50 /100</b></div>`;$('#saveDetail').style.display='';$('#saveDetail').textContent='Add to Library';$('#saveDetail').onclick=()=>saveAnalysis(`Regime ${H[state.range].label}`,{type:'regime',range:state.range,data:d});$$('[data-regime396-range]').forEach(b=>b.onclick=async()=>{state.range=b.dataset.regime396Range;state.detail.range=state.range;renderGlobalRange();renderNow();await drawRegime393()})
};

renderGlobalRange=function(){const e=$('#globalRange');if(!e)return;e.innerHTML=Object.entries(H).map(([k,v])=>`<button data-global396="${k}" class="${k===state.range?'active':''}">${v.label}</button>`).join('');$$('[data-global396]').forEach(b=>b.onclick=()=>{state.range=b.dataset.global396;renderNow();if(state.detail?.regime)drawRegime393();else if(state.detail?.category)drawCategory();else if(state.detail?.id)drawDetail();if(!H[state.range].intraday&&['spy','tenYear','wti'].some(id=>!coverage(id,state.range)))ensureFoundation392().then(async built=>{if(built)await buildRegimeHistory();renderNow();if(state.detail?.regime)drawRegime393();else if(state.detail?.category)drawCategory();else if(state.detail?.id)drawDetail()}).catch(e=>log(e.message,'error'))})};

const setSection396Base=setSection;
setSection=function(id,tab){state.section=id;state.tab=id==='now'?'nowSnapshot':(tab||TABS[id][0][1]);$$('.section').forEach(x=>x.classList.toggle('active',x.id===id));$$('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.nav===id));$('#pageTitle').textContent=NAV.find(x=>x[0]===id)[1];const tabs=$('#tabs');if(id==='now'){tabs.innerHTML='';tabs.style.display='none'}else{tabs.style.display='flex';tabs.innerHTML=TABS[id].map(([label,target])=>`<button data-tab="${target}" class="${target===state.tab?'active':''}">${label}</button>`).join('');$$('[data-tab]').forEach(b=>b.onclick=()=>setSection(id,b.dataset.tab))}$$('.story').forEach(x=>x.classList.remove('active'));$('#'+state.tab)?.classList.add('active');document.body.classList.remove('drawer');if(id==='now'){renderNow();renderGlobalRange()}};

setTimeout(()=>{if(state.section==='now')setSection('now')},0);
'''
s=s.replace('</script>',js+'\n</script>',1)
p.write_text(s)
print('Patched Market Navigator to 3.9.6')
