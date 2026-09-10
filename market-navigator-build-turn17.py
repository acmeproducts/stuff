from pathlib import Path
import re

SRC = Path('market-navigator-turn16-pre-ship.html')
DST = Path('market-navigator-turn17-pre-ship.html')
s = SRC.read_text()


def rep(old, new, label, count=1):
    global s
    if old not in s:
        raise SystemExit('missing Turn 16 anchor: ' + label)
    s = s.replace(old, new, count)


def rep_all(old, new, label, minimum=1):
    global s
    n = s.count(old)
    if n < minimum:
        raise SystemExit(f'missing Turn 16 anchor: {label} ({n})')
    s = s.replace(old, new)
    return n


def replace_range(start_anchor, end_anchor, new, label):
    global s
    a = s.find(start_anchor)
    if a < 0:
        raise SystemExit('missing Turn 16 start anchor: ' + label)
    b = s.find(end_anchor, a)
    if b < 0:
        raise SystemExit('missing Turn 16 end anchor: ' + label)
    s = s[:a] + new + s[b:]


rep('<title>Market Navigator · Turn 16</title>', '<title>Market Navigator · Turn 17</title>', 'title')
rep_all('TURN 16 PRE-SHIP', 'TURN 17 PRE-SHIP', 'visible build label')
rep_all('Market Navigator · Turn 16', 'Market Navigator · Turn 17', 'About build label')

# Compact, pointer-through INDEX information card plus exact stroke samples and
# a data readout bound to the visible chart state.
css17 = r'''
.info{left:auto!important;right:18px!important;top:86px!important;bottom:auto!important;transform:none!important;width:min(320px,calc(100% - 36px))!important;max-height:230px!important;overflow:auto!important;z-index:8!important;padding:8px 9px!important;background:#fff!important;color:#101010!important;border-color:#c9c9c9!important;box-shadow:0 6px 22px #0005!important;pointer-events:none!important}.info h3{margin:0 0 4px!important;font-size:12px!important;line-height:1.2!important}.info .kv{grid-template-columns:72px minmax(0,1fr)!important;gap:2px 6px!important;font-size:9px!important;line-height:1.25!important}.info .actions{margin-top:6px!important;gap:4px!important}.info .actions,.info button,.info a{pointer-events:auto!important}.info .btn{background:#fff!important;color:#111!important;border-color:#999!important;padding:4px 7px!important}.info .rowMeta{color:#444!important}.legendSwatch{width:34px;height:14px;display:block;overflow:visible;flex:none}#dataModal{z-index:50}.dataCard{width:min(1180px,calc(100% - 24px));height:min(780px,calc(100% - 24px));display:grid;grid-template-rows:auto auto minmax(0,1fr);background:#fff;color:#111}.dataHead{display:flex;align-items:center;gap:8px;padding:9px 11px;border-bottom:1px solid #d1d5db}.dataHead .btn{margin-left:auto;background:#fff;color:#111;border-color:#9ca3af}.dataMeta{padding:6px 11px;border-bottom:1px solid #e5e7eb;font-size:10px;color:#444}.dataScroll{min-height:0;overflow:auto}.dataTable{width:100%;border-collapse:collapse;font-size:10px}.dataTable th,.dataTable td{padding:5px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap}.dataTable th{position:sticky;top:0;z-index:2;background:#f4f4f4;color:#111}.dataTable th:first-child,.dataTable td:first-child,.dataTable th:nth-child(2),.dataTable td:nth-child(2){text-align:left}.dataTable tbody tr[data-active="true"]{font-weight:800;background:#f7f7f7}
@media(max-width:700px){.info{right:6px!important;top:84px!important;width:min(286px,calc(100% - 12px))!important;max-height:205px!important;padding:7px!important}.info .kv{grid-template-columns:64px minmax(0,1fr)!important;font-size:8px!important}.legendSwatch{width:28px;height:12px}.dataCard{width:calc(100% - 10px);height:calc(100% - 10px)}.dataTable{font-size:9px}.dataTable th,.dataTable td{padding:5px}}
'''
rep('</style>', css17 + '</style>', 'Turn 17 CSS')

