"""Rebuild a bounded chart correction directly from the owner-approved throwaway."""
from pathlib import Path
import hashlib,json,re

BASE=Path('market-navigator-chart-correction/approved-throwaway.html')
TARGET=Path('.evidence/chart-correction-candidate/throwaway.html')
raw=BASE.read_bytes()
assert hashlib.sha1(b'blob '+str(len(raw)).encode()+b'\0'+raw).hexdigest()=='ee38d9c9da9af4b2795695a39519c76e6c5e5239'
html=raw.decode('utf-8');changes=[]
def edit(old,new,label):
    global html
    if label=='measurement-aware chart formatting':
        at=html.rindex(old);html=html[:at]+new+html[at+len(old):];changes.append(label);return
    assert html.count(old)==1,(label,html.count(old))
    html=html.replace(old,new);changes.append(label)
def function(name,new):
    global html
    match=re.search(r'(?m)^ ?function '+re.escape(name)+r'\(',html)
    assert match,name
    # These module functions have exactly one source line; nested functions stay inline.
    end=html.index('\n',match.start())
    edit(html[match.start():end],new,name)

# The only retained prior delta: a native series needs a real in-window observation.
edit("return obsRange(src,w).length>0||(/week|month|quarter/.test(m.native_cadence||'')&&!!baseline(src,w))", "return obsRange(src,w).length>0",'retained raw horizon eligibility')

edit("function fmt(v){return Number.isFinite(+v)?(+v).toLocaleString(undefined,{maximumFractionDigits:2}):'—'}", "function fmt(v){return Number.isFinite(+v)?(+v).toLocaleString(undefined,{maximumFractionDigits:2}):'—'}\nfunction chartNumber(v,unit='Index'){if(!Number.isFinite(+v))return'—';const u=String(unit).toLowerCase(),digits=/percent|point|bps/.test(u)?3:/persons|claims|count|thousand|million/.test(u)?0:2;return (+v).toLocaleString(undefined,{minimumFractionDigits:digits,maximumFractionDigits:digits})}", 'measurement-aware chart formatting')
function('canonicalWindow'," function canonicalWindow(h,k){const x=S.derived.indices[k].horizons[h];return{horizon:h,start:Date.parse(x.commonT0+'T00:00:00Z'),end:Date.parse(S.derived.commonMarketAnchor+'T23:59:59.999Z'),startLabel:x.commonT0,endLabel:S.derived.commonMarketAnchor}}")
function('observationWindow'," function observationWindow(sets,w){w.requestedWindow={...w};return w}")

# Family ownership, never active-series ownership. Dollar quotes retain their individual units.
start=html.index(' function applyAxes(sets,automaticMode){');end=html.index(' function reconcileAxes',start)
old=html[start:end]
new=old.replace(" if(S.axisOptions==='auto'){", " if(S.axisOptions==='auto'){\n  if(S.nowRepresentation==='indexed'){for(const z of sets){z.axis=0;z.a=z.a.map(q=>({...q,v:+q.idx}));z.axisLabel='Indexed 100'}return'indexed'}\n  const money=z=>/usd|dollar/i.test(z.unit||''),dollars=sets.filter(z=>money(z)&&z.a.length);\n  if(dollars.length){const mixed=sets.some(z=>!money(z)),units=[...new Set(dollars.map(z=>z.unit))],label=units.length===1?units[0]:'USD · per-series units';for(const z of sets){const native=money(z);z.axis=mixed&&native?1:0;z.a=z.a.map(q=>({...q,v:native?+q.raw:+q.idx}));z.axisLabel=native?label:'Indexed 100'}S.nowRepresentation=mixed?'dual':'native';return mixed?'dual':'native'}")
new=new.replace("S.nowRepresentation=mixed?'dual':'native';",'')
edit(old,new,'dollar-family axis ownership; effective mode never overwrites requested mode')
edit("S.nowActive=id;if(!IDX.includes(id))S.nativeAxisSeries=id;S.nowFocus=id;", "S.nowActive=id;S.nowFocus=id;", 'legend focus does not reassign axes')
edit("clockIndex:nowOptions.clockIndex||nowState.root", "clockIndex:nowOptions.clockIndex||(IDX.includes(nowState.root)?nowState.root:'risk')", 'raw-series Analyze keeps a valid market clock')
edit("if(next.nowRepresentation==='native'&&next.axisOptions==='auto'&&new Set(ids.map(measurementFamily)).size>1)", "if(next.level!==1&&next.nowRepresentation==='native'&&next.axisOptions==='auto'&&new Set(ids.map(measurementFamily)).size>1)",'overview retains requested Native without inventing a native index axis')
edit("const axisChanged=!IDX.includes(sel.id)&&S.nativeAxisSeries!==sel.id;if(!IDX.includes(sel.id))S.nativeAxisSeries=sel.id;if(axisChanged&&S.axisOptions==='auto'&&S.nowRepresentation==='dual')renderV2();else publish()", "publish()",'inspection cannot reassign axes')

