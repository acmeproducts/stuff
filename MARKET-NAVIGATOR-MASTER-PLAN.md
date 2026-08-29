# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-29

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application navigation
Exactly four primary destinations: **NOW · EXPLORE · LIBRARY · HEALTH**. At the bottom, visually separated: **CONFIG**.

## 3. Canonical horizons
**1D · 5D · 1M · YTD · 1Y · 3Y · 5Y**. Now defaults to **5D**. Now and every Analysis workspace own independent horizon state.

## 4. One chart engine / one visual contract
There is exactly **one canonical chart engine and framework**. V1–V5 are configurations/states of that engine, not separate implementations.

Common everywhere:
- persistent series color identity
- typography and line treatment
- chart geometry
- horizon/time-axis logic
- visible Y-axis, ticks, values and units
- single-series point inspection / crosshair grammar
- legend/pill grammar
- missing-data treatment
- normalization mathematics
- source/frequency/status metadata
- responsive/touch behavior
- evidence fidelity

The prior repository implementation `1257844` (“Fix chart axes, crosshair, and tabbed component navigation”) is an interaction-quality donor. The common engine must meet or exceed that quality.

## 5. Derived analytical indices
Canonical transparent definition: `data/market-backend/derived-index-definition.json`.

There are three derived indices only: **Risk, Growth, Macro**. **Market is a container, not a fourth score.** Components/direction are explicit, equal-weighted and reproducible; no inherited opaque historical weighting.

## 6. Five chart views

### V1 — Market
Risk, Growth and Macro appear together on the common engine, rebased to 100 at the selected horizon start. V1 is the persistent upper Now chart.

Its `[RSK] [GRW] [MAC]` pills are **context selectors for V2**, not navigation away from V1. Selecting Risk, Growth or Macro leaves V1 visible and unchanged while replacing the content of the persistent V2 chart below with the chosen index's components.

There is therefore **no V1 → V2 page/view transition**. The relationship is **V1 controls V2 within Now**.

### V2 — Index
V2 is the persistent lower Now chart beneath V1. It shows all components of whichever Risk/Growth/Macro index is selected in V1, using the common engine and oriented Indexed-100 comparison.

Persistent colored component pills map directly to lines. Selecting a V2 component is the first actual drill-down transition: it launches **V3 in Explore** on that exact canonical series.

Changing the V1 index context replaces V2's component set and clears any V2 point-inspection state. It never removes or replaces V1.

### V3 — Component
One canonical source series, large format, native values/units, all horizons, full axes, point inspection/crosshair, source/frequency/status metadata, Data, Statistics, POV, Export and Save.

### V4 — Multi-series / paved-road comparison
V3 becomes V4 when series are added. The engine automatically chooses the least-transformative valid representation:
1. one series → native single Y-axis
2. multiple compatible-unit series → native common Y-axis
3. exactly two incompatible-unit series → automatic native dual Y-axis
4. 3+ incompatible-unit series → automatic Indexed 100

Adding/removing series automatically re-evaluates the representation. No chart-configuration ceremony.

### V5 — Explore / deliberate investigation
Same engine, with deliberate ability to choose compatible native comparison, exactly-two-series native dual-axis, or Indexed-100 multi-series comparison. Scientific transforms belong in Statistics.

## 7. Series identity and legend contract
Every series receives a stable visual color for the analytical object. The same color is used for line, legend/pill, selected point marker, value tag and corresponding dual-axis label.

A text-only multi-series legend is rejected. Pill → line → selected point → value must be visually unambiguous.

Legend pills are also the direct way to select which series is being inspected. Selecting a pill does **not** request a simultaneous readout of every other line.

## 8. Canonical point inspection / crosshair contract
The previous all-series crosshair-card interpretation is **rejected**.

The crosshair is for inspecting **one series and one real data point at a time**.

Interaction:
1. The user taps/clicks a line, or selects its colored legend pill, establishing the active series.
2. Moving/tapping along the chart resolves the nearest **real observation on that active series**.
3. A vertical guide marks that observation's X position.
4. One clearly visible marker is drawn on the active line at that exact observation.
5. One compact value tag is anchored adjacent to that marker and contains only the active series identity/value/unit. Indexed views may additionally show that same point's native value.
6. A date marker is shown on/adjacent to the X-axis directly beneath the selected observation so the point's time coordinate is unambiguous.
7. No popup enumerating every visible series is shown.
8. The inspection is explicitly dismissible: tap/click the close control, press Escape where available, or tap outside the plot/inspection target. Dismissal removes guide, marker, value tag and date marker.
9. Selecting a different line/pill immediately transfers inspection to that series rather than accumulating markers/readouts.
10. Any view, index-context, horizon or series-set change clears the prior inspection state before the new chart is rendered.

Touch behavior is first-class on Android. A tap pins the point; subsequent drag/movement may move along the active series. Inspection never depends on hover existing.

Mixed frequency remains honest: the selected point is a real observation from the active series; the system does not manufacture an observation at the cursor date.

## 9. Axis contract
A chart without a visible Y-axis is a failed chart.

Every chart renders:
- visible Y-axis line
- readable numeric tick labels
- measurement unit or explicit `Indexed 100` label
- horizontal reference/grid lines aligned with Y ticks
- common X-axis with horizon-correct time labels

