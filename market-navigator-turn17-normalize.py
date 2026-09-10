from pathlib import Path

builder = Path('market-navigator-build-turn17.py')
s = builder.read_text()

old = "    'Correlation', 'Native', 'Index 100', 'data-emphasis',\n"
new = "    'Correlation', 'Native', 'Index 100', 'dataset.emphasis',\n"
if old in s:
    s = s.replace(old, new, 1)
elif new not in s:
    raise SystemExit('Turn 17 self-check correction anchor missing')

old_bind = """# Presentation-only Data bindings. Existing AI/Print/download behavior is left intact.
end = s.rfind('</script>')
if end < 0:
    raise SystemExit('main script closing tag missing')
bindings = r'''$('dataClose').onclick=()=>$('dataModal').classList.add('hidden');$('nowData').onclick=()=>{$('nowMoreMenu').classList.add('hidden');openData17(nowAnalysisState())};$('moreData').onclick=()=>{$('moreMenu').classList.add('hidden');openData17(S.analysisChartState)};$('exploreData').onclick=async()=>{$('exploreMoreMenu').classList.add('hidden');openData17(await exploreState())};'''
s = s[:end] + bindings + s[end:]
"""
new_bind = r'''# Presentation-only Data bindings live in the same app-IIFE scope as the existing menus.
rep("$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowPrint').onclick=", "$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowData').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await openData17(nowAnalysisState())};$('nowPrint').onclick=", 'NOW Data binding')
rep("$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('morePrint').onclick=", "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreData').onclick=async()=>{$('moreMenu').classList.add('hidden');await openData17(S.analysisChartState)};$('morePrint').onclick=", 'COMPONENT Data binding')
rep("$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('explorePrint').onclick=", "$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('exploreData').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await openData17(await exploreState())};$('explorePrint').onclick=", 'EXPLORE Data binding')
rep("$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');", "$('statsClose').onclick=()=>$('statsPanel').classList.add('hidden');$('dataClose').onclick=()=>$('dataModal').classList.add('hidden');", 'Data close binding')
'''
if old_bind in s:
    s = s.replace(old_bind, new_bind, 1)
elif 'NOW Data binding' not in s:
    raise SystemExit('Turn 17 Data binding source anchor missing')

old_active = "else S.libraryActive=id}function syncActive()"
new_active = "else S.libraryActive=id;if(focus&&which==='now'&&S.nowChartState){S.nowChartState.active=id;if(S.nowChartState.chart)S.nowChartState.chart.active=id}if(focus&&which==='analysis'&&S.analysisChartState){S.analysisChartState.active=id;if(S.analysisChartState.chart)S.analysisChartState.chart.active=id}}function syncActive()"
if old_active in s:
    s = s.replace(old_active, new_active, 1)
elif new_active not in s:
    raise SystemExit('Turn 17 exact-active-state anchor missing')

if '#dataModal{z-index:50}' not in s:
    anchor = '.dataCard{width:min(1180px,calc(100% - 24px));'
    if anchor not in s:
        raise SystemExit('Turn 17 Data z-index anchor missing')
    s = s.replace(anchor, '#dataModal{z-index:50}' + anchor, 1)

# Replace the first-pass visible-window Data renderer with the governed
# full-series renderer. Raw series expand to their complete canonical evidence
# history; derived indices retain all derived observations available in the
# active chart context. Indexed values reuse the active chart baseline and infer
# any directional inversion from the exact plotted snapshot.
start = s.find('function openData17(state){')
if start < 0:
    raise SystemExit('Turn 17 openData17 start missing')
end = s.find("'''", start)
if end < 0:
    raise SystemExit('Turn 17 openData17 runtime terminator missing')
full_data = r"""async function dataSeries17(z,state){let chart=state.chart||{},w=chart.window||{},plotted=z.points||[];if(IDX.includes(z.id))return{...z,points:plotted.map(p=>({t:+p.t,sourceT:+(p.sourceT||p.t),v:+p.v,raw:Number.isFinite(+p.raw)?+p.raw:+p.v,idx:Number.isFinite(+p.idx)?+p.idx:+p.v}))};let src=await getSeries(z.id),obs=(src.observations||[]).filter(p=>Number.isFinite(+p.t)&&Number.isFinite(+p.v)).map(p=>({t:+p.t,sourceT:+p.t,v:+p.v,raw:+p.v})),before=obs.filter(p=>p.t<=+w.start),base=before.at(-1)||obs[0]||null,dir=1;if(base&&Number.isFinite(+base.v)&&+base.v!==0){let probe=plotted.find(p=>Number.isFinite(+p.idx)&&Number.isFinite(+p.raw)&&Math.abs((+p.raw/+base.v)-1)>1e-9);if(probe){let d=((+probe.idx-100)/100)/((+probe.raw/+base.v)-1);if(Number.isFinite(d)&&Math.abs(d)>.5)dir=d<0?-1:1}}return{...z,points:obs.map(p=>({...p,idx:base&&Number.isFinite(+base.v)&&+base.v!==0?100+dir*((p.v/+base.v)-1)*100:null}))}}async function openData17(state){if(!state?.chart)throw Error('Visible chart data is not ready');let chart=state.chart,source=chart.series||[],activeId=state.active||chart.active||source[0]?.id,series=await Promise.all(source.map(z=>dataSeries17(z,state))),ref=series.find(z=>z.id===activeId)||series[0],corr=Object.fromEntries(series.map(z=>[z.id,corr17(z,ref)]));$('dataTitle').textContent=`Data · ${ref?.label||ref?.id||'Series'}`;$('dataMeta').textContent=`${state.horizon||chart.horizon||''} · full canonical series history · Index 100 uses active chart baseline · correlation vs ${ref?.label||ref?.id||'active series'} using same-date real values`;$('dataRows').innerHTML=series.flatMap(z=>(z.points||[]).map(p=>{let native=Number.isFinite(+p.raw)?+p.raw:(Number.isFinite(+p.v)?+p.v:null),idx=Number.isFinite(+p.idx)?+p.idx:null,r=corr[z.id];return`<tr data-series="${esc(z.id)}" data-active="${z.id===ref?.id?'true':'false'}"><td>${esc(z.label||z.id)}</td><td>${esc(dayKey17(p.sourceT||p.t))}</td><td>${native==null?'—':esc(fmt(native))}${z.unit?` ${esc(z.unit)}`:''}</td><td>${idx==null?'—':esc(fmt(idx))}</td><td>${Number.isFinite(r)?r.toFixed(3):'N/A'}</td></tr>`})).join('');$('dataModal').classList.remove('hidden')}"""
s = s[:start] + full_data + s[end:]

builder.write_text(s)

qa = Path('market-navigator-turn17-qa.mjs')
t = qa.read_text()
oldq = "    p.schema='market-navigator-series-style-v2';\n    p.widths=Array(10).fill(7);"
newq = "    p.schema='market-navigator-series-style-v2';\n    p.colors=p.colors||['#27D3F5','#FFD166','#48D597','#FF5A6F','#A78BFA','#FF9F1C','#4C78FF','#FF6EC7','#B8E43C','#AEB8C4'];\n    p.assignments=p.assignments||{risk:0,growth:1,macro:2};\n    p.widths=Array(10).fill(7);"
if oldq in t:
    t = t.replace(oldq, newq, 1)
elif newq not in t:
    raise SystemExit('Turn 17 QA style fixture anchor missing')
qa.write_text(t)

print('TURN 17 NORMALIZE: PASS')
