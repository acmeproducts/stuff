<!-- PRISM-GRAVEYARD v1.3.0 -->
# PRISM GRAVEYARD v1.3.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM. This file is mandatory build input.

---
## G0 · GOVERNANCE RULE
Every materially failed or constrained release records turn/stage/release, exact commit/artifact, date, observed failure, root cause if known, architectural lesson, explicit veto, and recovery baseline. Do not patch forward from a graveyarded implementation.

## G1 · Browser-side publisher fan-out as normal startup
**VETO:** normal startup must never fan out across publisher RSS feeds. Use collector/cache/IndexedDB.

## G2 · Article/headline as master visualization object
**VETO:** raw articles may not be PRISM's primary shared object. Use Event → Coverage → Source Article.

## G3 · Separate state universes per visualization
**VETO:** Explore, Map, Feed may not own independent canonical state.

## G4 · Treemap-only identity
**VETO:** PRISM may not collapse into a treemap-only product.

## G5 · Sphere-only identity
**VETO:** PRISM may not force all consumption through the sphere.

## G6 · AI as isolated chatbot
**VETO:** no detached generic chat without structured event scope/provenance.

## G7 · Provider/model controls only in Settings
**VETO:** compose-time provider/model choice must remain available after Settings verification.

## G8 · Unverified provider/model use
**VETO:** populated fields do not equal usable configuration. Exact pair must pass inference ping.

## G9 · Disposable AI results
**VETO:** completed analyses cannot be transient-only chat history.

## G10 · localStorage analysis library
**VETO:** IndexedDB is the primary analysis store.

## G11 · Destructive library import
**VETO:** import merges by `analysisId`; no whole-library destructive replace.

## G12 · Patching legacy prototypes into PRISM
**VETO:** frozen references are evidence, not patch targets.

## G13 · Unexplained visual encoding
**VETO:** any Color/Size/Grouping encoding must expose an in-view legend/explanation.

## G14 · Controls without actual filtering
**VETO:** reserved filter state is not sufficient; visible operational filters required.

## G15 · Box collection mislabeled as treemap
**VETO:** do not call a box/list/grid a treemap.

## G16 · Reader underlap
**VETO:** desktop context readers/panels may not permanently overlay the information surface.

## G17 · Per-tab control bars
**VETO:** only one global control/filter ribbon for the shared information universe.

## G18 · Abstract dots as final Explore objects
**VETO:** Explore may not ship as anonymous dots; use information cards/tiles and readable cluster context.

## G19 · Hand-rolled PRISM treemap
**VETO:** do not continue the rejected custom treemap algorithm. Use proven library-backed NewsMap/treemap behavior.

## G20 · AI deferred behind visualization polish
**VETO:** multi-select → AI POV → saved/continuable Analysis is core product behavior, not a later add-on.

## G21 · Static/non-rotatable sphere
**Origin:** PRISM 01·pre-ship R1 owner test, artifact `prism/prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da`.
**Observed failure:** Explore showed clustered cards but behaved like a flat arrangement; sphere could not rotate and cluster geometry was not actually maintained as a 3D sphere interaction.
**Root cause:** cluster cards were positioned in 2D percentages around a circular background rather than projected from rotating 3D coordinates.
**VETO:** do not represent Explore as a static 2D circular cluster layout.
**Replacement:** deterministic 3D cluster/event coordinates projected through yaw/pitch rotation; drag rotation plus wheel/pinch zoom.

## G22 · Redundant Explore +/- zoom controls
**Origin:** same R1 owner test.
**Observed failure:** explicit +/- controls duplicated natural wheel/pinch interaction expected from Map and consumed chrome.
**VETO:** no +/- zoom buttons in Explore.
**Replacement:** wheel/trackpad + pinch only; show passive zoom state only if useful.

## G23 · AI Markdown displayed as plain text
**Origin:** same R1 owner test.
**Observed failure:** AI answers were rendered as raw/plain text, degrading headings, lists, research structure and readability.
**VETO:** AI result surfaces may not render Markdown as plain text.
**Replacement:** sanitized Markdown rendering with safe http(s) link handling.

## G24 · Non-navigable AI source/further-reading references
**Origin:** same R1 owner test.
**Observed failure:** references or further-reading suggestions were not guaranteed to be usable hyperlinks.
**VETO:** a navigational source/further-reading reference may not be shown as though clickable unless it contains a reliable complete http(s) URL.
**Replacement:** prompt contract requires Markdown links when known; renderer autolinks safe URLs; conceptual leads remain explicitly unlinked.

## G25 · Overlay/drawer proliferation instead of coherent shell
**Origin:** same R1 owner test.
**Observed failure:** separate Settings/AI drawers plus reader behavior did not form one coherent desktop workspace.
**VETO:** do not accumulate independent side drawers for core workflows.
**Replacement:** collapsible left navigation rail + central work surface + one collapsible right context panel that hosts Event / AI / Library / Config modes.

## G26 · Inert Library tab
**Origin:** same R1 owner test.
**Observed failure:** Library acted primarily as an export/import bucket and preview list, not a research workspace.
**VETO:** Library may not be a passive saved-output bin.
**Replacement:** searchable analysis list, full Markdown thread inspection, frozen provenance, continue research, delete, export one/all, import/merge; modeled on the Market View Gate 3 shell hierarchy.

---
# RELEASE TEST RECORDS

## T01-PREBASE · Foundation accepted
**Artifact:** `prism/prism-turn01-pre-base.html`
**Commit:** `e5ae4beba3babb6297d63234f19519c28c68894a`
**Result:** foundation passed; value/presentation findings carried forward.

## T01-BASE · Rejected visualization architecture
**Artifact:** `prism/prism-turn01-base.html`
**Commit:** `446317e3de21cbbb867a4682dda627b5e22a551f`
**Result:** rejected as forward UI baseline.

## T01-PRESHIP-R1 · Superseded after useful progress
**Artifact:** `prism/prism-turn01-pre-ship.html`
**Commit:** `55484b815bddf81c31051149fc02e176b8df50da`
**Owner test date:** 2026-08-31
**Result:** **SUPERSEDED, NOT THE FORWARD INTERACTION BASELINE.**

**What worked:** one global ribbon direction, ECharts treemap direction, source manager, dynamic filters, AI evidence selection/deselect, provider/model contract, overall convergence.

**What failed/was incomplete:** Explore lacked true rotation and used redundant +/- zoom; AI output did not render Markdown/navigation links as a research document; independent drawers did not form a coherent desktop shell; Library was too inert to support saved and continuable research.

**Recovery baseline:** retain canonical data, shared filter/selection state, source management, ECharts map, provider/model validation and AI evidence model. Replace the interaction shell and Explore projection in `01·pre-ship R2`; do not patch the rejected static-sphere/drawer architecture forward.