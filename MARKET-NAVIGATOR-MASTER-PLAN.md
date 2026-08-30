# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-29

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application frame and navigation
The application frame has two sides:
- **Left:** collapsible navigation rail for **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at the bottom.
- **Right:** the analytical working panel. When the rail is collapsed, the working panel receives essentially the full available screen width.

The right working panel must not be treated as a stack of dashboard cards. Its visual structure is a compact application workspace with a two-row top ribbon, chart/evidence body, AI interpretation section and bottom action row.

## 3. Canonical horizons
**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. Now defaults to **5D**.

The active horizon is global context for the current analytical surface. It appears **once**, centered in the second row of the top ribbon. Horizon controls must not be repeated below the chart or in multiple places on the same surface.

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

### Semantic index colors
- **Risk = red**
- **Growth = blue**
- **Macro = white / neutral**

These colors are semantic identities, not a generic palette. Red, green and yellow are reserved for intentional conventional meaning. Ordinary component series use a non-semantic comparison palette unless explicitly approved otherwise.

## 6. Five chart states

### V1 — Market
Risk, Growth and Macro appear together, rebased to 100 at the selected horizon start.

**No index is selected by default.** Risk, Growth and Macro are peers. A line/pill may become the active inspection target without becoming navigation context.

The top ribbon first row reads **`Market: <sentiment>`**. The legend immediately above the chart contains the interactive `RSK / GRW / MAC` series identities. No duplicate Risk/Growth/Macro selector cards appear below the chart.

Selecting Risk, Growth or Macro transitions the primary context from Market to that V2 Index.

### V2 — Index
V2 shows all components of the selected Risk/Growth/Macro index using oriented Indexed-100 comparison.

V2 is the context surface for component investigation. The top ribbon first row becomes **`Risk: <sentiment>`**, **`Growth: <sentiment>`** or **`Macro: <sentiment>`**. Its component legend is the direct interaction surface. Selecting a component launches V3 in Explore.

Back returns to Market.

### V3 — Component
One canonical source series, large format, native values/units, full axes, point inspection, source/frequency/status metadata, Data, Statistics, POV, Export and Save.

V3 is a drill-down from V2. Its title/context retains the parent index relationship.

### V4 — Multi-series / paved-road comparison
V3 becomes V4 when series are added. The engine automatically chooses:
1. one series → native single Y-axis
2. multiple compatible-unit series → native common Y-axis
3. exactly two incompatible-unit series → automatic native dual Y-axis
4. 3+ incompatible-unit series → automatic Indexed 100

Exactly two series use **two side-by-side series dropdowns**.

### V5 — Explore / deliberate investigation
Same engine, with deliberate ability to choose compatible native comparison, exactly-two-series native dual-axis, or Indexed-100 multi-series comparison. Scientific transforms belong in Statistics.

## 7. Series identity and legend contract
Every series receives a stable visual color. The same color is used for line, legend/pill, selected point marker, value tag and corresponding dual-axis label.

The legend sits directly above the chart and acts as the primary series interaction surface. Text-only multi-series legends are rejected. Duplicate selector cards beneath the chart are rejected.

Legend layout may not wrap into or overlap a second chart row. Dense contexts use stable three-letter shorthand with full identity retained in context/title/metadata.

## 8. Canonical point inspection / crosshair contract
The crosshair inspects **one series and one real data point at a time**.

Interaction:
1. tap/click a line or legend pill to establish the active series
2. resolve nearest real observation on that active series
3. vertical guide at observation X
4. one marker on the active line
5. one compact value tag adjacent to the marker
6. one date marker at the X-axis
7. no popup enumerating every visible series
8. explicit dismissal via close, Escape where available, or tap outside
9. selecting another line/pill transfers inspection
10. any view/context/horizon/series-set change clears inspection before render

Touch behavior is first-class on Android.

## 9. Axis contract
Every chart renders a visible Y-axis, readable ticks, unit or `Indexed 100`, aligned horizontal references and a horizon-correct X-axis.

Exactly two incompatible native series use left/right Y axes. Indexed comparisons use one Indexed-100 axis while retaining native evidence for selected points.

Axis QA is matrix-based across all applicable V1–V5 × seven horizons for X/Y1/Y2.

## 10. Time-axis geometry
Charts show actual temporal shape. No fixed four-label shortcut. Rendering optimization may not alter canonical observations used by inspection, Data, Statistics, AI or export.

## 11. Data fidelity and mixed frequency
Monthly and daily series share a common analytical X-axis without pretending to share cadence. Each line terminates at its own latest real observation. Slower series are never stretched, interpolated or carried forward merely for visual continuity.

## 12. NOW workspace composition
Now opens at 5D on V1 Market with no selected index.

The right working panel follows this structure:

**Top ribbon — row 1**
`Market: <sentiment>` or the active Index/Component context.

**Top ribbon — row 2**
Centered horizon control: `1D  5D  MTD  YTD  1YR  3YR  5YR`.

