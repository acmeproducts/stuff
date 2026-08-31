# Market View — V1–V5 Chart Acceptance Matrix

Status: REQUIRED GATE-2 ACCEPTANCE
Date: 2026-08-29

This document captures the owner screenshot review and converts it into a complete chart-engine acceptance contract. The owner is not responsible for discovering the remaining chart defects one combination at a time.

## 1. Screenshot review — defects visible now

The supplied Android screenshots are a hard fail for Gate 2 for more than one reason.

### A. X-axis / horizon geometry is wrong
The screenshot is explicitly set to **5D**, yet the X-axis spans approximately **Jun 30 → Aug 28**. A selected horizon must own the chart window. Individual slow-frequency series must never expand that window.

Correction:
- one common horizon clock for the entire analytical object
- 5D = five market sessions / a narrow current-market window, not the union of component publication dates
- 1D, 1M, YTD, 1Y, 3Y and 5Y follow the same rule
- every V1–V5 chart receives its X-domain from the common horizon engine
- a sparse monthly/weekly series can terminate before the right edge or have no in-window observation; it cannot pull the axis backward

### B. Sparse-series rendering is visually misleading
In V1 and V2, slow-frequency components are creating long flat/partial stretches and then abrupt activity near the right edge. This makes the normalized chart look like missing information is a real flat market path.

Correction:
- source lines contain only real source observations
- no fabricated daily points
- no silent visual carry-forward of source lines
- V2 may show an explicit baseline marker at the horizon boundary for normalization, but the source observation date used for that baseline must remain known and must not be represented as a newly published observation
- derived V1 indices may use the documented composite carry-forward rule internally, but V1 must disclose that it is a derived composite rather than a source series

### C. V1/V2 product relationship is represented incorrectly by the harness
The screenshots show V1 Market and V2 Index as peer top-level demo tabs. In the actual product they are simultaneous sections of **Now**:
- V1 remains visible above
- selecting Risk/Growth/Macro changes V2 below
- only a V2 component launches V3/Explore

Correction:
- the final Gate-2 acceptance surface must include a **Now composition mode** that renders V1 and V2 together
- V1/V2 can still be isolated internally for engine testing, but the primary acceptance state must prove their actual relationship

### D. Chart-to-chrome ratio is poor on phone
The screenshots devote substantial vertical space to artifact title, V1–V5 test buttons, load status, horizon buttons, chart state cards and duplicated explanatory text. The chart itself is pushed down and reduced.

Correction:
- test-only controls are visually secondary/collapsible
- production-facing V1/V2 composition leads with chart + POV, not acceptance-harness chrome
- chart title/legend/horizon controls remain compact
- metadata belongs below or in details, not between the user and the graph

### E. Axis labels are technically present but not yet product-grade
The Y-axis numbers are visible in the screenshots, but the axis treatment is still weak:
- unit context is separated from tick values
- right-side Y2 geometry has not been proven on phone
- tick precision is not measurement-aware
- Indexed-100 ranges can become visually overprecise without a meaningful reference marker

Correction:
- Y1/Y2 must show unit/series identity adjacent to the axis
- percentage, spread, price, index and rate families use measurement-aware precision
- Indexed-100 charts include a visually meaningful 100 reference line when 100 lies within the visible domain
- dual axes use stable series colors for axis title/ticks and cannot visually imply a shared magnitude scale

### F. Point inspection still needs acceptance in the real phone layout
The previous all-series popup is rejected. The accepted model is one active series / one real point. That behavior has not yet been proven across all five views and all axis modes on Android.

Correction:
- select series by line or pill
- snap to nearest real observation on that series
- one vertical guide
- one point marker
- one adjacent value tag
- one X-axis date marker
- explicit dismiss via ×, outside tap, Escape where available
- no all-series card
- changing view/horizon/context/series clears inspection

## 2. One common axis engine

Every view uses the same three-axis model:

### X — time
Owned exclusively by the selected horizon. Never derived from union/min/max of plotted series observations.

### Y1 — primary value axis
Always present and visible.

### Y2 — secondary value axis
Present **only** when exactly two incompatible native measurement families are being compared in dual-axis mode.

No chart may invent a Y2 simply because two series exist. No chart may omit Y2 when the selected representation requires it.

## 3. Horizon contract — all views

| Horizon | X-domain contract | Tick intent |
| --- | --- | --- |
| 1D | current/most recent supported market session; if canonical data is daily-only, explicitly state no intraday evidence | session/date appropriate to evidence |
| 5D | five market sessions ending at common market anchor | trading-day labels |
| 1M | one calendar month ending at common market anchor | weekly/date landmarks |
| YTD | Jan 1 → common market anchor | month landmarks |
| 1Y | one year → common market anchor | roughly monthly |
| 3Y | three years → common market anchor | quarter/year-aware |
| 5Y | five years → common market anchor | sparse quarter/year-aware |

Hard rule: no horizon may expand because a component is monthly, weekly, stale or missing.

## 4. V1 — Market solution

Purpose: derived Market container showing Risk, Growth and Macro together.

