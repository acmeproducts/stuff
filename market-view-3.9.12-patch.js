'use strict';
(() => {
  const VERSION = '3.9.12';
  const DAY = 864e5;
  const RANGES = ['1d','5d','1mo','3mo','6mo','ytd','1y','5y','max'];
  const LABEL = {1d:'1D',5d:'5D',1mo:'1M',3mo:'3M',6mo:'6M',ytd:'YTD',1y:'1Y',5y:'5Y',max:'All'};

  const css = document.createElement('style');
  css.textContent = `
    .brand small{opacity:.9}
    .flow393{display:none!important}
    .globalRange button:disabled,.rangebar button:disabled,.mnRange3912 button:disabled{opacity:.26!important;cursor:not-allowed!important;background:#0b1422!important;border-color:var(--line)!important;color:var(--muted)!important}
    .mnHome3912{height:100%;display:grid;grid-template-rows:minmax(0,1.18fr) minmax(0,.82fr);gap:10px;overflow:hidden}
    .mnEntity3912{display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px;min-height:0;cursor:pointer}
    .mnEntity3912:hover{border-color:var(--accent)}
    .mnHead3912{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
    .mnMetric3912{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}.mnMetric3912 strong{font-size:28px}.mnMetric3912 .change{font-size:12px;font-weight:850}
    .mnCats3912{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-height:0}
    .mnCat3912{display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:4px;min-height:0;cursor:pointer}.mnCat3912 canvas{width:100%;height:100%;min-height:0}
    .mnModal3912{position:fixed;z-index:1200;inset:0;background:#02060de6;display:none;align-items:center;justify-content:center;padding:14px}.mnModal3912.open{display:flex}
    .mnPanel3912{width:min(1050px,100%);height:min(92vh,820px);background:#101b2d;border:1px solid var(--line);border-radius:16px;padding:14px;display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:8px;overflow:hidden}
    .mnTitle3912{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.mnTitle3912 h2{margin:2px 0;font-size:25px}.mnClose3912{width:42px;height:42px;border:1px solid var(--line);border-radius:10px;background:#17243a;color:var(--text);font-size:20px}
    .mnSummary3912{display:flex;gap:11px;align-items:center;flex-wrap:wrap;margin-top:4px}.mnSummary3912 .main{font-size:22px;font-weight:900}.mnSummary3912 .item{font-size:12px;color:var(--muted)}.mnSummary3912 .item b{color:var(--text)}
    .mnRange3912{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}.mnRange3912::-webkit-scrollbar{display:none}.mnRange3912 button{flex:0 0 auto;border:1px solid var(--line);background:#15223a;color:var(--muted);border-radius:999px;padding:7px 11px;font-weight:780}.mnRange3912 button.active{border-color:var(--accent);background:#203b61;color:var(--text)}
    .mnBody3912{min-height:0;display:grid;grid-template-rows:minmax(0,1fr);overflow:hidden}
    .mnIndexBody3912{min-height:0;display:grid;grid-template-rows:minmax(220px,1fr) minmax(180px,.82fr);gap:8px}
    .mnChartWrap3912{position:relative;min-height:0;border:1px solid var(--line);border-radius:12px;background:#0b1728;padding:8px}.mnChartWrap3912 canvas{width:100%;height:100%;touch-action:none;cursor:crosshair}
    .mnComponents3912{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:7px;min-height:0;overflow:auto}
    .mnComponent3912{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr);min-height:145px;border:1px solid var(--line);border-radius:11px;background:#0b1728;padding:7px;cursor:pointer}.mnComponent3912:hover{border-color:var(--accent)}
    .mnComponentHead3912{display:flex;align-items:baseline;justify-content:space-between;gap:6px;font-size:10px}.mnComponentHead3912 b{font-size:12px}.mnComponentHead3912 span{color:var(--muted);white-space:nowrap}.mnComponent3912 canvas{width:100%;height:100%;min-height:0}
    .mnEnd3912{position:absolute;z-index:5;font-size:9px;font-weight:850;background:#07111ee8;border:1px solid var(--line);border-radius:5px;padding:2px 4px;pointer-events:none;white-space:nowrap}
    .mnTip3912{position:fixed;z-index:1400;background:#eef5ff;color:#07111e;padding:7px 9px;border-radius:8px;font-size:11px;pointer-events:none;box-shadow:0 8px 28px #0007;white-space:nowrap}
    .mnGood3912{color:var(--good)!important}.mnBad3912{color:var(--bad)!important}.mnNeutral3912{color:var(--warn)!important}
    @media(max-width:700px){.mnModal3912{padding:0}.mnPanel3912{width:100%;height:100%;max-height:none;border-radius:0;padding:11px}.mnIndexBody3912{grid-template-rows:minmax(210px,.9fr) minmax(0,1.1fr)}.mnComponents3912{grid-template-columns:repeat(2,minmax(0,1fr));overflow:auto}.mnComponent3912{min-height:135px}.mnCats3912{gap:6px}.mnCat3912{padding:8px}.mnMetric3912 strong{font-size:23px}.mnSummary3912{gap:7px}.mnSummary3912 .item{font-size:10px}}
  `;
  document.head.appendChild(css);
  const brand = document.querySelector('.brand small');
  if (brand) brand.textContent = `Directional situational awareness · Version ${VERSION}`;

  // Fix navigation at the DOM boundary. No dependence on prior patch handlers.
  const hamburger = document.querySelector('.hamb');
  if (hamburger) {
    hamburger.onclick = null;
    hamburger.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); document.body.classList.toggle('drawer'); });
  }
  document.querySelectorAll('.nav button,.configBtn').forEach(b => b.addEventListener('click', () => document.body.classList.remove('drawer')));

  function rangeStart(range,end){
    const h=H[range]; if(!h||h.max)return null;
    if(h.ytd)return Date.UTC(new Date(end).getUTCFullYear(),0,1);
    if(h.intraday)return end-(range==='1d'?1:5)*DAY;
    return end-(h.days||90)*DAY;
  }
  function sliceRaw(id,range){
    const a=state.series[id]||[]; if(!a.length)return[];
    const end=a.at(-1).t,start=rangeStart(range,end); return start==null?a.slice():a.filter(p=>p.t>=start&&p.t<=end);
  }
  function hasCoverage(data,range){
    if(!data||data.length<2)return false; if(range==='max')return true;
    const end=data.at(-1).t,start=rangeStart(range,end); if(start==null)return true;
    return data[0].t<=start+Math.max(3*DAY,(end-start)*.08);
  }
  function regimeSeries(range){
    if(H[range]?.intraday)return[];
    const ids=['spy','tenYear','wti']; if(!ids.every(id=>(state.series[id]||[]).length>30))return[];
    const end=Math.min(...ids.map(id=>state.series[id].at(-1).t));
    let start=rangeStart(range,end),usable=Math.max(...ids.map(id=>state.series[id][0].t+30*DAY));
    start=start==null?usable:Math.max(start,usable);
    const out=[]; for(const p of state.series.spy){if(p.t<start||p.t>end)continue;const r=regimeAt(p.t);if(r&&Number.isFinite(r.score))out.push({t:p.t,v:r.score})} return out;
  }
  function categorySeries(key,range){return (categoryHistory393(key,range)||[]).filter(p=>Number.isFinite(p.v));}
  function percentSeries(id,range){const raw=sliceRaw(id,range);if(raw.length<2||!raw[0].v)return{raw,data:[]};const b=raw[0].v;return{raw,data:raw.map(p=>({t:p.t,v:(p.v/b-1)*100}))};}
  function indexSummary(data,positive,negative,posLabel,negLabel){if(!data?.length)return null;const start=data[0].v,current=data.at(-1).v,change=current-start;return{start,current,change,signal:current>=positive?posLabel:current<=negative?negLabel:'Neutral',cls:current>=positive?'good':current<=negative?'bad':'neutral'}}
  function fmtPts(v){return Number.isFinite(v)?`${v>=0?'+':''}${v.toFixed(0)} pts`:'Unavailable'}
  function fmtPct(v){return Number.isFinite(v)?`${v>=0?'+':''}${v.toFixed(2)}%`:'Unavailable'}
  function tone(cls){return cls==='good'?'mnGood3912':cls==='bad'?'mnBad3912':'mnNeutral3912'}
  function rawFmt(id,v){return Number.isFinite(v)?fmt(id,v):'—'}
  function categoryIds(key){const c=CATEGORY[key];return (c?.components||[]).filter(id=>META[id]&&(state.series[id]||[]).length>1)}

  // The only data contract consumed by the visual layer.
  function entity(kind,key,range){
    if(kind==='regime'){
      const data=regimeSeries(range),s=indexSummary(data,62,38,'Optimistic','Pessimistic');
      return {kind,key:'regime',range,title:'Regime',kicker:'REGIME SENTIMENT INDEX · 0–100',mode:'index',color:'#f3b347',data,summary:s,components:['risk','growth','macro'],coverage:hasCoverage(data,range)};
    }
    if(kind==='category'){
      const data=categorySeries(key,range),s=indexSummary(data,58,42,'Positive','Negative');
      return {kind,key,range,title:CATEGORY[key]?.name||key,kicker:'CATEGORY INDEX · 0–100',mode:'index',color:'#6db7ff',data,summary:s,components:categoryIds(key),coverage:hasCoverage(data,range)};
    }
    const x=percentSeries(key,range),chg=x.data.length?x.data.at(-1).v:null;
    let cls=!Number.isFinite(chg)||Math.abs(chg)<.1?'neutral':chg>0?'good':'bad';
    return {kind:'component',key,range,title:META[key]?.name||key,kicker:(META[key]?.role||'INDEX COMPONENT').toUpperCase(),mode:'percent',color:META[key]?.color||'#6db7ff',data:x.data,raw:x.raw,summary:{start:x.raw[0]?.v,current:x.raw.at(-1)?.v,change:chg,signal:cls==='good'?'Positive':cls==='bad'?'Negative':'Neutral',cls},components:[],coverage:hasCoverage(x.raw,range)};
  }
  function supports(kind,key,range){
    if(kind==='regime')return hasCoverage(regimeSeries(range),range);
    if(kind==='category')return hasCoverage(categorySeries(key,range),range);
    return hasCoverage(sliceRaw(key,range),range);
  }
  function bestRange(kind,key,wanted){if(supports(kind,key,wanted))return wanted;return ['1y','ytd','6mo','3mo','1mo','5d','1d','max'].find(r=>supports(kind,key,r))||wanted}

  function canvasSetup(c){const r=c.getBoundingClientRect(),d=devicePixelRatio||1,w=Math.max(1,r.width),h=Math.max(1,r.height);c.width=w*d;c.height=h*d;const x=c.getContext('2d');x.setTransform(d,0,0,d,0,0);return{x,w,h}}
  function chart(c,e,compact=false){
    const {x,w,h}=canvasSetup(c),data=e.data||[],pad=compact?{l:28,r:8,t:15,b:18}:{l:46,r:14,t:20,b:27};x.clearRect(0,0,w,h);
    c.parentElement.querySelectorAll('.mnEnd3912').forEach(n=>n.remove());
    if(data.length<2){x.fillStyle='#91a3bb';x.font='11px system-ui';x.fillText('Insufficient historical coverage',pad.l,pad.t+12);return}
    const vals=data.map(p=>p.v);let lo,hi;
    if(e.mode==='index'){lo=0;hi=100}else{const abs=Math.max(1,Math.abs(Math.min(...vals)),Math.abs(Math.max(...vals)));lo=-abs*1.08;hi=abs*1.08}
    const t0=data[0].t,t1=data.at(-1).t;
    x.strokeStyle='#334965';x.lineWidth=1;x.fillStyle='#a9bad0';x.font=compact?'8px system-ui':'9px system-ui';
    const ticks=e.mode==='index'?[0,25,50,75,100]:[lo,0,hi];
    ticks.forEach(v=>{const y=pad.t+(hi-v)/(hi-lo)*(h-pad.t-pad.b);x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke();if(!compact)x.fillText(e.mode==='index'?String(Math.round(v)):`${v>0?'+':''}${v.toFixed(0)}%`,3,y+3)});
    x.strokeStyle=e.color;x.lineWidth=compact?1.7:2.2;x.beginPath();data.forEach((p,i)=>{const px=pad.l+(p.t-t0)/Math.max(1,t1-t0)*(w-pad.l-pad.r),py=pad.t+(hi-p.v)/(hi-lo)*(h-pad.t-pad.b);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
    const xy=p=>({x:pad.l+(p.t-t0)/Math.max(1,t1-t0)*(w-pad.l-pad.r),y:pad.t+(hi-p.v)/(hi-lo)*(h-pad.t-pad.b)}),a=xy(data[0]),b=xy(data.at(-1));x.fillStyle=e.color;[a,b].forEach(p=>{x.beginPath();x.arc(p.x,p.y,3.2,0,Math.PI*2);x.fill()});
    if(!compact){x.fillStyle='#a9bad0';const sd=new Date(t0).toLocaleDateString(undefined,{month:'short',day:'numeric'}),ed=new Date(t1).toLocaleDateString(undefined,{month:'short',day:'numeric'});x.fillText(sd,pad.l,h-7);x.fillText(ed,w-pad.r-x.measureText(ed).width,h-7)}
    if(e.mode==='percent'&&e.raw?.length){endpoint(c,a,rawFmt(e.key,e.raw[0].v),false);endpoint(c,b,rawFmt(e.key,e.raw.at(-1).v),true)}
    c.onpointermove=ev=>tooltip(ev,c,e,pad,t0,t1);c.onpointerleave=()=>document.querySelector('.mnTip3912')?.remove();
  }
  function endpoint(c,p,text,right){const n=document.createElement('span');n.className='mnEnd3912';n.textContent=text;c.parentElement.appendChild(n);requestAnimationFrame(()=>{if(right)n.style.right='3px';else n.style.left=Math.max(3,p.x+4)+'px';n.style.top=Math.max(3,Math.min(c.clientHeight-20,p.y-9))+'px'})}
  function tooltip(ev,c,e,pad,t0,t1){document.querySelector('.mnTip3912')?.remove();const r=c.getBoundingClientRect(),ratio=Math.max(0,Math.min(1,(ev.clientX-r.left-pad.l)/(r.width-pad.l-pad.r))),target=t0+ratio*(t1-t0),p=e.data.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a,e.data[0]);let value=e.mode==='index'?`${p.v.toFixed(0)}/100`:`${p.v>=0?'+':''}${p.v.toFixed(2)}%`;if(e.mode==='percent'&&e.raw?.length){const rp=e.raw.reduce((a,b)=>Math.abs(b.t-p.t)<Math.abs(a.t-p.t)?b:a,e.raw[0]);value+=` · ${rawFmt(e.key,rp.v)}`}const n=document.createElement('div');n.className='mnTip3912';n.innerHTML=`<b>${esc(e.title)}</b><br>${value}<br>${new Date(p.t).toLocaleString()}`;n.style.left=Math.min(innerWidth-210,ev.clientX+10)+'px';n.style.top=Math.max(6,ev.clientY-70)+'px';document.body.appendChild(n)}

  function rangeButtons(kind,key,range){return RANGES.map(r=>`<button data-mnr="${r}" ${supports(kind,key,r)?'':'disabled'} class="${r===range&&supports(kind,key,r)?'active':''}" title="${supports(kind,key,r)?'':`Insufficient stored history for ${LABEL[r]}`}">${LABEL[r]}</button>`).join('')}
  function dateLine(e){if(!e.data?.length)return'Unavailable';return `${new Date(e.data[0].t).toLocaleDateString()} – ${new Date(e.data.at(-1).t).toLocaleDateString()} (${LABEL[e.range]})`}

  function modal(){let m=document.getElementById('mnModal3912');if(m)return m;m=document.createElement('div');m.id='mnModal3912';m.className='mnModal3912';m.innerHTML='<div class="mnPanel3912"><div id="mnTitle3912"></div><div id="mnRange3912" class="mnRange3912"></div><div id="mnBody3912" class="mnBody3912"></div></div>';document.body.appendChild(m);m.onclick=ev=>{if(ev.target===m)m.classList.remove('open')};return m}
  function summaryHtml(e){const s=e.summary;if(!s)return'<span class="item">Unavailable</span>';if(e.mode==='index')return `<span class="main">${Math.round(s.current)}/100</span><span class="chip ${s.cls}">${s.signal}</span><span class="item">Start <b>${Math.round(s.start)}/100</b></span><span class="item">Current <b>${Math.round(s.current)}/100</b></span><span class="item">Change <b class="${tone(s.cls)}">${fmtPts(s.change)}</b></span>`;return `<span class="main">${rawFmt(e.key,s.current)}</span><span class="chip ${s.cls}">${s.signal}</span><span class="item">Start <b>${rawFmt(e.key,s.start)}</b></span><span class="item">Current <b>${rawFmt(e.key,s.current)}</b></span><span class="item">Change <b class="${tone(s.cls)}">${fmtPct(s.change)}</b></span>`}

  // Single visual component for regime, category index, and raw index component.
  function openEntity(kind,key,requested=state.range){
    const range=bestRange(kind,key,requested),e=entity(kind,key,range),m=modal();state.range=range;
    document.getElementById('mnTitle3912').innerHTML=`<div class="mnTitle3912"><div><div class="kicker">${esc(e.kicker)}</div><h2>${esc(e.title)}</h2><div class="muted tiny">${dateLine(e)}</div><div class="mnSummary3912">${summaryHtml(e)}</div></div><button id="mnClose3912" class="mnClose3912">×</button></div>`;
    document.getElementById('mnRange3912').innerHTML=rangeButtons(kind,key,range);
    const body=document.getElementById('mnBody3912');
    if(kind==='category'){
      body.innerHTML=`<div class="mnIndexBody3912"><div class="mnChartWrap3912"><canvas id="mnMain3912"></canvas></div><div class="mnComponents3912">${e.components.map(id=>{const ce=entity('component',id,range);return `<div class="mnComponent3912" data-comp="${id}"><div class="mnComponentHead3912"><b>${esc(META[id].short)}</b><span>${ce.summary?fmtPct(ce.summary.change):'Unavailable'}</span></div><canvas id="mnComp-${id}"></canvas></div>`}).join('')}</div></div>`;
      requestAnimationFrame(()=>{chart(document.getElementById('mnMain3912'),e,false);e.components.forEach(id=>chart(document.getElementById('mnComp-'+id),entity('component',id,range),true));document.querySelectorAll('[data-comp]').forEach(n=>n.onclick=()=>openEntity('component',n.dataset.comp,range))});
    }else{
      body.innerHTML='<div class="mnChartWrap3912"><canvas id="mnMain3912"></canvas></div>';
      requestAnimationFrame(()=>chart(document.getElementById('mnMain3912'),e,false));
    }
    m.classList.add('open');document.getElementById('mnClose3912').onclick=()=>m.classList.remove('open');document.querySelectorAll('[data-mnr]').forEach(b=>b.onclick=()=>{if(!b.disabled)openEntity(kind,key,b.dataset.mnr)});
    renderGlobal();renderHome();
  }

  function renderGlobal(){const g=document.getElementById('globalRange');if(!g)return;g.innerHTML=RANGES.map(r=>`<button data-global="${r}" ${supports('regime','regime',r)?'':'disabled'} class="${r===state.range&&supports('regime','regime',r)?'active':''}">${LABEL[r]}</button>`).join('');document.querySelectorAll('[data-global]').forEach(b=>b.onclick=()=>{if(b.disabled)return;state.range=b.dataset.global;renderHome()})}
  function renderHome(){const host=document.getElementById('nowSnapshot');if(!host)return;const r=entity('regime','regime',state.range),cats=['risk','growth','macro'];host.innerHTML=`<div class="mnHome3912"><article class="card mnEntity3912" data-home-regime><div class="mnHead3912"><div><div class="kicker">${r.kicker}</div><div class="mnMetric3912"><strong>${r.summary?Math.round(r.summary.current):'—'}</strong><span>/100</span><span class="chip ${r.summary?.cls||'neutral'}">${r.summary?.signal||'Unavailable'}</span><span class="change">${fmtPts(r.summary?.change)}</span></div><div class="muted tiny">${dateLine(r)} · start ${r.summary?Math.round(r.summary.start)+'/100':'—'} → current ${r.summary?Math.round(r.summary.current)+'/100':'—'}</div></div></div><div class="chartBox"><canvas id="mnHomeRegime"></canvas></div></article><div class="mnCats3912">${cats.map(k=>{const e=entity('category',k,state.range);return `<article class="card mnCat3912" data-home-cat="${k}"><div class="row"><h3>${esc(e.title)}</h3><span class="chip ${e.summary?.cls||'neutral'}">${e.summary?.signal||'Unavailable'}</span></div><div class="mnMetric3912"><strong>${e.summary?Math.round(e.summary.current):'—'}</strong><span>/100</span><span class="change">${fmtPts(e.summary?.change)}</span></div><canvas id="mnHomeCat-${k}"></canvas></article>`}).join('')}</div></div>`;requestAnimationFrame(()=>{chart(document.getElementById('mnHomeRegime'),r,false);cats.forEach(k=>chart(document.getElementById('mnHomeCat-'+k),entity('category',k,state.range),true));document.querySelector('[data-home-regime]').onclick=()=>openEntity('regime','regime',state.range);document.querySelectorAll('[data-home-cat]').forEach(n=>n.onclick=()=>openEntity('category',n.dataset.homeCat,state.range))});renderGlobal()}

  // Kill legacy detail visual paths. All detail navigation is routed through ChartEntity → ChartView.
  openRegime393=()=>openEntity('regime','regime',state.range);
  openCategory=key=>openEntity('category',key,state.range);
  openDetail=id=>openEntity('component',id,state.range);
  drawRegime393=()=>openEntity('regime','regime',state.range);
  drawCategory=()=>{if(state.detail?.category)openEntity('category',state.detail.category,state.range)};
  drawDetail=()=>{if(state.detail?.id)openEntity('component',state.detail.id,state.range)};
  renderNow=renderHome;
  renderGlobalRange=renderGlobal;

  // Keep the base app's two-tier hydration, but make the coherent renderer the final paint.
  const oldRenderAll=renderAll;
  renderAll=function(){oldRenderAll();renderHome()};
  renderHome();
  setTimeout(renderHome,100);
})();
