from pathlib import Path
import re

SRC = Path('market-navigator-turn14-pre-ship.html')
DST = Path('market-navigator-turn15-pre-ship.html')
s = SRC.read_text()


def rep(old: str, new: str, label: str, count: int = 1):
    global s
    if old not in s:
        raise SystemExit(f'missing Turn 14 anchor: {label}')
    s = s.replace(old, new, count)


def rep_re(pattern: str, repl: str, label: str, count: int = 1):
    global s
    s2, n = re.subn(pattern, repl, s, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f'missing/ambiguous Turn 14 regex anchor: {label} ({n})')
    s = s2


rep('<title>Market Navigator · Turn 14</title>', '<title>Market Navigator · Turn 15</title>', 'title')
rep('TURN 14 PRE-SHIP', 'TURN 15 PRE-SHIP', 'build label')

# Config is one real surface with three tabs. The old standalone chart-settings
# modal is removed; its ids are reused inside Chart Config so existing controls
# remain directly wired rather than duplicated.
config_css = (
    '.cfgTabs{display:flex;gap:5px;margin:0 0 8px;position:sticky;top:0;z-index:3;background:var(--bg);padding:2px 0 6px}'
    '.cfgTab{border:1px solid var(--line);background:var(--panel2);border-radius:7px;padding:7px 11px;font-size:10px;font-weight:900}'
    '.cfgTab.on{border-color:var(--accent);background:#17334d}.cfgPanel{display:none}.cfgPanel.on{display:block}'
    '.chartSlot{display:grid;grid-template-columns:34px minmax(78px,1fr) minmax(92px,1fr);gap:6px;align-items:center;border:1px solid var(--line);border-radius:8px;padding:7px;background:#081522}'
    '.chartSlot input[type=color]{width:34px;height:30px;border:0;padding:0;background:transparent}.chartSlot input[type=range]{width:100%}'
    '.chartSlot select{background:#071522;border:1px solid var(--line);border-radius:6px;padding:5px}.slotMeta{grid-column:1/-1;display:flex;justify-content:space-between;color:var(--muted);font-size:9px}'
    '.aboutText{color:var(--muted);line-height:1.55}'
)
rep('.cfgStatus.bad{color:var(--bad)}', '.cfgStatus.bad{color:var(--bad)}' + config_css, 'config css')
rep('.paletteGrid{grid-template-columns:repeat(2,minmax(96px,1fr))}', '.paletteGrid{grid-template-columns:1fr}.chartSlot{grid-template-columns:34px minmax(72px,1fr) minmax(86px,1fr)}', 'phone config grid')

old_config_start = '<section class="view" id="view-config"><div class="config"><div class="card" style="padding:14px"><h2>AI Configuration</h2>'
new_config_start = '<section class="view" id="view-config"><div class="config"><div class="cfgTabs"><button class="cfgTab on" data-cfgtab="ai">AI</button><button class="cfgTab" data-cfgtab="chart">Chart Config</button><button class="cfgTab" data-cfgtab="about">About</button></div><div class="cfgPanel card on" id="cfgAi" style="padding:14px"><h2>AI Configuration</h2>'
rep(old_config_start, new_config_start, 'config tabs start')
old_config_end = '<div class="cfgNote" id="cfgSummary"></div></div></div></section><div class="modal hidden" id="settingsModal">'
chart_panel = '''<div class="cfgNote" id="cfgSummary"></div></div><div class="cfgPanel card" id="cfgChart" style="padding:14px"><h2>Chart Config</h2><p class="rowMeta">Identity-bound settings for Series 1–10. White remains reserved for the active reference outline.</p><div class="palettePresets" id="palettePresets"></div><div class="paletteGrid" id="paletteGrid"></div><div class="paletteStatus" id="paletteStatus"></div><div class="actions"><button class="btn" id="paletteImport">Import</button><button class="btn" id="paletteExport">Export</button><button class="btn" id="paletteSave">Save</button></div><input id="paletteImportInput" type="file" accept="application/json,.json" class="hidden"></div><div class="cfgPanel card" id="cfgAbout" style="padding:14px"><h2>About</h2><div class="aboutText"><p><strong>Market Navigator · Turn 15</strong></p><p>Canonical evidence is collected and persisted before chart/AI consumption. GDP is presented as deterministic quarterly q/q and y/y transforms of canonical Real GDP levels. Direct-series availability is separate from derived-index mathematical eligibility.</p></div></div></div></section><div class="modal hidden" id="settingsModal">'''
rep(old_config_end, chart_panel, 'config tabs end')

