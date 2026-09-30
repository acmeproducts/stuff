from pathlib import Path
p=Path('market-navigator-turn32-pre-ship.html')
s=p.read_text()
needle='function analysisWindow26('
hook="window.__mn32={state:()=>S,open:openStandaloneAnalysis26,close:closeStandaloneAnalysis26,render:renderV2,family:measurementFamily,indices:()=>IDX,catalog:()=>S.catalog};\n"
if s.count(needle)!=1: raise SystemExit('analysisWindow26 hook anchor missing')
s=s.replace(needle,hook+needle,1)
p.write_text(s)
print('PASS qualification observability hook installed')
