# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-03
Owner handoff target: Claude or any successor builder

## 1. Executive definition
Market Navigator is an evidence-backed market research application with four permanent modes:

**NOW · EXPLORE · LIBRARY · HEALTH**

with **CONFIG** separated at the bottom of the left rail.

The application is not a continuation of any single historical HTML file. The next release is a **clean reconstruction from the current product contract using proven historical donors by capability**.

The product principle is:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest / Source Health → chart and analysis consumers → AI interpretation**

The backend owns objective, deterministic, reproducible evidence. AI interprets evidence; it does not invent source facts.

**NOW explains. EXPLORE investigates. LIBRARY remembers and continues. HEALTH establishes trust.**

---

## 2. Source-of-truth hierarchy
When sources disagree, use this order:

1. **This Master Plan** — current product/build/qualification authority.
2. **`MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md` dated 2026-09-03** — authoritative interaction contract for NOW/V1/V2/V3/EXPLORE; its content is folded into this plan.
3. **Owner-reviewed accepted interaction/chart behavior** in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, only where not superseded here.
4. **Canonical backend definitions and observations** under `data/market-backend/` and `market-data/`, after schema and freshness are verified.
5. **Historical donor implementations**, used only for the capabilities explicitly assigned in §4.
6. **Graveyard** (`MARKET-NAVIGATOR-GRAVEYARD.md`) as the binding negative specification.

Rejected Gate 4 releases are evidence only. They are never implementation ancestors.

---

## 3. Critical reconstruction decision
Do **not** treat Market Navigator 3.9.7 as the application baseline.

3.9.7 is useful only as a **chart/data behavior donor** for proven mechanics such as multi-series rendering, real observation handling, touch/hover inspection, responsive chart sizing, historical data loading/cleaning, and selected-horizon behavior where compatible with the current contract.

The current product architecture is materially different from 3.9.7 and requires a clean application shell.

The next implementation therefore follows this rule:

**Construct the current Market Navigator surface cleanly; transplant only proven donor capabilities; do not inherit obsolete pages, cards, fake Market constructs, old navigation, or rejected release structure simply because they surround useful code.**

No iframe wrapper recovery. No compatibility patch stack. No patch-forward from R11/R12/R13. No historical file is automatically authoritative because it once worked.

---

## 4. Donor matrix — use by capability, not ancestry

### 4.1 Application shell / layout / persistent mode architecture
Primary donor:

**PRISM R25**

Exact reviewed URL/reference:
`prism/prism-turn01-pre-ship-r25.html` at commit `da6442f2702a5e681367884d403a5d14251f2da8`.

Use PRISM R25 as a donor for:
- left collapsible rail geometry;
- full-height no-page-scroll application shell;
- compact top/ribbon structure;
- responsive/mobile rail behavior;
- persistent analytical workspace geometry;
- Library split-pane structure;
- transcript + composer structure;
- drawer/modal patterns;
- compact control density;
- stateful mode switching patterns.

Do **not** copy PRISM domain-specific content, filters, sphere/treemap behavior, news/event semantics, or unrelated visual objects.

### 4.2 Chart engine / real observation behavior
Primary donors:
- Market Navigator 3.9.7 `market-view.html` at commit `c7bf516af9a3ed43233f5aeb5c63b6c2d53c7180`;
- accepted historical chart variants documented by `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`;
- later 3.9.x chart code only when independently verified as an improvement and not tied to rejected product geometry.

Use these donors for:
- multi-series plotting;
- axis rendering;
- real observation coordinates;
- responsive canvas/chart sizing;
- touch/hover inspection mechanics;
- canonical series cleanup/deduplication;
- historical range handling that is compatible with the current seven-horizon contract.

Do **not** inherit:
- old card-heavy home layouts;
- old category pages;
- any fake/extra Market index;
- obsolete horizons;
- obsolete page hierarchy;
- unrelated detail navigation;
- all-series popup behavior where it conflicts with the current single-active-series inspection contract.

