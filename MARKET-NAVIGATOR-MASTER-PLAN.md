# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-13
Next release scope: **Turn 25 cumulative consolidation**

This file is the single positive specification for Market Navigator. Do not create a parallel release plan. `MARKET-NAVIGATOR-GRAVEYARD.md` is the binding negative specification.

## 1. Product definition
Market Navigator is an evidence-backed market research application with three permanent primary modes:

**NOW · LIBRARY · HEALTH**

with **CONFIG** fixed at the bottom of the left rail.

`EXPLORE` is retired as a separate mode. Its useful discovery capability is consolidated into **Add** inside NOW.

The NOW surface has one chart workspace and two context states:
- **ENV** — three derived indices: RSK · GRW · MAC.
- **Anchored index workspace** — one selected index plus a user-controlled visible-series set.

There is no separate COMPONENT page or modal. `COMPONENTS` may appear only as a non-clickable breadcrumb state marker indicating that the governed component basket is expanded.

Product pipeline:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest / Source Health → chart and analysis consumers → AI interpretation**

The backend owns objective, deterministic, reproducible evidence. AI interprets evidence; it does not invent source facts.

---

## 2. Source-of-truth hierarchy
When sources disagree, use this order:
1. This Master Plan.
2. Owner-reviewed accepted behavior in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, only where not superseded here.
3. Canonical backend evidence under `data/market-backend/`, `market-data/`, and `market-evidence/` after schema/freshness validation.
4. Historical donor implementations, only for capabilities explicitly retained.
5. `MARKET-NAVIGATOR-GRAVEYARD.md` as the binding negative specification where not superseded here.

Historical V1/V2/V3/V4/V5 terminology is prohibited from the active product.

---

## 3. Recovery authority and baseline
Turn 23 is rejected as an application successor baseline because owner testing exposed release-blocking regressions in AI POV launch and rail/horizon chart geometry.

Turn 24 application construction starts from the last known good application release:
- release: **Turn 22**
- merge commit: `0d0681b74b55d35723ca8f2a220474a512175461`
- application source: `market-navigator-turn22-pre-ship.html`

Turn 23 HTML/JS/CSS must not be patched forward or used as the Turn 24 application donor. Turn 23 may be inspected only as failure evidence. Accepted requirements from Turn 23 — responsive NOW geometry, password-manager-safe credential UX, and canonical CONFIG → Sources — are reimplemented cleanly from the Turn 22 baseline.

Current `main` remains the final integration target so unrelated data/WorldPulse movement is preserved.

Required recovery lifecycle:

**restore exact Turn 22 application → prove baseline → implement one governed Turn 24 phase → qualify normal + failure paths → continue only when green → integrate current main → exact-merge qualification → Pages verification → owner test**

No application mutation may precede this governance freeze.

---

## 4. Core architectural rule
There is one NOW analytical state:

**context index + component-basket-expanded flag + visible series set + active series + horizon + representation + frozen evidence revision**.

Do not maintain a second COMPONENT chart state, component modal state, Explore analytical state, or duplicated breadcrumb/series model.

AI POV, Data, Print, downloads, and Library snapshots consume the exact visible NOW chart state.

### 4.1 View ownership boundary
NOW, CONFIG, LIBRARY, and HEALTH communicate through explicit state/navigation functions. A view must not manipulate another view's private DOM as a navigation mechanism.

Removing or replacing a DOM surface requires removing every live execution reference to it before release. No runtime path may reference retired elements such as former modal IDs.

### 4.2 Analytical render versus geometry repaint
These are separate operations.

**Analytical render may:** change horizon/composition/representation, fetch or normalize evidence, compute axes, build legend/footer, and capture the frozen chart model.

**Geometry repaint may:** read the current chart container dimensions and repaint the already-current frozen chart model.

Rail open/close, ResizeObserver, orientation, split-screen, and viewport-size changes are geometry events only. They must not call the analytical renderer, fetch evidence, rebuild composition, change horizon/active series/representation, or recapture AI state.

---

## 5. Permanent application frame
Left rail:

**NOW · LIBRARY · HEALTH**

CONFIG remains fixed at the bottom.

No separate EXPLORE route, page, navigation item, lineage, or analytical workflow is permitted.

