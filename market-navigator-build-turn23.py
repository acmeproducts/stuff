from pathlib import Path

SRC=Path('market-navigator-turn22-pre-ship.html')
OUT=Path('market-navigator-turn23-pre-ship.html')
s=SRC.read_text()

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f'{label}: expected 1 anchor, found {n}')
    s=s.replace(old,new,1)

def allr(old,new,label,min_count=1):
    global s
    n=s.count(old)
    if n<min_count: raise SystemExit(f'{label}: expected >= {min_count}, found {n}')
    s=s.replace(old,new)

one('<title>Market Navigator · Turn 22</title>','<title>Market Navigator · Turn 23</title>','title')
allr('TURN 22 PRE-SHIP','TURN 23 PRE-SHIP','build label')
one('<button class="cfgTab" data-cfgtab="about">About</button>','<button class="cfgTab" data-cfgtab="sources">Sources</button><button class="cfgTab" data-cfgtab="about">About</button>','sources tab')

source_panel='''<div class="cfgPanel card" id="cfgSources" style="padding:14px"><h2>Sources</h2><p class="rowMeta">Register a canonical market instrument. The repository resolves identity, collects evidence, records Health/provenance, and then exposes healthy series through Add.</p><div class="sourceRegisterGrid"><div class="field"><label for="sourceQuery">Ticker / name</label><input id="sourceQuery" autocomplete="off" spellcheck="false" placeholder="Dow, GAAMHX, NVDA, VOO…"></div><div class="field"><label for="sourceClass">Instrument class</label><select id="sourceClass"><option value="">Choose class…</option><option value="index">Market index</option><option value="equity">Equity</option><option value="etf">ETF</option><option value="fund_cit">Fund / CIT / NAV</option></select></div><div class="actions left"><button class="btn" id="sourceRegister">Request registration</button><button class="btn" id="sourceRefresh">Refresh sources</button></div><div class="cfgNote" id="sourceStatus">Identity must be resolved before evidence is admitted. Ambiguous symbols are rejected rather than proxied.</div></div><div class="sourceListHead"><strong>Registered sources</strong><span>canonical evidence only</span></div><div id="sourceList" class="sourceList"></div></div>'''
one('<div class="cfgPanel card" id="cfgAbout" style="padding:14px">',source_panel+'<div class="cfgPanel card" id="cfgAbout" style="padding:14px">','sources panel')
allr('Market Navigator · Turn 22','Market Navigator · Turn 23','about build',1)

# Password-manager-safe provider key editor: stored secrets never repopulate into editable fields.
inputs={
'<input id="veniceKey" type="password" autocomplete="new-password" spellcheck="false" autocapitalize="off">':'<div class="secretEdit"><input id="veniceKey" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" data-lpignore="true" data-1p-ignore="true" class="secretInput"><button class="btn secretReplace hidden" type="button" data-replace-key="venice">Replace key</button></div>',
'<input id="openrouterKey" type="password" autocomplete="new-password" spellcheck="false" autocapitalize="off" placeholder="sk-or-…">':'<div class="secretEdit"><input id="openrouterKey" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" data-lpignore="true" data-1p-ignore="true" class="secretInput"><button class="btn secretReplace hidden" type="button" data-replace-key="openrouter">Replace key</button></div>',
'<input id="anthropicKey" type="password" autocomplete="new-password" spellcheck="false" autocapitalize="off" placeholder="sk-ant-…">':'<div class="secretEdit"><input id="anthropicKey" type="text" autocomplete="off" spellcheck="false" autocapitalize="off" data-lpignore="true" data-1p-ignore="true" class="secretInput"><button class="btn secretReplace hidden" type="button" data-replace-key="anthropic">Replace key</button></div>'}
for a,b in inputs.items(): one(a,b,'key input '+a[11:25])

