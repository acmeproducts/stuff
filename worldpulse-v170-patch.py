from pathlib import Path
import re

p=Path('globe.html')
s=p.read_text(encoding='utf-8')

s=s.replace('WorldPulse v1.6.0','WorldPulse v1.7.0').replace('v1.6.0','v1.7.0')

css='''
/* v1.7: fast region reading workspace */
@media(min-width:901px){
.app.globeCollapsed{grid-template-columns:0 minmax(0,1fr)}
.app.globeCollapsed .rightPanel{margin-right:48vw;min-width:0;grid-template-rows:46% 54%;transition:margin-right .12s ease}
.app.globeCollapsed ~ .reader{transform:none!important;width:48vw;top:62px;box-shadow:-8px 0 24px #0005}
.app.globeCollapsed ~ .readerBack{display:none!important}
.app.globeCollapsed ~ .reader .readerHead{background:#081522}
}
.readerEmpty{height:100%;display:grid;place-items:center;padding:28px;text-align:center;color:var(--muted);font-size:12px;line-height:1.55}
.readerEmpty b{display:block;color:var(--text);font-size:16px;margin-bottom:6px}
'''
if '/* v1.7: fast region reading workspace */' not in s:
    s=s.replace('</style>',css+'\n</style>',1)

old='function selectChild(n){const l=nextLevel();if(l==="region")selection={region:n.name,country:null,admin1:null,city:null};else if(l==="country")selection.country=n.name;else if(l==="admin1")selection.admin1=n.name;else if(l==="city")selection.city=n.name;renderAll(true)}'
new='''function readerPlaceholder(){if(!E.readerBody)return;E.readerBody.innerHTML='<div class="readerEmpty"><div><b>Select a headline</b>Use the upper middle pane to choose country, state/province/county and city. The lower middle pane lists headlines. Selecting a headline opens the publisher story here.</div></div>';if(E.readerSourceTop){E.readerSourceTop.textContent="Source opens with selected story";E.readerSourceTop.href="#";E.readerSourceTop.style.pointerEvents="none"}}
function enterBrowseMode(){if(!selection.region)return;E.app.classList.add("globeCollapsed");if(globe&&globe.pauseAnimation)globe.pauseAnimation();if(!readerArticle)readerPlaceholder();log(`Fast browse mode · ${selection.region} · globe paused`)}
function leaveBrowseMode(){E.app.classList.remove("globeCollapsed");if(globe&&globe.resumeAnimation)globe.resumeAnimation();setTimeout(()=>{if(globe){const el=$("globe");globe.width(el.clientWidth).height(el.clientHeight);renderGlobe(true)}},120);log("Globe resumed")}
function selectChild(n){const l=nextLevel();if(l==="region"){selection={region:n.name,country:null,admin1:null,city:null};enterBrowseMode();renderSummary();renderCrumbs();renderChildren();renderArticles();return}else if(l==="country")selection.country=n.name;else if(l==="admin1")selection.admin1=n.name;else if(l==="city")selection.city=n.name;renderSummary();renderCrumbs();renderChildren();renderArticles()}'''
if old not in s: raise SystemExit('selectChild not found')
s=s.replace(old,new,1)

old='function goToLevel(level){if(level==="world")selection={region:null,country:null,admin1:null,city:null};if(level==="region")selection={region:selection.region,country:null,admin1:null,city:null};if(level==="country")selection={region:selection.region,country:selection.country,admin1:null,city:null};if(level==="admin1")selection={region:selection.region,country:selection.country,admin1:selection.admin1,city:null};renderAll(true)}'
new='function goToLevel(level){if(level==="world"){selection={region:null,country:null,admin1:null,city:null};leaveBrowseMode();renderAll(true);return}if(level==="region")selection={region:selection.region,country:null,admin1:null,city:null};if(level==="country")selection={region:selection.region,country:selection.country,admin1:null,city:null};if(level==="admin1")selection={region:selection.region,country:selection.country,admin1:selection.admin1,city:null};renderSummary();renderCrumbs();renderChildren();renderArticles()}'
if old not in s: raise SystemExit('goToLevel not found')
s=s.replace(old,new,1)

s=s.replace('selection={region:r.name,country:c.name,admin1:null,city:null};renderAll(true);return','selection={region:r.name,country:c.name,admin1:null,city:null};enterBrowseMode();renderSummary();renderCrumbs();renderChildren();renderArticles();return',1)

start=s.find('function renderGlobe(zoom=false){')
end=s.find('\nfunction renderAll(',start)
if start<0 or end<0: raise SystemExit('renderGlobe bounds not found')
new_globe='''function renderGlobe(zoom=false){
 if(!globe||!index)return;
 if(E.app.classList.contains("globeCollapsed")&&selection.region){debug();return}
 visibleMarkers=markerRows().filter(Boolean).slice(0,selection.region?45:10);
 globe.pointsData(visibleMarkers).pointLat(n=>nodeLat(n)).pointLng(n=>nodeLon(n)).pointAltitude(n=>Math.min(.018,.004+Math.log10(n.count+1)*.004)).pointRadius(n=>Math.min(.17,.05+Math.log10(n.count+1)*.025)).pointColor(n=>toneColor(nodeTone(n))).pointLabel(n=>`<div style="background:#07101ded;border:1px solid #33516f;border-radius:8px;padding:7px 9px;color:#edf4ff;font:11px system-ui"><b>${esc(n.name)}</b><br>${Math.round(n.count).toLocaleString()} weighted mentions</div>`).onPointClick(n=>selectChild(n));
 globe.ringsData([]);if(globe.htmlElementsData)globe.htmlElementsData([]);
 if(zoom){const n=currentNode();if(selection.region&&n)globe.pointOfView({lat:nodeLat(n),lng:nodeLon(n),altitude:selection.country?.62:1.05},260);else globe.pointOfView({lat:18,lng:10,altitude:2.05},260)}debug()
}'''
s=s[:start]+new_globe+s[end:]

s=s.replace('E.reader.classList.add("open");E.readerBack.classList.add("open")','E.reader.classList.add("open");if(!E.app.classList.contains("globeCollapsed"))E.readerBack.classList.add("open")',1)
old='function closeReader(){speechSynthesis?.cancel();E.reader.classList.remove("open");E.readerBack.classList.remove("open")}'
new='function closeReader(){speechSynthesis?.cancel();readerArticle=null;E.readerBack.classList.remove("open");E.reader.classList.remove("open");if(E.app.classList.contains("globeCollapsed")&&selection.region)readerPlaceholder()}'
if old not in s: raise SystemExit('closeReader not found')
s=s.replace(old,new,1)

start=s.find('E.menu.addEventListener("click"')
end=s.find('E.brandBtn.addEventListener',start)
if start<0 or end<0: raise SystemExit('menu listener bounds not found')
s=s[:start]+'E.menu.addEventListener("click",()=>{if(E.app.classList.contains("globeCollapsed")){leaveBrowseMode()}else{E.app.classList.add("globeCollapsed");if(globe&&globe.pauseAnimation)globe.pauseAnimation();if(selection.region&&!readerArticle)readerPlaceholder()}});'+s[end:]

s=s.replace('E.dbgMarkers.textContent=visibleMarkers.length','E.dbgMarkers.textContent=E.app.classList.contains("globeCollapsed")?"paused":visibleMarkers.length',1)

# Keep capitals cached, but do not force an expensive globe repaint when background data arrives.
s=s.replace('if(index)renderGlobe(false);return true','return true')

p.write_text(s,encoding='utf-8')
print('patched',len(s))