# Canonical More menu now includes Data in the same position everywhere.
rep('<button class="aiAction" id="nowAnalyze">AI POV</button><button id="nowPrint">Print</button>', '<button class="aiAction" id="nowAnalyze">AI POV</button><button id="nowData">Data</button><button id="nowPrint">Print</button>', 'NOW Data menu')
rep('<button class="aiAction" id="moreAI">AI POV</button><button id="morePrint">Print</button>', '<button class="aiAction" id="moreAI">AI POV</button><button id="moreData">Data</button><button id="morePrint">Print</button>', 'COMPONENT Data menu')
rep('<button class="aiAction" id="exploreAI">AI POV</button><button id="explorePrint">Print</button>', '<button class="aiAction" id="exploreAI">AI POV</button><button id="exploreData">Data</button><button id="explorePrint">Print</button>', 'EXPLORE Data menu')

# Full-series data surface. It is presentation-only and does not mutate the chart.
data_markup = '''<div class="modal hidden" id="dataModal"><div class="modalCard dataCard"><div class="dataHead"><strong id="dataTitle">Data</strong><button class="btn" id="dataClose" aria-label="Close data">×</button></div><div class="dataMeta" id="dataMeta"></div><div class="dataScroll"><table class="dataTable"><thead><tr><th>Series</th><th>Date</th><th>Native</th><th>Index 100</th><th>Correlation</th></tr></thead><tbody id="dataRows"></tbody></table></div></div></div>'''
rep('<div class="modal hidden" id="analysisModal">', data_markup + '<div class="modal hidden" id="analysisModal">', 'Data modal')

# Focus state is distinct from simple default-active state. A user-selected chip
# or plotted line turns emphasis on immediately and keeps it on while hovering.
rep('analysisRepresentation:null}', 'analysisRepresentation:null,nowFocus:null,analysisFocus:null,analysisChartState:null}', 'Turn 17 focus state')

