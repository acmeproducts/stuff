from pathlib import Path
import re

p=Path('market-view.html')
s=p.read_text()
if "const APP_VERSION='3.6.0'" not in s:
    raise SystemExit('Expected 3.6.0 baseline')

s=s.replace('<title>Market Navigator 3.6</title>','<title>Market Navigator 3.6.1</title>')
s=s.replace('Version 3.6</small>','Version 3.6.1</small>')
s=s.replace('Market Navigator 3.6</div>','Market Navigator 3.6.1</div>')
s=s.replace("const APP_VERSION='3.6.0'","const APP_VERSION='3.6.1'")

# Standardize horizon set and defaults.
s=re.sub(r"const HORIZONS=\{.*?\};",
"const HORIZONS={'1d':{label:'1D',days:1,intraday:true,fetchRange:'1d',interval:'5m'},'5d':{label:'5D',days:7,intraday:true,fetchRange:'5d',interval:'30m'},'1mo':{label:'1M',days:30},'3mo':{label:'3M',days:90},'6mo':{label:'6M',days:180},ytd:{label:'YTD',ytd:true},'1y':{label:'1Y',days:365},'5y':{label:'5Y',days:1825},max:{label:'All',max:true}};",s,count=1)
s=s.replace("nowRange:'1mo'","nowRange:'3mo'")

# Add a single reusable chart contract before canvas helpers.
anchor='function setupCanvas(c)'
if anchor not in s:
    raise SystemExit('setupCanvas anchor missing')
engine=r'''function chartProfile(r){if(r==='1d')return{ticks:5,date:'time'};if(r==='5d')return{ticks:5,date:'daytime'};if(r==='1mo'||r==='3mo')return{ticks:5,date:'day'};if(r==='6mo'||r==='ytd'||r==='1y')return{ticks:6,date:'month'};return{ticks:6,date:'yearmonth'}}
function formatAxisDate(t,r){const d=new Date(t),p=chartProfile(r);if(p.date==='time')return d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});if(p.date==='daytime')return d.toLocaleDateString([], {weekday:'short'})+' '+d.toLocaleTimeString([], {hour:'numeric'});if(p.date==='day')return d.toLocaleDateString([], {month:'short',day:'numeric'});if(p.date==='month')return d.toLocaleDateString([], {month:'short',year:r==='1y'?'2-digit':undefined});return d.toLocaleDateString([], {month:'short',year:'2-digit'})}
function valueFormatter(id,v){const m=META[id]||{};if(m.unit==='$')return'$'+fmt(v,m.decimals||2);if(m.suffix==='%')return fmt(v,m.decimals||2)+'%';return fmt(v,m.decimals||2)}
function niceBounds(vals){let lo=Math.min(...vals),hi=Math.max(...vals);if(!Number.isFinite(lo)||!Number.isFinite(hi))return{lo:0,hi:1};if(lo===hi){const p=Math.abs(lo||1)*.02||1;return{lo:lo-p,hi:hi+p}}const pad=(hi-lo)*.08;return{lo:lo-pad,hi:hi+pad}}
function standardChart(canvas,series,{range='3mo',showAxes=true,normalized=false}={}){const{x,w,h}=setupCanvas(canvas),pad=showAxes?{l:58,r:12,t:12,b:30}:{l:3,r:3,t:3,b:3},pts=series.flatMap(a=>a.data||[]);x.clearRect(0,0,w,h);if(!pts.length){x.fillStyle='#9aaac1';x.font='12px system-ui';x.fillText('Data unavailable',10,24);return}let t0=Math.min(...pts.map(p=>p.t)),t1=Math.max(...pts.map(p=>p.t));if(t0===t1)t1=t0+86400000;const vals=pts.map(p=>p.v).filter(Number.isFinite),b=niceBounds(vals);if(showAxes){x.strokeStyle='#273750';x.fillStyle='#9aaac1';x.font='10px system-ui';for(let i=0;i<5;i++){const y=pad.t+(h-pad.t-pad.b)*i/4,val=b.hi-(b.hi-b.lo)*i/4;x.beginPath();x.moveTo(pad.l,y);x.lineTo(w-pad.r,y);x.stroke();const label=normalized?fmt(val,0):(series.length===1?valueFormatter(series[0].id,val):fmt(val,1));x.fillText(label,4,y+3)}const ticks=chartProfile(range).ticks;for(let i=0;i<ticks;i++){const t=t0+(t1-t0)*i/(ticks-1),px=pad.l+(w-pad.l-pad.r)*i/(ticks-1),label=formatAxisDate(t,range);x.fillText(label,Math.max(2,Math.min(w-48,px-18)),h-7)}}for(const a of series){if(!a.data?.length)continue;x.strokeStyle=a.color;x.lineWidth=showAxes?2:1.6;x.beginPath();a.data.forEach((p,i)=>{const px=pad.l+(p.t-t0)/(t1-t0)*(w-pad.l-pad.r),py=pad.t+(b.hi-p.v)/(b.hi-b.lo)*(h-pad.t-pad.b);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()}const inspect=e=>{e.stopPropagation();tooltip(canvas,e,series,pad,t0,t1)};canvas.onpointerdown=inspect;canvas.onpointermove=e=>{if(e.pointerType==='mouse'||e.buttons)inspect(e)};canvas.onpointerleave=()=>$('#chartTip')?.remove()}
function commonNormalized(ids,r){const available=ids.map(id=>({id,data:rangeSeries(id,r,true)})).filter(x=>x.data.length>1);if(available.length<2)return[];const start=Math.max(...available.map(x=>x.data[0].t)),end=Math.min(...available.map(x=>x.data.at(-1).t));if(end<=start)return[];return available.map(x=>{const d=x.data.filter(p=>p.t>=start&&p.t<=end),base=d[0]?.v;return{id:x.id,name:META[x.id].short,color:META[x.id].color,unit:'',data:base?d.map(p=>({t:p.t,v:p.v/base*100})):[]}})}
'''
s=s.replace(anchor,engine+anchor,1)

