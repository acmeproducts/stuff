# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-12
Next release scope: Turn 20
Owner handoff target: Claude or any successor builder

## 1. Executive definition
Market Navigator is an evidence-backed market research application with four permanent modes:

**NOW · EXPLORE · LIBRARY · HEALTH**

with **CONFIG** separated at the bottom of the left rail.

The analytical NOW journey has exactly three user-facing chart views:

**ENV → <INDEX> → <COMPONENT>**

Numbered view labels are prohibited in the active product, active governance, QA language, generated reports, breadcrumbs, titles, DOM text, and active implementation naming where they could leak into the product surface.

The product principle remains:

**Data Catalog → Collector → Smart Evidence Store → Operational Manifest / Source Health → chart and analysis consumers → AI interpretation**

The backend owns objective, deterministic, reproducible evidence. AI interprets evidence; it does not invent source facts.

**NOW explains. EXPLORE investigates. LIBRARY remembers and continues. HEALTH establishes trust.**

---

## 2. Source-of-truth hierarchy
When sources disagree, use this order:

1. **This Master Plan** — current product/build/qualification authority.
2. Owner-reviewed accepted interaction/chart behavior in `MARKET-VIEW-CHART-ACCEPTANCE-MATRIX.md`, only where not superseded here.
3. Canonical backend definitions and observations under `data/market-backend/`, `market-data/`, and `market-evidence/`, after schema and freshness are verified.
4. Historical donor implementations, used only for capabilities explicitly assigned here.
5. `MARKET-NAVIGATOR-GRAVEYARD.md` as the binding negative specification where not superseded by a newer owner decision in this plan.

Historical contracts that use obsolete numbered view terminology are evidence only. Their terminology is not authoritative and must not be reintroduced.

---

## 3. Build principle
Construct the current Market Navigator surface cleanly and reuse only proven donor capabilities.

Do not inherit obsolete pages, fake Market constructs, old navigation, wrappers, stacked patch layers, duplicate chart engines, or rejected release geometry simply because useful code is nearby.

There is one application state model, one chart engine, one horizon engine, one discovery component, one AI configuration/execution state, one Library persistence model, and one Health/evidence truth model.

---

## 4. Donor matrix

### 4.1 Application shell
Primary donor: PRISM R25 at commit `da6442f2702a5e681367884d403a5d14251f2da8`.

Use only for:
- left collapsible rail geometry;
- full-height application shell;
- responsive/mobile rail behavior;
- persistent workspace geometry;
- Library split-pane structure;
- transcript + composer structure;
- drawer/modal patterns;
- compact control density.

### 4.2 Chart engine
Primary donor: Market Navigator 3.9.7 `market-view.html` at commit `c7bf516af9a3ed43233f5aeb5c63b6c2d53c7180`, plus later accepted chart mechanics only when independently verified.

Use only for:
- multi-series plotting;
- real observation coordinates;
- axis rendering;
- responsive chart sizing;
- touch/hover inspection;
- canonical observation cleanup/deduplication;
- compatible historical range handling.

### 4.3 AI configuration
Exact donor: `devstream-test.html`.

Required providers:
- Venice.ai;
- OpenRouter;
- Anthropic direct.

CONFIG validation and actual AI execution must consume the same saved provider/model/key state.

### 4.4 Conversation
Exact presentation donor: `test.html`.

Reuse its principles for:
- AI/user turn bubbles;
- timestamps;
- persistent composer;
- continued conversation;
- state restoration from Library.

---

## 5. Permanent application frame
The production frame is:

- left collapsible rail: **NOW · EXPLORE · LIBRARY · HEALTH**;
- **CONFIG** fixed at the bottom;
- one analytical workspace to the right;
- no arbitrary redesign for implementation convenience;
- no page-level vertical scroll hunt for the core NOW journey;
- contained scrolling only where detail genuinely requires it.

---

## 6. Canonical chart chrome — mandatory across ENV, INDEX, and COMPONENT
All three chart views use the same three-section vertical structure. This is one shared component, not three approximations.

