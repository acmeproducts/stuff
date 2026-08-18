from pathlib import Path
import re

p=Path('market-view.html')
s=p.read_text()
if "const APP_VERSION='3.6.1'" not in s:
    raise SystemExit('Expected Market Navigator 3.6.1 baseline')

# Version.
s=s.replace('<title>Market Navigator 3.6.1</title>','<title>Market Navigator 3.7</title>')
s=s.replace('Version 3.6.1</small>','Version 3.7</small>')
s=s.replace('Market Navigator 3.6.1</div>','Market Navigator 3.7</div>')
s=s.replace("const APP_VERSION='3.6.1'","const APP_VERSION='3.7.0'")

# Right-hand stories are viewport snapshots, not scrolling pages.
s=s.replace(".view{height:calc(100vh - 174px);overflow:auto;padding-top:12px}",".view{height:calc(100vh - 174px);overflow:hidden;padding-top:12px}")
s=s.replace(".section,.subview{display:none}.section.active,.subview.active{display:block}",".section,.subview{display:none}.section.active{display:block;height:100%}.subview.active{display:block;height:100%;overflow:hidden}")
extra_css=r'''
.snapshotCard{height:100%;overflow:hidden;display:flex;flex-direction:column}.snapshotBody{flex:1;min-height:0;overflow:hidden}.snapshotGrid{height:100%;align-content:start}.storyIntro{margin:0 0 8px}.modalToolbar{display:flex;gap:7px;align-items:center;flex-wrap:wrap;margin-bottom:10px}.modalRange{display:flex;gap:5px;flex-wrap:wrap}.modalRange button{border:1px solid var(--line);background:#15223a;color:var(--muted);border-radius:999px;padding:6px 9px}.modalRange button.active{border-color:var(--accent);color:var(--text)}.modalChart{height:360px}.modalStats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:10px}.modalStat{padding:9px;border:1px solid var(--line);border-radius:9px;background:#0d192b}.modalStat strong{display:block;margin-top:3px}.compactNews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.compactNews .newsItem{border:1px solid var(--line);border-radius:10px;padding:10px;min-height:92px;overflow:hidden}.compactNews .newsItem a{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}.compactLibrary .libraryRow{padding:9px 4px}.macroGrid{grid-template-columns:repeat(4,minmax(0,1fr))}.hero{grid-template-columns:1fr 1.35fr}.compositeGrid{grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.composite{min-height:0}.summaryStrip{margin:8px 0}.rangebar{margin-bottom:6px;padding:6px 0}.regimeCard{min-height:118px}.pageHead{height:48px}.contextTabs{height:38px}.view{height:calc(100vh - 164px)}
@media(max-width:1250px){.compositeGrid{grid-template-columns:repeat(3,minmax(0,1fr))}.macroGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media(max-width:900px){.compositeGrid,.macroGrid,.compactNews{grid-template-columns:repeat(2,minmax(0,1fr))}.modalStats{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:800px){.view{overflow:auto}.subview.active{overflow:auto}.compositeGrid,.macroGrid,.compactNews{grid-template-columns:1fr}}
'''
s=s.replace('</style>',extra_css+'\n</style>',1)

# Remove the duplicate hidden Markets destination entirely.
s=re.sub(r'<section class="section" data-section="markets">.*?</section>\n(?=<section class="section" data-section="macro">)','',s,count=1,flags=re.S)

# Macro becomes two focused tabs/screens.
old_macro=re.search(r'<section class="section" data-section="macro">.*?</section>',s,re.S)
if not old_macro:
    raise SystemExit('Macro section missing')
new_macro='''<section class="section" data-section="macro"><div class="subview active" data-subview="macro:inflation"><article class="card snapshotCard"><div><div class="kicker">Slow-moving context</div><h2>Inflation</h2><p class="muted storyIntro">Monthly inflation history and release context. Open a card for the full chart and data.</p></div><div id="inflationGrid" class="grid macroGrid snapshotBody snapshotGrid"></div></article></div><div class="subview" data-subview="macro:rates"><article class="card snapshotCard"><div><div class="kicker">Cost of capital</div><h2>Rates</h2><p class="muted storyIntro">Policy and Treasury rates. Open a card for the full chart and data.</p></div><div id="rateGrid" class="grid macroGrid snapshotBody snapshotGrid"></div></article></div></section>'''
s=s[:old_macro.start()]+new_macro+s[old_macro.end():]

# News and Library are snapshot panels; detailed reading happens in modals/external story links.
s=s.replace('<div id="newsList"></div>','<div id="newsList" class="compactNews snapshotBody"></div>')
s=s.replace('<div id="geopoliticsList"></div>','<div id="geopoliticsList" class="compactNews snapshotBody"></div>')
s=s.replace('<div id="outlookList"></div>','<div id="outlookList" class="compactNews snapshotBody"></div>')
s=s.replace('<div id="libraryList" class="libraryList"></div>','<div id="libraryList" class="libraryList compactLibrary snapshotBody"></div>')

