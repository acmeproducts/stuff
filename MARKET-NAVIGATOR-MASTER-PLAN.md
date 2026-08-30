# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-30

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application frame and navigation
The application frame has two sides:
- **Left:** collapsible navigation rail for **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at the bottom.
- **Right:** analytical working panel; collapsed rail yields essentially full screen width.

The working panel is a compact workspace, not a dashboard-card stack: two-row ribbon, legend/chart evidence body, AI interpretation, bottom actions.

## 3. Canonical horizons
**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. Now defaults to **5D**. Horizon appears exactly once, centered in ribbon row 2.

## 4. One chart engine / one visual contract
There is exactly one canonical chart engine. V1/V2 and Analysis are states of the same engine, not separate implementations.

Common everywhere: persistent series identity, typography/lines, geometry, horizon logic, visible axes/ticks/units, single-series inspection, legend grammar, missing-data treatment, normalization, provenance/status, touch behavior and evidence fidelity.

Prior implementation `1257844` remains an interaction-quality donor.

## 5. Derived analytical indices
Canonical definition: `data/market-backend/derived-index-definition.json`.

Three derived indices only: **Risk, Growth, Macro**. Market is a container, not a fourth score.

Semantic index colors:
- **Risk = red**
- **Growth = blue**
- **Macro = white / neutral**

Red/green/yellow are not generic decoration; use only where their conventional meaning is intentional. Ordinary component series use a non-semantic comparison palette.

## 6. Analytical states

### V1 — Market
Risk, Growth and Macro appear together, rebased to 100. No index is selected by default.

Ribbon row 1: **`Market: <sentiment>`**. Legend immediately above chart contains interactive `RSK / GRW / MAC`. No duplicate selector cards.

Selecting an index transitions to V2.

### V2 — Index
Shows all components of selected Risk/Growth/Macro index using oriented Indexed-100 comparison.

Ribbon row 1 becomes **`Risk/Growth/Macro: <sentiment>`**. Component legend is the direct interaction surface. Selecting a component opens Analysis on that exact series. Back returns to Market.

### V3 — Analysis: one or many series
V3 is the canonical Analysis workspace. It begins with the component selected from V2 but is inherently additive: **one series and multi-series investigation are the same UX state.**

The former distinct V4 comparison state is collapsed into V3. Adding a second, third or sixth series does not create a new mode or page; the Analysis chart simply expands.

The legend is the series-management control:
- each represented series is a chip
- a **`+` icon sits at the end of the legend**
- tapping `+` opens a searchable/selectable series-picker modal containing any canonical series not already represented
- no artificial series-count limit is imposed by the UX
- added series appear immediately as legend chips and chart lines
- each removable chip contains `×`; tapping it removes that series and recomputes the chart
- the sole/root series may suppress `×` where removal would leave an invalid empty analysis
- there is no separate `Compare` button and no side-by-side comparison-dropdown header

V3 retains the parent index context that initiated the investigation even after additional series are added.

### V4 — retired as a distinct UX state
V4 survives only as historical/acceptance vocabulary for multi-series mechanics. It is **not a separate user-facing state**. Its capabilities are absorbed into V3 Analysis.

### V5 — deliberate analytical transformations
V5 remains conceptual shorthand for deliberate transformation choices within Analysis when required (for example Indexed-100 comparison or scientific/statistical transforms). It is not a separate chart engine.

## 7. Unit-family and axis assignment
Axis assignment is determined by **compatible unit families, not number of series**.

Automatic rule:
1. all represented series belong to one compatible unit family → one native Y-axis
2. represented series belong to exactly two compatible unit families → two native Y-axes, regardless of series count
3. represented series span more than two incompatible unit families → use an appropriate normalized representation such as Indexed 100 rather than inventing a third native axis

Therefore six series are valid on two native Y-axes when, for example, three share `%` and three share `$`. Every line is visually tied to its legend identity and corresponding axis family.

Adding/removing any series immediately re-evaluates unit families and axis representation. No axis-configuration ceremony is required for ordinary use.

## 8. Series identity and legend contract
Every series has a stable visual identity shared by line, legend chip, selected point/value and corresponding axis label.

Legend sits directly above chart and is both identity and series management. In Analysis it follows:
**`[series ×] [series ×] … [+]`**.

Dense legends may horizontally scroll/compact rather than wrap into chart space. Stable three-letter shorthand is allowed; full identity remains available in context/info.

## 9. Canonical point inspection
Crosshair inspects one series and one real observation at a time: active line/chip → nearest real observation → vertical guide → one marker → one value tag → one X-axis date marker. No all-series popup. Inspection clears before any context/horizon/series-set change renders.

Android touch is first-class.

## 10. Axis and time contract
Every chart has visible Y-axis/ticks/unit and horizon-correct X-axis. Axis QA remains matrix-based across applicable analytical states × seven horizons × X/Y1/Y2.