### 4.3 AI provider/model configuration
Exact donor:

**`devstream-test.html`**

Reuse its provider/model/key state machine and interaction pattern rather than approximating it.

Required providers:
- Venice.ai;
- OpenRouter;
- Anthropic direct.

CONFIG validation and actual AI execution must consume the same authoritative saved state.

### 4.4 Analysis conversation
Exact presentation donor:

**`test.html`**

Reuse its conversation presentation principles for:
- AI/user turn bubbles;
- timestamps;
- persistent composer;
- continued conversation below Analysis;
- state restoration from Library.

### 4.5 Backend authority
Canonical product data comes from:
- `data/market-backend/` definitions/catalog/collector contracts;
- `market-data/` persisted UI-facing observations and manifests;
- Health/source-health evidence.

The browser must not silently become a second canonical acquisition system.

---

## 5. Permanent application frame
The production frame is:

- left collapsible rail: **NOW · EXPLORE · LIBRARY · HEALTH**;
- **CONFIG** fixed/separated at the bottom;
- one analytical workspace to the right;
- compact header/ribbon above the analytical surface;
- no page-level vertical scrolling for the core NOW journey on phone portrait;
- secondary detail may use modal/drawer/contained scrolling where required;
- no arbitrary redesign for implementation convenience.

The application shell should feel closer to PRISM R25 than historical 3.9.7 because it represents the current product architecture.

---

## 6. Canonical horizon contract
Exactly seven horizons:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

NOW defaults to **5D**.

There is exactly one selected horizon clock for the active analytical surface.

Rules:
- one common X-domain for every visible series in a given chart;
- horizon start/end are determined by the selected horizon and common clock, not independently from each series' own latest observation;
- monthly/weekly/stale series may terminate before the right edge;
- a slow-frequency series with no in-window observation remains an explicit degraded/no-in-window evidence case;
- no source series is stretched to appear current;
- no fabricated daily observations;
- no visual carry-forward masquerading as source observations.

All seven horizons are release-blocking QA across V1, every V2, and representative V3 cases. **5D, MTD and YTD receive explicit short-horizon review.**

---

## 7. NOW — canonical progression
The canonical NOW journey is:

**V1 Market → V2 selected Index replacement → V2 component information card → More info → V3 Analysis modal → close → exact prior V2 state**

There is no V4 product state.

EXPLORE is a separate principal entrance and is never V5.

---

## 8. V1 — Market overview
V1 is **one chart**, not a collection of cards.

Required:
- one primary chart footprint;
- exactly the three derived indices plotted together: **RSK · GRW · MAC**;
- direction-adjusted Indexed 100 representation;
- no fabricated fourth “Market” index or score curve;
- same selected horizon/common X-domain for all three;
- compact legend/series identities;
- one active series/one real-point inspection at a time;
- breadcrumbs/ribbon above the chart;
- core interaction visible without vertical page scrolling on phone portrait.

Selecting Risk, Growth or Macro transitions that same chart footprint to V2. It does **not** stack another chart below V1.

---

## 9. V2 — selected index + governed components
V2 replaces V1 in the exact same primary chart footprint.

Required:
- selected derived index reference curve;
- every governed component of that selected index;
- all visible together on the same comparison chart;
- direction-oriented Indexed 100 on Y1;
- no canonical V2 Y2;
- same common horizon/X-domain;
- compact legend/component identities corresponding to actual chart series;
- selected index curve must be visually distinct without overwhelming components;
- missing/stale/sparse/failed/cadence-incompatible components remain explicitly represented as degraded evidence rather than silently disappearing;
- source lines contain only real source observations;
- slow-frequency lines terminate at their real observation dates;
- context/horizon/series changes clear stale inspection.

The main substantive chart evolution from the previously working comparison behavior is deliberately narrow:

**the selected derived index curve is added to the governed component comparison chart.**

V2 is not a menu page, not component pills surrounding one line, and not a stacked second chart.

