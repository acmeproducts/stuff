from pathlib import Path

p=Path('market-navigator-turn16-pre-ship.html')
s=p.read_text()
if 'function setConfigTab(tab)' not in s:
    anchor='function validPalette(colors)'
    if anchor not in s:
        raise SystemExit('CONFIG runtime anchor missing')
    runtime="function setConfigTab(tab){document.querySelectorAll('[data-cfgtab]').forEach(b=>b.classList.toggle('on',b.dataset.cfgtab===tab));for(let [k,id] of [['ai','cfgAi'],['chart','cfgChart'],['about','cfgAbout']])$(id).classList.toggle('on',k===tab);if(tab==='chart')renderPaletteSettings()}document.querySelectorAll('[data-cfgtab]').forEach(b=>b.onclick=()=>setConfigTab(b.dataset.cfgtab));"
    s=s.replace(anchor,runtime+anchor,1)
p.write_text(s)
assert s.count('function setConfigTab(tab)')==1
print('TURN 16 CONFIG RUNTIME: PASS')
