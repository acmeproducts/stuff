#!/usr/bin/env python3
from pathlib import Path
src=Path('market-navigator-turn37-stage4.html').read_text()
adapter=Path('market-navigator-turn37-stage5-adapter.js').read_text()
needle='mnxWireWhenReady();'
assert needle in src
src=src.replace(needle,adapter+'\n'+needle,1)
Path('market-navigator-turn37-stage5.html').write_text(src)
print('built stage5',len(src))
