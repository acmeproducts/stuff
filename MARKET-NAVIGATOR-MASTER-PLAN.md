# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-12
Next release scope: Turn 23

## 1. Product definition
Market Navigator is an evidence-backed market research application with three permanent primary modes:

**NOW · LIBRARY · HEALTH**

with **CONFIG** fixed at the bottom of the left rail.

`EXPLORE` is retired as a separate mode. Its useful discovery capability is consolidated into **Add** inside NOW.

The NOW surface has one chart workspace and two context states:

- **ENV** — three derived indices: RSK · GRW · MAC.
- **Anchored index workspace** — one selected index plus a user-controlled visible-series set.

There is no separate COMPONENT page or modal. `COMPONENTS` may appear only as a non-clickable breadcrumb state marker indicating that the governed component basket is expanded.

The product principle remains:

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

## 3. Architectural rule
There is one NOW chart state:

**context index + component-basket-expanded flag + visible series set + active series + horizon + representation + frozen evidence revision**.

Do not maintain a second COMPONENT chart state, component modal state, Explore analytical state, or duplicated breadcrumb/series model.

AI POV, Data, Print, downloads, and Library snapshots consume the exact visible NOW chart state.

---

## 4. Permanent application frame
Left rail:

**NOW · LIBRARY · HEALTH**

CONFIG remains fixed at the bottom.

No separate EXPLORE route, page, navigation item, lineage, or analytical workflow is permitted.

NOW must fill the available shell continuously. Rail open/close, rotation, split-screen, and viewport changes may change chart width but may not vertically recenter the chart card or leave dead space above/below it. Canvas geometry is driven by the actual chart container and must redraw when that container changes size.

---

## 5. Canonical chart chrome
All NOW states use one shared three-section chart structure.

### Section A — one physical row

**breadcrumb [left] | 1D 5D MTD YTD 1YR 3YR 5YR [fixed center] | `…` [reserved right]**

The center horizons and right context-menu slot are reserved and may never be displaced by breadcrumb length. The row never wraps.

Valid breadcrumb forms:

- `ENV`
- `ENV / RSK`
- `ENV / RSK / COMPONENTS`
- `ENV / GRW`
- `ENV / GRW / COMPONENTS`
- `ENV / MAC`
- `ENV / MAC / COMPONENTS`

`COMPONENTS` is a state marker only. It is not a series name and is never clickable.

Clickability:

- `ENV` drills up to the neutral Environment chart.
- the index token drills from expanded components to the collapsed index-only state.
- there is no deeper breadcrumb level.

No breadcrumb may ever contain a duplicated index such as `ENV / GRW / GRW`.

### Section B — legend/composition strip
The legend is always present.

Every chip reproduces configured line color, pattern, and visible thickness.

Legend roles are state-dependent but frictionless:

- ENV: tapping RSK/GRW/MAC enters that anchored index workspace with the governed component basket expanded.
- collapsed anchored index: the anchor index is the only required series; tapping its chip expands the governed component basket.
- expanded anchored index: tapping any chip selects that series as active/reference; it does not navigate.
- long press on any chip opens compact series information without changing context.

The anchor index chip never has an `×` while its breadcrumb context is active.
Every non-anchor comparison/component chip has an `×` and can be removed without leaving the index context.
**Add** is always available in an anchored workspace and is the canonical discovery mechanism.

### Section C — centered footer

**version/build | exact visible date range | representation selector**

Representations remain:

- Native Y1
- Native Y1 + Y2
- Indexed 100

Only mathematically valid options are enabled.

---

## 6. NOW state mechanics
### 6.1 ENV neutral state
ENV plots exactly RSK · GRW · MAC.

On load:
- no index chip is selected by default;
- no series-isolation fade is active;
- all three series are displayed normally;
- there is no implicit preference for RSK.

A plotted-series tap selects that series for inspection only and does not navigate.
A legend-chip tap enters the corresponding anchored index workspace and immediately expands its governed components.

### 6.2 Anchored index — collapsed
Example: `ENV / GRW`.

Required state:
- GRW is the anchor context;
- GRW is the only required visible series;
- GRW chip has no `×`;
- Add is available;
- tapping the GRW chip expands all governed Growth components;
- tapping ENV returns to neutral ENV.

### 6.3 Anchored index — components expanded
Example: `ENV / GRW / COMPONENTS`.

Required state:
- GRW remains the immutable anchor while this breadcrumb context exists;
- GRW plus all governed Growth components are initially visible;
- GRW is the active/reference series on entry;
- component/comparison chips have `×` controls;
- Add is available;
- tapping a chip selects/highlights that series without navigation;
- tapping the GRW breadcrumb collapses back to `ENV / GRW` with only GRW required;
- tapping ENV returns to neutral ENV.