function('inspectedPoint'," function inspectedPoint(z,target){const points=z.a.filter(q=>!q.held);if(!points.length)return null;return points.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a)}")
edit('const q=inspectedPoint(sel,hit.target);S.inspection=', 'const q=inspectedPoint(sel,hit.target);if(!q)return;S.inspection=', 'empty real inspection guard')

# Keep the approved compact box; only value formatting changes, not its extra disclosures.
edit("'idx '+fmt(q.v):'idx '+fmt(iv)+' · value '+fmt(nv)+' '+esc(sel.unit||'')", "'idx '+chartNumber(q.v):'idx '+chartNumber(iv)+' · value '+chartNumber(nv,sel.unit)+' '+esc(sel.unit||'')",'crosshair value precision')
edit("x.fillText(fmt(v),a?W-3:3,yy+3)","x.fillText(chartNumber(v,mode==='indexed'||rep?.axisLabel==='Indexed 100'?'Index':rep?.unit),a?W-3:3,yy+3)",'axis value precision')
edit("let bars=sets.filter(z=>isBar(z)&&z.a.length)","for(let a=0;a<(dual?2:1);a++){const indexed=mode==='indexed'||sets.find(z=>axOf(z)===a)?.axisLabel==='Indexed 100',[mn,mx]=scales[a];if(indexed&&mn<=100&&mx>=100){const yy=p.t+(mx-100)/(mx-mn)*ph;x.save();x.strokeStyle='#7793aa';x.lineWidth=1;x.setLineDash([3,3]);x.beginPath();x.moveTo(p.l,yy);x.lineTo(p.l+pw,yy);x.stroke();x.restore()}}let bars=sets.filter(z=>isBar(z)&&z.a.length)",'100 reference line')
edit("x.arc(cross.x,cross.y,5,0,Math.PI*2);x.fill();x.stroke()", "x.arc(cross.x,cross.y,5,0,Math.PI*2);x.fill();x.stroke();const date=full(cross.t),width=x.measureText(date).width+10,tx=Math.max(p.l,Math.min(p.l+pw-width,cross.x-width/2));x.fillStyle='#06101e';x.fillRect(tx,H-26,width,14);x.fillStyle='#edf6ff';x.textAlign='left';x.fillText(date,tx+5,H-15)", 'crosshair X-axis date marker')
edit('model=paint({x:xx,y:yy,z:sel})','model=paint({x:xx,y:yy,z:sel,t:q.sourceT||q.t})','crosshair source-date marker')
edit("let dead=false,pending=false,visible=true,frame=0;", "let dead=false,pending=false,visible=true,frame=0;let inspectionEvents=null;",'inspection listener ownership')
edit("function draw(sets,w,mode='indexed'){", "function draw(sets,w,mode='indexed'){inspectionEvents?.abort();inspectionEvents=new AbortController();",'inspection listener replacement')
edit("c.onpointerleave=()=>{};c.ontouchstart=null;c.ontouchmove=null}", "c.onpointerleave=()=>{};c.ontouchstart=null;c.ontouchmove=null;c.oncontextmenu=e=>e.preventDefault();const dismiss=()=>{S.inspection=null;tip.style.display='none';model=paint()};document.addEventListener('keydown',e=>{if(e.key==='Escape'&&S.inspection&&host.getClientRects().length){e.preventDefault();dismiss()}},{signal:inspectionEvents.signal});document.addEventListener('pointerdown',e=>{if(S.inspection&&host.getClientRects().length&&!wrap.contains(e.target))dismiss()},{signal:inspectionEvents.signal})}", 'legend-only information and crosshair dismissal')
edit('dead=true;S.v2RenderSeq++;lifetime.abort();','dead=true;S.v2RenderSeq++;inspectionEvents?.abort();lifetime.abort();','inspection destruction')