### Section A — single top row
Exactly one physical row at every supported width:

**clickable breadcrumb [left] | horizon controls [fixed center] | `…` context menu [reserved right slot]**

The seven horizon controls remain exactly **1D · 5D · MTD · YTD · 1YR · 3YR · 5YR** and own the fixed center region. The `…` menu owns a permanently reserved right-hand slot. The breadcrumb receives only the remaining left-side width and can never push the center or right region off-screen. The row never wraps.

The canonical visible root token is **ENV**. Breadcrumb forms are:
- `ENV`
- `ENV / RSK`
- `ENV / RSK / VIX`
- with comparisons: `ENV / RSK / VIX + 6 Components`.

At COMPONENT depth, **ENV** and the three-character INDEX token remain protected. Only the leaf/root-component segment may truncate with an ellipsis. Pointer hover exposes its full value; the leaf also carries accessible full-text disclosure for touch/assistive use. Breadcrumb ancestors are directly clickable drill-up navigation. No dedicated Back button is permitted.

### Section B — legend strip
A dedicated legend strip is always present directly below Section A, including single-series charts. Every legend key reproduces the configured line color, style and visible thickness.

Legend interaction is hierarchical:
- in **ENV**, tapping an index chip drills down to that INDEX;
- in **INDEX**, tapping either the INDEX chip or a component chip drills down to a standalone COMPONENT analytical chart for exactly that series;
- in **COMPONENT**, no deeper child exists, so tapping a chip only changes the active/reference series;
- at every chart depth, **long-pressing a legend chip opens series information without drilling**.

Added comparison series live in the legend rather than expanding the breadcrumb beyond the governed `+ X Components` suffix.

### Section C — centered footer
The footer contains one compact centered group:

**version/build | exact visible date range | representation selector**

The representation selector retains the governed modes **Native Y1 · Native Y1 + Y2 · Indexed 100**, enabling only mathematically valid choices. Legacy QA/chart-type text is prohibited.

## 7. Horizon contract
Exactly seven horizons:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

NOW defaults to **5D**.

Rules:
- one selected horizon clock for the active analytical surface;
- one common X-domain for every visible series in a chart;
- horizon boundaries come from the selected horizon/common clock, not each series independently;
- low-frequency series may terminate before the right edge;
- no source series is stretched to appear current;
- no fabricated daily observations;
- no visual carry-forward masquerading as source observations.

### 7.1 Horizon-aware display density
Long-horizon charts reduce only **rendered display density**. Canonical evidence remains untouched.

Display cadence is fixed by horizon:
- **1D · 5D · MTD** → native observation density;
- **YTD · 1YR** → weekly display density;
- **3YR · 5YR** → monthly display density.

The display reducer must select genuine persisted observations only. It must not average, interpolate, forward-fill, restamp, or fabricate observations. Within each weekly/monthly bucket, the representative real observation is selected to preserve the bucket's visible shape/deviation rather than blindly taking an arbitrary calendar endpoint; the first and last real observations in the active window are also retained.

Display-density reduction is presentation-only. It must not alter:
- canonical series/evidence;
- chart-window boundaries or baselines;
- axis truth or mathematical calculations;
- Data rows, correlation, AI evidence, downloads, or Library snapshots;
- crosshair/point inspection, which continues to snap against the **full real observation set** for the active series even when fewer points are drawn.

The same rendering rule applies consistently to ENVIRONMENT, INDEX, COMPONENT, and restored Library charts. No separate long-horizon chart engine is permitted.

Qualification must prove native density for 1D/5D/MTD, weekly density for YTD/1YR, monthly density for 3YR/5YR, fewer rendered points than source points for dense long-horizon series, and preservation of full-series inspection/data behavior.

---

## 8. ENV view
ENV is one chart, not a collection of cards.

Required:
- exactly three derived indices **RSK · GRW · MAC** plotted together;
- direction-adjusted Indexed 100 by default;
- no fabricated fourth score curve;
- one common horizon/X-domain;
- shared Section A/B/C chrome from §6;
- tapping an index **legend chip** drills to that INDEX;
- tapping a plotted index line selects it for immediate inspection and visual isolation but does not navigate;
- long-pressing an index legend chip opens compact information without navigating.

