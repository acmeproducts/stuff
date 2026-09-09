<!-- PRISM-PLAN v6.0.8 -->
# PRISM MASTER PLAN v6.0.8

## Governing objective
Complete PRISM R27 as one clean standalone release and provide the approved standalone Library companion over the same durable Analysis records. R27 remains the authorized full-product release. No R28.

## Two-tab product architecture — 2026-09-09
- The full PRISM product has exactly two top-level navigation tabs: `Map` and `Library`. A side portal rail, a third product tab, and separate top-level Explore, Feed, AI, or Config destinations are not authorized.
- `Map` is the intelligence-discovery product surface. Its subordinate surface selector contains `NewsMap`, `Explore`, and `Feed`; these modes share the same filtered event corpus, dimensions, selection, reader, and Analysis handoff.
- `Explore` is the flat two-dimensional dimensional view inside Map, not a competing product destination. `Feed` is the linear view of the same Map corpus.
- `Library` is a first-class same-origin application page, reached by the top-level Library tab. It is the approved complete Library surface and reads/writes the same `prism/analyses` records as Map; it is not an alternate product, database, wrapper, or iframe.
- Moving from any Map mode to Library and back restores the exact prior Map mode and retains active dimensions, filters, time window, query, selection, and reader state through same-tab session state unless the owner explicitly changes them.
- Analyze and Library `＋` open the governed AI POV prompt workspace. Run persists and selects the exact Processing card before provider work; completion writes the Markdown response and generated title back to that same card, then hands off to the complete Library page with that exact card selected.
- The integrated Library retains per-Analysis parallel provider jobs and generated inline-editable titles. Consolidation may not reintroduce a global busy lock, generic permanent titles, or background selection theft.

## Approved standalone Library companion — 2026-09-08
- `prism/prism-library.html` is an owner-approved application surface, not another R27 candidate and not a replacement for Map, Explore, Feed, or AI POV.
- It contains only the persistent Analysis-card rail and the full Analysis workspace: fixed header, independently scrolling rendered Markdown transcript, and bottom-pinned attachment/prompt/Send composer.
- It opens the same-origin IndexedDB database `prism`, store `analyses`, and reuses `prism_ai_cfg_v1`. It creates no alternate Analysis database, duplicated cards, wrapper, iframe, migration sidecar, or parallel state machine.
- It rereads all primary records and readable `prism-analysis-index-v1/analyses` history on every boot/focus. The newest Analysis is selected automatically. Empty records and storage failures are rendered explicitly rather than suppressed behind a success toast or starter mode.
- Attachment and current-web follow-up operations update the selected record under the same `analysisId`; Send persists Processing before provider work and Ready/Failed afterward.
- Current-web transport is provider-native: Venice web search/citations, OpenRouter web plugin, or Anthropic web-search tool. Provider/model/key verification remains browser-local and shared with PRISM.

## Standalone Library request/response correction — 2026-09-08
- A user prompt is a chat request, never the Analysis result. Only non-empty provider-returned Markdown may render as a PRISM response or place an Analysis in Ready state.
- Each Analysis ID may have at most one unresolved provider request. The request is persisted with a unique request ID, start time, and expiry before network work begins; a second Send is blocked until the first request resolves.
- The active Send control becomes Stop. Provider work has a two-minute deadline. Stop, timeout, provider failure, page abandonment, or an expired request moves the exact unresolved turn to Failed with a visible reason; no record may spin indefinitely.
- On boot, focus, and manual refresh, an unresolved Processing record older than three minutes is recovered to Failed. Missing historical provider output is not fabricated; the failed response exposes Retry, which reruns the exact saved prompt and replaces that failed turn.
- Every completed PRISM response is a distinct chat response card. Its header contains its completion date/time plus full-response TTS, Copy, and Markdown Download controls.
- The Analysis header contains TTS, Copy, and Markdown Download for the complete Analysis. Entire-analysis TTS reads completed PRISM responses only, never the user's prompts or failure text.

## Parallel Analysis and Listen-mode contract — 2026-09-09
- Provider work is concurrent across distinct Analysis IDs. The Library owns an in-memory job registry keyed by `analysisId`; every job has its own request ID, abort controller, timeout, and failure path. There is no global busy lock or shared controller.
- The one-unresolved-request rule applies inside one Analysis only. Analysis A may remain Processing while the owner selects Analysis B and starts, stops, retries, reads, or listens to B. Stopping one Analysis must not abort any other job.
- Background persistence must never steal the selected card. Concurrent rereads are coalesced and rerun when necessary so simultaneous job completions cannot drop a state update.
- The bottom workspace has two explicit, mutually exclusive modes: Chat and Listen. Chat contains attachment, prompt, and Send/Stop. Listen occupies the same dock and contains Previous response, Previous row, Play/Pause, Next row, and Next response.
- A response is one chat. A row is one semantic Markdown readout unit: heading, paragraph, list item, blockquote, code block, or complete table row. Long rows may be split only to keep device TTS reliable.
- Previous/Next response and Previous/Next row disable at their respective boundaries. Play automatically advances through all rows and then all completed responses, providing a full-Analysis readout. Manual row or response navigation preserves playback only when it was already playing.
- Entering Chat stops TTS. Selecting another Analysis stops the prior readout and returns to Chat. No prompt, failure text, Processing label, or attachment metadata is spoken as an AI response.

