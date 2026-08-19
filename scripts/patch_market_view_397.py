from pathlib import Path
import re
p=Path('market-view.html')
s=p.read_text()
if "const VERSION='3.9.6'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.6 baseline')

# Version
s=s.replace('Market Navigator 3.9.6','Market Navigator 3.9.7')
s=s.replace('Version: 3.9.6','Version: 3.9.7')
s=s.replace("const VERSION='3.9.6'","const VERSION='3.9.7'")

# Restore distinct actual market elements used by the category indexes.
anchor="wti:{symbol:'CL=F',short:'WTI',name:'West Texas Intermediate crude oil',unit:'$',dec:2,role:'U.S. oil benchmark',color:'#fb7185'},cpi:"
if anchor not in s:
    raise SystemExit('META anchor not found')
s=s.replace(anchor,"wti:{symbol:'CL=F',short:'WTI',name:'West Texas Intermediate crude oil',unit:'$',dec:2,role:'U.S. oil benchmark',color:'#fb7185'},qqq:{symbol:'QQQ',short:'QQQ',name:'Nasdaq-100 ETF',unit:'$',dec:2,role:'Growth equities',color:'#60a5fa'},vix:{symbol:'^VIX',short:'VIX',name:'CBOE Volatility Index',dec:2,role:'Market fear',color:'#f97316'},dxy:{symbol:'DX-Y.NYB',short:'DXY',name:'U.S. Dollar Index',dec:2,role:'Financial conditions',color:'#22d3ee'},cpi:",1)

# Category definitions are distinct on purpose: no WTI/10Y repeated across every category.
cat_old=re.compile(r"const CATEGORY=\{\s*risk:\{name:'Risk'.*?\n\};",re.S)
cat_new="""const CATEGORY={
  risk:{name:'Risk',desc:'Risk appetite, volatility and financial conditions',components:['spy','vix','dxy']},
  growth:{name:'Growth',desc:'Growth leadership versus the cost of capital',components:['qqq','tenYear']},
  macro:{name:'Macro',desc:'Inflation, policy rates and energy pressure',components:['cpi','fedFunds','twoYear','wti']}
};"""
s,n=cat_old.subn(cat_new,s,count=1)
if n!=1: raise SystemExit('CATEGORY block not found')

# Build/persist the Yahoo-backed category elements as well as the three regime core series.
s=s.replace("async function foundation(){const ids=['spy','tenYear','wti']","async function foundation(){const ids=['spy','qqq','vix','dxy','tenYear','wti']",1)
s=s.replace("async function incremental(force=false){for(const id of ['spy','tenYear','wti'])","async function incremental(force=false){for(const id of ['spy','qqq','vix','dxy','tenYear','wti'])",1)
s=s.replace("const need=['spy','tenYear','wti'].filter(id=>!coverage(id,'5y'))","const need=['spy','qqq','vix','dxy','tenYear','wti'].filter(id=>!coverage(id,'5y'))",1)
s=s.replace("if(['spy','tenYear','wti'].every(id=>coverage(id,'5y')))","if(['spy','qqq','vix','dxy','tenYear','wti'].every(id=>coverage(id,'5y')))",1)
s=s.replace("const ids=['spy','tenYear','wti'];const checkKey='mn392-last-market-check'","const ids=['spy','qqq','vix','dxy','tenYear','wti'];const checkKey='mn392-last-market-check'",1)

# Category index scoring: each component contributes according to its economic direction.
pat=re.compile(r"function categoryIndexAt393\(key,t\)\{.*?\}\nfunction categoryHistory393\(key,range=state.range\)\{.*?\}\n",re.S)
rep="""function categoryEffect397(id,p){if(!Number.isFinite(p))return null;const scale={spy:8,vix:20,dxy:8,qqq:10,tenYear:6,cpi:5,fedFunds:10,twoYear:8,wti:12}[id]||10;const sign=['vix','dxy','tenYear','cpi','fedFunds','twoYear','wti'].includes(id)?-1:1;return clamp(sign*p/scale)}
function categoryIndexAt393(key,t){const c=CATEGORY[key];let parts=[];for(const id of c.components){const a=state.series[id]||[],now=nearest(a,t),prev=nearest(a,t-30*864e5);if(!now||!prev||!prev.v)continue;const p=(now.v/prev.v-1)*100,effect=categoryEffect397(id,p);if(effect===null)continue;parts.push(effect)}if(!parts.length)return null;return Math.max(0,Math.min(100,Math.round(50+35*(parts.reduce((a,b)=>a+b,0)/parts.length))))}
function categoryHistory393(key,range=state.range){const c=CATEGORY[key],candidates=c.components.map(id=>rangeData(id,range)).filter(d=>d.length>1).sort((a,b)=>b.length-a.length),base=candidates[0]||[];return base.map(p=>({t:p.t,v:categoryIndexAt393(key,p.t)})).filter(p=>Number.isFinite(p.v))}
"""
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('category history block not found')

