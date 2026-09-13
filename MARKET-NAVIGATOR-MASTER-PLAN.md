# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-12
Active rollback baseline: **Turn 18**
Next application work: **clean reconstruction from Turn 18 only after rollback qualification and owner test**

This file is the single positive specification for Market Navigator. Do not create a parallel recovery plan. `MARKET-NAVIGATOR-GRAVEYARD.md` is the binding negative specification.

## 1. Product definition
Market Navigator is an evidence-backed market research application with permanent primary modes:

**NOW · LIBRARY · HEALTH**

with **CONFIG** fixed at the bottom of the left rail.

The intended current product remains the unified NOW architecture defined below. A rollback baseline is not permission to discard accepted requirements; it is the trusted application source from which they must be reimplemented cleanly.

Product pipeline:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest / Source Health → chart and analysis consumers → AI interpretation**

The backend owns objective, deterministic, reproducible evidence. AI interprets evidence; it does not invent source facts.

---

## 2. Source-of-truth hierarchy
When sources disagree, use this order:
1. This Master Plan.
2. Owner-reviewed accepted behavior in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, only where not superseded here.
3. Canonical backend evidence under `data/market-backend/`, `market-data/`, and `market-evidence/` after schema/freshness validation.
4. The exact approved rollback artifact for runtime behavior that must be preserved.
5. Historical implementations only as failure/requirements evidence unless this plan explicitly authorizes them as a donor.
6. `MARKET-NAVIGATOR-GRAVEYARD.md` as the binding negative specification where not superseded here.

Historical V1/V2/V3/V4/V5 terminology is prohibited from the intended active product.

---

## 3. Current recovery authority and baseline
Owner testing of Turn 24 exposed a release-blocking Library Listen/TTS regression after all automated gates had passed. Investigation established that the qualification contract itself had regressed earlier:

- Turn 17 TTS QA used an observable speech mock and asserted that non-empty utterance text reached `speechSynthesis.speak()`.
- Turn 18 inherited and ran the complete Turn 17 regression matrix against the Turn 18 candidate.
- Beginning with Turn 19, the retained TTS check was weakened to a no-op `speak(){}` mock plus a Play-button-state assertion. That could report PASS without proving speech was submitted.
- Turn 22 and therefore Turn 24 inherited that weaker qualification boundary.

Therefore the prior declaration of Turn 22 as a fully last-known-good application baseline was too broad. For recovery purposes, **Turn 18 is the last application release with the stronger TTS qualification contract**.

Approved rollback baseline:
- release: **Turn 18**
- qualified release commit: `97b8c028778f36380de821591e3d6c8125fb14f9`
- application source: `market-navigator-turn18-pre-ship.html`
- application blob: `4a52c7e764513024176aea80cc13c56e05370c11`
- retained QA: `market-navigator-turn18-qa.mjs` importing the full Turn 17 matrix

**Turns 19, 20, 21, 22, 23 and 24 are not application successor baselines for the next recovery build.** They may be inspected for accepted requirements and failure evidence only. No HTML/JS/CSS from those releases is to be patched forward into the next application candidate.

Current `main` remains the integration/data target so unrelated repository, evidence, and WorldPulse movement is preserved.

Required recovery lifecycle:

**restore/identify exact Turn 18 artifact → prove exact blob → run full Turn 17 + Turn 18 qualification including semantic TTS handoff → publish rollback URL → owner/device test → only then reconstruct accepted post-Turn-18 requirements from this written plan → qualify each phase → integrate current main → exact-merge qualification → Pages verification → owner test**

No application mutation is part of the rollback itself.

---

## 4. Permanent anti-regression rule: capability gates must test capabilities
A release gate may not claim to protect a capability by testing only nearby UI state.

For TTS specifically, qualification must prove all of the following on the candidate artifact:
- a completed assistant response enables Listen;
- entering Listen exposes the five transport controls and hides Chat composer;
- pressing Play creates a non-empty `SpeechSynthesisUtterance` from the selected response/row;
- the utterance is actually handed to `speechSynthesis.speak()`;
- previous/next row and previous/next response update the selected spoken content;
- stop/cancel/navigation state is coherent;
- no application exception occurs;
- phone geometry does not clip transport controls.

A mock with `speak(){}` and no assertion on the utterance is not a TTS test.

The same principle applies across the product: tests must observe the underlying side effect or state transition that defines the capability, not merely a button label, CSS class, toast, or successful function return.

---

## 5. Intended application architecture to reconstruct
There is one NOW analytical state:

**context index + component-basket-expanded flag + visible series set + active series + horizon + representation + frozen evidence revision**.

The intended active frame is:

**NOW · LIBRARY · HEALTH** with **CONFIG** fixed at the bottom.

`EXPLORE` is retired as a separate mode. Discovery is consolidated into **Add** inside NOW.