NOW fills the available shell continuously. Rail open/close may change chart width but may not vertically recenter the chart card or leave dead space above/below it. Chart/card top and bottom remain pinned while only available width changes.

---

## 6. Canonical chart chrome
All NOW states use one shared three-section chart structure.

### 6.1 Top row
**breadcrumb [left] | 1D 5D MTD YTD 1YR 3YR 5YR [fixed center] | `…` [reserved right]**

Valid breadcrumb forms:
- `ENV`
- `ENV / RSK`
- `ENV / RSK / COMPONENTS`
- `ENV / GRW`
- `ENV / GRW / COMPONENTS`
- `ENV / MAC`
- `ENV / MAC / COMPONENTS`

`COMPONENTS` is a non-clickable terminal state marker, never an individual series list or navigation container.

`ENV` drills to neutral Environment. The index token collapses expanded components to index-only. No breadcrumb may ever contain a duplicated index such as `ENV / GRW / GRW`.

### 6.2 Legend/composition strip
The legend is always present.
- ENV: tapping RSK/GRW/MAC enters that anchored index workspace with governed components expanded.
- collapsed anchored index: tapping the sole anchor chip expands its governed basket.
- expanded anchored index: tapping any chip selects it as active/reference without navigation.
- long press opens compact series information.
- anchor index chip never has `×` while its breadcrumb context is active.
- every non-anchor component/comparison chip has `×`.
- **Add** is always available in an anchored workspace.

### 6.3 Footer
**version/build | exact visible date range | representation selector**

Representations:
- Native Y1
- Native Y1 + Y2
- Indexed 100

Only mathematically valid options are enabled.

---

## 7. NOW state mechanics
### 7.1 ENV neutral
ENV plots exactly RSK · GRW · MAC.
- no default-selected index;
- no isolation fade on load;
- all three display normally;
- plotted-series tap selects for inspection only;
- legend-chip tap enters that anchored index and expands components.

### 7.2 Anchored index — collapsed
Example: `ENV / GRW`.
- GRW is immutable anchor context;
- GRW is the only required visible series;
- no `×` on GRW;
- Add available;
- tapping GRW chip expands all governed Growth components;
- tapping ENV exits to neutral ENV.

### 7.3 Anchored index — expanded
Example: `ENV / GRW / COMPONENTS`.
- GRW remains immutable anchor;
- GRW plus all governed Growth components initially visible;
- GRW active/reference on entry;
- non-anchor chips removable;
- arbitrary Add series do not alter breadcrumb hierarchy;
- tapping GRW breadcrumb collapses to `ENV / GRW`;
- tapping ENV exits to neutral ENV.

---

## 8. Add replaces Explore
Add is the single chart discovery/catalog surface. It provides:
- search/Omnisearch;
- Risk · Growth · Macro · Other grouping;
- canonical short/full name;
- unit and cadence;
- active-horizon availability;
- Health state;
- About/source access;
- add action.

Derived RSK/GRW/MAC may be added as single comparison series. Adding an index through Add does not auto-expand its component basket.

---

## 9. Active-series emphasis and inspection
When a series becomes active:
- active stays fully opaque and draws on top;
- other visible series fade translucently;
- configured width/style do not change;
- no second click required.

Inspection uses nearest full-resolution real observation and shows date, native value/unit, Indexed 100 where valid, point marker, vertical guide, and explicit `×` dismissal.

For every raw/source series:

`Indexed 100 = 100 × value / baseline`

Component direction/weight applies only to derived-index construction and never inverts a raw/source chart, crosshair, Data value, export, AI evidence, or Library snapshot.

---

## 10. Horizon and display-density contract
Exactly seven horizons:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

NOW defaults to 5D. One common X-domain applies to all visible series. No forward-fill, fabricated daily points, synthetic stretching, or horizon-end restamping.

Presentation-only density:
- 1D · 5D · MTD → native
- YTD · 1YR → weekly
- 3YR · 5YR → monthly

Reducer selects real persisted observations only and preserves first/last real observations. Full canonical evidence remains available to inspection, Data, correlation, AI, downloads, and Library.

---

