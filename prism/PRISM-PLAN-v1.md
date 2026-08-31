<!-- PRISM-PLAN v1.6.0 -->
# PRISM MASTER PLAN v1.6.0

**Project:** PRISM — unified event intelligence combining Globe / WorldPulse, LumaSphere, OnyxView, AI POV, and a portable local research library.
**Owner:** Product owner — sole product/release gate.
**Builder:** ChatGPT — plan, graveyard, implementation lineage, pre-flight.

---
## 0 · GOVERNANCE
Every turn runs **pre-base → base → pre-ship → ship → post-ship**. Failed architecture is graveyarded before replacement; behavior/architecture changes are written here before implementation.

### Immutable product laws
1. **One information state, multiple views.** Search, time window, selected events, favorites, dimensions, filters and provider/model context survive view changes.
2. **One global control ribbon.** Shared dimensions and filters live once at shell level, never duplicated per tab.
3. **Event → Coverage → Source Article** is canonical.
4. **Cache first.** Normal startup uses IndexedDB + same-origin canonical cache, never publisher fan-out.
5. **Visualizations explain themselves.** Labels, legends and active encodings are part of the visualization contract.
6. **Desktop shell is rail + work surface + collapsible right context panel.** Event detail, AI research, Config and Library inspection use one right-side context panel.
7. **AI POV is contextual research, not generic chat.** Selection/provenance define its source context; outside research supplements rather than replaces it.
8. **Provider + model must be validated before use.** Keys remain local to this browser.
9. **Filters are generated from the dimensions the user actually selected — and only those dimensions.** A dimension that is not currently selected as Group, Color or another discrete analytical dimension must not appear as a filter. Selecting or removing a dimension immediately adds/removes its filter row. Duplicate selections produce one filter row. Stale filter state from a no-longer-selected dimension is cleared so invisible filters can never constrain the dataset.
10. **Source is a normal discrete dimension, not a permanent special filter.** Source appears in the filter tray only when Source has been selected as an active dimension. Source enable/disable remains a separate acquisition/configuration concern under Config → Sources.
11. **Sources are user-manageable.** Source inventory/configuration lives in Config without introducing a second analytical filter system.
12. **Natural gesture parity.** Explore uses pointer/touch rotation, wheel/trackpad zoom and pinch zoom; no redundant +/- controls.
13. **AI output is document-quality.** Markdown renders correctly; further-reading/source references use working clickable http(s) hyperlinks when reliable URLs are available.
14. **Explore is a real rotatable sphere.** Events remain organized into labeled clusters inside the sphere according to the active Group dimension while the sphere rotates.
15. **Library is a first-class workspace.** Analyses are searchable, openable, deletable, exportable/importable and continuable with preserved Markdown and provenance.

---
## 1 · LINEAGE / REFERENCES
Frozen references, never patch targets:
- `/globe.html` — dense sphere/dimensional exploration.
- `/lumasphere.html` — content-forward sphere interaction and category clusters.
- `/onxyview-newsmap-v15.html` — event abstraction, lenses, corroboration/importance.
- `/devstream-test.html` — provider/model discovery and validation.
- `/market-view.html` — local analysis persistence.
- `/market-view-ux-gate3-p2.html` — collapsible left navigation rail, central work surface and persistent analytical composition pattern.

External reference: `IJMacD/newsmap-js` for NewsMap interaction principles. PRISM uses a library-backed treemap rather than the rejected hand-rolled layout.

---
## 2 · SHELL
Desktop/tablet shell:
`collapsible left rail | central work surface | collapsible right context panel`.

Left rail owns primary navigation: Map, Explore, Feed, Library, Config. Right panel owns Event, AI POV, Library detail and Config. Opening the right panel resizes the center rather than underlapping it. Mobile may overlay.

---
## 3 · PRIMARY SURFACES
### Map
Library-backed NewsMap-style proportional category/event hierarchy. Readable headline text, multi-select, event inspection, native pan/zoom.

