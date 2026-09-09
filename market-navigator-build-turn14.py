from pathlib import Path


SRC = Path("market-navigator-turn13-pre-ship.html")
DST = Path("market-navigator-turn14-pre-ship.html")
s = SRC.read_text()


def replace(old: str, new: str, label: str) -> None:
    global s
    if old not in s:
        raise SystemExit(f"missing Turn 13 anchor: {label}")
    s = s.replace(old, new)


def replace_range(start_anchor: str, end_anchor: str, new: str, label: str) -> None:
    global s
    start = s.find(start_anchor)
    if start < 0:
        raise SystemExit(f"missing Turn 13 start anchor: {label}")
    end = s.find(end_anchor, start)
    if end < 0:
        raise SystemExit(f"missing Turn 13 end anchor: {label}")
    s = s[:start] + new + s[end:]


replace("<title>Market Navigator · Turn 13</title>", "<title>Market Navigator · Turn 14</title>", "title")
replace("TURN 13 PRE-SHIP", "TURN 14 PRE-SHIP", "visible build")

# The active reference is white-keyed everywhere. The series retains its own
# color inside the white key, so reference and identity remain separate cues.
replace(
    ".lg.active{border-color:#6e91ad;background:#10253a}",
    ".lg.active{border-color:#fff;background:#10253a;box-shadow:0 0 0 1px #ffffff22}.seriesBar .chip.on{border-color:#fff!important;box-shadow:0 0 0 1px #ffffff22!important}",
    "white reference legend key",
)

replace(
    ".moreMenu .aiAction{color:var(--accent);font-weight:900;background:#0d2438}",
    ".moreMenu .aiAction{color:var(--accent);font-weight:900;background:#0d2438}.nowMoreMenu{position:absolute;right:10px;top:46px;z-index:30;width:190px;background:#081522;border:1px solid var(--line);border-radius:9px;box-shadow:0 18px 50px #000a;overflow:hidden}.nowMoreMenu button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;padding:11px 12px}.nowMoreMenu button:last-child{border-bottom:0}.nowMoreMenu .aiAction{color:var(--accent);font-weight:900;background:#0d2438}.settingsCard{width:min(700px,100%);height:auto;max-height:min(760px,100%);overflow:auto;padding:14px}.settingsHead{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line);padding-bottom:10px}.palettePresets{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0}.paletteGrid{display:grid;grid-template-columns:repeat(5,minmax(82px,1fr));gap:8px}.paletteSlot{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:6px;border:1px solid var(--line);border-radius:8px;padding:6px;background:#081522}.paletteSlot input[type=color]{width:34px;height:30px;border:0;padding:0;background:transparent}.paletteSlot span{font-size:9px;color:var(--muted)}.paletteStatus{min-height:20px;margin:8px 0;color:var(--muted);font-size:10px}.paletteStatus.bad{color:var(--bad)}.paletteStatus.good{color:var(--good)}",
    "NOW menu and chart settings styles",
)
replace(
    ".field{grid-template-columns:1fr}.library{--libw:100%;grid-template-columns:1fr}",
    ".field{grid-template-columns:1fr}.paletteGrid{grid-template-columns:repeat(2,minmax(96px,1fr))}.library{--libw:100%;grid-template-columns:1fr}",
    "phone palette layout",
)

# The gear owns chart settings; AI provider configuration remains reachable from
# the settings modal without overloading the chart-color contract.
replace(
    '<div class="foot"><button class="gear" data-view="config">⚙</button><span>CONFIG</span></div>',
    '<div class="foot"><button class="gear" id="settingsGear" aria-label="Chart settings">⚙</button><span>SETTINGS</span></div>',
    "settings gear",
)
replace(
    '<div class="grow"></div><div class="hzs" id="hzs"></div></div><div class="card chartCard">',
    '<div class="grow"></div><button class="btn" id="nowMoreBtn" aria-label="NOW actions">⋯</button><div class="hzs" id="hzs"></div></div><div class="card chartCard">',
    "V1 V2 more action",
)
replace(
    '<div id="info" class="card info hidden"></div></section><section class="view" id="view-explore">',
    '<div id="info" class="card info hidden"></div><div class="nowMoreMenu hidden" id="nowMoreMenu"><button class="aiAction" id="nowAnalyze">Analyze into Library</button><button id="nowDownload">Download visible analysis</button><button id="nowPrint">Print visible analysis</button></div></section><section class="view" id="view-explore">',
    "V1 V2 action menu",
)

