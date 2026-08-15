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

protected=['identity','deviceToken','saveDeviceToken','connectParams','rpc','rejectPending','afterConnected','sotSync','softDeleteSession','restoreSession','permanentDeleteSession']
frozen={n:fn(s,n) for n in protected}

if "const BUILD_VERSION='2.9.7';" not in s: raise SystemExit('v2.9.7 baseline missing')
one("const BUILD_VERSION='2.9.7';","const BUILD_VERSION='2.9.8';",'build version')
s=s.replace("document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.7');","document.querySelectorAll('.version').forEach(n=>n.textContent='v2.9.8');")
s=s.replace('<span class="version">v2.9.7</span>','<span class="version">v2.9.8</span>',1)
one('// Session Manager v2.9.7 — deterministic GitHub SOT receive triggers, workspace drawer dismissal, and missing-session inspection.','// Session Manager v2.9.8 — connection diagnostics, Tailnet guidance, and mobile configuration-title spacing.','version comment')

css="""
/* v2.9.8 connection diagnostics + mobile configuration title clearance */
.connStatus{padding:11px 12px;border:1px solid var(--ln);border-radius:9px;background:var(--p2);font-size:11px;line-height:1.5;white-space:pre-wrap;word-break:break-word;margin-bottom:10px}.connStatus.ok{border-color:color-mix(in srgb,var(--gr) 55%,var(--ln))}.connStatus.warn{border-color:color-mix(in srgb,var(--yl) 55%,var(--ln))}.connStatus.err{border-color:color-mix(in srgb,var(--rd) 60%,var(--ln))}.diagGrid{display:grid;grid-template-columns:minmax(130px,190px) 1fr;gap:0;border:1px solid var(--ln);border-radius:9px;overflow:hidden;background:var(--p)}.diagGrid b,.diagGrid span{padding:8px 10px;border-bottom:1px solid var(--ln);min-width:0;word-break:break-word}.diagGrid b{background:var(--p2)}.diagGrid b:nth-last-child(-n+2),.diagGrid span:nth-last-child(-n+2){border-bottom:0}.tailHint{margin-top:10px;padding:10px 12px;border-radius:9px;background:color-mix(in srgb,var(--yl) 13%,var(--p));border:1px solid color-mix(in srgb,var(--yl) 45%,var(--ln));font-size:11px;line-height:1.45}
@media(max-width:760px){.configModal .mhead{padding-left:max(72px,calc(env(safe-area-inset-left) + 68px))}.diagGrid{grid-template-columns:1fr}.diagGrid b{padding-bottom:2px;border-bottom:0}.diagGrid span{padding-top:2px}.diagGrid b:nth-last-child(-n+2),.diagGrid span:nth-last-child(-n+2){border-bottom:0}}
"""
one('</style>',css+'</style>','v2.9.8 CSS')

one("const state={ws:null,gen:0,connected:false,connecting:false,manual:false,pairing:false,retry:900,timer:null,pending:new Map(),hello:null,policy:null,identity:null,scopes:[],sessions:[],current:null,sessionId:null,subKey:null,subscriptions:new Map(),sessionStates:new Map(),messages:[],files:[],runId:null,streams:new Map(),debug:[],debugOpen:false,debugTab:'log',archivePaths:[],trashOpen:false,missingOpen:false,missingInspectKey:'',projectState:null,sotApplying:false,sotSyncing:false,sotTimer:null,sotPollTimer:null,sotLastSha:undefined,sotStatus:'Not configured',sotLastSync:0,settings:loadSettings()};",
"const state={ws:null,gen:0,connected:false,connecting:false,manual:false,pairing:false,retry:900,timer:null,pending:new Map(),hello:null,policy:null,identity:null,scopes:[],sessions:[],current:null,sessionId:null,subKey:null,subscriptions:new Map(),sessionStates:new Map(),messages:[],files:[],runId:null,streams:new Map(),debug:[],debugOpen:false,debugTab:'log',archivePaths:[],trashOpen:false,missingOpen:false,missingInspectKey:'',projectState:null,sotApplying:false,sotSyncing:false,sotTimer:null,sotPollTimer:null,sotLastSha:undefined,sotStatus:'Not configured',sotLastSync:0,connectPhase:'idle',connectDetail:'Not connected',connectLastError:'',connectStartedAt:0,connectLastClose:null,settings:loadSettings()};",'state diagnostics')