## 11. Axis / representation rules
Automatic representation:
1. one raw series → Native Y1;
2. compatible raw series → shared Native Y1;
3. exactly two incompatible measurement families → Native Y1 + Y2;
4. three or more incompatible families → Indexed 100;
5. derived index alone → Indexed 100;
6. mixed derived/raw series may use Indexed 100 when native-family comparison would mislead.

Mandatory regressions: WTI + Brent; CPI + Core CPI; SPY + QQQ + WTI; DXY + VIX; CPI + WTI; CPI + WTI + VIX.

---

## 12. Governed indices
### Risk
SPY −1 · VIX +1 · HY spread +1 · HYG −1 · DXY +1 · MOVE +1 · NFCI +1

### Growth
QQQ +1 · copper +1 · small caps +1 · IPMAN +1 · WTI +1 · unemployment −1 · payrolls +1

### Macro
10Y +1 · 2Y +1 · 10Y−2Y +1 · 10Y−3M +1 · CPI +1 · Core PCE +1 · Fed Funds +1

Direction affects derived composite only, never source-relative display. ISM Manufacturing PMI remains excluded unless a permissible free canonical source is established.

GDP q/q and GDP y/y are deterministic quarterly transforms of canonical Real GDP levels; no interpolation. WTI direct-analysis availability remains separate from Growth composite eligibility.

---

## 13. Canonical context menu
Same NOW menu everywhere:
1. AI POV
2. Data
3. Print
4. Download Markdown
5. Download CSV
6. Download JSON

Data exposes complete canonical raw-series history with Native, Indexed 100, and same-date Pearson correlation against the active series.

---

## 14. LIBRARY
Library persists exact frozen analysis state: context index, basket state, visible series, active series, horizon, representation/axes, evidence revision, exact chart snapshot/styles, AI POV, and full timestamped conversation.

Opening an analysis restores the frozen chart above the transcript and permits continuation. Newer evidence must never silently replace a saved chart.

### 14.1 Listen
Browser `SpeechSynthesisUtterance` remains playback-only. The Listen dock never displays the analysis title. It contains compact centered progress and exactly five centered transport controls: previous response, previous row, play/pause, next row, next response. Controls may never be clipped by text.

---

## 15. AI / conversation
AI POV consumes the exact frozen visible NOW chart state and must not reconstruct the chart by refetching raw series.

Markdown renders in transcript. Referenced sources/subjects have working hyperlinks.

Provider/model/key state validated in CONFIG is the execution state.

### 15.1 AI transition contract
`AI POV` follows exactly:

**freeze exact NOW state → validate provider prerequisites → persist processing analysis → navigate through Library API → run provider → persist ready/failed result**.

If provider is missing, unverified, missing key/model, or otherwise not executable:
- no exception;
- no empty/processing Analysis artifact;
- open CONFIG on AI tab through the Config navigation API;
- show actionable provider status.

AI code does not manipulate CONFIG or LIBRARY private DOM directly.

### 15.2 Credential ownership
Registered secrets are not repopulated into editable password fields when Config renders. Registered state shows provider/model plus explicit **Replace key**. Replacement input exists only while replacement is active; a draft does not overwrite the registered key until validation succeeds. Autofill/password-manager ownership is suppressed as far as the browser permits.

---

## 16. HEALTH
HEALTH reconciles:

**series/source → publication expectation → canonical observation → collector result → persistence/revision → horizon coverage/density → chart/index impact**

It distinguishes publication lag, collector failure, persistence failure, sparse coverage, cadence incompatibility, provider fallback, unresolved registration, and derived-index impact.

---

## 17. CONFIG
Tabs:

**AI | Chart Config | Sources | About**

One persistent close `×` works from every tab and returns to exact prior mode.

Chart Config retains Normal · Bright · Colorblind presets, ten identity-bound slots, color, 1–12 pt width, line/dash/dash-dot/dot/dot-dash, live preview, Save persistence, unsaved-close restoration, import/export.

### 17.1 Sources — canonical registration control plane
Sources is not a local watchlist and not an ad-hoc browser quote fetcher.

Turn 24 Sources v1 supports:
- market indices;
- common equities;
- ETFs;
- fund / CIT / NAV vehicles.