css='''
/* TURN23_RESPONSIVE_SOURCES_CREDENTIALS */
.shell.nowMode .main,.shell.nowMode #view-now,.shell.nowMode .pad.now,.shell.nowMode .chartCard{height:100%!important;min-height:0!important}
.shell.nowMode .pad.now{display:grid!important;grid-template-rows:minmax(0,1fr)!important;align-items:stretch!important;padding-top:0!important;padding-bottom:0!important}
.shell.nowMode .chartCard{align-self:stretch!important;margin-top:0!important;margin-bottom:0!important;border-radius:0 0 10px 10px}
.secretEdit{display:flex;align-items:center;gap:6px;min-width:0}.secretEdit .secretInput{min-width:0;flex:1;-webkit-text-security:disc}.secretReplace{white-space:nowrap}.sourceRegisterGrid{border:1px solid var(--line);border-radius:9px;background:#081522;padding:10px}.sourceListHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:14px 0 5px}.sourceListHead span{font-size:9px;color:var(--muted)}.sourceList{border:1px solid var(--line);border-radius:9px;overflow:hidden}.sourceRow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:9px;border-bottom:1px solid var(--grid)}.sourceRow:last-child{border-bottom:0}.sourceRow strong{display:block}.sourceRow small{display:block;color:var(--muted);margin-top:2px}.sourceState{align-self:center;font-size:9px;font-weight:900}.sourceState.good{color:var(--good)}.sourceState.bad{color:var(--bad)}
@media(max-width:700px){.shell.nowMode .pad.now{padding-left:5px!important;padding-right:5px!important}.sourceRow{grid-template-columns:1fr}.secretEdit{flex-wrap:wrap}.secretReplace{margin-left:auto}}
'''
one('</style></head>',css+'</style></head>','css')

# Enforce source capability before observing/fetching a series.
old="async function seriesAvailability(id,h=S.h,k=S.index||'risk'){try{let src=await getSeries(id),inside=obsRange(src,horizonWindow(h,k)).length"
new="async function seriesAvailability(id,h=S.h,k=S.index||'risk'){try{let supported=cat(id).supported_horizons;if(Array.isArray(supported)&&supported.length&&!supported.includes(h))return{available:false,reason:'unsupported-horizon',count:0};let src=await getSeries(id),inside=obsRange(src,horizonWindow(h,k)).length"
one(old,new,'supported horizons')

# Config runtime grows to four tabs.
old="function setConfigTab(tab){document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings()}"
new="function setConfigTab(tab){document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['sources','cfgSources'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings();if(tab==='sources')renderSourcesConfig()}"
one(old,new,'config tabs runtime')

# Stored keys remain in registry but never materialize into editable DOM fields during render.
one("$(p+'Key').value=q.key||'';","let keyEl=$(p+'Key'),replaceKey=document.querySelector('[data-replace-key=\"'+p+'\"]');keyEl.value='';keyEl.classList.toggle('hidden',!!q.key);if(replaceKey){replaceKey.classList.toggle('hidden',!q.key);replaceKey.textContent='Replace key';replaceKey.dataset.active='false'};",'render secret')

