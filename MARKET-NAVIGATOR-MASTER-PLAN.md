# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-31

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application frame and navigation
- **Left:** collapsible navigation rail for **NOW · EXPLORE · LIBRARY · HEALTH**, with **CONFIG** separated at the bottom.
- **Right:** analytical working panel; collapsed rail yields essentially full screen width.
- The hamburger control MUST collapse/restore the rail on desktop and open/close it on mobile. A non-functional collapse control is release-blocking.

The working panel is a compact workspace, not a dashboard-card stack.

## 3. Canonical horizons
**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**. Now defaults to **5D**. The seven controls appear exactly once and use enlarged readable/tappable mobile typography and targets.

## 4. One chart engine / one visual contract
There is exactly one canonical chart engine. V1/V2 and Analysis are states of the same engine, not separate implementations.

Common everywhere: persistent series identity, typography/lines, geometry, horizon logic, visible axes/ticks/units, single-series inspection, legend grammar, missing-data treatment, normalization, provenance/status, touch behavior and evidence fidelity.

Chart quality is acceptance-critical. A chart that is technically populated but visually chaotic, misleading, dominated by sparse/stale series, or rendered across invalid frequency mixtures is a failed chart.

## 5. Derived analytical indices
Three derived indices only: **Risk, Growth, Macro**. Market is a container, not a fourth score or selectable trendline.

Semantic index colors: **Risk red · Growth blue · Macro white/neutral**. Ordinary components use a non-semantic comparison palette.

The accepted component contract is product authority. `data/market-backend/derived-index-definition.json` MUST be reconciled to this contract before the next implementation uses it; the rejected R6 definition is not self-authorizing merely because it was stored under a canonical filename.

### Risk
Equal-weight, direction-adjusted, rebased 100:
- SPY: -1
- VIX: +1
- credit spread: +1
- high yield / HY: -1
- DXY: +1
- MOVE: +1
- financial conditions: +1

### Growth
Equal-weight, direction-adjusted, rebased 100:
- Nasdaq: +1
- copper: +1
- small caps: +1
- PMI: +1
- WTI: +1
- unemployment: -1
- payrolls: +1

### Macro
Equal-weight, direction-adjusted, rebased 100:
- 10Y: +1
- 2Y: +1
- 10Y-2Y: +1
- 10Y-3M: +1
- CPI: +1
- Core PCE: +1
- Fed Funds: +1

Any catalog/source gaps required to implement these definitions are backend defects to resolve explicitly. Do not silently substitute different components.

## 6. Analytical states
### V1 — Market
Risk, Growth and Macro trendlines appear together, rebased to 100. No index is selected by default. Legend `RSK / GRW / MAC`; tapping an index drills directly to V2.

### V2 — Index + components
V2 renders the selected derived index trendline itself plus every component defined for that index. No component may silently disappear; unavailable, stale, sparse or cadence-incompatible evidence is explicitly exposed. Component/index legend labels use stable three-character abbreviations wherever practical.

**Required transition:** component tap opens the in-context About card. About → More info opens standalone Analysis for that exact component. Direct component-button navigation to Analysis is prohibited.

V2 must remain analytically legible. A component that cannot support the selected horizon must not be visually treated as equivalent to a dense/current component; its degraded status must be obvious and Health must explain why.

### V3 — Analysis
Analysis begins with the selected/root component and is additive. One-series and multi-series investigation are the same state. Custom breadcrumb leaf is `<root component> + Custom`.

The previously accepted deeper analytical progression is collapsed into this additive Analysis state; it does not authorize bypassing the V2 About → More info transition.

## 7. Unit-family and axis assignment
One compatible unit family → one native Y-axis. Exactly two → two native Y-axes. More than two incompatible families → Indexed 100 rather than a third native axis.

Indexed-100 is not permission to combine analytically incompatible evidence blindly. Before rendering, the engine must evaluate cadence, freshness, coverage and observation density for the active horizon and surface degraded/incomplete series conditions.

## 8. Legend identity and About-card navigation
V1 index chips drill to V2. V2 and Analysis chips open an in-context About card. About answers What is it / How used here / Why matter and supports close/outside dismissal. More info opens exact clicked series as standalone Analysis.

This journey is an owner-visible acceptance contract, not an implementation suggestion. Automated tests must exercise the actual About card and More info action rather than substitute a direct state call.

## 9. Canonical point inspection
Inspection transfers between visible series. Tap near a line chooses that series and nearest real observation. One popup contains **series · date · value · unit**, with one vertical guide and marker at actual observation coordinates. Inspection clears on context/horizon/series-set changes.