# Remove the obsolete settings modal entirely and leave Analysis as the next modal.
rep_re(r'<div class="modal hidden" id="settingsModal">.*?</div></div><div class="modal hidden" id="analysisModal">', '<div class="modal hidden" id="analysisModal">', 'remove old settings modal')

# Gear now opens CONFIG rather than a separate modal.
rep('<button class="gear" id="settingsGear" aria-label="Chart settings">⚙</button><span>SETTINGS</span>', '<button class="gear" id="settingsGear" aria-label="Configuration">⚙</button><span>CONFIG</span>', 'gear label')

# V1/V2 more menu contract.
old_now_menu = '<div class="nowMoreMenu hidden" id="nowMoreMenu"><button class="aiAction" id="nowAnalyze">Analyze into Library</button><button id="nowDownload">Download visible analysis</button><button id="nowPrint">Print visible analysis</button></div>'
new_now_menu = '<div class="nowMoreMenu hidden" id="nowMoreMenu"><button class="aiAction" id="nowAnalyze">AI POV</button><button id="nowPrint">Print</button><button id="nowMarkdown">Download Markdown</button><button id="nowCsv">Download CSV</button><button id="nowJson">Download JSON</button></div>'
rep(old_now_menu, new_now_menu, 'NOW more menu')

# EXPLORE gets the same analytical menu against current selected state.
rep('<div class="exploreTop"><strong>Selected</strong></div>', '<div class="exploreTop"><strong>Selected</strong><button class="btn" id="exploreMoreBtn" style="float:right" aria-label="Explore actions">⋯</button></div>', 'Explore more button')
rep('</div></div></div></section><section class="view" id="view-library">', '</div></div><div class="moreMenu hidden" id="exploreMoreMenu" style="top:46px"><button class="aiAction" id="exploreAI">AI POV</button><button id="explorePrint">Print</button><button id="exploreMarkdown">Download Markdown</button><button id="exploreCsv">Download CSV</button><button id="exploreJson">Download JSON</button></div></div></section><section class="view" id="view-library">', 'Explore more menu')

# V3 more menu contract.
old_more = '<div class="moreMenu hidden" id="moreMenu"><button class="aiAction" id="moreAI">AI Analysis</button><button id="moreStats">Stats</button><button id="morePrint">Print</button><button id="moreDownload">Download</button></div>'
new_more = '<div class="moreMenu hidden" id="moreMenu"><button class="aiAction" id="moreAI">AI POV</button><button id="moreStats">Stats</button><button id="morePrint">Print</button><button id="moreMarkdown">Download Markdown</button><button id="moreCsv">Download CSV</button><button id="moreJson">Download JSON</button></div>'
rep(old_more, new_more, 'V3 more menu')

# Built-in presets are exactly Normal, Bright and Colorblind.
rep("PALETTES={contrast:", "PALETTES={normal:", 'normal preset key')
rep("PALETTES.contrast", "PALETTES.normal", 'normal preset default')
rep("name:'High contrast'", "name:'Normal'", 'normal preset name')

# State gets promise-cache and generation guards.
rep('series:{},nowActive:null', 'series:{},seriesPromises:{},nowActive:null', 'series promise cache')
rep('libraryChartSeq:0,nowChartState:null}', 'libraryChartSeq:0,nowChartState:null,v2RenderSeq:0,analysisRenderSeq:0}', 'render generations')

# Replace palette runtime as a coherent block. This adds width/style while
# preserving identity-bound slot assignments and old color-only state migration.
start = s.find('let PALETTE_CACHE=null;function cleanAssignments')
end = s.find('function displayLabel', start)
if start < 0 or end < 0:
    raise SystemExit('palette runtime block not found')
