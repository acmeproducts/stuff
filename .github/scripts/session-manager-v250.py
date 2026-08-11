from pathlib import Path
import re

APP=Path('session-manager-v3.html')
GOV=Path('session-manager-backlog.md')
s=APP.read_text(encoding='utf-8')

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f'{label}: expected 1 match, found {n}')
    s=s.replace(old,new,1)

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

# ---- version ----
if "const BUILD_VERSION='2.4.0';" not in s: raise SystemExit('v2.4.0 baseline missing')
s=s.replace('v2.4.0','v2.5.0')
one("const BUILD_VERSION='2.4.0';","const BUILD_VERSION='2.5.0';",'build version')

# ---- persistent keys/state/settings ----
one("themes:'oc_session_manager_custom_themes_v1'};","themes:'oc_session_manager_custom_themes_v1',sotPat:'oc_session_manager_github_pat_v1',sotOutbox:'oc_session_manager_sot_outbox_v1'};",'SOT storage keys')
one("trashOpen:false,projectState:null,settings:loadSettings()};","trashOpen:false,projectState:null,sotApplying:false,sotSyncing:false,sotTimer:null,sotStatus:'Not configured',sotLastSync:0,settings:loadSettings()};",'SOT runtime state')
one("clientType:s.clientType==='botschat'?'botschat':'standard',appearance:normalizeAppearance(s.appearance||{})}","clientType:s.clientType==='botschat'?'botschat':'standard',sotEnabled:s.sotEnabled===true,sotAuto:s.sotAuto!==false,sotOwner:String(s.sotOwner||'acmeproducts'),sotRepo:String(s.sotRepo||'stuff'),sotBranch:String(s.sotBranch||'main'),sotPath:String(s.sotPath||'session-manager-sot.json'),appearance:normalizeAppearance(s.appearance||{})}",'SOT settings defaults')

# ---- no BotsChat emblem/hash ----
s=s.replace('<span class="projectHash">#</span>','')
s=s.replace('Add session to #${esc(p.name)}','Add session to ${esc(p.name)}')
s=s.replace("$('chatTitle').textContent='# '+p.name;","$('chatTitle').textContent=p.name;")

# ---- SOT CSS ----
css="""
/* v2.5 GitHub append-only SOT */
.sotGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.sotActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.sotStatus{margin-top:10px;padding:9px 10px;border:1px solid var(--ln);border-radius:8px;background:var(--p2);font-size:11px;white-space:pre-wrap;word-break:break-word}.sotStatus.ok{border-color:color-mix(in srgb,var(--gr) 55%,var(--ln))}.sotStatus.err{border-color:color-mix(in srgb,var(--rd) 60%,var(--ln))}.sotExplain{font-size:11px;color:var(--mu);line-height:1.5;margin-top:8px}.sotExplain code{color:var(--tx)}
@media(max-width:760px){.sotGrid{grid-template-columns:1fr}}
"""
one('</style>',css+'</style>','SOT CSS')