## 10. Axis and time contract
Every chart has visible Y-axis/ticks/unit and horizon-correct X-axis. QA is matrix-based across analytical states × seven horizons × X/Y1/Y2. Horizon semantics follow the governed product vocabulary; 1D/5D use applicable observations/trading sessions rather than calendar approximations.

## 11. Data fidelity, cadence, freshness and mixed frequency
Each direct Analysis line terminates at its own latest real observation. Slower-frequency sources are never stretched to match faster sources. **CPI versus WTI is mandatory Gate 4 mixed-frequency acceptance.** Derived indices may use an explicit governed composite-timestamp rule; direct Analysis may not.

Every canonical series must expose operational cadence metadata sufficient to determine whether the current observation is expected or stale, including at minimum:
- native frequency/cadence,
- publication lag / expected availability rule,
- latest observation date,
- latest successful collection time,
- latest collection attempt/result,
- latest publicly expected observation where determinable,
- expected next observation/publication window where determinable,
- coverage for each canonical horizon,
- observation density for the active horizon,
- health state: current / expected-lag / stale / missing / failed / sparse.

Example acceptance: monthly CPI cannot simply end at June when July is publicly available. Health must distinguish a legitimate publication lag from source publication followed by collector failure or persistence/cache failure. A stale series must not be analyzed as if current.

**Health classification may never infer `expected-lag` from cadence alone.** It must first establish whether a newer observation is publicly expected/available.

## 12. Three-row analytical top ribbon
Row 1: H1 context (`Market: <sentiment>`, `Growth: <sentiment>`, `Payroll: <sentiment>`). Row 2: compact interactive breadcrumbs using `/`. Row 3: enlarged seven horizons centered, More at far right. More contains Add to Analysis, Add/Save to Library, Print, Download.

## 13. Add Series and Explore — one mechanism
There is one canonical series discovery/selection mechanism.

The **Add Series** modal and **EXPLORE** must use the same taxonomy, search, item presentation, metadata, and selection semantics rather than two separate discovery implementations.

Tabs: **Market | Risk | Growth | Macro | Other**. Market contains individually selectable Risk/Growth/Macro; Market itself is not selectable. Risk/Growth/Macro tabs contain index + all components. Other is catalog minus union of index constituents. Search and multi-select are required.

Explore is the full-page use of this same discovery component; Add Series is the modal use of the same component.

## 14. AI POV and operational conversation
AI is active Gate 4 functionality. POV and chat are grounded in exact active canonical evidence/horizon.

### Analysis conversation surface — exact approved layout
Everything below the chart is reserved for the ongoing Analysis conversation. The conversation MUST follow the approved `test.html` presentation contract: user/AI chat bubbles, a visible date-and-time stamp on every bubble, and the persistent composer directly beneath the conversation.

There are no **Tag**, **Clarify Stream**, or composer-level **Save** controls. The conversation is automatically part of the Analysis state and is persisted/restored with the corresponding Library analysis. AI POV is the opening AI turn in this same conversation; it is not a separate report/card below the chart.

No statistics, series-ending-value block, correlation block, QA/debug content, or other permanent analytical card may consume the below-chart conversation region.

### Provider/configuration donor — exact reuse required
**Donor: `devstream-test.html`. Do not redesign or approximate its provider/model configuration behavior.** The successor must follow the donor's provider discovery, model discovery, credential entry/storage, validation, provider/model switching, failure messaging and composer interaction exactly unless the owner explicitly approves a deviation.

Required providers remain Venice.ai, OpenRouter and Anthropic direct. Browser-local keys only where the donor does so. A provider/model is not accepted until the donor-equivalent real validation call succeeds.

**Single-state rule:** validation and execution MUST consume the same authoritative provider/model/key state. If CONFIG reports a provider/model as validated, POV/chat must consume that exact validated state. A simultaneous `validated` CONFIG and `configure/validate first` Analysis response is release-blocking.

### POV intelligence contract
AI POV is not allowed to summarize garbage input. Before generating, it must inspect the active evidence-health envelope and explicitly reason about:
- stale or missing components,
- incomplete horizon coverage,
- publication lag versus actual collection failure,
- sparse observation density,
- mixed-frequency limitations,
- unavailable component evidence,
- whether the visible index/chart is sufficiently supported to interpret.

If evidence is materially incomplete, POV must lead with that limitation and either narrow the inference to supported evidence or state that the requested interpretation is not reliable yet. It must not request or rely on out-of-scope series merely to manufacture a broader market narrative. Index POV should primarily interpret the index and its governed components; broader context is optional only when explicitly requested by the user.

