# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT DEFINITION
Updated: 2026-08-31

## 1. Product principle
Market Navigator is an evidence-backed market research environment.

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest → visualization/API consumers + AI interpretation**

The backend owns objective, deterministic and reproducible evidence. AI interprets evidence; it does not create source facts.

**Now explains. Explore investigates. Library remembers and continues. Health establishes trust.**

## 2. Permanent application frame
- Left collapsible rail: **NOW · EXPLORE · LIBRARY · HEALTH**.
- **CONFIG** is separated at the bottom of the rail.
- Right side is the analytical workspace.
- Hamburger collapses/restores the rail on desktop and opens/closes it on mobile.
- Preserve the accepted Market Navigator 3.9.7 application frame/layout unless an explicit clause below requires a change.
- No arbitrary visual/spatial redesign for implementation convenience.

## 3. Canonical horizons
Exactly:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

Now defaults to **5D**.

One common horizon clock owns the chart X-domain. A monthly/weekly/stale component may terminate early or have no in-window observation; it may never expand the selected horizon.

## 4. Accepted analytical lineage — DO NOT REINVENT
The accepted product lineage is:

**V1 Market + V2 selected Index together in NOW → V3 exact Component Analysis → additive/multi-series Analysis**

Historical V4 capability is collapsed into V3 Analysis. Historical V5 is abandoned and MUST NOT be recreated as a separate product state.

### V1 — Market
- V1 is the Market container showing **Risk / Growth / Macro** derived index trendlines together.
- Legend identity: **RSK / GRW / MAC**.
- All three use the same selected horizon and Indexed-100 representation.
- Market is not a fourth score/trendline.
- V1 remains visible in NOW when an index is selected.
- Selecting Risk/Growth/Macro updates V2 below; it does not navigate away from NOW.

### V2 — selected Index + components
- V2 is persistent below V1 in NOW.
- It contains the selected derived index reference plus every governed component for that index.
- V1 and V2 share the same horizon/X-domain.
- V2 comparison representation is direction-oriented Indexed 100.
- Slow-frequency components do not stretch the X-axis and must not be visually presented as real flat daily paths.
- Missing/stale/sparse/cadence-incompatible components remain visible as degraded evidence rather than silently disappearing.
- **Selecting a V2 component launches V3 for that exact component.** This accepted V2→V3 journey must not be replaced by another modal/page hierarchy.

### V3 — Component / Analysis
- V3 opens on exactly the selected component.
- Single-series V3 uses native units on native Y1.
- V3 is additive: adding compatible/incompatible series automatically invokes the former V4 multi-series capability inside the same Analysis state.
- There is no separate V4 page/state.
- There is no V5 representation-control product state.
- Additive Analysis breadcrumb leaf is `<root component> + Custom` while preserving parent Market/index lineage internally.

## 5. One chart engine / one visual contract
There is one canonical chart engine shared by V1, V2 and V3/Analysis.

Every applicable chart preserves:
- persistent series identity,
- selected horizon X-domain,
- visible X-axis,
- visible Y1,
- Y2 only when required,
- native/indexed units,
- measurement-aware tick precision,
- legend grammar,
- actual observation coordinates,
- transferable point inspection,
- missing-data semantics,
- normalization semantics,
- provenance/health state,
- mobile touch behavior.

A chart is failed if technically populated but visually or analytically misleading, including sparse-line artifacts, stale evidence shown as current, invalid mixed-frequency geometry, missing axes, or distorted derived-index scaling.

## 6. Derived analytical indices
Three indices only: **Risk, Growth, Macro**. Equal-weight, direction-adjusted, rebased 100.

The accepted product definitions below are authoritative. `data/market-backend/derived-index-definition.json` must be reconciled to them before the next implementation consumes it. Do not substitute whatever series happen to be present in the current catalog.

### Risk
- SPY −1
- VIX +1
- credit spread +1
- high yield / HY −1
- DXY +1
- MOVE +1
- financial conditions +1

### Growth
- Nasdaq +1
- copper +1
- small caps +1
- Federal Reserve Manufacturing Production (IPMAN) +1
- WTI +1
- unemployment −1
- payrolls +1

**Growth construction disclosure:** ISM Manufacturing PMI is explicitly excluded as of 2026-09-01 because no permissible free historical/current source exists: FRED removed ISM data, public ISM pages prohibit recreating/incorporating the index without authorization, and available API access is licensed. The owner-approved replacement is the Federal Reserve Board's open **Industrial Production: Manufacturing (NAICS), IPMAN** series. Growth V2/About/Analysis build detail must display this exclusion and replacement; it must never imply that IPMAN is PMI.