# Reference selection is independent of representation. Actual native prices stay raw.
edit("b=S.indexDisplay==='rebase'?baseline(src,w):observations.find(p=>Number.isFinite(+p.v)&&+p.v!==0);", "b=S.indexDisplay==='rebase'?observations.find(p=>p.t>=w.start&&p.t<=w.end):(observations.filter(p=>p.t<=Date.UTC(2016,8,2)-1&&Number.isFinite(+p.v)&&+p.v!==0).at(-1)||observations.find(p=>Number.isFinite(+p.v)&&+p.v!==0));",'common fixed reference with later-start fallback')
edit("if(prior&&(!a.length||a[0].t>w.start))a.unshift", "if(S.indexDisplay!=='rebase'&&prior&&(!a.length||a[0].t>w.start))a.unshift",'Horizon begins at first real observation')
edit("const normalization={mode:S.indexDisplay==='rebase'?'Horizon':'Fixed',anchorDate:b?.t,anchorValue:b?.v,formula:'100 * native value / reference value'};", "const normalization={mode:S.indexDisplay==='rebase'?'Horizon':'Fixed',anchorDate:b?.t,anchorValue:b?.v,requestedAnchorDate:S.indexDisplay==='rebase'?w.start:Date.UTC(2016,8,1),laterStart:S.indexDisplay!=='rebase'&&b?.t>=Date.UTC(2016,8,2),formula:'100 * native value / reference value'};",'reference provenance')
edit("+esc(sel.unit||''):''", "+esc(sel.unit||'')+(n.laterStart?' · later-starting series':''):''", 'later-start reference disclosure') if "+esc(sel.unit||''):''" in html else None
# The reference line has a different expression; keep its actual unit and add disclosure.
if "+' '+esc(sel.unit||''):'');tip.style.display" in html:
    edit("+' '+esc(sel.unit||''):'');tip.style.display", "+' '+esc(sel.unit||'')+(n.laterStart?' · later-starting series':''):'');tip.style.display",'later-start reference disclosure')
edit("Native units do not use an index reference.","Native values stay unchanged; select Indexed 100 to compare Fixed/Horizon references.",'native display explanation')
edit("Fixed uses the historical reference; Horizon uses the start of this window. Autoscaling can preserve a single curve’s shape.","Normalized series: Fixed uses September 1, 2016 (or a disclosed later start); Horizon uses the window reference. Native prices stay unchanged.",'display explanation')
start=html.index('async function dataSeries17(');end=html.index('async function openData17(',start)
original=html[start:end]
prefix="async function dataSeries17(z,state){"
guard="if(!IDX.includes(z.id)&&z.normalization){const src=await getSeries(z.id),base=z.normalization.anchorValue;return{...z,points:(src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>({t:+p.t,sourceT:+p.t,v:+p.v,raw:+p.v,idx:Number.isFinite(+base)&&+base!==0?100*+p.v/+base:null}))}}"
edit(original,original.replace(prefix,prefix+guard,1),'Data uses the same chart reference; legacy frozen evidence retains its original path')
# Update existing explanatory prose without introducing a new reporting path.
html=html.replace('Fixed uses the earliest eligible nonzero canonical observation as the reference; Horizon uses the last observation at or before the requested start.', 'Fixed uses September 1, 2016, or the disclosed first observation for a later-starting series; Horizon uses the window reference. Actual native prices stay unchanged.')