No fixed four-label shortcut. Rendering optimization may not change canonical observations used by inspection/Data/Statistics/AI/export.

## 11. Data fidelity and mixed frequency
Each line terminates at its own latest real observation. Slower-frequency sources are never stretched/carried forward to match faster sources. Selected point, Data, Statistics and export reconcile to canonical evidence.

## 12. Workspace composition
Right panel:

**Ribbon row 1:** active context + sentiment.

**Ribbon row 2:** `1D  5D  MTD  YTD  1YR  3YR  5YR`.

**Divider**

**Legend / series management:** V1/V2 interactive identities; Analysis `[series ×] … [+]`.

**Chart**

**Divider**

**AI POV:** What changed / Why it matters. An unobtrusive **information (`ⓘ`) control lives here**, not in the global ribbon.

The information surface is collapsed by default and may contain both:
- user-useful depth: sources, latest observation dates, cadence, units, methodology, normalization/axis decisions, provenance
- QA/developer depth: diagnostics, freshness/matrix status, implementation metadata and other acceptance instrumentation

Thus QA remains available without presenting a developer-looking `QA` button on the primary analytical ribbon.

**Divider**

**Bottom actions:** `Back` when applicable | `Save to Library`.

There is no separate Compare action at the bottom; comparison is initiated by the legend `+`.

## 13. EXPLORE / Analysis journey
**Market → Index → component opens V3 Analysis → `+` adds any additional series → chips remove series → Data/Statistics/POV → Save.**

Returning from Analysis returns to its initiating V2 Index; returning again returns to Market.

## 14. Statistics and correlation
Statistics bind to exact analytical state. Correlation records series pair, coefficient, range, alignment/frequency, observation count, transformation and method. Correlation is association, not causation.

## 15. AI POV and information surface
POV is grounded in exact active evidence state. Series/horizon/transformation changes make prior POV stale until re-evaluated.

The AI area exposes concise interpretation first. `ⓘ` expands deeper evidence/methodology/QA information without permanently consuming chart space.

## 16. LIBRARY
Library is living research. Saving preserves series set, chart/horizon/range/axis state, provenance, statistics/correlations, POV/interrogation and recoverable history.

## 17. Share / download / print
Share = polished snapshot. Download = report/evidence + exact data. Print = formatted report.

## 18. HEALTH and CONFIG
Health exposes freshness/source/collection/coverage/provenance/readiness/failures. Config remains separated at bottom of left rail.

## 19. Backend contract
Data Catalog defines canonical series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations/horizon records. Browser does not reacquire Yahoo/FRED evidence.

## 20. Gate 2 chart mechanics
Gate 2 proved sufficient rudimentary chart mechanics and remains a QA/reference surface rather than product UI.

## 21. Gate 3 — UX Journey Prototype
Gate 3 evaluates the actual application frame and interaction journey.

Current required journey:
**Market → Risk → component → add/remove arbitrary series with legend `+`/`×` → inspect AI/info → back to Risk → Growth → component → build multi-series analysis → Save → back to Market.**

Acceptance focus:
- collapsible left rail/full-width workspace
- two-row ribbon/single horizon control
- legend above chart
- V3/V4 collapsed into one additive Analysis state
- `+` series picker excluding already represented series
- `×` removal chips
- no artificial series-count limit
- automatic one/two-axis assignment by unit-family count, not series count
- >2 unit families normalized rather than adding native axes
- AI POV with `ⓘ` information surface
- no global QA button
- bottom Back | Save grammar

## 22. Build gates
**Gate 1 — Plan: APPROVED.**

**Gate 2 — Chart mechanics: SUFFICIENT TO ADVANCE.**

**Gate 3 — UX Journey Prototype: ACTIVE.**

**Gate 4 — Application:** after Gate 3 UX approval, assemble production NOW · EXPLORE · LIBRARY · HEALTH with CONFIG separated in left rail.

## 23. Rejected approaches
- distinct V4 comparison page/mode after adding series
- separate Compare button to initiate multi-series Analysis
- side-by-side series dropdowns as the ordinary comparison-management UI
- limiting native dual-axis to exactly two series rather than two compatible unit families
- arbitrary UX series-count limits
- third/fourth native Y-axes for >2 incompatible unit families
- global QA button in primary ribbon
- card-stack analytical composition
- repeated horizon controls
- duplicate index selector cards
- explanatory scaffolding consuming chart space
- preselecting an index in Market
- arbitrary semantic index colors
- separate chart engines
- incompatible raw units silently sharing one axis
- text-only legends
- all-series crosshair popup
- crosshair leakage
- missing axes/ticks/units
- fixed four-label X-axis
- stretching slower-frequency series
- QA instrumentation occupying default product layout
- omitting AI interpretation from UX prototyping
- literal four-panel desktop composition forced onto portrait mobile
- deferring navigation/context behavior to late development
