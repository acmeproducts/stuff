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

Health asks whether evidence can be trusted. Config controls application/provider settings.

## 3. Canonical horizons
**1D · 5D · 1M · YTD · 1Y · 3Y · 5Y**. Now defaults to **5D**. Now and every Analysis workspace own independent horizon state.

## 4. One chart engine / one visual contract
There is exactly **one canonical chart engine and framework**. V1–V5 are configurations/states of that engine, not separate implementations.

Common everywhere:
- series color identity
- typography and line treatment
- chart geometry
- horizon/time-axis logic
- Y-axis/value/unit formatting
- point markers and crosshair grammar
- legend/pill grammar
- missing-data treatment
- normalization mathematics
- source/frequency/status metadata
- responsive/touch behavior
- evidence fidelity

The prior repository implementation that restored axes/crosshair behavior (`1257844`, “Fix chart axes, crosshair, and tabbed component navigation”) is an interaction-quality donor. The acceptance engine must meet or exceed that behavior; it may not regress to a header-only mouse readout.

## 5. Derived analytical indices
The transparent canonical definition is `data/market-backend/derived-index-definition.json`.

There are three derived indices only: **Risk, Growth, Macro**. **Market is a container, not a fourth score.**

Derived-index rules:
- components and direction orientation are explicit in the definition file
- equal weighting; no inherited opaque historical weighting
- each component is oriented and rebased to 100 at the selected horizon start
- the derived index is the arithmetic mean of available oriented component values
- unavailable/invalid components are disclosed, never silently substituted
- source observations remain canonical and traceable

## 6. The five chart views

### V1 — Market
Location: Now upper chart.

Risk, Growth and Macro appear together on the common chart engine, rebased to 100 at the selected horizon start. Their colored pills are `[RISK] [GROWTH] [MACRO]`; selecting one drives V2. Market AI POV sits beside the chart.

Crosshair behavior is identical to every other view: vertical guide, visible point on every series, point-anchored value label, and readable crosshair card.

### V2 — Index
Location: Now lower chart.

Shows every component of the selected Risk/Growth/Macro index on the common engine, using the same oriented Indexed-100 comparison treatment used to construct the index. Every component has a persistent series color and matching colored legend pill. Selecting a component launches V3 on that exact canonical series. Index AI POV sits beside the chart.

### V3 — Component
Location: Explore.

One canonical source series, large format, native values/units, all horizons, full time axis, crosshair, source/frequency/status metadata, Data, Statistics, POV, Export and Save affordances.

**Crosshair acceptance:** touching/pointing at the plot draws the vertical guide; the nearest real observation is visibly marked on the line; its value is displayed at/adjacent to that point; a compact card also shows date, series identity, exact value and unit. The user must not have to look away from the point to a page header to discover the value.

### V4 — Multi-series / paved-road comparison
Location: Explore; V3 becomes V4 when another series is added.

V4 is automatic rather than configuration-heavy. The engine chooses the least-transformative valid representation from the active series:

1. **One series:** native single-axis.
2. **Two or more series sharing a compatible measurement unit:** native common Y-axis.
3. **Exactly two series with incompatible measurement units:** **automatic native dual Y-axis**, one left and one right, with axes colored/labeled to match their series.
4. **Three or more series that cannot share a meaningful native Y-axis:** **automatic Indexed-100 comparison** from the selected horizon start.

Adding/removing a series automatically re-evaluates the appropriate representation. No modal or chart-configuration ceremony is required. The mode is always stated visibly so no transformation is hidden.

Examples:
- WTI + Brent → one native $/barrel axis.
- CPI + Core CPI → one native percent axis.
- CPI + WTI → automatic dual Y-axis.
- CPI + WTI + VIX → automatic Indexed 100.
- seven mixed Risk components → Indexed 100.

V4 still supports 2–7+ series and is a mandatory seven-series stress case.

### V5 — Explore / deliberate investigation
V5 exposes deliberate analytical control after the paved-road V4 behavior. It uses the same engine and may explicitly choose:
- native single/common-axis where units are compatible
- native dual-axis for exactly two incompatible units
- Indexed-100 multi-series comparison

More scientific transforms belong in Statistics, not as casual primary-chart decoration.

## 7. Series identity and legend contract
Every series receives a stable visual color for the current analytical object. The exact same color is used for:
- line
- point marker
- legend/pill swatch or colored treatment
- crosshair point/value marker
- crosshair-card row
- corresponding Y-axis label when dual-axis

A text-only legend for a multi-series chart is rejected. A user must be able to correlate pill → line → point → value without inference.

Pills are interactive controls. Hidden/deactivated series retain identity but are visibly de-emphasized.

## 8. Crosshair / point-value contract
Crosshair is a first-class interaction in **all five views**, not an optional Explore feature.

On pointer/touch movement:
1. draw one vertical time guide
2. resolve the nearest applicable **real observation for each visible series**
3. draw a clearly visible colored marker at each resolved plotted point
4. display a compact value label adjacent to each point when legibility permits
5. show one structured crosshair card organized as:
   - date/time header
   - colored series identity
   - exact value
   - unit
   - source observation date when mixed frequency makes it differ from cursor date

The card uses one row per visible series, not a long inline sentence. Rows use the same color identity as the chart.

On touch devices, tap/drag pins and moves the crosshair. The crosshair must not disappear merely because hover does not exist. Labels/card must avoid covering the inspected point when practical and may flip left/right/top/bottom based on available space.

