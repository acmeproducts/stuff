#!/usr/bin/env python3
from pathlib import Path
import re,sys

if len(sys.argv)!=3:
    raise SystemExit('usage: integrate-SOT-turn01-base27-ai.py <clean-base24-behavior.html> <base27.html>')
src=Path(sys.argv[1]).read_text()
for marker in ['TURN01_BASE24_OWNER_GATE','function openConfig(){','function renderInsights(p){','2-copy groups','3-copy groups','4+ copy groups','availableFolderSearch','selectorCommit','Current Plan','Previous / Stale Plan']:
    if marker not in src:
        raise SystemExit('Base27 clean input contract failed: '+marker)

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

src=src.replace('/* TURN01_BASE24_OWNER_GATE */','/* TURN01_BASE24_OWNER_GATE */\n/* TURN01_BASE27_OPERATIONAL_AI */',1)
css=r'''
/* TURN01_BASE27_OPERATIONAL_AI */
.aiGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.aiProvider{border:1px solid var(--line);border-radius:10px;background:#111923;padding:11px}.aiProvider h3{margin:0 0 8px;font-size:12px}.aiStatus{font-size:10px;margin-top:7px}.aiStatus.active{color:var(--good)}.aiStatus.error{color:var(--bad)}.aiStatus.pending{color:var(--warn)}.aiComposer{display:grid;gap:8px}.aiComposer textarea{min-height:96px;resize:vertical}.aiAnswer{white-space:pre-wrap;word-break:break-word}.aiMeta{font-size:10px;color:var(--muted)}@media(max-width:760px){.aiGrid{grid-template-columns:1fr}}
'''
src=src.replace('</style>',css+'\n</style>',1)

boot_guard=r'''<script id="base27BootGuard">
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
async function aiValidate(provider,key,model){var url=provider==='venice'?'https://api.venice.ai/api/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions';var r=await fetch(url,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify({model:model,max_tokens:1,messages:[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'user',content:'Reply with OK.'}]})}),j={};try{j=await r.json()}catch(_){}if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||(provider+' '+r.status));return true}
async function aiProjectContext(p){var parts=await Promise.all([api(`/turn01/projects/${encodeURIComponent(p.project_token)}`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/review`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/plan`).catch(function(){return{}}),api(`/turn01/projects/${encodeURIComponent(p.project_token)}/duplicates`).catch(function(){return{}})]),detail=parts[0]||{},review=parts[1]||{},plan=parts[2]||{},dups=parts[3]||{},sources=(detail.sources||[]).map(function(x){return x.normalized_path});return{project:{project_token:p.project_token,project_name:p.project_name,evidence_revision:p.evidence_revision,processing_state:p.processing_state||p.status||null,sources:sources},evidence:{files:review.files||0,bytes:review.bytes||0,duplicate_groups:review.duplicate_groups||0,warnings:review.warning_count||0,errors:review.error_count||0},duplicates:dups.counts||{},plan:{state:plan.state||'none',evidence_revision:plan.evidence_revision==null?null:plan.evidence_revision,item_count:(plan.items||[]).length}}}
async function aiInfer(p,user){var active=aiActive();if(!active)throw new Error('No validated AI provider is active. Open Configuration and validate Venice or OpenRouter first.');var ctx=await aiProjectContext(p),history=aiHistory[p.project_token]||[],messages=[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'system',content:'SOT PROJECT / EVIDENCE CONTEXT (authoritative supplied data):\\n'+JSON.stringify(ctx,null,2)}].concat(history).concat([{role:'user',content:user}]),url=active.provider==='venice'?'https://api.venice.ai/api/v1/chat/completions':'https://openrouter.ai/api/v1/chat/completions',r=await fetch(url,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',Authorization:'Bearer '+active.key},body:JSON.stringify({model:active.model,max_tokens:3000,messages:messages})}),j={};try{j=await r.json()}catch(_){}if(!r.ok)throw new Error((j.error&&(j.error.message||j.error))||(active.provider+' '+r.status));var out=j&&j.choices&&j.choices[0]&&j.choices[0].message&&j.choices[0].message.content;if(!out)throw new Error('Provider returned no answer');history.push({role:'user',content:user},{role:'assistant',content:out});aiHistory[p.project_token]=history.slice(-12);return{out:out,active:active,ctx:ctx}}
'''
insert=src.index('function openConfig(){')
src=src[:insert]+helpers+'\n'+src[insert:]

