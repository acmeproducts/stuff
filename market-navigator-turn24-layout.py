#!/usr/bin/env python3
from pathlib import Path
p=Path('market-navigator-turn24-pre-ship.html')
s=p.read_text()
anchor='</style></head>'
if s.count(anchor)!=1: raise SystemExit('style anchor mismatch')
css='''
/* TURN24_PINNED_NOW_GEOMETRY */
.shell.nowMode #view-now>.pad.now{position:absolute!important;inset:0!important;width:auto!important;height:auto!important;min-height:0!important;padding:0!important;display:block!important}
.shell.nowMode #view-now>.pad.now>.chartCard{position:absolute!important;inset:0 8px!important;width:auto!important;height:auto!important;min-height:0!important;margin:0!important;align-self:auto!important}
@media(max-width:700px){.shell.nowMode #view-now>.pad.now>.chartCard{inset:0 5px!important}}
'''
s=s.replace(anchor,css+anchor,1)
old="nav('config');setConfigTab(tab)}"
new="nav('config');renderAIConfig();setConfigTab(tab)}"
if s.count(old)!=1: raise SystemExit(f'openConfig refresh anchor mismatch: {s.count(old)}')
s=s.replace(old,new,1)
if "nav('config');renderAIConfig();setConfigTab(tab)}" not in s: raise SystemExit('Config refresh contract missing')
p.write_text(s)
print('TURN24 PINNED GEOMETRY + CONFIG REFRESH PASS')
