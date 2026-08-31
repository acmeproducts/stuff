#!/usr/bin/env python3
from pathlib import Path
import re,sys

if len(sys.argv)!=3:
    raise SystemExit('usage: integrate-SOT-turn01-base28-ai.py <clean-base24-behavior.html> <base28.html>')
src=Path(sys.argv[1]).read_text()
for marker in ['TURN01_BASE24_OWNER_GATE','function openConfig(){','function renderInsights(p){','2-copy groups','3-copy groups','4+ copy groups','availableFolderSearch','selectorCommit','Current Plan','Previous / Stale Plan','Default Target','Default Backup']:
    if marker not in src:
        raise SystemExit('Base28 clean input contract failed: '+marker)

def span(text,name):
    ms=list(re.finditer(r'(?m)^(?:async\s+)?function\s+'+re.escape(name)+r'\s*\(',text))
    if len(ms)!=1: raise SystemExit('function %s ambiguous %d'%(name,len(ms)))
    a=ms[0].start(); b=text.find('{',ms[0].end()); d=0; q=None; escp=False; i=b
    while i<len(text):
        c=text[i]
        if q:
            if escp: escp=False
            elif c=='\\': escp=True
            elif c==q: q=None
        else:
            if c in "'\"`": q=c
            elif c=='{': d+=1
            elif c=='}':
                d-=1
                if d==0:return a,i+1
        i+=1
    raise SystemExit('unbalanced '+name)

def repl(text,name,val):
    a,b=span(text,name)
    return text[:a]+val.rstrip()+text[b:]

src=src.replace('/* TURN01_BASE24_OWNER_GATE */','/* TURN01_BASE24_OWNER_GATE */\n/* TURN01_BASE28_OPERATIONAL_AI */',1)
css=r'''
/* TURN01_BASE28_OPERATIONAL_AI */
.aiGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aiProvider{border:1px solid var(--line);border-radius:10px;background:#111923;padding:11px}.aiProvider h3{margin:0 0 8px;font-size:12px}.aiStatus{font-size:10px;margin-top:7px}.aiStatus.active{color:var(--good)}.aiStatus.error{color:var(--bad)}.aiStatus.pending{color:var(--warn)}.aiComposer{display:grid;gap:8px}.aiComposer textarea{min-height:96px;resize:vertical}.aiAnswer{white-space:pre-wrap;word-break:break-word}.aiMeta{font-size:10px;color:var(--muted)}@media(max-width:760px){.aiGrid{grid-template-columns:1fr}}
'''
src=src.replace('</style>',css+'\n</style>',1)

boot_guard=r'''<script id="base28BootGuard">
(function(){
  window.__SOT_BOOT_ERRORS__=[];
  function mark(kind,msg){try{window.__SOT_BOOT_ERRORS__.push(String(kind)+': '+String(msg||''));document.documentElement.setAttribute('data-sot-boot-error',String(kind)+': '+String(msg||''));}catch(_){} }
  window.addEventListener('error',function(e){mark('error',e&&e.message?e.message:'unknown');});
  window.addEventListener('unhandledrejection',function(e){var r=e&&e.reason;mark('unhandledrejection',r&&r.message?r.message:String(r||'unknown'));});
})();
</script>
'''
main_script_pos=src.find('<script>')
if main_script_pos<0: raise SystemExit('main script tag not found')
src=src[:main_script_pos]+boot_guard+src[main_script_pos:]

