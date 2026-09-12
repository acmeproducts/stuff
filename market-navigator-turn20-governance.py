from pathlib import Path

plan=Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
s=plan.read_text()
s=s.replace('Updated: 2026-09-11\nNext release scope: Turn 19','Updated: 2026-09-12\nNext release scope: Turn 20',1)
old='The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. Added comparisons do not replace the root leaf.'
new='The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. If a derived parent INDEX remains plotted as context and one or more raw comparison series are present, that derived INDEX is not a COMPONENT leaf and is not counted in `+ X`. The first raw series becomes the COMPONENT root and `+ X` counts only the additional raw series. Thus a Growth-context chart containing `GRW + PCE + Payrolls + UNE` is `ENV / GRW / PCE + 2 Components`, not `ENV / GRW / GRW + 3 Components`. A derived-only standalone COMPONENT remains valid as `ENV / GRW / GRW` until a raw series is added.'
if old not in s:
    raise SystemExit('Turn 20 breadcrumb governance anchor missing')
s=s.replace(old,new,1)
append='''\n\n## 30. Turn 20 — lifecycle and AI snapshot truth correction\nTurn 20 is a narrow owner-directed correction over qualified Turn 19. It does not redesign the chart system, evidence model, Library, Config, display density, or interaction grammar.\n\nRelease-blocking corrections:\n- **AI POV consumes the exact frozen chart state that is visibly rendered.** It must not reconstruct a COMPONENT chart by re-fetching raw-series files after the chart has already been rendered. Derived RSK/GRW/MAC curves in the visible chart therefore remain `available: true` with their real derived observations in AI evidence and the persisted Library chart snapshot.\n- **Derived parent context is not a duplicated COMPONENT leaf.** When a derived INDEX is the starting standalone series and the user adds the first raw series, that raw series becomes the COMPONENT root; the parent INDEX may remain plotted as context but is excluded from the leaf `+ X` count.\n- **Breadcrumb lifecycle must be explicitly qualified end-to-end:** ENV index-chip tap → INDEX; INDEX component-chip tap → COMPONENT; COMPONENT INDEX ancestor tap → the same INDEX; COMPONENT ENV ancestor tap → ENV; bottom-level legend taps remain select/reference only and never create a fourth level.\n- **AI/Library regression gate:** a COMPONENT chart containing a derived index plus raw comparison series must persist the derived index with non-empty plotted points and must send it to AI as available evidence.\n\nTurn 20 acceptance example: `GRW + PCE + Payrolls + UNE` at COMPONENT depth renders breadcrumb `ENV / GRW / PCE + 2 Components`; AI evidence and the saved Library chart both retain the visible GRW curve.\n'''
if '## 30. Turn 20 — lifecycle and AI snapshot truth correction' not in s:
    s=s.rstrip()+append+'\n'
plan.write_text(s)

g=Path('MARKET-NAVIGATOR-GRAVEYARD.md')
t=g.read_text()
append_g='''\n\n## Turn 20 lifecycle / AI snapshot regressions — rejected\n- Reconstructing a visible COMPONENT chart for AI by calling raw-series fetches again is rejected. It drops derived RSK/GRW/MAC evidence because derived indices do not live at raw-series file paths. AI and Library persistence must consume the already-rendered frozen chart snapshot.\n- Breadcrumbs such as `ENV / GRW / GRW + 3 Components` are rejected when the visible comparison set is `GRW + PCE + Payrolls + UNE`. The derived parent index is context, not a duplicated component leaf; the correct leaf is `PCE + 2 Components`.\n- A COMPONENT breadcrumb that does not survive the full drill-up/drill-down lifecycle is rejected. ENV → INDEX → COMPONENT must be reversible through the breadcrumb ancestors, while bottom-level legend taps remain selection only.\n'''
if '## Turn 20 lifecycle / AI snapshot regressions — rejected' not in t:
    t=t.rstrip()+append_g+'\n'
g.write_text(t)
print('TURN 20 GOVERNANCE: PASS')
