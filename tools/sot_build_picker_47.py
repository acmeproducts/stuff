from pathlib import Path
import re

p=Path('project.html')
s=p.read_text()
assert 'Build: 2026.08.11.4.5' in s
assert "BUILD_ID='2026.08.11.4.5'" in s
assert 'data-add-folder' in s
assert 'Added to project' in s

s=s.replace('Build: 2026.08.11.4.5','Build: 2026.08.11.4.7',1)
s=s.replace("BUILD_ID='2026.08.11.4.5'","BUILD_ID='2026.08.11.4.7'",1)

css='''
/* THREE-PANEL SOURCE PICKER · build 2026.08.11.4.7 · rebuilt from .4.5 */
.sourcepick-modal{width:min(1280px,96vw);height:min(760px,88vh);min-height:560px;max-height:94vh;overflow:hidden;resize:both}
.sourcepick-modal .modalhead{padding:17px 20px;background:#fff}
.sourcepick-modal .explorer{height:calc(100% - 74px);min-height:0;max-height:none;grid-template-columns:230px minmax(420px,1fr) 310px}
.sourcepick-modal .places{min-height:0;overflow:auto;background:#fafbfc;padding:12px 10px}
.sourcepick-modal .explorer-main{min-height:0;overflow:hidden}
.sourcepick-modal .explorerbar{display:grid;grid-template-columns:auto auto minmax(170px,1fr) auto minmax(150px,220px);gap:8px;align-items:center;padding:10px 12px;background:#fbfcfd}
.sourcepick-modal .browserpath{height:38px;display:flex;align-items:center;background:#fff;border-color:#d6dbe3}
.sourcepick-modal .browserlist{flex:1;min-height:0;overflow:auto;background:#fff}
.sourcepick-modal .selectedpane{min-height:0;background:#fbfcfd}
.sourcepick-modal .selectedlist{min-height:0;overflow:auto}
.sourcepick-modal .selectedactions{background:#fff}
.location-row{display:grid;grid-template-columns:28px minmax(0,1fr);align-items:center;border-radius:9px;margin:2px 0}
.location-row.active{background:#edf1f5}.location-check,.folder-check{width:16px;height:16px;margin:auto;accent-color:#59677a}
.location-open{border:0;background:transparent;text-align:left;padding:9px 8px;border-radius:8px;color:#283445;font-weight:650;min-width:0}
.location-open:hover{background:#f0f3f7}.location-open small{display:block;color:#8a94a4;font-weight:500;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sourcepick-head,.sourcepick-row{display:grid;grid-template-columns:34px minmax(180px,1fr) 88px;gap:8px;align-items:center}
.sourcepick-head{position:sticky;top:0;z-index:3;background:#f8fafc;border-bottom:1px solid var(--line);padding:8px 13px;color:#667085;font-size:11px;font-weight:800}
.sourcepick-row{min-height:46px;padding:8px 13px;border-bottom:1px solid #edf0f4}.sourcepick-row:hover{background:#fafbfd}
.sourcepick-open{border:0;background:transparent;text-align:left;padding:0;color:#273345;font-weight:620;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.sourcepick-file{font-weight:500;color:#475467}.sourcepick-kind{font-size:11px;color:#98a2b3;text-align:right}
.sourcepick-sort{border:0;background:transparent;text-align:left;padding:0;color:inherit;font-weight:inherit}
.sourcepick-search{height:38px;border:1px solid #d6dbe3;border-radius:8px;padding:0 10px;outline:none;min-width:0;background:#fff}.sourcepick-search:focus{border-color:#9ba7b6;box-shadow:0 0 0 3px #f0f2f5}
.sourcepick-add{background:#526174!important;border-color:#526174!important;color:#fff!important;white-space:nowrap}.sourcepick-add:disabled{opacity:.42}
.sourcepick-status{display:flex;justify-content:space-between;gap:10px;padding:7px 13px;border-top:1px solid var(--line);font-size:11px;color:#6f7a89;background:#fafbfc}
@media(max-width:900px){.sourcepick-modal{width:97vw;resize:none}.sourcepick-modal .explorer{grid-template-columns:190px minmax(330px,1fr) 260px}.sourcepick-modal .explorerbar{grid-template-columns:auto auto minmax(140px,1fr) auto}.sourcepick-search{grid-column:1/-1}}
'''
s=s.replace('</style>',css+'\n</style>',1)

