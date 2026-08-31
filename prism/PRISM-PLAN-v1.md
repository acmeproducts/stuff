<!-- PRISM-PLAN v1.2.0 -->
# PRISM MASTER PLAN v1.2.0

**Project:** PRISM — unified event intelligence combining Globe / WorldPulse, LumaSphere, OnyxView, AI POV, and a portable local research library.
**Owner:** Product owner — sole product/release gate.
**Builder:** ChatGPT — plan, graveyard, implementation lineage, pre-flight.

---
## 0 · GOVERNANCE
Every turn runs **pre-base → base → pre-ship → ship → post-ship**. Failed architecture is graveyarded before replacement; do not patch a rejected visualization forward. Owner device testing is reserved for behavior not mechanically provable.

### Immutable product laws
1. **One information state, multiple views.** Search, time window, filters, selected events, favorites, provider/model context survive view changes.
2. **One global control ribbon.** Shared dimensions and filters live once at shell level, never duplicated per tab.
3. **Event → Coverage → Source Article** is canonical.
4. **Cache first.** Normal startup uses IndexedDB + same-origin canonical cache, never publisher fan-out.
5. **Visualizations explain themselves.** Labels, legends and encoding are part of the visualization contract.
6. **Reader never underlaps desktop information surfaces.**
7. **AI POV is contextual research, not generic chat.** Selection/provenance define its source context; outside research supplements rather than replaces that context.
8. **Provider + model must be validated before use.** Keys remain local to this browser.

---
## 1 · LINEAGE / REFERENCE IMPLEMENTATIONS
Frozen references, never patch targets:
- `/globe.html` — dense sphere/dimensional exploration.
- `/lumasphere.html` — content-forward sphere interaction, category clustering, compact controls.
- `/onxyview-newsmap-v15.html` — event abstraction, lenses, corroboration/importance.
- `/devstream-test.html` — provider/model discovery, validation, compose-time engine selection.
- `/market-view.html` — local analysis persistence pattern.

External open-source reference:
- `IJMacD/newsmap-js` — NewsMap.JS, a React/pure-JS visual representation of headlines with category enable/disable. PRISM will adopt its proven NewsMap layout/interaction principles rather than continue a hand-rolled treemap. Any incorporated source must retain applicable upstream license/attribution.

---
## 2 · PRIMARY SURFACES
### Map — build first
Map is the first fully resolved information surface. It uses a NewsMap-style area hierarchy: categories/groups own proportional screen area; event cards own proportional area inside their group; readable headline text appears directly on cards. The Map is not a generic chart placeholder.

### Explore — derive second
Sphere uses the exact same filtered/selected event universe. Category clusters follow LumaSphere concepts. Objects are **information cards/tiles**, not anonymous colored dots. Explicit `− / zoom% / +` controls plus drag/pinch/wheel. Color is secondary encoding.

### Feed
Linear rendering of the same canonical events with shared selection and reader.

### Library
Saved AI analyses/research threads in IndexedDB with JSON export/import. Cloud centralization deferred.

---
## 3 · GLOBAL RIBBON
Exactly one shared ribbon below the top navigation. It applies to Map, Explore and Feed and remains stable when tabs change.

Required controls:
- Group/Cluster dimension: Subject / Region / Sentiment / Tier / Corroboration.
- Size/Area dimension: Importance / Corroboration / Recency.
- Color dimension: Sentiment / Subject / Region / Tier.
- Time: 24h / 3d / 7d.
- visible filter trigger / active-filter count.
- selection count + `AI POV` action when one or more events are selected.
- view-specific zoom may appear at the right edge only when Explore is active; it is not a second filter/control system.

Filters: Subject, Region, Sentiment initially; chips live in one global expandable tray. Search is global. All changes update Map/Explore/Feed together.

