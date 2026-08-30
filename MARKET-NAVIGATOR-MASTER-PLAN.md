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

The working panel is a compact workspace, not a dashboard-card stack: two-row ribbon, legend/chart evidence body, AI interpretation and a persistent AI conversation/composer surface.

## 3. Canonical horizons
**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. Now defaults to **5D**. Horizon appears exactly once in ribbon row 2.

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

Ribbon row 1 becomes **`Risk/Growth/Macro: <sentiment>`**. Component legend is the direct interaction surface. Selecting a component opens Analysis on that exact series.

### V3 — Analysis: one or many series
V3 is the canonical Analysis workspace. It begins with the component selected from V2 but is inherently additive: **one series and multi-series investigation are the same UX state.**

The former distinct V4 comparison state is collapsed into V3. Adding a second, third or sixth series does not create a new mode or page; the Analysis chart simply expands.

The legend is the series-management control:
- each represented series is a chip
- a **`+` icon sits at the end of the legend**
- tapping `+` opens a searchable/selectable series-picker modal containing canonical series not already represented
- no artificial series-count limit is imposed by the UX
- added series appear immediately as legend chips and chart lines
- each removable chip contains `×`; tapping it removes that series and recomputes the chart
- the sole/root series may suppress `×` where removal would leave an invalid empty analysis
- there is no separate Compare button and no side-by-side comparison-dropdown header

V3 retains the parent index context that initiated the investigation even after additional series are added.

### V4 — retired as a distinct UX state
V4 survives only as historical/acceptance vocabulary for multi-series mechanics. It is not a separate user-facing state. Its capabilities are absorbed into V3 Analysis.

### V5 — deliberate analytical transformations
V5 remains conceptual shorthand for deliberate transformation choices within Analysis when required. It is not a separate chart engine.

## 7. Unit-family and axis assignment
Axis assignment is determined by **compatible unit families, not number of series**.

Automatic rule:
1. one compatible unit family → one native Y-axis
2. exactly two compatible unit families → two native Y-axes, regardless of series count
3. more than two incompatible unit families → normalized representation such as Indexed 100 rather than a third native axis

Six series are valid on two native Y-axes when, for example, three share `%` and three share `$`. Adding/removing any series immediately re-evaluates unit families and axis representation.

## 8. Series identity, legend and contextual help
Every series has a stable visual identity shared by line, legend chip, selected point/value and corresponding axis label.

Legend sits directly above chart and is both identity and series management. In Analysis it follows:
**`[series ×] [series ×] … [+]`**.

Dense legends may horizontally scroll/compact rather than wrap into chart space. Stable three-letter shorthand is allowed; full identity remains available contextually.

### Legend chip help
Hover/mouse-over on pointer devices, and an equivalent deliberate touch interaction on mobile, exposes a **brief contextual popover** for the series. It answers:
- **What is it?** concise definition
- **How is it used here?** role in the current index/analysis
- **Why does it matter?** analytical relevance
- **More →** opens a new browser tab containing a standalone Analysis workspace for **that exact clicked series**

The popover is concise and dismissible. It has an explicit close control and may also dismiss by tapping/clicking outside. It does not become permanent chart chrome.

## 9. Canonical point inspection
Crosshair inspects one series and one real observation at a time: active line/chip → nearest real observation → vertical guide → one marker → one value tag → one X-axis date marker. No all-series popup. Inspection clears before any context/horizon/series-set change renders.

Android touch is first-class.

## 10. Axis and time contract
Every chart has visible Y-axis/ticks/unit and horizon-correct X-axis. Axis QA remains matrix-based across applicable analytical states × seven horizons × X/Y1/Y2.

No fixed four-label shortcut. Rendering optimization may not change canonical observations used by inspection/Data/Statistics/AI/export.

## 11. Data fidelity and mixed frequency
Each line terminates at its own latest real observation. Slower-frequency sources are never stretched/carried forward to match faster sources. Selected point, Data, Statistics and export reconcile to canonical evidence.

