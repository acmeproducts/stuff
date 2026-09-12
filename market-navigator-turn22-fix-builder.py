from pathlib import Path
p=Path('market-navigator-turn22-build.py')
s=p.read_text()
repls={
"newcrumb+'function renderAnalysisCrumb(){'":"newcrumb",
"newfooter+'function setAnalysisFooter'":"newfooter",
"\"function wireNowHz(){makeHz($('hzs'),h=>{S.h=h;S.nowRepresentation=null;$('nowTip').style.display='none';wireNowHz();renderNow()})}wireNowHz();function setCanvas\"":"\"function wireNowHz(){makeHz($('hzs'),h=>{S.h=h;S.nowRepresentation=null;$('nowTip').style.display='none';wireNowHz();renderNow()})}wireNowHz();\"",
"newcapture+'function nowAnalysisState'":"newcapture",
"newopen+'async function focusInfo19'":"newopen",
"newfocus+'function wireLegend19'":"newfocus",
"newnow+'function componentCard'":"newnow",
"newdiscovery+'async function renderAnalysis(){'":"newdiscovery",
}
for a,b in repls.items():
    if a not in s: raise SystemExit('missing patch: '+a[:60])
    s=s.replace(a,b,1)
p.write_text(s)
print('BUILDER PATCHED')