## Analysis-generated and owner-editable titles — 2026-09-09
- The first completed provider response begins with one specific Markdown H1. The Library derives the card title from that completed analysis output without a second provider call; generic labels and the user's prompt are not final titles.
- Existing Ready records whose titles are still generic or equal to their stored prompt are backfilled from their first completed response. Meaningful legacy titles are preserved.
- Every rail title is an inline text field. Enter or blur commits the normalized non-empty title to the same `prism/analyses` record; Escape restores the prior value.
- A completed background request rereads the latest durable record before saving its response. A manual title edit made while research is running must survive completion and permanently outrank automatic title generation.

## R27 recovery ruling — 2026-09-08
- The reduced `R27-LIBRARY-01` artifact is rejected as a full-product replacement: Map, Explore and Feed were collapsed into placeholder cards. That ruling does not veto the separately named `prism-library.html` companion, which does not claim to be R27 or replace any R27 surface.
- R27 restarts from exact standalone R26 blob `491abbbdaa8f559387c0235e4ddb89300787c491`; every unrelated R26 surface remains present.
- The release is one coherent artifact containing validated source admission, NewsMap-grade Map, flat dimensional Explore, Feed, AI POV and the complete persistent Library. No partial Library-only handoff.

## RSS admission contract
1. A custom source is not persisted until its URL, fetch, payload type and usable entries validate.
2. New sources require HTTPS, a unique name and URL, parseable RSS/Atom or governed JSON, and at least one item with a title and HTTP(S) article link.
3. Validation returns the fetch mode, usable item count and a real sample headline. Failure remains unsaved and exposes the exact reason.
4. Source acquisition has one visible truth: successful direct/collector/relay mode or explicit failure. Cached articles may be retained only for a previously admitted source.

## Shared Map / Explore dimensional grammar
- Map and Explore consume the same filtered events, reader, selection, Group, Color and Size state.
- Map answers "what dominates now" with a dense squarified treemap. Default continuous area weight is coverage momentum: `log2(1 + independent source count) * exp(-age hours / 48)`.
- The Size selector may instead expose governed importance, corroboration or recency, but geometry always uses continuous weight; five tile tiers affect typography/information density only.
- Explore answers "how is attention distributed" on a flat 2D field: Group creates horizontal lanes, X is observation recency, Y is the selected Size value, card area is the same weight, and color is the selected Color dimension.
- No sphere, fixed-row pseudo-treemap, or separate Explore data/state model.

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
2. Exactly two top-level product tabs labeled Map and Library; Map contains one subordinate selector with NewsMap, Explore, and Feed. No side portal rail or top-level Explore/Feed control exists.
3. Map → Library → Map restores the exact prior Map mode and does not clear dimensions, filters, time window, query, or selected evidence.
4. Exactly one `runAI`, one Analysis persistence path, and one view controller.
5. No iframe, wrapper, runtime baseline fetch, sidecar patch, injected overlay, Worker, alternate state machine, or destructive persistence migration.
6. Map uses squarified geometry and all five size classes; deterministic geometry test must reject extreme aspect-ratio slivers (target maximum ≤5:1 under the qualification fixture, with normal tiles substantially closer to square).
7. Headline font qualification proves X-Large/Large tiers begin materially larger than prior label-sized rendering and shrink only as required to fit.
8. Library DOM qualification proves left rail exists, rail collapse/expand control exists, right workspace exists, transcript is independently scrollable, compose is bottom-pinned, paperclip exists, send exists.
9. Library data qualification injects both a primary `prism/analyses` row and a historical `prism-analysis-index-v1/analyses` row; after reread both cards must be present and selectable.
10. Selecting an Analysis must make the compose strip visible without removing the left rail.
11. Processing write/reread/Library render occurs before provider invocation; same ID must later render Ready or Failed.
12. Follow-up current-web research and attachment operations persist on the same Analysis ID.
13. Diagnostics must contain boot, DB, Library-load, Map-render, and lifecycle checkpoints.
14. Parallel-job qualification starts requests on two distinct Analysis IDs, proves both remain Processing concurrently, completes them in reverse order, and proves both exact IDs become Ready without changing the owner's selected card.
15. Listen-mode qualification proves Chat/Listen exclusivity, complete-response indexing, semantic table-row extraction, Play/Pause, automatic full-Analysis progression, and disabled boundary controls at the first/last response and row.
16. Title qualification proves a generic/prompt-derived title is replaced from completed response content, Enter and blur persist an inline edit, blank titles are rejected, and a manual edit made during an unresolved request survives that request's completion.

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
`Map opens → select Explore → Library opens with historical cards → generated card titles are meaningful and inline editable → Enter/blur persists the edit → left rail collapses/expands → select Analysis → full transcript scrolls → sticky compose remains visible → attach works → prompt + Send performs current-web research on same Analysis ID → Map returns to Explore with prior Map state intact`.
Map gate:
`NewsMap-like dense squarified rectangles → five size tiers → large readable headline typography → group focus/× and filters still work`.
Analysis creation gate:
`Select story → Analyze → AI POV opens with selected evidence, presets, and editable prompt → Run analysis → Processing card visible+selected with saved evidence → current-web analysis runs → same card becomes Ready with a rendered Markdown response or Failed with an explicit error → compose continues that same Analysis ID`.

