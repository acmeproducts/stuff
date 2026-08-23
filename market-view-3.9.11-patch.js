'use strict';
(() => {
  const PATCH_VERSION = '3.9.11';
  const DAY = 864e5;
  const BACKEND_ROOT = 'data/market-backend/';
  const MANIFEST_URL = BACKEND_ROOT + 'market-manifest.json';
  const REV_KEY = 'mn-backend-revisions-v1';
  const RANGE_ORDER = ['1d','5d','1mo','3mo','6mo','ytd','1y','5y','max'];

  const style = document.createElement('style');
  style.textContent = `
    .brand small{opacity:.9}.flow393{display:none!important}
    .globalRange button:disabled,.rangebar button:disabled{opacity:.28;cursor:not-allowed;background:#0b1422!important;border-color:#263854!important;color:#91a3bb!important}
    .now3911{height:100%;display:grid;grid-template-rows:minmax(0,1.35fr) minmax(0,.65fr);gap:10px;overflow:hidden}
    .regime3911{display:grid;grid-template-rows:auto minmax(0,1fr);gap:5px;min-height:0;cursor:pointer}
    .regimeHead3911{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
    .metric3911{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}.metric3911 strong{font-size:28px}.metric3911 .delta{font-size:12px;font-weight:800}
    .categoryGrid3911{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;min-height:0}
    .category3911{display:grid;grid-template-rows:auto auto minmax(0,1fr);gap:4px;min-height:0;cursor:pointer}.category3911 canvas{width:100%;height:100%;min-height:0}
    .detailCompact3911{grid-template-rows:auto auto minmax(0,1fr) auto!important}.stats3911{display:flex;gap:8px;align-items:stretch;flex-wrap:nowrap;overflow:hidden}.stats3911 .stat{flex:1;min-width:0}.stats3911 .stat b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .componentGrid3911{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;height:100%;min-height:0}.component3911{position:relative;display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;border:1px solid var(--line);border-radius:12px;background:#0b1728;padding:7px;cursor:pointer}.componentHead3911{display:flex;justify-content:space-between;gap:6px;align-items:baseline;font-size:10px}.componentHead3911 b{font-size:12px}.componentHead3911 span{color:var(--muted);white-space:nowrap}.component3911 canvas{width:100%;height:100%;min-height:0}
    .endpoint3911{position:absolute;z-index:3;font-size:9px;font-weight:850;background:#07111ee8;border:1px solid var(--line);border-radius:5px;padding:2px 4px;pointer-events:none;white-space:nowrap}
    @media(max-width:600px){.now3911{grid-template-rows:minmax(0,1.3fr) minmax(0,.7fr)}.categoryGrid3911{gap:6px}.category3911{padding:8px}.category3911 h3{font-size:13px}.metric3911 strong{font-size:24px}.componentGrid3911{gap:5px}.component3911{padding:5px}.componentHead3911{display:block}.stats3911{gap:5px}.stats3911 .stat{padding:6px;font-size:10px}}
  `;
  document.head.appendChild(style);

  const brand = document.querySelector('.brand small');
  if (brand) brand.textContent = `Directional situational awareness · Version ${PATCH_VERSION}`;

  function rangeStart3911(range, end) {
    const h = H[range];
    if (!h || h.max) return null;
    if (h.ytd) return Date.UTC(new Date(end).getUTCFullYear(), 0, 1);
    if (h.intraday) return end - (range === '1d' ? 1 : 5) * DAY;
    return end - (h.days || 90) * DAY;
  }

  function rawRange3911(id, range) {
    const a = state.series[id] || [];
    if (!a.length) return [];
    const end = a.at(-1).t;
    const start = rangeStart3911(range, end);
    return start == null ? a.slice() : a.filter(p => p.t >= start && p.t <= end);
  }

  function supported3911(id, range) {
    const a = state.series[id] || [];
    if (a.length < 2) return false;
    if (range === 'max') return true;
    if (H[range]?.intraday) return !!state.intraday?.[`${id}:${range}`]?.length || range === '5d';
    const end = a.at(-1).t;
    const start = rangeStart3911(range, end);
    if (start == null) return true;
    const tolerance = Math.max(3 * DAY, (end - start) * .08);
    return a[0].t <= start + tolerance;
  }

  function regimeSeries3911(range = state.range) {
    if (H[range]?.intraday) return [];
    const ids = ['spy','tenYear','wti'];
    if (!ids.every(id => (state.series[id] || []).length > 30)) return [];
    const commonEnd = Math.min(...ids.map(id => state.series[id].at(-1).t));
    let start = rangeStart3911(range, commonEnd);
    const usableStart = Math.max(...ids.map(id => state.series[id][0].t + 30 * DAY));
    if (start == null) start = usableStart;
    start = Math.max(start, usableStart);
    const out = [];
    for (const p of state.series.spy) {
      if (p.t < start || p.t > commonEnd) continue;
      const r = regimeAt(p.t);
      if (r && Number.isFinite(r.score)) out.push({t:p.t,v:r.score});
    }
    return out;
  }

  function indexSummary3911(data, positive = 62, negative = 38, posLabel='Optimistic', negLabel='Pessimistic') {
    if (!data?.length) return null;
    const start = data[0].v, end = data.at(-1).v, delta = end - start;
    return {start,end,score:end,delta,label:end >= positive ? posLabel : end <= negative ? negLabel : 'Neutral', cls:end >= positive ? 'good' : end <= negative ? 'bad' : 'neutral'};
  }

  function categorySeries3911(key, range = state.range) {
    return categoryHistory393(key, range).filter(p => Number.isFinite(p.v));
  }

  function categorySummary3911(key, range = state.range) {
    return indexSummary3911(categorySeries3911(key, range), 58, 42, 'Positive', 'Negative');
  }

  function pts3911(v) { return Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(0)} pts` : 'Unavailable'; }
  function pct3911(v) { return Number.isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` : 'Unavailable'; }

  function dateRange3911(data, range) {
    if (!data?.length) return `${H[range]?.label || range} · unavailable`;
    const f = data[0], l = data.at(-1);
    return `${new Date(f.t).toLocaleDateString()} – ${new Date(l.t).toLocaleDateString()} (${H[range]?.label || range})`;
  }

  function indexChart3911(canvas, data, name, color, range=state.range, compact=false) {
    indexChart396(canvas, data, name, color, range, compact);
  }

  function pctSeries3911(id, range) {
    const raw = rawRange3911(id, range);
    if (raw.length < 2 || !raw[0].v) return {raw,data:[]};
    const base = raw[0].v;
    return {raw, data:raw.map(p => ({t:p.t,v:(p.v/base - 1) * 100}))};
  }

  function fmtRaw3911(id,v) {
    if (!Number.isFinite(v)) return '—';
    return fmt(id,v);
  }

  function pctChart3911(canvas, id, range, compact=false) {
    const {raw,data} = pctSeries3911(id, range);
    const {x,w,h} = setupCanvas(canvas);
    const pad = compact ? {l:31,r:9,t:18,b:20} : {l:48,r:14,t:22,b:28};
    x.clearRect(0,0,w,h);
    if (data.length < 2) { x.fillStyle='#91a3bb'; x.font='11px system-ui'; x.fillText('Insufficient history',pad.l,pad.t+12); return; }
    const vals = data.map(p=>p.v), abs = Math.max(1,Math.abs(Math.min(...vals)),Math.abs(Math.max(...vals))), lo=-abs*1.08, hi=abs*1.08;
    const t0=data[0].t,t1=data.at(-1).t;
    x.strokeStyle='#334965';x.fillStyle='#cbd8e6';x.font=compact?'8px system-ui':'9px system-ui';
    for (const v of [-abs,0,abs]) { const y=pad.t+(hi-v)/(hi-lo)*(h-pad.t-pad.b);x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke();if(!compact)x.fillText(`${v>0?'+':''}${v.toFixed(0)}%`,3,y); }
    x.strokeStyle=META[id].color;x.lineWidth=compact?1.6:2;x.beginPath();
    data.forEach((p,i)=>{const px=pad.l+(p.t-t0)/Math.max(1,t1-t0)*(w-pad.l-pad.r),py=pad.t+(hi-p.v)/(hi-lo)*(h-pad.t-pad.b);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
    const xy=p=>({x:pad.l+(p.t-t0)/Math.max(1,t1-t0)*(w-pad.l-pad.r),y:pad.t+(hi-p.v)/(hi-lo)*(h-pad.t-pad.b)}), a=xy(data[0]), b=xy(data.at(-1));
    x.fillStyle=META[id].color;for(const p of [a,b]){x.beginPath();x.arc(p.x,p.y,3,0,Math.PI*2);x.fill()}
    if(!compact){x.fillStyle='#cbd8e6';x.fillText(axisDate391(t0,range),pad.l,h-8);const lab=axisDate391(t1,range);x.fillText(lab,w-pad.r-x.measureText(lab).width,h-8)}
    const host=canvas.parentElement;host.querySelectorAll('.endpoint3911').forEach(e=>e.remove());
    if(raw.length){const s=document.createElement('span'),e=document.createElement('span');s.className=e.className='endpoint3911';s.textContent=fmtRaw3911(id,raw[0].v);e.textContent=fmtRaw3911(id,raw.at(-1).v);host.append(s,e);requestAnimationFrame(()=>{s.style.left=Math.max(3,a.x+4)+'px';s.style.top=Math.max(3,Math.min(h-20,a.y-9))+'px';e.style.right='3px';e.style.top=Math.max(3,Math.min(h-20,b.y-9))+'px'})}
  }

  function rangeButtons3911(ids, selected, attr) {
    return RANGE_ORDER.map(r=>{const ok=ids.every(id=>supported3911(id,r));return `<button ${attr}="${r}" ${ok?'':'disabled'} class="${r===selected&&ok?'active':''}" title="${ok?'':`Insufficient stored history for ${H[r].label}`}">${H[r].label}</button>`}).join('');
  }

  function renderGlobalRange3911() {
    const e = $('#globalRange'); if(!e) return;
    const ids=['spy','tenYear','wti'];
    e.innerHTML = rangeButtons3911(ids,state.range,'data-global3911');
    $$('[data-global3911]').forEach(b=>b.onclick=()=>{if(b.disabled)return;state.range=b.dataset.global3911;renderNow();if(state.detail?.regime)drawRegime393();else if(state.detail?.category)drawCategory();else if(state.detail?.id)drawDetail()});
  }

  function renderNow3911() {
    const rd=regimeSeries3911(state.range), r=indexSummary3911(rd), cats=['risk','growth','macro'];
    $('#nowSnapshot').innerHTML=`<div class="now3911"><article class="card regime3911" data-regime3911><div class="regimeHead3911"><div><div class="kicker">REGIME SENTIMENT INDEX · 0–100</div><div class="metric3911"><strong>${r?.score??'—'}</strong><span>/100</span><span class="chip ${r?.cls||'neutral'}">${r?.label||'Unavailable'}</span><span class="delta">${pts3911(r?.delta)}</span></div><div class="muted tiny">${dateRange3911(rd,state.range)} · start ${Number.isFinite(r?.start)?r.start+'/100':'—'} → current ${Number.isFinite(r?.end)?r.end+'/100':'—'}</div></div></div><div class="chartBox"><canvas id="regime3911Chart" class="chart"></canvas></div></article><div class="categoryGrid3911">${cats.map(key=>{const c=CATEGORY[key],d=categorySeries3911(key,state.range),z=categorySummary3911(key,state.range);return `<article class="card category3911" data-cat3911="${key}"><div class="row"><h3>${c.name}</h3><span class="chip ${z?.cls||'neutral'}">${z?.label||'Unavailable'}</span></div><div class="metric3911"><strong>${z?.score??'—'}</strong><span>/100</span><span class="delta">${pts3911(z?.delta)}</span></div><canvas data-cat-chart3911="${key}"></canvas></article>`}).join('')}</div></div>`;
    requestAnimationFrame(()=>{indexChart3911($('#regime3911Chart'),rd,'Regime index','#f3b347',state.range,false);$$('[data-cat-chart3911]').forEach(c=>{const key=c.dataset.catChart3911;indexChart3911(c,categorySeries3911(key,state.range),`${CATEGORY[key].name} index`,'#6db7ff',state.range,true)});$('[data-regime3911]')?.addEventListener('click',()=>openRegime393());$$('[data-cat3911]').forEach(e=>e.onclick=()=>openCategory(e.dataset.cat3911))});
    renderGlobalRange3911();
  }

  renderNow = renderNow3911;
  renderGlobalRange = renderGlobalRange3911;
  regimeHistorySlice = regimeSeries3911;
  regimeSeries393 = regimeSeries3911;
  regimeSummary = function(range=state.range){const d=regimeSeries3911(range),z=indexSummary3911(d);return z?{score:z.score,label:z.label,start:z.start,end:z.end,periodPoints:z.delta,periodPct:null,basePct:(z.score-50)}:null};
  periodChange393 = function(data){return data?.length?data.at(-1).v-data[0].v:null};
  categoryIndex = function(key,range=state.range){const z=categorySummary3911(key,range);if(!z)return null;return {score:z.score,label:z.label,cls:z.cls,parts:[]}};

  drawRegime393 = async function(){
    const d=regimeSeries3911(state.range),r=indexSummary3911(d);
    state.detail={regime:true,range:state.range};$('#detailModal .modalPanel').classList.add('detailCompact3911');$('#detailKicker').textContent='REGIME SENTIMENT INDEX';$('#detailTitle').innerHTML=`Regime<div class="dateRange">${dateRange3911(d,state.range)}</div>`;$('#detailRanges').innerHTML=rangeButtons3911(['spy','tenYear','wti'],state.range,'data-reg3911');indexChart3911($('#detailChart'),d,'Regime index','#f3b347',state.range,false);$('#detailStats').className='stats stats3911';$('#detailStats').innerHTML=`<div class="stat"><span class="kicker">START</span><b>${r?.start??'—'} /100</b></div><div class="stat"><span class="kicker">CURRENT</span><b>${r?.end??'—'} /100</b></div><div class="stat"><span class="kicker">SIGNAL</span><b><span class="chip ${r?.cls||'neutral'}">${r?.label||'Unavailable'}</span></b></div><div class="stat"><span class="kicker">CHANGE</span><b>${pts3911(r?.delta)}</b></div>`;$('#saveDetail').style.display='';$('#saveDetail').textContent='Add to Analysis';$('#saveDetail').onclick=()=>saveAnalysis(`Regime ${H[state.range].label}`,{type:'regime',range:state.range,data:d});$$('[data-reg3911]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;state.range=b.dataset.reg3911;renderNow();await drawRegime393()});
  };

  drawCategory = async function(){
    const key=state.detail?.category;if(!key)return;const c=CATEGORY[key],d=categorySeries3911(key,state.range),z=categorySummary3911(key,state.range),ids=c.components.filter(id=>(state.series[id]||[]).length>1);
    $('#detailModal .modalPanel').classList.add('detailCompact3911');$('#detailKicker').textContent='CATEGORY INDEX';$('#detailTitle').innerHTML=`${c.name}<div class="dateRange">${dateRange3911(d,state.range)}</div>`;$('#detailRanges').innerHTML=rangeButtons3911(ids,state.range,'data-cat-range3911');indexChart3911($('#detailChart'),d,`${c.name} index`,'#6db7ff',state.range,false);$('#detailStats').className='stats';$('#detailStats').innerHTML=`<div style="grid-column:1/-1;display:grid;grid-template-rows:auto minmax(0,1fr);min-height:0;gap:7px"><div class="stats3911"><div class="stat"><span class="kicker">START</span><b>${z?.start??'—'} /100</b></div><div class="stat"><span class="kicker">CURRENT</span><b>${z?.end??'—'} /100</b></div><div class="stat"><span class="kicker">SIGNAL</span><b><span class="chip ${z?.cls||'neutral'}">${z?.label||'Unavailable'}</span></b></div><div class="stat"><span class="kicker">CHANGE</span><b>${pts3911(z?.delta)}</b></div></div><div class="componentGrid3911">${ids.map(id=>{const x=pctSeries3911(id,state.range),chg=x.data.length?x.data.at(-1).v:null;return `<div class="component3911" data-comp3911="${id}"><div class="componentHead3911"><b>${META[id].short}</b><span>${H[state.range].label} ${pct3911(chg)}</span></div><canvas id="comp3911-${id}"></canvas></div>`}).join('')}</div></div>`;$('#saveDetail').style.display='none';requestAnimationFrame(()=>ids.forEach(id=>pctChart3911($(`#comp3911-${id}`),id,state.range,true)));$$('[data-comp3911]').forEach(e=>e.onclick=()=>openDetail(e.dataset.comp3911));$$('[data-cat-range3911]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;state.range=b.dataset.catRange3911;renderNow();await drawCategory()});
  };

  drawDetail = async function(){
    const id=state.detail?.id;if(!id)return;const range=state.range,m=META[id];state.detail.range=range;$('#detailModal .modalPanel').classList.add('detailCompact3911');$('#detailKicker').textContent=m.role;$('#detailTitle').innerHTML=`${m.name}<div class="dateRange">${dateRange3911(rawRange3911(id,range),range)}</div>`;$('#detailRanges').innerHTML=rangeButtons3911([id],range,'data-series-range3911');const raw=rawRange3911(id,range),x=pctSeries3911(id,range),chg=x.data.length?x.data.at(-1).v:null;$('#detailStats').className='stats stats3911';$('#detailStats').innerHTML=`<div class="stat"><span class="kicker">START</span><b>${raw.length?fmtRaw3911(id,raw[0].v):'—'}</b></div><div class="stat"><span class="kicker">CURRENT</span><b>${raw.length?fmtRaw3911(id,raw.at(-1).v):'—'}</b></div><div class="stat"><span class="kicker">CHANGE</span><b>${pct3911(chg)}</b></div><div class="stat"><span class="kicker">OBS</span><b>${raw.length}</b></div>`;pctChart3911($('#detailChart'),id,range,false);$('#saveDetail').style.display='';$('#saveDetail').textContent='Add to Analysis';$('#saveDetail').onclick=()=>saveAnalysis(`${m.short} ${H[range].label}`,{type:'series',id,range,data:raw.slice(-600)});$$('[data-series-range3911]').forEach(b=>b.onclick=async()=>{if(b.disabled)return;state.range=b.dataset.seriesRange3911;renderNow();await drawDetail()});
  };

  openRegime393 = async function(){state.detail={regime:true,range:state.range};$('#detailModal').classList.add('open');await drawRegime393()};
  openCategory = async function(key){state.detail={category:key,range:state.range};$('#detailModal').classList.add('open');await drawCategory()};
  openDetail = async function(id){state.detail={id,range:state.range};$('#detailModal').classList.add('open');await drawDetail()};

  async function persistSeries3911(id, points, provider) {
    const clean = canon(id, points || []);
    if (!clean.length) return;
    const merged = canon(id,[...(state.series[id]||[]),...clean]);
    state.series[id]=merged;
    const tr=db.transaction(['observations','series'],'readwrite'), obs=tr.objectStore('observations'), meta=tr.objectStore('series');
    const stamp=Date.now();
    for(const p of clean) obs.put({id:`${id}:${p.t}`,seriesId:id,t:p.t,v:p.v,source:provider,retrievedAt:stamp});
    state.meta[id]={...(state.meta[id]||{}),id,provider,earliestDate:merged[0]?.t||null,latestDate:merged.at(-1)?.t||null,observationCount:merged.length,lastSuccessfulFetchAt:stamp};meta.put(state.meta[id]);
    await new Promise((res,rej)=>{tr.oncomplete=res;tr.onerror=()=>rej(tr.error);tr.onabort=()=>rej(tr.error)});
  }

  async function hydrateBackend3911(force=false) {
    if(state.__backend3911Busy)return false;state.__backend3911Busy=true;
    try{
      $('#status').textContent='Checking cached market snapshot…';
      const manifest=await fetch(MANIFEST_URL+(force?`?t=${Date.now()}`:''),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(`manifest ${r.status}`);return r.json()});
      const seen=JSON.parse(localStorage.getItem(REV_KEY)||'{}'), next={...seen};let changed=false;
      const load=async name=>{const f=manifest.files?.[name];if(!f||(!force&&seen[name]===f.revision))return null;const r=await fetch(f.path+(force?`?t=${Date.now()}`:''),{cache:'no-store'});if(!r.ok)throw Error(`${name} cache ${r.status}`);next[name]=f.revision;changed=true;return r.json()};
      const market=await load('market');
      if(market?.data){for(const [id,o] of Object.entries(market.data)){if(META[id])await persistSeries3911(id,o.daily||[],o.provider||'GitHub market cache')}}
      const macro=await load('macro');
      if(macro?.data){for(const [id,o] of Object.entries(macro.data)){if(META[id])await persistSeries3911(id,o.points||[],o.provider||'GitHub macro cache')}}
      const news=await load('news');
      if(news?.data){state.news=news.data.map(n=>({...n,link:n.url||n.link||'',topic:(n.topics||[])[0]||n.topic||'news'})).sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));const tr=db.transaction('news','readwrite'),st=tr.objectStore('news');for(const n of state.news.slice(0,600))st.put(n);await new Promise((res,rej)=>{tr.oncomplete=res;tr.onerror=()=>rej(tr.error)})}
      const health=await load('health');
      if(health?.sources){state.providers={...state.providers,'GitHub cache':{connected:true,lastSuccess:Date.now(),message:`Manifest ${manifest.revision}`}};localStorage.setItem('mn-provider-health',JSON.stringify(state.providers))}
      if(changed)localStorage.setItem(REV_KEY,JSON.stringify(next));
      state.regimeHistory=regimeSeries3911('5y').map(p=>({t:p.t,ts:p.t,score:p.v,regime:p.v>=62?'Optimistic':p.v<=38?'Pessimistic':'Neutral'}));
      renderAll();renderNow();
      const when=manifest.generatedAt?new Date(manifest.generatedAt).toLocaleString():'current';$('#status').textContent=`Cache current · ${when}`;$('#dot').className='dot good';
      log(`Backend manifest ${manifest.revision} · ${changed?'cache merged':'no changed datasets'}`);
      return changed;
    } catch(e) { log(`Backend cache check failed: ${e.message}`,'warning');$('#status').textContent='Using IndexedDB cache';return false; }
    finally{state.__backend3911Busy=false}
  }

  buildRegimeHistory = async function(){state.regimeHistory=regimeSeries3911('5y').map(p=>({t:p.t,ts:p.t,score:p.v,regime:p.v>=62?'Optimistic':p.v<=38?'Pessimistic':'Neutral'}));};
  ensureFoundation392 = async function(){return hydrateBackend3911(false)};
  refreshStale392 = async function(){return hydrateBackend3911(false)};
  foundation = async function(){return hydrateBackend3911(true)};
  incremental = async function(){return hydrateBackend3911(true)};
  refreshNews = async function(){return hydrateBackend3911(true)};

  const oldRenderAll=renderAll;
  renderAll=function(){oldRenderAll();renderNow3911();renderGlobalRange3911()};
  renderNow3911();renderGlobalRange3911();
  setTimeout(()=>hydrateBackend3911(false),20);
})();