# ---- append-only SOT engine ----
sot=r'''
function sotPat(){return String(localStorage.getItem(K.sotPat)||'').trim()}
function setSotPat(v){v=String(v||'').trim();v?localStorage.setItem(K.sotPat,v):localStorage.removeItem(K.sotPat)}
function sotConfig(){return{owner:String(state.settings.sotOwner||'acmeproducts').trim(),repo:String(state.settings.sotRepo||'stuff').trim(),branch:String(state.settings.sotBranch||'main').trim(),path:String(state.settings.sotPath||'session-manager-sot.json').trim()}}
function sotOutbox(){try{let a=JSON.parse(localStorage.getItem(K.sotOutbox)||'[]');return Array.isArray(a)?a.filter(e=>e&&e.id&&e.type):[]}catch{return[]}}
function saveSotOutbox(a){localStorage.setItem(K.sotOutbox,JSON.stringify(Array.isArray(a)?a:[]))}
function sotEvent(type,payload){return{id:uid(),deviceId:state.identity?.deviceId||'browser',ts:Date.now(),type,payload}}
function sotEmit(type,payload){if(state.sotApplying)return;let a=sotOutbox();a.push(sotEvent(type,payload));saveSotOutbox(a);if(state.settings.sotEnabled&&state.settings.sotAuto)scheduleSotSync()}
function portableSettings(){return{clientType:state.settings.clientType==='botschat'?'botschat':'standard',appearance:normalizeAppearance(state.settings.appearance||{})}}
function projectSnapshot(){return{scope:projectScope(),state:normalizeProjectState(state.projectState||loadProjectState())}}
function themeSnapshot(){return{schema:'session-manager-theme-library',version:1,themes:themeLibrary().themes}}
function seedSotOutbox(){if(sotOutbox().length)return;let a=[sotEvent('settings.snapshot',portableSettings()),sotEvent('projects.snapshot',projectSnapshot()),sotEvent('themes.snapshot',themeSnapshot())];saveSotOutbox(a)}
function ghB64Encode(str){let bytes=new TextEncoder().encode(String(str)),bin='';for(let i=0;i<bytes.length;i+=32768)bin+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(bin)}
function ghB64Decode(b64){let bin=atob(String(b64||'').replace(/\s/g,'')),bytes=Uint8Array.from(bin,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)}
function ghPath(p){return String(p||'').split('/').filter(Boolean).map(encodeURIComponent).join('/')}
async function githubApi(url,options={},pat=sotPat()){if(!pat)throw Error('GitHub PAT is required');let headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+pat,...(options.headers||{})},r=await fetch(url,{...options,headers});if(r.status===204)return null;let data=null;try{data=await r.json()}catch{}if(!r.ok){let e=Error(data?.message||`GitHub API error (${r.status})`);e.status=r.status;e.data=data;throw e}return data}
async function validateGithubPat(pat=sotPat()){let me=await githubApi('https://api.github.com/user',{},pat);return me?.login||'valid token'}
function emptySot(){return{schema:'session-manager-sot',version:1,events:[]}}
function normalizeSot(doc){if(!doc)return emptySot();if(doc.schema!=='session-manager-sot'||Number(doc.version)!==1||!Array.isArray(doc.events))throw Error('GitHub SOT has an unsupported schema');let seen=new Set(),events=[];for(let e of doc.events)if(e&&e.id&&e.type&&!seen.has(e.id)){seen.add(e.id);events.push(e)}return{schema:'session-manager-sot',version:1,events}}
async function fetchSot(){let c=sotConfig(),url=`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${ghPath(c.path)}?ref=${encodeURIComponent(c.branch)}`;try{let d=await githubApi(url);return{sha:d?.sha||null,doc:normalizeSot(JSON.parse(ghB64Decode(d?.content||'')))}}catch(e){if(e.status===404)return{sha:null,doc:null};throw e}}
async function putSot(sha,doc){let c=sotConfig(),url=`https://api.github.com/repos/${encodeURIComponent(c.owner)}/${encodeURIComponent(c.repo)}/contents/${ghPath(c.path)}`,body={message:`Session Manager SOT changes (${new Date().toISOString()})`,content:ghB64Encode(JSON.stringify(normalizeSot(doc),null,2)+'\n'),branch:c.branch};if(sha)body.sha=sha;return githubApi(url,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
function applySotEvents(events){state.sotApplying=true;try{for(let e of events){let p=e?.payload||{};if(e.type==='settings.snapshot'){if(p.clientType)state.settings.clientType=p.clientType==='botschat'?'botschat':'standard';if(p.appearance)state.settings.appearance=normalizeAppearance(p.appearance)}else if(e.type==='projects.snapshot'){if(p.scope===projectScope()&&p.state)state.projectState=normalizeProjectState(p.state)}else if(e.type==='themes.snapshot'){if(Array.isArray(p.themes))localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:p.themes}))}}localStorage.setItem(K.settings,JSON.stringify(state.settings));let all={};try{all=JSON.parse(localStorage.getItem(K.projects)||'{}')||{}}catch{}all[projectScope()]=normalizeProjectState(state.projectState||loadProjectState());localStorage.setItem(K.projects,JSON.stringify(all));applyAppearance();applyClientType();renderSessions();renderProjectTabs();header()}finally{state.sotApplying=false}}
function mergeSotEvents(remote,outbox){let doc=normalizeSot(remote||emptySot()),seen=new Set(doc.events.map(e=>e.id));for(let e of outbox)if(e?.id&&!seen.has(e.id)){seen.add(e.id);doc.events.push(e)}return doc}
function setSotStatus(msg,kind=''){state.sotStatus=String(msg||'');let el=$('sotStatus');if(el){el.textContent=state.sotStatus;el.className='sotStatus '+kind}}
function scheduleSotSync(delay=900){clearTimeout(state.sotTimer);if(!state.settings.sotEnabled||!state.settings.sotAuto)return;state.sotTimer=setTimeout(()=>sotSync({silent:true,reason:'auto'}).catch(e=>dbg('WARN','SOT auto sync: '+e.message)),delay)}
async function sotSync(options={}){let{silent=false,reason='manual'}=options||{};if(state.sotSyncing)return;if(!state.settings.sotEnabled){if(!silent)toast('GitHub SOT is disabled','err');return}if(!sotPat()){setSotStatus('GitHub PAT required','err');if(!silent)toast('GitHub PAT required','err');return}state.sotSyncing=true;let c=sotConfig();setSotStatus(`Syncing ${c.owner}/${c.repo}:${c.path}…`);try{for(let attempt=1;attempt<=4;attempt++){let remote=await fetchSot(),out=sotOutbox();if((!remote.doc||!remote.doc.events.length)&&!out.length){seedSotOutbox();out=sotOutbox()}let merged=mergeSotEvents(remote.doc,out);applySotEvents(merged.events);if(!out.length){state.sotLastSync=Date.now();setSotStatus(`Current · ${merged.events.length} change events · ${new Date(state.sotLastSync).toLocaleString()}`,'ok');if(!silent)toast('GitHub SOT is current','ok');return}try{await putSot(remote.sha,merged);let pushed=new Set(out.map(e=>e.id));saveSotOutbox(sotOutbox().filter(e=>!pushed.has(e.id)));state.sotLastSync=Date.now();setSotStatus(`Synced ${out.length} change${out.length===1?'':'s'} · ${merged.events.length} total events · ${new Date(state.sotLastSync).toLocaleString()}`,'ok');if(!silent)toast('GitHub SOT synchronized','ok');return}catch(e){if((e.status===409||e.status===422)&&attempt<4)continue;throw e}}throw Error('SOT conflict retry limit reached')}catch(e){setSotStatus('Sync failed: '+e.message,'err');dbg('ERROR','SOT sync failed',{reason,error:e.message,status:e.status});if(!silent)toast('SOT sync failed: '+e.message,'err');throw e}finally{state.sotSyncing=false}}
'''
one("function saveSettings(){localStorage.setItem(K.settings,JSON.stringify(state.settings))}","function saveSettings(){localStorage.setItem(K.settings,JSON.stringify(state.settings));sotEmit('settings.snapshot',portableSettings())}\n"+sot,'SOT engine insertion')