# Small multiples become axis-free sparklines only.
s=re.sub(r"function drawSparks\(\)\{.*?\}\nfunction renderRelationship", "function drawSparks(){$$('[data-spark]').forEach(c=>{const id=c.dataset.spark,r=c.dataset.range||state.nowRange,d=exactRangeSeries(id,r);standardChart(c,[{id,name:META[id].short,color:META[id].color,data:d}],{range:r,showAxes:false})})}\nfunction renderRelationship", s, flags=re.S, count=1)

# Detail chart uses standard engine with proper axes.
s=s.replace("drawLines($('#instrumentChart'),[{name:m.short,color:m.color,unit:(m.unit||'')+(m.suffix||''),data:d}]);", "standardChart($('#instrumentChart'),[{id,name:m.short,color:m.color,unit:(m.unit||'')+(m.suffix||''),data:d}],{range:r,showAxes:true});")

# Comparison view always normalized to first common observation and uses same standard chart engine.
m=re.search(r"function renderRelationship\(\).*?\}\nfunction setupRelationship",s,re.S)
if not m:
    raise SystemExit('renderRelationship block missing')
new_rel=r'''function renderRelationship(){const ids=state.selectedSeries.filter(id=>META[id]?.symbol&&state.series[id]?.length>1),list=commonNormalized(ids,state.nowRange);standardChart($('#relationshipChart'),list,{range:state.nowRange,showAxes:true,normalized:true});$('#relationshipLegend').innerHTML=list.map(x=>`<span><i style="background:${x.color}"></i>${esc(x.name)}</span>`).join('');const omitted=state.selectedSeries.filter(id=>!ids.includes(id));$('#relationshipState').innerHTML=`<strong>Normalized comparison · 100 = first common observation</strong><br>${list.length?`${list.length} compatible series across ${HORIZONS[state.nowRange]?.label||state.nowRange}.`:'Select at least two market series with overlapping history.'}${omitted.length?` <span class="muted">Macro/non-price series omitted from normalized price comparison: ${omitted.map(id=>META[id]?.short||id).join(', ')}.</span>`:''}`}
function setupRelationship'''
s=s[:m.start()]+new_rel+s[m.end():]

# Remove redundant display-mode control from comparison; normalized is the only comparison mode.
s=s.replace("<div class=\"field\"><label>Display mode</label><select id=\"displayMode\"><option value=\"normalized\">Normalized · rebase to 100</option><option value=\"percent\">Percent change</option><option value=\"raw\">Raw values</option></select></div>","<div class=\"field\"><label>Comparison scale</label><div class=\"callout\">Normalized · 100 = first common observation</div></div>")
s=re.sub(r"\$\('#displayMode'\)\.value=state\.displayMode;\$\('#displayMode'\)\.onchange=.*?;renderPicker\(\)\}","renderPicker()}",s,flags=re.S,count=1)

# Pilot focus: SPY, 10Y, WTI first in component ordering.
s=s.replace("['spy','qqq','vix','tenYear','wti','brent','gold','dxy']","['spy','tenYear','wti','qqq','vix','brent','gold','dxy']",1)

# Keep single linear route; Analysis remains only ad-hoc destination.
s=s.replace("const NAV=[['now','◉','Now'],['macro','▤','Macro'],['news','◌','News'],['relationships','⌗','Analysis'],['library','▣','Analysis Library'],['providers','◇','Providers'],['logs','≡','Logs'],['about','?','About']];","const NAV=[['now','◉','Now'],['macro','▤','Macro'],['news','◌','News'],['relationships','⌗','Analysis'],['library','▣','Analysis Library'],['providers','◇','Providers'],['logs','≡','Logs'],['about','?','About']];")

p.write_text(s)
print('Patched Market Navigator to 3.6.1 chart standardization pilot')
