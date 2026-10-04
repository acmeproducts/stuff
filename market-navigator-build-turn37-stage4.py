#!/usr/bin/env python3
from pathlib import Path
src=Path('market-navigator-turn37-stage3-analyze.html').read_text()
css=Path('market-navigator-turn37-stage4.css').read_text()
picker=Path('market-navigator-turn37-stage4-picker.js').read_text()
adapter=Path('market-navigator-turn37-stage4-adapter.js').read_text()
assert 'TURN37_STAGE3_ANALYZE_BEGIN' in src
assert '</style>' in src
src=src.replace('</style>',css+'\n</style>',1)
needle='/* TURN37_STAGE3_ANALYZE_END */'
assert needle in src
src=src.replace(needle,needle+'\n'+picker+'\n'+adapter,1)
Path('market-navigator-turn37-stage4.html').write_text(src)
print('built stage4',len(src))
