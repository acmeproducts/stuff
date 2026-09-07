#!/usr/bin/env python3
from pathlib import Path
import re,sys
if len(sys.argv)!=3: raise SystemExit('usage: integrate-SOT-turn01-r12-virtual-volume-ui.py <r11.html> <r12.html>')
src=Path(sys.argv[1]).read_text()
for x in ["const BUILD='SOT-turn01-base-r11-action-first-cleanup'",'function dashboard(){','function database(){','function activity(){','async function load(render=true){','function draw(){']:
    if src.count(x)!=1: raise SystemExit(f'R11 contract failed {x}: {src.count(x)}')
def span(text,name):
    m=list(re.finditer(r'(?m)(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(',text));
    if len(m)!=1: raise SystemExit(f'function {name} ambiguous {len(m)}')
    a=m[0].start();b=text.find('{',m[0].end());d=0;q=None;e=False
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
    a,b=span(text,name);return text[:a]+val.rstrip()+text[b:]
src=src.replace("const BUILD='SOT-turn01-base-r11-action-first-cleanup'","const BUILD='SOT-turn01-base-r12-discover-profile-action'",1)
old='<nav class="nav"><button data-tab="dashboard" class="on">Dashboard</button><button data-tab="database">Database</button><button data-tab="activity">Activity</button><button data-tab="settings">Settings</button></nav>'
new='<nav class="nav"><button data-tab="database">Discover</button><button data-tab="dashboard" class="on">Profile</button><button data-tab="activity">Action</button><button data-tab="settings" title="Settings">⚙</button></nav>'
if src.count(old)!=1: raise SystemExit('R12 nav contract mismatch')
src=src.replace(old,new,1)
src=src.replace('placeholder="Search projects, fingerprints, paths…"','placeholder="Omnisearch folders, files, fingerprints, tags…"',1)
src=src.replace("setup:{}}","setup:{},profile:null,discover:null,selection:new Set(),openDisclosure:new Set()}",1)
css=r'''
/* R12 SSOT virtual volume */
.profileMeta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}.metric{border:1px solid var(--line);background:var(--p);border-radius:9px;padding:9px 12px}.metric b{display:block;font-size:18px}.bulkbar{position:sticky;top:58px;z-index:7;display:flex;gap:8px;align-items:center;flex-wrap:wrap;padding:10px;background:#0b1b28;border:1px solid var(--line);border-radius:10px;margin:10px 0}.bulkbar input{min-width:190px;background:#0d1b27;color:var(--txt);border:1px solid var(--line);border-radius:7px;padding:8px}.vrow{display:grid;grid-template-columns:32px minmax(220px,2fr) 110px 160px minmax(180px,1fr);gap:8px;align-items:center;padding:9px 11px;border-bottom:1px solid #1d3040}.vrow:hover{background:#102334}.vname{font-weight:800}.vpath{font-size:11px;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tagchip{display:inline-flex;gap:5px;align-items:center;background:#183148;border:1px solid #31536c;border-radius:999px;padding:3px 7px;margin:2px;font-size:12px}.tagchip.inherited{opacity:.72}.tagx{border:0;background:transparent;color:var(--txt);cursor:pointer;padding:0 2px}.sourceRow{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:10px;border-bottom:1px solid var(--line)}.discoverAdd{display:flex;gap:8px}.discoverAdd input{flex:1;background:#0d1b27;color:var(--txt);border:1px solid var(--line);border-radius:7px;padding:9px}.actionHero{border-left:4px solid var(--blue);padding:14px;background:#102132;border-radius:9px}.selectionList{max-height:320px;overflow:auto}.rev{font-family:ui-monospace,monospace}@media(max-width:800px){.vrow{grid-template-columns:30px 1fr auto}.vrow .vdate{display:none}.vrow .vtags{grid-column:2/4}.bulkbar{top:98px}.discoverAdd{flex-direction:column}}
'''
src=src.replace('</style>',css+'</style>',1)
src=repl(src,'load',r'''async function load(render=true){let [s,p,a,i,profile,discover]=await Promise.all([api('/turn01/ssot'),api('/turn01/projects'),api('/activity?limit=80').catch(()=>({events:[]})),api('/turn01/intelligence?limit=100').catch(()=>null),api('/turn01/profile?limit=5000'),api('/turn01/discover')]);state.ssot=s;state.projects=p.projects||p||[];state.activity=a.events||a.activity||a||[];state.intel=i;state.profile=profile;state.discover=discover;merge();if(render)draw()}''')
helpers=r'''
function rememberDisclosure(){state.openDisclosure=new Set([...document.querySelectorAll('details[data-disclosure][open]')].map(x=>x.dataset.disclosure))}
function restoreDisclosure(){for(const id of state.openDisclosure||[])document.querySelector(`details[data-disclosure="${CSS.escape(id)}"]`)?.setAttribute('open','')}
function selectedTargets(){let keys=state.selection||new Set(),map=new Map((state.profile?.items||[]).map(x=>[x.type+'|'+x.key,x]));return[...keys].map(k=>map.get(k)).filter(Boolean).map(x=>({type:x.type,key:x.key}))}
function toggleSel(type,key,on){let k=type+'|'+key;if(on)state.selection.add(k);else state.selection.delete(k);draw()}
function selectVisible(on){for(const x of visibleItems()){let k=x.type+'|'+x.key;if(on)state.selection.add(k);else state.selection.delete(k)}draw()}
function visibleItems(){let q=state.query.trim().toLowerCase(),items=state.profile?.items||[];if(!q)return items;return items.filter(x=>[x.path,x.name,x.fingerprint,...(x.effective_tags||[]).map(t=>t.name)].join(' ').toLowerCase().includes(q))}
function tagChips(x){return(x.effective_tags||[]).map(t=>{let inherited=!t.direct,tt=inherited?'folder':x.type,key=inherited?t.from:x.key;return`<span class="tagchip ${inherited?'inherited':''}" title="${inherited?'Inherited from '+t.from:'Direct tag'}">${esc(t.display_name||t.name)}<button class="tagx" onclick='event.stopPropagation();removeOneTag(${JSON.stringify(tt)},${JSON.stringify(key)},${JSON.stringify(t.name)})'>×</button></span>`}).join('')}
async function tagMutation(operation,tag,targets=selectedTargets()){tag=String(tag||'').trim();if(!tag||!targets.length)return;let rev=state.profile.profile.revision;await api('/turn01/tags/bulk',{method:'POST',body:JSON.stringify({profile_revision:rev,operation,tag,targets})});state.selection.clear();await load()}
async function removeOneTag(type,key,tag){await tagMutation('remove',tag,[{type,key}])}
async function bulkTag(op){let el=$('#bulkTag'),tag=el?.value||'';await tagMutation(op,tag)}
async function addSource(){let path=$('#discoverPath').value.trim();if(!path)return;await api('/turn01/discover',{method:'POST',body:JSON.stringify({path})});$('#discoverPath').value='';await load()}
async function removeSource(id){await api('/turn01/discover/remove',{method:'POST',body:JSON.stringify({source_id:id})});await load()}
function profileRow(x){let k=x.type+'|'+x.key,checked=state.selection.has(k),date=x.modified_at||x.created_at||'';return`<div class="vrow"><input type="checkbox" ${checked?'checked':''} onchange='toggleSel(${JSON.stringify(x.type)},${JSON.stringify(x.key)},this.checked)'><div><div class="vname">${x.type==='folder'?'▸ ':''}${esc(x.name||x.path)}</div><div class="vpath">${esc(x.path)}</div>${x.fingerprint?`<div class="vpath mono">${esc(x.fingerprint)}</div>`:''}</div><div><b>${x.type==='folder'?Number(x.file_count||0).toLocaleString()+' files':bytes(x.size)}</b></div><div class="vdate">${esc(date)}</div><div class="vtags">${tagChips(x)}</div></div>`}
'''
insert=src.index('function dashboard(){');src=src[:insert]+helpers+'\n'+src[insert:]
src=repl(src,'dashboard',r'''function dashboard(){let p=state.profile||{profile:{revision:0},summary:{},items:[],tags:[]},items=visibleItems(),n=state.selection.size;return`<div class="ey">Dynamically versioned SSOT</div><h1>Profile <span class="rev">r${Number(p.profile?.revision||0)}</span></h1><div class="profileMeta"><div class="metric"><span class="mut">Files</span><b>${Number(p.summary?.files||0).toLocaleString()}</b></div><div class="metric"><span class="mut">Folders</span><b>${Number(p.summary?.folders||0).toLocaleString()}</b></div><div class="metric"><span class="mut">Content</span><b>${bytes(p.summary?.bytes||0)}</b></div><div class="metric"><span class="mut">Matching Omnisearch</span><b>${items.length.toLocaleString()}</b></div></div><div class="bulkbar"><b>${n.toLocaleString()} selected</b><button class="btn" onclick="selectVisible(true)">Select results</button><button class="btn" onclick="selectVisible(false)">Clear results</button><input id="bulkTag" list="tagPool" placeholder="Begin typing tag…"><datalist id="tagPool">${(p.tags||[]).map(t=>`<option value="${esc(t.display_name||t.normalized_name)}"></option>`).join('')}</datalist><button class="btn primary" ${n?'':'disabled'} onclick="bulkTag('add')">Add tag</button><button class="btn" ${n?'':'disabled'} onclick="bulkTag('remove')">Remove tag</button></div><section class="panel"><div class="panelHead"><h2>SSOT virtual volume</h2><span class="mut">Folders · files · sizes · dates · fingerprints · tags</span></div><div>${items.length?items.map(profileRow).join(''):'<div class="empty">No folders or files match Omnisearch.</div>'}</div></section>`}''')
src=repl(src,'database',r'''function database(){let d=state.discover||{sources:[]};return`<div class="ey">Admit physical storage to SSOT</div><h1>Discover</h1><section class="panel"><div class="panelHead"><h2>Sources</h2><span class="mut">${d.sources.length.toLocaleString()} source folders</span></div><div class="inside"><div class="discoverAdd"><input id="discoverPath" placeholder="Source folder path, e.g. /mnt/d/Photos"><button class="btn primary" onclick="addSource()">Add source</button></div></div>${d.sources.map(s=>`<div class="sourceRow"><div><b>${esc(s.normalized_path)}</b><div class="mut">${esc(s.preflight_status||'unknown')}${s.last_preflight_at?' · '+esc(s.last_preflight_at):''}</div></div><button class="btn" onclick='removeSource(${JSON.stringify(s.source_id)})'>Remove</button></div>`).join('')||'<div class="empty">No sources discovered.</div>'}</section><p class="mut">Adding a source admits it to the SSOT. Projects are not part of the operating model.</p>`}''')
src=repl(src,'activity',r'''function activity(){let n=state.selection.size,p=state.profile?.profile||{revision:0},targets=selectedTargets();return`<div class="ey">Governed SSOT mutation</div><h1>Action</h1><div class="actionHero"><b>${n?n.toLocaleString()+' selected item'+(n===1?'':'s'):'No items selected'}</b><div class="mut">Actions are bound to Profile r${Number(p.revision||0)}. A stale Profile is rejected rather than silently mutating newer SSOT truth.</div></div><section class="panel"><div class="panelHead"><h2>Bulk tags</h2><span class="mut">First governed bulk Action</span></div><div class="inside"><div class="discoverAdd"><input id="actionTag" list="actionTagPool" placeholder="Begin typing tag…"><datalist id="actionTagPool">${(state.profile?.tags||[]).map(t=>`<option value="${esc(t.display_name||t.normalized_name)}"></option>`).join('')}</datalist><button class="btn primary" ${n?'':'disabled'} onclick="tagMutation('add',$('#actionTag').value)">Add</button><button class="btn" ${n?'':'disabled'} onclick="tagMutation('remove',$('#actionTag').value)">Remove</button></div></div></section><section class="panel"><div class="panelHead"><h2>Selection</h2><span class="mut">Stable keys captured from Profile</span></div><div class="inside selectionList">${targets.length?targets.map(t=>`<div class="mono">${esc(t.type)} · ${esc(t.key)}</div>`).join(''):'<div class="empty">Select folders/files in Profile, then return here for bulk Action.</div>'}</div></section><section class="panel"><div class="panelHead"><h2>Safety-gated physical actions</h2></div><div class="inside mut">Protect, verify, reconcile, relocate, certify and retirement remain governed by fingerprint/protection evidence. R12 does not enable unsafe bulk deletion.</div></section>`}''')
src=repl(src,'draw',r'''function draw(){rememberDisclosure();let fn=state.tab==='dashboard'?dashboard:state.tab==='database'?database:state.tab==='activity'?activity:settings;$('#app').innerHTML=fn();document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('on',b.dataset.tab===state.tab));restoreDisclosure()}''')
for x in ['SOT-turn01-base-r12-discover-profile-action','>Discover</button>','>Profile</button>','>Action</button>','SSOT virtual volume','Begin typing tag','Add tag','Remove tag','stale Profile','rememberDisclosure','Projects are not part of the operating model']:
    if x not in src: raise SystemExit('R12 UI output contract missing '+x)
for x in ['>Dashboard</button>','>Database</button>','>Activity</button>']:
    if x in src: raise SystemExit('R12 owner-facing old nav remains '+x)
Path(sys.argv[2]).write_text(src)
print('R12 Discover/Profile/Action virtual-volume UI integrated')
