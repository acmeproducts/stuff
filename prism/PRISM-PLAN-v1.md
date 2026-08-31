<!-- PRISM-PLAN v1.3.0 -->
# PRISM MASTER PLAN v1.3.0

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
9. **Every exposed dimension is filterable.** If a field can drive Group, Color or Size and has discrete values, the global filter system must expose it dynamically.
10. **Sources are user-manageable.** The active news-source universe is visible and configurable from Settings without introducing a second control system.

---
## 1 · LINEAGE / REFERENCES
Frozen references, never patch targets:
- `/globe.html` — dense sphere/dimensional exploration.
- `/lumasphere.html` — content-forward sphere interaction, category clustering, compact controls.
- `/onxyview-newsmap-v15.html` — event abstraction, lenses, corroboration/importance.
- `/devstream-test.html` — provider/model discovery, validation, compose-time engine selection.
- `/market-view.html` — local analysis persistence pattern.

External reference:
- `IJMacD/newsmap-js` — NewsMap layout/interaction reference. PRISM uses a proven treemap implementation rather than the rejected hand-rolled layout.

---
## 2 · PRIMARY SURFACES
### Map — build first
NewsMap-style proportional category/event hierarchy. Readable headline text on cards. Multi-select and reader inspection use the same canonical event state.

### Explore — derive second
Same filtered/selected universe in a Luma-style sphere. Event objects are information cards, not anonymous dots. Explicit zoom `− / % / +`; color is secondary encoding.

### Feed
Linear canonical events with shared filtering, selection and reader.

### Library
Saved AI analyses/research threads in IndexedDB with JSON export/import. Cloud centralization deferred.

---
## 3 · GLOBAL RIBBON / DYNAMIC FILTERS
Exactly one shared ribbon below navigation.

Shared controls:
- Group/Cluster: Subject / Region / Sentiment / Tier / Corroboration.
- Size/Area: Importance / Corroboration / Recency.
- Color: Sentiment / Subject / Region / Tier.
- Time: 24h / 3d / 7d.
- active filter summary.
- selection count + Clear + AI POV.
- Explore-only zoom at ribbon edge or surface edge; never a second filter system.

### Dynamic filter law
The filter tray is generated from the current canonical schema and active dimensions, not hard-coded to three fields.

Initial filterable fields:
- Subject
- Region
- Sentiment
- Editorial Tier
- Corroboration bucket
- Source

If Group/Color/Size introduces another discrete field later, it automatically becomes filterable. Active Group/Color dimensions appear first in the filter tray. Filter state is shared across Map/Explore/Feed.

---
## 4 · SOURCE MANAGEMENT
Settings contains a **Sources** section with `Manage sources…` opening a dedicated modal.

The source manager must:
- list every source currently present in the canonical cache with article/event counts;
- allow enable/disable per source;
- include Enable all / Disable all;
- allow user-added sources with `name + URL + type` metadata;
- persist source configuration locally;
- make Source available as a dynamic filter;
- apply enabled/disabled source state before event rendering and AI evidence construction.

### Custom-source ingestion rule
Normal startup still may not fan out to arbitrary publishers. User-added URLs are configuration records in this stage. A custom source becomes actively ingested only through a governed collector/same-origin adapter or an explicit manual source-test/import action; PRISM must not silently turn startup back into browser RSS fan-out.

---
## 5 · SELECTION / AI EVIDENCE MANAGEMENT
Multi-select is first-class and independent of opening the reader.

Requirements:
- selected cards have unmistakable state;
- selection persists across Map/Explore/Feed;
- global ribbon shows `N selected` and `Clear`;
- reader can Select/Deselect for AI;
- AI POV panel shows a **Selected evidence** stack before the prompt;
- every selected event has a remove/deselect control inside AI POV;
- `Clear all` is available in AI POV;
- deselection immediately updates Map/Explore/Feed and the AI evidence packet;
- an analysis run freezes the exact evidence packet used for that turn.

---
## 6 · AI POV / RESEARCH
AI POV opens a continuable research workspace containing selected-event evidence, editable suggested prompts, ad-hoc composer, provider/model selectors, run, prior turns and Save Analysis.

Starter prompt templates:
- Throughline — what connects these stories that is not obvious?
- Frequency — how often do comparable developments occur?
- Recency / precedent — how unusual/recent is this compared with useful prior examples?
- Missing context — what external context or competing interpretation deserves follow-up?

Selected PRISM events are primary evidence. Broader model knowledge or provider research is supplemental and must be distinguished from supplied coverage. Do not imply live browsing where the chosen model/provider did not provide it.

An Analysis is a thread: `analysisId, title, createdAt, updatedAt, provider, model, eventIds[], frozenSources[], turns[], researchMode/capabilities`.