new_palette_runtime = r'''let PALETTE_CACHE=null;const LINE_STYLES=['line','dash','dash-dot','dot','dot-dash'];function cleanAssignments(x){let out={};for(let[k,v]of Object.entries(x||{}))if(Number.isInteger(+v)&&+v>=0&&+v<10)out[k]=+v;return out}function cleanWidths(x){let a=Array.isArray(x)?x:[];return Array.from({length:10},(_,i)=>Math.max(1,Math.min(12,Number(a[i])||2)))}function cleanLineStyles(x){let a=Array.isArray(x)?x:[];return Array.from({length:10},(_,i)=>LINE_STYLES.includes(a[i])?a[i]:'line')}function paletteState(){if(PALETTE_CACHE)return PALETTE_CACHE;let base={schema:'market-navigator-series-style-v2',name:'Normal',colors:[...PALETTES.normal],widths:Array(10).fill(2),lineStyles:Array(10).fill('line'),assignments:{risk:0,growth:1,macro:2}};try{let raw=JSON.parse(localStorage.getItem(PK)||'null');if(raw&&Array.isArray(raw.colors)&&raw.colors.length===10)base={...base,...raw,schema:'market-navigator-series-style-v2',colors:raw.colors.map(x=>String(x).toUpperCase()),widths:cleanWidths(raw.widths),lineStyles:cleanLineStyles(raw.lineStyles),assignments:{...base.assignments,...cleanAssignments(raw.assignments)}}}catch{}PALETTE_CACHE=base;return base}function savePaletteState(v){PALETTE_CACHE={schema:'market-navigator-series-style-v2',name:v.name||'Custom',colors:[...v.colors],widths:cleanWidths(v.widths),lineStyles:cleanLineStyles(v.lineStyles),assignments:cleanAssignments(v.assignments)};localStorage.setItem(PK,JSON.stringify(PALETTE_CACHE));return PALETTE_CACHE}function colorSlot(id){let p=paletteState(),slot=p.assignments[id];if(Number.isInteger(slot)&&slot>=0&&slot<10)return slot;let used=new Set(Object.values(p.assignments));slot=[0,1,2,3,4,5,6,7,8,9].find(x=>!used.has(x));if(slot===undefined){let hash=0;for(let ch of String(id))hash=(hash*31+ch.charCodeAt(0))>>>0;slot=hash%10}p.assignments[id]=slot;savePaletteState(p);return slot}function chartColors(ids){let p=paletteState(),used=new Map(),changed=false,out={};for(let id of ids){let slot=colorSlot(id);if(used.has(slot)&&used.get(slot)!==id){let free=[0,1,2,3,4,5,6,7,8,9].find(x=>!used.has(x));if(free!==undefined){slot=free;p.assignments[id]=slot;changed=true}}used.set(slot,id);out[id]=p.colors[slot]}if(changed)savePaletteState(p);return out}function seriesColor(id){let p=paletteState();return p.colors[colorSlot(id)]}function dashFor(style){return style==='dash'?[8,5]:style==='dash-dot'?[8,4,2,4]:style==='dot'?[2,4]:style==='dot-dash'?[2,4,8,4]:[]}function seriesStyle(id){let p=paletteState(),slot=colorSlot(id);return{width:p.widths[slot],lineStyle:p.lineStyles[slot],dash:dashFor(p.lineStyles[slot])}}function paintStyle(z){if(Number.isFinite(+z.lineWidth)&&z.lineStyle)return{width:+z.lineWidth,lineStyle:z.lineStyle,dash:dashFor(z.lineStyle)};return seriesStyle(z.id)}'''
s = s[:start] + new_palette_runtime + s[end:]

# Fetch once per series per boot; a failed fetch is an actual error, not a false
# availability result cached forever.
rep("async function getSeries(id){return S.series[id]||(S.series[id]=await j(`market-evidence/series/${id}.json`))}", "async function getSeries(id){if(S.series[id])return S.series[id];if(!S.seriesPromises[id])S.seriesPromises[id]=j(`market-evidence/series/${id}.json`).then(x=>{S.series[id]=x;delete S.seriesPromises[id];return x},e=>{delete S.seriesPromises[id];throw e});return S.seriesPromises[id]}", 'single in-flight series fetch')