Native single/common axis uses native units. Exactly two incompatible native series use left and right Y-axes, with axis labels/ticks visually tied to their series colors. Indexed comparison uses one explicit Indexed-100 Y-axis while point inspection retains access to native evidence.

Time is always the common X-axis. Incompatible raw units are never silently overlaid on one Y-axis.

## 10. Time-axis geometry
Charts show actual temporal shape. Plotted observations and labeled ticks are separate concerns. No fixed four-label shortcut.

- 1D: canonical intraday only when available; otherwise state native-data limitation
- 5D: applicable observations with readable day labels
- 1M: applicable observations with legible dates
- YTD: width-appropriate month landmarks
- 1Y: roughly monthly landmarks where appropriate
- 3Y/5Y: reduced width-aware month/quarter/year landmarks

Rendering optimization may not alter canonical observations used by point inspection, Data, Statistics, AI or export.

## 11. Data fidelity and mixed frequency
**plotted observation ↔ selected point value ↔ Data view ↔ Statistics input ↔ export** must reconcile.

Monthly CPI and daily market series can share a current X-axis without pretending they share observation cadence. CPI's line stops at its latest real published observation; a faster series may continue to the current market date. The chart exposes each series' latest actual observation date and never stretches or carries forward a source line merely for visual continuity.

## 12. NOW
Now opens at 5D and is a persistent two-level report:

**Upper:** V1 Market chart + Market AI POV.

**Lower:** V2 selected-index component chart + selected-index AI POV.

V1 and V2 coexist. Selecting `RSK / GRW / MAC` in V1 changes only the V2 context below. It is not navigation and does not replace V1.

Only selecting a component in V2 leaves Now and opens V3 in Explore.

## 13. EXPLORE / Analysis workspace
Explore is a workspace, not a second chart engine.

**Now V2 component → V3 → add series → automatic V4 → deliberate V5 when needed → Data/Statistics/POV → Save**.

## 14. Statistics and correlation
Statistics are tied to exact analytical state. Correlation is a first-class artifact containing series pair, coefficient, range, alignment/frequency, observation count, transformation, method and appropriate visualization. Correlation is association, not causation.

## 15. AI POV
POV is an interrogable argument grounded in exact active evidence state. Changing series, horizon/range or transformation makes prior POV stale until re-evaluated. Challenges are tested against evidence.

## 16. LIBRARY
Library is persistent living research, not favorites/archive. Omnisearch, saved/recent analyses and New Analysis live here. Saving preserves series, chart/horizon/range/axis state, provenance, statistics/correlations, POV/interrogation and recoverable history.

## 17. Share / download / print
**Share** = polished read-only point-in-time snapshot. **Download** = report/evidence including exact data export. **Print** = deliberately formatted human-readable report.

## 18. HEALTH and CONFIG
Health exposes evidence freshness, source/provider, collection state, coverage, observation counts, provenance/revisions, horizon readiness, missing periods and pipeline failures/status. Config is separated at the bottom and contains provider/model/application settings.

## 19. Backend contract
Data Catalog defines canonical source series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations and deterministic horizon records. Browser UI does not reacquire Yahoo/FRED data. Derived products remain traceable to canonical observations.

## 20. Five-view real-data acceptance artifact
The standalone HTML acceptance artifact exercises V1–V5 against real canonical evidence using the same engine.

Mandatory acceptance includes:
- **Now acceptance renders V1 and V2 concurrently**, proving the real V1-controls-V2 relationship
- V1 selection changes V2 context without replacing V1
- V2 component selection alone launches V3
- V1/V2 populated from canonical derived-index definition
- all seven horizons
- V3 native single-series
- V4 automatic native/common, dual-axis and Indexed-100 transitions
- 2, 5 and 7 simultaneous real series
- visible Y-axis with ticks/units in every view
- colored legend/pill identity
- single active-series point inspection in V1–V5
- one point marker + one point value tag + one X-axis date marker
- explicit dismissal of inspection
- inspection state cleared on any context/view/horizon/series change
- no all-series crosshair popup
- native evidence available from Indexed-100 point inspection
- honest mixed-frequency observation dates and line termination
- Android touch behavior
- healthy/loading/partial/stale/missing/source-failure/insufficient-observation states

Acceptance remains: **“Yes. That's our chart.”**

## 21. Build gates
**Gate 1 — Plan:** this product/chart contract.

**Gate 2 — Chart:** real-data five-view common-engine artifact. Plan and chart are reviewed together.

**Gate 3 — Application:** only after Gate 1 + Gate 2 approval, assemble **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at bottom. Gate 3 may not reinterpret the approved chart contract.

## 22. Rejected approaches
- treating V1 and V2 as peer navigation destinations
- replacing V1 when an index is selected
- deep component drilldown inside Now
- separate simple and Analysis chart engines
- synthetic fourth Market score
- inherited opaque weighted scoring
- browser-side Yahoo/FRED acquisition
- incompatible raw units on one Y-axis
- text-only multi-series legends
- all-series crosshair popup
- non-dismissible point inspection
- chart with no visible Y-axis/ticks/units
- header-only readout disconnected from selected point
- fixed four-label X-axis
- forcing users to configure axes for ordinary V4 comparisons
- deferring chart behavior to development
- Library as static archive
- Health conflated with Config