source_fn=r'''
function openSourceExplorer(){
  const root=$('#modalRoot');let selectedRoot=null,current=null,folders=[],files=[],history=[],sortDir=1,search='';let staged=[...state.intake.sources];const checked=new Set();const initialKeys=state.intake.sources.map(sourceKey).sort().join('\n');
  root.innerHTML=`<div class="modalback"><div class="modal sourcepick-modal"><div class="modalhead"><div><h3>Add locations</h3><div class="subtle">Check a whole volume or browse into it and check individual folders. Nothing is committed until Save selections.</div></div><button class="close" id="x">×</button></div><div class="explorer three"><aside class="places"><div class="places-title">Locations</div><div id="placesList"></div></aside><section class="explorer-main"><div class="explorerbar"><button class="btn small" id="up" disabled>↑ Up</button><button class="btn small" id="rescan">↻ Rescan</button><div class="browserpath" id="path">Select a storage location</div><button class="btn sourcepick-add" id="addChecked" disabled>＋ Add to project</button><input class="sourcepick-search" id="sourceSearch" placeholder="Search this location" aria-label="Search this location"></div><div class="browserlist" id="browserList"><div class="empty"><strong>Choose a location</strong>Check a volume to select all of it, or click its name to browse folders.</div></div><div class="sourcepick-status"><strong id="currentStatus">No location selected</strong><span id="itemCount">0 items</span></div></section><aside class="selectedpane"><div class="selectedhead"><strong>Added to project <span class="badge" id="selectedCount">0</span></strong><span class="subtle">Review before saving</span></div><div class="selectedlist" id="selectedList"></div><div class="selectedactions"><button class="btn primary" id="saveLocations">Save selections</button><button class="btn" id="cancelLocations">Cancel</button></div></aside></div></div></div>`;
  const hasUnsaved=()=>staged.map(sourceKey).sort().join('\n')!==initialKeys;const close=(force=false)=>{if(!force&&hasUnsaved()&&!confirm('Discard the source selections you have not saved?'))return false;root.innerHTML='';return true};$('#x').onclick=()=>close(false);
  const stagedHas=path=>staged.some(x=>sourceKey(x)===sourceKey(path));function updateAdd(){const b=$('#addChecked');b.disabled=checked.size===0;b.textContent=checked.size?`＋ Add to project (${checked.size})`:'＋ Add to project'}
  function toggle(path,on){if(on)checked.add(path);else checked.delete(path);updateAdd();renderPlaces();renderRows()}
  function renderPlaces(){$('#placesList').innerHTML=state.roots.map(r=>`<div class="location-row ${selectedRoot?.path===r.path?'active':''}"><input class="location-check" type="checkbox" data-root-check="${esc(r.path)}" ${checked.has(r.path)?'checked':''}><button class="location-open" data-place="${esc(r.path)}">▣ ${esc(r.label)}<small>${esc(r.path)}</small></button></div>`).join('')+((HAS_DIRECTORY_PICKER||HAS_DIRECTORY_INPUT)?`<div class="location-row"><span style="text-align:center">▯</span><button class="location-open" id="devicePlace">This device<small>Choose a local folder</small></button></div>`:'');document.querySelectorAll('[data-root-check]').forEach(c=>c.onchange=e=>toggle(c.dataset.rootCheck,e.target.checked));document.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>selectRoot(state.roots.find(r=>r.path===b.dataset.place)));$('#devicePlace')?.addEventListener('click',pickLocalSourceAndStage)}
  function renderSelected(){$('#selectedCount').textContent=String(staged.length);$('#selectedList').innerHTML=staged.length?staged.map((src,i)=>`<div class="selecteditem"><div class="loc">${esc(sourceDisplay(src))}</div><button data-unselect="${i}" title="Remove">×</button></div>`).join(''):'<div class="empty"><strong>Nothing added yet</strong>Selected locations will stay visible here until you save.</div>';document.querySelectorAll('[data-unselect]').forEach(b=>b.onclick=()=>{staged.splice(Number(b.dataset.unselect),1);renderSelected()})}
  async function selectRoot(r){if(!r)return;selectedRoot=r;current=r.path;history=[current];search='';$('#sourceSearch').value='';renderPlaces();await load(current)}
  async function load(path){if(!selectedRoot)return;$('#browserList').innerHTML='<div class="empty">Loading…</div>';try{const d=await apiFs(path);current=d.path||path;folders=d.folders||[];files=d.files||[];$('#path').textContent=current;$('#up').disabled=history.length<=1;$('#currentStatus').textContent=current;renderRows()}catch(e){$('#browserList').innerHTML=`<div class="empty"><strong>Unable to browse</strong>${esc(e.message)}</div>`;toast(e.message,'error')}}
  function renderRows(){if(!$('#browserList'))return;const q=search.trim().toLowerCase();const fs=[...folders].filter(n=>!q||n.toLowerCase().includes(q)).sort((a,b)=>a.localeCompare(b)*sortDir);const ff=[...files].filter(n=>!q||n.toLowerCase().includes(q)).sort((a,b)=>a.localeCompare(b)*sortDir);const head=`<div class="sourcepick-head"><span></span><button class="sourcepick-sort" id="sortName">Name ${sortDir===1?'↑':'↓'}</button><span>Type</span></div>`;const folderRows=fs.map(n=>{const path=joinPath(current,n);return`<div class="sourcepick-row"><input class="folder-check" type="checkbox" data-folder-check="${esc(path)}" ${checked.has(path)?'checked':''}><button class="sourcepick-open" data-drill="${esc(n)}">▱ ${esc(n)}</button><span class="sourcepick-kind">Folder</span></div>`}).join('');const fileRows=ff.map(n=>`<div class="sourcepick-row"><span></span><span class="sourcepick-open sourcepick-file">▧ ${esc(n)}</span><span class="sourcepick-kind">File</span></div>`).join('');$('#browserList').innerHTML=head+(folderRows+fileRows||'<div class="empty">No matching items.</div>');$('#itemCount').textContent=`${fs.length+ff.length} item${fs.length+ff.length===1?'':'s'}`;$('#sortName').onclick=()=>{sortDir*=-1;renderRows()};document.querySelectorAll('[data-folder-check]').forEach(c=>c.onchange=e=>toggle(c.dataset.folderCheck,e.target.checked));document.querySelectorAll('[data-drill]').forEach(b=>b.onclick=async()=>{const next=joinPath(current,b.dataset.drill);history.push(next);await load(next)})}
  $('#addChecked').onclick=()=>{let added=0;for(const path of [...checked])if(!stagedHas(path)){staged.push(path);added++}checked.clear();updateAdd();renderPlaces();renderRows();renderSelected();if(added)toast(`${added} location${added===1?'':'s'} added to project draft.`)};$('#up').onclick=async()=>{if(history.length<=1)return;history.pop();await load(history[history.length-1])};$('#rescan').onclick=()=>current?load(current):checkServices().then(renderPlaces);$('#sourceSearch').oninput=e=>{search=e.target.value;renderRows()};$('#saveLocations').onclick=()=>{state.intake.sources=staged;close(true);renderIntake();toast(`${staged.length} location${staged.length===1?'':'s'} saved to draft.`)};$('#cancelLocations').onclick=()=>close(false);
  async function pickLocalSourceAndStage(){const src=await pickLocalDeviceSource();if(src&&!staged.some(s=>sourceKey(s)===sourceKey(src))){staged.push(src);renderSelected();toast('Device location staged.')}}renderPlaces();renderSelected();updateAdd();
}
'''
marker='function parentPath(path,root)'
assert marker in s
s=s.replace(marker,source_fn+'\n'+marker,1)
old='function openExplorer(mode){const root=$\'#modalRoot\''
# exact baseline uses literal function opening; replace safer below
needle="function openExplorer(mode){const root=$('#modalRoot');"
assert needle in s
s=s.replace(needle,"function openExplorer(mode){if(mode==='source')return openSourceExplorer();const root=$('#modalRoot');",1)
p.write_text(s)

b=Path('project-backlog.md')
t=b.read_text()
entry='''\n## Owner gate candidate — build 2026.08.11.4.7\n\nRebuilt from exact working `.4.5` baseline; `.4.6` is rejected and is not an implementation input. Scope is limited to the approved three-panel source picker redesign while preserving `.4.5` filesystem enumeration/API behavior.\n\n- Three persistent panels: **Locations / Contents / Added to project**.\n- Location checkbox selects an entire volume; clicking its name browses without selecting.\n- Folder checkbox selects that folder; clicking its name drills deeper.\n- **Add to project** stages checked items into the persistent third panel.\n- Third panel supports × removal, Save selections, and Cancel.\n- Contents scroll independently; Add to project remains visible.\n- Search and Name sort are available in the contents panel.\n- No backend/server/port/routing change is part of this UI build.\n\n'''
if '## Owner gate candidate — build 2026.08.11.4.7' not in t:
    t=t.replace('# 2. RELEASE CHAIN',entry+'# 2. RELEASE CHAIN')
b.write_text(t)