# project/theme writes generate append-only change events
one("function saveProjectState(){let all={};try{all=JSON.parse(localStorage.getItem(K.projects)||'{}')||{}}catch{}all[projectScope()]=normalizeProjectState(state.projectState);localStorage.setItem(K.projects,JSON.stringify(all))}","function saveProjectState(){let all={};try{all=JSON.parse(localStorage.getItem(K.projects)||'{}')||{}}catch{}all[projectScope()]=normalizeProjectState(state.projectState);localStorage.setItem(K.projects,JSON.stringify(all));sotEmit('projects.snapshot',projectSnapshot())}",'project SOT event')
one("function saveThemeLibrary(x){localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:Array.isArray(x?.themes)?x.themes:[]}))}","function saveThemeLibrary(x){localStorage.setItem(K.themes,JSON.stringify({schema:'session-manager-theme-library',version:1,themes:Array.isArray(x?.themes)?x.themes:[]}));sotEmit('themes.snapshot',themeSnapshot())}",'theme SOT event')

# preserve project membership when a session is temporarily absent from a device/list response
one("function reconcileProjects(){if(!state.projectState)state.projectState=loadProjectState();let known=new Set(state.sessions.map(s=>s.key));for(let p of state.projectState.projects){p.sessions=p.sessions.filter(k=>known.has(k));if(p.activeSession&&!known.has(p.activeSession))p.activeSession=''}let assigned=new Set(state.projectState.projects.flatMap(p=>p.sessions));if(!assigned.size&&state.sessions.length){let p=activeProject();p.sessions.push(state.sessions[0].key);p.activeSession=state.sessions[0].key}saveProjectState()}","function reconcileProjects(){if(!state.projectState)state.projectState=loadProjectState();let changed=false;for(let p of state.projectState.projects)if(p.activeSession&&!p.sessions.includes(p.activeSession)){p.activeSession=p.sessions[0]||'';changed=true}let assigned=new Set(state.projectState.projects.flatMap(p=>p.sessions));if(!assigned.size&&state.sessions.length){let p=activeProject();p.sessions.push(state.sessions[0].key);p.activeSession=state.sessions[0].key;changed=true}if(changed)saveProjectState()}",'project reconciliation')