AI generation must have visible lifecycle/status and deterministic failure output. A request that spins and disappears without a response is release-blocking.

The next release must prove a **real validated-provider → AI request → persistent AI response round trip** in addition to failure-path testing. UI state/string presence is not validation.

## 15. LIBRARY
Operational Add/Save to Library preserves analytical lineage, series set, horizon, axis/normalization state, evidence/provenance references, POV/conversation resume context and save version/time. Saved analysis reopens into same state.

Analysis conversation persistence is automatic: every timestamped user/AI turn is saved and restored with the analysis. This does not require or expose a separate Save control in the conversation composer.

## 16. Statistics, ending values and correlation
Statistics bind to exact analytical state. Correlation records pair, coefficient, range, alignment/frequency, observation count, transformation and method.

The visible series' latest real observation date/value and the active correlation score/summary MUST be presented together in one compact overlay card in the **upper-right of the chart**. The card has an explicit **×** dismiss control. Dismissal is presentation-only: it must not remove a series, reset correlation, change horizon, change axis assignment, change normalization, or otherwise mutate the Analysis state.

The summary overlay must remain compact and mobile-safe and may not displace chart axes, legend, inspection geometry or the below-chart conversation. Persistent full-width/below-chart series-ending-value, statistics or correlation cards are prohibited.

## 17. Share / download / print
Download = report/evidence + exact data. Print = formatted report. Both reconcile to exact active evidence.

## 18. HEALTH and CONFIG
Health is a first-class working diagnostic surface, not a placeholder or status table. Selecting **HEALTH** must show series-level and backend-level freshness/source/collection/coverage/provenance/readiness/failures, with cadence and expected-publication metadata sufficient to diagnose stale or malformed evidence without leaving the application.

Health must answer **why the data or chart is bad**, not merely state that it is bad. For every degraded series or chart it must connect the evidence chain: series/source → expected cadence and publication lag → latest publicly expected observation → actual latest observation → last collection attempt and result → horizon coverage/observation density → provenance/error state → concrete impact on the visible chart.

It must distinguish at least:
- source has not published yet,
- source has published but collector did not obtain it,
- collector obtained it but canonical persistence/cache did not update,
- canonical data exists but selected-horizon coverage is insufficient/sparse,
- cadence incompatibility makes the active comparison misleading.

Health must make failures actionable: series, source, last observation, last successful collection, expected next update, latest publicly expected observation, current health classification, failure/error detail, and the reason the condition affects the active chart when applicable.

CONFIG is at bottom of rail and contains the exact donor-derived AI provider configuration behavior from `devstream-test.html`.

## 19. Backend contract
Data Catalog defines canonical series identity and source metadata. Operational Manifest is runtime state. Smart Evidence Store holds canonical observations/horizon records. Source health records collector attempts/results. Browser does not reacquire Yahoo/FRED evidence.

These stores answer different questions and MUST NOT be collapsed into one proxy health field. Collector HTTP success is not proof that the expected observation exists in canonical evidence.

The backend must carry enough cadence/freshness metadata for the frontend and AI to distinguish current, expected-lag, stale, sparse, missing and failed evidence deterministically.

## 20. Gate 3 — UX Journey Prototype
**Status: APPROVED / ACCEPTED.** Approved POC: `market-view-ux-gate3-p2.html`, commit `cfba7320e42028f09f2967304cb0c0dd0cc2988d`. Gate 4 decisions supersede its two-row ribbon details but do not authorize abandoning its accepted analytical journey without an explicit plan change.

## 21. Gate 4 — complete application build
**Status: ACTIVE — R7 SUCCESSOR REQUIRED. R6 IS REJECTED AND ROLLED BACK.**

Rejected `market-view-gate4.html` commit `38a35279f4aea9c99d6fcb70518e06c31371cf3e`, inert `market-view-gate4-r2.html` commit `141739606b0e2fe61e22ab7fa9b51936c20c8009`, rejected standalone-rewrite R3 candidate `2a5daaf19a68cad2dc8c04cab3deaf3ea1680dcb`, rejected R4 candidate `12450364b8298b9f7d1d96837c61654197e793f7`, rejected R5 release `4b1000e317375d9504fd14dcd5afae66f9654cdf`, and rejected R6 release `6ca2f390f4b217f905bd74484756a8d2cc07fdac` are graveyarded and are not patch-forward baselines.

### Governed lineage
**Exact restored Market Navigator 3.9.7 `market-view-gate4-r3.html` runtime/application + approved Gate 3 P2 interaction model + current Gate 4 contracts + corrected accepted derived-index definitions + canonical backend evidence + exact `devstream-test.html` provider/configuration donor behavior + exact `test.html` Analysis-conversation presentation.**