# Requested choices belong to the instance; rendering must never rewrite them.
edit("nowFocus:null,nowRepresentation:null,indexDisplay:'fixed'", "nowFocus:null,nowRepresentation:'indexed',indexDisplay:'fixed'",'explicit initial representation default')
edit("}else if(options.activeSeries&&!IDX.includes(options.activeSeries))next.nativeAxisSeries=options.activeSeries;", "}",'active-series API does not reassign native family')
edit("let y2=sets.find(z=>z.id===S.nowActive&&!IDX.includes(z.id)&&z.a.some(q=>Number.isFinite(+q.raw))),dualEligible=!!y2&&sets.some(z=>z.id!==y2.id&&z.a.length)", "let nativeSets=sets.filter(z=>!IDX.includes(z.id)&&z.a.some(q=>Number.isFinite(+q.raw))),y2=nativeSets.find(z=>z.id===S.nativeAxisSeries)||nativeSets[0],dualEligible=!!y2&&sets.some(z=>z.id!==y2.id&&z.a.length)",'Y2 eligibility uses complete visible series independently of highlight')
function('setNowFooter',"""function setNowFooter(w,mode='indexed',dualEligible=false){const rep=S.nowRepresentation||'indexed',display=S.indexDisplay||'fixed';$('nowMeta').innerHTML=`<span>MN-PERSISTENT-1.0.0</span><span class="footerSep">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class="footerSep">|</span><select id="nowRepresentation" aria-label="Chart representation"><option value="indexed" ${rep==='indexed'?'selected':''}>Indexed 100</option>${rep==='native'||mode==='native'?`<option value="native" ${rep==='native'?'selected':''}>Native</option>`:''}<option value="dual" ${rep==='dual'?'selected':''} ${dualEligible?'':'disabled'}>Y1 + Y2</option></select><select id="nowIndexDisplay" aria-label="Index display"><option value="fixed" ${display==='fixed'?'selected':''}>Fixed</option><option value="rebase" ${display==='rebase'?'selected':''}>Horizon</option></select>`;$('nowRepresentation').onchange=()=>{S.axisOptions='auto';S.nowRepresentation=$('nowRepresentation').value;renderNow()};$('nowIndexDisplay').onchange=()=>{S.indexDisplay=$('nowIndexDisplay').value;renderNow()}}""")
edit("if(S.axisOptions==='auto'&&S.nowRepresentation==='native'&&measurementFamily(id)!==measurementFamily(visibleIds25()[0]))S.nowRepresentation='dual';", "",'adding a series never rewrites the chosen representation')
edit("function canAssignSeries(id){if(S.axisOptions==='auto')return true;", "function canAssignSeries(id){if(S.axisOptions==='auto')return S.nowRepresentation!=='native'||measurementFamily(id)===measurementFamily(visibleIds25()[0]);",'incompatible Native additions require an explicit representation change')
edit("representation:nowOptions.representation==='dual'?'indexed':nowOptions.representation", "representation:nowOptions.representation",'Analyze inherits requested representation unchanged')
edit("function ensureRebuildNow(){", "function rebuildStoredChartPreferences(){try{const p=JSON.parse(localStorage.getItem('marketNavigatorChartPreferencesV1:'+location.pathname)||'{}');return{...(['indexed','dual','native'].includes(p.representation)?{representation:p.representation}:{}),...(['fixed','horizon'].includes(p.display)?{display:p.display}:{})}}catch{return{}}}\nfunction ensureRebuildNow(){",'read route-scoped validated NOW preferences')
edit("rebuildNow=MNChart.mount($('view-now'),{view:'overview'},services)", "rebuildNow=MNChart.mount($('view-now'),{view:'overview',...rebuildStoredChartPreferences()},services)",'restore choices on reload')
edit("S.nowChartState=snapshot}}}", "S.nowChartState=snapshot;try{localStorage.setItem('marketNavigatorChartPreferencesV1:'+location.pathname,JSON.stringify({representation:options.representation,display:options.display}))}catch{}}}}",'persist NOW preferences without coupling Analyze state')

# Source-bound configuration replaces the original implementation at its source seams.
seams=json.loads(Path('market-navigator-chart-correction/style-seams.json').read_text(encoding='utf-8'))
styles=Path('market-navigator-chart-correction/source-styles.js').read_text(encoding='utf-8')
for part in styles.split('// @replace ')[1:]:
    name,body=part.split('\n',1)
    edit(seams[name.strip()],body.strip(), 'source-bound '+name.strip())
edit('function seriesColor(id){let p=paletteState();return p.colors[colorSlot(id)]}',
     'function seriesColor(id){return sourceStyle(id).color}', 'source-bound series colors')
start=html.index("$('paletteImportInput').onchange=async e=>{")
end=html.index(';function renderHealth(){',start)
edit(html[start:end], """$('paletteImportInput').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{const next=sourceRead(JSON.parse(await file.text()));savePaletteState(next);renderPaletteSettings();repaintCharts()}catch(err){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent='Import failed: '+err.message}}""", 'validated persistent source-style import')
edit('Identity-bound settings for Series 1–10. Series styling previews immediately; Save persists the current configuration.',
     'Styles belong to each data source across all charts. Changes save automatically to Custom. Red is reserved for RSK.', 'source config instructions')
edit('</head>', '<style>'+Path('market-navigator-chart-correction/source-styles.css').read_text(encoding='utf-8')+'</style></head>', 'scoped source configuration layout')
# All axis text and boundaries use one high-contrast neutral color, independent of focus.
edit("x.fillStyle='#91a8bb';x.textAlign=i===0", "x.fillStyle='#D9E6F2';x.textAlign=i===0", 'readable X-axis text')
edit("x.strokeStyle='#49657c';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();", "x.strokeStyle='#D9E6F2';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();", 'readable Y-axis boundaries')
old="x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';"
assert html.count(old)==2
html=html.replace(old,"x.fillStyle='#D9E6F2';")
changes.append('same readable Y1 and Y2 ticks and unit labels')
edit("let bars=sets.filter(z=>isBar(z)&&z.a.length)", "x.strokeStyle='#D9E6F2';x.lineWidth=1;x.beginPath();x.moveTo(p.l,p.t+ph);x.lineTo(p.l+pw,p.t+ph);x.stroke();let bars=sets.filter(z=>isBar(z)&&z.a.length)", 'matching X-axis boundary')