Owner examples defining required resolver behavior:
- **Dow** → actual Dow Jones Industrial Average index, not Dow Inc. and not an ETF proxy;
- **GAAMHX** → resolve as its actual fund/CIT/NAV-type economic instrument when a qualified provider exists;
- **V** → Visa equity;
- **NVDA** → NVIDIA equity;
- **VRT** → Vertiv equity;
- **VOO** → Vanguard S&P 500 ETF;
- **T** → AT&T equity.

Entered text is never blindly accepted as provider identity. Flow is:

**ticker/name → canonical instrument resolution → instrument class → provider-compatible alias/cascade → normalization → canonical evidence → Health/provenance → horizon capability → NOW Add**

Ambiguous symbols must present/retain explicit identity intent. No proxy or similarly named security is silently substituted.

Measurement semantics are explicit:
- market index → published index level;
- equity / ETF → market price;
- fund / CIT → published NAV or unit value.

Price, total return, index level, and NAV are not interchangeable. Total return, if added later, is an explicit derived representation.

Provider selection is an ordered cascade by instrument class. Provider fallback does not change economic identity and is recorded in Health/provenance. If no acceptable provider resolves/collects an instrument, registration remains explicitly unresolved.

Horizons are capabilities of persisted canonical evidence, not separate economic sources. Genuine intraday evidence is required for an intraday 1D view. Daily/EOD or NAV evidence may support 5D through 5YR when sufficient history exists. Unsupported horizons are disabled, never fabricated.

Healthy registered instruments automatically become discoverable through NOW → Add and then use the same chart, inspection, Data, AI POV, Library, export, and Health machinery as native catalog series.

Because Pages is static, the browser receives no repository write token. Registration is an authenticated control-plane handoff; canonical registration/collection occurs server-side/repository-side, not in localStorage.

### 17.2 Source registration UX requirements
CONFIG → Sources must:
- accept ticker/name plus explicit instrument-class intent when needed;
- show resolved canonical identity before admission where resolution is available;
- show pending / healthy / unresolved / failed state;
- show measurement semantics, provider cascade/fallback provenance, cadence, and enabled horizons;
- expose Refresh after server-side registration/collection;
- never imply a submitted request is healthy before canonical evidence and Health metadata exist;
- make a healthy registered source discoverable through Add without a second local registration path.

---

## 18. Race / coherence contract
Required:
- one in-flight canonical fetch per series per boot;
- analytical render-generation guards;
- stale async results cannot overwrite newer horizon/composition state;
- catalog/Health/derived/raw evidence validated against one coherent session revision/anchor contract;
- evidence errors explicit;
- geometry repaint never mutates analytical state;
- repeated rail/resize events coalesce via animation frame or equivalent paint scheduling and use the already-current chart model;
- no geometry event creates a new evidence request.

---

## 19. Explicit prohibited regressions
Do not introduce:
- V1/V2/V3/V4/V5 product terminology;
- separate EXPLORE mode or COMPONENT page/modal;
- duplicated-index breadcrumb or individual component names in breadcrumb;
- clickable `COMPONENTS` token;
- default-selected RSK on ENV load;
- anchor index with `×` in its own context;
- breadcrumb wrapping/displacement of horizons/menu;
- second-click focus modes, white-outline focus semantics, or hover-driven series switching;
- synthetic/fallback chart evidence or raw-source direction inversion;
- duplicate chart/discovery/AI engines;
- Library without frozen chart + continuation composer;
- title text in Listen transport strip or fake browser-TTS MP3 export;
- populated saved API secrets in normal editable password fields;
- local-only custom ticker evidence bypassing canonical Health/revisions;
- provider-per-horizon economic identity switching;
- silent ticker/proxy substitution;
- fabricated intraday data for daily/NAV sources;
- a ResizeObserver/rail/orientation event invoking the full analytical renderer;
- geometry events mutating horizon/composition/active series/representation/frozen evidence;
- one view directly manipulating another view's private DOM;
- live references to retired DOM IDs;
- AI qualification that covers only the verified happy path;
- release qualification that omits changed failure/edge paths.

---