# Clearer driver narrative for the actual elements.
pat=re.compile(r"function directionCopy393\(key,z\)\{.*?\}\nfunction microComponent393\(id\)\{.*?\}\n\nfunction regimeSummary",re.S)
rep=r'''function directionCopy393(key,z){if(!z)return'Insufficient data';const sign=z.score>52?'supportive':z.score<48?'adverse':'balanced';const drivers=z.parts.map(p=>`${META[p.id].short} ${p.p<0?'lower':'higher'} ${Math.abs(p.p).toFixed(1)}%`);return `${sign[0].toUpperCase()+sign.slice(1)}: ${drivers.join(' · ')}`}
function bucketCount397(r,data){if(r==='1d')return 6;if(r==='5d')return 5;if(r==='1mo')return 4;if(r==='3mo')return 3;if(r==='6mo')return 6;if(r==='1y')return 12;if(r==='5y')return 5;if(r==='ytd'){const a=new Date(data[0]?.t||Date.now()),b=new Date(data.at(-1)?.t||Date.now());return Math.max(1,Math.min(12,(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth()+1))}return 12}
function bucketLabel397(t,r){const d=new Date(t);if(r==='1d')return d.toLocaleTimeString([],{hour:'numeric'});if(r==='5d')return d.toLocaleDateString([],{weekday:'short'});if(['1mo','3mo','6mo'].includes(r))return d.toLocaleDateString([],{month:'short',day:'numeric'});if(r==='1y'||r==='ytd')return d.toLocaleDateString([],{month:'short'});return String(d.getFullYear())}
function bucketSeries397(data,r){if(!data?.length)return[];const n=Math.min(bucketCount397(r,data),data.length),start=data[0].t,end=data.at(-1).t,span=Math.max(1,end-start),out=[];for(let i=0;i<n;i++){const a=start+span*i/n,b=i===n-1?end+1:start+span*(i+1)/n,pts=data.filter(p=>p.t>=a&&p.t<b),p=pts.at(-1)||data.reduce((best,x)=>Math.abs(x.t-(a+b)/2)<Math.abs(best.t-(a+b)/2)?x:best,data[0]);out.push({t:p.t,v:p.v,label:bucketLabel397(p.t,r)})}return out}
function microComponent393(id){const d=rangeData(id,state.range),z=q(id,state.range),m=META[id];if(!d.length)return`<button class="micro393 micro397" data-component393="${id}"><div><div class="kicker">${m.short}</div><b>Unavailable</b></div></button>`;const buckets=bucketSeries397(d,state.range),vals=buckets.map(x=>x.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1,start=d[0].v,end=d.at(-1).v;return`<button class="micro393 micro397" data-component393="${id}" aria-label="Open ${m.name} detail"><div class="microHead397"><div><div class="kicker">${m.role}</div><b>${m.short}</b></div><div class="microChange397">${z?pct(z.p):'Unavailable'}</div></div><div class="microValues397"><span><small>Start</small><b>${fmt(id,start)}</b></span><span><small>End</small><b>${fmt(id,end)}</b></span></div><div class="microPlot397"><div class="microYAxis397"><span>100</span><span>50</span><span>0</span></div><div class="microBars397">${buckets.map(x=>{const h=Math.max(4,Math.round((x.v-min)/span*96)+4);return`<div class="microBucket397"><div class="microBar397" style="height:${h}%" title="${m.short} ${fmt(id,x.v)}"></div><div class="microX397">${x.label}</div></div>`}).join('')}</div></div></button>`}

function regimeSummary'''
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('micro component block not found')

