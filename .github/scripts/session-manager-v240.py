from pathlib import Path
import re, json, sys

APP=Path('session-manager-v3.html')
GOV=Path('session-manager-backlog.md')
s=APP.read_text(encoding='utf-8')
orig=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 match, found {n}')
    s=s.replace(old,new,1)

def insert_before(marker,text,label):
    global s
    n=s.count(marker)
    if n!=1:
        raise SystemExit(f'{label}: marker count {n}')
    s=s.replace(marker,text+marker,1)

def fn(text,name):
    m=re.search(rf'(?:(?:async\s+)?function\s+{re.escape(name)}\s*\([^)]*\)\s*\{{)',text)
    if not m: raise SystemExit('protected function missing: '+name)
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
    if depth: raise SystemExit('unbalanced protected function: '+name)
    return text[i:j]

protected=['identity','deviceToken','saveDeviceToken','connectParams','rpc','rejectPending','connect','handleConnectError','schedule','reconnect','hostingDefaultGateway']
frozen={n:fn(s,n) for n in protected}

# ---- release/version ----
if s.count('v2.3.5')<2: raise SystemExit('v2.3.5 markers missing')
s=s.replace('v2.3.5','v2.4.0')

# ---- persistent stores / settings ----
one("trash:'oc_session_manager_soft_deleted_v1'};","trash:'oc_session_manager_soft_deleted_v1',projects:'oc_session_manager_projects_v1',themes:'oc_session_manager_custom_themes_v1'};",'storage keys')
one("trashOpen:false,settings:loadSettings()};","trashOpen:false,projectState:null,settings:loadSettings()};",'project state')
one("return{gatewayUrl:s.gatewayUrl||hostingDefaultGateway(),debugEnabled:s.debugEnabled===true,debugText:s.debugText===true,appearance:normalizeAppearance(s.appearance||{})}","return{gatewayUrl:s.gatewayUrl||hostingDefaultGateway(),debugEnabled:s.debugEnabled===true,debugText:s.debugText===true,clientType:s.clientType==='botschat'?'botschat':'standard',appearance:normalizeAppearance(s.appearance||{})}",'client type setting')

# ---- complete built-in branded presets ----
preset_insert="""
'claude':{preset:'claude',accent:'#c86f52',bg:'#f7f4ee',panel:'#fffdfa',panel2:'#eee9e1',line:'#c8c0b5',text:'#2c2825',muted:'#625c56',input:'#ffffff',code:'#2b2927',codeText:'#ffffff',inlineCode:'#eee9e1',inlineCodeText:'#2c2825',pathBg:'#f3e6df',pathText:'#3a241d',link:'#8a4d38',userBg:'#f1ece5',userFont:'#2c2825',agentBg:'#fffaf4',agentFont:'#2c2825',chromeBg:'#f2ede5',chromeText:'#2c2825',chromeBtnBg:'#fffdfa',chromeBtnText:'#2c2825',chromeBtnHover:'#e4d3c8',systemBg:'#eee9e1',systemText:'#2c2825',userSize:17,agentSize:17,msgWidth:88,density:'comfortable',sidebarWidth:390,baseSize:16,metaSize:12,metaColor:'#625c56',lineHeight:1.65,fontFamily:'system'},
'chatgpt':{preset:'chatgpt',accent:'#10a37f',bg:'#ffffff',panel:'#f7f7f8',panel2:'#ececf1',line:'#d1d5db',text:'#202123',muted:'#565869',input:'#ffffff',code:'#202123',codeText:'#ffffff',inlineCode:'#ececf1',inlineCodeText:'#202123',pathBg:'#eef8f5',pathText:'#17483c',link:'#087f65',userBg:'#f7f7f8',userFont:'#202123',agentBg:'#ffffff',agentFont:'#202123',chromeBg:'#f7f7f8',chromeText:'#202123',chromeBtnBg:'#ffffff',chromeBtnText:'#202123',chromeBtnHover:'#e7f3ef',systemBg:'#ececf1',systemText:'#202123',userSize:17,agentSize:17,msgWidth:88,density:'normal',sidebarWidth:390,baseSize:16,metaSize:12,metaColor:'#565869',lineHeight:1.62,fontFamily:'system'},
'botschat':{preset:'botschat',accent:'#0877b9',bg:'#ffffff',panel:'#f7f7f8',panel2:'#ededee',line:'#d4d5d8',text:'#202124',muted:'#62656b',input:'#ffffff',code:'#16181b',codeText:'#ffffff',inlineCode:'#eef0f2',inlineCodeText:'#202124',pathBg:'#e7f3fb',pathText:'#123f5d',link:'#006db5',userBg:'#f7f3fb',userFont:'#202124',agentBg:'#eff9f4',agentFont:'#173a29',chromeBg:'#ffffff',chromeText:'#202124',chromeBtnBg:'#f4f5f6',chromeBtnText:'#202124',chromeBtnHover:'#dcecf7',systemBg:'#f1f2f3',systemText:'#202124',userSize:17,agentSize:17,msgWidth:92,density:'normal',sidebarWidth:330,baseSize:16,metaSize:12,metaColor:'#62656b',lineHeight:1.6,fontFamily:'system'},
"""
one("'large-print':{preset:'large-print'",preset_insert+"'large-print':{preset:'large-print'",'branded presets')