## 20. Turn 24 implementation plan
### Phase A — prove baseline
1. Copy exact Turn 22 application source from commit `0d0681b74b55d35723ca8f2a220474a512175461` into `market-navigator-turn24-pre-ship.html`.
2. Change only Turn/build identity needed to execute qualification.
3. Run retained Turn 22 product/browser matrix before feature work.
4. If baseline does not reproduce, stop and diagnose; do not continue.

### Phase B — deterministic geometry
1. Make NOW fill the shell continuously.
2. Persist the completed analytical chart model after each real analytical render.
3. Add a geometry-only repaint path using that model.
4. ResizeObserver/rail/orientation/viewport events call geometry repaint only.
5. Prove rail changes create zero evidence fetches and zero analytical-state mutations.

### Phase C — AI transition recovery + credential UX
1. Remove cross-view DOM ownership from AI launch.
2. Implement explicit Config-AI and Library-analysis navigation functions.
3. Valid provider: freeze NOW → persist processing analysis → Library → complete/fail provider call.
4. Invalid/unregistered provider: Config AI with status, no throw and no Analysis artifact.
5. Reimplement registered-key/Replace-key UX from this written contract, not Turn 23 source.

### Phase D — canonical Sources
1. Add CONFIG → Sources from this contract.
2. Implement canonical registration/control-plane handoff with explicit instrument class/identity.
3. Support the owner test set: Dow index, GAAMHX, V, NVDA, VRT, VOO, T.
4. Maintain provider aliases/cascade, explicit measurement semantics, provenance, cadence, and horizon capability.
5. Healthy persisted registrations flow into Add; unresolved registrations remain explicit.
6. No local-only evidence and no browser repository credential.

### Phase E — retained behavior
Preserve Turn 22 unified NOW architecture, Turn 21 source-relative indexing, exact frozen AI/Library evidence, long-horizon display density, WTI/GDP truthfulness, Data/correlation, Library/TTS, style Config, and canonical context menu.

---

## 21. Turn 24 release-blocking qualification
All gates run on desktop, tablet, and phone where applicable.

### Baseline/retention
- boot/JavaScript clean;
- neutral ENV;
- RSK/GRW/MAC collapsed/expanded lifecycles;
- Add discovery;
- all seven horizons and density rules;
- WTI short-horizon direct availability and GDP cadence truth;
- Data/correlation;
- Library frozen chart, transcript/composer, TTS controls;
- Config style controls;
- canonical six-command menu;
- stale-render/race protection.

### AI
- verified provider launches AI POV and creates one processing→ready analysis;
- missing key/model or unverified provider opens CONFIG → AI cleanly with actionable status;
- invalid provider preflight creates no Analysis artifact;
- provider request failure becomes a visible failed analysis without uncaught exception;
- no live reference to retired Config/modal DOM;
- exact frozen NOW state is the AI evidence packet.

### Geometry
For ENV and each anchored RSK/GRW/MAC state:
- change horizons including 3YR and 5YR;
- repeatedly open/close/open the left rail;
- chart card top/bottom remain fixed;
- canvas dimensions track actual container;
- horizon, composition, active series, representation, breadcrumb, and frozen chart model remain invariant;
- resize causes no evidence fetch and no analytical-render generation change;
- no visible jump/dead gap remains after transition.

### Credentials
- registered key never repopulates an ordinary editable password field;
- Replace key explicit/reversible;
- cancelling replacement preserves registered key;
- failed validation does not silently replace working registration.

### Sources
- Sources tab exists and is canonical-control-plane only;
- Dow index request cannot silently resolve to Dow Inc. or an ETF proxy;
- owner examples are accepted as resolver inputs with correct class intent;
- healthy persisted source fixture appears in Add;
- daily/NAV-only fixture is disabled for unsupported intraday 1D but works on supported longer horizon;
- unresolved source is explicit;
- Health/provenance exposes provider/fallback/cadence/coverage;
- no local-only evidence path exists.

### Console/error gate
Application-owned console errors, unhandled promise rejections, failed required resources, or null-DOM execution errors fail the release. Browser-extension/content-script warnings are recorded separately and do not count as application errors.

---