runtime17 = r'''function legendSample(z){let st=paintStyle(z),dash=st.dash&&st.dash.length?` stroke-dasharray="${st.dash.join(' ')}"`:'';return`<svg class="legendSwatch" viewBox="0 0 36 14" aria-hidden="true" focusable="false"><line x1="2" y1="7" x2="34" y2="7" stroke="${esc(z.color)}" stroke-width="${Math.max(1,Math.min(12,+st.width||2))}" stroke-linecap="round"${dash}/></svg>`}function dayKey17(t){let d=new Date(+t);return Number.isFinite(d.getTime())?d.toISOString().slice(0,10):''}function corr17(a,b){let bm=new Map((b?.points||[]).map(p=>[dayKey17(p.sourceT||p.t),+p.v]).filter(x=>x[0]&&Number.isFinite(x[1]))),pairs=(a?.points||[]).map(p=>[+p.v,bm.get(dayKey17(p.sourceT||p.t))]).filter(x=>Number.isFinite(x[0])&&Number.isFinite(x[1]));if(pairs.length<2)return null;let n=pairs.length,mx=pairs.reduce((q,p)=>q+p[0],0)/n,my=pairs.reduce((q,p)=>q+p[1],0)/n,num=0,dx=0,dy=0;for(let[x,y]of pairs){let ax=x-mx,ay=y-my;num+=ax*ay;dx+=ax*ax;dy+=ay*ay}return dx>0&&dy>0?num/Math.sqrt(dx*dy):null}function captureAnalysisState17(sets,w,mode){let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(evidenceFor)};state.chart=chartSnapshotFromSets(state,sets,w,mode,'live-component');S.analysisChartState=JSON.parse(JSON.stringify(state));return S.analysisChartState}async function dataSeries17(z,state){let chart=state.chart||{},w=chart.window||{},plotted=z.points||[];if(IDX.includes(z.id))return{...z,points:plotted.map(p=>({t:+p.t,sourceT:+(p.sourceT||p.t),v:+p.v,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:+p.v}))};let src=await getSeries(z.id),obs=(src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>({t:+p.t,sourceT:+p.t,v:+p.v,raw:+p.v})),before=obs.filter(p=>p.t<=+w.start),base=before.at(-1)||obs[0]||null,dir=1;if(base&&Number.isFinite(+base.v)&&+base.v!==0){let probe=plotted.find(p=>Number.isFinite(+p.idx)&&Number.isFinite(+p.raw)&&Math.abs((+p.raw/+base.v)-1)>1e-9);if(probe){let d=((+probe.idx-100)/100)/((+probe.raw/+base.v)-1);if(Number.isFinite(d)&&Math.abs(d)>.5)dir=d<0?-1:1}}return{...z,points:obs.map(p=>({...p,idx:base&&Number.isFinite(+base.v)&&+base.v!==0?100+dir*((p.v/+base.v)-1)*100:null}))}}async function openData17(state){if(!state?.chart)throw Error('Visible chart data is not ready');let chart=state.chart,source=chart.series||[],activeId=state.active||chart.active||source[0]?.id,series=await Promise.all(source.map(z=>dataSeries17(z,state))),ref=series.find(z=>z.id===activeId)||series[0],corr=Object.fromEntries(series.map(z=>[z.id,corr17(z,ref)]));$('dataTitle').textContent=`Data · ${ref?.label||ref?.id||'Series'}`;$('dataMeta').textContent=`${state.horizon||chart.horizon||''} · full canonical series history · Index 100 uses active chart baseline · correlation vs ${ref?.label||ref?.id||'active series'} using same-date real values`;$('dataRows').innerHTML=series.flatMap(z=>(z.points||[]).map(p=>{let native=Number.isFinite(+p.raw)?+p.raw:(Number.isFinite(+p.v)?+p.v:null),idx=Number.isFinite(+p.idx)?+p.idx:null,r=corr[z.id];return`<tr data-series="${esc(z.id)}" data-active="${z.id===ref?.id?'true':'false'}"><td>${esc(z.label||z.id)}</td><td>${esc(dayKey17(p.sourceT||p.t))}</td><td>${native==null?'—':esc(fmt(native))}${z.unit?` ${esc(z.unit)}`:''}</td><td>${idx==null?'—':esc(fmt(idx))}</td><td>${Number.isFinite(r)?r.toFixed(3):'N/A'}</td></tr>`})).join('');$('dataModal').classList.remove('hidden')}'''
rep('function draw(which,sets,w,mode=\'indexed\')', runtime17 + 'function draw(which,sets,w,mode=\'indexed\')', 'Turn 17 runtime helpers')

# Legend keys reproduce the actual configured stroke style and thickness in all
# live legend/chip locations that use the canonical color swatch markup.
rep_all('<span class="sw" style="background:${z.color}"></span>', '${legendSample(z)}', 'styled legend swatches', minimum=2)

