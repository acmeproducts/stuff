from pathlib import Path


SRC = Path("market-navigator-turn10-pre-ship.html")
DST = Path("market-navigator-turn13-pre-ship.html")
s = SRC.read_text()


def replace(old: str, new: str, label: str) -> None:
    global s
    if old not in s:
        raise SystemExit(f"missing Turn 10 anchor: {label}")
    s = s.replace(old, new)


def replace_range(start_anchor: str, end_anchor: str, new: str, label: str) -> None:
    global s
    start = s.find(start_anchor)
    if start < 0:
        raise SystemExit(f"missing Turn 10 start anchor: {label}")
    end = s.find(end_anchor, start)
    if end < 0:
        raise SystemExit(f"missing Turn 10 end anchor: {label}")
    s = s[:start] + new + s[end:]


replace("<title>Market Navigator · Turn 10</title>", "<title>Market Navigator · Turn 13</title>", "title")
replace("TURN 10 PRE-SHIP", "TURN 13 PRE-SHIP", "visible build")

# V3 remains a full-width analytical chart. The obsolete evidence sidebar is not
# allowed to shrink the chart or reappear as a right panel.
replace(
    ".analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:8px;padding:8px}",
    ".analysisBody{min-height:0;display:grid;grid-template-columns:minmax(0,1fr);gap:0;padding:0}.analysisPlot{width:100%;height:100%}",
    "full-width analysis",
)
replace(
    ".analysisBody{grid-template-columns:1fr;padding:5px}",
    ".analysisBody{grid-template-columns:1fr;padding:0}",
    "phone analysis width",
)
replace(
    '<div class="card evidence" id="analysisEvidence"></div>',
    '<div id="analysisEvidence" class="hidden"></div>',
    "obsolete analysis sidebar",
)

# The V2 component bridge is a compact bottom card over the same chart footprint,
# never an unsolicited right-side panel.
replace(
    ".info{position:absolute;right:12px;top:56px;width:min(355px,calc(100% - 24px));z-index:7;padding:12px;box-shadow:0 14px 45px #0008}",
    ".info{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);width:min(720px,calc(100% - 24px));max-height:min(44%,320px);overflow:auto;z-index:7;padding:12px;box-shadow:0 14px 45px #0008}",
    "component card geometry",
)

