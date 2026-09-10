from pathlib import Path
import re

SRC = Path('market-navigator-turn15-pre-ship.html')
DST = Path('market-navigator-turn16-pre-ship.html')
s = SRC.read_text()


def rep(old, new, label, count=1):
    global s
    if old not in s:
        raise SystemExit('missing Turn 15 anchor: ' + label)
    s = s.replace(old, new, count)


def rep_re(pattern, repl, label, count=1):
    global s
    s2, n = re.subn(pattern, repl, s, count=count, flags=re.S)
    if n != count:
        raise SystemExit(f'missing/ambiguous Turn 15 regex anchor: {label} ({n})')
    s = s2


def replace_range(start_anchor, end_anchor, new, label):
    global s
    a = s.find(start_anchor)
    if a < 0:
        raise SystemExit('missing Turn 15 start anchor: ' + label)
    b = s.find(end_anchor, a)
    if b < 0:
        raise SystemExit('missing Turn 15 end anchor: ' + label)
    s = s[:a] + new + s[b:]


rep('<title>Market Navigator · Turn 15</title>', '<title>Market Navigator · Turn 16</title>', 'title')

# One canonical chart chrome. ENVIRONMENT/INDEX use it in the primary chart;
# COMPONENT uses the same geometry in the contained analysis workspace.
chrome_css = r'''
.shell.nowMode{grid-template-rows:minmax(0,1fr)}.shell.nowMode>.top{display:none}
.now{grid-template-rows:minmax(0,1fr);gap:0}.chartCard{grid-template-rows:44px 34px minmax(0,1fr) 30px}
.chartChromeRow{height:44px;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) max-content minmax(0,1fr);align-items:center;gap:8px;padding:5px 9px;border-bottom:1px solid #1c3449}
.chromeCrumb{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:900}.chromeCrumb .crumbBtn{font-size:11px}.chromeCrumbText{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chromeCenter{justify-self:center;min-width:0}.chromeRight{justify-self:end;display:flex;align-items:center}.chartChromeRow .hzs,.chartChromeRow .analysisHz{overflow:visible;justify-content:center;padding:0;border:0}.chartChromeRow .hz{padding:6px 8px}
.chartHead{height:34px;padding:4px 9px}.chartHead .legend{width:100%}.range{display:none!important}.chartFooter{min-height:30px;justify-content:center;align-items:center;gap:9px;padding:4px 9px}.chartFooter select{width:auto;min-width:108px;padding:2px 24px 2px 6px;font-size:9px;border-radius:6px;background:#071522}.footerSep{opacity:.45}
.analysis{grid-template-rows:44px 38px minmax(0,1fr)}.analysisTop{padding:0;border-bottom:1px solid #1c3449}.analysisHz{height:auto}.seriesBar{min-height:38px}.moreMenu{top:48px}.nowMoreMenu{top:48px}.lg.active{border-color:var(--accent);box-shadow:none}.seriesBar .chip.on{border-color:var(--accent)!important;box-shadow:none!important}
#view-config .config{height:100%;max-width:1100px;margin:0 auto;padding:16px 18px 24px;overflow:auto;position:relative}.configClose{position:sticky;top:0;z-index:20;float:right;margin:0 0 6px 8px}.cfgTabs{padding-right:44px}.paletteGrid{grid-template-columns:1fr!important}.chartSlot{grid-template-columns:42px minmax(180px,1fr) minmax(160px,260px)!important;column-gap:10px}.chartSlot select{width:100%;min-width:0}.chartSlot input[type=range]{min-width:0}.chartSlot .slotMeta{grid-column:1/-1}
@media(max-width:700px){.chartChromeRow{gap:4px;padding-left:6px;padding-right:6px}.chartChromeRow .hz{padding:5px 5px;font-size:8px}.chromeCrumb,.chromeCrumb .crumbBtn{font-size:9px}.chartSlot{grid-template-columns:36px minmax(82px,1fr) minmax(112px,1fr)!important;column-gap:6px}#view-config .config{padding:10px}.chartFooter{gap:6px;font-size:8px}.chartFooter select{min-width:98px;font-size:8px}}
'''
rep('</style>', chrome_css + '</style>', 'Turn 16 chrome CSS')

