<!-- PRISM-GRAVEYARD v2.7.0 -->
# PRISM GRAVEYARD v2.7.0

## Governance
Rejected architectures are not patched forward. Rollback means returning to an identified existing repository artifact/commit. Do not synthesize a replacement and call it a rollback.

## Standing vetoes
- no browser publisher fan-out on startup;
- no article-as-master-object; Event→Coverage→Source Article is canonical;
- no separate state universes per visualization;
- no isolated generic AI chat;
- no unverified provider/model use;
- no disposable/localStorage-only analysis library;
- no destructive library import;
- no patching legacy prototypes into PRISM;
- no unexplained visual encoding;
- no controls without actual filtering;
- no source-add control that saves configuration without ingesting or truthfully failing;
- no reader underlap;
- no per-tab analytical control systems;
- no anonymous-dot Explore objects;
- no hand-rolled treemap;
- no filter catalog disconnected from selected dimensions;
- no rollback that removes unrelated accepted functionality;
- no Library surface that inherits or persists visualization dimensions/filters;
- no Library continuation that returns the user to the event reader or global AI drawer;
- no unlinked AI research leads or paywalled AI references other than WSJ;
- **no synthesized rollback substitute when an exact prior repository version exists.**

## G22 · Corpus-wide sphere/card cloud
**Origin:** R3 Explore.
**Observed:** hundreds of event cards overlap inside a globe-like boundary.
**VETO:** do not preserve the R3 Explore visualization as the future Explore design.
**Important:** this veto applies to the Explore visualization only. The exact R3 application remains the recovery baseline because its integrated non-Explore functionality is the required starting point.

## G23 · Giant perspective X×Y card matrix
**Origin:** R4 Explore @ `7988e0f397152afc06f3ae57009682c31fb2fd86`.
**VETO:** rejected Explore descendant; not a rollback target.

## G24 · Separate legend duplicating filter semantics
**VETO:** no inert duplicate legend. Color filter chips carry visual colors and serve as filter + legend.

## G25 · Raw Importance range control
**VETO:** Importance needs governed buckets when presented categorically.

## G26 · R5 wall-of-cluster-cards / false cluster abstraction
**Origin:** R5 Explore gate @ `2439040d8e8764e86bc254a17c9247961faa9c63`.
**VETO:** rejected Explore descendant; not a rollback target.

## G27 · Turn 01 Explore patch spiral
**Observed:** R3 → R4 → R5 changed Explore geometry repeatedly while destabilizing product-level behavior.
**VETO:** do not continue patching those rejected Explore implementations.

## G28 · Over-rollback / application amputation
**Origin:** first Turn 02 pre-base attempt @ `cc479854b86b6227a0ccd0976b3edcf6e9fd2495`.
**Observed:** Sources, provider/model configuration, AI POV and Analysis Library were removed along with Explore.
**VETO:** a visualization rollback may not amputate established application functionality.

## G29 · Synthesized rollback substitute
**Origin:** Turn 02 pre-base reconstruction, including later restoration attempt @ `30289a0482aacd2dcc276958a4b1f1e9cb3c8b93`.
**Observed:** instead of restoring a prior repository version, a new approximation was constructed and presented as the starting point. Even where features were re-added, this was not the exact previously tested application state and therefore violated the rollback process.
**Root cause:** rollback was interpreted as reconstructing a desired feature set rather than selecting the exact historical artifact.
**VETO:** never manufacture a new rollback baseline when the requested historical version still exists in the repository.
**Replacement:** exact `prism/prism-turn01-pre-ship-r3.html` at original application commit `807656e7e14c4b8503b3b7c88b83271967f64692` is the active rollback baseline.

## G30 · Library as a visualization-state replay/list
**Origin:** R6 Library presentation.
**Observed:** Library remained a flat export/import list and reopened saved work in the global AI drawer. That model blurred saved research with Map/Explore state and required leaving Library to continue the conversation.
**VETO:** Library may not inherit persistent Group/Color/Size/filter controls, reopen saved work in the event reader/global AI drawer, or require returning to another surface to read or continue a saved Analysis.
**Replacement:** a Library-local left rail with Omnisearch and Analysis cards plus an independent analysis/conversation work surface with a persistent bottom composer.

