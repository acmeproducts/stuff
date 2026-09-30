from pathlib import Path
PLAN=Path('MARKET-NAVIGATOR-MASTER-PLAN.md'); GRAVE=Path('MARKET-NAVIGATOR-GRAVEYARD.md')
plan=PLAN.read_text(); grave=GRAVE.read_text()
PM='## 33. Turn 33 — IN-PLACE SINGLE CHART SURFACE RECOVERY (owner authorized 2026-09-30)'
GM='## 33. Turn 32 rejection — moving the main chart DOM broke NOW — 2026-09-30'
if PM not in plan:
 plan += r'''

---

## 33. Turn 33 — IN-PLACE SINGLE CHART SURFACE RECOVERY (owner authorized 2026-09-30)

### 33.1 Disposition and immutable baseline
Turn 32 is rejected because physically moving the live NOW chart DOM into Analyze broke the main surface. Turn 31/30 remain rejected. Turn 29 Dashboard remains tabled. Construct Turn 33 only from accepted `market-navigator-turn28-ship.html` (blob `544661884a412c57aac08fada4f961012a4bc496`). No rejected candidate is an implementation donor.

### 33.2 Architecture
Do not clone the chart and do not move/reparent the chart DOM. The existing Turn 28 NOW chart remains physically in its original host for its entire lifetime. Analyze is an **in-place presentation/state mode of that exact existing NOW chart surface**: snapshot NOW state; apply the requested component/index + horizon to the ordinary NOW state; add a full-workspace presentation class and X close affordance around the existing surface; call the ordinary NOW renderer; on close remove presentation mode and restore the exact frozen NOW state through the ordinary renderer.

There is no Analyze chart canvas, legend, series ribbon, tooltip, axis engine, renderer, or alternate chart DOM. Analyze-specific code may own only snapshot/restore, full-workspace presentation, X close, and requested root handoff.

### 33.3 Product contract
- Analyze visually occupies the available application workspace and has X close.
- Existing NOW chart DOM is never moved, replaced, cloned, detached, or reparented.
- Existing NOW chart renderer, legend, Add/remove, horizon, crosshair/tooltip, representation, axis logic and footer remain authoritative and execute unchanged.
- Analyze opens at the requested component ticker or governed index and the current horizon.
- Existing axis behavior remains authoritative; this turn must not invent a second Y-axis algorithm.
- Closing Analyze restores the exact pre-open NOW context/state.
- No Dashboard, AI commentary, index mathematics, sources, weights, Health, Library or unrelated UI changes.

### 33.4 Release-blocking gates
1. Clean Turn 28 lineage/blob and no Turn 29/30/31/32 donor code.
2. Byte/semantic preservation of the main NOW chart structure and renderer except the minimum callable state handoff required by this plan.
3. Runtime assertion: chart surface parent node identity is identical before, during, and after Analyze.
4. Runtime assertion: chart surface node identity is identical before, during, and after Analyze.
5. Exactly one visible analytical canvas, legend, tooltip/crosshair and Add path in NOW and Analyze.
6. Analyze full-workspace presentation + X close.
7. Requested component/index becomes the active ordinary chart context using the ordinary renderer.
8. Existing axis/series rules execute through the ordinary NOW code; no Analyze-specific axis/series renderer exists.
9. Close restores root, horizon, composition, active/focus, representation and evidence state exactly.
10. Main NOW surface is exercised after close: horizon change, series activation, Add path availability, crosshair target and render complete without exception.
11. Retained Turn 28/persistent-index qualification and JavaScript syntax pass.
12. Live Pages smoke returns HTTP 200 for the cache-busted candidate.

Any failure blocks release. Mechanical CI success is not owner acceptance.
'''
if GM not in grave:
 grave += r'''

## 33. Turn 32 rejection — moving the main chart DOM broke NOW — 2026-09-30
Turn 32 is rejected and prohibited as an implementation donor. It satisfied a literal node-identity test by **moving/reparenting the live NOW chart DOM into the Analyze modal**, but this damaged the main chart surface. The gate was therefore insufficient and the architecture was wrong.

Permanent rules:
- never move, detach, reparent or clone the accepted main NOW chart surface to implement Analyze;
- never treat node identity alone as sufficient reuse proof;
- reuse must preserve the accepted main surface in place and preserve its normal post-Analyze operation;
- Analyze must be an in-place presentation/state mode of the existing chart, or a future explicitly approved component architecture, not a DOM relocation trick;
- qualification must test the main chart **after Analyze closes**, including horizon, active series, Add availability and rendering;
- Turn 30, Turn 31 and Turn 32 are all rejected donors for Analyze.
'''
PLAN.write_text(plan); GRAVE.write_text(grave); print('PASS Turn 33 governance')