# The global header remains for principal non-chart modes only. Chart modes own
# their Section A inside the analytical surface.
rep(
    '<section class="shell"><header class="top"><div class="crumb" id="crumb">NOW / Market</div><div class="build">TURN 15 PRE-SHIP</div></header>',
    '<section class="shell nowMode" id="shell"><header class="top" id="modeHeader"><div class="crumb" id="crumb">ENVIRONMENT</div></header>',
    'global header',
)

# ENVIRONMENT / INDEX chart geometry: Section A, Section B, chart, Section C.
rep_re(
    r'<div class="pad now"><div class="toolbar">.*?</div><div class="card chartCard"><div class="chartHead"><div class="legend" id="legend"></div><div class="range" id="range"></div></div><div class="chartWrap" id="nowWrap">',
    '<div class="pad now"><span id="v1btn" class="hidden"></span><span id="nowTitle" class="hidden"></span><span id="range" class="hidden"></span><div class="card chartCard"><div class="chartChromeRow" id="nowChrome"><div class="chromeCrumb" id="nowCrumb" title="ENVIRONMENT" aria-label="ENVIRONMENT"></div><div class="hzs chromeCenter" id="hzs"></div><div class="chromeRight"><button class="btn" id="nowMoreBtn" aria-label="More actions">⋯</button></div></div><div class="chartHead"><div class="legend" id="legend"></div></div><div class="chartWrap" id="nowWrap">',
    'ENVIRONMENT INDEX chrome',
)
rep('<div class="metaLine" id="nowMeta"></div>', '<div class="metaLine chartFooter" id="nowMeta"></div>', 'NOW footer')

# CONFIG gets one persistent close control shared by all three tabs.
rep(
    '<section class="view" id="view-config"><div class="config"><div class="cfgTabs">',
    '<section class="view" id="view-config"><div class="config"><button class="btn configClose" id="configClose" aria-label="Close configuration">×</button><div class="cfgTabs">',
    'CONFIG close',
)
rep('White remains reserved for the active reference outline.', 'Series styling previews immediately; Save persists the current configuration.', 'obsolete white-config copy')
rep('Market Navigator · Turn 15', 'Market Navigator · Turn 16', 'About build text')

# COMPONENT uses the same Section A/B/C pattern. The exact prior INDEX state is
# still restored by the existing close handler; breadcrumb navigation invokes it.
old_analysis_head = '<div class="analysisTop"><strong id="analysisTitle">Analysis</strong><div class="grow"></div><span class="axisBadge" id="axisBadge"></span><button class="btn" id="closeAnalysis">×</button></div><div class="analysisHz" id="analysisHz"></div><div class="seriesBar" id="seriesBar"></div>'
new_analysis_head = '<div class="analysisTop chartChromeRow"><div class="chromeCrumb" id="analysisCrumb" title="COMPONENT" aria-label="COMPONENT"></div><div class="analysisHz chromeCenter" id="analysisHz"></div><div class="chromeRight"><button class="btn" id="moreBtn" aria-label="More actions">⋯</button></div><strong id="analysisTitle" class="hidden">Analysis</strong><span class="axisBadge hidden" id="axisBadge"></span><button class="hidden" id="closeAnalysis" aria-hidden="true" tabindex="-1">×</button></div><div class="seriesBar" id="seriesBar"></div>'
rep(old_analysis_head, new_analysis_head, 'COMPONENT chrome')
rep('<div class="metaLine" id="analysisMeta"></div>', '<div class="metaLine chartFooter" id="analysisMeta"></div>', 'COMPONENT footer')
rep('<button id="moreStats">Stats</button>', '', 'remove view-specific Stats menu command')

# State needed only for CONFIG return/draft and COMPONENT representation choice.
rep(
    'v2RenderSeq:0,analysisRenderSeq:0}',
    "v2RenderSeq:0,analysisRenderSeq:0,configReturnView:'now',configStyleSaved:null,analysisRepresentation:null}",
    'Turn 16 state',
)

