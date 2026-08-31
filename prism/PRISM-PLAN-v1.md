<!-- PRISM-PLAN v1.4.0 -->
# PRISM MASTER PLAN v1.4.0

**Project:** PRISM — unified event intelligence combining Globe / WorldPulse, LumaSphere, OnyxView, AI POV, and a portable local research library.
**Owner:** Product owner — sole product/release gate.
**Builder:** ChatGPT — plan, graveyard, implementation lineage, pre-flight.

---
## 0 · GOVERNANCE
Every turn runs **pre-base → base → pre-ship → ship → post-ship**. Failed architecture is graveyarded before replacement; behavior/architecture changes are written here before implementation.

### Immutable product laws
1. **One information state, multiple views.** Search, time window, filters, selected events, favorites, provider/model context survive view changes.
2. **One global control ribbon.** Shared dimensions and filters live once at shell level, never duplicated per tab.
3. **Event → Coverage → Source Article** is canonical.
4. **Cache first.** Normal startup uses IndexedDB + same-origin canonical cache, never publisher fan-out.
5. **Visualizations explain themselves.** Labels, legends and encoding are part of the visualization contract.
6. **Reader never underlaps desktop information surfaces.**
7. **AI POV is contextual research, not generic chat.** Selection/provenance define its source context; outside research supplements rather than replaces that context.
8. **Provider + model must be validated before use.** Keys remain local to this browser.
9. **Every exposed discrete dimension is filterable.** Group/Color fields automatically participate in the global filter system.
10. **Sources are user-manageable.** Source inventory/configuration lives in Settings without introducing a second global control system.
11. **Natural gesture parity.** Explore uses wheel/trackpad and pinch zoom like Map; no redundant +/- zoom chrome is required.
12. **AI output is document-quality.** Markdown renders as formatted HTML, and any cited/further-reading source intended for navigation must be a working clickable http(s) hyperlink.

---
## 1 · LINEAGE / REFERENCES
Frozen references, never patch targets:
- `/globe.html` — dense sphere/dimensional exploration.
- `/lumasphere.html` — content-forward sphere interaction, category clustering.
- `/onxyview-newsmap-v15.html` — event abstraction, lenses, corroboration/importance.
- `/devstream-test.html` — provider/model discovery and validation.
- `/market-view.html` — local analysis persistence.

External reference: `IJMacD/newsmap-js` for NewsMap interaction principles. PRISM uses a proven library-backed treemap rather than the rejected hand-rolled layout.

---
## 2 · PRIMARY SURFACES
### Map — primary structural surface
Library-backed NewsMap-style proportional category/event hierarchy. Readable headline text, multi-select, reader inspection, map-native pan/zoom.

### Explore — derived immersive surface
Same filtered/selected universe in a Luma-style sphere. Objects are information cards, not anonymous dots. **Wheel/trackpad zoom on desktop and two-finger pinch zoom on touch are mandatory.** Zoom must be smooth, bounded and stateful during the session. No +/- buttons.

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
- active filter tray.
- selection count + Clear + AI POV.

Initial filterable fields: Subject, Region, Sentiment, Editorial Tier, Corroboration bucket, Source. Active Group/Color dimensions appear first. State is shared across Map/Explore/Feed.

---
## 4 · SOURCE MANAGEMENT
Settings → **Sources → Manage sources…** opens a dedicated modal.

Requirements:
- list every cache source with article/event counts;
- enable/disable per source;
- Enable all / Disable all;
- user-added source records with name + URL + type;
- local persistence;
- Source filter integration;
- enabled/disabled source state applied before visualization and AI evidence construction.

Normal startup may not silently fetch arbitrary user-added publisher URLs. Custom activation remains collector/same-origin work.

---
## 5 · SELECTION / AI EVIDENCE MANAGEMENT
Multi-select is independent of opening the reader. Selection persists across views. Ribbon exposes count + Clear. Reader can Select/Deselect for AI. AI POV shows the selected evidence stack with per-event remove and Clear all. Deselect immediately updates all views and the next evidence packet. Each completed AI turn freezes its exact evidence packet.

---
## 6 · AI POV / RESEARCH
AI POV is a continuable research workspace with selected-event evidence, editable suggested prompts, ad-hoc composer, provider/model selectors, prior turns and Save Analysis.

Starter prompt templates: Throughline, Frequency, Recency/precedent, Missing context.

### 6.1 Evidence vs outside context
Selected PRISM events are primary evidence. Broader model knowledge/provider research is supplemental and must be distinguished from supplied coverage. PRISM must never claim live browsing unless the selected provider/model actually supplies it.