**Divider**

**Evidence/chart section**
Centered legend, then chart. No duplicated horizon row below chart. No explanatory helper prose occupying chart real estate in the production surface.

**Divider**

**AI commentary section**
Concise interpretation, including what changed / why it matters, with evidence/deeper reasoning available without permanently reducing chart space.

**Divider**

**Bottom action row**
`Back` on the left when applicable and `Save to Library` on the right.

Navigation progression:
**Market → selected Index → selected Component → comparison/exploration**.

## 13. EXPLORE / Analysis workspace
Explore is a workspace, not a second chart engine.

**V2 component → V3 → add series → automatic V4 → deliberate V5 → Data/Statistics/POV → Save**.

Returning from V3 returns to its V2 Index context; returning again returns to Market.

## 14. Statistics and correlation
Statistics are tied to exact analytical state. Correlation is a first-class artifact containing series pair, coefficient, range, alignment/frequency, observation count, transformation and method. Correlation is association, not causation.

## 15. AI POV
POV is an interrogable argument grounded in exact active evidence state. Changing series, horizon/range or transformation makes prior POV stale until re-evaluated.

The AI layer is part of the UX from the beginning. At minimum, it exposes concise **What changed / Why it matters** interpretation and an affordance for evidence/deeper interrogation.

## 16. LIBRARY
Library is persistent living research, not favorites/archive. Saving preserves series, chart/horizon/range/axis state, provenance, statistics/correlations, POV/interrogation and recoverable history.

## 17. Share / download / print
**Share** = polished read-only snapshot. **Download** = report/evidence plus exact data export. **Print** = formatted human-readable report.

## 18. HEALTH and CONFIG
Health exposes evidence freshness, source/provider, collection state, coverage, observation counts, provenance/revisions, horizon readiness, missing periods and pipeline failures/status. Config remains separate at the bottom of the left rail.

## 19. Backend contract
Data Catalog defines canonical source series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations and deterministic horizon records. Browser UI does not reacquire Yahoo/FRED data.

## 20. Gate 2 chart acceptance artifact
The standalone five-view artifact proved sufficient rudimentary chart mechanics: seven horizons, axes/time geometry, point inspection, V1–V5 feasibility, dual-axis/Indexed-100 mechanics and mixed-frequency termination.

Gate 2 remains a mechanics proving surface, not the target UI.

### QA-overlay presentation contract
Redlines, diagnostics, freshness details, axis/mode explanations, matrix state, implementation metadata and all other QA-only material live **behind a QA control** and are hidden from the default product surface.

## 21. Gate 3 — UX Journey Prototype
Gate 3 is a lightweight navigable prototype focused on the application frame and journey, not production-scale implementation.

Required journey:
**Market → Risk → component → back to Risk → Growth → component → compare two series → interpretation/evidence → back to Market**.

At every state the user must immediately understand:
- where am I?
- what am I looking at?
- why does it matter?
- what can I do next?

### Gate 3 frame acceptance
The prototype must test the actual intended frame:
- collapsible left navigation rail
- full-width right analytical workspace when rail is collapsed
- two-row top ribbon with active context/sentiment and a single centered horizon row
- centered legend above chart
- no duplicate index-selector cards
- no horizon controls below chart
- AI commentary separated below evidence/chart
- bottom `Back | Save to Library` action grammar
- QA-only material behind QA

## 22. Build gates
**Gate 1 — Plan: APPROVED.**

**Gate 2 — Chart mechanics: SUFFICIENT TO ADVANCE.**

**Gate 3 — UX Journey Prototype: ACTIVE.** Evaluate the workspace-frame prototype and navigation/context hierarchy.

**Gate 4 — Application:** only after Gate 3 UX approval, assemble production NOW · EXPLORE · LIBRARY · HEALTH with CONFIG separated in the left rail.

## 23. Rejected approaches
- card-stack dashboard composition for the analytical working panel
- repeating horizon controls below the chart or elsewhere on the same surface
- duplicate Risk/Growth/Macro selector cards beneath the Market chart
- explanatory scaffolding that permanently consumes chart real estate
- treating V1/V2/V3 as a simple slideshow
- leaving V1 Market as competing context after an index becomes active
- preselecting an index in Market
- arbitrary semantic colors for Risk/Growth/Macro
- casual red/green/yellow usage without intentional meaning
- separate chart engines
- synthetic fourth Market score
- incompatible raw units on one Y-axis
- text-only multi-series legends
- all-series crosshair popup
- crosshair state leaking between components
- non-dismissible point inspection
- missing visible axes/ticks/units
- fixed four-label X-axis
- forcing users to configure ordinary V4 axes
- stretching slower-frequency series to match faster latest dates
- QA/redline instrumentation occupying production layout
- omitting AI interpretation from UX prototyping
- literal four-panel desktop composition forced onto portrait mobile
- deferring navigation/context behavior to late development
- Library as static archive
- Health conflated with Config