---
## 4 · SELECTION CONTRACT
Events support click/tap selection independent of opening the reader. Multi-select is first-class.
- selected cards have unmistakable outline/check state;
- selection persists across Map/Explore/Feed;
- global ribbon shows `N selected`;
- `Clear` removes selection;
- opening details must not destroy multi-selection;
- AI POV uses selected events as primary source context.

---
## 5 · AI POV / RESEARCH CONTRACT
### 5.1 Entry
`AI POV` is enabled when events are selected. It opens a research workspace/panel containing:
- selected-event source stack with event headline, summary, time, coverage sources and URLs;
- suggested question chips generated as UI templates, not hard-coded answers;
- ad-hoc prompt composer;
- provider dropdown;
- model dropdown;
- send/run;
- prior turns for this analysis/research thread;
- Save Analysis.

Initial suggested question templates include:
- **Throughline:** “What is the throughline between these selected stories that may not be obvious?”
- **Frequency:** “How often do developments like these occur? Find useful historical comparisons and distinguish close analogues from superficial ones.”
- **Recency/context:** “How recent or unusual are these developments compared with relevant prior examples?”
They are editable prompts and examples, not product logic. Future suggestions can be contextual/generated.

### 5.2 Research behavior
The selected PRISM events are the **primary evidence packet**. AI may use its own knowledge and, where the chosen provider/model supports external/web research, outside information to add contextual texture. Responses must distinguish:
- selected-event evidence/provenance;
- outside/supplemental information;
- inference/interpretation.

PRISM must not imply that a provider performed live web research when the provider/model did not expose that capability. Phase 1 direct API calls provide structured selected-event context; richer external research tooling may be provider-dependent and is recorded in the analysis metadata.

### 5.3 Continuable research
An Analysis is a thread, not a one-shot answer:
`analysisId, title, createdAt, updatedAt, provider, model, eventIds[], frozenSources[], turns[], researchMode/capabilities`.
A saved analysis can be reopened from Library and continued with additional questions. Original frozen event/source provenance remains attached even as live news changes.

---
## 6 · DEVSTREAM PROVIDER/MODEL CONTRACT — ADOPT EXACT BEHAVIOR
PRISM adopts the validated Devstream flow rather than inventing another credential UX.

### Venice
1. User pastes Venice API key.
2. `Load Venice models` calls `GET https://api.venice.ai/api/v1/models` with Bearer key.
3. Returned model IDs populate the model selector.
4. User chooses a model.
5. `Validate & save Venice` calls `POST https://api.venice.ai/api/v1/chat/completions` with that **exact selected model**, `max_tokens:1`, user content `ping`.
6. 401 = key rejected; 402 = selected model requires credits/plan; other non-2xx is explicit failure.
7. Only a successful inference marks that provider/model verified and saves key/model locally.

### OpenRouter
1. User pastes key.
2. Validate key via `GET https://openrouter.ai/api/v1/auth/key` with Bearer key.
3. Load models from `GET https://openrouter.ai/api/v1/models`.
4. User chooses model.
5. Validate the exact pair with `POST https://openrouter.ai/api/v1/chat/completions`, `max_tokens:1`, `ping`.
6. Only success marks verified/saved.

### Anthropic direct
Key remains optional in phase 1. Direct calls use `https://api.anthropic.com/v1/messages`, `x-api-key`, `anthropic-version`, and browser-access header as in Devstream. Before PRISM exposes Anthropic as verified, the exact selected model must receive an equivalent minimal inference ping; do not merely accept a populated key.

### Key handling / model switching
- normalize pasted keys by trimming Bearer prefix and invisible whitespace, matching Devstream `cleanKey` behavior;
- keys live only in browser localStorage; never Library export, event cache, GitHub, or analysis payload;
- verification state is keyed to **provider + model + key fingerprint**; changing any one invalidates verification until re-tested;
- Settings owns keys, model discovery and verification;
- AI compose owns per-run provider/model choice from **verified pairs only**;
- changing compose provider/model does not silently change the saved default.