## R27 recovery qualification correction
The first published recovery artifact `cda47efc8a78a02134eb17f270e3d486fe72e831` is rejected. It parsed statically but failed browser boot because the active Size dimension `attention` lacked the categorical value function required by the shared filter path. The UI stopped at `DIMS[k].value is not a function`. It also exposed contradictory `R27-RECOVERY-01` and `R27-CLEAN-02` identities. The corrected artifact must pass a real browser boot with event tiles rendered and one coherent build identity before handoff.

## R27 NewsMap refoundation
Owner review rejects a repository-cache-first Map that merely resembles NewsMap and rejects an empty Library that requires discovery of a separate AI surface before it can do anything. R27 must now:
1. load current US Google News topic feeds directly through simple compatibility routes, with repository/device content retained only as fallback;
2. preserve Google News category, position, and multi-source coverage so tile area reflects source count, feed position, and freshness;
3. use two-level squarification, full-area category groups, headline-first adaptive typography, and unobtrusive group focus;
4. keep PRISM dimensions, filters, selection, reader, and custom sources layered on that framework;
5. expose New Analysis inside Library; when nothing is selected it seeds the strongest current-view stories and opens the same governed AI POV prompt workspace used by Analyze;
6. reread compatible saved analyses without presenting an empty surface as a completed Library.

## Owner correction: Map density and immediate Analysis ownership
The owner screenshot rejects multicolored micro-tile mosaics as a visual aberration. The accepted correction is category-first: Subject is the default Group and Color, mobile Map density is capped per category, weight extremes are compressed for layout, and rectangles too small to communicate are not rendered.

R13 is the minimum Library interaction yardstick: persistent left Analysis rail, right research workspace, readable master-detail hierarchy, and direct access to the saved record. R27 adds the missing compose strip but must not regress that layout.

Selecting stories and pressing Analyze must open the R13-governed AI POV workspace; it must never bypass or replace that workspace with an automatic prompt. The workspace visibly contains selected context and source links, Clear all, a prompt textarea, the Throughline, Frequency, Recency / precedent, and Missing context presets, and Run analysis. Run analysis validates the provider, entered or preset prompt, and evidence; then it creates and persists a Processing card immediately, opens Library on that card, and writes the Markdown response into the same card. The compose strip then continues that Analysis ID. Without a verified provider, no empty record is created; Config opens with an explicit validation requirement.

## R27 prompt-workspace restoration
`R27-NEWSMAP-06` retained the AI POV markup but made it unreachable by wiring Analyze directly to an automatic `beginSelectedAnalysis()` path. That contradicted the owner-approved R13 interaction contract and made the missing prompt/preset surface appear deleted. R27 must have one visible creation path: Analyze and Library ＋ both open AI POV; only Run analysis may enter the Processing → Ready/Failed lifecycle.

## R27 Library visibility correction
`R27-NEWSMAP-04` proved only persistence in a clean browser. It could truthfully write a card and still hide it when Library starter mode remained active, the Analysis rail remained collapsed, or the Library Omnisearch excluded its title. Analyze must clear those conflicting presentation states, select the exact persisted ID, render its card/workspace/evidence/compose strip, yield paint, and verify that all four surfaces are visibly present before showing a success toast. Qualification must include pre-existing analyses, active starter mode, a collapsed rail, a non-matching Omnisearch query, and reload persistence.

`R27-NEWSMAP-05` exposed the deeper contract error: it reliably rendered an Analysis record whose prompt, response, and turns were all empty. Visibility is not analysis. The Analyze control must invoke the single existing AI lifecycle with a deterministic comprehensive prompt; the Library must show Processing before network work and the resulting Markdown response afterward on the same record.
