# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-30

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application frame and navigation
- **Left:** collapsible navigation rail for **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at the bottom.
- **Right:** analytical working panel; collapsed rail yields essentially full screen width.

The working panel is a compact workspace, not a dashboard-card stack.

## 3. Canonical horizons
**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. Now defaults to **5D**. The seven controls appear exactly once and use enlarged readable/tappable mobile typography and targets.

## 4. One chart engine / one visual contract
There is exactly one canonical chart engine. V1/V2 and Analysis are states of the same engine, not separate implementations.

Common everywhere: persistent series identity, typography/lines, geometry, horizon logic, visible axes/ticks/units, single-series inspection, legend grammar, missing-data treatment, normalization, provenance/status, touch behavior and evidence fidelity.

## 5. Derived analytical indices
Canonical definition: `data/market-backend/derived-index-definition.json`.

Three derived indices only: **Risk, Growth, Macro**. Market is a container, not a fourth score or selectable trendline.

Semantic index colors: **Risk red · Growth blue · Macro white/neutral**. Ordinary components use a non-semantic comparison palette.

## 6. Analytical states

### V1 — Market
Risk, Growth and Macro trendlines appear together, rebased to 100. No index is selected by default.

H1: **`Market: <sentiment>`** relative to selected horizon.
Legend: compact `RSK / GRW / MAC`.

Tapping a V1 index legend chip remains the deliberate drill-down to V2 for that index.

### V2 — Index + components
V2 must render **the selected derived index trendline itself plus every component defined for that index**. The index line is the reference context against which component movement is interpreted. No defined component may silently disappear; unavailable evidence is explicitly exposed.

H1: actual index name + horizon-relative sentiment, e.g. **`Growth: <sentiment>`**.

Component/index legend labels use stable three-character abbreviations wherever practical. Tapping a V2 component chip **does not navigate away**: it opens the About card for that exact component. The About card's explicit **More info** action opens a new standalone Analysis tab rooted at that component.

### V3 — Analysis: one or many series
Analysis begins with the selected/root component and is inherently additive. One-series and multi-series investigation are the same UX state.

Legend: `[series ×] … [+]`; sole/root series may suppress `×`.

Adding series does not create a V4 page. Custom multi-series breadcrumb leaf is compactly represented as **`<root component> + Custom`**; full parent/index context remains in application state/About/provenance without forcing overflow into the ribbon.

## 7. Unit-family and axis assignment
Axis assignment is determined by compatible unit families, not number of series:
1. one compatible unit family → one native Y-axis
2. exactly two compatible unit families → two native Y-axes
3. more than two incompatible unit families → normalized representation such as Indexed 100 rather than a third native axis

## 8. Legend identity and About-card navigation
The legend is designed for maximum visible series density without routine horizontal scrolling.

Rules:
- abbreviate labels to **three characters wherever practical**; stable abbreviations are authoritative UI identities while full names remain in About/provenance
- V1 `RSK / GRW / MAC` tap drills Market → selected V2 Index
- V2 and Analysis chip tap opens an in-context **About card** rather than navigating
- About answers: What is it? How is it used here? Why does it matter?
- About has explicit close/outside dismissal
- **More info** is the deliberate escape hatch: open a new standalone Analysis tab for the exact clicked series
- no V2 component chip directly spawns a new tab

This standardizes navigation: broad-context V1 drill-down is direct; component-level departure is deliberate through About → More info.

## 9. Canonical point inspection
Inspection is transferable between visible series. A tap near a visible line chooses that series and its nearest **real observation**.

One contextual popup located at/near the selected observation contains **series · date · value · unit**. Do not split the date into a separate X-axis label. Render one vertical guide and one marker at the actual observation coordinates. A subsequent tap on another line immediately transfers inspection to that line/observation.

No all-series popup. Inspection clears before context/horizon/series-set changes. Android touch is first-class.

## 10. Axis and time contract
Every chart has visible Y-axis/ticks/unit and horizon-correct X-axis. Axis QA remains matrix-based across analytical states × seven horizons × X/Y1/Y2.