# ---- BotsChat project + tabs CSS ----
css="""
/* v2.4 BotsChat client model: local Projects -> OpenClaw session tabs */
.projectSectionHead{display:flex;align-items:center;gap:8px;padding:12px 14px 8px;color:var(--mu);font-size:12px;font-weight:800;letter-spacing:.04em}.projectSectionHead button{margin-left:auto;border:0;background:transparent;color:var(--mu);font-size:23px;line-height:1;padding:2px 7px;border-radius:6px}.projectSectionHead button:hover{background:var(--p2);color:var(--am)}.projectRow{display:flex;align-items:center;gap:8px;padding:11px 13px;border-left:3px solid transparent;cursor:pointer;min-width:0}.projectRow:hover,.projectRow.active{background:var(--p2);border-left-color:var(--am)}.projectHash{font-weight:900}.projectName{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}.projectCount{margin-left:auto;color:var(--mu);font-size:10px}.projectDelete{border:0;background:transparent;color:var(--mu);padding:2px 5px;border-radius:5px;opacity:.45}.projectRow:hover .projectDelete{opacity:1}.projectDelete:hover{background:color-mix(in srgb,var(--rd) 12%,var(--p2));color:var(--rd)}.projectHelp{padding:10px 14px;color:var(--mu);font-size:10px;border-top:1px solid var(--ln)}
#projectTabs{display:none;height:48px;flex:0 0 48px;align-items:stretch;gap:2px;padding:0 10px;border-bottom:1px solid var(--ln);background:var(--p);overflow-x:auto;overflow-y:hidden}.projectTab{display:flex;align-items:center;gap:7px;min-width:122px;max-width:270px;padding:0 12px;border:0;border-bottom:3px solid transparent;background:transparent;color:var(--mu);font-weight:750;white-space:nowrap}.projectTab:hover{background:var(--p2)}.projectTab.active{color:var(--tx);background:var(--p2);border-bottom-color:var(--am)}.projectTab .tabLabel{overflow:hidden;text-overflow:ellipsis;min-width:0}.projectTab .tabClose{margin-left:auto;border:0;background:transparent;color:var(--mu);font-size:16px;padding:3px 4px;border-radius:5px}.projectTab .tabClose:hover{background:color-mix(in srgb,var(--rd) 12%,var(--p2));color:var(--rd)}.projectTabAdd{min-width:48px;border:0;background:transparent;color:var(--mu);font-size:25px}.projectTabAdd:hover{color:var(--am);background:var(--p2)}
.sessionPickerList{display:grid;gap:6px;max-height:50vh;overflow:auto}.sessionPick{display:flex;align-items:center;gap:8px;text-align:left;width:100%;border:1px solid var(--ln);background:var(--p);color:var(--tx);border-radius:9px;padding:10px 12px}.sessionPick:hover{background:var(--p2);border-color:var(--am)}.pickText{min-width:0;flex:1}.pickLabel{font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pickKey{font:9px ui-monospace,Consolas,monospace;color:var(--mu);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.clientTypeCards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.clientTypeCard{display:block;border:2px solid var(--ln);border-radius:12px;background:var(--p);padding:15px;cursor:pointer}.clientTypeCard:has(input:checked){border-color:var(--am);background:var(--p2);box-shadow:0 0 0 2px color-mix(in srgb,var(--am) 20%,transparent)}.clientTypeCard input{margin-right:8px}.clientTypeCard b{font-size:14px}.clientTypeCard small{display:block;color:var(--mu);margin:7px 0 0 24px;line-height:1.45}.themeManager{display:grid;grid-template-columns:minmax(180px,1fr) auto auto;gap:8px}.themeButtons{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}.themeButtons .btn{font-size:12px}
#app.client-botschat #searchWrap{display:none}#app.client-botschat #projectTabs{display:flex}#app.client-botschat #sidebar{min-width:250px}#app.client-botschat .sidebarTop{min-height:64px;height:64px}#app.client-botschat .mainbar{height:66px;min-height:66px}
@media(max-width:760px){.clientTypeCards{grid-template-columns:1fr}.themeManager{grid-template-columns:1fr}.projectTab{min-width:108px}#projectTabs{padding-left:6px}}
"""
one('</style>',css+'</style>','v2.4 css')