## 22. Publication gate
Only after every Turn 24 release-blocking gate passes:
1. fetch current `main`;
2. integrate Turn 24 while preserving unrelated data/WorldPulse/main movement;
3. verify the exact application artifact and governance diff;
4. run the full Turn 24 matrix on the exact merged-main artifact;
5. verify GitHub Pages deployment success;
6. return the cache-busted Pages URL and exact merge SHA for owner test.

A Pages deployment alone is never evidence of product qualification.

---

## 23. Turn 24 rejection and Turn 18 rollback authority — superseding recovery section
This section supersedes Sections 3, 20, 21 and 22 wherever they conflict on recovery baseline, release status or execution sequence. All product requirements elsewhere in this Plan remain in force.

Owner testing of Turn 24 exposed a release-blocking Library Listen/TTS regression after automated qualification reported PASS. Investigation established a qualification regression:

- Turn 17 used an observable speech mock and explicitly asserted that a non-empty utterance reached `speechSynthesis.speak()`.
- Turn 18 imported the complete Turn 17 regression matrix and therefore retained that semantic TTS gate.
- Turn 19 replaced the observable speech handoff with a no-op `speak(){}` mock and checked only UI playing state. That weakened gate propagated forward.
- Turn 22 and Turn 24 therefore could report retained-product/TTS PASS without proving that any speech was submitted.

### 23.1 Current rollback baseline
The last release with the stronger semantic TTS qualification contract is:

- release: **Turn 18**
- qualified release commit: `97b8c028778f36380de821591e3d6c8125fb14f9`
- application source: `market-navigator-turn18-pre-ship.html`
- application blob: `4a52c7e764513024176aea80cc13c56e05370c11`
- qualifying matrix: `market-navigator-turn18-qa.mjs`, which imports the complete `market-navigator-turn17-qa.mjs` matrix

Turns 19, 20, 21, 22, 23 and 24 are **not application donors or successor baselines** for the next recovery build. They may be inspected only for accepted requirements and failure evidence. No HTML/JS/CSS from those releases is to be patched forward.

Current `main` remains the integration/data target. The rollback itself does not rewrite or mutate Turn 18 application source.

### 23.2 Permanent test-integrity rule
A release gate must observe the side effect or state transition that defines the capability. It may not claim coverage from adjacent UI state alone.

For Library Listen/TTS, qualification must prove:
- completed assistant response enables Listen;
- Listen shows exactly five transport controls and hides Chat composer;
- Play creates a non-empty `SpeechSynthesisUtterance` from the selected response/row;
- the utterance is actually passed to `speechSynthesis.speak()`;
- previous/next row and previous/next response alter the selected spoken content;
- cancel/stop/navigation state remains coherent;
- no application exception occurs;
- phone controls are visible and unclipped.

A no-op `speak(){}` mock plus a Play→Pause button assertion is not a TTS test.

No retained regression gate may be weakened when carried into a successor release. Any replacement test must be at least as semantically strong as the gate it supersedes.

### 23.3 Android/device truth
The application must not assume desktop Web Speech pause/resume semantics on Android-family browsers. Target-device qualification must verify actual playback behavior. If platform `pause()` behaves as cancel/end, the application state machine must remain truthful rather than pretending a resumable utterance still exists.

### 23.4 Recovery execution sequence
1. Pin the exact Turn 18 blob `4a52c7e764513024176aea80cc13c56e05370c11`.
2. Confirm the historical Turn 18 qualification run passed the full Turn 17 + Turn 18 matrix, including semantic TTS handoff.
3. Publish/return the cache-busted Turn 18 Pages URL for owner/device verification.
4. Only after that rollback baseline is owner-confirmed, construct the next candidate from exact Turn 18 application source.
5. Reimplement accepted post-Turn-18 requirements from this written Master Plan only; do not copy Turn 19–24 application implementation.
6. Work in governed phases and run the complete accumulated matrix after every phase.
7. Integrate current `main`, qualify the exact merge artifact, verify Pages, then return the owner-test URL.