# ---- settings Sync tab and panel ----
one('<button class="configTab active" data-cfg="connection">Connection</button><button class="configTab" data-cfg="client">Client</button><button class="configTab" data-cfg="appearance">Appearance</button>', '<button class="configTab active" data-cfg="connection">Connection</button><button class="configTab" data-cfg="client">Client</button><button class="configTab" data-cfg="sync">Sync</button><button class="configTab" data-cfg="appearance">Appearance</button>','Sync config tab')
syncpane="""<section class=\"cfgPane\" data-pane=\"sync\"><div class=\"appearanceSection\"><h3>GitHub source of truth</h3><div class=\"sectionHelp\">Cross-device state is stored as an append-only change journal. Sync reads the current GitHub SOT, merges unseen local changes, and appends them with SHA conflict protection. Existing SOT history is never discarded.</div><label class=\"check\"><input id=\"sotEnabled\" type=\"checkbox\" ${state.settings.sotEnabled?'checked':''}><span><b>Enable GitHub SOT</b><div class=\"help\">Projects, project session membership, client type, appearance, and custom themes sync across devices.</div></span></label><label class=\"check\"><input id=\"sotAuto\" type=\"checkbox\" ${state.settings.sotAuto?'checked':''}><span><b>Automatically sync changes</b><div class=\"help\">Changes are queued locally first, then merged into GitHub. OpenClaw transcripts and credentials are never copied.</div></span></label><div class=\"field\"><label>GitHub Personal Access Token</label><input id=\"sotPat\" class=\"input\" type=\"password\" autocomplete=\"off\" value=\"${esc(sotPat())}\"><div class=\"help\">Stored only in this browser's local storage. Never written to the SOT or debug log. Token needs Contents read/write access to the selected repository.</div></div><div class=\"sotGrid\"><div class=\"field\"><label>Owner</label><input id=\"sotOwner\" class=\"input\" value=\"${esc(state.settings.sotOwner)}\"></div><div class=\"field\"><label>Repository</label><input id=\"sotRepo\" class=\"input\" value=\"${esc(state.settings.sotRepo)}\"></div><div class=\"field\"><label>Branch</label><input id=\"sotBranch\" class=\"input\" value=\"${esc(state.settings.sotBranch)}\"></div><div class=\"field\"><label>SOT path</label><input id=\"sotPath\" class=\"input\" value=\"${esc(state.settings.sotPath)}\"></div></div><div class=\"sotActions\"><button class=\"btn\" id=\"sotValidate\">Validate PAT</button><button class=\"btn primary\" id=\"sotSyncNow\">Save + Sync now</button></div><div id=\"sotStatus\" class=\"sotStatus\">${esc(state.sotStatus||'Not configured')}</div><div class=\"sotExplain\"><b>Data model:</b> <code>session-manager-sot.json</code> contains immutable change events. A successful GitHub update must include the current blob SHA; if another device writes first, this client re-reads, merges, and retries rather than replacing that device's changes. The PAT itself is device-local.</div><div class=\"notice\" style=\"margin-top:12px\">The default repository <b>acmeproducts/stuff</b> is public. Project names and OpenClaw session keys stored in its SOT are therefore public. Use a private repository if that metadata should remain private.</div></div></section>"""
one('</section><section class="cfgPane" data-pane="appearance">','</section>'+syncpane+'<section class="cfgPane" data-pane="appearance">','Sync config pane')

