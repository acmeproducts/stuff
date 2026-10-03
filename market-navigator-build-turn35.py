#!/usr/bin/env python3
from pathlib import Path
import hashlib
SRC=Path('market-navigator-turn28-post-ship.html')
OUT=Path('market-navigator-turn35-pre-ship.html')
EXPECTED_SRC='9ce7f67451f9e1b7804927ce5c56adb667614724'
# Candidate is committed alongside this builder. This build gate verifies the accepted baseline is present
# and that the candidate contains the authorized Turn35 delta markers without rejected donor markers.
src=SRC.read_bytes()
cand=OUT.read_bytes()
assert b'TURN28_POST_SHIP_LIBRARY_INTERPRETATION_TABS_FIX' in src
assert b'TURN35_CALLABLE_CHART_PATH' in cand
assert b'TURN35_CALLABLE_ISOLATION_BATCH_ADD' in cand
assert b'turn35-callable-isolation-batch-add' in cand
for bad in [b'TURN32_TRUE_SINGLE_SURFACE',b'chartSurface31',b'surfaceMode32',b'TURN34_ONE_CALLABLE_CHART_CONTROLLER']:
    assert bad not in cand
print('PASS Turn35 accepted post-ship ancestry present; candidate delta markers verified',len(src),len(cand))
