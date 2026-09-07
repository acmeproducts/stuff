from pathlib import Path
import re

SRC=Path('market-navigator-turn08-pre-ship.html')
DST=Path('market-navigator-turn09-pre-ship.html')
s=SRC.read_text()
s=s.replace('<title>Market Navigator · Turn 08</title>','<title>Market Navigator · Turn 09</title>')
s=s.replace('TURN 08 PRE-SHIP','TURN 09 PRE-SHIP')

# Toolbar/Library CSS: sticky composer, attachment chips, breadcrumb controls, More menu.
s=s.replace('.crumb{font-size:11px;font-weight:900}', '.crumb{font-size:11px;font-weight:900;display:flex;align-items:center;gap:4px}.crumbBtn{border:0;background:transparent;padding:2px 0;color:var(--accent);font-weight:900}.crumbSep{color:var(--muted)}')
s=s.replace('.seriesBar{border-bottom:1px solid var(--line);padding:5px 8px;display:flex;gap:5px;align-items:center;overflow-x:auto;background:#081522}', '.seriesBar{border-bottom:1px solid var(--line);padding:5px 8px;display:flex;gap:5px;align-items:center;overflow-x:auto;background:#081522}.seriesBar .grow{min-width:12px}.moreMenu{position:absolute;right:10px;top:118px;z-index:30;width:170px;background:#081522;border:1px solid var(--line);border-radius:9px;box-shadow:0 18px 50px #000a;overflow:hidden}.moreMenu button{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid var(--line);background:transparent;padding:11px 12px}.moreMenu button:last-child{border-bottom:0}.moreMenu .aiAction{color:var(--accent);font-weight:900;background:#0d2438}')
s=s.replace('.composer{border-top:1px solid var(--line);padding:7px;display:flex;gap:6px}.composer textarea{flex:1;min-height:42px;resize:none;background:#071522;border:1px solid var(--line);border-radius:7px;padding:7px}', '.composer{position:sticky;bottom:0;z-index:8;border-top:1px solid var(--line);padding:7px;background:var(--panel);display:grid;grid-template-columns:auto auto minmax(0,1fr) auto;gap:6px;align-items:end}.composer textarea{min-width:0;min-height:42px;max-height:120px;resize:none;background:#071522;border:1px solid var(--line);border-radius:7px;padding:7px}.attachPreview{grid-column:1/-1;display:flex;gap:5px;overflow-x:auto}.attChip{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;border:1px solid var(--line);border-radius:999px;padding:4px 7px;font-size:9px;background:#071522}.attThumb{max-width:180px;max-height:180px;border-radius:7px;border:1px solid var(--line);display:block;margin-top:6px}.webOn{border-color:var(--accent)!important;color:var(--accent)}')

# Keep the old V1 DOM anchor harmless but remove its visible control footprint.
s=s.replace('<button id="v1btn" class="btn hidden">V1</button>', '<span id="v1btn" class="hidden"></span>')

old_comp='<div class="composer"><textarea id="compose" placeholder="Continue this analysis…"></textarea><button class="btn" id="send">Send</button></div>'
new_comp='<div class="composer"><div class="attachPreview" id="attachPreview"></div><button class="btn" id="attachBtn" title="Attach image" aria-label="Attach image">📎</button><input id="attachInput" type="file" accept="image/*" multiple class="hidden"><button class="btn webOn" id="webToggle" title="Real-time web search">Web</button><textarea id="compose" placeholder="Continue this analysis…"></textarea><button class="btn" id="send">Send</button></div>'
if old_comp not in s: raise SystemExit('composer anchor not found')
s=s.replace(old_comp,new_comp)

# Add More context menu to Analysis modal.
anchor='<div class="statsPanel hidden" id="statsPanel"><div class="toolbar"><strong>Stats</strong><div class="grow"></div><button class="btn" id="statsClose">×</button></div><div class="statsGrid" id="statsGrid"></div></div>'
if anchor not in s: raise SystemExit('stats panel anchor not found')
s=s.replace(anchor, anchor+'<div class="moreMenu hidden" id="moreMenu"><button class="aiAction" id="moreAI">AI Analysis</button><button id="moreStats">Stats</button><button id="morePrint">Print</button><button id="moreDownload">Download</button></div>')

