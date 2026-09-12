# Market Navigator — Canonical Master Plan

Status: AUTHORITATIVE PRODUCT / BUILD / QUALIFICATION PLAN
Updated: 2026-09-12
Next release scope: Turn 22

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

Inspection readout contains:

- date;
- native value/unit;
- Indexed 100 value where valid;
- one point marker;
- one vertical guide;
- explicit `×` dismissal.

The readout remains pinned when the pointer leaves and updates as another point on the same active series is inspected.

For every raw/source series:

`Indexed 100 = 100 × value / baseline`

Component direction/weight applies only to derived-index construction and must never invert a raw/source chart, crosshair value, Data value, export, AI evidence, or Library snapshot.

---

## 9. Series information popover
Long press opens compact reference information only.

The popover is white/dark-text, compact, top-right, and non-blocking over the chart except for its controls.

Required structure:

- header: Open · title · ×
- body: purpose/usage · unit · cadence · Health link
- footer: ← and → at opposite corners

Arrows traverse visible legend order without wrap. They update active series and popover contents together.

`Open` selects/focuses that series inside the current NOW workspace. It must not create a separate COMPONENT page.

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

Mandatory regression examples:

- WTI + Brent;
- CPI + Core CPI;
- SPY + QQQ + WTI;
- DXY + VIX;
- CPI + WTI;
- CPI + WTI + VIX.

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
Raw Real GDP level is evidence input only.

User-facing GDP is exactly:

- GDP q/q
- GDP y/y

Both are deterministic quarterly transforms of canonical Real GDP levels. No daily interpolation or synthetic timestamps.

Healthy periodic series remain analytically selectable even when no new publication falls inside a short horizon; the UI must communicate publication cadence truthfully.

---

## 14. WTI / availability truth
Availability keeps four separate concepts:

1. source/collector health;
2. evidence/revision integrity;
3. direct-analysis availability;
4. derived-index mathematical eligibility.

WTI historical zero-crossing/composite rebasing constraints may affect Growth composite eligibility but must never suppress valid WTI direct analysis.

Fetch/parse/revision errors must surface explicitly rather than becoming generic `unavailable`.

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
Library persists the exact frozen analysis state:

- breadcrumb/context index;
- expanded/collapsed basket state;
- visible series set;
- active series;
- horizon;
- representation/axes;
- evidence revision;
- exact chart snapshot and styles;
- AI POV;
- full timestamped conversation.

Opening a saved analysis restores its frozen chart above the transcript and permits continued conversation.

No newer evidence may silently replace a saved chart.

### 16.1 Library TTS
Library Listen uses browser `SpeechSynthesisUtterance`.

The Listen dock must not display the article/analysis title because the Library header already owns that information and the title can force transport controls off-screen.

Listen dock geometry:

- compact centered progress text, e.g. `Response 1/1 · Row 9/37`;
- five transport controls centered as a fixed group beneath/alongside the progress according to width;
- transport controls own the geometry and must never be displaced or clipped by text.

Required controls:

- previous response;
- previous row;
- play/pause;
- next row;
- next response.

Downloadable/generated MP3 remains backlog until a true file-producing TTS provider is introduced. Browser speech synthesis must not be misrepresented as an MP3 export path.

---

## 17. AI / conversation
AI POV consumes the exact frozen visible chart state; it must not reconstruct the chart by refetching raw series and thereby lose derived indices.

Markdown renders in the transcript. Referenced sources/subjects must have working hyperlinks.

Provider/model/key state validated in CONFIG must be the state used for execution.

---

## 18. HEALTH
HEALTH reconciles:

**series/source → publication expectation → canonical observation → collector result → persistence/revision → horizon coverage/density → chart/index impact**

It distinguishes publication lag, collector failure, persistence failure, sparse coverage, cadence incompatibility, and derived-index impact.

---

## 19. CONFIG
Tabs remain:

**AI | Chart Config | About**

One persistent close `×` works from every tab and returns to the exact prior mode.

Chart Config:

- Normal · Bright · Colorblind presets;
- ten identity-bound slots;
- color;
- 1–12 pt width;
- line · dash · dash-dot · dot · dot-dash;
- live preview;
- Save persistence;
- unsaved close restores persisted state;
- import/export.

---

## 20. Race / coherence contract
Required:

- one in-flight canonical fetch per series per boot;
- render-generation guards;
- stale async results cannot overwrite newer horizon/composition state;
- catalog/Health/derived/raw evidence validated against one coherent session revision/anchor contract;
- evidence errors remain explicit.

---

## 21. Explicit prohibited regressions
Do not introduce:

- V1/V2/V3/V4/V5 product terminology;
- separate EXPLORE mode;
- separate COMPONENT page/modal;
- `ENV / GRW / GRW` or any duplicated anchor breadcrumb;
- component names individually appended to the breadcrumb;
- a clickable `COMPONENTS` token;
- default-selected RSK on ENV load;
- anchor index chip with an `×` while in that index context;
- breadcrumb wrapping;
- breadcrumb displacement of horizons or `…`;
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
- owner-test URL before release-blocking qualification passes.

---

## 22. Turn 22 construction sequence
### Phase A — governance freeze
1. Freeze this plan.
2. Update Graveyard with retired Explore/COMPONENT-state architecture and Listen-strip title rejection.
3. No application mutation before A is committed.

### Phase B — one NOW state
1. Remove user-facing EXPLORE navigation/surface.
2. Retire COMPONENT modal navigation.
3. Introduce anchored-index state with expanded/collapsed component basket and visible-series set.
4. Remove ENV default active index.

### Phase C — composition mechanics
1. ENV chip → anchored index with components expanded.
2. index breadcrumb → collapsed index-only.
3. collapsed anchor chip → expand governed basket.
4. expanded chips → active/reference only.
5. anchor has no ×; all removable comparisons do.
6. Add becomes full catalog discovery.

### Phase D — Library TTS geometry
Remove analysis title from Listen bar; center progress and all transport controls without clipping at phone width.

### Phase E — regression preservation
Preserve Turn 21 source-index directionality, Turn 20 exact AI snapshot behavior, Turn 18 long-horizon density, GDP q/q/y/y, WTI direct availability, Config, Data/correlation, immutable Library charts, evidence/race guards, and unified context menu.

### Phase F — qualification
Run §23 against the exact candidate.

### Phase G — publish
Only after all release-blocking gates pass: merge to main, verify Pages, and return cache-busted URL + exact commit SHA.

---

## 23. Mandatory Turn 22 pre-ship qualification
### 23.1 Syntax / boot
- JavaScript parses;
- browser boots with no application/page errors;
- canonical evidence assets load;
- Pages artifact resolves.

### 23.2 Rail / architecture
Desktop + phone:
- rail contains NOW · LIBRARY · HEALTH only;
- no EXPLORE route or visible surface;
- no separate COMPONENT analytical page appears during the complete journey.

### 23.3 ENV neutral
Desktop + phone:
- ENV contains RSK/GRW/MAC;
- no chip active by default;
- no opacity isolation on load;
- all horizons/menu/footer remain visible and non-wrapping.

### 23.4 Index lifecycle — all three indices
For RSK, GRW, MAC:
1. ENV legend tap enters `ENV / <INDEX> / COMPONENTS`.
2. anchor + every governed component initially visible.
3. anchor active; others faded.
4. anchor has no ×; components have ×; Add visible.
5. component chip changes active selection without navigation.
6. component × removes only that component.
7. index breadcrumb collapses to `ENV / <INDEX>` with anchor retained.
8. anchor chip re-expands all governed components.
9. ENV breadcrumb returns to neutral ENV.
10. duplicated breadcrumb states are unreachable.

### 23.5 Add discovery
- Add can search full canonical catalog;
- grouped Risk/Growth/Macro/Other discovery works;
- horizon availability and cadence visible;
- add arbitrary eligible series;
- added series receives ×;
- adding a derived index as comparison does not auto-expand its basket;
- removing added series preserves anchor/context.

### 23.6 Inspection
- selected series fully opaque/on top;
- others fade;
- pointer hover inspects selected series immediately;
- source index direction remains plain relative rebasing;
- crosshair uses full-resolution evidence on downsampled long horizons;
- pinned readout and × work.

### 23.7 Axis / horizons / data
Mechanically prove all seven horizons, display-density rules, mandatory axis examples, WTI short-horizon availability, GDP periodic behavior, full-history Data, Indexed 100 values, and same-date correlation.

### 23.8 Library / AI
- AI receives exact visible chart snapshot including derived anchor;
- saved chart restores exactly;
- transcript/composer persist;
- TTS plays;
- phone Listen dock shows centered controls with no clipped right-side control;
- analysis title is absent from Listen transport bar;
- no MP3 download is exposed.

### 23.9 CONFIG / menu
- Config tabs/close/style controls pass desktop + phone;
- canonical six-command menu identical throughout NOW;
- no Explore-specific menu remains.

### 23.10 Race / evidence
Rapid horizon, index, collapse/expand, removal, Add, and active-series switching cannot leave stale final state.

A candidate that fails any release-blocking item does not receive an owner-test URL.

---

## 24. Governance / anti-drift
Lifecycle:

**diagnose → plan → build → qualify → publish → owner test**

Do not ask the owner to reconfirm settled mechanics. Do not broaden scope. Fetch current refs before writes. Preserve unrelated main-branch movement. Owner-visible behavior, not DOM existence, is the release gate.
