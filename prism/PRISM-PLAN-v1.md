<!-- PRISM-PLAN v1.0.0 -->
# PRISM MASTER PLAN v1.0.0

**Location:** `prism/PRISM-PLAN-v1.md` in `acmeproducts/stuff`.
**Project:** PRISM — a unified event-intelligence workspace combining Globe / WorldPulse, LumaSphere, and OnyxView with AI POV and a local analysis library.
**Owner:** Product owner — sole product decision-maker and release gate.
**Builder:** ChatGPT — maintains this plan, the graveyard, implementation lineage, and pre-flight evidence.

---

## 0 · GOVERNANCE — THE CHAIN IS THE LAW

Every turn runs:

**pre-base → base → pre-ship → ship → post-ship**

in order. A new turn begins only after post-ship completes.

Every release must declare its turn + stage in this plan before implementation. A build that does not match the declared stage fails its gate on naming alone.

### 0a · STANDING RULE — NO PATCHING A FAILED PATCH

If a release fails:
1. Diagnose against the last verified stage.
2. Record the failed approach and evidence in `PRISM-GRAVEYARD.md`.
3. Update this plan if the correction changes architecture, state, behavior, or test contract.
4. Build again from the governed plan and verified baseline.
5. Verify before owner testing.

Do not patch forward from a rejected implementation.

### 0b · STANDING RULE — TESTING IS EXPENSIVE; BUILDER OWNS PRE-FLIGHT

Before handing a build to the owner:
- verify the exact artifact at the exact commit SHA;
- perform deterministic code / state checks available without device testing;
- verify startup paths, local persistence, import/export, navigation state, and API configuration behavior where mechanically testable;
- state exactly what was proven and what still requires owner/device testing.

The owner tests only what cannot be proven mechanically.

### 0c · STANDING RULE — ONE INFORMATION STATE, MULTIPLE VIEWS

Explore, Map, Feed, and Library are not separate applications.

Global state must be shared across view changes:
- selected event(s)
- active filters
- search query
- time window
- favorites
- provider/model defaults where applicable

Changing the visualization must not silently change the information universe.

### 0d · STANDING RULE — EVENT IS THE PRIMARY CONTENT OBJECT

Canonical hierarchy:

**Event → Coverage → Source Article**

The default visualization unit is an event, not a raw headline. Article-level inspection remains available through event coverage.

### 0e · STANDING RULE — CACHE FIRST

The browser must become usable from local IndexedDB before routine network refresh completes.

Routine startup must not independently fan out to publisher RSS feeds.

Target architecture:

Publisher feeds → scheduled collector → per-source last-known-good cache → canonical event cache → same-origin app fetch → IndexedDB → views.

A source refresh failure must not delete previously valid cached content.

---

## 1 · PROJECT THESIS

PRISM combines the strongest ideas from three existing lineages:

### Globe / WorldPulse
Retain:
- immersive sphere exploration;
- cluster / color / size dimensional mapping;
- high-density browsing;
- direct event selection and focused cluster exploration.

Do not carry forward:
- growing permanent control chrome;
- client-side publisher fan-out as the normal fetch model;
- article-as-primary-object assumptions.

### LumaSphere
Retain:
- omnibox / search interaction;
- compact progressive controls;
- favorites;
- unobtrusive story/event card behavior;
- visually dominant content surface.

Do not carry forward:
- separate story-centric state model if it conflicts with canonical events.

### OnyxView
Retain:
- canonical event abstraction;
- event → supporting coverage drill-down;
- importance, corroboration, editorial tier;
- source-pack lenses;
- treemap / structural view;
- readability budgets and explicit aggregation rather than over-drawing.

Do not carry forward:
- treemap as the only or primary product identity.

### Devstream
Retain for AI provider configuration:
- Venice;
- OpenRouter;
- Anthropic direct;
- provider-specific model discovery;
- local-only browser API key storage;
- explicit test / ping before accepting a model;
- provider + model switching at compose time.

### Market Navigator
Retain for persistence / library behavior:
- local-first IndexedDB persistence;
- render saved state before stale refresh;
- durable analysis objects;
- explicit Add / Save to Analysis behavior;
- export / import as portable JSON.

---

## 2 · PRIMARY PRODUCT SURFACES

PRISM has four top-level tabs:

### 2.1 Explore
Sphere-based immersive event exploration.

Core requirements:
- event objects, not duplicate raw headlines, are rendered by default;
- Cluster / Color / Size mappings remain configurable;
- Luma-style compact controls and omnibox;
- selected event(s) persist when switching views;
- filter changes deterministically re-layout the sphere;
- density scales without hiding matching events unless the product explicitly enters an aggregated mode.

### 2.2 Map
Structural information view derived from Onyx.

