#!/usr/bin/env python3
from pathlib import Path
import re, sys

if len(sys.argv) != 3:
    raise SystemExit('usage: integrate-SOT-turn01-base21-ui.py <pre-base.html> <base.html>')

src = Path(sys.argv[1]).read_text()
for marker in [
    '<title>SOT Turn 01 Pre-Base</title>',
    'TURN 01 · PRE-BASE',
    "const BUILD='SOT-turn01-pre-base';",
    'async function renderScope(p){',
    'async function openSourcePicker(p,current){',
    'function openConfig(){'
]:
    if src.count(marker) != 1:
        raise SystemExit(f'pre-base UI contract failed for {marker!r}: count={src.count(marker)}')

def function_span(text, name):
    pat = re.compile(r'(?m)^(?:async\s+)?function\s+' + re.escape(name) + r'\s*\(')
    matches = list(pat.finditer(text))
    if len(matches) != 1:
        raise SystemExit(f'function boundary ambiguous for {name}: {len(matches)} matches')
    start = matches[0].start()
    brace = text.find('{', matches[0].end())
    depth = 0; quote = None; esc = False; i = brace
    while i < len(text):
        ch = text[i]
        if quote:
            if esc: esc = False
            elif ch == '\\': esc = True
            elif ch == quote: quote = None
        else:
            if ch in "'\"`": quote = ch
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: return start, i + 1
        i += 1
    raise SystemExit(f'unbalanced function {name}')

def replace_function(text, name, replacement):
    start, end = function_span(text, name)
    return text[:start] + replacement.rstrip() + text[end:]

src = src.replace('<title>SOT Turn 01 Pre-Base</title>', '<title>SOT Turn 01 Base</title>', 1)
src = src.replace('TURN 01 · PRE-BASE', 'TURN 01 · BASE', 1)
src = src.replace("const BUILD='SOT-turn01-pre-base';", "const BUILD='SOT-turn01-base';", 1)

css = r'''
/* TURN01_BASE21_UNIFIED_STORAGE */
.storageGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.storageCard{border:1px solid var(--line);border-radius:10px;background:#111923;padding:12px}.storageCard h3{margin:0 0 7px;font-size:12px}.storagePath{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px}.picker3{display:grid;grid-template-columns:190px minmax(300px,1fr) minmax(260px,.8fr);height:500px;border:1px solid var(--line);border-radius:10px;overflow:hidden}.pane{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--line)}.pane:last-child{border-right:0}.paneHead{padding:9px 10px;border-bottom:1px solid var(--line);font-size:10px;font-weight:850;text-transform:uppercase}.paneBody{min-height:0;overflow:auto}.picker3 .pickBtn{display:block;width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text);padding:10px;text-align:left}.picker3 .pickBtn small{display:block;color:var(--muted);margin-top:2px}.picker3 .pickBtn.active,.picker3 .pickBtn:hover{background:#68b6ff12}.picker3 .folderRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;padding:7px 8px;border-bottom:1px solid var(--line)}.picker3 .folderRow button{border:0;background:transparent;color:var(--text);text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.picker3 .folderRow .select,.picker3 .folderRow .use{border:1px solid var(--line);border-radius:7px;padding:5px 8px;background:#182231}.picker3 .pathBar{padding:8px;border-bottom:1px solid var(--line);font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice{padding:12px}.choicePath{border:1px solid var(--line);border-radius:8px;background:#0b1017;padding:9px;word-break:break-all}.createRow{display:flex;gap:7px;margin-top:10px}.createRow input{flex:1}@media(max-width:900px){.storageGrid{grid-template-columns:1fr}.picker3{grid-template-columns:150px minmax(240px,1fr) 240px}}@media(max-width:680px){.picker3{display:block;height:auto;max-height:78dvh;overflow:auto}.pane{border-right:0;border-bottom:1px solid var(--line)}.paneBody{max-height:230px}}
'''
src = src.replace('</style>', css + '\n</style>', 1)