# Structured availability: periodic GDP transforms are selectable based on a
# current canonical transform, while fetch failures remain explicit errors.
old_avail = "async function seriesAvailable(id,h=S.h,k=S.index||'risk'){try{return obsRange(await getSeries(id),horizonWindow(h,k)).length>0}catch{return false}}"
new_avail = "async function seriesAvailability(id,h=S.h,k=S.index||'risk'){try{let src=await getSeries(id),inside=obsRange(src,horizonWindow(h,k)).length,hh=health(id),cadence=String(cat(id).native_cadence||hh.cadence||'').toLowerCase(),periodic=(id==='gdpQoq'||id==='gdpYoy'||cadence.includes('month')||cadence.includes('quarter'));if(inside>0)return{available:true,reason:'in-window',count:inside};if(periodic&&(src.observations||[]).length&&hh.classification!=='failed')return{available:true,reason:(id==='gdpQoq'||id==='gdpYoy')?'periodic-transform':'periodic-current',count:0};if((cadence.includes('daily')||cadence.includes('trading'))&&hh.horizonCoverage?.[h]&&(src.observations||[]).length)return{available:true,reason:'health-covered',count:0};return{available:false,reason:'no-real-observation',count:0}}catch(e){return{available:false,reason:'evidence-error',error:String(e?.message||e)}}}async function seriesAvailable(id,h=S.h,k=S.index||'risk'){return(await seriesAvailability(id,h,k)).available}"
rep(old_avail, new_avail, 'structured availability')

# Raw GDP level is evidence-only. The user catalog exposes q/q and y/y.
rep("return S.catalog.series.filter(x=>!g[x.id]).map(x=>x.id)", "return S.catalog.series.filter(x=>!g[x.id]&&x.id!=='realGdp').map(x=>x.id)", 'Explore excludes raw GDP')
rep("ids=S.catalog.series.map(x=>x.id).filter(id=>!S.analysisSeries.includes(id)", "ids=S.catalog.series.map(x=>x.id).filter(id=>id!=='realGdp'&&!S.analysisSeries.includes(id)", 'picker excludes raw GDP')

# Roll back the column/bar experiment. Existing bar support remains only so old
# frozen Library snapshots can still render exactly as saved.
rep("return{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'bar',a:", "return{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'line',a:", 'V1 lines')
rep("sets=[{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'bar',a:", "sets=[{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'line',a:", 'V2 index line')
rep("renderType:IDX.includes(id)?'bar':'line'", "renderType:'line'", 'V3 derived lines')
rep("renderType:z.renderType||(IDX.includes(z.id)?'bar':'line')", "renderType:z.renderType||'line'", 'legacy Library line default')

# Composite ratio ineligibility cannot suppress direct WTI observations in V2.
rep("let src=await getSeries(c.id),a=omitted.has(c.id)?[]:indexed(src,w,c.direction);", "let src=await getSeries(c.id),a=indexed(src,w,c.direction);", 'WTI direct V2 evidence')

# Apply configured width/dash to live lines, while frozen snapshots can carry
# their own saved style fields.
rep("if(reference){x.strokeStyle='#fff';x.lineWidth=5;trace()}x.strokeStyle=z.color;x.lineWidth=reference?2.4:1.8;trace()", "let st=paintStyle(z);x.setLineDash(st.dash);if(reference){x.strokeStyle='#fff';x.lineWidth=st.width+3;trace()}x.strokeStyle=z.color;x.lineWidth=st.width;trace();x.setLineDash([])", 'line width/style renderer')

# Freeze width and line style into every saved chart snapshot.
rep("color:z.color,renderType:z.renderType||'line',measurementFamily:", "color:z.color,renderType:z.renderType||'line',lineWidth:paintStyle(z).width,lineStyle:paintStyle(z).lineStyle,measurementFamily:", 'snapshot style persistence')

# Generation guards prevent an older async render from overwriting the final
# horizon/series selection.
rep("async function renderV2(){let k=S.index,w=windowFor(S.h,k)", "async function renderV2(){let renderSeq=++S.v2RenderSeq,k=S.index,w=windowFor(S.h,k)", 'V2 generation start')
rep("}}$('v1btn').classList.remove('hidden');", "}}if(renderSeq!==S.v2RenderSeq)return;$('v1btn').classList.remove('hidden');", 'V2 generation commit')
rep("async function renderAnalysis(){makeHz($('analysisHz')", "async function renderAnalysis(){let renderSeq=++S.analysisRenderSeq;makeHz($('analysisHz')", 'V3 generation start')
rep(")),reps=plan.kinds.map", "));if(renderSeq!==S.analysisRenderSeq)return;let reps=plan.kinds.map", 'V3 generation commit')

