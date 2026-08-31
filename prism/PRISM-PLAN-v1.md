<!-- PRISM-PLAN v1.1.0 -->
# PRISM MASTER PLAN v1.1.0

**Location:** `prism/PRISM-PLAN-v1.md` in `acmeproducts/stuff`.
**Project:** PRISM — unified event intelligence combining the strongest Globe / WorldPulse, LumaSphere, and OnyxView concepts with AI POV and a portable local analysis library.
**Owner:** Product owner — sole product decision-maker and device release gate.
**Builder:** ChatGPT — maintains this plan, graveyard, implementation lineage, and pre-flight evidence.

---

## 0 · GOVERNANCE — THE CHAIN IS THE LAW

Every turn runs **pre-base → base → pre-ship → ship → post-ship**, in order. A new turn begins only after post-ship completes. Every release declares its turn + stage here before implementation; artifact naming is part of the gate.

### 0a · NO PATCHING A FAILED PATCH
If a release fails: diagnose against the last verified stage; record the failed approach and evidence in `PRISM-GRAVEYARD.md`; update this plan if behavior/architecture/test contract changes; rebuild from the governed baseline; verify before owner testing.

### 0b · TESTING IS EXPENSIVE; BUILDER OWNS PRE-FLIGHT
Before handoff: exact artifact/commit verification, deterministic syntax/state/persistence/import-export/navigation checks, and a clear statement of what remains device-only.

### 0c · ONE INFORMATION STATE, MULTIPLE VIEWS
Explore, Map, Feed, and Library are views over one state. Search, time window, filters, selected events, favorites, and provider/model context survive view changes.

### 0d · EVENT IS THE PRIMARY CONTENT OBJECT
Canonical hierarchy: **Event → Coverage → Source Article**. Articles are provenance/evidence; events are the shared visualization and analysis unit.

### 0e · CACHE FIRST
Normal startup must become usable from IndexedDB first and must not fan out to publisher RSS feeds. Target path: publisher feeds → collector → last-known-good per-source cache → canonical event cache → same-origin fetch → IndexedDB → PRISM views.

### 0f · A VISUALIZATION MUST EXPLAIN ITSELF
A view that uses color, size, grouping, aggregation, or filtering must expose the active encoding in the view itself. An unlabeled globe or box layout is not a completed visualization.

### 0g · READERS MAY NOT OCCLUDE THE INFORMATION SURFACE
Desktop readers consume their own layout column; mobile readers may overlay from the bottom. Opening an event may not permanently hide or underlap unreadable visualization content.

---

## 1 · PRODUCT THESIS / LINEAGE

**Globe / WorldPulse contributes:** immersive sphere, high-density exploration, Cluster / Color / Size mapping, cluster focus.

**LumaSphere contributes:** omnibox, compact progressive controls, favorites, unobtrusive event-card interaction, content-dominant chrome.

**OnyxView contributes:** event abstraction, event → supporting coverage drill-down, importance/corroboration/editorial tier, source lenses, structural treemap, readability budgeting.

**Devstream contributes:** Venice/OpenRouter/Anthropic-direct provider configuration, provider model discovery, local browser keys, explicit model test/ping, compose-time provider/model choice.

**Market Navigator contributes:** local-first IndexedDB, render-before-refresh, durable analysis objects, Save/Add to Analysis, JSON portability.

The reference implementations remain frozen: `/globe.html`, `/lumasphere.html`, `/onxyview-newsmap-v15.html`, `/devstream-test.html`, `/market-view.html`.

---

## 2 · PRIMARY PRODUCT SURFACES

### Explore
Immersive sphere over canonical events. Requirements: dynamic legend for the active Color mapping; visible Subject/Region/Sentiment filtering; Cluster/Color/Size controls; deterministic re-layout after filtering; direct event selection; selected event preserved across tabs.