---

## 10. V2 component selection — information card
Selecting a component in V2 keeps V2 active and opens/updates a compact contextual information card.

Minimum content:
- component short identity and full identity;
- plain-language definition;
- role/direction in the selected index;
- provider/source;
- native unit;
- native cadence;
- latest real observation date/value;
- active-horizon evidence/health state;
- construction disclosure where relevant;
- explicit **More info** action.

The card is contextual, not a new page/state.

It must not push the core chart flow below the fold on phone portrait.

Changing component updates/replaces the card. Changing index or returning to V1 clears it.

---

## 11. V3 — Analysis
Only the information card's **More info** action launches V3 from V2.

V3 opens as a modal/contained analytical workspace over NOW and preserves the exact underlying V2 state.

Initial V3 state:
- exact selected root component;
- same selected horizon;
- native units;
- native Y1;
- real observations only;
- Market/index/component lineage retained;
- no unrelated default series.

Closing V3 restores exactly:
- same V2 index;
- same component selection;
- same information card;
- same horizon;
- same chart state;
- same inspection state where still valid.

V3 owns additive analysis. There is no separate V4.

Automatic axis rules:
1. one series → native Y1;
2. 2+ compatible same-measurement series → shared native Y1;
3. exactly two incompatible measurement families → native Y1 + Y2;
4. 3+ incompatible measurement families → Indexed 100 Y1, no Y2.

Required acceptance examples:
- WTI + Brent → shared native $/barrel Y1;
- CPI + Core CPI → shared compatible Y1;
- CPI + WTI → Y1 + Y2;
- CPI + WTI + VIX → Indexed 100;
- multi-component mixed set → Indexed 100 after evidence qualification.

**CPI + WTI is a mandatory mixed-frequency acceptance case.**

---

## 12. Point inspection contract
Every applicable chart follows:

- one active series at a time;
- select by line or compact series identity;
- snap to nearest **real** observation on that active series;
- one vertical guide;
- one point marker;
- one contextual date/value/unit popup/tag;
- explicit dismiss where practical;
- no all-series inspection popup;
- horizon/context/series-set changes clear stale inspection;
- a previous component's popup/marker must never persist after context changes.

---

## 13. Governed derived indices
Three derived indices only.

Construction principle: equal-weight, direction-adjusted, rebased 100, with deterministic documented mixed-cadence alignment for the derived composite. Source series remain real observations only.

### Risk
- SPY −1
- VIX +1
- high-yield credit spread +1
- high-yield / HY −1
- DXY +1
- MOVE +1
- financial conditions +1

### Growth
- Nasdaq +1
- copper +1
- small caps +1
- Federal Reserve Manufacturing Production / IPMAN +1
- WTI +1
- unemployment −1
- payrolls +1

Growth disclosure is mandatory: ISM Manufacturing PMI is excluded because no permissible free historical/current source is available. The owner-approved replacement is Federal Reserve Industrial Production: Manufacturing (NAICS), **IPMAN**. IPMAN must never be described or implied to be PMI.

### Macro
- 10Y +1
- 2Y +1
- 10Y−2Y +1
- 10Y−3M +1
- CPI +1
- Core PCE +1
- Fed Funds +1

A missing governed series is a backend/evidence gap, never permission for silent substitution.

Semantic colors:
- Risk = red;
- Growth = blue;
- Macro = neutral/white.

Component colors are comparison colors, not semantic reinterpretations.

---

## 14. Derived-index calculation integrity
The derived index must not change effective component population or weights simply because observations occur on different dates.

Before implementation, define and mechanically test one deterministic composite alignment rule covering:
- daily components;
- weekly components;
- monthly components;
- missing observations;
- stale observations;
- no-in-window observations;
- publication timing.

The derived composite may use a documented internal alignment/carry-forward rule solely for composite calculation if required, but:
- the rule must be deterministic and disclosed;
- source-series chart points must remain original real observations;
- no synthetic observation may be written into canonical source evidence;
- degraded component health must remain visible to the user;
- the index must disclose/support how many governed components currently support the calculation.