R7 must start again from the restored 3.9.7 baseline. It may not descend from R4, R5 or R6 HTML, JS/CSS/runtime, workflows, generated artifacts, layout decisions, state-transition shortcuts, derived-definition drift, or validation records.

### Baseline and visual-preservation rule
Before Gate 4 additions, preserve the 3.9.7 runtime behaviors unless this plan explicitly supersedes them: routing/history behavior, cleaned-observation model, chart rendering/inspection foundations, responsive frame, accessibility/keyboard behavior, export, persistence/cache behavior, and application error/status behavior. Preserve the approved application frame/layout as a hard contract. No visual or spatial change is permitted merely because it is convenient for implementation; every intentional change must map to an explicit plan clause and survive a before/after visual redline against the approved baseline.

### No patch-forward process
The build lifecycle is mandatory:

**diagnose → Graveyard → Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**.

A rejected ship is rolled back and does not become the next pre-base. Rejected implementation code may be inspected for diagnosis only; it is not a donor unless the Master Plan explicitly identifies a specific external donor artifact.

### R7 recovery order
R7 implementation must proceed in this order:
1. Restore/verify the exact 3.9.7 baseline and approved Gate 3 P2 journey.
2. Reconcile the canonical derived-index definition to the accepted Risk/Growth/Macro definitions in §5; identify any missing catalog/source series instead of substituting components.
3. Repair data-health truth, beginning with CPI and all series whose latest observation/publication expectation currently contradicts Health.
4. Prove V1 → V2 → About → More info → standalone Analysis before adding later Gate 4 surfaces.
5. Integrate exact donor AI provider/model state and prove validated-provider → AI response round trip.
6. Integrate evidence-health preflight into POV/chat.
7. Integrate shared Explore/Add Series, Library restore, statistics/overlay, Print/Download and remaining Gate 4 capabilities without changing the approved frame.
8. Run complete release qualification against owner-visible semantics and exact deployed artifact.

### Mandatory acceptance
- approved application frame/layout preserved; no arbitrary layout changes
- hamburger rail collapse/restore works on desktop and mobile
- V1 RSK/GRW/MAC use the exact accepted component definitions and all seven horizons
- V1 index interaction drills to V2
- V2 selected index line + every accepted defined component; missing/stale/sparse evidence explicit
- V2 component click opens About, not direct Analysis
- About → More info opens exact root component Analysis
- V3 additive Analysis from canonical source records
- three-row ribbon and mobile-safe breadcrumbs/horizons
- transferable crosshair and one combined inspection popup
- CPI + WTI mixed-frequency proof
- cadence/freshness proof including latest-publicly-expected observation and CPI currentness
- Health distinguishes publication lag, collection failure and persistence/cache failure
- unit-family Y1/Y2 and Indexed-100 fallback
- one shared Explore/Add-Series discovery mechanism
- categorized searchable multi-select Add Series
- operational Library restore including exact Analysis conversation history
- exact donor-equivalent AI provider/model discovery and validation behavior
- real validated-provider → POV/chat successful response round trip
- validated CONFIG state and execution state cannot contradict each other
- AI POV evidence-health preflight and deterministic failure/status behavior
- below-chart region contains only the timestamped ongoing Analysis conversation and persistent composer
- no Tag, Clarify Stream or composer-level Save controls
- POV is the opening AI conversation bubble rather than a separate below-chart report block
- latest visible-series ending values plus active correlation appear in one dismissible upper-right chart overlay
- closing the chart summary overlay is presentation-only and does not mutate analytical state
- no persistent below-chart statistics/correlation/ending-value cards
- Health diagnoses the concrete root cause of stale/missing/sparse/cadence-incompatible data and explicitly explains resulting chart degradation
- no browser Yahoo/FRED canonical reacquisition
- no synthetic analytical curves
- systematic mobile/desktop QA across state × horizon × X/Y1/Y2