# State: browser-local persistence/web toggle/pending image attachments.
s=s.replace("exploreCat:'Market',exploreSelected:[]}", "exploreCat:'Market',exploreSelected:[],pendingAttachments:[],webOn:true}")

# Breadcrumbs become the canonical Market return path.
old_nav="function nav(v){S.view=v;document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='view-'+v));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('on',x.dataset.view===v));$('crumb').textContent=v==='now'?(S.level===1?'NOW / Market':`NOW / ${AB[S.index]}`):v.toUpperCase();if(v==='explore')renderExplore();if(v==='library')renderLibrary();if(v==='health')renderHealth()}"
new_nav="function renderCrumb(){let c=$('crumb');if(S.view!=='now'){c.textContent=S.view.toUpperCase();return}c.innerHTML=S.level===1?'<span>NOW / Market</span>':`<button class=\"crumbBtn\" id=\"crumbMarket\">NOW / Market</button><span class=\"crumbSep\">/</span><span>${AB[S.index]}</span>`;let b=$('crumbMarket');if(b)b.onclick=()=>{S.level=1;S.index=null;S.priorV2=null;$('info').classList.add('hidden');$('nowTip').style.display='none';renderV1()}}function nav(v){S.view=v;document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='view-'+v));document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('on',x.dataset.view===v));renderCrumb();if(v==='explore')renderExplore();if(v==='library')renderLibrary();if(v==='health')renderHealth()}"
if old_nav not in s: raise SystemExit('nav anchor not found')
s=s.replace(old_nav,new_nav)
s=s.replace("$('crumb').textContent='NOW / Market';", "renderCrumb();")
s=s.replace("$('crumb').textContent=`NOW / ${AB[k]}`;", "renderCrumb();")

# Indexed crosshair must show BOTH rebased index level and native observation.
old_tip="tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${fmt(q.raw??q.v)} ${esc(sel.unit||'')}`;"
new_tip="let valueLine=mode==='indexed'?`Index ${fmt(q.v)} · ${fmt(q.raw??q.v)} ${esc(sel.unit||'')}`:`${fmt(q.raw??q.v)} ${esc(sel.unit||'')}`;tip.innerHTML=`<strong>${esc(sel.label)}</strong><br>${full(q.sourceT||q.t)} · ${valueLine}`;"
if old_tip not in s: raise SystemExit('tooltip anchor not found')
s=s.replace(old_tip,new_tip)

# Analysis control ribbon: legend chips + Add + far-right ellipsis only.
old_buttons='''+`<button class="btn" id="addSeries">Add</button><button class="btn" id="stats">Stats</button><button class="btn" id="runAI">AI</button><button class="btn" id="printBtn">Print</button><button class="btn" id="downloadBtn">DL</button>`;'''
new_buttons='''+`<button class="btn" id="addSeries">Add</button><div class="grow"></div><button class="btn" id="moreBtn" aria-label="More actions">⋯</button>`;'''
if old_buttons not in s: raise SystemExit('analysis buttons anchor not found')
s=s.replace(old_buttons,new_buttons)
old_wiring="$('addSeries').onclick=()=>{renderPicker();$('seriesPicker').classList.remove('hidden')};$('stats').onclick=()=>renderStats(loaded);$('runAI').onclick=startAI;$('printBtn').onclick=()=>window.print();$('downloadBtn').onclick=()=>downloadAnalysisState();"
new_wiring="$('addSeries').onclick=()=>{renderPicker();$('seriesPicker').classList.remove('hidden')};$('moreBtn').onclick=()=>$('moreMenu').classList.toggle('hidden');$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreStats').onclick=()=>{$('moreMenu').classList.add('hidden');renderStats(loaded)};$('morePrint').onclick=()=>{$('moreMenu').classList.add('hidden');window.print()};$('moreDownload').onclick=()=>{$('moreMenu').classList.add('hidden');downloadAnalysisState()};"
if old_wiring not in s: raise SystemExit('analysis wiring anchor not found')
s=s.replace(old_wiring,new_wiring)

