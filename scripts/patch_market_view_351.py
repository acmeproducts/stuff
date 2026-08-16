from pathlib import Path
import re

p = Path('market-view.html')
s = p.read_text()

if "const APP_VERSION='3.5.0'" not in s:
    raise SystemExit('Expected Market Navigator 3.5.0 baseline')

s = s.replace('<title>Market Navigator 3.5</title>', '<title>Market Navigator 3.5.1</title>')
s = s.replace('Version 3.5</small>', 'Version 3.5.1</small>')
s = s.replace('Market Navigator 3.5</div>', 'Market Navigator 3.5.1</div>')
s = s.replace("const APP_VERSION='3.5.0'", "const APP_VERSION='3.5.1'")

# Replace horizon/coverage functions with one authoritative calendar-window contract.
m = re.search(r"function canonical\(id,data\).*?function coverage\(id,r\).*?\}\nasync function loadDbState", s, re.S)
if not m:
    raise SystemExit('coverage block not found')
coverage_block = r'''function canonical(id,data){const monthly=META[id]?.policy==='monthly',map=new Map();for(const p of data||[]){if(!Number.isFinite(p?.t)||!Number.isFinite(p?.v))continue;const d=new Date(p.t),k=monthly?`${d.getUTCFullYear()}-${d.getUTCMonth()}`:d.toISOString().slice(0,10),old=map.get(k);if(!old||p.t>=old.t)map.set(k,{t:p.t,v:p.v})}return[...map.values()].sort((a,b)=>a.t-b.t)}function quote(d){if(!d?.length)return null;const a=d.at(-1),b=d[0],prev=d.at(-2)||a;return{value:a.v,time:a.t,count:d.length,changePct:prev.v?(a.v/prev.v-1)*100:null,periodPct:b.v?(a.v/b.v-1)*100:null}}function commonEnd(){const t=Object.keys(META).filter(id=>META[id].symbol&&state.series[id]?.length).map(id=>state.series[id].at(-1).t);return t.length?Math.max(...t):Date.now()}function horizonStart(r,end){if(r==='ytd')return Date.UTC(new Date(end).getUTCFullYear(),0,1);const h=HORIZONS[r]||HORIZONS['1mo'];return end-h.days*86400000}function rangeSeries(id,r,common=true){const d=state.series[id]||[];if(!d.length)return[];if(r==='max')return d;const end=common&&META[id]?.symbol?commonEnd():d.at(-1).t,start=horizonStart(r,end);return d.filter(x=>x.t>=start&&x.t<=end+86400000)}function rangeQuote(id,r){return quote(rangeSeries(id,r,true))}function coverage(id,r){const d=rangeSeries(id,r,true),end=META[id]?.symbol?commonEnd():(state.series[id]?.at(-1)?.t||Date.now()),start=horizonStart(r,end),days=Math.max(1,(end-start)/86400000),monthly=META[id]?.policy==='monthly';if(r==='now'){const last=d.at(-1)?.t||0;return{ok:d.length>=2&&end-last<=5*86400000,points:d.length,start:d[0]?.t||null,end:d.at(-1)?.t||null,required:2,spanDays:d.length?Math.max(0,(d.at(-1).t-d[0].t)/86400000):0,targetDays:days}}const required=monthly?Math.max(2,Math.floor(days/30*.75)):Math.max(3,Math.floor(days*.55)),span=d.length?Math.max(0,(d.at(-1).t-d[0].t)/86400000):0,spanOk=span>=days*.78,latestOk=d.length?end-d.at(-1).t<=Math.max(monthly?45:7,days*.08)*86400000:false;return{ok:d.length>=required&&spanOk&&latestOk,points:d.length,start:d[0]?.t||null,end:d.at(-1)?.t||null,required,spanDays:span,targetDays:days}}function exactRangeSeries(id,r){return coverage(id,r).ok?rangeSeries(id,r,true):[]}
async function loadDbState'''
s = s[:m.start()] + coverage_block + s[m.end():]

# A historical request should establish the actual 5-year foundation.
s = s.replace("const data=META[id].symbol?await fetchYahoo(id,history?'max':'5d'):await fetchAV(id)",
              "const data=META[id].symbol?await fetchYahoo(id,history?'5y':'5d'):await fetchAV(id)")

# Backfill the selected overview horizon when missing.
m = re.search(r"async function ensureHistory\(id,r\).*?\}\nfunction signal", s, re.S)
if not m:
    raise SystemExit('ensureHistory block not found')
ensure_block = r'''async function ensureHistory(id,r){if(!META[id].symbol)return coverage(id,r).ok;let c=coverage(id,r);if(c.ok)return true;const m=state.seriesMeta[id]||{},last=m.historyFetchAt||0;if(Date.now()-last<6*3600000)return coverage(id,r).ok;state.seriesMeta[id]={...m,id,historyFetchAt:Date.now()};await idbPut('series',state.seriesMeta[id]);await fetchSeries(id,{history:true});return coverage(id,r).ok}async function ensureOverviewHorizon(r){if(r==='now'||r==='7d')return;const ids=['spy','qqq','vix','tenYear','wti','brent','gold','dxy'];const missing=ids.filter(id=>!coverage(id,r).ok);if(!missing.length)return;activity(`Collecting ${HORIZONS[r].label} history · ${missing.length} series…`);for(const id of missing){await ensureHistory(id,r);renderNow();if(state.section==='markets')renderMarkets();await new Promise(x=>setTimeout(x,250))}activity('')}
function signal'''
s = s[:m.start()] + ensure_block + s[m.end():]

