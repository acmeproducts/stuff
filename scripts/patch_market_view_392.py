from pathlib import Path
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.1'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.1 baseline')

s=s.replace('<title>Market Navigator 3.9.1</title>','<title>Market Navigator 3.9.2</title>')
s=s.replace('Version 3.9.1</small>','Version 3.9.2</small>')
s=s.replace("const VERSION='3.9.1'","const VERSION='3.9.2'")
s=s.replace('Market Navigator 3.9.1\nUsage:','Market Navigator 3.9.2\nUsage:')
s=s.replace('Version: 3.9.1','Version: 3.9.2')

# Remove duplicate legend rendering introduced by the legend wrapper; chart() will own one legend.
s=s.replace("const _chart391=chart;\nchart=function(canvas,list,opts={}){chartLegend(canvas,list,opts);return _chart391(canvas,list,opts)};","const _chart391=chart;\nchart=function(canvas,list,opts={}){const parent=canvas.parentElement;parent?.querySelector(':scope > .chartLegend')?.remove();chartLegend(canvas,list,opts);return _chart391(canvas,list,opts)};")

# Add stronger tooltip swatches + drill-through layout helpers.
s=s.replace('</style></head>', '''
.chartTipRow{display:grid;grid-template-columns:10px 1fr;gap:7px;align-items:center}.chartTipSwatch{width:9px;height:9px;border-radius:50%;display:inline-block}.throughline{display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:8px;align-items:center;margin-top:8px}.throughNode{background:#0b1728;border:1px solid var(--line);border-radius:10px;padding:9px;min-width:0}.throughArrow{color:var(--accent);font-weight:900}.dateRange{font-size:11px;color:var(--muted);margin-top:2px}@media(max-width:520px){.throughline{grid-template-columns:1fr;gap:5px}.throughArrow{transform:rotate(90deg);justify-self:center}.modalPanel{grid-template-rows:auto auto minmax(0,1fr) auto}.chartLegend{min-height:22px}}
</style></head>''')

# Replace the unconditional startup refresh with cache-first stale-aware boot.
old="(async()=>{configLoad();await openDB();await loadStored();renderAll();setSection('now');await foundation();await incremental(false);$('#status').textContent='Ready';$('#dot').className='dot good'})().catch(e=>{log(e.message,'error');$('#status').textContent='Using stored data';$('#dot').className='dot bad'});"
new="""function latestStoredDate392(id){return state.series[id]?.at(-1)?.t||0}
function localDateKey392(t=Date.now()){const d=new Date(t);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function expectedMarketDate392(now=new Date()){
  const d=new Date(now); const day=d.getDay();
  if(day===0)d.setDate(d.getDate()-2); else if(day===6)d.setDate(d.getDate()-1);
  else if(d.getHours()<14){ d.setDate(d.getDate()-1); if(d.getDay()===0)d.setDate(d.getDate()-2); if(d.getDay()===6)d.setDate(d.getDate()-1); }
  return localDateKey392(d.getTime())
}
function seriesStale392(id){const t=latestStoredDate392(id);if(!t)return true;return localDateKey392(t)<expectedMarketDate392()}
async function ensureFoundation392(){const need=['spy','tenYear','wti'].filter(id=>!coverage(id,'5y'));if(!need.length)return false;progress(true,'Building historical foundation','One-time five-year history repair…',0);let i=0;for(const id of need){progress(true,'Building historical foundation',`Fetching ${META[id].name}`,Math.round(i/need.length*100));try{await saveSeries(id,await yahoo(id,'5y','1d'))}catch(e){providerMark('Yahoo Finance',false,e.message);log(`${META[id].short} foundation unavailable: ${e.message}`,'error')}i++}progress(false);return true}
async function refreshStale392(force=false){const ids=['spy','tenYear','wti'];const checkKey='mn392-last-market-check';const today=localDateKey392();if(!force&&localStorage.getItem(checkKey)===today&&!ids.some(seriesStale392))return false;const stale=force?ids:ids.filter(seriesStale392);if(!stale.length){localStorage.setItem(checkKey,today);return false}progress(true,'Updating market data',`Checking ${stale.length} stale series…`,0);let i=0;for(const id of stale){progress(true,'Updating market data',`Fetching incremental ${META[id].name}`,Math.round(i/stale.length*100));try{await saveSeries(id,await yahoo(id,'1mo','1d'))}catch(e){providerMark('Yahoo Finance',false,e.message);log(`${META[id].short} incremental update unavailable: ${e.message}`,'error')}i++}progress(false);localStorage.setItem(checkKey,today);await buildRegimeHistory();renderAll();return true}
(async()=>{configLoad();await openDB();await loadStored();renderAll();setSection('now');$('#status').textContent='Ready · local history';$('#dot').className='dot good';const built=await ensureFoundation392();if(built)await buildRegimeHistory();const updated=await refreshStale392(false);if(!updated&&!built){$('#status').textContent=`Current through ${expectedMarketDate392()}`}})().catch(e=>{log(e.message,'error');$('#status').textContent='Using saved market history';$('#dot').className='dot bad'});"""
if old not in s: raise SystemExit('startup anchor missing')
s=s.replace(old,new)

# Force refresh button to use the stale-aware path.
s=s.replace("$('#refreshBtn').onclick=()=>incremental(true);","$('#refreshBtn').onclick=()=>refreshStale392(true);")

