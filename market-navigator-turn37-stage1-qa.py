#!/usr/bin/env python3
from pathlib import Path
import json,re
html=Path('market-navigator-turn28-post-ship.html').read_text()
m=json.loads(Path('market-navigator-turn37-stage1-dependency-map.json').read_text())
assert m['baseline']['blob']=='9ce7f67451f9e1b7804927ce5c56adb667614724'
required_funcs=['renderV1','openV2','renderV2','sourceSet25','componentIds25','visibleIds25','removeNowSeries25','setNowFooter','wireNowHz','indexDisplayCurve28','axisPlan','draw','captureNowState','chartSnapshotFromSets','openNowPicker25','renderNowPicker25','openStandaloneAnalysis26','closeStandaloneAnalysis26','analysisWindow26','sourceSetStandalone26','renderAnalysisHz26','renderStandaloneAnalysis26','openAnalysisPicker26','renderAnalysisPicker26','nav']
required_dom=['nowCrumb','hzs','legend','nowWrap','nowChart','nowTip','nowMeta','nowPicker','nowPickerSearch','nowPickerCats','nowPickerList','nowMoreBtn','nowMoreMenu','standaloneAnalysis26','standaloneAnalysisTitle26','analysisHz','seriesBar','analysisWrap','analysisChart','analysisTip','analysisMeta26','analysisPicker26','analysisPickerSearch26','analysisPickerList26','analysisMore26','analysisMenu26']
for n in required_funcs:
    assert n in m['functions'],f'unmapped function {n}'
    assert m['functions'][n].get('futureOwner'),f'no future owner {n}'
    assert re.search(r'(?:async\s+)?function\s+'+re.escape(n)+r'\s*\(',html),f'baseline function missing {n}'
for d in required_dom:
    assert d in m['domRoles'],f'unmapped DOM role {d}'
    assert d in html,f'baseline DOM id/reference missing {d}'
for k,v in m['stateFields'].items():
    assert v and k.startswith('S.'),f'bad state map {k}'
assert 'accepted NOW markup' in m['seam']['presentationFrozen']
assert 'accepted NOW CSS' in m['seam']['presentationFrozen']
print('PASS Turn37 Stage1 dependency/seam map',len(required_funcs),'functions',len(required_dom),'DOM roles',len(m['stateFields']),'state fields')
