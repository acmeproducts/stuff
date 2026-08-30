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

### Semantic index colors
The three top-level indices carry intentional semantic colors across the product:
- **Risk = red**
- **Growth = blue**
- **Macro = white / neutral**

These colors are not an arbitrary palette. Red, green and yellow are reserved for places where their conventional semantic meaning is intentional. Ordinary component-series colors must use a non-semantic comparison palette unless the series itself has an approved semantic identity.

## 6. Five chart states

### V1 — Market
Risk, Growth and Macro appear together on the common engine, rebased to 100 at the selected horizon start. V1 is the default Now surface.

**No index is selected by default.** Risk, Growth and Macro are peers in the Market view. A line/pill may become the active inspection target for crosshair purposes without becoming the navigation/context selection.

Selecting Risk, Growth or Macro transitions the primary context from **Market (V1)** to the selected **Index (V2)**. On portrait mobile, V1 does not remain as a competing chart behind or above V2. V2 becomes the visible analytical context for the next drill-down.

### V2 — Index
V2 shows all components of the selected Risk/Growth/Macro index, using the common engine and oriented Indexed-100 comparison.

V2 is the **context surface** for component investigation. Persistent colored component pills map directly to lines. Selecting a V2 component launches **V3 in Explore** on that exact canonical series.

V2 retains a clear breadcrumb/back affordance to Market and enough index identity that the user understands the parent context.

### V3 — Component
One canonical source series, large format, native values/units, all horizons, full axes, point inspection/crosshair, source/frequency/status metadata, Data, Statistics, POV, Export and Save.

**V3 is a drill-down from V2; it is not the next peer chart in a V1→V2→V3 slideshow. V2 supplies context; V3 investigates the selected V2 component.** V3's title/breadcrumb must retain enough parent/index context that the user knows what was drilled into and from where.

### V4 — Multi-series / paved-road comparison
V3 becomes V4 when series are added. The engine automatically chooses the least-transformative valid representation:
1. one series → native single Y-axis
2. multiple compatible-unit series → native common Y-axis
3. exactly two incompatible-unit series → automatic native dual Y-axis
4. 3+ incompatible-unit series → automatic Indexed 100

Adding/removing series automatically re-evaluates the representation. No chart-configuration ceremony.

For exactly two series, series controls are **two side-by-side series dropdowns**, preserving the direct visual pairing of left/right comparison rather than stacking the controls vertically.

### V5 — Explore / deliberate investigation
Same engine, with deliberate ability to choose compatible native comparison, exactly-two-series native dual-axis, or Indexed-100 multi-series comparison. Scientific transforms belong in Statistics.

## 7. Series identity and legend contract
Every series receives a stable visual color for the analytical object. The same color is used for line, legend/pill, selected point marker, value tag and corresponding dual-axis label.

A text-only multi-series legend is rejected. Pill → line → selected point → value must be visually unambiguous.

Legend pills are also the direct way to select which series is being inspected. Selecting a pill does **not** request a simultaneous readout of every other line.

**Legend layout may not wrap into or overlap a second chart row.** Dense V2/V3 drill-down contexts use an unambiguous **three-letter series shorthand** in the chart surface; the full series definition belongs in the chart title/context and metadata. Shorthand must remain stable for the same canonical series.

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

**Crosshair/inspection state is component-local and must never persist visually into a previous or newly rendered component.** A chart/component transition clears the prior component's guide, marker, value tag, date marker and active-series inspection state before paint.

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

**Axis QA is matrix-based, not bug-by-bug.** Before a build is presented, every V1–V5 configuration must be checked across all seven horizons for **X, Y1 and Y2 where applicable**. The tester is not responsible for discovering each permutation independently. A defect found in one axis/view/horizon triggers review of the corresponding axis contract across the full matrix.

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

Monthly CPI and daily market series can share a current X-axis without pretending they share observation cadence. CPI's line stops at its latest real published observation; a faster series such as WTI may continue into a later month/current market date. The common X-axis spans the selected analytical range; **each line terminates at its own latest real observation**. The chart exposes each series' latest actual observation date and never stretches, interpolates, or carries forward a slower source merely for visual continuity.

## 12. NOW
Now opens at 5D on **V1 Market**, with no index selected.

On portrait mobile, Now uses progressive disclosure rather than simultaneously stacking Market and Index charts:

**Market (V1) → tap Risk/Growth/Macro → selected Index (V2).**

The selected V2 Index is now the visible analytical context. Back returns to V1 Market. Selecting a component in V2 opens V3 in Explore.

Every V1/V2 context includes an AI interpretation layer in the information architecture. During UX prototyping this may be representative static copy, but its placement, hierarchy and affordances must be testable.

## 13. EXPLORE / Analysis workspace
Explore is a workspace, not a second chart engine.

**Now V2 component → V3 → add series → automatic V4 → deliberate V5 when needed → Data/Statistics/POV → Save**.

The transition into V3 preserves the selected V2 component identity and parent index context. Returning from V3 returns to that V2 index context; returning again returns to Market.

## 14. Statistics and correlation
Statistics are tied to exact analytical state. Correlation is a first-class artifact containing series pair, coefficient, range, alignment/frequency, observation count, transformation, method and appropriate visualization. Correlation is association, not causation.

## 15. AI POV
POV is an interrogable argument grounded in exact active evidence state. Changing series, horizon/range or transformation makes prior POV stale until re-evaluated. Challenges are tested against evidence.