Removing every removable chip is valid; the anchor remains.
Added arbitrary catalog series do not change the breadcrumb hierarchy. The breadcrumb describes context; the legend describes composition.

---

## 7. Add replaces Explore
Add is the single discovery/catalog surface.

It must provide:
- search/Omnisearch;
- grouping: Risk · Growth · Macro · Other;
- canonical short name and full name;
- unit and cadence;
- availability for the active horizon;
- Health state;
- About/source access;
- add action.

The three derived indices may be added as single comparison series, but adding an index through Add does not auto-expand that index's component basket. Basket expansion is reserved for entering the index from ENV or tapping the active anchor chip from the collapsed anchor state.

There is no separate Explore state, page, lineage, or export path.

---

## 8. Active-series emphasis and inspection
Series selection and inspection are distinct from navigation.

When a series becomes active:
- it stays fully opaque and is drawn on top;
- all other visible series fade translucently;
- configured line width and style do not change;
- no second click is required.

Pointer hover immediately inspects the active series at the nearest full-resolution real observation. Touch/plot tap provides the equivalent selection/inspection behavior.

Inspection readout contains date, native value/unit, Indexed 100 value where valid, one point marker, one vertical guide, and explicit `×` dismissal. The readout remains pinned when the pointer leaves and updates as another point on the same active series is inspected.

For every raw/source series:

`Indexed 100 = 100 × value / baseline`

Component direction/weight applies only to derived-index construction and must never invert a raw/source chart, crosshair value, Data value, export, AI evidence, or Library snapshot.

---

## 9. Series information popover
Long press opens compact reference information only.

Required structure:
- header: Open · title · ×
- body: purpose/usage · unit · cadence · Health link
- footer: ← and → at opposite corners

Arrows traverse visible legend order without wrap. They update active series and popover contents together. `Open` selects/focuses that series inside the current NOW workspace and must not create a separate COMPONENT page.

---

## 10. Horizon contract
Exactly seven horizons:

**1D · 5D · MTD · YTD · 1YR · 3YR · 5YR**

NOW defaults to 5D.

One common X-domain applies to all visible series. Low-frequency series end at their real latest observation. No synthetic stretching, forward-fill, fabricated daily points, or horizon-end restamping is permitted.

### 10.1 Display density
Presentation-only display cadence:
- 1D · 5D · MTD → native
- YTD · 1YR → weekly
- 3YR · 5YR → monthly

The reducer selects real persisted observations only and preserves first/last real observations. Full canonical evidence remains available for inspection, Data, correlation, AI, downloads, and Library.

---

## 11. Axis / representation rules
Automatic representation:
1. one raw series → Native Y1;
2. compatible raw series → shared Native Y1;
3. exactly two incompatible measurement families → Native Y1 + Y2;
4. three or more incompatible families → Indexed 100;
5. a derived index alone → Indexed 100;
6. mixed derived/raw series may use Indexed 100 whenever native-family comparison would be misleading.

Mandatory regression examples: WTI + Brent; CPI + Core CPI; SPY + QQQ + WTI; DXY + VIX; CPI + WTI; CPI + WTI + VIX.

---

## 12. Governed indices
### Risk
SPY −1 · VIX +1 · HY spread +1 · HYG −1 · DXY +1 · MOVE +1 · NFCI +1

### Growth
QQQ +1 · copper +1 · small caps +1 · IPMAN +1 · WTI +1 · unemployment −1 · payrolls +1

### Macro
10Y +1 · 2Y +1 · 10Y−2Y +1 · 10Y−3M +1 · CPI +1 · Core PCE +1 · Fed Funds +1

Direction affects the derived composite only, never the visible source-relative index.
ISM Manufacturing PMI remains excluded unless a permissible free canonical source is established.

---

## 13. GDP / periodic evidence
Raw Real GDP level is evidence input only. User-facing GDP is exactly GDP q/q and GDP y/y, deterministic quarterly transforms of canonical Real GDP levels. No daily interpolation or synthetic timestamps.

Healthy periodic series remain analytically selectable even when no new publication falls inside a short horizon; the UI must communicate publication cadence truthfully.

---

## 14. WTI / availability truth
Availability keeps four separate concepts:
1. source/collector health;
2. evidence/revision integrity;
3. direct-analysis availability;
4. derived-index mathematical eligibility.

WTI historical zero-crossing/composite rebasing constraints may affect Growth composite eligibility but must never suppress valid WTI direct analysis. Fetch/parse/revision errors must surface explicitly rather than becoming generic `unavailable`.

---