# Replace localStorage Analysis records with IndexedDB-backed cache and attachment blob store.
old_persist="function analyses(){try{return JSON.parse(localStorage.getItem(K)||'[]')}catch{return[]}}function saveAnalyses(a){localStorage.setItem(K,JSON.stringify(a))}"
new_persist=r'''let ANALYSES_CACHE=[],MNDB=null;function analyses(){return ANALYSES_CACHE}function openMNDB(){return new Promise((resolve,reject)=>{let r=indexedDB.open('marketNavigatorLocal',1);r.onupgradeneeded=()=>{let d=r.result;if(!d.objectStoreNames.contains('analyses'))d.createObjectStore('analyses',{keyPath:'id'});if(!d.objectStoreNames.contains('attachments'))d.createObjectStore('attachments',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}function dbAll(store){return new Promise((resolve,reject)=>{let r=MNDB.transaction(store).objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}function dbGet(store,id){return new Promise((resolve,reject)=>{let r=MNDB.transaction(store).objectStore(store).get(id);r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error)})}function dbPut(store,val){return new Promise((resolve,reject)=>{let r=MNDB.transaction(store,'readwrite').objectStore(store).put(val);r.onsuccess=()=>resolve(val);r.onerror=()=>reject(r.error)})}async function initPersistence(){MNDB=await openMNDB();let all=await dbAll('analyses');if(!all.length){try{let legacy=JSON.parse(localStorage.getItem(K)||'[]');for(let a of legacy)await dbPut('analyses',a);all=legacy}catch{}}ANALYSES_CACHE=all.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)))}function saveAnalyses(a){ANALYSES_CACHE=[...a];if(!MNDB)return;let tx=MNDB.transaction('analyses','readwrite'),st=tx.objectStore('analyses');st.clear();for(let x of ANALYSES_CACHE)st.put(x)}async function saveAttachment(file){let id='att-'+Date.now()+'-'+Math.random().toString(36).slice(2),rec={id,name:file.name||'image',type:file.type||'application/octet-stream',size:file.size,blob:file,createdAt:new Date().toISOString()};await dbPut('attachments',rec);return{id:rec.id,name:rec.name,type:rec.type,size:rec.size}}function blobDataURL(blob){return new Promise((resolve,reject)=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}async function attachmentPayload(meta){let r=await dbGet('attachments',meta.id);if(!r)return null;return{...meta,dataUrl:await blobDataURL(r.blob)}}'''
if old_persist not in s: raise SystemExit('analysis persistence anchor not found')
s=s.replace(old_persist,new_persist)