# Category modal: dedicated fixed layout, standard chart with legend/axes, then driver small multiples.
pat=re.compile(r"async function openCategory\(key\)\{.*?\}\nasync function drawCategory\(\)\{.*?\}\nasync function openDetail\(id\)",re.S)
rep=r'''async function openCategory(key){state.detail={category:key,range:state.range};$('#saveDetail').style.display='';$('#detailModal').classList.add('open');$('#detailModal .modalPanel').classList.add('categoryMode397');await drawCategory()}
async function drawCategory(){const key=state.detail.category,c=CATEGORY[key],z=categoryIndex(key,state.range),d=categoryHistory393(key,state.range),chg=periodChange393(d);$('#detailModal .modalPanel').classList.add('categoryMode397');$('#detailKicker').textContent='CATEGORY INDEX';$('#detailTitle').innerHTML=`${c.name} · ${z?z.score:'—'}/100<div class="dateRange">${dateRangeLabel392(d,state.range)}</div><div class="modalSub393">${directionCopy393(key,z)}</div>`;$('#detailRanges').innerHTML=Object.entries(H).map(([k,v])=>`<button data-cr="${k}" class="${k===state.range?'active':''}">${v.label}</button>`).join('');$('#detailChart').style.display='';chart($('#detailChart'),[{id:key,name:`${c.name} index · 0–100`,color:'#6db7ff',data:d}],{range:state.range,axes:true,index:true});$('#detailStats').innerHTML=`<div class="categorySummary397"><div class="stat"><span class="kicker">INDEX</span><b>${z?z.score:'—'} / 100</b></div><div class="stat"><span class="kicker">SIGNAL</span><b><span class="chip ${z?.cls||'neutral'}">${z?.label||'Unavailable'}</span></b></div><div class="stat"><span class="kicker">${H[state.range].label} CHANGE</span><b>${Number.isFinite(chg)?pct(chg):'Unavailable'}</b></div></div><div class="driverArea397"><div class="kicker">INDEX COMPONENTS · CLICK FOR DETAIL</div><div class="microGrid393">${c.components.map(microComponent393).join('')}</div></div>`;$('#saveDetail').textContent='Add to Analysis';$('#saveDetail').onclick=()=>saveAnalysis(`${c.name} ${H[state.range].label} index`,{type:'category',category:key,range:state.range,index:z,data:d,components:c.components});$$('[data-cr]').forEach(b=>b.onclick=async()=>{state.range=b.dataset.cr;state.detail.range=state.range;renderGlobalRange();renderNow();await drawCategory()});$$('[data-component393]').forEach(b=>b.onclick=()=>openDetail(b.dataset.component393))}
async function openDetail(id)'''
s,n=pat.subn(rep,s,count=1)
if n!=1: raise SystemExit('drawCategory block not found')

# Remove category layout class when viewing regime or an individual component.
s=s.replace("async function openRegime393(){state.detail={regime:true,range:state.range};$('#detailModal').classList.add('open');await drawRegime393()}","async function openRegime393(){state.detail={regime:true,range:state.range};$('#detailModal .modalPanel').classList.remove('categoryMode397');$('#detailModal').classList.add('open');await drawRegime393()}",1)
s=s.replace("async function openDetail(id){state.detail={id,range:state.range};$('#saveDetail').style.display='';$('#detailModal').classList.add('open');await drawDetail()}","async function openDetail(id){state.detail={id,range:state.range};$('#detailModal .modalPanel').classList.remove('categoryMode397');$('#saveDetail').style.display='';$('#detailModal').classList.add('open');await drawDetail()}",1)

# Micro-chart and category-modal layout. Six-month horizon produces six columns; x labels stay on the axis.
css=r'''
/* 3.9.7 category drill-down + indexed micro columns */
.categoryMode397{grid-template-rows:auto auto minmax(170px,.85fr) minmax(220px,1.15fr)!important;overflow:hidden}.categoryMode397 .modalChart{min-height:170px}.categoryMode397 #detailStats{display:grid;grid-template-rows:auto minmax(0,1fr);gap:8px;min-height:0}.categorySummary397{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.driverArea397{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr);gap:6px}.categoryMode397 .microGrid393{grid-template-columns:repeat(2,minmax(0,1fr));height:100%;min-height:0}.micro397{grid-template-rows:auto auto minmax(92px,1fr);gap:5px;overflow:hidden}.microHead397,.microValues397{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.microChange397{font-size:12px;font-weight:900;color:var(--text)}.microValues397 span{display:grid;gap:1px}.microValues397 span:last-child{text-align:right}.microValues397 small{font-size:9px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.microValues397 b{font-size:11px}.microPlot397{display:grid;grid-template-columns:22px minmax(0,1fr);gap:5px;min-height:92px}.microYAxis397{display:flex;flex-direction:column;justify-content:space-between;color:var(--muted);font-size:8px;padding:1px 0 17px;text-align:right}.microBars397{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(12px,1fr);align-items:end;gap:4px;border-left:1px solid var(--line);border-bottom:1px solid var(--line);padding:2px 3px 0;min-width:0}.microBucket397{height:100%;display:grid;grid-template-rows:minmax(0,1fr) 16px;align-items:end;min-width:0}.microBar397{width:72%;max-width:24px;justify-self:center;background:linear-gradient(180deg,#6db7ff,#2a6fb4);border-radius:4px 4px 0 0;min-height:4px}.microX397{font-size:7px;color:var(--muted);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:clip;transform:translateY(1px)}
@media(max-width:720px){.categoryMode397{height:96vh!important;border-radius:16px!important;padding:12px!important;grid-template-rows:auto auto minmax(150px,.75fr) minmax(250px,1.25fr)!important}.categoryMode397 .microGrid393{grid-template-columns:1fr 1fr;gap:6px}.micro397{padding:7px}.microX397{font-size:6px}.categorySummary397{gap:5px}.categorySummary397 .stat{padding:6px;font-size:10px}}
'''
s=s.replace('</style>',css+'</style>',1)

p.write_text(s)
print('Patched Market Navigator to 3.9.7')