### Mandatory release validation gate
A Gate 4 release is **not testable and must not be handed to the owner** until all of the following pass:
1. Extract every executable JavaScript block/module from the candidate artifact and run a real JavaScript parser/static syntax check. A parser failure blocks publication.
2. Run an application boot smoke check proving initialization reaches the first render without an uncaught exception. A boot failure blocks publication.
3. Confirm the artifact is reachable at its intended GitHub Pages URL and that its release identity matches the candidate under test.
4. Run structural checks for the three-row ribbon, seven horizons, RSK/GRW/MAC V1 identities, exact accepted derived-index component identities, V2 index+component contract, shared Explore/Add-Series taxonomy, Library, Health, Config and AI composer/provider controls.
5. Run baseline parity and visual-redline checks against the restored 3.9.7 artifact and approved Gate 3 P2 surface for routing/back behavior, rail collapse, existing application frame/layout, cleaned-observation model, chart/export entry points, keyboard/accessibility hooks and responsive behavior. Any ungoverned visual or capability drift blocks publication.
6. Run owner-visible journey/state-transition checks through actual UI events for V1 → V2 → About → More info → Analysis, Add Series additive analysis, Explore → same discovery/select behavior, Analysis → Library save → restore, and context/horizon changes clearing inspection state. Direct internal-state calls are not substitutes.
7. Run independent data-truth/root-cause checks proving latest publicly expected observation versus actual canonical observation, collector attempt/result and persistence state for representative daily/weekly/monthly/quarterly series, including CPI and CPI/WTI mixed-frequency handling.
8. Run accepted derived-index identity checks that compare the active backend definition to §5 rather than merely accepting whatever definition file is present.
9. Run AI configuration parity checks against `devstream-test.html` for provider discovery, model discovery, validation, switching, persistence and failure messaging.
10. Run a real validated-provider → AI execution round trip and verify the response persists in the Analysis conversation. Also run degraded-evidence POV and deterministic failure-path checks.
11. Run visual contract checks at mobile and desktop viewport sizes proving the chart surface and application layout remain faithful to the approved baseline except for specifically governed additions; V1/V2 charts must be analytically coherent rather than merely populated.
12. Record validation against the exact candidate commit and exact deployed Pages artifact. Do not infer validation from an ancestor, donor, previous release, internal function call or string-presence proxy.

R2's inert handoff, R3's superficially validated rewrite, R4's technically passing but product-invalid release, R5's arbitrary-layout/non-diagnostic-Health release, and R6's mechanically-qualified but contract-invalid release are release-process failures. Syntax/boot success is necessary but not sufficient; exact product journey, accepted index identity, independent data truth, root-cause Health diagnostics, AI donor-state continuity, real AI execution, visual parity and analytical usefulness now block release.

## 21A. R7 source-of-truth recovery

Before implementation, R7 resolves the repository's split-brain inputs:

- The accepted component definitions in §5 are product authority until `data/market-backend/derived-index-definition.json` is reconciled and mechanically verified against them.
- `data/market-backend/data-catalog.json` defines canonical series identity/source/cadence metadata only to the extent it agrees with the current product contract; missing required series are surfaced as backend gaps.
- Canonical evidence records are the sole observation source used by the browser.
- Operational manifest and source-health collector records are diagnostic inputs, not substitutes for canonical observations.
- Health classification is produced from publication expectation + actual canonical observation + collector attempt/result + persistence state + horizon coverage/density.
- Browser-side Yahoo/FRED canonical reacquisition remains prohibited.
- Product horizons are exactly `1D, 5D, MTD, YTD, 1YR, 3YR, 5YR`; conflicting legacy backend labels must be reconciled explicitly.
- Provider/model validation and POV/chat execution share one donor-derived authoritative state object/path.

## 22. Rejected approaches
See `MARKET-NAVIGATOR-GRAVEYARD.md`. Prohibited: patching rejected descendants; reuse of R4/R5/R6 generated artifacts, overlays, workflows, runtime or layout decisions; arbitrary application-frame/layout changes not explicitly governed by this plan; Health surfaces that merely list status without independently establishing publication expectation and diagnosing source/collector/persistence/cadence/coverage root cause and chart impact; chart-only Gate 4 releases; two-row ribbon; direct V2 component-to-Analysis navigation; bypassing About → More info; V2 without index reference; incomplete component sets; silent component substitution; treating a drifted backend definition as product authority; flat picker/bottom-hidden actions; Market as fourth trendline; locked/all-series crosshair; split inspection; arbitrary series limits/third native axis; repeated horizons; card-stack analytical composition; duplicate chart engines; incompatible units on one axis; missing axes; stretched slow-frequency direct series; omitted AI conversation; duplicate AI POV controls; persistent below-chart statistics/correlation/ending-value cards that displace the conversation; Tag/Clarify/composer-Save controls in the approved conversation surface; browser-side canonical Yahoo/FRED reacquisition; accepting AI output that ignores stale/incomplete evidence; redesigning provider/model discovery instead of using the exact approved donor behavior; maintaining separate validation and execution provider state; accepting CONFIG `validated` while Analysis reports unconfigured; handing off an artifact that has not passed syntax, boot, exact baseline/visual parity, actual owner-visible journey, independent data truth, accepted-index identity, real AI round trip and exact deployed-artifact release gates.