# commit Sync fields and PAT locally
one("state.settings.gatewayUrl=u;state.settings.clientType=document.querySelector('input[name=clientType]:checked')?.value==='botschat'?'botschat':'standard';state.settings.debugEnabled=", "state.settings.gatewayUrl=u;state.settings.clientType=document.querySelector('input[name=clientType]:checked')?.value==='botschat'?'botschat':'standard';state.settings.sotEnabled=$('sotEnabled').checked;state.settings.sotAuto=$('sotAuto').checked;state.settings.sotOwner=$('sotOwner').value.trim();state.settings.sotRepo=$('sotRepo').value.trim();state.settings.sotBranch=$('sotBranch').value.trim();state.settings.sotPath=$('sotPath').value.trim();if(!state.settings.sotOwner||!state.settings.sotRepo||!state.settings.sotBranch||!state.settings.sotPath)throw Error('GitHub SOT owner, repository, branch, and path are required');setSotPat($('sotPat').value);state.settings.debugEnabled=",'Sync commit fields')

# Sync-panel actions before close binding
sync_actions=r'''
$('sotValidate').onclick=async()=>{let b=$('sotValidate'),old=b.textContent;b.disabled=true;b.textContent='Checking…';try{let login=await validateGithubPat($('sotPat').value.trim());$('sotStatus').textContent=`PAT valid for ${login}`;$('sotStatus').className='sotStatus ok'}catch(e){$('sotStatus').textContent='PAT validation failed: '+e.message;$('sotStatus').className='sotStatus err'}finally{b.disabled=false;b.textContent=old}};
$('sotSyncNow').onclick=async()=>{try{commit();close();await sotSync({silent:false,reason:'settings'})}catch(e){toast(e.message,'err')}};
'''
one("$('sc').onclick=()=>{revert();close()};",sync_actions+"$('sc').onclick=()=>{revert();close()};",'Sync panel actions')

# normal Save schedules SOT after local commit; Reconnect keeps same behavior and also queues SOT
one("$('ss').onclick=()=>{try{commit();close();renderSessions();toast('Settings saved','ok')}catch(e){toast(e.message,'err')}};", "$('ss').onclick=()=>{try{commit();close();renderSessions();if(state.settings.sotEnabled)scheduleSotSync(50);toast('Settings saved','ok')}catch(e){toast(e.message,'err')}};",'Save schedules SOT')
one("$('sr').onclick=()=>{try{commit();close();reconnect();toast('Reconnecting…')}catch(e){toast(e.message,'err')}}", "$('sr').onclick=()=>{try{commit();close();if(state.settings.sotEnabled)scheduleSotSync(50);reconnect();toast('Reconnecting…')}catch(e){toast(e.message,'err')}}",'Reconnect schedules SOT')

