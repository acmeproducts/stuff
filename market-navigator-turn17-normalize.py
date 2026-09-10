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
rep("$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowPrint').onclick=", "$('nowAnalyze').onclick=async()=>{$('nowMoreMenu').classList.add('hidden');await startAI(nowAnalysisState())};$('nowData').onclick=()=>{$('nowMoreMenu').classList.add('hidden');openData17(nowAnalysisState())};$('nowPrint').onclick=", 'NOW Data binding')
rep("$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('morePrint').onclick=", "$('moreAI').onclick=()=>{$('moreMenu').classList.add('hidden');startAI()};$('moreData').onclick=()=>{$('moreMenu').classList.add('hidden');openData17(S.analysisChartState)};$('morePrint').onclick=", 'COMPONENT Data binding')
rep("$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('explorePrint').onclick=", "$('exploreAI').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');await startAI(await exploreState())};$('exploreData').onclick=async()=>{if(!S.exploreSelected.length)return;$('exploreMoreMenu').classList.add('hidden');openData17(await exploreState())};$('explorePrint').onclick=", 'EXPLORE Data binding')
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

# The Data surface can be opened from COMPONENT, which itself is a modal.
# Give Data a higher stacking level so its close/control surface cannot be
# intercepted by the analysis modal underneath it.
if '#dataModal{z-index:50}' not in s:
    anchor = '.dataCard{width:min(1180px,calc(100% - 24px));'
    if anchor not in s:
        raise SystemExit('Turn 17 Data z-index anchor missing')
    s = s.replace(anchor, '#dataModal{z-index:50}' + anchor, 1)

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