# Daily provider bar hours are provenance, not positions within the observation date.
edit("let a=obsRange(src,w).map(p=>({t:+p.t,v:100*+p.v/+b.v,idx:100*+p.v/+b.v,raw:+p.v,sourceT:+p.t}));",
     "const intraday=/intraday|minute|hour/.test(cadence);let a=obsRange(src,w).map(p=>({t:intraday?+p.t:Math.floor(+p.t/86400000)*86400000,v:100*+p.v/+b.v,idx:100*+p.v/+b.v,raw:+p.v,sourceT:+p.t}));",
     'daily X coordinates use observation date; original source time retained')
edit(json.loads(Path('market-navigator-chart-correction/inspection-seam.json').read_text(encoding='utf-8'))['old'],
     Path('market-navigator-chart-correction/inspection.js').read_text(encoding='utf-8').strip(),
     'compact linked date, index and native value inspection')

edit("async function j(p){let r=await fetch('market-navigator-rebuild-data/'+p,{cache:'no-store'});if(!r.ok)throw Error(`${p} HTTP ${r.status}`);return r.json()}",
     Path('market-navigator-chart-correction/etl.js').read_text(encoding='utf-8').strip(),
     'verified loaded-package receipts and live ETL view')
old="['now','library','health','config'].includes(v)"
assert html.count(old)==2
html=html.replace(old,"['now','library','health','config','etl'].includes(v)")
changes.append('ETL navigation uses the existing parked-chart lifecycle')
edit("rebuildNavigateBase(restore?'now':v);", "rebuildNavigateBase(restore?'now':v);etlStop();if(v==='etl'){$('crumb').textContent='ETL';void etlRefresh()}", 'ETL panel lifecycle')
edit('<button class="nav" data-view="health">HEALTH</button></nav>', '<button class="nav" data-view="health">HEALTH</button><button class="nav" data-view="etl" id="mnEtlLauncher">ETL</button></nav>', 'ETL left rail entry')
edit('<section class="view" id="view-config">', '<section class="view" id="view-etl"><div class="etlCard"><h2>ETL</h2><p>Loaded data, source qualification and synchronization jobs</p><div class="etlActions"><button class="btn" id="etlRefresh">Refresh status</button><a class="btn" id="etlRun" href="https://github.com/acmeproducts/stuff/actions/workflows/market-navigator-sync.yml" target="_blank" rel="noopener noreferrer">Repair data on GitHub ↗</a></div><p class="rowMeta">Repair: sign in to GitHub, choose Run workflow on main, and enable Recheck all approved source histories. The job fetches approved providers again, verifies the package and prepares the latest complete historical cutoff if current data is unavailable. Scheduled checks run hourly.</p><p id="etlAvailable"></p><div id="etlProof" aria-live="polite"></div><hr><div id="etlJobs" aria-live="polite"></div></div></section><section class="view" id="view-config">', 'ETL panel and authenticated manual workflow control')
edit("$('settingsGear').onclick=()=>openConfig('ai');", "$('etlRefresh').onclick=()=>void etlRefresh();document.addEventListener('visibilitychange',()=>{if(document.hidden)etlStop();else if(S.view==='etl')void etlRefreshJobs()});$('settingsGear').onclick=()=>openConfig('ai');", 'ETL manual refresh and conservative polling')
edit('if(!q)return null;const a=q.assurance;', 'if(!q)return etlQualification();const a=q.assurance;', 'captured package identity on consumer snapshots')
edit("j('data/market-backend/source-registry.json')]);", "j('data/market-backend/source-registry.json'),j('market-evidence/sync-proof.json')]);", 'capture qualification with the initial loaded package')
edit('</head>', '<style>'+Path('market-navigator-chart-correction/etl.css').read_text(encoding='utf-8')+'</style></head>', 'scoped ETL layout')

edit('async function load(){try{', 'let loadFailures=0;async function load(){try{', 'bounded initial data load recovery')
edit("}catch(e){message.textContent='Repairing market data. Saved reports remain available in Library.';setTimeout(load,15000)}}", "}catch(e){message.textContent='Data load failed: '+e.message+'. Saved reports remain available in Library.';loadFailures++;if(loadFailures<3&&!/mismatch|outside the loaded package|Invalid qualified|INCOMPLETE_DATA/.test(e.message))setTimeout(load,15000*2**(loadFailures-1))}}", 'truthful integrity failure; no automatic integrity retries')
edit("return{beforeRender:()=>{void rebuildRefreshData()}", "return{packageId:etlPackage?.version||null,beforeRender:()=>{void rebuildRefreshData()}", 'capture each chart service package identity')
edit("paletteName:services.paletteName?.()||'Normal',series:", "paletteName:services.paletteName?.()||'Normal',dataPackageId:services.readOnly?null:(services.packageId||null),series:", 'new live snapshots retain their own package; read-only evidence is not relabeled')