Required:
- always Indexed 100 on Y1
- no Y2
- common horizon X-axis
- 100 reference line when visible
- Risk/Growth/Macro stable colors
- derived-series disclosure
- V1 remains visible when a Risk/Growth/Macro context is selected
- selection controls V2 rather than navigating away
- single-series point inspection applies to the selected derived line only

Failure conditions:
- V1 disappears when Risk/Growth/Macro selected
- source-frequency artifacts stretch X-axis
- synthetic fourth Market score appears
- all-series point popup appears

## 5. V2 — Index solution

Purpose: all components of selected Risk/Growth/Macro index.

Required:
- persistent below V1 in Now
- oriented Indexed-100 Y1
- no Y2 in canonical V2 because the comparison representation is Indexed 100
- common horizon X-axis identical to V1 when V1/V2 share the Now horizon
- slow-frequency components do not extend X-axis
- source freshness/latest observation available
- visually distinguish lack of a new in-window observation from a real flat path
- component pill launches V3 on that exact series
- one selected component point at a time

Failure conditions:
- V2 treated as peer navigation tab in final Now acceptance
- components plotted in incompatible raw units on one axis
- monthly component generates fake daily line
- baseline source date is presented as a fresh observation

## 6. V3 — Component solution

Purpose: definitive single-series chart in Explore.

Required:
- one series
- native Y1 with native units
- no Y2
- full common-horizon X-axis
- line terminates at latest actual observation if source is stale/low frequency
- nearest-real-observation point inspection
- exact native value + exact source date
- all seven horizons
- if 1D evidence is only daily, explicitly show that limitation rather than invent intraday geometry

Failure conditions:
- Indexed values shown as if native
- Y-axis missing units
- crosshair can land on fabricated/interpolated dates

## 7. V4 — Multi-series paved-road solution

Automatic representation:
1. one series → V3/native Y1
2. 2+ compatible native-unit series → shared native Y1
3. exactly two incompatible native measurement families → native Y1 + Y2
4. 3+ incompatible measurement families → Indexed-100 Y1

Required:
- automatic mode re-evaluates whenever series change
- common X-axis never changes because series are added/removed
- Y1/Y2 assignment is deterministic
- dual Y1/Y2 axis title/ticks match series colors
- no third raw measurement family allowed in dual mode
- 100 reference line in Indexed mode where visible
- 2, 5 and 7 series stress cases
- legend remains usable on phone
- point inspection remains one active series only

Required concrete tests:
- WTI + Brent → one native $/barrel Y1
- CPI + Core CPI → one native percentage-family Y1
- CPI + WTI → CPI Y1 + WTI Y2 (or deterministic inverse assignment), native values
- CPI + WTI + VIX → Indexed-100 Y1, no Y2
- seven mixed Risk components → Indexed-100 Y1, no Y2

## 8. V5 — Explore deliberate solution

Purpose: same engine with explicit analytical representation control.

Required:
- Auto behaves exactly as V4
- Native common-axis option only enabled for compatible units
- Dual option only valid for exactly two incompatible measurement families
- Indexed option valid for 2+ series
- invalid choices are disabled/rejected, never silently misrendered
- changing representation does not change X horizon
- Data/Statistics/POV consume the exact same analytical object
- chart transformation does not silently change statistical transformation

## 9. Y-axis rules

### Native Y1
- domain derived only from visible in-window real values
- sensible padding
- measurement-aware formatting
- unit explicitly named
- zero is not forced unless analytically appropriate

### Indexed-100 Y1
- display state explicitly says `Indexed 100`
- first valid normalization point = 100 according to canonical definition
- 100 reference line if it intersects visible domain
- point inspection exposes indexed value and native evidence where applicable

### Native dual Y1/Y2
- exactly two incompatible families only
- each axis independently scaled
- each axis explicitly names its series/unit
- color identity ties line ↔ legend ↔ axis ↔ selected point
- axis domains may differ; UI never implies equal absolute magnitudes from equal vertical positions

## 10. 105-state mandatory audit

Before owner retest, run and record:

**5 views × 7 horizons × 3 axis checks = 105 required axis checks.**

For every state:
- X domain start/end matches horizon contract
- X ticks are width/horizon appropriate
- plotted points fall inside X domain
- Y1 exists
- Y1 unit/representation is correct
- Y1 ticks/domain are finite and readable
- Y2 presence/absence is correct
- if Y2 exists, its series/unit/color/domain are correct
- no source series changes X geometry

This is the minimum matrix, not the entire visual QA.

## 11. Additional visual/interaction audit beyond the 105 axes

Also required before owner retest:
- phone portrait
- tablet portrait/landscape where available
- V1 + V2 simultaneous Now composition
- 1, 2, 5, 7 series
- sparse monthly + daily mixtures
- stale/missing series
- selected point near left/right/top/bottom edges
- point-tag collision handling
- crosshair dismissal
- legend wrapping and hit targets
- chart does not require horizontal page scrolling
- controls do not consume disproportionate chart space

## 12. Owner retest gate

Do not return the artifact for owner testing merely because a reported defect was patched.

Return it only when:
1. the 105-axis matrix passes,
2. the V1–V5 view-specific tests above pass,
3. the Android phone composition has been visually checked,
4. no known chart defect is being intentionally handed to the owner to discover.

The owner is the product acceptance reviewer, not the exploratory QA process.