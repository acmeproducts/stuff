<!-- PRISM-PLAN v4.0.0 -->
# PRISM MASTER PLAN v4.0.0

## Governing baseline
- Canonical working baseline: `prism/prism-turn01-pre-ship.html`
- Identity: `PRISM · Turn 01 pre-ship R11`
- Blob: `5d91e005940d632b74d6dd59a9aa0ae645c40433`
- Rollback commit: `92d660c9b7f559a20012fd714edfbf21ab70b6b3`

## Clean release chain
R26 is the current standalone implementation descendant. R27 must be created from the standalone R26 source with one ordinary source diff only.

No wrapper, iframe, runtime baseline fetch, sidecar script, injected patch, DOM monkey patch, overlay architecture, alternate state machine, or worker layer is permitted.

## Frozen controls and AI POV
- three fixed-width Group / Color / Size selectors;
- three aligned filter-summary buttons opening the canonical chip chooser;
- no permanently exposed R11 filter rail;
- one selected-evidence list only;
- each selected event has source URLs under disclosure;
- provider/model/key editing remains Config-only.

## R27 Analysis lifecycle
1. `Run analysis` creates the durable Analysis ID before the provider request starts.
2. Persist the Analysis immediately to IndexedDB with `status: "processing"`, `createdAt`, and `updatedAt`.
3. The Library card appears immediately and is selectable while the network request continues asynchronously on the browser event loop. No Web Worker is used.
4. The UI remains navigable while the request is in flight; the analysis job does not depend on the AI panel remaining open or selected.
5. Success updates the same Analysis ID with Markdown response, `status: "ready"`, and new `updatedAt`.
6. Failure updates the same Analysis ID with `status: "failed"`, error text, and new `updatedAt`; the card remains.
7. Library re-reads the authoritative IndexedDB record after lifecycle writes and refreshes its projection.
8. Card hierarchy is exactly:
   - title + × delete;
   - `Created <date/time> | Updated <date/time>`;
   - `Status: Processing|Ready|Failed`.
   Turn/link counts do not appear on cards.

## R27 Library reading surface
- The Library stage fills the complete available workspace height independent of the card-list height.
- It is a true three-row grid: fixed header / `minmax(0,1fr)` independently scrolling transcript / bottom compose row.
- The compose row is pinned to the bottom of the reading surface and never follows card-stack height.
- Transcript includes the initial question/Analysis plus every later query, uploaded-context item, and AI response in chronological order with date/time stamps.
- Transcript scrolls independently; compose remains visible.
- The opened Analysis has a dedicated Omnisearch in the top-right Library detail header/ribbon, separate from Library-card Omnisearch.
- Analysis Omnisearch supports positive terms, `-negative`, `*wildcard*`, and `?` single-character matching across the selected Analysis transcript/context.
- Follow-up Research web appends to the same Analysis ID and updates `updatedAt`.

## R27 NewsMap geometry
The R26 fixed grid-row Map is rejected.

Visual/geometry reference: `IJMacD/newsmap-js` only. PRISM does not inherit that app's architecture.

Required Map behavior:
- true packed treemap rectangles with variable width and height based on weight and available area;
- dense full-height map surface rather than vertically stacked fixed-height rows;
- thin dark tile borders;
- compact white Arial/Helvetica-style text, approximately the reference 7pt base with adaptive growth for large tiles;
- line-height approximately 1.1;
- group/category color families remain muted and readable;
- text clips only when a tile is genuinely too small;
- group heading/focus behavior remains available without imposing fixed row heights;
- no artificial 92/96/104px row lattice.

## R27 delivery gate
1. Re-fetch current `main` and exact R26 blob immediately before publication.
2. Create standalone `prism/prism-turn01-pre-ship-r27.html` from that R26 source and apply only the lifecycle, Library, Analysis Omnisearch, and packed NewsMap diff described here.
3. Validate embedded JavaScript with a syntax parser.
4. Mechanically inspect that R27 contains no iframe, runtime baseline fetch, sidecar patch, wrapper bootstrap, worker, or competing Analysis persistence path.
5. Verify the diff touches only R27 plus this Plan/Graveyard governance update.
6. Publish through existing Pages and return the exact cache-busted R27 test URL.

The owner's statement `this is the next release` is explicit authorization for this R27 diff only. No subsequent forward patch is authorized without new explicit approval.