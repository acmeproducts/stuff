#!/usr/bin/env python3
"""Build mkt/lineage/index.html from list.json, code-scan.json and functional.json.
Layout follows repo-live-lineage-v4.html: a variant timeline, tabs (Scorecard / Preview / Side-by-side),
side-by-side = two filtered selects with live iframes."""
import json, re, html
from pathlib import Path
H = Path(__file__).resolve().parent
L = json.load(open(H/'list.json')); C = json.load(open(H/'code-scan.json')); F = json.load(open(H/'functional.json'))
for k, h, mk, n in L:
    s = open(H/'live'/f'{k}.html').read(); C[k]['groupedY2'] = bool(re.search(r"z\.axis=mode==='dual'\?\(plan\.map", s))
E = html.escape
def yn(v): return ('y', 'yes') if v else ('n', 'no')
def cell(cls, txt, title=''): return f'<td class="{cls}" title="{E(title)}">{E(txt)}</td>'
rows = []
for k, h, mk, n in L:
    f = F.get(k, {}); d = f.get('analysis_detail', {}) or {}
    tips = f.get('tips') or 0; cards = f.get('cards') or 0
    an = f.get('analysis', 'none'); anc = {'full': 'y', 'partial': 'p', 'none': 'n'}[an]
    andet = f"opens: {d.get('surface') or 'no'}; horizon switch: {d.get('horizon_switch')}; add series: {d.get('add_series')}; chart drawn: {d.get('chart_drawn')}"
    lib = f.get('library', 'none'); libc = {'yes': 'y', 'partial': 'p', 'none': 'n'}[lib]
    lp = f.get('longpress_card'); errs = f.get('errs') or []
    rows.append(f'<tr data-id="{k}"><td><button class="rowBtn" data-preview="{k}">{k}</button></td>'
        + cell(*yn(C[k]['fixedHorizon'])) + cell(*yn(C[k]['dualOption'])) + cell(*yn(C[k]['groupedY2']))
        + cell('y' if tips else 'n', 'yes' if tips else 'no', f"line taps that showed a tooltip: {tips} of 42")
        + cell('n' if cards else 'y', 'YES' if cards else 'no', f"cards opened by taps on lines/plot: {cards} of 42")
        + cell('y' if lp else 'n', 'yes' if lp else 'no')
        + cell(anc, an, andet) + cell(libc, lib, 'Plain/Technical/Standard switch: ' + str(f.get('library_detail')))
        + cell('y' if not errs else 'n', 'none' if not errs else errs[0][:40], '; '.join(errs)) + '</tr>')
hdr = ['turn', 'Fixed/Horizon (code)', 'Y2 option (code)', 'Y2 groups same measure (code)', 'Crosshair on line tap (tested)',
       'Card from series line / plot tap (tested; should be no)', 'Card from legend chip long-press (tested)', 'Analysis (tested)',
       'Library Plain/Standard/Technical (tested)', 'Page errors (tested)']