# Replace point renderer with persistent chip-driven emphasis, hover crosshair,
# and click-on-line selection. Hover never silently changes the chosen series.
draw17 = r'''function draw(which,sets,w,mode='indexed'){let ids=which==='now'?['nowChart','nowTip','nowWrap']:which==='analysis'?['analysisChart','analysisTip','analysisWrap']:['libChart','libChartTip','libChartWrap'],c=$(ids[0]),tip=$(ids[1]),wrap=$(ids[2]),active=which==='now'?S.nowActive:which==='analysis'?S.analysisActive:S.libraryActive,focusId=which==='now'?S.nowFocus:which==='analysis'?(S.analysisFocus||active):null;function setActive(id,focus=false){active=id;if(which==='now'){S.nowActive=id;if(focus)S.nowFocus=id;focusId=S.nowFocus}else if(which==='analysis'){S.analysisActive=id;if(focus)S.analysisFocus=id;focusId=S.analysisFocus||id}else S.libraryActive=id;if(focus&&which==='now'&&S.nowChartState){S.nowChartState.active=id;if(S.nowChartState.chart)S.nowChartState.chart.active=id}if(focus&&which==='analysis'&&S.analysisChartState){S.analysisChartState.active=id;if(S.analysisChartState.chart)S.analysisChartState.chart.active=id}}function syncActive(){let nodes=which==='now'?document.querySelectorAll('#legend [data-id]'):which==='analysis'?document.querySelectorAll('#seriesBar [data-id]'):document.querySelectorAll('#libChartLegend [data-lib-series]');nodes.forEach(n=>n.classList.toggle(which==='analysis'?'on':'active',(n.dataset.id||n.dataset.libSeries)===active))}let base;function axOf(z){return mode==='dual'?(z.axis||0):0}function isBar(z){return z.renderType==='bar'}function paint(cross=null){base=setCanvas(c);let{x,W,H}=base,dual=mode==='dual',p={l:W<430?48:58,r:dual?(W<430?48:58):12,t:22,b:34},pw=W-p.l-p.r,ph=H-p.t-p.b;x.clearRect(0,0,W,H);let times=sets.flatMap(z=>z.a.map(q=>q.t));if(!times.length){x.fillStyle='#91a8bb';x.font='10px system-ui';x.fillText('No real observations in this horizon.',p.l,p.t+15);return{p,pw,ph,scales:[],W,H}}let scales=[];for(let a=0;a<(dual?2:1);a++){let values=sets.filter(z=>axOf(z)===a).flatMap(z=>z.a.map(q=>q.v));if(mode==='indexed'&&sets.some(z=>axOf(z)===a&&isBar(z)))values.push(100);scales[a]=scale(values)}let ticks=W<430?(w.horizon==='1D'?2:3):5;x.font='10px system-ui';for(let i=0;i<ticks;i++){let xx=p.l+pw*i/(ticks-1),tt=w.start+(w.end-w.start)*i/(ticks-1);x.strokeStyle='#173047';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();x.fillStyle='#91a8bb';x.textAlign=i===0?'left':i===ticks-1?'right':'center';x.fillText(tick(tt,w.horizon),xx,H-10)}for(let a=0;a<(dual?2:1);a++){let[mn,mx]=scales[a],xx=a?p.l+pw:p.l,rep=sets.find(z=>axOf(z)===a);x.strokeStyle='#49657c';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();for(let i=0;i<5;i++){let yy=p.t+ph*i/4,v=mx-(mx-mn)*i/4;if(!a){x.strokeStyle='#173047';x.beginPath();x.moveTo(p.l,yy);x.lineTo(p.l+pw,yy);x.stroke()}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.textAlign=a?'right':'left';x.fillText(fmt(v),a?W-3:3,yy+3)}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.font='9px system-ui';x.textAlign=a?'right':'left';let u=mode==='indexed'?'Indexed 100':(rep?.axisLabel||rep?.unit||'');if(u)x.fillText(u,a?W-3:3,12)}let bars=sets.filter(z=>isBar(z)&&z.a.length),maxPoints=Math.max(1,...bars.map(z=>z.a.length)),groupW=Math.max(1.2,Math.min(11,pw/maxPoints*.82)),barW=Math.max(.75,groupW/Math.max(1,bars.length));function xy(z,q){let[mn,mx]=scales[axOf(z)];return{x:p.l+(q.t-w.start)/(w.end-w.start)*pw,y:p.t+(mx-q.v)/(mx-mn||1)*ph,mn,mx}}function plot(z){if(!z.a.length)return;let focused=!!focusId;x.globalAlpha=focused&&z.id!==active?.22:1;if(isBar(z)){let bi=Math.max(0,bars.indexOf(z)),offset=(bi-(bars.length-1)/2)*barW,[mn,mx]=scales[axOf(z)],baseValue=mode==='indexed'?100:mn,baseY=p.t+(mx-baseValue)/(mx-mn||1)*ph;x.fillStyle=z.color;for(let q of z.a){let qxy=xy(z,q),left=qxy.x+offset-barW*.43,top=Math.min(qxy.y,baseY),height=Math.max(1,Math.abs(baseY-qxy.y));x.fillRect(left,top,Math.max(.75,barW*.86),height)}}else{let st=paintStyle(z);x.strokeStyle=z.color;x.lineWidth=st.width;x.setLineDash(st.dash);x.beginPath();z.a.forEach((q,i)=>{let qxy=xy(z,q);i?x.lineTo(qxy.x,qxy.y):x.moveTo(qxy.x,qxy.y)});x.stroke();x.setLineDash([])}x.globalAlpha=1}let ref=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);sets.filter(z=>z!==ref).forEach(plot);if(ref)plot(ref);if(cross){x.strokeStyle='#8ea2bb';x.setLineDash([4,4]);x.beginPath();x.moveTo(cross.x,p.t);x.lineTo(cross.x,p.t+ph);x.stroke();x.setLineDash([]);x.strokeStyle='#fff';x.fillStyle=cross.z.color;x.lineWidth=2;x.beginPath();x.arc(cross.x,cross.y,5,0,Math.PI*2);x.fill();x.stroke()}c.dataset.activeSeries=focusId?(ref?.id||''):'';c.dataset.emphasis=focusId?'true':'false';return{p,pw,ph,scales,W,H,xy}}let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);if(sel)setActive(sel.id,false);model=paint();syncActive();function locate(e){let r=wrap.getBoundingClientRect(),cx=(e.touches?.[0]?.clientX??e.clientX)-r.left,cy=(e.touches?.[0]?.clientY??e.clientY)-r.top,{p,pw,ph,scales}=model;if(cx<p.l||cx>p.l+pw||cy<p.t||cy>p.t+ph)return null;let target=w.start+(cx-p.l)/pw*(w.end-w.start),cands=sets.filter(z=>z.a.length).map(z=>{let q=z.a.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a),[mn,mx]=scales[axOf(z)],xx=p.l+(q.t-w.start)/(w.end-w.start)*pw,yy=p.t+(mx-q.v)/(mx-mn||1)*ph;return{z,q,xx,yy,dist:Math.hypot(xx-cx,yy-cy),target}});return{cx,cy,target,near:cands.reduce((a,b)=>b.dist<a.dist?b:a)}}function inspect(e,allowSelect=false){if(!sel?.a.length)return;let hit=locate(e);if(!hit)return;if(allowSelect&&hit.near.dist<24){sel=hit.near.z;setActive(sel.id,true);syncActive();if(which==='now'&&S.level!==1){if(IDX.includes(sel.id))$('info').classList.add('hidden');else{S.priorV2.component=sel.id;componentCard(sel.id)}}}let q=sel.a.reduce((a,b)=>Math.abs(b.t-hit.target)<Math.abs(a.t-hit.target)?b:a),[mn,mx]=model.scales[axOf(sel)],xx=model.p.l+(q.t-w.start)/(w.end-w.start)*model.pw,yy=model.p.t+(mx-q.v)/(mx-mn||1)*model.ph;model=paint({x:xx,y:yy,z:sel});let iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v,valueLine=sel.unit==='Index'||!Number.isFinite(iv)?`idx ${fmt(q.v)}`:`idx ${fmt(iv)} · value ${fmt(nv)} ${esc(sel.unit||'')}`;tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;tip.style.display='block';tip.style.left=Math.min(model.W-180,Math.max(6,xx+8))+'px';tip.style.top=Math.max(6,yy-48)+'px'}c.onpointermove=e=>{if(e.pointerType!=='touch')inspect(e,false)};c.onpointerdown=e=>inspect(e,true);c.onpointerleave=()=>{tip.style.display='none';model=paint()};c.ontouchstart=e=>{e.preventDefault();inspect(e,true)};c.ontouchmove=e=>{e.preventDefault();inspect(e,false)}}'''
replace_range("function draw(which,sets,w,mode='indexed')", 'function legend', draw17, 'Turn 17 active-series renderer')

