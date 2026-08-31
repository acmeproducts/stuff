<!-- PRISM-GRAVEYARD v1.4.0 -->
# PRISM GRAVEYARD v1.4.0

## Governance
Rejected architectures are not patched forward. Preserve accepted subsystems and replace only the failed architecture.

## Standing vetoes
- no browser publisher fan-out on startup;
- no article-as-master-object; Event→Coverage→Source Article is canonical;
- no separate state universes per visualization;
- no sphere-only or treemap-only identity;
- no isolated generic AI chat;
- no unverified provider/model use;
- no disposable/localStorage-only analysis library;
- no destructive library import;
- no patching legacy prototypes into PRISM;
- no unexplained visual encoding;
- no controls without actual filtering;
- no reader underlap;
- no per-tab analytical control systems;
- no anonymous-dot Explore objects;
- no hand-rolled treemap;
- no filter catalog disconnected from selected dimensions.

## G22 · Corpus-wide sphere/card cloud
**Origin:** R3 Explore.
**Observed:** hundreds of event cards overlap inside a globe-like boundary. Rotation/zoom does not solve collision or yield a macro analytical read.
**VETO:** do not render the entire filtered corpus as individually readable cards in one sphere.
**Replacement:** macro aggregation first; individual cards only after selecting a cluster.

## G23 · Giant perspective X×Y card matrix
**Origin:** R4 Explore, `prism-turn01-pre-ship-r4.html` @ `7988e0f397152afc06f3ae57009682c31fb2fd86`.
**Observed:** X×Y was implemented as a huge grid where each intersection immediately contained packed story cards. This is still a detail view masquerading as a macro view; perspective rotation adds complexity without analytical value.
**Root cause:** the implementation skipped the aggregation boundary between macro matrix and drill-in.
**VETO:** macro X×Y cells may not directly pack the full story set. A cell is one cluster summary.
**Replacement:** flat 2D X×Y matrix → one summarized cluster per intersection → tap cluster → immersive Luma-like rotatable/zoomable tile field for that intersection only → × back to the preserved macro matrix state.

## G24 · Separate legend duplicating filter semantics
**Observed:** independent Color legend duplicated information already represented by filter chips.
**VETO:** no inert duplicate legend. When a field is Color, its filter chips carry the same visual colors and therefore serve as both filter and legend.

## G25 · Raw Importance range control
**Observed:** Importance 0–100 slider is technically accurate but inconsistent with the categorical scanning model used for Tier and Corroboration.
**VETO:** do not expose Importance as only an undifferentiated range control in Explore.
**Replacement:** Critical 80–100 / High 60–79 / Medium 40–59 / Low 0–39 buckets for filtering and cluster summary.

## Recovery baseline
Preserve non-Explore R3/R4 behavior: rail/work/right-panel shell, Map, Feed, shared state, source management, AI POV/provider validation, Markdown/link handling, Library and selection semantics. Replace Explore architecture only.