# About wording follows the formal navigation contract.
s=s.replace('Markets is the component library, Macro is slow context, Relationships is cross-asset research, News is event intelligence, and Analysis Library stores AI interpretations of snapshots.','Each left-side item opens one purpose-built snapshot. Tabs only separate views of that same story. Cards drill into detailed modals; Analysis is the only ad-hoc research destination, and Analysis Library stores saved snapshots and AI interpretations.')

# Formal tab structure: no Markets route, Macro has Inflation/Rates.
s=re.sub(r"const TABS=\{.*?\};", "const TABS={now:[['overview','Snapshot'],['trend','Regime Trend']],macro:[['inflation','Inflation'],['rates','Rates']],relationships:[['presets','Research'],['correlations','Correlations']],news:[['latest','Latest'],['geopolitics','Geopolitics'],['outlooks','Outlooks']],library:[['saved','Saved']],providers:[['health','Health']],logs:[['activity','Activity']],about:[['about','About']]};", s, count=1, flags=re.S)

# Generic modal drill-down for every indicator/component. This replaces the hidden Markets detail route.
start=s.find('function detailBackButton()')
end=s.find('function renderMacro()',start)
if start<0 or end<0:
    raise SystemExit('Detail chart function block missing')
series_modal=r'''function modalHorizons(id){if(id==='cpi')return['1y','5y','max'];if(!META[id]?.symbol)return['1mo','3mo','6mo','ytd','1y','5y','max'];return Object.keys(HORIZONS)}
function seriesSnapshotText(id,r,d){const m=META[id],q=quote(d),cov=coverage(id,r);return`${m.name} · ${HORIZONS[r]?.label||r}. ${q?`Latest ${(m.unit||'')+fmt(q.value,m.decimals)+(m.suffix||'')}; period change ${pct(q.periodPct)}.`:'No verified observations.'} ${cov.ok?`${cov.points} observations available.`:`Coverage is incomplete (${cov.points} observations).`}`}
async function saveSeriesSnapshot(id,r,d){const m=META[id],q=quote(d),text=seriesSnapshotText(id,r,d),item={id:crypto.randomUUID(),createdAt:Date.now(),title:`${m.short} ${HORIZONS[r]?.label||r} snapshot · ${new Date().toLocaleString()}`,regime:'Research snapshot',confidence:coverage(id,r).ok?100:0,summary:text,full:text,evidence:{type:'series',series:id,horizon:r,latest:q?.value??null,changePct:q?.periodPct??null,observations:d.length,provider:displayProvider(state.seriesMeta[id]?.provider)},model:'deterministic snapshot',sources:[]};await idbPut('analyses',item);state.analyses.unshift(item);renderLibrary();toast('Snapshot saved to Analysis Library')}
async function renderSeriesModal(id,r){const m=META[id],panel=$('#seriesModalChart'),status=$('#seriesModalStatus'),stats=$('#seriesModalStats');if(!panel)return;$$('[data-modal-range]').forEach(b=>b.classList.toggle('active',b.dataset.modalRange===r));let d=[],source=displayProvider(state.seriesMeta[id]?.provider);status.textContent=`Preparing ${m.short} ${HORIZONS[r]?.label||r}…`;if(HORIZONS[r]?.intraday&&m.symbol){try{d=await fetchYahoo(id,HORIZONS[r].fetchRange,HORIZONS[r].interval);source='Yahoo Finance · intraday'}catch(e){status.textContent=`${m.short} ${HORIZONS[r].label} unavailable: ${e.message}`;standardChart(panel,[],{range:r,showAxes:true});stats.innerHTML='';return}}else{if(m.symbol&&!coverage(id,r).ok&&r!=='max')await ensureHistory(id,r);d=r==='max'?(state.series[id]||[]):rangeSeries(id,r,m.symbol?true:false)}if(!d.length){status.textContent=`${m.short} ${HORIZONS[r]?.label||r} unavailable · no verified observations`;standardChart(panel,[],{range:r,showAxes:true});stats.innerHTML='';return}standardChart(panel,[{id,name:m.short,color:m.color,unit:(m.unit||'')+(m.suffix||''),data:d}],{range:r,showAxes:true});const q=quote(d),first=d[0],last=d.at(-1);status.textContent=`${m.name} · ${HORIZONS[r]?.label||r} · ${d.length} observations · ${source}`;stats.innerHTML=`<div class="modalStat"><span class="kicker">Latest</span><strong>${(m.unit||'')+fmt(q.value,m.decimals)+(m.suffix||'')}</strong></div><div class="modalStat"><span class="kicker">Period change</span><strong>${pct(q.periodPct)}</strong></div><div class="modalStat"><span class="kicker">From</span><strong>${new Date(first.t).toLocaleDateString()}</strong></div><div class="modalStat"><span class="kicker">Through</span><strong>${new Date(last.t).toLocaleDateString()}</strong></div>`;const save=$('#saveSeriesSnapshotBtn');if(save)save.onclick=()=>saveSeriesSnapshot(id,r,d)}
async function openSeriesModal(id,r=state.nowRange){const m=META[id];$('#detailTitle').textContent=m.name;const ranges=modalHorizons(id);if(!ranges.includes(r))r=ranges.includes('1y')?'1y':ranges[0];$('#detailBody').innerHTML=`<div class="modalToolbar"><div class="modalRange">${ranges.map(x=>`<button data-modal-range="${x}" class="${x===r?'active':''}">${HORIZONS[x]?.label||x}</button>`).join('')}</div><button id="saveSeriesSnapshotBtn" class="primary" style="margin-left:auto">Save to Analysis</button></div><div id="seriesModalStatus" class="callout"></div><div class="modalChart"><canvas id="seriesModalChart" class="chart"></canvas></div><div id="seriesModalStats" class="modalStats"></div><div class="callout" style="margin-top:10px"><strong>${esc(m.role)}</strong><br><span class="muted">${esc(m.description)}</span></div>`;$('#detailModal').classList.add('open');$$('[data-modal-range]').forEach(b=>b.onclick=()=>renderSeriesModal(id,b.dataset.modalRange));await renderSeriesModal(id,r)}
'''
s=s[:start]+series_modal+s[end:]

