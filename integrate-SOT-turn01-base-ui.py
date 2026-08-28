#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: integrate-SOT-turn01-base-ui.py <pre-base.html> <base.html>')

src = Path(sys.argv[1]).read_text()
required = [
    '<title>SOT Turn 01 Pre-Base</title>',
    'TURN 01 · PRE-BASE',
    "const BUILD='SOT-turn01-pre-base';",
    'async function renderScope(p){',
    'async function renderIndex(p){',
    'function openConfig(){'
]
for marker in required:
    if marker not in src:
        raise SystemExit(f'pre-base UI marker missing: {marker}')

src = src.replace('<title>SOT Turn 01 Pre-Base</title>', '<title>SOT Turn 01 Base</title>', 1)
src = src.replace('TURN 01 · PRE-BASE', 'TURN 01 · BASE', 1)
src = src.replace("const BUILD='SOT-turn01-pre-base';", "const BUILD='SOT-turn01-base';", 1)

css = r'''
/* TURN01_BASE_STORAGE_PICKER */
.storageGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.storageCard{border:1px solid var(--line);border-radius:10px;background:#111923;padding:12px}.storageCard h3{margin:0 0 7px;font-size:12px}.storagePath{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:8px}.picker3{display:grid;grid-template-columns:190px minmax(300px,1fr) minmax(260px,.8fr);height:500px;border:1px solid var(--line);border-radius:10px;overflow:hidden}.pane{min-width:0;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--line)}.pane:last-child{border-right:0}.paneHead{padding:9px 10px;border-bottom:1px solid var(--line);font-size:10px;font-weight:850;text-transform:uppercase}.paneBody{min-height:0;overflow:auto}.picker3 .pickBtn{display:block;width:100%;border:0;border-bottom:1px solid var(--line);background:transparent;color:var(--text);padding:10px;text-align:left}.picker3 .pickBtn small{display:block;color:var(--muted);margin-top:2px}.picker3 .pickBtn.active,.picker3 .pickBtn:hover{background:#68b6ff12}.picker3 .folderRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:center;padding:7px 8px;border-bottom:1px solid var(--line)}.picker3 .folderRow button{border:0;background:transparent;color:var(--text);text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.picker3 .folderRow .select{border:1px solid var(--line);border-radius:7px;padding:5px 8px;background:#182231}.picker3 .pathBar{padding:8px;border-bottom:1px solid var(--line);font-size:10px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.choice{padding:12px}.choicePath{border:1px solid var(--line);border-radius:8px;background:#0b1017;padding:9px;word-break:break-all}.createRow{display:flex;gap:7px;margin-top:10px}.createRow input{flex:1}@media(max-width:900px){.storageGrid{grid-template-columns:1fr}.picker3{grid-template-columns:150px minmax(240px,1fr) 240px}}@media(max-width:680px){.picker3{display:block;height:auto;max-height:78dvh;overflow:auto}.pane{border-right:0;border-bottom:1px solid var(--line)}.paneBody{max-height:230px}}
'''
src = src.replace('</style>', css + '\n</style>', 1)

start = src.index('async function renderScope(p){')
end = src.index('async function renderIndex(p){', start)
render_scope = r'''async function renderScope(p){let c=$('content');c.innerHTML='<div class="empty">Loading Scope…</div>';try{let [d,storage]=await Promise.all([api(`/turn01/projects/${encodeURIComponent(p.project_token)}`),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`)]),srcs=d.sources||[];c.innerHTML=`<div class="section"><div class="sectionHead"><h2>Source</h2><div style="margin-left:auto"><button id="editSources" class="btn">Select folders</button></div></div><div class="sectionBody"><div class="list">${srcs.map(s=>`<div class="row"><div><b>${esc(s.operator_label||s.normalized_path)}</b><small class="mono">${esc(s.normalized_path)}</small></div><span>${esc(s.preflight_status||'unknown')}</span></div>`).join('')||'<div class="empty">No sources assigned.</div>'}</div><div class="actions" style="margin-top:10px"><button id="preflight" class="btn">Run preflight</button></div></div></div><div class="section"><div class="sectionHead"><h2>Target & Backup</h2></div><div class="sectionBody"><div class="storageGrid"><div class="storageCard"><h3>Target</h3><div class="storagePath mono">${esc(storage.target_root||'Not selected')}</div><button class="btn" id="chooseTarget">${storage.target_root?'Change':'Select / Create folder'}</button>${storage.target_volume?`<small class="muted">${esc(storage.target_volume.name)} · ${bytes(storage.target_volume.free_bytes)} free</small>`:''}</div><div class="storageCard"><h3>Backup</h3><div class="storagePath mono">${esc(storage.backup_root||'Not selected')}</div><button class="btn" id="chooseBackup">${storage.backup_root?'Change':'Select / Create folder'}</button>${storage.backup_volume?`<small class="muted">${esc(storage.backup_volume.name)} · ${bytes(storage.backup_volume.free_bytes)} free</small>`:''}</div></div><p class="muted" style="margin:10px 0 0">Target and Backup are selected from storage volumes currently visible to WSL. No typed path is accepted.</p></div></div>`;$('editSources').onclick=()=>openSourcePicker(p,srcs);$('chooseTarget').onclick=()=>openDestinationPicker(p,'target',storage);$('chooseBackup').onclick=()=>openDestinationPicker(p,'backup',storage);$('preflight').onclick=async()=>{try{let x=await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/preflight`);toast(x.ready?'Preflight ready':`${x.blocking_count} blocking issue(s)`);renderScope(p)}catch(e){toast(e.message)}}}catch(e){c.innerHTML=`<div class="errorBox">${esc(e.message)}</div>`}}
'''
src = src[:start] + render_scope + src[end:]