The AI layer must be represented during UX design, not bolted on after chart implementation. At minimum the user must be able to see a concise **What changed / Why it matters** interpretation and expand into evidence/deeper interrogation without permanently reducing the chart surface.

## 16. LIBRARY
Library is persistent living research, not favorites/archive. Omnisearch, saved/recent analyses and New Analysis live here. Saving preserves series, chart/horizon/range/axis state, provenance, statistics/correlations, POV/interrogation and recoverable history.

## 17. Share / download / print
**Share** = polished read-only point-in-time snapshot. **Download** = report/evidence including exact data export. **Print** = deliberately formatted human-readable report.

## 18. HEALTH and CONFIG
Health exposes evidence freshness, source/provider, collection state, coverage, observation counts, provenance/revisions, horizon readiness, missing periods and pipeline failures/status. Config is separated at the bottom and contains provider/model/application settings.

## 19. Backend contract
Data Catalog defines canonical source series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations and deterministic horizon records. Browser UI does not reacquire Yahoo/FRED data. Derived products remain traceable to canonical observations.

## 20. Gate 2 chart acceptance artifact
The standalone five-view HTML acceptance artifact proved the rudimentary common chart mechanics against real canonical evidence.

Owner review has established sufficient confidence in:
- all seven horizon mechanics
- axes and time geometry at the acceptance level
- single-series crosshair/point inspection
- V1–V5 chart-state feasibility
- dual-axis / Indexed-100 mechanics
- mixed-frequency line termination

Gate 2 is therefore treated as a **mechanics proving surface**, not the product UI. Further layout polishing in the isolated acceptance harness is not the primary path forward.

### QA-overlay presentation contract
Acceptance/debug instrumentation must not distort the production chart surface being judged. Redlines, diagnostic labels, freshness diagnostics, axis/mode explanations, matrix state, implementation metadata and other QA-only material live **behind a QA badge/control** and are hidden in the normal product presentation.

## 21. Gate 3 — UX Journey Prototype
Gate 3 is a lightweight, navigable, portrait-mobile-first prototype that reuses proven chart mechanics but intentionally avoids backend or production-scale expansion.

Its purpose is to answer:

> **What does the user see, understand, tap, and arrive at from Market → Index → Component → comparison/exploration → AI interpretation on a portrait phone?**

### Gate 3 constraints
- target a small mockup, not a 10–20K-line application build
- no backend expansion
- no new chart engine
- no premature persistence/auth/config implementation
- representative/static AI copy is acceptable
- representative chart data is acceptable where needed for navigation/layout testing
- default surface must look like the intended product, not a QA harness
- QA instrumentation remains behind a QA control

### Required journey
The prototype must make this path tangible on a portrait phone:

**Market → Risk → component → back to Risk → Growth → component → compare two series → interpretation/evidence → back to Market**

At every state the user should be able to answer immediately:
- Where am I?
- What am I looking at?
- Why does it matter?
- What can I do next?

### Mobile four-panel principle
The conceptual four-panel vision does **not** require four simultaneous physical panels on portrait mobile. Mobile uses progressive disclosure: one dominant analytical/context surface at a time, with secondary interpretation/evidence/actions available through compact cards, drawers/sheets, or other deliberate navigation. Gate 3 exists to determine the correct treatment before full application assembly.

## 22. Build gates
**Gate 1 — Plan: APPROVED.** Canonical product/chart contract.

**Gate 2 — Chart mechanics: SUFFICIENT TO ADVANCE.** The real-data five-view common-engine artifact demonstrated the rudimentary mechanics. It remains a reference/QA surface, not the target product layout.

**Gate 3 — UX Journey Prototype: ACTIVE.** Build and evaluate the navigable mobile-first product mockup described above. Navigation, context hierarchy, semantic color, AI placement and progressive disclosure are the acceptance focus.

**Gate 4 — Application:** only after Gate 3 UX approval, assemble the production **NOW · EXPLORE · LIBRARY · HEALTH** application with **CONFIG** separated at bottom. Gate 4 may not reinterpret the approved journey contract without first amending this plan.

## 23. Rejected approaches
- treating V1/V2/V3 as a simple sequential slideshow
- leaving V1 Market visually present as competing context after an index has become the active V2 context on portrait mobile
- preselecting Risk/Growth/Macro in the default Market view
- using arbitrary semantic colors for Risk/Growth/Macro
- casual use of red/green/yellow where their conventional meaning is not intended
- deep component drilldown inside Now
- separate simple and Analysis chart engines
- synthetic fourth Market score
- inherited opaque weighted scoring
- browser-side Yahoo/FRED acquisition
- incompatible raw units on one Y-axis
- text-only multi-series legends
- legend wrapping/overlap into a second chart row when stable shorthand can preserve the surface
- all-series crosshair popup
- crosshair/inspection state leaking between components
- non-dismissible point inspection
- chart with no visible Y-axis/ticks/units
- header-only readout disconnected from selected point
- fixed four-label X-axis
- forcing users to configure axes for ordinary V4 comparisons
- making the owner enumerate axis bugs permutation-by-permutation instead of validating the full axis matrix
- stretching/carrying forward lower-frequency series to match a faster series' latest date
- QA/redline instrumentation permanently occupying or changing the production chart layout
- omitting the AI interpretation layer from UX prototyping
- literal four-panel desktop composition forced onto portrait mobile
- continuing to polish the isolated chart acceptance harness after mechanics are sufficient to evaluate in product context
- deferring navigation/context behavior to late development
- Library as static archive
- Health conflated with Config