# Provider call supports image vision, real-time web search, citations, and rejects empty answers.
call_start=s.index('async function callAI(msgs)')
call_end=s.index('function analysisState(){',call_start)
new_call=r'''async function providerMessages(msgs,p){let out=[];for(let m of msgs){let at=m.attachments||[],content=m.content||'';if(!at.length){out.push({role:m.role,content});continue}let imgs=[];for(let a of at){let q=await attachmentPayload(a);if(q&&String(q.type).startsWith('image/'))imgs.push(q)}if(p==='anthropic'){let parts=[{type:'text',text:content}];for(let q of imgs){let [head,data]=q.dataUrl.split(',');parts.push({type:'image',source:{type:'base64',media_type:q.type,data}})}out.push({role:m.role,content:parts})}else{let parts=[{type:'text',text:content}];for(let q of imgs)parts.push({type:'image_url',image_url:{url:q.dataUrl}});out.push({role:m.role,content:parts})}}return out}function responseText(p,x){if(p==='anthropic'){let blocks=x.content||[],text=blocks.filter(b=>b.type==='text').map(b=>b.text||'').join('\n').trim(),src=[];for(let b of blocks)for(let c of (b.citations||[]))if(c.url)src.push({url:c.url,title:c.title||c.url});if(src.length)text+='\n\n### Sources\n'+[...new Map(src.map(z=>[z.url,z])).values()].map(z=>`- [${z.title}](${z.url})`).join('\n');return text}let m=x.choices?.[0]?.message||{},v=Array.isArray(m.content)?m.content.map(z=>typeof z==='string'?z:(z.text||z.content||'')).join('\n'):String(m.content||''),src=(m.annotations||[]).map(a=>a.url_citation).filter(Boolean);if(src.length)v+='\n\n### Sources\n'+[...new Map(src.map(z=>[z.url,z])).values()].map(z=>`- [${z.title||z.url}](${z.url})`).join('\n');return v.trim()}async function callAI(msgs,opt={}){let reg=aiRegistry(),p=reg.defaultProvider||'venice',c=(reg.providers||{})[p]||{};if(!c.verified||!c.key||!c.model)throw Error(`${providerName(p)} is not registered in Config`);let ep=providerEndpoints(p),headers={'Content-Type':'application/json'},body,pm=await providerMessages(msgs,p);if(p==='anthropic'){headers['x-api-key']=c.key;headers['anthropic-version']='2023-06-01';headers['anthropic-dangerous-direct-browser-access']='true';body={model:c.model,max_tokens:2600,messages:pm.filter(x=>x.role!=='system'),system:pm.find(x=>x.role==='system')?.content||''};if(opt.web)body.tools=[{type:'web_search_20250305',name:'web_search',max_uses:5}]}else{headers.Authorization=`Bearer ${c.key}`;body={model:c.model,messages:pm,max_tokens:2600};if(opt.web){if(p==='openrouter')body.plugins=[{id:'web',max_results:5}];else body.venice_parameters={enable_web_search:'auto',enable_web_citations:true}}}let r=await fetch(ep.chat,{method:'POST',headers,body:JSON.stringify(body)}),x=await r.json();if(!r.ok)throw Error(x.error?.message||`AI HTTP ${r.status}`);let out=responseText(p,x);if(!out)throw Error('Provider returned no answer content');return out}
'''
s=s[:call_start]+new_call+s[call_end:]

# Initial Analysis always allows current web grounding; stronger evidence-first prompt.
s=s.replace("let out=await callAI([{role:'system',content:`You are Market Navigator. Analyze only supplied canonical evidence. Distinguish evidence from interpretation. State limitations. Use Markdown; include direct working hyperlinks for external sources/research when known; never invent URLs. Evidence: ${JSON.stringify(a.state)}`},{role:'user',content:'Summarize what changed, what matters, evidence limitations, and what to watch next.'}]);", "let out=await callAI([{role:'system',content:`You are Market Navigator, an evidence-first market research analyst. Canonical chart evidence is authoritative for the supplied series. Use current web research only to explain context or developments and cite every external claim with a working Markdown link. Produce a substantive analysis, never an empty response. Separate: Market read, What changed, Evidence quality/limitations, Current context, What to watch next. Evidence: ${JSON.stringify(a.state)}`},{role:'user',content:'Analyze this exact chart state and evidence. Explain the important cross-series relationships, limitations caused by cadence/freshness, current context, and what would change the interpretation.'}],{web:true});")

