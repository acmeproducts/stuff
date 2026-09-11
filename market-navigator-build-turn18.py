from pathlib import Path

SRC = Path('market-navigator-turn17-pre-ship.html')
DST = Path('market-navigator-turn18-pre-ship.html')
s = SRC.read_text()


def rep(old, new, label, count=1):
    global s
    if old not in s:
        raise SystemExit('missing Turn 17 anchor: ' + label)
    s = s.replace(old, new, count)


def rep_all(old, new, label):
    global s
    if old not in s:
        raise SystemExit('missing Turn 17 anchor: ' + label)
    s = s.replace(old, new)


rep('<title>Market Navigator · Turn 17</title>', '<title>Market Navigator · Turn 18</title>', 'title')
rep_all('TURN 17 PRE-SHIP', 'TURN 18 PRE-SHIP', 'visible build label')
rep_all('Market Navigator · Turn 17', 'Market Navigator · Turn 18', 'About build label')

helpers = r'''function renderDensity18(h){return h==='YTD'||h==='1YR'?'weekly':h==='3YR'||h==='5YR'?'monthly':'native'}function bucketKey18(t,density){let d=new Date(+t);if(!Number.isFinite(d.getTime()))return'';if(density==='monthly')return String(d.getUTCFullYear()*12+d.getUTCMonth());let day=Math.floor(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate())/86400000),dow=(new Date(day*86400000).getUTCDay()+6)%7;return String(day-dow)}function representative18(bucket){if(bucket.length<=1)return bucket[0];if(bucket.length===2)return bucket[1];let a=bucket[0],b=bucket[bucket.length-1],span=b.t-a.t||1,best=b,score=0;for(let i=1;i<bucket.length-1;i++){let q=bucket[i],f=(q.t-a.t)/span,expected=a.v+(b.v-a.v)*f,dev=Math.abs(q.v-expected);if(dev>score){score=dev;best=q}}return score>0?best:b}function displayPoints18(points,h){let density=renderDensity18(h);if(density==='native'||!Array.isArray(points)||points.length<3)return points||[];let a=[...points].sort((x,y)=>x.t-y.t),groups=[],lastKey=null;for(let q of a){let k=bucketKey18(q.t,density);if(k!==lastKey){groups.push([]);lastKey=k}groups[groups.length-1].push(q)}let out=groups.map(representative18).filter(Boolean),first=a[0],last=a[a.length-1];if(!out.length||out[0].t!==first.t)out.unshift(first);if(out[out.length-1].t!==last.t)out.push(last);out.sort((x,y)=>x.t-y.t);return out.filter((q,i)=>!i||q.t!==out[i-1].t)}'''

start = "function draw(which,sets,w,mode='indexed'){"
end = 'function legend(sets)'
a = s.find(start)
b = s.find(end, a)
if a < 0 or b < 0:
    raise SystemExit('missing Turn 17 draw anchors')
draw = s[a:b]

replacements = [
    ("function plot(z){if(!z.a.length)return;", "function plot(z){let da=displayPoints18(z.a,w.horizon);if(!da.length)return;", 'display points entry'),
    ("maxPoints=Math.max(1,...bars.map(z=>z.a.length))", "maxPoints=Math.max(1,...bars.map(z=>displayPoints18(z.a,w.horizon).length))", 'bar point density'),
    ("for(let q of z.a){", "for(let q of da){", 'bar displayed observations'),
    ("z.a.forEach((q,i)=>", "da.forEach((q,i)=>", 'line displayed observations'),
    ("c.dataset.activeSeries=focusId?(ref?.id||''):'';c.dataset.emphasis=focusId?'true':'false';return{p,pw,ph,scales,W,H,xy}", "let sourceCount=sets.reduce((n,z)=>n+z.a.length,0),renderedCount=sets.reduce((n,z)=>n+displayPoints18(z.a,w.horizon).length,0);c.dataset.activeSeries=focusId?(ref?.id||''):'';c.dataset.emphasis=focusId?'true':'false';c.dataset.renderDensity=renderDensity18(w.horizon);c.dataset.sourcePoints=String(sourceCount);c.dataset.renderedPoints=String(renderedCount);return{p,pw,ph,scales,W,H,xy}", 'render density diagnostics'),
]
for old, new, label in replacements:
    if old not in draw:
        raise SystemExit('missing Turn 17 draw anchor: ' + label)
    draw = draw.replace(old, new, 1)

s = s[:a] + helpers + draw + s[b:]

# Explicit contract marker for static qualification and future maintainers.
marker = "<script>\n(()=>{'use strict';"
rep(marker, "<script>\n/* TURN18_DISPLAY_DENSITY: 1D/5D/MTD native; YTD/1YR weekly; 3YR/5YR monthly. Rendering only; full real observations remain canonical for inspection/data/export/AI. */\n(()=>{'use strict';", 'Turn 18 contract marker')

DST.write_text(s)
print('TURN 18 BUILD: PASS')
