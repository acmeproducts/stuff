from pathlib import Path

src=Path('market-navigator-turn20-pre-ship.html').read_text()
s=src
s=s.replace('<title>Market Navigator · Turn 20</title>','<title>Market Navigator · Turn 21</title>',1)
s=s.replace('Market Navigator · Turn 20','Market Navigator · Turn 21')
s=s.replace('TURN 20 PRE-SHIP','TURN 21 PRE-SHIP')
s=s.replace('/* TURN20_OWNER_CORRECTIONS: exact rendered AI snapshot + component breadcrumb lifecycle. */','/* TURN21_OWNER_CORRECTIONS: direction-neutral source indexing + non-duplicating INDEX/COMPONENT hierarchy. */\n/* TURN20_OWNER_CORRECTIONS: exact rendered AI snapshot + component breadcrumb lifecycle. */',1)

old='let src=await getSeries(c.id),a=indexed(src,w,c.direction);'
new='let src=await getSeries(c.id),a=indexed(src,w,1);'
if old not in s: raise SystemExit('missing Turn 20 INDEX source rebasing expression')
s=s.replace(old,new,1)

old="wireLegend19($('legend'),async id=>{if(S.priorV2)S.priorV2.component=id===k?null:id;$('info').classList.add('hidden');$('nowTip').style.display='none';await openAnalysis([id],'NOW',id)},'now')"
new="wireLegend19($('legend'),async id=>{if(id===k){S.nowActive=k;S.nowFocus=k;if(S.priorV2)S.priorV2.component=null;$('info').classList.add('hidden');$('nowTip').style.display='none';await renderV2();return}if(S.priorV2)S.priorV2.component=id;$('info').classList.add('hidden');$('nowTip').style.display='none';await openAnalysis([id],'NOW',id)},'now')"
if old not in s: raise SystemExit('missing Turn 20 INDEX legend drill handler')
s=s.replace(old,new,1)

old="async function openAnalysis(ids,lineage,root){S.analysisRoot=root||ids[0];S.analysisSeries=[...ids];S.analysisActive=S.analysisRoot;S.analysisFocus=S.analysisRoot;S.analysisRepresentation=null;S.lineage=lineage;$('analysisTip').style.display='none';$('analysisModal').classList.remove('hidden');await renderAnalysis()}"
new="async function openAnalysis(ids,lineage,root){let requestedRoot=root||ids[0];if(lineage==='NOW'&&IDX.includes(requestedRoot)&&requestedRoot===S.index){S.level=2;S.nowActive=requestedRoot;S.nowFocus=requestedRoot;if(S.priorV2)S.priorV2.component=null;$('analysisModal').classList.add('hidden');$('analysisTip').style.display='none';await renderV2();return}S.analysisRoot=requestedRoot;S.analysisSeries=[...ids];S.analysisActive=S.analysisRoot;S.analysisFocus=S.analysisRoot;S.analysisRepresentation=null;S.lineage=lineage;$('analysisTip').style.display='none';$('analysisModal').classList.remove('hidden');await renderAnalysis()}"
if old not in s: raise SystemExit('missing Turn 20 openAnalysis function')
s=s.replace(old,new,1)

old="async function openInfoSeries19(id,context){if(context==='analysis'){S.analysisRoot=id;S.analysisSeries=[id];S.analysisActive=id;S.analysisFocus=id;S.analysisRepresentation=null;$('seriesAbout').classList.add('hidden');await renderAnalysis();return}if(S.level===1&&IDX.includes(id)){await openV2(id);return}if(S.priorV2)S.priorV2.component=id===S.index?null:id;$('info').classList.add('hidden');await openAnalysis([id],'NOW',id)}"
new="async function openInfoSeries19(id,context){if(context==='analysis'){if(IDX.includes(id)&&id===S.index){$('seriesAbout').classList.add('hidden');$('analysisModal').classList.add('hidden');S.analysisRepresentation=null;S.analysisFocus=null;S.level=2;S.nowActive=id;S.nowFocus=id;if(S.priorV2)S.priorV2.component=null;await renderV2();return}S.analysisRoot=id;S.analysisSeries=[id];S.analysisActive=id;S.analysisFocus=id;S.analysisRepresentation=null;$('seriesAbout').classList.add('hidden');await renderAnalysis();return}if(S.level===1&&IDX.includes(id)){await openV2(id);return}if(S.level===2&&IDX.includes(id)&&id===S.index){S.nowActive=id;S.nowFocus=id;if(S.priorV2)S.priorV2.component=null;$('info').classList.add('hidden');await renderV2();return}if(S.priorV2)S.priorV2.component=id;$('info').classList.add('hidden');await openAnalysis([id],'NOW',id)}"
if old not in s: raise SystemExit('missing Turn 20 info Open handler')
s=s.replace(old,new,1)

Path('market-navigator-turn21-pre-ship.html').write_text(s)
print('TURN 21 BUILD: PASS')
