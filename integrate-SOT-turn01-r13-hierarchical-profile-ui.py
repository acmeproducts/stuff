#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-r13-hierarchical-profile-ui.py <r12.html> <r13.html>')
src=Path(sys.argv[1]).read_text()
for x in ["const BUILD='SOT-turn01-base-r12-discover-profile-action'",'async function load(render=true){','function dashboard(){','function activity(){','function draw(){','function tagChips(x){']:
    if src.count(x)!=1: raise SystemExit(f'R12 contract failed {x}: {src.count(x)}')

def span(text,name):
    m=list(re.finditer(r'(?m)(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(',text))
    if len(m)!=1: raise SystemExit(f'function {name} ambiguous {len(m)}')
    a=m[0].start(); b=text.find('{',m[0].end()); d=0; q=None; e=False
    for i in range(b,len(text)):
        c=text[i]
        if q:
            if e:e=False
            elif c=='\\':e=True
            elif c==q:q=None
        else:
            if c in "'\"`":q=c
            elif c=='{':d+=1
            elif c=='}':
                d-=1
                if d==0:return a,i+1
    raise SystemExit('unbalanced '+name)
def repl(text,name,val):
    a,b=span(text,name); return text[:a]+val.rstrip()+text[b:]

src=src.replace("const BUILD='SOT-turn01-base-r12-discover-profile-action'","const BUILD='SOT-turn01-base-r13-hierarchical-master-detail'",1)
old="setup:{},profile:null,discover:null,selection:new Set(),openDisclosure:new Set()}"
new="setup:{},profile:null,discover:null,selection:new Set(),openDisclosure:new Set(),selectedNode:localStorage.getItem('sot.r13.node')||'',expandedFolders:new Set(JSON.parse(localStorage.getItem('sot.r13.expanded')||'[]'))}"
if src.count(old)!=1: raise SystemExit('R13 state contract mismatch')
src=src.replace(old,new,1)

css=r'''
/* R13 hierarchical master-detail Profile */
.volumeLayout{display:grid;grid-template-columns:minmax(260px,34%) 1fr;gap:12px;min-height:58vh}.masterPane,.detailPane{border:1px solid var(--line);border-radius:11px;background:var(--p);min-width:0;overflow:hidden}.paneHead{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line);background:#0b1a26}.tree{padding:6px;max-height:68vh;overflow:auto}.treeRow{display:flex;align-items:center;gap:5px;min-height:34px;border-radius:7px;padding-right:7px;cursor:pointer}.treeRow:hover,.treeRow.sel{background:#173047}.treeToggle{border:0;background:transparent;color:var(--mut);width:24px;height:28px;padding:0;cursor:pointer}.treeName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700}.treeMeta{margin-left:auto;color:var(--mut);font-size:11px}.detailScroll{max-height:68vh;overflow:auto}.detailRow{display:grid;grid-template-columns:30px minmax(220px,2fr) 100px 150px minmax(180px,1fr);gap:8px;align-items:center;padding:9px 11px;border-bottom:1px solid #1d3040;cursor:pointer}.detailRow:hover,.detailRow.sel{background:#102334}.detailTitle{font-weight:800}.detailPath{font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.nodeSummary{padding:12px;border-bottom:1px solid var(--line);background:#0a1722}.tagEditorWrap{position:relative;display:flex;gap:7px;align-items:center;flex-wrap:wrap}.tagEditor{min-width:220px;flex:1;background:#0d1b27;color:var(--txt);border:1px solid var(--line);border-radius:8px;padding:9px}.tagSuggestions{position:absolute;left:0;top:42px;z-index:30;min-width:240px;max-width:460px;max-height:230px;overflow:auto;background:#08141f;border:1px solid #35536b;border-radius:9px;box-shadow:0 12px 30px #0009}.tagSuggestions:empty{display:none}.tagSuggestion{display:block;width:100%;text-align:left;border:0;border-bottom:1px solid #1d3040;background:transparent;color:var(--txt);padding:9px 11px;cursor:pointer}.tagSuggestion:hover{background:#173047}.commonTags{display:flex;gap:5px;flex-wrap:wrap;align-items:center}.contextNote{font-size:11px;color:var(--mut)}.fileMeta{display:grid;grid-template-columns:140px 1fr;gap:8px;padding:12px}.fileMeta b{color:var(--mut)}@media(max-width:800px){.volumeLayout{grid-template-columns:1fr}.masterPane{max-height:34vh}.tree{max-height:29vh}.detailScroll{max-height:none}.detailRow{grid-template-columns:28px 1fr auto}.detailRow .vdate{display:none}.detailRow .vtags{grid-column:2/4}.tagEditor{min-width:160px}}
'''
src=src.replace('</style>',css+'</style>',1)