render_scope = r'''async function renderScope(p){let c=$('content');c.innerHTML='<div class="empty">Loading Scope…</div>';try{let [d,storage]=await Promise.all([api(`/turn01/projects/${encodeURIComponent(p.project_token)}`),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`)]),srcs=d.sources||[];let cap=v=>v==null?'capacity unavailable':`${bytes(v)} free`;c.innerHTML=`<div class="section"><div class="sectionHead"><h2>Source</h2><div style="margin-left:auto"><button id="editSources" class="btn">Select folders</button></div></div><div class="sectionBody"><div class="list">${srcs.map(s=>`<div class="row"><div><b>${esc(s.operator_label||s.normalized_path)}</b><small class="mono">${esc(s.normalized_path)}</small></div><span>${esc(s.preflight_status||'unknown')}</span></div>`).join('')||'<div class="empty">No sources assigned.</div>'}</div><div class="actions" style="margin-top:10px"><button id="preflight" class="btn">Run preflight</button></div></div></div><div class="section"><div class="sectionHead"><h2>Target & Backup</h2></div><div class="sectionBody"><div class="storageGrid"><div class="storageCard"><h3>Target</h3><div class="storagePath mono">${esc(storage.target_root||'Not selected')}</div><button class="btn" id="chooseTarget">${storage.target_root?'Change':'Select / Create folder'}</button>${storage.target_volume?`<small class="muted">${esc(storage.target_volume.name)} · ${cap(storage.target_volume.free_bytes)}</small>`:''}</div><div class="storageCard"><h3>Backup</h3><div class="storagePath mono">${esc(storage.backup_root||'Not selected')}</div><button class="btn" id="chooseBackup">${storage.backup_root?'Change':'Select / Create folder'}</button>${storage.backup_volume?`<small class="muted">${esc(storage.backup_volume.name)} · ${cap(storage.backup_volume.free_bytes)}</small>`:''}</div></div><p class="muted" style="margin:10px 0 0">Source, Target and Backup use the same dynamically discovered storage inventory.</p></div></div>`;$('editSources').onclick=()=>openSourcePicker(p,srcs);$('chooseTarget').onclick=()=>openDestinationPicker(p,'target',storage);$('chooseBackup').onclick=()=>openDestinationPicker(p,'backup',storage);$('preflight').onclick=async()=>{try{let x=await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/preflight`);toast(x.ready?'Preflight ready':`${x.blocking_count} blocking issue(s)`);renderScope(p)}catch(e){toast(e.message)}}}catch(e){c.innerHTML=`<div class="errorBox">${esc(e.message)}</div>`}}'''
src = replace_function(src, 'renderScope', render_scope)

source_picker = r'''async function openSourcePicker(p,current){openModal('Assign source','<div id="pickerMount" class="empty">Loading available volumes…</div>','<button class="btn" data-close>Cancel</button>');let staged=current.map(s=>s.normalized_path),root=$('pickerMount'),volumes=[];let capacity=v=>v==null?'capacity unavailable':`${bytes(v)} free`;async function browse(pathValue){try{let d=await api(`/turn01/fs?path=${encodeURIComponent(pathValue)}`),active=d.volume?.path||'';root.className='';root.innerHTML=`<div class="picker3"><div class="pane"><div class="paneHead">Available volumes</div><div class="paneBody">${volumes.map(vol=>`<button class="pickBtn ${active===vol.path?'active':''}" data-volume="${esc(vol.path)}"><b>${esc(vol.name)}</b><small>${capacity(vol.free_bytes)} · ${esc(vol.path)}</small></button>`).join('')||'<div class="empty">No discovered storage volumes</div>'}</div></div><div class="pane"><div class="paneHead">Folders on ${esc(d.volume?.name||'volume')}</div><div class="pathBar">${esc(d.path)}</div><div class="paneBody">${d.parent?`<div class="folderRow"><button data-browse="${esc(d.parent)}">..</button><button class="use" data-use="${esc(d.path)}">Add this folder</button></div>`:`<div class="folderRow"><div><b>${esc(d.volume?.name||'Volume root')}</b></div><button class="use" data-use="${esc(d.path)}">Add root</button></div>`}${(d.folders||[]).map(f=>`<div class="folderRow"><button data-browse="${esc(f.path)}">${esc(f.name)}</button><button class="use" data-use="${esc(f.path)}">Add</button></div>`).join('')||'<div class="empty">No subfolders in this location</div>'}</div></div><div class="pane"><div class="paneHead">Selected source folders</div><div class="choice"><div id="staged" class="list"></div><button id="saveSources" class="btn primary" style="margin-top:10px">Save sources</button></div></div></div>`;function drawStaged(){$('staged').innerHTML=staged.map(x=>`<div class="row"><div class="mono">${esc(x)}</div><button class="btn" data-remove="${esc(x)}">Remove</button></div>`).join('')||'<div class="empty">None selected.</div>';document.querySelectorAll('[data-remove]').forEach(n=>n.onclick=()=>{staged=staged.filter(x=>x!==n.dataset.remove);drawStaged()})}drawStaged();document.querySelectorAll('[data-volume]').forEach(n=>n.onclick=()=>browse(n.dataset.volume));document.querySelectorAll('[data-browse]').forEach(n=>n.onclick=()=>browse(n.dataset.browse));document.querySelectorAll('[data-use]').forEach(n=>n.onclick=()=>{if(!staged.includes(n.dataset.use))staged.push(n.dataset.use);drawStaged()});$('saveSources').onclick=async()=>{try{await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/sources`,{method:'PUT',body:JSON.stringify({sources:staged})});closeModal();toast('Sources saved');load()}catch(e){toast(e.message)}}}catch(e){root.className='errorBox';root.textContent=e.message}}try{let v=await api('/turn01/volumes');volumes=v.volumes||[];let assigned=current.map(s=>s.normalized_path).find(x=>volumes.some(vol=>x===vol.path||x.startsWith(vol.path+'/')))||'',initial=assigned||volumes[0]?.path;if(!initial){root.className='errorBox';root.textContent='No storage volumes are currently discovered.';return}await browse(initial)}catch(e){root.className='errorBox';root.textContent=e.message}}'''
src = replace_function(src, 'openSourcePicker', source_picker)

