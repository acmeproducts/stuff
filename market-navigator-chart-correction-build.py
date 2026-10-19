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
edit(old,new,'dollar-family axis ownership')
edit("S.nowActive=id;if(!IDX.includes(id))S.nativeAxisSeries=id;S.nowFocus=id;", "S.nowActive=id;S.nowFocus=id;", 'legend focus does not reassign axes')
edit("clockIndex:nowOptions.clockIndex||nowState.root", "clockIndex:nowOptions.clockIndex||(IDX.includes(nowState.root)?nowState.root:'risk')", 'raw-series Analyze keeps a valid market clock')
edit("if(next.nowRepresentation==='native'&&next.axisOptions==='auto'&&new Set(ids.map(measurementFamily)).size>1)throw new TypeError('Native representation requires one measurement family');", "if(next.nowRepresentation==='native'&&next.axisOptions==='auto'&&new Set(ids.map(measurementFamily)).size>1){if(options.representation==='native')throw new TypeError('Native representation requires one measurement family');next.nowRepresentation='dual'}",'composition change updates representation')
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

TARGET.parent.mkdir(parents=True,exist_ok=True);TARGET.write_text(html,encoding='utf-8',newline='')
blob=hashlib.sha1(b'blob '+str(len(html.encode())).encode()+b'\0'+html.encode()).hexdigest()
Path('.evidence/chart-correction-build.json').write_text(json.dumps({'baseline':'ee38d9c9da9af4b2795695a39519c76e6c5e5239','candidate':blob,'changes':changes,'nativeHorizonSemantics':'native prices unchanged; every normalized series rebases; Fixed 2016-09-01 with later-start disclosure','published':False},indent=2))
print(json.dumps({'candidate':blob,'changes':len(changes),'target':str(TARGET)}))