# Analysis state/download helpers. They operate on the exact selected state and
# exact chart snapshot rather than reacquiring data later.
helper_anchor = "async function downloadAnalysisState(){let state=await analysisState();downloadBlob('market-navigator-analysis.json','application/json',JSON.stringify(state,null,2))}"
helper_new = r'''function stateMarkdown(state,title='Market Navigator'){let chart=state.chart||{},lines=[`# ${title}`,``,`- Horizon: ${state.horizon||chart.horizon||''}`,`- Series: ${(state.series||chart.series?.map(x=>x.id)||[]).join(', ')}`,`- Representation: ${chart.mode||''}`,``,'## Series data'];for(let z of (chart.series||[])){lines.push('',`### ${z.label||z.id}`,``,`| Date | Value | Indexed | Native |`,`|---|---:|---:|---:|`);for(let p of (z.points||[]))lines.push(`| ${new Date(p.sourceT||p.t).toISOString().slice(0,10)} | ${p.v??''} | ${p.idx??''} | ${p.raw??''} |`)}return lines.join('\n')}function stateCsv(state){let rows=['series_id,series_label,date,plot_value,indexed_value,native_value,unit'];for(let z of (state.chart?.series||[]))for(let p of (z.points||[]))rows.push([z.id,z.label,new Date(p.sourceT||p.t).toISOString().slice(0,10),p.v,p.idx??'',p.raw??'',z.unit||''].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));return rows.join('\n')}function downloadState(state,prefix,kind){if(kind==='md')downloadBlob(prefix+'.md','text/markdown',stateMarkdown(state,prefix));else if(kind==='csv')downloadBlob(prefix+'.csv','text/csv',stateCsv(state));else downloadBlob(prefix+'.json','application/json',JSON.stringify(state,null,2))}async function downloadAnalysisState(kind='json'){let state=await analysisState();downloadState(state,'market-navigator-analysis',kind)}'''
rep(helper_anchor, helper_new, 'download helpers')

# NOW menu bindings.
old_now_bind = "$('nowMoreBtn').onclick=()=>$('nowMoreMenu').classList.toggle('hidden');$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowDownload').onclick=()=>{$('nowMoreMenu').classList.add('hidden');let state=nowAnalysisState();downloadBlob(`market-navigator-${state.lineage.toLowerCase()}-${state.horizon}.json`,'application/json',JSON.stringify(state,null,2))};$('nowPrint').onclick=()=>{$('nowMoreMenu').classList.add('hidden');window.print()};"
new_now_bind = "$('nowMoreBtn').onclick=()=>$('nowMoreMenu').classList.toggle('hidden');$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowPrint').onclick=()=>{$('nowMoreMenu').classList.add('hidden');window.print()};$('nowMarkdown').onclick=()=>{let state=nowAnalysisState();$('nowMoreMenu').classList.add('hidden');downloadState(state,`market-navigator-${state.lineage.toLowerCase()}-${state.horizon}`,'md')};$('nowCsv').onclick=()=>{let state=nowAnalysisState();$('nowMoreMenu').classList.add('hidden');downloadState(state,`market-navigator-${state.lineage.toLowerCase()}-${state.horizon}`,'csv')};$('nowJson').onclick=()=>{let state=nowAnalysisState();$('nowMoreMenu').classList.add('hidden');downloadState(state,`market-navigator-${state.lineage.toLowerCase()}-${state.horizon}`,'json')};"
rep(old_now_bind, new_now_bind, 'NOW menu bindings')

# V3 menu bindings.
old_v3_bind = "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreStats').onclick=()=>{$('moreMenu').classList.add('hidden');renderStats(loaded)};$('morePrint').onclick=()=>{$('moreMenu').classList.add('hidden');window.print()};$('moreDownload').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState()};"
new_v3_bind = "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreStats').onclick=()=>{$('moreMenu').classList.add('hidden');renderStats(loaded)};$('morePrint').onclick=()=>{$('moreMenu').classList.add('hidden');window.print()};$('moreMarkdown').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('md')};$('moreCsv').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('csv')};$('moreJson').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('json')};"
rep(old_v3_bind, new_v3_bind, 'V3 menu bindings')

