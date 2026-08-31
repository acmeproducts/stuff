<!-- PRISM-PLAN v1.8.0 -->
# PRISM MASTER PLAN v1.8.0

**Project:** PRISM — unified event intelligence combining NewsMap, dimensional Explore, AI POV, and a durable local research library.
**Owner:** Product owner — sole product/release gate.
**Builder:** ChatGPT — plan, graveyard, implementation lineage, pre-flight.

---
## 0 · GOVERNANCE
Every turn runs **pre-base → base → pre-ship → ship → post-ship**. Failed architecture is graveyarded before replacement; behavior/architecture changes are written here before implementation.

### Immutable product laws
1. One information state across Map / Explore / Feed / Library.
2. One global analytical ribbon.
3. Event → Coverage → Source Article is canonical.
4. Cache first; no publisher fan-out during normal startup.
5. Desktop shell is collapsible left rail | central work surface | collapsible right context panel.
6. AI POV is selected-evidence research, not generic chat; provider/model must be validated; keys stay browser-local.
7. Library is a first-class research workspace.
8. **Every selected analytical dimension has exactly one corresponding filter.**
9. **The filter control is also the legend for that dimension.** No redundant inert legend may restate the same Color mapping.
10. **Quantitative dimensions use governed buckets where human comparison benefits from categories.** Importance is bucketed rather than exposed only as an arbitrary slider.
11. **Explore is not a globe.** The rejected dense spherical-card rendering is replaced by a dimensional spatial surface with X, Y, and Z/Size roles, plus a Grid mode.

---
## 1 · REFERENCE LINEAGE
Frozen references:
- `/lumasphere.html` — cluster density, content-forward spatial browsing, compact controls.
- `/onxyview-newsmap-v15.html` — event abstraction and importance/corroboration concepts.
- `/market-view-ux-gate3-p2.html` — collapsible rail / work / context shell.
- `/devstream-test.html` — provider/model discovery and exact-model validation.
- `/market-view.html` — local analysis persistence.

External reference: `IJMacD/newsmap-js` for Map/NewsMap layout principles.

---
## 2 · BASELINE / NEXT RELEASE
**Recovery baseline:** `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06` for shell, AI, source management, and Library patterns.

**R3:** `prism/prism-turn01-pre-ship-r3.html` @ `807656e7e14c4b8503b3b7c88b83271967f64692` proved all-active-dimensions → corresponding filters but its Explore visualization is rejected.

**R4 is now the active build.** R4 preserves the accepted shell/AI/Library/source architecture while replacing Explore and correcting filter/legend semantics.

---
## 3 · GLOBAL DIMENSION MODEL
### Roles
- **X / Group:** Subject, Region, Sentiment, Tier, Corroboration, Source.
- **Y:** Subject, Region, Sentiment, Tier, Corroboration, Source, Importance.
- **Color:** Subject, Region, Sentiment, Tier, Corroboration, Source, Importance.
- **Z / Size:** Importance, Corroboration, Recency.

Map may interpret X/Group as hierarchy/grouping; Explore interprets X and Y as spatial axes/bands and Z as visual size/importance.

### Filter projection
`activeFilters = unique(X/Group, Y, Color, Z/Size)`.
Every active field renders exactly one filter. Removing a field removes and clears its filter state.

### Filter = legend
For categorical dimensions, the colored filter chips are the legend. A chip's swatch/text shows the active Color mapping directly. There is no second floating Color legend.

For quantitative/bucketed dimensions, the same filter control shows the visual encoding labels.

---
## 4 · BUCKET CONTRACT
### Importance
Importance is standardized into four governed buckets:
- **Critical:** 80–100
- **High:** 60–79
- **Medium:** 40–59
- **Low:** 0–39

These buckets are usable for X/Y/Color filtering and explain Z/Size when Importance controls size. Exact numeric importance remains visible in event detail.

### Corroboration
- 1 source
- 2 sources
- 3 sources
- 4+ sources

### Recency
Recency filter uses practical buckets bounded by the global time window (for example newest / recent / older within 24h, 3d, or 7d) rather than an opaque range slider where possible.

---
## 5 · EXPLORE R4 — DIMENSIONAL SPACE
Explore has two modes sharing the same filtered/selected event universe.