# Replace point renderer: the selected series stays on top and fully opaque when
# inspecting; all others recede. No white plotted-line outline and no focus mode.
draw16 = r'''function draw(which,sets,w,mode='indexed'){let ids=which==='now'?['nowChart','nowTip','nowWrap']:which==='analysis'?['analysisChart','analysisTip','analysisWrap']:['libChart','libChartTip','libChartWrap'],c=$(ids[0]),tip=$(ids[1]),wrap=$(ids[2]),active=which==='now'?S.nowActive:which==='analysis'?S.analysisActive:S.libraryActive,inspecting=false;function setActive(id){active=id;if(which==='now')S.nowActive=id;else if(which==='analysis')S.analysisActive=id;else S.libraryActive=id}function syncActive(){let nodes=which==='now'?document.querySelectorAll('#legend [data-id]'):which==='analysis'?document.querySelectorAll('#seriesBar [data-id]'):document.querySelectorAll('#libChartLegend [data-lib-series]');nodes.forEach(n=>n.classList.toggle(which==='analysis'?'on':'active',(n.dataset.id||n.dataset.libSeries)===active))}let base;function axOf(z){return mode==='dual'?(z.axis||0):0}function isBar(z){return z.renderType==='bar'}function paint(){base=setCanvas(c);let{x,W,H}=base,dual=mode==='dual',p={l:W<430?48:58,r:dual?(W<430?48:58):12,t:22,b:34},pw=W-p.l-p.r,ph=H-p.t-p.b;x.clearRect(0,0,W,H);let times=sets.flatMap(z=>z.a.map(q=>q.t));if(!times.length){x.fillStyle='#91a8bb';x.font='10px system-ui';x.fillText('No real observations in this horizon.',p.l,p.t+15);return{p,pw,ph,scales:[],W,H}}let scales=[];for(let a=0;a<(dual?2:1);a++){let values=sets.filter(z=>axOf(z)===a).flatMap(z=>z.a.map(q=>q.v));if(mode==='indexed'&&sets.some(z=>axOf(z)===a&&isBar(z)))values.push(100);scales[a]=scale(values)}let ticks=W<430?(w.horizon==='1D'?2:3):5;x.font='10px system-ui';for(let i=0;i<ticks;i++){let xx=p.l+pw*i/(ticks-1),tt=w.start+(w.end-w.start)*i/(ticks-1);x.strokeStyle='#173047';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();x.fillStyle='#91a8bb';x.textAlign=i===0?'left':i===ticks-1?'right':'center';x.fillText(tick(tt,w.horizon),xx,H-10)}for(let a=0;a<(dual?2:1);a++){let[mn,mx]=scales[a],xx=a?p.l+pw:p.l,rep=sets.find(z=>axOf(z)===a);x.strokeStyle='#49657c';x.lineWidth=1;x.beginPath();x.moveTo(xx,p.t);x.lineTo(xx,p.t+ph);x.stroke();for(let i=0;i<5;i++){let yy=p.t+ph*i/4,v=mx-(mx-mn)*i/4;if(!a){x.strokeStyle='#173047';x.beginPath();x.moveTo(p.l,yy);x.lineTo(p.l+pw,yy);x.stroke()}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.textAlign=a?'right':'left';x.fillText(fmt(v),a?W-3:3,yy+3)}x.fillStyle=dual?(rep?.color||'#91a8bb'):'#91a8bb';x.font='9px system-ui';x.textAlign=a?'right':'left';let u=mode==='indexed'?'Indexed 100':(rep?.axisLabel||rep?.unit||'');if(u)x.fillText(u,a?W-3:3,12)}let bars=sets.filter(z=>isBar(z)&&z.a.length),maxPoints=Math.max(1,...bars.map(z=>z.a.length)),groupW=Math.max(1.2,Math.min(11,pw/maxPoints*.82)),barW=Math.max(.75,groupW/Math.max(1,bars.length));function xy(z,q){let[mn,mx]=scales[axOf(z)];return{x:p.l+(q.t-w.start)/(w.end-w.start)*pw,y:p.t+(mx-q.v)/(mx-mn||1)*ph,mn,mx}}function plot(z){if(!z.a.length)return;x.globalAlpha=inspecting&&z.id!==active?.24:1;if(isBar(z)){let bi=Math.max(0,bars.indexOf(z)),offset=(bi-(bars.length-1)/2)*barW,[mn,mx]=scales[axOf(z)],baseValue=mode==='indexed'?100:mn,baseY=p.t+(mx-baseValue)/(mx-mn||1)*ph;x.fillStyle=z.color;for(let q of z.a){let qxy=xy(z,q),left=qxy.x+offset-barW*.43,top=Math.min(qxy.y,baseY),height=Math.max(1,Math.abs(baseY-qxy.y));x.fillRect(left,top,Math.max(.75,barW*.86),height)}}else{let st=paintStyle(z);x.strokeStyle=z.color;x.lineWidth=st.width;x.setLineDash(st.dash);x.beginPath();z.a.forEach((q,i)=>{let qxy=xy(z,q);i?x.lineTo(qxy.x,qxy.y):x.moveTo(qxy.x,qxy.y)});x.stroke();x.setLineDash([])}x.globalAlpha=1}let ref=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);sets.filter(z=>z!==ref).forEach(plot);if(ref)plot(ref);c.dataset.activeSeries=inspecting?(ref?.id||''):'';return{p,pw,ph,scales,W,H,xy}}let model,sel=sets.find(z=>z.id===active&&z.a.length)||sets.find(z=>z.a.length);if(sel)setActive(sel.id);model=paint();syncActive();function inspect(e){if(!sel?.a.length)return;let r=wrap.getBoundingClientRect(),cx=(e.touches?.[0]?.clientX??e.clientX)-r.left,cy=(e.touches?.[0]?.clientY??e.clientY)-r.top,{p,pw,ph,scales,W}=model;if(cx<p.l||cx>p.l+pw||cy<p.t||cy>p.t+ph)return;let target=w.start+(cx-p.l)/pw*(w.end-w.start),cands=sets.filter(z=>z.a.length).map(z=>{let q=z.a.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a),[mn,mx]=scales[axOf(z)],xx=p.l+(q.t-w.start)/(w.end-w.start)*pw,yy=p.t+(mx-q.v)/(mx-mn||1)*ph;return{z,q,xx,yy,dist:Math.hypot(xx-cx,yy-cy)}}),near=cands.reduce((a,b)=>b.dist<a.dist?b:a);if(near.dist<24){sel=near.z;setActive(sel.id);syncActive()}let q=sel.a.reduce((a,b)=>Math.abs(b.t-target)<Math.abs(a.t-target)?b:a),[mn,mx]=scales[axOf(sel)],xx=p.l+(q.t-w.start)/(w.end-w.start)*pw,yy=p.t+(mx-q.v)/(mx-mn||1)*ph;inspecting=true;model=paint();let ctx=c.getContext('2d'),d=base.d;ctx.setTransform(d,0,0,d,0,0);ctx.strokeStyle='#8ea2bb';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(xx,p.t);ctx.lineTo(xx,p.t+ph);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='#fff';ctx.fillStyle=sel.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(xx,yy,5,0,Math.PI*2);ctx.fill();ctx.stroke();let iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v,valueLine=sel.unit==='Index'||!Number.isFinite(iv)?`idx ${fmt(q.v)}`:`idx ${fmt(iv)} · value ${fmt(nv)} ${esc(sel.unit||'')}`;tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;tip.style.display='block';tip.style.left=Math.min(W-180,Math.max(6,xx+8))+'px';tip.style.top=Math.max(6,yy-48)+'px'}c.onpointerdown=inspect;c.ontouchstart=e=>{e.preventDefault();inspect(e)};c.ontouchmove=e=>{e.preventDefault();inspect(e)}}'''
replace_range("function draw(which,sets,w,mode='indexed')", 'function legend', draw16, 'active-series renderer')

