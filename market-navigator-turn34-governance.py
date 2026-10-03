from pathlib import Path
plan=Path('MARKET-NAVIGATOR-MASTER-PLAN.md'); grave=Path('MARKET-NAVIGATOR-GRAVEYARD.md')
section='''

## 34. Turn 34 — reusable responsive MNChart component (owner approved 2026-10-03)

### Current disposition — REBUILDING FROM ACCEPTED TURN 28
The prior Turn 33/34 approach is rejected. RCA: Analyze impersonated NOW by mutating global NOW state and adding Analyze-specific branches to NOW helpers. One canvas/renderer did not equal one reusable chart. Fixed/Horizon consequently diverged while superficial control-state tests stayed green.

### Architectural objective
Create one context-independent, multi-instance `MNChart` component. NOW and Analyze are the first two consumers. Future Dashboard small multiples, Library/print, comparisons, or other surfaces must be able to use the same component without adding chart mathematics or copying chart code.

### Single public contract
Every consumer constructs the same `chartSpec` shape and calls the same API:

`MNChart.open(chartSpec)`

`chartSpec` fields, with identical names in every context:
- `target` — DOM container owned by the consumer.
- `root` — root index/component/series identifier.
- `series` — ordered series identifiers.
- `timeHorizon` — governed horizon such as `1YR`, `3YR`, `5YR`.
- `displayMode` — `fixed` or `horizon`.
- `yAxis` — `{mode:'auto'|'indexed'|'native'|'dual', y1:null|axisSpec, y2:null|axisSpec}`.
- `activeSeries` — selected/focused series.
- `presentation` — `{size:'full'|'compact'|'micro', controls, legend, crosshair, tooltip, labels}`.

No NOW-specific or Analyze-specific aliases (`S.h`, `analysisH26`, `indexDisplay`, etc.) may enter `MNChart`; adapters translate application state into `chartSpec` before the call.

### Component layers
1. `MNData` — shared cached retrieval of canonical index/component/market series; multiple charts must not refetch identical data independently.
2. `MNChart.resolve(chartSpec)` — the only owner of date-window resolution, series preparation, Fixed/Horizon mathematics, measurement-family detection, Y1/Y2 assignment, axis domains, missing-observation treatment and resolved datasets.
3. `MNChart.layout(resolvedChart, bounds)` — responsive geometry only: plot rectangle, tick/label density, legend geometry, line widths, font sizes and interaction targets. No financial/index mathematics.
4. `MNChart.render(resolvedChart, layout)` — paint only. No data transformation or axis-policy decisions.
5. `MNChart.open(chartSpec)` — creates and returns an independent chart instance with `update(nextSpec)`, `resize()`, `exportData()`, `print()` and `destroy()`.

### Multi-instance and scaling rule
- `MNChart` must not depend on global NOW/Analyze chart state.
- Each instance owns `spec`, `resolved`, `layout` and DOM/canvas resources.
- Container dimensions are authoritative. Use `ResizeObserver`; normal callers do not hard-code pixel dimensions.
- `presentation.size` changes information density, not data or mathematics.
- `full`: full axes/labels/legend/interactions/controls.
- `compact`: reduced ticks/labels and compact interaction treatment.
- `micro`: chart-first small-multiple rendering; axes/legend may be suppressed while the resolved data remains identical.
- The same `chartSpec` analytical fields rendered at full/compact/micro must resolve to identical datasets.

### Required consumer calls
NOW and Analyze must each construct a `chartSpec` and invoke exactly `MNChart.open(chartSpec)` for creation and `chart.update(chartSpec)` for changes. Future Dashboard usage is the same API; e.g. RSK/GRW/MAC small multiples are three independent `MNChart.open(chartSpec)` instances.

### Required behavior
1. NOW remains behaviorally equivalent to accepted Turn 28.
2. Analyze opens full-size with exactly the selected root and uses the same `MNChart` contract.
3. Analyze time horizon/display/Y-axis/series state is local to its chart instance and cannot mutate NOW.
4. Fixed uses canonical persistent governed-index values; Horizon rebases that same canonical series to 100 at the visible start.
5. Y1+Y2 uses the same measurement-family/axis resolver in every context.
6. `+ Add`, focus/removal, source explainer, crosshair/tooltip, More/actions, AI POV, Data, Print and downloads operate through instance state rather than NOW/Analyze-specific chart implementations.
7. Closing/destroying Analyze leaves NOW analytical and rendered state unchanged.

### Release-blocking proof
- **Identity:** exactly one `MNChart` implementation and one `chartSpec` schema; NOW and Analyze both call `MNChart.open(chartSpec)` / `chart.update(chartSpec)`.
- **No shortcut:** no Analyze rewriting of NOW chart state; no Analyze branch in NOW series preparation; no duplicate standalone preparation engine.
- **Mathematics:** capture actual plotted arrays. Horizon observation #1 must equal 100 and differ from Fixed where canonical values differ. Canonical evidence must remain unchanged.
- **Cross-context equivalence:** identical analytical `chartSpec` inputs in two independent instances must produce point-for-point equal resolved datasets, axis assignments and domains.
- **Responsive equivalence:** render identical analytical inputs at approximately 1200x650, 600x350, 320x180 and 180x100; no overflow/runtime failure/data mutation, and resolved datasets remain identical.
- **Concurrency:** render at least RSK, GRW and MAC simultaneously; changing horizon/display/series on one instance must not alter either other instance.
- **Y-axis:** prove actual Y1/Y2 assignment, units, domains and plotted values for an eligible mixed-measurement comparison.
- **Lifecycle:** create → resize → update → export → destroy → recreate without leaked listeners/state or runtime errors.
- **Interaction:** horizon, Fixed/Horizon, Add/remove, explainer, crosshair, More and close/restore all exercised behaviorally.
- Control-presence, selector-value, screenshot similarity or one-canvas tests cannot satisfy behavioral gates.

### Extensibility acceptance example
A future dashboard must be able to create independent RSK, GRW and MAC small multiples solely by supplying three `chartSpec` objects with `presentation.size:'compact'` or `'micro'`. No dashboard-specific chart mathematics, series transformation, axis resolver or renderer is permitted.
'''
t=plan.read_text(); key='## 34. Turn 34 —'
if key in t: t=t[:t.index(key)].rstrip()+section
else: t=t.rstrip()+section
plan.write_text(t)
g='''

## Turn 34 non-reusable chart contracts — REJECTED 2026-10-03
Permanently rejected: context-specific chart object names or property aliases; chart components that depend on NOW/Analyze global state; treating a shared renderer as a reusable chart while callers retain separate mathematics; hard-coded full-screen geometry that prevents small multiples; Dashboard/Analyze-specific copies of series preparation, Fixed/Horizon, Y-axis or rendering logic; and qualification based on control values or screenshots rather than resolved/plotted data. Required replacement is one multi-instance responsive `MNChart` contract with shared `MNData`, resolver, layout and renderer layers.
'''
gt=grave.read_text(); marker='## Turn 34 non-reusable chart contracts — REJECTED 2026-10-03'
if marker not in gt: grave.write_text(gt.rstrip()+g)
print('PASS Turn34 governance: reusable responsive MNChart contract')