## 9. INDEX view
An INDEX view replaces ENV in the same chart footprint and shows the selected index plus every governed component as lines on one common horizon.

Navigation and inspection are deliberately separated:
- tapping any enabled **legend chip** drills directly to a standalone analytical chart for that exact series, including tapping the INDEX chip itself;
- tapping a plotted line selects/focuses that series for inspection without navigating;
- long-pressing a legend chip opens compact series information without navigating;
- the ENV breadcrumb ancestor drills up to ENV.

Missing/stale/sparse/failed/cadence-incompatible evidence remains truthful; source lines contain only real observations and slow-frequency lines end on their real observation dates.

## 10. Series information popover
Series information is optional reference material, not the navigation gate into COMPONENT.

It opens only from a deliberate **legend-chip long press** (or equivalent context gesture). Normal chip taps never auto-open it. The previous mandatory `More info → COMPONENT` bridge is retired.

The popover is compact, non-blocking, white with dark text, and anchored at the chart top-right. It uses minimal whitespace and this hierarchy:
- header: **Open | short/full title | ×**;
- body: **purpose/usage · unit · cadence · Health link**;
- footer: **←** at the left edge and **→** at the right edge.

The arrows traverse the visible legend order without wrapping. They change the active/reference series and popover contents together but do not drill. At the first/last series the unavailable arrow is disabled. `Open` deliberately opens that series as the standalone COMPONENT chart; if already at COMPONENT depth it can reset that selected series as the standalone root.

## 11. COMPONENT view
COMPONENT is the standalone analytical workspace for the selected root series and owns additive comparison series.

Entry is direct from an INDEX legend-chip tap (or EXPLORE). The selected horizon is preserved. A raw component opens in native units/Native Y1 when mathematically valid; a derived RSK/GRW/MAC index remains truthfully represented as Indexed 100 rather than being mislabeled as native evidence.