### Mandatory real-data validation — mixed-frequency chart behavior
The application build must prove the production treatment of mixed-frequency evidence with canonical observations.

Required case: a daily series and a monthly series on the same analytical chart. The implementation must demonstrate:
- common time axis without fabricated observations
- monthly line ending at its actual latest release
- daily line continuing to its own later/latest observation
- inspection snapping only to real observations for the active series
- no interpolation/carry-forward merely to make visual endpoints align
- readable geometry when one series has dramatically fewer observations than another

**CPI versus WTI is the canonical acceptance example.** This is a Gate 4 release blocker until demonstrated.

## 12. Workspace composition
Right panel:

### Ribbon row 1
Active context + sentiment.

### Ribbon row 2 — fixed three-zone navigation/control row
The row is spatially fixed rather than content-centered:

**far-left Breadcrumbs | fixed centered Horizon | far-right More (`…`)**

The horizon group remains geometrically centered in the ribbon regardless of breadcrumb width or More-menu width. Breadcrumbs occupy the left zone and truncate/scroll rather than pushing the horizon off center. `…` is anchored at the far right.

Canonical analytical breadcrumb lineage is:
- `Market`
- `Market > Risk` / `Market > Growth` / `Market > Macro`
- `Market > Risk > VIX` (equivalent index/component combinations)

`Now` is **not** part of the analytical breadcrumb path. Breadcrumb segments are interactive navigation; the current leaf is not required to be interactive.

The centered horizon remains `1D · 5D · MTD · YTD · 1YR · 3YR · 5YR`.

The `…` More menu contains distinct secondary actions:
- **Add to Analysis** — modifies the active Analysis series set / invokes series selection; it does not save anything
- **Add/Save to Library** — persists the current research state; it does not modify the active series set
- Print
- Download

These commands must remain semantically and behaviorally separate even while prototype persistence is incomplete.

**Divider**

### Legend / series management
V1/V2 interactive identities; Analysis `[series ×] … [+]`.

### Chart
Canonical evidence surface.

**Divider**

### AI POV
What changed / Why it matters. An unobtrusive **information (`ⓘ`) control lives here**.

The information surface is collapsed by default and may contain:
- user-useful depth: sources, latest observation dates, cadence, units, methodology, normalization/axis decisions, provenance
- QA/developer depth: diagnostics, freshness/matrix status, implementation metadata and other acceptance instrumentation

**Divider**

### Persistent AI conversation/composer surface
The bottom surface is reserved for **discussion with the AI POV**, not navigation buttons.

It provides the compose affordance for interrogating/challenging the current POV and evidence state. The composer remains tied to the exact current analysis context.

Back/navigation belongs in breadcrumbs; Save and other document actions belong in `…`.

## 13. EXPLORE / Analysis journey
**Market → Index → component opens V3 Analysis → `+` adds additional series → chips remove series → AI discussion / Data / Statistics / POV → Save.**

Breadcrumbs preserve and expose the current lineage throughout.

## 14. Statistics and correlation
Statistics bind to exact analytical state. Correlation records series pair, coefficient, range, alignment/frequency, observation count, transformation and method. Correlation is association, not causation.

## 15. AI POV and conversation surface
POV is grounded in exact active evidence state. Series/horizon/transformation changes make prior POV stale until re-evaluated.

The AI area exposes concise interpretation first. `ⓘ` expands deeper evidence/methodology/QA information. The persistent bottom composer allows the user to interrogate the POV without leaving the analytical workspace.

## 16. LIBRARY
Library is living research. Saving preserves series set, chart/horizon/range/axis state, provenance, statistics/correlations, POV/interrogation and recoverable history.

## 17. Share / download / print
Share = polished snapshot. Download = report/evidence + exact data. Print = formatted report. These are secondary workspace actions exposed from the ribbon More menu rather than consuming the analytical body.

