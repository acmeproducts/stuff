<!-- PRISM-PLAN v1.5.0 -->
# PRISM MASTER PLAN v1.5.0

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
6. **Desktop shell is rail + work surface + collapsible right context panel.** The left rail collapses/expands; event detail, AI research and Library inspection use one right-side context panel rather than unrelated overlays.
7. **AI POV is contextual research, not generic chat.** Selection/provenance define its source context; outside research supplements rather than replaces it.
8. **Provider + model must be validated before use.** Keys remain local to this browser.
9. **Every exposed discrete dimension is filterable.** Group/Color fields automatically participate in the global filter system.
10. **Sources are user-manageable.** Source inventory/configuration lives in Settings without introducing a second global control system.
11. **Natural gesture parity.** Explore uses wheel/trackpad and pinch zoom like Map; no redundant +/- zoom chrome.
12. **AI output is document-quality.** Markdown renders correctly; further-reading/source references must use working clickable http(s) hyperlinks when a reliable URL is available.
13. **Explore is a real rotatable sphere.** Pointer/touch drag rotates yaw/pitch. Events remain organized into labeled clusters *inside the sphere* according to the active Group dimension while the sphere rotates.
14. **Library is a first-class workspace.** It is not an inert export bucket: analyses are searchable, openable, deletable, exportable/importable, and continuable as research threads with preserved Markdown and provenance.

---
## 1 · LINEAGE / REFERENCES
Frozen references, never patch targets:
- `/globe.html` — dense sphere/dimensional exploration.
- `/lumasphere.html` — content-forward sphere interaction and category clusters.
- `/onxyview-newsmap-v15.html` — event abstraction, lenses, corroboration/importance.
- `/devstream-test.html` — provider/model discovery and validation.
- `/market-view.html` — local analysis persistence.
- `/market-view-ux-gate3-p2.html` — shell reference: collapsible left navigation rail, central work surface, persistent analytical composition pattern.

External reference: `IJMacD/newsmap-js` for NewsMap interaction principles. PRISM uses a proven library-backed treemap rather than the rejected hand-rolled layout.

---
## 2 · SHELL
Desktop/tablet shell:
`collapsible left rail | central work surface | collapsible right context panel`.

Left rail owns primary navigation: Map, Explore, Feed, Library, Config. A menu button collapses/expands it without changing information state.

Right context panel owns mutually exclusive contextual modes:
- Event details / coverage
- AI POV / selected evidence / research thread
- Library analysis detail / continuation
- Config / provider settings

Opening or closing the right panel must resize the work surface rather than underlap it. Mobile may use the same panel as a full/near-full overlay.

---
## 3 · PRIMARY SURFACES
### Map
Library-backed NewsMap-style proportional category/event hierarchy. Readable headline text, multi-select, reader inspection, map-native pan/zoom.

### Explore
Same filtered/selected universe in a Luma-style rotatable sphere. Events are compact information cards rendered within labeled clusters. Requirements:
- group cluster centers distributed inside the sphere;
- events packed around their cluster center with deterministic 3D offsets;
- drag rotates yaw/pitch;
- wheel/trackpad zoom desktop;
- two-finger pinch zoom touch;
- no +/- buttons;
- selection parity with Map/Feed;
- cluster labels rotate/project with the sphere;
- zoom/rotation update projection only, not the event universe.

### Feed
Linear canonical events with shared filtering, selection and right-panel reader.

### Library
Full research workspace. Main Library surface lists saved analyses with search, recency, provider/model and event counts. Selecting an analysis opens its complete Markdown research thread and frozen evidence/provenance in the right panel. Actions: Continue research, Delete, Export one, Export all, Import/merge.

---
## 4 · GLOBAL RIBBON / DYNAMIC FILTERS
Exactly one shared ribbon in the central work surface.

Shared controls:
- Group/Cluster: Subject / Region / Sentiment / Tier / Corroboration.
- Size/Area: Importance / Corroboration / Recency.
- Color: Sentiment / Subject / Region / Tier.
- Time: 24h / 3d / 7d.
- active dynamic filter tray.
- selection count + Clear + AI POV.

Filterable fields: Subject, Region, Sentiment, Editorial Tier, Corroboration bucket, Source. Active Group/Color dimensions appear first. State is shared across Map/Explore/Feed.

---
## 5 · SOURCE MANAGEMENT
Config → **Sources → Manage sources…** opens a dedicated modal.

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
## 6 · SELECTION / AI EVIDENCE MANAGEMENT
Multi-select is independent of opening the reader. Selection persists across views. Ribbon exposes count + Clear. Reader can Select/Deselect for AI. AI POV shows the selected evidence stack with per-event remove and Clear all. Deselect immediately updates all views and the next evidence packet. Each completed AI turn freezes its exact evidence packet.

---
## 7 · AI POV / RESEARCH
AI POV is a continuable research workspace in the right context panel with selected-event evidence, editable suggested prompts, ad-hoc composer, provider/model selectors, prior turns and Save Analysis.

Starter prompt templates: Throughline, Frequency, Recency/precedent, Missing context.

### 7.1 Markdown rendering
AI responses are Markdown documents.
- headings, paragraphs, ordered/unordered lists, emphasis, block quotes, tables, inline code and fenced code render;
- raw HTML is escaped/sanitized;
- Markdown links render clickable only for `http://` / `https://`;
- bare http(s) URLs are autolinked;
- external links use `target="_blank" rel="noopener noreferrer"`;
- non-http(s) schemes are not promoted as external links.

