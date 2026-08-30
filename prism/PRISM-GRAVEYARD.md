<!-- PRISM-GRAVEYARD v1.0.0 -->
# PRISM GRAVEYARD v1.0.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM.

This file is mandatory build input. A rejected approach is not merely historical; it becomes an explicit constraint on future implementation.

---

## G0 · GOVERNANCE RULE

Every rejected or materially failed build records:
- turn / stage / release;
- exact commit SHA / artifact;
- date tested;
- observed failure;
- root cause if known;
- architectural lesson;
- explicit veto — what must not be repeated;
- recovery baseline.

Do not patch forward from a graveyarded implementation.

---

## G1 · Browser-side publisher fan-out as the normal startup path

**Origin lineage:** Globe / WorldPulse and related direct-RSS experiments.

**Observed failure:** many publisher sources fail intermittently or consistently in-browser while others succeed. Failures collapse CORS blocks, publisher anti-bot behavior, proxy failures, timeouts, invalid responses, and genuine feed failures into a broad `failed` result. Opening the app can trigger a near-complete network reload even when usable cached content already exists.

**Root cause:** normal startup depends on direct publisher requests and public CORS-proxy fallback from the browser rather than a same-origin persistent collector cache.

**Architectural lesson:** content freshness and app availability must be decoupled. A failed source refresh should produce stale data, not missing data or a degraded startup experience.

**VETO:** PRISM normal startup must never fan out across all publisher RSS feeds from the browser.

**Replacement:** scheduled collector → per-source last-known-good cache → canonical event cache → same-origin browser fetch → IndexedDB.

---

## G2 · Article / headline as the master visualization object

**Origin lineage:** early Globe / Luma behavior.

**Observed failure:** the same real-world development can appear repeatedly as multiple publisher headlines. This creates duplicate visual objects, inflates density, fragments corroboration, and makes AI context less coherent.

**Root cause:** visualization is attached directly to individual feed items instead of a canonical event object.

**Architectural lesson:** publisher articles are evidence / coverage. Events are the thing the user is trying to understand.

**VETO:** do not make raw article records the primary shared state model for PRISM.

**Replacement:** Event → Coverage → Source Article.

---

## G3 · Separate state universes for separate visualizations

**Origin lineage:** Globe, Luma, and Onyx evolved independently.

**Observed failure risk:** filters, selection, search, favorites, and current information context can diverge when each visualization owns its own state.

**Root cause:** each prototype was a standalone application rather than one view over a canonical information state.

**Architectural lesson:** switching visualization should not mean switching datasets or losing context.

**VETO:** Explore, Map, and Feed may not own independent canonical filter/search/selection state.

**Replacement:** one shared application state with view-specific rendering only.

---

## G4 · Treemap-only product identity

**Origin lineage:** OnyxView.

**Observed limitation:** treemap is strong for structural comparison and readability budgeting but weak as the sole discovery/engagement surface.

**Architectural lesson:** structural analysis and immersive exploration solve different user needs and should coexist over one event model.

**VETO:** do not collapse PRISM into a treemap-only application.

**Replacement:** Explore + Map + Feed over one canonical event universe.

---

## G5 · Sphere-only product identity

**Origin lineage:** Globe / LumaSphere.

**Observed limitation:** sphere exploration is engaging and high-density but is not ideal for every reading, ranking, or corroboration task.

**Architectural lesson:** the sphere is a primary exploratory lens, not the entire information architecture.

**VETO:** do not force all consumption and analysis through the sphere.

**Replacement:** Explore for immersive discovery, Map for structure, Feed for linear consumption.

---

## G6 · AI as an isolated chatbot

**Origin:** prospective integration risk.

**Failure mode avoided:** a generic chat page would lose the structured scope, selected events, source provenance, and current filters that make PRISM valuable.

**Architectural lesson:** AI must operate on explicit current information context.

**VETO:** do not implement AI as a detached chat screen with no structured event scope.

**Replacement:** compose strip with explicit scope: This event / Selected events / Current view / Current filtered universe.

---

## G7 · Provider/model controls buried only in Settings

**Origin reference:** Devstream shows provider configuration and thread-level engine/model selection.

**Failure mode avoided:** forcing a settings round-trip for every analytical question makes model switching cumbersome and hides which model produced a result.

**Architectural lesson:** credential configuration and per-request model choice are different responsibilities.

**VETO:** provider/model selection must not be available only through Settings.

**Replacement:** Settings configures/tests providers and defaults; compose strip can switch provider/model for the current analysis.

---

## G8 · Unverified provider/model use

**Origin reference:** Devstream model-ping behavior.

**Failure mode avoided:** accepting an API key/model configuration without testing causes opaque 401/402/404/model-unavailable failures at analysis time.

**Architectural lesson:** configuration should fail early and visibly.

**VETO:** do not mark a provider/model usable merely because fields are populated.

**Replacement:** explicit provider/model test before verified status.

---

## G9 · Analysis results as disposable chat history

**Origin:** prospective integration risk.

**Failure mode avoided:** valuable analyses disappear with session state and cannot be exported or revisited with provenance.

**Architectural lesson:** AI output is a durable analytical artifact.

**VETO:** do not treat completed AI analysis as transient-only chat content.

**Replacement:** stable Analysis object + Save to Library.

---

## G10 · localStorage as the analysis library

**Origin:** prospective implementation shortcut.

**Failure mode avoided:** large AI responses and frozen source context exceed the intended use and practical capacity of localStorage.

**Architectural lesson:** analysis artifacts require structured, larger local persistence.

**VETO:** do not use localStorage as the primary PRISM analysis store.

**Replacement:** IndexedDB with schema versioning and import/export.

---

## G11 · Destructive library import

**Origin:** prospective implementation risk.

**Failure mode avoided:** importing an older or partial library could erase analyses already stored locally.

**Architectural lesson:** portability must not threaten local history.

**VETO:** do not implement import as whole-database replacement by default.

**Replacement:** schema validation + merge by `analysisId` + imported/skipped/replaced counts.

---

## G12 · Patching legacy prototypes into the combined product

**Origin lineages:** `globe.html`, `lumasphere.html`, `onxyview-newsmap-v15.html`.

**Observed risk:** each file contains independent architecture, state, rendering, and data assumptions. Incrementally welding features across them would preserve contradictions and produce regression-heavy patch chains.

**Architectural lesson:** the references are evidence, not a merge base.

**VETO:** do not turn any of the three legacy HTML files into PRISM by repeated patching.

**Replacement:** freeze them as reference implementations and establish a new `prism/` lineage governed by `PRISM-PLAN-v1.md`.

---

## RELEASE TEST RECORDS

No PRISM implementation release has been tested yet.

First expected record: **Turn 01 · pre-base** after `prism-turn01-pre-base.html` is built and pre-flighted.
