<!-- PRISM-PLAN v5.1.0 -->
# PRISM MASTER PLAN v5.1.0

## Governing objective
Complete PRISM R27 as one clean standalone release. R27 remains the authorized release. No R28.

## Baseline and ancestry
- Canonical historical baseline: `prism/prism-turn01-pre-ship.html`, R11 blob `5d91e005940d632b74d6dd59a9aa0ae645c40433`.
- Clean standalone donor lineage: R18/R14 blob `56ba6eb63bf27073399c471fde44164e16c3990f`.
- Standalone implementation lineage remains R26/R27 only; rejected R27 attempts are evidence, not implementation ancestors.
- NewsMap.JS (`https://newsmap.ijmacd.com/?edition=US_en`) is the explicit Map visual/geometry reference. PRISM implements the behavior directly in its own standalone source; it does not import the reference architecture.

## Map contract — corrected 2026-09-06
The Map is not a fixed-row lattice. It must visually behave like a dense NewsMap surface.
1. Use squarified variable-area article rectangles, not long 1:5 slivers or repetitive fixed rows.
2. Tile geometry should strongly prefer near-square rectangles; approximately 4:5 through modestly wider/taller shapes are acceptable. Extreme strips are not.
3. Preserve five visible size tiers: X-Large, Large, Medium, Small, X-Small.
4. Size is driven by the active Size dimension and continuous weight; the five classes control typography/padding, not a return to a fixed-grid layout.
5. Headline typography must be materially larger than prior R27 attempts and scale by tile area. Large tiles should read like headlines, not labels.
6. Use compact Arial/Helvetica, strong weight, tight line height, dark thin borders, muted categorical color families, dense packing, and clipping only when a genuinely small tile cannot fit more text.
7. Group headings, group focus, × reset, tile selection, Group/Color/Size dimensions, and the three filter-summary controls remain intact.
8. The filter chooser opens directly below the tapped summary control and is capped to the remaining viewport; no forced bottom sheet.

## Library product contract — mandatory acceptance surface
Library is a complete two-surface workspace and may never degrade to a blank page.
1. The Library has a persistent left Analysis rail and a right Analysis workspace.
2. The Analysis rail is independently scrollable and explicitly collapsible/expandable. Collapsing it must expand the right workspace; it must never destroy the rail state or Analysis selection.
3. Each rail card is exactly title + × delete; `Created <date/time> | Updated <date/time>`; `Status: Processing|Ready|Failed`.
4. The right workspace fills all remaining application height and is a true three-row grid: fixed Analysis header / `minmax(0,1fr)` independently scrolling complete Analysis transcript / pinned bottom chat compose strip.
5. The compose strip is sticky/pinned to the bottom of the right workspace and contains a paperclip attachment button, prompt textarea, and send button.
6. The compose prompt is direction for the next Analysis turn. Send executes current-web research with the configured provider/model, appends the response to the same Analysis ID, and updates `updatedAt`.
7. Attachments are appended to the same Analysis record/context and appear chronologically in the transcript.
8. The transcript retains initial prompt, every AI response, all follow-up prompts/responses, uploaded context, and timestamps.
9. Library-card Omnisearch and selected-Analysis Omnisearch remain separate. Selected-Analysis search supports positive terms, `-negative`, `*wildcard*`, and `?`.
10. On every Library entry and boot, PRISM must reread the authoritative `prism/analyses` store and merge readable historical rows from `prism-analysis-index-v1/analyses`. A one-shot migration marker may not hide historical records.
11. If either store fails to read, the Library must render a visible diagnostic/error state and retain any successfully read rows; it must not silently render blank.

## Single authoritative Analysis model
- Durable primary authority: IndexedDB database `prism`, store `analyses`, key path `analysisId`.
- One normalizer, one durable write path, one authoritative reread path.
- Historical Library data may be read/merged for compatibility, but new/updated records are written only to `prism/analyses`.
- No destructive store replacement or silent historical deletion.