For Indexed-100 views, the point/card shows **both Indexed value and native value**; native evidence must never become inaccessible because the line is transformed for display.

## 9. Axis contract
Time is always the common X-axis.

The engine classifies active series by compatible measurement units before choosing Y-axis treatment. It never overlays incompatible raw units on one axis.

Dual-axis:
- exactly two incompatible measurement families
- left/right axes explicitly labeled with series name/unit
- axis text/ticks use the corresponding series color
- no implication that vertical position alone means equal magnitude across axes

Indexed 100:
- used automatically for 3+ incompatible series in V4 or explicitly in V5
- each series = 100 at its own first valid observation in the selected horizon
- visible “Indexed 100” state
- crosshair retains native values

## 10. Time-axis geometry
Charts show the actual temporal shape of the evidence. Plotted observations and labeled ticks are separate concerns. No fixed four-label shortcut.

- 1D: canonical intraday only when it exists; otherwise state native-data limitation
- 5D: applicable observations with readable day labels
- 1M: applicable observations with legible dates
- YTD: month landmarks appropriate to width
- 1Y: roughly monthly landmarks where appropriate
- 3Y/5Y: reduced width-aware month/quarter/year landmarks

Rendering optimization may not alter the canonical observations used by crosshair, Data, Statistics, AI or export.

## 11. Data fidelity and mixed frequency
**plotted observation ↔ crosshair value ↔ Data view ↔ Statistics input ↔ export** must reconcile.

Monthly CPI and daily VIX must not be presented as though both published a new observation on the same date. Crosshair/card exposes the actual source observation date when necessary. Statistical alignment is explicit and reports observation count.

## 12. NOW
Now opens at 5D.

Top: V1 Market chart + Market AI POV.
Bottom: V2 selected-index chart + selected-index AI POV.

Now remains curated. Component selection launches Explore rather than creating deep inline drilldown.

## 13. EXPLORE / Analysis workspace
Explore is a workspace, not a second chart engine.

**Now → component → V3 → add series → automatic V4 → deliberate V5 when needed → Data/Statistics/POV → Save**.

Selected-range and evidence-inspection states operate on the same analytical object.

## 14. Statistics and correlation
Statistics are tied to the exact analytical state. Correlation is a first-class artifact containing series pair, coefficient, range, alignment/frequency, observation count, transformation, method and appropriate visualization. Correlation is association, not causation.

## 15. AI POV
POV is an interrogable argument grounded in the exact active evidence state. Changing series, horizon/range or transformation makes prior POV stale until re-evaluated. User challenges are tested against evidence with useful states such as Supported, Partially supported, Not supported and Incomparable.

## 16. LIBRARY
Library is persistent living research, not favorites/archive. It contains Omnisearch, saved/recent analyses and New Analysis as an action. Saving preserves series, chart state, horizon/range, axis/comparison state, provenance, statistics/correlations, POV/interrogation and recoverable history. Reopening resumes the analytical object.

## 17. Share / download / print
**Share** = polished read-only point-in-time snapshot.
**Download** = take report/evidence with you, including exact data export.
**Print** = deliberately formatted human-readable report, not application chrome.

## 18. HEALTH and CONFIG
Health exposes evidence freshness, source/provider, collection state, coverage, observation counts, provenance/revisions, horizon readiness, missing periods and pipeline failures/status.

Config is separated at the bottom and contains AI provider/model credentials/settings and application settings. Health does not move into Config.

## 19. Backend contract
Data Catalog defines canonical source series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations and deterministic horizon records. Browser UI does not reacquire Yahoo/FRED data. Low-frequency series are not fabricated into daily source observations. Derived analytical products remain traceable to canonical observations.

## 20. Five-view real-data acceptance artifact
Before application assembly, a standalone HTML artifact must exercise **all five views** against real canonical evidence using the **same engine**.

Mandatory acceptance:
- V1 Market populated from canonical derived-index definition
- V2 Risk/Growth/Macro component views populated from that same definition
- all seven horizons
- V3 native single-series
- V4 automatic common-axis, automatic dual-axis and automatic Indexed-100 transitions as series are added/removed
- 2, 5 and 7 simultaneous real series
- colored legend/pill identity that maps unambiguously to lines
- crosshair on V1–V5
- point markers + point-anchored values
- structured multi-series crosshair card
- native + indexed values in normalized modes
- mixed-frequency observation-date disclosure
- touch drag/pin behavior on Android phone/tablet
- healthy/loading/partial/stale/missing/source-failure/insufficient-observation states

The acceptance criterion is visual and behavioral: **“Yes. That's our chart.”**

## 21. Build gates
**Gate 1 — Plan:** this product/chart contract.

**Gate 2 — Chart:** real-data five-view common-engine artifact. Plan and chart are reviewed together.

**Gate 3 — Application:** only after Gate 1 + Gate 2 approval, assemble **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at bottom. Gate 3 may not reinterpret the approved chart contract.

## 22. Rejected approaches
- deep component drilldown inside Now
- separate simple and Analysis chart engines
- synthetic fourth Market score
- inherited opaque weighted scoring
- browser-side Yahoo/FRED acquisition
- incompatible raw units on one Y-axis
- text-only multi-series legends
- header-only crosshair readout with no point marker/value
- fixed four-label X-axis
- forcing users to configure axes for ordinary V4 comparisons
- deferring chart behavior to development
- Library as static archive
- Health conflated with Config
- editable collaboration before excellent read-only publishing