config=r'''function openConfig(){var v=aiGet('venice'),o=aiGet('openrouter'),active=localStorage.getItem(AI_STORE.active)||'';var body=`<div class="aiGrid"><div class="aiProvider"><h3>Venice.ai</h3><label class="muted">API key — browser local only</label><input id="cfgVKey" class="input" type="password" autocomplete="new-password" value="${esc(v.key)}"><button id="cfgVModels" class="btn" style="margin-top:7px">Load Venice models</button><select id="cfgVModel" class="input" style="margin-top:7px"><option value="${esc(v.model)}">${esc(v.model||'— load models first —')}</option></select><button id="cfgVValidate" class="btn primary" style="margin-top:7px">Validate & activate Venice</button><div id="cfgVStatus" class="aiStatus ${active==='venice'&&v.validated?'active':v.key?'pending':''}">${active==='venice'&&v.validated?'ACTIVE · '+esc(v.model):v.validated?'Validated · '+esc(v.model):v.key?'Configured · validation required':'Unconfigured'}</div></div><div class="aiProvider"><h3>OpenRouter</h3><label class="muted">API key — browser local only</label><input id="cfgOKey" class="input" type="password" autocomplete="new-password" value="${esc(o.key)}"><button id="cfgOModels" class="btn" style="margin-top:7px">Load OpenRouter models</button><select id="cfgOModel" class="input" style="margin-top:7px"><option value="${esc(o.model)}">${esc(o.model||'— load models first —')}</option></select><button id="cfgOValidate" class="btn primary" style="margin-top:7px">Validate & activate OpenRouter</button><div id="cfgOStatus" class="aiStatus ${active==='openrouter'&&o.validated?'active':o.key?'pending':''}">${active==='openrouter'&&o.validated?'ACTIVE · '+esc(o.model):o.validated?'Validated · '+esc(o.model):o.key?'Configured · validation required':'Unconfigured'}</div></div></div><div class="notice" style="margin-top:10px"><b>SOT supervisor priming is mandatory.</b><div class="muted">Every inference request begins with the fixed SOT supervisor guardrails, followed by exact project/evidence context, then conversation/operator input. Keys remain in this browser and are never sent to the SOT backend or GitHub.</div></div>`;openModal('Configuration',body,'<button class="btn" data-close>Close</button>');function fill(id,ids,current){var el=$(id);el.innerHTML=ids.map(function(x){return'<option value="'+esc(x)+'">'+esc(x)+'</option>'}).join('');if(current&&ids.indexOf(current)>=0)el.value=current}async function loadModels(provider,keyId,modelId,statusId){var key=$(keyId).value.trim(),s=$(statusId);if(!key){s.className='aiStatus error';s.textContent='Enter a key first';return}s.className='aiStatus pending';s.textContent='Loading models…';try{var ids=await aiLoadModels(provider,key);fill(modelId,ids,aiGet(provider).model);s.textContent=ids.length+' models loaded · select one then Validate'}catch(e){aiInvalidate(provider);s.className='aiStatus error';s.textContent='Validation setup failed · '+e.message}}async function validateProvider(provider,keyId,modelId,statusId){var key=$(keyId).value.trim(),model=$(modelId).value,s=$(statusId);if(!key||!model){s.className='aiStatus error';s.textContent='Key and model are required';return}s.className='aiStatus pending';s.textContent='Validating '+model+'…';try{await aiValidate(provider,key,model);aiSaveValidated(provider,key,model);s.className='aiStatus active';s.textContent='ACTIVE · '+model;toast((provider==='venice'?'Venice':'OpenRouter')+' active')}catch(e){aiInvalidate(provider);s.className='aiStatus error';s.textContent='NOT ACTIVE · '+e.message}}$('cfgVModels').onclick=function(){loadModels('venice','cfgVKey','cfgVModel','cfgVStatus')};$('cfgOModels').onclick=function(){loadModels('openrouter','cfgOKey','cfgOModel','cfgOStatus')};$('cfgVValidate').onclick=function(){validateProvider('venice','cfgVKey','cfgVModel','cfgVStatus')};$('cfgOValidate').onclick=function(){validateProvider('openrouter','cfgOKey','cfgOModel','cfgOStatus')}}'''
src=repl(src,'openConfig',config)