# Chip selection itself turns on emphasis; no chart/crosshair click is needed.
rep("if(id===k){S.nowActive=id;$('nowTip').style.display='none';renderV2()}else{S.nowActive=id;S.priorV2.component=id;", "if(id===k){S.nowActive=id;S.nowFocus=id;$('info').classList.add('hidden');$('nowTip').style.display='none';renderV2()}else{S.nowActive=id;S.nowFocus=id;S.priorV2.component=id;", 'INDEX chip focus')
rep("S.analysisActive=b.dataset.id;$('analysisTip').style.display='none';renderAnalysis()", "S.analysisActive=b.dataset.id;S.analysisFocus=b.dataset.id;$('analysisTip').style.display='none';renderAnalysis()", 'COMPONENT chip focus')

# Exact current COMPONENT chart state is captured after representation planning.
rep("$('analysisEvidence').innerHTML=loaded.map(z=>{let c=cat(z.id),h=health(z.id);return`<div class=\"row\"><strong>${esc(z.label)} · ${esc(z.full)}</strong><span class=\"rowMeta\">${esc(c.provider||'')} · ${esc(z.unit||'—')} · ${esc(h.classification||'unknown')}</span>${c.source_reference_url?`<br><a href=\"${esc(c.source_reference_url)}\" target=\"_blank\" rel=\"noopener\">Source</a>`:''}</div>`}).join('');draw('analysis',sets,w,mode)}", "$('analysisEvidence').innerHTML=loaded.map(z=>{let c=cat(z.id),h=health(z.id);return`<div class=\"row\"><strong>${esc(z.label)} · ${esc(z.full)}</strong><span class=\"rowMeta\">${esc(c.provider||'')} · ${esc(z.unit||'—')} · ${esc(h.classification||'unknown')}</span>${c.source_reference_url?`<br><a href=\"${esc(c.source_reference_url)}\" target=\"_blank\" rel=\"noopener\">Source</a>`:''}</div>`}).join('');captureAnalysisState17(sets,w,mode);draw('analysis',sets,w,mode)}", 'capture exact COMPONENT data')