---

## 15. EXPLORE
EXPLORE is a principal application mode and a separate analytical entrance.

Flow:

**EXPLORE discovery → select one or more series → V3 Analysis**

Required:
- full-page canonical discovery/selection component;
- taxonomy: **Market | Risk | Growth | Macro | Other**;
- Omnisearch/search;
- multi-select;
- consistent item metadata and selection semantics;
- Market contains selectable Risk/Growth/Macro indices; Market itself is not a selectable fake series;
- Risk/Growth/Macro expose their index plus governed components;
- Other = catalog minus governed index constituents;
- same discovery component reused by Add Series inside V3.

Do not force EXPLORE through V1 or V2. Do not label it V5.

---

## 16. LIBRARY
LIBRARY is a persistent analysis workspace/history surface, not a static bookmark list.

The PRISM R25 Library structure is a strong shell donor.

Saving Analysis preserves:
- Market/index/root-component or Explore lineage;
- selected series;
- horizon;
- axis/normalization representation;
- evidence/provenance references;
- AI POV;
- full timestamped conversation;
- statistics/correlation state where active;
- saved/version time;
- resume context.

Opening a saved analysis restores the same analytical state and allows continued conversation.

Library requirements:
- left-side analysis list/cards;
- Omnisearch;
- readable selected analysis detail;
- evidence/source links where applicable;
- persistent transcript;
- persistent continuation composer;
- export/import where governed elsewhere;
- no hidden or disconnected chat continuation state.

---

## 17. AI / Analysis conversation
AI is integrated into V3/Library Analysis, not bolted on as a separate unrelated report page.

### Provider/model configuration
Use `devstream-test.html` as exact donor for provider/model/key state.

CONFIG must support:
- Venice.ai;
- OpenRouter;
- Anthropic direct;
- credential entry/storage;
- model discovery/selection;
- validation;
- switching;
- clear failure state.

There is one authoritative AI configuration state. A provider/model shown as validated in CONFIG must be the exact state used by Analysis execution.

Release-blocking proof:

**validated provider/model → actual AI request → successful persistent AI response**

### AI POV
AI POV is the opening AI turn for the active analysis.

Before interpretation it must preflight evidence for:
- stale/missing components;
- incomplete horizon coverage;
- expected publication lag versus collector/persistence failure;
- sparse density;
- mixed-frequency limitations;
- unavailable components;
- whether the visible index/chart is adequately supported.

If evidence is materially incomplete, the POV must state the limitation and narrow/refuse unsupported inference.

### Conversation presentation
Use `test.html` as presentation donor.

Below the V3 chart, conversation owns the continuation area:
- user and AI bubbles;
- visible timestamps;
- persistent composer;
- Markdown rendering;
- working hyperlinks for referenced sources/subjects;
- persistence/restoration with Library state.

No Tag/Clarify clutter or unrelated persistent stats blocks should displace conversation.

---

## 18. HEALTH
HEALTH is a root-cause diagnostic surface, not a green/red status table.

For each canonical series it must reconcile:

**series/source → publication expectation → actual canonical observation → collector attempt/result → persistence/cache/manifest state → horizon coverage/density → visible chart/index impact**

It must distinguish at minimum:
1. source has not published yet;
2. source published but collector missed/failed;
3. collector obtained data but canonical persistence/cache failed;
4. canonical data exists but active-horizon coverage is sparse/insufficient;
5. cadence incompatibility makes a comparison misleading;
6. stale or missing evidence affects a derived index.

Required metadata:
- source/provider and source identifier;
- native cadence;
- publication lag/expected-availability rule;
- latest publicly expected observation where determinable;
- actual latest canonical observation;
- last collection attempt/result;
- last successful collection;
- persistence/cache/manifest state;
- next expected publication/update;
- horizon coverage;
- active-horizon observation density;
- provenance/error state;
- health class: current / expected-lag / stale / missing / failed / sparse.