# Breadcrumb, footer and navigation helpers. No numbered view terminology enters
# the product surface.
helpers = r'''function pluralComponents(n){return n===1?'Component':'Components'}function nowBreadcrumbText(){return S.level===1?'ENVIRONMENT':`ENVIRONMENT / ${AB[S.index]}`}function renderNowCrumb(){let c=$('nowCrumb');if(!c)return;let full=nowBreadcrumbText();c.title=full;c.setAttribute('aria-label',full);if(S.level===1)c.innerHTML='<span class="chromeCrumbText">ENVIRONMENT</span>';else{c.innerHTML=`<span class="chromeCrumbText"><button class="crumbBtn" id="crumbEnvironment">ENVIRONMENT</button><span class="crumbSep"> / </span><span>${AB[S.index]}</span></span>`;let b=$('crumbEnvironment');if(b)b.onclick=()=>{S.level=1;S.index=null;S.priorV2=null;$('info').classList.add('hidden');$('nowTip').style.display='none';renderV1()}}}function renderAnalysisCrumb(){let c=$('analysisCrumb');if(!c)return;let root=displayLabel(S.analysisRoot||S.analysisSeries[0]||'COMPONENT'),extra=Math.max(0,S.analysisSeries.length-1),suffix=extra?` + ${extra} ${pluralComponents(extra)}`:'',fromExplore=String(S.lineage||'').toUpperCase().includes('EXPLORE'),full=fromExplore?`EXPLORE / ${root}${suffix}`:`ENVIRONMENT / ${AB[S.index]||''} / ${root}${suffix}`;c.title=full;c.setAttribute('aria-label',full);if(fromExplore)c.innerHTML=`<span class="chromeCrumbText"><button class="crumbBtn" id="crumbExplore">EXPLORE</button><span class="crumbSep"> / </span><span>${esc(root+suffix)}</span></span>`;else c.innerHTML=`<span class="chromeCrumbText"><button class="crumbBtn" id="crumbComponentEnvironment">ENVIRONMENT</button><span class="crumbSep"> / </span><button class="crumbBtn" id="crumbComponentIndex">${AB[S.index]||''}</button><span class="crumbSep"> / </span><span>${esc(root+suffix)}</span></span>`;let ce=$('crumbComponentEnvironment'),ci=$('crumbComponentIndex'),cx=$('crumbExplore');if(ce)ce.onclick=()=>{$('analysisModal').classList.add('hidden');S.level=1;S.index=null;S.analysisRepresentation=null;$('info').classList.add('hidden');renderV1()};if(ci)ci.onclick=()=>$('closeAnalysis').click();if(cx)cx.onclick=()=>{$('analysisModal').classList.add('hidden');S.analysisRepresentation=null;nav('explore')}}function footerOptions(mode,families){let one=families===1,two=families===2;return`<option value="native" ${mode==='native'?'selected':''} ${one?'':'disabled'}>Native Y1</option><option value="dual" ${mode==='dual'?'selected':''} ${two?'':'disabled'}>Native Y1 + Y2</option><option value="indexed" ${mode==='indexed'?'selected':''}>Indexed 100</option>`}function setNowFooter(w){$('nowMeta').innerHTML=`<span>TURN 16 PRE-SHIP</span><span class="footerSep">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class="footerSep">|</span><select id="nowRepresentation" aria-label="Chart representation"><option selected>Indexed 100</option><option disabled>Native Y1</option><option disabled>Native Y1 + Y2</option></select>`}function setAnalysisFooter(w,mode,families){$('analysisMeta').innerHTML=`<span>TURN 16 PRE-SHIP</span><span class="footerSep">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class="footerSep">|</span><select id="analysisRepresentation" aria-label="Chart representation">${footerOptions(mode,families)}</select>`;$('analysisRepresentation').onchange=e=>{S.analysisRepresentation=e.target.value;renderAnalysis()}}'''
replace_range('function renderCrumb()', 'function nav(v)', helpers + "function renderCrumb(){let c=$('crumb');if(S.view==='now'){renderNowCrumb();return}c.textContent=S.view.toUpperCase();c.title=c.textContent}", 'breadcrumb helpers')