settings_markup = '''<div class="modal hidden" id="settingsModal"><div class="modalCard settingsCard"><div class="settingsHead"><strong>Chart settings</strong><div class="grow"></div><button class="btn" id="settingsClose" aria-label="Close settings">×</button></div><h3>Series color scheme</h3><p class="rowMeta">Ten visually distinct slots. A series keeps its assigned slot when other series are removed.</p><div class="palettePresets" id="palettePresets"></div><div class="paletteGrid" id="paletteGrid"></div><div class="paletteStatus" id="paletteStatus"></div><div class="actions"><button class="btn" id="paletteImport">Import</button><button class="btn" id="paletteExport">Export</button><button class="btn" id="settingsConfig">AI configuration</button><button class="btn" id="paletteSave">Save scheme</button></div><input id="paletteImportInput" type="file" accept="application/json,.json" class="hidden"></div></div>'''
replace(
    '<div class="modal hidden" id="analysisModal">',
    settings_markup + '<div class="modal hidden" id="analysisModal">',
    "chart settings modal",
)

old_constants = "const H=['1D','5D','MTD','YTD','1YR','3YR','5YR'],IDX=['risk','growth','macro'],AB={risk:'RSK',growth:'GRW',macro:'MAC'},IC={risk:'#ef7373',growth:'#78b9ff',macro:'#edf4ff'},C=['#78b9ff','#f4c15d','#ef7373','#74d69b','#c399ff','#f59e8b','#68d6d3','#d5a6ff','#9fd56e','#ff9fd1'],K='marketNavigatorAnalysesV4',CK='marketNavigatorAIConfigV3';"
new_constants = "const H=['1D','5D','MTD','YTD','1YR','3YR','5YR'],IDX=['risk','growth','macro'],AB={risk:'RSK',growth:'GRW',macro:'MAC'},PALETTES={contrast:['#27D3F5','#FFD166','#48D597','#FF5A6F','#A78BFA','#FF9F1C','#4C78FF','#FF6EC7','#B8E43C','#AEB8C4'],colorblind:['#56B4E9','#E69F00','#009E73','#F0E442','#0072B2','#D55E00','#CC79A7','#9CA3AF','#44AA99','#AA4499'],bright:['#00E5FF','#FFE45E','#55EFC4','#FF3B5C','#B47CFF','#FF8A00','#4D96FF','#FF5FD2','#A8E10C','#BFC9D4']},PK='marketNavigatorChartPaletteV1',K='marketNavigatorAnalysesV4',CK='marketNavigatorAIConfigV3';"
replace(old_constants, new_constants, "palette constants")
replace(
    "pendingAttachments:[],deletedOpen:false,libraryActive:null,libraryChartSeq:0};",
    "pendingAttachments:[],deletedOpen:false,libraryActive:null,libraryChartSeq:0,nowChartState:null};",
    "NOW chart state",
)

palette_runtime = r'''let PALETTE_CACHE=null;function cleanAssignments(x){let out={};for(let[k,v]of Object.entries(x||{}))if(Number.isInteger(+v)&&+v>=0&&+v<10)out[k]=+v;return out}function paletteState(){if(PALETTE_CACHE)return PALETTE_CACHE;let base={schema:'market-navigator-series-palette-v1',name:'High contrast',colors:[...PALETTES.contrast],assignments:{risk:0,growth:1,macro:2}};try{let raw=JSON.parse(localStorage.getItem(PK)||'null');if(raw&&Array.isArray(raw.colors)&&raw.colors.length===10)base={...base,...raw,colors:raw.colors.map(x=>String(x).toUpperCase()),assignments:{...base.assignments,...cleanAssignments(raw.assignments)}}}catch{}PALETTE_CACHE=base;return base}function savePaletteState(v){PALETTE_CACHE={schema:'market-navigator-series-palette-v1',name:v.name||'Custom',colors:[...v.colors],assignments:cleanAssignments(v.assignments)};localStorage.setItem(PK,JSON.stringify(PALETTE_CACHE));return PALETTE_CACHE}function colorSlot(id){let p=paletteState(),slot=p.assignments[id];if(Number.isInteger(slot)&&slot>=0&&slot<10)return slot;let used=new Set(Object.values(p.assignments));slot=[0,1,2,3,4,5,6,7,8,9].find(x=>!used.has(x));if(slot===undefined){let hash=0;for(let ch of String(id))hash=(hash*31+ch.charCodeAt(0))>>>0;slot=hash%10}p.assignments[id]=slot;savePaletteState(p);return slot}function chartColors(ids){let p=paletteState(),used=new Map(),changed=false,out={};for(let id of ids){let slot=colorSlot(id);if(used.has(slot)&&used.get(slot)!==id){let free=[0,1,2,3,4,5,6,7,8,9].find(x=>!used.has(x));if(free!==undefined){slot=free;p.assignments[id]=slot;changed=true}}used.set(slot,id);out[id]=p.colors[slot]}if(changed)savePaletteState(p);return out}function seriesColor(id){let p=paletteState();return p.colors[colorSlot(id)]}function displayLabel(id){return IDX.includes(id)?AB[id]:label(id)}'''
replace(
    "const $=id=>document.getElementById(id),esc=s=>",
    "const $=id=>document.getElementById(id);" + palette_runtime + "const esc=s=>",
    "palette runtime",
)