## G31 · Metadata-only custom source
**Origin:** R7 Config → Sources → Add source.
**Observed:** the control saved name, URL and type to local configuration and displayed “Source configuration added,” but the application booted exclusively from the fixed repository cache. The custom feed was never fetched, parsed, normalized or merged, so it could not appear in active Sources or contribute events.
**Root cause:** source configuration was mistaken for source acquisition, and the UI confirmed the former without disclosing the absence of the latter at the action point.
**VETO:** a source-add action may not claim success unless the source is immediately represented with truthful ingestion status. Metadata-only source controls are prohibited.
**Replacement:** fetch on add and startup; normalize RSS/Atom/JSON articles into the shared corpus; persist successful custom articles; expose ready/cached/error status and counts; provide source-local retry and removal.

## G32 · Runtime-derived default source inventory
**Origin:** R8 source persistence and Sources inventory.
**Observed:** the nine established repository sources were inferred only from loaded articles/events. A persisted state that disabled all defaults could therefore make the Source filter appear empty, and the R8 source-article store required upgrading the shared PRISM IndexedDB from v3 to v4. An older open tab could block that upgrade and strand startup before any source inventory rendered.
**Root cause:** permanent product defaults were treated as an incidental property of successfully loaded runtime data, and a source-cache implementation detail was coupled to the shared application database schema.
**VETO:** default source identity may not depend on cache success, current event coverage or a shared-database version upgrade. Persisted filter state may disable defaults but may not remove their inventory identity.
**Replacement:** explicit governed default inventory; one-time repair of the all-hidden legacy state; visible Restore defaults control; isolated source-article database with legacy migration.

## G33 · Expanding inline filter ribbon and scroll-hidden AI actions
**Origin:** R11 analytical ribbon and AI panel presentation.

**Observed:** every value for every active dimension rendered persistently in Row 2. Higher-cardinality dimensions made the ribbon grow horizontally and forced the user to scroll to reach AI POV. In the AI panel, processing feedback and Add to Library lived inside the same scrolling body as evidence, prompt and output, so neither state nor save action was reliably visible.

**VETO:** do not persistently enumerate every dimension value in the ribbon; do not place AI POV inside filter overflow; do not make the user scroll to confirm that AI is processing or to save a completed analysis.

**Replacement:** fixed Row 1 dimensions + AI POV + item count; compact Row 2 filter summaries; chip-only adaptive selector; fixed AI status header and fixed action footer with one-click Add to Library.

## G34 · Role-prefixed selectors, disappearing filter slots and information-sparse Map tiles
**Origin:** R12 mobile owner testing.

**Observed:** Row 1 repeated `Group ·`, `Color ·` and `Size ·` inside every selector option, so the role prefix consumed the visible mobile width while the actual dimension was truncated. When two roles selected the same underlying dimension, deduplication collapsed Row 2 from three controls to two. The 120 / 58 / 26 / 11 treemap scale produced giant colored tiles with substantial unused area, while labels remained small and the default light tooltip obscured a large part of the Map.

**VETO:** do not repeat a selector's role inside each visible option; do not remove a Group / Color / Size filter slot because another role uses the same dimension; do not use an extreme area scale with tiny labels or an oversized default light tooltip.

**Replacement:** dimension-name-only selector values; exactly three role-aligned Row 2 controls with duplicate dimensions mirroring one shared filter state; bounded 64 / 44 / 29 / 19 sizing, larger wrapped progressive labels and a compact dark viewport-confined tooltip.

## Active recovery baseline
**Exact artifact:** `prism/prism-turn01-pre-ship-r3.html`
**Exact original application commit:** `807656e7e14c4b8503b3b7c88b83271967f64692`

Preserve its integrated Sources, dimensions/filters, AI POV/provider validation, Analysis Library, Map, Feed, shell and selection behavior. Replace only the rejected Explore visualization in the next governed descendant unless the owner explicitly rejects another subsystem.