src=repl(src,'load',r'''async function load(render=true){let [s,p,a,i,profile,discover]=await Promise.all([api('/turn01/ssot'),api('/turn01/projects'),api('/activity?limit=80').catch(()=>({events:[]})),api('/turn01/intelligence?limit=100').catch(()=>null),api('/turn01/profile?limit=5000'),api('/turn01/discover')]);state.ssot=s;state.projects=p.projects||p||[];state.activity=a.events||a.activity||a||[];state.intel=i;state.profile=profile;state.discover=discover;merge();if(render&&!editingSurface())draw()}''')

src=repl(src,'tagChips',r'''function tagChips(x){return(x.effective_tags||[]).map(t=>{let inherited=!t.direct,tt=inherited?'folder':x.type,key=inherited?t.from:x.key;return`<span class="tagchip ${inherited?'inherited':''}" title="${inherited?'Inherited from '+t.from:'Direct tag'}">${esc(t.display_name||t.name)}<button class="tagx" aria-label="Remove ${esc(t.display_name||t.name)}" onclick='event.stopPropagation();removeOneTag(${JSON.stringify(tt)},${JSON.stringify(key)},${JSON.stringify(t.name)})'>×</button></span>`}).join('')}''')

helpers=r'''
function editingSurface(){let a=document.activeElement;return !!a&&(a.matches('input,textarea,select')||a.isContentEditable)}
function pathParent(p){p=String(p||'').replace(/[\\/]+$/,'');let i=Math.max(p.lastIndexOf('/'),p.lastIndexOf('\\'));return i>0?p.slice(0,i):''}
function itemMap(){return new Map((state.profile?.items||[]).map(x=>[x.type+'|'+x.key,x]))}
function folderMap(){return new Map((state.profile?.items||[]).filter(x=>x.type==='folder').map(x=>[x.path,x]))}
function directChildren(path){return (state.profile?.items||[]).filter(x=>pathParent(x.path)===path)}
function nodeMatches(x,q){if(!q)return true;return [x.name,x.path,x.fingerprint,...(x.effective_tags||[]).map(t=>t.name),...(x.effective_tags||[]).map(t=>t.display_name)].join(' ').toLowerCase().includes(q)}
function contextFolders(){let q=String(state.query||'').trim().toLowerCase(),fm=folderMap();if(!q)return new Set(fm.keys());let keep=new Set();for(const x of state.profile?.items||[]){if(!nodeMatches(x,q))continue;let p=x.type==='folder'?x.path:pathParent(x.path);while(p){if(fm.has(p))keep.add(p);let up=pathParent(p);if(!up||up===p)break;p=up}}return keep}
function rootFolders(){let fm=folderMap();return [...fm.values()].filter(f=>!fm.has(pathParent(f.path))).sort((a,b)=>String(a.path).localeCompare(String(b.path)))}
function chooseNode(type,key){state.selectedNode=type+'|'+key;localStorage.setItem('sot.r13.node',state.selectedNode);draw()}
function toggleTree(path){if(state.expandedFolders.has(path))state.expandedFolders.delete(path);else state.expandedFolders.add(path);localStorage.setItem('sot.r13.expanded',JSON.stringify([...state.expandedFolders]));draw()}
function treeNode(f,depth,ctx,q){let kids=directChildren(f.path).filter(x=>x.type==='folder').sort((a,b)=>String(a.name).localeCompare(String(b.name))),has=kids.length>0,open=state.expandedFolders.has(f.path)||!!q,sel=state.selectedNode==='folder|'+f.key;if(q&&!ctx.has(f.path))return'';return`<div class="treeRow ${sel?'sel':''}" style="padding-left:${depth*15}px" onclick='chooseNode("folder",${JSON.stringify(f.key)})'><button class="treeToggle" onclick='event.stopPropagation();toggleTree(${JSON.stringify(f.path)})'>${has?(open?'▾':'▸'):'·'}</button><span class="treeName">${esc(f.name||f.path)}</span><span class="treeMeta">${Number(f.file_count||0).toLocaleString()}</span></div>${open?kids.map(k=>treeNode(k,depth+1,ctx,q)).join(''):''}`}
function treeHTML(){let q=String(state.query||'').trim().toLowerCase(),ctx=contextFolders();return rootFolders().map(f=>treeNode(f,0,ctx,q)).join('')||'<div class="empty">No folder hierarchy matches Omnisearch.</div>'}
function selectedItem(){let m=itemMap();let x=m.get(state.selectedNode);if(x)return x;let root=rootFolders()[0];if(root){state.selectedNode='folder|'+root.key;return root}return null}
function detailChildren(folder){let q=String(state.query||'').trim().toLowerCase(),ctx=contextFolders();return directChildren(folder.path).filter(x=>!q||nodeMatches(x,q)||(x.type==='folder'&&ctx.has(x.path))).sort((a,b)=>a.type===b.type?String(a.name).localeCompare(String(b.name)):a.type==='folder'?-1:1)}
function detailRowR13(x){let k=x.type+'|'+x.key,checked=state.selection.has(k),date=x.modified_at||x.created_at||'';return`<div class="detailRow ${state.selectedNode===k?'sel':''}" onclick='chooseNode(${JSON.stringify(x.type)},${JSON.stringify(x.key)})'><input type="checkbox" ${checked?'checked':''} onclick="event.stopPropagation()" onchange='toggleSel(${JSON.stringify(x.type)},${JSON.stringify(x.key)},this.checked)'><div><div class="detailTitle">${x.type==='folder'?'▸ ':''}${esc(x.name||x.path)}</div><div class="detailPath">${esc(x.path)}</div>${x.fingerprint?`<div class="detailPath mono">${esc(x.fingerprint)}</div>`:''}</div><div>${x.type==='folder'?Number(x.file_count||0).toLocaleString()+' files':bytes(x.size)}</div><div class="vdate">${esc(date)}</div><div class="vtags">${tagChips(x)}</div></div>`}
function activeTargets(){let s=selectedTargets();if(s.length)return s;let x=selectedItem();return x?[{type:x.type,key:x.key}]:[]}
function commonSelectedTags(){let chosen=selectedTargets(),m=itemMap();if(!chosen.length)return[];let sets=chosen.map(t=>new Set((m.get(t.type+'|'+t.key)?.effective_tags||[]).map(x=>x.name)));return [...sets[0]].filter(n=>sets.every(s=>s.has(n))).sort()}
function bulkRemovalTargets(tag){let chosen=selectedTargets(),m=itemMap(),seen=new Set(),out=[];for(const t of chosen){let x=m.get(t.type+'|'+t.key);for(const a of (x?.effective_tags||[]).filter(v=>v.name===tag)){let type=a.direct?x.type:'folder',key=a.direct?x.key:a.from,k=type+'|'+key;if(!seen.has(k)){seen.add(k);out.push({type,key})}}}return out}
async function bulkRemoveChip(tag){let targets=bulkRemovalTargets(tag);if(targets.length)await tagMutation('remove',tag,targets)}
function tagSuggest(input){let box=$('#tagSuggestions'),q=String(input.value||'').trim().toLowerCase();if(!box)return;let tags=(state.profile?.tags||[]).filter(t=>!q||String(t.normalized_name||'').includes(q)||String(t.display_name||'').toLowerCase().includes(q)).slice(0,20);box.innerHTML=q?tags.map(t=>`<button class="tagSuggestion" type="button" onmousedown="event.preventDefault()" onclick='assignSuggested(${JSON.stringify(t.display_name||t.normalized_name)})'>${esc(t.display_name||t.normalized_name)}</button>`).join(''):''}
async function assignSuggested(tag){let input=$('#tagEditor');if(input)input.value=tag;await commitTagEditor()}
async function tagKey(e,input){if(e.key==='Enter'){e.preventDefault();e.stopPropagation();await commitTagEditor()}else if(e.key==='Escape'){$('#tagSuggestions').innerHTML=''}}
async function commitTagEditor(){let input=$('#tagEditor'),tag=String(input?.value||'').trim(),targets=activeTargets();if(!tag||!targets.length)return;await tagMutation('add',tag,targets);requestAnimationFrame(()=>{$('#tagEditor')?.focus()})}
function selectionCommonHTML(){let tags=commonSelectedTags();return tags.length?tags.map(n=>`<span class="tagchip">${esc(n)}<button class="tagx" aria-label="Remove ${esc(n)} from selection" onclick='bulkRemoveChip(${JSON.stringify(n)})'>×</button></span>`).join(''):'<span class="contextNote">No common assigned tags</span>'}
function folderDetail(x){let kids=detailChildren(x);return`<div class="nodeSummary"><b>${esc(x.path)}</b><div class="contextNote">${Number(x.file_count||0).toLocaleString()} files · ${bytes(x.size)} · ${tagChips(x)}</div></div><div class="detailScroll">${kids.length?kids.map(detailRowR13).join(''):'<div class="empty">No immediate children match this view.</div>'}</div>`}
function fileDetail(x){return`<div class="nodeSummary"><b>${esc(x.name)}</b><div class="detailPath">${esc(x.path)}</div><div>${tagChips(x)}</div></div><div class="fileMeta"><b>Size</b><span>${bytes(x.size)}</span><b>Created</b><span>${esc(x.created_at||'')}</span><b>Modified</b><span>${esc(x.modified_at||'')}</span><b>Fingerprint</b><span class="mono">${esc(x.fingerprint||'')}</span><b>Source</b><span class="mono">${esc(x.source_path||'')}</span></div>`}
'''
insert=src.index('function dashboard(){')
src=src[:insert]+helpers+'\n'+src[insert:]