### Map
A **real treemap**, not a list of boxes. Group rectangles consume area according to the selected grouping; event rectangles consume group area according to Importance / Corroboration / Recency. Grouping options include Subject, Region, Sentiment, Editorial Tier, Corroboration. Event selection opens the same shared reader without desktop underlap.

### Feed
Linear canonical-event consumption with importance/recency/corroboration sorting, coverage count, favorites, shared search/filters, event reader, and later AI actions.

### Library
IndexedDB analysis artifacts with open/delete, Export Library JSON, Import Library JSON, merge-by-`analysisId`, and no cloud sync in Turn 01.

---

## 3 · CANONICAL DATA MODEL

### Event
```json
{
  "eventId":"stable-id",
  "headline":"canonical headline",
  "summary":"canonical summary",
  "subject":"Technology",
  "region":"Asia",
  "sentiment":"neutral",
  "importance":0,
  "editorialTier":"developing",
  "corroboration":3,
  "firstSeen":0,
  "lastSeen":0,
  "tags":[],
  "coverage":[]
}
```

### Coverage
```json
{
  "articleId":"stable-id",
  "source":"BBC World",
  "title":"publisher title",
  "description":"publisher description",
  "url":"https://...",
  "publishedAt":0
}
```

Required invariants: one article belongs to at most one event per cache revision; provenance is preserved; deterministic continuing-event IDs where possible; source refresh failure never deletes prior valid coverage; merges/splits become auditable when collector-side clustering lands.

---

## 4 · CACHE / INGESTION ARCHITECTURE

Target: publisher feeds → scheduled collector → per-source last-known-good snapshots → normalize/dedupe/classify/cluster → canonical event cache + manifest → GitHub Pages same-origin → IndexedDB → views.

Browser startup: open DB; render cached events; fetch same-origin cache/manifest; canonicalize only when newer; persist; update views without resetting current state; fall back cleanly to saved events on refresh failure.

**Turn 01 base compatibility rule:** the current centralized `data/market-backend/news-cache.json` is article-oriented. Base may deterministically adapt this same-origin cache into canonical events in-browser to prove the product model. It may not contact publishers. Collector-side event clustering remains the production target and is promoted once the client event contract is stable.

---

## 5 · GLOBAL APPLICATION STATE

At minimum: `view`, `query`, `timeWindow`, `filters`, `clusterDimension`, `colorDimension`, `sizeDimension`, `mapGroup`, `mapSize`, `lens`, `selectedEventIds[]`, `focusedEventId`, `favorites[]`, AI provider/model choice.

---

## 6 · AI POV — TURN 01 SHIP TARGET

AI is an analytical layer over current PRISM context, not a detached chatbot. Compose strip: prompt + Provider + Model + Scope. Phase-1 scopes: This event, Selected events, Current view, Current filtered universe.

Providers: Venice, OpenRouter, Anthropic direct. API keys remain local browser-only. Settings configures/tests credentials/defaults; compose strip can switch provider/model for the current analysis. Provider/model must pass an explicit test before verified status.

Bounded AI context contains selected canonical event metadata, summaries, supporting coverage titles/descriptions, timestamps, provenance, and current scope/filter description — never the entire cache by default.

Completed output becomes a durable Analysis object with `analysisId`, `createdAt`, title, prompt, provider, model, scope, event IDs, source article IDs, and response; every result offers Save to Library.

---

## 7 · LOCAL LIBRARY

IndexedDB, not localStorage. Export carries schema version, exported timestamp, analyses, and frozen event/source references needed to understand them later. Import validates schema and merges by `analysisId`; malformed payloads fail safely; existing entries not present in an import remain untouched. Cloud centralization is deferred.

---

## 8 · PERFORMANCE CONTRACT

Cached app usable without waiting for network; no publisher fan-out; canvas/incremental rendering for dense Explore; no refetch on tab/selection changes; treemap and reader remain responsive; AI context bounded; source refresh failure degrades freshness rather than availability. Numeric gates will be set after Turn 01 instrumentation.