There is no separate COMPONENT page/modal in the intended reconstructed product. `COMPONENTS` is a non-clickable breadcrumb state marker only.

NOW, CONFIG, LIBRARY, and HEALTH communicate through explicit state/navigation functions. A view must not manipulate another view's private DOM as navigation.

AI POV, Data, Print, downloads, and Library snapshots consume the exact visible NOW chart state.

---

## 6. NOW chart contract
### 6.1 Context and breadcrumb
Valid intended breadcrumb forms:
- `ENV`
- `ENV / RSK`
- `ENV / RSK / COMPONENTS`
- `ENV / GRW`
- `ENV / GRW / COMPONENTS`
- `ENV / MAC`
- `ENV / MAC / COMPONENTS`

ENV is neutral: RSK · GRW · MAC visible, no default-selected index and no isolation fade.

An anchored index is immutable context. Expanded state includes its governed basket. The anchor has no `×`; non-anchor component/comparison chips are removable. Add is available in anchored state. Arbitrary Add series do not change breadcrumb hierarchy.

### 6.2 Top row and footer
Top row:

**breadcrumb [left] | 1D 5D MTD YTD 1YR 3YR 5YR [fixed center] | `…` [right]**

Footer:

**version/build | exact visible date range | representation selector**

Representations:
- Native Y1
- Native Y1 + Y2
- Indexed 100

Only mathematically valid options are enabled.

### 6.3 Active series and inspection
Active series remains fully opaque and draws on top; other visible series fade without changing configured width/style.

Inspection uses nearest full-resolution real observation and shows date, native value/unit, Indexed 100 where valid, point marker, vertical guide, and explicit dismissal.

For raw/source series:

`Indexed 100 = 100 × value / baseline`

Derived-index direction/weight never inverts a raw/source chart, crosshair, Data value, export, AI evidence, or Library snapshot.

---

## 7. Horizon, density, axis and data truth
Exactly seven horizons:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

Presentation-only density:
- 1D · 5D · MTD → native
- YTD · 1YR → weekly
- 3YR · 5YR → monthly

No forward-fill, fabricated daily points, synthetic stretching, horizon-end restamping, or fabricated intraday points.

Automatic representation:
1. one raw series → Native Y1;
2. compatible raw series → shared Native Y1;
3. exactly two incompatible measurement families → Native Y1 + Y2;
4. three or more incompatible families → Indexed 100;
5. derived index alone → Indexed 100;
6. mixed derived/raw may use Indexed 100 when native comparison would mislead.

Mandatory regression pairs/sets include WTI + Brent, CPI + Core CPI, SPY + QQQ + WTI, DXY + VIX, CPI + WTI, and CPI + WTI + VIX.

GDP q/q and y/y remain deterministic quarterly transforms of canonical Real GDP levels. WTI direct-analysis availability remains separate from Growth-composite eligibility.

---

## 8. Add and Sources
Add is the single intended chart discovery/catalog surface. It provides search, Risk/Growth/Macro/Other grouping, canonical short/full name, unit, cadence, active-horizon availability, Health, About/source access, and add action.

CONFIG tabs in the reconstructed product are:

**AI | Chart Config | Sources | About**

Sources is a canonical registration control plane, not a local watchlist or ad-hoc quote fetcher.

Required identity examples include:
- Dow → actual Dow Jones Industrial Average index, never Dow Inc. or an ETF proxy;
- GAAMHX → actual fund/CIT/NAV-type economic instrument when a qualified provider exists;
- V → Visa equity;
- NVDA → NVIDIA equity;
- VRT → Vertiv equity;
- VOO → Vanguard S&P 500 ETF;
- T → AT&T equity.

Flow:

**ticker/name → canonical identity → instrument class → provider alias/cascade → normalization → canonical evidence → Health/provenance → horizon capability → NOW Add**

Price, total return, index level, and NAV are distinct measurements. Provider fallback may not change economic identity. Unsupported horizons are disabled, never fabricated.

Healthy persisted registrations become discoverable through Add. Pending/unresolved/failed registrations remain explicit.

---

## 9. LIBRARY and Listen
Library persists exact frozen state: context, basket state, visible series, active series, horizon, representation/axes, evidence revision, chart snapshot/styles, AI POV, and full timestamped conversation.

Opening an analysis restores its frozen chart above the transcript and permits continuation. Newer evidence never silently replaces a saved chart.

### 9.1 Listen contract
Browser `SpeechSynthesisUtterance` is playback-only. The Listen dock does not duplicate the analysis title. It contains compact progress and exactly five centered controls:

**previous response · previous row · play/pause · next row · next response**

Controls must not clip on phone.

The application must not pretend browser speech can produce an MP3 download.

Because Android-family speech engines may not provide reliable pause/resume semantics, future reconstruction must qualify the actual target-device behavior rather than assume desktop Web Speech semantics. A recovery implementation must prefer a state machine whose observable behavior remains truthful when pause behaves as cancel/end.

