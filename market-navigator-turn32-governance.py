from pathlib import Path

PLAN=Path('MARKET-NAVIGATOR-MASTER-PLAN.md')
GRAVE=Path('MARKET-NAVIGATOR-GRAVEYARD.md')

plan=PLAN.read_text()
grave=GRAVE.read_text()

PLAN_MARK='## 32. Turn 32 — TRUE SINGLE CHART SURFACE (owner authorized 2026-09-30)'
GRAVE_MARK='## 32. Turn 30/31 Analyze architecture rejection — 2026-09-30'

if PLAN_MARK not in plan:
    plan += r'''

---

## 32. Turn 32 — TRUE SINGLE CHART SURFACE (owner authorized 2026-09-30)

### 32.1 Disposition and baseline

Turn 29 Dashboard remains tabled for later owner review and is not an implementation donor for this work. Turn 30 and Turn 31 Analyze candidates are rejected. Construct Turn 32 directly from the accepted `market-navigator-turn28-ship.html` application surface. Do not patch Turn 30 or Turn 31 forward.

### 32.2 Objective

The existing correct NOW chart surface must become one callable/mountable chart surface used by both ordinary NOW and standalone Analyze. This requirement is literal DOM/UI reuse, not merely shared data preparation or a shared low-level canvas function.

There shall be exactly one implementation of chart chrome, legend, Add-series interaction, axis selection, crosshair/tooltip, series activation/removal, horizon interaction, representation, footer/meta, and canvas rendering for the live analytical chart surface.

NOW mounts that surface in the ordinary NOW host. Analyze mounts the exact same surface instance/component in the full-workspace modal host and passes only analytical context such as root series/index, selected horizon, and series composition. Closing Analyze restores the ordinary NOW state and host without reconstructing a second chart implementation.

### 32.3 Analyze product contract

- Analyze is full-workspace modal presentation with X close.
- Analyze root is the selected component ticker or governed index name; it does not inherit an artificial ENV/index ancestry.
- `+ Add`, legend, horizons, crosshair, representation and Y-axis behavior are the same controls and code as NOW because they are the same surface.
- One measurement family uses the ordinary single-axis behavior.
- Two distinct measurement families may use Y1 + Y2 native axes; compatible series share their family axis.
- A third distinct measurement family is rejected before it can enter the chart state. It must never silently collapse the chart into an unrelated representation.
- No duplicated legend, duplicated series bar, duplicated chart canvas, duplicate tooltip, or Analyze-only chart renderer may remain live.
- AI commentary changes are deferred; this turn does not redesign AI POV.

### 32.4 Implementation rule

Refactor from Turn 28 by extracting/mounting the existing correct chart surface. Do not clone its markup or copy its event handlers into Analyze. The modal may own only modal concerns (host, full-workspace geometry, X close, and state handoff/restore). Analytical chart behavior belongs exclusively to the single chart surface.

### 32.5 Release-blocking gates

Turn 32 cannot qualify unless all of the following pass:

1. **Clean lineage:** generated candidate proves `market-navigator-turn28-ship.html` is the construction source and contains no Turn 30/31 donor marker.
2. **One surface DOM:** only one live analytical chart canvas, one legend container, one tooltip/crosshair container, one Add-series control path, and one chart footer/meta implementation exist for NOW/Analyze; Analyze does not define parallel equivalents.
3. **One renderer:** NOW and Analyze invoke the same chart-surface mount/render function. No Analyze-specific series preparation/render engine exists.
4. **Physical/component identity:** opening Analyze mounts/moves the same chart-surface node/component into the modal host; closing restores that same node/component to NOW. Qualification must assert node/component identity, not CSS similarity.
5. **State isolation:** opening, changing horizon/series inside, and closing Analyze restores the exact frozen NOW root, horizon, composition, active series, representation and evidence revision.
6. **Full-workspace modal:** Analyze uses the available application workspace and retains X close.
7. **Axis semantics:** one measurement family => one axis; two families => Y1+Y2 native axes; third family is refused before mutation; multiple series of the same family may share an axis.
8. **No duplicate chrome:** legend/series names appear once; there is no separate Analyze series ribbon layered on top of the shared legend.
9. **Interaction parity:** horizon, Add/remove, active series, crosshair/tooltip and representation behave identically because the same controls execute the same handlers.
10. **Retained gates:** retained Turn 28 qualification remains green; JS syntax passes; no Dashboard/indices/sources/weights/canonical mathematics are changed.
11. **Live Pages smoke:** deployed candidate loads without 404 and owner-test URL references the deployed commit.

A gate may not be weakened to fit the implementation. Any failure blocks the candidate.

### 32.6 Required release evidence

Record: Turn 28 source commit/blob; governance commit; builder/qualifier commit; generated candidate commit/blob; exact test-gate output; Pages deployment result; and cache-busted test URL. Owner disposition remains required before Turn 32 becomes a new accepted baseline.
'''

if GRAVE_MARK not in grave:
    grave += r'''

## 32. Turn 30/31 Analyze architecture rejection — 2026-09-30

Turn 30 and Turn 31 standalone Analyze implementations are rejected as application donors.

Turn 30 duplicated the main charting surface and independently implemented Analyze chart behavior, producing divergent legend/axis/series behavior and invalid chart combinations. Do not patch it forward.

Turn 31 is also rejected. Its `chartSurface31()` shared data preparation but retained separate NOW and Analyze DOM/chrome/state/event paths, including separate legend/series containers and host-conditional behavior. Sharing data preparation or a low-level `draw()` function does **not** satisfy chart-surface reuse.

Permanent prohibitions:

- never describe two separately owned chart DOM trees as “the same surface” merely because they call a common function;
- never retain separate NOW legend and Analyze series-ribbon implementations for the same analytical surface;
- never retain separate NOW/Analyze tooltip, crosshair, axis, Add/remove, horizon, active-series, representation or footer implementations where the product requires one chart surface;
- never qualify reuse by source-string markers alone; prove actual node/component identity across NOW -> Analyze -> NOW;
- never patch Turn 30 or Turn 31 forward for this objective;
- never use Turn 29 Dashboard work as an Analyze donor while Dashboard is tabled.

The accepted implementation pattern for the successor is: build from Turn 28, make the correct NOW chart surface a single callable/mountable component, mount that exact component in NOW or the full-workspace Analyze host, pass root/horizon/series context, and restore the frozen NOW state on close.
'''

PLAN.write_text(plan)
GRAVE.write_text(grave)
print('PASS governance Turn 32 plan + graveyard updated')