# Explicit reconciliation preserves all existing native chart mechanics.
edit('<button id="nowData">Data</button>','<button id="nowCalculation">Index calculation</button><button id="nowData">Data</button>','NOW calculation action')
edit('<button id="mn-analyze-nowData" data-mn-role="nowData">Data</button>','<button id="mn-analyze-nowCalculation" data-mn-role="nowCalculation">Index calculation</button><button id="mn-analyze-nowData" data-mn-role="nowData">Data</button>','Analyze calculation action')
edit('<button data-mn-role=\\\"nowData\\\">Data</button>','<button data-mn-role=\\\"nowCalculation\\\">Index calculation</button><button data-mn-role=\\\"nowData\\\">Data</button>','Shared calculation action')
edit("if(action==='data')return openData17(state);","if(action==='calculation')return openIndexCalculation(state);if(action==='data')return openData17(state);",'Calculation callback')
assert html.count("nowAnalyze:'ai',nowData:'data'")==2
html=html.replace("nowAnalyze:'ai',nowData:'data'","nowAnalyze:'ai',nowCalculation:'calculation',nowData:'data'")
edit("boot();window.addEventListener('resize',scheduleGeometry25);",Path('market-navigator-chart-correction/index-calculation.js').read_text(encoding='utf-8').strip()+"\n"+"boot();window.addEventListener('resize',scheduleGeometry25);",'Reconciliation math')
edit('</head>','<style>'+Path('market-navigator-chart-correction/index-calculation.css').read_text(encoding='utf-8')+'</style></head>','Scoped calculation dialog')

edit("status:Date.now()<Date.parse(qualification.validUntil)?'verified':'delayed'","status:qualification.status==='resource-hash-verified'?'resource-hash-verified':Date.now()<Date.parse(qualification.validUntil)?'verified':'delayed'","Retain loaded-resource integrity status independently of freshness")

edit("${esc(hh.actualLatestCanonicalObservation||'—')}</span></div><div class=\"actions\">", "${esc(hh.actualLatestCanonicalObservation||'—')}</span></div>${!IDX.includes(id)&&/USD|dollar|currency/i.test(meta.native_unit||'')?`<p class=\"rowMeta\" data-dollar-unit=\"${esc(id)}\">Dollar axis · ${esc(meta.native_unit)}. Dollar-based series share the dollar axis. Each series retains its own quoted unit; grouping does not convert its quote basis.</p>`:''}<div class=\"actions\">", 'Owner-approved dollar grouping disclosure in legend information')