## 15. Canonical context menu
The same menu appears everywhere on the NOW analytical surface:
1. AI POV
2. Data
3. Print
4. Download Markdown
5. Download CSV
6. Download JSON

No context-specific menu variants.
Data exposes complete canonical raw-series history with Native, Indexed 100, and Pearson correlation versus the active series using same-date real observations only.

---

## 16. LIBRARY
Library persists the exact frozen analysis state: breadcrumb/context index, expanded/collapsed basket state, visible series set, active series, horizon, representation/axes, evidence revision, exact chart snapshot/styles, AI POV, and full timestamped conversation.

Opening a saved analysis restores its frozen chart above the transcript and permits continued conversation. No newer evidence may silently replace a saved chart.

### 16.1 Library TTS
Library Listen uses browser `SpeechSynthesisUtterance`.
The Listen dock must not display the article/analysis title because the Library header already owns that information and the title can force transport controls off-screen.

Listen dock geometry:
- compact centered progress text, e.g. `Response 1/1 · Row 9/37`;
- five transport controls centered as a fixed group;
- transport controls own the geometry and must never be displaced or clipped by text.

Required controls: previous response, previous row, play/pause, next row, next response.
Downloadable/generated MP3 remains backlog until a true file-producing TTS provider is introduced.

---

## 17. AI / conversation
AI POV consumes the exact frozen visible chart state; it must not reconstruct the chart by refetching raw series and thereby lose derived indices.
Markdown renders in the transcript. Referenced sources/subjects must have working hyperlinks.
Provider/model/key state validated in CONFIG must be the state used for execution.

Registered provider secrets must not be repopulated into ordinary editable password fields when Config renders. Config displays registration/model status and provides an explicit Replace key action. A replacement secret field exists only during replacement and must suppress browser password-manager/autofill ownership as far as the browser permits.

---

## 18. HEALTH
HEALTH reconciles:

**series/source → publication expectation → canonical observation → collector result → persistence/revision → horizon coverage/density → chart/index impact**

It distinguishes publication lag, collector failure, persistence failure, sparse coverage, cadence incompatibility, provider fallback, unresolved registration, and derived-index impact.

---

## 19. CONFIG
Tabs are:

**AI | Chart Config | Sources | About**

One persistent close `×` works from every tab and returns to the exact prior mode.

Chart Config retains Normal · Bright · Colorblind presets, ten identity-bound slots, color, 1–12 pt width, line/dash/dash-dot/dot/dot-dash, live preview, Save persistence, unsaved-close restoration, and import/export.

### 19.1 Sources — canonical registration control plane
Sources is not a local watchlist and not an ad-hoc browser quote fetcher.

Turn 23 Sources v1 supports:
- market indices;
- common equities;
- ETFs;
- fund / CIT / NAV vehicles.

Examples defining the intended resolver scope include the Dow Jones Industrial Average, GAAMHX, V, NVDA, VRT, VOO, and T.

The entered text is never accepted blindly as provider identity. Registration resolves the request to one canonical instrument identity and records provider-specific aliases. Ambiguous requests such as `DOW` must distinguish the Dow Jones Industrial Average from Dow Inc.; no proxy or similarly named security may be silently substituted.

Canonical measurement semantics are explicit:
- market index → published index level;
- exchange-traded equity / ETF → market price;
- fund / CIT → published NAV or unit value.

Total-return treatment is not silently substituted for price/index/NAV. Any future total-return representation is an explicit transform.

Provider resolution is an ordered compatible cascade owned by the evidence pipeline. Provider changes do not change the economic identity of the series. Provider fallback is recorded in Health/provenance. If no acceptable provider can resolve or collect an instrument, the request remains explicitly unresolved rather than fabricating evidence or substituting a proxy.

Horizon capability is derived from persisted canonical evidence, not from choosing a different economic source per horizon. Genuine intraday evidence is required for an intraday 1D view. Daily/EOD or NAV evidence may support 5D through 5YR when sufficient history exists. Unsupported horizons are disabled rather than synthesized.

A healthy registered source automatically becomes discoverable through NOW → Add and thereafter uses the same chart, inspection, Data, AI POV, Library freeze, export, and Health machinery as built-in sources.

Because Market Navigator is served from static GitHub Pages, the browser must never receive a repository write token. Registration uses an authenticated repository control-plane handoff; canonical registration and collection occur server-side, not in a localStorage-only second evidence system.

---

## 20. Race / coherence contract
Required:
- one in-flight canonical fetch per series per boot;
- render-generation guards;
- stale async results cannot overwrite newer horizon/composition state;
- catalog/Health/derived/raw evidence validated against one coherent session revision/anchor contract;
- evidence errors remain explicit;
- chart redraw on container resize may not mutate analytical state.