### Explore
Same filtered/selected universe in a Luma-style rotatable sphere. Compact information cards remain grouped around deterministic 3D cluster centers. Drag rotates yaw/pitch; wheel/trackpad and pinch zoom; no +/- controls; selection parity with Map/Feed.

### Feed
Linear canonical events with the same dimensions, filters, selection and right-panel reader.

### Library
Full research workspace: saved-analysis search/list, complete Markdown research thread, frozen evidence/provenance, Continue research, Delete, Export one/all and Import/merge.

---
## 4 · DIMENSION → FILTER CONTRACT
The analytical ribbon selects dimensions. The filter tray is a direct projection of those choices; it is not an independent catalog of possible fields.

### 4.1 Current dimension roles
**Group / Cluster** is discrete and filter-producing:
- Subject
- Region
- Sentiment
- Editorial Tier
- Corroboration bucket
- Source

**Color** is discrete and filter-producing:
- Sentiment
- Subject
- Region
- Editorial Tier
- Source

**Size / Area** is primarily quantitative:
- Importance
- Corroboration
- Recency

A quantitative Size selection does not create a categorical filter unless a governed bucketing mode is explicitly introduced. Corroboration **bucket** as Group is categorical and therefore does create a filter.

### 4.2 Filter derivation
`activeFilterDimensions = unique(discrete(Group), discrete(Color), any future explicitly-discrete selected dimension)`.

Examples:
- Group=Subject + Color=Sentiment → filters are **Subject + Sentiment only**.
- Group=Tier + Color=Sentiment → filters are **Tier + Sentiment only**.
- Group=Source + Color=Sentiment → filters are **Source + Sentiment only**.
- Group=Subject + Color=Subject → one **Subject** filter, not two.
- Change Group from Source to Region → Source filter disappears immediately and any Source analytical filter state is cleared; Region appears.

### 4.3 Source distinction
There are two separate concepts:
- **Source dimension/filter:** analytical view of the currently available corpus; exists only if Source is selected as a dimension.
- **Source management:** acquisition configuration under Config → Sources; controls which sources are enabled in the corpus and is always available in Config.

Do not conflate the two.

### 4.4 Invisible-filter veto
No inactive dimension may continue filtering silently. When a dimension leaves `activeFilterDimensions`, its filter Set is cleared before the next render.

---
## 5 · SOURCE MANAGEMENT
Config → **Sources → Manage sources…** opens a dedicated modal.

Requirements: list every cache source with article/event counts; enable/disable per source; Enable all / Disable all; user-added records with name + URL + type; local persistence. Source enable/disable is applied before visualization/AI evidence construction but does **not** cause Source chips to appear unless Source is an active selected dimension.

Normal startup may not silently fetch arbitrary user-added publisher URLs. Custom activation remains collector/same-origin work.

---
## 6 · SELECTION / AI EVIDENCE
Multi-select persists across views. Ribbon exposes count + Clear. Reader can Select/Deselect for AI. AI POV exposes each selected event with per-item remove + Clear all. Each completed AI turn freezes its exact evidence packet.

---
## 7 · AI POV / RESEARCH
AI POV is a continuable right-panel research workspace with selected evidence, suggested/editable prompts, ad-hoc composer, provider/model selectors, prior turns and Save Analysis.

Starter templates: Throughline, Frequency, Recency/precedent, Missing context.

AI Markdown contract: headings, lists, emphasis, block quotes, tables, inline/fenced code; sanitized raw HTML; only http(s) external links; external links use `target="_blank" rel="noopener noreferrer"`. Sources/Further reading/Research leads must include complete working hyperlinks when reliably known; no fabricated URLs.

Analysis thread schema includes `analysisId, title, createdAt, updatedAt, provider, model, eventIds[], frozenSources[], turns[], researchMode/capabilities`.

---
## 8 · DEVSTREAM PROVIDER/MODEL CONTRACT
**Venice:** paste key → GET `/models` → choose exact model → POST `/chat/completions` with selected model, `max_tokens:1`, `ping` → only success verified.