---
## 7 · CANONICAL DATA / CACHE
Event fields: `eventId, headline, summary, subject, region, sentiment, importance, editorialTier, corroboration, firstSeen, lastSeen, tags[], coverage[]`.
Coverage fields: `articleId, source, title, description, url, publishedAt`.

Current Turn 01 compatibility: same-origin `data/market-backend/news-cache.json` may be deterministically adapted into canonical events in-browser. Production target remains collector-side normalize/dedupe/classify/cluster → canonical event cache + manifest → IndexedDB.

---
## 8 · LIBRARY
IndexedDB. Analysis records include complete research turns and frozen event/source references. `Save Analysis` persists current thread. Reopen continues it. Export produces portable versioned JSON; import validates and merges by `analysisId`, never destructive replacement. Keys are categorically excluded.

---
## 9 · PERFORMANCE
- cached usable before network refresh;
- no publisher fan-out;
- Map must handle the current event universe without DOM/layout thrash;
- selection/filter changes do not refetch data;
- Explore uses performant card rendering and bounded labels;
- AI sends only selected/bounded context, not entire cache;
- no duplicate filter systems.

---
## 10 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | shell/contracts/connectivity | **PASSED FOUNDATION** | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | canonical events + first value surfaces | **REJECTED UI ARCHITECTURE** | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship | NewsMap-first unified controls + selection + AI POV/provider validation + derived Explore | **ACTIVE** | `prism/prism-turn01-pre-ship.html` |
| 01·ship | integrated stabilization/performance/provider-device gate | Not started | — |
| 01·post-ship | Library/research continuity + integrated release gate | Not started | — |

---
## 11 · 01·PRE-SHIP BUILD ORDER / GATES
### Gate A — Map first
- single global ribbon/tray;
- proper NewsMap-style proportional category/event layout based on upstream implementation principles;
- headline text directly on event cards;
- existing user filters operational;
- multi-select 3+ stories;
- shared reader column with no underlap.

### Gate B — AI POV
- selected events appear as source packet;
- suggested Throughline/Frequency/Recency prompts + ad-hoc prompt;
- Settings implements Devstream Venice/OpenRouter model load + exact-model inference validation;
- compose selects only verified provider/model pairs;
- live API answer can be saved as Analysis and continued.

### Gate C — Explore
Only after A/B work: category-cluster sphere using same state and event cards; explicit zoom in/out; selection parity with Map; no separate filter controls.

### Gate D — Feed/Library continuity
Feed reflects same filters/selections. Library opens saved analysis and preserves research turns/provenance; export/import round-trip.

### Pre-flight before owner handoff
- JavaScript syntax pass;
- one global ribbon exists; no per-tab duplicate filter bars;
- Map renderer is not the rejected custom strip treemap;
- all Map event rectangles remain inside their category rectangle;
- selection survives tab switch;
- AI POV context contains only selected events;
- provider/model cannot run until exact pair validated;
- keys absent from IndexedDB analysis export payload;
- Explore zoom controls work mechanically;
- reference lineage files unchanged.

---
## 12 · DECISIONS
D1 PRISM. D2 Event primary. D3 Explore/Map/Feed/Library. D4 frozen legacy references. D5 one global ribbon. D6 NewsMap-first Map. D7 information cards rather than dots in Explore. D8 AI POV promoted into pre-ship. D9 Devstream provider/model validation adopted. D10 Analysis is continuable research thread. D11 local IndexedDB + import/export; centralization later.

---
## 13 · DEFERRED
Centralized multi-device library/accounts; server-side key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries of every event; full-article scraping; collaborative analyses. External research beyond the capabilities exposed by the selected direct API provider/model is not fabricated; richer browsing/search integrations can be added as a governed research capability later.

---
## 14 · RELEASE RECORDING
Every rejected/superseded build is recorded in `PRISM-GRAVEYARD.md` with artifact, exact commit, evidence, root cause/lesson, veto and recovery baseline.