insert_after="function hostingDefaultGateway(){let h=String(location.hostname||'').toLowerCase(),proto=location.protocol;if(h.endsWith('.ts.net'))return proto==='https:'?`wss://${location.host}`:proto==='http:'?`ws://${location.host}`:DEF;return DEF}"
helpers=r'''function gatewayNetInfo(url=state.settings.gatewayUrl){let raw=String(url||'').trim(),host='';try{host=new URL(raw).hostname.toLowerCase()}catch{}let tailnet=/\.ts\.net$/i.test(host),online=navigator.onLine!==false;return{raw,host,tailnet,online}}
function setConnectPhase(phase,detail='',error=''){state.connectPhase=String(phase||'idle');state.connectDetail=String(detail||'');if(error!==undefined&&error!=='')state.connectLastError=String(error);let c=$('cfgConnStatus'),d=$('cfgDiagStatus');if(c)c.outerHTML=connectionStatusHtml('cfgConnStatus');if(d)d.outerHTML=connectionStatusHtml('cfgDiagStatus',true)}
function connectionStatusHtml(id='cfgConnStatus',diagnostic=false){let n=gatewayNetInfo(),elapsed=state.connectStartedAt&&!state.connected?Math.max(0,Date.now()-state.connectStartedAt):0,kind=state.connected?'ok':state.connecting?'warn':state.connectLastError?'err':'warn',lines=[];if(state.connected)lines.push(`Connected · protocol ${esc(state.hello?.protocol||PV)} · scopes ${esc(state.scopes.join(', '))}`);else if(state.connecting)lines.push(`Connecting · ${esc(state.connectDetail||state.connectPhase)}${elapsed?` · ${Math.round(elapsed/1000)}s`:''}`);else lines.push(`Not connected · ${esc(state.connectDetail||'idle')}`);if(state.connectLastError&&!state.connected)lines.push(`Last failure: ${esc(state.connectLastError)}`);if(n.tailnet&&!state.connected)lines.push('Tailscale required: this gateway is on a Tailnet. Confirm Tailscale is connected on this device before retrying.');if(!n.online)lines.push('Browser reports this device is offline.');if(state.connectLastClose&&!state.connected)lines.push(`Last socket close: ${esc(state.connectLastClose)}`);if(!diagnostic&&state.identity?.deviceId)lines.push(`Device ${esc(state.identity.deviceId)}`);return `<div id="${id}" class="connStatus ${kind}">${lines.join('<br>')}</div>`}
function connectionDiagnosticGrid(){let n=gatewayNetInfo(),close=state.connectLastClose||'—',started=state.connectStartedAt?fmtTime(state.connectStartedAt):'—';return `<div class="diagGrid"><b>Gateway</b><span>${esc(state.settings.gatewayUrl)}</span><b>Tailnet gateway</b><span>${n.tailnet?'Yes (.ts.net)':'No'}</span><b>Browser online</b><span>${n.online?'Yes':'No'}</span><b>Phase</b><span>${esc(state.connectPhase||'idle')}</span><b>Detail</b><span>${esc(state.connectDetail||'—')}</span><b>Attempt started</b><span>${esc(started)}</span><b>Last socket close</b><span>${esc(close)}</span><b>Last failure</b><span>${esc(state.connectLastError||'—')}</span></div>${n.tailnet?'<div class="tailHint"><b>Tailnet check:</b> a normal browser cannot directly ask Tailscale whether it is connected. This app instead knows the gateway is a <code>.ts.net</code> address and uses the actual WebSocket result as the reachability test. A transport failure therefore surfaces the Tailscale reminder prominently.</div>':''}`}
'''
one(insert_after,insert_after+'\n'+helpers,'connection helper insertion')

replace_fn('status',"function status(s){state.connected=s==='connected';state.connecting=s==='connecting';$('dot').className=s;$('pill').className=s;$('pill').textContent=s[0].toUpperCase()+s.slice(1);updateComposer();updateWorkPill();let c=$('cfgConnStatus'),d=$('cfgDiagStatus');if(c)c.outerHTML=connectionStatusHtml('cfgConnStatus');if(d)d.outerHTML=connectionStatusHtml('cfgDiagStatus',true)}")