---
## 7 · DEVSTREAM PROVIDER/MODEL CONTRACT
PRISM adopts Devstream behavior.

### Venice
1. Paste key.
2. Load models from `GET https://api.venice.ai/api/v1/models` with Bearer key.
3. Pick exact model.
4. Validate with `POST /chat/completions`, selected model, `max_tokens:1`, `ping`.
5. Only success stores verified provider/model locally.

### OpenRouter
1. Paste key.
2. Validate key via `GET /api/v1/auth/key`.
3. Load `GET /api/v1/models`.
4. Pick model.
5. Validate exact pair with `POST /chat/completions`, `max_tokens:1`, `ping`.
6. Only success stores verified pair.

### Anthropic direct
Use `/v1/messages`, `x-api-key`, `anthropic-version`, browser-access header, and exact-model minimal inference ping before verified status.

Keys are cleaned of Bearer prefix/invisible whitespace and live only in localStorage. Verification is bound to provider + model + key; any change invalidates it. Compose may choose only verified pairs.

---
## 8 · CANONICAL DATA / CACHE
Event fields: `eventId, headline, summary, subject, region, sentiment, importance, editorialTier, corroboration, firstSeen, lastSeen, tags[], coverage[]`.
Coverage: `articleId, source, title, description, url, publishedAt`.

Turn 01 may deterministically adapt same-origin `data/market-backend/news-cache.json` into canonical events in-browser. Production target remains collector-side normalization/dedupe/clustering → canonical event cache + manifest → IndexedDB.

---
## 9 · LIBRARY
IndexedDB. Saved analyses include complete turns and frozen source references. Reopen continues research. Export is versioned JSON; import validates and merges by `analysisId`; keys are excluded categorically.

---
## 10 · PERFORMANCE
- cached usable before network refresh;
- no publisher fan-out;
- Map handles current event universe without layout thrash;
- selection/filter/source changes do not refetch unchanged data;
- Explore labels/cards remain bounded;
- AI sends only selected/bounded context;
- one filter/control system only.

---
## 11 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | shell/contracts/connectivity | **PASSED FOUNDATION** | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | canonical events + first value surfaces | **REJECTED UI ARCHITECTURE** | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship | NewsMap-first unified controls + dynamic filters + source manager + evidence management + AI POV/provider validation + derived Explore | **ACTIVE** | `prism/prism-turn01-pre-ship.html` |
| 01·ship | integrated stabilization/performance/provider-device gate | Not started | — |
| 01·post-ship | Library/research continuity + integrated release gate | Not started | — |

---
## 12 · 01·PRE-SHIP GATES
### Gate A — Map / global state
- one global ribbon/tray;
- proper library-backed treemap;
- dynamic filters including Tier, Corroboration and Source;
- source enable/disable affects all views;
- multi-select 3+ stories;
- reader no underlap.

### Gate B — source manager
- Settings → Manage sources modal;
- current source inventory + counts;
- enable/disable, enable all/disable all;
- custom source records add/remove/persist;
- no automatic custom-source browser fan-out.

### Gate C — AI POV
- selected evidence list supports individual deselect + Clear all;
- suggested + ad-hoc prompts;
- Devstream-exact provider/model validation;
- only verified pairs selectable for run;
- run freezes exact evidence packet and can save/continue.

### Gate D — Explore / Feed / Library parity
- Explore cards + zoom;
- same dynamic filters and selection state;
- Feed parity;
- Library research continuity + import/export.

### Pre-flight
- JavaScript syntax pass;
- one global ribbon; no tab-specific duplicate filter bars;
- selection survives tab switch and AI-panel deselection updates all views;
- every exposed discrete dimension has a filter representation;
- keys absent from IndexedDB analysis export;
- reference lineages unchanged.

---
## 13 · DECISIONS
D1 PRISM. D2 Event primary. D3 Explore/Map/Feed/Library. D4 frozen legacy references. D5 one global ribbon. D6 NewsMap-first Map. D7 information cards rather than dots. D8 AI POV in pre-ship. D9 Devstream provider/model validation adopted. D10 Analysis is continuable research. D11 local IndexedDB + import/export. D12 source manager under Settings. D13 dynamic filters derive from available dimensions. D14 AI evidence can be deselected inside AI POV.

---
## 14 · DEFERRED
Centralized multi-device library/accounts; server-side key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries of every event; full-article scraping; collaborative analyses; collector-side activation of arbitrary user-added sources.

---
## 15 · RELEASE RECORDING
Every rejected/superseded build is recorded in `PRISM-GRAVEYARD.md` with artifact, exact commit, evidence, root cause/lesson, veto and recovery baseline.