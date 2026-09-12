from pathlib import Path
p=Path('market-navigator-turn22-pre-ship.html')
s=p.read_text()
repls=[
("function renderV1(){S.level=1;S.index=null;S.componentsExpanded=false;S.nowVisible=[];S.nowActive=null;S.nowFocus=null;", "function renderV1(){S.level=1;S.index=null;S.componentsExpanded=false;S.nowVisible=[];"),
("return{lineage:state.lineage,root:state.root,series:state.series,horizon:state.horizon,index:state.index,evidence:state.evidence,chart:{schema:chart.schema,mode:chart.mode,", "return{lineage:state.lineage,root:state.root,active:state.active,series:state.series,horizon:state.horizon,index:state.index,evidence:state.evidence,chart:{schema:chart.schema,active:chart.active,mode:chart.mode,"),
]
for a,b in repls:
    if a not in s: raise SystemExit('missing Turn22 polish marker: '+a[:80])
    s=s.replace(a,b,1)
p.write_text(s)
print('TURN22 POLISH APPLIED')