helpers=r'''
const SOT_SUPERVISOR_PROMPT=`You are the SOT supervisor analyst. The SOT database and deterministic fingerprint/evidence records supplied to you are factual authority. You interpret evidence and may propose actions, but you are never filesystem authority, storage authority, approval authority, or execution authority. Never invent files, paths, hashes, capacities, volume state, duplicate groups, plan state, approvals, execution results, or facts absent from supplied evidence. Express actions only as proposals subject to deterministic validation, SOT plan compilation, required approval, and deterministic execution. If evidence is missing, stale, conflicting, or insufficient, state that explicitly rather than filling gaps with assumptions. Preserve project boundaries and identify cross-project implications instead of silently resolving them. Explain recommendations using the supplied evidence and provenance.`;
const AI_STORE={active:'sot.ai.activeProvider',venice:{key:'sot.veniceKey',model:'sot.ai.venice.model',validated:'sot.ai.venice.validated'},openrouter:{key:'sot.openrouterKey',model:'sot.ai.openrouter.model',validated:'sot.ai.openrouter.validated'}};
const aiHistory={};
function aiGet(provider){var s=AI_STORE[provider];return{key:localStorage.getItem(s.key)||'',model:localStorage.getItem(s.model)||'',validated:localStorage.getItem(s.validated)==='1'}}
function aiActive(){var provider=localStorage.getItem(AI_STORE.active)||'';if(!provider||!AI_STORE[provider])return null;var cfg=aiGet(provider);if(!(cfg.validated&&cfg.key&&cfg.model))return null;return{provider:provider,key:cfg.key,model:cfg.model,validated:true}}
function aiSaveValidated(provider,key,model){var s=AI_STORE[provider];localStorage.setItem(s.key,key);localStorage.setItem(s.model,model);localStorage.setItem(s.validated,'1');localStorage.setItem(AI_STORE.active,provider)}
function aiInvalidate(provider){var s=AI_STORE[provider];localStorage.removeItem(s.validated);if(localStorage.getItem(AI_STORE.active)===provider)localStorage.removeItem(AI_STORE.active)}
async function aiLoadModels(provider,key){if(provider==='venice'){var r=await fetch('https://api.venice.ai/api/v1/models',{cache:'no-store',headers:{Authorization:'Bearer '+key}}),j=await r.json();if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||('Venice '+r.status));return(j.data||[]).map(function(x){return x.id}).filter(Boolean).sort()}var ar=await fetch('https://openrouter.ai/api/v1/auth/key',{cache:'no-store',headers:{Authorization:'Bearer '+key}}),aj=await ar.json();if(!ar.ok)throw new Error((aj.error&&(aj.error.message||aj.error))||('OpenRouter '+ar.status));var rm=await fetch('https://openrouter.ai/api/v1/models',{cache:'no-store'}),jm=await rm.json();if(!rm.ok)throw new Error('OpenRouter models '+rm.status);return(jm.data||[]).map(function(x){return x.id}).filter(Boolean).sort()}
async function aiValidate(provider,key,model){var url=provider==='venice'?'https://api.venice.ai/api/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';var r=await fetch(url,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model:model,max_tokens:2,messages:[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'user',content:'Reply OK.'}]})}),j={};try{j=await r.json()}catch(_){}if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||(provider+' '+r.status));if(!(j&&j.choices&&j.choices[0]))throw new Error('Provider returned no completion');return true}
async function aiProjectContext(p){var parts=await Promise.all([api(`/turn01/projects/${encodeURIComponent(p.project_token)}`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/review`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/plan`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/duplicates`).catch(function(){return{}})]),detail=parts[0]||{},review=parts[1]||{},plan=parts[2]||{},dups=parts[3]||{},sources=(detail.sources||[]).map(function(x){return x.normalized_path});return{project:{project_token:p.project_token,project_name:p.project_name,evidence_revision:p.evidence_revision,processing_state:p.processing_state||p.status||null,sources:sources},evidence:{files:review.files||0,bytes:review.bytes||0,duplicate_groups:review.duplicate_groups||0,warnings:review.warning_count||0,errors:review.error_count||0},duplicates:dups.counts||{},plan:{state:plan.state||'none',evidence_revision:plan.evidence_revision==null?null:plan.evidence_revision,item_count:(plan.items||[]).length}}}
async function aiInfer(p,user){var active=aiActive();if(!active)throw new Error('No validated AI provider is active. Open Configuration and validate Venice or OpenRouter first.');var ctx=await aiProjectContext(p),history=aiHistory[p.project_token]||[],messages=[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'system',content:'SOT PROJECT / EVIDENCE CONTEXT (authoritative supplied data):\\n'+JSON.stringify(ctx,null,2)}].concat(history).concat([{role:'user',content:user}]),url=active.provider==='venice'?'https://api.venice.ai/api/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions',r=await fetch(url,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+active.key},body:JSON.stringify({model:active.model,max_tokens:3000,messages:messages})}),j={};try{j=await r.json()}catch(_){}if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||(active.provider+' '+r.status));var out=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!out)throw new Error('Provider returned no answer');history.push({role:'user',content:user},{role:'assistant',content:out});aiHistory[p.project_token]=history.slice(-12);return{out:out,active:active,ctx:ctx}}
'''
insert=src.index('function openConfig(){')
src=src[:insert]+helpers+'\n'+src[insert:]

