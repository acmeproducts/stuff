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
Risk, Growth and Macro trendlines appear together, rebased to 100. No index is selected by default. Legend `RSK / GRW / MAC`; tapping an index drills directly to V2.

### V2 — Index + components
V2 renders the selected derived index trendline itself plus every component defined for that index. No component may silently disappear; unavailable evidence is explicitly exposed. Component/index legend labels use stable three-character abbreviations wherever practical. Component tap opens About; About → More info opens standalone Analysis for that exact component.

### V3 — Analysis
Analysis begins with the selected/root component and is additive. One-series and multi-series investigation are the same state. Custom breadcrumb leaf is `<root component> + Custom`.

## 7. Unit-family and axis assignment
One compatible unit family → one native Y-axis. Exactly two → two native Y-axes. More than two incompatible families → Indexed 100 rather than a third native axis.

## 8. Legend identity and About-card navigation
V1 index chips drill to V2. V2 and Analysis chips open an in-context About card. About answers What is it / How used here / Why matter and supports close/outside dismissal. More info opens exact clicked series as standalone Analysis.

## 9. Canonical point inspection
Inspection transfers between visible series. Tap near a line chooses that series and nearest real observation. One popup contains **series · date · value · unit**, with one vertical guide and marker at actual observation coordinates. Inspection clears on context/horizon/series-set changes.

## 10. Axis and time contract
Every chart has visible Y-axis/ticks/unit and horizon-correct X-axis. QA is matrix-based across analytical states × seven horizons × X/Y1/Y2. Horizon semantics follow `data/market-backend/data-catalog.json`; 1D/5D use applicable observations/trading sessions rather than calendar approximations.

## 11. Data fidelity and mixed frequency
Each direct Analysis line terminates at its own latest real observation. Slower-frequency sources are never stretched to match faster sources. **CPI versus WTI is mandatory Gate 4 mixed-frequency acceptance.** Derived indices may use the explicit composite-timestamp rule in `derived-index-definition.json`; direct Analysis may not.

## 12. Three-row analytical top ribbon
Row 1: H1 context (`Market: <sentiment>`, `Growth: <sentiment>`, `Payroll: <sentiment>`). Row 2: compact interactive breadcrumbs using `/`. Row 3: enlarged seven horizons centered, More at far right. More contains Add to Analysis, Add/Save to Library, Print, Download.

## 13. Add Series modal
Top/sticky Add/Done/Close controls. Tabs: **Market | Risk | Growth | Macro | Other**. Market contains individually selectable Risk/Growth/Macro; Market itself is not selectable. Risk/Growth/Macro tabs contain index + all components. Other is catalog minus union of index constituents; confirmed outliers: Brent, Gold, 2Y, 30Y, 10Y–2Y spread, Real GDP. Search and multi-select are required.

## 14. AI POV and operational conversation
AI is active Gate 4 functionality. POV and chat are grounded in exact active canonical evidence/horizon. CONFIG follows `devstream-test.html`: Venice.ai, OpenRouter, Anthropic direct; browser-local keys; model discovery where supported; real provider/model validation call before acceptance; provider/model switching in persistent compose strip.

## 15. LIBRARY
Operational Add/Save to Library preserves analytical lineage, series set, horizon, axis/normalization state, evidence/provenance references, POV/conversation resume context and save version/time. Saved analysis reopens into same state.

## 16. Statistics and correlation
Statistics bind to exact analytical state. Correlation records pair, coefficient, range, alignment/frequency, observation count, transformation and method.

## 17. Share / download / print
Download = report/evidence + exact data. Print = formatted report. Both reconcile to exact active evidence.

## 18. HEALTH and CONFIG
Health exposes freshness/source/collection/coverage/provenance/readiness/failures. Config is at bottom of rail and contains operational AI provider configuration.

## 19. Backend contract
Data Catalog defines canonical series. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations/horizon records. Browser does not reacquire Yahoo/FRED evidence.

## 20. Gate 3 — UX Journey Prototype
**Status: APPROVED / ACCEPTED.** Approved POC: `market-view-ux-gate3-p2.html`, commit `cfba7320e42028f09f2967304cb0c0dd0cc2988d`. Gate 4 decisions supersede its two-row ribbon and direct V2 navigation details.

## 21. Gate 4 — complete application build
**Status: ACTIVE — R3 SUCCESSOR REQUIRED.**

Rejected `market-view-gate4.html` commit `38a35279f4aea9c99d6fcb70518e06c31371cf3e` and inert `market-view-gate4-r2.html` commit `141739606b0e2fe61e22ab7fa9b51936c20c8009` are graveyarded and are not patch-forward baselines.

### Governed lineage
**Market Navigator 3.9.7 `market-view.html` runtime/application + approved Gate 3 P2 interaction model + three-row ribbon/footer contract + canonical backend evidence + Devstream provider-validation pattern.** R3 must preserve/reconcile the 3.9.7 application capabilities rather than become another standalone POC rewrite.

### Nothing else is gated
R3 includes operational Library, AI POV, AI chat/composer, CONFIG/provider validation/model switching, Health/Explore, canonical evidence integration, Statistics/correlation, Print and Download.

### Mandatory acceptance
- V1 RSK/GRW/MAC all horizons; V1 legend drills to V2
- V2 selected index line + every defined component; missing evidence explicit
- V2 component About → More info → exact Analysis
- V3 additive Analysis from canonical source records
- three-row ribbon and mobile-safe breadcrumbs/horizons
- transferable crosshair and one combined inspection popup
- CPI + WTI mixed-frequency proof
- unit-family Y1/Y2 and Indexed-100 fallback
- categorized searchable multi-select Add Series
- operational Library restore
- operational AI POV/chat and provider/model switching
- Health/source failures/provenance surfaced
- no browser Yahoo/FRED canonical reacquisition
- no synthetic analytical curves
- systematic mobile/desktop QA across state × horizon × X/Y1/Y2

### Mandatory release validation gate
A Gate 4 release is **not testable and must not be handed to the owner** until all of the following pass:
1. Extract every executable JavaScript block/module from the candidate artifact and run a real JavaScript parser/static syntax check. A parser failure blocks publication.
2. Run an application boot smoke check proving initialization reaches the first render without an uncaught exception. A boot failure blocks publication.
3. Confirm the artifact is reachable at its intended GitHub Pages URL and that its release identity matches the candidate under test.
4. Run structural checks for the three-row ribbon, seven horizons, RSK/GRW/MAC V1 identities, V2 index+component contract, Add Series taxonomy, Library, Health, Config and AI composer/provider controls.
5. Record validation against the exact candidate commit. Do not infer validation from an ancestor, donor, or previous release.

R2's inert handoff is explicitly a release-process failure. The successor must be parser-validated before a test URL is issued.

## 22. Rejected approaches
See `MARKET-NAVIGATOR-GRAVEYARD.md`. Prohibited: patching rejected descendants; chart-only Gate 4 releases; two-row ribbon; direct V2 component navigation; V2 without index reference; incomplete component sets; flat picker/bottom-hidden actions; Market as fourth trendline; locked/all-series crosshair; split inspection; V4 comparison page; arbitrary series limits/third native axis; repeated horizons; card-stack analytical composition; duplicate chart engines; incompatible units on one axis; missing axes; stretched slow-frequency direct series; omitted AI conversation; browser-side canonical Yahoo/FRED reacquisition; handing off an artifact that has not passed the mandatory release validation gate.