# Cards never draw an incomplete selected period.
old = "${state.series[id]?.length?`<canvas class=\"spark\" data-spark=\"${id}\" data-range=\"${state.nowRange}\"></canvas>`:''}"
new = "${cov.ok?`<canvas class=\"spark\" data-spark=\"${id}\" data-range=\"${state.nowRange}\"></canvas>`:`<div class=\"callout bad tiny\">${cov.points} observations available; ${HORIZONS[state.nowRange].label} history is incomplete.</div>`}"
if old not in s:
    raise SystemExit('component spark anchor not found')
s = s.replace(old, new, 1)
s = s.replace("data:rangeSeries(id,r,true)", "data:exactRangeSeries(id,r)")

# Detail validation and rendering use exactly the same end date and date window.
m = re.search(r"async function drawInstrument\(\).*?function renderInstrument\(id,r\).*?\}\nfunction renderMacro", s, re.S)
if not m:
    raise SystemExit('instrument block not found')
instrument_block = r'''async function drawInstrument(){const id=$('#instrumentSelect').value,r=$('#instrumentRange').value,m=META[id];let cov=coverage(id,r);if(!cov.ok){$('#instrumentLoading').innerHTML=`<div><strong>Collecting ${esc(m.short)} history for ${HORIZONS[r]?.label||r}…</strong><br><span class="muted">No chart will be drawn until this exact horizon is covered.</span></div>`;$('#instrumentLoading').classList.add('show');await ensureHistory(id,r);$('#instrumentLoading').classList.remove('show');cov=coverage(id,r)}if(!cov.ok){drawLines($('#instrumentChart'),[]);$('#instrumentStatus').innerHTML=`<strong>${esc(m.name)}</strong> · <span class="badText">${HORIZONS[r]?.label||r} unavailable</span> · ${cov.points}/${cov.required||'—'} observations · ${Math.round(cov.spanDays||0)} of ${Math.round(cov.targetDays||0)} calendar days covered`;$('#instrumentDetail').textContent='Historical coverage is incomplete or the provider could not supply the requested period. The chart is intentionally blank.';return}renderInstrument(id,r)}function renderInstrument(id,r){const d=exactRangeSeries(id,r),m=META[id],q=quote(d);if(!d.length){drawLines($('#instrumentChart'),[]);return}drawLines($('#instrumentChart'),[{name:m.short,color:m.color,unit:(m.unit||'')+(m.suffix||''),data:d}]);$('#instrumentStatus').innerHTML=`<strong>${esc(m.name)}</strong> · ${HORIZONS[r]?.label||r} · ${d.length} observations · ${new Date(d[0].t).toLocaleDateString()} → ${new Date(d.at(-1).t).toLocaleDateString()}`;$('#instrumentDetail').innerHTML=`${esc(m.description)}<br><span class="muted">Latest ${(m.unit||'')+fmt(q.value,m.decimals)+(m.suffix||'')}; period change ${pct(q.periodPct)}. Source: ${esc(displayProvider(state.seriesMeta[id]?.provider))}.</span>`}
function renderMacro'''
s = s[:m.start()] + instrument_block + s[m.end():]

# Horizon clicks collect missing history before presenting the final view.
old = "function setupRanges(){$('#nowRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<button data-nr=\"${k}\" class=\"${k===state.nowRange?'active':''}\">${v.label}</button>`).join('');$$('[data-nr]').forEach(b=>b.onclick=()=>{state.nowRange=b.dataset.nr;$$('[data-nr]').forEach(x=>x.classList.toggle('active',x===b));renderNow();renderMarkets()});$('#instrumentRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<option value=\"${k}\">${v.label}</option>`).join('')}"
new = "function setupRanges(){$('#nowRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<button data-nr=\"${k}\" class=\"${k===state.nowRange?'active':''}\">${v.label}</button>`).join('');$$('[data-nr]').forEach(b=>b.onclick=async()=>{state.nowRange=b.dataset.nr;$$('[data-nr]').forEach(x=>x.classList.toggle('active',x===b));renderNow();renderMarkets();await ensureOverviewHorizon(state.nowRange);renderNow();renderMarkets()});$('#instrumentRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<option value=\"${k}\">${v.label}</option>`).join('')}"
if old not in s:
    raise SystemExit('setupRanges block not found')
s = s.replace(old, new, 1)

# Build the historical foundation in the background once daily.
old = "async function init(){loadConfig();state.providers=readSmall('mn-provider-health',{});await openDb();await loadDbState();bind();renderAll();const h=location.hash.slice(1).split('/');showSection(NAV.some(x=>x[0]===h[0])?h[0]:'now',h[1]);schedule();$('#lastUpdated').textContent='Stored data loaded';collect().catch(e=>log(e.message,'warning'))}"
new = "async function bootstrapHistory(){const key='mn-history-bootstrap-5y',last=+(localStorage.getItem(key)||0);if(Date.now()-last<24*3600000)return;localStorage.setItem(key,String(Date.now()));const ids=['spy','qqq','vix','tenYear','wti','brent','gold','dxy'].filter(id=>!coverage(id,'5y').ok);for(const id of ids){await ensureHistory(id,'5y');renderNow();if(state.section==='markets')renderMarkets();await new Promise(x=>setTimeout(x,350))}}async function init(){loadConfig();state.providers=readSmall('mn-provider-health',{});await openDb();await loadDbState();bind();renderAll();const h=location.hash.slice(1).split('/');showSection(NAV.some(x=>x[0]===h[0])?h[0]:'now',h[1]);schedule();$('#lastUpdated').textContent='Stored data loaded';collect().catch(e=>log(e.message,'warning'));bootstrapHistory().catch(e=>log('History bootstrap: '+e.message,'warning'))}"
if old not in s:
    raise SystemExit('init block not found')
s = s.replace(old, new, 1)

p.write_text(s)
print('Market Navigator patched to 3.5.1')