config=r'''async function openConfig(){var cfg={};try{cfg=await api('/admin/settings')}catch(_){}var target=cfg.target_root?[cfg.target_root]:[],backup=cfg.backup_root?[cfg.backup_root]:[],v=aiGet('venice'),o=aiGet('openrouter'),active=localStorage.getItem(AI_STORE.active)||'',modelCache={venice:[],openrouter:[]};function providerStatus(provider,state){if(active===provider&&state.validated)return'<span class="aiStatus active">ACTIVE · '+esc(state.model)+'</span>';if(state.validated)return'<span class="aiStatus active">Validated · '+esc(state.model)+'</span>';if(state.key)return'<span class="aiStatus pending">Configured · validation required</span>';return'<span class="aiStatus">Unconfigured</span>'}function providerCard(provider,state,label){var list=modelCache[provider].length?modelCache[provider]:(state.model?[state.model]:[]),opts=list.map(function(m){return'<option value="'+esc(m)+'" '+(m===state.model?'selected':'')+'>'+esc(m)+'</option>'}).join('');return'<div class="aiProvider"><h3>'+label+'</h3><label class="muted">API key — browser local only</label><input id="cfgKey-'+provider+'" class="input" type="password" autocomplete="new-password" value="'+esc(state.key)+'"><button id="cfgModels-'+provider+'" class="btn" style="margin-top:7px">Load models</button><select id="cfgModel-'+provider+'" class="input" style="margin-top:7px"><option value="">— select model —</option>'+opts+'</select><button id="cfgValidate-'+provider+'" class="btn primary" style="margin-top:7px">Validate & activate</button><div id="cfgStatus-'+provider+'">'+providerStatus(provider,state)+'</div></div>'}function draw(){v=aiGet('venice');o=aiGet('openrouter');active=localStorage.getItem(AI_STORE.active)||'';var body='<div class="compactCard"><h3>Default Target</h3><div class="mono">'+esc(target[0]||'Not set')+'</div><button id="defaultTarget" class="btn">Select</button></div><div class="compactCard" style="margin-top:8px"><h3>Default Backup</h3><div class="mono">'+esc(backup[0]||'Not set')+'</div><button id="defaultBackup" class="btn">Select</button></div><div class="section" style="margin-top:12px"><div class="sectionHead"><h2>Operational AI</h2></div><div class="sectionBody"><div class="notice" style="margin-bottom:10px"><b>SOT supervisor priming is mandatory.</b><div class="muted">Every inference begins with fixed supervisor guardrails, then exact project/evidence context, then conversation/operator input. Keys stay in this browser.</div></div><div class="aiGrid">'+providerCard('venice',v,'Venice.ai')+providerCard('openrouter',o,'OpenRouter')+'</div></div></div>';openModal('Configuration',body,'<button class="btn" data-close>Cancel</button><button id="saveConfig" class="btn primary">Save storage defaults</button>');$('defaultTarget').onclick=function(){openFolderSelector({role:'target',title:'Default Target',selected:target,doneLabel:'Use Default Target',onDone:function(a){target=a;draw()}})};$('defaultBackup').onclick=function(){openFolderSelector({role:'backup',title:'Default Backup',selected:backup,doneLabel:'Use Default Backup',onDone:function(a){backup=a;draw()}})};['venice','openrouter'].forEach(function(provider){var keyEl=$('cfgKey-'+provider),modelEl=$('cfgModel-'+provider),statusEl=$('cfgStatus-'+provider);$('cfgModels-'+provider).onclick=async function(){var key=keyEl.value.trim();if(!key){statusEl.innerHTML='<span class="aiStatus error">Enter a key first</span>';return}statusEl.innerHTML='<span class="aiStatus pending">Loading models…</span>';try{aiInvalidate(provider);modelCache[provider]=await aiLoadModels(provider,key);var s=AI_STORE[provider];localStorage.setItem(s.key,key);if(modelCache[provider].length&&!localStorage.getItem(s.model))localStorage.setItem(s.model,modelCache[provider][0]);draw()}catch(e){aiInvalidate(provider);statusEl.innerHTML='<span class="aiStatus error">'+esc(e.message)+'</span>'}};$('cfgValidate-'+provider).onclick=async function(){var key=keyEl.value.trim(),model=modelEl.value;if(!key||!model){statusEl.innerHTML='<span class="aiStatus error">Key and model are required</span>';return}statusEl.innerHTML='<span class="aiStatus pending">Validating real completion…</span>';try{await aiValidate(provider,key,model);aiSaveValidated(provider,key,model);toast((provider==='venice'?'Venice':'OpenRouter')+' active');draw()}catch(e){var s=AI_STORE[provider];localStorage.setItem(s.key,key);localStorage.setItem(s.model,model);aiInvalidate(provider);statusEl.innerHTML='<span class="aiStatus error">Validation failed: '+esc(e.message)+'</span>'}}});$('saveConfig').onclick=async function(){try{await api('/admin/settings',{method:'PUT',body:JSON.stringify({target_root:target[0]||'',backup_root:backup[0]||'',hash_workers:Number(cfg.hash_workers||4)})});closeModal();toast('Storage defaults saved')}catch(e){toast(e.message)}}}draw()}'''
src=repl(src,'openConfig',config)

