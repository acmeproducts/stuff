from pathlib import Path

p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.8.0'" not in s:
    raise SystemExit('Expected Market Navigator 3.8.0 baseline')

s=s.replace('<title>Market Navigator 3.8</title>','<title>Market Navigator 3.8.1</title>')
s=s.replace('Version 3.8</small>','Version 3.8.1</small>')
s=s.replace("const VERSION='3.8.0'","const VERSION='3.8.1'")

anchor='</script></body></html>'
if anchor not in s:
    raise SystemExit('closing script anchor missing')

override=r'''
/* 3.8.1 regime-history repair: authoritative SPY/10Y/WTI backfill + incremental tail refresh */
const REGIME_SERIES=['spy','tenYear','wti'];
const REGIME_FOUNDATION_KEY='mn-regime-foundation-381';
function regimeDateKey(t){const d=new Date(t);return `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`}
function regimeCanonical(data){const m=new Map();for(const p of data||[]){if(Number.isFinite(p?.t)&&Number.isFinite(p?.v))m.set(regimeDateKey(p.t),{t:p.t,v:p.v})}return[...m.values()].sort((a,b)=>a.t-b.t)}
function regimeLatestAgeDays(id){const a=state.series[id]?.at(-1)?.t;return a?((Date.now()-a)/86400000):Infinity}
function regimeHistoryYears(id){const d=state.series[id]||[];return d.length>1?(d.at(-1).t-d[0].t)/(365.25*86400000):0}
async function regimeYahooJson(url,label){let last;for(const u of [url,`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,`https://corsproxy.io/?url=${encodeURIComponent(url)}`]){try{const r=await fetch(u);const t=await r.text();if(!r.ok)throw new Error(`${r.status}`);const j=JSON.parse(t);if(j?.chart?.error)throw new Error(j.chart.error.description||'Yahoo error');return j}catch(e){last=e}}throw new Error(`${label}: ${last?.message||'unavailable'}`)}
async function regimeFetch(id,range){const m=META[id],url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.symbol)}?range=${range}&interval=1d&includePrePost=false&events=div%2Csplits`;const j=await regimeYahooJson(url,`Yahoo ${m.short}`),r=j?.chart?.result?.[0],close=r?.indicators?.quote?.[0]?.close||[];const d=(r?.timestamp||[]).map((t,i)=>({t:t*1000,v:Number(close[i])})).filter(x=>Number.isFinite(x.v));if(d.length<2)throw new Error(`${m.short}: insufficient Yahoo history`);return regimeCanonical(d)}
async function regimePersist(id,incoming){const existing=regimeCanonical(state.series[id]||[]),map=new Map(existing.map(p=>[regimeDateKey(p.t),p]));for(const p of incoming)map.set(regimeDateKey(p.t),p);const merged=[...map.values()].sort((a,b)=>a.t-b.t);state.series[id]=merged;state.meta[id]={...(state.meta[id]||{}),id,provider:'Yahoo Finance',earliestDate:merged[0]?.t||null,latestDate:merged.at(-1)?.t||null,observationCount:merged.length,lastSuccessfulFetchAt:Date.now(),lastError:null};if(db){const tr=db.transaction(['observations','series'],'readwrite'),obs=tr.objectStore('observations'),meta=tr.objectStore('series');for(const p of incoming)obs.put({id:`${id}:${p.t}`,seriesId:id,t:p.t,v:p.v,source:'Yahoo Finance',retrievedAt:Date.now()});meta.put(state.meta[id]);await new Promise((res,rej)=>{tr.oncomplete=res;tr.onerror=()=>rej(tr.error);tr.onabort=()=>rej(tr.error)})}return merged}
function regimeFreshness(){return REGIME_SERIES.map(id=>({id,latest:state.series[id]?.at(-1)?.t||null,ageDays:regimeLatestAgeDays(id),years:regimeHistoryYears(id)}))}
function regimeNeedsFoundation(){const flag=localStorage.getItem(REGIME_FOUNDATION_KEY);return !flag||REGIME_SERIES.some(id=>regimeHistoryYears(id)<4.75)}
function regimeNeedsTail(){return REGIME_SERIES.some(id=>regimeLatestAgeDays(id)>1.5)}
async function repairRegimeHistory(forceFull=false){if(state.__regimeRepairBusy)return;const full=forceFull||regimeNeedsFoundation(),tail=regimeNeedsTail();if(!full&&!tail)return;state.__regimeRepairBusy=true;try{const box=$('#progress'),text=$('#progressText'),bar=$('#progressBar'),title=$('#progressTitle');if(box)box.classList.add('open');if(title)title.textContent=full?'Building five-year regime history':'Updating regime history';for(let i=0;i<REGIME_SERIES.length;i++){const id=REGIME_SERIES[i],m=META[id];if(text)text.textContent=`${full?'Backfilling':'Updating'} ${m.short} (${i+1} of ${REGIME_SERIES.length})`;if(bar)bar.style.width=`${Math.round(i/REGIME_SERIES.length*100)}%`;const d=await regimeFetch(id,full?'5y':'1mo');await regimePersist(id,d)}if(full)localStorage.setItem(REGIME_FOUNDATION_KEY,new Date().toISOString());if(bar)bar.style.width='100%';state.providers['Yahoo Finance']={...(state.providers['Yahoo Finance']||{}),connected:true,lastSuccess:Date.now(),message:'SPY, 10Y and WTI history current'};localStorage.setItem('mn-provider-health',JSON.stringify(state.providers));if(typeof rebuildRegimeHistory==='function')await rebuildRegimeHistory();else if(typeof primeRegimeHistory==='function')await primeRegimeHistory();if(typeof renderAll==='function')renderAll();else {if(typeof renderNow==='function')renderNow();if(typeof renderTrend==='function')renderTrend()}const f=regimeFreshness();log(`Regime history repaired · ${f.map(x=>`${META[x.id].short} ${state.series[x.id]?.length||0} obs through ${x.latest?new Date(x.latest).toLocaleDateString():'n/a'}`).join(' · ')}`);if($('#status'))$('#status').textContent='Regime history current'}catch(e){state.providers['Yahoo Finance']={...(state.providers['Yahoo Finance']||{}),connected:false,lastFailure:Date.now(),message:e.message};localStorage.setItem('mn-provider-health',JSON.stringify(state.providers));log(`Regime history repair failed: ${e.message}`,'error');if($('#status'))$('#status').textContent='Regime data incomplete'}finally{state.__regimeRepairBusy=false;if($('#progress'))setTimeout(()=>$('#progress').classList.remove('open'),250)}}
setTimeout(()=>repairRegimeHistory(false),1200);
'''
s=s.replace(anchor,override+'\n</script></body></html>')
p.write_text(s)
print('Patched Market Navigator to 3.8.1 regime history repair')