Horizon semantics follow `data/market-backend/data-catalog.json`; 1D/5D use applicable observations/trading sessions rather than calendar approximations.

## 11. Data fidelity and mixed frequency
Each direct Analysis line terminates at its own latest real observation. Slower-frequency sources are never stretched/carried forward to match faster sources. Selected point, Data, Statistics, AI and export reconcile to canonical evidence.

**CPI versus WTI remains the mandatory Gate 4 mixed-frequency acceptance case.**

Derived-index construction may use the explicit composite-timestamp rule in `derived-index-definition.json`; that rule must never leak into direct Analysis as fabricated source observations.

## 12. Three-row analytical top ribbon
The previous two-row ribbon is retired.

### Row 1 — H1 context
Large clear header naming the current analytical level plus horizon-relative sentiment:
- `Market: <sentiment>`
- `Growth: <sentiment>`
- `Payroll: <sentiment>`

### Row 2 — compact breadcrumbs
Breadcrumbs occupy their own row so they never compete with horizon controls. Use compact `/` separators and concise semantic lineage:
- `Market`
- `Market / Growth`
- `Market / Growth / Payroll`
- custom Analysis leaf: `Payroll + Custom`

Breadcrumbs are interactive. Labels compact/truncate only as a last resort; the naming convention is intentionally short enough to remain inside the top ribbon on mobile.

### Row 3 — horizon + More
The seven horizons are enlarged for readability/touch and remain geometrically centered. `…` More remains at far right.

More contains distinct actions:
- Add to Analysis
- Add/Save to Library
- Print
- Download

## 13. Add Series modal
The flat picker is retired.

Modal header/action controls remain visible at the **top**, including Add/Done/Close as applicable, so actions never disappear below a long suggestion list.

Categorized tabs:
- **Market** — Risk, Growth, Macro as individually selectable index series. Market itself is only the tab/container and is **not** selectable as a fourth series.
- **Risk** — Risk index itself + all Risk components
- **Growth** — Growth index itself + all Growth components
- **Macro** — Macro index itself + all Macro components
- **Other** — canonical enabled series not constituents of any of the three indices

Current confirmed Other outliers: **Brent, Gold, 2-Year Treasury, 30-Year Treasury, 10Y–2Y Treasury spread, Real GDP**. Membership is derived from catalog minus the union of index constituents, not hard-coded permanently.

Search remains available and works across tabs/canonical identities. Multi-select remains supported.

## 14. AI POV and operational conversation — active Gate 4 functionality
AI is no longer a gated placeholder.

AI POV is grounded in the exact active canonical evidence state and selected horizon. It provides concise **What changed / Why it matters**. `ⓘ` exposes sources, latest observation dates, cadence, units, methodology, normalization/axis decisions, provenance and relevant QA state.

The persistent composer is operational and interrogates the same exact evidence context. Series/horizon changes invalidate/stale the prior POV until re-evaluated.

### Provider/config contract
CONFIG adopts the proven `devstream-test.html` pattern:
- Venice.ai
- OpenRouter
- Anthropic direct
- API keys stored only in browser local storage
- provider keys are cleaned/normalized before use
- model discovery where supported
- **real provider/model validation call at point of entry before configuration is accepted as functional**
- clear validation success/failure status
- provider/model can be switched from the persistent chat compose strip
- selected provider/model is used for POV and conversation calls

No key is committed to repository evidence.

## 15. LIBRARY — active Gate 4 functionality
Add/Save to Library is operational, not a placeholder. Saved research state preserves at minimum: analytical lineage, root/added series set, horizon/range, axis/normalization state, canonical observation/provenance references, POV/conversation context sufficient to resume, and save timestamp/version.

Library can reopen a saved analysis into the same analytical state.

## 16. Statistics and correlation
Statistics bind to exact analytical state. Correlation records series pair, coefficient, range, alignment/frequency, observation count, transformation and method. Correlation is association, not causation.

## 17. Share / download / print
Download = report/evidence + exact data. Print = formatted report. These remain secondary More-menu actions and reconcile to exact active evidence state.

