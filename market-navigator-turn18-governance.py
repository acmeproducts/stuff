from pathlib import Path

PLAN = Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE = Path('MARKET-NAVIGATOR-GRAVEYARD.md')

p = PLAN.read_text()
p = p.replace('Updated: 2026-09-10\nNext release scope: Turn 17', 'Updated: 2026-09-11\nNext release scope: Turn 18', 1)

section = '''\n### 7.1 Horizon-aware display density\nLong-horizon charts reduce only **rendered display density**. Canonical evidence remains untouched.\n\nDisplay cadence is fixed by horizon:\n- **1D · 5D · MTD** → native observation density;\n- **YTD · 1YR** → weekly display density;\n- **3YR · 5YR** → monthly display density.\n\nThe display reducer must select genuine persisted observations only. It must not average, interpolate, forward-fill, restamp, or fabricate observations. Within each weekly/monthly bucket, the representative real observation is selected to preserve the bucket's visible shape/deviation rather than blindly taking an arbitrary calendar endpoint; the first and last real observations in the active window are also retained.\n\nDisplay-density reduction is presentation-only. It must not alter:\n- canonical series/evidence;\n- chart-window boundaries or baselines;\n- axis truth or mathematical calculations;\n- Data rows, correlation, AI evidence, downloads, or Library snapshots;\n- crosshair/point inspection, which continues to snap against the **full real observation set** for the active series even when fewer points are drawn.\n\nThe same rendering rule applies consistently to ENVIRONMENT, INDEX, COMPONENT, and restored Library charts. No separate long-horizon chart engine is permitted.\n\nQualification must prove native density for 1D/5D/MTD, weekly density for YTD/1YR, monthly density for 3YR/5YR, fewer rendered points than source points for dense long-horizon series, and preservation of full-series inspection/data behavior.\n'''
anchor = '''- no visual carry-forward masquerading as source observations.\n'''
if '### 7.1 Horizon-aware display density' not in p:
    if anchor not in p:
        raise SystemExit('horizon contract anchor missing')
    p = p.replace(anchor, anchor + section, 1)

PLAN.write_text(p)

g = GRAVE.read_text()
grave = '''\n\n## Turn 17 long-horizon overplotting — rejected for Turn 18\nRejected behavior: drawing every high-frequency real observation at YTD/1YR/3YR/5YR simply because the evidence exists. On phone and dense multi-series charts this creates avoidable visual noise and reduces analytical readability.\n\nDo not fix this by mutating/downsampling persisted evidence, monthly averaging, interpolation, forward-fill, synthetic timestamps, or by weakening full-resolution Data/crosshair behavior. Turn 18 uses presentation-only real-observation display reduction: weekly for YTD/1YR and monthly for 3YR/5YR, while 1D/5D/MTD remain native.\n'''
if '## Turn 17 long-horizon overplotting — rejected for Turn 18' not in g:
    g += grave
GRAVE.write_text(g)
print('TURN 18 GOVERNANCE: PASS')