insights=r'''function renderInsights(p){var c=$('content'),active=aiActive();c.innerHTML=`<div class="section"><div class="sectionHead"><h2>AI Insights</h2><span class="spacer"></span><span class="aiMeta">${active?esc(active.provider+' · '+active.model):'No active provider'}</span></div><div class="sectionBody">${active?'':`<div class="notice"><b>AI is not active.</b><div class="muted">Open Configuration, enter a Venice or OpenRouter key, load models, select a model, and complete a real Validate call.</div><button id="aiOpenConfig" class="btn" style="margin-top:8px">Open Configuration</button></div>`}<div class="aiComposer" style="margin-top:10px"><textarea id="aiPrompt" class="input" placeholder="Ask SOT to explain evidence, duplicates, plan implications, risks, or recommendations…" ${active?'':'disabled'}></textarea><div class="actions"><button id="aiAsk" class="btn primary" ${active?'':'disabled'}>Ask SOT</button><button id="aiClear" class="btn" ${active?'':'disabled'}>Clear conversation</button></div><div id="aiResult" class="aiAnswer muted">${active?'Supervisor guardrails and current project evidence will be injected automatically.':'Provider activation required.'}</div></div></div></div>`;if($('aiOpenConfig'))$('aiOpenConfig').onclick=openConfig;if(active){$('aiClear').onclick=function(){aiHistory[p.project_token]=[];$('aiResult').textContent='Conversation cleared.'};$('aiAsk').onclick=async function(){var q=$('aiPrompt').value.trim();if(!q)return;var out=$('aiResult');out.className='aiAnswer muted';out.textContent='Grounding in current SOT evidence and asking '+active.provider+'…';$('aiAsk').disabled=true;try{var r=await aiInfer(p,q);out.className='aiAnswer';out.textContent=r.out}catch(e){out.className='errorBox';out.textContent=e.message}finally{$('aiAsk').disabled=false}}}}'''
src=repl(src,'renderInsights',insights)

old="load();setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel)))renderIndex(psel,true)}catch{}},3000);"
new="load().then(function(){document.documentElement.setAttribute('data-sot-boot','base28-ok')}).catch(function(e){document.documentElement.setAttribute('data-sot-boot-error','initial-load: '+String(e&&e.message?e.message:e))});setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel)))renderIndex(psel,true)}catch{}},3000);"
if old not in src: raise SystemExit('Base28 polling/bootstrap tail not found')
src=src.replace(old,new,1)

required=['TURN01_BASE28_OPERATIONAL_AI','base28BootGuard','data-sot-boot','Default Target','Default Backup','Save storage defaults','SOT_SUPERVISOR_PROMPT','aiLoadModels','aiValidate','aiSaveValidated','aiActive','aiProjectContext','aiInfer','Validate & activate','No validated AI provider is active.','https://api.venice.ai/api/v1/models','https://openrouter.ai/api/v1/auth/key']
for m in required:
    if m not in src: raise SystemExit('Base28 AI/boot/config marker missing '+m)
Path(sys.argv[2]).write_text(src)
print('Base-28 storage defaults + operational AI + browser boot integrated from clean Base-24 behavior')