---

## 10. AI / conversation / credentials
AI POV consumes the exact frozen visible NOW state. Markdown renders in transcript and referenced sources/subjects have working hyperlinks.

AI transition:

**freeze exact NOW state → validate provider prerequisites → persist processing analysis → navigate through Library API → run provider → persist ready/failed result**

Invalid/unregistered provider:
- no exception;
- no empty/processing analysis artifact;
- open CONFIG → AI through the Config API;
- show actionable status.

Registered secrets are not repopulated into normal editable password fields. Registered state exposes explicit Replace Key. A failed replacement validation preserves the working registration.

---

## 11. Geometry and race contract
Analytical render and geometry repaint are separate operations.

Geometry events — rail toggle, ResizeObserver, orientation, split-screen, viewport changes — may repaint the already-current chart model only. They may not fetch evidence, recalculate composition, change horizon/active series/representation, or recapture AI state.

Required race rules:
- one in-flight canonical fetch per series per boot;
- render-generation guards;
- stale async results cannot overwrite newer state;
- coherent catalog/Health/derived/raw revision contract;
- evidence failures explicit;
- repeated geometry events coalesce;
- no geometry event creates an evidence request.

---

## 12. Canonical context menu and Config style
Same intended NOW menu everywhere:
1. AI POV
2. Data
3. Print
4. Download Markdown
5. Download CSV
6. Download JSON

Data exposes complete canonical history with Native, Indexed 100, and same-date Pearson correlation against the active series.

Chart Config retains Normal · Bright · Colorblind presets; ten identity-bound slots; color; 1–12 pt width; line/dash/dash-dot/dot/dot-dash; live preview; Save persistence; unsaved-close restoration; import/export.

---

## 13. Recovery execution now
### Stage A — rollback, no application mutation
1. Pin exact Turn 18 blob `4a52c7e764513024176aea80cc13c56e05370c11`.
2. Run `market-navigator-turn18-qa.mjs` against the exact Turn 18 Pages artifact; this imports the complete Turn 17 matrix.
3. Require the Turn 17 semantic TTS assertion that `window.__qaSpeech.last.text` is non-empty after Play.
4. Require JavaScript/boot/resource cleanliness.
5. Publish/return the cache-busted Turn 18 Pages URL for owner/device test.

### Stage B — reconstruction after rollback owner test
Rebuild from exact Turn 18 only. Reimplement accepted requirements from this plan rather than copying Turn 19–24 application source. Work in independently qualified phases:
1. intended unified NOW architecture and breadcrumb/Add model;
2. source-relative indexing, long-horizon density, Data/correlation;
3. frozen AI/Library state and canonical menu;
4. canonical Sources control plane and registered-source discovery;
5. geometry-only resize and credential-safe Config;
6. target-device Listen/TTS behavior.

Every phase must pass the complete accumulated matrix before the next phase starts.

---

## 14. Release-blocking qualification for every reconstructed candidate
Qualification must include:

### Baseline/retention
- boot/JavaScript/resource clean;
- expected NOW lifecycle;
- all seven horizons/density rules;
- WTI/GDP truthfulness;
- Data/correlation;
- frozen Library chart + transcript + continuation;
- canonical menu and Config style;
- stale-render/race protection.

### TTS
- semantic speech handoff assertion, not only UI state;
- non-empty utterance submitted to the speech engine;
- row/response navigation changes spoken content;
- play/stop/pause behavior truthful for target browser;
- phone controls visible and unclipped;
- no application exception.

### AI
- verified provider processing→ready;
- invalid/unverified/missing prerequisites route cleanly to Config with no artifact;
- provider failure persists visible failed analysis;
- exact frozen NOW state reaches AI;
- no references to retired DOM.

### Geometry
- ENV plus RSK/GRW/MAC anchored states;
- 3YR/5YR plus repeated rail transitions;
- fixed chart top/bottom and correct canvas geometry;
- analytical state invariant;
- no evidence request or analytical generation change.

### Credentials and Sources
- registered key not exposed in normal editable field;
- failed replacement preserves working key;
- canonical source identity/class/provenance/Health/horizon behavior;
- no local-only evidence, proxy substitution, or fabricated intraday points.

A gate is invalid if it proves only that UI appeared to respond while the underlying capability was not observed.

---

## 15. Publication gate
For the rollback, no application source is modified. Publish only governance/qualification changes while preserving current `main`, then verify Pages still serves the exact Turn 18 blob.

For later reconstructed releases, publication requires:
1. fetch current `main`;
2. preserve unrelated repository/data movement;
3. verify exact candidate/governance diff;
4. run complete matrix on exact merged-main artifact;
5. verify Pages deployment;
6. return cache-busted URL + exact merge SHA for owner test.

A successful Pages deployment is not product qualification.