# Explore exact-state helper and menu bindings. Periodic GDP can be selected on
# short horizons; its genuine quarterly points remain unmodified.
explore_anchor = "$('exploreSearch').oninput=renderExplore;$('openExploreAnalysis').onclick=()=>{if(S.exploreSelected.length)openAnalysis([...S.exploreSelected],'EXPLORE',S.exploreSelected[0])};"
explore_new = r'''$('exploreSearch').oninput=renderExplore;async function exploreState(){if(!S.exploreSelected.length)throw Error('No Explore series selected');let ids=[...S.exploreSelected],w=windowFor(),colors=chartColors(ids),loaded=[];for(let id of ids)loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:'line',s:await getSeries(id)});let plan=axisPlan(ids),mode=plan.mode,sets=loaded.map(z=>({id:z.id,label:z.label,full:z.full,unit:z.unit,color:z.color,renderType:'line',axis:plan.map[z.id]||0,axisLabel:z.unit,a:mode==='indexed'?indexed(z.s,w,1):nativeIndexed(z.s,w)})),state={lineage:'EXPLORE',root:ids[0],active:ids[0],series:ids,horizon:S.h,index:S.index||'risk',evidence:ids.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,sets,w,mode,'frozen-explore');return state}$('openExploreAnalysis').onclick=()=>{if(S.exploreSelected.length)openAnalysis([...S.exploreSelected],'EXPLORE',S.exploreSelected[0])};$('exploreMoreBtn').onclick=()=>{$('exploreMoreMenu').classList.toggle('hidden')};$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('explorePrint').onclick=()=>{$('exploreMoreMenu').classList.add('hidden');window.print()};for(let [id,kind] of [['exploreMarkdown','md'],['exploreCsv','csv'],['exploreJson','json']])$(id).onclick=async()=>{if(!S.exploreSelected.length)return;let state=await exploreState();$('exploreMoreMenu').classList.add('hidden');downloadState(state,`market-navigator-explore-${state.horizon}`,kind)};'''
rep(explore_anchor, explore_new, 'Explore menu bindings')

# Config tab wiring replaces obsolete settings-modal wiring.
old_settings_bind = "$('settingsGear').onclick=()=>{renderPaletteSettings();$('settingsModal').classList.remove('hidden')};$('settingsClose').onclick=()=>$('settingsModal').classList.add('hidden');$('paletteSave').onclick=savePaletteUI;$('settingsConfig').onclick=()=>{$('settingsModal').classList.add('hidden');nav('config')};$('paletteExport').onclick=()=>downloadBlob('market-navigator-series-colors.json','application/json',JSON.stringify(paletteState(),null,2));"
new_settings_bind = "function setConfigTab(tab){document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings()}document.querySelectorAll('[data-cfgtab]').forEach(b=>b.onclick=()=>setConfigTab(b.dataset.cfgtab));$('settingsGear').onclick=()=>{nav('config');setConfigTab('ai')};$('paletteSave').onclick=savePaletteUI;$('paletteExport').onclick=()=>downloadBlob('market-navigator-series-config.json','application/json',JSON.stringify(paletteState(),null,2));"
rep(old_settings_bind, new_settings_bind, 'config tab bindings')

# Render/save/import complete style state.
start = s.find('function validPalette(colors)')
end = s.find("function repaintCharts()", start)
if start < 0 or end < 0:
    raise SystemExit('palette UI block not found')
