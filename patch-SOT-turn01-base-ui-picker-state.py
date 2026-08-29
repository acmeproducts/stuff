#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 3:
    raise SystemExit('usage: patch-SOT-turn01-base-ui-picker-state.py <base-ui.html> <output.html>')

src = Path(sys.argv[1]).read_text()
for marker in [
    "const BUILD='SOT-turn01-base';",
    'TURN01_BASE_STORAGE_PICKER',
    'async function openDestinationPicker(p,kind,storage){',
    '/turn01/volumes',
    '/turn01/fs?path='
]:
    if marker not in src:
        raise SystemExit(f'clean Base UI marker missing: {marker}')

src = src.replace('storage volumes currently visible to WSL. No typed path is accepted.', 'dynamically discovered storage volumes. No typed path is accepted.', 1)
src = src.replace("`${kind==='target'?'Target':'Backup'} — choose actual WSL storage`", "`${kind==='target'?'Target':'Backup'} — choose storage`", 1)

start = src.index('async function openDestinationPicker(p,kind,storage){')
end = src.index('function openConfig(){', start)
replacement = r'''async function openDestinationPicker(p,kind,storage){let selected=storage[`${kind}_root`]||'',currentPath='';openModal(`${kind==='target'?'Target':'Backup'} — choose storage`,'<div id="destMount" class="empty">Loading available volumes…</div>','<button class="btn" data-close>Cancel</button>');let root=$('destMount');async function captureBrowse(pathValue){let body={};body[`${kind}_browse_root`]=pathValue;storage=await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`,{method:'PUT',body:JSON.stringify(body)})}async function browse(pathValue){currentPath=pathValue;try{let [volResult,folderResult]=await Promise.all([api('/turn01/volumes'),api(`/turn01/fs?path=${encodeURIComponent(pathValue)}`)]);let volumes=volResult.volumes||[],d=folderResult,active=d.volume?.path||'';await captureBrowse(d.path);root.className='';root.innerHTML=`<div class="picker3"><div class="pane"><div class="paneHead">Available volumes</div><div class="paneBody">${volumes.map(vol=>`<button class="pickBtn ${active===vol.path?'active':''}" data-volume="${esc(vol.path)}"><b>${esc(vol.name)}</b><small>${bytes(vol.free_bytes)} free · ${esc(vol.path)}</small></button>`).join('')||'<div class="empty">No discovered storage volumes</div>'}</div></div><div class="pane"><div class="paneHead">Folders on ${esc(d.volume?.name||'volume')}</div><div class="pathBar">${esc(d.path)}</div><div class="paneBody">${d.parent?`<div class="folderRow"><button data-browse="${esc(d.parent)}">..</button><button class="select" data-select="${esc(d.path)}">Select this folder</button></div>`:`<div class="folderRow"><div><b>${esc(d.volume?.name||'Volume root')}</b></div><button class="select" data-select="${esc(d.path)}">Select root</button></div>`}${(d.folders||[]).map(f=>`<div class="folderRow"><button data-browse="${esc(f.path)}">${esc(f.name)}</button><button class="select" data-select="${esc(f.path)}">Select</button></div>`).join('')||'<div class="empty">No subfolders in this location</div>'}</div></div><div class="pane"><div class="paneHead">Chosen ${kind}</div><div class="choice"><div class="choicePath mono">${esc(selected||'Nothing selected')}</div><p class="muted">The current volume/folder is captured automatically. Choose an existing folder for ${kind}, or create one in the folder currently shown.</p><div class="createRow"><input id="newFolderName" class="input" placeholder="New folder name"><button id="createFolder" class="btn">+ Create</button></div><button id="saveDestination" class="btn primary" style="margin-top:10px" ${selected?'':'disabled'}>Save ${kind}</button></div></div></div>`;document.querySelectorAll('[data-volume]').forEach(n=>n.onclick=()=>browse(n.dataset.volume));document.querySelectorAll('[data-browse]').forEach(n=>n.onclick=()=>browse(n.dataset.browse));document.querySelectorAll('[data-select]').forEach(n=>n.onclick=()=>{selected=n.dataset.select;browse(currentPath)});$('createFolder').onclick=async()=>{let name=$('newFolderName').value.trim();if(!name)return;try{let made=await api('/turn01/fs/folder',{method:'POST',body:JSON.stringify({parent:d.path,name})});selected=made.path;await browse(made.path);toast('Folder created and selected')}catch(e){toast(e.message)}};$('saveDestination').onclick=async()=>{try{let body={};body[`${kind}_root`]=selected;body[`${kind}_browse_root`]=currentPath;await api(`/turn01/projects/${encodeURIComponent(p.project_token)}/storage`,{method:'PUT',body:JSON.stringify(body)});$('modalRoot').innerHTML='';renderScope(p);toast(`${kind} saved`)}catch(e){toast(e.message)}}}catch(e){root.className='errorBox';root.textContent=e.message}}try{let v=await api('/turn01/volumes'),volumes=v.volumes||[];let remembered=storage[`${kind}_browse_root`]||'',initial=remembered||selected||volumes[0]?.path;if(initial&&!volumes.some(vol=>initial===vol.path||initial.startsWith(vol.path+'/')))initial=volumes[0]?.path;if(!initial){root.className='errorBox';root.textContent='No storage volumes are currently discovered.';return}await browse(initial)}catch(e){root.className='errorBox';root.textContent=e.message}}
'''
src = src[:start] + replacement + src[end:]

fn = src[src.index('async function openDestinationPicker'):src.index('function openConfig(){', src.index('async function openDestinationPicker'))]
for marker in ['captureBrowse','`${kind}_browse_root`','remembered=storage[`${kind}_browse_root`]','await browse(initial)','/turn01/fs?path=']:
    if marker not in fn:
        raise SystemExit(f'picker persistence contract missing: {marker}')

Path(sys.argv[2]).write_text(src)
print('Base UI picker state persistence applied to clean rebuilt UI')