Cadence alone can never justify `expected-lag`.

---

## 19. Statistics / latest values / correlation
Statistics bind to the exact active analytical state.

Latest real observation date/value for visible series plus active correlation summary should occupy one compact upper-right chart overlay with explicit close.

Closing the overlay is presentation-only and must not mutate:
- series;
- horizon;
- axes;
- normalization;
- correlation;
- Analysis state.

No persistent below-chart statistics block may consume the conversation area.

---

## 20. Print / Download
Download must export the exact active report/evidence state plus exact underlying data used by that state.

Print must produce a formatted report reconciled to the same analytical/evidence state.

No export may silently include a different series set, horizon, or evidence revision than the visible Analysis state.

---

## 21. Data and schema preconditions
Before chart construction, prove the persisted schema for every governed component.

For every governed ID verify:
- canonical ID;
- actual persisted filename/path;
- observation field names/types;
- timestamp semantics/time zone;
- unit/measurement family;
- provider/source ID;
- cadence;
- latest canonical observation;
- required historical depth for 5YR;
- health linkage.

Resolve filename/identity mismatches before UI implementation. Examples such as `manufacturingProduction` versus `industrialProduction` must not be guessed around in the browser.

The browser is a consumer of the reconciled canonical model, not the place where naming inconsistencies are hidden.

---

## 22. Build architecture
The new release should be built as a coherent application, not a wrapper chain.

Preferred structure:
- one canonical Market Navigator HTML shell;
- modular JS/CSS files where useful;
- one application state model;
- one chart engine;
- one horizon engine;
- one series/catalog identity map;
- one Analysis engine;
- one discovery component shared by EXPLORE/Add Series;
- one AI configuration/execution state;
- one Library persistence model;
- Health reading the same evidence state used by charts.

Do not create parallel implementations for the same product concept.

---

## 23. Explicit non-goals / prohibited regressions
Do not introduce:
- fake Market index/curve;
- card-grid V1 instead of the single three-index chart;
- stacked V1 + V2;
- V2 as one line plus navigation pills;
- dedicated Back-to-Market button when breadcrumbs suffice;
- V4 or V5 product states;
- direct V2 component → V3 without the information-card bridge;
- arbitrary anchors/postcard cards/intermediate pages;
- synthetic/random/fallback chart evidence;
- silent component substitution;
- per-series horizon domains;
- stretched monthly/weekly source lines;
- missing/incorrect X/Y1/Y2 axes;
- all-series inspection popup;
- stale inspection surviving context changes;
- duplicate chart engines;
- duplicate discovery implementations;
- duplicate AI entry points;
- CONFIG validation disconnected from AI execution;
- AI spin-and-disappear behavior;
- browser-side second canonical Yahoo/FRED store;
- Library without continuation composer;
- Library/Analysis without working source hyperlinks;
- production QA/redline clutter on the primary chart surface;
- release URLs before complete pre-ship qualification.

---

## 24. Required construction sequence
This sequence is binding unless a concrete technical blocker requires reordering.

### Phase A — pre-base / donor qualification
1. Freeze this plan and Graveyard.
2. Inventory exact donor artifacts and commits.
3. Qualify PRISM R25 shell geometry and state patterns.
4. Qualify historical chart donor mechanics separately from historical product layout.
5. Verify canonical governed series schema/availability/history.
6. Define deterministic derived-index alignment rule.
7. Define one common seven-horizon clock.
8. Produce a donor-to-target mapping showing exactly what is reused and what is not.

No owner test URL during pre-base.

### Phase B — base application shell
1. Build current Market Navigator shell with left rail and permanent modes.
2. Implement responsive/no-scroll workspace geometry.
3. Implement common state/routing model.
4. Integrate CONFIG shell/state donor.
5. Do not yet add speculative secondary features.