# ---- DOM: brand and project tab strip ----
one('<span class="brand">Session Manager <span class="version">v2.4.0</span></span>','<span class="brand"><span id="brandName">Session Manager</span> <span class="version">v2.4.0</span></span>','brand id')
one('  <div id="error"></div>','  <div id="projectTabs"></div>\n  <div id="error"></div>','project tabs dom')

# ---- project + custom-theme data model ----
helpers=r'''
function projectScope(){return state.settings.gatewayUrl||DEF}
function normalizeProjectState(v){let x=v&&typeof v==='object'?v:{},projects=Array.isArray(x.projects)?x.projects:[];projects=projects.map(p=>({id:String(p?.id||uid()),name:String(p?.name||'Project').trim()||'Project',sessions:[...new Set((Array.isArray(p?.sessions)?p.sessions:[]).map(String).filter(Boolean))],activeSession:String(p?.activeSession||'')}));if(!projects.length)projects=[{id:'general',name:'General',sessions:[],activeSession:''}];let active=projects.some(p=>p.id===x.activeProjectId)?x.activeProjectId:projects[0].id;return{schema:1,activeProjectId:active,projects}}
function loadProjectState(){let all={};try{all=JSON.parse(localStorage.getItem(K.projects)||'{}')||{}}catch{}return normalizeProjectState(all[projectScope()])}
function saveProjectState(){let all={};try{all=JSON.parse(localStorage.getItem(K.projects)||'{}')||{}}catch{}all[projectScope()]=normalizeProjectState(state.projectState);localStorage.setItem(K.projects,JSON.stringify(all))}
function projects(){if(!state.projectState)state.projectState=loadProjectState();return state.projectState.projects}
function activeProject(){let ps=projects();return ps.find(p=>p.id===state.projectState.activeProjectId)||ps[0]}
function reconcileProjects(){if(!state.projectState)state.projectState=loadProjectState();let known=new Set(state.sessions.map(s=>s.key));for(let p of state.projectState.projects){p.sessions=p.sessions.filter(k=>known.has(k));if(p.activeSession&&!known.has(p.activeSession))p.activeSession=''}let assigned=new Set(state.projectState.projects.flatMap(p=>p.sessions));if(!assigned.size&&state.sessions.length){let p=activeProject();p.sessions.push(state.sessions[0].key);p.activeSession=state.sessions[0].key}saveProjectState()}
function addProject(){let name=prompt('Project name','New Project');if(name===null)return;name=name.trim();if(!name){toast('Project name cannot be empty','err');return}let p={id:'p-'+uid(),name,sessions:[],activeSession:''};projects().push(p);state.projectState.activeProjectId=p.id;saveProjectState();renderSessions();renderProjectTabs();header();toast('Project created','ok')}
function renameProject(id){let p=projects().find(x=>x.id===id);if(!p)return;let n=prompt('Rename project',p.name);if(n===null)return;n=n.trim();if(!n)return;p.name=n;saveProjectState();renderSessions();header()}
function deleteProject(id){let ps=projects(),p=ps.find(x=>x.id===id);if(!p)return;if(ps.length===1){toast('Keep at least one project','err');return}if(!confirm(`Remove project “${p.name}”?\n\nThis only removes the local project grouping. OpenClaw sessions are not deleted.`))return;state.projectState.projects=ps.filter(x=>x.id!==id);if(state.projectState.activeProjectId===id)state.projectState.activeProjectId=state.projectState.projects[0].id;saveProjectState();let a=activeProject();let k=a.activeSession||a.sessions[0]||'';k?select(k):clearSelection();renderSessions();renderProjectTabs();header()}
function switchProject(id){if(!projects().some(p=>p.id===id))return;state.projectState.activeProjectId=id;saveProjectState();let p=activeProject(),k=(p.activeSession&&p.sessions.includes(p.activeSession)?p.activeSession:p.sessions[0])||'';renderSessions();renderProjectTabs();header();k?select(k):clearSelection()}
function addSessionToProject(k,selectIt=true){let p=activeProject();k=String(k||'');if(!k)return;if(!p.sessions.includes(k))p.sessions.push(k);p.activeSession=k;saveProjectState();renderProjectTabs();renderSessions();if(selectIt)select(k)}
function removeSessionFromProject(k){let p=activeProject();p.sessions=p.sessions.filter(x=>x!==k);if(p.activeSession===k)p.activeSession=p.sessions[0]||'';saveProjectState();let next=p.activeSession;renderProjectTabs();renderSessions();if(state.current?.key===k){next?select(next):clearSelection()}}
function renderProjectSidebar(){let ps=projects(),ap=activeProject(),sessionCount=ap.sessions.filter(k=>state.sessions.some(s=>s.key===k)).length;$('stats').textContent=`${ps.length} project${ps.length===1?'':'s'} · ${sessionCount} session${sessionCount===1?'':'s'} in current project`;$('sessionList').innerHTML=`<div class="projectSectionHead"><span>PROJECTS</span><button id="projectAdd" title="Add project">+</button></div>${ps.map(p=>`<div class="projectRow ${p.id===ap.id?'active':''}" data-project="${esc(p.id)}" title="Double-click project name to rename"><span class="projectHash">#</span><span class="projectName">${esc(p.name)}</span><span class="projectCount">${p.sessions.length}</span>${ps.length>1?`<button class="projectDelete" data-project-delete="${esc(p.id)}" title="Remove local project">×</button>`:''}</div>`).join('')}<div class="projectHelp">Projects are local organization. Each project owns a tab set of real OpenClaw sessions.</div>`;$('projectAdd').onclick=addProject;document.querySelectorAll('[data-project]').forEach(n=>{n.onclick=e=>{if(e.target.closest('[data-project-delete]'))return;switchProject(n.dataset.project)};n.ondblclick=e=>{if(e.target.closest('[data-project-delete]'))return;renameProject(n.dataset.project)}});document.querySelectorAll('[data-project-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();deleteProject(b.dataset.projectDelete)})}
function renderProjectTabs(){let root=$('projectTabs');if(!root)return;if(state.settings.clientType!=='botschat'){root.innerHTML='';return}let p=activeProject(),ss=p.sessions.map(k=>state.sessions.find(s=>s.key===k)).filter(Boolean);root.innerHTML=ss.map(x=>{let v=sessionState(x.key,x);return`<button class="projectTab ${state.current?.key===x.key?'active':''}" data-project-session="${esc(x.key)}"><span class="sessionState ${statusClass(v)}" title="${statusText(v)}"></span><span class="tabLabel">${esc(name(x))}</span><span class="tabClose" data-project-close="${esc(x.key)}" title="Remove from project">×</span></button>`}).join('')+`<button class="projectTabAdd" id="projectTabAdd" title="Add or create session">+</button>`;root.querySelectorAll('[data-project-session]').forEach(b=>b.onclick=e=>{if(e.target.closest('[data-project-close]'))return;let k=b.dataset.projectSession,p=activeProject();p.activeSession=k;saveProjectState();select(k)});root.querySelectorAll('[data-project-close]').forEach(b=>b.onclick=e=>{e.stopPropagation();removeSessionFromProject(b.dataset.projectClose)});$('projectTabAdd').onclick=openProjectSessionPicker}
function openProjectSessionPicker(){let p=activeProject(),available=state.sessions.filter(s=>!p.sessions.includes(s.key));$('modal').innerHTML=`<div class="modalbg"><div class="modal"><div class="mhead"><b>Add session to #${esc(p.name)}</b><span class="grow"></span><button class="btn" id="pickerClose">×</button></div><div class="mbody"><button class="btn primary" id="pickerNew" style="width:100%;margin-bottom:12px">+ Create new OpenClaw session</button><input class="input" id="pickerSearch" placeholder="Find an existing session" style="margin-bottom:10px"><div class="sessionPickerList" id="pickerList"></div></div></div></div>`;let draw=()=>{let q=$('pickerSearch').value.trim().toLowerCase(),a=available.filter(s=>!q||[name(s),s.key,s.preview].some(v=>String(v||'').toLowerCase().includes(q)));$('pickerList').innerHTML=a.length?a.map(s=>`<button class="sessionPick" data-pick="${esc(s.key)}"><span class="sessionState ${statusClass(sessionState(s.key,s))}"></span><span class="pickText"><div class="pickLabel">${esc(name(s))}</div><div class="pickKey">${esc(s.key)}</div></span></button>`).join(''):'<div class="empty">No additional sessions match.</div>';$('pickerList').querySelectorAll('[data-pick]').forEach(b=>b.onclick=()=>{let k=b.dataset.pick;$('modal').innerHTML='';addSessionToProject(k,true)})};$('pickerClose').onclick=()=>$('modal').innerHTML='';$('pickerNew').onclick=()=>{$('modal').innerHTML='';newChat()};$('pickerSearch').oninput=draw;draw()}
function applyClientType(){let bot=state.settings.clientType==='botschat';$('app').classList.toggle('client-botschat',bot);$('brandName').textContent=bot?'BotsChat':'Session Manager';$('newChat').textContent=bot?'+ Session':'+ New';if(bot){if(!state.projectState)state.projectState=loadProjectState();reconcileProjects()}renderSessions();renderProjectTabs();header()}

function themeLibrary(){let x={schema:'session-manager-theme-library',version:1,themes:[]};try{let r=JSON.parse(localStorage.getItem(K.themes)||'null');if(r&&r.schema===x.schema&&r.version===1&&Array.isArray(r.themes))x=r}catch{}return x}
function saveThemeLibrary(x){localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:Array.isArray(x?.themes)?x.themes:[]}))}
function uniqueThemeName(base,themes,skip=''){base=String(base||'Custom Theme').trim()||'Custom Theme';let names=new Set(themes.filter(t=>t.id!==skip).map(t=>String(t.name).toLowerCase())),n=base,i=2;while(names.has(n.toLowerCase()))n=`${base} (${i++})`;return n}
function downloadJson(obj,name){let blob=new Blob([JSON.stringify(obj,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importThemeLibraryObject(obj){if(!obj||obj.schema!=='session-manager-theme-library'||Number(obj.version)!==1||!Array.isArray(obj.themes))throw Error('Not a Session Manager theme-library v1 file');let lib=themeLibrary(),added=0;for(let t of obj.themes){if(!t||typeof t!=='object'||!t.appearance)continue;let name=uniqueThemeName(t.name||'Imported Theme',lib.themes),appearance=normalizeAppearance(t.appearance);lib.themes.push({id:'theme-'+uid(),name,appearance,createdAt:Date.now(),updatedAt:Date.now()});added++}saveThemeLibrary(lib);return added}
'''
one('function saveSettings(){localStorage.setItem(K.settings,JSON.stringify(state.settings))}', 'function saveSettings(){localStorage.setItem(K.settings,JSON.stringify(state.settings))}'+helpers, 'helper insertion')