# Principal-mode routing: the old global ribbon disappears only for NOW, where
# Section A is inside the chart card.
rep(
    "function nav(v){S.view=v;document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='view-'+v));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('on',x.dataset.view===v));renderCrumb();",
    "function nav(v){S.view=v;$('shell').classList.toggle('nowMode',v==='now');document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='view-'+v));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('on',x.dataset.view===v));renderCrumb();",
    'mode routing chrome',
)

# ENVIRONMENT and INDEX keep Turn 15 data truth while adopting the canonical
# breadcrumbs and footer. Internal function names are retained only as code
# compatibility; rendered terminology is never numbered.
rep("$('nowTitle').textContent='Market';renderCrumb();", "$('nowTitle').textContent='ENVIRONMENT';renderCrumb();", 'Environment title')
rep("$('nowMeta').innerHTML='<span>Common horizon</span><span>Indexed 100 · columns</span>';", "setNowFooter(w);", 'Environment footer')
rep("$('nowMeta').innerHTML='<span>Common horizon</span><span>Index column · components direction-indexed lines</span>';", "setNowFooter(w);", 'Index footer')

# Replace COMPONENT rendering as one coherent function. It preserves Turn 15
# availability, styling and stale-render guards while moving horizon/menu/footer
# into the shared chrome and allowing valid representation changes in place.
analysis16 = r'''async function renderAnalysis(){let renderSeq=++S.analysisRenderSeq;makeHz($('analysisHz'),h=>{S.h=h;S.analysisRepresentation=null;$('analysisTip').style.display='none';renderAnalysis();wireNowHz()});let w=windowFor(),colors=chartColors(S.analysisSeries),loaded=[];for(let id of S.analysisSeries){try{loaded.push({id,label:displayLabel(id),full:IDX.includes(id)?S.def.indices[id]?.name:name(id),unit:IDX.includes(id)?'Index':unit(id),color:colors[id],renderType:'line',s:await getSeries(id)})}catch{}}let plan=axisPlan(loaded.map(x=>x.id)),families=plan.kinds.length,canonical=plan.mode,mode=S.analysisRepresentation||canonical;if(mode==='native'&&families!==1)mode=canonical;if(mode==='dual'&&families!==2)mode=canonical;if(!['native','dual','indexed'].includes(mode))mode=canonical;S.analysisRepresentation=mode;let sets=loaded.map(z=>({id:z.id,label:z.label,full:z.full,unit:z.unit,color:z.color,renderType:'line',axis:mode==='dual'?(plan.map[z.id]||0):0,axisLabel:unitKind(z.id)==='percent'?'Percent':unitKind(z.id)==='money'?'$ / USD':z.unit,a:mode==='indexed'?indexed(z.s,w,1):nativeIndexed(z.s,w)}));if(renderSeq!==S.analysisRenderSeq)return;let reps=plan.kinds.map(k=>loaded.find(z=>measurementFamily(z.id)===k)).filter(Boolean);$('analysisTitle').textContent=`COMPONENT · ${displayLabel(S.analysisRoot)}`;$('axisBadge').textContent=mode==='dual'?`Y1 ${reps[0]?unitGlyph(reps[0].id):''} · Y2 ${reps[1]?unitGlyph(reps[1].id):''}`:mode==='indexed'?'Indexed 100':'Native Y1';renderAnalysisCrumb();setAnalysisFooter(w,mode,families);$('seriesBar').innerHTML=loaded.map(z=>`<button class="chip ${z.id===S.analysisActive?'on':''}" data-id="${z.id}" data-color-slot="${colorSlot(z.id)}" style="border-color:${z.color};box-shadow:inset 3px 0 ${z.color}"><span class="seriesLegend"><span class="sw" style="background:${z.color}"></span>${esc(z.label)}<span class="seriesX" data-rm="${z.id}">×</span></span></button>`).join('')+`<button class="btn" id="addSeries" ${loaded.length>=10?'disabled aria-disabled="true" title="Ten-series chart limit"':''}>Add</button>`;$('seriesBar').querySelectorAll('[data-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-rm]'))return;S.analysisActive=b.dataset.id;$('analysisTip').style.display='none';renderAnalysis()});$('seriesBar').querySelectorAll('[data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();if(S.analysisSeries.length<=1)return;let id=x.dataset.rm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisRoot===id)S.analysisRoot=S.analysisSeries[0];if(S.analysisActive===id)S.analysisActive=S.analysisRoot;S.analysisRepresentation=null;renderAnalysis()});$('addSeries').onclick=()=>{if(S.analysisSeries.length>=10)return;renderPicker();$('seriesPicker').classList.remove('hidden')};$('moreBtn').onclick=()=>$('moreMenu').classList.toggle('hidden');$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('morePrint').onclick=()=>{$('moreMenu').classList.add('hidden');window.print()};$('moreMarkdown').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('md')};$('moreCsv').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('csv')};$('moreJson').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState('json')};$('analysisEvidence').innerHTML=loaded.map(z=>{let c=cat(z.id),h=health(z.id);return`<div class="row"><strong>${esc(z.label)} · ${esc(z.full)}</strong><span class="rowMeta">${esc(c.provider||'')} · ${esc(z.unit||'—')} · ${esc(h.classification||'unknown')}</span>${c.source_reference_url?`<br><a href="${esc(c.source_reference_url)}" target="_blank" rel="noopener">Source</a>`:''}</div>`}).join('');draw('analysis',sets,w,mode)}'''
replace_range('async function renderAnalysis()', "$('closeAnalysis').onclick", analysis16, 'COMPONENT renderer')
rep("$('closeAnalysis').onclick=()=>{", "$('closeAnalysis').onclick=()=>{S.analysisRepresentation=null;", 'component close representation reset')

