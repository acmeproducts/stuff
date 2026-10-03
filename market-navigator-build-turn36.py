#!/usr/bin/env python3
from pathlib import Path
src=Path('market-navigator-turn28-post-ship.html').read_text();cand=Path('market-navigator-turn36-pre-ship.html').read_text()
assert 'TURN28_POST_SHIP_LIBRARY_INTERPRETATION_TABS_FIX' in src
assert 'TURN36_REAL_CALLABLE_COMPONENT' in cand
assert 'class Instance' in cand and 'window.MNChart=MNChart' in cand
for bad in ['const MNChart35=','TURN35_CALLABLE_CHART_PATH','chartSurface31','surfaceMode32','TURN32_TRUE_SINGLE_SURFACE']: assert bad not in cand
print('PASS Turn36 real MNChart source architecture')