replace_fn('connect',r'''function connect(){clearTimeout(state.timer);if(state.ws&&[0,1].includes(state.ws.readyState))return;state.manual=false;state.pairing=false;let gen=++state.gen;state.connectStartedAt=Date.now();state.connectLastError='';state.connectLastClose=null;setConnectPhase('opening','Opening secure WebSocket to '+state.settings.gatewayUrl);status('connecting');dbg('WS','Opening',{url:state.settings.gatewayUrl,gen});let w;try{w=new WebSocket(state.settings.gatewayUrl)}catch(e){state.connectLastError=e.message;setConnectPhase('open-failed','Browser could not create the WebSocket',e.message);showError(connectionFailureMessage('WebSocket open failed: '+e.message));status('disconnected');schedule();return}state.ws=w;let ct=setTimeout(()=>{if(gen===state.gen&&!state.connected){state.connectLastError='Gateway opened but did not issue a connect challenge within 12 seconds';setConnectPhase('challenge-timeout','Socket did not reach the OpenClaw challenge phase',state.connectLastError);dbg('ERROR','Challenge timeout');try{w.close(1008,'challenge timeout')}catch{}}},12000);w.onopen=()=>{setConnectPhase('socket-open','WebSocket open · waiting for OpenClaw challenge');dbg('WS','Socket open; waiting for challenge')};w.onmessage=async ev=>{let f;try{f=JSON.parse(ev.data)}catch(e){dbg('ERROR','Bad JSON',{raw:String(ev.data).slice(0,400)});return}dbg('RX',f.type==='event'?'event '+f.event:'response',f);if(f.type==='event'&&f.event==='connect.challenge'){clearTimeout(ct);setConnectPhase('authenticating','Challenge received · authenticating browser device');try{let p=await connectParams(f.payload||{}),hello=await rpc('connect',p,15000,true);if(gen!==state.gen)return;state.hello=hello;state.policy=hello?.policy||null;state.scopes=hello?.auth?.scopes||p.scopes||[];if(hello?.auth?.deviceToken)saveDeviceToken(hello.auth.deviceToken,state.scopes);state.retry=900;state.connectLastError='';setConnectPhase('connected','OpenClaw handshake complete');status('connected');if(!state.scopes.includes('operator.write'))showError('Connected without operator.write. Approve the scope upgrade for this browser device before sending.');else if(!state.scopes.includes('operator.admin'))showError('Chat is connected, but rename requires operator.admin. Approve the requested scope upgrade for this browser device, then reconnect.');else clearError();dbg('AUTH','hello-ok',{protocol:hello?.protocol,scopes:state.scopes,policy:hello?.policy});await afterConnected()}catch(e){handleConnectError(e)}return}if(f.type==='res'){let p=state.pending.get(f.id);if(!p)return;state.pending.delete(f.id);clearTimeout(p.timer);if(f.ok)p.res(f.payload);else{let e=Error(f.error?.message||f.error?.code||'Gateway error');e.gatewayError=f.error;e.code=f.error?.code;p.rej(e)}return}if(f.type==='event')handleEvent(f)};w.onerror=()=>{setConnectPhase('transport-error','WebSocket transport error');dbg('ERROR','WebSocket transport error')};w.onclose=ev=>{clearTimeout(ct);if(gen!==state.gen)return;state.connectLastClose=`${ev.code}${ev.reason?': '+ev.reason:''}`;if(!state.connected&&!state.connectLastError)state.connectLastError='Gateway transport closed before connection completed';setConnectPhase('closed',`Socket closed ${state.connectLastClose}`,state.connectLastError);dbg('WS',`Closed ${ev.code} ${ev.reason||''}`);rejectPending(Error(`Gateway disconnected (${ev.code}${ev.reason?': '+ev.reason:''})`));status('disconnected');if(!state.manual&&!state.pairing)schedule()}}''')