---

## 21. Explicit prohibited regressions
Do not introduce:
- V1/V2/V3/V4/V5 product terminology;
- separate EXPLORE mode;
- separate COMPONENT page/modal;
- `ENV / GRW / GRW` or any duplicated anchor breadcrumb;
- component names individually appended to the breadcrumb;
- clickable `COMPONENTS` token;
- default-selected RSK on ENV load;
- anchor index chip with an `×` while in that index context;
- breadcrumb wrapping or displacement of horizons/`…`;
- second-click focus modes;
- white outline as active-series emphasis;
- hover-driven silent series switching;
- all-series inspection tooltip;
- synthetic/fallback chart evidence;
- raw-source direction inversion;
- duplicate chart/discovery engines;
- separate Explore exports/AI state;
- Library without exact frozen chart and continuation composer;
- title text in the mobile Listen transport strip;
- fake MP3 export from browser speech synthesis;
- rail-dependent fixed-delay canvas sizing;
- populated saved API secrets in normal password inputs;
- local-only custom ticker evidence bypassing canonical Health/revisions;
- provider-per-horizon identity switching;
- silent symbol/proxy substitution;
- fabricated intraday data for daily/NAV sources;
- owner-test URL before release-blocking qualification passes.

---

## 22. Turn 22 retained architecture
Turn 22 established the unified NOW model: neutral ENV, anchored-index collapsed/expanded states, Add as discovery, no Explore/Component modal, exact frozen AI evidence, source-relative raw indexing, Library TTS geometry, and long-horizon display-density rules. Turn 23 preserves all of it.

---

## 23. Retained mandatory qualification
Every Turn 23 candidate must continue to prove the Turn 22 release-blocking matrix: JavaScript/boot, rail contents, neutral ENV, all three index lifecycles, Add discovery, inspection, all seven horizons, display-density rules, WTI short-horizon availability, GDP periodic truth, full-history Data/correlation, exact visible-state AI evidence, immutable Library chart, transcript/composer, TTS controls, Config style controls, canonical six-command menu, and stale-render/race resistance.

---

## 24. Governance / anti-drift
Lifecycle:

**diagnose → plan → build → qualify → publish → owner test**

Do not ask the owner to reconfirm settled mechanics. Do not broaden scope. Fetch current refs before writes. Preserve unrelated main-branch movement. Owner-visible behavior, not DOM existence, is the release gate.

---

## 25. Turn 23 construction and qualification
### Phase A — governance freeze
1. Freeze this plan before application mutation.
2. Update Graveyard with rejected sizing, password-manager, local-ticker, source-switching, proxy-substitution, and fake-intraday patterns.

### Phase B — responsive NOW frame
1. NOW chart card stays pinned to the available workspace while rail opens/closes.
2. Observe actual chart-container geometry and redraw when it changes size.
3. Rail transition, rotation, split-screen/browser viewport changes, and responsive width changes cannot leave stale canvas dimensions or top/bottom gaps.

### Phase C — AI credential UX
1. Registered API keys are not repopulated into editable password inputs.
2. Config shows provider/model registration state plus explicit Replace key.
3. Replacement field exists only while replacement is active and uses password-manager/autofill suppression.
4. Existing local provider registry remains compatible.

### Phase D — Sources tab / registration control plane
1. Add CONFIG → Sources.
2. Accept ticker/name plus instrument-class intent.
3. Resolve canonical identity before registration; no silent proxy substitution.
4. Store provider aliases/cascade and explicit measure semantics.
5. Server-side registration updates canonical catalog/evidence/Health and healthy registrations become discoverable in Add.
6. No GitHub write token or provider write credential is exposed to the Pages client.

### Phase E — regression preservation
Preserve Turn 22 unified NOW architecture, Turn 21 source-relative indexing, exact frozen AI evidence, long-horizon display density, WTI/GDP truthfulness, Data/correlation, Library/TTS, and canonical context menu.

### Phase F — Turn 23 release-blocking gates
Desktop/tablet/phone must prove:
- rail open/close changes width only; chart top/bottom remain pinned and canvas redraws to the actual new container;
- no password-manager-compatible populated API-key field exists after registered provider state loads;
- Replace key is explicit and reversible;
- Sources tab exists and does not create local-only evidence;
- resolver/request flow distinguishes index/equity/ETF/fund-CIT intent;
- registered-source fixture is discoverable through Add only when backed by persisted evidence/Health metadata;
- unresolved/unsupported source state is explicit;
- every retained Turn 22 gate still passes.

Only after all release-blocking gates pass: merge to current main, verify Pages, and return the cache-busted Turn 23 URL plus exact merge SHA.
