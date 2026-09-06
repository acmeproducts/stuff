from pathlib import Path

SRC=Path('market-navigator-turn06-pre-ship.html')
DST=Path('market-navigator-turn07-pre-ship.html')
s=SRC.read_text()

s=s.replace('<title>Market Navigator · Turn 06</title>','<title>Market Navigator · Turn 07</title>')
s=s.replace('TURN 06 PRE-SHIP','TURN 07 PRE-SHIP')

# Analysis layout: series legend belongs above the plot, not below it.
s=s.replace('.analysis{height:100%;display:grid;grid-template-rows:42px 38px minmax(0,1fr) 42px}',
            '.analysis{height:100%;display:grid;grid-template-rows:42px 38px 42px minmax(0,1fr)}')
s=s.replace('.seriesBar{border-top:1px solid var(--line);padding:5px 8px;display:flex;gap:5px;align-items:center;overflow-x:auto}',
            '.seriesBar{border-bottom:1px solid var(--line);padding:5px 8px;display:flex;gap:5px;align-items:center;overflow-x:auto;background:#081522}.seriesLegend{display:inline-flex;align-items:center;gap:5px}.seriesX{font-weight:900;opacity:.8;margin-left:2px}.aboutCard{position:absolute;z-index:15;right:24px;top:70px;width:min(390px,calc(100% - 48px));padding:12px;box-shadow:0 18px 50px #000a}.pickerRow{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px;align-items:center}.pickerRow .rowMain{min-width:0}.pickerRow .btn{padding:5px 7px;font-size:9px}')

old='<div class="analysisHz" id="analysisHz"></div><div class="analysisBody">'
new='<div class="analysisHz" id="analysisHz"></div><div class="seriesBar" id="seriesBar"></div><div class="analysisBody">'
s=s.replace(old,new)
s=s.replace('</div><div class="seriesBar" id="seriesBar"></div><div class="picker hidden" id="seriesPicker">','</div><div class="picker hidden" id="seriesPicker">')
s=s.replace('<div class="statsPanel hidden" id="statsPanel">','<div class="card aboutCard hidden" id="seriesAbout"></div><div class="statsPanel hidden" id="statsPanel">')

# Make dual-axis ownership explicit and color-coded.
s=s.replace("x.fillStyle='#91a8bb';x.textAlign=a?'right':'left';x.fillText(fmt(v),a?W-3:3,yy+3)",
            "x.fillStyle=dual?(sets[a]?.color||'#91a8bb'):'#91a8bb';x.textAlign=a?'right':'left';x.fillText(fmt(v),a?W-3:3,yy+3)")
s=s.replace("x.fillStyle='#91a8bb';x.font='9px system-ui';x.textAlign=a?'right':'left';let u=mode==='indexed'?'Indexed 100':(sets[a]?.unit||'');if(u)x.fillText(u,a?W-3:3,12)",
            "x.fillStyle=dual?(sets[a]?.color||'#91a8bb'):'#91a8bb';x.font='9px system-ui';x.textAlign=a?'right':'left';let u=mode==='indexed'?'Indexed 100':(sets[a]?.unit||'');if(u)x.fillText(u,a?W-3:3,12)")

# Add helper for source freshness / About card. Picker uses canonical latest observation synchronously;
# About loads the source file and exposes collector update timestamp separately.
needle="function axisMode(ids){if(ids.length<=1)return'native';let f=[...new Set(ids.map(family))];if(f.length===1)return'native';if(ids.length===2)return'dual';return'indexed'}"
insert=needle+"function latestLabel(id){let h=health(id),raw=h.actualLatestCanonicalObservation||h.latestObservation||null;return raw?String(raw):'—'}function updatedLabel(id,s){let h=health(id),raw=s?.last_successful||s?.lastSuccessful||h.lastSuccessful||h.last_successful||null;return raw?new Date(raw).toLocaleString():'—'}async function showSeriesAbout(id){let s=await getSeries(id),c=cat(id),h=health(id),last=(s.observations||[]).at(-1),box=$('seriesAbout');box.innerHTML=`<h3>${esc(label(id))} · ${esc(name(id))}</h3><div class=\"kv\"><span>Provider</span><span>${esc(c.provider||h.provider||'—')}</span><span>Unit</span><span>${esc(c.native_unit||'—')}</span><span>Cadence</span><span>${esc(c.native_cadence||s.cadence||'—')}</span><span>Updated</span><span>${esc(updatedLabel(id,s))}</span><span>Latest observation</span><span>${last?full(last.t)+' · '+fmt(last.v):'—'}</span><span>Health</span><span>${esc(h.classification||'unknown')}</span><span>Description</span><span>${esc(c.description||s.description||'')}</span></div><div class=\"actions\">${c.source_reference_url?`<a class=\"btn\" href=\"${esc(c.source_reference_url)}\" target=\"_blank\" rel=\"noopener\">Source</a>`:''}<button class=\"btn\" id=\"closeSeriesAbout\">×</button></div>`;box.classList.remove('hidden');$('closeSeriesAbout').onclick=()=>box.classList.add('hidden')}"
s=s.replace(needle,insert)