# Canonical rendering supports columns for derived indices, lines for source
# series, and an explicit white reference outline for both geometries.
draw_engine = r'''function draw(which,sets,w,mode='indexed'){let ids=which==='now'?['nowChart','nowTip','nowWrap']:which==='analysis'?['analysisChart','analysisTip','analysisWrap']:['libChart','libChartTip','libChartWrap'],c=$(ids[0]),tip=$(ids[1]),wrap=$(ids[2]),active=which==='now'?S.nowActive:which==='analysis'?S.analysisActive:S.libraryActive;function setActive(id){active=id;if(which==='now')S.nowActive=id;else if(which==='analysis')S.analysisActive=id;else S.libraryActive=id}function syncActive(){let nodes=which==='now'?document.querySelectorAll('#legend [data-id]'):which==='analysis'?document.querySelectorAll('#seriesBar [data-id]'):document.querySelectorAll('#libChartLegend [data-lib-series]');nodes.forEach(n=>n.classList.toggle(which==='analysis'?'on':'active',(n.dataset.id||n.dataset.libSeries)===active))}let base;function axOf(z){return mode==='dual'?(z.axis||0):0}function isBar(z){return z.renderType==='bar'}function paint(){base=setCanvas(c);let{x,W,H}=base,dual=mode==='dual',p={l:W<430?48:58,r:dual?(W<430?48:58):12,t:22,b:34},pw=W-p.l-p.r,ph=H-p.t-p.b;x.clearRect(0,0,W,H);let times=sets.flatMap(z=>z.a.map(q=>q.t));if(!times.length){x.fillStyle='#91a8bb';x.font='10px system-ui';x.fillText('No real observations in this horizon.',p.l,p.t+15);return{p,pw,ph,scales:[],W,H}}let scales=[];for(let a=0;a<(dual?2:1);a++){let values=sets.filter(z=>axOf(z)===a).flatMap(z=>z.a.map(q=>q.v));if(mode==='indexed'&&sets.some(z=>axOf(z)===a&&isBar(z)))values.push(100);scales[a]=scale(values)}let ticks=W<430?(w.horizon==='1D'?2:3):5;x.font='10px system-ui';for(let i=0;i<ticks;i++){let xx=p.l+pw*i/(ticks-1),tt=w.start+(w.end-w.start)*i/(ticks-1);x.strokeStyle='#173047';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();x.fillStyle='#91a8bb';x.textAlign=i===0?'left':i===ticks-1?'right':'center';x.fillText(tick(tt,w.horizon),xx,H-10)}for(let a=0;a<(dual?2:1);a++){let[mn,mx]=scales[a],xx=a?p.l+pw:p.l,rep=sets.find(z=>axOf(z)===a);x.strokeStyle='#49657c';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();for(let i=0;i<5;i++){let yy=p.t+ph*i/4,v=mx-(mx-mn)*i/4;if(!a){x.strokeStyle='#173047';x.beginPath();x.moveTo(p.l,yy);x.lineTo(p.l+pw,yy);x.stroke()}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.textAlign=a?'right':'left';x.fillText(fmt(v),a?W-3:3,yy+3)}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.font='9px system-ui';x.textAlign=a?'right':'left';let u=mode==='indexed'?'Indexed 100':(rep?.axisLabel||rep?.unit||'');if(u)x.fillText(u,a?W-3:3,12)}let bars=sets.filter(z=>isBar(z)&&z.a.length),maxPoints=Math.max(1,...bars.map(z=>z.a.length)),groupW=Math.max(1.2,Math.min(11,pw/maxPoints*.82)),barW=Math.max(.75,groupW/Math.max(1,bars.length));function xy(z,q){let[mn,mx]=scales[axOf(z)];return{x:p.l+(q.t-w.start)/(w.end-w.start)*pw,y:p.t+(mx-q.v)/(mx-mn||1)*ph,mn,mx}}function plot(z,reference=false){if(!z.a.length)return;if(isBar(z)){let bi=Math.max(0,bars.indexOf(z)),offset=(bi-(bars.length-1)/2)*barW,[mn,mx]=scales[axOf(z)],baseValue=mode==='indexed'?100:mn,baseY=p.t+(mx-baseValue)/(mx-mn||1)*ph;x.fillStyle=z.color;x.globalAlpha=reference?1:.72;for(let q of z.a){let qxy=xy(z,q),left=qxy.x+offset-barW*.43,top=Math.min(qxy.y,baseY),height=Math.max(1,Math.abs(baseY-qxy.y));x.fillRect(left,top,Math.max(.75,barW*.86),height);if(reference){x.strokeStyle='#fff';x.lineWidth=1.5;x.strokeRect(left,top,Math.max(.75,barW*.86),height)}}x.globalAlpha=1}else{let trace=()=>{x.beginPath();z.a.forEach((q,i)=>{let qxy=xy(z,q);i?x.lineTo(qxy.x,qxy.y):x.moveTo(qxy.x,qxy.y)});x.stroke()};if(reference){x.strokeStyle='#fff';x.lineWidth=5;trace()}x.strokeStyle=z.color;x.lineWidth=reference?2.4:1.8;trace()}}let ref=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);sets.filter(z=>z!==ref).forEach(z=>plot(z,false));if(ref)plot(ref,true);c.dataset.referenceOutline=ref?.id||'';return{p,pw,ph,scales,W,H,xy}}let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);if(sel)setActive(sel.id);model=paint();syncActive();function inspect(e){if(!sel?.a.length)return;let r=wrap.getBoundingClientRect(),cx=(e.touches?.[0]?.clientX??e.clientX)-r.left,cy=(e.touches?.[0]?.clientY??e.clientY)-r.top,{p,pw,ph,scales,W}=model;if(cx<p.l||cx>p.l+pw||cy<p.t||cy>p.t+ph)return;let target=w.start+(cx-p.l)/pw*(w.end-w.start),cands=sets.filter(z=>z.a.length).map(z=>{let q=z.a.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a),[mn,mx]=scales[axOf(z)],xx=p.l+(q.t-w.start)/(w.end-w.start)*pw,yy=p.t+(mx-q.v)/(mx-mn||1)*ph;return{z,q,xx,yy,dist:Math.hypot(xx-cx,yy-cy)}}),near=cands.reduce((a,b)=>b.dist<a.dist?b:a);if(near.dist<24){sel=near.z;setActive(sel.id);syncActive()}let q=sel.a.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a),[mn,mx]=scales[axOf(sel)],xx=p.l+(q.t-w.start)/(w.end-w.start)*pw,yy=p.t+(mx-q.v)/(mx-mn||1)*ph;model=paint();let ctx=c.getContext('2d'),d=base.d;ctx.setTransform(d,0,0,d,0,0);ctx.strokeStyle='#8ea2bb';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,p.t);ctx.lineTo(xx,p.t+ph);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#fff';ctx.fillStyle=sel.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx,yy,5,0,Math.PI*2);ctx.fill();ctx.stroke();let iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v,valueLine=sel.unit==='Index'||!Number.isFinite(iv)?`idx ${fmt(q.v)}`:`idx ${fmt(iv)} · value ${fmt(nv)} ${esc(sel.unit||'')}`;tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;tip.style.display='block';tip.style.left=Math.min(W-180,Math.max(6,xx+8))+'px';tip.style.top=Math.max(6,yy-48)+'px'}c.onpointerdown=inspect;c.ontouchstart=e=>{e.preventDefault();inspect(e)};c.ontouchmove=e=>{e.preventDefault();inspect(e)}}'''
replace_range("function draw(which,sets,w,mode='indexed')", "function legend", draw_engine, "canonical column and reference renderer")
replace(
    "function legend(sets){$('legend').innerHTML=sets.map(s=>`<button class=\"lg ${s.id===S.nowActive?'active':''} ${s.a.length?'':'empty'}\" data-id=\"${s.id}\" title=\"${esc(s.full)}${s.a.length?'':' · unavailable for '+S.h}\" ${s.a.length?'':'disabled aria-disabled=\"true\"'}><span class=\"sw\" style=\"background:${s.color}\"></span>${esc(s.label)}</button>`).join('')}",
    "function legend(sets){$('legend').innerHTML=sets.map(z=>`<button class=\"lg ${z.id===S.nowActive?'active':''} ${z.a.length?'':'empty'}\" data-id=\"${z.id}\" data-render-type=\"${z.renderType||'line'}\" data-color-slot=\"${colorSlot(z.id)}\" title=\"${esc(z.full)}${z.a.length?'':' · unavailable for '+S.h}\" ${z.a.length?'':'disabled aria-disabled=\"true\"'}><span class=\"sw\" style=\"background:${z.color}\"></span>${esc(z.label)}</button>`).join('')}",
    "legend render metadata",
)