new_palette_ui = r'''function validPalette(colors){if(!Array.isArray(colors)||colors.length!==10)throw Error('A scheme requires exactly 10 colors');let out=colors.map(x=>String(x).trim().toUpperCase());if(out.some(x=>!/^#[0-9A-F]{6}$/.test(x)))throw Error('Every slot requires a six-digit hex color');if(new Set(out).size!==10)throw Error('Every series color must be unique');if(out.some(x=>x==='#FFFFFF'))throw Error('White is reserved for the active reference outline');return out}function renderPaletteSettings(){let p=paletteState();$('palettePresets').innerHTML=Object.entries(PALETTES).map(([id,colors])=>`<button class="btn" data-palette="${id}" data-colors="${colors.join(',')}">${id==='normal'?'Normal':id==='colorblind'?'Colorblind':'Bright'}</button>`).join('');$('paletteGrid').innerHTML=p.colors.map((color,i)=>`<div class="chartSlot"><input type="color" data-palette-slot="${i}" value="${color}" aria-label="Series ${i+1} color"><input type="range" min="1" max="12" step="1" data-width-slot="${i}" value="${p.widths[i]}" aria-label="Series ${i+1} thickness"><select data-style-slot="${i}" aria-label="Series ${i+1} line style">${LINE_STYLES.map(v=>`<option value="${v}" ${p.lineStyles[i]===v?'selected':''}>${v}</option>`).join('')}</select><div class="slotMeta"><span>Series ${i+1}</span><span data-width-label="${i}">${p.widths[i]}pt</span></div></div>`).join('');$('paletteStatus').className='paletteStatus';$('paletteStatus').textContent=`${p.name} · saved`;document.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{let colors=b.dataset.colors.split(',');document.querySelectorAll('[data-palette-slot]').forEach((input,i)=>input.value=colors[i]);$('paletteStatus').textContent=`${b.textContent} selected · save to apply`;$('paletteStatus').dataset.name=b.textContent});document.querySelectorAll('[data-palette-slot],[data-style-slot]').forEach(input=>input.oninput=()=>{$('paletteStatus').textContent='Custom changes · save to apply';$('paletteStatus').dataset.name='Custom'});document.querySelectorAll('[data-width-slot]').forEach(input=>input.oninput=()=>{$(`[data-width-label="${input.dataset.widthSlot}"]`);let lab=document.querySelector(`[data-width-label="${input.dataset.widthSlot}"]`);if(lab)lab.textContent=input.value+'pt';$('paletteStatus').textContent='Custom changes · save to apply';$('paletteStatus').dataset.name='Custom'})}'''
s = s[:start] + new_palette_ui + s[end:]

old_save = "function savePaletteUI(){try{let colors=validPalette([...document.querySelectorAll('[data-palette-slot]')].map(x=>x.value)),old=paletteState(),name=$('paletteStatus').dataset.name||'Custom';savePaletteState({...old,name,colors});$('paletteStatus').className='paletteStatus good';$('paletteStatus').textContent=`${name} · saved`;repaintCharts()}catch(e){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=e.message}}"
new_save = "function savePaletteUI(){try{let colors=validPalette([...document.querySelectorAll('[data-palette-slot]')].map(x=>x.value)),widths=cleanWidths([...document.querySelectorAll('[data-width-slot]')].map(x=>x.value)),lineStyles=cleanLineStyles([...document.querySelectorAll('[data-style-slot]')].map(x=>x.value)),old=paletteState(),name=$('paletteStatus').dataset.name||'Custom';savePaletteState({...old,name,colors,widths,lineStyles});$('paletteStatus').className='paletteStatus good';$('paletteStatus').textContent=`${name} · saved`;repaintCharts()}catch(e){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=e.message}}"
rep(old_save, new_save, 'save complete chart config')

old_import = "let raw=JSON.parse(await file.text()),colors=validPalette(raw.colors),state=savePaletteState({schema:'market-navigator-series-palette-v1',name:raw.name||'Imported',colors,assignments:{...paletteState().assignments,...cleanAssignments(raw.assignments)}});"
new_import = "let raw=JSON.parse(await file.text()),colors=validPalette(raw.colors),state=savePaletteState({schema:'market-navigator-series-style-v2',name:raw.name||'Imported',colors,widths:cleanWidths(raw.widths),lineStyles:cleanLineStyles(raw.lineStyles),assignments:{...paletteState().assignments,...cleanAssignments(raw.assignments)}});"
rep(old_import, new_import, 'import complete chart config')

# Component card distinguishes composite omission from direct-analysis validity.
rep("<span>Health</span><span>${esc(h.classification||'unknown')}</span></div>", "<span>Health</span><span>${esc(h.classification||'unknown')}</span>${(hrec(S.index).omitted||[]).find(x=>x.id===id)?`<span>Composite</span><span>not used in derived ratio · direct series remains available</span>`:''}</div>", 'component composite disclosure')

# Boot CONFIG defaults and keep all existing startup behavior.
rep("renderAIConfig();renderCrumb();", "renderAIConfig();setConfigTab('ai');renderCrumb();", 'config boot')

DST.write_text(s)
print('TURN 15 BUILD: WROTE', DST, len(s))