### 5.1 Spatial mode
A rotatable/zoomable **X/Y dimensional plane in 3D perspective**, not a sphere.
- X dimension creates horizontal bands/columns.
- Y dimension creates vertical bands/rows.
- Each X×Y cell is a visible cluster region.
- Events are packed deterministically within their cell.
- Z/Size controls card/bubble size.
- Color dimension controls border/fill accent.
- Cluster/cell labels identify combinations such as `Business × Africa`.
- Wheel/trackpad and pinch zoom.
- Drag rotates/pans the perspective grid enough to inspect dense areas without destroying the X/Y semantics.
- Important / high-tier clusters must be visually obvious through size, density, and labels.

Example: X=Subject, Y=Region, Z=Importance immediately reveals where Business/Africa differs from Technology/North America.

### 5.2 Grid mode
A companion **Grid** toggle flattens the same X×Y structure into a clean matrix. Grid is not a separate state universe: selection, filters, search, dimensions, and AI evidence persist when switching Spatial ↔ Grid.

### 5.3 LumaSphere influence
Borrow LumaSphere's content-forward density, compact labeled clusters, and readable story objects; do not reproduce its spherical constraint if that harms legibility.

---
## 6 · MAP
Library-backed NewsMap-style proportional hierarchy. Readable headline text, multi-select, right-panel event inspection, pan/zoom. Uses the same dimension/filter state as Explore and Feed.

---
## 7 · SELECTION / AI POV
Multi-select persists across Map/Explore/Feed. Ribbon shows selected count + Clear + AI POV. Event detail can Select/Deselect. AI POV shows selected evidence with per-item remove + Clear all.

AI output renders sanitized Markdown. Source/further-reading references are clickable only when complete working http(s) URLs are supplied; no fabricated links.

---
## 8 · SOURCES / CONFIG
Config → Sources lists current source inventory/counts, supports enable/disable and local custom source records. Source acquisition enable/disable is separate from Source as an analytical dimension/filter.

Provider/model behavior follows Devstream exact-model validation for Venice, OpenRouter, and optional Anthropic direct.

---
## 9 · LIBRARY
IndexedDB research workspace: search/list saved analyses, full Markdown turns, frozen evidence/provenance, Continue research, Delete, Export one/all, Import/merge. API keys never enter Library data/export.

---
## 10 · R4 GATE
Before owner handoff:
- no globe/sphere boundary or spherical event packing remains in Explore;
- Spatial Explore exposes X, Y, Color, Z/Size with visible X×Y cluster cells;
- Grid mode presents the exact same X×Y cluster state flattened;
- drag + wheel/pinch interaction works without changing the data universe;
- filter tray contains only active dimensions;
- every active dimension has one filter;
- categorical filter chips double as the Color legend; no duplicate floating legend;
- Importance uses Critical/High/Medium/Low buckets;
- Corroboration uses 1/2/3/4+ buckets;
- Source appears as a filter only when selected as a dimension;
- Map/Explore/Feed share selection and filters;
- AI Markdown/link, source manager, shell and Library behaviors remain intact.

---
## 11 · TURN/STAGE LEDGER
| Turn·Stage | Release | Status | Artifact |
|---|---|---|---|
| 01·pre-base | foundation | PASSED | `prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` |
| 01·base | first value surfaces | REJECTED | `prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` |
| 01·pre-ship R1 | NewsMap + AI initial | SUPERSEDED | `prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da` |
| 01·pre-ship R2 | rail shell + AI + Library | RECOVERY BASELINE | `prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06` |
| 01·pre-ship R3 | dimension-derived filters + globe Explore | **EXPLORE REJECTED** | `prism-turn01-pre-ship-r3.html` @ `807656e7e14c4b8503b3b7c88b83271967f64692` |
| 01·pre-ship R4 | dimensional Spatial/Grid Explore + unified filter/legend + importance buckets | **ACTIVE BUILD** | `prism/prism-turn01-pre-ship-r4.html` |
| 01·ship | stabilization/provider-device gate | Not started | — |

---
## 12 · DEFERRED
Centralized multi-device accounts/library, embeddings/vector search, full-article scraping, collaboration, collector-side activation of arbitrary custom publisher URLs.