now_state = r'''function evidenceFor(id){if(IDX.includes(id))return{id,catalog:{id,short_name:AB[id],name:S.def.indices[id].name,native_unit:'Index',native_cadence:'derived'},health:{classification:'derived',actualLatestCanonicalObservation:S.derived.commonMarketAnchor}};return{id,catalog:cat(id),health:health(id)}}function chartSnapshotFromSets(state,sets,w,mode,origin='frozen'){return{schema:'market-navigator-chart-snapshot-v1',origin,capturedAt:new Date().toISOString(),horizon:state.horizon,window:{...w},mode,active:state.active||state.root||sets[0]?.id||null,paletteName:paletteState().name,series:sets.map(z=>({id:z.id,label:z.label,full:z.full,unit:z.unit,color:z.color,renderType:z.renderType||'line',measurementFamily:IDX.includes(z.id)?'derived-index:'+z.id:measurementFamily(z.id),axis:z.axis||0,axisLabel:z.axisLabel||z.unit,available:z.a.length>0,points:z.a.map(q=>({t:+q.t,v:+q.v,idx:Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),raw:Number.isFinite(+q.raw)?+q.raw:+q.v,sourceT:+(q.sourceT||q.t)}))})),dataRevision:{derived:S.derived.revision||S.derived.version||'',derivedGeneratedAt:S.derived.generatedAt||'',catalog:S.catalog.version||'',healthGeneratedAt:S.health.generatedAt||''}}}function captureNowState(sets,w,mode){let ids=sets.map(z=>z.id),state={lineage:`NOW-V${S.level}`,root:S.level===1?'risk':S.index,active:S.nowActive,series:ids,horizon:S.h,index:S.index||'risk',evidence:ids.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,sets,w,mode,'frozen-now');S.nowChartState=state;return state}function nowAnalysisState(){if(!S.nowChartState)throw Error('Visible NOW chart is not ready');return JSON.parse(JSON.stringify(S.nowChartState))}'''
replace(
    "function renderNow(){S.level===1?renderV1():renderV2()}",
    "function renderNow(){S.level===1?renderV1():renderV2()}" + now_state,
    "visible NOW snapshot",
)