# Chart config is one row per series at all desktop widths. Draft changes update
# the active in-memory style immediately; Save is the only persistence boundary.
config_ui = r'''function validPalette(colors){if(!Array.isArray(colors)||colors.length!==10)throw Error('A scheme requires exactly 10 colors');let out=colors.map(x=>String(x).trim().toUpperCase());if(out.some(x=>!/^#[0-9A-F]{6}$/.test(x)))throw Error('Every slot requires a six-digit hex color');if(new Set(out).size!==10)throw Error('Every series color must be unique');if(out.some(x=>x==='#FFFFFF'))throw Error('White is reserved for point/crosshair contrast');return out}function configDraftFromControls(name='Custom'){let base=paletteState(),colors=validPalette([...document.querySelectorAll('[data-palette-slot]')].map(x=>x.value)),widths=cleanWidths([...document.querySelectorAll('[data-width-slot]')].map(x=>x.value)),lineStyles=cleanLineStyles([...document.querySelectorAll('[data-style-slot]')].map(x=>x.value));return{...base,schema:'market-navigator-series-style-v2',name,colors,widths,lineStyles,assignments:{...base.assignments}}}function previewConfig(name='Custom'){try{PALETTE_CACHE=configDraftFromControls(name);$('paletteStatus').className='paletteStatus';$('paletteStatus').textContent=`${name} · preview · Save to persist`;repaintCharts()}catch(e){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=e.message}}function renderPaletteSettings(){let p=paletteState();$('palettePresets').innerHTML=Object.entries(PALETTES).map(([id,colors])=>`<button class="btn" data-palette="${id}" data-colors="${colors.join(',')}">${id==='normal'?'Normal':id==='colorblind'?'Colorblind':'Bright'}</button>`).join('');$('paletteGrid').innerHTML=p.colors.map((color,i)=>`<div class="chartSlot"><input type="color" data-palette-slot="${i}" value="${color}" aria-label="Series ${i+1} color"><input type="range" min="1" max="12" step="1" data-width-slot="${i}" value="${p.widths[i]}" aria-label="Series ${i+1} thickness"><select data-style-slot="${i}" aria-label="Series ${i+1} line style">${LINE_STYLES.map(v=>`<option value="${v}" ${p.lineStyles[i]===v?'selected':''}>${v}</option>`).join('')}</select><div class="slotMeta"><span>Series ${i+1}</span><span data-width-label="${i}">${p.widths[i]}pt</span></div></div>`).join('');$('paletteStatus').className='paletteStatus';$('paletteStatus').textContent=`${p.name} · saved`;document.querySelectorAll('[data-palette]').forEach(b=>b.onclick=()=>{let colors=b.dataset.colors.split(',');document.querySelectorAll('[data-palette-slot]').forEach((input,i)=>input.value=colors[i]);previewConfig(b.textContent)});document.querySelectorAll('[data-palette-slot],[data-style-slot]').forEach(input=>input.oninput=()=>previewConfig('Custom'));document.querySelectorAll('[data-width-slot]').forEach(input=>input.oninput=()=>{let lab=document.querySelector(`[data-width-label="${input.dataset.widthSlot}"]`);if(lab)lab.textContent=input.value+'pt';previewConfig('Custom')})}'''
replace_range('function validPalette(colors)', 'function repaintCharts()', config_ui, 'Chart Config UI')