## 18. HEALTH and CONFIG
Health exposes freshness/source/collection/coverage/provenance/readiness/failures. Config remains separated at bottom of left rail and contains operational AI provider configuration described above.

## 19. Backend contract
Data Catalog defines canonical series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations/horizon records. Browser does not reacquire Yahoo/FRED evidence.

Gate 4 consumes canonical repository evidence directly; it does not create browser-side replacement acquisition paths.

## 20. Gate 3 — UX Journey Prototype
**Status: APPROVED / ACCEPTED.**

Approved corrective POC: `market-view-ux-gate3-p2.html`, commit **`cfba7320e42028f09f2967304cb0c0dd0cc2988d`**.

Gate 3 established the additive Analysis interaction model, multi-select picker, unit-family routing, chart journey and persistent analytical footer. Subsequent Gate 4 owner decisions supersede its two-row ribbon and direct V2 component-navigation details as explicitly documented in this plan.

## 21. Gate 4 — complete application build
**Status: ACTIVE — REPLACEMENT RELEASE REQUIRED.**

Rejected first slice `market-view-gate4.html` commit `38a35279f4aea9c99d6fcb70518e06c31371cf3e` is recorded in `MARKET-NAVIGATOR-GRAVEYARD.md` and is **not** the patch-forward product baseline.

### Governed lineage
**Current Market Navigator 3 (`market-view.html`) application/runtime foundation + approved Gate 3 POC interaction model + approved three-row ribbon/footer decisions + canonical backend evidence.**

The replacement release must preserve/reconcile required Market Navigator 3 application capabilities rather than becoming another POC-only rewrite.

### Nothing else is gated
Gate 4 is an application assembly gate, not another chart-only prototype. The release includes operational Library, AI POV, AI chat/composer, CONFIG/provider validation/model switching, Health/Explore surfaces required by the application contract, and real canonical evidence integration.

### Mandatory Gate 4 acceptance
- V1 Market renders RSK/GRW/MAC across all horizons without silently missing an index line
- V1 legend tap drills to V2
- V2 renders selected index trendline **plus every defined component**
- V2 component tap opens About; About → More info opens exact component Analysis tab
- V3 additive Analysis from real canonical source records
- compact three-character legend identities wherever practical
- three-row ribbon with H1, compact breadcrumb row, enlarged seven-horizon row
- transferable crosshair with one combined series/date/value/unit popup at actual observation
- real mixed-frequency CPI + WTI demonstration
- independent source endpoints and actual observation dates
- one/two-axis unit-family behavior and Indexed-100 fallback
- categorized Add Series modal `Market | Risk | Growth | Macro | Other`, top-pinned actions, multi-select/search
- operational Add/Save to Library and state restoration
- operational AI POV and grounded chat
- CONFIG patterned after `devstream-test.html`: Venice/OpenRouter/Anthropic, key/model validation and compose-strip switching
- Health/source failures and provenance surfaced rather than silently omitted
- no browser reacquisition of canonical Yahoo/FRED evidence
- no prototype-only/synthetic curves in analytical path
- systematic mobile/desktop QA across analytical states × seven horizons × X/Y1/Y2 and interaction paths

## 22. Rejected approaches
See `MARKET-NAVIGATOR-GRAVEYARD.md` for governed rejected lineages. Product-level prohibitions include:
- patching forward rejected Gate 3 or Gate 4 descendants
- chart/navigation-only Gate 4 releases while Library/AI/Config remain placeholders
- breadcrumbs sharing the horizon row
- verbose breadcrumb labels that cause ribbon overflow
- direct V2 component legend navigation that bypasses About
- V2 components without selected index reference line
- incomplete index component sets
- flat Add Series list and bottom-hidden modal actions
- Market treated as a fourth selectable trendline
- all-series or locked-series crosshair
- split date/value inspection labels
- distinct V4 comparison page/mode
- arbitrary series-count limits or third/fourth native Y-axes
- repeating horizon controls
- card-stack analytical composition
- duplicate index selector cards
- separate chart engines
- incompatible raw units silently sharing one axis
- missing axes/ticks/units
- stretching slower-frequency direct Analysis series
- omitting AI interpretation/conversation from the application