# Composite modal remains the first drill-down; component detail stays inside the modal flow.
old_open=re.search(r'function openComposite\(key\).*?\nfunction componentCard',s,re.S)
if not old_open:
    raise SystemExit('openComposite block missing')
new_open=r'''async function saveCompositeSnapshot(key){const c=COMPOSITES[key],sig=compositeSignal(key),parts=c.components.map(id=>({id,signal:signal(id,rangeQuote(id,state.nowRange)),quote:rangeQuote(id,state.nowRange)})),text=`${c.name} · ${HORIZONS[state.nowRange].label}: ${sig.label}. `+parts.map(x=>`${META[x.id].short} ${x.signal.label}${x.quote?` ${pct(x.quote.periodPct)}`:''}`).join('; '),item={id:crypto.randomUUID(),createdAt:Date.now(),title:`${c.name} ${HORIZONS[state.nowRange].label} snapshot · ${new Date().toLocaleString()}`,regime:sig.label,confidence:parts.length?Math.round(parts.filter(x=>x.quote).length/parts.length*100):0,summary:text,full:text,evidence:{type:'composite',key,horizon:state.nowRange,parts},model:'deterministic snapshot',sources:[]};await idbPut('analyses',item);state.analyses.unshift(item);renderLibrary();toast('Composite snapshot saved to Analysis Library')}
function openComposite(key){state.lastComposite=key;const c=COMPOSITES[key];$('#detailTitle').textContent=c.name;if(key==='events'){const items=state.news.filter(n=>n.topic==='geopolitics').slice(0,8);$('#detailBody').innerHTML=`<div class="actions"><button id="saveCompositeSnapshotBtn" class="primary">Save to Analysis</button></div>`+(items.map(n=>`<div class="newsItem"><a href="${esc(n.link)}" target="_blank">${esc(n.title)}</a><div class="newsMeta"><span>${esc(n.source)}</span><span>${new Date(n.publishedAt).toLocaleString()}</span>${newsClassTag(n)}</div></div>`).join('')||'<p class="muted">No geopolitical items stored.</p>');$('#detailModal').classList.add('open');$('#saveCompositeSnapshotBtn').onclick=()=>saveCompositeSnapshot(key);return}$('#detailBody').innerHTML=`<div class="modalToolbar"><div><div class="kicker">${esc(c.desc)}</div><strong>${HORIZONS[state.nowRange].label} component snapshot</strong></div><button id="saveCompositeSnapshotBtn" class="primary" style="margin-left:auto">Save to Analysis</button></div><div class="grid marketGrid">${c.components.map(componentCard).join('')}</div>`;$('#detailModal').classList.add('open');$('#saveCompositeSnapshotBtn').onclick=()=>saveCompositeSnapshot(key);bindComponentButtons();setTimeout(drawSparks,0)}
function componentCard'''
s=s[:old_open.start()]+new_open+s[old_open.end():]

# One drill-down path only: component button -> modal detail. No showSection('markets').
old_bind=re.search(r'function renderMarkets\(\).*?function setupCanvas',s,re.S)
if not old_bind:
    raise SystemExit('renderMarkets/bind block missing')