Initial implementation:
- treemap;
- group by Subject / Region / Sentiment / Editorial Tier / Corroboration;
- Color and Size dimensions;
- lenses;
- event drill-down;
- explicit Other aggregation when readability budget is exceeded.

Future internal modes may include Timeline / Geographic / Network without changing the canonical data model.

### 2.3 Feed
Content-first linear event consumption.

Requirements:
- event cards;
- importance / recency / corroboration sorting;
- supporting-source count;
- favorites;
- event reader with coverage list;
- filters and search synchronized with Explore and Map;
- AI actions available from the selected event / filtered universe.

### 2.4 Library
Local analysis library.

Phase-1 requirements:
- IndexedDB-backed;
- save AI analysis objects;
- open / inspect;
- delete;
- Export Library JSON;
- Import Library JSON;
- merge imports by stable `analysisId` rather than destructive replace;
- no cloud synchronization yet.

---

## 3 · CANONICAL DATA MODEL

### 3.1 Event

```json
{
  "eventId": "stable-id",
  "headline": "canonical headline",
  "summary": "canonical summary",
  "subject": "Technology",
  "region": "Asia",
  "sentiment": "neutral",
  "importance": 0,
  "editorialTier": "developing",
  "corroboration": 3,
  "firstSeen": 0,
  "lastSeen": 0,
  "tags": [],
  "coverage": []
}
```

### 3.2 Coverage item

```json
{
  "articleId": "stable-id",
  "source": "BBC World",
  "title": "publisher title",
  "description": "publisher description",
  "url": "https://...",
  "publishedAt": 0
}
```

### 3.3 Required invariants
- one article belongs to at most one canonical event in a cache revision;
- event IDs remain stable across refresh when clustering identifies the same continuing event;
- provenance is preserved;
- source failures do not erase existing valid coverage;
- event merges / splits must be deterministic and auditable in collector diagnostics.

---

## 4 · CACHE / INGESTION ARCHITECTURE

### 4.1 Target flow

```text
publisher feeds
    ↓
scheduled collector
    ↓
per-source last-known-good snapshots
    ↓
normalize + dedupe + classify + cluster
    ↓
canonical event-cache.json + manifest
    ↓
GitHub Pages same-origin
    ↓
IndexedDB
    ↓
Explore / Map / Feed / AI
```

### 4.2 Per-source metadata
Each source cache records:
- source ID / name;
- last success;
- last attempt;
- last error;
- status / HTTP cause where known;
- ETag / Last-Modified where useful;
- article count;
- next retry;
- retained last-known-good payload.

### 4.3 Browser startup contract
1. Open IndexedDB.
2. Render cached event universe immediately.
3. Read cache manifest/version from same origin.
4. Download only if newer.
5. Merge without resetting search, filters, selection, favorites, or current view.
6. If refresh fails, continue with saved data and surface freshness status.

### 4.4 Network rule
Normal application startup must not contact every publisher feed from the browser.

Manual diagnostics may provide an explicit direct-feed test path, but it is not the production data path.

---

## 5 · GLOBAL APPLICATION STATE

Single shared state object must cover at minimum:

```text
view = Explore | Map | Feed | Library
query
timeWindow
filters
clusterDimension
colorDimension
sizeDimension
lens
selectedEventIds[]
focusedEventId
favorites[]
AI provider/model choice
```

Switching views preserves the state unless that state is intrinsically view-specific.

---

## 6 · AI POV

### 6.1 Purpose
AI is an analytical layer over selected information, not a detached chatbot.

### 6.2 Compose strip
Persistent or contextually available compose strip:

```text
Ask about these events…                         Send
Provider ▾   Model ▾   Scope ▾
```

Supported scopes for phase 1:
- This event
- Selected events
- Current view
- Current filtered universe

### 6.3 Provider configuration
Settings → AI Providers.

Phase-1 providers:
- Venice
- OpenRouter
- Anthropic direct

Rules:
- API keys live only in this browser;
- key fields are masked;
- selected provider can enumerate available models when the API supports it;
- a provider/model pair must be explicitly tested before being marked verified;
- failures show actionable status rather than silently falling back;
- compose strip can override provider/model for an analysis without changing the stored default unless the user explicitly saves it as default.

### 6.4 AI context package
Do not send the entire event cache by default.

Construct a bounded request from:
- selected event metadata;
- canonical summaries;
- supporting coverage titles/descriptions;
- timestamps;
- source provenance;
- active filter / scope description.

### 6.5 Analysis object

```json
{
  "analysisId": "stable-id",
  "createdAt": 0,
  "title": "...",
  "prompt": "...",
  "provider": "venice",
  "model": "...",
  "scope": "selected-events",
  "eventIds": [],
  "sourceArticleIds": [],
  "response": "..."
}
```