insights=r'''function renderInsights(p){var c=$('content'),active=aiActive();c.innerHTML=`<div class="section"><div class="sectionHead"><h2>AI Insights</h2><span class="spacer"></span><span class="aiMeta">${active?esc(active.provider+' · '+active.model):'No active provider'}</span></div><div class="sectionBody">${active?'':`<div class="notice"><b>AI is not active.</b><div class="muted">Open Configuration, enter a Venice or OpenRouter key, load models, select a model, and complete a real Validate call.</div><button id="aiOpenConfig" class="btn" style="margin-top:8px">Open Configuration</button></div>`}<div class="aiComposer" style="margin-top:10px"><textarea id="aiPrompt" class="input" placeholder="Ask SOT to explain evidence, duplicates, plan implications, risks, or recommendations…" ${active?'':'disabled'}></textarea><div class="actions"><button id="aiAsk" class="btn primary" ${active?'':'disabled'}>Ask SOT</button><button id="aiClear" class="btn" ${active?'':'disabled'}>Clear conversation</button></div><div id="aiResult" class="aiAnswer muted">${active?'Supervisor guardrails and current project evidence will be injected automatically.':'Provider activation required.'}</div></div></div></div>`;if($('aiOpenConfig'))$('aiOpenConfig').onclick=openConfig;if(active){$('aiClear').onclick=function(){aiHistory[p.project_token]=[];$('aiResult').textContent='Conversation cleared.'};$('aiAsk').onclick=async function(){var q=$('aiPrompt').value.trim();if(!q)return;var out=$('aiResult');out.className='aiAnswer muted';out.textContent='Grounding in current SOT evidence and asking '+active.provider+'…';$('aiAsk').disabled=true;try{var r=await aiInfer(p,q);out.className='aiAnswer';out.textContent=r.out}catch(e){out.className='errorBox';out.textContent=e.message}finally{$('aiAsk').disabled=false}}}}'''
src=repl(src,'renderInsights',insights)

old="load();setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel)))renderIndex(psel,true)}catch{}},3000);"
new="load().then(function(){document.documentElement.setAttribute('data-sot-boot','base27-ok')}).catch(function(e){document.documentElement.setAttribute('data-sot-boot-error','initial-load: '+String(e&&e.message?e.message:e))});setInterval(async()=>{try{let [p,r]=await Promise.all([api('/projects'),api('/rollup')]);state.projects=Array.isArray(p)?p:(p.projects||[]);state.rollup=r;renderCards();let psel=selectedProject();if(psel&&state.tab==='index'&&['Queued','WIP','Paused'].includes(projectState(psel)))renderIndex(psel,true)}catch{}},3000);"
if old not in src: raise SystemExit('Base27 polling/bootstrap tail not found')
src=src.replace(old,new,1)

required=['TURN01_BASE27_OPERATIONAL_AI','base27BootGuard','data-sot-boot','SOT_SUPERVISOR_PROMPT','aiLoadModels','aiValidate','aiSaveValidated','aiActive','aiProjectContext','aiInfer','Validate & activate Venice','Validate & activate OpenRouter',"messages=[{role:'system',content:SOT_SUPERVISOR_PROMPT},{role:'system',content:'SOT PROJECT / EVIDENCE CONTEXT",'No validated AI provider is active.','https://api.venice.ai/api/v1/models','https://openrouter.ai/api/v1/auth/key']
for m in required:
    if m not in src: raise SystemExit('Base27 AI/boot marker missing '+m)
# Compatibility-style lint is scoped only to the newly authored Base-27 delta.
for label,delta in [('helpers',helpers),('config',config),('insights',insights),('boot_guard',boot_guard),('bootstrap',new)]:
    for bad in ['?.','...cfg','...history']:
        if bad in delta: raise SystemExit('Base27 new-delta compatibility syntax prohibited in '+label+': '+bad)
Path(sys.argv[2]).write_text(src)
print('Base-27 AI + browser boot instrumentation integrated from clean Base-24 behavior')