### Macro
- 10Y +1
- 2Y +1
- 10Y−2Y +1
- 10Y−3M +1
- CPI +1
- Core PCE +1
- Fed Funds +1

Any missing catalog/source series required by these definitions are backend gaps to resolve explicitly. They are not permission to replace components.

Semantic colors: Risk red, Growth blue, Macro white/neutral. Ordinary component comparison colors are non-semantic.

## 7. Axis assignment inside V3/Analysis
Automatic representation only:
1. one series → native Y1;
2. 2+ compatible native-unit series → shared native Y1;
3. exactly two incompatible measurement families → native Y1 + Y2;
4. 3+ incompatible measurement families → Indexed-100 Y1, no Y2.

No separate V5 manual-representation state.

Required examples:
- WTI + Brent → one native $/barrel Y1;
- CPI + Core CPI → one percentage Y1;
- CPI + WTI → native Y1 + Y2;
- CPI + WTI + VIX → Indexed 100;
- seven mixed components → Indexed 100.

Indexed 100 is not permission to combine bad evidence blindly. Cadence, freshness, horizon coverage and density are evaluated first.

## 8. Time and mixed-frequency integrity
- Selected horizon owns X-domain for all visible series.
- Each direct source line contains only real source observations.
- No fabricated daily points.
- No visual carry-forward presented as a source observation.
- A source line ends at its latest real observation.
- Slow-frequency evidence never stretches to the latest fast-series date.
- **CPI + WTI is mandatory mixed-frequency acceptance.**
- V1 derived composites may use a documented internal carry-forward/composite-timestamp rule, but source observation dates remain traceable and no synthetic observation is written into canonical source evidence.

## 9. Point inspection
Accepted inspection is one active series / one real point:
- select series by line or legend/pill;
- snap to nearest real observation on that series;
- one vertical guide;
- one point marker;
- one contextual value/date/unit popup/tag;
- explicit dismiss where practical;
- no all-series popup;
- context/horizon/series-set changes clear inspection.

## 10. Three-row analytical ribbon
Row 1: H1 context (`Market: <sentiment>`, `Growth: <sentiment>`, `Payroll: <sentiment>`).

Row 2: compact interactive breadcrumbs using `/` and the accepted Market → Index → Component/Custom lineage.

Row 3: seven horizons centered; More at far right.

More contains:
- Add to Analysis,
- Add/Save to Library,
- Print,
- Download.

## 11. Add Series and Explore — one implementation
There is one canonical discovery/selection component used in two presentations:
- EXPLORE = full-page presentation;
- Add Series = modal presentation.

Same taxonomy, search, item rendering, metadata and selection semantics.

Tabs: **Market | Risk | Growth | Macro | Other**.

Market contains individually selectable Risk/Growth/Macro. Market itself is not a selectable series. Risk/Growth/Macro include index + governed components. Other is catalog minus the union of index constituents. Search and multi-select are required.

## 12. Data health contract
Every canonical series must expose enough metadata to answer whether the evidence is actually current and usable:
- source/provider and source identifier,
- native cadence,
- publication lag/expected availability rule,
- latest publicly expected observation where determinable,
- actual latest canonical observation,
- last collection attempt/result,
- last successful collection,
- persistence/cache/manifest state,
- next expected publication/update,
- horizon coverage,
- active-horizon observation density,
- provenance/error state,
- health class: current / expected-lag / stale / missing / failed / sparse.

**Cadence alone can never justify `expected-lag`.** First determine whether a newer observation should already be publicly available.

CPI acceptance example: if July CPI is publicly available and canonical CPI still ends June, Health must identify the source/collector/persistence gap; it must not label June as harmless monthly lag.

## 13. HEALTH
Health is a root-cause diagnostic surface, not a status table.

For degraded evidence it must connect:

**series/source → expected publication → actual canonical observation → collector attempt/result → persistence/cache/manifest state → horizon coverage/density → visible chart/index impact**

It must distinguish:
1. source has not published yet;
2. source published but collector failed/missed it;
3. collector obtained it but canonical persistence/cache failed;
4. canonical data exists but horizon coverage is sparse/insufficient;
5. cadence incompatibility makes a proposed comparison misleading.

Health must explain why the chart is bad, not merely label the data stale.

## 14. AI provider/model configuration
Exact donor: **`devstream-test.html`**.

Do not redesign or approximate:
- provider discovery,
- model discovery,
- credential entry/storage,
- validation,
- provider/model switching,
- failure messaging,
- composer interaction.

Required providers: Venice.ai, OpenRouter, Anthropic direct.