render_v1 = r'''function renderV1(){S.level=1;S.index=null;S.nowActive=S.nowActive&&IDX.includes(S.nowActive)?S.nowActive:'risk';$('v1btn').classList.add('hidden');$('nowTitle').textContent='Market';renderCrumb();let w=windowFor(),colors=chartColors(IDX),sets=IDX.map(k=>{let x=S.derived.indices[k].horizons[S.h];return{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'bar',a:(x.curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}))}});legend(sets);$('legend').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>openV2(b.dataset.id));$('range').textContent=`${w.startLabel} → ${w.endLabel}`;$('nowMeta').innerHTML='<span>Common horizon</span><span>Indexed 100 · columns</span>';captureNowState(sets,w,'indexed');draw('now',sets,w,'indexed')}'''
replace_range("function renderV1()", "async function openV2", render_v1, "V1 index columns")

render_v2 = r'''async function renderV2(){let k=S.index,w=windowFor(S.h,k),defs=S.def.indices[k].components,omitted=new Set((hrec(k).omitted||[]).map(x=>x.id)),ids=[k,...defs.map(x=>x.id)],colors=chartColors(ids),sets=[{id:k,label:AB[k],full:S.def.indices[k].name,unit:'Index',color:colors[k],renderType:'bar',a:(hrec(k).curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}))}];for(let c of defs){try{let src=await getSeries(c.id),a=omitted.has(c.id)?[]:indexed(src,w,c.direction);sets.push({id:c.id,label:label(c.id),full:name(c.id),unit:unit(c.id),color:colors[c.id],renderType:'line',a})}catch{sets.push({id:c.id,label:label(c.id),full:name(c.id),unit:unit(c.id),color:colors[c.id],renderType:'line',a:[]})}}$('v1btn').classList.remove('hidden');$('v1btn').onclick=()=>{S.level=1;S.index=null;$('info').classList.add('hidden');renderV1()};$('nowTitle').textContent=AB[k];renderCrumb();$('range').textContent=`${w.startLabel} → ${w.endLabel}`;legend(sets);$('legend').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(b.disabled)return;let id=b.dataset.id;if(id===k){S.nowActive=id;$('nowTip').style.display='none';renderV2()}else{S.nowActive=id;S.priorV2.component=id;$('nowTip').style.display='none';componentCard(id);renderV2()}});$('nowMeta').innerHTML='<span>Common horizon</span><span>Index column · components direction-indexed lines</span>';captureNowState(sets,w,'indexed');draw('now',sets,w,'indexed')}'''
replace_range("async function renderV2()", "async function componentCard", render_v2, "V2 index column and component lines")