src=repl(src,'dashboard',r'''function dashboard(){let p=state.profile||{profile:{revision:0},summary:{},items:[],tags:[]},x=selectedItem(),n=state.selection.size;return`<div class="ey">Dynamically versioned SSOT</div><h1>Profile <span class="rev">r${Number(p.profile?.revision||0)}</span></h1><div class="profileMeta"><div class="metric"><span class="mut">Files</span><b>${Number(p.summary?.files||0).toLocaleString()}</b></div><div class="metric"><span class="mut">Folders</span><b>${Number(p.summary?.folders||0).toLocaleString()}</b></div><div class="metric"><span class="mut">Content</span><b>${bytes(p.summary?.bytes||0)}</b></div><div class="metric"><span class="mut">Selected</span><b>${n.toLocaleString()}</b></div></div><div class="bulkbar"><button class="btn" onclick="selectVisible(true)">Select Omnisearch results</button><button class="btn" onclick="selectVisible(false)">Clear selection</button><div class="tagEditorWrap"><input class="tagEditor" id="tagEditor" autocomplete="off" enterkeyhint="done" placeholder="Begin typing tag…" oninput="tagSuggest(this)" onkeydown="tagKey(event,this)"><div class="tagSuggestions" id="tagSuggestions"></div></div><div class="commonTags"><span class="contextNote">Common tags:</span>${selectionCommonHTML()}</div></div><div class="volumeLayout"><section class="masterPane"><div class="paneHead"><b>Folders</b><span class="contextNote">hierarchy</span></div><div class="tree">${treeHTML()}</div></section><section class="detailPane"><div class="paneHead"><b>${x?esc(x.name||x.path):'Details'}</b><span class="contextNote">${x?esc(x.type):''}</span></div>${x?(x.type==='folder'?folderDetail(x):fileDetail(x)):'<div class="empty">No SSOT content.</div>'}</section></div>`}''')

