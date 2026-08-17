from pathlib import Path
import re

APP=Path('session-manager-v3.html')
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


def replace_fn(name,new):
    global s
    i,j=bounds(s,name)
    s=s[:i]+new+s[j:]

# Version.
s=re.sub(r"const BUILD_VERSION='[^']+';","const BUILD_VERSION='2.9.13';",s,count=1)
s=re.sub(r'<span class="version">v[0-9.]+</span>','<span class="version">v2.9.13</span>',s,count=1)
s=re.sub(r"document\.querySelectorAll\('\.version'\)\.forEach\(n=>n\.textContent='v[0-9.]+'\);","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.13');",s,count=1)

# SOT is a cross-origin source of truth. A new origin should receive it by default;
# explicit user disable remains honored.
replace_fn('loadSettings',r'''function loadSettings(){let s={};try{s=JSON.parse(localStorage.getItem(K.settings)||'{}')}catch{}let hasSotEnabled=Object.prototype.hasOwnProperty.call(s,'sotEnabled');return{gatewayUrl:s.gatewayUrl||hostingDefaultGateway(),debugEnabled:s.debugEnabled===true,debugText:s.debugText===true,clientType:s.clientType==='botschat'?'botschat':'standard',sotEnabled:hasSotEnabled?s.sotEnabled===true:true,sotAuto:s.sotAuto!==false,sotOwner:String(s.sotOwner||'acmeproducts'),sotRepo:String(s.sotRepo||'stuff'),sotBranch:String(s.sotBranch||'main'),sotPath:String(s.sotPath||'session-manager-sot.json'),appearance:normalizeAppearance(s.appearance||{})}}''')

# Authenticated GitHub API remains required for writes. Reads may be anonymous for a public SOT.
replace_fn('githubApi',r'''async function githubApi(url,options={},pat=sotPat(),allowAnonymous=false){if(!pat&&!allowAnonymous)throw Error('GitHub PAT is required');let headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',...(pat?{Authorization:'Bearer '+pat}:{}),...(options.headers||{})},r=await fetch(url,{cache:'no-store',...options,headers});if(r.status===204)return null;let raw=await r.text(),data=null;if(raw){try{data=JSON.parse(raw)}catch(err){let e=Error(`GitHub API returned invalid JSON (${r.status})`);e.status=r.status;e.cause=err;throw e}}if(!r.ok){let e=Error(data?.message||`GitHub API error (${r.status})`);e.status=r.status;e.data=data;throw e}return data}''')

# Public raw read allows the same SOT to hydrate GitHub Pages and the OpenClaw report origin
# without duplicating the PAT into each browser origin.
needle='async function fetchSot(){'
helper=r'''function ghRawUrl(c){let owner=encodeURIComponent(c.owner),repo=encodeURIComponent(c.repo),branch=String(c.branch||'main').split('/').filter(Boolean).map(encodeURIComponent).join('/'),path=ghPath(c.path);return`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`}
'''
if 'function ghRawUrl(c)' not in s:
    s=s.replace(needle,helper+needle,1)

replace_fn('fetchSot',r'''async function fetchSot(){let c=sotConfig(),pat=sotPat();if(!pat){let url=ghRawUrl(c)+(ghRawUrl(c).includes('?')?'&':'?')+'_sm='+Date.now(),r=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'}});if(r.status===404)return{sha:null,doc:null,readOnly:true};if(!r.ok){let e=Error(`GitHub public SOT read failed (${r.status})`);e.status=r.status;throw e}let txt=await r.text();if(!txt.trim())throw Error('GitHub SOT returned an empty document');return{sha:null,doc:normalizeSot(JSON.parse(txt)),readOnly:true}}let repo=ghRepo(c),url=`${repo}/contents/${ghPath(c.path)}?ref=${encodeURIComponent(c.branch)}`;try{let d=await githubApi(url),txt='';if(!d?.sha)throw Error('GitHub SOT metadata is incomplete');if(d.encoding==='base64'&&typeof d.content==='string'&&d.content.trim())txt=ghB64Decode(d.content);else{let b=await githubApi(`${repo}/git/blobs/${encodeURIComponent(d.sha)}`);if(b?.encoding!=='base64'||typeof b.content!=='string'||!b.content.trim())throw Error('GitHub SOT blob content is unavailable');txt=ghB64Decode(b.content)}if(!txt.trim())throw Error('GitHub SOT returned an empty document');return{sha:d.sha,doc:normalizeSot(JSON.parse(txt)),readOnly:false}}catch(e){if(e.status===404)return{sha:null,doc:null,readOnly:false};throw e}}''')

replace_fn('checkSotReceive',r'''async function checkSotReceive(reason='receive'){if(state.sotSyncing||!state.settings.sotEnabled||!state.settings.sotAuto||navigator.onLine===false)return;if(!sotPat()){await sotSync({silent:true,reason});return}let sha=await sotRemoteSha();if(state.sotLastSha!==undefined&&sha===state.sotLastSha&&!sotOutbox().length)return;await sotSync({silent:true,reason})}''')