# Stable colors are resolved by series identity, not array position. V3 remains
# limited to the ten configured unique chart-color slots.
render_analysis = r'''async function renderAnalysis(){makeHz($('analysisHz'),h=>{S.h=h;$('analysisTip').style.display='none';renderAnalysis();wireNowHz()});let w=windowFor(),colors=chartColors(S.analysisSeries),loaded=[];for(let id of S.analysisSeries){try{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:IDX.includes(id)?'bar':'line',s:await getSeries(id)})}catch{}}let plan=axisPlan(loaded.map(x=>x.id)),mode=plan.mode,sets=loaded.map(z=>({id:z.id,label:z.label,full:z.full,unit:z.unit,color:z.color,renderType:z.renderType,axis:plan.map[z.id]||0,axisLabel:unitKind(z.id)==='percent'?'Percent':unitKind(z.id)==='money'?'$ / USD':z.unit,a:mode==='indexed'?indexed(z.s,w,1):nativeIndexed(z.s,w)})),reps=plan.kinds.map(k=>loaded.find(z=>measurementFamily(z.id)===k)).filter(Boolean),fresh=loaded.map(z=>freshnessNote(z.id,z.s)).filter(Boolean);$('analysisTitle').textContent=`Analysis · ${displayLabel(S.analysisRoot)}`;$('axisBadge').textContent=mode==='dual'?`Y1 ${reps[0]?unitGlyph(reps[0].id):''} · Y2 ${reps[1]?unitGlyph(reps[1].id):''}`:mode==='indexed'?'Indexed 100':'Native Y1';$('analysisMeta').innerHTML=`<span>${w.startLabel} → ${w.endLabel}</span><span>${mode==='dual'?'dual native axes':mode==='indexed'?'Indexed 100':'native Y1'}</span>${fresh.length?`<span class="freshNote">${fresh.map(esc).join(' · ')}</span>`:''}`;$('seriesBar').innerHTML=loaded.map(z=>`<button class="chip ${z.id===S.analysisActive?'on':''}" data-id="${z.id}" data-color-slot="${colorSlot(z.id)}" style="border-color:${z.color};box-shadow:inset 3px 0 ${z.color}"><span class="seriesLegend"><span class="sw" style="background:${z.color}"></span>${esc(z.label)}<span class="seriesX" data-rm="${z.id}">×</span></span></button>`).join('')+`<button class="btn" id="addSeries" ${loaded.length>=10?'disabled aria-disabled="true" title="Ten-series chart limit"':''}>Add</button><div class="grow"></div><button class="btn" id="moreBtn" aria-label="More actions">⋯</button>`;$('seriesBar').querySelectorAll('[data-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-rm]'))return;S.analysisActive=b.dataset.id;$('analysisTip').style.display='none';renderAnalysis()});$('seriesBar').querySelectorAll('[data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();if(S.analysisSeries.length<=1)return;let id=x.dataset.rm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisRoot===id)S.analysisRoot=S.analysisSeries[0];if(S.analysisActive===id)S.analysisActive=S.analysisRoot;renderAnalysis()});$('addSeries').onclick=()=>{if(S.analysisSeries.length>=10)return;renderPicker();$('seriesPicker').classList.remove('hidden')};$('moreBtn').onclick=()=>$('moreMenu').classList.toggle('hidden');$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreStats').onclick=()=>{$('moreMenu').classList.add('hidden');renderStats(loaded)};$('morePrint').onclick=()=>{$('moreMenu').classList.add('hidden');window.print()};$('moreDownload').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState()};$('analysisEvidence').innerHTML=loaded.map(z=>{let c=cat(z.id),h=health(z.id);return`<div class="row"><strong>${esc(z.label)} · ${esc(z.full)}</strong><span class="rowMeta">${esc(c.provider||'')} · ${esc(z.unit||'—')} · ${esc(h.classification||'unknown')}</span>${c.source_reference_url?`<br><a href="${esc(c.source_reference_url)}" target="_blank" rel="noopener">Source</a>`:''}</div>`}).join('');draw('analysis',sets,w,mode)}'''
replace_range("async function renderAnalysis()", "$('closeAnalysis').onclick", render_analysis, "stable V3 colors")

replace(
    "if(b.disabled)return;let id=b.dataset.add;S.analysisSeries.push(id);",
    "if(b.disabled||S.analysisSeries.length>=10)return;let id=b.dataset.add;S.analysisSeries.push(id);",
    "ten series maximum",
)