insert = src.index('function openConfig(){')
picker = r'''async function openDestinationPicker(p,kind,storage){let selected=storage[`${kind}_root`]||'',currentPath='';openModal(`${kind==='target'?'Target':'Backup'} — choose actual WSL storage`,'<div id="destMount" class="empty">Loading available volumes…</div>','<button class="btn" data-close>Cancel</button>');let root=$('destMount');async function browse(pathValue){currentPath=pathValue;try{let [volResult,folderResult]=await Promise.all([api('/turn01/volumes'),api(`/turn01/fs?path=${encodeURIComponent(pathValue)}`)]);let volumes=volResult.volumes||[],d=folderResult,active=d.volume?.path||'';root.className='';root.innerHTML=`<div class="picker3"><div class="pane"><div class="paneHead">Available volumes</div><div class="paneBody">${volumes.map(vol=>`<button class="pickBtn ${active===vol.path?'active':''}" data-volume="${esc(vol.path)}"><b>${esc(vol.name)}</b><small>${bytes(vol.free_bytes)} free · ${esc(vol.path)}</small></button>`).join('')||'<div class="empty">No volumes currently available to WSL</div>'}</div></div><div class="pane"><div class="paneHead">Folders on ${esc(d.volume?.name||'volume')}</div><div class="pathBar">${esc(d.path)}</div><div class="paneBody">${d.parent?`<div class="folderRow"><button data-browse="${esc(d.parent)}">..</button><button class="select" data-select="${esc(d.path)}">Select this folder</button></div>`:`<div class="folderRow"><div><b>${esc(d.volume?.name||'Volume root')}</b></div><button class="select" data-select="${esc(d.path)}">Select root</button></div>`}${(d.folders||[]).map(f=>`<div class="folderRow"><button data-browse="${esc(f.path)}">${esc(f.name)}</button><button class="select" data-select="${esc(f.path)}">Select</button></div>`).join('')||'<div class="empty">No subfolders in this location</div>'}</div></div><div class="pane"><div class="paneHead">Chosen ${kind}</div><div class="choice"><div class="choicePath mono">${esc(selected||'Nothing selected')}</div><p class="muted">Browse the real folders on the selected volume, choose an existing folder, or create one in the folder currently shown.</p><div class="createRow"><input id="newFolderName" class="input" placeholder="New folder name"><button id="createFolder" class="btn">+ Create</button></div><button id="saveDestination" class="btn primary" style="margin-top:10px" ${selected?'':'disabled'}>Save ${kind}</button></div></div></div>`;document.querySelectorAll('[data-volume]').forEach(n=>n.onclick=()=>browse(n.dataset.volume));document.querySelectorAll('[data-browse]').forEach(n=>n.onclick=()=>browse(n.dataset.browse));document.querySelectorAll('[data-select]').forEach(n=>n.onclick=()=>{selected=n.dataset.select;browse(currentPath)});$('createFolder').onclick=async()=>{let name=$('newFolderName').value.trim();if(!name)return;try{let made=await api('/turn01/fs/folder',{method:'POST',body:JSON.stringify({parent:d.path,name})});selected=made.path;await browse(d.path);toast('Folder created and selected')}catch(e){toast(e.message)}};$('saveDestination').onclick=async()=>{try{let body={};body[`${kind}_root`]=selected;await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`,{method:'PUT',body:JSON.stringify(body)});$('modalRoot').innerHTML='';renderScope(p);toast(`${kind} saved`)}catch(e){toast(e.message)}}}catch(e){root.className='errorBox';root.textContent=e.message}}try{let v=await api('/turn01/volumes'),volumes=v.volumes||[];let initial=selected||volumes[0]?.path;if(!initial){root.className='errorBox';root.textContent='No storage volumes are currently visible to WSL.';return}await browse(initial)}catch(e){root.className='errorBox';root.textContent=e.message}}
'''
src = src[:insert] + picker + src[insert:]

# Mechanical contract: Target/Backup browsing must use the constrained WSL-volume folder endpoint.
fn_start = src.index('async function openDestinationPicker')
fn_end = src.index('function openConfig(){', fn_start)
fn = src[fn_start:fn_end]
if '/turn01/fs?path=' not in fn or "data-volume" not in fn or 'd.folders' not in fn:
    raise SystemExit('destination picker contract incomplete')
if "api(`/fs?path=" in fn:
    raise SystemExit('destination picker escaped constrained WSL volume endpoint')

Path(sys.argv[2]).write_text(src)
print('Turn 01 Base UI rebuilt from accepted pre-base')
