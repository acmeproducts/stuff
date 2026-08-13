from pathlib import Path
import re

APP=Path('session-manager-v3.html')
GOV=Path('session-manager-backlog.md')
s=APP.read_text(encoding='utf-8')

def bounds(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{)',text)
    if not m: raise SystemExit('function missing: '+name)
    i=m.start(); j=m.end(); depth=1; quote=None; esc=False
    while j<len(text) and depth:
        c=text[j]
        if quote:
            if esc: esc=False
            elif c=='\\': esc=True
            elif c==quote: quote=None
        else:
            if c in "'\"`": quote=c
            elif c=='{': depth+=1
            elif c=='}': depth-=1
        j+=1
    if depth: raise SystemExit('unbalanced '+name)
    return i,j

def fn(text,name):
    i,j=bounds(text,name); return text[i:j]

def replace_fn(name,new):
    global s
    i,j=bounds(s,name); s=s[:i]+new+s[j:]

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 match, found {n}')
    s=s.replace(old,new,1)

protected=['identity','deviceToken','saveDeviceToken','connectParams','rpc','rejectPending','connect','handleConnectError','schedule','reconnect','hostingDefaultGateway','sotSync','softDeleteSession','restoreSession','permanentDeleteSession']
frozen={n:fn(s,n) for n in protected}

if "const BUILD_VERSION='2.9.1';" not in s: raise SystemExit('v2.9.1 baseline missing')
one("const BUILD_VERSION='2.9.1';","const BUILD_VERSION='2.9.2';",'build version')
s=s.replace("document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.1');","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.2');")
s=s.replace('<span class="version">v2.7.0</span>','<span class="version">v2.9.2</span>',1)

# Context submenu is two-column/right-hand on desktop; real insertion zones are visible hit targets.
css="""
/* v2.9.2 deterministic tab reorder + right-hand customize submenu */
.tabContext{display:flex;width:auto;max-width:calc(100vw - 16px);overflow:visible}.tabContextMain{width:178px;flex:0 0 178px}.tabContextLeaf{width:260px;flex:0 0 260px;border-top:0;border-left:1px solid var(--ln);padding:10px}.tabContextLeaf:empty{display:none}.tabContext.customOpen{overflow:visible}.tabContext .customGrid{grid-template-columns:1fr}.tabContext .customActions{justify-content:flex-start}.tabContext .customPersist{font-size:9px;color:var(--mu);margin-top:8px}.tabDropZone{width:12px;min-width:12px;align-self:stretch;position:relative;flex:0 0 12px}.tabDropZone:before{content:'';position:absolute;left:4px;top:7px;bottom:7px;width:4px;border-radius:3px;background:transparent;transition:background .08s,box-shadow .08s}.tabDropZone.dragOver:before{background:var(--am);box-shadow:0 0 0 3px color-mix(in srgb,var(--am) 20%,transparent)}.tabDropZone.dragOver{background:color-mix(in srgb,var(--am) 7%,transparent)}
@media(max-width:700px){.tabContext{display:block;width:min(320px,calc(100vw - 16px));max-height:75vh;overflow:auto}.tabContextMain{width:auto}.tabContextLeaf{width:auto;border-left:0;border-top:1px solid var(--ln)}.tabDropZone{width:16px;min-width:16px;flex-basis:16px}.tabDropZone:before{left:6px}}
"""
one('</style>',css+'</style>','v2.9.2 CSS')

# Persist style without rebuilding the tab strip while a context submenu is open.
replace_fn('saveTabStyle',"""function saveTabStyle(k,v){if(!state.projectState.tabStyles)state.projectState.tabStyles={};let c={bg:String(v?.bg||''),fg:String(v?.fg||''),size:Math.max(0,Math.min(28,Number(v?.size||0)||0))};if(!c.bg&&!c.fg&&!c.size)delete state.projectState.tabStyles[k];else state.projectState.tabStyles[k]=c;saveProjectState();applyTabStyleNode(k)}""")
one("function tabStyleAttr(k){", "function applyTabStyleNode(k){let n=document.querySelector(`.projectTab[data-project-session=\"${CSS.escape(k)}\"]`),x=tabStyle(k);if(!n)return;n.style.background=/^#[0-9a-f]{6}$/i.test(x.bg)?x.bg:'';n.style.color=/^#[0-9a-f]{6}$/i.test(x.fg)?x.fg:'';n.style.fontSize=x.size?x.size+'px':''}\nfunction tabStyleAttr(k){", 'style node helper')

# Index-based reorder makes insertion-zone semantics exact.
replace_fn('reorderProjectTab',"""function reorderProjectTab(k,target,after){let p=activeProject();if(p.id===UNASSIGNED_ID||!p.sessions.includes(k)||!p.sessions.includes(target)||k===target)return;let a=p.sessions.filter(x=>x!==k),i=a.indexOf(target);a.splice(i+(after?1:0),0,k);p.sessions=a;saveProjectState();renderProjectTabs()}""")
one("function openTabContext(k,anchor){", "function reorderProjectTabAt(k,index){let p=activeProject();if(p.id===UNASSIGNED_ID||!p.sessions.includes(k))return;let a=p.sessions.filter(x=>x!==k),old=p.sessions.indexOf(k),idx=Math.max(0,Math.min(Number(index)||0,a.length));if(old<idx)idx=Math.max(0,idx-1);a.splice(idx,0,k);if(a.join('\\u0000')===p.sessions.join('\\u0000'))return;p.sessions=a;saveProjectState();renderProjectTabs()}\nfunction openTabContext(k,anchor){", 'index reorder helper')

# Replace context menu: submenu is right-hand; Customize has no Save and persists on blur/change.
replace_fn('openTabContext',r'''function openTabContext(k,anchor){let row=state.sessions.find(s=>s.key===k);if(!row)return;closeTabContext();let origin=state.projectState.activeProjectId,originSession=state.current?.key||'',rect=anchor?.getBoundingClientRect?.()||{left:12,bottom:60},menuW=innerWidth<=700?Math.min(320,innerWidth-16):438,left=Math.max(8,Math.min(rect.left,innerWidth-menuW-8)),top=Math.max(8,Math.min(rect.bottom+6,innerHeight-160)),r=$('tabContextRoot');r.innerHTML=`<div class="tabContext" id="tabContext" style="left:${left}px;top:${top}px"><div class="tabContextMain"><button class="tabContextItem" data-c="rename">Rename<span class="tabContextArrow">›</span></button><button class="tabContextItem" data-c="assign">Assign<span class="tabContextArrow">›</span></button><button class="tabContextItem" data-c="custom">Customize<span class="tabContextArrow">›</span></button><button class="tabContextItem" data-a="download">Download</button><button class="tabContextItem" data-a="share">Share</button></div><div id="tabContextLeaf" class="tabContextLeaf"></div></div>`;let leaf=$('tabContextLeaf'),menu=$('tabContext'),open=w=>{document.querySelectorAll('.tabContextItem').forEach(b=>b.classList.toggle('active',b.dataset.c===w));leaf.innerHTML='';menu.classList.toggle('customOpen',w==='custom');if(w==='rename'){leaf.innerHTML=`<div class="tabContextTitle">Rename session</div><input id="ctxRename" class="tabContextInput" value="${esc(name(row))}"><div class="tabContextHelp">Enter updates the OpenClaw session label.</div>`;let i=$('ctxRename');i.focus();i.select();i.onkeydown=async e=>{if(e.key==='Escape')closeTabContext();if(e.key==='Enter'){e.preventDefault();try{await contextRename(k,i.value);closeTabContext();restoreOrigin(origin,originSession);toast('Session renamed','ok')}catch(err){toast(err.message,'err')}}}}else if(w==='assign'){leaf.innerHTML=`<div class="tabContextTitle">Assign to project</div><input id="ctxAssign" class="tabContextInput" placeholder="Project omnisearch"><div class="tabContextHelp">Partial match · * wildcard · -term excludes. Enter creates a project if the typed name does not exist.</div><div id="ctxResults" class="omniResults"></div><div id="ctxCreate" class="omniCreate"></div>`;let i=$('ctxAssign'),out=$('ctxResults'),cr=$('ctxCreate'),choices=[],sel=0,draw=()=>{choices=[{id:UNASSIGNED_ID,name:'Unassigned'},...projects()].filter(p=>projectMatches(p.name,i.value)).slice(0,30);out.innerHTML=choices.map((p,n)=>`<button class="omniResult ${n===sel?'selected':''}" data-id="${esc(p.id)}"><b>${esc(p.name)}</b><small>${p.id===UNASSIGNED_ID?'Remove project assignment':`${p.sessions.length} session(s)`}</small></button>`).join('')||'<div class="tabContextHelp">No matches.</div>';let raw=i.value.trim();cr.textContent=raw&&!projectNameExists(raw)?`Enter creates “${raw}” and moves this tab.`:'';out.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>{let id=b.dataset.id;closeTabContext();contextMove(k,id,origin,originSession)})};i.oninput=()=>{sel=0;draw()};i.onkeydown=e=>{if(e.key==='Escape')closeTabContext();else if(e.key==='ArrowDown'){e.preventDefault();sel=Math.min(sel+1,Math.max(0,choices.length-1));draw()}else if(e.key==='ArrowUp'){e.preventDefault();sel=Math.max(0,sel-1);draw()}else if(e.key==='Enter'){e.preventDefault();let raw=i.value.trim(),p=projectNameExists(raw);if(!p&&raw)p=createProjectNamed(raw);else if(!p)p=choices[sel];if(p){closeTabContext();contextMove(k,p.id,origin,originSession)}}};draw();i.focus()}else{let st=tabStyle(k),bg=/^#[0-9a-f]{6}$/i.test(st.bg)?st.bg:'#ffffff',fg=/^#[0-9a-f]{6}$/i.test(st.fg)?st.fg:'#202124';leaf.innerHTML=`<div class="tabContextTitle">Customize tab</div><div class="customGrid"><label>Tab color<input id="ctxBg" type="color" value="${bg}"></label><label>Font color<input id="ctxFg" type="color" value="${fg}"></label><label>Font size<input id="ctxSize" class="tabContextInput" type="number" min="10" max="28" value="${st.size||16}"></label></div><div class="customActions"><button class="btn" id="ctxReset">Reset</button></div><div class="customPersist">Changes preview immediately and persist when the control loses focus.</div>`;let read=()=>({bg:$('ctxBg').value,fg:$('ctxFg').value,size:Number($('ctxSize').value)}),preview=()=>{let n=document.querySelector(`.projectTab[data-project-session="${CSS.escape(k)}"]`),v=read();if(!n)return;n.style.background=v.bg;n.style.color=v.fg;n.style.fontSize=Math.max(10,Math.min(28,v.size||16))+'px'},persist=()=>saveTabStyle(k,read());for(let id of ['ctxBg','ctxFg','ctxSize']){let c=$(id);c.oninput=preview;c.onchange=persist;c.onblur=persist} $('ctxReset').onclick=()=>{saveTabStyle(k,{});let n=document.querySelector(`.projectTab[data-project-session="${CSS.escape(k)}"]`);if(n){n.style.background='';n.style.color='';n.style.fontSize=''};closeTabContext();restoreOrigin(origin,originSession)}}};document.querySelectorAll('[data-c]').forEach(b=>b.onclick=e=>{e.stopPropagation();open(b.dataset.c)});document.querySelectorAll('[data-a]').forEach(b=>b.onclick=async e=>{e.stopPropagation();let act=b.dataset.a;closeTabContext();try{if(state.current?.key!==k)await select(k);if(act==='download')downloadTranscript();else await shareTranscript()}catch(err){toast(err.message,'err')}});window.__ctxOff=ev=>{if(!ev.target.closest||!ev.target.closest('#tabContext'))closeTabContext()};setTimeout(()=>document.addEventListener('pointerdown',window.__ctxOff,true),0);r.onclick=e=>{if(e.target===r)closeTabContext()}}''')

# Render explicit insertion zones between all tabs and after the final tab.
replace_fn('renderProjectTabs',r'''function renderProjectTabs(){let root=$('projectTabs');if(!root)return;if(state.settings.clientType!=='botschat'){root.innerHTML='';return}let p=activeProject(),ss=p.sessions.map(k=>state.sessions.find(s=>s.key===k)).filter(Boolean),bits=['<div class="tabDropZone" data-tab-drop="0" title="Drop tab here"></div>'];ss.forEach((x,i)=>{let v=sessionState(x.key,x),rec=recoveredMeta(x.key);bits.push(`<button class="projectTab ${state.current?.key===x.key?'active':''}" draggable="true" data-project-session="${esc(x.key)}"${tabStyleAttr(x.key)}>${v!=='ready'?`<span class="sessionState ${statusClass(v)}" title="${statusText(v)}"></span>`:''}<span class="tabLabel">${esc(name(x))}${rec?' · recovered':''}</span><span class="tabClose" data-project-close="${esc(x.key)}" title="Soft delete → Recycle Bin">×</span></button>`);bits.push(`<div class="tabDropZone" data-tab-drop="${i+1}" title="Drop tab here"></div>`)});root.innerHTML=bits.join('')+`<button class="projectTabAdd" id="projectTabAdd" title="Add or create session">+</button>`;let clearZones=()=>root.querySelectorAll('.tabDropZone.dragOver').forEach(z=>z.classList.remove('dragOver'));root.querySelectorAll('.tabDropZone').forEach(z=>{z.ondragover=e=>{let t=e.dataTransfer?.types;if(!t||![...t].includes('text/session-key'))return;e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';clearZones();z.classList.add('dragOver')};z.ondragleave=()=>z.classList.remove('dragOver');z.ondrop=e=>{e.preventDefault();e.stopPropagation();let k=e.dataTransfer.getData('text/session-key'),idx=Number(z.dataset.tabDrop);clearZones();if(k&&assignedProjectFor(k)?.id===p.id)reorderProjectTabAt(k,idx)}});root.querySelectorAll('[data-project-session]').forEach(b=>{b.onclick=e=>{if(e.target.closest('[data-project-close]'))return;let k=b.dataset.projectSession;setActiveViewSession(k);select(k)};b.oncontextmenu=e=>{e.preventDefault();e.stopPropagation();if(window.__scTouch)return;openTabContext(b.dataset.projectSession,b)};b.ondragstart=e=>{if(window.__scTouch){e.preventDefault();return}closeTabContext();b.classList.add('dragging');e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/session-key',b.dataset.projectSession)};b.ondragend=()=>{b.classList.remove('dragging');clearZones();root.querySelectorAll('.dragBefore,.dragAfter,.dragTarget').forEach(x=>x.classList.remove('dragBefore','dragAfter','dragTarget'))}});root.querySelectorAll('[data-project-close]').forEach(b=>b.onclick=e=>{e.stopPropagation();softDeleteSession(b.dataset.projectClose)});$('projectTabAdd').onclick=openProjectSessionPicker}''')

# Patch mobile gesture helper to recognize insertion zones.
old="function elementAt(x,y){let el=document.elementFromPoint(x,y);return{project:el?.closest?.('.projectRow[data-project]')||null,tab:el?.closest?.('.projectTab[data-project-session]')||null}}"
new="function elementAt(x,y){let el=document.elementFromPoint(x,y);return{project:el?.closest?.('.projectRow[data-project]')||null,tab:el?.closest?.('.projectTab[data-project-session]')||null,zone:el?.closest?.('.tabDropZone[data-tab-drop]')||null}}"
one(old,new,'mobile elementAt')
one("function highlightTarget(x,y,key){clearHover();let{project,tab}=elementAt(x,y);if(project){project.classList.add('dragOver');hoverNode=project;return}if(tab&&tab.dataset.projectSession!==key){tab.classList.add('dragTarget');hoverNode=tab}}", "function highlightTarget(x,y,key){clearHover();let{project,tab,zone}=elementAt(x,y);if(project){project.classList.add('dragOver');hoverNode=project;return}if(zone){zone.classList.add('dragOver');hoverNode=zone;return}if(tab&&tab.dataset.projectSession!==key){tab.classList.add('dragTarget');hoverNode=tab}}", 'mobile highlight')
one("if(project)fakeDrop(project,g.key,e);else if(tab&&tab.dataset.projectSession!==g.key)fakeDrop(tab,g.key,e)", "if(project)fakeDrop(project,g.key,e);else if(zone)fakeDrop(zone,g.key,e);else if(tab&&tab.dataset.projectSession!==g.key)fakeDrop(tab,g.key,e)", 'mobile drop')
one("let{project,tab}=elementAt(e.clientX,e.clientY);", "let{project,tab,zone}=elementAt(e.clientX,e.clientY);", 'mobile zone destructure')

# Governance amendment.
g=GOV.read_text(encoding='utf-8')
amend='''\n\n# v2.9.2 TAB INTERACTION CORRECTION — 2026-08-12\n\n- Tab reordering uses explicit insertion drop zones between every session tab and after the final tab; tab order persists through Project state and GitHub SOT.\n- Dropping a tab on a Project remains a Project move and is distinct from reordering within the active Project.\n- Customize is a right-hand context submenu anchored beneath the selected tab on desktop; narrow screens stack it vertically.\n- Tab appearance no longer uses a separate Save action. Controls preview immediately and persist on blur/change. Reset persists immediately.\n'''
if '# v2.9.2 TAB INTERACTION CORRECTION' not in g:g+=amend
GOV.write_text(g,encoding='utf-8')

for n,v in frozen.items():
    if fn(s,n)!=v: raise SystemExit('protected function changed: '+n)
for marker in ["const BUILD_VERSION='2.9.2'",'tabDropZone','function reorderProjectTabAt(','customPersist','persist when the control loses focus','data-tab-drop']:
    if marker not in s: raise SystemExit('missing marker '+marker)
if 'id="ctxSave"' in s: raise SystemExit('Customize Save button still present')
APP.write_text(s,encoding='utf-8',newline='')
print('v2.9.2 build complete')