**OpenRouter:** paste key → GET `/auth/key` → GET `/models` → choose exact model → POST `/chat/completions` minimal ping → only success verified.

**Anthropic direct:** `/v1/messages`, `x-api-key`, `anthropic-version`, browser-access header, exact-model minimal inference ping.

Keys are cleaned of Bearer prefix/invisible whitespace and live only in localStorage. Verification is bound to provider + model + key; any change invalidates it. Compose may run only verified pairs.

---
## 9 · CANONICAL DATA / CACHE
Event: `eventId, headline, summary, subject, region, sentiment, importance, editorialTier, corroboration, firstSeen, lastSeen, tags[], coverage[]`.
Coverage: `articleId, source, title, description, url, publishedAt`.

Turn 01 may adapt same-origin `data/market-backend/news-cache.json` into canonical events in-browser. Production target remains collector-side normalization/dedupe/clustering → canonical event cache + manifest → IndexedDB.

---
## 10 · LIBRARY STORAGE / PORTABILITY
IndexedDB. Saved analyses include full turns, Markdown source text, provider/model, frozen event/source references and timestamps. Export one or complete Library as versioned JSON. Import validates and merges by `analysisId`; API keys are excluded.

---
## 11 · PERFORMANCE
Cached usable before network refresh; no publisher fan-out; dimension/filter changes never refetch unchanged data; removed dimensions clear filter state synchronously; Map handles current universe without layout thrash; Explore rotation/zoom updates projection only; AI sends bounded context only.

---
## 12 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | shell/contracts/connectivity | **PASSED FOUNDATION** | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | canonical events + first value surfaces | **REJECTED UI ARCHITECTURE** | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship R1 | unified NewsMap + source manager + initial AI POV | **SUPERSEDED** | `prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da` |
| 01·pre-ship R2 | rail shell + rotatable sphere + Markdown AI + full Library | **ACTIVE; DIMENSION/FILTER CORRECTION REQUIRED** | `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06` |
| 01·pre-ship R3 | dimension-derived filter correction | **NEXT BUILD** | `prism/prism-turn01-pre-ship-r3.html` |
| 01·ship | integrated stabilization/performance/provider-device gate | Not started | — |
| 01·post-ship | integrated release gate | Not started | — |

---
## 13 · R3 GATE
Before owner handoff:
- filter tray contains **only** currently selected discrete dimensions;
- Source exists as a Group/Color dimension option and its chips appear only when selected;
- Tier chips appear only when Tier is selected;
- inactive filter Sets are cleared, not merely hidden;
- duplicate Group/Color dimension produces one filter row;
- Size=Corroboration does not accidentally create Corroboration-bucket filtering;
- source-management enable/disable remains in Config regardless of selected analytical dimensions;
- Map/Explore/Feed share the exact same derived filter state;
- all prior R2 shell, sphere, AI Markdown/link and Library behavior remains intact.

---
## 14 · DECISIONS
D1 PRISM. D2 Event primary. D3 Map/Explore/Feed/Library. D4 frozen references. D5 one global ribbon. D6 NewsMap-first Map. D7 information cards not dots. D8 AI POV in pre-ship. D9 Devstream validation. D10 Analysis continuable. D11 IndexedDB + import/export. D12 source manager under Config. D13 AI evidence deselect. D14 wheel/pinch Explore. D15 Markdown/link-safe AI. D16 left rail + right context. D17 rotatable clustered sphere. D18 full Library. **D19 filters are a projection of selected dimensions only. D20 Source filter exists only when Source is selected as a dimension.**

---
## 15 · DEFERRED
Centralized multi-device library/accounts; server-side key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries of every event; full-article scraping; collaborative analyses; collector-side activation of arbitrary user-added sources.

---
## 16 · RELEASE RECORDING
Every rejected/superseded build is recorded in `PRISM-GRAVEYARD.md` with artifact, exact commit, evidence, root cause/lesson, veto and recovery baseline.