# ---- BotsChat renderer branches ----
one("function renderSessions(){let q=", "function renderSessions(){if(state.settings.clientType==='botschat'){renderProjectSidebar();renderProjectTabs();return}let q=", 'project sidebar renderer')
one("if(!key)throw Error('sessions.create returned no session key');await loadSessions();", "if(!key)throw Error('sessions.create returned no session key');await loadSessions();if(state.settings.clientType==='botschat')addSessionToProject(key,false);", 'new chat project attach')
one("state.streams.clear();renderSessions();header();", "state.streams.clear();if(state.settings.clientType==='botschat'){let p=activeProject();if(p.sessions.includes(k)){p.activeSession=k;saveProjectState()}}renderSessions();renderProjectTabs();header();", 'select active tab')
one("function header(){let s=state.current;if(!s){", "function header(){let s=state.current;if(state.settings.clientType==='botschat'){let p=activeProject(),n=p.sessions.filter(k=>state.sessions.some(x=>x.key===k)).length;$('chatTitle').textContent='# '+p.name;$('chatInfo').textContent=`${n} session${n===1?'':'s'} · OpenClaw Gateway`;if(s){$('downloadSession').classList.remove('hidden');$('shareSession').classList.remove('hidden')}else{$('downloadSession').classList.add('hidden');$('shareSession').classList.add('hidden')}updateWorkPill();return}if(!s){", 'project header')
one("state.sessions=a.map(norm).filter(x=>x.key);for(let s of state.sessions)", "state.sessions=a.map(norm).filter(x=>x.key);if(state.settings.clientType==='botschat'){if(!state.projectState)state.projectState=loadProjectState();reconcileProjects()}for(let s of state.sessions)", 'project reconciliation')

