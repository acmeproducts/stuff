from pathlib import Path
p=Path('market-navigator-turn21-governance.py')
s=p.read_text()
old='for exactly that series, including tapping the INDEX chip itself;'
new='for that exact series, including tapping the INDEX chip itself;'
if old not in s:
    raise SystemExit('Turn 21 governance anchor text already fixed or changed')
p.write_text(s.replace(old,new,1))
print('TURN 21 GOVERNANCE ANCHOR FIX: PASS')