timeline = ''.join(f'<li><button class="tl" data-preview="{k}">{k}<small>blob {h}</small></button></li>' for k, h, mk, n in L)
opts = ''.join(f'<option value="{k}">{k}</option>' for k, h, mk, n in L)
page = f'''<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Market Navigator lineage</title>
<style>
:root{{--bg:#06101c;--panel:#0b1a2c;--line:#1f3a57;--text:#dbe6f2;--muted:#9fb3c8;--link:#9fd3ff}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:14px/1.4 system-ui,sans-serif}}
.app{{display:grid;grid-template-columns:230px 1fr;min-height:100vh}}.sidebar{{background:var(--panel);border-right:1px solid var(--line);padding:10px;overflow:auto;max-height:100vh}}
.sidebar h1{{font-size:16px;margin:0 0 2px}}.sidebar p{{margin:0 0 8px;color:var(--muted);font-size:12px}}.sidebar input{{width:100%;background:#061120;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px;margin-bottom:8px}}
.sidebar ul{{list-style:none;margin:0;padding:0}}.tl{{display:block;width:100%;text-align:left;background:none;border:1px solid transparent;color:var(--text);padding:5px 6px;border-radius:6px;font-size:13px}}.tl small{{display:block;color:var(--muted);font-size:11px}}.tl.on{{border-color:var(--link);background:#0f2440}}
.main{{padding:10px;min-width:0}}.tabs{{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}}.tab{{background:var(--panel);border:1px solid var(--line);color:var(--text);padding:7px 12px;border-radius:8px}}.tab.active{{border-color:var(--link);color:var(--link)}}
.panel{{display:none}}.panel.active{{display:block}}.muted{{color:var(--muted);font-size:13px}}
table{{border-collapse:collapse;font-size:12px}}th,td{{border:1px solid var(--line);padding:3px 6px;white-space:nowrap}}td.y{{color:#7fe3a1}}td.n{{color:#f08a8a}}td.p{{color:#f5d07a}}.rowBtn{{background:none;border:0;color:var(--link);font-size:12px;padding:0;text-decoration:underline}}tr.on td{{background:#0f2440}}
.frame{{width:100%;height:80vh;border:1px solid var(--line);border-radius:8px;background:#000}}
.cmpGrid{{display:grid;grid-template-columns:1fr 1fr;gap:10px}}.cmpCell{{min-width:0}}.cmpCtl{{display:grid;gap:4px;margin-bottom:6px}}.cmpCtl input,.cmpCtl select{{width:100%;background:#061120;color:var(--text);border:1px solid var(--line);border-radius:6px;padding:6px}}
.btn{{background:var(--panel);border:1px solid var(--line);color:var(--text);padding:6px 10px;border-radius:6px}}a{{color:var(--link)}}
#sbToggle{{position:fixed;top:8px;left:8px;z-index:5;display:none}}
@media(max-width:900px){{.app{{grid-template-columns:1fr}}.sidebar{{display:none}}.sidebar.open{{display:block;position:fixed;inset:0;z-index:4}}#sbToggle{{display:block}}.main{{padding-top:44px}}.cmpGrid{{grid-template-columns:1fr}}.cmpGrid.split{{grid-template-columns:1fr 1fr}}.frame{{height:70vh}}}}
</style></head><body>
<button id="sbToggle" class="btn" type="button">☰ versions</button>
<div class="app"><aside class="sidebar" id="sidebar"><h1>Market Navigator lineage</h1><p>Every turn page in the repo, live on the current backend</p><input id="tlFilter" type="search" placeholder="Filter versions"><ul id="timeline">{timeline}</ul></aside>
<div class="main">
<div class="tabs"><button class="tab active" data-tab="scorePanel">Scorecard</button><button class="tab" data-tab="previewPanel">Preview</button><button class="tab" data-tab="comparePanel">Side-by-side</button></div>
<section id="scorePanel" class="panel active"><p class="muted">Columns marked tested were run by automation on each live page with the current backend: 42 taps on plotted lines and plot area (crosshair/tooltip should show, the card should not); legend chip long-press (card should open); Analysis = opens from the card, horizon switch changes the view, add-series adds a chip, chart has pixels; Library = a seeded analysis with three interpretations, each tab must show its own text. Tap a cell for detail; tap a turn to preview it.</p>
<div style="overflow-x:auto"><table><tr>{''.join(f'<th>{t}</th>' for t in hdr)}</tr>{''.join(rows)}</table></div></section>
<section id="previewPanel" class="panel"><div class="muted" id="previewMeta">Select a version.</div><iframe id="previewFrame" class="frame" title="Preview"></iframe></section>
<section id="comparePanel" class="panel"><p class="muted">Live side-by-side. Each side runs its own copy on the current backend. <button class="btn" id="swapBtn">Swap</button> <button class="btn" id="splitBtn">Split on phone</button></p>
<div class="cmpGrid" id="cmpGrid">
<div class="cmpCell"><div class="cmpCtl"><label>Left version</label><input id="leftFilter" type="search" placeholder="Filter left list"><select id="leftSelect">{opts}</select><div class="muted" id="leftMeta"></div></div><iframe id="leftFrame" class="frame" title="Left"></iframe></div>
<div class="cmpCell"><div class="cmpCtl"><label>Right version</label><input id="rightFilter" type="search" placeholder="Filter right list"><select id="rightSelect">{opts}</select><div class="muted" id="rightMeta"></div></div><iframe id="rightFrame" class="frame" title="Right"></iframe></div>
</div></section>
</div></div>
<script>
const ALL={json.dumps([k for k,h,mk,n in L])};const $=id=>document.getElementById(id);const q=new URLSearchParams(location.search);
function tab(id){{document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===id));$('sidebar').classList.remove('open')}}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
$('sbToggle').onclick=()=>$('sidebar').classList.toggle('open');
function preview(k){{$('previewFrame').src='live/'+k+'.html';$('previewMeta').innerHTML=k+' · <a href="live/'+k+'.html" target="_blank" rel="noopener">open full ↗</a>';document.querySelectorAll('[data-preview]').forEach(b=>b.classList.toggle('on',b.dataset.preview===k));document.querySelectorAll('tr[data-id]').forEach(r=>r.classList.toggle('on',r.dataset.id===k));tab('previewPanel');const u=new URL(location.href);u.searchParams.set('v',k);history.replaceState(null,'',u)}}
document.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>preview(b.dataset.preview));
$('tlFilter').oninput=()=>{{const s=$('tlFilter').value.toLowerCase();document.querySelectorAll('#timeline li').forEach(li=>li.style.display=li.textContent.toLowerCase().includes(s)?'':'none')}};
function fill(side,keep){{const f=$(side+'Filter').value.toLowerCase(),sel=$(side+'Select');const list=ALL.filter(k=>k.includes(f));sel.innerHTML=list.map(k=>'<option value="'+k+'">'+k+'</option>').join('');sel.value=list.includes(keep)?keep:(list[0]||'');load(side)}}
function load(side){{const k=$(side+'Select').value;if(!k)return;$(side+'Frame').src='live/'+k+'.html';$(side+'Meta').innerHTML=k+' · <a href="live/'+k+'.html" target="_blank" rel="noopener">open full ↗</a>';const u=new URL(location.href);u.searchParams.set(side,k);history.replaceState(null,'',u)}}
['left','right'].forEach(s=>{{$(s+'Filter').oninput=()=>fill(s,$(s+'Select').value);$(s+'Select').onchange=()=>load(s)}});
$('swapBtn').onclick=()=>{{const a=$('leftSelect').value,b=$('rightSelect').value;fill('left',b);fill('right',a)}};
$('splitBtn').onclick=()=>$('cmpGrid').classList.toggle('split');
fill('left',q.get('left')||'turn31-pre-ship');fill('right',q.get('right')||'turn28-pre-ship-stage');
if(q.get('v'))preview(q.get('v'));
</script></body></html>'''
open(H/'index.html', 'w').write(page); print('built', len(page))
