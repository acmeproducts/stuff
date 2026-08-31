<!-- PRISM-GRAVEYARD v1.4.0 -->
# PRISM GRAVEYARD v1.4.0

**Purpose:** release test results, rejected approaches, root causes, and non-repeatable failures for PRISM. This file is mandatory build input.

---
## G0 · GOVERNANCE RULE
Every materially failed or constrained release records turn/stage/release, exact commit/artifact, date, observed failure, root cause if known, architectural lesson, explicit veto, and recovery baseline. Do not patch forward from a graveyarded implementation.

## G1 · Browser-side publisher fan-out as normal startup
**VETO:** PRISM normal startup must never fan out across publisher RSS feeds. Replacement: collector/cache → same-origin fetch → IndexedDB.

## G2 · Article/headline as master visualization object
**VETO:** raw articles may not be the primary shared object. Replacement: Event → Coverage → Source Article.

## G3 · Separate state universes per visualization
**VETO:** Map, Explore and Feed may not own independent canonical state.

## G4 · Treemap-only identity
**VETO:** PRISM may not collapse into a treemap-only product.

## G5 · Sphere-only identity
**VETO:** PRISM may not force all discovery/reading through a sphere.

## G6 · AI as isolated chatbot
**VETO:** no detached generic chat without structured event scope/provenance.

## G7 · Provider/model controls only in Settings
**VETO:** provider/model choice cannot be Settings-only.

## G8 · Unverified provider/model use
**VETO:** populated fields do not equal usable configuration; exact model must pass inference validation.

## G9 · Disposable AI results
**VETO:** AI analyses cannot be transient-only history; save durable Analysis objects.

## G10 · localStorage analysis library
**VETO:** IndexedDB is the primary analysis store.

## G11 · Destructive library import
**VETO:** import validates + merges; never wholesale replace by default.

## G12 · Patching legacy prototypes into PRISM
**VETO:** frozen references are design/behavior sources, not patch targets.

## G13 · Unexplained visual encoding
**VETO:** active encodings must explain themselves.

## G14 · Controls without actual filtering
**VETO:** no reserved/nonfunctional filter controls at owner handoff.

## G15 · Box collection mislabeled as treemap
**VETO:** do not call a generic grid a treemap.

## G16 · Reader underlap
**VETO:** desktop reader/context must resize rather than underlap active information surfaces.

## G17 · Per-tab control bars
**Origin:** Turn 01 base.
**VETO:** one global analytical control/filter ribbon.

## G18 · Abstract dots as final Explore objects
**VETO:** Explore objects need readable content cues.

## G19 · Hand-rolled PRISM treemap
**VETO:** use library-backed NewsMap-style proportional layout.

## G20 · AI deferred behind visualization polish
**VETO:** AI POV remains integrated pre-ship scope.

## G21 · Independent filter catalog disconnected from selected dimensions
**Origin:** pre-ship R2.
**Artifact:** `prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06`.
**Observed:** filter tray exposed unselected fields; first correction also exempted quantitative Size dimensions.
**Root cause:** filters modeled as a facet catalog rather than a projection of active dimensions.
**VETO:** every active dimension gets one field-appropriate filter; no inactive filter survives invisibly.
**Recovery:** preserve R2 shell, AI, source management and Library.

## G22 · Dense globe/sphere Explore and duplicate inert legend
**Origin:** pre-ship R3 owner test.
**Artifact:** `prism/prism-turn01-pre-ship-r3.html` @ `807656e7e14c4b8503b3b7c88b83271967f64692`.
**Observed:** hundreds of overlapping cards packed into a spherical projection made Explore visually unreadable and operationally unusable. The screenshot showed cluster labels buried beneath cards, little useful spatial comparison, and a large amount of visual collision. A separate floating Color legend duplicated information that should already be expressed through the colored filter chips. Importance was exposed as an arbitrary numeric slider rather than an interpretable categorical comparison like Tier.
**Root cause:** the sphere was treated as the product identity rather than asking whether the geometry helped answer comparative questions. The rendering had only one meaningful grouping axis, so density became pile-up rather than insight. Encoding explanation was split between filters and a redundant legend.
**VETO:** do not continue the dense spherical-card packing architecture. Do not render a duplicate floating legend when filter chips can be the interactive legend. Do not expose Importance only as an opaque continuous slider.
**Replacement:** R4 dimensional Explore with explicit X and Y analytical dimensions, Z/Size encoding, visible X×Y clusters, Spatial + Grid modes, pan/rotation/zoom for inspection, and Importance buckets (Critical / High / Medium / Low). LumaSphere is a density/content reference, not a requirement to preserve a sphere.
**Recovery baseline:** preserve R2 shell/AI/Library/source architecture and R3's correct dimension→filter derivation concept, but replace Explore geometry and filter/legend presentation.

---
# RELEASE TEST RECORDS

## T01-PREBASE
`prism/prism-turn01-pre-base.html` @ `e5ae4beba3babb6297d63234f19519c28c68894a` — foundation passed.

## T01-BASE
`prism/prism-turn01-base.html` @ `446317e3de21cbbb867a4682dda627b5e22a551f` — rejected UI architecture.

## T01-PRESHIP-R1
`prism/prism-turn01-pre-ship.html` @ `55484b815bddf81c31051149fc02e176b8df50da` — superseded.

## T01-PRESHIP-R2
`prism/prism-turn01-pre-ship-r2.html` @ `ab33490ce3395017af94e6b51ad606476c4e7d06` — recovery baseline for shell / AI / Library / source management; filter catalog rejected.

## T01-PRESHIP-R3
`prism/prism-turn01-pre-ship-r3.html` @ `807656e7e14c4b8503b3b7c88b83271967f64692` — dimension/filter direction useful; Explore globe and duplicate legend rejected.
