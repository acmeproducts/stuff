from pathlib import Path

src=Path('market-navigator-turn19-pre-ship.html').read_text()
s=src
s=s.replace('<title>Market Navigator · Turn 19</title>','<title>Market Navigator · Turn 20</title>',1)
s=s.replace('Market Navigator · Turn 19','Market Navigator · Turn 20')
s=s.replace('TURN 19 PRE-SHIP','TURN 20 PRE-SHIP')
s=s.replace('/* TURN19_DISPLAY_DENSITY:','/* TURN20_OWNER_CORRECTIONS: exact rendered AI snapshot + component breadcrumb lifecycle. */\n/* TURN19_DISPLAY_DENSITY:',1)

old="let root=displayLabel(S.analysisRoot||S.analysisSeries[0]||'COMPONENT'),extra=Math.max(0,S.analysisSeries.length-1),suffix=extra?` + ${extra} ${pluralComponents(extra)}`:'',leaf=root+suffix"
new="let raw=S.analysisSeries.filter(id=>!IDX.includes(id)),crumbRoot=raw.includes(S.analysisRoot)?S.analysisRoot:(raw[0]||S.analysisRoot||S.analysisSeries[0]||'COMPONENT'),crumbCount=raw.length?raw.length:(S.analysisSeries.length?1:0),root=displayLabel(crumbRoot),extra=Math.max(0,crumbCount-1),suffix=extra?` + ${extra} ${pluralComponents(extra)}`:'',leaf=root+suffix"
if old not in s: raise SystemExit('missing Turn 19 analysis breadcrumb expression')
s=s.replace(old,new,1)

old_add="let id=b.dataset.add;S.analysisSeries.push(id);S.analysisActive=id;$('seriesPicker').classList.add('hidden');$('seriesAbout').classList.add('hidden');renderAnalysis()"
new_add="let id=b.dataset.add,hadRaw=S.analysisSeries.some(v=>!IDX.includes(v));S.analysisSeries.push(id);if(IDX.includes(S.analysisRoot)&&!hadRaw)S.analysisRoot=id;S.analysisActive=id;$('seriesPicker').classList.add('hidden');$('seriesAbout').classList.add('hidden');renderAnalysis()"
if old_add not in s: raise SystemExit('missing Turn 19 add-series handler')
s=s.replace(old_add,new_add,1)

old_state="async function analysisState(){let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(evidenceFor)};state.chart=await chartSnapshotFrom(state,'frozen');return state}"
new_state="async function analysisState(){let live=S.analysisChartState,same=live&&live.horizon===S.h&&live.index===S.index&&live.root===S.analysisRoot&&Array.isArray(live.series)&&live.series.length===S.analysisSeries.length&&live.series.every((id,i)=>id===S.analysisSeries[i]);if(same)return JSON.parse(JSON.stringify(live));let state={lineage:S.lineage,root:S.analysisRoot,active:S.analysisActive,series:[...S.analysisSeries],horizon:S.h,index:S.index,evidence:S.analysisSeries.map(evidenceFor)};state.chart=await chartSnapshotFrom(state,'frozen');return state}"
if old_state not in s: raise SystemExit('missing Turn 19 analysisState')
s=s.replace(old_state,new_state,1)

Path('market-navigator-turn20-pre-ship.html').write_text(s)
print('TURN 20 BUILD: PASS')