The breadcrumb never grows beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`. ENV and INDEX drill upward. If a derived parent INDEX remains plotted as context and one or more raw comparison series are present, that derived INDEX is not a COMPONENT leaf and is not counted in `+ X`. The first raw series becomes the COMPONENT root and `+ X` counts only the additional raw series. Thus a Growth-context chart containing `GRW + PCE + Payrolls + UNE` is `ENV / GRW / PCE + 2 Components`, not `ENV / GRW / GRW + 3 Components`. A derived-only standalone COMPONENT remains valid as `ENV / GRW / GRW` until a raw series is added.

At this bottom level:
- legend-chip tap changes the active/reference series only;
- plotted-line tap also changes active/reference series only;
- long press opens the information popover;
- Add Series remains available;
- no further implicit drill level is created.

Automatic representation rules remain:
1. one raw series → Native Y1;
2. compatible raw series → shared Native Y1;
3. exactly two incompatible measurement families → Native Y1 + Y2;
4. three or more incompatible families → Indexed 100;
5. a derived index by itself → Indexed 100.

Required mixed-series examples remain WTI + Brent, CPI + Core CPI, SPY + QQQ + WTI, DXY + VIX, CPI + WTI, and CPI + WTI + VIX.

## 12. Point inspection and active-series emphasis
Point inspection is single-active-series and real-observation based.

The interaction roles are fixed:
- **breadcrumb = drill up**;
- **legend chip = drill down when a child level exists**;
- **plotted series = select/inspect**;
- **long-press legend chip = information**.

Selecting a plotted series immediately makes it fully opaque/on top and fades the other visible series without changing configured line width/style. Hover/pointer movement immediately snaps to the nearest **full-resolution real observation** on the already-selected series; display downsampling never reduces inspection precision.

The inspection readout contains one vertical guide, one point marker, date, native value/unit and Indexed-100 value where valid. It remains pinned when the pointer leaves the chart. It updates when another point on the same active series is inspected, changes to the newly selected plotted series when selection changes, and can be explicitly dismissed with its `×`. Context/horizon changes clear stale inspection. No second click/focus mode and no all-series tooltip are permitted.

## 13. GDP and periodic evidence
Raw Real GDP level (`GDPC1`) is input evidence only and is not user-selectable.

User-facing GDP exposes exactly:
- **GDP q/q**;
- **GDP y/y**.

Both are deterministic transforms of real quarterly GDP levels and remain quarterly evidence.

No daily interpolation, horizon-end restamping, synthetic timestamps, or flat synthetic line is permitted.

Short-horizon selection does not make GDP q/q or GDP y/y unavailable merely because no new quarterly release falls inside the selected window. Only genuine quarterly transform observations are plotted; the latest valid transform remains available as periodic analytical context.

CPI/Core CPI remain their governed inflation-change series and are not reinterpreted as raw GDP-style levels.

---

## 14. Availability and WTI truthfulness
Availability is not one boolean truth. Keep distinct:
1. source/collector health;
2. evidence load/revision integrity;
3. direct-analysis availability;
4. derived-index mathematical eligibility.

Fetch/parse/revision failures must surface as actual evidence errors and must never silently become `unavailable`.

WTI is the mandatory regression case. Its historical zero crossing may make it ineligible for a particular Growth composite rebasing formula, but that composite-construction exclusion must never suppress WTI's real observations from INDEX, EXPLORE, or COMPONENT direct analysis.

---

## 15. Governed indices
Three derived indices only.

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

ISM Manufacturing PMI remains excluded because no permissible free historical/current source is available. IPMAN must never be described or implied to be PMI.

### Macro
- 10Y +1
- 2Y +1
- 10Y−2Y +1
- 10Y−3M +1
- CPI +1
- Core PCE +1
- Fed Funds +1

A missing governed series is a backend/evidence gap, never permission for silent substitution.

---

## 16. Series identity and Chart Config
Series style is identity-bound, never array-position-bound.

CONFIG contains exactly three tabs:

**AI | Chart Config | About**

One persistent close `×` is visible at the top-right of the CONFIG surface in every tab. Closing CONFIG returns to the exact view from which CONFIG was opened.

### Chart Config requirements
- presets: **Normal · Bright · Colorblind**;
- ten persistent series slots;
- per-slot color;
- per-slot thickness **1pt–12pt**;
- per-slot style **line · dash · dash-dot · dot · dot-dash**;
- local persistence;
- JSON export/import;
- immutable Library charts preserve their saved styles.

Desktop and mobile layouts are implementation details, but every control must be fully visible, operable, and non-overlapping. A clipped or inaccessible line-style selector is a release-blocking defect.

Changes preview immediately. **Save** commits persistence. Closing/canceling before Save discards unsaved changes and restores the persisted style state.

Removing another series must never recolor or restyle a surviving series.

---

## 17. Canonical context menu
There is one context-menu component and exactly one command order everywhere it appears:

1. **AI POV**
2. **Data**
3. **Print**
4. **Download Markdown**
5. **Download CSV**
6. **Download JSON**

It appears in Section A on ENVIRONMENT, INDEX, COMPONENT, and applicable EXPLORE analytical state.

**Data** is the exact-state data inspector for the selected chart series. For every selected raw series it exposes the complete canonical observation history available to the application, not only observations that happen to fall inside the current horizon. Each observation includes native value and an Indexed 100 value computed against the active chart-window baseline when that baseline is mathematically valid. Derived index series expose all derived observations available in the active chart context. The surface also reports Pearson correlation versus the currently active series. Correlation uses same-date real observations only; it does not interpolate, resample, forward-fill, or fabricate pairings. Insufficient paired observations or zero-variance inputs display `N/A`.

No other view-specific command is permitted inside this menu. Separate statistics controls must live elsewhere if retained.

The series set, active reference, chart-window baseline, representation, evidence revision, and chart state come from the exact active analytical state; expanding the Data rows to complete canonical history must not mutate that state.

---

## 18. EXPLORE
EXPLORE is a principal mode and a separate analytical entrance.

Required:
- full-page discovery/selection;
- taxonomy: **Market | Risk | Growth | Macro | Other**;
- Omnisearch/search;
- multi-select;
- consistent metadata and selection semantics;
- Market contains selectable Risk/Growth/Macro indices; Market itself is not a fake selectable series;
- Risk/Growth/Macro expose their index plus governed components;
- Other = catalog minus governed index constituents;
- same discovery component reused by Add Series inside COMPONENT.

EXPLORE selection converges on COMPONENT analysis without traversing ENVIRONMENT or INDEX unless the user explicitly navigates there.

---

## 19. LIBRARY
LIBRARY is persistent analysis/history, not a static bookmark list.

Saving an analysis preserves:
- ENVIRONMENT/index/root-component or Explore lineage;
- selected series;
- horizon;
- representation and axis assignment;
- evidence/provenance revision;
- AI POV;
- full timestamped conversation;
- saved/version time;
- exact chart snapshot, including styles and real observations.

Opening a saved analysis restores the same analytical state, renders the saved chart above the transcript, and allows continued conversation.

Required:
- analysis cards/list;
- Omnisearch;
- readable selected analysis detail;
- inline-editable generated title;
- saved chart above transcript;
- evidence/source links;
- persistent transcript;
- persistent continuation composer;
- no duplicate Library-only chart engine;
- no silent substitution of newer evidence for the frozen saved chart.

---

## 20. AI / conversation
AI POV is the opening AI turn for the active analysis.

Before interpretation it preflights:
- stale/missing components;
- incomplete horizon coverage;
- publication lag versus collector/persistence failure;
- sparse density;
- mixed-frequency limitations;
- unavailable components;
- whether the chart is adequately supported.

Conversation requirements:
- user/AI bubbles;
- visible timestamps;
- persistent composer;
- Markdown rendering;
- working hyperlinks for referenced sources/subjects;
- persistence/restoration with Library state.

---

## 21. HEALTH
HEALTH is a root-cause diagnostic surface.

For each canonical series reconcile:

**series/source → publication expectation → actual canonical observation → collector attempt/result → persistence/cache/manifest state → horizon coverage/density → visible chart/index impact**

Health must distinguish at minimum:
1. source has not published yet;
2. source published but collector missed/failed;
3. collector obtained data but persistence/cache failed;
4. canonical data exists but active-horizon coverage is sparse/insufficient;
5. cadence incompatibility makes a comparison misleading;
6. stale/missing evidence affects a derived index.

Cadence alone can never justify a healthy/current classification.

---

## 22. Data / statistics / correlation
The canonical **Data** command binds to the exact active analytical state and is presentation-only. Closing it must not mutate series, horizon, axes, representation, active selection, or analysis state.

For raw series, the Data surface contains the complete canonical series history available to the application with native and Indexed 100 values. Indexed 100 is calculated against the active chart-window baseline and preserves the plotted series direction where the current chart applies directional inversion. For derived indices, Data contains the full derived observation set available in the active chart context. Correlation is Pearson correlation versus the active series over same-date real observations from those Data rows. No interpolation, forward-fill, resampling, or synthetic alignment is permitted.

Additional statistical tools, if retained, are separate from the canonical `…` menu.

---

## 23. Print / Download
All exports bind to the exact visible analytical state.

- **Print** produces a formatted report matching the visible chart/evidence state.
- **Download Markdown** exports the exact report/analysis state.
- **Download CSV** exports the exact visible chart-series observations/data.
- **Download JSON** exports the exact chart-series/state/evidence metadata required for reproducibility.

No export may silently change series, horizon, representation, or evidence revision.

---

## 24. Race elimination and evidence coherence
The browser must not allow stale asynchronous responses to overwrite newer user state.

Required:
- one in-flight fetch promise per canonical series per boot;
- render-generation guards for every chart/discovery surface;
- catalog, Health, derived evidence, and series evidence validated against a coherent session revision/anchor contract;
- stale horizon/series responses discarded;
- evidence failures reported explicitly rather than converted to availability falsehoods.

---

## 25. Explicit prohibited regressions
Do not introduce:
- numbered user-facing view terminology;
- fake Environment/Market index or curve;
- stacked ENVIRONMENT + INDEX charts;
- dedicated Back button where breadcrumbs provide navigation;
- breadcrumb wrapping;
- breadcrumb growth beyond `ENV / <INDEX> / <ROOT COMPONENT> + X Components`;
- allowing breadcrumb content to push the fixed-center horizons or reserved `…` slot off-screen;
- inconsistent top-row/menu/legend structure between chart views;
- header version label when version belongs in Section C;
- white plotted-series outline as the active-series emphasis mechanism;
- second-click/toggle friction to clear crosshair emphasis;
- line-width mutation merely to indicate active inspection;
- view-specific context-menu variants;
- inaccessible Chart Config controls;
- missing CONFIG close control;
- synthetic/random/fallback chart evidence;
- silent component substitution;
- per-series horizon domains;
- stretched low-frequency source lines;
- missing/incorrect X/Y axes;
- all-series inspection popup;
- stale inspection surviving context changes;
- duplicate chart engines;
- duplicate discovery implementations;
- duplicate AI state;
- Library without continuation composer;
- Library without the exact saved chart;
- production QA/redline clutter on the chart surface;
- release URL before complete qualification.

---

## 26. Next-release construction sequence
This sequence is binding.

### Phase A — plan freeze
1. This plan is the authoritative interaction contract.
2. Update negative specification only where needed to prevent resurrection of rejected behavior.
3. No application code before the plan is frozen.

### Phase B — shared chrome and terminology
1. Replace active numbered view concepts with ENVIRONMENT / INDEX / COMPONENT naming throughout active code and QA.
2. Implement one shared Section A/B/C chart-chrome component.
3. Preserve exact chart state while navigating breadcrumbs.
4. Move version/build to centered Section C.
5. Implement the representation selector using the governed representation modes.

### Phase C — active-series inspection treatment
1. Remove white plotted-series outline treatment.
2. During crosshair inspection, keep active series fully opaque/on top.
3. Fade non-active series automatically.
4. Preserve existing tooltip/crosshair information and interaction semantics.
5. No additional click/toggle state.

### Phase D — CONFIG correction
1. Add one persistent `×` across AI / Chart Config / About.
2. Ensure all ten color/thickness/style controls are fully operable on desktop and mobile.
3. Preserve live preview + Save persistence + discard-on-unsaved-close behavior.

### Phase E — canonical context menu
1. One shared menu component.
2. Exact command order from §17 everywhere it appears.
3. Remove any special per-view command variants.

### Phase F — regression preservation
Preserve Turn 15 corrections:
- GDP q/q and GDP y/y;
- raw GDP evidence-only status;
- WTI direct-analysis availability independent of Growth composite eligibility;
- line rendering for ENVIRONMENT and INDEX;
- identity-bound ten-slot styling;
- race guards and explicit evidence-error handling;
- Library chart persistence;
- AI/provider state.

### Phase G — pre-ship qualification
Run the complete matrix in §27 against the exact candidate artifact.

### Phase H — owner test
Only after every release-blocking gate passes:
- publish candidate;
- verify Pages deployment;
- return exact cache-busted owner test URL and commit SHA.

---

## 27. Mandatory pre-ship qualification matrix
The owner is not exploratory QA. The builder proves the candidate before handoff.

### 27.1 Syntax / boot / deployment
- JavaScript syntax passes;
- browser boots without uncaught application exceptions;
- no missing required asset;
- Pages deployment succeeds;
- candidate URL resolves to the intended artifact.

### 27.2 Shared chart chrome
Desktop and phone:
- ENVIRONMENT, every INDEX, and representative COMPONENT states use identical Section A/B/C geometry;
- breadcrumb left, horizons fixed center, menu right;
- row never wraps;
- long breadcrumb truncates with ellipsis and full text is discoverable;
- breadcrumbs navigate correctly without Back button;
- legend strip always occupies Row 2;
- version/build appears in Section C, not header;
- footer date range equals visible chart domain;
- representation selector reflects current mode and valid changes update chart in place.

### 27.3 ENVIRONMENT
For every horizon:
- RSK/GRW/MAC all present as lines;
- no fake Environment/Market curve;
- common X-domain;
- Indexed 100 default correct;
- axes visible/correct;
- canonical menu exact.

### 27.4 INDEX views
For Risk, Growth, Macro across all horizons:
- selected index present as line;
- all governed components present or explicitly degraded;
- common X-domain;
- no synthetic source points;
- component card works;
- breadcrumb and legend strip correct;
- canonical menu exact.

### 27.5 COMPONENT journey
For representative components from each index:
- information card precedes COMPONENT view;
- root component and horizon preserved;
- additive series update only legend and `+ X Components` suffix;
- close restores exact prior INDEX state;
- no stale inspection leakage.

### 27.6 Axis / representation matrix
Mechanically verify:
- one series Native Y1;
- compatible pair shared Native Y1;
- incompatible pair Native Y1 + Y2;
- three or more incompatible families Indexed 100;
- footer selector accurately reflects and can switch among valid representations;
- labels/units remain correct.

Mandatory examples:
- WTI + Brent;
- CPI + Core CPI;
- SPY + QQQ + WTI;
- DXY + VIX;
- CPI + WTI;
- CPI + WTI + VIX.

### 27.7 Crosshair active-series emphasis
- active series remains fully opaque and visually above others;
- non-active series fade while inspection is active;
- configured widths do not change;
- tooltip content remains unchanged from governed inspection contract;
- no second click is required;
- emphasis clears automatically when inspection/context ends;
- no white plotted-series outline remains.

### 27.8 GDP / WTI / mixed frequency
- raw GDP not selectable;
- GDP q/q and GDP y/y selectable as periodic evidence;
- no synthetic GDP timestamps/points;
- WTI directly selectable on short horizons when canonical evidence supports it;
- WTI composite ineligibility never suppresses direct analysis;
- CPI + WTI preserves real monthly/daily points and correct common X-domain.

### 27.9 CONFIG
Desktop + mobile:
- AI / Chart Config / About tabs all work;
- one persistent `×` is visible and closes CONFIG from every tab;
- all ten style rows fully operable;
- color control works;
- 1–12pt thickness works;
- all five line styles work;
- no clipping/overlap/inoperable desktop selector;
- live preview works;
- Save persists after reload;
- unsaved close restores persisted state;
- import/export works.

### 27.10 Canonical menu
On ENVIRONMENT, INDEX, COMPONENT, and applicable EXPLORE state:
- same six commands;
- same order;
- same labels;
- actions bind to exact visible state;
- no per-view extras.

### 27.11 Race / evidence gates
- rapid horizon switching cannot render stale final state;
- rapid component/series switching cannot render stale final state;
- one in-flight canonical fetch per series per boot;
- deliberate evidence failure surfaces as an evidence error, not `unavailable`;
- Health/chart/derived/session evidence coherence is mechanically asserted.

### 27.12 Library / AI preservation
- exact saved chart restores above transcript;
- chart styles/representation/evidence revision preserved;
- transcript and continuation composer persist;
- AI Markdown renders;
- referenced sources/subjects have working hyperlinks;
- validated provider/model is the state actually used for execution.

A candidate that fails any release-blocking item does not receive an owner-test URL.

---

## 28. Governance / anti-drift
Required lifecycle:

**diagnose → plan → build → pre-ship qualification → publish → owner test**

Rules:
- owner feedback changes only the identified contract unless explicitly broader;
- do not re-open settled behavior without a new owner request;
- do not ask the owner to reconfirm already-specified mechanics;
- rejected implementation behavior is not the ancestor for the next release;
- fetch current `main` and target-file SHA before writes;
- unrelated movement on `main` is not a reason to overwrite unrelated work;
- no release URL with known defects;
- do not substitute governance activity for product progress.

---

## 29. Current release state
Turn 18 is the current qualified release baseline. Turn 19 is a bounded interaction/navigation correction over that qualified baseline.

Turn 19 changes only:
- visible root token **ENV**;
- protected Section A geometry so breadcrumb text can never displace horizons or `…`;
- breadcrumb drill-up / legend drill-down / plotted-series inspect semantics;
- direct INDEX legend → standalone COMPONENT entry, including the INDEX itself;
- bottom-level legend taps as active/reference selection only;
- long-press-only compact information popover;
- pinned dismissible crosshair/readout behavior.

Turn 18 horizon-aware display density, Turn 17 Data/correlation and browser TTS, GDP q/q/y/y, WTI truthfulness, Chart Config, exports, AI/provider state, evidence coherence/race guards and immutable Library chart behavior remain protected regressions.

## Turn 17 card navigation and Library listen contract

### Contextual series-card navigation
The compact top-right component card includes **previous** and **next** arrow controls. The arrows traverse the currently selectable component series in the same order as the INDEX legend. The first component disables previous and the last component disables next; navigation does not wrap.

One arrow press is exactly equivalent to selecting the adjacent legend chip: it updates the active series, selected chip, card contents, and chart isolation together and leaves pointer-hover crosshair inspection immediately ready. There is no intermediate focus state and no second confirmation click.

### Library browser TTS
Market Navigator Library adopts the current PRISM Library browser-readout interaction as its TTS donor. It uses the browser Web Speech API (`SpeechSynthesisUtterance` / `speechSynthesis`) and does not add a TTS provider or network dependency in Turn 17.

The Library footer has **Chat** and **Listen** modes. Listen reads completed assistant analysis responses, supports play/pause, previous/next response, and previous/next readout row, and automatically advances through the current response and then subsequent completed assistant responses. Changing to Chat stops browser speech. TTS is presentation-only and must not mutate the Analysis record, frozen evidence, chart state, or conversation.

### Deferred backlog — downloadable TTS audio
**Downloadable MP3 TTS is deferred backlog and is explicitly out of Turn 17.** Browser `speechSynthesis` remains the playback mechanism for now. A future release may add a file-producing TTS engine/provider that renders the same analysis text into temporary audio and exposes an explicit MP3 download; generated audio must remain temporary unless the user explicitly downloads it.

## 30. Turn 20 — lifecycle and AI snapshot truth correction
Turn 20 is a narrow owner-directed correction over qualified Turn 19. It does not redesign the chart system, evidence model, Library, Config, display density, or interaction grammar.

Release-blocking corrections:
- **AI POV consumes the exact frozen chart state that is visibly rendered.** It must not reconstruct a COMPONENT chart by re-fetching raw-series files after the chart has already been rendered. Derived RSK/GRW/MAC curves in the visible chart therefore remain `available: true` with their real derived observations in AI evidence and the persisted Library chart snapshot.
- **Derived parent context is not a duplicated COMPONENT leaf.** When a derived INDEX is the starting standalone series and the user adds the first raw series, that raw series becomes the COMPONENT root; the parent INDEX may remain plotted as context but is excluded from the leaf `+ X` count.
- **Breadcrumb lifecycle must be explicitly qualified end-to-end:** ENV index-chip tap → INDEX; INDEX component-chip tap → COMPONENT; COMPONENT INDEX ancestor tap → the same INDEX; COMPONENT ENV ancestor tap → ENV; bottom-level legend taps remain select/reference only and never create a fourth level.
- **AI/Library regression gate:** a COMPONENT chart containing a derived index plus raw comparison series must persist the derived index with non-empty plotted points and must send it to AI as available evidence.

Turn 20 acceptance example: `GRW + PCE + Payrolls + UNE` at COMPONENT depth renders breadcrumb `ENV / GRW / PCE + 2 Components`; AI evidence and the saved Library chart both retain the visible GRW curve.