### 7.2 Further reading / sources
The system instruction requires that any **Sources**, **Further reading**, **Research leads**, or comparable navigational references include complete working Markdown hyperlinks when a reliable URL is known. The model must not fabricate URLs. If it knows only a publication/source conceptually, it must label it as an unlinked research lead.

### 7.3 Continuity
An Analysis is a thread: `analysisId, title, createdAt, updatedAt, provider, model, eventIds[], frozenSources[], turns[], researchMode/capabilities`. Reopen/continue preserves Markdown responses and provenance.

---
## 8 · DEVSTREAM PROVIDER/MODEL CONTRACT
PRISM adopts Devstream behavior.

**Venice:** paste key → GET `/models` → choose exact model → POST `/chat/completions` with selected model, `max_tokens:1`, `ping` → only success is verified.

**OpenRouter:** paste key → GET `/auth/key` → GET `/models` → choose exact model → POST `/chat/completions` minimal ping → only success is verified.

**Anthropic direct:** `/v1/messages`, `x-api-key`, `anthropic-version`, browser-access header, exact-model minimal inference ping.

Keys are cleaned of Bearer prefix/invisible whitespace and live only in localStorage. Verification is bound to provider + model + key; any change invalidates it. Compose may run only verified pairs.

---
## 9 · CANONICAL DATA / CACHE
Event fields: `eventId, headline, summary, subject, region, sentiment, importance, editorialTier, corroboration, firstSeen, lastSeen, tags[], coverage[]`.
Coverage: `articleId, source, title, description, url, publishedAt`.

Turn 01 may deterministically adapt same-origin `data/market-backend/news-cache.json` into canonical events in-browser. Production target remains collector-side normalization/dedupe/clustering → canonical event cache + manifest → IndexedDB.

---
## 10 · LIBRARY STORAGE / PORTABILITY
IndexedDB. Saved analyses include full turns, rendered Markdown source text, exact provider/model, frozen event/source references and timestamps. Reopen continues research.

Export one analysis or complete Library as versioned JSON. Import validates and merges by `analysisId`; no destructive replacement. API keys are excluded categorically.

---
## 11 · PERFORMANCE
- cached usable before network refresh;
- no publisher fan-out;
- Map handles current universe without layout thrash;
- selection/filter/source changes do not refetch unchanged data;
- Explore rotation/zoom update projection only;
- AI sends bounded context only;
- one filter/control system only;
- collapsed rail/right panel recover central pixels without reloading data.

---
## 12 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | shell/contracts/connectivity | **PASSED FOUNDATION** | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | canonical events + first value surfaces | **REJECTED UI ARCHITECTURE** | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship R1 | unified NewsMap + dynamic filters + source manager + initial AI POV | **SUPERSEDED BY OWNER FINDINGS** | `prism/prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da` |
| 01·pre-ship R2 | rail shell + real rotatable clustered sphere + Markdown/link-safe AI + full Library | **ACTIVE** | `prism/prism-turn01-pre-ship-r2.html` |
| 01·ship | integrated stabilization/performance/provider-device gate | Not started | — |
| 01·post-ship | integrated release gate | Not started | — |

---
## 13 · 01·PRE-SHIP R2 GATES
### Gate A — shell / Map
Collapsible left rail; one global ribbon; ECharts/NewsMap map; collapsible right context panel; no underlap.

### Gate B — Explore
Real sphere rotation by drag; cluster centers + event cards remain grouped within sphere; wheel/trackpad + pinch zoom; no +/- buttons; selection parity.

### Gate C — AI POV
Evidence remove/Clear all; suggested + ad-hoc prompts; Devstream provider/model validation; only verified pairs runnable; Markdown rendering; working http(s) source/further-reading links; save/continue.

### Gate D — Library
Search/list analyses; open detail; render complete Markdown turns; frozen evidence/provenance; continue research; delete; export one/all; import/merge.

### Pre-flight
- JavaScript syntax pass;
- one global ribbon;
- no Explore +/- zoom buttons;
- wheel + pinch + pointer-drag rotation handlers present;
- cluster projection logic present;
- Markdown renderer escapes raw HTML and constrains links to http(s);
- right panel and left rail are collapsible;
- selection survives view switch;
- keys absent from analysis export;
- legacy reference files unchanged.

---
## 14 · DECISIONS
D1 PRISM. D2 Event primary. D3 Map/Explore/Feed/Library. D4 frozen legacy references. D5 one global ribbon. D6 NewsMap-first Map. D7 information cards not dots. D8 AI POV in pre-ship. D9 Devstream validation adopted. D10 Analysis is continuable research. D11 IndexedDB + import/export. D12 source manager under Config. D13 dynamic filters. D14 AI evidence deselect. D15 Explore zoom wheel/pinch, no +/- controls. D16 Markdown/link-safe AI. **D17 left rail + central work + collapsible right context panel. D18 sphere must rotate and maintain visible in-sphere clusters. D19 Library is a full workspace, modeled on the Market View Gate 3 shell rather than an inert tab.**

---
## 15 · DEFERRED
Centralized multi-device library/accounts; server-side key custody; embeddings/vector search; geographic/network/timeline modes; automatic AI summaries of every event; full-article scraping; collaborative analyses; collector-side activation of arbitrary user-added sources.

---
## 16 · RELEASE RECORDING
Every rejected/superseded build is recorded in `PRISM-GRAVEYARD.md` with artifact, exact commit, evidence, root cause/lesson, veto and recovery baseline.