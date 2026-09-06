<!-- PRISM-PLAN v5.0.0 -->
# PRISM MASTER PLAN v5.0.0

## Governing objective
Complete PRISM R27 as one clean standalone release. R27 remains the authorized release. No R28.

## Baseline and ancestry
- Canonical historical baseline: `prism/prism-turn01-pre-ship.html`, R11 blob `5d91e005940d632b74d6dd59a9aa0ae645c40433`.
- Clean standalone donor lineage: R18/R14 blob `56ba6eb63bf27073399c471fde44164e16c3990f`.
- Clean standalone implementation baseline for this rebuild: `prism/prism-turn01-pre-ship-r26.html`, current blob `491abbbdaa8f559387c0235e4ddb89300787c491`.
- All post-R26 R27 attempts, including BUILD R27-0906A, are rejected evidence only and are not implementation ancestors.

## Frozen accepted surfaces
The following are frozen and must not regress while Library is rebuilt:
1. Map: accepted R21/R26 fixed-grid tile behavior, including group headings, focus/×, muted colors, size classes, text fitting, and tile event selection.
2. Filters: three Group/Color/Size selectors plus three aligned filter-summary controls opening the canonical chip chooser. On mobile the chooser opens directly below the tapped filter control and is viewport-capped; it is not a forced bottom sheet.
3. AI POV: one selected-evidence list, per-event source URL disclosure, Config-only provider/model/key editing.
4. Source and Config behavior.

## Surface isolation rule
Library is the only feature surface under redesign in this R27 rebuild. Library work may integrate with AI launch/persistence/navigation only through explicitly defined lifecycle boundaries. No Map geometry, filter semantics, source architecture, or AI evidence architecture may be redesigned while fixing Library.

## Library product contract
Library is a complete workspace, not a card-list adjunct.
- Persistent Library rail with one card per Analysis.
- Card hierarchy exactly: title + × delete; `Created <date/time> | Updated <date/time>`; `Status: Processing|Ready|Failed`.
- Full-height reading stage independent of card-list height.
- Reading stage is a true three-row grid: fixed header / `minmax(0,1fr)` independently scrolling transcript / pinned bottom compose row.
- Complete chronological transcript retains initial question, each AI response, every later research query/response, uploaded context, and timestamps.
- Separate Library-card Omnisearch and selected-Analysis Omnisearch.
- Selected-Analysis Omnisearch supports positive terms, `-negative`, `*wildcard*`, and `?` single-character matching.
- Follow-up research appends to the same Analysis ID and updates `updatedAt`.

## Single authoritative Analysis model
IndexedDB is the only durable Analysis authority.
- Database: `prism`.
- Store: `analyses`.
- Key path: `analysisId`.
- One normalization function.
- One durable write path and one authoritative reread path.
- No alternate shadow persistence engine or duplicate Analysis state machine.

## Required Analysis lifecycle
`Run analysis` executes exactly this lifecycle:
1. Validate provider, prompt, and selected evidence.
2. Create durable Analysis ID.
3. Persist same record to IndexedDB with `status:"processing"`, `createdAt`, and `updatedAt`.
4. Reread that exact Analysis ID from IndexedDB.
5. Enter Library through the single view controller.
6. Select the reread Analysis and render its Processing card/detail.
7. Yield a browser paint so Library ownership is visible.
8. Only then begin provider/network work.
9. Success updates the same ID with Markdown response, `status:"ready"`, and new `updatedAt`; reread and rerender.
10. Failure updates the same ID with error text, `status:"failed"`, and new `updatedAt`; reread and rerender; the card remains.

## AI execution ownership
Map/Explore/Feed do not own background Analysis status.
- After Run analysis is accepted, AI POV closes.
- The Map AI button returns to ordinary `AI POV`; it must never be the background job status indicator.
- Processing/Ready/Failed belongs to the Library card/detail for that Analysis.
- A request may continue while the user navigates elsewhere, but returning to Library rereads status from IndexedDB.

## Single view controller
Exactly one function owns application view transitions and is the only allowed writer of view chrome/state. It must own:
- `state.view`;
- active nav item;
- visible `.view`;
- Library ribbon/search behavior;
- reader closure;
- mobile portal-rail transition.
No competing direct `.on` mutation or `state.view=` mutation is allowed outside initialization and this controller.

## Mobile transition contract
Launching an Analysis on a phone must:
1. close AI POV;
2. close open event readers;
3. persist/reread Processing Analysis;
4. enter Library;
5. collapse the global portal rail if necessary so it cannot cover the Library workspace;
6. keep the Library's own rail visible;
7. select the new Processing card and show the reading stage;
8. begin provider work only after the Library has painted.

## Build identity
Every candidate has an immutable visible build ID in reserved application chrome, never floating over content. The same ID must appear in source diagnostics and the cache-busted test URL. If the visible marker does not match the handed-off build, testing stops.

## Deterministic pre-publication gates
A candidate cannot be published until all pass:
1. HTML structure intact and embedded JavaScript syntax parses.
2. Exactly one `runAI` implementation.
3. Exactly one Analysis persistence lifecycle path.
4. Exactly one authoritative view controller.
5. No competing `state.view` writes or view-class mutations.
6. No iframe, wrapper, runtime baseline fetch, sidecar patch, injected overlay architecture, Web Worker, or alternate persistence engine.
7. Processing write and authoritative reread occur before provider invocation.
8. Library selection/render and a paint occur before provider invocation.
9. Map AI button cannot display background Processing state.
10. Processing, Ready, and Failed records render with the same Analysis ID.
11. Follow-up appends to same Analysis ID.
12. Library and selected-Analysis Omnisearch pass positive, negative, `*`, and `?` cases.
13. Frozen Map/filter/AI POV/source invariants match the accepted R26 implementation except explicitly approved integration lines.
14. Reload reconstructs Ready/Failed Analysis records solely from IndexedDB.

## Browser lifecycle qualification
Before owner handoff, exercise deterministic success and failure lifecycle paths and inspect actual DOM state at each checkpoint:
- active nav;
- visible view;
- visible build ID;
- Analysis ID/status/card selection;
- transcript and compose geometry;
- Map AI button label;
- authoritative IndexedDB record.
A state where Map is active while its AI button says `Analyzing…` is an automatic failure and must never be published.

## Publication / concurrency gate
Immediately before publication:
1. fetch current `main` and target file SHAs;
2. preserve unrelated repository work;
3. publish R27 on top of then-current `main`;
4. verify resulting commit ancestry;
5. refetch `main` after write to detect races;
6. inspect the actual Pages deployment artifact and prove it contains the exact candidate blob/build marker before returning a URL.

## Owner acceptance sequence
First owner-device gate is deliberately narrow:
`Run analysis → AI POV closes → Library active → Processing card visible+selected → provider runs → same card Ready or Failed`.
If this transition fails, the identified build is rejected immediately. After it passes, validate Library selection, scrolling, composer, follow-up, Omnisearch, reload persistence, filters, and frozen Map behavior.
