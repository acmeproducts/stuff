from pathlib import Path
p=Path('market-navigator-turn19-pre-ship.html')
s=p.read_text()
old='.chartChromeRow{height:44px;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) max-content 34px;align-items:center;gap:8px;padding:5px 9px;border-bottom:1px solid #1c3449}'
new='.chartChromeRow{--hz-half:132px;height:44px;min-width:0;width:100%;max-width:100%;overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;gap:8px;padding:5px 9px;border-bottom:1px solid #1c3449}'
if old not in s: raise SystemExit('missing generated chrome rule')
s=s.replace(old,new,1)
old='.chromeCrumb{min-width:0;overflow:hidden;white-space:nowrap;font-size:11px;font-weight:900}.chromeCrumb .crumbBtn{font-size:11px}.chromeCrumbText{display:flex;align-items:center;min-width:0;overflow:hidden;white-space:nowrap}.crumbLeaf{display:inline-block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chromeCenter{justify-self:center;min-width:0}.chromeRight{justify-self:end;display:flex;align-items:center;justify-content:flex-end;width:34px;min-width:34px}'
new='.chromeCrumb{position:absolute;left:9px;max-width:calc(50% - var(--hz-half));min-width:0;overflow:hidden;white-space:nowrap;font-size:11px;font-weight:900}.chromeCrumb .crumbBtn{font-size:11px}.chromeCrumbText{display:flex;align-items:center;min-width:0;overflow:hidden;white-space:nowrap}.crumbLeaf{display:inline-block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.chromeCenter{position:relative;z-index:1;min-width:0;max-width:calc(100% - 84px);overflow:hidden}.chromeRight{position:absolute;right:9px;display:flex;align-items:center;justify-content:flex-end;width:34px;min-width:34px;z-index:2}'
if old not in s: raise SystemExit('missing generated crumb rule')
s=s.replace(old,new,1)
old='@media(max-width:700px){.chartChromeRow{gap:4px;padding-left:6px;padding-right:6px}'
new='@media(max-width:700px){.chartChromeRow{--hz-half:96px;gap:4px;padding-left:6px;padding-right:6px}.chartChromeRow .chromeCrumb{left:6px}.chartChromeRow .chromeRight{right:6px}'
if old not in s: raise SystemExit('missing mobile chrome rule')
s=s.replace(old,new,1)
# Prevent intrinsic grid/flex content from widening the NOW chart beyond its viewport.
anchor='.chartCard{min-height:0;display:grid;grid-template-rows:auto minmax(0,1fr) auto}'
repl='.chartCard{min-height:0;min-width:0;width:100%;max-width:100%;display:grid;grid-template-rows:auto minmax(0,1fr) auto}.now,.pad.now{min-width:0;width:100%;max-width:100%}.pad.now{overflow:hidden}'
if anchor not in s: raise SystemExit('missing chartCard rule')
s=s.replace(anchor,repl,1)
p.write_text(s)
print('TURN 19 CHROME FINALIZE: PASS')