insert = src.index('function openConfig(){')
destination_picker = r'''async function openDestinationPicker(p,kind,storage){let selected=storage[`${kind}_root`]||'',currentPath='',volumes=[];openModal(`${kind==='target'?'Target':'Backup'} — choose storage`,'<div id="destMount" class="empty">Loading available volumes…</div>','<button class="btn" data-close>Cancel</button>');let root=$('destMount'),capacity=v=>v==null?'capacity unavailable':`${bytes(v)} free`;async function captureBrowse(pathValue){let body={};body[`${kind}_browse_root`]=pathValue;storage=await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`,{method:'PUT',body:JSON.stringify(body)})}async function browse(pathValue){currentPath=pathValue;try{let d=await api(`/turn01/fs?path=${encodeURIComponent(pathValue)}`),active=d.volume?.path||'';await captureBrowse(d.path);root.className='';root.innerHTML=`<div class="picker3"><div class="pane"><div class="paneHead">Available volumes</div><div class="paneBody">${volumes.map(vol=>`<button class="pickBtn ${active===vol.path?'active':''}" data-volume="${esc(vol.path)}"><b>${esc(vol.name)}</b><small>${capacity(vol.free_bytes)} · ${esc(vol.path)}</small></button>`).join('')||'<div class="empty">No discovered storage volumes</div>'}</div></div><div class="pane"><div class="paneHead">Folders on ${esc(d.volume?.name||'volume')}</div><div class="pathBar">${esc(d.path)}</div><div class="paneBody">${d.parent?`<div class="folderRow"><button data-browse="${esc(d.parent)}">..</button><button class="select" data-select="${esc(d.path)}">Select this folder</button></div>`:`<div class="folderRow"><div><b>${esc(d.volume?.name||'Volume root')}</b></div><button class="select" data-select="${esc(d.path)}">Select root</button></div>`}${(d.folders||[]).map(f=>`<div class="folderRow"><button data-browse="${esc(f.path)}">${esc(f.name)}</button><button class="select" data-select="${esc(f.path)}">Select</button></div>`).join('')||'<div class="empty">No subfolders in this location</div>'}</div></div><div class="pane"><div class="paneHead">Chosen ${kind}</div><div class="choice"><div class="choicePath mono">${esc(selected||'Nothing selected')}</div><p class="muted">Choose an existing folder for ${kind}, or create one in the current folder.</p><div class="createRow"><input id="newFolderName" class="input" placeholder="New folder name"><button id="createFolder" class="btn">+ Create</button></div><button id="saveDestination" class="btn primary" style="margin-top:10px" ${selected?'':'disabled'}>Save ${kind}</button></div></div></div>`;document.querySelectorAll('[data-volume]').forEach(n=>n.onclick=()=>browse(n.dataset.volume));document.querySelectorAll('[data-browse]').forEach(n=>n.onclick=()=>browse(n.dataset.browse));document.querySelectorAll('[data-select]').forEach(n=>n.onclick=()=>{selected=n.dataset.select;browse(currentPath)});$('createFolder').onclick=async()=>{let name=$('newFolderName').value.trim();if(!name)return;try{let made=await api('/turn01/fs/folder',{method:'POST',body:JSON.stringify({parent:d.path,name})});selected=made.path;await browse(made.path);toast('Folder created and selected')}catch(e){toast(e.message)}};$('saveDestination').onclick=async()=>{try{let body={};body[`${kind}_root`]=selected;body[`${kind}_browse_root`]=currentPath;await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`,{method:'PUT',body:JSON.stringify(body)});closeModal();renderScope(p);toast(`${kind} saved`)}catch(e){toast(e.message)}}}catch(e){root.className='errorBox';root.textContent=e.message}}try{let v=await api('/turn01/volumes');volumes=v.volumes||[];let remembered=storage[`${kind}_browse_root`]||'',initial=remembered||selected||volumes[0]?.path;if(initial&&!volumes.some(vol=>initial===vol.path||initial.startsWith(vol.path+'/')))initial=volumes[0]?.path;if(!initial){root.className='errorBox';root.textContent='No storage volumes are currently discovered.';return}await browse(initial)}catch(e){root.className='errorBox';root.textContent=e.message}}
'''
src = src[:insert] + destination_picker + src[insert:]