# ---- Settings: Client tab + custom themes + branded preset cards ----
one("presetNames={'hc-dark':['High Contrast Dark','Maximum contrast, larger type']", "presetNames={'claude':['Claude','Warm cream, charcoal text, terracotta accent'],'chatgpt':['ChatGPT','Neutral white/gray surfaces with green accent'],'botschat':['BotsChat','Collaborative light shell with blue/green accents'],'hc-dark':['High Contrast Dark','Maximum contrast, larger type']", 'preset names')
one('<button class="configTab active" data-cfg="connection">Connection</button><button class="configTab" data-cfg="appearance">Appearance</button>', '<button class="configTab active" data-cfg="connection">Connection</button><button class="configTab" data-cfg="client">Client</button><button class="configTab" data-cfg="appearance">Appearance</button>', 'client tab')
client_pane="""<section class="cfgPane" data-pane="client"><div class="appearanceSection"><h3>Client type</h3><div class="sectionHelp">Client type changes the working model. Appearance remains independent.</div><div class="clientTypeCards"><label class="clientTypeCard"><input type="radio" name="clientType" value="standard" ${state.settings.clientType!=='botschat'?'checked':''}><b>Standard Session Manager</b><small>Existing session-list client. One selected session in the conversation surface.</small></label><label class="clientTypeCard"><input type="radio" name="clientType" value="botschat" ${state.settings.clientType==='botschat'?'checked':''}><b>BotsChat — Projects + session tabs</b><small>Projects on the left. Each project owns multiple independent OpenClaw session tabs on the right.</small></label></div><div class="notice" style="margin-top:14px">Projects are local client organization. OpenClaw session keys, transcripts, labels and lifecycle remain unchanged.</div></div></section>"""
one('</section><section class="cfgPane" data-pane="appearance">', '</section>'+client_pane+'<section class="cfgPane" data-pane="appearance">', 'client pane')
custom_block="""<div class="appearanceSection"><h3>Custom themes</h3><div class="sectionHelp">Save the complete current Appearance setup. Custom themes survive reloads and can be exported/imported as portable JSON.</div><div class="themeManager"><select class="input" id="customThemeSelect"></select><input class="input" id="customThemeName" placeholder="Theme name"><button class="btn" id="themeSave">Save current</button></div><div class="themeButtons"><button class="btn" id="themeApply">Apply</button><button class="btn" id="themeRename">Rename</button><button class="btn" id="themeDuplicate">Duplicate</button><button class="btn" id="themeDelete">Delete</button><button class="btn" id="themeExport">Export selected</button><button class="btn" id="themeExportAll">Export library</button><button class="btn" id="themeImport">Import JSON</button><input id="themeImportFile" type="file" accept="application/json,.json" hidden></div></div>"""
one('<div class="appearanceSection"><h3>Accessible presets</h3>', custom_block+'<div class="appearanceSection"><h3>Built-in presets</h3>', 'custom theme UI')