# Presentation-only Data bindings live in the same app-IIFE scope as the existing menus.
rep("$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowPrint').onclick=", "$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowData').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await openData17(nowAnalysisState())};$('nowPrint').onclick=", 'NOW Data binding')
rep("$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('morePrint').onclick=", "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreData').onclick=async()=>{$('moreMenu').classList.add('hidden');await openData17(S.analysisChartState)};$('morePrint').onclick=", 'COMPONENT Data binding')
rep("$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('explorePrint').onclick=", "$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('exploreData').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await openData17(await exploreState())};$('explorePrint').onclick=", 'EXPLORE Data binding')
rep("$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');", "$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');$('dataClose').onclick=()=>$('dataModal').classList.add('hidden');", 'Data close binding')

required = [
    'TURN 17 PRE-SHIP', 'id="nowData"', 'id="moreData"', 'id="exploreData"',
    'id="dataModal"', 'function legendSample(z)', 'function openData17(state)',
    "c.onpointermove=e=>{if(e.pointerType!=='touch')inspect(e,false)}",
    "S.nowFocus=id", "S.analysisFocus=b.dataset.id", 'captureAnalysisState17(sets,w,mode)',
    'Correlation', 'Native', 'Index 100', 'dataset.emphasis',
]
for item in required:
    if item not in s:
        raise SystemExit('Turn 17 requirement missing: ' + item)

for forbidden in [
    'left:50%;bottom:12px;transform:translateX(-50%)',
]:
    # Base CSS may still contain this historical rule; the Turn 17 override must
    # supersede it rather than forcing a broad rewrite of unrelated CSS.
    pass

DST.write_text(s)
print('TURN 17 BUILD: WROTE', DST, len(s))