# Library visibly owns the immutable saved chart above the persistent transcript.
replace(
    ".libDetail{height:100%;min-height:0;display:grid;grid-template-rows:38px minmax(0,1fr) auto;border-radius:0 10px 10px 0}",
    ".libDetail{height:100%;min-height:0;display:grid;grid-template-rows:38px minmax(170px,42%) minmax(0,1fr) auto;border-radius:0 10px 10px 0}",
    "Library chart row",
)
replace(
    ".libHead strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".libHead strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.libBack{display:none}.libTitleEdit{width:100%;min-width:0;border:0;border-bottom:1px solid transparent;background:transparent;color:var(--text);font:inherit;font-weight:800;outline:none}.libTitleEdit:focus{border-bottom-color:var(--accent)}.libChartPane{min-height:0;display:grid;grid-template-rows:31px minmax(0,1fr) 25px;border-bottom:1px solid var(--line);background:#071522}.libChartHead{display:flex;align-items:center;gap:6px;padding:4px 7px;border-bottom:1px solid var(--grid)}.libChartLegend{display:flex;gap:3px;min-width:0;overflow-x:auto;scrollbar-width:none}.libChartLegend::-webkit-scrollbar{display:none}.libChartLegend .lg{font-size:9px;padding:2px 4px}.libChartAxis{margin-left:auto;color:var(--muted);font-size:9px;white-space:nowrap}.libChartWrap{position:relative;min-height:0;touch-action:none}.libChartError{position:absolute;inset:0;display:grid;place-items:center;padding:12px;color:var(--bad);background:#071522;z-index:3}.libChartMeta{border-top:1px solid var(--grid);padding:4px 7px;color:var(--muted);font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    "Library chart styling",
)
replace(
    ".field{grid-template-columns:1fr}}",
    ".field{grid-template-columns:1fr}.library{--libw:100%;grid-template-columns:1fr}.library .libDetail{display:none}.library.detailOpen .libList{display:none}.library.detailOpen .libDetail{display:grid;border-radius:10px}.libBack{display:inline-flex}.libDetail{grid-template-rows:38px minmax(150px,34%) minmax(0,1fr) auto}.transcript{padding:9px 10px}}",
    "mobile Library list/detail",
)

old_library_head = '<div class="card libDetail"><div class="libHead"><strong id="libTitle">Library</strong><div class="grow"></div><button class="btn" id="libMoreBtn" aria-label="Analysis actions">⋯</button></div><div class="transcript" id="transcript">'
new_library_head = '<div class="card libDetail"><div class="libHead"><button class="btn libBack" id="libBack" aria-label="Back to analyses">‹</button><input class="libTitleEdit" id="libTitle" value="Library" aria-label="Analysis title"><div class="grow"></div><button class="btn" id="libMoreBtn" aria-label="Analysis actions">⋯</button></div><div class="libChartPane hidden" id="libChartPane"><div class="libChartHead"><div class="libChartLegend" id="libChartLegend"></div><span class="libChartAxis" id="libChartAxis"></span></div><div class="libChartWrap" id="libChartWrap"><canvas id="libChart" class="chart"></canvas><div id="libChartTip" class="tip"></div><div id="libChartError" class="libChartError hidden"></div></div><div class="libChartMeta" id="libChartMeta"></div></div><div class="transcript" id="transcript">'
replace(old_library_head, new_library_head, "Library chart markup")

# Image and spreadsheet continuity from the qualified Turn 10 recovery diff.
replace(
    'title="Attach image" aria-label="Attach image">📎</button><input id="attachInput" type="file" accept="image/*" multiple',
    'title="Attach image or spreadsheet" aria-label="Attach image or spreadsheet">📎</button><input id="attachInput" type="file" accept="image/*,.csv,.tsv,.xlsx,.xls,text/csv,text/tab-separated-values,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" multiple',
    "spreadsheet attachment input",
)
replace(
    "$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){if(!String(f.type).startsWith('image/'))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}",
    "$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){let n=String(f.name||'').toLowerCase(),t=String(f.type||'');if(!(t.startsWith('image/')||/\\.(csv|tsv|xlsx|xls)$/.test(n)||/csv|tab-separated|spreadsheet|excel/.test(t)))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()}",
    "spreadsheet attachment handler",
)

attachment_payload = r'''let XLSX_LOAD=null;async function loadXLSX(){if(window.XLSX)return window.XLSX;if(XLSX_LOAD)return XLSX_LOAD;XLSX_LOAD=new Promise((resolve,reject)=>{let q=document.createElement('script');q.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';q.async=true;q.onload=()=>resolve(window.XLSX);q.onerror=()=>reject(new Error('Spreadsheet parser could not load'));document.head.appendChild(q)});return XLSX_LOAD}async function attachmentPayload(meta){let r=await dbGet('attachments',meta.id);if(!r)return null;let type=String(r.type||meta.type||''),name=String(r.name||meta.name||''),low=name.toLowerCase();if(type.startsWith('image/'))return{...meta,dataUrl:await blobDataURL(r.blob)};if(/\.(csv|tsv)$/.test(low)||/csv|tab-separated/.test(type)){let text=await r.blob.text();return{...meta,text:text.slice(0,60000)}}if(/\.(xlsx|xls)$/.test(low)||/spreadsheet|excel/.test(type)){let X;try{X=await loadXLSX()}catch(e){return{...meta,text:`Spreadsheet attached: ${name}. Parser unavailable in this session.`}}let buf=await r.blob.arrayBuffer(),wb=X.read(buf,{type:'array'}),parts=[];for(let sn of wb.SheetNames.slice(0,4)){let csv=X.utils.sheet_to_csv(wb.Sheets[sn]);parts.push(`### Sheet: ${sn}\n${csv.slice(0,18000)}`)}return{...meta,text:parts.join('\n\n').slice(0,60000)}}return{...meta,text:`Attached file: ${name}`}}'''
replace_range("async function attachmentPayload(meta)", "const AIK=", attachment_payload, "attachment payload")

provider_messages = r'''async function providerMessages(msgs,p){let out=[];for(let m of msgs){let at=m.attachments||[],content=m.content||'';if(!at.length){out.push({role:m.role,content});continue}let imgs=[],docs=[];for(let a of at){let q=await attachmentPayload(a);if(!q)continue;if(q.dataUrl&&String(q.type).startsWith('image/'))imgs.push(q);else if(q.text)docs.push(q)}if(docs.length)content+='\n\n'+docs.map(q=>`Attached spreadsheet/file: ${q.name}\n\n${q.text}`).join('\n\n');if(p==='anthropic'){let parts=[{type:'text',text:content}];for(let q of imgs){let [head,data]=q.dataUrl.split(',');parts.push({type:'image',source:{type:'base64',media_type:q.type,data}})}out.push({role:m.role,content:parts})}else{let parts=[{type:'text',text:content}];for(let q of imgs)parts.push({type:'image_url',image_url:{url:q.dataUrl}});out.push({role:m.role,content:parts})}}return out}'''
replace_range("async function providerMessages(msgs,p)", "function responseText", provider_messages, "provider messages")

# Shared state and horizon helpers used by NOW, V3 and Library.
replace(
    "pendingAttachments:[],deletedOpen:false};",
    "pendingAttachments:[],deletedOpen:false,libraryActive:null,libraryChartSeq:0};",
    "Library chart state",
)
replace(
    "function windowFor(h=S.h,k=S.index||'risk'){let x=S.derived.indices[k].horizons[h];return{start:Date.parse(x.commonT0+'T00:00:00Z'),end:Date.parse(S.derived.commonMarketAnchor+'T23:59:59Z'),startLabel:x.commonT0,endLabel:S.derived.commonMarketAnchor}}",
    "function horizonWindow(h=S.h,k=S.index||'risk'){let x=S.derived.indices[k].horizons[h];return{horizon:h,start:Date.parse(x.commonT0+'T00:00:00Z'),end:Date.parse(S.derived.commonMarketAnchor+'T23:59:59Z'),startLabel:x.commonT0,endLabel:S.derived.commonMarketAnchor}}function windowFor(h=S.h,k=S.index||'risk'){return horizonWindow(h,k)}",
    "common horizon helper",
)
replace(
    "function indexed(s,w,dir=1){let b=baseline(s,w);if(!b||!Number.isFinite(+b.v)||+b.v===0)return[];return obsRange(s,w).map(p=>({t:p.t,v:100+dir*((p.v/+b.v)-1)*100,raw:p.v,sourceT:p.t}))}",
    "function indexed(s,w,dir=1){let b=baseline(s,w);if(!b||!Number.isFinite(+b.v)||+b.v===0)return[];return obsRange(s,w).map(p=>{let idx=100+dir*((p.v/+b.v)-1)*100;return{t:p.t,v:idx,idx,raw:p.v,sourceT:p.t}})}function nativeIndexed(s,w){let b=baseline(s,w);return obsRange(s,w).map(p=>({...p,idx:b&&Number.isFinite(+b.v)&&+b.v!==0?100+((p.v/+b.v)-1)*100:null}))}async function seriesAvailable(id,h=S.h,k=S.index||'risk'){try{return obsRange(await getSeries(id),horizonWindow(h,k)).length>0}catch{return false}}",
    "native and indexed inspection values",
)
replace(
    "function axisPlan(ids){let kinds=[...new Set(ids.map(unitKind))];if(kinds.length<=1)return{mode:'native',kinds,map:Object.fromEntries(ids.map(id=>[id,0]))};if(kinds.length===2){let map={};ids.forEach(id=>map[id]=kinds.indexOf(unitKind(id)));return{mode:'dual',kinds,map}}return{mode:'indexed',kinds,map:Object.fromEntries(ids.map(id=>[id,0]))}}",
    "function measurementFamily(id){let u=String(unit(id)||'').trim().toLowerCase().replace(/\\s+/g,' ');if(/index|indexed/.test(u))return'index:'+id;if(/usd per barrel/.test(u))return'price:usd/barrel';if(/usd per pound/.test(u))return'price:usd/pound';if(u==='usd'||u==='dollar'||u==='currency')return'price:usd';if(/percent|percentage point|basis point|bps/.test(u))return'rate:percent';if(/persons|people|claims|count|thousand|million|billion/.test(u))return'quantity:'+u;return'unit:'+(u||id)}function axisPlan(ids){let kinds=[...new Set(ids.map(measurementFamily))];if(kinds.length<=1)return{mode:'native',kinds,map:Object.fromEntries(ids.map(id=>[id,0]))};if(kinds.length===2){let map={};ids.forEach(id=>map[id]=kinds.indexOf(measurementFamily(id)));return{mode:'dual',kinds,map}}return{mode:'indexed',kinds,map:Object.fromEntries(ids.map(id=>[id,0]))}}",
    "measurement-family axis plan",
)

# One canonical drawing engine now supports the Library context directly.
replace(
    "function draw(which,sets,w,mode='indexed'){let c=$(which==='now'?'nowChart':'analysisChart'),tip=$(which==='now'?'nowTip':'analysisTip'),wrap=$(which==='now'?'nowWrap':'analysisWrap'),active=which==='now'?S.nowActive:S.analysisActive;let base;",
    "function draw(which,sets,w,mode='indexed'){let ids=which==='now'?['nowChart','nowTip','nowWrap']:which==='analysis'?['analysisChart','analysisTip','analysisWrap']:['libChart','libChartTip','libChartWrap'],c=$(ids[0]),tip=$(ids[1]),wrap=$(ids[2]),active=which==='now'?S.nowActive:which==='analysis'?S.analysisActive:S.libraryActive;function setActive(id){if(which==='now')S.nowActive=id;else if(which==='analysis')S.analysisActive=id;else S.libraryActive=id}let base;",
    "canonical draw contexts",
)
replace("let ticks=W<430?(S.h==='1D'?2:3):5;", "let ticks=W<430?(w.horizon==='1D'?2:3):5;", "saved horizon ticks")
replace("x.fillText(tick(tt),xx,H-10)", "x.fillText(tick(tt,w.horizon),xx,H-10)", "saved horizon labels")
replace("if(sel){if(which==='now')S.nowActive=sel.id;else S.analysisActive=sel.id}", "if(sel)setActive(sel.id);", "initial active series")
replace("if(which==='now')S.nowActive=sel.id;else S.analysisActive=sel.id", "setActive(sel.id)", "inspected active series")
replace(
    "let valueLine=mode==='indexed'?`Index ${fmt(q.v)} · ${fmt(q.raw??q.v)} ${esc(sel.unit||'')}`:`${fmt(q.raw??q.v)} ${esc(sel.unit||'')}`;",
    "let iv=Number.isFinite(+q.idx)?+q.idx:(mode==='indexed'?+q.v:null),nv=Number.isFinite(+q.raw)?+q.raw:+q.v,valueLine=sel.unit==='Index'||!Number.isFinite(iv)?`idx ${fmt(q.v)}`:`idx ${fmt(iv)} · value ${fmt(nv)} ${esc(sel.unit||'')}`;",
    "dual-value point inspection",
)

# Empty/degraded V2 series remain represented but cannot be selected.
replace(
    "function legend(sets){$('legend').innerHTML=sets.map(s=>`<button class=\"lg ${s.id===S.nowActive?'active':''} ${s.a.length?'':'empty'}\" data-id=\"${s.id}\" title=\"${esc(s.full)}\"><span class=\"sw\" style=\"background:${s.color}\"></span>${esc(s.label)}</button>`).join('')}",
    "function legend(sets){$('legend').innerHTML=sets.map(s=>`<button class=\"lg ${s.id===S.nowActive?'active':''} ${s.a.length?'':'empty'}\" data-id=\"${s.id}\" title=\"${esc(s.full)}${s.a.length?'':' · unavailable for '+S.h}\" ${s.a.length?'':'disabled aria-disabled=\"true\"'}><span class=\"sw\" style=\"background:${s.color}\"></span>${esc(s.label)}</button>`).join('')}",
    "disabled unavailable legend entries",
)
replace(
    "$('legend').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{let id=b.dataset.id;if(id===k)",
    "$('legend').querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{if(b.disabled)return;let id=b.dataset.id;if(id===k)",
    "V2 unavailable selection guard",
)
replace(
    "a:mode==='indexed'?indexed(z.s,w,1):obsRange(z.s,w)",
    "a:mode==='indexed'?indexed(z.s,w,1):nativeIndexed(z.s,w)",
    "native chart indexed inspection",
)
replace(
    "reps=plan.kinds.map(k=>loaded.find(z=>unitKind(z.id)===k)).filter(Boolean)",
    "reps=plan.kinds.map(k=>loaded.find(z=>measurementFamily(z.id)===k)).filter(Boolean)",
    "measurement-family axis representatives",
)

# EXPLORE and Add Series determine availability from actual canonical observations
# inside the selected common horizon, not from catalog presence alone.
render_explore = r'''async function renderExplore(){let token=Date.now()+Math.random(),q=$('exploreSearch').value.toLowerCase();S.exploreRenderToken=token;$('cats').innerHTML=['Market','Risk','Growth','Macro','Other'].map(x=>`<button class="cat ${S.exploreCat===x?'on':''}" data-cat="${x}">${x}</button>`).join('');$('cats').querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{S.exploreCat=b.dataset.cat;renderExplore()});let ids=S.exploreCat==='Market'?IDX.map(k=>'@'+k):exploreIds();ids=ids.filter(id=>{let t=id[0]==='@'?`${AB[id.slice(1)]} ${S.def.indices[id.slice(1)].name}`:`${id} ${name(id)} ${label(id)}`;return t.toLowerCase().includes(q)});let raw=[...new Set(ids.flatMap(id=>id[0]==='@'?S.def.indices[id.slice(1)].components.map(x=>x.id):[id]))],pairs=await Promise.all(raw.map(async id=>[id,await seriesAvailable(id)]));if(S.exploreRenderToken!==token)return;let available=Object.fromEntries(pairs);S.exploreSelected=S.exploreSelected.filter(id=>available[id]);$('exploreList').innerHTML=ids.map(id=>{if(id[0]==='@'){let k=id.slice(1),components=S.def.indices[k].components.map(x=>x.id),n=components.filter(x=>available[x]).length;return`<div class="row ${n?'':'empty'}" data-id="${id}" aria-disabled="${!n}"><strong>${AB[k]} · ${esc(S.def.indices[k].name)}</strong><span class="rowMeta">Derived index · ${n}/${components.length} selectable for ${S.h}</span></div>`}let ok=!!available[id];return`<div class="row ${S.exploreSelected.includes(id)?'on':''} ${ok?'':'empty'}" data-id="${id}" aria-disabled="${!ok}"><strong>${esc(label(id))} · ${esc(name(id))}</strong><span class="rowMeta">${esc(unit(id))} · ${esc(cat(id).native_cadence||'')} · ${ok?'available':'unavailable'} for ${S.h}</span></div>`}).join('');$('exploreList').querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{let id=r.dataset.id;if(r.getAttribute('aria-disabled')==='true')return;if(id[0]==='@'){let k=id.slice(1);S.exploreSelected=S.def.indices[k].components.map(x=>x.id).filter(x=>available[x])}else S.exploreSelected=S.exploreSelected.includes(id)?S.exploreSelected.filter(x=>x!==id):[...S.exploreSelected,id];renderExplore()});$('exploreSelection').innerHTML=S.exploreSelected.map(id=>`<button class="chip" data-rm="${id}">${esc(label(id))} ×</button>`).join('')||'<span style="color:var(--muted)">No series selected.</span>';$('exploreSelection').querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{S.exploreSelected=S.exploreSelected.filter(x=>x!==b.dataset.rm);renderExplore()});$('openExploreAnalysis').disabled=!S.exploreSelected.length}'''
replace_range("function renderExplore()", "$('exploreSearch').oninput", render_explore, "horizon-truthful Explore")

render_picker = r'''async function renderPicker(q=''){let token=Date.now()+Math.random(),ids=S.catalog.series.map(x=>x.id).filter(id=>!S.analysisSeries.includes(id)&&`${id} ${name(id)} ${label(id)}`.toLowerCase().includes(q.toLowerCase()));S.pickerRenderToken=token;let pairs=await Promise.all(ids.map(async id=>[id,await seriesAvailable(id)]));if(S.pickerRenderToken!==token)return;let available=Object.fromEntries(pairs);$('pickerList').innerHTML=ids.map(id=>{let ok=!!available[id];return`<div class="row pickerRow ${ok?'':'empty'}" data-id="${id}"><div class="rowMain"><strong>${esc(label(id))} · ${esc(name(id))}</strong><span class="rowMeta"><span class="typeBadge">${esc(unitGlyph(id))}</span><span class="cadBadge">${esc(cadenceChip(id))}</span>${esc(unit(id)||'—')} · latest ${esc(latestLabel(id))} · ${ok?'available':'unavailable'} for ${S.h}</span></div><button class="btn" data-about="${id}">About</button><button class="btn" data-add="${id}" ${ok?'':'disabled aria-disabled="true"'}>Add</button></div>`}).join('');$('pickerList').querySelectorAll('[data-about]').forEach(b=>b.onclick=e=>{e.stopPropagation();showSeriesAbout(b.dataset.about)});$('pickerList').querySelectorAll('[data-add]').forEach(b=>b.onclick=e=>{e.stopPropagation();if(b.disabled)return;let id=b.dataset.add;S.analysisSeries.push(id);S.analysisActive=id;$('seriesPicker').classList.add('hidden');$('seriesAbout').classList.add('hidden');renderAnalysis()})}'''
replace_range("function renderPicker(q='')", "function renderStats", render_picker, "horizon-truthful Add Series")

# A saved Analysis owns an immutable chart snapshot. Legacy records are hydrated
# once from current canonical evidence and marked rather than silently changing.
analysis_state = r'''async function chartSnapshotFrom(state,origin='frozen'){let ids=[...new Set(state.series||[])],w=horizonWindow(state.horizon||'5D',state.index||'risk'),loaded=[];for(let i=0;i<ids.length;i++){let id=ids[i];try{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:C[i%C.length],s:await getSeries(id)})}catch{loaded.push({id,label:label(id),full:name(id),unit:unit(id),color:C[i%C.length],s:{observations:[]}})}}let available=loaded.filter(z=>obsRange(z.s,w).length),plan=axisPlan(available.map(z=>z.id)),mode=plan.mode,series=loaded.map(z=>({id:z.id,label:z.label,full:z.full,unit:z.unit,color:z.color,measurementFamily:measurementFamily(z.id),axis:plan.map[z.id]||0,axisLabel:unitKind(z.id)==='percent'?'Percent':unitKind(z.id)==='money'?'$ / USD':z.unit,available:obsRange(z.s,w).length>0,points:(mode==='indexed'?indexed(z.s,w,1):nativeIndexed(z.s,w)).map(p=>({t:+p.t,v:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:null,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,sourceT:+(p.sourceT||p.t)}))}));return{schema:'market-navigator-chart-snapshot-v1',origin,capturedAt:new Date().toISOString(),horizon:state.horizon||'5D',window:w,mode,active:state.active||state.root||ids[0]||null,series,dataRevision:{derived:S.derived.revision||S.derived.version||'',derivedGeneratedAt:S.derived.generatedAt||'',catalog:S.catalog.version||'',healthGeneratedAt:S.health.generatedAt||''}}}async function analysisState(){let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(id=>({id,catalog:cat(id),health:health(id)}))};state.chart=await chartSnapshotFrom(state,'frozen');return state}function aiEvidenceState(state){let chart=state.chart||{};return{lineage:state.lineage,root:state.root,series:state.series,horizon:state.horizon,index:state.index,evidence:state.evidence,chart:{schema:chart.schema,mode:chart.mode,horizon:chart.horizon,window:chart.window,dataRevision:chart.dataRevision,series:(chart.series||[]).map(z=>({id:z.id,label:z.label,unit:z.unit,measurementFamily:z.measurementFamily,axis:z.axis,available:z.available,observationCount:(z.points||[]).length,first:(z.points||[])[0]||null,last:(z.points||[]).at(-1)||null}))}}}'''
replace_range("function analysisState()", "async function startAI()", analysis_state, "immutable chart snapshot")

start_ai = r'''function generatedAnalysisTitle(markdown,fallback){let first=String(markdown||'').split(/\n/).find(x=>/^#\s+\S/.test(x)),title=first?first.replace(/^#\s+/,'').replace(/[*_`\[\]]/g,'').trim():'';return(title&&title.length<=100?title:title.slice(0,100))||fallback}async function startAI(){let now=new Date().toISOString(),reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{};if(!c.verified||!c.key||!c.model){nav('config');setPStatus(p,'Register this provider before starting an Analysis',false);return}let state=await analysisState(),a={id:'a-'+Date.now(),title:`${label(S.analysisRoot)} · ${S.h}`,titleManual:false,status:'processing',createdAt:now,updatedAt:now,state,provider:p,model:c.model||'',turns:[{role:'assistant',content:'Processing…',at:now,processing:true}]};a=await persistAnalysis(a);let analysisId=a.id;S.activeAnalysis=analysisId;$('analysisModal').classList.add('hidden');$('libraryWorkspace').classList.add('detailOpen');nav('library');renderLibrary();try{let out=await callAI([{role:'system',content:`You are Market Navigator, an evidence-first market research analyst. Canonical chart evidence is authoritative for the supplied series. Use current web research only to explain context or developments and cite every external claim with a working Markdown link. Produce a substantive analysis, never an empty response. Begin with one specific H1 Markdown title, then separate: Market read, What changed, Evidence quality/limitations, Current context, What to watch next. Evidence: ${JSON.stringify(aiEvidenceState(state))}`},{role:'user',content:'Analyze this exact chart state and evidence. Explain the important cross-series relationships, limitations caused by cadence/freshness, current context, and what would change the interpretation.'}],{web:true});let saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:out,at:new Date().toISOString()});if(!saved.titleManual)saved.title=generatedAnalysisTitle(out,saved.title);saved.status='ready';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}catch(e){let saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:`**Analysis failed:** ${e.message}`,at:new Date().toISOString()});saved.status='failed';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}}'''
replace_range("async function startAI()", "function activeAnalyses", start_ai, "durable Analysis start")

persist = r'''async function persistAnalysis(record){await dbPut('analyses',record);let saved=await dbGet('analyses',record.id);if(!saved)throw Error('Analysis persistence verification failed');ANALYSES_CACHE=[saved,...ANALYSES_CACHE.filter(x=>x.id!==saved.id)].sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));return saved}'''
replace("async function saveAttachment(file)", persist + "async function saveAttachment(file)", "verified Analysis persistence")

library_chart = r'''async function ensureLibraryChart(a){if(a.state?.chart?.schema==='market-navigator-chart-snapshot-v1')return a.state.chart;let state=a.state||{};state.series=state.series||[];state.horizon=state.horizon||'5D';state.chart=await chartSnapshotFrom(state,'legacy-migrated');a.state=state;a.chartMigratedAt=new Date().toISOString();let saved=await persistAnalysis(a);return saved.state.chart}async function renderLibraryChart(a){let seq=++S.libraryChartSeq;try{let chart=await ensureLibraryChart(a);if(seq!==S.libraryChartSeq||S.activeAnalysis!==a.id)return;let sets=(chart.series||[]).map(z=>({...z,a:(z.points||[]).map(p=>({...p}))})),w={...chart.window,horizon:chart.horizon||a.state.horizon};if(!sets.some(z=>z.id===S.libraryActive&&z.a.length))S.libraryActive=sets.some(z=>z.id===chart.active&&z.a.length)?chart.active:sets.find(z=>z.a.length)?.id||null;$('libChartPane').classList.remove('hidden');$('libChartError').classList.add('hidden');$('libChartError').textContent='';$('libChart').classList.remove('hidden');$('libChartLegend').innerHTML=sets.map(z=>`<button class="lg ${z.id===S.libraryActive?'active':''} ${z.a.length?'':'empty'}" data-lib-series="${z.id}" ${z.a.length?'':'disabled aria-disabled="true"'} title="${esc(z.full)}"><span class="sw" style="background:${z.color}"></span>${esc(z.label)}</button>`).join('');$('libChartLegend').querySelectorAll('[data-lib-series]').forEach(b=>b.onclick=()=>{if(b.disabled)return;S.libraryActive=b.dataset.libSeries;renderLibraryChart(a)});$('libChartAxis').textContent=chart.mode==='dual'?'Y1 + Y2':chart.mode==='indexed'?'Indexed 100':'Native Y1';let rev=chart.dataRevision?.derived||chart.dataRevision?.derivedGeneratedAt||'revision unavailable';$('libChartMeta').textContent=`${chart.window.startLabel} → ${chart.window.endLabel} · ${chart.horizon} · evidence ${rev}${chart.origin==='legacy-migrated'?' · migrated once from canonical evidence':''}`;draw('library',sets,w,chart.mode)}catch(e){if(seq!==S.libraryChartSeq)return;$('libChartPane').classList.remove('hidden');$('libChart').classList.add('hidden');$('libChartLegend').innerHTML='';$('libChartAxis').textContent='Chart unavailable';$('libChartMeta').textContent=e.message;$('libChartError').textContent=e.message;$('libChartError').classList.remove('hidden')}}'''
replace("function renderLibrary(){", library_chart + "function renderLibrary(){", "Library chart renderer")
replace(
    "$('libList').querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{S.activeAnalysis=r.dataset.id;renderLibrary()});",
    "$('libList').querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{S.activeAnalysis=r.dataset.id;$('libraryWorkspace').classList.add('detailOpen');renderLibrary()});",
    "Library mobile detail open",
)
replace(
    "if(!a){$('libTitle').textContent='Library';$('transcript').innerHTML='<p style=\"color:var(--muted)\">Select an Analysis.</p>';return}$('libTitle').textContent=",
    "if(!a){S.libraryChartSeq++;$('libChartPane').classList.add('hidden');$('libTitle').value='Library';$('libTitle').disabled=true;$('transcript').innerHTML='<p style=\"color:var(--muted)\">Select an Analysis.</p>';return}$('libChartPane').classList.remove('hidden');void renderLibraryChart(a);$('libTitle').disabled=false;$('libTitle').value=",
    "Library selected chart",
)
replace(
    "$('libTitle').value=`${a.title} · ${a.status} · ${providerName(a.provider||'venice')} ${a.model||''}`;",
    "$('libTitle').value=a.title;",
    "editable title value",
)
replace(
    "$('libSearch').oninput=renderLibrary;",
    "async function commitLibraryTitle(){let a=currentAnalysis(),title=$('libTitle').value.trim();if(!a)return;if(!title){$('libTitle').value=a.title;return}if(title===a.title)return;a.title=title;a.titleManual=true;a.updatedAt=new Date().toISOString();await persistAnalysis(a);renderLibrary()}$('libTitle').onblur=commitLibraryTitle;$('libTitle').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('libTitle').blur()}else if(e.key==='Escape'){let a=currentAnalysis();$('libTitle').value=a?.title||'Library';$('libTitle').blur()}};$('libSearch').oninput=renderLibrary;",
    "inline-editable Analysis title",
)
replace(
    "$('libCollapse').onclick=()=>{let w=$('libraryWorkspace');w.classList.toggle('libCollapsed');$('libCollapse').textContent=w.classList.contains('libCollapsed')?'›':'‹'};",
    "$('libCollapse').onclick=()=>{let w=$('libraryWorkspace');w.classList.toggle('libCollapsed');$('libCollapse').textContent=w.classList.contains('libCollapsed')?'›':'‹'};$('libBack').onclick=()=>{$('libraryWorkspace').classList.remove('detailOpen')};",
    "Library mobile back",
)

# Follow-up completion is bound to the Analysis that launched it, even if the user
# opens another Analysis while the current-web request is running.
send_handler = r'''$('send').onclick=async()=>{let text=$('compose').value.trim(),a=analyses().find(x=>x.id===S.activeAnalysis&&!x.deletedAt),attachments=[...S.pendingAttachments];if((!text&&!attachments.length)||!a)return;let analysisId=a.id;$('compose').value='';S.pendingAttachments=[];renderAttachPreview();a.turns.push({role:'user',content:text||'Please examine the attached file(s) in the context of this analysis.',attachments,at:new Date().toISOString()});a.status='processing';a.updatedAt=new Date().toISOString();a=await persistAnalysis(a);renderLibrary();try{let msgs=[{role:'system',content:`Continue this Market Navigator analysis using frozen evidence ${JSON.stringify(aiEvidenceState(a.state))}. Use current web research when useful and cite external claims with working links.`},...a.turns.filter(t=>!t.processing).map(t=>({role:t.role,content:t.content,attachments:t.attachments||[]}))],out=await callAI(msgs,{web:true}),saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns.push({role:'assistant',content:out,at:new Date().toISOString()});saved.status='ready';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}catch(e){let saved=analyses().find(x=>x.id===analysisId);if(!saved)return;saved.turns.push({role:'assistant',content:`**Follow-up failed:** ${e.message}`,at:new Date().toISOString()});saved.status='failed';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);if(S.activeAnalysis===analysisId)renderLibrary()}};'''
replace_range("$('send').onclick=async()=>", "function renderHealth", send_handler, "thread-safe Library continuation")

replace(
    "<div class=\"rowMeta\">📎 ${esc(x.name)}</div>",
    "<div class=\"rowMeta\">📎 ${esc(x.name)}${/\\.(csv|tsv|xlsx|xls)$/i.test(x.name||'')?' · spreadsheet':''}</div>",
    "spreadsheet transcript label",
)
replace(
    "window.addEventListener('resize',()=>{if(S.view==='now')renderNow();if(!$('analysisModal').classList.contains('hidden'))renderAnalysis()})",
    "window.addEventListener('resize',()=>{if(S.view==='now')renderNow();if(!$('analysisModal').classList.contains('hidden'))renderAnalysis();if(S.view==='library'){let a=analyses().find(x=>x.id===S.activeAnalysis&&!x.deletedAt);if(a)renderLibraryChart(a)}})",
    "Library chart resize",
)

required = [
    "TURN 13 PRE-SHIP",
    "market-navigator-chart-snapshot-v1",
    "id=\"libChart\"",
    "function draw(which,sets,w,mode='indexed')",
    "idx ${fmt(iv)} · value ${fmt(nv)}",
    "available':'unavailable'} for ${S.h}",
    "async function persistAnalysis",
    "async function renderLibraryChart",
    "function measurementFamily",
    "legacy-migrated",
    "generatedAnalysisTitle",
    "commitLibraryTitle",
    "Register this provider before starting an Analysis",
    "Attach image or spreadsheet",
    "function renderAIConfig()",
]
for item in required:
    if item not in s:
        raise SystemExit(f"missing Turn 13 requirement: {item}")

for forbidden in [
    "TURN 12 PRE-SHIP",
    "grid-template-columns:minmax(0,1fr) 280px",
    '<div class="card evidence" id="analysisEvidence"></div>',
    ".info{position:absolute;right:12px;top:56px",
]:
    if forbidden in s:
        raise SystemExit(f"Turn 13 forbidden residue: {forbidden}")

DST.write_text(s)
print(DST)