### 23.5 Reconstruction requirements retained
Rollback does **not** revoke accepted product requirements. The reconstruction must retain/reimplement all accepted requirements in this Plan, including:
- unified NOW architecture and Add replacing Explore;
- source-relative Indexed 100 behavior;
- long-horizon display density without evidence mutation;
- WTI/GDP truthfulness;
- Data/correlation and canonical six-command menu;
- exact frozen AI/Library evidence and continuation;
- AI provider failure/preflight behavior;
- geometry-only resize invariants;
- credential-safe Config/Replace Key behavior;
- canonical Sources control plane, identity/provenance/horizon semantics, including DOW→DJIA, NVDA, V, GAAMHX, VRT, VOO and T;
- full Library Listen/TTS behavior with semantic, target-device qualification.

### 23.6 Publication rule for rollback
The rollback changes governance, not the Turn 18 application artifact. A Pages deployment is not itself qualification. The qualified Turn 18 application blob must remain byte-identical to `4a52c7e764513024176aea80cc13c56e05370c11`.

---

## 24. Turn 25 cumulative consolidation — current execution authority
Turn 25 is one consolidation release, not a staircase of partial recovery releases.

### 24.1 Baseline and donor rule
The executable application baseline is the exact qualified Turn 18 artifact:
- commit `97b8c028778f36380de821591e3d6c8125fb14f9`;
- `market-navigator-turn18-pre-ship.html`;
- blob `4a52c7e764513024176aea80cc13c56e05370c11`.

Turns 19–24 remain rejected as application donors. Their approved behavior and qualification evidence are cumulative requirements, not disposable requirements. Rejected code may be discarded; owner-approved behavior may not.

### 24.2 Cumulative acceptance ledger
Turn 25 must deliver all of the following in one candidate before owner test:
1. one NOW analytical workspace; no Explore route/view and no Component modal;
2. neutral ENV with RSK · GRW · MAC and no default emphasis;
3. anchored ENV / RSK|GRW|MAC / COMPONENTS lifecycle, anchor immutability, collapse/re-expand, removable non-anchor chips and Add discovery;
4. source-relative Indexed 100 for raw/source series, exact seven horizons, real-observation display density, common X-domain and no evidence fabrication;
5. WTI direct-series truth and cadence-aware GDP q/q/y/y truth;
6. active-series chart emphasis, native + Indexed 100 inspection, Data/correlation and canonical six-command menu;
7. exact frozen NOW state into AI, Library frozen chart/transcript/continuation, durable persistence and Markdown links;
8. AI preflight/failure paths with no retired-DOM dependency and no invalid-provider Analysis artifact;
9. registered-key/Replace-key UX that never repopulates a saved key and never destroys a working credential on failed replacement;
10. geometry-only rail/ResizeObserver/orientation repaint with no horizon/composition/active/representation mutation and no evidence request;
11. CONFIG tabs AI · Chart Config · Sources · About and existing ten-slot style persistence/import/export;
12. canonical repository-backed Sources control plane, explicit class/identity/measure/provenance/horizon semantics, DOW → DJIA, and repository-backed registered sources including NVDA, V and GAAMHX;
13. healthy registered sources automatically discoverable through NOW → Add; unsupported 1D for daily/NAV sources disabled rather than fabricated;
14. Library Listen/Chat, exactly five centered transport controls, no duplicate title, actual non-empty SpeechSynthesisUtterance handoff, response/row navigation and truthful Android-family pause/resume behavior;
15. console/unhandled/required-resource failures remain release blockers.

A capability is complete only when its semantic gate passes. Adjacent UI state is not evidence of the capability.

### 24.3 Construction rule
Construct Turn 25 from exact Turn 18 source plus fresh implementation written from this Master Plan. Do not copy HTML/JS/CSS implementation from Turns 19–24. Repository-side data/catalog/Health/Source Registry produced by accepted backend work remain canonical current-main inputs and are not application donors.

### 24.4 One-release qualification sequence
**exact Turn 18 blob proof → construct complete Turn 25 candidate → static/JS gate → cumulative desktop + phone product matrix → semantic TTS + Android state gate → AI normal/failure/preflight gate → geometry invariance gate → Sources/control-plane gate → credential gate → backend registry/evidence gate → integrate current main → rerun the entire matrix on the exact merge artifact → Pages verification → owner test**.

No intermediate partial application release is published for owner testing. Any failed cumulative gate keeps Turn 25 unshipped and is corrected on the same consolidation branch.

