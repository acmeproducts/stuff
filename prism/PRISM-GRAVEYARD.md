<!-- PRISM-GRAVEYARD v1.2.0 -->
# PRISM GRAVEYARD v1.2.0

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
**VETO:** any PRISM view using Color, Size, Grouping, or aggregation must expose its active encoding in-view.

## G14 · Controls without actual filtering
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** do not hand off a data-view stage with merely reserved filter state.
**Replacement:** visible operational filters sharing one universe.

## G15 · Box collection mislabeled as treemap
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** do not call a box/list/grid a treemap.

## G16 · Reader underlap
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** desktop readers may not permanently overlay/underlap active information surfaces.

## G17 · Per-tab control bars
**Origin:** PRISM Turn 01 base owner test, commit `446317e3de21cbbb867a4682dda627b5e22a551f`.
**Observed failure:** Explore and Map exposed separate control sets, making the application feel like disconnected tools and creating conflicting state affordances.
**Root cause:** implementation put visualization controls inside each view instead of honoring the one-information-state contract at the shell level.
**VETO:** PRISM may have only one global control/filter ribbon for the shared information universe. View-specific affordances may appear only when intrinsically required and must not duplicate global dimensions/filters.

## G18 · Abstract dots as final Explore objects
**Origin:** PRISM Turn 01 base owner test.
**Observed failure:** even with a legend, colored dots do not communicate enough content to make the sphere useful; zoom was also omitted.
**VETO:** Explore may not ship as unlabeled abstract dots. Event objects must be information cards/tiles with readable content cues, while color remains a secondary encoding. Sphere must support explicit zoom in/out plus direct manipulation.

## G19 · Hand-rolled PRISM treemap
**Origin:** PRISM Turn 01 base owner test.
**Observed failure:** the custom strip/area layout was visually broken and did not achieve the proven NewsMap interaction/readability model.
**Root cause:** unnecessary custom chart layout despite a suitable open-source reference implementation.
**VETO:** do not continue the custom PRISM treemap algorithm.
**Replacement:** adopt the NewsMap.JS layout/interaction model from `IJMacD/newsmap-js` as the reference implementation, adapted to PRISM canonical events and shared controls. Preserve its license/attribution requirements when code is incorporated.

## G20 · AI deferred behind visualization polish
**Origin:** PRISM Turn 01 base owner test.
**Observed failure:** the planned stage sequence deferred the feature that turns multi-story selection into contextual intelligence.
**VETO:** AI POV is now in scope for the next integrated stage. Do not treat it as a later cosmetic add-on.
**Replacement:** multi-select events → contextual AI compose with suggested and ad-hoc questions → provider/model selectable at compose → saved Analysis → continuable research thread.

---

# RELEASE TEST RECORDS

## T01-PREBASE · Foundation accepted with presentation findings
**Stage:** 01·pre-base
**Artifact:** `prism/prism-turn01-pre-base.html`
**Commit:** `e5ae4beba3babb6297d63234f19519c28c68894a`
**Owner test date:** 2026-08-31
**Result:** **FOUNDATION PASSED; NOT A VALUE/PRESENTATION GATE.**

## T01-BASE · Rejected visualization architecture
**Stage:** 01·base
**Artifact:** `prism/prism-turn01-base.html`
**Commit:** `446317e3de21cbbb867a4682dda627b5e22a551f`
**Owner test date:** 2026-08-31
**Result:** **REJECTED AS FORWARD UI BASELINE.**

**Observed:** operational filters and legend improved the foundation, but duplicated per-tab controls violated the unified-state product model; Explore remained abstract dots without explicit zoom; the custom treemap was broken/unacceptable; AI POV/provider-model workflow was still absent.

**Recovery baseline:** retain the data acquisition, canonical-event, IndexedDB, shared-state, reader-column and filtering learnings from base, but do not patch its visualization architecture. Build `01·pre-ship` from the governed contract with Map/NewsMap first, one global ribbon, multi-select, AI POV, then derive Explore from the same event/filter state.