# Save client type in existing commit path without changing reconnect contract.
one("state.settings.gatewayUrl=u;state.settings.debugEnabled=", "state.settings.gatewayUrl=u;state.settings.clientType=document.querySelector('input[name=clientType]:checked')?.value==='botschat'?'botschat':'standard';state.settings.debugEnabled=", 'save client type')
one("state.settings.appearance=read();applyAppearance();saveSettings()", "state.settings.appearance=read();applyAppearance();saveSettings();applyClientType()", 'apply client type')

# Theme-manager event block, inserted after populate/read/live exist.
theme_events=r'''
let refreshThemeSelect=(preferred='')=>{let lib=themeLibrary(),sel=$('customThemeSelect');if(!sel)return;sel.innerHTML=lib.themes.length?lib.themes.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join(''):'<option value="">No custom themes saved</option>';if(preferred&&lib.themes.some(t=>t.id===preferred))sel.value=preferred;let t=lib.themes.find(x=>x.id===sel.value);$('customThemeName').value=t?.name||''};
refreshThemeSelect();$('customThemeSelect').onchange=()=>{let t=themeLibrary().themes.find(x=>x.id===$('customThemeSelect').value);$('customThemeName').value=t?.name||''};
$('themeSave').onclick=()=>{let lib=themeLibrary(),name=$('customThemeName').value.trim()||'Custom Theme',sel=$('customThemeSelect').value,t=lib.themes.find(x=>x.id===sel);if(t&&t.name.toLowerCase()===name.toLowerCase()){t.appearance={...read(),preset:'custom'};t.updatedAt=Date.now();saveThemeLibrary(lib);refreshThemeSelect(t.id);toast('Custom theme updated','ok');return}name=uniqueThemeName(name,lib.themes);let id='theme-'+uid();lib.themes.push({id,name,appearance:{...read(),preset:'custom'},createdAt:Date.now(),updatedAt:Date.now()});saveThemeLibrary(lib);refreshThemeSelect(id);toast('Custom theme saved','ok')};
$('themeApply').onclick=()=>{let t=themeLibrary().themes.find(x=>x.id===$('customThemeSelect').value);if(!t){toast('Select a custom theme','err');return}populate(t.appearance);$('apreset').value='custom';live();$('customThemeName').value=t.name};
$('themeRename').onclick=()=>{let lib=themeLibrary(),t=lib.themes.find(x=>x.id===$('customThemeSelect').value);if(!t)return;let n=prompt('Rename custom theme',t.name);if(n===null)return;n=uniqueThemeName(n,lib.themes,t.id);t.name=n;t.updatedAt=Date.now();saveThemeLibrary(lib);refreshThemeSelect(t.id)};
$('themeDuplicate').onclick=()=>{let lib=themeLibrary(),t=lib.themes.find(x=>x.id===$('customThemeSelect').value);if(!t)return;let id='theme-'+uid(),name=uniqueThemeName(t.name+' Copy',lib.themes);lib.themes.push({id,name,appearance:JSON.parse(JSON.stringify(t.appearance)),createdAt:Date.now(),updatedAt:Date.now()});saveThemeLibrary(lib);refreshThemeSelect(id)};
$('themeDelete').onclick=()=>{let lib=themeLibrary(),id=$('customThemeSelect').value,t=lib.themes.find(x=>x.id===id);if(!t)return;if(!confirm(`Delete custom theme “${t.name}”?`))return;lib.themes=lib.themes.filter(x=>x.id!==id);saveThemeLibrary(lib);refreshThemeSelect();toast('Custom theme deleted','ok')};
$('themeExport').onclick=()=>{let t=themeLibrary().themes.find(x=>x.id===$('customThemeSelect').value);if(!t){toast('Select a custom theme','err');return}downloadJson({schema:'session-manager-theme-library',version:1,exportedAt:new Date().toISOString(),themes:[t]},safeFileName(t.name)+'.session-theme.json')};
$('themeExportAll').onclick=()=>{let lib=themeLibrary();downloadJson({...lib,exportedAt:new Date().toISOString()},'session-manager-themes.json')};
$('themeImport').onclick=()=>$('themeImportFile').click();$('themeImportFile').onchange=async e=>{let f=e.target.files?.[0];e.target.value='';if(!f)return;try{let obj=JSON.parse(await f.text()),n=importThemeLibraryObject(obj);refreshThemeSelect();toast(`${n} theme${n===1?'':'s'} imported`,'ok')}catch(err){toast('Theme import failed: '+err.message,'err')}};
'''
one(";$('sc').onclick=", ";"+theme_events+"$('sc').onclick=", 'theme events')

