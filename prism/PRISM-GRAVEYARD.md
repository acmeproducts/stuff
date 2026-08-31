<!-- PRISM-GRAVEYARD v1.3.0 -->
# PRISM GRAVEYARD v1.3.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM. This file is mandatory build input.

---
## G0 · GOVERNANCE RULE
Every materially failed or constrained release records turn/stage/release, exact commit/artifact, date, observed failure, root cause if known, architectural lesson, explicit veto, and recovery baseline. Do not patch forward from a graveyarded implementation.

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
**VETO:** any PRISM view using Color, Size, Grouping, or aggregation must expose its active encoding in-view.

## G14 · Controls without actual filtering
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** do not hand off a data-view stage with merely reserved filter state.

## G15 · Box collection mislabeled as treemap
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** do not call a box/list/grid a treemap.

## G16 · Reader underlap
**Origin:** PRISM Turn 01 pre-base owner test.
**VETO:** desktop readers may not permanently overlay/underlap active information surfaces.

## G17 · Per-tab control bars
**Origin:** PRISM Turn 01 base owner test, commit `446317e3de21cbbb867a4682dda627b5e22a551f`.
**Observed failure:** Explore and Map exposed separate control sets, making the application feel like disconnected tools.
**VETO:** PRISM may have only one global analytical control/filter ribbon.

## G18 · Abstract dots as final Explore objects
**Origin:** PRISM Turn 01 base owner test.
**VETO:** Explore may not ship as unlabeled abstract dots. Event objects must be information cards/tiles.

## G19 · Hand-rolled PRISM treemap
**Origin:** PRISM Turn 01 base owner test.
**Observed failure:** custom strip/area layout was visually broken and did not achieve the proven NewsMap model.
**VETO:** do not continue the custom PRISM treemap algorithm.
**Replacement:** library-backed NewsMap-style implementation.

## G20 · AI deferred behind visualization polish
**Origin:** PRISM Turn 01 base owner test.
**VETO:** AI POV is in the integrated pre-ship scope.

## G21 · Independent filter catalog disconnected from selected dimensions
**Origin:** PRISM Turn 01 pre-ship R2 owner test.
**Artifact:** `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06`.
**Observed failure:** the filter tray exposed fields that were not selected as analytical dimensions, including Source/Tier, making filters feel like an unrelated control system. The first correction then incorrectly exempted quantitative Size dimensions from the filter contract.
**Root cause:** filter generation was modeled as a catalog of possible facets rather than as the direct projection of active Group/Color/Size dimensions.
**VETO:** no standalone analytical filter catalog. Every active selectable dimension must have a corresponding filter; no inactive dimension may appear or continue constraining the dataset invisibly.
**Replacement:** R3 derives `unique(Group, Color, Size, …)` and renders exactly one field-appropriate filter for each active dimension: chips for categorical dimensions, bounded range controls for quantitative dimensions.
**Recovery baseline:** preserve R2 shell, Map, rotatable clustered sphere, AI Markdown/link behavior, source management, evidence management, and Library.

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

## T01-PRESHIP-R1 · Superseded
**Artifact:** `prism/prism-turn01-pre-ship.html`
**Commit:** `55484b815bddf81c31051149fc02e176b8df50da`
**Result:** superseded by R2 shell/interaction correction.

## T01-PRESHIP-R2 · Baseline with filter-model defect
**Artifact:** `prism/prism-turn01-pre-ship-r2.html`
**Commit:** `ab33490ce3395017af94e6b51ad606476c4e7d06`
**Result:** **PRESERVE AS RECOVERY BASELINE, DO NOT PRESERVE FILTER CATALOG MODEL.**

**Accepted forward:** collapsible left rail, central work surface, collapsible right context, ECharts Map, rotatable clustered sphere with wheel/pinch zoom, Markdown/link-safe AI, source manager, evidence deselection, full Library.

**Rejected:** filter catalog independent from selected dimensions; categorical-only interpretation of the dimension/filter rule.