# Attachment/web composer behavior and follow-up message construction.
needle="$('libSearch').oninput=renderLibrary;$('send').onclick=async()=>{"
if needle not in s: raise SystemExit('library send anchor not found')
insert=r'''$('libSearch').oninput=renderLibrary;function renderAttachPreview(){$('attachPreview').innerHTML=S.pendingAttachments.map(a=>`<span class="attChip">${esc(a.name)} <button data-rmatt="${a.id}" aria-label="Remove attachment">×</button></span>`).join('');$('attachPreview').querySelectorAll('[data-rmatt]').forEach(b=>b.onclick=()=>{S.pendingAttachments=S.pendingAttachments.filter(a=>a.id!==b.dataset.rmatt);renderAttachPreview()})}$('attachBtn').onclick=()=>$('attachInput').click();$('attachInput').onchange=async e=>{for(let f of [...e.target.files]){if(!String(f.type).startsWith('image/'))continue;S.pendingAttachments.push(await saveAttachment(f))}e.target.value='';renderAttachPreview()};$('webToggle').onclick=()=>{S.webOn=!S.webOn;$('webToggle').classList.toggle('webOn',S.webOn);$('webToggle').textContent=S.webOn?'Web':'Web off'};$('send').onclick=async()=>{'''
s=s.replace(needle,insert)
# User turn now captures attachments and can send attachment-only prompts.
s=s.replace("let text=$('compose').value.trim(),all=analyses(),a=all.find(x=>x.id===S.activeAnalysis);if(!text||!a)return;$('compose').value='';a.turns.push({role:'user',content:text,at:new Date().toISOString()});", "let text=$('compose').value.trim(),all=analyses(),a=all.find(x=>x.id===S.activeAnalysis),attachments=[...S.pendingAttachments];if((!text&&!attachments.length)||!a)return;$('compose').value='';S.pendingAttachments=[];renderAttachPreview();a.turns.push({role:'user',content:text||'Please examine the attached image(s) in the context of this analysis.',attachments,at:new Date().toISOString()});")
s=s.replace("...a.turns.filter(t=>!t.processing).map(t=>({role:t.role,content:t.content}))],out=await callAI(msgs);", "...a.turns.filter(t=>!t.processing).map(t=>({role:t.role,content:t.content,attachments:t.attachments||[]}))],out=await callAI(msgs,{web:S.webOn});")

# Render persisted attachment names/thumbnails in the Library transcript.
old_turn="a.turns.map(t=>`<div class=\"turn\"><div class=\"who\">${esc(t.role.toUpperCase())} · ${new Date(t.at).toLocaleString()}</div><div>${DOMPurify.sanitize(marked.parse(t.content||''))}</div></div>`).join('');$('transcript').scrollTop=$('transcript').scrollHeight"
new_turn="a.turns.map(t=>`<div class=\"turn\"><div class=\"who\">${esc(t.role.toUpperCase())} · ${new Date(t.at).toLocaleString()}</div><div>${DOMPurify.sanitize(marked.parse(t.content||''))}</div>${(t.attachments||[]).map(x=>`<div class=\"rowMeta\">📎 ${esc(x.name)}</div><div data-attimg=\"${x.id}\"></div>`).join('')}</div>`).join('');for(let n of $('transcript').querySelectorAll('[data-attimg]')){dbGet('attachments',n.dataset.attimg).then(r=>{if(r&&String(r.type).startsWith('image/')){let u=URL.createObjectURL(r.blob);n.innerHTML=`<img class=\"attThumb\" src=\"${u}\">`}})}$('transcript').scrollTop=$('transcript').scrollHeight"
if old_turn not in s: raise SystemExit('library turn render anchor not found')
s=s.replace(old_turn,new_turn)

# Boot IndexedDB before Library rendering/migration.
s=s.replace("if(innerWidth<=760)$('rail').classList.add('closed');renderV1();renderExplore();renderHealth();renderLibrary();renderAIConfig()", "if(innerWidth<=760)$('rail').classList.add('closed');await initPersistence();renderV1();renderExplore();renderHealth();renderLibrary();renderAIConfig();renderCrumb();renderAttachPreview()")

# Acceptance guards.
for must in ['Index ${fmt(q.v)}','moreAI','indexedDB.open','attachInput','plugins=[{id:\'web\'','enable_web_search',"web_search_20250305",'Provider returned no answer content','crumbMarket']:
    if must not in s: raise SystemExit('missing Turn09 requirement: '+must)
for forbidden in ['id="stats">Stats','id="runAI">AI','id="printBtn">Print','id="downloadBtn">DL']:
    if forbidden in s: raise SystemExit('old ribbon control remains: '+forbidden)
DST.write_text(s)
print(DST)