### Single authoritative state
CONFIG validation and AI execution MUST consume the same provider/model/key state. If CONFIG shows `validated`, POV/chat must use that exact validated state. A simultaneous `validated` CONFIG and `configure and validate first` Analysis response is release-blocking.

The next release must prove a real:

**validated provider/model → AI request → successful persistent AI response**

round trip. DOM/string presence or mocked validation does not count.

## 15. AI POV
AI POV is the opening AI turn in the active Analysis conversation, not a separate report surface.

Before interpretation it performs evidence-health preflight for:
- stale/missing components,
- incomplete horizon coverage,
- expected publication lag versus collection/persistence failure,
- sparse density,
- mixed-frequency limitations,
- unavailable components,
- whether the visible index/chart is adequately supported.

If evidence is materially incomplete, POV leads with that limitation and narrows/refuses unsupported inference.

Preserve the useful historical POV principle: use supplied evidence, separate observed facts from interpretation, describe current regime/tailwinds/headwinds/uncertainty/what-to-watch, and avoid manufactured certainty or unrelated series expansion.

AI lifecycle must be visible and deterministic. No spin-and-disappear behavior.

## 16. Analysis conversation
Exact presentation donor: **`test.html`**.

Everything below the V3/Analysis chart is reserved for the ongoing conversation:
- AI/user bubbles,
- visible date + time on every bubble,
- persistent composer.

Do not add Tag, Clarify Stream or composer-level Save.

Conversation is automatically persisted/restored with the Analysis/Library state.

No statistics/debug/QA/series-ending cards consume the below-chart conversation region.

## 17. Statistics / ending values / correlation
Statistics bind to the exact active analytical state.

Latest real observation date/value for visible series plus active correlation summary are shown together in one compact **upper-right chart overlay** with explicit `×`.

Closing the overlay is presentation-only and must not mutate series, horizon, axes, normalization, correlation or Analysis state.

## 18. LIBRARY
Saving Analysis preserves:
- Market/index/root-component lineage,
- selected series,
- horizon,
- axis/normalization representation,
- evidence/provenance references,
- AI POV,
- complete timestamped conversation,
- correlation/statistical state where active,
- resume context,
- save/version time.

Opening restores the same analytical state.

## 19. Print / Download
Download = exact active report/evidence plus exact underlying data.

Print = formatted report reconciled to the same analytical/evidence state.

## 20. Backend contract
- Data Catalog defines canonical identities/source metadata.
- Smart Evidence Store holds canonical observations.
- Operational Manifest describes runtime coverage/state.
- Source Health describes collector attempts/results.
- These are different roles and cannot substitute for one another.
- Collector HTTP success is not proof that the latest expected observation exists in canonical evidence.
- Browser does not reacquire Yahoo/FRED canonical evidence.
- Product horizon vocabulary must be reconciled to `1D, 5D, MTD, YTD, 1YR, 3YR, 5YR`.

## 21. Historical accepted chart contract
`MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md` remains an important accepted source for the chart engine and V1/V2/V3 relationship, subject to current supersession:
- retain V1 + V2 simultaneous NOW composition;
- retain direct V2 component → exact V3 component;
- retain the common horizon/axis engine and 105-axis audit principle;
- collapse historical V4 capability into additive V3/Analysis;
- abandon historical V5 as a separate state;
- current Gate 4 AI/Health/Library/ribbon requirements remain additive.

## 22. Gate 3 UX reference
Approved POC: `market-view-ux-gate3-p2.html`, commit `cfba7320e42028f09f2967304cb0c0dd0cc2988d`.

Use it as an interaction reference where consistent with this plan. Current plan explicitly governs the V1+V2 NOW composition and V2→V3 transition.

## 23. Gate 4 status
**ACTIVE — R7 SUCCESSOR REQUIRED. R6 IS REJECTED AND ROLLED BACK.**

Rejected/inert lineages include Gate4 R1, R2, rejected rewrite R3, R4, R5 and R6. See Graveyard.

### Governed R7 lineage
R7 starts from:
- exact restored 3.9.7 `market-view-gate4-r3.html` baseline;
- accepted V1/V2/V3 chart contract above;
- approved Gate 3 reference where not superseded;
- corrected accepted derived-index definitions;
- repaired canonical evidence/Health truth;
- exact `devstream-test.html` AI configuration donor;
- exact `test.html` Analysis conversation donor.

R7 MUST NOT descend from R4/R5/R6 HTML, JS/CSS/runtime, generated artifacts, workflows, layout decisions, state-transition shortcuts or validation logic.

