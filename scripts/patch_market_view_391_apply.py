from pathlib import Path

p=Path('market-view.html')
s=p.read_text()
if 'parseMarketJSON391' in s:
    print('Market Navigator 3.9.1 full patch already applied')
    raise SystemExit(0)
if "const VERSION='3.9.1'" not in s and "const VERSION='3.9.0'" not in s:
    raise SystemExit('Expected Market Navigator 3.9.x baseline')

src=Path('scripts/patch_market_view_391.py').read_text()
src=src.replace('if "const VERSION=\'3.9.0\'" not in s:\n    raise SystemExit(\'Expected Market Navigator 3.9.0 baseline\')', 'if "const VERSION=\'3.9.1\'" not in s and "const VERSION=\'3.9.0\'" not in s:\n    raise SystemExit(\'Expected Market Navigator 3.9.x baseline\')')
exec(compile(src,'scripts/patch_market_view_391.py','exec'),{'__name__':'__main__'})