## Required Analysis lifecycle
`Run analysis` executes exactly this lifecycle:
1. Validate provider, prompt, and selected evidence.
2. Create durable Analysis ID.
3. Persist the record immediately as `status:"processing"` with timestamps and frozen evidence.
4. Reread the exact Analysis ID from IndexedDB.
5. Close AI POV and enter Library through the single view controller.
6. Select/render that Processing card and the right workspace.
7. Yield browser paint/event loop.
8. Begin provider/network work asynchronously.
9. Success updates the same ID to `ready`, appends Markdown response, rereads, and rerenders.
10. Failure updates the same ID to `failed` with error detail, rereads, and rerenders; the card remains.

## Diagnostics / observability contract
R27 must maintain a persistent browser-local event/error log sufficient to isolate every lifecycle failure without guessing. At minimum log:
- boot start/wire/complete/failure;
- IndexedDB open/upgrade/read/write/verification failures;
- primary and legacy Library row counts and merged counts;
- Library entry/render/select/delete/rail collapse/compose/attachment/send;
- Analysis Processing → provider request → Ready/Failed transitions and timings;
- Map render count/group count/geometry mode/selection/filter changes;
- source/cache fetch starts/completions/failures;
- `window.error` and unhandled promise rejections.
Diagnostics must be visible and copyable from Config and remain customer-safe: internal repository workflow failures are not surfaced as customer product status.

## Deterministic pre-publication gates
A candidate cannot be published until all applicable gates pass:
1. Complete HTML structure and embedded JavaScript syntax parse.
2. Exactly one `runAI`, one Analysis persistence path, and one view controller.
3. No iframe, wrapper, runtime baseline fetch, sidecar patch, injected overlay, Worker, alternate state machine, or destructive persistence migration.
4. Map uses squarified geometry and all five size classes; deterministic geometry test must reject extreme aspect-ratio slivers (target maximum ≤5:1 under the qualification fixture, with normal tiles substantially closer to square).
5. Headline font qualification proves X-Large/Large tiers begin materially larger than prior label-sized rendering and shrink only as required to fit.
6. Library DOM qualification proves left rail exists, rail collapse/expand control exists, right workspace exists, transcript is independently scrollable, compose is bottom-pinned, paperclip exists, send exists.
7. Library data qualification injects both a primary `prism/analyses` row and a historical `prism-analysis-index-v1/analyses` row; after reread both cards must be present and selectable.
8. Selecting an Analysis must make the compose strip visible without removing the left rail.
9. Processing write/reread/Library render occurs before provider invocation; same ID must later render Ready or Failed.
10. Follow-up current-web research and attachment operations persist on the same Analysis ID.
11. Diagnostics must contain boot, DB, Library-load, Map-render, and lifecycle checkpoints.

## Browser qualification and environmental fallback
Owner-device browser acceptance remains decisive. Before handoff, execute browser qualification when the environment permits navigation. If the execution environment blocks browser navigation by administrator policy, do not pretend a browser test ran: run embedded-JS syntax, deterministic squarify math, structural Library contract, persistence-path/static lifecycle gates, publish, verify the exact deployed artifact, and rely on the owner-device gate for final browser behavior.

## Publication / concurrency gate
Immediately before publication:
1. fetch current `main` and current SHAs of every target file;
2. preserve unrelated repository work;
3. update this Plan and the Graveyard before/with the R27 source;
4. publish on top of then-current `main` without force;
5. refetch `main` after write to detect races;
6. verify the exact published R27 blob/build marker and Pages deployment before returning the cache-busted test URL.

## Owner acceptance sequence
Primary gate:
`Library opens with historical cards → left rail collapses/expands → select Analysis → full transcript scrolls → sticky compose remains visible → attach works → prompt + Send performs current-web research on same Analysis ID`.
Map gate:
`NewsMap-like dense squarified rectangles → five size tiers → large readable headline typography → group focus/× and filters still work`.
AI creation gate:
`Run analysis → Library active → Processing card visible+selected → provider runs → same card Ready or Failed`.