## 24. Mandatory no-patch-forward process
**diagnose → Graveyard → Master Plan → restore approved baseline → pre-base → base → pre-ship → ship → owner test → post-ship only after acceptance**

A rejected ship is rolled back. It never becomes the next pre-base.

Rejected code may be inspected for diagnosis but is not the next implementation source.

## 25. R7 recovery order
1. Verify/freeze exact 3.9.7 baseline.
2. Reconcile accepted V1/V2/V3 model against the chart acceptance matrix and this plan.
3. Reconcile `derived-index-definition.json` to §6; surface catalog/source gaps rather than substitute components.
4. Repair data currentness/Health truth beginning with CPI and every contradictory stale/expected-lag case.
5. Implement/prove V1 + V2 simultaneous NOW composition.
6. Implement/prove direct V2 component → exact V3 root component.
7. Implement former V4 automatic multi-series behavior inside V3; do not create V4/V5 pages.
8. Integrate exact AI donor state and prove validated-provider → persistent AI response.
9. Integrate evidence-health POV preflight, conversation, shared discovery, Library, overlay, Print/Download.
10. Run complete release qualification against the exact deployed candidate before handing out a URL.

## 26. Mandatory release acceptance
A release must prove all of the following against the actual owner-visible UI and exact deployed artifact:
- exact baseline/frame visual parity except governed additions;
- functional desktop/mobile rail;
- seven horizons and common X-domain;
- V1 RSK/GRW/MAC all visible together;
- V1 remains visible when V2 is selected;
- V1 selection updates persistent V2 below;
- exact accepted derived-index component identity;
- V2 selected index + all components;
- direct V2 component → exact V3 root component;
- additive V3 automatic native/Y1-Y2/Indexed behavior;
- no separate V4 or V5 state;
- X/Y1/Y2 systematic audit across applicable states/horizons;
- transferable one-series/one-real-point inspection;
- CPI + WTI mixed-frequency correctness;
- independent latest-publication-vs-canonical data truth;
- Health explains publication/collector/persistence/coverage root cause and chart impact;
- shared Explore/Add-Series implementation;
- exact Library save/restore including conversation;
- exact donor AI provider/model behavior;
- validated CONFIG state equals execution state;
- real successful validated-provider → AI response round trip;
- degraded-evidence POV preflight;
- `test.html`-style timestamped conversation below chart only;
- compact dismissible summary/correlation overlay with state invariance;
- no browser Yahoo/FRED canonical reacquisition;
- no synthetic source curves;
- mobile/desktop visual analytical usefulness, not merely DOM presence.

## 27. Release validation mechanics
Before owner test:
1. real JavaScript syntax/parser check;
2. clean application boot with no uncaught exception;
3. exact Pages release identity;
4. structural contract checks;
5. baseline visual redline;
6. actual UI-event V1/V2/V3 journey tests, not internal function-call proxies;
7. accepted derived-index identity check against §6;
8. independent data publication/currentness checks including CPI;
9. Health root-cause checks;
10. AI donor parity plus real validated-provider execution round trip;
11. 105-axis principle/systematic X/Y1/Y2 audit plus mobile/desktop visual checks;
12. validation record bound to exact candidate commit and deployed artifact.

Automated PASS is not owner acceptance and cannot contradict observable product behavior.

## 28. Rejected approaches
See `MARKET-NAVIGATOR-GRAVEYARD.md`.

Explicitly prohibited:
- patching rejected descendants;
- reuse of R4/R5/R6 runtime/overlays/workflows/layouts;
- arbitrary layout changes;
- V1 disappearing when V2 is selected;
- V1 and V2 implemented as unrelated peer pages/tabs;
- replacing direct accepted V2→V3 with another product hierarchy;
- recreating V4 or V5 as separate product states;
- silently substituting different derived-index components;
- treating a drifted backend definition as authoritative merely because it says canonical;
- Health status-only/cadence-only classifications;
- collector success treated as observation-currentness proof;
- stretched/fabricated slow-frequency source lines;
- separate Explore and Add-Series implementations;
- duplicate chart engines;
- missing/incorrect axes;
- all-series point popup;
- provider validation state separate from AI execution state;
- CONFIG validated while Analysis says unconfigured;
- AI that analyzes degraded evidence without preflight;
- duplicate AI POV controls;
- spin-and-disappear AI requests;
- Tag/Clarify/composer-Save in the approved conversation surface;
- persistent below-chart statistics/correlation cards;
- browser-side canonical Yahoo/FRED reacquisition;
- handing the owner a candidate that has not passed the actual product journey, independent data truth, real AI round trip and exact-deployment gates.