one("function handleConnectError(e){", "function connectionFailureMessage(base){let n=gatewayNetInfo();return n.tailnet?`${base}\\n\\nTailscale required: this gateway is on a Tailnet. Confirm Tailscale is connected on this device, then retry.`:base}\nfunction handleConnectError(e){",'failure helper')
replace_fn('handleConnectError',r'''function handleConnectError(e){let d=e.gatewayError?.details||{},code=e.gatewayError?.code||e.code||'',rid=d.requestId||d.request_id||'',pair=code==='PAIRING_REQUIRED'||/pairing required/i.test(e.message);state.connectLastError=e.message;status('disconnected');if(pair){state.pairing=true;setConnectPhase('pairing-required','Gateway reached · device pairing required',e.message);showError(['OpenClaw device pairing is required.',rid?`Request ID: ${rid}`:'','On the Gateway host run: openclaw devices list',rid?`Approve: openclaw devices approve ${rid}`:'Approve the pending request, then use Settings → Reconnect.'].filter(Boolean).join('\n'))}else{setConnectPhase('handshake-failed','Gateway reached but OpenClaw handshake failed',e.message);showError(connectionFailureMessage('OpenClaw connect failed: '+e.message));schedule()}}''')
replace_fn('schedule',"function schedule(){clearTimeout(state.timer);let d=state.retry;state.retry=Math.min(15000,Math.round(d*1.65));setConnectPhase('retry-wait',`Retrying in ${(d/1000).toFixed(d<1000?1:0)}s`,state.connectLastError);dbg('WS','Reconnect scheduled',{delayMs:d});state.timer=setTimeout(connect,d)}")
replace_fn('reconnect',"function reconnect(){state.manual=true;clearTimeout(state.timer);try{state.ws?.close(1000,'reconnect')}catch{}state.ws=null;state.connected=false;state.pairing=false;state.manual=false;state.connectLastError='';state.connectLastClose=null;setConnectPhase('restarting','Manual reconnect requested');setTimeout(connect,100)}")

old_conn="<div class=\"notice\">${state.connected?`Connected · protocol ${esc(state.hello?.protocol||PV)} · scopes ${esc(state.scopes.join(', '))}`:'Not connected'}${state.identity?.deviceId?`<br>Device ${esc(state.identity.deviceId)}`:''}</div>"
one(old_conn,"${connectionStatusHtml('cfgConnStatus')}",'settings connection status')
old_diag='<section class="cfgPane" data-pane="diagnostics"><label class="check">'
new_diag='<section class="cfgPane" data-pane="diagnostics">${connectionStatusHtml(\'cfgDiagStatus\',true)}${connectionDiagnosticGrid()}<div style="height:12px"></div><label class="check">'
one(old_diag,new_diag,'diagnostics pane status')

# Enrich Environment diagnostics.
replace_fn('debugEnvironment',"function debugEnvironment(){let n=gatewayNetInfo();return[['App version',BUILD_VERSION],['Page origin',location.origin],['Hosting default Gateway',hostingDefaultGateway()],['Gateway',state.settings.gatewayUrl],['Tailnet gateway',n.tailnet?'Yes (.ts.net)':'No'],['Browser online',n.online?'Yes':'No'],['Connection',state.connected?'Connected':state.connecting?'Connecting':'Disconnected'],['Connection phase',state.connectPhase||'idle'],['Connection detail',state.connectDetail||'—'],['Last connection failure',state.connectLastError||'—'],['Last socket close',state.connectLastClose||'—'],['Protocol',String(state.hello?.protocol||PV)],['Scopes',state.scopes.join(', ')||'—'],['Device ID',state.identity?.deviceId||'—'],['Sessions from Gateway',String(state.sessions.length)],['Soft deleted locally',String(Object.keys(trashBucket()).length)],['Subscriptions',String(state.subscriptions.size)],['GitHub SOT',state.settings.sotEnabled?`${state.settings.sotOwner}/${state.settings.sotRepo}:${state.settings.sotPath}`:'disabled'],['SOT queued changes',String(sotOutbox().length)],['SOT last sync',state.sotLastSync?fmtTime(state.sotLastSync):'—']]}" )

for n,before in frozen.items():
    if fn(s,n)!=before: raise SystemExit('protected function changed unexpectedly: '+n)

APP.write_text(s,encoding='utf-8')
print('session-manager-v3.html patched to v2.9.8')
