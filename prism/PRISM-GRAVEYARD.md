<!-- PRISM-GRAVEYARD v1.1.0 -->
# PRISM GRAVEYARD v1.1.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM. This file is mandatory build input.

---

## G0 · GOVERNANCE RULE
Every materially failed or constrained release records turn/stage/release, exact commit/artifact, date, observed failure, root cause if known, architectural lesson, explicit veto, and recovery baseline. Do not patch forward from a graveyarded implementation.

---

## G1 · Browser-side publisher fan-out as normal startup
**Origin:** Globe / WorldPulse direct-RSS lineage.
**Failure:** intermittent CORS/403/proxy/timeout failures; app availability tied to source freshness.
**VETO:** PRISM normal startup must never fan out across publisher RSS feeds.
**Replacement:** collector → last-known-good source cache → canonical event cache → same-origin fetch → IndexedDB.

## G2 · Article/headline as master visualization object
**Origin:** early Globe/Luma.
**Failure:** duplicate real-world developments inflate density and fragment corroboration/AI context.
**VETO:** raw articles may not be PRISM's primary shared object.
**Replacement:** Event → Coverage → Source Article.

## G3 · Separate state universes per visualization
**Failure risk:** search/filter/selection/favorites diverge across views.
**VETO:** Explore, Map, Feed may not own independent canonical state.
**Replacement:** one shared application state.

## G4 · Treemap-only identity
Treemap is strong structurally but weak as sole discovery surface.
**VETO:** PRISM may not collapse into a treemap-only product.

## G5 · Sphere-only identity
Sphere is engaging but weak for every reading/ranking/corroboration task.
**VETO:** PRISM may not force all consumption through the sphere.

## G6 · AI as isolated chatbot
**VETO:** no detached generic chat screen without structured event scope/provenance.
**Replacement:** compose strip scoped to current PRISM information state.

## G7 · Provider/model controls only in Settings
Credential configuration and per-analysis model choice are separate responsibilities.
**VETO:** provider/model choice cannot be Settings-only.

## G8 · Unverified provider/model use
**VETO:** populated fields do not equal usable configuration.
**Replacement:** explicit provider/model ping before verified status.

## G9 · Disposable AI results
**VETO:** completed analyses cannot be transient-only chat history.
**Replacement:** durable Analysis object + Save to Library.

## G10 · localStorage analysis library
**VETO:** do not use localStorage as the primary analysis store.
**Replacement:** IndexedDB.

## G11 · Destructive library import
**VETO:** import must not replace the whole local library by default.
**Replacement:** validate + merge by `analysisId`.

## G12 · Patching legacy prototypes into PRISM
`globe.html`, `lumasphere.html`, and `onxyview-newsmap-v15.html` contain conflicting architecture/state/rendering assumptions.
**VETO:** do not turn one legacy file into PRISM by patch chains.
**Replacement:** frozen references + new governed `prism/` lineage.

## G13 · Unexplained visual encoding
**Origin:** PRISM Turn 01 pre-base owner test.
**Observed failure:** sphere rendered colored/sized objects but no visible legend, leaving the user unable to know what the globe was communicating.
**Root cause:** pre-base proved rendering connectivity but treated legend/explanation as presentation polish rather than part of the visualization contract.
**Lesson:** encoded data without an in-view explanation is not useful information design.
**VETO:** any PRISM view using Color, Size, Grouping, or aggregation must expose its active encoding in-view.
**Replacement:** dynamic legends tied to active dimensions; labels/counts where aggregation occurs.

## G14 · Controls without actual filtering
**Origin:** PRISM Turn 01 pre-base owner test.
**Observed failure:** controls existed but there was no useful visible filtering mechanism.
**Root cause:** the foundation shell reserved filter state but did not expose operational filters.
**Lesson:** filter state is not a feature until the user can see and change the population.
**VETO:** do not hand off a data-view stage with merely reserved filter state.
**Replacement:** visible Subject / Region / Sentiment chips with All state; one shared filter universe across Explore/Map/Feed.

## G15 · Box collection mislabeled as treemap
**Origin:** PRISM Turn 01 pre-base owner test.
**Observed failure:** Map displayed groups/story boxes but did not encode hierarchy/value by occupied area, so it was not a treemap.
**Root cause:** pre-base used a structural placeholder to prove shared event rendering.
**Lesson:** a visualization name carries a behavioral/data-encoding contract.
**VETO:** do not call a box/list/grid a treemap.
**Replacement:** group rectangles and nested event rectangles must consume area according to explicit selected weights.

## G16 · Reader underlap
**Origin:** PRISM Turn 01 pre-base owner test.
**Observed failure:** Map content could extend beneath the reading pane.
**Root cause:** reader was an overlay without desktop surface reflow.
**Lesson:** event inspection must not make the visualization beneath it unreadable.
**VETO:** desktop readers may not permanently overlay/underlap active information surfaces.
**Replacement:** dedicated reader column on desktop; bottom overlay is acceptable on constrained mobile.

---

# RELEASE TEST RECORDS

## T01-PREBASE · Foundation accepted with presentation findings
**Stage:** 01·pre-base
**Artifact:** `prism/prism-turn01-pre-base.html`
**Commit:** `e5ae4beba3babb6297d63234f19519c28c68894a`
**Owner test date:** 2026-08-31
**Result:** **FOUNDATION PASSED; NOT A VALUE/PRESENTATION GATE.**

**Proven by owner:** basics work; shell/tab/state/data/presentation-layer connectivity is sufficient to advance.

**Findings carried to 01·base:** no legend; no useful filtering; Map was not a real treemap; Map underlapped reader; overall pre-base demonstrated acquisition/presentation connectivity more than end-user value.

**Recovery/forward baseline:** the exact pre-base commit above remains frozen. Corrections are implemented in the next governed stage `prism-turn01-base.html`, not patched into pre-base.