old_save_start = s.find('function savePaletteUI(){')
old_save_end = s.find("$('paletteImportInput').onchange", old_save_start)
if old_save_start < 0 or old_save_end < 0:
    raise SystemExit('CONFIG save/import anchors missing')
config_actions = r'''function savePaletteUI(){try{let draft=configDraftFromControls($('paletteStatus').textContent.split(' · ')[0]||'Custom'),saved=savePaletteState(draft);S.configStyleSaved=JSON.parse(JSON.stringify(saved));$('paletteStatus').className='paletteStatus good';$('paletteStatus').textContent=`${saved.name} · saved`;repaintCharts()}catch(e){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=e.message}}function openConfig(){if(S.view!=='config')S.configReturnView=S.view;S.configStyleSaved=JSON.parse(JSON.stringify(paletteState()));nav('config');setConfigTab('ai')}function closeConfig(){if(S.configStyleSaved)PALETTE_CACHE=JSON.parse(JSON.stringify(S.configStyleSaved));let back=S.configReturnView||'now';nav(back);repaintCharts()}$('settingsGear').onclick=openConfig;$('configClose').onclick=closeConfig;$('paletteSave').onclick=savePaletteUI;$('paletteExport').onclick=()=>downloadBlob('market-navigator-series-config.json','application/json',JSON.stringify(paletteState(),null,2));$('paletteImport').onclick=()=>$('paletteImportInput').click();'''
s = s[:old_save_start] + config_actions + s[old_save_end:]