new_bind=r'''function bindComponentButtons(){$$('[data-open-chart]').forEach(b=>b.onclick=e=>{e.stopPropagation();openSeriesModal(b.dataset.openChart,state.nowRange)});$$('[data-info]').forEach(b=>b.onclick=e=>{e.stopPropagation();openSeriesModal(b.dataset.info,state.nowRange)})}
function setupCanvas'''
s=s[:old_bind.start()]+new_bind+s[old_bind.end():]

# Macro snapshot cards use the same modal drill-down and no separate detail route.
old_render_macro=re.search(r'function renderMacro\(\).*?\nfunction transform',s,re.S)
if not old_render_macro:
    raise SystemExit('renderMacro block missing')
new_render_macro=r'''function macroCard(id,r){const m=META[id],q=state.quotes[id],d=rangeSeries(id,r,false);return`<article class="card componentCard"><div class="metricTop"><div><div class="kicker">${esc(m.role)}</div><h3>${esc(m.short)}</h3></div><span class="cadenceBadge">${m.policy==='monthly'?'Monthly':'Daily'}</span></div><div class="metricValue">${q?fmt(q.value,m.decimals)+(m.suffix||''):'Unavailable'}</div><div class="coverage">${HORIZONS[r]?.label||r} · ${d.length} ${m.policy==='monthly'?'monthly':'daily'} observations</div><canvas class="spark" data-spark="${id}" data-range="${r}"></canvas><button class="openChartBtn" data-open-chart="${id}">Open detail →</button></article>`}
function renderMacro(){if($('#inflationGrid'))$('#inflationGrid').innerHTML=macroCard('cpi','5y');if($('#rateGrid'))$('#rateGrid').innerHTML=['fedFunds','twoYear','tenYear','thirtyYear'].map(id=>macroCard(id,'1y')).join('');bindComponentButtons();setTimeout(drawSparks,0)}
function transform'''
s=s[:old_render_macro.start()]+new_render_macro+s[old_render_macro.end():]

# Compact snapshot counts on News and Library.
s=s.replace("$('#newsList').innerHTML=render(state.news.slice(0,120));","$('#newsList').innerHTML=render(state.news.slice(0,8));")
s=s.replace("$('#geopoliticsList').innerHTML=render(state.news.filter(x=>x.topic==='geopolitics').slice(0,100));","$('#geopoliticsList').innerHTML=render(state.news.filter(x=>x.topic==='geopolitics').slice(0,8));")
s=s.replace("$('#outlookList').innerHTML=render(state.news.filter(x=>x.outlook).slice(0,100));","$('#outlookList').innerHTML=render(state.news.filter(x=>x.outlook).slice(0,8));")
s=s.replace("$('#libraryList').innerHTML=rows.map(a=>", "$('#libraryList').innerHTML=rows.slice(0,8).map(a=>")

# Remove all runtime references to the deleted Markets route and instrument controls.
s=s.replace("if(id==='markets'){renderMarkets();if(state.sub==='chart')drawInstrument()}","")
s=s.replace("$('#instrumentSelect').innerHTML=['spy','qqq','vix','tenYear','wti','brent','gold','dxy'].map(id=>`<option value=\"${id}\">${META[id].name}</option>`).join('');$('#instrumentSelect').onchange=drawInstrument;$('#instrumentRange').onchange=drawInstrument;","")
s=s.replace("function setupRanges(){$('#nowRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<button data-nr=\"${k}\" class=\"${k===state.nowRange?'active':''}\">${v.label}</button>`).join('');$$('[data-nr]').forEach(b=>b.onclick=async()=>{state.nowRange=b.dataset.nr;$$('[data-nr]').forEach(x=>x.classList.toggle('active',x===b));renderNow();renderMarkets();await ensureOverviewHorizon(state.nowRange);renderNow();renderMarkets()});$('#instrumentRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<option value=\"${k}\">${v.label}</option>`).join('')}","function setupRanges(){$('#nowRange').innerHTML=Object.entries(HORIZONS).map(([k,v])=>`<button data-nr=\"${k}\" class=\"${k===state.nowRange?'active':''}\">${v.label}</button>`).join('');$$('[data-nr]').forEach(b=>b.onclick=async()=>{state.nowRange=b.dataset.nr;$$('[data-nr]').forEach(x=>x.classList.toggle('active',x===b));renderNow();await ensureOverviewHorizon(state.nowRange);renderNow()})}")
s=s.replace("function renderAll(){renderNow();renderMarkets();renderMacro();","function renderAll(){renderNow();renderMacro();")

# No circular hidden destination in page title fallback.
s=s.replace("||(id==='markets'?'Market Detail':id)","||id")

p.write_text(s)
print('Patched Market Navigator to 3.7 formal snapshot navigation')