### Phase C — NOW V1
1. Implement one canonical chart engine.
2. Implement seven-horizon engine.
3. Render RSK/GRW/MAC together on one V1 chart.
4. Prove common X-domain, axes, real observations, inspection.
5. No fake Market series.

### Phase D — NOW V2
1. Risk selection replaces V1 with Risk V2 in the same footprint.
2. Repeat for Growth and Macro.
3. V2 plots selected index + all governed components.
4. Explicit degraded representation for unavailable/sparse components.
5. Implement compact identities/legend.
6. Implement component information card.

### Phase E — V3 Analysis
1. More info opens exact selected component in V3.
2. Preserve horizon and lineage.
3. Implement automatic axis rules.
4. Implement additive series behavior inside V3.
5. Implement exact-state close/restore to V2.
6. Prove CPI+WTI mixed-frequency behavior.

### Phase F — EXPLORE
1. Implement canonical discovery component.
2. Full-page EXPLORE presentation.
3. Reuse same component for Add Series in V3.
4. EXPLORE selection converges on V3 without traversing V1/V2.

### Phase G — AI / conversation / Library
1. Integrate exact AI config state donor.
2. Prove real validated-provider round trip.
3. Integrate AI POV preflight.
4. Integrate persistent conversation presentation.
5. Integrate Library save/resume and continuation composer.
6. Ensure working source hyperlinks in AI output/evidence.

### Phase H — HEALTH / export / overlays
1. Implement root-cause Health reconciliation.
2. Bind Health to the same canonical evidence used by charts.
3. Add compact stats/latest/correlation overlay.
4. Implement Print/Download exact-state export.

### Phase I — pre-ship qualification
Run the complete matrix in §25 against the exact candidate artifact.

### Phase J — ship / owner test
Only after all release-blocking gates pass:
- publish candidate;
- verify Pages deployment;
- return exact owner test URL and commit SHA;
- owner tests;
- no post-ship promotion until owner acceptance.

---

## 25. Mandatory pre-ship qualification matrix
The owner is not exploratory QA. The builder must prove the candidate before handing it over.

### 25.1 Syntax / boot / deployment
- JavaScript syntax checks for every executable asset;
- browser boot without uncaught exceptions;
- no missing required asset;
- Pages deployment success;
- candidate URL resolves to exact intended commit/artifact.

### 25.2 Application shell
Desktop + phone portrait:
- rail opens/closes correctly;
- NOW/EXPLORE/LIBRARY/HEALTH mode switching works;
- CONFIG remains separated;
- primary analytical surface stays usable without page-scroll hunt;
- no layout overlap/clipping.

### 25.3 V1
For each of 1D, 5D, MTD, YTD, 1YR, 3YR, 5YR:
- RSK/GRW/MAC all present;
- no fake Market curve;
- common X-domain;
- correct Indexed 100 Y1;
- visible X and Y1 axes;
- compact legend identity;
- single-active-series inspection;
- no stale popup after horizon/series changes.

### 25.4 Risk V2
For all seven horizons:
- Risk index present;
- all seven governed Risk components present or explicitly degraded;
- same common X-domain;
- no synthetic source points;
- short-horizon slow-frequency behavior correct;
- component card works;
- breadcrumbs work;
- no Back-to-Market button required.

### 25.5 Growth V2
For all seven horizons:
- Growth index present;
- all seven governed Growth components present or explicitly degraded;
- IPMAN correctly identified and never described as PMI;
- same common X-domain;
- no synthetic source points;
- component card works.

### 25.6 Macro V2
For all seven horizons:
- Macro index present;
- all seven governed Macro components present or explicitly degraded;
- CPI/Core PCE/Fed Funds cadence behavior correct;
- same common X-domain;
- no synthetic source points;
- component card works.

### 25.7 V2 → V3 → V2 journey
For representative components from each index:
- component selection opens information card, not V3;
- More info opens exact selected component V3;
- V3 starts native Y1 for one series;
- current horizon/lineage preserved;
- close restores exact V2 state/card/selection/horizon;
- prior inspection does not leak incorrectly.