# V1 and V2 actions consume the exact visible snapshot. They never recreate a
# different chart in the Library.
now_actions = r'''$('nowMoreBtn').onclick=()=>$('nowMoreMenu').classList.toggle('hidden');$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowDownload').onclick=()=>{$('nowMoreMenu').classList.add('hidden');let state=nowAnalysisState();downloadBlob(`market-navigator-${state.lineage.toLowerCase()}-${state.horizon}.json`,'application/json',JSON.stringify(state,null,2))};$('nowPrint').onclick=()=>{$('nowMoreMenu').classList.add('hidden');window.print()};'''
replace(
    "function governed(){let o={};",
    now_actions + "function governed(){let o={};",
    "V1 V2 action wiring",
)

replace(
    "for(let i=0;i<ids.length;i++){let id=ids[i];try{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:C[i%C.length],s:await getSeries(id)})}catch{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:C[i%C.length],s:{observations:[]}})}}",
    "let colors=chartColors(ids);for(let id of ids){try{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:colors[id],renderType:IDX.includes(id)?'bar':'line',s:await getSeries(id)})}catch{loaded.push({id,label:displayLabel(id),full:IDX.includes(id)?S.def.indices[id]?.name:name(id),unit:IDX.includes(id)?'Index':unit(id),color:colors[id],renderType:IDX.includes(id)?'bar':'line',s:{observations:[]}})}}",
    "stable saved chart colors",
)
replace(
    "unit:z.unit,color:z.color,measurementFamily:measurementFamily(z.id),axis:",
    "unit:z.unit,color:z.color,renderType:z.renderType||'line',measurementFamily:measurementFamily(z.id),axis:",
    "saved render type",
)

replace(
    "async function analysisState(){let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(id=>({id,catalog:cat(id),health:health(id)}))};state.chart=await chartSnapshotFrom(state,'frozen');return state}",
    "async function analysisState(){let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(evidenceFor)};state.chart=await chartSnapshotFrom(state,'frozen');return state}",
    "analysis evidence helper",
)

start_ai = r'''async function startAI(stateOverride=null){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{};if(!c.verified||!c.key||!c.model){$('settingsModal').classList.add('hidden');nav('config');setPStatus(p,'Register this provider before starting an Analysis',false);return}let state=stateOverride||await analysisState(),rootLabel=displayLabel(state.root||state.series?.[0]||'Analysis'),a={id:'a-'+Date.now(),title:`${rootLabel} · ${state.horizon}`,titleManual:false,status:'processing',createdAt:now,updatedAt:now,state,provider:p,model:c.model||'',turns:[{role:'assistant',content:'Processing…',at:now,processing:true}]};a=await persistAnalysis(a);let analysisId=a.id;S.activeAnalysis=analysisId;$('analysisModal').classList.add('hidden');$('libraryWorkspace').classList.add('detailOpen');nav('library');renderLibrary();try{let out=await callAI([{role:'system',content:`You are Market Navigator, an evidence-first market research analyst. Canonical chart evidence is authoritative for the supplied series. Use current web research only to explain context or developments and cite every external claim with a working Markdown link. Produce a substantive analysis, never an empty response. Begin with one specific H1 Markdown title, then separate: Market read, What changed, Evidence quality/limitations, Current context, What to watch next. Evidence: ${JSON.stringify(aiEvidenceState(state))}`},{role:'user',content:'Analyze this exact chart state and evidence. Explain the important cross-series relationships, limitations caused by cadence/freshness, current context, and what would change the interpretation.'}],{web:true});let saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:out,at:new Date().toISOString()});if(!saved.titleManual)saved.title=generatedAnalysisTitle(out,saved.title);saved.status='ready';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}catch(e){let saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:`**Analysis failed:** ${e.message}`,at:new Date().toISOString()});saved.status='failed';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}}'''
replace_range("async function startAI()", "function activeAnalyses", start_ai, "generic saved-chart Analysis")

replace(
    "let sets=(chart.series||[]).map(z=>({...z,a:(z.points||[]).map(p=>({...p}))})),w=",
    "let sets=(chart.series||[]).map(z=>({...z,renderType:z.renderType||(IDX.includes(z.id)?'bar':'line'),a:(z.points||[]).map(p=>({...p}))})),w=",
    "Library chart geometry",
)
replace(
    "data-lib-series=\"${z.id}\" ${z.a.length?'':'disabled",
    "data-lib-series=\"${z.id}\" data-render-type=\"${z.renderType||'line'}\" ${z.a.length?'':'disabled",
    "Library render metadata",
)

replace(
    "function downloadAnalysisState(){let blob=new Blob([JSON.stringify({root:S.analysisRoot,series:S.analysisSeries,horizon:S.h,lineage:S.lineage},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='market-navigator-analysis.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}",
    "async function downloadAnalysisState(){let state=await analysisState();downloadBlob('market-navigator-analysis.json','application/json',JSON.stringify(state,null,2))}",
    "exact V3 download",
)