# Helper and source UI are inserted immediately before provider endpoint logic.
anchor='function providerEndpoints(p)'
runtime=r'''function providerKeyForAction(p){let el=$(p+'Key'),btn=document.querySelector('[data-replace-key="'+p+'"]'),replacing=btn?.dataset.active==='true';if(replacing)return el?.value.trim()||'';return providerRec(p).key||el?.value.trim()||''}
function toggleProviderKeyEdit(p){let el=$(p+'Key'),btn=document.querySelector('[data-replace-key="'+p+'"]'),q=providerRec(p);if(!el||!btn)return;if(btn.dataset.active==='true'){el.value='';el.classList.add('hidden');btn.dataset.active='false';btn.textContent='Replace key';return}el.value='';el.classList.remove('hidden');btn.classList.remove('hidden');btn.dataset.active='true';btn.textContent='Cancel';el.focus()}
document.querySelectorAll('[data-replace-key]').forEach(b=>b.onclick=()=>toggleProviderKeyEdit(b.dataset.replaceKey));
const SOURCE_REGISTRY_PATH='data/market-backend/source-registry.json';
function sourceClassName(v){return v==='index'?'Market index':v==='equity'?'Equity':v==='etf'?'ETF':v==='fund_cit'?'Fund / CIT / NAV':v||'—'}
function sourceIssueUrl(q,cls){let title='[Market Navigator Source] '+q,body='Query: '+q+'\nClass: '+cls+'\n';return'https://github.com/acmeproducts/stuff/issues/new?'+new URLSearchParams({title,body}).toString()}
async function renderSourcesConfig(){let status=$('sourceStatus'),list=$('sourceList');if(!status||!list)return;status.textContent='Refreshing canonical source registry…';try{let cb='?cb='+Date.now(),[registry,catalog,healthEnvelope]=await Promise.all([j(SOURCE_REGISTRY_PATH+cb),j('data/market-backend/data-catalog.json'+cb),j('market-evidence/health-envelope.json'+cb)]);S.catalog=catalog;S.catMap=Object.fromEntries((catalog.series||[]).map(x=>[x.id,x]));S.health=healthEnvelope;let regs=registry.registrations||[];list.innerHTML=regs.length?regs.map(r=>{let h=healthEnvelope.series?.[r.id],state=h?.classification||r.status||'pending',good=['current','healthy'].includes(state),providers=(r.providerChain||[]).map(x=>x.provider).join(' → ');return`<div class="sourceRow" data-source-id="${esc(r.id)}"><div><strong>${esc(r.canonicalSymbol||r.query)} · ${esc(r.canonicalName||'')}</strong><small>${esc(sourceClassName(r.instrumentClass))} · ${esc(r.measure||'')} · ${esc(providers||'provider pending')}</small><small>${esc((r.supportedHorizons||[]).join(' · '))}</small></div><span class="sourceState ${good?'good':state==='failed'?'bad':''}">${esc(state)}</span></div>`}).join(''):'<div class="sourceRow"><div><strong>No user-registered sources yet.</strong><small>Submit an instrument above; canonical evidence appears here after collection succeeds.</small></div></div>';status.textContent='Registration resolves identity first; healthy persisted evidence becomes available through Add.'}catch(e){status.textContent='Source registry unavailable: '+e.message;list.innerHTML=''}}
$('sourceRegister').onclick=()=>{let q=$('sourceQuery').value.trim(),cls=$('sourceClass').value,status=$('sourceStatus');if(!q){status.textContent='Enter a ticker or instrument name.';return}if(!cls){status.textContent='Choose the intended instrument class so ambiguous symbols cannot be silently substituted.';return}let u=sourceIssueUrl(q,cls);status.textContent='Opening the governed registration request. Submit it on GitHub, then use Refresh after collection completes.';window.open(u,'_blank','noopener')};$('sourceRefresh').onclick=()=>renderSourcesConfig();
'''
one(anchor,runtime+anchor,'sources/key runtime')

# Provider actions use a stored registered key unless explicit replacement mode is active.
allr("let key=$(p+'Key').value.trim();","let key=providerKeyForAction(p);",'provider key load',1)
one("let key=$(p+'Key').value.trim(),model=p==='anthropic'?$('anthropicModel').value.trim():$(p+'Model').value;","let key=providerKeyForAction(p),model=p==='anthropic'?$('anthropicModel').value.trim():$(p+'Model').value;",'provider key validate')

# Container-driven resize: no rail-specific timer. Analytical state is untouched.
resize=r'''function setupNowResize23(){let wrap=$('nowWrap');if(!wrap||typeof ResizeObserver==='undefined')return;let lastW=0,lastH=0,raf=0;new ResizeObserver(entries=>{let r=entries[0]?.contentRect,w=Math.round(r?.width||0),h=Math.round(r?.height||0);if(!w||!h)return;if(Math.abs(w-lastW)<2&&Math.abs(h-lastH)<2)return;lastW=w;lastH=h;if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{raf=0;if(S.view==='now'&&S.derived){$('nowTip').style.display='none';renderNow()}})}).observe(wrap)}window.addEventListener('load',setupNowResize23,{once:true});'''
one("$('toggle').onclick=()=>$('rail').classList.toggle('closed');","$('toggle').onclick=()=>$('rail').classList.toggle('closed');"+resize,'resize observer')

# Build markers and assertions.
s=s.replace('/* TURN22_OWNER_CORRECTIONS:', '/* TURN23_RESPONSIVE_SOURCES: container ResizeObserver + credential-safe Config + canonical Sources. */\n/* TURN22_OWNER_CORRECTIONS:',1)
assert 'type="password"' not in ''.join(x for x in s.split('<div class="cfgPanel card" id="cfgAi"',1)[1].split('</div><div class="cfgPanel card" id="cfgChart"',1)[:1])
assert 'data-cfgtab="sources"' in s and 'id="cfgSources"' in s
assert 'ResizeObserver' in s and 'sourceIssueUrl' in s
assert 'TURN 23 PRE-SHIP' in s
OUT.write_text(s)
print('TURN23 BUILD PASS',len(s))