AI output must offer **Save to Library**.

---

## 7 · LOCAL LIBRARY

### 7.1 Storage
IndexedDB, not localStorage.

### 7.2 Export
Export complete portable JSON containing:
- schema version;
- exportedAt;
- analysis objects;
- frozen event/source references required to understand saved analysis later.

### 7.3 Import
- validate schema;
- reject malformed payloads safely;
- merge by `analysisId`;
- preserve existing entries not present in the import;
- report imported / skipped / replaced counts.

### 7.4 Deferred
Centralized/cloud analysis library is explicitly deferred.

---

## 8 · PERFORMANCE CONTRACT

Targets for the first production candidate:
- cached app usable without waiting for network refresh;
- no publisher fan-out on normal startup;
- no full sphere DOM rebuild where a canvas or incremental render path is materially faster;
- large event sets remain interactive on current mobile hardware;
- selection / tab changes do not refetch unchanged data;
- AI requests include only bounded relevant context;
- source refresh failures degrade freshness, not app availability.

Formal numeric performance gates will be added after the pre-base instrumentation pass establishes the baseline.

---

## 9 · TURN / STAGE LEDGER

### Turn 01 — foundation / synthesis

| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | Governance + reference audit + shared shell / data contracts | ACTIVE | not built |
| 01·base | Cache-first canonical event ingestion + IndexedDB startup | Not started | — |
| 01·pre-ship | Explore + Map + Feed unified state | Not started | — |
| 01·ship | AI provider configuration + compose POV | Not started | — |
| 01·post-ship | Local Library + export/import + integrated release gate | Not started | — |

No implementation stage may skip ahead of the ledger.

---

## 10 · TURN 01 · PRE-BASE SCOPE

### 10.1 Freeze reference lineages
Reference only; do not overwrite:
- `/globe.html`
- `/lumasphere.html`
- `/onxyview-newsmap-v15.html`
- `/devstream-test.html`
- `/market-view.html`

### 10.2 Establish PRISM workspace
Subdirectory:
- `prism/PRISM-PLAN-v1.md`
- `prism/PRISM-GRAVEYARD.md`

Planned build artifact lineage:
- `prism/prism-turn01-pre-base.html`
- `prism/prism-turn01-base.html`
- `prism/prism-turn01-pre-ship.html`
- `prism/prism-turn01-ship.html`
- `prism/prism-turn01-post-ship.html`

### 10.3 Pre-base deliverables
- shell with tabs Explore / Map / Feed / Library;
- one shared state model;
- schema definitions for Event / Coverage / Analysis;
- data adapter capable of reading existing canonical news cache structures without changing the old apps;
- IndexedDB stores and migration/version contract;
- freshness / diagnostics surface;
- no AI execution yet, but provider/model state contract reserved;
- no cloud Library sync.

### 10.4 Pre-base gate
Must prove before owner testing:
- artifact naming correct;
- all four tabs route without losing global state;
- fixture event dataset renders in Explore / Map / Feed from the same event objects;
- Library opens from the same shell;
- IndexedDB survives reload;
- import/export schema round-trip fixture passes;
- no existing Globe, Luma, Onyx, Devstream, or Market Navigator file changed.

---

## 11 · OPEN DECISIONS

Only decisions that materially block implementation belong here.

| ID | Decision | Current ruling |
|---|---|---|
| D1 | Project name | **PRISM** |
| D2 | Primary content unit | **Event** |
| D3 | Top-level views | **Explore · Map · Feed · Library** |
| D4 | Existing prototypes | **Frozen references; new lineage** |
| D5 | AI provider behavior | **Configure/test in Settings; switch provider/model at compose strip** |
| D6 | API key storage | **Local browser only for phase 1** |
| D7 | Analysis storage | **Local IndexedDB; Export/Import; centralization deferred** |
| D8 | Normal publisher retrieval | **Collector/cache path; not browser fan-out** |

---

## 12 · DEFERRED / BACKLOG

Not part of Turn 01 unless explicitly promoted:
- centralized multi-device analysis library;
- user accounts;
- server-side API-key custody;
- semantic embeddings / vector search;
- geographic map mode;
- event relationship network graph;
- timeline mode;
- automated AI summaries of every event;
- full-article scraping / extraction;
- article-level sphere mode;
- collaborative saved analyses.

---

## 13 · RELEASE RECORDING RULE

For every rejected or superseded build, `PRISM-GRAVEYARD.md` must record:
- turn / stage / release;
- exact commit SHA / artifact;
- test date;
- observed failure;
- root cause if known;
- architectural lesson;
- explicit veto: what must not be repeated;
- recovery baseline.

The graveyard is a design constraint, not a historical appendix.