# Add helper for actual chart date range headings.
insert="""
function dateRangeLabel392(data,range){if(!data?.length)return `${H[range]?.label||range} · unavailable`;const a=new Date(data[0].t),b=new Date(data.at(-1).t);const fmt=d=>d.toLocaleDateString([],{month:'short',day:'numeric',year:'numeric'});return `${fmt(a)} – ${fmt(b)} (${H[range]?.label||range})`}
function driverNarrative392(category,id,z){if(!z)return 'No verified change for this horizon.';const abs=Math.abs(z.p).toFixed(2),m=META[id];let direction=z.p>=0?'higher':'lower';let effect='neutral';if(id==='spy')effect=z.p>=0?'supports risk appetite':'reduces risk appetite';if(id==='tenYear')effect=z.p>=0?'tightens financial conditions':'eases financial conditions';if(id==='wti')effect=z.p>=0?'raises inflation and supply pressure':'reduces inflation and supply pressure';return `${m.short} is ${direction} by ${abs}% over ${H[state.range].label}; this ${effect}.`}
function throughline392(category,z){const c=CATEGORY[category];const r=regimeSummary(state.range);const parts=(c?.components||[]).map(id=>{const qv=q(id,state.range);return `<div class=\"throughNode\"><div class=\"kicker\">UNDERLYING</div><b>${META[id].short} ${qv?pct(qv.p):'Unavailable'}</b><div class=\"muted tiny\">${driverNarrative392(category,id,qv)}</div></div>`}).join('<div class=\"throughArrow\">→</div>');return `<div class=\"throughline\"><div class=\"throughNode\"><div class=\"kicker\">REGIME</div><b>${r?r.score:'—'} / 100</b><div class=\"muted tiny\">${r?.label||'Unavailable'}</div></div><div class=\"throughArrow\">→</div><div class=\"throughNode\"><div class=\"kicker\">${c?.name||category.toUpperCase()} INDEX</div><b>${z?z.score:'—'} / 100</b><div class=\"muted tiny\">${z?.label||'Unavailable'}</div></div><div class=\"throughArrow\">→</div><div style=\"display:grid;gap:6px\">${parts}</div></div>`}
"""
s=s.replace('async function openCategory(key){',insert+'\nasync function openCategory(key){')

# Enhance category heading with date range, through-line, and keep one chart legend.
oldfrag="$('#detailKicker').textContent='CATEGORY INDEX';$('#detailTitle').textContent=`${c.name} · ${z?z.score:'—'}/100`;"
newfrag="$('#detailKicker').textContent='CATEGORY INDEX';const catData=(c.components||[]).flatMap(id=>rangeData(id,state.range));$('#detailTitle').innerHTML=`${c.name} · ${z?z.score:'—'}/100<div class=\"dateRange\">${dateRangeLabel392(catData,state.range)}</div>`;"
s=s.replace(oldfrag,newfrag)
s=s.replace("$('#detailStats').innerHTML=`<div class=\"stat\"><span class=\"kicker\">INDEX</span><b>${z?z.score:'—'} / 100</b></div><div class=\"stat\"><span class=\"kicker\">SIGNAL</span><b><span class=\"chip ${z?.cls||'neutral'}\">${z?.label||'Unavailable'}</span></b></div>${c.components.map(id=>{const qv=q(id,state.range);return`<button class=\"stat\" data-component=\"${id}\" style=\"color:inherit;text-align:left;cursor:pointer\"><span class=\"kicker\">${META[id].short} · ${H[state.range].label}</span><b>${qv?pct(qv.p):'Unavailable'}</b></button>`}).join('')}`;",
"$('#detailStats').innerHTML=`<div class=\"stat\"><span class=\"kicker\">INDEX</span><b>${z?z.score:'—'} / 100</b></div><div class=\"stat\"><span class=\"kicker\">SIGNAL</span><b><span class=\"chip ${z?.cls||'neutral'}\">${z?.label||'Unavailable'}</span></b></div>${c.components.map(id=>{const qv=q(id,state.range);return`<button class=\"stat\" data-component=\"${id}\" style=\"color:inherit;text-align:left;cursor:pointer\"><span class=\"kicker\">${META[id].short} · ${H[state.range].label}</span><b>${qv?pct(qv.p):'Unavailable'}</b></button>`}).join('')}<div style=\"grid-column:1/-1\">${throughline392(key,z)}</div>`;")

# Detail heading gets date range.
s=s.replace("$('#detailKicker').textContent=m.role;$('#detailTitle').textContent=m.name;","$('#detailKicker').textContent=m.role;$('#detailTitle').textContent=m.name;")
s=s.replace("chart($('#detailChart'),[{id,name:m.short,color:m.color,data}],{range,axes:true});const z=quoteAny(data)","$('#detailTitle').innerHTML=`${m.name}<div class=\"dateRange\">${dateRangeLabel392(data,range)}</div>`;chart($('#detailChart'),[{id,name:m.short,color:m.color,data}],{range,axes:true});const z=quoteAny(data)")

# Upgrade tooltip to carry visual swatch tied to legend series.
s=s.replace("return`<div><b>${s.name}</b> · ${normalized?p.v.toFixed(1):fmt(s.id,p.v)} · ${new Date(p.t).toLocaleString()}</div>`",
"return`<div class=\"chartTipRow\"><span class=\"chartTipSwatch\" style=\"background:${s.color}\"></span><span><b>${s.name}</b> · ${normalized?p.v.toFixed(1):fmt(s.id,p.v)} · ${new Date(p.t).toLocaleString()}</span></div>`")

p.write_text(s)
print('Patched Market Navigator to 3.9.2')