# ---- init/apply client ----
one("async function init(){applyAppearance();setSidebar(true);bind();", "async function init(){applyAppearance();state.projectState=loadProjectState();setSidebar(true);bind();applyClientType();", 'client init')

# ---- preserve protected auth/connect ----
for n,v in frozen.items():
    if fn(s,n)!=v:
        raise SystemExit('protected function changed: '+n)

required=["const BUILD_VERSION='2.4.0'","const APP_VERSION='2.3.0'","data-pane=\"client\"","function renderProjectTabs()","function renderProjectSidebar()","function themeLibrary()","themeExportAll","Claude","ChatGPT","BotsChat","oc_session_manager_projects_v1","oc_session_manager_custom_themes_v1"]
for x in required:
    if x not in s: raise SystemExit('missing required marker: '+x)

APP.write_text(s,encoding='utf-8',newline='')

# ---- governance: concise current amendment without rewriting history ----
g=GOV.read_text(encoding='utf-8')
if 'SESSION-MANAGER-GOVERNANCE v1.8.0' not in g:
    g=g.replace('SESSION-MANAGER-GOVERNANCE v1.7.0','SESSION-MANAGER-GOVERNANCE v1.8.0',1).replace('**Governance version:** 1.7.0','**Governance version:** 1.8.0',1)