settings_runtime = r'''function validPalette(colors){if(!Array.isArray(colors)||colors.length!==10)throw Error('A scheme requires exactly 10 colors');let out=colors.map(x=>String(x).trim().toUpperCase());if(out.some(x=>!/^#[0-9A-F]{6}$/.test(x)))throw Error('Every slot requires a six-digit hex color');if(new Set(out).size!==10)throw Error('Every series color must be unique');if(out.some(x=>x==='#FFFFFF'))throw Error('White is reserved for the active reference outline');return out}function renderPaletteSettings(){let p=paletteState();$('palettePresets').innerHTML=Object.entries(PALETTES).map(([id,colors])=>`<button class="btn" data-palette="${id}" data-colors="${colors.join(',')}">${id==='contrast'?'High contrast':id==='colorblind'?'Colorblind':'Bright'}</button>`).join('');$('paletteGrid').innerHTML=p.colors.map((color,i)=>`<label class="paletteSlot"><input type="color" data-palette-slot="${i}" value="${color}"><span>Series ${i+1}</span></label>`).join('');$('paletteStatus').textContent=`${p.name} · saved`;document.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{let colors=b.dataset.colors.split(',');document.querySelectorAll('[data-palette-slot]').forEach((input,i)=>input.value=colors[i]);$('paletteStatus').textContent=`${b.textContent} selected · save to apply`;$('paletteStatus').dataset.name=b.textContent});document.querySelectorAll('[data-palette-slot]').forEach(input=>input.oninput=()=>{$('paletteStatus').textContent='Custom changes · save to apply';$('paletteStatus').dataset.name='Custom'})}function repaintCharts(){if(S.view==='now')renderNow();if(!$('analysisModal').classList.contains('hidden'))renderAnalysis();if(S.view==='library'){let a=currentAnalysis();if(a)renderLibraryChart(a)}}function savePaletteUI(){try{let colors=validPalette([...document.querySelectorAll('[data-palette-slot]')].map(x=>x.value)),old=paletteState(),name=$('paletteStatus').dataset.name||'Custom';savePaletteState({...old,name,colors});$('paletteStatus').className='paletteStatus good';$('paletteStatus').textContent=`${name} · saved`;repaintCharts()}catch(e){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=e.message}}$('settingsGear').onclick=()=>{renderPaletteSettings();$('settingsModal').classList.remove('hidden')};$('settingsClose').onclick=()=>$('settingsModal').classList.add('hidden');$('paletteSave').onclick=savePaletteUI;$('settingsConfig').onclick=()=>{$('settingsModal').classList.add('hidden');nav('config')};$('paletteExport').onclick=()=>downloadBlob('market-navigator-series-colors.json','application/json',JSON.stringify(paletteState(),null,2));$('paletteImport').onclick=()=>$('paletteImportInput').click();$('paletteImportInput').onchange=async e=>{let file=e.target.files?.[0];e.target.value='';if(!file)return;try{let raw=JSON.parse(await file.text()),colors=validPalette(raw.colors),state=savePaletteState({schema:'market-navigator-series-palette-v1',name:raw.name||'Imported',colors,assignments:{...paletteState().assignments,...cleanAssignments(raw.assignments)}});renderPaletteSettings();$('paletteStatus').className='paletteStatus good';$('paletteStatus').textContent=`${state.name} · imported and saved`;repaintCharts()}catch(err){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=`Import failed: ${err.message}`}};'''
replace(
    "function renderHealth(){let vals=",
    settings_runtime + "function renderHealth(){let vals=",
    "chart settings behavior",
)

required = [
    "TURN 14 PRE-SHIP",
    "market-navigator-chart-snapshot-v1",
    "renderType:'bar'",
    "strokeStyle='#fff'",
    "dataset.referenceOutline",
    "marketNavigatorChartPaletteV1",
    "id=\"settingsModal\"",
    "data-palette-slot",
    "Analyze into Library",
    "Download visible analysis",
    "function chartSnapshotFromSets",
    "function measurementFamily",
    "idx ${fmt(iv)} · value ${fmt(nv)}",
    "async function persistAnalysis",
    "generatedAnalysisTitle",
    "commitLibraryTitle",
    "Attach image or spreadsheet",
]
for item in required:
    if item not in s:
        raise SystemExit(f"missing Turn 14 requirement: {item}")

for forbidden in [
    "TURN 13 PRE-SHIP",
    "color:C[i%C.length]",
    "color:IC[k]",
    "grid-template-columns:minmax(0,1fr) 280px",
    '<div class="card evidence" id="analysisEvidence"></div>',
    ".info{position:absolute;right:12px;top:56px",
]:
    if forbidden in s:
        raise SystemExit(f"Turn 14 forbidden residue: {forbidden}")

DST.write_text(s)
print(DST)