replace_fn('startSotPolling',r'''function startSotPolling(){clearInterval(state.sotPollTimer);state.sotPollTimer=null;if(!state.settings.sotEnabled||!state.settings.sotAuto)return;let interval=sotPat()?60000:300000;state.sotPollTimer=setInterval(()=>{if(document.visibilityState==='visible'&&navigator.onLine!==false)triggerSotReceive('poll')},interval)}''')

replace_fn('sotSync',r'''async function sotSync(options={}){let{silent=false,reason='manual'}=options||{};if(state.sotSyncing)return;if(!state.settings.sotEnabled){if(!silent)toast('GitHub SOT is disabled','err');return}state.sotSyncing=true;let c=sotConfig(),pat=sotPat();setSotStatus(`Syncing ${c.owner}/${c.repo}:${c.path}…`);try{for(let attempt=1;attempt<=4;attempt++){let remote=await fetchSot();state.sotLastSha=remote.sha??null;let out=sotOutbox();if(!remote.doc&&!pat){throw Error('GitHub SOT not found; a PAT is required to create it')}if((!remote.doc||!remote.doc.events.length)&&!out.length&&pat){seedSotOutbox();out=sotOutbox()}let merged=mergeSotEvents(remote.doc,out);applySotEvents(merged.events);if(!pat){state.sotLastSync=Date.now();let queued=out.length?` · ${out.length} local change${out.length===1?'':'s'} queued until a PAT is available`:'';setSotStatus(`Received read-only · ${merged.events.length} change events${queued} · ${new Date(state.sotLastSync).toLocaleString()}`,'ok');dbg('SOT','Public read-only SOT received',{reason,events:merged.events.length,queued:out.length,origin:location.origin});if(!silent)toast(out.length?'GitHub SOT received; local changes are queued until a PAT is available':'GitHub SOT received','ok');return}if(!out.length){state.sotLastSync=Date.now();setSotStatus(`Current · ${merged.events.length} change events · ${new Date(state.sotLastSync).toLocaleString()}`,'ok');if(!silent)toast('GitHub SOT is current','ok');return}try{await putSot(remote.sha,merged);let pushed=new Set(out.map(e=>e.id));saveSotOutbox(sotOutbox().filter(e=>!pushed.has(e.id)));state.sotOutboxMem=null;state.sotLastSync=Date.now();setSotStatus(`Synced ${out.length} change${out.length===1?'':'s'} · ${merged.events.length} total events · ${new Date(state.sotLastSync).toLocaleString()}`,'ok');if(!silent)toast('GitHub SOT synchronized','ok');return}catch(e){let msg=String(e?.message||'');if((e.status===409||e.status===422||/fast.forward|does not match|sha/i.test(msg))&&attempt<4){await new Promise(r=>setTimeout(r,500*attempt));continue}throw e}}throw Error('SOT conflict retry limit reached')}catch(e){setSotStatus('Sync failed: '+e.message,'err');dbg('ERROR','SOT sync failed',{reason,error:e.message,status:e.status});if(!silent)toast('SOT sync failed: '+e.message,'err');throw e}finally{state.sotSyncing=false}}''')

# Hydrate SOT before opening the gateway. This prevents a fresh origin from reconciling
# sessions against an empty local project map and briefly treating assigned sessions as unassigned.
replace_fn('init',r'''async function init(){applyAppearance();state.projectState=loadProjectState();setSidebar(true);bind();applyClientType();updateComposer();updateWorkPill();try{await identity()}catch(e){showError(e.message);return}migrateTabStylesToSot();startSotPolling();try{await checkSotReceive('startup')}catch(e){dbg('WARN','SOT startup receive: '+e.message)}connect()}''')

# Diagnostics expose the cross-origin behavior directly.
replace_fn('debugEnvironment',r'''function debugEnvironment(){let n=gatewayNetInfo(),sotAccess=state.settings.sotEnabled?(sotPat()?'Read/write (PAT present)':'Read-only public; PAT needed only to publish'):'disabled';return[['App version',BUILD_VERSION],['Page origin',location.origin],['Hosting default Gateway',hostingDefaultGateway()],['Gateway',state.settings.gatewayUrl],['Tailnet gateway',n.tailnet?'Yes (.ts.net)':'No'],['Browser online',n.online?'Yes':'No'],['Connection',state.connected?'Connected':state.connecting?'Connecting':'Disconnected'],['Connection phase',state.connectPhase||'idle'],['Connection detail',state.connectDetail||'—'],['Last connection failure',state.connectLastError||'—'],['Last socket close',state.connectLastClose||'—'],['Protocol',String(state.hello?.protocol||PV)],['Scopes',state.scopes.join(', ')||'—'],['Device ID',state.identity?.deviceId||'—'],['Sessions from Gateway',String(state.sessions.length)],['Soft deleted locally',String(Object.keys(trashBucket()).length)],['Subscriptions',String(state.subscriptions.size)],['GitHub SOT',state.settings.sotEnabled?`${state.settings.sotOwner}/${state.settings.sotRepo}:${state.settings.sotPath}`:'disabled'],['SOT access',sotAccess],['Project sync mode','SOT v2 cross-origin / fine-grained / non-destructive'],['SOT queued changes',String(sotOutbox().length)],['SOT last sync',state.sotLastSync?fmtTime(state.sotLastSync):'—']]}''')

APP.write_text(s,encoding='utf-8')
