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
    s=replace_once(s,"</style></head>",css+"</style></head>","Turn 28 CSS")

    s=replace_once(s,
        '<div class="field"><label>Default provider</label><select id="defaultProvider">',
        '<div class="field"><label>Interpretation level</label><select id="analysisLevelDefault"><option value="plain">Plain</option><option value="standard">Standard</option><option value="technical">Technical</option></select></div><div class="field"><label>Default provider</label><select id="defaultProvider">',
        "AI interpretation config")
    s=replace_once(s,
        '<div class="grow"></div><button class="btn libQuestionBtn"',
        '<div class="grow"></div><div class="interpretTabs27" id="interpretTabs27" aria-label="Interpretation level"><button class="interpretTab27" data-interpret27="plain">Plain</button><button class="interpretTab27" data-interpret27="standard">Standard</button><button class="interpretTab27" data-interpret27="technical">Technical</button></div><button class="btn libQuestionBtn"',
        "Library interpretation tabs")

    s=replace_once(s,"j('market-evidence/derived-indices.json'),j('data/market-backend/derived-index-definition.json')",
        "j('market-evidence/derived-indices-persistent-v1.json'),j('data/market-backend/derived-index-definition-persistent-v1.json')",
        "persistent boot evidence")
    s=replace_once(s,
        "renormalizationRule:'Each available component carries weight 1/n where n is the number of components available at the horizon; components excluded by the governed ratio-eligibility rule are omitted and the remaining weights renormalise through the arithmetic mean.',",
        "renormalizationRule:'All seven components carry a fixed 1/7 coefficient. Missing governed state makes the index unavailable; no reduced-set renormalization is permitted.',",
        "fixed coefficient manifest")
    s=replace_once(s,
        "let raw=(b.components||[]).filter(c=>Number.isFinite(+c.orientedIndex)&&Number.isFinite(+c.moveFrom100)&&Number.isFinite(+c.t0Value)&&Number.isFinite(+c.nowValue)&&+c.t0Value!==0),",
        "let raw=(b.components||[]).filter(c=>Number.isFinite(+c.orientedIndex)&&Number.isFinite(+c.moveFrom100)&&Number.isFinite(+c.signalT0)&&Number.isFinite(+c.signalNow)),",
        "persistent attribution filter")
    old="let w=1/n,anchorNow=b.commonNow||'',anchorT0=b.commonT0||'',"
    new="let w=1/7,anchorNow=b.commonNow||'',anchorT0=b.commonT0||'',"
    s=replace_once(s,old,new,"fixed one-seventh weight")
    start="replicatedOriented=raw.map(c=>{let kind=c.transform||(defMap[c.id]&&defMap[c.id].transform)||'ratio';return kind==='signed_level_sd'?100+(+c.direction)*(((+c.nowValue)-(+c.t0Value))/(+c.transformScale)):100+(+c.direction)*((((+c.nowValue)/(+c.t0Value)))-1)*100}),"
    s=replace_once(s,start,"replicatedOriented=raw.map(c=>100+((+c.signalNow)-(+c.signalT0))),","persistent replication")
    s=replace_once(s,
        "recomputedIndex=replicatedOriented.reduce((a,x)=>a+x,0)/n,",
        "recomputedIndex=(Number.isFinite(+b.baseline)?+b.baseline:100)+replicatedOriented.reduce((a,x)=>a+(x-100),0)/7,",
        "persistent absolute index replication")
    s=s.replace("weightRule:`1/${n} equal weight over components available at this horizon`","weightRule:'fixed 1/7 coefficient; no reduced-set renormalization'")
    s=s.replace("let cover=r.coverageStatus==='COMPLETE'?'':` ${r.componentsDefined-r.componentsUsed} of ${r.componentsDefined} defined components are excluded by the governed ratio-eligibility rule and are not estimated.`;","let cover=r.coverageStatus==='COMPLETE'?'':` The canonical index is unavailable unless all ${r.componentsDefined} governed component states exist.`;")
    s=s.replace("dir=r.indexMovementPercent>0.005?`rose ${mnxNum(Math.abs(r.indexMovementPercent))}%`:r.indexMovementPercent<-0.005?`fell ${mnxNum(Math.abs(r.indexMovementPercent))}%`:'was essentially unchanged',","dir=r.indexMovementPercent>0.005?`rose ${mnxNum(Math.abs(r.indexMovementPercent))} index points`:r.indexMovementPercent<-0.005?`fell ${mnxNum(Math.abs(r.indexMovementPercent))} index points`:'was essentially unchanged',")
    s=s.replace("**Index movement: ${mnxPct(r.indexMovementPercent)}**","**Index movement: ${mnxSigned(r.indexMovementPercent,3,' index points')}**")
    s=s.replace("· ${mnxPct(c.rawMovementPercent)} | ${mnxPp(c.indexContributionPercentPoints)} |","· standardized move ${mnxSigned(c.orientedMovementPercent,4,'')} | ${mnxSigned(c.indexContributionPercentPoints,4,' points')} |")
    s=s.replace("**${mnxPp(r.reconciliation.summedContribution)}**","**${mnxSigned(r.reconciliation.summedContribution,4,' points')}**")
    s=s.replace("Equal weighting and 1/n renormalisation are read from the governed definition, never assumed.","Fixed 1/7 coefficients and the no-renormalization rule are read from the governed definition, never assumed.")
    s=s.replace("/* Leave-one-component-out under the governed renormalisation rule (arithmetic mean of remaining available components) */","/* Diagnostic leave-one-component-out: preserve fixed 1/7 coefficients; never promote this counterfactual to the governed index. */")
    s=s.replace("specification:`omit ${x.displayName} (governed renormalisation)`","specification:`omit ${x.displayName} (diagnostic fixed-coefficient counterfactual)`")
    s=s.replace("['Components available','How many defined model components can participate truthfully at the selected horizon.','Missing components reduce coverage. Governed fallback renormalizes remaining eligible components; Health remains WATCH/DEGRADED as appropriate.'],","['Components available','How many defined model components can participate truthfully at the selected horizon.','All seven governed states are required. A missing state makes the canonical index unavailable; weights are never silently renormalized.'],")
    s=s.replace("['Leave-one-out impact','How much the index changes when one component is removed and the remaining governed weights are renormalized.','Large impact means the result depends heavily on that component.'],","['Leave-one-out impact','A diagnostic counterfactual that removes one contribution while preserving the fixed coefficients.','Large impact means the result depends heavily on that component; this is not a governed alternate index.'],")
    s=s.replace("'Remaining eligible components are renormalized to 100%. Current lifecycle: '","'No reduced-set index is calculated. Current lifecycle: '")
    s=s.replace("participates=c.transform==='signed_level_sd'?'Zero-crossing safe: additive change standardized by canonical historical level SD; remains eligible across inversion/uninversion.':(c.ratioEligible?'Ratio-rebased when horizon evidence is available.':'Currently structurally excluded: '+(c.ratioIneligibleReason||'ratio transform unavailable')+'. Remaining eligible weights renormalize automatically; model coverage falls.');", "participates='Governed native-value change divided by the frozen model-version scale; fixed 1/7 coefficient and no reduced-set renormalization.';")
    s=s.replace("let rest=oriented.filter((_,j)=>j!==i),v=rest.reduce((a,x)=>a+x,0)/rest.length,move=v-r.baselineIndexValue;", "let v=r.endIndexValue-c.indexContributionPercentPoints,move=v-r.baselineIndexValue;")
    s=s.replace("<td>${mnxPct(c.rawMovementPercent)}</td><td>${mnxPp(c.indexContributionPercentPoints)}</td>", "<td>${mnxNum(c.baselineValue,4)} → ${mnxNum(c.endValue,4)} · signal ${mnxSigned(c.orientedMovementPercent,4,'')}</td><td>${mnxSigned(c.indexContributionPercentPoints,4,' points')}</td>")
    s=s.replace("Σ contributions ${m.reconciliation?mnxPp(m.reconciliation.summedContribution):'—'} vs governed index movement ${m.reconciliation?mnxPp(m.reconciliation.indexMovement):'—'} · residual ${m.reconciliation?mnxPp(m.reconciliation.residual,6):'—'}", "Σ contributions ${m.reconciliation?mnxSigned(m.reconciliation.summedContribution,4,' points'):'—'} vs governed index movement ${m.reconciliation?mnxSigned(m.reconciliation.indexMovement,4,' points'):'—'} · residual ${m.reconciliation?mnxSigned(m.reconciliation.residual,6,' points'):'—'}")
    s=s.replace("<td>${mnxPct(s.recomputedMovementPercent)}</td>", "<td>${mnxSigned(s.recomputedMovementPercent,4,' points')}</td>")
    s=s.replace("against tolerance ±${r.reconciliation.tolerance} pp", "against tolerance ±${r.reconciliation.tolerance} index points")
    s=s.replace("v=oriented.reduce((a,x,j)=>a+x*ws[j],0)/den,move=v-r.baselineIndexValue;", "v=r.baselineIndexValue+oriented.reduce((a,x,j)=>a+(x-100)*ws[j],0)/den,move=v-r.baselineIndexValue;")

    # Turn 28: restore continuous nearest-series hover inspection and remove
    # the legacy null-state write exposed by comparison-series clicks.
    s=replace_once(s,
        "function inspect(e,allowSelect=false){if(!sel?.a.length)return;let hit=locate(e);if(!hit)return;if(allowSelect&&hit.near.dist<24){",
        "function inspect(e,allowSelect=false){if(!sel?.a.length)return;let hit=locate(e);if(!hit)return;if(!allowSelect&&e.pointerType!=='touch')sel=hit.near.z;if(allowSelect&&hit.near.dist<24){",
        "continuous crosshair hover")
    s=s.replace("S.priorV2.component=sel.id;componentCard(sel.id)", "S.priorV2={...(S.priorV2||{}),component:sel.id};componentCard(sel.id)")

    # Turn 28: a canonical persistent index and horizon-rebased comparisons
    # use independent axes. This preserves the canonical index value while
    # preventing a volatile comparison from visually flattening the index.
    s=s.replace("let text=mode==='dual'?'Native Y1 + Y2':mode==='native'?'Native Y1':'Indexed 100';", "let text=mode==='dual'?'Persistent Index Y1 + Indexed 100 Y2':mode==='native'?'Native Y1':'Indexed 100';")
    s=replace_once(s,
        "setNowFooter(w,'indexed');captureNowState(sets,w,'indexed');S.nowPaint25={sets,w,mode:'indexed'};draw('now',sets,w,'indexed')}function componentCard",
        "let chartMode=sets.length>1?'dual':'indexed';sets.forEach(z=>{z.axis=z.id===k?0:1;z.axisLabel=z.id===k?'Persistent Index':'Indexed 100'});setNowFooter(w,chartMode);captureNowState(sets,w,chartMode);S.nowPaint25={sets,w,mode:chartMode};draw('now',sets,w,chartMode)}function componentCard",
        "persistent comparison dual axes")

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
