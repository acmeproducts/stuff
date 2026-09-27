#!/usr/bin/env python3
"""Build Turn 28 only from the accepted immutable Turn 26 artifact."""
from pathlib import Path
import hashlib

SRC=Path("market-navigator-turn26-ship.html")
OUT=Path("market-navigator-turn28-pre-ship.html")
EXPECTED_BYTES=231792
EXPECTED_GIT_BLOB="fc61e29d76f1a7ecf1226f74e0884865dca04684"


def git_blob(data):
    return hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest()


def replace_once(text,old,new,label):
    count=text.count(old)
    if count!=1:
        raise SystemExit(f"Turn 28 build blocked: {label} expected once, found {count}")
    return text.replace(old,new,1)


def main():
    raw=SRC.read_bytes()
    if len(raw)!=EXPECTED_BYTES or git_blob(raw)!=EXPECTED_GIT_BLOB:
        raise SystemExit("Turn 28 build blocked: accepted Turn 26 baseline blob/size mismatch")
    s=raw.decode()

    css="""
/* TURN27_PERSISTENT_INDICES_AI_LEVELS_TOP_NAV */
.app{display:grid;grid-template-rows:44px minmax(0,1fr)}
.rail,.rail.closed{grid-row:1;width:100%;height:44px;flex-direction:row;border-right:0;border-bottom:1px solid var(--line);transition:none}
.rail .toggle{display:none}.railHead{flex:none;padding-left:10px}.rail nav,.rail.closed nav{display:flex;padding:3px 6px;gap:4px}.rail .nav{height:36px;width:auto;text-align:center;padding:0 14px}.rail .nav.on{box-shadow:inset 0 -2px var(--accent)}
.rail .foot{margin:0 6px 0 auto;border:0;padding:5px}.shell{grid-row:2;min-height:0}.interpretTabs27{display:flex;gap:2px}.interpretTab27{border:1px solid var(--line);background:var(--panel2);border-radius:6px;padding:4px 6px;font-size:9px;font-weight:800}.interpretTab27.on{border-color:var(--accent);color:var(--accent)}
@media(max-width:760px){.rail,.rail.closed{width:100%}.railHead{display:none}.rail nav,.rail.closed nav{display:flex}.rail .nav{padding:0 9px}.rail .foot span{display:none}.interpretTab27{padding:4px;font-size:8px}}
"""
    css+=".nowContext28{position:absolute;left:50%;top:3px;transform:translateX(-50%);display:flex;align-items:center;gap:8px;white-space:nowrap;font-size:10px;color:var(--muted)}.nowContext28 select{font:inherit}.rail .foot span{display:none}@media(max-width:700px){.nowContext28{font-size:8px;gap:4px}.nowContext28 select{max-width:116px}}\n"
    s=replace_once(s,"</style></head>",css+"</style></head>","Turn 28 CSS")
    s=s.replace('<div class="foot"><button class="gear" id="settingsGear" aria-label="Configuration">⚙</button><span>CONFIG</span></div>','<div class="foot"><button class="gear" id="settingsGear" aria-label="Configuration">⚙</button><span style="display:none">CONFIG</span></div>')



    s=replace_once(s,
        '<div class="field"><label>Default provider</label><select id="defaultProvider">',
        '<div class="field"><label>Interpretation level</label><select id="analysisLevelDefault"><option value="plain">Plain</option><option value="standard">Standard</option><option value="technical">Technical</option></select></div><div class="field"><label>Default provider</label><select id="defaultProvider">',
        "AI interpretation config")
    s=replace_once(s,
        '<div class="grow"></div><button class="btn libQuestionBtn"',
        '<div class="grow"></div><div class="interpretTabs27" id="interpretTabs27" aria-label="Interpretation level"><button class="interpretTab27" data-interpret27="plain">Plain</button><button class="interpretTab27" data-interpret27="standard">Standard</button><button class="interpretTab27" data-interpret27="technical">Technical</button></div><button class="btn libQuestionBtn"',
        "Library interpretation tabs")

    s=s.replace("(x.curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}))","indexDisplayCurve28(x.curve||[])")
    s=s.replace("componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowRepresentation:null,","componentsExpanded:false,hiddenComponents:[],nowComparisons:[],nowRepresentation:null,indexDisplay:'fixed',axisMode:null,")
    s=s.replace("function setNowFooter(w,mode='indexed'){let text=mode==='dual'?'Native Y1 + Y2':mode==='native'?'Native Y1':'Indexed 100';$('nowMeta').innerHTML=\`<span>TURN 25 CONSOLIDATION</span><span class=\"footerSep\">|</span><span>${w.startLabel} → ${w.endLabel}</span><span class=\"footerSep\">|</span><select id=\"nowRepresentation\" aria-label=\"Chart representation\"><option selected value=\"${mode}\">${text}</option></select>\`}","function setNowFooter(w,mode='indexed'){let allowed=S.level===2&&S.index&&S.nowComparisons.length?'dual':'indexed',axis=S.axisMode&&['indexed','dual'].includes(S.axisMode)?S.axisMode:allowed;if(axis==='dual'&&allowed!=='dual')axis='indexed';S.axisMode=axis;let axisOptions=allowed==='dual'?\`<option value=\"indexed\" ${axis==='indexed'?'selected':''}>Base 100</option><option value=\"dual\" ${axis==='dual'?'selected':''}>Y1 + Y2</option>\`:\`<option value=\"indexed\" selected>Base 100</option>\`;$('nowMeta').innerHTML=\`<span>MN-PERSISTENT-1.0.0</span><span class=\"footerSep\">|</span><select id=\"nowRepresentation\" aria-label=\"Chart axis representation\">${axisOptions}</select>\`;$('nowRepresentation').onchange=()=>{S.axisMode=$('nowRepresentation').value;renderNow()};return axis}")

    # Turn 28: restore continuous nearest-series hover inspection and remove
    # the legacy null-state write exposed by comparison-series clicks.
    s=replace_once(s,
        "function inspect(e,allowSelect=false){if(!sel?.a.length)return;let hit=locate(e);if(!hit)return;if(allowSelect&&hit.near.dist<24){",
        "function inspect(e,allowSelect=false){if(!sel?.a.length)return;let hit=locate(e);if(!hit)return;if(!allowSelect&&e.pointerType!=='touch')sel=hit.near.z;if(allowSelect&&hit.near.dist<24){",
        "continuous crosshair hover")
    s=s.replace("S.priorV2.component=sel.id;componentCard(sel.id)", "S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)")

    # Turn 28: a canonical persistent index and horizon-rebased comparisons


    s=replace_once(s,
        "function renderAIConfig(){let r=aiRegistry(),ps=r.providers||{};$('defaultProvider').value=r.defaultProvider||'venice';",
        "function renderAIConfig(){let r=aiRegistry(),ps=r.providers||{};$('analysisLevelDefault').value=r.interpretationLevel||'standard';$('defaultProvider').value=r.defaultProvider||'venice';",
        "render interpretation config")
    s=replace_once(s,
        "$('defaultProvider').onchange=()=>{let r=aiRegistry();r.defaultProvider=$('defaultProvider').value;saveAIRegistry(r);renderAIConfig()};",
        "$('analysisLevelDefault').onchange=()=>{let r=aiRegistry();r.interpretationLevel=$('analysisLevelDefault').value;saveAIRegistry(r);renderAIConfig()};$('defaultProvider').onchange=()=>{let r=aiRegistry();r.defaultProvider=$('defaultProvider').value;saveAIRegistry(r);renderAIConfig()};",
        "persist interpretation config")

    s=replace_once(s,
        "let state=stateOverride||nowAnalysisState(),rootLabel=state.root?displayLabel(state.root):'ENV',\n      a={id:'a-'+Date.now(),title:`${rootLabel} · ${state.horizon}`,titleManual:false,status:'processing',createdAt:now,updatedAt:now,state,provider:p,model:cfg.model||'',turns:[{role:'assistant',content:'Processing…',at:now,processing:true}]};",
        "let state=stateOverride||nowAnalysisState(),level=state.interpretationLevel||reg.interpretationLevel||'standard',rootLabel=state.root?displayLabel(state.root):'ENV';state.interpretationLevel=level;let a={id:'a-'+Date.now(),title:`${rootLabel} · ${state.horizon}`,titleManual:false,status:'processing',createdAt:now,updatedAt:now,state,provider:p,model:cfg.model||'',interpretationLevel:level,activeInterpretation:level,interpretations:{},turns:[{role:'assistant',content:'Processing…',at:now,processing:true}]};",
        "start AI interpretation level")
    s=replace_once(s,
        "let system=`You are Market Navigator, an evidence-first market research analyst.",
        "let system=`You are Market Navigator, an evidence-first market research analyst. Interpretation level: ${level.toUpperCase()}. ${interpretationInstruction27(level)}",
        "interpretation prompt")
    s=replace_once(s,
        "saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:out,at:new Date().toISOString(),contextSources:ctx.bundle});",
        "saved.turns=saved.turns.filter(t=>!t.processing);saved.turns.push({role:'assistant',content:out,at:new Date().toISOString(),contextSources:ctx.bundle,interpretationLevel:level});saved.interpretations={...(saved.interpretations||{}),[level]:out};saved.activeInterpretation=level;",
        "persist interpretation")
    s=replace_once(s,"+a.turns.map(t=>`<div class=\"turn\">","+visibleTurns27(a).map(t=>`<div class=\"turn\">","filtered interpretation rendering")

    js="""
/* TURN27_PERSISTENT_AI_LEVEL_RUNTIME */
function renderNowContext28(w){let h=document.getElementById('modeHeader');if(!h)return;let c=document.getElementById('nowContext28');if(!c){c=document.createElement('div');c.id='nowContext28';c.className='nowContext28';h.appendChild(c)}let d=S.indexDisplay||'fixed';c.innerHTML=`<span id="nowDateRange28">${w.startLabel} → ${w.endLabel}</span><select id="indexDisplay28" aria-label="Index baseline display"><option value="fixed" ${d==='fixed'?'selected':''}>A · Fixed Baseline</option><option value="rebase" ${d==='rebase'?'selected':''}>B · Horizon Rebase</option></select>`;document.getElementById('indexDisplay28').onchange=e=>{S.indexDisplay=e.target.value;renderNow()}}
function indexDisplayCurve28(curve){let a=(curve||[]).map(p=>({t:+p.t,v:+p.v,idx:+p.v,raw:+p.v,sourceT:+p.t}));if((S.indexDisplay||'fixed')==='rebase'&&a.length){let base=a[0].v;if(Number.isFinite(base)&&base!==0)a=a.map(p=>({...p,v:100*p.raw/base,idx:100*p.raw/base}))}return a}

function interpretationInstruction27(level){
 if(level==='plain')return 'Use everyday language, define necessary market terms immediately, and emphasize practical meaning. Preserve every governed fact, limitation, conclusion, and link.';
 if(level==='technical')return 'Expose transforms, index-point arithmetic, basis-point/percentage-point meaning, vintage timing, model mechanics, caveats, and provenance. Preserve the governed conclusions and links.';
 return 'Use normal market and economic terminology with concise mechanisms and clear limitations. Preserve every governed fact, conclusion, and link.'
}
function visibleTurns27(a){let active=a?.activeInterpretation||a?.interpretationLevel||'standard';return(a?.turns||[]).filter(t=>!t.interpretationLevel||t.interpretationLevel===active)}
async function reinterpretAnalysis27(level){
 let a=currentAnalysis();if(!a)return;
 if(a.interpretations&&a.interpretations[level]){a.activeInterpretation=level;a.updatedAt=new Date().toISOString();await persistAnalysis(a);renderLibrary();return}
 let sourceLevel=a.interpretationLevel||Object.keys(a.interpretations||{})[0]||'standard',source=(a.interpretations||{})[sourceLevel]||(a.turns||[]).find(t=>t.role==='assistant'&&!t.processing)?.content||'';
 if(!source)return;
 a.status='processing';a.updatedAt=new Date().toISOString();await persistAnalysis(a);renderLibrary();
 try{
  let st=activeLibraryState26(a),out=await callAI([{role:'system',content:`Transform one governed Market Navigator analysis into the requested interpretation level. ${interpretationInstruction27(level)} Do not research, recalculate, add, remove, or change facts, conclusions, caveats, dates, values, source links, or section coverage. Frozen governed evidence: ${JSON.stringify(aiEvidenceState(st))}`},{role:'user',content:`Rewrite this ${sourceLevel} interpretation as ${level}:\n\n${source}`}],{web:false}),saved=analyses().find(x=>x.id===a.id);if(!saved)return;
  saved.interpretations={...(saved.interpretations||{}),[level]:out};saved.activeInterpretation=level;saved.turns.push({role:'assistant',content:out,at:new Date().toISOString(),interpretationLevel:level});saved.status='ready';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);renderLibrary()
 }catch(e){let saved=analyses().find(x=>x.id===a.id);if(saved){saved.status='ready';saved.updatedAt=new Date().toISOString();await persistAnalysis(saved);renderLibrary()}throw e}
}
document.querySelectorAll('[data-interpret27]').forEach(b=>b.onclick=()=>reinterpretAnalysis27(b.dataset.interpret27));
const renderLibrary26=renderLibrary;renderLibrary=function(){renderLibrary26();let a=currentAnalysis(),active=a?.activeInterpretation||a?.interpretationLevel||'standard';document.querySelectorAll('[data-interpret27]').forEach(b=>{b.classList.toggle('on',b.dataset.interpret27===active);b.disabled=!a})};
window.__mnTurn27={version:'turn27-persistent-1',modelVersion:()=>S.derived?.definitionVersion||'',interpretationLevel:()=>aiRegistry().interpretationLevel||'standard',reinterpret:reinterpretAnalysis27};
window.__mnTurn28={version:'turn28-crosshair-dual-axis-health-1',modelVersion:()=>S.derived?.definitionVersion||''};
"""
    s=replace_once(s,"mnxWireWhenReady();\nboot();",js+"\nmnxWireWhenReady();\nboot();","Turn 28 runtime")
    s=replace_once(s,'<div id="turn26BuildMarker" class="hidden" data-build="2026.09.21.turn26-standalone-analysis-context-print"></div>',
        '<div id="turn26BuildMarker" class="hidden" data-build="2026.09.21.turn26-standalone-analysis-context-print"></div><div id="turn27BuildMarker" class="hidden" data-build="2026.09.23.turn27-persistent-indices-ai-levels-top-nav"></div>',
        "Turn 28 retained markers")
    s=replace_once(s,'<div id="turn27BuildMarker" class="hidden" data-build="2026.09.23.turn27-persistent-indices-ai-levels-top-nav"></div>',
        '<div id="turn27BuildMarker" class="hidden" data-build="2026.09.23.turn27-persistent-indices-ai-levels-top-nav"></div><div id="turn28BuildMarker" class="hidden" data-build="2026.09.23.turn28-crosshair-dual-axis-health"></div>',
        "Turn 28 build marker")
    s=s.replace('Market Navigator · Turn 25 Ship','Market Navigator · Turn 28 Corrective Candidate')
    OUT.write_text(s)
    print(f"built {OUT} bytes={OUT.stat().st_size} baseline={EXPECTED_GIT_BLOB}")


if __name__=="__main__":
    main()