# Analysis legend chips: top, color-bound to their line, every series removable while preserving at least one.
old="$('seriesBar').innerHTML=loaded.map(z=>`<button class=\"chip ${z.id===S.analysisActive?'on':''}\" data-id=\"${z.id}\">${esc(z.label)}${z.id===S.analysisRoot?'':' ×'}</button>`).join('')+`<button class=\"btn\" id=\"addSeries\">Add</button><button class=\"btn\" id=\"stats\">Stats</button><button class=\"btn\" id=\"runAI\">AI</button><button class=\"btn\" id=\"printBtn\">Print</button><button class=\"btn\" id=\"downloadBtn\">DL</button>`;$('seriesBar').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{let id=b.dataset.id;if(id!==S.analysisRoot&&S.analysisActive===id){S.analysisSeries=S.analysisSeries.filter(x=>x!==id);S.analysisActive=S.analysisRoot;renderAnalysis()}else{S.analysisActive=id;$('analysisTip').style.display='none';renderAnalysis()}});"
new="$('seriesBar').innerHTML=loaded.map(z=>`<button class=\"chip ${z.id===S.analysisActive?'on':''}\" data-id=\"${z.id}\" style=\"border-color:${z.color};box-shadow:inset 3px 0 ${z.color}\"><span class=\"seriesLegend\"><span class=\"sw\" style=\"background:${z.color}\"></span>${esc(z.label)}<span class=\"seriesX\" data-rm=\"${z.id}\">×</span></span></button>`).join('')+`<button class=\"btn\" id=\"addSeries\">Add</button><button class=\"btn\" id=\"stats\">Stats</button><button class=\"btn\" id=\"runAI\">AI</button><button class=\"btn\" id=\"printBtn\">Print</button><button class=\"btn\" id=\"downloadBtn\">DL</button>`;$('seriesBar').querySelectorAll('[data-id]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-rm]'))return;S.analysisActive=b.dataset.id;$('analysisTip').style.display='none';renderAnalysis()});$('seriesBar').querySelectorAll('[data-rm]').forEach(x=>x.onclick=e=>{e.stopPropagation();if(S.analysisSeries.length<=1)return;let id=x.dataset.rm;S.analysisSeries=S.analysisSeries.filter(v=>v!==id);if(S.analysisRoot===id)S.analysisRoot=S.analysisSeries[0];if(S.analysisActive===id)S.analysisActive=S.analysisRoot;renderAnalysis()});"
if old not in s: raise SystemExit('seriesBar anchor not found')
s=s.replace(old,new)

# Axis badge must explicitly tell the user what each native axis owns.
old="$('axisBadge').textContent=mode==='dual'?'Y1 + Y2':mode==='indexed'?'Indexed 100':'Native Y1';"
new="$('axisBadge').textContent=mode==='dual'?`Y1 ${loaded[0]?.unit||''} · Y2 ${loaded[1]?.unit||''}`:mode==='indexed'?'Indexed 100':'Native Y1';"
s=s.replace(old,new)

# Add picker: expose cadence + canonical latest observation immediately; About shows full info and collector update timestamp.
old="function renderPicker(q=''){let ids=S.catalog.series.map(x=>x.id).filter(id=>!S.analysisSeries.includes(id)&&`${id} ${name(id)} ${label(id)}`.toLowerCase().includes(q.toLowerCase()));$('pickerList').innerHTML=ids.map(id=>`<div class=\"row\" data-id=\"${id}\"><strong>${esc(label(id))} · ${esc(name(id))}</strong><span class=\"rowMeta\">${esc(unit(id)||'—')} · ${esc(cat(id).native_cadence||'')}</span></div>`).join('');$('pickerList').querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{S.analysisSeries.push(r.dataset.id);S.analysisActive=r.dataset.id;$('seriesPicker').classList.add('hidden');renderAnalysis()})}"
new="function renderPicker(q=''){let ids=S.catalog.series.map(x=>x.id).filter(id=>!S.analysisSeries.includes(id)&&`${id} ${name(id)} ${label(id)}`.toLowerCase().includes(q.toLowerCase()));$('pickerList').innerHTML=ids.map(id=>`<div class=\"row pickerRow\" data-id=\"${id}\"><div class=\"rowMain\"><strong>${esc(label(id))} · ${esc(name(id))}</strong><span class=\"rowMeta\">${esc(unit(id)||'—')} · ${esc(cat(id).native_cadence||'—')} · updated ${esc(latestLabel(id))}</span></div><button class=\"btn\" data-about=\"${id}\">About</button><button class=\"btn\" data-add=\"${id}\">Add</button></div>`).join('');$('pickerList').querySelectorAll('[data-about]').forEach(b=>b.onclick=e=>{e.stopPropagation();showSeriesAbout(b.dataset.about)});$('pickerList').querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();let id=b.dataset.add;S.analysisSeries.push(id);S.analysisActive=id;$('seriesPicker').classList.add('hidden');$('seriesAbout').classList.add('hidden');renderAnalysis()})}"
if old not in s: raise SystemExit('picker anchor not found')
s=s.replace(old,new)

# Close modal cleans transient About surface.
s=s.replace("$('statsPanel').classList.add('hidden');if(S.lineage==='NOW'", "$('statsPanel').classList.add('hidden');$('seriesAbout').classList.add('hidden');if(S.lineage==='NOW'")

DST.write_text(s)
print(DST)
