from pathlib import Path
p=Path('market-navigator-turn32-pre-ship.html');s=p.read_text();old='if(frozen)surfaceRestore32(frozen);await renderV2()';new="if(frozen)surfaceRestore32(frozen);if(S.index&&IDX.includes(S.index))await renderV2();else render()"
if s.count(old)!=1: raise SystemExit('close restore anchor missing')
s=s.replace(old,new,1);p.write_text(s);print('PASS root-safe Analyze restore installed')