### 6.2 Markdown rendering contract
AI responses are treated as Markdown documents, not plain text.
- headings, paragraphs, lists, emphasis, block quotes, tables, inline code and fenced code render correctly;
- raw model HTML is sanitized before insertion;
- Markdown links render as clickable links;
- bare `http://` / `https://` URLs are autolinked when supported by the renderer;
- external links open safely in a new tab with `rel="noopener noreferrer"`;
- malformed/non-http(s) navigation targets are not promoted as external links.

### 6.3 Source / further-reading contract
The AI system instruction must require that any **Sources**, **Further reading**, **Research leads**, or similar navigational recommendation include a complete working `https://...` or `http://...` URL in Markdown link form when a URL is actually known. It must not fabricate URLs. If the model knows a source conceptually but cannot provide a reliable URL, it should identify it as an unlinked research lead rather than emit a fake link.

### 6.4 Analysis continuity
An Analysis is a thread: `analysisId, title, createdAt, updatedAt, provider, model, eventIds[], frozenSources[], turns[], researchMode/capabilities`. Library reopen/continuation preserves Markdown responses and provenance.

---
## 7 · DEVSTREAM PROVIDER/MODEL CONTRACT
PRISM adopts Devstream behavior.

**Venice:** paste key → GET `/models` → choose exact model → POST `/chat/completions` with selected model, `max_tokens:1`, `ping` → only success is verified.

**OpenRouter:** paste key → GET `/auth/key` → GET `/models` → choose exact model → POST `/chat/completions` minimal ping → only success is verified.

**Anthropic direct:** `/v1/messages`, `x-api-key`, `anthropic-version`, browser-access header, exact-model minimal inference ping.

Keys are cleaned of Bearer prefix/invisible whitespace and live only in localStorage. Verification is bound to provider + model + key; any change invalidates it. Compose may run only verified pairs.

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
- Map handles current universe without layout thrash;
- selection/filter/source changes do not refetch unchanged data;
- Explore gesture zoom updates transform without rebuilding the data universe;
- AI sends bounded context only;
- one filter/control system only.

---
## 11 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | shell/contracts/connectivity | **PASSED FOUNDATION** | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | canonical events + first value surfaces | **REJECTED UI ARCHITECTURE** | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship | unified NewsMap + dynamic filters + source manager + evidence management + AI POV + gesture Explore | **ACTIVE** | `prism/prism-turn01-pre-ship.html` |
| 01·ship | integrated stabilization/performance/provider-device gate | Not started | — |
| 01·post-ship | Library/research continuity + integrated release gate | Not started | — |

---
## 12 · 01·PRE-SHIP GATES
### Gate A — Map / global state
One global ribbon; library-backed treemap; dynamic filters including Tier/Corroboration/Source; source enable/disable; multi-select; no reader underlap.

### Gate B — source manager
Inventory/counts; enable/disable; enable/disable all; custom source records; no automatic custom-source startup fan-out.

### Gate C — AI POV
Evidence remove/Clear all; suggested + ad-hoc prompts; Devstream-exact provider/model validation; only verified pairs runnable; Markdown result rendering; working http(s) source/further-reading hyperlinks; save/continue.

### Gate D — Explore / Feed / Library parity
Explore information cards; **wheel + pinch zoom without +/- controls**; same dynamic filters and selection; Feed parity; Library Markdown/provenance continuity and import/export.

### Pre-flight
- JavaScript syntax pass;
- one global ribbon;
- no Explore +/- zoom buttons;
- wheel and pinch handlers present and bounded;
- Markdown renderer + sanitizer present;
- AI external links decorated with target/rel and constrained to http(s);
- selection survives tab switch;
- every exposed discrete dimension has filter representation;
- keys absent from analysis export;
- reference lineages unchanged.

---
## 13 · DECISIONS
D1 PRISM. D2 Event primary. D3 Explore/Map/Feed/Library. D4 frozen legacy references. D5 one global ribbon. D6 NewsMap-first Map. D7 information cards not dots. D8 AI POV in pre-ship. D9 Devstream validation adopted. D10 Analysis is continuable research. D11 IndexedDB + import/export. D12 source manager under Settings. D13 dynamic filters. D14 AI evidence deselect inside AI POV. **D15 Explore zoom is wheel/pinch, no +/- controls. D16 AI output is sanitized Markdown with working source/further-reading hyperlinks when reliable URLs are available.**

---
## 14 · DEFERRED
Centralized multi-device library/accounts; server-side key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries of every event; full-article scraping; collaborative analyses; collector-side activation of arbitrary user-added sources.

---
## 15 · RELEASE RECORDING
Every rejected/superseded build is recorded in `PRISM-GRAVEYARD.md` with artifact, exact commit, evidence, root cause/lesson, veto and recovery baseline.