src=repl(src,'activity',r'''function activity(){let n=state.selection.size,p=state.profile?.profile||{revision:0},targets=selectedTargets();return`<div class="ey">Governed SSOT mutation</div><h1>Action</h1><div class="actionHero"><b>${n?n.toLocaleString()+' selected item'+(n===1?'':'s'):'No bulk selection'}</b><div class="mut">Actions are bound to Profile r${Number(p.revision||0)}. Tag assignment is performed from the persistent editor in Profile; assigned/common tags are removed with chip × controls.</div></div><section class="panel"><div class="panelHead"><h2>Selection</h2><span class="mut">Stable keys captured from Profile</span></div><div class="inside selectionList">${targets.length?targets.map(t=>`<div class="mono">${esc(t.type)} · ${esc(t.key)}</div>`).join(''):'<div class="empty">Select folders/files in Profile.</div>'}</div></section><section class="panel"><div class="panelHead"><h2>Common selected tags</h2></div><div class="inside commonTags">${selectionCommonHTML()}</div></section><section class="panel"><div class="panelHead"><h2>Safety-gated physical actions</h2></div><div class="inside mut">Protect, verify, reconcile, relocate, certify and retirement remain governed by fingerprint/protection evidence. R13 does not enable unsafe bulk deletion.</div></section>`}''')

# draw preserves tree/editor state; polling load skips redraw while any editor has focus.
src=repl(src,'draw',r'''function draw(){rememberDisclosure();let fn=state.tab==='dashboard'?dashboard:state.tab==='database'?database:state.tab==='activity'?activity:settings;$('#app').innerHTML=fn();document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===state.tab));restoreDisclosure()}''')

for marker in ['SOT-turn01-base-r13-hierarchical-master-detail','volumeLayout','masterPane','detailPane','treeHTML()','tagSuggest(this)','tagKey(event,this)','editingSurface()','Common tags:','chip × controls','Select Omnisearch results']:
    if marker not in src: raise SystemExit('R13 output contract missing '+marker)
for forbidden in ['>Remove tag</button>','onclick="bulkTag(\'remove\')"']:
    if forbidden in src: raise SystemExit('R13 forbidden generic tag removal remains '+forbidden)
Path(sys.argv[2]).write_text(src)
print('R13 hierarchical master-detail Profile UI integrated')