old_refresh = "load();setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index')renderIndex(psel)}catch{}},3000);"
new_refresh = r'''function indexJobActive(p){return ['Queued','WIP'].includes(projectState(p))}
function fullyIndexedStable(p){let total=Number(p.size_bytes||0),done=Number(p.bytes_processed||0);return total>0&&done>=total&&!indexJobActive(p)}
function projectDisplaySignature(ps){return JSON.stringify(ps.map(p=>[p.project_token,p.project_name,p.processing_state,p.status,p.size_bytes,p.bytes_processed,p.files_discovered,p.source_count,p.processing_errors,p.evidence_revision]))}
function rollupDisplaySignature(r){return JSON.stringify([r?.active_jobs||0,r?.failed_jobs||0,r?.bytes_discovered||0,r?.files_discovered||0])}
load();setInterval(async()=>{try{let priorRollup=rollupDisplaySignature(state.rollup),r=await api('/rollup');state.rollup=r;let active=state.projects.some(indexJobActive),projectsChanged=false;if(active){let p=await api('/projects'),next=Array.isArray(p)?p:(p.projects||[]);projectsChanged=projectDisplaySignature(next)!==projectDisplaySignature(state.projects);state.projects=next}if(projectsChanged||priorRollup!==rollupDisplaySignature(r))renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&!fullyIndexedStable(psel))renderIndex(psel)}catch{}},3000);'''
if src.count(old_refresh) != 1:
    raise SystemExit(f'pre-base refresh marker count={src.count(old_refresh)}')
src = src.replace(old_refresh, new_refresh, 1)

source_fn = src[function_span(src,'openSourcePicker')[0]:function_span(src,'openSourcePicker')[1]]
dest_fn = src[function_span(src,'openDestinationPicker')[0]:function_span(src,'openDestinationPicker')[1]]
if source_fn.count("api('/turn01/volumes')") != 1 or source_fn.count('/turn01/fs?path=') != 1:
    raise SystemExit('Source picker does not load one inventory snapshot plus folder endpoint')
if 'api(`/fs?path=' in source_fn or "api('/fs" in source_fn:
    raise SystemExit('legacy Source /fs authority survived')
if dest_fn.count("api('/turn01/volumes')") != 1 or dest_fn.count('/turn01/fs?path=') != 1:
    raise SystemExit('Destination picker does not load one inventory snapshot plus folder endpoint')
for marker in ['captureBrowse','`${kind}_browse_root`','remembered=storage[`${kind}_browse_root`]','function fullyIndexedStable(p)','Source, Target and Backup use the same dynamically discovered storage inventory.']:
    if marker not in src:
        raise SystemExit(f'Base-21 UI contract missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Base-21 UI generated directly from accepted pre-base with unified storage authority')