edit("function axisScale(index,values){const axis=S.axisOptions==='auto'?null:S.axisOptions[index?'right':'left'];return axis?.min!==undefined?[axis.min,axis.max]:scale(values)}", "function chartAxisNumber(v,span,unit='Index'){const u=String(unit).toLowerCase();let digits=/percent|point|bps/.test(u)?3:/persons|claims|count|thousand|million/.test(u)?0:2;while(digits<10&&Math.abs(span)/4*Math.pow(10,digits)<1)digits++;return Number(v).toLocaleString(undefined,{minimumFractionDigits:digits,maximumFractionDigits:digits})}\nfunction chartTimeTicks(w,count){const points=S.derived?.indices?.growth?.horizons?.[w.horizon]?.curve||[];const dates=[...new Set(points.map(q=>+q.t).filter(t=>t>=w.start&&t<=w.end))].sort((a,b)=>a-b);if(!dates.length)return Array.from({length:count},(_,i)=>w.start+(w.end-w.start)*i/(count-1));return [...new Set(Array.from({length:Math.min(count,dates.length)},(_,i)=>dates[Math.round((dates.length-1)*i/(Math.min(count,dates.length)-1||1))]))]}\nfunction refreshLegendNavigation(){if(services.readOnly)return;const legend=$('legend');if(!legend)return;const parent=legend.parentElement;if(!parent)return;let prev=parent.querySelector('[data-legend-prev]'),next=parent.querySelector('[data-legend-next]');if(!prev){prev=document.createElement('button');prev.type='button';prev.className='legendStep';prev.dataset.legendPrev='';prev.setAttribute('aria-label','Scroll series left');prev.textContent='‹';next=document.createElement('button');next.type='button';next.className='legendStep';next.dataset.legendNext='';next.setAttribute('aria-label','Scroll series right');next.textContent='›';parent.insertBefore(prev,legend);parent.append(next)}\nconst update=()=>{const overflow=legend.scrollWidth>legend.clientWidth+1;prev.hidden=next.hidden=!overflow;prev.disabled=legend.scrollLeft<=1;next.disabled=legend.scrollLeft+legend.clientWidth>=legend.scrollWidth-1};prev.onclick=e=>{e.stopPropagation();legend.scrollBy({left:-Math.max(80,legend.clientWidth*.7),behavior:'auto'});update()};next.onclick=e=>{e.stopPropagation();legend.scrollBy({left:Math.max(80,legend.clientWidth*.7),behavior:'auto'});update()};if(!legend.dataset.navigationBound){legend.dataset.navigationBound='true';legend.addEventListener('scroll',update,{signal:lifetime.signal});const observer=new ResizeObserver(update);observer.observe(legend);lifetime.signal.addEventListener('abort',()=>{observer.disconnect();delete legend.dataset.navigationBound;prev.remove();next.remove()},{once:true})}requestAnimationFrame(update)}\n\nfunction axisScale(index,values,nativeDollar=false){const axis=S.axisOptions==='auto'?null:S.axisOptions[index?'right':'left'];if(axis?.min!==undefined)return[axis.min,axis.max];const range=scale(values);if(nativeDollar&&values.length&&values.every(v=>v>=0))range[0]=Math.max(0,range[0]);return range}", "presentation helpers and positive native-dollar padding")
edit("axisScale(axis,values)", "axisScale(axis,values,zs.length>0&&zs.every(z=>!IDX.includes(z.id)&&/usd|dollar/i.test(z.unit||'')&&z.a.every(q=>q.v===q.raw)))", "snapshot native-dollar domain")
edit("scales[a]=axisScale(a,values)", "scales[a]=axisScale(a,values,sets.filter(z=>axOf(z)===a).every(z=>!IDX.includes(z.id)&&/usd|dollar/i.test(z.unit||'')&&z.a.every(q=>q.v===q.raw)))", "paint native-dollar domain")
edit("for(let i=0;i<ticks;i++){let xx=p.l+pw*i/(ticks-1),tt=w.start+(w.end-w.start)*i/(ticks-1);x.strokeStyle='#173047';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();x.fillStyle='#D9E6F2';x.textAlign=i===0?'left':i===ticks-1?'right':'center';x.fillText(tick(tt,w.horizon),xx,H-10)}", "const tickTimes=chartTimeTicks(w,ticks);c.dataset.xTicks=JSON.stringify(tickTimes);for(let i=0;i<tickTimes.length;i++){let tt=tickTimes[i],xx=p.l+pw*(tt-w.start)/(w.end-w.start);x.strokeStyle='#173047';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();x.fillStyle='#D9E6F2';x.textAlign=i===0?'left':i===tickTimes.length-1?'right':'center';const text=tick(tt,w.horizon),width=x.measureText(text).width,start=i===0?xx:i===tickTimes.length-1?xx-width:xx-width/2;let show=true;if(cross){const cw=x.measureText(full(cross.t)).width+10,cx=Math.max(p.l,Math.min(p.l+pw-cw,cross.x-cw/2));show=start+width<cx-5||start>cx+cw+5}if(show)x.fillText(text,xx,H-10)}", "actual-date X ticks and inspection collision avoidance")
edit("chartNumber(v,mode==='indexed'||rep?.axisLabel==='Indexed 100'?'Index':rep?.unit)", "chartAxisNumber(v,mx-mn,mode==='indexed'||rep?.axisLabel==='Indexed 100'?'Index':rep?.unit)", "distinct Y tick precision")
edit("if(u)x.fillText(u,a?W-3:3,12)", "if(u)x.fillText(u,a?W-3:3,12);if(!a&&(mode==='indexed'||rep?.axisLabel==='Indexed 100')){const span='span '+chartAxisNumber(mx-mn,mx-mn,'Index'),uw=x.measureText(u).width,other=dual?x.measureText(sets.find(z=>axOf(z)===1)?.axisLabel||'').width+12:0;if(uw+x.measureText(span).width+other+18<W){x.font='8px system-ui';x.fillText(span,uw+10,12)}}", "visible index-axis span without changing autoscaling")
edit("x.globalAlpha=focused&&z.id!==active?.22:1", "x.globalAlpha=focused&&z.id!==active?.65:1", "readable comparison traces")
edit("x.fillRect(tx,H-26,width,14)", "x.fillRect(tx,H-26,width,22)", "selected-date tag background")
edit("function publish(){renderError=null;", "function publish(){renderError=null;refreshLegendNavigation();", "legend overflow controls")
edit("<span>MN-PERSISTENT-1.0.0</span>", "<span class=\"chartModel\" title=\"MN-PERSISTENT-1.0.0\">MN1</span>", "compact complete model identity")
edit('</head>','<style>'+Path('market-navigator-chart-correction/presentation.css').read_text(encoding='utf-8')+'</style></head>','responsive legend and footer')