---

## 9 · TURN / STAGE LEDGER

| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | Governance + shared shell / contracts / connectivity | **PASSED FOUNDATION 2026-08-31 — findings carried forward** | `prism/prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | Canonical event ingestion + meaningful Explore/Map presentation | **ACTIVE** | `prism/prism-turn01-base.html` |
| 01·pre-ship | Full Explore + Map + Feed unified interaction/state refinement | Not started | — |
| 01·ship | AI provider configuration + compose POV | Not started | — |
| 01·post-ship | Local Library refinement + export/import + integrated release gate | Not started | — |

No stage skips.

---

## 10 · PRE-BASE GATE RESULT / OWNER FINDINGS

The pre-base proved shell/data/persistence connectivity and basic tab operation. Owner accepted the basics but correctly identified that it did **not yet deliver explanatory visual value**:
- Explore had no legend, so Color meaning was opaque.
- There was no useful visible filtering surface.
- Map was boxes/list-like rather than a true area-encoded treemap.
- Map content could underlap the event reader.

These are not patched into pre-base. They define the governed 01·base contract.

---

## 11 · TURN 01 · BASE SCOPE

### 11.1 Canonical event adapter
Read only the centralized same-origin news cache. Deterministically classify and cluster article records into Event → Coverage objects; preserve publisher URL/source/title/description/time; compute source corroboration and initial importance/tier signals; persist canonical events in IndexedDB.

### 11.2 Explore actual-value gate
- active Color legend visible on sphere;
- Subject / Region / Sentiment filter chips with All state;
- filters apply to Explore, Map, Feed together;
- Cluster / Color / Size controls remain visible;
- sphere is canvas-based and re-renders after filter/state changes;
- event reader shows coverage and provenance.

### 11.3 Map actual-value gate
- genuine area-encoded treemap hierarchy: group area then event area;
- grouping: Subject / Region / Sentiment / Tier / Corroboration;
- area: Importance / Corroboration / Recency;
- same Color mapping/legend as Explore;
- desktop event reader gets a dedicated column; no underlap;
- mobile reader may bottom-overlay.

### 11.4 Feed
Render the exact filtered canonical events with importance/recency/corroboration sort and same reader/selection state.

### 11.5 Persistence / diagnostics
IndexedDB schema version advances without destroying prior stores. Diagnostics show article count, canonical event count, merge count, cache collector version, same-origin network path, and self-test results.

### 11.6 Base pre-flight gate
Before owner handoff: JavaScript syntax pass; unique HTML IDs; four tabs present; same-origin cache path only; canonical events all contain coverage; event count does not exceed input article count; legend renderer present; filter state contract present; treemap renderer present; IndexedDB migration opens; legacy reference files untouched.

---

## 12 · OPEN DECISIONS

| ID | Decision | Ruling |
|---|---|---|
| D1 | Project name | **PRISM** |
| D2 | Primary content unit | **Event** |
| D3 | Views | **Explore · Map · Feed · Library** |
| D4 | Existing prototypes | **Frozen references; new lineage** |
| D5 | AI provider behavior | **Configure/test in Settings; switch at compose** |
| D6 | API key storage | **Local browser only, phase 1** |
| D7 | Analysis storage | **IndexedDB + Export/Import; cloud later** |
| D8 | Publisher retrieval | **Collector/cache; never normal browser fan-out** |
| D9 | Temporary canonicalization | **Same-origin article-cache adapter allowed in 01·base; collector remains production target** |

---

## 13 · DEFERRED

Centralized multi-device library; accounts; server-side API-key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries for every event; full-article scraping; article-level sphere mode; collaborative analyses.

---

## 14 · RELEASE RECORDING RULE

Every rejected/superseded build records turn/stage/release, exact commit/artifact, test date, observed failure, root cause if known, architectural lesson, explicit veto, and recovery baseline in `PRISM-GRAVEYARD.md`. The graveyard is mandatory design input.