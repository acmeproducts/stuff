from pathlib import Path

p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.8.1'" not in s:
    raise SystemExit('Expected Market Navigator 3.8.1 baseline')

s=s.replace('<title>Market Navigator 3.8.1</title>','<title>Market Navigator 3.8.2</title>')
s=s.replace('Version 3.8.1</small>','Version 3.8.2</small>')
s=s.replace("const VERSION='3.8.1'","const VERSION='3.8.2'")

anchor='</script></body></html>'
if anchor not in s:
    raise SystemExit('closing script anchor missing')

override=r'''
/* 3.8.2: reject Yahoo null closes, purge synthetic zero observations, and force clean regime re-backfill */
function regimeCanonical(data){const m=new Map();for(const p of data||[]){if(!Number.isFinite(p?.t)||!Number.isFinite(p?.v)||p.v<=0)continue;m.set(regimeDateKey(p.t),{t:p.t,v:p.v})}return[...m.values()].sort((a,b)=>a.t-b.t)}
async function regimeFetch(id,range){const m=META[id],url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.symbol)}?range=${range}&interval=1d&includePrePost=false&events=div%2Csplits`;const j=await regimeYahooJson(url,`Yahoo ${m.short}`),r=j?.chart?.result?.[0],ts=r?.timestamp||[],close=r?.indicators?.quote?.[0]?.close||[],d=[];for(let i=0;i<ts.length;i++){const raw=close[i];if(typeof raw!=='number'||!Number.isFinite(raw)||raw<=0)continue;d.push({t:ts[i]*1000,v:raw})}const clean=regimeCanonical(d);if(clean.length<2)throw new Error(`${m.short}: insufficient valid Yahoo history`);return clean}
async function regimePersist(id,incoming){const existing=regimeCanonical(state.series[id]||[]),map=new Map(existing.map(p=>[regimeDateKey(p.t),p]));for(const p of regimeCanonical(incoming))map.set(regimeDateKey(p.t),p);const merged=[...map.values()].sort((a,b)=>a.t-b.t);state.series[id]=merged;state.meta[id]={...(state.meta[id]||{}),id,provider:'Yahoo Finance',earliestDate:merged[0]?.t||null,latestDate:merged.at(-1)?.t||null,observationCount:merged.length,lastSuccessfulFetchAt:Date.now(),lastError:null};if(db){const tr=db.transaction(['observations','series'],'readwrite'),obs=tr.objectStore('observations'),meta=tr.objectStore('series');for(const p of incoming){if(!Number.isFinite(p?.v)||p.v<=0)continue;obs.put({id:`${id}:${p.t}`,seriesId:id,t:p.t,v:p.v,source:'Yahoo Finance',retrievedAt:Date.now()})}for(const bad of (await new Promise((res,rej)=>{const rq=obs.index('seriesId').getAll(IDBKeyRange.only(id));rq.onsuccess=()=>res(rq.result||[]);rq.onerror=()=>rej(rq.error)}))){if(!Number.isFinite(bad.v)||bad.v<=0)obs.delete(bad.id)}meta.put(state.meta[id]);await new Promise((res,rej)=>{tr.oncomplete=res;tr.onerror=()=>rej(tr.error);tr.onabort=()=>rej(tr.error)})}return merged}
localStorage.removeItem(REGIME_FOUNDATION_KEY);
setTimeout(()=>repairRegimeHistory(true),500);
'''
s=s.replace(anchor,override+'\n</script></body></html>')
p.write_text(s)
print('Patched Market Navigator to 3.8.2: null closes rejected and regime history re-backfilled')