# connected startup sync is non-blocking to OpenClaw operation; failures are diagnostic only
one("await loadSessions();if(state.current){", "await loadSessions();if(state.settings.sotEnabled&&sotPat()){try{await sotSync({silent:true,reason:'connected'})}catch(e){dbg('WARN','Connected SOT sync failed: '+e.message)}}if(state.current){",'startup SOT sync')

# Debug reports SOT without exposing PAT
one("['Subscriptions',String(state.subscriptions.size)]]}","['Subscriptions',String(state.subscriptions.size)],['GitHub SOT',state.settings.sotEnabled?`${state.settings.sotOwner}/${state.settings.sotRepo}:${state.settings.sotPath}`:'disabled'],['SOT queued changes',String(sotOutbox().length)],['SOT last sync',state.sotLastSync?fmtTime(state.sotLastSync):'—']]}",'debug SOT status')

# ---- governance amendment ----
g=GOV.read_text(encoding='utf-8')
if 'SESSION-MANAGER-GOVERNANCE v1.9.0' not in g:
    g=g.replace('SESSION-MANAGER-GOVERNANCE v1.8.0','SESSION-MANAGER-GOVERNANCE v1.9.0',1).replace('**Governance version:** 1.8.0','**Governance version:** 1.9.0',1)
amend='''\n\n# 11. v2.5.0 CROSS-DEVICE SOT AMENDMENT — 2026-08-11\n\nThe Session Manager now has a browser-to-GitHub persistent source of truth. The GitHub file is an **append-only event journal**, not a replacement snapshot.\n\n- Default SOT: `acmeproducts/stuff/session-manager-sot.json` on `main`.\n- Configuration accepts a GitHub PAT and owner/repository/branch/path.\n- PAT is browser-local only and is excluded from the SOT and diagnostics.\n- Portable state includes Client Type, Appearance, custom themes, Projects, and Project-to-OpenClaw-session membership.\n- Gateway tokens, device private keys, OpenClaw transcripts, and credentials are never written to the SOT.\n- Every local portable change is queued as a uniquely identified event.\n- Sync first reads the current blob and SHA, merges unique local events after all existing remote events, then updates with that exact SHA.\n- GitHub 409/422 races force re-read/merge/retry; a stale device may not blindly overwrite the remote SOT.\n- Replaying the journal yields the latest accepted state across devices while retaining prior changes for audit/recovery.\n- Project membership is no longer destroyed just because a session is temporarily absent from one `sessions.list` response.\n- BotsChat has no project hash/emblem decoration; Projects are shown by name only.\n\n## Graveyard additions\n\n**G-025 — Device-local-only project/theme state.** Buried. Portable workspace organization must survive device changes through the GitHub SOT.\n\n**G-026 — Blind whole-state GitHub overwrite.** Buried. Writes must be SHA-guarded merges and retain all previously accepted SOT events.\n\n**G-027 — Syncing secrets.** Buried. PATs, Gateway tokens, OpenClaw device private keys, provider credentials and transcripts are never portable SOT content.\n'''
if '# 11. v2.5.0 CROSS-DEVICE SOT AMENDMENT' not in g:g+=amend
GOV.write_text(g,encoding='utf-8')

# protected auth/connect contract must remain byte-identical
for n,v in frozen.items():
    if fn(s,n)!=v: raise SystemExit('protected function changed: '+n)

required=["const BUILD_VERSION='2.5.0'","session-manager-sot","function sotSync(","function githubApi(","data-pane=\"sync\"","sotPat","sotOutbox","GitHub source of truth","append-only change journal","function reconcileProjects()"]
for x in required:
    if x not in s: raise SystemExit('missing required marker: '+x)
if '<span class="projectHash">#</span>' in s or "'# '+p.name" in s: raise SystemExit('BotsChat emblem/hash remains')
APP.write_text(s,encoding='utf-8',newline='')
print('v2.5.0 SOT build complete')
