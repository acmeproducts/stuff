#!/usr/bin/env python3
from pathlib import Path

src=Path('market-navigator-turn37-stage5.html').read_text()
picker=Path('market-navigator-turn37-stage6-picker.js').read_text()
unified=Path('market-navigator-turn37-stage6-unified.js').read_text()

def cut(a,b,label):
    global src
    i=src.find(a); j=src.find(b,i)
    if i<0 or j<0: raise SystemExit(f'missing {label}')
    src=src[:i]+src[j:]

def replace_range(a,b,repl,label):
    global src
    i=src.find(a); j=src.find(b,i)
    if i<0 or j<0: raise SystemExit(f'missing {label}')
    src=src[:i]+repl+src[j:]

# Remove superseded shadow helpers that depended on legacy NOW functions.
replace_range(
    '/* Consumer adapters are outside the controller and are allowed to translate accepted application state. */',
    '/* TURN37_STAGE2_SHADOW_END */',
    "window.__mn37Shadow={resolve:spec=>MNChartController37.resolve(spec)};\n",
    'legacy shadow adapter'
)

# Keep the shared Stage 4 picker state machine, remove its attach monkeypatch and NOW adapter.
replace_range('/* TURN37_STAGE4_SHARED_BATCH_PICKER */','/* TURN37_STAGE4_NOW_BATCH_ADAPTER */',picker+'\n','stage4 picker wrapper')
cut('/* TURN37_STAGE4_NOW_BATCH_ADAPTER */','/* TURN37_STAGE5_NOW_CUTOVER */','stage4 NOW adapter')
cut('/* TURN37_STAGE5_NOW_CUTOVER */','mnxWireWhenReady();','stage5 legacy bridge')

# Remove the deprecated baseline chart implementations. The Stage 6 controller is injected before boot().
cut('function wireNowHz(){','function setCanvas','legacy wireNowHz')
cut('function setNowFooter(','function renderCrumb','legacy footer')
cut('function legend(sets){','function evidenceFor','legacy legend/renderNow')
cut('function renderV1(){','function healthEntryUrl26','legacy NOW render/data path')
cut('function componentCard(id){',"$('nowMoreBtn').onclick=",'legacy NOW picker path')
cut('function standaloneAnalysisState26(){','function analysisMarkdown26(){','legacy Analyze render/data path')
cut("$('analysisClose26').onclick=closeStandaloneAnalysis26;",'/* TURN27_PERSISTENT_AI_LEVEL_RUNTIME */','legacy Analyze wiring')

# Shared draw remains the canonical painter. Route inspection state back through the one controller.
old_now="if(which==='now'){S.nowActive=id;if(focus)S.nowFocus=id;focusId=S.nowFocus}else if(which==='analysis')"
new_now="if(which==='now'){if(window.__mn37NowController){window.__mn37NowController.rendererSetActive(id,focus);active=id;focusId=id}else{S.nowActive=id;if(focus)S.nowFocus=id;focusId=S.nowFocus}}else if(which==='analysis')"
if old_now not in src: raise SystemExit('NOW draw state hook missing')
src=src.replace(old_now,new_now,1)
src=src.replace('componentCard(sel.id)','showNowSeriesInfo25(sel.id)')

needle='mnxWireWhenReady();'
if needle not in src: raise SystemExit('runtime insertion point missing')
src=src.replace(needle,unified+'\n'+needle,1)

# Mechanical retirement gate.
for bad in [
    'function renderV1(){','async function renderV2(){','async function sourceSet25(',
    'function visibleIds25(){','visibleIds25()','function removeNowSeries25(',
    'function wireNowHz(){','function setNowFooter(','function legend(sets){',
    'function standaloneAnalysisState26(){','async function sourceSetStandalone26(',
    'function renderAnalysisHz26(){','async function renderStandaloneAnalysis26(){',
    'async function openAnalysisPicker26(){','async function renderAnalysisPicker26(){',
    'function componentCard(id){','/* TURN37_STAGE5_NOW_CUTOVER */',
    '/* TURN37_STAGE4_NOW_BATCH_ADAPTER */'
]:
    if bad in src: raise SystemExit('deprecated path remains: '+bad)

Path('market-navigator-turn37-stage6.html').write_text(src)
print('built stage6',len(src))
