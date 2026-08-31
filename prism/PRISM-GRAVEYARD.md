<!-- PRISM-GRAVEYARD v1.6.0 -->
# PRISM GRAVEYARD v1.6.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM. This file is mandatory build input.

---
## G0 · GOVERNANCE RULE
Every materially failed or constrained release records stage/artifact/commit, observed failure, root cause/lesson, explicit veto, and recovery baseline. Do not patch a rejected architecture forward without first changing the plan.

---
## DURABLE VETOES

### G1 · Browser publisher fan-out
Normal startup may not independently fetch publisher RSS feeds. Use same-origin cache/IndexedDB.

### G2 · Article as master object
Raw headlines may not be the shared visualization object. Use Event → Coverage → Source Article.

### G3 · Separate state universes
Map/Explore/Feed may not maintain independent search/filter/selection state.

### G4 / G5 · Single-view identity
PRISM may be neither treemap-only nor sphere-only.

### G6 · Detached generic AI chat
AI must be scoped to PRISM evidence and preserve provenance.

### G7 / G8 · Settings-only or unverified model use
Settings owns credentials/model discovery; compose can choose verified pairs. A populated field is not verification.

### G9 · Disposable AI answers
Research outputs become durable Analysis threads and can be saved/continued.

### G10 / G11 · localStorage Library / destructive import
Library uses IndexedDB; import merges by analysisId.

### G12 · Patch legacy prototypes into PRISM
Globe/Luma/Onyx are frozen references, not patch targets.

### G13 · Unexplained encoding
Any active Color/Size/Group mapping must explain itself in-view.

### G14 · Controls without operational filtering
Reserved state is not a filter feature.

### G15 · Box collection mislabeled treemap
Do not call list/grid boxes a treemap.

### G16 · Reader underlap
Desktop contextual reading must resize the work surface.

### G17 · Per-tab control bars
There is one global analytical ribbon.

### G18 · Anonymous dots as final Explore objects
Explore uses readable information cards/tiles and meaningful cluster labels.

### G19 · Hand-rolled PRISM treemap
Rejected. Use proven library-backed NewsMap/treemap behavior.

### G20 · AI deferred behind visualization work
AI POV is part of the integrated pre-ship value gate.

### G21 · Filter catalog disconnected from selected dimensions
**Origin:** PRISM Turn 01 pre-ship R2 owner test.
**Artifact:** `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06`.
**Observed failure:** the filter tray showed Subject, Region, Sentiment, Tier, Corroboration and Source even when those fields had not been selected as active analytical dimensions. This made the ribbon read as two unrelated configuration systems and made Source especially confusing because it appeared as a filter without being selected as a dimension.
**Root cause:** `filterFields()` promoted active Group/Color dimensions but then appended the entire catalog of filterable fields, so every possible filter was always visible. The architecture therefore violated the intended dimension → filter relationship.
**Lesson:** filters are not an independent facet browser in PRISM. They refine the dimensions the user chose to visualize.
**VETO:** never display a filter for a discrete field that is not currently selected as an analytical dimension. Never leave an inactive dimension's filter state silently constraining the corpus.
**Replacement:** derive `activeFilterDimensions` only from currently selected discrete roles; deduplicate; clear filters immediately when their dimension becomes inactive. Source becomes a selectable Group/Color dimension and appears as a filter only when selected. Source enable/disable remains separate under Config → Sources.
**Recovery baseline:** preserve all accepted R2 shell, Map, sphere gestures/clustering, AI Markdown/link handling, selection and Library behavior; change only the dimension/filter contract in R3.

---
# RELEASE TEST RECORDS

## T01-PREBASE · Foundation accepted
**Artifact:** `prism/prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a`
**Result:** foundation passed; presentation findings carried forward.

## T01-BASE · Rejected visualization architecture
**Artifact:** `prism/prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f`
**Result:** rejected as forward UI baseline.

## T01-PRE-SHIP R1 · Superseded
**Artifact:** `prism/prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da`
**Result:** superseded by rail/right-panel, sphere gesture, Markdown and Library findings.

## T01-PRE-SHIP R2 · Accepted direction, filter contract rejected
**Artifact:** `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06`
**Result:** shell/Map/Explore/AI/Library direction retained; always-on filter catalog rejected. R3 must preserve R2 behavior while making filters a strict projection of selected dimensions.