edit("for(let i=0;i<5;i++){let yy=p.t+ph*i/4", "x.font='10px system-ui';for(let i=0;i<5;i++){let yy=p.t+ph*i/4", 'consistent readable Y-axis tick font')


# Across-year viewports must identify the year in both shared and global formatters.
period_tick="function tick(t,h=S.h){let d=new Date(t),o=(h==='3YR'||h==='5YR')?{month:'short',year:'2-digit'}:(h==='1YR'||h==='YTD')?{month:'short'}:{month:'short',day:'numeric'};return d.toLocaleDateString(undefined,{...o,timeZone:'UTC'})}"
assert html.count(period_tick)==2,('period tick formatter seams',html.count(period_tick))
html=html.replace(period_tick,"function tick(t,h=S.h){let d=new Date(t),o=(h==='1YR'||h==='3YR'||h==='5YR')?{month:'short',year:'2-digit'}:h==='YTD'?{month:'short'}:{month:'short',day:'numeric'};return d.toLocaleDateString(undefined,{...o,timeZone:'UTC'})}");changes.append('unambiguous years across annual period boundaries')


edit("verificationInstruction:state.verification?.status==='delayed'?'This is an integrity-checked historical snapshot. Live source verification was delayed when this scope was captured. State its verification timestamp; do not claim it is currently source-verified.':null","verificationInstruction:etlSnapshotInstruction(state.verification)",'frozen prose source-completeness and expiry disclosure')


# Explicit historical scope survives downloads, frozen analysis and print.
edit("let rows=['series_id,series_label,date,plot_value,indexed_value,native_value,unit'];", "let historical=state.verification?.historicalCutoff,rows=['series_id,series_label,date,plot_value,indexed_value,native_value,unit'+(historical?',historical_cutoff,data_scope':'')];", 'historical CSV scope header')
edit("p.raw??'',z.unit||''].map", "p.raw??'',z.unit||'',...(historical?[historical,'historical; not current']:[])].map", 'historical CSV scope per observation')
edit("lines=[\x60# \x24{title}\x60,\x60\x60,", "lines=[\x60# \x24{title}\x60,\x60\x60,...(state.verification?.historicalCutoff?['Historical data through '+state.verification.historicalCutoff+' — not current data','']:[]),", 'historical Markdown disclosure')
edit("['Report generated',new Date().toISOString()]];", "['Report generated',new Date().toISOString()],...(state.verification?.historicalCutoff?[['Data scope','Historical data through '+state.verification.historicalCutoff+' — not current data']]:[])];", 'historical NOW print disclosure')
edit("if(evidence)rows.push(['Saved evidence'", "if(st.verification?.historicalCutoff)rows.push(['Data scope','Historical data through '+st.verification.historicalCutoff+' — not current data']);if(evidence)rows.push(['Saved evidence'", 'historical Library print disclosure')


edit("function analysisMarkdown(a){let out=\x60# \x24{a.title}\\n\\n\x60;", "function analysisMarkdown(a){let out=\x60# \x24{a.title}\\n\\n\x60;if(a.state?.verification?.historicalCutoff)out+='Historical data through '+a.state.verification.historicalCutoff+' — not current data\\n\\n';", 'historical saved analysis Markdown disclosure')
edit("let md=mnxCurrentMarkdown();", "let md=mnxCurrentMarkdown();if(md&&etlCompleteness?.scope==='explicit-historical')md='Historical data through '+etlCompleteness.marketDate+' — not current data\\n\\n'+md;", 'historical explanation download disclosure')

edit('__ETL_BUILD_ID__', hashlib.sha256(html.encode('utf-8')).hexdigest(), 'content-bound application build identity')

TARGET.parent.mkdir(parents=True,exist_ok=True);TARGET.write_text(html,encoding='utf-8',newline='')
blob=hashlib.sha1(b'blob '+str(len(html.encode())).encode()+b'\0'+html.encode()).hexdigest()
Path('.evidence/chart-correction-build.json').write_text(json.dumps({'baseline':'ee38d9c9da9af4b2795695a39519c76e6c5e5239','candidate':blob,'changes':changes,'nativeHorizonSemantics':'native prices unchanged; every normalized series rebases; Fixed 2016-09-01 with later-start disclosure','published':False},indent=2))
print(json.dumps({'candidate':blob,'changes':len(changes),'target':str(TARGET)}))
