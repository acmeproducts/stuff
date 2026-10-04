#!/usr/bin/env python3
from pathlib import Path
src=Path('market-navigator-turn28-post-ship.html').read_text()
css=Path('market-navigator-turn37-stage4.css').read_text()
parts=[Path('market-navigator-turn37-shadow.js').read_text(),Path('market-navigator-turn37-stage3-controller.js').read_text(),Path('market-navigator-turn37-stage4-picker.js').read_text(),Path('market-navigator-turn37-stage4-adapter.js').read_text()]
assert '</style>' in src
src=src.replace('</style>',css+'</style>',1)
old="else if(which==='analysis'){S.analysisActive=id;if(focus)S.analysisFocus=id;focusId=S.analysisFocus||id}else S.libraryActive=id;"
new="else if(which==='analysis'){if(window.__mn37AnalysisController){window.__mn37AnalysisController.rendererSetActive(id,focus);active=id;focusId=id}else{S.analysisActive=id;if(focus)S.analysisFocus=id;focusId=S.analysisFocus||id}}else S.libraryActive=id;"
assert old in src
src=src.replace(old,new,1)
needle='mnxWireWhenReady();';assert needle in src
src=src.replace(needle,'\n'.join(parts)+'\n'+needle,1)
Path('market-navigator-turn37-stage4.html').write_text(src)
print('built',len(src))