### 25.8 V3 axis matrix
Mechanically verify:
- one series native Y1;
- compatible pair shared Y1;
- incompatible pair Y1+Y2;
- 3+ incompatible Indexed 100;
- X/Y1/Y2 labels and units correct;
- no axis overlap or missing axis.

### 25.9 Mixed frequency
Mandatory CPI + WTI:
- same selected X-domain;
- CPI points remain real monthly points;
- WTI points remain real daily points;
- CPI does not stretch to WTI's latest date;
- inspection snaps to real points;
- axis representation follows contract.

### 25.10 EXPLORE / Add Series
- same discovery component in both contexts;
- taxonomy correct;
- search works;
- multi-select works;
- Market is not selectable fake series;
- selection opens V3 correctly;
- no V5 label/state.

### 25.11 AI
- provider/model validation works;
- validated state is same state used by execution;
- real request succeeds;
- response persists;
- Markdown renders;
- referenced sources/subjects have working hyperlinks;
- failed request produces stable visible failure state;
- no spin-and-disappear.

### 25.12 Library
- save exact analysis state;
- reopen exact analysis state;
- conversation restored;
- continuation composer present and functional;
- evidence/source links work;
- continued AI exchange persists.

### 25.13 HEALTH
For at least one current, one stale/missing, and one sparse/mixed-frequency case:
- expected publication reconciled;
- actual canonical observation shown;
- collector/persistence state shown;
- visible chart/index impact explained;
- health classification justified.

### 25.14 Print / Download / overlay
- overlay exact to active state;
- closing overlay does not mutate analysis;
- Download contains exact visible series/horizon/evidence;
- Print matches active analysis state.

A candidate that fails any release-blocking item does not receive an owner-test URL.

---

## 26. Governance / anti-drift process
Required lifecycle:

**diagnose → Graveyard → Master Plan → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

Rules:
- rejected release is rolled back;
- rejected release never becomes next implementation ancestor;
- inspect rejected code only for diagnosis;
- no patch-forward from rejection;
- fetch current `main` and current target-file SHA immediately before every write/delete;
- unrelated movement on `main` is not a reason to stop; preserve newer unrelated work;
- owner is acceptance reviewer, not exploratory QA;
- no release URL with known defects;
- do not substitute governance activity for product progress.

---

## 27. Current release state
R11, R12 and R13 are rejected and belong to the Graveyard.

R13 wrapper and patch were removed from active `main`.

The next release is **not R13-plus-one patching** and is **not 3.9.7-plus-current-shell patching**.

It is a clean donor-based reconstruction under this plan.

The next candidate name/revision should be assigned only after pre-base donor/schema qualification is complete.

---

## 28. Handoff instruction to successor builder
A successor such as Claude should begin by reading, in order:

1. `MARKET-NAVIGATOR-MASTER-PLAN.md` — this file;
2. `MARKET-NAVIGATOR-GRAVEYARD.md`;
3. `MARKET-NAVIGATOR-NOW-EXPLORE-CONTRACT.md`;
4. `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`;
5. PRISM R25 donor at commit `da6442f2702a5e681367884d403a5d14251f2da8`;
6. 3.9.7 chart donor at commit `c7bf516af9a3ed43233f5aeb5c63b6c2d53c7180`;
7. `devstream-test.html`;
8. `test.html`;
9. canonical backend/index definition and persisted market-data schemas.

Before writing product code, the successor must produce internally (and commit if useful) a donor/schema qualification showing:
- what exact shell capability comes from PRISM;
- what exact chart mechanics come from historical Market Navigator;
- what exact AI/conversation mechanics come from the donors;
- verified governed-series IDs/files/schema/history;
- the common horizon clock;
- the derived-index mixed-cadence alignment rule.

Then build forward according to §24 and do not hand the owner a URL until §25 passes.
