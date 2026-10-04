#!/usr/bin/env python3
from pathlib import Path
src=Path('market-navigator-turn28-post-ship.html').read_text()
mod=Path('market-navigator-turn37-shadow.js').read_text()
needle='mnxWireWhenReady();'
assert needle in src
out=src.replace(needle,mod+'\n'+needle,1)
Path('market-navigator-turn37-stage2.html').write_text(out)
print('built',len(out))