## 18. HEALTH and CONFIG
Health exposes freshness/source/collection/coverage/provenance/readiness/failures. Config remains separated at bottom of left rail.

## 19. Backend contract
Data Catalog defines canonical series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations/horizon records. Browser does not reacquire Yahoo/FRED evidence.

Gate 4 consumes canonical repository evidence directly; it does not create browser-side replacement acquisition paths.

## 20. Gate 2 chart mechanics
Gate 2 proved sufficient rudimentary chart mechanics and remains a QA/reference surface rather than product UI.

## 21. Gate 3 — UX Journey Prototype
**Status: CORRECTIVE POC PATCH ACTIVE.**

### Governed implementation baseline
The next POC is rebuilt from `market-view-ux-gate3.html` at commit **`5db1363447c70d5dd3bb5f1f6d03204af34b6eb7`**. The deficient descendant is recorded in `MARKET-NAVIGATOR-GRAVEYARD.md` and is not a patch-forward baseline.

### Gate 3 corrective patch — G3-P2
Apply the following bounded patch to that restored baseline:
1. Add the two-row ribbon without changing the underlying analytical journey.
2. Ribbon row 2 uses fixed spatial zones: breadcrumbs far left, seven horizons fixed and geometrically centered, `…` far right.
3. Correct breadcrumb semantics to `Market > Index > Component`; never `Now > …`.
4. Add legend contextual help while preserving the clicked series identity.
5. Legend help includes an explicit close control plus outside-dismiss behavior.
6. Legend help `More` opens a standalone Analysis view for the exact clicked series; it must not route to an unrelated/root series.
7. Add the persistent bottom AI composer/footer ribbon without reinstating Back/Save navigation buttons.
8. More-menu `Add to Analysis` and `Add/Save to Library` are distinct controls with distinct behavior; they may not alias the same action.
9. Preserve the restored baseline's additive Analysis, multi-select picker, unit-family routing, chart geometry and point-inspection mechanics except where this patch explicitly changes them.
10. Prototype curves may remain synthetic for this Gate 3 review; missing/placeholder evidence is not a reason to alter the UX baseline.

Gate 3 remains a reviewable POC until this corrective patch is accepted.

## 22. Gate 4 — Application build
**Status: PAUSED PENDING CORRECTED GATE 3 POC ACCEPTANCE.**

After Gate 3 corrective POC acceptance, build the governed application surface using canonical repository evidence rather than prototype curves. Assemble **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated in the left rail.

Mandatory Gate 4 build acceptance:
- V1 Market and V2 Index from canonical derived-index definition
- V3 additive Analysis from real canonical source records
- real mixed-frequency CPI + WTI demonstration
- independent source endpoints and actual observation dates
- one/two-axis unit-family behavior and Indexed-100 fallback
- real-observation point inspection
- legend `+`/`×` management and contextual help
- corrected breadcrumbs, fixed-centered horizon and More row
- AI POV/info placement and persistent composer
- no prototype-only chart geometry or synthetic curves in the analytical path

## 23. Rejected approaches
- patching forward from the deficient post-`5db1363` Gate 3 descendant
- analytical breadcrumbs rooted at `Now`
- horizon placement that moves because breadcrumb/menu content changes width
- legend help without explicit dismissal
- legend More routing to a series other than the clicked series
- aliasing Add to Analysis with Add/Save to Library
- distinct V4 comparison page/mode after adding series
- separate Compare button
- side-by-side series dropdowns as ordinary comparison UI
- limiting native dual-axis to exactly two series rather than two unit families
- arbitrary series-count limits
- third/fourth native Y-axes
- global QA button in primary ribbon
- bottom Back/Save bar competing with the AI conversation surface
- passive/non-interactive breadcrumbs
- repeating horizon controls
- card-stack analytical composition
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
- omitting AI interpretation/conversation from the application
- forcing desktop four-panel composition onto portrait mobile
- deferring navigation/context behavior to late development