amend='''\n\n# 10. v2.4.0 WORKSPACE / THEME AMENDMENT — 2026-08-11\n\nOwner ruling supersedes the earlier one-thread simplification. **BotsChat is a client type, not merely a color preset.** The locked hierarchy is:\n\n`Client → Projects → OpenClaw session tabs`\n\n- Left pane contains locally managed **Projects** with `+` creation.\n- Each Project owns an ordered set of real OpenClaw session references.\n- Selecting a Project changes the right-side session tab strip.\n- The tab-strip `+` can add an existing OpenClaw session or create a new one.\n- Closing a tab removes only that Project membership; deleting an OpenClaw session remains a separate governed lifecycle action.\n- Projects never rewrite session keys, transcripts, labels, or OpenClaw storage.\n- Background sessions remain independent and may continue working while another Project/session is viewed.\n- `Standard Session Manager` remains available as a separate Client Type.\n- Appearance and Client Type are independent. Claude, ChatGPT and BotsChat are built-in Appearance presets.\n\n## Custom theme library\n\n- Save the **complete current Appearance state** as a named custom theme.\n- Apply, rename, duplicate and delete custom themes.\n- Export one custom theme or the complete library as JSON.\n- Import validates `session-manager-theme-library` schema/version 1 and normalizes appearance data before storage.\n- Duplicate imported names receive a non-destructive suffix; import never silently overwrites an existing theme.\n- Theme storage is browser-local data and remains independent of `session-manager-v3.html`.\n\n## Graveyard additions\n\n**G-022 — BotsChat as only a palette.** Buried. The reference includes navigation, Projects, tabbed sessions and workspace behavior.\n\n**G-023 — One fixed General thread.** Buried. Owner clarified that multiple Projects on the left are critical and each Project must own multiple session tabs.\n\n**G-024 — Custom themes as hard-coded source edits.** Buried. Custom themes are validated portable data with save/export/import.\n'''
if '# 10. v2.4.0 WORKSPACE / THEME AMENDMENT' not in g:
    g+=amend
GOV.write_text(g,encoding='utf-8')
print('v2.4.0 source + governance build complete')
