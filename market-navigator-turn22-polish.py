from pathlib import Path
p=Path('market-navigator-turn22-pre-ship.html')
s=p.read_text()
marker='/* TURN22_TTS_FIT */'
if marker not in s:
    css='''\n/* TURN22_TTS_FIT */\n.libListenBar{width:100%!important;max-width:100%!important;min-width:0!important;overflow:hidden!important;padding-left:24px!important;padding-right:24px!important;grid-template-columns:repeat(5,minmax(0,40px))!important;justify-content:center!important;justify-items:center!important}.libListenControl{min-width:0!important;max-width:40px!important}@media(max-width:700px){.libListenBar{padding-left:18px!important;padding-right:18px!important;grid-template-columns:repeat(5,minmax(0,32px))!important;column-gap:4px!important}.libListenControl{width:32px!important;max-width:32px!important;height:34px!important}}\n'''
    if '</style>' not in s: raise SystemExit('style close missing')
    s=s.replace('</style>',css+'</style>',1)
for bad in ['id="analysisModal"','function renderAnalysis(','function openAnalysis(']:
    if bad in s: raise SystemExit('retired component residue: '+bad)
p.write_text(s)
print('TURN22 LISTEN FIT APPLIED',len(s))