# Import loads a draft and requires Save rather than crossing the persistence
# boundary automatically.
rep_re(
    r"\$\('paletteImportInput'\)\.onchange=async e=>\{.*?\};",
    "$('paletteImportInput').onchange=async e=>{let file=e.target.files?.[0];e.target.value='';if(!file)return;try{let raw=JSON.parse(await file.text()),colors=validPalette(raw.colors);PALETTE_CACHE={...paletteState(),schema:'market-navigator-series-style-v2',name:raw.name||'Imported',colors,widths:cleanWidths(raw.widths),lineStyles:cleanLineStyles(raw.lineStyles),assignments:{...paletteState().assignments,...cleanAssignments(raw.assignments)}};renderPaletteSettings();$('paletteStatus').textContent=`${PALETTE_CACHE.name} · preview · Save to persist`;repaintCharts()}catch(err){$('paletteStatus').className='paletteStatus bad';$('paletteStatus').textContent=`Import failed: ${err.message}`}};",
    'draft import',
)

# CONFIG boot remains valid without overwriting return state.
rep("renderAIConfig();setConfigTab('ai');renderCrumb();", "renderAIConfig();setConfigTab('ai');renderCrumb();", 'boot anchor')

# Product-surface wording must use the three owner-defined view names.
rep("state={lineage:`NOW-V${S.level}`", "state={lineage:S.level===1?'ENVIRONMENT':`ENVIRONMENT/${AB[S.index]}`", 'snapshot lineage')

required = [
    'TURN 16 PRE-SHIP',
    'id="nowCrumb"',
    'id="analysisCrumb"',
    'id="configClose"',
    'id="analysisRepresentation"',
    'function renderAnalysisCrumb',
    'x.globalAlpha=inspecting&&z.id!==active?.24:1',
    'Save to persist',
    'Download Markdown', 'Download CSV', 'Download JSON',
]
for item in required:
    if item not in s:
        raise SystemExit('Turn 16 requirement missing: ' + item)

for forbidden in [
    '<div class="build">TURN 15 PRE-SHIP</div>',
    'Indexed 100 · columns',
    'Index column · components direction-indexed lines',
    '<button id="moreStats">Stats</button>',
    "if(reference){x.strokeStyle='#fff';x.lineWidth=st.width+3;trace()}",
    'White remains reserved for the active reference outline.',
]:
    if forbidden in s:
        raise SystemExit('Turn 16 forbidden residue: ' + forbidden)

DST.write_text(s)
print('TURN 16 BUILD: WROTE', DST, len(s))
